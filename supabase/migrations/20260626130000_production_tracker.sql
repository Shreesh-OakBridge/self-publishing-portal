/*
  # Production-stage tracker

  Adds orders.production_stage — where a book is in the publishing pipeline
  (separate from `status`, which is the commercial/order lifecycle). Stage keys
  match src/lib/productionStages.ts. New orders default to 'placed'; existing
  rows are backfilled to 'placed'.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_stage text DEFAULT 'placed';
UPDATE orders SET production_stage = 'placed' WHERE production_stage IS NULL;
