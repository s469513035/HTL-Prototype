/* ============================================================
   Inline Prototype Editor · 通用版 v1.0
   零依赖 · 单文件 · 任意 HTML 项目开箱即用

   使用：
     <script src="inline-editor.js" defer></script>

   可选配置（放在 <head> 里）：
     <!-- 项目名（避免多项目 localStorage 冲突） -->
     <meta name="ed-project" content="my-app-v1">

     <!-- 主题色（默认橙，可覆盖为任意色） -->
     <style>
       :root {
         --ed-primary:      #3b82f6;
         --ed-primary-dark: #1e40af;
         --ed-primary-bg:   #eff6ff;
         --ed-primary-bd:   #bfdbfe;
         --ed-primary-text: #1e3a8a;
       }
     </style>

   功能：
     · 左键点任意文字 → 直接改（Enter 保存 · Esc 取消，图标自动保留）
     · 右键点任意元素 → 弹菜单：改文字 / 复制一份 / 删除本项
     · Ctrl+E 或右下角按钮切换编辑模式
     · 所有修改按 项目名+文件名 存 localStorage · 刷新还在
     · 一键导出所有页面所有修改为 JSON

   兼容：所有现代浏览器（Chrome/Edge/Firefox/Safari）· IE 不支持
   ============================================================ */
