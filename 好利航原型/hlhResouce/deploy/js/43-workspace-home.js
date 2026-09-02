/* ================= 工作台 · 公共工作台首页 + 右上角消息通知铃铛 =================
 * 一份数据两处用：审批待办取「我的审批(approval-mine)」待审批行，
 * 消息取「我的消息(approval-msg)」未读行。两者都直接读运行时数据 _listData，
 * 所以在审批/消息页做过的操作（审核、标记已读）会同步反映到首页与铃铛角标上。
 */

TC['ws-home']={t:'公共工作台',pageMode:'wsHome',h:[],s:[],d:[]};

/* ---------- 取数（全部惰性读取，不在加载期求值） ---------- */
function wsRows(id){
    var c=TC[id]||{};
    return (typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
}
function wsCell(id,row,name){
    var h=(TC[id]&&TC[id].h)||[],i=h.indexOf(name);
    return (i>=0&&row&&row[i]!=null)?String(row[i]):'';
}
/* 待我审批 */
function wsApprovalTodos(){
    var id='approval-mine',out=[];
    wsRows(id).forEach(function(r,i){
        if(wsCell(id,r,'审批状态')!=='待审批')return;
        out.push({
            kind:'approval',idx:i,tag:'审批',
            title:wsCell(id,r,'提示消息')||wsCell(id,r,'审批类型'),
            sub:wsCell(id,r,'申请单号')+' · '+wsCell(id,r,'申请人')+' · '+tr('节点')+' '+wsCell(id,r,'当前审批节点'),
            time:wsCell(id,r,'申请时间')
        });
    });
    return out;
}
/* 我的消息：unreadOnly=true 只取未读 */
function wsMessages(unreadOnly){
    var id='approval-msg',out=[];
    wsRows(id).forEach(function(r,i){
        var unread=wsCell(id,r,'阅读状态')==='未读';
        if(unreadOnly&&!unread)return;
        out.push({
            kind:'msg',idx:i,tag:wsCell(id,r,'消息分类')||'消息',unread:unread,
            title:wsCell(id,r,'消息内容'),
            sub:wsCell(id,r,'消息类型')+(wsCell(id,r,'运单号')?' · '+wsCell(id,r,'运单号'):''),
            time:wsCell(id,r,'创建时间')
        });
    });
    return out;
}
/* 待办消息里还没处理完的 */
function wsPendingTodoMsgCount(){
    var id='approval-msg',n=0;
    wsRows(id).forEach(function(r){
        if(wsCell(id,r,'消息分类')==='待办'&&!wsCell(id,r,'待办处理时间'))n++;
    });
    return n;
}
/* '2026-08-22 10:41:02' → '08-22 10:41'，铃铛里空间小 */
function wsShortTime(t){
    var m=/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(t||''));
    return m?(m[2]+'-'+m[3]+' '+m[4]+':'+m[5]):String(t||'');
}
function wsTimeKey(t){return String(t||'').replace(/\D/g,'');}

