# Email Notifications Setup

This guide explains how to set up automated email notifications for ThreeLanes users to receive daily or weekly summaries of their tasks.

## Overview

Users can opt-in to receive email summaries of tasks in their "To-do" column:
- **Daily emails**: Sent each morning
- **Weekly emails**: Sent on Monday mornings
- **Smart filtering**: Only sends emails when there are tasks to report

## Prerequisites

1. **Resend Account** - For sending emails
2. **Environment Variables** - API keys and configuration
3. **Cron Job** - For automated sending

## Step 1: Set Up Resend

1. Create an account at [https://resend.com](https://resend.com)
2. Verify your domain (or use the default `@resend.dev` domain for testing)
3. Get your API key from the dashboard

## Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Email sending
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Cron job protection
CRON_SECRET=your_secret_cron_key_here

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Step 3: Apply Database Migration

Run the migration to add email notification fields to the profiles table:

```sql
-- File: supabase/migrations/add_email_notifications.sql
```

Apply this in your Supabase dashboard SQL editor.

## Step 4: Set Up Cron Jobs

### Option A: Vercel Cron Jobs (Recommended)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/email/send-task-summary",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/email/send-task-summary", 
      "schedule": "0 8 * * 1"
    }
  ]
}
```

### Option B: External Cron Service

Use a service like [Cron-job.org](https://cron-job.org) or [EasyCron](https://easycron.com):

**Daily Job:**
- URL: `https://yourdomain.com/api/email/send-task-summary`
- Method: POST
- Headers: `Authorization: Bearer your_secret_cron_key_here`
- Schedule: Every day at 8 AM

**Weekly Job:**
- Same URL and method
- Schedule: Every Monday at 8 AM

## Step 5: Test the Setup

1. **Enable Email Notifications:**
   - Go to your board → Settings (⚙️)
   - Toggle "Email Notifications" to enabled
   - Enter your email address
   - Choose frequency (daily or weekly)

2. **Test Manually:**
   ```bash
   curl -X POST https://yourdomain.com/api/email/send-task-summary \
     -H "Authorization: Bearer your_secret_cron_key_here"
   ```

3. **Check Email:**
   - You should receive an email with your todo tasks
   - Check your spam folder if needed

## Email Template

The emails include:
- **Subject**: 📋 ThreeLanes: Today/This Week Task Overview (X tasks)
- **Content**: 
  - Task count summary
  - Tasks grouped by board
  - Task title, description, category, and creation date
  - Link to open ThreeLanes
  - Unsubscribe information

## API Endpoints

### `/api/email/settings`
- **GET**: Get user's email notification settings
- **POST**: Update user's email notification settings
  ```json
  {
    "enabled": true,
    "email": "user@example.com", 
    "frequency": "daily"
  }
  ```

### `/api/email/send-task-summary`
- **POST**: Send email summaries (cron job endpoint)
- **Protected**: Requires `Authorization: Bearer CRON_SECRET` header

## Rate Limiting & Best Practices

- **Frequency Protection**: Won't send emails more than once per 24 hours (daily) or 7 days (weekly)
- **Empty List Protection**: Won't send emails if there are no todo tasks
- **Error Handling**: Failed emails are logged but don't stop other users' emails
- **Domain Verification**: Always verify your sending domain in Resend for better deliverability

## Troubleshooting

### Emails Not Sending
1. Check `RESEND_API_KEY` is set correctly
2. Verify your domain in Resend dashboard
3. Check cron job logs for errors
4. Ensure user has enabled notifications and provided email

### Emails Going to Spam
1. Verify your sending domain (not using `@resend.dev`)
2. Add SPF/DKIM records as provided by Resend
3. Check email content for spam triggers

### Cron Job Issues
1. Verify `CRON_SECRET` matches between environment and cron service
2. Check the cron job URL is correct
3. Monitor Vercel function logs for errors

## Cost Considerations

- **Resend**: Free tier includes 3,000 emails/month
- **Vercel**: Cron jobs are included in Pro plan
- **Database**: Minimal storage overhead for email settings

For most users, this should fit within free tiers during development and early usage.
