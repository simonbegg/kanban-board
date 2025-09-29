import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Board = Database['public']['Tables']['boards']['Row']
type BoardInsert = Database['public']['Tables']['boards']['Insert']
type BoardUpdate = Database['public']['Tables']['boards']['Update']

type Column = Database['public']['Tables']['columns']['Row']
type ColumnInsert = Database['public']['Tables']['columns']['Insert']

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export interface BoardWithColumnsAndTasks extends Board {
  columns: (Column & {
    tasks: Task[]
  })[]
}

export async function getBoards(): Promise<Board[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getBoardWithData(boardId: string): Promise<BoardWithColumnsAndTasks | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('boards')
    .select(`
      *,
      columns (
        *,
        tasks (*)
      )
    `)
    .eq('id', boardId)
    .single()

  if (error) throw error
  
  // Sort columns by position and tasks by position within each column
  if (data) {
    data.columns = data.columns
      .sort((a: Column, b: Column) => a.position - b.position)
      .map((column: Column & { tasks: Task[] }) => ({
        ...column,
        tasks: column.tasks.sort((a: Task, b: Task) => a.position - b.position)
      }))
  }
  
  return data
}

export async function createBoard(board: Omit<BoardInsert, 'user_id'>): Promise<Board> {
  const supabase = createClient()
  
  console.log('Getting user session...')
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.error('Error getting user:', userError)
    throw new Error(`Authentication error: ${userError.message}`)
  }
  
  if (!user) {
    console.error('No user found in session')
    throw new Error('Not authenticated')
  }

  console.log('User found:', user.id)
  
  // Check if profile exists, create if not
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()
  
  if (profileError && profileError.code === 'PGRST116') {
    // Profile doesn't exist, create it
    console.log('Profile not found, creating profile for user:', user.id)
    const { error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || null
      })
    
    if (createProfileError) {
      console.error('Error creating profile:', createProfileError)
      throw new Error(`Failed to create user profile: ${createProfileError.message}`)
    }
  } else if (profileError) {
    console.error('Error checking profile:', profileError)
    throw new Error(`Profile check failed: ${profileError.message}`)
  }

  console.log('Creating board with data:', { ...board, user_id: user.id })

  const { data, error } = await supabase
    .from('boards')
    .insert({ ...board, user_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('Error inserting board:', error)
    throw new Error(`Failed to create board: ${error.message}`)
  }

  console.log('Board created:', data)

  // Create default columns
  const defaultColumns = [
    { title: 'To Do', position: 0 },
    { title: 'Doing', position: 1 },
    { title: 'Done', position: 2 }
  ]

  console.log('Creating default columns for board:', data.id)

  const { error: columnsError } = await supabase
    .from('columns')
    .insert(
      defaultColumns.map(col => ({
        ...col,
        board_id: data.id
      }))
    )

  if (columnsError) {
    console.error('Error creating columns:', columnsError)
    throw new Error(`Failed to create board columns: ${columnsError.message}`)
  }

  console.log('Default columns created successfully')
  return data
}

export async function updateBoard(boardId: string, updates: BoardUpdate): Promise<Board> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', boardId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBoard(boardId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)

  if (error) throw error
}

export async function createTask(task: Omit<TaskInsert, 'position'>): Promise<Task> {
  const supabase = createClient()
  
  // Get the next position in the column
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('position')
    .eq('column_id', task.column_id)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existingTasks && existingTasks.length > 0 
    ? existingTasks[0].position + 1 
    : 0

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...task, position: nextPosition })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error
}

export async function moveTask(
  taskId: string, 
  newColumnId: string, 
  newPosition: number
): Promise<void> {
  console.log('=== MOVE TASK API CALLED ===')
  console.log('Parameters:', { taskId, newColumnId, newPosition })
  
  const supabase = createClient()
  
  // Get the task and its board
  const { data: task } = await supabase
    .from('tasks')
    .select('column_id, board_id')
    .eq('id', taskId)
    .single()

  if (!task) throw new Error('Task not found')

  const oldColumnId = task.column_id
  const boardId = task.board_id
  
  console.log('Task found:', { oldColumnId, boardId })

  // Get all tasks in affected columns
  const columnsToUpdate = oldColumnId === newColumnId ? [oldColumnId] : [oldColumnId, newColumnId]
  console.log('Columns to update:', columnsToUpdate)
  
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('id, column_id, position')
    .eq('board_id', boardId)
    .in('column_id', columnsToUpdate)
    .order('position', { ascending: true })

  if (!allTasks) return

  console.log('All tasks before update:', allTasks)

  // Separate tasks by column
  const oldColumnTasks = allTasks.filter(t => t.column_id === oldColumnId && t.id !== taskId)
  const newColumnTasks = oldColumnId === newColumnId 
    ? oldColumnTasks 
    : allTasks.filter(t => t.column_id === newColumnId)

  console.log('Old column tasks (excluding moved):', oldColumnTasks)
  console.log('New column tasks (before insertion):', newColumnTasks)

  // Insert the moved task at the new position
  const movedTask = { id: taskId, column_id: newColumnId, position: 0 }
  newColumnTasks.splice(newPosition, 0, movedTask)
  
  console.log('New column tasks (after insertion):', newColumnTasks)

  // Update old column tasks (if different from new column)
  if (oldColumnId !== newColumnId) {
    console.log('Updating old column tasks...')
    for (let i = 0; i < oldColumnTasks.length; i++) {
      const task = oldColumnTasks[i]
      console.log(`Updating task ${task.id} to position ${i}`)
      await supabase
        .from('tasks')
        .update({ position: i })
        .eq('id', task.id)
    }
  }

  // Update new column tasks (including the moved task)
  console.log('Updating new column tasks...')
  for (let i = 0; i < newColumnTasks.length; i++) {
    const task = newColumnTasks[i]
    const updateData: any = { position: i }
    if (task.id === taskId) {
      updateData.column_id = newColumnId
      console.log(`Updating MOVED task ${task.id} to position ${i} and column ${newColumnId}`)
    } else {
      console.log(`Updating task ${task.id} to position ${i}`)
    }
    
    await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', task.id)
  }
  
  console.log('=== MOVE TASK API COMPLETE ===')
}
