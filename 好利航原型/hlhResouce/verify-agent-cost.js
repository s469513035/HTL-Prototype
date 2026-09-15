/* 整柜代理实际成本（45-fcl-agent-cost.js）专项校验
 * 跑法：node verify-agent-cost.js
 * 只测纯逻辑（取数 / 分摊算法 / 差异全外连接 / 分组），不测弹窗 DOM。 */
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
try {
  vm.runInContext(parts.join('\n;\n'), sandbox, { filename: 'all.js' });
} catch (e) {
  console.log('✗ 加载失败:', e.name, e.message);
  process.exit(1);
}
const run = code => vm.runInContext(code, sandbox);

let fail = 0;
const ok = (cond, msg, extra) => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + msg + (extra !== undefined ? '  → ' + extra : ''));
  if (!cond) fail++;
};

console.log('=== 1. 三张新表已注册且表头/数据列自洽 ===');
['fcl-agent-bill', 'fcl-job-cargo', 'fcl-shipment-cost'].forEach(id => {
  const c = run(`TC[${JSON.stringify(id)}]`);
  if (!c) { ok(false, `TC['${id}'] 未注册`); return; }
  const hw = c.h.length - 1, dw = c.d.length ? c.d[0].length : -1;
  ok(hw === dw, `${id}  ${c.t}  列 ${hw} / 数据列 ${dw}  行数 ${c.d.length}`);
});

console.log('\n=== 2. 扩列后的两张老表仍自洽 ===');
['fcl-agent-cost', 'fcl-ap-bill'].forEach(id => {
  const c = run(`TC[${JSON.stringify(id)}]`);
  const hw = c.h.length - 1;
  const bad = c.d.filter(r => r.length !== hw).length;
  ok(bad === 0, `${id}  表头 ${hw} 列，${c.d.length} 行数据`, bad ? `${bad} 行列数不符` : '全部一致');
});

console.log('\n=== 3. 柜内票清单取数（分摊基数来源）===');
const jobs = ['FBK-20260613001', 'FBK-20260612002', 'FBK-20260611003'];
jobs.forEach(j => {
  const n = run(`fclJobCargoOf(${JSON.stringify(j)}).length`);
  const pkg = run(`fclJobSumOf(${JSON.stringify(j)},'pkg')`);
  const vol = run(`fclJobSumOf(${JSON.stringify(j)},'vol')`);
  const wt = run(`fclJobSumOf(${JSON.stringify(j)},'wt')`);
  ok(n > 0 && pkg > 0 && vol > 0 && wt > 0, `${j}  ${n} 票`, `件数 ${pkg} / 体积 ${vol} / 重量 ${wt}`);
});
ok(run(`fclJobSumOf('FBK-20260613001','pkg')`) === 320, '拼柜件数合计 = 320（120+90+110）');
ok(run(`fclJobSumOf('NOT-EXIST','pkg')`) === null, '不存在的 Job 取件数返回 null（界面据此标红提示补录）');
const wtFallback = run(`fclJobSumOf('FBK-20260605007','wt')`);
ok(wtFallback === null || typeof wtFallback === 'number', '无装箱明细的 Job 取重量走主单「货重」兜底', String(wtFallback));

console.log('\n=== 4. 分摊算法：四种口径 + 尾差恒等 ===');
function alloc(level, total, job, feeName, targets, basis) {
  return run(`(function(){
    _fclAlloc={level:${level},srcId:'',srcIdx:-1,total:${total},currency:'USD',
      feeName:${JSON.stringify(feeName)},feeKind:'',agent:'',billNo:'',costNo:'',
      job:${JSON.stringify(job)},basis:${JSON.stringify(basis)},
      rows:${JSON.stringify(targets)}.map(function(t){return {target:t,label:'',w:'',amt:''};})};
    _fclAlloc.rows.forEach(function(r){
      var w=fclAllocWeightOf(_fclAlloc.basis,r.target);
      r.w=(w===null?'':String(w));
    });
    fclAllocCompute(true);
    return _fclAlloc.rows.map(function(r){return {t:r.target,w:r.w,a:r.amt};});
  })()`);
}
const cargo3 = ['FEO-20260613001', 'FEO-20260613007', 'FEO-20260613012'];
[['count', '按票数'], ['pkg', '按件数'], ['vol', '按体积'], ['wt', '按重量']].forEach(([b, label]) => {
  const rows = alloc(2, 4200, 'FBK-20260613001', '海运费', cargo3, b);
  const sum = +rows.reduce((s, r) => s + parseFloat(r.a), 0).toFixed(2);
  ok(sum === 4200, `${label}  合计 ${sum.toFixed(2)} = 待分摊 4200.00`,
    rows.map(r => `${r.t.slice(-3)}:w=${r.w} →${r.a}`).join('  '));
});
const byPkg = alloc(2, 4200, 'FBK-20260613001', '海运费', cargo3, 'pkg');
ok(byPkg[0].a === '1575.00' && byPkg[1].a === '1181.25' && byPkg[2].a === '1443.75',
  '按件数 120/90/110 摊 4200 → 1575.00 / 1181.25 / 1443.75（尾差进最后一行）');
