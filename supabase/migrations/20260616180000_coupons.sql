/*
  # Promotions / coupons + order discount & royalty fields

  - `coupons` (admin-managed): amount-off or percent-off, optional email
    restriction, min order, max uses, expiry, active flag.
  - Customers never read the coupons table directly; they validate via the
    SECURITY DEFINER `validate_coupon()` RPC.
  - Orders gain royalty + coupon/discount fields.
  - A trigger bumps a coupon's used_count when an order uses it.
*/

CREATE TABLE IF NOT EXISTS coupons (
  code text PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('amount', 'percent')),
  value numeric NOT NULL,
  restrict_email text,
  min_order numeric DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Admin-only management; customers use the RPC below, not direct reads.
DROP POLICY IF EXISTS "Admins select coupons" ON coupons;
CREATE POLICY "Admins select coupons" ON coupons FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Admins insert coupons" ON coupons;
CREATE POLICY "Admins insert coupons" ON coupons FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins update coupons" ON coupons;
CREATE POLICY "Admins update coupons" ON coupons FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins delete coupons" ON coupons;
CREATE POLICY "Admins delete coupons" ON coupons FOR DELETE TO authenticated USING (is_admin());

-- Orders: royalty + coupon/discount fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS royalty_rate numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS royalty_calculation_id uuid REFERENCES royalty_calculations(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;

-- Validate + price a coupon for the current user (no direct table access needed).
CREATE OR REPLACE FUNCTION validate_coupon(p_code text, p_amount numeric)
  RETURNS TABLE (valid boolean, discount numeric, message text)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  c coupons;
  v_email text := auth.jwt() ->> 'email';
  v_discount numeric := 0;
BEGIN
  SELECT * INTO c FROM coupons WHERE lower(code) = lower(p_code);
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::numeric, 'Invalid coupon code.'; RETURN;
  END IF;
  IF NOT c.active THEN
    RETURN QUERY SELECT false, 0::numeric, 'This coupon is no longer active.'; RETURN;
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN QUERY SELECT false, 0::numeric, 'This coupon has expired.'; RETURN;
  END IF;
  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN
    RETURN QUERY SELECT false, 0::numeric, 'This coupon has reached its usage limit.'; RETURN;
  END IF;
  IF c.restrict_email IS NOT NULL AND lower(c.restrict_email) <> lower(COALESCE(v_email, '')) THEN
    RETURN QUERY SELECT false, 0::numeric, 'This coupon is not valid for your account.'; RETURN;
  END IF;
  IF COALESCE(c.min_order, 0) > 0 AND p_amount < c.min_order THEN
    RETURN QUERY SELECT false, 0::numeric,
      'Minimum order of ₹' || c.min_order::text || ' required for this coupon.'; RETURN;
  END IF;

  IF c.type = 'amount' THEN
    v_discount := least(c.value, p_amount);
  ELSE
    v_discount := round(p_amount * c.value / 100.0, 2);
  END IF;

  RETURN QUERY SELECT true, v_discount, 'Coupon applied.';
END;
$$;

GRANT EXECUTE ON FUNCTION validate_coupon(text, numeric) TO authenticated, anon;

-- Increment usage when an order is placed with a coupon.
CREATE OR REPLACE FUNCTION bump_coupon_usage()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.coupon_code IS NOT NULL THEN
    UPDATE coupons SET used_count = used_count + 1 WHERE lower(code) = lower(NEW.coupon_code);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_coupon ON orders;
CREATE TRIGGER trg_bump_coupon AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION bump_coupon_usage();
