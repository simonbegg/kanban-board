'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Crown, 
  X, 
  Layout, 
  CheckCircle, 
  Archive
} from 'lucide-react'
import { getUserUsageStats, getBoardUsage, CapCheckResult } from '@/lib/cap-enforcement'
import { UsageStats } from '@/lib/cap-enforcement'

interface CapWarningProps {
  userId: string
  boardId?: string
  onDismiss?: () => void
  showUpgradeButton?: boolean
}

interface WarningState {
  type: 'board_limit' | 'task_limit' | 'archive_limit' | 'none'
  severity: 'warning' | 'critical' | 'info'
  title: string
  message: string
  action?: string
  showUpgrade: boolean
}

export function CapWarning({ 
  userId, 
  boardId, 
  onDismiss, 
  showUpgradeButton = true 
}: CapWarningProps) {
  const [warning, setWarning] = useState<WarningState | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed) return
    checkUsage()
  }, [userId, boardId, dismissed])

  const checkUsage = async () => {
    try {
      setLoading(true)
      const [userStats, boardStats] = await Promise.all([
        getUserUsageStats(userId),
        boardId ? getBoardUsage(boardId, userId) : null
      ])

      if (!userStats) return

      const warnings: WarningState[] = []

      // Check board limits - only show if at 100% (not warnings)
      const boardPercentage = (userStats.boards / userStats.limits.boards) * 100
      if (boardPercentage >= 100) {
        warnings.push({
          type: 'board_limit',
          severity: 'critical',
          title: 'Board Limit Reached',
          message: `You've used all ${userStats.limits.boards} boards on your ${userStats.plan} plan.`,
          action: 'Upgrade to Pro to create unlimited boards.',
          showUpgrade: true
        })
      }
      // Removed 80% warning to avoid constant alerts for free users

      // Check task limits (if we have board stats)
      if (boardStats) {
        const taskPercentage = (boardStats.active / boardStats.limit) * 100
        if (taskPercentage >= 100) {
          warnings.push({
            type: 'task_limit',
            severity: 'critical',
            title: 'Task Limit Reached',
            message: `This board has reached its limit of ${boardStats.limit} active tasks.`,
            action: 'Archive some tasks to make room, or upgrade to Pro.',
            showUpgrade: false
          })
        }
        // Removed 80% warning to avoid constant alerts for free users
      }

      // Check archive limits (for free users)
      if (userStats.plan === 'free') {
        const archivePercentage = (userStats.archivedTasks / userStats.limits.archivedTasks) * 100
        if (archivePercentage >= 100) {
          warnings.push({
            type: 'archive_limit',
            severity: 'critical',
            title: 'Archive Limit Reached',
            message: `You've reached the archive limit of ${userStats.limits.archivedTasks} tasks.`,
            action: 'Upgrade to Pro for unlimited archive storage.',
            showUpgrade: true
          })
        }
        // Removed 80% warning to avoid constant alerts for free users
      }

      // Show the most critical warning
      if (warnings.length > 0) {
        // Prioritize: critical > warning > board > task > archive
        const sortedWarnings = warnings.sort((a, b) => {
          if (a.severity !== b.severity) {
            return a.severity === 'critical' ? -1 : 1
          }
          const priority = { board_limit: 0, task_limit: 1, archive_limit: 2 }
          return priority[a.type] - priority[b.type]
        })
        setWarning(sortedWarnings[0])
      } else {
        setWarning(null)
      }

    } catch (error) {
      console.error('Error checking usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setWarning(null)
    onDismiss?.()
  }

  const handleUpgrade = () => {
    // This would typically open the upgrade modal
    window.location.href = '/upgrade'
  }

  if (loading || dismissed || !warning) {
    return null
  }

  const getAlertIcon = () => {
    switch (warning.type) {
      case 'board_limit':
        return <Layout className="w-4 h-4" />
      case 'task_limit':
        return <CheckCircle className="w-4 h-4" />
      case 'archive_limit':
        return <Archive className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getAlertVariant = () => {
    switch (warning.severity) {
      case 'critical':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'info':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <Alert variant={getAlertVariant()} className="relative">
      {getAlertIcon()}
      <div className="flex-1">
        <AlertTitle className="flex items-center gap-2">
          {warning.title}
          {warning.severity === 'critical' && (
            <Badge variant="destructive" className="text-xs">
              Action Required
            </Badge>
          )}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p>{warning.message}</p>
          {warning.action && (
            <p className="text-sm mt-1 font-medium">{warning.action}</p>
          )}
        </AlertDescription>
      </div>
      <div className="flex items-center gap-2">
        {showUpgradeButton && warning.showUpgrade && (
          <Button size="sm" onClick={handleUpgrade} className="gap-1">
            <Crown className="w-3 h-3" />
            Upgrade to Pro
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  )
}

/**
 * Hook to check caps before operations
 */
export function useCapEnforcement(userId: string) {
  const [isChecking, setIsChecking] = useState(false)

  const checkBoardCap = async (): Promise<CapCheckResult> => {
    setIsChecking(true)
    try {
      const result = await (await import('@/lib/cap-enforcement')).checkBoardCap(userId)
      return result
    } finally {
      setIsChecking(false)
    }
  }

  const checkTaskCap = async (boardId: string): Promise<CapCheckResult> => {
    setIsChecking(true)
    try {
      const result = await (await import('@/lib/cap-enforcement')).checkTaskCap(boardId, userId)
      return result
    } finally {
      setIsChecking(false)
    }
  }

  const enforceCap = async (
    operation: 'create_board' | 'create_task',
    boardId?: string
  ): Promise<{ allowed: boolean; reason?: string }> => {
    setIsChecking(true)
    try {
      const result = await (await import('@/lib/cap-enforcement')).enforceCapBeforeOperation(
        operation,
        userId,
        boardId
      )
      return result
    } finally {
      setIsChecking(false)
    }
  }

  return {
    isChecking,
    checkBoardCap,
    checkTaskCap,
    enforceCap
  }
}
