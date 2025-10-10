-- Add Slack integration fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS slack_access_token TEXT,
ADD COLUMN IF NOT EXISTS slack_user_id TEXT,
ADD COLUMN IF NOT EXISTS slack_team_id TEXT,
ADD COLUMN IF NOT EXISTS slack_channel_id TEXT,
ADD COLUMN IF NOT EXISTS slack_connected_at TIMESTAMP WITH TIME ZONE;

-- Create index for Slack-enabled users
CREATE INDEX IF NOT EXISTS idx_profiles_slack_user_id ON public.profiles(slack_user_id);

-- Create notifications log table to track sent notifications
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_log_user_id ON public.notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_log_task_id ON public.notifications_log(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_log_sent_at ON public.notifications_log(sent_at);

-- RLS policies for notifications_log
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
  ON public.notifications_log FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" 
  ON public.notifications_log FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Comment on columns
COMMENT ON COLUMN public.profiles.slack_access_token IS 'Encrypted Slack OAuth access token';
COMMENT ON COLUMN public.profiles.slack_user_id IS 'Slack user ID for the connected account';
COMMENT ON COLUMN public.profiles.slack_team_id IS 'Slack workspace/team ID';
COMMENT ON COLUMN public.profiles.slack_channel_id IS 'Default Slack channel for notifications';
COMMENT ON TABLE public.notifications_log IS 'Log of all sent notifications to prevent duplicates';
