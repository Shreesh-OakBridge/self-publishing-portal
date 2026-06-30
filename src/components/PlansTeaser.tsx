import { useEffect, useState } from 'react';
import { ArrowRight, Laptop, Users, Check, Sparkles } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { stageLabel } from '../lib/productionStages';
import { go } from '../lib/basePath';
import { track } from '../lib/track';
import AuthModal from './AuthModal';

interface CurrentOrder {
  id: string;
  plan: string | null;
  amount: number | null;
  status: string;
  production_stage: string | null;
}

const statusColor = (s: string) =>
  s === 'confirmed' || s === 'completed' || s === 'shipped'
    ? 'bg-green-100 text-green-800'
    : s === 'cancelled'
    ? 'bg-red-100 text-red-700'
    : 'bg-amber-100 text-amber-800';

// Homepage Plans section. For a signed-in user with a plan, shows their current
// plan + details and an "explore other plans" option; otherwise the two-pathway
// teaser with a single CTA to /plans.
export default function PlansTeaser() {
  const { pricing, getStarted: g } = useContent();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [order, setOrder] = useState<CurrentOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(!!user);

  useEffect(() => {
    if (!user) {
      setOrder(null);
      setLoadingOrder(false);
      return;
    }
    setLoadingOrder(true);
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, plan, amount, status, production_stage, created_at')
        .eq('user_id', user.id)
        .not('plan', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setOrder((data as CurrentOrder) ?? null);
      setLoadingOrder(false);
    })();
  }, [user]);

  const explorePlans = () => {
    track('click_event', { label: 'explore_plans' });
    if (user) go('/plans');
    else setAuthOpen(true);
  };

  const planDetails = order?.plan ? pricing.plans.find((p) => p.name === order.plan) : null;
  const hasCurrentPlan = !!order?.plan;

  return (
    <section id="plans" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">{pricing.heading}</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">{pricing.subheading}</p>
        </div>

        {user && loadingOrder ? (
          <p className="text-center text-gray-400 py-10">Loading your plan…</p>
        ) : hasCurrentPlan ? (
          /* ── Current plan card ── */
          <div className="max-w-3xl mx-auto mt-8">
            <div className="bg-white rounded-3xl border-2 border-amber-300 ring-1 ring-amber-200 p-7">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4" /> Your current plan
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(order!.status)}`}>
                  {order!.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{order!.plan}</h3>
              {planDetails?.tagline && <p className="text-gray-500 mb-3">{planDetails.tagline}</p>}

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700 mb-5">
                {planDetails && (
                  <span>
                    <span className="text-gray-400">Plan price: </span>
                    <strong>{planDetails.price}</strong>
                  </span>
                )}
                {planDetails && (
                  <span>
                    <span className="text-gray-400">Royalty: </span>
                    <strong>{planDetails.royaltyRate}%</strong>
                  </span>
                )}
                <span>
                  <span className="text-gray-400">Current stage: </span>
                  <strong>{stageLabel(order!.production_stage)}</strong>
                </span>
              </div>

              {planDetails && planDetails.features.length > 0 && (
                <ul className="grid sm:grid-cols-2 gap-2 mb-6">
                  {planDetails.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => go('/account#orders')}
                  className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-700"
                >
                  Manage in My Account
                </button>
                <button
                  onClick={() => go(`/project?id=${order!.id}`)}
                  className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-50"
                >
                  Open project workspace
                </button>
                <button
                  onClick={explorePlans}
                  className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-50"
                >
                  Explore other plans <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Default teaser (logged out, or no plan yet) ── */
          <>
            <p className="text-center text-gray-500 mb-12 mt-3">
              Two ways to publish — go the <strong className="text-gray-700">complete self-publishing</strong> route with
              our tools, or pick one of our <strong className="text-gray-700">curated packages</strong>.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
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
          </>
        )}
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
