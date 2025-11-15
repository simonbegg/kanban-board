-- Update RLS policies for Free vs Pro gating
-- This migration replaces existing policies with cap-aware ones

-- Ensure archived columns exist (required for task policies)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Ensure cap checking functions exist (create if not already created)
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

-- 1. Drop all existing board policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can insert their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON public.boards;

-- 2. Create cap-aware board policies
CREATE POLICY "Users can view their own boards" ON public.boards 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert boards within cap" ON public.boards 
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  within_board_cap(auth.uid())
);

CREATE POLICY "Users can update their own boards" ON public.boards 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" ON public.boards 
FOR DELETE USING (auth.uid() = user_id);

-- 3. Drop all existing column policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view columns of their boards" ON public.columns;
DROP POLICY IF EXISTS "Users can insert columns to their boards" ON public.columns;
DROP POLICY IF EXISTS "Users can update columns of their boards" ON public.columns;

-- 4. Create cap-aware column policies (inherit board caps)
CREATE POLICY "Users can view columns of their boards" ON public.columns FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = columns.board_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert columns to their boards" ON public.columns FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = columns.board_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update columns of their boards" ON public.columns FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = columns.board_id AND boards.user_id = auth.uid()
  )
);

-- 5. Drop all existing task policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view tasks of their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks to their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks of their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks of their boards" ON public.tasks;

-- 6. Create cap-aware task policies
CREATE POLICY "Users can view tasks of their boards" ON public.tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = tasks.board_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert tasks to their boards" ON public.tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b 
    WHERE b.id = new.board_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks of their boards" ON public.tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = tasks.board_id AND boards.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b 
    WHERE b.id = new.board_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks of their boards" ON public.tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = tasks.board_id AND boards.user_id = auth.uid()
  )
);

-- 7. Add performance indexes for cap checking
CREATE INDEX IF NOT EXISTS idx_tasks_board_active_count 
ON public.tasks(board_id) WHERE (archived = false);

CREATE INDEX IF NOT EXISTS idx_boards_user_count 
ON public.boards(user_id);

-- 8. Function to get current usage for a user
CREATE OR REPLACE FUNCTION get_user_usage(p_user UUID)
RETURNS TABLE(
  board_count INT,
  total_active_tasks INT,
  total_archived_tasks INT,
  plan TEXT
) LANGUAGE SQL STABLE AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.boards WHERE user_id = p_user) as board_count,
    (SELECT COUNT(*) FROM public.tasks t
     JOIN public.boards b ON t.board_id = b.id 
     WHERE b.user_id = p_user AND t.archived = false) as total_active_tasks,
    (SELECT COUNT(*) FROM public.tasks t
     JOIN public.boards b ON t.board_id = b.id 
     WHERE b.user_id = p_user AND t.archived = true) as total_archived_tasks,
    get_user_plan(p_user) as plan;
$$;

-- 9. Function to get per-board usage
CREATE OR REPLACE FUNCTION get_board_usage(p_board UUID)
RETURNS TABLE(
  active_tasks INT,
  archived_tasks INT,
  user_plan TEXT,
  active_cap INT
) LANGUAGE SQL STABLE AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.tasks WHERE board_id = p_board AND archived = false) as active_tasks,
    (SELECT COUNT(*) FROM public.tasks WHERE board_id = p_board AND archived = true) as archived_tasks,
    get_user_plan(b.user_id) as user_plan,
    e.active_cap_per_board as active_cap
  FROM public.boards b
  JOIN public.entitlements e ON b.user_id = e.user_id
  WHERE b.id = p_board;
$$;

-- 10. Add helpful comments
COMMENT ON FUNCTION within_board_cap IS 'Checks if user can create more boards based on their plan';
COMMENT ON FUNCTION within_active_per_board_cap IS 'Checks if board can have more active tasks based on user plan';
COMMENT ON FUNCTION get_user_usage IS 'Returns current usage statistics for a user';
COMMENT ON FUNCTION get_board_usage IS 'Returns usage statistics for a specific board';
