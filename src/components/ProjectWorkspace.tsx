import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Send, FileText, CheckCircle, RotateCcw, ExternalLink, Loader2, MessageSquare, Plus, Clock, RefreshCw,
  Paperclip, Trash2, StickyNote, X, AlertCircle,
} from 'lucide-react';
import { proofStoragePath, isExternalProofUrl } from '../lib/proofUrl';

interface Message {
  id: string;
  sender_role: 'author' | 'team';
  body: string;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
}
interface Note {
  id: string;
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
  const [notes, setNotes] = useState<Note[]>([]);
  // Short-lived signed URLs for private files, keyed by proof id / message id.
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [msgUrls, setMsgUrls] = useState<Record<string, string>>({});
  // True once a signing pass has completed, so we can distinguish "still
  // preparing" from "file couldn't be loaded" rather than spinning forever.
  const [filesResolved, setFilesResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [body, setBody] = useState('');
  const [msgFile, setMsgFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Inline status (replaces jarring alert() popups).
  const [notice, setNotice] = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);
  const flash = (type: 'err' | 'ok', msg: string) => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 4500);
  };

  // team proof composer
  const [pTitle, setPTitle] = useState('');
  const [pNote, setPNote] = useState('');
  const [pUrl, setPUrl] = useState('');
  const [pFile, setPFile] = useState<File | null>(null);
  const [addingProof, setAddingProof] = useState(false);

  // team-only private notes composer
  const [noteBody, setNoteBody] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // author "request changes" inline box
  const [changingId, setChangingId] = useState<string | null>(null);
  const [changeText, setChangeText] = useState('');

  const load = async () => {
    const [m, p] = await Promise.all([
      client.from('project_messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
      client.from('project_proofs').select('*').eq('order_id', orderId).order('created_at', { ascending: false }),
    ]);
    const proofRows = (p.data as Proof[]) ?? [];
    const msgRows = (m.data as Message[]) ?? [];
    setMessages(msgRows);
    setProofs(proofRows);
    setLoading(false);
    // Team-only private notes (RLS returns nothing to authors; only fetch for team).
    if (role === 'team') {
      const { data: n } = await client
        .from('project_notes')
        .select('id, body, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      setNotes((n as Note[]) ?? []);
    }
    // Mint signed URLs for proofs that live in our private storage bucket.
    const map: Record<string, string> = {};
    await Promise.all(
      proofRows.map(async (pr) => {
        const path = proofStoragePath(pr.file_url);
        if (!path) return;
        const { data } = await client.storage.from('proofs').createSignedUrl(path, 3600);
        if (data?.signedUrl) map[pr.id] = data.signedUrl;
      }),
    );
    setSignedUrls(map);
    // Sign message attachments (stored as bare paths in workspace-files).
    const mmap: Record<string, string> = {};
    await Promise.all(
      msgRows.map(async (msg) => {
        if (!msg.attachment_url) return;
        const { data } = await client.storage.from('workspace-files').createSignedUrl(msg.attachment_url, 3600);
        if (data?.signedUrl) mmap[msg.id] = data.signedUrl;
      }),
    );
    setMsgUrls(mmap);
    setFilesResolved(true);
    // Opening/viewing the workspace clears unread for this side.
    void client.rpc('mark_workspace_seen', { p_order: orderId });
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    // Live updates: react to new messages/proofs from the other party without a
    // manual reload. A slow poll is kept as a safety net in case realtime isn't
    // enabled on the project.
    const channel = client
      .channel(`workspace-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_messages', filter: `order_id=eq.${orderId}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_proofs', filter: `order_id=eq.${orderId}` },
        () => load(),
      )
      .subscribe();
    const poll = setInterval(() => load(), 30000);
    return () => {
      clearInterval(poll);
      client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const send = async () => {
    if (!body.trim() && !msgFile) return;
    setSending(true);
    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    if (msgFile) {
      const safe = msgFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${orderId}/${Date.now()}-${safe}`;
      const up = await client.storage.from('workspace-files').upload(path, msgFile, { upsert: false });
      if (up.error) {
        setSending(false);
        console.error(up.error);
        flash('err', 'File upload failed: ' + up.error.message);
        return;
      }
      attachmentUrl = path;
      attachmentName = msgFile.name;
    }
    const { error } = await client.from('project_messages').insert({
      order_id: orderId,
      sender_role: role,
      body: body.trim() || (attachmentName ? `Shared a file: ${attachmentName}` : ''),
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    });
    setSending(false);
    if (error) {
      console.error(error);
      flash('err', 'Could not send message.');
      return;
    }
    setBody('');
    setMsgFile(null);
    if (fileRef.current) fileRef.current.value = '';
    load();
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm('Delete this message for everyone? This cannot be undone.')) return;
    const { error } = await client.from('project_messages').delete().eq('id', id);
    if (error) {
      console.error(error);
      flash('err', 'Could not delete the message.');
      return;
    }
    load();
  };

  const deleteProof = async (id: string) => {
    if (!window.confirm('Withdraw this proof? The author will no longer see it.')) return;
    const { error } = await client.from('project_proofs').delete().eq('id', id);
    if (error) {
      console.error(error);
      flash('err', 'Could not withdraw the proof.');
      return;
    }
    load();
  };

  const addNote = async () => {
    if (!noteBody.trim()) return;
    setAddingNote(true);
    const { error } = await client.from('project_notes').insert({ order_id: orderId, body: noteBody.trim() });
    setAddingNote(false);
    if (error) {
      console.error(error);
      flash('err', 'Could not save the note.');
      return;
    }
    setNoteBody('');
    load();
  };

  const deleteNote = async (id: string) => {
    const { error } = await client.from('project_notes').delete().eq('id', id);
    if (error) {
      console.error(error);
      flash('err', 'Could not delete the note.');
      return;
    }
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
      // Store the object path; the private file is opened via signed URLs on read.
      fileUrl = path;
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
      flash('err', 'Could not add proof.');
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
      flash('err', 'Could not save your decision.');
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
      {notice && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            notice.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {notice.type === 'ok' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{notice.msg}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Updates appear live. Last checked just now.</p>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

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
                    {(() => {
                      const linkUrl = signedUrls[p.id] || (isExternalProofUrl(p.file_url) ? p.file_url : null);
                      return linkUrl ? (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-amber-700 text-sm font-medium mt-1 hover:underline"
                        >
                          View file <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : p.file_url ? (
                        filesResolved ? (
                          <span className="text-gray-400 text-sm mt-1">File unavailable</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400 text-sm mt-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing file…
                          </span>
                        )
                      ) : null;
                    })()}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${proofBadge(p.status)}`}>
                      {proofLabel(p.status)}
                    </span>
                    {role === 'team' && (
                      <button
                        onClick={() => deleteProof(p.id)}
                        title="Withdraw proof"
                        className="text-gray-300 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
              const attUrl = msgUrls[m.id];
              return (
                <div key={m.id} className={`group flex items-center gap-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {role === 'team' && mine && (
                    <button
                      onClick={() => deleteMessage(m.id)}
                      title="Delete message"
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-600 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <p className={`text-[10px] font-semibold mb-0.5 ${mine ? 'text-white/70' : 'text-gray-500'}`}>
                      {m.sender_role === 'team' ? 'Cursive team' : 'Author'} · {when(m.created_at)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                    {m.attachment_url && (
                      attUrl ? (
                        <a
                          href={attUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-xs font-medium mt-1.5 underline ${mine ? 'text-white' : 'text-amber-700'}`}
                        >
                          <Paperclip className="w-3.5 h-3.5" /> {m.attachment_name || 'Attachment'}
                        </a>
                      ) : filesResolved ? (
                        <span className={`inline-flex items-center gap-1 text-xs mt-1.5 ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                          <Paperclip className="w-3 h-3" /> {m.attachment_name || 'file'} (unavailable)
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs mt-1.5 ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                          <Loader2 className="w-3 h-3 animate-spin" /> {m.attachment_name || 'file'}
                        </span>
                      )
                    )}
                  </div>
                  {role === 'team' && !mine && (
                    <button
                      onClick={() => deleteMessage(m.id)}
                      title="Delete message"
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-600 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
            onClick={() => fileRef.current?.click()}
            title="Attach a file"
            className="p-3 rounded-xl border border-gray-300 text-gray-500 hover:bg-gray-50 flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => setMsgFile(e.target.files?.[0] ?? null)} />
          <button
            onClick={send}
            disabled={sending || (!body.trim() && !msgFile)}
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
          </button>
        </div>
        {msgFile && (
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
            <Paperclip className="w-3 h-3" /> {msgFile.name}
            <button
              onClick={() => {
                setMsgFile(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="ml-1 text-gray-400 hover:text-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">Tip: press ⌘/Ctrl + Enter to send. You can attach a file too.</p>
      </section>

      {/* ── Team-only private notes ── */}
      {role === 'team' && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-gray-900">Team notes</h3>
            <span className="text-xs text-gray-400">(private — the author never sees these)</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-end gap-2">
              <textarea
                className={`${input} resize-none bg-white`}
                rows={2}
                placeholder="Add an internal note about this project…"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
              />
              <button
                onClick={addNote}
                disabled={addingNote || !noteBody.trim()}
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 flex-shrink-0"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {notes.length > 0 && (
              <div className="mt-3 space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="flex items-start justify-between gap-2 bg-white border border-amber-100 rounded-lg p-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{when(n.created_at)}</p>
                    </div>
                    <button onClick={() => deleteNote(n.id)} title="Delete note" className="text-gray-300 hover:text-red-600 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
