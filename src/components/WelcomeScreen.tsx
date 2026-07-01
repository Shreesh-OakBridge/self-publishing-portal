import { useEffect, useRef, useState } from 'react';
import { BookOpen, Feather, Sparkles, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { withBase } from '../lib/basePath';

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

  // Sonic branding — preload the brand sound so it fires instantly on the CTA.
  const soundOn = !!(welcome.soundEnabled && welcome.soundUrl);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('cursive_sonic_muted') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!soundOn) return;
    const a = new Audio(withBase(welcome.soundUrl));
    a.preload = 'auto';
    a.volume = Math.min(1, Math.max(0, welcome.soundVolume ?? 0.4));
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, [soundOn, welcome.soundUrl, welcome.soundVolume]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem('cursive_sonic_muted', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Play the brand sound once per browser session — the CTA click is the user
  // gesture that browsers require for audio to start.
  const playSonic = () => {
    if (!soundOn || muted || !audioRef.current) return;
    try {
      if (sessionStorage.getItem('cursive_sonic_played') === '1') return;
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {});
      sessionStorage.setItem('cursive_sonic_played', '1');
    } catch {
      /* ignore */
    }
  };

  // Lock background scroll while the intro/transition is visible.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const enter = () => {
    playSonic();
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
      {/* Sound on/off — only shown when a brand sound is configured */}
      {soundOn && (
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-amber-100/80 hover:text-white transition-colors"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

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
      <div className="relative z-10 px-6 pt-8 pb-16 max-w-2xl max-h-full overflow-y-auto flex flex-col items-center">
        {/* Flip-book */}
        <div className="ob-book mb-6">
          <div className="ob-spread">
            {/* Left page: a quill above fresh lines (fully inside the page) */}
            <div className="ob-half ob-half--left">
              <div className="relative h-full">
                <Feather
                  className="ob-quill absolute text-amber-600 drop-shadow-sm"
                  style={{ width: 30, height: 30, top: 10, right: 14, transform: 'rotate(-10deg)' }}
                />
                <div className="absolute inset-0 flex flex-col justify-center gap-[7px] pl-6 pr-4">
                  {[88, 78, 84, 68, 58].map((w, i) => (
                    <div
                      key={i}
                      className="ob-writeline h-[3px] rounded-full bg-amber-900/30"
                      style={{ width: `${w}%`, animationDelay: `${2.0 + i * 0.25}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            {/* Right page: faint lines already written */}
            <div className="ob-half">
              <div className="h-full flex flex-col justify-center gap-[7px] px-5">
                {[84, 76, 80, 70, 60].map((w, i) => (
                  <div
                    key={i}
                    className="h-[3px] rounded-full bg-amber-900/20"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          {Array.from({ length: LEAVES }).map((_, i) => (
            <div
              key={i}
              className="ob-leaf"
              style={{ animationDelay: `${i * 0.22}s`, zIndex: LEAVES - i }}
            />
          ))}
          {/* spine highlight */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-amber-900/30" style={{ zIndex: LEAVES + 1 }} />
        </div>

        {welcome.eyebrow && (
          <p
            className="ob-anim ob-d1 text-amber-300 text-5xl sm:text-6xl leading-none mb-1 drop-shadow"
            style={{ fontFamily: "'Edwardian Script ITC','Pinyon Script',cursive" }}
          >
            {welcome.eyebrow}
          </p>
        )}
        <p className="ob-anim ob-d1 text-amber-200/60 text-[10px] sm:text-xs tracking-[0.25em] uppercase mb-4">
          An Imprint of OakBridge
        </p>

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
      </div>
    </div>
  );
}
