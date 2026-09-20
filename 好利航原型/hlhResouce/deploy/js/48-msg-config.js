/* ==========================================================================
 * 48 · 审批 › 消息配置 —— 系统事件消息发给谁
 *
 * 链路：消息配置（事件 → 接收人范围）
 *          │
 *          ├─ 问题件（登记/处理完成/超期未处理）
 *          └─ 业务节点（订单已预报/已到仓/配舱完成/出仓完成/已到港/已签收）
 *
 * 接收范围与公告发布弹窗同一套圈人方式（客户：全部/按等级/指定；
 * 员工：全体/按组织架构/指定），员工侧多一档「按单据所属」：
 * 按事件发生时的业务单据，动态绑定 所属业务员/所属客服/所属操作 ——
 * 不写死名单，单据换负责人，消息跟着换。
 *
 * 依赖（都在更早加载的文件里）：
 *   42 · fclFinRows / fclFinGet / fclFinSet / fclFinRefresh / fclPushRow / fclNow / fclWho
 *   47 · msgCustomers / msgCustLevels / msgEmployees / msgDeptTree /
 *        msgEmpDeptCount（公告接收范围那套数据源直接复用）
 *   全局 · tr / esc / showToast / getSelectedRowIndices / getSelectedRowIndex
 * ========================================================================== */

/* 事件节点选项：类型切换时整组换掉。问题件走客服线，业务节点走操作线 */
var MSG_CFG_ISSUE_NODES=['问题件登记','问题件处理完成','问题件超期未处理'];
var MSG_CFG_BIZ_NODES=['订单已预报','已到仓','配舱完成','出仓完成','已到港','已签收'];
/* 单据所属角色：消息按事件单据的这三类负责人动态解析 */
var MSG_CFG_BIND_ROLES=['所属业务员','所属客服','所属操作'];

/* 问题件类型：取「问题件类型」档案 cs-issue-type 里启用的，不写死一份 */
function msgCfgIssueTypes(){
    var c=TC['cs-issue-type'];
    if(!c||!c.d)return [];
    var h=c.h||[],ni=h.indexOf('问题件类型名称'),ai=h.indexOf('区域类型'),si=h.indexOf('启用状态');
    var out=[];
    c.d.forEach(function(r){
        if(si>=0&&r[si]==='禁用')return;
        var n=String(r[ni]||'').trim();
        if(n&&!out.some(function(x){return x.name===n;}))out.push({name:n,area:ai>=0?String(r[ai]||''):''});
    });
    return out;
}

addPrototypeTable('msg-config','消息配置',
    '配置编号|事件类型|问题件类型|事件节点|消息类型|接收范围|绑定所属|触达说明|启用状态|操作',
    ['启用','停用'],[
    ['MCFG-20260920001','问题件','破损、开箱验货','问题件登记','员工消息','按单据所属','所属客服、所属操作','按事件单据动态解析','启用'],
    ['MCFG-20260920002','问题件','全部问题件类型','问题件处理完成','员工消息','按单据所属','所属业务员','按事件单据动态解析','启用'],
    ['MCFG-20260920003','业务节点','—','已到仓','员工消息','按单据所属','所属业务员、所属操作','按事件单据动态解析','启用'],
    ['MCFG-20260920004','业务节点','—','已签收','客户消息','单据所属客户','单据所属客户','按事件单据动态解析','启用'],
    ['MCFG-20260920005','业务节点','—','出仓完成','员工消息','指定员工','—','2 人（王红梅、黄小艳）','停用']
],[
    {label:'配置编号',type:'text'},
    {label:'事件类型',type:'select',options:['问题件','业务节点']},
    {label:'事件节点',type:'text'},
    {label:'消息类型',type:'select',options:['客户消息','员工消息']},
    {label:'启用状态',type:'select',options:['启用','停用']}
]);
/* 配置项不给删除：误删比停用难收场，要下线就停用 */
TC['msg-config'].noAutoAudit=true;

/* 结构化配置存这里（列表行只放摘要，弹窗回显要拿原始结构），按配置编号索引。
 * issues 空数组＝全部问题件类型 */
