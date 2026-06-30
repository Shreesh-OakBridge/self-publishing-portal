/*
  # Expert editorial review add-on price

  The quoted add-on charge for a manuscript's expert review. Defaults to the
  CMS price when the author requests it; admins can adjust per manuscript.
*/

ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS expert_review_price numeric;
