import { useState } from 'react';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activity';

type Mode = 'login' | 'signup' | 'forgot';

interface AuthFormProps {
  // Called after a successful login (or signup that returns an active session).
  onAuthenticated: () => void;
  initialMode?: Mode;
}

export default function AuthForm({ onAuthenticated, initialMode = 'login' }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

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
          redirectTo: `${window.location.origin}/reset-password`,
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
          <p className="text-sm text-gray-500">OakBridge author portal</p>
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
