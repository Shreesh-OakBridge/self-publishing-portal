import { useEffect, useState } from 'react';
import { ArrowLeft, Save, FileDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import RichTextEditor from './RichTextEditor';
import AuthModal from './AuthModal';

const countWords = (t: string) => t.trim().match(/\S+/g)?.length ?? 0;
const stripHtml = (html: string) => {
  if (!html) return '';
  return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
};

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  accepted: 'Accepted',
  changes_requested: 'Changes Requested',
};

interface ManuscriptRow {
  id: string;
  title: string;
  file_path: string | null;
  file_name: string | null;
  content: string | null;
  status: string;
}

export default function ManuscriptEditor() {
  const { user, loading } = useAuth();
  const id = new URLSearchParams(window.location.search).get('id');

  const [row, setRow] = useState<ManuscriptRow | null>(null);
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(!!id);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Existing manuscripts require login (they're private). The blank/new editor
  // (no id) is usable by anyone; we gate on Save instead.
  useEffect(() => {
    if (id && !loading && !user) window.location.href = '/login';
  }, [id, loading, user]);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from('manuscripts')
        .select('id, title, file_path, file_name, content, status')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setRow(data as ManuscriptRow);
        setTitle(data.title);
        setHtml(data.content ?? '');
        setText(stripHtml(data.content ?? ''));
      }
      setLoadingDoc(false);
    })();
  }, [id, user]);

  const doSave = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const u = sess.session?.user;
    if (!u) {
      setAuthOpen(true);
      return;
    }
    setSaving(true);
    setStatus(null);
    const wc = countWords(text);
    try {
      if (row) {
        const { error } = await supabase
          .from('manuscripts')
          .update({ title: title.trim() || row.title, content: html, word_count: wc })
          .eq('id', row.id);
        if (error) throw error;
        setStatus({ type: 'ok', msg: 'Saved.' });
      } else {
        const { data, error } = await supabase
          .from('manuscripts')
          .insert({
            user_id: u.id,
            title: title.trim() || 'Untitled manuscript',
            content: html,
            word_count: wc,
          })
          .select('id')
          .single();
        if (error) throw error;
        window.location.href = `/manuscript?id=${data.id}`;
      }
    } catch (err) {
      console.error('save failed:', err);
      setStatus({ type: 'err', msg: 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const importFromFile = async () => {
    if (!row?.file_path) return;
    const ext = (row.file_name || row.file_path).split('.').pop()?.toLowerCase() || '';
    setImporting(true);
    setStatus(null);
    try {
      const { data, error } = await supabase.storage.from('manuscripts').download(row.file_path);
      if (error || !data) throw error || new Error('download failed');
      if (ext === 'docx') {
        const ab = await data.arrayBuffer();
        const mod: any = await import('mammoth');
        const mammoth = mod.default ?? mod;
        const res = await mammoth.convertToHtml({ arrayBuffer: ab });
        setHtml(res.value || '');
      } else if (['txt', 'md', 'rtf', 'csv'].includes(ext)) {
        const raw = await data.text();
        setHtml(
          raw
            .split(/\n{2,}/)
            .map((p) => `<p>${p.replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</p>`)
            .join('')
        );
      } else {
        setStatus({ type: 'err', msg: `Can't import text from a .${ext} file — only Word or text files.` });
        setImporting(false);
        return;
      }
      setStatus({ type: 'ok', msg: 'Imported from your uploaded file. Review, then Save.' });
    } catch (err) {
      console.error('import failed:', err);
      setStatus({ type: 'err', msg: 'Could not import from the uploaded file.' });
    } finally {
      setImporting(false);
    }
  };

  if ((id && loading) || loadingDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Loading…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl border p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Manuscript not found</h1>
          <p className="text-gray-600 mb-6">It may have been removed, or you don’t have access.</p>
          <button
            onClick={() => (window.location.href = '/account')}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800"
          >
            Back to My Account
          </button>
        </div>
      </div>
    );
  }

  const backTo = user ? '/account' : '/';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => (window.location.href = backTo)}
            className="flex items-center space-x-2 text-gray-600 hover:text-amber-700 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{user ? 'My Account' : 'Home'}</span>
          </button>
          {row && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
              {STATUS_LABEL[row.status] ?? row.status}
            </span>
          )}
          <button
            onClick={doSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving…' : 'Save'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent focus:border-amber-400 outline-none mb-2 py-1"
          placeholder="Manuscript title"
        />

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{countWords(text).toLocaleString('en-IN')} words</p>
          {row?.file_path && (
            <button
              onClick={importFromFile}
              disabled={importing}
              className="flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900 disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span>Import text from uploaded file</span>
            </button>
          )}
        </div>

        {status && (
          <div
            className={`flex items-center space-x-2 p-3 rounded-xl mb-4 text-sm ${
              status.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {status.type === 'ok' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{status.msg}</span>
          </div>
        )}

        <RichTextEditor value={html} onChange={setHtml} onText={setText} />

        {!user && (
          <p className="text-xs text-gray-500 mt-3">
            You can write freely here — you’ll be asked to log in or sign up when you Save.
          </p>
        )}
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => doSave()}
        heading="Log in or sign up to save your manuscript"
      />
    </div>
  );
}
