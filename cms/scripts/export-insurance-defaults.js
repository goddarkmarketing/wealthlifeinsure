const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '../../admin/v2/js/insurance-page-forms.js'),
  'utf8'
);
const start = src.indexOf('const DEFAULTS = ');
if (start < 0) {
  console.error('Could not find DEFAULTS');
  process.exit(1);
}
let i = src.indexOf('{', start);
let depth = 0;
let end = -1;
for (; i < src.length; i++) {
  const ch = src[i];
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
if (end < 0) {
  console.error('Could not parse DEFAULTS block');
  process.exit(1);
}
const code = src.slice(src.indexOf('{', start), end + 1).replace(/\buid\(\)/g, '"seed-id"');
const DEFAULTS = eval(`(${code})`);
for (const pk of Object.keys(DEFAULTS)) {
  for (const bb of DEFAULTS[pk].bottomBanners?.banners || []) {
    if (bb.id === 'seed-id') {
      bb.id = 'banner-' + (bb.href.includes('careers') ? 'join' : 'insurance');
    }
  }
}
const out = path.join(__dirname, '../data/insurance-page-sections.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(DEFAULTS, null, 2));
console.log('Wrote', out);
