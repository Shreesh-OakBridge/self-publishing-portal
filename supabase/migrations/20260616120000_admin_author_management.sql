/*
  # Admin author management

  - Admins can read ALL saved customizations/calculations (authors still only
    see their own).
  - `admin_authors()` exposes author profiles from auth.users (name/bio/book
    scope) to admins only — clients can't query auth.users directly, so this
    SECURITY DEFINER function is the safe bridge. Admin users are excluded.
*/

-- Admins read all saved work (in addition to "users read their own").
DROP POLICY IF EXISTS "Admins view all customizations" ON book_customizations;
CREATE POLICY "Admins view all customizations"
  ON book_customizations FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins view all calculations" ON royalty_calculations;
CREATE POLICY "Admins view all calculations"
  ON royalty_calculations FOR SELECT TO authenticated USING (is_admin());

-- Author profiles for admins (returns rows only when the caller is an admin).
CREATE OR REPLACE FUNCTION admin_authors()
  RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    first_name text,
    last_name text,
    bio text,
    book_scope text,
    created_at timestamptz
  )
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::text,
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
