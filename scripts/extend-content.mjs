import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

function decodeHtml(t) {
  return t
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');
}

function strip(html) {
  return decodeHtml(String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function m(html, re) {
  const x = html.match(re);
  return x ? decodeHtml((x[1] ?? '').trim()) : '';
}

function sec(html, cls) {
  const r = new RegExp(`<section[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/section>`);
  return m(html, r);
}

function headingBlock(html) {
  return {
    eyebrow: strip(m(html, /<p class="eyebrow">([\s\S]*?)<\/p>/)),
    h2: strip(m(html, /<h2[^>]*>([\s\S]*?)<\/h2>/)),
    lead: strip(m(html, /<p class="home-articles-lead">([\s\S]*?)<\/p>/) || m(html, /<p class="intro-lead">([\s\S]*?)<\/p>/)),
  };
}

function footerLinks(html, labelId) {
  const nav = m(html, new RegExp(`<nav[^>]*aria-labelledby="${labelId}"[^>]*>([\\s\\S]*?)<\\/nav>`));
  const links = [];
  const re = /<li><a href="([^"]+)">([\s\S]*?)<\/a><\/li>/g;
  let x;
  while ((x = re.exec(nav))) links.push({ href: x[1], label: strip(x[2]) });
  return links;
}

const index = read('index.html');
const about = read('about.html');
const insurance = read('insurance.html');
const contact = read('contact.html');
const data = JSON.parse(read('content/site.json'));

data.header = {
  brandName: strip(m(index, /<span class="brand-name"[^>]*>([\s\S]*?)<\/span>/)),
  logoPath: 'assets/logo/logo.png',
};

