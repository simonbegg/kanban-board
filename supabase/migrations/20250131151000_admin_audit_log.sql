-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'view_board', 'view_task', 'modify_board', etc.
  target_user_id UUID,
  target_resource_type TEXT, -- 'board', 'task', 'column'
  target_resource_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_log 
FOR SELECT USING (
  auth.jwt() ->> 'email' IN (
    'simon@teamtwobees.com', 
    'simon@threelanes.app'
  ) OR
  auth.jwt() ->> 'email' LIKE '%@threelanes.app' OR
  auth.jwt() ->> 'email' LIKE '%@teamtwobees.com'
);

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs" ON admin_audit_log 
FOR INSERT WITH CHECK (false);
