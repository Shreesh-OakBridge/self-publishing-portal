import { useEffect, useMemo, useState } from 'react';
import {
  FileText, Image as ImageIcon, ScrollText, Search, Palette, Lightbulb,
  Edit3, BookOpen, Globe, Megaphone, Clock, Tag, ArrowRight, ArrowLeft, RotateCcw, CheckCircle,
} from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { useAuth } from '../lib/auth';
import { go } from '../lib/basePath';
import { track } from '../lib/track';
import TalkToUsModal from './TalkToUsModal';

const priceToNumber = (p: string) => Number((p || '').replace(/[^0-9.]/g, '')) || 0;
const isQuote = (p: string) => !/[0-9]/.test(p || '');
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Indicative per-copy printing rates (₹). Deliberately conservative and clearly
// labelled as an estimate — the final quote is always confirmed by the team.
// Referenced against typical Indian print-on-demand pricing.
const PRINT = {
  bwPerPage: 0.6,
  colourPerPage: 4,
  hardbackPerCopy: 120,
  handlingPerCopy: 15,
};

const HAVE = [
  { key: 'manuscript', label: 'Finished manuscript', icon: FileText },
  { key: 'photos', label: 'Photos', icon: ImageIcon },
  { key: 'recipes', label: 'Recipes', icon: ScrollText },
  { key: 'research', label: 'Research', icon: Search },
  { key: 'artwork', label: 'Artwork', icon: Palette },
  { key: 'idea', label: 'Just an idea', icon: Lightbulb },
];

const HELP = [
  { key: 'editing', label: 'Editing & proofreading', icon: Edit3 },
  { key: 'design', label: 'Cover & interior design', icon: Palette },
  { key: 'illustration', label: 'Illustration', icon: ImageIcon },
  { key: 'printing', label: 'Printing & binding', icon: BookOpen },
  { key: 'distribution', label: 'Distribution & listing', icon: Globe },
  { key: 'marketing', label: 'Marketing', icon: Megaphone },
];

const TIMELINES = [
  { key: 'urgent', label: 'Urgent', note: '~3–4 weeks (rush)' },
  { key: '1month', label: 'About a month', note: '~4–6 weeks' },
  { key: 'flexible', label: 'Flexible', note: '~6–10 weeks' },
];

const LAST_STEP = 6; // 1–5 = questions, 6 = estimate

