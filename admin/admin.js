const API = 'api';
let content = null;
let editingArticle = null;
let editingCareer = null;

const $ = (sel) => document.querySelector(sel);

function show(el, visible) {
  if (!el) return;
  el.hidden = !visible;
}

function setStatus(msg, isError = false) {
  show($('#status-msg'), !isError && !!msg);
  show($('#status-err'), isError && !!msg);
  if (!isError) $('#status-msg').textContent = msg || '';
  else $('#status-err').textContent = msg || '';
}

async function api(path, options = {}) {
  const res = await fetch(`${API}/${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
  return data;
}

function field(label, id, value = '', type = 'text', rows) {
  if (type === 'textarea') {
    return `<div class="admin-field"><label for="${id}">${label}</label><textarea id="${id}" data-key="${id}">${value}</textarea></div>`;
  }
  return `<div class="admin-field"><label for="${id}">${label}</label><input id="${id}" data-key="${id}" type="${type}" value="${escapeAttr(value)}"></div>`;
}

function escapeAttr(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function readFields(container) {
  const out = {};
  container.querySelectorAll('[data-key]').forEach((el) => {
    out[el.dataset.key] = el.value;
  });
  return out;
}

function renderHome() {
  const h = content.pages.home.hero;
  $('#home-fields').innerHTML = [
    field('ข้อความเล็ก (eyebrow)', 'home-eyebrow', h.eyebrow),
    field('หัวข้อบรรทัด 1', 'home-h1-0', h.h1Spans[0] || ''),
    field('หัวข้อบรรทัด 2', 'home-h1-1', h.h1Spans[1] || ''),
    field('คำอธิบาย', 'home-copy', h.copy, 'textarea', 3),
  ].join('');
  renderSlides();
}

function renderSlides() {
  const slides = content.pages.home.hero.slides;
  $('#home-slides').innerHTML = slides
    .map(
      (slide, i) => `<div class="admin-slide" data-slide="${i}">
      <strong>สไลด์ ${i + 1}</strong>
      ${field('รูป (path)', `slide-src-${i}`, slide.src)}
      ${field('คำอธิบายรูป', `slide-alt-${i}`, slide.alt)}
      ${field('อัตราส่วน (เช่น 1922 / 818)', `slide-ratio-${i}`, slide.ratio)}
      <button type="button" class="admin-btn admin-btn--ghost" data-remove-slide="${i}">ลบสไลด์</button>
    </div>`
    )
    .join('');
  $('#home-slides').querySelectorAll('[data-remove-slide]').forEach((btn) => {
    btn.addEventListener('click', () => {
      content.pages.home.hero.slides.splice(Number(btn.dataset.removeSlide), 1);
      renderSlides();
    });
  });
}

function renderNewsPage() {
  const p = content.pages.news;
  $('#news-page-fields').innerHTML = [
    field('หัวข้อหน้า', 'news-h1', p.hero.h1),
    field('คำอธิบาย', 'news-copy', p.hero.copy, 'textarea', 2),
  ].join('');
  renderArticleList();
}

function renderArticleList() {
  $('#article-list').innerHTML = content.articles
    .map(
      (a, i) => `<div class="admin-list-item">
      <div><strong>${escapeAttr(a.title)}</strong><br><span class="admin-muted">${a.slug}</span></div>
      <button type="button" class="admin-btn admin-btn--ghost" data-edit-article="${i}">แก้ไข</button>
    </div>`
    )
    .join('');
  $('#article-list').querySelectorAll('[data-edit-article]').forEach((btn) => {
    btn.addEventListener('click', () => openArticle(Number(btn.dataset.editArticle)));
  });
}

function openArticle(index) {
  editingArticle = index;
  const a = content.articles[index];
  $('#article-editor-title').textContent = `แก้ไข: ${a.title}`;
  $('#article-fields').innerHTML = [
    field('slug (ไม่ควรเปลี่ยนถ้าเผยแพร่แล้ว)', 'art-slug', a.slug),
    field('หมวด (life/health/savings/guide)', 'art-category', a.category),
    field('หัวข้อการ์ด', 'art-title', a.title),
    field('คำโปรย', 'art-excerpt', a.excerpt, 'textarea', 2),
    field('รูปปก (path)', 'art-image', a.imageSrc),
    field('หมวด hero', 'art-eyebrow', a.eyebrow),
    field('หัวข้อบทความ', 'art-h1', a.h1),
    field('คำนำ', 'art-lead', a.lead, 'textarea', 2),
    field('Meta description', 'art-meta', a.metaDescription, 'textarea', 2),
    field('เนื้อหา (HTML)', 'art-body', a.bodyHtml, 'textarea', 12),
  ].join('');
  show($('#article-editor'), true);
}

function renderCareersPage() {
  const p = content.pages.careers;
  $('#careers-page-fields').innerHTML = [
    field('หัวข้อ Hero', 'careers-h1', p.hero.h1),
    field('คำอธิบาย Hero', 'careers-copy', p.hero.copy, 'textarea', 3),
    field('รูป Hero', 'careers-image', p.hero.imageSrc || 'assets/career/career-hero.png'),
  ].join('');
  renderCareerList();
}

function renderCareerList() {
  $('#career-list').innerHTML = content.careers
    .map(
      (c, i) => `<div class="admin-list-item">
      <div><strong>${escapeAttr(c.title)}</strong><br><span class="admin-muted">${c.slug}</span></div>
      <button type="button" class="admin-btn admin-btn--ghost" data-edit-career="${i}">แก้ไข</button>
    </div>`
    )
    .join('');
  $('#career-list').querySelectorAll('[data-edit-career]').forEach((btn) => {
    btn.addEventListener('click', () => openCareer(Number(btn.dataset.editCareer)));
  });
}

function openCareer(index) {
  editingCareer = index;
  const c = content.careers[index];
  $('#career-editor-title').textContent = `แก้ไข: ${c.title}`;
  $('#career-fields').innerHTML = [
    field('slug', 'car-slug', c.slug),
    field('หัวข้อการ์ด', 'car-title', c.title),
    field('คำโปรย', 'car-excerpt', c.excerpt, 'textarea', 2),
    field('รูปปก', 'car-image', c.imageSrc),
    field('หัวข้อหน้า', 'car-h1', c.h1),
    field('คำนำ', 'car-lead', c.lead, 'textarea', 2),
    field('Meta description', 'car-meta', c.metaDescription, 'textarea', 2),
    field('เนื้อหา (HTML แยกย่อหน้า <p>)', 'car-body', c.bodyHtml, 'textarea', 10),
  ].join('');
  show($('#career-editor'), true);
}

function renderContact() {
  const p = content.pages.contact;
  $('#contact-page-fields').innerHTML = [
    field('ข้อความเล็ก (eyebrow)', 'contact-eyebrow', p.hero.eyebrow),
    field('หัวข้อ', 'contact-h1', p.hero.h1),
    field('คำอธิบาย', 'contact-copy', p.hero.copy, 'textarea', 3),
  ].join('');
  $('#contact-chips').innerHTML = p.chips
    .map(
      (c, i) => `<div class="admin-slide">
      <strong>ช่องทาง ${i + 1}</strong>
      ${field('ประเภท (default/line/facebook)', `chip-variant-${i}`, c.variant)}
      ${field('ลิงก์', `chip-href-${i}`, c.href)}
      ${field('ชื่อ', `chip-title-${i}`, c.title)}
      ${field('รายละเอียด', `chip-meta-${i}`, c.meta)}
    </div>`
    )
    .join('');
}

function renderPromos() {
  const j = content.promos.joinTeam;
  const i = content.promos.insurance;
  $('#promo-fields').innerHTML = [
    '<h3>แบนเนอร์ซ้าย (ร่วมงาน)</h3>',
    field('ลิงก์', 'promo-j-href', j.href),
    field('รูป', 'promo-j-img', j.imageSrc),
    field('คำอธิบายรูป', 'promo-j-alt', j.alt),
    '<h3 style="margin-top:20px">แบนเนอร์ขวา (ทำประกัน)</h3>',
    field('ลิงก์', 'promo-i-href', i.href),
    field('รูป', 'promo-i-img', i.imageSrc),
    field('คำอธิบายรูป', 'promo-i-alt', i.alt),
  ].join('');
}

function collectAll() {
  collectExtraSections(content);

  const hf = readFields($('#home-fields'));
  const h = content.pages.home.hero;
  h.eyebrow = hf['home-eyebrow'];
  h.h1Spans = [hf['home-h1-0'], hf['home-h1-1']];
  h.copy = hf['home-copy'];
  h.slides = h.slides.map((slide, i) => ({
    ...slide,
    src: $(`#slide-src-${i}`)?.value || slide.src,
    alt: $(`#slide-alt-${i}`)?.value || slide.alt,
    ratio: $(`#slide-ratio-${i}`)?.value || slide.ratio,
    active: i === 0,
  }));

  const nf = readFields($('#news-page-fields'));
  content.pages.news.hero.h1 = nf['news-h1'];
  content.pages.news.hero.copy = nf['news-copy'];

  if (editingArticle !== null) {
    const a = content.articles[editingArticle];
    const af = readFields($('#article-fields'));
    a.slug = af['art-slug'];
    a.category = af['art-category'];
    a.title = af['art-title'];
    a.excerpt = af['art-excerpt'];
    a.imageSrc = af['art-image'];
    a.eyebrow = af['art-eyebrow'];
    a.h1 = af['art-h1'];
    a.lead = af['art-lead'];
    a.metaDescription = af['art-meta'];
    a.bodyHtml = af['art-body'];
    a.href = `articles/${a.slug}.html`;
  }

  const cf = readFields($('#careers-page-fields'));
  content.pages.careers.hero.h1 = cf['careers-h1'];
  content.pages.careers.hero.copy = cf['careers-copy'];
  content.pages.careers.hero.imageSrc = cf['careers-image'];

  if (editingCareer !== null) {
    const c = content.careers[editingCareer];
    const cf2 = readFields($('#career-fields'));
    c.slug = cf2['car-slug'];
    c.title = cf2['car-title'];
    c.excerpt = cf2['car-excerpt'];
    c.imageSrc = cf2['car-image'];
    c.h1 = cf2['car-h1'];
    c.lead = cf2['car-lead'];
    c.metaDescription = cf2['car-meta'];
    c.bodyHtml = cf2['car-body'];
    c.href = `careers/${c.slug}.html`;
  }

  const pf = readFields($('#contact-page-fields'));
  content.pages.contact.hero.eyebrow = pf['contact-eyebrow'];
  content.pages.contact.hero.h1 = pf['contact-h1'];
  content.pages.contact.hero.copy = pf['contact-copy'];
  content.pages.contact.chips = content.pages.contact.chips.map((chip, i) => ({
    ...chip,
    variant: $(`#chip-variant-${i}`)?.value || chip.variant,
    href: $(`#chip-href-${i}`)?.value || chip.href,
    title: $(`#chip-title-${i}`)?.value || chip.title,
    meta: $(`#chip-meta-${i}`)?.value || chip.meta,
    external: ($(`#chip-href-${i}`)?.value || '').startsWith('http'),
  }));

  content.promos.joinTeam.href = $('#promo-j-href').value;
  content.promos.joinTeam.imageSrc = $('#promo-j-img').value;
  content.promos.joinTeam.alt = $('#promo-j-alt').value;
  content.promos.insurance.href = $('#promo-i-href').value;
  content.promos.insurance.imageSrc = $('#promo-i-img').value;
  content.promos.insurance.alt = $('#promo-i-alt').value;

  content.articles.forEach(syncArticleCard);
  content.careers.forEach(syncCareerCard);
  content.pages.news.cards = content.articles.map(cardFromArticle);
  content.pages.careers.cards = content.careers.map(cardFromCareer);
}

