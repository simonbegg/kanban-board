'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Chrome, Crown, CheckCircle } from 'lucide-react'
import Link from 'next/link'

function SignupPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth()

  // Get plan intent from URL
  const planParam = searchParams.get('plan')
  const planIntent = planParam === 'pro' ? 'pro' : 'free'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/board')
    }
  }, [user, authLoading, router])

  // Store plan intent in sessionStorage for use after OAuth redirect
  useEffect(() => {
    if (planIntent) {
      sessionStorage.setItem('plan_intent', planIntent)
    }
  }, [planIntent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Pass plan intent to signup
      const result = await signUp(email, password, fullName)

      if (result.error) {
        setError(result.error.message)
        setLoading(false)
      } else {
        // Success - redirect to board
        if (planIntent === 'pro') {
          router.push('/board?upgrade=true')
        } else {
          router.push('/board')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
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
      // Don't set loading to false - let the redirect happen
    } catch (err) {
      setError('Failed to sign in with Google')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-2">
              <h1 className="text-3xl font-bold mb-1">ThreeLanes</h1>
              <p className="text-sm text-muted-foreground">Kanban without the clutter</p>
            </div>
            <CardTitle>Create your account</CardTitle>

            {/* Plan intent messaging */}
            {planIntent === 'pro' ? (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <Badge variant="secondary">Pro Plan Selected</Badge>
                </div>
                <CardDescription className="text-sm">
                  You selected the Pro plan. You&apos;ll be able to confirm or change this after creating your account.
                </CardDescription>
              </div>
            ) : (
              <CardDescription>
                Create your free ThreeLanes account. No credit card required.
              </CardDescription>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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
                {loading ? 'Creating account...' : 'Create Account'}
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

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href={planIntent === 'pro' ? '/signin?plan=pro' : '/signin'}
                className="text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>

            {/* Pro benefits reminder for pro intent */}
            {planIntent === 'pro' && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Pro plan includes:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Unlimited boards</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>200k archived tasks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Unlimited retention</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  )
}