var _MSG_CFG_DETAIL={
    'MCFG-20260920001':{type:'emp',mode:'bind',binds:['所属客服','所属操作'],levels:[],ids:[],depts:[],issues:['破损','开箱验货']},
    'MCFG-20260920002':{type:'emp',mode:'bind',binds:['所属业务员'],levels:[],ids:[],depts:[],issues:[]},
    'MCFG-20260920003':{type:'emp',mode:'bind',binds:['所属业务员','所属操作'],levels:[],ids:[],depts:[],issues:[]},
    'MCFG-20260920004':{type:'cust',mode:'bind',binds:[],levels:[],ids:[],depts:[],issues:[]},
    'MCFG-20260920005':{type:'emp',mode:'pick',ids:['王红梅','黄小艳'],binds:[],levels:[],depts:[],issues:[]}
};

/* ===== 编辑弹窗状态 ===== */
var _msgCfgCtx=null;
function msgCfgNewCtx(type,mode){
    return {id:'',idx:-1,cfgNo:'',eventType:'问题件',node:'',type:type||'emp',
        mode:mode||'bind',binds:[],levels:[],ids:[],depts:[],issues:[]};
}
function msgCfgNodesOf(eventType){
    return eventType==='业务节点'?MSG_CFG_BIZ_NODES:MSG_CFG_ISSUE_NODES;
}

