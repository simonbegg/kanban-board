import type { Database } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

interface EmailSettings {
  enabled: boolean
  email: string | null
  frequency: 'daily' | 'weekly'
}

interface TaskSummary {
  title: string
  description: string | null
  category: string
  boardTitle: string
  created_at: string
}

/**
 * Get user's email notification settings
 */
export async function getEmailSettings(supabase: SupabaseClient<Database>, userId: string): Promise<EmailSettings> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('email_notifications_enabled, notification_email, notification_frequency')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to get email settings: ${error.message}`)
  }

  return {
    enabled: profile.email_notifications_enabled || false,
    email: profile.notification_email,
    frequency: profile.notification_frequency || 'daily'
  }
}

/**
 * Update user's email notification settings
 */
export async function updateEmailSettings(
  supabase: SupabaseClient<Database>,
  userId: string,
  settings: Partial<EmailSettings>
): Promise<void> {
  const updateData: any = {}
  
  if (settings.enabled !== undefined) {
    updateData.email_notifications_enabled = settings.enabled
  }
  if (settings.email !== undefined) {
    updateData.notification_email = settings.email
  }
  if (settings.frequency !== undefined) {
    updateData.notification_frequency = settings.frequency
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update email settings: ${error.message}`)
  }
}

/**
 * Get user's todo tasks for email summary
 */
export async function getTodoTasks(supabase: SupabaseClient<Database>, userId: string): Promise<TaskSummary[]> {
  const { data: boards, error } = await supabase
    .from('boards')
    .select(`
      id,
      title,
      columns (
        id,
        title,
        tasks (
          id,
          title,
          description,
          category,
          created_at
        )
      )
    `)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to get tasks: ${error.message}`)
  }

  const todoTasks: TaskSummary[] = []

  for (const board of boards || []) {
    for (const column of board.columns || []) {
      const columnTitle = column.title.toLowerCase().trim()
      if (columnTitle === 'todo' || 
          columnTitle === 'to-do' ||
          columnTitle === 'to do') {
        
        for (const task of column.tasks || []) {
          todoTasks.push({
            title: task.title,
            description: task.description,
            category: task.category,
            boardTitle: board.title,
            created_at: task.created_at
          })
        }
      }
    }
  }

  return todoTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/**
 * Format email content for task summary
 */
export function formatTaskSummaryEmail(tasks: TaskSummary[], frequency: 'daily' | 'weekly'): {
  subject: string
  html: string
  text: string
} {
  const taskCount = tasks.length
  const frequencyText = frequency === 'daily' ? 'Today' : 'This Week'
  
  const subject = `📋 ThreeLanes: ${frequencyText} Task Overview (${taskCount} tasks)`

  // Group tasks by board
  const tasksByBoard: Record<string, TaskSummary[]> = {}
  tasks.forEach(task => {
    if (!tasksByBoard[task.boardTitle]) {
      tasksByBoard[task.boardTitle] = []
    }
    tasksByBoard[task.boardTitle].push(task)
  })

  // HTML version
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; margin: 0;">📋 ${frequencyText} Task Overview</h1>
        <p style="color: #6b7280; margin: 10px 0;">You have <strong>${taskCount}</strong> task${taskCount !== 1 ? 's' : ''} in your To-do list</p>
      </div>
  `

  Object.entries(tasksByBoard).forEach(([boardTitle, boardTasks]) => {
    html += `
      <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">${boardTitle}</h2>
    `
    
    boardTasks.forEach(task => {
      html += `
        <div style="border-left: 4px solid #3b82f6; padding-left: 15px; margin-bottom: 15px;">
          <h3 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">${task.title}</h3>
          ${task.description ? `<p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">${task.description}</p>` : ''}
          <div style="display: flex; gap: 10px; font-size: 12px;">
            <span style="background-color: #e5e7eb; padding: 2px 8px; border-radius: 12px; color: #374151;">${task.category}</span>
            <span style="color: #9ca3af;">Added ${new Date(task.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      `
    })
    
    html += `</div>`
  })

  html += `
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/board" style="color: #3b82f6; text-decoration: none;">Open ThreeLanes</a> to manage your tasks
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
          💡 <strong>Want to change email frequency?</strong> Go to Settings (⚙️) → Email Notifications to switch between daily and weekly emails.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
          You're receiving this ${frequency} email because you enabled email notifications in ThreeLanes.
        </p>
      </div>
    </div>
  `

  // Text version
  let text = `${frequencyText} Task Overview\n\nYou have ${taskCount} task${taskCount !== 1 ? 's' : ''} in your To-do list:\n\n`

  Object.entries(tasksByBoard).forEach(([boardTitle, boardTasks]) => {
    text += `${boardTitle}:\n`
    boardTasks.forEach(task => {
      text += `• ${task.title}`
      if (task.description) {
        text += ` - ${task.description}`
      }
      text += ` (${task.category})\n`
    })
    text += '\n'
  })

  text += `\nOpen ThreeLanes to manage your tasks: ${process.env.NEXT_PUBLIC_APP_URL}/board\n\n💡 Want to change email frequency? Go to Settings (⚙️) → Email Notifications to switch between daily and weekly emails.\n\nYou're receiving this ${frequency} email because you enabled email notifications in ThreeLanes.`

  return { subject, html, text }
}

/**
 * Send email using Resend API
 */
export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@threelanes.app'

  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `ThreeLanes <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
      text,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`)
  }
}