function syncArticleCard(a) {
  a.title = a.title;
  a.excerpt = a.excerpt;
  a.imageSrc = a.imageSrc;
  a.category = a.category;
  a.href = `articles/${a.slug}.html`;
}

function cardFromArticle(a) {
  return { slug: a.slug, category: a.category, title: a.title, excerpt: a.excerpt, href: a.href, imageSrc: a.imageSrc };
}

function cardFromCareer(c) {
  return { slug: c.slug, title: c.title, excerpt: c.excerpt, href: c.href, imageSrc: c.imageSrc };
}

function syncCareerCard(c) {
  c.href = `careers/${c.slug}.html`;
}

function renderAll() {
  renderHome();
  renderNewsPage();
  renderCareersPage();
  renderContact();
  renderPromos();
  renderExtraSections(content);
  $('#updated-label').textContent = content.updatedAt ? `อัปเดตล่าสุด: ${new Date(content.updatedAt).toLocaleString('th-TH')}` : '';
}

async function loadContent() {
  const res = await api('content.php');
  content = res.data;
  renderAll();
}

async function saveAndBuild() {
  setStatus('กำลังบันทึก...');
  collectAll();
  await api('content.php', { method: 'POST', body: JSON.stringify({ data: content }) });
  setStatus('กำลังสร้างหน้าเว็บ...');
  const build = await api('build.php', { method: 'POST' });
  show($('#build-log'), true);
  $('#build-log').textContent = build.output || 'สำเร็จ';
  setStatus('บันทึกและอัปเดตเว็บไซต์เรียบร้อย');
  await loadContent();
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  show($('#login-error'), false);
  try {
    await api('login.php', {
      method: 'POST',
      body: JSON.stringify({
        username: $('#login-user').value,
        password: $('#login-pass').value,
      }),
    });
    show($('#login-view'), false);
    show($('#app-view'), true);
    await loadContent();
  } catch (err) {
    $('#login-error').textContent = err.message;
    show($('#login-error'), true);
  }
});

