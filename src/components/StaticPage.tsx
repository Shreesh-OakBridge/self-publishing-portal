import { useContent } from '../content/ContentProvider';

// Renders About / Terms / Privacy / Publishing Agreement from CMS content.
// Body is plain text with blank lines separating paragraphs.
export default function StaticPage({
  pageKey,
}: {
  pageKey: 'about' | 'terms' | 'privacy' | 'publishingAgreement';
}) {
  const { pages } = useContent();
  const page = pages[pageKey];
  const paragraphs = page.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">{page.title}</h1>
        <div className="space-y-5 text-gray-700 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
