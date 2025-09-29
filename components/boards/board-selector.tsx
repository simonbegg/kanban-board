'use client'

import { useState, useEffect } from 'react'
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

type Board = Database['public']['Tables']['boards']['Row']

interface BoardSelectorProps {
  selectedBoardId: string | null
  onBoardSelect: (boardId: string) => void
}

export function BoardSelector({ selectedBoardId, onBoardSelect }: BoardSelectorProps) {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadBoards()
  }, [])

  const loadBoards = async () => {
    try {
      const boardsData = await getBoards()
      setBoards(boardsData)
      
      // If no board is selected and we have boards, select the first one
      if (!selectedBoardId && boardsData.length > 0) {
        onBoardSelect(boardsData[0].id)
      }
    } catch (error) {
      console.error('Error loading boards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardTitle.trim()) return

    setCreating(true)
    try {
      console.log('Creating board with data:', {
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim() || null,
      })
      
      const newBoard = await createBoard({
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim() || null,
      })
      
      console.log('Board created successfully:', newBoard)
      
      setBoards(prev => [newBoard, ...prev])
      onBoardSelect(newBoard.id)
      
      // Reset form
      setNewBoardTitle('')
      setNewBoardDescription('')
      setCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating board:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // Show user-friendly error
      alert(`Failed to create board: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
