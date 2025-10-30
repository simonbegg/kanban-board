-- Add email notification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_email TEXT,
ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'daily' CHECK (notification_frequency IN ('daily', 'weekly')),
ADD COLUMN IF NOT EXISTS last_notification_sent TIMESTAMP WITH TIME ZONE;

-- Add index for email notification queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_notifications ON public.profiles(email_notifications_enabled) WHERE email_notifications_enabled = TRUE;

-- Update RLS policies to allow users to update their email notification settings
ALTER POLICY "Users can view their own profile" ON public.profiles
USING (auth.uid() = id);

ALTER POLICY "Users can update their own profile" ON public.profiles
WITH CHECK (auth.uid() = id);
