/*
  # Free manuscript assessment (sample chapter upload)

  Logged-out visitors can send a sample chapter for a free assessment without
  creating an account. The file goes to a PRIVATE bucket; only admins can read
  it (via signed URLs from Admin → Leads). The lead row stores the file path.

  - Bucket `sample-chapters`: private, 10 MB max, PDF / Word / text only.
  - Anyone may upload, but only under the `incoming/` folder, and cannot
    list, read, overwrite or delete anything.
  - `publishing_leads.sample_path` holds the storage path.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sample-chapters',
  'sample-chapters',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone uploads sample chapters" ON storage.objects;
CREATE POLICY "Anyone uploads sample chapters" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'sample-chapters' AND (storage.foldername(name))[1] = 'incoming');

DROP POLICY IF EXISTS "Admins read sample chapters" ON storage.objects;
CREATE POLICY "Admins read sample chapters" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'sample-chapters' AND is_admin());

DROP POLICY IF EXISTS "Admins delete sample chapters" ON storage.objects;
CREATE POLICY "Admins delete sample chapters" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sample-chapters' AND is_admin());

ALTER TABLE publishing_leads ADD COLUMN IF NOT EXISTS sample_path text;
