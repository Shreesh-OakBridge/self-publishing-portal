import { useEffect, useState } from 'react';
import { RefreshCw, X, MessagesSquare, FileCheck, AlertCircle, Inbox } from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import ProjectWorkspace from './ProjectWorkspace';

interface QueueRow {
  order_id: string;
  ship_name: string | null;
  plan: string | null;
  invoice_number: string | null;
  last_activity_at: string;
  unread_msgs: number;
  pending_decisions: number;
}

const fmt = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// Admin triage: every order with workspace activity, "awaiting us" first.
export default function WorkspaceQueue() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [awaitingOnly, setAwaitingOnly] = useState(false);
  const [open, setOpen] = useState<QueueRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.rpc('admin_workspace_queue');
    if (err) {
      console.error(err);
      setError('Could not load the workspace queue. Make sure the latest SQL has been run.');
    } else {
      const list = ((data as QueueRow[]) ?? []).map((r) => ({
        ...r,
        unread_msgs: Number(r.unread_msgs) || 0,
        pending_decisions: Number(r.pending_decisions) || 0,
      }));
      // Awaiting-us first, then most recent activity.
      list.sort((a, b) => {
        const aw = (a.unread_msgs + a.pending_decisions > 0 ? 1 : 0) - (b.unread_msgs + b.pending_decisions > 0 ? 1 : 0);
        if (aw) return -aw;
        return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
      });
      setRows(list);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const awaiting = (r: QueueRow) => r.unread_msgs + r.pending_decisions > 0;
  const shown = awaitingOnly ? rows.filter(awaiting) : rows;
  const awaitingCount = rows.filter(awaiting).length;

  if (loading) return <div className="text-center text-gray-500 py-16">Loading workspace queue…</div>;
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
          {awaitingCount > 0 ? (
            <>
              <span className="font-semibold text-amber-700">{awaitingCount}</span> awaiting your reply
              <span className="text-gray-400"> · {rows.length} active</span>
            </>
          ) : (
            <>All caught up · {rows.length} active {rows.length === 1 ? 'project' : 'projects'}</>
          )}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={awaitingOnly}
              onChange={(e) => setAwaitingOnly(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            Awaiting us only
          </label>
          <button
            onClick={load}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border">
          <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          {rows.length === 0 ? 'No project activity yet.' : 'Nothing waiting on you right now.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border divide-y">
          {shown.map((r) => (
            <button
              key={r.order_id}
              onClick={() => setOpen(r)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {r.ship_name || r.invoice_number || r.order_id.slice(0, 8)}
                  {r.plan ? <span className="text-gray-400 font-normal"> · {r.plan}</span> : null}
                </p>
                <p className="text-xs text-gray-400">Last activity {fmt(r.last_activity_at)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.unread_msgs > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full">
                    <MessagesSquare className="w-3.5 h-3.5" /> {r.unread_msgs}
                  </span>
                )}
                {r.pending_decisions > 0 && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                    <FileCheck className="w-3.5 h-3.5" /> {r.pending_decisions}
                  </span>
                )}
                {!awaiting(r) && <span className="text-xs text-gray-400">up to date</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            setOpen(null);
            load();
          }}
        >
          <div className="bg-gray-50 rounded-2xl shadow-xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-white rounded-t-2xl sticky top-0">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-400">Project workspace</p>
                <p className="font-bold text-gray-900 truncate">
                  {open.ship_name || open.invoice_number || open.order_id.slice(0, 8)}
                  {open.plan ? ` · ${open.plan}` : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setOpen(null);
                  load();
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <ProjectWorkspace orderId={open.order_id} client={supabase} role="team" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
