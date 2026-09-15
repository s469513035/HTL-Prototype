/* ===== 客服 · 轨迹查询 cs-track-query =====
   多单号标签式查询 + 历史记录 + 轨迹卡片（可展开时间轴）+ 子单轨迹弹窗。
   配色沿用主体蓝白风格：查询按钮/时间轴节点用 primary，状态徽章走全局 statusBadge。 */

/* 默认标签里放一个查不到的单号（H2609120009），否则「未查到」这条路没有入口可演示 */
var _tqTags=['H2609050001','H2608180006','H2608220003','H2609120009'];
var _tqHistory=['H2608280002','H2608220003','H2608180007','H2609050001'];
var _tqExpanded={};      /* 主单展开状态 code -> true */
var _tqSubExpanded={};   /* 子单展开状态 subCode -> true */
var _tqSubOwner='';      /* 子单轨迹弹窗当前对应的主单号 */
/* OMS 客户端也用这张页（oms-track-query）。客户视角下不重复渲染英文轨迹文案。
 * 「创建人」两端都不再展示，所以不归这个开关管。 */
var _tqCustomerView=false;
/* 批量查询结果的节点筛选：'' = 全部；进度节点名；'__nf__' = 未查到 */
var _tqFilter='';

var TQ_ORDERS={
/* 海运 · 深圳→达喀尔：已离港在途（进度 2/4，当前节点 pulse 演示） */
'H2609050001':{orderTime:'2026-09-05 10:20:31',country:'达喀尔港',status:'已离港',subCount:6,events:[
    {time:'2026-09-11 08:40:12',by:'天地总部管理员',loc:'南海海域',cn:'船舶正常航行中（船名 COSCO STAR / 航次 0612W）',en:'Vessel sailing normally (COSCO STAR / Voyage 0612W)'},
    {time:'2026-09-08 19:25:40',by:'天地总部管理员',loc:'深圳盐田港',cn:'已离港，预计 10-03 抵达达喀尔港',en:'Departed from port, ETA Dakar Port on 10-03'},
    {time:'2026-09-08 09:12:05',by:'天地总部管理员',loc:'深圳盐田港',cn:'报关放行，货物已装船',en:'Customs released, cargo loaded on board'},
    {time:'2026-09-07 16:48:33',by:'天地仓管理员',loc:'深圳盐田仓',cn:'配舱出库完成，货柜已拖至码头',en:'Load plan outbound completed, container hauled to terminal'},
    {time:'2026-09-06 14:22:18',by:'天地仓管理员',loc:'深圳盐田仓',cn:'仓库收货已完成（42件 / 860.5KG / 3.28CBM）',en:'Warehouse receipt completed (42pcs / 860.5KG / 3.28CBM)'},
    {time:'2026-09-05 10:20:31',by:'天地总部管理员',loc:'',cn:'客户已提交预报',en:'Customer has submitted order'}
]},
/* 海运 · 深圳→拉各斯：已到港清关中（进度 3/4） */
'H2608280002':{orderTime:'2026-08-28 09:05:12',country:'拉各斯港',status:'已到港',subCount:3,events:[
    {time:'2026-09-13 11:30:22',by:'天地海外仓管理员',loc:'拉各斯港',cn:'到港清关中，预计 2 天完成',en:'Arrived at port, customs clearance in progress, est. 2 days'},
    {time:'2026-09-13 06:15:48',by:'天地海外仓管理员',loc:'拉各斯港',cn:'船舶已抵港，等待靠泊卸货',en:'Vessel arrived, waiting for berth'},
    {time:'2026-09-02 21:40:05',by:'天地总部管理员',loc:'深圳盐田港',cn:'已离港（船名 MAERSK LAGOS / 航次 0836W）',en:'Departed (MAERSK LAGOS / Voyage 0836W)'},
    {time:'2026-08-31 15:52:30',by:'天地仓管理员',loc:'深圳盐田仓',cn:'配舱出库完成，货柜已拖至码头',en:'Load plan outbound completed, container hauled to terminal'},
    {time:'2026-08-29 10:18:44',by:'天地仓管理员',loc:'深圳盐田仓',cn:'仓库收货已完成（55件 / 1,120KG / 4.31CBM）',en:'Warehouse receipt completed (55pcs / 1,120KG / 4.31CBM)'},
    {time:'2026-08-28 09:05:12',by:'天地总部管理员',loc:'',cn:'客户已提交预报',en:'Customer has submitted order'}
]},
/* 空运 · 美国线：已签收（进度 4/4 全完成演示） */
'H2608180006':{orderTime:'2026-08-18 11:15:05',country:'US',status:'已签收',subCount:4,events:[
    {time:'2026-08-20 15:30:26',by:'天地海外仓管理员',loc:'洛杉矶海外仓',cn:'客户已签收，运单完结',en:'Signed by customer, shipment closed'},
    {time:'2026-08-19 09:42:11',by:'天地海外仓管理员',loc:'洛杉矶机场',cn:'已到港，转海外仓派送',en:'Arrived at airport, transferred to overseas warehouse for delivery'},
    {time:'2026-08-18 22:05:47',by:'天地总部管理员',loc:'广州白云机场',cn:'航班已起飞（CA985）',en:'Flight departed (CA985)'},
    {time:'2026-08-18 11:31:58',by:'天地总部管理员',loc:'',cn:'终配舱登记已完成',en:'The final cabin allocation registration has been completed'},
    {time:'2026-08-18 11:25:32',by:'天地仓管理员',loc:'',cn:'仓库收货已完成',en:'The warehouse receipt process has been completed'},
    {time:'2026-08-18 11:15:05',by:'天地总部管理员',loc:'',cn:'客户已提交预报',en:'Customer has submitted order'}
]},
/* 空运 · 美国线：在途（进度 2/4） */
'H2608180007':{orderTime:'2026-08-18 11:15:07',country:'US',status:'已离港',subCount:3,events:[
    {time:'2026-08-19 01:12:33',by:'天地总部管理员',loc:'太平洋上空',cn:'航班飞行中，预计 08-19 22:40 抵达',en:'Flight in transit, ETA 08-19 22:40'},
    {time:'2026-08-18 23:48:09',by:'天地总部管理员',loc:'广州白云机场',cn:'航班已起飞（CA987）',en:'Flight departed (CA987)'},
    {time:'2026-08-18 11:31:58',by:'天地总部管理员',loc:'',cn:'终配舱登记已完成',en:'The final cabin allocation registration has been completed'},
    {time:'2026-08-18 11:25:22',by:'天地仓管理员',loc:'',cn:'仓库收货已完成',en:'The warehouse receipt process has been completed'},
    {time:'2026-08-18 11:15:07',by:'天地总部管理员',loc:'',cn:'客户已提交预报',en:'Customer has submitted order'}
]},
/* 空运 · 美国线：刚入仓（进度 1/4） */
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

/* ---------- 进度条：已下单→已入仓→已离港→已到港→已签收 ---------- */
var TQ_PROGRESS_STEPS=['已下单','已入仓','已离港','已到港','已签收'];
function tqProgressOf(status){
    var map={'草稿':0,'已预报':0,'已确认':0,'已到货':1,'已配舱':1,'已出库':2,'已离港':2,'在途':2,'已到港':3,'海外已到仓':3,'海外已出仓':3,'已签收':4,'已退件':4,'已取消':0};
    return map[status]!==undefined?map[status]:0;
}
/* 状态色调：按所处阶段/结局分四档，卡片的左侧色条、状态胶囊、进度条、当前动态条都用它，
 * 这样「当前是什么状态」在一张卡上有四处一致的视觉呼应，扫一眼就能分辨。 */
function tqStatusTone(status){
    var s=String(status||'');
    if(/退件|取消|异常|滞留/.test(s))
        return {hex:'#DC2626',pill:'bg-danger-50 text-danger-700 border-danger-100',solid:'bg-danger-600',
                dot:'bg-danger-600',ring:'ring-danger-100',line:'border-danger-400',soft:'bg-danger-50/60 border-danger-100',text:'text-danger-700',live:false};
    if(tqProgressOf(s)>=4)
        return {hex:'#1F9D66',pill:'bg-success-50 text-success-700 border-success-100',solid:'bg-success-600',
                dot:'bg-success-600',ring:'ring-success-100',line:'border-success-400',soft:'bg-success-50/60 border-success-100',text:'text-success-700',live:false};
    if(tqProgressOf(s)===0)
        return {hex:'#D97706',pill:'bg-warning-50 text-warning-700 border-warning-100',solid:'bg-warning-600',
                dot:'bg-warning-600',ring:'ring-warning-100',line:'border-warning-400',soft:'bg-warning-50/60 border-warning-100',text:'text-warning-700',live:true};
    return {hex:'#1F6FA8',pill:'bg-primary-50 text-primary-700 border-primary-100',solid:'bg-primary-600',
            dot:'bg-primary-600',ring:'ring-primary-100',line:'border-primary-400',soft:'bg-primary-50/60 border-primary-100',text:'text-primary-700',live:true};
}
function tqProgressHtml(status,tone){
    tone=tone||tqStatusTone(status);
    var cur=tqProgressOf(status);
    var h='<div class="flex items-start select-none">';
    TQ_PROGRESS_STEPS.forEach(function(step,i){
        var done=i<cur,curr=i===cur;
        h+='<div class="flex flex-col items-center flex-shrink-0 w-14">';
        /* 当前节点：更大的点 + 光环 + 呼吸动画，和已完成/未开始拉开差距 */
        if(curr)h+='<span class="w-4 h-4 rounded-full '+tone.dot+' ring-4 '+tone.ring+(tone.live?' pulse':'')+'"></span>';
        else if(done)h+='<span class="w-2.5 h-2.5 rounded-full '+tone.solid+' mt-[3px] opacity-70"></span>';
        else h+='<span class="w-2.5 h-2.5 rounded-full border-2 border-surface-300 bg-white mt-[3px]"></span>';
        h+='<span class="mt-1.5 whitespace-nowrap '+(curr?('text-xs font-bold '+tone.text):(done?'text-[11px] text-text-secondary':'text-[11px] text-text-muted'))+'">'+tr(step)+'</span></div>';
        if(i<TQ_PROGRESS_STEPS.length-1)h+='<div class="flex-1 h-0 mt-[9px] mx-1 border-t-2 '+(i<cur?tone.line:'border-dashed border-surface-300')+'"></div>';
    });
    h+='</div>';
    return h;
}
/* 按当前语言取事件文案：zh→中文，en/fr/pt→英文（无英文回退中文） */
function tqEventText(e){
    if(!e)return '';
    if(_currentLang!=='zh'&&e.en)return e.en;
    return e.cn||e.en||'';
}
/* 运输方式图标：空运金 / 海运蓝（fill 图标，飞机与货船） */
function tqTransportIconHtml(isAir){
    var style=isAir?'background:#FAF3E3;color:#B8892F':'background:#EAF3F9;color:#1F6FA8';
    var svg=isAir
        ?'<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.5 15.5v-2l-8-5V3.2c0-.7-.5-1.2-1.2-1.2S11 2.5 11 3.2v5.3l-8 5v2l8-2.5v5.2l-2.2 1.5v1.3l3.5-1 3.5 1v-1.3L13.5 18.2V13l8 2.5z"/></svg>'
        :'<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 21c-1.4 0-2.8-.5-4-1.3-2.4 1.7-5.6 1.7-8 0-1.2.8-2.6 1.3-4 1.3H2v-2h1.7L6 13V5c0-.6.4-1 1-1h3V2h4v2h3c.6 0 1 .4 1 1v8l2.3 6H22v2h-2zM8 11.7l4 1.3 4-1.3V6H8v5.7z"/></svg>';
    return '<span class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="'+style+'" title="'+esc(tr(isAir?'空运':'海运'))+'">'+svg+'</span>';
}
/* 路线虚线上的移动载具小图标 */
function tqRouteVehicleHtml(isAir){
    var svg=isAir
        ?'<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.5 15.5v-2l-8-5V3.2c0-.7-.5-1.2-1.2-1.2S11 2.5 11 3.2v5.3l-8 5v2l8-2.5v5.2l-2.2 1.5v1.3l3.5-1 3.5 1v-1.3L13.5 18.2V13l8 2.5z"/></svg>'
        :'<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 21c-1.4 0-2.8-.5-4-1.3-2.4 1.7-5.6 1.7-8 0-1.2.8-2.6 1.3-4 1.3H2v-2h1.7L6 13V5c0-.6.4-1 1-1h3V2h4v2h3c.6 0 1 .4 1 1v8l2.3 6H22v2h-2zM8 11.7l4 1.3 4-1.3V6H8v5.7z"/></svg>';
    return '<span class="absolute left-1/2 -translate-x-1/2 bg-white px-1 '+(isAir?'text-gold-500':'text-primary-500')+'" style="top:-9px">'+svg+'</span>';
}
function tqPinIconHtml(){
    return '<svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3" stroke-width="2"/></svg>';
}
/* 空状态：插画 + 引导 */
function tqEmptyStateHtml(){
    return '<div class="py-16 flex flex-col items-center justify-center text-center">'+
        '<svg class="w-16 h-16 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>'+
        '<div class="text-sm font-medium text-text-secondary mt-4">'+tr('输入运单号查询物流轨迹')+'</div>'+
        '<div class="text-xs text-text-muted mt-1.5">'+tr('支持一次粘贴多个单号，或从上方历史记录快速选择')+'</div></div>';
}

/* ---------- 查询栏：白色卡片（图标前缀大输入框 + 查询按钮 + 内嵌历史记录） ---------- */
function tqSearchBarHtml(){
    var h='<div class="bg-white rounded-xl border border-surface-200 px-4 py-3.5 shadow-sm">';
    h+='<div class="flex items-stretch gap-2 flex-wrap">';
    /* 输入框：搜索图标前缀 + tags + input + 清空 */
    h+='<div class="flex items-center gap-1.5 flex-wrap flex-1 min-w-[280px] min-h-[44px] pl-3 pr-2 py-1.5 border border-surface-200 rounded-lg bg-surface-50 focus-within:bg-white focus-within:border-primary-400 transition-colors">';
    h+='<svg class="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>';
    h+='<span id="tq-tags" class="contents">'+tqTagsHtml()+'</span>';
    h+='<input id="tq-input" onkeydown="tqInputKey(event)" class="flex-1 min-w-[140px] h-8 px-1 text-sm bg-transparent outline-none" placeholder="'+esc(tr('输入运单号后回车，可输入多个'))+'">';
    h+='<button type="button" onclick="tqClearTags()" title="'+esc(tr('清空'))+'" class="w-6 h-6 rounded-full text-text-muted hover:bg-surface-200 hover:text-text-secondary cursor-pointer leading-none flex-shrink-0">×</button>';
    h+='</div>';
    /* 查询按钮：与输入框同高 */
    h+='<button type="button" onclick="tqRunQuery()" class="h-11 px-6 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer flex-shrink-0">';
    h+='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'+tr('查询')+'</button>';
    h+='</div>';
    h+=tqHistoryHtml();
    h+='</div>';
    return h;
}

function tqTagsHtml(){
    return _tqTags.map(function(t,i){
        return '<span class="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-md bg-primary-50 border border-primary-100 text-primary-700 text-xs font-mono whitespace-nowrap">'+esc(t)+
            '<button type="button" onclick="tqRemoveTag('+i+')" class="w-4 h-4 rounded hover:bg-primary-100 cursor-pointer leading-none">×</button></span>';
    }).join('');
}

/* 历史记录：内嵌搜索卡片底部，时钟图标 + chips（hover 转主色，样式与标签呼应） */
function tqHistoryHtml(){
    if(!_tqHistory.length)return '<div id="tq-history"></div>';
    var h='<div id="tq-history" class="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-surface-100 text-xs">';
    h+='<span class="inline-flex items-center gap-1 text-text-muted flex-shrink-0">'+
        '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'+tr('历史记录')+'：</span>';
    _tqHistory.forEach(function(t,i){
        h+='<span class="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-md border border-surface-200 bg-surface-50 text-text-secondary hover:border-primary-300 hover:bg-primary-50 transition-colors whitespace-nowrap">';
        h+='<button type="button" onclick="tqUseHistory(\''+esc(t)+'\')" class="cursor-pointer hover:text-primary-600 font-mono">'+esc(t)+'</button>';
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
    var isAir=(o.country==='US'); /* 演示：美国线走空运图标，其余海运 */
    var tone=tqStatusTone(o.status);
    /* 左侧 4px 状态色条：一列卡片扫下来，当前处在什么阶段先由颜色给出答案 */
    var h='<div class="rounded-xl border border-surface-200 bg-white overflow-hidden card-hover" style="border-left:4px solid '+tone.hex+'">';
    h+='<div class="px-4 pt-3.5 pb-3 '+(expanded?'bg-surface-50/70':'bg-white hover:bg-surface-50/50')+(toggle?' cursor-pointer':'')+'"'+(toggle?' onclick="'+toggle+'"':'')+'>';
    /* 头部：运输图标 + 单号 + 路线 + 状态 */
    h+='<div class="flex items-center gap-3 flex-wrap">';
    h+=tqTransportIconHtml(isAir);
    h+='<div class="min-w-0"><div class="text-sm font-semibold text-primary-700 font-mono">'+esc(code)+'</div>'+
       '<div class="text-[11px] text-text-muted mt-0.5">'+tr('下单时间')+' '+esc(o.orderTime)+'</div></div>';
    h+='<div class="flex items-center gap-2 flex-1 min-w-[170px] justify-center px-2">'+
       '<span class="text-xs font-medium text-text-primary whitespace-nowrap">'+tr('深圳')+'</span>'+
       '<span class="relative flex-1 max-w-[130px] border-t-2 border-dashed '+(isAir?'border-gold-400':'border-primary-300')+'">'+tqRouteVehicleHtml(isAir)+'</span>'+
       '<span class="text-xs font-medium text-text-primary whitespace-nowrap">'+esc(o.country)+'</span></div>';
    /* 状态胶囊：比原来的小徽章更大更实，在途状态带呼吸圆点 */
    h+='<div class="flex items-center gap-2.5 ml-auto flex-shrink-0">'+
       '<span class="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border text-sm font-bold '+tone.pill+'">'+
       '<span class="w-2 h-2 rounded-full '+tone.dot+(tone.live?' pulse':'')+'"></span>'+esc(tr(o.status||'已预报'))+'</span>';
    if(opts.showSub){
        h+='<button type="button" onclick="event.stopPropagation();openTqSubModal(\''+esc(code)+'\')" class="h-7 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">'+tr('子单轨迹')+'</button>';
    }
    if(toggle)h+=tqChevronHtml(expanded);
    h+='</div></div>';
    /* 进度条 */
    h+='<div class="mt-4 pr-1">'+tqProgressHtml(o.status,tone)+'</div>';
    /* 当前节点摘要条：明确标出「当前节点」，颜色跟状态走 */
    h+='<div class="mt-2 flex items-center gap-2 text-xs rounded-lg border px-3 py-2 '+tone.soft+'">'+
       '<span class="inline-flex items-center gap-1.5 flex-shrink-0 font-semibold '+tone.text+'">'+
       '<span class="w-1.5 h-1.5 rounded-full '+tone.dot+'"></span>'+tr('当前节点')+'</span>'+
       '<span class="text-surface-300 flex-shrink-0">|</span>'+
       '<span class="text-text-primary font-medium truncate">'+esc(tqEventText(last))+'</span>'+
       '<span class="ml-auto text-text-muted whitespace-nowrap flex-shrink-0">'+esc(last.time)+'</span></div>';
    h+='</div>';
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
    var h='<div class="relative pl-8">';
    h+='<div class="absolute left-[13px] top-2 bottom-2 w-px bg-surface-300"></div>';
    events.forEach(function(e,i){
        var isCur=i===0;
        var abnormal=/延误|异常|查验|破损|扣留/.test(e.cn||'');
        h+='<div class="relative pb-4 last:pb-0'+(abnormal?' rounded-r-lg bg-amber-50/70 py-1.5 pr-2':'')+'">';
        if(isCur)h+='<span class="absolute -left-[26px] top-0.5 w-3.5 h-3.5 rounded-full bg-primary-600 ring-4 ring-primary-100"></span>';
        else h+='<span class="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full '+(abnormal?'bg-amber-500':'border-2 border-surface-300 bg-white')+'"></span>';
        h+='<div class="flex items-center gap-2 flex-wrap">'+
            '<span class="text-xs font-medium '+(isCur?'text-primary-700':'text-text-primary')+'">'+esc(tqEventText(e))+'</span>'+
            (isCur?'<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-600 text-white">'+tr('当前节点')+'</span>':'')+
            (abnormal?'<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">'+tr('异常')+'</span>':'')+
            '</div>';
        /* 「创建人」是内部操作员姓名，两端都不展示（客户不关心，内部看轨迹也用不上） */
        h+='<div class="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted flex-wrap">'+
            tqPinIconHtml()+'<span>'+esc(e.loc||'-')+'</span>'+
            '<span class="text-surface-300">|</span><span>'+esc(e.time||'')+'</span>'+
            '</div>';
        if(!_tqCustomerView&&e.en&&_currentLang==='zh')h+='<div class="mt-0.5 text-[11px] text-primary-600">'+esc(e.en)+'</div>';
        h+='</div>';
    });
    h+='</div>';
    return h;
}

/* ---------- 批量查询汇总 ----------
 * 一次贴几十个单号时，用户要的是先看分布（各节点各有多少、哪些压根没查到），
 * 再决定点开哪几张卡。所以结果区顶部放一条汇总带，chip 可点击当筛选用。 */
function tqIsKnown(code){return !!TQ_ORDERS[code];}
function tqSummarize(codes){
    var buckets={},notFound=[];
    TQ_PROGRESS_STEPS.forEach(function(s){buckets[s]=[];});
    codes.forEach(function(c){
        if(!tqIsKnown(c)){notFound.push(c);return;}
        buckets[TQ_PROGRESS_STEPS[tqProgressOf(tqOrderOf(c).status)]].push(c);
    });
    return {buckets:buckets,notFound:notFound,found:codes.length-notFound.length,total:codes.length};
}
function tqSumChipHtml(label,count,key,tone){
    var on=_tqFilter===key;
    var zero=count===0;
    var cls=on?('border-transparent text-white '+tone.solid)
        :(zero?'border-surface-200 bg-surface-50 text-text-muted'
              :'border-surface-200 bg-white text-text-secondary hover:border-primary-300 hover:bg-primary-50 cursor-pointer');
    var click=zero&&!on?'':' onclick="tqSetFilter(\''+key+'\')"';
    return '<button type="button"'+click+' class="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border text-xs whitespace-nowrap transition-colors '+cls+'">'+
        (key==='__nf__'||zero?'':'<span class="w-1.5 h-1.5 rounded-full '+(on?'bg-white':tone.dot)+'"></span>')+
        esc(tr(label))+'<span class="font-bold'+(on?'':(zero?'':' '+tone.text))+'">'+count+'</span></button>';
}
function tqSummaryHtml(codes){
    if(codes.length<2)return '';   /* 单个单号不需要汇总 */
    var s=tqSummarize(codes);
    var neutral={solid:'bg-primary-600',dot:'bg-primary-600',text:'text-primary-700'};
    var h='<div class="bg-white rounded-xl border border-surface-200 px-4 py-3 shadow-sm mb-3">';
    h+='<div class="flex items-center gap-2 flex-wrap">';
    h+='<span class="text-xs text-text-muted flex-shrink-0 mr-1">'+tr('本次查询')+' <span class="font-bold text-text-primary">'+s.total+'</span> '+tr('个单号')+'</span>';
    h+=tqSumChipHtml('全部',s.total,'',neutral);
    h+='<span class="w-px h-4 bg-surface-200 mx-1 flex-shrink-0"></span>';
    TQ_PROGRESS_STEPS.forEach(function(step){
        /* 节点色调按该节点所代表的阶段取，和卡片上的颜色对得上 */
        h+=tqSumChipHtml(step,s.buckets[step].length,step,tqStatusTone(step==='已签收'?'已签收':(step==='已下单'?'已预报':'已离港')));
    });
    if(s.notFound.length){
        h+='<span class="w-px h-4 bg-surface-200 mx-1 flex-shrink-0"></span>';
        h+=tqSumChipHtml('未查到',s.notFound.length,'__nf__',tqStatusTone('已退件'));
    }
    h+='</div>';
    /* 查不到的单号直接列出来，省得用户自己在卡片里找 */
    if(s.notFound.length){
        h+='<div class="mt-2.5 pt-2.5 border-t border-surface-100 flex items-start gap-2 text-xs">'+
           '<span class="inline-flex items-center gap-1 text-danger-600 flex-shrink-0 font-medium">'+
           '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>'+
           tr('未查到')+'：</span>'+
           '<span class="text-text-secondary font-mono break-all">'+esc(s.notFound.join('、'))+'</span></div>';
    }
    h+='</div>';
    return h;
}
function tqSetFilter(key){
    _tqFilter=(_tqFilter===key)?'':key;
    tqRenderResults();
}
/* 查不到的单号单独一张「空卡」——原来会兜底渲染成一张「已预报」的正常卡片，
 * 看上去像查到了，误导性比没结果还强。 */
function tqNotFoundCardHtml(code){
    return '<div class="rounded-xl border border-dashed border-surface-300 bg-surface-50/60 px-4 py-3.5 flex items-center gap-3">'+
        '<span class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-surface-100 text-text-muted">'+
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M9.17 14.83l5.66-5.66M14.83 14.83L9.17 9.17M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></span>'+
        '<div class="min-w-0"><div class="text-sm font-semibold text-text-secondary font-mono">'+esc(code)+'</div>'+
        '<div class="text-[11px] text-text-muted mt-0.5">'+tr('未查到该单号的轨迹，请核对单号是否正确')+'</div></div>'+
        '<span class="ml-auto inline-flex items-center h-7 px-3 rounded-full border border-surface-200 bg-white text-xs text-text-muted flex-shrink-0">'+tr('未查到')+'</span>'+
        '</div>';
}

/* ---------- 结果区 ---------- */
function tqResultsHtml(){
    if(!_tqTags.length){
        return tqEmptyStateHtml();
    }
    var codes=_tqTags.slice().sort();
    var shown=codes.filter(function(c){
        if(_tqFilter==='')return true;
        if(_tqFilter==='__nf__')return !tqIsKnown(c);
        if(!tqIsKnown(c))return false;
        return TQ_PROGRESS_STEPS[tqProgressOf(tqOrderOf(c).status)]===_tqFilter;
    });
    var h=tqSummaryHtml(codes);
    if(!shown.length){
        h+='<div class="py-12 text-center text-sm text-text-muted rounded-xl border border-dashed border-surface-300 bg-white">'+
           tr('该节点下没有单号')+'</div>';
        return h;
    }
    h+='<div class="space-y-3">'+shown.map(function(code){
        if(!tqIsKnown(code))return tqNotFoundCardHtml(code);
        var o=tqOrderOf(code);
        return tqCardHtml(code,o,{expanded:_tqExpanded[code]!==false,showSub:true,onToggle:'tqToggle(\''+code+'\')'});
    }).join('')+'</div>';
    return h;
}

function generateTrackQueryPage(id){
    _tqExpanded={};
    _tqFilter='';
    _tqCustomerView=String(id||'').indexOf('oms-')===0;
    let h='<div class="h-full overflow-auto bg-surface-50">';
    h+='<div class="max-w-[1600px] mx-auto px-6 py-5">';
    h+='<div class="mb-5">'+tqSearchBarHtml()+'</div>';
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
    _tqTags=[];_tqExpanded={};_tqFilter='';
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
    _tqFilter='';
    tqRenderResults();
    /* 提示里直接报未查到的条数，不用等用户自己翻 */
    var s=tqSummarize(_tqTags);
    var msg=tr('已查询')+' '+s.total+' '+tr('个单号');
    if(s.notFound.length)msg+='，'+tr('其中')+' '+s.notFound.length+' '+tr('个未查到');
    showToast(msg);
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
