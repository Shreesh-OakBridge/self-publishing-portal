/*
  # Activity log (audit trail)

  - `activity_log` records who did what, when. Admins read it; clients may only
    insert rows attributed to themselves (used for login/logout logging).
  - Data-change events (leads, saved work, CMS edits, signups, profile edits)
    are logged by SECURITY DEFINER triggers — tamper-proof, server-side.
  - Logins/logouts are logged from the app (no table change to trigger on).
*/

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

-- Clients may only log their own actions (login/logout).
DROP POLICY IF EXISTS "Users log own activity" ON activity_log;
CREATE POLICY "Users log own activity"
  ON activity_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- ---- Generic trigger for data tables -------------------------------------
CREATE OR REPLACE FUNCTION log_table_activity()
  RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_action text;
  v_entity text;
  v_meta jsonb := '{}'::jsonb;
BEGIN
  IF TG_TABLE_NAME = 'publishing_leads' THEN
    v_action := 'lead.created';
    v_entity := NEW.full_name;
    v_meta := jsonb_build_object('email', NEW.email, 'plan', NEW.preferred_plan);
  ELSIF TG_TABLE_NAME = 'book_customizations' THEN
    v_action := 'customization.saved';
    v_entity := NEW.book_size;
    v_meta := jsonb_build_object('price', NEW.estimated_price, 'binding', NEW.binding);
  ELSIF TG_TABLE_NAME = 'royalty_calculations' THEN
    v_action := 'calculation.saved';
    v_entity := NEW.plan_type;
    v_meta := jsonb_build_object('book_price', NEW.book_price, 'monthly_earnings', NEW.monthly_earnings);
  ELSIF TG_TABLE_NAME = 'site_content' THEN
    v_action := 'content.' || lower(TG_OP);
    v_entity := NEW.key;
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

-- ---- auth.users trigger: signup + profile update --------------------------
CREATE OR REPLACE FUNCTION log_auth_activity()
  RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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
