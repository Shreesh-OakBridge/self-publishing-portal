import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExportMenu from './ExportMenu';
import type { Column } from '../lib/exporters';
import DateRangeFilter, { DateRange, emptyRange, filterByRange } from './DateRangeFilter';

interface LogRow {
  id: string;
  created_at: string;
  actor_email: string | null;
  action: string;
  entity: string | null;
  metadata: Record<string, unknown> | null;
}

const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'Logged in',
  'auth.logout': 'Logged out',
  'user.signup': 'Signed up',
  'profile.updated': 'Updated profile',
  'lead.created': 'Submitted enquiry',
  'customization.saved': 'Saved customization',
  'calculation.saved': 'Saved royalty calc',
  'content.insert': 'Edited site content',
  'content.update': 'Edited site content',
};

const ACTION_COLOR: Record<string, string> = {
  'auth.login': 'bg-blue-100 text-blue-800',
  'auth.logout': 'bg-gray-100 text-gray-700',
  'user.signup': 'bg-green-100 text-green-800',
  'profile.updated': 'bg-purple-100 text-purple-800',
  'lead.created': 'bg-amber-100 text-amber-800',
  'customization.saved': 'bg-rose-100 text-rose-800',
  'calculation.saved': 'bg-teal-100 text-teal-800',
  'content.insert': 'bg-indigo-100 text-indigo-800',
  'content.update': 'bg-indigo-100 text-indigo-800',
};

const fmt = (d: string) =>
  new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const summarize = (m: Record<string, unknown> | null) => {
  if (!m || Object.keys(m).length === 0) return '';
  return Object.entries(m)
    .filter(([, v]) => v !== null && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
};

export default function ActivityPanel() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<DateRange>(emptyRange);

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (err) {
      console.error(err);
      setError('Could not load activity. Make sure the activity_log SQL has been run.');
    } else {
      setRows((data as LogRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = filterByRange(rows, range, (r) => r.created_at);

  const columns: Column<LogRow>[] = [
    { header: 'When', value: (r) => fmt(r.created_at) },
    { header: 'Who', value: (r) => r.actor_email || 'Guest' },
    { header: 'Action', value: (r) => ACTION_LABELS[r.action] ?? r.action },
    { header: 'Entity', value: (r) => r.entity || '' },
    { header: 'Details', value: (r) => summarize(r.metadata) },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-gray-600">
          {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
          {range.from || range.to ? ' in range' : ' (latest 500)'}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter range={range} onChange={setRange} />
          <ExportMenu baseName="activity_log" title="Activity Log" columns={columns} rows={filtered} />
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl mb-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && rows.length === 0 ? (
        <div className="text-center text-gray-500 py-16">Loading activity…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border">
          {rows.length === 0 ? 'No activity recorded yet.' : 'No activity in the selected date range.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Who</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-0 align-top hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{fmt(r.created_at)}</td>
                  <td className="px-4 py-3 text-gray-700">{r.actor_email || 'Guest'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        ACTION_COLOR[r.action] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ACTION_LABELS[r.action] ?? r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-md">
                    {[r.entity, summarize(r.metadata)].filter(Boolean).join(' · ') || '—'}
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
