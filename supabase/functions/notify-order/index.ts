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
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1';
import { encodeBase64, decodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { LOGO_PNG_B64, RUPEE_FONT_B64 } from './assets.ts';

interface Order {
  id?: string;
  invoice_number?: string | null;
  email?: string;
  author_name?: string | null;
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
  bill_name?: string | null;
  bill_address?: string | null;
  bill_gst?: string | null;
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

// Service accounting code + seller state for the GST split. Adjust SAC if needed.
const SAC = '998912';
const SELLER_STATE_CODE = '06'; // Haryana

// Indian-grouped amount with 2 decimals, no symbol (e.g. 47,372.00 / 12,34,567.00).
function toIndian(n: number): string {
  const neg = n < 0;
  const [intp, dec] = Math.abs(n).toFixed(2).split('.');
  let out = intp;
  if (intp.length > 3) {
    const tail = intp.slice(-3);
    const head = intp.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    out = `${head},${tail}`;
  }
  return `${neg ? '-' : ''}${out}.${dec}`;
}

// Amount in words (Indian system: crore/lakh/thousand).
function amountWords(num: number): string {
  let n = Math.round(num);
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x: number) => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ' ' + ones[x % 10] : ''}`).trim();
  const three = (x: number) => {
    const h = Math.floor(x / 100), r = x % 100;
    let o = '';
    if (h) o += `${ones[h]} Hundred`;
    if (r) o += `${o ? ' ' : ''}${two(r)}`;
    return o;
  };
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thou = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thou) parts.push(`${two(thou)} Thousand`);
  if (n) parts.push(three(n));
  return parts.join(' ');
}

// Builds a one-page A4 GST tax invoice (Tally-style) and returns it base64-encoded.
async function buildInvoicePdf(o: Order): Promise<string> {
  const total = Number(o.amount ?? 0);
  const discount = Number(o.discount ?? 0);
  const taxable = Math.round(total / 1.18);
  const gst = total - taxable;
  const subtotal = taxable + discount;
  const itemLabel = o.plan
    ? `${o.plan} Self-Publishing Plan`
    : o.customization_id
    ? 'Custom self-publishing package'
    : 'Publishing services';
  const invNo = o.invoice_number || `C/${(o.id ?? '').slice(0, 8).toUpperCase()}`;
  const author = o.author_name || o.ship_name || '';

  const dt = new Date(o.created_at ?? Date.now());
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()];
  const dateStr = `${String(dt.getDate()).padStart(2, '0')}-${mon}-${String(dt.getFullYear()).slice(-2)}`;

  // GST split: intra-state (CGST+SGST) if buyer is in Haryana, else IGST.
  const buyerGst = (o.bill_gst || '').trim().toUpperCase();
  const buyerCode = /^\d{2}/.test(buyerGst) ? buyerGst.slice(0, 2) : '';
  const state = (o.ship_state || '').trim();
  const interState = buyerCode ? buyerCode !== SELLER_STATE_CODE : !/haryana/i.test(state);

  const shipName = o.ship_name || o.email || '';
  const billName = o.bill_name || o.ship_name || o.email || '';

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const rupee = await doc.embedFont(decodeBase64(RUPEE_FONT_B64));
  const logo = await doc.embedPng(decodeBase64(LOGO_PNG_B64));

  const H = 842, W = 595;
  const T = (d: number) => H - d;
  const ink = rgb(0.12, 0.12, 0.12);
  const grey = rgb(0.42, 0.42, 0.42);
  const amber = rgb(0.69, 0.32, 0.04);
  const line = rgb(0.78, 0.78, 0.78);

  const txt = (x: number, d: number, s: unknown, size = 8, f = font, color = ink) =>
    page.drawText(String(s), { x, y: T(d), size, font: f, color });
  const txtR = (xr: number, d: number, s: unknown, size = 8, f = font, color = ink) => {
    const w = f.widthOfTextAtSize(String(s), size);
    page.drawText(String(s), { x: xr - w, y: T(d), size, font: f, color });
  };
  const txtC = (xc: number, d: number, s: unknown, size = 8, f = font, color = ink) => {
    const w = f.widthOfTextAtSize(String(s), size);
    page.drawText(String(s), { x: xc - w / 2, y: T(d), size, font: f, color });
  };
  const box = (x: number, dTop: number, w: number, h: number, fill?: ReturnType<typeof rgb>) =>
    page.drawRectangle({
      x, y: T(dTop) - h, width: w, height: h,
      borderColor: line, borderWidth: 0.7, ...(fill ? { color: fill } : {}),
    });
  const hline = (x1: number, x2: number, d: number, th = 0.7, color = line) =>
    page.drawLine({ start: { x: x1, y: T(d) }, end: { x: x2, y: T(d) }, thickness: th, color });
  const vline = (x: number, d1: number, d2: number, th = 0.7, color = line) =>
    page.drawLine({ start: { x, y: T(d1) }, end: { x, y: T(d2) }, thickness: th, color });

  const L = 28, R = 567, TOP = 30, BOT = 800;
  txtC(W / 2, 22, 'INVOICE', 11, bold);
  box(L, TOP, R - L, T(TOP) - T(BOT));

  const MIDX = 352;
  vline(MIDX, TOP, 470);

  // Seller: logo + tagline + legal entity + address
  const sx = L + 8;
  const LOGO_W = 78;
  const LOGO_H = (LOGO_W * logo.height) / logo.width;
  page.drawImage(logo, { x: sx, y: T(40) - LOGO_H, width: LOGO_W, height: LOGO_H });
  txt(sx + LOGO_W + 12, 50, 'An Imprint of OakBridge', 7.5, font, grey);
  txt(sx + LOGO_W + 12, 62, 'Oakbridge Publishing Pvt. Ltd.', 9, bold);
  [
    '934, 9th Floor, Tower B3, Spaze iTech Park,',
    'Sector 49, Gurgaon 122018',
    'GSTIN/UIN: 06AACCO5406D1ZW',
    'State Name : Haryana, Code : 06',
    'Contact : 1244305970, 8800337299',
    'E-Mail : info@cursivepublishing.com',
  ].forEach((ln, i) => txt(sx, 86 + i * 11, ln, 8));

  // Right meta grid
  const RX0 = MIDX, RX1 = R, RMID = 462;
  const metaCell = (x: number, dTop: number, w: number, h: number, label: string, value: string) => {
    box(x, dTop, w, h);
    txt(x + 4, dTop + 9, label, 7, font, grey);
    if (value) txt(x + 4, dTop + 21, value, 9, bold);
  };
  const rows: [string, string, string, string, number][] = [
    ['Invoice No.', invNo, 'Dated', dateStr, 36],
    ['Delivery Note', '', 'Mode/Terms of Payment', 'Online / Prepaid', 26],
    ["Buyer's Order No.", (o.id ?? '').slice(0, 8), 'Dated', dateStr, 26],
    ['Dispatch Doc No.', '', 'Delivery Note Date', '', 26],
    ['Dispatched through', '', 'Destination', o.ship_city || '', 26],
  ];
  let dd = TOP;
  for (const [l1, v1, l2, v2, h] of rows) {
    metaCell(RX0, dd, RMID - RX0, h, l1, v1);
    metaCell(RMID, dd, RX1 - RMID, h, l2, v2);
    dd += h;
  }
  box(RX0, dd, RX1 - RX0, T(dd) - T(470));
  txt(RX0 + 4, dd + 9, 'Terms of Delivery', 7, font, grey);

  // Consignee / Buyer
  const party = (dTop: number, h: number, title: string, name: string, lines: string[], place?: boolean) => {
    box(L, dTop, MIDX - L, h);
    txt(sx, dTop + 10, title, 7, font, grey);
    txt(sx, dTop + 24, name, 9, bold);
    lines.forEach((ln, i) => txt(sx, dTop + 36 + i * 11, ln, 7.5));
    if (place) txt(sx, dTop + 36 + lines.length * 11, `Place of Supply : ${state || '—'}`, 7.5);
  };
  const stateLine = `State Name : ${state || '—'}${buyerCode ? `, Code : ${buyerCode}` : ''}`;
  const baseLines = [
    o.ship_address || '',
    `${o.ship_city || ''}${o.ship_pincode ? ` - ${o.ship_pincode}` : ''}`,
    o.ship_phone ? `Tel. ${o.ship_phone}` : '',
    stateLine,
  ].filter((x) => x && x.trim() && x.trim() !== '-');
  const SELLER_BOT = 150;
  party(SELLER_BOT, 100, 'Consignee (Ship to)', shipName, baseLines);
  const buyerLines = [...baseLines];
  if (buyerGst) buyerLines.push(`GSTIN/UIN : ${buyerGst}`);
  party(SELLER_BOT + 100, 124, 'Buyer (Bill to)', billName, buyerLines, true);

  // Items table
  const TBL_TOP = 470, TBL_BOT = 600;
  const cols: [string, number, number][] = [
    ['', 28, 52], ['Description of Service', 52, 210], ['HSN/SAC', 210, 268],
    ['Quantity', 268, 338], ['Rate', 338, 416], ['per', 416, 448],
    ['Disc. %', 448, 492], ['Amount', 492, R],
  ];
  const HDR_H = 22;
  box(L, TBL_TOP, R - L, HDR_H, rgb(0.97, 0.95, 0.92));
  txtC(40, TBL_TOP + 9, 'Sl', 7.5, bold);
  txtC(40, TBL_TOP + 17, 'No.', 7.5, bold);
  for (const [name, x0, x1] of cols) {
    if (name) txtC((x0 + x1) / 2, TBL_TOP + 14, name, 7.5, bold);
  }
  for (const [, x0] of cols.slice(1)) vline(x0, TBL_TOP, TBL_BOT + HDR_H);
  box(L, TBL_TOP + HDR_H, R - L, T(TBL_TOP + HDR_H) - T(TBL_BOT));

  const iy = TBL_TOP + HDR_H + 18;
  txtC(40, iy, '1', 8);
  txt(56, iy, itemLabel, 8.5, bold);
  if (author) txt(56, iy + 12, `Author : ${author}`, 7.5, font, grey);
  txtC(239, iy, SAC, 8);
  txtC(303, iy, '1 Nos.', 8.5, bold);
  txtR(412, iy, toIndian(subtotal), 8.5);
  txtC(432, iy, 'Nos.', 8);
  txtC(470, iy, '0 %', 8);
  txtR(R - 6, iy, toIndian(subtotal), 8.5, bold);

  hline(R - 130, R - 6, 545, 0.5);
  let ty = 552;
  txtR(416, ty, 'Sub Total', 8, bold); txtR(R - 6, ty, toIndian(subtotal), 8.5); ty += 15;
  if (discount > 0) {
    txt(60, ty, `Less : Coupon (${o.coupon_code || ''})`, 8, font, grey);
    txtR(R - 6, ty, `(-)${toIndian(discount)}`, 8.5, font, rgb(0.1, 0.5, 0.2)); ty += 15;
  }
  if (interState) {
    txtR(416, ty, 'IGST @ 18%', 8, bold); txtR(R - 6, ty, toIndian(gst), 8.5); ty += 15;
  } else {
    const half = Math.round(gst / 2);
    txtR(416, ty, 'CGST @ 9%', 8, bold); txtR(R - 6, ty, toIndian(half), 8.5); ty += 15;
    txtR(416, ty, 'SGST @ 9%', 8, bold); txtR(R - 6, ty, toIndian(gst - half), 8.5); ty += 15;
  }
  txtR(416, ty, 'Round Off', 8, bold); txtR(R - 6, ty, '0.00', 8.5);

  // Total row
  box(L, TBL_BOT, R - L, 22);
  txtC(303, TBL_BOT + 14, '1 Nos.', 9, bold);
  txtR(416, TBL_BOT + 14, 'Total', 9, bold);
  txtR(R - 6, TBL_BOT + 14, `₹ ${toIndian(total)}`, 9.5, rupee, amber);

  // Words + bank + declaration
  const BAND_TOP = TBL_BOT + 22;
  txt(L + 4, BAND_TOP + 12, 'Amount Chargeable (in words)', 8, font, grey);
  txtR(R - 4, BAND_TOP + 12, 'E. & O.E', 7.5, font, grey);
  txt(L + 4, BAND_TOP + 26, `INR ${amountWords(total)} Only`, 9.5, bold);
  hline(L, R, BAND_TOP + 34);
  const DIVX = 300;
  vline(DIVX, BAND_TOP + 34, BOT);

  txt(L + 4, BAND_TOP + 50, 'Declaration', 8, bold);
  ['We declare that this invoice shows the actual price of the',
    'services described and that all particulars are true and correct.']
    .forEach((ln, i) => txt(L + 4, BAND_TOP + 62 + i * 11, ln, 7.5, font, grey));

  txt(DIVX + 8, BAND_TOP + 50, "Company's Bank Details", 8, bold);
  ([
    ['Bank Name', 'HDFC BANK - Current Account'],
    ['A/c No.', '50200026419143'],
    ['Branch & IFS Code', 'FIRST INDIA BRANCH & HDFC0000280'],
  ] as [string, string][]).forEach(([k, v], i) => {
    txt(DIVX + 8, BAND_TOP + 63 + i * 12, k, 7.5, font, grey);
    txt(DIVX + 85, BAND_TOP + 63 + i * 12, `: ${v}`, 7.5, bold);
  });
  txtR(R - 6, BOT - 26, 'for Oakbridge Publishing Pvt. Ltd.', 8, bold);
  txtR(R - 6, BOT - 6, 'Authorised Signatory', 7.5, font, grey);

  txtC(W / 2, BOT + 22, 'This is a Computer Generated Invoice', 7.5, font, grey);

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
        const fname = (order.invoice_number || (order.id ?? '').slice(0, 8) || 'cursive')
          .replace(/[^A-Za-z0-9-]/g, '-');
        attachments = [{ filename: `invoice-${fname}.pdf`, content: pdf }];
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
