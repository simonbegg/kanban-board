import { createClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

/**
 * Generate CSV export for a single board
 */
export async function generateBoardCSV(boardId: string, supabase?: SupabaseClient<Database>): Promise<string> {
  const client = supabase || createClient()
  
  // Get board with columns and tasks
  const { data: board, error } = await client
    .from('boards')
    .select(`
      title,
      description,
      columns:columns(
        title,
        tasks:tasks(
          title,
          description,
          category,
          position,
          archived,
          archived_at,
          created_at,
          updated_at
        )
      )
    `)
    .eq('id', boardId)
    .maybeSingle()
  
  if (error) throw error
  if (!board) throw new Error('Board not found')
  
  // CSV header
  let csv = 'Board,Column,Task Title,Description,Category,Position,Status,Archived At,Created At,Updated At\n'
  
  // Add rows
  for (const column of board.columns || []) {
    for (const task of column.tasks || []) {
      const row = [
        escapeCsvField(board.title),
        escapeCsvField(column.title),
        escapeCsvField(task.title),
        escapeCsvField(task.description || ''),
        escapeCsvField(task.category),
        task.position,
        task.archived ? 'Archived' : 'Active',
        task.archived_at || '',
        task.created_at,
        task.updated_at
      ]
      csv += row.join(',') + '\n'
    }
  }
  
  return csv
}

/**
 * Generate JSON export for entire account
 */
export async function generateAccountJSON(userId: string, supabase?: SupabaseClient<Database>): Promise<string> {
  const client = supabase || createClient()
  
  // Get all boards with full data
  const { data: boards, error } = await client
    .from('boards')
    .select(`
      id,
      title,
      description,
      created_at,
      updated_at,
      columns:columns(
        id,
        title,
        position,
        tasks:tasks(
          id,
          title,
          description,
          category,
          position,
          archived,
          archived_at,
          created_at,
          updated_at
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Get categories
  const { data: categories } = await client
    .from('categories')
    .select('category, color')
    .eq('user_id', userId)
  
  // Build export object
  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    boards: boards || [],
    categories: categories || [],
    summary: {
      total_boards: boards?.length || 0,
      total_active_tasks: boards?.reduce((sum, b) => 
        sum + (b.columns?.reduce((colSum, c) => 
          colSum + (c.tasks?.filter(t => !t.archived).length || 0), 0) || 0), 0) || 0,
      total_archived_tasks: boards?.reduce((sum, b) => 
        sum + (b.columns?.reduce((colSum, c) => 
          colSum + (c.tasks?.filter(t => t.archived).length || 0), 0) || 0), 0) || 0
    }
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Escape CSV field (handle quotes and commas)
 */
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Estimate export size (for determining immediate vs queued)
 */
export async function estimateExportSize(
  userId: string,
  exportType: 'board_csv' | 'account_json',
  boardId?: string,
  supabase?: SupabaseClient<Database>
): Promise<{ taskCount: number; shouldQueue: boolean }> {
  const client = supabase || createClient()
  
  if (exportType === 'board_csv' && boardId) {
    const { count } = await client
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('board_id', boardId)
    
    return {
      taskCount: count || 0,
      shouldQueue: (count || 0) > 1000
    }
  }
  
  // Account export
  const { data: boards } = await client
    .from('boards')
    .select('id')
    .eq('user_id', userId)
  
  if (!boards || boards.length === 0) {
    return { taskCount: 0, shouldQueue: false }
  }
  
  const { count } = await client
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('board_id', boards.map(b => b.id))
  
  return {
    taskCount: count || 0,
    shouldQueue: (count || 0) > 1000
  }
}
