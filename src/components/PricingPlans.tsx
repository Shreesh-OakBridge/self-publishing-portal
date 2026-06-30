import { useState, useEffect, useRef } from 'react';
import { Check, Crown, Zap, Rocket, Sparkles, ChevronDown, ChevronUp, X, Users, Laptop, ArrowRight } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import type { PricingPlan } from '../content/defaults';
import { useAuth } from '../lib/auth';
import { go } from '../lib/basePath';
import { track } from '../lib/track';
import AuthModal from './AuthModal';

const planIcons = [Zap, Rocket, Crown, Sparkles];
const planColors = [
  'from-blue-500 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-purple-500 to-indigo-500',
];

// Number of features shown before the list collapses.
const COLLAPSED_COUNT = 5;


function PlanCard({
  plan,
  planIndex,
  isSelected,
  onSelect,
  onCollapse,
  onGetStarted,
}: {
  plan: PricingPlan;
  planIndex: number;
  isSelected: boolean;
  onSelect: (name: string) => void;
  onCollapse: () => void;
  onGetStarted: (name: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = planIcons[planIndex % planIcons.length];
  const color = planColors[planIndex % planColors.length];
  const canCollapse = plan.features.length > COLLAPSED_COUNT;
  // Selected card shows everything; others stay compact.
  const visibleFeatures = isSelected ? plan.features : plan.features.slice(0, COLLAPSED_COUNT);

  // When this card becomes selected, scroll its top just below the fixed nav
  // so the whole plan can be read from the top.
  useEffect(() => {
    if (isSelected && cardRef.current) {
      const y = cardRef.current.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [isSelected]);

  const ringClass = isSelected
    ? 'ring-4 ring-amber-500 shadow-2xl'
    : plan.popular
    ? 'ring-4 ring-amber-400'
    : 'ring-1 ring-transparent';

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(plan.name)}
      role="button"
      aria-pressed={isSelected}
      className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transition-all cursor-pointer hover:shadow-2xl hover:scale-[1.02] ${
        isSelected ? 'scale-[1.02]' : ''
      } ${ringClass}`}
    >
      {/* Banner strip — SELECTED takes priority over MOST POPULAR; keeps headers aligned */}
      <div
        className={`h-9 flex items-center justify-center text-white font-bold text-sm ${
          isSelected
            ? 'bg-gradient-to-r from-amber-600 to-orange-600'
            : plan.popular
            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
            : ''
        }`}
      >
        {isSelected ? '✓ SELECTED' : plan.popular ? 'MOST POPULAR' : ''}
      </div>

      <div className="p-8">
        <div
          className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-4`}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-4 min-h-[3rem]">{plan.tagline}</p>

        <div className="mb-6 flex items-baseline gap-x-2 whitespace-nowrap">
          <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
          <span className="text-sm text-gray-500">one-time</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onGetStarted(plan.name);
          }}
          className={`w-full bg-gradient-to-r ${color} text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all mb-6`}
        >
          Get Started
        </button>

        <div className="space-y-4">
          <h4 className="font-bold text-gray-900 text-lg border-b pb-2">What's Included:</h4>
          {visibleFeatures.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 text-sm">{feature}</span>
            </div>
          ))}

          {canCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isSelected) onCollapse();
                else onSelect(plan.name);
              }}
              aria-expanded={isSelected}
              className="flex items-center space-x-1 text-sm font-semibold text-amber-700 hover:text-amber-900 pt-1"
            >
              <span>
                {isSelected ? 'Show less' : `View full plan (${plan.features.length} features)`}
              </span>
              {isSelected ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PricingPlans() {
  const { pricing, getStarted: g } = useContent();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  // Pre-select a plan when arriving from the homepage teaser (/plans?plan=...).
  const planParam = new URLSearchParams(window.location.search).get('plan');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(planParam);
  const [detailPlan, setDetailPlan] = useState<PricingPlan | null>(null);
  // Two-plan model: "Publish on your own" (basic) shows first; Expert Publishing
  // second. A pre-selected plan (a tier package) opens the Expert view.
  const [view, setView] = useState<'expert' | 'self'>(planParam ? 'expert' : 'self');

  // Funnel step: viewing the plans/pricing (product view).
  useEffect(() => {
    track('view', { page: 'plans' });
  }, []);

  const goToCheckout = (plan: string) => {
    go(`/checkout?plan=${encodeURIComponent(plan)}`);
  };

  // Logged-in users go straight to checkout for the plan; visitors log in /
  // sign up first, then continue to checkout for the chosen plan.
  const handleGetStarted = (plan: string) => {
    if (user) {
      goToCheckout(plan);
    } else {
      setPendingPlan(plan);
      setAuthOpen(true);
    }
  };

  return (
    <section id="plans" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{pricing.heading}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{pricing.subheading}</p>
        </div>

        {/* Two-plan toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white border rounded-full p-1 shadow-sm">
            <button
              onClick={() => setView('self')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                view === 'self' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:text-amber-700'
              }`}
            >
              <Laptop className="w-4 h-4" />
              {g.selfTitle}
            </button>
            <button
              onClick={() => setView('expert')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                view === 'expert' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:text-amber-700'
              }`}
            >
              <Users className="w-4 h-4" />
              {g.expertTitle}
            </button>
          </div>
        </div>

        {view === 'self' ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
              <Laptop className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{g.selfTitle}</h3>
            <p className="text-gray-500 mb-6">{g.selfTagline}</p>
            <ul className="space-y-3 text-left max-w-md mx-auto mb-8">
              {g.selfPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
            <button
              onClick={() => go('/customize')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3.5 rounded-full text-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all"
            >
              Start designing your book
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-400 mt-3">Transparent, itemised pricing — pay only for what you choose.</p>
          </div>
        ) : (
        <>
        {/* Desktop / tablet: full cards */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          {pricing.plans.map((plan, planIndex) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              planIndex={planIndex}
              isSelected={selectedPlan === plan.name}
              onSelect={(name) => setSelectedPlan(name)}
              onCollapse={() => setSelectedPlan(null)}
              onGetStarted={handleGetStarted}
            />
          ))}
        </div>

        {/* Mobile: compact 2×2 grid; tap a tile for full details */}
        <div className="grid grid-cols-2 gap-4 md:hidden">
          {pricing.plans.map((plan, i) => {
            const Icon = planIcons[i % planIcons.length];
            const color = planColors[i % planColors.length];
            return (
              <button
                key={plan.name}
                onClick={() => setDetailPlan(plan)}
                className="relative bg-white rounded-2xl shadow-lg p-4 text-left flex flex-col hover:shadow-xl transition-shadow"
              >
                {plan.popular && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    POPULAR
                  </span>
                )}
                <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-1 flex-wrap">
                  <span className="text-xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-500">one-time</span>
                </div>
                <span className="mt-3 text-xs font-semibold text-amber-700">View details →</span>
              </button>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{pricing.imprintsHeading}</h3>

          {/* Desktop: full descriptions */}
          <div className="hidden md:block space-y-4 text-gray-700">
            {pricing.imprints.map((im) => (
              <div key={im.name}>
                <h4 className="font-bold text-lg text-amber-600 mb-2">{im.name}</h4>
                <p>{im.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile: tap-to-expand accordion */}
          <div className="md:hidden divide-y">
            {pricing.imprints.map((im) => (
              <details key={im.name} className="group">
                <summary className="flex items-center justify-between gap-3 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-bold text-amber-600">{im.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="pb-3 text-gray-700 text-sm">{im.desc}</p>
              </details>
            ))}
          </div>
        </div>
        </>
        )}
      </div>

      {/* Mobile plan details popup */}
      {detailPlan && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:hidden"
          onClick={() => setDetailPlan(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`relative px-6 pt-6 pb-5 text-white bg-gradient-to-r ${
                planColors[pricing.plans.indexOf(detailPlan) % planColors.length]
              }`}
            >
              <button
                onClick={() => setDetailPlan(null)}
                className="absolute top-4 right-4 text-white/90 hover:text-white"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              {detailPlan.popular && (
                <span className="inline-block bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-2xl font-bold">{detailPlan.name}</h3>
              <p className="text-white/90 text-sm mt-1">{detailPlan.tagline}</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{detailPlan.price}</span>
                <span className="text-sm text-white/80">one-time</span>
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">What’s Included:</h4>
              <div className="space-y-3">
                {detailPlan.features.map((feature, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const name = detailPlan.name;
                  setDetailPlan(null);
                  handleGetStarted(name);
                }}
                className="w-full mt-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => {
          if (pendingPlan) goToCheckout(pendingPlan);
        }}
        heading="Please log in or sign up to continue"
      />
    </section>
  );
}
