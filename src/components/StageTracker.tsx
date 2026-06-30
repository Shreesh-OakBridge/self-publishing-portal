import { Check } from 'lucide-react';
import { PRODUCTION_STAGES, stageIndex } from '../lib/productionStages';

// Visual progress stepper for an order's production stage.
// Horizontal on desktop, vertical timeline on mobile.
export default function StageTracker({ stageKey }: { stageKey: string | null | undefined }) {
  const current = Math.max(0, stageIndex(stageKey));
  const dot = (done: boolean, active: boolean, n: number) => (
    <span
      className={`flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 w-6 h-6 ${
        done
          ? 'bg-amber-500 text-white'
          : active
          ? 'bg-amber-600 text-white ring-4 ring-amber-100'
          : 'bg-gray-200 text-gray-500'
      }`}
    >
      {done ? <Check className="w-3.5 h-3.5" /> : n + 1}
    </span>
  );

  return (
    <div>
      {/* Desktop: horizontal */}
      <ol className="hidden md:flex items-start">
        {PRODUCTION_STAGES.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.key} className="flex-1 flex flex-col items-center text-center relative px-1">
              {i > 0 && (
                <span
                  className={`absolute top-3 right-1/2 left-[-50%] h-0.5 ${
                    i <= current ? 'bg-amber-500' : 'bg-gray-200'
                  }`}
                />
              )}
              <span className="relative z-10">{dot(done, active, i)}</span>
              <span
                className={`mt-2 text-xs leading-tight ${
                  active ? 'text-amber-700 font-semibold' : done ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile: vertical timeline */}
      <ol className="md:hidden">
        {PRODUCTION_STAGES.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const last = i === PRODUCTION_STAGES.length - 1;
          return (
            <li key={s.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                {dot(done, active, i)}
                {!last && (
                  <span className={`w-0.5 flex-1 min-h-[16px] ${i < current ? 'bg-amber-500' : 'bg-gray-200'}`} />
                )}
              </div>
              <span
                className={`pb-4 text-sm ${
                  active ? 'text-amber-700 font-semibold' : done ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
