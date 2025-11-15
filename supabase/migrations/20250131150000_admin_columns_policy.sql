-- Add admin RLS policy for columns table
-- This fixes the issue where admins can see boards but not columns/tasks

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can view any columns" ON public.columns;

-- Create admin policy for columns table
CREATE POLICY "Admins can view any columns" ON public.columns 
FOR SELECT USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Add comment explaining the policy
COMMENT ON POLICY "Admins can view any columns" ON public.columns IS 'Allows admin users to view all columns for board management and support';
