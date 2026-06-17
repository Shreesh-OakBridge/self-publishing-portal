import { supabase } from './supabase';

// Logs a user-initiated event (login/logout) to activity_log. Server-side
// events (signups, leads, saves, CMS edits) are logged by DB triggers instead.
// Non-blocking: never throws into the UI.
export async function logActivity(action: string, metadata: Record<string, unknown> = {}) {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return;
    await supabase.from('activity_log').insert({
      actor_id: user.id,
      actor_email: user.email,
      action,
      metadata,
    });
  } catch (err) {
    console.error('activity log failed:', err);
  }
}
