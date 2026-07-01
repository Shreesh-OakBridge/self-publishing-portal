/*
  # Admin bifurcation — roles, profile, owner-managed admin accounts

  - admin_users gains full_name, role (owner/admin/editor), last_login_at.
  - admin_role() / is_owner() helpers for role checks.
  - touch_admin_login() stamps last login.
  - RLS: any admin may read the admin list; only owners can add/edit/remove.
  - The seed admin (info@oakbridge.in) becomes the owner.

  Same Supabase auth as authors — admins are simply users whose email is in
  admin_users; the /admin login is a separate screen and is_admin() gates it.
*/

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

DO $$ BEGIN
  ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_chk CHECK (role IN ('owner', 'admin', 'editor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Case-insensitive admin check.
CREATE OR REPLACE FUNCTION is_admin()
  RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE lower(email) = lower(auth.jwt() ->> 'email'));
$$;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;

CREATE OR REPLACE FUNCTION admin_role()
  RETURNS text LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT role FROM admin_users WHERE lower(email) = lower(auth.jwt() ->> 'email') LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION admin_role() TO authenticated;

CREATE OR REPLACE FUNCTION is_owner()
  RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE lower(email) = lower(auth.jwt() ->> 'email') AND role = 'owner'
  );
$$;
GRANT EXECUTE ON FUNCTION is_owner() TO authenticated;

CREATE OR REPLACE FUNCTION touch_admin_login()
  RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE admin_users SET last_login_at = now() WHERE lower(email) = lower(auth.jwt() ->> 'email');
$$;
GRANT EXECUTE ON FUNCTION touch_admin_login() TO authenticated;

-- RLS: admins read the list; only owners manage it.
DROP POLICY IF EXISTS "Admins read admin_users" ON admin_users;
CREATE POLICY "Admins read admin_users" ON admin_users FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Owners insert admin_users" ON admin_users;
CREATE POLICY "Owners insert admin_users" ON admin_users FOR INSERT TO authenticated WITH CHECK (is_owner());
DROP POLICY IF EXISTS "Owners update admin_users" ON admin_users;
CREATE POLICY "Owners update admin_users" ON admin_users FOR UPDATE TO authenticated USING (is_owner()) WITH CHECK (is_owner());
DROP POLICY IF EXISTS "Owners delete admin_users" ON admin_users;
CREATE POLICY "Owners delete admin_users" ON admin_users FOR DELETE TO authenticated USING (is_owner());

-- Primary admin is the owner.
UPDATE admin_users SET role = 'owner' WHERE lower(email) = 'info@oakbridge.in';