(function(){
'use strict';

// -------- 项目标识 --------
const PROJECT_ID = (function(){
  const meta = document.querySelector('meta[name="ed-project"]');
  if (meta && meta.content) return meta.content;
  // 兜底：用 host 简化（同域不同项目会冲，建议加 <meta name="ed-project">）
  return location.host || 'default';
})();
const PAGE_ID = location.pathname.split('/').pop() || 'index';
const STORAGE_KEY = 'ed_' + PROJECT_ID + '::' + PAGE_ID;

// -------- 数据结构 --------
let state = { texts: {}, deletes: [], dupes: [] };
try {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  if (raw && (raw.texts || raw.deletes || raw.dupes)){
    state.texts = raw.texts || {};
    state.deletes = raw.deletes || [];
    state.dupes = raw.dupes || [];
  } else if (raw && typeof raw === 'object') {
    state.texts = raw;   // 兼容平铺格式
  }
} catch(e) {}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function editCount(){
  return Object.keys(state.texts).length + state.deletes.length + state.dupes.reduce((a,d)=>a+d.count,0);
}

let editMode = false;

// -------- 元素分类 --------
const BLOCK_TAG = new Set([
  'INPUT','SELECT','TEXTAREA','SVG','PATH','LINE','CIRCLE','RECT','POLYGON',
  'POLYLINE','G','DEFS','SCRIPT','STYLE','IMG','VIDEO','IFRAME','CANVAS','HR','BR',
  'HTML','BODY','HEAD','META','LINK','TITLE','FORM'
]);
const ALLOW_INTERACTIVE = new Set(['BUTTON','LABEL']);
const INLINE_TAG = new Set(['SPAN','B','I','EM','STRONG','SMALL','SUP','SUB','U','MARK','CODE','TT','FONT','A']);

// -------- 选择器 --------
function getSelector(el){
  if (el.id) return '#' + CSS.escape(el.id);
  const parts = [];
  let cur = el;
  while (cur && cur !== document.body && parts.length < 10){
    let s = cur.tagName.toLowerCase();
    if (cur.classList && cur.classList.length){
      const cls = Array.from(cur.classList)
        .filter(c => !c.startsWith('editing-')
                  && !c.startsWith('ed-')
                  && c !== 'edited-mark')
        .slice(0,3)
        .map(c => CSS.escape(c))
        .join('.');
      if (cls) s += '.' + cls;
    }
    const p = cur.parentElement;
    if (p){
      const sib = Array.from(p.children).filter(x => x.tagName === cur.tagName);
      if (sib.length > 1) s += ':nth-of-type(' + (sib.indexOf(cur) + 1) + ')';
    }
    parts.unshift(s);
    cur = cur.parentElement;
  }
  return parts.join(' > ');
}

// -------- 文本叶节点判定 --------
function isDecorative(el){
  if (!el || el.nodeType !== 1) return false;
  if (['SVG','IMG','I','BR','HR','PICTURE','CANVAS'].includes(el.tagName)) return true;
  return (el.textContent || '').trim() === '';
}

function isTextLeaf(el){
  if (!el || el.nodeType !== 1) return false;
  const tag = el.tagName;
  if (BLOCK_TAG.has(tag) && !ALLOW_INTERACTIVE.has(tag)) return false;
  if (el.closest('.ed-toolbar, .ed-modal, .ed-panel, .ed-ctx-menu, .ed-mask, .ed-tip, .ed-toast')) return false;
  if (el.classList && el.classList.contains('editing-inline-input')) return false;
  const raw = (el.textContent || '').trim();
  if (!raw || raw.length > 400) return false;
  const elemKids = Array.from(el.children);
  if (elemKids.length === 0) return true;
  return elemKids.every(c => {
    if (isDecorative(c)) return true;
    if (INLINE_TAG.has(c.tagName)){
      const grand = Array.from(c.children);
      if (grand.length === 0) return true;
      return grand.every(g => isDecorative(g));
    }
    return false;
  });
}

function extractText(el){
  let text = '';
  el.childNodes.forEach(n => {
    if (n.nodeType === 3) text += n.textContent;
    else if (n.nodeType === 1 && (n.textContent || '').trim()){
      text += n.textContent;
    }
  });
  return text.replace(/\s+/g,' ').trim();
}

function findEditable(el){
  let cur = el;
  for (let i = 0; i < 6 && cur && cur !== document.body && cur !== document.documentElement; i++){
    if (isTextLeaf(cur)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

// -------- 通用「块级容器」识别（无项目定制）--------
function isBlockCandidate(el){
  if (!el || el.nodeType !== 1) return false;
  if (el === document.body || el === document.documentElement) return false;
  if (el.closest('.ed-toolbar, .ed-modal, .ed-panel, .ed-ctx-menu')) return false;

  // 天然的块级语义标签
  const tag = el.tagName;
  if (['LI','TR','ARTICLE','SECTION','ASIDE','FIGURE','FIELDSET','BUTTON',
       'DETAILS','SUMMARY','BLOCKQUOTE','DIALOG','FORM','NAV','HEADER','FOOTER'].includes(tag)) return true;

  // 通过 computed style 判断有视觉边界
  try {
    const cs = getComputedStyle(el);
    const hasBorder = cs.borderTopWidth !== '0px' || cs.borderLeftWidth !== '0px';
    const hasBg = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
    const hasShadow = cs.boxShadow && cs.boxShadow !== 'none';
    const hasRadius = cs.borderTopLeftRadius !== '0px' || cs.borderTopRightRadius !== '0px';
    if (hasBorder || hasBg || hasShadow || hasRadius) return true;
  } catch(e){}
  return false;
}

function findBlock(el){
  let cur = el;
  const vpArea = window.innerWidth * window.innerHeight;
  for (let i = 0; i < 12 && cur && cur !== document.body; i++){
    if (isBlockCandidate(cur)){
      const rect = cur.getBoundingClientRect();
      // 不允许选到占屏 70% 以上的大容器（防止误删整页）
      if (rect.width * rect.height < vpArea * 0.7){
        return cur;
      }
    }
    cur = cur.parentElement;
  }
  return el.parentElement || el;
}

// -------- 应用持久化修改 --------
function applyState(){
  state.dupes.forEach(({sel, count}) => {
    try {
      const src = document.querySelector(sel);
      if (src && !src.dataset.dupeApplied){
        src.dataset.dupeApplied = '1';
        for (let i = 0; i < count; i++){
          const clone = src.cloneNode(true);
          clone.classList.add('ed-duped');
          delete clone.dataset.dupeApplied;
          src.parentNode.insertBefore(clone, src.nextSibling);
        }
      }
    } catch(e){}
  });
  Object.entries(state.texts).forEach(([sel, v]) => {
    try {
      const el = document.querySelector(sel);
      if (el && !el.dataset.editedApplied){
        const decorNodes = [];
        el.childNodes.forEach(n => {
          if (n.nodeType === 1 && isDecorative(n)) decorNodes.push(n.cloneNode(true));
        });
        el.innerHTML = '';
        decorNodes.forEach(icon => el.appendChild(icon));
        el.appendChild(document.createTextNode(decorNodes.length ? ' ' + v.new : v.new));
        el.dataset.editedApplied = '1';
        el.classList.add('edited-mark');
      }
    } catch(e){}
  });
  state.deletes.forEach(sel => {
    try { const el = document.querySelector(sel); if (el) el.remove(); } catch(e){}
  });
}

// -------- 样式（用 CSS 变量，可被外部覆盖）--------
function installStyle(){
  if (document.getElementById('inline-editor-css')) return;
  const s = document.createElement('style');
  s.id = 'inline-editor-css';
  s.textContent = `
    :root {
      --ed-primary:      #f97316;
      --ed-primary-dark: #ea580c;
      --ed-primary-bg:   #fff7ed;
      --ed-primary-bd:   #fed7aa;
      --ed-primary-text: #7c2d12;
      --ed-primary-deep: #431407;
      --ed-danger:       #dc2626;
      --ed-danger-bg:    #fee;
      --ed-success:      #16a34a;
      --ed-success-dark: #15803d;
      --ed-warn:         #f59e0b;
    }
    .edited-mark {}
    body.edit-mode .edited-mark { position:relative; }
    body.edit-mode .edited-mark::after {
      content:''; position:absolute; top:0; right:0;
      width:6px; height:6px; border-radius:50%;
      background:var(--ed-primary); box-shadow:0 0 4px rgba(0,0,0,.25);
      pointer-events:none; z-index:99996;
    }
    .ed-duped {}
    body.edit-mode .ed-duped { outline:1px dashed rgba(22,163,74,.5); outline-offset:2px; }

    body.edit-mode { cursor:crosshair !important; }
    body.edit-mode .ed-hover-target {
      outline:2px dashed var(--ed-primary) !important;
      outline-offset:2px !important;
      background:rgba(249,115,22,.10) !important;
      cursor:text !important;
      border-radius:3px !important;
      box-shadow:0 0 0 4px rgba(249,115,22,.06) !important;
    }
    body.edit-mode .ed-block-hover {
      outline:2px solid var(--ed-danger) !important;
      outline-offset:3px !important;
    }
    .editing-inline-input {
      border:2px solid var(--ed-primary) !important;
      padding:2px 6px !important;
      background:#fff !important;
      outline:none !important;
      font-size:inherit !important;
      color:inherit !important;
      font-weight:inherit !important;
      font-family:inherit !important;
      min-width:80px;
      max-width:100%;
      box-sizing:border-box;
    }
    .ed-toolbar { position:fixed; bottom:20px; right:20px; z-index:99998; display:flex; flex-direction:column; gap:8px; align-items:flex-end; font-family:system-ui,-apple-system,'Segoe UI',sans-serif; }
    .ed-btn { background:linear-gradient(135deg,var(--ed-primary),var(--ed-primary-dark)); color:#fff; border:none; padding:10px 16px; border-radius:24px; cursor:pointer; font-size:12px; font-weight:600; box-shadow:0 4px 16px rgba(0,0,0,.15); display:flex; align-items:center; gap:6px; }
    .ed-btn:hover { transform:translateY(-1px); }
    .ed-btn.active { background:linear-gradient(135deg,var(--ed-success),var(--ed-success-dark)); animation:edPulse 1.6s infinite; }
    @keyframes edPulse { 0%,100% { box-shadow:0 4px 16px rgba(22,163,74,.35); } 50% { box-shadow:0 4px 24px rgba(22,163,74,.7); } }
    .ed-count { background:rgba(255,255,255,.28); padding:2px 8px; border-radius:12px; font-size:11px; }
    .ed-panel { background:#fff; border:1px solid var(--ed-primary-bd); border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,.15); padding:14px; width:300px; font-size:12px; color:var(--ed-primary-text); }
    .ed-panel h4 { margin:0 0 10px; font-size:13px; color:var(--ed-primary-deep); display:flex; justify-content:space-between; align-items:center; }
    .ed-panel .ed-hint { padding:8px 10px; background:var(--ed-primary-bg); border-radius:6px; line-height:1.7; margin-bottom:10px; font-size:11px; }
    .ed-panel button { display:block; width:100%; padding:8px; margin-bottom:6px; border-radius:6px; cursor:pointer; font-weight:600; border:1px solid transparent; font-family:inherit; font-size:12px; }
    .ed-panel .btn-primary { background:var(--ed-primary); color:#fff; border:none; }
    .ed-panel .btn-secondary { background:#fff; border:1px solid var(--ed-primary-bd); color:var(--ed-primary-text); }
    .ed-panel .btn-danger { background:#fef3c7; border:1px solid var(--ed-warn); color:#9a3412; }
    .ed-modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:100000; width:760px; max-width:92vw; max-height:82vh; overflow:auto; background:#fff; border:1px solid var(--ed-primary-bd); border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,.25); padding:20px; font-family:system-ui,-apple-system,'Segoe UI',sans-serif; }
    .ed-mask { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:99999; }
    .ed-modal table { width:100%; border-collapse:collapse; font-size:12px; }
    .ed-modal th { background:var(--ed-primary-bg); padding:6px 8px; text-align:left; color:#9a3412; position:sticky; top:0; }
    .ed-modal td { padding:6px 8px; border-bottom:1px solid #fef3c7; }
    .ed-tip {
      position:fixed; pointer-events:none; z-index:99997;
      background:var(--ed-primary-deep); color:#fff; padding:4px 10px; border-radius:6px;
      font-size:11px; font-weight:600; white-space:nowrap;
      box-shadow:0 4px 12px rgba(0,0,0,.25);
      transform:translate(12px,-100%); display:none;
    }
    body.edit-mode .ed-tip { display:block; }
    .ed-ctx-menu {
      position:fixed; z-index:100002; background:#fff;
      border:1px solid var(--ed-primary-bd); border-radius:8px;
      box-shadow:0 8px 24px rgba(0,0,0,.15);
      padding:6px 0; min-width:170px; font-size:13px;
      font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
    }
    .ed-ctx-item { padding:8px 16px; cursor:pointer; color:var(--ed-primary-deep); display:flex; align-items:center; gap:8px; }
    .ed-ctx-item:hover { background:var(--ed-primary-bg); color:var(--ed-primary-dark); }
    .ed-ctx-item.danger:hover { background:var(--ed-danger-bg); color:var(--ed-danger); }
    .ed-ctx-sep { border-top:1px solid #fef3c7; margin:4px 0; }
    .ed-toast {
      position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:100003;
      color:#fff; padding:10px 20px; border-radius:8px; font-size:13px; font-weight:600;
      box-shadow:0 8px 24px rgba(0,0,0,.25); transition:opacity .3s;
      font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
    }
  `;
  document.head.appendChild(s);
}

// -------- 编辑模式开关 --------
function activate(){
  editMode = true;
  document.body.classList.add('edit-mode');
  document.addEventListener('click', handleClick, true);
  document.addEventListener('mousemove', handleMove, true);
  document.addEventListener('contextmenu', handleContext, true);
  showToast('✏ 编辑模式已开启 · 左键改文字 · 右键更多操作');
}
function deactivate(){
  editMode = false;
  document.body.classList.remove('edit-mode');
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('mousemove', handleMove, true);
  document.removeEventListener('contextmenu', handleContext, true);
  clearHover();
  removeCtxMenu();
  showToast('✓ 编辑模式已关闭', 'success');
}

// -------- 悬停高亮 --------
let hoverEl = null;
function clearHover(){
  if (hoverEl){ hoverEl.classList.remove('ed-hover-target'); hoverEl = null; }
  document.querySelectorAll('.ed-block-hover').forEach(e => e.classList.remove('ed-block-hover'));
  const tip = document.getElementById('ed-tip');
  if (tip) tip.style.display = 'none';
}
function handleMove(e){
  if (!editMode) return;
  if (e.target.closest('.ed-toolbar, .ed-modal, .ed-panel, .ed-ctx-menu')) { clearHover(); return; }
  const target = findEditable(e.target);
  if (target !== hoverEl){
    if (hoverEl) hoverEl.classList.remove('ed-hover-target');
    hoverEl = target;
    if (hoverEl) hoverEl.classList.add('ed-hover-target');
  }
  const tip = document.getElementById('ed-tip');
  if (tip){
    if (target){
      tip.textContent = '左键改字 · 右键更多';
      tip.style.display = 'block';
      tip.style.left = e.clientX + 'px';
      tip.style.top = e.clientY + 'px';
    } else tip.style.display = 'none';
  }
}

// -------- 左键 = 改文字 --------
function handleClick(e){
  if (!editMode) return;
  if (e.target.closest('.ed-toolbar, .ed-modal, .ed-panel, .ed-ctx-menu')) return;
  const target = findEditable(e.target);
  if (!target) return;
  if (target.querySelector('.editing-inline-input')) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  clearHover();
  startEdit(target);
}

// -------- 右键 = 上下文菜单 --------
function handleContext(e){
  if (!editMode) return;
  if (e.target.closest('.ed-toolbar, .ed-modal, .ed-panel, .ed-ctx-menu')) return;
  e.preventDefault(); e.stopPropagation();
  const textTarget = findEditable(e.target);
  const blockTarget = findBlock(e.target);
  showCtxMenu(e.clientX, e.clientY, textTarget, blockTarget);
}
function showCtxMenu(x, y, textTarget, blockTarget){
  removeCtxMenu();
  const menu = document.createElement('div');
  menu.className = 'ed-ctx-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  const items = [];
  if (textTarget) items.push(`<div class="ed-ctx-item" data-op="edit">✏ 改文字</div>`);
  if (blockTarget){
    items.push(`<div class="ed-ctx-item" data-op="dupe">📋 复制一份（新增）</div>`);
    items.push(`<div class="ed-ctx-sep"></div>`);
    items.push(`<div class="ed-ctx-item danger" data-op="delete">🗑 删除此项</div>`);
  }
  items.push(`<div class="ed-ctx-sep"></div>`);
  items.push(`<div class="ed-ctx-item" data-op="cancel">取消</div>`);
  menu.innerHTML = items.join('');
  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 8) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 8) + 'px';
  menu.querySelectorAll('.ed-ctx-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      document.querySelectorAll('.ed-block-hover').forEach(e => e.classList.remove('ed-block-hover'));
      const op = item.dataset.op;
      if ((op === 'delete' || op === 'dupe') && blockTarget) blockTarget.classList.add('ed-block-hover');
    });
    item.addEventListener('click', () => {
      const op = item.dataset.op;
      removeCtxMenu();
      if (op === 'edit' && textTarget) startEdit(textTarget);
      else if (op === 'dupe' && blockTarget) duplicateBlock(blockTarget);
      else if (op === 'delete' && blockTarget) deleteBlock(blockTarget);
    });
  });
  setTimeout(() => document.addEventListener('click', removeCtxMenu, {once:true, capture:true}), 10);
}
function removeCtxMenu(){
  document.querySelectorAll('.ed-ctx-menu').forEach(m => m.remove());
  document.querySelectorAll('.ed-block-hover').forEach(e => e.classList.remove('ed-block-hover'));
}

