import { captureEvent } from './analytics';
import { pushToDataLayer } from './gtm';

// Single funnel-event tracker. Sends each event to BOTH:
//   • PostHog  — product analytics now (cohorts, funnels, behaviour)
//   • the GTM dataLayer — ready for ad tags (GA4 / Meta / etc.) later
// Both are no-ops until the visitor accepts cookies.
export function track(event: string, props: Record<string, unknown> = {}) {
  captureEvent(event, props);
  pushToDataLayer(event, props);
}
