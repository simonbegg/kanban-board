-- Simple RLS policies for ownership only
-- Cap enforcement will be handled at application layer

-- Ensure archived columns exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can insert their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON public.boards;

DROP POLICY IF EXISTS "Users can view columns of their boards" ON public.columns;
DROP POLICY IF EXISTS "Users can insert columns to their boards" ON public.columns;
DROP POLICY IF EXISTS "Users can update columns of their boards" ON public.columns;

DROP POLICY IF EXISTS "Users can view tasks of their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks to their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks of their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks of their boards" ON public.tasks;

-- Simple ownership policies for boards
CREATE POLICY "Users can view their own boards" ON public.boards 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own boards" ON public.boards 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" ON public.boards 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" ON public.boards 
FOR DELETE USING (auth.uid() = user_id);

-- Simple ownership policies for columns
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

-- Simple ownership policies for tasks
CREATE POLICY "Users can view tasks of their boards" ON public.tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = tasks.board_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert tasks to their boards" ON public.tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = tasks.board_id AND b.user_id = auth.uid()
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
    WHERE b.id = tasks.board_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks of their boards" ON public.tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = tasks.board_id AND boards.user_id = auth.uid()
  )
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_board_archived ON public.tasks(board_id, archived);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON public.tasks(archived_at) WHERE (archived = true);
