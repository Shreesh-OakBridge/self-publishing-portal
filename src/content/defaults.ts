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
  cards: FeatureCard[];
}

export interface BrandingContent {
  logoUrl: string;
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
  features: string[];
}

export interface PricingContent {
  heading: string;
  subheading: string;
  plans: PricingPlan[];
}

export interface ContactContent {
  heading: string;
  subheading: string;
  successTitle: string;
  successMessage: string;
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
}

export interface PagesContent {
  about: StaticPageContent;
  terms: StaticPageContent;
  privacy: StaticPageContent;
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
}

export interface PortfolioContent {
  heading: string;
  subheading: string;
  items: PortfolioItem[];
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
  hero: HeroContent;
  valueProps: ValuePropsContent;
  video: VideoContent;
  homeLayout: HomeLayoutContent;
  confidenceBar: ConfidenceBarContent;
  services: ServicesContent;
  portfolio: PortfolioContent;
  pricing: PricingContent;
  customizer: CustomizerContent;
  contact: ContactContent;
  faq: FaqContent;
  pages: PagesContent;
  footer: FooterContent;
}

export const defaultContent: SiteContent = {
  branding: {
    logoUrl: '',
  },
  hero: {
    badge: 'Premium Self-Publishing Excellence',
    headlineLine1: 'Your Story,',
    headlineLine2: 'Beautifully Published',
    subheading:
      "OakBridge Publishing brings your literary dreams to life with 30+ years of industry expertise. We're not just a publishing service—we're your partner in creating lasting impact.",
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
      'Watch how OakBridge Publishing transforms your manuscript into a professional, market-ready book with our proven process.',
    videoUrl: '',
    posterUrl: '',
    overlayTitle: 'From Manuscript to Masterpiece: The OakBridge Way',
    overlaySubtitle: 'See how our 30+ years of experience makes the difference',
    apartHeading: 'What Sets OakBridge Apart',
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
          'OakBridge Classics imprint',
        ],
      },
      {
        name: 'Professional',
        price: '₹79,999',
        tagline: 'For authors ready to build a brand',
        popular: true,
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
          'OakBridge Imprint Series imprint',
          'Priority support (phone & email)',
        ],
      },
      {
        name: 'Excellence',
        price: '₹1,59,999',
        tagline: 'Premium publishing with full support',
        popular: false,
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
          'OakBridge Prestige imprint',
          'Dedicated account manager',
          'Priority support (24/7 access)',
        ],
      },
      {
        name: 'Elite',
        price: '₹2,99,999',
        tagline: 'The ultimate publishing experience',
        popular: false,
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
      },
      {
        title: 'Cover Design',
        summary: 'Custom, market-ready covers.',
        description:
          'Original cover concepts designed to stand out on shelves and thumbnails alike, tailored to your genre and audience.',
      },
      {
        title: 'Interior Formatting',
        summary: 'Print & ebook typesetting.',
        description:
          'Professional interior layout and typesetting for paperback, hardback, and ebook formats, with attention to readability and trim size.',
      },
      {
        title: 'ISBN & Copyright',
        summary: 'Registration handled for you.',
        description:
          'We assign ISBNs and assist with copyright registration so your work is protected and discoverable.',
      },
      {
        title: 'Distribution',
        summary: 'Reach Amazon, Flipkart & more.',
        description:
          'Global and Indian distribution across major online retailers, libraries, and 40+ platforms to maximise your reach.',
      },
      {
        title: 'Marketing Support',
        summary: 'Launch & promote with confidence.',
        description:
          'Launch strategy, press materials, and promotional assets to help your book find its readers.',
      },
    ],
  },
  portfolio: {
    heading: 'From Our Portfolio',
    subheading: 'A selection of titles we have proudly brought to readers.',
    items: [
      { title: 'Threads of Dawn', author: 'Ananya Sharma', category: 'Fiction', coverUrl: '' },
      { title: 'The Quiet Quarter', author: 'Rajat Mehta', category: 'Literary Fiction', coverUrl: '' },
      { title: 'Beyond the Ledger', author: 'Vikram Nair', category: 'Business', coverUrl: '' },
      { title: 'Monsoon Letters', author: 'Fatima Qureshi', category: 'Poetry', coverUrl: '' },
      { title: 'The Founder’s Map', author: 'Sneha Iyer', category: 'Non-Fiction', coverUrl: '' },
      { title: 'Echoes of Silence', author: 'Arjun Desai', category: 'Thriller', coverUrl: '' },
    ],
  },
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Answers to the questions authors ask us most.',
    items: [
      {
        question: 'Who owns the rights to my book?',
        answer:
          'You do. OakBridge authors retain 100% of their rights and creative control. We publish on your behalf—we never take ownership of your work.',
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
      title: 'About OakBridge Publishing',
      body:
        'OakBridge Publishing is a premium self-publishing partner dedicated to helping authors bring their stories to readers. Founded by industry veterans with over 30 years of combined experience, we combine traditional publishing craft with modern, author-first technology.\n\nWe believe a book is more than words on a page—it is a legacy. That is why we treat every manuscript as a unique project, offering personalised attention through editing, design, production, distribution, and marketing.\n\nUnlike many services, our authors retain full ownership and creative control of their work. Our role is to serve your vision, not to dictate it. From your first consultation to long after your launch, we remain your partner in building a lasting readership.',
    },
    terms: {
      title: 'Terms & Conditions',
      body:
        'These Terms & Conditions govern your use of the OakBridge Publishing website and services. By accessing our site or engaging our services, you agree to these terms.\n\n1. Services. OakBridge provides self-publishing services including editing, design, production, distribution, and related support as described in your selected plan.\n\n2. Author Rights. Authors retain ownership of their intellectual property. OakBridge is granted a limited licence solely to provide the contracted services.\n\n3. Payments. Fees are as set out in your chosen plan or quotation. Applicable taxes, including 18% GST, are added at checkout.\n\n4. Refunds. Refund eligibility depends on the stage of work completed and is handled on a case-by-case basis.\n\n5. Liability. OakBridge is not liable for indirect or consequential losses arising from use of our services to the extent permitted by law.\n\nThis is placeholder text. Please replace it with your final legal terms before going live.',
    },
    privacy: {
      title: 'Privacy Policy',
      body:
        'This Privacy Policy explains how OakBridge Publishing collects, uses, and protects your personal information.\n\n1. Information We Collect. We collect information you provide directly—such as your name, email, phone number, and manuscript details—and limited technical information when you use our site.\n\n2. How We Use It. We use your information to provide and improve our services, communicate with you, process orders, and meet legal obligations.\n\n3. Sharing. We do not sell your personal information. We share it only with service providers who help us operate, and where required by law.\n\n4. Security. We take reasonable measures to protect your data, but no method of transmission or storage is completely secure.\n\n5. Your Rights. You may request access to, correction of, or deletion of your personal information by contacting us.\n\nThis is placeholder text. Please replace it with your final privacy policy before going live.',
    },
  },
  footer: {
    tagline:
      'Transforming manuscripts into professionally published books with 30+ years of industry expertise.',
    email: 'info@oakbridge.in',
    phone: '+91 00000 00000',
    location: 'India',
    copyrightName: 'OakBridge Publishing',
  },
};
// End of default site content.
