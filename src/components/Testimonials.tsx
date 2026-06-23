import { Quote, Star } from 'lucide-react';
import { useContent } from '../content/ContentProvider';

export default function Testimonials() {
  const { testimonials } = useContent();
  const items = testimonials.items;
  if (items.length === 0) return null;

  // Up to 3 → fill the width; more → swipe carousel (≈3 visible + peek).
  const overflow = items.length > 3;
  const containerClass = overflow
    ? 'flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide'
    : 'flex md:flex-wrap md:justify-center gap-5 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide';
  const tileClass = overflow
    ? 'relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-8 flex flex-col shrink-0 w-[83%] md:w-[31%] snap-start'
    : 'relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-8 flex flex-col shrink-0 w-[83%] md:w-[340px] snap-start';

  return (
    <section id="testimonials" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{testimonials.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{testimonials.subheading}</p>
        </div>

        <div className={containerClass}>
          {items.map((t, idx) => (
            <div key={idx} className={tileClass}>
              <Quote className="w-9 h-9 text-amber-400 mb-4" />
              <div className="flex mb-4">
                {Array.from({ length: Math.max(0, Math.min(5, Math.round(t.rating || 0))) }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed flex-1">{t.quote}</p>
              <div className="mt-6 pt-5 border-t border-amber-200">
                <p className="font-bold text-gray-900">{t.name}</p>
                <p className="text-sm text-amber-700">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
