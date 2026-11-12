import { useState } from 'react';
import { FileText, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useContent } from '../content/ContentProvider';
import ManuscriptUpload from './ManuscriptUpload';
import AuthModal from './AuthModal';
import FreeAssessment from './FreeAssessment';

// Homepage manuscript entry point. Logged-in authors upload right here.
// Visitors can send a sample chapter for a free assessment (no account), or
// log in / sign up to upload the full manuscript without leaving the page.
export default function HomeManuscriptSection() {
  const { user } = useAuth();
  const { manuscript: m } = useContent();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <section id="submit" className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{m.heading}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{m.subheading}</p>
        </div>

        {user ? (
          <ManuscriptUpload hideHeading />
        ) : (
          <div className="grid md:grid-cols-5 gap-6 items-stretch">
            <div className="md:col-span-3">
              <FreeAssessment />
            </div>
            <div className="md:col-span-2 bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 border border-amber-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-800 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{m.loggedOutTitle}</h3>
              <p className="text-gray-600 text-sm mb-6">{m.loggedOutText}</p>
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all"
              >
                <LogIn className="w-5 h-5" />
                {m.loggedOutCta}
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        heading="Log in or sign up to upload your manuscript"
      />
    </section>
  );
}
