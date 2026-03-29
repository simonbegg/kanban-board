-- ============================================
-- AUTO-CREATE ENTITLEMENTS ON USER SIGNUP
-- ============================================
-- This trigger automatically creates default Free plan entitlements
-- when a new user is created in auth.users
-- Run this in Supabase SQL Editor
-- ============================================

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_entitlements()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.entitlements (
    user_id,
    plan,
    board_cap,
    active_cap_per_board,
    archived_cap_per_user,
    subscription_status
  ) VALUES (
    NEW.id,
    'free',
    1,
    100,
    1000,
    'none'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_entitlements ON auth.users;
CREATE TRIGGER on_auth_user_created_entitlements
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_entitlements();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON public.entitlements TO postgres, service_role;
GRANT SELECT, UPDATE ON public.entitlements TO authenticated;

-- Ensure RLS is enabled but allows the trigger to work
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own entitlements
DROP POLICY IF EXISTS "Users can view own entitlements" ON public.entitlements;
CREATE POLICY "Users can view own entitlements" ON public.entitlements
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for webhooks)
DROP POLICY IF EXISTS "Service role has full access" ON public.entitlements;
CREATE POLICY "Service role has full access" ON public.entitlements
  FOR ALL USING (auth.role() = 'service_role');

-- Backfill: Create entitlements for any existing users who don't have them
INSERT INTO public.entitlements (user_id, plan, board_cap, active_cap_per_board, archived_cap_per_user, subscription_status)
SELECT 
  id,
  'free',
  1,
  100,
  1000,
  'none'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.entitlements)
ON CONFLICT (user_id) DO NOTHING;
