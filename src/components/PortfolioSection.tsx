import { useEffect, useRef } from 'react';
import type { Key } from 'react';
import { BookOpen, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { PortfolioItem } from '../content/defaults';
import { withBase } from '../lib/basePath';

// Homepage portfolio preview. With more than 4 titles it's a horizontal
// carousel that can auto-rotate on a CMS-set timer (pauses on hover); manual
// arrows + swipe always work. The full /portfolio page shows everything.
export default function PortfolioSection() {
  const { portfolio } = useContent();
  const items = portfolio.items;
  const overflow = items.length > 4;
  const autoRotate = portfolio.autoRotate ?? true;
  const rotateSeconds = portfolio.rotateSeconds ?? 3;

  const scroller = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  const nudge = (dir: number) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  // Auto-rotate: advance to the next cover every `rotateSeconds`, wrapping to
  // the start at the end. Pauses while hovered. Off when toggled off in the CMS.
  useEffect(() => {
    if (!autoRotate || !overflow) return;
    const id = setInterval(() => {
      const el = scroller.current;
      if (!el || paused.current) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const first = el.firstElementChild as HTMLElement | null;
        const step = first ? first.offsetWidth + 24 : el.clientWidth * 0.5;
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, Math.max(1, rotateSeconds) * 1000);
    return () => clearInterval(id);
  }, [autoRotate, overflow, rotateSeconds]);

  const arrowBtn =
    'hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white border shadow-lg text-gray-700 hover:bg-amber-50 hover:text-amber-700';

  const containerClass = overflow
    ? 'flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide'
    : 'flex md:flex-wrap md:justify-center gap-5 md:gap-6 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide';

  const Tile = (book: PortfolioItem, key: Key) => {
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
    const cls = 'group shrink-0 w-[40%] sm:w-[200px] snap-start';
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

        <div
          className="relative"
          onMouseEnter={() => (paused.current = true)}
          onMouseLeave={() => (paused.current = false)}
        >
          {overflow && (
            <>
              <button onClick={() => nudge(-1)} className={`${arrowBtn} -left-3`} aria-label="Previous">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => nudge(1)} className={`${arrowBtn} -right-3`} aria-label="Next">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div ref={scroller} className={containerClass}>
            {items.map((b, i) => Tile(b, i))}
          </div>
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
