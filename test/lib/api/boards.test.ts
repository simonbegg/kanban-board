import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBoards, createBoard, updateBoard, deleteBoard } from '@/lib/api/boards'
import { createClient } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/validation', () => ({
  validateBoardTitle: vi.fn(() => 'Valid Board Title'),
  validateBoardDescription: vi.fn(() => 'Valid Description'),
  sanitizeString: vi.fn((input) => input),
  ValidationError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ValidationError'
    }
  },
  VALIDATION_LIMITS: {
    BOARD_TITLE_MIN: 1,
    BOARD_TITLE_MAX: 100,
    BOARD_DESCRIPTION_MAX: 500,
  },
}))

const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as any).mockReturnValue(mockSupabase)
})

describe('Board API', () => {
  it('gets boards successfully', async () => {
    const mockBoards = [
      { id: '1', name: 'Home', user_id: 'user1' },
      { id: '2', name: 'Work', user_id: 'user1' },
    ]

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockBoards,
          error: null,
        }),
      }),
    })

    const result = await getBoards()

    expect(mockSupabase.from).toHaveBeenCalledWith('boards')
    expect(result).toEqual(mockBoards)
  })

  it('handles get boards error', async () => {
    const mockError = { message: 'Failed to fetch boards' }

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    })

    await expect(getBoards()).rejects.toThrow('Failed to fetch boards')
  })

  it('creates board successfully', async () => {
    const newBoard = { name: 'New Board' }
    const createdBoard = { id: '3', name: 'New Board', user_id: 'user1' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user1' } },
      error: null,
    })

    // Mock profiles API call
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user1' },
            error: null,
          }),
        }),
      }),
    })

    // Mock boards API call
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createdBoard,
            error: null,
          }),
        }),
      }),
    })

    // Mock columns API call
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })

    const result = await createBoard(newBoard.name)

    expect(mockSupabase.from).toHaveBeenCalledWith('boards')
    expect(result).toEqual(createdBoard)
  })

  it('handles create board error', async () => {
    const mockError = { message: 'Failed to create board' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user1' } },
      error: null,
    })

    // Mock profiles API call
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user1' },
            error: null,
          }),
        }),
      }),
    })

    // Mock boards API call with error
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    })

    // Mock columns API call
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })

    await expect(createBoard('New Board')).rejects.toThrow('Failed to create board')
  })

  it('updates board successfully', async () => {
    const updatedBoard = { id: '1', name: 'Updated Board', user_id: 'user1' }

    // Fresh mock setup for this test
    const freshMock = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedBoard,
                error: null,
              }),
            }),
          }),
        }),
      }),
    }
    
    ;(createClient as any).mockReturnValue(freshMock)

    const result = await updateBoard('1', { name: 'Updated Board' })

    expect(freshMock.from).toHaveBeenCalledWith('boards')
    expect(result).toEqual(updatedBoard)
  })

  it('handles update board error', async () => {
    const mockError = { message: 'Failed to update board' }

    // Fresh mock setup for this test
    const freshMock = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      }),
    }
    
    ;(createClient as any).mockReturnValue(freshMock)

    await expect(updateBoard('1', { name: 'Updated Board' })).rejects.toThrow('Failed to update board')
  })

  it('deletes board successfully', async () => {
    // Fresh mock setup for this test
    const freshMock = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: { id: '1' },
            error: null,
          }),
        }),
      }),
    }
    
    ;(createClient as any).mockReturnValue(freshMock)

    await deleteBoard('1')

    expect(freshMock.from).toHaveBeenCalledWith('boards')
    expect(freshMock.from().delete).toHaveBeenCalled()
    expect(freshMock.from().delete().eq).toHaveBeenCalledWith('id', '1')
  })

  it('handles delete board error', async () => {
    const mockError = { message: 'Failed to delete board' }

    // Fresh mock setup for this test
    const freshMock = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    }
    
    ;(createClient as any).mockReturnValue(freshMock)

    await expect(deleteBoard('1')).rejects.toThrow('Failed to delete board')
  })
})
