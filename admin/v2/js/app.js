/**
 * Wealth Life Insure CMS Admin v2
 */
(function () {
  'use strict';

  const MENU = [
    { id: 'dashboard', label: 'แดชบอร์ด' },
    { id: 'nav', label: 'เมนูนำทาง' },
    { id: 'home', label: 'หน้าแรก' },
    { id: 'pages', label: 'หน้าย่อย' },
    { id: 'banners', label: 'แบนเนอร์' },
    { id: 'categories', label: 'หมวดประกัน' },
    { id: 'plans', label: 'แผนประกัน' },
    { id: 'articles', label: 'บทความ' },
    { id: 'testimonials', label: 'รีวิวลูกค้า' },
    { id: 'leads', label: 'ลีด / ติดต่อ' },
    { id: 'cta', label: 'โปรไฟล์ติดต่อ' },
    { id: 'footer', label: 'ส่วนท้ายเว็บ' },
    { id: 'seo', label: 'SEO' },
    { id: 'tracking', label: 'ติดตาม & โฆษณา' },
    { id: 'media', label: 'คลังสื่อ' },
    { id: 'users', label: 'ผู้ใช้' },
    { id: 'backup', label: 'สำรองข้อมูล' },
    { id: 'settings', label: 'ตั้งค่าระบบ' },
  ];

  /** Lucide icon names — https://lucide.dev/icons */
  const NAV_LUCIDE = {
    dashboard: 'layout-dashboard',
    nav: 'menu',
    home: 'house',
    pages: 'file-text',
    banners: 'image',
    categories: 'layout-grid',
    plans: 'clipboard-list',
    articles: 'newspaper',
    testimonials: 'star',
    leads: 'messages-square',
    cta: 'phone',
    footer: 'panel-bottom',
    seo: 'search',
    tracking: 'chart-line',
    media: 'images',
    users: 'user',
    backup: 'hard-drive-download',
    settings: 'settings',
  };

  function navIcon(id) {
    const name = NAV_LUCIDE[id] || NAV_LUCIDE.dashboard;
    return window.LucideIcons?.svg(name) || '';
  }

  const DASHBOARD_SHORTCUTS = [
    { route: 'settings', label: 'ข้อมูลเว็บ / ตั้งค่าระบบ' },
    { route: 'nav', label: 'เมนูนำทาง' },
    { route: 'home', label: 'หน้าแรก' },
    { route: 'pages', label: 'หน้าย่อย (เกี่ยวกับเรา / แบบประกัน ฯลฯ)' },
    { route: 'banners', label: 'แบนเนอร์' },
    { route: 'categories', label: 'หมวดประกัน' },
    { route: 'plans', label: 'แผนประกัน' },
    { route: 'articles', label: 'บทความ / ข่าว' },
    { route: 'testimonials', label: 'รีวิวลูกค้า' },
    { route: 'leads', label: 'ลีด / ติดต่อ' },
    { route: 'cta', label: 'โปรไฟล์ติดต่อ' },
    { route: 'footer', label: 'ส่วนท้ายเว็บ' },
    { route: 'seo', label: 'SEO / Meta' },
    { route: 'tracking', label: 'ติดตาม & โฆษณา' },
    { route: 'media', label: 'คลังสื่อ / อัปโหลดรูป' },
    { route: 'users', label: 'ผู้ใช้งาน' },
    { route: 'backup', label: 'สำรองข้อมูล' },
  ];

  const STAT_LUCIDE = {
    articles: 'file-text',
    draft: 'pencil',
    plans: 'clipboard-list',
    leads: 'inbox',
    media: 'image',
    reviews: 'star',
  };

  function statIcon(iconKey) {
    const name = STAT_LUCIDE[iconKey] || STAT_LUCIDE.articles;
    return window.LucideIcons?.svg(name, { size: 22 }) || '';
  }

  function statCard(value, label, iconKey, tone = 'blue') {
    const icon = statIcon(iconKey);
    return `<article class="dash-stat dash-stat--${tone}">
      <div class="dash-stat__icon" aria-hidden="true">${icon}</div>
      <div class="dash-stat__body">
        <strong class="dash-stat__value">${esc(String(value ?? 0))}</strong>
        <span class="dash-stat__label">${esc(label)}</span>
      </div>
    </article>`;
  }

  const SEO_PAGES = [
    { key: 'home', label: 'หน้าแรก' },
    { key: 'about', label: 'เกี่ยวกับเรา' },
    { key: 'insurance', label: 'แบบประกัน' },
    { key: 'news', label: 'ข่าวสาร' },
    { key: 'careers', label: 'อาชีพ' },
    { key: 'contact', label: 'ติดต่อ' },
    { key: 'life-insurance', label: 'ประกันชีวิต' },
    { key: 'health-insurance', label: 'ประกันสุขภาพ' },
    { key: 'savings-retirement', label: 'ออมทรัพย์' },
  ];

  const SEO_PAGE_PATH = {
    home: 'index.html',
    about: 'about.html',
    insurance: 'insurance.html',
    news: 'news.html',
    careers: 'careers.html',
    contact: 'contact.html',
    'life-insurance': 'life-insurance.html',
    'health-insurance': 'health-insurance.html',
    'savings-retirement': 'savings-retirement.html',
  };

  const SEO_TITLE_MAX = 60;
  const SEO_DESC_MAX = 160;

  function sitePublicUrl(relativePath = '') {
    const path = window.location.pathname.replace(/\/admin\/v2\/?.*$/i, '');
    const base = `${window.location.origin}${path}`.replace(/\/$/, '');
    const rel = String(relativePath).replace(/^\//, '');
    return rel ? `${base}/${rel}` : base;
  }

  function seoPageLabel(pageKey) {
    return SEO_PAGES.find((p) => p.key === pageKey)?.label || pageKey;
  }

  function seoDefaultCanonical(pageKey) {
    return sitePublicUrl(SEO_PAGE_PATH[pageKey] || `${pageKey}.html`);
  }

  function seoSlugFromTitle(title, fallback) {
    const slug = String(title || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return slug || fallback;
  }

  function seoCounterBadge(name, value, max) {
    const len = String(value || '').length;
    let cls = 'seo-counter';
    if (len > max) cls += ' seo-counter--over';
    else if (len > max * 0.9) cls += ' seo-counter--warn';
    return `<span class="${cls}" id="seo-count-${name}" aria-live="polite">${len} / ${max}</span>`;
  }

  function seoFieldTitle(name, label, value, max) {
    return `<div class="form-field form-field--full">
      <div class="seo-field-head">
        <label for="f-${name}">${esc(label)}</label>
        ${seoCounterBadge(name, value, max)}
      </div>
      <input id="f-${name}" name="${esc(name)}" type="text" value="${esc(value || '')}" data-seo-max="${max}">
      <p class="form-hint">แนะนำไม่เกิน ${max} ตัวอักษร — แสดงเป็นหัวข้อในผลค้นหา Google</p>
    </div>`;
  }

  function seoFieldDesc(name, label, value, max, rows = 4) {
    return `<div class="form-field form-field--full">
      <div class="seo-field-head">
        <label for="f-${name}">${esc(label)}</label>
        ${seoCounterBadge(name, value, max)}
      </div>
      <textarea id="f-${name}" name="${esc(name)}" rows="${rows}" data-seo-max="${max}">${esc(value || '')}</textarea>
      <p class="form-hint">แนะนำ ${max} ตัวอักษร — ข้อความใต้หัวข้อในผลค้นหา</p>
    </div>`;
  }

  function seoAcc(title, body, open = false) {
    return `<details class="footer-acc seo-acc"${open ? ' open' : ''}>
      <summary class="footer-acc__summary">${esc(title)}</summary>
      <div class="footer-acc__body">${body}</div>
    </details>`;
  }

  function seoFormHtml(row, pageKey) {
    const r = row || {};
    const defaultCanonical = seoDefaultCanonical(pageKey);
    const ogPath = r.og_image || '';
    const ogPreview = ogPath
      ? `<img class="seo-og-preview__img" src="${esc(ogPath.startsWith('http') ? ogPath : `../../${ogPath.replace(/^\//, '')}`)}" alt="" loading="lazy">`
      : '<p class="seo-og-preview__empty muted">ยังไม่มีรูป — เลือกจากคลังหรือใส่ path</p>';

    return `<div class="seo-editor" id="seo-editor">
      <div class="seo-editor__layout">
        <div class="seo-editor__main">
          ${seoAcc(
            'ข้อมูลพื้นฐาน (Title & Description)',
            `<div class="form-grid form-grid--stacked">
              ${seoFieldTitle('meta_title', 'Meta Title', r.meta_title, SEO_TITLE_MAX)}
              ${seoFieldDesc('meta_description', 'Meta Description', r.meta_description, SEO_DESC_MAX)}
              ${input('meta_keywords', 'คำค้น (คั่นด้วยจุลภาค)', r.meta_keywords, 'text', {
                full: true,
                placeholder: 'ประกันชีวิต, ประกันสุขภาพ, บางนา',
                hint: 'ไม่บังคับ — ช่วยอธิบายหัวข้อหลักของหน้า',
              })}
            </div>`,
            true
          )}
          ${seoAcc(
            'รูปแชร์โซเชียล (Open Graph)',
            `<div class="form-grid form-grid--stacked">
              ${mediaPickField('og_image', 'OG Image', ogPath)}
              <p class="form-hint form-field--full">รูปเมื่อแชร์ลิงก์บน Facebook / LINE — แนะนำ 1200×630 px</p>
              <div class="seo-og-preview form-field--full" id="seo-og-preview">${ogPreview}</div>
            </div>`
          )}
          ${seoAcc(
            'ตั้งค่าขั้นสูง',
            `<div class="form-grid form-grid--stacked">
              <div class="form-field form-field--full">
                <label for="f-canonical_url">Canonical URL</label>
                <div class="seo-inline-actions">
                  <input id="f-canonical_url" name="canonical_url" type="url" value="${esc(r.canonical_url || '')}" placeholder="${esc(defaultCanonical)}">
                  <button type="button" class="btn btn--ghost btn--sm" id="seo-fill-canonical">ใส่ URL มาตรฐาน</button>
                </div>
                <p class="form-hint">บอก Google ว่าหน้านี้คือ URL หลัก — ป้องกันเนื้อหาซ้ำ</p>
              </div>
              <div class="form-field form-field--full">
                <label for="f-slug">Slug (path)</label>
                <div class="seo-inline-actions">
                  <input id="f-slug" name="slug" type="text" value="${esc(r.slug || '')}" placeholder="${esc(SEO_PAGE_PATH[pageKey] || '')}">
                  <button type="button" class="btn btn--ghost btn--sm" id="seo-gen-slug">สร้างจาก Title</button>
                </div>
                <p class="form-hint">ใช้ระบุ path ของหน้า — ถ้า Title เป็นภาษาไทยอาจต้องพิมพ์เอง</p>
              </div>
              <div class="form-field form-field--check form-field--full">
                <label><input type="checkbox" name="robots_index" value="1"${r.robots_index !== 0 ? ' checked' : ''}> ให้ Google index หน้านี้</label>
                <p class="form-hint">ปิดถ้าไม่ต้องการให้แสดงในผลค้นหา</p>
              </div>
            </div>`
          )}
        </div>
        <aside class="seo-editor__aside">
          <div class="seo-serp-card">
            <h3 class="seo-serp-card__title">ตัวอย่างผลค้นหา Google</h3>
            <p class="muted seo-serp-card__lead">หน้า: <strong>${esc(seoPageLabel(pageKey))}</strong></p>
            <div class="seo-serp" id="seo-serp-preview">
              <div class="seo-serp__site">${esc(sitePublicUrl().replace(/^https?:\/\//, ''))}</div>
              <div class="seo-serp__url" id="seo-serp-url"></div>
              <div class="seo-serp__title" id="seo-serp-title"></div>
              <div class="seo-serp__desc" id="seo-serp-desc"></div>
            </div>
          </div>
          <div class="seo-tips-card">
            <h3 class="seo-tips-card__title">เคล็ดลับ SEO</h3>
            <ul class="seo-tips-list">
              <li>Title ชัดเจน มีคำหลักสำคัญ</li>
              <li>Description สรุปประโยชน์ ไม่ยัดคำซ้ำ</li>
              <li>OG Image ชัด อ่านง่ายบนมือถือ</li>
              <li>Canonical ชี้ URL หลักของหน้า</li>
            </ul>
          </div>
        </aside>
      </div>
      <div class="seo-editor__actions">
        <button type="button" class="btn btn--primary" id="seo-save">บันทึก SEO</button>
        <span class="muted seo-editor__save-hint">บันทึกแล้วระบบจะอัปเดตหน้าเว็บให้อัตโนมัติ</span>
      </div>
    </div>`;
  }

  function bindSeoEditor(formEl, pageKey) {
    const titleEl = $('[name="meta_title"]', formEl);
    const descEl = $('[name="meta_description"]', formEl);
    const ogEl = $('[name="og_image"]', formEl);
    const canonicalEl = $('[name="canonical_url"]', formEl);
    const slugEl = $('[name="slug"]', formEl);

    function updateCounter(el) {
      if (!el) return;
      const max = Number(el.dataset.seoMax) || 0;
      const badge = $(`#seo-count-${el.name}`, formEl);
      if (!badge || !max) return;
      const len = el.value.length;
      badge.textContent = `${len} / ${max}`;
      badge.classList.remove('seo-counter--warn', 'seo-counter--over');
      if (len > max) badge.classList.add('seo-counter--over');
      else if (len > max * 0.9) badge.classList.add('seo-counter--warn');
    }

    function updateSerp() {
      const title =
        titleEl?.value?.trim() ||
        `${seoPageLabel(pageKey)} | Wealth Life Insure`;
      const desc =
        descEl?.value?.trim() ||
        'กรอก Meta Description เพื่อดูตัวอย่างข้อความใต้หัวข้อในผลค้นหา';
      const url =
        canonicalEl?.value?.trim() || seoDefaultCanonical(pageKey);
      const urlEl = $('#seo-serp-url', formEl);
      const titleNode = $('#seo-serp-title', formEl);
      const descNode = $('#seo-serp-desc', formEl);
      if (urlEl) {
        try {
          const u = new URL(url, window.location.origin);
          urlEl.textContent = `${u.hostname} › ${u.pathname.replace(/^\//, '')}`;
        } catch {
          urlEl.textContent = url.replace(/^https?:\/\//, '');
        }
      }
      if (titleNode) titleNode.textContent = title;
      if (descNode) descNode.textContent = desc;
    }

    function updateOgPreview() {
      const wrap = $('#seo-og-preview', formEl);
      if (!wrap) return;
      const path = ogEl?.value?.trim() || '';
      if (!path) {
        wrap.innerHTML = '<p class="seo-og-preview__empty muted">ยังไม่มีรูป — เลือกจากคลังหรือใส่ path</p>';
        return;
      }
      const src = path.startsWith('http') ? path : `../../${path.replace(/^\//, '')}`;
      wrap.innerHTML = `<img class="seo-og-preview__img" src="${esc(src)}" alt="" loading="lazy">`;
    }

    function refresh() {
      updateCounter(titleEl);
      updateCounter(descEl);
      updateSerp();
      updateOgPreview();
    }

    [titleEl, descEl, canonicalEl, slugEl, ogEl].forEach((el) => {
      el?.addEventListener('input', refresh);
    });

    $('#seo-fill-canonical', formEl)?.addEventListener('click', () => {
      if (canonicalEl) canonicalEl.value = seoDefaultCanonical(pageKey);
      refresh();
    });

    $('#seo-gen-slug', formEl)?.addEventListener('click', () => {
      if (!slugEl) return;
      const slug = seoSlugFromTitle(titleEl?.value, SEO_PAGE_PATH[pageKey] || pageKey);
      slugEl.value = slug;
      if (slug === (SEO_PAGE_PATH[pageKey] || pageKey) && !/[a-z]/.test(titleEl?.value || '')) {
        toast(toastEl, 'Title เป็นภาษาไทย — ใส่ slug ภาษาอังกฤษเองหรือใช้ path มาตรฐาน', false);
      }
      refresh();
    });

    $$('[data-media-pick]', formEl).forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.mediaPick;
        openMediaPicker((path) => {
          const el = $(`[name="${field}"]`, formEl);
          if (el) {
            el.value = path;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      });
    });

    refresh();
  }

  const LEAD_STATUS = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'new', label: 'ใหม่' },
    { value: 'contacted', label: 'ติดต่อแล้ว' },
    { value: 'closed', label: 'ปิดแล้ว' },
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const loginScreen = $('#login-screen');
  const loginForm = $('#login-form');
  const loginError = $('#login-error');
  const app = $('#app');
  const sidebar = $('#sidebar');
  const sidebarNav = $('#sidebar-nav');
  const sidebarOpen = $('#sidebar-open');
  const sidebarClose = $('#sidebar-close');
  const content = $('#content');
  const pageTitle = $('#page-title');
  const userNameEl = $('#user-name');
  const userRoleEl = $('#user-role');
  const userAvatarEl = $('#user-avatar');

  const ROLE_LABELS = {
    super_admin: 'ผู้ดูแลระบบ',
    admin: 'ผู้ดูแล',
    editor: 'บรรณาธิการ',
  };

  function renderSidebarUser() {
    if (!currentUser) {
      if (userNameEl) userNameEl.textContent = '';
      if (userRoleEl) userRoleEl.textContent = '';
      if (userAvatarEl) userAvatarEl.textContent = 'W';
      return;
    }
    const name = currentUser.username || 'ผู้ใช้';
    if (userNameEl) userNameEl.textContent = name;
    if (userRoleEl) {
      userRoleEl.textContent = ROLE_LABELS[currentUser.role] || currentUser.role || '';
    }
    if (userAvatarEl) {
      userAvatarEl.textContent = name.trim().charAt(0).toUpperCase() || 'W';
    }
  }
  const logoutBtn = $('#logout-btn');
  const toastEl = $('#toast');

  async function publishAfterSave(message) {
    try {
      await publishSite(toastEl, message);
      return true;
    } catch (err) {
      const detail = err.message || 'สร้างหน้าเว็บไม่สำเร็จ';
      toast(toastEl, `${detail} — ข้อมูลบันทึกในฐานข้อมูลแล้ว`, true);
      return false;
    }
  }
  const modal = $('#modal');
  const modalForm = $('#modal-form');
  const modalTitle = $('#modal-title');
  const modalBody = $('#modal-body');
  const modalClose = $('#modal-close');
  const modalCancel = $('#modal-cancel');

  let currentUser = null;
  let currentRoute = 'dashboard';
  let quillEditor = null;
  let articleQuill = null;
  let modalSaveHandler = null;
  let sortableInstances = [];
  let mediaPickCallback = null;
  let mediaPickMulti = false;
  let mediaPickMultiSelected = [];
  let modalPausedForMediaPick = false;
  let articlesSubTab = 'articles';

  /* ——— Field helpers ——— */
  function labelWithHint(label, tip) {
    return `<span class="label-with-hint">${esc(label)}<button type="button" class="field-hint-trigger" data-field-hint="${esc(tip)}" aria-label="คำอธิบาย: ${esc(label)}">?</button></span>`;
  }

  function input(name, label, value = '', type = 'text', opts = {}) {
    const req = opts.required ? ' required' : '';
    const hint = opts.hint ? `<p class="form-hint">${esc(opts.hint)}</p>` : '';
    const cls = opts.full ? 'form-field form-field--full' : 'form-field';
    const labelHtml = opts.tip ? labelWithHint(label, opts.tip) : esc(label);
    const ph = opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : '';
    return `<div class="${cls}">
      <label for="f-${name}">${labelHtml}</label>
      <input id="f-${name}" name="${esc(name)}" type="${type}" value="${esc(value)}"${req}${opts.readonly ? ' readonly' : ''}${ph}>
      ${hint}
    </div>`;
  }

  function textarea(name, label, value = '', rows = 4, opts = {}) {
    const cls = opts.full ? 'form-field form-field--full' : 'form-field';
    return `<div class="${cls}">
      <label for="f-${name}">${esc(label)}</label>
      <textarea id="f-${name}" name="${esc(name)}" rows="${rows}">${esc(value)}</textarea>
      ${opts.hint ? `<p class="form-hint">${esc(opts.hint)}</p>` : ''}
    </div>`;
  }

  function checkbox(name, label, checked = false) {
    return `<div class="form-field form-field--check">
      <label><input type="checkbox" name="${esc(name)}" value="1"${checked ? ' checked' : ''}> ${esc(label)}</label>
    </div>`;
  }

  function select(name, label, options, value = '', fieldOpts = {}) {
    const opts = options
      .map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const t = typeof o === 'object' ? o.label : o;
        const sel = String(v) === String(value) ? ' selected' : '';
        return `<option value="${esc(v)}"${sel}>${esc(t)}</option>`;
      })
      .join('');
    const labelHtml = fieldOpts.tip ? labelWithHint(label, fieldOpts.tip) : esc(label);
    return `<div class="form-field">
      <label for="f-${name}">${labelHtml}</label>
      <select id="f-${name}" name="${esc(name)}"${fieldOpts.required ? ' required' : ''}>${opts}</select>
      ${fieldOpts.hint ? `<p class="form-hint">${esc(fieldOpts.hint)}</p>` : ''}
    </div>`;
  }

  function mediaPickField(name, label, value = '') {
    return `<div class="form-field form-field--full">
      <label for="f-${name}">${esc(label)}</label>
      <div class="media-pick-row">
        <input id="f-${name}" name="${esc(name)}" type="text" value="${esc(value)}">
        <button type="button" class="btn btn--ghost btn--sm" data-media-pick="${esc(name)}">เลือกจากคลัง</button>
      </div>
    </div>`;
  }

  let internalLinksCache = null;

  async function fetchInternalLinks() {
    if (internalLinksCache) return internalLinksCache;
    internalLinksCache = await api('/internal-links');
    return internalLinksCache;
  }

  function detectPlanLinkMode(linkUrl) {
    const url = String(linkUrl || '').trim();
    if (!url) return 'auto';
    if (/^https?:\/\//i.test(url) || /^tel:/i.test(url) || /^mailto:/i.test(url)) return 'custom';
    return 'internal';
  }

  function planLinkAutoHint(slug) {
    const s = String(slug || '').trim();
    return s ? `plans/${s}.html` : 'plans/{slug}.html';
  }

  function planSlugForRow(plan) {
    const pub = String(plan?.public_slug || '').trim();
    if (pub) return sanitizePlanFileSlug(pub);
    const name = String(plan?.name || '').trim();
    const dbSlug = String(plan?.slug || '').trim();
    const aliases = {
      'เลกาซี ฟิต แคร์ 99/10': 'legacy-fit-care-99-10',
      'คุ้มธนกิจ 99/20 (Nn)': 'khumthanakit-99-20-nn',
      'Health Fit DD': 'health-fit-dd',
      'ทีแอลแพลน': 'tl-plan',
      'ทีแอลแพลน 20/15': 'tl-plan-20-15',
      'TL Plan 20/15': 'tl-plan-20-15',
      'มันนี่ ฟิต เวลท์ตี้ 18/4': 'money-fit-wealthy-18-4',
    };
    const fromName = aliases[name] || sanitizePlanFileSlug(name);
    if (dbSlug && /[/\\ ]/.test(dbSlug)) {
      return fromName || sanitizePlanFileSlug(dbSlug);
    }
    if (fromName && dbSlug && dbSlug !== fromName && (/[ก-๙]/.test(dbSlug) || dbSlug.includes('ค-'))) {
      return fromName;
    }
    return sanitizePlanFileSlug(dbSlug || fromName || 'plan');
  }

  function sanitizePlanFileSlug(slug) {
    return String(slug || '')
      .trim()
      .replace(/[/\\]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}_.-]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '')
      || 'plan';
  }

  function isPlanChecklistCard(card) {
    if (!card || card.type === 'dropZone') return false;
    const wt = String(card.widgetType || '').trim();
    if (wt && !['planCard', 'bullets', ''].includes(wt)) return false;
    return card.type === 'checklist' || (Array.isArray(card.bullets) && card.bullets.length > 0);
  }

  function collectCategoryCardsForPlan(plan, catCards) {
    const list = Array.isArray(catCards) ? catCards : [];
    const slug = planSlugForRow(plan);
    let startIdx = -1;
    for (let i = 0; i < list.length; i++) {
      if (findMatchingPlanCard(plan, [list[i]])) {
        startIdx = i;
        break;
      }
    }
    if (startIdx < 0) {
      return [{
        id: slug,
        anchorId: slug,
        title: plan?.name || slug,
        type: 'checklist',
        bullets: [],
        icon: '',
        image: '',
        videoUrl: '',
        buttonText: '',
        buttonHref: '',
      }];
    }
    const out = [];
    for (let i = startIdx; i < list.length; i++) {
      const card = list[i];
      if (card?.type === 'dropZone') continue;
      if (i > startIdx && isPlanChecklistCard(card) && !findMatchingPlanCard(plan, [card])) {
        break;
      }
      if (i === startIdx) {
        out.push({
          ...JSON.parse(JSON.stringify(card)),
          id: slug,
          anchorId: slug,
          title: card.title || plan?.name || slug,
        });
      } else {
        out.push(JSON.parse(JSON.stringify(card)));
      }
    }
    return out;
  }

  function internalLinkOptionsHtml(groups, selected = '') {
    let html = '<option value="">— เลือกลิงก์ภายในเว็บ —</option>';
    (groups || []).forEach((group) => {
      const items = group.items || [];
      if (!items.length) return;
      html += `<optgroup label="${esc(group.label || group.key || '')}">`;
      items.forEach((item) => {
        const v = item.value || '';
        const sel = v === selected ? ' selected' : '';
        html += `<option value="${esc(v)}"${sel}>${esc(item.label || v)}</option>`;
      });
      html += '</optgroup>';
    });
    return html;
  }

  function planLinkFieldHtml(linkUrl = '', planSlug = '') {
    const value = String(linkUrl || '').trim();
    const mode = detectPlanLinkMode(value);
    return `<div class="form-field form-field--full plan-link-field" data-plan-link-field>
      <label for="f-plan-link-mode">ลิงก์เมื่อคลิกแผน</label>
      <select id="f-plan-link-mode" data-link-mode>
        <option value="auto"${mode === 'auto' ? ' selected' : ''}>ใช้หน้ารายละเอียดแผนอัตโนมัติ</option>
        <option value="internal"${mode === 'internal' ? ' selected' : ''}>ลิงก์ภายในเว็บ (บทความ / หน้าอื่น)</option>
        <option value="custom"${mode === 'custom' ? ' selected' : ''}>URL ภายนอก / กำหนดเอง</option>
      </select>
      <div class="plan-link-panel" data-link-panel="auto"${mode !== 'auto' ? ' hidden' : ''}>
        <p class="form-hint">ระบบจะลิงก์ไปที่ <code data-link-auto-hint>${esc(planLinkAutoHint(planSlug))}</code> อัตโนมัติเมื่อมี slug</p>
      </div>
      <div class="plan-link-panel" data-link-panel="internal"${mode !== 'internal' ? ' hidden' : ''}>
        <select data-link-internal data-link-value="${esc(value)}">
          <option value="">กำลังโหลดรายการลิงก์...</option>
        </select>
        <p class="form-hint">เลือกบทความ หน้าในเว็บ หรือหน้ารายละเอียดแผนอื่น — เหมือนลิงก์บทความ (articles/...)</p>
      </div>
      <div class="plan-link-panel" data-link-panel="custom"${mode !== 'custom' ? ' hidden' : ''}>
        <input type="text" data-link-custom value="${esc(mode === 'custom' ? value : '')}" placeholder="https://line.me/... หรือ https://...">
        <p class="form-hint">ใช้สำหรับลิงก์ภายนอก เช่น LINE, Facebook, เว็บบริษัทประกัน</p>
      </div>
      <input type="hidden" name="link_url" value="${esc(value)}">
    </div>`;
  }

  function syncPlanLinkPanels(wrap) {
    const mode = wrap.querySelector('[data-link-mode]')?.value || 'auto';
    wrap.querySelectorAll('[data-link-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.linkPanel !== mode;
    });
  }

  function resolvePlanLinkUrl(root) {
    const wrap = root.querySelector('[data-plan-link-field]');
    if (!wrap) return undefined;
    const mode = wrap.querySelector('[data-link-mode]')?.value || 'auto';
    if (mode === 'auto') return '';
    if (mode === 'internal') return wrap.querySelector('[data-link-internal]')?.value?.trim() || '';
    return wrap.querySelector('[data-link-custom]')?.value?.trim() || '';
  }

  async function bindPlanLinkField(root, planSlug = '') {
    const wrap = root.querySelector('[data-plan-link-field]');
    if (!wrap) return;
    const modeSelect = wrap.querySelector('[data-link-mode]');
    const internalSelect = wrap.querySelector('[data-link-internal]');
    const hidden = wrap.querySelector('[name="link_url"]');
    const slugInput = root.querySelector('[name="slug"]');
    const autoHint = wrap.querySelector('[data-link-auto-hint]');

    const updateAutoHint = () => {
      if (!autoHint) return;
      const slug = slugInput?.value?.trim() || planSlug || '';
      autoHint.textContent = planLinkAutoHint(slug);
    };
    slugInput?.addEventListener('input', updateAutoHint);
    updateAutoHint();

    modeSelect?.addEventListener('change', () => syncPlanLinkPanels(wrap));

    if (internalSelect) {
      const selected = internalSelect.dataset.linkValue || hidden?.value || '';
      try {
        const data = await fetchInternalLinks();
        internalSelect.innerHTML = internalLinkOptionsHtml(data.groups, selected);
      } catch (_) {
        internalSelect.innerHTML = '<option value="">โหลดรายการลิงก์ไม่สำเร็จ</option>';
      }
      internalSelect.addEventListener('change', () => {
        if (hidden) hidden.value = internalSelect.value;
      });
    }

    wrap.querySelector('[data-link-custom]')?.addEventListener('input', (e) => {
      if (hidden) hidden.value = e.target.value;
    });
  }

  function bindMediaPickButtons(root) {
    $$('[data-media-pick]', root).forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.mediaPick;
        openMediaPicker((path) => {
          const el = $(`[name="${field}"]`, root);
          if (el) {
            el.value = path;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      });
    });
  }

  function nowDatetimeLocalValue() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  function articleStatusDefault(row, isNew) {
    if (row?.status) return row.status;
    return isNew ? 'published' : 'draft';
  }

  function articlePublishedAtDefault(row, isNew) {
    if (row?.published_at) return String(row.published_at).slice(0, 16);
    return isNew ? nowDatetimeLocalValue() : '';
  }

  function collectFormData(formRoot) {
    const data = {};
    $$('[name]', formRoot).forEach((el) => {
      if (el.dataset.quillHidden === '1') return;
      if (el.type === 'checkbox') {
        data[el.name] = el.checked ? 1 : 0;
      } else if (el.type === 'number') {
        data[el.name] = el.value === '' ? null : Number(el.value);
      } else {
        data[el.name] = el.value;
      }
    });
    return data;
  }

  function badgeActive(isActive) {
    return isActive
      ? '<span class="badge badge--ok">เปิดใช้</span>'
      : '<span class="badge badge--muted">ปิด</span>';
  }

  function leadStatusBadge(status) {
    const map = { new: 'badge--new', contacted: 'badge--warn', closed: 'badge--muted' };
    const labels = { new: 'ใหม่', contacted: 'ติดต่อแล้ว', closed: 'ปิดแล้ว' };
    return `<span class="badge ${map[status] || 'badge--muted'}">${esc(labels[status] || status)}</span>`;
  }

  /** textarea ไม่มี type ที่แก้ได้ — ใช้ซ่อนด้วย display แทน */
  function hideFormField(el) {
    if (!el) return;
    el.dataset.quillHidden = '1';
    el.setAttribute('aria-hidden', 'true');
    el.tabIndex = -1;
    el.style.display = 'none';
  }

  function showFormField(el, opts = {}) {
    if (!el) return;
    delete el.dataset.quillHidden;
    el.removeAttribute('aria-hidden');
    el.tabIndex = 0;
    el.style.display = '';
    if (opts.rows && el.tagName === 'TEXTAREA') el.rows = opts.rows;
  }

  function isFormFieldQuillHidden(el) {
    return el?.dataset?.quillHidden === '1';
  }

  /* ——— Modal ——— */
  function destroyQuill() {
    quillEditor = null;
    $$('.quill-wrap', modalBody).forEach((wrap) => wrap.remove());
    ['body_html', 'full_description'].forEach((name) => {
      const fallback = $(`[name="${name}"]`, modalBody);
      if (fallback?.tagName === 'TEXTAREA' && isFormFieldQuillHidden(fallback)) {
        showFormField(fallback, { rows: name === 'full_description' ? 8 : 12 });
      } else if (fallback?.tagName === 'INPUT' && fallback.type === 'hidden') {
        fallback.type = 'text';
      }
    });
  }

  /** Normalize media path for storage in article/career HTML (site-root relative). */
  function contentMediaStorePath(path) {
    let p = String(path || '').trim();
    if (!p || /^https?:\/\//i.test(p) || p.startsWith('//') || p.startsWith('data:')) return p;
    p = p.replace(/^\//, '');
    while (p.startsWith('../')) p = p.slice(3);
    return p;
  }

  /** Path usable inside Quill while editing from /admin/v2/ */
  function contentMediaEditorSrc(path) {
    const p = String(path || '').trim();
    if (!p || /^https?:\/\//i.test(p) || p.startsWith('//') || p.startsWith('data:')) return p;
    return `../../${contentMediaStorePath(p)}`;
  }

  function normalizeQuillHtmlForSave(html) {
    return String(html || '').replace(
      /\b(src|href)=(["'])(?:\.\.\/)+(?!\/)([^"']+)\2/gi,
      (_, attr, quote, path) => `${attr}=${quote}${contentMediaStorePath(path)}${quote}`
    );
  }

  function normalizeQuillHtmlForEditor(html) {
    return String(html || '').replace(
      /\b(src|href)=(["'])(?!https?:|\/\/|data:|#|mailto:|\.\.\/)([^"']+)\2/gi,
      (_, attr, quote, path) => `${attr}=${quote}${contentMediaEditorSrc(path)}${quote}`
    );
  }

  function toVideoEmbedUrl(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    let m = raw.match(
      /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i
    );
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    m = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
    if (/^https?:\/\//i.test(raw)) return raw;
    return '';
  }

  function insertQuillEmbed(quill, type, url) {
    if (!quill || !url) return;
    const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
    quill.focus();
    quill.insertText(range.index, '\n', 'user');
    quill.insertEmbed(range.index + 1, type, url, 'user');
    quill.insertText(range.index + 2, '\n', 'user');
    quill.setSelection(range.index + 3, 0, 'user');
  }

  let linkPickerResolve = null;

  function ensureLinkPickerDialog() {
    let dlg = $('#link-picker-dialog');
    if (dlg) return dlg;

    dlg = document.createElement('dialog');
    dlg.id = 'link-picker-dialog';
    dlg.className = 'modal link-picker-dialog';
    dlg.innerHTML = `<form method="dialog" class="modal-inner">
      <header class="modal-head">
        <h2>ใส่ลิงก์</h2>
        <button type="button" class="modal-close" data-link-picker-cancel>×</button>
      </header>
      <div class="modal-body">
        <div class="form-field">
          <label for="link-picker-mode">ประเภทลิงก์</label>
          <select id="link-picker-mode">
            <option value="internal">ลิงก์ภายในเว็บ</option>
            <option value="external">URL ภายนอก</option>
          </select>
        </div>
        <div class="form-field" id="link-picker-internal-wrap">
          <label for="link-picker-internal">เลือกหน้า / บทความ / แผน</label>
          <select id="link-picker-internal"><option value="">กำลังโหลด...</option></select>
        </div>
        <div class="form-field" id="link-picker-external-wrap" hidden>
          <label for="link-picker-external">URL</label>
          <input type="text" id="link-picker-external" placeholder="https://line.me/... หรือ https://...">
        </div>
        <div class="form-field form-field--check">
          <label><input type="checkbox" id="link-picker-remove"> เอาลิงก์ออกจากข้อความที่เลือก</label>
        </div>
      </div>
      <footer class="modal-foot">
        <button type="button" class="btn btn--ghost" data-link-picker-cancel>ยกเลิก</button>
        <button type="submit" class="btn btn--primary">ตกลง</button>
      </footer>
    </form>`;
    document.body.appendChild(dlg);

    const mode = dlg.querySelector('#link-picker-mode');
    const internalWrap = dlg.querySelector('#link-picker-internal-wrap');
    const externalWrap = dlg.querySelector('#link-picker-external-wrap');
    mode.addEventListener('change', () => {
      const isInternal = mode.value === 'internal';
      internalWrap.hidden = !isInternal;
      externalWrap.hidden = isInternal;
    });

    const finish = (value) => {
      if (linkPickerResolve) {
        const resolve = linkPickerResolve;
        linkPickerResolve = null;
        resolve(value);
      }
    };

    dlg.querySelectorAll('[data-link-picker-cancel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        dlg.close('cancel');
        finish(null);
      });
    });

    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      dlg.close('cancel');
      finish(null);
    });

    dlg.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (dlg.querySelector('#link-picker-remove').checked) {
        dlg.close();
        finish('');
        return;
      }
      const isInternal = mode.value === 'internal';
      const url = isInternal
        ? dlg.querySelector('#link-picker-internal').value.trim()
        : dlg.querySelector('#link-picker-external').value.trim();
      if (!url) {
        toast(toastEl, 'กรุณาเลือกหรือใส่ลิงก์', true);
        return;
      }
      dlg.close();
      finish(url);
    });

    return dlg;
  }

  async function openLinkPickerDialog(currentUrl = '') {
    const dlg = ensureLinkPickerDialog();
    const internalSelect = dlg.querySelector('#link-picker-internal');
    const externalInput = dlg.querySelector('#link-picker-external');
    const modeSelect = dlg.querySelector('#link-picker-mode');
    const removeCb = dlg.querySelector('#link-picker-remove');

    removeCb.checked = false;
    const cur = String(currentUrl || '')
      .replace(/^\.\.\/\.\.\//, '')
      .trim();

    if (!cur) {
      modeSelect.value = 'internal';
      externalInput.value = '';
    } else if (/^https?:\/\//i.test(cur) || /^tel:/i.test(cur) || /^mailto:/i.test(cur)) {
      modeSelect.value = 'external';
      externalInput.value = cur;
    } else {
      modeSelect.value = 'internal';
      externalInput.value = '';
    }
    modeSelect.dispatchEvent(new Event('change'));

    try {
      const data = await fetchInternalLinks();
      internalSelect.innerHTML = internalLinkOptionsHtml(
        data.groups,
        modeSelect.value === 'internal' ? cur : ''
      );
    } catch (_) {
      internalSelect.innerHTML = '<option value="">โหลดรายการลิงก์ไม่สำเร็จ</option>';
    }

    return new Promise((resolve) => {
      linkPickerResolve = resolve;
      dlg.showModal();
    });
  }

  function attachQuillSelectionMemory(quill) {
    if (!quill || quill._cmsSelectionMemory) return;
    quill._cmsSelectionMemory = true;
    quill.on('selection-change', (range) => {
      if (range) quill._cmsLastRange = range;
    });
  }

  function bindQuillLinkHandler(quill) {
    const range = quill.getSelection() || quill._cmsLastRange;
    if (!range || range.length === 0) {
      toast(toastEl, 'เลือกข้อความที่ต้องการใส่ลิงก์ก่อน', true);
      return;
    }
    const savedRange = { index: range.index, length: range.length };
    const existing = quill.getFormat(range).link || '';
    const current = existing ? String(existing).replace(/^\.\.\/\.\.\//, '') : '';

    openLinkPickerDialog(current).then((url) => {
      if (url === null) return;
      quill.setSelection(savedRange.index, savedRange.length, 'silent');
      if (url === '') {
        quill.formatText(savedRange.index, savedRange.length, 'link', false, 'user');
        return;
      }
      const href = /^https?:\/\//i.test(url) || /^tel:/i.test(url) || /^mailto:/i.test(url)
        ? url
        : contentMediaEditorSrc(url);
      quill.formatText(savedRange.index, savedRange.length, 'link', href, 'user');
      quill.setSelection(savedRange.index + savedRange.length, 0, 'silent');
    });
  }

  function quillToolbarOptions(onImage, onVideo) {
    return {
      container: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        link() {
          bindQuillLinkHandler(this.quill);
        },
        image() {
          onImage(this.quill);
        },
        video() {
          onVideo(this.quill);
        },
      },
    };
  }

  function bindQuillImageHandler(quill) {
    openMediaPicker((path) => {
      insertQuillEmbed(quill, 'image', contentMediaEditorSrc(path));
    });
  }

  function bindQuillVideoHandler(quill) {
    const input = window.prompt(
      'วางลิงก์วิดีโอ YouTube หรือ Vimeo\n(เช่น https://www.youtube.com/watch?v=... หรือ https://youtu.be/...)',
      ''
    );
    if (input == null) return;
    const embed = toVideoEmbedUrl(input);
    if (!embed) {
      toast(toastEl, 'ลิงก์วิดีโอไม่ถูกต้อง — รองรับ YouTube และ Vimeo', true);
      return;
    }
    insertQuillEmbed(quill, 'video', embed);
  }

  function getQuillHtmlForSave(quill) {
    if (!quill) return '';
    return normalizeQuillHtmlForSave(quill.root.innerHTML);
  }

  function initQuillField(fieldName) {
    if (typeof Quill === 'undefined') return;
    const hidden = $(`[name="${fieldName}"]`, modalBody);
    if (!hidden?.parentElement) return;

    const mountId = `quill-mount-${Date.now()}`;
    if (hidden.tagName === 'TEXTAREA') hideFormField(hidden);
    else hidden.type = 'hidden';
    const wrap = document.createElement('div');
    wrap.className = 'quill-wrap form-field--full';
    wrap.innerHTML = `<label>${fieldName === 'full_description' ? 'รายละเอียดแผน' : 'เนื้อหา (HTML)'}</label><div id="${mountId}" class="quill-mount"></div><p class="quill-media-hint muted">เลือกข้อความแล้วกดปุ่มลิงก์เพื่อเลือกหน้าในเว็บ / บทความ · แทรกรูปและวิดีโอได้จากแถบเครื่องมือ</p>`;
    hidden.parentElement.appendChild(wrap);

    const mount = document.getElementById(mountId);
    if (!mount) return;

    try {
      quillEditor = new Quill(mount, {
        theme: 'snow',
        modules: {
          toolbar: quillToolbarOptions(bindQuillImageHandler, bindQuillVideoHandler),
        },
      });
      attachQuillSelectionMemory(quillEditor);
      quillEditor.root.innerHTML = normalizeQuillHtmlForEditor(hidden.value || '');
    } catch (err) {
      console.error('Quill init failed:', err);
      wrap.remove();
      if (hidden.tagName === 'TEXTAREA') showFormField(hidden, { rows: 14 });
      else hidden.type = 'text';
      quillEditor = null;
    }
  }

  function initRichQuillField(mountEl, hiddenEl, options = {}) {
    if (typeof Quill === 'undefined' || !mountEl || !hiddenEl) return null;
    mountEl.innerHTML = '';
    try {
      const quill = new Quill(mountEl, {
        theme: 'snow',
        modules: {
          toolbar: quillToolbarOptions(bindQuillImageHandler, bindQuillVideoHandler),
        },
      });
      attachQuillSelectionMemory(quill);
      quill.root.innerHTML = normalizeQuillHtmlForEditor(hiddenEl.value || '');
      const sync = () => {
        hiddenEl.value = getQuillHtmlForSave(quill);
        options.onChange?.(hiddenEl.value);
      };
      quill.on('text-change', sync);
      mountEl._cmsQuill = quill;
      return quill;
    } catch (err) {
      console.error('Rich Quill init failed:', err);
      mountEl.innerHTML = '';
      mountEl._cmsQuill = null;
      return null;
    }
  }

  function destroyRichQuillIn(root) {
    if (!root) return;
    root.querySelectorAll('[data-cms-quill-mount]').forEach((mount) => {
      mount._cmsQuill = null;
      mount.innerHTML = '';
    });
  }

  function syncRichQuillIn(root) {
    if (!root) return;
    root.querySelectorAll('[data-cms-quill-mount]').forEach((mount) => {
      const quill = mount._cmsQuill;
      const name = mount.dataset.richFor;
      const hidden = name ? root.querySelector(`[data-f="${name}"]`) : null;
      if (quill && hidden) {
        hidden.value = getQuillHtmlForSave(quill);
      }
    });
  }

  window.CmsQuill = {
    initField: initRichQuillField,
    destroyIn: destroyRichQuillIn,
    syncIn: syncRichQuillIn,
    getHtml: getQuillHtmlForSave,
  };

  function openModal(title, bodyHtml, onSave, opts = {}) {
    destroyQuill();
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modalSaveHandler = onSave;
    bindMediaPickButtons(modalBody);
    modal.showModal();

    if (opts.quillField) {
      requestAnimationFrame(() => initQuillField(opts.quillField));
    }

    window.FieldHint?.attach(modalBody);
    if (opts.onOpen) opts.onOpen(modalBody);
  }

  function ctaVariantLabel(variant) {
    const map = { '': 'โทร', line: 'LINE', facebook: 'Facebook' };
    return map[variant ?? ''] ?? variant ?? '—';
  }

  function ctaChannelForm(row) {
    const r = row || {};
    return `<div class="form-grid form-grid--stacked">
      ${input('label', 'ชื่อที่แสดง', r.label, 'text', {
        required: true,
        placeholder: 'เช่น คุณ แต้ม',
      })}
      ${select(
        'variant',
        'ประเภท / ไอคอน',
        [
          { value: '', label: 'โทร / ทั่วไป' },
          { value: 'line', label: 'LINE' },
          { value: 'facebook', label: 'Facebook' },
        ],
        r.variant || ''
      )}
      ${input('value_text', 'ข้อความรอง', r.value_text, 'text', {
        placeholder: 'เช่น โทร · 087-046-7443',
        full: true,
      })}
      ${input('url', 'ลิงก์ (URL)', r.url, 'text', {
        placeholder: 'tel:0870467443 หรือ https://line.me/...',
        full: true,
      })}
      ${input('channel_key', 'คีย์ระบบ', r.channel_key, 'text', {
        placeholder: 'เช่น tam_phone',
        hint: 'ไม่แสดงบนเว็บ — ระบบใช้จัดการเท่านั้น',
      })}
      ${checkbox('is_active', 'แสดงบนเว็บ', row ? !!r.is_active : true)}
    </div>`;
  }

  function emptyContactProfile() {
    return {
      eyebrow: '',
      h2: '',
      photo: '',
      lead: '',
      body: '',
      license: '',
      email: '',
      phone: '',
      phoneTel: '',
      lineUrl: '',
      facebookUrl: '',
      facebookLabel: '',
    };
  }

  function normalizeContactProfile(raw) {
    const a = { ...emptyContactProfile(), ...(raw && typeof raw === 'object' ? raw : {}) };
    if (!a.phoneTel && a.phone) a.phoneTel = String(a.phone).replace(/\D+/g, '');
    if (!a.facebookLabel && a.facebookUrl) {
      a.facebookLabel = String(a.facebookUrl)
        .replace(/^https?:\/\/(www\.)?/i, '')
        .replace(/\/$/, '');
    }
    return a;
  }

  function contactProfilePhotoSrc(path) {
    const p = String(path || '').trim();
    if (!p) return '';
    if (/^https?:\/\//i.test(p) || p.startsWith('data:')) return p;
    return `../../${p.replace(/^\//, '')}`;
  }

  function contactProfileFormHtml(agent) {
    const a = normalizeContactProfile(agent);
    return `<div class="form-grid">
      ${input('h2', 'ชื่อที่แสดง', a.h2, 'text', {
        required: true,
        full: true,
        placeholder: 'เช่น คุณ จักรี น้อยดอนไพร (แต้ม)',
      })}
      ${input('eyebrow', 'ตำแหน่ง', a.eyebrow, 'text', {
        full: true,
        placeholder: 'เช่น ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา',
      })}
      ${mediaPickField('photo', 'รูปโปรไฟล์ (1:1)', a.photo || '')}
      ${textarea('lead', 'ย่อหน้าแรก (หน้าเกี่ยวกับเรา)', a.lead || '', 3, {
        full: true,
        hint: 'ข้อความแนะนำสั้น ๆ ด้านบนของโปรไฟล์ในหน้าเกี่ยวกับเรา',
      })}
      ${textarea('body', 'ข้อความเพิ่มเติม (หน้าเกี่ยวกับเรา)', a.body || '', 5, {
        full: true,
        hint: 'คั่นย่อหน้าด้วยบรรทัดว่าง — แสดงใต้ย่อหน้าแรก',
      })}
      ${input('phone', 'เบอร์โทร (แสดง)', a.phone, 'text', {
        placeholder: '087-046-7443',
      })}
      ${input('phoneTel', 'เบอร์สำหรับกดโทร', a.phoneTel, 'text', {
        placeholder: '0870467443',
        hint: 'ตัวเลขล้วน — ว่างไว้ระบบเติมจากเบอร์โทร',
      })}
      ${input('lineUrl', 'ลิงก์ LINE', a.lineUrl, 'text', {
        full: true,
        placeholder: 'https://line.me/R/ti/p/~...',
      })}
      ${input('facebookUrl', 'ลิงก์ Facebook', a.facebookUrl, 'text', {
        full: true,
        placeholder: 'https://www.facebook.com/...',
      })}
      ${input('facebookLabel', 'ข้อความ Facebook', a.facebookLabel, 'text', {
        full: true,
        placeholder: 'facebook.com/username',
      })}
      ${input('email', 'อีเมลรับฟอร์มติดต่อ', a.email, 'email', {
        full: true,
        hint: 'เมลเมื่อลูกค้าเลือกตัวแทนคนนี้ในฟอร์มติดต่อ — ว่างไว้ส่งหาคุณแต้ม',
      })}
      ${input('license', 'เลขใบอนุญาต', a.license)}
    </div>`;
  }

  function contactProfileCardHtml(agent, index) {
    const a = normalizeContactProfile(agent);
    const photo = contactProfilePhotoSrc(a.photo);
    const thumb = photo
      ? `<img src="${esc(photo)}" alt="" loading="lazy">`
      : `<span>${esc((a.h2 || '?').trim().charAt(0) || '?')}</span>`;
    const chips = [
      a.phone ? `<span class="cta-profile-chip cta-profile-chip--phone">โทร ${esc(a.phone)}</span>` : '',
      a.lineUrl ? `<span class="cta-profile-chip cta-profile-chip--line">LINE</span>` : '',
      a.facebookUrl ? `<span class="cta-profile-chip cta-profile-chip--fb">Facebook</span>` : '',
    ]
      .filter(Boolean)
      .join('');
    return `<article class="cta-profile-card" data-cta-profile="${index}">
      <div class="cta-profile-card__head">
        <div class="cta-profile-card__photo">${thumb}</div>
        <div class="cta-profile-card__meta">
          <h3 class="cta-profile-card__name">${esc(a.h2 || 'โปรไฟล์ใหม่')}</h3>
          <p class="cta-profile-card__role">${esc(a.eyebrow || 'ยังไม่ระบุตำแหน่ง')}</p>
        </div>
        <div class="cta-profile-card__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-cta-edit="${index}">แก้ไข</button>
          <button type="button" class="btn btn--ghost btn--sm btn--danger-ghost" data-cta-del="${index}">ลบ</button>
        </div>
      </div>
      <div class="cta-profile-card__channels">${chips || '<span class="muted">ยังไม่มีช่องทางติดต่อ</span>'}</div>
    </article>`;
  }

  function closeModal() {
    modalPausedForMediaPick = false;
    destroyQuill();
    modal.close();
    modalSaveHandler = null;
    modalBody.innerHTML = '';
  }

  function suspendModalForMediaPick() {
    if (modal?.open) {
      modalPausedForMediaPick = true;
      modal.close();
    }
  }

  function resumeModalAfterMediaPick() {
    if (!modalPausedForMediaPick) return;
    modalPausedForMediaPick = false;
    if (modalSaveHandler && modalBody.innerHTML.trim()) {
      modal.showModal();
    }
  }

  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);

  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!modalSaveHandler) return;
    const saveBtn = $('#modal-save');
    saveBtn.disabled = true;
    try {
      await modalSaveHandler();
      closeModal();
    } catch (err) {
      toast(toastEl, err.message || 'บันทึกไม่สำเร็จ', true);
    } finally {
      saveBtn.disabled = false;
    }
  });

  /* ——— Sortable ——— */
  function destroyPlanBuilder() {
    if (window.__ipbInstance) {
      window.__ipbInstance.destroy();
      window.__ipbInstance = null;
    }
    content?.classList.remove('is-page-builder', 'plans-hub--builder', 'content--gpb');
  }

  function destroySortables() {
    destroyPlanBuilder();
    sortableInstances.forEach((s) => s.destroy());
    sortableInstances = [];
  }

  function initSortable(tbody, reorderPath) {
    if (!tbody || typeof Sortable === 'undefined') return;
    const inst = Sortable.create(tbody, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: async () => {
        const ids = $$('tr[data-id]', tbody).map((tr) => Number(tr.dataset.id));
        try {
          await api(reorderPath, { method: 'POST', body: { ids } });
          await publishAfterSave('จัดลำดับและอัปเดตหน้าเว็บแล้ว');
        } catch (err) {
          toast(toastEl, err.message, true);
          renderRoute(currentRoute);
        }
      },
    });
    sortableInstances.push(inst);
  }

  function initLocalSortable(el) {
    if (!el || typeof Sortable === 'undefined') return;
    const inst = Sortable.create(el, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
    });
    sortableInstances.push(inst);
  }

  /* ——— Sidebar / router ——— */
  function renderSidebar() {
    sidebarNav.innerHTML = MENU.map(
      (m) =>
        `<a href="#${m.id}" data-route="${m.id}" class="${m.id === currentRoute ? 'is-active' : ''}">
          <span class="nav-icon">${navIcon(m.id)}</span>${esc(m.label)}
        </a>`
    ).join('');
    $$('[data-route]', sidebarNav).forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(a.dataset.route);
        closeSidebarMobile();
      });
    });
  }

  function parseAppHash() {
    const h = (location.hash || '#dashboard').slice(1);
    const m = h.match(/^articles\/edit\/(.+)$/);
    if (m) {
      const idPart = m[1];
      return {
        kind: 'article-edit',
        articleId: idPart === 'new' ? null : Number(idPart),
      };
    }
    const parts = h.split('/').filter(Boolean);
    if (parts[0] === 'insurance-pages') {
      return { kind: 'route', route: 'plans', subRoute: null, planId: null };
    }
    if (parts[0] === 'plans' && parts[1] === 'builder' && parts[2]) {
      return {
        kind: 'route',
        route: 'plans',
        subRoute: 'builder',
        planId: Number(parts[2]) || null,
      };
    }
    const route = parts[0] || 'dashboard';
    return {
      kind: 'route',
      route: MENU.some((x) => x.id === route) ? route : 'dashboard',
      subRoute: parts[1] || null,
      planId: null,
    };
  }

  function getPlanBuilderId() {
    const p = parseAppHash();
    if (p.route === 'plans' && p.subRoute === 'builder' && p.planId) {
      return p.planId;
    }
    return null;
  }

  const PLAN_PAGE_KEYS = {
    life: 'lifeInsurance',
    health: 'healthInsurance',
    savings: 'savingsRetirement',
  };

  function planPageKeyForRow(plan) {
    const tag = String(plan?.filter_tag || 'life');
    return PLAN_PAGE_KEYS[tag] || PLAN_PAGE_KEYS.life;
  }

  /** บิวเดอร์แยกต่อแผน — ไม่ใช้บิวเดอร์รวมของหมวด */
  function planBuilderPageKey(plan) {
    return `plan-${Number(plan?.id) || 0}`;
  }

  function findPlanCardId(plan, sections) {
    const cards = sections?.find((s) => s.key === 'planCards')?.data?.cards || [];
    if (!cards.length) return null;
    const slug = String(plan?.slug || '').trim().toLowerCase();
    const name = String(plan?.name || '').trim().toLowerCase();
    const norm = (s) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
    for (const card of cards) {
      if (card.type === 'dropZone') continue;
      const id = String(card.id || '').toLowerCase();
      const anchor = String(card.anchorId || card.id || '').toLowerCase();
      const title = norm(card.title);
      if (slug && (id === slug || anchor === slug)) return card.id;
      if (slug && (anchor.includes(slug) || slug.includes(anchor))) return card.id;
      if (name && title && (title === name || title.includes(name) || name.includes(title))) return card.id;
    }
    return null;
  }

  function findMatchingPlanCard(plan, cards) {
    const list = Array.isArray(cards) ? cards : [];
    const slug = String(plan?.slug || '').trim().toLowerCase();
    const name = String(plan?.name || '').trim().toLowerCase();
    const norm = (s) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
    for (const card of list) {
      if (!card || card.type === 'dropZone') continue;
      const id = String(card.id || '').toLowerCase();
      const anchor = String(card.anchorId || card.id || '').toLowerCase();
      const title = norm(card.title);
      if (slug && (id === slug || anchor === slug)) return card;
      if (slug && (anchor.includes(slug) || slug.includes(anchor))) return card;
      if (name && title && (title === name || title.includes(name) || name.includes(title))) return card;
    }
    return null;
  }

  async function ensurePlanBuilderSections(plan) {
    const IPF = window.InsurancePageForms;
    const pageKey = planBuilderPageKey(plan);
    if (!plan?.id || !IPF) return pageKey;

    const existing = await api(`/sections?page_key=${encodeURIComponent(pageKey)}`);
    if ((existing.sections || []).some((s) => s.section_key === 'planCards')) {
      return pageKey;
    }

    const catKey = planPageKeyForRow(plan);
    const catData = await api(`/sections?page_key=${encodeURIComponent(catKey)}`);
    const byKey = {};
    (catData.sections || []).forEach((s) => {
      byKey[s.section_key] = s;
    });

    const slug = planSlugForRow(plan);
    const catCards = byKey.planCards?.config?.cards || [];
    const cards = collectCategoryCardsForPlan(plan, catCards);

    const keys = IPF.sectionKeys || [];
    for (let i = 0; i < keys.length; i++) {
      const sk = keys[i];
      const src = byKey[sk];
      let config = src?.config ? JSON.parse(JSON.stringify(src.config)) : IPF.merge(catKey, sk, {});
      if (sk === 'planCards') {
        config = { ...(config || {}), cards };
      }
      if (sk === 'hero') {
        config = { ...(config || {}), h1: plan.name || config.h1 || '' };
      }
      await api(`/sections/${sk}`, {
        method: 'PUT',
        body: {
          page_key: pageKey,
          title: IPF.sectionMeta?.[sk]?.title || sk,
          config,
          is_active: src?.is_active === 0 || src?.is_active === false ? 0 : 1,
          sort_order: i,
          skip_build: true,
        },
      });
    }
    return pageKey;
  }

  async function syncPlanBuilderFromCategory(plan, builder) {
    const IPF = window.InsurancePageForms;
    const pageKey = planBuilderPageKey(plan);
    if (!plan?.id || !IPF || !builder) return;

    const catKey = planPageKeyForRow(plan);
    const catData = await api(`/sections?page_key=${encodeURIComponent(catKey)}`);
    const byKey = {};
    (catData.sections || []).forEach((s) => {
      byKey[s.section_key] = s;
    });
    const cards = collectCategoryCardsForPlan(plan, byKey.planCards?.config?.cards || []);
    if (!cards.length) {
      toast(toastEl, 'ไม่พบเนื้อหาแผนนี้ในบิวเดอร์หมวด', true);
      return;
    }

    const keys = IPF.sectionKeys || [];
    for (let i = 0; i < keys.length; i++) {
      const sk = keys[i];
      const src = byKey[sk];
      if (!src?.config && sk !== 'planCards') continue;
      let config = src?.config ? JSON.parse(JSON.stringify(src.config)) : IPF.merge(catKey, sk, {});
      if (sk === 'planCards') {
        config = { ...(config || {}), cards };
      }
      if (sk === 'hero') {
        config = { ...(config || {}), h1: plan.name || config.h1 || '' };
      }
      await api(`/sections/${sk}`, {
        method: 'PUT',
        body: {
          page_key: pageKey,
          title: IPF.sectionMeta?.[sk]?.title || sk,
          config,
          is_active: src?.is_active === 0 || src?.is_active === false ? 0 : 1,
          sort_order: i,
          skip_build: true,
        },
      });
    }

    await builder.load(pageKey);
    const cardId = findPlanCardId(plan, builder.state.sections);
    if (cardId) builder.select('planCards', { cardId });
    else builder.select('planCards');
    toast(toastEl, 'ดึงเนื้อหาจากบิวเดอร์หมวดแล้ว — กดบันทึกเพื่อเผยแพร่หน้าเว็บ');
  }

  function applyRouteFromHash() {
    const p = parseAppHash();
    if (p.kind === 'article-edit') {
      currentRoute = 'articles';
      pageTitle.textContent = p.articleId ? 'แก้ไขบทความ' : 'เพิ่มบทความ';
      renderSidebar();
      renderArticleEditorPage(p.articleId);
      return;
    }
    const route = p.route;
    currentRoute = route;
    const item = MENU.find((m) => m.id === route);
    if (route === 'plans' && p.subRoute === 'builder' && p.planId) {
      pageTitle.textContent = 'บิวเดอร์แผนประกัน';
    } else {
      pageTitle.textContent = item ? item.label : 'Dashboard';
    }
    renderSidebar();
    renderRoute(route);
  }

  function navigate(route) {
    if (!MENU.some((m) => m.id === route)) route = 'dashboard';
    location.hash = route;
    applyRouteFromHash();
  }

  function closeSidebarMobile() {
    sidebar.classList.remove('is-open');
    $('.sidebar-overlay')?.classList.remove('is-open');
  }

  function openSidebarMobile() {
    let overlay = $('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.addEventListener('click', closeSidebarMobile);
      document.body.appendChild(overlay);
    }
    overlay.classList.add('is-open');
    sidebar.classList.add('is-open');
  }

  sidebarOpen?.addEventListener('click', openSidebarMobile);
  sidebarClose?.addEventListener('click', closeSidebarMobile);

  window.addEventListener('hashchange', applyRouteFromHash);

  /* ——— Auth ——— */
  async function checkSession() {
    try {
      const data = await api('/auth/me');
      if (data?.user) {
        currentUser = data.user;
        showApp();
        return true;
      }
    } catch (_) {
      /* not logged in */
    }
    showLogin();
    return false;
  }

  function showLogin() {
    document.body.classList.remove('is-authed');
    loginScreen.hidden = false;
    loginScreen.removeAttribute('aria-hidden');
    app.hidden = true;
    app.setAttribute('aria-hidden', 'true');
    currentUser = null;
  }

  function showApp() {
    document.body.classList.add('is-authed');
    loginScreen.hidden = true;
    loginScreen.setAttribute('aria-hidden', 'true');
    app.hidden = false;
    app.removeAttribute('aria-hidden');
    renderSidebarUser();
    applyRouteFromHash();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const fd = new FormData(loginForm);
    if (submitBtn) submitBtn.disabled = true;
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { username: fd.get('username'), password: fd.get('password') },
      });
      if (!data?.user) {
        throw new Error('เข้าสู่ระบบไม่สำเร็จ — ไม่ได้รับข้อมูลผู้ใช้');
      }
      currentUser = data.user;
      showApp();
      toast(toastEl, 'เข้าสู่ระบบสำเร็จ');
    } catch (err) {
      loginError.textContent = err.message || 'เข้าสู่ระบบไม่สำเร็จ';
      loginError.hidden = false;
      showLogin();
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await api('/auth/logout', { method: 'POST', body: {} });
    } catch (_) {
      /* ignore */
    }
    showLogin();
    location.hash = '';
  });

  /**
   * Admin table — โครงสร้าง table มาตรฐาน + class ตามประเภทข้อมูล (จัดแนวเท่านั้น)
   * ประเภท: primary | text | code | meta | number | status | date | flag | drag | actions
   */
  const COLUMN_TYPE_BY_KEY = {
    label: 'primary',
    name: 'primary',
    title: 'primary',
    customer_name: 'primary',
    alt_text: 'primary',
    url: 'code',
    slug: 'code',
    email: 'code',
    phone: 'code',
    image_path: 'code',
    username: 'code',
    location: 'meta',
    placement: 'meta',
    filter_tag: 'meta',
    role: 'meta',
    interest: 'meta',
    aspect_ratio: 'meta',
    customer_role: 'text',
    insurer_name: 'text',
    sort_order: 'number',
    rating: 'number',
    is_active: 'status',
    status: 'status',
    is_featured: 'flag',
    is_hot: 'flag',
    published_at: 'date',
    created_at: 'date',
  };

  function columnType(col) {
    if (col.type) return col.type;
    return COLUMN_TYPE_BY_KEY[col.key] || 'text';
  }

  function tableThClass(col) {
    return `admin-table__th admin-table__th--${columnType(col)}`;
  }

  function tableTdClass(col) {
    return `admin-table__td admin-table__td--${columnType(col)}`;
  }

  function formatTableCell(row, col) {
    if (col.render) return col.render(row);
    return esc(row[col.key] ?? '');
  }

  function renderPinCell(row, opts = {}) {
    const on = !!row.is_featured;
    const inActions = !!opts.inActions;
    const label = inActions ? (on ? '📌' : 'ปักหมุด') : on ? '📌' : '○';
    const btnClass = inActions ? `btn btn--ghost btn--sm btn-pin${on ? ' is-pinned' : ''}` : `btn-pin${on ? ' is-pinned' : ''}`;
    return `<button type="button" class="${btnClass}" data-pin="${row.id}" title="${on ? 'ยกเลิกปักหมุด' : 'ปักหมุดไว้ด้านบน'}">${label}</button>`;
  }

  const PIN_COLUMN = {
    key: 'is_featured',
    label: 'ปักหมุด',
    type: 'flag',
    render: (r) => renderPinCell(r),
  };

  /* ——— Generic CRUD table ——— */
  function crudTableHtml(rows, columns, opts = {}) {
    const sortable = opts.sortable;
    const tbodyClass = sortable ? 'admin-table__body sortable-list' : 'admin-table__body';
    const colSpan = columns.length + (sortable ? 2 : 1);
    const extraActions = typeof opts.extraActions === 'function' ? opts.extraActions : () => '';

    const head = columns
      .map((c) => `<th class="${tableThClass(c)}" scope="col">${esc(c.label)}</th>`)
      .join('');

    const body = rows.length
      ? rows
          .map((row) => {
            const cells = columns
              .map((c) => `<td class="${tableTdClass(c)}">${formatTableCell(row, c)}</td>`)
              .join('');
            const drag = sortable
              ? '<td class="admin-table__td admin-table__td--drag drag-handle" title="ลากจัดลำดับ" aria-label="จัดลำดับ">⋮⋮</td>'
              : '';
            return `<tr data-id="${row.id}">${drag}${cells}<td class="admin-table__td admin-table__td--actions"><div class="table-actions" role="group" aria-label="จัดการ">${extraActions(row)}<button type="button" class="btn btn--ghost btn--sm" data-edit="${row.id}">แก้ไข</button><button type="button" class="btn btn--danger btn--sm" data-del="${row.id}">ลบ</button></div></td></tr>`;
          })
          .join('')
      : `<tr><td colspan="${colSpan}" class="admin-table__empty">ยังไม่มีข้อมูล</td></tr>`;

    const dragHead = sortable
      ? '<th class="admin-table__th admin-table__th--drag" scope="col" aria-label="จัดลำดับ"></th>'
      : '';

    return `<div class="admin-table-wrap">
<table class="admin-table">
<thead>
<tr>${dragHead}${head}<th class="admin-table__th admin-table__th--actions" scope="col">จัดการ</th></tr>
</thead>
<tbody class="${tbodyClass}">
${body}
</tbody>
</table>
</div>`;
  }

  function bindCrudActions(resource, loadFn, formFn, opts = {}) {
    const root = opts.root || content;
    const base = `/${resource}`;
    const reorderPath = opts.reorderPath || `${base}/reorder`;

    if (root._crudClickHandler) {
      root.removeEventListener('click', root._crudClickHandler);
    }

    const onRootClick = async (e) => {
      const addBtn = e.target.closest('[data-add]');
      if (addBtn && root.contains(addBtn)) {
        if (opts.onAdd) {
          opts.onAdd();
          return;
        }
        openModal(opts.addTitle || 'เพิ่มรายการ', formFn(null), async () => {
          const body = opts.collectForm ? opts.collectForm() : collectFormData(modalBody);
          if (opts.beforeSave) opts.beforeSave(body, null);
          await api(base, { method: 'POST', body });
          await publishAfterSave('เพิ่มข้อมูลและอัปเดตหน้าเว็บแล้ว');
          await loadFn();
        }, opts.modalOpts);
        return;
      }

      const editBtn = e.target.closest('[data-edit]');
      if (editBtn && root.contains(editBtn)) {
        const id = editBtn.dataset.edit;
        if (!id) return;
        if (opts.onEdit) {
          opts.onEdit(id);
          return;
        }
        try {
          const row = await api(`${base}/${id}`);
          openModal(opts.editTitle || 'แก้ไข', formFn(row), async () => {
            const body = opts.collectForm ? opts.collectForm(row) : collectFormData(modalBody);
            if (quillEditor && opts.modalOpts?.quillField) {
              body[opts.modalOpts.quillField] = getQuillHtmlForSave(quillEditor);
            }
            if (opts.beforeSave) opts.beforeSave(body, row);
            await api(`${base}/${id}`, { method: 'PUT', body });
            await publishAfterSave('บันทึกและอัปเดตหน้าเว็บแล้ว');
            await loadFn();
          }, opts.modalOpts);
        } catch (err) {
          toast(toastEl, err.message, true);
        }
        return;
      }

      const delBtn = e.target.closest('[data-del]');
      if (delBtn && root.contains(delBtn)) {
        if (!confirmDelete(opts.deleteMsg)) return;
        try {
          await api(`${base}/${delBtn.dataset.del}`, { method: 'DELETE' });
          await publishAfterSave('ลบและอัปเดตหน้าเว็บแล้ว');
          await loadFn();
        } catch (err) {
          toast(toastEl, err.message, true);
        }
        return;
      }

      const pinBtn = e.target.closest('[data-pin]');
      if (pinBtn && root.contains(pinBtn)) {
        const id = pinBtn.dataset.pin;
        if (!id) return;
        const isPinned = pinBtn.classList.contains('is-pinned');
        try {
          await api(`${base}/${id}`, { method: 'PUT', body: { is_featured: isPinned ? 0 : 1 } });
          await publishAfterSave(isPinned ? 'ยกเลิกปักหมุดแล้ว' : 'ปักหมุดไว้ด้านบนแล้ว — อัปเดตหน้าเว็บแล้ว');
          await loadFn();
        } catch (err) {
          toast(toastEl, err.message, true);
        }
      }
    };

    root._crudClickHandler = onRootClick;
    root.addEventListener('click', onRootClick);

    if (opts.sortable) {
      initSortable($('.sortable-list', root), reorderPath);
    }
  }

  /* ——— Modules ——— */
  async function renderDashboard() {
    destroySortables();
    content.innerHTML = '<div class="dash-loading"><p class="muted">กำลังโหลด...</p></div>';
    try {
      const stats = await api('/dashboard/stats');
      const shortcuts = DASHBOARD_SHORTCUTS.map(
        (item) => `<button type="button" class="shortcut-card" data-route="${item.route}">
          <span class="shortcut-card__icon">${navIcon(item.route)}</span>
          <span class="shortcut-card__label">${esc(item.label)}</span>
        </button>`
      ).join('');

      content.innerHTML = `
        <div class="dash-home">
          <header class="dash-hero panel">
            <div class="dash-hero__text">
              <p class="dash-hero__eyebrow">ภาพรวมระบบ</p>
              <h2 class="dash-hero__title">แดชบอร์ด</h2>
              <p class="muted dash-hero__desc">จัดการเนื้อหา แผนประกัน บทความ และข้อมูลติดต่อจากศูนย์กลาง — บันทึกแล้วอัปเดตหน้าเว็บอัตโนมัติ</p>
            </div>
          </header>

          <div class="dash-stats" aria-label="สรุปข้อมูล">
            ${statCard(stats.articles, 'บทความเผยแพร่', 'articles', 'blue')}
            ${statCard(stats.articlesDraft, 'บทความแบบร่าง', 'draft', 'slate')}
            ${statCard(stats.plans, 'แผนประกันเปิดใช้', 'plans', 'indigo')}
            ${statCard(stats.testimonials ?? 0, 'รีวิวลูกค้า', 'reviews', 'violet')}
          </div>

          <section class="panel dash-shortcuts">
            <div class="panel-head dash-shortcuts__head">
              <div>
                <h2>แก้ไขตามส่วน</h2>
                <p class="muted">เลือกเมนูด้านซ้ายหรือคลิกด้านล่างเพื่อแก้ไขแต่ละส่วนของเว็บ</p>
              </div>
            </div>
            <div class="panel-body">
              <div class="shortcut-grid">${shortcuts}</div>
            </div>
          </section>
        </div>`;

      $$('.shortcut-card[data-route]', content).forEach((btn) => {
        btn.addEventListener('click', () => navigate(btn.dataset.route));
      });

    } catch (err) {
      content.innerHTML = `<div class="panel"><div class="panel-body"><p class="form-error">${esc(err.message)}</p></div></div>`;
    }
  }

  async function renderNav() {
    destroySortables();
    content.innerHTML = panelShell('เมนูนำทาง', '<p class="muted">กำลังโหลด...</p>');
    const load = async () => {
      const rows = await api('/nav');
      const panel = $('.panel-body', content);
      panel.innerHTML = `
        <div class="toolbar">
          <button type="button" class="btn btn--primary" data-add>+ เพิ่มเมนู</button>
        </div>
        ${crudTableHtml(rows, [
          { key: 'label', label: 'ชื่อ' },
          { key: 'url', label: 'ลิงก์' },
          { key: 'location', label: 'ตำแหน่ง' },
          { key: 'sort_order', label: 'ลำดับ' },
          { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
        ], { sortable: true })}`;

      bindCrudActions('nav', load, (row) => {
        const r = row || {};
        return `<div class="form-grid">
          ${input('label', 'ชื่อเมนู', r.label, 'text', { required: true })}
          ${input('url', 'URL', r.url || 'index.html', 'text', { required: true })}
          ${select('location', 'ตำแหน่ง', [
            { value: 'header', label: 'หัวเว็บ (header)' },
            { value: 'footer_main', label: 'ท้ายเว็บ — เมนูหลัก' },
            { value: 'footer_products', label: 'ท้ายเว็บ — ผลิตภัณฑ์' },
          ], r.location || 'header')}
          ${select('target', 'เปิดใน', [
            { value: '_self', label: 'หน้าเดิม' },
            { value: '_blank', label: 'แท็บใหม่' },
          ], r.target || '_self')}
          ${input('sort_order', 'ลำดับ', r.sort_order ?? 0, 'number')}
          ${checkbox('is_cta', 'ปุ่ม CTA', !!r.is_cta)}
          ${checkbox('is_active', 'เปิดใช้งาน', row ? !!r.is_active : true)}
        </div>`;
      }, {
        sortable: true,
        addTitle: 'เพิ่มเมนู',
        editTitle: 'แก้ไขเมนู',
        deleteMsg: 'ลบรายการเมนูนี้?',
      });
    };
    await load();
  }

  async function renderHome() {
    destroySortables();
    content.innerHTML = `
      <div class="home-editor">
        <p class="muted home-editor__note">หลังบันทึกแต่ละส่วน ระบบจะสร้างหน้าเว็บให้อัตโนมัติ — รีเฟรชหน้าแรก (Ctrl+F5) เพื่อดูผล</p>
        <div class="home-editor__tabs">
          <button type="button" class="tab is-active" data-home-tab="sections">ส่วนหน้าแรก</button>
          <button type="button" class="tab" data-home-tab="hero">สไลด์ Hero</button>
        </div>
        <div class="home-editor__bar" id="home-sticky-bar" hidden>
          <span class="home-editor__bar-label" id="home-sticky-label">เลือกส่วนที่ต้องการแก้ไข</span>
          <button type="button" class="btn btn--primary btn--sm" id="home-sticky-save">บันทึกส่วนนี้</button>
        </div>
        <div id="home-panel"></div>
      </div>`;

    let tab = 'sections';
    const panel = $('#home-panel');
    const stickyBar = $('#home-sticky-bar');
    const stickyLabel = $('#home-sticky-label');
    const stickySave = $('#home-sticky-save');

    const sectionConfigStore = {};

    function updateStickyBar() {
      if (tab !== 'sections') {
        stickyBar.hidden = true;
        return;
      }
      const open = panel.querySelector('.home-acc[open]');
      if (!open) {
        stickyBar.hidden = true;
        return;
      }
      const key = open.dataset.section;
      const HSF = window.HomeSectionForms;
      const title = HSF?.meta?.[key]?.title || key;
      stickyLabel.textContent = `กำลังแก้: ${title}`;
      stickyBar.hidden = false;
    }

    async function saveSection(key, card) {
      const HSF = window.HomeSectionForms;
      const actEl = $(`[name="active-${key}"]`, card);
      const existing = sectionConfigStore[key] || {};
      let config;
      try {
        config = HSF?.readConfig
          ? HSF.readConfig(key, card, existing)
          : JSON.parse($(`[name="config-${key}"]`, card)?.value || '{}');
      } catch (err) {
        toast(toastEl, err.message || 'ข้อมูลไม่ถูกต้อง', true);
        return;
      }
      const btn = stickySave;
      const prevLabel = btn?.textContent;
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'กำลังบันทึก...';
      }
      try {
        const result = await api(`/sections/${key}`, {
          method: 'PUT',
          body: { page_key: 'home', config, is_active: actEl.checked ? 1 : 0 },
        });
        sectionConfigStore[key] = config;
        if (result?.build_error) {
          toast(
            toastEl,
            `บันทึกแล้ว แต่สร้างหน้าเว็บไม่สำเร็จ: ${result.build_error}`,
            true
          );
          return;
        }
        if (result?.build?.count != null) {
          toast(toastEl, `บันทึกและอัปเดตหน้าเว็บแล้ว (${result.build.count} ไฟล์)`);
        } else {
          if (btn) btn.textContent = 'กำลังอัปเดตหน้าเว็บ...';
          await publishAfterSave('บันทึกและอัปเดตหน้าเว็บแล้ว');
        }
      } catch (err) {
        toast(toastEl, err.message, true);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = prevLabel || 'บันทึกส่วนนี้';
        }
      }
    }

    function bindAccordion(panelEl) {
      panelEl.querySelectorAll('.home-acc').forEach((details) => {
        details.addEventListener('toggle', () => {
          if (details.open) {
            panelEl.querySelectorAll('.home-acc').forEach((d) => {
              if (d !== details) d.open = false;
            });
          }
          updateStickyBar();
        });
      });
      updateStickyBar();
    }

    stickySave?.addEventListener('click', () => {
      const open = panel.querySelector('.home-acc[open]');
      if (!open) {
        toast(toastEl, 'เปิดส่วนที่ต้องการแก้ก่อน', true);
        return;
      }
      saveSection(open.dataset.section, open);
    });

    async function loadSections() {
      const data = await api('/sections?page_key=home');
      const sections = data.sections || [];
      const HSF = window.HomeSectionForms;
      sections.forEach((s) => {
        sectionConfigStore[s.section_key] = s.config || {};
      });

      panel.innerHTML = sections.length
        ? `<div class="home-accordion">${sections
            .map((s) => {
              const meta = HSF?.meta?.[s.section_key];
              const title = meta?.title || s.title || s.section_key;
              const hint = meta?.hint || '';
              const form =
                HSF?.formHtml?.(s.section_key, s.config || {}) ||
                `<div class="home-form-grid">${textarea(`config-${s.section_key}`, 'JSON', JSON.stringify(s.config || {}, null, 2), 4, { full: true })}</div>`;
              return `
          <details class="home-acc" name="home-sections" data-section="${esc(s.section_key)}">
            <summary class="home-acc__summary">
              <span class="home-acc__title-group">
                <span class="home-acc__title">${esc(title)}</span>
                <button type="button" class="section-preview-trigger" data-section-preview="${esc(s.section_key)}" aria-label="ดูตัวอย่าง ${esc(title)}" title="ดูตัวอย่างส่วนนี้">?</button>
              </span>
              <span class="home-acc__hint">${esc(hint)}</span>
              <label class="home-acc__active" onclick="event.stopPropagation()">
                <input type="checkbox" name="active-${esc(s.section_key)}" value="1"${s.is_active ? ' checked' : ''} onclick="event.stopPropagation()">
                แสดง
              </label>
            </summary>
            <div class="home-acc__body">${form}</div>
          </details>`;
            })
            .join('')}</div>`
        : '<p class="empty-state">ยังไม่มีส่วนหน้าแรก — รัน <code>php cms/migrate-from-site.php</code></p>';

      panel.querySelectorAll('.home-acc').forEach((card) => {
        HSF?.bindRepeater?.(card);
        HSF?.bindMediaPick?.(card, (cb) => openMediaPicker(cb));
      });
      bindAccordion(panel);
      window.SectionPreview?.attach(panel);
      window.SectionPreview?.warm();
    }

    async function loadHero() {
      stickyBar.hidden = true;
      const rows = await api('/hero-slides');
      panel.innerHTML = `
        <div class="home-hero-panel">
        <div class="panel panel--page">
          <div class="panel-body">
            <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มสไลด์</button></div>
            ${crudTableHtml(rows, [
              { key: 'image_path', label: 'รูป' },
              { key: 'alt_text', label: 'คำอธิบาย' },
              { key: 'aspect_ratio', label: 'อัตราส่วน' },
              { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
            ], { sortable: true })}
          </div>
        </div>
        </div>`;

      bindCrudActions('hero-slides', loadHero, (row) => {
        const r = row || {};
        return `<div class="form-grid">
          ${mediaPickField('image_path', 'เส้นทางรูป', r.image_path || '')}
          ${input('alt_text', 'คำอธิบายรูป', r.alt_text)}
          ${input('width', 'ความกว้าง (px)', r.width ?? '', 'number')}
          ${input('height', 'ความสูง (px)', r.height ?? '', 'number')}
          ${input('aspect_ratio', 'อัตราส่วน', r.aspect_ratio || '')}
          ${checkbox('is_active', 'เปิดใช้งาน', row ? !!r.is_active : true)}
        </div>`;
      }, {
        sortable: true,
        reorderPath: '/hero-slides/reorder',
        addTitle: 'เพิ่มสไลด์ Hero',
        editTitle: 'แก้ไขสไลด์',
      });
    }

    async function switchTab(t) {
      tab = t;
      $$('[data-home-tab]', content).forEach((b) =>
        b.classList.toggle('is-active', b.dataset.homeTab === t)
      );
      panel.innerHTML = '<p class="muted">กำลังโหลด...</p>';
      if (t === 'sections') await loadSections();
      else await loadHero();
    }

    $$('[data-home-tab]', content).forEach((b) => {
      b.addEventListener('click', () => switchTab(b.dataset.homeTab));
    });
    await switchTab('sections');
  }

  const PAGE_EDITOR_KEYS = ['about', 'insurance', 'news', 'careers'];

  async function renderPages() {
    destroySortables();
    let pageKey = PAGE_EDITOR_KEYS[0];
    content.innerHTML = `
      <div class="home-editor">
        <p class="muted home-editor__note">แก้ข้อความหัวหน้าและส่วนสำคัญ — บันทึกแล้วระบบอัปเดตหน้าเว็บอัตโนมัติ</p>
        <div class="home-editor__tabs" id="pages-tabs">
          ${PAGE_EDITOR_KEYS.map(
            (k) =>
              `<button type="button" class="tab${k === pageKey ? ' is-active' : ''}" data-page-tab="${k}">${esc(window.PageSectionForms?.pages?.[k]?.label || k)}</button>`
          ).join('')}
        </div>
        <div id="pages-panel"></div>
      </div>`;

    const panel = $('#pages-panel');
    const PSF = window.PageSectionForms;

    async function loadPage(key) {
      pageKey = key;
      $$('#pages-tabs .tab').forEach((t) => t.classList.toggle('is-active', t.dataset.pageTab === key));
      panel.innerHTML = '<p class="muted">กำลังโหลด...</p>';
      const data = await api(`/sections?page_key=${encodeURIComponent(key)}`);
      const sections = data.sections || [];
      const wanted = PSF?.sectionsFor(key) || ['hero'];
      const legacyAboutAgents = key === 'about' && wanted.includes('agent') && !wanted.includes('agents');
      const sectionKeys = legacyAboutAgents ? [...wanted, 'agents'] : wanted;
      const byKey = {};
      sections.forEach((s) => {
        byKey[s.section_key] = s;
      });

      const pageHint = PSF?.pages?.[key]?.hint || '';
      const cards = sectionKeys
        .filter((sk) => !(key === 'about' && sk === 'agent' && sectionKeys.includes('agents')))
        .filter((sk) => !(key === 'about' && sk === 'agent2' && sectionKeys.includes('agents')))
        .map((sk) => {
          const s = byKey[sk] || { section_key: sk, config: {}, is_active: 1 };
          const meta = PSF?.sectionMeta?.[sk] || { title: sk, hint: '' };
          return `
          <details class="home-acc page-acc" data-page-section="${esc(sk)}" open>
            <summary class="home-acc__summary">
              <span class="home-acc__title">${esc(meta.title)}</span>
              <span class="home-acc__hint">${esc(meta.hint)}</span>
            </summary>
            <div class="home-acc__body">
              ${PSF?.formHtml?.(key, sk, s.config || {}, byKey) || ''}
              <div class="settings-editor__actions" style="margin-top:1rem">
                <button type="button" class="btn btn--primary btn--sm" data-page-save="${esc(sk)}">บันทึกส่วนนี้</button>
              </div>
            </div>
          </details>`;
        })
        .join('');

      panel.innerHTML = `
        ${pageHint ? `<p class="form-hint" style="margin-bottom:1rem">${esc(pageHint)}</p>` : ''}
        <div class="home-accordion">${cards || '<p class="empty-state">ยังไม่มีข้อมูล — รัน import ข้อมูล CMS</p>'}</div>
        <p class="form-hint" style="margin-top:1rem">Meta Title / Description แก้ได้ที่เมนู <strong>SEO</strong></p>`;

      panel.querySelectorAll('.page-acc').forEach((card) => {
        PSF?.bindMediaPick?.(card, (cb) => openMediaPicker(cb));
        PSF?.bindAgentsRepeater?.(card);
      });

      panel.querySelectorAll('[data-page-save]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const sk = btn.dataset.pageSave;
          const card = panel.querySelector(`[data-page-section="${sk}"]`);
          if (!card) return;
          let config;
          try {
            config = PSF.readConfig(key, sk, card);
          } catch (err) {
            toast(toastEl, err.message, true);
            return;
          }
          btn.disabled = true;
          const prev = btn.textContent;
          btn.textContent = 'กำลังบันทึก...';
          try {
            const result = await api(`/sections/${sk}`, {
              method: 'PUT',
              body: { page_key: key, config, is_active: 1 },
            });
            if (result?.build_error) {
              toast(
                toastEl,
                `บันทึกแล้ว แต่สร้างหน้าเว็บไม่สำเร็จ: ${result.build_error}`,
                true
              );
            } else if (result?.build?.count != null) {
              toast(
                toastEl,
                `บันทึก${PSF?.pages?.[key]?.label || key}แล้ว — อัปเดตหน้าเว็บ ${result.build.count} ไฟล์`
              );
            } else {
              await publishAfterSave(`บันทึก${PSF?.pages?.[key]?.label || key}แล้ว`);
            }
          } catch (err) {
            toast(toastEl, err.message, true);
          } finally {
            btn.disabled = false;
            btn.textContent = prev;
          }
        });
      });
    }

    $('#pages-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-page-tab]');
      if (!tab) return;
      loadPage(tab.dataset.pageTab).catch((err) => toast(toastEl, err.message, true));
    });

    await loadPage(pageKey);
  }

  async function mountPlanBuilder(mountEl, planId) {
    const IPF = window.InsurancePageForms;
    const IPB = window.InsurancePageBuilder;
    if (!IPF || !IPB) {
      mountEl.innerHTML = '<p class="empty-state">โหลด Page Builder ไม่สำเร็จ — รีเฟรชหน้านี้ (Ctrl+F5)</p>';
      return;
    }
    let plan = null;
    try {
      const rows = await api('/plans');
      plan = (rows || []).find((r) => Number(r.id) === Number(planId));
    } catch (err) {
      mountEl.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
      return;
    }
    if (!plan) {
      mountEl.innerHTML = '<p class="empty-state">ไม่พบแผนประกันนี้ — <a href="#plans">กลับรายการแผน</a></p>';
      return;
    }

    let pageKey;
    try {
      mountEl.innerHTML = '<p class="muted">กำลังเตรียมบิวเดอร์ของแผนนี้...</p>';
      pageKey = await ensurePlanBuilderSections(plan);
    } catch (err) {
      mountEl.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
      return;
    }

    const defaultsPageKey = planPageKeyForRow(plan);
    const builder = IPB.create({
      root: mountEl,
      api,
      toast,
      toastEl,
      openMediaPicker: (cb, opts) => openMediaPicker(cb, opts),
      onPublish: publishAfterSave,
      pageKey,
      defaultsPageKey,
      singlePlanMode: true,
      planLabel: plan.name,
      planSlug: planSlugForRow(plan),
      onSyncFromCategory: () => syncPlanBuilderFromCategory(plan, builder),
      onBack: () => {
        destroyPlanBuilder();
        location.hash = 'plans';
      },
    });
    window.__ipbInstance = builder;
    builder.mount([pageKey]);
    await builder.load(pageKey);
    const cardId = findPlanCardId(plan, builder.state.sections);
    if (cardId) {
      builder.select('planCards', { cardId });
    } else {
      builder.select('planCards');
    }
  }

  async function fetchInsuranceCategories() {
    try {
      const data = await api('/categories');
      return Array.isArray(data) ? data.filter((c) => c.is_active !== 0) : [];
    } catch (_) {
      return [];
    }
  }

  function resolvePlanCategoryId(row, categories) {
    const r = row || {};
    if (r.category_id != null && r.category_id !== '') return String(r.category_id);
    const slug = String(r.filter_tag || '').trim();
    if (!slug || slug === 'all') return '';
    const match = categories.find((c) => c.slug === slug);
    return match ? String(match.id) : '';
  }

  function planCategoryFieldHtml(categories, row) {
    if (!categories.length) {
      return `<div class="form-field form-field--full">
        <label>หมวดประกัน</label>
        <p class="form-hint" style="color:var(--danger,#c0392b)">ยังไม่มีหมวดประกัน — ไปที่เมนู «หมวดประกัน» ทางซ้ายเพื่อสร้างก่อน แล้วกลับมาเพิ่มแผนอีกครั้ง</p>
      </div>
      <input type="hidden" name="filter_tag" value="all">`;
    }
    const selectedId = resolvePlanCategoryId(row, categories);
    const catOpts = [{ value: '', label: '— เลือกหมวดประกัน —' }].concat(
      categories.map((c) => ({ value: String(c.id), label: c.name }))
    );
    const tag =
      row?.filter_tag ||
      categories.find((c) => String(c.id) === selectedId)?.slug ||
      'all';
    return `${select('category_id', 'หมวดประกัน', catOpts, selectedId, {
      required: true,
      hint: 'เลือกหมวดที่แผนนี้จะอยู่ — ใช้กรองบนหน้าเว็บและหน้ารวมแผนประกัน',
    })}<input type="hidden" name="filter_tag" value="${esc(tag)}">`;
  }

  function bindPlanCategoryPicker(root, categories) {
    const catSelect = $('select[name="category_id"]', root);
    const tagInput = $('input[name="filter_tag"]', root);
    if (!catSelect || !tagInput) return;
    const sync = () => {
      const cat = categories.find((c) => String(c.id) === String(catSelect.value));
      tagInput.value = cat?.slug || 'all';
    };
    catSelect.addEventListener('change', sync);
    sync();
  }

  function planCategoryLabel(row, categories) {
    const byId = categories.find((c) => String(c.id) === String(row?.category_id));
    if (byId) return byId.name;
    const slug = String(row?.filter_tag || '');
    if (!slug || slug === 'all') return '—';
    const bySlug = categories.find((c) => c.slug === slug);
    return bySlug?.name || slug;
  }

  async function mountPlansList(mountEl) {
    mountEl.innerHTML = '<p class="muted">กำลังโหลด...</p>';
    const LISTING_BY_TAG = {
      savings: { section: 'savings', label: 'แบบประกันไทยประกันชีวิต', dataCategory: 'savings' },
      health: { section: 'health', label: 'ประกันสุขภาพ', dataCategory: 'health' },
      child: { section: 'child', label: 'แบบประกันเพื่อลูกรัก', dataCategory: 'child' },
      senior: { section: 'senior', label: 'ผู้สูงอายุและการเกษียณอายุ', dataCategory: 'senior' },
    };
    const listingSectionsForPlan = (body, existingListing) => {
      const tag = String(body.filter_tag || '').trim();
      if (body.is_featured && LISTING_BY_TAG[tag]) {
        return [LISTING_BY_TAG[tag]];
      }
      return Array.isArray(existingListing) ? existingListing : [];
    };
    let editingListing = [];
    let categories = await fetchInsuranceCategories();
    const buildPlanFormHtml = (row) => {
      const r = row || {};
      const highlights =
        typeof r.highlights === 'object'
          ? JSON.stringify(r.highlights, null, 2)
          : r.highlights || '[]';
      return `<div class="form-grid">
          ${planCategoryFieldHtml(categories, r)}
          ${input('name', 'ชื่อแผน', r.name, 'text', { required: true })}
          ${input('slug', 'Slug (URL)', planSlugForRow(r) || r.slug || '', 'text', { hint: 'ใช้ภาษาอังกฤษ ไม่ใส่ / หรือช่องว่าง เช่น tl-plan-20-15' })}
          ${textarea('short_description', 'คำอธิบายสั้น', r.short_description, 2, { full: true })}
          ${textarea('full_description', 'รายละเอียด', r.full_description, 4, { full: true })}
          ${textarea('highlights', 'จุดเด่น (JSON array)', highlights, 4, { full: true })}
          ${mediaPickField('image_path', 'รูป', r.image_path || '')}
          ${input('price_from', 'ราคาเริ่มต้น', r.price_from)}
          ${input('insurer_name', 'บริษัทประกัน', r.insurer_name || 'ไทยประกันชีวิต')}
          ${planLinkFieldHtml(r.link_url, planSlugForRow(r) || r.slug)}
          ${input('pdf_path', 'PDF', r.pdf_path)}
          ${checkbox('is_featured', 'ปักหมุดไว้ด้านบน (แสดงบนหน้าแรก + หน้ารวมแผน)', !!r.is_featured)}
          ${checkbox('is_hot', 'ฮอต', !!r.is_hot)}
          ${checkbox('is_active', 'เปิดใช้งาน', row ? !!r.is_active : true)}
        </div>`;
    };
    const normalizePlanBody = (body) => {
      if (body.highlights) {
        try {
          body.highlights = JSON.parse(body.highlights);
        } catch {
          throw new Error('JSON จุดเด่นไม่ถูกต้อง');
        }
      }
      if (body.category_id === '') body.category_id = null;
      if (!body.category_id) {
        throw new Error('กรุณาเลือกหมวดประกัน');
      }
      if (!body.filter_tag || body.filter_tag === 'all') {
        const cat = categories.find((c) => String(c.id) === String(body.category_id));
        body.filter_tag = cat?.slug || 'all';
      }
      const linkUrl = resolvePlanLinkUrl(modalBody);
      if (linkUrl !== undefined) body.link_url = linkUrl || null;
      body.listing_sections = listingSectionsForPlan(body, editingListing);
      if (body.slug) {
        body.slug = sanitizePlanFileSlug(body.slug);
      } else if (body.name) {
        body.slug = planSlugForRow({ name: body.name, slug: '' });
      }
      return body;
    };
    const openPlanModal = async (row, isEdit) => {
      categories = await fetchInsuranceCategories();
      editingListing = isEdit && Array.isArray(row?.listing_sections) ? row.listing_sections : [];
      openModal(
        isEdit ? 'แก้ไขแผน' : 'เพิ่มแผน',
        buildPlanFormHtml(row),
        async () => {
          const body = normalizePlanBody(collectFormData(modalBody));
          if (quillEditor) {
            body.full_description = getQuillHtmlForSave(quillEditor);
          }
          if (isEdit) {
            await api(`/plans/${row.id}`, { method: 'PUT', body });
            await publishAfterSave('บันทึกและอัปเดตหน้าเว็บแล้ว');
          } else {
            await api('/plans', { method: 'POST', body });
            await publishAfterSave('เพิ่มข้อมูลและอัปเดตหน้าเว็บแล้ว');
          }
          await load();
        },
        { onOpen: (el) => {
          bindPlanCategoryPicker(el, categories);
          bindPlanLinkField(el, row?.slug || '');
          requestAnimationFrame(() => initQuillField('full_description'));
        } }
      );
    };
    const load = async () => {
      categories = await fetchInsuranceCategories();
      const rows = await api('/plans');
      mountEl.innerHTML = `
        <p class="muted plans-hub-hint">แก้ไขข้อมูลแผน (ชื่อ รูป ลิงก์) ด้วยปุ่ม «แก้ไข» — ปุ่ม «บิวเดอร์» ออกแบบหน้ารายละเอียดแยกต่อแผน (ไม่ใช้ร่วมกัน) — กด 📌 ปักหมุดไว้ด้านบน</p>
        <p class="muted plans-hub-hint">เลือก «หมวดประกัน» แล้วปักหมุด 📌 — แผนจะแสดงใน carousel หน้าแรกและหน้ารวมแผน ตามหมวดที่เลือก</p>
        <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มแผน</button></div>
        ${crudTableHtml(rows, [
          PIN_COLUMN,
          { key: 'name', label: 'ชื่อแผน' },
          {
            key: 'filter_tag',
            label: 'หมวด',
            render: (r) => esc(planCategoryLabel(r, categories)),
          },
          { key: 'insurer_name', label: 'บริษัท' },
          { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
        ], {
          sortable: true,
          extraActions: (row) =>
            `<button type="button" class="btn btn--primary btn--sm" data-plan-builder="${row.id}" title="บิวเดอร์แยกของแผนนี้เท่านั้น">บิวเดอร์</button>`,
        })}`;
      mountEl.querySelectorAll('[data-plan-builder]').forEach((btn) => {
        btn.addEventListener('click', () => {
          location.hash = `plans/builder/${btn.dataset.planBuilder}`;
        });
      });
      bindCrudActions('plans', load, () => '', {
        root: mountEl,
        sortable: true,
        onAdd: () => {
          openPlanModal(null, false);
        },
        onEdit: async (id) => {
          try {
            const row = await api(`/plans/${id}`);
            await openPlanModal(row, true);
          } catch (err) {
            toast(toastEl, err.message, true);
          }
        },
      });
    };
    await load();
  }

  async function renderPlans() {
    destroySortables();
    const planId = getPlanBuilderId();

    if (planId) {
      content.classList.add('is-page-builder', 'plans-hub--builder');
      content.innerHTML = `
        <div class="plans-hub">
          <div class="plans-hub__body" id="plans-hub-body"></div>
        </div>`;
      await mountPlanBuilder($('#plans-hub-body', content), planId);
      return;
    }

    content.classList.remove('is-page-builder', 'plans-hub--builder');
    content.innerHTML = panelShell('แผนประกัน', '<p class="muted">กำลังโหลด...</p>');
    await mountPlansList($('.panel-body', content));
  }

  async function renderInsurancePages() {
    location.hash = 'plans';
  }

  async function renderBanners() {
    destroySortables();
    content.innerHTML = panelShell('แบนเนอร์โปรโมชัน', '<p class="muted">กำลังโหลด...</p>', {
      previewKey: 'banners',
    });
    const load = async () => {
      const rows = await api('/banners');
      $('.panel-body', content).innerHTML = `
        <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มแบนเนอร์</button></div>
        ${crudTableHtml(rows, [
          { key: 'placement', label: 'ตำแหน่ง' },
          { key: 'title', label: 'หัวข้อ' },
          { key: 'image_path', label: 'รูป' },
          { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
        ], { sortable: true })}`;
      bindCrudActions('banners', load, (row) => {
        const r = row || {};
        return `<div class="form-grid">
          ${input('placement', 'ตำแหน่ง (เช่น promo)', r.placement || 'promo')}
          ${input('title', 'หัวข้อ', r.title)}
          ${mediaPickField('image_path', 'รูป', r.image_path || '')}
          ${textarea('description', 'คำอธิบาย', r.description, 3, { full: true })}
          ${input('button_text', 'ข้อความปุ่ม', r.button_text)}
          ${input('button_url', 'ลิงก์ปุ่ม', r.button_url)}
          ${checkbox('is_active', 'เปิดใช้งาน', row ? !!r.is_active : true)}
        </div>`;
      }, { sortable: true, addTitle: 'เพิ่มแบนเนอร์', editTitle: 'แก้ไขแบนเนอร์' });
      window.SectionPreview?.attach(content);
    };
    await load();
  }

  async function renderCategories() {
    destroySortables();
    content.innerHTML = panelShell('หมวดประกัน', '<p class="muted">กำลังโหลด...</p>');
    const load = async () => {
      const data = await api('/categories');
      const rows = Array.isArray(data) ? data : [];
      $('.panel-body', content).innerHTML = `
        <p class="muted" style="margin:0 0 1rem">หมวดนี้ใช้กรองแผนประกันบนหน้าเว็บ — ตอนเพิ่ม/แก้ไขแผนจะเลือกหมวดจากรายการนี้ได้โดยตรง</p>
        <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มหมวด</button></div>
        ${crudTableHtml(rows, [
          { key: 'name', label: 'ชื่อ' },
          { key: 'slug', label: 'Slug' },
          { key: 'sort_order', label: 'ลำดับ' },
          { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
        ], { sortable: true })}`;
      bindCrudActions('categories', load, (row) => {
        const r = row || {};
        return `<div class="form-grid">
          ${input('name', 'ชื่อหมวด', r.name, 'text', { required: true })}
          ${input('slug', 'Slug (รหัสกรอง)', r.slug, 'text', {
            placeholder: 'เช่น life, health, savings',
            hint: 'เช่น life, health, savings — ใช้กรองแผนบนหน้าเว็บ (เลือกหมวดนี้ได้จากฟอร์มเพิ่มแผนประกัน)',
          })}
          ${mediaPickField('icon_path', 'ไอคอน', r.icon_path || '')}
          ${mediaPickField('image_path', 'รูป', r.image_path || '')}
          ${textarea('description', 'คำอธิบาย', r.description, 3, { full: true })}
          ${textarea('page_body_html', 'เนื้อหาหน้า (HTML)', r.page_body_html, 6, { full: true })}
          ${input('seo_title', 'SEO Title', r.seo_title)}
          ${textarea('seo_description', 'SEO Description', r.seo_description, 2, { full: true })}
          ${checkbox('is_active', 'เปิดใช้งาน', row ? !!r.is_active : true)}
        </div>`;
      }, { sortable: true, addTitle: 'เพิ่มหมวด', editTitle: 'แก้ไขหมวด' });
    };
    await load();
  }

  function collectArticleForm() {
    const body = collectFormData(modalBody);
    if (quillEditor) {
      body.body_html = getQuillHtmlForSave(quillEditor);
    } else {
      const ta = $('textarea[name="body_html"]', modalBody);
      if (ta) body.body_html = ta.value;
    }
    return body;
  }

  function normalizeArticleBody(body) {
    if (body.published_at === '') body.published_at = null;
    else if (typeof body.published_at === 'string') {
      body.published_at = body.published_at.replace('T', ' ');
      if (body.published_at.length === 16) body.published_at += ':00';
    }
    if (body.status === 'published' && !body.published_at) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      body.published_at = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
    if (!body.body_html || body.body_html === '<p><br></p>') {
      body.body_html = body.body_html || '';
    }
    const slug = String(body.slug || '').trim();
    if (!slug && body.title) {
      body.slug = seoSlugFromTitle(body.title, 'article');
    } else {
      body.slug = slug;
    }
  }

  function destroyArticleQuill() {
    articleQuill = null;
    const form = $('#article-editor-form');
    if (!form) return;
    $$('.quill-wrap', form).forEach((wrap) => wrap.remove());
    const ta = $('textarea[name="body_html"]', form);
    if (isFormFieldQuillHidden(ta)) showFormField(ta, { rows: 14 });
  }

  function initArticleQuill(formRoot) {
    if (typeof Quill === 'undefined') return;
    const hidden = $('textarea[name="body_html"]', formRoot);
    if (!hidden?.parentElement) return;

    const mountId = `article-quill-${Date.now()}`;
    hideFormField(hidden);
    const wrap = document.createElement('div');
    wrap.className = 'quill-wrap form-field--full';
    wrap.innerHTML = `<label>เนื้อหาบทความ</label><div id="${mountId}" class="quill-mount"></div><p class="quill-resize-hint">ลากมุมล่างขวาของกล่องเพื่อขยายความสูง · เลือกข้อความแล้วกดปุ่มลิงก์เพื่อเลือกหน้าในเว็บ / บทความ</p>`;
    hidden.parentElement.appendChild(wrap);

    const mount = document.getElementById(mountId);
    if (!mount) return;

    try {
      articleQuill = new Quill(mount, {
        theme: 'snow',
        modules: {
          toolbar: quillToolbarOptions(bindQuillImageHandler, bindQuillVideoHandler),
        },
      });
      attachQuillSelectionMemory(articleQuill);
      articleQuill.root.innerHTML = normalizeQuillHtmlForEditor(hidden.value || '');
      articleQuill.on('text-change', () => updateArticleSeoScore(formRoot));
    } catch (err) {
      console.error('Article Quill init failed:', err);
      wrap.remove();
      showFormField(hidden, { rows: 14 });
      articleQuill = null;
    }
  }

  function getArticleEditorSnapshot(formRoot) {
    const body = collectFormData(formRoot);
    if (articleQuill) {
      body.body_html = getQuillHtmlForSave(articleQuill);
    } else {
      const ta = $('textarea[name="body_html"]', formRoot);
      if (ta) body.body_html = ta.value;
    }
    body.robots_index = $('input[name="robots_index"]', formRoot)?.checked ? 1 : 0;
    return body;
  }

  function getArticleEditorFormData(formRoot) {
    const body = getArticleEditorSnapshot(formRoot);
    if (body.category_id === '') body.category_id = null;
    normalizeArticleBody(body);
    return body;
  }

  function updateArticleSeoScore(formRoot) {
    const AE = window.ArticleEditor;
    if (!AE) return;
    const data = getArticleEditorSnapshot(formRoot);
    const result = AE.computeSeoScore(data);
    const ringHost = $('#article-seo-score-ring', formRoot);
    const checksHost = $('#article-seo-checks', formRoot);
    if (ringHost) ringHost.innerHTML = AE.renderScoreRing(result.score, result.max, result.level);
    if (checksHost) checksHost.innerHTML = AE.renderChecksList(result.checks);

    $$('[data-seo-max]', formRoot).forEach((el) => {
      const max = Number(el.dataset.seoMax) || 0;
      const badge = $(`#seo-count-${el.name}`, formRoot);
      if (!badge || !max) return;
      const len = el.value.length;
      badge.textContent = `${len} / ${max}`;
      badge.classList.remove('seo-counter--warn', 'seo-counter--over');
      if (len > max) badge.classList.add('seo-counter--over');
      else if (len > max * 0.9) badge.classList.add('seo-counter--warn');
    });

    const title = data.seo_title || data.title || 'หัวข้อบทความ';
    const desc = data.seo_description || data.excerpt || 'กรอก Meta Description';
    const slug = data.slug || 'article-slug';
    const url = sitePublicUrl(`articles/${slug}.html`);
    const urlEl = $('#article-serp-url', formRoot);
    const titleEl = $('#article-serp-title', formRoot);
    const descEl = $('#article-serp-desc', formRoot);
    if (urlEl) {
      try {
        const u = new URL(url, window.location.origin);
        urlEl.textContent = `${u.hostname} › ${u.pathname.replace(/^\//, '')}`;
      } catch {
        urlEl.textContent = url.replace(/^https?:\/\//, '');
      }
    }
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    const ogPath = data.og_image || data.cover_image || '';
    const ogWrap = $('#article-og-preview', formRoot);
    if (ogWrap) {
      if (!ogPath) {
        ogWrap.innerHTML = '<p class="seo-og-preview__empty muted">ยังไม่มีรูป OG</p>';
      } else {
        const src = ogPath.startsWith('http') ? ogPath : `../../${ogPath.replace(/^\//, '')}`;
        ogWrap.innerHTML = `<img class="seo-og-preview__img" src="${esc(src)}" alt="" loading="lazy">`;
      }
    }
  }

  function bindArticleEditor(formRoot, articleId) {
    const refresh = () => updateArticleSeoScore(formRoot);
    $$('input, textarea, select', formRoot).forEach((el) => {
      el.addEventListener('input', refresh);
      el.addEventListener('change', refresh);
    });

    $('#article-gen-slug', formRoot)?.addEventListener('click', () => {
      const title = $('[name="title"]', formRoot)?.value || '';
      const slugEl = $('[name="slug"]', formRoot);
      if (slugEl) slugEl.value = seoSlugFromTitle(title, 'article');
      refresh();
    });

    $('#article-fill-seo-title', formRoot)?.addEventListener('click', () => {
      const t = $('[name="title"]', formRoot)?.value || '';
      const el = $('[name="seo_title"]', formRoot);
      if (el) el.value = t.slice(0, SEO_TITLE_MAX);
      refresh();
    });

    $('#article-fill-seo-desc', formRoot)?.addEventListener('click', () => {
      const ex = $('[name="excerpt"]', formRoot)?.value || $('[name="hero_lead"]', formRoot)?.value || '';
      const el = $('[name="seo_description"]', formRoot);
      if (el) el.value = ex.slice(0, SEO_DESC_MAX);
      refresh();
    });

    bindMediaPickButtons(formRoot);

    $('#article-editor-back')?.addEventListener('click', () => {
      location.hash = 'articles';
    });

    $('#article-editor-save')?.addEventListener('click', async () => {
      const btn = $('#article-editor-save');
      const body = getArticleEditorFormData(formRoot);
      if (!body.title?.trim()) {
        toast(toastEl, 'กรุณาระบุหัวข้อบทความ', true);
        return;
      }
      if (!body.slug?.trim()) {
        toast(toastEl, 'กรุณาระบุ Slug หรือกด «สร้างจากหัวข้อ»', true);
        return;
      }
      btn.disabled = true;
      const prevLabel = btn.textContent;
      btn.textContent = 'กำลังบันทึก...';
      try {
        if (articleId) {
          await api(`/articles/${articleId}`, { method: 'PUT', body });
          toast(toastEl, body.status === 'draft' ? 'บันทึกแบบร่างแล้ว' : 'บันทึกและเผยแพร่แล้ว');
          await publishAfterSave(body.status === 'draft' ? 'บันทึกแบบร่างแล้ว' : 'อัปเดตหน้าเว็บแล้ว');
        } else {
          const created = await api('/articles', { method: 'POST', body });
          toast(toastEl, body.status === 'draft' ? 'สร้างแบบร่างแล้ว' : 'สร้างและเผยแพร่แล้ว');
          if (created?.id) {
            location.hash = `articles/edit/${created.id}`;
          }
          await publishAfterSave('อัปเดตหน้าเว็บแล้ว');
        }
      } catch (err) {
        toast(toastEl, err.message || 'บันทึกไม่สำเร็จ', true);
      } finally {
        btn.disabled = false;
        btn.textContent = prevLabel;
      }
    });

    refresh();
  }

  async function renderArticleEditorPage(articleId) {
    destroySortables();
    destroyQuill();
    destroyArticleQuill();
    content.innerHTML = '<div class="article-editor-page"><p class="muted">กำลังโหลด...</p></div>';

    if (articleId !== null && (!Number.isFinite(articleId) || articleId <= 0)) {
      content.innerHTML = `<div class="panel"><div class="panel-body">
        <p class="form-error">ไม่พบบทความ</p>
        <button type="button" class="btn btn--ghost" onclick="location.hash='articles'">← กลับ</button>
      </div></div>`;
      return;
    }

    try {
      const [article, categories] = await Promise.all([
        articleId ? api(`/articles/${articleId}`) : Promise.resolve({}),
        api('/article-categories').catch(() => []),
      ]);
      const r = article || {};
      const cats = Array.isArray(categories) ? categories : [];
      const catOpts = [
        { value: '', label: '— ไม่ระบุหมวด —' },
        ...cats.map((c) => ({ value: String(c.id), label: c.name })),
      ];
      const ogPath = r.og_image || '';
      const AE = window.ArticleEditor;

      content.innerHTML = `<div class="article-editor-page">
        <header class="article-editor-topbar">
          <div class="article-editor-topbar__left">
            <button type="button" class="btn btn--ghost" id="article-editor-back">← รายการบทความ</button>
            <h2 class="article-editor-topbar__title">${articleId ? esc(r.title || 'แก้ไขบทความ') : 'เพิ่มบทความใหม่'}</h2>
          </div>
          <div class="article-editor-topbar__actions">
            <button type="button" class="btn btn--primary" id="article-editor-save">บันทึกและเผยแพร่</button>
          </div>
        </header>
        <form id="article-editor-form" class="article-editor-layout" onsubmit="return false">
          <div class="article-editor-main">
            <section class="article-editor-panel">
              <h3 class="article-editor-panel__title">เนื้อหาหลัก</h3>
              <div class="form-grid form-grid--stacked">
                ${input('title', 'หัวข้อบทความ (H1)', r.title, 'text', { required: true, full: true })}
                ${textarea('excerpt', 'คำโปรย', r.excerpt, 3, { full: true })}
                ${textarea('hero_lead', 'คำนำ Hero', r.hero_lead, 2, { full: true })}
                ${textarea('body_html', 'เนื้อหา', r.body_html || '', 6, { full: true })}
              </div>
            </section>
            <section class="article-editor-panel">
              <h3 class="article-editor-panel__title">รูปภาพและการเผยแพร่</h3>
              <div class="form-grid">
                ${mediaPickField('cover_image', 'รูปปก', r.cover_image || '')}
                ${input('eyebrow', 'หมวดย่อย (eyebrow)', r.eyebrow || '')}
                ${select('category_id', 'หมวดบทความ', catOpts, r.category_id != null ? String(r.category_id) : '')}
                ${select('status', 'สถานะ', [
                  { value: 'published', label: 'เผยแพร่' },
                  { value: 'draft', label: 'แบบร่าง (ยังไม่ขึ้นเว็บ)' },
                ], articleStatusDefault(r, !articleId))}
                ${input('published_at', 'วันเผยแพร่', articlePublishedAtDefault(r, !articleId), 'datetime-local', {
                  hint: 'บทความใหม่ตั้งเป็นเผยแพร่ทันที — เปลี่ยนเป็นแบบร่างถ้ายังไม่ต้องการขึ้นเว็บ',
                })}
                ${checkbox('is_featured', 'ปักหมุดไว้ด้านบน (หน้าแรก + ข่าวสาร)', !!r.is_featured)}
              </div>
            </section>
            <section class="article-editor-panel">
              <h3 class="article-editor-panel__title">SEO และการมองเห็นบน Google</h3>
              <div class="form-grid form-grid--stacked">
                <div class="form-field form-field--full">
                  <div class="seo-field-head">
                    <label for="f-seo_title">SEO Title</label>
                    ${seoCounterBadge('seo_title', r.seo_title || '', SEO_TITLE_MAX)}
                  </div>
                  <div class="seo-inline-actions">
                    <input id="f-seo_title" name="seo_title" type="text" value="${esc(r.seo_title || '')}" data-seo-max="${SEO_TITLE_MAX}">
                    <button type="button" class="btn btn--ghost btn--sm" id="article-fill-seo-title">ใช้หัวข้อบทความ</button>
                  </div>
                  <p class="form-hint">แนะนำ 30–60 ตัวอักษร</p>
                </div>
                <div class="form-field form-field--full">
                  <div class="seo-field-head">
                    <label for="f-seo_description">Meta Description</label>
                    ${seoCounterBadge('seo_description', r.seo_description || '', SEO_DESC_MAX)}
                  </div>
                  <div class="seo-inline-actions seo-inline-actions--stack">
                    <textarea id="f-seo_description" name="seo_description" rows="4" data-seo-max="${SEO_DESC_MAX}">${esc(r.seo_description || '')}</textarea>
                    <button type="button" class="btn btn--ghost btn--sm" id="article-fill-seo-desc">ใช้คำโปรย</button>
                  </div>
                  <p class="form-hint">แนะนำ 120–160 ตัวอักษร</p>
                </div>
                ${input('meta_keywords', 'คำค้นหลัก (คั่นด้วยจุลภาค)', r.meta_keywords, 'text', {
                  full: true,
                  placeholder: 'ประกันชีวิต, วางแผนการเงิน',
                })}
                <div class="form-field form-field--full">
                  <label for="f-slug">Slug (URL)</label>
                  <div class="seo-inline-actions">
                    <input id="f-slug" name="slug" type="text" value="${esc(r.slug || '')}" placeholder="life-insurance-tips">
                    <button type="button" class="btn btn--ghost btn--sm" id="article-gen-slug">สร้างจากหัวข้อ</button>
                  </div>
                  <p class="form-hint">articles/<strong>slug</strong>.html</p>
                </div>
                ${mediaPickField('og_image', 'รูปแชร์ OG', ogPath)}
                <div class="form-field form-field--check form-field--full">
                  <label><input type="checkbox" name="robots_index" value="1"${r.robots_index !== 0 ? ' checked' : ''}> ให้ Google index บทความนี้</label>
                </div>
              </div>
            </section>
          </div>
          <aside class="article-editor-aside">
            <div class="article-editor-panel" id="article-seo-score-ring">
              ${AE ? AE.renderScoreRing(0, 100, 'poor') : ''}
            </div>
            <div class="article-editor-panel">
              <h3 class="article-editor-panel__title">รายการตรวจ SEO</h3>
              <div id="article-seo-checks"></div>
            </div>
            <div class="article-editor-panel seo-serp-card">
              <h3 class="seo-serp-card__title">ตัวอย่างผลค้นหา Google</h3>
              <div class="seo-serp" id="article-serp-preview">
                <div class="seo-serp__site">${esc(sitePublicUrl().replace(/^https?:\/\//, ''))}</div>
                <div class="seo-serp__url" id="article-serp-url"></div>
                <div class="seo-serp__title" id="article-serp-title"></div>
                <div class="seo-serp__desc" id="article-serp-desc"></div>
              </div>
            </div>
            <div class="article-editor-panel">
              <h3 class="article-editor-panel__title">ตัวอย่างรูปแชร์</h3>
              <div class="seo-og-preview" id="article-og-preview"></div>
            </div>
          </aside>
        </form>
      </div>`;

      const formRoot = $('#article-editor-form');
      initArticleQuill(formRoot);
      bindArticleEditor(formRoot, articleId);
      window.FieldHint?.attach(formRoot);
    } catch (err) {
      content.innerHTML = `<div class="panel"><div class="panel-body">
        <p class="form-error">${esc(err.message)}</p>
        <button type="button" class="btn btn--ghost" onclick="location.hash='articles'">← กลับ</button>
      </div></div>`;
    }
  }

  function articleForm(row, type) {
    const r = row || {};
    const isCareer = type === 'careers';
    const isNew = !r.id;
    return `<div class="form-grid">
      ${input('slug', 'Slug', r.slug)}
      ${input('title', 'หัวข้อ', r.title, 'text', { required: true })}
      ${textarea('excerpt', 'คำโปรย', r.excerpt, 2, { full: true })}
      ${input('eyebrow', 'หมวดย่อย (eyebrow)', r.eyebrow || (isCareer ? 'แนะนำอาชีพ' : ''))}
      ${textarea('hero_lead', 'คำนำ Hero', r.hero_lead, 2, { full: true })}
      ${mediaPickField('cover_image', 'รูปปก', r.cover_image || '')}
      ${isCareer ? mediaPickField('hero_image', 'รูป Hero', r.hero_image || '') : ''}
      ${select('status', 'สถานะ', [
        { value: 'published', label: 'เผยแพร่' },
        { value: 'draft', label: 'แบบร่าง (ยังไม่ขึ้นเว็บ)' },
      ], articleStatusDefault(r, isNew))}
      ${input('published_at', 'วันเผยแพร่', articlePublishedAtDefault(r, isNew), 'datetime-local')}
      ${checkbox('is_featured', 'ปักหมุดไว้ด้านบน (หน้าแรก + แนะนำอาชีพ)', !!r.is_featured)}
      ${textarea('body_html', 'เนื้อหา', r.body_html || '', 4, { full: true })}
      ${input('seo_title', 'SEO Title', r.seo_title)}
      ${textarea('seo_description', 'SEO Description', r.seo_description, 2, { full: true })}
    </div>`;
  }

  async function renderArticles() {
    destroySortables();
    destroyArticleQuill();
    content.innerHTML = `
      <div class="tabs">
        <button type="button" class="tab ${articlesSubTab === 'articles' ? 'is-active' : ''}" data-art-tab="articles">บทความ</button>
        <button type="button" class="tab ${articlesSubTab === 'careers' ? 'is-active' : ''}" data-art-tab="careers">หน้าอาชีพ</button>
      </div>
      <div id="articles-panel"></div>`;

    const panel = $('#articles-panel');

    async function loadArticles() {
      const rows = await api('/articles');
      if (!Array.isArray(rows)) throw new Error('โหลดรายการบทความไม่สำเร็จ');
      panel.innerHTML = `
        <div class="panel panel--page">
          <div class="panel-body">
            <p class="muted form-hint form-field--full">กด «ปักหมุด» ในแต่ละแถวเพื่อให้แสดงด้านบนหน้าแรกและหน้าข่าวสาร — ลาก ⋮⋮ เพื่อจัดลำดับ</p>
            <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มบทความ</button></div>
            ${crudTableHtml(rows, [
              { key: 'title', label: 'หัวข้อ' },
              { key: 'slug', label: 'Slug' },
              { key: 'status', label: 'สถานะ' },
              { key: 'published_at', label: 'เผยแพร่', render: (r) => esc((r.published_at || '').slice(0, 10)) },
            ], {
              sortable: true,
              extraActions: (row) => renderPinCell(row, { inActions: true }),
            })}
          </div>
        </div>`;
      bindCrudActions('articles', () => loadArticles(), (row) => articleForm(row, 'articles'), {
        root: panel,
        sortable: true,
        onAdd: () => {
          location.hash = 'articles/edit/new';
        },
        onEdit: (id) => {
          location.hash = `articles/edit/${id}`;
        },
      });
    }

    async function loadCareers() {
      const rows = await api('/careers');
      if (!Array.isArray(rows)) throw new Error('โหลดรายการอาชีพไม่สำเร็จ');
      panel.innerHTML = `
        <div class="panel panel--page">
          <div class="panel-body">
            <p class="muted form-hint form-field--full">กด «ปักหมุด» ในแต่ละแถวเพื่อให้แสดงด้านบนหน้าแรกและหน้าแนะนำอาชีพ — ลาก ⋮⋮ เพื่อจัดลำดับ</p>
            <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มหน้าอาชีพ</button></div>
            ${crudTableHtml(rows, [
              { key: 'title', label: 'หัวข้อ' },
              { key: 'slug', label: 'Slug' },
              { key: 'status', label: 'สถานะ' },
            ], {
              sortable: true,
              extraActions: (row) => renderPinCell(row, { inActions: true }),
            })}
          </div>
        </div>`;
      bindCrudActions('careers', () => loadCareers(), (row) => articleForm(row, 'careers'), {
        root: panel,
        sortable: true,
        addTitle: 'เพิ่มหน้าอาชีพ',
        editTitle: 'แก้ไขหน้าอาชีพ',
        modalOpts: { quillField: 'body_html' },
        beforeSave: normalizeArticleBody,
        collectForm: () => collectArticleForm(),
      });
    }

    async function switchTab(t) {
      articlesSubTab = t;
      $$('[data-art-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.artTab === t));
      panel.innerHTML = '<p class="muted">กำลังโหลด...</p>';
      if (t === 'careers') await loadCareers();
      else await loadArticles();
    }

    $$('[data-art-tab]').forEach((b) => {
      b.addEventListener('click', () => switchTab(b.dataset.artTab));
    });
    await switchTab(articlesSubTab);
  }

  async function renderTestimonials() {
    destroySortables();
    content.innerHTML = panelShell('รีวิวลูกค้า', '<p class="muted">กำลังโหลด...</p>', {
      previewKey: 'reviews',
    });
    const load = async () => {
      const rows = await api('/testimonials');
      $('.panel-body', content).innerHTML = `
        <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มรีวิว</button></div>
        ${crudTableHtml(rows, [
          { key: 'customer_name', label: 'ชื่อ' },
          { key: 'customer_role', label: 'บทบาท' },
          { key: 'rating', label: 'คะแนน' },
          { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
        ], { sortable: true })}`;
      bindCrudActions('testimonials', load, (row) => {
        const r = row || {};
        return `<div class="form-grid">
          ${input('customer_name', 'ชื่อลูกค้า', r.customer_name, 'text', { required: true })}
          ${input('customer_role', 'บทบาท', r.customer_role)}
          ${input('avatar_letter', 'ตัวอักษรอวตาร', r.avatar_letter)}
          ${mediaPickField('avatar_image', 'รูปอวตาร', r.avatar_image || '')}
          ${textarea('quote_text', 'ข้อความรีวิว', r.quote_text, 4, { full: true })}
          ${input('rating', 'คะแนน (1-5)', r.rating ?? 5, 'number')}
          ${checkbox('is_active', 'เปิดใช้งาน', row ? !!r.is_active : true)}
        </div>`;
      }, { sortable: true, addTitle: 'เพิ่มรีวิว', editTitle: 'แก้ไขรีวิว' });
      window.SectionPreview?.attach(content);
    };
    await load();
  }

  let leadsFilter = '';

  async function renderLeads() {
    destroySortables();
    const exportUrl = `${API_BASE}/leads/export.csv`;
    content.innerHTML = `
      <div class="panel panel--page">
        <div class="panel-head">
          <h2>ลีด / แบบฟอร์มติดต่อ</h2>
          <div class="btn-row">
            <a class="btn btn--ghost" href="${exportUrl}" download="leads-export.csv">ส่งออก CSV</a>
          </div>
        </div>
        <div class="panel-body">
          <div class="toolbar">
            <label>กรองสถานะ:
              <select id="leads-filter">
                ${LEAD_STATUS.map((s) => `<option value="${s.value}">${esc(s.label)}</option>`).join('')}
              </select>
            </label>
          </div>
          <div id="leads-table"><p class="muted">กำลังโหลด...</p></div>
        </div>
      </div>`;

    const filterEl = $('#leads-filter');
    filterEl.value = leadsFilter;
    filterEl.addEventListener('change', () => {
      leadsFilter = filterEl.value;
      loadLeadsTable();
    });

    async function loadLeadsTable() {
      const q = leadsFilter ? `?status=${encodeURIComponent(leadsFilter)}` : '';
      const data = await api(`/leads${q}`);
      const leads = data.leads || data || [];
      const wrap = $('#leads-table');
      wrap.innerHTML = crudTableHtml(
        leads,
        [
          { key: 'name', label: 'ชื่อ' },
          { key: 'phone', label: 'โทร' },
          { key: 'preferred_agent', label: 'ตัวแทน' },
          { key: 'interest', label: 'ความสนใจ' },
          { key: 'status', label: 'สถานะ', render: (r) => leadStatusBadge(r.status) },
          { key: 'created_at', label: 'วันที่', render: (r) => esc((r.created_at || '').slice(0, 16)) },
        ],
        { sortable: false }
      );

      wrap.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.textContent = 'ดู / แก้ไข';
        btn.addEventListener('click', async () => {
          const id = btn.dataset.edit;
          const row = await api(`/leads/${id}`);
          openModal(`ลีด #${id}`, `<div class="form-grid">
            ${input('name', 'ชื่อ', row.name)}
            ${input('phone', 'โทร', row.phone)}
            ${input('preferred_agent', 'ตัวแทนที่เลือก', row.preferred_agent)}
            ${input('interest', 'ความสนใจ', row.interest)}
            ${input('insurance_plan', 'แผนที่สนใจ', row.insurance_plan)}
            ${textarea('message', 'ข้อความ', row.message, 3, { full: true })}
            ${select('status', 'สถานะ', LEAD_STATUS.filter((s) => s.value), row.status)}
            ${textarea('internal_note', 'บันทึกภายใน', row.internal_note, 3, { full: true })}
            <p class="form-hint">แหล่ง: ${esc(row.source_page)} · ${esc(row.created_at)}</p>
          </div>`, async () => {
            const body = collectFormData(modalBody);
            await api(`/leads/${id}`, { method: 'PATCH', body });
            toast(toastEl, 'อัปเดตลีดเรียบร้อย');
            await loadLeadsTable();
          });
        });
      });

      wrap.querySelectorAll('[data-del]').forEach((btn) => {
        btn.remove();
      });
    }

    await loadLeadsTable();
  }

  async function renderCta() {
    destroySortables();
    content.innerHTML = panelShell('โปรไฟล์ติดต่อ', '<p class="muted">กำลังโหลด...</p>', {
      previewKey: 'ctaChannels',
    });

    let items = [];

    const readAgentsFromSections = (sections) => {
      const list = Array.isArray(sections) ? sections : [];
      const byKey = Object.fromEntries(list.map((s) => [s.section_key, s]));
      if (window.PageSectionForms?.mergeAboutAgentsConfig) {
        const merged = window.PageSectionForms.mergeAboutAgentsConfig(byKey);
        return (merged.items || []).map(normalizeContactProfile);
      }
      const cfg = byKey.agents?.config || {};
      if (Array.isArray(cfg.items) && cfg.items.length) {
        return cfg.items.map(normalizeContactProfile);
      }
      return [normalizeContactProfile(cfg.agent), normalizeContactProfile(cfg.agent2)].filter(
        (a) => a.h2 || a.phone || a.photo
      );
    };

    const saveAgents = async (nextItems) => {
      const cleaned = nextItems
        .map(normalizeContactProfile)
        .filter((a) => a.h2 || a.phone || a.photo || a.lineUrl || a.facebookUrl);
      const result = await api('/sections/agents', {
        method: 'PUT',
        body: {
          page_key: 'about',
          config: { items: cleaned.length ? cleaned : [emptyContactProfile()] },
          is_active: 1,
          title: 'โปรไฟล์ทีมงาน',
        },
      });
      items = cleaned.length ? cleaned : [emptyContactProfile()];
      if (result?.build_error) {
        toast(toastEl, `บันทึกแล้ว แต่สร้างหน้าเว็บไม่สำเร็จ: ${result.build_error}`, true);
      } else {
        toast(
          toastEl,
          result?.build?.count != null
            ? `บันทึกโปรไฟล์ติดต่อแล้ว — อัปเดตหน้าเว็บ ${result.build.count} ไฟล์`
            : 'บันทึกโปรไฟล์ติดต่อแล้ว'
        );
      }
    };

    const openProfileEditor = (index) => {
      const isNew = index < 0 || index >= items.length;
      const current = isNew ? emptyContactProfile() : normalizeContactProfile(items[index]);
      openModal(
        isNew ? 'เพิ่มโปรไฟล์ติดต่อ' : `แก้ไขโปรไฟล์ — ${current.h2 || 'ไม่มีชื่อ'}`,
        contactProfileFormHtml(current),
        async () => {
          const body = collectFormData(modalBody);
          const next = normalizeContactProfile({
            ...current,
            ...body,
          });
          if (!next.phoneTel && next.phone) {
            next.phoneTel = String(next.phone).replace(/\D+/g, '');
          }
          if (!String(next.h2 || '').trim()) {
            throw new Error('กรุณาใส่ชื่อที่แสดง');
          }
          const nextItems = items.slice();
          if (isNew) nextItems.push(next);
          else nextItems[index] = next;
          await saveAgents(nextItems);
          renderList();
        }
      );
    };

    const renderList = () => {
      const body = $('.panel-body', content);
      body.innerHTML = `
        <p class="muted" style="margin:0 0 1rem">การ์ดหน้าติดต่อ + ข้อความแนะนำหน้าเกี่ยวกับเรา — กดแก้ไขการ์ด แล้วดูช่อง <strong>ย่อหน้าแรก</strong> / <strong>ข้อความเพิ่มเติม</strong></p>
        <div class="cta-profiles" data-cta-profiles>
          ${items.length ? items.map((a, i) => contactProfileCardHtml(a, i)).join('') : '<p class="empty-state">ยังไม่มีโปรไฟล์ — กดเพิ่มด้านล่าง</p>'}
        </div>
        <div class="toolbar" style="margin-top:1rem;display:flex;gap:0.75rem;flex-wrap:wrap">
          <button type="button" class="btn btn--primary" data-cta-add>+ เพิ่มโปรไฟล์ติดต่อ</button>
          <a class="btn btn--ghost" href="../../about.html" target="_blank" rel="noopener">เปิดหน้าเกี่ยวกับเรา</a>
          <a class="btn btn--ghost" href="../../contact.html" target="_blank" rel="noopener">เปิดหน้าติดต่อ</a>
        </div>
        <details class="cta-legacy" style="margin-top:1.75rem">
          <summary>ชิปติดต่อแบบเก่า (ไม่ใช้กับการ์ดโปรไฟล์แล้ว)</summary>
          <div class="cta-legacy__body" data-cta-legacy></div>
        </details>`;

      body.querySelector('[data-cta-add]')?.addEventListener('click', () => openProfileEditor(-1));
      body.querySelectorAll('[data-cta-edit]').forEach((btn) => {
        btn.addEventListener('click', () => openProfileEditor(Number(btn.dataset.ctaEdit)));
      });
      body.querySelectorAll('[data-cta-del]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const idx = Number(btn.dataset.ctaDel);
          if (items.length <= 1) {
            window.alert('ต้องมีอย่างน้อย 1 โปรไฟล์');
            return;
          }
          if (!window.confirm(`ลบโปรไฟล์ «${items[idx]?.h2 || ''}» หรือไม่?`)) return;
          const nextItems = items.filter((_, i) => i !== idx);
          try {
            await saveAgents(nextItems);
            renderList();
          } catch (err) {
            toast(toastEl, err.message, true);
          }
        });
      });

      const legacyWrap = body.querySelector('[data-cta-legacy]');
      if (legacyWrap) {
        loadLegacyChannels(legacyWrap).catch((err) => {
          legacyWrap.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
        });
      }
      window.SectionPreview?.attach(content);
    };

    const loadLegacyChannels = async (wrap) => {
      const rows = await api('/contact-channels');
      wrap.innerHTML = `
        <p class="muted" style="margin:0.75rem 0">รายการนี้เป็นชิปเก่า — การ์ดโปรไฟล์ด้านบนเป็นตัวควบคุมหน้าติดต่อหลักแล้ว</p>
        <div class="toolbar"><button type="button" class="btn btn--ghost btn--sm" data-add>+ เพิ่มชิปเก่า</button></div>
        ${crudTableHtml(rows, [
          { key: 'label', label: 'ชื่อ' },
          { key: 'value_text', label: 'ข้อความ' },
          { key: 'variant', label: 'ประเภท', render: (r) => esc(ctaVariantLabel(r.variant)) },
          { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
        ], { sortable: true })}`;
      bindCrudActions('contact-channels', () => loadLegacyChannels(wrap), ctaChannelForm, {
        root: wrap,
        sortable: true,
        addTitle: 'เพิ่มช่องทางติดต่อ (เก่า)',
        editTitle: 'แก้ไขช่องทางติดต่อ (เก่า)',
        deleteMsg: 'ลบช่องทางนี้?',
        beforeSave: (body) => {
          if (!String(body.channel_key || '').trim()) {
            const slug = String(body.label || 'channel')
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^\w-]/g, '');
            body.channel_key = `${slug || 'channel'}_${Date.now()}`;
          }
        },
      });
    };

    try {
      const data = await api('/sections?page_key=about');
      const sections = data.sections || data || [];
      items = readAgentsFromSections(sections);
      if (!items.length) items = [emptyContactProfile()];
      renderList();
    } catch (err) {
      $('.panel-body', content).innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
    }
  }

  function footerGroupLabel(key) {
    const map = { main: 'เมนูหลัก', products: 'ผลิตภัณฑ์', legal: 'กฎหมาย' };
    return map[key] ?? key ?? '—';
  }

  function footerAcc(title, body, open = false) {
    return `<details class="footer-acc"${open ? ' open' : ''}>
      <summary class="footer-acc__summary">${esc(title)}</summary>
      <div class="footer-acc__body">${body}</div>
    </details>`;
  }

  function footerPhoneCard(title, labelName, labelVal, displayName, displayVal, telName, telVal, telPlaceholder) {
    return `<div class="footer-phone-card">
      <p class="footer-phone-card__title">${esc(title)}</p>
      <div class="form-grid form-grid--stacked">
        ${input(labelName, 'ป้ายแสดง', labelVal)}
        ${input(displayName, 'เบอร์ (แสดงบนเว็บ)', displayVal)}
        ${input(telName, 'เบอร์โทร (tel:)', telVal, 'text', { placeholder: telPlaceholder })}
      </div>
    </div>`;
  }

  function footerSettingsFieldsHtml(settings) {
    const s = settings || {};
    const b = s.brandCol || {};
    const main = s.mainNav || {};
    const prod = s.productsNav || {};
    const info = s.infoCol || {};
    const leg = s.legal || {};
    return `<div class="footer-settings-form" id="footer-settings-form">
      ${footerAcc(
        'คอลัมน์แบรนด์',
        `<div class="form-grid form-grid--stacked">
          ${input('fb_brandSlug', 'ชื่อแบรนด์ (slug)', b.brandSlug || '', 'text')}
          ${textarea('fb_desc', 'คำอธิบาย', b.desc || '', 4, { full: true })}
        </div>`,
        true
      )}
      ${footerAcc(
        'โทรศัพท์และเวลาทำการ',
        `<div class="footer-phone-grid">
          ${footerPhoneCard(
            'คุณแต้ม',
            'fb_phoneTamLabel',
            b.phoneTamLabel || 'แต้ม',
            'fb_phoneTamDisplay',
            b.phoneTamDisplay || '',
            'fb_phoneTamTel',
            b.phoneTamTel || '',
            '0870467443'
          )}
          ${footerPhoneCard(
            'คุณเอ',
            'fb_phoneALabel',
            b.phoneALabel || 'เอ',
            'fb_phoneADisplay',
            b.phoneADisplay || '',
            'fb_phoneATel',
            b.phoneATel || '',
            '0834515615'
          )}
        </div>
        <div class="form-grid form-grid--stacked footer-acc__tail">
          ${input('fb_hours', 'เวลาทำการ', b.hours || '', 'text', { full: true, placeholder: 'จันทร์–ศุกร์ 09:00–18:00 น.' })}
        </div>`,
        true
      )}
      ${footerAcc(
        'หัวข้อคอลัมน์',
        `<div class="form-grid footer-form-cols-3">
          ${input('fb_mainNavTitle', 'เมนูหลัก', main.title || 'เมนูหลัก')}
          ${input('fb_prodNavTitle', 'หมวดประกัน', prod.title || 'หมวดประกัน')}
          ${input('fb_infoTitle', 'ข้อมูลเพิ่มเติม', info.title || 'ข้อมูลเพิ่มเติม')}
        </div>`
      )}
      ${footerAcc(
        'ข้อมูลเพิ่มเติม',
        `<div class="form-grid form-grid--stacked">
          ${input('fb_office', 'สำนักงาน', info.office || '', 'text', { full: true })}
          ${input('fb_licenses', 'ใบอนุญาต', info.licenses || '', 'text', { full: true })}
          ${textarea('fb_note', 'หมายเหตุ', info.note || '', 2, { full: true })}
        </div>`
      )}
      ${footerAcc(
        'แถบล่าง (ลิขสิทธิ์และลิงก์)',
        `<div class="form-grid form-grid--stacked">
          ${input('fb_copyright', 'ลิขสิทธิ์', leg.copyright || '', 'text', { full: true })}
          <div class="form-grid footer-form-cols-2">
            ${input('fb_privacyLabel', 'ข้อความลิงก์ Privacy', leg.privacyLabel || 'Privacy Policy')}
            ${input('fb_termsLabel', 'ข้อความลิงก์ Terms', leg.termsLabel || 'Terms of Service')}
          </div>
        </div>`
      )}
    </div>`;
  }

  function collectFooterSettings(formRoot, existing) {
    const g = (name) => $(`[name="${name}"]`, formRoot)?.value?.trim() ?? '';
    const ex = existing || {};
    return {
      brandCol: {
        brandSlug: g('fb_brandSlug'),
        desc: g('fb_desc'),
        phoneTamLabel: g('fb_phoneTamLabel'),
        phoneTamDisplay: g('fb_phoneTamDisplay'),
        phoneTamTel: g('fb_phoneTamTel'),
        phoneALabel: g('fb_phoneALabel'),
        phoneADisplay: g('fb_phoneADisplay'),
        phoneATel: g('fb_phoneATel'),
        hours: g('fb_hours'),
      },
      mainNav: { ...(ex.mainNav || {}), title: g('fb_mainNavTitle') },
      productsNav: { ...(ex.productsNav || {}), title: g('fb_prodNavTitle') },
      infoCol: {
        title: g('fb_infoTitle'),
        office: g('fb_office'),
        licenses: g('fb_licenses'),
        note: g('fb_note'),
      },
      legal: {
        ...(ex.legal || {}),
        copyright: g('fb_copyright'),
        privacyLabel: g('fb_privacyLabel'),
        termsLabel: g('fb_termsLabel'),
      },
    };
  }

  function footerLinkForm(row) {
    const r = row || {};
    return `<div class="form-grid form-grid--stacked">
      ${select(
        'group_key',
        'กลุ่ม',
        [
          { value: 'main', label: 'เมนูหลัก' },
          { value: 'products', label: 'ผลิตภัณฑ์' },
          { value: 'legal', label: 'กฎหมาย' },
        ],
        r.group_key || 'main'
      )}
      ${input('label', 'ชื่อลิงก์', r.label, 'text', { required: true, placeholder: 'เช่น หน้าแรก' })}
      ${input('url', 'URL', r.url || '#', 'text', {
        required: true,
        placeholder: 'index.html',
        full: true,
      })}
      ${checkbox('is_active', 'แสดงบนเว็บ', row ? !!r.is_active : true)}
    </div>`;
  }

  async function renderFooter() {
    destroySortables();
    content.innerHTML = panelShell('ส่วนท้ายเว็บ', '<p class="muted">กำลังโหลด...</p>', {
      previewKey: 'footer',
      previewInBody: true,
    });
    let cachedSettings = {};
    const load = async () => {
      const data = await api('/footer');
      cachedSettings = data.settings || {};
      const links = data.links || [];
      const body = $('.panel-body', content);
      body.innerHTML = `
        <div class="footer-editor">
          <section class="footer-editor__block">
            <div class="footer-editor__head">
              <div>
                <h3 class="footer-editor__title">ข้อความท้ายเว็บ</h3>
                <p class="muted footer-editor__lead">แต่ละหัวข้อพับ/กางได้ — กรอกแล้วกดบันทึกด้านล่าง</p>
              </div>
              ${previewTriggerBtn('footer', 'ส่วนท้ายเว็บ')}
            </div>
            ${footerSettingsFieldsHtml(cachedSettings)}
            <div class="footer-editor__actions">
              <button type="button" class="btn btn--primary" id="footer-save-settings">บันทึกข้อความ</button>
            </div>
          </section>
          <section class="footer-editor__block footer-editor__block--links">
            <h3 class="footer-editor__title">ลิงก์ท้ายเว็บ</h3>
            <p class="muted footer-editor__lead">ลากแถวเพื่อจัดลำดับ · กดแก้ไขเพื่อเปลี่ยนรายละเอียด</p>
            <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มลิงก์</button></div>
            ${crudTableHtml(
              links,
              [
                { key: 'label', label: 'ชื่อ' },
                { key: 'url', label: 'ลิงก์' },
                { key: 'group_key', label: 'กลุ่ม', render: (r) => esc(footerGroupLabel(r.group_key)) },
                { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
              ],
              { sortable: true }
            )}
          </section>
        </div>`;

      $('#footer-save-settings').addEventListener('click', async () => {
        const settings = collectFooterSettings($('#footer-settings-form'), cachedSettings);
        try {
          await api('/footer', { method: 'PUT', body: { settings } });
          cachedSettings = settings;
          await publishAfterSave('บันทึกส่วนท้ายเว็บและอัปเดตหน้าเว็บแล้ว');
        } catch (err) {
          toast(toastEl, err.message, true);
        }
      });

      bindCrudActions('footer-links', load, footerLinkForm, {
        sortable: true,
        addTitle: 'เพิ่มลิงก์ท้ายเว็บ',
        editTitle: 'แก้ไขลิงก์ท้ายเว็บ',
        deleteMsg: 'ลบลิงก์นี้?',
      });
      window.SectionPreview?.attach(content);
    };
    try {
      await load();
    } catch (err) {
      $('.panel-body', content).innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
    }
  }

  let seoPageKey = 'home';

  async function renderSeo() {
    destroySortables();
    content.innerHTML = `
      <div class="panel panel--page">
        <div class="panel-head panel-head--seo">
          <div>
            <h2>SEO ตามหน้า</h2>
            <p class="muted panel-head__sub">ตั้งค่า Meta, รูปแชร์ และ URL สำหรับแต่ละหน้า</p>
          </div>
          <label class="seo-page-picker">
            <span class="seo-page-picker__label">เลือกหน้า</span>
            <select id="seo-page-select">
              ${SEO_PAGES.map((p) => `<option value="${p.key}">${esc(p.label)}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="panel-body" id="seo-form"><p class="muted">กำลังโหลด...</p></div>
      </div>`;

    const selectEl = $('#seo-page-select');
    selectEl.value = seoPageKey;

    async function loadSeo() {
      seoPageKey = selectEl.value;
      const formEl = $('#seo-form');
      formEl.innerHTML = '<p class="muted">กำลังโหลด...</p>';
      try {
        const row = await api(`/seo/${seoPageKey}`);
        formEl.innerHTML = seoFormHtml(row, seoPageKey);
        bindSeoEditor(formEl, seoPageKey);
        $('#seo-save', formEl)?.addEventListener('click', async () => {
          const editor = $('#seo-editor', formEl);
          const body = collectFormData(editor || formEl);
          try {
            await api(`/seo/${seoPageKey}`, { method: 'PUT', body });
            await publishAfterSave('บันทึก SEO และอัปเดตหน้าเว็บแล้ว');
          } catch (err) {
            toast(toastEl, err.message, true);
          }
        });
      } catch (err) {
        formEl.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
      }
    }

    selectEl.addEventListener('change', loadSeo);
    await loadSeo();
  }

  const mediaPickerEl = () => $('#media-picker');

  function closeMediaPicker() {
    const el = mediaPickerEl();
    if (el) el.hidden = true;
    document.body.classList.remove('media-picker-open');
    mediaPickCallback = null;
    mediaPickMulti = false;
    mediaPickMultiSelected = [];
    const multiBar = $('#media-picker-multi-bar');
    if (multiBar) multiBar.hidden = true;
    const hint = $('#media-picker-hint');
    if (hint) hint.textContent = 'คลิกรูปเพื่อเลือก — กลับไปฟอร์มเดิมโดยไม่สูญข้อมูล';
    resumeModalAfterMediaPick();
  }

  function updateMediaPickerMultiUi() {
    const bar = $('#media-picker-multi-bar');
    const countEl = $('#media-picker-multi-count');
    const hint = $('#media-picker-hint');
    if (!bar || !countEl) return;
    if (mediaPickMulti) {
      bar.hidden = false;
      countEl.textContent = `เลือกแล้ว ${mediaPickMultiSelected.length} รูป`;
      if (hint) hint.textContent = 'คลิกรูปเพื่อเลือกหลายรูป — กด «ใช้รูปที่เลือก» เมื่อเสร็จ';
    } else {
      bar.hidden = true;
      if (hint) hint.textContent = 'คลิกรูปเพื่อเลือก — กลับไปฟอร์มเดิมโดยไม่สูญข้อมูล';
    }
  }

  function mediaItemThumbHtml(m) {
    const isImg = (m.mime_type || '').startsWith('image/');
    if (isImg) {
      return `<img src="../../${esc(m.stored_path)}" alt="${esc(m.alt_text || m.filename)}">`;
    }
    return `<div class="media-item__file-icon" aria-hidden="true">${window.LucideIcons?.svg('file-text', { size: 40 }) || ''}</div>`;
  }

  async function loadMediaGrid(gridEl, { pickMode = false, multi = false } = {}) {
    if (!gridEl) return;
    gridEl.innerHTML = '<p class="muted">กำลังโหลด...</p>';
    try {
      const items = await api('/media');
      if (!items.length) {
        gridEl.innerHTML = '<p class="empty-state">ยังไม่มีไฟล์ — อัปโหลดด้านบน</p>';
        return;
      }
      gridEl.innerHTML = items
        .map(
          (m) => `<div class="media-item${pickMode ? ' media-item--pickable' : ''}" data-path="${esc(m.stored_path)}" data-id="${m.id}"${pickMode ? ' tabindex="0" role="button"' : ''}>
            ${mediaItemThumbHtml(m)}
            <div class="media-item__meta">${esc(m.filename)}</div>
            <div class="media-item__actions">
              ${pickMode ? `<span class="muted media-item__pick-hint">${multi ? 'คลิกเพื่อเลือก/ยกเลิก' : 'คลิกเพื่อเลือก'}</span>` : `<button type="button" class="btn btn--danger btn--sm" data-del-media="${m.id}">ลบ</button>`}
            </div>
          </div>`
        )
        .join('');

      gridEl.querySelectorAll('.media-item').forEach((el) => {
        const selectFile = () => {
          const path = el.dataset.path;
          if (!path || !pickMode || !mediaPickCallback) return;
          if (multi) {
            if (mediaPickMultiSelected.includes(path)) {
              mediaPickMultiSelected = mediaPickMultiSelected.filter((p) => p !== path);
              el.classList.remove('is-selected');
            } else {
              mediaPickMultiSelected.push(path);
              el.classList.add('is-selected');
            }
            updateMediaPickerMultiUi();
            return;
          }
          const cb = mediaPickCallback;
          closeMediaPicker();
          cb(path);
          toast(toastEl, `เลือก: ${path}`);
        };
        el.addEventListener('click', (e) => {
          if (e.target.closest('[data-del-media]')) return;
          selectFile();
        });
        if (pickMode) {
          el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectFile();
            }
          });
        }
      });

      gridEl.querySelectorAll('[data-del-media]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirmDelete('ลบไฟล์นี้?')) return;
          try {
            await api(`/media/${btn.dataset.delMedia}`, { method: 'DELETE' });
            toast(toastEl, 'ลบไฟล์เรียบร้อย');
            await loadMediaGrid(gridEl, { pickMode });
          } catch (err) {
            toast(toastEl, err.message, true);
          }
        });
      });
    } catch (err) {
      gridEl.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
    }
  }

  let mediaPickerInited = false;

  function initMediaPicker() {
    if (mediaPickerInited) return;
    mediaPickerInited = true;
    const fileInput = $('#media-picker-file');
    $('#media-picker-close')?.addEventListener('click', () => closeMediaPicker());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mediaPickCallback && mediaPickerEl() && !mediaPickerEl().hidden) {
        closeMediaPicker();
      }
    });
    $('#media-picker-upload-btn')?.addEventListener('click', () => fileInput?.click());
    $('#media-picker-multi-confirm')?.addEventListener('click', () => {
      if (!mediaPickMulti || !mediaPickCallback || !mediaPickMultiSelected.length) {
        toast(toastEl, 'เลือกรูปอย่างน้อย 1 รูป', true);
        return;
      }
      const cb = mediaPickCallback;
      const paths = [...mediaPickMultiSelected];
      closeMediaPicker();
      cb(paths);
      toast(toastEl, `เลือก ${paths.length} รูปแล้ว`);
    });
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      try {
        await api('/media/upload', { method: 'POST', body: fd });
        toast(toastEl, 'อัปโหลดสำเร็จ');
        await loadMediaGrid($('#media-picker-grid'), { pickMode: true });
      } catch (err) {
        toast(toastEl, err.message, true);
      }
      fileInput.value = '';
    });
  }

  function openMediaPicker(callback, options = {}) {
    suspendModalForMediaPick();
    mediaPickCallback = callback;
    mediaPickMulti = !!options.multiple;
    mediaPickMultiSelected = [];
    initMediaPicker();
    const picker = mediaPickerEl();
    if (!picker) {
      navigate('media');
      return;
    }
    picker.hidden = false;
    document.body.classList.add('media-picker-open');
    updateMediaPickerMultiUi();
    loadMediaGrid($('#media-picker-grid'), { pickMode: true, multi: mediaPickMulti });
  }

  async function renderMedia() {
    destroySortables();
    content.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <h2>คลังสื่อ</h2>
        </div>
        <div class="panel-body">
          <div class="media-upload">
            <input type="file" id="media-file" accept="image/*,.pdf,.svg" hidden>
            <button type="button" class="btn btn--primary" id="media-upload-btn">อัปโหลดไฟล์</button>
            <p class="muted">รองรับ JPG, PNG, GIF, WebP, SVG, PDF</p>
          </div>
          <div id="media-grid" class="media-grid"><p class="muted">กำลังโหลด...</p></div>
        </div>
      </div>`;

    const fileInput = $('#media-file');
    $('#media-upload-btn').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      try {
        await api('/media/upload', { method: 'POST', body: fd });
        toast(toastEl, 'อัปโหลดสำเร็จ');
        await loadMediaGrid($('#media-grid'), { pickMode: false });
      } catch (err) {
        toast(toastEl, err.message, true);
      }
      fileInput.value = '';
    });

    await loadMediaGrid($('#media-grid'), { pickMode: false });
  }

  async function renderUsers() {
    destroySortables();
    content.innerHTML = panelShell('ผู้ใช้ระบบ', '<p class="muted">กำลังโหลด...</p>');
    const load = async () => {
      const rows = await api('/users');
      $('.panel-body', content).innerHTML = `
        <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มผู้ใช้</button></div>
        ${crudTableHtml(rows, [
          { key: 'username', label: 'ชื่อผู้ใช้' },
          { key: 'email', label: 'อีเมล' },
          { key: 'role', label: 'บทบาท' },
          { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
        ])}`;
      bindCrudActions('users', load, (row) => {
        const r = row || {};
        return `<div class="form-grid">
          ${input('username', 'ชื่อผู้ใช้', r.username, 'text', { required: true })}
          ${input('email', 'อีเมล', r.email, 'email')}
          ${input('password', row ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน', '', 'password', { required: !row })}
          ${select('role', 'บทบาท', [
            { value: 'editor', label: 'Editor' },
            { value: 'admin', label: 'Admin' },
            { value: 'super_admin', label: 'Super Admin' },
          ], r.role || 'editor')}
          ${checkbox('is_active', 'เปิดใช้งาน', row ? !!r.is_active : true)}
        </div>`;
      }, {
        addTitle: 'เพิ่มผู้ใช้',
        editTitle: 'แก้ไขผู้ใช้',
        collectForm: () => {
          const body = collectFormData(modalBody);
          if (!body.password) delete body.password;
          return body;
        },
        deleteMsg: 'ลบผู้ใช้นี้? (เฉพาะ super_admin)',
      });
    };
    await load();
  }

  function settingsPhoneCard(title, labelName, labelVal, displayName, displayVal, telName, telVal, telPh) {
    return `<div class="footer-phone-card">
      <p class="footer-phone-card__title">${esc(title)}</p>
      <div class="form-grid form-grid--stacked">
        ${input(labelName, 'ป้ายแสดง', labelVal)}
        ${input(displayName, 'เบอร์ (แสดงบนเว็บ)', displayVal)}
        ${input(telName, 'เบอร์โทร (tel:)', telVal, 'text', { placeholder: telPh })}
      </div>
    </div>`;
  }

  function clampBrandScale(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 100;
    return Math.min(150, Math.max(70, Math.round(n / 5) * 5));
  }

  function settingsFormHtml(site, header, maintenance) {
    const s = site || {};
    const h = header || {};
    const m = maintenance || {};
    const tam = s.phones?.tam || {};
    const a = s.phones?.a || {};
    const logoPath = h.logoPath || 'assets/logo/logo.png';
    const logoSrc = logoPath.startsWith('http') ? logoPath : `../../${logoPath.replace(/^\//, '')}`;
    const logoPreview = logoPath
      ? `<img class="settings-logo-preview__img" src="${esc(logoSrc)}" alt="" loading="lazy">`
      : '<p class="muted settings-logo-preview__empty">ยังไม่มีโลโก้</p>';

    return `<div class="settings-editor__sections" id="settings-sections">
      ${seoAcc(
        'ข้อมูลแบรนด์',
        `<div class="form-grid form-grid--stacked">
          ${input('site_name', 'ชื่อเว็บ / แบรนด์', s.name || '', 'text', {
            full: true,
            hint: 'ใช้ในเมนู หัวข้อ และข้อความทั่วไป',
          })}
          ${input('site_brandSlug', 'ชื่อ slug (footer)', s.brandSlug || '', 'text', {
            full: true,
            placeholder: 'wealthlifeinsure',
            hint: 'ชื่อที่แสดงใต้โลโก้ท้ายเว็บ (ถ้าไม่แก้ในส่วนท้ายเว็บ)',
          })}
          ${input('site_title', 'Title เริ่มต้น', s.title || '', 'text', { full: true })}
        </div>`,
        true
      )}
      ${seoAcc(
        'คำอธิบายและ SEO เริ่มต้น',
        `<div class="form-grid form-grid--stacked">
          ${textarea('site_tagline', 'Tagline / คำโปรย', s.tagline || '', 3, { full: true })}
          ${seoFieldDesc('site_metaDescription', 'Meta Description เริ่มต้น', s.metaDescription, SEO_DESC_MAX)}
          <p class="form-hint form-field--full">ค่าเริ่มต้นเมื่อหน้านั้นยังไม่ตั้ง SEO — แก้รายหน้าได้ที่เมนู <strong>SEO</strong></p>
        </div>`
      )}
      ${seoAcc(
        'เบอร์โทรติดต่อ (ค่ากลางทั้งเว็บ)',
        `<div class="footer-phone-grid">
          ${settingsPhoneCard(
            'คุณแต้ม',
            'site_phone_tam_label',
            tam.label || 'แต้ม',
            'site_phone_tam_display',
            tam.display || '',
            'site_phone_tam_tel',
            tam.tel || '',
            '0870467443'
          )}
          ${settingsPhoneCard(
            'คุณเอ',
            'site_phone_a_label',
            a.label || 'เอ',
            'site_phone_a_display',
            a.display || '',
            'site_phone_a_tel',
            a.tel || '',
            '0834515615'
          )}
        </div>
        <p class="form-hint" style="margin-top:0.75rem">ใช้เป็นค่าเริ่มต้นในส่วนท้ายเว็บ — แก้รายละเอียดท้ายเว็บได้ที่เมนู <strong>ส่วนท้ายเว็บ</strong></p>`
      )}
      ${seoAcc(
        'ข้อมูลสำนักงานและลิขสิทธิ์',
        `<div class="form-grid form-grid--stacked">
          ${input('site_office', 'ที่ตั้งสำนักงาน', s.office || '', 'text', { full: true })}
          ${input('site_hours', 'เวลาทำการ', s.hours || '', 'text', { full: true })}
          ${input('site_licenses', 'ใบอนุญาต', s.licenses || '', 'text', { full: true })}
          ${input('site_copyright', 'ลิขสิทธิ์', s.copyright || '', 'text', { full: true })}
          ${textarea('site_footerNote', 'หมายเหตุท้ายเว็บ (ค่าเริ่มต้น)', s.footerNote || '', 2, { full: true })}
        </div>`
      )}
      ${seoAcc(
        'หัวเว็บ (Header)',
        `<div class="form-grid form-grid--stacked">
          ${input('header_brandName', 'ชื่อในแถบเมนู', h.brandName || s.name || '', 'text', {
            full: true,
            hint: 'ข้อความข้างโลโก้ด้านบน',
          })}
          <div class="form-field form-field--full">
            <label for="f-header_brandNameScale">ขนาดชื่อในแถบเมนู</label>
            <div class="settings-brand-scale">
              <input id="f-header_brandNameScale" name="header_brandNameScale" type="range" min="70" max="150" step="5" value="${esc(String(clampBrandScale(h.brandNameScale)))}">
              <output class="settings-brand-scale__val" for="f-header_brandNameScale" id="header-brand-scale-out">${esc(String(clampBrandScale(h.brandNameScale)))}%</output>
            </div>
            <p class="settings-brand-scale__preview brand-name" id="header-brand-scale-preview" translate="no" style="--brand-name-scale:${esc(String(clampBrandScale(h.brandNameScale) / 100))}">${esc(h.brandName || s.name || 'Wealth Life Insure')}</p>
            <p class="form-hint">ลากเพื่อย่อ/ขยายชื่อข้างโลโก้ (70%–150%) — ค่าเริ่มต้น 100%</p>
          </div>
          ${mediaPickField('header_logoPath', 'โลโก้ (path)', logoPath)}
          <div class="settings-logo-preview form-field--full" id="settings-logo-preview">${logoPreview}</div>
        </div>`
      )}
      ${seoAcc(
        'โหมดบำรุงรักษา',
        `<div class="form-grid form-grid--stacked settings-maint">
          <div class="settings-maint__toggle form-field--full">
            ${checkbox('maint_enabled', 'เปิดโหมดบำรุงรักษา (ปิดเว็บชั่วคราว)', !!m.enabled)}
          </div>
          ${textarea(
            'maint_message',
            'ข้อความแจ้งผู้เยี่ยมชม',
            m.message || 'เว็บไซต์อยู่ระหว่างปรับปรุง กรุณากลับมาใหม่ภายหลัง',
            4,
            { full: true }
          )}
          <p class="form-hint form-field--full">เมื่อเปิด ผู้เยี่ยมชมจะเห็นข้อความนี้แทนหน้าเว็บหลัก</p>
        </div>`
      )}
    </div>`;
  }

  function collectSiteFromForm(formRoot, existing) {
    const g = (name) => $(`[name="${name}"]`, formRoot)?.value?.trim() ?? '';
    return {
      ...(existing || {}),
      name: g('site_name'),
      brandSlug: g('site_brandSlug'),
      title: g('site_title'),
      tagline: g('site_tagline'),
      metaDescription: g('site_metaDescription'),
      office: g('site_office'),
      hours: g('site_hours'),
      licenses: g('site_licenses'),
      copyright: g('site_copyright'),
      footerNote: g('site_footerNote'),
      phones: {
        tam: {
          label: g('site_phone_tam_label'),
          display: g('site_phone_tam_display'),
          tel: g('site_phone_tam_tel'),
        },
        a: {
          label: g('site_phone_a_label'),
          display: g('site_phone_a_display'),
          tel: g('site_phone_a_tel'),
        },
      },
    };
  }

  function bindSettingsEditor(formRoot) {
    const logoEl = $('[name="header_logoPath"]', formRoot);
    const descEl = $('[name="site_metaDescription"]', formRoot);
    const brandNameEl = $('[name="header_brandName"]', formRoot);
    const scaleEl = $('[name="header_brandNameScale"]', formRoot);
    const scaleOut = $('#header-brand-scale-out', formRoot);
    const scalePreview = $('#header-brand-scale-preview', formRoot);

    function updateLogoPreview() {
      const wrap = $('#settings-logo-preview', formRoot);
      if (!wrap) return;
      const path = logoEl?.value?.trim() || '';
      if (!path) {
        wrap.innerHTML = '<p class="muted settings-logo-preview__empty">ยังไม่มีโลโก้</p>';
        return;
      }
      const src = path.startsWith('http') ? path : `../../${path.replace(/^\//, '')}`;
      wrap.innerHTML = `<img class="settings-logo-preview__img" src="${esc(src)}" alt="" loading="lazy">`;
    }

    function updateDescCounter() {
      if (!descEl) return;
      const max = Number(descEl.dataset.seoMax) || SEO_DESC_MAX;
      const badge = $('#seo-count-site_metaDescription', formRoot);
      if (!badge) return;
      const len = descEl.value.length;
      badge.textContent = `${len} / ${max}`;
      badge.classList.remove('seo-counter--warn', 'seo-counter--over');
      if (len > max) badge.classList.add('seo-counter--over');
      else if (len > max * 0.9) badge.classList.add('seo-counter--warn');
    }

    function updateBrandScalePreview() {
      const pct = clampBrandScale(scaleEl?.value);
      if (scaleEl) scaleEl.value = String(pct);
      if (scaleOut) scaleOut.textContent = `${pct}%`;
      if (scalePreview) {
        scalePreview.style.setProperty('--brand-name-scale', String(pct / 100));
        const name = brandNameEl?.value?.trim();
        if (name) scalePreview.textContent = name;
      }
    }

    logoEl?.addEventListener('input', updateLogoPreview);
    descEl?.addEventListener('input', updateDescCounter);
    brandNameEl?.addEventListener('input', updateBrandScalePreview);
    scaleEl?.addEventListener('input', updateBrandScalePreview);

    $$('[data-media-pick]', formRoot).forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.mediaPick;
        openMediaPicker((path) => {
          const el = $(`[name="${field}"]`, formRoot);
          if (el) {
            el.value = path;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      });
    });

    updateLogoPreview();
    updateDescCounter();
    updateBrandScalePreview();
  }

  async function renderTracking() {
    destroySortables();
    content.innerHTML = panelShell('ติดตาม & โฆษณา', '<p class="muted">กำลังโหลด...</p>');
    try {
      const all = await api('/settings');
      const tracking = window.TrackingEditor?.mergeTracking(all.tracking) || {};
      const body = $('.panel-body', content);
      body.innerHTML = `
        <form id="tracking-form">
          ${window.TrackingEditor.formHtml(tracking, sitePublicUrl())}
          <div class="tracking-editor__actions">
            <button type="submit" class="btn btn--primary">บันทึกการตั้งค่า</button>
            <span class="muted tracking-editor__save-hint">บันทึกแล้วระบบจะอัปเดตหน้าเว็บให้อัตโนมัติ</span>
          </div>
        </form>`;
      const form = $('#tracking-form');
      window.TrackingEditor.bindForm(form);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = window.TrackingEditor.collect(form);
        try {
          await api('/settings', { method: 'PUT', body: { tracking: payload } });
          await publishAfterSave('บันทึกการติดตาม & โฆษณาและอัปเดตหน้าเว็บแล้ว');
        } catch (err) {
          toast(toastEl, err.message, true);
        }
      });
    } catch (err) {
      $('.panel-body', content).innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
    }
  }

  function formatBytes(n) {
    const bytes = Number(n) || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function formatBackupDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return esc(String(iso).slice(0, 16));
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function backupStatsHtml(info) {
    const tables = info?.tables || {};
    const uploads = info?.uploads || {};
    const articleTotal = (Number(tables.articles) || 0) + (Number(tables.careers) || 0);
    return `<dl class="settings-backup__stats">
      <div><dt>บทความ / อาชีพ</dt><dd>${articleTotal} รายการ</dd></div>
      <div><dt>แผนประกัน</dt><dd>${Number(tables.insurance_plans) || 0} รายการ</dd></div>
      <div><dt>ลีดติดต่อ</dt><dd>${Number(tables.leads) || 0} รายการ</dd></div>
      <div><dt>ไฟล์ใน uploads</dt><dd>${Number(uploads.fileCount) || 0} ไฟล์ · ${formatBytes(uploads.bytes)}</dd></div>
    </dl>`;
  }

  function normalizeBackupFiles(list, created) {
    let next = Array.isArray(list) ? [...list] : [];
    if (created?.filename) {
      next = [created, ...next.filter((f) => f.filename !== created.filename)];
    }
    return next.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  function backupFilesTableHtml(files) {
    if (!files?.length) {
      return '<p class="muted backup-list__empty">ยังไม่มีไฟล์แบ็คอัพ — กดปุ่ม「สร้างแบ็คอัพ」ด้านบน</p>';
    }
    const rows = files
      .map((f) => {
        const downloadUrl = buildApiUrl(`/backup/download?file=${encodeURIComponent(f.filename)}`);
        return `<tr>
          <td class="admin-table__td backup-table__name"><span class="backup-table__filename">${esc(f.filename)}</span></td>
          <td class="admin-table__td admin-table__td--date">${formatBackupDate(f.createdAt)}</td>
          <td class="admin-table__td admin-table__td--number">${formatBytes(f.size)}</td>
          <td class="admin-table__td admin-table__td--actions">
            <div class="table-actions" role="group" aria-label="จัดการแบ็คอัพ">
              <a class="btn btn--ghost btn--sm" href="${esc(downloadUrl)}" download>ดาวน์โหลด</a>
              <button type="button" class="btn btn--ghost btn--sm" data-backup-restore="${esc(f.filename)}">กู้คืนลงเครื่องนี้</button>
              <button type="button" class="btn btn--danger btn--sm" data-backup-delete="${esc(f.filename)}">ลบ</button>
            </div>
          </td>
        </tr>`;
      })
      .join('');
    return `<div class="admin-table-wrap backup-table-wrap">
      <table class="admin-table backup-table">
        <colgroup>
          <col class="backup-col backup-col--name">
          <col class="backup-col backup-col--date">
          <col class="backup-col backup-col--size">
          <col class="backup-col backup-col--actions">
        </colgroup>
        <thead>
          <tr>
            <th class="admin-table__th backup-table__th-name" scope="col">ชื่อไฟล์</th>
            <th class="admin-table__th admin-table__th--date" scope="col">วันที่สร้าง</th>
            <th class="admin-table__th admin-table__th--number" scope="col">ขนาด</th>
            <th class="admin-table__th admin-table__th--actions" scope="col">จัดการ</th>
          </tr>
        </thead>
        <tbody class="admin-table__body">${rows}</tbody>
      </table>
    </div>`;
  }

  async function renderBackup() {
    destroySortables();
    content.innerHTML = `
      <div class="panel panel--page panel--backup">
        <div class="panel-head">
          <h2>สำรองข้อมูล</h2>
          <div class="btn-row">
            <button type="button" class="btn btn--primary" id="backup-create-btn">สร้างแบ็คอัพ</button>
          </div>
        </div>
        <div class="panel-body panel-body--backup" id="backup-panel-body">
          <p class="muted">กำลังโหลด...</p>
        </div>
      </div>`;

    const body = $('#backup-panel-body');
    let files = [];
    let backupInfo = {};
    const updateBackupList = (nextFiles) => {
      files = Array.isArray(nextFiles) ? nextFiles : [];
      const wrap = $('#backup-files-wrap', body);
      if (!wrap) return;
      wrap.innerHTML = backupFilesTableHtml(files);
      bindBackupListActions();
    };

    const bindBackupListActions = () => {
      if (!body) return;
      body.querySelectorAll('[data-backup-restore]').forEach((btn) => {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', async () => {
          const filename = btn.getAttribute('data-backup-restore');
          if (!filename) return;
          if (!confirm(`กู้คืน「${filename}」ทับข้อมูลบนเครื่องนี้?\n\nใช้เมื่อต้องการให้ local ตรงกับแบ็คอัพ (เช่นจากเว็บลูกค้า)\nบัญชีผู้ใช้จะไม่ถูกทับ`)) {
            return;
          }
          const rebuild = confirm('สร้างหน้าเว็บ HTML ใหม่หลังกู้คืนด้วยหรือไม่? (แนะนำ: ตกลง)');
          btn.disabled = true;
          try {
            const data = await api('/backup/restore', {
              method: 'POST',
              body: { filename, rebuild: rebuild ? 1 : 0 },
            });
            toast(toastEl, `กู้คืนแล้ว${data.restored?.rebuilt ? ' และสร้างหน้าเว็บใหม่แล้ว' : ''}`);
            await syncBackupList({ files: data.files });
          } catch (err) {
            toast(toastEl, err.message, true);
          } finally {
            btn.disabled = false;
          }
        });
      });
      body.querySelectorAll('[data-backup-delete]').forEach((btn) => {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', async () => {
          const filename = btn.getAttribute('data-backup-delete');
          if (!filename || !confirmDelete(`ลบไฟล์แบ็คอัพ「${filename}」?`)) return;
          btn.disabled = true;
          try {
            const data = await api('/backup/file', { method: 'DELETE', body: { filename } });
            updateBackupList(data.files || files.filter((f) => f.filename !== filename));
            toast(toastEl, 'ลบแบ็คอัพแล้ว');
          } catch (err) {
            toast(toastEl, err.message, true);
            btn.disabled = false;
          }
        });
      });
    };

    const paintShell = (info) => {
      const maxStored = Number(info.maxStored) || 30;
      body.innerHTML = `
        <section class="settings-backup" aria-labelledby="backup-page-intro">
          <div class="settings-backup__intro">
            <p id="backup-page-intro" class="muted backup-page-intro">สร้างไฟล์ ZIP ที่รวมบทความ ข้อความ รูปภาพ แผนประกัน ลีด และไฟล์อัปโหลดทั้งหมด (ไม่รวมบัญชีผู้ใช้และรหัสผ่าน)</p>
            <p class="muted">ต้องการดึงข้อมูลจากเว็บลูกค้าลง local: สร้างแบ็คอัพบน production → ดาวน์โหลด → เปิด <a href="/cms/restore-backup-web.php" target="_blank" rel="noopener">หน้ากู้คืนแบ็คอัพ</a></p>
          </div>
          ${backupStatsHtml(info)}
          <p class="muted backup-list__note">เก็บไฟล์บนเซิร์ฟเวอร์ได้สูงสุด ${maxStored} รายการ — รายการเก่าจะถูกลบอัตโนมัติเมื่อเกินจำนวน</p>
        </section>
        <section class="backup-list-section">
          <h3 class="backup-list-section__title">รายการแบ็คอัพ <span class="backup-list-section__count" id="backup-files-count"></span></h3>
          <div id="backup-files-wrap"></div>
        </section>`;
    };

    const syncBackupList = async (payload = {}) => {
      if (payload.info) backupInfo = payload.info;
      let next = normalizeBackupFiles(payload.files, payload.created);
      if (!next.length) {
        try {
          const listed = await api('/backup/list');
          next = listed.files || [];
        } catch {
          next = files;
        }
      }
      const countEl = $('#backup-files-count', body);
      if (countEl) countEl.textContent = next.length ? `(${next.length})` : '';
      updateBackupList(next);
    };

    try {
      const data = await api('/backup/info');
      backupInfo = data.info || {};
      files = data.files || [];
      paintShell(backupInfo);
      await syncBackupList({ files });
    } catch (err) {
      body.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
      return;
    }

    const createBtn = $('#backup-create-btn');
    if (createBtn && createBtn.dataset.bound !== '1') {
      createBtn.dataset.bound = '1';
      createBtn.addEventListener('click', async () => {
        if (createBtn.disabled) return;
        createBtn.disabled = true;
        createBtn.textContent = 'กำลังสร้าง…';
        try {
          const data = await api('/backup/create', { method: 'POST', body: {} });
          await syncBackupList({
            files: data.files,
            created: data.file,
          });
          toast(toastEl, `สร้างแบ็คอัพแล้ว: ${data.file?.filename || ''}`);
        } catch (err) {
          toast(toastEl, err.message, true);
        } finally {
          createBtn.disabled = false;
          createBtn.textContent = 'สร้างแบ็คอัพ';
        }
      });
    }
  }

  async function renderSettings() {
    destroySortables();
    content.innerHTML = panelShell('ตั้งค่าระบบ', '<p class="muted">กำลังโหลด...</p>');
    try {
      let cached = await api('/settings');
      const body = $('.panel-body', content);

      body.innerHTML = `
        <p class="muted settings-editor__intro">ค่ากลางของเว็บไซต์ — บันทึกแล้วนำไปใช้บนหน้าเว็บอัตโนมัติ</p>
        <form id="settings-form" class="settings-editor">
          ${settingsFormHtml(cached.site, cached.header, cached.maintenance)}
          <div class="settings-editor__actions">
            <button type="submit" class="btn btn--primary">บันทึกการตั้งค่า</button>
            <span class="muted settings-editor__save-hint">SEO รายหน้า · ส่วนท้ายเว็บ · เมนู — แก้ในเมนูแยกตามหัวข้อ</span>
          </div>
        </form>`;

      const form = $('#settings-form');
      bindSettingsEditor(form);

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newSite = collectSiteFromForm(form, cached.site || {});
        const newHeader = {
          brandName: $('[name="header_brandName"]', form)?.value?.trim() || newSite.name,
          logoPath: $('[name="header_logoPath"]', form)?.value?.trim() || 'assets/logo/logo.png',
          brandNameScale: clampBrandScale($('[name="header_brandNameScale"]', form)?.value),
        };
        const newMaint = {
          enabled: !!$('[name="maint_enabled"]', form)?.checked,
          message:
            $('[name="maint_message"]', form)?.value?.trim() ||
            'เว็บไซต์อยู่ระหว่างปรับปรุง กรุณากลับมาใหม่ภายหลัง',
        };
        try {
          cached = await api('/settings', {
            method: 'PUT',
            body: { site: newSite, header: newHeader, maintenance: newMaint },
          });
          await publishAfterSave('บันทึกตั้งค่าระบบและอัปเดตหน้าเว็บแล้ว');
        } catch (err) {
          toast(toastEl, err.message, true);
        }
      });
    } catch (err) {
      $('.panel-body', content).innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
    }
  }

  function previewTriggerBtn(previewKey, label) {
    return `<button type="button" class="section-preview-trigger" data-section-preview="${esc(previewKey)}" aria-label="ดูตัวอย่าง ${esc(label)}" title="ดูตัวอย่างส่วนนี้">?</button>`;
  }

  function panelShell(title, inner, opts = {}) {
    const previewKey = opts.previewKey;
    const showPreviewInHead = previewKey && !opts.previewInBody;
    const titleHtml = showPreviewInHead
      ? `<span class="panel-head__title-group">${esc(title)}${previewTriggerBtn(previewKey, title)}</span>`
      : esc(title);
    return `<div class="panel panel--page"><div class="panel-head"><h2>${titleHtml}</h2></div><div class="panel-body">${inner}</div></div>`;
  }

  const ROUTES = {
    dashboard: renderDashboard,
    nav: renderNav,
    home: renderHome,
    pages: renderPages,
    banners: renderBanners,
    categories: renderCategories,
    plans: renderPlans,
    articles: renderArticles,
    testimonials: renderTestimonials,
    leads: renderLeads,
    cta: renderCta,
    footer: renderFooter,
    seo: renderSeo,
    tracking: renderTracking,
    media: renderMedia,
    users: renderUsers,
    backup: renderBackup,
    settings: renderSettings,
  };

  async function renderRoute(route) {
    destroySortables();
    content.classList.remove('is-page-builder');
    const fn = ROUTES[route] || ROUTES.dashboard;
    try {
      await fn();
    } catch (err) {
      content.innerHTML = `<div class="panel"><div class="panel-body"><p class="form-error">${esc(err.message)}</p></div></div>`;
    }
  }

  /* ——— Boot ——— */
  checkSession();
})();
