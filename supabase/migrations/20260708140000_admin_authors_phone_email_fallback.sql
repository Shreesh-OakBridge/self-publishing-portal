/*
  # admin_authors(): email/phone fallback for phone-first signups

  Phone-first signups leave auth.users.email null until the author separately
  confirms the best-effort "add email" link (see AuthForm.tsx verifyPhoneOtp).
  Until then, fall back to the email/phone stashed in user_metadata at signup
  time so admin views aren't blank. Also now exposes phone directly.
*/

CREATE OR REPLACE FUNCTION admin_authors()
  RETURNS TABLE (
    id uuid,
    email text,
    phone text,
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
    COALESCE(u.email, u.raw_user_meta_data ->> 'email')::text,
    COALESCE(u.phone, u.raw_user_meta_data ->> 'phone')::text,
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'first_name',
    u.raw_user_meta_data ->> 'last_name',
    u.raw_user_meta_data ->> 'bio',
    u.raw_user_meta_data ->> 'book_scope',
    u.created_at
  FROM auth.users u
  WHERE is_admin()
    AND NOT EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.email = COALESCE(u.email, u.raw_user_meta_data ->> 'email')
    )
  ORDER BY u.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION admin_authors() TO authenticated;
