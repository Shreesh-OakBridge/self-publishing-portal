import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// Records a referral row the first time a referred user is authenticated.
// The referrer id is carried in user_metadata.referred_by (set at signup).
// A UNIQUE constraint on referred_user_id makes repeat calls harmless.
export async function recordReferralIfAny(user: User | null | undefined) {
  if (!user) return;
  const ref = user.user_metadata?.referred_by as string | undefined;
  if (!ref || ref === user.id) return;
  const { error } = await supabase.from('referrals').insert({
    referrer_id: ref,
    referred_user_id: user.id,
    referred_email: user.email ?? null,
  });
  if (error && !/duplicate|unique/i.test(error.message)) {
    console.error('referral record failed:', error.message);
  }
}
