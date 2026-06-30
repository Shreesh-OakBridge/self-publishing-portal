# Cursive — QA Pass Report

_Self-publishing portal · An Imprint of OakBridge · generated June 2026_

## 1. Overall status

The codebase is in **good, launch-ready engineering shape**. TypeScript compiles clean across the whole project, the production build succeeds, and the critical flows (Get Started funnel, checkout, admin role-gating, exports, CMS) are correctly implemented. No critical code bugs were found in this pass.

This report covers a **code-level audit**. Items that can only be confirmed by a human in a browser (visual checks, real email delivery, payment) are in the **Manual QA checklist** (section 5).

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ Pass (0 errors) |
| Production build (`vite build`) | ✅ Pass |
| ESLint (`eslint .`) | ⚠️ Crashes — tooling version conflict (see 3.1) |
| Critical-flow code audit | ✅ No critical bugs |

## 2. What was audited

- Routing & base-path handling, navigation, footer links, per-route SEO
- Get Started funnel (incl. the new login-gate behaviour)
- Account, author dashboard, saved items, orders
- Checkout (GST, coupons, royalty, plan/royalty conflict, T&C, order insert)
- Admin: role gating (owner/admin/editor), CMS save, layout, exports, date filters
- Exports (CSV / XLSX / PDF) after the jspdf/jspdf-autotable major bump
- Email path (DB webhook → edge function)
- Analytics & monitoring (PostHog consent-gating, Sentry)

## 3. Findings

### 3.1 ESLint is broken — tooling version conflict — _Medium (dev only)_
`eslint .` crashes with `Cannot read properties of undefined (reading 'allowShortCircuit')`. ESLint was bumped to **9.39** by the earlier `npm audit fix --force`, but `typescript-eslint` is on a version that expects the older core-rule API. This does **not** affect the build or the deployed site — only local linting.

**Fix:** align the versions, e.g.
```
npm i -D eslint@^9.39.0 typescript-eslint@^8.40.0
```
Then `npm run lint` should run again. (TypeScript checking via `npm run typecheck` is unaffected and currently passing.)

### 3.2 Dead code: `ManuscriptEditor.tsx` + `RichTextEditor.tsx` — _Low_
Both files are **imported by nothing** — leftovers from the removed manuscript-editing feature. They're the only consumers of `@tiptap/*`, which is why TipTap no longer appears as a build chunk. Harmless, but worth removing for cleanliness.

`ManuscriptEditor.tsx` also navigates with raw `window.location.href = '/login'` / `'/account'` (not `withBase`), which would break under the `/cursive` base — moot once the file is deleted.

**Fix (do it in your repo so git tracks the deletion):**
```
git rm src/components/ManuscriptEditor.tsx src/components/RichTextEditor.tsx
```
After deleting, the `@tiptap/*` dependencies in `package.json` become unused and can optionally be removed to shrink installs:
```
npm uninstall @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-text-align @tiptap/extension-text-style @tiptap/extension-font-family
```
(Verify a build after, but nothing references them.)

### 3.3 `alert()` used for user feedback — _Low (polish)_
Several components use the browser `alert()` for success/error messages: `BookCustomizer`, `RoyaltyCalculator` (both public-facing), and admin panels (`OrdersPanel`, `ManuscriptsPanel`, `BooksPanel`, `AdminsPanel`, `ExportMenu`). Functional, but a native alert feels unpolished on the public pages especially. Consider replacing the two **public** ones with inline toasts/banners before launch; admin alerts are acceptable.

### 3.4 Non-admins can reach the admin shell (data is protected) — _Low_
If a logged-in non-admin navigates to `/admin`, the admin chrome renders (role falls back to `'admin'`), but all data is blocked by Supabase RLS (`is_admin()` = false), so they see empty panels and can't read/write anything. **Not a security hole** — data is safe — but you may want to redirect non-admins away from `/admin` for polish.

### 3.5 Verified NOT bugs (checked during audit)
- **Coupon usage count** — incremented by a DB trigger (`bump_coupon_usage` on `orders` insert), not client code. Correct.
- **Order emails** — sent via Supabase Database Webhook → `notify-order` edge function (not from the client). Correct design; see manual checklist to confirm it's wired in your Supabase project.
- **Exports after jspdf/autotable major bump** — code uses the modern `autoTable(doc, {...})` API; build bundles it cleanly.
- **Footer / nav links** — all routed through `withBase`; no dead links.

