import type { Key } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { PortfolioItem } from '../content/defaults';
import { withBase } from '../lib/basePath';

// Homepage portfolio preview. With enough titles and auto-rotate on, the covers
// glide as a seamless, never-ending marquee (pauses on hover). The admin
// "rotateSeconds" sets the pace. Otherwise it's a static / manually-scrollable
// row. The full /portfolio page shows everything as a grid.
export default function PortfolioSection() {
  const { portfolio } = useContent();
  const items = portfolio.items;
  const overflow = items.length > 4;
  const autoRotate = portfolio.autoRotate ?? true;
  const rotateSeconds = portfolio.rotateSeconds ?? 3;
  const scrolling = autoRotate && overflow;
  // Each cover takes ~rotateSeconds to pass; one full loop = items × seconds.
  const duration = Math.max(12, items.length * Math.max(1, rotateSeconds));

  const Tile = (book: PortfolioItem, key: Key, extra = '') => {
    const inner = (
      <>
        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-100 flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.coverAlt || book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center px-3">
              <BookOpen className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-amber-800 leading-tight">{book.title}</p>
            </div>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 leading-tight group-hover:text-amber-700 transition-colors">
          {book.title}
        </h3>
        <p className="text-sm text-gray-500">{book.author}</p>
        {book.category && <p className="text-xs text-amber-700 mt-0.5">{book.category}</p>}
      </>
    );
    const cls = `group shrink-0 ${extra}`;
    return book.linkUrl ? (
      <a key={key} href={book.linkUrl} target="_blank" rel="noopener noreferrer" className={`${cls} cursor-pointer`}>
        {inner}
      </a>
    ) : (
      <div key={key} className={cls}>
        {inner}
      </div>
    );
  };

  return (
    <section id="portfolio" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{portfolio.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{portfolio.subheading}</p>
        </div>

        {scrolling ? (
          // Items rendered twice; the track translates -50% so it loops
          // seamlessly. Right-margin (not gap) keeps the loop point exact.
          <div className="overflow-hidden -mx-4 px-4 md:mx-0 md:px-0">
            <div className="marquee-track flex w-max" style={{ animationDuration: `${duration}s` }}>
              {items.map((b, i) => Tile(b, `a-${i}`, 'w-[150px] sm:w-[200px] mr-5 md:mr-7'))}
              {items.map((b, i) => Tile(b, `b-${i}`, 'w-[150px] sm:w-[200px] mr-5 md:mr-7'))}
            </div>
          </div>
        ) : (
          <div className="flex md:flex-wrap md:justify-center gap-5 md:gap-6 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            {items.map((b, i) => Tile(b, i, 'w-[40%] sm:w-[200px]'))}
          </div>
        )}

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
