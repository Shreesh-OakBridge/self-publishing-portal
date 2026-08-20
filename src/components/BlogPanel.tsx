import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, ArrowLeft, Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import MediaUploadField from './MediaUploadField';
import { withBase } from '../lib/basePath';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  author_name: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  updated_at: string | null;
  created_at: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const blank = (): Post => ({
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  body: '',
  cover_url: '',
  author_name: '',
  status: 'draft',
  published_at: null,
  updated_at: null,
  created_at: '',
});

export default function BlogPanel() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      console.error(err);
      setError('Could not load posts. Make sure the blog SQL has been run.');
    } else {
      setItems((data as Post[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setSlugTouched(false);
    setStatus(null);
    setEditing(blank());
  };
  const startEdit = (p: Post) => {
    setSlugTouched(true);
    setStatus(null);
    setEditing({ ...p });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setStatus({ type: 'err', msg: 'Please enter a title.' });
      return;
    }
    const slug = (editing.slug || slugify(editing.title)).trim();
    if (!slug) {
      setStatus({ type: 'err', msg: 'Please provide a URL slug.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    const now = new Date().toISOString();
    const payload = {
      slug,
      title: editing.title.trim(),
      excerpt: editing.excerpt?.trim() || null,
      body: editing.body || '',
      cover_url: editing.cover_url?.trim() || null,
      author_name: editing.author_name?.trim() || null,
      status: editing.status,
      // Stamp published_at the first time it goes live.
      published_at:
        editing.status === 'published' ? editing.published_at || now : editing.published_at,
      updated_at: now,
    };
    let err;
    if (editing.id) {
      ({ error: err } = await supabase.from('blog_posts').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('blog_posts').insert(payload));
    }
    setSaving(false);
    if (err) {
      console.error(err);
      setStatus({
        type: 'err',
        msg: /duplicate|unique/i.test(err.message) ? 'That URL slug is already used — pick another.' : 'Could not save the post.',
      });
      return;
    }
    setEditing(null);
    load();
  };

  const remove = async (p: Post) => {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    const { error: err } = await supabase.from('blog_posts').delete().eq('id', p.id);
    if (err) {
      setStatus({ type: 'err', msg: 'Could not delete the post.' });
      return;
    }
    load();
  };

  const field =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none';

  // ── Editor ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-gray-500 hover:text-amber-700 text-sm mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to posts
        </button>

        {status && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${status.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {status.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{status.msg}</span>
          </div>
        )}

        <div className="space-y-4 bg-white border rounded-2xl p-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
            <input
              className={field}
              value={editing.title}
              onChange={(e) => {
                const title = e.target.value;
                setEditing((p) => p && { ...p, title, slug: slugTouched ? p.slug : slugify(title) });
              }}
              placeholder="How to self-publish a book in India"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">URL slug</label>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-400">/blog/</span>
              <input
                className={field}
                value={editing.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setEditing((p) => p && { ...p, slug: slugify(e.target.value) });
                }}
                placeholder="how-to-self-publish-in-india"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Excerpt (shown on cards & meta)</label>
            <textarea
              className={field}
              rows={2}
              value={editing.excerpt ?? ''}
              onChange={(e) => setEditing((p) => p && { ...p, excerpt: e.target.value })}
              placeholder="A short one- or two-line summary."
            />
          </div>

          <MediaUploadField
            label="Cover image"
            accept="image"
            value={editing.cover_url ?? ''}
            onChange={(v) => setEditing((p) => p && { ...p, cover_url: v })}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Author name</label>
              <input
                className={field}
                value={editing.author_name ?? ''}
                onChange={(e) => setEditing((p) => p && { ...p, author_name: e.target.value })}
                placeholder="Cursive Team"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <select
                className={field}
                value={editing.status}
                onChange={(e) => setEditing((p) => p && { ...p, status: e.target.value as Post['status'] })}
              >
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (public)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Body</label>
            <textarea
              className={`${field} font-mono`}
              rows={16}
              value={editing.body}
              onChange={(e) => setEditing((p) => p && { ...p, body: e.target.value })}
              placeholder={'Write your post here.\n\n## A heading\n\nA paragraph with **bold**, *italic* and a [link](https://example.com).\n\n- A bullet\n- Another bullet'}
            />
            <p className="text-xs text-gray-400 mt-1">
              Formatting: <code># / ##</code> headings, <code>-</code> bullets, <code>**bold**</code>, <code>*italic*</code>, <code>[text](url)</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save post'}
            </button>
            <button onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-gray-600">
          {items.length} {items.length === 1 ? 'post' : 'posts'}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={startNew} className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700">
            <Plus className="w-4 h-4" /> New post
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading posts…</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border">No posts yet. Click “New post” to write your first article.</div>
      ) : (
        <div className="bg-white rounded-2xl border divide-y">
          {items.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{p.title || '(untitled)'}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400">/blog/{p.slug} · {p.status === 'published' ? `published ${fmt(p.published_at)}` : `created ${fmt(p.created_at)}`}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 text-gray-500">
                {p.status === 'published' && (
                  <a href={withBase(`/blog/${p.slug}`)} target="_blank" rel="noopener noreferrer" title="View" className="p-1.5 rounded-lg hover:bg-gray-100 hover:text-amber-700">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => startEdit(p)} title="Edit" className="p-1.5 rounded-lg hover:bg-gray-100 hover:text-amber-700">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => remove(p)} title="Delete" className="p-1.5 rounded-lg hover:bg-gray-100 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
