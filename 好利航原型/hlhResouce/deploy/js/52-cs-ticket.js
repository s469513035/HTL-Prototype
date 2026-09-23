/* ==========================================================================
 * 52 · 客服 › 工单管理 cs-ticket
 *
 * 客服围绕运单开的沟通工单：客户对某张运单有诉求（改地址/催件/费用争议…），
 * 客服建单 → 回复往来 → 处理闭环。与「问题件跟踪」的区别：
 *   问题件是仓库/口岸发现的货物异常；工单是客户主动提的诉求，一张运单可以挂多个工单。
 *
 * 界面按参考图五屏做，样式走系统主体（列表页 / 弹窗骨架 / 状态页签 / 分区标题全复用）：
 *   列表：状态页签 + 查询 + 新建/导出，行内 回复 / 处理 / 留言
 *   新增：运单号(带出客户/状态) + 工单类型 + 标题 + 首条留言 + 附件
 *   回复：工单信息只读 + 回复内容 + 附件 —— 回复追加进留言时间线
 *   处理：处理动作(挂起/恢复/解决/关闭) + 结果说明 —— 挂起/恢复改状态，解决/关闭终态
 *   详情：工单信息 + 留言列表（头像时间线，客服右蓝客户左灰）
 *
 * 运单号下拉取 wb-manage 现有运单，选中带出 客户名称/运单状态 ——
 * 工单必须挂在真实运单上，不带出客户就没有「这是谁的诉求」。
 * ========================================================================== */

var CS_TICKET_TYPES=['改地址','催件','费用争议','货物破损索赔','清关咨询','账户与权限','意见反馈','其他'];
var CS_TICKET_ACTIONS=['挂起','恢复','解决','关闭'];

addPrototypeTable('cs-ticket','工单管理',
    '工单编号|工单标题|工单类型|运单号|客户名称|运单状态|留言数|工单状态|最近回复时间|创建人|创建时间|操作',
    ['待处理','处理中','挂起中','已解决','已关闭'],[
    /* 工单编号 TK + 日期 + 序号，与留言种子的键一一对应；
     * 运单号取 wb-manage 的真实运单（WB-2026052200x），带出客户/状态才跑得通 */
    ['TK20260901001','塞内加尔达喀尔仓提货改地址','改地址','WB-20260522001','深圳市华运达国际货运','已预报','3','处理中','2026-09-02 11:20','谢舒婷','2026-09-01 09:15'],
    ['TK20260902002','5/22 发出的柜子到拉各斯了吗','催件','WB-20260522002','广州远洋进出口贸易','已到货','2','已解决','2026-09-03 16:40','许倩','2026-09-02 14:30'],
    ['TK20260905003','运费与报价单不一致','费用争议','WB-20260522003','佛山恒通货运代理','已确认','4','待处理','2026-09-06 10:05','谢舒婷','2026-09-05 11:00'],
    ['TK20260908004','外箱破损索赔','货物破损索赔','WB-20260522004','东莞市鑫海物流','已退件','2','挂起中','2026-09-10 09:30','许倩','2026-09-08 16:20'],
    ['TK20260910005','清关需要提供什么资料','清关咨询','WB-20260522005','上海锦程国际贸易','已配舱','3','已解决','2026-09-11 15:10','谢舒婷','2026-09-10 08:45'],
    ['TK20260912006','客户要求暂停出货','意见反馈','WB-20260522006','深圳市华运达国际货运','已离港','1','已关闭','2026-09-13 17:25','胡依','2026-09-12 10:50']
],[
    {label:'工单编号',type:'text'},
    {label:'工单标题',type:'text'},
    {label:'工单类型',type:'select',options:CS_TICKET_TYPES},
    {label:'运单号',type:'text'},
    {label:'客户名称',type:'select',options:['深圳市华运达国际货运','广州远洋进出口贸易','佛山恒通货运代理','东莞市鑫海物流','上海锦程国际贸易']},
    {label:'工单状态',type:'select',options:['待处理','处理中','挂起中','已解决','已关闭']}
]);
/* 工单按真实客服操作来，不做 200 行填充 */
TC['cs-ticket'].noExpand=true;
TC['cs-ticket'].noAutoAudit=true;
/* 首列工单编号即唯一身份，显式声明（防以后改列后回写串行） */
TC['cs-ticket'].rowKeyCols=['工单编号'];
/* 插页必须显式按「工单状态」过滤：这张表还有一个「运单状态」列（排在前面），
 * 引擎认状态列用 h.includes('状态') 首个命中，不指定的话会去筛运单状态。 */
