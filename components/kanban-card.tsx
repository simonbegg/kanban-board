"use client"

import type React from "react"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Edit, Trash2 } from "lucide-react"
import type { Task } from "./kanban-board"

interface KanbanCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  categoryColors?: Record<string, string>
}

export function KanbanCard({ task, onEdit, onDelete, categoryColors }: KanbanCardProps) {
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
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50 rotate-3 scale-105" : ""}`}
      {...attributes}
      {...listeners}
    >
      <Card className="transition-all duration-200 hover:shadow-lg group">
        <CardHeader className="">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-medium text-card-foreground text-lg leading-tight">{task.title}</h4>
            </div>
            <div
              className="flex items-center gap-1"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost-icon"
                size="sm"
                className="h-6 w-6 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                onClick={handleEdit}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost-icon"
                size="sm"
                className="h-6 w-6 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{task.description}</p>
          {task.category && (
            <Badge
              variant="outline"
              className="text-xs border"
              style={
                categoryColors?.[task.category]
                  ? {
                    backgroundColor: `${categoryColors[task.category]}20`,
                    color: categoryColors[task.category],
                    borderColor: `${categoryColors[task.category]}50`,
                  }
                  : undefined
              }
            >
              {task.category}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
