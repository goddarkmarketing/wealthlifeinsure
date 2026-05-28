import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  esc,
  prefixFor,
  renderHead,
  renderHeader,
  renderFooter,
  renderPromo,
  renderArticleCard,
  renderCareerCard,
  renderArticleSidebar,
  renderRelatedCareers,
} from './lib/cms-html.mjs';
import { applyContentPatches } from './cms-patches.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentPath = path.join(rootDir, 'content', 'site.json');

const data = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
data.updatedAt = new Date().toISOString();
fs.writeFileSync(contentPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

const { site, pages, articles, careers, promos, header, footer } = data;

function write(file, content) {
  const full = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('wrote', file);
}

function pageShell({ file, current, title, description, ogImage, main }) {
  const prefix = prefixFor(file);
  return `${renderHead({ title, description, ogImage, prefix })}
<body>
${renderHeader({ prefix, current, site, header })}
  <main>
${main}
  </main>
${renderPromo({ prefix, promos })}
${renderFooter({ prefix, site, footer })}`;
}

function buildNews() {
  const p = pages.news;
  const prefix = '';
  const cards = articles.map((a) => renderArticleCard(a, '')).join('\n');
  const main = `    <section class="page-hero page-hero--articles section-reveal">
      <p class="eyebrow">${esc(p.hero.eyebrow)}</p>
      <h1>${esc(p.hero.h1)}</h1>
      <p>${esc(p.hero.copy)}</p>
    </section>

    <section class="solutions section-reveal news-articles" aria-label="บทความและข่าวสาร">
      <div class="solutions-inner">
        <div class="section-heading section-reveal">
          <p class="eyebrow">บทความแนะนำ</p>
          <h2>อ่านก่อนตัดสินใจเลือกแผนประกัน</h2>
        </div>
        <div class="article-grid-block" data-article-grid>
          <div class="article-grid-controls" aria-label="ค้นหาและกรองบทความ">
            <div class="carousel-filterbar article-grid-filterbar">
              <label class="carousel-search">
                <span class="sr-only">ค้นหาบทความ</span>
                <input type="search" data-article-grid-search placeholder="ค้นหาบทความ..." autocomplete="off">
              </label>
              <label class="carousel-filter">
                <span class="sr-only">กรองหมวดบทความ</span>
                <select data-article-grid-filter>
                  <option value="all">ทุกหมวด</option>
                  <option value="life">ประกันชีวิต</option>
                  <option value="health">สุขภาพ</option>
                  <option value="savings">ออมทรัพย์ / ภาษี</option>
                  <option value="guide">คำแนะนำ</option>
                </select>
              </label>
              <button class="carousel-clear" type="button" data-article-grid-clear>ล้างการค้นหา</button>
            </div>
          </div>
          <div class="article-grid">
${cards}
          </div>
          <p class="carousel-empty" data-article-grid-empty hidden>ไม่พบบทความที่ตรงกับคำค้นหา</p>
        </div>
      </div>
    </section>

    <section class="cta-band section-reveal">
      <div class="cta-band-inner">
        <div class="cta-band-copy">
          <p class="eyebrow">Talk to us</p>
          <div class="cta-band-title-wrap">
            <h2>มีคำถามหลังอ่านบทความ?</h2>
          </div>
          <p>ทีมงานพร้อมช่วยอธิบายและจัดลำดับความสำคัญก่อนเลือกแผน</p>
          <a class="button primary" href="contact.html">ปรึกษาฟรี</a>
        </div>
      </div>
    </section>`;
  write('news.html', pageShell({ file: 'news.html', current: 'news', title: p.title, description: p.metaDescription, ogImage: 'assets/logo/logo.png', main }));
}

function buildCareersListing() {
  const p = pages.careers;
  const cards = careers.map((c) => renderCareerCard(c, '')).join('\n');
  const heroImg = p.hero?.imageSrc || 'assets/career/career-hero.png';
  const main = `    <section class="career-hero section-reveal">
      <div class="career-hero-inner">
        <div class="career-hero-copy">
          <h1>${esc(p.hero?.h1 || 'แนะนำอาชีพตัวแทนไทยประกันชีวิต')}</h1>
          <p>${esc(p.hero?.copy || '')}</p>
          <a class="button primary" href="contact.html">สนใจร่วมงาน ติดต่อเรา</a>
        </div>
        <figure class="career-hero-media">
          <img src="${esc(heroImg)}" alt="${esc(p.hero?.h1 || 'แนะนำอาชีพ')}" width="1200" height="630" loading="eager" decoding="async">
        </figure>
      </div>
    </section>

    <section class="careers-list section-reveal" aria-label="แนะนำอาชีพตัวแทนไทยประกันชีวิต">
      <div class="careers-list-inner">
        <div class="section-heading section-reveal">
          <h2>แนะนำอาชีพตัวแทนไทยประกันชีวิต</h2>
        </div>
        <div class="career-grid">
${cards}
        </div>
      </div>
    </section>`;
  write('careers.html', pageShell({ file: 'careers.html', current: 'careers', title: p.title || 'แนะนำอาชีพ | Wealth Life Insure', description: p.metaDescription || site.metaDescription, ogImage: 'assets/career/career-hero.png', main }));
}

function buildArticle(article) {
  const prefix = '../';
  const og = article.imageSrc;
  const main = `    <section class="page-hero page-hero--article section-reveal">
      <p class="eyebrow">${esc(article.eyebrow)}</p>
      <h1>${esc(article.h1)}</h1>
      <p class="article-hero-lead">${esc(article.lead)}</p>
    </section>

    <div class="article-layout">
      <article class="article-main section-reveal">
        <figure class="article-featured">
          <img src="${prefix}${esc(article.imageSrc)}" alt="${esc(article.h1)}" width="960" height="540" loading="eager" decoding="async">
        </figure>
        <div class="article-body">
${article.bodyHtml}
        </div>
        <p class="article-cta">
          <a class="button primary" href="${prefix}contact.html">ปรึกษาฟรีกับทีมงาน</a>
          <a class="button secondary" href="${prefix}news.html">กลับหน้าบทความ</a>
        </p>
      </article>
${renderArticleSidebar(articles, article.slug, prefix)}
    </div>`;
  write(
    `articles/${article.slug}.html`,
    pageShell({
      file: `articles/${article.slug}.html`,
      current: 'news',
      title: `${article.h1} | ${site.name}`,
      description: article.metaDescription,
      ogImage: og,
      main,
    })
  );
}

function buildCareer(career) {
  const prefix = '../';
  const main = `    <section class="page-hero page-hero--article section-reveal">
      <p class="eyebrow">${esc(career.eyebrow || 'แนะนำอาชีพ')}</p>
      <h1>${esc(career.h1)}</h1>
      <p class="article-hero-lead">${esc(career.lead)}</p>
    </section>

    <div class="article-layout">
      <article class="article-main section-reveal">
        <figure class="article-featured">
          <img src="${prefix}${esc(career.imageSrc)}" alt="${esc(career.h1)}" width="960" height="540" loading="eager" decoding="async">
        </figure>
        <div class="article-body">
${career.bodyHtml}
        </div>
      </article>
${renderRelatedCareers(careers, career.slug, prefix)}
    </div>`;
  write(
    `careers/${career.slug}.html`,
    pageShell({
      file: `careers/${career.slug}.html`,
      current: 'careers',
      title: `${career.h1} | ${site.name}`,
      description: career.metaDescription,
      ogImage: career.imageSrc,
      main,
    })
  );
}

function patchIndexHero() {
  const file = path.join(rootDir, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const h = pages.home.hero;
  const spans = h.h1Spans.map((s) => `          <span>${esc(s)}</span>`).join('\n');
  const slides = h.slides
    .map(
      (s, i) => `        <figure class="hero-slide${s.active || i === 0 ? ' is-active' : ''}" data-hero-slide data-hero-ratio="${esc(s.ratio)}">
          <img src="${esc(s.src)}" alt="${esc(s.alt)}" width="${esc(s.width)}" height="${esc(s.height)}"${i === 0 ? ' decoding="async"' : ' loading="lazy" decoding="async"'}>
        </figure>`
    )
    .join('\n');

  html = html.replace(
    /<div class="hero-content">[\s\S]*?<\/div>\s*<div class="hero-slides">[\s\S]*?<\/div>/,
    `<div class="hero-content">
        <p class="eyebrow">${esc(h.eyebrow)}</p>
        <h1>
${spans}
        </h1>
        <p class="hero-copy">${esc(h.copy)}</p>
      </div>
      <div class="hero-slides">
${slides}
      </div>`
  );
  fs.writeFileSync(file, html, 'utf8');
  console.log('patched index.html hero');
}

function patchContact() {
  const file = path.join(rootDir, 'contact.html');
  let html = fs.readFileSync(file, 'utf8');
  const p = pages.contact;
  const chips = p.chips
    .map((c) => {
      const cls = c.variant === 'line' ? 'contact-chip contact-chip--line' : c.variant === 'facebook' ? 'contact-chip contact-chip--facebook' : 'contact-chip';
      const rel = c.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `          <a class="${cls}" href="${esc(c.href)}"${rel} role="listitem">
            <span class="contact-chip-icon" aria-hidden="true">
              ${chipIcon(c.variant)}
            </span>
            <span class="contact-chip-text">
              <span class="contact-chip-title">${esc(c.title)}</span>
              <span class="contact-chip-meta">${esc(c.meta)}</span>
            </span>
          </a>`;
    })
    .join('\n');
  const copyBlock = `      <div class="contact-copy">
        <p class="eyebrow">${esc(p.hero.eyebrow)}</p>
        <h1>${esc(p.hero.h1)}</h1>
        <p>${esc(p.hero.copy)}</p>
        <div class="contact-links" role="list">
${chips}
        </div>
      </div>`;
  html = html.replace(/<div class="contact-copy">[\s\S]*?<\/div>\s*(?=\s*<form class="contact-form")/, `${copyBlock}\n\n`);
  fs.writeFileSync(file, html, 'utf8');
  console.log('patched contact.html');
}

function chipIcon(variant) {
  if (variant === 'line') {
    return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7H8.5l-3.4 2.5a.5.5 0 01-.8-.4v-2.1a8.5 8.5 0 01-2-5.5 8.38 8.38 0 013.3-6.7 8.5 8.5 0 0111.4 1.1 8.38 8.38 0 011.5 5.5z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
                <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>`;
  }
  if (variant === 'facebook') {
    return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
              </svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.86.3 1.7.54 2.5a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.58-1.11a2 2 0 012.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
              </svg>`;
}

function syncPromosInFile(file) {
  const prefix = prefixFor(file);
  const full = path.join(rootDir, file);
  if (!fs.existsSync(full)) return;
  let html = fs.readFileSync(full, 'utf8');
  if (!html.includes('promo-duo')) return;
  html = html.replace(/<section class="promo-duo[\s\S]*?<\/section>/, renderPromo({ prefix, promos }).trim());
  fs.writeFileSync(full, html, 'utf8');
}

buildNews();
buildCareersListing();
articles.forEach(buildArticle);
careers.forEach(buildCareer);
patchIndexHero();
patchContact();
applyContentPatches(data, rootDir);

const allHtml = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name === 'admin' || name === '.git' || name === 'node_modules') continue;
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.html')) allHtml.push(path.relative(rootDir, full).replace(/\\/g, '/'));
  }
}
walk(rootDir);
allHtml.forEach((f) => syncPromosInFile(f));

console.log('Build complete.');
