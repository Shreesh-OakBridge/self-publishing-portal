// Google Tag Manager — loaded as app code (no inline <script>, so it works with
// our strict CSP) and ONLY after the visitor accepts cookies. Does exactly what
// GTM's standard inline snippet does: seed window.dataLayer, push gtm.start, and
// inject gtm.js for the container.
const GTM_ID = (import.meta.env.VITE_GTM_ID as string) || 'GTM-PGGC6JC5';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

let loaded = false;

export function initGtm() {
  if (loaded || typeof window === 'undefined') return;
  if (!GTM_ID || !GTM_ID.startsWith('GTM-')) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);
}

// Push a business event to the dataLayer. Safe to call anytime — it queues in
// the array until GTM (loaded after consent) processes it; no GTM = no network.
export function pushToDataLayer(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}
