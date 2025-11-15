-- Add RLS policies for entitlements table
-- Users should be able to read and update their own entitlements

-- Enable RLS if not already enabled
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own entitlements" ON public.entitlements;
DROP POLICY IF EXISTS "Users can update their own entitlements" ON public.entitlements;
DROP POLICY IF EXISTS "Service role can manage all entitlements" ON public.entitlements;

-- Users can read their own entitlements
CREATE POLICY "Users can view their own entitlements"
  ON public.entitlements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own entitlements (for cancellation flows)
CREATE POLICY "Users can update their own entitlements"
  ON public.entitlements
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role (admin APIs) can do everything
-- Note: This is implicitly allowed, but we can be explicit
CREATE POLICY "Service role can manage all entitlements"
  ON public.entitlements
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
