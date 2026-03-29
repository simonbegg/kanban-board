-- Add plan_intent column to entitlements table
-- This tracks whether a user signed up with Pro intent (from pricing page)
-- Run this migration in your Supabase SQL editor

-- Add plan_intent column (defaults to 'free')
ALTER TABLE entitlements 
ADD COLUMN IF NOT EXISTS plan_intent TEXT DEFAULT 'free';

-- Add first_login_completed flag to track if user has seen the Pro intent modal
ALTER TABLE entitlements 
ADD COLUMN IF NOT EXISTS first_login_completed BOOLEAN DEFAULT FALSE;

-- Create index for querying users with pro intent who haven't completed first login
CREATE INDEX IF NOT EXISTS idx_entitlements_plan_intent 
ON entitlements(plan_intent) WHERE first_login_completed = FALSE;

-- Comment explaining the column
COMMENT ON COLUMN entitlements.plan_intent IS 'Tracks signup intent: free or pro. Used to show Pro upgrade modal on first login.';
COMMENT ON COLUMN entitlements.first_login_completed IS 'Whether user has completed first login flow (seen Pro intent modal if applicable).';
