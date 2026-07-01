/*
  # In-portal manuscript editing

  - Add `content` (the editable manuscript text held in the portal).
  - Allow authors to UPDATE their own manuscript (to save edits). Admins already
    have an update policy; RLS combines them.
*/

ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS content text;

DROP POLICY IF EXISTS "Authors update own manuscripts" ON manuscripts;
CREATE POLICY "Authors update own manuscripts"
  ON manuscripts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