/* ---------- 公共工作台首页 ---------- */
function generateWorkspaceHome(id){
    var approvals=wsApprovalTodos();
    var msgs=wsMessages(false);
    var unread=msgs.filter(function(m){return m.unread;});
    var kpis=[
        {label:'待我审批',value:approvals.length,unit:'条',tab:'approval-mine',color:'from-primary-600 to-primary-500'},
        {label:'待办事项',value:wsPendingTodoMsgCount(),unit:'条',tab:'approval-msg',color:'from-amber-500 to-amber-400'},
        {label:'未读消息',value:unread.length,unit:'条',tab:'approval-msg',color:'from-green-600 to-green-500'},
        {label:'消息总数',value:msgs.length,unit:'条',tab:'approval-msg',color:'from-blue-600 to-blue-500'}
    ];
    var h='<div class="h-full overflow-auto bg-surface-50 p-6">';
    h+='<div class="mb-6"><h1 class="text-2xl font-bold text-text-primary">'+tr('公共工作台')+'</h1>'+
       '<p class="text-sm text-text-secondary mt-1">'+tr('审批待办与消息通知的统一入口，所有岗位共用')+'</p></div>';

    /* KPI */
    h+='<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">';
    kpis.forEach(function(k){
        h+='<div onclick="navigateToTab(\'\',\''+k.tab+'\')" class="rounded-xl p-5 text-white bg-gradient-to-br '+k.color+' shadow-sm cursor-pointer hover:opacity-95">';
        h+='<div class="text-xs opacity-90 mb-2">'+esc(tr(k.label))+'</div>';
        h+='<div class="text-2xl font-bold">'+k.value+'<span class="text-sm font-normal opacity-90 ml-1">'+esc(tr(k.unit))+'</span></div>';
        h+='</div>';
    });
    h+='</div>';

    h+='<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">';
    /* 审批待办 */
    h+=wsHomeCard('审批待办','bg-primary-500','approval-mine',approvals.length,
        approvals.length?approvals.map(function(a){return wsHomeRowHtml(a);}).join(''):wsHomeEmptyHtml('暂无待审批事项'));
    /* 我的消息：未读排前面，最多 8 条 */
    var sorted=msgs.slice().sort(function(x,y){
        if(x.unread!==y.unread)return x.unread?-1:1;
        return wsTimeKey(y.time)>wsTimeKey(x.time)?1:-1;
    }).slice(0,8);
    h+=wsHomeCard('我的消息','bg-amber-500','approval-msg',unread.length,
        sorted.length?sorted.map(function(m){return wsHomeRowHtml(m);}).join(''):wsHomeEmptyHtml('暂无消息'));
    h+='</div>';
    h+='</div>';
    return h;
}
function wsHomeCard(title,barColor,tab,badge,inner){
    var h='<div class="bg-white rounded-xl border border-surface-200 p-5">';
    h+='<div class="flex items-center justify-between mb-4">';
    h+='<div class="flex items-center gap-2"><span class="w-1 h-4 '+barColor+' rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr(title)+'</span>';
    if(badge>0)h+='<span class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">'+badge+'</span>';
    h+='</div>';
    h+='<button type="button" onclick="navigateToTab(\'\',\''+tab+'\')" class="text-xs text-primary-600 hover:text-primary-700 cursor-pointer">'+tr('查看全部')+' →</button>';
    h+='</div><div class="space-y-2">'+inner+'</div></div>';
    return h;
}
function wsHomeEmptyHtml(text){
    return '<div class="py-10 text-center text-sm text-text-muted">'+tr(text)+'</div>';
}
function wsHomeRowHtml(it){
    var tagCls=it.kind==='approval'?'bg-primary-50 text-primary-600':(it.tag==='待办'?'bg-amber-50 text-amber-600':'bg-surface-100 text-text-secondary');
    var h='<div onclick="openNotifItem(\''+it.kind+'\','+it.idx+')" class="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-surface-50 hover:bg-primary-50/50 cursor-pointer">';
    h+='<span class="inline-block px-2 py-0.5 rounded text-xs flex-shrink-0 mt-0.5 '+tagCls+'">'+esc(tr(it.tag))+'</span>';
    h+='<div class="flex-1 min-w-0">';
    h+='<div class="text-sm text-text-primary truncate">'+esc(it.title||'—')+(it.unread?'<span class="inline-block w-1.5 h-1.5 rounded-full bg-red-500 ml-1.5 align-middle"></span>':'')+'</div>';
    h+='<div class="text-xs text-text-muted mt-0.5 truncate">'+esc(it.sub||'')+'</div>';
    h+='</div>';
    h+='<span class="text-xs text-text-muted flex-shrink-0 mt-0.5">'+esc(wsShortTime(it.time))+'</span>';
    h+='</div>';
    return h;
}

/* ---------- 右上角消息通知铃铛 ---------- */
/* 铃铛聚合：待我审批 + 未读消息，按时间倒序，最多 6 条 */
function wsNotifItems(){
    return wsApprovalTodos().concat(wsMessages(true)).sort(function(x,y){
        return wsTimeKey(y.time)>wsTimeKey(x.time)?1:-1;
    });
}
function wsNotifCount(){return wsApprovalTodos().length+wsMessages(true).length;}

function updateNotifBadge(){
    var el=document.getElementById('notif-badge');
    if(!el)return;
    var n=0;
    try{n=wsNotifCount();}catch(e){n=0;}
    if(n>0){el.textContent=n>99?'99+':String(n);el.classList.remove('hidden');}
    else{el.textContent='';el.classList.add('hidden');}
}

