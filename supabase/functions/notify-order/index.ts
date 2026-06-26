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
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

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

// "INR " prefix — StandardFonts (Helvetica) can't render the ₹ glyph.
const rs = (n: unknown) => `INR ${Number(n ?? 0).toLocaleString('en-IN')}`;

// Builds a one-page A4 invoice PDF and returns it base64-encoded (for Resend).
// NOTE: this is a basic invoice. A fully GST-compliant tax invoice also needs a
// real GSTIN, a sequential invoice-number series, HSN/SAC codes, and a
// CGST/SGST vs IGST split — fill the [PLACEHOLDERS] and have it reviewed.
async function buildInvoicePdf(o: Order): Promise<string> {
  const total = Number(o.amount ?? 0);
  const discount = Number(o.discount ?? 0);
  const taxable = Math.round(total / 1.18);
  const gst = total - taxable;
  const subtotal = taxable + discount;
  const itemLabel = o.plan
    ? `Publishing Plan — ${o.plan}`
    : o.customization_id
    ? 'Custom self-publishing package'
    : 'Publishing services';
  const invNo = `INV-${((o.id ?? '').slice(0, 8) || String(Date.now())).toUpperCase()}`;
  const dateStr = new Date(o.created_at ?? Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const ink = rgb(0.12, 0.12, 0.12);
  const grey = rgb(0.45, 0.45, 0.45);
  const amber = rgb(0.69, 0.32, 0.04);
  const line = rgb(0.85, 0.85, 0.85);
  const M = 50;

  const at = (t: string, x: number, yy: number, size = 10, f = font, color = ink) =>
    page.drawText(String(t), { x, y: yy, size, font: f, color });
  const rightAt = (t: string, xRight: number, yy: number, size = 10, f = font, color = ink) => {
    const w = f.widthOfTextAtSize(String(t), size);
    page.drawText(String(t), { x: xRight - w, y: yy, size, font: f, color });
  };

  let y = height - M;
  at('Cursive', M, y, 26, bold, amber);
  rightAt('TAX INVOICE', width - M, y, 16, bold, ink);
  at('An Imprint of OakBridge', M, y - 16, 9, font, grey);
  rightAt(`Invoice: ${invNo}`, width - M, y - 20, 9, font, grey);
  rightAt(`Date: ${dateStr}`, width - M, y - 33, 9, font, grey);
  y -= 50;
  at('[OAKBRIDGE LEGAL ENTITY], [Registered Address]', M, y, 9, font, grey);
  y -= 12;
  at('GSTIN: [GSTIN]   ·   cursivepublishing.com', M, y, 9, font, grey);

  y -= 16;
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 1, color: line });
  y -= 24;

  at('Bill To', M, y, 11, bold, ink);
  y -= 15;
  at(o.ship_name || o.email || '—', M, y, 10);
  y -= 13;
  if (o.email) {
    at(o.email, M, y, 9, font, grey);
    y -= 12;
  }
  if (o.ship_phone) {
    at(String(o.ship_phone), M, y, 9, font, grey);
    y -= 12;
  }
  const addr = [o.ship_address, o.ship_city, o.ship_state, o.ship_pincode].filter(Boolean).join(', ');
  if (addr) {
    at(addr, M, y, 9, font, grey);
    y -= 12;
  }

  y -= 14;
  page.drawRectangle({ x: M, y: y - 4, width: width - 2 * M, height: 22, color: rgb(0.97, 0.95, 0.92) });
  at('Description', M + 8, y + 4, 10, bold, ink);
  rightAt('Amount', width - M - 8, y + 4, 10, bold, ink);
  y -= 24;
  at(itemLabel, M + 8, y, 10);
  rightAt(rs(subtotal), width - M - 8, y, 10);
  y -= 22;

  page.drawLine({ start: { x: width - M - 200, y: y + 8 }, end: { x: width - M, y: y + 8 }, thickness: 0.5, color: line });
  const totalsRow = (label: string, val: string, f = font, color = ink) => {
    at(label, width - M - 190, y, 10, f, color);
    rightAt(val, width - M - 8, y, 10, f, color);
    y -= 16;
  };
  if (discount > 0) totalsRow('Discount', `- ${rs(discount)}`, font, rgb(0.1, 0.5, 0.2));
  totalsRow('Taxable value', rs(taxable));
  totalsRow('GST (18%)', rs(gst));
  totalsRow('Total', rs(total), bold, amber);

  y -= 10;
  at(
    `Payment status: ${o.status === 'pending' ? 'Pending — our team will confirm' : o.status || 'Pending'}`,
    M,
    y,
    9,
    font,
    grey,
  );
  y -= 30;
  at('Thank you for choosing Cursive.', M, y, 10, bold, ink);
  y -= 14;
  at('System-generated invoice. Questions? info@cursivepublishing.com', M, y, 8, font, grey);

  const bytes = await doc.save();
  return encodeBase64(bytes);
}

async function sendEmail(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[];
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
      attachments: opts.attachments,
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

    // 1) Customer confirmation (with PDF invoice attached)
    if (order.email) {
      let attachments: { filename: string; content: string }[] | undefined;
      try {
        const pdf = await buildInvoicePdf(order);
        attachments = [
          { filename: `invoice-${(order.id ?? '').slice(0, 8) || 'cursive'}.pdf`, content: pdf },
        ];
      } catch (e) {
        // Never let an invoice failure block the confirmation email.
        console.error('invoice PDF generation failed:', e);
      }
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:560px">
          <h2 style="color:#b45309">Thank you for your order</h2>
          <p style="color:#333">Hi ${esc(order.ship_name || 'there')}, we’ve received your order and our
          team will be in touch shortly. Your invoice is attached as a PDF. Here’s a summary:</p>
          ${table}
          <p style="color:#888;font-size:12px;margin-top:16px">Cursive — An Imprint of OakBridge · cursivepublishing.com</p>
        </div>`;
      const r = await sendEmail({
        apiKey: RESEND_API_KEY,
        from: `Cursive <${NOTIFY_FROM}>`,
        to: order.email,
        subject: 'Your Cursive order is confirmed — invoice attached',
        html,
        attachments,
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
