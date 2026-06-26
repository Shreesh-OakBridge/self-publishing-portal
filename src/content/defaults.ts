// Single source of truth for all editable site content.
// Supabase `site_content` stores only overrides (keyed by section); these
// defaults always render first, so the site works even before the CMS is used.

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

export interface FooterContent {
  tagline: string;
  email: string;
  phone: string;
  location: string;
  copyrightName: string;
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

export interface ServiceItem {
  title: string;
  summary: string;
  description: string;
  icon: string;
}

export interface ServicesContent {
  heading: string;
  subheading: string;
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
  methodHeading: string;
  expertTitle: string;
  expertTagline: string;
  expertPoints: string[];
  selfTitle: string;
  selfTagline: string;
  selfPoints: string[];
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
}

export interface HomeLayoutSection {
  key: string;
  enabled: boolean;
}

export interface HomeLayoutContent {
  sections: HomeLayoutSection[];
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
  { key: 'contact', label: 'Contact Form' },
];

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
  portfolio: PortfolioContent;
  testimonials: TestimonialsContent;
  pricing: PricingContent;
  customizer: CustomizerContent;
  manuscript: ManuscriptSectionContent;
  royaltyCalc: RoyaltyCalcContent;
  editorial: EditorialContent;
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
    methodHeading: 'How do you want to publish your book?',
    expertTitle: 'Expert Publishing',
    expertTagline: 'Get your own expert publishing team',
    expertPoints: [
      'Dedicated team for editing, design & marketing',
      'Get published in 30 days',
      'End-to-end guidance from our experts',
      'Choose from our curated publishing packages',
    ],
    selfTitle: 'Publish on your own',
    selfTagline: 'Use our online tools to design & publish',
    selfPoints: [
      'Design your book with our customizer',
      'Transparent, itemised pricing',
      'Publish print & eBook',
      'Sell across 150+ countries and 20,000+ stores',
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
  },
  hero: {
    badge: 'Premium Self-Publishing Excellence',
    headlineLine1: 'Your Story,',
    headlineLine2: 'Beautifully Published',
    subheading:
      "Cursive Publishing brings your literary dreams to life with 30+ years of industry expertise. We're not just a publishing service—we're your partner in creating lasting impact.",
    primaryCta: 'Start Your Journey',
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
        price: '₹29,999',
        tagline: 'Perfect for first-time authors',
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
        name: 'Professional',
        price: '₹79,999',
        tagline: 'For authors ready to build a brand',
        popular: true,
        royaltyRate: 45,
        features: [
          'Comprehensive developmental editing',
          'Professional copyediting (up to 100,000 words)',
          'Multiple rounds of proofreading',
          'Custom cover design (3 concepts)',
          'Premium interior formatting (color available)',
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
        name: 'Excellence',
        price: '₹1,59,999',
        tagline: 'Premium publishing with full support',
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
          'Audiobook production (50% discounted rate)',
          'Launch campaign management (3 months)',
          'Amazon & Flipkart Ads setup',
          'Cursive Prestige imprint',
          'Dedicated account manager',
          'Priority support (24/7 access)',
        ],
      },
      {
        name: 'Elite',
        price: '₹2,99,999',
        tagline: 'The ultimate publishing experience',
        popular: false,
        royaltyRate: 60,
        features: [
          'Full developmental & structural editing',
          'Professional copyediting (unlimited, multiple revisions)',
          'Comprehensive proofreading & fact-checking',
          'Luxury custom cover design (unlimited concepts)',
          'Premium interior design by award-winning designers',
          'Multiple ISBNs (all formats)',
          'Full copyright & trademark protection',
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
        name: 'Cursive Imprint Series (Professional Plan)',
        desc: 'For authors building their brand and creating professional, market-competitive titles across all genres. This imprint signifies quality and editorial excellence.',
      },
      {
        name: 'Cursive Prestige (Excellence Plan)',
        desc: 'Reserved for authors published at the highest standards. Your imprint will feature on premium-quality books with exclusive design elements and premium distribution.',
      },
      {
        name: 'Cursive Signature (Elite Plan)',
        desc: "Our most exclusive imprint featuring the author's biography and signature edition mark. Only for authors receiving our white-glove publishing service with guaranteed visibility.",
      },
    ],
  },
  customizer: {
    heading: 'Design Your Book',
    subheading:
      "Customize every aspect of your book production and get real-time price estimates. See exactly what you're getting before you commit.",
    baseCost: 8000,
    paperTypes: [
      { id: 'glossy', name: 'Glossy Paper', desc: 'High shine finish, vibrant colors', price: 0 },
      { id: 'matte', name: 'Matte Paper', desc: 'Professional look, no glare', price: 500 },
      { id: 'premium', name: 'Premium Cream', desc: 'Classic feel, elegant appearance', price: 1000 },
      { id: 'recycled', name: 'Recycled Paper', desc: 'Eco-friendly option', price: 800 },
    ],
    colorOptions: [
      { id: 'bw', name: 'Black & White', desc: 'Single-color interior printing', price: 0 },
      { id: 'color', name: 'Full Color (4-Color)', desc: '4-color pages throughout', price: 2500 },
    ],
    bindingOptions: [
      { id: 'paperback', name: 'Paperback', desc: 'Soft cover, lightweight', price: 0 },
      { id: 'hardback', name: 'Hardback', desc: 'Hard cover, premium & durable', price: 1500 },
    ],
    coverDesigns: [
      { id: 'standard', name: 'Standard Design', desc: 'Clean, professional layout', price: 0 },
      { id: 'embossed', name: 'Embossed Cover', desc: 'Raised text & patterns', price: 2000 },
      { id: 'foil', name: 'Foil Stamping', desc: 'Metallic accents', price: 3500 },
      { id: 'textured', name: 'Textured Cover', desc: 'Premium tactile finish', price: 2500 },
      { id: 'full_color', name: 'Full Color HD', desc: 'Ultra-vibrant, photo-quality', price: 1500 },
    ],
    layoutOptions: [
      { id: 'single', name: 'Single Column', desc: 'Traditional book layout', price: 0 },
      { id: 'double', name: 'Two Column', desc: 'Modern, compact layout', price: 1000 },
      { id: 'illustrated', name: 'Illustrated Layout', desc: 'With art & graphics', price: 3000 },
      { id: 'custom', name: 'Custom Design', desc: 'Unique, personalized layout', price: 5000 },
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
    items: [
      {
        title: 'Editorial & Proofreading',
        summary: 'Developmental, copy, and line editing.',
        description:
          'Our experienced editors refine structure, language, and consistency—from developmental editing that shapes your narrative to meticulous proofreading that polishes every line.',
        icon: 'PenTool',
      },
      {
        title: 'Cover Design',
        summary: 'Custom, market-ready covers.',
        description:
          'Original cover concepts designed to stand out on shelves and thumbnails alike, tailored to your genre and audience.',
        icon: 'Palette',
      },
      {
        title: 'Interior Formatting',
        summary: 'Print & ebook typesetting.',
        description:
          'Professional interior layout and typesetting for paperback, hardback, and ebook formats, with attention to readability and trim size.',
        icon: 'LayoutGrid',
      },
      {
        title: 'ISBN & Copyright',
        summary: 'Registration handled for you.',
        description:
          'We assign ISBNs and assist with copyright registration so your work is protected and discoverable.',
        icon: 'ShieldCheck',
      },
      {
        title: 'Distribution',
        summary: 'Reach Amazon, Flipkart & more.',
        description:
          'Global and Indian distribution across major online retailers, libraries, and 40+ platforms to maximise your reach.',
        icon: 'Globe',
      },
      {
        title: 'Marketing Support',
        summary: 'Launch & promote with confidence.',
        description:
          'Launch strategy, press materials, and promotional assets to help your book find its readers.',
        icon: 'Megaphone',
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
  },
};
// End of default site content.
