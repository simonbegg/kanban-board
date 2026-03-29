'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Script from 'next/script'

// Global Paddle types are declared in contexts/paddle-context.tsx.
// Using (window as any).Paddle here to avoid duplicate global interface merging.

interface PaddleContextType {
    isLoaded: boolean
    openCheckout: (userEmail?: string, userId?: string) => void
}

const PaddleContext = createContext<PaddleContextType>({
    isLoaded: false,
    openCheckout: () => {},
})

export function usePaddle() {
    return useContext(PaddleContext)
}

interface PaddleProviderProps {
    children: ReactNode
}

export function PaddleProvider({ children }: PaddleProviderProps) {
    const [isLoaded, setIsLoaded] = useState(false)

    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'

    useEffect(() => {
        // Initialize Paddle when script is loaded and we have the token
        if ((window as any).Paddle && clientToken && !isLoaded) {
            (window as any).Paddle.Initialize({
                token: clientToken,
                environment: environment,
            })
            setIsLoaded(true)
            console.log(`Paddle initialized in ${environment} mode`)
        }
    }, [clientToken, environment, isLoaded])

    const openCheckout = (userEmail?: string, userId?: string) => {
        if (!(window as any).Paddle) {
            console.error('Paddle not loaded')
            return
        }

        if (!priceId) {
            console.error('Paddle price ID not configured')
            return
        }

        (window as any).Paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customer: userEmail ? { email: userEmail } : undefined,
            // userId is forwarded to every webhook event for this subscription
            // via Paddle's custom_data field, allowing the webhook handler to
            // identify which user to upgrade without relying on email matching.
            customData: userId ? { userId } : undefined,
            settings: {
                displayMode: 'overlay',
                theme: 'light',
                successUrl: `${window.location.origin}/board?upgraded=true`,
            },
        })
    }

    const handleScriptLoad = () => {
        if ((window as any).Paddle && clientToken) {
            (window as any).Paddle.Initialize({
                token: clientToken,
                environment: environment,
            })
            setIsLoaded(true)
            console.log(`Paddle initialized in ${environment} mode`)
        }
    }

    return (
        <PaddleContext.Provider value={{ isLoaded, openCheckout }}>
            <Script
                src="https://cdn.paddle.com/paddle/v2/paddle.js"
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />
            {children}
        </PaddleContext.Provider>
    )
}
