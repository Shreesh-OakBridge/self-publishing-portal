/*
  # Invoice fields for order confirmation PDF

  Adds:
    - orders.author_name   : the book's author / pen name (shown on the invoice line)
    - orders.invoice_number: gapless sequential tax-invoice number, e.g. C/2026-27/0001

  Reuses existing columns:
    - orders.bill_gst  -> buyer GSTIN (optional, B2B)
    - orders.bill_name -> registered business name (optional, used as Bill-to when a GSTIN is given)

  Invoice number is assigned by a BEFORE INSERT trigger from a global sequence,
  labelled with the Indian financial year (Apr–Mar) computed in IST. The sequence
  is continuous (does not reset each FY) so numbers stay unique and gapless.
  NOTE: numbers are assigned at order creation (we email the invoice immediately).
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_invoice_number_key
  ON orders (invoice_number) WHERE invoice_number IS NOT NULL;

CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

CREATE OR REPLACE FUNCTION set_order_invoice_number()
  RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  d date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  y int := extract(year from d)::int;
  m int := extract(month from d)::int;
  fy_start int;
  fy_end int;
  n bigint;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    IF m >= 4 THEN
      fy_start := y; fy_end := y + 1;
    ELSE
      fy_start := y - 1; fy_end := y;
    END IF;
    n := nextval('invoice_seq');
    NEW.invoice_number := 'C/' || fy_start || '-' || lpad((fy_end % 100)::text, 2, '0')
      || '/' || lpad(n::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_invoice_number ON orders;
CREATE TRIGGER trg_order_invoice_number BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_invoice_number();
