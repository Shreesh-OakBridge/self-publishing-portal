import { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import { logActivity } from '../lib/activity';

// Non-logged-in admin layout: the login screen and the not-authorized screen,
// kept entirely separate from the authenticated dashboard shell. A successful
// sign-in is picked up by AdminDashboard's auth listener, which then swaps to
// the logged-in layout.
export default function AdminAuth({ mode }: { mode: 'login' | 'unauthorized' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError('Invalid email or password.');
    } else {
      // Stamp + log the admin login (no-op for non-admins).
      const { data: ok } = await supabase.rpc('is_admin');
      if (ok) {
        await supabase.rpc('touch_admin_login');
        await logActivity('admin.login', {}, supabase);
      }
    }
    setSigningIn(false);
  };

  const signOut = async () => {
    await logActivity('admin.logout', {}, supabase);
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4">
      {mode === 'unauthorized' ? (
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 w-full max-w-md text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not authorized</h1>
          <p className="text-gray-600 mb-6">
            This account doesn’t have admin access. Sign in with an admin account to manage leads and
            site content.
          </p>
          <button
            onClick={signOut}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <form onSubmit={handleSignIn} className="bg-white rounded-3xl shadow-xl p-8 md:p-10 w-full max-w-md">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
              <p className="text-sm text-gray-500">Cursive admin dashboard</p>
            </div>
          </div>

          {authError && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-xl mb-4 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <label className="block text-gray-700 font-semibold mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all mb-4"
            placeholder="admin@oakbridge.in"
          />

          <label className="block text-gray-700 font-semibold mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all mb-6"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={signingIn}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingIn ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      )}
    </div>
  );
}
