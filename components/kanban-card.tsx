"use client"

import type React from "react"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { GripVertical, Edit, Trash2 } from "lucide-react"
import type { Task } from "./kanban-board"

interface KanbanCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
}

const categoryColors = {
  feature: "bg-primary/20 text-primary border-primary/30",
  bug: "bg-destructive/20 text-destructive border-destructive/30",
  improvement: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  research: "bg-chart-4/20 text-chart-4 border-chart-4/30",
}

export function KanbanCard({ task, onEdit, onDelete }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onEdit?.(task)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onDelete?.(task.id)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 hover:shadow-lg group ${
        isDragging ? "opacity-50 rotate-3 scale-105" : ""
      }`}
      {...attributes}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div 
            className="flex-1 cursor-grab active:cursor-grabbing"
            {...listeners}
          >
            <h4 className="font-medium text-card-foreground text-sm leading-tight">{task.title}</h4>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
              onClick={handleEdit}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <div 
              className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab active:cursor-grabbing"
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 cursor-grab active:cursor-grabbing" {...listeners}>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{task.description}</p>
        <Badge
          variant="outline"
          className={`text-xs ${categoryColors[task.category as keyof typeof categoryColors] || "bg-muted/20 text-muted-foreground border-muted/30"}`}
        >
          {task.category}
        </Badge>
      </CardContent>
    </Card>
  )
}
