/*
  # Author Accounts + Admin Security

  1. Author ownership
     - Add `user_id` to `book_customizations` and `royalty_calculations`,
       referencing auth.users. Anonymous saves keep user_id NULL; logged-in
       authors save with their own id.
     - RLS: a logged-in author can SELECT their own saved rows.
     - INSERT is scoped so a user can only attach their own id (or NULL).

  2. Admin gating
     - `admin_users` table lists admin emails. `is_admin()` checks the current
       user's email against it (security definer, so it bypasses admin_users RLS).
     - Leads are now readable only by admins (was: any authenticated user).
     - site_content writes are now admin-only (was: any authenticated user).
     - This prevents author accounts from reaching the CMS or leads.

  IMPORTANT: after running, add your admin email to `admin_users` (see bottom).
*/

-- ============================================================
-- Author ownership on saved tables
-- ============================================================
ALTER TABLE book_customizations
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE royalty_calculations
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Scoped INSERT: anyone may insert, but may only set their own user_id (or NULL).
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
  ON book_customizations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own calculations" ON royalty_calculations;
CREATE POLICY "Users can view their own calculations"
  ON royalty_calculations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Admin gating
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- No policies: not directly readable by clients. Only is_admin() (security
-- definer) can read it.

CREATE OR REPLACE FUNCTION is_admin()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = (auth.jwt() ->> 'email')
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;

-- Leads: admin-only read (replaces the any-authenticated policy).
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON publishing_leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON publishing_leads;
CREATE POLICY "Admins can view all leads"
  ON publishing_leads FOR SELECT TO authenticated
  USING (is_admin());

-- site_content: admin-only writes (public read stays).
DROP POLICY IF EXISTS "Authenticated users can insert site content" ON site_content;
CREATE POLICY "Admins can insert site content"
  ON site_content FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Authenticated users can update site content" ON site_content;
CREATE POLICY "Admins can update site content"
  ON site_content FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Authenticated users can delete site content" ON site_content;
CREATE POLICY "Admins can delete site content"
  ON site_content FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================
-- Seed your admin email (edit before running, or run separately)
-- ============================================================
INSERT INTO admin_users (email)
VALUES ('info@oakbridge.in')
ON CONFLICT (email) DO NOTHING;
