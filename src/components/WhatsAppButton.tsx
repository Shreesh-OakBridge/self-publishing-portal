import { useContent } from '../content/ContentProvider';
import { track } from '../lib/track';

// Floating "Chat on WhatsApp" button on public pages. Number comes from
// Content → Footer → whatsapp (digits incl. country code), falling back to the
// phone number. Toggle in Admin → Navigation → Footer blocks.
export default function WhatsAppButton() {
  const { footer, navigation } = useContent();
  if (navigation.showWhatsApp === false) return null;
  const number = (footer.whatsapp || footer.phone || '').replace(/[^0-9]/g, '');
  if (number.length < 8) return null;
  const text = encodeURIComponent('Hi Cursive, I would like to know more about publishing my book.');

  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('click_event', { label: 'whatsapp_float' })}
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed right-4 bottom-20 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-105 hover:shadow-xl transition-transform"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="currentColor" aria-hidden="true">
        <path d="M16.04 3C8.86 3 3.02 8.83 3.02 16c0 2.3.6 4.54 1.75 6.52L3 29l6.65-1.74A13 13 0 0 0 16.04 29C23.2 29 29 23.17 29 16S23.2 3 16.04 3Zm0 23.7c-2.02 0-4-.54-5.72-1.57l-.41-.24-3.95 1.03 1.05-3.84-.27-.4A10.6 10.6 0 0 1 5.4 16c0-5.86 4.78-10.63 10.65-10.63 5.86 0 10.62 4.77 10.62 10.63 0 5.87-4.77 10.7-10.63 10.7Zm5.83-7.97c-.32-.16-1.89-.93-2.18-1.04-.29-.1-.5-.16-.72.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.15-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65 0 1.57 1.14 3.08 1.3 3.3.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.2 2 .12.61-.09 1.89-.77 2.15-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  );
}
