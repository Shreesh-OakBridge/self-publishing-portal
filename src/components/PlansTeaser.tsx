import { useState } from 'react';
import { Crown, Zap, Rocket, Sparkles, ArrowRight, Star, Laptop, Users, Check } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { useAuth } from '../lib/auth';
import { go } from '../lib/basePath';
import AuthModal from './AuthModal';

const planIcons = [Zap, Rocket, Crown, Sparkles];
const planColors = [
  'from-blue-500 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-purple-500 to-indigo-500',
];

// Homepage teaser showing BOTH publishing pathways — full self-publishing (DIY
// with our tools) and our curated packages. Logged-out visitors are prompted to
// sign in / sign up; logged-in users go to the customizer or /plans.
export default function PlansTeaser() {
  const { pricing, getStarted: g } = useContent();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingDest, setPendingDest] = useState('/plans');

  const goOrPrompt = (dest: string) => {
    if (user) go(dest);
    else {
      setPendingDest(dest);
      setAuthOpen(true);
    }
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

        {/* Two pathways */}
        <div className="grid md:grid-cols-2 gap-6 mb-14">
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
            <ul className="space-y-2 mb-6 flex-1">
              {g.selfPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
            <button
              onClick={() => goOrPrompt('/customize')}
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
            >
              Start self-publishing <ArrowRight className="w-4 h-4" />
            </button>
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
            <ul className="space-y-2 mb-6 flex-1">
              {g.expertPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
            <button
              onClick={() => goOrPrompt('/plans')}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:from-amber-700 hover:to-orange-700 transition-colors"
            >
              Explore curated packages <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Curated package preview */}
        <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
          Our curated packages
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {pricing.plans.map((plan, i) => {
            const Icon = planIcons[i % planIcons.length];
            const color = planColors[i % planColors.length];
            return (
              <button
                key={plan.name}
                onClick={() => goOrPrompt(`/plans?plan=${encodeURIComponent(plan.name)}`)}
                className={`relative bg-white rounded-2xl border p-5 sm:p-6 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  plan.popular ? 'ring-2 ring-amber-400' : ''
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-white" /> POPULAR
                  </span>
                )}
                <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-500 mb-2 min-h-[2rem]">{plan.tagline}</p>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-500">one-time</span>
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                  View plan <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => goOrPrompt('/plans')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3.5 rounded-full text-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all"
          >
            View all plans &amp; pricing <ArrowRight className="w-5 h-5" />
          </button>
          {!user && (
            <p className="text-sm text-gray-500 mt-3">Sign in or create a free account to choose your path.</p>
          )}
        </div>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => go(pendingDest)}
        heading="Log in or sign up to continue"
      />
    </section>
  );
}
