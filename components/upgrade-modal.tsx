'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePaddle } from '@/components/paddle-provider'
import { useAuth } from '@/contexts/auth-context'
import {
  Crown,
  Check,
  Sparkles
} from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'board_limit' | 'task_limit' | 'archive_limit' | 'general'
  currentUsage?: {
    boards: number
    activeTasks: number
    archivedTasks: number
  }
  userEmail?: string
}

export function UpgradeModal({
  isOpen,
  onClose,
  reason = 'general',
  currentUsage,
  userEmail
}: UpgradeModalProps) {
  const { openCheckout } = usePaddle()
  const { user } = useAuth()

  const getReasonMessage = () => {
    switch (reason) {
      case 'board_limit':
        return 'You\'ve reached your board limit.'
      case 'task_limit':
        return 'You\'ve reached your task limit for this board.'
      case 'archive_limit':
        return 'You\'ve reached your archive storage limit.'
      default:
        return 'Get more out of ThreeLanes.'
    }
  }

  const getActionHint = () => {
    switch (reason) {
      case 'board_limit':
        return 'Upgrade to Pro for unlimited boards, or delete an existing board to continue.'
      case 'task_limit':
        return 'Upgrade to Pro for higher limits, or archive/delete some tasks to make room.'
      case 'archive_limit':
        return 'Upgrade to Pro for more archive storage, or permanently delete some archived tasks.'
      default:
        return 'Upgrade to unlock the full power of ThreeLanes.'
    }
  }

  const handleUpgrade = () => {
    openCheckout(userEmail, user?.id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 pb-8">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/20">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold">
                Upgrade to Pro
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              <span className="font-medium text-foreground">{getReasonMessage()}</span>
              <br />
              <span className="text-muted-foreground">{getActionHint()}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Pro Plan Card */}
        <div className="p-6 pt-0 -mt-4">
          <div className="rounded-xl border-2 border-primary bg-card p-5 relative">
            <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground gap-1">
              <Sparkles className="w-3 h-3" />
              RECOMMENDED
            </Badge>

            <div className="flex items-baseline justify-between mt-2 mb-4">
              <div>
                <h3 className="text-lg font-semibold">Pro Plan</h3>
                <p className="text-sm text-muted-foreground">Everything you need</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold">$6</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              <FeatureItem text="Unlimited boards" highlight />
              <FeatureItem text="100 tasks per board" />
              <FeatureItem text="200K archived tasks" highlight />
              <FeatureItem text="Unlimited retention" />
              <FeatureItem text="Priority support" />
              <FeatureItem text="Future Pro features" />
            </div>

            <Button className="w-full h-11 text-base font-medium" onClick={handleUpgrade}>
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          </div>

          {/* Current Usage - Compact */}
          {currentUsage && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">YOUR CURRENT USAGE</p>
              <div className="flex justify-between text-sm">
                <span>{currentUsage.boards} board{currentUsage.boards !== 1 ? 's' : ''}</span>
                <span className="text-muted-foreground">•</span>
                <span>{currentUsage.activeTasks} active task{currentUsage.activeTasks !== 1 ? 's' : ''}</span>
                <span className="text-muted-foreground">•</span>
                <span>{currentUsage.archivedTasks} archived</span>
              </div>
            </div>
          )}

          {/* Alternative action */}
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FeatureItem({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Check className={`w-4 h-4 shrink-0 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={`text-sm ${highlight ? 'font-medium' : ''}`}>{text}</span>
    </div>
  )
}
