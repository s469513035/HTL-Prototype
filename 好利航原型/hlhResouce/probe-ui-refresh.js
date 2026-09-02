/* UI 刷新验证探针：在 vm 沙盒里真实调用 generateListPage / renderToolbarActions，
 * 断言 S4 工具栏分级与表格 class 改造已生效。用法：node probe-ui-refresh.js */
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
  console, setTimeout: (fn) => {}, clearTimeout, setInterval, clearInterval,
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
vm.runInContext(parts.join('\n;\n'), sandbox, { filename: 'all.js' });

const ids = ['fcl-booking', 'wb-manage', 'wh-final-alloc', 'crm-cust', 'fin-rate', 'cfg-country'];
let fail = 0;
const check = (cond, msg) => { console.log((cond ? 'OK   ' : 'FAIL ') + msg); if (!cond) fail++; };

for (const id of ids) {
  let html = '';
  try { html = vm.runInContext(`generateListPage(${JSON.stringify(id)})`, sandbox); }
  catch (e) { console.log('FAIL ' + id + ' 渲染抛错: ' + e.message); fail++; continue; }
  html = String(html);
  console.log('--- ' + id + ' (渲染 ' + html.length + ' 字符) ---');
  check(!html.includes('min-width:84px'), id + ': 需求/功能说明已从按钮行摘除');
  check(!/"h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer"/.test(html), id + ': 无残留描边文档按钮');
  const docLinks = (html.match(/list-setting-link inline-flex items-center gap-1/g) || []).length;
  check(docLinks === 0 || docLinks === 2, id + ': 文档链接在设置行 (命中 ' + docLinks + ')');
  check(!html.includes('bg-[#EFF6FF]'), id + ': 表头行去掉浅蓝底');
  check(!html.includes('background:#EFF6FF'), id + ': 操作列头去掉浅蓝底');
  check(!/bg-blue-600/.test(html), id + ': 无原始 blue-600');
  const solidPri = (html.match(/text-white bg-primary-600 hover:bg-primary-700/g) || []).length;
  const toolbarSeg = html.slice(html.indexOf('list-toolbar-actions'), html.indexOf('list-toolbar-settings'));
  const solidInToolbar = (toolbarSeg.match(/text-white bg-primary-600 hover:bg-primary-700/g) || []).length;
  check(solidInToolbar <= 1, id + ': 工具栏实心主按钮 ≤1 (实际 ' + solidInToolbar + ')');
}
// 按钮分级抽查：默认业务按钮应为描边次级
const tb = String(vm.runInContext(`renderToolbarActions('crm-cust')`, sandbox));
check(tb.includes('text-primary-700 border border-primary-200 bg-white hover:bg-primary-50'), 'crm-cust: 业务按钮为描边次级');
check(tb.includes('text-white bg-primary-600 hover:bg-primary-700'), 'crm-cust: 新增为实心主按钮');
// 数字列等宽右对齐（找一个确实含金额/数量/费率列的页面验证）
const numPages = ['fin-rate', 'fcl-booking', 'wb-manage', 'fin-fee-mgmt', 'fcl-quote'];
const numHit = numPages.some(pid => {
  try { return /font-semibold font-mono text-right text-text-primary/.test(String(vm.runInContext(`generateListPage(${JSON.stringify(pid)})`, sandbox))); } catch (e) { return false; }
});
check(numHit, '金额/数量/费率列等宽右对齐（fin-rate/fcl-booking/wb-manage/fin-fee-mgmt/fcl-quote 至少一页命中）');
// 数字列表头同步右对齐
const thHit = numPages.some(pid => {
  try { return /<th class="text-right text-xs font-semibold/.test(String(vm.runInContext(`generateListPage(${JSON.stringify(pid)})`, sandbox))); } catch (e) { return false; }
});
check(thHit, '数字列表头右对齐');

console.log(fail === 0 ? '\nALL UI CHECKS PASSED' : '\nFAILURES: ' + fail);
process.exit(fail === 0 ? 0 : 1);
