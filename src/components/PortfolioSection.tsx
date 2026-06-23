import { useRef } from 'react';
import { BookOpen, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { withBase } from '../lib/basePath';

// Homepage portfolio preview: grid on desktop, 2.5-tile swipe carousel on
// mobile. "View all" links to the full /portfolio page.
export default function PortfolioSection() {
  const { portfolio } = useContent();
  const items = portfolio.items;
  // Up to 4 → centered showcase; more → swipe carousel (≈4 visible + peek).
  const overflow = items.length > 4;
  const containerClass = overflow
    ? 'flex gap-5 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide'
    : 'flex md:flex-wrap md:justify-center gap-5 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide';
  const tileClass = overflow
    ? 'group shrink-0 w-[40%] md:w-[22%] snap-start'
    : 'group shrink-0 w-[40%] md:w-[200px] snap-start';

  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.85, behavior: 'smooth' });

  const arrowBtn =
    'hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white border shadow-lg text-gray-700 hover:bg-amber-50 hover:text-amber-700';

  return (
    <section id="portfolio" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{portfolio.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{portfolio.subheading}</p>
        </div>

        <div className="relative">
          {overflow && (
            <>
              <button onClick={() => scrollBy(-1)} className={`${arrowBtn} -left-3`} aria-label="Previous">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => scrollBy(1)} className={`${arrowBtn} -right-3`} aria-label="Next">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div ref={scroller} className={containerClass}>
          {items.map((book, i) => {
            const inner = (
              <>
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-100 flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center px-3">
                      <BookOpen className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-amber-800 leading-tight">{book.title}</p>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 leading-tight group-hover:text-amber-700 transition-colors">{book.title}</h3>
                <p className="text-sm text-gray-500">{book.author}</p>
                {book.category && <p className="text-xs text-amber-700 mt-0.5">{book.category}</p>}
              </>
            );
            return book.linkUrl ? (
              <a
                key={i}
                href={book.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${tileClass} cursor-pointer`}
              >
                {inner}
              </a>
            ) : (
              <div key={i} className={tileClass}>
                {inner}
              </div>
            );
          })}
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