function renderNotifDropdown(){
    var box=document.getElementById('notif-dropdown');
    if(!box)return;
    var items=wsNotifItems();
    var h='<div class="flex items-center justify-between px-4 py-3 border-b border-surface-100">';
    h+='<span class="text-sm font-semibold text-text-primary">'+tr('消息通知')+'</span>';
    h+='<span class="text-xs text-text-muted">'+tr('待处理')+' '+items.length+' '+tr('条')+'</span>';
    h+='</div>';
    if(!items.length){
        h+='<div class="py-10 text-center text-sm text-text-muted">'+tr('暂无待处理消息')+'</div>';
    }else{
        h+='<div class="max-h-80 overflow-y-auto divide-y divide-surface-100">';
        items.slice(0,6).forEach(function(it){
            var tagCls=it.kind==='approval'?'bg-primary-50 text-primary-600':(it.tag==='待办'?'bg-amber-50 text-amber-600':'bg-surface-100 text-text-secondary');
            h+='<div onclick="openNotifItem(\''+it.kind+'\','+it.idx+')" class="flex items-start gap-2.5 px-4 py-3 hover:bg-primary-50/40 cursor-pointer">';
            h+='<span class="inline-block px-1.5 py-0.5 rounded text-[11px] flex-shrink-0 mt-0.5 '+tagCls+'">'+esc(tr(it.tag))+'</span>';
            h+='<div class="flex-1 min-w-0"><div class="text-sm text-text-primary notif-clamp2">'+esc(it.title||'—')+'</div>';
            h+='<div class="text-xs text-text-muted mt-1 truncate">'+esc(it.sub||'')+'</div></div>';
            h+='<span class="text-[11px] text-text-muted flex-shrink-0 mt-0.5">'+esc(wsShortTime(it.time))+'</span>';
            h+='</div>';
        });
        h+='</div>';
    }
    h+='<div class="flex border-t border-surface-100">';
    h+='<button type="button" onclick="openNotifAll(\'approval-mine\')" class="flex-1 py-2.5 text-xs text-primary-600 hover:bg-primary-50/50 cursor-pointer">'+tr('全部审批')+'</button>';
    h+='<span class="w-px bg-surface-100"></span>';
    h+='<button type="button" onclick="openNotifAll(\'approval-msg\')" class="flex-1 py-2.5 text-xs text-primary-600 hover:bg-primary-50/50 cursor-pointer">'+tr('全部消息')+'</button>';
    h+='</div>';
    box.innerHTML=h;
}

function toggleNotifDropdown(e){
    if(e)e.stopPropagation();
    var box=document.getElementById('notif-dropdown');
    if(!box)return;
    if(box.classList.contains('hidden')){
        renderNotifDropdown();
        box.classList.remove('hidden');
        if(typeof closeUserDropdown==='function')closeUserDropdown();
    }else{
        box.classList.add('hidden');
    }
}
function closeNotifDropdown(){
    var box=document.getElementById('notif-dropdown');
    if(box)box.classList.add('hidden');
}

/* 点击某条通知：先跳到对应界面（审批 → 我的审批；消息/待办 → 我的消息），再打开详情 */
function openNotifItem(kind,idx){
    closeNotifDropdown();
    var tab=kind==='approval'?'approval-mine':'approval-msg';
    if(typeof navigateToTab==='function')navigateToTab('',tab);
    setTimeout(function(){
        if(kind==='approval'&&typeof openApprovalDetail==='function')openApprovalDetail('approval-mine',idx);
        else if(kind==='msg'&&typeof openApprovalMsgDetail==='function')openApprovalMsgDetail('approval-msg',idx);
    },80);
}
function openNotifAll(tab){
    closeNotifDropdown();
    if(typeof navigateToTab==='function')navigateToTab('',tab);
}

/* 点击铃铛以外区域收起 */
document.addEventListener('click',function(e){
    var box=document.getElementById('notif-container');
    if(box&&!box.contains(e.target))closeNotifDropdown();
});

/* 首屏角标：所有同步脚本执行完后跑一次 */
setTimeout(updateNotifBadge,0);
