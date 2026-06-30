import { useEffect } from 'react';
import { useContent } from '../content/ContentProvider';
import { SiteContent } from '../content/defaults';
import { stripBase } from './basePath';

export const SITE_NAME = 'Cursive';
export const SITE_URL = 'https://cursivepublishing.com';

// Optional: add your social profile URLs here for richer Organization data.
const SOCIAL_PROFILES: string[] = [];

interface SeoResult {
  title: string;
  description: string;
  noindex?: boolean;
}

// Crumb labels for indexable subpages (Home is implicit position 1).
const CRUMB_LABELS: Record<string, string> = {
  '/services': 'Services',
  '/journeys': 'Journeys',
  '/planner': 'Plan Your Book',
  '/portfolio': 'Portfolio',
  '/plans': 'Plans',
  '/get-started': 'Get Started',
  '/faq': 'FAQ',
  '/about': 'About Us',
  '/terms': 'Terms & Conditions',
  '/privacy': 'Privacy Policy',
  '/publishing-agreement': 'Publishing Agreement',
  '/customize': 'Design Your Book',
};

const firstSentence = (text: string) =>
  (text || '').replace(/\s+/g, ' ').trim().split(/(?<=\.)\s/)[0].slice(0, 300);

function buildSeo(path: string, c: SiteContent): SeoResult {
  const t = (s: string) => `${s} — ${SITE_NAME}`;
  if (path === '/journeys')
    return { title: t('Choose Your Journey'), description: c.journeys.subheading };
  if (path.startsWith('/journey/')) {
    const slug = decodeURIComponent(path.slice('/journey/'.length));
    const j = c.journeys.items.find((x) => x.slug === slug);
    if (j) return { title: t(j.title), description: j.tagline };
    return { title: t('Journeys'), description: c.journeys.subheading };
  }
  switch (path) {
    case '':
      return { title: `${SITE_NAME} — Professional Self-Publishing | An Imprint of OakBridge`, description: c.hero.subheading };
    case '/services':
      return { title: t('Our Publishing Services'), description: c.services.subheading };
    case '/portfolio':
      return { title: t('Portfolio'), description: c.portfolio.subheading };
    case '/plans':
      return { title: t('Publishing Plans & Pricing'), description: c.pricing.subheading };
    case '/get-started':
      return { title: t('Start Your Publishing Journey'), description: c.getStarted.subheading };
    case '/planner':
      return { title: t('Plan Your Book — Instant Estimate'), description: 'Answer a few quick questions and get an instant estimate for publishing your book — budget, timeline and a recommended plan.' };
    case '/faq':
      return { title: t('Frequently Asked Questions'), description: c.faq.subtitle };
    case '/about':
      return { title: t(c.pages.about.title), description: firstSentence(c.pages.about.body) };
    case '/terms':
      return { title: t(c.pages.terms.title), description: 'Our Terms & Conditions.' };
    case '/privacy':
      return { title: t(c.pages.privacy.title), description: 'How we handle and protect your data.' };
    case '/publishing-agreement':
      return { title: t(c.pages.publishingAgreement.title), description: 'Our publishing agreement terms.' };
    case '/customize':
      return { title: t('Design Your Book'), description: c.customizer.subheading };
    case '/royalty-calculator':
      return { title: t('Royalty Calculator'), description: c.royaltyCalc.subheading, noindex: true };
    case '/login':
    case '/signup':
      return { title: t('Sign In or Sign Up'), description: 'Access your Cursive author account.', noindex: true };
    case '/account':
      return { title: t('My Account'), description: 'Your Cursive publishing dashboard.', noindex: true };
    case '/project':
      return { title: t('Project Workspace'), description: 'Your project workspace.', noindex: true };
    case '/hub':
      return { title: t('Author Hub'), description: 'Your author hub — earnings, referrals and achievements.', noindex: true };
    case '/checkout':
      return { title: t('Checkout'), description: 'Complete your order.', noindex: true };
    case '/quote':
      return { title: t('Request a Quote'), description: 'Request a tailored quote for your book.', noindex: true };
    case '/admin':
      return { title: t('Admin'), description: 'Cursive admin.', noindex: true };
    case '/reset-password':
      return { title: t('Reset Password'), description: 'Set a new password.', noindex: true };
    default:
      return { title: SITE_NAME, description: c.hero.subheading };
  }
}

function faqNode(c: SiteContent) {
  return {
    '@type': 'FAQPage',
    mainEntity: c.faq.items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}

function breadcrumbNode(path: string, label: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: label, item: `${SITE_URL}${path}` },
    ],
  };
}

function serviceNodes(c: SiteContent) {
  return c.services.items.map((s) => ({
    '@type': 'Service',
    name: s.title,
    description: s.description,
    provider: { '@type': 'Organization', name: SITE_NAME },
    areaServed: 'Worldwide',
  }));
}

// Per-page structured data: breadcrumb + page-specific nodes (FAQ / Services).
function pageJsonLd(path: string, c: SiteContent): object | null {
  const graph: object[] = [];
  const label = CRUMB_LABELS[path];
  if (label) graph.push(breadcrumbNode(path, label));
  if (path === '/services') graph.push(...serviceNodes(c));
  if (path === '/faq') graph.push(faqNode(c));
  if (path.startsWith('/journey/')) {
    const slug = decodeURIComponent(path.slice('/journey/'.length));
    const j = c.journeys.items.find((x) => x.slug === slug);
    if (j) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Journeys', item: `${SITE_URL}/journeys` },
          { '@type': 'ListItem', position: 3, name: j.title, item: `${SITE_URL}${path}` },
        ],
      });
      if (j.faqs.length) {
        graph.push({
          '@type': 'FAQPage',
          mainEntity: j.faqs.map((q) => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: { '@type': 'Answer', text: q.answer },
          })),
        });
      }
    }
  }
  if (graph.length === 0) return null;
  return { '@context': 'https://schema.org', '@graph': graph };
}

function siteJsonLd(c: SiteContent) {
  const org: Record<string, unknown> = {
    '@type': 'Organization',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/icon-512.png`,
    image: `${SITE_URL}/og-image.png`,
    description: 'Cursive is a self-publishing partner — an imprint of OakBridge.',
    parentOrganization: { '@type': 'Organization', name: 'OakBridge' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Spaze iTech Park, Tower B3, Sector 49',
      addressLocality: 'Gurugram',
      addressRegion: 'Haryana',
      postalCode: '122018',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: c.footer.email || 'info@cursivepublishing.com',
      ...(c.footer.phone ? { telephone: c.footer.phone } : {}),
    },
  };
  if (c.footer.email) org.email = c.footer.email;
  if (c.footer.phone) org.telephone = c.footer.phone;
  if (SOCIAL_PROFILES.length) org.sameAs = SOCIAL_PROFILES;
  return {
    '@context': 'https://schema.org',
    '@graph': [org, { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/` }],
  };
}

// ── head manipulation ──────────────────────────────────────────────────
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function setJsonLd(id: string, obj: object | null) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!obj) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(obj);
}

export function applySeo(path: string, c: SiteContent) {
  const { title, description, noindex } = buildSeo(path, c);
  const url = `${SITE_URL}${path === '' ? '/' : path}`;

  document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  setCanonical(url);

  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', 'website');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);

  setJsonLd('ld-site', siteJsonLd(c));
  setJsonLd('ld-page', pageJsonLd(path, c));
}

// Applies SEO for the current route. Call once at the app root.
export function useSeo() {
  const content = useContent();
  useEffect(() => {
    applySeo(stripBase(window.location.pathname), content);
  }, [content]);
}
