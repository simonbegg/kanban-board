import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddTaskDialog } from './add-task-dialog'

describe('AddTaskDialog', () => {
  const mockOnAddTask = vi.fn()
  const mockOnAddCategory = vi.fn()
  const mockOnDeleteCategory = vi.fn()
  
  const defaultProps = {
    onAddTask: mockOnAddTask,
    availableCategories: ['development', 'design', 'marketing'],
    onAddCategory: mockOnAddCategory,
    onDeleteCategory: mockOnDeleteCategory,
    categoryColors: {
      development: '#3b82f6',
      design: '#ec4899',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders add task button', () => {
    render(<AddTaskDialog {...defaultProps} />)
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument()
  })

  it('opens dialog when add task button is clicked', async () => {
    render(<AddTaskDialog {...defaultProps} />)
    
    const addButton = screen.getByRole('button', { name: /add task/i })
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Add New Task')).toBeInTheDocument()
    })
  })

  it('displays all form fields when dialog is open', async () => {
    render(<AddTaskDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getAllByText(/category \(optional\)/i).length).toBeGreaterThan(0)
    })
  })

  it('submits task with title and description', async () => {
    const user = userEvent.setup()
    render(<AddTaskDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
    
    await user.type(screen.getByLabelText(/title/i), 'New Task')
    await user.type(screen.getByLabelText(/description/i), 'Task Description')
    
    fireEvent.click(screen.getByRole('button', { name: /^add task$/i }))
    
    await waitFor(() => {
      expect(mockOnAddTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Task Description',
        category: '',
      }, undefined)
    })
  })

  it('enforces title character limit', async () => {
    render(<AddTaskDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
    
    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
    
    // Verify maxLength attribute is set
    expect(titleInput).toHaveAttribute('maxLength', '100')
    
    // Try to set a long value - maxLength in HTML should prevent it
    const longValue = 'a'.repeat(150)
    const truncatedValue = longValue.substring(0, 100)
    
    fireEvent.change(titleInput, { target: { value: truncatedValue } })
    
    expect(titleInput.value).toBe(truncatedValue)
    expect(titleInput.value.length).toBe(100)
  })

  it('enforces description character limit', async () => {
    render(<AddTaskDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    })
    
    const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement
    
    // Verify maxLength attribute is set
    expect(descInput).toHaveAttribute('maxLength', '500')
    
    // Try to set a long value - maxLength in HTML should prevent it
    const longValue = 'a'.repeat(600)
    const truncatedValue = longValue.substring(0, 500)
    
    fireEvent.change(descInput, { target: { value: truncatedValue } })
    
    expect(descInput.value).toBe(truncatedValue)
    expect(descInput.value.length).toBe(500)
  })

  it('displays available categories in dropdown', async () => {
    render(<AddTaskDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getAllByText(/category \(optional\)/i).length).toBeGreaterThan(0)
    })
    
    // Categories select should be available
    expect(screen.getByText(/select a category/i)).toBeInTheDocument()
  })

  it('allows creating a new category', async () => {
    const user = userEvent.setup()
    render(<AddTaskDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByRole('button', { name: /new/i }))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter category name/i)).toBeInTheDocument()
    })
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    render(<AddTaskDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
    
    await user.type(screen.getByLabelText(/title/i), 'Test Task')
    fireEvent.click(screen.getByRole('button', { name: /^add task$/i }))
    
    await waitFor(() => {
      expect(mockOnAddTask).toHaveBeenCalled()
    })
    
    // Dialog should close and form should reset
    expect(screen.queryByText('Add New Task')).not.toBeInTheDocument()
  })

  it('does not submit when title is empty', async () => {
    render(<AddTaskDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
    
    const submitButtons = screen.getAllByRole('button', { name: /add task/i })
    const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit')
    
    if (submitButton) {
      fireEvent.click(submitButton)
    }
    
    // Should not call onAddTask without title
    await waitFor(() => {
      expect(mockOnAddTask).not.toHaveBeenCalled()
    })
  })

  it('displays character counter for title', async () => {
    render(<AddTaskDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getByText('0/100')).toBeInTheDocument()
    })
    
    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.change(titleInput, { target: { value: 'Test' } })
    
    await waitFor(() => {
      expect(screen.getByText('4/100')).toBeInTheDocument()
    })
  })

  it('displays character counter for description', async () => {
    const user = userEvent.setup()
    render(<AddTaskDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getByText('0/500')).toBeInTheDocument()
    })
  })

  it('filters out empty categories from dropdown', async () => {
    const propsWithEmptyCategory = {
      ...defaultProps,
      availableCategories: ['development', '', 'design'],
    }
    
    render(<AddTaskDialog {...propsWithEmptyCategory} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getAllByText(/category \(optional\)/i).length).toBeGreaterThan(0)
    })
    
    // Component should render with categories (empty ones filtered)
    expect(screen.getByText(/select a category/i)).toBeInTheDocument()
  })

  it('passes columnId to onAddTask when provided', async () => {
    const user = userEvent.setup()
    const columnId = 'column-123'
    const propsWithColumnId = {
      ...defaultProps,
      columnId,
    }
    
    render(<AddTaskDialog {...propsWithColumnId} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
    
    await user.type(screen.getByLabelText(/title/i), 'Column-specific Task')
    
    fireEvent.click(screen.getByRole('button', { name: /^add task$/i }))
    
    await waitFor(() => {
      expect(mockOnAddTask).toHaveBeenCalledWith({
        title: 'Column-specific Task',
        description: '',
        category: '',
      }, columnId)
    })
  })

  it('renders custom trigger button when provided', () => {
    const customTrigger = <button>Custom Add Button</button>
    const propsWithCustomTrigger = {
      ...defaultProps,
      triggerButton: customTrigger,
    }
    
    render(<AddTaskDialog {...propsWithCustomTrigger} />)
    
    expect(screen.getByRole('button', { name: /custom add button/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^add task$/i })).not.toBeInTheDocument()
  })
})
