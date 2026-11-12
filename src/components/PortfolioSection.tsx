import { useMemo, useState } from 'react';
import { BookOpen, ArrowRight, ShoppingCart } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { withBase } from '../lib/basePath';

// Homepage portfolio: a large cover grid, filterable by genre, with a "Buy"
// link on every title that has one. The full /portfolio page shows everything.
const HOME_LIMIT = 12;

export default function PortfolioSection() {
  const { portfolio } = useContent();
  const [genre, setGenre] = useState('All');

  const genres = useMemo(() => {
    const set = new Set<string>();
    portfolio.items.forEach((b) => b.category && set.add(b.category));
    return ['All', ...Array.from(set)];
  }, [portfolio.items]);

  const shown = (genre === 'All' ? portfolio.items : portfolio.items.filter((b) => b.category === genre)).slice(
    0,
    HOME_LIMIT,
  );

  if (portfolio.items.length === 0) return null;

  return (
    <section id="portfolio" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{portfolio.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{portfolio.subheading}</p>
        </div>

        {genres.length > 2 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  genre === g
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:border-amber-400 hover:text-amber-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 md:gap-6">
          {shown.map((book, i) => (
            <div key={`${book.title}-${i}`} className="group flex flex-col">
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-100 flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.coverAlt || `${book.title} by ${book.author}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center px-3">
                    <BookOpen className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-amber-800 leading-tight">{book.title}</p>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 leading-tight">{book.title}</h3>
              <p className="text-sm text-gray-500">{book.author}</p>
              {book.category && <p className="text-xs text-amber-700 mt-0.5">{book.category}</p>}
              {book.linkUrl && (
                <a
                  href={book.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 self-start text-xs font-semibold text-amber-700 hover:text-amber-900"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Buy
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href={withBase('/portfolio')}
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-7 py-3 rounded-full font-semibold hover:bg-amber-700 transition-colors"
          >
            View Full Portfolio <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
