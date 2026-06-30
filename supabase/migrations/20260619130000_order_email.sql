/*
  # Buyer email on orders

  Stores the purchasing author's email on the order so the order-notification
  edge function can send a confirmation without an auth.users lookup.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS email text;
