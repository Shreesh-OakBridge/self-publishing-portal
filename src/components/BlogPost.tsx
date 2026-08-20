import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { go, withBase } from '../lib/basePath';
import { renderMarkdown } from '../lib/richtext';
import { SITE_URL, SITE_NAME } from '../lib/seo';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  author_name: string | null;
  status: string;
  published_at: string | null;
  updated_at: string | null;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export default function BlogPost({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).maybeSingle();
      setPost((data as Post) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  // Own the document head for this post (useSeo skips /blog/ paths).
  useEffect(() => {
    if (!post) return;
    const url = `${SITE_URL}/blog/${post.slug}`;
    document.title = `${post.title} — ${SITE_NAME}`;
    const setMeta = (attr: 'name' | 'property', k: string, v: string) => {
      let el = document.head.querySelector(`meta[${attr}="${k}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, k);
        document.head.appendChild(el);
      }
      el.setAttribute('content', v);
    };
    const desc = post.excerpt || post.body.slice(0, 155);
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', post.title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', 'article');
    setMeta('property', 'og:url', url);
    if (post.cover_url) setMeta('property', 'og:image', post.cover_url);
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }, [post]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!post) {
    return (
      <section className="py-20 px-4 text-center max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Post not found</h1>
        <p className="text-gray-600 mb-6">This article doesn’t exist or hasn’t been published yet.</p>
        <button onClick={() => go('/blog')} className="bg-amber-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-700">
          Back to the blog
        </button>
      </section>
    );
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.cover_url ? { image: post.cover_url } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    author: { '@type': 'Person', name: post.author_name || SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png` } },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <article className="px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="max-w-3xl mx-auto">
        <button onClick={() => go('/blog')} className="flex items-center gap-2 text-gray-500 hover:text-amber-700 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> All posts
        </button>

        {post.status !== 'published' && (
          <div className="mb-4 inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            Draft preview — not publicly visible
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">{post.title}</h1>
        <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-6">
          <Calendar className="w-4 h-4" /> {fmt(post.published_at)}
          {post.author_name ? <span className="text-gray-300"> · {post.author_name}</span> : null}
        </p>

        {post.cover_url && (
          <img src={post.cover_url} alt={post.title} className="w-full rounded-2xl mb-8 object-cover" />
        )}

        <div className="prose-cursive">{renderMarkdown(post.body)}</div>
      </div>
    </article>
  );
}
