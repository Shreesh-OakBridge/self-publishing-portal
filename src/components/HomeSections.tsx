import { useState } from 'react';
import { ArrowRight, ChevronDown, Calculator } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { resolveServiceIcon } from '../lib/serviceIcons';
import { go, withBase } from '../lib/basePath';
import { printRoyaltyPerCopy, netSalesPerCopy, PLAN_ROYALTY_FALLBACK } from '../lib/royalty';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// "What kind of author are you?" — one card per author path (journey).
export function HomePaths() {
  const { journeys } = useContent();
  if (!journeys.items.length) return null;
  return (
    <section id="paths" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{journeys.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{journeys.subheading}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {journeys.items.map((j, i) => {
            const Icon = resolveServiceIcon(j.icon, i);
            return (
              <a
                key={j.slug}
                href={withBase(`/journey/${j.slug}`)}
                className="group flex items-start gap-4 bg-white rounded-2xl border border-gray-200 p-5 hover:border-amber-300 hover:shadow-md transition-all"
              >
                <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-gray-900 group-hover:text-amber-700 transition-colors">{j.title}</span>
                  <span className="block text-sm text-gray-600 mt-0.5 leading-relaxed">{j.tagline}</span>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Public royalty estimator: author enters a price and sees earnings per copy.
export function RoyaltyEstimator() {
  const { pricing, royaltyCalc } = useContent();
  const plans = pricing.plans;
  const rateFor = (name: string) =>
    plans.find((p) => p.name === name)?.royaltyRate ?? PLAN_ROYALTY_FALLBACK[name] ?? 0;
  const defaultPlan = plans.find((p) => p.popular)?.name ?? plans[0]?.name ?? '';

  const [plan, setPlan] = useState(defaultPlan);
  const [mrp, setMrp] = useState(399);
  const [printCost, setPrintCost] = useState(royaltyCalc.printCost);
  const [commission, setCommission] = useState(royaltyCalc.commissionPct);
  const [copies, setCopies] = useState(100);

  const inputs = { mrp, printCost, commissionPct: commission, gstPct: royaltyCalc.gstPct };
  const net = netSalesPerCopy(inputs);
  const perCopy = printRoyaltyPerCopy(inputs, rateFor(plan));

  const field =
    'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none';
  const num = (v: string) => Math.max(0, Number(v) || 0);

  return (
    <section id="royalty" className="py-20 px-4 bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{royaltyCalc.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{royaltyCalc.subheading}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Plan</label>
              <select className={field} value={plan} onChange={(e) => setPlan(e.target.value)}>
                {plans.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} — {rateFor(p.name)}% print royalty
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Book price (MRP, ₹)</label>
                <input type="number" min={0} className={field} value={mrp} onChange={(e) => setMrp(num(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Copies sold per month</label>
                <input type="number" min={0} className={field} value={copies} onChange={(e) => setCopies(num(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Print cost per copy (₹)</label>
                <input type="number" min={0} className={field} value={printCost} onChange={(e) => setPrintCost(num(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Store commission (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={field}
                  value={commission}
                  onChange={(e) => setCommission(Math.min(100, num(e.target.value)))}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{royaltyCalc.assumptionsNote}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-3xl shadow-lg p-6 flex flex-col">
            <div className="flex items-center gap-2 text-white/80 text-sm font-semibold mb-1">
              <Calculator className="w-4 h-4" /> You earn per print copy
            </div>
            <p className="text-5xl font-bold">{inr(perCopy)}</p>
            <p className="text-white/80 text-sm mt-1">
              {rateFor(plan)}% of {inr(net)} net sales · about {inr(perCopy * copies)} a month at {copies} copies
            </p>

            <div className="mt-6 bg-white/10 rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-2">Per print copy, by plan</p>
              <ul className="space-y-1.5 text-sm">
                {plans.map((p) => (
                  <li key={p.name} className={`flex justify-between ${p.name === plan ? 'font-bold' : 'text-white/85'}`}>
                    <span>
                      {p.name} ({rateFor(p.name)}%)
                    </span>
                    <span>{inr(printRoyaltyPerCopy(inputs, rateFor(p.name)))}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-white/90 mt-4">eBooks: you keep 100% of net receipts on every plan.</p>
            <button
              onClick={() => go('/plans#compare')}
              className="mt-auto pt-5 self-start inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline"
            >
              Compare plans <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Homepage FAQ — the first few questions, with a link to the full page.
export function HomeFaq() {
  const { faq } = useContent();
  const items = faq.items.slice(0, 6);
  if (!items.length) return null;
  return (
    <section id="faq" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{faq.title}</h2>
          <p className="text-lg text-gray-600">{faq.subtitle}</p>
        </div>
        <div className="space-y-3">
          {items.map((f, i) => (
            <details key={i} className="group bg-white rounded-2xl border border-gray-200 p-5">
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="font-semibold text-gray-900">{f.question}</span>
                <ChevronDown className="w-5 h-5 text-amber-700 flex-shrink-0 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-gray-600 mt-3 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href={withBase('/faq')} className="inline-flex items-center gap-2 font-semibold text-amber-700 hover:text-amber-900">
            See all questions <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// A real edited page (tracked changes). Hidden until an image is uploaded in
// Admin → Site Content → Editorial Sample.
export function EditorialSample() {
  const { editorialSample: e } = useContent();
  if (!e.sampleImageUrl) return null;
  return (
    <section id="editing-sample" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{e.heading}</h2>
          <p className="text-lg text-gray-600 mb-4">{e.subheading}</p>
          <p className="text-gray-700 leading-relaxed">{e.text}</p>
        </div>
        <a href={e.sampleImageUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={e.sampleImageUrl}
            alt={e.sampleImageAlt || e.heading}
            className="w-full rounded-2xl shadow-xl border border-gray-200"
            loading="lazy"
          />
          <span className="block text-center text-xs text-gray-400 mt-2">Click to view full size</span>
        </a>
      </div>
    </section>
  );
}
