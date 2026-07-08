import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export interface ToastMsg {
  type: 'ok' | 'err';
  text: string;
}

// Small self-contained toast used in place of the browser's blocking alert().
// Renders fixed to the bottom-right, auto-dismisses after 4s, and can be
// closed early. Pass `toast` from local component state (useState<ToastMsg | null>).
export default function Toast({
  toast,
  onDismiss,
  duration = 4000,
}: {
  toast: ToastMsg | null;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  if (!toast) return null;

  const ok = toast.type === 'ok';

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto z-[100] sm:max-w-sm">
      <div
        role="status"
        className={`flex items-start gap-3 rounded-xl shadow-xl px-4 py-3 text-sm text-white ${
          ok ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {ok ? (
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        )}
        <span className="flex-1">{toast.text}</span>
        <button onClick={onDismiss} aria-label="Dismiss" className="text-white/80 hover:text-white flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
