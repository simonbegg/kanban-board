/**
 * Error mapping utilities for Free vs Pro gating
 * Converts database errors and cap violations into user-friendly messages
 */

export interface CapError {
  type: 'board_limit' | 'task_limit' | 'archive_limit' | 'general'
  message: string
  action?: string
  upgradeRequired?: boolean
}

/**
 * Map database errors to user-friendly cap error messages
 */
export function mapErrorToCapMessage(error: any): CapError | null {
  const message = error?.message || error?.toString() || ''
  
  // Board limit errors
  if (message.includes('new row violates row level security policy') || 
      message.includes('within_board_cap') ||
      message.includes('board_cap')) {
    return {
      type: 'board_limit',
      message: 'You\'ve reached your board limit.',
      action: 'Upgrade to Pro to create unlimited boards.',
      upgradeRequired: true
    }
  }

  // Task limit errors (will be caught by application layer)
  if (message.includes('task_limit') || 
      message.includes('active_cap_per_board') ||
      message.includes('Task limit reached')) {
    return {
      type: 'task_limit',
      message: 'This board has reached its task limit.',
      action: 'Archive some tasks to make room, or upgrade to Pro for higher limits.',
      upgradeRequired: false
    }
  }

  // Archive limit errors
  if (message.includes('archive_limit') ||
      message.includes('archived_cap_per_user')) {
    return {
      type: 'archive_limit',
      message: 'You\'ve reached your archive storage limit.',
      action: 'Upgrade to Pro for unlimited archive storage.',
      upgradeRequired: true
    }
  }

  // Permission errors
  if (message.includes('permission denied') ||
      message.includes('unauthorized') ||
      message.includes('auth.uid')) {
    return {
      type: 'general',
      message: 'You don\'t have permission to perform this action.',
      action: 'Please log in and try again.',
      upgradeRequired: false
    }
  }

  return null
}

/**
 * Get upgrade message based on error type
 */
export function getUpgradeMessage(errorType: CapError['type']): string {
  switch (errorType) {
    case 'board_limit':
      return 'Upgrade to Pro to create unlimited boards and unlock advanced features.'
    
    case 'task_limit':
      return 'Pro users get higher task limits and priority support.'
    
    case 'archive_limit':
      return 'Pro users get unlimited archive storage and never lose their work.'
    
    default:
      return 'Upgrade to Pro for the best ThreeLanes experience.'
  }
}

/**
 * Check if error suggests user should upgrade
 */
export function shouldUpgradeToPro(error: any): boolean {
  const capError = mapErrorToCapMessage(error)
  return capError?.upgradeRequired || false
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: any): {
  title: string
  message: string
  action?: string
  showUpgradeButton: boolean
} {
  const capError = mapErrorToCapMessage(error)
  
  if (capError) {
    return {
      title: capError.type === 'board_limit' ? 'Board Limit Reached' :
             capError.type === 'task_limit' ? 'Task Limit Reached' :
             capError.type === 'archive_limit' ? 'Archive Limit Reached' :
             'Access Denied',
      message: capError.message,
      action: capError.action,
      showUpgradeButton: capError.upgradeRequired || false
    }
  }

  // Default error formatting
  return {
    title: 'Something went wrong',
    message: 'Please try again or contact support if the problem persists.',
    showUpgradeButton: false
  }
}

/**
 * Get suggested actions based on current usage
 */
export function getSuggestedActions(usage: {
  boards: number
  activeTasks: number
  plan: 'free' | 'pro'
  limits: { boards: number; activeTasksPerBoard: number }
}): Array<{
  type: 'warning' | 'info' | 'upgrade'
  title: string
  description: string
  priority: number
}> {
  const actions = []
  
  if (usage.plan === 'free') {
    // Board limit warnings
    const boardPercentage = (usage.boards / usage.limits.boards) * 100
    if (boardPercentage >= 100) {
      actions.push({
        type: 'upgrade' as const,
        title: 'Board Limit Reached',
        description: 'You\'ve used all your free boards. Upgrade to Pro for unlimited boards.',
        priority: 1
      })
    } else if (boardPercentage >= 80) {
      actions.push({
        type: 'warning' as const,
        title: 'Board Limit Warning',
        description: `You're using ${usage.boards} of ${usage.limits.boards} free boards.`,
        priority: 2
      })
    }

    // Task limit warnings (assuming worst case - all tasks on one board)
    const taskPercentage = (usage.activeTasks / usage.limits.activeTasksPerBoard) * 100
    if (taskPercentage >= 80) {
      actions.push({
        type: 'info' as const,
        title: 'Task Management Tip',
        description: 'Consider archiving completed tasks to stay organized.',
        priority: 3
      })
    }
  }

  return actions.sort((a, b) => a.priority - b.priority)
}

/**
 * Create a user-friendly error response for API calls
 */
export function createErrorResponse(error: any, context: string = '') {
  const capError = mapErrorToCapMessage(error)
  
  if (capError) {
    return {
      error: capError.message,
      type: capError.type,
      upgradeRequired: capError.upgradeRequired,
      action: capError.action,
      context
    }
  }

  return {
    error: 'An unexpected error occurred',
    type: 'general',
    context
  }
}
