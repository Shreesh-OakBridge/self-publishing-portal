/*
  # Proofs storage bucket

  A public bucket for design proofs the team uploads in the project workspace.
  Public read (so the author can open the file via its URL); only admins upload.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins upload proofs" ON storage.objects;
CREATE POLICY "Admins upload proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proofs' AND is_admin());

DROP POLICY IF EXISTS "Public read proofs" ON storage.objects;
CREATE POLICY "Public read proofs" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'proofs');
