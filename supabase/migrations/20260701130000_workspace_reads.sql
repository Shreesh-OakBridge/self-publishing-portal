/*
  # Project Workspace — read tracking + triage helpers (Tranche 2)

  project_reads: per-order "last seen" timestamps for each side, powering the
  unread badges (author + admin) and the admin Workspace queue.

  Writes go only through mark_workspace_seen() (SECURITY DEFINER), which sets the
  correct column based on the caller — so neither side can tamper the other's.

  Idempotent — safe to re-run.
*/

CREATE TABLE IF NOT EXISTS project_reads (
  order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  author_seen_at timestamptz,
  team_seen_at timestamptz
);

ALTER TABLE project_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own project reads" ON project_reads;
CREATE POLICY "Read own project reads" ON project_reads FOR SELECT TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- Mark the workspace "seen" for whichever side is calling.
CREATE OR REPLACE FUNCTION mark_workspace_seen(p_order uuid) RETURNS void AS $$
BEGIN
  IF is_admin() THEN
    INSERT INTO project_reads (order_id, team_seen_at) VALUES (p_order, now())
    ON CONFLICT (order_id) DO UPDATE SET team_seen_at = now();
  ELSIF EXISTS (SELECT 1 FROM orders o WHERE o.id = p_order AND o.user_id = auth.uid()) THEN
    INSERT INTO project_reads (order_id, author_seen_at) VALUES (p_order, now())
    ON CONFLICT (order_id) DO UPDATE SET author_seen_at = now();
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_workspace_seen(uuid) TO authenticated;

-- Author-facing: unread counts for the current user's own orders.
CREATE OR REPLACE FUNCTION my_workspace_unread()
RETURNS TABLE (order_id uuid, unread_msgs bigint, pending_proofs bigint) AS $$
  SELECT o.id,
    (SELECT count(*) FROM project_messages m
       WHERE m.order_id = o.id AND m.sender_role = 'team'
         AND m.created_at > COALESCE(r.author_seen_at, 'epoch'::timestamptz)),
    (SELECT count(*) FROM project_proofs p
       WHERE p.order_id = o.id AND p.status = 'pending')
  FROM orders o
  LEFT JOIN project_reads r ON r.order_id = o.id
  WHERE o.user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION my_workspace_unread() TO authenticated;

-- Admin-facing: triage queue across all orders that have workspace activity.
CREATE OR REPLACE FUNCTION admin_workspace_queue()
RETURNS TABLE (
  order_id uuid,
  ship_name text,
  plan text,
  invoice_number text,
  last_activity_at timestamptz,
  unread_msgs bigint,
  pending_decisions bigint
) AS $$
  SELECT o.id, o.ship_name, o.plan, o.invoice_number,
    GREATEST(
      COALESCE((SELECT max(m.created_at) FROM project_messages m WHERE m.order_id = o.id), 'epoch'::timestamptz),
      COALESCE((SELECT max(p.created_at) FROM project_proofs p WHERE p.order_id = o.id), 'epoch'::timestamptz),
      COALESCE((SELECT max(p.decided_at) FROM project_proofs p WHERE p.order_id = o.id), 'epoch'::timestamptz)
    ) AS last_activity_at,
    (SELECT count(*) FROM project_messages m
       WHERE m.order_id = o.id AND m.sender_role = 'author'
         AND m.created_at > COALESCE(r.team_seen_at, 'epoch'::timestamptz)),
    (SELECT count(*) FROM project_proofs p
       WHERE p.order_id = o.id AND p.status IN ('approved', 'changes_requested')
         AND p.decided_at > COALESCE(r.team_seen_at, 'epoch'::timestamptz))
  FROM orders o
  LEFT JOIN project_reads r ON r.order_id = o.id
  WHERE is_admin()
    AND (
      EXISTS (SELECT 1 FROM project_messages m WHERE m.order_id = o.id)
      OR EXISTS (SELECT 1 FROM project_proofs p WHERE p.order_id = o.id)
    )
  ORDER BY last_activity_at DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_workspace_queue() TO authenticated;
