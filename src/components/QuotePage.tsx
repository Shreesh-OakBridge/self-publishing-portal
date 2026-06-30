import { useEffect, useState } from 'react';
import { FileText, CheckCircle, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useContent } from '../content/ContentProvider';
import { go, withBase } from '../lib/basePath';
import { track } from '../lib/track';

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Dedicated "Request a quote" page. Carries the customizer configuration via
// query params (paper/color/binding/cover/layout/size/price), shows a summary,
// and records a quote request the team can follow up on from the admin panel.
export default function QuotePage() {
  const { user, loading } = useAuth();
  const { customizer } = useContent();
  const params = new URLSearchParams(window.location.search);

  // Customization snapshot (option ids) from the URL.
  const cfg = {
    paper_type: params.get('paper') || '',
    interior_color: params.get('color') || '',
    binding: params.get('binding') || '',
    cover_design: params.get('cover') || '',
    layout_option: params.get('layout') || '',
    book_size: params.get('size') || '',
  };
  const estimatedPrice = Number(params.get('price') || 0) || 0;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Quotes are tied to an account so the team can follow up — require login.
  useEffect(() => {
    if (!loading && !user) go('/login');
  }, [loading, user]);

  useEffect(() => {
    if (user) {
      const fullName = (user.user_metadata?.full_name as string) || '';
      if (fullName) setName(fullName);
    }
  }, [user]);

  // Map an option id to its friendly CMS name.
  const optName = (list: { id: string; name: string }[], id: string) =>
    list.find((o) => o.id === id)?.name || id || '—';
  const combo: [string, string][] = [
    ['Size', optName(customizer.bookSizes, cfg.book_size)],
    ['Binding', optName(customizer.bindingOptions, cfg.binding)],
    ['Interior', optName(customizer.colorOptions, cfg.interior_color)],
    ['Paper', optName(customizer.paperTypes, cfg.paper_type)],
    ['Cover', optName(customizer.coverDesigns, cfg.cover_design)],
    ['Layout', optName(customizer.layoutOptions, cfg.layout_option)],
  ];

  const submit = async () => {
    if (!user) return;
    if (!name.trim() || !phone.trim()) {
      setError('Please add your name and a phone number so we can reach you.');
      return;
    }
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('quotes').insert({
      user_id: user.id,
      email: user.email,
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim() || null,
      ...cfg,
      estimated_price: estimatedPrice || null,
      status: 'new',
    });
    setSubmitting(false);
    if (err) {
      console.error(err);
      setError('Could not send your request. Please try again.');
      return;
    }
    track('quote_requested', { estimated_price: estimatedPrice || 0 });
    setSubmitted(true);
    window.scrollTo({ top: 0 });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading…</div>;
  }

  const field =
    'w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all';

  const Summary = () => (
    <div className="bg-white rounded-2xl border p-6">
      <h2 className="font-bold text-gray-900 mb-3">Your book configuration</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {combo.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-gray-500">{k}</span>
            <span className="text-gray-800 font-medium">{v}</span>
          </div>
        ))}
      </div>
      {estimatedPrice > 0 && (
        <div className="flex justify-between items-center pt-3 mt-3 border-t">
          <span className="text-gray-600">Estimated price</span>
          <span className="text-lg font-bold text-amber-600">{inr(estimatedPrice)}</span>
        </div>
      )}
    </div>
  );

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border p-8 text-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quote request received</h1>
          <p className="text-gray-600">
            Thanks{name ? `, ${name.split(' ')[0]}` : ''}! Our team will review your configuration and get back to
            you with a tailored quote shortly.
          </p>
        </div>
        <div className="mb-6">
          <Summary />
        </div>
        <button
          onClick={() => go('/account')}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700"
        >
          Go to My Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button
        onClick={() => go('/customize')}
        className="flex items-center gap-2 text-gray-500 hover:text-amber-700 text-sm mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to the customizer
      </button>

      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-6 h-6 text-amber-600" />
        <h1 className="text-2xl font-bold text-gray-900">Request a quote</h1>
      </div>
      <p className="text-gray-600 mb-6">
        Prefer a tailored price? Share your details below and we’ll prepare a quote for the configuration you built.
      </p>

      <div className="space-y-6">
        <Summary />

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border p-6 space-y-3">
          <h2 className="font-bold text-gray-900 mb-1">Your details</h2>
          <input className={field} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={field} placeholder="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className={`${field} bg-gray-50 text-gray-500`} value={user?.email ?? ''} disabled />
          <textarea
            className={`${field} resize-y`}
            rows={4}
            placeholder="Anything specific about your book or quantities? (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          <span>{submitting ? 'Sending…' : 'Send quote request'}</span>
        </button>
        <p className="text-xs text-gray-400 text-center">
          By submitting you agree to be contacted about your request. See our{' '}
          <a href={withBase('/privacy')} target="_blank" rel="noreferrer" className="text-amber-700 underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
