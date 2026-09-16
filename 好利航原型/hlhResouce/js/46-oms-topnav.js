/* ================= OMS 横版菜单（布局切换演示） =================
 * terminal=oms 时，头部右侧出现「横版 / 竖版」切换按钮：
 * - 竖版（默认）：左侧边栏，现状不变；
 * - 横版：隐藏侧边栏，菜单渲染成顶部横向导航 —— 客户中心的子项平铺成顶部一级项，
 *   有下级的收成悬停下拉，客户端APP 单独一个下拉。
 * 选择持久化在 localStorage('hlh-oms-layout')，只对 OMS 端生效，TMS / PDA 不受影响。
 * 横版时 sidebar-nav 会被清空（菜单搬到 topnav），保证 data-id 全文档唯一，
 * switchTab 的 active 高亮才会落在顶部菜单上；切回竖版时 renderMenu() 重画侧边栏。 */
var _omsLayout=(function(){
    var v='';
    try{v=localStorage.getItem('hlh-oms-layout')||'';}catch(e){}
    return v==='horizontal'?'horizontal':'vertical';
})();

function omsLayoutIsOms(){
    return (typeof _currentTerminal!=='undefined')&&_currentTerminal==='oms';
}
function omsLayoutIsHorizontal(){
    return omsLayoutIsOms()&&_omsLayout==='horizontal';
}

function setOmsLayout(mode){
    _omsLayout=mode==='horizontal'?'horizontal':'vertical';
    try{localStorage.setItem('hlh-oms-layout',_omsLayout);}catch(e){}
    applyOmsLayout();
    showToast(tr(_omsLayout==='horizontal'?'已切换为横版菜单':'已切换为竖版菜单'));
}

/* 顶部导航的条目清单：客户中心(oms-client)的子项平铺成一级项，
 * 其它 L1（客户端APP）保持「一个 L1 一个下拉」 */
function omsTopEntries(){
    const currentRole=DEMO_ACCOUNTS.find(function(a){return a.id===_currentAccount;})?.role||'role-admin';
    const allowedMenus=ROLE_MENUS[currentRole]||ROLE_MENUS['role-admin'];
    const allowedByTerminal=TERMINAL_MENUS[_currentTerminal]||TERMINAL_MENUS['tms'];
    var entries=[];
    menuData.forEach(function(l1){
        if(!allowedByTerminal.includes(l1.id))return;
        if(!allowedMenus.includes(l1.id))return;
        const l1Label=langText(l1.langKey,l1.label);
        if(l1.id==='oms-client'&&l1.children&&l1.children.length){
            l1.children.forEach(function(l2){entries.push({node:l2,l1Label:l1Label});});
        }else{
            entries.push({node:l1,l1Label:l1Label});
        }
    });
    return entries;
}

function topNavItemAttrs(node,l1Label,l2Label,l3Label){
    return ' data-id="'+node.id+'" data-tab="'+(node.tab||'')+'" data-page="'+(node.page||'')+
        '" data-l1="'+l1Label+'"'+(l2Label?'" data-l2="'+l2Label:'')+
        (l3Label?'" data-l3="'+l3Label:'')+'" data-langkey="'+(node.langKey||'')+'"';
}

function topNavDropdownItems(node,l1Label,isL1){
    var items='';
    (node.children||[]).forEach(function(l2){
        if(l2.terminalOnly&&l2.terminalOnly!==_currentTerminal)return;
        const l2Label=langText(l2.langKey,l2.label);
        if(l2.children&&l2.children.length){
            if(isL1)items+='<div class="px-3 pt-2.5 pb-1 text-[11px] font-semibold text-text-muted">'+esc(l2Label)+'</div>';
            l2.children.forEach(function(l3){
                if(l3.terminalOnly&&l3.terminalOnly!==_currentTerminal)return;
                const l3Label=langText(l3.langKey,l3.label);
                items+='<div class="menu-l3 flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-primary-50 hover:text-primary-700 cursor-pointer rounded-lg"'+topNavItemAttrs(l3,l1Label,l2Label,l3Label)+' onclick="selectMenuItem(this,event)">'+
                    '<span class="l3-dot w-1.5 h-1.5 rounded-full bg-text-muted flex-shrink-0"></span>'+
                    '<span class="l3-label">'+esc(l3Label)+'</span></div>';
            });
        }else{
            items+='<div class="menu-l2-direct flex items-center px-3 py-2 text-sm font-medium text-text-secondary hover:bg-primary-50 hover:text-primary-700 cursor-pointer rounded-lg"'+topNavItemAttrs(l2,l1Label,l2Label)+' onclick="selectMenuItem(this,event)">'+
                '<span class="l2d-label">'+esc(l2Label)+'</span></div>';
        }
    });
    return items;
}

