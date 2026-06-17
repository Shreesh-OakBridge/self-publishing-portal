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

export interface SiteContent {
  branding: BrandingContent;
  hero: HeroContent;
  valueProps: ValuePropsContent;
  video: VideoContent;
  pricing: PricingContent;
  contact: ContactContent;
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
  contact: {
    heading: 'Start Your Publishing Journey',
    subheading:
      'Fill out the form below and one of our publishing experts will contact you within 24 hours to discuss your project and answer any questions.',
    successTitle: 'Thank You!',
    successMessage:
      "We've received your information and are excited to learn more about your project. A member of our team will reach out to you within 24 hours to discuss your publishing journey.",
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
