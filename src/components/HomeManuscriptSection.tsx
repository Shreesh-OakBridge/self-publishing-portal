import { useState } from 'react';
import { FileText, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth';
import ManuscriptUpload from './ManuscriptUpload';
import AuthModal from './AuthModal';

// Homepage manuscript entry point. Logged-in authors upload right here;
// visitors are prompted to log in / sign up, after which (user state updates)
// the upload form appears so they can continue without leaving the page.
export default function HomeManuscriptSection() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <section id="submit" className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Submit Your Manuscript
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your manuscript to begin your publishing journey. Your file stays private —
            visible only to you and our editorial team.
          </p>
        </div>

        {user ? (
          <ManuscriptUpload hideHeading />
        ) : (
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200 rounded-3xl p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to publish your book?</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Log in or create a free account to upload your manuscript and track its progress.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
            >
              <LogIn className="w-5 h-5" />
              Log in / Sign up to upload
            </button>
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
