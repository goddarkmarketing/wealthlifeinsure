/* eslint-disable no-unused-vars */
function ensureFooter(content) {
  if (!content.footer) content.footer = {};
  if (!content.footer.brandCol) content.footer.brandCol = {};
  if (!content.footer.mainNav) content.footer.mainNav = { title: 'เมนูหลัก', links: [] };
  if (!content.footer.productsNav) content.footer.productsNav = { title: 'หมวดประกัน', links: [] };
  if (!content.footer.infoCol) content.footer.infoCol = { title: 'ข้อมูลเพิ่มเติม' };
  if (!content.footer.legal) content.footer.legal = {};
  if (!content.header) content.header = { brandName: content.site?.name, logoPath: 'assets/logo/logo.png' };
  const hp = content.pages.home;
  if (!hp.solutionsHeading) hp.solutionsHeading = {};
  if (!hp.productCategories) hp.productCategories = { h2: '', chips: [] };
  if (!hp.intro) hp.intro = { tags: [] };
  if (!hp.process) hp.process = { steps: [] };
  if (!hp.taxPlansHeading) hp.taxPlansHeading = {};
  if (!hp.testimonials) hp.testimonials = {};
  if (!hp.homeArticles) hp.homeArticles = {};
  if (!hp.homeCareers) hp.homeCareers = {};
  if (!hp.ctaBand) hp.ctaBand = {};
  if (!content.pages.about) content.pages.about = { hero: {}, agent: {} };
  if (!content.pages.insurance) content.pages.insurance = { hero: {} };
  if (!content.pages.lifeInsurance) content.pages.lifeInsurance = { hero: {}, bodyHtml: '' };
  if (!content.pages.healthInsurance) content.pages.healthInsurance = { hero: {}, bodyHtml: '' };
  if (!content.pages.savingsRetirement) content.pages.savingsRetirement = { hero: {}, bodyHtml: '' };
  if (!content.pages.contact.form) content.pages.contact.form = {};
}

function linkEditor(links, idPrefix) {
  return links
    .map(
      (l, i) => `<div class="admin-slide">
      <strong>ลิงก์ ${i + 1}</strong>
      ${field('ข้อความ', `${idPrefix}-label-${i}`, l.label)}
      ${field('URL (เช่น about.html)', `${idPrefix}-href-${i}`, l.href)}
      <button type="button" class="admin-btn admin-btn--ghost" data-remove-link="${idPrefix}-${i}">ลบลิงก์</button>
    </div>`
    )
    .join('');
}

function readLinks(links, idPrefix) {
  return links.map((l, i) => ({
    label: document.getElementById(`${idPrefix}-label-${i}`)?.value || l.label,
    href: document.getElementById(`${idPrefix}-href-${i}`)?.value || l.href,
  }));
}

function headingFields(prefix, obj, withLead) {
  const rows = [
    field('ข้อความเล็ก (eyebrow)', `${prefix}-eyebrow`, obj.eyebrow || ''),
    field('หัวข้อ (h2)', `${prefix}-h2`, obj.h2 || ''),
  ];
  if (withLead) rows.push(field('คำอธิบาย', `${prefix}-lead`, obj.lead || '', 'textarea', 2));
  return rows.join('');
}

function readHeading(prefix, obj, withLead) {
  obj.eyebrow = document.getElementById(`${prefix}-eyebrow`)?.value || '';
  obj.h2 = document.getElementById(`${prefix}-h2`)?.value || '';
  if (withLead) obj.lead = document.getElementById(`${prefix}-lead`)?.value || '';
}

