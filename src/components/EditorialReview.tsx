import { useState } from 'react';
import {
  Sparkles,
  UserCheck,
  Check,
  X,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useContent } from '../content/ContentProvider';

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

interface Props {
  manuscriptId?: string | null;
  text: string;
  reviewStatus?: string | null;
  reviewFeedback?: string | null;
  reviewPrice?: number | null;
}

const REVIEW_LABEL: Record<string, { label: string; color: string }> = {
  requested: { label: 'Requested', color: 'bg-amber-100 text-amber-800' },
  in_review: { label: 'In Review', color: 'bg-blue-100 text-blue-700' },
  changes_requested: { label: 'Changes Requested', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
};

// Lightweight, dependency-free readability/structure analysis.
function analyze(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const words = clean ? clean.split(' ').filter(Boolean).length : 0;
  const letters = (clean.match(/[A-Za-z]/g) || []).length;
  const sentences = Math.max(1, (text.match(/[.!?]+/g) || []).length);
  const paragraphs = Math.max(1, text.split(/\n\s*\n/).filter((p) => p.trim()).length);
  const readingTime = Math.max(1, Math.round(words / 200)); // ~200 wpm
  const pages = Math.max(1, Math.round(words / 300));
  const avgSentence = words / sentences;
  // Automated Readability Index → US grade level (no syllable counting needed).
  const ari = words > 0 ? 4.71 * (letters / words) + 0.5 * avgSentence - 21.43 : 0;
  const grade = Math.max(1, Math.round(ari));
  return { words, sentences, paragraphs, readingTime, pages, avgSentence, grade };
}

export default function EditorialReview({ manuscriptId, text, reviewStatus, reviewFeedback, reviewPrice }: Props) {
  const { editorial } = useContent();
  const [ran, setRan] = useState(false);
  const [status, setStatus] = useState<string | null>(reviewStatus ?? null);
  const [feedback] = useState<string | null>(reviewFeedback ?? null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  // Quoted add-on charge: a manuscript-specific price wins over the CMS default.
  const price = reviewPrice ?? editorial.expertReviewPrice;

  const a = analyze(text);

  const checklist = [
    { ok: a.words > 0, label: 'Manuscript has content' },
    { ok: a.words >= 1000, label: 'Substantial length (1,000+ words)' },
    { ok: a.paragraphs >= 3, label: 'Structured into paragraphs' },
    { ok: a.avgSentence > 0 && a.avgSentence <= 25, label: 'Readable sentence length (≤ 25 words avg)' },
  ];

  const requestExpert = async () => {
    if (!manuscriptId) return;
    setRequesting(true);
    setError('');
    const { error: err } = await supabase
      .from('manuscripts')
      .update({
        expert_review_status: 'requested',
        expert_review_at: new Date().toISOString(),
        // Lock in the quoted price at request time if not already set.
        expert_review_price: reviewPrice ?? editorial.expertReviewPrice,
      })
      .eq('id', manuscriptId);
    setRequesting(false);
    if (err) {
      console.error(err);
      setError('Could not submit your request. Please try again.');
      return;
    }
    setStatus('requested');
  };

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-white rounded-xl border p-3 text-center">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );

  const statusMeta = status ? REVIEW_LABEL[status] : null;

  return (
    <div className="space-y-6">
      {/* Automated review */}
      <div className="bg-gray-50 rounded-2xl border p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-gray-900">Automated Review</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          An instant readability and structure check of your manuscript.
        </p>

        {!ran ? (
          <button
            onClick={() => setRan(true)}
            disabled={a.words === 0}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-40"
          >
            <FileText className="w-4 h-4" />
            {a.words === 0 ? 'Add content to run review' : 'Run automated review'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Stat label="Words" value={a.words.toLocaleString('en-IN')} />
              <Stat label="Est. pages" value={a.pages} />
              <Stat label="Read time" value={`${a.readingTime}m`} />
              <Stat label="Paragraphs" value={a.paragraphs} />
              <Stat label="Avg sentence" value={`${a.avgSentence.toFixed(1)}w`} />
              <Stat label="Reading grade" value={a.grade} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Readiness checklist</p>
              <ul className="space-y-1.5">
                {checklist.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {c.ok ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span className={c.ok ? 'text-gray-700' : 'text-gray-500'}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Expert editorial review */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <UserCheck className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-gray-900">Expert Editorial Review</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white">
            {inr(price)} add-on
          </span>
          {statusMeta && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-2">
          A human editor reviews your manuscript and shares detailed feedback. Available as a paid
          add-on with Expert Publishing.
        </p>
        {!status && editorial.expertReviewNote && (
          <p className="text-xs text-gray-500 mb-4">{editorial.expertReviewNote}</p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-sm flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {!status && (
          <>
            {manuscriptId ? (
              <button
                onClick={requestExpert}
                disabled={requesting}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
              >
                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                Request Expert Review — {inr(price)}
              </button>
            ) : (
              <p className="text-sm text-gray-500">Save your manuscript first to request an expert review.</p>
            )}
          </>
        )}

        {(status === 'requested' || status === 'in_review') && (
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>Your request is with our editorial team. We’ll share feedback here once it’s ready.</span>
          </div>
        )}

        {(status === 'changes_requested' || status === 'completed') && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Editor’s feedback</p>
            <div className="bg-white rounded-xl border p-4 text-sm text-gray-700 whitespace-pre-line">
              {feedback || 'Your review is complete.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
