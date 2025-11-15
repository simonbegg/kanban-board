'use client'

import { useState, useCallback } from 'react'
import { useCapEnforcement } from '@/components/cap-warning'
import { formatErrorForDisplay } from '@/lib/error-mapping'

interface UseCapEnforcementOptions {
  userId: string
  onCapExceeded?: (error: { title: string; message: string; action?: string }) => void
  showUpgradeModal?: () => void
}

/**
 * Hook for integrating cap enforcement into components
 * Provides methods to check caps before operations and handle violations
 */
export function useCapEnforcementIntegration({
  userId,
  onCapExceeded,
  showUpgradeModal
}: UseCapEnforcementOptions) {
  const { isChecking, checkBoardCap, checkTaskCap, enforceCap } = useCapEnforcement(userId)
  const [lastError, setLastError] = useState<{ title: string; message: string; action?: string } | null>(null)

  const handleCapError = useCallback((error: any) => {
    const formatted = formatErrorForDisplay(error)
    setLastError(formatted)
    
    // Call custom error handler
    onCapExceeded?.(formatted)
    
    // Show upgrade modal if needed
    if (formatted.showUpgradeButton && showUpgradeModal) {
      showUpgradeModal()
    }
    
    return formatted
  }, [onCapExceeded, showUpgradeModal])

  const createBoardWithCapCheck = useCallback(async (createBoardFn: () => Promise<any>) => {
    try {
      // Check if user can create a board
      const boardCheck = await checkBoardCap()
      if (!boardCheck.allowed) {
        const error = new Error(boardCheck.reason)
        throw error
      }

      // Proceed with board creation
      return await createBoardFn()
      
    } catch (error) {
      const formatted = handleCapError(error)
      throw formatted
    }
  }, [checkBoardCap, handleCapError])

  const createTaskWithCapCheck = useCallback(async (boardId: string, createTaskFn: () => Promise<any>) => {
    try {
      // Check if user can create a task on this board
      const taskCheck = await checkTaskCap(boardId)
      if (!taskCheck.allowed) {
        const error = new Error(taskCheck.reason)
        throw error
      }

      // Proceed with task creation
      return await createTaskFn()
      
    } catch (error) {
      const formatted = handleCapError(error)
      throw formatted
    }
  }, [checkTaskCap, handleCapError])

  const enforceOperationLimit = useCallback(async (
    operation: 'create_board' | 'create_task',
    operationFn: () => Promise<any>,
    boardId?: string
  ) => {
    try {
      // Check cap enforcement
      const check = await enforceCap(operation, boardId)
      if (!check.allowed) {
        const error = new Error(check.reason)
        throw error
      }

      // Proceed with operation
      return await operationFn()
      
    } catch (error) {
      const formatted = handleCapError(error)
      throw formatted
    }
  }, [enforceCap, handleCapError])

  const clearError = useCallback(() => {
    setLastError(null)
  }, [])

  return {
    isChecking,
    lastError,
    clearError,
    createBoardWithCapCheck,
    createTaskWithCapCheck,
    enforceOperationLimit,
    checkBoardCap,
    checkTaskCap
  }
}

/**
 * Higher-order component for wrapping existing components with cap enforcement
 */
export function withCapEnforcement<P extends object>(
  Component: React.ComponentType<P>,
  capCheck: (props: P) => Promise<{ allowed: boolean; reason?: string }>
) {
  return function CapEnforcedComponent(props: P) {
    const [isChecking, setIsChecking] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleClick = async (event: React.MouseEvent) => {
      try {
        setIsChecking(true)
        setError(null)
        
        const check = await capCheck(props)
        if (!check.allowed) {
          setError(check.reason || 'Operation not allowed')
          return
        }

        // If cap check passes, call original onClick if it exists
        const originalOnClick = (props as any).onClick
        if (originalOnClick) {
          originalOnClick(event)
        }
        
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setIsChecking(false)
      }
    }

    return (
      <div>
        <Component 
          {...props} 
          onClick={handleClick}
          disabled={isChecking || (props as any).disabled}
        />
        {error && (
          <div className="text-sm text-destructive mt-1">
            {error}
          </div>
        )}
      </div>
    )
  }
}

/**
 * Hook for real-time usage monitoring
 */
export function useUsageMonitor(userId: string, boardId?: string) {
  const [usage, setUsage] = useState<{
    boards: number
    tasks: number
    boardUsage?: { active: number; limit: number; percentage: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUsage = useCallback(async () => {
    try {
      setLoading(true)
      const [userStats, boardStats] = await Promise.all([
        import('@/lib/cap-enforcement').then(m => m.getUserUsageStats(userId)),
        boardId ? import('@/lib/cap-enforcement').then(m => m.getBoardUsage(boardId, userId)) : null
      ])

      if (userStats) {
        setUsage({
          boards: userStats.boards,
          tasks: userStats.activeTasks,
          boardUsage: boardStats || undefined
        })
      }
    } catch (error) {
      console.error('Error refreshing usage:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, boardId])

  // Auto-refresh every 30 seconds
  useState(() => {
    const interval = setInterval(refreshUsage, 30000)
    return () => clearInterval(interval)
  })

  return {
    usage,
    loading,
    refreshUsage
  }
}
