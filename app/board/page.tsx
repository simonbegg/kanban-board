'use client'

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { UserMenu } from "@/components/auth/user-menu"
import { SupabaseKanbanBoard } from "@/components/supabase-kanban-board"
import { ThemeToggle } from "@/components/theme-toggle"
import { SlackIntegration } from "@/components/slack-integration"
import { EmailSettings } from "@/components/email-settings"
import { Layers, SquareKanban, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function BoardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

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
    return null
  }

  return (
    <div className="min-h-screen md:h-screen bg-background flex flex-col md:overflow-hidden">
      {/* Header */}
      <header className="border-b md:shrink-0">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SquareKanban className="h-8 w-8 text-primary rotate-90 hover:rotate-0 transition-all duration-300" />
            <span className="text-2xl font-display tracking-wider font-semibold">ThreeLanes</span>
          </div>
          <div className="flex items-center gap-4">
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                  {/* SlackIntegration disabled for production */}
                  <EmailSettings />
                </div>
              </PopoverContent>
            </Popover>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-4 md:flex-1 md:overflow-hidden">
        <div className="mx-auto max-w-7xl md:h-full px-6">
          <SupabaseKanbanBoard />
        </div>
      </main>
    </div>
  )
}
