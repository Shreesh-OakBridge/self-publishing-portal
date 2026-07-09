import type { CustomizerQuestion } from '../content/defaults';

// Defensive: CMS content saved by an admin before this feature existed (or
// before this upgrade to answerable questions) may still have `questions`
// stored as plain strings. Normalize to the current shape so nothing
// crashes — old entries just render as a free-text question with no price
// impact, exactly like the original "thinking prompt" behaved.
export function normalizeQuestions(
  raw: (CustomizerQuestion | string)[] | null | undefined
): CustomizerQuestion[] {
  return (raw ?? [])
    .map((q, i): CustomizerQuestion | null => {
      if (typeof q === 'string') {
        return q.trim() ? { id: `q${i}`, text: q, type: 'text' } : null;
      }
      if (!q || !q.text?.trim()) return null;
      return { ...q, id: q.id || `q${i}` };
    })
    .filter((q): q is CustomizerQuestion => q !== null);
}

// Sum of price impacts across every answered question, given the current
// question definitions (from CMS) and the customer's answers keyed by
// question id. 'text' answers never affect price.
export function questionnairePriceImpact(
  questions: CustomizerQuestion[],
  answers: Record<string, string>
): number {
  let total = 0;
  for (const q of questions) {
    const value = answers[q.id];
    if (!value) continue;
    if (q.type === 'choice') {
      const opt = q.options?.find((o) => o.id === value);
      if (opt) total += opt.priceImpact;
    } else if (q.type === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n) || !q.options?.length) continue;
      const tier = [...q.options]
        .filter((o) => (o.minValue ?? 0) <= n)
        .sort((a, b) => (b.minValue ?? 0) - (a.minValue ?? 0))[0];
      if (tier) total += tier.priceImpact;
    }
  }
  return total;
}

// Human-readable Q&A pairs for admin/account views. Only surfaces answers
// for questions that still exist in the current CMS config — if an admin
// later removes a question, old answers under that id simply stop showing
// (the raw JSON is still preserved in the database either way).
export function describeAnswers(
  questions: CustomizerQuestion[],
  answers: Record<string, string> | null | undefined
): { question: string; answer: string }[] {
  if (!answers) return [];
  const out: { question: string; answer: string }[] = [];
  for (const q of questions) {
    const raw = answers[q.id];
    if (!raw) continue;
    let answer = raw;
    if (q.type === 'choice') {
      answer = q.options?.find((o) => o.id === raw)?.label ?? raw;
    }
    out.push({ question: q.text, answer });
  }
  return out;
}
