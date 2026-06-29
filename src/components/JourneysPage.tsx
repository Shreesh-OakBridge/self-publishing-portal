import { ArrowRight } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { resolveServiceIcon } from '../lib/serviceIcons';
import { go } from '../lib/basePath';
import { track } from '../lib/track';

// "Choose Your Journey" — intent-based entry. Each card opens the reusable
// /journey/<slug> template.
export default function JourneysPage() {
  const { journeys } = useContent();
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">{journeys.heading}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{journeys.subheading}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {journeys.items.map((j, i) => {
            const Icon = resolveServiceIcon(j.icon, i);
            return (
              <button
                key={j.slug}
                onClick={() => {
                  track('click_event', { label: 'journey_card', journey: j.slug });
                  go(`/journey/${j.slug}`);
                }}
                className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-amber-300 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">
                  {j.title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">{j.tagline}</p>
                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
