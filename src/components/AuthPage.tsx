import { ArrowLeft } from 'lucide-react';
import AuthForm from './AuthForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => (window.location.href = '/')}
          className="flex items-center space-x-2 text-gray-500 hover:text-amber-700 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to site</span>
        </button>

        <AuthForm onAuthenticated={() => (window.location.href = '/account')} />
      </div>
    </div>
  );
}
