-- ============================================================================
-- OakBridge Publishing — COMPLETE database setup (single source of truth)
-- ----------------------------------------------------------------------------
-- Paste this whole file into Supabase: SQL Editor -> New query -> Run.
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / DROP POLICY
-- IF EXISTS throughout. This supersedes the individual snippets.
--
-- After running:
--   1) Authentication -> Users -> Add user  (your admin login)
--   2) Make sure that email is in admin_users (the seed at the bottom adds
--      info@oakbridge.in — edit it if your admin email differs).
-- ============================================================================

-- ============================================================
-- 0. Admins + is_admin() helper (used by policies below)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- No client policies: only is_admin() (security definer) reads this table.

CREATE OR REPLACE FUNCTION is_admin()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE email = (auth.jwt() ->> 'email')
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;

-- ============================================================
-- 1. publishing_leads (contact form submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS publishing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  manuscript_title text,
  genre text,
  manuscript_status text NOT NULL,
  preferred_plan text,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE publishing_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or logged-in) may submit a lead.
DROP POLICY IF EXISTS "Anyone can submit a publishing lead" ON publishing_leads;
CREATE POLICY "Anyone can submit a publishing lead"
  ON publishing_leads FOR INSERT TO public WITH CHECK (true);

-- Only admins may read leads.
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON publishing_leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON publishing_leads;
CREATE POLICY "Admins can view all leads"
  ON publishing_leads FOR SELECT TO authenticated USING (is_admin());

-- ============================================================
-- 2. book_customizations & royalty_calculations (author-owned saves)
-- ============================================================
CREATE TABLE IF NOT EXISTS book_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  paper_type text,
  interior_color text,
  binding text,
  cover_design text,
  layout_option text,
  book_size text,
  estimated_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS royalty_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  book_price numeric NOT NULL,
  expected_sales integer DEFAULT 0,
  plan_type text,
  estimated_royalty numeric DEFAULT 0,
  monthly_earnings numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Ensure newer columns exist on already-created tables (safe to re-run).
ALTER TABLE book_customizations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE book_customizations ADD COLUMN IF NOT EXISTS interior_color text;
ALTER TABLE book_customizations ADD COLUMN IF NOT EXISTS binding text;
ALTER TABLE royalty_calculations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE book_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_calculations ENABLE ROW LEVEL SECURITY;

-- Insert allowed for everyone, but a user may only attach their own id (or NULL).
DROP POLICY IF EXISTS "Anyone can insert book customizations" ON book_customizations;
CREATE POLICY "Anyone can insert book customizations"
  ON book_customizations FOR INSERT TO public
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert royalty calculations" ON royalty_calculations;
CREATE POLICY "Anyone can insert royalty calculations"
  ON royalty_calculations FOR INSERT TO public
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Authors can read their own saved rows.
DROP POLICY IF EXISTS "Users can view their own customizations" ON book_customizations;
CREATE POLICY "Users can view their own customizations"
  ON book_customizations FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own calculations" ON royalty_calculations;
CREATE POLICY "Users can view their own calculations"
  ON royalty_calculations FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 3. site_content (CMS) — public read, admin-only writes
-- ============================================================
CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read site content" ON site_content;
CREATE POLICY "Anyone can read site content"
  ON site_content FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert site content" ON site_content;
DROP POLICY IF EXISTS "Admins can insert site content" ON site_content;
CREATE POLICY "Admins can insert site content"
  ON site_content FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Authenticated users can update site content" ON site_content;
DROP POLICY IF EXISTS "Admins can update site content" ON site_content;
CREATE POLICY "Admins can update site content"
  ON site_content FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Authenticated users can delete site content" ON site_content;
DROP POLICY IF EXISTS "Admins can delete site content" ON site_content;
CREATE POLICY "Admins can delete site content"
  ON site_content FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- 4. Storage bucket for admin media (video uploads)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read site-media" ON storage.objects;
CREATE POLICY "Public read site-media"
  ON storage.objects FOR SELECT USING (bucket_id = 'site-media');

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

-- ============================================================
-- 5. Admin author management (read all saved work + author profiles)
-- ============================================================
DROP POLICY IF EXISTS "Admins view all customizations" ON book_customizations;
CREATE POLICY "Admins view all customizations"
  ON book_customizations FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins view all calculations" ON royalty_calculations;
CREATE POLICY "Admins view all calculations"
  ON royalty_calculations FOR SELECT TO authenticated USING (is_admin());

CREATE OR REPLACE FUNCTION admin_authors()
  RETURNS TABLE (
    id uuid, email text, full_name text, first_name text, last_name text,
    bio text, book_scope text, created_at timestamptz
  )
  LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT u.id, u.email::text,
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'first_name',
    u.raw_user_meta_data ->> 'last_name',
    u.raw_user_meta_data ->> 'bio',
    u.raw_user_meta_data ->> 'book_scope',
    u.created_at
  FROM auth.users u
  WHERE is_admin()
    AND NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.email = u.email)
  ORDER BY u.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION admin_authors() TO authenticated;

-- ============================================================
-- 6. Seed your admin email  (EDIT THIS to your admin's email)
-- ============================================================
INSERT INTO admin_users (email)
VALUES ('info@oakbridge.in')
ON CONFLICT (email) DO NOTHING;
