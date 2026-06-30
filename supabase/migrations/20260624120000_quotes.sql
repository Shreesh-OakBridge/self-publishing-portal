-- Quote requests table + RLS (book customizer 'Get a quote' flow)

-- ============================================================
-- 12. Quote requests (book customizer → "Get a quote instead")
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  name text,
  phone text,
  message text,
  -- customization snapshot (option ids from the customizer)
  book_size text,
  binding text,
  interior_color text,
  paper_type text,
  cover_design text,
  layout_option text,
  estimated_price numeric,
  -- admin workflow
  status text NOT NULL DEFAULT 'new',        -- new | contacted | quoted | closed
  quoted_price numeric,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own quotes" ON quotes;
CREATE POLICY "Users insert own quotes"
  ON quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users read own quotes" ON quotes;
CREATE POLICY "Users read own quotes"
  ON quotes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read all quotes" ON quotes;
CREATE POLICY "Admins read all quotes"
  ON quotes FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Admins update quotes" ON quotes;
CREATE POLICY "Admins update quotes"
  ON quotes FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- keep updated_at fresh on admin edits
CREATE OR REPLACE FUNCTION touch_quote_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_touch_quote ON quotes;
CREATE TRIGGER trg_touch_quote BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION touch_quote_updated_at();
