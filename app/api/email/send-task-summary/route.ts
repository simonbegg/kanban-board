import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'
import { getEmailSettings, getTodoTasks, formatTaskSummaryEmail, sendEmail } from '@/lib/email'

// This should be called by a cron job (e.g., daily or weekly)
// Protect with a secret key to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

// Create admin client for cron job (bypasses RLS)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

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

  // Use admin client for cron job (bypasses RLS to access all users)
  const supabase = createAdminClient()

  try {
    // Get all users with email notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, notification_email, notification_frequency, last_notification_sent, email_notifications_enabled')
      .eq('email_notifications_enabled', true)
      .not('notification_email', 'is', null)
      .returns<Array<{
        id: string
        notification_email: string | null
        notification_frequency: string | null
        last_notification_sent: string | null
        email_notifications_enabled: boolean | null
      }>>()

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
        const frequency = (profile.notification_frequency || 'daily') as 'daily' | 'weekly'

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
        // @ts-expect-error - Supabase type inference issue
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
