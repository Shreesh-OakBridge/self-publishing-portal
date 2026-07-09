import { useState, useEffect } from 'react';
import { Palette, Book, Layout, Ruler, ShoppingCart, Droplet, Layers, Sparkles, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useContent } from '../content/ContentProvider';
import type { CustomizerSize } from '../content/defaults';
import AuthModal from './AuthModal';
import CustomizeQuestionnaire from './CustomizeQuestionnaire';
import Toast, { type ToastMsg } from './Toast';
import { go } from '../lib/basePath';
import { normalizeQuestions, questionnairePriceImpact } from '../lib/customizerQuestions';

interface CustomizationData {
  paperType: string;
  interiorColor: string;
  binding: string;
  coverDesign: string;
  layoutOption: string;
  bookSize: string;
}

// All option lists, prices and headings are now managed in the CMS
// (Site Content → Book Customizer). Width x Length string for a size below.
const sizeDims = (size: CustomizerSize, binding: string) => {
  const d = binding === 'hardback' ? size.hb : size.pb;
  return `${d.w} × ${d.l} mm (${d.win}" × ${d.lin}")`;
};

interface Suggestion {
  id: string;
  text: string;
  ctaLabel: string;
  field: keyof CustomizationData;
  value: string;
}

// Rule-based suggestions: contextual nudges based on what the author has picked.
//
// Conflict-free by construction: candidates are generated in priority order,
// then we keep at most ONE suggestion per field. Each rule's target value is
// chosen so it can never be "undone" by another rule (e.g. the hardback paper
// nudge accepts 130 GSM art paper, so a colour+hardback book settles on art
// paper instead of ping-ponging between two paper suggestions).
function getSuggestions(c: CustomizationData): Suggestion[] {
  const candidates: Suggestion[] = [];
  const isLarge = c.bookSize === 'doubledemy';
  const isColour = c.interiorColor === 'color';
  const premiumCover = ['foil', 'embossed'].includes(c.coverDesign);

  // --- Paper (one winner) ---
  if (isColour && c.paperType !== 'art130')
    candidates.push({ id: 'colour-paper', text: 'Full-colour pages look sharpest on coated 130 GSM art paper.', ctaLabel: 'Use 130 GSM Art Paper', field: 'paperType', value: 'art130' });
  else if (c.binding === 'hardback' && !['cream90', 'art130'].includes(c.paperType))
    candidates.push({ id: 'hardback-paper', text: 'Hardbacks feel best on heavier 90 GSM premium cream paper.', ctaLabel: 'Use 90 GSM Premium Cream', field: 'paperType', value: 'cream90' });
  else if (!isLarge && !isColour && c.coverDesign === 'standard' && c.paperType === 'std70')
    candidates.push({ id: 'novel-paper', text: 'For a classic novel, 90 GSM cream paper gives a more refined reading feel.', ctaLabel: 'Try 90 GSM Cream', field: 'paperType', value: 'cream90' });

  // --- Binding (one winner) ---
  if (isColour && c.binding !== 'hardback')
    candidates.push({ id: 'colour-hardback', text: 'Colour photo books hold up much better as a hardback.', ctaLabel: 'Make it Hardback', field: 'binding', value: 'hardback' });
  else if (premiumCover && c.binding !== 'hardback')
    candidates.push({ id: 'cover-hardback', text: 'A premium cover feels best on a hardback.', ctaLabel: 'Make it Hardback', field: 'binding', value: 'hardback' });

  // --- Interior colour (one winner) ---
  if (isLarge && !isColour)
    candidates.push({ id: 'large-colour', text: 'Large coffee-table sizes really shine in full colour.', ctaLabel: 'Switch to Full Colour', field: 'interiorColor', value: 'color' });
  else if (c.layoutOption === 'illustrated' && !isColour)
    candidates.push({ id: 'illus-colour', text: 'Illustrated layouts come alive in full colour.', ctaLabel: 'Switch to Full Colour', field: 'interiorColor', value: 'color' });

  // --- Layout (one winner) ---
  if (isLarge && c.layoutOption !== 'illustrated')
    candidates.push({ id: 'large-illustrated', text: 'Coffee-table sizes pair well with an illustrated layout.', ctaLabel: 'Use Illustrated Layout', field: 'layoutOption', value: 'illustrated' });

  // Keep at most one suggestion per field, then cap the list so it stays focused.
  const seen = new Set<keyof CustomizationData>();
  const out: Suggestion[] = [];
  for (const s of candidates) {
    if (seen.has(s.field)) continue;
    seen.add(s.field);
    out.push(s);
  }
  return out.slice(0, 3);
}

