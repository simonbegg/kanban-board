'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Folder, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getBoards, createBoard } from '@/lib/api/boards'
import { Database } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { ValidationError } from '@/lib/validation'
import { RateLimitError } from '@/lib/rate-limit'
import { getUserUsageStats } from '@/lib/cap-enforcement'
import { useAuth } from '@/contexts/auth-context'

type Board = Database['public']['Tables']['boards']['Row']

interface BoardSelectorProps {
  selectedBoardId: string | null
  onBoardSelect: (boardId: string) => void
  onBoardsChange?: () => void
  refreshTrigger?: number
}

export function BoardSelector({ selectedBoardId, onBoardSelect, onBoardsChange, refreshTrigger }: BoardSelectorProps) {
  const { user } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const loadBoards = useCallback(async () => {
    logger.debug('Loading boards')
    try {
      const boardsData = await getBoards()
      setBoards(boardsData)
      
      // If currently selected board no longer exists, clear selection
      if (selectedBoardId && !boardsData.some(b => b.id === selectedBoardId)) {
        logger.debug('Selected board no longer exists, clearing selection')
        onBoardSelect('')
        return
      }
      
      // If no board is selected and we have boards, select the first one
      if (!selectedBoardId && boardsData.length > 0) {
        logger.debug('Auto-selecting first board')
        onBoardSelect(boardsData[0].id)
      }
    } catch (error) {
      logger.error('Error loading boards:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedBoardId, onBoardSelect])

  useEffect(() => {
    loadBoards()
  }, [loadBoards])

  // Reload boards when refreshTrigger changes (but not on initial mount when it's 0)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      logger.debug('Reloading boards due to refresh trigger')
      loadBoards()
    }
  }, [refreshTrigger, loadBoards])

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardTitle.trim()) return
    if (!user) return

    setCreating(true)
    try {
      // Check if user can create more boards
      const usage = await getUserUsageStats(user.id)
      if (!usage || usage.boards >= usage.limits.boards) {
        // User has reached board limit, show upgrade prompt
        window.location.href = '/board?upgrade=true'
        return
      }

      const newBoard = await createBoard({
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim() || null,
      })
      
      setBoards(prev => [newBoard, ...prev])
      onBoardSelect(newBoard.id)
      onBoardsChange?.()
      
      // Reset form
      setNewBoardTitle('')
      setNewBoardDescription('')
      setCreateDialogOpen(false)
    } catch (error) {
      logger.error('Error creating board:', error)
      
      // Show user-friendly error messages
      let errorMessage = 'Failed to create board'
      if (error instanceof ValidationError) {
        errorMessage = error.message
      } else if (error instanceof RateLimitError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse bg-muted h-10 w-48 rounded-md"></div>
    )
  }

  const selectedBoard = boards.find(b => b.id === selectedBoardId)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/10 hover:border-primary/50 hover:text-primary">
            <Folder className="h-4 w-4" />
            <span className="hidden md:flex items-center gap-2">
              {selectedBoard && <span className="font-semibold">{selectedBoard.title}</span>}
              {selectedBoard && <span className="text-muted-foreground">|</span>}
              <span className={selectedBoard ? 'text-muted-foreground text-xs' : ''}>
                Switch or add boards
              </span>
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {boards.map((board) => (
            <DropdownMenuItem
              key={board.id}
              onClick={() => onBoardSelect(board.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span className="truncate">{board.title}</span>
                </div>
                {board.id === selectedBoardId && (
                  <Check className="h-4 w-4 ml-2 shrink-0" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <div className="flex items-center gap-2 w-full">
              <Plus className="h-4 w-4" />
              <span>Add new board</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateBoard}>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
              <DialogDescription>
                Create a new kanban board to organize your tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="Enter board title..."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="Enter board description..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Board'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
