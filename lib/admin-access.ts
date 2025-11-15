import { createClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface AdminAccessOptions {
  action: 'view_board' | 'view_task' | 'modify_board' | 'modify_task'
  targetUserId?: string
  resourceType?: 'board' | 'task' | 'column'
  resourceId?: string
  details?: Record<string, any>
}

/**
 * Secure admin access with audit logging
 * Only allows admin access and logs every action
 */
export async function withAdminAccess<T>(
  adminEmail: string,
  options: AdminAccessOptions,
  callback: () => Promise<T>
): Promise<T> {
  // Verify admin status
  const adminEmails = [
    'simon@teamtwobees.com',
    'simon@threelanes.app',
    'admin@threelanes.app'
  ]
  
  const isAdmin = adminEmails.some(email => 
    adminEmail.toLowerCase() === email.toLowerCase() || 
    adminEmail.endsWith('@threelanes.app') || 
    adminEmail.endsWith('@teamtwobees.com')
  )
  
  if (!isAdmin) {
    logger.error('Unauthorized admin access attempt', { adminEmail, options })
    throw new Error('Admin access required')
  }
  
  // Log the admin access
  try {
    const supabase = createClient()
    await supabase
      .from('admin_audit_log')
      .insert({
        admin_email: adminEmail,
        action: options.action,
        target_user_id: options.targetUserId,
        target_resource_type: options.resourceType,
        target_resource_id: options.resourceId,
        details: options.details
      })
    
    logger.info('Admin access logged', { adminEmail, options })
  } catch (error) {
    logger.error('Failed to log admin access', { error, adminEmail, options })
    // Continue with the operation even if logging fails
  }
  
  // Execute the callback
  return await callback()
}

/**
 * Get boards with admin access logging
 */
export async function getBoardsWithAdminAccess(adminEmail: string) {
  return withAdminAccess(adminEmail, {
    action: 'view_board',
    resourceType: 'board'
  }, async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('boards')
      .select(`
        *,
        columns (
          *,
          tasks (*)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  })
}
