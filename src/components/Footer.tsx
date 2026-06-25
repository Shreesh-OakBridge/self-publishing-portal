import { Mail, Phone, MapPin } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { go, withBase, stripBase } from '../lib/basePath';

export default function Footer() {
  const { footer, branding } = useContent();

  const goToSection = (id: string) => {
    if (stripBase(window.location.pathname) === '') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      go(`/#${id}`);
    }
  };

  return (
    <footer className="bg-gray-900 text-white py-16 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-10 lg:gap-24 mb-12">
          <div className="lg:max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={withBase(branding.logoUrl || '/logo.svg')}
                alt="Cursive"
                className="h-10 w-auto object-contain"
              />
              <span className="text-[11px] font-semibold text-amber-500 leading-tight">
                An Imprint
                <br />
                of OakBridge
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">{footer.tagline}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-16">
          <div>
            <h4 className="text-lg font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href={withBase('/about')} className="text-gray-400 hover:text-amber-500 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href={withBase('/services')} className="text-gray-400 hover:text-amber-500 transition-colors">
                  Services
                </a>
              </li>
              <li>
                <button
                  onClick={() => goToSection('process')}
                  className="text-gray-400 hover:text-amber-500 transition-colors"
                >
                  Our Process
                </button>
              </li>
              <li>
                <a href={withBase('/faq')} className="text-gray-400 hover:text-amber-500 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Useful Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => goToSection('home')}
                  className="text-gray-400 hover:text-amber-500 transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => goToSection('plans')}
                  className="text-gray-400 hover:text-amber-500 transition-colors"
                >
                  Pricing Plans
                </button>
              </li>
              <li>
                <a href={withBase('/customize')} className="text-gray-400 hover:text-amber-500 transition-colors">
                  Customize a Book
                </a>
              </li>
              <li>
                <a href={withBase('/royalty-calculator')} className="text-gray-400 hover:text-amber-500 transition-colors">
                  Royalty Calculator
                </a>
              </li>
              <li>
                <button
                  onClick={() => goToSection('submit')}
                  className="text-gray-400 hover:text-amber-500 transition-colors"
                >
                  Submit Manuscript
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5 text-amber-500" />
                <span>{footer.email}</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5 text-amber-500" />
                <span>{footer.phone}</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 text-amber-500" />
                <span>{footer.location}</span>
              </li>
            </ul>
          </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4 text-sm">
            <a href={withBase('/terms')} className="text-gray-400 hover:text-amber-500 transition-colors">
              Terms &amp; Conditions
            </a>
            <span className="text-gray-700">|</span>
            <a href={withBase('/privacy')} className="text-gray-400 hover:text-amber-500 transition-colors">
              Privacy Policy
            </a>
            <span className="text-gray-700">|</span>
            <a href={withBase('/publishing-agreement')} className="text-gray-400 hover:text-amber-500 transition-colors">
              Publishing Agreement
            </a>
          </div>
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} {footer.copyrightName}. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Empowering authors to share their stories with the world.
          </p>
        </div>
      </div>
    </footer>
  );
}
