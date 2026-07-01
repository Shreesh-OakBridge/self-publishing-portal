import { CheckCircle, Clock, Tag, ArrowRight, ChevronDown } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { resolveServiceIcon } from '../lib/serviceIcons';
import { go, withBase } from '../lib/basePath';
import { track } from '../lib/track';

// Reusable template that renders any journey by slug from CMS content.
export default function JourneyPage({ slug }: { slug: string }) {
  const { journeys } = useContent();
  const j = journeys.items.find((x) => x.slug === slug);

  if (!j) {
    return (
      <section className="py-20 px-4 text-center max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Journey not found</h1>
        <p className="text-gray-600 mb-6">
          We couldn’t find that journey. Browse all the ways we can help bring your book to life.
        </p>
        <button
          onClick={() => go('/get-started')}
          className="bg-amber-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-700"
        >
          View all journeys
        </button>
      </section>
    );
  }

  const Icon = resolveServiceIcon(j.icon, 0);
  const startProject = () => {
    track('click_event', { label: 'journey_start', journey: j.slug });
    try {
      sessionStorage.setItem('ob_journey', j.slug);
    } catch {
      /* ignore */
    }
    // Unified entry: the Get Started funnel preselects this journey from
    // sessionStorage and continues language → status → method.
    go('/get-started');
  };

  return (
    <div>
      {/* Hero */}
      <section className="px-4 pt-6 pb-10 md:pb-14">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold mb-5">
              <Icon className="w-4 h-4" />
              Publishing journey
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">{j.title}</h1>
            <p className="text-lg md:text-xl text-gray-700 mb-4">{j.tagline}</p>
            <p className="text-gray-600 leading-relaxed mb-7">{j.intro}</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={startProject}
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-700 shadow-sm"
              >
                {j.ctaLabel || 'Start my project'} <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => go('/get-started')}
                className="inline-flex items-center px-6 py-3 rounded-full font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Explore other journeys
              </button>
            </div>
          </div>

          <div className="order-first md:order-last">
            {j.heroUrl ? (
              <img
                src={withBase(j.heroUrl)}
                alt={j.heroAlt || j.title}
                className="w-full rounded-3xl object-cover aspect-[4/3] shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[4/3] rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Icon className="w-20 h-20 text-amber-600/70" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Details: examples + formats */}
      <section className="px-4 py-10 md:py-14 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Perfect for</h2>
            <ul className="space-y-3">
              {j.examples.map((ex, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{ex}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What’s possible</h2>
            <ul className="space-y-3">
              {j.formats.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Timeline + pricing strip */}
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-3 bg-white rounded-2xl border p-5">
            <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Timeline</p>
              <p className="font-semibold text-gray-900">{j.timeline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-2xl border p-5">
            <Tag className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Pricing</p>
              <p className="font-semibold text-gray-900">{j.pricingNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      {j.faqs.length > 0 && (
        <section className="px-4 py-10 md:py-14">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Questions, answered</h2>
            <div className="space-y-3">
              {j.faqs.map((f, i) => (
                <details key={i} className="group bg-white rounded-2xl border p-5">
                  <summary className="flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="font-semibold text-gray-900">{f.question}</span>
                    <ChevronDown className="w-5 h-5 text-amber-700 flex-shrink-0 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-gray-600 mt-3 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-amber-600 to-orange-600 text-white p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to begin?</h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Answer a few quick questions and we’ll shape the perfect plan for your {j.title.toLowerCase()}.
          </p>
          <button
            onClick={startProject}
            className="inline-flex items-center gap-2 bg-white text-amber-700 px-7 py-3 rounded-full font-bold hover:bg-amber-50"
          >
            {j.ctaLabel || 'Start my project'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
