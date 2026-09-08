/**
 * Tracking & marketing tags — admin form
 */
(function (global) {
  'use strict';

  const DEFAULTS = {
    installMode: 'gtm',
    gtm: { enabled: false, containerId: '' },
    ga4: { enabled: false, measurementId: '' },
    facebook: { enabled: false, pixelId: '' },
    tiktok: { enabled: false, pixelId: '' },
    line: { enabled: false, tagId: '' },
    searchConsole: { verificationContent: '' },
    customHead: '',
    customBodyEnd: '',
  };

  /** Official brand logos (Simple Icons + Google brand colors) */
  const LOGO_BASE = 'assets/tracking';
  const LOGO_VER = '20260526-51';
  const LOGOS = {
    install: 'install.svg',
    gtm: 'googletagmanager.svg',
    ga4: 'googleanalytics.svg',
    gsc: 'googlesearchconsole.svg',
    custom: 'javascript.svg',
    facebook: 'facebook.svg',
    tiktok: 'tiktok.svg',
    line: 'line.svg',
  };

  function logoImg(iconKey) {
    const file = LOGOS[iconKey];
    if (!file) return '';
    const src = `${LOGO_BASE}/${file}?v=${LOGO_VER}`;
    return `<img class="tracking-acc__logo" src="${src}" alt="" width="28" height="28" loading="lazy" decoding="async">`;
  }

  function mergeTracking(raw) {
    const t = raw && typeof raw === 'object' ? raw : {};
    return {
      installMode: t.installMode === 'direct' ? 'direct' : 'gtm',
      gtm: { ...DEFAULTS.gtm, ...(t.gtm || {}) },
      ga4: { ...DEFAULTS.ga4, ...(t.ga4 || {}) },
      facebook: { ...DEFAULTS.facebook, ...(t.facebook || {}) },
      tiktok: { ...DEFAULTS.tiktok, ...(t.tiktok || {}) },
      line: { ...DEFAULTS.line, ...(t.line || {}) },
      searchConsole: { ...DEFAULTS.searchConsole, ...(t.searchConsole || {}) },
      customHead: t.customHead || '',
      customBodyEnd: t.customBodyEnd || '',
    };
  }

  function cleanSearchConsoleContent(raw) {
    let value = String(raw || '').trim();
    if (!value) return '';
    const contentMatch = value.match(/content\s*=\s*["']([^"']+)["']/i);
    if (contentMatch) {
      value = contentMatch[1];
    } else {
      const prefixMatch = value.match(/^google-site-verification\s*=\s*(.+)$/i);
      if (prefixMatch) value = prefixMatch[1].trim().replace(/^["']|["']$/g, '');
    }
    value = value.trim().replace(/^["']|["']$/g, '');
    return /^[A-Za-z0-9_-]{10,200}$/.test(value) ? value : '';
  }

  function acc(title, body, open = false, iconKey = '') {
    const icon =
      iconKey && LOGOS[iconKey]
        ? `<span class="tracking-acc__icon tracking-acc__icon--${esc(iconKey)}">${logoImg(iconKey)}</span>`
        : '';
    return `<details class="footer-acc tracking-acc"${open ? ' open' : ''}>
      <summary class="footer-acc__summary tracking-acc__summary">${icon}<span class="tracking-acc__title">${esc(title)}</span></summary>
      <div class="footer-acc__body">${body}</div>
    </details>`;
  }

  function chk(name, label, checked) {
    return `<label class="tracking-chk"><input type="checkbox" name="${esc(name)}" value="1"${checked ? ' checked' : ''}> ${esc(label)}</label>`;
  }

  function formHtml(tracking, siteUrl) {
    const t = mergeTracking(tracking);
    const sitemapUrl = `${String(siteUrl || '').replace(/\/$/, '')}/sitemap.xml`;
    const gtmMode = t.installMode === 'gtm';

    return `<div class="tracking-editor" id="tracking-editor">
      <p class="tracking-editor__intro muted">ตั้งค่าแล้วกดบันทึก — ระบบจะอัปเดตหน้าเว็บให้อัตโนมัติ</p>

      ${acc(
        'วิธีติดตั้ง',
        `<div class="tracking-mode">
          <label class="tracking-mode__opt${gtmMode ? ' is-active' : ''}">
            <input type="radio" name="installMode" value="gtm"${gtmMode ? ' checked' : ''}>
            <strong>Google Tag Manager (แนะนำ)</strong>
            <span class="muted">จัดการแท็กทั้งหมดใน GTM — แก้ CMS น้อยครั้ง</span>
          </label>
          <label class="tracking-mode__opt${!gtmMode ? ' is-active' : ''}">
            <input type="radio" name="installMode" value="direct"${!gtmMode ? ' checked' : ''}>
            <strong>ติดตั้งตรง (Direct)</strong>
            <span class="muted">ใส่ GA4 ตรงใน CMS (ไม่ผ่าน GTM)</span>
          </label>
        </div>`,
        false,
        'install'
      )}

      <div id="tracking-panel-gtm" class="tracking-panel${gtmMode ? '' : ' is-hidden'}">
        ${acc(
          'Google Tag Manager',
          `<div class="form-grid form-grid--stacked">
            ${chk('gtm_enabled', 'เปิดใช้ Google Tag Manager', t.gtm.enabled)}
            <div class="form-field form-field--full">
              <label for="f-gtm_id">Container ID</label>
              <input id="f-gtm_id" name="gtm_containerId" type="text" value="${esc(t.gtm.containerId)}" placeholder="GTM-XXXXXXX" pattern="GTM-[A-Z0-9]+" autocomplete="off">
              <p class="form-hint">รูปแบบ GTM-XXXXXXX — จาก <a href="https://tagmanager.google.com/" target="_blank" rel="noopener">tagmanager.google.com</a></p>
            </div>
          </div>`,
          false,
          'gtm'
        )}
      </div>

      <div id="tracking-panel-direct" class="tracking-panel${gtmMode ? ' is-hidden' : ''}">
        ${acc(
          'Google Analytics 4',
          `<div class="form-grid form-grid--stacked">
            ${chk('ga4_enabled', 'เปิดใช้ GA4', t.ga4.enabled)}
            <div class="form-field form-field--full">
              <label for="f-ga4_id">Measurement ID</label>
              <input id="f-ga4_id" name="ga4_measurementId" type="text" value="${esc(t.ga4.measurementId)}" placeholder="G-XXXXXXXXXX" autocomplete="off">
            </div>
          </div>`,
          false,
          'ga4'
        )}
      </div>

      ${acc(
        'Google Search Console',
        `<div class="form-grid form-grid--stacked">
          <div class="form-field form-field--full">
            <label for="f-gsc_verify">รหัสยืนยัน (content)</label>
            <input id="f-gsc_verify" name="gsc_verificationContent" type="text" value="${esc(t.searchConsole.verificationContent)}" placeholder="คัดลอกเฉพาะค่า content จาก Google">
            <p class="form-hint">วางได้ทั้งรหัสอย่างเดียว หรือ <code>google-site-verification=...</code> — ระบบสร้าง meta tag ให้</p>
          </div>
          <div class="tracking-gsc-box form-field--full">
            <p class="tracking-gsc-box__label">Sitemap ของเว็บ (สร้างอัตโนมัติตอน Build)</p>
            <p class="tracking-gsc-box__url"><a href="${esc(sitemapUrl)}" target="_blank" rel="noopener">${esc(sitemapUrl)}</a></p>
            <p class="form-hint">นำ URL นี้ไปส่งใน Search Console → Sitemaps</p>
            <a class="btn btn--ghost btn--sm" href="https://search.google.com/search-console" target="_blank" rel="noopener">เปิด Google Search Console</a>
          </div>
        </div>`,
        false,
        'gsc'
      )}

      ${acc(
        'สคริปต์กำหนดเอง (ขั้นสูง)',
        `<div class="form-grid form-grid--stacked">
          <div class="form-field form-field--full">
            <label for="f-custom_head">ใน &lt;head&gt;</label>
            <textarea id="f-custom_head" name="customHead" rows="4" placeholder="เช่น Microsoft Clarity, chat widget">${esc(t.customHead)}</textarea>
          </div>
          <div class="form-field form-field--full">
            <label for="f-custom_body">ก่อน &lt;/body&gt;</label>
            <textarea id="f-custom_body" name="customBodyEnd" rows="4">${esc(t.customBodyEnd)}</textarea>
          </div>
          <p class="form-hint form-field--full">ใช้เมื่อต้องการสคริปต์ที่ไม่มีในตัวเลือก — ตรวจสอบความปลอดภัยก่อนวาง</p>
        </div>`,
        false,
        'custom'
      )}

      ${acc(
        'Facebook Pixel',
        `<div class="form-grid form-grid--stacked">
          ${chk('fb_enabled', 'เปิดใช้ Facebook Pixel', t.facebook.enabled)}
          <div class="form-field form-field--full">
            <label for="f-fb_pixel">Pixel ID</label>
            <input id="f-fb_pixel" name="facebook_pixelId" type="text" value="${esc(t.facebook.pixelId)}" placeholder="ตัวเลข Pixel ID" autocomplete="off">
            <p class="form-hint">ติดตั้งแยกจาก GTM/GA4 — ใช้เมื่อไม่ได้ใส่ Pixel ผ่าน GTM</p>
          </div>
        </div>`,
        false,
        'facebook'
      )}
      ${acc(
        'TikTok Pixel',
        `<div class="form-grid form-grid--stacked">
          ${chk('tiktok_enabled', 'เปิดใช้ TikTok Pixel', t.tiktok.enabled)}
          <div class="form-field form-field--full">
            <label for="f-tiktok_pixel">Pixel ID</label>
            <input id="f-tiktok_pixel" name="tiktok_pixelId" type="text" value="${esc(t.tiktok.pixelId)}" placeholder="Pixel ID จาก TikTok Events Manager" autocomplete="off">
          </div>
        </div>`,
        false,
        'tiktok'
      )}
      ${acc(
        'LINE Tag (ถ้าใช้)',
        `<div class="form-grid form-grid--stacked">
          ${chk('line_enabled', 'เปิดใช้ LINE Tag', t.line.enabled)}
          <div class="form-field form-field--full">
            <label for="f-line_tag">Tag ID</label>
            <input id="f-line_tag" name="line_tagId" type="text" value="${esc(t.line.tagId)}" autocomplete="off">
          </div>
        </div>`,
        false,
        'line'
      )}
    </div>`;
  }

  function collect(formRoot) {
    const mode = formRoot.querySelector('input[name="installMode"]:checked')?.value || 'gtm';
    return {
      installMode: mode === 'direct' ? 'direct' : 'gtm',
      gtm: {
        enabled: !!formRoot.querySelector('[name="gtm_enabled"]')?.checked,
        containerId: formRoot.querySelector('[name="gtm_containerId"]')?.value?.trim() || '',
      },
      ga4: {
        enabled: !!formRoot.querySelector('[name="ga4_enabled"]')?.checked,
        measurementId: formRoot.querySelector('[name="ga4_measurementId"]')?.value?.trim() || '',
      },
      facebook: {
        enabled: !!formRoot.querySelector('[name="fb_enabled"]')?.checked,
        pixelId: formRoot.querySelector('[name="facebook_pixelId"]')?.value?.trim() || '',
      },
      tiktok: {
        enabled: !!formRoot.querySelector('[name="tiktok_enabled"]')?.checked,
        pixelId: formRoot.querySelector('[name="tiktok_pixelId"]')?.value?.trim() || '',
      },
      line: {
        enabled: !!formRoot.querySelector('[name="line_enabled"]')?.checked,
        tagId: formRoot.querySelector('[name="line_tagId"]')?.value?.trim() || '',
      },
      searchConsole: {
        verificationContent: cleanSearchConsoleContent(
          formRoot.querySelector('[name="gsc_verificationContent"]')?.value || ''
        ),
      },
      customHead: formRoot.querySelector('[name="customHead"]')?.value?.trim() || '',
      customBodyEnd: formRoot.querySelector('[name="customBodyEnd"]')?.value?.trim() || '',
    };
  }

  function bindForm(formRoot) {
    const panelGtm = formRoot.querySelector('#tracking-panel-gtm');
    const panelDirect = formRoot.querySelector('#tracking-panel-direct');

    function syncMode() {
      const gtm = formRoot.querySelector('input[name="installMode"][value="gtm"]')?.checked;
      panelGtm?.classList.toggle('is-hidden', !gtm);
      panelDirect?.classList.toggle('is-hidden', gtm);
      formRoot.querySelectorAll('.tracking-mode__opt').forEach((el) => {
        const input = el.querySelector('input[type="radio"]');
        el.classList.toggle('is-active', !!input?.checked);
      });
    }

    formRoot.querySelectorAll('input[name="installMode"]').forEach((r) => {
      r.addEventListener('change', syncMode);
    });
    syncMode();
  }

  global.TrackingEditor = { formHtml, collect, bindForm, mergeTracking };
})(window);
