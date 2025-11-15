-- Add RLS policies for profiles table that allow admin access
-- This fixes the issue where admins cannot view all users in the admin panel

-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profiles policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create policies that allow users to manage their own profiles
-- and admins to manage any profiles

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (initial creation)
CREATE POLICY "Users can insert their own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- Admins can view any profiles
CREATE POLICY "Admins can view any profiles" ON public.profiles 
FOR SELECT USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Admins can insert any profiles (if needed)
CREATE POLICY "Admins can insert any profiles" ON public.profiles 
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Admins can update any profiles (user management)
CREATE POLICY "Admins can update any profiles" ON public.profiles 
FOR UPDATE USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Add comment explaining the policies
COMMENT ON POLICY "Admins can view any profiles" ON public.profiles IS 'Allows admin users to view all user profiles for admin panel management';
