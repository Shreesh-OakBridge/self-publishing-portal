import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ContentProvider } from './content/ContentProvider';
import { AuthProvider } from './lib/auth';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsent from './components/CookieConsent';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ContentProvider>
          <App />
          <CookieConsent />
        </ContentProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
