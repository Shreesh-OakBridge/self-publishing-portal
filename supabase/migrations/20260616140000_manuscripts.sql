/*
  # Manuscripts (author submissions)

  - Private `manuscripts` storage bucket (confidential IP). Files live under a
    folder named after the author's user id; authors access only their own,
    admins access all. Downloads use signed URLs.
  - `manuscripts` table tracks each submission + review status.
  - Activity-log trigger records submissions.
*/

-- ---- Table -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manuscripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  genre text,
  file_path text NOT NULL,
  file_name text,
  file_size bigint,
  status text NOT NULL DEFAULT 'submitted',
  notes text,
  created_at timestamptz DEFAULT now()
);

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

-- ---- Private storage bucket -----------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('manuscripts', 'manuscripts', false)
ON CONFLICT (id) DO NOTHING;

-- Files are stored as `<user_id>/<filename>`; the first path segment must match
-- the uploader. Admins can read everything (for signed-URL downloads).
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

-- ---- Activity log: record submissions -------------------------------------
-- Re-create the generic logger with a manuscripts branch, then add the trigger.
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
