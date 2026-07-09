import { useEffect, useState } from 'react';
import { X, ArrowRight, ArrowLeft, ShoppingCart } from 'lucide-react';

// A gentle, self-paced walkthrough of the Book Customizer, written as if we're
// sitting beside a first-time author who has never published before and walking
// them through it one step at a time. Nothing moves on its own: the reader taps
// a sample choice to feel the price update, then presses Next when *they* are
// ready. Each step mirrors a real section on the page below.
interface Step {
  icon: string;
  name: string;
  plain: string;
  teach: string;
  options: { label: string; add: number }[];
}

const STEPS: Step[] = [
  {
    icon: '📄',
    name: 'Paper',
    plain: 'What should the pages feel like?',
    teach: 'GSM just means how thick the paper is. 70 GSM is the normal, included choice for novels. Heavier paper feels more premium and costs a little more.',
    options: [
      { label: '70 GSM Cream (included)', add: 0 },
      { label: '90 GSM Premium Cream', add: 600 },
      { label: '130 GSM Art Paper', add: 1200 },
    ],
  },
  {
    icon: '🎨',
    name: 'Cover',
    plain: 'How should the cover look?',
    teach: 'The standard cover is clean and free. Special finishes like a matte laminate or metallic foil add a premium, gift-worthy touch.',
    options: [
      { label: 'Standard (included)', add: 0 },
      { label: 'Matte finish', add: 500 },
      { label: 'Foil stamping', add: 3500 },
    ],
  },
  {
    icon: '📐',
    name: 'Inside layout',
    plain: 'How should the words sit on the page?',
    teach: 'Almost every novel uses a single column — that is included. Pictures and custom designs cost more because they take design work.',
    options: [
      { label: 'Single column (included)', add: 0 },
      { label: 'Two columns', add: 1000 },
      { label: 'With pictures', add: 3000 },
    ],
  },
  {
    icon: '📏',
    name: 'Book size',
    plain: 'How big should the book be?',
    teach: 'This is the physical size of the book. Demy is the classic novel size and a safe default. Sizes are included — pick what fits your book.',
    options: [
      { label: 'Demy — novel size', add: 0 },
      { label: 'Royal — all-rounder', add: 0 },
      { label: 'Double Demy — large', add: 0 },
    ],
  },
  {
    icon: '🌈',
    name: 'Colour inside',
    plain: 'Black & white, or full colour?',
    teach: 'This is the colour of the inside pages, not the cover. Black & white is included and perfect for text. Full colour is for photos and illustrations.',
    options: [
      { label: 'Black & white (included)', add: 0 },
      { label: 'Full colour', add: 2500 },
    ],
  },
  {
    icon: '📚',
    name: 'Binding',
    plain: 'Soft cover or hard cover?',
    teach: 'Paperback (softback) is the lighter, included choice. Hardback has a stiff cover — more durable and premium, and it lasts for years.',
    options: [
      { label: 'Paperback (included)', add: 0 },
      { label: 'Hardback', add: 1500 },
    ],
  },
];

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CustomizeGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (dontShowAgain: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  // Which sample option the reader tapped on each step (defaults to the first,
  // included option) — drives the running example add-ons total.
  const [picks, setPicks] = useState<number[]>(() => STEPS.map(() => 0));
  const [dontShow, setDontShow] = useState(false);

  // Reset to the beginning each time the walkthrough is opened.
  useEffect(() => {
    if (open) {
      setStep(0);
      setComplete(false);
      setPicks(STEPS.map(() => 0));
    }
  }, [open]);

  if (!open) return null;

  const close = () => onClose(dontShow);
  const cur = STEPS[step];
  const addonTotal = picks.reduce((sum, optIdx, i) => sum + (STEPS[i].options[optIdx]?.add ?? 0), 0);
  const isLast = step === STEPS.length - 1;

  const setPick = (optIdx: number) => setPicks((p) => p.map((v, i) => (i === step ? optIdx : v)));
  const next = () => (isLast ? setComplete(true) : setStep((s) => Math.min(s + 1, STEPS.length - 1)));
  const back = () => (complete ? setComplete(false) : setStep((s) => Math.max(s - 1, 0)));

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={close}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 sm:p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl">
            ✍️
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Let’s design your book together</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Take it one step at a time. Tap a choice to see how the price changes, then press <strong>Next</strong> when
          you’re ready. Nothing is final here — it’s just to show you how it works.
        </p>

        {/* progress dots */}
        <div className="flex justify-center gap-2 mb-5">
          {STEPS.map((s, i) => {
            const done = complete || i < step;
            const now = !complete && i === step;
            return (
              <div
                key={s.name}
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300 ${
                  done ? 'bg-green-500 text-white' : now ? 'bg-amber-500 text-white scale-110 shadow' : 'bg-gray-200 text-gray-400'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
            );
          })}
        </div>

        {complete ? (
          <div className="text-center py-3">
            <div className="text-6xl mb-2">🎉</div>
            <h3 className="text-xl font-extrabold text-gray-900">That’s it — you know how it works!</h3>
            <p className="text-gray-500 mt-1">
              Now do it for real below. The standard choice in each section is free; only upgrades add to your
              add-ons subtotal, which joins your plan at checkout.
            </p>
          </div>
        ) : (
          <div className="text-center min-h-[240px]">
            <div className="text-[11px] font-bold uppercase tracking-wide text-amber-600 mb-1">
              Step {step + 1} of {STEPS.length}
            </div>
            <div className="text-5xl mb-1">{cur.icon}</div>
            <h3 className="text-xl font-extrabold text-gray-900">{cur.name}</h3>
            <p className="text-gray-500">{cur.plain}</p>

            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap py-4">
              {cur.options.map((opt, i) => {
                const chosen = picks[step] === i;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setPick(i)}
                    className={`relative rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all duration-200 ${
                      chosen
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-md'
                        : 'border-gray-200 text-gray-600 hover:border-amber-300'
                    }`}
                  >
                    {opt.label}
                    <span className={`block text-xs font-semibold mt-0.5 ${opt.add > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {opt.add > 0 ? `+${inr(opt.add)}` : 'included'}
                    </span>
                    {chosen && (
                      <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-green-500 text-white text-[11px] flex items-center justify-center shadow">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-xl p-3 text-left">
              💡 {cur.teach}
            </p>
          </div>
        )}

        {/* running example total */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="flex flex-col bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 min-w-[150px]">
            <span className="text-[10px] uppercase tracking-wide text-amber-700 font-bold">Example add-ons so far</span>
            <span className="text-2xl font-extrabold text-orange-900 tabular-nums">
              {addonTotal > 0 ? `+${inr(addonTotal)}` : inr(0)}
            </span>
          </div>
          {complete && (
            <div className="ml-auto inline-flex items-center gap-2 bg-gradient-to-br from-amber-600 to-orange-600 text-white font-extrabold text-sm px-5 py-3 rounded-full shadow-md">
              <ShoppingCart className="w-4 h-4" /> Combine with your plan at checkout
            </div>
          )}
        </div>

        {/* navigation — fully manual */}
        <div className="flex items-center justify-between gap-3 mt-5">
          <button
            onClick={back}
            disabled={step === 0 && !complete}
            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {complete ? (
            <button
              onClick={close}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800"
            >
              Got it — let’s start
            </button>
          ) : (
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700"
            >
              {isLast ? 'Finish' : 'Next'} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            Don’t show this again
          </label>
          <button onClick={close} className="text-sm font-semibold text-gray-400 hover:text-gray-700">
            Skip the tour
          </button>
        </div>
      </div>
    </div>
  );
}
