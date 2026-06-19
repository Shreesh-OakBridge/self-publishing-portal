import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExportMenu from './ExportMenu';
import type { Column } from '../lib/exporters';

interface Order {
  id: string;
  user_id: string;
  plan: string | null;
  customization_id: string | null;
  amount: number | null;
  discount: number | null;
  coupon_code: string | null;
  royalty_rate: number | null;
  status: string;
  ship_name: string | null;
  ship_city: string | null;
  ship_state: string | null;
  ship_pincode: string | null;
  ship_phone: string | null;
  created_at: string;
}
interface Author {
  id: string;
  email: string;
  full_name: string | null;
}

const STATUSES = ['pending', 'confirmed', 'in_production', 'shipped', 'completed', 'cancelled'];
const inr = (n: number | null) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;
const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function OrdersPanel() {
  const [items, setItems] = useState<Order[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const [o, a] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.rpc('admin_authors'),
    ]);
    if (o.error) {
      console.error(o.error, a.error);
      setError('Could not load orders. Make sure the orders SQL has been run.');
    } else {
      setItems((o.data as Order[]) ?? []);
      const map: Record<string, Author> = {};
      ((a.data as Author[]) ?? []).forEach((au) => (map[au.id] = au));
      setAuthors(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error: err } = await supabase.from('orders').update({ status }).eq('id', id);
    if (err) {
      console.error(err);
      alert('Could not update status.');
      load();
    }
  };

  const columns: Column<Order>[] = [
    { header: 'Date', value: (o) => fmt(o.created_at) },
    { header: 'Customer', value: (o) => o.ship_name || authors[o.user_id]?.full_name || '' },
    { header: 'Email', value: (o) => authors[o.user_id]?.email || '' },
    { header: 'Plan', value: (o) => o.plan || '' },
    { header: 'Custom Design', value: (o) => (o.customization_id ? 'Yes' : 'No') },
    { header: 'Royalty %', value: (o) => (o.royalty_rate ?? '') },
    { header: 'Coupon', value: (o) => o.coupon_code || '' },
    { header: 'Discount', value: (o) => o.discount ?? 0 },
    { header: 'Amount (INR)', value: (o) => o.amount ?? 0 },
    { header: 'Status', value: (o) => o.status },
    { header: 'Phone', value: (o) => o.ship_phone || '' },
    { header: 'City', value: (o) => o.ship_city || '' },
    { header: 'State', value: (o) => o.ship_state || '' },
    { header: 'Pincode', value: (o) => o.ship_pincode || '' },
  ];

  if (loading) return <div className="text-center text-gray-500 py-16">Loading orders…</div>;
  if (error)
    return (
      <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600">
          {items.length} {items.length === 1 ? 'order' : 'orders'}
        </p>
        <div className="flex items-center gap-2">
          <ExportMenu baseName="orders" title="Orders" columns={columns} rows={items} />
          <button
            onClick={load}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border">
          No orders yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Ship to</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => {
                const au = authors[o.user_id];
                return (
                  <tr key={o.id} className="border-b last:border-0 align-top hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(o.created_at)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="font-medium text-gray-900">{o.ship_name || au?.full_name || '—'}</div>
                      {au && (
                        <a href={`mailto:${au.email}`} className="text-amber-700 hover:underline text-xs">
                          {au.email}
                        </a>
                      )}
                      {o.ship_phone && <div className="text-xs text-gray-500">{o.ship_phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {o.plan || '—'}
                      {o.customization_id && <div className="text-xs text-gray-400">+ custom design</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold">{inr(o.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {[o.ship_city, o.ship_state, o.ship_pincode].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => setStatus(o.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:border-amber-500 outline-none capitalize"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
