-- Add subscription state tracking to entitlements table
-- Extends existing entitlements for Pro cancellation flow

-- 1. Add subscription lifecycle columns
ALTER TABLE public.entitlements 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
    CHECK (status IN ('active', 'cancel_scheduled', 'grace', 'enforced', 'lapsed')),
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancel_effective_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS courtesy_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS enforcement_state TEXT DEFAULT 'none'
    CHECK (enforcement_state IN ('none', 'soft_warn', 'enforced')),
  ADD COLUMN IF NOT EXISTS primary_board_id UUID REFERENCES public.boards(id) ON DELETE SET NULL;

-- 2. Create indexes for scheduled job queries
CREATE INDEX IF NOT EXISTS idx_entitlements_cancel_effective 
  ON public.entitlements(cancel_effective_at) 
  WHERE cancel_effective_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entitlements_courtesy_until 
  ON public.entitlements(courtesy_until) 
  WHERE courtesy_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entitlements_status 
  ON public.entitlements(status) 
  WHERE status != 'active';

-- 3. Add comments for documentation
COMMENT ON COLUMN public.entitlements.status IS 'Subscription status: active, cancel_scheduled, grace, enforced, lapsed';
COMMENT ON COLUMN public.entitlements.cancel_at_period_end IS 'True if user requested cancellation at billing period end';
COMMENT ON COLUMN public.entitlements.current_period_end IS 'End of current billing period (for Pro users)';
COMMENT ON COLUMN public.entitlements.cancel_effective_at IS 'When cancellation takes effect (period end or immediate)';
COMMENT ON COLUMN public.entitlements.courtesy_until IS 'End of 14-day grace period after downgrade to Free';
COMMENT ON COLUMN public.entitlements.enforcement_state IS 'Free plan enforcement level: none, soft_warn (grace), enforced';
COMMENT ON COLUMN public.entitlements.primary_board_id IS 'User-selected primary board for Free plan (only this board stays editable)';
