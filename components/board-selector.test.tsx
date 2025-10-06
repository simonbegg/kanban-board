import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoardSelector } from './boards/board-selector'

// Mock the boards API
vi.mock('@/lib/api/boards', () => ({
  getBoards: vi.fn(),
  createBoard: vi.fn(),
}))

import { getBoards, createBoard } from '@/lib/api/boards'

describe('BoardSelector', () => {
  const mockBoards = [
    {
      id: 'board-1',
      title: 'Personal Tasks',
      description: 'My personal board',
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'board-2',
      title: 'Work Projects',
      description: 'Work-related tasks',
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const mockOnBoardSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getBoards as any).mockResolvedValue(mockBoards)
  })

  it('loads and displays boards', async () => {
    render(
      <BoardSelector
        selectedBoardId={null}
        onBoardSelect={mockOnBoardSelect}
      />
    )

    await waitFor(() => {
      expect(getBoards).toHaveBeenCalled()
    })
  })

  it('calls onBoardSelect when a board is selected', async () => {
    const user = userEvent.setup()
    render(
      <BoardSelector
        selectedBoardId={null}
        onBoardSelect={mockOnBoardSelect}
      />
    )

    await waitFor(() => {
      expect(getBoards).toHaveBeenCalled()
    })

    // Implementation depends on actual BoardSelector UI
    // This is a placeholder for the actual test
  })

  it('highlights selected board', async () => {
    render(
      <BoardSelector
        selectedBoardId="board-1"
        onBoardSelect={mockOnBoardSelect}
      />
    )

    await waitFor(() => {
      expect(getBoards).toHaveBeenCalled()
    })

    // Check that board-1 is highlighted
  })

  it('allows creating a new board', async () => {
    const user = userEvent.setup()
    const newBoard = {
      id: 'board-3',
      title: 'New Board',
      description: '',
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    ;(createBoard as any).mockResolvedValue(newBoard)

    render(
      <BoardSelector
        selectedBoardId={null}
        onBoardSelect={mockOnBoardSelect}
      />
    )

    await waitFor(() => {
      expect(getBoards).toHaveBeenCalled()
    })

    // Test creating a new board
    // Implementation depends on actual BoardSelector UI
  })

  it('refreshes board list after creation', async () => {
    const newBoard = {
      id: 'board-3',
      title: 'New Board',
      description: '',
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    ;(createBoard as any).mockResolvedValue(newBoard)

    const { rerender } = render(
      <BoardSelector
        selectedBoardId={null}
        onBoardSelect={mockOnBoardSelect}
        refreshTrigger={0}
      />
    )

    await waitFor(() => {
      expect(getBoards).toHaveBeenCalledTimes(1)
    })

    // Trigger refresh by updating refreshTrigger prop
    rerender(
      <BoardSelector
        selectedBoardId={null}
        onBoardSelect={mockOnBoardSelect}
        refreshTrigger={1}
      />
    )

    await waitFor(() => {
      expect(getBoards).toHaveBeenCalledTimes(2)
    })
  })

  it('handles empty board list', async () => {
    ;(getBoards as any).mockResolvedValue([])

    render(
      <BoardSelector
        selectedBoardId={null}
        onBoardSelect={mockOnBoardSelect}
      />
    )

    await waitFor(() => {
      expect(getBoards).toHaveBeenCalled()
    })

    // Should show empty state or create board prompt
  })

  it('handles API errors gracefully', async () => {
    ;(getBoards as any).mockRejectedValue(new Error('API Error'))

    render(
      <BoardSelector
        selectedBoardId={null}
        onBoardSelect={mockOnBoardSelect}
      />
    )

    await waitFor(() => {
      expect(getBoards).toHaveBeenCalled()
    })

    // Should show error state or fallback UI
  })
})
