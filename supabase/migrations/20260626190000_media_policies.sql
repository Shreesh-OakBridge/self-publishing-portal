/*
  # Media library policies (site-media bucket)

  The CMS already uploads to the public `site-media` bucket. The Media Library
  also needs to LIST and DELETE objects via the API, which requires select /
  delete policies on storage.objects. Public website assets, so read is open;
  writes/deletes are admin-only.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read site-media" ON storage.objects;
CREATE POLICY "Public read site-media" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "Admins write site-media" ON storage.objects;
CREATE POLICY "Admins write site-media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND is_admin());

DROP POLICY IF EXISTS "Admins update site-media" ON storage.objects;
CREATE POLICY "Admins update site-media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND is_admin())
  WITH CHECK (bucket_id = 'site-media' AND is_admin());

DROP POLICY IF EXISTS "Admins delete site-media" ON storage.objects;
CREATE POLICY "Admins delete site-media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND is_admin());
