'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { logger } from '@/lib/logger'
import { BoardWithColumnsAndTasks } from '@/lib/api/boards'

interface AdminBoardsResponse {
  boards: BoardWithColumnsAndTasks[]
  pagination?: {
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

export function AdminBoardsPanel() {
  const { user } = useAuth()
  const [boards, setBoards] = useState<BoardWithColumnsAndTasks[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.email) return
    
    loadAdminBoards()
  }, [user])

  const loadAdminBoards = async () => {
    if (!user?.email) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/boards')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load admin boards')
      }
      
      const data: AdminBoardsResponse = await response.json()
      
      logger.info('Admin boards loaded', { 
        boardCount: data.boards.length,
        admin: data.admin 
      })
      
      setBoards(data.boards)
    } catch (error) {
      logger.error('Error loading admin boards:', error)
      setError(error instanceof Error ? error.message : 'Failed to load boards')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">All User Boards ({boards.length})</h3>
          <p className="text-sm text-gray-600">
            Complete view of all boards with columns and tasks
          </p>
        </div>
        
        <div className="divide-y">
          {boards.map((board) => (
            <div key={board.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg text-gray-900">
                    {board.name || 'Untitled Board'}
                  </h4>
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
                    {board.columns.reduce((total, col) => total + col.tasks.length, 0)} tasks
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {board.columns.map((column) => (
                  <div key={column.id} className="border rounded-lg p-3">
                    <h5 className="font-medium text-sm mb-2 text-gray-900">
                      {column.name || 'Untitled Column'}
                    </h5>
                    <div className="space-y-1">
                      {column.tasks.map((task) => (
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
          ))}
        </div>
        
        {boards.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No boards found in the system
          </div>
        )}
      </div>
    </div>
  )
}
