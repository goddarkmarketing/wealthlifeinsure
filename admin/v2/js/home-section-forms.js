/**
 * ฟอร์มแก้ไขส่วนหน้าแรก (แทน JSON สำหรับมือใหม่)
 */
(function (global) {
  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  const SECTION_META = {
    hero: {
      title: 'ข้อความ Hero (ด้านบน)',
      hint: 'รูปสไลด์แก้ในแท็บ «สไลด์ Hero»',
    },
    solutionsHeading: { title: 'หัวข้อแบบประกันแนะนำ', hint: 'รายการแผนมาจากเมนู «แผนประกัน» (ติ๊กแนะนำ)' },
    productCategories: { title: 'หมวดแบบประกัน (ชิป)', hint: 'ลิงก์และไอคอนแต่ละหมวด' },
    intro: { title: 'ส่วนแนะนำบริษัท', hint: 'ข้อความและรูปโปรโมต' },
    process: { title: 'ขั้นตอนการทำงาน', hint: '3 ขั้นตอน + ปุ่มลิงก์' },
    taxPlansHeading: { title: 'หัวข้อแผนลดหย่อนภาษี', hint: 'รายการแผนด้านล่างมาจากหน้าเว็บ HTML' },
    testimonials: { title: 'หัวข้อรีวิวลูกค้า', hint: 'รีวิวจริงแก้ในเมนู «รีวิวลูกค้า»' },
    homeArticles: { title: 'หัวข้อบทความบนหน้าแรก', hint: 'บทความดึงจากฐานข้อมูลอัตโนมัติ' },
    homeCareers: { title: 'หัวข้อแนะนำอาชีพ', hint: 'หน้าอาชีพดึงจากฐานข้อมูลอัตโนมัติ' },
    ctaBand: { title: 'แถบชวนติดต่อ (ด้านล่าง)', hint: 'ปุ่มและข้อความเชิญชวน' },
  };

  function field(label, name, value, opts = {}) {
    const type = opts.type || 'text';
    const cls = ['home-field', opts.full ? 'home-field--full' : '', opts.half ? 'home-field--half' : '']
      .filter(Boolean)
      .join(' ');
    const hint = opts.hint ? `<p class="form-hint">${esc(opts.hint)}</p>` : '';
    if (type === 'textarea') {
      return `<div class="${cls}">
        <label>${esc(label)}</label>
        <textarea data-field="${esc(name)}" rows="${opts.rows || 2}">${esc(value)}</textarea>
        ${hint}
      </div>`;
    }
    return `<div class="${cls}">
      <label>${esc(label)}</label>
      <input type="${type}" data-field="${esc(name)}" value="${esc(value)}">
      ${hint}
    </div>`;
  }

  function mediaField(label, name, value) {
    return `<div class="home-field home-field--full">
      <label>${esc(label)}</label>
      <div class="home-media-row">
        <input type="text" data-field="${esc(name)}" value="${esc(value)}">
        <button type="button" class="btn btn--ghost btn--sm" data-media-pick-field="${esc(name)}">เลือกรูป</button>
      </div>
    </div>`;
  }

  function headingFields(c, opts = {}) {
    const parts = [];
    if (opts.eyebrow !== false) {
      parts.push(field('Eyebrow', 'eyebrow', c.eyebrow || '', { half: true }));
    }
    if (c.h1 !== undefined) parts.push(field('หัวข้อหลัก (H1)', 'h1', c.h1 || '', { full: true }));
    if (c.h2 !== undefined || opts.h2 !== false) {
      parts.push(field('หัวข้อ (H2)', 'h2', c.h2 || '', { half: true }));
    }
    if (opts.lead !== false) {
      parts.push(field('คำอธิบายสั้น', 'lead', c.lead || '', { type: 'textarea', rows: 2, full: true }));
    }
    if (c.copy !== undefined) {
      parts.push(field('ข้อความ', 'copy', c.copy || '', { type: 'textarea', rows: 2, full: true }));
    }
    if (c.sidebarLabel !== undefined) {
      parts.push(field('ป้ายด้านข้าง', 'sidebarLabel', c.sidebarLabel || '', { half: true }));
    }
    return parts.join('');
  }

  function repeaterFieldsClass(fields) {
    if (fields.length === 1) return 'home-repeater-row__fields home-repeater-row__fields--single';
    if (fields.join() === 'num,title,desc') return 'home-repeater-row__fields home-repeater-row__fields--steps';
    if (fields.length === 3) return 'home-repeater-row__fields home-repeater-row__fields--triple';
    return 'home-repeater-row__fields home-repeater-row__fields--double';
  }

  function repeaterHtml(arrayName, items, fields, labels) {
    const fieldsCls = repeaterFieldsClass(fields);
    const rows = (items && items.length ? items : [{}])
      .map((item) => {
        const cells = fields
          .map((f) => {
            const val = typeof item === 'string' && f === 'line' ? item : (item[f] ?? '');
            const lab = labels[f] || f;
            const grow = fields.length === 1 || f === 'line' || f === 'title' || f === 'desc' || f === 'label';
            return `<div class="home-field${grow ? ' home-field--grow' : ''}"><label>${esc(lab)}</label><input type="text" data-field="${esc(f)}" value="${esc(val)}"></div>`;
          })
          .join('');
        return `<div class="home-repeater-row" data-repeater-item>
          <div class="${fieldsCls}">${cells}</div>
          <button type="button" class="btn btn--ghost btn--sm home-repeater-remove" title="ลบ">ลบ</button>
        </div>`;
      })
      .join('');
    return `<div class="home-repeater" data-repeater="${esc(arrayName)}">
      <div class="home-repeater__head"><strong>${esc(labels._title || 'รายการ')}</strong>
        <button type="button" class="btn btn--ghost btn--sm" data-repeater-add="${esc(arrayName)}">+ เพิ่ม</button>
      </div>
      <div class="home-repeater__rows">${rows}</div>
    </div>`;
  }

  function formHero(c) {
    return (
      headingFields(c, { h2: false, lead: false }) +
      field('ข้อความใต้หัวข้อ', 'copy', c.copy || '', { type: 'textarea', rows: 2, full: true }) +
      repeaterHtml('h1Spans', c.h1Spans || [''], ['line'], {
        _title: 'บรรทัดหัวข้อใหญ่ (H1)',
        line: 'ข้อความบรรทัดนี้',
      })
    );
  }

  function formHeadingSimple(c) {
    return headingFields(c);
  }

  function formProductCategories(c) {
    return (
      field('หัวข้อส่วน', 'h2', c.h2 || '', { half: true }) +
      repeaterHtml('chips', c.chips || [{}], ['label', 'href', 'image'], {
        _title: 'ชิปหมวดประกัน',
        label: 'ชื่อที่แสดง',
        href: 'ลิงก์ (เช่น life-insurance.html)',
        image: 'รูปไอคอน (assets/...)',
      })
    );
  }

  function formIntro(c) {
    return (
      headingFields(c) +
      mediaField('รูปภาพ', 'imageSrc', c.imageSrc || '') +
      field('คำอธิบายรูป (Alt)', 'imageAlt', c.imageAlt || '', { full: true }) +
      repeaterHtml('tags', c.tags || [{}], ['title'], {
        _title: 'จุดเด่น (แท็ก)',
        title: 'ข้อความ',
      })
    );
  }

  function formProcess(c) {
    return (
      headingFields({ ...c, h2: c.h2 }, { lead: false }) +
      field('ข้อความอธิบาย', 'copy', c.copy || '', { type: 'textarea', rows: 2, full: true }) +
      field('ข้อความปุ่ม', 'linkText', c.linkText || '', { half: true }) +
      field('ลิงก์ปุ่ม', 'linkHref', c.linkHref || 'contact.html', { half: true }) +
      repeaterHtml('steps', c.steps || [{}], ['num', 'title', 'desc'], {
        _title: 'ขั้นตอน',
        num: 'เลข (01)',
        title: 'หัวข้อ',
        desc: 'รายละเอียด',
      })
    );
  }

  function formLinkBlock(c) {
    return (
      headingFields(c) +
      field('ข้อความปุ่ม', 'moreText', c.moreText || '', { half: true }) +
      field('URL', 'moreHref', c.moreHref || '', { half: true })
    );
  }

  function formCta(c) {
    return (
      headingFields({ ...c, h2: c.h2 }, { lead: false }) +
      field('ข้อความเพิ่มเติม', 'copy', c.copy || '', { type: 'textarea', rows: 2, full: true }) +
      field('ข้อความปุ่ม', 'buttonText', c.buttonText || '', { half: true }) +
      field('ลิงก์ปุ่ม', 'buttonHref', c.buttonHref || 'contact.html', { half: true })
    );
  }

  const FORM_BUILDERS = {
    hero: formHero,
    solutionsHeading: formHeadingSimple,
    productCategories: formProductCategories,
    intro: formIntro,
    process: formProcess,
    taxPlansHeading: formHeadingSimple,
    testimonials: formHeadingSimple,
    homeArticles: formLinkBlock,
    homeCareers: formLinkBlock,
    ctaBand: formCta,
  };

  function formHtml(sectionKey, config) {
    const c = config && typeof config === 'object' ? config : {};
    const meta = SECTION_META[sectionKey] || { title: sectionKey, hint: '' };
    const build = FORM_BUILDERS[sectionKey];
    const body = build
      ? build(c)
      : `<p class="form-hint">ยังไม่มีฟอร์มสำหรับส่วนนี้ — ใช้โหมด JSON ด้านล่าง</p>`;
    const jsonAdvanced = `<details class="home-advanced">
      <summary>JSON (ผู้เชี่ยวชาญ)</summary>
      ${field('', '_json', JSON.stringify(c, null, 2), { type: 'textarea', rows: 6, full: true })}
    </details>`;
    return `<div class="home-section-form" data-section-form="${esc(sectionKey)}">
      <p class="home-form-hint">${esc(meta.hint)}</p>
      <div class="home-form-grid">${body}</div>
      ${jsonAdvanced}
    </div>`;
  }

  function readField(card, name) {
    const el = card.querySelector(`[data-field="${name}"]`);
    if (!el) return '';
    return el.value.trim();
  }

  function readRepeater(card, arrayName, fields, asStrings) {
    const rows = card.querySelectorAll(`[data-repeater="${arrayName}"] [data-repeater-item]`);
    return Array.from(rows)
      .map((row) => {
        if (asStrings) {
          const line = row.querySelector('[data-field="line"]');
          return line ? line.value.trim() : '';
        }
        const item = {};
        fields.forEach((f) => {
          const el = row.querySelector(`[data-field="${f}"]`);
          item[f] = el ? el.value.trim() : '';
        });
        return item;
      })
      .filter((item) => (asStrings ? item : Object.values(item).some((v) => v)));
  }

  function readConfig(sectionKey, card, existingConfig) {
    const jsonEl = card.querySelector('[data-field="_json"]');
    const advancedOpen = card.querySelector('.home-advanced[open]');
    if (jsonEl && advancedOpen) {
      try {
        return JSON.parse(jsonEl.value);
      } catch {
        throw new Error('JSON ในโหมดผู้ดูแลไม่ถูกต้อง');
      }
    }

    const build = FORM_BUILDERS[sectionKey];
    if (!build) {
      if (jsonEl) {
        try {
          return JSON.parse(jsonEl.value);
        } catch {
          throw new Error('JSON ไม่ถูกต้อง');
        }
      }
      return {};
    }

    switch (sectionKey) {
      case 'hero': {
        const hero = {
          eyebrow: readField(card, 'eyebrow'),
          h1Spans: readRepeater(card, 'h1Spans', ['line'], true),
          copy: readField(card, 'copy'),
        };
        if (existingConfig?.slides) hero.slides = existingConfig.slides;
        return hero;
      }
      case 'solutionsHeading':
      case 'taxPlansHeading':
      case 'testimonials':
        return {
          eyebrow: readField(card, 'eyebrow'),
          h2: readField(card, 'h2'),
          lead: readField(card, 'lead'),
          ...(sectionKey === 'taxPlansHeading' ? { sidebarLabel: readField(card, 'sidebarLabel') } : {}),
        };
      case 'productCategories':
        return {
          h2: readField(card, 'h2'),
          chips: readRepeater(card, 'chips', ['label', 'href', 'image']),
        };
      case 'intro':
        return {
          eyebrow: readField(card, 'eyebrow'),
          h2: readField(card, 'h2'),
          lead: readField(card, 'lead'),
          imageSrc: readField(card, 'imageSrc'),
          imageAlt: readField(card, 'imageAlt'),
          tags: readRepeater(card, 'tags', ['title']),
        };
      case 'process':
        return {
          eyebrow: readField(card, 'eyebrow'),
          h2: readField(card, 'h2'),
          copy: readField(card, 'copy'),
          linkText: readField(card, 'linkText'),
          linkHref: readField(card, 'linkHref'),
          steps: readRepeater(card, 'steps', ['num', 'title', 'desc']),
        };
      case 'homeArticles':
      case 'homeCareers':
        return {
          eyebrow: readField(card, 'eyebrow'),
          h2: readField(card, 'h2'),
          lead: readField(card, 'lead'),
          moreText: readField(card, 'moreText'),
          moreHref: readField(card, 'moreHref'),
        };
      case 'ctaBand':
        return {
          eyebrow: readField(card, 'eyebrow'),
          h2: readField(card, 'h2'),
          copy: readField(card, 'copy'),
          buttonText: readField(card, 'buttonText'),
          buttonHref: readField(card, 'buttonHref'),
        };
      default:
        return jsonEl ? JSON.parse(jsonEl.value) : {};
    }
  }

  function bindRepeater(card) {
    card.querySelectorAll('[data-repeater-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.repeaterAdd;
        const wrap = card.querySelector(`[data-repeater="${name}"] .home-repeater__rows`);
        const proto = card.querySelector(`[data-repeater="${name}"] .home-repeater-row`);
        if (!wrap || !proto) return;
        const clone = proto.cloneNode(true);
        clone.querySelectorAll('input').forEach((inp) => {
          inp.value = '';
        });
        wrap.appendChild(clone);
      });
    });
    card.addEventListener('click', (e) => {
      const rm = e.target.closest('.home-repeater-remove');
      if (!rm) return;
      const row = rm.closest('[data-repeater-item]');
      const rep = rm.closest('[data-repeater]');
      const rows = rep?.querySelectorAll('[data-repeater-item]');
      if (row && rows && rows.length > 1) row.remove();
    });
  }

  global.HomeSectionForms = {
    meta: SECTION_META,
    formHtml,
    readConfig,
    bindRepeater,
    bindMediaPick(card, openMediaPicker) {
      card.querySelectorAll('[data-media-pick-field]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const field = btn.dataset.mediaPickField;
          openMediaPicker((path) => {
            const el = card.querySelector(`[data-field="${field}"]`);
            if (el) el.value = path;
          });
        });
      });
    },
  };
})(window);
