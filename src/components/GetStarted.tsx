import { useState } from 'react';
import { Check, Users, Laptop, ArrowRight } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { useAuth } from '../lib/auth';
import { resolveServiceIcon } from '../lib/serviceIcons';
import { go } from '../lib/basePath';
import { track } from '../lib/track';
import AuthModal from './AuthModal';

// Unified onboarding funnel: (optional) journey intent → language →
// manuscript status → publish method. Selections are stashed in sessionStorage
// so the destination + checkout can record them. Logged-out users are prompted
// to log in / sign up after selecting; their selection is preserved and applied
// once they authenticate. This is the single "start here" experience — the old
// /journeys browse page now folds in here as the first (optional) step, while
// the rich /journey/<slug> detail pages remain reachable via "Learn more".
export default function GetStarted() {
  const { getStarted: g, journeys } = useContent();
  const { user } = useAuth();
  // A journey may be pre-selected when arriving from a /journey/<slug> page.
  const [journey, setJourney] = useState(() => {
    try {
      return sessionStorage.getItem('ob_journey') || '';
    } catch {
      return '';
    }
  });
  const [language, setLanguage] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState<'expert' | 'self' | ''>('');
  const [authOpen, setAuthOpen] = useState(false);

  // Journey is an optional intent hint — the funnel only requires the three
  // qualifying answers below.
  const ready = language && status && method;

  // Expert → dedicated plans page with Expert view preselected (choose a
  // package); Self → book customizer.
  const destination = () => (method === 'expert' ? '/plans?plan=expert' : '/customize');

  const proceed = () => {
    if (!ready) return;
    try {
      sessionStorage.setItem(
        'ob_onboarding',
        JSON.stringify({ journey, language, manuscript_status: status, publish_path: method })
      );
    } catch {
      /* ignore */
    }
    track('get_started', {
      journey,
      language,
      manuscript_status: status,
      publish_path: method,
    });
    // Logged in → continue straight to the chosen path. Logged out → prompt to
    // log in / sign up first; the selection (already stashed) is applied after.
    if (user) go(destination());
    else setAuthOpen(true);
  };

  const Radio = ({
    checked,
    label,
    onClick,
  }: {
    checked: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 text-left transition-colors ${
        checked ? 'text-amber-700 font-semibold' : 'text-gray-700 hover:text-amber-700'
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          checked ? 'border-amber-600 bg-amber-600' : 'border-gray-400'
        }`}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  );

  return (
    <section className="py-14 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{g.heading}</h1>
          <p className="text-gray-600">{g.subheading}</p>
        </div>

        {/* Journey intent (optional) — folds in the old "Choose Your Journey" page */}
        {journeys.items.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{journeys.heading}</h2>
            <p className="text-sm text-gray-500 mb-4">
              {journeys.subheading} <span className="text-gray-400">(optional)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {journeys.items.map((j, i) => {
                const Icon = resolveServiceIcon(j.icon, i);
                const selected = journey === j.slug;
                return (
                  <div
                    key={j.slug}
                    role="button"
                    tabIndex={0}
                    onClick={() => setJourney(selected ? '' : j.slug)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setJourney(selected ? '' : j.slug);
                      }
                    }}
                    className={`cursor-pointer text-left rounded-2xl border-2 p-4 transition-all ${
                      selected
                        ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/40'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm">{j.title}</h3>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{j.tagline}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            track('click_event', { label: 'journey_learn_more', journey: j.slug });
                            go(`/journey/${j.slug}`);
                          }}
                          className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold mt-2 hover:text-amber-900"
                        >
                          Learn more <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Language */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {g.languageHeading} <span className="text-red-500">*</span>
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {g.languages.map((l) => (
              <Radio key={l} checked={language === l} label={l} onClick={() => setLanguage(l)} />
            ))}
          </div>
        </div>

        {/* Manuscript status */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {g.statusHeading} <span className="text-red-500">*</span>
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {g.statuses.map((s) => (
              <Radio key={s} checked={status === s} label={s} onClick={() => setStatus(s)} />
            ))}
          </div>
        </div>

        {/* Publish method */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {g.methodHeading} <span className="text-red-500">*</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Expert */}
            <button
              type="button"
              onClick={() => setMethod('expert')}
              className={`text-left rounded-2xl border-2 p-6 transition-all ${
                method === 'expert'
                  ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/40'
                  : 'border-gray-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{g.expertTitle}</h3>
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-sm text-gray-500 mb-4">{g.expertTagline}</p>
              <ul className="space-y-2">
                {g.expertPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </button>

            {/* Self */}
            <button
              type="button"
              onClick={() => setMethod('self')}
              className={`text-left rounded-2xl border-2 p-6 transition-all ${
                method === 'self'
                  ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/40'
                  : 'border-gray-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{g.selfTitle}</h3>
                <Laptop className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-sm text-gray-500 mb-4">{g.selfTagline}</p>
              <ul className="space-y-2">
                {g.selfPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={proceed}
            disabled={!ready}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {g.ctaLabel}
            <ArrowRight className="w-5 h-5" />
          </button>
          {!ready ? (
            <p className="text-sm text-gray-400 mt-3">
              Please select a language, your manuscript status, and a publishing option to continue.
            </p>
          ) : (
            !user && (
              <p className="text-sm text-gray-500 mt-3">
                You’ll be asked to log in or create a free account to continue — your selection is saved.
              </p>
            )
          )}
        </div>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => go(destination())}
        redirectPath={destination()}
        heading="Log in or sign up to continue"
      />
    </section>
  );
}
