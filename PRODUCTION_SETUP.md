# Production Setup Guide

This guide covers setting up ThreeLanes for production deployment with email notifications enabled.

## 🚀 Quick Setup

### 1. Environment Variables

Copy the production template:
```bash
cp .env.production.example .env.production
```

Update these required variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Notifications (Resend)
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Cron Job Protection
CRON_SECRET=your_secure_random_string_here
```

### 2. Database Setup

Apply the email notifications migration:
```sql
-- Run this in your Supabase SQL Editor
-- See: supabase/migrations/add_email_notifications.sql
```

### 3. Email Service Setup

1. **Create Resend Account**: [https://resend.com](https://resend.com)
2. **Verify Your Domain**: Add and verify your domain in Resend dashboard
3. **Get API Key**: Copy your API key to `RESEND_API_KEY`

### 4. Deploy to Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy - the cron jobs will be automatically configured

## 📧 Email Notifications

The system will automatically send:
- **Daily emails**: Every day at 8 AM UTC
- **Weekly emails**: Every Monday at 8 AM UTC

Users can:
- Enable/disable notifications
- Choose frequency (daily/weekly)
- Set custom email address
- Only receive emails when there are tasks

## 🔧 Optional: Re-enabling Slack

If you want to re-enable Slack integration in the future:

1. Uncomment Slack variables in `.env.production`
2. Add Slack environment variables to Vercel
3. Uncomment `SlackIntegration` component in `app/board/page.tsx`
4. Update `vercel.json` to include Slack cron job

## 📊 Monitoring

- Check Vercel function logs for email delivery status
- Monitor Resend dashboard for email metrics
- Users can test notifications via the settings panel

## 🔒 Security

- Cron jobs are protected with `CRON_SECRET`
- Email settings are user-specific and protected by RLS
- API endpoints require authentication

That's it! Your ThreeLanes app is ready for production with email notifications. 🎉
