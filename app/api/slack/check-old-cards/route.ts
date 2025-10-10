import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendSlackMessage, formatTaskNotification } from '@/lib/slack'

// This should be called by a cron job (e.g., once per day)
// Protect with a secret key to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    // Get all users with Slack connected
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, slack_access_token, slack_channel_id')
      .not('slack_access_token', 'is', null)

    if (profilesError) {
      throw profilesError
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No users with Slack connected' })
    }

    let notificationsSent = 0
    const errors: string[] = []

    // Process each user
    for (const profile of profiles) {
      try {
        // Get user's boards and old tasks
        const { data: boards, error: boardsError } = await supabase
          .from('boards')
          .select(`
            id,
            title,
            columns (
              id,
              tasks (
                id,
                title,
                description,
                category,
                created_at,
                archived
              )
            )
          `)
          .eq('user_id', profile.id)

        if (boardsError) {
          throw boardsError
        }

        // Check each task for age
        for (const board of boards || []) {
          for (const column of board.columns || []) {
            for (const task of column.tasks || []) {
              // Skip archived tasks
              if (task.archived) continue

              // Calculate age in days
              const createdDate = new Date(task.created_at)
              const now = new Date()
              const ageInDays = Math.floor(
                (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
              )

              // Check if task is older than 5 days
              if (ageInDays > 5) {
                // Check if we've already sent a notification in the last 24 hours
                const { data: recentNotification } = await supabase
                  .from('notifications_log')
                  .select('id')
                  .eq('user_id', profile.id)
                  .eq('task_id', task.id)
                  .eq('notification_type', 'old_card')
                  .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                  .single()

                // Skip if already notified in last 24 hours
                if (recentNotification) continue

                // Format and send Slack message
                const { text, blocks } = formatTaskNotification({
                  title: task.title,
                  description: task.description,
                  category: task.category,
                  ageInDays,
                  boardTitle: board.title,
                })

                await sendSlackMessage(
                  profile.slack_access_token!,
                  profile.slack_channel_id!,
                  text,
                  blocks
                )

                // Log the notification
                await supabase
                  .from('notifications_log')
                  .insert({
                    user_id: profile.id,
                    task_id: task.id,
                    notification_type: 'old_card',
                    metadata: { age_in_days: ageInDays },
                  })

                notificationsSent++
              }
            }
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError)
        errors.push(`User ${profile.id}: ${(userError as Error).message}`)
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent,
      usersProcessed: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('Error checking old cards:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
