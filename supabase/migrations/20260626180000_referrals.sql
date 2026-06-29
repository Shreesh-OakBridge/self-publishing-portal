/*
  # Referrals (Author Hub)

  One row per referred author. The new (referred) user records the row on signup,
  linking the referrer. Referrers can see their own referrals; admins see all.
*/

CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded', 'invalid')),
  reward_note text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals (referrer_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Referrer reads own referrals" ON referrals;
CREATE POLICY "Referrer reads own referrals" ON referrals FOR SELECT TO authenticated
  USING (is_admin() OR referrer_id = auth.uid() OR referred_user_id = auth.uid());

DROP POLICY IF EXISTS "Referred user records referral" ON referrals;
CREATE POLICY "Referred user records referral" ON referrals FOR INSERT TO authenticated
  WITH CHECK (referred_user_id = auth.uid() AND referrer_id <> auth.uid());

DROP POLICY IF EXISTS "Admins manage referrals" ON referrals;
CREATE POLICY "Admins manage referrals" ON referrals FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
