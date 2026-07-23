// split.js — 好利航原型 单文件 → 多文件 保序切割器(range 模型 + 前向引用重定位)
// 只操作 raw Buffer，绝不重编码/加 BOM/改 CRLF。用 acorn 校验边界=顶层语句起点。
// 每个输出文件 = 原文件若干「行区间」的拼接(通常 1 段)；被重定位的函数独立成早加载文件。
// 运行: node split.js   (在 好利航原型/ 目录)
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const DIR = __dirname;
const APP = DIR;                                          // 拆分产物就在本目录(hlhResouce)
const BACKUP = path.join(DIR, '好利航国际物流_原型图.backup-split.html'); // 备份同目录
const SHELL_OUT = path.join(APP, '好利航国际物流_原型图.html');
const CSS_DIR = path.join(APP, 'css');
const JS_DIR = path.join(APP, 'js');

const buf = fs.readFileSync(BACKUP);
const offset = [0, 0];
for (let i = 0; i < buf.length; i++) if (buf[i] === 10) offset.push(i + 1);
const totalLines = offset.length - 2;
console.log('totalLines =', totalLines, ' fileBytes =', buf.length);
const line = (a, b) => buf.slice(offset[a], offset[b + 1]); // 行 a..b(含)字节

const SCRIPT_START = 426, SCRIPT_END = 22693; // script 425 / js 426-22693 / /script 22694

// ---- acorn 解析脚本体 ----
const scriptStr = buf.slice(offset[SCRIPT_START], offset[SCRIPT_END + 1]).toString('utf8');
let ast;
try { ast = acorn.parse(scriptStr, { ecmaVersion: 'latest', sourceType: 'script', locations: true }); }
catch (e) { console.error('ACORN FAIL', e.message, 'file-line', e.loc && (e.loc.line + SCRIPT_START - 1)); process.exit(2); }
const toFileLine = l => l + SCRIPT_START - 1;
const startLines = new Set(); ast.body.forEach(n => startLines.add(toFileLine(n.loc.start.line)));
const funcRange = new Map();
ast.body.forEach(n => { if (n.type === 'FunctionDeclaration' && n.id && !funcRange.has(n.id.name)) funcRange.set(n.id.name, [toFileLine(n.loc.start.line), toFileLine(n.loc.end.line)]); });
console.log('顶层语句', ast.body.length, ' 顶层函数', funcRange.size);

// ---- 基础连续边界(文件起始行)；非语句起点则 snap ----
const names = [
  '00-config-roles', '01-i18n-dict', '02-i18n-helpers', '03-menu-data', '04-table-catalog',
  '05-tables-build', '06-standard-sheet-engine', '07-base-config-catalog', '08-runtime-consts',
  '09-list-engine-core', '10-express-sort', '11-config-track-a', '12-ar-detail', '13-dashboard',
  '14-receipt-writeoff', '15-tab-dispatch-shipment', '16-claim-a-inbound-a', '17-warehouse-pda',
  '18-inbound-b-claim-b', '19-config-modals-b', '20-generate-list-crud', '21-config-c-bankvoucher',
  '22-config-d-final-alloc', '23-config-e-selectopts', '24-crm', '25-lcl-surcharge-perm',
  '26-waybill-b-fee', '27-outbound-fcl-a', '28-cs-issue-config-track-b', '29-sortbag-config-f',
  '30-waybill-c-claim-c', '31-transfer-stowage-bl', '32-fcl-b', '33-action-modal-appshell',
  '34-reqdoc-generators', '35-i18n-switch', '36-init-misc', '99-boot'
];
let bounds = [426, 480, 1828, 1925, 2054, 3040, 3955, 4036, 7125, 7966, 9521, 9934, 10082, 10377,
  10494, 10699, 11063, 11327, 13964, 14564, 14716, 15283, 15757, 16122, 16546, 17132,
  17758, 18360, 18646, 19143, 19450, 19709, 19993, 20480, 21666, 22301, 22484, 22592];
const sortedStarts = [...startLines].sort((a, b) => a - b);
const nearest = L => sortedStarts.reduce((b, s) => Math.abs(s - L) < Math.abs(b - L) ? s : b, sortedStarts[0]);
const snaps = [];
bounds = bounds.map((L, k) => { if (k === 0 || startLines.has(L)) return L; const s = nearest(L); snaps.push(`${names[k]}: ${L}->${s}`); return s; });
if (snaps.length) console.log('snap:', snaps.join(' | '));

