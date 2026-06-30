import { useState } from 'react';
import { X, Send, CheckCircle, Mail, Phone, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useContent } from '../content/ContentProvider';
import { track } from '../lib/track';

// "Talk to us" warm-lead handoff. Works for anonymous (email required) and
// logged-in (name/email pre-filled) users. Submits to publishing_leads (which
// emails the team), attaching the planner/estimate context.
export default function TalkToUsModal({
  open,
  onClose,
  plan,
  context,
  name: initialName,
  email: initialEmail,
}: {
  open: boolean;
  onClose: () => void;
  plan: string | null;
  context: string;
  name?: string;
  email?: string;
}) {
  const { footer } = useContent();
  const [name, setName] = useState(initialName ?? '');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const waNumber = (footer.phone || '').replace(/[^0-9]/g, '');

  const submit = async () => {
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Please enter a valid email so our team can reach you.');
      return;
    }
    setSubmitting(true);
    setError('');
    const composed = [message.trim(), '--- From the instant estimate ---', context]
      .filter(Boolean)
      .join('\n\n');
    const { error: err } = await supabase.from('publishing_leads').insert([
      {
        full_name: name.trim() || 'Website visitor',
        email: email.trim(),
        phone: phone.trim() || null,
        preferred_plan: plan || '',
        manuscript_status: 'draft',
        message: composed,
      },
    ]);
    setSubmitting(false);
    if (err) {
      console.error(err);
      setError('Could not send your request. Please try again, or email us directly.');
      return;
    }
    track('click_event', { label: 'talk_to_us_submit', plan });
    setDone(true);
  };

  const field =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none';

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="text-center py-4">
            <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thanks — we’ll be in touch</h2>
            <p className="text-gray-600 mb-5">
              Our team will reach out within a working day. Prefer to talk now? Use any of these:
            </p>
            <div className="space-y-2 text-left">
              {footer.email && (
                <a href={`mailto:${footer.email}`} className="flex items-center gap-3 border rounded-xl px-4 py-3 hover:bg-gray-50">
                  <Mail className="w-5 h-5 text-amber-600" /> <span className="text-gray-800">{footer.email}</span>
                </a>
              )}
              {footer.phone && (
                <a href={`tel:${footer.phone}`} className="flex items-center gap-3 border rounded-xl px-4 py-3 hover:bg-gray-50">
                  <Phone className="w-5 h-5 text-amber-600" /> <span className="text-gray-800">{footer.phone}</span>
                </a>
              )}
              {waNumber && (
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 border rounded-xl px-4 py-3 hover:bg-gray-50"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" /> <span className="text-gray-800">WhatsApp us</span>
                </a>
              )}
            </div>
            <button onClick={onClose} className="mt-5 w-full bg-gray-900 text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800">
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Talk to us</h2>
            <p className="text-sm text-gray-500 mb-4">
              Leave your details{plan ? ` about the ${plan} plan` : ''} and our team will reach out. We’ll bring your
              estimate along.
            </p>

            {error && <div className="bg-red-50 text-red-700 text-sm p-2.5 rounded-lg mb-3">{error}</div>}

            <div className="space-y-3">
              <input className={field} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <input
                className={field}
                type="email"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input className={field} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <textarea
                className={field}
                rows={3}
                placeholder="Anything you’d like to tell us? (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button
              onClick={submit}
              disabled={submitting}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Sending…' : 'Send & request a call'}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">We only use your email to get back to you.</p>
          </>
        )}
      </div>
    </div>
  );
}
