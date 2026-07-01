import { useContent } from '../content/ContentProvider';
import { withBase } from '../lib/basePath';
import { resolveServiceIcon } from '../lib/serviceIcons';

export default function ServicesPage() {
  const { services } = useContent();

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{services.heading}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{services.subheading}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.items.map((s, i) => {
            const Icon = resolveServiceIcon(s.icon, i);
            return (
              <div
                key={s.title}
                className="bg-white border border-gray-200 rounded-2xl p-7 hover:shadow-lg hover:border-amber-200 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <a
            href={withBase('/plans')}
            className="inline-block bg-amber-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-700 transition-colors"
          >
            View Publishing Plans
          </a>
        </div>
      </div>
    </section>
  );
}