# Deployment Guide — OakBridge Publishing

Stack: **React + Vite** frontend (host on **Vercel**) and **Supabase** backend
(Postgres, Auth, Storage, Edge Functions). Both have free tiers — launch cost ₹0.

---

## 1. Supabase project (backend)

1. Create a project at https://supabase.com (region: Mumbai / South Asia).
2. From **Project Settings → API**, copy:
   - **Project URL** (e.g. `https://xxxx.supabase.co` — **no path**, no `/rest/v1`)
   - **anon key** — use the **legacy `anon` `public`** key (a long `eyJ…` JWT).
     The newer `sb_publishable_…` key may not authenticate with the installed
     supabase-js version, so prefer the legacy `anon` key.

## 2. Create all tables, policies & storage (one script)

Open **SQL Editor → New query**, paste the **entire** `supabase/setup_all.sql`,
and **Run**. It creates every table, row-level-security policy, the
`admin_users` table + `is_admin()` function, and the `site-media` storage
bucket. It is safe to re-run.

> Before running, edit the last line if your admin email isn't `info@oakbridge.in`.

## 3. Create your admin user

**Authentication → Users → Add user → Create new user.**
- Email: the same email seeded into `admin_users` (step 2)
- Password: a strong password (this is your CMS/admin login)
- Enable **Auto Confirm User**

Only emails listed in `admin_users` can access `/admin`, view leads, or edit
site content — so author accounts can never reach the admin area.

## 4. Author signups (decide email confirmation)

Authors can self-register from the site. In **Authentication → Sign In /
Providers → Email**:
- **Confirm email ON** (recommended for production) — new authors must verify
  via email before logging in.
- Confirm email OFF — instant login (handy only for testing).

## 5. Frontend env vars

Local: copy `.env.example` → `.env` and fill in:

```
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...legacy-anon-key...
```

Verify locally:

```bash
npm install
npm run build      # must succeed
npm run dev        # smoke-test
```

## 6. Deploy to Vercel

1. Push this repo to GitHub/GitLab.
2. At https://vercel.com → **Import Project** (Vite is auto-detected via
   `vercel.json`, which also handles SPA routing for `/admin`, `/login`,
   `/account`, `/customize`, `/royalty-calculator`).
3. Add **Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Deploy.

## 7. Domain

Vercel **Settings → Domains** → add `oakbridge.in` and follow the DNS steps.
SSL is automatic. Then in Supabase **Authentication → URL Configuration**, set
the **Site URL** to `https://oakbridge.in` so auth emails link correctly.

## 8. (Recommended) Lead email notifications

Edge Function in `supabase/functions/notify-lead/` emails you on each new lead
(via Resend, free tier):

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-ref>
supabase secrets set RESEND_API_KEY=<key> NOTIFY_TO=info@oakbridge.in NOTIFY_FROM=leads@oakbridge.in
supabase functions deploy notify-lead
```

Then **Database → Webhooks**: on `INSERT` of `publishing_leads`, call the
`notify-lead` function.

---

## Pre-launch checklist

- [ ] `setup_all.sql` run — tables `publishing_leads`, `book_customizations`,
      `royalty_calculations`, `site_content`, `admin_users` all present
- [ ] `site-media` storage bucket exists (Storage tab)
- [ ] Admin user created **and** present in `admin_users`
- [ ] `.env` set with **legacy anon key** + bare project URL; `npm run build` passes
- [ ] Env vars set in Vercel; site deploys
- [ ] Contact form submits → lead appears in `/admin` Leads tab
- [ ] `/admin` login works (admin) and shows **Not authorized** for a non-admin account
- [ ] Author signup → login → save a customization → appears under **My Account**
- [ ] CMS edit saves and shows live; video upload works
- [ ] Domain `oakbridge.in` connected with SSL; Supabase Site URL updated
- [ ] Real phone number replaces the `+91 00000 00000` placeholder (CMS → Footer)
- [ ] Replace `public/og-image.png` / `favicon.svg` with final brand assets if available
- [ ] (Recommended) Lead email notifications wired up

## Known placeholders to finalize

- Footer phone number (`+91 00000 00000`) — set via CMS → Footer.
- Customizer **Interior Color** / **Binding** prices (₹2,500 / ₹1,500) — adjust
  to real costs in `src/components/BookCustomizer.tsx`.
- OG share image and favicon in `public/`.

## Security notes

- Public tables (`publishing_leads`, `book_customizations`,
  `royalty_calculations`) allow anonymous INSERT (needed for the form/tools);
  the contact form has a honeypot + email validation. If spam appears, add
  Cloudflare Turnstile or move inserts behind a rate-limited Edge Function.
- Leads and CMS writes are **admin-only** (enforced by RLS + `is_admin()`).
- A future version can add an `activity_log` table and error monitoring
  (e.g. Sentry) — see the project notes.
