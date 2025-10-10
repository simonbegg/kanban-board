# Slack Integration - Implementation Guide

## ✅ What's Been Created

The Slack integration has been fully implemented with the following components:

### 1. **Database Schema** (`supabase/migrations/add_slack_integration.sql`)
- Added Slack fields to `profiles` table
- Created `notifications_log` table for tracking sent notifications
- Configured RLS policies

### 2. **Backend API** (`lib/slack.ts`)
- OAuth URL generation
- Token exchange
- Message formatting
- Slack API communication

### 3. **API Routes**
- `/api/slack/auth` - Initiates OAuth flow
- `/api/slack/callback` - Handles OAuth response
- `/api/slack/disconnect` - Disconnects Slack
- `/api/slack/check-old-cards` - Checks for old cards and sends notifications (cron endpoint)

### 4. **UI Component** (`components/slack-integration.tsx`)
- Connect/disconnect button
- Status display
- Success/error messages

### 5. **TypeScript Types** (`lib/supabase.ts`)
- Updated Database types with Slack fields
- Added `notifications_log` table type

## 🚀 Quick Start

### Step 1: Apply Database Migration

In your Supabase dashboard, run:
```sql
-- File: supabase/migrations/add_slack_integration.sql
```

### Step 2: Set Up Slack App

Follow the detailed guide in `SLACK_SETUP.md` to:
1. Create a Slack app
2. Configure OAuth scopes
3. Get credentials

### Step 3: Configure Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SLACK_REDIRECT_URI=http://localhost:3000/api/slack/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_random_secret
```

### Step 4: Add UI Component

**Option A: Add to Board Settings**

Create a settings dropdown in the board header:

```tsx
// app/board/page.tsx
import { SlackIntegration } from "@/components/slack-integration"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// In your header:
<div className="flex items-center gap-4">
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon">
        <Settings className="h-5 w-5" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-96">
      <SlackIntegration />
    </PopoverContent>
  </Popover>
  <ThemeToggle />
  <UserMenu />
</div>
```

**Option B: Add to User Menu**

Integrate into the existing UserMenu component:

```tsx
// components/auth/user-menu.tsx
import { SlackIntegration } from "@/components/slack-integration"

// Add a new menu item or section:
<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
  <SlackIntegration />
</DropdownMenuItem>
```

**Option C: Create a Settings Page**

```tsx
// app/settings/page.tsx
import { SlackIntegration } from "@/components/slack-integration"

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <SlackIntegration />
    </div>
  )
}
```

### Step 5: Set Up Cron Job

**For Vercel:**

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/slack/check-old-cards",
    "schedule": "0 9 * * *"
  }]
}
```

**For other platforms:**
Use a cron service to POST to `/api/slack/check-old-cards` with `Authorization: Bearer YOUR_CRON_SECRET`

## 📋 How It Works

1. **User connects Slack**:
   - Clicks "Connect Slack" button
   - OAuth flow redirects to Slack
   - User authorizes the app
   - Returns to board with credentials saved

2. **Daily check runs** (via cron):
   - Checks all boards for cards > 5 days old
   - Sends formatted Slack DM for each old card
   - Logs notification to prevent duplicates

3. **Notification example**:
   ```
   ⏰ Old Card Alert

   The card "Fix bug in login" has been sitting in your board for 7 days.

   Board: Project X
   Category: Bug Fix

   💡 Consider moving this card forward or archiving it if it's no longer relevant.
   ```

## 🎨 Customization

### Change Age Threshold

Edit `app/api/slack/check-old-cards/route.ts`:

```typescript
// Line ~70
if (ageInDays > 5) {  // Change from 5 to your preferred number
```

### Customize Notification Format

Edit `lib/slack.ts` in the `formatTaskNotification` function:

```typescript
export function formatTaskNotification(task: {...}) {
  // Customize the message text and blocks
  const text = `Custom message: ${task.title}`
  // ...
}
```

### Change Notification Frequency

Currently set to once per 24 hours per card. Edit in `app/api/slack/check-old-cards/route.ts`:

```typescript
// Line ~85
.gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
// Change 24 hours to your preferred duration
```

## 🧪 Testing

### Test OAuth Flow:
1. Start your dev server
2. Navigate to board page
3. Click "Connect Slack"
4. Authorize in Slack
5. Should return with success message

### Test Notification Endpoint:
```bash
curl -X POST http://localhost:3000/api/slack/check-old-cards \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "notificationsSent": 1,
  "usersProcessed": 1
}
```

### Create Test Data:
```sql
-- In Supabase SQL editor, backdate a card:
UPDATE tasks
SET created_at = NOW() - INTERVAL '6 days'
WHERE id = 'your-task-id';
```

Then trigger the cron endpoint to test notifications.

## 🔒 Security

- Slack tokens stored in database (consider encryption for production)
- Cron endpoint protected by `CRON_SECRET`
- RLS policies prevent unauthorized access
- OAuth state parameter validates user identity

## 📊 Monitoring

Check Supabase logs for:
- OAuth flow errors
- Slack API errors
- Notification send failures

Query notification history:
```sql
SELECT * FROM notifications_log
ORDER BY sent_at DESC
LIMIT 10;
```

## 🐛 Troubleshooting

**"Not authenticated" error**:
- Ensure user is logged in
- Check Supabase session validity

**"Failed to connect Slack"**:
- Verify Slack app credentials
- Check redirect URL matches exactly
- Review Slack app OAuth settings

**No notifications sent**:
- Verify cron job is running
- Check that cards are actually > 5 days old
- Ensure Slack is connected for the user
- Check `notifications_log` table

## 🚢 Deployment Checklist

- [ ] Apply database migration
- [ ] Set up Slack app
- [ ] Configure environment variables (production)
- [ ] Set up cron job
- [ ] Test OAuth flow in production
- [ ] Test notification sending
- [ ] Monitor logs for errors
- [ ] Add UI component to your app

## 📚 Resources

- `SLACK_SETUP.md` - Detailed setup instructions
- `.env.example` - Environment variable template
- Slack API Docs: https://api.slack.com/docs
- Block Kit Builder: https://app.slack.com/block-kit-builder

## 💡 Future Enhancements

Potential improvements:
- Allow users to customize age threshold per board
- Support multiple notification channels
- Add notification preferences (daily digest vs instant)
- Include task link in notifications (requires public URLs)
- Support team/workspace-wide boards
