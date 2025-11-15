import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AddTaskDialog } from '@/components/add-task-dialog'

// Mock the API
vi.mock('@/lib/api/tasks', () => ({
  createTask: vi.fn().mockResolvedValue({
    id: '1',
    title: 'New Task',
    description: 'Task description',
    category: 'Work',
    column: 'todo',
    position: 1,
  }),
}))

describe('AddTaskDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <AddTaskDialog
        onAddTask={vi.fn()}
        availableCategories={['Work', 'Personal', 'Shopping']}
        onAddCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        columnId="todo"
      />
    )

    // Component should render successfully
    expect(document.body).toBeTruthy()
  })

  it('displays add task button', () => {
    render(
      <AddTaskDialog
        onAddTask={vi.fn()}
        availableCategories={['Work', 'Personal', 'Shopping']}
        onAddCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        columnId="todo"
      />
    )

    // Should have some interactive element
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
})