data.footer = {
  brandCol: {
    brandSlug: data.site.brandSlug,
    desc: data.site.tagline,
    phoneTamLabel: data.site.phones.tam.label,
    phoneTamDisplay: data.site.phones.tam.display,
    phoneTamTel: data.site.phones.tam.tel,
    phoneALabel: data.site.phones.a.label,
    phoneADisplay: data.site.phones.a.display,
    phoneATel: data.site.phones.a.tel,
    hours: data.site.hours,
  },
  mainNav: {
    title: strip(m(index, /id="footer-nav-label"[^>]*>([\s\S]*?)<\/h2>/)),
    links: footerLinks(index, 'footer-nav-label'),
  },
  productsNav: {
    title: strip(m(index, /id="footer-products-label"[^>]*>([\s\S]*?)<\/h2>/)),
    links: footerLinks(index, 'footer-products-label'),
  },
  infoCol: {
    title: 'ข้อมูลเพิ่มเติม',
    office: data.site.office,
    licenses: data.site.licenses,
    note: data.site.footerNote,
  },
  legal: {
    copyright: data.site.copyright,
    privacyLabel: strip(m(contact, /footer-legal-link[^>]*#privacy[^>]*>([\s\S]*?)<\/a>/)) || 'Privacy Policy',
    termsLabel: strip(m(contact, /footer-legal-link[^>]*#terms[^>]*>([\s\S]*?)<\/a>/)) || 'Terms of Service',
    privacyTitle: strip(m(contact, /id="privacy-title">([\s\S]*?)<\/h2>/)),
    privacyBody: strip(m(contact, /id="privacy"[\s\S]*?<p>([\s\S]*?)<\/p>/)),
    termsTitle: strip(m(contact, /id="terms-title">([\s\S]*?)<\/h2>/)),
    termsBody: strip(m(contact, /id="terms"[\s\S]*?<p>([\s\S]*?)<\/p>/)),
  },
};

const introSec = sec(index, 'intro');
const processSec = sec(index, 'process');
const solSec = sec(index, 'solutions');
const prodSec = sec(index, 'product-categories');

const chips = [];
const chipRe = /<a class="product-plan-chip"[\s\S]*?href="([^"]+)"[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?product-plan-chip-label">([\s\S]*?)<\/span>/g;
let cm;
while ((cm = chipRe.exec(prodSec))) {
  chips.push({ href: cm[1], image: cm[2], label: strip(cm[3]) });
}

data.pages.home = {
  ...data.pages.home,
  metaDescription: m(index, /<meta name="description" content="([^"]*)"/),
  title: m(index, /<title>([^<]*)<\/title>/),
  solutionsHeading: headingBlock(solSec.split('<div class="solution-carousel"')[0] || solSec),
  productCategories: {
    h2: strip(m(prodSec, /<h2>([\s\S]*?)<\/h2>/)),
    chips,
  },
  intro: {
    eyebrow: strip(m(introSec, /<p class="eyebrow">([\s\S]*?)<\/p>/)),
    h2: strip(m(introSec, /<h2[^>]*>([\s\S]*?)<\/h2>/)),
    lead: strip(m(introSec, /<p class="intro-lead">([\s\S]*?)<\/p>/)),
    tags: [...introSec.matchAll(/<strong class="intro-tag-title">([\s\S]*?)<\/strong>/g)].map((x) => ({
      title: strip(x[1]),
    })),
    imageSrc: m(introSec, /<img[^>]*src="([^"]+)"/),
    imageAlt: m(introSec, /alt="([^"]*)"/),
  },
  process: {
    eyebrow: strip(m(processSec, /<p class="eyebrow">([\s\S]*?)<\/p>/)),
    h2: strip(m(processSec, /<h2[^>]*>([\s\S]*?)<\/h2>/)),
    copy: strip(m(processSec, /<p class="process-copy">([\s\S]*?)<\/p>/)),
    linkText: strip(m(processSec, /<a class="process-link"[^>]*>([\s\S]*?)<\/a>/)),
    linkHref: m(processSec, /<a class="process-link"[^>]*href="([^"]+)"/) || 'contact.html',
    steps: [...processSec.matchAll(/<div class="step[^"]*">[\s\S]*?<span>(\d+)<\/span>[\s\S]*?<strong>([\s\S]*?)<\/strong>[\s\S]*?<p>([\s\S]*?)<\/p>/g)].map(
      (x) => ({ num: x[1], title: strip(x[2]), desc: strip(x[3]) })
    ),
  },
  taxPlansHeading: {
    ...headingBlock(sec(index, 'tax-plans')),
    sidebarLabel: strip(m(index, /<aside class="tax-plan-sidebar"[\s\S]*?<p>([\s\S]*?)<\/p>/)),
  },
  testimonials: headingBlock(sec(index, 'testimonials')),
  homeArticles: {
    ...headingBlock(m(index, /home-articles[\s\S]*?<div class="section-heading section-reveal">([\s\S]*?)<\/div>/)),
    moreText: strip(m(index, /home-articles[\s\S]*?home-articles-more[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/)) || 'ดูบทความทั้งหมด',
    moreHref: m(index, /home-articles[\s\S]*?href="([^"]+\.html)"/) || 'news.html',
  },
  homeCareers: {
    ...headingBlock(m(index, /home-careers[\s\S]*?<div class="section-heading section-reveal">([\s\S]*?)<\/div>/)),
    moreText: strip(m(index, /home-careers[\s\S]*?home-articles-more[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/)) || 'ดูทั้งหมด 9 เรื่อง',
    moreHref: m(index, /home-careers[\s\S]*?href="([^"]+\.html)"/) || 'careers.html',
  },
  ctaBand: {
    eyebrow: strip(m(index, /cta-band[\s\S]*?<p class="eyebrow">([\s\S]*?)<\/p>/)),
    h2: strip(m(index, /cta-band[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/)),
    copy: strip(m(index, /cta-band[\s\S]*?<h2[\s\S]*?<\/h2>\s*<p>([\s\S]*?)<\/p>/)),
    buttonText: strip(m(index, /cta-band[\s\S]*?<a class="button primary"[^>]*>([\s\S]*?)<\/a>/)),
    buttonHref: m(index, /cta-band[\s\S]*?<a class="button primary"[^>]*href="([^"]+)"/) || 'contact.html',
  },
};

