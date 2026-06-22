/*
  # Onboarding selections on orders

  Captures the Get Started funnel choices (publish path, book language, and
  manuscript status) against each order for reporting.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS publish_path text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS language text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS manuscript_status text;
