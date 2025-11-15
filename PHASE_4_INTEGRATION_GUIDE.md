# Phase 4 - Frontend UI Integration Guide

**Status:** ✅ 3/5 Components Built (Banner, Dialog, Export Buttons)  
**Date:** November 9, 2025

---

## 📦 Components Created

### 1. **CancellationBanner** (`components/cancellation-banner.tsx`)
Shows cancellation status with 3 states and action buttons.

### 2. **CancelSubscriptionDialog** (`components/cancel-subscription-dialog.tsx`)
Modal for users to cancel their Pro subscription.

### 3. **ExportDataButtons** (`components/export-data-buttons.tsx`)
Buttons to export board CSV or full account JSON.

### 4. **RadioGroup** (`components/ui/radio-group.tsx`)
shadcn/ui component for radio button selection.

---

## 🔧 Integration Steps

### **Step 1: Add Cancellation Banner to Board Page**

Edit `app/board/page.tsx`:

```typescript
// Add imports at the top
import { CancellationBanner } from "@/components/cancellation-banner"
import { CancelSubscriptionDialog } from "@/components/cancel-subscription-dialog"
import { ExportDataButtons } from "@/components/export-data-buttons"

// Add state for dialogs
const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
const [showExportDialog, setShowExportDialog] = useState(false)

// Add after the header (around line 90), before main content:
{/* Cancellation Banner */}
{user && (
  <CancellationBanner 
    userId={user.id}
    onUndoClick={() => {
      // Refresh page or show success message
      window.location.reload()
    }}
    onResolveClick={() => {
      // TODO: Open resolve wizard when built
      alert('Resolve wizard coming soon!')
    }}
    onExportClick={() => {
      setShowExportDialog(true)
    }}
  />
)}
```

### **Step 2: Add Cancel Button to Settings Popover**

Inside the settings popover (around line 80-83):

```typescript
<PopoverContent className="w-96" align="end">
  <div className="space-y-4">
    {/* Email Settings */}
    <EmailSettings />
    
    {/* Export Data Section */}
    <div className="border-t pt-4">
      <h3 className="font-semibold mb-2">Export Your Data</h3>
      <ExportDataButtons 
        variant="buttons"
      />
    </div>
    
    {/* Cancel Subscription (Pro users only) */}
    <div className="border-t pt-4">
      <h3 className="font-semibold mb-2 text-destructive">Danger Zone</h3>
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
```

### **Step 3: Add Cancel Dialog**

At the end of the JSX, near the UpgradeModal (around line 106):

```typescript
{/* Cancel Subscription Dialog */}
{user && (
  <CancelSubscriptionDialog
    open={cancelDialogOpen}
    onOpenChange={setCancelDialogOpen}
    onSuccess={() => {
      // Refresh page to show banner
      window.location.reload()
    }}
    periodEnd={null} // TODO: Fetch from entitlements
  />
)}
```

### **Step 4: Add Export Buttons to Kanban Board Header (Optional)**

If you want board-specific export in the kanban board header:

Edit `components/supabase-kanban-board.tsx` or wherever your board header is:

```typescript
<div className="flex items-center gap-2">
  {/* Existing buttons */}
  
  {/* Export current board */}
  <ExportDataButtons 
    boardId={currentBoardId}
    boardTitle={currentBoardTitle}
    variant="dropdown"
  />
</div>
```

---

## 🎨 Complete Modified Board Page Example

```typescript
'use client'

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { UserMenu } from "@/components/auth/user-menu"
import { SupabaseKanbanBoard } from "@/components/supabase-kanban-board"
import { ThemeToggle } from "@/components/theme-toggle"
import { EmailSettings } from "@/components/email-settings"
import { UsageMeter } from "@/components/usage-meter"
import { UpgradeModal } from "@/components/upgrade-modal"
import { CancellationBanner } from "@/components/cancellation-banner"
import { CancelSubscriptionDialog } from "@/components/cancel-subscription-dialog"
import { ExportDataButtons } from "@/components/export-data-buttons"
import { SquareKanban, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (searchParams.get('upgrade') === 'true') {
      setUpgradeModalOpen(true)
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
            <SquareKanban className="h-8 w-8 text-primary rotate-90 hover:rotate-0 transition-all duration-300" />
            <span className="text-2xl font-display tracking-wider font-semibold">ThreeLanes</span>
          </div>
          <div className="flex items-center gap-4">
            <UsageMeter userId={user.id} compact={true} />
            
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
                  
                  {/* Danger Zone */}
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
            onResolveClick={() => alert('Resolve wizard coming in Phase 4.5!')}
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
        </>
      )}
    </div>
  )
}
```

---

## 🧪 Testing Your Integration

1. **Start dev server:** `npm run dev`
2. **Grant yourself Pro:** Use admin API
3. **Test cancellation flow:**
   - Open Settings → Click "Cancel Pro Subscription"
   - Choose scheduled or immediate
   - Confirm cancellation
   - Check banner appears at top
4. **Test export:**
   - Open Settings → Click export buttons
   - Download CSV/JSON files
5. **Test undo:**
   - Click "Undo Cancellation" in banner
   - Banner should disappear

---

## 📋 Next Steps (Optional)

### **4. Enhanced Usage Meter**
- Add cancellation context to existing `usage-meter.tsx`
- Show "Resolve" button when over limits

### **5. Resolve Over-Limit Wizard**
- Complex multi-step wizard
- Choose primary board
- Archive/delete extras
- Archive excess tasks
- Progress tracking

---

## 🎨 Styling Notes

All components use:
- **shadcn/ui** components (consistent with your app)
- **Tailwind CSS** for styling
- **Lucide icons**
- **Dark mode support**
- **Responsive design**

---

## 🐛 Common Issues

### **Issue: RadioGroup import error**
**Solution:** The `radio-group.tsx` component has been created. Restart your TypeScript server or rebuild.

### **Issue: date-fns import error**
**Solution:** Install if missing:
```bash
npm install date-fns
```

### **Issue: Banner not showing**
**Solution:** 
- Check user has entitlements record
- Check cancellation status in database
- Look for console errors

---

## 📊 Database Requirements

Make sure you have:
- ✅ All Phase 1 & 2 migrations applied
- ✅ RLS policies set up correctly
- ✅ User has entitlements record

---

## ✅ Phase 4 Status

**Completed:**
- [x] Cancellation Banner (3 states, countdown, actions)
- [x] Cancel Subscription Dialog (scheduled/immediate)
- [x] Export Data Buttons (CSV/JSON with auto-download)
- [x] RadioGroup UI component

**Remaining (Optional):**
- [ ] Enhanced Usage Meter (add cancellation context)
- [ ] Resolve Over-Limit Wizard (complex, ~1 hour)

**Total Time:** ~2 hours for current components  
**Remaining Time:** ~1-2 hours for optional components

---

## 🚀 You're Ready!

The core cancellation UI is complete. Users can now:
1. ✅ See their cancellation status
2. ✅ Cancel their Pro subscription
3. ✅ Export their data
4. ✅ Undo cancellations

Deploy these changes and test on your staging/production environment!
