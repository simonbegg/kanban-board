'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, Search, AlertTriangle } from 'lucide-react'

export interface AdminUser {
  id: string
  email: string
  joined: string
  plan: string
  paddle_subscription_id: string | null
  boards: number
  active_tasks: number
}

interface ProManagementProps {
  users: AdminUser[]
  onPlanChanged: () => void
}

export function ProManagement({ users, onPlanChanged }: ProManagementProps) {
  const [search, setSearch] = useState('')
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null)
  const [confirmAction, setConfirmAction] = useState<'grant' | 'revoke' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()),
  )

  const openConfirm = (user: AdminUser, action: 'grant' | 'revoke') => {
    setConfirmUser(user)
    setConfirmAction(action)
    setError(null)
  }

  const closeConfirm = () => {
    if (!loading) {
      setConfirmUser(null)
      setConfirmAction(null)
      setError(null)
    }
  }

  const handleConfirm = async () => {
    if (!confirmUser || !confirmAction) return
    setLoading(true)
    setError(null)

    const endpoint = confirmAction === 'grant'
      ? '/api/admin/grant-pro'
      : '/api/admin/revoke-pro'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: confirmUser.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`)

      closeConfirm()
      onPlanChanged()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className="text-right">Boards</TableHead>
            <TableHead className="text-right">Active Tasks</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Subscription ID</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(u => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.email}</TableCell>
              <TableCell>
                {u.plan === 'pro' ? (
                  <Badge className="gap-1">
                    <Crown className="w-3 h-3" /> Pro
                  </Badge>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{u.boards}</TableCell>
              <TableCell className="text-right tabular-nums">{u.active_tasks}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(u.joined).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs font-mono">
                {u.paddle_subscription_id
                  ? u.paddle_subscription_id.slice(0, 18) + '…'
                  : '—'}
              </TableCell>
              <TableCell className="text-right">
                {u.plan === 'pro' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openConfirm(u, 'revoke')}
                  >
                    Revoke Pro
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => openConfirm(u, 'grant')}
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Grant Pro
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                {search ? 'No users match that search' : 'No users found'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Confirmation dialog */}
      <Dialog open={!!confirmUser} onOpenChange={closeConfirm}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'grant' ? 'Grant Pro plan?' : 'Revoke Pro plan?'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'grant'
                ? `This will upgrade ${confirmUser?.email} to Pro immediately.`
                : `This will downgrade ${confirmUser?.email} to the Free plan immediately.`}
            </DialogDescription>
          </DialogHeader>

          {confirmAction === 'revoke' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Their boards and tasks will remain but they will be subject to Free plan limits going forward.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'revoke' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading
                ? 'Saving…'
                : confirmAction === 'grant'
                  ? 'Grant Pro'
                  : 'Revoke Pro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
