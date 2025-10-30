'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'

export function TestEmailButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const testEmail = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/email/send-task-summary', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 7CA3B406BC9F930368A9057F7A686150', // Using your actual CRON_SECRET
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult({
          success: true,
          message: `Success! Sent ${data.emailsSent} emails to ${data.usersProcessed} users.`
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to send emails'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: (error as Error).message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <Button onClick={testEmail} disabled={loading} variant="outline">
        <Mail className="h-4 w-4 mr-2" />
        {loading ? 'Sending...' : 'Test Email Notifications'}
      </Button>
      
      {result && (
        <div className={`mt-2 flex items-center gap-2 text-sm ${
          result.success ? 'text-green-600' : 'text-red-600'
        }`}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {result.message}
        </div>
      )}
    </div>
  )
}
