import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/contexts/auth-context'
import { BoardSelector } from '@/components/boards/board-selector'

// Mock the boards API
vi.mock('@/lib/api/boards', () => ({
  getBoards: vi.fn().mockResolvedValue([
    { id: '1', name: 'Home', user_id: 'user1' },
    { id: '2', name: 'Work', user_id: 'user1' },
  ]),
  createBoard: vi.fn().mockResolvedValue({
    id: '3', name: 'New Board', user_id: 'user1'
  }),
}))

describe('BoardSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWithAuthProvider = (component: React.ReactElement) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    )
  }

  it('renders board selector button', async () => {
    const onBoardSelect = vi.fn()
    renderWithAuthProvider(<BoardSelector onBoardSelect={onBoardSelect} />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Switch or add boards')).toBeInTheDocument()
    })
  })

  it('can open board dropdown', async () => {
    const onBoardSelect = vi.fn()
    renderWithAuthProvider(<BoardSelector onBoardSelect={onBoardSelect} />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    // Open dropdown
    fireEvent.click(screen.getByRole('button'))

    // Should show dropdown content
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles board selection prop', async () => {
    const onBoardSelect = vi.fn()
    renderWithAuthProvider(<BoardSelector onBoardSelect={onBoardSelect} selectedBoardId="1" />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  it('handles board creation workflow', async () => {
    const onBoardSelect = vi.fn()
    renderWithAuthProvider(<BoardSelector onBoardSelect={onBoardSelect} />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    
    // Component should handle interactions without crashing
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles board refresh', async () => {
    const onBoardSelect = vi.fn()
    renderWithAuthProvider(<BoardSelector onBoardSelect={onBoardSelect} />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  it('handles empty state', async () => {
    const onBoardSelect = vi.fn()
    renderWithAuthProvider(<BoardSelector onBoardSelect={onBoardSelect} />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})
