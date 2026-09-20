/* ==========================================================================
 * 48 · 审批 › 消息配置 —— 系统事件消息发给谁、发什么
 *
 * 链路：消息配置（事件 → 接收人范围 → 内容模版）
 *          │
 *          ├─ 问题件（登记/处理完成/超期未处理，可限定问题件类型）
 *          └─ 业务节点（订单已预报/已到仓/配舱完成/出仓完成/已到港/已签收）
 *
 * 发送对象客户与员工可以同时配：同一个节点常常是「通知客户 + 通知内部跟单」
 * 两件事一起发，所以两侧各自独立勾选、各自一套范围，不是二选一。
 *   客户侧固定「单据所属客户」—— 系统事件必然挂一张业务单据，
 *     一票货的到仓通知群发给全部客户是事故不是功能。
 *   员工侧默认「按单据所属」（动态绑定 所属业务员/所属客服/所属操作），
 *     也可以改成全体员工 / 按组织架构 / 指定员工。
 *
 * 内容模版按侧各写一份：发客户和发内部的措辞本来就不一样。模版里用
 * ${订单号} 这样的占位符，事件触发时按单据取值替换 —— 订单号是主参数，
 * 新建时默认模版里就带着它。
 *
 * 依赖（都在更早加载的文件里）：
 *   42 · fclFinRows / fclFinGet / fclFinSet / fclFinRefresh / fclPushRow
 *   47 · msgCustomers / msgCustLevels / msgEmployees / msgDeptTree /
 *        msgEmpDeptCount（公告接收范围那套数据源直接复用）
 *   全局 · tr / esc / showToast / getSelectedRowIndices / getSelectedRowIndex
 * ========================================================================== */

/* 事件节点选项：类型切换时整组换掉。问题件走客服线，业务节点走操作线 */
var MSG_CFG_ISSUE_NODES=['问题件登记','问题件处理完成','问题件超期未处理'];
var MSG_CFG_BIZ_NODES=['订单已预报','已到仓','配舱完成','出仓完成','已到港','已签收'];
/* 单据所属角色：消息按事件单据的这三类负责人动态解析 */
var MSG_CFG_BIND_ROLES=['所属业务员','所属客服','所属操作'];

/* 模版参数：${名称} 占位，事件触发时按单据取值替换。
 * 订单号排第一并且是默认模版的主参数 —— 收到消息第一件事是知道哪一票货。
 * 第二项是预览用的示例值，不是真实数据。 */
var MSG_CFG_TPL_PARAMS=[
    ['订单号','ORD-20260918001'],
    ['运单号','HTL2609180012'],
    ['客户名称','华运达国际货运'],
    ['事件节点','已到仓'],
    ['问题件类型','破损'],
    ['发生时间','2026-09-18 14:30'],
    ['经办人','李小飞']
];
function msgCfgTplParamNames(){return MSG_CFG_TPL_PARAMS.map(function(p){return p[0];});}

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
    '配置编号|事件类型|问题件类型|事件节点|消息类型|接收范围|绑定所属|内容模版|触达说明|启用状态|操作',
    ['启用','停用'],[
    ['MCFG-20260920001','问题件','破损、开箱验货','问题件登记','客户+员工',
     '客户: 单据所属客户；员工: 按单据所属','所属客服、所属操作',
     '客户/员工各一份','按事件单据动态解析','启用'],
    ['MCFG-20260920002','问题件','全部问题件类型','问题件处理完成','员工消息',
     '员工: 按单据所属','所属业务员',
     '员工模版','按事件单据动态解析','启用'],
    ['MCFG-20260920003','业务节点','—','已到仓','客户+员工',
     '客户: 单据所属客户；员工: 按单据所属','所属业务员、所属操作',
     '客户/员工各一份','按事件单据动态解析','启用'],
    ['MCFG-20260920004','业务节点','—','已签收','客户消息',
     '客户: 单据所属客户','单据所属客户',
     '客户模版','按事件单据动态解析','启用'],
    ['MCFG-20260920005','业务节点','—','出仓完成','员工消息',
     '员工: 指定员工(2)','—',
     '员工模版','2 人（王红梅、黄小艳）','停用']
],[
    {label:'配置编号',type:'text'},
    {label:'事件类型',type:'select',options:['问题件','业务节点']},
    {label:'事件节点',type:'text'},
    {label:'消息类型',type:'select',options:['客户消息','员工消息','客户+员工']},
    {label:'启用状态',type:'select',options:['启用','停用']}
]);
/* 配置项不给删除：误删比停用难收场，要下线就停用 */
TC['msg-config'].noAutoAudit=true;

