-- Verification queries for Phase 1 migrations
-- Run these in your Supabase SQL Editor to confirm changes

-- 1. Check new columns in entitlements table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'entitlements' 
  AND column_name IN (
    'status', 
    'cancel_at_period_end', 
    'current_period_end',
    'cancel_effective_at',
    'courtesy_until',
    'enforcement_state', 
    'primary_board_id'
  )
ORDER BY column_name;

-- 2. Verify new tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('subscription_events', 'export_tokens')
ORDER BY table_name;

-- 3. Check indexes were created
SELECT 
  indexname, 
  tablename
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE '%cancel%' OR indexname LIKE '%courtesy%' OR indexname LIKE '%export%'
ORDER BY tablename, indexname;

-- 4. Test helper functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_export_token', 'use_export_token');

-- 5. Quick test: Generate a sample token
SELECT generate_export_token() as sample_token;

-- 6. Check current entitlements status (should all be 'active' with no cancellations)
SELECT 
  user_id,
  plan,
  status,
  cancel_at_period_end,
  enforcement_state
FROM public.entitlements
LIMIT 5;
