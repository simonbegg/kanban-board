import { createClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

/**
 * Calculate courtesy period end date (14 days after effective date)
 */
export function calculateCourtesyEnd(effectiveDate: Date): Date {
  const courtesyEnd = new Date(effectiveDate)
  courtesyEnd.setDate(courtesyEnd.getDate() + 14)
  return courtesyEnd
}

/**
 * Log a subscription event to the audit trail
 */
export async function logSubscriptionEvent(
  userId: string,
  eventType: string,
  eventData: any,
  createdBy?: string
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
      created_by: createdBy || null
    })
  
  if (error) {
    console.error('Error logging subscription event:', error)
    // Don't throw - logging failure shouldn't break the main flow
  }
}

/**
 * Check if user is eligible for immediate cancellation
 * (within 30 days of Pro upgrade)
 */
export function isEligibleForImmediateCancel(
  proUpgradedAt: Date,
  currentPeriodEnd: Date
): boolean {
  const daysSinceUpgrade = Math.floor(
    (Date.now() - proUpgradedAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  // Allow immediate cancel if:
  // 1. Within 30 days of Pro upgrade, OR
  // 2. Less than 7 days until period end (might as well cancel now)
  const daysUntilPeriodEnd = Math.floor(
    (currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  
  return daysSinceUpgrade <= 30 || daysUntilPeriodEnd <= 7
}

/**
 * Get user's current entitlements
 */
export async function getUserEntitlements(userId: string, supabase?: SupabaseClient<Database>) {
  const client = supabase || createClient()
  
  const { data, error } = await client
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching entitlements:', error)
    throw error
  }
  
  // If no entitlements exist, return default Free plan
  if (!data) {
    console.warn('No entitlements found for user:', userId, '- returning default Free plan')
    return {
      user_id: userId,
      plan: 'free' as const,
      status: 'active',
      board_cap: 1,
      active_cap_per_board: 100,
      archive_retention_days: 90,
      archived_cap_per_user: 1000,
      cancel_at_period_end: false,
      cancel_effective_at: null,
      current_period_end: null,
      courtesy_until: null,
      enforcement_state: 'none',
      primary_board_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
  
  return data
}

/**
 * Calculate user's current usage stats
 */
export async function calculateUserUsage(userId: string, supabase?: SupabaseClient<Database>) {
  const client = supabase || createClient()
  
  // Get all boards
  const { data: boards, error: boardsError } = await client
    .from('boards')
    .select('id')
    .eq('user_id', userId)
  
  if (boardsError) throw boardsError
  
  const boardIds = boards?.map(b => b.id) || []
  
  if (boardIds.length === 0) {
    return {
      boardCount: 0,
      activeTaskCount: 0,
      archivedTaskCount: 0
    }
  }
  
  // Get all tasks
  const { data: tasks, error: tasksError } = await client
    .from('tasks')
    .select('archived')
    .in('board_id', boardIds)
  
  if (tasksError) throw tasksError
  
  const activeTasks = tasks?.filter(t => !t.archived).length || 0
  const archivedTasks = tasks?.filter(t => t.archived).length || 0
  
  return {
    boardCount: boards?.length || 0,
    activeTaskCount: activeTasks,
    archivedTaskCount: archivedTasks
  }
}

/**
 * Check if user is within Free plan limits
 */
export function isWithinFreeLimits(usage: {
  boardCount: number
  activeTaskCount: number
  archivedTaskCount: number
}): boolean {
  return (
    usage.boardCount <= 1 &&
    usage.activeTaskCount <= 100 &&
    usage.archivedTaskCount <= 1000
  )
}

/**
 * Format date for email/UI display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}
