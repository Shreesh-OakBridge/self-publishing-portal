import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, BookOpen, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useContent } from '../content/ContentProvider';
import { go } from '../lib/basePath';
import AuthModal from './AuthModal';

interface RoyaltyData {
  bookPrice: number;
  expectedSales: number;
  planType: string;
}

// Fallback royalty rates if a CMS plan is missing its rate.
const FALLBACK_RATE: Record<string, number> = {
  Starter: 30,
  Professional: 45,
  Excellence: 55,
  Elite: 60,
};
const priceNum = (s: string) => Number((s || '').replace(/[^0-9.]/g, '')) || 0;

export default function RoyaltyCalculator() {
  const { user, loading } = useAuth();
  const { pricing, royaltyCalc } = useContent();

  const rateFor = (name: string) =>
    pricing.plans.find((p) => p.name === name)?.royaltyRate ?? FALLBACK_RATE[name] ?? 0;
  const costFor = (name: string) =>
    priceNum(pricing.plans.find((p) => p.name === name)?.price || '');
  // Royalty Calculator is for logged-in authors only.
  useEffect(() => {
    if (!loading && !user) {
      go('/login');
    }
  }, [loading, user]);
  // Pre-load from query params when an author re-opens a saved projection.
  const [royaltyData, setRoyaltyData] = useState<RoyaltyData>(() => {
    const p = new URLSearchParams(window.location.search);
    return {
      bookPrice: Number(p.get('price')) || 299,
      expectedSales: Number(p.get('sales')) || 100,
      planType: p.get('plan') || 'Professional',
    };
  });

  const [results, setResults] = useState({
    royaltyPerBook: 0,
    monthlyEarnings: 0,
    annualEarnings: 0,
    breakeven: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const calculateRoyalty = () => {
    const royaltyPercentage = rateFor(royaltyData.planType);
    const royaltyPerBook = (royaltyData.bookPrice * royaltyPercentage) / 100;
    const monthlyEarnings = royaltyPerBook * royaltyData.expectedSales;
    const annualEarnings = monthlyEarnings * 12;

    // Approximate breakeven: plan cost divided by monthly earnings.
    const planCost = costFor(royaltyData.planType);
    const monthsToBreakeven = monthlyEarnings > 0 ? Math.ceil(planCost / monthlyEarnings) : 0;

    setResults({
      royaltyPerBook: Math.round(royaltyPerBook),
      monthlyEarnings: Math.round(monthlyEarnings),
      annualEarnings: Math.round(annualEarnings),
      breakeven: monthsToBreakeven,
    });
  };

  // Compute once on load so preloaded/default values show results immediately.
  useEffect(() => {
    calculateRoyalty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Require login so saved projections are tied to an account we can follow up
  // with; otherwise nudge the visitor to log in / sign up first.
  const handleSaveClick = () => {
    if (!royaltyData.bookPrice || !royaltyData.expectedSales) {
      alert('Please fill in all fields');
      return;
    }
    if (user) {
      doSaveCalculation();
    } else {
      setAuthOpen(true);
    }
  };

  const doSaveCalculation = async () => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      const { error } = await supabase
        .from('royalty_calculations')
        .insert([
          {
            user_id: uid,
            book_price: royaltyData.bookPrice,
            expected_sales: royaltyData.expectedSales,
            plan_type: royaltyData.planType,
            estimated_royalty: results.royaltyPerBook,
            monthly_earnings: results.monthlyEarnings,
          },
        ]);

      if (error) throw error;

      alert('Calculation saved! This helps us understand your revenue projections.');
    } catch (err) {
      console.error('Error saving calculation:', err);
      alert('Error saving calculation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">Loading…</div>
    );
  }

  return (
    <section id="calculator" className="py-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {royaltyCalc.heading}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{royaltyCalc.subheading}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Calculate Your Earnings</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-3">
                  Publishing Plan
                </label>
                <select
                  value={royaltyData.planType}
                  onChange={(e) => setRoyaltyData({ ...royaltyData, planType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                >
                  {pricing.plans.map((plan) => (
                    <option key={plan.name} value={plan.name}>
                      {plan.name} - {rateFor(plan.name)}% royalty
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-600 mt-2">
                  Different plans offer different royalty percentages
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-3">
                  Your Book's Selling Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-semibold">₹</span>
                  <input
                    type="number"
                    value={royaltyData.bookPrice}
                    onChange={(e) =>
                      setRoyaltyData({ ...royaltyData, bookPrice: parseFloat(e.target.value) || 0 })
                    }
                    onBlur={calculateRoyalty}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    placeholder="299"
                    min="0"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  The retail price you set for your book on Amazon, Flipkart, etc.
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-3">
                  Expected Monthly Sales (Units)
                </label>
                <input
                  type="number"
                  value={royaltyData.expectedSales}
                  onChange={(e) =>
                    setRoyaltyData({ ...royaltyData, expectedSales: parseInt(e.target.value) || 0 })
                  }
                  onBlur={calculateRoyalty}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  placeholder="100"
                  min="0"
                />
                <p className="text-sm text-gray-600 mt-2">
                  How many copies you expect to sell each month
                </p>
              </div>

              <button
                onClick={calculateRoyalty}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              >
                Calculate Earnings
              </button>

              <button
                onClick={handleSaveClick}
                disabled={isSaving}
                className="w-full border-2 border-purple-600 text-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save This Projection'}
              </button>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <p className="text-sm text-purple-900">
                  <strong>How Royalties Work:</strong> Your royalty percentage is calculated on the
                  final retail price. Higher-tier plans offer better percentages because you're
                  investing more in quality production and marketing.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Your Earnings Projection</h3>

              <div className="space-y-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-white/80">Royalty Per Book</span>
                  </div>
                  <p className="text-4xl font-bold">
                    ₹{results.royaltyPerBook.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-white/80">Monthly Earnings</span>
                  </div>
                  <p className="text-4xl font-bold">
                    ₹{results.monthlyEarnings.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-white/80">Annual Earnings</span>
                  </div>
                  <p className="text-4xl font-bold">
                    ₹{results.annualEarnings.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-white/80">Months to Break Even</span>
                  </div>
                  <p className="text-4xl font-bold">
                    {results.breakeven === 0 ? '∞' : results.breakeven}
                    {results.breakeven > 0 && <span className="text-xl ml-2">months</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h4 className="font-bold text-gray-900 mb-3">Your Plan Tier</h4>
                <p className="text-3xl font-bold text-purple-600">{rateFor(royaltyData.planType)}%</p>
                <p className="text-sm text-gray-600 mt-2">Royalty Rate</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h4 className="font-bold text-gray-900 mb-3">Book Details</h4>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{royaltyData.bookPrice}
                </p>
                <p className="text-sm text-gray-600 mt-2">Selling Price</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
              <h4 className="font-bold text-gray-900 mb-3">Understanding Break-Even</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Break-even is when your cumulative royalties equal your plan investment. For
                example, with the Professional plan (₹79,999), if you earn ₹2,000/month, you'd
                break even in ~40 months. After that, all earnings are profit!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-8 border-2 border-amber-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Maximize Your Earnings</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-bold text-amber-700 mb-2">Set Competitive Pricing</h4>
              <p className="text-gray-700 text-sm">
                Research similar books in your genre. Price too high reduces sales; too low
                reduces profits. Find the sweet spot.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-amber-700 mb-2">Invest in Marketing</h4>
              <p className="text-gray-700 text-sm">
                Professional plans include marketing support. Use it to drive initial sales momentum
                and build an audience.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-amber-700 mb-2">Build Your Author Brand</h4>
              <p className="text-gray-700 text-sm">
                Elite plan includes author website and media outreach. Build your platform for
                long-term success.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => doSaveCalculation()}
        heading="Log in or sign up to save your projection"
      />
    </section>
  );
}
