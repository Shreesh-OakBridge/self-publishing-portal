import { useEffect, useState } from 'react';
import { BookOpen, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { go } from '../lib/basePath';
import StageTracker from './StageTracker';
import ProjectWorkspace from './ProjectWorkspace';
import { stageLabel } from '../lib/productionStages';

interface ProjectOrder {
  id: string;
  plan: string | null;
  customization_id: string | null;
  amount: number | null;
  status: string;
  production_stage: string | null;
  invoice_number: string | null;
  created_at: string;
}

// Author-facing project workspace page (/project?id=<orderId>).
export default function ProjectPage() {
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<ProjectOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const orderId = new URLSearchParams(window.location.search).get('id') || '';

  useEffect(() => {
    if (!loading && !user) go('/login');
  }, [loading, user]);

  useEffect(() => {
    if (!user || !orderId) {
      setLoadingOrder(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, plan, customization_id, amount, status, production_stage, invoice_number, created_at')
        .eq('id', orderId)
        .maybeSingle();
      setOrder((data as ProjectOrder) ?? null);
      setLoadingOrder(false);
    })();
  }, [user, orderId]);

  if (loading || loadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  const title = order?.plan || (order?.customization_id ? 'Custom book' : 'Your project');

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => go('/')} className="flex items-center space-x-3">
            <BookOpen className="w-7 h-7 text-amber-600" />
            <span className="text-lg font-bold text-gray-900">Cursive</span>
          </button>
          <button
            onClick={() => go('/account#orders')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> My Orders
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!order ? (
          <div className="bg-white rounded-2xl border p-8 text-center text-gray-600">
            <p className="mb-4">We couldn’t find that project, or it isn’t linked to your account.</p>
            <button onClick={() => go('/account#orders')} className="bg-amber-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-amber-700">
              Back to My Orders
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border p-6 mb-6">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                Project{order.invoice_number ? ` · ${order.invoice_number}` : ''}
              </p>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-500 text-sm mt-1">Current stage: {stageLabel(order.production_stage)}</p>
              <div className="mt-5">
                <StageTracker stageKey={order.production_stage} />
              </div>
            </div>

            <ProjectWorkspace orderId={order.id} client={supabase} role="author" />
          </>
        )}
      </main>
    </div>
  );
}
