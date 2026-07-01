import { createClient } from '@supabase/supabase-js';

// A SEPARATE Supabase client for the admin panel. It uses its own auth storage
// key, so the admin session is completely independent of the public site's
// session — signing out of the website no longer signs out of /admin (and vice
// versa). Same project + anon key; RLS still enforces admin access by JWT.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Create a .env file with ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'cursive-admin-auth',
    persistSession: true,
    autoRefreshToken: true,
  },
});
