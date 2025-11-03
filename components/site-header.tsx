'use client'

import Link from 'next/link'
import { SquareKanban } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

interface SiteHeaderProps {
  onSignIn?: () => void
  onSignUp?: () => void
}

export function SiteHeader({ onSignIn, onSignUp }: SiteHeaderProps) {
  const { user } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <SquareKanban className="h-6 w-6 sm:h-8 sm:w-8 text-primary rotate-90 hover:rotate-0 transition-all duration-300" />
          <span className="text-xl sm:text-2xl font-display tracking-wider font-semibold">ThreeLanes</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {!user && (
            <>
              {onSignIn && onSignUp ? (
                <>
                  <Button variant="ghost" onClick={onSignIn} className="hidden sm:inline-flex">
                    Sign In
                  </Button>
                  <Button onClick={onSignUp} className="text-xs px-3 py-2 sm:text-sm sm:px-4 sm:py-2">
                    Get Started
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex">
                    <Link href="/">Sign In</Link>
                  </Button>
                  <Button asChild className="text-xs px-3 py-2 sm:text-sm sm:px-4 sm:py-2">
                    <Link href="/">Get Started</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