// -------- 改文字 --------
function startEdit(el){
  const orig = extractText(el);
  const origHTML = el.innerHTML;
  const decorNodes = [];
  el.childNodes.forEach(n => {
    if (n.nodeType === 1 && isDecorative(n)) decorNodes.push(n.cloneNode(true));
  });
  const useTextarea = orig.length > 60;
  const input = document.createElement(useTextarea ? 'textarea' : 'input');
  input.className = 'editing-inline-input';
  input.value = orig;
  if (useTextarea){
    input.rows = Math.min(6, Math.ceil(orig.length / 40));
    input.style.width = '100%'; input.style.resize = 'vertical';
  } else input.style.width = Math.max(el.offsetWidth, 100) + 'px';
  let done = false;
  function commit(save){
    if (done) return; done = true;
    if (save){
      const val = input.value.trim();
      if (val && val !== orig){
        const sel = getSelector(el);
        state.texts[sel] = { old: orig, new: val, ts: Date.now() };
        saveState();
        el.innerHTML = '';
        decorNodes.forEach(icon => el.appendChild(icon.cloneNode(true)));
        el.appendChild(document.createTextNode(decorNodes.length ? ' ' + val : val));
        el.classList.add('edited-mark');
        updateBadge();
        showToast('✓ 已保存', 'success');
        return;
      }
    }
    el.innerHTML = origHTML;
  }
  input.addEventListener('blur', () => commit(true));
  input.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); commit(true); }
    if (ev.key === 'Escape'){ ev.preventDefault(); commit(false); }
  });
  el.innerHTML = '';
  decorNodes.forEach(icon => el.appendChild(icon.cloneNode(true)));
  if (decorNodes.length) el.appendChild(document.createTextNode(' '));
  el.appendChild(input);
  setTimeout(() => { input.focus(); input.select(); }, 10);
}

