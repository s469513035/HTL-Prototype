/* ==========================================================================
 * 53 · OMS 客户端 · 客服 › 服务工单 oms-ticket
 *
 * 客户自己在门户上对运单发起诉求（催件/改地址/费用争议…），看客服的回复往来。
 * 参考 TMS 工单管理（js/52-cs-ticket.js）做客户视角裁剪：
 *   - 客户只能 新建 / 追问（回复），不能 处理 —— 完结/关闭是客服的事；
 *   - 没有 运单状态 / 客户名称 列（自己的门户，这两列是冗余）；
 *   - 留言时间线方向反转：客户右（蓝，自己说的），客服左（灰）。
 *
 * 与「订单管理 → 发起工单」共用同一张表和同一条留言时间线（_OMS_TICKETS）：
 * 从订单管理发起 = 运单号预填锁死；从这里新建 = 自己挑运单。落表都是 oms-ticket。
 * ========================================================================== */

/* 工单类型与 TMS 端同源（cs-ticket 的八类），客户视角少一个内部项 */
var OMS_TICKET_TYPES=['改地址','催件','费用争议','货物破损索赔','清关咨询','意见反馈','其他'];
var _OMS_TICKET_STATUSES=['待处理','处理中','已完结','已关闭'];

addPrototypeTable('oms-ticket','服务工单',
    '工单编号|工单标题|工单类型|运单号|留言数|工单状态|最近回复时间|创建时间|操作',
    _OMS_TICKET_STATUSES,[
    /* 编号与 TMS 侧 cs-ticket 分开编（OT 前缀），免得两端口径混掉 */
    ['OT20260912001','达喀尔仓收货地址变更','改地址','WB-20260912001','3','处理中','2026-09-13 10:20','2026-09-12 15:40'],
    ['OT20260908002','9/6 离港的柜子到哪了','催件','WB-20260906006','2','已完结','2026-09-09 11:30','2026-09-08 09:20'],
    ['OT20260905003','账单 BILL-20260901 仓储费有异议','费用争议','WB-20260822012','4','待处理','2026-09-12 14:15','2026-09-05 16:00'],
    ['OT20260902004','清关需要准备什么资料','清关咨询','WB-20260830009','3','已完结','2026-09-04 10:45','2026-09-02 11:30'],
    ['OT20260828005','到货外箱破损 2 件索赔','货物破损索赔','WB-20260825011','2','处理中','2026-09-13 16:05','2026-08-28 10:10']
],[
    {label:'工单编号',type:'text'},
    {label:'工单标题',type:'text'},
    {label:'工单类型',type:'select',options:OMS_TICKET_TYPES},
    {label:'运单号',type:'text'},
    {label:'工单状态',type:'select',options:_OMS_TICKET_STATUSES},
    {label:'创建时间',type:'date'}
]);
TC['oms-ticket'].noExpand=true;
TC['oms-ticket'].noAutoAudit=true;
TC['oms-ticket'].rowKeyCols=['工单编号'];
/* 表里唯一含「状态」的列就是工单状态，引擎默认取数即对；仍显式声明，防以后加列 */
TC['oms-ticket'].statusMatch=function(row,tab,headers){
    var i=headers.indexOf('工单状态');
    return i>=0&&row[i]===tab;
};

