-- Fix RLS policy for subscription_events
-- Users need to be able to INSERT events for their own actions

-- Add INSERT policy for users to log their own events
CREATE POLICY "Users can create their own subscription events" 
  ON public.subscription_events 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
