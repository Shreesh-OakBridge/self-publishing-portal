/*
  # Razorpay payment fields

  Tracks the Razorpay order/payment ids and a payment_status on each order.
  payment_status: 'unpaid' (default) -> 'paid' (after verified payment) / 'failed'.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
UPDATE orders SET payment_status = 'unpaid' WHERE payment_status IS NULL;
