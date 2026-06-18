import { Quote, Star } from 'lucide-react';

// Static placeholder testimonials. These will be made CMS-editable in a later
// item; for now they live here so the new "Testimonials" nav link has a target.
const TESTIMONIALS = [
  {
    quote:
      'OakBridge made publishing my first novel effortless. From editing to the cover design, every step felt guided and professional. My book was on shelves in weeks.',
    name: 'Ananya Sharma',
    role: 'Author, “Threads of Dawn”',
    rating: 5,
  },
  {
    quote:
      'The royalty terms were the most transparent I found anywhere in India. I always know exactly what I earn per copy, and payouts are right on time.',
    name: 'Rajat Mehta',
    role: 'Author, “The Quiet Quarter”',
    rating: 5,
  },
  {
    quote:
      'I came in with just a manuscript and a lot of doubts. Their team handled the production beautifully and kept me involved through every decision.',
    name: 'Fatima Qureshi',
    role: 'Poet & Author',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Loved by authors</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Writers across the country trust OakBridge to bring their stories to readers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-8 flex flex-col"
            >
              <Quote className="w-9 h-9 text-amber-400 mb-4" />
              <div className="flex mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
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
