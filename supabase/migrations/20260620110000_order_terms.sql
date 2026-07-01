/*
  # Terms acceptance on orders

  Records when the buyer accepted the Terms & Conditions / Privacy Policy at
  checkout, for compliance/record-keeping.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
