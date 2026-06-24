// Sentry error monitoring + performance tracing.
//
// Stays completely inert until a real DSN is provided via VITE_SENTRY_DSN
// (set it in your env — Vercel project settings or a local .env). No DSN =
// nothing is sent, so dev and un-configured builds are unaffected.
//
// Privacy: sendDefaultPii is false (no cookies/headers/IP attached) and we do
// NOT enable Sentry session replay — PostHog already provides masked replay.
import * as Sentry from '@sentry/react';

const DSN = (import.meta.env.VITE_SENTRY_DSN as string | undefined) || '';

// Active only when a real (non-placeholder) DSN is configured.
export const sentryEnabled = DSN.startsWith('https://') && !DSN.includes('XXXX');

export function initSentry() {
  if (!sentryEnabled) return;
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    // Performance: sample 10% of transactions to keep volume (and cost) low.
    tracesSampleRate: 0.1,
    // Privacy-first defaults.
    sendDefaultPii: false,
  });
}

// Forward a caught error (e.g. from the React error boundary) to Sentry.
// No-op when Sentry isn't configured.
export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!sentryEnabled) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
