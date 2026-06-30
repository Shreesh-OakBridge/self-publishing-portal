import { Feather, Sparkles, BookOpen } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { go } from '../lib/basePath';
import { track } from '../lib/track';

const cardIcons = [Feather, Sparkles, BookOpen];
const cardGradients = [
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-orange-500 to-amber-500',
];

export default function Hero() {
  const { hero } = useContent();

  const goToJourneys = () => {
    track('click_event', { label: 'hero_primary_cta', destination: 'get-started' });
    go('/get-started');
  };

  return (
    <section id="home" className="pt-32 pb-20 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-amber-100 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800 font-semibold">{hero.badge}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            {hero.headlineLine1}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-rose-600">
              {hero.headlineLine2}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
            {hero.subheading}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={goToJourneys}
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {hero.primaryCta}
            </button>
            <button
              onClick={() => {
                track('click_event', { label: 'hero_view_plans' });
                document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-2 border-amber-600 text-amber-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-50 transition-all"
            >
              {hero.secondaryCta}
            </button>
          </div>
        </div>
      </div>

      {hero.imageUrl && (
        <img
          src={hero.imageUrl}
          alt={hero.imageAlt || ''}
          className="mt-12 w-full h-auto block"
        />
      )}

      <div className="max-w-7xl mx-auto px-4">
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {hero.cards.map((card, index) => {
            const Icon = cardIcons[index % cardIcons.length];
            return (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${cardGradients[index % cardGradients.length]} rounded-xl flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-600">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
