import { useState } from 'react';
import { ArrowRight, Laptop, Users, Check } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { useAuth } from '../lib/auth';
import { go } from '../lib/basePath';
import { track } from '../lib/track';
import AuthModal from './AuthModal';

// Homepage teaser showing BOTH publishing pathways — full self-publishing and
// our curated packages — with a single CTA to the dedicated /plans page.
// Logged-in users go straight there; logged-out users are prompted to log in.
export default function PlansTeaser() {
  const { pricing, getStarted: g } = useContent();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const explorePlans = () => {
    track('click_event', { label: 'explore_plans' });
    if (user) go('/plans');
    else setAuthOpen(true);
  };

  return (
    <section id="plans" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">{pricing.heading}</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">{pricing.subheading}</p>
        </div>
        <p className="text-center text-gray-500 mb-12">
          Two ways to publish — go the <strong className="text-gray-700">complete self-publishing</strong> route with
          our tools, or pick one of our <strong className="text-gray-700">curated packages</strong>.
        </p>

        {/* Two pathways (showcase) */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Self-publishing */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-7 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                <Laptop className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Do it yourself</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{g.selfTitle}</h3>
            <p className="text-gray-500 mb-4">{g.selfTagline}</p>
            <ul className="space-y-2">
              {g.selfPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Curated packages */}
          <div className="bg-white rounded-3xl border-2 border-amber-300 ring-1 ring-amber-200 p-7 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Done for you</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{g.expertTitle}</h3>
            <p className="text-gray-500 mb-4">{g.expertTagline}</p>
            <ul className="space-y-2">
              {g.expertPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Single CTA */}
        <div className="text-center">
          <button
            onClick={explorePlans}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-9 py-4 rounded-full text-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all"
          >
            Explore Plans <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-3">
            {user
              ? 'Compare both routes and choose what fits your book.'
              : 'Sign in or create a free account to explore plans and continue.'}
          </p>
        </div>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => go('/plans')}
        redirectPath="/plans"
        heading="Log in or sign up to access plans"
      />
    </section>
  );
}
