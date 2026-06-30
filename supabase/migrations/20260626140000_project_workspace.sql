/*
  # Project Workspace — messages + proof approvals

  Per-order collaboration between an author and the Cursive team.

    project_messages : a message thread on an order.
    project_proofs   : proofs the team posts for the author to Approve / Request Changes.

  RLS: an author can see and act on rows for orders they own (orders.user_id =
  auth.uid()); admins can see and act on everything. Only admins create proofs;
  only the owning author records a proof decision.
*/

-- ── Messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid(),
  sender_role text NOT NULL CHECK (sender_role IN ('author', 'team')),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_messages_order_idx ON project_messages (order_id, created_at);

ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read messages on own orders" ON project_messages;
CREATE POLICY "Read messages on own orders" ON project_messages FOR SELECT TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "Send messages on own orders" ON project_messages;
CREATE POLICY "Send messages on own orders" ON project_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      is_admin() OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    )
  );

-- ── Proofs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  title text NOT NULL,
  note text,
  file_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested')),
  author_comment text,
  decided_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_proofs_order_idx ON project_proofs (order_id, created_at);

ALTER TABLE project_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read proofs on own orders" ON project_proofs;
CREATE POLICY "Read proofs on own orders" ON project_proofs FOR SELECT TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins create proofs" ON project_proofs;
CREATE POLICY "Admins create proofs" ON project_proofs FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Decide proofs" ON project_proofs;
CREATE POLICY "Decide proofs" ON project_proofs FOR UPDATE TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()))
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
