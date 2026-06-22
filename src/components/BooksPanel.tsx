import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, Plus, Trash2, Save, BookText } from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import ExportMenu from './ExportMenu';
import type { Column } from '../lib/exporters';
import DateRangeFilter, { DateRange, emptyRange, filterByRange } from './DateRangeFilter';

interface Book {
  id: string;
  user_id: string;
  title: string;
  status: string;
  publish_date: string | null;
  copies_sold: number;
  book_price: number;
  royalty_rate: number;
  created_at: string;
}
interface Author {
  id: string;
  email: string;
  full_name: string | null;
}

const STATUSES = ['submitted', 'under_review', 'editing', 'in_production', 'published'];
const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function BooksPanel() {
  const [items, setItems] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState<DateRange>(emptyRange);

  // create form
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('submitted');
  const [publishDate, setPublishDate] = useState('');
  const [copiesSold, setCopiesSold] = useState('');
  const [bookPrice, setBookPrice] = useState('');
  const [royaltyRate, setRoyaltyRate] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const [b, a] = await Promise.all([
      supabase.from('author_books').select('*').order('created_at', { ascending: false }),
      supabase.rpc('admin_authors'),
    ]);
    if (b.error) {
      console.error(b.error, a.error);
      setError('Could not load books. Make sure the author_books SQL has been run.');
    } else {
      setItems((b.data as Book[]) ?? []);
      setAuthors((a.data as Author[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const authorName = (id: string) => {
    const au = authors.find((x) => x.id === id);
    return au ? au.full_name || au.email : '—';
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim()) {
      setError('Please select an author and enter a title.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('author_books').insert({
      user_id: userId,
      title: title.trim(),
      status,
      publish_date: publishDate || null,
      copies_sold: copiesSold ? Number(copiesSold) : 0,
      book_price: bookPrice ? Number(bookPrice) : 0,
      royalty_rate: royaltyRate ? Number(royaltyRate) : 0,
    });
    setSaving(false);
    if (err) {
      console.error(err);
      setError('Could not create the book entry.');
      return;
    }
    setTitle('');
    setPublishDate('');
    setCopiesSold('');
    setBookPrice('');
    setRoyaltyRate('');
    setStatus('submitted');
    load();
  };

  // local edits
  const patch = (id: string, field: keyof Book, value: string | number) =>
    setItems((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));

  const saveRow = async (b: Book) => {
    const { error: err } = await supabase
      .from('author_books')
      .update({
        title: b.title,
        status: b.status,
        publish_date: b.publish_date || null,
        copies_sold: Number(b.copies_sold) || 0,
        book_price: Number(b.book_price) || 0,
        royalty_rate: Number(b.royalty_rate) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', b.id);
    if (err) {
      console.error(err);
      alert('Could not save changes.');
    } else {
      alert('Saved.');
    }
  };

  const remove = async (b: Book) => {
    if (!confirm(`Delete “${b.title}”?`)) return;
    setItems((prev) => prev.filter((x) => x.id !== b.id));
    await supabase.from('author_books').delete().eq('id', b.id);
  };

  const columns: Column<Book>[] = [
    { header: 'Author', value: (b) => authorName(b.user_id) },
    { header: 'Title', value: (b) => b.title },
    { header: 'Status', value: (b) => b.status.replace('_', ' ') },
    { header: 'Publish Date', value: (b) => (b.publish_date ? b.publish_date.slice(0, 10) : '') },
    { header: 'Copies Sold', value: (b) => b.copies_sold || 0 },
    { header: 'Book Price (INR)', value: (b) => b.book_price || 0 },
    { header: 'Royalty %', value: (b) => b.royalty_rate || 0 },
    {
      header: 'Earnings (INR)',
      value: (b) => Math.round((b.copies_sold || 0) * (b.book_price || 0) * (b.royalty_rate || 0) / 100),
    },
  ];

  const filtered = filterByRange(items, range, (b) => b.created_at);

  const field = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none';
  const cell = 'px-2 py-1 border border-gray-200 rounded text-sm w-full focus:border-amber-500 outline-none';

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
          <Plus className="w-4 h-4 text-amber-600" /> Add a book
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Author *</label>
            <select className={field} value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Select author…</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name ? `${a.full_name} (${a.email})` : a.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
            <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Publish date</label>
            <input className={field} type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Copies sold</label>
            <input className={field} type="number" min="0" value={copiesSold} onChange={(e) => setCopiesSold(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Book price (₹)</label>
            <input className={field} type="number" min="0" value={bookPrice} onChange={(e) => setBookPrice(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Royalty rate (%)</label>
            <input className={field} type="number" min="0" max="100" value={royaltyRate} onChange={(e) => setRoyaltyRate(e.target.value)} placeholder="0" />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add book'}
        </button>
      </form>

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <p className="text-gray-600">
          {filtered.length} {filtered.length === 1 ? 'book' : 'books'}
          {(range.from || range.to) && <span className="text-gray-400"> in range</span>}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter range={range} onChange={setRange} />
          <ExportMenu baseName="books" title="Books" columns={columns} rows={filtered} />
          <button onClick={load} className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-2xl border flex flex-col items-center gap-2">
          <BookText className="w-8 h-8 text-gray-300" />
          {items.length === 0 ? 'No books yet. Add one above.' : 'No books in the selected date range.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-3 py-3 font-semibold">Author</th>
                <th className="px-3 py-3 font-semibold">Title</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Publish</th>
                <th className="px-3 py-3 font-semibold">Copies</th>
                <th className="px-3 py-3 font-semibold">Price</th>
                <th className="px-3 py-3 font-semibold">Roy.%</th>
                <th className="px-3 py-3 font-semibold">Earnings</th>
                <th className="px-3 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b last:border-0 align-middle">
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap max-w-[140px] truncate">{authorName(b.user_id)}</td>
                  <td className="px-3 py-2">
                    <input className={`${cell} min-w-[120px]`} value={b.title} onChange={(e) => patch(b.id, 'title', e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <select className={cell} value={b.status} onChange={(e) => patch(b.id, 'status', e.target.value)}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      className={cell}
                      value={b.publish_date ? b.publish_date.slice(0, 10) : ''}
                      onChange={(e) => patch(b.id, 'publish_date', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" className={`${cell} w-20`} value={b.copies_sold} onChange={(e) => patch(b.id, 'copies_sold', Number(e.target.value))} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" className={`${cell} w-24`} value={b.book_price} onChange={(e) => patch(b.id, 'book_price', Number(e.target.value))} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" className={`${cell} w-16`} value={b.royalty_rate} onChange={(e) => patch(b.id, 'royalty_rate', Number(e.target.value))} />
                  </td>
                  <td className="px-3 py-2 font-semibold text-amber-700 whitespace-nowrap">
                    {inr(Math.round((b.copies_sold || 0) * (b.book_price || 0) * (b.royalty_rate || 0) / 100))}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => saveRow(b)} className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50" title="Save row">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
