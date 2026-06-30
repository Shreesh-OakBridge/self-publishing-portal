import {
  Menu,
  X,
  UserCircle,
  ChevronDown,
  Shield,
  ShoppingBag,
  FileText,
  HelpCircle,
  KeyRound,
  LogOut,
  User,
  Award,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useContent } from '../content/ContentProvider';
import { go, stripBase, withBase } from '../lib/basePath';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, signOut } = useAuth();
  const { branding, services } = useContent();

  // Author's first name + initial for the account button.
  const firstName = (
    (user?.user_metadata?.first_name as string) ||
    (user?.user_metadata?.full_name as string) ||
    ''
  )
    .trim()
    .split(' ')[0];
  const accountInitial = (firstName || user?.email || '').trim().charAt(0).toUpperCase();
  const accountLabel = firstName ? `Hi, ${firstName}` : 'My Account';

  const path = stripBase(window.location.pathname);
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

  // Close the account dropdown on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAccountOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  const handleSignOut = async () => {
    setAccountOpen(false);
    setIsMenuOpen(false);
    await signOut();
    go('/');
  };

  const goToSection = (id: string) => {
    setIsMenuOpen(false);
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      go(`/#${id}`);
    }
  };

  const goTo = (p: string) => {
    setIsMenuOpen(false);
    go(p);
  };

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
          <button onClick={() => goTo('/')} className="flex items-center gap-2.5">
            <img
              src={withBase(branding.logoUrl || '/logo.svg')}
              alt={branding.logoAlt || 'Cursive'}
              className="h-9 sm:h-10 w-auto object-contain"
            />
            <span className="hidden sm:block text-[10px] font-semibold text-amber-600 leading-tight text-left">
              An Imprint
              <br />
              of OakBridge
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-9">
            <button onClick={() => goToSection('home')} className={deskLink(isActive('home'))}>
              Home
            </button>

            <button
              onClick={() => goTo('/journeys')}
              className={deskLink(path === '/journeys' || path.startsWith('/journey/'))}
            >
              Journeys
            </button>

            {/* Services — hover flyout, click goes to the landing page */}
            <div className="relative group">
              <button onClick={() => goTo('/services')} className={deskLink(path === '/services')}>
                <span className="inline-flex items-center gap-1">
                  Services <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200">
                <div className="w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                  {services.items.map((s) => (
                    <button
                      key={s.title}
                      onClick={() => goTo('/services')}
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      <span className="block text-sm font-semibold text-gray-800">{s.title}</span>
                      <span className="block text-xs text-gray-500">{s.summary}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => goTo('/services')}
                    className="block w-full text-left px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 rounded-lg"
                  >
                    View all services →
                  </button>
                </div>
              </div>
            </div>

            <button onClick={() => goToSection('testimonials')} className={deskLink(isActive('testimonials'))}>
              Testimonials
            </button>
            <button onClick={() => goTo('/portfolio')} className={deskLink(path === '/portfolio')}>
              Portfolio
            </button>
            <button onClick={() => goTo('/plans')} className={deskLink(path === '/plans')}>
              Plans
            </button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-3">
            {isAdmin ? (
              <button
                onClick={() => goTo('/admin')}
                className="flex items-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium"
              >
                <Shield className="w-5 h-5" />
                <span>Admin</span>
              </button>
            ) : user ? (
              <div
                className="relative"
                ref={accountRef}
                onMouseEnter={() => setAccountOpen(true)}
                onMouseLeave={() => setAccountOpen(false)}
              >
                <button
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  className="flex items-center space-x-2 bg-amber-600 text-white pl-2 pr-4 py-1.5 rounded-full hover:bg-amber-700 transition-colors font-medium"
                >
                  <span className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-sm font-bold">
                    {accountInitial || <UserCircle className="w-5 h-5" />}
                  </span>
                  <span>{accountLabel}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${accountOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full pt-2 z-50">
                    <div
                      role="menu"
                      className="w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2"
                    >
                    {/* Header: avatar + name + email */}
                    <div className="flex items-center gap-3 px-4 pb-3 mb-1 border-b border-gray-100">
                      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-base font-bold flex-shrink-0">
                        {accountInitial || <UserCircle className="w-6 h-6" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {firstName || 'My Account'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    {[
                      { icon: User, label: 'My Account', path: '/account' },
                      { icon: ShoppingBag, label: 'My Orders', path: '/account#orders' },
                      { icon: Award, label: 'Author Hub', path: '/hub' },
                      { icon: FileText, label: 'Get a Quote', path: '/quote' },
                      { icon: HelpCircle, label: 'Need Help?', path: '/faq' },
                      { icon: KeyRound, label: 'Change Password', path: '/reset-password' },
                    ].map(({ icon: Icon, label, path: p }) => (
                      <button
                        key={label}
                        role="menuitem"
                        onClick={() => {
                          setAccountOpen(false);
                          goTo(p);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-gray-400" />
                        {label}
                      </button>
                    ))}

                    <div className="border-t border-gray-100 my-1" />
                    <button
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => goTo('/login')} className="text-gray-700 hover:text-amber-600 font-medium transition-colors">
                  Log In
                </button>
                <button
                  onClick={() => goTo('/get-started')}
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
            <button onClick={() => goToSection('home')} className={mobileLink(isActive('home'))}>
              Home
            </button>
            <button
              onClick={() => goTo('/journeys')}
              className={mobileLink(path === '/journeys' || path.startsWith('/journey/'))}
            >
              Journeys
            </button>
            <button onClick={() => goTo('/services')} className={mobileLink(path === '/services')}>
              Services
            </button>
            <button onClick={() => goToSection('testimonials')} className={mobileLink(isActive('testimonials'))}>
              Testimonials
            </button>
            <button onClick={() => goTo('/portfolio')} className={mobileLink(path === '/portfolio')}>
              Portfolio
            </button>
            <button onClick={() => goTo('/plans')} className={mobileLink(path === '/plans')}>
              Plans
            </button>
            <div className="pt-2 space-y-2">
              {isAdmin ? (
                <button
                  onClick={() => goTo('/admin')}
                  className="block w-full text-center bg-gray-900 text-white px-6 py-2.5 rounded-full hover:bg-gray-800 font-medium"
                >
                  Admin
                </button>
              ) : user ? (
                <>
                  <button
                    onClick={() => goTo('/account')}
                    className="block w-full text-center bg-amber-600 text-white px-6 py-2.5 rounded-full hover:bg-amber-700 font-medium"
                  >
                    {accountLabel}
                  </button>
                  <button onClick={() => goTo('/quote')} className={mobileLink(false)}>
                    Get a Quote
                  </button>
                  <button onClick={() => goTo('/faq')} className={mobileLink(false)}>
                    Need Help?
                  </button>
                  <button onClick={() => goTo('/reset-password')} className={mobileLink(false)}>
                    Change Password
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 py-2 font-medium text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => goTo('/login')}
                    className="block w-full text-center border border-gray-300 text-gray-700 px-6 py-2.5 rounded-full hover:bg-gray-50 font-medium"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => goTo('/get-started')}
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