// Plain-language "What's this?" helper shown under each section. The copy is
// admin-editable (Site Content → Book Customizer → Explainers); this component
// just renders whatever the CMS provides for that section.
function SectionHelp({ info }: { info?: { subtitle: string; body: string } }) {
  if (!info || (!info.subtitle && !info.body)) return null;
  return (
    <div className="-mt-2 mb-4">
      <p className="text-sm text-gray-600 mb-1">{info.subtitle}</p>
      <details className="group">
        <summary className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <HelpCircle className="w-4 h-4" /> New to this? What’s this?
        </summary>
        <p className="mt-2 text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-xl p-3">
          {info.body}
        </p>
      </details>
    </div>
  );
}

export default function BookCustomizer() {
  const { user } = useAuth();
  const { customizer, pricing } = useContent();
  // All options/prices are CMS-managed; reuse the same names locally.
  const { paperTypes, coverDesigns, layoutOptions, bookSizes, colorOptions, bindingOptions } =
    customizer;
  // Pre-load from query params when an author re-opens a saved design.
  const [customization, setCustomization] = useState<CustomizationData>(() => {
    const p = new URLSearchParams(window.location.search);
    return {
      paperType: p.get('paper') || 'std70',
      interiorColor: p.get('color') || 'bw',
      binding: p.get('binding') || 'paperback',
      coverDesign: p.get('cover') || 'standard',
      layoutOption: p.get('layout') || 'single',
      bookSize: p.get('size') || 'demy',
    };
  });

  const [estimatedPrice, setEstimatedPrice] = useState(0);
  // The publishing plan the author is buying. Add-ons stack on top of this
  // plan's price, so a plan must be chosen before ordering. Pre-loaded from ?plan=.
  const [selectedPlanName, setSelectedPlanName] = useState<string>(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('plan') || '';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'quote' | 'order' | null>(null);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  // Answers to the "Tell us about your book" questionnaire, keyed by question
  // id. Choice/number answers can add to the estimate below (each option's
  // priceImpact, admin-editable); text answers are captured for the team
  // but never change the price.
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const questions = normalizeQuestions(customizer.questions);
  const questionnaireImpact = questionnairePriceImpact(questions, questionnaireAnswers);

  // Selected plan → its price. Custom (no digits in price) is quote-based, so it
  // has no fixed total here; ordering it routes to the quote flow instead.
  const planPriceToNumber = (p: string) => Number((p || '').replace(/[^0-9.]/g, '')) || 0;
  const selectedPlan = pricing.plans.find((p) => p.name === selectedPlanName) || null;
  const planIsQuote = !!selectedPlan && !/[0-9]/.test(selectedPlan.price);
  const planPrice = selectedPlan && !planIsQuote ? planPriceToNumber(selectedPlan.price) : 0;
  const grandTotal = planPrice + estimatedPrice;

  useEffect(() => {
    calculatePrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customization, questionnaireAnswers]);

  const calculatePrice = () => {
    const baseCost = customizer.baseCost; // CMS-managed base production cost

    const paperCost = paperTypes.find(p => p.id === customization.paperType)?.price || 0;
    const colorCost = colorOptions.find(c => c.id === customization.interiorColor)?.price || 0;
    const bindingCost = bindingOptions.find(b => b.id === customization.binding)?.price || 0;
    const coverCost = coverDesigns.find(c => c.id === customization.coverDesign)?.price || 0;
    const layoutCost = layoutOptions.find(l => l.id === customization.layoutOption)?.price || 0;
    const sizeCost = bookSizes.find(s => s.id === customization.bookSize)?.price || 0;
    const questionnaireCost = questionnairePriceImpact(questions, questionnaireAnswers);

    const totalCost =
      baseCost + paperCost + colorCost + bindingCost + coverCost + layoutCost + sizeCost + questionnaireCost;
    setEstimatedPrice(totalCost);
  };

  // Carry the current configuration + estimated price to the quote request page.
  const goToQuote = () => {
    const q = new URLSearchParams({
      ...(selectedPlanName ? { plan: selectedPlanName } : {}),
      paper: customization.paperType,
      color: customization.interiorColor,
      binding: customization.binding,
      cover: customization.coverDesign,
      layout: customization.layoutOption,
      size: customization.bookSize,
      price: String(estimatedPrice),
    }).toString();
    go(`/quote?${q}`);
  };

  const handleQuoteClick = () => {
    if (user) {
      goToQuote();
    } else {
      setPendingAction('quote');
      setAuthOpen(true);
    }
  };

  const handleOrderClick = () => {
    if (user) {
      doOrder();
    } else {
      setPendingAction('order');
      setAuthOpen(true);
    }
  };

  // Insert the current configuration and return its new id.
  const insertCustomization = async (): Promise<string | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id ?? null;
    const { data, error } = await supabase
      .from('book_customizations')
      .insert([
        {
          session_id: `session_${Date.now()}`,
          user_id: uid,
          paper_type: customization.paperType,
          interior_color: customization.interiorColor,
          binding: customization.binding,
          cover_design: customization.coverDesign,
          layout_option: customization.layoutOption,
          book_size: customization.bookSize,
          estimated_price: estimatedPrice,
          questionnaire_answers: questionnaireAnswers,
        },
      ])
      .select('id')
      .single();
    if (error) throw error;
    return data?.id ?? null;
  };

  const doOrder = async () => {
    if (!selectedPlanName) {
      setToast({ type: 'err', text: 'Please choose a plan first — add-ons are added on top of your plan.' });
      return;
    }
    // Custom (quote-based) plan → send the plan + add-ons config to the quote flow.
    if (planIsQuote) {
      goToQuote();
      return;
    }
    setIsSaving(true);
    try {
      const id = await insertCustomization();
      if (id) go(`/checkout?plan=${encodeURIComponent(selectedPlanName)}&customization=${id}`);
    } catch (err) {
      console.error('Error starting order:', err);
      setToast({ type: 'err', text: 'Could not start your order. Please try again.' });
      setIsSaving(false);
    }
  };

  const suggestions = getSuggestions(customization);

  return (
    <section id="customizer" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {customizer.heading}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{customizer.subheading}</p>

          <CustomizeQuestionnaire
            answers={questionnaireAnswers}
            onAnswer={(id, value) =>
              setQuestionnaireAnswers((prev) => ({ ...prev, [id]: value }))
            }
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Palette className="w-6 h-6 text-amber-600" />
                <h3 className="text-2xl font-bold text-gray-900">Paper Type</h3>
              </div>
              <SectionHelp info={customizer.explainers.paper} />
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
              <SectionHelp info={customizer.explainers.cover} />
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
              <SectionHelp info={customizer.explainers.layout} />
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
              <SectionHelp info={customizer.explainers.size} />
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
              <SectionHelp info={customizer.explainers.colour} />
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
              <SectionHelp info={customizer.explainers.binding} />
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
                <div className="mb-6 pb-6 border-b-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Choose your plan</h3>
                  <p className="text-sm text-gray-500 mb-3">Your add-ons are added on top of the plan price.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {pricing.plans.map((pl) => {
                      const sel = selectedPlanName === pl.name;
                      return (
                        <button
                          key={pl.name}
                          type="button"
                          onClick={() => setSelectedPlanName(pl.name)}
                          className={`text-left rounded-xl border-2 px-3 py-2 transition-all ${
                            sel ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:border-amber-300'
                          }`}
                        >
                          <span className="block text-sm font-bold text-gray-900">{pl.name}</span>
                          <span className="block text-xs font-semibold text-amber-600">{pl.price}</span>
                        </button>
                      );
                    })}
                  </div>
                  {!selectedPlanName && (
                    <p className="text-xs text-red-500 mt-2">Select a plan to see your total and order.</p>
                  )}
                </div>

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
                  <p className="text-gray-600 text-sm font-semibold mb-3">Price breakup</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">{selectedPlan ? `Plan: ${selectedPlan.name}` : 'Plan'}</span>
                      <span className="font-semibold text-gray-900">
                        {!selectedPlan ? 'Not selected' : planIsQuote ? 'Custom quote' : `₹${planPrice.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Add-ons</span>
                      <span className="font-semibold text-gray-900">
                        {estimatedPrice > 0 ? `+₹${estimatedPrice.toLocaleString()}` : 'Included'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-amber-200">
                    <span className="text-gray-800 font-semibold">Total</span>
                    <span className="text-3xl font-bold text-amber-600">
                      {!selectedPlan ? '—' : planIsQuote ? 'Custom quote' : `₹${grandTotal.toLocaleString()}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {planIsQuote
                      ? 'Custom plans are priced to scope — request a quote and we’ll include your add-ons.'
                      : 'Your plan price plus optional add-ons. Taxes are shown at checkout.'}
                  </p>
                  {questionnaireImpact > 0 && (
                    <p className="text-xs text-amber-700 mt-1">
                      Includes ₹{questionnaireImpact.toLocaleString()} in add-ons from your answers above (e.g. word count, images).
                    </p>
                  )}
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
                  <p className="text-sm text-blue-900 font-semibold">Good to know:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Choose a plan — your add-ons stack on top of it</li>
                    <li>✓ The standard choice in each section is included free</li>
                    <li>✓ Your full total shows here and again at checkout</li>
                  </ul>
                </div>

                <button
                  onClick={handleOrderClick}
                  disabled={isSaving || !selectedPlanName}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>
                    {isSaving
                      ? 'Please wait…'
                      : !selectedPlanName
                      ? 'Select a plan to continue'
                      : planIsQuote
                      ? 'Request a quote'
                      : 'Proceed to checkout'}
                  </span>
                </button>

                <button
                  onClick={handleQuoteClick}
                  className="w-full text-amber-700 hover:text-amber-900 py-2 text-sm font-semibold mt-2"
                >
                  Get a quote instead
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
          if (pendingAction === 'quote') goToQuote();
          else if (pendingAction === 'order') doOrder();
          setPendingAction(null);
        }}
        heading="Log in or sign up to continue"
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