data.pages.about = {
  metaDescription: m(about, /<meta name="description" content="([^"]*)"/),
  title: m(about, /<title>([^<]*)<\/title>/),
  hero: {
    eyebrow: strip(m(about, /<p class="eyebrow">([\s\S]*?)<\/p>/)),
    h1: strip(m(about, /<h1[^>]*>([\s\S]*?)<\/h1>/)),
    lead: strip(m(about, /<p class="page-hero-lead">([\s\S]*?)<\/p>/)),
    slides: [...about.matchAll(/<figure class="hero-slide"[\s\S]*?<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/g)].map((x) => ({
      src: x[1],
      alt: x[2],
    })),
  },
  followup: strip(m(about, /<p class="about-hero-followup">([\s\S]*?)<\/p>/)),
  agent: {
    eyebrow: strip(m(about, /<article class="agent-profile-panel[\s\S]*?<p class="eyebrow">([\s\S]*?)<\/p>/)),
    h2: strip(m(about, /<article class="agent-profile-panel[\s\S]*?<h2>([\s\S]*?)<\/h2>/)),
    photo: m(about, /agent-card-photo[\s\S]*?src="([^"]+)"/),
    lead: strip(m(about, /<p class="agent-intro-lead">([\s\S]*?)<\/p>/)),
    license: strip(m(about, /ใบอนุญาตเลขที่[\s\S]*?agent-contact-value">([\s\S]*?)<\/span>/)),
  },
};

data.pages.insurance = {
  metaDescription: m(insurance, /<meta name="description" content="([^"]*)"/),
  title: m(insurance, /<title>([^<]*)<\/title>/),
  hero: {
    eyebrow: strip(m(insurance, /<section class="page-hero"[\s\S]*?<p class="eyebrow">([\s\S]*?)<\/p>/)),
    h1: strip(m(insurance, /<section class="page-hero"[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/)),
    copy: strip(m(insurance, /<section class="page-hero"[\s\S]*?<h1[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/)),
  },
  listingHeading: headingBlock(m(insurance, /<section class="solutions"[\s\S]*?<div class="section-heading"/) || insurance),
};

function pageBody(file) {
  const html = read(file);
  const body = m(html, /<div class="article-body">([\s\S]*?)<\/div>/);
  return {
    metaDescription: m(html, /<meta name="description" content="([^"]*)"/),
    title: m(html, /<title>([^<]*)<\/title>/),
    hero: {
      eyebrow: strip(m(html, /<p class="eyebrow">([\s\S]*?)<\/p>/)),
      h1: strip(m(html, /<h1[^>]*>([\s\S]*?)<\/h1>/)),
      copy: strip(m(html, /<p class="article-hero-lead">([\s\S]*?)<\/p>/) || m(html, /<h1[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/)),
    },
    bodyHtml: body,
  };
}

data.pages.lifeInsurance = pageBody('life-insurance.html');
data.pages.healthInsurance = pageBody('health-insurance.html');
data.pages.savingsRetirement = pageBody('savings-retirement.html');

data.pages.contact.hero.eyebrow =
  strip(m(contact, /<div class="contact-copy">[\s\S]*?<p class="eyebrow">([\s\S]*?)<\/p>/)) || data.pages.contact.hero.eyebrow;

data.pages.contact.form = {
  nameLabel: strip(m(contact, /name="name"[\s\S]*?contact-form-label">([\s\S]*?)<\/span>/)),
  namePlaceholder: m(contact, /name="name"[^>]*placeholder="([^"]*)"/),
  phoneLabel: strip(m(contact, /name="phone"[\s\S]*?contact-form-label">([\s\S]*?)<\/span>/)),
  phonePlaceholder: m(contact, /name="phone"[^>]*placeholder="([^"]*)"/),
  interestLabel: strip(m(contact, /id="contact-interest"[\s\S]*?contact-form-label">([\s\S]*?)<\/span>/)),
  planLabel: strip(m(contact, /id="contact-insurance-plan"[\s\S]*?contact-form-label">([\s\S]*?)<\/span>/)),
  messageLabel: strip(m(contact, /name="message"[\s\S]*?contact-form-label">([\s\S]*?)<\/span>/)),
  messagePlaceholder: m(contact, /name="message"[^>]*placeholder="([^"]*)"/),
  submitText: strip(m(contact, /contact-submit[^>]*>([\s\S]*?)<\/button>/)),
  formNote: strip(m(contact, /<p class="form-note">([\s\S]*?)<\/p>/)),
  planLinkText: strip(m(contact, /href="insurance.html"[^>]*>([\s\S]*?)<\/a>/)),
};

writeFileSync(join(root, 'content/site.json'), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Extended site.json OK');
