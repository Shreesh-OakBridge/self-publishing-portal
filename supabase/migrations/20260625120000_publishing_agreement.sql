-- Record Publishing Agreement acceptance on each order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS publishing_agreement_accepted_at timestamptz;
