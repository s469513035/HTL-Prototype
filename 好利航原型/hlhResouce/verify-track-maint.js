/* 轨迹维护（cs-track-maint）专项校验：布局简化 + 列结构 + 三个维度渲染 */
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
    if (k === 'tagName' || k === 'nodeName') return 'DIV';
    if (k === 'nodeType') return 1;
    if (Symbol.iterator === k) return undefined;
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
  matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop }),
  MutationObserver: function () { return { observe: noop, disconnect: noop, takeRecords: () => [] }; },
  requestAnimationFrame: cb => setTimeout(cb, 0),
  cancelAnimationFrame: noop,
  getComputedStyle: () => ({ getPropertyValue: () => '' })
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const parts = [];
for (const rel of order) {
  if (/99-boot/.test(rel)) continue;
  const p = path.join(root, rel);
  if (fs.existsSync(p)) parts.push(`/* ==== ${rel} ==== */\n` + fs.readFileSync(p, 'utf8'));
}
try {
  vm.runInContext(parts.join('\n;\n'), sandbox, { filename: 'all.js' });
} catch (e) {
  console.log('✗ 加载失败:', e.name, e.message);
  process.exit(1);
}
const run = c => vm.runInContext(c, sandbox);

let fail = 0;
const ok = (cond, msg, extra) => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + msg + (extra !== undefined ? '  → ' + extra : ''));
  if (!cond) fail++;
};

console.log('=== 1. 布局简化：单栏、无左栏、无多行输入 ===');
const page = run(`generateTrackMaintainPage('cs-track-maint')`);
ok(page.includes('flex flex-col'), '根容器为纵向单栏');
ok(!page.includes('w-80'), '左栏（w-80 侧栏）已移除');
ok(!page.includes('<textarea id="track-maintain-query"'), '查询输入从多行 textarea 变为单行 input');
ok(page.includes('id="track-maintain-dim"'), '维度为下拉（track-maintain-dim）');
ok(page.includes('trackMaintainQuery(\'waybill\')') || page.includes("trackMaintainQuery('waybill')") || page.includes('trackMaintainQuery(this.value)'), '查询动作挂接');
ok((page.match(/查询运单|查询子单|查询提单/g) || []).length === 0, '三个维度查询按钮已收进下拉');
ok(!page.includes('trackMaintainClear'), '清空按钮已移除');

console.log('\n=== 2. 列结构：轨迹代码/内容/发生地/时间/创建人 ===');
const colsWb = run('trackMaintainColumns()');
ok(JSON.stringify(colsWb) === JSON.stringify(['运单号','轨迹代码','轨迹内容','轨迹发生地','轨迹时间','创建人','操作']), '运单维度列', colsWb.join(' | '));
run("_trackMaintainTab='child'");
const colsChild = run('trackMaintainColumns()');
ok(colsChild[0] === '子单号', '子单维度首列 = 子单号');
run("_trackMaintainTab='bl'");
const colsBl = run('trackMaintainColumns()');
ok(colsBl[0] === '提单号', '提单维度首列 = 提单号');
run("_trackMaintainTab='waybill'");

console.log('\n=== 3. 主行 = 最新轨迹，展开 = 全部轨迹明细 ===');
ok(page.includes('track-maintain-tbody'), '表格主体挂载');
const rowsHtml = run('renderTrackMaintainRows()');
ok(rowsHtml.includes('TRK-ARRIVE') || rowsHtml.includes('TRK-DEPART'), '主行显示最新轨迹代码');
/* 展开一行看明细 */
run('_trackMaintainOpenSet={0:1}');
const openHtml = run('renderTrackMaintainRows()');
ok((openHtml.match(/TRK-/g) || []).length >= 3, '展开后能看到该单据全部轨迹（2 条运单轨迹 + 子单/提单无）', String((openHtml.match(/TRK-/g) || []).length));
ok(openHtml.includes('出发登记') && openHtml.includes('到达目的港'), '明细含中文名称');
run('_trackMaintainOpenSet={}');

console.log('\n=== 4. 三个维度都能渲染 ===');
['waybill','child','bl'].forEach(d => {
  run(`_trackMaintainTab='${d}'`);
  const h = run('renderTrackMaintainRows()');
  const first = run('trackMaintainColumns()')[0];
  const expect = d === 'waybill' ? 'H2607170005' : (d === 'child' ? 'H26071700050001' : 'TB-202607175');
  ok(h.includes(expect), `${d} 维度渲染（首列 ${first}，含 ${expect}）`);
});
run("_trackMaintainTab='waybill'");

console.log('\n=== 5. 死代码已清 ===');
const src = fs.readFileSync(path.join(root, 'js/11-config-track-a.js'), 'utf8');
['trackMaintainClear', 'trackMaintainKeyOf', 'trackMaintainTracksByDim'].forEach(f => {
  ok(!src.includes('function ' + f), `${f} 已删除`);
});

console.log('\n=== 6. 增删弹窗仍可用 ===');
['openTrackAddModal', 'openTrackDeleteModal', 'openTrackNodeDeleteModal', 'fillTrackContent'].forEach(f => {
  ok(run(`typeof ${f}`) === 'function', `${f} 已定义`);
});

console.log('\n' + (fail ? `✗ 共 ${fail} 项未通过` : '✓ 全部通过'));
process.exit(fail ? 1 : 0);
