import { BookOpen, Menu, X, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useContent } from '../content/ContentProvider';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { branding } = useContent();

  const path = window.location.pathname.replace(/\/+$/, '');
  const isHome = path === '';

  // Scroll-spy + condensed-on-scroll styling.
  useEffect(() => {
    const ids = ['home', 'about', 'testimonials', 'plans', 'contact'];
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      if (!isHome) return;
      const offset = 120;
      let current = 'home';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  const goToSection = (id: string) => {
    setIsMenuOpen(false);
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  const goTo = (p: string) => {
    setIsMenuOpen(false);
    window.location.href = p;
  };

  // Nav items for the public marketing header. `match` is the section the
  // scroll-spy uses to highlight the item (Services maps to the offerings/about
  // section until the dedicated Services page lands).
  const items = [
    { label: 'Home', section: 'home', match: 'home' },
    { label: 'Services', section: 'about', match: 'about' },
    { label: 'Testimonials', section: 'testimonials', match: 'testimonials' },
    { label: 'Plans', section: 'plans', match: 'plans' },
  ];

  const isActive = (match: string) => isHome && activeSection === match;

  const deskLink = (active: boolean) =>
    `relative font-medium transition-colors ${
      active ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'
    } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-amber-600 after:transition-all ${
      active ? 'after:w-full' : 'after:w-0 hover:after:w-full'
    }`;

  const mobileLink = (active: boolean) =>
    `block w-full text-left py-2 font-medium ${
      active ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'
    }`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHome
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button onClick={() => goTo('/')} className="flex items-center space-x-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="OakBridge Publishing" className="h-10 w-auto object-contain" />
            ) : (
              <>
                <BookOpen className="w-8 h-8 text-amber-600" />
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-gray-900">OakBridge</h1>
                  <p className="text-xs text-amber-600 font-semibold">Publishing</p>
                </div>
              </>
            )}
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-9">
            {items.map((it) => (
              <button key={it.label} onClick={() => goToSection(it.section)} className={deskLink(isActive(it.match))}>
                {it.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <button
                onClick={() => goTo('/account')}
                className="flex items-center space-x-2 bg-amber-600 text-white px-5 py-2.5 rounded-full hover:bg-amber-700 transition-colors font-medium"
              >
                <UserCircle className="w-5 h-5" />
                <span>My Account</span>
              </button>
            ) : (
              <>
                <button onClick={() => goTo('/login')} className="text-gray-700 hover:text-amber-600 font-medium transition-colors">
                  Log In
                </button>
                <button
                  onClick={() => goTo('/signup')}
                  className="bg-amber-600 text-white px-6 py-2.5 rounded-full hover:bg-amber-700 transition-colors font-semibold shadow-sm"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-gray-700">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {items.map((it) => (
              <button key={it.label} onClick={() => goToSection(it.section)} className={mobileLink(isActive(it.match))}>
                {it.label}
              </button>
            ))}
            <div className="pt-2 space-y-2">
              {user ? (
                <button
                  onClick={() => goTo('/account')}
                  className="block w-full text-center bg-amber-600 text-white px-6 py-2.5 rounded-full hover:bg-amber-700 font-medium"
                >
                  My Account
                </button>
              ) : (
                <>
                  <button
                    onClick={() => goTo('/login')}
                    className="block w-full text-center border border-gray-300 text-gray-700 px-6 py-2.5 rounded-full hover:bg-gray-50 font-medium"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => goTo('/signup')}
                    className="block w-full text-center bg-amber-600 text-white px-6 py-2.5 rounded-full hover:bg-amber-700 font-semibold"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