/* 结构化配置存这里（列表行只放摘要，弹窗回显要拿原始结构），按配置编号索引。
 * issues 空数组＝全部问题件类型；cust/emp 各自独立 on + 范围 + 模版。 */
var _MSG_CFG_DETAIL={
    'MCFG-20260920001':{issues:['破损','开箱验货'],
        cust:{on:true,mode:'bind',tpl:'您的订单 ${订单号} 在 ${发生时间} 登记了问题件（${问题件类型}），我们的客服 ${经办人} 会尽快与您联系。'},
        emp:{on:true,mode:'bind',binds:['所属客服','所属操作'],depts:[],ids:[],
             tpl:'订单 ${订单号}（运单 ${运单号}）登记问题件：${问题件类型}，客户 ${客户名称}，请在 24 小时内跟进处理。'}},
    'MCFG-20260920002':{issues:[],
        cust:{on:false,mode:'bind',tpl:''},
        emp:{on:true,mode:'bind',binds:['所属业务员'],depts:[],ids:[],
             tpl:'订单 ${订单号} 的问题件已处理完成（${发生时间}），请确认后同步客户 ${客户名称}。'}},
    'MCFG-20260920003':{issues:[],
        cust:{on:true,mode:'bind',tpl:'您好，您的订单 ${订单号} 已于 ${发生时间} 到达我司仓库，我们会尽快安排配舱。'},
        emp:{on:true,mode:'bind',binds:['所属业务员','所属操作'],depts:[],ids:[],
             tpl:'订单 ${订单号}（${客户名称}）已到仓，节点：${事件节点}，请安排后续配舱。'}},
    'MCFG-20260920004':{issues:[],
        cust:{on:true,mode:'bind',tpl:'您好，您的订单 ${订单号} 已于 ${发生时间} 签收完成，感谢您的支持。'},
        emp:{on:false,mode:'bind',binds:[],depts:[],ids:[],tpl:''}},
    'MCFG-20260920005':{issues:[],
        cust:{on:false,mode:'bind',tpl:''},
        emp:{on:true,mode:'pick',binds:[],depts:[],ids:['王红梅','黄小艳'],
             tpl:'订单 ${订单号} 已出仓（${发生时间}），请留意后续装柜安排。'}}
};

/* ===== 编辑弹窗状态 ===== */
var _msgCfgCtx=null;
function msgCfgNewCtx(){
    return {id:'',idx:-1,cfgNo:'',eventType:'问题件',node:'',issues:[],
        /* 客户侧只有「单据所属客户」一档，mode 恒为 bind，留字段是为了两侧形状一致 */
        cust:{on:false,mode:'bind',tpl:''},
        emp:{on:true,mode:'bind',binds:['所属客服'],depts:[],ids:[],tpl:''}};
}
/* 新建时给一份带订单号的默认模版，别让人对着空框想措辞 */
function msgCfgDefaultTpl(side,eventType){
    if(side==='cust'){
        return eventType==='问题件'
            ?'您的订单 ${订单号} 在 ${发生时间} 登记了问题件（${问题件类型}），我们会尽快与您联系。'
            :'您好，您的订单 ${订单号} 已于 ${发生时间} 更新至「${事件节点}」，请留意。';
    }
    return eventType==='问题件'
        ?'订单 ${订单号}（运单 ${运单号}）登记问题件：${问题件类型}，客户 ${客户名称}，请及时跟进。'
        :'订单 ${订单号}（${客户名称}）节点更新：${事件节点}，发生时间 ${发生时间}，请安排后续处理。';
}
function msgCfgNodesOf(eventType){
    return eventType==='业务节点'?MSG_CFG_BIZ_NODES:MSG_CFG_ISSUE_NODES;
}
function msgCfgSideOn(side){return !!(_msgCfgCtx&&_msgCfgCtx[side]&&_msgCfgCtx[side].on);}

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
        _msgCfgCtx.emp.tpl=msgCfgDefaultTpl('emp','问题件');
        _msgCfgCtx.cust.tpl=msgCfgDefaultTpl('cust','问题件');
    }else{
        var row=rowData||(((typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(TC[id].d||[]))[rowIdx]||[]);
        var cfgNo=fclFinGet(id,row,'配置编号');
        _msgCfgCtx=msgCfgNewCtx();
        _msgCfgCtx.id=id;_msgCfgCtx.idx=rowIdx;_msgCfgCtx.cfgNo=cfgNo;
        _msgCfgCtx.eventType=fclFinGet(id,row,'事件类型')||'问题件';
        _msgCfgCtx.node=fclFinGet(id,row,'事件节点')||msgCfgNodesOf(_msgCfgCtx.eventType)[0];
        msgCfgLoadDetail(_msgCfgCtx,_MSG_CFG_DETAIL[cfgNo]);
    }
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=
        (mode==='add'?tr('新增消息配置'):isView?tr('查看消息配置'):tr('编辑消息配置'))+' - '+_msgCfgCtx.cfgNo;
    document.getElementById('crud-modal-body').innerHTML=msgCfgBodyHtml(isView);
    document.getElementById('crud-modal-footer').innerHTML=isView
        ?'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>'
        :'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
         '<button onclick="submitMsgConfig()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认保存')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
