/* ===== 客服 · 轨迹查询 cs-track-query =====
   多单号标签式查询 + 历史记录 + 轨迹卡片（可展开时间轴）+ 子单轨迹弹窗。
   配色沿用主体蓝白风格：查询按钮/时间轴节点用 primary，状态徽章走全局 statusBadge。 */

var _tqTags=['H2608180007','H2608180006','H2608220003'];
var _tqHistory=['H2608220003','H2608180006','H2608180007'];
var _tqExpanded={};      /* 主单展开状态 code -> true */
var _tqSubExpanded={};   /* 子单展开状态 subCode -> true */
var _tqSubOwner='';      /* 子单轨迹弹窗当前对应的主单号 */

var TQ_ORDERS={
'H2608180006':{orderTime:'2026-08-18 11:15:05',country:'US',status:'已到货',subCount:4,events:[
    {time:'2026-08-18 11:31:58',by:'天地总部管理员',loc:'',cn:'终配舱登记已完成',en:'The final cabin allocation registration has been completed'},
    {time:'2026-08-18 11:25:32',by:'天地仓管理员',loc:'',cn:'仓库收货已完成',en:'The warehouse receipt process has been completed'},
    {time:'2026-08-18 11:15:05',by:'天地总部管理员',loc:'',cn:'客户已提交预报',en:'Customer has submitted order'}
]},
'H2608180007':{orderTime:'2026-08-18 11:15:07',country:'US',status:'已到货',subCount:3,events:[
    {time:'2026-08-18 11:31:58',by:'天地总部管理员',loc:'',cn:'终配舱登记已完成',en:'The final cabin allocation registration has been completed'},
    {time:'2026-08-18 11:25:22',by:'天地仓管理员',loc:'',cn:'仓库收货已完成',en:'The warehouse receipt process has been completed'},
    {time:'2026-08-18 11:15:07',by:'天地总部管理员',loc:'',cn:'客户已提交预报',en:'Customer has submitted order'}
]},
'H2608220003':{orderTime:'2026-08-22 09:54:44',country:'US',status:'已到货',subCount:2,events:[
    {time:'2026-08-22 10:40:17',by:'天地仓管理员',loc:'',cn:'仓库收货已完成',en:'The warehouse receipt process has been completed'},
    {time:'2026-08-22 09:54:44',by:'天地总部管理员',loc:'',cn:'客户已提交预报',en:'Customer has submitted order'}
]}
};

/* 查不到的单号也给一条兜底记录，保证原型演示不出现空白卡片 */
function tqOrderOf(code){
    if(TQ_ORDERS[code])return TQ_ORDERS[code];
    return {orderTime:'—',country:'—',status:'已预报',subCount:1,events:[
        {time:'—',by:'—',loc:'',cn:'客户已提交预报',en:'Customer has submitted order'}
    ]};
}

function tqLatest(o){ return (o.events&&o.events[0])||{time:'—',cn:'—',en:''}; }

function tqBoxIconHtml(){
    return '<svg class="w-10 h-10 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>';
}

/* ---------- 查询栏 ---------- */
function tqSearchBarHtml(){
    var h='<div class="flex items-center justify-center gap-2 flex-wrap">';
    h+='<div class="flex items-center gap-1.5 flex-wrap min-h-[38px] w-[560px] max-w-full px-2 py-1.5 border border-surface-200 rounded-lg bg-white">';
    h+='<span id="tq-tags" class="contents">'+tqTagsHtml()+'</span>';
    h+='<input id="tq-input" onkeydown="tqInputKey(event)" class="flex-1 min-w-[120px] h-7 px-1 text-sm bg-transparent outline-none" placeholder="'+esc(tr('输入运单号后回车，可输入多个'))+'">';
    h+='<button type="button" onclick="tqClearTags()" title="'+esc(tr('清空'))+'" class="w-5 h-5 rounded-full text-text-muted hover:bg-surface-100 hover:text-text-secondary cursor-pointer leading-none">×</button>';
    h+='</div>';
    h+='<button type="button" onclick="tqRunQuery()" class="h-9 px-5 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">';
    h+='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'+tr('查询')+'</button>';
    h+='</div>';
    return h;
}

function tqTagsHtml(){
    return _tqTags.map(function(t,i){
        return '<span class="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded bg-primary-50 border border-primary-100 text-primary-700 text-xs whitespace-nowrap">'+esc(t)+
            '<button type="button" onclick="tqRemoveTag('+i+')" class="w-4 h-4 rounded hover:bg-primary-100 cursor-pointer leading-none">×</button></span>';
    }).join('');
}

