/**
 * Form Builder หน้าแบบประกัน (ประกันชีวิต / สุขภาพ / ออมทรัพย์)
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function uid() {
    return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  const SECTION_KEYS = ['hero', 'whoFor', 'planCards', 'recommendation', 'cta', 'bottomBanners'];

  const SECTION_META = {
    hero: { title: '1. ส่วนหัวหน้าแบบประกัน', hint: 'หมวดหมู่ ชื่อแผน คำอธิบาย และพื้นหลัง' },
    whoFor: { title: '2. ส่วนเหมาะกับใคร', hint: 'กล่องสรุปด้านซ้ายของรายละเอียดแผน' },
    planCards: { title: '3. ส่วนรายละเอียดแบบประกัน', hint: 'การ์ดแผน — เพิ่ม ลบ คัดลอก และลากเรียงได้' },
    recommendation: { title: '4. ส่วนข้อความแนะนำ', hint: 'ข้อความแนะนำเพิ่มเติมใต้การ์ดแผน' },
    cta: { title: '5. ส่วน Call to Action', hint: 'ปุ่มชวนติดต่อและพื้นหลัง' },
    bottomBanners: { title: '6. ส่วน Banner ด้านล่าง', hint: 'รูปแบนเนอร์คู่ด้านล่างหน้า' },
  };

  const PAGES = {
    lifeInsurance: {
      label: 'ประกันชีวิตและมรดก',
      file: 'life-insurance.html',
      categoryName: 'ประกันชีวิตและมรดก',
    },
    healthInsurance: {
      label: 'ประกันสุขภาพ',
      file: 'health-insurance.html',
      categoryName: 'ประกันสุขภาพ',
    },
    savingsRetirement: {
      label: 'ออมทรัพย์และเกษียณ',
      file: 'savings-retirement.html',
      categoryName: 'ออมทรัพย์และเกษียณ',
    },
  };

  const DEFAULTS = {
    lifeInsurance: {
      hero: {
        categoryLabel: 'Life & legacy protection',
        h1: 'ประกันชีวิตเพื่อสร้างหลักประกันและกองทุนมรดก',
        copy: 'รวมแผนเลกาซี ฟิต แคร์ 99/10 และคุ้มธนกิจ 99/20 สำหรับคนที่ต้องการดูแลครอบครัว วางแผนค่ารักษาในวัยเกษียณ และใช้สิทธิลดหย่อนภาษี',
        bgType: 'color',
        bgColor: '',
        bgImage: '',
      },
      whoFor: {
        h2: 'เหมาะกับใคร',
        text: 'ผู้ที่ต้องการสร้างหลักประกันให้ครอบครัว วางแผนดูแลตัวเองในยามเกษียณ สร้างกองทุนมรดก หรือใช้สิทธิลดหย่อนภาษี',
        boxBgColor: '',
      },
      planCards: {
        cards: [
          {
            id: 'legacy-fit-care-99-10',
            title: 'เลกาซี ฟิต แคร์ 99/10',
            anchorId: 'legacy-fit-care-99-10',
            type: 'checklist',
            bullets: [
              'เปลี่ยนวงเงินคุ้มครองเป็นค่ารักษาพยาบาลในวัยเกษียณได้ ตั้งแต่วันครบรอบปีกรมธรรม์ที่อายุ 60-99 ปี ทั้งผู้ป่วยในและผู้ป่วยนอก',
              'ชำระเบี้ยเพียง 10 ปี คุ้มครองนานถึงอายุ 99 ปี และเบี้ยประกันภัยคงที่ ไม่ปรับเพิ่มตามอายุ',
              'รับเงินก้อน 100% เมื่อครบกำหนดสัญญา หรือกรณีเสียชีวิต',
              'สร้างสวัสดิการเพิ่มได้ด้วยสัญญาเพิ่มเติม เช่น สุขภาพ อุบัติเหตุ และโรคร้ายแรง',
              'เบี้ยประกันภัยสามารถลดหย่อนภาษีได้สูงสุด 100,000 บาทต่อปี',
            ],
            icon: '',
            image: '',
            videoUrl: '',
            buttonText: '',
            buttonHref: '',
          },
          {
            id: 'khumthanakit-99-20-nn',
            title: 'คุ้มธนกิจ 99/20 (Nn)',
            anchorId: 'khumthanakit-99-20-nn',
            type: 'checklist',
            bullets: [
              'เป็นแผนประกันชีวิตหลักสำหรับสร้างกองทุนมรดกและหลักประกันที่มั่นคงให้ครอบครัว',
              'กรณีเสียชีวิต หรือครบกำหนดสัญญา รับเงินก้อน 100%',
              'ชำระเบี้ยเพียง 20 ปี ให้ความคุ้มครองถึงอายุ 99 ปี',
              'จำนวนเงินเอาประกันภัยตั้งแต่ 500,000 บาทขึ้นไป มีส่วนลดเบี้ยประกันภัย',
              'เบี้ยประกันชีวิตสามารถลดหย่อนภาษีได้สูงสุด 100,000 บาทต่อปี',
            ],
            icon: '',
            image: '',
            videoUrl: '',
            buttonText: '',
            buttonHref: '',
          },
        ],
      },
      recommendation: {
        h2: 'ใครควรพิจารณาแผนกลุ่มนี้',
        body: 'เหมาะกับผู้ที่ต้องการหลักประกันรายได้ให้คนที่รักในวันที่จากไป ต้องการความคุ้มครองชีวิตระยะยาว ต้องการดูแลตัวเองในวัยเกษียณ และต้องการใช้สิทธิลดหย่อนภาษีควบคู่กัน',
      },
      cta: {
        eyebrow: 'Plan your protection',
        h2: 'อยากรู้ว่าเลกาซี ฟิต แคร์ หรือคุ้มธนกิจเหมาะกับคุณมากกว่า',
        copy: 'ส่งข้อมูลเป้าหมายและงบประมาณ ทีมงานจะช่วยดูว่าควรเน้นค่ารักษาในวัยเกษียณ มรดก หรือความคุ้มครองชีวิตระยะยาว',
        buttonText: 'นัดปรึกษาแผนชีวิต',
        buttonHref: 'contact.html',
        bgColor: '',
        bgImage: '',
        videoUrl: '',
      },
      bottomBanners: {
        banners: [
          { id: uid(), image: 'assets/promo/banner-join-team.png', href: 'careers.html', alt: 'สนใจร่วมงานกับเรา' },
          { id: uid(), image: 'assets/promo/banner-insurance.png', href: 'contact.html', alt: 'สนใจทำประกัน' },
        ],
      },
    },
    healthInsurance: {
      hero: {
        categoryLabel: 'Health Fit DD',
        h1: 'ประกันสุขภาพเหมาจ่ายสูงสุด 30 ล้านบาท',
        copy: 'สร้างหลักประกันตั้งแต่วันนี้ เพราะสุขภาพดีมีค่าสูงกว่าเงินทอง คุ้มครองค่ารักษาพยาบาลทั้งผู้ป่วยในและผู้ป่วยนอกตามแผนที่เลือก',
        bgType: 'color',
        bgColor: '',
        bgImage: '',
      },
      whoFor: {
        h2: 'เหมาะกับใคร',
        text: 'ผู้ที่ต้องการวางแผนค่ารักษาพยาบาลจริงจัง ต้องการวงเงินสูง เลือกความคุ้มครองได้ และอยากลดความเสี่ยงจากค่าใช้จ่ายโรคร้ายแรง',
        boxBgColor: '',
      },
      planCards: {
        cards: [
          {
            id: 'health-fit-dd',
            title: 'Health Fit DD',
            anchorId: 'health-fit-dd',
            type: 'checklist',
            bullets: [
              'ชำระเบี้ยหลักพัน รับความคุ้มครองเหมาจ่ายสูงสุด 30 ล้านบาท',
              'เลือกรับความคุ้มครองครอบคลุมทั้งกรณีผู้ป่วยในและผู้ป่วยนอก',
              'เลือกออกแบบความรับผิดส่วนแรก (Deductible) ได้ด้วยตัวคุณเอง',
              'สมัครได้ตั้งแต่อายุ 15 วัน ถึง 80 ปี และคุ้มครองยาวนานถึงอายุ 99 ปี',
              'เลือกซื้อผลประโยชน์ค่ารักษาพยาบาลผู้ป่วยนอก (OPD) เพิ่มได้',
              'ครอบคลุมการฟอกไต มะเร็ง เคมีบำบัด และยามุ่งเป้า',
            ],
            icon: '',
            image: '',
            videoUrl: '',
            buttonText: '',
            buttonHref: '',
          },
        ],
      },
      recommendation: {
        h2: 'เลือกแผนอย่างไร',
        body: 'ควรเริ่มจากโรงพยาบาลที่คาดว่าจะใช้จริง งบประมาณเบี้ยที่จ่ายได้ ความต้องการ OPD และระดับความรับผิดส่วนแรกที่รับได้ เพื่อให้วงเงินและเบี้ยสมดุลกัน',
      },
      cta: {
        eyebrow: 'Healthcare planning',
        h2: 'อยากรู้ว่า Health Fit DD แบบไหนพอดีกับงบของคุณ',
        copy: 'ส่งข้อมูลงบประมาณและความต้องการ OPD ทีมงานจะช่วยจัดแผนให้เหมาะกับไลฟ์สไตล์',
        buttonText: 'ปรึกษาแผนสุขภาพ',
        buttonHref: 'contact.html',
        bgColor: '',
        bgImage: '',
        videoUrl: '',
      },
      bottomBanners: {
        banners: [
          { id: uid(), image: 'assets/promo/banner-join-team.png', href: 'careers.html', alt: 'สนใจร่วมงานกับเรา' },
          { id: uid(), image: 'assets/promo/banner-insurance.png', href: 'contact.html', alt: 'สนใจทำประกัน' },
        ],
      },
    },
    savingsRetirement: {
      hero: {
        categoryLabel: 'Savings & tax planning',
        h1: 'แผนออมทรัพย์ที่ช่วยวางอนาคตและใช้สิทธิลดหย่อนภาษี',
        copy: 'รวมทีแอลแพลนและมันนี่ ฟิต เวลท์ตี้ 18/4 สำหรับคนที่ต้องการออมอย่างมีวินัย รับเงินคืนตามเงื่อนไข และสร้างเงินก้อนในอนาคต',
        bgType: 'color',
        bgColor: '',
        bgImage: '',
      },
      whoFor: {
        h2: 'เหมาะกับใคร',
        text: 'ผู้ที่ต้องการวางแผนการออมเงินอย่างมีประสิทธิภาพ เตรียมพร้อมกับแผนอนาคต ต้องการหลักประกันที่มั่นคง และต้องการใช้สิทธิลดหย่อนภาษี',
        boxBgColor: '',
      },
      planCards: {
        cards: [
          {
            id: 'tl-plan',
            title: 'ทีแอลแพลน',
            anchorId: 'tl-plan',
            type: 'checklist',
            bullets: [
              'เลือกแผนได้ 2 ระยะ คือ ทีแอลแพลน 20/10 และ 20/15',
              'รับเงินก้อนเมื่อครบกำหนดสัญญา 150% ของจำนวนเงินเอาประกันภัย',
              'รับความคุ้มครองชีวิตตลอดสัญญา',
              'สร้างสวัสดิการเพิ่มได้ด้วยสัญญาเพิ่มเติม เช่น สุขภาพ อุบัติเหตุ และโรคร้ายแรง',
              'เบี้ยประกันภัยสามารถลดหย่อนภาษีได้สูงสุด 100,000 บาทต่อปี',
              'ออมง่าย หลักร้อย หลักพันต่อเดือน',
            ],
            icon: '',
            image: '',
            videoUrl: '',
            buttonText: '',
            buttonHref: '',
          },
          {
            id: 'money-fit-wealthy-18-4',
            title: 'มันนี่ ฟิต เวลท์ตี้ 18/4',
            anchorId: 'money-fit-wealthy-18-4',
            type: 'checklist',
            bullets: [
              'จ่ายเบี้ยสั้นเพียง 4 ปี แต่คุ้มครองยาว 18 ปี เหมาะกับการวางแผนการเงินระยะกลางถึงยาว',
            ],
            icon: '',
            image: '',
            videoUrl: '',
            buttonText: '',
            buttonHref: '',
          },
        ],
      },
      recommendation: {
        h2: 'เลือกแผนอย่างไร',
        body: 'ควรเริ่มจากเป้าหมายการออม ระยะเวลาที่ต้องการเก็บเงิน และความต้องการลดหย่อนภาษี เพื่อเลือกแผนที่สมดุลระหว่างผลตอบแทนและงบประมาณ',
      },
      cta: {
        eyebrow: 'Savings planning',
        h2: 'อยากวางแผนออมและลดหย่อนภาษีแบบเป็นระบบ',
        copy: 'ส่งเป้าหมายและงบที่จ่ายได้ ทีมงานจะช่วยเปรียบเทียบทีแอลแพลนและมันนี่ ฟิต เวลท์ตี้',
        buttonText: 'ปรึกษาแผนออม',
        buttonHref: 'contact.html',
        bgColor: '',
        bgImage: '',
        videoUrl: '',
      },
      bottomBanners: {
        banners: [
          { id: uid(), image: 'assets/promo/banner-join-team.png', href: 'careers.html', alt: 'สนใจร่วมงานกับเรา' },
          { id: uid(), image: 'assets/promo/banner-insurance.png', href: 'contact.html', alt: 'สนใจทำประกัน' },
        ],
      },
    },
  };

  function merge(pageKey, sectionKey, config) {
    const base = DEFAULTS[pageKey]?.[sectionKey] || {};
    const c = config && typeof config === 'object' ? config : {};
    return JSON.parse(JSON.stringify({ ...base, ...c }));
  }

  function field(label, name, value, opts = {}) {
    const type = opts.type || 'text';
    const cls = ['ipe-field', opts.full ? 'ipe-field--full' : ''].filter(Boolean).join(' ');
    const hint = opts.hint ? `<p class="form-hint">${esc(opts.hint)}</p>` : '';
    if (type === 'textarea') {
      return `<div class="${cls}"><label>${esc(label)}</label><textarea data-ipe-field="${esc(name)}" rows="${opts.rows || 3}">${esc(value)}</textarea>${hint}</div>`;
    }
    if (type === 'select') {
      const optsHtml = (opts.options || [])
        .map((o) => `<option value="${esc(o.value)}"${String(value) === String(o.value) ? ' selected' : ''}>${esc(o.label)}</option>`)
        .join('');
      return `<div class="${cls}"><label>${esc(label)}</label><select data-ipe-field="${esc(name)}">${optsHtml}</select>${hint}</div>`;
    }
    return `<div class="${cls}"><label>${esc(label)}</label><input type="${type}" data-ipe-field="${esc(name)}" value="${esc(value)}">${hint}</div>`;
  }

  function mediaField(label, name, value) {
    return `<div class="ipe-field ipe-field--full">
      <label>${esc(label)}</label>
      <div class="ipe-media-row">
        <input type="text" data-ipe-field="${esc(name)}" value="${esc(value)}">
        <button type="button" class="btn btn--ghost btn--sm" data-ipe-media="${esc(name)}">เลือกรูป</button>
      </div>
    </div>`;
  }

  function toggleField(checked) {
    return `<label class="ipe-toggle"><input type="checkbox" data-ipe-active ${checked ? 'checked' : ''}> แสดงส่วนนี้บนหน้าเว็บ</label>`;
  }

  function heroForm(c) {
    return [
      field('หมวดหมู่แบบประกัน (Eyebrow)', 'categoryLabel', c.categoryLabel, { full: true }),
      field('ชื่อแบบประกัน (H1)', 'h1', c.h1, { full: true }),
      field('คำอธิบายสั้น', 'copy', c.copy, { type: 'textarea', rows: 3, full: true }),
      field('พื้นหลัง', 'bgType', c.bgType || 'color', {
        type: 'select',
        options: [
          { value: 'color', label: 'สีพื้นหลัง' },
          { value: 'image', label: 'รูปพื้นหลัง' },
        ],
        full: true,
      }),
      field('สีพื้นหลัง (เช่น #f0f6ff)', 'bgColor', c.bgColor || '', { full: true, hint: 'เว้นว่าง = ใช้สีเริ่มต้นของเว็บ' }),
      mediaField('รูปพื้นหลัง', 'bgImage', c.bgImage || ''),
    ].join('');
  }

  function whoForForm(c) {
    return [
      field('หัวข้อ', 'h2', c.h2, { full: true }),
      field('รายละเอียด', 'text', c.text, { type: 'textarea', rows: 4, full: true }),
      field('สีพื้นหลังกล่อง', 'boxBgColor', c.boxBgColor || '', { full: true, hint: 'เช่น #1e3a5f — เว้นว่าง = สีเริ่มต้น' }),
    ].join('');
  }

  function bulletRow(value, idx) {
    return `<li class="ipe-bullet-item" data-bullet-idx="${idx}">
      <span class="ipe-drag drag-handle" title="ลากเรียง">⋮⋮</span>
      <input type="text" class="ipe-bullet-input" value="${esc(value)}" placeholder="รายการที่ ${idx + 1}">
      <button type="button" class="btn btn--ghost btn--sm" data-bullet-del>ลบ</button>
    </li>`;
  }

  function planCardHtml(card, idx) {
    const c = card || {};
    const bullets = Array.isArray(c.bullets) ? c.bullets : [];
    return `<article class="ipe-card" data-card-id="${esc(c.id || uid())}">
      <header class="ipe-card__head">
        <span class="ipe-drag drag-handle" title="ลากเรียงการ์ด">⋮⋮</span>
        <strong>การ์ดที่ ${idx + 1}</strong>
        <div class="ipe-card__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-card-copy>คัดลอก</button>
          <button type="button" class="btn btn--danger btn--sm" data-card-del>ลบ</button>
        </div>
      </header>
      <div class="ipe-card__body">
        ${field('ชื่อแผน', 'title', c.title || '', { full: true })}
        ${field('Anchor ID (ลิงก์ภายในหน้า)', 'anchorId', c.anchorId || '', { full: true, hint: 'เช่น health-fit-dd — ใช้ใน URL#anchor' })}
        ${field('รูปแบบเนื้อหา', 'type', c.type || 'checklist', {
          type: 'select',
          options: [
            { value: 'checklist', label: 'รายการ Bullet' },
            { value: 'paragraph', label: 'ย่อหน้าข้อความ' },
          ],
          full: true,
        })}
        ${mediaField('ไอคอน (ถ้ามี)', 'icon', c.icon || '')}
        ${mediaField('รูปภาพประกอบ', 'image', c.image || '')}
        ${field('ลิงก์วิดีโอ (YouTube/Vimeo URL)', 'videoUrl', c.videoUrl || '', { full: true })}
        ${field('ข้อความปุ่ม', 'buttonText', c.buttonText || '', { full: true })}
        ${field('ลิงก์ปุ่ม', 'buttonHref', c.buttonHref || '', { full: true })}
        <div class="ipe-bullets-wrap">
          <div class="ipe-bullets-head"><span>รายการ Bullet</span><button type="button" class="btn btn--ghost btn--sm" data-bullet-add>+ เพิ่ม Bullet</button></div>
          <ul class="ipe-bullets sortable-list" data-bullet-list>${bullets.map((b, i) => bulletRow(b, i)).join('')}</ul>
        </div>
        ${field('ข้อความย่อหน้า (ถ้าเลือกแบบ paragraph)', 'body', c.body || '', { type: 'textarea', rows: 4, full: true })}
      </div>
    </article>`;
  }

  function planCardsForm(c) {
    const cards = Array.isArray(c.cards) ? c.cards : [];
    return `<div class="ipe-cards-toolbar"><button type="button" class="btn btn--primary btn--sm" data-card-add>+ เพิ่มการ์ด</button></div>
      <div class="ipe-cards sortable-list" data-card-list>${cards.map((card, i) => planCardHtml(card, i)).join('')}</div>`;
  }

  function recommendationForm(c) {
    return [
      field('หัวข้อ', 'h2', c.h2, { full: true }),
      field('รายละเอียด', 'body', c.body, { type: 'textarea', rows: 4, full: true }),
    ].join('');
  }

  function ctaForm(c) {
    return [
      field('Eyebrow', 'eyebrow', c.eyebrow, { full: true }),
      field('หัวข้อ', 'h2', c.h2, { full: true }),
      field('รายละเอียด', 'copy', c.copy, { type: 'textarea', rows: 3, full: true }),
      field('ข้อความปุ่ม', 'buttonText', c.buttonText, { full: true }),
      field('ลิงก์ปุ่ม', 'buttonHref', c.buttonHref, { full: true }),
      field('สีพื้นหลัง', 'bgColor', c.bgColor || '', { full: true }),
      mediaField('รูปพื้นหลัง', 'bgImage', c.bgImage || ''),
      field('ลิงก์วิดีโอ', 'videoUrl', c.videoUrl || '', { full: true }),
    ].join('');
  }

  function bannerRow(b, idx) {
    return `<div class="ipe-banner" data-banner-id="${esc(b.id || uid())}">
      <span class="ipe-drag drag-handle">⋮⋮</span>
      <div class="ipe-banner__fields">
        ${mediaField('รูป Banner', 'image', b.image || '')}
        ${field('ลิงก์', 'href', b.href || '', { full: true })}
        ${field('คำอธิบายรูป (alt)', 'alt', b.alt || '', { full: true })}
      </div>
      <button type="button" class="btn btn--danger btn--sm" data-banner-del>ลบ</button>
    </div>`;
  }

  function bottomBannersForm(c) {
    const banners = Array.isArray(c.banners) ? c.banners : [];
    return `<div class="ipe-banners-toolbar"><button type="button" class="btn btn--primary btn--sm" data-banner-add>+ เพิ่ม Banner</button></div>
      <div class="ipe-banners sortable-list" data-banner-list>${banners.map((b, i) => bannerRow(b, i)).join('')}</div>`;
  }

  function sectionFormHtml(pageKey, sectionKey, config) {
    const c = merge(pageKey, sectionKey, config);
    let inner = '';
    if (sectionKey === 'hero') inner = heroForm(c);
    else if (sectionKey === 'whoFor') inner = whoForForm(c);
    else if (sectionKey === 'planCards') inner = planCardsForm(c);
    else if (sectionKey === 'recommendation') inner = recommendationForm(c);
    else if (sectionKey === 'cta') inner = ctaForm(c);
    else if (sectionKey === 'bottomBanners') inner = bottomBannersForm(c);
    return `<div class="ipe-section-form" data-ipe-section="${esc(sectionKey)}"><div class="ipe-form-grid">${inner}</div></div>`;
  }

  function readCard(cardEl) {
    const g = (name) => cardEl.querySelector(`[data-ipe-field="${name}"]`)?.value?.trim() || '';
    const bullets = [];
    cardEl.querySelectorAll('.ipe-bullet-input').forEach((inp) => {
      const v = inp.value.trim();
      if (v) bullets.push(v);
    });
    return {
      id: cardEl.dataset.cardId || uid(),
      title: g('title'),
      anchorId: g('anchorId'),
      type: g('type') || 'checklist',
      bullets,
      icon: g('icon'),
      image: g('image'),
      videoUrl: g('videoUrl'),
      buttonText: g('buttonText'),
      buttonHref: g('buttonHref'),
      body: g('body'),
    };
  }

  function readSection(pageKey, sectionKey, root) {
    const wrap = root.querySelector(`[data-ipe-section="${sectionKey}"]`);
    if (!wrap) return merge(pageKey, sectionKey, {});
    const g = (name) => wrap.querySelector(`[data-ipe-field="${name}"]`)?.value?.trim() || '';

    if (sectionKey === 'hero') {
      return {
        categoryLabel: g('categoryLabel'),
        h1: g('h1'),
        copy: g('copy'),
        bgType: g('bgType') || 'color',
        bgColor: g('bgColor'),
        bgImage: g('bgImage'),
      };
    }
    if (sectionKey === 'whoFor') {
      return { h2: g('h2'), text: g('text'), boxBgColor: g('boxBgColor') };
    }
    if (sectionKey === 'planCards') {
      const cards = [];
      wrap.querySelectorAll('.ipe-card').forEach((el) => cards.push(readCard(el)));
      return { cards };
    }
    if (sectionKey === 'recommendation') {
      return { h2: g('h2'), body: g('body') };
    }
    if (sectionKey === 'cta') {
      return {
        eyebrow: g('eyebrow'),
        h2: g('h2'),
        copy: g('copy'),
        buttonText: g('buttonText'),
        buttonHref: g('buttonHref'),
        bgColor: g('bgColor'),
        bgImage: g('bgImage'),
        videoUrl: g('videoUrl'),
      };
    }
    if (sectionKey === 'bottomBanners') {
      const banners = [];
      wrap.querySelectorAll('.ipe-banner').forEach((el) => {
        banners.push({
          id: el.dataset.bannerId || uid(),
          image: el.querySelector('[data-ipe-field="image"]')?.value?.trim() || '',
          href: el.querySelector('[data-ipe-field="href"]')?.value?.trim() || '',
          alt: el.querySelector('[data-ipe-field="alt"]')?.value?.trim() || '',
        });
      });
      return { banners };
    }
    return {};
  }

  function readAll(pageKey, root) {
    const out = {};
    SECTION_KEYS.forEach((sk) => {
      const acc = root.querySelector(`[data-ins-section="${sk}"]`);
      out[sk] = {
        config: readSection(pageKey, sk, acc || root),
        is_active: acc?.querySelector('[data-ipe-active]')?.checked !== false,
      };
    });
    return out;
  }

  function renderEditor(pageKey, sectionsByKey) {
    return SECTION_KEYS.map((sk, idx) => {
      const row = sectionsByKey[sk] || {};
      const meta = SECTION_META[sk];
      const active = row.is_active !== 0 && row.is_active !== false;
      return `<details class="home-acc ipe-acc" data-ins-section="${sk}"${idx === 0 ? ' open' : ''}>
        <summary class="home-acc__summary ipe-acc__summary">
          <span class="home-acc__title">${esc(meta.title)}</span>
          <span class="home-acc__hint">${esc(meta.hint)}</span>
        </summary>
        <div class="home-acc__body">
          ${toggleField(active)}
          ${sectionFormHtml(pageKey, sk, row.config || {})}
        </div>
      </details>`;
    }).join('');
  }

  function bindInteractions(root, openMediaPicker, initSortable) {
    root.querySelectorAll('[data-ipe-media]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.ipeMedia;
        openMediaPicker((path) => {
          const card = btn.closest('.ipe-card, .ipe-banner, .ipe-section-form');
          const el = card?.querySelector(`[data-ipe-field="${name}"]`);
          if (el) el.value = path;
        });
      });
    });

    root.querySelector('[data-card-add]')?.addEventListener('click', () => {
      const list = root.querySelector('[data-card-list]');
      if (!list) return;
      const card = document.createElement('div');
      card.innerHTML = planCardHtml({ id: uid(), title: 'แผนใหม่', type: 'checklist', bullets: [''] }, list.children.length);
      list.appendChild(card.firstElementChild);
      bindCardEvents(root, initSortable);
      initSortable?.(list, null);
    });

    bindCardEvents(root, initSortable);

    root.querySelector('[data-banner-add]')?.addEventListener('click', () => {
      const list = root.querySelector('[data-banner-list]');
      if (!list) return;
      const wrap = document.createElement('div');
      wrap.innerHTML = bannerRow({ id: uid(), image: '', href: '', alt: '' }, list.children.length);
      list.appendChild(wrap.firstElementChild);
      bindBannerEvents(root, initSortable);
      initSortable?.(list, null);
    });
    bindBannerEvents(root, initSortable);

    initSortable?.(root.querySelector('[data-card-list]'), null);
    initSortable?.(root.querySelector('[data-banner-list]'), null);
    root.querySelectorAll('[data-bullet-list]').forEach((ul) => initSortable?.(ul, null));
  }

  function bindCardEvents(root, initSortable) {
    root.querySelectorAll('.ipe-card').forEach((card) => {
      if (card.dataset.bound === '1') return;
      card.dataset.bound = '1';
      card.querySelector('[data-card-del]')?.addEventListener('click', () => card.remove());
      card.querySelector('[data-card-copy]')?.addEventListener('click', () => {
        const clone = card.cloneNode(true);
        clone.dataset.cardId = uid();
        clone.dataset.bound = '0';
        card.after(clone);
        bindCardEvents(root, initSortable);
        initSortable?.(root.querySelector('[data-card-list]'), null);
      });
      card.querySelector('[data-bullet-add]')?.addEventListener('click', () => {
        const ul = card.querySelector('[data-bullet-list]');
        if (!ul) return;
        const li = document.createElement('li');
        li.className = 'ipe-bullet-item';
        li.innerHTML = `<span class="ipe-drag drag-handle">⋮⋮</span><input type="text" class="ipe-bullet-input" value="" placeholder="รายการใหม่"><button type="button" class="btn btn--ghost btn--sm" data-bullet-del>ลบ</button>`;
        ul.appendChild(li);
        bindBulletEvents(ul, initSortable);
        initSortable?.(ul, null);
      });
      bindBulletEvents(card.querySelector('[data-bullet-list]'), initSortable);
    });
  }

  function bindBulletEvents(ul, initSortable) {
    if (!ul) return;
    ul.querySelectorAll('[data-bullet-del]').forEach((btn) => {
      btn.onclick = () => btn.closest('.ipe-bullet-item')?.remove();
    });
    initSortable?.(ul, null);
  }

  function bindBannerEvents(root, initSortable) {
    root.querySelectorAll('.ipe-banner').forEach((row) => {
      if (row.dataset.bound === '1') return;
      row.dataset.bound = '1';
      row.querySelector('[data-banner-del]')?.addEventListener('click', () => row.remove());
    });
  }

  global.InsurancePageForms = {
    pages: PAGES,
    sectionKeys: SECTION_KEYS,
    sectionMeta: SECTION_META,
    defaults: DEFAULTS,
    merge,
    renderEditor,
    readAll,
    bindInteractions,
    previewUrl(pageKey) {
      const file = PAGES[pageKey]?.file || 'insurance.html';
      const base = window.location.pathname.replace(/\/admin\/v2\/?.*$/, '');
      return `${base}/${file}`;
    },
  };
})(window);
