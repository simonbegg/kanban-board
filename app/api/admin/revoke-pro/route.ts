import { NextResponse, NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'

/**
 * Revoke Pro plan from a user (Admin only)
 * POST /api/admin/revoke-pro
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify requester is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simple admin check (replace with your actual admin logic)
    const isAdmin = user.email?.toLowerCase() === 'simon@teamtwobees.com' ||
                   user.email?.toLowerCase() === 'simon@threelanes.app' ||
                   user.email?.endsWith('@threelanes.app') ||
                   user.email?.endsWith('@teamtwobees.com')
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user would exceed free plan limits
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id')
      .eq('user_id', userId)

    if (boardsError) {
      console.error('Error checking boards:', boardsError)
      return NextResponse.json({ error: 'Failed to check user boards' }, { status: 500 })
    }

    // If user has more than 1 board, they can't be downgraded
    if (boards && boards.length > 1) {
      return NextResponse.json({ 
        error: 'Cannot revoke Pro: User has more than 1 board. Delete extra boards first.',
        currentBoards: boards.length 
      }, { status: 409 })
    }

    // Revoke to free plan
    const { data, error } = await supabase
      .from('entitlements')
      .upsert({
        user_id: userId,
        plan: 'free',
        board_cap: 1,
        active_cap_per_board: 100,
        archive_retention_days: 90,
        archived_cap_per_user: 1000,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error revoking Pro:', error)
      return NextResponse.json({ error: 'Failed to revoke Pro plan' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Pro plan revoked successfully',
      entitlements: data
    })

  } catch (err) {
    console.error('Error in revoke-pro:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
