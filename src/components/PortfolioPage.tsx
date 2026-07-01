import { BookOpen } from 'lucide-react';
import { useContent } from '../content/ContentProvider';

export default function PortfolioPage() {
  const { portfolio } = useContent();

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{portfolio.heading}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{portfolio.subheading}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {portfolio.items.map((book, i) => {
            const inner = (
              <>
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-100 flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.coverAlt || book.title} className="w-full h-full object-cover" />
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
                className="group cursor-pointer"
              >
                {inner}
              </a>
            ) : (
              <div key={i} className="group">
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
