"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import type { Task } from "./kanban-board"

interface EditTaskDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditTask: (taskId: string, updates: Partial<Task>) => void
  availableCategories: string[]
}

export function EditTaskDialog({ task, open, onOpenChange, onEditTask, availableCategories }: EditTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setCategory(task.category)
    }
  }, [task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!task || !title.trim()) return

    onEditTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      category,
    })

    onOpenChange(false)
  }

  const handleCancel = () => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setCategory(task.category)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Make changes to your task. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
