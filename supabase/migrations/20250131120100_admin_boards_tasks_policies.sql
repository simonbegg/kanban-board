-- Add admin RLS policies for boards and tasks tables
-- This fixes usage stats not showing for admin users

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view any boards" ON public.boards;
DROP POLICY IF EXISTS "Admins can view any tasks" ON public.tasks;

-- Create admin policies for boards table
CREATE POLICY "Admins can view any boards" ON public.boards 
FOR SELECT USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Create admin policies for tasks table
CREATE POLICY "Admins can view any tasks" ON public.tasks 
FOR SELECT USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Add comments explaining the policies
COMMENT ON POLICY "Admins can view any boards" ON public.boards IS 'Allows admin users to view all boards for usage statistics';
COMMENT ON POLICY "Admins can view any tasks" ON public.tasks IS 'Allows admin users to view all tasks for usage statistics';
