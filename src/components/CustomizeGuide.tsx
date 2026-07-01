import { useEffect, useState } from 'react';
import { X, ShoppingCart } from 'lucide-react';

// One-at-a-time, plain-language walkthrough of the Book Customizer. Each step
// shows a big icon, a simple question, a few sample choices — then a finger taps
// one and the price visibly ticks up, so the cause-and-effect is obvious to
// anyone (child or grandparent). Loops until dismissed.
const BASE = 6999;
const STEPS = [
  { icon: '📄', name: 'Paper', plain: 'What should the pages feel like?', options: ['Glossy', 'Matte', 'Cream'], pick: 1, add: 500 },
  { icon: '🎨', name: 'Cover', plain: 'How should the cover look?', options: ['Simple', 'Shiny foil', 'Textured'], pick: 1, add: 2999 },
  { icon: '📐', name: 'Inside layout', plain: 'How should the words sit on the page?', options: ['One column', 'Two columns', 'With pictures'], pick: 0, add: 1000 },
  { icon: '📏', name: 'Book size', plain: 'How big should the book be?', options: ['Pocket', 'Standard', 'Large'], pick: 1, add: 800 },
  { icon: '🌈', name: 'Colour inside', plain: 'Black & white, or full colour?', options: ['Black & white', 'Full colour'], pick: 1, add: 2500 },
  { icon: '📚', name: 'Binding', plain: 'Soft cover or hard cover?', options: ['Paperback', 'Hardcover'], pick: 1, add: 1500 },
];

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CustomizeGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (dontShowAgain: boolean) => void;
}) {
  const [step, setStep] = useState(0); // 0..5
  const [picked, setPicked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const close = () => onClose(dontShow);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const clearAll = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };
    const run = () => {
      clearAll();
      const at = (ms: number, fn: () => void) => timers.push(setTimeout(() => active && fn(), ms));
      at(0, () => {
        setComplete(false);
        setStep(0);
        setPicked(false);
      });
      let t = 500;
      for (let i = 0; i < STEPS.length; i++) {
        const enter = t;
        at(enter, () => {
          setComplete(false);
          setStep(i);
          setPicked(false);
        });
        at(enter + 900, () => setPicked(true)); // the "tap" → price bump
        t = enter + 1900;
      }
      at(t, () => setComplete(true));
      at(t + 3400, run); // loop
    };
    run();
    return () => {
      active = false;
      clearAll();
    };
  }, [open]);

  if (!open) return null;

  const cur = STEPS[step];
  // Running estimate: base + everything picked so far.
  const total =
    BASE + STEPS.reduce((sum, s, i) => sum + (i < step || (i === step && picked) || complete ? s.add : 0), 0);

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={close}>
      <style>{`
        @keyframes cgPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes cgBump{0%,100%{transform:scale(1)}40%{transform:scale(1.2)}}
        @keyframes cgTap{0%{transform:translateY(-10px);opacity:0}45%{transform:translateY(4px);opacity:1}100%{transform:translateY(0);opacity:1}}
        @keyframes cgPop{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
      `}</style>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 sm:p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl">
            ✍️
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Design your book in 6 easy taps</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Watch how it works: you tap a choice, the price updates, and you move on. That’s the whole thing.
        </p>

        {/* progress dots — where you are in the six steps */}
        <div className="flex justify-center gap-2 mb-5">
          {STEPS.map((s, i) => {
            const done = i < step || complete;
            const now = i === step && !complete;
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

        {/* stage */}
        {complete ? (
          <div className="text-center py-3" style={{ animation: 'cgPop .4s ease' }}>
            <div className="text-6xl mb-2">🎉</div>
            <h3 className="text-xl font-extrabold text-gray-900">That’s it — your book is ready to order!</h3>
            <p className="text-gray-500 mt-1">Six simple taps, done. You can change any choice any time.</p>
          </div>
        ) : (
          <div className="text-center min-h-[210px]">
            <div className="text-[11px] font-bold uppercase tracking-wide text-amber-600 mb-1">Step {step + 1} of 6</div>
            <div className="text-5xl mb-1" style={{ animation: 'cgPop .35s ease' }}>{cur.icon}</div>
            <h3 className="text-xl font-extrabold text-gray-900">{cur.name}</h3>
            <p className="text-gray-500">{cur.plain}</p>
            <p className={`text-xs font-semibold mb-6 mt-1 ${picked ? 'text-green-600' : 'text-amber-600'}`}>
              {picked ? '✓ Picked! See the price below' : '👆 Just tap one'}
            </p>

            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap pb-6">
              {cur.options.map((opt, i) => {
                const chosen = picked && i === cur.pick;
                return (
                  <div
                    key={opt}
                    className={`relative rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all duration-300 ${
                      chosen
                        ? 'border-amber-500 bg-amber-50 text-amber-800 scale-110 shadow-md'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {opt}
                    {chosen && (
                      <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-green-500 text-white text-[11px] flex items-center justify-center shadow" style={{ animation: 'cgPop .3s ease' }}>
                        ✓
                      </span>
                    )}
                    {chosen && (
                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2">
                        <span className="block text-2xl" style={{ animation: 'cgTap .6s ease' }}>👆</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* live price + checkout — the payoff */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex flex-col bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 min-w-[150px]">
            <span className="text-[10px] uppercase tracking-wide text-amber-700 font-bold">Your price so far</span>
            <span key={total} className="text-2xl font-extrabold text-orange-900 tabular-nums" style={{ animation: picked || complete ? 'cgBump .5s ease' : undefined }}>
              {inr(total)}
            </span>
          </div>
          <div
            className="ml-auto inline-flex items-center gap-2 bg-gradient-to-br from-amber-600 to-orange-600 text-white font-extrabold text-sm px-5 py-3 rounded-full shadow-md"
            style={complete ? { animation: 'cgPulse 1.1s ease infinite' } : undefined}
          >
            <ShoppingCart className="w-4 h-4" /> Save &amp; Checkout
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          The price is just an example. On the real page you make the choices — it adds up live.
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
          <button onClick={close} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800">
            Got it — let’s start
          </button>
        </div>
      </div>
    </div>
  );
}
