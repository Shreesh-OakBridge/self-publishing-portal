import { useEffect, useState } from 'react';
import { ArrowLeft, ShoppingCart, CheckCircle, AlertCircle, Loader2, Lock, Tag, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useContent } from '../content/ContentProvider';
import { go, withBase } from '../lib/basePath';
import { track } from '../lib/track';

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const priceToNumber = (p: string) => Number((p || '').replace(/[^0-9.]/g, '')) || 0;

// Fallback royalty rates by plan, used only if a CMS plan is missing its rate.
const PLAN_ROYALTY_FALLBACK: Record<string, number> = {
  Starter: 30,
  Professional: 45,
  Excellence: 55,
  Elite: 60,
};

interface Customization {
  id: string;
  paper_type: string | null;
  interior_color: string | null;
  binding: string | null;
  cover_design: string | null;
  layout_option: string | null;
  book_size: string | null;
  estimated_price: number | null;
}
interface RoyaltyCalc {
  id: string;
  plan_type: string | null;
  book_price: number | null;
  expected_sales: number | null;
  estimated_royalty: number | null;
  monthly_earnings: number | null;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler?: (resp: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance {
  open: () => void;
}
declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { user, loading } = useAuth();
  const { pricing, customizer, pages } = useContent();
  const params = new URLSearchParams(window.location.search);
  const planName = params.get('plan');
  const customizationId = params.get('customization');
  const royaltyId = params.get('royalty');

  // Get Started funnel selections (carried via sessionStorage).
  const [onboarding] = useState<{
    language?: string;
    manuscript_status?: string;
    publish_path?: string;
  } | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ob_onboarding') || 'null');
    } catch {
      return null;
    }
  });

  const [cust, setCust] = useState<Customization | null>(null);
  const [royalty, setRoyalty] = useState<RoyaltyCalc | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState('');

  const [ship, setShip] = useState({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });
  const [sameAsShip, setSameAsShip] = useState(true);
  const [bill, setBill] = useState({ name: '', address: '' });

  // Invoice fields: author name (required, prefilled) + optional buyer GSTIN / business name.
  const [author, setAuthor] = useState('');
  const [gstin, setGstin] = useState('');
  const [businessName, setBusinessName] = useState('');

  // Terms & Conditions + Publishing Agreement acceptance
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedAgreement, setAgreedAgreement] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Conflict: a plan AND a separate royalty selection can't be combined.
  const conflict = !!planName && !!royaltyId;

  useEffect(() => {
    if (!loading && !user) go('/login');
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (customizationId) {
        const { data } = await supabase
          .from('book_customizations')
          .select('id, paper_type, interior_color, binding, cover_design, layout_option, book_size, estimated_price')
          .eq('id', customizationId)
          .maybeSingle();
        if (data) setCust(data as Customization);
      }
      if (royaltyId) {
        const { data } = await supabase
          .from('royalty_calculations')
          .select('id, plan_type, book_price, expected_sales, estimated_royalty, monthly_earnings')
          .eq('id', royaltyId)
          .maybeSingle();
        if (data) setRoyalty(data as RoyaltyCalc);
      }
      const fullName = (user.user_metadata?.full_name as string) || '';
      if (fullName) setShip((s) => ({ ...s, name: fullName }));
      if (fullName) setAuthor((a) => a || fullName);
      setLoadingData(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const plan = planName ? pricing.plans.find((p) => p.name === planName) : null;
  const planAmount = plan ? priceToNumber(plan.price) : 0;
  const custAmount = cust?.estimated_price || 0;
  const subtotal = planAmount + custAmount;
  const discount = applied ? Math.min(applied.discount, subtotal) : 0;
  const taxable = Math.max(0, subtotal - discount);
  const GST_RATE = 0.18;
  const gst = Math.round(taxable * GST_RATE);
  const total = taxable + gst;
  const royaltyRate = planName
    ? plan?.royaltyRate ?? PLAN_ROYALTY_FALLBACK[planName] ?? null
    : null;

  // Map customization option ids to friendly names via CMS config.
  const optName = (list: { id: string; name: string }[], id: string | null | undefined) =>
    list.find((o) => o.id === id)?.name || id || '—';
  const combo = cust
    ? [
        ['Size', optName(customizer.bookSizes, cust.book_size)],
        ['Binding', optName(customizer.bindingOptions, cust.binding)],
        ['Interior', optName(customizer.colorOptions, cust.interior_color)],
        ['Paper', optName(customizer.paperTypes, cust.paper_type)],
        ['Cover', optName(customizer.coverDesigns, cust.cover_design)],
        ['Layout', optName(customizer.layoutOptions, cust.layout_option)],
      ]
    : [];

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponMsg(null);
    const { data, error: err } = await supabase.rpc('validate_coupon', {
      p_code: couponInput.trim(),
      p_amount: subtotal,
    });
    setApplyingCoupon(false);
    const row = Array.isArray(data) ? data[0] : data;
    if (err || !row || !row.valid) {
      setApplied(null);
      setCouponMsg({ type: 'err', text: row?.message || 'Could not apply coupon.' });
      return;
    }
    setApplied({ code: couponInput.trim().toUpperCase(), discount: Number(row.discount) });
    setCouponMsg({ type: 'ok', text: row.message || 'Coupon applied.' });
  };

  const placeOrder = () => {
    if (!user || conflict) return;
    if (!ship.name.trim() || !ship.address.trim() || !ship.city.trim() || !ship.pincode.trim()) {
      setError('Please complete the required shipping fields (name, address, city, pincode).');
      return;
    }
    if (!author.trim()) {
      setError('Please enter the author name — it appears on your invoice.');
      return;
    }
    const g = gstin.trim().toUpperCase();
    if (g && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(g)) {
      setError('That GSTIN doesn’t look valid (it should be 15 characters). Leave it blank if you don’t have one.');
      return;
    }
    track('add_shipping_info', { value: total, currency: 'INR' });
    // Must accept Terms & Conditions and the Publishing Agreement — surface the modal otherwise.
    if (!agreedTerms || !agreedAgreement) {
      setTermsModalOpen(true);
      return;
    }
    submitOrder();
  };

  const submitOrder = async () => {
    if (!user) return;
    track('add_payment_info', { value: total, currency: 'INR' });
    setPlacing(true);
    setError('');
    const buyerGst = gstin.trim().toUpperCase();
    // When a GSTIN is given, prefer the registered business name for Bill-to.
    const billName = buyerGst && businessName.trim()
      ? businessName.trim()
      : sameAsShip
      ? ship.name
      : bill.name;
    const billing = {
      bill_name: billName,
      bill_address: sameAsShip ? ship.address : bill.address,
      bill_gst: buyerGst || null,
    };
    const { data: inserted, error: err } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        email: user.email,
        author_name: author.trim(),
        plan: planName,
        customization_id: customizationId,
        royalty_calculation_id: royaltyId,
        royalty_rate: royaltyRate,
        amount: total,
        discount,
        coupon_code: applied?.code ?? null,
        publish_path: onboarding?.publish_path ?? null,
        language: onboarding?.language ?? null,
        manuscript_status: onboarding?.manuscript_status ?? null,
        terms_accepted_at: new Date().toISOString(),
        publishing_agreement_accepted_at: new Date().toISOString(),
        status: 'pending',
        payment_status: 'unpaid',
        ship_name: ship.name,
        ship_phone: ship.phone,
        ship_address: ship.address,
        ship_city: ship.city,
        ship_state: ship.state,
        ship_pincode: ship.pincode,
        ...billing,
      })
      .select('id')
      .single();
    if (err || !inserted) {
      setPlacing(false);
      console.error(err);
      setError('Could not place the order. Please try again.');
      return;
    }
    try {
      sessionStorage.removeItem('ob_onboarding');
    } catch {
      /* ignore */
    }

    const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
    if (rzpKey && total > 0) {
      await payWithRazorpay(inserted.id as string, rzpKey);
    } else {
      // No gateway configured — keep the existing "team confirms payment" flow.
      finishPlaced();
    }
  };

  const finishPlaced = () => {
    track('purchase', {
      plan: planName ?? null,
      value: total,
      currency: 'INR',
      publish_path: onboarding?.publish_path ?? null,
    });
    setPlacing(false);
    setPlaced(true);
    window.scrollTo({ top: 0 });
  };

  const payWithRazorpay = async (orderId: string, key: string) => {
    const ok = await loadRazorpayScript();
    if (!ok || !window.Razorpay) {
      setPlacing(false);
      setError('Could not load the payment gateway. Please try again.');
      return;
    }
    const { data, error: ce } = await supabase.functions.invoke('create-razorpay-order', {
      body: { amount: total, order_id: orderId, email: user?.email },
    });
    if (ce || !data?.id) {
      setPlacing(false);
      setError('Could not start payment. Please try again, or contact us.');
      return;
    }
    const rzp = new window.Razorpay({
      key,
      order_id: data.id,
      amount: data.amount,
      currency: data.currency || 'INR',
      name: 'Cursive',
      description: planName || 'Publishing order',
      prefill: { name: ship.name, email: user?.email ?? '', contact: ship.phone },
      theme: { color: '#b45309' },
      handler: async (resp: RazorpayResponse) => {
        const { data: v, error: ve } = await supabase.functions.invoke('verify-razorpay-payment', {
          body: { ...resp, order_id: orderId },
        });
        if (ve || !v?.ok) {
          setError('Payment could not be verified. If money was deducted, please contact us — your order is saved.');
          return;
        }
        finishPlaced();
      },
      modal: {
        ondismiss: () => {
          setPlacing(false);
          setError('Payment was not completed — your order is saved as pending.');
        },
      },
    });
    rzp.open();
    setPlacing(false);
  };

  if (loading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading…</div>;
  }

  const Breakup = () => (
    <div className="space-y-2 text-sm">
      {plan && (
        <div className="flex justify-between">
          <span className="text-gray-600">Plan: {plan.name}</span>
          <span className="font-semibold">{inr(planAmount)}</span>
        </div>
      )}
      {cust && (
        <div className="flex justify-between">
          <span className="text-gray-600">Customization add-ons</span>
          <span className="font-semibold">{inr(custAmount)}</span>
        </div>
      )}
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>{inr(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-green-700">
          <span>Discount ({applied?.code})</span>
          <span>− {inr(discount)}</span>
        </div>
      )}
      {discount > 0 && (
        <div className="flex justify-between text-gray-600">
          <span>Taxable amount</span>
          <span>{inr(taxable)}</span>
        </div>
      )}
      <div className="flex justify-between text-gray-600">
        <span>GST (18%)</span>
        <span>{inr(gst)}</span>
      </div>
      <div className="flex justify-between items-center pt-2 border-t mt-2">
        <span className="font-bold text-gray-900">Total</span>
        <span className="text-xl font-bold text-amber-600">{inr(total)}</span>
      </div>
    </div>
  );

  const OrderDetails = () => (
    <>
      {onboarding && (onboarding.publish_path || onboarding.language || onboarding.manuscript_status) && (
        <p className="text-sm text-gray-700 mb-2">
          {onboarding.publish_path && (
            <span className="font-semibold capitalize">
              {onboarding.publish_path === 'expert' ? 'Expert Publishing' : 'Self-Publishing'}
            </span>
          )}
          {onboarding.language && <span className="text-gray-500"> · {onboarding.language}</span>}
          {onboarding.manuscript_status && (
            <span className="text-gray-500"> · {onboarding.manuscript_status}</span>
          )}
        </p>
      )}
      {plan && (
        <p className="text-sm text-gray-700 mb-2">
          <span className="font-semibold">Plan:</span> {plan.name}
          {royaltyRate != null && <span className="text-gray-500"> · Royalty {royaltyRate}%</span>}
        </p>
      )}
      {royalty && !plan && (
        <p className="text-sm text-gray-700 mb-2">
          <span className="font-semibold">Self-publishing royalty:</span> {royalty.plan_type || '—'} ·{' '}
          {inr(royalty.estimated_royalty || 0)}/book
        </p>
      )}
      {combo.length > 0 && (
        <div className="text-sm text-gray-700">
          <span className="font-semibold">Customization:</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
            {combo.map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (placed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl border p-8 text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order confirmed</h1>
            <p className="text-gray-600">
              Online payment is coming soon — our team will reach out to confirm next steps.
            </p>
          </div>
          <div className="bg-white rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-3">Your order</h2>
            <OrderDetails />
          </div>
          <div className="bg-white rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-3">Price breakup</h2>
            <Breakup />
          </div>
          <div className="bg-white rounded-2xl border p-6 mb-6 text-sm text-gray-700">
            <h2 className="font-bold text-gray-900 mb-2">Shipping to</h2>
            <p>{ship.name}{ship.phone ? ` · ${ship.phone}` : ''}</p>
            <p>{[ship.address, ship.city, ship.state, ship.pincode].filter(Boolean).join(', ')}</p>
          </div>
          <button
            onClick={() => go('/account')}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700"
          >
            Go to My Account
          </button>
        </main>
      </div>
    );
  }

  const field = 'w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => go('/')} className="flex items-center space-x-2 text-gray-600 hover:text-amber-700 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Continue browsing</span>
          </button>
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <ShoppingCart className="w-5 h-5 text-amber-600" /> Checkout
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {conflict && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                You’ve selected both a <strong>plan</strong> and a separate <strong>royalty</strong>.
                Please choose <strong>either a publishing plan</strong> or go through the
                <strong> self-publishing flow</strong> — not both.
              </span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-xl text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Order details */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order details</h2>
            <OrderDetails />
            {!plan && !cust && !royalty && <p className="text-gray-500 text-sm">No item selected.</p>}
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Shipping address</h2>
            <div className="mb-3">
              <input className={field} placeholder="Author name *" value={author} onChange={(e) => setAuthor(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">As it should appear on your invoice (use a pen name if your book is published under one).</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input className={field} placeholder="Full name *" value={ship.name} onChange={(e) => setShip({ ...ship, name: e.target.value })} />
              <input className={field} placeholder="Phone" value={ship.phone} onChange={(e) => setShip({ ...ship, phone: e.target.value })} />
              <input className={`${field} sm:col-span-2`} placeholder="Address *" value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} />
              <input className={field} placeholder="City *" value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} />
              <input className={field} placeholder="State" value={ship.state} onChange={(e) => setShip({ ...ship, state: e.target.value })} />
              <input className={field} placeholder="Pincode *" value={ship.pincode} onChange={(e) => setShip({ ...ship, pincode: e.target.value })} />
            </div>
          </div>

          {/* Billing */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Billing details</h2>
            <label className="flex items-center space-x-2 mb-4 text-sm text-gray-700">
              <input type="checkbox" checked={sameAsShip} onChange={(e) => setSameAsShip(e.target.checked)} className="w-4 h-4 accent-amber-600" />
              <span>Same as shipping address</span>
            </label>
            {!sameAsShip && (
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={field} placeholder="Billing name" value={bill.name} onChange={(e) => setBill({ ...bill, name: e.target.value })} />
                <input className={field} placeholder="Billing address" value={bill.address} onChange={(e) => setBill({ ...bill, address: e.target.value })} />
              </div>
            )}
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div>
                <input
                  className={field}
                  placeholder="GSTIN (optional)"
                  value={gstin}
                  maxLength={15}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-gray-400 mt-1">For a business/GST invoice. Leave blank if you don’t have one.</p>
              </div>
              {gstin.trim() && (
                <input
                  className={field}
                  placeholder="Business name (as per GST)"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Payment placeholder */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Payment</h2>
            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 border border-dashed rounded-xl p-4">
              <Lock className="w-5 h-5" />
              <span>Online payment (Razorpay) is coming soon. Place your order now and our team will confirm payment.</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order summary</h2>
            <Breakup />

            {/* Coupon */}
            <div className="mt-5 pt-5 border-t">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Coupon code</label>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 outline-none uppercase"
                />
                <button
                  onClick={applyCoupon}
                  disabled={applyingCoupon}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-amber-600 text-amber-700 text-sm font-semibold hover:bg-amber-50 disabled:opacity-50"
                >
                  {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                  Apply
                </button>
              </div>
              {couponMsg && (
                <p className={`text-xs mt-1 ${couponMsg.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            {/* Terms acceptance */}
            <label className="flex items-start gap-2 mt-5 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-amber-600 flex-shrink-0"
              />
              <span>
                I accept the{' '}
                <a href={withBase('/terms')} target="_blank" rel="noreferrer" className="text-amber-700 underline">
                  Terms &amp; Conditions
                </a>{' '}
                and{' '}
                <a href={withBase('/privacy')} target="_blank" rel="noreferrer" className="text-amber-700 underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <label className="flex items-start gap-2 mt-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedAgreement}
                onChange={(e) => setAgreedAgreement(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-amber-600 flex-shrink-0"
              />
              <span>
                I have read and accept the{' '}
                <a
                  href={withBase('/publishing-agreement')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-700 underline"
                >
                  Publishing Agreement
                </a>
                .
              </span>
            </label>

            <button
              onClick={placeOrder}
              disabled={placing || conflict}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
            >
              {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              <span>{placing ? 'Placing…' : 'Place Order'}</span>
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">Inclusive of 18% GST. Shipping calculated at confirmation.</p>
          </div>
        </div>
      </main>

      {/* Terms & Conditions modal — shown if the box wasn't ticked */}
      {termsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setTermsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Please accept to continue</h3>
              <button onClick={() => setTermsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto text-sm text-gray-700 space-y-3">
              <h4 className="font-bold text-gray-900">{pages.terms.title}</h4>
              {pages.terms.body.split(/\n\s*\n/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p.trim()}</p>
              ))}
              <h4 className="font-bold text-gray-900 pt-2">{pages.privacy.title}</h4>
              {pages.privacy.body.split(/\n\s*\n/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p.trim()}</p>
              ))}
              <h4 className="font-bold text-gray-900 pt-2">{pages.publishingAgreement.title}</h4>
              {pages.publishingAgreement.body.split(/\n\s*\n/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p.trim()}</p>
              ))}
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setTermsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setAgreedTerms(true);
                  setAgreedAgreement(true);
                  setTermsModalOpen(false);
                  submitOrder();
                }}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold hover:from-amber-700 hover:to-orange-700"
              >
                I accept &amp; place order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
