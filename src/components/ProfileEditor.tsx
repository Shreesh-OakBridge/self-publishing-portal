import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

// Lets a logged-in author update their name + profile details. Stored in the
// Supabase user's metadata (auth.updateUser), so no extra table is needed and
// the change propagates to the session automatically.
export default function ProfileEditor({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const md = (user?.user_metadata ?? {}) as Record<string, string>;

  const [firstName, setFirstName] = useState(md.first_name ?? '');
  const [lastName, setLastName] = useState(md.last_name ?? '');
  const [bio, setBio] = useState(md.bio ?? '');
  const [bookScope, setBookScope] = useState(md.book_scope ?? '');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setStatus({ type: 'err', msg: 'First name is required.' });
      return;
    }
    setBusy(true);
    setStatus(null);
    const full_name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name,
        bio: bio.trim(),
        book_scope: bookScope.trim(),
      },
    });
    setBusy(false);
    if (error) {
      setStatus({ type: 'err', msg: error.message });
      return;
    }
    setStatus({ type: 'ok', msg: 'Profile updated.' });
    setTimeout(onDone, 600);
  };

  const inputClass =
    'w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all';

  return (
    <form onSubmit={save} className="bg-white rounded-2xl border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
        <button type="button" onClick={onDone} aria-label="Close" className="text-gray-400 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

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
            First Name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputClass} placeholder="Jane" />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Last Name</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Author" />
        </div>
      </div>

      <div>
        <label className="block text-gray-700 font-semibold mb-2">About You</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className={`${inputClass} resize-y`}
          placeholder="A short bio — who you are, your writing background…"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-semibold mb-2">About Your Book / Scope</label>
        <textarea
          value={bookScope}
          onChange={(e) => setBookScope(e.target.value)}
          rows={3}
          className={`${inputClass} resize-y`}
          placeholder="Genre, theme, approximate length, and what your book is about…"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save Profile'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
