// verify-split.js — 拆分等价性验证(read-only, range 模型)
// 关(1) 内容保全: 各切片按原行偏移回填 -> 精确重建原脚本体, Buffer.equals
// 关(2) 全文件重建 == 备份(含 head/static/tail/wrapper/css)
// 关(3) 向前引用: 顶层 eager 调用的顶层函数不得定义在"更晚 loadIndex 文件"
// 关(4) 顶层函数声明数
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const DIR = __dirname;
const APP = path.join(DIR, 'hlhResouce');   // 拆分产物在 hlhResouce/；备份/manifest 在根
const m = JSON.parse(fs.readFileSync(path.join(DIR, 'split-manifest.json'), 'utf8'));
const backup = fs.readFileSync(path.join(DIR, m.backup));
const shell = fs.readFileSync(path.join(APP, m.shell));
let fail = 0;
const offset = [0, 0];
for (let i = 0; i < backup.length; i++) if (backup[i] === 10) offset.push(i + 1);
const SS = m.scriptStart, SE = m.scriptEnd;

// ---- 关(1) 内容保全: 回填 ----
const jsBody = backup.slice(offset[SS], offset[SE + 1]);
const assembled = Buffer.alloc(jsBody.length);
let filled = 0;
for (const f of m.files) {
  const fbuf = fs.readFileSync(path.join(APP, 'js', f.name));
  let p = 0;
  for (const [a, b] of f.ranges) {
    const L = offset[b + 1] - offset[a];
    fbuf.copy(assembled, offset[a] - offset[SS], p, p + L);
    p += L; filled += L;
  }
  if (p !== fbuf.length) { fail++; console.log('关(1) FAIL: ' + f.name + ' 字节数(' + fbuf.length + ') != 区间和(' + p + ') 有多余/缺失'); }
}
if (filled !== jsBody.length) { fail++; console.log('关(1) FAIL: 覆盖字节 ' + filled + ' != 原脚本体 ' + jsBody.length); }
if (assembled.equals(jsBody)) console.log('关(1) 内容保全: PASS  (' + m.files.length + ' 文件回填 == 原脚本体 ' + jsBody.length + ' bytes)');
else { fail++; let i = 0; while (i < jsBody.length && assembled[i] === jsBody[i]) i++; console.log('关(1) 内容保全: FAIL 首差@脚本内偏移 ' + i); }

// ---- 关(2) 全文件重建 == 备份 ----
const b64 = s => Buffer.from(s, 'base64');
const css = fs.readFileSync(path.join(APP, m.css));
const head = shell.slice(0, m.headLen);
const staticMid = shell.slice(m.headLen + m.linkLen, m.headLen + m.linkLen + m.staticLen);
const tail = shell.slice(m.headLen + m.linkLen + m.staticLen + m.tagsLen);
const recon = Buffer.concat([head, b64(m.wrappers.styleOpen), css, b64(m.wrappers.styleClose), staticMid, b64(m.wrappers.scriptOpen), assembled, b64(m.wrappers.scriptClose), tail]);
if (recon.length === backup.length && recon.equals(backup)) console.log('关(2) 全文件逐字节等价: PASS  (' + recon.length + ' bytes == 备份)');
else { fail++; let i = 0; const n = Math.min(recon.length, backup.length); while (i < n && recon[i] === backup[i]) i++; console.log('关(2) FAIL recon=' + recon.length + ' backup=' + backup.length + ' 首差@' + i); }

// ---- 解析 + 关(3)(4) ----
const scriptStr = jsBody.toString('utf8');
const ast = acorn.parse(scriptStr, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
const toFileLine = l => l + SS - 1;
// loadIndex(fileLine)
function loadIndexOf(fileLine) {
  for (const f of m.files) for (const [a, b] of f.ranges) if (fileLine >= a && fileLine <= b) return f.loadIndex;
  return -1;
}
function nameOf(fileLine) { for (const f of m.files) for (const [a, b] of f.ranges) if (fileLine >= a && fileLine <= b) return f.name; return '?'; }
const topFn = new Map(); let dup = 0;
for (const n of ast.body) if (n.type === 'FunctionDeclaration' && n.id) { const dl = toFileLine(n.loc.start.line); if (topFn.has(n.id.name)) dup++; else topFn.set(n.id.name, dl); }
console.log('关(4) 顶层函数声明数 =', topFn.size, dup ? '(+' + dup + ' 同名重复)' : '');

const IGN = new Set(['loc', 'start', 'end', 'type', 'range']);
function walkChildren(node, cb) { for (const k in node) { if (IGN.has(k)) continue; const v = node[k]; if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') walkEager(c, cb); } else if (v && typeof v.type === 'string') walkEager(v, cb); } }
function walkEager(node, cb) {
  if (!node || typeof node.type !== 'string') return;
  const t = node.type;
  if (t === 'FunctionDeclaration' || t === 'FunctionExpression' || t === 'ArrowFunctionExpression') return;
  if (t === 'CallExpression' || t === 'NewExpression') {
    const c = node.callee;
    if (c) { if (c.type === 'Identifier') cb(c.name, toFileLine(node.loc.start.line)); else if (c.type === 'FunctionExpression' || c.type === 'ArrowFunctionExpression') walkChildren(c.body, cb); else walkEager(c, cb); }
    for (const a of node.arguments || []) walkEager(a, cb);
    return;
  }
  walkChildren(node, cb);
}
const viol = [];
for (const node of ast.body) { if (node.type === 'FunctionDeclaration') continue; walkEager(node, (name, cl) => { if (!topFn.has(name)) return; const dl = topFn.get(name); if (loadIndexOf(dl) > loadIndexOf(cl)) viol.push(`${name}(): 调用@${cl}[${nameOf(cl)}] -> 定义@${dl}[${nameOf(dl)}]`); }); }
if (viol.length === 0) console.log('关(3) 向前引用分析: PASS');
else { fail++; console.log('关(3) 向前引用分析: FAIL ' + viol.length + ' 处:'); [...new Set(viol)].forEach(v => console.log('  ' + v)); }

console.log(fail === 0 ? '\n== ALL PASS ==' : '\n== ' + fail + ' 关失败 ==');
process.exit(fail ? 1 : 0);
