'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Loader2 } from 'lucide-react'

type PageState = 'exchanging' | 'ready' | 'error' | 'success'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const router = useRouter()

  const [pageState, setPageState] = useState<PageState>('exchanging')
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Run exactly once on mount — parse the URL and establish a session
  const exchanged = useRef(false)
  useEffect(() => {
    if (exchanged.current) return
    exchanged.current = true

    const run = async () => {
      const supabase = createClient()
      const params = new URLSearchParams(window.location.search)

      const code       = params.get('code')
      const tokenHash  = params.get('token_hash')
      const type       = params.get('type')

      try {
        if (code) {
          // PKCE flow — code is exchanged for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (tokenHash && type) {
          // Email OTP / token-hash flow (Supabase v2 default for email links)
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'recovery',
          })
          if (error) throw error
        } else {
          // No recognised token — likely navigated here directly
          setExchangeError(
            'No reset token found. Please click the link in your email, or request a new one.'
          )
          setPageState('error')
          return
        }

        // Clean up the one-time token from the URL without triggering a re-render
        window.history.replaceState({}, '', '/auth/reset-password')
        setPageState('ready')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setExchangeError(
          msg.includes('expired') || msg.includes('invalid')
            ? 'This reset link has expired or already been used. Please request a new one.'
            : msg
        )
        setPageState('error')
      }
    }

    run()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await updatePassword(password)
      if (error) {
        setFormError(error.message)
      } else {
        setPageState('success')
        setTimeout(() => router.replace('/board'), 2500)
      }
    } catch {
      setFormError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-2">
            <h1 className="text-3xl font-bold mb-1">ThreeLanes</h1>
            <p className="text-sm text-muted-foreground">Kanban without the clutter</p>
          </div>
          <CardTitle>
            {pageState === 'success' ? 'Password updated' : 'Set a new password'}
          </CardTitle>
          <CardDescription>
            {pageState === 'exchanging' && 'Verifying your reset link…'}
            {pageState === 'ready'     && 'Choose a strong password for your account'}
            {pageState === 'error'     && 'Something went wrong'}
            {pageState === 'success'   && 'Your password has been updated'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── Verifying ── */}
          {pageState === 'exchanging' && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* ── Token error ── */}
          {pageState === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{exchangeError}</AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.replace('/')}
              >
                Back to sign in
              </Button>
            </div>
          )}

          {/* ── Password form ── */}
          {pageState === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  minLength={6}
                />
              </div>

              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  'Update password'
                )}
              </Button>
            </form>
          )}

          {/* ── Success ── */}
          {pageState === 'success' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Password updated successfully. Redirecting you to your board…
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
