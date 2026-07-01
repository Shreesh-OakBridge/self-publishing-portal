import { useEffect } from 'react';
import { X } from 'lucide-react';
import AuthForm from './AuthForm';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  // Called after a successful login/signup made from the modal.
  onAuthenticated?: () => void;
  heading?: string;
  // Where Google sign-in should return to (the email flow uses onAuthenticated).
  redirectPath?: string;
}

export default function AuthModal({ open, onClose, onAuthenticated, heading, redirectPath }: AuthModalProps) {
  // Lock body scroll while the modal is open and close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md my-auto" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900"
        >
          <X className="w-5 h-5" />
        </button>

        {heading && (
          <p className="text-center text-white font-medium mb-3 px-6">{heading}</p>
        )}

        <AuthForm
          oauthRedirectPath={redirectPath}
          onAuthenticated={() => {
            onClose();
            onAuthenticated?.();
          }}
        />
      </div>
    </div>
  );
}
