-- Add archive pruning functions for Free vs Pro limits
-- This migration adds functions to automatically clean up old archived tasks

-- 1. Function to prune archives for a specific user
CREATE OR REPLACE FUNCTION prune_archives_for_user(p_user UUID)
RETURNS TEXT LANGUAGE PLPGSQL AS $$
DECLARE
  keep_days INT;
  cap INT;
  deleted_count INT := 0;
  age_deleted INT := 0;
  cap_deleted INT := 0;
BEGIN
  -- Get user's entitlements
  SELECT archive_retention_days, archived_cap_per_user
  INTO keep_days, cap
  FROM public.entitlements 
  WHERE user_id = p_user;
  
  -- If no entitlements found, use free plan defaults
  IF keep_days IS NULL THEN
    keep_days := 90;
    cap := 1000;
  END IF;

  -- Age-based pruning (skip for Pro users with very high retention)
  IF keep_days < 36500 THEN
    DELETE FROM public.tasks t
    USING public.boards b
    WHERE t.board_id = b.id
      AND b.user_id = p_user
      AND t.archived = true
      AND t.archived_at < NOW() - (keep_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS age_deleted = ROW_COUNT;
    deleted_count := deleted_count + age_deleted;
  END IF;

  -- Cap-based pruning (oldest archived first)
  WITH ranked_archives AS (
    SELECT t.id,
           ROW_NUMBER() OVER (ORDER BY t.archived_at ASC NULLS FIRST) as rn
    FROM public.tasks t
    JOIN public.boards b ON t.board_id = b.id
    WHERE b.user_id = p_user 
      AND t.archived = true
  )
  DELETE FROM public.tasks t
  USING ranked_archives r
  WHERE t.id = r.id 
    AND r.rn > cap;
  
  GET DIAGNOSTICS cap_deleted = ROW_COUNT;
  deleted_count := deleted_count + cap_deleted;

  RETURN format('Deleted %s archived tasks (age: %s, cap: %s)', 
                 deleted_count, age_deleted, cap_deleted);
END;
$$;

-- 2. Function to prune archives for all users (for cron jobs)
CREATE OR REPLACE FUNCTION prune_all_archives()
RETURNS TABLE(
  user_id UUID,
  result TEXT
) LANGUAGE PLPGSQL AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Create temporary table to store results
  CREATE TEMP TABLE IF NOT EXISTS prune_results (
    user_id UUID,
    result TEXT
  ) ON COMMIT DROP;

  -- Process each user with entitlements
  FOR user_record IN 
    SELECT DISTINCT user_id FROM public.entitlements
  LOOP
    INSERT INTO prune_results (user_id, result)
    VALUES (user_record.user_id, prune_archives_for_user(user_record.user_id));
  END LOOP;

  -- Return results
  RETURN QUERY SELECT * FROM prune_results;
END;
$$;

-- 3. Function to get archive statistics for a user
CREATE OR REPLACE FUNCTION get_archive_stats(p_user UUID)
RETURNS TABLE(
  total_archived INT,
  older_than_retention INT,
  over_cap INT,
  retention_days INT,
  archived_cap INT
) LANGUAGE SQL STABLE AS $$
  WITH user_entitlements AS (
    SELECT 
      COALESCE(e.archive_retention_days, 90) as retention_days,
      COALESCE(e.archived_cap_per_user, 1000) as archived_cap
    FROM public.entitlements e
    WHERE e.user_id = p_user
    UNION ALL
    SELECT 90, 1000 -- Default free plan values
    LIMIT 1
  ),
  archive_counts AS (
    SELECT 
      COUNT(*) as total_archived,
      COUNT(*) FILTER (WHERE t.archived_at < NOW() - (ue.retention_days || ' days')::INTERVAL) as older_than_retention
    FROM public.tasks t
    JOIN public.boards b ON t.board_id = b.id
    CROSS JOIN user_entitlements ue
    WHERE b.user_id = p_user 
      AND t.archived = true
  ),
  over_cap_count AS (
    SELECT 
      COUNT(*) as over_cap
    FROM (
      SELECT t.id,
             ROW_NUMBER() OVER (ORDER BY t.archived_at ASC NULLS FIRST) as rn
      FROM public.tasks t
      JOIN public.boards b ON t.board_id = b.id
      CROSS JOIN user_entitlements ue
      WHERE b.user_id = p_user 
        AND t.archived = true
    ) ranked
    WHERE ranked.rn > (SELECT archived_cap FROM user_entitlements)
  )
  SELECT 
    ac.total_archived,
    ac.older_than_retention,
    COALESCE(oc.over_cap, 0) as over_cap,
    ue.retention_days,
    ue.archived_cap
  FROM archive_counts ac
  CROSS JOIN user_entitlements ue
  LEFT JOIN over_cap_count oc ON true
$$;

-- 4. Function to check if user needs archive pruning
CREATE OR REPLACE FUNCTION needs_archive_pruning(p_user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT (older_than_retention > 0 OR over_cap > 0)
  FROM get_archive_stats(p_user);
$$;

-- 5. Add helpful comments
COMMENT ON FUNCTION prune_archives_for_user IS 'Prunes archived tasks for a user based on their plan limits';
COMMENT ON FUNCTION prune_all_archives IS 'Prunes archived tasks for all users (for cron jobs)';
COMMENT ON FUNCTION get_archive_stats IS 'Returns statistics about archived tasks for a user';
COMMENT ON FUNCTION needs_archive_pruning IS 'Checks if a user has archived tasks that need pruning';

-- 6. Create index for archive pruning performance
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at 
ON public.tasks(archived_at) WHERE (archived = true AND archived_at IS NOT NULL);
