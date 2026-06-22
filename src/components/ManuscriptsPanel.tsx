import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, Download, UserCheck, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExportMenu from './ExportMenu';
import type { Column } from '../lib/exporters';
import DateRangeFilter, { DateRange, emptyRange, filterByRange } from './DateRangeFilter';

interface Manuscript {
  id: string;
  user_id: string;
  title: string;
  genre: string | null;
  file_path: string;
  file_name: string | null;
  file_size: number | null;
  word_count: number | null;
  status: string;
  expert_review_status: string | null;
  expert_review_feedback: string | null;
  created_at: string;
}

const REVIEW_STATUSES = ['none', 'requested', 'in_review', 'changes_requested', 'completed'];
const REVIEW_BADGE: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-800',
  in_review: 'bg-blue-100 text-blue-700',
  changes_requested: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-800',
};
interface Author {
  id: string;
  email: string;
  full_name: string | null;
}

const STATUSES = ['submitted', 'in_review', 'accepted', 'changes_requested'];
const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  accepted: 'Accepted',
  changes_requested: 'Changes Requested',
};
const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const kb = (n: number | null) => (n ? `${Math.round(n / 1024)} KB` : '');

export default function ManuscriptsPanel() {
  const [items, setItems] = useState<Manuscript[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<DateRange>(emptyRange);

  // Expert-review editor modal
  const [reviewing, setReviewing] = useState<Manuscript | null>(null);
  const [rStatus, setRStatus] = useState('none');
  const [rFeedback, setRFeedback] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const openReview = (m: Manuscript) => {
    setReviewing(m);
    setRStatus(m.expert_review_status || 'none');
    setRFeedback(m.expert_review_feedback || '');
  };

  const saveReview = async () => {
    if (!reviewing) return;
    setSavingReview(true);
    const next = rStatus === 'none' ? null : rStatus;
    const { error: err } = await supabase
      .from('manuscripts')
      .update({
        expert_review_status: next,
        expert_review_feedback: rFeedback.trim() || null,
        expert_review_at: new Date().toISOString(),
      })
      .eq('id', reviewing.id);
    setSavingReview(false);
    if (err) {
      console.error(err);
      alert('Could not save the review.');
      return;
    }
    setItems((prev) =>
      prev.map((m) =>
        m.id === reviewing.id
          ? { ...m, expert_review_status: next, expert_review_feedback: rFeedback.trim() || null }
          : m
      )
    );
    setReviewing(null);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    const [m, a] = await Promise.all([
      supabase.from('manuscripts').select('*').order('created_at', { ascending: false }),
      supabase.rpc('admin_authors'),
    ]);
    if (m.error) {
      console.error(m.error, a.error);
      setError('Could not load manuscripts. Make sure the manuscripts SQL has been run.');
    } else {
      setItems((m.data as Manuscript[]) ?? []);
      const map: Record<string, Author> = {};
      ((a.data as Author[]) ?? []).forEach((au) => (map[au.id] = au));
      setAuthors(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const download = async (m: Manuscript) => {
    const { data, error: err } = await supabase.storage
      .from('manuscripts')
      .createSignedUrl(m.file_path, 120);
    if (err || !data) {
      alert('Could not generate download link.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const setStatus = async (id: string, status: string) => {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    const { error: err } = await supabase.from('manuscripts').update({ status }).eq('id', id);
    if (err) {
      console.error(err);
      alert('Could not update status.');
      load();
    }
  };

  const filtered = filterByRange(items, range, (m) => m.created_at);

  const columns: Column<Manuscript>[] = [
    { header: 'Date', value: (m) => fmt(m.created_at) },
    { header: 'Author', value: (m) => authors[m.user_id]?.full_name || '' },
    { header: 'Email', value: (m) => authors[m.user_id]?.email || '' },
    { header: 'Title', value: (m) => m.title },
    { header: 'Genre', value: (m) => m.genre || '' },
    { header: 'Word Count', value: (m) => m.word_count ?? '' },
    { header: 'File', value: (m) => m.file_name || '' },
    { header: 'Status', value: (m) => STATUS_LABEL[m.status] ?? m.status },
  ];

  if (loading) return <div className="text-center text-gray-500 py-16">Loading manuscripts…</div>;
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
          {filtered.length} {filtered.length === 1 ? 'manuscript' : 'manuscripts'}
          {(range.from || range.to) && <span className="text-gray-400"> in range</span>}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter range={range} onChange={setRange} />
          <ExportMenu baseName="manuscripts" title="Manuscripts" columns={columns} rows={filtered} />
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
          {items.length === 0 ? 'No manuscripts submitted yet.' : 'No manuscripts in the selected date range.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Genre</th>
                <th className="px-4 py-3 font-semibold">Words</th>
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Expert Review</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const au = authors[m.user_id];
                return (
                  <tr key={m.id} className="border-b last:border-0 align-top hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(m.created_at)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {au ? (
                        <>
                          <div className="font-medium text-gray-900">{au.full_name || '—'}</div>
                          <a href={`mailto:${au.email}`} className="text-amber-700 hover:underline">
                            {au.email}
                          </a>
                        </>
                      ) : (
                        <span className="text-gray-400">unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.title}</td>
                    <td className="px-4 py-3 text-gray-600">{m.genre || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {m.word_count != null ? m.word_count.toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[12rem] truncate">
                      {m.file_name || '—'} <span className="text-gray-400">{kb(m.file_size)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={m.status}
                        onChange={(e) => setStatus(m.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:border-amber-500 outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openReview(m)}
                        className="flex items-center gap-1.5"
                        title="Manage expert review"
                      >
                        {m.expert_review_status ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${REVIEW_BADGE[m.expert_review_status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {m.expert_review_status.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500 hover:text-amber-700 text-sm">
                            <UserCheck className="w-4 h-4" /> Review
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => download(m)}
                        className="flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Expert review editor */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReviewing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Expert Editorial Review</h3>
                <p className="text-sm text-gray-500">{reviewing.title}</p>
              </div>
              <button onClick={() => setReviewing(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
            <select
              value={rStatus}
              onChange={(e) => setRStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 outline-none mb-4 capitalize"
            >
              {REVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'none' ? 'No review' : s.replace('_', ' ')}
                </option>
              ))}
            </select>

            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Feedback to author {(rStatus === 'completed' || rStatus === 'changes_requested') && <span className="text-gray-400">(shown to the author)</span>}
            </label>
            <textarea
              value={rFeedback}
              onChange={(e) => setRFeedback(e.target.value)}
              rows={6}
              placeholder="Editorial feedback, suggested changes, next steps…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 outline-none resize-y mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReviewing(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveReview}
                disabled={savingReview}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
              >
                {savingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save review
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
