// Supabase Edge Function: notify-lead
//
// Sends an email to the OakBridge team whenever a new row is inserted into
// `publishing_leads`. Trigger it with a Database Webhook (Database -> Webhooks)
// on INSERT of publishing_leads, pointing at this function's URL.
//
// Required secrets (set via: supabase secrets set KEY=value):
//   RESEND_API_KEY   - API key from https://resend.com
//   NOTIFY_TO        - recipient address (e.g. info@oakbridge.in)
//   NOTIFY_FROM      - verified sender (e.g. leads@oakbridge.in)
//
// Resend's free tier covers low volume. Any transactional email provider with
// an HTTP API works — only the fetch() call below would change.

interface Lead {
  full_name?: string;
  email?: string;
  phone?: string;
  manuscript_title?: string;
  genre?: string;
  manuscript_status?: string;
  preferred_plan?: string;
  message?: string;
  created_at?: string;
}

interface WebhookPayload {
  type?: string;
  record?: Lead;
}

const esc = (s: unknown) =>
  String(s ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

Deno.serve(async (req: Request) => {
  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const NOTIFY_TO = Deno.env.get('NOTIFY_TO') ?? 'info@oakbridge.in';
    const NOTIFY_FROM = Deno.env.get('NOTIFY_FROM') ?? 'leads@oakbridge.in';
    const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');

    // Reject callers that don't present the shared secret, so a stranger who
    // discovers this URL can't trigger emails. Configure the Database Webhook
    // to send header `x-webhook-secret: <value>` and set the function secret
    // WEBHOOK_SECRET to the same value.
    if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as WebhookPayload;
    const lead = payload.record ?? (payload as unknown as Lead);

    const rows = [
      ['Name', lead.full_name],
      ['Email', lead.email],
      ['Phone', lead.phone],
      ['Manuscript', lead.manuscript_title],
      ['Genre', lead.genre],
      ['Status', lead.manuscript_status],
      ['Preferred plan', lead.preferred_plan],
      ['Message', lead.message],
    ]
      .map(
        ([label, value]) =>
          `<tr><td style="padding:6px 12px;font-weight:600;color:#555">${esc(
            label
          )}</td><td style="padding:6px 12px;color:#111">${esc(value)}</td></tr>`
      )
      .join('');

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="color:#b45309">New publishing lead</h2>
        <table style="border-collapse:collapse;width:100%">${rows}</table>
        <p style="color:#888;font-size:12px;margin-top:16px">Submitted via oakbridge.in</p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `OakBridge Leads <${NOTIFY_FROM}>`,
        to: [NOTIFY_TO],
        reply_to: lead.email,
        subject: `New lead: ${lead.full_name ?? 'Unknown'}`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return new Response(JSON.stringify({ error: 'Email send failed', detail }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
