import { BookOpen, ArrowRight } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { withBase } from '../lib/basePath';

// Homepage portfolio preview: grid on desktop, 2.5-tile swipe carousel on
// mobile. "View all" links to the full /portfolio page.
export default function PortfolioSection() {
  const { portfolio } = useContent();
  const items = portfolio.items.slice(0, 8);

  return (
    <section id="portfolio" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{portfolio.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{portfolio.subheading}</p>
        </div>

        <div className="flex md:grid md:grid-cols-4 gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {items.map((book, i) => (
            <div key={i} className="group shrink-0 w-[40%] snap-start md:w-auto md:shrink">
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
              <h3 className="font-semibold text-gray-900 leading-tight">{book.title}</h3>
              <p className="text-sm text-gray-500">{book.author}</p>
              {book.category && <p className="text-xs text-amber-700 mt-0.5">{book.category}</p>}
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
