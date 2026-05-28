import fs from 'fs';
import path from 'path';
import { esc, prefixFor, renderFooterBlock } from './lib/cms-html.mjs';

function readFile(root, file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function writeFile(root, file, html) {
  const full = path.join(root, file);
  fs.writeFileSync(full, html, 'utf8');
  console.log('patched', file);
}

function replaceFooter(html, prefix, site, footer) {
  const block = renderFooterBlock({ prefix, site, footer });
  return html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, block.trim());
}

function patchHeader(html, header, site) {
  const brand = header?.brandName || site.name;
  return html.replace(
    /<span class="brand-name" translate="no">[\s\S]*?<\/span>/,
    `<span class="brand-name" translate="no">${esc(brand)}</span>`
  );
}

function patchSectionHeading(html, selector, { eyebrow, h2, lead }) {
  if (!html.includes(selector)) return html;
  const inner = `<div class="section-heading section-reveal">
          ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
          <h2>${esc(h2)}</h2>
          ${lead ? `<p class="home-articles-lead">${esc(lead)}</p>` : ''}
        </div>`;
  const re = new RegExp(
    `(${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?)<div class="section-heading section-reveal">[\\s\\S]*?<\\/div>`
  );
  return html.replace(re, `$1${inner}`);
}

function patchIndex(data, root) {
  const file = 'index.html';
  let html = readFile(root, file);
  const h = data.pages.home;

  html = patchHeader(html, data.header, data.site);
  html = replaceFooter(html, '', data.site, data.footer);

  const meta = h.metaDescription || data.site.metaDescription;
  if (meta) {
    html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(meta)}"`);
  }
  if (h.title) html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(h.title)}</title>`);

  html = patchSectionHeading(html, 'aria-label="แผนประกันแนะนำ"', h.solutionsHeading || {});

  if (h.productCategories?.h2) {
    html = html.replace(
      /<header class="product-categories-head">\s*<h2>[\s\S]*?<\/h2>/,
      `<header class="product-categories-head">\n            <h2>${esc(h.productCategories.h2)}</h2>`
    );
  }
  if (h.productCategories?.chips?.length) {
    const chips = h.productCategories.chips
      .map(
        (c) => `            <a class="product-plan-chip" role="listitem" href="${esc(c.href)}" aria-label="ดูรายละเอียด ${esc(c.label)}">
              <span class="product-plan-chip-icon" aria-hidden="true">
                <img src="${esc(c.image)}" alt="" loading="lazy" decoding="async">
              </span>
              <span class="product-plan-chip-label">${esc(c.label)}</span>
              <span class="product-plan-chip-arrow" aria-hidden="true">→</span>
            </a>`
      )
      .join('\n');
    html = html.replace(/<div class="product-plan-strip" role="list">[\s\S]*?<\/div>/, `<div class="product-plan-strip" role="list">\n${chips}\n          </div>`);
  }

  const intro = h.intro;
  if (intro) {
    const introBlock = /<section class="intro section-reveal"[\s\S]*?<\/section>/;
    if (intro.eyebrow) {
      html = html.replace(introBlock, (block) =>
        block.replace(/<p class="eyebrow">[\s\S]*?<\/p>/, `<p class="eyebrow">${esc(intro.eyebrow)}</p>`)
      );
    }
    if (intro.h2) {
      html = html.replace(introBlock, (block) =>
        block.replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${esc(intro.h2)}</h2>`)
      );
    }
    if (intro.lead) {
      html = html.replace(introBlock, (block) =>
        block.replace(/<p class="intro-lead">[\s\S]*?<\/p>/, `<p class="intro-lead">${esc(intro.lead)}</p>`)
      );
    }
    (intro.tags || []).forEach((t, i) => {
      if (!t.title) return;
      html = html.replace(introBlock, (block) => {
        const titles = [...block.matchAll(/<strong class="intro-tag-title">[\s\S]*?<\/strong>/g)];
        if (!titles[i]) return block;
        return block.replace(titles[i][0], `<strong class="intro-tag-title">${esc(t.title)}</strong>`);
      });
    });
    if (intro.imageSrc) {
      html = html.replace(introBlock, (block) =>
        block.replace(/<img[^>]*src="[^"]+"[^>]*>/, (img) =>
          img.replace(/src="[^"]+"/, `src="${esc(intro.imageSrc)}"`).replace(/alt="[^"]*"/, `alt="${esc(intro.imageAlt)}"`)
        )
      );
    }
  }

  const proc = h.process;
  if (proc) {
    const steps = (proc.steps || [])
      .map(
        (s) => `        <div class="step section-reveal">
          <span>${esc(s.num)}</span>
          <div>
            <strong>${esc(s.title)}</strong>
            <p>${esc(s.desc)}</p>
          </div>
        </div>`
      )
      .join('\n');
    html = html.replace(
      /<section class="process">[\s\S]*?<\/section>/,
      `<section class="process">
      <div class="process-panel section-reveal">
        <p class="eyebrow">${esc(proc.eyebrow)}</p>
        <h2>${esc(proc.h2)}</h2>
        <p class="process-copy">${esc(proc.copy)}</p>
        <a class="process-link" href="${esc(proc.linkHref || 'contact.html')}">${esc(proc.linkText)}</a>
      </div>
      <div class="process-steps">
${steps}
      </div>
    </section>`
    );
  }

  if (h.taxPlansHeading?.h2) {
    html = html.replace(
      /<section class="tax-plans" id="tax-plans">[\s\S]*?<div class="section-heading section-reveal">[\s\S]*?<\/div>/,
      (m) =>
        m.replace(
          /<div class="section-heading section-reveal">[\s\S]*?<\/div>/,
          `<div class="section-heading section-reveal">
          <p class="eyebrow">${esc(h.taxPlansHeading.eyebrow)}</p>
          <h2>${esc(h.taxPlansHeading.h2)}</h2>
        </div>`
        )
    );
    if (h.taxPlansHeading.sidebarLabel) {
      html = html.replace(
        /<aside class="tax-plan-sidebar"[\s\S]*?<p>[\s\S]*?<\/p>/,
        `<aside class="tax-plan-sidebar" aria-label="คำอธิบายแผนลดหย่อน">
          <p>${esc(h.taxPlansHeading.sidebarLabel)}</p>`
      );
    }
  }

  if (h.testimonials?.h2) {
    html = html.replace(
      /<section class="testimonials section-reveal"[\s\S]*?<div class="section-heading section-reveal">[\s\S]*?<\/div>/,
      (m) =>
        m.replace(
          /<div class="section-heading section-reveal">[\s\S]*?<\/div>/,
          `<div class="section-heading section-reveal">
          <p class="eyebrow">${esc(h.testimonials.eyebrow)}</p>
          <h2>${esc(h.testimonials.h2)}</h2>
        </div>`
        )
    );
  }

  const ha = h.homeArticles;
  if (ha?.h2) {
    html = html.replace(
      /<section class="solutions home-articles[\s\S]*?<div class="section-heading section-reveal">[\s\S]*?<\/div>/,
      (m) =>
        m.replace(
          /<div class="section-heading section-reveal">[\s\S]*?<\/div>/,
          `<div class="section-heading section-reveal">
          <p class="eyebrow">${esc(ha.eyebrow)}</p>
          <h2>${esc(ha.h2)}</h2>
          ${ha.lead ? `<p class="home-articles-lead">${esc(ha.lead)}</p>` : ''}
        </div>`
        )
    );
    if (ha.moreText) {
      html = html.replace(
        /<p class="home-articles-more">[\s\S]*?<\/p>/,
        `<p class="home-articles-more"><a class="text-link" href="${esc(ha.moreHref || 'news.html')}">${esc(ha.moreText)}</a></p>`
      );
    }
  }

  const hc = h.homeCareers;
  if (hc?.h2) {
    html = html.replace(
      /<section class="solutions home-careers[\s\S]*?<div class="section-heading section-reveal">[\s\S]*?<\/div>/,
      (m) =>
        m.replace(
          /<div class="section-heading section-reveal">[\s\S]*?<\/div>/,
          `<div class="section-heading section-reveal">
          <p class="eyebrow">${esc(hc.eyebrow)}</p>
          <h2>${esc(hc.h2)}</h2>
          ${hc.lead ? `<p class="home-articles-lead">${esc(hc.lead)}</p>` : ''}
        </div>`
        )
    );
    html = html.replace(
      /<section class="solutions home-careers[\s\S]*?home-articles-more[\s\S]*?<\/p>/,
      `<p class="home-articles-more"><a class="text-link" href="${esc(hc.moreHref || 'careers.html')}">${esc(hc.moreText)}</a></p>`
    );
  }

  const cta = h.ctaBand;
  if (cta?.h2) {
    html = html.replace(
      /<section class="cta-band section-reveal">[\s\S]*?<\/section>/,
      `<section class="cta-band section-reveal">
      <div class="cta-band-inner">
        <div class="cta-band-copy">
          <p class="eyebrow">${esc(cta.eyebrow)}</p>
          <div class="cta-band-title-wrap">
            <h2>${esc(cta.h2)}</h2>
          </div>
          <p>${esc(cta.copy)}</p>
          <a class="button primary" href="${esc(cta.buttonHref || 'contact.html')}">${esc(cta.buttonText)}</a>
        </div>
      </div>
    </section>`
    );
  }

  writeFile(root, file, html);
}

