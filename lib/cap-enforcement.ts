import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/supabase'

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
  plan: 'free' | 'pro'
  limits: {
    boards: number
    activeTasksPerBoard: number
    archivedTasks: number
  }
}

/**
 * Check if user can create a new board
 */
export async function checkBoardCap(
  userId: string
): Promise<CapCheckResult> {
  const supabase = createClientComponentClient<Database>()

  // Get user's entitlements
  const { data: entitlements, error: entitlementError } = await supabase
    .from('entitlements')
    .select('board_cap, plan')
    .eq('user_id', userId)
    .single()

  if (entitlementError || !entitlements) {
    return {
      allowed: false,
      reason: 'Could not verify user entitlements',
      current: 0,
      limit: 0,
      type: 'board'
    }
  }

  // Count current boards
  const { count, error: countError } = await supabase
    .from('boards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    return {
      allowed: false,
      reason: 'Could not count current boards',
      current: 0,
      limit: entitlements.board_cap,
      type: 'board'
    }
  }

  const currentBoards = count || 0
  const canCreate = currentBoards < entitlements.board_cap

  return {
    allowed: canCreate,
    reason: canCreate ? undefined : `Board limit reached (${currentBoards}/${entitlements.board_cap}). Upgrade to Pro for more boards.`,
    current: currentBoards,
    limit: entitlements.board_cap,
    type: 'board'
  }
}

/**
 * Check if user can create a new task on a specific board
 */
export async function checkTaskCap(
  boardId: string,
  userId: string
): Promise<CapCheckResult> {
  const supabase = createClientComponentClient<Database>()

  // Get user's entitlements
  const { data: entitlements, error: entitlementError } = await supabase
    .from('entitlements')
    .select('active_cap_per_board, plan')
    .eq('user_id', userId)
    .single()

  if (entitlementError || !entitlements) {
    return {
      allowed: false,
      reason: 'Could not verify user entitlements',
      current: 0,
      limit: 0,
      type: 'task'
    }
  }

  // Count active tasks on this board
  const { count, error: countError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('board_id', boardId)
    .eq('archived', false)

  if (countError) {
    return {
      allowed: false,
      reason: 'Could not count current tasks',
      current: 0,
      limit: entitlements.active_cap_per_board,
      type: 'task'
    }
  }

  const currentTasks = count || 0
  const canCreate = currentTasks < entitlements.active_cap_per_board

  return {
    allowed: canCreate,
    reason: canCreate ? undefined : `Task limit reached for this board (${currentTasks}/${entitlements.active_cap_per_board}). Archive some tasks to make room.`,
    current: currentTasks,
    limit: entitlements.active_cap_per_board,
    type: 'task'
  }
}

/**
 * Get comprehensive usage statistics for a user
 */
export async function getUserUsageStats(
  userId: string
): Promise<UsageStats | null> {
  const supabase = createClientComponentClient<Database>()

  // Get entitlements - use maybeSingle() instead of single() to handle missing records
  const { data: entitlements, error: entitlementError } = await supabase
    .from('entitlements')
    .select('plan, board_cap, active_cap_per_board, archived_cap_per_user')
    .eq('user_id', userId)
    .maybeSingle()

  // If no entitlements exist, create default Free plan entitlements
  if (!entitlements) {
    console.log('No entitlements found for user, creating default Free plan')
    
    const { data: newEntitlements, error: createError } = await supabase
      .from('entitlements')
      .insert({
        user_id: userId,
        plan: 'free',
        board_cap: 1,
        active_cap_per_board: 100,
        archived_cap_per_user: 1000
      })
      .select('plan, board_cap, active_cap_per_board, archived_cap_per_user')
      .single()

    if (createError || !newEntitlements) {
      console.error('Failed to create default entitlements:', createError)
      return null
    }

    // Use the newly created entitlements
    return await calculateUsageStats(userId, newEntitlements)
  }

  if (entitlementError) {
    console.error('Error fetching entitlements:', entitlementError)
    return null
  }

  // Use existing entitlements
  return await calculateUsageStats(userId, entitlements)
}

/**
 * Helper function to calculate usage statistics given entitlements
 */
async function calculateUsageStats(
  userId: string, 
  entitlements: any
): Promise<UsageStats | null> {
  const supabase = createClientComponentClient<Database>()

  // Count boards
  const { count: boardCount } = await supabase
    .from('boards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Count tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('archived')
    .in('board_id', 
      (await supabase.from('boards').select('id').eq('user_id', userId)).data?.map(b => b.id) || []
    )

  const activeTasks = tasks?.filter(t => !t.archived).length || 0
  const archivedTasks = tasks?.filter(t => t.archived).length || 0

  return {
    boards: boardCount || 0,
    activeTasks,
    archivedTasks,
    plan: entitlements.plan as 'free' | 'pro',
    limits: {
      boards: entitlements.board_cap,
      activeTasksPerBoard: entitlements.active_cap_per_board,
      archivedTasks: entitlements.archived_cap_per_user
    }
  }
}

/**
 * Middleware function to enforce caps before database operations
 */
export async function enforceCapBeforeOperation(
  operation: 'create_board' | 'create_task',
  userId: string,
  boardId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (operation === 'create_board') {
    const result = await checkBoardCap(userId)
    return { allowed: result.allowed, reason: result.reason }
  } else if (operation === 'create_task' && boardId) {
    const result = await checkTaskCap(boardId, userId)
    return { allowed: result.allowed, reason: result.reason }
  }

  return { allowed: false, reason: 'Invalid operation' }
}

/**
 * Get board-specific usage for UI display
 */
export async function getBoardUsage(
  boardId: string,
  userId: string
): Promise<{ active: number; limit: number; percentage: number } | null> {
  const supabase = createClientComponentClient<Database>()

  // Get user's task cap
  const { data: entitlements, error: entitlementError } = await supabase
    .from('entitlements')
    .select('active_cap_per_board')
    .eq('user_id', userId)
    .single()

  if (entitlementError || !entitlements) {
    return null
  }

  // Count active tasks on this board
  const { count, error: countError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('board_id', boardId)
    .eq('archived', false)

  if (countError) {
    return null
  }

  const activeTasks = count || 0
  const percentage = (activeTasks / entitlements.active_cap_per_board) * 100

  return {
    active: activeTasks,
    limit: entitlements.active_cap_per_board,
    percentage: Math.round(percentage)
  }
}
