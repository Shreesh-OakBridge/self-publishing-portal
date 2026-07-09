import { useEffect, useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
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
  customization_id: string | null;
}

// Add-ons the author purchased alongside their plan (from book_customizations).
interface PurchasedAddons {
  paper_type: string | null;
  interior_color: string | null;
  binding: string | null;
  cover_design: string | null;
  layout_option: string | null;
  book_size: string | null;
  estimated_price: number | null;
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
  const { pricing, customizer, projectWorkspace } = useContent();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [order, setOrder] = useState<CurrentOrder | null>(null);
  const [addons, setAddons] = useState<PurchasedAddons | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(!!user);

  useEffect(() => {
    if (!user) {
      setOrder(null);
      setAddons(null);
      setLoadingOrder(false);
      return;
    }
    setLoadingOrder(true);
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, plan, amount, status, production_stage, customization_id, created_at')
        .eq('user_id', user.id)
        .not('plan', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const ord = (data as CurrentOrder) ?? null;
      setOrder(ord);
      if (ord?.customization_id) {
        const { data: c } = await supabase
          .from('book_customizations')
          .select('paper_type, interior_color, binding, cover_design, layout_option, book_size, estimated_price')
          .eq('id', ord.customization_id)
          .maybeSingle();
        setAddons((c as PurchasedAddons) ?? null);
      } else {
        setAddons(null);
      }
      setLoadingOrder(false);
    })();
  }, [user]);

  const explorePlans = () => {
    track('click_event', { label: 'explore_plans' });
    if (user) go('/plans');
    else setAuthOpen(true);
  };

  // Map a customization option id to its friendly CMS name.
  const optName = (list: { id: string; name: string }[], id: string | null | undefined) =>
    list.find((o) => o.id === id)?.name || id || '—';
  const isQuotePlan = (price: string) => !/[0-9]/.test(price);

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
                  <strong>{stageLabel(projectWorkspace.stages, order!.production_stage)}</strong>
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

              {/* Add-ons purchased alongside this plan */}
              {addons && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Add-ons purchased
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {([
                      ['Paper', optName(customizer.paperTypes, addons.paper_type)],
                      ['Interior', optName(customizer.colorOptions, addons.interior_color)],
                      ['Binding', optName(customizer.bindingOptions, addons.binding)],
                      ['Cover', optName(customizer.coverDesigns, addons.cover_design)],
                      ['Layout', optName(customizer.layoutOptions, addons.layout_option)],
                      ['Size', optName(customizer.bookSizes, addons.book_size)],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-gray-500">{k}</span>
                        <span className="text-gray-800 font-medium text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                  {addons.estimated_price ? (
                    <p className="text-sm text-amber-800 mt-2 font-semibold">
                      Add-ons total: +₹{addons.estimated_price.toLocaleString()}
                    </p>
                  ) : null}
                </div>
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
              Pick one of our <strong className="text-gray-700">curated publishing packages</strong> — then, if you like,
              <strong className="text-gray-700"> customize your book with optional add-ons</strong>.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {pricing.plans.map((plan) => {
                const quote = isQuotePlan(plan.price);
                return (
                  <div
                    key={plan.name}
                    className={`bg-white rounded-3xl border-2 p-6 flex flex-col ${
                      plan.popular ? 'border-amber-400 ring-1 ring-amber-200' : 'border-gray-200'
                    }`}
                  >
                    {plan.popular && (
                      <span className="self-start text-[10px] font-bold uppercase tracking-wide text-white bg-amber-500 rounded-full px-2.5 py-0.5 mb-2">
                        Most popular
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-1 mb-3 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="text-xs text-gray-500">{quote ? 'tailored quote' : 'one-time'}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{plan.tagline}</p>
                    <ul className="space-y-1.5 mb-5 flex-1">
                      {plan.features.slice(0, 4).map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-700">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={explorePlans}
                      className={`w-full py-2.5 rounded-full text-sm font-semibold transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
                          : 'border-2 border-amber-500 text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      {quote ? 'Request a quote' : 'Get Started'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Creative add-ons showcase — makes clear you can (and should) enhance any plan */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 p-6 sm:p-8 text-white shadow-xl">
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/90">Then make it yours</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold mb-1">Add premium finishing touches</h3>
                  <p className="text-white/90 text-sm sm:text-base max-w-2xl">
                    Every plan can be customised. Choose your paper, cover finish, binding and colour — and watch your
                    book come to life. You only pay for the upgrades you love.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    {[
                      { icon: '📗', label: 'Hardback', price: '+₹1,500' },
                      { icon: '✨', label: 'Foil cover', price: '+₹3,500' },
                      { icon: '🌈', label: 'Full colour', price: '+₹2,500' },
                      { icon: '📄', label: 'Premium paper', price: '+₹600' },
                    ].map((a) => (
                      <div key={a.label} className="bg-white/15 backdrop-blur rounded-2xl px-3 py-3 text-center">
                        <div className="text-2xl mb-1">{a.icon}</div>
                        <div className="text-sm font-bold leading-tight">{a.label}</div>
                        <div className="text-xs text-white/85">{a.price}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => go('/customize')}
                    className="mt-6 inline-flex items-center gap-2 bg-white text-orange-700 px-7 py-3.5 rounded-full text-base font-bold hover:bg-amber-50 transition-all shadow-md"
                  >
                    Explore add-ons <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
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
                  ? 'Pick the package that fits your book.'
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
