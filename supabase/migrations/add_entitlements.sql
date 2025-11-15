-- Add entitlements table for Free vs Pro gating
-- This migration creates the foundation for plan-based limits

-- 1. Create entitlements table
CREATE TABLE IF NOT EXISTS public.entitlements (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  board_cap INT NOT NULL DEFAULT 1,                 -- Free=1, Pro=500 (soft cap)
  active_cap_per_board INT NOT NULL DEFAULT 100,    -- both Free & Pro
  archive_retention_days INT NOT NULL DEFAULT 90,   -- Free=90, Pro=indefinite (36500)
  archived_cap_per_user INT NOT NULL DEFAULT 1000,  -- Free=1k, Pro=200k
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON public.entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_plan ON public.entitlements(plan);

-- 3. Add trigger for updated_at
CREATE TRIGGER update_entitlements_updated_at 
  BEFORE UPDATE ON public.entitlements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Helper function for Pro defaults
CREATE OR REPLACE FUNCTION entitlements_defaults_pro()
RETURNS public.entitlements LANGUAGE SQL STABLE AS $$
  SELECT null::uuid, 'pro', 500, 100, 36500, 200000, now(), now();
$$;

-- 5. Cap checking functions
CREATE OR REPLACE FUNCTION within_board_cap(p_user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT (
    SELECT COUNT(*) FROM public.boards WHERE user_id = p_user
  ) < (
    SELECT board_cap FROM public.entitlements WHERE user_id = p_user
  );
$$;

CREATE OR REPLACE FUNCTION within_active_per_board_cap(p_board UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT (
    SELECT COUNT(*) FROM public.tasks WHERE board_id = p_board AND archived = false
  ) < (
    SELECT e.active_cap_per_board 
    FROM public.boards b 
    JOIN public.entitlements e ON b.user_id = e.user_id 
    WHERE b.id = p_board
  );
$$;

CREATE OR REPLACE FUNCTION get_user_plan(p_user UUID)
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(plan, 'free') FROM public.entitlements WHERE user_id = p_user;
$$;

-- 6. Initialize entitlements for existing users
INSERT INTO public.entitlements (user_id, plan)
SELECT id, 'free' FROM public.profiles 
WHERE id NOT IN (SELECT user_id FROM public.entitlements);

-- 7. Enable RLS on entitlements
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies for entitlements
CREATE POLICY "Users can view their own entitlements" ON public.entitlements 
FOR SELECT USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE policies for users - entitlements managed by server only

-- 9. Add comments for documentation
COMMENT ON TABLE public.entitlements IS 'User plan entitlements and limits for Free vs Pro gating';
COMMENT ON COLUMN public.entitlements.plan IS 'User plan: free or pro';
COMMENT ON COLUMN public.entitlements.board_cap IS 'Maximum number of boards allowed';
COMMENT ON COLUMN public.entitlements.active_cap_per_board IS 'Maximum active tasks per board';
COMMENT ON COLUMN public.entitlements.archive_retention_days IS 'Days to keep archived tasks (90 for free, indefinite for pro)';
COMMENT ON COLUMN public.entitlements.archived_cap_per_user IS 'Maximum archived tasks per user';
