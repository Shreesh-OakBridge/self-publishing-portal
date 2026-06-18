import { useEffect, useState } from 'react';
import { FileText, UploadCloud, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

const BUCKET = 'manuscripts';
const ACCEPT = '.doc,.docx,.pdf,.rtf,.odt,.epub';

interface Manuscript {
  id: string;
  title: string;
  genre: string | null;
  file_name: string | null;
  word_count: number | null;
  status: string;
  created_at: string;
}

const countWords = (t: string) => t.trim().match(/\S+/g)?.length ?? 0;

const STATUS_COLOR: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-800',
  in_review: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  changes_requested: 'bg-rose-100 text-rose-800',
};
const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  accepted: 'Accepted',
  changes_requested: 'Changes Requested',
};
const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ManuscriptUpload({ hideHeading = false }: { hideHeading?: boolean }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Manuscript[]>([]);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Auto-detect word count: native for text files, mammoth for .docx.
  const handleFile = async (f: File | null) => {
    setFile(f);
    setWordCount(null);
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    setCounting(true);
    try {
      if (['txt', 'md', 'rtf', 'csv'].includes(ext)) {
        setWordCount(countWords(await f.text()));
      } else if (ext === 'docx') {
        const arrayBuffer = await f.arrayBuffer();
        const mod: any = await import('mammoth');
        const mammoth = mod.default ?? mod;
        const res = await mammoth.extractRawText({ arrayBuffer });
        setWordCount(countWords(res.value || ''));
      } else {
        setWordCount(null); // pdf/doc/odt/epub — author enters manually
      }
    } catch (err) {
      console.error('word count failed:', err);
      setWordCount(null);
    } finally {
      setCounting(false);
    }
  };

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('manuscripts')
      .select('id, title, genre, file_name, word_count, status, created_at')
      .order('created_at', { ascending: false });
    setItems((data as Manuscript[]) ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !user) return;
    if (!title.trim()) {
      setStatus({ type: 'err', msg: 'Please enter a title.' });
      return;
    }
    if (!file) {
      setStatus({ type: 'err', msg: 'Please choose a manuscript file.' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || 'application/octet-stream' });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from('manuscripts').insert({
        user_id: user.id,
        title: title.trim(),
        genre: genre.trim() || null,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        word_count: wordCount,
      });
      if (insErr) throw insErr;

      setStatus({ type: 'ok', msg: 'Manuscript submitted. Our team will review it shortly.' });
      setTitle('');
      setGenre('');
      setFile(null);
      setWordCount(null);
      load();
    } catch (err) {
      console.error('Manuscript upload failed:', err);
      setStatus({
        type: 'err',
        msg: err instanceof Error ? err.message : 'Upload failed. Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all';

  return (
    <section>
      {!hideHeading && (
        <div className="flex items-center space-x-2 mb-3">
          <FileText className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">My Manuscripts</h2>
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-2xl border p-6 space-y-4 mb-4">
        <p className="text-sm text-gray-600">
          Upload your manuscript to start the publishing process. Your file is private and only
          visible to you and our team.
        </p>

        {status && (
          <div
            className={`flex items-center space-x-2 p-3 rounded-xl text-sm ${
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

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
              placeholder="Your book's working title"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Genre</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className={inputClass}
              placeholder="e.g. Fiction, Memoir, Poetry"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Manuscript file</label>
          <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-amber-400">
            <UploadCloud className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">
              {file ? file.name : 'Choose a file (DOC, DOCX, PDF, RTF, ODT, EPUB)'}
            </span>
            <input
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Word count{' '}
            {counting && <span className="text-sm font-normal text-gray-400">(detecting…)</span>}
          </label>
          <input
            type="number"
            min="0"
            value={wordCount ?? ''}
            onChange={(e) => setWordCount(e.target.value ? parseInt(e.target.value, 10) : null)}
            className={inputClass}
            placeholder="Auto-detected for Word/text files — or enter manually"
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-detected for .docx and text files. For PDF/other formats, please enter the
            approximate word count — it helps us quote accurately.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          <span>{busy ? 'Uploading…' : 'Submit Manuscript'}</span>
        </button>
      </form>

      {items.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Genre</th>
                <th className="px-4 py-3 font-semibold">Words</th>
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(m.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.title}</td>
                  <td className="px-4 py-3 text-gray-600">{m.genre || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {m.word_count != null ? m.word_count.toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[14rem] truncate">{m.file_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        STATUS_COLOR[m.status] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