## 4. Pre-launch config to verify (not in code)

- [ ] **Order email webhook** — Supabase → Database → Webhooks: `orders` INSERT → `notify-order` function, with the `x-webhook-secret` header matching the function's env.
- [ ] **Lead email webhook** — same for `notify-lead` on the leads table.
- [ ] **Resend** — domain verified, `NOTIFY_FROM` / API key set on the edge functions (will change with the final domain).
- [ ] **Env vars in Vercel** (Production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY` (phc_…), `VITE_POSTHOG_HOST` (EU).
- [ ] **PostHog** — Session Replay enabled in project settings.
- [ ] **`setup_all.sql`** — has been run on the production Supabase project.
- [ ] **Owner account** — `info@oakbridge.in` seeded as owner in `admin_users`.

## 5. Manual QA checklist (click-through)

### Public site
- [ ] Homepage loads; Welcome intro plays once per session; CTA glow not clipped.
- [ ] Header links: Home, Services (+ flyout), Testimonials, Portfolio, Plans → all land correctly.
- [ ] **Plans** in header → dedicated `/plans` page.
- [ ] Portfolio tiles with a Link URL open in a new tab; tiles without stay non-clickable.
- [ ] Services icons render the admin-selected icons.
- [ ] Footer links (About, Services, FAQ, Terms, Privacy, Customize, Royalty calc) all work.
- [ ] Confidence bar auto-scrolls (logged-out only).
- [ ] Cookie banner appears; Accept → PostHog fires; Decline → no analytics.
- [ ] No `logo.svg` 404 in console _(after the `vercel.json` fix is deployed)_.

### Get Started funnel
- [ ] Select language + manuscript status + method; CTA enables only when all chosen.
- [ ] **Logged out** → CTA opens login/sign-up modal; after auth, lands on the chosen path (Expert → `/plans?plan=expert`, Self → `/customize`).
- [ ] **Logged in** → goes straight to the chosen path.
- [ ] Selection persists through login (language/status/path show at checkout).

### Account & dashboard
- [ ] Logged-in homepage shows the author dashboard (script status, publish date MM/YY, copies sold, royalty).
- [ ] "Hi, &lt;FirstName&gt;" shows in the account button.
- [ ] My Account: saved customizations & calculations list; edit pencils work; My Orders lists orders.

### Checkout
- [ ] Reaching `/checkout` while logged out redirects to login.
- [ ] Price breakup correct: subtotal, discount, taxable, **18% GST**, total.
- [ ] Valid coupon applies discount; invalid shows error; usage limit enforced on reuse.
- [ ] Plan **and** royalty selected together → conflict warning, order blocked.
- [ ] Required shipping validation (name, address, city, pincode).
- [ ] Placing order without ticking T&C opens the T&C modal; accepting places the order.
- [ ] Order appears in Admin → Orders **and** in the author's My Orders.
- [ ] Confirmation email received by customer + admin _(real delivery)_.

### Admin (test with each role: owner / admin / editor)
- [ ] Admin login is separate from website login (logging out of one doesn't affect the other).
- [ ] **Editor** sees only Leads, Layout, Site Content; **admin** sees all except Admins; **owner** sees all incl. Admins.
- [ ] Visiting a disallowed tab redirects to an allowed one.
- [ ] CMS: edit a section (e.g. Services icon, Portfolio link) → Save → reflected live on the site.
- [ ] Layout: reorder / show-hide homepage sections → reflected on homepage.
- [ ] Exports on every record tab: CSV, XLSX, PDF download and open correctly; date-range filter narrows results.
- [ ] Admins panel (owner): add/remove admin, change role; guards (can't remove self / last owner).

### Cross-cutting
- [ ] Mobile responsive: plans/grids 2-up, carousels swipe, no horizontal overflow.
- [ ] Sentry: trigger a test error → appears in Issues.
- [ ] PostHog: accept cookies → pageview in Live events.

## 6. Recommended order before launch

1. Fix ESLint (3.1) and delete dead code (3.2) — quick hygiene.
2. Verify all section-4 config (emails are the easiest thing to silently miss).
3. Run the section-5 checklist on a Vercel preview.
4. Then the external blockers: Razorpay, final domain (→ cutover + prerendering), real legal copy, final pricing data.
