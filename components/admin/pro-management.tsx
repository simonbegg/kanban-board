'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Crown, 
  Users, 
  Layout, 
  CheckCircle, 
  Archive,
  Search,
  RefreshCw,
  Shield,
  Mail
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/supabase'

interface UserWithEntitlements {
  user_id: string
  plan: 'free' | 'pro'
  board_cap: number
  active_cap_per_board: number
  archive_retention_days: number
  archived_cap_per_user: number
  updated_at: string
  profiles: {
    email: string
    full_name: string | null
    created_at: string
  }
  usage: {
    boards: number
    activeTasks: number
    archivedTasks: number
  }
}

export function ProManagementPanel() {
  const [users, setUsers] = useState<UserWithEntitlements[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/grant-pro')
      if (!response.ok) {
        throw new Error('Failed to load users')
      }
      const data = await response.json()
      console.log('Frontend received data:', data)
      console.log('Frontend users count:', data.users?.length || 0)
      console.log('Frontend users:', data.users?.map(u => ({ email: u.email, plan: u.plan })))
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUsers()
    setRefreshing(false)
  }

  const handleGrantPro = async (userId: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/grant-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error('Failed to grant Pro')
      }

      await loadUsers()
    } catch (error) {
      console.error('Error granting Pro:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevokePro = async (userId: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/revoke-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to revoke Pro')
      }

      await loadUsers()
    } catch (error) {
      console.error('Error revoking Pro:', error)
      alert((error as Error).message)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: users.length,
    pro: users.filter(u => u.plan === 'pro').length,
    free: users.filter(u => u.plan === 'free').length,
    totalBoards: users.reduce((sum, u) => sum + u.usage.boards, 0),
    totalTasks: users.reduce((sum, u) => sum + u.usage.activeTasks, 0),
    totalArchived: users.reduce((sum, u) => sum + u.usage.archivedTasks, 0)
  }

  if (loading) {
    return <ProManagementSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Pro Plan Management
          </h1>
          <p className="text-muted-foreground">
            Manage user plans and monitor usage statistics
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          title="Pro Users"
          value={stats.pro}
          icon={<Crown className="w-4 h-4 text-yellow-500" />}
          variant="pro"
        />
        <StatCard
          title="Free Users"
          value={stats.free}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          title="Total Boards"
          value={stats.totalBoards}
          icon={<Layout className="w-4 h-4" />}
        />
        <StatCard
          title="Active Tasks"
          value={stats.totalTasks}
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <StatCard
          title="Archived"
          value={stats.totalArchived}
          icon={<Archive className="w-4 h-4" />}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'} className="gap-1">
                      {user.plan === 'pro' ? <Crown className="w-3 h-3" /> : null}
                      {user.plan === 'pro' ? 'Pro' : 'Free'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div>{user.usage.boards} boards</div>
                      <div>{user.usage.activeTasks} active tasks</div>
                      <div>{user.usage.archivedTasks} archived</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div>{user.board_cap} boards</div>
                      <div>{user.active_cap_per_board} tasks/board</div>
                      <div>{user.archived_cap_per_user} archived</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.plan === 'free' ? (
                        <Button
                          size="sm"
                          onClick={() => handleGrantPro(user.user_id)}
                          disabled={actionLoading === user.user_id}
                        >
                          {actionLoading === user.user_id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Crown className="w-3 h-3 mr-1" />
                          )}
                          Grant Pro
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading === user.user_id}
                            >
                              {actionLoading === user.user_id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                'Revoke Pro'
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke Pro Plan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will downgrade {user.email} to the Free plan.
                                The user will be limited to 1 board and 1,000 archived tasks.
                                {user.usage.boards > 1 && (
                                  <span className="block mt-2 text-destructive font-medium">
                                    Warning: This user currently has {user.usage.boards} boards and will need to delete {user.usage.boards - 1} boards.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRevokePro(user.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Revoke Pro
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  variant = 'default' 
}: { 
  title: string
  value: number
  icon: React.ReactNode
  variant?: 'default' | 'pro'
}) {
  return (
    <Card className={variant === 'pro' ? 'border-yellow-200 bg-yellow-50/50' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={variant === 'pro' ? 'text-yellow-600' : 'text-muted-foreground'}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-96 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-6 w-12 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
