-- Add RLS policies for entitlements table that allow admin access
-- This fixes the issue where admins cannot grant/revoke Pro plans

-- Enable RLS on entitlements table if not already enabled
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Drop existing entitlements policies if they exist
DROP POLICY IF EXISTS "Users can view their own entitlements" ON public.entitlements;
DROP POLICY IF EXISTS "Users can insert their own entitlements" ON public.entitlements;
DROP POLICY IF EXISTS "Users can update their own entitlements" ON public.entitlements;

-- Create policies that allow users to manage their own entitlements
-- and admins to manage any entitlements

-- Users can view their own entitlements
CREATE POLICY "Users can view their own entitlements" ON public.entitlements 
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own entitlements (initial creation)
CREATE POLICY "Users can insert their own entitlements" ON public.entitlements 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own entitlements (for self-upgrades)
CREATE POLICY "Users can update their own entitlements" ON public.entitlements 
FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view any entitlements
CREATE POLICY "Admins can view any entitlements" ON public.entitlements 
FOR SELECT USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Admins can insert any entitlements (granting Pro)
CREATE POLICY "Admins can insert any entitlements" ON public.entitlements 
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Admins can update any entitlements (granting/revoking Pro)
CREATE POLICY "Admins can update any entitlements" ON public.entitlements 
FOR UPDATE USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Admins can delete any entitlements (if needed)
CREATE POLICY "Admins can delete any entitlements" ON public.entitlements 
FOR DELETE USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Add comment explaining the policies
COMMENT ON POLICY "Admins can update any entitlements" ON public.entitlements IS 'Allows admin users to grant or revoke Pro plans for any user';
