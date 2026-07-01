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

  const heading = 'text-xs font-bold uppercase tracking-wider text-gray-500 mb-5';
  const link = 'text-gray-300 hover:text-amber-500 transition-colors';

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 md:py-20">
        {/* Top — balanced 12-column grid */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-10 gap-y-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4 lg:pr-6">
            <div className="flex items-center gap-3 mb-5">
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
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{footer.tagline}</p>

            {socials.length > 0 && (
              <div className="flex items-center gap-2.5 mt-6">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-amber-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Company */}
          <nav className="lg:col-span-2">
            <h4 className={heading}>Company</h4>
            <ul className="space-y-3 text-sm">
              <li><a href={withBase('/about')} className={link}>About Us</a></li>
              <li><a href={withBase('/services')} className={link}>Services</a></li>
              <li><button onClick={() => goToSection('process')} className={link}>Our Process</button></li>
              <li><a href={withBase('/faq')} className={link}>FAQ</a></li>
            </ul>
          </nav>

          {/* Useful Links */}
          <nav className="lg:col-span-2">
            <h4 className={heading}>Explore</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => goToSection('home')} className={link}>Home</button></li>
              <li><button onClick={() => goToSection('plans')} className={link}>Pricing Plans</button></li>
              <li><a href={withBase('/customize')} className={link}>Customize a Book</a></li>
              <li><a href={withBase('/royalty-calculator')} className={link}>Royalty Calculator</a></li>
              <li><button onClick={() => goToSection('submit')} className={link}>Submit Manuscript</button></li>
            </ul>
          </nav>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-2">
            <h4 className={heading}>Contact</h4>
            <ul className="space-y-3.5 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <a href={`mailto:${footer.email}`} className="hover:text-amber-500 transition-colors break-all">{footer.email}</a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <a href={`tel:${footer.phone}`} className="hover:text-amber-500 transition-colors">{footer.phone}</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>{footer.location}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 lg:col-span-2">
            <h4 className={heading}>{footer.newsletterHeading}</h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{footer.newsletterText}</p>
            {subState === 'done' ? (
              <p className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> You’re subscribed — thank you!
              </p>
            ) : (
              <div className="flex items-center gap-2 max-w-xs">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (subState === 'err') setSubState('idle');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && subscribe()}
                  placeholder="Your email"
                  className={`flex-1 min-w-0 px-3.5 py-2.5 rounded-lg bg-white/5 border text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500 transition-colors ${
                    subState === 'err' ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                <button
                  onClick={subscribe}
                  disabled={subState === 'saving'}
                  aria-label="Subscribe"
                  className="p-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 flex-shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
            {subState === 'err' && <p className="text-red-400 text-xs mt-1.5">Please enter a valid email.</p>}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm text-center sm:text-left">
            &copy; {new Date().getFullYear()} {footer.copyrightName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <a href={withBase('/terms')} className={link}>Terms &amp; Conditions</a>
            <a href={withBase('/privacy')} className={link}>Privacy Policy</a>
            <a href={withBase('/publishing-agreement')} className={link}>Publishing Agreement</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
