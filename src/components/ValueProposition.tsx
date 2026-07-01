import { Heart, Lightbulb, Users, TrendingUp, ChevronDown } from 'lucide-react';
import { useContent } from '../content/ContentProvider';

const cardIcons = [Heart, Lightbulb, Users, TrendingUp];
const cardGradients = [
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
];

export default function ValueProposition() {
  const { valueProps: v } = useContent();

  const points = v.changesPoints.map((point, index) => (
    <li key={index} className="flex items-start space-x-3">
      <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-white text-xs font-bold">✓</span>
      </div>
      <span className="text-gray-800 text-base md:text-lg">{point}</span>
    </li>
  ));

  return (
    <section id="about" className="py-14 md:py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">{v.heading}</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{v.subheading}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-10 md:mb-16">
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{v.whyHeading}</h3>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">{v.whyParagraph1}</p>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">{v.whyParagraph2}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 md:p-8 rounded-3xl">
            {/* Desktop: always expanded */}
            <h3 className="hidden md:block text-2xl font-bold text-gray-900 mb-6">{v.changesHeading}</h3>
            <ul className="hidden md:block space-y-4">{points}</ul>

            {/* Mobile: collapsible to reduce scroll (tap to expand) */}
            <details className="md:hidden group">
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <h3 className="text-xl font-bold text-gray-900">{v.changesHeading}</h3>
                <ChevronDown className="w-5 h-5 text-amber-700 flex-shrink-0 group-open:rotate-180 transition-transform" />
              </summary>
              <ul className="space-y-3 mt-4">{points}</ul>
            </details>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
          {v.cards.map((card, index) => {
            const Icon = cardIcons[index % cardIcons.length];
            return (
              <div key={index} className="text-center">
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${cardGradients[index % cardGradients.length]} rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4`}
                >
                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h4 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-2">{card.title}</h4>
                <p className="text-sm md:text-base text-gray-600">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
