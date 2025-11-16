'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  Info, 
  XCircle,
  Calendar,
  Download
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'

interface CancellationBannerProps {
  userId: string
  onUndoClick?: () => void
  onResolveClick?: () => void
  onExportClick?: () => void
}

interface EntitlementStatus {
  plan: string
  status: string
  cancel_at_period_end: boolean
  cancel_effective_at: string | null
  courtesy_until: string | null
  enforcement_state: string
  current_period_end: string | null
}

export function CancellationBanner({ 
  userId, 
  onUndoClick,
  onResolveClick,
  onExportClick
}: CancellationBannerProps) {
  const [entitlements, setEntitlements] = useState<EntitlementStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    loadEntitlements()
    
    // Refresh every minute to update countdown
    const interval = setInterval(loadEntitlements, 60000)
    return () => clearInterval(interval)
  }, [userId])

  const loadEntitlements = async () => {
    try {
      const { data, error } = await supabase
        .from('entitlements')
        .select('plan, status, cancel_at_period_end, cancel_effective_at, courtesy_until, enforcement_state, current_period_end')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      setEntitlements(data as EntitlementStatus)
    } catch (error) {
      console.error('Error loading entitlements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUndoCancel = async () => {
    try {
      const response = await fetch('/api/subscription/undo-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to undo cancellation')
      }

      // Refresh entitlements
      await loadEntitlements()
      
      if (onUndoClick) onUndoClick()
    } catch (error) {
      console.error('Error undoing cancellation:', error)
      alert((error as Error).message)
    }
  }

  if (loading || !entitlements) {
    return null
  }

  // Don't show banner if user is on Free plan with active status
  if (entitlements.plan === 'free' && entitlements.status === 'active') {
    return null
  }

  // Scheduled cancellation (still on Pro)
  if (entitlements.status === 'cancel_scheduled' && entitlements.cancel_at_period_end) {
    const effectiveDate = entitlements.cancel_effective_at ? parseISO(entitlements.cancel_effective_at) : null
    const timeUntilEnd = effectiveDate ? formatDistanceToNow(effectiveDate, { addSuffix: true }) : 'soon'

    return (
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="ml-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                Pro plan scheduled for cancellation
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your Pro plan will end {timeUntilEnd}. 
                {entitlements.courtesy_until && (
                  <> You'll have until {formatDistanceToNow(parseISO(entitlements.courtesy_until), { addSuffix: true })} to resolve any over-limit items.</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {onExportClick && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onExportClick}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleUndoCancel}
              >
                Undo Cancellation
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Grace period (Pro cancelled, in courtesy period)
  if (entitlements.status === 'grace' && entitlements.courtesy_until) {
    const courtesyEnd = parseISO(entitlements.courtesy_until)
    const isExpired = isPast(courtesyEnd)
    const timeRemaining = isExpired ? 'expired' : formatDistanceToNow(courtesyEnd, { addSuffix: true })

    return (
      <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="ml-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-orange-900 dark:text-orange-100">
                Pro plan cancelled - Grace period active
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {isExpired ? (
                  <>Your grace period has ended. Free plan limits are now enforced.</>
                ) : (
                  <>You have {timeRemaining} to resolve over-limit items or upgrade again.</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {onResolveClick && !isExpired && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={onResolveClick}
                >
                  Resolve Now
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/board?upgrade=true'}
              >
                Upgrade Again
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Enforced state (limits being enforced)
  if (entitlements.enforcement_state === 'enforced' || entitlements.enforcement_state === 'soft_warn') {
    return (
      <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="ml-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-900 dark:text-red-100">
                {entitlements.enforcement_state === 'enforced' 
                  ? 'Free plan limits enforced' 
                  : 'You\'re over Free plan limits'}
              </p>
              <p className="text-sm text-red-800 dark:text-red-200">
                {entitlements.enforcement_state === 'enforced'
                  ? 'Some boards and tasks are now read-only. Resolve over-limit items to regain full access.'
                  : 'Please archive or delete extra boards and tasks to continue using all features.'}
              </p>
            </div>
            <div className="flex gap-2">
              {onResolveClick && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={onResolveClick}
                >
                  Resolve Now
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/board?upgrade=true'}
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
