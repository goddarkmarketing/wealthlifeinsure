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
      hint: 'เพิ่ม / ลบโปรไฟล์ทีมงานได้จากส่วน «โปรไฟล์ทีมงาน»',
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
    agents: {
      title: 'โปรไฟล์ทีมงาน',
      hint: 'แต่ละคนเป็นการ์ด — กดเปิดเพื่อแก้ไข แล้วบันทึกเพื่อขึ้นหน้าเกี่ยวกับเรา',
    },
    listingHeading: { title: 'หัวข้อรายการแผน', hint: 'ข้อความเหนือตาราง/การ์ดแผนประกัน' },
  };

  const DEFAULT_AGENT_BODY =
    'เราเชื่อว่าการทำประกันที่ดีไม่ใช่แค่เลือกแผนให้ถูกต้อง แต่ต้องมีทีมตัวแทนช่วยดูแลคำถาม เอกสาร และการเคลมหลังทำกรมธรรม์ — ไม่ปล่อยให้คุณต้องจัดการกับศูนย์บริการเพียงช่องทางเดียว\n\nทีม Wealth Life Insure ใช้เทคโนโลยีช่วยอธิบายและติดตามงาน เพื่อให้ลูกค้าได้รับคำแนะนำที่ชัดเจนและบริการต่อเนื่องจริง ๆ';

  const DEFAULT_AGENTS = [
    {
      eyebrow: 'ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา',
      h2: 'คุณ จักรี น้อยดอนไพร (แต้ม)',
      photo: 'assets/profile/1c19a9f2-c428-4cec-bbd2-59b6e4993178.png',
      lead: 'สวัสดีครับ ผมแต้ม ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา ให้คำปรึกษาประกันชีวิต สุขภาพ การออม มรดก และลดหย่อนภาษี โดยเริ่มจากฟังเป้าหมายและงบประมาณจริงของคุณก่อน แล้วค่อยช่วยจัดลำดับแผนที่เหมาะ',
      body: DEFAULT_AGENT_BODY.replace('เราเชื่อ', 'ผมเชื่อ'),
      license: '6701031779',
      email: 'jugkreenoidonpri@gmail.com',
      phone: '087-046-7443',
      phoneTel: '0870467443',
      lineUrl: 'https://line.me/R/ti/p/~0870467443',
      facebookUrl: 'https://www.facebook.com/daddyTammomA',
      facebookLabel: 'facebook.com/daddyTammomA',
    },
    {
      eyebrow: 'ผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา',
      h2: 'คุณ เอ',
      photo: 'assets/profile/7f0ffeae-0f98-4d34-ae70-3c6266dc11e6.png',
      lead: 'สวัสดีค่ะ ดิฉันเอ ผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา ให้คำปรึกษาประกันชีวิต สุขภาพ การออม มรดก และลดหย่อนภาษี โดยเริ่มจากฟังเป้าหมายและงบประมาณจริงของคุณก่อน แล้วค่อยช่วยจัดลำดับแผนที่เหมาะ',
      body: DEFAULT_AGENT_BODY.replace('เราเชื่อ', 'ดิฉันเชื่อ'),
      license: '6701024924',
      email: '',
      phone: '083-451-5615',
      phoneTel: '0834515615',
      lineUrl: 'https://line.me/R/ti/p/~0834515615',
      facebookUrl: 'https://www.facebook.com/MomAThailife',
      facebookLabel: 'facebook.com/MomAThailife',
    },
  ];

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
      agent: DEFAULT_AGENTS[0],
      agent2: DEFAULT_AGENTS[1],
      agents: { items: DEFAULT_AGENTS },
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
    const cls = ['home-field', opts.full ? 'home-field--full' : '', opts.half ? 'home-field--half' : '']
      .filter(Boolean)
      .join(' ');
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

  function emptyAgent() {
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

  function normalizeAgent(raw) {
    const a = { ...emptyAgent(), ...(raw && typeof raw === 'object' ? raw : {}) };
    if (!a.phoneTel && a.phone) a.phoneTel = String(a.phone).replace(/\D+/g, '');
    if (!a.facebookLabel && a.facebookUrl) {
      a.facebookLabel = String(a.facebookUrl)
        .replace(/^https?:\/\/(www\.)?/i, '')
        .replace(/\/$/, '');
    }
    return a;
  }

  function agentsItemsFromConfig(config, byKey) {
    const stored = config && typeof config === 'object' ? config : {};
    if (Array.isArray(stored.items) && stored.items.length) {
      return stored.items.map(normalizeAgent);
    }
    const legacyA = stored.agent || byKey?.agent?.config || DEFAULT_AGENTS[0];
    const legacyB = stored.agent2 || byKey?.agent2?.config || DEFAULT_AGENTS[1];
    return [normalizeAgent(legacyA), normalizeAgent(legacyB)];
  }

  function photoPreviewSrc(path) {
    const p = String(path || '').trim();
    if (!p) return '';
    if (/^https?:\/\//i.test(p) || p.startsWith('data:')) return p;
    return `../../${p.replace(/^\//, '')}`;
  }

  function agentCardHtml(agent, index, opts = {}) {
    const a = normalizeAgent(agent);
    const open = opts.open === true;
    const title = a.h2 || 'โปรไฟล์ใหม่';
    const role = a.eyebrow || 'ยังไม่ระบุตำแหน่ง';
    const thumb = photoPreviewSrc(a.photo);
    const thumbHtml = thumb
      ? `<img class="agent-card__thumb-img" src="${esc(thumb)}" alt="" loading="lazy">`
      : `<span class="agent-card__thumb-placeholder" aria-hidden="true">+</span>`;

    return `<details class="agent-card" data-agent-item data-agent-index="${index}"${open ? ' open' : ''}>
      <summary class="agent-card__summary">
        <span class="agent-card__thumb">${thumbHtml}</span>
        <span class="agent-card__meta">
          <span class="agent-card__index">โปรไฟล์ ${index + 1}</span>
          <span class="agent-card__name" data-agent-summary-name>${esc(title)}</span>
          <span class="agent-card__role" data-agent-summary-role>${esc(role)}</span>
        </span>
        <span class="agent-card__chevron" aria-hidden="true"></span>
      </summary>
      <div class="agent-card__body">
        <div class="agent-card__actions">
          <button type="button" class="btn btn--ghost btn--sm btn--danger-ghost" data-agent-remove>ลบโปรไฟล์นี้</button>
        </div>

        <div class="agent-card__section">
          <h4 class="agent-card__section-title">1. ข้อมูลหลัก</h4>
          <div class="home-form-grid agent-card__grid">
            ${field('ชื่อที่แสดง', 'h2', a.h2, { full: true, hint: 'เช่น คุณ แต้ม' })}
            ${field('ตำแหน่ง', 'eyebrow', a.eyebrow, { full: true, hint: 'เช่น ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา' })}
            <div class="home-field home-field--full agent-card__photo-field">
              <label>รูปโปรไฟล์</label>
              <div class="agent-card__photo-row">
                <div class="agent-card__photo-preview" data-agent-photo-preview>
                  ${thumb
                    ? `<img src="${esc(thumb)}" alt="" loading="lazy">`
                    : `<span class="agent-card__photo-empty">ยังไม่มีรูป</span>`}
                </div>
                <div class="agent-card__photo-controls">
                  <div class="home-media-row">
                    <input type="text" data-field="photo" value="${esc(a.photo)}" placeholder="เลือกจากคลังหรือวาง path">
                    <button type="button" class="btn btn--ghost btn--sm" data-media-pick-field="photo">เลือกรูป</button>
                  </div>
                  <p class="form-hint">แนะนำรูปแนวตั้ง สัดส่วนใกล้ 3:4</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="agent-card__section">
          <h4 class="agent-card__section-title">2. ข้อความแนะนำ</h4>
          <div class="home-form-grid agent-card__grid">
            ${field('ย่อหน้าแรก', 'lead', a.lead, {
              type: 'textarea',
              rows: 3,
              full: true,
              hint: 'ข้อความแนะนำสั้น ๆ ด้านบนสุดของโปรไฟล์ (หน้าเกี่ยวกับเรา)',
            })}
            ${field('ข้อความเพิ่มเติม (ย่อหน้า 2, 3, …)', 'body', a.body, {
              type: 'textarea',
              rows: 5,
              full: true,
              hint: 'เช่น ข้อความ「ผมเชื่อว่า…」— คั่นแต่ละย่อหน้าด้วยบรรทัดว่าง',
            })}
          </div>
        </div>

        <div class="agent-card__section">
          <h4 class="agent-card__section-title">3. ช่องทางติดต่อ</h4>
          <div class="home-form-grid agent-card__grid">
            ${field('เลขใบอนุญาต', 'license', a.license, { half: true })}
            ${field('อีเมลรับฟอร์มติดต่อ', 'email', a.email, {
              half: true,
              hint: 'เมลแจ้งเตือนเมื่อลูกค้าเลือกตัวแทนคนนี้ — ว่างไว้จะส่งหาคุณแต้ม',
            })}
            ${field('เบอร์โทร', 'phone', a.phone, { half: true, hint: 'เช่น 087-046-7443' })}
            ${field('เบอร์สำหรับกดโทร (ตัวเลขล้วน)', 'phoneTel', a.phoneTel, {
              half: true,
              hint: 'ระบบเติมให้อัตโนมัติจากเบอร์โทร',
            })}
            ${field('ลิงก์ LINE', 'lineUrl', a.lineUrl, { full: true, hint: 'เช่น https://line.me/R/ti/p/~...' })}
            ${field('ลิงก์ Facebook', 'facebookUrl', a.facebookUrl, { full: true })}
            ${field('ข้อความแสดง Facebook', 'facebookLabel', a.facebookLabel, {
              full: true,
              hint: 'เช่น facebook.com/username',
            })}
          </div>
        </div>
      </div>
    </details>`;
  }

  function agentsForm(config, byKey) {
    const items = agentsItemsFromConfig(config, byKey);
    return `<div class="agent-profiles-editor" data-agents-repeater>
      <div class="agent-profiles-editor__intro">
        <p class="agent-profiles-editor__hint">แต่ละคนเป็นการ์ดหนึ่งใบ — กดเปิดการ์ดเพื่อแก้ไข กดปุ่มด้านล่างเพื่อเพิ่มคนใหม่</p>
        <p class="agent-profiles-editor__count" data-agent-count>${items.length} โปรไฟล์</p>
      </div>
      <div class="agent-profiles-editor__list" data-agent-list>
        ${items.map((item, i) => agentCardHtml(item, i)).join('')}
      </div>
      <div class="agent-profiles-editor__footer">
        <button type="button" class="btn btn--primary" data-agent-add>+ เพิ่มโปรไฟล์ทีมงาน</button>
      </div>
    </div>`;
  }

  function readOneAgent(card) {
    const g = (name) => card.querySelector(`[data-field="${name}"]`)?.value?.trim() || '';
    return normalizeAgent({
      eyebrow: g('eyebrow'),
      h2: g('h2'),
      photo: g('photo'),
      lead: g('lead'),
      body: g('body'),
      license: g('license'),
      email: g('email'),
      phone: g('phone'),
      phoneTel: g('phoneTel'),
      lineUrl: g('lineUrl'),
      facebookUrl: g('facebookUrl'),
      facebookLabel: g('facebookLabel'),
    });
  }

  function updateAgentCardSummary(card) {
    if (!card) return;
    const name = card.querySelector('[data-field="h2"]')?.value?.trim() || 'โปรไฟล์ใหม่';
    const role = card.querySelector('[data-field="eyebrow"]')?.value?.trim() || 'ยังไม่ระบุตำแหน่ง';
    const photo = card.querySelector('[data-field="photo"]')?.value?.trim() || '';
    const nameEl = card.querySelector('[data-agent-summary-name]');
    const roleEl = card.querySelector('[data-agent-summary-role]');
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role;

    const src = photoPreviewSrc(photo);
    const thumb = card.querySelector('.agent-card__thumb');
    if (thumb) {
      thumb.innerHTML = src
        ? `<img class="agent-card__thumb-img" src="${esc(src)}" alt="" loading="lazy">`
        : `<span class="agent-card__thumb-placeholder" aria-hidden="true">+</span>`;
    }
    const preview = card.querySelector('[data-agent-photo-preview]');
    if (preview) {
      preview.innerHTML = src
        ? `<img src="${esc(src)}" alt="" loading="lazy">`
        : `<span class="agent-card__photo-empty">ยังไม่มีรูป</span>`;
    }
  }

  function reindexAgentCards(list) {
    const cards = list.querySelectorAll('[data-agent-item]');
    cards.forEach((card, i) => {
      card.dataset.agentIndex = String(i);
      const idx = card.querySelector('.agent-card__index');
      if (idx) idx.textContent = `โปรไฟล์ ${i + 1}`;
      updateAgentCardSummary(card);
    });
    const countEl = list.closest('[data-agents-repeater]')?.querySelector('[data-agent-count]');
    if (countEl) countEl.textContent = `${cards.length} โปรไฟล์`;
  }

  function bindAgentsRepeater(root) {
    const wrap = root.querySelector('[data-agents-repeater]');
    if (!wrap || wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';
    const list = wrap.querySelector('[data-agent-list]');

    const addAgent = () => {
      if (!list) return;
      list.querySelectorAll('details.agent-card[open]').forEach((d) => {
        d.open = false;
      });
      const idx = list.querySelectorAll('[data-agent-item]').length;
      list.insertAdjacentHTML('beforeend', agentCardHtml(emptyAgent(), idx, { open: true }));
      reindexAgentCards(list);
      const last = list.querySelector('[data-agent-item]:last-child');
      if (root._openMediaPicker) {
        global.PageSectionForms.bindMediaPick(last || root, root._openMediaPicker);
      }
      last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      last?.querySelector('[data-field="h2"]')?.focus();
    };

    wrap.querySelectorAll('[data-agent-add]').forEach((btn) => {
      btn.addEventListener('click', addAgent);
    });

    wrap.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-agent-remove]');
      if (!rm || !list) return;
      e.preventDefault();
      const cards = list.querySelectorAll('[data-agent-item]');
      if (cards.length <= 1) {
        window.alert('ต้องมีอย่างน้อย 1 โปรไฟล์');
        return;
      }
      if (!window.confirm('ลบโปรไฟล์นี้หรือไม่?')) return;
      rm.closest('[data-agent-item]')?.remove();
      reindexAgentCards(list);
    });

    wrap.addEventListener('input', (e) => {
      const fieldEl = e.target.closest('[data-field]');
      if (!fieldEl) return;
      const card = fieldEl.closest('[data-agent-item]');
      if (!card) return;
      if (fieldEl.dataset.field === 'phone') {
        const telEl = card.querySelector('[data-field="phoneTel"]');
        if (telEl && (!telEl.dataset.touched || telEl.value.trim() === '')) {
          telEl.value = fieldEl.value.replace(/\D+/g, '');
        }
      }
      if (fieldEl.dataset.field === 'phoneTel') fieldEl.dataset.touched = '1';
      if (fieldEl.dataset.field === 'facebookUrl') {
        const labelEl = card.querySelector('[data-field="facebookLabel"]');
        if (labelEl && (!labelEl.dataset.touched || labelEl.value.trim() === '')) {
          labelEl.value = fieldEl.value
            .replace(/^https?:\/\/(www\.)?/i, '')
            .replace(/\/$/, '');
        }
      }
      if (fieldEl.dataset.field === 'facebookLabel') fieldEl.dataset.touched = '1';
      updateAgentCardSummary(card);
    });

    wrap.addEventListener(
      'toggle',
      (e) => {
        const card = e.target.closest('details.agent-card');
        if (!card || !card.open || !list) return;
        list.querySelectorAll('details.agent-card[open]').forEach((d) => {
          if (d !== card) d.open = false;
        });
      },
      true
    );
  }

  function mergeAboutAgentsConfig(byKey) {
    return { items: agentsItemsFromConfig(byKey?.agents?.config || {}, byKey) };
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

  function sectionForm(pageKey, sectionKey, config, byKey) {
    const c = config || {};
    if (sectionKey === 'hero') return heroForm(c, pageKey);
    if (sectionKey === 'followup') {
      return field('ข้อความ', 'text', c.text || '', { type: 'textarea', rows: 4, full: true });
    }
    if (sectionKey === 'agents') return agentsForm(c, byKey);
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
      const cards = Array.from(root.querySelectorAll('[data-agent-item]'));
      const items = cards
        .map((card) => readOneAgent(card))
        .filter((a) => a.h2 || a.lead || a.photo || a.body || a.license || a.phone);
      if (cards.length > items.length) {
        window.alert(
          'มีโปรไฟล์ที่ยังไม่ได้ใส่ชื่อ/รูป/ข้อความ — ระบบจะไม่บันทึกการ์ดว่าง\nกรุณาใส่ชื่อที่แสดงอย่างน้อย 1 ช่องก่อนบันทึก'
        );
      }
      return { items: items.length ? items : [emptyAgent()] };
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
        c = mergeAboutAgentsConfig(byKey || { agents: { config } });
      } else {
        c = mergeConfig(pageKey, sectionKey, config);
      }
      const body = sectionForm(pageKey, sectionKey, c, byKey);
      if (pageKey === 'about' && sectionKey === 'agents') {
        return `<div class="home-section-form">${body}</div>`;
      }
      return `<div class="home-section-form"><div class="home-form-grid">${body}</div></div>`;
    },
    readConfig(pageKey, sectionKey, root) {
      return readSectionForm(pageKey, sectionKey, root);
    },
    bindAgentsRepeater,
    bindMediaPick(root, openPicker) {
      if (root) root._openMediaPicker = openPicker;
      root.querySelectorAll('[data-media-pick-field]').forEach((btn) => {
        if (btn.dataset.boundPick === '1') return;
        btn.dataset.boundPick = '1';
        btn.addEventListener('click', () => {
          const fieldName = btn.dataset.mediaPickField;
          openPicker((path) => {
            const scope = btn.closest('[data-agent-item]') || root;
            const el = scope.querySelector(`[data-field="${fieldName}"]`);
            if (el) {
              el.value = path;
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
        });
      });
    },
  };
})(window);
