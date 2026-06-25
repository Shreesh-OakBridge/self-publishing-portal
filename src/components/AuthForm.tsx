import { useState } from 'react';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activity';
import { withBase } from '../lib/basePath';

type Mode = 'login' | 'signup' | 'forgot';

interface AuthFormProps {
  // Called after a successful login (or signup that returns an active session).
  onAuthenticated: () => void;
  initialMode?: Mode;
  // Where to return after the Google OAuth round-trip (full-page redirect).
  oauthRedirectPath?: string;
}

export default function AuthForm({ onAuthenticated, initialMode = 'login', oauthRedirectPath = '/' }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [oauthBusy, setOauthBusy] = useState(false);

  // Google sign-in: full-page redirect to Google, then back to oauthRedirectPath.
  const signInWithGoogle = async () => {
    setError('');
    setOauthBusy(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${withBase(oauthRedirectPath)}` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setInfo('');

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      setBusy(true);
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}${withBase('/reset-password')}`,
        });
        if (resetError) throw resetError;
        setInfo('If an account exists for that email, a password reset link is on its way.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not send the reset email.');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === 'signup' && !firstName.trim()) {
      setError('First name is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setInfo('Account created. Please check your email to confirm, then log in.');
          setMode('login');
        } else {
          onAuthenticated();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        await logActivity('auth.login');
        onAuthenticated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 md:p-10 w-full">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
          </h1>
          <p className="text-sm text-gray-500">Cursive author portal</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-xl mb-4 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {info && (
        <div className="bg-green-50 border-2 border-green-300 text-green-800 p-3 rounded-xl mb-4 text-sm flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{info}</span>
        </div>
      )}

      {mode !== 'forgot' && (
        <>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={oauthBusy || busy}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 rounded-xl py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            {oauthBusy ? 'Redirecting…' : 'Continue with Google'}
          </button>
          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
        </>
      )}

      {mode === 'signup' && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
              placeholder="Jane"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
              placeholder="Author"
            />
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
          placeholder="you@example.com"
        />
      </div>

      {mode !== 'forgot' && (
        <div className="mb-2">
          <label className="block text-gray-700 font-semibold mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>
      )}

      {mode === 'login' && (
        <div className="text-right mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError('');
              setInfo('');
            }}
            className="text-sm text-amber-700 hover:underline"
          >
            Forgot password?
          </button>
        </div>
      )}

      {mode === 'forgot' && (
        <p className="text-sm text-gray-500 mb-5 -mt-1">
          Enter your account email and we’ll send you a link to reset your password.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy
          ? 'Please wait…'
          : mode === 'login'
          ? 'Log In'
          : mode === 'signup'
          ? 'Sign Up'
          : 'Send reset link'}
      </button>

      <p className="text-center text-sm text-gray-600 mt-6">
        {mode === 'forgot' ? (
          <>
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setInfo('');
              }}
              className="text-amber-700 font-semibold hover:underline"
            >
              Back to log in
            </button>
          </>
        ) : (
          <>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setInfo('');
              }}
              className="text-amber-700 font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </>
        )}
      </p>
    </form>
  );
}
