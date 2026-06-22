// Supabase Edge Function: notify-order
//
// On a new row in `orders`, emails (1) the customer an order confirmation and
// (2) the OakBridge team a new-order notification. Trigger it with a Database
// Webhook (Database -> Webhooks) on INSERT of `orders`, pointing at this
// function's URL, and add a header `x-webhook-secret: <value>`.
//
// Required secrets (supabase secrets set KEY=value):
//   RESEND_API_KEY   - API key from https://resend.com
//   NOTIFY_TO        - team inbox (e.g. info@oakbridge.in)
//   NOTIFY_FROM      - verified sender (e.g. orders@oakbridge.in)
//   WEBHOOK_SECRET   - shared secret matching the webhook header (recommended)

interface Order {
  id?: string;
  email?: string;
  plan?: string | null;
  customization_id?: string | null;
  publish_path?: string | null;
  language?: string | null;
  manuscript_status?: string | null;
  amount?: number | null;
  discount?: number | null;
  coupon_code?: string | null;
  royalty_rate?: number | null;
  status?: string;
  ship_name?: string | null;
  ship_phone?: string | null;
  ship_address?: string | null;
  ship_city?: string | null;
  ship_state?: string | null;
  ship_pincode?: string | null;
  created_at?: string;
}

interface WebhookPayload {
  type?: string;
  record?: Order;
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

function summaryTable(o: Order): string {
  const item = o.plan
    ? `Plan: ${o.plan}`
    : o.customization_id
    ? 'Custom book (self-publishing)'
    : '—';
  const path =
    o.publish_path === 'expert' ? 'Expert Publishing' : o.publish_path === 'self' ? 'Self-Publishing' : '';
  const rows = [
    ['Order ID', o.id],
    ['Item', item],
    ['Path', path],
    ['Language', o.language],
    ['Manuscript status', o.manuscript_status],
    o.coupon_code ? ['Coupon', `${o.coupon_code} (−${inr(o.discount)})`] : null,
    ['Total (incl. GST)', inr(o.amount)],
    ['Status', o.status],
    [
      'Ship to',
      [o.ship_name, o.ship_address, o.ship_city, o.ship_state, o.ship_pincode]
        .filter(Boolean)
        .join(', '),
    ],
    o.ship_phone ? ['Phone', o.ship_phone] : null,
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
    const NOTIFY_FROM = Deno.env.get('NOTIFY_FROM') ?? 'orders@oakbridge.in';
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
    const order = payload.record ?? (payload as unknown as Order);
    const table = summaryTable(order);
    const results: Record<string, unknown> = {};

    // 1) Customer confirmation
    if (order.email) {
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:560px">
          <h2 style="color:#b45309">Thank you for your order</h2>
          <p style="color:#333">Hi ${esc(order.ship_name || 'there')}, we’ve received your order and our
          team will be in touch shortly. Here’s a summary:</p>
          ${table}
          <p style="color:#888;font-size:12px;margin-top:16px">OakBridge Publishing · oakbridge.in</p>
        </div>`;
      const r = await sendEmail({
        apiKey: RESEND_API_KEY,
        from: `OakBridge Publishing <${NOTIFY_FROM}>`,
        to: order.email,
        subject: 'Your OakBridge order is confirmed',
        html,
      });
      results.customer = r.ok ? 'sent' : r.detail;
    } else {
      results.customer = 'skipped (no email)';
    }

    // 2) Admin notification
    const adminHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="color:#b45309">New order received</h2>
        ${table}
        <p style="color:#888;font-size:12px;margin-top:16px">Customer: ${esc(order.email)}</p>
      </div>`;
    const a = await sendEmail({
      apiKey: RESEND_API_KEY,
      from: `OakBridge Orders <${NOTIFY_FROM}>`,
      to: NOTIFY_TO,
      replyTo: order.email,
      subject: `New order: ${esc(order.plan || 'Custom book')} — ${inr(order.amount)}`,
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
