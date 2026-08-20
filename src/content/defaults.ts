// Single source of truth for all editable site content.
// Supabase `site_content` stores only overrides (keyed by section); these
// defaults always render first, so the site works even before the CMS is used.

import { PRODUCTION_STAGES } from '../lib/productionStages';

export interface FeatureCard {
  title: string;
  description: string;
}

export interface HeroContent {
  badge: string;
  headlineLine1: string;
  headlineLine2: string;
  subheading: string;
  primaryCta: string;
  secondaryCta: string;
  imageUrl: string;
  imageAlt?: string;
  cards: FeatureCard[];
}

export interface BrandingContent {
  logoUrl: string;
  logoAlt?: string;
}

export interface ValuePropsContent {
  heading: string;
  subheading: string;
  whyHeading: string;
  whyParagraph1: string;
  whyParagraph2: string;
  changesHeading: string;
  changesPoints: string[];
  cards: FeatureCard[];
}

export interface VideoContent {
  heading: string;
  subheading: string;
  videoUrl: string;
  posterUrl: string;
  overlayTitle: string;
  overlaySubtitle: string;
  apartHeading: string;
  apartItems: FeatureCard[];
  processHeading: string;
  processSteps: FeatureCard[];
  partnershipTitle: string;
  partnershipText: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  tagline: string;
  popular: boolean;
  royaltyRate: number;
  features: string[];
}

export interface ImprintItem {
  name: string;
  desc: string;
}

export interface PricingContent {
  heading: string;
  subheading: string;
  plans: PricingPlan[];
  imprintsHeading: string;
  imprints: ImprintItem[];
}

export interface ContactContent {
  heading: string;
  subheading: string;
  successTitle: string;
  successMessage: string;
}

export interface ManuscriptSectionContent {
  heading: string;
  subheading: string;
  loggedOutTitle: string;
  loggedOutText: string;
  loggedOutCta: string;
}

export interface RoyaltyCalcContent {
  heading: string;
  subheading: string;
}

export interface EditorialContent {
  expertReviewPrice: number;
  expertReviewNote: string;
}

export interface ProductionStageItem {
  key: string;
  label: string;
}

export interface ProjectWorkspaceContent {
  // Show/hide the project progress card (title, current stage, stepper) on
  // the author-facing Project Workspace page (/project?id=...).
  stepperEnabled: boolean;
  // The pipeline stages shown in the stepper, in order. `key` should match
  // the value Admin → Orders sets on production_stage; `label` is what
  // authors see. Add / remove / rename freely — the Orders stage dropdown
  // reads from this same list, so both stay in sync automatically.
  stages: ProductionStageItem[];
}

export interface FooterSocial {
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  youtube: string;
}

export interface FooterContent {
  tagline: string;
  email: string;
  phone: string;
  location: string;
  copyrightName: string;
  // Social profile URLs — an icon shows only when its URL is filled in.
  social: FooterSocial;
  newsletterHeading: string;
  newsletterText: string;
}

export interface CustomizerOption {
  id: string;
  name: string;
  desc: string;
  price: number;
}

export interface CustomizerSizeDim {
  w: number;
  l: number;
  win: number;
  lin: number;
}

export interface CustomizerSize {
  id: string;
  name: string;
  desc: string;
  price: number;
  pb: CustomizerSizeDim;
  hb: CustomizerSizeDim;
}

// One selectable/typeable answer for a questionnaire question. For 'choice'
// questions this is a button option; for 'number' questions it's a pricing
// tier (the highest tier whose minValue <= the customer's number applies).
// priceImpact (₹) is added to the live estimate when this option/tier is hit.
export interface CustomizerQuestionOption {
  id: string;
  label: string;
  minValue?: number;
  priceImpact: number;
}

export interface CustomizerQuestion {
  id: string;
  text: string;
  // 'text' = free-typed answer, captured for the team but never affects price.
  // 'number' = numeric answer (e.g. word count), priced via option tiers.
  // 'choice' = pick one of the listed options, each with its own price impact.
  type: 'text' | 'number' | 'choice';
  placeholder?: string;
  options?: CustomizerQuestionOption[];
}

export interface CustomizerContent {
  heading: string;
  subheading: string;
  baseCost: number;
  paperTypes: CustomizerOption[];
  colorOptions: CustomizerOption[];
  bindingOptions: CustomizerOption[];
  coverDesigns: CustomizerOption[];
  layoutOptions: CustomizerOption[];
  bookSizes: CustomizerSize[];
  // Rotating question card shown between the subheading and "How it works?".
  // The customer actually answers these (text / number / multiple-choice);
  // answers are saved with the customization and choice/number answers can
  // add to the live price estimate via each option's priceImpact. Fully
  // admin-editable — add / remove / reword / reprice freely. Empty list or
  // the toggle off hides it entirely.
  questionnaireEnabled: boolean;
  questions: CustomizerQuestion[];
  // Plain-language "What's this?" helper shown under each customizer section
  // for first-time authors. Fully admin-editable, keyed by section.
  explainers: CustomizerExplainers;
}

export interface CustomizerExplainer {
  subtitle: string;
  body: string;
}

export interface CustomizerExplainers {
  paper: CustomizerExplainer;
  cover: CustomizerExplainer;
  layout: CustomizerExplainer;
  size: CustomizerExplainer;
  colour: CustomizerExplainer;
  binding: CustomizerExplainer;
}

export interface StaticPageContent {
  title: string;
  body: string;
  bannerUrl?: string;
  bannerAlt?: string;
}

