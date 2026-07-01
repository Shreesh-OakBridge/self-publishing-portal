import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ContentProvider } from './content/ContentProvider';
import { AuthProvider } from './lib/auth';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsent from './components/CookieConsent';
import MobileBottomNav from './components/MobileBottomNav';
import { initSentry } from './lib/sentry';

// Initialise error monitoring before the app renders so early errors are caught.
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ContentProvider>
          <App />
          <CookieConsent />
          <MobileBottomNav />
        </ContentProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
