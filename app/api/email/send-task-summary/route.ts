import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'
import { getEmailSettings, getTodoTasks, formatTaskSummaryEmail, sendEmail } from '@/lib/email'

// This should be called by a cron job (e.g., daily or weekly)
// Protect with a secret key to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

// Vercel cron jobs use GET by default
export async function GET(request: NextRequest) {
  return handleEmailSummary(request)
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return handleEmailSummary(request)
}

async function handleEmailSummary(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

  try {
    // Get all users with email notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, notification_email, notification_frequency, last_notification_sent')
      .eq('email_notifications_enabled', true)
      .not('notification_email', 'is', null)

    if (profilesError) {
      throw profilesError
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No users with email notifications enabled' })
    }

    let emailsSent = 0
    const errors: string[] = []

    // Process each user
    for (const profile of profiles) {
      try {
        // Check if we should send notification based on frequency
        const now = new Date()
        const lastSent = profile.last_notification_sent ? new Date(profile.last_notification_sent) : null
        const frequency = profile.notification_frequency || 'daily'

        let shouldSend = true

        if (lastSent) {
          const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
          
          if (frequency === 'daily' && hoursSinceLastSent < 24) {
            shouldSend = false
          } else if (frequency === 'weekly' && hoursSinceLastSent < 168) { // 168 hours = 7 days
            shouldSend = false
          }
        }

        if (!shouldSend) {
          continue // Skip this user
        }

        // Get user's todo tasks
        const tasks = await getTodoTasks(supabase, profile.id)

        if (tasks.length === 0) {
          continue // Don't send empty emails
        }

        // Format and send email
        const { subject, html, text } = formatTaskSummaryEmail(tasks, frequency)
        await sendEmail(profile.notification_email!, subject, html, text)

        // Update last notification sent timestamp
        await supabase
          .from('profiles')
          .update({ last_notification_sent: now.toISOString() })
          .eq('id', profile.id)

        emailsSent++
      } catch (userError) {
        console.error(`Error processing email for user ${profile.id}:`, userError)
        errors.push(`User ${profile.id}: ${(userError as Error).message}`)
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      usersProcessed: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('Error sending task summary emails:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
