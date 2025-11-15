-- Create subscription events audit log
-- Tracks all cancellation, downgrade, and enforcement events

-- 1. Create subscription_events table
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) -- null for system/cron events
);

-- 2. Create indexes for querying
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id 
  ON public.subscription_events(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_events_type 
  ON public.subscription_events(event_type);

CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at 
  ON public.subscription_events(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Users can view their own subscription events" 
  ON public.subscription_events 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE policies for users - events created by server only

-- 5. Add comments
COMMENT ON TABLE public.subscription_events IS 'Audit log for subscription lifecycle events (cancellations, downgrades, enforcement)';
COMMENT ON COLUMN public.subscription_events.event_type IS 'Event type: cancel_requested, cancel_rescinded, plan_downgraded, courtesy_started, enforcement_applied, export_requested, export_ready';
COMMENT ON COLUMN public.subscription_events.event_data IS 'JSON metadata: effective dates, board counts, task counts, etc.';
COMMENT ON COLUMN public.subscription_events.created_by IS 'User who triggered event (null for system/cron jobs)';
