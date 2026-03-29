-- Add Paddle-related columns to entitlements table for subscription tracking
-- Run this migration in your Supabase SQL editor

-- Add Paddle customer ID
ALTER TABLE entitlements 
ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT;

-- Add Paddle subscription ID
ALTER TABLE entitlements 
ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT;

-- Add subscription status (active, canceled, paused, etc.)
ALTER TABLE entitlements 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none';

-- Add updated_at timestamp for tracking changes
ALTER TABLE entitlements 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on paddle_subscription_id for faster lookups during webhook processing
CREATE INDEX IF NOT EXISTS idx_entitlements_paddle_subscription_id 
ON entitlements(paddle_subscription_id);

-- Create index on paddle_customer_id
CREATE INDEX IF NOT EXISTS idx_entitlements_paddle_customer_id 
ON entitlements(paddle_customer_id);
