import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { logActivity } from './activity';
import { identifyUser, resetUser } from './analytics';
import { recordReferralIfAny } from './referral';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Tie PostHog activity to the account (covers email + Google logins).
      if (event === 'SIGNED_IN' && s?.user) {
        identifyUser(s.user.id, { email: s.user.email });
        // Record a referral on the first authenticated session (email-confirm /
        // Google signups). Harmless on repeat — UNIQUE on referred_user_id.
        void recordReferralIfAny(s.user);
      } else if (event === 'SIGNED_OUT') {
        resetUser();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Track admin status for the current session (used to keep admins from
  // appearing as authors in the public UI).
  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    supabase.rpc('is_admin').then(({ data }) => {
      if (active) setIsAdmin(data === true);
    });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const signOut = async () => {
    try {
      await logActivity('auth.logout');
    } catch {
      /* never block sign-out on logging */
    }
    // 'local' scope clears the session in this browser without a server
    // round-trip, so it works even if the access token is already expired.
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) console.error('signOut error:', error.message);
    // Belt-and-suspenders: hard-remove the website auth token from storage in
    // case the SDK left it behind. (The admin panel uses key 'cursive-admin-auth'
    // and is intentionally not touched here.)
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    // Clear local state immediately in case the auth event is delayed.
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, isAdmin, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
