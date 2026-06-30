/*
  # Invoice email idempotency

  Tracks when the paid confirmation/invoice email was sent, so it goes out only
  once even if both the client verify call and the Razorpay webhook fire.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_emailed_at timestamptz;
