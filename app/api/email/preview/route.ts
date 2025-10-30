import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getTodoTasks, formatTaskSummaryEmail } from '@/lib/email'

export async function POST() {
  const supabase = createServerClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Get tasks without rate limiting
    const tasks = await getTodoTasks(supabase, user.id)
    
    if (tasks.length === 0) {
      return NextResponse.json({ 
        message: 'No tasks found to preview',
        tasks: []
      })
    }

    // Format email content (daily and weekly versions)
    const dailyEmail = formatTaskSummaryEmail(tasks, 'daily')
    const weeklyEmail = formatTaskSummaryEmail(tasks, 'weekly')

    return NextResponse.json({ 
      success: true,
      taskCount: tasks.length,
      dailyEmail: {
        subject: dailyEmail.subject,
        html: dailyEmail.html.substring(0, 500) + '...', // First 500 chars
        text: dailyEmail.text.substring(0, 300) + '...' // First 300 chars
      },
      weeklyEmail: {
        subject: weeklyEmail.subject,
        html: weeklyEmail.html.substring(0, 500) + '...',
        text: weeklyEmail.text.substring(0, 300) + '...'
      },
      tasks: tasks.map(t => ({
        title: t.title,
        boardTitle: t.boardTitle,
        category: t.category
      }))
    })
  } catch (err) {
    console.error('Error previewing email:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
