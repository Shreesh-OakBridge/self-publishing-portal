import { useState, useEffect } from 'react';
import { Palette, Book, Layout, Ruler, ShoppingCart, Droplet, Layers } from 'lucide-react';
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

const bookSizes = [
  { id: '5x8', name: '5" x 8"', desc: 'Pocket-sized, portable', price: 0 },
  { id: '6x9', name: '6" x 9"', desc: 'Standard paperback size', price: 500 },
  { id: '8x10', name: '8" x 10"', desc: 'Coffee table book size', price: 1500 },
  { id: 'large', name: 'Large Format (10" x 12")', desc: 'Premium oversized edition', price: 3000 },
];

// NOTE: color/binding prices below are placeholders — adjust to your real costs.
const colorOptions = [
  { id: 'bw', name: 'Black & White', desc: 'Single-color interior printing', price: 0 },
  { id: 'color', name: 'Full Color (4-Color)', desc: '4-color pages throughout', price: 2500 },
];

const bindingOptions = [
  { id: 'paperback', name: 'Paperback', desc: 'Soft cover, lightweight', price: 0 },
  { id: 'hardback', name: 'Hardback', desc: 'Hard cover, premium & durable', price: 1500 },
];

export default function BookCustomizer() {
  const { user } = useAuth();
  const [customization, setCustomization] = useState<CustomizationData>({
    paperType: 'glossy',
    interiorColor: 'bw',
    binding: 'paperback',
    coverDesign: 'standard',
    layoutOption: 'single',
    bookSize: '6x9',
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
                    <p className="text-sm text-gray-600 mb-2">{size.desc}</p>
                    <p className="text-sm font-semibold text-purple-600">
                      +₹{size.price}
                    </p>
                  </button>
                ))}
              </div>
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
                    <span className="font-semibold text-gray-900">
                      {bookSizes.find(s => s.id === customization.bookSize)?.name}
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
