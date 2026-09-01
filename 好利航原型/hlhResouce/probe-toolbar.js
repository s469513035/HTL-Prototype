/* 临时探针：打印指定页面工具栏渲染出的按钮标签，用于确认通用导出/删除是否已去掉、
 * 自定义删除是否被误伤。用法：node probe-toolbar.js [id ...] */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const shell = fs.readFileSync(path.join(root, '好利航国际物流_原型图.html'), 'utf8');
const order = [...shell.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);

const noop = () => {};
const fakeEl = new Proxy({}, {
  get(t, k) {
    if (k === 'style') return {};
    if (k === 'classList') return { add: noop, remove: noop, contains: () => false, toggle: noop };
    if (k === 'dataset') return {};
    if (k === 'children' || k === 'childNodes') return [];
    if (typeof k === 'string' && /^(innerHTML|textContent|value|id|className)$/.test(k)) return '';
    return typeof k === 'string' ? noop : undefined;
  },
  set: () => true
});
const store = {};
const sandbox = {
  console, setTimeout, clearTimeout, setInterval, clearInterval,
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  navigator: { language: 'zh-CN', userAgent: 'node' },
  location: { href: '', search: '', hash: '' },
  document: {
    getElementById: () => fakeEl, querySelector: () => fakeEl, querySelectorAll: () => [],
    createElement: () => fakeEl, addEventListener: noop, removeEventListener: noop,
    body: fakeEl, documentElement: fakeEl, head: fakeEl, cookie: ''
  },
  alert: noop, confirm: () => true, prompt: () => null,
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  QRCode: function () { return fakeEl; },
  matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop })
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const parts = [];
for (const rel of order) {
  if (/99-boot/.test(rel)) continue;
  const p = path.join(root, rel);
  if (fs.existsSync(p)) parts.push(fs.readFileSync(p, 'utf8'));
}
parts.push('globalThis.__TC=(typeof TC!=="undefined")?TC:null;');
vm.runInContext(parts.join('\n;\n'), sandbox, { filename: 'all.js' });

const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['wh-final-alloc', 'crm-cust', 'fcl-booking', 'fcl-slot', 'wh-sort-bag', 'fin-rate', 'cfg-country'];

ids.forEach(id => {
  let html = '';
  try { html = vm.runInContext(`renderToolbarActions(${JSON.stringify(id)})`, sandbox); }
  catch (e) { console.log(id.padEnd(20), 'ERR ' + e.message); return; }
  const labels = [...String(html).matchAll(/>([^<>]+)<\/button>/g)].map(m => m[1].trim());
  console.log(id.padEnd(20), labels.length ? labels.join(' | ') : '(无按钮)');
  if (process.env.DIAG) {
    const i = String(html).indexOf('删除');
    console.log('   regex命中=', />\s*(删除|批量删除|批量删除汇率)\s*</.test(html),
                ' delSelected=', String(html).includes('deleteSelectedRows('),
                ' 片段=', i < 0 ? '(无删除)' : JSON.stringify(String(html).slice(Math.max(0, i - 60), i + 10)));
  }
});
