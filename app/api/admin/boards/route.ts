import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { Database } from '@/lib/supabase'

/**
 * Get all boards as admin (read-only with audit logging)
 * GET /api/admin/boards
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      logger.error('Admin boards API: Authentication failed', { error: authError })
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Verify admin status
    const adminEmails = [
      'simon@teamtwobees.com',
      'simon@threelanes.app',
      'admin@threelanes.app'
    ]
    
    const isAdmin = adminEmails.some(email => 
      user.email!.toLowerCase() === email.toLowerCase() || 
      user.email!.endsWith('@threelanes.app') || 
      user.email!.endsWith('@teamtwobees.com')
    )
    
    if (!isAdmin) {
      logger.error('Admin boards API: Unauthorized access attempt', { email: user.email })
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Create service role client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    
    // Verify service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error('SUPABASE_SERVICE_ROLE_KEY is not set!')
      return NextResponse.json({ 
        error: 'Server configuration error - service role key missing' 
      }, { status: 500 })
    }
    
    const adminClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get all boards with admin access (bypasses RLS)
    // Note: boards.title and columns.title contain the names
    const { data: boards, error } = await adminClient
      .from('boards')
      .select(`
        id,
        title,
        description,
        user_id,
        created_at,
        updated_at,
        columns (
          id,
          title,
          position,
          board_id,
          created_at,
          tasks (
            id,
            title,
            description,
            category,
            position,
            column_id,
            archived,
            created_at,
            updated_at
          )
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      logger.error('Admin boards query failed:', { error: error.message, adminEmail: user.email })
      return NextResponse.json({ 
        error: 'Failed to fetch admin boards', 
        details: error.message 
      }, { status: 500 })
    }
    
    // Log admin access using admin client
    try {
      await adminClient
        .from('admin_audit_log')
        .insert({
          admin_email: user.email,
          action: 'view_board',
          target_resource_type: 'board',
          details: { board_count: boards?.length || 0 }
        } as any)
    } catch (logError) {
      logger.warn('Failed to log admin access:', { error: logError, adminEmail: user.email })
    }
    
    // Transform data: map title -> name for frontend compatibility
    const transformedBoards = boards?.map((board: any) => ({
      ...board,
      name: board.title, // Map title to name
      columns: (board.columns || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((column: any) => ({
          ...column,
          name: column.title, // Map title to name
          tasks: (column.tasks || [])
            .filter((task: any) => !task.archived)
            .sort((a: any, b: any) => a.position - b.position)
        }))
    })) || []
    
    logger.info('Admin boards accessed', { 
      adminEmail: user.email, 
      boardCount: transformedBoards.length
    })
    
    return NextResponse.json({ 
      boards: transformedBoards,
      admin: user.email,
      accessType: 'read_only',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    logger.error('Admin boards API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch admin boards',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