TC['cs-ticket'].statusMatch=function(row,tab,headers){
    var i=headers.indexOf('工单状态');
    return i>=0&&row[i]===tab;
};

/* ---------- 留言时间线：工单编号 -> [{who,role,time,content,att}] ----------
 * role: 'cs'=客服（右侧蓝），'cust'=客户（左侧灰）。首条留言是建单时写进来的。 */
var _CS_TICKET_MSGS={
'TK20260901001':[
    {who:'谢舒婷',role:'cs',time:'2026-09-01 09:15',content:'客户来电：收货地址由达喀尔 A 区改为 B 区工厂，请海外仓更新派送地址。',att:''},
    {who:'华运达-张经理',role:'cust',time:'2026-09-01 10:02',content:'麻烦尽快改，工厂月底前要用这批货。',att:''},
    {who:'谢舒婷',role:'cs',time:'2026-09-02 11:20',content:'已联系达喀尔仓更新派送地址并回传截图，请查收附件确认。',att:'地址变更确认.png'}
],
'TK20260902002':[
    {who:'许倩',role:'cs',time:'2026-09-02 14:30',content:'客户咨询 6/13 上海发出的柜子是否到港。',att:''},
    {who:'远洋-李总',role:'cust',time:'2026-09-02 15:10',content:'客户等着清关，麻烦给个预计到港时间。',att:''},
    {who:'许倩',role:'cs',time:'2026-09-03 16:40',content:'柜子 9/2 晚已靠泊拉各斯港，提货单已发邮箱，清关资料请查收。',att:''}
],
'TK20260905003':[
    {who:'谢舒婷',role:'cs',time:'2026-09-05 11:00',content:'客户对 WB-20260612008 的海运费有异议，认为与报价单不符。',att:''},
    {who:'恒通-赵经理',role:'cust',time:'2026-09-05 13:42',content:'报价单上写的是 3200/柜，账单怎么是 3520？',att:'报价单-6月.pdf'},
    {who:'谢舒婷',role:'cs',time:'2026-09-05 15:20',content:'差额 320 是旺季附加费（PSS），6/15 后出的账单都有，报价单备注第 3 条有说明。',att:''},
    {who:'恒通-赵经理',role:'cust',time:'2026-09-06 10:05',content:'那把附加费的收费标准发我一份。',att:''}
],
'TK20260908004':[
    {who:'许倩',role:'cs',time:'2026-09-08 16:20',content:'客户反映 WB-20260613005 到货外箱破损，附验货照片，申请索赔。',att:'验货照片-破损.jpg'},
    {who:'鑫海-孙主管',role:'cust',time:'2026-09-10 09:30',content:'客户要求先核算损失金额，等保险公司回复。',att:''}
],
'TK20260910005':[
    {who:'谢舒婷',role:'cs',time:'2026-09-10 08:45',content:'客户咨询发尼日利亚的清关资料清单。',att:''},
    {who:'锦程-陈经理',role:'cust',time:'2026-09-10 09:30',content:'第一次做 Formal Entry，需要 FORM M 吗？',att:''},
    {who:'谢舒婷',role:'cs',time:'2026-09-11 15:10',content:'已发送清关资料清单（含 FORM M 办理指引）到邮箱，有问题随时联系。',att:'清关资料清单.pdf'}
],
'TK20260912006':[
    {who:'胡依',role:'cs',time:'2026-09-12 10:50',content:'客户因内部调整要求暂停 WB-20260613003 出货，已同步操作组。',att:''}
]
};
function csTicketMsgsOf(no){return _CS_TICKET_MSGS[String(no||'')]||[];}
function csTicketCell(row,name){
    var h=(TC['cs-ticket']||{}).h||[],i=h.indexOf(name);
    return i>=0&&row?(row[i]==null?'':String(row[i])):'';
}
/* 工具：渲染行（含 _listData 路径）取行 */
function csTicketRowByNo(no){
    var c=TC['cs-ticket']||{};
    var view=(typeof _listData!=='undefined'&&_listData['cs-ticket'])?_listData['cs-ticket']:c.d;
    return (view||[]).filter(function(r){return csTicketCell(r,'工单编号')===no;})[0]||null;
}