/* ---------- 留言时间线（与 TMS cs-ticket 同构；role: cust=客户 cs=客服） ---------- */
var _OMS_TICKET_MSGS={
'OT20260912001':[
    {who:'上海锦程国际',role:'cust',time:'2026-09-12 15:40',content:'收货地址由达喀尔 A 区改为 B 区工厂，请安排。',att:''},
    {who:'王客服',role:'cs',time:'2026-09-12 16:55',content:'已收到，正在联系达喀尔仓更新派送地址。',att:''},
    {who:'王客服',role:'cs',time:'2026-09-13 10:20',content:'地址已更新，变更确认函见附件，请查收。',att:'地址变更确认函.png'}
],
'OT20260908002':[
    {who:'上海锦程国际',role:'cust',time:'2026-09-08 09:20',content:'9/6 从盐田离港的柜子现在到哪了？',att:''},
    {who:'王客服',role:'cs',time:'2026-09-09 11:30',content:'已于 9/8 靠泊特马港，提货单已发邮箱，正在安排清关。',att:''}
],
'OT20260905003':[
    {who:'上海锦程国际',role:'cust',time:'2026-09-05 16:00',content:'BILL-20260901 里的仓储费 120 USD 与合同约定不符，请复核。',att:'合同-仓储费条款.pdf'},
    {who:'李财务',role:'cs',time:'2026-09-05 17:30',content:'已受理，正在核对计费明细。',att:''},
    {who:'上海锦程国际',role:'cust',time:'2026-09-12 14:10',content:'一周了，麻烦给个进度。',att:''},
    {who:'王客服',role:'cs',time:'2026-09-12 14:15',content:'财务复核中，预计本周五前给出结论，抱歉久等。',att:''}
],
'OT20260902004':[
    {who:'上海锦程国际',role:'cust',time:'2026-09-02 11:30',content:'发特马的货清关需要准备什么资料？',att:''},
    {who:'王客服',role:'cs',time:'2026-09-02 14:20',content:'常规箱单发票即可；如涉及带电货物需另附 MSDS。',att:''},
    {who:'王客服',role:'cs',time:'2026-09-04 10:45',content:'已将清关资料清单发送至您的邮箱，请查收。',att:'清关资料清单.pdf'}
],
'OT20260828005':[
    {who:'上海锦程国际',role:'cust',time:'2026-08-28 10:10',content:'WB-20260825011 到货外箱破损 2 件，申请索赔，验货照片见附件。',att:'验货照片.jpg'},
    {who:'王客服',role:'cs',time:'2026-09-13 16:05',content:'定损照片已上传保险，等待核定金额，有结果第一时间同步。',att:''}
]
};
function omsTicketMsgsOf(no){return _OMS_TICKET_MSGS[String(no||'')]||[];}
function omsTicketCell(row,name){
    var h=(TC['oms-ticket']||{}).h||[],i=h.indexOf(name);
    return i>=0&&row?(row[i]==null?'':String(row[i])):'';
}
function omsTicketRowByNo(no){
    var c=TC['oms-ticket']||{};
    var view=(typeof _listData!=='undefined'&&_listData['oms-ticket'])?_listData['oms-ticket']:c.d;
    return (view||[]).filter(function(r){return omsTicketCell(r,'工单编号')===no;})[0]||null;
}

/* ---------- 新建（门户发起 / 订单管理发起共用） ----------
 * lockWb 传入时运单号锁死（从订单管理勾选发起，运单已定），否则下拉自选。 */
