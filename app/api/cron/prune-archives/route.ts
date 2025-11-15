import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * Archive pruning cron job
 * POST /api/cron/prune-archives
 * Protected by CRON_SECRET (same as email job)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const CRON_SECRET = process.env.CRON_SECRET
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    
    console.log('=== ARCHIVE PRUNING JOB STARTED ===', new Date().toISOString())

    // Get all users with entitlements
    const { data: users, error: usersError } = await supabase
      .from('entitlements')
      .select('user_id, plan, archive_retention_days, archived_cap_per_user')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      console.log('No users found for archive pruning')
      return NextResponse.json({ success: true, message: 'No users to process' })
    }

    const results = []
    let totalDeleted = 0

    // Process each user
    for (const user of users) {
      try {
        console.log(`Processing user: ${user.user_id} (${user.plan})`)

        // Call the pruning function
        const { data: pruneResult, error: pruneError } = await supabase
          .rpc('prune_archives_for_user', { p_user: user.user_id })

        if (pruneError) {
          console.error(`Error pruning archives for ${user.user_id}:`, pruneError)
          results.push({
            userId: user.user_id,
            success: false,
            error: pruneError.message
          })
          continue
        }

        console.log(`Pruning result for ${user.user_id}:`, pruneResult)

        // Parse the result to get deleted count
        const resultMatch = pruneResult?.match(/Deleted (\d+) archived tasks/)
        const deletedCount = resultMatch ? parseInt(resultMatch[1]) : 0
        totalDeleted += deletedCount

        results.push({
          userId: user.user_id,
          plan: user.plan,
          success: true,
          deletedCount,
          result: pruneResult
        })

      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError)
        results.push({
          userId: user.user_id,
          success: false,
          error: (userError as Error).message
        })
      }
    }

    console.log('=== ARCHIVE PRUNING JOB COMPLETED ===', {
      usersProcessed: users.length,
      totalDeleted,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      usersProcessed: users.length,
      totalDeleted,
      results
    })

  } catch (err) {
    console.error('Error in archive pruning job:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get archive pruning statistics (Admin only)
 * GET /api/cron/prune-archives
 */
export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = user.email?.endsWith('@threelanes.app') || 
                   user.email?.endsWith('@admin.com')
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all users with archive stats
    const { data: users, error: usersError } = await supabase
      .from('entitlements')
      .select('user_id, plan')

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const stats = []
    
    for (const user of users || []) {
      const { data: archiveStats } = await supabase
        .rpc('get_archive_stats', { p_user: user.user_id })

      if (archiveStats && archiveStats.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', user.user_id)
          .single()

        stats.push({
          userId: user.user_id,
          email: profile?.email,
          fullName: profile?.full_name,
          plan: user.plan,
          ...archiveStats[0]
        })
      }
    }

    // Sort by users who need pruning most urgently
    stats.sort((a, b) => (b.older_than_retention + b.over_cap) - (a.older_than_retention + a.over_cap))

    return NextResponse.json({
      success: true,
      totalUsers: stats.length,
      usersNeedingPruning: stats.filter(s => s.older_than_retention > 0 || s.over_cap > 0).length,
      stats
    })

  } catch (err) {
    console.error('Error getting archive stats:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
