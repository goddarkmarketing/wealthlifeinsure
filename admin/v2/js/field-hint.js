/**
 * ปุ่ม ? คำอธิบายฟิลด์ — hover ที่ไอคอนเท่านั้น
 */
(function (global) {
  let pop;

  function getPop() {
    if (!pop) {
      pop = document.createElement('div');
      pop.className = 'field-hint-pop';
      pop.setAttribute('role', 'tooltip');
      pop.hidden = true;
      document.body.appendChild(pop);
    }
    return pop;
  }

  function show(btn) {
    const text = btn.dataset.fieldHint;
    if (!text) return;
    const el = getPop();
    el.textContent = text;
    el.hidden = false;
    const rect = btn.getBoundingClientRect();
    const w = el.offsetWidth;
    let left = rect.left;
    if (left + w > window.innerWidth - 12) left = window.innerWidth - w - 12;
    el.style.left = `${Math.max(12, left)}px`;
    el.style.top = `${rect.bottom + 8}px`;
  }

  function hide() {
    if (pop) pop.hidden = true;
  }

  function attach(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-field-hint]').forEach((btn) => {
      if (btn.dataset.hintBound) return;
      btn.dataset.hintBound = '1';
      btn.addEventListener('mouseenter', () => show(btn));
      btn.addEventListener('mouseleave', hide);
      btn.addEventListener('focus', () => show(btn));
      btn.addEventListener('blur', hide);
    });
  }

  global.FieldHint = { attach };
})(window);