/* 回显存下来的结构；顺带兼容改版前「单侧 type+mode」那版旧数据 */
function msgCfgLoadDetail(ctx,saved){
    if(!saved)return;
    ctx.issues=(saved.issues||[]).slice();
    if(saved.cust||saved.emp){
        var sc=saved.cust||{},se=saved.emp||{};
        ctx.cust={on:!!sc.on,mode:'bind',tpl:String(sc.tpl||'')};
        ctx.emp={on:!!se.on,mode:se.mode||'bind',binds:(se.binds||[]).slice(),
                 depts:(se.depts||[]).slice(),ids:(se.ids||[]).slice(),tpl:String(se.tpl||'')};
    }else{
        /* 旧结构 {type:'cust'|'emp',mode,binds,levels,ids,depts}：按当时的单侧语义搬过来 */
        var isCust=saved.type==='cust';
        ctx.cust={on:isCust,mode:'bind',tpl:''};
        ctx.emp={on:!isCust,mode:isCust?'bind':(saved.mode||'bind'),
                 binds:(saved.binds||[]).slice(),depts:(saved.depts||[]).slice(),
                 ids:isCust?[]:(saved.ids||[]).slice(),tpl:''};
    }
    /* 勾了但没写模版的，补一份默认的，保存时不至于发空白消息 */
    ['cust','emp'].forEach(function(s){
        if(ctx[s].on&&!ctx[s].tpl)ctx[s].tpl=msgCfgDefaultTpl(s,ctx.eventType);
    });
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
    /* ② 发送对象：客户与员工可以同时勾 */
    h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-amber-500 rounded"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('② 消息发送对象（客户与员工可同时选择）')+'</span></div>';
    h+='<div class="mb-3 flex items-center gap-2 flex-wrap"><span class="text-sm font-medium text-text-secondary">'+tr('发送给')+'</span>';
    [['cust','客户'],['emp','员工']].forEach(function(t){
        var on=msgCfgSideOn(t[0]);
        h+='<label data-msgcfg-chip="'+t[0]+'" class="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg '+(isView?'':'cursor-pointer')+' '+
           (on?'border-primary-500 bg-primary-50 text-primary-700':'border-surface-200 bg-white text-text-secondary hover:bg-surface-50')+'">'+
           '<input type="checkbox" data-msgcfg-side="'+t[0]+'"'+(on?' checked':'')+
           (isView?' disabled':' onchange="msgCfgToggleSide(\''+t[0]+'\',this.checked)"')+' class="rounded border-surface-300 text-primary-600">'+
           '<span class="text-sm font-medium">'+tr(t[1])+'</span></label>';
    });
    h+='<span class="text-xs text-text-muted ml-1">'+esc(tr('两侧各自一套接收范围和内容模版'))+'</span>';
    h+='</div>';
    h+='<div id="msgcfg-scope-wrap" class="space-y-3">'+msgCfgScopePanels(isView)+'</div>';
    h+='</div>';
    /* ③ 内容模版 */
    h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-success-500 rounded"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('③ 内容模版（$'+'{参数} 事件触发时按单据取值替换）')+'</span></div>';
    h+='<div id="msgcfg-tpl-wrap" class="space-y-3">'+msgCfgTplPanels(isView)+'</div>';
    h+='</div>';
    h+='<div id="msgcfg-preview-wrap">'+msgCfgPreviewHtml()+'</div>';
    h+='</div>';
    return h;
}
function msgCfgNodeSelectHtml(isView){
    var ctx=_msgCfgCtx;
    var h='<select id="msgcfg-node" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+
        (isView?' disabled':' onchange="msgCfgChanged()"')+'>';
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

/* ---------- 发送对象：两侧独立 ---------- */
function msgCfgToggleSide(side,on){
    msgCfgReadUI();
    var ctx=_msgCfgCtx;
    ctx[side].on=!!on;
    /* 刚勾上且没写过模版的，补一份带订单号的默认模版 */
    if(on&&!ctx[side].tpl)ctx[side].tpl=msgCfgDefaultTpl(side,ctx.eventType);
    var chip=document.querySelector('[data-msgcfg-chip="'+side+'"]');
    if(chip)chip.className='inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer '+
        (on?'border-primary-500 bg-primary-50 text-primary-700':'border-surface-200 bg-white text-text-secondary hover:bg-surface-50');
    msgCfgRerenderSides();
}
function msgCfgRerenderSides(){
    var sw=document.getElementById('msgcfg-scope-wrap');
    if(sw)sw.innerHTML=msgCfgScopePanels(false);
    var tw=document.getElementById('msgcfg-tpl-wrap');
    if(tw)tw.innerHTML=msgCfgTplPanels(false);
    msgCfgRefreshPreview();
}
function msgCfgSetMode(side,mode){
    msgCfgReadUI();
    _msgCfgCtx[side].mode=mode;
    var panel=document.getElementById('msgcfg-scope-'+side);
    if(panel)panel.outerHTML=msgCfgScopePanel(side,false);
    msgCfgRefreshPreview();
}
function msgCfgScopePanels(isView){
    var h='';
    if(msgCfgSideOn('cust'))h+=msgCfgScopePanel('cust',isView);
    if(msgCfgSideOn('emp'))h+=msgCfgScopePanel('emp',isView);
    if(!h)h='<div class="px-3 py-6 text-center text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg">'+
            esc(tr('请至少勾选一个发送对象（客户 / 员工）'))+'</div>';
    return h;
}
/* 客户侧只有「单据所属客户」一档：系统事件必然挂在一张业务单据上，
 * 发给这张单的客户才讲得通。员工侧默认按单据所属，但另外三档仍可选。 */
function msgCfgScopePanel(side,isView){
    var ctx=_msgCfgCtx,isCust=side==='cust';
    var modes=isCust?[['bind','单据所属客户']]
                    :[['bind','按单据所属'],['all','全体员工'],['dept','按组织架构'],['pick','指定员工']];
    var h='<div id="msgcfg-scope-'+side+'" class="border border-surface-200 rounded-lg overflow-hidden">';
    h+='<div class="px-3 py-2 bg-surface-50 flex items-center gap-2 flex-wrap">'+
       '<span class="w-1 h-4 '+(isCust?'bg-primary-500':'bg-amber-500')+' rounded"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr(isCust?'客户接收范围':'员工接收范围')+'</span>'+
       (isCust?'<span class="text-xs text-text-muted">'+esc(tr('固定为单据所属客户，不能改选其他'))+'</span>':'')+'</div>';
    h+='<div class="p-3">';
    h+='<div class="flex flex-wrap gap-x-4 gap-y-2 mb-3">';
    modes.forEach(function(m){
        var locked=isView||(isCust&&modes.length===1);
        h+='<label class="inline-flex items-center gap-1.5'+(locked?' opacity-80':' cursor-pointer')+'">'+
           '<input type="radio" name="msgcfg-mode-'+side+'" value="'+m[0]+'"'+(ctx[side].mode===m[0]?' checked':'')+
           (locked?' disabled':' onchange="msgCfgSetMode(\''+side+'\',\''+m[0]+'\')"')+' class="text-primary-600">'+
           '<span class="text-sm text-text-primary">'+tr(m[1])+'</span></label>';
    });
    h+='</div>';
    h+='<div class="min-h-[120px]">'+(isCust?msgCfgCustCond(isView):msgCfgEmpCond(isView))+'</div>';
    h+='</div></div>';
    return h;
}
function msgCfgHint(text){
    return '<div class="px-3 py-8 text-center text-sm text-text-muted">'+esc(tr(text))+'</div>';
}
function msgCfgCustCond(isView){
    return '<div class="space-y-2">'+
        '<div class="flex items-center justify-between px-3 py-2.5 border border-primary-200 bg-primary-50/50 rounded-lg">'+
        '<span class="inline-flex items-center gap-2"><input type="radio" checked disabled class="text-primary-600">'+
        '<span class="text-sm font-medium text-text-primary">'+tr('单据所属客户')+'</span></span>'+
        '<span class="text-xs text-text-muted">'+tr('随单据动态解析')+'</span></div>'+
        '<div class="px-3 py-2 text-xs text-text-muted bg-amber-50 border border-amber-100 rounded-lg">'+
        esc(tr('事件发生时只发给这张业务单据上的客户，不会发给其他客户；单据换客户，接收人跟着换。'))+'</div>'+
        '</div>';
}
function msgCfgEmpCond(isView){
    var ctx=_msgCfgCtx,e=ctx.emp,emps=msgEmployees();
    var dis=isView?' disabled':'',chg=isView?'':' onchange="msgCfgChanged()"';
    if(e.mode==='all')return msgCfgHint('将发送给全体在职员工，共 '+emps.length+' 人（离职自动排除）');
    if(e.mode==='dept'){
        var tree=msgDeptTree();
        var h='<div class="border border-surface-200 rounded-lg max-h-44 overflow-auto">';
        tree.forEach(function(b){
            h+='<div class="px-3 py-1.5 bg-surface-50 text-xs font-medium text-text-secondary sticky top-0">'+esc(b.branch)+'</div>';
            b.depts.forEach(function(dp){
                var n=msgEmpDeptCount(dp.code);
                h+='<label class="flex items-center justify-between px-3 py-2 hover:bg-primary-50/40 cursor-pointer border-t border-surface-100">'+
                   '<span class="inline-flex items-center gap-2"><input type="checkbox" data-cfg-dept="'+esc(dp.code)+'"'+
                   (e.depts.indexOf(dp.code)>=0?' checked':'')+dis+chg+' class="rounded border-surface-300 text-primary-600">'+
                   '<span class="text-sm text-text-primary">'+esc(dp.name)+'</span></span>'+
                   '<span class="text-xs '+(n?'text-text-muted':'text-amber-600')+'">'+n+' '+tr('人')+'</span></label>';
            });
        });
        return h+'</div>';
    }
    if(e.mode==='bind'){
        /* 按单据所属：不写死名单，事件发生时从业务单据上取负责人 */
        var h2='<div class="space-y-2">';
        MSG_CFG_BIND_ROLES.forEach(function(r){
            h2+='<label class="flex items-center justify-between px-3 py-2 border border-surface-200 rounded-lg hover:bg-primary-50/40 cursor-pointer">'+
               '<span class="inline-flex items-center gap-2"><input type="checkbox" data-cfg-bind="'+esc(r)+'"'+
               (e.binds.indexOf(r)>=0?' checked':'')+dis+chg+' class="rounded border-surface-300 text-primary-600">'+
               '<span class="text-sm text-text-primary">'+esc(tr(r))+'</span></span>'+
               '<span class="text-xs text-text-muted">'+tr('随单据动态解析')+'</span></label>';
        });
        h2+='<div class="px-3 py-2 text-xs text-text-muted bg-amber-50 border border-amber-100 rounded-lg">'+
           esc(tr('事件发生时按业务单据上的所属人员发消息：单据换负责人，接收人跟着换。'))+'</div>';
        return h2+'</div>';
    }
    var h3='<div class="border border-surface-200 rounded-lg max-h-44 overflow-auto divide-y divide-surface-100">';
    emps.forEach(function(x){
        h3+='<label class="flex items-center justify-between px-3 py-2 hover:bg-primary-50/40 cursor-pointer">'+
            '<span class="inline-flex items-center gap-2"><input type="checkbox" data-cfg-emp="'+esc(x.name)+'"'+
            (e.ids.indexOf(x.name)>=0?' checked':'')+dis+chg+' class="rounded border-surface-300 text-primary-600">'+
            '<span class="text-sm text-text-primary">'+esc(x.name)+'</span></span>'+
            '<span class="text-xs text-text-muted">'+esc(x.post)+'</span></label>';
    });
    return h3+'</div>';
}

/* ---------- 内容模版 ---------- */
function msgCfgTplPanels(isView){
    var h='';
    if(msgCfgSideOn('cust'))h+=msgCfgTplPanel('cust',isView);
    if(msgCfgSideOn('emp'))h+=msgCfgTplPanel('emp',isView);
    if(!h)h='<div class="px-3 py-4 text-center text-xs text-text-muted border border-dashed border-surface-200 rounded-lg">'+
            esc(tr('勾选发送对象后在这里写对应的消息内容'))+'</div>';
    return h;
}
function msgCfgTplPanel(side,isView){
    var ctx=_msgCfgCtx,isCust=side==='cust';
    var h='<div class="border border-surface-200 rounded-lg overflow-hidden">';
    h+='<div class="px-3 py-2 bg-surface-50 flex items-center gap-2">'+
       '<span class="w-1 h-4 '+(isCust?'bg-primary-500':'bg-amber-500')+' rounded"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr(isCust?'发给客户的内容':'发给员工的内容')+'</span>'+
       '<span class="text-red-500">*</span></div>';
    h+='<div class="p-3 space-y-2">';
    if(!isView){
        /* 参数点一下插到光标处；订单号排第一并标出来，它是主参数 */
        h+='<div class="flex items-center gap-1.5 flex-wrap">';
        h+='<span class="text-xs text-text-muted">'+tr('插入参数')+'</span>';
        MSG_CFG_TPL_PARAMS.forEach(function(p,i){
            h+='<button type="button" onclick="msgCfgInsertParam(\''+side+'\',\''+p[0]+'\')" '+
               'class="h-6 px-2 text-[11px] rounded border cursor-pointer '+
               (i===0?'border-primary-300 bg-primary-50 text-primary-700 font-medium':'border-surface-200 bg-white text-text-secondary hover:bg-surface-50')+
               '">${'+esc(p[0])+'}</button>';
        });
        h+='</div>';
    }
    h+='<textarea id="msgcfg-tpl-'+side+'" data-cfg-tpl="'+side+'" rows="3"'+(isView?' disabled':' oninput="msgCfgTplChanged(\''+side+'\')"')+
       ' class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+
       esc(tr('例：您的订单 ${订单号} 已到仓'))+'">'+esc(ctx[side].tpl)+'</textarea>';
    h+='<div id="msgcfg-tplprev-'+side+'" class="text-xs">'+msgCfgTplPreviewHtml(side)+'</div>';
    h+='</div></div>';
    return h;
}
/* 把 ${参数} 换成示例值，让人一眼看到发出去长什么样 */
function msgCfgRenderTpl(text){
    var s=String(text||'');
    MSG_CFG_TPL_PARAMS.forEach(function(p){
        s=s.split('${'+p[0]+'}').join(p[1]);
    });
    return s;
}
/* 认出文本里用到的参数；顺带挑出写错的（不在参数表里的占位符） */
function msgCfgTplParamsUsed(text){
    var known=msgCfgTplParamNames(),used=[],bad=[];
    String(text||'').replace(/\$\{([^}]*)\}/g,function(m,name){
        name=String(name).trim();
        if(known.indexOf(name)>=0){if(used.indexOf(name)<0)used.push(name);}
        else if(bad.indexOf(name)<0)bad.push(name);
        return m;
    });
    return {used:used,bad:bad};
}
function msgCfgTplPreviewHtml(side){
    var ctx=_msgCfgCtx,tpl=ctx[side].tpl;
    if(!String(tpl||'').trim()){
        return '<span class="text-amber-700">'+esc(tr('还没写内容，保存时会拦下'))+'</span>';
    }
    var pu=msgCfgTplParamsUsed(tpl);
    var h='<div class="px-2.5 py-2 rounded bg-surface-50 border border-surface-100 text-text-secondary">'+
          '<span class="text-text-muted">'+tr('预览')+'：</span>'+esc(msgCfgRenderTpl(tpl))+'</div>';
    if(pu.bad.length){
        h+='<div class="mt-1 text-amber-700">'+esc(tr('这些参数不认识，发出去会原样显示'))+'：'+
           esc(pu.bad.map(function(b){return '${'+b+'}';}).join(' '))+'</div>';
    }
    if(pu.used.indexOf('订单号')<0){
        h+='<div class="mt-1 text-amber-700">'+esc(tr('建议带上 ${订单号}，收到的人才知道是哪一票货'))+'</div>';
    }
    return h;
}
/* 插到光标处而不是末尾：模版常常要在句子中间插一个订单号 */
function msgCfgInsertParam(side,name){
    var el=document.getElementById('msgcfg-tpl-'+side);
    if(!el)return;
    var token='${'+name+'}';
    var v=String(el.value||'');
    var s=(typeof el.selectionStart==='number')?el.selectionStart:v.length;
    var e=(typeof el.selectionEnd==='number')?el.selectionEnd:v.length;
    el.value=v.slice(0,s)+token+v.slice(e);
    if(typeof el.focus==='function')el.focus();
    if(typeof el.setSelectionRange==='function')el.setSelectionRange(s+token.length,s+token.length);
    msgCfgTplChanged(side);
}
function msgCfgTplChanged(side){
    var el=document.getElementById('msgcfg-tpl-'+side);
    if(el)_msgCfgCtx[side].tpl=String(el.value||'');
    var box=document.getElementById('msgcfg-tplprev-'+side);
    if(box)box.innerHTML=msgCfgTplPreviewHtml(side);
    msgCfgRefreshPreview();
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
    if(document.querySelector('[data-cfg-dept]'))ctx.emp.depts=pick('[data-cfg-dept]');
    if(document.querySelector('[data-cfg-emp]'))ctx.emp.ids=pick('[data-cfg-emp]');
    if(document.querySelector('[data-cfg-bind]'))ctx.emp.binds=pick('[data-cfg-bind]');
    if(document.querySelector('[data-cfg-issue]'))ctx.issues=pick('[data-cfg-issue]');
    ['cust','emp'].forEach(function(s){
        var t=document.getElementById('msgcfg-tpl-'+s);
        if(t)ctx[s].tpl=String(t.value||'');
    });
    var node=document.getElementById('msgcfg-node');
    if(node&&node.value)ctx.node=node.value;
}
function msgCfgRefreshPreview(){
    var box=document.getElementById('msgcfg-preview-wrap');
    if(box)box.innerHTML=msgCfgPreviewHtml();
}
function msgCfgChanged(){
    msgCfgReadUI();
    msgCfgRefreshPreview();
}
function msgCfgSetEventType(t){
    var ctx=_msgCfgCtx;
    if(ctx.eventType===t)return;
    msgCfgReadUI();
    ctx.eventType=t;
    /* 事件节点选项整组换：原来的节点在新类型里多半不存在，直接落到第一个 */
    ctx.node=msgCfgNodesOf(t)[0];
    if(t!=='问题件')ctx.issues=[];   /* 业务节点下问题件类型没有意义，顺手清掉 */
    var wrap=document.getElementById('msgcfg-node-wrap');
    if(wrap)wrap.innerHTML=msgCfgNodeSelectHtml(false);
    var iw=document.getElementById('msgcfg-issue-wrap');
    if(iw)iw.innerHTML=msgCfgIssuePanel(false);
    msgCfgRefreshPreview();
}
/* 员工侧命中数：能静态解析的给数字；按单据所属只能给说明（事件发生才知道是谁） */
function msgCfgEmpHit(){
    var e=_msgCfgCtx.emp;
    if(e.mode==='all')return {n:msgEmployees().length,dynamic:false};
    if(e.mode==='dept')return {n:e.depts.reduce(function(a,d){return a+msgEmpDeptCount(d);},0),dynamic:false};
    if(e.mode==='pick')return {n:e.ids.length,dynamic:false};
    return {n:0,dynamic:true};
}
function msgCfgPreviewHtml(){
    var ctx=_msgCfgCtx;
    var parts=[],warn=[];
    if(!msgCfgSideOn('cust')&&!msgCfgSideOn('emp'))warn.push(tr('请至少勾选一个发送对象'));
    if(msgCfgSideOn('cust')){
        parts.push(tr('客户')+'：<span class="font-semibold">'+tr('单据所属客户')+'</span>');
        if(!String(ctx.cust.tpl||'').trim())warn.push(tr('客户内容模版还没写'));
    }
    if(msgCfgSideOn('emp')){
        var hit=msgCfgEmpHit();
        if(hit.dynamic){
            parts.push(tr('员工')+'：'+tr('按单据所属')+' <span class="font-semibold">'+
                (ctx.emp.binds.map(function(b){return tr(b);}).join('、')||'—')+'</span>');
            if(!ctx.emp.binds.length)warn.push(tr('员工侧还没勾要绑定的所属角色'));
        }else{
            parts.push(tr('员工')+'：<span class="font-semibold">'+hit.n+'</span> '+tr('人'));
            if(!hit.n)warn.push(tr('员工侧当前条件没有命中任何人'));
        }
        if(!String(ctx.emp.tpl||'').trim())warn.push(tr('员工内容模版还没写'));
    }
    var ok=!warn.length;
    var cls=ok?'bg-success-50 border-success-100 text-success-700':'bg-amber-50 border-amber-100 text-amber-700';
    var h='<div class="mt-4 px-3 py-2.5 rounded-lg border '+cls+' text-sm">';
    h+=tr('命中')+'：'+(parts.join('　')||'—')+
       '　<span class="text-xs opacity-80">'+esc(tr('事件发生时按单据动态解析'))+'</span>';
    if(ctx.eventType==='问题件'){
        h+='<div class="mt-1.5 text-xs opacity-80">'+tr('问题件类型')+'：'+
           esc(ctx.issues.length?ctx.issues.join('、'):tr('全部问题件类型'))+'</div>';
    }
    if(warn.length)h+='<div class="mt-1.5 text-xs">'+esc(warn.join('；'))+'</div>';
    return h+'</div>';
}

