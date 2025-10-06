'use client'

import { useState, useEffect } from 'react'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { getArchivedTasks, unarchiveTask, deleteTask } from '@/lib/api/boards'
import { Database } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { RateLimitError } from '@/lib/rate-limit'

type Task = Database['public']['Tables']['tasks']['Row']

interface ArchivedTasksDialogProps {
  boardId: string
  onTaskRestored: () => void
}

export function ArchivedTasksDialog({ boardId, onTaskRestored }: ArchivedTasksDialogProps) {
  const [open, setOpen] = useState(false)
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null)

  const loadArchivedTasks = async () => {
    if (!boardId) return
    
    setLoading(true)
    try {
      const tasks = await getArchivedTasks(boardId)
      setArchivedTasks(tasks)
    } catch (error) {
      logger.error('Error loading archived tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadArchivedTasks()
    }
  }, [open, boardId])

  const handleUnarchive = async (taskId: string) => {
    setProcessingTaskId(taskId)
    try {
      await unarchiveTask(taskId)
      setArchivedTasks(prev => prev.filter(t => t.id !== taskId))
      onTaskRestored()
    } catch (error) {
      logger.error('Error unarchiving task:', error)
      
      let errorMessage = 'Failed to restore task'
      if (error instanceof RateLimitError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setProcessingTaskId(null)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      return
    }

    setProcessingTaskId(taskId)
    try {
      await deleteTask(taskId)
      setArchivedTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (error) {
      logger.error('Error deleting task:', error)
      alert('Failed to delete task')
    } finally {
      setProcessingTaskId(null)
    }
  }

  const getCategoryColor = (category: string): string => {
    if (!category) return '#6b7280'
    
    // Try to get color from localStorage (for consistency with board)
    try {
      const stored = localStorage.getItem('kanban-category-colors')
      if (stored) {
        const colors = JSON.parse(stored)
        return colors[category] || '#6b7280'
      }
    } catch (e) {
      // Fallback color
    }
    
    return '#6b7280'
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Archive className="h-4 w-4" />
          Archived
          {archivedTasks.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {archivedTasks.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Tasks
          </DialogTitle>
          <DialogDescription>
            Restore archived tasks back to your board or permanently delete them.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : archivedTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No archived tasks</p>
            <p className="text-sm mt-2">Archived tasks will appear here</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium mb-1 truncate">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.category && (
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${getCategoryColor(task.category)}20`,
                              color: getCategoryColor(task.category),
                              borderColor: `${getCategoryColor(task.category)}40`,
                            }}
                            className="border"
                          >
                            {task.category}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Archived {formatDate(task.archived_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnarchive(task.id)}
                        disabled={processingTaskId === task.id}
                        className="gap-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                        disabled={processingTaskId === task.id}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
