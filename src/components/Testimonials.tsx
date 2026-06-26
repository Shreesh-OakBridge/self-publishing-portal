import type { Key } from 'react';
import { Quote, Star } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { TestimonialItem } from '../content/defaults';

// With enough testimonials and auto-rotate on, the cards glide as a seamless,
// never-ending marquee (pauses on hover); the admin "rotateSeconds" sets the
// pace. Otherwise it's a static / manually-scrollable row.
export default function Testimonials() {
  const { testimonials } = useContent();
  const items = testimonials.items;
  if (items.length === 0) return null;

  const overflow = items.length > 3;
  const autoRotate = testimonials.autoRotate ?? true;
  const rotateSeconds = testimonials.rotateSeconds ?? 4;
  const scrolling = autoRotate && overflow;
  const duration = Math.max(16, items.length * Math.max(1, rotateSeconds));

  const Card = (t: TestimonialItem, key: Key, extra = '') => (
    <div
      key={key}
      className={`relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-8 flex flex-col shrink-0 ${extra}`}
    >
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
  );

  return (
    <section id="testimonials" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{testimonials.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{testimonials.subheading}</p>
        </div>

        {scrolling ? (
          <div className="overflow-hidden -mx-4 px-4 md:mx-0 md:px-0">
            <div
              className="marquee-track flex w-max items-stretch"
              style={{ animationDuration: `${duration}s` }}
            >
              {items.map((t, i) => Card(t, `a-${i}`, 'w-[300px] sm:w-[340px] mr-5 md:mr-6'))}
              {items.map((t, i) => Card(t, `b-${i}`, 'w-[300px] sm:w-[340px] mr-5 md:mr-6'))}
            </div>
          </div>
        ) : (
          <div className="flex md:flex-wrap md:justify-center gap-5 md:gap-8 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            {items.map((t, i) => Card(t, i, 'w-[83%] sm:w-[340px]'))}
          </div>
        )}
      </div>
    </section>
  );
}
