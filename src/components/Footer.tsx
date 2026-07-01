import { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Twitter, Youtube, Send, CheckCircle } from 'lucide-react';
import { useContent } from '../content/ContentProvider';
import { supabase } from '../lib/supabase';
import { go, withBase, stripBase } from '../lib/basePath';

export default function Footer() {
  const { footer, branding } = useContent();

  const socials = [
    { url: footer.social?.facebook, Icon: Facebook, label: 'Facebook' },
    { url: footer.social?.instagram, Icon: Instagram, label: 'Instagram' },
    { url: footer.social?.linkedin, Icon: Linkedin, label: 'LinkedIn' },
    { url: footer.social?.twitter, Icon: Twitter, label: 'X / Twitter' },
    { url: footer.social?.youtube, Icon: Youtube, label: 'YouTube' },
  ].filter((s) => s.url && s.url.trim());

  const [email, setEmail] = useState('');
  const [subState, setSubState] = useState<'idle' | 'saving' | 'done' | 'err'>('idle');
  const subscribe = async () => {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setSubState('err');
      return;
    }
    setSubState('saving');
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: e });
    // A duplicate email (already subscribed) is still a success from the user's view.
    if (error && !/duplicate|unique/i.test(error.message)) {
      setSubState('err');
      return;
    }
    setEmail('');
    setSubState('done');
  };

  const goToSection = (id: string) => {
    if (stripBase(window.location.pathname) === '') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      go(`/#${id}`);
    }
  };

  return (
    <footer className="bg-gray-900 text-white py-12 md:py-16 px-5 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-8 lg:gap-24 mb-10 md:mb-12">
          <div className="lg:max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={withBase(branding.logoUrl || '/logo.svg')}
                alt={branding.logoAlt || 'Cursive'}
                className="h-10 w-auto object-contain"
              />
              <span className="text-[11px] font-semibold text-amber-500 leading-tight">
                An Imprint
                <br />
                of OakBridge
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">{footer.tagline}</p>

            {socials.length > 0 && (
              <div className="flex items-center gap-3 mt-5">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-amber-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}

            {/* Newsletter */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-white mb-1">{footer.newsletterHeading}</h4>
              <p className="text-gray-400 text-xs mb-2">{footer.newsletterText}</p>
              {subState === 'done' ? (
                <p className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" /> You’re subscribed — thank you!
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (subState === 'err') setSubState('idle');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && subscribe()}
                    placeholder="Your email"
                    className={`flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/10 border text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500 ${
                      subState === 'err' ? 'border-red-500' : 'border-white/10'
                    }`}
                  />
                  <button
                    onClick={subscribe}
                    disabled={subState === 'saving'}
                    aria-label="Subscribe"
                    className="p-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
              {subState === 'err' && <p className="text-red-400 text-xs mt-1">Please enter a valid email.</p>}
            </div>
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
