# Slack Integration Setup Guide

## Overview

The Slack integration sends DM notifications to users when their cards have been sitting for more than 5 days. This helps keep tasks moving and prevents work from getting stuck.

## Prerequisites

1. A Slack workspace where you have admin permissions
2. Access to your app's environment variables

## Setup Steps

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Name your app (e.g., "ThreeLanes")
5. Select your workspace
6. Click **"Create App"**

### 2. Configure OAuth & Permissions

1. In your Slack app settings, go to **"OAuth & Permissions"** in the sidebar
2. Scroll down to **"Scopes"** → **"Bot Token Scopes"**
3. Add the following scope:
   - `chat:write` - To send direct messages to users

**Scope Justification (required for distribution):**
```
This app sends direct messages to users when their kanban cards have been 
waiting for more than 5 days, helping them stay on top of stale tasks and 
keep their workflow moving.
```

### 3. Set Redirect URLs

1. Still in **"OAuth & Permissions"**
2. Under **"Redirect URLs"**, click **"Add New Redirect URL"**
3. Add your callback URL:
   ```
   https://your-domain.com/api/slack/callback
   ```
   For local development:
   ```
   http://localhost:3000/api/slack/callback
   ```
4. Click **"Save URLs"**

### 4. Get Your Credentials

1. Go to **"Basic Information"** in the sidebar
2. Under **"App Credentials"**, you'll find:
   - **Client ID**
   - **Client Secret** (click "Show" to reveal)
3. Copy these values

### 5. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Slack Integration
NEXT_PUBLIC_SLACK_CLIENT_ID=your_client_id_here
SLACK_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_SLACK_REDIRECT_URI=https://your-domain.com/api/slack/callback
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cron Secret (generate a random string)
CRON_SECRET=your_random_secret_here
```

**Generate a CRON_SECRET:**
```bash
# On Mac/Linux:
openssl rand -hex 32

# Or use any random string generator
```

### 6. Apply Database Migration

Run the Slack integration migration in your Supabase dashboard:

```sql
-- Located at: supabase/migrations/add_slack_integration.sql
```

This creates:
- Slack credential fields in the `profiles` table
- A `notifications_log` table to track sent notifications

### 7. Set Up Cron Job

The notification checker needs to run periodically. You have several options:

#### Option A: Vercel Cron Jobs (Recommended if using Vercel)

1. Create `vercel.json` in your project root:

```json
{
  "crons": [{
    "path": "/api/slack/check-old-cards",
    "schedule": "0 9 * * *"
  }]
}
```

This runs daily at 9 AM UTC.

2. Configure the cron authorization:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `CRON_SECRET` with your secret value

#### Option B: External Cron Service

Use a service like:
- **cron-job.org**
- **EasyCron**
- **GitHub Actions**

Configure it to POST to:
```
https://your-domain.com/api/slack/check-old-cards
```

With header:
```
Authorization: Bearer YOUR_CRON_SECRET
```

#### Option C: Supabase Edge Functions

Create a Supabase Edge Function and trigger it with pg_cron.

### 8. Add UI Component

Add the Slack integration component to your board page:

```tsx
import { SlackIntegration } from "@/components/slack-integration"

// In your board component:
<SlackIntegration />
```

## Testing

### Test the OAuth Flow

1. Go to your board page
2. Click **"Connect Slack"**
3. Authorize the app in Slack
4. You should be redirected back with a success message

### Test Notifications

1. Manually trigger the cron endpoint:

```bash
curl -X POST https://your-domain.com/api/slack/check-old-cards \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

2. Check the response:
```json
{
  "success": true,
  "notificationsSent": 2,
  "usersProcessed": 1
}
```

3. Check your Slack DMs for notifications

## How It Works

1. **User Connects**: User clicks "Connect Slack" → OAuth flow → Credentials saved
2. **Daily Check**: Cron job runs `/api/slack/check-old-cards`
3. **Find Old Cards**: Checks all users' boards for cards > 5 days old
4. **Send Notifications**: Sends formatted Slack DM for each old card
5. **Prevent Spam**: Logs notifications to avoid duplicates within 24 hours

## Notification Format

Users receive a formatted Slack message with:
- Card title and age
- Board name
- Category
- Description (if present)
- Helpful reminder to take action

## Troubleshooting

### "Failed to connect Slack"
- Check that redirect URL matches exactly
- Verify client ID and secret are correct
- Check browser console for errors

### "No notifications sent"
- Verify cron job is running
- Check that users have Slack connected
- Ensure cards are actually > 5 days old
- Check Supabase logs for errors

### "Unauthorized" on cron endpoint
- Verify CRON_SECRET matches in both .env and request
- Check Authorization header format

## Security Notes

- Slack access tokens are stored in the database
- Consider encrypting tokens at rest for production
- The cron endpoint is protected by CRON_SECRET
- Users can disconnect Slack anytime

## Configuration

To change the notification threshold from 5 days:

Edit `app/api/slack/check-old-cards/route.ts`:

```typescript
// Change this line:
if (ageInDays > 5) {
  // To your preferred number:
  if (ageInDays > 7) {
```

## Resources

- [Slack API Documentation](https://api.slack.com/docs)
- [Block Kit Builder](https://app.slack.com/block-kit-builder) - Test message formatting
- [Slack OAuth Guide](https://api.slack.com/authentication/oauth-v2)
