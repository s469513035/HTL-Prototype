/* 审批 › 公告（47-msg-announce.js）专项校验
 * 跑法：node verify-msg-announce.js
 * 只测纯逻辑（取数 / 圈人 / 已读统计 / 工具栏挂载），不测弹窗 DOM。 */
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
parts.push('globalThis.__TC=TC;globalThis.__MENU=menuData;');
try {
  vm.runInContext(parts.join('\n;\n'), sandbox, { filename: 'all.js' });
} catch (e) {
  console.log('✗ 加载失败:', e.name, e.message);
  process.exit(1);
}
const run = code => vm.runInContext(code, sandbox);
const TC = sandbox.__TC;

let fail = 0;
const ok = (cond, msg, extra) => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + msg + (extra !== undefined ? '  → ' + extra : ''));
  if (!cond) fail++;
};
const cell = (id, row, name) => {
  const h = TC[id].h, i = h.indexOf(name);
  return i >= 0 && row[i] != null ? String(row[i]) : '';
};

console.log('=== 1. 两张表注册且表头/数据列自洽 ===');
[['msg-announce', '公告管理'], ['msg-inbox', '我的公告']].forEach(([id, t]) => {
  const c = TC[id];
  if (!c) { ok(false, `TC['${id}'] 未注册`); return; }
  const hw = c.h.length - 1;
  const bad = c.d.filter(r => r.length !== hw).length;
  ok(c.t === t && bad === 0, `${id}  ${c.t}  ${hw} 列 / ${c.d.length} 行`, bad ? `${bad} 行列数不符` : '全部一致');
});

console.log('\n=== 2. 简化项已移除 ===');
ok(!TC['msg-push-log'], '推送记录 msg-push-log 已删除');
ok(TC['msg-announce'].h.indexOf('公告类型') < 0, 'msg-announce 无「公告类型」列');
ok(TC['msg-inbox'].h.indexOf('公告类型') < 0, 'msg-inbox 无「公告类型」列');
['是否置顶', '推送渠道', '生效时间', '失效时间'].forEach(col => {
  ok(TC['msg-announce'].h.indexOf(col) < 0, `msg-announce 无「${col}」列`);
});
ok(TC['msg-inbox'].h.indexOf('是否置顶') < 0 && TC['msg-inbox'].h.indexOf('生效时间') < 0,
  'msg-inbox 无「是否置顶 / 生效时间」列');
const approval = sandbox.__MENU.find(x => x.id === 'approval');
ok(!approval.children.some(c => c.tab === 'msg-push-log'), '菜单里没有「推送记录」');

console.log('\n=== 3. 菜单挂在「审批」下 ===');
['msg-inbox', 'msg-announce'].forEach(id => {
  const hit = (approval.children || []).find(c => c.tab === id);
  ok(!!hit, `审批 › ${hit ? hit.label : id}`, hit ? `tab=${id}` : '未挂载');
});

console.log('\n=== 4. 圈人取数 ===');
const custs = run('msgCustomers()');
ok(custs.length > 0 && custs.every(c => c.name), `启用客户 ${custs.length} 家（禁用自动排除）`,
  custs.map(c => c.name + '/' + c.level).join('、'));
const emps = run('msgEmployees()');
ok(emps.length > 0, `在职员工 ${emps.length} 人`);
const tree = run('msgDeptTree()');
const deptN = tree.reduce((s, b) => s + b.depts.length, 0);
ok(tree.length > 0 && deptN > 0, `组织架构 ${tree.length} 个分公司 / ${deptN} 个部门（取自 perm-dept）`);
let zero = 0;
tree.forEach(b => b.depts.forEach(d => {
  const n = run(`msgEmpDeptCount(${JSON.stringify(d.code)})`);
  if (!n) zero++;
}));
ok(zero === 0, '每个部门都能匹配到员工', zero ? `${zero} 个部门 0 人` : '无空部门');

console.log('\n=== 5. 四种圈人方式都能解析，且与公告统计一致 ===');
const modes = [
  ['ANN-20260910001', '按客户等级 + 按组织架构'],
  ['ANN-20260912002', '指定客户'],
  ['ANN-20260914003', '按组织架构'],
  ['ANN-20260915004', '指定员工']
];
modes.forEach(([no, label]) => {
  const hit = run(`msgResolveScope(msgScopeOf(${JSON.stringify(no)}))`);
  const total = hit.cust.length + hit.emp.length;
  const anRow = TC['msg-announce'].d.find(r => cell('msg-announce', r, '公告编号') === no);
  const declared = parseInt(cell('msg-announce', anRow, '触达人数'), 10);
  ok(total === declared, `${no} ${label}：解析 ${total} 人 = 触达人数 ${declared}`,
    `客户 ${hit.cust.length} / 员工 ${hit.emp.length}`);
});
const allC = run("msgResolveScope({cust:{mode:'all',levels:[],ids:[]},emp:{mode:'none',depts:[],ids:[]}})");
const allE = run("msgResolveScope({cust:{mode:'none',levels:[],ids:[]},emp:{mode:'all',depts:[],ids:[]}})");
ok(allC.cust.length === custs.length, `全部客户 → ${allC.cust.length} 家`);
ok(allE.emp.length === emps.length, `全体员工 → ${allE.emp.length} 人`);
const none = run('msgResolveScope(msgScopeOf("ANN-20260916005"))');
ok(none.cust.length === 0 && none.emp.length === 0, '草稿未设范围 → 0 人（发布会拦下）');

