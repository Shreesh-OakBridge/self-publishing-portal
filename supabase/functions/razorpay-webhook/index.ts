// Supabase Edge Function: razorpay-webhook
//
// Safety net: marks an order paid on the payment.captured event even if the
// customer closed the browser before client-side verification ran.
// Secrets: RAZORPAY_WEBHOOK_SECRET (+ auto SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)
// Set up in Razorpay Dashboard -> Settings -> Webhooks, event "payment.captured",
// URL = this function's URL. Deploy WITHOUT jwt:
//   supabase functions deploy razorpay-webhook --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  try {
    const SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!SECRET) return new Response('not configured', { status: 500 });

    const raw = await req.text();
    const sig = req.headers.get('x-razorpay-signature') ?? '';
    const expected = await hmacHex(raw, SECRET);
    if (sig !== expected) return new Response('invalid signature', { status: 401 });

    const evt = JSON.parse(raw);
    if (evt.event === 'payment.captured' || evt.event === 'order.paid') {
      const payment = evt.payload?.payment?.entity;
      const orderId = payment?.notes?.order_id;
      if (orderId) {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        await admin
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
          })
          .eq('id', orderId);
      }
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
