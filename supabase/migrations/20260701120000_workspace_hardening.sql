/*
  # Project Workspace — security & realtime hardening (Tranche 1)

  1. Proof files become PRIVATE (they were world-readable). Authors and admins
     read them via short-lived signed URLs; storage RLS scopes reads to the
     owning author (matched on the "<orderId>/…" object path).
  2. Message inserts bind sender_role to the real role — an author can no longer
     post a message labelled as the "team", and vice-versa.
  3. Authors may only approve / request-changes on a proof, not rewrite its
     content — enforced by a BEFORE UPDATE trigger.
  4. Realtime is enabled on the workspace tables so both sides get live updates.

  Idempotent — safe to re-run.
*/

-- 1. Private proofs bucket + scoped read ------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'proofs';

DROP POLICY IF EXISTS "Public read proofs" ON storage.objects;
DROP POLICY IF EXISTS "Read proofs on own orders" ON storage.objects;
CREATE POLICY "Read proofs on own orders" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'proofs' AND (
      is_admin() OR EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = ((storage.foldername(name))[1])::uuid
          AND o.user_id = auth.uid()
      )
    )
  );

-- 2. Bind message sender_role to the real role ------------------------------
DROP POLICY IF EXISTS "Send messages on own orders" ON project_messages;
CREATE POLICY "Send messages on own orders" ON project_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      (is_admin() AND sender_role = 'team') OR
      (sender_role = 'author' AND EXISTS (
        SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()
      ))
    )
  );

-- 3. Authors can only decide on a proof, not rewrite it ---------------------
CREATE OR REPLACE FUNCTION enforce_proof_author_update() RETURNS trigger AS $$
BEGIN
  IF is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.order_id      IS DISTINCT FROM OLD.order_id
     OR NEW.title      IS DISTINCT FROM OLD.title
     OR NEW.note       IS DISTINCT FROM OLD.note
     OR NEW.file_url   IS DISTINCT FROM OLD.file_url
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Authors may only approve or request changes on a proof.';
  END IF;
  IF NEW.status NOT IN ('approved', 'changes_requested') THEN
    RAISE EXCEPTION 'Invalid proof status.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_proof_author_update ON project_proofs;
CREATE TRIGGER trg_enforce_proof_author_update
  BEFORE UPDATE ON project_proofs
  FOR EACH ROW EXECUTE FUNCTION enforce_proof_author_update();

-- 4. Realtime for live updates (idempotent add to the publication) -----------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'project_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'project_proofs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_proofs;
  END IF;
END $$;
