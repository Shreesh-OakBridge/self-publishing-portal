import { useState, useEffect } from 'react';
import { Palette, Book, Layout, Ruler, ShoppingCart, Droplet, Layers, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import AuthModal from './AuthModal';

interface CustomizationData {
  paperType: string;
  interiorColor: string;
  binding: string;
  coverDesign: string;
  layoutOption: string;
  bookSize: string;
}

const paperTypes = [
  { id: 'glossy', name: 'Glossy Paper', desc: 'High shine finish, vibrant colors', price: 0 },
  { id: 'matte', name: 'Matte Paper', desc: 'Professional look, no glare', price: 500 },
  { id: 'premium', name: 'Premium Cream', desc: 'Classic feel, elegant appearance', price: 1000 },
  { id: 'recycled', name: 'Recycled Paper', desc: 'Eco-friendly option', price: 800 },
];

const coverDesigns = [
  { id: 'standard', name: 'Standard Design', desc: 'Clean, professional layout', price: 0 },
  { id: 'embossed', name: 'Embossed Cover', desc: 'Raised text & patterns', price: 2000 },
  { id: 'foil', name: 'Foil Stamping', desc: 'Metallic accents', price: 3500 },
  { id: 'textured', name: 'Textured Cover', desc: 'Premium tactile finish', price: 2500 },
  { id: 'full_color', name: 'Full Color HD', desc: 'Ultra-vibrant, photo-quality', price: 1500 },
];

const layoutOptions = [
  { id: 'single', name: 'Single Column', desc: 'Traditional book layout', price: 0 },
  { id: 'double', name: 'Two Column', desc: 'Modern, compact layout', price: 1000 },
  { id: 'illustrated', name: 'Illustrated Layout', desc: 'With art & graphics', price: 3000 },
  { id: 'custom', name: 'Custom Design', desc: 'Unique, personalized layout', price: 5000 },
];

// Standard Indian/UK trade book sizes (Width x Length / trim size).
// Hardback covers run slightly larger than paperback. The spine (H) is NOT a
// size choice — it's derived from page count (word count) by the pricing engine.
// `price` is a placeholder until the cost matrix is finalised.
interface BookSize {
  id: string;
  name: string;
  desc: string;
  pb: { w: number; l: number; win: number; lin: number };
  hb: { w: number; l: number; win: number; lin: number };
  price: number;
}

const bookSizes: BookSize[] = [
  { id: 'demy', name: 'Demy', desc: 'Classic novel / fiction size',
    pb: { w: 140, l: 215, win: 5.5, lin: 8.5 }, hb: { w: 145, l: 222, win: 5.7, lin: 8.75 }, price: 0 },
  { id: 'crown1', name: 'Crown1', desc: 'Compact non-fiction',
    pb: { w: 170, l: 240, win: 6.75, lin: 9.5 }, hb: { w: 174, l: 240, win: 6.85, lin: 9.5 }, price: 0 },
  { id: 'royal', name: 'Royal', desc: 'Popular all-rounder',
    pb: { w: 160, l: 240, win: 6.25, lin: 9.5 }, hb: { w: 163, l: 248, win: 6.4, lin: 9.75 }, price: 0 },
  { id: 'crown', name: 'Crown', desc: 'Wider trim, textbooks',
    pb: { w: 185, l: 235, win: 7.25, lin: 9.25 }, hb: { w: 188, l: 248, win: 7.4, lin: 9.75 }, price: 0 },
  { id: 'doubledemy', name: 'Double Demy', desc: 'Coffee-table / photo books',
    pb: { w: 215, l: 280, win: 8.5, lin: 11 }, hb: { w: 220, l: 285, win: 8.7, lin: 11.25 }, price: 0 },
];

// Width x Length string for a size in the chosen binding.
const sizeDims = (size: BookSize, binding: string) => {
  const d = binding === 'hardback' ? size.hb : size.pb;
  return `${d.w} × ${d.l} mm (${d.win}" × ${d.lin}")`;
};

// NOTE: color/binding prices below are placeholders — adjust to your real costs.
const colorOptions = [
  { id: 'bw', name: 'Black & White', desc: 'Single-color interior printing', price: 0 },
  { id: 'color', name: 'Full Color (4-Color)', desc: '4-color pages throughout', price: 2500 },
];

const bindingOptions = [
  { id: 'paperback', name: 'Paperback', desc: 'Soft cover, lightweight', price: 0 },
  { id: 'hardback', name: 'Hardback', desc: 'Hard cover, premium & durable', price: 1500 },
];

interface Suggestion {
  id: string;
  text: string;
  ctaLabel: string;
  field: keyof CustomizationData;
  value: string;
}

// Rule-based suggestions: contextual nudges based on what the author has picked.
// Each rule only fires when the recommended option isn't already selected.
function getSuggestions(c: CustomizationData): Suggestion[] {
  const s: Suggestion[] = [];
  const isLarge = c.bookSize === 'doubledemy';
  const premiumCover = ['foil', 'embossed', 'textured'].includes(c.coverDesign);

  if (c.interiorColor === 'color' && !['glossy', 'matte'].includes(c.paperType))
    s.push({ id: 'color-paper', text: 'Full-colour interiors look sharpest on glossy paper.', ctaLabel: 'Use Glossy Paper', field: 'paperType', value: 'glossy' });

  if (c.interiorColor === 'color' && c.binding !== 'hardback')
    s.push({ id: 'color-hardback', text: 'Colour photo books hold up better as a hardback.', ctaLabel: 'Make it Hardback', field: 'binding', value: 'hardback' });

  if (isLarge && c.interiorColor !== 'color')
    s.push({ id: 'large-color', text: 'Large formats really shine in full colour.', ctaLabel: 'Switch to Full Colour', field: 'interiorColor', value: 'color' });

  if (isLarge && c.layoutOption !== 'illustrated')
    s.push({ id: 'large-illustrated', text: 'Coffee-table sizes pair well with an illustrated layout.', ctaLabel: 'Use Illustrated Layout', field: 'layoutOption', value: 'illustrated' });

  if (c.layoutOption === 'illustrated' && c.interiorColor !== 'color')
    s.push({ id: 'illus-color', text: 'Illustrated layouts come alive in full colour.', ctaLabel: 'Switch to Full Colour', field: 'interiorColor', value: 'color' });

  if (premiumCover && c.binding !== 'hardback')
    s.push({ id: 'cover-hardback', text: 'A premium cover feels best on a hardback.', ctaLabel: 'Make it Hardback', field: 'binding', value: 'hardback' });

  if (c.binding === 'hardback' && c.paperType !== 'premium')
    s.push({ id: 'hardback-paper', text: 'Hardbacks pair beautifully with Premium Cream paper.', ctaLabel: 'Use Premium Cream', field: 'paperType', value: 'premium' });

  if (!isLarge && c.interiorColor === 'bw' && c.coverDesign === 'standard' && c.paperType === 'glossy')
    s.push({ id: 'novel-paper', text: 'For a classic novel, Premium Cream paper gives a refined reading feel.', ctaLabel: 'Use Premium Cream', field: 'paperType', value: 'premium' });

  return s.slice(0, 3); // keep it focused
}

export default function BookCustomizer() {
  const { user } = useAuth();
  const [customization, setCustomization] = useState<CustomizationData>({
    paperType: 'glossy',
    interiorColor: 'bw',
    binding: 'paperback',
    coverDesign: 'standard',
    layoutOption: 'single',
    bookSize: 'demy',
  });

  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'quote' | null>(null);

  useEffect(() => {
    calculatePrice();
  }, [customization]);

  const calculatePrice = () => {
    const baseCost = 8000; // Base production cost in INR

    const paperCost = paperTypes.find(p => p.id === customization.paperType)?.price || 0;
    const colorCost = colorOptions.find(c => c.id === customization.interiorColor)?.price || 0;
    const bindingCost = bindingOptions.find(b => b.id === customization.binding)?.price || 0;
    const coverCost = coverDesigns.find(c => c.id === customization.coverDesign)?.price || 0;
    const layoutCost = layoutOptions.find(l => l.id === customization.layoutOption)?.price || 0;
    const sizeCost = bookSizes.find(s => s.id === customization.bookSize)?.price || 0;

    const totalCost = baseCost + paperCost + colorCost + bindingCost + coverCost + layoutCost + sizeCost;
    setEstimatedPrice(totalCost);
  };

  const goToContact = () => {
    if (window.location.pathname.replace(/\/+$/, '') === '') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#contact';
    }
  };

  // Require login first so every saved design is tied to a real account we can
  // follow up with (name/email). Otherwise nudge the visitor to log in/sign up.
  const handleSaveClick = () => {
    if (user) {
      doSaveCustomization();
    } else {
      setPendingAction('save');
      setAuthOpen(true);
    }
  };

  const handleQuoteClick = () => {
    if (user) {
      goToContact();
    } else {
      setPendingAction('quote');
      setAuthOpen(true);
    }
  };

  const doSaveCustomization = async () => {
    setIsSaving(true);
    try {
      // Read the freshest session so saves right after login attach the user id.
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      const sessionId = `session_${Date.now()}`;

      const { error } = await supabase
        .from('book_customizations')
        .insert([
          {
            session_id: sessionId,
            user_id: uid,
            paper_type: customization.paperType,
            interior_color: customization.interiorColor,
            binding: customization.binding,
            cover_design: customization.coverDesign,
            layout_option: customization.layoutOption,
            book_size: customization.bookSize,
            estimated_price: estimatedPrice,
          },
        ]);

      if (error) throw error;

      alert('Book customization saved! You can view it anytime under My Account.');
    } catch (err) {
      console.error('Error saving customization:', err);
      alert('Error saving customization. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const suggestions = getSuggestions(customization);

  return (
    <section id="customizer" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Design Your Book
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Customize every aspect of your book production and get real-time price estimates.
            See exactly what you're getting before you commit.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Palette className="w-6 h-6 text-amber-600" />
                <h3 className="text-2xl font-bold text-gray-900">Paper Type</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {paperTypes.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => setCustomization({ ...customization, paperType: paper.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      customization.paperType === paper.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-300 bg-white hover:border-amber-300'
                    }`}
                  >
                    <h4 className="font-bold text-gray-900">{paper.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{paper.desc}</p>
                    <p className="text-sm font-semibold text-amber-600">
                      +₹{paper.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Book className="w-6 h-6 text-rose-600" />
                <h3 className="text-2xl font-bold text-gray-900">Cover Design</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {coverDesigns.map((cover) => (
                  <button
                    key={cover.id}
                    onClick={() => setCustomization({ ...customization, coverDesign: cover.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      customization.coverDesign === cover.id
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-300 bg-white hover:border-rose-300'
                    }`}
                  >
                    <h4 className="font-bold text-gray-900">{cover.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{cover.desc}</p>
                    <p className="text-sm font-semibold text-rose-600">
                      +₹{cover.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Layout className="w-6 h-6 text-orange-600" />
                <h3 className="text-2xl font-bold text-gray-900">Layout Style</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {layoutOptions.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => setCustomization({ ...customization, layoutOption: layout.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      customization.layoutOption === layout.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 bg-white hover:border-orange-300'
                    }`}
                  >
                    <h4 className="font-bold text-gray-900">{layout.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{layout.desc}</p>
                    <p className="text-sm font-semibold text-orange-600">
                      +₹{layout.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Ruler className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-bold text-gray-900">Book Size</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {bookSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setCustomization({ ...customization, bookSize: size.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      customization.bookSize === size.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-300 bg-white hover:border-purple-300'
                    }`}
                  >
                    <h4 className="font-bold text-gray-900">{size.name}</h4>
                    <p className="text-sm text-gray-600 mb-1">{size.desc}</p>
                    <p className="text-xs font-semibold text-purple-600">
                      {sizeDims(size, customization.binding)}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Dimensions shown for {customization.binding === 'hardback' ? 'Hardback' : 'Paperback'}.
                Spine width is calculated from your page count.
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Droplet className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Interior Color</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setCustomization({ ...customization, interiorColor: opt.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      customization.interiorColor === opt.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-blue-300'
                    }`}
                  >
                    <h4 className="font-bold text-gray-900">{opt.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{opt.desc}</p>
                    <p className="text-sm font-semibold text-blue-600">+₹{opt.price}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Layers className="w-6 h-6 text-green-600" />
                <h3 className="text-2xl font-bold text-gray-900">Binding</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {bindingOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setCustomization({ ...customization, binding: opt.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      customization.binding === opt.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-white hover:border-green-300'
                    }`}
                  >
                    <h4 className="font-bold text-gray-900">{opt.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{opt.desc}</p>
                    <p className="text-sm font-semibold text-green-600">+₹{opt.price}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky top-24 h-fit">
            <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Selection</h3>

                <div className="space-y-3 mb-6 pb-6 border-b-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Paper Type:</span>
                    <span className="font-semibold text-gray-900">
                      {paperTypes.find(p => p.id === customization.paperType)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Interior Color:</span>
                    <span className="font-semibold text-gray-900">
                      {colorOptions.find(c => c.id === customization.interiorColor)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Binding:</span>
                    <span className="font-semibold text-gray-900">
                      {bindingOptions.find(b => b.id === customization.binding)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Cover Design:</span>
                    <span className="font-semibold text-gray-900">
                      {coverDesigns.find(c => c.id === customization.coverDesign)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Layout:</span>
                    <span className="font-semibold text-gray-900">
                      {layoutOptions.find(l => l.id === customization.layoutOption)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Book Size:</span>
                    <span className="font-semibold text-gray-900 text-right">
                      {(() => {
                        const s = bookSizes.find((b) => b.id === customization.bookSize);
                        if (!s) return '—';
                        const d = customization.binding === 'hardback' ? s.hb : s.pb;
                        return `${s.name} (${d.w}×${d.l} mm)`;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl mb-6">
                  <p className="text-gray-600 text-sm mb-2">Estimated Production Cost (Per Book)</p>
                  <p className="text-4xl font-bold text-amber-600">₹{estimatedPrice.toLocaleString()}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    This is the production cost per unit. Varies by order quantity and plan tier.
                  </p>
                </div>

                {suggestions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                      Recommended for your book
                    </h4>
                    <div className="space-y-3">
                      {suggestions.map((s) => (
                        <div
                          key={s.id}
                          className="bg-amber-50 border border-amber-200 rounded-xl p-3"
                        >
                          <p className="text-sm text-gray-700 mb-2">{s.text}</p>
                          <button
                            onClick={() =>
                              setCustomization({ ...customization, [s.field]: s.value })
                            }
                            className="text-sm font-semibold text-amber-700 hover:text-amber-900"
                          >
                            {s.ctaLabel} →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 p-4 bg-blue-50 rounded-xl mb-6 border border-blue-200">
                  <p className="text-sm text-blue-900 font-semibold">Pro Tip:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Larger orders reduce per-unit cost</li>
                    <li>✓ Premium options add ₹500-5000</li>
                    <li>✓ Professional plans include free design</li>
                  </ul>
                </div>

                <button
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isSaving ? 'Saving...' : 'Save This Configuration'}</span>
                </button>

                <button
                  onClick={handleQuoteClick}
                  className="w-full border-2 border-amber-600 text-amber-600 py-3 rounded-xl font-semibold hover:bg-amber-50 transition-colors mt-3"
                >
                  Get Quote for This Design
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => {
          if (pendingAction === 'save') doSaveCustomization();
          else if (pendingAction === 'quote') goToContact();
          setPendingAction(null);
        }}
        heading="Log in or sign up to save your design"
      />
    </section>
  );
}
