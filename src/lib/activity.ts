import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Logs a user-initiated event (login/logout) to activity_log. Server-side
// events (signups, leads, saves, CMS edits) are logged by DB triggers instead.
// Pass a specific client (e.g. the admin client) so the event is attributed to
// the right session. Non-blocking: never throws into the UI.
export async function logActivity(
  action: string,
  metadata: Record<string, unknown> = {},
  client: SupabaseClient = supabase
) {
  try {
    const { data } = await client.auth.getSession();
    const user = data.session?.user;
    if (!user) return;
    await client.from('activity_log').insert({
      actor_id: user.id,
      actor_email: user.email,
      action,
      metadata,
    });
  } catch (err) {
    console.error('activity log failed:', err);
  }
}
