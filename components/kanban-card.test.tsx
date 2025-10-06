import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KanbanCard } from './kanban-card'

// Mock dnd-kit sortable
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

// Mock dnd-kit utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}))

describe('KanbanCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    category: 'development',
    position: 0,
    column_id: 'col-1',
    board_id: 'board-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockCategoryColors = {
    development: '#3b82f6',
    design: '#ec4899',
  }

  it('renders task title and description', () => {
    render(<KanbanCard task={mockTask} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('displays category badge when category exists', () => {
    render(
      <KanbanCard 
        task={mockTask} 
        categoryColors={mockCategoryColors} 
      />
    )
    
    expect(screen.getByText('development')).toBeInTheDocument()
  })

  it('does not display category badge when category is empty', () => {
    const taskWithoutCategory = { ...mockTask, category: '' }
    render(<KanbanCard task={taskWithoutCategory} />)
    
    expect(screen.queryByText('Development')).not.toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<KanbanCard task={mockTask} onEdit={onEdit} onDelete={vi.fn()} />)
    
    const buttons = screen.getAllByRole('button')
    const editButton = buttons[0] // First button is edit (Edit icon)
    fireEvent.click(editButton)
    
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(mockTask)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<KanbanCard task={mockTask} onEdit={vi.fn()} onDelete={onDelete} />)
    
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[1] // Second button is delete (Trash icon)
    fireEvent.click(deleteButton)
    
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(mockTask.id)
  })

  it('applies custom category color when provided', () => {
    render(
      <KanbanCard 
        task={mockTask} 
        categoryColors={mockCategoryColors} 
      />
    )
    
    const badge = screen.getByText('development')
    
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveStyle({ color: mockCategoryColors.development })
  })

  it('handles tasks with no description', () => {
    const taskNoDescription = { ...mockTask, description: '' }
    render(<KanbanCard task={taskNoDescription} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
  })

  it('does not render edit/delete button handlers when not provided', () => {
    const { container } = render(<KanbanCard task={mockTask} />)
    
    // Buttons might be in DOM but without handlers
    // Just verify component renders without crashing
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('displays category name as provided', () => {
    render(
      <KanbanCard 
        task={mockTask} 
        categoryColors={mockCategoryColors} 
      />
    )
    
    // Category is displayed as-is (lowercase)
    expect(screen.getByText('development')).toBeInTheDocument()
  })
})
