/*
  # Storage bucket for admin media (video uploads)

  - Creates a public `site-media` bucket. Public read so the marketing site can
    stream the video; uploads/changes restricted to admins (is_admin()).
  - Requires the admin migration (is_admin()) to have been applied already.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read (needed to stream the uploaded video).
DROP POLICY IF EXISTS "Public read site-media" ON storage.objects;
CREATE POLICY "Public read site-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-media');

-- Only admins may upload / replace / delete media.
DROP POLICY IF EXISTS "Admins upload site-media" ON storage.objects;
CREATE POLICY "Admins upload site-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND is_admin());

DROP POLICY IF EXISTS "Admins update site-media" ON storage.objects;
CREATE POLICY "Admins update site-media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND is_admin())
  WITH CHECK (bucket_id = 'site-media' AND is_admin());

DROP POLICY IF EXISTS "Admins delete site-media" ON storage.objects;
CREATE POLICY "Admins delete site-media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND is_admin());
