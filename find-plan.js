(function () {
  'use strict';

  const data = window.__PLAN_FINDER__ || { config: {}, plans: [] };
  const config = data.config || {};
  const plans = Array.isArray(data.plans) ? data.plans : [];
  const goals = Array.isArray(config.goals) ? config.goals : [];

  const els = {
    goals: document.querySelector('[data-fp-goals]'),
    formSection: document.getElementById('fp-form'),
    formTitle: document.querySelector('[data-fp-form-title]'),
    form: document.querySelector('[data-fp-form]'),
    basic: document.querySelector('[data-fp-basic-fields]'),
    calc: document.querySelector('[data-fp-calc-fields]'),
    formula: document.querySelector('[data-fp-formula-note]'),
    summary: document.getElementById('fp-summary'),
    outputs: document.querySelector('[data-fp-outputs]'),
    budget: document.querySelector('[data-fp-budget]'),
    matchBtn: document.querySelector('[data-fp-match]'),
    results: document.getElementById('fp-results'),
    resultList: document.querySelector('[data-fp-results]'),
    disclaimer: document.querySelector('[data-fp-disclaimer]'),
  };

  let selectedGoal = null;
  let lastValues = {};

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBaht(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return '—';
    return Math.round(num).toLocaleString('th-TH') + ' บาท';
  }

  function num(v) {
    const n = Number(String(v ?? '').replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : 0;
  }

  /** Safe arithmetic evaluator: numbers, field names, + - * / ( ) max() min() */
  function evalExpr(expr, vars) {
    const src = String(expr || '').trim();
    if (!src) return 0;
    let i = 0;
    function peek() {
      return src[i] || '';
    }
    function skip() {
      while (/\s/.test(peek())) i += 1;
    }
    function parseNumber() {
      skip();
      let start = i;
      while (/[0-9.]/.test(peek())) i += 1;
      const raw = src.slice(start, i);
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new Error('bad number');
      return n;
    }
    function parseIdent() {
      skip();
      let start = i;
      while (/[A-Za-z_]/.test(peek())) i += 1;
      return src.slice(start, i);
    }
    function parsePrimary() {
      skip();
      if (peek() === '(') {
        i += 1;
        const v = parseExpr();
        skip();
        if (peek() !== ')') throw new Error('expected )');
        i += 1;
        return v;
      }
      if (/[0-9.]/.test(peek())) return parseNumber();
      const id = parseIdent();
      if (!id) throw new Error('expected value');
      if (id === 'max' || id === 'min') {
        skip();
        if (peek() !== '(') throw new Error('expected (');
        i += 1;
        const args = [];
        skip();
        if (peek() !== ')') {
          args.push(parseExpr());
          skip();
          while (peek() === ',') {
            i += 1;
            args.push(parseExpr());
            skip();
          }
        }
        if (peek() !== ')') throw new Error('expected )');
        i += 1;
        if (args.length === 0) return 0;
        return id === 'max' ? Math.max(...args) : Math.min(...args);
      }
      if (Object.prototype.hasOwnProperty.call(vars, id)) return num(vars[id]);
      return 0;
    }
    function parseUnary() {
      skip();
      if (peek() === '+') {
        i += 1;
        return parseUnary();
      }
      if (peek() === '-') {
        i += 1;
        return -parseUnary();
      }
      return parsePrimary();
    }
    function parseMul() {
      let v = parseUnary();
      skip();
      while (peek() === '*' || peek() === '/') {
        const op = peek();
        i += 1;
        const r = parseUnary();
        v = op === '*' ? v * r : r === 0 ? 0 : v / r;
        skip();
      }
      return v;
    }
    function parseExpr() {
      let v = parseMul();
      skip();
      while (peek() === '+' || peek() === '-') {
        const op = peek();
        i += 1;
        const r = parseMul();
        v = op === '+' ? v + r : v - r;
        skip();
      }
      return v;
    }
    try {
      const v = parseExpr();
      skip();
      if (i < src.length) return 0;
      return Number.isFinite(v) ? v : 0;
    } catch (_) {
      return 0;
    }
  }

  function readValues() {
    const values = {};
    els.form.querySelectorAll('[data-fp-field]').forEach((input) => {
      values[input.dataset.fpField] = num(input.value);
    });
    return values;
  }

  function fieldHtml(field) {
    const key = field.key || '';
    const label = field.label || key;
    if (field.type === 'select') {
      const options = Array.isArray(field.options) ? field.options : [];
      const selected = field.placeholder != null ? String(field.placeholder) : '';
      const opts = options
        .map((o) => {
          const val = String(o.value ?? '');
          const lab = String(o.label ?? val);
          const sel = val === selected ? ' selected' : '';
          return `<option value="${esc(val)}"${sel}>${esc(lab)}</option>`;
        })
        .join('');
      return `<label class="find-plan-field">
      <span>${esc(label)}</span>
      <select data-fp-field="${esc(key)}">${opts}</select>
    </label>`;
    }
    const type = field.type === 'text' ? 'text' : 'number';
    const ph = field.placeholder || '';
    return `<label class="find-plan-field">
      <span>${esc(label)}</span>
      <input type="${type}" inputmode="decimal" data-fp-field="${esc(key)}" placeholder="${esc(ph)}" value="">
    </label>`;
  }

  function renderGoals() {
    if (!els.goals) return;
    els.goals.innerHTML = goals
      .map((g, idx) => {
        const n = idx + 1;
        return `<button type="button" class="find-plan-goal" data-fp-goal="${esc(g.id)}" aria-pressed="false">
          <span class="find-plan-goal__num">${n}</span>
          <span class="find-plan-goal__text">
            <strong>${esc(g.title || '')}</strong>
            <span>${esc(g.subtitle || '')}</span>
          </span>
        </button>`;
      })
      .join('');
  }

  function selectGoal(id) {
    selectedGoal = goals.find((g) => g.id === id) || null;
    els.goals?.querySelectorAll('.find-plan-goal').forEach((btn) => {
      const on = btn.dataset.fpGoal === id;
      btn.classList.toggle('is-selected', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (!selectedGoal) return;

    if (els.formTitle) els.formTitle.textContent = selectedGoal.formTitle || 'กรอกข้อมูลเพื่อวางแผน';
    if (els.basic) {
      els.basic.innerHTML = (selectedGoal.basicFields || []).map(fieldHtml).join('');
    }
    if (els.calc) {
      els.calc.innerHTML = (selectedGoal.calcFields || []).map(fieldHtml).join('');
    }
    if (els.formula) els.formula.textContent = selectedGoal.formulaNote || '';

    els.formSection.hidden = false;
    els.summary.hidden = true;
    els.results.hidden = true;
    els.formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderSummary(values) {
    lastValues = values;
    const outputs = selectedGoal.outputs || [];
    els.outputs.innerHTML = outputs
      .map((o) => {
        const val = evalExpr(o.expr || '0', values);
        const tone = o.tone || 'blue';
        return `<article class="find-plan-output find-plan-output--${esc(tone)}">
          <p class="find-plan-output__label">${esc(o.label || '')}</p>
          <p class="find-plan-output__value">${esc(formatBaht(val))}</p>
        </article>`;
      })
      .join('');

    const budgetKey = selectedGoal.budgetKey || '';
    if (budgetKey && Object.prototype.hasOwnProperty.call(values, budgetKey)) {
      els.budget.hidden = false;
      els.budget.innerHTML = `<strong>${esc(selectedGoal.budgetLabel || 'งบที่จัดสรรได้')}</strong>
        <span>${esc(formatBaht(values[budgetKey]))}${budgetKey.includes('premium') || budgetKey.includes('budget') ? '/ปี' : ''}</span>`;
    } else {
      els.budget.hidden = true;
      els.budget.innerHTML = '';
    }

    els.summary.hidden = false;
    els.results.hidden = true;
    els.summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function categoryTags(raw) {
    return String(raw || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  function planMatchesCategory(plan, categorySpec) {
    const tags = categoryTags(categorySpec);
    if (tags.length === 0) return true;
    const cat = String(plan.category || '').toLowerCase();
    const parts = categoryTags(plan.category);
    return tags.some(
      (t) =>
        cat === t ||
        cat.includes(t) ||
        parts.some((p) => p === t || p.includes(t) || t.includes(p))
    );
  }

  function keywordTerms(goal, values) {
    const terms = [];
    String(goal.keywords || '')
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((t) => terms.push(t.toLowerCase()));

    (goal.keywordRules || []).forEach((rule) => {
      const key = rule.when;
      const expected = Number(rule.equals);
      if (key && num(values[key]) === expected) {
        (rule.terms || []).forEach((t) => terms.push(String(t).toLowerCase()));
      }
    });

    // Also use numeric prefs as soft year hints in text (no %)
    if (values.pay_years) terms.push(String(Math.round(values.pay_years)) + ' ปี');
    if (values.cover_years) terms.push(String(Math.round(values.cover_years)));

    return [...new Set(terms.filter(Boolean))];
  }

  function scoreKeywordPlan(plan, terms) {
    const text = String(plan.searchText || '').toLowerCase();
    let score = 0;
    terms.forEach((t) => {
      if (t && text.includes(t)) score += 1;
    });
    if (plan.featured) score += 0.25;
    score -= (Number(plan.sort) || 0) * 0.001;
    return score;
  }

  function findPlanByMatchers(matchers) {
    const terms = (Array.isArray(matchers) ? matchers : [])
      .map((t) => String(t || '').trim().toLowerCase())
      .filter(Boolean);
    if (!terms.length) return null;
    return (
      plans.find((p) => {
        const hay = `${p.slug || ''} ${p.name || ''} ${p.href || ''} ${p.searchText || ''}`.toLowerCase();
        return terms.some((t) => hay.includes(t));
      }) || null
    );
  }

  function applyPlanOverrides(goal, values) {
    const rules = Array.isArray(goal.planOverrides) ? goal.planOverrides : [];
    for (const rule of rules) {
      const whenAll = Array.isArray(rule.whenAll) ? rule.whenAll : [];
      const matched =
        whenAll.length > 0 &&
        whenAll.every((cond) => num(values[cond.key]) === Number(cond.equals));
      if (!matched) continue;
      const out = [];
      (rule.plans || []).forEach((item) => {
        const found = findPlanByMatchers(item.match || item.matchers || []);
        if (found && !out.some((p) => p.id === found.id)) out.push(found);
      });
      return out.slice(0, 3);
    }
    return null;
  }

  function pickPlans(goal, values) {
    const forced = applyPlanOverrides(goal, values);
    if (forced) return forced;

    const mode = goal.mode || 'category';
    let pool = plans.slice();

    if (mode === 'keyword') {
      const terms = keywordTerms(goal, values);
      // Prefer same category first if set
      if (goal.category) {
        const catPool = pool.filter((p) => planMatchesCategory(p, goal.category));
        if (catPool.length) pool = catPool;
      }
      pool = pool
        .map((p) => ({ p, score: scoreKeywordPlan(p, terms) }))
        .filter((x) => x.score > 0 || terms.length === 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (a.p.featured !== b.p.featured) return a.p.featured ? -1 : 1;
          return (a.p.sort || 0) - (b.p.sort || 0);
        })
        .map((x) => x.p);
      if (pool.length === 0) {
        pool = plans
          .filter((p) => planMatchesCategory(p, goal.category || 'savings'))
          .sort((a, b) => {
            if (a.featured !== b.featured) return a.featured ? -1 : 1;
            return (a.sort || 0) - (b.sort || 0);
          });
      }
      return pool.slice(0, 3);
    }

    // Category mode (goals 1–5): featured/pinned order within matching category
    pool = pool
      .filter((p) => planMatchesCategory(p, goal.category))
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return (a.sort || 0) - (b.sort || 0);
      });
    return pool.slice(0, 3);
  }

  function renderResults(list) {
    if (!list.length) {
      els.resultList.innerHTML =
        '<p class="find-plan-empty">ยังไม่พบแบบประกันที่ตรงหมวดนี้ — ลองหมวดอื่น หรือติดต่อที่ปรึกษา</p>';
    } else {
      els.resultList.innerHTML = list
        .map((p, idx) => {
          const rank = idx + 1;
          const cat = p.category ? String(p.category).split(',')[0].trim() : '';
          return `<article class="find-plan-card${rank === 1 ? ' find-plan-card--top' : ''}">
            <div class="find-plan-card__body">
              <span class="find-plan-card__rank">แนะนำอันดับ ${rank}</span>
              <h3>${esc(p.name)}</h3>
              ${cat ? `<p class="find-plan-card__cat">${esc(cat)}</p>` : ''}
              <p class="find-plan-card__excerpt">${esc(p.excerpt || 'แผนประกันที่สอดคล้องกับเป้าหมายที่คุณเลือก')}</p>
            </div>
            <div class="find-plan-card__aside">
              <a class="button primary" href="${esc(p.href || '#')}">อ่านรายละเอียดแบบประกัน</a>
              <a class="find-plan-card__consult" href="contact.html">ขอให้ที่ปรึกษาติดต่อกลับ</a>
            </div>
          </article>`;
        })
        .join('');
    }
    if (els.disclaimer && config.disclaimer) {
      els.disclaimer.textContent = config.disclaimer;
    }
    els.results.hidden = false;
    els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function bind() {
    els.goals?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-fp-goal]');
      if (!btn) return;
      selectGoal(btn.dataset.fpGoal);
    });

    els.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedGoal) return;
      renderSummary(readValues());
    });

    els.matchBtn?.addEventListener('click', () => {
      if (!selectedGoal) return;
      const values = Object.keys(lastValues).length ? lastValues : readValues();
      renderResults(pickPlans(selectedGoal, values));
    });
  }

  renderGoals();
  bind();
})();
