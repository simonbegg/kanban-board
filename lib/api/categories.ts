import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']

/**
 * Get all categories for the current user
 */
export async function getCategories(): Promise<Record<string, string>> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('name, color')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return {}
  }

  // Convert array to Record<name, color>
  const categoryColors: Record<string, string> = {}
  data?.forEach((category) => {
    categoryColors[category.name] = category.color
  })

  return categoryColors
}

/**
 * Upsert (create or update) a category
 */
export async function upsertCategory(name: string, color: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('categories')
    .upsert(
      { 
        name, 
        color, 
        user_id: user.id 
      },
      {
        onConflict: 'user_id,name',
        ignoreDuplicates: false
      }
    )

  if (error) {
    console.error('Error upserting category:', error)
    throw error
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(name: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('name', name)

  if (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}

/**
 * Sync categories from tasks - creates categories for any that don't exist
 */
export async function syncCategoriesFromTasks(taskCategories: string[]): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get existing categories
  const existingCategories = await getCategories()
  
  // Default colors for new categories
  const defaultColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]
  
  let colorIndex = 0
  
  // Create any missing categories with default colors
  for (const categoryName of taskCategories) {
    if (!existingCategories[categoryName]) {
      const color = defaultColors[colorIndex % defaultColors.length]
      await upsertCategory(categoryName, color)
      colorIndex++
    }
  }
}
