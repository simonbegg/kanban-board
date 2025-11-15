-- Remove only the admin policies, keep user policies
-- This fixes the security issue where admin users can access all data through regular interfaces

-- Drop existing admin policies that are too broad
DROP POLICY IF EXISTS "Admins can view any boards" ON public.boards;
DROP POLICY IF EXISTS "Admins can view any tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can view any columns" ON public.columns;
