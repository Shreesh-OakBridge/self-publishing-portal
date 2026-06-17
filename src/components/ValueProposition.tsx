import { Heart, Lightbulb, Users, TrendingUp } from 'lucide-react';
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

  return (
    <section id="about" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{v.heading}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{v.subheading}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-gray-900">{v.whyHeading}</h3>
            <p className="text-lg text-gray-700 leading-relaxed">{v.whyParagraph1}</p>
            <p className="text-lg text-gray-700 leading-relaxed">{v.whyParagraph2}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{v.changesHeading}</h3>
            <ul className="space-y-4">
              {v.changesPoints.map((point, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-gray-800 text-lg">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {v.cards.map((card, index) => {
            const Icon = cardIcons[index % cardIcons.length];
            return (
              <div key={index} className="text-center">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${cardGradients[index % cardGradients.length]} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h4>
                <p className="text-gray-600">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
