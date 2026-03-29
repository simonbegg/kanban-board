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
import { Badge } from '@/components/ui/badge'
import { usePaddle } from '@/contexts/paddle-context'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import {
    Crown,
    Layout,
    Archive,
    Users,
    Star,
    CheckCircle,
    Sparkles
} from 'lucide-react'

interface ProIntentModalProps {
    isOpen: boolean
    onClose: () => void
    onUpgrade?: () => void
}

export function ProIntentModal({ isOpen, onClose, onUpgrade }: ProIntentModalProps) {
    const { openProCheckout, isLoaded } = usePaddle()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleUpgrade = async () => {
        if (!user || !isLoaded) return

        setLoading(true)

        // Open Paddle checkout
        openProCheckout(user.email || undefined, user.id)

        // Mark first login as completed
        await markFirstLoginCompleted()

        setLoading(false)
        onClose()
        onUpgrade?.()
    }

    const handleContinueFree = async () => {
        setLoading(true)

        // Mark first login as completed so modal doesn't show again
        await markFirstLoginCompleted()

        setLoading(false)
        onClose()
    }

    const markFirstLoginCompleted = async () => {
        if (!user) return

        try {
            await supabase
                .from('entitlements')
                .update({ first_login_completed: true })
                .eq('user_id', user.id)
        } catch (error) {
            console.error('Failed to mark first login completed:', error)
        }
    }

    const benefits = [
        { icon: Layout, text: 'Unlimited boards', description: 'Create as many boards as you need' },
        { icon: Archive, text: '200,000 archived tasks', description: 'Keep your history forever' },
        { icon: Users, text: 'Priority support', description: 'Get help when you need it' },
        { icon: Star, text: 'Future Pro features', description: 'Access new features first' },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleContinueFree()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl">Finish setting up ThreeLanes Pro</DialogTitle>
                    <DialogDescription className="text-base">
                        You selected the Pro plan during signup. Complete your upgrade to unlock all features.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Price highlight */}
                    <div className="text-center mb-6 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Crown className="h-5 w-5 text-yellow-500" />
                            <Badge variant="secondary">Pro Plan</Badge>
                        </div>
                        <p className="text-3xl font-bold">
                            $6<span className="text-lg font-normal text-muted-foreground">/month</span>
                        </p>
                    </div>

                    {/* Benefits list */}
                    <div className="space-y-3">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{benefit.text}</p>
                                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button
                        onClick={handleUpgrade}
                        disabled={loading || !isLoaded}
                        className="w-full"
                        size="lg"
                    >
                        <Crown className="mr-2 h-4 w-4" />
                        {loading ? 'Loading...' : 'Upgrade to Pro'}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleContinueFree}
                        disabled={loading}
                        className="w-full text-muted-foreground"
                    >
                        Continue on Free for now
                    </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground pt-2">
                    You can upgrade anytime from your account settings.
                </p>
            </DialogContent>
        </Dialog>
    )
}
