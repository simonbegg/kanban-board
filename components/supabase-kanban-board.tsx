"use client"

import { useState, useEffect } from "react"
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, type DragOverEvent, closestCorners } from "@dnd-kit/core"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { AddTaskDialog } from "./add-task-dialog"
import { EditTaskDialog } from "./edit-task-dialog"
import { Button } from "./ui/button"
import { BoardSelector } from "./boards/board-selector"
import { BoardActions } from "./boards/board-actions"
import { getBoardWithData, createTask, updateTask, deleteTask, moveTask, BoardWithColumnsAndTasks } from "@/lib/api/boards"
import { Database } from "@/lib/supabase"

type Task = Database['public']['Tables']['tasks']['Row']
type Column = Database['public']['Tables']['columns']['Row'] & { tasks: Task[] }

// Legacy task interface for compatibility with existing components
export interface LegacyTask {
  id: string
  title: string
  description: string
  category: string
  columnId: string
}

// Legacy column interface for compatibility
export interface LegacyColumn {
  id: string
  title: string
  tasks: LegacyTask[]
}

export function SupabaseKanbanBoard() {
  const [boardData, setBoardData] = useState<BoardWithColumnsAndTasks | null>(null)
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<LegacyTask | null>(null)
  const [sortBy, setSortBy] = useState<"none" | "category">("none")
  const [editingTask, setEditingTask] = useState<LegacyTask | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    "feature",
    "bug",
    "improvement",
    "research",
  ])
  const [isDragging, setIsDragging] = useState(false)
  const [overId, setOverId] = useState<string | null>(null)
  const [boardRefreshTrigger, setBoardRefreshTrigger] = useState(0)

  useEffect(() => {
    if (selectedBoardId) {
      loadBoardData()
    }
  }, [selectedBoardId])

  const loadBoardData = async () => {
    if (!selectedBoardId) return

    setLoading(true)
    try {
      const data = await getBoardWithData(selectedBoardId)
      setBoardData(data)

      // Extract unique categories from tasks
      if (data) {
        const categories = new Set<string>()
        data.columns.forEach(column => {
          column.tasks.forEach(task => {
            categories.add(task.category)
          })
        })
        setAvailableCategories(prev => {
          const newCategories = Array.from(categories)
          return [...new Set([...prev, ...newCategories])]
        })
      }
    } catch (error) {
      console.error('Error loading board data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Convert Supabase data to legacy format for existing components
  const convertToLegacyFormat = (columns: Column[]): LegacyColumn[] => {
    return columns.map(column => ({
      id: column.id,
      title: column.title,
      tasks: column.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        category: task.category,
        columnId: column.id
      }))
    }))
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!boardData) return

    const task = boardData.columns
      .flatMap(col => col.tasks)
      .find(t => t.id === event.active.id)

    if (task) {
      const column = boardData.columns.find(col => col.tasks.some(t => t.id === task.id))
      setActiveTask({
        id: task.id,
        title: task.title,
        description: task.description || '',
        category: task.category,
        columnId: column?.id || ''
      })
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over ? over.id as string : null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setOverId(null)

    if (!over || !boardData || isDragging) return

    setIsDragging(true)

    const activeId = active.id as string
    const overId = over.id as string

    console.log('=== DRAG END START ===')
    console.log('Active ID:', activeId)
    console.log('Over ID:', overId)

    // Find the active task
    const activeTask = boardData.columns
      .flatMap(col => col.tasks)
      .find(task => task.id === activeId)

    if (!activeTask) {
      console.log('Active task not found!')
      return
    }

    console.log('Active task:', activeTask)

    // Find current column
    const currentColumn = boardData.columns.find(col =>
      col.tasks.some(t => t.id === activeId)
    )
    if (!currentColumn) {
      console.log('Current column not found!')
      return
    }

    console.log('Current column:', currentColumn.id, 'title:', currentColumn.title)

    // Determine target column and position
    let targetColumnId: string
    let newIndex: number // This will be the final array index where we want the task

    // Check if dropping over a task or column
    const overTask = boardData.columns
      .flatMap(col => col.tasks)
      .find(task => task.id === overId)

    if (overTask) {
      console.log('Dropping over task:', overTask)

      // Dropping over a task - insert before this task
      const targetColumn = boardData.columns.find(col =>
        col.tasks.some(t => t.id === overId)
      )
      if (!targetColumn) {
        console.log('Target column not found!')
        return
      }

      targetColumnId = targetColumn.id
      console.log('Target column:', targetColumnId, 'title:', targetColumn.title)

      // Sort target column tasks to get correct visual order
      const sortedTasks = [...targetColumn.tasks].sort((a, b) => a.position - b.position)
      console.log('Sorted target tasks:', sortedTasks.map(t => ({ id: t.id, title: t.title, position: t.position })))

      const overTaskIndex = sortedTasks.findIndex(t => t.id === overId)
      console.log('Over task index:', overTaskIndex)

      if (currentColumn.id === targetColumnId) {
        console.log('Moving within same column')

        // Moving within same column
        const currentIndex = sortedTasks.findIndex(t => t.id === activeId)
        console.log('Current index:', currentIndex)

        if (currentIndex < overTaskIndex) {
          // Moving down: we want to end up just before the target task
          // But since we remove the task first, this becomes the target's index
          newIndex = overTaskIndex
          console.log('Moving down, newIndex:', newIndex)
        } else {
          // Moving up: we want to end up at the target task's current position
          newIndex = overTaskIndex
          console.log('Moving up, newIndex:', newIndex)
        }
      } else {
        console.log('Moving between columns')
        // Moving between columns: insert at the target task's position
        newIndex = overTaskIndex
        console.log('Cross-column, newIndex:', newIndex)
      }
    } else {
      console.log('Dropping over column (empty space)')

      // Dropping over a column (empty space) - insert at end
      targetColumnId = overId
      const targetColumn = boardData.columns.find(col => col.id === overId)
      newIndex = targetColumn?.tasks.length || 0
      console.log('Empty space drop, newIndex:', newIndex)
    }

    // Don't move if dropping in the same position
    if (currentColumn.id === targetColumnId) {
      const sortedCurrentTasks = [...currentColumn.tasks].sort((a, b) => a.position - b.position)
      const currentIndex = sortedCurrentTasks.findIndex(t => t.id === activeId)
      console.log('Same position check - currentIndex:', currentIndex, 'newIndex:', newIndex)
      if (currentIndex === newIndex) {
        console.log('Same position, returning early')
        return
      }
    }

    console.log('=== STARTING OPTIMISTIC UPDATE ===')
    console.log('Final target column:', targetColumnId)
    console.log('Final newIndex:', newIndex)

    // Optimistic update - update UI immediately
    setBoardData(prevData => {
      if (!prevData) return prevData

      console.log('Before optimistic update:', prevData.columns.map(col => ({
        id: col.id,
        title: col.title,
        tasks: col.tasks.map(t => ({ id: t.id, title: t.title, position: t.position }))
      })))

      const newColumns = [...prevData.columns]

      if (currentColumn.id === targetColumnId) {
        // Moving within the same column
        const columnIndex = newColumns.findIndex(col => col.id === currentColumn.id)
        const column = { ...newColumns[columnIndex] }

        // Sort tasks by position to get correct visual order
        const tasks = [...column.tasks].sort((a, b) => a.position - b.position)

        console.log('Same column move - before:', tasks.map(t => ({ id: t.id, title: t.title, position: t.position })))

        // Find the task to move
        const currentIndex = tasks.findIndex(t => t.id === activeId)
        const taskToMove = tasks[currentIndex]
        console.log('Task to move:', taskToMove)
        console.log('Current index in array:', currentIndex)

        if (!taskToMove) return prevData

        // Remove task from current position
        tasks.splice(currentIndex, 1)
        console.log('After removal:', tasks.map(t => ({ id: t.id, title: t.title, position: t.position })))

        // Insert at new position
        // The newIndex already accounts for what we want visually
        // After removing the task, we just insert at newIndex directly
        const insertIndex = newIndex
        
        console.log('Insert index calculation: currentIndex:', currentIndex, 'newIndex:', newIndex)
        console.log('Final insert index:', insertIndex)
        
        tasks.splice(insertIndex, 0, taskToMove)
        console.log('After insertion:', tasks.map(t => ({ id: t.id, title: t.title, position: t.position })))

        // Update positions
        column.tasks = tasks.map((task, index) => ({
          ...task,
          position: index
        }))

        console.log('Final column tasks:', column.tasks.map(t => ({ id: t.id, title: t.title, position: t.position })))

        newColumns[columnIndex] = column
      } else {
        // Moving between different columns
        const sourceColumnIndex = newColumns.findIndex(col => col.id === currentColumn.id)
        const targetColumnIndex = newColumns.findIndex(col => col.id === targetColumnId)

        const sourceColumn = { ...newColumns[sourceColumnIndex] }
        const targetColumn = { ...newColumns[targetColumnIndex] }

        // Remove from source column
        sourceColumn.tasks = sourceColumn.tasks.filter(t => t.id !== activeId)

        // Sort target column tasks by position
        const targetTasks = [...targetColumn.tasks].sort((a, b) => a.position - b.position)

        // Create updated task with new column_id
        const updatedTask = { ...activeTask, column_id: targetColumnId }

        // For cross-column moves, insert at the calculated newIndex
        const insertIndex = Math.max(0, Math.min(newIndex, targetTasks.length))
        targetTasks.splice(insertIndex, 0, updatedTask)

        // Update positions for both columns
        sourceColumn.tasks = sourceColumn.tasks.map((task, index) => ({
          ...task,
          position: index
        }))

        targetColumn.tasks = targetTasks.map((task, index) => ({
          ...task,
          position: index
        }))

        newColumns[sourceColumnIndex] = sourceColumn
        newColumns[targetColumnIndex] = targetColumn
      }

      return {
        ...prevData,
        columns: newColumns
      }
    })

    // Update database in background
    console.log('=== CALLING DATABASE UPDATE ===')

    // Calculate the database position (same as newIndex - no adjustment needed)
    const databasePosition = newIndex

    console.log('Calling moveTask with:', { taskId: activeId, targetColumnId, databasePosition })


    try {
      await moveTask(activeId, targetColumnId, databasePosition)
      console.log('Database update successful')
    } catch (error) {
      console.error('Error moving task:', error)
      console.log('Reverting optimistic update due to error')
      // Revert optimistic update on error
      await loadBoardData()
    }

    console.log('=== DRAG END COMPLETE ===')
    setIsDragging(false)
  }

  const addNewTask = async (taskData: Omit<LegacyTask, "id" | "columnId">) => {
    if (!boardData || !selectedBoardId) return

    // Default to first column (To Do)
    const firstColumn = boardData.columns[0]
    if (!firstColumn) return

    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`
    const newPosition = firstColumn.tasks.length

    // Optimistic update - add task to UI immediately
    setBoardData(prevData => {
      if (!prevData) return prevData

      const newColumns = [...prevData.columns]
      const columnIndex = newColumns.findIndex(col => col.id === firstColumn.id)
      const column = { ...newColumns[columnIndex] }

      const newTask = {
        id: tempId,
        title: taskData.title,
        description: taskData.description || '',
        category: taskData.category,
        column_id: firstColumn.id,
        board_id: selectedBoardId,
        position: newPosition,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      column.tasks = [...column.tasks, newTask]
      newColumns[columnIndex] = column

      return {
        ...prevData,
        columns: newColumns
      }
    })

    try {
      const createdTask = await createTask({
        title: taskData.title,
        description: taskData.description || null,
        category: taskData.category,
        column_id: firstColumn.id,
        board_id: selectedBoardId,
      })

      // Replace temporary task with real task
      setBoardData(prevData => {
        if (!prevData) return prevData

        const newColumns = [...prevData.columns]
        const columnIndex = newColumns.findIndex(col => col.id === firstColumn.id)
        const column = { ...newColumns[columnIndex] }

        column.tasks = column.tasks.map(task =>
          task.id === tempId ? createdTask : task
        )
        newColumns[columnIndex] = column

        return {
          ...prevData,
          columns: newColumns
        }
      })
    } catch (error) {
      console.error('Error creating task:', error)
      // Remove temporary task on error
      setBoardData(prevData => {
        if (!prevData) return prevData

        const newColumns = [...prevData.columns]
        const columnIndex = newColumns.findIndex(col => col.id === firstColumn.id)
        const column = { ...newColumns[columnIndex] }

        column.tasks = column.tasks.filter(task => task.id !== tempId)
        newColumns[columnIndex] = column

        return {
          ...prevData,
          columns: newColumns
        }
      })
    }
  }

  const handleEditTask = (task: LegacyTask) => {
    setEditingTask(task)
    setEditDialogOpen(true)
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<LegacyTask>) => {
    // Optimistic update - update UI immediately
    setBoardData(prevData => {
      if (!prevData) return prevData

      const newColumns = [...prevData.columns]

      for (let i = 0; i < newColumns.length; i++) {
        const column = { ...newColumns[i] }
        const taskIndex = column.tasks.findIndex(t => t.id === taskId)

        if (taskIndex !== -1) {
          column.tasks = [...column.tasks]
          column.tasks[taskIndex] = {
            ...column.tasks[taskIndex],
            ...updates,
            updated_at: new Date().toISOString()
          }
          newColumns[i] = column
          break
        }
      }

      return {
        ...prevData,
        columns: newColumns
      }
    })

    try {
      await updateTask(taskId, {
        title: updates.title,
        description: updates.description,
        category: updates.category,
      })
    } catch (error) {
      console.error('Error updating task:', error)
      // Revert optimistic update on error
      await loadBoardData()
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    // Store original data for potential revert
    const originalData = boardData

    // Optimistic update - remove task from UI immediately
    setBoardData(prevData => {
      if (!prevData) return prevData

      const newColumns = [...prevData.columns]

      for (let i = 0; i < newColumns.length; i++) {
        const column = { ...newColumns[i] }
        const taskIndex = column.tasks.findIndex(t => t.id === taskId)

        if (taskIndex !== -1) {
          column.tasks = column.tasks.filter(t => t.id !== taskId)
          // Update positions
          column.tasks = column.tasks.map((task, index) => ({
            ...task,
            position: index
          }))
          newColumns[i] = column
          break
        }
      }

      return {
        ...prevData,
        columns: newColumns
      }
    })

    try {
      await deleteTask(taskId)
    } catch (error) {
      console.error('Error deleting task:', error)
      // Revert optimistic update on error
      setBoardData(originalData)
    }
  }

  const handleAddCategory = (category: string) => {
    if (!availableCategories.includes(category)) {
      setAvailableCategories(prev => [...prev, category])
    }
  }

  if (!selectedBoardId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <BoardSelector
            selectedBoardId={selectedBoardId}
            onBoardSelect={setSelectedBoardId}
          />
        </div>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground">
            Select or create a board to get started
          </h3>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <BoardSelector
            selectedBoardId={selectedBoardId}
            onBoardSelect={setSelectedBoardId}
          />
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading board...</p>
        </div>
      </div>
    )
  }

  if (!boardData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <BoardSelector
            selectedBoardId={selectedBoardId}
            onBoardSelect={setSelectedBoardId}
          />
        </div>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground">
            Board not found
          </h3>
        </div>
      </div>
    )
  }

  const legacyColumns = convertToLegacyFormat(boardData.columns)
  const sortedColumns = legacyColumns.map((column) => ({
    ...column,
    tasks:
      sortBy === "category"
        ? [...column.tasks].sort((a, b) => a.category.localeCompare(b.category))
        : column.tasks,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BoardSelector
          selectedBoardId={selectedBoardId}
          onBoardSelect={setSelectedBoardId}
          refreshTrigger={boardRefreshTrigger}
        />

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
          <AddTaskDialog
            onAddTask={addNewTask}
            availableCategories={availableCategories}
            onAddCategory={handleAddCategory}
          />
        </div>
      </div>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{boardData.title}</h2>
          {boardData.description && (
            <p className="text-muted-foreground">{boardData.description}</p>
          )}
        </div>
        <BoardActions
          board={boardData}
          onBoardUpdated={loadBoardData}
          onBoardDeleted={() => {
            console.log('Board deleted, clearing selection and refreshing list')
            setBoardData(null)
            setSelectedBoardId(null)
            // Use setTimeout to ensure state updates before triggering refresh
            setTimeout(() => {
              setBoardRefreshTrigger(prev => prev + 1)
            }, 0)
          }}
        />
      </div>

      <DndContext 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart} 
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sortedColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              activeId={activeTask?.id || null}
              overId={overId}
            />
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
        onAddCategory={handleAddCategory}
      />
    </div>
  )
}
