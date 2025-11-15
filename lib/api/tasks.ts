// Mock tasks API for testing
export interface Task {
  id: string
  title: string
  description?: string
  category: string
  column: string
  position: number
  created_at: string
  user_id: string
}

export interface CreateTaskData {
  title: string
  description?: string
  category: string
}

export const createTask = async (data: CreateTaskData): Promise<Task> => {
  // Mock implementation - in real app this would call Supabase
  return {
    id: 'mock-task-id',
    title: data.title,
    description: data.description,
    category: data.category,
    column: 'todo',
    position: 1,
    created_at: new Date().toISOString(),
    user_id: 'mock-user-id',
  }
}
