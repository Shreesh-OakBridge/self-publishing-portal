import { useEffect, useState, ReactNode, Fragment, lazy, Suspense } from 'react';
import { useAuth } from './lib/auth';
import { useContent } from './content/ContentProvider';
import { HOME_SECTIONS } from './content/defaults';
import { stripBase } from './lib/basePath';
import { useSeo } from './lib/seo';
import { track } from './lib/track';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import ValueProposition from './components/ValueProposition';
import VideoSection from './components/VideoSection';
import PricingPlans from './components/PricingPlans';
import PlansTeaser from './components/PlansTeaser';
import RoyaltyCalculator from './components/RoyaltyCalculator';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import ResetPassword from './components/ResetPassword';
import HomeManuscriptSection from './components/HomeManuscriptSection';
import Testimonials from './components/Testimonials';
import ConfidenceBar from './components/ConfidenceBar';
import PortfolioSection from './components/PortfolioSection';
import ServicesPage from './components/ServicesPage';
import PortfolioPage from './components/PortfolioPage';
import FaqPage from './components/FaqPage';
import JourneysPage from './components/JourneysPage';
import JourneyPage from './components/JourneyPage';
import Planner from './components/Planner';
import EstimateBanner from './components/EstimateBanner';
import ProjectPage from './components/ProjectPage';
import AuthorHub from './components/AuthorHub';
import StaticPage from './components/StaticPage';
import GetStarted from './components/GetStarted';
import QuotePage from './components/QuotePage';
import AuthorDashboard from './components/AuthorDashboard';
import WelcomeScreen from './components/WelcomeScreen';
import Breadcrumbs from './components/Breadcrumbs';

// Heavy / rarely-first-hit routes are code-split so they don't ship in the
// initial public bundle — each downloads on demand when its route is opened.
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AccountPage = lazy(() => import('./components/AccountPage'));
const Checkout = lazy(() => import('./components/Checkout'));
const BookCustomizer = lazy(() => import('./components/BookCustomizer'));

// Small centered fallback shown while a lazy route chunk loads.
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
    </div>
  );
}

function HomePage() {
  const { user, isAdmin } = useAuth();
  const { homeLayout, welcome } = useContent();

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
    confidenceBar: () => <ConfidenceBar />,
    about: () => <ValueProposition />,
    process: () => <VideoSection />,
    submit: () => <HomeManuscriptSection />,
    portfolio: () => <PortfolioSection />,
    testimonials: () => <Testimonials />,
    plans: () => <PlansTeaser />,
    estimate: () => (!isAdmin ? <EstimateBanner /> : null),
    contact: () => (
      <section id="contact" className="py-20 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-4xl mx-auto">
          <ContactForm />
        </div>
      </section>
    ),
  };

  // Pick the layout for this audience: logged-in members vs logged-out visitors.
  const layoutSections =
    user && homeLayout.loggedInSections?.length ? homeLayout.loggedInSections : homeLayout.sections;

  // Start from the saved order, then append any known sections not yet listed
  // (so newly added sections still appear even with an older saved layout).
  const seen = new Set<string>();
  const ordered = [
    ...layoutSections.filter((s) => {
      if (sectionRenderers[s.key] && !seen.has(s.key)) {
        seen.add(s.key);
        return true;
      }
      return false;
    }),
    ...HOME_SECTIONS.filter((s) => !seen.has(s.key)).map((s) => ({ key: s.key, enabled: true })),
  ];

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      {showWelcome && welcome.enabled && <WelcomeScreen onEnter={dismissWelcome} />}
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
// Pass `crumb` to show a "Home › <crumb>" breadcrumb above the content.
function SubPage({ children, crumb }: { children: ReactNode; crumb?: string }) {
  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      <Navigation />
      <div className="pt-20">
        {crumb && <Breadcrumbs label={crumb} />}
        {children}
      </div>
      <Footer />
    </div>
  );
}

function App() {
  // Per-route SEO (title, meta, canonical, OG, JSON-LD).
  useSeo();
  // Lightweight path-based routing — no router dependency. The SPA rewrite in
  // vercel.json ensures these paths serve index.html in production. stripBase
  // removes the "/cursive" prefix so matches stay simple.
  const path = stripBase(window.location.pathname);

  // Funnel step 1: every page load (fires once per load; navigation is full-page).
  useEffect(() => {
    // Capture a referral code (?ref=) so it can be attached at signup.
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref) localStorage.setItem('cursive_ref', ref);
    } catch {
      /* ignore */
    }
    track('page_load', { path: path || '/' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (path === '/admin')
    return (
      <Suspense fallback={<RouteLoading />}>
        <AdminDashboard />
      </Suspense>
    );
  if (path === '/login' || path === '/signup') return <AuthPage />;
  if (path === '/reset-password') return <ResetPassword />;
  if (path === '/account')
    return (
      <Suspense fallback={<RouteLoading />}>
        <AccountPage />
      </Suspense>
    );
  if (path === '/checkout')
    return (
      <Suspense fallback={<RouteLoading />}>
        <Checkout />
      </Suspense>
    );
  if (path === '/project') return <ProjectPage />;
  if (path === '/hub') return <AuthorHub />;
  if (path === '/customize')
    return (
      <SubPage>
        <Suspense fallback={<RouteLoading />}>
          <BookCustomizer />
        </Suspense>
      </SubPage>
    );
  if (path === '/royalty-calculator')
    return (
      <SubPage>
        <RoyaltyCalculator />
      </SubPage>
    );
  if (path === '/get-started')
    return (
      <SubPage>
        <GetStarted />
      </SubPage>
    );
  if (path === '/quote')
    return (
      <SubPage>
        <QuotePage />
      </SubPage>
    );
  if (path === '/journeys')
    return (
      <SubPage crumb="Journeys">
        <JourneysPage />
      </SubPage>
    );
  if (path.startsWith('/journey/'))
    return (
      <SubPage crumb="Journeys">
        <JourneyPage slug={decodeURIComponent(path.slice('/journey/'.length))} />
      </SubPage>
    );
  if (path === '/planner')
    return (
      <SubPage crumb="Plan Your Book">
        <Planner />
      </SubPage>
    );
  if (path === '/plans')
    return (
      <SubPage crumb="Plans">
        <PricingPlans />
      </SubPage>
    );
  if (path === '/services')
    return (
      <SubPage crumb="Services">
        <ServicesPage />
      </SubPage>
    );
  if (path === '/portfolio')
    return (
      <SubPage crumb="Portfolio">
        <PortfolioPage />
      </SubPage>
    );
  if (path === '/faq')
    return (
      <SubPage crumb="FAQ">
        <FaqPage />
      </SubPage>
    );
  if (path === '/about')
    return (
      <SubPage crumb="About Us">
        <StaticPage pageKey="about" />
      </SubPage>
    );
  if (path === '/terms')
    return (
      <SubPage crumb="Terms &amp; Conditions">
        <StaticPage pageKey="terms" />
      </SubPage>
    );
  if (path === '/privacy')
    return (
      <SubPage crumb="Privacy Policy">
        <StaticPage pageKey="privacy" />
      </SubPage>
    );
  if (path === '/publishing-agreement')
    return (
      <SubPage crumb="Publishing Agreement">
        <StaticPage pageKey="publishingAgreement" />
      </SubPage>
    );

  return <HomePage />;
}

export default App;
