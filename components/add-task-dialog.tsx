"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Plus } from "lucide-react"
import type { Task } from "./kanban-board"

interface AddTaskDialogProps {
  onAddTask: (task: Omit<Task, "id" | "columnId">) => void
  availableCategories: string[]
  onAddCategory: (category: string) => void
}

export function AddTaskDialog({ onAddTask, availableCategories, onAddCategory }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [showNewCategory, setShowNewCategory] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    let finalCategory = category
    if (showNewCategory && newCategory.trim()) {
      finalCategory = newCategory.trim().toLowerCase()
      onAddCategory(finalCategory)
    }

    if (!finalCategory) return

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      category: finalCategory,
    })

    // Reset form and close dialog
    setTitle("")
    setDescription("")
    setCategory("")
    setNewCategory("")
    setShowNewCategory(false)
    setOpen(false)
  }

  const handleCancel = () => {
    setTitle("")
    setDescription("")
    setCategory("")
    setNewCategory("")
    setShowNewCategory(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a new task for your kanban board. Fill in the details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              {!showNewCategory ? (
                <div className="flex gap-2">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="flex-1">
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
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCategory(true)}>
                    New
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category name..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewCategory(false)
                      setNewCategory("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
