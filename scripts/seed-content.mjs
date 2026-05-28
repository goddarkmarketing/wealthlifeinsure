import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readHtml(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function firstMatch(html, re) {
  const m = html.match(re);
  return m ? (m[1] !== undefined ? decodeHtml(m[1].trim()) : m[0]) : "";
}

function metaDescription(html) {
  return firstMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
}

function pageTitle(html) {
  return firstMatch(html, /<title>([^<]*)<\/title>/i);
}

function normalizeAssetPath(src) {
  return src.replace(/^\.\.\//, "");
}

function slugFromHref(href) {
  const m = href.match(/(?:articles|careers)\/([^./]+)\.html$/);
  return m ? m[1] : basename(href, ".html");
}

function extractArticleBody(html) {
  const m = html.match(/<div\s+class="article-body">([\s\S]*?)<\/div>/);
  return m ? m[1].trim() : "";
}

function extractArticlePage(html) {
  const hero = firstMatch(html, /<section\s+class="page-hero[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  return {
    metaDescription: metaDescription(html),
    eyebrow: firstMatch(hero, /<p\s+class="eyebrow">([\s\S]*?)<\/p>/),
    h1: stripTags(firstMatch(hero, /<h1[^>]*>([\s\S]*?)<\/h1>/)),
    lead: stripTags(firstMatch(hero, /<p\s+class="article-hero-lead">([\s\S]*?)<\/p>/)),
    bodyHtml: extractArticleBody(html),
  };
}

function extractArticleCards(html) {
  const cards = [];
  const re = /<article\s+class="solution-item[^"]*"\s+data-category="([^"]+)">([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(html))) {
    const block = m[2];
    const href = firstMatch(block, /href="articles\/([^"]+\.html)"/);
    if (!href) continue;
    cards.push({
      slug: slugFromHref(`articles/${href}`),
      category: m[1],
      title: stripTags(firstMatch(block, /<h3>\s*<a[^>]*>([\s\S]*?)<\/a>/)),
      excerpt: stripTags(firstMatch(block, /<div>\s*<h3>[\s\S]*?<\/h3>\s*<p>([\s\S]*?)<\/p>/)),
      href: `articles/${href}`,
      imageSrc: normalizeAssetPath(firstMatch(block, /<img\s+[^>]*src="([^"]+)"/)),
    });
  }
  return cards;
}

function extractCareerCards(html) {
  const cards = [];
  const re = /<article\s+class="career-card[^"]*">([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(html))) {
    const block = m[1];
    const href = firstMatch(block, /href="careers\/([^"]+\.html)"/);
    if (!href) continue;
    cards.push({
      slug: slugFromHref(`careers/${href}`),
      title: stripTags(firstMatch(block, /<h3>\s*<a[^>]*>([\s\S]*?)<\/a>/)),
      excerpt: stripTags(firstMatch(block, /<div\s+class="career-card-body">[\s\S]*?<p>([\s\S]*?)<\/p>/)),
      href: `careers/${href}`,
      imageSrc: normalizeAssetPath(firstMatch(block, /<img\s+[^>]*src="([^"]+)"/)),
    });
  }
  return cards;
}

function extractPageHero(html) {
  const hero = firstMatch(html, /<section\s+class="page-hero[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  if (!hero) return null;
  return {
    eyebrow: stripTags(firstMatch(hero, /<p\s+class="eyebrow">([\s\S]*?)<\/p>/)),
    h1: stripTags(firstMatch(hero, /<h1[^>]*>([\s\S]*?)<\/h1>/)),
    copy: stripTags(
      firstMatch(hero, /<p\s+class="article-hero-lead">([\s\S]*?)<\/p>/) ||
        firstMatch(hero, /<h1[^>]*>[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/)
    ),
  };
}

function extractCareerHero(html) {
  const hero = firstMatch(html, /<section\s+class="career-hero[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  if (!hero) return null;
  return {
    h1: stripTags(firstMatch(hero, /<h1[^>]*>([\s\S]*?)<\/h1>/)),
    copy: stripTags(firstMatch(hero, /<h1[^>]*>[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/)),
    imageSrc: normalizeAssetPath(firstMatch(hero, /<img\s+[^>]*src="([^"]+)"/)),
  };
}

function extractHomeHero(html) {
  const hero = firstMatch(html, /<section\s+class="hero[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  if (!hero) return null;
  const h1Block = firstMatch(hero, /<h1[^>]*>([\s\S]*?)<\/h1>/);
  const spans = [...h1Block.matchAll(/<span>([\s\S]*?)<\/span>/g)].map((m) => stripTags(m[1]));
  const slides = [];
  const slideRe = /<figure\s+class="hero-slide[^"]*"[^>]*>([\s\S]*?)<\/figure>/g;
  let sm;
  while ((sm = slideRe.exec(hero))) {
    const block = sm[1];
    slides.push({
      src: normalizeAssetPath(firstMatch(block, /<img\s+[^>]*src="([^"]+)"/)),
      alt: firstMatch(block, /alt="([^"]*)"/),
      width: firstMatch(block, /width="(\d+)"/) || null,
      height: firstMatch(block, /height="(\d+)"/) || null,
      ratio: firstMatch(sm[0], /data-hero-ratio="([^"]+)"/) || null,
      active: /\bis-active\b/.test(sm[0]),
    });
  }
  return {
    eyebrow: stripTags(firstMatch(hero, /<p\s+class="eyebrow">([\s\S]*?)<\/p>/)),
    h1Spans: spans,
    copy: stripTags(firstMatch(hero, /<p\s+class="hero-copy">([\s\S]*?)<\/p>/)),
    slides,
  };
}

function extractContactHero(html) {
  const section = firstMatch(html, /<section\s+class="contact[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  if (!section) return null;
  const copy = firstMatch(section, /<div\s+class="contact-copy">([\s\S]*?)<\/div>/);
  return {
    eyebrow: stripTags(firstMatch(copy, /<p\s+class="eyebrow">([\s\S]*?)<\/p>/)),
    h1: stripTags(firstMatch(copy, /<h1[^>]*>([\s\S]*?)<\/h1>/)),
    copy: stripTags(firstMatch(copy, /<h1[^>]*>[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/)),
  };
}

function extractContactChips(html) {
  const chips = [];
  const section = firstMatch(html, /<div\s+class="contact-links"[^>]*>([\s\S]*?)<\/div>/);
  if (!section) return chips;
  const re = /<a\s+class="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(section))) {
    const attrs = m[2];
    const body = m[3];
    const classes = m[1].split(/\s+/);
    chips.push({
      variant: classes.find((c) => c.startsWith("contact-chip--"))?.replace("contact-chip--", "") || "default",
      href: firstMatch(attrs, /href="([^"]+)"/),
      title: stripTags(firstMatch(body, /<span\s+class="contact-chip-title">([\s\S]*?)<\/span>/)),
      meta: stripTags(firstMatch(body, /<span\s+class="contact-chip-meta">([\s\S]*?)<\/span>/)),
      external: /\btarget="_blank"/.test(attrs),
    });
  }
  return chips;
}

function extractPromos(html) {
  const section = firstMatch(html, /<section\s+class="promo-duo[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  const promos = {};
  if (!section) return promos;
  const re = /<a\s+class="promo-duo-card"\s+href="([^"]+)">([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(section))) {
    const href = m[1].replace(/^\.\.\//, "");
    const key = href.includes("career") ? "joinTeam" : "insurance";
    promos[key] = {
      href,
      imageSrc: normalizeAssetPath(firstMatch(m[2], /<img\s+[^>]*src="([^"]+)"/)),
      alt: firstMatch(m[2], /alt="([^"]*)"/),
      width: firstMatch(m[2], /width="(\d+)"/) || null,
      height: firstMatch(m[2], /height="(\d+)"/) || null,
    };
  }
  return promos;
}

