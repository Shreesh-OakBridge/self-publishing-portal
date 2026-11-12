import { Fragment } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useContent } from '../content/ContentProvider';

// Plans-page sections, all driven by Admin → Site Content → Pricing Plans.

const isQuote = (price: string) => !/[0-9]/.test(price);

function Cell({ value }: { value: string | undefined }) {
  if (value === '✓') return <Check className="w-5 h-5 text-green-600 mx-auto" aria-label="Included" />;
  if (!value || value === '—') return <span className="text-gray-300">—</span>;
  return <span className={/^add-on/i.test(value) ? 'text-gray-500 italic' : 'text-gray-800'}>{value}</span>;
}

// "Compare all features" — a side-by-side table built from pricing.comparison.
export function PlanComparison() {
  const { pricing } = useContent();
  const plans = pricing.plans;
  if (!pricing.comparison.length) return null;
  return (
    <section id="compare" className="scroll-mt-28 mt-16">
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">{pricing.compareHeading}</h3>
      <p className="text-center text-sm text-gray-500 mb-6">{pricing.gstNote}</p>
      <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="sticky left-0 z-10 bg-white text-left px-4 py-4 w-56 font-semibold text-gray-500">
                What you get
              </th>
              {plans.map((p) => (
                <th key={p.name} className="px-4 py-4 text-center align-bottom">
                  <div className="font-bold text-gray-900 text-base">{p.name}</div>
                  <div className="text-xs text-amber-700 font-semibold mt-0.5">
                    {p.price}
                    {isQuote(p.price) ? '' : ' + GST'}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pricing.comparison.map((g) => (
              <Fragment key={g.group}>
                <tr className="bg-amber-50/70">
                  <td colSpan={plans.length + 1} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                    {g.group}
                  </td>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.label} className="border-b border-gray-100 align-top">
                    <th scope="row" className="sticky left-0 z-10 bg-white text-left px-4 py-3 font-medium text-gray-700">
                      {r.label}
                    </th>
                    {plans.map((p, i) => (
                      <td key={p.name} className="px-4 py-3 text-center leading-snug">
                        <Cell value={r.values[i]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-center text-xs text-gray-400 mt-3 md:hidden">Swipe sideways to see every plan →</p>
    </section>
  );
}

// Add-ons price list, grouped.
export function PlanAddOns() {
  const { pricing } = useContent();
  if (!pricing.addOns.length) return null;
  return (
    <section id="add-ons" className="scroll-mt-28 mt-16">
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">{pricing.addOnsHeading}</h3>
      <p className="text-center text-sm text-gray-500 mb-6 max-w-2xl mx-auto">{pricing.addOnsNote}</p>
      <div className="grid md:grid-cols-2 gap-6">
        {pricing.addOns.map((g) => (
          <div key={g.group} className="bg-white rounded-2xl shadow-lg p-6">
            <h4 className="font-bold text-gray-900 mb-2">{g.group}</h4>
            <ul className="divide-y divide-gray-100">
              {g.items.map((it) => (
                <li key={it.name} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{it.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{it.desc}</p>
                  </div>
                  <span className="flex-shrink-0 max-w-[45%] text-right text-sm font-semibold text-amber-700">
                    {it.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// Plans / payment / policy FAQ.
export function PlanFaq() {
  const { pricing } = useContent();
  if (!pricing.faqs.length) return null;
  return (
    <section id="plan-faq" className="scroll-mt-28 mt-16 max-w-3xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6">{pricing.faqHeading}</h3>
      <div className="space-y-3">
        {pricing.faqs.map((f, i) => (
          <details key={i} className="group bg-white rounded-2xl border border-gray-200 p-5">
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="font-semibold text-gray-900">{f.question}</span>
              <ChevronDown className="w-5 h-5 text-amber-700 flex-shrink-0 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-gray-600 mt-3 leading-relaxed">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
