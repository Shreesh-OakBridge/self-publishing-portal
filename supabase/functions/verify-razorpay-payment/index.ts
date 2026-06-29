// Supabase Edge Function: verify-razorpay-payment
//
// Verifies the Razorpay checkout signature and marks the order paid.
// Secrets: RAZORPAY_KEY_SECRET (+ auto SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)
// Deploy: supabase functions deploy verify-razorpay-payment

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!KEY_SECRET) return json({ ok: false, error: 'Razorpay secret not configured' }, 500);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return json({ ok: false, error: 'Missing fields' }, 400);
    }

    const expected = await hmacHex(`${razorpay_order_id}|${razorpay_payment_id}`, KEY_SECRET);
    if (expected !== razorpay_signature) return json({ ok: false, error: 'Signature mismatch' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { error } = await admin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        razorpay_order_id,
        razorpay_payment_id,
      })
      .eq('id', order_id);
    if (error) return json({ ok: false, error: error.message }, 500);

    // Fire the paid confirmation + invoice email now that the order is paid.
    try {
      const { data: order } = await admin.from('orders').select('*').eq('id', order_id).single();
      const secret = Deno.env.get('WEBHOOK_SECRET');
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-webhook-secret': secret } : {}) },
        body: JSON.stringify({ type: 'PAYMENT', record: order }),
      });
    } catch (e) {
      console.error('notify-order trigger failed:', e);
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
});
