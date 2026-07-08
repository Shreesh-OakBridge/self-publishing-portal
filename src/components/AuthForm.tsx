import { useState } from 'react';
import { BookOpen, AlertCircle, CheckCircle, ArrowLeft, MessageSquareText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activity';
import { track } from '../lib/track';
import { withBase } from '../lib/basePath';
import { recordReferralIfAny } from '../lib/referral';

type Mode = 'login' | 'signup' | 'forgot';
// Which channel verifies a new signup. Phone (SMS OTP) is the default/primary
// path; email is offered as a fallback for anyone who can't receive the text.
type VerifyChannel = 'phone' | 'email';
// Signup has two steps when verifying by phone: fill the form, then enter the
// code that was texted. Email verification stays single-step (a link, same
// as before).
type SignupStage = 'form' | 'otp';

interface AuthFormProps {
  // Called after a successful login (or signup that returns an active session).
  onAuthenticated: () => void;
  initialMode?: Mode;
  // Where to return after the Google OAuth round-trip (full-page redirect).
  oauthRedirectPath?: string;
}

// Supabase phone auth needs E.164 (e.g. +919876543210). Default to India (+91)
// when no country code is given, since that's this business's primary market.
const normalizePhone = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  return `+91${trimmed.replace(/\D/g, '').replace(/^0+/, '')}`;
};
const isValidPhone = (p: string) => /^\+\d{8,15}$/.test(p);

export default function AuthForm({ onAuthenticated, initialMode = 'login', oauthRedirectPath = '/' }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verifyChannel, setVerifyChannel] = useState<VerifyChannel>('phone');
  const [signupStage, setSignupStage] = useState<SignupStage>('form');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [oauthBusy, setOauthBusy] = useState(false);

  // Full reset back to a fresh signup form (used by "change number" and mode switches).
  const resetSignupFlow = () => {
    setSignupStage('form');
    setOtp('');
  };

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

  // Step 2 of phone signup: the author enters the 6-digit code we texted them.
  const verifyPhoneOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the code we texted you.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const normalized = normalizePhone(phone);
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        phone: normalized,
        token: otp.trim(),
        type: 'sms',
      });
      if (otpError) throw otpError;

      // Best-effort: also register the email as a verified identity on the
      // account (triggers Supabase's own confirmation email for it). This is
      // non-blocking — the phone account already works either way, and the
      // email address is stored in user_metadata regardless as a fallback
      // for admin views and order/notification emails.
      if (email.trim()) {
        try {
          await supabase.auth.updateUser({ email: email.trim() });
        } catch (err) {
          console.error('Could not attach email to phone account:', err);
        }
      }

      await recordReferralIfAny(data.user);
      track('sign_up', { method: 'phone' });
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code is invalid or expired. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resendPhoneOtp = async () => {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const normalized = normalizePhone(phone);
      const { error: resendError } = await supabase.auth.signInWithOtp({ phone: normalized });
      if (resendError) throw resendError;
      setInfo(`Sent a new code to ${normalized}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code. Please try again shortly.');
    } finally {
      setBusy(false);
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

    if (mode === 'signup' && signupStage === 'otp') {
      await verifyPhoneOtp();
      return;
    }

    if (mode === 'signup' && !firstName.trim()) {
      setError('First name is required.');
      return;
    }

    // Phone is mandatory for every signup, regardless of which channel is
    // actually used to verify the account.
    if (mode === 'signup') {
      if (!phone.trim()) {
        setError('Phone number is required.');
        return;
      }
      if (!isValidPhone(normalizePhone(phone))) {
        setError('Please enter a valid phone number.');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        let referredBy: string | undefined;
        try {
          referredBy = localStorage.getItem('cursive_ref') || undefined;
        } catch {
          referredBy = undefined;
        }

        if (verifyChannel === 'phone') {
          // Primary path: sign up with phone as the identifier — Supabase
          // texts a 6-digit OTP. Email is stashed in metadata now and
          // best-effort promoted to a verified identity once the OTP is
          // confirmed (see verifyPhoneOtp above).
          const normalized = normalizePhone(phone);
          const { error: signUpError } = await supabase.auth.signUp({
            phone: normalized,
            password,
            options: {
              data: {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                full_name: fullName,
                email: email.trim() || undefined,
                ...(referredBy ? { referred_by: referredBy } : {}),
              },
            },
          });
          if (signUpError) throw signUpError;
          setInfo(`We texted a 6-digit code to ${normalized}. Enter it below to finish creating your account.`);
          setSignupStage('otp');
        } else {
          // Fallback path: today's email-confirmation-link flow. Phone is
          // still captured and stored in metadata even though it isn't the
          // channel being verified.
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                full_name: fullName,
                phone: normalizePhone(phone),
                ...(referredBy ? { referred_by: referredBy } : {}),
              },
            },
          });
          if (signUpError) throw signUpError;
          try {
            localStorage.removeItem('cursive_ref');
          } catch {
            /* ignore */
          }

          if (!data.session) {
            setInfo('Account created. Please check your email to confirm, then log in.');
            setMode('login');
          } else {
            await recordReferralIfAny(data.user);
            track('sign_up', { method: 'email' });
            onAuthenticated();
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        await logActivity('auth.login');
        track('login', { method: 'email' });
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

      {mode !== 'forgot' && !(mode === 'signup' && signupStage === 'otp') && (
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

      {mode === 'signup' && signupStage === 'otp' ? (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => {
              resetSignupFlow();
              setError('');
              setInfo('');
            }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Change number
          </button>

          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <MessageSquareText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              We texted a 6-digit code to <strong>{normalizePhone(phone)}</strong>. Enter it below.
            </p>
          </div>

          <label className="block text-gray-700 font-semibold mb-2">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all tracking-[0.5em] text-center text-lg font-semibold"
            placeholder="······"
          />
          <div className="text-right mt-2 mb-3">
            <button
              type="button"
              onClick={resendPhoneOtp}
              disabled={busy}
              className="text-sm text-amber-700 hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </div>
      ) : (
        <>
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

          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                placeholder="+91 98765 43210"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                {verifyChannel === 'phone' ? (
                  <>
                    We’ll text a verification code to this number.{' '}
                    <button
                      type="button"
                      onClick={() => setVerifyChannel('email')}
                      className="text-amber-700 font-semibold hover:underline"
                    >
                      Verify by email instead
                    </button>
                  </>
                ) : (
                  <>
                    We’ll verify your account by email instead.{' '}
                    <button
                      type="button"
                      onClick={() => setVerifyChannel('phone')}
                      className="text-amber-700 font-semibold hover:underline"
                    >
                      Verify by phone instead
                    </button>
                  </>
                )}
              </p>
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
        </>
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
          ? signupStage === 'otp'
            ? 'Verify & Create Account'
            : verifyChannel === 'phone'
            ? 'Send Verification Code'
            : 'Sign Up'
          : 'Send reset link'}
      </button>

      {!(mode === 'signup' && signupStage === 'otp') && (
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
                  resetSignupFlow();
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
      )}
    </form>
  );
}