function tqHistoryHtml(){
    if(!_tqHistory.length)return '<div id="tq-history"></div>';
    var h='<div id="tq-history" class="flex items-center justify-center gap-2 flex-wrap mt-3 text-xs">';
    h+='<span class="text-text-secondary">'+tr('历史记录')+'：</span>';
    _tqHistory.forEach(function(t,i){
        h+='<span class="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded border border-surface-200 bg-surface-50 text-text-secondary whitespace-nowrap">';
        h+='<button type="button" onclick="tqUseHistory(\''+esc(t)+'\')" class="cursor-pointer hover:text-primary-600">'+esc(t)+'</button>';
        h+='<button type="button" onclick="tqRemoveHistory('+i+')" class="w-4 h-4 rounded hover:bg-surface-200 cursor-pointer leading-none">×</button></span>';
    });
    h+='</div>';
    return h;
}

/* ---------- 卡片 ---------- */
/* opts: {expanded, showSub, onToggle} */
function tqCardHtml(code,o,opts){
    opts=opts||{};
    var last=tqLatest(o);
    var expanded=!!opts.expanded;
    var toggle=opts.onToggle||'';
    var h='<div class="rounded-xl border border-surface-200 bg-white overflow-hidden">';
    h+='<div class="flex items-start gap-4 px-4 py-3 '+(expanded?'bg-surface-50/70':'bg-white hover:bg-surface-50/50')+(toggle?' cursor-pointer':'')+'"'+(toggle?' onclick="'+toggle+'"':'')+'>';
    h+='<div class="flex items-center gap-3 w-56 flex-shrink-0">'+tqBoxIconHtml();
    h+='<div class="min-w-0"><div class="text-sm font-medium text-primary-700 truncate">'+esc(code)+'</div>';
    h+='<div class="mt-1.5">'+statusBadge(o.status||'已预报')+'</div></div></div>';
    h+='<div class="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1.5 text-xs">';
    h+=tqField('下单时间',o.orderTime)+tqField('运单号',opts.wbNo||code)+tqField('客户单号',opts.custNo||code);
    h+=tqField('收件国家',o.country)+tqField('轨迹时间',last.time)+tqField('轨迹发送地',last.loc||'-');
    h+='<div class="md:col-span-3"><span class="text-text-secondary">'+tr('轨迹内容')+'：</span>'+
        '<span class="text-text-primary font-medium">'+esc(last.cn||'')+'</span>'+
        (last.en?'<span class="ml-2 text-primary-600">'+esc(last.en)+'</span>':'')+'</div>';
    h+='</div>';
    h+='<div class="flex items-center gap-2 flex-shrink-0">';
    if(opts.showSub){
        h+='<button type="button" onclick="event.stopPropagation();openTqSubModal(\''+esc(code)+'\')" class="h-7 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">'+tr('子单轨迹')+'</button>';
    }
    if(toggle)h+=tqChevronHtml(expanded);
    h+='</div></div>';
    if(expanded)h+='<div class="px-4 py-3 border-t border-surface-100">'+tqTimelineHtml(o.events)+'</div>';
    h+='</div>';
    return h;
}

function tqField(label,val){
    return '<div><span class="text-text-secondary">'+tr(label)+'：</span><span class="text-text-primary">'+esc(val==null||val===''?'-':val)+'</span></div>';
}

function tqChevronHtml(expanded){
    var d=expanded?'M5 15l7-7 7 7':'M19 9l-7 7-7-7';
    return '<svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="'+d+'"/></svg>';
}

function tqTimelineHtml(events){
    events=events||[];
    if(!events.length)return '<div class="py-6 text-center text-xs text-text-muted">'+tr('暂无轨迹')+'</div>';
    var h='<div class="relative pl-9">';
    h+='<div class="absolute left-[11px] top-6 bottom-3 w-px bg-primary-200"></div>';
    events.forEach(function(e,i){
        h+='<div class="relative pb-4 last:pb-0">';
        h+='<div class="absolute -left-9 top-0 w-6 h-6 rounded-full border-2 border-primary-500 bg-white text-primary-600 text-[11px] font-semibold flex items-center justify-center">'+(i+1)+'</div>';
        h+='<div class="text-xs text-text-primary">'+esc(e.time||'')+
            '<span class="ml-2 text-text-secondary">【'+tr('创建人')+'：'+esc(e.by||'-')+'　'+tr('发生地')+'：'+esc(e.loc||'-')+'】</span></div>';
        h+='<div class="mt-1 text-xs"><span class="text-text-primary font-medium">'+esc(e.cn||'')+'</span>'+
            (e.en?'<span class="ml-2 text-primary-600">'+esc(e.en)+'</span>':'')+'</div>';
        h+='</div>';
    });
    h+='</div>';
    return h;
}

/* ---------- 结果区 ---------- */
function tqResultsHtml(){
    if(!_tqTags.length){
        return '<div class="py-20 text-center text-sm text-text-muted">'+tr('请输入运单号后点击查询')+'</div>';
    }
    return '<div class="space-y-3">'+_tqTags.slice().sort().map(function(code){
        var o=tqOrderOf(code);
        return tqCardHtml(code,o,{expanded:_tqExpanded[code]!==false,showSub:true,onToggle:'tqToggle(\''+code+'\')'});
    }).join('')+'</div>';
}