// -------- 删除 --------
function deleteBlock(el){
  const sel = getSelector(el);
  const h = el.offsetHeight;
  el.style.transition = 'all .25s ease';
  el.style.overflow = 'hidden'; el.style.opacity = '0'; el.style.transform = 'scale(0.9)';
  requestAnimationFrame(() => {
    el.style.height = h + 'px';
    requestAnimationFrame(() => {
      el.style.height = '0';
      el.style.marginTop = '0'; el.style.marginBottom = '0';
      el.style.paddingTop = '0'; el.style.paddingBottom = '0';
    });
  });
  setTimeout(() => el.remove(), 260);
  if (!state.deletes.includes(sel)) state.deletes.push(sel);
  saveState(); updateBadge();
  showToast('✓ 已删除（可在修改列表还原）', 'warn');
}

// -------- 复制 --------
function duplicateBlock(el){
  const sel = getSelector(el);
  const clone = el.cloneNode(true);
  clone.classList.add('ed-duped', 'edited-mark');
  el.parentNode.insertBefore(clone, el.nextSibling);
  clone.scrollIntoView({behavior:'smooth', block:'center'});
  const existing = state.dupes.find(d => d.sel === sel);
  if (existing) existing.count++;
  else state.dupes.push({sel, count:1});
  saveState(); updateBadge();
  showToast('✓ 已复制一份 · 可继续改新副本文字', 'success');
}

