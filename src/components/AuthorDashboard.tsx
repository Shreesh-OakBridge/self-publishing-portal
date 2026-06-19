import { useEffect, useState } from 'react';
import { BookOpen, TrendingUp, IndianRupee, LayoutDashboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface AuthorBook {
  id: string;
  title: string;
  status: string;
  publish_date: string | null;
  copies_sold: number;
  book_price: number;
  royalty_rate: number;
}

const BOOK_STATUS: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-800' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-800' },
  editing: { label: 'Editing', color: 'bg-blue-100 text-blue-700' },
  in_production: { label: 'In Production', color: 'bg-blue-100 text-blue-700' },
  published: { label: 'Published', color: 'bg-green-100 text-green-800' },
};
const bookStatus = (s: string) =>
  BOOK_STATUS[s] ?? { label: s.replace('_', ' '), color: 'bg-gray-100 text-gray-600' };

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
// MM/YY publishing date.
const fmtMonthYear = (d: string | null) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getFullYear()).slice(-2)}`;
};

export default function AuthorDashboard({ showHeading = true }: { showHeading?: boolean }) {
  const { user } = useAuth();
  const [books, setBooks] = useState<AuthorBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('author_books')
        .select('id, title, status, publish_date, copies_sold, book_price, royalty_rate')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setBooks(data as AuthorBook[]);
      setLoading(false);
    })();
  }, [user]);

  const royaltyPerBook = (b: AuthorBook) => (b.book_price || 0) * (b.royalty_rate || 0) / 100;
  const earnings = (b: AuthorBook) => (b.copies_sold || 0) * royaltyPerBook(b);
  const totalCopies = books.reduce((s, b) => s + (b.copies_sold || 0), 0);
  const totalEarnings = books.reduce((s, b) => s + earnings(b), 0);
  const publishedCount = books.filter((b) => b.status === 'published').length;

  return (
    <div>
      {showHeading && (
        <div className="flex items-center space-x-2 mb-4">
          <LayoutDashboard className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Publishing Dashboard</h2>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Books Published</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
          <p className="text-xs text-gray-400">{books.length} total in catalogue</p>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>Copies Sold</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCopies.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400">across all titles</p>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <IndianRupee className="w-4 h-4 text-amber-600" />
            <span>Royalties Earned</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{inr(Math.round(totalEarnings))}</p>
          <p className="text-xs text-gray-400">copies × royalty per book</p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : books.length === 0 ? (
        <div className="bg-white rounded-2xl border p-6 text-gray-500">
          Your publishing journey hasn’t started yet. Once your book is in production, your status,
          sales, and royalty earnings will appear here.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Published</th>
                <th className="px-4 py-3 font-semibold">Copies Sold</th>
                <th className="px-4 py-3 font-semibold">Royalty / Copy</th>
                <th className="px-4 py-3 font-semibold">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => {
                const st = bookStatus(b.status);
                return (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtMonthYear(b.publish_date)}</td>
                    <td className="px-4 py-3 text-gray-700">{(b.copies_sold || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {inr(Math.round(royaltyPerBook(b)))}
                      {b.royalty_rate ? <span className="text-xs text-gray-400"> ({b.royalty_rate}%)</span> : null}
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-700">{inr(Math.round(earnings(b)))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