function openMsgConfigModal(mode,id,rowIdx,rowData){
    id=id||'msg-config';
    var isView=mode==='view';
    if(mode==='add'){
        var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(TC[id].d||[]);
        var last=data.length&&data[0]&&data[0][0]?data[0][0]:'';
        var lm=String(last).match(/^(.*?)(\d+)$/);
        _msgCfgCtx=msgCfgNewCtx();
        _msgCfgCtx.id=id;_msgCfgCtx.idx=-1;
        _msgCfgCtx.cfgNo=lm?lm[1]+String(parseInt(lm[2],10)+1).padStart(lm[2].length,'0'):'MCFG-20260920001';
        _msgCfgCtx.node=msgCfgNodesOf('问题件')[0];
    }else{
        var row=rowData||(((typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(TC[id].d||[]))[rowIdx]||[]);
        var cfgNo=fclFinGet(id,row,'配置编号');
        var saved=_MSG_CFG_DETAIL[cfgNo];
        _msgCfgCtx=Object.assign(msgCfgNewCtx(),saved?{
            type:saved.type,mode:saved.mode,binds:(saved.binds||[]).slice(),
            levels:(saved.levels||[]).slice(),ids:(saved.ids||[]).slice(),depts:(saved.depts||[]).slice(),
            issues:(saved.issues||[]).slice()
        }:{});
        _msgCfgCtx.id=id;_msgCfgCtx.idx=rowIdx;_msgCfgCtx.cfgNo=cfgNo;
        _msgCfgCtx.eventType=fclFinGet(id,row,'事件类型')||'问题件';
        _msgCfgCtx.node=fclFinGet(id,row,'事件节点')||msgCfgNodesOf(_msgCfgCtx.eventType)[0];
        /* 客户消息只有「单据所属客户」一种，老数据里的 all/level/pick 一律归位 */
        if(_msgCfgCtx.type==='cust')_msgCfgCtx.mode='bind';
    }
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='58%';
    document.getElementById('crud-modal-title').textContent=
        (mode==='add'?tr('新增消息配置'):isView?tr('查看消息配置'):tr('编辑消息配置'))+' - '+_msgCfgCtx.cfgNo;
    document.getElementById('crud-modal-body').innerHTML=msgCfgBodyHtml(isView);
    document.getElementById('crud-modal-footer').innerHTML=isView
        ?'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>'
        :'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
         '<button onclick="submitMsgConfig()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认保存')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function openMsgConfigAdd(id){openMsgConfigModal('add',id||'msg-config',-1);}

/* ---------- 弹窗骨架 ---------- */
function msgCfgBodyHtml(isView){
    var ctx=_msgCfgCtx;
    var h='<div class="space-y-5">';
    /* ① 事件配置 */
    h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('① 事件配置（什么事件触发消息）')+'</span></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('事件类型')+'<span class="text-red-500 ml-1">*</span></label>';
    h+='<div class="flex items-center gap-6 h-10">';
    ['问题件','业务节点'].forEach(function(t){
        h+='<label class="inline-flex items-center gap-1.5 cursor-pointer'+(isView?' pointer-events-none opacity-70':'')+'">'+
           '<input type="radio" name="msgcfg-etype" value="'+t+'"'+(ctx.eventType===t?' checked':'')+
           (isView?' disabled':' onchange="msgCfgSetEventType(\''+t+'\')"')+' class="text-primary-600">'+
           '<span class="text-sm text-text-primary">'+tr(t)+'</span></label>';
    });
    h+='</div></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('事件节点')+'<span class="text-red-500 ml-1">*</span></label>';
    h+='<div id="msgcfg-node-wrap">'+msgCfgNodeSelectHtml(isView)+'</div>';
    h+='</div></div>';
    /* 问题件类型：只有事件类型＝问题件时才有意义，业务节点下整块不渲染 */
    h+='<div id="msgcfg-issue-wrap" class="mt-4">'+msgCfgIssuePanel(isView)+'</div>';
    h+='</div>';
    /* ② 消息类型与接收范围（与公告发布同一套圈人方式） */
    h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-amber-500 rounded"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('② 消息发送对象（与公告发布的范围圈选一致）')+'</span></div>';
    h+='<div class="mb-3 flex items-center gap-2 flex-wrap"><span class="text-sm font-medium text-text-secondary">'+tr('消息类型')+'</span>';
    [['cust','客户消息'],['emp','员工消息']].forEach(function(t){
        var on=ctx.type===t[0];
        h+='<label class="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg '+(isView?'':'cursor-pointer')+' '+
           (on?'border-primary-500 bg-primary-50 text-primary-700':'border-surface-200 bg-white text-text-secondary hover:bg-surface-50')+'">'+
           '<input type="radio" name="msgcfg-type" value="'+t[0]+'"'+(on?' checked':'')+
           (isView?' disabled':' onchange="msgCfgSetType(\''+t[0]+'\')"')+' class="text-primary-600">'+
           '<span class="text-sm font-medium">'+tr(t[1])+'</span></label>';
    });
    h+='</div>';
    h+='<div id="msgcfg-scope-wrap">'+msgCfgScopePanel(isView)+'</div>';
    h+='</div>';
    h+='<div id="msgcfg-preview-wrap">'+msgCfgPreviewHtml()+'</div>';
    h+='</div>';
    return h;
}
function msgCfgNodeSelectHtml(isView){
    var ctx=_msgCfgCtx;
    var h='<select id="msgcfg-node" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+(isView?' disabled':'')+'>';
    msgCfgNodesOf(ctx.eventType).forEach(function(n){
        h+='<option value="'+esc(n)+'"'+(ctx.node===n?' selected':'')+'>'+esc(tr(n))+'</option>';
    });
    return h+'</select>';
}
/* 问题件类型多选：不勾＝全部类型。一个配置常常要覆盖几种类型
 * （破损和开箱验货都发给客服），做成单选反而要建好几条配置。 */
function msgCfgIssuePanel(isView){
    var ctx=_msgCfgCtx;
    if(ctx.eventType!=='问题件')return '';
    var types=msgCfgIssueTypes();
    var dis=isView?' disabled':'',chg=isView?'':' onchange="msgCfgChanged()"';
    var h='<div class="border border-surface-200 rounded-lg overflow-hidden">';
    h+='<div class="px-3 py-2 bg-surface-50 flex items-center justify-between gap-2">'+
       '<span class="inline-flex items-center gap-2"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('问题件类型')+'</span></span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('不勾选＝该节点下的全部问题件类型都发'))+'</span></div>';
    if(!types.length){
        h+='<div class="px-3 py-6 text-center text-sm text-text-muted">'+esc(tr('问题件类型档案里还没有启用的类型'))+'</div>';
        return h+'</div>';
    }
    h+='<div class="p-3 flex flex-wrap gap-x-4 gap-y-2">';
    types.forEach(function(t){
        h+='<label class="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-surface-200 rounded-lg'+(isView?'':' cursor-pointer hover:bg-primary-50/40')+'">'+
           '<input type="checkbox" data-cfg-issue="'+esc(t.name)+'"'+(ctx.issues.indexOf(t.name)>=0?' checked':'')+dis+chg+
           ' class="rounded border-surface-300 text-primary-600">'+
           '<span class="text-sm text-text-primary">'+esc(t.name)+'</span>'+
           (t.area?'<span class="text-[11px] text-text-muted">'+esc(t.area)+'</span>':'')+'</label>';
    });
    h+='</div></div>';
    return h;
}

