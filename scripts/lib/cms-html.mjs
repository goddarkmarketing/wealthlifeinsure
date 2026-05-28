const SITE_URL = 'https://www.wealthlifeinsure.com';

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function prefixFor(filePath) {
  const depth = filePath.replace(/\\/g, '/').split('/').length - 1;
  return depth > 0 ? '../'.repeat(depth) : '';
}

const NAV = [
  { id: 'home', href: 'index.html', label: 'หน้าหลัก' },
  { id: 'about', href: 'about.html', label: 'เกี่ยวกับเรา' },
  { id: 'insurance', href: 'insurance.html', label: 'แบบประกัน' },
  { id: 'news', href: 'news.html', label: 'ข่าวสารและบทความ' },
  { id: 'careers', href: 'careers.html', label: 'แนะนำอาชีพ' },
  { id: 'contact', href: 'contact.html', label: 'ปรึกษาฟรี', cta: true },
];

export function renderHead({ title, description, ogImage, prefix }) {
  const og = ogImage?.startsWith('http') ? ogImage : `${SITE_URL}/${ogImage?.replace(/^\//, '') || 'assets/logo/logo.png'}`;
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${esc(description)}">
  <meta property="og:image" content="${esc(og)}">
  <meta name="twitter:image" content="${esc(og)}">
  <title>${esc(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${prefix}styles.css">
  <link rel="icon" type="image/png" href="${prefix}assets/logo/logo.png">
  <link rel="apple-touch-icon" href="${prefix}assets/logo/logo.png">
</head>`;
}

export function renderHeader({ prefix, current, site, header }) {
  const brand = header?.brandName || site?.name || 'Wealth Life Insure';
  const links = NAV.map((item) => {
    const href = `${prefix}${item.href}`;
    const currentAttr = current === item.id ? ' aria-current="page"' : '';
    if (item.cta) {
      return `      <a class="nav-cta" href="${href}"${currentAttr}>${esc(item.label)}</a>`;
    }
    return `      <a href="${href}"${currentAttr}>${esc(item.label)}</a>`;
  }).join('\n');

  return `  <header class="site-header">
    <a class="brand" href="${prefix}index.html" aria-label="${esc(brand)}">
      <img class="brand-logo" src="${prefix}assets/logo/logo.png" width="320" height="110" decoding="async" alt="">
      <span class="brand-name" translate="no">${esc(brand)}</span>
    </a>
    <button class="nav-toggle" type="button" aria-label="เปิดเมนู" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="site-nav" aria-label="เมนูหลัก">
${links}
    </nav>
  </header>`;
}

export function renderFooterBlock({ prefix, site, footer }) {
  const b = footer?.brandCol;
  const tam = site.phones?.tam;
  const a = site.phones?.a;
  const brandSlug = b?.brandSlug ?? site.brandSlug;
  const desc = b?.desc ?? site.tagline;
  const tamLabel = b?.phoneTamLabel ?? tam?.label ?? 'แต้ม';
  const tamDisplay = b?.phoneTamDisplay ?? tam?.display;
  const tamTel = b?.phoneTamTel ?? tam?.tel;
  const aLabel = b?.phoneALabel ?? a?.label ?? 'เอ';
  const aDisplay = b?.phoneADisplay ?? a?.display;
  const aTel = b?.phoneATel ?? a?.tel;
  const hours = b?.hours ?? site.hours;
  const mainNav = footer?.mainNav;
  const productsNav = footer?.productsNav;
  const info = footer?.infoCol;
  const legal = footer?.legal;
  const mainLinks = (mainNav?.links?.length ? mainNav.links : [
    { href: 'index.html', label: 'หน้าแรก' },
    { href: 'insurance.html', label: 'แบบประกัน' },
    { href: 'about.html', label: 'เกี่ยวกับเรา' },
    { href: 'news.html', label: 'ข่าวสารและบทความ' },
    { href: 'careers.html', label: 'แนะนำอาชีพ' },
    { href: 'contact.html', label: 'ติดต่อเรา' },
  ])
    .map((l) => `<li><a href="${prefix}${esc(l.href.replace(/^\//, ''))}">${esc(l.label)}</a></li>`)
    .join('\n            ');
  const productLinks = (productsNav?.links?.length ? productsNav.links : [
    { href: 'health-insurance.html', label: 'ประกันสุขภาพ' },
    { href: 'life-insurance.html', label: 'ประกันชีวิต' },
    { href: 'savings-retirement.html', label: 'ออมทรัพย์และบำนาญ' },
  ])
    .map((l) => `<li><a href="${prefix}${esc(l.href.replace(/^\//, ''))}">${esc(l.label)}</a></li>`)
    .join('\n            ');
  return `  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-grid">
        <div class="footer-brand-col">
          <a class="footer-brand" href="${prefix}index.html" aria-label="${esc(site.name)} หน้าแรก">
            <img class="footer-brand-logo" src="${prefix}assets/logo/logo.png" width="280" height="96" decoding="async" alt="">
            <span class="footer-brand-name" translate="no">${esc(brandSlug)}</span>
          </a>
          <p class="footer-desc">${esc(desc)}</p>
          <ul class="footer-meta">
            <li><span class="footer-meta-label">โทร ${esc(tamLabel)}</span> <a href="tel:${esc(tamTel)}">${esc(tamDisplay)}</a></li>
            <li><span class="footer-meta-label">โทร ${esc(aLabel)}</span> <a href="tel:${esc(aTel)}">${esc(aDisplay)}</a></li>
            <li><span class="footer-meta-label">เวลาทำการ</span> ${esc(hours)}</li>
          </ul>
        </div>
        <nav class="footer-col" aria-labelledby="footer-nav-label">
          <h2 id="footer-nav-label" class="footer-col-title">${esc(mainNav?.title || 'เมนูหลัก')}</h2>
          <ul class="footer-links">
            ${mainLinks}
          </ul>
        </nav>
        <nav class="footer-col" aria-labelledby="footer-products-label">
          <h2 id="footer-products-label" class="footer-col-title">${esc(productsNav?.title || 'หมวดประกัน')}</h2>
          <ul class="footer-links">
            ${productLinks}
          </ul>
        </nav>
        <div class="footer-col footer-info-col">
          <h2 class="footer-col-title">${esc(info?.title || 'ข้อมูลเพิ่มเติม')}</h2>
          <ul class="footer-info-list">
            <li><span class="footer-info-label">สำนักงาน</span> ${esc(info?.office ?? site.office)}</li>
            <li><span class="footer-info-label">ใบอนุญาต</span> ${esc(info?.licenses ?? site.licenses)}</li>
          </ul>
          <p class="footer-info-note">${esc(info?.note ?? site.footerNote)}</p>
        </div>
      </div>
      <div class="footer-base">
        <p class="footer-copy">${esc(legal?.copyright ?? site.copyright)}</p>
        <a class="footer-legal-link" href="${prefix}contact.html#privacy">${esc(legal?.privacyLabel || 'Privacy Policy')}</a>
        <a class="footer-legal-link footer-legal-link--end" href="${prefix}contact.html#terms">${esc(legal?.termsLabel || 'Terms of Service')}</a>
      </div>
    </div>
  </footer>`;
}

export function renderFooter({ prefix, site, footer }) {
  return `${renderFooterBlock({ prefix, site, footer })}
  <script src="${prefix}script.js"></script>
</body>
</html>`;
}

export function renderPromo({ prefix, promos }) {
  const j = promos.joinTeam;
  const i = promos.insurance;
  const jHref = j.href.startsWith('http') ? j.href : `${prefix}${j.href}`;
  const iHref = i.href.startsWith('http') ? i.href : `${prefix}${i.href}`;
  return `    <section class="promo-duo section-reveal" aria-label="ลิงก์ด่วน">
      <div class="promo-duo-inner">
        <a class="promo-duo-card" href="${esc(jHref)}">
          <img src="${prefix}${esc(j.imageSrc.replace(/^\//, ''))}" width="${esc(j.width || '1200')}" height="${esc(j.height || '630')}" loading="lazy" decoding="async" alt="${esc(j.alt)}">
        </a>
        <a class="promo-duo-card" href="${esc(iHref)}">
          <img src="${prefix}${esc(i.imageSrc.replace(/^\//, ''))}" width="${esc(i.width || '1200')}" height="${esc(i.height || '630')}" loading="lazy" decoding="async" alt="${esc(i.alt)}">
        </a>
      </div>
    </section>`;
}

export function renderArticleCard(article, prefix) {
  const href = `${prefix}${article.href}`;
  const img = `${prefix}${article.imageSrc}`;
  return `              <article class="solution-item section-reveal" data-category="${esc(article.category)}">
                <a class="solution-media" href="${esc(href)}" aria-label="อ่านบทความ ${esc(article.title)}">
                  <img src="${esc(img)}" alt="${esc(article.title)}" width="800" height="500" loading="lazy" decoding="async">
                </a>
                <div>
                  <h3><a href="${esc(href)}">${esc(article.title)}</a></h3>
                  <p>${esc(article.excerpt)}</p>
                </div>
              </article>`;
}

export function renderCareerCard(career, prefix) {
  const href = `${prefix}${career.href}`;
  const img = `${prefix}${career.imageSrc}`;
  return `            <article class="career-card section-reveal">
              <a class="career-card-media" href="${esc(href)}" aria-label="อ่าน ${esc(career.title)}">
                <img src="${esc(img)}" alt="${esc(career.title)}" width="640" height="360" loading="lazy" decoding="async">
              </a>
              <div class="career-card-body">
                <h3><a href="${esc(href)}">${esc(career.title)}</a></h3>
                <p>${esc(career.excerpt)}</p>
                <a class="career-card-link" href="${esc(href)}">รายละเอียด &gt;&gt;</a>
              </div>
            </article>`;
}

export function renderArticleSidebar(articles, currentSlug, prefix) {
  const picks = articles.filter((a) => a.slug !== currentSlug).slice(0, 6);
  const items = picks
    .map(
      (a) => `            <li>
              <a class="article-sidebar-link" href="${esc(a.slug)}.html">
                <img src="${prefix}${esc(a.imageSrc)}" alt="" width="120" height="75" loading="lazy" decoding="async">
                <span>${esc(a.title)}</span>
              </a>
            </li>`
    )
    .join('\n');
  return `        <aside class="article-sidebar section-reveal" aria-label="บทความแนะนำ">
          <h2>บทความแนะนำ</h2>
          <ul class="article-sidebar-list">
${items}
          </ul>
          <a class="text-link article-sidebar-all" href="${prefix}news.html">ดูบทความทั้งหมด</a>
        </aside>`;
}

export function renderRelatedCareers(careers, currentSlug, prefix) {
  const picks = careers.filter((c) => c.slug !== currentSlug).slice(0, 3);
  const cards = picks.map((c) => renderCareerCard(c, '')).join('\n');
  return `      <section class="article-related-careers section-reveal" aria-label="แนะนำอาชีพอื่น ๆ">
        <h2>อ่านเรื่องอื่น ๆ</h2>
        <div class="career-grid career-grid--related">
${cards}
        </div>
        <p class="article-related-all"><a class="text-link" href="${prefix}careers.html">ดูทั้งหมด 9 เรื่อง</a></p>
      </section>`;
}
