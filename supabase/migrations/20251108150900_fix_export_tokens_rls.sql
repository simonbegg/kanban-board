-- Fix RLS policy for export_tokens
-- Users need to be able to INSERT their own tokens via the API

-- Add INSERT policy for users to create their own export tokens
CREATE POLICY "Users can create their own export tokens" 
  ON public.export_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for marking tokens as used (via helper function)
CREATE POLICY "Users can update their own export tokens" 
  ON public.export_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id);