function extractSite(html) {
  const footer = firstMatch(html, /<footer\s+class="site-footer"[^>]*>([\s\S]*?)<\/footer>/);
  return {
    name: "Wealth Life Insure",
    brandSlug: stripTags(firstMatch(footer, /<span\s+class="footer-brand-name"[^>]*>([\s\S]*?)<\/span>/)),
    metaDescription: metaDescription(html),
    title: pageTitle(html),
    tagline: stripTags(firstMatch(footer, /<p\s+class="footer-desc">([\s\S]*?)<\/p>/)),
    phones: {
      tam: { label: "แต้ม", display: "087-046-7443", tel: "0870467443" },
      a: { label: "เอ", display: "083-451-5615", tel: "0834515615" },
    },
    hours: stripTags(firstMatch(footer, /เวลาทำการ<\/span>\s*([^<]+)/)),
    office: stripTags(firstMatch(footer, /สำนักงาน<\/span>\s*([^<]+)/)),
    licenses: stripTags(firstMatch(footer, /ใบอนุญาต<\/span>\s*([^<]+)/)),
    footerNote: stripTags(firstMatch(footer, /<p\s+class="footer-info-note">([\s\S]*?)<\/p>/)),
    copyright: stripTags(firstMatch(footer, /<p\s+class="footer-copy">([\s\S]*?)<\/p>/)),
  };
}

// --- read sources ---
const indexHtml = readHtml("index.html");
const newsHtml = readHtml("news.html");
const careersHtml = readHtml("careers.html");
const contactHtml = readHtml("contact.html");

const articleCards = extractArticleCards(newsHtml);
const careerCards = extractCareerCards(careersHtml);

const articles = articleCards.map((card) => {
  const pageHtml = readHtml(`articles/${card.slug}.html`);
  const page = extractArticlePage(pageHtml);
  return { ...card, ...page };
});

const careers = careerCards.map((card) => {
  const pageHtml = readHtml(`careers/${card.slug}.html`);
  const page = extractArticlePage(pageHtml);
  return { ...card, ...page };
});

const output = {
  version: 1,
  site: extractSite(indexHtml),
  pages: {
    home: {
      metaDescription: metaDescription(indexHtml),
      title: pageTitle(indexHtml),
      hero: extractHomeHero(indexHtml),
    },
    news: {
      metaDescription: metaDescription(newsHtml),
      title: pageTitle(newsHtml),
      hero: extractPageHero(newsHtml),
      cards: articleCards,
    },
    careers: {
      metaDescription: metaDescription(careersHtml),
      title: pageTitle(careersHtml),
      hero: extractCareerHero(careersHtml),
      cards: careerCards,
    },
    contact: {
      metaDescription: metaDescription(contactHtml),
      title: pageTitle(contactHtml),
      hero: extractContactHero(contactHtml),
      chips: extractContactChips(contactHtml),
    },
  },
  articles,
  careers,
  promos: extractPromos(indexHtml),
};

const outDir = join(root, "content");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "site.json");
writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

const counts = {
  articleCards: articleCards.length,
  articles: articles.length,
  careerCards: careerCards.length,
  careers: careers.length,
  homeSlides: output.pages.home.hero?.slides?.length ?? 0,
  contactChips: output.pages.contact.chips?.length ?? 0,
  promos: Object.keys(output.promos).length,
};

console.log(`Wrote ${outPath}`);
console.log("Counts:", JSON.stringify(counts, null, 2));