/* ---------- 范围面板 ---------- */
function msgCfgSetEventType(t){
    var ctx=_msgCfgCtx;
    if(ctx.eventType===t)return;
    msgCfgReadUI();
    ctx.eventType=t;
    /* 事件节点选项整组换：原来的节点在新类型里多半不存在，直接落到第一个 */
    var nodes=msgCfgNodesOf(t);
    ctx.node=nodes[0];
    if(t!=='问题件')ctx.issues=[];   /* 业务节点下问题件类型没有意义，顺手清掉 */
    var wrap=document.getElementById('msgcfg-node-wrap');
    if(wrap)wrap.innerHTML=msgCfgNodeSelectHtml(false);
    var iw=document.getElementById('msgcfg-issue-wrap');
    if(iw)iw.innerHTML=msgCfgIssuePanel(false);
}
function msgCfgSetType(t){
    var ctx=_msgCfgCtx;
    if(ctx.type===t)return;
    msgCfgReadUI();
    ctx.type=t;
    /* 客户消息只能发给单据所属客户；员工消息也默认按单据所属，但可以改 */
    ctx.mode=(t==='cust')?'bind':(ctx.mode&&ctx.mode!=='none'?ctx.mode:'bind');
    document.querySelectorAll('input[name="msgcfg-type"]').forEach(function(r){
        var on=r.value===t;
        r.checked=on;
        var lbl=r.closest('label');
        if(lbl)lbl.className='inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer '+
            (on?'border-primary-500 bg-primary-50 text-primary-700':'border-surface-200 bg-white text-text-secondary hover:bg-surface-50');
    });
    var wrap=document.getElementById('msgcfg-scope-wrap');
    if(wrap)wrap.innerHTML=msgCfgScopePanel(false);
    msgCfgChanged();
}
function msgCfgSetMode(mode){
    msgCfgReadUI();
    _msgCfgCtx.mode=mode;
    var panel=document.getElementById('msgcfg-scope-panel');
    if(panel)panel.outerHTML=msgCfgScopePanel(false);
    msgCfgChanged();
}
/* 客户侧只有「单据所属客户」一档：这是系统事件消息，事件必然挂在一张业务单据上，
 * 发给这张单的客户才讲得通 —— 一票货的到仓通知群发给全部客户是事故不是功能。
 * 员工侧不一样：同样默认按单据所属，但「全体员工 / 按组织架构 / 指定员工」
 * 仍然可选，比如系统维护类节点要通知整个操作部。 */
