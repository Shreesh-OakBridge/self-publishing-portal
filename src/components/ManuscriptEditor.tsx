import { useEffect, useState } from 'react';
import { ArrowLeft, Save, FileDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

const countWords = (t: string) => t.trim().match(/\S+/g)?.length ?? 0;

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  accepted: 'Accepted',
  changes_requested: 'Changes Requested',
};

interface ManuscriptRow {
  id: string;
  title: string;
  genre: string | null;
  file_path: string | null;
  file_name: string | null;
  content: string | null;
  word_count: number | null;
  status: string;
}

export default function ManuscriptEditor() {
  const { user, loading } = useAuth();
  const [row, setRow] = useState<ManuscriptRow | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const id = new URLSearchParams(window.location.search).get('id');

  useEffect(() => {
    if (!loading && !user) window.location.href = '/login';
  }, [loading, user]);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data, error } = await supabase
        .from('manuscripts')
        .select('id, title, genre, file_path, file_name, content, word_count, status')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setRow(data as ManuscriptRow);
        setTitle(data.title);
        setContent(data.content ?? '');
      }
      setLoadingDoc(false);
    })();
  }, [user, id]);

  const save = async () => {
    if (!row) return;
    setSaving(true);
    setStatus(null);
    const { error } = await supabase
      .from('manuscripts')
      .update({ title: title.trim() || row.title, content, word_count: countWords(content) })
      .eq('id', row.id);
    setSaving(false);
    setStatus(
      error
        ? { type: 'err', msg: 'Could not save. Please try again.' }
        : { type: 'ok', msg: 'Saved.' }
    );
  };

  const importFromFile = async () => {
    if (!row?.file_path) return;
    const ext = (row.file_name || row.file_path).split('.').pop()?.toLowerCase() || '';
    setImporting(true);
    setStatus(null);
    try {
      const { data, error } = await supabase.storage.from('manuscripts').download(row.file_path);
      if (error || !data) throw error || new Error('download failed');
      let text = '';
      if (ext === 'docx') {
        const ab = await data.arrayBuffer();
        const mod: any = await import('mammoth');
        const mammoth = mod.default ?? mod;
        const res = await mammoth.extractRawText({ arrayBuffer: ab });
        text = res.value || '';
      } else if (['txt', 'md', 'rtf', 'csv'].includes(ext)) {
        text = await data.text();
      } else {
        setStatus({ type: 'err', msg: `Can't import text from a .${ext} file — only Word or text files.` });
        setImporting(false);
        return;
      }
      setContent(text);
      setStatus({ type: 'ok', msg: 'Imported from your uploaded file. Review the text, then Save.' });
    } catch (err) {
      console.error('import failed:', err);
      setStatus({ type: 'err', msg: 'Could not import from the uploaded file.' });
    } finally {
      setImporting(false);
    }
  };

  if (loading || loadingDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Loading…
      </div>
    );
  }

  if (notFound || !row) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl border p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Manuscript not found</h1>
          <p className="text-gray-600 mb-6">It may have been removed, or you don’t have access to it.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => (window.location.href = '/account')}
            className="flex items-center space-x-2 text-gray-600 hover:text-amber-700 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">My Account</span>
          </button>
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
            {STATUS_LABEL[row.status] ?? row.status}
          </span>
          <button
            onClick={save}
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
          <p className="text-sm text-gray-500">{countWords(content).toLocaleString('en-IN')} words</p>
          {row.file_path && (
            <button
              onClick={importFromFile}
              disabled={importing}
              className="flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900 disabled:opacity-50"
              title="Load the text from your uploaded file into the editor"
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

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Your manuscript text will appear here. Use 'Import text from uploaded file' to pull in your document, or write/paste directly — then Save."
          className="w-full min-h-[65vh] bg-white border rounded-2xl p-6 text-gray-800 leading-relaxed outline-none focus:border-amber-400 resize-y font-serif"
        />

        <p className="text-xs text-gray-400 mt-3">
          Edits are saved to your manuscript record in the portal. (Rich formatting and export back
          to Word are planned for a future update.)
        </p>
      </main>
    </div>
  );
}