export interface PagesContent {
  about: StaticPageContent;
  terms: StaticPageContent;
  privacy: StaticPageContent;
  publishingAgreement: StaticPageContent;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqContent {
  title: string;
  subtitle: string;
  items: FaqItem[];
}

// Intent-based "Journey" (e.g. Novel, Memoir, Children's Book). A single
// reusable template renders any journey from this content, keyed by `slug`
// (URL: /journey/<slug>). Add/edit journeys here or in the admin Content editor.
export interface JourneyItem {
  slug: string;
  icon: string;
  title: string;
  tagline: string;
  heroUrl: string;
  heroAlt?: string;
  intro: string;
  examples: string[];
  formats: string[];
  timeline: string;
  pricingNote: string;
  faqs: FaqItem[];
  ctaLabel: string;
}

export interface JourneysContent {
  heading: string;
  subheading: string;
  items: JourneyItem[];
}

export interface ResourceLink {
  label: string;
  url: string;
  description: string;
}

export interface AuthorHubContent {
  heading: string;
  subheading: string;
  referralReward: string;
  community: ResourceLink[];
}

export interface ServiceItem {
  title: string;
  summary: string;
  description: string;
  icon: string;
  // Sub-items shown in a second flyout when this service is hovered in the
  // header nav (e.g. "Editorial & Proofreading" → "Copyediting",
  // "Proofreading"...). Leave empty for a service with no submenu. `url`
  // defaults to the main Services page if left blank. Optional so content
  // saved before this field existed doesn't break — treat a missing value
  // the same as an empty list.
  children?: ResourceLink[];
}

export interface ServicesContent {
  heading: string;
  subheading: string;
  // Master switch for the header nav's second-level (child) flyout. When
  // off, the Services menu only ever shows its single top-level flyout,
  // even if individual services have children configured.
  submenuEnabled: boolean;
  items: ServiceItem[];
}

export interface ConfidenceItem {
  label: string;
  sublabel: string;
}

export interface ConfidenceBarContent {
  enabled: boolean;
  speed: number;
  items: ConfidenceItem[];
}

export interface PortfolioItem {
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  coverAlt?: string;
  linkUrl: string;
}

export interface PortfolioContent {
  heading: string;
  subheading: string;
  autoRotate: boolean;
  rotateSeconds: number;
  items: PortfolioItem[];
}

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

export interface TestimonialsContent {
  heading: string;
  subheading: string;
  autoRotate: boolean;
  rotateSeconds: number;
  items: TestimonialItem[];
}

export interface GetStartedContent {
  heading: string;
  subheading: string;
  languageHeading: string;
  languages: string[];
  statusHeading: string;
  statuses: string[];
  ctaLabel: string;
}

export interface WelcomeContent {
  enabled: boolean;
  eyebrow: string;
  headlineLine1: string;
  headlineLine2: string;
  subheading: string;
  ctaLabel: string;
  skipLabel: string;
  // Sonic branding: a short brand sound played (on the CTA click gesture) as the
  // visitor enters the homepage.
  soundEnabled: boolean;
  soundUrl: string;
  soundVolume: number;
}

export interface HomeLayoutSection {
  key: string;
  enabled: boolean;
}

export interface HomeLayoutContent {
  // Section order/visibility for logged-out visitors.
  sections: HomeLayoutSection[];
  // Section order/visibility for logged-in members. Falls back to `sections`
  // if not configured.
  loggedInSections: HomeLayoutSection[];
}

// Reorderable homepage sections (header/footer are fixed and not listed).
// Shared by the renderer (App) and the admin Layout editor.
export const HOME_SECTIONS: { key: string; label: string }[] = [
  { key: 'hero', label: 'Hero / Welcome' },
  { key: 'confidenceBar', label: 'Confidence Bar' },
  { key: 'about', label: 'Value Proposition' },
  { key: 'process', label: 'Process & Video' },
  { key: 'submit', label: 'Manuscript Upload' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'plans', label: 'Pricing Plans' },
  { key: 'estimate', label: 'Instant Estimate Band' },
  { key: 'blog', label: 'Blog (latest posts)' },
  { key: 'contact', label: 'Contact Form' },
];

export interface BlogContent {
  heading: string;
  subheading: string;
}

// Admin-managed navigation. A link's `url` may be an in-app route ("/plans"),
// a homepage section anchor ("#testimonials"), or an external URL ("https://…").
export interface NavLink {
  label: string;
  url: string;
  enabled: boolean;
}
export interface FooterColumn {
  heading: string;
  enabled: boolean;
  links: NavLink[];
}
export interface NavigationContent {
  header: NavLink[];
  footerColumns: FooterColumn[];
  legalLinks: NavLink[];
  showContact: boolean;
  showSocial: boolean;
  showNewsletter: boolean;
}

export interface SiteContent {
  branding: BrandingContent;
  welcome: WelcomeContent;
  getStarted: GetStartedContent;
  hero: HeroContent;
  valueProps: ValuePropsContent;
  video: VideoContent;
  homeLayout: HomeLayoutContent;
  confidenceBar: ConfidenceBarContent;
  services: ServicesContent;
  journeys: JourneysContent;
  authorHub: AuthorHubContent;
  blog: BlogContent;
  navigation: NavigationContent;
  portfolio: PortfolioContent;
  testimonials: TestimonialsContent;
  pricing: PricingContent;
  customizer: CustomizerContent;
  manuscript: ManuscriptSectionContent;
  royaltyCalc: RoyaltyCalcContent;
  editorial: EditorialContent;
  projectWorkspace: ProjectWorkspaceContent;
  contact: ContactContent;
  faq: FaqContent;
  pages: PagesContent;
  footer: FooterContent;
}

export const defaultContent: SiteContent = {
  branding: {
    logoUrl: '',
  },
  getStarted: {
    heading: 'Start your publishing journey',
    subheading: 'Tell us a little about your book and how you’d like to publish.',
    languageHeading: 'Which language is your book written in?',
    languages: [
      'English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Bengali', 'Marathi', 'Kannada', 'Gujarati',
    ],
    statusHeading: 'What is the status of your manuscript?',
    statuses: [
      'I have a book idea',
      'I am still writing',
      'Finished writing, adding final touches',
      'Finished writing, ready to publish',
    ],
    ctaLabel: 'Continue',
  },
  welcome: {
    enabled: true,
    eyebrow: 'Cursive',
    headlineLine1: 'Your story deserves',
    headlineLine2: 'to be told.',
    subheading:
      'From manuscript to masterpiece — begin a publishing journey crafted around your vision, with the people who’ve guided hundreds of authors before you.',
    ctaLabel: 'Begin Your Publishing Journey',
    skipLabel: 'Skip intro',
    soundEnabled: false,
    soundUrl: '',
    soundVolume: 0.4,
  },
  hero: {
    badge: 'Premium Self-Publishing Excellence',
    headlineLine1: 'Your Story,',
    headlineLine2: 'Beautifully Published',
    subheading:
      "Cursive Publishing brings your literary dreams to life with 30+ years of industry expertise. We're not just a publishing service—we're your partner in creating lasting impact.",
    primaryCta: 'Get Started',
    secondaryCta: 'View Plans',
    imageUrl: '',
    cards: [
      {
        title: '30+ Years Experience',
        description:
          'Our veteran founders bring decades of publishing wisdom to every project, ensuring your book meets industry standards.',
      },
      {
        title: 'Full-Service Publishing',
        description:
          'From manuscript to marketplace, we handle every detail with professionalism and care that sets us apart.',
      },
      {
        title: 'Your Rights, Your Control',
        description:
          'Maintain complete ownership while benefiting from our expertise and industry connections.',
      },
    ],
  },
  valueProps: {
    heading: 'The Transformative Power of Writing',
    subheading:
      "A book is more than words on pages—it's a legacy, a conversation starter, and a bridge between minds across time and space.",
    whyHeading: 'Why Your Book Matters',
    whyParagraph1:
      'In a world of fleeting digital content, books remain timeless vessels of knowledge, emotion, and human experience. Your book has the power to inspire change, preserve wisdom, and touch lives in ways you may never fully realize.',
    whyParagraph2:
      "Whether you're sharing your expertise, telling your story, or creating worlds of imagination, publishing a book establishes you as an authority, opens doors to new opportunities, and creates a lasting impact that transcends generations.",
    changesHeading: 'Writing a Book Changes Everything',
    changesPoints: [
      'Establishes credibility and positions you as a thought leader in your field',
      'Opens doors to speaking engagements, media opportunities, and partnerships',
      'Creates passive income streams and builds your personal brand',
      'Preserves your legacy and shares your unique perspective with the world',
    ],
    cards: [
      { title: 'Share Your Passion', description: 'Connect with readers who resonate with your message and vision' },
      { title: 'Spark Change', description: 'Influence thinking, inspire action, and contribute to important conversations' },
      { title: 'Build Community', description: 'Create a loyal following and meaningful connections around your ideas' },
      { title: 'Grow Your Impact', description: 'Expand your reach and multiply your influence exponentially' },
    ],
  },
  video: {
    heading: 'Our Publishing Process',
    subheading:
      'Watch how Cursive Publishing transforms your manuscript into a professional, market-ready book with our proven process.',
    videoUrl: '',
    posterUrl: '',
    overlayTitle: 'From Manuscript to Masterpiece: The Cursive Way',
    overlaySubtitle: 'See how our 30+ years of experience makes the difference',
    apartHeading: 'What Sets Cursive Apart',
    apartItems: [
      { title: 'Veteran Leadership', description: "Founded by industry veterans with over 30 years of combined publishing experience, we've guided hundreds of authors to success." },
      { title: 'Personalized Attention', description: 'Unlike cookie-cutter publishing mills, we treat each manuscript as a unique project deserving individual care and expertise.' },
      { title: 'Industry Connections', description: "Leverage our extensive network of distributors, retailers, and media contacts to maximize your book's reach and impact." },
      { title: 'Quality Obsession', description: 'We maintain the highest standards in editing, design, and production—your book will rival traditionally published titles.' },
      { title: 'Transparent Process', description: "No hidden fees, no surprises. You'll know exactly what to expect at every stage of your publishing journey." },
      { title: 'Author-First Philosophy', description: "You retain all rights and creative control. We're here to serve your vision, not dictate it." },
    ],
    processHeading: 'Our Streamlined Process',
    processSteps: [
      { title: 'Consultation & Planning', description: 'We review your manuscript and goals, then create a customized publishing roadmap.' },
      { title: 'Professional Editing', description: 'Our experienced editors polish your manuscript to professional standards.' },
      { title: 'Design & Formatting', description: 'Custom cover design and interior layout that makes your book stand out.' },
      { title: 'Publication & Distribution', description: 'We handle ISBN, copyright, and distribution to major retailers worldwide.' },
      { title: 'Marketing Support', description: 'Launch strategies, promotional materials, and ongoing marketing guidance.' },
    ],
    partnershipTitle: 'Ongoing Partnership',
    partnershipText:
      "We don't abandon you after publication. You'll have continued access to our expertise and support as your book grows its audience.",
  },
  testimonials: {
    heading: 'Loved by authors',
    subheading: 'Writers across the country trust Cursive to bring their stories to readers.',
    autoRotate: true,
    rotateSeconds: 4,
    items: [
      {
        quote:
          'Cursive made publishing my first novel effortless. From editing to the cover design, every step felt guided and professional. My book was on shelves in weeks.',
        name: 'Ananya Sharma',
        role: 'Author, “Threads of Dawn”',
        rating: 5,
      },
      {
        quote:
          'The royalty terms were the most transparent I found anywhere in India. I always know exactly what I earn per copy, and payouts are right on time.',
        name: 'Rajat Mehta',
        role: 'Author, “The Quiet Quarter”',
        rating: 5,
      },
      {
        quote:
          'I came in with just a manuscript and a lot of doubts. Their team handled the production beautifully and kept me involved through every decision.',
        name: 'Fatima Qureshi',
        role: 'Poet & Author',
        rating: 5,
      },
    ],
  },
  pricing: {
    heading: 'Publishing Plans for Every Author',
    subheading:
      'Choose the perfect package for your publishing journey. All plans include professional quality and industry-standard services.',
    plans: [
      {
        name: 'Starter',
        price: '₹24,999',
        tagline: 'Everything a first-time author needs to publish',
        popular: false,
        royaltyRate: 30,
        features: [
          'Professional copyediting (up to 50,000 words)',
          'Basic proofreading',
          'Pre-designed cover template customization',
          'Standard interior formatting (black & white)',
          'ISBN assignment',
          'Copyright registration assistance',
          'Distribution to Amazon & major online retailers',
          'Author copies (5 paperback copies)',
          'Basic book description optimization',
          'Email support',
          'Cursive Classics imprint',
        ],
      },
      {
        name: 'Essential',
        price: '₹49,999',
        tagline: 'For authors ready to build a brand',
        popular: true,
        royaltyRate: 45,
        features: [
          'Comprehensive developmental editing',
          'Professional copyediting (up to 100,000 words)',
          'Multiple rounds of proofreading',
          'Custom cover design (3 concepts)',
          'Premium interior formatting (colour available)',
          'ISBN & Barcode',
          'Copyright registration (full service)',
          'Wide distribution (Amazon, Flipkart, libraries)',
          'Author copies (15 copies in mixed formats)',
          'Professional book description & metadata',
          'Press release (2 versions)',
          'Marketing toolkit (social media graphics, bookmarks)',
          'Author website (single page)',
          'Launch strategy consultation',
          'Cursive Imprint Series imprint',
          'Priority support (phone & email)',
        ],
      },
      {
        name: 'Professional',
        price: '₹89,999',
        tagline: 'Premium publishing with full marketing support',
        popular: false,
        royaltyRate: 55,
        features: [
          'Comprehensive developmental editing',
          'Professional copyediting (unlimited words)',
          'Multiple rounds of proofreading & fact-checking',
          'Premium custom cover design (5 concepts)',
          'Luxury interior formatting with custom elements',
          'Multiple ISBNs (hardcover, paperback, ebook)',
          'Copyright & trademark registration',
          'Global + Indian distribution (40+ platforms)',
          'Author copies (30 copies in all formats)',
          'Professional book description & metadata optimization',
          'Comprehensive press kit (3 press releases)',
          'Full marketing suite (social media, email templates)',
          'Professional author website (5 pages)',
          'Video book trailer (60-90 seconds)',
          'Professional author photography session',
          'Launch campaign management (3 months)',
          'Amazon & Flipkart Ads setup',
          'Cursive Prestige imprint',
          'Dedicated account manager',
          'Priority support (24/7 access)',
        ],
      },
      {
        name: 'Custom',
        price: 'Custom',
        tagline: "Tailored to your book — let's build your package",
        popular: false,
        royaltyRate: 60,
        features: [
          'Everything in Professional, tailored to your goals',
          'Full developmental & structural editing',
          'Unlimited cover concepts by senior designers',
          'Premium interior design by award-winning designers',
          'Multiple ISBNs (all formats)',
          'Full copyright & trademark protection',
          'Bespoke marketing & ad-campaign planning',
          'Custom author website & brand assets',
          'Dedicated account manager',
          'Priced to scope — request a tailored quote',
        ],
      },
    ],
    imprintsHeading: 'About Our Imprints',
    imprints: [
      {
        name: 'Cursive Classics (Starter Plan)',
        desc: 'Our foundational imprint for emerging authors. Perfect for traditional fiction, memoirs, and first-time publications that will be printed with our classic, timeless aesthetic.',
      },
      {
        name: 'Cursive Imprint Series (Essential Plan)',
        desc: 'For authors building their brand and creating professional, market-competitive titles across all genres. This imprint signifies quality and editorial excellence.',
      },
      {
        name: 'Cursive Prestige (Professional Plan)',
        desc: 'Reserved for authors published at the highest standards. Your imprint will feature on premium-quality books with exclusive design elements and premium distribution.',
      },
      {
        name: 'Cursive Signature (Custom Plan)',
        desc: "Our most exclusive imprint featuring the author's biography and signature edition mark. Only for authors receiving our fully bespoke, white-glove publishing service.",
      },
    ],
  },
  customizer: {
    heading: 'Design Your Book',
    subheading:
      "Customize every aspect of your book production and get real-time price estimates. See exactly what you're getting before you commit.",
    // Add-on model: the base production cost sits inside your chosen plan, so
    // the customizer only prices the *upgrades* you add on top. The standard
    // choice in each section is included (+₹0); only premium choices add cost.
    baseCost: 0,
    paperTypes: [
      { id: 'std70', name: '70 GSM Natural Shade', desc: 'Standard novel paper. Light cream shade that is easy on the eyes for long reading — the everyday choice for fiction & non-fiction.', price: 0 },
      { id: 'white80', name: '80 GSM White', desc: 'Bright white and a touch thicker. A crisp, clean look for textbooks, workbooks and business books.', price: 200 },
      { id: 'cream90', name: '90 GSM Premium Cream', desc: 'Heavier, more luxurious cream stock with a refined feel. Popular for premium hardbacks and gift editions.', price: 600 },
      { id: 'art130', name: '130 GSM Art Paper', desc: 'Smooth, coated paper made for sharp photos and full-colour pages. Best for photo, art and children’s books.', price: 1200 },
    ],
    colorOptions: [
      { id: 'bw', name: 'Black & White', desc: 'Single-colour interior printing — the standard, most affordable choice for text-only books.', price: 0 },
      { id: 'color', name: 'Full Colour', desc: 'Every page printed in full colour. Needed for photos, illustrations and colour charts.', price: 2500 },
    ],
    bindingOptions: [
      { id: 'paperback', name: 'Paperback (Softback)', desc: 'A flexible card cover — lighter, cheaper and the most common choice. “Softback” and “paperback” mean the same thing.', price: 0 },
      { id: 'hardback', name: 'Hardback (Hardcover)', desc: 'A stiff board cover — more durable and premium, and it stays looking good for years. Ideal for gifts and keepsakes.', price: 1500 },
    ],
    coverDesigns: [
      { id: 'standard', name: 'Standard Cover', desc: 'A clean, professionally laid-out cover. Included at no extra cost.', price: 0 },
      { id: 'matte', name: 'Matte Lamination', desc: 'A soft, non-glare finish that feels premium and resists fingerprints.', price: 500 },
      { id: 'gloss', name: 'Gloss Lamination', desc: 'A shiny finish that makes cover colours pop — great for commercial fiction.', price: 500 },
      { id: 'embossed', name: 'Embossed / Spot UV', desc: 'Raised or spot-gloss title and elements you can actually feel — a premium bookstore look.', price: 2000 },
      { id: 'foil', name: 'Foil Stamping', desc: 'Metallic gold or silver accents stamped onto the cover for a luxury, gift-worthy finish.', price: 3500 },
    ],
    layoutOptions: [
      { id: 'single', name: 'Single Column', desc: 'The classic book layout — one clean column of text. Right for almost all novels and non-fiction.', price: 0 },
      { id: 'double', name: 'Two Column', desc: 'Two columns of text per page — compact and modern. Common in academic and reference books.', price: 1000 },
      { id: 'illustrated', name: 'Illustrated Layout', desc: 'Text designed around images, art and captions. Built for photo, art and children’s books.', price: 3000 },
      { id: 'custom', name: 'Custom Design', desc: 'A unique interior designed from scratch for your book by our team.', price: 5000 },
    ],
    bookSizes: [
      { id: 'demy', name: 'Demy', desc: 'Classic novel / fiction size', price: 0,
        pb: { w: 140, l: 215, win: 5.5, lin: 8.5 }, hb: { w: 145, l: 222, win: 5.7, lin: 8.75 } },
      { id: 'crown1', name: 'Crown1', desc: 'Compact non-fiction', price: 0,
        pb: { w: 170, l: 240, win: 6.75, lin: 9.5 }, hb: { w: 174, l: 240, win: 6.85, lin: 9.5 } },
      { id: 'royal', name: 'Royal', desc: 'Popular all-rounder', price: 0,
        pb: { w: 160, l: 240, win: 6.25, lin: 9.5 }, hb: { w: 163, l: 248, win: 6.4, lin: 9.75 } },
      { id: 'crown', name: 'Crown', desc: 'Wider trim, textbooks', price: 0,
        pb: { w: 185, l: 235, win: 7.25, lin: 9.25 }, hb: { w: 188, l: 248, win: 7.4, lin: 9.75 } },
      { id: 'doubledemy', name: 'Double Demy', desc: 'Coffee-table / photo books', price: 0,
        pb: { w: 215, l: 280, win: 8.5, lin: 11 }, hb: { w: 220, l: 285, win: 8.7, lin: 11.25 } },
    ],
    questionnaireEnabled: true,
    questions: [
      { id: 'genre', text: 'What genre best describes your book?', type: 'text', placeholder: 'e.g. Literary fiction, memoir, self-help…' },
      { id: 'reader', text: 'Who do you picture as your ideal reader?', type: 'text', placeholder: 'e.g. Young professionals, new parents…' },
      {
        id: 'wordCount',
        text: "What's your manuscript's approximate word count?",
        type: 'number',
        placeholder: 'e.g. 65000',
        options: [
          { id: 'under40k', label: 'Under 40,000 words', minValue: 0, priceImpact: 0 },
          { id: '40to80k', label: '40,000–80,000 words', minValue: 40000, priceImpact: 0 },
          { id: '80to120k', label: '80,000–120,000 words', minValue: 80000, priceImpact: 300 },
          { id: 'over120k', label: 'Over 120,000 words', minValue: 120000, priceImpact: 600 },
        ],
      },
      {
        id: 'images',
        text: 'Will your book include photos, illustrations, or charts?',
        type: 'choice',
        options: [
          { id: 'none', label: 'No images', priceImpact: 0 },
          { id: 'few', label: 'A few (under 10)', priceImpact: 200 },
          { id: 'many', label: 'Many (10+) / heavy illustration', priceImpact: 800 },
        ],
      },
      {
        id: 'printRun',
        text: 'Is this a one-time print run, or do you plan to reprint as it sells?',
        type: 'choice',
        options: [
          { id: 'onetime', label: 'One-time print run', priceImpact: 0 },
          { id: 'reprint', label: 'Plan to reprint as it sells', priceImpact: 0 },
        ],
      },
      {
        id: 'timeline',
        text: "What's your target launch timeline?",
        type: 'choice',
        options: [
          { id: 'standard', label: 'Standard (8–10 weeks)', priceImpact: 0 },
          { id: 'rush', label: 'Rush — I need it sooner', priceImpact: 1000 },
        ],
      },
      {
        id: 'channel',
        text: 'Will you sell mainly in print, eBook, or both?',
        type: 'choice',
        options: [
          { id: 'print', label: 'Mainly print', priceImpact: 0 },
          { id: 'ebook', label: 'Mainly eBook', priceImpact: 0 },
          { id: 'both', label: 'Both print and eBook', priceImpact: 500 },
        ],
      },
    ],
    explainers: {
      paper: {
        subtitle: 'GSM is simply how thick and heavy the paper is.',
        body: 'GSM (grams per square metre) tells you how thick the paper is. 70–80 GSM is normal for novels — light and easy to hold. 90 GSM feels more premium. 130 GSM art paper is thick and coated, which keeps photos and colours crisp. When in doubt, 70 GSM Natural is the safe, classic choice.',
      },
      cover: {
        subtitle: 'The look and finish of the outside of your book.',
        body: "The cover is what a reader sees first. 'Standard' is a clean, professional cover at no extra cost. Lamination (matte or gloss) protects it and changes how it feels. Embossing and foil add premium, touchable details — lovely for gifts, but not needed for a simple novel.",
      },
      layout: {
        subtitle: 'How the words and pictures sit on each page.',
        body: 'Layout is how your pages are arranged inside. Almost every novel and non-fiction book uses a single column. Two columns suit reference or academic books. Illustrated layouts are for books where pictures matter as much as the words.',
      },
      size: {
        subtitle: "The width and height of your finished book (its 'trim size').",
        body: 'Trim size is how big the finished book is. Demy is the classic novel size and a safe default. Larger sizes like Double Demy suit photo and coffee-table books. Not sure? Demy or Royal works for most fiction and non-fiction.',
      },
      colour: {
        subtitle: 'Black & white pages, or full colour throughout.',
        body: "This is the colour of the pages inside — not the cover. Black & white is standard and much cheaper, and it's all a text-only book needs. Choose full colour only if your inside pages have photos, illustrations or colour charts.",
      },
      binding: {
        subtitle: 'Soft cover (paperback) or hard cover (hardback).',
        body: 'Binding is how the book is held together. Paperback — also called softback — has a flexible card cover, so it is lighter and more affordable. Hardback (hardcover) has a stiff board cover: more durable and premium, and it lasts for years. Most first books start as paperback.',
      },
    },
  },
  manuscript: {
    heading: 'Submit Your Manuscript',
    subheading:
      'Upload your manuscript to begin your publishing journey. Your file stays private — visible only to you and our editorial team.',
    loggedOutTitle: 'Ready to publish your book?',
    loggedOutText: 'Log in or create a free account to upload your manuscript and track its progress.',
    loggedOutCta: 'Log in / Sign up to upload',
  },
  royaltyCalc: {
    heading: 'Estimate Your Royalties',
    subheading:
      'See how much you could earn. Adjust your book price and expected monthly sales to project your royalty income across our plans.',
  },
  editorial: {
    expertReviewPrice: 4999,
    expertReviewNote:
      'Expert Editorial Review is a paid add-on. Once you request it, our team will confirm the scope and payment details before work begins.',
  },
  projectWorkspace: {
    stepperEnabled: true,
    stages: PRODUCTION_STAGES.map((s) => ({ key: s.key, label: s.label })),
  },
  contact: {
    heading: 'Start Your Publishing Journey',
    subheading:
      'Fill out the form below and one of our publishing experts will contact you within 24 hours to discuss your project and answer any questions.',
    successTitle: 'Thank You!',
    successMessage:
      "We've received your information and are excited to learn more about your project. A member of our team will reach out to you within 24 hours to discuss your publishing journey.",
  },
  homeLayout: {
    sections: HOME_SECTIONS.map((s) => ({ key: s.key, enabled: true })),
    loggedInSections: HOME_SECTIONS.map((s) => ({ key: s.key, enabled: true })),
  },
  confidenceBar: {
    enabled: true,
    speed: 30,
    items: [
      { label: '30+ Years', sublabel: 'Publishing Experience' },
      { label: '500+ Titles', sublabel: 'Successfully Published' },
      { label: '4.8 / 5', sublabel: 'Average Author Rating' },
      { label: '40+ Platforms', sublabel: 'Global Distribution' },
      { label: '100%', sublabel: 'Rights Retained by Authors' },
      { label: 'On-Time', sublabel: 'Transparent Royalty Payouts' },
    ],
  },
  services: {
    heading: 'Our Publishing Services',
    subheading:
      'End-to-end support to take your manuscript from a draft to a professionally published book.',
    submenuEnabled: true,
    items: [
      {
        title: 'Editorial & Proofreading',
        summary: 'Developmental, copy, and line editing.',
        description:
          'Our experienced editors refine structure, language, and consistency—from developmental editing that shapes your narrative to meticulous proofreading that polishes every line.',
        icon: 'PenTool',
        children: [
          { label: 'Developmental Editing', url: '', description: 'Big-picture structure, pacing, and narrative guidance.' },
          { label: 'Copyediting', url: '', description: 'Grammar, consistency, and clarity at the sentence level.' },
          { label: 'Proofreading', url: '', description: 'A final polish pass before your book goes to print.' },
        ],
      },
      {
        title: 'Cover Design',
        summary: 'Custom, market-ready covers.',
        description:
          'Original cover concepts designed to stand out on shelves and thumbnails alike, tailored to your genre and audience.',
        icon: 'Palette',
        children: [
          { label: 'Custom Cover Concepts', url: '', description: 'Original designs tailored to your genre and audience.' },
          { label: 'Cover Revisions', url: '', description: 'Refine an existing concept until it feels right.' },
        ],
      },
      {
        title: 'Interior Formatting',
        summary: 'Print & ebook typesetting.',
        description:
          'Professional interior layout and typesetting for paperback, hardback, and ebook formats, with attention to readability and trim size.',
        icon: 'LayoutGrid',
        children: [
          { label: 'Print Typesetting', url: '', description: 'Paperback & hardback interior layout for your chosen trim size.' },
          { label: 'eBook Conversion', url: '', description: 'Clean, reflowable formatting for Kindle and other eReaders.' },
        ],
      },
      {
        title: 'ISBN & Copyright',
        summary: 'Registration handled for you.',
        description:
          'We assign ISBNs and assist with copyright registration so your work is protected and discoverable.',
        icon: 'ShieldCheck',
        children: [
          { label: 'ISBN Registration', url: '', description: 'A unique ISBN assigned and registered for your book.' },
          { label: 'Copyright Assistance', url: '', description: 'Guidance through registering copyright in your name.' },
        ],
      },
      {
        title: 'Distribution',
        summary: 'Reach Amazon, Flipkart & more.',
        description:
          'Global and Indian distribution across major online retailers, libraries, and 40+ platforms to maximise your reach.',
        icon: 'Globe',
        children: [
          { label: 'Online Retailers', url: '', description: 'Amazon, Flipkart, and other major online storefronts.' },
          { label: 'Library & Bulk Distribution', url: '', description: 'Reach libraries and institutional buyers.' },
        ],
      },
      {
        title: 'Marketing Support',
        summary: 'Launch & promote with confidence.',
        description:
          'Launch strategy, press materials, and promotional assets to help your book find its readers.',
        icon: 'Megaphone',
        children: [
          { label: 'Launch Strategy', url: '', description: 'A plan for your first weeks after publication.' },
          { label: 'Press & Media Kit', url: '', description: 'Press releases and promotional assets ready to share.' },
        ],
      },
    ],
  },
  journeys: {
    heading: 'Choose Your Journey',
    subheading: 'Every book is different. Tell us what you’re creating and we’ll shape the path around it.',
    items: [
      {
        slug: 'novel',
        icon: 'BookOpen',
        title: 'I Wrote a Novel',
        tagline: 'Turn your manuscript into a beautifully published book readers will love.',
        heroUrl: '',
        heroAlt: '',
        intro:
          'You’ve written your story — now let’s give it the cover, typesetting and finish it deserves. From a single polished manuscript to print-ready files and distribution, we guide fiction authors through every step.',
        examples: ['Literary & commercial fiction', 'Thrillers & mystery', 'Romance', 'Short-story collections'],
        formats: ['Paperback & hardcover', 'Standard novel trim sizes', 'Matte or gloss covers', 'eBook & print'],
        timeline: 'Typically 6–10 weeks',
        pricingNote: 'Plans from ₹ — final estimate after the planner.',
        faqs: [
          { question: 'Do you edit the manuscript?', answer: 'Yes — copy-editing and proofreading are available as part of your plan.' },
          { question: 'Will my book be on Amazon?', answer: 'Yes, distribution and listing support is included in our expert path.' },
        ],
        ctaLabel: 'Start my novel',
      },
      {
        slug: 'family-history',
        icon: 'Heart',
        title: 'Preserve Family Memories',
        tagline: 'Transform letters, photos and stories into a keepsake your family will treasure.',
        heroUrl: '',
        heroAlt: '',
        intro:
          'Some books aren’t for the world — they’re for the people you love. We help you turn memories, photographs and voices into a beautifully bound family heirloom.',
        examples: ['Memoirs & life stories', 'Family histories', 'Tribute & anniversary books', 'Letters & journals'],
        formats: ['Premium hardcover', 'Photo-friendly paper', 'Private print runs', 'Reprints on demand'],
        timeline: 'Typically 4–8 weeks',
        pricingNote: 'Private printing from ₹ — final estimate after the planner.',
        faqs: [
          { question: 'Can you work from handwritten notes?', answer: 'Absolutely — we can transcribe and organise your material for you.' },
          { question: 'Can I order just a few copies?', answer: 'Yes, private runs can be as small as you like.' },
        ],
        ctaLabel: 'Preserve our story',
      },
      {
        slug: 'childrens-book',
        icon: 'Sparkles',
        title: 'Children’s Story Book',
        tagline: 'Bring your characters to life with illustration, colour and playful design.',
        heroUrl: '',
        heroAlt: '',
        intro:
          'A children’s book is as much about pictures as words. We pair you with illustration and layout that make little readers (and their parents) smile.',
        examples: ['Picture books', 'Early readers', 'Rhyming stories', 'Activity books'],
        formats: ['Full-colour interior', 'Hardcover & paperback', 'Durable child-safe finishes', 'Large illustrated trims'],
        timeline: 'Typically 8–12 weeks',
        pricingNote: 'Illustrated packages from ₹ — final estimate after the planner.',
        faqs: [
          { question: 'Do you provide illustrators?', answer: 'Yes — we can match you with an illustrator suited to your style.' },
          { question: 'Can it be full colour?', answer: 'Yes, full-colour interiors are standard for children’s books.' },
        ],
        ctaLabel: 'Start my children’s book',
      },
      {
        slug: 'non-fiction',
        icon: 'Library',
        title: 'Non-Fiction & Academic',
        tagline: 'Professional formatting for guides, research and reference works.',
        heroUrl: '',
        heroAlt: '',
        intro:
          'Non-fiction lives or dies on clarity. We handle structured layouts, references, tables and indexes so your expertise reads as authoritative as it is.',
        examples: ['How-to & self-help', 'Business & professional', 'Academic & research', 'Reference & manuals'],
        formats: ['Clean typeset interiors', 'Tables, figures & indexes', 'Paperback & hardcover', 'eBook & print'],
        timeline: 'Typically 6–10 weeks',
        pricingNote: 'Plans from ₹ — final estimate after the planner.',
        faqs: [
          { question: 'Can you handle citations and an index?', answer: 'Yes, structured references and indexing are supported.' },
          { question: 'Do you assign ISBNs?', answer: 'Yes, ISBN assignment is part of the publishing process.' },
        ],
        ctaLabel: 'Start my book',
      },
      {
        slug: 'coffee-table-book',
        icon: 'Camera',
        title: 'Coffee-Table & Art Book',
        tagline: 'Large-format, image-led books printed to gallery quality.',
        heroUrl: '',
        heroAlt: '',
        intro:
          'When the visuals are the story, print quality is everything. We produce large-format, image-rich books with the paper and finish your work deserves.',
        examples: ['Photography', 'Art & design portfolios', 'Travel', 'Brand & lookbooks'],
        formats: ['Large landscape & square trims', 'Premium art paper', 'Lay-flat & hardcover binding', 'High-fidelity colour'],
        timeline: 'Typically 8–12 weeks',
        pricingNote: 'Premium print from ₹ — final estimate after the planner.',
        faqs: [
          { question: 'Can you colour-match my images?', answer: 'Yes, we proof and calibrate colour for image-led books.' },
          { question: 'What paper options are there?', answer: 'A range of art papers and finishes — we’ll recommend based on your images.' },
        ],
        ctaLabel: 'Start my art book',
      },
      {
        slug: 'business-book',
        icon: 'BarChart3',
        title: 'Business & Company Story',
        tagline: 'Tell your company’s story or build authority with a professional book.',
        heroUrl: '',
        heroAlt: '',
        intro:
          'A book is the ultimate business card. Whether it’s a founder’s story, a thought-leadership title or a corporate gift, we deliver a polished, on-brand result.',
        examples: ['Founder & company stories', 'Thought leadership', 'Anniversary & milestone books', 'Corporate gifting'],
        formats: ['On-brand design', 'Hardcover & paperback', 'Bulk corporate runs', 'eBook & print'],
        timeline: 'Typically 6–10 weeks',
        pricingNote: 'Corporate packages from ₹ — final estimate after the planner.',
        faqs: [
          { question: 'Can you print in bulk for our team?', answer: 'Yes, bulk corporate runs and gifting editions are available.' },
          { question: 'Can you match our brand guidelines?', answer: 'Yes, we design to your brand colours, fonts and tone.' },
        ],
        ctaLabel: 'Start my company book',
      },
    ],
  },
  authorHub: {
    heading: 'Author Hub',
    subheading: 'Your home as a published author — track earnings, grow your readership, and earn rewards.',
    referralReward: 'Love working with us? Refer a fellow author — when they publish their first book, you both get a reward. Share your link below.',
    community: [
      {
        label: 'Author community',
        url: '',
        description: 'Connect with other Cursive authors, swap tips, and share your launch.',
      },
      {
        label: 'Learning & resources',
        url: '',
        description: 'Guides on marketing, pricing, and growing your book sales.',
      },
      {
        label: 'Events & webinars',
        url: '',
        description: 'Join our author workshops and live sessions.',
      },
    ],
  },
  portfolio: {
    heading: 'From Our Portfolio',
    subheading: 'A selection of titles we have proudly brought to readers.',
    autoRotate: true,
    rotateSeconds: 3,
    items: [
      { title: 'The Good Divorce', author: 'Sarita Salwan', category: 'Memoir', coverUrl: '', linkUrl: '' },
      { title: 'Sheroes Amongst Us', author: 'Falguni Desai & Dr Amit Nagpal', category: 'Non-Fiction', coverUrl: '', linkUrl: '' },
      { title: 'Heroes Amongst Us', author: 'Dr Amit Nagpal', category: 'Non-Fiction', coverUrl: '', linkUrl: '' },
      { title: 'Pet Care Made Easy', author: 'Dr Gautam Unny', category: 'Non-Fiction', coverUrl: '', linkUrl: '' },
      { title: 'Tales of Wagging Tails', author: 'Dr Gautam Unny', category: 'Non-Fiction', coverUrl: '', linkUrl: '' },
      { title: 'Nautanki Saala and Other Stories', author: 'Mohua Chinappa', category: 'Fiction', coverUrl: '', linkUrl: '' },
    ],
  },
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Answers to the questions authors ask us most.',
    items: [
      {
        question: 'Who owns the rights to my book?',
        answer:
          'You do. Cursive authors retain 100% of their rights and creative control. We publish on your behalf—we never take ownership of your work.',
      },
      {
        question: 'How long does the publishing process take?',
        answer:
          'Timelines vary by plan and manuscript length, but most books move from manuscript to publication within a few weeks once editing begins.',
      },
      {
        question: 'How are royalties calculated and paid?',
        answer:
          'Royalty rates depend on your chosen plan. Payouts are transparent and made on a regular schedule. Logged-in authors can project their earnings using the Royalty Calculator.',
      },
      {
        question: 'Do you offer editing for manuscripts in languages other than English?',
        answer:
          'Please reach out via the contact form with details of your manuscript and language, and our team will advise on the best options.',
      },
      {
        question: 'Can I customise my book’s size, paper, and binding?',
        answer:
          'Yes. Use our book customiser to choose trim size, interior colour, paper, binding, cover finish, and layout, with a real-time price estimate.',
      },
    ],
  },
  pages: {
    about: {
      title: 'About Cursive Publishing',
      bannerUrl: '',
      body:
        'Cursive Publishing is a premium self-publishing partner dedicated to helping authors bring their stories to readers. Founded by industry veterans with over 30 years of combined experience, we combine traditional publishing craft with modern, author-first technology.\n\nWe believe a book is more than words on a page—it is a legacy. That is why we treat every manuscript as a unique project, offering personalised attention through editing, design, production, distribution, and marketing.\n\nUnlike many services, our authors retain full ownership and creative control of their work. Our role is to serve your vision, not to dictate it. From your first consultation to long after your launch, we remain your partner in building a lasting readership.',
    },
    terms: {
      title: 'Terms & Conditions',
      body:
        'These Terms & Conditions govern your use of the Cursive Publishing website and services. By accessing our site or engaging our services, you agree to these terms.\n\n1. Services. Cursive provides self-publishing services including editing, design, production, distribution, and related support as described in your selected plan.\n\n2. Author Rights. Authors retain ownership of their intellectual property. Cursive is granted a limited licence solely to provide the contracted services.\n\n3. Payments. Fees are as set out in your chosen plan or quotation. Applicable taxes, including 18% GST, are added at checkout.\n\n4. Refunds. Refund eligibility depends on the stage of work completed and is handled on a case-by-case basis.\n\n5. Liability. Cursive is not liable for indirect or consequential losses arising from use of our services to the extent permitted by law.\n\nThis is placeholder text. Please replace it with your final legal terms before going live.',
    },
    privacy: {
      title: 'Privacy Policy',
      body:
        'This Privacy Policy explains how Cursive Publishing collects, uses, and protects your personal information.\n\n1. Information We Collect. We collect information you provide directly—such as your name, email, phone number, and manuscript details—and limited technical information when you use our site.\n\n2. How We Use It. We use your information to provide and improve our services, communicate with you, process orders, and meet legal obligations.\n\n3. Sharing. We do not sell your personal information. We share it only with service providers who help us operate, and where required by law.\n\n4. Security. We take reasonable measures to protect your data, but no method of transmission or storage is completely secure.\n\n5. Your Rights. You may request access to, correction of, or deletion of your personal information by contacting us.\n\nThis is placeholder text. Please replace it with your final privacy policy before going live.',
    },
    publishingAgreement: {
      title: 'Publishing Agreement',
      body:
        'This Publishing Agreement sets out the terms on which Cursive Publishing provides publishing services for your work. By placing an order, you agree to this Agreement.\n\n1. Grant of Rights. You grant Cursive a non-exclusive licence to format, produce, distribute, and market your work solely to deliver the services in your selected plan. You retain ownership and copyright of your work at all times.\n\n2. Author Warranties. You confirm that the work is your original creation (or that you hold the necessary rights), does not infringe any third-party rights, and is not unlawful, defamatory, or obscene.\n\n3. Deliverables & Timelines. Specific services, formats, and timelines depend on your selected plan or quotation. Timelines are estimates and may vary.\n\n4. Royalties & Payments. Royalties (where applicable) and fees are as set out in your plan or quotation. Applicable taxes, including 18% GST, are added at checkout.\n\n5. Approvals. You are responsible for reviewing and approving proofs before production. Cursive is not liable for errors in content you approve.\n\n6. Termination. Either party may terminate as set out in your plan; work completed up to termination remains chargeable.\n\nThis is placeholder text. Please replace it with your final publishing agreement, reviewed by a qualified lawyer, before going live.',
    },
  },
  footer: {
    tagline:
      'Transforming manuscripts into professionally published books with 30+ years of industry expertise.',
    email: 'info@oakbridge.in',
    phone: '+91 00000 00000',
    location: 'India',
    copyrightName: 'Cursive Publishing',
    social: { facebook: '', instagram: '', linkedin: '', twitter: '', youtube: '' },
    newsletterHeading: 'Stay in the loop',
    newsletterText: 'Publishing tips and author stories, now and then. No spam.',
  },
  blog: {
    heading: 'From the Cursive blog',
    subheading: 'Guides, author stories and tips to help you publish with confidence.',
  },
  navigation: {
    header: [
      { label: 'Home', url: '#home', enabled: true },
      { label: 'Services', url: '/services', enabled: true },
      { label: 'Testimonials', url: '#testimonials', enabled: true },
      { label: 'Portfolio', url: '/portfolio', enabled: true },
      { label: 'Plans', url: '/plans', enabled: true },
      { label: 'Blog', url: '/blog', enabled: true },
    ],
    footerColumns: [
      {
        heading: 'Company',
        enabled: true,
        links: [
          { label: 'About Us', url: '/about', enabled: true },
          { label: 'Services', url: '/services', enabled: true },
          { label: 'Blog', url: '/blog', enabled: true },
          { label: 'Our Process', url: '#process', enabled: true },
          { label: 'FAQ', url: '/faq', enabled: true },
        ],
      },
      {
        heading: 'Explore',
        enabled: true,
        links: [
          { label: 'Home', url: '#home', enabled: true },
          { label: 'Pricing Plans', url: '#plans', enabled: true },
          { label: 'Customize a Book', url: '/customize', enabled: true },
          { label: 'Royalty Calculator', url: '/royalty-calculator', enabled: true },
          { label: 'Submit Manuscript', url: '#submit', enabled: true },
        ],
      },
    ],
    legalLinks: [
      { label: 'Terms & Conditions', url: '/terms', enabled: true },
      { label: 'Privacy Policy', url: '/privacy', enabled: true },
      { label: 'Publishing Agreement', url: '/publishing-agreement', enabled: true },
    ],
    showContact: true,
    showSocial: true,
    showNewsletter: true,
  },
};
// End of default site content.