function openOmsTicketCreate(lockWb){
    var wbs=(TC['oms-order-mgmt'].d||[]).map(function(r){return omsCell('oms-order-mgmt',r,'运单号');}).filter(Boolean);
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    var roCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary cursor-not-allowed';
    var lbl=function(t,req){return '<label class="text-sm font-medium text-text-secondary">'+(req?'<span class="text-red-500 mr-0.5">*</span>':'')+tr(t)+'</label>';};
    var h='<div class="space-y-5">';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('基本信息')+'</span></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
    if(lockWb){
        h+='<div class="flex flex-col gap-1.5">'+lbl('运单号',true)+
           '<input type="text" readonly value="'+esc(lockWb)+'" class="'+roCls+'"></div>';
    }else{
        h+='<div class="flex flex-col gap-1.5">'+lbl('运单号',true)+
           '<select id="omstk-wb" class="'+inCls+'"><option value="">'+tr('请选择运单号')+'</option>'+
           wbs.map(function(w){return '<option value="'+esc(w)+'">'+esc(w)+'</option>';}).join('')+'</select></div>';
    }
    h+='<div class="flex flex-col gap-1.5">'+lbl('工单类型',true)+
       '<select id="omstk-type" class="'+inCls+'"><option value="">'+tr('请选择工单类型')+'</option>'+
       OMS_TICKET_TYPES.map(function(t){return '<option>'+esc(t)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2">'+lbl('工单标题',true)+
       '<input id="omstk-title" type="text" class="'+inCls+'" placeholder="'+tr('请输入工单标题')+'"></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2">'+lbl('问题描述',true)+
       '<textarea id="omstk-desc" rows="4" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+tr('请描述您的问题')+'"></textarea></div>';
    h+='</div></section>';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('附件信息')+'</span></div>'+
       '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">'+
       (typeof crmAttachmentSlot==='function'
           ?crmAttachmentSlot('omstk1','附件','大小不能超过5M，支持 jpg、png、pdf 格式','image/jpeg,image/png,.pdf',false)
           :'')+
       '</div></section>';
    h+='</div>';
    omsOpenCrud(tr('发起工单')+(lockWb?(' - '+lockWb):''),h,
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitOmsTicketCreate(\''+esc(lockWb||'')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交')+'</button>',
        '62%');
}
function submitOmsTicketCreate(lockWb){
    var v=function(id){var e=document.getElementById(id);return e?String(e.value||'').trim():'';};
    var wb=lockWb||v('omstk-wb'),type=v('omstk-type'),title=v('omstk-title'),desc=v('omstk-desc');
    if(!wb){showToast(tr('请选择运单号'));return;}
    if(!type){showToast(tr('请选择工单类型'));return;}
    if(!title){showToast(tr('请输入工单标题'));return;}
    if(!desc){showToast(tr('请描述您的问题'));return;}
    var now=omsNow();
    var exist={};(TC['oms-ticket'].d||[]).forEach(function(r){exist[omsTicketCell(r,'工单编号')]=1;});
    var d=new Date(),p=function(x){return String(x).padStart(2,'0');};
    var day=String(d.getFullYear())+p(d.getMonth()+1);
    var n=(TC['oms-ticket'].d||[]).length+1,no;
    do{no='OT'+day+String(n).padStart(3,'0');n++;}while(exist[no]);
    /* 运单状态从订单管理带一份快照：客服在 TMS 侧看得到「客户提工单时货在哪」 */
    var ordRow=(TC['oms-order-mgmt'].d||[]).filter(function(r){return omsCell('oms-order-mgmt',r,'运单号')===wb;})[0];
    var ordSt=ordRow?omsCell('oms-order-mgmt',ordRow,'运单状态'):'';
    fclPushRow('oms-ticket',{
        '工单编号':no,'工单标题':title,'工单类型':type,'运单号':wb,
        '留言数':'1','工单状态':'待处理','最近回复时间':'','创建时间':now
    });
    _OMS_TICKET_MSGS[no]=[{who:_OMS_CUST.shortName,role:'cust',time:now,content:desc,att:''}];
    if(ordSt)_OMS_TICKET_WB_SNAPSHOT[no]=ordSt;
    if(typeof _listData!=='undefined')delete _listData['oms-ticket'];
    closeCrudModal();
    omsRefreshList('oms-ticket');
    showToast(tr('工单已提交')+'：'+no+'，'+tr('客服会尽快跟进'));
}
/* 工单创建时刻的运单状态快照（给 TMS 侧看，OMS 列表不展示） */
var _OMS_TICKET_WB_SNAPSHOT={};

/* ---------- 追问（客户侧的「回复」） ---------- */
var _omsTkReplyCtx={no:''};
function openOmsTicketReply(id,rowIdx){
    var c=TC['oms-ticket']||{};
    var view=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var row=rowIdx>=0?view[rowIdx]:null;
    if(!row){showToast(tr('未找到工单'));return;}
    var no=omsTicketCell(row,'工单编号');
    _omsTkReplyCtx={no:no};
    var info=omsTicketInfoBar(row);
    var h='<div class="space-y-5">';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('工单信息')+'</span></div>'+info+'</section>';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('追问内容')+'</span></div>'+
       '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('追问内容')+'</label>'+
       '<textarea id="omstk-reply" rows="4" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+tr('请输入追问内容')+'"></textarea></div></section>';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('附件信息')+'</span></div>'+
       '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">'+
       (typeof crmAttachmentSlot==='function'
           ?crmAttachmentSlot('omstk-r1','附件','大小不能超过5M，支持 jpg、png、pdf 格式','image/jpeg,image/png,.pdf',false)
           :'')+
       '</div></section>';
    h+='</div>';
    omsOpenCrud(tr('工单追问')+' - '+no,h,
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitOmsTicketReply()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交')+'</button>',
        '62%');
}
function submitOmsTicketReply(){
    var no=_omsTkReplyCtx.no;
    var el=document.getElementById('omstk-reply');
    var text=el?String(el.value||'').trim():'';
    if(!no){showToast(tr('未找到工单'));return;}
    if(!text){showToast(tr('请输入追问内容'));return;}
    var row=omsTicketRowByNo(no);
    var list=_OMS_TICKET_MSGS[no]=omsTicketMsgsOf(no);
    list.push({who:_OMS_CUST.shortName,role:'cust',time:omsNow(),content:text,att:''});
    if(row){
        fclFinSet('oms-ticket',row,'留言数',String(list.length));
        fclFinSet('oms-ticket',row,'最近回复时间',omsNow());
    }
    if(typeof _listData!=='undefined')delete _listData['oms-ticket'];
    closeCrudModal();
    omsRefreshList('oms-ticket');
    showToast(tr('追问已提交'));
}

/* ---------- 工单信息只读条 ---------- */
function omsTicketInfoBar(row){
    var one=function(name){
        var v=omsTicketCell(row,name);
        return '<div class="min-w-0"><span class="text-text-muted">'+tr(name)+'：</span>'+
               (name==='工单状态'?statusBadge(v||'待处理')
                 :(name==='运单号'?'<span class="font-semibold text-primary-700">'+esc(v||'—')+'</span>'
                 :'<span class="text-text-primary">'+esc(v||'—')+'</span>'))+'</div>';
    };
    var h='<div class="rounded-lg border border-surface-200 bg-surface-50/60 px-3 py-2.5 text-xs text-text-secondary grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1.5">';
    ['工单编号','工单类型','工单状态','工单标题','运单号','创建时间'].forEach(function(n){h+=one(n);});
    h+='</div>';
    return h;
}

/* ---------- 详情：留言时间线（客户右蓝、客服左灰 —— 与 TMS 端相反） ---------- */
function openOmsTicketDetail(id,rowIdx){
    var c=TC['oms-ticket']||{};
    var view=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var row=rowIdx>=0?view[rowIdx]:null;
    if(!row){showToast(tr('未找到工单'));return;}
    var no=omsTicketCell(row,'工单编号');
    var msgs=omsTicketMsgsOf(no);
    var h='<div class="space-y-5">';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('工单信息')+'</span></div>'+omsTicketInfoBar(row)+'</section>';
    h+='<section><div class="flex items-center justify-between mb-3">'+
       '<div class="flex items-center gap-2"><span class="w-1 h-4 bg-amber-400 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('沟通记录')+'</span></div>'+
       '<span class="text-xs text-text-muted">'+tr('共')+' '+msgs.length+' '+tr('条')+'</span></div>';
    h+='<div class="space-y-3">';
    if(!msgs.length)h+='<div class="py-8 text-center text-sm text-text-muted">'+tr('暂无留言')+'</div>';
    msgs.forEach(function(m){
        var cust=m.role==='cust';
        var head=esc(String(m.who||'?').slice(0,1));
        var avatar='<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 '+
                   (cust?'bg-primary-600 text-white':'bg-surface-200 text-text-secondary')+'">'+head+'</div>';
        var meta='<span class="font-medium '+(cust?'text-primary-700':'text-text-secondary')+'">'+esc(m.who)+'</span>'+
                 '<span class="ml-2 text-xs text-text-muted">'+esc(m.time)+'</span>';
        var bubble='<div class="rounded-lg px-3 py-2 text-sm leading-relaxed '+(cust?'bg-primary-50 text-text-primary':'bg-surface-100 text-text-secondary')+'">'+
                   esc(m.content)+(m.att?'<div class="mt-1.5">'+((typeof crudAttachmentChipHtml==='function')?crudAttachmentChipHtml(m.att):
                   ('<span class="px-2 py-1 text-xs rounded bg-white border border-surface-200 text-text-secondary">'+esc(m.att)+'</span>'))+'</div>':'')+'</div>';
        h+=cust
            ?'<div class="flex items-start gap-2.5 justify-end"><div class="max-w-[80%]"><div class="text-right mb-1">'+meta+'</div>'+bubble+'</div>'+avatar+'</div>'
            :'<div class="flex items-start gap-2.5">'+avatar+'<div class="max-w-[80%]"><div class="mb-1">'+meta+'</div>'+bubble+'</div></div>';
    });
    h+='</div></section>';
    h+='</div>';
    omsOpenCrud(tr('工单详情')+' - '+no,h,
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>',
        '66%');
}

/* ---------- 订单管理 → 发起工单：勾一张订单，工单运单号预填锁死 ---------- */
function omsCreateTicketFromOrder(){
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要发起工单的订单'));return;}
    if(idxs.length>1){showToast(tr('一次只能为一张订单发起工单'));return;}
    var row=omsRowOf('oms-order-mgmt',idxs[0]);
    if(!row){showToast(tr('未找到订单'));return;}
    var wb=omsCell('oms-order-mgmt',row,'运单号');
    var st=omsCell('oms-order-mgmt',row,'运单状态');
    if(st==='已取消'){showToast(tr('已取消的订单不能发起工单'));return;}
    openOmsTicketCreate(wb);
}
