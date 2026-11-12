import { useState } from 'react';
import { CheckCircle, Loader2, Send, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useContent } from '../content/ContentProvider';
import { track } from '../lib/track';

// Free manuscript assessment — no account needed. The visitor sends a sample
// chapter (private bucket, admin-only read) and a lead row is created, which
// emails the team via the notify-lead webhook.
const ACCEPT = '.pdf,.doc,.docx,.rtf,.txt';
const MAX_MB = 10;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function FreeAssessment() {
  const { manuscript: m } = useContent();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [hp, setHp] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const field =
    'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none bg-white';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp.trim()) {
      setDone(true);
      return;
    }
    if (!name.trim()) return setError('Please enter your name.');
    if (!EMAIL_RE.test(email.trim())) return setError('Please enter a valid email.');
    if (!file) return setError('Please attach a sample chapter (PDF or Word).');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`The file must be under ${MAX_MB} MB — one or two chapters is plenty.`);

    setBusy(true);
    setError('');
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `incoming/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const up = await supabase.storage
      .from('sample-chapters')
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (up.error) {
      console.error(up.error);
      setBusy(false);
      return setError('Could not upload the file. Please use a PDF or Word file under 10 MB, or email it to us.');
    }

    const { error: err } = await supabase.from('publishing_leads').insert([
      {
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        manuscript_title: title.trim() || null,
        genre: genre.trim() || null,
        manuscript_status: 'sample chapter',
        preferred_plan: '',
        message: `Free manuscript assessment request — sample file: ${file.name}`,
        sample_path: path,
      },
    ]);
    setBusy(false);
    if (err) {
      console.error(err);
      return setError('Could not send your request. Please try again, or email us directly.');
    }
    track('click_event', { label: 'free_assessment_submit' });
    setDone(true);
  };

  if (done) {
    return (
      <div className="bg-white border border-green-200 rounded-3xl p-8 text-center h-full flex flex-col items-center justify-center">
        <CheckCircle className="w-14 h-14 text-green-600 mb-3" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Sample received</h3>
        <p className="text-gray-600 max-w-sm">{m.assessSuccess}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-sm h-full">
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{m.assessTitle}</h3>
      <p className="text-gray-600 text-sm mb-5">{m.assessText}</p>

      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <input className={field} placeholder="Your name *" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={field} type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={field} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={field} placeholder="Genre (optional)" value={genre} onChange={(e) => setGenre(e.target.value)} />
        <input
          className={`${field} sm:col-span-2`}
          placeholder="Working title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <label className="mt-3 flex items-center gap-3 border-2 border-dashed border-amber-300 rounded-xl px-4 py-3 cursor-pointer hover:bg-amber-50 transition-colors">
        <Upload className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <span className="text-sm text-gray-700 truncate">
          {file ? file.name : `Attach a sample chapter — PDF or Word, up to ${MAX_MB} MB`}
        </span>
        <input
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError('');
          }}
        />
      </label>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-800 text-white px-6 py-3 rounded-full font-semibold hover:from-amber-700 hover:to-amber-900 transition-all disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        {m.assessCta}
      </button>
      <p className="text-xs text-gray-400 mt-3 text-center">
        Your file is stored privately and only read by our editorial team.
      </p>
    </form>
  );
}
