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

const TC = sandbox.__TC || {};

/* FIELDS=1 时额外打印该表的状态插页、弹窗字段与必填判定 */
function printFields(id) {
  const c = TC[id];
  if (!c) { console.log('  (无 TC)'); return; }
  console.log('  标题      :', c.t);
  console.log('  状态插页  :', (c.s || []).join(' | ') || '(无)');
  console.log('  列数      :', (c.h || []).length, ' 数据行:', (c.d || []).length,
              ' 每行列数:', [...new Set((c.d || []).map(r => r.length))].join(','));
  console.log('  弹窗隐藏  :', (c.modalExcludedFields || []).join(' | ') || '(无)');
  console.log('  必填覆写  :', c.requiredOverrides ? JSON.stringify(c.requiredOverrides) : '(无)');
  const excluded = c.modalExcludedFields || [];
  const shown = (c.h || []).filter(x => x !== '操作' && excluded.indexOf(x) < 0);
  console.log('  新增/修改弹窗字段（* = 必填）:');
  shown.forEach(hd => {
    let req = false;
    try { req = vm.runInContext(`isImportantRequiredField(${JSON.stringify(hd)},${JSON.stringify(id)})`, sandbox); } catch (e) {}
    // 与 20-generate-list-crud.js 的判定保持一致：modalFieldTypes 覆写优先于表头启发式
    const fType = (c.modalFieldTypes && c.modalFieldTypes[hd]) || '';
    const isCode = fType ? fType === 'code' : /编号|单号|代码|编码/.test(hd);
    const isDate = fType ? fType === 'date' : /日期|时间/.test(hd);
    const isAttach = fType ? fType === 'attachment' : hd.includes('附件');
    const isLong = fType ? fType === 'textarea' : /备注|说明|描述|地址|职能/.test(hd);
    const opts = (c.fieldOptions && c.fieldOptions[hd])
      ? '下拉[' + c.fieldOptions[hd].slice(0, 3).join('/') + (c.fieldOptions[hd].length > 3 ? '…' : '') + ']'
      : '';
    // 渲染优先级：selectOptions > 状态 > 日期 > 编号 > 附件 > 长文本 > 文本
    const kind = opts ? opts
      : hd.includes('状态') ? '状态下拉'
      : isDate ? '日期控件'
      : isCode ? '自动生成(只读)'
      : isAttach ? '附件上传控件'
      : isLong ? '多行文本'
      : '文本';
    console.log('    ' + (req ? '* ' : '  ') + hd.padEnd(14) + kind);
  });
}

ids.forEach(id => {
  let html = '';
  try { html = vm.runInContext(`renderToolbarActions(${JSON.stringify(id)})`, sandbox); }
  catch (e) { console.log(id.padEnd(20), 'ERR ' + e.message); return; }
  const labels = [...String(html).matchAll(/>([^<>]+)<\/button>/g)].map(m => m[1].trim());
  console.log(id.padEnd(20), labels.length ? labels.join(' | ') : '(无按钮)');
  if (process.env.FIELDS) printFields(id);
  if (process.env.DIAG) {
    const i = String(html).indexOf('删除');
    console.log('   regex命中=', />\s*(删除|批量删除|批量删除汇率)\s*</.test(html),
                ' delSelected=', String(html).includes('deleteSelectedRows('),
                ' 片段=', i < 0 ? '(无删除)' : JSON.stringify(String(html).slice(Math.max(0, i - 60), i + 10)));
  }
});
