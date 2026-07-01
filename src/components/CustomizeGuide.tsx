import { useEffect, useState } from 'react';
import { X, ArrowRight, ShoppingCart } from 'lucide-react';

const STEPS = [
  { icon: '📄', label: 'Paper Type', desc: 'Choose your paper stock' },
  { icon: '🎨', label: 'Cover Design', desc: 'Pick a cover style' },
  { icon: '📐', label: 'Layout', desc: 'Set the interior layout' },
  { icon: '📏', label: 'Book Size', desc: 'Choose the trim size' },
  { icon: '🌈', label: 'Interior Color', desc: 'B&W or full colour' },
  { icon: '📚', label: 'Binding', desc: 'Paperback or hardcover' },
];
// Illustrative running estimate (index = number of choices made).
const PRICES = ['₹0', '₹4,500', '₹7,200', '₹9,800', '₹12,400', '₹14,900', '₹16,500'];

// Animated, looping walkthrough of the Customize page. Shown from a
// "How it works?" button and once automatically for first-time visitors.
export default function CustomizeGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (dontShowAgain: boolean) => void;
}) {
  const [step, setStep] = useState(0); // 0..6 (6 = complete)
  const [dontShow, setDontShow] = useState(false);
  const close = () => onClose(dontShow);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let s = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!active) return;
      setStep(s);
      if (s >= 6) {
        timer = setTimeout(() => {
          s = 0;
          tick();
        }, 3200);
      } else {
        s += 1;
        timer = setTimeout(tick, 1250);
      }
    };
    timer = setTimeout(tick, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open]);

  if (!open) return null;
  const complete = step >= 6;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
      onClick={close}
    >
      <style>{`@keyframes cgPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}`}</style>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 sm:p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl">
            ✍️
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Customize Your Book — How It Works</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Pick an option in each of the six steps — your price updates live — then save &amp; check out.
        </p>

        {/* progress */}
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* steps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step && !complete;
            return (
              <div
                key={s.label}
                className={`relative rounded-2xl border p-3 transition-all duration-300 ${
                  active
                    ? 'border-amber-500 shadow-lg -translate-y-0.5 opacity-100'
                    : done
                    ? 'border-gray-200 opacity-100'
                    : 'border-gray-200 opacity-50'
                }`}
              >
                <span className={`absolute top-2 right-2.5 text-[11px] font-extrabold ${active ? 'text-orange-600' : 'text-gray-300'}`}>
                  {done ? '✓' : i + 1}
                </span>
                <div className="text-2xl">{s.icon}</div>
                <div className="font-bold text-sm text-gray-900 mt-1.5">{s.label}</div>
                <div className="text-[11px] text-gray-500 leading-snug mt-0.5">{s.desc}</div>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <div className="flex flex-col bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 min-w-[140px]">
            <span className="text-[10px] uppercase tracking-wide text-amber-700 font-bold">Live estimate</span>
            <span className="text-xl font-bold text-orange-900 tabular-nums">{PRICES[Math.min(step, 6)]}</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300" />
          <div
            className="ml-auto inline-flex items-center gap-2 bg-gradient-to-br from-amber-600 to-orange-600 text-white font-extrabold text-sm px-5 py-3 rounded-full shadow-md"
            style={complete ? { animation: 'cgPulse 1.1s ease infinite' } : undefined}
          >
            <ShoppingCart className="w-4 h-4" /> Save &amp; Checkout
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Tip: you can change any choice before checkout — the estimate recalculates instantly.
        </p>

        <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            Don’t show this again
          </label>
          <button
            onClick={close}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800"
          >
            Got it — let’s customize
          </button>
        </div>
      </div>
    </div>
  );
}
