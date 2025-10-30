import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Get all boards with columns and tasks
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
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    // Analyze todo columns
    const todoColumns = []
    const allTasks = []

    for (const board of boards || []) {
      for (const column of board.columns || []) {
        const isTodo = column.title.toLowerCase() === 'todo' || column.title.toLowerCase() === 'to-do'
        
        if (isTodo) {
          todoColumns.push({
            boardTitle: board.title,
            columnTitle: column.title,
            taskCount: column.tasks?.length || 0,
            tasks: column.tasks || []
          })
        }
        
        allTasks.push({
          boardTitle: board.title,
          columnTitle: column.title,
          isTodoColumn: isTodo,
          taskCount: column.tasks?.length || 0,
          tasks: column.tasks || []
        })
      }
    }

    return NextResponse.json({
      user: user.id,
      totalBoards: boards?.length || 0,
      todoColumnsFound: todoColumns.length,
      totalTodoTasks: todoColumns.reduce((sum, col) => sum + col.taskCount, 0),
      todoColumns,
      allColumns: allTasks,
      boards: boards
    })
  } catch (err) {
    console.error('Error debugging boards:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
