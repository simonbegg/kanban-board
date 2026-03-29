'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Paddle types
declare global {
    interface Window {
        Paddle?: {
            Environment: {
                set: (env: 'sandbox' | 'production') => void
            }
            Initialize: (options: PaddleInitOptions) => void
            Checkout: {
                open: (options: PaddleCheckoutOptions) => void
            }
        }
    }
}

interface PaddleInitOptions {
    token: string
    checkout?: {
        settings?: {
            displayMode?: 'overlay' | 'inline'
            theme?: 'light' | 'dark'
            locale?: string
        }
    }
    pwCustomer?: {
        id?: string
    }
    eventCallback?: (data: PaddleEventData) => void
}

interface PaddleEventData {
    name?: string
    [key: string]: unknown
}

interface PaddleCheckoutOptions {
    items: Array<{ priceId: string; quantity: number }>
    customer?: {
        email?: string
    }
    settings?: {
        displayMode?: 'overlay' | 'inline'
        theme?: 'light' | 'dark'
        locale?: string
        allowLogout?: boolean
        successUrl?: string
    }
    customData?: Record<string, string>
}

interface PaddleContextType {
    isLoaded: boolean
    openCheckout: (options?: Partial<PaddleCheckoutOptions>) => void
    openProCheckout: (userEmail?: string, userId?: string) => void
}

const PaddleContext = createContext<PaddleContextType | undefined>(undefined)

// Environment variables
const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || ''
const PADDLE_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || ''
const PADDLE_ENVIRONMENT = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'

// Debug: Log environment variables on load
console.log('Paddle Config:', {
    token: PADDLE_CLIENT_TOKEN ? `${PADDLE_CLIENT_TOKEN.substring(0, 10)}...` : 'MISSING',
    priceId: PADDLE_PRICE_ID || 'MISSING',
    environment: PADDLE_ENVIRONMENT
})

export function PaddleProvider({ children }: { children: ReactNode }) {
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const initializePaddle = () => {
            if (window.Paddle && !isLoaded) {
                try {
                    // Set environment (sandbox or production)
                    window.Paddle.Environment.set(PADDLE_ENVIRONMENT)

                    // Initialize with client token
                    window.Paddle.Initialize({
                        token: PADDLE_CLIENT_TOKEN,
                        checkout: {
                            settings: {
                                displayMode: 'overlay',
                                theme: 'dark',
                                locale: 'en'
                            }
                        },
                        eventCallback: function (data) {
                            console.log('Paddle event:', data)

                            // Handle checkout events
                            if (data.name === 'checkout.completed') {
                                console.log('Checkout completed!', data)
                                // Redirect to board with success parameter
                                window.location.href = '/board?upgrade=success'
                            }

                            if (data.name === 'checkout.closed') {
                                console.log('Checkout closed')
                            }
                        }
                    })

                    setIsLoaded(true)
                    console.log('Paddle initialized successfully in', PADDLE_ENVIRONMENT, 'mode')
                } catch (error) {
                    console.error('Failed to initialize Paddle:', error)
                }
            }
        }

        // Check if Paddle is already loaded
        if (window.Paddle) {
            initializePaddle()
        } else {
            // Wait for Paddle script to load
            const checkPaddle = setInterval(() => {
                if (window.Paddle) {
                    clearInterval(checkPaddle)
                    initializePaddle()
                }
            }, 100)

            // Cleanup after 10 seconds if Paddle doesn't load
            setTimeout(() => {
                clearInterval(checkPaddle)
                if (!window.Paddle) {
                    console.warn('Paddle.js failed to load within timeout')
                }
            }, 10000)

            return () => clearInterval(checkPaddle)
        }
    }, [isLoaded])

    const openCheckout = (options?: Partial<PaddleCheckoutOptions>) => {
        if (!window.Paddle) {
            console.error('Paddle not loaded')
            return
        }

        const checkoutOptions: PaddleCheckoutOptions = {
            items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
            settings: {
                displayMode: 'overlay',
                theme: 'dark',
                locale: 'en'
            }
        }

        // Merge with any custom options
        if (options?.customer) {
            checkoutOptions.customer = options.customer
        }
        if (options?.customData) {
            checkoutOptions.customData = options.customData
        }

        console.log('Opening Paddle checkout with:', JSON.stringify(checkoutOptions, null, 2))

        window.Paddle.Checkout.open(checkoutOptions)
    }

    const openProCheckout = (userEmail?: string, userId?: string) => {
        openCheckout({
            items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
            customer: userEmail ? { email: userEmail } : undefined,
            customData: userId ? { userId } : undefined
        })
    }

    return (
        <PaddleContext.Provider value={{ isLoaded, openCheckout, openProCheckout }}>
            {children}
        </PaddleContext.Provider>
    )
}

export function usePaddle() {
    const context = useContext(PaddleContext)
    if (context === undefined) {
        throw new Error('usePaddle must be used within a PaddleProvider')
    }
    return context
}
