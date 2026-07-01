/*
  # Project Workspace — collaboration extras (Tranche 3)

  1. Message attachments — authors and team can attach a file to a message.
     Files live in a new PRIVATE bucket "workspace-files", scoped to the order.
  2. Admins can delete/withdraw a message or proof (moderation).
  3. Team-only private notes per project (never visible to the author).

  Idempotent — safe to re-run.
*/

-- 1. Message attachments -----------------------------------------------------
ALTER TABLE project_messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE project_messages ADD COLUMN IF NOT EXISTS attachment_name text;

-- Private bucket for workspace attachments (both sides, scoped to the order).
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-files', 'workspace-files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Read workspace files on own orders" ON storage.objects;
CREATE POLICY "Read workspace files on own orders" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'workspace-files' AND (
      is_admin() OR EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = ((storage.foldername(name))[1])::uuid AND o.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Upload workspace files on own orders" ON storage.objects;
CREATE POLICY "Upload workspace files on own orders" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'workspace-files' AND (
      is_admin() OR EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = ((storage.foldername(name))[1])::uuid AND o.user_id = auth.uid()
      )
    )
  );

-- 2. Admin moderation: delete messages / proofs ------------------------------
DROP POLICY IF EXISTS "Admins delete messages" ON project_messages;
CREATE POLICY "Admins delete messages" ON project_messages FOR DELETE TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins delete proofs" ON project_proofs;
CREATE POLICY "Admins delete proofs" ON project_proofs FOR DELETE TO authenticated
  USING (is_admin());

-- 3. Team-only private notes -------------------------------------------------
CREATE TABLE IF NOT EXISTS project_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid(),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_notes_order_idx ON project_notes (order_id, created_at);

ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can see or manage notes — authors have no access at all.
DROP POLICY IF EXISTS "Admins manage notes" ON project_notes;
CREATE POLICY "Admins manage notes" ON project_notes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
