import { useState, useEffect, useRef } from 'react';
import { Check, Crown, Zap, Rocket, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import type { PricingPlan } from '../content/defaults';
import { useAuth } from '../lib/auth';
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
  const { pricing } = useContent();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const goToCheckout = (plan: string) => {
    window.location.href = `/checkout?plan=${encodeURIComponent(plan)}`;
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
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{pricing.heading}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{pricing.subheading}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
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

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">About Our Imprints</h3>
          <div className="space-y-4 text-gray-700">
            <div>
              <h4 className="font-bold text-lg text-amber-600 mb-2">OakBridge Classics (Starter Plan)</h4>
              <p>Our foundational imprint for emerging authors. Perfect for traditional fiction, memoirs, and first-time publications that will be printed with our classic, timeless aesthetic.</p>
            </div>
            <div>
              <h4 className="font-bold text-lg text-amber-600 mb-2">OakBridge Imprint Series (Professional Plan)</h4>
              <p>For authors building their brand and creating professional, market-competitive titles across all genres. This imprint signifies quality and editorial excellence.</p>
            </div>
            <div>
              <h4 className="font-bold text-lg text-amber-600 mb-2">OakBridge Prestige (Excellence Plan)</h4>
              <p>Reserved for authors published at the highest standards. Your imprint will feature on premium-quality books with exclusive design elements and premium distribution.</p>
            </div>
            <div>
              <h4 className="font-bold text-lg text-amber-600 mb-2">OakBridge Signature (Elite Plan)</h4>
              <p>Our most exclusive imprint featuring the author's biography and signature edition mark. Only for authors receiving our white-glove publishing service with guaranteed visibility.</p>
            </div>
          </div>
        </div>
      </div>

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
