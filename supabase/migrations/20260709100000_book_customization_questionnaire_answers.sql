/*
  # Book customization questionnaire answers

  The Book Customizer's rotating questionnaire now captures real answers
  (not just a decorative prompt). Persist them alongside the rest of the
  saved customization so admins and the customer's own account can see them,
  and so choice/number answers can factor into the estimated price.
*/

ALTER TABLE book_customizations
  ADD COLUMN IF NOT EXISTS questionnaire_answers jsonb DEFAULT '{}'::jsonb;
