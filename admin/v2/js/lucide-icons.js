/**
 * Lucide Icons helper — https://github.com/lucide-icons/lucide
 * ใช้ร่วมกับ vendor/lucide.min.js (UMD global `lucide`)
 */
(function (global) {
  'use strict';

  const DEFAULTS = {
    size: 20,
    strokeWidth: 1.75,
    className: 'lucide-icon',
  };

  function getLucide() {
    return global.lucide;
  }

  function toPascalCase(name) {
    return String(name)
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  function resolveIconNode(lucide, name) {
    if (!lucide?.icons || !name) return null;
    return lucide.icons[name] || lucide.icons[toPascalCase(name)] || null;
  }

  /**
   * @param {string} name kebab-case icon name (e.g. layout-dashboard)
   * @param {{ size?: number, strokeWidth?: number, className?: string }} [opts]
   * @returns {string}
   */
  function svg(name, opts = {}) {
    const lucide = getLucide();
    if (!lucide || !name) return '';
    const iconNode = resolveIconNode(lucide, name);
    if (!iconNode) {
      console.warn('[LucideIcons] unknown icon:', name);
      return '';
    }
    const size = opts.size ?? DEFAULTS.size;
    const el = lucide.createElement(iconNode, {
      class: opts.className ?? DEFAULTS.className,
      width: size,
      height: size,
      'stroke-width': opts.strokeWidth ?? DEFAULTS.strokeWidth,
      'aria-hidden': 'true',
    });
    return el.outerHTML;
  }

  /** @param {ParentNode} [root] */
  function hydrate(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-lucide-icon]').forEach((el) => {
      const name = el.getAttribute('data-lucide-icon');
      if (!name) return;
      const size = Number(el.getAttribute('data-lucide-size')) || DEFAULTS.size;
      const classes = (el.getAttribute('class') || DEFAULTS.className).trim();
      const html = svg(name, { size, className: classes });
      if (html) el.outerHTML = html;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => hydrate());
  } else {
    hydrate();
  }

  global.LucideIcons = { svg, hydrate };
})(window);
