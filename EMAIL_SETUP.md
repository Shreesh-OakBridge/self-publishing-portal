# Email & Webhook Setup (Cursive)

Do these in order. For **any** transactional email to send, all four layers must
be right: Resend account → Supabase secrets → deployed functions → DB webhooks.

Supabase project ref: `hvbzdhcsgczlzbfsiuid`
Function URL pattern: `https://hvbzdhcsgczlzbfsiuid.supabase.co/functions/v1/<name>`

---

## Step 1 — Resend (the email provider)

1. Create/log in at **resend.com**.
2. **Domains → Add domain →** `oakbridge.in`. Add the **DNS records** Resend shows
   (SPF, DKIM, DMARC) at your domain registrar. Wait until status = **Verified**.
   - Emails can only be sent **from a verified domain**, so `NOTIFY_FROM`
     (`orders@oakbridge.in`) must belong to it.
3. **API Keys → Create API Key →** copy the value (`re_...`). Shown once.

## Step 2 — Supabase secrets (shared by ALL functions)

Set these once for the whole project (CLI or Dashboard → Edge Functions → Secrets):

```bash
supabase secrets set RESEND_API_KEY=re_your_key
supabase secrets set NOTIFY_TO=info@oakbridge.in
supabase secrets set NOTIFY_FROM=orders@oakbridge.in
supabase secrets set WEBHOOK_SECRET=pick-one-long-random-string
```

- `WEBHOOK_SECRET` is **one value shared by every webhook** below.
- Secrets are read at runtime — no redeploy needed after changing them.

## Step 3 — Deploy the functions

```bash
supabase functions deploy notify-lead --no-verify-jwt
supabase functions deploy notify-order --no-verify-jwt
supabase functions deploy notify-quote --no-verify-jwt
supabase functions deploy notify-workspace --no-verify-jwt
supabase functions deploy notify-manuscript --no-verify-jwt
```

## Step 4 — Create the Database Webhooks

Dashboard → **Database → Webhooks → Create a new hook**. For **every** hook:
Type = **Supabase Edge Functions** (pick the function), Method **POST**, and add
one HTTP header **`x-webhook-secret`** = the exact `WEBHOOK_SECRET` from Step 2
(no quotes, no spaces).

| Webhook (function) | Table | Events |
|---|---|---|
| notify-lead | `publishing_leads` | Insert |
| notify-order | `orders` | Insert |
| notify-quote | `quotes` | Insert |
| notify-workspace | `project_messages` | Insert |
| notify-workspace | `project_proofs` | Insert, Update |
| notify-manuscript | `manuscripts` | Insert |

(`razorpay-webhook` is a **Razorpay** webhook, not a DB webhook — configured in the
Razorpay dashboard, separate from the above.)

## Step 5 — Verify each one

Trigger the action, then open **Edge Functions → <name> → Logs**:

- Contact form → `notify-lead`
- Place an order → `notify-order`
- Request a quote → `notify-quote`
- Send a workspace message / post a proof → `notify-workspace`
- Upload a manuscript → `notify-manuscript`

A healthy log ends with `done { … results: { … 'sent' } }`.

---

## Troubleshooting (symptom → cause → fix)

| What you see | Cause | Fix |
|---|---|---|
| **No logs at all** for the function after the action | Webhook not created, wrong table, or wrong event | Re-check the Step-4 row: correct table + Insert event + right function |
| **`401 Unauthorized`** in logs | `x-webhook-secret` header ≠ `WEBHOOK_SECRET` | Make them identical (Step 2 value = Step 4 header). No quotes/spaces |
| **`RESEND_API_KEY not set / configured`** | Secret missing | `supabase secrets set RESEND_API_KEY=re_...` |
| Log says **sent**, but no email arrives | Domain not verified, or in spam | Finish Resend domain verification (Step 1); check spam; confirm `NOTIFY_FROM` is on the verified domain |
| **`from` / sender error** from Resend | `NOTIFY_FROM` not on a verified domain | Use an address on the verified domain |

## If you rotate `WEBHOOK_SECRET`

It's shared, so after changing it you must update the `x-webhook-secret` header on
**all** webhooks in the Step-4 table, or the others start failing with 401.
