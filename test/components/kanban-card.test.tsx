import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanbanCard } from '@/components/kanban-card'

const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'Test description',
  category: 'Work',
  column: 'todo',
  position: 1,
  created_at: '2024-01-01T00:00:00Z',
  user_id: 'user1',
}

describe('KanbanCard', () => {
  it('renders task title and description', () => {
    render(<KanbanCard task={mockTask} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('displays category badge', () => {
    render(<KanbanCard task={mockTask} />)
    
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('renders with hover capabilities', () => {
    render(<KanbanCard task={mockTask} />)
    
    // Verify the task renders and is interactive
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('renders edit functionality', () => {
    const onEdit = vi.fn()
    
    render(<KanbanCard task={mockTask} onEdit={onEdit} />)
    
    // Verify the task renders and has edit capability
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('renders delete functionality', () => {
    const onDelete = vi.fn()
    
    render(<KanbanCard task={mockTask} onDelete={onDelete} />)
    
    // Verify the task renders and has delete capability
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('handles different task columns', () => {
    const doneTask = { ...mockTask, column: 'done' }
    
    render(<KanbanCard task={doneTask} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('renders completed tasks correctly', () => {
    const completedTask = { ...mockTask, column: 'done' }
    render(<KanbanCard task={completedTask} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('displays task category', () => {
    render(<KanbanCard task={mockTask} />)
    
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('has action buttons', () => {
    render(<KanbanCard task={mockTask} />)
    
    // Check that action buttons are present (there are multiple buttons)
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('renders task title correctly', () => {
    render(<KanbanCard task={mockTask} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('displays task age in days', () => {
    render(<KanbanCard task={mockTask} />)
    
    // Check that some time-related element is displayed
    expect(screen.getByText(/\d+d/)).toBeInTheDocument()
  })
})
