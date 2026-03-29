'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Script from 'next/script'

// Paddle types
declare global {
    interface Window {
        Paddle?: {
            Environment: {
                set: (env: 'sandbox' | 'production') => void
            }
            Initialize: (config: { token: string }) => void
            Checkout: {
                open: (config: {
                    items: Array<{ priceId: string; quantity: number }>
                    customer?: { email?: string }
                    customData?: Record<string, any>
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
    openCheckout: (userEmail?: string, userId?: string) => void
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
            if (environment === 'sandbox') {
                window.Paddle.Environment.set('sandbox')
            }
            window.Paddle.Initialize({
                token: clientToken,
            })
            setIsLoaded(true)
            console.log(`Paddle initialized in ${environment} mode`)
        } else if (!clientToken) {
        }
    }, [clientToken, environment, isLoaded])

    const openCheckout = (userEmail?: string, userId?: string) => {
        if (!window.Paddle) {
            console.error('Paddle not loaded. Check if script failed to load or token is missing.')
            return
        }

        if (!priceId) {
            console.error('Paddle price ID not configured')
            return
        }

        if (!userId) {
        }

        window.Paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customer: userEmail ? { email: userEmail } : undefined,
            customData: userId ? { user_id: userId } : undefined,
            settings: {
                displayMode: 'overlay',
                theme: 'light',
                successUrl: `${window.location.origin}/board?upgraded=true`,
            },
        })
    }

    const handleScriptLoad = () => {
        if (!clientToken) {
            console.error('Paddle script loaded but client token is missing')
            return
        }

        if (window.Paddle) {
            if (environment === 'sandbox') {
                window.Paddle.Environment.set('sandbox')
            }
            window.Paddle.Initialize({
                token: clientToken,
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
                onError={(e) => console.error('Failed to load Paddle script:', e)}
            />
            {children}
        </PaddleContext.Provider>
    )
}
