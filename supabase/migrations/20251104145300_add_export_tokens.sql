-- Create export tokens for secure data exports
-- Time-limited, single-use tokens for CSV/JSON downloads

-- 1. Create export_tokens table
CREATE TABLE IF NOT EXISTS public.export_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('board_csv', 'account_json')),
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE, -- null for full account export
  file_url TEXT, -- S3/storage URL when ready
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'expired', 'used')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_export_tokens_token 
  ON public.export_tokens(token) 
  WHERE status = 'ready';

CREATE INDEX IF NOT EXISTS idx_export_tokens_user_id 
  ON public.export_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_export_tokens_expires_at 
  ON public.export_tokens(expires_at) 
  WHERE status IN ('pending', 'ready');

-- 3. Enable RLS
ALTER TABLE public.export_tokens ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Users can view their own export tokens" 
  ON public.export_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE for users - tokens created by API only

-- 5. Helper function to generate secure token
CREATE OR REPLACE FUNCTION generate_export_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- 6. Helper function to mark token as used
CREATE OR REPLACE FUNCTION use_export_token(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_record export_tokens%ROWTYPE;
BEGIN
  -- Get token and lock row
  SELECT * INTO v_token_record
  FROM public.export_tokens
  WHERE token = p_token
  FOR UPDATE;
  
  -- Check token is valid
  IF v_token_record.id IS NULL THEN
    RETURN false; -- Token doesn't exist
  END IF;
  
  IF v_token_record.status != 'ready' THEN
    RETURN false; -- Token not ready or already used
  END IF;
  
  IF v_token_record.expires_at < NOW() THEN
    -- Mark as expired
    UPDATE public.export_tokens
    SET status = 'expired'
    WHERE id = v_token_record.id;
    RETURN false; -- Token expired
  END IF;
  
  -- Mark as used
  UPDATE public.export_tokens
  SET status = 'used', used_at = NOW()
  WHERE id = v_token_record.id;
  
  RETURN true;
END;
$$;

-- 7. Add comments
COMMENT ON TABLE public.export_tokens IS 'Secure tokens for time-limited data exports';
COMMENT ON COLUMN public.export_tokens.token IS 'Random token for download link (base64 encoded)';
COMMENT ON COLUMN public.export_tokens.export_type IS 'Type: board_csv (single board) or account_json (all data)';
COMMENT ON COLUMN public.export_tokens.file_url IS 'Storage URL when export is ready (null while pending)';
COMMENT ON COLUMN public.export_tokens.status IS 'Lifecycle: pending → ready → used/expired';
COMMENT ON COLUMN public.export_tokens.expires_at IS 'Token expires 7 days after creation';