function patchAbout(data, root) {
  const file = 'about.html';
  if (!fs.existsSync(path.join(root, file))) return;
  let html = readFile(root, file);
  const p = data.pages.about;
  if (!p) return;

  html = patchHeader(html, data.header, data.site);
  html = replaceFooter(html, '', data.site, data.footer);
  if (p.metaDescription) {
    html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(p.metaDescription)}"`);
  }
  if (p.title) html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`);

  if (p.hero) {
    html = html.replace(
      /<div class="page-hero-intro">[\s\S]*?<\/div>/,
      `<div class="page-hero-intro">
        <p class="eyebrow">${esc(p.hero.eyebrow)}</p>
        <h1>${esc(p.hero.h1)}</h1>
        <p class="page-hero-lead">${esc(p.hero.lead)}</p>
      </div>`
    );
  }
  if (p.followup) {
    html = html.replace(/<p class="about-hero-followup">[\s\S]*?<\/p>/, `<p class="about-hero-followup">${esc(p.followup)}</p>`);
  }
  if (p.agent?.h2) {
    html = html.replace(
      /<div class="agent-profile-meta">[\s\S]*?<\/div>/,
      `<div class="agent-profile-meta">
            <p class="eyebrow">${esc(p.agent.eyebrow)}</p>
            <h2>${p.agent.h2}</h2>
          </div>`
    );
    if (p.agent.lead) {
      html = html.replace(/<p class="agent-intro-lead">[\s\S]*?<\/p>/, `<p class="agent-intro-lead">${esc(p.agent.lead)}</p>`);
    }
  }

  writeFile(root, file, html);
}

function patchInsurancePage(data, root, file, pageKey) {
  if (!fs.existsSync(path.join(root, file))) return;
  let html = readFile(root, file);
  const p = data.pages[pageKey];
  if (!p) return;

  html = patchHeader(html, data.header, data.site);
  html = replaceFooter(html, '', data.site, data.footer);
  if (p.metaDescription) {
    html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(p.metaDescription)}"`);
  }
  if (p.title) html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`);

  if (p.hero) {
    html = html.replace(
      /<section class="page-hero[^"]*"[^>]*>[\s\S]*?<\/section>/,
      `<section class="page-hero section-reveal">
      <p class="eyebrow">${esc(p.hero.eyebrow)}</p>
      <h1>${esc(p.hero.h1)}</h1>
      <p class="article-hero-lead">${esc(p.hero.copy)}</p>
    </section>`
    );
  }
  if (p.bodyHtml) {
    html = html.replace(/<div class="article-body">[\s\S]*?<\/div>/, `<div class="article-body">\n${p.bodyHtml}\n        </div>`);
  }
  writeFile(root, file, html);
}

function patchContactExtras(data, root) {
  const file = 'contact.html';
  let html = readFile(root, file);
  const legal = data.footer?.legal;
  const form = data.pages.contact?.form;

  html = patchHeader(html, data.header, data.site);
  html = replaceFooter(html, '', data.site, data.footer);

  if (form) {
    html = html.replace(/<span class="contact-form-label">ชื่อ-นามสกุล<\/span>/, `<span class="contact-form-label">${esc(form.nameLabel)}</span>`);
    html = html.replace(/name="name"([^>]*)placeholder="[^"]*"/, `name="name"$1placeholder="${esc(form.namePlaceholder)}"`);
    html = html.replace(/<span class="contact-form-label">เบอร์โทรศัพท์<\/span>/, `<span class="contact-form-label">${esc(form.phoneLabel)}</span>`);
    html = html.replace(
      /<span class="contact-form-label">วัตถุประสงค์การติดต่อ<\/span>/,
      `<span class="contact-form-label">${esc(form.interestLabel)}</span>`
    );
    html = html.replace(
      /<span class="contact-form-label">แบบประกันที่สนใจ<\/span>/,
      `<span class="contact-form-label">${esc(form.planLabel)}</span>`
    );
    html = html.replace(
      /<span class="contact-form-label">ข้อความเพิ่มเติม<\/span>/,
      `<span class="contact-form-label">${esc(form.messageLabel)}</span>`
    );
    html = html.replace(/name="message"([^>]*)placeholder="[^"]*"/, `name="message"$1placeholder="${esc(form.messagePlaceholder)}"`);
    html = html.replace(/<button class="button primary contact-submit"[^>]*>[\s\S]*?<\/button>/, `<button class="button primary contact-submit" type="submit">${esc(form.submitText)}</button>`);
    html = html.replace(/<p class="form-note">[\s\S]*?<\/p>/, `<p class="form-note">${esc(form.formNote)}</p>`);
  }

  if (legal) {
    html = html.replace(/<h2 id="privacy-title">[\s\S]*?<\/h2>/, `<h2 id="privacy-title">${esc(legal.privacyTitle)}</h2>`);
    html = html.replace(
      /<section id="privacy"[\s\S]*?<p>[\s\S]*?<\/p>/,
      (m) => m.replace(/<p>[\s\S]*?<\/p>/, `<p>${esc(legal.privacyBody)}</p>`)
    );
    html = html.replace(/<h2 id="terms-title">[\s\S]*?<\/h2>/, `<h2 id="terms-title">${esc(legal.termsTitle)}</h2>`);
    html = html.replace(
      /<section id="terms"[\s\S]*?<p>[\s\S]*?<\/p>/,
      (m) => m.replace(/<p>[\s\S]*?<\/p>/, `<p>${esc(legal.termsBody)}</p>`)
    );
  }

  writeFile(root, file, html);
}

export function applyContentPatches(data, rootDir) {
  patchIndex(data, rootDir);
  patchAbout(data, rootDir);
  patchInsurancePage(data, rootDir, 'insurance.html', 'insurance');
  patchInsurancePage(data, rootDir, 'life-insurance.html', 'lifeInsurance');
  patchInsurancePage(data, rootDir, 'health-insurance.html', 'healthInsurance');
  patchInsurancePage(data, rootDir, 'savings-retirement.html', 'savingsRetirement');
  patchContactExtras(data, rootDir);

  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        if (name === 'admin' || name === 'node_modules' || name === '.git') continue;
        walk(full);
      } else if (name.endsWith('.html')) {
        const rel = path.relative(rootDir, full).replace(/\\/g, '/');
        if (['index.html', 'about.html', 'contact.html', 'insurance.html', 'life-insurance.html', 'health-insurance.html', 'savings-retirement.html'].includes(rel)) {
          continue;
        }
        let html = fs.readFileSync(full, 'utf8');
        const prefix = prefixFor(rel);
        html = patchHeader(html, data.header, data.site);
        html = replaceFooter(html, prefix, data.site, data.footer);
        fs.writeFileSync(full, html, 'utf8');
      }
    }
  }
  walk(rootDir);
  console.log('synced header/footer on all other pages');
}
