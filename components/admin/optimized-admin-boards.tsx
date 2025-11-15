'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { logger } from '@/lib/logger'

interface AdminBoardsResponse {
  boards: BoardWithColumnsAndTasks[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  admin: string
  accessType: 'read_only'
  timestamp: string
}

interface BoardWithColumnsAndTasks {
  id: string
  name: string
  description: string | null
  user_id: string
  created_at: string
  updated_at: string
  columns: Array<{
    id: string
    name: string
    position: number
    tasks: Array<{
      id: string
      title: string
      description: string | null
      category: string | null
      position: number
      created_at: string
      updated_at: string
      archived: boolean
    }>
  }>
  taskCount: number
}

export function OptimizedAdminBoardsPanel() {
  const { user } = useAuth()
  const [boards, setBoards] = useState<BoardWithColumnsAndTasks[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState('')
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user?.email) return
    
    loadAdminBoards()
  }, [user, pagination.page, search, userId])

  const loadAdminBoards = async () => {
    if (!user?.email) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(userId && { userId })
      })
      
      const response = await fetch(`/api/admin/boards?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load admin boards')
      }
      
      const data: AdminBoardsResponse = await response.json()
      
      setBoards(data.boards)
      setPagination(data.pagination)
      
      logger.info('Admin boards loaded', { 
        boardCount: data.boards.length,
        totalCount: data.pagination.total,
        admin: data.admin 
      })
    } catch (error) {
      logger.error('Error loading admin boards:', error)
      setError(error instanceof Error ? error.message : 'Failed to load boards')
    } finally {
      setLoading(false)
    }
  }

  const toggleBoardExpansion = (boardId: string) => {
    setExpandedBoards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(boardId)) {
        newSet.delete(boardId)
      } else {
        newSet.add(boardId)
      }
      return newSet
    })
  }

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearch(value)
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 500),
    []
  )

  if (loading && pagination.page === 1) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading admin boards...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Admin Boards</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadAdminBoards}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-semibold flex items-center gap-2">
          <span className="text-xl">🔒</span>
          Read-Only Admin Access
        </h3>
        <p className="text-blue-600 text-sm mt-1">
          You have read-only access to all user boards. All access is logged for security.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search boards by name or description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <input
              type="text"
              placeholder="Filter by user ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                setUserId(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            All User Boards ({pagination.total})
          </h3>
          <p className="text-sm text-gray-600">
            Showing {boards.length} of {pagination.total} boards • Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
        
        <div className="divide-y">
          {boards.map((board) => (
            <div key={board.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg text-gray-900">
                      {board.name || 'Untitled Board'}
                    </h4>
                    <button
                      onClick={() => toggleBoardExpansion(board.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {expandedBoards.has(board.id) ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Owner: {board.user_id} • Created: {new Date(board.created_at).toLocaleDateString()}
                  </p>
                  {board.description && (
                    <p className="text-gray-700 mt-2">{board.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                    {board.columns.length} columns
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                    {board.taskCount} tasks
                  </span>
                </div>
              </div>

              {/* Expandable Board Details */}
              {expandedBoards.has(board.id) && (
                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {board.columns.map((column) => (
                      <div key={column.id} className="border rounded-lg p-3">
                        <h5 className="font-medium text-sm mb-2 text-gray-900">
                          {column.name || 'Untitled Column'}
                        </h5>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {column.tasks.slice(0, 10).map((task) => (
                            <div key={task.id} className="text-xs p-2 bg-gray-50 rounded">
                              <div className="font-medium text-gray-900">
                                {task.title || 'Untitled Task'}
                              </div>
                              {task.description && (
                                <div className="text-gray-600 mt-1">{task.description}</div>
                              )}
                              {task.category && (
                                <div className="text-gray-500 mt-1">Category: {task.category}</div>
                              )}
                            </div>
                          ))}
                          {column.tasks.length > 10 && (
                            <div className="text-xs text-gray-500 italic p-2">
                              ... and {column.tasks.length - 10} more tasks
                            </div>
                          )}
                          {column.tasks.length === 0 && (
                            <div className="text-xs text-gray-500 italic">No tasks</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {board.columns.length === 0 && (
                      <div className="col-span-full text-center text-gray-500 py-4">
                        No columns in this board
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {boards.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No boards found matching your criteria
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} boards
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNext}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}
