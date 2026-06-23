import { useState } from 'react';
import { Crown, Zap, Rocket, Sparkles, ArrowRight, Star } from 'lucide-react';
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

// Homepage teaser. Logged-out visitors are prompted to sign in / sign up;
// logged-in users open the dedicated /plans page with their plan pre-selected.
export default function PlansTeaser() {
  const { pricing } = useContent();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const openPlans = (plan?: string) => {
    if (user) {
      go(plan ? `/plans?plan=${encodeURIComponent(plan)}` : '/plans');
    } else {
      setPendingPlan(plan ?? null);
      setAuthOpen(true);
    }
  };

  return (
    <section id="plans" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{pricing.heading}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{pricing.subheading}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {pricing.plans.map((plan, i) => {
            const Icon = planIcons[i % planIcons.length];
            const color = planColors[i % planColors.length];
            return (
              <button
                key={plan.name}
                onClick={() => openPlans(plan.name)}
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
            onClick={() => openPlans()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3.5 rounded-full text-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all"
          >
            View all plans &amp; pricing <ArrowRight className="w-5 h-5" />
          </button>
          {!user && (
            <p className="text-sm text-gray-500 mt-3">Sign in or create a free account to choose a plan and continue.</p>
          )}
        </div>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => go(pendingPlan ? `/plans?plan=${encodeURIComponent(pendingPlan)}` : '/plans')}
        heading="Log in or sign up to choose a plan"
      />
    </section>
  );
}
