-- Add archived functionality to tasks table
-- This migration adds the ability to archive tasks without deleting them

-- Add archived column (defaults to false for existing tasks)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Add archived_at timestamp column
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for archived tasks queries
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON public.tasks(archived);

-- Create index for combined board_id and archived queries (for performance)
CREATE INDEX IF NOT EXISTS idx_tasks_board_archived ON public.tasks(board_id, archived);

-- Comment on columns
COMMENT ON COLUMN public.tasks.archived IS 'Whether the task is archived (hidden from board)';
COMMENT ON COLUMN public.tasks.archived_at IS 'Timestamp when the task was archived';
