import { useEffect, useState } from 'react';
import { BookOpen, LogOut, Palette, Calculator, Home, Pencil, ShoppingBag, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import ProfileEditor from './ProfileEditor';
import ManuscriptUpload from './ManuscriptUpload';
import { go, withBase } from '../lib/basePath';

interface Customization {
  id: string;
  paper_type: string | null;
  interior_color: string | null;
  binding: string | null;
  cover_design: string | null;
  layout_option: string | null;
  book_size: string | null;
  estimated_price: number | null;
  created_at: string;
}

interface Calculation {
  id: string;
  book_price: number | null;
  expected_sales: number | null;
  plan_type: string | null;
  estimated_royalty: number | null;
  monthly_earnings: number | null;
  created_at: string;
}

interface Order {
  id: string;
  plan: string | null;
  customization_id: string | null;
  amount: number | null;
  discount: number | null;
  coupon_code: string | null;
  status: string;
  created_at: string;
}

interface Quote {
  id: string;
  book_size: string | null;
  binding: string | null;
  estimated_price: number | null;
  quoted_price: number | null;
  status: string;
  created_at: string;
}

const statusColor = (s: string) => {
  switch (s) {
    case 'completed':
    case 'shipped':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    case 'confirmed':
    case 'in_production':
    case 'contacted':
      return 'bg-blue-100 text-blue-700';
    case 'quoted':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-amber-100 text-amber-800';
  }
};

const inr = (n: number | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN')}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      go('/login');
    }
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingData(true);
      const [c, r, o, q] = await Promise.all([
        supabase
          .from('book_customizations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('royalty_calculations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('id, plan, customization_id, amount, discount, coupon_code, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('quotes')
          .select('id, book_size, binding, estimated_price, quoted_price, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      if (c.data) setCustomizations(c.data as Customization[]);
      if (r.data) setCalculations(r.data as Calculation[]);
      if (o.data) setOrders(o.data as Order[]);
      if (q.data) setQuotes(q.data as Quote[]);
      setLoadingData(false);
    })();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Loading…
      </div>
    );
  }

  const fullName = (user.user_metadata?.full_name as string) || '';
  const bio = (user.user_metadata?.bio as string) || '';
  const bookScope = (user.user_metadata?.book_scope as string) || '';

  // Re-open a saved item on its page, pre-loaded via query params.
  const openCustomization = (c: Customization) => {
    const params = new URLSearchParams({
      paper: c.paper_type ?? '',
      color: c.interior_color ?? '',
      binding: c.binding ?? '',
      cover: c.cover_design ?? '',
      layout: c.layout_option ?? '',
      size: c.book_size ?? '',
    });
    go(`/customize?${params.toString()}`);
  };

  const openCalculation = (r: Calculation) => {
    const params = new URLSearchParams({
      price: String(r.book_price ?? ''),
      sales: String(r.expected_sales ?? ''),
      plan: r.plan_type ?? '',
    });
    go(`/royalty-calculator?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => go('/')}
            className="flex items-center space-x-3"
          >
            <BookOpen className="w-7 h-7 text-amber-600" />
            <span className="text-lg font-bold text-gray-900">Cursive</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => go('/')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={async () => {
                await signOut();
                go('/');
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {editingProfile ? (
          <ProfileEditor onDone={() => setEditingProfile(false)} />
        ) : (
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Login ID</p>
                <h1 className="text-2xl font-bold text-gray-900">{user.email}</h1>
                <p className="text-gray-600 mt-1">{fullName || 'Name not set'}</p>
              </div>
              <button
                onClick={() => setEditingProfile(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm flex-shrink-0"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>

            {(bio || bookScope) && (
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                {bio && (
                  <p>
                    <span className="font-semibold text-gray-700">About: </span>
                    <span className="text-gray-600">{bio}</span>
                  </p>
                )}
                {bookScope && (
                  <p>
                    <span className="font-semibold text-gray-700">My book: </span>
                    <span className="text-gray-600">{bookScope}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <section>
          <div className="flex items-center space-x-2 mb-3">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
          </div>
          {loadingData ? (
            <p className="text-gray-500">Loading…</p>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border p-6 text-gray-500">
              No orders yet.{' '}
              <a href={withBase('/#plans')} className="text-amber-700 font-semibold hover:underline">
                Explore publishing plans →
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Coupon</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(o.created_at)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {o.plan ? o.plan : o.customization_id ? 'Custom book' : '—'}
                        {o.plan && o.customization_id && (
                          <span className="text-xs text-gray-400"> + custom design</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {o.coupon_code ? (
                          <span className="font-mono text-xs">
                            {o.coupon_code}
                            {o.discount ? ` (−${inr(o.discount)})` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">{inr(o.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(o.status)}`}>
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">My Quote Requests</h2>
          </div>
          {loadingData ? (
            <p className="text-gray-500">Loading…</p>
          ) : quotes.length === 0 ? (
            <div className="bg-white rounded-2xl border p-6 text-gray-500">
              No quote requests yet.{' '}
              <a href={withBase('/customize')} className="text-amber-700 font-semibold hover:underline">
                Customize a book &amp; request a quote →
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Book</th>
                    <th className="px-4 py-3 font-semibold">Estimated</th>
                    <th className="px-4 py-3 font-semibold">Quoted</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(q.created_at)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {[q.book_size, q.binding].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3">{inr(q.estimated_price)}</td>
                      <td className="px-4 py-3 font-semibold text-amber-700">
                        {q.quoted_price != null ? inr(q.quoted_price) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(q.status)}`}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ManuscriptUpload />

        <section>
          <div className="flex items-center space-x-2 mb-3">
            <Palette className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Saved Book Customizations</h2>
          </div>
          {loadingData ? (
            <p className="text-gray-500">Loading…</p>
          ) : customizations.length === 0 ? (
            <div className="bg-white rounded-2xl border p-6 text-gray-500">
              No saved customizations yet.{' '}
              <a href={withBase('/customize')} className="text-amber-700 font-semibold hover:underline">
                Customize a book →
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Paper</th>
                    <th className="px-4 py-3 font-semibold">Cover</th>
                    <th className="px-4 py-3 font-semibold">Layout</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Est. Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {customizations.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => openCustomization(c)}
                      title="Open this design in the customizer to edit"
                      className="border-b last:border-0 hover:bg-amber-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(c.created_at)}</td>
                      <td className="px-4 py-3">{c.paper_type || '—'}</td>
                      <td className="px-4 py-3">{c.cover_design || '—'}</td>
                      <td className="px-4 py-3">{c.layout_option || '—'}</td>
                      <td className="px-4 py-3">{c.book_size || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-amber-700">{inr(c.estimated_price)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                          <Pencil className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center space-x-2 mb-3">
            <Calculator className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Saved Royalty Calculations</h2>
          </div>
          {loadingData ? (
            <p className="text-gray-500">Loading…</p>
          ) : calculations.length === 0 ? (
            <div className="bg-white rounded-2xl border p-6 text-gray-500">
              No saved calculations yet.{' '}
              <a href={withBase('/royalty-calculator')} className="text-amber-700 font-semibold hover:underline">
                Try the calculator →
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Book Price</th>
                    <th className="px-4 py-3 font-semibold">Monthly Sales</th>
                    <th className="px-4 py-3 font-semibold">Royalty / Book</th>
                    <th className="px-4 py-3 font-semibold">Monthly Earnings</th>
                    <th className="px-4 py-3 font-semibold text-right">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => openCalculation(r)}
                      title="Open this projection in the calculator to edit"
                      className="border-b last:border-0 hover:bg-amber-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                      <td className="px-4 py-3">{r.plan_type || '—'}</td>
                      <td className="px-4 py-3">{inr(r.book_price)}</td>
                      <td className="px-4 py-3">{r.expected_sales ?? '—'}</td>
                      <td className="px-4 py-3">{inr(r.estimated_royalty)}</td>
                      <td className="px-4 py-3 font-semibold text-amber-700">{inr(r.monthly_earnings)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                          <Pencil className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