// -------- 工具栏 --------
function installToolbar(){
  installStyle();
  const bar = document.createElement('div');
  bar.className = 'ed-toolbar';
  bar.innerHTML = `
    <div class="ed-panel" id="ed-panel" style="display:none">
      <h4><span>🖊 原型编辑器</span><span style="font-size:11px;color:var(--ed-primary)">通用版 v1.0</span></h4>
      <div class="ed-hint">
        <b>三种操作：</b><br>
        · <b>左键</b> 任意文字 = 改字<br>
        · <b>右键</b> 任意区域 = 弹菜单 改/复制/删除<br>
        · <b>Enter</b> 保存 · <b>Esc</b> 取消<br>
        · 修改自动存 localStorage（项目：<code style="background:#fff7ed;padding:0 4px;border-radius:3px">${PROJECT_ID}</code>）<br>
        · <b>快捷键：Ctrl+E</b>
      </div>
      <button class="btn-secondary" id="ed-view">📋 查看当前页修改（<span id="ed-count-inline">${editCount()}</span>）</button>
      <button class="btn-primary" id="ed-export">📤 导出所有修改（JSON）</button>
      <button class="btn-danger" id="ed-clear">🗑 还原本页所有修改</button>
    </div>
    <button class="ed-btn" id="ed-toggle" title="点击开启编辑模式 · Ctrl+E">
      <span>🖊</span><span>编辑原型</span><span class="ed-count" id="ed-count">${editCount()}</span>
    </button>
  `;
  document.body.appendChild(bar);
  const tip = document.createElement('div');
  tip.className = 'ed-tip'; tip.id = 'ed-tip'; tip.textContent = '左键改字 · 右键更多';
  document.body.appendChild(tip);
  const toggleBtn = bar.querySelector('#ed-toggle');
  const panel = bar.querySelector('#ed-panel');
  toggleBtn.addEventListener('click', () => {
    if (editMode){
      deactivate(); toggleBtn.classList.remove('active');
      toggleBtn.querySelector('span:nth-child(2)').textContent = '编辑原型';
      panel.style.display = 'none';
    } else {
      activate(); toggleBtn.classList.add('active');
      toggleBtn.querySelector('span:nth-child(2)').textContent = '完成编辑';
      panel.style.display = 'block';
    }
  });
  bar.querySelector('#ed-view').addEventListener('click', showEditList);
  bar.querySelector('#ed-export').addEventListener('click', exportEdits);
  bar.querySelector('#ed-clear').addEventListener('click', () => {
    if (confirm('确定还原本页所有修改？（文字/删除/新增全部清空）')){
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });
}
function updateBadge(){
  const n = editCount();
  document.querySelectorAll('#ed-count, #ed-count-inline').forEach(el => { el.textContent = n; });
}

// -------- 修改列表弹窗 --------
function showEditList(){
  const escapeHtml = s => String(s || '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
  const textRows = Object.entries(state.texts).map(([sel, v]) => `
    <tr><td><span style="background:var(--ed-primary);color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">改字</span></td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace;font-size:10px;color:#9a3412" title="${escapeHtml(sel)}">${escapeHtml(sel)}</td>
      <td style="color:#dc2626;text-decoration:line-through;max-width:160px;word-break:break-all">${escapeHtml(v.old)}</td>
      <td style="color:#16a34a;font-weight:600;max-width:160px;word-break:break-all">${escapeHtml(v.new)}</td>
      <td><button class="ed-undo" data-type="text" data-sel="${escapeHtml(sel)}" style="background:#fee;border:1px solid #fca5a5;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:11px;color:#b91c1c">还原</button></td></tr>`).join('');
  const delRows = state.deletes.map(sel => `
    <tr><td><span style="background:#dc2626;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">删除</span></td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace;font-size:10px;color:#9a3412" title="${escapeHtml(sel)}">${escapeHtml(sel)}</td>
      <td colspan="2" style="color:#9ca3af">— 元素已隐藏 —</td>
      <td><button class="ed-undo" data-type="delete" data-sel="${escapeHtml(sel)}" style="background:#fee;border:1px solid #fca5a5;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:11px;color:#b91c1c">恢复</button></td></tr>`).join('');
  const dupeRows = state.dupes.map(d => `
    <tr><td><span style="background:#16a34a;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">新增</span></td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace;font-size:10px;color:#9a3412" title="${escapeHtml(d.sel)}">${escapeHtml(d.sel)}</td>
      <td colspan="2" style="color:#16a34a">复制了 ${d.count} 份</td>
      <td><button class="ed-undo" data-type="dupe" data-sel="${escapeHtml(d.sel)}" style="background:#fee;border:1px solid #fca5a5;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:11px;color:#b91c1c">撤销</button></td></tr>`).join('');
  const rows = textRows + delRows + dupeRows;
  const mask = document.createElement('div'); mask.className = 'ed-mask';
  const modal = document.createElement('div'); modal.className = 'ed-modal';
  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:14px">
      <b style="color:var(--ed-primary-deep);font-size:15px">当前页修改列表（共 ${editCount()} 处）</b>
      <span style="cursor:pointer;font-size:20px;color:#9a3412;padding:0 8px" id="ed-close">✕</span>
    </div>
    <div style="font-size:11px;color:#9a3412;margin-bottom:8px">💡 改字 ${Object.keys(state.texts).length} · 删除 ${state.deletes.length} · 新增 ${state.dupes.reduce((a,d)=>a+d.count,0)}</div>
    <table>
      <thead><tr><th>类型</th><th>选择器</th><th>原文</th><th>新文</th><th>操作</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9a3412">暂无修改</td></tr>'}</tbody>
    </table>`;
  mask.onclick = () => { modal.remove(); mask.remove(); };
  document.body.appendChild(mask); document.body.appendChild(modal);
  modal.querySelector('#ed-close').onclick = () => { modal.remove(); mask.remove(); };
  modal.querySelectorAll('.ed-undo').forEach(b => {
    b.onclick = () => {
      const t = b.dataset.type, sel = b.dataset.sel;
      if (t === 'text') delete state.texts[sel];
      else if (t === 'delete') state.deletes = state.deletes.filter(x => x !== sel);
      else if (t === 'dupe') state.dupes = state.dupes.filter(x => x.sel !== sel);
      saveState(); showToast('已还原 · 刷新查看', 'success');
      modal.remove(); mask.remove(); updateBadge();
    };
  });
}

// -------- 导出 --------
function exportEdits(){
  const prefix = 'ed_' + PROJECT_ID + '::';
  const all = {};
  Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => {
    try {
      const page = k.slice(prefix.length);
      const d = JSON.parse(localStorage.getItem(k));
      if (d) all[page] = d;
    } catch(e){}
  });
  if (Object.keys(all).length === 0){ showToast('暂无修改可导出', 'warn'); return; }
  const blob = new Blob([JSON.stringify({project: PROJECT_ID, exported: new Date().toISOString(), pages: all}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'edits-' + PROJECT_ID + '-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('已导出 ' + Object.keys(all).length + ' 个页面的修改', 'success');
}

// -------- 快捷键 --------
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e'){
    e.preventDefault();
    const btn = document.querySelector('#ed-toggle');
    if (btn) btn.click();
  }
});

// -------- Toast --------
function showToast(msg, type){
  let t = document.getElementById('ed-toast-el');
  if (!t){
    t = document.createElement('div');
    t.id = 'ed-toast-el'; t.className = 'ed-toast'; t.style.opacity = '0';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  const bgMap = {
    success: 'linear-gradient(135deg,var(--ed-success),var(--ed-success-dark))',
    warn:    'linear-gradient(135deg,var(--ed-warn),#d97706)',
    default: 'linear-gradient(135deg,var(--ed-primary),var(--ed-primary-dark))'
  };
  t.style.background = bgMap[type] || bgMap.default;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2400);
}

// -------- 启动 --------
function boot(){ applyState(); installToolbar(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

// -------- 公开 API（可选，供开发者控制台调用）--------
window.InlineEditor = {
  version: '1.0-universal',
  project: PROJECT_ID,
  page: PAGE_ID,
  getState: () => JSON.parse(JSON.stringify(state)),
  clearPage: () => { localStorage.removeItem(STORAGE_KEY); location.reload(); },
  clearAll: () => {
    const prefix = 'ed_' + PROJECT_ID + '::';
    Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k));
    location.reload();
  },
  activate, deactivate, export: exportEdits
};

})();
