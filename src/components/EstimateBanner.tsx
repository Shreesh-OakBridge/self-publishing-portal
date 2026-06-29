import { Calculator, ArrowRight } from 'lucide-react';
import { go } from '../lib/basePath';
import { track } from '../lib/track';

// Aesthetic homepage band promoting the Planner → Instant Estimate flow.
// Sits just above the Contact section (the contact form stays in place).
export default function EstimateBanner() {
  const open = () => {
    track('click_event', { label: 'estimate_banner' });
    go('/planner');
  };
  return (
    <section id="estimate" className="py-14 md:py-16 px-4">
      <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-amber-900 text-white p-8 md:p-12 text-center relative overflow-hidden">
        {/* soft decorative glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-amber-200 text-sm font-semibold mb-4">
            <Calculator className="w-4 h-4" /> 60-second estimate
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Not sure where to start?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">
            Answer a few quick questions and get an instant estimate — your budget range, timeline, and the
            plan that best fits your book. No forms, no commitment.
          </p>
          <button
            onClick={open}
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-7 py-3.5 rounded-full font-bold hover:bg-amber-50 transition-colors shadow-lg"
          >
            Get my instant estimate <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
