/**
 * ฟอร์มแก้ไขหน้าย่อย (เกี่ยวกับเรา / แบบประกัน / ข่าว / อาชีพ)
 */
(function (global) {
  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  const PAGE_META = {
    about: {
      label: 'เกี่ยวกับเรา',
      hint: 'แก้โปรไฟล์ตัวแทนทั้งคุณแต้มและคุณเอได้จากส่วนด้านล่าง',
    },
    insurance: {
      label: 'แบบประกัน',
      hint: 'รายการแผนประกันมาจากเมนู «แผนประกัน»',
    },
    news: {
      label: 'ข่าวสารและบทความ',
      hint: 'รายการบทความมาจากเมนู «บทความ»',
    },
    careers: {
      label: 'แนะนำอาชีพ',
      hint: 'รายการหน้าอาชีพมาจากเมนู «บทความ» → แท็บ หน้าอาชีพ',
    },
  };

  const SECTION_META = {
    hero: { title: 'ส่วนหัว (Hero)', hint: 'ข้อความด้านบนสุดของหน้า' },
    followup: { title: 'ข้อความใต้สไลด์', hint: 'ย่อหน้าใต้ภาพ Hero หน้าเกี่ยวกับเรา' },
    agent: { title: 'โปรไฟล์ตัวแทน (คุณแต้ม)', hint: 'ข้อมูลผู้บริหารศูนย์คนแรก' },
    agent2: { title: 'โปรไฟล์ตัวแทน (คุณเอ)', hint: 'ข้อมูลผู้บริหารหน่วยคนที่สอง' },
    agents: { title: 'โปรไฟล์ตัวแทน', hint: 'แก้ไขโปรไฟล์คุณแต้มและคุณเอในส่วนเดียวกัน' },
    listingHeading: { title: 'หัวข้อรายการแผน', hint: 'ข้อความเหนืนตาราง/การ์ดแผนประกัน' },
  };

  /** ค่าเริ่มต้นจากหน้าเว็บ — ใช้เมื่อ DB ยังว่างหรือ import เก่า */
  const DEFAULT_CONFIG = {
    about: {
      hero: {
        eyebrow: 'Thai Life Insurance Bangna',
        h1: 'ทีมงาน FSEG Wealth ตัวแทนไทยประกันชีวิต',
        lead: 'Wealth Life Insure ดูแลโดยทีมผู้บริหารศูนย์และผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา ให้คำแนะนำทั้งประกันชีวิต สุขภาพ ออมทรัพย์ มรดก และลดหย่อนภาษี',
      },
      followup: {
        text: 'เราคือทีมงานตัวแทนไทยประกันชีวิต คนรุ่นใหม่ที่โดดเด่นด้านเทคโนโลยีและเชี่ยวชาญการวางแผนการเงิน เพื่อช่วยให้ลูกค้าบรรลุเป้าหมายทางการเงิน และสร้างที่ปรึกษามืออาชีพมาตรฐานระดับสากล คุณวุฒิ MDRT — ฟังก่อน แนะนำทีหลัง และช่วยดูแลเรื่องเอกสารและเคลมหลังทำกรมธรรม์',
      },
      agent: {
        eyebrow: 'ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา',
        h2: 'คุณ จักรี น้อยดอนไพร (แต้ม)',
        photo: 'assets/profile/1c19a9f2-c428-4cec-bbd2-59b6e4993178.png',
        lead: 'สวัสดีครับ ผมแต้ม ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา ให้คำปรึกษาประกันชีวิต สุขภาพ การออม มรดก และลดหย่อนภาษี โดยเริ่มจากฟังเป้าหมายและงบประมาณจริงของคุณก่อน แล้วค่อยช่วยจัดลำดับแผนที่เหมาะ',
        license: '6701031779',
      },
      agent2: {
        eyebrow: 'ผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา',
        h2: 'คุณ เอ',
        photo: 'assets/profile/7f0ffeae-0f98-4d34-ae70-3c6266dc11e6.png',
        lead: 'สวัสดีค่ะ ดิฉันเอ ผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา ให้คำปรึกษาประกันชีวิต สุขภาพ การออม มรดก และลดหย่อนภาษี โดยเริ่มจากฟังเป้าหมายและงบประมาณจริงของคุณก่อน แล้วค่อยช่วยจัดลำดับแผนที่เหมาะ',
        license: '6701024924',
      },
    },
    insurance: {
      hero: {
        eyebrow: 'Thai Life Insurance plans',
        h1: 'แบบประกันแนะนำจากไทยประกันชีวิต',
        copy: 'รวมแผนที่ตอบโจทย์ทั้งความคุ้มครองชีวิต สุขภาพ ค่ารักษา เงินออม มรดก และสิทธิลดหย่อนภาษี โดยทีมงานช่วยอธิบายเงื่อนไขให้เข้าใจง่ายก่อนตัดสินใจ',
      },
      listingHeading: {
        eyebrow: 'แบบประกันแนะนำ',
        h2: 'แผนหลักจากข้อมูลแบบประกันที่เหมาะกับหลายช่วงชีวิต',
        lead: '',
      },
    },
    news: {
      hero: {
        eyebrow: 'News & Articles',
        h1: 'ข่าวสารและบทความ',
        copy: 'รวมบทความและข่าวสารเกี่ยวกับประกันชีวิต สุขภาพ การออม ลดหย่อนภาษี และการวางแผนทางการเงิน',
      },
    },
    careers: {
      hero: {
        eyebrow: '',
        h1: 'แนะนำอาชีพตัวแทนไทยประกันชีวิต',
        copy: '',
        imageSrc: 'assets/career/career-hero.png',
      },
    },
  };

  function mergeConfig(pageKey, sectionKey, config) {
    const base = DEFAULT_CONFIG[pageKey]?.[sectionKey] || {};
    const c = config && typeof config === 'object' ? config : {};
    const out = { ...base };
    Object.entries(c).forEach(([k, v]) => {
      if (v !== '' && v != null) out[k] = v;
    });
    return out;
  }

  function field(label, name, value, opts = {}) {
    const type = opts.type || 'text';
    const cls = ['home-field', opts.full ? 'home-field--full' : ''].filter(Boolean).join(' ');
    const hint = opts.hint ? `<p class="form-hint">${esc(opts.hint)}</p>` : '';
    if (type === 'textarea') {
      return `<div class="${cls}">
        <label>${esc(label)}</label>
        <textarea data-field="${esc(name)}" rows="${opts.rows || 3}">${esc(value)}</textarea>
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

  function agentFields(prefix, c) {
    return [
      field('Eyebrow', `${prefix}.eyebrow`, c.eyebrow || '', { full: true }),
      field('ชื่อ (H2)', `${prefix}.h2`, c.h2 || '', { full: true }),
      mediaField('รูปโปรไฟล์', `${prefix}.photo`, c.photo || ''),
      field('ข้อความแนะนำ', `${prefix}.lead`, c.lead || '', { type: 'textarea', rows: 4, full: true }),
      field('เลขใบอนุญาต', `${prefix}.license`, c.license || '', { full: true }),
    ].join('');
  }

  function agentsForm(config) {
    const agent = mergeConfig('about', 'agent', config?.agent || {});
    const agent2 = mergeConfig('about', 'agent2', config?.agent2 || {});
    return [
      '<div class="agent-profile-editor">',
      '<p class="agent-profile-editor__label">คุณแต้ม — ผู้บริหารศูนย์</p>',
      '<div class="home-form-grid">',
      agentFields('agent', agent),
      '</div></div>',
      '<div class="agent-profile-editor agent-profile-editor--second">',
      '<p class="agent-profile-editor__label">คุณเอ — ผู้บริหารหน่วย</p>',
      '<div class="home-form-grid">',
      agentFields('agent2', agent2),
      '</div></div>',
    ].join('');
  }

  function readAgentFields(root, prefix) {
    return {
      eyebrow: root.querySelector(`[data-field="${prefix}.eyebrow"]`)?.value?.trim() || '',
      h2: root.querySelector(`[data-field="${prefix}.h2"]`)?.value?.trim() || '',
      photo: root.querySelector(`[data-field="${prefix}.photo"]`)?.value?.trim() || '',
      lead: root.querySelector(`[data-field="${prefix}.lead"]`)?.value?.trim() || '',
      license: root.querySelector(`[data-field="${prefix}.license"]`)?.value?.trim() || '',
    };
  }

  function mergeAboutAgentsConfig(byKey) {
    const stored = byKey?.agents?.config || {};
    return {
      agent: mergeConfig('about', 'agent', { ...(byKey?.agent?.config || {}), ...(stored.agent || {}) }),
      agent2: mergeConfig('about', 'agent2', { ...(byKey?.agent2?.config || {}), ...(stored.agent2 || {}) }),
    };
  }

  function heroForm(c, pageKey) {
    const leadField = pageKey === 'about' ? 'lead' : 'copy';
    const parts = [
      field('Eyebrow', 'eyebrow', c.eyebrow || '', { full: true }),
      field('หัวข้อหลัก (H1)', 'h1', c.h1 || '', { full: true }),
      field('คำอธิบาย', leadField, c[leadField] || c.copy || c.lead || '', {
        type: 'textarea',
        rows: 3,
        full: true,
      }),
    ];
    if (pageKey === 'careers') {
      parts.push(mediaField('รูป Hero', 'imageSrc', c.imageSrc || 'assets/career/career-hero.png'));
    }
    return parts.join('');
  }

  function sectionForm(pageKey, sectionKey, config) {
    const c = config || {};
    if (sectionKey === 'hero') return heroForm(c, pageKey);
    if (sectionKey === 'followup') {
      return field('ข้อความ', 'text', c.text || '', { type: 'textarea', rows: 4, full: true });
    }
    if (sectionKey === 'agents') {
      return agentsForm(c);
    }
    if (sectionKey === 'agent' || sectionKey === 'agent2') {
      return [
        field('Eyebrow', 'eyebrow', c.eyebrow || '', { full: true }),
        field('ชื่อ (H2)', 'h2', c.h2 || '', { full: true }),
        mediaField('รูปโปรไฟล์', 'photo', c.photo || ''),
        field('ข้อความแนะนำ', 'lead', c.lead || '', { type: 'textarea', rows: 4, full: true }),
        field('เลขใบอนุญาต', 'license', c.license || '', { full: true }),
      ].join('');
    }
    if (sectionKey === 'listingHeading') {
      return [
        field('Eyebrow', 'eyebrow', c.eyebrow || '', { full: true }),
        field('หัวข้อ (H2)', 'h2', c.h2 || '', { full: true }),
        field('คำอธิบาย', 'lead', c.lead || '', { type: 'textarea', rows: 2, full: true }),
      ].join('');
    }
    return field('JSON config', 'json', JSON.stringify(c, null, 2), { type: 'textarea', rows: 6, full: true });
  }

  function readSectionForm(pageKey, sectionKey, root) {
    if (sectionKey === 'hero') {
      const leadField = pageKey === 'about' ? 'lead' : 'copy';
      const out = {
        eyebrow: root.querySelector('[data-field="eyebrow"]')?.value?.trim() || '',
        h1: root.querySelector('[data-field="h1"]')?.value?.trim() || '',
      };
      out[leadField] = root.querySelector(`[data-field="${leadField}"]`)?.value?.trim() || '';
      if (pageKey === 'careers') {
        out.imageSrc = root.querySelector('[data-field="imageSrc"]')?.value?.trim() || '';
      }
      return out;
    }
    if (sectionKey === 'followup') {
      return { text: root.querySelector('[data-field="text"]')?.value?.trim() || '' };
    }
    if (sectionKey === 'agents') {
      return {
        agent: readAgentFields(root, 'agent'),
        agent2: readAgentFields(root, 'agent2'),
      };
    }
    if (sectionKey === 'agent' || sectionKey === 'agent2') {
      return {
        eyebrow: root.querySelector('[data-field="eyebrow"]')?.value?.trim() || '',
        h2: root.querySelector('[data-field="h2"]')?.value?.trim() || '',
        photo: root.querySelector('[data-field="photo"]')?.value?.trim() || '',
        lead: root.querySelector('[data-field="lead"]')?.value?.trim() || '',
        license: root.querySelector('[data-field="license"]')?.value?.trim() || '',
      };
    }
    if (sectionKey === 'listingHeading') {
      return {
        eyebrow: root.querySelector('[data-field="eyebrow"]')?.value?.trim() || '',
        h2: root.querySelector('[data-field="h2"]')?.value?.trim() || '',
        lead: root.querySelector('[data-field="lead"]')?.value?.trim() || '',
      };
    }
    try {
      return JSON.parse(root.querySelector('[data-field="json"]')?.value || '{}');
    } catch {
      throw new Error('JSON ไม่ถูกต้อง');
    }
  }

  const PAGE_SECTIONS = {
    about: ['hero', 'followup', 'agents'],
    insurance: ['hero', 'listingHeading'],
    news: ['hero'],
    careers: ['hero'],
  };

  global.PageSectionForms = {
    pages: PAGE_META,
    sectionsFor(pageKey) {
      return PAGE_SECTIONS[pageKey] || ['hero'];
    },
    sectionMeta: SECTION_META,
    mergeAboutAgentsConfig,
    formHtml(pageKey, sectionKey, config, byKey) {
      let c = config;
      if (pageKey === 'about' && sectionKey === 'agents') {
        c = mergeAboutAgentsConfig(byKey || {});
      } else {
        c = mergeConfig(pageKey, sectionKey, config);
      }
      const body = sectionForm(pageKey, sectionKey, c);
      if (pageKey === 'about' && sectionKey === 'agents') {
        return `<div class="home-section-form">${body}</div>`;
      }
      return `<div class="home-section-form"><div class="home-form-grid">${body}</div></div>`;
    },
    readConfig(pageKey, sectionKey, root) {
      return readSectionForm(pageKey, sectionKey, root);
    },
    bindMediaPick(root, openPicker) {
      root.querySelectorAll('[data-media-pick-field]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const fieldName = btn.dataset.mediaPickField;
          openPicker((path) => {
            const el = root.querySelector(`[data-field="${fieldName}"]`);
            if (el) el.value = path;
          });
        });
      });
    },
  };
})(window);

