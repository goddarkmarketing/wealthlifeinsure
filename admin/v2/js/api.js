const API_BASE = `${window.location.pathname.replace(/\/admin\/v2\/?.*$/, '')}/cms/api/index.php`;

function buildApiUrl(path) {
  const raw = path.startsWith('/') ? path : `/${path}`;
  const q = raw.indexOf('?');
  const route = q >= 0 ? raw.slice(0, q) : raw;
  const query = q >= 0 ? raw.slice(q + 1) : '';
  let url = `${API_BASE}?path=${encodeURIComponent(route)}`;
  if (query) url += `&${query}`;
  return url;
}

async function api(path, options = {}) {
  const url = buildApiUrl(path);
  const opts = {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  };
  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data.data ?? data;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function confirmDelete(msg) {
  return window.confirm(msg || 'ยืนยันการลบ? การกระทำนี้ไม่สามารถย้อนกลับได้');
}

function toast(el, msg, isError) {
  if (!el) return;
  el.hidden = false;
  el.className = isError ? 'toast toast--err' : 'toast toast--ok';
  el.textContent = msg;
  setTimeout(() => {
    el.hidden = true;
  }, 5000);
}

/** บันทึก DB แล้วสร้างหน้า HTML จากฐานข้อมูล */
async function publishSite(toastEl, message = 'อัปเดตหน้าเว็บแล้ว') {
  const result = await api('/build', { method: 'POST', body: {} });
  const n = result?.count;
  const suffix = n != null && n !== '' ? ` (${n} ไฟล์)` : '';
  toast(toastEl, `${message}${suffix}`);
  return result;
}
