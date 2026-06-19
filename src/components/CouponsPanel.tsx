import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, Plus, Trash2, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExportMenu from './ExportMenu';
import type { Column } from '../lib/exporters';

interface Coupon {
  code: string;
  type: 'amount' | 'percent';
  value: number;
  restrict_email: string | null;
  min_order: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function CouponsPanel() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // create form
  const [code, setCode] = useState('');
  const [type, setType] = useState<'amount' | 'percent'>('amount');
  const [value, setValue] = useState('');
  const [restrictEmail, setRestrictEmail] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      console.error(err);
      setError('Could not load coupons. Make sure the coupons SQL has been run.');
    } else {
      setItems((data as Coupon[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) {
      setError('Code and value are required.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('coupons').insert({
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      restrict_email: restrictEmail.trim() || null,
      min_order: minOrder ? Number(minOrder) : 0,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      active: true,
    });
    setSaving(false);
    if (err) {
      setError(err.message.includes('duplicate') ? 'That code already exists.' : 'Could not create coupon.');
      return;
    }
    setCode('');
    setValue('');
    setRestrictEmail('');
    setMinOrder('');
    setMaxUses('');
    setExpiresAt('');
    load();
  };

  const toggleActive = async (c: Coupon) => {
    setItems((prev) => prev.map((x) => (x.code === c.code ? { ...x, active: !x.active } : x)));
    await supabase.from('coupons').update({ active: !c.active }).eq('code', c.code);
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    setItems((prev) => prev.filter((x) => x.code !== c.code));
    await supabase.from('coupons').delete().eq('code', c.code);
  };

  const columns: Column<Coupon>[] = [
    { header: 'Code', value: (c) => c.code },
    { header: 'Type', value: (c) => c.type },
    { header: 'Value', value: (c) => c.value },
    { header: 'Restrict Email', value: (c) => c.restrict_email || '' },
    { header: 'Min Order', value: (c) => c.min_order ?? 0 },
    { header: 'Used', value: (c) => c.used_count },
    { header: 'Max Uses', value: (c) => (c.max_uses ?? '') },
    { header: 'Expires', value: (c) => (c.expires_at ? c.expires_at.slice(0, 10) : '') },
    { header: 'Active', value: (c) => (c.active ? 'Yes' : 'No') },
  ];

  const field = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none';

  return (
    <>
      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-xl mb-4 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={create} className="bg-white rounded-2xl border p-5 mb-6">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-amber-600" /> Create coupon
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Code *</label>
            <input className={field} value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
            <select className={field} value={type} onChange={(e) => setType(e.target.value as 'amount' | 'percent')}>
              <option value="amount">Amount off (₹)</option>
              <option value="percent">Percent off (%)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Value * {type === 'amount' ? '(₹)' : '(%)'}
            </label>
            <input className={field} type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'amount' ? '500' : '10'} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Restrict to email (optional)</label>
            <input className={field} value={restrictEmail} onChange={(e) => setRestrictEmail(e.target.value)} placeholder="author@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Min order (₹, optional)</label>
            <input className={field} type="number" min="0" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Max uses (optional)</label>
            <input className={field} type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="unlimited" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Expiry (optional)</label>
            <input className={field} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create coupon'}
        </button>
      </form>

      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-600">{items.length} {items.length === 1 ? 'coupon' : 'coupons'}</p>
        <div className="flex items-center gap-2">
          <ExportMenu baseName="coupons" title="Coupons" columns={columns} rows={items} />
          <button onClick={load} className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-2xl border">No coupons yet.</div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Restriction</th>
                <th className="px-4 py-3 font-semibold">Uses</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.code} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" /> {c.code}
                  </td>
                  <td className="px-4 py-3">{c.type === 'amount' ? `₹${c.value}` : `${c.value}%`}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {c.restrict_email ? c.restrict_email : 'Anyone'}
                    {c.min_order ? ` · min ₹${c.min_order}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.used_count}
                    {c.max_uses != null ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmt(c.expires_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        c.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(c)} className="text-gray-400 hover:text-red-600" aria-label="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
