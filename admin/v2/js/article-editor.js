/**
 * Full-page article editor + SEO score (evidence-based checks)
 */
(function (global) {
  'use strict';

  const TITLE_IDEAL_MIN = 30;
  const TITLE_IDEAL_MAX = 60;
  const DESC_IDEAL_MIN = 120;
  const DESC_IDEAL_MAX = 160;
  const CONTENT_WORDS_GOOD = 600;
  const CONTENT_WORDS_OK = 300;
  const CONTENT_WORDS_MIN = 150;

  function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function wordCount(html) {
    const t = stripHtml(html);
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }

  function lenScore(len, idealMin, idealMax, maxPts) {
    if (!len) return 0;
    if (len >= idealMin && len <= idealMax) return maxPts;
    if (len < idealMin) return Math.round(maxPts * (len / idealMin) * 0.85);
    if (len <= idealMax + 15) return Math.round(maxPts * 0.85);
    if (len <= idealMax + 30) return Math.round(maxPts * 0.5);
    return Math.round(maxPts * 0.25);
  }

  function slugScore(slug, maxPts) {
    if (!slug) return 0;
    const s = String(slug).trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return Math.round(maxPts * 0.4);
    if (s.length < 3) return Math.round(maxPts * 0.3);
    if (s.length > 80) return Math.round(maxPts * 0.5);
    return maxPts;
  }

  function hasHeading(html, tag) {
    return new RegExp(`<${tag}[\\s>]`, 'i').test(html || '');
  }

  /**
   * @param {object} data form fields
   * @returns {{ score: number, max: number, level: string, checks: object[] }}
   */
  function computeSeoScore(data) {
    const title = (data.seo_title || data.title || '').trim();
    const desc = (data.seo_description || '').trim();
    const slug = (data.slug || '').trim();
    const articleTitle = (data.title || '').trim();
    const excerpt = (data.excerpt || '').trim();
    const heroLead = (data.hero_lead || '').trim();
    const body = data.body_html || '';
    const words = wordCount(body);
    const cover = (data.cover_image || '').trim();
    const og = (data.og_image || '').trim();
    const keywords = (data.meta_keywords || '').trim();
    const published = data.status === 'published';
    const indexable = data.robots_index !== 0 && data.robots_index !== false;

    const checks = [];

    const titlePts = lenScore(title.length, TITLE_IDEAL_MIN, TITLE_IDEAL_MAX, 15);
    checks.push({
      id: 'meta_title',
      label: 'SEO Title (แท็บเบราว์เซอร์ / Google)',
      points: titlePts,
      max: 15,
      tip:
        titlePts >= 12
          ? 'ความยาวเหมาะสม (แนะนำ 30–60 ตัวอักษร)'
          : !title
            ? 'กรอก SEO Title หรือใช้หัวข้อบทความ'
            : title.length < TITLE_IDEAL_MIN
              ? 'Title สั้นไป — เพิ่มคำอธิบายให้ชัด'
              : 'Title ยาวเกิน — Google อาจตัดทอน',
    });

    const descPts = lenScore(desc.length, DESC_IDEAL_MIN, DESC_IDEAL_MAX, 15);
    checks.push({
      id: 'meta_description',
      label: 'Meta Description',
      points: descPts,
      max: 15,
      tip:
        descPts >= 12
          ? 'ความยาวเหมาะสม (แนะนำ 120–160 ตัวอักษร)'
          : !desc
            ? 'กรอกคำอธิบายสรุปบทความเพื่อเพิ่ม CTR ในผลค้นหา'
            : desc.length < DESC_IDEAL_MIN
              ? 'คำอธิบายสั้นไป — อธิบายประโยชน์ให้ครบ'
              : 'คำอธิบายยาวเกิน — อาจถูกตัดใน SERP',
    });

    const slugPts = slugScore(slug, 10);
    checks.push({
      id: 'slug',
      label: 'URL Slug (ภาษาอังกฤษ)',
      points: slugPts,
      max: 10,
      tip:
        slugPts >= 10
          ? 'Slug อ่านง่าย ไม่มีช่องว่าง'
          : 'ใช้ตัวพิมพ์เล็ก a-z คั่นด้วย - เช่น life-insurance-tips',
    });

    let h1Pts = 0;
    if (articleTitle.length >= 20) h1Pts = 10;
    else if (articleTitle.length >= 10) h1Pts = 6;
    else if (articleTitle.length > 0) h1Pts = 3;
    checks.push({
      id: 'h1',
      label: 'หัวข้อบทความ (H1)',
      points: h1Pts,
      max: 10,
      tip:
        h1Pts >= 10
          ? 'หัวข้อชัดเจน มีความยาวเพียงพอ'
          : 'หัวข้อควรบอกเนื้อหาได้ใน 1 ประโยค (อย่างน้อย ~20 ตัวอักษร)',
    });

    let contentPts = 0;
    if (words >= CONTENT_WORDS_GOOD) contentPts = 20;
    else if (words >= CONTENT_WORDS_OK) contentPts = 15;
    else if (words >= CONTENT_WORDS_MIN) contentPts = 8;
    else if (words > 0) contentPts = 3;
    checks.push({
      id: 'content',
      label: 'ความยาวเนื้อหา',
      points: contentPts,
      max: 20,
      tip:
        contentPts >= 15
          ? `ประมาณ ${words} คำ — เหมาะกับบทความ SEO`
          : words < CONTENT_WORDS_MIN
            ? `มี ${words} คำ — แนะนำอย่างน้อย ${CONTENT_WORDS_OK}+ คำ`
            : `มี ${words} คำ — เพิ่มเนื้อหาเชิงลึกเพื่อความน่าเชื่อถือ`,
    });

    const coverPts = cover ? 8 : 0;
    checks.push({
      id: 'cover',
      label: 'รูปปกบทความ',
      points: coverPts,
      max: 8,
      tip: coverPts ? 'มีรูปปกช่วย engagement และแชร์โซเชียล' : 'เพิ่มรูปปกที่เกี่ยวข้องกับหัวข้อ',
    });

    const ogPts = og || cover ? 7 : 0;
    checks.push({
      id: 'og',
      label: 'รูปแชร์ (OG / Social)',
      points: ogPts,
      max: 7,
      tip: ogPts
        ? 'มีรูปสำหรับ Facebook / LINE (แนะนำ 1200×630 px)'
        : 'ตั้ง OG Image หรือใช้รูปปก',
    });

    let excerptPts = 0;
    if (excerpt.length >= 80) excerptPts = 5;
    else if (excerpt.length >= 40) excerptPts = 3;
    else if (excerpt.length > 0) excerptPts = 1;
    checks.push({
      id: 'excerpt',
      label: 'คำโปรย (Excerpt)',
      points: excerptPts,
      max: 5,
      tip:
        excerptPts >= 3
          ? 'คำโปรยช่วยสรุปในหน้ารวมบทความ'
          : 'เขียนคำโปรย 1–2 ประโยค',
    });

    let structurePts = 0;
    if (hasHeading(body, 'h2')) structurePts = 5;
    else if (hasHeading(body, 'h3')) structurePts = 3;
    checks.push({
      id: 'structure',
      label: 'โครงสร้างหัวข้อ (H2/H3)',
      points: structurePts,
      max: 5,
      tip: structurePts
        ? 'แบ่งหัวข้อย่อยช่วยให้อ่านง่ายและ Google เข้าใจเนื้อหา'
        : 'ใส่หัวข้อย่อย H2 ในเนื้อหา',
    });

    const kwPts = keywords.length >= 3 ? 5 : keywords.length > 0 ? 2 : 0;
    checks.push({
      id: 'keywords',
      label: 'คำค้นหลัก (Meta Keywords)',
      points: kwPts,
      max: 5,
      tip:
        kwPts >= 5
          ? 'ระบุคำค้นที่เกี่ยวข้อง (คั่นด้วยจุลภาค)'
          : 'ใส่ 3–5 คำค้นหลักที่ผู้ค้นหาอาจใช้',
    });

    let pubPts = 0;
    if (published && indexable) pubPts = 5;
    else if (published) pubPts = 3;
    else if (indexable) pubPts = 2;
    checks.push({
      id: 'publish',
      label: 'เผยแพร่และให้ Google index',
      points: pubPts,
      max: 5,
      tip:
        pubPts >= 5
          ? 'สถานะเผยแพร่และเปิด index แล้ว'
          : 'ตั้งสถานะ «เผยแพร่» และเปิด «ให้ Google index»',
    });

    const score = checks.reduce((s, c) => s + c.points, 0);
    const max = checks.reduce((s, c) => s + c.max, 0);
    return { score, max, level: scoreLevel(score), checks };
  }

  function scoreLevel(score) {
    if (score >= 80) return 'good';
    if (score >= 50) return 'warn';
    return 'poor';
  }

  function scoreLabel(level) {
    if (level === 'good') return 'ดีมาก';
    if (level === 'warn') return 'ปรับปรุงได้';
    return 'ต้องปรับปรุง';
  }

  function renderScoreRing(score, max, level) {
    const pct = max ? Math.round((score / max) * 100) : 0;
    return `<div class="article-seo-score article-seo-score--${level}" role="status" aria-live="polite">
      <div class="article-seo-score__ring" style="--seo-pct:${pct}">
        <span class="article-seo-score__value">${score}</span>
        <span class="article-seo-score__max">/${max}</span>
      </div>
      <p class="article-seo-score__label">${scoreLabel(level)}</p>
      <p class="article-seo-score__hint muted">คะแนน SEO ตามหลัก Google / On-page</p>
    </div>`;
  }

  function renderChecksList(checks) {
    return `<ul class="article-seo-checks">
      ${checks
        .map((c) => {
          const pct = c.max ? (c.points / c.max) * 100 : 0;
          const itemLevel = pct >= 80 ? 'good' : pct >= 40 ? 'warn' : 'poor';
          return `<li class="article-seo-checks__item article-seo-checks__item--${itemLevel}">
            <div class="article-seo-checks__head">
              <span class="article-seo-checks__name">${esc(c.label)}</span>
              <span class="article-seo-checks__pts">${c.points}/${c.max}</span>
            </div>
            <p class="article-seo-checks__tip">${esc(c.tip)}</p>
          </li>`;
        })
        .join('')}
    </ul>`;
  }

  global.ArticleEditor = {
    TITLE_IDEAL_MIN,
    TITLE_IDEAL_MAX,
    DESC_IDEAL_MIN,
    DESC_IDEAL_MAX,
    stripHtml,
    wordCount,
    computeSeoScore,
    scoreLevel,
    scoreLabel,
    renderScoreRing,
    renderChecksList,
  };
})(window);