function renderTopNavHtml(){
    /* z-40：下面的标签页栏是 z-30，同层级按 DOM 顺序后者会盖住前者 ——
     * 下拉被顶在 topnav 的层叠上下文里出不来，必须整栏高过它 */
    var h='<div class="h-12 bg-white border-b border-surface-200 flex items-center px-4 gap-1 flex-shrink-0 z-40 relative">';
    /* 左端：Logo + 系统名（横版没有侧边栏，品牌区搬到这里） */
    h+='<div class="flex items-center gap-2.5 pr-4 mr-2 border-r border-surface-200 flex-shrink-0">';
    h+='<div class="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg></div>';
    h+='<div class="text-sm font-bold text-text-primary whitespace-nowrap">'+esc(tr('好利航物流'))+'</div></div>';
    omsTopEntries().forEach(function(e){
        var node=e.node;
        var label=langText(node.langKey,node.label);
        if(node.children&&node.children.length){
            var isL1=!!node.icon;
            h+='<div class="relative group flex-shrink-0">';
            h+='<button type="button" class="h-9 px-3.5 inline-flex items-center gap-1.5 text-sm font-medium text-text-primary rounded-lg hover:bg-surface-50 cursor-pointer whitespace-nowrap">'+
                esc(label)+'<svg class="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>';
            h+='<div class="hidden group-hover:block absolute left-0 top-full pt-1 z-50"><div class="min-w-[180px] bg-white rounded-xl shadow-lg border border-surface-200 p-1.5">'+
                topNavDropdownItems(node,e.l1Label,isL1)+'</div></div>';
            h+='</div>';
        }else{
            h+='<div class="menu-l2-direct flex-shrink-0 h-9 px-3.5 inline-flex items-center text-sm font-medium text-text-primary rounded-lg hover:bg-surface-50 cursor-pointer whitespace-nowrap"'+topNavItemAttrs(node,e.l1Label,label)+' onclick="selectMenuItem(this,event)">'+
                '<span class="l2d-label">'+esc(label)+'</span></div>';
        }
    });
    h+='</div>';
    return h;
}

/* 切换按钮：OMS 端才渲染，插在头部右侧控件区最前面 */
function omsLayoutToggleHtml(){
    var toHorizontal=_omsLayout!=='horizontal';
    var icon=toHorizontal
        ?'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 5h16M4 12h16M4 19h16"/></svg>'
        :'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 5h7v14H4zM15 5h5v14h-5z"/></svg>';
    return '<button type="button" id="layout-toggle" onclick="setOmsLayout(\''+(toHorizontal?'horizontal':'vertical')+'\')" title="'+esc(tr(toHorizontal?'切换为横版菜单':'切换为竖版菜单'))+'" class="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary border border-surface-200 rounded-lg bg-white hover:bg-surface-50 cursor-pointer flex-shrink-0">'+
        icon+'<span>'+tr(toHorizontal?'横版':'竖版')+'</span></button>';
}
function renderLayoutToggle(){
    var old=document.getElementById('layout-toggle');
    if(old)old.remove();
    if(!omsLayoutIsOms())return;
    var host=document.querySelector('#main-app .h-16 div.flex.items-center.gap-3.flex-shrink-0');
    if(!host)return;
    var wrap=document.createElement('div');
    wrap.innerHTML=omsLayoutToggleHtml();
    host.insertBefore(wrap.firstChild,host.firstChild);
}

function syncTopNavActive(){
    var nav=document.getElementById('topnav');
    if(!nav)return;
    nav.querySelectorAll('.menu-l3.active,.menu-l2-direct.active,.menu-l1-direct.active').forEach(function(i){i.classList.remove('active');});
    var item=nav.querySelector('[data-id="'+_activeTab+'"]');
    if(item)item.classList.add('active');
}

function applyOmsLayout(){
    var sidebar=document.getElementById('sidebar');
    var old=document.getElementById('topnav');
    if(old)old.remove();
    renderLayoutToggle();
    var horizontal=omsLayoutIsHorizontal();
    /* 顶部的汉堡按钮在横版下没有意义（侧边栏已隐藏且菜单搬走），一并藏掉 */
    var hb=document.querySelector('#main-app .h-16 .flex.items-center.gap-2 > button');
    if(hb)hb.style.display=horizontal?'none':'';
    if(!sidebar)return;
    if(!horizontal){
        sidebar.classList.remove('hidden');
        return;
    }
    sidebar.classList.add('hidden');
    /* 菜单搬到 topnav 后把侧边栏菜单清空，保证 data-id 唯一，active 高亮才落在顶部 */
    var nav=document.getElementById('sidebar-nav');
    if(nav)nav.innerHTML='';
    var rightCol=sidebar.nextElementSibling;
    if(!rightCol)return;
    var top=document.createElement('div');
    top.id='topnav';
    top.innerHTML=renderTopNavHtml();
    rightCol.insertBefore(top,rightCol.firstChild);
    syncTopNavActive();
}

/* renderMenu 在登录 / 切账号时重画侧边栏，顺带把布局重新套上 */
var _renderMenuOmsLayout=(typeof renderMenu==='function')?renderMenu:null;
if(_renderMenuOmsLayout){
    renderMenu=function(){
        _renderMenuOmsLayout.apply(this,arguments);
        applyOmsLayout();
    };
}
