// Supabase Edge Function: notify-workspace
//
// Emails the other party when a project message or proof event happens.
// Trigger with Database Webhooks (with header x-webhook-secret: <WEBHOOK_SECRET>):
//   - project_messages : INSERT
//   - project_proofs   : INSERT, UPDATE
//
// Secrets: RESEND_API_KEY, NOTIFY_TO, NOTIFY_FROM, WEBHOOK_SECRET
//          (+ auto SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)
// Deploy: supabase functions deploy notify-workspace --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE = 'https://cursivepublishing.com';

interface Payload {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function sendEmail(opts: { apiKey: string; from: string; to: string; subject: string; html: string; replyTo?: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: opts.from, to: [opts.to], reply_to: opts.replyTo, subject: opts.subject, html: opts.html }),
  });
  return res.ok ? { ok: true } : { ok: false, detail: await res.text() };
}

const wrap = (title: string, bodyHtml: string, ctaUrl: string, ctaLabel: string) => `
  <div style="font-family:system-ui,sans-serif;max-width:560px">
    <h2 style="color:#b45309">${esc(title)}</h2>
    ${bodyHtml}
    <p style="margin-top:20px">
      <a href="${ctaUrl}" style="background:#b45309;color:#fff;padding:10px 18px;border-radius:9999px;text-decoration:none;font-weight:600">${esc(ctaLabel)}</a>
    </p>
    <p style="color:#888;font-size:12px;margin-top:16px">Cursive — An Imprint of OakBridge · cursivepublishing.com</p>
  </div>`;

Deno.serve(async (req: Request) => {
  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const NOTIFY_TO = Deno.env.get('NOTIFY_TO') ?? 'info@oakbridge.in';
    const NOTIFY_FROM = Deno.env.get('NOTIFY_FROM') ?? 'orders@oakbridge.in';
    const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');
    if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: 'RESEND_API_KEY missing' }), { status: 500 });

    const payload = (await req.json()) as Payload;
    const rec = payload.record ?? {};
    const orderId = rec.order_id as string | undefined;
    if (!orderId) return new Response(JSON.stringify({ ok: true, skipped: 'no order_id' }), { status: 200 });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: order } = await admin
      .from('orders')
      .select('email, invoice_number, plan, ship_name')
      .eq('id', orderId)
      .single();

    const authorEmail = (order?.email as string) || '';
    const projectLabel = (order?.plan as string) || 'your project';
    const authorLink = `${SITE}/project?id=${orderId}`;
    const adminLink = `${SITE}/admin`;

    let result: unknown = 'no-op';

    if (payload.table === 'project_messages' && payload.type === 'INSERT') {
      const role = rec.sender_role as string;
      const body = `<p style="color:#333">${esc(rec.body)}</p>`;
      if (role === 'team' && authorEmail) {
        const r = await sendEmail({
          apiKey: RESEND_API_KEY, from: `Cursive <${NOTIFY_FROM}>`, to: authorEmail,
          subject: 'New message about your Cursive project',
          html: wrap(`A message from the Cursive team`, body, authorLink, 'Open your project'),
        });
        result = r.ok ? 'sent to author' : r.detail;
      } else if (role === 'author') {
        const r = await sendEmail({
          apiKey: RESEND_API_KEY, from: `Cursive Workspace <${NOTIFY_FROM}>`, to: NOTIFY_TO, replyTo: authorEmail || undefined,
          subject: `New author message — ${esc(order?.invoice_number || projectLabel)}`,
          html: wrap(`New message from ${esc(order?.ship_name || 'an author')}`, body, adminLink, 'Open admin'),
        });
        result = r.ok ? 'sent to team' : r.detail;
      }
    } else if (payload.table === 'project_proofs') {
      if (payload.type === 'INSERT' && authorEmail) {
        const r = await sendEmail({
          apiKey: RESEND_API_KEY, from: `Cursive <${NOTIFY_FROM}>`, to: authorEmail,
          subject: 'A new proof is ready for your review',
          html: wrap(
            'A new proof is ready',
            `<p style="color:#333">We’ve shared a new proof for your review: <strong>${esc(rec.title)}</strong>.
             Please open your project to approve it or request changes.</p>`,
            authorLink, 'Review the proof',
          ),
        });
        result = r.ok ? 'proof -> author' : r.detail;
      } else if (payload.type === 'UPDATE') {
        const oldStatus = (payload.old_record?.status as string) ?? '';
        const newStatus = (rec.status as string) ?? '';
        if (oldStatus !== newStatus && (newStatus === 'approved' || newStatus === 'changes_requested')) {
          const verb = newStatus === 'approved' ? 'approved' : 'requested changes on';
          const comment = rec.author_comment ? `<p style="color:#555"><em>“${esc(rec.author_comment)}”</em></p>` : '';
          const r = await sendEmail({
            apiKey: RESEND_API_KEY, from: `Cursive Workspace <${NOTIFY_FROM}>`, to: NOTIFY_TO, replyTo: authorEmail || undefined,
            subject: `Author ${verb} a proof — ${esc(order?.invoice_number || projectLabel)}`,
            html: wrap(
              `Author ${verb}: ${esc(rec.title)}`,
              comment, adminLink, 'Open admin',
            ),
          });
          result = r.ok ? 'decision -> team' : r.detail;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
