# OakBridge Publishing — Full Website Audit

Scope: UI, UX, functionality, frontend & backend logic, backend wiring, SEO, GEO.
Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low / nice-to-have.

---

## Executive summary

The app is functionally solid and well-architected for a Vite + Supabase build:
working lead capture, a full CMS, author accounts with saved work, media uploads,
admin security via RLS, and a crash guard. The **single biggest weakness is that
it is a 100% client-rendered SPA** — the served HTML is an empty `<div id="root">`
shell, and all content (including CMS text) is painted by JavaScript after load.
Search engines and AI answer engines that don't run JS see **nothing**, which
undercuts both SEO and GEO. Fixing rendering is the highest-leverage change.

---

## 1. UI

**Strengths:** consistent amber/orange brand system, modern card/gradient design,
responsive Tailwind grids, clear visual hierarchy within sections, good use of
icons, real-time price feedback in the customizer, polished pricing cards.

| # | Sev | Finding | Recommendation |
|---|-----|---------|----------------|
| 1.1 | 🟠 | The nav logo is wrapped in `<h1>OakBridge</h1>`. This creates **two `<h1>`s on the homepage** (logo + hero) and makes the logo the only `<h1>` on subpages. | Change the nav logo `<h1>` to a `<span>`/`<div>`. Keep exactly one `<h1>` per page. |
| 1.2 | 🟡 | Pricing card is fully clickable to select **and** contains a separate "Get Started" button — two competing click targets can confuse. | Add a clearer affordance (e.g. a "View details" caret) or make only the header/"View full plan" area toggle selection. |
| 1.3 | 🟡 | Saving in the customizer/calculator uses native `alert()` popups. | Replace with inline toasts/banners for a more polished feel. |
| 1.4 | 🟢 | Favicon is SVG-only; some contexts prefer a PNG/ICO fallback. | Add `favicon-32.png` + `apple-touch-icon.png`. |
| 1.5 | 🟢 | CMS-driven content briefly shows defaults, then swaps when Supabase responds (minor content shift). | Acceptable; could add a tiny skeleton or keep defaults (they already match). |

## 2. UX

**Strengths:** smooth-scroll nav with scroll-spy + active states, login popups
that gate saves and resume the action, accordion pricing with auto-scroll,
success/error feedback on the contact form, graceful media fallbacks.

| # | Sev | Finding | Recommendation |
|---|-----|---------|----------------|
| 2.1 | 🟠 | Footer **FAQ** link points to a section that doesn't exist (no-op). | Build an FAQ section (CMS-editable, with FAQ schema — also helps SEO/GEO) or remove the link. |
| 2.2 | 🟠 | No **"Forgot password"** flow for author accounts. | Add Supabase `resetPasswordForEmail` flow. |
| 2.3 | 🟡 | Contact-form error/validation banner renders at the **top** of the form; when the user is scrolled to the Submit button it can be off-screen. | Show the error next to the Submit button (or scroll to it on error). |
| 2.4 | 🟡 | Account page is read-only — no edit profile, no delete/rename saved items. | Add basic management when convenient. |
| 2.5 | 🟢 | No breadcrumbs on `/customize` and `/royalty-calculator`. | Optional; add for orientation + breadcrumb schema. |

## 3. Functionality

**Strengths:** lead capture → admin dashboard, full CMS, image/video uploads,
author accounts + saved customizations/calculations, plan selection, customizer,
calculator, admin-only gating, error boundary.

| # | Sev | Finding | Recommendation |
|---|-----|---------|----------------|
| 3.1 | 🟠 | Public tables allow anonymous INSERT with **no rate-limiting/captcha** (contact form has only a honeypot + email check). | Add Cloudflare Turnstile or move inserts behind a rate-limited Edge Function before/after launch. |
| 3.2 | 🟡 | Royalty calculator uses a **flat-% model**, not a real cost-based model (pinned for rebuild). | Resume the cost-based rebuild when you have print-cost figures. |
| 3.3 | 🟡 | Lead **email notifications** require manually deploying `notify-lead` + a DB webhook. | Deploy it (steps in DEPLOYMENT.md) so leads reach an inbox. |
| 3.4 | 🟢 | Unknown routes (e.g. `/xyz`) fall through to the homepage — no 404. | Add a simple 404 view. |

## 4. Frontend logic

**Strengths:** dependency-free path routing; `ContentProvider` deep-merges CMS
overrides over typed defaults (site renders even if Supabase is down);
`AuthProvider`; honeypot + email validation; saves re-read the fresh session to
avoid stale-closure user IDs; ErrorBoundary.

| # | Sev | Finding | Recommendation |
|---|-----|---------|----------------|
| 4.1 | 🟡 | Navigation uses `window.location.href` (full page reload) for `/customize`, `/account`, etc. Each navigation re-boots the app and re-fetches content/auth. | Fine for now; a client router (or framework) would make transitions instant and enable per-route meta. |
| 4.2 | 🟡 | Multiple `<h1>` / heading-order issue (see 1.1). | Same fix. |
| 4.3 | 🟢 | Content is re-fetched on every full-reload navigation (no cross-page cache). | A router or SWR-style cache would reduce calls. |

## 5. Backend logic (RLS / policies)

**Strengths:** well-designed RLS. Leads readable only by admins; CMS writes
admin-only; `is_admin()` is `SECURITY DEFINER`; saved rows are user-scoped
(insert only your own id, select only your own); storage writes admin-gated.

