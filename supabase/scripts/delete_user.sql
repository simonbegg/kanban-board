-- ============================================
-- COMPLETE USER DELETION SCRIPT
-- ============================================
-- This script removes a user and ALL their data from the database.
-- Run this in Supabase SQL Editor.
--
-- USAGE: Replace 'USER_EMAIL_HERE' with the actual email address
-- ============================================

-- Set the email of the user to delete
DO $$
DECLARE
    target_email TEXT := 'USER_EMAIL_HERE';  -- <-- CHANGE THIS
    target_user_id UUID;
BEGIN
    -- Find the user ID from auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found', target_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Deleting user: % (ID: %)', target_email, target_user_id;
    
    -- Delete in order of dependencies (child tables first)
    
    -- 1. Delete tasks (belongs to boards)
    DELETE FROM tasks WHERE board_id IN (
        SELECT id FROM boards WHERE user_id = target_user_id
    );
    RAISE NOTICE 'Deleted tasks';
    
    -- 2. Delete columns (belongs to boards)
    DELETE FROM columns WHERE board_id IN (
        SELECT id FROM boards WHERE user_id = target_user_id
    );
    RAISE NOTICE 'Deleted columns';
    
    -- 3. Delete boards
    DELETE FROM boards WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted boards';
    
    -- 4. Delete categories
    DELETE FROM categories WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted categories';
    
    -- 5. Delete entitlements
    DELETE FROM entitlements WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted entitlements';
    
    -- 6. Delete notifications log
    DELETE FROM notifications_log WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted notifications_log';
    
    -- 7. Delete profile
    DELETE FROM profiles WHERE id = target_user_id;
    RAISE NOTICE 'Deleted profile';
    
    -- 8. Delete from auth.users (this is the main user record)
    DELETE FROM auth.users WHERE id = target_user_id;
    RAISE NOTICE 'Deleted auth user';
    
    RAISE NOTICE '✓ User % completely deleted', target_email;
END $$;
