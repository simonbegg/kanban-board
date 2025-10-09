-- Function to bulk update task positions
-- This is more efficient than individual updates and won't hit rate limits

CREATE OR REPLACE FUNCTION bulk_update_task_positions(
  task_updates JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_update JSONB;
BEGIN
  -- Loop through each task update and apply it
  FOR task_update IN SELECT * FROM jsonb_array_elements(task_updates)
  LOOP
    UPDATE public.tasks
    SET position = (task_update->>'position')::INTEGER
    WHERE id = (task_update->>'id')::UUID;
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION bulk_update_task_positions(JSONB) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION bulk_update_task_positions(JSONB) IS 
  'Bulk updates task positions. Accepts array of {id, position} objects. Used for sorting operations.';
