'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Settings, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface EmailSettings {
  enabled: boolean
  email: string | null
  frequency: 'daily' | 'weekly'
}

export function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>({
    enabled: false,
    email: null,
    frequency: 'daily'
  })
  const [savedEmail, setSavedEmail] = useState<string | null>(null) // Track saved email state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to manage email settings')
        return
      }

      const response = await fetch('/api/email/settings')
      if (!response.ok) {
        throw new Error('Failed to fetch email settings')
      }
      
      const data = await response.json()
      setSettings(data)
      setSavedEmail(data.email) // Store the saved email
    } catch (err) {
      console.error('Error fetching email settings:', err)
      setError('Failed to load email settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (updatedSettings: Partial<EmailSettings>) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/email/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save settings')
      }

      const data = await response.json()
      setSettings(data)
      setSavedEmail(data.email) // Update saved email after save
      setSuccess('Email settings saved successfully')
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving email settings:', err)
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleEnabled = () => {
    const newEnabled = !settings.enabled
    saveSettings({ enabled: newEnabled })
  }

  const handleEmailChange = (email: string) => {
    setSettings({ ...settings, email })
  }

  const handleFrequencyChange = (frequency: 'daily' | 'weekly') => {
    saveSettings({ frequency })
  }

  const handleSaveEmail = () => {
    if (!settings.email?.trim()) {
      setError('Please enter a valid email address')
      return
    }
    saveSettings({ email: settings.email.trim() })
  }


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Get daily or weekly summaries of your tasks via email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert>
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

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-muted-foreground">
              {settings.enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <Button
            variant={settings.enabled ? 'default' : 'outline'}
            onClick={handleToggleEnabled}
            disabled={saving}
          >
            {settings.enabled ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {settings.enabled && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border rounded-md text-sm pr-10"
                    disabled={saving}
                  />
                  {settings.email && settings.email === savedEmail && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveEmail}
                  disabled={saving || !settings.email?.trim() || settings.email === savedEmail}
                >
                  Save
                </Button>
              </div>
              {!settings.email && (
                <p className="text-xs text-muted-foreground">
                  Add an email address to receive notifications
                </p>
              )}
              {settings.email && settings.email === savedEmail && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Email saved and ready to receive notifications
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Frequency</label>
              <div className="flex gap-2">
                <Button
                  variant={settings.frequency === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFrequencyChange('daily')}
                  disabled={saving}
                >
                  Daily
                </Button>
                <Button
                  variant={settings.frequency === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFrequencyChange('weekly')}
                  disabled={saving}
                >
                  Weekly
                </Button>
              </div>
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground pt-4 border-t">
          <p className="font-medium mb-2">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Receive a summary of tasks in your To-do column</li>
            <li>Daily emails are sent each morning</li>
            <li>Weekly emails are sent on Monday mornings</li>
            <li>Only non-empty task lists will trigger emails</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
