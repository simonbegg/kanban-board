-- Create entitlements record for testing
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID

-- First, find your user ID:
SELECT id, email FROM auth.users;

-- Then create Pro entitlements:
INSERT INTO public.entitlements (
  user_id,
  plan,
  status,
  board_cap,
  active_cap_per_board,
  archive_retention_days,
  archived_cap_per_user,
  cancel_at_period_end,
  current_period_end,
  enforcement_state
) VALUES (
  'YOUR_USER_ID_HERE', -- Replace with your user ID
  'pro',
  'active',
  500,
  100,
  36500,
  200000,
  false,
  NOW() + INTERVAL '30 days', -- Period ends in 30 days
  'none'
) ON CONFLICT (user_id) DO UPDATE SET
  plan = 'pro',
  status = 'active',
  board_cap = 500,
  current_period_end = NOW() + INTERVAL '30 days';

-- Verify it was created:
SELECT 
  user_id,
  plan,
  status,
  cancel_at_period_end,
  current_period_end
FROM public.entitlements
WHERE user_id = 'YOUR_USER_ID_HERE';
