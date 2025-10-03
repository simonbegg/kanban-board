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
  onAddCategory: (category: string, color?: string) => void
  categoryColors?: Record<string, string>
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
]

export function AddTaskDialog({ onAddTask, availableCategories, onAddCategory, categoryColors }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0])
  const [showNewCategory, setShowNewCategory] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    let finalCategory = category
    // Check if user entered a new category (regardless of showNewCategory state)
    if (newCategory.trim()) {
      finalCategory = newCategory.trim().toLowerCase()
      onAddCategory(finalCategory, newCategoryColor)
    }

    // Convert special "none" value to empty string
    if (finalCategory === '__none__') {
      finalCategory = ''
    }

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
    setNewCategoryColor(DEFAULT_COLORS[0])
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
              <Label htmlFor="category">Category (optional)</Label>
              {!showNewCategory && availableCategories.length > 0 ? (
                <div className="flex gap-2">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
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
                <div className="space-y-3">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category name..."
                  />
                  <div>
                    <Label className="text-xs mb-2 block">Category Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-md border-2 transition-all ${
                            newCategoryColor === color
                              ? 'border-foreground scale-110'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewCategoryColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                  {availableCategories.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setShowNewCategory(false)
                        setNewCategory("")
                        setNewCategoryColor(DEFAULT_COLORS[0])
                      }}
                    >
                      Cancel
                    </Button>
                  )}
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
