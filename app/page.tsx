'use client'

import { useAuth } from "@/contexts/auth-context"
import { AuthForm } from "@/components/auth/auth-form"
import { UserMenu } from "@/components/auth/user-menu"
import { SupabaseKanbanBoard } from "@/components/supabase-kanban-board"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Project Board</h1>
            <p className="text-muted-foreground">Organize your tasks efficiently</p>
          </div>
          <UserMenu />
        </div>
        <SupabaseKanbanBoard />
      </div>
    </main>
  )
}
