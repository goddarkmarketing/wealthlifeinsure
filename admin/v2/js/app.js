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
    { id: 'cta', label: 'ช่องทางติดต่อ' },
    { id: 'footer', label: 'ส่วนท้ายเว็บ' },
    { id: 'seo', label: 'SEO' },
    { id: 'tracking', label: 'ติดตาม & โฆษณา' },
    { id: 'media', label: 'คลังสื่อ' },
    { id: 'users', label: 'ผู้ใช้' },
    { id: 'settings', label: 'ตั้งค่าระบบ' },
  ];

  /** ไอคอนมินิมอล (stroke) — ใช้ currentColor ตามธีม sidebar */
  const NAV_ICONS = {
    dashboard:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    nav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/></svg>',
    pages:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
    banners:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="m21 16-5.5-5.5L5 21"/></svg>',
    categories:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h7v7H4zM13 7h7v7h-7zM4 16h7v5H4zM13 16h7v5h-7z"/></svg>',
    plans:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/><path d="M9 12h6M9 16h6"/></svg>',
    articles:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M14 4v5h5M8 13h8M8 17h6"/></svg>',
    testimonials:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.8l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 2z"/></svg>',
    leads:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16v14H5.2L4 19.2V4z"/><path d="M8 9h8M8 13h5"/></svg>',
    cta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h2a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.11a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z"/></svg>',
    footer:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="14" width="18" height="7" rx="1"/><path d="M7 14V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6"/></svg>',
    seo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    tracking:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',
    media:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/><path d="M4 14l4-4 4 4 4-5 4 5"/></svg>',
    users:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
    settings:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  };

  function navIcon(id) {
    return NAV_ICONS[id] || NAV_ICONS.dashboard;
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
    { route: 'cta', label: 'ช่องทางติดต่อ' },
    { route: 'footer', label: 'ส่วนท้ายเว็บ' },
    { route: 'seo', label: 'SEO / Meta' },
    { route: 'tracking', label: 'ติดตาม & โฆษณา' },
    { route: 'media', label: 'คลังสื่อ / อัปโหลดรูป' },
    { route: 'users', label: 'ผู้ใช้งาน' },
  ];

  const STAT_ICONS = {
    articles:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M14 4v5h5M8 13h8"/></svg>',
    draft:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9M7 20H5a1 1 0 0 1-1-1v-1M17.5 3.5a2.1 2.1 0 0 1 3 3L9 18l-4 1 1-4 11.5-11.5z"/></svg>',
    plans:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 12h6M9 16h6"/></svg>',
    leads:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 4h16v14H5.2L4 19.2V4z"/><path d="M8 9h8"/></svg>',
    media:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="m21 16-5.5-5.5L5 21"/></svg>',
    reviews:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.8l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 2z"/></svg>',
  };

  function statCard(value, label, iconKey, tone = 'blue') {
    const icon = STAT_ICONS[iconKey] || STAT_ICONS.articles;
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
      <select id="f-${name}" name="${esc(name)}">${opts}</select>
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
    const fallback = $(`[name="body_html"]`, modalBody);
    if (fallback?.tagName === 'TEXTAREA' && isFormFieldQuillHidden(fallback)) {
      showFormField(fallback, { rows: 12 });
    } else if (fallback?.tagName === 'INPUT' && fallback.type === 'hidden') {
      fallback.type = 'text';
    }
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
    wrap.innerHTML = `<label>เนื้อหา (HTML)</label><div id="${mountId}" class="quill-mount"></div>`;
    hidden.parentElement.appendChild(wrap);

    const mount = document.getElementById(mountId);
    if (!mount) return;

    try {
      quillEditor = new Quill(mount, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean'],
          ],
        },
      });
      quillEditor.root.innerHTML = hidden.value || '';
    } catch (err) {
      console.error('Quill init failed:', err);
      wrap.remove();
      if (hidden.tagName === 'TEXTAREA') showFormField(hidden, { rows: 14 });
      else hidden.type = 'text';
      quillEditor = null;
    }
  }

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
  function destroySortables() {
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
    const route = h.split('/')[0] || 'dashboard';
    return {
      kind: 'route',
      route: MENU.some((x) => x.id === route) ? route : 'dashboard',
    };
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
    pageTitle.textContent = item ? item.label : 'Dashboard';
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

  /* ——— Generic CRUD table ——— */
  function crudTableHtml(rows, columns, opts = {}) {
    const sortable = opts.sortable;
    const tbodyClass = sortable ? 'admin-table__body sortable-list' : 'admin-table__body';
    const colSpan = columns.length + (sortable ? 2 : 1);

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
            return `<tr data-id="${row.id}">${drag}${cells}<td class="admin-table__td admin-table__td--actions"><div class="table-actions" role="group" aria-label="จัดการ"><button type="button" class="btn btn--ghost btn--sm" data-edit="${row.id}">แก้ไข</button><button type="button" class="btn btn--danger btn--sm" data-del="${row.id}">ลบ</button></div></td></tr>`;
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
              body[opts.modalOpts.quillField] = quillEditor.root.innerHTML;
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
        await api(`/sections/${key}`, {
          method: 'PUT',
          body: { page_key: 'home', config, is_active: actEl.checked ? 1 : 0 },
        });
        sectionConfigStore[key] = config;
        if (btn) btn.textContent = 'กำลังอัปเดตหน้าเว็บ...';
        await publishAfterSave('บันทึกและอัปเดตหน้าเว็บแล้ว');
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
      const byKey = {};
      sections.forEach((s) => {
        byKey[s.section_key] = s;
      });

      const pageHint = PSF?.pages?.[key]?.hint || '';
      const cards = wanted
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
              ${PSF?.formHtml?.(key, sk, s.config || {}) || ''}
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
      const rows = await api('/categories');
      $('.panel-body', content).innerHTML = `
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
          ${input('slug', 'Slug', r.slug)}
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

  async function renderPlans() {
    destroySortables();
    content.innerHTML = panelShell('แผนประกัน', '<p class="muted">กำลังโหลด...</p>');
    let categories = [];
    try {
      categories = await api('/categories');
    } catch (_) {
      /* empty */
    }
    const load = async () => {
      const rows = await api('/plans');
      $('.panel-body', content).innerHTML = `
        <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มแผน</button></div>
        ${crudTableHtml(rows, [
          { key: 'name', label: 'ชื่อแผน' },
          { key: 'filter_tag', label: 'ประเภท' },
          { key: 'insurer_name', label: 'บริษัท' },
          { key: 'is_featured', label: 'แนะนำ', render: (r) => (r.is_featured ? '<span class="cell-star" title="แนะนำ">★</span>' : '<span class="muted">—</span>') },
          { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
        ], { sortable: true })}`;
      bindCrudActions('plans', load, (row) => {
        const r = row || {};
        const catOpts = [{ value: '', label: '— ไม่ระบุ —' }].concat(
          categories.map((c) => ({ value: c.id, label: c.name }))
        );
        const highlights =
          typeof r.highlights === 'object'
            ? JSON.stringify(r.highlights, null, 2)
            : r.highlights || '[]';
        return `<div class="form-grid">
          ${input('name', 'ชื่อแผน', r.name, 'text', { required: true })}
          ${input('slug', 'Slug', r.slug)}
          ${select('category_id', 'หมวด', catOpts, r.category_id ?? '')}
          ${select('filter_tag', 'แท็กกรอง', [
            { value: 'all', label: 'ทั้งหมด' },
            { value: 'life', label: 'ชีวิต' },
            { value: 'health', label: 'สุขภาพ' },
            { value: 'savings', label: 'ออมทรัพย์' },
          ], r.filter_tag || 'all')}
          ${textarea('short_description', 'คำอธิบายสั้น', r.short_description, 2, { full: true })}
          ${textarea('full_description', 'รายละเอียด', r.full_description, 4, { full: true })}
          ${textarea('highlights', 'จุดเด่น (JSON array)', highlights, 4, { full: true })}
          ${mediaPickField('image_path', 'รูป', r.image_path || '')}
          ${input('price_from', 'ราคาเริ่มต้น', r.price_from)}
          ${input('insurer_name', 'บริษัทประกัน', r.insurer_name || 'ไทยประกันชีวิต')}
          ${input('link_url', 'ลิงก์', r.link_url)}
          ${input('pdf_path', 'PDF', r.pdf_path)}
          ${checkbox('is_featured', 'แนะนำ', !!r.is_featured)}
          ${checkbox('is_hot', 'ฮอต', !!r.is_hot)}
          ${checkbox('is_active', 'เปิดใช้งาน', row ? !!r.is_active : true)}
        </div>`;
      }, {
        sortable: true,
        addTitle: 'เพิ่มแผน',
        editTitle: 'แก้ไขแผน',
        beforeSave: (body) => {
          if (body.highlights) {
            try {
              body.highlights = JSON.parse(body.highlights);
            } catch {
              throw new Error('JSON จุดเด่นไม่ถูกต้อง');
            }
          }
          if (body.category_id === '') body.category_id = null;
        },
        collectForm: () => {
          const body = collectFormData(modalBody);
          if (body.highlights) {
            try {
              body.highlights = JSON.parse(body.highlights);
            } catch {
              throw new Error('JSON จุดเด่นไม่ถูกต้อง');
            }
          }
          if (body.category_id === '') body.category_id = null;
          return body;
        },
      });
    };
    await load();
  }

  function collectArticleForm() {
    const body = collectFormData(modalBody);
    if (quillEditor) {
      body.body_html = quillEditor.root.innerHTML;
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
    wrap.innerHTML = `<label>เนื้อหาบทความ</label><div id="${mountId}" class="quill-mount"></div><p class="quill-resize-hint">ลากมุมล่างขวาของกล่องเพื่อขยายความสูง</p>`;
    hidden.parentElement.appendChild(wrap);

    const mount = document.getElementById(mountId);
    if (!mount) return;

    try {
      articleQuill = new Quill(mount, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean'],
          ],
        },
      });
      articleQuill.root.innerHTML = hidden.value || '';
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
      body.body_html = articleQuill.root.innerHTML;
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
          toast(toastEl, 'บันทึกบทความแล้ว');
          await publishAfterSave('อัปเดตหน้าเว็บแล้ว');
        } else {
          const created = await api('/articles', { method: 'POST', body });
          toast(toastEl, 'สร้างบทความแล้ว');
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
            <button type="button" class="btn btn--primary" id="article-editor-save">บันทึกบทความ</button>
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
                  { value: 'draft', label: 'แบบร่าง' },
                  { value: 'published', label: 'เผยแพร่' },
                ], r.status || 'draft')}
                ${input('published_at', 'วันเผยแพร่', r.published_at ? String(r.published_at).slice(0, 16) : '', 'datetime-local')}
                ${checkbox('is_featured', 'แนะนำในหน้ารวม', !!r.is_featured)}
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
    return `<div class="form-grid">
      ${input('slug', 'Slug', r.slug)}
      ${input('title', 'หัวข้อ', r.title, 'text', { required: true })}
      ${textarea('excerpt', 'คำโปรย', r.excerpt, 2, { full: true })}
      ${input('eyebrow', 'หมวดย่อย (eyebrow)', r.eyebrow || (isCareer ? 'แนะนำอาชีพ' : ''))}
      ${textarea('hero_lead', 'คำนำ Hero', r.hero_lead, 2, { full: true })}
      ${mediaPickField('cover_image', 'รูปปก', r.cover_image || '')}
      ${isCareer ? mediaPickField('hero_image', 'รูป Hero', r.hero_image || '') : ''}
      ${select('status', 'สถานะ', [
        { value: 'draft', label: 'แบบร่าง' },
        { value: 'published', label: 'เผยแพร่' },
      ], r.status || 'draft')}
      ${input('published_at', 'วันเผยแพร่', r.published_at ? r.published_at.slice(0, 16) : '', 'datetime-local')}
      ${checkbox('is_featured', 'แนะนำ', !!r.is_featured)}
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
            <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มบทความ</button></div>
            ${crudTableHtml(rows, [
              { key: 'title', label: 'หัวข้อ' },
              { key: 'slug', label: 'Slug' },
              { key: 'status', label: 'สถานะ' },
              { key: 'published_at', label: 'เผยแพร่', render: (r) => esc((r.published_at || '').slice(0, 10)) },
            ])}
          </div>
        </div>`;
      bindCrudActions('articles', () => loadArticles(), (row) => articleForm(row, 'articles'), {
        root: panel,
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
            <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มหน้าอาชีพ</button></div>
            ${crudTableHtml(rows, [
              { key: 'title', label: 'หัวข้อ' },
              { key: 'slug', label: 'Slug' },
              { key: 'status', label: 'สถานะ' },
            ])}
          </div>
        </div>`;
      bindCrudActions('careers', () => loadCareers(), (row) => articleForm(row, 'careers'), {
        root: panel,
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
          { key: 'email', label: 'อีเมล' },
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
            ${input('email', 'อีเมล', row.email)}
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
    content.innerHTML = panelShell('ช่องทางติดต่อ (CTA)', '<p class="muted">กำลังโหลด...</p>', {
      previewKey: 'ctaChannels',
    });
    const load = async () => {
      const rows = await api('/contact-channels');
      $('.panel-body', content).innerHTML = `
        <p class="muted" style="margin:0 0 1rem">ปุ่มชิปบนหน้า <strong>ติดต่อเรา</strong> — ลากแถวเพื่อจัดลำดับ · กดแก้ไขเพื่อเปลี่ยนรายละเอียด</p>
        <div class="toolbar"><button type="button" class="btn btn--primary" data-add>+ เพิ่มช่องทาง</button></div>
        ${crudTableHtml(rows, [
          { key: 'label', label: 'ชื่อ' },
          { key: 'value_text', label: 'ข้อความ' },
          { key: 'variant', label: 'ประเภท', render: (r) => esc(ctaVariantLabel(r.variant)) },
          { key: 'is_active', label: 'สถานะ', render: (r) => badgeActive(r.is_active) },
        ], { sortable: true })}`;
      bindCrudActions('contact-channels', load, ctaChannelForm, {
        sortable: true,
        addTitle: 'เพิ่มช่องทางติดต่อ',
        editTitle: 'แก้ไขช่องทางติดต่อ',
        deleteMsg: 'ลบช่องทางติดต่อนี้?',
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
      window.SectionPreview?.attach(content);
    };
    try {
      await load();
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
    resumeModalAfterMediaPick();
  }

  function mediaItemThumbHtml(m) {
    const isImg = (m.mime_type || '').startsWith('image/');
    if (isImg) {
      return `<img src="../../${esc(m.stored_path)}" alt="${esc(m.alt_text || m.filename)}">`;
    }
    return `<div class="media-item__file-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M14 4v5h5"/></svg></div>`;
  }

  async function loadMediaGrid(gridEl, { pickMode = false } = {}) {
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
              ${pickMode ? '<span class="muted media-item__pick-hint">คลิกเพื่อเลือก</span>' : `<button type="button" class="btn btn--danger btn--sm" data-del-media="${m.id}">ลบ</button>`}
            </div>
          </div>`
        )
        .join('');

      gridEl.querySelectorAll('.media-item').forEach((el) => {
        const selectFile = () => {
          const path = el.dataset.path;
          if (!path || !pickMode || !mediaPickCallback) return;
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

  function openMediaPicker(callback) {
    suspendModalForMediaPick();
    mediaPickCallback = callback;
    initMediaPicker();
    const picker = mediaPickerEl();
    if (!picker) {
      navigate('media');
      return;
    }
    picker.hidden = false;
    document.body.classList.add('media-picker-open');
    loadMediaGrid($('#media-picker-grid'), { pickMode: true });
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

    logoEl?.addEventListener('input', updateLogoPreview);
    descEl?.addEventListener('input', updateDescCounter);

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
    settings: renderSettings,
  };

  async function renderRoute(route) {
    destroySortables();
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
