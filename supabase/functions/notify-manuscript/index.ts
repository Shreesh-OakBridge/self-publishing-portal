// Supabase Edge Function: notify-manuscript
//
// When an author uploads a manuscript (INSERT on `manuscripts`), send:
//   • a confirmation email to the AUTHOR ("we've received it"), and
//   • a heads-up to the TEAM.
//
// The manuscripts row has no email column, so we look the author up via the
// service role. Trigger with a Database Webhook on INSERT of `manuscripts`,
// with header  x-webhook-secret: <WEBHOOK_SECRET>.
//
// Secrets: RESEND_API_KEY, NOTIFY_TO, NOTIFY_FROM, WEBHOOK_SECRET
//          (+ auto SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)
// Deploy:  supabase functions deploy notify-manuscript --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE = 'https://cursivepublishing.com';

interface Manuscript {
  id?: string;
  user_id?: string;
  title?: string;
  genre?: string;
  file_name?: string;
  word_count?: number;
}
interface Payload {
  type?: string;
  record?: Manuscript;
}

const esc = (s: unknown) =>
  String(s ?? '—').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function sendEmail(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: opts.from, to: [opts.to], reply_to: opts.replyTo, subject: opts.subject, html: opts.html }),
  });
  return res.ok ? { ok: true } : { ok: false, detail: await res.text() };
}

Deno.serve(async (req: Request) => {
  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const NOTIFY_TO = Deno.env.get('NOTIFY_TO') ?? 'info@oakbridge.in';
    const NOTIFY_FROM = Deno.env.get('NOTIFY_FROM') ?? 'orders@oakbridge.in';
    const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');
    // Trim both sides — a stray space/newline on the pasted header value is the
    // most common cause of a silent 401.
    const gotSecret = (req.headers.get('x-webhook-secret') ?? '').trim();
    if (WEBHOOK_SECRET && gotSecret !== WEBHOOK_SECRET.trim()) {
      console.error(
        `[notify-manuscript] 401: x-webhook-secret ${gotSecret ? 'does not match' : 'header is missing'}. ` +
          `Fix: in the Database Webhook, add header 'x-webhook-secret' with the exact same value as the ` +
          `WEBHOOK_SECRET function secret (no quotes, no trailing spaces).`,
      );
      return new Response(
        JSON.stringify({ error: 'Unauthorized: x-webhook-secret header does not match WEBHOOK_SECRET' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (!RESEND_API_KEY) {
      console.error('[notify-manuscript] RESEND_API_KEY is not set. Fix: supabase secrets set RESEND_API_KEY=...');
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as Payload;
    const rec = payload.record ?? {};
    const title = rec.title || 'your manuscript';

    // Look up the author's email/name via the service role.
    let authorEmail = '';
    let authorName = '';
    if (rec.user_id) {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { data } = await admin.auth.admin.getUserById(rec.user_id);
      authorEmail = data?.user?.email ?? '';
      authorName = (data?.user?.user_metadata?.full_name as string) || '';
    }

    const results: Record<string, unknown> = {};

    // 1) Confirmation to the author.
    if (authorEmail) {
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:560px">
          <h2 style="color:#b45309">We've received your manuscript</h2>
          <p style="color:#333">Hi${authorName ? ' ' + esc(authorName.split(' ')[0]) : ''}, thank you for submitting
             <strong>${esc(title)}</strong> to Cursive. Our editorial team will review it and get back to you soon.</p>
          <p style="color:#333">You can track its status any time from your account.</p>
          <p style="margin-top:20px">
            <a href="${SITE}/account" style="background:#b45309;color:#fff;padding:10px 18px;border-radius:9999px;text-decoration:none;font-weight:600">Open my account</a>
          </p>
          <p style="color:#888;font-size:12px;margin-top:16px">Cursive — An Imprint of OakBridge · cursivepublishing.com</p>
        </div>`;
      const r = await sendEmail({
        apiKey: RESEND_API_KEY,
        from: `Cursive <${NOTIFY_FROM}>`,
        to: authorEmail,
        subject: 'We’ve received your manuscript',
        html,
      });
      results.author = r.ok ? 'sent' : r.detail;
    }

    // 2) Heads-up to the team.
    const teamHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="color:#b45309">New manuscript submitted</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 12px;font-weight:600;color:#555">Title</td><td style="padding:6px 12px;color:#111">${esc(title)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555">Author</td><td style="padding:6px 12px;color:#111">${esc(authorName || '—')}${authorEmail ? ' &lt;' + esc(authorEmail) + '&gt;' : ''}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555">Genre</td><td style="padding:6px 12px;color:#111">${esc(rec.genre)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555">Word count</td><td style="padding:6px 12px;color:#111">${esc(rec.word_count)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555">File</td><td style="padding:6px 12px;color:#111">${esc(rec.file_name)}</td></tr>
        </table>
        <p style="margin-top:16px"><a href="${SITE}/admin" style="color:#b45309">Open admin</a></p>
      </div>`;
    const rt = await sendEmail({
      apiKey: RESEND_API_KEY,
      from: `Cursive <${NOTIFY_FROM}>`,
      to: NOTIFY_TO,
      replyTo: authorEmail || undefined,
      subject: `New manuscript: ${esc(title)}`,
      html: teamHtml,
    });
    results.team = rt.ok ? 'sent' : rt.detail;

    // Surface the outcome in the logs so a bad Resend key / unverified sender is obvious.
    if (results.author && results.author !== 'sent') console.error('[notify-manuscript] author email failed:', results.author);
    if (results.team !== 'sent') console.error('[notify-manuscript] team email failed:', results.team);
    console.log('[notify-manuscript] done', { authorEmail: authorEmail || '(none)', results });

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[notify-manuscript] error:', String(err));
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
