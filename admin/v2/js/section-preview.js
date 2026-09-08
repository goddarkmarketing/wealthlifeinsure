/**
 * Section Hover Preview — Preview Card (แสดงตัวอย่างจากหน้าแรก)
 */
(function (global) {
  const SITE_BASE = (() => {
    const path = window.location.pathname.replace(/\/admin\/v2\/?.*$/, '');
    return `${window.location.origin}${path}`;
  })();
  const HOME_BASE = `${SITE_BASE}/index.html?cms_preview=1`;

  function previewBase(sectionId) {
    return `${previewPageBase(sectionId)}?cms_preview=1`;
  }
  const PREVIEW_ROOT = new URL('previews/', window.location.href).href;
  const IFRAME_W = 1280;
  const IFRAME_H = 720;
  const CARD_EST_H = 520;
  const LOAD_SAFETY_MS = 900;
  const CARD_MIN_W = 400;
  const CARD_MAX_W = 520;

  const SECTION_PREVIEW_MAP = {
    hero: { description: 'ส่วนบนสุดของหน้าแรก — หัวข้อใหญ่ ข้อความโปรย และสไลด์รูป' },
    solutionsHeading: { description: 'หัวข้อเหนือแถบแผนประกันที่แนะนำ (ดึงจากแผนที่ติ๊ก «แนะนำ»)' },
    productCategories: { description: 'แถวชิปหมวดประกัน — ไอคอนและลิงก์ไปแต่ละประเภท' },
    intro: { description: 'บล็อกแนะนำบริษัท — ข้อความจุดเด่นและรูปโปรโมต' },
    process: { description: 'ขั้นตอนการทำงาน 3 ขั้น และปุ่มลิงก์ไปหน้าติดต่อ' },
    taxPlansHeading: { description: 'หัวข้อเหนือส่วนแผนลดหย่อนภาษี / ออมทรัพย์' },
    testimonials: { description: 'หัวข้อเหนือการ์ดรีวิวลูกค้า (รีวิวแก้ในเมนูรีวิว)' },
    reviews: {
      title: 'รีวิวลูกค้า',
      description: 'ส่วนการ์ดรีวิว — คะแนนดาว ข้อความ และชื่อลูกค้า (ดึงจากรายการที่เปิดใช้งาน)',
      anchor: 'cms-section-testimonials',
    },
    homeArticles: { description: 'หัวข้อและลิงก์ไปรายการบทความ/ข่าวบนหน้าแรก' },
    homeCareers: {
      description: 'หัวข้อเหนือการ์ดแนะนำอาชีพตัวแทน',
      anchor: 'cms-section-promoBanners',
    },
    ctaBand: { description: 'แถบเชิญชวนติดต่อด้านล่างสุดของหน้าแรก' },
    banners: {
      title: 'แบนเนอร์โปรโมชัน',
      description: 'แถบแบนเนอร์ 2 ช่อง — รูปโปรโมตและลิงก์ (แสดงท้ายหน้าแรกและหน้าย่อย)',
      anchor: 'cms-section-promoBanners',
      page: 'index.html',
    },
    footer: {
      title: 'ส่วนท้ายเว็บ',
      description: 'โลโก้ คำอธิบาย เมนูลิงก์ หมวดประกัน ข้อมูลติดต่อ และลิงก์กฎหมาย',
      anchor: 'cms-section-footer',
    },
    ctaChannels: {
      title: 'โปรไฟล์ติดต่อ',
      description: 'การ์ดติดต่อบนหน้าติดต่อเรา — แยกตามโปรไฟล์ (โทร · LINE · Facebook)',
      anchor: '',
      page: 'contact.html',
    },
  };

  const ANCHOR_OVERRIDE = { taxPlansHeading: 'tax-plans' };

  function previewPageBase(sectionId) {
    const page = SECTION_PREVIEW_MAP[sectionId]?.page || 'index.html';
    return `${SITE_BASE}/${page}`;
  }

  function anchorId(sectionId) {
    const meta = SECTION_PREVIEW_MAP[sectionId];
    if (meta?.anchor) return meta.anchor;
    return ANCHOR_OVERRIDE[sectionId] || `cms-section-${sectionId}`;
  }

  function titleFor(sectionId) {
    const hsf = global.HomeSectionForms?.meta?.[sectionId];
    return hsf?.title || SECTION_PREVIEW_MAP[sectionId]?.title || sectionId;
  }

  function staticImageUrl(sectionId) {
    const file = SECTION_PREVIEW_MAP[sectionId]?.image;
    return file ? `${PREVIEW_ROOT}${file}` : '';
  }

  function placeholderUrl() {
    return `${PREVIEW_ROOT}placeholder.svg`;
  }

  function publicPageUrl(sectionId) {
    return `${previewPageBase(sectionId)}#${anchorId(sectionId)}`;
  }

  function previewPageUrl(sectionId) {
    return `${previewBase(sectionId)}#${anchorId(sectionId)}`;
  }

  function getSidebarRight() {
    const sb = document.querySelector('.sidebar');
    if (!sb) return 0;
    const r = sb.getBoundingClientRect();
    return r.width > 8 ? r.right : 0;
  }

  function cardWidth() {
    const margin = 32;
    const maxByViewport = window.innerWidth - getSidebarRight() - margin;
    return Math.round(Math.min(CARD_MAX_W, Math.max(CARD_MIN_W, Math.min(480, maxByViewport))));
  }

  class SectionPreviewCard {
    constructor() {
      this.el = document.createElement('div');
      this.el.className = 'section-preview';
      this.el.setAttribute('role', 'dialog');
      this.el.setAttribute('aria-label', 'ตัวอย่าง section');
      this.el.hidden = true;
      this.el.innerHTML = `
        <div class="section-preview__media">
          <div class="section-preview__static" hidden>
            <img class="section-preview__img" alt="">
            <div class="section-preview__placeholder" hidden>
              <div class="section-preview__placeholder-art" aria-hidden="true"></div>
              <p class="section-preview__placeholder-text">ยังไม่มีภาพตัวอย่าง</p>
              <p class="section-preview__placeholder-hint">กด «เปิดหน้าเว็บ» เพื่อดูส่วนนี้บนเว็บจริง</p>
            </div>
          </div>
          <div class="section-preview__live">
            <div class="section-preview__loading is-active">
              <span class="section-preview__spinner" aria-hidden="true"></span>
              <span>กำลังโหลดตัวอย่าง…</span>
            </div>
            <iframe class="section-preview__frame" title="ตัวอย่างส่วนบนหน้าเว็บ" tabindex="-1"></iframe>
          </div>
        </div>
        <div class="section-preview__footer">
          <p class="section-preview__eyebrow">ตัวอย่าง Section</p>
          <h3 class="section-preview__title"></h3>
          <p class="section-preview__desc"></p>
          <div class="section-preview__actions">
            <a class="section-preview__btn section-preview__btn--ghost" href="#" target="_blank" rel="noopener" data-preview-open>ดูตัวอย่าง</a>
            <a class="section-preview__btn section-preview__btn--primary" href="#" target="_blank" rel="noopener" data-preview-site>เปิดหน้าเว็บ</a>
          </div>
        </div>`;
      document.body.appendChild(this.el);

      this.staticWrap = this.el.querySelector('.section-preview__static');
      this.liveWrap = this.el.querySelector('.section-preview__live');
      this.img = this.el.querySelector('.section-preview__img');
      this.placeholder = this.el.querySelector('.section-preview__placeholder');
      this.loadingEl = this.el.querySelector('.section-preview__loading');
      this.iframe = this.el.querySelector('.section-preview__frame');
      this.titleEl = this.el.querySelector('.section-preview__title');
      this.descEl = this.el.querySelector('.section-preview__desc');
      this.btnPreview = this.el.querySelector('[data-preview-open]');
      this.btnSite = this.el.querySelector('[data-preview-site]');

      this.currentId = null;
      this.currentAnchor = null;
      this._anchorEl = null;
      this.hideTimer = null;
      this._loadSafety = null;
      this._iframeReady = false;
      this._warming = false;
      this._imgFallback = false;
      this._staticChecked = Object.create(null);

      this.el.style.setProperty('--sp-width', `${cardWidth()}px`);

      this.img.addEventListener('error', () => {
        if (!this._imgFallback) {
          this._imgFallback = true;
          this.img.src = placeholderUrl();
          return;
        }
        this.showStaticPlaceholder();
      });
      this.img.addEventListener('load', () => {
        if (this.staticWrap.hidden) return;
        this.placeholder.hidden = true;
        this.img.hidden = false;
      });

      this.iframe.addEventListener('load', () => {
        this._iframeReady = true;
        if (!this.el.hidden && this.currentAnchor) {
          this.scrollToAnchor(this.currentAnchor);
          this.finishLiveLoad();
        }
      });

      this.el.addEventListener('mouseenter', () => this.cancelHide());
      this.el.addEventListener('mouseleave', () => this.hide());
      window.addEventListener('resize', () => {
        this.el.style.setProperty('--sp-width', `${cardWidth()}px`);
        if (!this.el.hidden && this._anchorEl) {
          this.placeCard(this._anchorEl);
          this.fitIframe();
        }
      });
    }

    setLoading(active) {
      this.loadingEl.classList.toggle('is-active', active);
    }

    scheduleLoadSafety() {
      clearTimeout(this._loadSafety);
      this._loadSafety = setTimeout(() => this.finishLiveLoad(), LOAD_SAFETY_MS);
    }

    finishLiveLoad() {
      clearTimeout(this._loadSafety);
      this.setLoading(false);
      this.scrollToAnchor(this.currentAnchor);
      this.fitIframe();
    }

    showStaticPlaceholder() {
      this.img.hidden = true;
      this.placeholder.hidden = false;
    }

    fitIframe() {
      const w = this.liveWrap.clientWidth || cardWidth();
      if (w < 40) return;
      const scale = w / IFRAME_W;
      this.iframe.style.width = `${IFRAME_W}px`;
      this.iframe.style.height = `${IFRAME_H}px`;
      this.iframe.style.transform = `scale(${scale})`;
    }

    scrollToAnchor(anchor) {
      if (!anchor) return;
      try {
        const doc = this.iframe.contentDocument;
        const el = doc?.getElementById(anchor);
        if (!el || !doc) return;
        const y = el.getBoundingClientRect().top + doc.documentElement.scrollTop - 10;
        doc.documentElement.scrollTop = Math.max(0, y);
      } catch {
        /* same-origin only */
      }
    }

    iframeHasDoc() {
      try {
        return !!this.iframe.contentDocument?.body;
      } catch {
        return false;
      }
    }

    tryNavigate(anchor) {
      try {
        const win = this.iframe.contentWindow;
        if (!win || !this.iframeHasDoc()) return false;
        const pageBase = previewPageBase(this.currentId || '');
        const pageName = pageBase.split('/').pop() || 'index.html';
        if (!String(win.location.pathname).endsWith(pageName)) return false;
        if (win.location.hash === `#${anchor}`) {
          this.scrollToAnchor(anchor);
          this.finishLiveLoad();
          return true;
        }
        win.location.hash = anchor;
        setTimeout(() => {
          this.scrollToAnchor(anchor);
          this.finishLiveLoad();
        }, 50);
        return true;
      } catch {
        return false;
      }
    }

    async hasStaticImage(sectionId) {
      if (this._staticChecked[sectionId] !== undefined) {
        return this._staticChecked[sectionId];
      }
      const url = staticImageUrl(sectionId);
      if (!url) {
        this._staticChecked[sectionId] = false;
        return false;
      }
      try {
        const res = await fetch(url, { method: 'HEAD', credentials: 'same-origin' });
        this._staticChecked[sectionId] = res.ok;
      } catch {
        this._staticChecked[sectionId] = false;
      }
      return this._staticChecked[sectionId];
    }

    showLive(sectionId) {
      const anchor = anchorId(sectionId);
      this.currentAnchor = anchor;
      this.staticWrap.hidden = true;
      this.liveWrap.hidden = false;
      this.setLoading(true);
      this.updateLinks(sectionId);
      this.scheduleLoadSafety();
      this.fitIframe();

      if (this._iframeReady && this.tryNavigate(anchor)) return;

      this.iframe.src = `${previewBase(sectionId)}#${anchor}`;
    }

    showStatic(sectionId) {
      this.liveWrap.hidden = true;
      this.staticWrap.hidden = false;
      this.setLoading(false);
      this._imgFallback = false;
      this.img.hidden = false;
      this.placeholder.hidden = true;
      this.img.src = staticImageUrl(sectionId);
      this.updateLinks(sectionId);
    }

    updateLinks(sectionId) {
      this.btnSite.href = publicPageUrl(sectionId);
      this.btnPreview.href = previewPageUrl(sectionId);
    }

    async fill(sectionId) {
      const meta = SECTION_PREVIEW_MAP[sectionId] || {};
      this.titleEl.textContent = titleFor(sectionId);
      this.descEl.textContent = meta.description || 'ส่วนเนื้อหาบนหน้าแรก';
      this.updateLinks(sectionId);

      if (await this.hasStaticImage(sectionId)) {
        this.showStatic(sectionId);
      } else {
        this.showLive(sectionId);
      }
    }

    placeCard(anchor) {
      const rect = anchor.getBoundingClientRect();
      const w = cardWidth();
      const h = CARD_EST_H;
      const gap = 24;
      const margin = 20;
      const minLeft = getSidebarRight() + margin;
      const maxLeft = window.innerWidth - w - margin;
      const maxTop = window.innerHeight - h - margin;

      const contentRect =
        anchor.closest('.content')?.getBoundingClientRect() ||
        anchor.closest('.home-editor')?.getBoundingClientRect();
      const rowRect =
        anchor.closest('.home-acc__summary, summary, .home-acc')?.getBoundingClientRect() || rect;

      let left;
      if (contentRect) {
        // ชิดขวาของพื้นที่แก้ไข — ไม่ทับรายการ section
        left = contentRect.right - w - margin;
      } else {
        left = rowRect.right + gap;
      }

      // อย่างน้อยให้อยู่ขวากว่าแถวที่ hover (ไม่พลิกไปทับซ้าย)
      left = Math.max(left, rowRect.right + gap, minLeft);
      left = Math.min(maxLeft, left);

      let top = rowRect.top + rowRect.height / 2 - h / 2;
      top = Math.min(maxTop, Math.max(margin, top));

      this.el.style.setProperty('--sp-width', `${w}px`);
      this.el.style.left = `${Math.round(left)}px`;
      this.el.style.top = `${Math.round(top)}px`;
      this.el.dataset.placement = 'right';
    }

    position(anchor) {
      this._anchorEl = anchor;
      this.el.hidden = false;
      this.el.classList.remove('is-visible');
      this.placeCard(anchor);
      requestAnimationFrame(() => {
        this.fitIframe();
        requestAnimationFrame(() => this.el.classList.add('is-visible'));
      });
    }

    show(anchor, sectionId) {
      clearTimeout(this.hideTimer);
      const changed = this.currentId !== sectionId;
      this.currentId = sectionId;
      if (changed) {
        this.fill(sectionId).then(() => this.position(anchor));
      } else {
        this.position(anchor);
      }
    }

    hide(delay = 120) {
      clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => {
        this.el.classList.remove('is-visible');
        setTimeout(() => {
          if (!this.el.classList.contains('is-visible')) {
            this.el.hidden = true;
            this.currentId = null;
            this._anchorEl = null;
          }
        }, 200);
      }, delay);
    }

    cancelHide() {
      clearTimeout(this.hideTimer);
    }

    warm() {
      if (this._warming || this._iframeReady) return;
      this._warming = true;
      this.iframe.src = `${SITE_BASE}/index.html?cms_preview=1`;
    }
  }

  const singleton = new SectionPreviewCard();

  function attach(root, options = {}) {
    const scope = root || document;
    const delay = options.showDelay ?? 120;

    if (options.warm !== false) singleton.warm();

    scope.querySelectorAll('[data-section-preview]').forEach((anchor) => {
      if (anchor.dataset.previewBound) return;
      anchor.dataset.previewBound = '1';
      const sectionId = anchor.dataset.sectionPreview;
      let showTimer = null;

      const onEnter = () => {
        clearTimeout(showTimer);
        showTimer = setTimeout(() => singleton.show(anchor, sectionId), delay);
      };

      const onLeave = () => {
        clearTimeout(showTimer);
        singleton.hide();
      };

      anchor.addEventListener('click', (e) => e.stopPropagation());
      anchor.addEventListener('mousedown', (e) => e.stopPropagation());
      anchor.addEventListener('mouseenter', onEnter);
      anchor.addEventListener('mouseleave', onLeave);
      anchor.addEventListener('focus', onEnter);
      anchor.addEventListener('blur', onLeave);
    });
  }

  global.SectionPreview = {
    attach,
    warm: () => singleton.warm(),
    map: SECTION_PREVIEW_MAP,
    titleFor,
    anchorId,
    homePageUrl: HOME_BASE,
  };
})(window);