function renderExtraSections(content) {
  ensureFooter(content);
  const s = content.site;
  const f = content.footer;

  $('#header-fields').innerHTML = [
    field('ชื่อแบรนด์ในเมนู', 'header-brand', content.header.brandName || s.name),
    field('โลโก้ (path)', 'header-logo', content.header.logoPath),
  ].join('');

  const b = f.brandCol;
  $('#footer-brand-fields').innerHTML = [
    field('ชื่อ footer (slug)', 'fb-brandSlug', b.brandSlug || s.brandSlug),
    field('คำอธิบาย', 'fb-desc', b.desc || s.tagline, 'textarea', 3),
    field('ป้ายโทร แต้ม', 'fb-tam-label', b.phoneTamLabel || s.phones.tam.label),
    field('เบอร์ แต้ม (แสดง)', 'fb-tam-display', b.phoneTamDisplay || s.phones.tam.display),
    field('เบอร์ แต้ม (tel:)', 'fb-tam-tel', b.phoneTamTel || s.phones.tam.tel),
    field('ป้ายโทร เอ', 'fb-a-label', b.phoneALabel || s.phones.a.label),
    field('เบอร์ เอ (แสดง)', 'fb-a-display', b.phoneADisplay || s.phones.a.display),
    field('เบอร์ เอ (tel:)', 'fb-a-tel', b.phoneATel || s.phones.a.tel),
    field('เวลาทำการ', 'fb-hours', b.hours || s.hours),
  ].join('');

  $('#footer-menu-fields').innerHTML = field('หัวข้อคอลัมน์', 'fb-nav-title', f.mainNav.title);
  $('#footer-menu-links').innerHTML = linkEditor(f.mainNav.links, 'fb-nav');

  $('#footer-products-fields').innerHTML = field('หัวข้อคอลัมน์', 'fb-prod-title', f.productsNav.title);
  $('#footer-products-links').innerHTML = linkEditor(f.productsNav.links, 'fb-prod');

  const info = f.infoCol;
  $('#footer-info-fields').innerHTML = [
    field('หัวข้อคอลัมน์', 'fb-info-title', info.title),
    field('สำนักงาน', 'fb-office', info.office || s.office),
    field('ใบอนุญาต', 'fb-licenses', info.licenses || s.licenses),
    field('หมายเหตุ', 'fb-note', info.note || s.footerNote, 'textarea', 2),
  ].join('');

  const leg = f.legal;
  $('#footer-legal-fields').innerHTML = [
    field('ลิขสิทธิ์', 'fb-copyright', leg.copyright || s.copyright),
    field('ข้อความลิงก์ Privacy', 'fb-privacy-label', leg.privacyLabel),
    field('ข้อความลิงก์ Terms', 'fb-terms-label', leg.termsLabel),
  ].join('');

  const hm = content.pages.home;
  $('#home-meta-fields').innerHTML = [
    field('Title หน้าหลัก', 'home-title', hm.title || ''),
    field('Meta description', 'home-meta', hm.metaDescription || '', 'textarea', 2),
  ].join('');

  $('#home-solutions-fields').innerHTML = headingFields('hsol', hm.solutionsHeading, false);
  $('#home-categories-fields').innerHTML = field('หัวข้อแถบ', 'hcat-h2', hm.productCategories.h2);
  $('#home-categories-chips').innerHTML = (hm.productCategories.chips || [])
    .map(
      (c, i) => `<div class="admin-slide"><strong>ชิป ${i + 1}</strong>
      ${field('ชื่อ', `hcat-label-${i}`, c.label)}
      ${field('ลิงก์', `hcat-href-${i}`, c.href)}
      ${field('ไอคอน', `hcat-img-${i}`, c.image)}
    </div>`
    )
    .join('');

  const intro = hm.intro;
  $('#home-intro-fields').innerHTML = [
    field('Eyebrow', 'hint-eyebrow', intro.eyebrow),
    field('หัวข้อ', 'hint-h2', intro.h2),
    field('คำนำ', 'hint-lead', intro.lead, 'textarea', 3),
    field('รูป', 'hint-img', intro.imageSrc),
    field('คำอธิบายรูป', 'hint-alt', intro.imageAlt),
    field('แท็ก 1', 'hint-tag-0', intro.tags?.[0]?.title || ''),
    field('แท็ก 2', 'hint-tag-1', intro.tags?.[1]?.title || ''),
    field('แท็ก 3', 'hint-tag-2', intro.tags?.[2]?.title || ''),
  ].join('');

  const proc = hm.process;
  $('#home-process-fields').innerHTML = [
    field('Eyebrow', 'hproc-eyebrow', proc.eyebrow),
    field('หัวข้อ', 'hproc-h2', proc.h2),
    field('คำอธิบาย', 'hproc-copy', proc.copy, 'textarea', 2),
    field('ข้อความลิงก์', 'hproc-link-text', proc.linkText),
    field('ลิงก์', 'hproc-link-href', proc.linkHref),
    ...(proc.steps || []).flatMap((st, i) => [
      `<p class="admin-muted"><strong>ขั้นตอน ${i + 1}</strong></p>`,
      field('เลข', `hproc-num-${i}`, st.num),
      field('หัวข้อ', `hproc-title-${i}`, st.title),
      field('รายละเอียด', `hproc-desc-${i}`, st.desc, 'textarea', 2),
    ]),
  ].join('');

  $('#home-tax-fields').innerHTML = [
    headingFields('htax', hm.taxPlansHeading, false),
    field('ข้อความแถบข้าง', 'htax-sidebar', hm.taxPlansHeading.sidebarLabel || ''),
  ].join('');

  $('#home-testimonials-fields').innerHTML = headingFields('htest', hm.testimonials, false);
  $('#home-articles-fields').innerHTML = [
    headingFields('hart', hm.homeArticles, true),
    field('ข้อความลิงก์ดูทั้งหมด', 'hart-more', hm.homeArticles.moreText),
    field('ลิงก์', 'hart-href', hm.homeArticles.moreHref),
  ].join('');
  $('#home-careers-fields').innerHTML = [
    headingFields('hcar', hm.homeCareers, true),
    field('ข้อความลิงก์ดูทั้งหมด', 'hcar-more', hm.homeCareers.moreText),
    field('ลิงก์', 'hcar-href', hm.homeCareers.moreHref),
  ].join('');

  const cta = hm.ctaBand;
  $('#home-cta-fields').innerHTML = [
    field('Eyebrow', 'hcta-eyebrow', cta.eyebrow),
    field('หัวข้อ', 'hcta-h2', cta.h2),
    field('คำอธิบาย', 'hcta-copy', cta.copy, 'textarea', 2),
    field('ปุ่ม', 'hcta-btn', cta.buttonText),
    field('ลิงก์ปุ่ม', 'hcta-href', cta.buttonHref),
  ].join('');

  const ab = content.pages.about;
  $('#about-fields').innerHTML = [
    field('Title', 'about-title', ab.title),
    field('Meta', 'about-meta', ab.metaDescription, 'textarea', 2),
    field('Eyebrow', 'about-eyebrow', ab.hero?.eyebrow),
    field('หัวข้อ h1', 'about-h1', ab.hero?.h1),
    field('คำนำ', 'about-lead', ab.hero?.lead, 'textarea', 3),
    field('ย่อหน้าต่อท้าย Hero', 'about-followup', ab.followup, 'textarea', 4),
    field('โปรไฟล์ — eyebrow', 'about-agent-eyebrow', ab.agent?.eyebrow),
    field('โปรไฟล์ — หัวข้อ (HTML ได้)', 'about-agent-h2', ab.agent?.h2),
    field('โปรไฟล์ — คำนำ', 'about-agent-lead', ab.agent?.lead, 'textarea', 3),
  ].join('');

  renderPageBlock('insurance', content.pages.insurance);
  renderPageBlock('life-insurance', content.pages.lifeInsurance);
  renderPageBlock('health-insurance', content.pages.healthInsurance);
  renderPageBlock('savings', content.pages.savingsRetirement);

  const cf = content.pages.contact.form;
  $('#contact-form-fields').innerHTML = [
    field('ป้ายชื่อ', 'cff-name-label', cf.nameLabel),
    field('placeholder ชื่อ', 'cff-name-ph', cf.namePlaceholder),
    field('ป้ายเบอร์', 'cff-phone-label', cf.phoneLabel),
    field('ป้ายวัตถุประสงค์', 'cff-interest-label', cf.interestLabel),
    field('ป้ายแบบประกัน', 'cff-plan-label', cf.planLabel),
    field('ป้ายข้อความ', 'cff-msg-label', cf.messageLabel),
    field('placeholder ข้อความ', 'cff-msg-ph', cf.messagePlaceholder),
    field('ปุ่มส่ง', 'cff-submit', cf.submitText),
    field('หมายเหตุฟอร์ม', 'cff-note', cf.formNote, 'textarea', 2),
  ].join('');

  $('#contact-legal-fields').innerHTML = [
    field('หัวข้อ Privacy', 'cl-privacy-title', leg.privacyTitle),
    field('เนื้อหา Privacy', 'cl-privacy-body', leg.privacyBody, 'textarea', 4),
    field('หัวข้อ Terms', 'cl-terms-title', leg.termsTitle),
    field('เนื้อหา Terms', 'cl-terms-body', leg.termsBody, 'textarea', 4),
  ].join('');

  bindLinkRemovers();
}

