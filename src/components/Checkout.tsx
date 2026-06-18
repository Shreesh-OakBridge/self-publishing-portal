import { useEffect, useState } from 'react';
import { ArrowLeft, ShoppingCart, CheckCircle, AlertCircle, Loader2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useContent } from '../content/ContentProvider';

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const priceToNumber = (p: string) => Number((p || '').replace(/[^0-9.]/g, '')) || 0;

interface Customization {
  id: string;
  paper_type: string | null;
  binding: string | null;
  interior_color: string | null;
  book_size: string | null;
  estimated_price: number | null;
}

export default function Checkout() {
  const { user, loading } = useAuth();
  const { pricing } = useContent();
  const params = new URLSearchParams(window.location.search);
  const planName = params.get('plan');
  const customizationId = params.get('customization');

  const [cust, setCust] = useState<Customization | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState('');

  // Shipping
  const [ship, setShip] = useState({
    name: '', phone: '', address: '', city: '', state: '', pincode: '',
  });
  // Billing
  const [sameAsShip, setSameAsShip] = useState(true);
  const [bill, setBill] = useState({ name: '', address: '', gst: '' });

  useEffect(() => {
    if (!loading && !user) window.location.href = '/login';
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (customizationId) {
        const { data } = await supabase
          .from('book_customizations')
          .select('id, paper_type, binding, interior_color, book_size, estimated_price')
          .eq('id', customizationId)
          .maybeSingle();
        if (data) setCust(data as Customization);
      }
      // Prefill name from profile
      const fullName = (user.user_metadata?.full_name as string) || '';
      if (fullName) setShip((s) => ({ ...s, name: fullName }));
      setLoadingData(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const plan = planName ? pricing.plans.find((p) => p.name === planName) : null;
  const planAmount = plan ? priceToNumber(plan.price) : 0;
  const custAmount = cust?.estimated_price || 0;
  const total = planAmount + custAmount;

  const placeOrder = async () => {
    if (!user) return;
    if (!ship.name.trim() || !ship.address.trim() || !ship.city.trim() || !ship.pincode.trim()) {
      setError('Please complete the required shipping fields (name, address, city, pincode).');
      return;
    }
    setPlacing(true);
    setError('');
    const billing = sameAsShip
      ? { bill_name: ship.name, bill_address: ship.address, bill_gst: bill.gst }
      : { bill_name: bill.name, bill_address: bill.address, bill_gst: bill.gst };
    const { error: err } = await supabase.from('orders').insert({
      user_id: user.id,
      plan: planName,
      customization_id: customizationId,
      amount: total,
      status: 'pending',
      ship_name: ship.name,
      ship_phone: ship.phone,
      ship_address: ship.address,
      ship_city: ship.city,
      ship_state: ship.state,
      ship_pincode: ship.pincode,
      ...billing,
    });
    setPlacing(false);
    if (err) {
      console.error(err);
      setError('Could not place the order. Please try again.');
      return;
    }
    setPlaced(true);
  };

  if (loading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading…</div>;
  }

  if (placed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-3xl border p-10 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order placed</h1>
          <p className="text-gray-600 mb-6">
            Your order has been recorded. Online payment is coming soon — our team will reach out to
            confirm the next steps.
          </p>
          <button
            onClick={() => (window.location.href = '/account')}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700"
          >
            Go to My Account
          </button>
        </div>
      </div>
    );
  }

  const field = 'w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => (window.location.href = '/')} className="flex items-center space-x-2 text-gray-600 hover:text-amber-700 text-sm">
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
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-xl text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Shipping */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Shipping address</h2>
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
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <input className={field} placeholder="Billing name" value={bill.name} onChange={(e) => setBill({ ...bill, name: e.target.value })} />
                <input className={field} placeholder="Billing address" value={bill.address} onChange={(e) => setBill({ ...bill, address: e.target.value })} />
              </div>
            )}
            <input className={field} placeholder="GST number (optional)" value={bill.gst} onChange={(e) => setBill({ ...bill, gst: e.target.value })} />
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
            <div className="space-y-2 text-sm border-b pb-4 mb-4">
              {plan && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan: {plan.name}</span>
                  <span className="font-semibold">{inr(planAmount)}</span>
                </div>
              )}
              {cust && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Customization{cust.book_size ? ` (${cust.book_size}` : ''}
                    {cust.binding ? `, ${cust.binding})` : cust.book_size ? ')' : ''}
                  </span>
                  <span className="font-semibold">{inr(custAmount)}</span>
                </div>
              )}
              {!plan && !cust && <p className="text-gray-500">No item selected.</p>}
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-amber-600">{inr(total)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">Taxes/shipping calculated at confirmation.</p>
            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
            >
              {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              <span>{placing ? 'Placing…' : 'Place Order'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
