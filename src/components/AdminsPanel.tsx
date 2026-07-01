import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, Plus, Trash2, ShieldCheck, Lock } from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';

interface AdminUser {
  email: string;
  full_name: string | null;
  role: 'owner' | 'admin' | 'editor';
  last_login_at: string | null;
  created_at: string;
}

const ROLES = ['owner', 'admin', 'editor'] as const;
const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-amber-100 text-amber-800',
  editor: 'bg-blue-100 text-blue-700',
};
const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminsPanel({ isOwner, currentEmail }: { isOwner: boolean; currentEmail: string }) {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // create form
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'editor'>('admin');

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.from('admin_users').select('*').order('created_at', { ascending: true });
    if (err) {
      console.error(err);
      setError('Could not load admins. Make sure the admin roles SQL has been run.');
    } else {
      setItems((data as AdminUser[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('admin_users').insert({
      email: email.trim().toLowerCase(),
      full_name: name.trim() || null,
      role,
    });
    setSaving(false);
    if (err) {
      setError(err.message.includes('duplicate') ? 'That email is already an admin.' : 'Could not add admin.');
      return;
    }
    setEmail('');
    setName('');
    setRole('admin');
    load();
  };

  const changeRole = async (a: AdminUser, newRole: string) => {
    setItems((prev) => prev.map((x) => (x.email === a.email ? { ...x, role: newRole as AdminUser['role'] } : x)));
    const { error: err } = await supabase.from('admin_users').update({ role: newRole }).eq('email', a.email);
    if (err) {
      console.error(err);
      alert('Could not update role.');
      load();
    }
  };

  const remove = async (a: AdminUser) => {
    if (a.email.toLowerCase() === currentEmail.toLowerCase()) {
      alert('You cannot remove your own admin access.');
      return;
    }
    if (a.role === 'owner' && items.filter((x) => x.role === 'owner').length <= 1) {
      alert('There must be at least one owner.');
      return;
    }
    if (!confirm(`Remove admin access for ${a.email}?`)) return;
    setItems((prev) => prev.filter((x) => x.email !== a.email));
    await supabase.from('admin_users').delete().eq('email', a.email);
  };

  const field = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none';

  return (
    <>
      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-xl mb-4 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isOwner && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 flex-shrink-0" />
          You can view the admin team, but only an owner can add, edit, or remove admins.
        </div>
      )}

      {isOwner && (
        <form onSubmit={create} className="bg-white rounded-2xl border p-5 mb-6">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-amber-600" /> Add an admin
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
              <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@oakbridge.in" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
              <select className={field} value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            The person must have (or create) a Cursive account with this email to gain access. Owner manages
            admins; editor is limited to leads and site content.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add admin'}
          </button>
        </form>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-600">{items.length} {items.length === 1 ? 'admin' : 'admins'}</p>
        <button onClick={load} className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading…</div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Last login</th>
                <th className="px-4 py-3 font-semibold">Added</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.email} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> {a.email}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{a.full_name || '—'}</td>
                  <td className="px-4 py-3">
                    {isOwner ? (
                      <select
                        value={a.role}
                        onChange={(e) => changeRole(a, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:border-amber-500 outline-none capitalize"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="capitalize">{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${ROLE_BADGE[a.role]}`}>{a.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(a.last_login_at)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(a.created_at)}</td>
                  <td className="px-4 py-3">
                    {isOwner && (
                      <button onClick={() => remove(a)} className="text-gray-400 hover:text-red-600" aria-label="Remove admin">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
