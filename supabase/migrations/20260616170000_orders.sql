/*
  # Orders (checkout) — up to payment; gateway (Razorpay) added later.

  An order can reference a chosen plan and/or a saved book customization, with
  shipping + billing details. `amount` is captured at checkout (plan price +
  customization add-ons). `status` starts 'pending' (no payment yet).
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text,
  customization_id uuid REFERENCES book_customizations(id) ON DELETE SET NULL,
  amount numeric,
  status text NOT NULL DEFAULT 'pending',
  ship_name text,
  ship_phone text,
  ship_address text,
  ship_city text,
  ship_state text,
  ship_pincode text,
  ship_country text DEFAULT 'India',
  bill_name text,
  bill_address text,
  bill_gst text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authors insert own orders" ON orders;
CREATE POLICY "Authors insert own orders"
  ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authors read own orders" ON orders;
CREATE POLICY "Authors read own orders"
  ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authors update own orders" ON orders;
CREATE POLICY "Authors update own orders"
  ON orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read all orders" ON orders;
CREATE POLICY "Admins read all orders"
  ON orders FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Admins update orders" ON orders;
CREATE POLICY "Admins update orders"
  ON orders FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Activity logging: re-create generic logger with an orders branch, add trigger.
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
  ELSIF TG_TABLE_NAME = 'orders' THEN
    v_action := 'order.placed'; v_entity := NEW.plan;
    v_meta := jsonb_build_object('amount', NEW.amount, 'status', NEW.status);
  END IF;

  INSERT INTO activity_log (actor_id, actor_email, action, entity, metadata)
  VALUES (auth.uid(), auth.jwt() ->> 'email', v_action, v_entity, v_meta);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_orders ON orders;
CREATE TRIGGER trg_log_orders AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION log_table_activity();