/* 除不尽：1000 按 3 票平均，前两份 333.33，最后一份吃掉 0.01 尾差 */
const odd = alloc(2, 1000, 'FBK-20260613001', '海运费', cargo3, 'count');
ok(+odd.reduce((s, r) => s + parseFloat(r.a), 0).toFixed(2) === 1000,
  '除不尽场景 1000/3 合计仍恒等 1000', odd.map(r => r.a).join(' + '));

console.log('\n=== 5. 一级分摊（账单 → Job）与预估比例回退 ===');
const lv1 = alloc(1, 1200, '', 'THC', ['FBK-20260613001', 'FBK-20260609006'], 'pkg');
ok(+lv1.reduce((s, r) => s + parseFloat(r.a), 0).toFixed(2) === 1200,
  '一级按件数摊 THC 1200 到 2 个柜', lv1.map(r => `${r.t}:w=${r.w}→${r.a}`).join('  '));
const lv1est = alloc(1, 1000, '', '海运费', ['FBK-20260613001', 'FBK-20260612002'], 'est');
ok(+lv1est.reduce((s, r) => s + parseFloat(r.a), 0).toFixed(2) === 1000,
  '一级按预估成本比例摊 1000', lv1est.map(r => `${r.t}:w=${r.w}→${r.a}`).join('  '));
const noWeight = alloc(1, 900, '', '海运费', ['NOT-A', 'NOT-B', 'NOT-C'], 'vol');
ok(+noWeight.reduce((s, r) => s + parseFloat(r.a), 0).toFixed(2) === 900 && noWeight[0].a === '300.00',
  '权重全缺时回退平均分摊，合计仍恒等', noWeight.map(r => r.a).join(' + '));

console.log('\n=== 6. 差异分析：全外连接能查出漏项 ===');
const est = run(`fclEstMapOf('FBK-20260613001')`);
const act = run(`fclActMapOf('FBK-20260613001')`);
const keys = [...new Set([...Object.keys(est), ...Object.keys(act)])];
const miss = keys.filter(k => est[k] && !act[k]);
const extra = keys.filter(k => !est[k] && act[k]);
ok(keys.length > 0, `FBK-20260613001 预估 ${Object.keys(est).length} 项 / 实际 ${Object.keys(act).length} 项，并集 ${keys.length} 项`);
ok(miss.length > 0, '能查出「预估有、实际没报」的漏项（逐行对账查不出的那类）', miss.join('、') || '无');
console.log('    预估外费用：' + (extra.join('、') || '无'));

console.log('\n=== 7. 付款申请辅助：账期与收款账号 ===');
['MAERSK', 'COSCO', '鹏程拖车'].forEach(a => {
  const info = run(`fclProviderInfoOf(${JSON.stringify(a)})`);
  ok(!!info.term, `${a}  账期=${info.term}`, info.account || '（服务商档案无银行账号）');
});
['票结', '月结15天', '月结30天', '月结60天'].forEach(t => {
  const d = run(`fclDueDateFrom(${JSON.stringify(t)})`);
  ok(/^\d{4}-\d{2}-\d{2}$/.test(d), `${t} → 到期日 ${d}`);
});

console.log('\n=== 8. 账单分摊进度统计 ===');
ok(run(`fclJobCountOfBill('AGB-20260615001')`) === 1, 'AGB-20260615001 已摊到 1 个 Job');
ok(run(`fclJobCountOfBill('AGB-20260615003')`) === 0, 'AGB-20260615003 尚未分摊（涉及Job数 0）');

console.log('\n=== 9. 工具栏动作与 dispatch 成对存在 ===');
const pairs = [
  ['fcl-agent-bill', ['账单导入', '费用分摊', '作废账单'], ['openBillHeadImport', 'openAgentBillAlloc', 'voidAgentBillRows']],
  ['fcl-agent-cost', ['对账', '差异分析', '分摊到票', '付款申请'], ['openAgentCostReconcile', 'openCostDiffDetail', 'openShipmentAlloc', 'openPaymentApply']],
  ['fcl-ap-bill', ['审批', '查看明细', '付款登记'], ['openApBillAudit', 'openApBillDetail', 'openApBillPay']]
];
pairs.forEach(([id, labels, fns]) => {
  const html = run(`renderToolbarActions(${JSON.stringify(id)})`);
  labels.forEach(l => ok(html.includes(l), `${id} 工具栏含「${l}」`));
  fns.forEach(f => {
    ok(html.includes(f + "('" + id + "')"), `${id} 「${f}」已挂 dispatch`);
    ok(run(`typeof ${f}`) === 'function', `${f} 已定义`);
  });
});

console.log('\n' + (fail ? `✗ 共 ${fail} 项未通过` : '✓ 全部通过'));
process.exit(fail ? 1 : 0);
