"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./kanban-card"
import type { Column, Task } from "./kanban-board"

interface KanbanColumnProps {
  column: Column
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  activeId?: string | null
  overId?: string | null
  categoryColors?: Record<string, string>
}

export function KanbanColumn({ column, onEditTask, onDeleteTask, activeId, overId, categoryColors }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  // Check if dragging over this column or a task in this column
  const isDraggingOver = isOver || (overId && column.tasks.some(task => task.id === overId))
  
  // Find which task is being dragged over
  const overTask = overId ? column.tasks.find(task => task.id === overId) : null
  
  // Check if the active task is from a different column
  const isActiveFromDifferentColumn = activeId && !column.tasks.some(task => task.id === activeId)

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{column.title}</h3>
        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">{column.tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] p-4 rounded-lg border-2 border-dashed transition-colors ${
          isDraggingOver ? "border-primary bg-primary/5" : "border-border bg-card/50"
        }`}
      >
        <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {column.tasks.length === 0 && isActiveFromDifferentColumn && isDraggingOver && (
              <div className="h-20 border-2 border-dashed border-primary bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-sm text-primary/60">Drop here</span>
              </div>
            )}
            {column.tasks.map((task, index) => (
              <div key={task.id}>
                {isActiveFromDifferentColumn && overTask?.id === task.id && (
                  <div className="h-20 border-2 border-dashed border-primary bg-primary/10 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-sm text-primary/60">Drop here</span>
                  </div>
                )}
                <KanbanCard task={task} onEdit={onEditTask} onDelete={onDeleteTask} categoryColors={categoryColors} />
              </div>
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
