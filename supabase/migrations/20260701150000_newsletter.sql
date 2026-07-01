/*
  # Newsletter subscribers

  Captures footer newsletter signups. Anyone (incl. logged-out visitors) may
  subscribe; only admins can read the list. Email is unique so re-subscribing
  is a no-op.

  Idempotent — safe to re-run.
*/

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone may subscribe (anon + authenticated).
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read the list.
DROP POLICY IF EXISTS "Admins read subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins read subscribers" ON newsletter_subscribers FOR SELECT TO authenticated
  USING (is_admin());
