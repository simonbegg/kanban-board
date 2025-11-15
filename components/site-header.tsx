'use client'

import Link from 'next/link'
import { SquareKanban } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import Image from 'next/image'
interface SiteHeaderProps {
  onSignIn?: () => void
  onSignUp?: () => void
}

export function SiteHeader({ onSignIn, onSignUp }: SiteHeaderProps) {
  const { user } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/threelanes_logo.svg"
              alt="ThreeLanes"
              width={176}
              height={32}
              className="block dark:hidden"
              priority
            />
            <Image
              src="/threelanes_logo_white.svg"
              alt="ThreeLanes"
              width={16}
              height={32}
              className="hidden dark:block"
              priority
            />
          </Link>
          <span className="text-xs border border-gray-700 ml-auto mt-2 tracking-wider font-light px-2 py-0.5 rounded-full">Beta</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link href="/pricing">Pricing</Link>
          </Button>
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
