# Security Notes — OakBridge Publishing

## Model

There is no custom backend server. The app uses Supabase's auto-generated APIs
(REST/PostgREST, Auth, Storage) plus one Edge Function. The **anon key is public
by design** (it ships in the JS bundle); data security therefore rests entirely
on **Row-Level Security**, which is configured in `supabase/setup_all.sql`:
- Leads readable only by admins (`is_admin()`).
- CMS (`site_content`) writes are admin-only; public read.
- Saved customizations/calculations are user-scoped (insert your own id, read
  your own rows).
- Storage writes admin-only; `site-media` is public-read (marketing media only).

## Done in code (high priority)

- **Security HTTP headers** (`vercel.json`): `Content-Security-Policy`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security`.
  - ⚠️ After first deploy, open the live site with DevTools → Console and check
    for **CSP violations**. If a needed resource is blocked, the CSP in
    `vercel.json` needs that origin added (tell me and I'll adjust).
- **`notify-lead` caller verification**: rejects requests without the
  `x-webhook-secret` header. Set the function secret and configure the webhook
  to send the matching header (below).
- No `dangerouslySetInnerHTML`/`innerHTML`; React auto-escaping protects against
  stored/reflected XSS. No secrets in the frontend. `.env` is gitignored.

## You must set in the Supabase dashboard (cannot be done from code)

1. **Leaked-password protection** — Authentication → Policies/Settings → enable
   "Check against HaveIBeenPwned". Raise **minimum password length** to 8+.
2. **MFA for admins** — Authentication → enable TOTP MFA; enroll your admin user.
3. **Signup CAPTCHA** — Authentication → enable hCaptcha/Turnstile to stop bot
   signups and abusive auth traffic.
4. **Auth rate limits** — Authentication → Rate Limits: tighten sign-in / sign-up
   / OTP limits.
5. **Email auth** — set Site URL to `https://oakbridge.in` (URL Configuration).
6. **DNS**: add **SPF, DKIM, DMARC** records for `oakbridge.in` so lead emails
   (Resend) aren't spoofed or spam-filtered.

## notify-lead webhook secret (when you deploy it)

```bash
supabase secrets set WEBHOOK_SECRET=<a-long-random-string>
```
Then in Database → Webhooks, add a custom header to the webhook:
`x-webhook-secret: <the same value>`.

## Still open (not yet done) — see AUDIT.md

- **Rate-limiting / CAPTCHA on public inserts** (contact form + tools). Real
  enforcement needs either Supabase Auth CAPTCHA (signups) and/or moving the
  lead insert behind a rate-limited Edge Function that verifies a
  Turnstile/hCaptcha token. Requires a CAPTCHA site key from you.
- Generic auth error messages (avoid email enumeration).
- CHECK constraints on text field lengths.
- iframe `sandbox`/`referrerpolicy` on video embeds.
- MFA enrollment, password policy (dashboard, above).
- Periodic `npm audit` (don't run `--force`).
