'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
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
  Star
} from 'lucide-react'

export default function PricingPage() {
  const handleUpgrade = () => {
    window.location.href = 'mailto:support@threelanes.app?subject=Pro Plan Upgrade Request'
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Upgrade to ThreeLanes Pro
          </h1>
          <p className="text-xl text-muted-foreground">
            Unlock the full power of ThreeLanes with Pro.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardContent className="pt-6">
              <div className="text-center">
                <Layout className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <p className="text-3xl font-bold mb-4">$0<span className="text-lg font-normal text-muted-foreground">/month</span></p>
                <Badge variant="secondary" className="mb-4">For Individuals</Badge>
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
                asChild
              >
                <a href="/">Get Started Free</a>
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-primary ring-2 ring-primary">
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
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 md:py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
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
      </section>

      {/* Contact Support */}
      <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
          <p className="text-muted-foreground mb-6">
            Our support team is here to answer any questions about upgrading to Pro.
          </p>
          <Button variant="outline" onClick={() => window.location.href = 'mailto:support@threelanes.app'}>
            Contact Support
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
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
    <div className="border rounded-lg p-6 bg-background">
      <h5 className="font-semibold mb-2 text-lg">{question}</h5>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  )
}
