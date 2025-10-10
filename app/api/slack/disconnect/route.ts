import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { disconnectSlack } from '@/lib/slack'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    await disconnectSlack(user.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error disconnecting Slack:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
