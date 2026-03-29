'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { isAdminEmail } from '@/lib/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, Users, Layout, CheckCircle, RefreshCw } from 'lucide-react'
import { ProManagement } from '@/components/admin/pro-management'
import type { AdminUser } from '@/components/admin/pro-management'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = isAdminEmail(user?.email)

  useEffect(() => {
    if (loading) return
    if (!user || !isAdmin) {
      router.replace('/board')
    }
  }, [user, loading, isAdmin, router])

  const fetchUsers = async () => {
    setFetching(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (isAdmin) fetchUsers()
  }, [isAdmin])

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    )
  }

  const proCount  = users.filter(u => u.plan === 'pro').length
  const freeCount = users.filter(u => u.plan === 'free').length
  const totalBoards = users.reduce((s, u) => s + u.boards, 0)
  const totalTasks  = users.reduce((s, u) => s + u.active_tasks, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm mt-1">ThreeLanes user management</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={fetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/board')}>
              ← Back to Board
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{users.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" /> Pro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{proCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{freeCount} on Free</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Layout className="w-4 h-4" /> Total Boards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalBoards}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Active Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalTasks}</p>
            </CardContent>
          </Card>
        </div>

        {/* User management table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Users</CardTitle>
            <Badge variant="secondary">{users.length} total</Badge>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-destructive text-sm py-4">{error}</p>
            ) : fetching ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <ProManagement users={users} onPlanChanged={fetchUsers} />
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
