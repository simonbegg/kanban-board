'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getBoards, createBoard } from '@/lib/api/boards'
import { Database } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { ValidationError } from '@/lib/validation'
import { RateLimitError } from '@/lib/rate-limit'

type Board = Database['public']['Tables']['boards']['Row']

interface BoardSelectorProps {
  selectedBoardId: string | null
  onBoardSelect: (boardId: string) => void
  onBoardsChange?: () => void
  refreshTrigger?: number
}

export function BoardSelector({ selectedBoardId, onBoardSelect, onBoardsChange, refreshTrigger }: BoardSelectorProps) {
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

    setCreating(true)
    try {
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
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-muted h-10 w-48 rounded-md"></div>
        <div className="animate-pulse bg-muted h-10 w-10 rounded-md"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedBoardId || ''} onValueChange={onBoardSelect}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select a board">
            {selectedBoardId && (
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {boards.find(b => b.id === selectedBoardId)?.title}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {boards.map((board) => (
            <SelectItem key={board.id} value={board.id}>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {board.title}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Board
          </Button>
        </DialogTrigger>
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
    </div>
  )
}