| # | Sev | Finding | Recommendation |
|---|-----|---------|----------------|
| 5.1 | 🟠 | Anonymous INSERT is open by design (needed for the form/tools) → spam vector. | Same as 3.1 (captcha / rate limit). |
| 5.2 | 🟡 | No server-side validation of lead/customization payloads (any shape that satisfies columns is accepted). | Add CHECK constraints or validate in an Edge Function if abuse appears. |
| 5.3 | 🟢 | `is_admin()` keys off the JWT email claim — correct, but tie admin status to `user_id` long-term if emails ever change. | Optional hardening. |

## 6. Backend wiring

**Strengths:** Supabase client with a fail-loud env guard; one consolidated,
idempotent `setup_all.sql` (tables, RLS, `admin_users`, `is_admin()`, storage
bucket, seed); storage bucket live; `notify-lead` Edge Function written.

| # | Sev | Finding | Recommendation |
|---|-----|---------|----------------|
| 6.1 | 🟡 | Using the **legacy anon JWT key** (required by the installed supabase-js). Fine, but it's a deprecation path. | When you upgrade `@supabase/supabase-js`, switch to the publishable key. |
| 6.2 | 🟡 | Auth session persists in `localStorage` shared across admin/author on the same browser (mitigated by `is_admin()` gating). | Already handled; just be aware. |
| 6.3 | 🟢 | `notify-lead` not deployed by default. | Deploy + add webhook (DEPLOYMENT.md §8). |

## 7. SEO

**Strengths:** strong homepage `<title>`, meta description, canonical, full
OpenGraph + Twitter cards, `robots.txt`, `sitemap.xml` (3 URLs), semantic
sections, real favicon.

| # | Sev | Finding | Recommendation |
|---|-----|---------|----------------|
| 7.1 | 🔴 | **Client-side rendering.** Served HTML is an empty shell; all content (and CMS text fetched from Supabase) is JS-painted. Non-JS crawlers index almost nothing. | **Prerender/SSG the static routes** (e.g. `vite-react-ssg` or a prerender plugin) or migrate to **Next.js**. Highest-impact SEO fix. |
| 7.2 | 🟠 | **No per-route titles/meta.** `/customize`, `/royalty-calculator`, `/login`, `/account` all share the homepage `<title>`/description. | Add `react-helmet-async` (and ideally render meta at build/SSR time so crawlers see it). |
| 7.3 | 🟠 | **No structured data (JSON-LD).** | Add `Organization`, `Service`/`Product` (plans), `FAQPage`, `BreadcrumbList`. Big win for rich results. |
| 7.4 | 🟠 | Heading hierarchy (logo `<h1>`, subpage top heading is `<h2>` with no real `<h1>`). | One descriptive `<h1>` per page (see 1.1). |
| 7.5 | 🟡 | Hero image `alt=""` (treated decorative); OG image is global only. | Give meaningful images real `alt`; consider per-page OG images. |
| 7.6 | 🟡 | No `og:locale`, no `hreflang`. | Add `og:locale=en_IN` and `hreflang="en-in"`. |

## 8. GEO

Two senses — both relevant here.

### 8a. Generative Engine Optimization (being cited by ChatGPT, Perplexity, Google AI Overviews)
| # | Sev | Finding | Recommendation |
|---|-----|---------|----------------|
| 8.1 | 🔴 | Same root cause as 7.1: most **AI/LLM crawlers don't execute JS**, so they see an empty page and can't cite you. | Prerender/SSG — this is the single most important GEO fix. |
| 8.2 | 🟠 | No structured data for entities/services/pricing/FAQ → AI engines can't extract facts cleanly. | Add JSON-LD (esp. `FAQPage` and `Service` with prices). |
| 8.3 | 🟡 | No `llms.txt` (emerging convention to guide AI crawlers). | Add `/public/llms.txt` summarizing what OakBridge offers + key links. |
| 8.4 | 🟢 | Once rendered server-side, your CMS prose is clear, factual and well-structured — which is GEO-friendly. | Keep content concise and fact-dense; add an FAQ. |

### 8b. Geographic / local SEO (India targeting)
| # | Sev | Finding | Recommendation |
|---|-----|---------|----------------|
| 8.5 | 🟡 | Good local signals (₹ pricing, "India", +91 phone) but **no `LocalBusiness`/`Organization` schema** with address + `areaServed`. | Add Organization/LocalBusiness JSON-LD with contact + India service area. |
| 8.6 | 🟡 | No `hreflang` / `og:locale` (competitors target multiple Indian languages). | Add `en-in`; consider language expansion later. |
| 8.7 | 🟢 | Off-site: a Google Business Profile strengthens local presence. | Create one (outside this codebase). |

---

## Prioritized roadmap

**Before / at launch**
1. 🔴 Add prerendering/SSG (or move to Next.js) — fixes SEO **and** GEO at once (7.1 / 8.1).
2. 🟠 Per-route titles + meta (7.2) and JSON-LD: Organization, Service, FAQ (7.3 / 8.2 / 8.5).
3. 🟠 Fix heading hierarchy — one `<h1>` per page (1.1 / 7.4).
4. 🟠 Spam protection on public inserts (3.1 / 5.1).
5. 🟠 Build the FAQ section (fixes 2.1, feeds 8.2) and add "Forgot password" (2.2).

**Shortly after**
6. 🟡 Deploy lead-email notifications (3.3 / 6.3).
7. 🟡 Replace `alert()` with toasts (1.3); move form errors near the button (2.3).
8. 🟡 `llms.txt`, `og:locale`/`hreflang`, per-page OG (8.3 / 7.6).

**Future versions**
9. Cost-based royalty calculator (3.2).
10. Audit/activity logging + error monitoring (Sentry).
11. Client-side router for instant transitions; account self-management; 404 page.