function renderPageBlock(id, p) {
  const rows = [
    field('Title', `${id}-title`, p.title),
    field('Meta description', `${id}-meta`, p.metaDescription, 'textarea', 2),
    field('Eyebrow', `${id}-eyebrow`, p.hero?.eyebrow),
    field('หัวข้อ h1', `${id}-h1`, p.hero?.h1),
    field('คำนำ', `${id}-copy`, p.hero?.copy, 'textarea', 2),
  ];
  if (p.bodyHtml !== undefined) rows.push(field('เนื้อหา (HTML)', `${id}-body`, p.bodyHtml || '', 'textarea', 14));
  $(`#${id}-fields`).innerHTML = rows.join('');
}

function bindLinkRemovers() {
  document.querySelectorAll('[data-remove-link]').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.removeLink;
      const listKey = id.startsWith('fb-nav') ? 'mainNav' : 'productsNav';
      const idx = Number(id.split('-').pop());
      content.footer[listKey].links.splice(idx, 1);
      renderExtraSections(content);
    };
  });
}

function collectExtraSections(content) {
  ensureFooter(content);
  const s = content.site;
  const f = content.footer;

  content.header.brandName = $('#header-brand').value;
  content.header.logoPath = $('#header-logo').value;
  s.name = content.header.brandName;

  const b = f.brandCol;
  b.brandSlug = $('#fb-brandSlug').value;
  b.desc = $('#fb-desc').value;
  b.phoneTamLabel = $('#fb-tam-label').value;
  b.phoneTamDisplay = $('#fb-tam-display').value;
  b.phoneTamTel = $('#fb-tam-tel').value;
  b.phoneALabel = $('#fb-a-label').value;
  b.phoneADisplay = $('#fb-a-display').value;
  b.phoneATel = $('#fb-a-tel').value;
  b.hours = $('#fb-hours').value;

  s.brandSlug = b.brandSlug;
  s.tagline = b.desc;
  s.phones.tam.label = b.phoneTamLabel;
  s.phones.tam.display = b.phoneTamDisplay;
  s.phones.tam.tel = b.phoneTamTel;
  s.phones.a.label = b.phoneALabel;
  s.phones.a.display = b.phoneADisplay;
  s.phones.a.tel = b.phoneATel;
  s.hours = b.hours;

  f.mainNav.title = $('#fb-nav-title').value;
  f.mainNav.links = readLinks(f.mainNav.links, 'fb-nav');
  f.productsNav.title = $('#fb-prod-title').value;
  f.productsNav.links = readLinks(f.productsNav.links, 'fb-prod');

  f.infoCol.title = $('#fb-info-title').value;
  f.infoCol.office = $('#fb-office').value;
  f.infoCol.licenses = $('#fb-licenses').value;
  f.infoCol.note = $('#fb-note').value;
  s.office = f.infoCol.office;
  s.licenses = f.infoCol.licenses;
  s.footerNote = f.infoCol.note;

  f.legal.copyright = $('#fb-copyright').value;
  f.legal.privacyLabel = $('#fb-privacy-label').value;
  f.legal.termsLabel = $('#fb-terms-label').value;
  s.copyright = f.legal.copyright;

  const hm = content.pages.home;
  hm.title = $('#home-title').value;
  hm.metaDescription = $('#home-meta').value;
  readHeading('hsol', hm.solutionsHeading, false);
  hm.productCategories.h2 = $('#hcat-h2').value;
  hm.productCategories.chips = (hm.productCategories.chips || []).map((c, i) => ({
    label: $(`#hcat-label-${i}`)?.value || c.label,
    href: $(`#hcat-href-${i}`)?.value || c.href,
    image: $(`#hcat-img-${i}`)?.value || c.image,
  }));

  const intro = hm.intro;
  intro.eyebrow = $('#hint-eyebrow').value;
  intro.h2 = $('#hint-h2').value;
  intro.lead = $('#hint-lead').value;
  intro.imageSrc = $('#hint-img').value;
  intro.imageAlt = $('#hint-alt').value;
  intro.tags = [0, 1, 2].map((i) => ({ title: $(`#hint-tag-${i}`)?.value || '' })).filter((t) => t.title);

  const proc = hm.process;
  proc.eyebrow = $('#hproc-eyebrow').value;
  proc.h2 = $('#hproc-h2').value;
  proc.copy = $('#hproc-copy').value;
  proc.linkText = $('#hproc-link-text').value;
  proc.linkHref = $('#hproc-link-href').value;
  proc.steps = (proc.steps || []).map((st, i) => ({
    num: $(`#hproc-num-${i}`)?.value || st.num,
    title: $(`#hproc-title-${i}`)?.value || st.title,
    desc: $(`#hproc-desc-${i}`)?.value || st.desc,
  }));

  readHeading('htax', hm.taxPlansHeading, false);
  hm.taxPlansHeading.sidebarLabel = $('#htax-sidebar').value;
  readHeading('htest', hm.testimonials, false);
  readHeading('hart', hm.homeArticles, true);
  hm.homeArticles.moreText = $('#hart-more').value;
  hm.homeArticles.moreHref = $('#hart-href').value;
  readHeading('hcar', hm.homeCareers, true);
  hm.homeCareers.moreText = $('#hcar-more').value;
  hm.homeCareers.moreHref = $('#hcar-href').value;

  const cta = hm.ctaBand;
  cta.eyebrow = $('#hcta-eyebrow').value;
  cta.h2 = $('#hcta-h2').value;
  cta.copy = $('#hcta-copy').value;
  cta.buttonText = $('#hcta-btn').value;
  cta.buttonHref = $('#hcta-href').value;

  const ab = content.pages.about;
  ab.title = $('#about-title').value;
  ab.metaDescription = $('#about-meta').value;
  ab.hero.eyebrow = $('#about-eyebrow').value;
  ab.hero.h1 = $('#about-h1').value;
  ab.hero.lead = $('#about-lead').value;
  ab.followup = $('#about-followup').value;
  ab.agent.eyebrow = $('#about-agent-eyebrow').value;
  ab.agent.h2 = $('#about-agent-h2').value;
  ab.agent.lead = $('#about-agent-lead').value;

  collectPageBlock('insurance', content.pages.insurance);
  collectPageBlock('life-insurance', content.pages.lifeInsurance);
  collectPageBlock('health-insurance', content.pages.healthInsurance);
  collectPageBlock('savings', content.pages.savingsRetirement);

  const cf = content.pages.contact.form;
  cf.nameLabel = $('#cff-name-label').value;
  cf.namePlaceholder = $('#cff-name-ph').value;
  cf.phoneLabel = $('#cff-phone-label').value;
  cf.interestLabel = $('#cff-interest-label').value;
  cf.planLabel = $('#cff-plan-label').value;
  cf.messageLabel = $('#cff-msg-label').value;
  cf.messagePlaceholder = $('#cff-msg-ph').value;
  cf.submitText = $('#cff-submit').value;
  cf.formNote = $('#cff-note').value;

  const leg = f.legal;
  leg.privacyTitle = $('#cl-privacy-title').value;
  leg.privacyBody = $('#cl-privacy-body').value;
  leg.termsTitle = $('#cl-terms-title').value;
  leg.termsBody = $('#cl-terms-body').value;
}

function collectPageBlock(id, p) {
  p.title = $(`#${id}-title`).value;
  p.metaDescription = $(`#${id}-meta`).value;
  if (!p.hero) p.hero = {};
  p.hero.eyebrow = $(`#${id}-eyebrow`).value;
  p.hero.h1 = $(`#${id}-h1`).value;
  p.hero.copy = $(`#${id}-copy`).value;
  p.bodyHtml = $(`#${id}-body`)?.value ?? p.bodyHtml;
}
