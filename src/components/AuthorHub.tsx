import { useEffect, useState } from 'react';
import {
  BookOpen, ArrowLeft, Loader2, Award, Trophy, Sparkles, TrendingUp, Users, Gift,
  Copy, Check, ExternalLink, Star, PenTool, ShoppingBag,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useContent } from '../content/ContentProvider';
import { go } from '../lib/basePath';
import { track } from '../lib/track';

interface Book {
  id: string;
  title: string;
  status: string;
  copies_sold: number | null;
  book_price: number | null;
  royalty_rate: number | null;
}
interface Referral {
  id: string;
  referred_email: string | null;
  status: string;
  created_at: string;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const earningsOf = (b: Book) =>
  (b.copies_sold || 0) * (b.book_price || 0) * (b.royalty_rate || 0) / 100;

export default function AuthorHub() {
  const { user, loading } = useAuth();
  const { authorHub } = useContent();
  const [books, setBooks] = useState<Book[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [counts, setCounts] = useState({ orders: 0, manuscripts: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) go('/login');
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [b, r, o, m] = await Promise.all([
        supabase.from('author_books').select('id, title, status, copies_sold, book_price, royalty_rate').eq('user_id', user.id),
        supabase.from('referrals').select('id, referred_email, status, created_at').eq('referrer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('orders').select('id').eq('user_id', user.id),
        supabase.from('manuscripts').select('id'),
      ]);
      setBooks((b.data as Book[]) ?? []);
      setReferrals((r.data as Referral[]) ?? []);
      setCounts({ orders: (o.data ?? []).length, manuscripts: (m.data ?? []).length });
      setLoadingData(false);
    })();
  }, [user]);

  if (loading || loadingData || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your hub…
      </div>
    );
  }

  const totalCopies = books.reduce((s, b) => s + (b.copies_sold || 0), 0);
  const totalEarnings = books.reduce((s, b) => s + earningsOf(b), 0);

  const referralLink = `${window.location.origin}/?ref=${user.id}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      track('click_event', { label: 'referral_copy' });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const badges = [
    { icon: Star, label: 'Welcome aboard', desc: 'Joined Cursive', earned: true },
    { icon: PenTool, label: 'Storyteller', desc: 'Submitted a manuscript', earned: counts.manuscripts > 0 },
    { icon: ShoppingBag, label: 'Committed', desc: 'Placed your first order', earned: counts.orders > 0 },
    { icon: BookOpen, label: 'Published author', desc: 'Book in production/published', earned: books.length > 0 },
    { icon: TrendingUp, label: 'On the shelves', desc: '100+ copies sold', earned: totalCopies >= 100 },
    { icon: Trophy, label: 'Bestseller', desc: '1,000+ copies sold', earned: totalCopies >= 1000 },
    { icon: Users, label: 'Connector', desc: 'Referred a fellow author', earned: referrals.length > 0 },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => go('/')} className="flex items-center space-x-3">
            <BookOpen className="w-7 h-7 text-amber-600" />
            <span className="text-lg font-bold text-gray-900">Cursive</span>
          </button>
          <button
            onClick={() => go('/account')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> My Account
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{authorHub.heading}</h1>
          <p className="text-gray-600 mt-1">{authorHub.subheading}</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Books', value: String(books.length) },
            { label: 'Copies sold', value: totalCopies.toLocaleString('en-IN') },
            { label: 'Royalty earned', value: inr(totalEarnings) },
            { label: 'Referrals', value: String(referrals.length) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
            <span className="text-sm text-gray-400">({earnedCount}/{badges.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {badges.map(({ icon: Icon, label, desc, earned }) => (
              <div
                key={label}
                className={`rounded-2xl border p-4 text-center ${earned ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                    earned ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Royalty / earnings report */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Royalty report</h2>
          </div>
          {books.length === 0 ? (
            <div className="bg-white rounded-2xl border p-6 text-gray-500">
              No published books yet. Once your book is on sale, your sales and royalties show up here.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="px-4 py-3 font-semibold">Book</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Copies sold</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Royalty %</th>
                    <th className="px-4 py-3 font-semibold text-right">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">{b.title}</td>
                      <td className="px-4 py-3 capitalize text-gray-600">{(b.status || '').replace('_', ' ')}</td>
                      <td className="px-4 py-3">{(b.copies_sold || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">{inr(b.book_price || 0)}</td>
                      <td className="px-4 py-3">{b.royalty_rate || 0}%</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-700">{inr(earningsOf(b))}</td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50/60 font-bold">
                    <td className="px-4 py-3" colSpan={5}>Total royalties earned</td>
                    <td className="px-4 py-3 text-right text-amber-800">{inr(totalEarnings)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Sales figures are updated by our team as your book sells.</p>
        </section>

        {/* Referrals */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Refer a friend</h2>
          </div>
          <div className="bg-white rounded-2xl border p-6">
            <p className="text-gray-700 mb-4">{authorHub.referralReward}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-2 bg-amber-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-amber-700"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            {referrals.length > 0 && (
              <div className="mt-5 border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Your referrals ({referrals.length})</p>
                <ul className="space-y-1 text-sm">
                  {referrals.map((r) => (
                    <li key={r.id} className="flex items-center justify-between">
                      <span className="text-gray-600">{r.referred_email || 'A new author'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'rewarded' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {r.status === 'rewarded' ? 'Rewarded' : 'Pending'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Community & resources */}
        {authorHub.community.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-gray-900">Community &amp; resources</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {authorHub.community.map((c) => {
                const inner = (
                  <>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      {c.label} {c.url && <ExternalLink className="w-3.5 h-3.5 text-amber-600" />}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{c.description}</p>
                    {!c.url && <p className="text-xs text-gray-400 mt-2">Coming soon</p>}
                  </>
                );
                return c.url ? (
                  <a key={c.label} href={c.url} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl border p-5 hover:border-amber-300 hover:shadow-sm transition-all">
                    {inner}
                  </a>
                ) : (
                  <div key={c.label} className="bg-white rounded-2xl border p-5">{inner}</div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
