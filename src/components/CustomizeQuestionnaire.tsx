import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useContent } from '../content/ContentProvider';

const ROTATE_MS = 4500;
const FADE_MS = 300;

// Rotating thinking-prompt shown on the Book Customizer: one question fades
// out, the next fades in. Purely a prompt to help the author think through
// their book while they customize — no answers are collected. The question
// list is fully admin-editable (Admin → Site Content → Book Customizer).
export default function CustomizeQuestionnaire() {
  const { customizer } = useContent();
  const questions = (customizer.questions ?? []).filter((q) => q.trim());
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (questions.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % questions.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length]);

  if (!customizer.questionnaireEnabled || questions.length === 0) return null;

  return (
    <div className="max-w-xl mx-auto mt-6">
      <div className="flex items-center justify-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 min-h-[64px]">
        <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p
          className={`text-gray-800 font-medium text-center transition-opacity duration-300 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {questions[index % questions.length]}
        </p>
      </div>
    </div>
  );
}
