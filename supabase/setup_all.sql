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
-- 6. Activity log (audit trail) — admin read; triggers record events
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity text,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read activity log" ON activity_log;
CREATE POLICY "Admins read activity log"
  ON activity_log FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Users log own activity" ON activity_log;
CREATE POLICY "Users log own activity"
  ON activity_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

CREATE OR REPLACE FUNCTION log_table_activity()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_action text; v_entity text; v_meta jsonb := '{}'::jsonb;
BEGIN
  IF TG_TABLE_NAME = 'publishing_leads' THEN
    v_action := 'lead.created'; v_entity := NEW.full_name;
    v_meta := jsonb_build_object('email', NEW.email, 'plan', NEW.preferred_plan);
  ELSIF TG_TABLE_NAME = 'book_customizations' THEN
    v_action := 'customization.saved'; v_entity := NEW.book_size;
    v_meta := jsonb_build_object('price', NEW.estimated_price, 'binding', NEW.binding);
  ELSIF TG_TABLE_NAME = 'royalty_calculations' THEN
    v_action := 'calculation.saved'; v_entity := NEW.plan_type;
    v_meta := jsonb_build_object('book_price', NEW.book_price, 'monthly_earnings', NEW.monthly_earnings);
  ELSIF TG_TABLE_NAME = 'site_content' THEN
    v_action := 'content.' || lower(TG_OP); v_entity := NEW.key;
  END IF;
  INSERT INTO activity_log (actor_id, actor_email, action, entity, metadata)
  VALUES (auth.uid(), auth.jwt() ->> 'email', v_action, v_entity, v_meta);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_leads ON publishing_leads;
CREATE TRIGGER trg_log_leads AFTER INSERT ON publishing_leads
  FOR EACH ROW EXECUTE FUNCTION log_table_activity();
DROP TRIGGER IF EXISTS trg_log_customizations ON book_customizations;
CREATE TRIGGER trg_log_customizations AFTER INSERT ON book_customizations
  FOR EACH ROW EXECUTE FUNCTION log_table_activity();
DROP TRIGGER IF EXISTS trg_log_calculations ON royalty_calculations;
CREATE TRIGGER trg_log_calculations AFTER INSERT ON royalty_calculations
  FOR EACH ROW EXECUTE FUNCTION log_table_activity();
DROP TRIGGER IF EXISTS trg_log_content ON site_content;
CREATE TRIGGER trg_log_content AFTER INSERT OR UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION log_table_activity();

CREATE OR REPLACE FUNCTION log_auth_activity()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (actor_id, actor_email, action, entity)
    VALUES (NEW.id, NEW.email, 'user.signup', NEW.raw_user_meta_data ->> 'full_name');
  ELSIF TG_OP = 'UPDATE'
        AND NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
    INSERT INTO activity_log (actor_id, actor_email, action, entity)
    VALUES (NEW.id, NEW.email, 'profile.updated', NEW.raw_user_meta_data ->> 'full_name');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_auth_insert ON auth.users;
CREATE TRIGGER trg_log_auth_insert AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION log_auth_activity();
DROP TRIGGER IF EXISTS trg_log_auth_update ON auth.users;
CREATE TRIGGER trg_log_auth_update AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION log_auth_activity();

-- ============================================================
-- 7. Seed your admin email  (EDIT THIS to your admin's email)
-- ============================================================
INSERT INTO admin_users (email)
VALUES ('info@oakbridge.in')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 8. Manuscripts (author submissions) — private bucket + table
-- ============================================================
CREATE TABLE IF NOT EXISTS manuscripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  genre text,
  file_path text NOT NULL,
  file_name text,
  file_size bigint,
  word_count integer,
  status text NOT NULL DEFAULT 'submitted',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS word_count integer;
ALTER TABLE manuscripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authors insert own manuscripts" ON manuscripts;
CREATE POLICY "Authors insert own manuscripts"
  ON manuscripts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authors read own manuscripts" ON manuscripts;
CREATE POLICY "Authors read own manuscripts"
  ON manuscripts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authors delete own manuscripts" ON manuscripts;
CREATE POLICY "Authors delete own manuscripts"
  ON manuscripts FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read all manuscripts" ON manuscripts;
CREATE POLICY "Admins read all manuscripts"
  ON manuscripts FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Admins update manuscripts" ON manuscripts;
CREATE POLICY "Admins update manuscripts"
  ON manuscripts FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('manuscripts', 'manuscripts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authors upload own manuscripts" ON storage.objects;
CREATE POLICY "Authors upload own manuscripts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'manuscripts' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Authors read own manuscript files" ON storage.objects;
CREATE POLICY "Authors read own manuscript files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'manuscripts' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Authors delete own manuscript files" ON storage.objects;
CREATE POLICY "Authors delete own manuscript files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'manuscripts' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Admins read all manuscript files" ON storage.objects;
CREATE POLICY "Admins read all manuscript files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'manuscripts' AND is_admin());

-- Activity logging for manuscript submissions (re-creates the generic logger
-- with a manuscripts branch + adds the trigger).
CREATE OR REPLACE FUNCTION log_table_activity()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_action text; v_entity text; v_meta jsonb := '{}'::jsonb;
BEGIN
  IF TG_TABLE_NAME = 'publishing_leads' THEN
    v_action := 'lead.created'; v_entity := NEW.full_name;
    v_meta := jsonb_build_object('email', NEW.email, 'plan', NEW.preferred_plan);
  ELSIF TG_TABLE_NAME = 'book_customizations' THEN
    v_action := 'customization.saved'; v_entity := NEW.book_size;
    v_meta := jsonb_build_object('price', NEW.estimated_price, 'binding', NEW.binding);
  ELSIF TG_TABLE_NAME = 'royalty_calculations' THEN
    v_action := 'calculation.saved'; v_entity := NEW.plan_type;
    v_meta := jsonb_build_object('book_price', NEW.book_price, 'monthly_earnings', NEW.monthly_earnings);
  ELSIF TG_TABLE_NAME = 'site_content' THEN
    v_action := 'content.' || lower(TG_OP); v_entity := NEW.key;
  ELSIF TG_TABLE_NAME = 'manuscripts' THEN
    v_action := 'manuscript.submitted'; v_entity := NEW.title;
    v_meta := jsonb_build_object('genre', NEW.genre, 'file', NEW.file_name);
  END IF;
  INSERT INTO activity_log (actor_id, actor_email, action, entity, metadata)
  VALUES (auth.uid(), auth.jwt() ->> 'email', v_action, v_entity, v_meta);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_manuscripts ON manuscripts;
CREATE TRIGGER trg_log_manuscripts AFTER INSERT ON manuscripts
  FOR EACH ROW EXECUTE FUNCTION log_table_activity();
