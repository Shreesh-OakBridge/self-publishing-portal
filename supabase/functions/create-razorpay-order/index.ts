// Supabase Edge Function: create-razorpay-order
//
// Called from the browser (Checkout) to create a Razorpay order server-side.
// Secrets (supabase secrets set KEY=value):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// Deploy: supabase functions deploy create-razorpay-order

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!KEY_ID || !KEY_SECRET) return json({ error: 'Razorpay keys not configured' }, 500);

    const { amount, order_id, email } = await req.json();
    const amt = Math.round(Number(amount) * 100); // rupees -> paise
    if (!amt || amt < 100) return json({ error: 'Invalid amount' }, 400);

    const auth = btoa(`${KEY_ID}:${KEY_SECRET}`);
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amt,
        currency: 'INR',
        receipt: order_id ?? `cursive-${Date.now()}`,
        notes: { order_id: order_id ?? '', email: email ?? '' },
      }),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data?.error?.description || 'Razorpay order failed' }, 502);

    return json({ id: data.id, amount: data.amount, currency: data.currency, key_id: KEY_ID });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
