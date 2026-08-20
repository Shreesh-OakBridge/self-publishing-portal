import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useContent } from '../content/ContentProvider';
import { go, withBase } from '../lib/basePath';

interface PostCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  author_name: string | null;
  published_at: string | null;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// Shared by the /blog page and the homepage teaser section.
// Pass `limit` + `teaser` for the homepage version.
export default function BlogList({ limit, teaser = false }: { limit?: number; teaser?: boolean }) {
  const { blog } = useContent();
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let q = supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, cover_url, author_name, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data } = await q;
      setPosts((data as PostCard[]) ?? []);
      setLoading(false);
    })();
  }, [limit]);

  // On the homepage, hide the whole section if there's nothing to show.
  if (teaser && !loading && posts.length === 0) return null;

  const Card = (p: PostCard) => (
    <button
      key={p.id}
      onClick={() => go(`/blog/${p.slug}`)}
      className="text-left bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-amber-300 transition-all group flex flex-col"
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden">
        {p.cover_url ? (
          <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <BookOpen className="w-10 h-10 text-amber-500/70" />
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs text-gray-400 flex items-center gap-1 mb-1.5">
          <Calendar className="w-3.5 h-3.5" /> {fmt(p.published_at)}
          {p.author_name ? <span className="text-gray-300"> · {p.author_name}</span> : null}
        </p>
        <h3 className="font-bold text-gray-900 leading-snug group-hover:text-amber-700 transition-colors">{p.title}</h3>
        {p.excerpt && <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-3">{p.excerpt}</p>}
        <span className="inline-flex items-center gap-1 text-amber-700 text-sm font-semibold mt-4">
          Read more <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </button>
  );

  return (
    <section id="blog" className="py-14 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{blog.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{blog.subheading}</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No posts yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{posts.map(Card)}</div>
        )}

        {teaser && posts.length > 0 && (
          <div className="text-center mt-10">
            <a
              href={withBase('/blog')}
              className="inline-flex items-center gap-2 border-2 border-amber-600 text-amber-700 px-6 py-3 rounded-full font-semibold hover:bg-amber-50 transition-colors"
            >
              View all posts <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
