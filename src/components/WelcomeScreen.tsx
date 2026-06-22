import { useEffect, useState } from 'react';
import { BookOpen, Feather, Sparkles, ArrowRight } from 'lucide-react';
import { useContent } from '../content/ContentProvider';

// Floating particles drifting upward behind the content.
const PARTICLES = Array.from({ length: 14 }).map((_, i) => {
  const icons = [Feather, Sparkles, BookOpen];
  return {
    Icon: icons[i % icons.length],
    left: `${(i * 7.1 + (i % 3) * 4) % 100}%`,
    size: 14 + ((i * 7) % 20),
    delay: (i * 1.1) % 12,
    duration: 11 + ((i * 1.7) % 9),
    opacity: 0.22 + ((i % 4) * 0.1),
  };
});

const LEAVES = 6;

// Full-screen pages that flip away on exit — the first matches the welcome
// backdrop (so the screen itself turns), the rest are book pages revealing the
// homepage behind.
const EXIT_PAGES = [
  'bg-gradient-to-br from-stone-950 via-amber-950 to-orange-950',
  'bg-gradient-to-br from-amber-50 to-orange-100',
  'bg-gradient-to-br from-orange-50 to-amber-100',
  'bg-gradient-to-br from-amber-100 to-orange-50',
  'bg-gradient-to-br from-amber-50 to-orange-50',
];

export default function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
  const { welcome } = useContent();
  const [phase, setPhase] = useState<'intro' | 'exit'>('intro');

  // Lock background scroll while the intro/transition is visible.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const enter = () => {
    setPhase('exit');
    // Let the zoom + page-flips play out fully, then reveal the homepage.
    setTimeout(onEnter, 2300);
  };

  // CTA clicked → the scene slowly zooms into the book while giant pages flip
  // away one by one, peeling back to reveal the homepage (POV of diving
  // through the book into the site).
  if (phase === 'exit') {
    return (
      <div className="ob-exit">
        <div className="ob-exit-zoom">
          {EXIT_PAGES.map((bg, i) => (
            <div
              key={i}
              className={`ob-exit-leaf ${bg}`}
              style={{ animationDelay: `${i * 0.22}s`, zIndex: EXIT_PAGES.length - i }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-br from-stone-950 via-amber-950 to-orange-950 text-center">
      {/* Ambient glow orbs */}
      <div className="ob-orb absolute -top-24 -left-24 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl" />
      <div
        className="ob-orb absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-orange-600/20 blur-3xl"
        style={{ animationDelay: '1.5s' }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {PARTICLES.map((p, i) => {
          const Icon = p.Icon;
          return (
            <span
              key={i}
              className="ob-particle text-amber-300"
              style={{
                left: p.left,
                opacity: p.opacity,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            >
              <Icon style={{ width: p.size, height: p.size }} />
            </span>
          );
        })}
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-8 max-w-2xl max-h-full overflow-y-auto flex flex-col items-center">
        {/* Flip-book */}
        <div className="ob-book mb-6">
          <div className="ob-spread">
            {/* Left page: faint lines of text already written */}
            <div className="ob-half ob-half--left">
              <div className="h-full flex flex-col justify-center gap-[7px] px-5">
                {[88, 80, 84, 72, 62].map((w, i) => (
                  <div
                    key={i}
                    className="h-[3px] rounded-full bg-amber-900/12"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            </div>
            {/* Right page: a quill writing fresh lines */}
            <div className="ob-half">
              <div className="relative h-full flex flex-col justify-center gap-[7px] px-5">
                {[92, 82, 88, 70].map((w, i) => (
                  <div
                    key={i}
                    className="ob-writeline h-[3px] rounded-full bg-amber-900/30"
                    style={{ width: `${w}%`, animationDelay: `${2.5 + i * 0.3}s` }}
                  />
                ))}
                <Feather
                  className="ob-quill absolute text-amber-600 drop-shadow-sm"
                  style={{ width: 38, height: 38, right: 4, top: -14, transform: 'rotate(20deg)' }}
                />
              </div>
            </div>
          </div>
          {Array.from({ length: LEAVES }).map((_, i) => (
            <div
              key={i}
              className="ob-leaf"
              style={{ animationDelay: `${i * 0.28}s`, zIndex: LEAVES - i }}
            />
          ))}
          {/* spine highlight */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-amber-900/30" style={{ zIndex: LEAVES + 1 }} />
        </div>

        {welcome.eyebrow && (
          <p className="ob-anim ob-d1 text-amber-300/90 font-semibold tracking-[0.28em] uppercase text-[10px] sm:text-xs mb-2.5">
            {welcome.eyebrow}
          </p>
        )}

        <h1 className="ob-anim ob-d2 text-3xl sm:text-5xl font-bold text-white leading-tight mb-3">
          {welcome.headlineLine1}
          {welcome.headlineLine2 && (
            <>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
                {welcome.headlineLine2}
              </span>
            </>
          )}
        </h1>

        {welcome.subheading && (
          <p className="ob-anim ob-d3 text-sm sm:text-base text-amber-100/70 max-w-lg mx-auto mb-7">
            {welcome.subheading}
          </p>
        )}

        <button
          onClick={enter}
          className="ob-cta group inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-3.5 rounded-full text-base sm:text-lg font-semibold hover:from-amber-400 hover:to-orange-500 transition-colors"
        >
          {welcome.ctaLabel}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {welcome.skipLabel && (
          <div className="ob-anim ob-d5 mt-5">
            <button
              onClick={enter}
              className="text-amber-200/50 hover:text-amber-200/90 text-sm transition-colors"
            >
              {welcome.skipLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
