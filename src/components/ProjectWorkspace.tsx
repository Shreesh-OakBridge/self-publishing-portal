import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Send, FileText, CheckCircle, RotateCcw, ExternalLink, Loader2, MessageSquare, Plus, Clock,
} from 'lucide-react';

interface Message {
  id: string;
  sender_role: 'author' | 'team';
  body: string;
  created_at: string;
}
interface Proof {
  id: string;
  title: string;
  note: string | null;
  file_url: string | null;
  status: 'pending' | 'approved' | 'changes_requested';
  author_comment: string | null;
  decided_at: string | null;
  created_at: string;
}

const when = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const proofBadge = (s: Proof['status']) =>
  s === 'approved'
    ? 'bg-green-100 text-green-800'
    : s === 'changes_requested'
    ? 'bg-amber-100 text-amber-800'
    : 'bg-gray-100 text-gray-600';
const proofLabel = (s: Proof['status']) =>
  s === 'approved' ? 'Approved' : s === 'changes_requested' ? 'Changes requested' : 'Awaiting your review';

// Per-project collaboration. Role-aware: pass the website client + role="author",
// or the admin client + role="team". RLS enforces who can do what.
export default function ProjectWorkspace({
  orderId,
  client,
  role,
}: {
  orderId: string;
  client: SupabaseClient;
  role: 'author' | 'team';
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  // team proof composer
  const [pTitle, setPTitle] = useState('');
  const [pNote, setPNote] = useState('');
  const [pUrl, setPUrl] = useState('');
  const [pFile, setPFile] = useState<File | null>(null);
  const [addingProof, setAddingProof] = useState(false);

  // author "request changes" inline box
  const [changingId, setChangingId] = useState<string | null>(null);
  const [changeText, setChangeText] = useState('');

  const load = async () => {
    const [m, p] = await Promise.all([
      client.from('project_messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
      client.from('project_proofs').select('*').eq('order_id', orderId).order('created_at', { ascending: false }),
    ]);
    setMessages((m.data as Message[]) ?? []);
    setProofs((p.data as Proof[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    const { error } = await client
      .from('project_messages')
      .insert({ order_id: orderId, sender_role: role, body: body.trim() });
    setSending(false);
    if (error) {
      console.error(error);
      alert('Could not send message.');
      return;
    }
    setBody('');
    load();
  };

  const addProof = async () => {
    if (!pTitle.trim()) return;
    setAddingProof(true);
    let fileUrl: string | null = pUrl.trim() || null;
    if (pFile) {
      const safe = pFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${orderId}/${Date.now()}-${safe}`;
      const up = await client.storage.from('proofs').upload(path, pFile, { upsert: false });
      if (up.error) {
        setAddingProof(false);
        console.error(up.error);
        alert('File upload failed: ' + up.error.message);
        return;
      }
      fileUrl = client.storage.from('proofs').getPublicUrl(path).data.publicUrl;
    }
    const { error } = await client.from('project_proofs').insert({
      order_id: orderId,
      title: pTitle.trim(),
      note: pNote.trim() || null,
      file_url: fileUrl,
    });
    setAddingProof(false);
    if (error) {
      console.error(error);
      alert('Could not add proof.');
      return;
    }
    setPTitle('');
    setPNote('');
    setPUrl('');
    setPFile(null);
    load();
  };

  const decide = async (id: string, status: Proof['status'], comment?: string) => {
    const { error } = await client
      .from('project_proofs')
      .update({ status, author_comment: comment || null, decided_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error(error);
      alert('Could not save your decision.');
      return;
    }
    setChangingId(null);
    setChangeText('');
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading workspace…
      </div>
    );
  }

  const input =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none';

  return (
    <div className="space-y-8">
      {/* ── Proofs ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-gray-900">Design proofs &amp; approvals</h3>
        </div>

        {role === 'team' && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 mb-4 space-y-2">
            <p className="text-sm font-semibold text-gray-800">Share a proof for approval</p>
            <input className={input} placeholder="Proof title (e.g. Cover design v1)" value={pTitle} onChange={(e) => setPTitle(e.target.value)} />
            <input className={input} placeholder="Link to file (PDF / image URL) — optional" value={pUrl} onChange={(e) => setPUrl(e.target.value)} />
            <div className="flex items-center gap-2">
              <input
                type="file"
                onChange={(e) => setPFile(e.target.files?.[0] ?? null)}
                className="text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-800 file:text-sm file:font-semibold"
              />
              {pFile && (
                <button onClick={() => setPFile(null)} className="text-xs text-gray-500 hover:text-gray-700">
                  clear
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">Paste a link or upload a file (PDF/image). Uploads are stored securely.</p>
            <textarea className={input} rows={2} placeholder="Note for the author — optional" value={pNote} onChange={(e) => setPNote(e.target.value)} />
            <button
              onClick={addProof}
              disabled={addingProof || !pTitle.trim()}
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {addingProof ? 'Adding…' : 'Add proof'}
            </button>
          </div>
        )}

        {proofs.length === 0 ? (
          <p className="text-gray-500 text-sm bg-white border rounded-2xl p-4">
            {role === 'team' ? 'No proofs shared yet.' : 'No proofs to review yet — we’ll post them here when they’re ready.'}
          </p>
        ) : (
          <div className="space-y-3">
            {proofs.map((p) => (
              <div key={p.id} className="bg-white border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{p.title}</p>
                    {p.note && <p className="text-sm text-gray-600 mt-0.5">{p.note}</p>}
                    {p.file_url && (
                      <a
                        href={p.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-700 text-sm font-medium mt-1 hover:underline"
                      >
                        View file <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${proofBadge(p.status)}`}>
                    {proofLabel(p.status)}
                  </span>
                </div>

                {p.author_comment && (
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">
                    <span className="font-semibold">Author note: </span>
                    {p.author_comment}
                  </p>
                )}

                {/* Author actions on a pending proof */}
                {role === 'author' && p.status === 'pending' && (
                  <div className="mt-3">
                    {changingId === p.id ? (
                      <div className="space-y-2">
                        <textarea
                          className={input}
                          rows={2}
                          placeholder="What would you like changed?"
                          value={changeText}
                          onChange={(e) => setChangeText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => decide(p.id, 'changes_requested', changeText)}
                            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700"
                          >
                            Submit request
                          </button>
                          <button onClick={() => setChangingId(null)} className="px-4 py-2 text-gray-600 text-sm">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => decide(p.id, 'approved')}
                          className="inline-flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setChangingId(p.id);
                            setChangeText('');
                          }}
                          className="inline-flex items-center gap-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
                        >
                          <RotateCcw className="w-4 h-4" /> Request changes
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {when(p.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Messages ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-gray-900">Messages</h3>
        </div>

        <div className="bg-white border rounded-2xl p-4 space-y-3 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No messages yet. Say hello — we usually reply within a working day.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_role === role;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <p className={`text-[10px] font-semibold mb-0.5 ${mine ? 'text-white/70' : 'text-gray-500'}`}>
                      {m.sender_role === 'team' ? 'Cursive team' : 'Author'} · {when(m.created_at)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-end gap-2 mt-3">
          <textarea
            className={`${input} resize-none`}
            rows={2}
            placeholder="Write a message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
            }}
          />
          <button
            onClick={send}
            disabled={sending || !body.trim()}
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Tip: press ⌘/Ctrl + Enter to send.</p>
      </section>
    </div>
  );
}
