'use client'

import { useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Crown, Lock } from 'lucide-react'
import { getUserUsageStats } from '@/lib/cap-enforcement'

interface UpgradeGuardProps {
  userId: string
  action: 'create_board' | 'create_task'
  onConfirm?: () => void
  onCancel?: () => void
  children: ({ canPerform }: { canPerform: boolean }) => React.ReactNode
}

export function UpgradeGuard({ 
  userId, 
  action, 
  onConfirm, 
  onCancel, 
  children 
}: UpgradeGuardProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [canPerform, setCanPerform] = useState(true)

  const checkCanPerform = async () => {
    try {
      setLoading(true)
      const usage = await getUserUsageStats(userId)
      
      if (!usage) {
        setCanPerform(false)
        return
      }

      if (action === 'create_board') {
        setCanPerform(usage.boards < usage.limits.boards)
      } else if (action === 'create_task') {
        // For tasks, we'd need to check the specific board's task count
        // For now, allow task creation but let the backend enforce limits
        setCanPerform(true)
      }
    } catch (error) {
      console.error('Error checking limits:', error)
      setCanPerform(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (loading) return
    
    await checkCanPerform()
    
    if (!canPerform) {
      setShowUpgradeDialog(true)
      onCancel?.()
    } else {
      onConfirm?.()
    }
  }

  return (
    <>
      {children({ canPerform })}
      
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Upgrade Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'create_board' 
                ? "You've reached your board limit on the Free plan. Upgrade to Pro to create unlimited boards."
                : "You've reached your task limit on this board. Archive some tasks or upgrade to Pro for more space."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowUpgradeDialog(false)
                // Open upgrade modal or navigate to pricing
                window.location.href = '/board?upgrade=true'
              }}
              className="bg-primary text-primary-foreground"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
