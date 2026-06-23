// Google Analytics 4, loaded ONLY after the visitor accepts cookies.
//
// Swap in your real Measurement ID either by:
//   • setting VITE_GA_ID in your env (recommended — no code change), or
//   • replacing the placeholder string below.
export const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_ID as string) || 'G-XXXXXXXXXX';

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

// True once a real (non-placeholder) GA id is configured.
export const analyticsConfigured = !!GA_MEASUREMENT_ID && !GA_MEASUREMENT_ID.includes('X');

let loaded = false;

// Injects gtag.js and initialises GA4. The init runs from our bundled code
// (CSP 'self'), so no inline script is needed.
export function loadAnalytics() {
  if (loaded || !analyticsConfigured) return;
  loaded = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);

  const w = window as unknown as { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: unknown[]) {
    w.dataLayer.push(args);
  }
  w.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
}
