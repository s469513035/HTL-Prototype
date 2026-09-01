/* 一次性校验脚本：在无 DOM 环境下按 shell 顺序加载 js/，校验
 *   1) 加载期是否有 ReferenceError（§11.2 向前引用）
 *   2) menuData 里每个 tab 是否都有 TC 注册（§4 点菜单页面空白）
 *   3) 菜单 id / tab 是否重复
 *   4) 新增与改造的 fcl 表结构是否自洽（表头列数 == 每行数据列数+1）
 * 用法：node verify-fcl-refactor.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const shell = fs.readFileSync(path.join(root, '好利航国际物流_原型图.html'), 'utf8');
const order = [...shell.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);

// --- 极简 DOM / BOM 桩 ---
const noop = () => {};
const fakeEl = new Proxy({}, {
  get(t, k) {
    if (k === 'style') return {};
    if (k === 'classList') return { add: noop, remove: noop, contains: () => false, toggle: noop };
    if (k === 'dataset') return {};
    if (k === 'children' || k === 'childNodes') return [];
    if (Symbol.iterator === k) return undefined;
    if (typeof k === 'string' && /^(innerHTML|textContent|value|id|className)$/.test(k)) return '';
    return typeof k === 'string' ? noop : undefined;
  },
  set: () => true
});
const store = {};
const sandbox = {
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
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
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

/* 浏览器里多个 classic <script> 共享同一个全局词法环境，const/let 跨文件可见；
 * node vm 每次 runInContext 是独立 script，const 不外泄 —— 因此按顺序拼接后一次执行。 */
const loadErrors = [];
const parts = [];
const loaded = [];
for (const rel of order) {
  if (/99-boot/.test(rel)) continue;              // 启动 IIFE，依赖真实 DOM，跳过
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) { loadErrors.push(`${rel}: 文件不存在`); continue; }
  parts.push(`/* ==== ${rel} ==== */\n` + fs.readFileSync(p, 'utf8'));
  loaded.push(rel);
}
parts.push('globalThis.__menuData=(typeof menuData!=="undefined")?menuData:null;');
parts.push('globalThis.__TC=(typeof TC!=="undefined")?TC:null;');
try {
  vm.runInContext(parts.join('\n;\n'), sandbox, { filename: 'all.js' });
} catch (e) {
  loadErrors.push(`${e.name}: ${e.message}`);
}

const out = [];
const pad = (s, n) => String(s).padEnd(n);

out.push('=== 1. 加载期错误 ===');
out.push(`  按 shell 顺序加载 ${loaded.length} 个 js（99-boot 跳过）`);
if (loadErrors.length === 0) out.push('  ✓ 无加载期错误');
else loadErrors.forEach(e => out.push('  ✗ ' + e));

const menuData = sandbox.__menuData;
const TC = sandbox.__TC;
if (!menuData || !TC) {
  out.push('\n  ✗ menuData 或 TC 未定义，后续校验中止');
  console.log(out.join('\n'));
  process.exit(1);
}

// 递归收集
const nodes = [];
(function walk(list, depth, trail) {
  list.forEach(n => {
    nodes.push({ id: n.id, label: n.label, tab: n.tab, page: n.page, depth, trail: trail.concat(n.label) });
    if (n.children) walk(n.children, depth + 1, trail.concat(n.label));
  });
})(menuData, 1, []);

out.push('\n=== 2. menuData 的 tab 是否都有 TC 注册 ===');
const missing = nodes.filter(n => n.tab && !TC[n.tab]);
out.push(`  菜单节点总数 ${nodes.length}，其中带 tab 的 ${nodes.filter(n => n.tab).length} 个`);
if (missing.length === 0) out.push('  ✓ 全部有 TC 注册');
else missing.forEach(n => out.push(`  ✗ 缺 TC['${n.tab}']  ← ${n.trail.join(' › ')}`));

out.push('\n=== 3. 重复 id / 重复 tab ===');
const dupId = {}, dupTab = {};
nodes.forEach(n => { if (n.id) dupId[n.id] = (dupId[n.id] || 0) + 1; if (n.tab) dupTab[n.tab] = (dupTab[n.tab] || 0) + 1; });
const dI = Object.keys(dupId).filter(k => dupId[k] > 1);
const dT = Object.keys(dupTab).filter(k => dupTab[k] > 1);
out.push(dI.length ? '  ✗ 重复 id: ' + dI.join(', ') : '  ✓ 无重复 id');
out.push(dT.length ? '  ⚠ 重复 tab: ' + dT.join(', ') + '（多个菜单指向同一页面，通常是刻意的）' : '  ✓ 无重复 tab');

out.push('\n=== 4. 整柜业务菜单树 ===');
const fcl = nodes.find(n => n.id === 'fcl');
let fclCount = 0;
(function print(list, indent) {
  list.forEach(n => {
    const leaf = !n.children;
    if (leaf) fclCount++;
    out.push('  ' + indent + (leaf ? '· ' : '▸ ') + pad(n.label, 18) + (n.tab ? `[${n.tab}]` : ''));
    if (n.children) print(n.children, indent + '  ');
  });
})(menuData.find(x => x.id === 'fcl').children, '');
out.push(`  → 整柜业务叶子菜单项 ${fclCount} 个`);

const rules = menuData.find(x => x.id === 'biz-config').children.find(x => x.id === 'fcl-rules');
out.push('\n  业务配置 › 整柜规则：' + (rules ? rules.children.map(x => x.label).join(' / ') : '✗ 未找到'));

out.push('\n=== 5. fcl 表结构自洽（表头列数 vs 数据列数）===');
const fclTables = Object.keys(TC).filter(k => k.indexOf('fcl-') === 0).sort();
let bad = 0;
fclTables.forEach(k => {
  const c = TC[k];
  if (!c.h || !c.h.length || !c.d || !c.d.length) return;
  const hasAction = c.h[c.h.length - 1] === '操作';
  const expect = hasAction ? c.h.length - 1 : c.h.length;
  c.d.forEach((row, i) => {
    if (row.length !== expect) { out.push(`  ✗ ${k} 第${i + 1}行: 表头需 ${expect} 列，实际 ${row.length} 列`); bad++; }
  });
});
out.push(bad === 0 ? `  ✓ ${fclTables.length} 张 fcl 表全部自洽` : `  ✗ 共 ${bad} 处不匹配`);

out.push('\n=== 6. 状态列定位（si 是否指向主状态列）===');
['fcl-order', 'fcl-booking', 'fcl-si-bl', 'fcl-appeal', 'fcl-slot', 'fcl-ar-release', 'fcl-commission', 'fcl-payment-request'].forEach(k => {
  const c = TC[k]; if (!c) { out.push(`  ✗ TC['${k}'] 不存在`); return; }
  const si = c.h.findIndex(h => h.includes('状态'));
  const col = si >= 0 ? c.h[si] : '(无)';
  const vals = (c.d || []).map(r => r[si]);
  const ok = si >= 0 && vals.every(v => c.s.indexOf(v) >= 0);
  out.push(`  ${ok ? '✓' : '✗'} ${pad(k, 22)} 状态列="${col}"  状态集=[${c.s.join('/')}]  数据值=[${[...new Set(vals)].join('/')}]`);
});

console.log(out.join('\n'));