/* ---------- 运单号带出：客户名称 / 运单状态 ---------- */
function csTicketWaybillOptions(){
    var c=TC['wb-manage']||{};
    var h=c.h||[],iNo=h.indexOf('运单号');
    if(iNo<0)return [];
    return (c.d||[]).map(function(r){return String(r[iNo]||'');}).filter(Boolean);
}
function csTicketWbInfo(wbNo){
    var c=TC['wb-manage']||{};
    var h=c.h||[],iNo=h.indexOf('运单号'),iC=h.indexOf('客户名称'),iS=h.indexOf('运单状态');
    var row=(c.d||[]).filter(function(r){return String(r[iNo]||'')===wbNo;})[0];
    if(!row)return null;
    return {cust:iC>=0?String(row[iC]||''):'',status:iS>=0?String(row[iS]||''):''};
}
function csTicketWbPicked(sel){
    var info=csTicketWbInfo(sel.value);
    var c=function(id){return document.getElementById(id);};
    if(c('cs-tk-cust'))c('cs-tk-cust').value=info?info.cust:'';
    if(c('cs-tk-wbst'))c('cs-tk-wbst').value=info?info.status:'';
}

/* ---------- 新增工单（参考图 2：基本信息 + 附件信息） ---------- */
var _csTkAddCtx={};
function openCsTicketAdd(){
    var no=(function(){
        var c=TC['cs-ticket'],n=(c.d||[]).length+1;
        var d=new Date(),p=function(x){return String(x).padStart(2,'0');};
        return 'TK'+d.getFullYear()+p(d.getMonth()+1)+String(n).padStart(3,'0');
    })();
    _csTkAddCtx={};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('新增工单');
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    var roCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary cursor-not-allowed';
    var lbl=function(t,req){return '<label class="text-sm font-medium text-text-secondary">'+(req?'<span class="text-red-500 mr-0.5">*</span>':'')+tr(t)+'</label>';};
    var wbs=csTicketWaybillOptions();
    var h='<div class="space-y-5">';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('基本信息')+'</span></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5">'+lbl('运单号',true)+
       '<select id="cs-tk-wb" onchange="csTicketWbPicked(this)" class="'+inCls+'">'+
       '<option value="">'+tr('请选择运单号')+'</option>'+
       wbs.map(function(w){return '<option value="'+esc(w)+'">'+esc(w)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('工单类型',true)+
       '<select id="cs-tk-type" class="'+inCls+'"><option value="">'+tr('请选择工单类型')+'</option>'+
       CS_TICKET_TYPES.map(function(t){return '<option>'+esc(t)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('客户名称')+
       '<input id="cs-tk-cust" type="text" readonly class="'+roCls+'" placeholder="'+tr('选择运单号后自动带出')+'"></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('运单状态')+
       '<input id="cs-tk-wbst" type="text" readonly class="'+roCls+'" placeholder="'+tr('选择运单号后自动带出')+'"></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2">'+lbl('工单标题',true)+
       '<input id="cs-tk-title" type="text" class="'+inCls+'" placeholder="'+tr('请输入工单标题')+'"></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2">'+lbl('首条留言内容',true)+
       '<textarea id="cs-tk-first" rows="4" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+tr('请输入首条留言内容')+'"></textarea></div>';
    h+='</div></section>';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('附件信息')+'</span></div>'+
       '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">'+
       (typeof crmAttachmentSlot==='function'
           ?crmAttachmentSlot('cstk1','附件','大小不能超过5M，支持 jpg、png、pdf 格式','image/jpeg,image/png,.pdf',false)
           :'')+
       '</div></section>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitCsTicketAdd()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function submitCsTicketAdd(){
    var v=function(id){var e=document.getElementById(id);return e?String(e.value||'').trim():'';};
    var wb=v('cs-tk-wb'),type=v('cs-tk-type'),title=v('cs-tk-title'),first=v('cs-tk-first');
    if(!wb){showToast(tr('请选择运单号'));return;}
    if(!type){showToast(tr('请选择工单类型'));return;}
    if(!title){showToast(tr('请输入工单标题'));return;}
    if(!first){showToast(tr('请输入首条留言内容'));return;}
    var info=csTicketWbInfo(wb)||{};
    var who=(typeof getCurrentUserName==='function')?getCurrentUserName():'客服';
    var now=(typeof receiptNowStr==='function')?receiptNowStr():'';
    /* 编号：TK + 当天 + 序号（表内行数递增，同日撞号往后顺延） */
    var d=new Date(),p=function(x){return String(x).padStart(2,'0');};
    var day=String(d.getFullYear())+p(d.getMonth()+1);
    var exist={};(TC['cs-ticket'].d||[]).forEach(function(r){exist[csTicketCell(r,'工单编号')]=1;});
    var n=(TC['cs-ticket'].d||[]).length+1,no;
    do{no='TK'+day+String(n).padStart(3,'0');n++;}while(exist[no]);
    fclPushRow('cs-ticket',{
        '工单编号':no,'工单标题':title,'工单类型':type,'运单号':wb,
        '客户名称':info.cust||'','运单状态':info.status||'','留言数':'1',
        '工单状态':'待处理','最近回复时间':'','创建人':who,'创建时间':now
    });
    _CS_TICKET_MSGS[no]=[{who:who,role:'cs',time:now,content:first,att:''}];
    if(typeof _listData!=='undefined')delete _listData['cs-ticket'];
    closeCrudModal();
    fclFinRefresh('cs-ticket');
    showToast(tr('工单已创建')+'：'+no);
}

/* ---------- 工单信息只读条（回复/详情共用） ---------- */
function csTicketInfoBar(row){
    var one=function(name){
        var v=csTicketCell(row,name);
        return '<div class="min-w-0"><span class="text-text-muted">'+tr(name)+'：</span>'+
               (name==='工单状态'?statusBadge(v||'待处理')
                 :(name==='运单号'?'<span class="font-semibold text-primary-700">'+esc(v||'—')+'</span>'
                 :'<span class="text-text-primary">'+esc(v||'—')+'</span>'))+'</div>';
    };
    var h='<div class="rounded-lg border border-surface-200 bg-surface-50/60 px-3 py-2.5 text-xs text-text-secondary grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1.5">';
    ['工单编号','工单类型','工单状态','工单标题','运单号','客户名称'].forEach(function(n){h+=one(n);});
    h+='</div>';
    return h;
}

/* ---------- 回复（参考图 3：工单信息 + 回复内容 + 附件） ---------- */
var _csTkReplyCtx={no:''};
function openCsTicketReply(id,rowIdx){
    var c=TC['cs-ticket']||{};
    var view=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var row=rowIdx>=0?view[rowIdx]:null;
    if(!row){showToast(tr('未找到工单'));return;}
    var no=csTicketCell(row,'工单编号');
    _csTkReplyCtx={no:no};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('工单回复')+' - '+no;
    var h='<div class="space-y-5">';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('工单信息')+'</span></div>'+csTicketInfoBar(row)+'</section>';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('回复内容')+'</span></div>'+
       '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('回复内容')+'</label>'+
       '<textarea id="cs-tk-reply" rows="4" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+tr('请输入回复内容')+'"></textarea></div></section>';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('附件信息')+'</span></div>'+
       '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">'+
       (typeof crmAttachmentSlot==='function'
           ?crmAttachmentSlot('cstk-r1','附件','大小不能超过5M，支持 jpg、png、pdf 格式','image/jpeg,image/png,.pdf',false)
           :'')+
       '</div></section>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitCsTicketReply()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function submitCsTicketReply(){
    var no=_csTkReplyCtx.no;
    var el=document.getElementById('cs-tk-reply');
    var text=el?String(el.value||'').trim():'';
    if(!no){showToast(tr('未找到工单'));return;}
    if(!text){showToast(tr('请输入回复内容'));return;}
    var row=csTicketRowByNo(no);
    var list=_CS_TICKET_MSGS[no]=csTicketMsgsOf(no);
    list.push({who:(typeof getCurrentUserName==='function')?getCurrentUserName():'客服',
        role:'cs',time:(typeof receiptNowStr==='function')?receiptNowStr():'',content:text,att:''});
    if(row){
        fclFinSet('cs-ticket',row,'留言数',String(list.length));
        fclFinSet('cs-ticket',row,'最近回复时间',(typeof receiptNowStr==='function')?receiptNowStr():'');
        /* 待处理的单有人回复了就是处理中；已解决/已关闭/挂起的不动 —— 终态只有处理动作能改 */
        if(csTicketCell(row,'工单状态')==='待处理')fclFinSet('cs-ticket',row,'工单状态','处理中');
    }
    if(typeof _listData!=='undefined')delete _listData['cs-ticket'];
    closeCrudModal();
    fclFinRefresh('cs-ticket');
    showToast(tr('回复已提交'));
}

/* ---------- 处理（参考图 5：处理动作 + 结果说明 + 附件） ---------- */
var _csTkActCtx={no:''};
function openCsTicketProcess(id,rowIdx){
    var c=TC['cs-ticket']||{};
    var view=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var row=rowIdx>=0?view[rowIdx]:null;
    if(!row){showToast(tr('未找到工单'));return;}
    var no=csTicketCell(row,'工单编号');
    _csTkActCtx={no:no};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='56%';
    document.getElementById('crud-modal-title').textContent=tr('工单处理')+' - '+no;
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    var h='<div class="space-y-5">';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('工单信息')+'</span></div>'+csTicketInfoBar(row)+'</section>';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('处理信息')+'</span></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('处理动作')+'</label>'+
       '<select id="cs-tk-act" class="'+inCls+'"><option value="">'+tr('请选择')+'</option>'+
       CS_TICKET_ACTIONS.map(function(a){return '<option>'+esc(a)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary">'+tr('处理结果说明')+'</label>'+
       '<textarea id="cs-tk-note" rows="4" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+tr('请输入处理结果说明')+'"></textarea></div>';
    h+='</div></section>';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('附件信息')+'</span></div>'+
       '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">'+
       (typeof crmAttachmentSlot==='function'
           ?crmAttachmentSlot('cstk-a1','附件','大小不能超过5M，支持 jpg、png、pdf 格式','image/jpeg,image/png,.pdf',false)
           :'')+
       '</div></section>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitCsTicketProcess()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function submitCsTicketProcess(){
    var no=_csTkActCtx.no;
    var v=function(id){var e=document.getElementById(id);return e?String(e.value||'').trim():'';};
    var act=v('cs-tk-act'),note=v('cs-tk-note');
    if(!no){showToast(tr('未找到工单'));return;}
    if(!act){showToast(tr('请选择处理动作'));return;}
    var row=csTicketRowByNo(no);
    if(!row){showToast(tr('未找到工单'));return;}
    /* 动作 -> 状态：挂起/恢复名字即状态；解决/关闭是终态。恢复落到「处理中」而不是「待处理」——
     * 恢复说明有人在跟了。 */
    var to=act==='挂起'?'挂起中':(act==='恢复'?'处理中':(act==='解决'?'已解决':'已关闭'));
    fclFinSet('cs-ticket',row,'工单状态',to);
    /* 处理说明记进留言时间线（谁在什么时候做了什么），免得工单状态变了却查不到原因 */
    var list=_CS_TICKET_MSGS[no]=csTicketMsgsOf(no);
    list.push({who:(typeof getCurrentUserName==='function')?getCurrentUserName():'客服',
        role:'cs',time:(typeof receiptNowStr==='function')?receiptNowStr():'',
        content:'【'+act+'】'+(note||tr('无说明')),att:''});
    fclFinSet('cs-ticket',row,'留言数',String(list.length));
    if(typeof _listData!=='undefined')delete _listData['cs-ticket'];
    closeCrudModal();
    fclFinRefresh('cs-ticket');
    showToast(tr('工单已')+tr(act)+'：'+no);
}

/* ---------- 详情：工单信息 + 留言时间线（参考图 4） ---------- */
function openCsTicketDetail(id,rowIdx){
    var c=TC['cs-ticket']||{};
    var view=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var row=rowIdx>=0?view[rowIdx]:null;
    if(!row){showToast(tr('未找到工单'));return;}
    var no=csTicketCell(row,'工单编号');
    var msgs=csTicketMsgsOf(no);
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='66%';
    document.getElementById('crud-modal-title').textContent=tr('工单详情')+' - '+no;
    var h='<div class="space-y-5">';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('工单信息')+'</span></div>'+csTicketInfoBar(row)+'</section>';
    h+='<section><div class="flex items-center justify-between mb-3">'+
       '<div class="flex items-center gap-2"><span class="w-1 h-4 bg-amber-400 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('留言列表')+'</span></div>'+
       '<span class="text-xs text-text-muted">'+tr('共')+' '+msgs.length+' '+tr('条')+'</span></div>';
    h+='<div class="space-y-3">';
    if(!msgs.length)h+='<div class="py-8 text-center text-sm text-text-muted">'+tr('暂无留言')+'</div>';
    msgs.forEach(function(m){
        var cs=m.role==='cs';
        /* 客服右侧蓝、客户左侧灰 —— 与聊天一致的方向感；头像取姓名首字 */
        var head=esc(String(m.who||'?').slice(0,1));
        var avatar='<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 '+
                   (cs?'bg-primary-600 text-white':'bg-surface-200 text-text-secondary')+'">'+head+'</div>';
        var meta='<span class="font-medium '+(cs?'text-primary-700':'text-text-secondary')+'">'+esc(m.who)+'</span>'+
                 '<span class="ml-2 text-xs text-text-muted">'+esc(m.time)+'</span>';
        var bubble='<div class="rounded-lg px-3 py-2 text-sm leading-relaxed '+(cs?'bg-primary-50 text-text-primary':'bg-surface-100 text-text-secondary')+'">'+
                   esc(m.content)+(m.att?'<div class="mt-1.5">'+((typeof crudAttachmentChipHtml==='function')?crudAttachmentChipHtml(m.att):
                   ('<span class="px-2 py-1 text-xs rounded bg-white border border-surface-200 text-text-secondary">'+esc(m.att)+'</span>'))+'</div>':'')+'</div>';
        h+=cs
            ?'<div class="flex items-start gap-2.5 justify-end"><div class="max-w-[80%]"><div class="text-right mb-1">'+meta+'</div>'+bubble+'</div>'+avatar+'</div>'
            :'<div class="flex items-start gap-2.5">'+avatar+'<div class="max-w-[80%]"><div class="mb-1">'+meta+'</div>'+bubble+'</div></div>';
    });
    h+='</div></section>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
