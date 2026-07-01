/*
  # Editorial review on manuscripts

  Expert (human) editorial review is an add-on for Expert Publishing authors.
  Authors request it; admins move it through statuses and write feedback the
  author can read. The Automated review is computed client-side, so it needs no
  storage here.

  RLS: authors already have update on their own manuscripts (to set 'requested')
  and admins have update on all manuscripts (to set status + feedback).
*/

ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS expert_review_status text;
ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS expert_review_feedback text;
ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS expert_review_at timestamptz;
