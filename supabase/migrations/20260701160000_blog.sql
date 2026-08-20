/*
  # Blog

  blog_posts: articles authored in the admin panel. Public visitors can read
  only PUBLISHED posts; admins can see and manage everything.

  Idempotent — safe to re-run.
*/

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  body text NOT NULL DEFAULT '',
  cover_url text,
  author_name text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts (status, published_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts; admins can read drafts too.
DROP POLICY IF EXISTS "Public read published posts" ON blog_posts;
CREATE POLICY "Public read published posts" ON blog_posts FOR SELECT TO anon, authenticated
  USING (status = 'published' OR is_admin());

-- Only admins can create / edit / delete posts.
DROP POLICY IF EXISTS "Admins manage posts" ON blog_posts;
CREATE POLICY "Admins manage posts" ON blog_posts FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
