-- Add admin RLS policies without touching existing user policies

-- Create admin policies that work correctly
CREATE POLICY "Admins can view any boards" ON public.boards 
FOR SELECT USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app',
    'admin@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

CREATE POLICY "Admins can view any columns" ON public.columns 
FOR SELECT USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app',
    'admin@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

CREATE POLICY "Admins can view any tasks" ON public.tasks 
FOR SELECT USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app',
    'admin@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);
