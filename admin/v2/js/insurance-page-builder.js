/**
 * Insurance Page Builder — ลากวิดเจ็ต 3 คอลัมน์ (ตามตัวอย่าง Page Builder)
 */
(function (global) {
  'use strict';

  /** แสดงเนื้อหา rich text ใน canvas preview (HTML จาก Quill หรือข้อความธรรมดา) */
  function renderRichHtml(text, opts = {}) {
    const s = String(text || '').trim();
    if (!s) return '';
    const editAttr = opts.edit ? ` data-edit="${opts.edit}"` : '';
    if (/<[a-z][\s\S]*>/i.test(s)) {
      return `<div class="ipb__rich-content"${editAttr}>${s}</div>`;
    }
    return `<p${editAttr}>${esc(s)}</p>`;
  }

  const IPF = () => global.InsurancePageForms;

  const SITE_BASE = (() => {
    const path = window.location.pathname.replace(/\/admin\/v2\/?.*$/, '');
    return `${path}/`.replace(/\/+/g, '/').replace(/\/$/, '') || '';
  })();

  const STYLES_URL = `${window.location.origin}${SITE_BASE}/styles.css`.replace(/([^:]\/)\/+/g, '$1');

  /** แปลง path คลังสื่อหรือ URL ภายนอกให้แสดงใน canvas iframe ได้ */
  function mediaUrl(path) {
    const p = String(path || '').trim();
    if (!p) return '';
    if (/^https?:\/\//i.test(p) || p.startsWith('//')) return p;
    const base = SITE_BASE ? `${SITE_BASE}/` : '/';
    return `${window.location.origin}${base}${p.replace(/^\//, '')}`;
  }

  const BASIC_WIDGETS = [
    { type: 'heading', label: 'ข้อความ', icon: 'text' },
    { type: 'image', label: 'รูปภาพ', icon: 'image' },
    { type: 'button', label: 'ปุ่ม', icon: 'button' },
    { type: 'video', label: 'วิดีโอ', icon: 'video' },
    { type: 'divider', label: 'เส้นคั่น', icon: 'divider' },
    { type: 'textbox', label: 'กล่องข้อความ', icon: 'textbox' },
    { type: 'gallery', label: 'แกลเลอรี่', icon: 'gallery' },
    { type: 'slider', label: 'สไลด์โชว์', icon: 'slider' },
    { type: 'tabs', label: 'แท็บ', icon: 'tabs' },
    { type: 'accordion', label: 'แอคคอร์เดียน', icon: 'accordion' },
    { type: 'map', label: 'แผนที่', icon: 'map' },
    { type: 'spacer', label: 'ตัวคั่น', icon: 'spacer' },
  ];

  const SPECIAL_WIDGETS = [
    { type: 'planCard', label: 'การ์ดแผน', icon: 'planCard' },
    { type: 'banner', label: 'Banner', icon: 'banner' },
    { type: 'bullets', label: 'Bullet', icon: 'bullets' },
  ];

  const WIDGETS = [...BASIC_WIDGETS, ...SPECIAL_WIDGETS];

  const WIDGET_TYPES = new Set(WIDGETS.map((w) => w.type));

  const WIDGET_LUCIDE = {
    text: 'type',
    image: 'image',
    button: 'square',
    video: 'video',
    icon: 'star',
    divider: 'minus',
    textbox: 'align-left',
    column: 'columns-2',
    gallery: 'images',
    slider: 'presentation',
    tabs: 'layout-list',
    accordion: 'list',
    map: 'map-pin',
    spacer: 'move-vertical',
    planCard: 'id-card',
    banner: 'image',
    bullets: 'list',
  };

  function widgetIcon(name) {
    const iconName = WIDGET_LUCIDE[name] || 'box';
    return global.LucideIcons?.svg(iconName, { size: 18 }) || '';
  }

  function deviceIcon(name) {
    return global.LucideIcons?.svg(name, { size: 18 }) || '';
  }

  function renderWidgetGrid(items) {
    return items
      .map(
        (w) =>
          `<div class="ipb__widget" draggable="true" data-widget="${w.type}" title="${esc(w.label)}">
            <span class="ipb__widget-icon">${widgetIcon(w.icon || w.type)}</span>
            <span class="ipb__widget-label">${esc(w.label)}</span>
          </div>`
      )
      .join('');
  }

  const SECTION_LABELS = {
    hero: 'Section — หัวหน้า',
    whoFor: 'Section — เหมาะกับใคร',
    planCards: 'Section — รายละเอียดแผน',
    recommendation: 'Section — ข้อความแนะนำ',
    cta: 'Section — Call to Action',
    bottomBanners: 'Section — Banner ล่าง',
  };

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function uid() {
    return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function defaultSettings(key) {
    const map = {
      hero: { cssId: 'section-hero', paddingTop: 80, paddingBottom: 80 },
      whoFor: { cssId: 'section-who-for', paddingTop: 0, paddingBottom: 0 },
      planCards: { cssId: 'section-plans', paddingTop: 0, paddingBottom: 0 },
      recommendation: { cssId: 'section-recommendation', paddingTop: 0, paddingBottom: 0 },
      cta: { cssId: 'section-cta', paddingTop: 64, paddingBottom: 64 },
      bottomBanners: { cssId: 'section-banners', paddingTop: 0, paddingBottom: 0 },
    };
    return {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      bgColor: '',
      bgImage: '',
      bgVideo: '',
      cssId: map[key]?.cssId || '',
      animation: 'fadeIn',
      visible: { desktop: true, tablet: true, mobile: true },
      ...(map[key] || {}),
    };
  }

  function parseFromSections(pageKey, byKey) {
    const forms = IPF();
    const keys = forms?.sectionKeys || [];
    return keys.map((key) => {
      const row = byKey[key] || {};
      const config = forms?.merge(pageKey, key, row.config || {}) || {};
      const active = row.is_active !== 0 && row.is_active !== false;
      const settings = { ...defaultSettings(key), ...(config.settings || {}) };
      const data = { ...config };
      delete data.settings;
      return { id: key, key, type: key, active, settings, data };
    });
  }

  function serializeToSections(state) {
    const out = {};
    state.sections.forEach((sec) => {
      const data = { ...sec.data };
      if (sec.key === 'planCards' && Array.isArray(data.cards)) {
        data.cards = data.cards.filter((c) => c.type !== 'dropZone');
      }
      out[sec.key] = {
        config: { ...data, settings: sec.settings },
        is_active: sec.active,
      };
    });
    return out;
  }

  function styleAttr(sec) {
    const s = sec.settings || {};
    const parts = [];
    if (s.paddingTop) parts.push(`padding-top:${s.paddingTop}px`);
    if (s.paddingBottom) parts.push(`padding-bottom:${s.paddingBottom}px`);
    if (s.paddingLeft) parts.push(`padding-left:${s.paddingLeft}px`);
    if (s.paddingRight) parts.push(`padding-right:${s.paddingRight}px`);
    if (s.bgColor) parts.push(`background-color:${s.bgColor}`);
    if (s.bgImage) {
      parts.push(`background-image:url(${s.bgImage})`);
      parts.push('background-size:cover');
      parts.push('background-position:center');
    }
    return parts.length ? ` style="${esc(parts.join(';'))}"` : '';
  }

  function heroStyle(sec) {
    const d = sec.data || {};
    const s = sec.settings || {};
    const parts = [];
    if (d.bgType === 'image' && d.bgImage) {
      parts.push(`background-image:url(${d.bgImage})`);
      parts.push('background-size:cover');
      parts.push('background-position:center');
    } else if (d.bgColor || s.bgColor) {
      parts.push(`background-color:${d.bgColor || s.bgColor}`);
    }
    if (s.paddingTop) parts.push(`padding-top:${s.paddingTop}px`);
    if (s.paddingBottom) parts.push(`padding-bottom:${s.paddingBottom}px`);
    return parts.length ? ` style="${esc(parts.join(';'))}"` : '';
  }

  function renderHero(sec) {
    const d = sec.data;
    const id = sec.settings.cssId ? ` id="${esc(sec.settings.cssId)}"` : '';
    return `<section class="page-hero section-reveal is-visible"${id}${heroStyle(sec)}>
      <p class="eyebrow" data-edit="categoryLabel">${esc(d.categoryLabel)}</p>
      <h1 data-edit="h1">${esc(d.h1)}</h1>
      <div class="article-hero-lead" data-edit="copy">${renderRichHtml(d.copy)}</div>
    </section>`;
  }

  function renderWhoFor(sec, state) {
    const d = sec.data;
    const boxStyle = d.boxBgColor ? ` style="background-color:${esc(d.boxBgColor)}"` : '';
    const sel = state?.selected?.sectionKey === 'whoFor' && !state.selected.cardId ? ' is-selected' : '';
    return `<aside class="detail-summary section-reveal is-visible ipb__card-block${sel}" data-section-pick="whoFor"${boxStyle} role="button" tabindex="0" aria-label="ส่วนเหมาะกับใคร — คลิกเพื่อแก้ไข">
      <h2 data-edit="h2">${esc(d.h2)}</h2>
      ${renderRichHtml(d.text, { edit: 'text' })}
    </aside>`;
  }

  function renderInsertSlot(kind, index) {
    return `<div class="ipb__insert" data-insert="${esc(kind)}" data-index="${index}">
      <span class="ipb__insert-line" aria-hidden="true"></span>
      <span class="ipb__insert-drop-hint">วางที่นี่</span>
      <button type="button" class="ipb__insert-btn" title="เพิ่มเนื้อหา" aria-label="เพิ่มเนื้อหา"><span aria-hidden="true">+</span></button>
    </div>`;
  }

  function widgetTypeOf(card) {
    if (!card) return 'planCard';
    if (card.type === 'dropZone') return 'dropZone';
    if (card.widgetType) return card.widgetType;
    if (card.type === 'widget') return card.widgetType || 'divider';
    if (card.type === 'paragraph') return card.title ? 'heading' : 'text';
    if (card.type === 'checklist') return 'planCard';
    return 'planCard';
  }

  function createWidgetCard(widgetType) {
    const id = uid();
    const base = {
      id,
      anchorId: id,
      icon: '',
      image: '',
      videoUrl: '',
      buttonText: '',
      buttonHref: '',
    };
    switch (widgetType) {
      case 'heading':
        return { ...base, widgetType: 'heading', type: 'block', title: 'หัวข้อ', body: '' };
      case 'textbox':
        return { ...base, widgetType: 'text', type: 'block', body: 'ข้อความ' };
      case 'image':
        return { ...base, widgetType: 'image', type: 'block', title: '', image: '' };
      case 'video':
        return { ...base, widgetType: 'video', type: 'block', videoUrl: '' };
      case 'button':
        return { ...base, widgetType: 'button', type: 'block', buttonText: 'คลิกที่นี่', buttonHref: 'contact.html' };
      case 'icon':
        return { ...base, widgetType: 'icon', type: 'block', icon: '' };
      case 'divider':
        return { ...base, widgetType: 'divider', type: 'widget' };
      case 'spacer':
        return { ...base, widgetType: 'spacer', type: 'widget' };
      case 'column':
        return { ...base, widgetType: 'columns', type: 'block', columns: ['คอลัมน์ซ้าย', 'คอลัมน์ขวา'] };
      case 'gallery':
        return { ...base, widgetType: 'gallery', type: 'block', title: '', images: [''] };
      case 'slider':
        return { ...base, widgetType: 'slider', type: 'block', title: '', images: [], slidesPerView: 1 };
      case 'tabs':
        return { ...base, widgetType: 'tabs', type: 'block', tabs: [{ label: 'แท็บ 1', body: 'เนื้อหา' }] };
      case 'accordion':
        return { ...base, widgetType: 'accordion', type: 'block', items: [{ title: 'หัวข้อ', body: 'รายละเอียด' }] };
      case 'map':
        return { ...base, widgetType: 'map', type: 'block', mapEmbed: '' };
      case 'planCard':
        return { ...base, widgetType: 'planCard', type: 'checklist', title: 'แผนใหม่', bullets: ['รายละเอียดแผน'] };
      case 'bullets':
        return { ...base, widgetType: 'bullets', type: 'checklist', title: 'หัวข้อ', bullets: ['รายการ'] };
      default:
        return {
          ...base,
          widgetType: widgetType,
          type: 'checklist',
          title: WIDGETS.find((w) => w.type === widgetType)?.label || 'เนื้อหา',
          bullets: ['รายละเอียด'],
        };
    }
  }

  function renderSliderHtml(c) {
    const images = (c.images || []).filter(Boolean);
    const perView = Math.min(3, Math.max(1, Number(c.slidesPerView) || 1));
    if (!images.length) {
      return `<p class="ipb__media-placeholder">เพิ่มรูปจากแผงขวา หรือกด «เลือกหลายรูปจากคลัง»</p>`;
    }
    const slides = images
      .map(
        (img) =>
          `<figure class="detail-slider__slide detail-block__media"><img src="${esc(mediaUrl(img))}" alt="" loading="lazy"></figure>`
      )
      .join('');
    return `<div class="detail-slider" data-plan-slider data-per-view="${perView}" style="--slides-per-view:${perView}">
      <button type="button" class="detail-slider__nav detail-slider__prev" aria-label="ก่อนหน้า">‹</button>
      <div class="detail-slider__viewport">
        <div class="detail-slider__track">${slides}</div>
      </div>
      <button type="button" class="detail-slider__nav detail-slider__next" aria-label="ถัดไป">›</button>
    </div>`;
  }

  function initPlanSliders(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-plan-slider]').forEach((slider) => {
      if (slider.dataset.planSliderInit === '1') return;
      slider.dataset.planSliderInit = '1';
      const perView = Math.min(3, Math.max(1, Number(slider.dataset.perView) || 1));
      const track = slider.querySelector('.detail-slider__track');
      const slides = track ? [...track.querySelectorAll('.detail-slider__slide')] : [];
      if (!track || slides.length <= perView) {
        slider.querySelectorAll('.detail-slider__nav').forEach((btn) => {
          btn.disabled = true;
          btn.setAttribute('aria-disabled', 'true');
        });
        return;
      }
      let index = 0;
      const maxIndex = slides.length - perView;
      const update = () => {
        const offset = (index * 100) / perView;
        track.style.transform = `translateX(-${offset}%)`;
        const prev = slider.querySelector('.detail-slider__prev');
        const next = slider.querySelector('.detail-slider__next');
        if (prev) {
          prev.disabled = index <= 0;
          prev.setAttribute('aria-disabled', String(index <= 0));
        }
        if (next) {
          next.disabled = index >= maxIndex;
          next.setAttribute('aria-disabled', String(index >= maxIndex));
        }
      };
      slider.querySelector('.detail-slider__prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        index = Math.max(0, index - 1);
        update();
      });
      slider.querySelector('.detail-slider__next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        index = Math.min(maxIndex, index + 1);
        update();
      });
      update();
    });
  }

  function renderDropZone(item, state) {
    const selected = state.selected?.dropZoneId === item.id ? ' is-selected' : '';
    return `<div class="ipb__drop-zone${selected}" data-drop-zone="${esc(item.id)}" data-item-id="${esc(item.id)}">
      <p class="ipb__drop-zone-hint">ลากองค์ประกอบจากแผงซ้ายมาวางที่นี่</p>
    </div>`;
  }

  function renderContentBlock(card) {
    const c = card || {};
    const wt = widgetTypeOf(c);
    const id = esc(c.id || uid());
    const anchor = c.anchorId ? ` id="${esc(c.anchorId)}"` : '';

    if (wt === 'divider') {
      return `<div class="detail-block ipb__divider-block section-reveal is-visible ipb__card-block" data-card-id="${id}"${anchor} role="button" tabindex="0" aria-label="เส้นคั่น — คลิกเพื่อแก้ไข">
        <hr class="ipb__widget-divider" aria-hidden="true">
      </div>`;
    }
    if (wt === 'spacer') {
      return `<div class="detail-block ipb__widget-spacer section-reveal is-visible ipb__card-block" data-card-id="${id}"${anchor} aria-hidden="true"></div>`;
    }

    let inner = '';
    switch (wt) {
      case 'heading':
        inner = `<h2 data-edit="title">${esc(c.title)}</h2>`;
        if (c.body) inner += renderRichHtml(c.body, { edit: 'body' });
        break;
      case 'text':
        inner = renderRichHtml(c.body || '', { edit: 'body' });
        break;
      case 'image':
        if (c.title) inner += `<h2 data-edit="title">${esc(c.title)}</h2>`;
        if (c.image) {
          inner += `<figure class="detail-block__media"><img src="${esc(mediaUrl(c.image))}" alt="" loading="lazy"></figure>`;
        } else {
          inner += `<p class="ipb__media-placeholder">วาง URL รูป หรือกด «คลัง» ที่แผงขวา</p>`;
        }
        break;
      case 'button':
        inner = `<p><a class="button secondary" href="${esc(c.buttonHref || '#')}">${esc(c.buttonText || 'ปุ่ม')}</a></p>`;
        break;
      case 'video':
        inner = c.videoUrl
          ? `<div class="detail-block__video"><iframe src="${esc(c.videoUrl)}" title="วิดีโอ" loading="lazy" allowfullscreen></iframe></div>`
          : `<p class="muted">ใส่ลิงก์วิดีโอจากแผงขวา</p>`;
        break;
      case 'icon':
        inner = c.icon
          ? `<img class="detail-block__icon" src="${esc(mediaUrl(c.icon))}" alt="" loading="lazy">`
          : `<p class="ipb__media-placeholder">เลือกไอคอนจากแผงขวา</p>`;
        break;
      case 'columns':
        inner = `<div class="detail-columns" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem">${(c.columns || ['', ''])
          .map((col) => `<div>${renderRichHtml(col)}</div>`)
          .join('')}</div>`;
        break;
      case 'gallery':
        if (c.title) inner += `<h2 data-edit="title">${esc(c.title)}</h2>`;
        inner += `<div class="detail-block__gallery">${(c.images || [])
          .filter(Boolean)
          .map((img) => `<figure class="detail-block__media"><img src="${esc(mediaUrl(img))}" alt="" loading="lazy"></figure>`)
          .join('')}</div>`;
        if (!(c.images || []).filter(Boolean).length) inner += `<p class="ipb__media-placeholder">เพิ่มรูปจากแผงขวา หรือเลือกหลายรูปจากคลัง</p>`;
        break;
      case 'slider':
        if (c.title) inner += `<h2 data-edit="title">${esc(c.title)}</h2>`;
        inner += renderSliderHtml(c);
        break;
      case 'tabs':
        inner = (c.tabs || [])
          .map((tab) => `<details class="detail-tab" open><summary>${esc(tab.label)}</summary>${renderRichHtml(tab.body)}</details>`)
          .join('');
        break;
      case 'accordion':
        inner = (c.items || [])
          .map((item) => `<details class="detail-accordion"><summary>${esc(item.title)}</summary>${renderRichHtml(item.body)}</details>`)
          .join('');
        break;
      case 'map':
        inner = c.mapEmbed
          ? `<div class="detail-block__map"><iframe src="${esc(c.mapEmbed)}" loading="lazy" allowfullscreen></iframe></div>`
          : `<p class="muted">ใส่ลิงก์แผนที่จากแผงขวา</p>`;
        break;
      case 'bullets':
      case 'planCard':
      default:
        if (c.title) inner += `<h2 data-edit="title">${esc(c.title)}</h2>`;
        if (c.icon) inner += `<img class="detail-block__icon" src="${esc(mediaUrl(c.icon))}" alt="" loading="lazy">`;
        if (c.image) inner += `<figure class="detail-block__media"><img src="${esc(mediaUrl(c.image))}" alt="" loading="lazy"></figure>`;
        if (c.videoUrl) inner += `<div class="detail-block__video"><iframe src="${esc(c.videoUrl)}" title="วิดีโอ" loading="lazy" allowfullscreen></iframe></div>`;
        if (c.type === 'paragraph') {
          inner += renderRichHtml(c.body || '', { edit: 'body' });
        } else {
          const bullets = Array.isArray(c.bullets) ? c.bullets : [];
          inner += `<ul class="check-list">${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;
        }
        if (c.buttonText && c.buttonHref) {
          inner += `<p><a class="button secondary" href="${esc(c.buttonHref)}">${esc(c.buttonText)}</a></p>`;
        }
        break;
    }

    const mediaBlock = wt === 'image' || wt === 'gallery' || wt === 'slider';
    const blockClass = mediaBlock ? ' detail-block--media' : '';

    return `<article class="detail-block section-reveal is-visible ipb__card-block${blockClass}" data-card-id="${id}"${anchor}>${inner}</article>`;
  }

  function renderPlanCards(sec, state) {
    const cards = sec.data.cards || [];
    if (!cards.length) {
      return renderInsertSlot('plan-card', 0);
    }
    let html = '';
    cards.forEach((c, i) => {
      html += `<div class="ipb__content-slot" data-content-slot="${esc(c.id)}">`;
      html += renderInsertSlot('plan-card', i);
      if (c.type === 'dropZone') {
        html += renderDropZone(c, state);
      } else {
        html += renderContentBlock(c);
      }
      html += '</div>';
    });
    html += renderInsertSlot('plan-card', cards.length);
    return html;
  }

  function renderRecommendation(sec, state) {
    const d = sec.data;
    const sel = state?.selected?.sectionKey === 'recommendation' ? ' is-selected' : '';
    return `<article class="detail-block section-reveal is-visible ipb__card-block ipb__rec-block${sel}" data-section-pick="recommendation" role="button" tabindex="0" aria-label="ส่วนข้อความแนะนำ — คลิกเพื่อแก้ไข">
      <h2 data-edit="h2">${esc(d.h2)}</h2>
      ${renderRichHtml(d.body, { edit: 'body' })}
    </article>`;
  }

  function renderDetailLayout(state) {
    const who = state.sections.find((s) => s.key === 'whoFor');
    const plans = state.sections.find((s) => s.key === 'planCards');
    const rec = state.sections.find((s) => s.key === 'recommendation');
    if (!who?.active && !plans?.active && !rec?.active) return '';
    let html = '<section class="detail-layout">';
    if (who?.active) html += renderWhoFor(who, state);
    if (plans?.active || rec?.active) {
      html += '<div class="detail-content" data-plan-list>';
      if (plans?.active) html += renderPlanCards(plans, state);
      else if (rec?.active) html += renderInsertSlot('plan-card', 0);
      if (rec?.active) html += renderRecommendation(rec, state);
      html += '</div>';
    }
    html += '</section>';
    return html;
  }

  function renderCta(sec) {
    const d = sec.data;
    const s = sec.settings || {};
    const parts = [];
    if (d.bgColor || s.bgColor) parts.push(`background-color:${d.bgColor || s.bgColor}`);
    if (d.bgImage || s.bgImage) {
      parts.push(`background-image:url(${d.bgImage || s.bgImage})`);
      parts.push('background-size:cover');
    }
    if (s.paddingTop) parts.push(`padding-top:${s.paddingTop}px`);
    if (s.paddingBottom) parts.push(`padding-bottom:${s.paddingBottom}px`);
    const st = parts.length ? ` style="${esc(parts.join(';'))}"` : '';
    const id = s.cssId ? ` id="${esc(s.cssId)}"` : '';
    let media = '';
    if (d.videoUrl) {
      media = `<div class="cta-band-media"><iframe src="${esc(d.videoUrl)}" title="วิดีโอ" loading="lazy" allowfullscreen></iframe></div>`;
    }
    return `<section class="cta-band section-reveal is-visible"${id}${st}>
      <div class="cta-band-inner">
        <div class="cta-band-copy">
          <p class="eyebrow" data-edit="eyebrow">${esc(d.eyebrow)}</p>
          <div class="cta-band-title-wrap"><h2 data-edit="h2">${esc(d.h2)}</h2></div>
          ${renderRichHtml(d.copy, { edit: 'copy' })}
          ${d.buttonText ? `<a class="button primary" href="${esc(d.buttonHref || 'contact.html')}">${esc(d.buttonText)}</a>` : ''}
        </div>
        ${media}
      </div>
    </section>`;
  }

  function renderBanners(sec) {
    const banners = sec.data.banners || [];
    if (!banners.length) return '';
    return `<section class="promo-duo section-reveal is-visible" aria-label="ลิงก์ด่วน">
      <div class="promo-duo-inner sortable-list" data-banner-list>
        ${banners
          .map(
            (b) => `<a class="promo-duo-card ipb__card-block" data-banner-id="${esc(b.id || uid())}" href="#" data-ipb-href="${esc(b.href || '')}">
          <img src="${esc(mediaUrl(b.image))}" width="1200" height="630" loading="lazy" alt="${esc(b.alt || '')}">
        </a>`
          )
          .join('')}
      </div>
    </section>`;
  }

  function renderBlockContent(sec, state) {
    if (sec.key === 'hero') return renderHero(sec);
    if (sec.key === 'whoFor' || sec.key === 'planCards' || sec.key === 'recommendation') {
      if (sec.key === 'whoFor') return renderDetailLayout(state);
      return '';
    }
    if (sec.key === 'cta') return renderCta(sec);
    if (sec.key === 'bottomBanners') return renderBanners(sec);
    return '';
  }

  function renderCanvasBody(state) {
    const rendered = new Set();
    let html = '<div class="ipb-canvas-inner">';
    state.sections.forEach((sec) => {
      if (!sec.active && !['whoFor', 'planCards', 'recommendation'].includes(sec.key)) return;
      if (sec.key === 'whoFor' || sec.key === 'planCards' || sec.key === 'recommendation') {
        if (rendered.has('detailLayout')) return;
        const hasDetail = state.sections.some(
          (s) => ['whoFor', 'planCards', 'recommendation'].includes(s.key) && s.active
        );
        if (!hasDetail) return;
        rendered.add('detailLayout');
        const blockKey =
          ['whoFor', 'planCards', 'recommendation'].find((k) => state.sections.find((s) => s.key === k)?.active) ||
          'planCards';
        const blockSec = state.sections.find((s) => s.key === blockKey) || sec;
        html += wrapBlock(blockSec, renderDetailLayout(state), state);
        return;
      }
      const inner = renderBlockContent(sec, state);
      if (!inner) return;
      html += wrapBlock(sec, inner, state);
    });
    html += '</div>';
    return html;
  }

  function renderCanvas(state) {
    return renderCanvasBody(state);
  }

  function wrapBlock(sec, inner, state) {
    const detailKeys = ['whoFor', 'planCards', 'recommendation'];
    const selKey = state.selected?.sectionKey;
    const nestedSelected =
      detailKeys.includes(sec.key) &&
      detailKeys.includes(selKey) &&
      !state.selected?.cardId &&
      !state.selected?.dropZoneId;
    const sel = state.selected?.sectionKey === sec.key || nestedSelected ? ' is-selected' : '';
    const hidden =
      !sec.settings.visible?.[state.device] && state.device !== 'desktop' ? ' is-hidden-preview' : '';
    return `<div class="ipb__block${sel}${hidden}" data-section-key="${esc(sec.key)}" data-block-id="${esc(sec.id)}">
      <span class="ipb__block-label">${esc(SECTION_LABELS[sec.key] || sec.key)}</span>
      <div class="ipb__block-toolbar">
        <button type="button" class="ipb__block-btn ipb__block-handle drag-handle" title="ลากเรียง">⋮⋮</button>
        <button type="button" class="ipb__block-btn" data-act="dup" title="คัดลอก">⧉</button>
        <button type="button" class="ipb__block-btn ipb__block-btn--danger" data-act="del" title="ซ่อนส่วน">✕</button>
      </div>
      ${inner}
    </div>`;
  }

  function breadcrumb(state) {
    if (!state.selected) return 'เลือก Section บน Canvas เพื่อแก้ไข';
    const sec = state.sections.find((s) => s.key === state.selected.sectionKey);
    const label = SECTION_LABELS[state.selected.sectionKey] || state.selected.sectionKey;
    if (state.selected.cardId) return `Section &gt; การ์ดแผน &gt; <strong>${esc(state.selected.cardId)}</strong>`;
    if (state.selected.dropZoneId) return `Section &gt; <strong>ช่องว่าง</strong> — ลากองค์ประกอบมาวาง`;
    if (state.selected.bannerId) return `Section &gt; Banner &gt; <strong>รูป</strong>`;
    return `Section &gt; <strong>${esc(label)}</strong>`;
  }

  class InsurancePageBuilder {
    constructor(options) {
      this.root = options.root;
      this.api = options.api;
      this.toast = options.toast;
      this.toastEl = options.toastEl;
      this.openMediaPicker = options.openMediaPicker;
      this.onPublish = options.onPublish;
      this.pageKey = options.pageKey;
      this.defaultsPageKey = options.defaultsPageKey || options.pageKey;
      this.singlePlanMode = !!options.singlePlanMode;
      this.planLabel = options.planLabel || '';
      this.planSlug = options.planSlug || '';
      this.onSyncFromCategory = options.onSyncFromCategory || null;
      this.onBack = typeof options.onBack === 'function' ? options.onBack : null;
      this.state = {
        sections: [],
        selected: null,
        device: 'desktop',
        history: [],
        historyIdx: -1,
      };
      this.sortables = [];
      this.saving = false;
      this.canvasIframe = null;
      this._widgetDragging = false;
      this._dragWidgetType = '';
    }

    getCanvasDoc() {
      return this.canvasIframe?.contentDocument || null;
    }

    readDragWidgetType(e) {
      const dt = e?.dataTransfer;
      if (!dt) return '';
      const custom = dt.getData('application/x-ipb-widget');
      if (custom && WIDGET_TYPES.has(custom)) return custom;
      const plain = dt.getData('text/plain');
      if (plain && WIDGET_TYPES.has(plain)) return plain;
      return this._dragWidgetType || '';
    }

    setCanvasDragState(active) {
      const doc = this.getCanvasDoc();
      doc?.body?.classList.toggle('is-widget-drag', !!active);
      this.root?.classList.toggle('is-dragging-widget', !!active);
    }

    clearCanvasDragMarks() {
      const doc = this.getCanvasDoc();
      if (!doc) return;
      doc.querySelectorAll('.is-drag-over').forEach((el) => el.classList.remove('is-drag-over'));
    }

    beginWidgetDrag(type) {
      this._widgetDragging = true;
      this._dragWidgetType = type || '';
      this.setCanvasDragState(true);
    }

    endWidgetDrag() {
      this._widgetDragging = false;
      this._dragWidgetType = '';
      this.setCanvasDragState(false);
      this.clearCanvasDragMarks();
    }

    insertWidgetAt(widgetType, atIndex) {
      if (!widgetType || !WIDGET_TYPES.has(widgetType)) return;
      if (widgetType === 'banner') {
        this.addBanner();
        return;
      }
      const sec = this.getSection('planCards');
      if (!sec) return;
      sec.active = true;
      if (!Array.isArray(sec.data.cards)) sec.data.cards = [];
      const card = createWidgetCard(widgetType);
      const index = Number.isFinite(atIndex) ? Math.max(0, Math.min(atIndex, sec.data.cards.length)) : sec.data.cards.length;
      sec.data.cards.splice(index, 0, card);
      this.pushHistory();
      this.select('planCards', { cardId: card.id });
      const label = WIDGETS.find((w) => w.type === widgetType)?.label || 'องค์ประกอบ';
      this.toast(this.toastEl, `เพิ่ม${label}แล้ว`);
      this.render();
    }

    async load(pageKey) {
      this.pageKey = pageKey;
      const data = await this.api(`/sections?page_key=${encodeURIComponent(pageKey)}`);
      const byKey = {};
      (data.sections || []).forEach((s) => {
        byKey[s.section_key] = s;
      });
      this.state.sections = parseFromSections(this.defaultsPageKey || pageKey, byKey);
      this.state.selected = null;
      this.pushHistory(true);
      this.render();
    }

    pushHistory(reset) {
      const snap = clone({ sections: this.state.sections });
      if (!reset && this.state.historyIdx >= 0) {
        this.state.history = this.state.history.slice(0, this.state.historyIdx + 1);
      }
      this.state.history.push(snap);
      if (this.state.history.length > 40) this.state.history.shift();
      this.state.historyIdx = this.state.history.length - 1;
    }

    undo() {
      if (this.state.historyIdx <= 0) return;
      this.state.historyIdx--;
      this.state.sections = clone(this.state.history[this.state.historyIdx].sections);
      this.renderCanvas();
      this.renderProps();
    }

    redo() {
      if (this.state.historyIdx >= this.state.history.length - 1) return;
      this.state.historyIdx++;
      this.state.sections = clone(this.state.history[this.state.historyIdx].sections);
      this.renderCanvas();
      this.renderProps();
    }

    getSection(key) {
      return this.state.sections.find((s) => s.key === key);
    }

    select(sectionKey, extra = {}) {
      this.state.selected = { sectionKey, ...extra };
      this.renderCanvas();
      this.renderProps();
      this.syncSectionNav();
      const bc = this.root.querySelector('[data-ipb-breadcrumb]');
      if (bc) bc.innerHTML = breadcrumb(this.state);
    }

    syncSectionNav() {
      const sel = this.state.selected;
      this.root.querySelectorAll('[data-select-section]').forEach((btn) => {
        const on = !!sel && btn.dataset.selectSection === sel.sectionKey && !sel.cardId && !sel.dropZoneId && !sel.bannerId;
        btn.classList.toggle('is-active', on);
      });
    }

    mount(pageKeys) {
      const showPageTabs = !this.singlePlanMode && pageKeys.length > 1;
      const backBtn = this.onBack
        ? '<button type="button" class="btn btn--ghost btn--sm ipb__back" data-ipb-back>← กลับรายการแผน</button>'
        : '';
      const planTitle = this.singlePlanMode && this.planLabel
        ? `<span class="ipb__plan-title">${esc(this.planLabel)}</span>`
        : '';
      this.root.innerHTML = `
        <div class="ipb">
          <div class="ipb__top">
            ${backBtn}
            <span class="ipb__top-brand">${this.singlePlanMode ? 'บิวเดอร์แผน' : 'Page Builder'}</span>
            ${planTitle}
            ${showPageTabs ? `<div class="ipb__page-tabs home-editor__tabs" data-ipb-tabs>
              ${pageKeys
                .map(
                  (k) =>
                    `<button type="button" class="tab${k === this.pageKey ? ' is-active' : ''}" data-ipb-page="${k}">${esc(IPF()?.pages?.[k]?.label || k)}</button>`
                )
                .join('')}
            </div>` : ''}
            <div class="ipb__top-spacer"></div>
            <div class="ipb__devices">
              <button type="button" class="ipb__device is-active" data-device="desktop" title="Desktop" aria-label="Desktop"><span class="ipb__device-icon" aria-hidden="true">${deviceIcon('monitor')}</span></button>
              <button type="button" class="ipb__device" data-device="tablet" title="Tablet" aria-label="Tablet"><span class="ipb__device-icon" aria-hidden="true">${deviceIcon('tablet')}</span></button>
              <button type="button" class="ipb__device" data-device="mobile" title="Mobile" aria-label="Mobile"><span class="ipb__device-icon" aria-hidden="true">${deviceIcon('smartphone')}</span></button>
            </div>
            <div class="ipb__history">
              <button type="button" class="btn btn--ghost btn--sm" data-undo title="Undo">↶</button>
              <button type="button" class="btn btn--ghost btn--sm" data-redo title="Redo">↷</button>
            </div>
            <button type="button" class="btn btn--ghost btn--sm" data-preview>ดูตัวอย่าง</button>
            ${this.singlePlanMode && this.onSyncFromCategory ? '<button type="button" class="btn btn--ghost btn--sm" data-sync-category title="ดึงรูปและวิดเจ็ตจากบิวเดอร์หมวดประกัน">ดึงจากบิวเดอร์หมวด</button>' : ''}
            <button type="button" class="btn btn--ghost btn--sm" data-draft>บันทึกแบบร่าง</button>
            <button type="button" class="btn btn--primary btn--sm" data-publish title="บันทึกและสร้างหน้าเว็บใหม่ (ต้องกดปุ่มนี้เพื่อให้หน้าเว็บตรงกับบิวเดอร์)">บันทึก & เผยแพร่</button>
          </div>
          <div class="ipb__body">
            <aside class="ipb__left" data-ipb-left></aside>
            <div class="ipb__center">
              <div class="ipb__canvas-wrap">
                <div class="ipb__canvas" data-ipb-canvas></div>
              </div>
              <div class="ipb__breadcrumb" data-ipb-breadcrumb>เลือก Section บน Canvas</div>
            </div>
            <aside class="ipb__right">
              <div class="ipb__props-head">
                <h3 class="ipb__props-title" data-ipb-props-title>ตั้งค่า Section</h3>
              </div>
              <div class="ipb__props-body" data-ipb-props></div>
            </aside>
          </div>
        </div>`;
      this.renderLeft();
      this.bindShellEvents(pageKeys);
    }

    renderLeft() {
      const el = this.root.querySelector('[data-ipb-left]');
      if (!el) return;
      const sectionBtns = (IPF()?.sectionKeys || [])
        .map((key) => {
          const sec = this.getSection(key);
          const active = sec?.active !== false;
          const label = IPF()?.sectionMeta?.[key]?.title || SECTION_LABELS[key] || key;
          const isOn = this.state.selected?.sectionKey === key && !this.state.selected?.cardId;
          return `<button type="button" class="ipb__section-nav-btn${isOn ? ' is-active' : ''}${active ? '' : ' is-off'}" data-select-section="${esc(key)}" title="${esc(label)}">${esc(label.replace(/^\d+\.\s*/, ''))}</button>`;
        })
        .join('');
      el.innerHTML = `
        <h2 class="ipb__left-heading">ส่วนของหน้า</h2>
        <div class="ipb__section-nav">${sectionBtns}</div>
        <p class="ipb__left-hint">คลิกชื่อส่วนเพื่อแก้ไข — หรือคลิกบน Canvas โดยตรง</p>
        <h2 class="ipb__left-heading">เพิ่มองค์ประกอบ</h2>
        <div class="ipb__widgets">${renderWidgetGrid(WIDGETS)}</div>
        <p class="ipb__left-hint">ลากองค์ประกอบไปวางบน Canvas — ช่อง «วางที่นี่» จะปรากฏเมื่อลาก</p>`;
      el.querySelectorAll('[data-select-section]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.selectSection;
          const sec = this.getSection(key);
          if (sec && sec.active === false) {
            sec.active = true;
            this.pushHistory();
          }
          this.select(key);
        });
      });
      el.querySelectorAll('[data-widget]').forEach((node) => {
        node.addEventListener('dragstart', (e) => {
          const type = node.dataset.widget;
          e.dataTransfer.setData('application/x-ipb-widget', type);
          e.dataTransfer.setData('text/plain', type);
          e.dataTransfer.effectAllowed = 'copy';
          node.setAttribute('aria-grabbed', 'true');
          this.beginWidgetDrag(type);
        });
        node.addEventListener('dragend', () => {
          node.removeAttribute('aria-grabbed');
          this.endWidgetDrag();
        });
        node.addEventListener('click', () => this.addWidget(node.dataset.widget));
      });
    }

    addWidget(type) {
      if (!type || !WIDGET_TYPES.has(type)) return;
      const sel = this.state.selected;
      if (type === 'banner') {
        this.addBanner();
        return;
      }
      if (type === 'bullets' && sel?.sectionKey === 'planCards' && sel.cardId) {
        this.addBullet(sel.cardId);
        return;
      }
      if (sel?.dropZoneId) {
        this.fillDropZone(sel.dropZoneId, type);
        return;
      }
      if (type === 'planCard' || BASIC_WIDGETS.some((w) => w.type === type) || type === 'bullets') {
        this.addDropZone();
        const zone = this.getSection('planCards')?.data.cards?.slice(-1)[0];
        if (zone?.type === 'dropZone') this.fillDropZone(zone.id, type);
        return;
      }
      if (!sel?.sectionKey) {
        this.toast(this.toastEl, 'กด + บน Canvas เพื่อเพิ่มช่องว่าง แล้วลากองค์ประกอบมาวาง', true);
        return;
      }
    }

    addDropZone(atIndex) {
      const sec = this.getSection('planCards');
      if (!sec) return;
      sec.active = true;
      if (!Array.isArray(sec.data.cards)) sec.data.cards = [];
      const id = uid();
      const zone = { id, type: 'dropZone' };
      if (typeof atIndex === 'number' && atIndex >= 0 && atIndex <= sec.data.cards.length) {
        sec.data.cards.splice(atIndex, 0, zone);
      } else {
        sec.data.cards.push(zone);
      }
      this.pushHistory();
      this.select('planCards', { dropZoneId: id });
    }

    fillDropZone(zoneId, widgetType) {
      const sec = this.getSection('planCards');
      if (!sec) return;
      const idx = (sec.data.cards || []).findIndex((c) => c.id === zoneId);
      if (idx < 0) return;
      const content = createWidgetCard(widgetType);
      sec.data.cards.splice(idx, 1, content);
      this.pushHistory();
      this.select('planCards', { cardId: content.id });
      const label = WIDGETS.find((w) => w.type === widgetType)?.label || 'องค์ประกอบ';
      this.toast(this.toastEl, `เพิ่ม${label}แล้ว`);
    }

    removeDropZone(zoneId) {
      const sec = this.getSection('planCards');
      if (!sec) return;
      sec.data.cards = (sec.data.cards || []).filter((c) => c.id !== zoneId);
      this.pushHistory();
      this.state.selected = null;
      this.render();
    }

    addPlanCard(atIndex) {
      const sec = this.getSection('planCards');
      if (!sec) return;
      sec.active = true;
      if (!Array.isArray(sec.data.cards)) sec.data.cards = [];
      const id = uid();
      const card = {
        id,
        title: 'แผนใหม่',
        anchorId: id,
        type: 'checklist',
        bullets: ['รายละเอียดแผน'],
        icon: '',
        image: '',
        videoUrl: '',
        buttonText: '',
        buttonHref: '',
      };
      if (typeof atIndex === 'number' && atIndex >= 0 && atIndex <= sec.data.cards.length) {
        sec.data.cards.splice(atIndex, 0, card);
      } else {
        sec.data.cards.push(card);
      }
      this.pushHistory();
      this.select('planCards', { cardId: id });
      this.toast(this.toastEl, 'เพิ่มการ์ดแผนแล้ว');
    }

    addBanner() {
      const sec = this.getSection('bottomBanners');
      if (!sec) return;
      sec.active = true;
      if (!Array.isArray(sec.data.banners)) sec.data.banners = [];
      sec.data.banners.push({
        id: uid(),
        image: '',
        href: 'contact.html',
        alt: '',
      });
      this.pushHistory();
      this.select('bottomBanners');
      this.toast(this.toastEl, 'เพิ่ม Banner แล้ว');
    }

    addBullet(cardId) {
      const sec = this.getSection('planCards');
      const card = sec?.data.cards?.find((c) => c.id === cardId);
      if (!card) return;
      if (!Array.isArray(card.bullets)) card.bullets = [];
      card.bullets.push('รายการใหม่');
      this.pushHistory();
      this.renderCanvas();
      this.renderProps();
    }

    addGalleryImages(cardId, paths) {
      const sec = this.getSection('planCards');
      const card = sec?.data.cards?.find((c) => c.id === cardId);
      if (!card) return;
      const list = (Array.isArray(paths) ? paths : [paths]).map((p) => String(p || '').trim()).filter(Boolean);
      if (!list.length) return;
      if (!Array.isArray(card.images)) card.images = [];
      card.images = card.images.filter((img) => String(img || '').trim() !== '');
      card.images.push(...list);
      this.pushHistory();
      this.select('planCards', { cardId });
      this.toast(this.toastEl, `เพิ่ม ${list.length} รูปแล้ว`);
      this.render();
    }

    render() {
      this.renderCanvas();
      this.renderProps();
      this.syncSectionNav();
      const bc = this.root.querySelector('[data-ipb-breadcrumb]');
      if (bc) bc.innerHTML = breadcrumb(this.state);
    }

    renderCanvas() {
      const canvas = this.root.querySelector('[data-ipb-canvas]');
      if (!canvas) return;
      canvas.className = `ipb__canvas${this.state.device !== 'desktop' ? ` ipb__canvas--${this.state.device}` : ''}`;
      let iframe = canvas.querySelector('.ipb__canvas-frame');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.className = 'ipb__canvas-frame';
        iframe.title = 'ตัวอย่างหน้าแบบประกัน';
        canvas.appendChild(iframe);
        canvas.addEventListener('dragenter', (e) => e.preventDefault());
        canvas.addEventListener('dragover', (e) => e.preventDefault());
      }
      this.canvasIframe = iframe;
      if (this._widgetDragging) {
        setTimeout(() => this.setCanvasDragState(true), 0);
      }
      const bodyHtml = renderCanvasBody(this.state);
      const doc = iframe.contentDocument;
      if (!doc) return;
      doc.open();
      doc.write(`<!DOCTYPE html><html lang="th"><head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="${esc(STYLES_URL)}">
        <style>
          body{margin:0;font-family:Sarabun,sans-serif;background:#fff}
          .section-reveal{opacity:1!important;transform:none!important;transition:none!important}
          .ipb__block{position:relative;outline:2px solid transparent;outline-offset:-2px}
          .ipb__block:hover{outline-color:rgba(59,130,246,.35)}
          .ipb__block.is-selected{outline-color:#2563eb;z-index:5}
          .ipb__block-label{position:absolute;top:0;left:0;z-index:6;padding:.15rem .45rem;font-size:.65rem;font-weight:700;background:#2563eb;color:#fff;border-radius:0 0 6px 0;opacity:0;pointer-events:none}
          .ipb__block.is-selected .ipb__block-label,.ipb__block:hover .ipb__block-label{opacity:1}
          .ipb__block-toolbar{position:absolute;top:.35rem;right:.35rem;z-index:7;display:flex;gap:.15rem;padding:.2rem;background:rgba(15,23,42,.88);border-radius:8px;opacity:0;pointer-events:none}
          .ipb__block.is-selected .ipb__block-toolbar{opacity:1;pointer-events:auto}
          .ipb__block-btn{border:0;background:transparent;color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer}
          .ipb__block-handle{cursor:grab}
          .ipb__card-block.is-selected{outline:1px dashed #2563eb}
          .detail-content{position:relative}
          .ipb__card-slot{position:relative}
          .ipb__insert{position:relative;display:flex;align-items:center;justify-content:center;height:28px;margin:-4px 0;z-index:12;opacity:0;pointer-events:none;transition:opacity .15s,height .15s,margin .15s,background .15s,border-color .15s}
          .detail-content:hover .ipb__insert,.ipb__card-slot:hover>.ipb__insert,.ipb__content-slot:hover>.ipb__insert,.ipb__insert:hover,.ipb__insert:focus-within,.ipb__block.is-selected .ipb__insert{opacity:1;pointer-events:auto}
          .ipb__insert-line{position:absolute;left:0;right:0;top:50%;border-top:2px dotted rgba(37,99,235,.5);pointer-events:none;transition:border-color .15s,border-width .15s}
          .ipb__insert-drop-hint{display:none;position:relative;z-index:1;padding:.2rem .65rem;font-size:.78rem;font-weight:600;color:#2563eb;background:#eff6ff;border:1px dashed #93c5fd;border-radius:999px;pointer-events:none}
          .ipb__insert-btn{position:relative;z-index:1;width:30px;height:30px;border-radius:50%;border:2px solid #2563eb;background:#fff;color:#2563eb;font-size:1.25rem;font-weight:700;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(37,99,235,.22);padding:0;transition:transform .15s,background .15s,color .15s}
          .ipb__insert-btn:hover{background:#2563eb;color:#fff}
          body.is-widget-drag .ipb__insert{opacity:1;pointer-events:auto;height:36px}
          body.is-widget-drag .ipb__insert-line{border-top-color:rgba(37,99,235,.75)}
          body.is-widget-drag .ipb__insert.is-drag-over{height:68px;margin:6px 0;border-radius:12px;background:#eff6ff}
          body.is-widget-drag .ipb__insert.is-drag-over .ipb__insert-line{border-top:3px solid #2563eb}
          body.is-widget-drag .ipb__insert.is-drag-over .ipb__insert-drop-hint{display:inline-flex}
          body.is-widget-drag .ipb__insert.is-drag-over .ipb__insert-btn{transform:scale(1.08);background:#2563eb;color:#fff}
          body.is-widget-drag .detail-content>.ipb__insert:only-child{height:120px;margin:1rem 0;border:2px dashed #93c5fd;border-radius:12px;background:#f8fbff}
          body.is-widget-drag .detail-content>.ipb__insert:only-child .ipb__insert-drop-hint{display:inline-flex}
          body.is-widget-drag .ipb__drop-zone{border-color:#60a5fa;background:#f0f7ff}
          body.is-widget-drag .ipb__drop-zone.is-drag-over{min-height:120px;border-color:#2563eb;background:#dbeafe;box-shadow:inset 0 0 0 2px rgba(37,99,235,.12)}
          body.is-widget-drag .ipb__drop-zone.is-drag-over .ipb__drop-zone-hint{color:#2563eb;font-weight:600}
          .ipb__empty-cards{margin:1rem 0;padding:1.25rem;text-align:center;color:#64748b;font-size:.9rem;border:1px dashed #cbd5e1;border-radius:10px}
          .ipb__drop-zone{min-height:96px;margin:.5rem 0;border:2px dashed #93c5fd;border-radius:12px;background:#f8fbff;display:flex;align-items:center;justify-content:center;transition:border-color .15s,background .15s,box-shadow .15s}
          .ipb__drop-zone.is-drag-over{border-color:#2563eb;background:#eff6ff;box-shadow:inset 0 0 0 1px rgba(37,99,235,.15)}
          .ipb__drop-zone.is-selected{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.22)}
          .ipb__drop-zone-hint{margin:0;padding:0 1rem;text-align:center;color:#64748b;font-size:.9rem;pointer-events:none}
          .ipb__widget-spacer{min-height:48px;background:transparent}
          .ipb__widget-divider{border:0;border-top:2px solid #e2e8f0;margin:0;width:100%}
          .ipb__divider-block{min-height:52px;padding:18px 22px;display:flex;align-items:center;cursor:pointer;border-radius:12px}
          .ipb__divider-block.is-selected{outline:2px dashed #2563eb;outline-offset:2px}
          .ipb__divider-block:hover{outline:1px dashed rgba(37,99,235,.45);outline-offset:2px}
          .detail-slider{position:relative;display:flex;align-items:center;gap:.35rem;margin-top:.5rem}
          .detail-slider__viewport{overflow:hidden;flex:1;border-radius:8px}
          .detail-slider__track{display:flex;transition:transform .35s ease;will-change:transform}
          .detail-slider__slide{flex:0 0 calc(100% / var(--slides-per-view,1));margin:0;padding:0 4px;box-sizing:border-box}
          .detail-slider__slide img{display:block;width:100%;height:auto;border-radius:8px}
          .detail-slider__nav{flex-shrink:0;width:36px;height:36px;border:1px solid #cbd5e1;border-radius:50%;background:#fff;color:#2563eb;font-size:1.35rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
          .detail-slider__nav:disabled{opacity:.35;cursor:not-allowed}
          .detail-slider__nav:not(:disabled):hover{background:#2563eb;color:#fff;border-color:#2563eb}
          .detail-block--media{border-radius:10px;padding:16px 18px}
          .detail-block--media .detail-block__media{margin:0}
          .detail-block--media .detail-block__media img{border-radius:6px;width:100%;height:auto;display:block}
          .ipb__media-placeholder{margin:0;color:#64748b;font-size:.9rem;text-align:center;padding:1.5rem 1rem;border:1px dashed #cbd5e1;border-radius:6px;background:#f8fafc}
        </style>
      </head><body>${bodyHtml}</body></html>`);
      doc.close();
      this.destroySortables();
      let canvasBound = false;
      const onReady = () => {
        if (canvasBound) return;
        const idoc = iframe.contentDocument;
        const body = idoc?.body;
        if (!body?.querySelector('.ipb-canvas-inner')) return;
        canvasBound = true;
        this.bindCanvasEvents(idoc);
        initPlanSliders(idoc.body);
        try {
          iframe.style.height = `${Math.max(720, body.scrollHeight + 32)}px`;
        } catch (_) {
          /* empty */
        }
      };
      iframe.onload = onReady;
      onReady();
      setTimeout(onReady, 250);
      setTimeout(onReady, 900);
    }

    bindCanvasEvents(doc) {
      const canvas = doc.body;
      if (!canvas) return;
      canvas.querySelectorAll('.ipb__block').forEach((block) => {
        block.addEventListener('click', (e) => {
          if (e.target.closest('.ipb__block-toolbar')) return;
          if (e.target.closest('.ipb__insert')) return;
          if (e.target.closest('.ipb__drop-zone')) return;
          if (e.target.closest('[data-card-id]')) return;
          const pick = e.target.closest('[data-section-pick]');
          if (pick?.dataset.sectionPick) {
            this.select(pick.dataset.sectionPick);
            return;
          }
          if (e.target.closest('.detail-summary')) {
            this.select('whoFor');
            return;
          }
          this.select(block.dataset.sectionKey);
        });
        block.querySelector('[data-act="del"]')?.addEventListener('click', (e) => {
          e.stopPropagation();
          const sec = this.getSection(block.dataset.sectionKey);
          if (sec) {
            sec.active = false;
            this.pushHistory();
            this.state.selected = null;
            this.render();
          }
        });
        block.querySelector('[data-act="dup"]')?.addEventListener('click', (e) => {
          e.stopPropagation();
          const key = block.dataset.sectionKey;
          if (key === 'planCards') this.addDropZone();
          else if (key === 'bottomBanners') this.addBanner();
        });
      });
      canvas.querySelectorAll('[data-section-pick]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.select(el.dataset.sectionPick);
        });
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.select(el.dataset.sectionPick);
          }
        });
      });
      canvas.querySelectorAll('[data-card-id]').forEach((card) => {
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          this.select('planCards', { cardId: card.dataset.cardId });
        });
      });
      canvas.querySelectorAll('[data-banner-id]').forEach((b) => {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.select('bottomBanners', { bannerId: b.dataset.bannerId });
        });
      });
      canvas.querySelectorAll('[data-drop-zone]').forEach((zone) => {
        zone.addEventListener('click', (e) => {
          e.stopPropagation();
          this.select('planCards', { dropZoneId: zone.dataset.dropZone });
        });
        zone.addEventListener('dragenter', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        zone.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
          this.clearCanvasDragMarks();
          zone.classList.add('is-drag-over');
        });
        zone.addEventListener('dragleave', (e) => {
          if (!zone.contains(e.relatedTarget)) zone.classList.remove('is-drag-over');
        });
        zone.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          zone.classList.remove('is-drag-over');
          const type = this.readDragWidgetType(e);
          if (type) this.fillDropZone(zone.dataset.dropZone, type);
          this.endWidgetDrag();
        });
      });
      canvas.querySelectorAll('[data-insert="plan-card"]').forEach((slot) => {
        const btn = slot.querySelector('.ipb__insert-btn');
        btn?.addEventListener('mousedown', (e) => e.stopPropagation());
        btn?.addEventListener('click', (e) => {
          e.stopPropagation();
          const index = Number(slot.dataset.index);
          this.addDropZone(Number.isFinite(index) ? index : undefined);
        });
        slot.addEventListener('dragenter', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        slot.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
          this.clearCanvasDragMarks();
          slot.classList.add('is-drag-over');
        });
        slot.addEventListener('dragleave', (e) => {
          if (!slot.contains(e.relatedTarget)) slot.classList.remove('is-drag-over');
        });
        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          slot.classList.remove('is-drag-over');
          const type = this.readDragWidgetType(e);
          if (!type) return;
          const index = Number(slot.dataset.index);
          this.insertWidgetAt(type, Number.isFinite(index) ? index : undefined);
          this.endWidgetDrag();
        });
      });
      canvas.addEventListener('dragover', (e) => {
        if (e.target.closest('[data-drop-zone], [data-insert="plan-card"]')) return;
        e.preventDefault();
      });
      canvas.addEventListener('drop', (e) => {
        if (e.target.closest('[data-drop-zone], [data-insert="plan-card"]')) return;
        e.preventDefault();
        const type = this.readDragWidgetType(e);
        if (!type) return;
        if (this.state.selected?.dropZoneId) {
          this.fillDropZone(this.state.selected.dropZoneId, type);
        }
        this.endWidgetDrag();
      });

      if (typeof Sortable !== 'undefined') {
        const list = canvas.querySelector('.ipb-canvas-inner');
        if (list) {
          this.sortables.push(
            Sortable.create(list, {
              handle: '.ipb__block-handle',
              animation: 180,
              ghostClass: 'sortable-ghost',
              onEnd: () => {
                const keys = [...list.querySelectorAll('.ipb__block')].map((b) => b.dataset.sectionKey);
                const reordered = [];
                keys.forEach((k) => {
                  const s = this.getSection(k);
                  if (s) reordered.push(s);
                });
                const rest = this.state.sections.filter((s) => !keys.includes(s.key));
                this.state.sections = [...reordered, ...rest];
                this.pushHistory();
              },
            })
          );
        }
        canvas.querySelectorAll('[data-banner-list]').forEach((ul) => {
          this.sortables.push(
            Sortable.create(ul, {
              animation: 150,
              ghostClass: 'sortable-ghost',
              onEnd: () => {
                const sec = this.getSection('bottomBanners');
                const ids = [...ul.querySelectorAll('[data-banner-id]')].map((n) => n.dataset.bannerId);
                sec.data.banners = ids.map((id) => sec.data.banners.find((b) => b.id === id)).filter(Boolean);
                this.pushHistory();
              },
            })
          );
        });
        const plans = this.getSection('planCards');
        const detailContent = canvas.querySelector('[data-plan-list]') || canvas.querySelector('.detail-content');
        if (detailContent && plans) {
          this.sortables.push(
            Sortable.create(detailContent, {
              animation: 150,
              draggable: '.ipb__content-slot',
              filter: '.ipb__drop-zone',
              ghostClass: 'sortable-ghost',
              handle: '.detail-block[data-card-id]',
              onEnd: () => {
                const ids = [...detailContent.querySelectorAll('.ipb__content-slot')]
                  .map((slot) => slot.dataset.contentSlot)
                  .filter(Boolean);
                plans.data.cards = ids.map((id) => plans.data.cards.find((c) => c.id === id)).filter(Boolean);
                this.pushHistory();
                this.renderCanvas();
              },
            })
          );
        }
      }
    }

    destroySortables() {
      this.sortables.forEach((s) => s.destroy());
      this.sortables = [];
    }

    field(label, name, value, opts = {}) {
      if (opts.rich) {
        return `<div class="ipb__field ipb__field--rich" data-rich-field="${esc(name)}">
          <label>${esc(label)}</label>
          <p class="form-hint muted">เลือกข้อความแล้วกดปุ่มลิงก์ในแถบเครื่องมือเพื่อเลือกหน้าในเว็บ / บทความ</p>
          <textarea data-f="${esc(name)}" hidden>${esc(value)}</textarea>
          <div class="ipb__quill-mount quill-mount" data-cms-quill-mount data-rich-for="${esc(name)}"></div>
        </div>`;
      }
      const type = opts.type || 'text';
      if (type === 'textarea') {
        return `<div class="ipb__field"><label>${esc(label)}</label><textarea data-f="${esc(name)}" rows="${opts.rows || 3}">${esc(value)}</textarea></div>`;
      }
      if (type === 'select') {
        const optsHtml = (opts.options || [])
          .map((o) => `<option value="${esc(o.value)}"${String(value) === String(o.value) ? ' selected' : ''}>${esc(o.label)}</option>`)
          .join('');
        return `<div class="ipb__field"><label>${esc(label)}</label><select data-f="${esc(name)}">${optsHtml}</select></div>`;
      }
      return `<div class="ipb__field"><label>${esc(label)}</label><input type="${type}" data-f="${esc(name)}" value="${esc(value)}"></div>`;
    }

    mediaField(label, name, value) {
      const preview =
        value && String(value).trim()
          ? `<div class="ipb__media-preview"><img src="${esc(mediaUrl(value))}" alt=""></div>`
          : '';
      return `<div class="ipb__field"><label>${esc(label)}</label>
        <p class="form-hint">วาง URL ภายนอก หรือกด «คลัง» เลือกจากคลังสื่อ</p>
        <div class="ipb__media-row">
          <input type="text" data-f="${esc(name)}" value="${esc(value)}" placeholder="https://... หรือ assets/...">
          <button type="button" class="btn btn--ghost btn--sm" data-media="${esc(name)}">คลัง</button>
        </div>${preview}</div>`;
    }

    rangeField(label, name, val, max = 120) {
      return `<div class="ipb__range-row"><label>${esc(label)}</label>
        <input type="range" data-f="${esc(name)}" min="0" max="${max}" value="${val}">
        <span class="ipb__range-val" data-range-val="${esc(name)}">${val}px</span></div>`;
    }

    toggleRow(label, name, checked) {
      return `<div class="ipb__toggle-row"><span>${esc(label)}</span>
        <label class="ipb__toggle"><input type="checkbox" data-f="${esc(name)}"${checked ? ' checked' : ''}><span></span></label></div>`;
    }

    renderProps() {
      const body = this.root.querySelector('[data-ipb-props]');
      const title = this.root.querySelector('[data-ipb-props-title]');
      if (body) global.CmsQuill?.destroyIn(body);
      if (!body) return;
      const sel = this.state.selected;
      if (!sel?.sectionKey) {
        body.innerHTML = '<p class="ipb__empty-props">คลิก Section บน Canvas<br>เพื่อแก้ไขคุณสมบัติ</p>';
        if (title) title.textContent = 'ตั้งค่า Section';
        return;
      }
      const sec = this.getSection(sel.sectionKey);
      if (!sec) return;
      if (title) title.textContent = sel.dropZoneId ? 'ช่องว่าง — ลากมาวาง' : sel.cardId ? 'ตั้งค่าการ์ดแผน' : sel.bannerId ? 'ตั้งค่า Banner' : 'ตั้งค่า Section';

      if (sel.dropZoneId) {
        body.innerHTML = `<p class="form-hint">ลากองค์ประกอบจากแผงซ้ายมาวางในช่องที่เลือก<br>หรือคลิกวิดเจ็ตในแผงซ้ายเพื่อใส่ทันที</p>
          <button type="button" class="btn btn--danger btn--sm" data-del-drop-zone>ลบช่องว่าง</button>`;
        this.bindPropsEvents(sec, sel);
        return;
      }

      if (sel.cardId) {
        body.innerHTML = this.renderCardProps(sec, sel.cardId);
      } else if (sel.bannerId) {
        body.innerHTML = this.renderBannerProps(sec, sel.bannerId);
      } else {
        body.innerHTML = this.renderSectionProps(sec);
      }
      this.bindPropsEvents(sec, sel);
    }

    renderSectionProps(sec) {
      const d = sec.data;
      const s = sec.settings;
      if (sec.key === 'hero') {
        return [
          this.field('หมวดหมู่ (Eyebrow)', 'categoryLabel', d.categoryLabel || ''),
          this.field('ชื่อแบบประกัน (H1)', 'h1', d.h1 || ''),
          this.field('คำอธิบาย', 'copy', d.copy || '', { rich: true }),
          this.field('พื้นหลัง', 'bgType', d.bgType || 'color', {
            type: 'select',
            options: [
              { value: 'color', label: 'สี' },
              { value: 'image', label: 'รูป' },
            ],
          }),
          this.field('สีพื้นหลัง', 'bgColor', d.bgColor || ''),
          this.mediaField('รูปพื้นหลัง', 'bgImage', d.bgImage || ''),
        ].join('');
      }
      if (sec.key === 'whoFor') {
        return [
          this.field('หัวข้อ', 'h2', d.h2 || ''),
          this.field('รายละเอียด', 'text', d.text || '', { rich: true }),
          this.field('สีพื้นหลังกล่อง', 'boxBgColor', d.boxBgColor || ''),
        ].join('');
      }
      if (sec.key === 'planCards') {
        const count = (d.cards || []).filter((c) => c.type !== 'dropZone').length;
        const zones = (d.cards || []).filter((c) => c.type === 'dropZone').length;
        return `<p class="form-hint">กด + บน Canvas เพื่อเพิ่มช่องว่าง แล้วลากองค์ประกอบจากแผงซ้ายมาวาง</p>
          <button type="button" class="btn btn--primary btn--sm" data-add-drop-zone>+ เพิ่มช่องว่าง</button>
          <p class="form-hint" style="margin-top:0.75rem">มี ${count} องค์ประกอบ${zones ? ` · ${zones} ช่องว่างรอวาง` : ''}</p>`;
      }
      if (sec.key === 'recommendation') {
        return [
          this.field('หัวข้อ', 'h2', d.h2 || ''),
          this.field('รายละเอียด', 'body', d.body || '', { rich: true }),
        ].join('');
      }
      if (sec.key === 'cta') {
        return [
          this.field('Eyebrow', 'eyebrow', d.eyebrow || ''),
          this.field('หัวข้อ', 'h2', d.h2 || ''),
          this.field('รายละเอียด', 'copy', d.copy || '', { rich: true }),
          this.field('ข้อความปุ่ม', 'buttonText', d.buttonText || ''),
          this.field('ลิงก์ปุ่ม', 'buttonHref', d.buttonHref || ''),
          this.field('สีพื้นหลัง', 'bgColor', d.bgColor || ''),
          this.mediaField('รูปพื้นหลัง', 'bgImage', d.bgImage || ''),
          this.field('ลิงก์วิดีโอ', 'videoUrl', d.videoUrl || ''),
        ].join('');
      }
      if (sec.key === 'bottomBanners') {
        return `<p class="form-hint">คลิก Banner บน Canvas หรือเพิ่มจากแผงซ้าย</p>
          <button type="button" class="btn btn--primary btn--sm" data-add-banner>+ เพิ่ม Banner</button>`;
      }
      return '';
    }

    renderCardProps(sec, cardId) {
      const card = sec.data.cards?.find((c) => c.id === cardId);
      if (!card) return '';
      const wt = widgetTypeOf(card);
      const label = WIDGETS.find((w) => w.type === wt || w.type === card.widgetType)?.label || wt;
      let fields = [`<p class="form-hint">ประเภท: <strong>${esc(label)}</strong></p>`];

      if (['planCard', 'bullets'].includes(wt) || wt === 'heading') {
        fields.push(this.field('หัวข้อ', 'title', card.title || ''));
      }
      if (['planCard', 'bullets', 'heading', 'gallery', 'slider'].includes(wt)) {
        fields.push(this.field('Anchor ID', 'anchorId', card.anchorId || ''));
      }

      if (wt === 'heading') {
        fields.push(this.field('คำอธิบาย', 'body', card.body || '', { rich: true }));
      } else if (wt === 'text') {
        fields.push(this.field('ข้อความ', 'body', card.body || '', { rich: true }));
      } else if (wt === 'image') {
        fields.push(this.field('หัวข้อ (ไม่บังคับ)', 'title', card.title || ''));
        fields.push(this.mediaField('รูปภาพ', 'image', card.image || ''));
      } else if (wt === 'button') {
        fields.push(this.field('ข้อความปุ่ม', 'buttonText', card.buttonText || ''));
        fields.push(this.field('ลิงก์ปุ่ม', 'buttonHref', card.buttonHref || ''));
      } else if (wt === 'video') {
        fields.push(this.field('ลิงก์วิดีโอ', 'videoUrl', card.videoUrl || ''));
      } else if (wt === 'icon') {
        fields.push(this.mediaField('ไอคอน', 'icon', card.icon || ''));
      } else if (wt === 'columns') {
        (card.columns || ['', '']).forEach((col, i) => {
          fields.push(this.field(`คอลัมน์ ${i + 1}`, `col_${i}`, col, { rich: true }));
        });
      } else if (wt === 'gallery') {
        fields.push(this.field('หัวข้อ', 'title', card.title || ''));
        (card.images || ['']).forEach((img, i) => {
          fields.push(this.mediaField(`รูป ${i + 1}`, `gallery_${i}`, img));
        });
        fields.push(`<button type="button" class="btn btn--ghost btn--sm" data-media-multi>เลือกหลายรูปจากคลัง</button>`);
        fields.push(`<button type="button" class="btn btn--ghost btn--sm" data-add-gallery>+ เพิ่มช่องรูป</button>`);
      } else if (wt === 'slider') {
        fields.push(this.field('หัวข้อ', 'title', card.title || ''));
        fields.push(
          this.field('แสดงต่อแถว', 'slidesPerView', String(card.slidesPerView || 1), {
            type: 'select',
            options: [
              { value: '1', label: '1 รูป (เลื่อนทีละ 1)' },
              { value: '2', label: '2 รูป (เลื่อนทีละ 1)' },
              { value: '3', label: '3 รูป (เลื่อนทีละ 1)' },
            ],
          })
        );
        (card.images || ['']).forEach((img, i) => {
          fields.push(this.mediaField(`รูป ${i + 1}`, `gallery_${i}`, img));
        });
        fields.push(`<button type="button" class="btn btn--ghost btn--sm" data-media-multi>เลือกหลายรูปจากคลัง</button>`);
        fields.push(`<button type="button" class="btn btn--ghost btn--sm" data-add-gallery>+ เพิ่มช่องรูป</button>`);
      } else if (wt === 'tabs') {
        (card.tabs || []).forEach((tab, i) => {
          fields.push(this.field(`แท็บ ${i + 1}`, `tab_label_${i}`, tab.label || ''));
          fields.push(this.field(`เนื้อหาแท็บ ${i + 1}`, `tab_body_${i}`, tab.body || '', { rich: true }));
        });
        fields.push(`<button type="button" class="btn btn--ghost btn--sm" data-add-tab>+ เพิ่มแท็บ</button>`);
      } else if (wt === 'accordion') {
        (card.items || []).forEach((item, i) => {
          fields.push(this.field(`หัวข้อ ${i + 1}`, `acc_title_${i}`, item.title || ''));
          fields.push(this.field(`รายละเอียด ${i + 1}`, `acc_body_${i}`, item.body || '', { rich: true }));
        });
        fields.push(`<button type="button" class="btn btn--ghost btn--sm" data-add-acc>+ เพิ่มรายการ</button>`);
      } else if (wt === 'map') {
        fields.push(this.field('ลิงก์ฝังแผนที่', 'mapEmbed', card.mapEmbed || '', { type: 'textarea', rows: 2 }));
      } else if (wt === 'planCard' || wt === 'bullets') {
        fields.push(this.field('รูปแบบ', 'type', card.type || 'checklist', {
          type: 'select',
          options: [
            { value: 'checklist', label: 'Bullet' },
            { value: 'paragraph', label: 'ย่อหน้า' },
          ],
        }));
        fields.push(this.mediaField('ไอคอน', 'icon', card.icon || ''));
        fields.push(this.mediaField('รูปภาพ', 'image', card.image || ''));
        fields.push(this.field('วิดีโอ URL', 'videoUrl', card.videoUrl || ''));
        fields.push(this.field('ข้อความปุ่ม', 'buttonText', card.buttonText || ''));
        fields.push(this.field('ลิงก์ปุ่ม', 'buttonHref', card.buttonHref || ''));
        if (card.type === 'paragraph') {
          fields.push(this.field('ข้อความ', 'body', card.body || '', { rich: true }));
        } else {
          const bullets = (card.bullets || [])
            .map(
              (b, i) => `<li class="ipb__bullet"><input type="text" data-bullet="${i}" value="${esc(b)}"><button type="button" class="btn btn--ghost btn--sm" data-rm-bullet="${i}">ลบ</button></li>`
            )
            .join('');
          fields.push(`<div class="ipb__field"><label>Bullet</label><ul class="ipb__bullets">${bullets}</ul><button type="button" class="btn btn--ghost btn--sm" data-add-bullet>+ เพิ่ม Bullet</button></div>`);
        }
      }

      fields.push(`<button type="button" class="btn btn--danger btn--sm" data-del-card>ลบองค์ประกอบ</button>`);
      return fields.join('');
    }

    renderBannerProps(sec, bannerId) {
      const b = sec.data.banners?.find((x) => x.id === bannerId);
      if (!b) return '';
      return [
        this.mediaField('รูป Banner', 'image', b.image || ''),
        this.field('ลิงก์', 'href', b.href || ''),
        this.field('Alt text', 'alt', b.alt || ''),
        `<button type="button" class="btn btn--danger btn--sm" data-del-banner>ลบ Banner</button>`,
      ].join('');
    }

    bindPropsEvents(sec, sel) {
      const body = this.root.querySelector('[data-ipb-props]');
      if (!body) return;

      body.querySelectorAll('[data-f]').forEach((inp) => {
        if (inp.closest('[data-rich-field]')) return;
        const apply = () => this.applyField(sec, sel, inp.dataset.f, inp);
        inp.addEventListener('input', apply);
        inp.addEventListener('change', apply);
      });

      this.initRichEditors(sec, sel, body);

      body.querySelectorAll('[data-range-val]').forEach((span) => {
        const name = span.dataset.rangeVal;
        const range = body.querySelector(`[data-f="${name}"]`);
        range?.addEventListener('input', () => {
          span.textContent = `${range.value}px`;
        });
      });

      body.querySelectorAll('[data-media]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const name = btn.dataset.media;
          this.openMediaPicker((path) => {
            const inp = body.querySelector(`[data-f="${name}"]`);
            if (inp) {
              inp.value = path;
              this.applyField(sec, sel, name, inp);
            }
          });
        });
      });

      body.querySelector('[data-media-multi]')?.addEventListener('click', () => {
        if (!sel.cardId || !this.openMediaPicker) return;
        this.openMediaPicker(
          (paths) => {
            this.addGalleryImages(sel.cardId, paths);
          },
          { multiple: true }
        );
      });

      body.querySelector('[data-add-drop-zone]')?.addEventListener('click', () => this.addDropZone());
      body.querySelector('[data-del-drop-zone]')?.addEventListener('click', () => {
        if (sel.dropZoneId) this.removeDropZone(sel.dropZoneId);
      });
      body.querySelector('[data-add-banner]')?.addEventListener('click', () => this.addBanner());
      body.querySelector('[data-add-bullet]')?.addEventListener('click', () => {
        if (sel.cardId) this.addBullet(sel.cardId);
      });
      body.querySelector('[data-add-gallery]')?.addEventListener('click', () => {
        const card = sec.data.cards?.find((c) => c.id === sel.cardId);
        if (!card) return;
        if (!Array.isArray(card.images)) card.images = [];
        card.images.push('');
        this.pushHistory();
        this.renderProps();
      });
      body.querySelector('[data-add-tab]')?.addEventListener('click', () => {
        const card = sec.data.cards?.find((c) => c.id === sel.cardId);
        if (!card) return;
        if (!Array.isArray(card.tabs)) card.tabs = [];
        card.tabs.push({ label: `แท็บ ${card.tabs.length + 1}`, body: '' });
        this.pushHistory();
        this.renderProps();
      });
      body.querySelector('[data-add-acc]')?.addEventListener('click', () => {
        const card = sec.data.cards?.find((c) => c.id === sel.cardId);
        if (!card) return;
        if (!Array.isArray(card.items)) card.items = [];
        card.items.push({ title: 'หัวข้อ', body: '' });
        this.pushHistory();
        this.renderProps();
      });
      body.querySelectorAll('[data-bullet]').forEach((inp) => {
        inp.addEventListener('input', () => {
          const card = sec.data.cards?.find((c) => c.id === sel.cardId);
          if (!card) return;
          const idx = Number(inp.dataset.bullet);
          card.bullets[idx] = inp.value;
          this.renderCanvas();
        });
      });
      body.querySelectorAll('[data-rm-bullet]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const card = sec.data.cards?.find((c) => c.id === sel.cardId);
          if (!card) return;
          card.bullets.splice(Number(btn.dataset.rmBullet), 1);
          this.pushHistory();
          this.renderProps();
          this.renderCanvas();
        });
      });
      body.querySelector('[data-del-card]')?.addEventListener('click', () => {
        sec.data.cards = sec.data.cards.filter((c) => c.id !== sel.cardId);
        this.pushHistory();
        this.select('planCards');
      });
      body.querySelector('[data-del-banner]')?.addEventListener('click', () => {
        sec.data.banners = sec.data.banners.filter((b) => b.id !== sel.bannerId);
        this.pushHistory();
        this.select('bottomBanners');
      });
    }

    initRichEditors(sec, sel, body) {
      if (!global.CmsQuill?.initField) return;
      body.querySelectorAll('[data-rich-field]').forEach((wrap) => {
        const name = wrap.dataset.richField;
        const hidden = wrap.querySelector(`[data-f="${name}"]`);
        const mount = wrap.querySelector('[data-cms-quill-mount]');
        if (!hidden || !mount) return;
        global.CmsQuill.initField(mount, hidden, {
          onChange: () => this.applyField(sec, sel, name, hidden),
        });
      });
    }

    applyField(sec, sel, name, inp) {
      const val = inp.type === 'checkbox' ? inp.checked : inp.value;
      if (name.startsWith('vis')) {
        const k = name === 'visDesktop' ? 'desktop' : name === 'visTablet' ? 'tablet' : 'mobile';
        if (!sec.settings.visible) sec.settings.visible = {};
        sec.settings.visible[k] = val;
      } else if (name === 'active') {
        sec.active = val;
      } else if (['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'bgColor', 'bgImage', 'bgVideo', 'cssId', 'animation'].includes(name)) {
        if (name === 'bgColor' || name === 'bgImage') {
          sec.data[name] = val;
          sec.settings[name] = val;
        } else {
          sec.settings[name] = name.startsWith('padding') ? Number(val) : val;
        }
      } else if (sel.cardId) {
        const card = sec.data.cards?.find((c) => c.id === sel.cardId);
        if (!card) return;
        if (name.startsWith('col_')) {
          const i = Number(name.slice(4));
          if (!Array.isArray(card.columns)) card.columns = ['', ''];
          card.columns[i] = val;
        } else if (name.startsWith('gallery_')) {
          const i = Number(name.slice(8));
          if (!Array.isArray(card.images)) card.images = [];
          card.images[i] = val;
        } else if (name === 'slidesPerView') {
          card.slidesPerView = Math.min(3, Math.max(1, Number(val) || 1));
        } else if (name.startsWith('tab_label_')) {
          const i = Number(name.slice(10));
          if (!Array.isArray(card.tabs)) card.tabs = [];
          if (!card.tabs[i]) card.tabs[i] = { label: '', body: '' };
          card.tabs[i].label = val;
        } else if (name.startsWith('tab_body_')) {
          const i = Number(name.slice(9));
          if (!Array.isArray(card.tabs)) card.tabs = [];
          if (!card.tabs[i]) card.tabs[i] = { label: '', body: '' };
          card.tabs[i].body = val;
        } else if (name.startsWith('acc_title_')) {
          const i = Number(name.slice(10));
          if (!Array.isArray(card.items)) card.items = [];
          if (!card.items[i]) card.items[i] = { title: '', body: '' };
          card.items[i].title = val;
        } else if (name.startsWith('acc_body_')) {
          const i = Number(name.slice(9));
          if (!Array.isArray(card.items)) card.items = [];
          if (!card.items[i]) card.items[i] = { title: '', body: '' };
          card.items[i].body = val;
        } else {
          card[name] = val;
          if (name === 'type') {
            this.renderProps();
            return;
          }
        }
      } else if (sel.bannerId) {
        const b = sec.data.banners?.find((x) => x.id === sel.bannerId);
        if (b) b[name] = val;
      } else {
        sec.data[name] = val;
      }
      this.renderCanvas();
      if (
        sel.cardId &&
        (name === 'image' || name === 'icon' || name.startsWith('gallery_') || name === 'bgImage' || name === 'slidesPerView')
      ) {
        this.renderProps();
      } else if (sel.bannerId && name === 'image') {
        this.renderProps();
      }
    }

    bindShellEvents(pageKeys) {
      this.root.querySelector('[data-ipb-back]')?.addEventListener('click', () => this.onBack?.());
      this.root.querySelector('[data-ipb-tabs]')?.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-ipb-page]');
        if (!tab) return;
        this.load(tab.dataset.ipbPage).catch((err) => this.toast(this.toastEl, err.message, true));
      });
      this.root.querySelectorAll('[data-device]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.state.device = btn.dataset.device;
          this.root.querySelectorAll('[data-device]').forEach((b) => b.classList.toggle('is-active', b === btn));
          this.renderCanvas();
        });
      });
      this.root.querySelector('[data-undo]')?.addEventListener('click', () => this.undo());
      this.root.querySelector('[data-redo]')?.addEventListener('click', () => this.redo());
      this.root.querySelector('[data-preview]')?.addEventListener('click', () => {
        let file = IPF()?.pages?.[this.defaultsPageKey || this.pageKey]?.file || 'insurance.html';
        if (this.singlePlanMode && this.planSlug) {
          file = `plans/${this.planSlug}.html`;
        }
        window.open(`${SITE_BASE}/${file}`, '_blank', 'noopener');
      });
      this.root.querySelector('[data-sync-category]')?.addEventListener('click', async () => {
        if (!this.onSyncFromCategory) return;
        try {
          await this.onSyncFromCategory();
        } catch (err) {
          this.toast(this.toastEl, err.message || 'ดึงข้อมูลไม่สำเร็จ', true);
        }
      });
      this.root.querySelector('[data-draft]')?.addEventListener('click', () => this.save(true));
      this.root.querySelector('[data-publish]')?.addEventListener('click', () => this.save(false));
    }

    async save(draft) {
      if (this.saving) return;
      this.saving = true;
      try {
        const propsBody = this.root.querySelector('[data-ipb-props]');
        global.CmsQuill?.syncIn(propsBody);
        const serialized = serializeToSections(this.state);
        const keys = IPF()?.sectionKeys || [];
        for (let i = 0; i < keys.length; i++) {
          const sk = keys[i];
          const row = serialized[sk] || { config: {}, is_active: true };
          await this.api(`/sections/${sk}`, {
            method: 'PUT',
            body: {
              page_key: this.pageKey,
              title: IPF()?.sectionMeta?.[sk]?.title || sk,
              config: row.config,
              is_active: row.is_active ? 1 : 0,
              sort_order: i,
              draft: !!draft,
              skip_build: true,
            },
          });
        }
        if (draft) {
          this.toast(this.toastEl, 'บันทึกแบบร่างแล้ว');
        } else if (this.onPublish) {
          await this.onPublish(
            `เผยแพร่บิวเดอร์แผน ${this.planLabel || IPF()?.pages?.[this.defaultsPageKey]?.label || this.pageKey} แล้ว`
          );
        }
      } catch (err) {
        this.toast(this.toastEl, err.message, true);
      } finally {
        this.saving = false;
      }
    }

    destroy() {
      this.endWidgetDrag();
      this.destroySortables();
    }
  }

  global.InsurancePageBuilder = {
    create(options) {
      return new InsurancePageBuilder(options);
    },
  };
})(window);
