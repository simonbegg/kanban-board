'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Crown,
  Archive,
  Layout,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { getUserUsageStats, getBoardUsage } from '@/lib/cap-enforcement'
import { UsageStats } from '@/lib/cap-enforcement'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface UsageMeterProps {
  userId: string
  boardId?: string
  compact?: boolean
  showUpgradeButton?: boolean
  onResolveClick?: () => void
}

export function UsageMeter({
  userId,
  boardId,
  compact = false,
  showUpgradeButton = true,
  onResolveClick
}: UsageMeterProps) {
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [boardUsage, setBoardUsage] = useState<{ active: number; limit: number; percentage: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [entitlements, setEntitlements] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadUsageStats()
  }, [userId, boardId])

  const loadUsageStats = async () => {
    try {
      setLoading(true)
      const [userStats, boardStats] = await Promise.all([
        getUserUsageStats(userId),
        boardId ? getBoardUsage(boardId, userId) : null
      ])

      setUsage(userStats)
      setBoardUsage(boardStats)
    } catch (error) {
      console.error('Error loading usage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <UsageMeterSkeleton compact={compact} />
  }

  if (!usage) {
    return null
  }

  const isPro = usage.plan === 'pro'
  const boardPercentage = (usage.boards / usage.limits.boards) * 100
  const boardStatus = getUsageStatus(boardPercentage)
  const taskStatus = boardUsage ? getUsageStatus(boardUsage.percentage) : null

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={isPro ? 'default' : 'secondary'} className="gap-1">
          {isPro ? <Crown className="w-3 h-3" /> : null}
          {isPro ? 'Pro' : 'Free'}
        </Badge>
        <span className="text-muted-foreground">
          {usage.boards}/{usage.limits.boards} boards
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {usage.activeTasks}/{usage.limits.activeTasksPerBoard} tasks
        </span>
        {taskStatus && taskStatus.type !== 'normal' && (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Plan Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPro ? (
                <Crown className="w-5 h-5 text-yellow-500" />
              ) : (
                <Layout className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <h3 className="font-semibold">
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isPro ? 'Unlimited boards & advanced features' : 'Basic features with limits'}
                </p>
              </div>
            </div>
            {showUpgradeButton && !isPro && (
              <Button onClick={() => window.location.href = '/upgrade'}>
                Upgrade to Pro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Board Usage */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                <span className="font-medium">Boards</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {usage.boards}/{usage.limits.boards}
                </span>
                {boardStatus.icon}
              </div>
            </div>
            <Progress
              value={boardPercentage}
              className="h-2"
              // @ts-ignore
              style={
                boardStatus.type === 'critical' ? { '--progress-background': 'hsl(var(--destructive))' } :
                  boardStatus.type === 'warning' ? { '--progress-background': 'hsl(var(--chart-2))' } : {}
              }
            />
            {boardStatus.type !== 'normal' && (
              <p className="text-sm text-muted-foreground">
                {boardStatus.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Usage (per board) */}
      {boardUsage && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Active Tasks (This Board)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {boardUsage.active}/{boardUsage.limit}
                  </span>
                  {taskStatus?.icon}
                </div>
              </div>
              <Progress
                value={boardUsage.percentage}
                className="h-2"
                // @ts-ignore
                style={
                  taskStatus?.type === 'critical' ? { '--progress-background': 'hsl(var(--destructive))' } :
                    taskStatus?.type === 'warning' ? { '--progress-background': 'hsl(var(--chart-2))' } : {}
                }
              />
              {taskStatus && taskStatus.type !== 'normal' && (
                <p className="text-sm text-muted-foreground">
                  {taskStatus.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archive Usage */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                <span className="font-medium">Archived Tasks</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usage.archivedTasks}
                {!isPro && `/${usage.limits.archivedTasks}`}
              </span>
            </div>
            {!isPro && (
              <div className="text-sm text-muted-foreground">
                <p>Archived tasks are kept for 90 days (Free plan)</p>
                <p>Pro users get unlimited archive storage</p>
              </div>
            )}
            {isPro && (
              <div className="text-sm text-muted-foreground">
                <p>Unlimited archive storage (Pro plan)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getUsageStatus(percentage: number): {
  type: 'normal' | 'warning' | 'critical'
  icon: React.ReactNode
  message: string
} {
  if (percentage >= 95) {
    return {
      type: 'critical',
      icon: <XCircle className="w-4 h-4 text-destructive" />,
      message: 'You\'ve almost reached your limit. Upgrade to Pro for more space.'
    }
  }

  if (percentage >= 80) {
    return {
      type: 'warning',
      icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      message: 'You\'re getting close to your limit. Consider upgrading to Pro.'
    }
  }

  return {
    type: 'normal',
    icon: null,
    message: ''
  }
}

function UsageMeterSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-12 h-5 bg-muted rounded animate-pulse" />
        <div className="w-16 h-4 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                  <div className="w-20 h-4 bg-muted rounded animate-pulse" />
                </div>
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
              </div>
              <div className="w-full h-2 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