// files: 载入顺序数组，每项 {name, ranges:[[a,b]...]}
let files = names.map((nm, k) => ({ name: nm, ranges: [[bounds[k], (k + 1 < bounds.length) ? bounds[k + 1] - 1 : SCRIPT_END]] }));

// ---- 前向引用重定位: 把 getWarehouseNameOptions 提到 05 之前 ----
function relocateBefore(fnName, beforeName) {
  const r = funcRange.get(fnName);
  if (!r) { console.error('找不到函数', fnName); process.exit(2); }
  const [ra, rb] = r;
  const host = files.find(f => f.ranges.some(([a, b]) => a <= ra && b >= rb));
  if (!host) { console.error(fnName, '不在任何文件区间'); process.exit(2); }
  // 从 host 移除 [ra,rb]
  const nr = [];
  for (const [a, b] of host.ranges) {
    if (b < ra || a > rb) { nr.push([a, b]); continue; }
    if (a < ra) nr.push([a, ra - 1]);
    if (b > rb) nr.push([rb + 1, b]);
  }
  host.ranges = nr;
  const reloc = { name: '04a-warehouse-name-options', ranges: [[ra, rb]] };
  const bi = files.findIndex(f => f.name === beforeName);
  files.splice(bi, 0, reloc);
  console.log(`重定位 ${fnName} [${ra}-${rb}] 从 ${host.name} -> 独立 ${reloc.name}，载入于 ${beforeName} 之前`);
}
relocateBefore('getWarehouseNameOptions', '05-tables-build');

// ---- 校验: 所有 range 排序后精确平铺 426..22693 ----
const flat = [];
files.forEach((f, li) => f.ranges.forEach(([a, b]) => flat.push({ a, b, li, name: f.name })));
flat.sort((x, y) => x.a - y.a);
let cur = SCRIPT_START;
for (const s of flat) { if (s.a !== cur) { console.error('平铺缝隙/重叠 @', cur, 'got', s.a, s.name); process.exit(2); } cur = s.b + 1; }
if (cur !== SCRIPT_END + 1) { console.error('平铺未到末尾', cur); process.exit(2); }
console.log('range 平铺校验 OK：', flat.length, '段精确覆盖', SCRIPT_START, '..', SCRIPT_END);

// ---- 写出 ----
fs.rmSync(JS_DIR, { recursive: true, force: true });
fs.mkdirSync(JS_DIR, { recursive: true });
fs.mkdirSync(CSS_DIR, { recursive: true });
fs.writeFileSync(path.join(CSS_DIR, 'app.css'), line(27, 141));
const detail = [];
files.forEach((f, li) => {
  const parts = f.ranges.map(([a, b]) => line(a, b));
  const bufOut = Buffer.concat(parts);
  fs.writeFileSync(path.join(JS_DIR, f.name + '.js'), bufOut);
  detail.push({ name: f.name + '.js', loadIndex: li, ranges: f.ranges, bytes: bufOut.length });
});
console.log('写出 js', files.length, '个 + css 1 个。');

// ---- 重建 shell ----
const head = buf.slice(0, offset[26]);
const staticMid = buf.slice(offset[143], offset[425]);
const tail = buf.slice(offset[22695], buf.length);
const linkLine = Buffer.from('    <link rel="stylesheet" href="css/app.css">\r\n', 'utf8');
const tags = Buffer.from(files.map(f => `<script src="js/${f.name}.js"></script>\r\n`).join(''), 'utf8');
const shell = Buffer.concat([head, linkLine, staticMid, tags, tail]);
fs.writeFileSync(SHELL_OUT, shell);
console.log('shell', shell.length, 'bytes,', files.length, '个 script 标签');

// ---- manifest ----
fs.writeFileSync(path.join(DIR, 'split-manifest.json'), JSON.stringify({
  backup: path.basename(BACKUP), shell: path.basename(SHELL_OUT),
  headLen: head.length, linkLen: linkLine.length, staticLen: staticMid.length, tagsLen: tags.length, tailLen: tail.length,
  scriptStart: SCRIPT_START, scriptEnd: SCRIPT_END,
  wrappers: { styleOpen: line(26, 26).toString('base64'), styleClose: line(142, 142).toString('base64'), scriptOpen: line(425, 425).toString('base64'), scriptClose: line(22694, 22694).toString('base64') },
  css: 'css/app.css', files: detail
}, null, 2));
console.log('split-manifest.json 写出。DONE.');
