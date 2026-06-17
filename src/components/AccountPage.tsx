import { useEffect, useState } from 'react';
import { BookOpen, LogOut, Palette, Calculator, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface Customization {
  id: string;
  paper_type: string | null;
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

const inr = (n: number | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN')}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingData(true);
      const [c, r] = await Promise.all([
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
      ]);
      if (c.data) setCustomizations(c.data as Customization[]);
      if (r.data) setCalculations(r.data as Calculation[]);
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

  const name = (user.user_metadata?.full_name as string) || user.email;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex items-center space-x-3"
          >
            <BookOpen className="w-7 h-7 text-amber-600" />
            <span className="text-lg font-bold text-gray-900">OakBridge</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => (window.location.href = '/')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={async () => {
                await signOut();
                window.location.href = '/';
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
        <div className="bg-white rounded-2xl border p-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {name}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>

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
              <a href="/customize" className="text-amber-700 font-semibold hover:underline">
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
                  </tr>
                </thead>
                <tbody>
                  {customizations.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(c.created_at)}</td>
                      <td className="px-4 py-3">{c.paper_type || '—'}</td>
                      <td className="px-4 py-3">{c.cover_design || '—'}</td>
                      <td className="px-4 py-3">{c.layout_option || '—'}</td>
                      <td className="px-4 py-3">{c.book_size || '—'}</td>
                      <td className="px-4 py-3 font-semibold">{inr(c.estimated_price)}</td>
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
              <a href="/royalty-calculator" className="text-amber-700 font-semibold hover:underline">
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
                  </tr>
                </thead>
                <tbody>
                  {calculations.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                      <td className="px-4 py-3">{r.plan_type || '—'}</td>
                      <td className="px-4 py-3">{inr(r.book_price)}</td>
                      <td className="px-4 py-3">{r.expected_sales ?? '—'}</td>
                      <td className="px-4 py-3">{inr(r.estimated_royalty)}</td>
                      <td className="px-4 py-3 font-semibold">{inr(r.monthly_earnings)}</td>
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
