"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { AlertCircle, CheckCircle, Slack } from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"

export function SlackIntegration() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
    
    // Check for OAuth callback params
    const params = new URLSearchParams(window.location.search)
    if (params.get('slack_connected') === 'true') {
      setSuccess('Slack connected successfully! You'll receive notifications for cards older than 5 days.')
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
      checkConnection()
    } else if (params.get('slack_error')) {
      setError(`Failed to connect Slack: ${params.get('slack_error')}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const checkConnection = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('slack_access_token, slack_connected_at')
          .eq('id', user.id)
          .single()
        
        setIsConnected(!!profile?.slack_access_token)
      }
    } catch (err) {
      console.error('Error checking Slack connection:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    window.location.href = '/api/slack/auth'
  }

  const handleDisconnect = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/slack/disconnect', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to disconnect Slack')
      }
      
      setIsConnected(false)
      setSuccess('Slack disconnected successfully')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Slack className="h-6 w-6" />
          <div>
            <CardTitle>Slack Integration</CardTitle>
            <CardDescription>
              Receive notifications in Slack when cards are getting old
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {isConnected ? (
              <>
                ✅ Slack is connected. You'll receive a DM when a card has been sitting for more than 5 days.
              </>
            ) : (
              <>
                Connect your Slack account to receive notifications when cards need attention.
                You'll get a message when a card is older than 5 days.
              </>
            )}
          </p>
        </div>

        <div>
          {isConnected ? (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? 'Disconnecting...' : 'Disconnect Slack'}
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="gap-2"
            >
              <Slack className="h-4 w-4" />
              {loading ? 'Loading...' : 'Connect Slack'}
            </Button>
          )}
        </div>

        {isConnected && (
          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p className="font-medium mb-2">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Notifications are checked once per day</li>
              <li>You'll receive a DM for each card older than 5 days</li>
              <li>You won't be spammed - each card is notified once per 24 hours</li>
              <li>Archived cards are not included</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
