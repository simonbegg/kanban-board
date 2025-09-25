"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./kanban-card"
import type { Column, Task } from "./kanban-board"

interface KanbanColumnProps {
  column: Column
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
}

export function KanbanColumn({ column, onEditTask, onDeleteTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{column.title}</h3>
        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">{column.tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] p-4 rounded-lg border-2 border-dashed transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-border bg-card/50"
        }`}
      >
        <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {column.tasks.map((task) => (
              <KanbanCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
