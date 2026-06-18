import { useEffect, ReactNode } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
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
import HomeManuscriptSection from './components/HomeManuscriptSection';

function HomePage() {
  // When arriving from another page with a hash (e.g. /#plans), scroll there.
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <ValueProposition />
      <VideoSection />
      <HomeManuscriptSection />
      <PricingPlans />

      <section id="contact" className="py-20 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-4xl mx-auto">
          <ContactForm />
        </div>
      </section>

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

  return <HomePage />;
}

export default App;
