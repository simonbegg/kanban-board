'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Chrome, ArrowLeft, MailCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

type View = 'signin' | 'signup' | 'forgot'

interface AuthFormProps {
  initialMode?: 'signin' | 'signup'
}

export function AuthForm({ initialMode = 'signin' }: AuthFormProps = {}) {
  const router = useRouter()
  const [view, setView] = useState<View>(initialMode === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()

  const switchView = (next: View) => {
    setView(next)
    setError(null)
    setResetEmailSent(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result
      if (view === 'signup') {
        result = await signUp(email, password, fullName)
      } else {
        result = await signIn(email, password)
      }

      if (result.error) {
        setError(result.error.message)
        setLoading(false)
      } else {
        router.push('/board')
      }
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
      } else {
        setResetEmailSent(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await signInWithGoogle()
      if (result.error) {
        setError(result.error.message)
        setLoading(false)
      }
      // Don't set loading to false here - let the redirect happen
    } catch {
      setError('Failed to sign in with Google')
      setLoading(false)
    }
  }

  // ── Forgot password view ──────────────────────────────────────────────────
  if (view === 'forgot') {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-2">
              <h1 className="text-3xl font-bold mb-1">ThreeLanes</h1>
              <p className="text-sm text-muted-foreground">Kanban without the clutter</p>
            </div>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>
              {resetEmailSent
                ? 'Check your inbox for the reset link'
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetEmailSent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <MailCheck className="h-10 w-10 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    We&apos;ve sent a password reset link to <strong>{email}</strong>. Check your
                    inbox (and spam folder) and click the link to set a new password.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => switchView('signin')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => switchView('signin')}
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to sign in
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Sign in / Sign up view ────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-2">
            <h1 className="text-3xl font-bold mb-1">ThreeLanes</h1>
            <p className="text-sm text-muted-foreground">Kanban without the clutter</p>
          </div>
          <CardTitle>{view === 'signup' ? 'Create Account' : 'Sign In'}</CardTitle>
          <CardDescription>
            {view === 'signup'
              ? 'Create a new account to start managing your boards'
              : 'Sign in to your account to access your boards'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {view === 'signin' && (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs text-muted-foreground"
                    onClick={() => switchView('forgot')}
                  >
                    Forgot password?
                  </Button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : view === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <Chrome className="mr-2 h-4 w-4" />
            Google
          </Button>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => switchView(view === 'signup' ? 'signin' : 'signup')}
              className="text-sm"
            >
              {view === 'signup'
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
