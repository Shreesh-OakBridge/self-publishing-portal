import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useContent } from '../content/ContentProvider';

export default function ContactForm() {
  const { contact } = useContent();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    manuscript_title: '',
    genre: '',
    manuscript_status: 'draft',
    preferred_plan: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  // Honeypot: legitimate users never see or fill this; bots usually do.
  const [honeypot, setHoneypot] = useState('');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Bot filled the hidden field — silently pretend success, skip the insert.
    if (honeypot.trim() !== '') {
      setIsSuccess(true);
      return;
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: submitError } = await supabase
        .from('publishing_leads')
        .insert([formData]);

      if (submitError) throw submitError;

      setIsSuccess(true);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        manuscript_title: '',
        genre: '',
        manuscript_status: 'draft',
        preferred_plan: '',
        message: '',
      });

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err) {
      setError('There was an error submitting your information. Please try again.');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-3xl p-12 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-3xl font-bold text-gray-900 mb-4">{contact.successTitle}</h3>
        <p className="text-xl text-gray-700 mb-2">{contact.successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
      {/* Honeypot field — hidden from users, off-screen and excluded from tab order */}
      <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <h3 className="text-3xl font-bold text-gray-900 mb-6">{contact.heading}</h3>
      <p className="text-gray-600 mb-8">{contact.subheading}</p>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="full_name" className="block text-gray-700 font-semibold mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="phone" className="block text-gray-700 font-semibold mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            placeholder="+91 98765 43210"
          />
        </div>

        <div>
          <label htmlFor="preferred_plan" className="block text-gray-700 font-semibold mb-2">
            Preferred Plan
          </label>
          <select
            id="preferred_plan"
            name="preferred_plan"
            value={formData.preferred_plan}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
          >
            <option value="">Select a plan</option>
            <option value="Starter">Starter - ₹29,999</option>
            <option value="Professional">Professional - ₹79,999</option>
            <option value="Excellence">Excellence - ₹1,59,999</option>
            <option value="Elite">Elite - ₹2,99,999</option>
            <option value="Custom">Custom Package</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="manuscript_title" className="block text-gray-700 font-semibold mb-2">
            Manuscript Title (Working Title)
          </label>
          <input
            type="text"
            id="manuscript_title"
            name="manuscript_title"
            value={formData.manuscript_title}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            placeholder="Your Book Title"
          />
        </div>

        <div>
          <label htmlFor="genre" className="block text-gray-700 font-semibold mb-2">
            Genre
          </label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
          >
            <option value="">Select a genre</option>
            <option value="Fiction">Fiction</option>
            <option value="Non-Fiction">Non-Fiction</option>
            <option value="Biography/Memoir">Biography/Memoir</option>
            <option value="Business">Business</option>
            <option value="Self-Help">Self-Help</option>
            <option value="Science Fiction/Fantasy">Science Fiction/Fantasy</option>
            <option value="Mystery/Thriller">Mystery/Thriller</option>
            <option value="Romance">Romance</option>
            <option value="Children's">Children's</option>
            <option value="Poetry">Poetry</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="manuscript_status" className="block text-gray-700 font-semibold mb-2">
          Manuscript Status *
        </label>
        <select
          id="manuscript_status"
          name="manuscript_status"
          value={formData.manuscript_status}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
        >
          <option value="draft">Draft - Still writing</option>
          <option value="first_draft">First Draft Complete</option>
          <option value="revised">Revised - Ready for editing</option>
          <option value="completed">Completed & Polished</option>
          <option value="idea">Just an idea - Early stages</option>
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">
          Tell Us About Your Project
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
          placeholder="Share any additional details about your manuscript, your goals, or questions you have..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-xl text-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isSubmitting ? (
          <>
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <span>Submit Your Information</span>
            <Send className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-gray-500 text-sm mt-4 text-center">
        By submitting this form, you agree to be contacted by OakBridge Publishing regarding your
        publishing project.
      </p>
    </form>
  );
}