/* ---------- 摘要写回 ---------- */
function msgCfgTypeText(){
    var c=msgCfgSideOn('cust'),e=msgCfgSideOn('emp');
    return c&&e?'客户+员工':(c?'客户消息':(e?'员工消息':''));
}
function msgCfgEmpScopeText(){
    var e=_msgCfgCtx.emp;
    if(e.mode==='all')return tr('全体员工');
    if(e.mode==='dept')return tr('按组织架构')+'('+e.depts.length+' '+tr('个部门')+')';
    if(e.mode==='pick')return tr('指定员工')+'('+e.ids.length+')';
    return tr('按单据所属');
}
function msgCfgScopeText(){
    var parts=[];
    if(msgCfgSideOn('cust'))parts.push(tr('客户')+': '+tr('单据所属客户'));
    if(msgCfgSideOn('emp'))parts.push(tr('员工')+': '+msgCfgEmpScopeText());
    return parts.join('；')||'—';
}
function msgCfgBindText(){
    var ctx=_msgCfgCtx,parts=[];
    if(msgCfgSideOn('emp')&&ctx.emp.mode==='bind'&&ctx.emp.binds.length)parts.push(ctx.emp.binds.join('、'));
    if(msgCfgSideOn('cust'))parts.push(tr('单据所属客户'));
    return parts.join('；')||'—';
}
/* 问题件类型摘要：业务节点下没有这个维度，写「—」 */
function msgCfgIssueText(){
    var ctx=_msgCfgCtx;
    if(ctx.eventType!=='问题件')return '—';
    return ctx.issues.length?ctx.issues.join('、'):tr('全部问题件类型');
}
function msgCfgTplText(){
    var c=msgCfgSideOn('cust'),e=msgCfgSideOn('emp');
    return c&&e?tr('客户/员工各一份'):(c?tr('客户模版'):(e?tr('员工模版'):'—'));
}
function msgCfgTouchText(){
    var parts=[];
    if(msgCfgSideOn('cust'))parts.push(tr('按事件单据动态解析'));
    if(msgCfgSideOn('emp')){
        var hit=msgCfgEmpHit();
        if(hit.dynamic){if(parts.indexOf(tr('按事件单据动态解析'))<0)parts.push(tr('按事件单据动态解析'));}
        else{
            var e=_msgCfgCtx.emp;
            parts.push(e.mode==='pick'
                ?(hit.n+' '+tr('人')+'（'+e.ids.slice(0,3).join('、')+(e.ids.length>3?'…':'')+'）')
                :(hit.n+' '+tr('人')));
        }
    }
    return parts.join('；')||'—';
}
function submitMsgConfig(){
    var ctx=_msgCfgCtx;
    msgCfgReadUI();
    if(!msgCfgSideOn('cust')&&!msgCfgSideOn('emp')){showToast(tr('请至少勾选一个发送对象（客户 / 员工）'));return;}
    if(!ctx.node){showToast(tr('请选择事件节点'));return;}
    if(msgCfgSideOn('emp')){
        var hit=msgCfgEmpHit();
        if(hit.dynamic&&!ctx.emp.binds.length){showToast(tr('请先勾选员工侧要绑定的所属角色'));return;}
        if(!hit.dynamic&&!hit.n){showToast(tr('员工侧当前条件没有命中任何人'));return;}
    }
    var missTpl=['cust','emp'].filter(function(s){return msgCfgSideOn(s)&&!String(ctx[s].tpl||'').trim();});
    if(missTpl.length){showToast(tr('请填写')+(missTpl[0]==='cust'?tr('客户'):tr('员工'))+tr('内容模版'));return;}
    var id=ctx.id;
    var rowVals={
        '事件类型':ctx.eventType,'问题件类型':msgCfgIssueText(),'事件节点':ctx.node,
        '消息类型':msgCfgTypeText(),
        '接收范围':msgCfgScopeText(),'绑定所属':msgCfgBindText(),
        '内容模版':msgCfgTplText(),'触达说明':msgCfgTouchText()
    };
    _MSG_CFG_DETAIL[ctx.cfgNo]={
        issues:ctx.issues.slice(),
        cust:{on:ctx.cust.on,mode:'bind',tpl:ctx.cust.tpl},
        emp:{on:ctx.emp.on,mode:ctx.emp.mode,binds:ctx.emp.binds.slice(),
             depts:ctx.emp.depts.slice(),ids:ctx.emp.ids.slice(),tpl:ctx.emp.tpl}
    };
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