console.log('\n=== 6. 收件记录与公告统计闭环 ===');
TC['msg-announce'].d.forEach(r => {
  const no = cell('msg-announce', r, '公告编号');
  const st = cell('msg-announce', r, '状态');
  const inbox = TC['msg-inbox'].d.filter(x => cell('msg-inbox', x, '公告编号') === no);
  const read = inbox.filter(x => cell('msg-inbox', x, '阅读状态') === '已读').length;
  const dT = parseInt(cell('msg-announce', r, '触达人数'), 10) || 0;
  const dR = parseInt(cell('msg-announce', r, '已读人数'), 10) || 0;
  const rate = inbox.length ? (read / inbox.length * 100).toFixed(2) + '%' : '';
  const good = inbox.length === dT && read === dR && cell('msg-announce', r, '阅读率') === rate;
  ok(good, `${no} [${st}] 收件 ${inbox.length}/${dT}　已读 ${read}/${dR}　阅读率 ${rate || '—'}`);
});

console.log('\n=== 7. 已读统计函数可重算 ===');
run(`(function(){
  var c=TC['msg-inbox'],h=c.h,iNo=h.indexOf('公告编号'),iRd=h.indexOf('阅读状态');
  globalThis.__bak=c.d.filter(function(r){return r[iNo]==='ANN-20260915004';}).map(function(r){return r[iRd];});
  c.d.forEach(function(r){if(r[iNo]==='ANN-20260915004')r[iRd]='已读';});
  msgRefreshReadStats('ANN-20260915004');
})()`);
const after = TC['msg-announce'].d.find(r => cell('msg-announce', r, '公告编号') === 'ANN-20260915004');
ok(cell('msg-announce', after, '已读人数') === '2' && cell('msg-announce', after, '阅读率') === '100.00%',
  '全部标已读 → 已读人数 2、阅读率 100.00%');
run(`(function(){
  var c=TC['msg-inbox'],h=c.h,iNo=h.indexOf('公告编号'),iRd=h.indexOf('阅读状态'),k=0;
  c.d.forEach(function(r){if(r[iNo]==='ANN-20260915004')r[iRd]=globalThis.__bak[k++];});
  msgRefreshReadStats('ANN-20260915004');
})()`);
const restored = TC['msg-announce'].d.find(r => cell('msg-announce', r, '公告编号') === 'ANN-20260915004');
ok(cell('msg-announce', restored, '已读人数') === '0', '还原后已读人数回到 0');

console.log('\n=== 8. 撤回保留留痕 ===');
const before = TC['msg-inbox'].d.length;
const n = run("msgSetInboxState('ANN-20260915004','已撤回')");
ok(n === 2 && TC['msg-inbox'].d.length === before, `标记 ${n} 条为已撤回，行数不变（不物理删除）`);
run("msgSetInboxState('ANN-20260915004','有效')");

console.log('\n=== 9. 工具栏与 dispatch ===');
const anHtml = run(`renderToolbarActions('msg-announce')`);
['新增公告', '发布', '阅读明细', '撤回', '查看详情'].forEach(l => ok(anHtml.includes(l), `msg-announce 工具栏含「${l}」`));
ok(!anHtml.includes('编辑数据'), 'msg-announce 无「编辑数据」');
ok(!anHtml.includes('接收范围'), 'msg-announce 无独立「接收范围」按钮（已并入发布弹窗）');
ok(anHtml.includes("openMsgPublish('msg-announce')"), '「发布」已挂 dispatch');
ok(run('typeof openMsgPublish') === 'function', 'openMsgPublish 已定义');
ok(run('typeof submitMsgPublish') === 'function', 'submitMsgPublish 已定义（一键发布）');
ok(run('typeof openMsgScope') === 'undefined', 'openMsgScope 已随独立弹窗一起删除');
const ibHtml = run(`renderToolbarActions('msg-inbox')`);
['查看详情', '标记已读', '全部已读'].forEach(l => ok(ibHtml.includes(l), `msg-inbox 工具栏含「${l}」`));
ok(!anHtml.includes('导出数据') && !ibHtml.includes('导出数据'), '两个页面均无「导出数据」');

console.log('\n=== 10. 弹窗字段（新增默认公告，无类型/置顶/渠道/生效期）===');
const a = TC['msg-announce'];
['公告类型', '是否置顶', '推送渠道', '生效时间', '失效时间'].forEach(f => {
  ok(a.modalExcludedFields.includes(f) || a.h.indexOf(f) < 0, `「${f}」不进新增弹窗`);
});

console.log('\n=== 11. 列表页能渲染 ===');
['msg-announce', 'msg-inbox'].forEach(id => {
  let html = '';
  try { html = run(`generateListPage(${JSON.stringify(id)},1,'')`); } catch (e) { html = 'ERR:' + e.message; }
  ok(html.length > 500 && !html.startsWith('ERR'), `${id} 渲染成功`, html.startsWith('ERR') ? html : html.length + ' 字符');
});
ok(!run(`generateListPage('msg-announce',1,'')`).includes('>正文<'), 'msg-announce 列表不显示「正文」列');

console.log('\n' + (fail ? `✗ 共 ${fail} 项未通过` : '✓ 全部通过'));
process.exit(fail ? 1 : 0);