function msgCfgScopePanel(isView){
    var ctx=_msgCfgCtx;
    var isCust=ctx.type==='cust';
    var modes=isCust?[['bind','单据所属客户']]
                    :[['bind','按单据所属'],['all','全体员工'],['dept','按组织架构'],['pick','指定员工']];
    var h='<div id="msgcfg-scope-panel" class="border border-surface-200 rounded-lg overflow-hidden">';
    h+='<div class="px-3 py-2 bg-surface-50 flex items-center gap-2">'+
       '<span class="w-1 h-4 '+(isCust?'bg-primary-500':'bg-amber-500')+' rounded"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr(isCust?'客户接收范围':'员工接收范围')+'</span>'+
       (isCust?'<span class="text-xs text-text-muted">'+esc(tr('固定为单据所属客户，不能改选其他'))+'</span>':'')+'</div>';
    h+='<div class="p-3">';
    h+='<div class="flex flex-wrap gap-x-4 gap-y-2 mb-3">';
    modes.forEach(function(m){
        /* 客户侧只有一档，锁死不可改 */
        var locked=isView||(isCust&&modes.length===1);
        h+='<label class="inline-flex items-center gap-1.5'+(locked?' opacity-80':' cursor-pointer')+'">'+
           '<input type="radio" name="msgcfg-mode" value="'+m[0]+'"'+(ctx.mode===m[0]?' checked':'')+
           (locked?' disabled':' onchange="msgCfgSetMode(\''+m[0]+'\')"')+' class="text-primary-600">'+
           '<span class="text-sm text-text-primary">'+tr(m[1])+'</span></label>';
    });
    h+='</div>';
    h+='<div class="min-h-[140px]">'+(isCust?msgCfgCustCond(isView):msgCfgEmpCond(isView))+'</div>';
    h+='</div></div>';
    return h;
}
function msgCfgHint(text){
    return '<div class="px-3 py-8 text-center text-sm text-text-muted">'+esc(tr(text))+'</div>';
}
function msgCfgCustCond(isView){
    var ctx=_msgCfgCtx,list=msgCustomers();
    var dis=isView?' disabled':'',chg=isView?'':' onchange="msgCfgChanged()"';
    if(ctx.mode==='bind'){
        return '<div class="space-y-2">'+
            '<div class="flex items-center justify-between px-3 py-2.5 border border-primary-200 bg-primary-50/50 rounded-lg">'+
            '<span class="inline-flex items-center gap-2"><input type="radio" checked disabled class="text-primary-600">'+
            '<span class="text-sm font-medium text-text-primary">'+tr('单据所属客户')+'</span></span>'+
            '<span class="text-xs text-text-muted">'+tr('随单据动态解析')+'</span></div>'+
            '<div class="px-3 py-2 text-xs text-text-muted bg-amber-50 border border-amber-100 rounded-lg">'+
            esc(tr('事件发生时只发给这张业务单据上的客户，不会发给其他客户；单据换客户，接收人跟着换。'))+'</div>'+
            '</div>';
    }
    if(ctx.mode==='all')return msgCfgHint('将发送给全部启用客户，共 '+list.length+' 家（禁用客户自动排除）');
    if(ctx.mode==='level'){
        var h='<div class="space-y-2">';
        msgCustLevels().forEach(function(lv){
            var n=list.filter(function(x){return x.level===lv;}).length;
            h+='<label class="flex items-center justify-between px-3 py-2 border border-surface-200 rounded-lg hover:bg-primary-50/40 cursor-pointer">'+
               '<span class="inline-flex items-center gap-2"><input type="checkbox" data-cfg-level="'+esc(lv)+'"'+
               (ctx.levels.indexOf(lv)>=0?' checked':'')+dis+chg+' class="rounded border-surface-300 text-primary-600">'+
               '<span class="text-sm text-text-primary">'+esc(lv)+'</span></span>'+
               '<span class="text-xs text-text-muted">'+n+' '+tr('家')+'</span></label>';
        });
        return h+'</div>';
    }
    var h2='<div class="border border-surface-200 rounded-lg max-h-48 overflow-auto divide-y divide-surface-100">';
    list.forEach(function(x){
        h2+='<label class="flex items-center justify-between px-3 py-2 hover:bg-primary-50/40 cursor-pointer">'+
            '<span class="inline-flex items-center gap-2"><input type="checkbox" data-cfg-cust="'+esc(x.name)+'"'+
            (ctx.ids.indexOf(x.name)>=0?' checked':'')+dis+chg+' class="rounded border-surface-300 text-primary-600">'+
            '<span class="text-sm text-text-primary">'+esc(x.name)+'</span></span>'+
            '<span class="text-xs text-text-muted">'+esc(x.level)+' · '+esc(x.type)+'</span></label>';
    });
    return h2+'</div>';
}
function msgCfgEmpCond(isView){
    var ctx=_msgCfgCtx,emps=msgEmployees();
    var dis=isView?' disabled':'',chg=isView?'':' onchange="msgCfgChanged()"';
    if(ctx.mode==='all')return msgCfgHint('将发送给全体在职员工，共 '+emps.length+' 人（离职自动排除）');
    if(ctx.mode==='dept'){
        var tree=msgDeptTree();
        var h='<div class="border border-surface-200 rounded-lg max-h-48 overflow-auto">';
        tree.forEach(function(b){
            h+='<div class="px-3 py-1.5 bg-surface-50 text-xs font-medium text-text-secondary sticky top-0">'+esc(b.branch)+'</div>';
            b.depts.forEach(function(dp){
                var n=msgEmpDeptCount(dp.code);
                h+='<label class="flex items-center justify-between px-3 py-2 hover:bg-primary-50/40 cursor-pointer border-t border-surface-100">'+
                   '<span class="inline-flex items-center gap-2"><input type="checkbox" data-cfg-dept="'+esc(dp.code)+'"'+
                   (ctx.depts.indexOf(dp.code)>=0?' checked':'')+dis+chg+' class="rounded border-surface-300 text-primary-600">'+
                   '<span class="text-sm text-text-primary">'+esc(dp.name)+'</span></span>'+
                   '<span class="text-xs '+(n?'text-text-muted':'text-amber-600')+'">'+n+' '+tr('人')+'</span></label>';
            });
        });
        return h+'</div>';
    }
    if(ctx.mode==='bind'){
        /* 按单据所属：不写死名单，事件发生时从业务单据上取负责人 */
        var h='<div class="space-y-2">';
        MSG_CFG_BIND_ROLES.forEach(function(r){
            h+='<label class="flex items-center justify-between px-3 py-2 border border-surface-200 rounded-lg hover:bg-primary-50/40 cursor-pointer">'+
               '<span class="inline-flex items-center gap-2"><input type="checkbox" data-cfg-bind="'+esc(r)+'"'+
               (ctx.binds.indexOf(r)>=0?' checked':'')+dis+chg+' class="rounded border-surface-300 text-primary-600">'+
               '<span class="text-sm text-text-primary">'+esc(tr(r))+'</span></span>'+
               '<span class="text-xs text-text-muted">'+tr('随单据动态解析')+'</span></label>';
        });
        h+='<div class="px-3 py-2 text-xs text-text-muted bg-amber-50 border border-amber-100 rounded-lg">'+
           esc(tr('事件发生时按业务单据上的所属人员发消息：单据换负责人，接收人跟着换。'))+'</div>';
        return h+'</div>';
    }
    var h2='<div class="border border-surface-200 rounded-lg max-h-48 overflow-auto divide-y divide-surface-100">';
    emps.forEach(function(e){
        h2+='<label class="flex items-center justify-between px-3 py-2 hover:bg-primary-50/40 cursor-pointer">'+
            '<span class="inline-flex items-center gap-2"><input type="checkbox" data-cfg-emp="'+esc(e.name)+'"'+
            (ctx.ids.indexOf(e.name)>=0?' checked':'')+dis+chg+' class="rounded border-surface-300 text-primary-600">'+
            '<span class="text-sm text-text-primary">'+esc(e.name)+'</span></span>'+
            '<span class="text-xs text-text-muted">'+esc(e.post)+'</span></label>';
    });
    return h2+'</div>';
}

