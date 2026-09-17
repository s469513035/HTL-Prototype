/* 审批 › 公告与消息（47-msg-announce.js）专项校验
 * 跑法：node verify-msg-announce.js
 * 只测纯逻辑（取数 / 圈人 / 已读统计 / 渠道解析 / 工具栏挂载），不测弹窗 DOM。 */
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

console.log('=== 1. 三张表注册且表头/数据列自洽 ===');
[['msg-announce', '公告管理'], ['msg-inbox', '我的公告'], ['msg-push-log', '推送记录']].forEach(([id, t]) => {
  const c = TC[id];
  if (!c) { ok(false, `TC['${id}'] 未注册`); return; }
  const hw = c.h.length - 1;
  const bad = c.d.filter(r => r.length !== hw).length;
  ok(c.t === t && bad === 0, `${id}  ${c.t}  ${hw} 列 / ${c.d.length} 行`, bad ? `${bad} 行列数不符` : '全部一致');
});

console.log('\n=== 2. 菜单挂在「审批」下 ===');
const approval = sandbox.__MENU.find(x => x.id === 'approval');
ok(!!approval, '找到 审批 L1');
['msg-inbox', 'msg-announce', 'msg-push-log'].forEach(id => {
  const hit = (approval.children || []).find(c => c.tab === id);
  ok(!!hit, `审批 › ${hit ? hit.label : id}`, hit ? `tab=${id}` : '未挂载');
});

console.log('\n=== 3. 公告类型只有「公告 / 消息」两种 ===');
const kinds = [...new Set(TC['msg-announce'].d.map(r => cell('msg-announce', r, '公告类型')))];
ok(kinds.every(k => ['公告', '消息'].includes(k)), '公告类型取值合法', kinds.join(' / '));
ok(kinds.length === 2, '两种类型都有种子数据', kinds.join(' / '));

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
  console.log(`      ${b.branch} · ${d.name} (${d.code}) → ${n} 人`);
}));
ok(zero === 0, '每个部门都能匹配到员工', zero ? `${zero} 个部门 0 人` : '无空部门');

console.log('\n=== 5. 四种圈人方式都能解析 ===');
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
  ok(total === declared, `${no} ${label}：解析 ${total} 人 = 公告上的触达人数 ${declared}`,
    `客户 ${hit.cust.length} / 员工 ${hit.emp.length}`);
});
/* 全部客户 / 全体员工两种模式也要能跑通（草稿上现场演示用） */
const allC = run("msgResolveScope({cust:{mode:'all',levels:[],ids:[]},emp:{mode:'none',depts:[],ids:[]}})");
const allE = run("msgResolveScope({cust:{mode:'none',levels:[],ids:[]},emp:{mode:'all',depts:[],ids:[]}})");
ok(allC.cust.length === custs.length, `全部客户 → ${allC.cust.length} 家`);
ok(allE.emp.length === emps.length, `全体员工 → ${allE.emp.length} 人`);
const none = run('msgResolveScope(msgScopeOf("ANN-20260916005"))');
ok(none.cust.length === 0 && none.emp.length === 0, '草稿 ANN-20260916005 未设范围 → 0 人（发布会被拦下）');

console.log('\n=== 6. 收件记录与公告统计对得上 ===');
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
  '把 ANN-20260915004 两条都标已读 → 已读人数 2、阅读率 100.00%',
  `${cell('msg-announce', after, '已读人数')} / ${cell('msg-announce', after, '阅读率')}`);
run(`(function(){
  var c=TC['msg-inbox'],h=c.h,iNo=h.indexOf('公告编号'),iRd=h.indexOf('阅读状态'),k=0;
  c.d.forEach(function(r){if(r[iNo]==='ANN-20260915004')r[iRd]=globalThis.__bak[k++];});
  msgRefreshReadStats('ANN-20260915004');
})()`);
const restored = TC['msg-announce'].d.find(r => cell('msg-announce', r, '公告编号') === 'ANN-20260915004');
ok(cell('msg-announce', restored, '已读人数') === '0', '还原后已读人数回到 0');

