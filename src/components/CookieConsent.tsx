import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import { getConsent, setConsent, loadAnalytics, disableAnalytics } from '../lib/analytics';
import { withBase } from '../lib/basePath';

// Bottom banner: analytics only loads after the visitor accepts.
export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (consent === null) {
      setShow(true);
    } else if (consent === 'accepted') {
      loadAnalytics();
    }
  }, []);

  if (!show) return null;

  const accept = () => {
    setConsent('accepted');
    loadAnalytics();
    setShow(false);
  };
  const decline = () => {
    setConsent('declined');
    disableAnalytics();
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[90] p-3 sm:p-4">
      <div className="max-w-4xl mx-auto bg-white border shadow-2xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            We use cookies to understand how the site is used and improve your experience. See our{' '}
            <a href={withBase('/privacy')} className="text-amber-700 underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold hover:from-amber-700 hover:to-orange-700"
          >
            Accept
          </button>
          <button onClick={decline} className="text-gray-400 hover:text-gray-700 sm:hidden" aria-label="Dismiss">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
