import { useContent } from '../content/ContentProvider';

export default function ConfidenceBar() {
  const { confidenceBar } = useContent();
  if (!confidenceBar.enabled || confidenceBar.items.length === 0) return null;

  // Duplicate the items so the -50% translate loop is seamless.
  const loop = [...confidenceBar.items, ...confidenceBar.items];
  const duration = `${confidenceBar.speed || 30}s`;

  return (
    <div className="bg-gray-900 py-6 overflow-hidden">
      <div className="relative flex overflow-hidden">
        <div
          className="flex shrink-0 items-center gap-12 pr-12 marquee-track"
          style={{ animationDuration: duration }}
        >
          {loop.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center whitespace-nowrap">
              <span className="text-2xl font-bold text-amber-400">{item.label}</span>
              <span className="text-sm text-gray-300">{item.sublabel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
