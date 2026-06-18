import { BookOpen, Menu, X, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useContent } from '../content/ContentProvider';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { user } = useAuth();
  const { branding } = useContent();

  const path = window.location.pathname.replace(/\/+$/, '');
  const isHome = path === '';

  // Scroll-spy: highlight the nav item for the section currently under the nav.
  useEffect(() => {
    if (!isHome) return;
    const ids = ['home', 'about', 'process', 'submit', 'plans', 'contact'];
    const onScroll = () => {
      const offset = 120; // fixed-nav height + a little margin
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

  // Scroll to a homepage section if we're on the homepage; otherwise navigate
  // to the homepage with the section hash.
  const goToSection = (id: string) => {
    setIsMenuOpen(false);
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  const goTo = (path: string) => {
    setIsMenuOpen(false);
    window.location.href = path;
  };

  const linkClass = 'text-gray-700 hover:text-amber-600 transition-colors font-medium';
  const mobileLinkClass = 'block w-full text-left text-gray-700 hover:text-amber-600 py-2';

  // Active (current-page) styling for the standalone page links.
  const navClass = (active: boolean) =>
    active ? 'text-amber-600 font-semibold transition-colors' : linkClass;
  const mobileNavClass = (active: boolean) =>
    active
      ? 'block w-full text-left text-amber-600 font-semibold py-2'
      : mobileLinkClass;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button onClick={() => goTo('/')} className="flex items-center space-x-3">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="OakBridge Publishing"
                className="h-10 w-auto object-contain"
              />
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

          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => goToSection('home')}
              className={navClass(isHome && activeSection === 'home')}
            >
              Home
            </button>
            <button
              onClick={() => goToSection('about')}
              className={navClass(isHome && activeSection === 'about')}
            >
              About
            </button>
            <button
              onClick={() => goToSection('process')}
              className={navClass(isHome && activeSection === 'process')}
            >
              Process
            </button>
            <button
              onClick={() => goToSection('submit')}
              className={navClass(isHome && activeSection === 'submit')}
            >
              Manuscript
            </button>
            <button
              onClick={() => goToSection('plans')}
              className={navClass(isHome && activeSection === 'plans')}
            >
              Plans
            </button>
            <button onClick={() => goTo('/customize')} className={navClass(path === '/customize')}>
              Customize
            </button>
            <button
              onClick={() => goTo('/royalty-calculator')}
              className={navClass(path === '/royalty-calculator')}
            >
              Royalty Calculator
            </button>
            {user ? (
              <button
                onClick={() => goTo('/account')}
                className="flex items-center space-x-2 bg-amber-600 text-white px-6 py-2 rounded-full hover:bg-amber-700 transition-colors font-medium"
              >
                <UserCircle className="w-5 h-5" />
                <span>My Account</span>
              </button>
            ) : (
              <button
                onClick={() => goTo('/login')}
                className="bg-amber-600 text-white px-6 py-2 rounded-full hover:bg-amber-700 transition-colors font-medium"
              >
                Login / Sign Up
              </button>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-gray-700">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => goToSection('home')}
              className={mobileNavClass(isHome && activeSection === 'home')}
            >
              Home
            </button>
            <button
              onClick={() => goToSection('about')}
              className={mobileNavClass(isHome && activeSection === 'about')}
            >
              About
            </button>
            <button
              onClick={() => goToSection('process')}
              className={mobileNavClass(isHome && activeSection === 'process')}
            >
              Process
            </button>
            <button
              onClick={() => goToSection('submit')}
              className={mobileNavClass(isHome && activeSection === 'submit')}
            >
              Manuscript
            </button>
            <button
              onClick={() => goToSection('plans')}
              className={mobileNavClass(isHome && activeSection === 'plans')}
            >
              Plans
            </button>
            <button onClick={() => goTo('/customize')} className={mobileNavClass(path === '/customize')}>
              Customize
            </button>
            <button
              onClick={() => goTo('/royalty-calculator')}
              className={mobileNavClass(path === '/royalty-calculator')}
            >
              Royalty Calculator
            </button>
            {user ? (
              <button
                onClick={() => goTo('/account')}
                className="block w-full text-center bg-amber-600 text-white px-6 py-2 rounded-full hover:bg-amber-700"
              >
                My Account
              </button>
            ) : (
              <button
                onClick={() => goTo('/login')}
                className="block w-full text-center bg-amber-600 text-white px-6 py-2 rounded-full hover:bg-amber-700"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