function generateTrackQueryPage(id){
    _tqExpanded={};
    let h='<div class="h-full overflow-auto bg-surface-50">';
    h+='<div class="max-w-[1600px] mx-auto px-6 py-5">';
    h+='<div class="mb-5">'+tqSearchBarHtml()+tqHistoryHtml()+'</div>';
    h+='<div id="tq-results">'+tqResultsHtml()+'</div>';
    h+='</div></div>';
    return h;
}

/* ---------- 交互 ---------- */
function tqRenderTags(){
    var el=document.getElementById('tq-tags');
    if(el)el.innerHTML=tqTagsHtml();
}
function tqRenderResults(){
    var el=document.getElementById('tq-results');
    if(el)el.innerHTML=tqResultsHtml();
}
function tqRenderHistory(){
    var box=document.getElementById('tq-history');
    if(box)box.outerHTML=tqHistoryHtml();
}

function tqAddTag(code){
    code=String(code||'').trim();
    if(!code)return false;
    if(_tqTags.indexOf(code)<0)_tqTags.push(code);
    var hi=_tqHistory.indexOf(code);
    if(hi>=0)_tqHistory.splice(hi,1);
    _tqHistory.unshift(code);
    if(_tqHistory.length>8)_tqHistory.length=8;
    return true;
}

function tqInputKey(ev){
    if(!ev||(ev.key!=='Enter'&&ev.keyCode!==13))return;
    var inp=document.getElementById('tq-input');
    var v=inp?inp.value:'';
    /* 支持一次粘贴多个：空格 / 逗号 / 分号 / 换行分隔 */
    var added=0;
    String(v).split(/[\s,，;；\r\n]+/).forEach(function(x){ if(tqAddTag(x))added++; });
    if(inp)inp.value='';
    if(added){ tqRenderTags(); tqRenderHistory(); tqRenderResults(); }
}

function tqRemoveTag(i){
    var code=_tqTags[i];
    _tqTags.splice(i,1);
    delete _tqExpanded[code];
    tqRenderTags(); tqRenderResults();
}

function tqClearTags(){
    _tqTags=[];_tqExpanded={};
    var inp=document.getElementById('tq-input'); if(inp)inp.value='';
    tqRenderTags(); tqRenderResults();
}

function tqRunQuery(){
    var inp=document.getElementById('tq-input');
    if(inp&&inp.value.trim()){
        String(inp.value).split(/[\s,，;；\r\n]+/).forEach(function(x){ tqAddTag(x); });
        inp.value='';
        tqRenderTags(); tqRenderHistory();
    }
    if(!_tqTags.length){ showToast(tr('请先输入运单号')); return; }
    tqRenderResults();
    showToast(tr('已查询')+' '+_tqTags.length+' '+tr('个单号'));
}

function tqUseHistory(code){
    if(tqAddTag(code)){ tqRenderTags(); tqRenderHistory(); tqRenderResults(); }
}

function tqRemoveHistory(i){
    _tqHistory.splice(i,1);
    tqRenderHistory();
}

function tqToggle(code){
    _tqExpanded[code]=(_tqExpanded[code]===false);
    tqRenderResults();
}

/* ---------- 子单轨迹弹窗 ---------- */
function tqSubCodes(code){
    var o=tqOrderOf(code),n=o.subCount||1,list=[];
    for(var i=1;i<=n;i++)list.push(code+'U'+String(i).padStart(4,'0'));
    return list;
}

function tqSubBodyHtml(code){
    var o=tqOrderOf(code);
    var subs=tqSubCodes(code);
    return '<div class="space-y-3">'+subs.map(function(sc,i){
        /* 默认展开第一条子单，其余收起 */
        var open=_tqSubExpanded[sc]!==undefined?_tqSubExpanded[sc]:(i===0);
        /* 子单卡片的运单号 / 客户单号回填主单号 */
        return tqCardHtml(sc,o,{expanded:open,showSub:false,wbNo:code,custNo:code,onToggle:'tqToggleSub(\''+sc+'\')'});
    }).join('')+'</div>';
}

function openTqSubModal(code){
    _tqSubOwner=code;_tqSubExpanded={};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='78%';
    document.getElementById('crud-modal-title').textContent=tr('子单轨迹');
    document.getElementById('crud-modal-body').innerHTML='<div id="tq-sub-body">'+tqSubBodyHtml(code)+'</div>';
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function tqToggleSub(sc){
    var subs=tqSubCodes(_tqSubOwner);
    var idx=subs.indexOf(sc);
    var cur=_tqSubExpanded[sc]!==undefined?_tqSubExpanded[sc]:(idx===0);
    _tqSubExpanded[sc]=!cur;
    var el=document.getElementById('tq-sub-body');
    if(el)el.innerHTML=tqSubBodyHtml(_tqSubOwner);
}
