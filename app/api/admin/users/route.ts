import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/lib/admin'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET(request: NextRequest) {
  // Verify the caller is authenticated and is an admin
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Fetch all profiles (created on signup via DB trigger)
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })

  if (profilesError) {
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ users: [] })
  }

  const userIds = profiles.map(p => p.id)

  // Fetch entitlements, board counts, and task counts in parallel
  const [entitlementsResult, boardsResult] = await Promise.all([
    admin
      .from('entitlements')
      .select('user_id, plan, paddle_subscription_id, updated_at')
      .in('user_id', userIds),
    admin
      .from('boards')
      .select('id, user_id')
      .in('user_id', userIds),
  ])

  const entitlementsMap = new Map(
    (entitlementsResult.data ?? []).map(e => [e.user_id, e]),
  )
  const boardIds = (boardsResult.data ?? []).map(b => b.id)
  const boardCountMap = new Map<string, number>()
  for (const board of boardsResult.data ?? []) {
    boardCountMap.set(board.user_id, (boardCountMap.get(board.user_id) ?? 0) + 1)
  }

  // Fetch active task counts across all boards
  const { data: tasks } = boardIds.length > 0
    ? await admin
        .from('tasks')
        .select('board_id')
        .in('board_id', boardIds)
        .eq('archived', false)
    : { data: [] }

  // Map board_id → user_id so we can sum tasks per user
  const boardToUser = new Map(
    (boardsResult.data ?? []).map(b => [b.id, b.user_id]),
  )
  const taskCountMap = new Map<string, number>()
  for (const task of tasks ?? []) {
    const uid = boardToUser.get(task.board_id)
    if (uid) taskCountMap.set(uid, (taskCountMap.get(uid) ?? 0) + 1)
  }

  const users = profiles.map(profile => ({
    id: profile.id,
    email: profile.email,
    joined: profile.created_at,
    plan: entitlementsMap.get(profile.id)?.plan ?? 'free',
    paddle_subscription_id: entitlementsMap.get(profile.id)?.paddle_subscription_id ?? null,
    boards: boardCountMap.get(profile.id) ?? 0,
    active_tasks: taskCountMap.get(profile.id) ?? 0,
  }))

  return NextResponse.json({ users })
}
