import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import { useContent } from '../content/ContentProvider';
import ExportMenu from './ExportMenu';
import type { Column } from '../lib/exporters';
import DateRangeFilter, { DateRange, emptyRange, filterByRange } from './DateRangeFilter';

interface Quote {
  id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  message: string | null;
  book_size: string | null;
  binding: string | null;
  interior_color: string | null;
  paper_type: string | null;
  cover_design: string | null;
  layout_option: string | null;
  estimated_price: number | null;
  status: string;
  quoted_price: number | null;
  admin_notes: string | null;
  created_at: string;
}

const STATUSES = ['new', 'contacted', 'quoted', 'closed'];
const inr = (n: number | null) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;
const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function QuotesPanel() {
  const { customizer } = useContent();
  const [items, setItems] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<DateRange>(emptyRange);
  const filtered = filterByRange(items, range, (q) => q.created_at);

  const name = (list: { id: string; name: string }[], id: string | null) =>
    list.find((o) => o.id === id)?.name || id || '—';
  const config = (q: Quote) =>
    [
      name(customizer.bookSizes, q.book_size),
      name(customizer.bindingOptions, q.binding),
      name(customizer.colorOptions, q.interior_color),
      name(customizer.paperTypes, q.paper_type),
      name(customizer.coverDesigns, q.cover_design),
      name(customizer.layoutOptions, q.layout_option),
    ].join(' · ');

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      console.error(err);
      setError('Could not load quotes. Make sure the quotes SQL has been run.');
    } else {
      setItems((data as Quote[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, changes: Partial<Quote>) => {
    setItems((prev) => prev.map((q) => (q.id === id ? { ...q, ...changes } : q)));
    const { error: err } = await supabase.from('quotes').update(changes).eq('id', id);
    if (err) {
      console.error(err);
      alert('Could not save the change.');
      load();
    }
  };

  const columns: Column<Quote>[] = [
    { header: 'Date', value: (q) => fmt(q.created_at) },
    { header: 'Name', value: (q) => q.name || '' },
    { header: 'Email', value: (q) => q.email || '' },
    { header: 'Phone', value: (q) => q.phone || '' },
    { header: 'Size', value: (q) => name(customizer.bookSizes, q.book_size) },
    { header: 'Binding', value: (q) => name(customizer.bindingOptions, q.binding) },
    { header: 'Interior', value: (q) => name(customizer.colorOptions, q.interior_color) },
    { header: 'Paper', value: (q) => name(customizer.paperTypes, q.paper_type) },
    { header: 'Cover', value: (q) => name(customizer.coverDesigns, q.cover_design) },
    { header: 'Layout', value: (q) => name(customizer.layoutOptions, q.layout_option) },
    { header: 'Est. Price', value: (q) => q.estimated_price ?? 0 },
    { header: 'Quoted Price', value: (q) => q.quoted_price ?? '' },
    { header: 'Status', value: (q) => q.status },
    { header: 'Message', value: (q) => q.message || '' },
    { header: 'Notes', value: (q) => q.admin_notes || '' },
  ];

  if (loading) return <div className="text-center text-gray-500 py-16">Loading quotes…</div>;
  if (error)
    return (
      <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-gray-600">
          {filtered.length} {filtered.length === 1 ? 'quote request' : 'quote requests'}
          {(range.from || range.to) && <span className="text-gray-400"> in range</span>}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter range={range} onChange={setRange} />
          <ExportMenu baseName="quotes" title="Quote Requests" columns={columns} rows={filtered} />
          <button
            onClick={load}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border">
          {items.length === 0 ? 'No quote requests yet.' : 'No quote requests in the selected date range.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl border p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-semibold text-gray-900">{q.name || '—'}</div>
                  <div className="text-sm text-gray-500">
                    {q.email && (
                      <a href={`mailto:${q.email}`} className="text-amber-700 hover:underline">
                        {q.email}
                      </a>
                    )}
                    {q.phone && <span> · {q.phone}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{fmt(q.created_at)}</div>
                </div>
                <select
                  value={q.status}
                  onChange={(e) => patch(q.id, { status: e.target.value })}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:border-amber-500 outline-none capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-500">Configuration: </span>
                {config(q)}
                <span className="text-gray-500"> · Est. </span>
                <span className="font-semibold">{inr(q.estimated_price)}</span>
              </div>

              {q.message && (
                <p className="mt-2 text-sm text-gray-600 italic">“{q.message}”</p>
              )}

              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Quoted price (₹)</label>
                  <input
                    type="number"
                    defaultValue={q.quoted_price ?? ''}
                    onBlur={(e) => {
                      const v = e.target.value === '' ? null : Number(e.target.value);
                      if (v !== (q.quoted_price ?? null)) patch(q.id, { quoted_price: v });
                    }}
                    placeholder="Enter your quote"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Internal notes</label>
                  <input
                    type="text"
                    defaultValue={q.admin_notes ?? ''}
                    onBlur={(e) => {
                      const v = e.target.value.trim() || null;
                      if (v !== (q.admin_notes ?? null)) patch(q.id, { admin_notes: v });
                    }}
                    placeholder="Notes for the team"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
