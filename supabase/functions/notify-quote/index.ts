// Supabase Edge Function: notify-quote
//
// On a new row in `quotes`, emails (1) the customer a "we received your request"
// confirmation and (2) the team a new-quote notification. Trigger it with a
// Database Webhook (Database -> Webhooks) on INSERT of `quotes`, pointing at
// this function's URL, with a header `x-webhook-secret: <value>`.
//
// Required secrets (supabase secrets set KEY=value):
//   RESEND_API_KEY   - API key from https://resend.com
//   NOTIFY_TO        - team inbox (e.g. info@oakbridge.in)
//   NOTIFY_FROM      - verified sender (e.g. quotes@oakbridge.in)
//   WEBHOOK_SECRET   - shared secret matching the webhook header (recommended)

interface Quote {
  id?: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  message?: string | null;
  book_size?: string | null;
  binding?: string | null;
  interior_color?: string | null;
  paper_type?: string | null;
  cover_design?: string | null;
  layout_option?: string | null;
  estimated_price?: number | null;
  status?: string | null;
  created_at?: string | null;
}

interface WebhookPayload {
  type?: string;
  record?: Quote;
}

const esc = (s: unknown) =>
  String(s ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const inr = (n: unknown) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;

const row = (label: string, value: unknown) =>
  `<tr><td style="padding:6px 12px;font-weight:600;color:#555">${esc(label)}</td>` +
  `<td style="padding:6px 12px;color:#111">${esc(value)}</td></tr>`;

function summaryTable(q: Quote): string {
  const config = [q.book_size, q.binding, q.interior_color, q.paper_type, q.cover_design, q.layout_option]
    .filter(Boolean)
    .join(' · ');
  const rows = [
    ['Quote ID', q.id],
    ['Name', q.name],
    ['Phone', q.phone],
    ['Configuration', config],
    ['Estimated price', inr(q.estimated_price)],
    q.message ? ['Message', q.message] : null,
  ].filter(Boolean) as [string, unknown][];
  return `<table style="border-collapse:collapse;width:100%">${rows
    .map(([l, v]) => row(l, v))
    .join('')}</table>`;
}

async function sendEmail(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; detail?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      reply_to: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) return { ok: false, detail: await res.text() };
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const NOTIFY_TO = Deno.env.get('NOTIFY_TO') ?? 'info@oakbridge.in';
    const NOTIFY_FROM = Deno.env.get('NOTIFY_FROM') ?? 'quotes@oakbridge.in';
    const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');

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
    const quote = payload.record ?? (payload as unknown as Quote);
    const table = summaryTable(quote);
    const results: Record<string, unknown> = {};

    // 1) Customer confirmation
    if (quote.email) {
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:560px">
          <h2 style="color:#b45309">We’ve received your quote request</h2>
          <p style="color:#333">Hi ${esc(quote.name || 'there')}, thanks for your interest. Our team will review
          your configuration and get back to you with a tailored quote shortly. Here’s what you sent:</p>
          ${table}
          <p style="color:#888;font-size:12px;margin-top:16px">Cursive — An Imprint of OakBridge</p>
        </div>`;
      const r = await sendEmail({
        apiKey: RESEND_API_KEY,
        from: `Cursive <${NOTIFY_FROM}>`,
        to: quote.email,
        subject: 'Your Cursive quote request',
        html,
      });
      results.customer = r.ok ? 'sent' : r.detail;
    } else {
      results.customer = 'skipped (no email)';
    }

    // 2) Admin notification
    const adminHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="color:#b45309">New quote request</h2>
        ${table}
        <p style="color:#888;font-size:12px;margin-top:16px">Customer: ${esc(quote.email)}</p>
      </div>`;
    const a = await sendEmail({
      apiKey: RESEND_API_KEY,
      from: `Cursive Quotes <${NOTIFY_FROM}>`,
      to: NOTIFY_TO,
      replyTo: quote.email ?? undefined,
      subject: `New quote request — ${esc(quote.name || 'customer')} (est. ${inr(quote.estimated_price)})`,
      html: adminHtml,
    });
    results.admin = a.ok ? 'sent' : a.detail;

    return new Response(JSON.stringify({ ok: true, results }), {
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