$('#logout-btn').addEventListener('click', async () => {
  await api('logout.php', { method: 'POST' });
  show($('#app-view'), false);
  show($('#login-view'), true);
});

$('#save-build-btn').addEventListener('click', () => {
  saveAndBuild().catch((err) => setStatus(err.message, true));
});

$('#add-slide-btn').addEventListener('click', () => {
  content.pages.home.hero.slides.push({
    src: 'assets/cover/cover1.png',
    alt: '',
    width: '1200',
    height: '630',
    ratio: '1200 / 630',
    active: false,
  });
  renderSlides();
});

$('#add-footer-nav-link')?.addEventListener('click', () => {
  ensureFooter(content);
  content.footer.mainNav.links.push({ label: 'ลิงก์ใหม่', href: 'index.html' });
  renderExtraSections(content);
});

$('#add-footer-product-link')?.addEventListener('click', () => {
  ensureFooter(content);
  content.footer.productsNav.links.push({ label: 'ลิงก์ใหม่', href: 'insurance.html' });
  renderExtraSections(content);
});

$('#admin-nav').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-section]');
  if (!btn) return;
  $('#admin-nav').querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  document.querySelectorAll('.admin-section').forEach((sec) => sec.classList.remove('is-active'));
  $(`#section-${btn.dataset.section}`).classList.add('is-active');
});

(async function init() {
  try {
    const session = await api('session.php');
    if (session.loggedIn) {
      show($('#login-view'), false);
      show($('#app-view'), true);
      await loadContent();
    }
  } catch {
    /* ใช้หน้า login */
  }
})();
