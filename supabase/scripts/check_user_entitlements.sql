-- Check user entitlements
-- Run in Supabase SQL Editor

SELECT 
  u.email,
  e.*
FROM auth.users u
LEFT JOIN entitlements e ON e.user_id = u.id
WHERE u.email = 'simonbegg@hotmail.com';
