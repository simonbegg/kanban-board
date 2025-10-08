-- Function to increment all task positions in a column
-- This is used when adding a new task at position 0

CREATE OR REPLACE FUNCTION increment_task_positions(p_column_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment all task positions in the specified column by 1
  UPDATE public.tasks
  SET position = position + 1
  WHERE column_id = p_column_id
    AND archived = false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_task_positions(UUID) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION increment_task_positions(UUID) IS 
  'Increments position of all non-archived tasks in a column by 1. Used when adding new tasks at the top.';
