import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/supabase'

// ---------------------------------------------------------------------------
// Plan limits — hardcoded rather than stored in DB.
// High enough to be functionally unlimited for any real user; low enough to
// cap a compromised or abusive account before it runs up a Supabase bill.
// ---------------------------------------------------------------------------
export const PLAN_LIMITS = {
  free: { boards: 1,   tasksPerBoard: 50   },
  pro:  { boards: 100, tasksPerBoard: 1000 },
} as const

type Plan = keyof typeof PLAN_LIMITS

export interface CapCheckResult {
  allowed: boolean
  reason?: string
  current: number
  limit: number
  type: 'board' | 'task'
}

export interface UsageStats {
  boards: number
  activeTasks: number
  archivedTasks: number
  plan: Plan
  limits: {
    boards: number
    activeTasksPerBoard: number
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getPlan(userId: string): Promise<Plan> {
  const supabase = createClientComponentClient<Database>()
  const { data } = await supabase
    .from('entitlements')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle()
  const raw = data?.plan
  return raw === 'pro' ? 'pro' : 'free'
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether a user can create another board.
 */
export async function checkBoardCap(userId: string): Promise<CapCheckResult> {
  const supabase = createClientComponentClient<Database>()
  const plan  = await getPlan(userId)
  const limit = PLAN_LIMITS[plan].boards

  const { count, error } = await supabase
    .from('boards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    return { allowed: false, reason: 'Could not count current boards', current: 0, limit, type: 'board' }
  }

  const current = count ?? 0
  const allowed = current < limit

  return {
    allowed,
    reason: allowed
      ? undefined
      : `Board limit reached (${current}/${limit}). Upgrade to Pro for more boards.`,
    current,
    limit,
    type: 'board',
  }
}

/**
 * Check whether a user can create another task on a specific board.
 */
export async function checkTaskCap(boardId: string, userId: string): Promise<CapCheckResult> {
  const supabase = createClientComponentClient<Database>()
  const plan  = await getPlan(userId)
  const limit = PLAN_LIMITS[plan].tasksPerBoard

  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('board_id', boardId)
    .eq('archived', false)

  if (error) {
    return { allowed: false, reason: 'Could not count current tasks', current: 0, limit, type: 'task' }
  }

  const current = count ?? 0
  const allowed = current < limit

  return {
    allowed,
    reason: allowed
      ? undefined
      : `Task limit reached (${current}/${limit}). Archive some tasks to make room, or upgrade to Pro.`,
    current,
    limit,
    type: 'task',
  }
}

/**
 * Get full usage statistics for display in the UI.
 * Auto-creates a free entitlement row on first call.
 */
export async function getUserUsageStats(userId: string): Promise<UsageStats | null> {
  const supabase = createClientComponentClient<Database>()

  const { data: entitlement, error } = await supabase
    .from('entitlements')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching entitlements:', error)
    return null
  }

  const plan: Plan = entitlement?.plan === 'pro' ? 'pro' : 'free'

  // Auto-create a free entitlement row on first use so all subsequent queries
  // have a row to read without needing to handle the missing case everywhere.
  if (!entitlement) {
    const { error: insertError } = await supabase
      .from('entitlements')
      .insert({ user_id: userId, plan: 'free' })
    if (insertError) {
      console.warn('Could not create default entitlement:', insertError)
    }
  }

  const limits = PLAN_LIMITS[plan]

  // Count boards
  const { count: boardCount } = await supabase
    .from('boards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Count tasks (active and archived across all boards)
  const boardsResult = await supabase
    .from('boards')
    .select('id')
    .eq('user_id', userId)
  const boardIds = boardsResult.data?.map(b => b.id) ?? []

  const { data: tasks } = await supabase
    .from('tasks')
    .select('archived')
    .in('board_id', boardIds)

  const activeTasks  = tasks?.filter(t => !t.archived).length ?? 0
  const archivedTasks = tasks?.filter(t =>  t.archived).length ?? 0

  return {
    boards: boardCount ?? 0,
    activeTasks,
    archivedTasks,
    plan,
    limits: {
      boards:             limits.boards,
      activeTasksPerBoard: limits.tasksPerBoard,
    },
  }
}

/**
 * Get per-board task usage for the UI progress bar.
 */
export async function getBoardUsage(
  boardId: string,
  userId: string,
): Promise<{ active: number; limit: number; percentage: number } | null> {
  const supabase = createClientComponentClient<Database>()
  const plan  = await getPlan(userId)
  const limit = PLAN_LIMITS[plan].tasksPerBoard

  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('board_id', boardId)
    .eq('archived', false)

  if (error) return null

  const active = count ?? 0
  return { active, limit, percentage: Math.round((active / limit) * 100) }
}

/**
 * Convenience wrapper used in some components.
 */
export async function enforceCapBeforeOperation(
  operation: 'create_board' | 'create_task',
  userId: string,
  boardId?: string,
): Promise<{ allowed: boolean; reason?: string }> {
  if (operation === 'create_board') {
    const result = await checkBoardCap(userId)
    return { allowed: result.allowed, reason: result.reason }
  }
  if (operation === 'create_task' && boardId) {
    const result = await checkTaskCap(boardId, userId)
    return { allowed: result.allowed, reason: result.reason }
  }
  return { allowed: false, reason: 'Invalid operation' }
}