/* ---------- 勾选回读与命中预览 ---------- */
function msgCfgReadUI(){
    var ctx=_msgCfgCtx;if(!ctx)return;
    var pick=function(sel){
        var out=[];
        document.querySelectorAll(sel+':checked').forEach(function(x){
            out.push(x.getAttribute(sel.replace(/^\[|\]$/g,'')));
        });
        return out;
    };
    if(document.querySelector('[data-cfg-level]'))ctx.levels=pick('[data-cfg-level]');
    if(document.querySelector('[data-cfg-cust]'))ctx.ids=pick('[data-cfg-cust]');
    if(document.querySelector('[data-cfg-dept]'))ctx.depts=pick('[data-cfg-dept]');
    if(document.querySelector('[data-cfg-emp]'))ctx.ids=pick('[data-cfg-emp]');
    if(document.querySelector('[data-cfg-bind]'))ctx.binds=pick('[data-cfg-bind]');
    if(document.querySelector('[data-cfg-issue]'))ctx.issues=pick('[data-cfg-issue]');
    var node=document.getElementById('msgcfg-node');
    if(node&&node.value)ctx.node=node.value;
}
function msgCfgChanged(){
    msgCfgReadUI();
    var box=document.getElementById('msgcfg-preview-wrap');
    if(box)box.innerHTML=msgCfgPreviewHtml();
}
/* 命中数：能静态解析的给数字；按单据所属只能给说明（事件发生才知道是谁） */
function msgCfgHitCount(){
    var ctx=_msgCfgCtx;
    if(ctx.type==='cust'){
        var list=msgCustomers();
        /* 单据所属客户：事件发生才知道是哪一家，跟员工侧的按单据所属同一口径 */
        if(ctx.mode==='bind')return {n:0,label:'客户',unit:'家',dynamic:true,custBind:true};
        if(ctx.mode==='all')return {n:list.length,label:'客户',unit:'家'};
        if(ctx.mode==='level')return {n:list.filter(function(x){return ctx.levels.indexOf(x.level)>=0;}).length,label:'客户',unit:'家'};
        return {n:ctx.ids.length,label:'客户',unit:'家'};
    }
    if(ctx.mode==='all')return {n:msgEmployees().length,label:'员工',unit:'人'};
    if(ctx.mode==='dept')return {n:ctx.depts.reduce(function(a,d){return a+msgEmpDeptCount(d);},0),label:'员工',unit:'人'};
    if(ctx.mode==='pick')return {n:ctx.ids.length,label:'员工',unit:'人'};
    return {n:0,label:'员工',unit:'人',dynamic:true};
}
function msgCfgPreviewHtml(){
    var ctx=_msgCfgCtx;
    var hit=msgCfgHitCount();
    var ok=hit.custBind?true:(hit.dynamic?ctx.binds.length>0:hit.n>0);
    var cls=ok?'bg-success-50 border-success-100 text-success-700':'bg-amber-50 border-amber-100 text-amber-700';
    var h='<div class="mt-4 px-3 py-2.5 rounded-lg border '+cls+' text-sm">';
    if(hit.custBind){
        h+=tr('命中')+'：<span class="font-semibold">'+tr('单据所属客户')+'</span>　'+
           '<span class="text-xs opacity-80">'+esc(tr('事件发生时按单据动态解析'))+'</span>';
    }else if(hit.dynamic){
        h+=tr('命中')+'：'+tr('按单据所属')+' <span class="font-semibold">'+ctx.binds.map(function(b){return tr(b);}).join('、')+'</span>　'+
           '<span class="text-xs opacity-80">'+esc(tr('事件发生时按单据动态解析'))+'</span>';
        if(!ctx.binds.length)h+='<div class="mt-1 text-xs opacity-80">'+esc(tr('请先勾选要绑定的所属角色（业务员/客服/操作）'))+'</div>';
    }else if(ok){
        h+=tr('命中')+'：'+tr(hit.label)+' <span class="font-semibold">'+hit.n+'</span> '+tr(hit.unit);
    }else{
        h+=tr('当前条件没有命中任何接收人，无法保存');
    }
    /* 问题件类型限定也要在这里报一句，否则勾了没反馈 */
    if(ctx.eventType==='问题件'){
        h+='<div class="mt-1.5 text-xs opacity-80">'+tr('问题件类型')+'：'+
           esc(ctx.issues.length?ctx.issues.join('、'):tr('全部问题件类型'))+'</div>';
    }
    return h+'</div>';
}

