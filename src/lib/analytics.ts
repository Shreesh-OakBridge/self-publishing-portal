// PostHog product analytics, loaded ONLY after the visitor accepts cookies.
//
// Swap in your real values either by:
//   • setting VITE_POSTHOG_KEY (and optionally VITE_POSTHOG_HOST) in your env
//     (recommended — no code change), or
//   • replacing the placeholders below.
//
// Default host is PostHog Cloud US; for EU use https://eu.i.posthog.com.
import type { PostHog } from 'posthog-js';

export const POSTHOG_KEY = (import.meta.env.VITE_POSTHOG_KEY as string) || 'phc_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
export const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com';

const CONSENT_KEY = 'cookie_consent'; // 'accepted' | 'declined'

export type Consent = 'accepted' | 'declined' | null;

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'accepted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: 'accepted' | 'declined') {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* ignore */
  }
}

// True once a real (non-placeholder) PostHog key is configured.
export const analyticsConfigured = !!POSTHOG_KEY && !POSTHOG_KEY.includes('X');

let ph: PostHog | null = null;
let loading = false;

// Lazily imports posthog-js (so it's not in the main bundle) and initialises it
// with privacy-safe defaults: form inputs are masked in session replays.
export async function loadAnalytics() {
  if (ph || loading || !analyticsConfigured) return;
  loading = true;
  try {
    const { default: posthog } = await import('posthog-js');
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      autocapture: true,
      persistence: 'localStorage+cookie',
      // Privacy: never record what people type (passwords, addresses, manuscripts).
      session_recording: { maskAllInputs: true },
      respect_dnt: true,
    });
    ph = posthog;
  } catch (err) {
    console.error('analytics load failed:', err);
  } finally {
    loading = false;
  }
}

// Called if the visitor declines — stops any capture if it had started.
export function disableAnalytics() {
  try {
    ph?.opt_out_capturing();
  } catch {
    /* ignore */
  }
}
