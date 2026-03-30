'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const { user, loading: authLoading, updatePassword } = useAuth()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Mark that the user arrived via a password reset flow so the board page
  // can redirect them back here if they try to navigate away before updating.
  useEffect(() => {
    if (!authLoading && user) {
      sessionStorage.setItem('password_reset_pending', '1')
    }
  }, [authLoading, user])

  // Once the auth context has finished loading, if there is no session the
  // reset link was invalid / already used — send the user back to sign-in.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/?error=invalid_reset_link')
    }
  }, [authLoading, user, router])

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

    setSubmitting(true)
    try {
      const { error } = await updatePassword(password)
      if (error) {
        setFormError(error.message)
      } else {
        // Clear the guard flag — password has been successfully updated
        sessionStorage.removeItem('password_reset_pending')
        setSuccess(true)
        setTimeout(() => router.replace('/board'), 2500)
      }
    } catch {
      setFormError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Still loading auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // No session — useEffect will redirect; show nothing in the meantime
  if (!user) return null

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-2">
            <h1 className="text-3xl font-bold mb-1">ThreeLanes</h1>
            <p className="text-sm text-muted-foreground">Kanban without the clutter</p>
          </div>
          <CardTitle>{success ? 'Password updated' : 'Set a new password'}</CardTitle>
          <CardDescription>
            {success
              ? 'Your password has been updated successfully'
              : 'Choose a new password for your account'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Redirecting you to your board…
              </p>
            </div>
          ) : (
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

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
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
        </CardContent>
      </Card>
    </div>
  )
}
