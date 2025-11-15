-- Remove the problematic admin policies that broke security
DROP POLICY IF EXISTS "Admins can view any boards" ON public.boards;
DROP POLICY IF EXISTS "Admins can view any columns" ON public.columns;
DROP POLICY IF EXISTS "Admins can view any tasks" ON public.tasks;
