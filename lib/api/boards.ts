import { createClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { Database } from '@/lib/supabase'
import { ValidationError, validateBoardTitle, validateBoardDescription, validateTaskTitle, validateTaskDescription, validateCategory } from '@/lib/validation'
import { RateLimitError, isRateLimited, RATE_LIMITS } from '@/lib/rate-limit'
import { withAdminAccess } from '@/lib/admin-access'
import { PLAN_LIMITS } from '@/lib/constants/limits'

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

/**
 * Get all boards with admin access logging (read-only)
 * Only accessible to admin users and logs every access
 */
export async function getBoardsAsAdmin(adminEmail: string): Promise<BoardWithColumnsAndTasks[]> {
  return withAdminAccess(adminEmail, {
    action: 'view_board',
    resourceType: 'board'
  }, async () => {
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
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Process the data to match BoardWithColumnsAndTasks interface
    return (data || []).map(board => ({
      ...board,
      columns: (board.columns || [])
        .sort((a: Column, b: Column) => a.position - b.position)
        .map((column: Column & { tasks: Task[] }) => ({
          ...column,
          tasks: (column.tasks || [])
            .filter((task: Task) => !task.archived)
            .sort((a: Task, b: Task) => a.position - b.position)
        }))
    }))
  })
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
  // Filter out archived tasks
  if (data) {
    data.columns = data.columns
      .sort((a: Column, b: Column) => a.position - b.position)
      .map((column: Column & { tasks: Task[] }) => ({
        ...column,
        tasks: column.tasks
          .filter((task: Task) => !task.archived)
          .sort((a: Task, b: Task) => a.position - b.position)
      }))
  }
  
  return data
}

/**
 * Get a single board with data as admin (read-only with logging)
 */
export async function getBoardWithDataAsAdmin(boardId: string, adminEmail: string): Promise<BoardWithColumnsAndTasks | null> {
  return withAdminAccess(adminEmail, {
    action: 'view_board',
    resourceType: 'board',
    resourceId: boardId
  }, async () => {
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
    // Filter out archived tasks
    if (data) {
      data.columns = data.columns
        .sort((a: Column, b: Column) => a.position - b.position)
        .map((column: Column & { tasks: Task[] }) => ({
          ...column,
          tasks: column.tasks
            .filter((task: Task) => !task.archived)
            .sort((a: Task, b: Task) => a.position - b.position)
        }))
    }
    
    return data
  })
}

export async function createBoard(board: Omit<BoardInsert, 'user_id'>): Promise<Board> {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    logger.error('Error getting user:', userError)
    throw new Error(`Authentication error: ${userError.message}`)
  }
  
  if (!user) {
    logger.error('No user found in session')
    throw new Error('Not authenticated')
  }

  // Rate limiting
  if (isRateLimited(`createBoard:${user.id}`, RATE_LIMITS.WRITE)) {
    throw new RateLimitError('Too many boards created. Please wait before creating another.', Date.now() + 60000)
  }

  // Input validation
  const validTitle = validateBoardTitle(board.title)
  const validDescription = board.description ? validateBoardDescription(board.description) : null
  
  // Check if profile exists, create if not
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()
  
  if (profileError && profileError.code === 'PGRST116') {
    // Profile doesn't exist, create it
    logger.debug('Profile not found, creating profile for user')
    const { error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || null
      })
    
    if (createProfileError) {
      logger.error('Error creating profile:', createProfileError)
      throw new Error(`Failed to create user profile: ${createProfileError.message}`)
    }
  } else if (profileError) {
    logger.error('Error checking profile:', profileError)
    throw new Error(`Profile check failed: ${profileError.message}`)
  }

  const { data, error } = await supabase
    .from('boards')
    .insert({ title: validTitle, description: validDescription, user_id: user.id })
    .select()
    .single()

  if (error) {
    logger.error('Error inserting board:', error)
    throw new Error(`Failed to create board: ${error.message}`)
  }

  // Create default columns
  const defaultColumns = [
    { title: 'To Do', position: 0 },
    { title: 'Doing', position: 1 },
    { title: 'Done', position: 2 }
  ]

  const { error: columnsError } = await supabase
    .from('columns')
    .insert(
      defaultColumns.map(col => ({
        ...col,
        board_id: data.id
      }))
    )

  if (columnsError) {
    logger.error('Error creating columns:', columnsError)
    throw new Error(`Failed to create board columns: ${columnsError.message}`)
  }

  logger.debug('Default columns created successfully')
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
  
  // Get user for rate limiting
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Rate limiting
  if (isRateLimited(`createTask:${user.id}`, RATE_LIMITS.WRITE)) {
    throw new RateLimitError('Too many tasks created. Please wait a moment.', Date.now() + 60000)
  }
  
  // Check task limit per board
  const { count: activeTaskCount, error: countError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('board_id', task.board_id)
    .eq('archived', false)
  
  if (countError) {
    logger.error('Error counting active tasks:', countError)
    throw new Error('Failed to check task limit')
  }
  
  // Both Free and Pro have the same active task limit per board
  const taskLimit = PLAN_LIMITS.FREE.ACTIVE_TASKS_PER_BOARD
  
  if (activeTaskCount !== null && activeTaskCount >= taskLimit) {
    throw new Error(`Task limit reached. This board has ${activeTaskCount} active tasks. Archive some tasks to make room, or upgrade to Pro for higher limits.`)
  }
  
  // Input validation
  const validTitle = validateTaskTitle(task.title)
  const validDescription = task.description ? validateTaskDescription(task.description) : null
  const validCategory = validateCategory(task.category)
  
  // Increment all existing task positions in the column to make room at position 0
  const { error: updateError } = await supabase.rpc('increment_task_positions', {
    p_column_id: task.column_id
  })
  
  // If the RPC doesn't exist, fall back to manual update
  if (updateError?.code === '42883') {
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id, position')
      .eq('column_id', task.column_id)
      .order('position', { ascending: true })
    
    if (existingTasks && existingTasks.length > 0) {
      // Update positions in batch (increment each by 1)
      for (const existingTask of existingTasks) {
        await supabase
          .from('tasks')
          .update({ position: existingTask.position + 1 })
          .eq('id', existingTask.id)
      }
    }
  }

  // Insert new task at position 0 (top of column)
  const { data, error } = await supabase
    .from('tasks')
    .insert({ 
      title: validTitle, 
      description: validDescription,
      category: validCategory,
      column_id: task.column_id,
      board_id: task.board_id,
      position: 0
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
  const supabase = createClient()
  
  // Get user for rate limiting
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Rate limiting
  if (isRateLimited(`updateTask:${user.id}`, RATE_LIMITS.WRITE)) {
    throw new RateLimitError('Too many updates. Please wait a moment.', Date.now() + 60000)
  }
  
  // Input validation
  const validatedUpdates: TaskUpdate = {}
  if (updates.title !== undefined) {
    validatedUpdates.title = validateTaskTitle(updates.title)
  }
  if (updates.description !== undefined) {
    validatedUpdates.description = updates.description ? validateTaskDescription(updates.description) : null
  }
  if (updates.category !== undefined) {
    validatedUpdates.category = validateCategory(updates.category)
  }
  if (updates.position !== undefined) {
    validatedUpdates.position = updates.position
  }
  if (updates.column_id !== undefined) {
    validatedUpdates.column_id = updates.column_id
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .update(validatedUpdates)
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
  logger.debug('moveTask called:', { taskId, newColumnId, newPosition })
  
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

  // Get all tasks in affected columns
  const columnsToUpdate = oldColumnId === newColumnId ? [oldColumnId] : [oldColumnId, newColumnId]
  
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('id, column_id, position')
    .eq('board_id', boardId)
    .in('column_id', columnsToUpdate)
    .order('position', { ascending: true })

  if (!allTasks) return

  // Separate tasks by column
  const oldColumnTasks = allTasks.filter(t => t.column_id === oldColumnId && t.id !== taskId)
  const newColumnTasks = oldColumnId === newColumnId 
    ? oldColumnTasks 
    : allTasks.filter(t => t.column_id === newColumnId)

  // Insert the moved task at the new position
  const movedTask = { id: taskId, column_id: newColumnId, position: 0 }
  newColumnTasks.splice(newPosition, 0, movedTask)

  // Update old column tasks (if different from new column)
  if (oldColumnId !== newColumnId) {
    for (let i = 0; i < oldColumnTasks.length; i++) {
      const task = oldColumnTasks[i]
      await supabase
        .from('tasks')
        .update({ position: i })
        .eq('id', task.id)
    }
  }

  // Update new column tasks (including the moved task)
  for (let i = 0; i < newColumnTasks.length; i++) {
    const task = newColumnTasks[i]
    const updateData: any = { position: i }
    if (task.id === taskId) {
      updateData.column_id = newColumnId
    }
    
    await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', task.id)
  }
  
  logger.debug('moveTask completed successfully')
}

export async function archiveTask(taskId: string): Promise<void> {
  const supabase = createClient()
  
  // Get user for rate limiting
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Rate limiting
  if (isRateLimited(`archiveTask:${user.id}`, RATE_LIMITS.WRITE)) {
    throw new RateLimitError('Too many actions. Please wait a moment.', Date.now() + 60000)
  }
  
  const { error } = await supabase
    .from('tasks')
    .update({ 
      archived: true,
      archived_at: new Date().toISOString()
    })
    .eq('id', taskId)

  if (error) throw error
  logger.debug('Task archived successfully')
}

export async function unarchiveTask(taskId: string): Promise<void> {
  const supabase = createClient()
  
  // Get user for rate limiting
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Rate limiting
  if (isRateLimited(`unarchiveTask:${user.id}`, RATE_LIMITS.WRITE)) {
    throw new RateLimitError('Too many actions. Please wait a moment.', Date.now() + 60000)
  }
  
  const { error } = await supabase
    .from('tasks')
    .update({ 
      archived: false,
      archived_at: null
    })
    .eq('id', taskId)

  if (error) throw error
  logger.debug('Task unarchived successfully')
}

export async function getArchivedTasks(boardId: string): Promise<Task[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('board_id', boardId)
    .eq('archived', true)
    .order('archived_at', { ascending: false })

  if (error) throw error
  return data || []
}
