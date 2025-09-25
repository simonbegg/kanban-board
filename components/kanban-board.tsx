"use client"

import { useState } from "react"
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, closestCorners } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { AddTaskDialog } from "./add-task-dialog"
import { EditTaskDialog } from "./edit-task-dialog"
import { Button } from "./ui/button"

export interface Task {
  id: string
  title: string
  description: string
  category: string
  columnId: string
}

export interface Column {
  id: string
  title: string
  tasks: Task[]
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Design user authentication flow",
    description: "Create wireframes and mockups for the login and signup process",
    category: "feature",
    columnId: "todo",
  },
  {
    id: "2",
    title: "Fix responsive layout issues",
    description: "Address mobile viewport problems on the dashboard page",
    category: "bug",
    columnId: "todo",
  },
  {
    id: "3",
    title: "Implement drag and drop",
    description: "Add smooth drag and drop functionality to the kanban board",
    category: "feature",
    columnId: "doing",
  },
  {
    id: "4",
    title: "Optimize database queries",
    description: "Improve performance by optimizing slow database queries",
    category: "improvement",
    columnId: "doing",
  },
  {
    id: "5",
    title: "Setup CI/CD pipeline",
    description: "Configure automated testing and deployment workflows",
    category: "improvement",
    columnId: "done",
  },
]

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [sortBy, setSortBy] = useState<"none" | "category">("none")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    "feature",
    "bug",
    "improvement",
    "research",
  ])

  const columns: Column[] = [
    {
      id: "todo",
      title: "To Do",
      tasks: tasks
        .filter((task) => task.columnId === "todo")
        .sort((a, b) => {
          const aIndex = tasks.findIndex((t) => t.id === a.id)
          const bIndex = tasks.findIndex((t) => t.id === b.id)
          return aIndex - bIndex
        }),
    },
    {
      id: "doing",
      title: "Doing",
      tasks: tasks
        .filter((task) => task.columnId === "doing")
        .sort((a, b) => {
          const aIndex = tasks.findIndex((t) => t.id === a.id)
          const bIndex = tasks.findIndex((t) => t.id === b.id)
          return aIndex - bIndex
        }),
    },
    {
      id: "done",
      title: "Done",
      tasks: tasks
        .filter((task) => task.columnId === "done")
        .sort((a, b) => {
          const aIndex = tasks.findIndex((t) => t.id === a.id)
          const bIndex = tasks.findIndex((t) => t.id === b.id)
          return aIndex - bIndex
        }),
    },
  ]

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    console.log("[v0] Drag end - activeId:", activeId, "overId:", overId)

    // Find the active task
    const activeTask = tasks.find((task) => task.id === activeId)
    if (!activeTask) return

    // Determine if we're dropping over a task or a column
    const overTask = tasks.find((task) => task.id === overId)
    const overColumn = overTask ? overTask.columnId : overId

    console.log("[v0] Active column:", activeTask.columnId, "Over column:", overColumn)

    // If dropping over a column that doesn't exist, return
    if (!["todo", "doing", "done"].includes(overColumn)) return

    const activeColumn = activeTask.columnId

    setTasks((prevTasks) => {
      if (activeColumn === overColumn) {
        console.log("[v0] Moving within same column")

        // Get all tasks in the current column in their current order
        const columnTasks = prevTasks.filter((task) => task.columnId === activeColumn)
        const activeIndex = columnTasks.findIndex((task) => task.id === activeId)

        let newIndex: number
        if (overTask) {
          // Dropping over another task - insert before it
          newIndex = columnTasks.findIndex((task) => task.id === overId)
        } else {
          // Dropping over the column itself - add to end
          newIndex = columnTasks.length - 1
        }

        console.log("[v0] Moving from index", activeIndex, "to index", newIndex)

        // If no actual movement, return unchanged
        if (activeIndex === newIndex) {
          return prevTasks
        }

        // Reorder the column tasks
        const reorderedColumnTasks = arrayMove(columnTasks, activeIndex, newIndex)

        // Replace the column tasks in the main array while preserving other columns
        const otherTasks = prevTasks.filter((task) => task.columnId !== activeColumn)

        // Create new array with reordered column tasks inserted at appropriate positions
        const result = [...prevTasks]

        // Remove all tasks from this column
        for (let i = result.length - 1; i >= 0; i--) {
          if (result[i].columnId === activeColumn) {
            result.splice(i, 1)
          }
        }

        // Find insertion points and add reordered tasks
        let insertionIndex = 0
        for (const task of reorderedColumnTasks) {
          // Find where this task should go based on column order
          while (
            insertionIndex < result.length &&
            getColumnOrder(result[insertionIndex].columnId) < getColumnOrder(activeColumn)
          ) {
            insertionIndex++
          }
          result.splice(insertionIndex, 0, task)
          insertionIndex++
        }

        return result
      } else {
        console.log("[v0] Moving between columns")

        const targetColumnTasks = prevTasks.filter((task) => task.columnId === overColumn)

        let insertIndex: number
        if (overTask) {
          insertIndex = targetColumnTasks.findIndex((task) => task.id === overId)
        } else {
          insertIndex = targetColumnTasks.length
        }

        // Create updated task with new column
        const updatedTask = { ...activeTask, columnId: overColumn }

        // Remove original task
        const withoutActiveTask = prevTasks.filter((task) => task.id !== activeId)

        // Insert at correct position
        if (targetColumnTasks.length === 0) {
          // Empty column - just add the task
          return [...withoutActiveTask, updatedTask]
        } else if (insertIndex === 0) {
          // Insert at beginning of column
          const firstTaskInColumn = withoutActiveTask.find((task) => task.columnId === overColumn)
          if (firstTaskInColumn) {
            const firstTaskIndex = withoutActiveTask.findIndex((task) => task.id === firstTaskInColumn.id)
            withoutActiveTask.splice(firstTaskIndex, 0, updatedTask)
          } else {
            withoutActiveTask.push(updatedTask)
          }
        } else if (insertIndex >= targetColumnTasks.length) {
          // Insert at end of column
          const lastTaskInColumn = targetColumnTasks[targetColumnTasks.length - 1]
          const lastTaskIndex = withoutActiveTask.findIndex((task) => task.id === lastTaskInColumn.id)
          withoutActiveTask.splice(lastTaskIndex + 1, 0, updatedTask)
        } else {
          // Insert before target task
          const targetTask = targetColumnTasks[insertIndex]
          const targetTaskIndex = withoutActiveTask.findIndex((task) => task.id === targetTask.id)
          withoutActiveTask.splice(targetTaskIndex, 0, updatedTask)
        }

        return withoutActiveTask
      }
    })
  }

  const getColumnOrder = (columnId: string): number => {
    const order = { todo: 0, doing: 1, done: 2 }
    return order[columnId as keyof typeof order] ?? 999
  }

  const sortedColumns = columns.map((column) => ({
    ...column,
    tasks:
      sortBy === "category" ? [...column.tasks].sort((a, b) => a.category.localeCompare(b.category)) : column.tasks,
  }))

  const addNewTask = (taskData: Omit<Task, "id" | "columnId">) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...taskData,
      columnId: "todo",
    }
    setTasks((prev) => [...prev, newTask])
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setEditDialogOpen(true)
  }

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)))
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const handleAddCategory = (category: string) => {
    if (!availableCategories.includes(category)) {
      setAvailableCategories((prev) => [...prev, category])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant={sortBy === "none" ? "default" : "outline"} size="sm" onClick={() => setSortBy("none")}>
            Default Order
          </Button>
          <Button
            variant={sortBy === "category" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("category")}
          >
            Sort by Category
          </Button>
        </div>
        <AddTaskDialog
          onAddTask={addNewTask}
          availableCategories={availableCategories}
          onAddCategory={handleAddCategory}
        />
      </div>

      <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sortedColumns.map((column) => (
            <KanbanColumn key={column.id} column={column} onEditTask={handleEditTask} onDeleteTask={handleDeleteTask} />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <KanbanCard task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <EditTaskDialog
        task={editingTask}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onEditTask={handleUpdateTask}
        availableCategories={availableCategories}
      />
    </div>
  )
}