export default function Planner() {
  const { journeys, pricing } = useContent();
  const params = new URLSearchParams(window.location.search);
  const journeySlug = params.get('journey');
  const journey = journeys.items.find((j) => j.slug === journeySlug);

  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [have, setHave] = useState<string[]>([]);
  const [help, setHelp] = useState<string[]>([]);
  const [pages, setPages] = useState(200);
  const [colour, setColour] = useState<'bw' | 'colour'>('bw');
  const [binding, setBinding] = useState<'paperback' | 'hardback'>('paperback');
  const [copies, setCopies] = useState(100);
  const [timeline, setTimeline] = useState('flexible');
  const [talkOpen, setTalkOpen] = useState(false);

  useEffect(() => {
    track('view', { page: 'planner', journey: journeySlug ?? null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  // ── estimate model (heuristic; final price always confirmed by our team) ──
  const estimate = useMemo(() => {
    const plans = pricing.plans;
    // More services needed → higher-tier plan.
    const idx = Math.min(help.length <= 1 ? 0 : help.length === 2 ? 1 : help.length <= 4 ? 2 : 3, plans.length - 1);
    const plan = plans[Math.max(0, idx)];
    const planIsQuote = !plan || isQuote(plan.price);
    const base = planIsQuote ? 0 : priceToNumber(plan.price);

    // Printing only counts if the author wants us to print & bind.
    const wantsPrint = help.includes('printing');
    const perPage = colour === 'colour' ? PRINT.colourPerPage : PRINT.bwPerPage;
    const perCopy = pages * perPage + (binding === 'hardback' ? PRINT.hardbackPerCopy : 0) + PRINT.handlingPerCopy;
    const printing = wantsPrint && copies > 0 ? Math.round(copies * perCopy) : 0;

    const subtotal = base + printing;
    const low = subtotal;
    const high = Math.round(subtotal * 1.2);
    const tl = TIMELINES.find((t) => t.key === timeline)?.note || '';
    return { plan, planIsQuote, base, printing, low, high, tl, wantsPrint };
  }, [help, copies, pages, colour, binding, timeline, pricing.plans]);

  const next = () => setStep((s) => Math.min(LAST_STEP, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const reset = () => {
    setHave([]); setHelp([]); setPages(200); setColour('bw'); setBinding('paperback');
    setCopies(100); setTimeline('flexible'); setStep(1);
  };

  const seeEstimate = () => {
    track('planner_complete', {
      journey: journeySlug ?? null,
      help: help.join(','),
      pages,
      colour,
      binding,
      copies,
      timeline,
      plan: estimate.plan?.name ?? null,
    });
    setStep(LAST_STEP);
  };

  const startPlan = () => {
    track('get_started', { source: 'planner', plan: estimate.plan?.name ?? null, journey: journeySlug ?? null });
    if (estimate.planIsQuote) {
      go(`/quote?plan=${encodeURIComponent(estimate.plan?.name || '')}`);
    } else {
      go(`/checkout?plan=${encodeURIComponent(estimate.plan?.name || '')}`);
    }
  };

  const chip = (active: boolean) =>
    `flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
      active ? 'border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-300' : 'border-gray-300 text-gray-700 hover:border-amber-300'
    }`;

  const field = 'w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all';

  return (
    <section className="py-10 md:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Get a price estimate</h1>
          <p className="text-gray-600">
            {journey ? `For your ${journey.title.toLowerCase()} — a` : 'A'}nswer a few quick questions for an instant estimate. No commitment.
          </p>
        </div>

        {step < LAST_STEP && (
          <>
            {/* progress */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-amber-500' : 'bg-gray-200'}`} />
              ))}
            </div>

            <div className="bg-white rounded-2xl border p-6 md:p-8 min-h-[280px]">
              {step === 1 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">What do you already have?</h2>
                  <p className="text-gray-500 text-sm mb-5">Select all that apply.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {HAVE.map(({ key, label, icon: Icon }) => (
                      <button key={key} onClick={() => toggle(have, setHave, key)} className={chip(have.includes(key))}>
                        <Icon className="w-4 h-4 flex-shrink-0" /> {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">What help do you need?</h2>
                  <p className="text-gray-500 text-sm mb-5">Pick everything you’d like us to handle.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {HELP.map(({ key, label, icon: Icon }) => (
                      <button key={key} onClick={() => toggle(help, setHelp, key)} className={chip(help.includes(key))}>
                        <Icon className="w-4 h-4 flex-shrink-0" /> {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">A few book details</h2>
                  <p className="text-gray-500 text-sm mb-5">These shape your printing estimate — a rough idea is fine.</p>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 text-sm">Approximate page count</label>
                      <input
                        type="number"
                        min={1}
                        value={pages}
                        onChange={(e) => setPages(Math.max(1, Number(e.target.value) || 0))}
                        className={field}
                        placeholder="200"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 text-sm">Interior colour</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setColour('bw')} className={chip(colour === 'bw')}>Black &amp; white</button>
                        <button onClick={() => setColour('colour')} className={chip(colour === 'colour')}>Full colour</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 text-sm">Binding</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setBinding('paperback')} className={chip(binding === 'paperback')}>Paperback</button>
                        <button onClick={() => setBinding('hardback')} className={chip(binding === 'hardback')}>Hardback</button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">How many copies?</h2>
                  <p className="text-gray-500 text-sm mb-6">Drag the slider or type an exact number — you can change it later.</p>
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <input
                      type="number"
                      min={1}
                      value={copies}
                      onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 0))}
                      className="w-32 text-center text-2xl font-bold text-amber-700 border-2 border-amber-200 rounded-xl py-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                    />
                    <span className="text-gray-500">copies</span>
                  </div>
                  <input
                    type="range" min={1} max={5000} step={1} value={Math.min(copies, 5000)}
                    onChange={(e) => setCopies(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2"><span>1</span><span>5000+</span></div>
                  <p className="text-xs text-gray-400 mt-3 text-center">Larger print runs lower the per-copy cost.</p>
                </>
              )}

              {step === 5 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">What’s your timeline?</h2>
                  <p className="text-gray-500 text-sm mb-5">This helps us recommend the right path.</p>
                  <div className="space-y-3">
                    {TIMELINES.map(({ key, label, note }) => (
                      <button key={key} onClick={() => setTimeline(key)} className={`${chip(timeline === key)} w-full justify-between`}>
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {label}</span>
                        <span className="text-xs text-gray-500">{note}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={back}
                disabled={step === 1}
                className="inline-flex items-center gap-1 px-4 py-2 text-gray-600 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              {step < 5 ? (
                <button
                  onClick={next}
                  className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-700"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={seeEstimate}
                  className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-700"
                >
                  See my estimate <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}

        {step === LAST_STEP && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-amber-600 to-orange-600 text-white rounded-3xl p-8 text-center">
              <p className="uppercase tracking-wide text-white/80 text-xs mb-2">Indicative estimate</p>
              {estimate.planIsQuote ? (
                <>
                  <p className="text-4xl md:text-5xl font-bold mb-2">Custom quote</p>
                  {estimate.printing > 0 && (
                    <p className="text-white/90 text-sm mb-1">
                      Printing alone ≈ {inr(estimate.printing)} for {copies >= 5000 ? '5000+' : copies} copies
                    </p>
                  )}
                </>
              ) : (
                <p className="text-4xl md:text-5xl font-bold mb-2">
                  {inr(estimate.low)} – {inr(estimate.high)}
                </p>
              )}
              <p className="text-white/90 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" /> {estimate.tl}
              </p>
            </div>

            <div className="bg-white rounded-2xl border p-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">Recommended plan: {estimate.plan?.name}</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Based on your selections, the <strong>{estimate.plan?.name}</strong> plan ({estimate.plan?.price}) is the best fit.
                {estimate.printing > 0 && ` A print run of ${copies >= 5000 ? '5000+' : copies} copies (${pages} pages, ${colour === 'colour' ? 'full colour' : 'black & white'}, ${binding}) is included in the figures above.`}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                  <div className="text-gray-400 text-xs">Pages</div>
                  <div className="font-semibold text-gray-800">{pages}</div>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                  <div className="text-gray-400 text-xs">Interior</div>
                  <div className="font-semibold text-gray-800">{colour === 'colour' ? 'Full colour' : 'B&amp;W'}</div>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                  <div className="text-gray-400 text-xs">Binding</div>
                  <div className="font-semibold text-gray-800 capitalize">{binding}</div>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                  <div className="text-gray-400 text-xs">Copies</div>
                  <div className="font-semibold text-gray-800">{copies >= 5000 ? '5000+' : copies}</div>
                </div>
              </div>

              {help.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {help.map((k) => {
                    const h = HELP.find((x) => x.key === k);
                    return (
                      <span key={k} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> {h?.label}
                      </span>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                This is an indicative estimate. Your final quote is confirmed by our team after we review your project.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <button onClick={startPlan} className="bg-amber-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-amber-700">
                {estimate.planIsQuote ? `Request ${estimate.plan?.name} quote` : `Start with ${estimate.plan?.name}`}
              </button>
              <button onClick={() => go('/quote')} className="border border-gray-300 text-gray-700 px-5 py-3 rounded-xl font-semibold hover:bg-gray-50">
                Get a detailed quote
              </button>
              <button onClick={() => setTalkOpen(true)} className="border border-gray-300 text-gray-700 px-5 py-3 rounded-xl font-semibold hover:bg-gray-50">
                Talk to us
              </button>
            </div>

            <div className="text-center">
              <button onClick={reset} className="inline-flex items-center gap-1 text-gray-500 text-sm hover:text-gray-700">
                <RotateCcw className="w-4 h-4" /> Start over
              </button>
            </div>
          </div>
        )}
      </div>

      <TalkToUsModal
        open={talkOpen}
        onClose={() => setTalkOpen(false)}
        plan={estimate.plan?.name ?? null}
        name={(user?.user_metadata?.full_name as string) || ''}
        email={user?.email ?? ''}
        context={[
          journey ? `Journey: ${journey.title}` : '',
          `Already has: ${have.map((k) => HAVE.find((x) => x.key === k)?.label).filter(Boolean).join(', ') || '—'}`,
          `Help needed: ${help.map((k) => HELP.find((x) => x.key === k)?.label).filter(Boolean).join(', ') || '—'}`,
          `Book: ${pages} pages, ${colour === 'colour' ? 'full colour' : 'black & white'}, ${binding}`,
          `Copies: ${copies >= 5000 ? '5000+' : copies}`,
          `Timeline: ${TIMELINES.find((t) => t.key === timeline)?.label || timeline}`,
          estimate.plan ? `Recommended plan: ${estimate.plan.name} (${estimate.plan.price})` : '',
          estimate.planIsQuote
            ? `Indicative: Custom quote${estimate.printing > 0 ? ` + printing ≈ ${inr(estimate.printing)}` : ''}`
            : `Indicative estimate: ${inr(estimate.low)} – ${inr(estimate.high)}`,
        ]
          .filter(Boolean)
          .join('\n')}
      />
    </section>
  );
}
