'use client'

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
import { ExternalLink, Info } from 'lucide-react'

interface CancelSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  periodEnd?: string | null
}

// Paddle customer self-service portal — customers can cancel, update payment
// details, and view invoices here without contacting support.
const PADDLE_PORTAL_URL = 'https://customer.paddle.com/'

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
}: CancelSubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Manage Your Subscription</DialogTitle>
          <DialogDescription>
            Cancel or update your Pro subscription via the Paddle billing portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Cancellations take effect at the end of your current billing period.
              You keep Pro access until then.
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            The Paddle portal lets you cancel, pause, change payment details, and
            download invoices. Sign in with the email address you used when
            subscribing.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Pro
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              window.open(PADDLE_PORTAL_URL, '_blank', 'noopener,noreferrer')
              onOpenChange(false)
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Go to Billing Portal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
