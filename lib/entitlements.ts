import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/supabase'

export type UserPlan = 'free' | 'pro'
export type UserEntitlement = Database['public']['Tables']['entitlements']['Row']

export interface UserUsage {
  board_count: number
  total_active_tasks: number
  total_archived_tasks: number
  plan: UserPlan
}

export interface BoardUsage {
  active_tasks: number
  archived_tasks: number
  user_plan: UserPlan
  active_cap: number
}

export interface CapStatus {
  is_within_cap: boolean
  current: number
  cap: number
  percentage: number
  warning_level?: 'normal' | 'warning' | 'critical'
}

/**
 * Get user's current plan and entitlements
 */
export async function getUserEntitlement(
  userId: string
): Promise<UserEntitlement | null> {
  const supabase = createClientComponentClient<Database>()

  const { data, error } = await supabase
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user entitlements:', error)
    return null
  }

  return data
}

/**
 * Get current usage statistics for a user
 */
export async function getUserUsage(
  userId: string
): Promise<UserUsage | null> {
  const supabase = createClientComponentClient<Database>()

  const { data, error } = await supabase
    .rpc('get_user_usage', { p_user: userId })

  if (error) {
    console.error('Error fetching user usage:', error)
    return null
  }

  return data?.[0] || null
}

/**
 * Get usage statistics for a specific board
 */
export async function getBoardUsage(
  boardId: string
): Promise<BoardUsage | null> {
  const supabase = createClientComponentClient<Database>()

  const { data, error } = await supabase
    .rpc('get_board_usage', { p_board: boardId })

  if (error) {
    console.error('Error fetching board usage:', error)
    return null
  }

  return data?.[0] || null
}

/**
 * Check if user can create more boards
 */
export async function isWithinBoardCap(
  userId: string
): Promise<boolean> {
  const supabase = createClientComponentClient<Database>()

  const { data, error } = await supabase
    .rpc('within_board_cap', { p_user: userId })

  if (error) {
    console.error('Error checking board cap:', error)
    return false
  }

  return data || false
}

/**
 * Check if board can have more active tasks
 */
export async function isWithinActivePerBoardCap(
  boardId: string
): Promise<boolean> {
  const supabase = createClientComponentClient<Database>()

  const { data, error } = await supabase
    .rpc('within_active_per_board_cap', { p_board: boardId })

  if (error) {
    console.error('Error checking task cap:', error)
    return false
  }

  return data || false
}

/**
 * Get board cap status with warning levels
 */
export async function getBoardCapStatus(
  boardId: string,
  serverClient = false
): Promise<CapStatus | null> {
  const usage = await getBoardUsage(boardId, serverClient)
  
  if (!usage) return null

  const percentage = (usage.active_tasks / usage.active_cap) * 100
  let warning_level: CapStatus['warning_level'] = 'normal'

  if (percentage >= 95) {
    warning_level = 'critical'
  } else if (percentage >= 80) {
    warning_level = 'warning'
  }

  return {
    is_within_cap: usage.active_tasks < usage.active_cap,
    current: usage.active_tasks,
    cap: usage.active_cap,
    percentage,
    warning_level
  }
}

/**
 * Get user board cap status with warning levels
 */
export async function getUserBoardCapStatus(
  userId: string,
  serverClient = false
): Promise<CapStatus | null> {
  const entitlements = await getUserEntitlements(userId, serverClient)
  const usage = await getUserUsage(userId, serverClient)
  
  if (!entitlements || !usage) return null

  const percentage = (usage.board_count / entitlements.board_cap) * 100
  let warning_level: CapStatus['warning_level'] = 'normal'

  if (percentage >= 95) {
    warning_level = 'critical'
  } else if (percentage >= 80) {
    warning_level = 'warning'
  }

  return {
    is_within_cap: usage.board_count < entitlements.board_cap,
    current: usage.board_count,
    cap: entitlements.board_cap,
    percentage,
    warning_level
  }
}

/**
 * Check if user is on Pro plan
 */
export async function isUserPro(
  userId: string,
  serverClient = false
): Promise<boolean> {
  const entitlements = await getUserEntitlements(userId, serverClient)
  return entitlements?.plan === 'pro' || false
}

/**
 * Get plan limits for display
 */
export function getPlanLimits(plan: UserPlan) {
  if (plan === 'pro') {
    return {
      boards: 500,
      activeTasksPerBoard: 100,
      archiveRetentionDays: 36500, // ~100 years = indefinite
      archivedCap: 200000
    }
  }

  return {
    boards: 1,
    activeTasksPerBoard: 100,
    archiveRetentionDays: 90,
    archivedCap: 1000
  }
}
