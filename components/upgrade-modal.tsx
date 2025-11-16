'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Crown,
  Layout,
  CheckCircle,
  Archive,
  Zap,
  Users,
  Shield,
  Star,
  X
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
}

export function UpgradeModal({
  isOpen,
  onClose,
  reason = 'general',
  currentUsage
}: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('pro')

  const getReasonMessage = () => {
    switch (reason) {
      case 'board_limit':
        return 'You\'ve reached your board limit. Upgrade to Pro to create unlimited boards.'
      case 'task_limit':
        return 'This board has reached its task limit. Upgrade to Pro for higher limits.'
      case 'archive_limit':
        return 'You\'ve reached your archive storage limit. Pro users get unlimited archive storage.'
      default:
        return 'Unlock the full power of ThreeLanes with Pro.'
    }
  }

  const handleUpgrade = () => {
    // TODO: Integrate with payment provider
    // For now, redirect to a contact page or show admin message
    window.location.href = 'mailto:support@threelanes.app?subject=Pro Plan Upgrade Request'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Upgrade to ThreeLanes Pro
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {getReasonMessage()}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Free Plan */}
          <Card className={`relative ${selectedPlan === 'free' ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <Layout className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <p className="text-3xl font-bold mb-4">$0<span className="text-lg font-normal text-muted-foreground">/month</span></p>
                <Badge variant="secondary" className="mb-4">Current Plan</Badge>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <FeatureItem icon={<Layout className="w-4 h-4" />} text="1 board" />
                <FeatureItem icon={<CheckCircle className="w-4 h-4" />} text="100 active tasks per board" />
                <FeatureItem icon={<Archive className="w-4 h-4" />} text="1,000 archived tasks" />
                <FeatureItem icon={<Archive className="w-4 h-4" />} text="90-day archive retention" />
                <FeatureItem icon={<Users className="w-4 h-4" />} text="Email notifications" />
                <FeatureItem icon={<Zap className="w-4 h-4" />} text="Basic features" />
              </div>

              <Button
                variant="outline"
                className="w-full mt-6"
                disabled
              >
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={`relative border-primary ${selectedPlan === 'pro' ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="pt-6">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Crown className="w-3 h-3 mr-1" />
                  RECOMMENDED
                </Badge>
              </div>

              <div className="text-center">
                <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <p className="text-3xl font-bold mb-4">$6<span className="text-lg font-normal text-muted-foreground">/month</span></p>
                <Badge variant="default" className="mb-4">Best Value</Badge>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <FeatureItem icon={<Layout className="w-4 h-4" />} text="Unlimited boards" />
                <FeatureItem icon={<CheckCircle className="w-4 h-4" />} text="100 active tasks per board" />
                <FeatureItem icon={<Archive className="w-4 h-4" />} text="200,000 archived tasks" />
                <FeatureItem icon={<Archive className="w-4 h-4" />} text="Unlimited archive retention" />
                <FeatureItem icon={<Users className="w-4 h-4" />} text="Priority email support" />
                <FeatureItem icon={<Star className="w-4 h-4" />} text="Future Pro features" />
              </div>

              <Button
                className="w-full mt-6"
                onClick={handleUpgrade}
              >
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Usage Summary */}
        {currentUsage && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-4">Your Current Usage</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{currentUsage.boards}</p>
                  <p className="text-sm text-muted-foreground">Boards</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{currentUsage.activeTasks}</p>
                  <p className="text-sm text-muted-foreground">Active Tasks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{currentUsage.archivedTasks}</p>
                  <p className="text-sm text-muted-foreground">Archived Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ Section */}
        <div className="mt-6">
          <h4 className="font-semibold mb-4">Frequently Asked Questions</h4>
          <div className="space-y-4">
            <FAQItem
              question="Can I change my plan anytime?"
              answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
            />
            <FAQItem
              question="What happens to my data if I downgrade?"
              answer="If you downgrade from Pro to Free, you'll need to delete extra boards and archived tasks to stay within free limits."
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="We offer a 30-day money-back guarantee. If you're not satisfied, contact support for a full refund."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards, debit cards, and PayPal."
            />
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Need help? Contact our support team
          </p>
          <Button variant="outline" onClick={() => window.location.href = 'mailto:support@threelanes.app'}>
            Contact Support
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-primary">{icon}</div>
      <span className="text-sm">{text}</span>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border rounded-lg p-4">
      <h5 className="font-medium mb-2">{question}</h5>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  )
}