console.log('\n=== 8. 撤回会把收件记录标记为已撤回（保留留痕）===');
const before = TC['msg-inbox'].d.length;
const n = run("msgSetInboxState('ANN-20260915004','已撤回')");
ok(n === 2 && TC['msg-inbox'].d.length === before, `标记 ${n} 条为已撤回，行数不变（${before} 条，不物理删除）`);
run("msgSetInboxState('ANN-20260915004','有效')");

console.log('\n=== 9. 推送渠道解析与地址取值 ===');
[['站内信', 1], ['站内信+APP推送+企业微信', 3], ['站内信+邮件+WhatsApp', 3], ['全渠道', 6]].forEach(([t, n]) => {
  const arr = run(`msgChannelsOf(${JSON.stringify(t)})`);
  ok(arr.length === n, `「${t}」→ ${arr.length} 个渠道`, arr.join('、'));
});
ok(run("msgChannelsOf('邮件')").indexOf('站内信') === 0, '站内信是兜底：没写也会自动补在最前');
const emp0 = emps.find(e => e.email) || emps[0];
[['站内信', '系统站内'], ['APP推送', '员工端APP']].forEach(([ch, exp]) => {
  ok(run(`msgAddressOf('员工',${JSON.stringify(emp0)},${JSON.stringify(ch)})`) === exp, `${ch} 地址 = ${exp}`);
});
ok(run(`msgAddressOf('客户',{name:'x'},'WhatsApp')`) === '',
  'WhatsApp 取不到地址（客户档案无该字段）→ 推送记录会落「未开通/发送失败」，对应设计文档 TBD-01');

console.log('\n=== 10. 渠道接入开关（多端扩展预留）===');
const ready = run('MSG_CHANNEL_READY');
Object.keys(ready).forEach(k => console.log(`      ${k}：${ready[k] ? '已接入' : '未开通（预留）'}`));
ok(ready['站内信'] === true, '站内信必须是已接入（兜底渠道）');
ok(Object.keys(ready).some(k => !ready[k]), '存在未开通渠道，推送记录用来演示扩展点',
  Object.keys(ready).filter(k => !ready[k]).join('、'));
const notReady = TC['msg-push-log'].d.filter(r => cell('msg-push-log', r, '发送结果') === '未开通').length;
ok(notReady > 0, `推送记录里有 ${notReady} 条「未开通」样例`);

console.log('\n=== 11. 工具栏动作与 dispatch 成对存在 ===');
[
  ['msg-announce', ['新增公告', '接收范围', '发布', '阅读明细', '撤回'], ['openMsgScope', 'openMsgPublish', 'openMsgReadDetail', 'openMsgRecall']],
  ['msg-inbox', ['查看详情', '标记已读', '全部已读'], ['openMsgInboxDetail', 'markMsgRead', 'markAllMsgRead']],
  ['msg-push-log', ['重新推送'], ['resendMsgPush']]
].forEach(([id, labels, fns]) => {
  const html = run(`renderToolbarActions(${JSON.stringify(id)})`);
  labels.forEach(l => ok(html.includes(l), `${id} 工具栏含「${l}」`));
  fns.forEach(f => {
    ok(html.includes(f + "('" + id + "')"), `${id} 「${f}」已挂 dispatch`);
    ok(run(`typeof ${f}`) === 'function', `${f} 已定义`);
  });
  ok(!html.includes('导出数据'), `${id} 无「导出数据」（全局约定）`);
});

console.log('\n=== 12. 列表页能渲染 ===');
['msg-announce', 'msg-inbox', 'msg-push-log'].forEach(id => {
  let html = '';
  try { html = run(`generateListPage(${JSON.stringify(id)},1,'')`); } catch (e) { html = 'ERR:' + e.message; }
  ok(html.length > 500 && !html.startsWith('ERR'), `${id} 渲染成功`, html.startsWith('ERR') ? html : html.length + ' 字符');
});
ok(!run(`generateListPage('msg-announce',1,'')`).includes('>正文<'), 'msg-announce 列表不显示「正文」列（listHiddenHeaders 生效）');

console.log('\n' + (fail ? `✗ 共 ${fail} 项未通过` : '✓ 全部通过'));
process.exit(fail ? 1 : 0);
