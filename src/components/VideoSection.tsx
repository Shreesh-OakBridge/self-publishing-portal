import { useState } from 'react';
import { Play, CheckCircle, Star, ChevronDown } from 'lucide-react';
import { useContent } from '../content/ContentProvider';

const stepGradients = [
  'from-amber-500 to-orange-500',
  'from-orange-500 to-rose-500',
  'from-rose-500 to-pink-500',
  'from-pink-500 to-purple-500',
  'from-purple-500 to-indigo-500',
  'from-indigo-500 to-blue-500',
];

// Uploaded files (direct video URLs) play in a <video>; embed links use <iframe>.
const isFileUrl = (url: string) =>
  /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url) ||
  url.includes('/storage/v1/object/public/');

export default function VideoSection() {
  const { video } = useContent();
  const [playing, setPlaying] = useState(false);

  return (
    <section id="process" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{video.heading}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{video.subheading}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-12">
          {playing && video.videoUrl ? (
            <div className="aspect-video">
              {isFileUrl(video.videoUrl) ? (
                <video
                  src={video.videoUrl}
                  className="w-full h-full"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <iframe
                  src={video.videoUrl}
                  title={video.overlayTitle}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          ) : (
            <div
              className="aspect-video bg-gradient-to-br from-amber-900 to-orange-900 bg-cover bg-center relative group cursor-pointer"
              style={video.posterUrl ? { backgroundImage: `url(${video.posterUrl})` } : undefined}
              onClick={() => video.videoUrl && setPlaying(true)}
              role={video.videoUrl ? 'button' : undefined}
              aria-label={video.videoUrl ? 'Play video' : undefined}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-amber-600 ml-1" fill="currentColor" />
                </div>
              </div>
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="text-2xl font-bold text-white mb-2">{video.overlayTitle}</h3>
                <p className="text-white/90">{video.overlaySubtitle}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">{video.apartHeading}</h3>

            {/* Desktop: full list */}
            <div className="hidden md:block space-y-4">
              {video.apartItems.map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: tap-to-expand accordion */}
            <div className="md:hidden divide-y rounded-2xl border bg-white">
              {video.apartItems.map((item, index) => (
                <details key={index} className="group">
                  <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      {item.title}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="px-4 pb-4 text-gray-600 text-sm">{item.description}</p>
                </details>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">{video.processHeading}</h3>

            {/* Desktop: numbered list */}
            <div className="hidden md:block space-y-6">
              {video.processSteps.map((step, index) => (
                <div key={index} className="flex space-x-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${stepGradients[index % stepGradients.length]} rounded-xl flex items-center justify-center text-white font-bold text-xl`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: compact 2-column grid */}
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {video.processSteps.map((step, index) => (
                <div key={index} className="bg-white rounded-xl border p-3">
                  <div
                    className={`w-8 h-8 bg-gradient-to-br ${stepGradients[index % stepGradients.length]} rounded-lg flex items-center justify-center text-white font-bold mb-2`}
                  >
                    {index + 1}
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1">{step.title}</h4>
                  <p className="text-gray-600 text-xs leading-snug">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-200 mt-6">
              <div className="flex items-center space-x-3 mb-2">
                <Star className="w-6 h-6 text-amber-600" fill="currentColor" />
                <h4 className="text-lg font-bold text-gray-900">{video.partnershipTitle}</h4>
              </div>
              <p className="text-gray-700">{video.partnershipText}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