/* ---------- 摘要写回 ---------- */
function msgCfgScopeText(){
    var ctx=_msgCfgCtx;
    if(ctx.type==='cust'){
        if(ctx.mode==='bind')return tr('单据所属客户');
        if(ctx.mode==='all')return tr('全部客户');
        if(ctx.mode==='level')return tr('按客户等级')+'('+ctx.levels.join(', ')+')';
        return tr('指定客户')+'('+ctx.ids.length+')';
    }
    if(ctx.mode==='all')return tr('全体员工');
    if(ctx.mode==='dept')return tr('按组织架构')+'('+ctx.depts.length+' '+tr('个部门')+')';
    if(ctx.mode==='pick')return tr('指定员工')+'('+ctx.ids.length+')';
    return tr('按单据所属');
}
function msgCfgBindText(){
    var ctx=_msgCfgCtx;
    if(ctx.type==='cust')return ctx.mode==='bind'?tr('单据所属客户'):'—';
    return ctx.mode==='bind'?ctx.binds.join('、'):'—';
}
/* 问题件类型摘要：业务节点下没有这个维度，写「—」 */
function msgCfgIssueText(){
    var ctx=_msgCfgCtx;
    if(ctx.eventType!=='问题件')return '—';
    return ctx.issues.length?ctx.issues.join('、'):tr('全部问题件类型');
}
function msgCfgTouchText(){
    var ctx=_msgCfgCtx,hit=msgCfgHitCount();
    if(hit.dynamic)return tr('按事件单据动态解析');
    if(ctx.type==='cust')return ctx.ids.length<=3&&ctx.mode==='pick'?(ctx.ids.join('、')||'—'):(hit.n+' '+tr('家'));
    if(ctx.mode==='pick')return hit.n+' '+tr('人')+'（'+ctx.ids.slice(0,3).join('、')+(ctx.ids.length>3?'…':'')+'）';
    return hit.n+' '+tr('人');
}
function submitMsgConfig(){
    var ctx=_msgCfgCtx;
    msgCfgReadUI();
    var hit=msgCfgHitCount();
    /* 单据所属客户不用勾任何东西，本身就是完整条件 */
    if(hit.dynamic&&!hit.custBind&&!ctx.binds.length){showToast(tr('请先勾选要绑定的所属角色'));return;}
    if(!hit.dynamic&&!hit.n){showToast(tr('当前条件没有命中任何接收人'));return;}
    if(!ctx.node){showToast(tr('请选择事件节点'));return;}
    var id=ctx.id;
    var rowVals={
        '事件类型':ctx.eventType,'问题件类型':msgCfgIssueText(),'事件节点':ctx.node,
        '消息类型':ctx.type==='cust'?'客户消息':'员工消息',
        '接收范围':msgCfgScopeText(),'绑定所属':msgCfgBindText(),'触达说明':msgCfgTouchText()
    };
    _MSG_CFG_DETAIL[ctx.cfgNo]={type:ctx.type,mode:ctx.mode,binds:ctx.binds.slice(),
        levels:ctx.levels.slice(),ids:ctx.ids.slice(),depts:ctx.depts.slice(),issues:ctx.issues.slice()};
    if(ctx.idx>=0){
        var row=fclFinRows(id)[ctx.idx];
        if(!row){showToast(tr('未找到配置'));return;}
        Object.keys(rowVals).forEach(function(k){fclFinSet(id,row,k,rowVals[k]);});
    }else{
        rowVals['配置编号']=ctx.cfgNo;
        rowVals['启用状态']='启用';
        fclPushRow(id,rowVals);
    }
    if(typeof _listData!=='undefined')delete _listData[id];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('已保存消息配置')+'：'+ctx.cfgNo);
}

/* ===== 启用/停用 ===== */
function msgCfgToggle(id){
    id=id||'msg-config';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要启停的配置'));return;}
    var rows=fclFinRows(id),on=0,off=0;
    idxs.forEach(function(i){
        var row=rows[i];if(!row)return;
        var cur=fclFinGet(id,row,'启用状态');
        var next=cur==='启用'?'停用':'启用';
        fclFinSet(id,row,'启用状态',next);
        if(next==='启用')on++;else off++;
    });
    fclFinRefresh(id);
    showToast((on?tr('已启用')+' '+on+' '+tr('条'):'')+(on&&off?'，':'')+(off?tr('已停用')+' '+off+' '+tr('条'):''));
}
