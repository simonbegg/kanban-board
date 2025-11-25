'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Script from 'next/script'

// Paddle types
declare global {
    interface Window {
        Paddle?: {
            Initialize: (config: { token: string; environment?: 'sandbox' | 'production' }) => void
            Checkout: {
                open: (config: {
                    items: Array<{ priceId: string; quantity: number }>
                    customer?: { email?: string }
                    settings?: {
                        displayMode?: 'overlay' | 'inline'
                        theme?: 'light' | 'dark'
                        locale?: string
                        allowLogout?: boolean
                        successUrl?: string
                    }
                }) => void
            }
        }
    }
}

interface PaddleContextType {
    isLoaded: boolean
    openCheckout: (userEmail?: string) => void
}

const PaddleContext = createContext<PaddleContextType>({
    isLoaded: false,
    openCheckout: () => { },
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
        if (window.Paddle && clientToken && !isLoaded) {
            window.Paddle.Initialize({
                token: clientToken,
                environment: environment,
            })
            setIsLoaded(true)
            console.log(`Paddle initialized in ${environment} mode`)
        }
    }, [clientToken, environment, isLoaded])

    const openCheckout = (userEmail?: string) => {
        if (!window.Paddle) {
            console.error('Paddle not loaded')
            return
        }

        if (!priceId) {
            console.error('Paddle price ID not configured')
            return
        }

        window.Paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customer: userEmail ? { email: userEmail } : undefined,
            settings: {
                displayMode: 'overlay',
                theme: 'light',
                successUrl: `${window.location.origin}/board?upgraded=true`,
            },
        })
    }

    const handleScriptLoad = () => {
        if (window.Paddle && clientToken) {
            window.Paddle.Initialize({
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
