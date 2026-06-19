import { useEffect, useState, ReactNode, Fragment } from 'react';
import { useAuth } from './lib/auth';
import { useContent } from './content/ContentProvider';
import { HOME_SECTIONS } from './content/defaults';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import AuthorDashboard from './components/AuthorDashboard';
import ValueProposition from './components/ValueProposition';
import VideoSection from './components/VideoSection';
import PricingPlans from './components/PricingPlans';
import BookCustomizer from './components/BookCustomizer';
import RoyaltyCalculator from './components/RoyaltyCalculator';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/AuthPage';
import AccountPage from './components/AccountPage';
import ManuscriptEditor from './components/ManuscriptEditor';
import Checkout from './components/Checkout';
import HomeManuscriptSection from './components/HomeManuscriptSection';
import WelcomeScreen from './components/WelcomeScreen';
import Testimonials from './components/Testimonials';
import ConfidenceBar from './components/ConfidenceBar';
import PortfolioSection from './components/PortfolioSection';
import ServicesPage from './components/ServicesPage';
import PortfolioPage from './components/PortfolioPage';
import FaqPage from './components/FaqPage';
import StaticPage from './components/StaticPage';

function HomePage() {
  const { user, isAdmin } = useAuth();
  const { homeLayout } = useContent();

  // Immersive welcome overlay — shown once per browser session, and never when
  // arriving deep-linked to a specific section (e.g. /#plans).
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      return !window.location.hash && sessionStorage.getItem('ob_welcomed') !== '1';
    } catch {
      return !window.location.hash;
    }
  });
  const dismissWelcome = () => {
    try {
      sessionStorage.setItem('ob_welcomed', '1');
    } catch {
      /* ignore */
    }
    setShowWelcome(false);
  };

  // When arriving from another page with a hash (e.g. /#plans), scroll there.
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  const firstName =
    (user?.user_metadata?.first_name as string) ||
    ((user?.user_metadata?.full_name as string) || '').split(' ')[0] ||
    '';

  // Each reorderable homepage section keyed by id. The hero slot becomes the
  // author dashboard for logged-in (non-admin) users; the confidence bar only
  // shows to logged-out visitors.
  const sectionRenderers: Record<string, () => ReactNode> = {
    hero: () =>
      user && !isAdmin ? (
        <section
          id="home"
          className="pt-28 pb-12 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
        >
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-gray-600 mb-8">Here’s a snapshot of your publishing journey.</p>
            <AuthorDashboard showHeading={false} />
          </div>
        </section>
      ) : (
        <Hero />
      ),
    confidenceBar: () => (!user ? <ConfidenceBar /> : null),
    about: () => <ValueProposition />,
    process: () => <VideoSection />,
    submit: () => <HomeManuscriptSection />,
    portfolio: () => <PortfolioSection />,
    testimonials: () => <Testimonials />,
    plans: () => <PricingPlans />,
    contact: () => (
      <section id="contact" className="py-20 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-4xl mx-auto">
          <ContactForm />
        </div>
      </section>
    ),
  };

  // Start from the saved order, then append any known sections not yet listed
  // (so newly added sections still appear even with an older saved layout).
  const seen = new Set<string>();
  const ordered = [
    ...homeLayout.sections.filter((s) => {
      if (sectionRenderers[s.key] && !seen.has(s.key)) {
        seen.add(s.key);
        return true;
      }
      return false;
    }),
    ...HOME_SECTIONS.filter((s) => !seen.has(s.key)).map((s) => ({ key: s.key, enabled: true })),
  ];

  return (
    <div className="min-h-screen bg-white">
      {showWelcome && <WelcomeScreen onEnter={dismissWelcome} />}
      <Navigation />
      {ordered
        .filter((s) => s.enabled)
        .map((s) => (
          <Fragment key={s.key}>{sectionRenderers[s.key]()}</Fragment>
        ))}
      <Footer />
    </div>
  );
}

// Shell for standalone pages: fixed nav + content (padded below the nav) + footer.
function SubPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-20">{children}</div>
      <Footer />
    </div>
  );
}

function App() {
  // Lightweight path-based routing — no router dependency. The SPA rewrite in
  // vercel.json ensures these paths serve index.html in production.
  const path = window.location.pathname.replace(/\/+$/, '');

  if (path === '/admin') return <AdminDashboard />;
  if (path === '/login' || path === '/signup') return <AuthPage />;
  if (path === '/account') return <AccountPage />;
  if (path === '/manuscript') return <ManuscriptEditor />;
  if (path === '/checkout') return <Checkout />;
  if (path === '/customize')
    return (
      <SubPage>
        <BookCustomizer />
      </SubPage>
    );
  if (path === '/royalty-calculator')
    return (
      <SubPage>
        <RoyaltyCalculator />
      </SubPage>
    );
  if (path === '/services')
    return (
      <SubPage>
        <ServicesPage />
      </SubPage>
    );
  if (path === '/portfolio')
    return (
      <SubPage>
        <PortfolioPage />
      </SubPage>
    );
  if (path === '/faq')
    return (
      <SubPage>
        <FaqPage />
      </SubPage>
    );
  if (path === '/about')
    return (
      <SubPage>
        <StaticPage pageKey="about" />
      </SubPage>
    );
  if (path === '/terms')
    return (
      <SubPage>
        <StaticPage pageKey="terms" />
      </SubPage>
    );
  if (path === '/privacy')
    return (
      <SubPage>
        <StaticPage pageKey="privacy" />
      </SubPage>
    );

  return <HomePage />;
}

export default App;
