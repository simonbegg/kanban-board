'use client'

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { UserMenu } from "@/components/auth/user-menu"
import { SupabaseKanbanBoard } from "@/components/supabase-kanban-board"
import { ThemeToggle } from "@/components/theme-toggle"
import { SlackIntegration } from "@/components/slack-integration"
import { EmailSettings } from "@/components/email-settings"
import { UsageMeter } from "@/components/usage-meter"
import { CapWarning } from "@/components/cap-warning"
import { UpgradeModal } from "@/components/upgrade-modal"
import { CancellationBanner } from "@/components/cancellation-banner"
import { CancelSubscriptionDialog } from "@/components/cancel-subscription-dialog"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { ResolveOverlimitWizard } from "@/components/resolve-overlimit-wizard"
import { Layers, SquareKanban, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function BoardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [resolveWizardOpen, setResolveWizardOpen] = useState(false)
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // Check for upgrade parameter
  useEffect(() => {
    if (searchParams.get('upgrade') === 'true') {
      setUpgradeModalOpen(true)
      // Clean up the URL
      router.replace('/board')
    }
  }, [searchParams, router])

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
            <Image
              src="/threelanes_logo.svg"
              alt="ThreeLanes"
              width={160}
              height={32}
              className="block dark:hidden"
              priority
            />
            <Image
              src="/threelanes_logo_white.svg"
              alt="ThreeLanes"
              width={160}
              height={32}
              className="hidden dark:block"
              priority
            />
            <span className="text-xs border border-dashed border-gray-700 dark:border-white ml-auto mt-1 tracking-wider font-light px-2 py-0.5 rounded-full ">Beta</span>

          </div>
          <div className="flex items-center gap-4">
            {/* Usage Meter */}
            {user && <UsageMeter userId={user.id} compact={true} />}

            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                  {/* Email Settings */}
                  <EmailSettings />

                  {/* Export Data */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Export Your Data</h3>
                    <ExportDataButtons variant="buttons" />
                  </div>

                  {/* Danger Zone - Cancel Subscription */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2 text-destructive">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Cancel your Pro subscription and return to Free plan
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSettingsOpen(false)
                        setCancelDialogOpen(true)
                      }}
                    >
                      Cancel Pro Subscription
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Cancellation Banner */}
      {user && (
        <div className="container mx-auto px-6 pt-4">
          <CancellationBanner
            userId={user.id}
            onUndoClick={() => window.location.reload()}
            onResolveClick={() => setResolveWizardOpen(true)}
            onExportClick={() => setSettingsOpen(true)}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="pt-4 md:flex-1 md:overflow-hidden">
        <div className="mx-auto max-w-7xl md:h-full px-6">
          <SupabaseKanbanBoard />
        </div>
      </main>

      {/* Modals */}
      {user && (
        <>
          <UpgradeModal
            isOpen={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
          />
          <CancelSubscriptionDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            onSuccess={() => window.location.reload()}
            periodEnd={null}
          />
          <ResolveOverlimitWizard
            open={resolveWizardOpen}
            onOpenChange={setResolveWizardOpen}
            userId={user.id}
            onComplete={() => window.location.reload()}
          />
        </>
      )}
    </div>
  )
}
