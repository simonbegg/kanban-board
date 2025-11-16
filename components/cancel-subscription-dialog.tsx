'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle,
  Calendar,
  Zap,
  Info,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface CancelSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  periodEnd?: string | null
}

type CancelOption = 'scheduled' | 'immediate'

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onSuccess,
  periodEnd
}: CancelSubscriptionDialogProps) {
  const [cancelOption, setCancelOption] = useState<CancelOption>('scheduled')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<{
    effectiveDate: string
    courtesyUntil: string
    message: string
  } | null>(null)

  const handleCancel = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelNow: cancelOption === 'immediate'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setResult(data)
      setSuccess(true)
      
      // Call onSuccess after a short delay
      setTimeout(() => {
        if (onSuccess) onSuccess()
        onOpenChange(false)
      }, 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      setSuccess(false)
      setResult(null)
      setCancelOption('scheduled')
      onOpenChange(false)
    }
  }

  if (success && result) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <DialogTitle>Cancellation Confirmed</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Effective Date:</span>
                <span className="font-medium">
                  {format(new Date(result.effectiveDate), 'PPP')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Courtesy Period Until:</span>
                <span className="font-medium">
                  {format(new Date(result.courtesyUntil), 'PPP')}
                </span>
              </div>
            </div>

            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                💡 <strong>Tip:</strong> Export your data before your plan ends. You'll have full access until the effective date.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Cancel Pro Subscription</DialogTitle>
          <DialogDescription>
            Choose how you'd like to cancel your Pro plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <RadioGroup value={cancelOption} onValueChange={(value: string) => setCancelOption(value as CancelOption)}>
            {/* Scheduled Cancellation */}
            <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                 onClick={() => setCancelOption('scheduled')}>
              <RadioGroupItem value="scheduled" id="scheduled" />
              <div className="flex-1">
                <Label htmlFor="scheduled" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-semibold">
                    <Calendar className="w-4 h-4" />
                    Cancel at Period End (Recommended)
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your Pro plan will remain active until{' '}
                    {periodEnd ? format(new Date(periodEnd), 'MMMM d, yyyy') : 'the end of your billing period'}.
                    You'll have full access until then.
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    ✓ Keep Pro features until period end<br />
                    ✓ 14-day courtesy period to resolve over-limit items<br />
                    ✓ No immediate disruption
                  </div>
                </Label>
              </div>
            </div>

            {/* Immediate Cancellation */}
            <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                 onClick={() => setCancelOption('immediate')}>
              <RadioGroupItem value="immediate" id="immediate" />
              <div className="flex-1">
                <Label htmlFor="immediate" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-semibold">
                    <Zap className="w-4 h-4" />
                    Cancel Immediately
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your Pro plan will be cancelled right away. You'll be downgraded to Free plan immediately.
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    ⚠️ Immediate downgrade to Free plan<br />
                    ⚠️ 14-day courtesy period to resolve over-limit items<br />
                    ⚠️ May only be available within 30 days of upgrade
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Important Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Before you cancel:</strong>
              <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                <li>Export your data if you want a backup</li>
                <li>Review your boards and tasks - Free plan has limits (1 board, 100 active tasks)</li>
                <li>You'll have 14 days after cancellation to resolve over-limit items</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Keep Pro
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
