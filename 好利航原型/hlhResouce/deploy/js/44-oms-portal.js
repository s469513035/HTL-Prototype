/* ================= OMS 客户端门户 =================
 * terminal=oms 客户网页端：功能首页 + 订单管理 + 客服（问题件/轨迹查询）+ 账单管理。
 * - 菜单结构见 03-menu-data.js 的 oms-client 节点；
 * - 首页经 renderTabContent 的 pageMode='omsHome' 分支分发（15-tab-dispatch-shipment.js）；
 * - 新增订单复用 pageMode='shipmentEntryClient'（零新代码）；
 * - 三个列表页均 noExpand=true，保持客户视角数据精简、行索引稳定（明细按 gi 取行）。
 *
 * 2026-09 起，订单管理 / 问题件管理 / 轨迹查询三页改为直接复用 TMS 端的实现，
 * 本文件只留种子数据、功能首页和账单管理：
 * - 订单明细 → openWaybillDetail（26-waybill-b-fee.js），客户视角裁剪见该文件的 custView
 * - 问题件明细/回复 → openCsIssueViewModal / openCsIssueFeedbackModal(id,'cust-reply')（28-…）
 * - 轨迹查询 → TC['oms-track-query'].pageMode='trackQuery'（05-tables-build.js）→ generateTrackQueryPage
 * 因此两张表的表头名必须与 TMS 侧对齐（那些弹窗都按表头名取值），改列前先看 28/26 里的取值点。
 */

/* ---------- TC 注册（特殊页） ---------- */
TC['oms-home']={t:'功能首页',pageMode:'omsHome',h:[],s:[],d:[]};
TC['oms-order-entry']={t:'新增订单',pageMode:'shipmentEntryClient',h:[],s:[],d:[]};

/* ---------- 客户基础信息（customer-001 上海锦程国际） ---------- */
var _OMS_CUST={
    code:'HYD-C0001',shortName:'上海锦程国际',fullName:'上海锦程国际物流有限公司',
    level:'A类',type:'直客',settleCycle:'月结',credit:'500,000.00',balance:'86,420.50',
    sales:'李业务',cs:'王客服',country:'中国',email:'ops@jclogistics.com',joinDate:'2018-03-15'
};

/* ---------- 订单种子数据 ---------- */
/* 字段按 TMS 端运单管理（wb-manage）裁剪而来：去掉客户名称/客户代码（客户自己的门户，冗余）、
 * 所属业务员/客服/操作（内部信息）、运费（费用统一在账单管理看）。
 * 插页状态与 TMS 管理端对齐（去掉 OMS 早期的「草稿」：未提交的不进订单管理，只留在新增订单页）。
 * 列序：运单号|物流单号|所属产品|国内仓库|目的仓库|运输方式|件数|重量(KG)|体积(CBM)|运单状态|仓库异常备注|问题件状态|创建时间 */
var _OMS_ORDERS=[
    ['WB-20260912001','SF10086523','西非海运专线','深圳盐田仓','达喀尔海外仓','海运','42','860.50','3.280','已预报','','正常','2026-09-12 09:15'],
    ['WB-20260911002','YT98876543','西非空运专线','广州南沙仓','拉各斯海外仓','空运','18','320.00','1.120','已到货','','正常','2026-09-11 14:20'],
    ['WB-20260910003','JD30088991','西非海运专线','上海浦东仓','阿比让海外仓','海运','65','1,240.80','5.600','已确认','','正常','2026-09-10 10:30'],
    ['WB-20260909004','SF10080112','西非海运专线','深圳盐田仓','特马海外仓','海运','30','655.20','2.450','已配舱','','正常','2026-09-09 16:45'],
    ['WB-20260908005','EMS99005566','西非空运专线','广州南沙仓','杜阿拉海外仓','空运','12','208.60','0.860','已出库','带电货物待补 MSDS','待处理','2026-09-08 11:05'],
    ['WB-20260906006','JD30077812','西非海运专线','深圳盐田仓','达喀尔海外仓','海运','88','1,890.30','7.920','已离港','','正常','2026-09-06 15:30'],
    ['WB-20260904007','SF10075588','西非海运专线','广州南沙仓','拉各斯海外仓','海运','55','1,120.00','4.310','已到港','分拣件数与预报不符','处理中','2026-09-04 08:50'],
    ['WB-20260902008','YT98855221','西非空运专线','上海浦东仓','阿比让海外仓','空运','25','486.40','1.950','海外已到仓','','正常','2026-09-02 13:25'],
    ['WB-20260830009','JD30066534','西非海运专线','深圳盐田仓','特马海外仓','海运','47','980.70','3.760','海外已出仓','','待处理','2026-08-30 09:40'],
    ['WB-20260828010','SF10062219','西非海运专线','广州南沙仓','达喀尔海外仓','海运','36','742.10','2.980','已签收','','正常','2026-08-28 17:10'],
    ['WB-20260825011','YT98841076','西非空运专线','上海浦东仓','拉各斯海外仓','空运','15','296.30','1.040','已签收','到货外箱破损 2 件','处理中','2026-08-25 10:20'],
    ['WB-20260822012','JD30055890','西非海运专线','深圳盐田仓','杜阿拉海外仓','海运','72','1,508.90','6.150','已签收','','已关闭','2026-08-22 14:55'],
    ['WB-20260819013','SF10053342','西非海运专线','广州南沙仓','阿比让海外仓','海运','28','590.40','2.220','已退件','单件超长 1.8m','已关闭','2026-08-19 09:30'],
    ['WB-20260815014','YT98829908','西非空运专线','上海浦东仓','特马海外仓','空运','9','168.20','0.620','已取消','','正常','2026-08-15 16:00']
];
/* ---------- 问题件种子数据 ---------- */
/* 表头名对齐 TMS 问题件跟踪（cs-issue-track），这样 openCsIssueViewModal /
 * openCsIssueFeedbackModal 里的 _csRowOf 能按名取到值，两端共用同一套弹窗。
 * 列序：问题件单号|问题类型名称|运单号|问题描述|问题状态|最新响应时间|最新响应内容|销售产品 */
var _OMS_ISSUES=[
    ['ISS-20260912001','破损','WB-20260825011','到货外箱破损 2 件，请协助核实并拍照','处理中','2026-09-12 16:30','仓库已核实，照片已上传，等待保险定损','西非空运专线'],
    ['ISS-20260910002','少件','WB-20260904007','客户反馈少 3 件，请核查分拣记录','处理中','2026-09-10 17:20','分拣记录已调取，复核中','西非海运专线'],
    ['ISS-20260908003','清关延误','WB-20260830009','目的港清关超过 5 天，请跟进','待处理','2026-09-08 09:15','—','西非海运专线'],
    ['ISS-20260905004','资料补充','WB-20260908005','空运带电货物需补充 MSDS 文件','待处理','2026-09-05 14:30','—','西非空运专线'],
    ['ISS-20260901005','费用争议','WB-20260822012','账单 BILL-20260822 仓储费有异议','已解决','2026-09-02 09:10','已按合同价调整，差价 35 USD 已退回账户','西非海运专线'],
    ['ISS-20260828006','尺寸异常','WB-20260819013','单件超长 1.8m，确认是否加收超长费','已关闭','2026-08-29 11:20','客户确认按标准加收，已完结','西非海运专线']
];
/* ---------- 账单种子数据 ---------- */
/* 列序：批次号|账单号|结算周期|币别|账单金额|已付金额|待付金额|账单发送时间|发送人|到期日|账单状态
 * 结算周期 = 结算方式（票结/月结），不再是「2026-09 上半月」那种账期描述。 */
var _OMS_BILLS=[
    ['PC-202609-01','BILL-20260910','月结','USD','8,950.00','0.00','8,950.00','2026-09-10 18:00','张财务','2026-09-25','待付款'],
    ['PC-202609-01','BILL-20260901','月结','USD','12,860.00','6,000.00','6,860.00','2026-09-01 18:00','张财务','2026-09-20','部分付款'],
    ['PC-202608-02','BILL-20260822','月结','USD','9,720.00','9,720.00','0.00','2026-08-22 17:30','张财务','2026-09-05','已付款'],
    ['PC-202608-02','BILL-20260810','票结','USD','15,340.00','15,340.00','0.00','2026-08-10 12:00','李财务','2026-08-25','已付款'],
    ['PC-202607-02','BILL-20260728','票结','USD','11,080.00','11,080.00','0.00','2026-07-28 15:00','李财务','2026-08-10','已付款'],
    ['PC-202607-01','BILL-20260715','票结','USD','7,650.00','7,650.00','0.00','2026-07-15 11:00','张财务','2026-07-30','已付款'],
    ['PC-202607-01','BILL-20260702','月结','USD','10,420.00','10,420.00','0.00','2026-07-02 18:00','张财务','2026-07-15','已付款'],
    ['PC-202605-02','BILL-20260528','月结','USD','6,980.00','5,000.00','1,980.00','2026-05-28 18:00','张财务','2026-06-15','已逾期']
];
/* 账单费用明细（按账单号）：
 * 运单号|费用名称|品名|货物类型|件数|重量(KG)|体积(CBM)|单价|金额|币别
 * 品名与件重体与该运单在订单管理里的数据一致；单价按费用性质给（海/空运费按方或按公斤，杂费按票）。 */
var _OMS_BILL_FEES={
    'BILL-20260910':[
        ['WB-20260909004','海运费','汽车配件','普货','30','655.20','2.450','661.22 /CBM','1,620.00','USD'],
        ['WB-20260909004','报关费','汽车配件','普货','30','655.20','2.450','45.00 /票','45.00','USD'],
        ['WB-20260908005','空运费','手机壳','敏感货','12','208.60','0.860','9.49 /KG','1,980.00','USD'],
        ['WB-20260908005','带电附加费','手机壳','敏感货','12','208.60','0.860','10.00 /件','120.00','USD'],
        ['WB-20260906006','海运费','LED灯具、太阳能板','普货','88','1,890.30','7.920','460.86 /CBM','3,650.00','USD'],
        ['WB-20260906006','仓储操作费','LED灯具、太阳能板','普货','88','1,890.30','7.920','60.00 /票','60.00','USD'],
        ['WB-20260904007','海运费','纺织面料','普货','55','1,120.00','4.310','542.92 /CBM','2,340.00','USD'],
        ['WB-20260904007','文件费','纺织面料','普货','55','1,120.00','4.310','25.00 /票','25.00','USD']
    ],
    'BILL-20260901':[
        ['WB-20260902008','空运费','智能手表','敏感货','25','486.40','1.950','6.42 /KG','3,120.00','USD'],
        ['WB-20260830009','海运费','厨房用品','普货','47','980.70','3.760','545.21 /CBM','2,050.00','USD'],
        ['WB-20260830009','清关费','厨房用品','普货','47','980.70','3.760','180.00 /票','180.00','USD'],
        ['WB-20260828010','海运费','儿童玩具','普货','36','742.10','2.980','590.60 /CBM','1,760.00','USD'],
        ['WB-20260825011','空运费','运动器材','普货','15','296.30','1.040','7.69 /KG','2,280.00','USD'],
        ['WB-20260822012','海运费','建材样品','普货','72','1,508.90','6.150','502.44 /CBM','3,090.00','USD'],
        ['WB-20260822012','仓储费','建材样品','普货','72','1,508.90','6.150','120.00 /票','120.00','USD'],
        ['WB-20260819013','海运费','宠物用品','普货','28','590.40','2.220','666.67 /CBM','1,480.00','USD']
    ],
    'BILL-20260822':[
        ['WB-20260815014','空运费','化妆品','敏感货','9','168.20','0.620','8.03 /KG','1,350.00','USD'],
        ['WB-20260811015','海运费','服装鞋帽','普货','52','1,050.00','5.200','550.00 /CBM','2,860.00','USD'],
        ['WB-20260808016','海运费','家居用品','普货','44','920.00','4.100','546.34 /CBM','2,240.00','USD'],
        ['WB-20260805017','空运费','蓝牙耳机','敏感货','16','220.50','0.980','8.12 /KG','1,790.00','USD'],
        ['WB-20260802018','海运费','五金工具','普货','38','860.00','3.400','435.29 /CBM','1,480.00','USD']
    ]
};
function omsBillFeesOf(no,fallbackAmount){
    if(_OMS_BILL_FEES[no])return _OMS_BILL_FEES[no];
    return [['WB-20260700001','海运费','日用百货','普货','40','800.00','3.600','550.00 /CBM',fallbackAmount,'USD'],
        ['WB-20260700001','报关费','日用百货','普货','40','800.00','3.600','45.00 /票','45.00','USD'],
        ['WB-20260700001','文件费','日用百货','普货','40','800.00','3.600','25.00 /票','25.00','USD']];
}

/* ---------- 消息与待办 ---------- */
var _OMS_MESSAGES=[
    {type:'轨迹',content:'运单 WB-20260904007 已于今日 08:50 离港（深圳盐田港）',time:'2026-09-13 09:20',unread:true},
    {type:'账单',content:'账单 BILL-20260910 已生成，待付金额 8,950.00 USD',time:'2026-09-12 18:00',unread:true},
    {type:'问题件',content:'问题件 ISS-20260912001 有新回复：仓库已核实，照片已上传',time:'2026-09-12 16:30',unread:true},
    {type:'系统',content:'国庆假期船期安排已发布，请提前安排出货计划',time:'2026-09-11 10:00',unread:false},
    {type:'轨迹',content:'运单 WB-20260830009 已到港（特马港），等待清关',time:'2026-09-10 08:15',unread:false},
    {type:'账单',content:'账单 BILL-20260901 已核销 6,000.00 USD，余 6,860.00 USD 待付',time:'2026-09-09 15:30',unread:false}
];
/* ---------- 工单动态（功能首页右列） ----------
 * 原「待办事项」改版：不再只是「去处理」的入口，而是把工单的最新进展推给客户看。 */
var _OMS_WORK_ORDERS=[
    {no:'WO-20260913001',type:'问题件工单',content:'客服已上传破损货物定损照片，等待保险核定金额','time':'2026-09-13 10:30',status:'处理中',tab:'oms-issue-mgmt'},
    {no:'WO-20260912002',type:'订舱工单',content:'WB-20260911002 舱位已确认，配舱回执已同步','time':'2026-09-12 16:20',status:'已完成',tab:'oms-order-mgmt'},
    {no:'WO-20260911003',type:'费用工单',content:'仓储费异议已受理，财务正在复核计费明细','time':'2026-09-11 14:05',status:'处理中',tab:'oms-bill'},
    {no:'WO-20260910004',type:'资料工单',content:'空运带电货物 MSDS 文件已收到，资料补充完成','time':'2026-09-10 09:40',status:'已完成',tab:'oms-issue-mgmt'}
];

/* ---------- 标准列表注册 ---------- */
/* 插页状态与 TMS 运单管理（wb-manage）一致；「草稿」已去掉 —— 未提交的单只留在新增订单页 */
var _OMS_ORDER_STATUSES=['已预报','已到货','已确认','已配舱','已出库','已离港','已到港','海外已到仓','海外已出仓','已签收','已退件','已取消'];
addPrototypeTable('oms-order-mgmt','订单管理','运单号|物流单号|所属产品|国内仓库|目的仓库|运输方式|件数|重量(KG)|体积(CBM)|运单状态|仓库异常备注|问题件状态|创建时间|操作',_OMS_ORDER_STATUSES,_OMS_ORDERS,[
    {label:'运单号',type:'text'},
    {label:'物流单号',type:'text'},
    {label:'运单状态',type:'select',options:_OMS_ORDER_STATUSES},
    {label:'所属产品',type:'select',options:['西非海运专线','西非空运专线']},
    {label:'国内仓库',type:'select',options:['深圳盐田仓','广州南沙仓','上海浦东仓']},
    {label:'目的仓库',type:'select',options:['达喀尔海外仓','拉各斯海外仓','阿比让海外仓','特马海外仓','杜阿拉海外仓']},
    {label:'运输方式',type:'select',options:['海运','空运']},
    {label:'问题件状态',type:'select',options:['正常','待处理','处理中','已关闭']},
    {label:'创建时间',type:'date'}
]);
TC['oms-order-mgmt'].noExpand=true;

var _OMS_ISSUE_STATUSES=['待处理','处理中','已解决','已关闭'];
addPrototypeTable('oms-issue-mgmt','问题件管理','问题件单号|问题类型名称|运单号|问题描述|问题状态|最新响应时间|最新响应内容|销售产品|操作',_OMS_ISSUE_STATUSES,_OMS_ISSUES,[
    {label:'问题件单号',type:'text'},
    {label:'运单号',type:'text'},
    {label:'问题类型名称',type:'select',options:['破损','少件','尺寸异常','重量异常','清关延误','资料补充','费用争议','其他']},
    {label:'问题状态',type:'select',options:_OMS_ISSUE_STATUSES},
    {label:'销售产品',type:'select',options:['西非海运专线','西非空运专线']},
    {label:'最新响应时间',type:'date'}
]);
TC['oms-issue-mgmt'].noExpand=true;

var _OMS_BILL_STATUSES=['待付款','部分付款','已付款','已逾期'];
addPrototypeTable('oms-bill','账单管理','批次号|账单号|结算周期|币别|账单金额|已付金额|待付金额|账单发送时间|发送人|到期日|账单状态|操作',_OMS_BILL_STATUSES,_OMS_BILLS,[
    {label:'批次号',type:'text'},
    {label:'账单号',type:'text'},
    {label:'结算周期',type:'select',options:['票结','月结']},
    {label:'账单状态',type:'select',options:_OMS_BILL_STATUSES},
    {label:'到期日',type:'date'}
]);
TC['oms-bill'].noExpand=true;
/* 账单列表不显示引擎自动补的 创建人/修改人 审计列（noAutoAudit 是引擎现成开关） */
TC['oms-bill'].noAutoAudit=true;

/* ---------- 小工具 ---------- */
function omsNow(){
    var d=new Date();
    function p(n){return String(n).padStart(2,'0');}
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());
}
function omsRowOf(id,gi){
    var d=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:((TC[id]&&TC[id].d)||[]);
    return d[gi]||null;
}
/* 按表头名取值。首页几张卡片原来是写死下标的，列一改就会整体错位 —— 改成按名取。 */
function omsCell(id,row,name,dft){
    var h=(TC[id]&&TC[id].h)||[],i=h.indexOf(name);
    return (i>=0&&row&&row[i]!=null&&row[i]!=='')?String(row[i]):(dft===undefined?'':dft);
}
function omsRefreshList(id){
    document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal||'');
}
function omsOpenCrud(title,bodyHtml,footerHtml,width){
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width=width||'62%';
    document.getElementById('crud-modal-title').textContent=title;
    document.getElementById('crud-modal-body').innerHTML=bodyHtml;
    document.getElementById('crud-modal-footer').innerHTML=footerHtml;
    document.getElementById('crud-modal').classList.add('show');
}
function omsInfoCell(label,value){
    return '<div><div class="text-xs text-text-muted mb-1">'+esc(tr(label))+'</div><div class="text-sm font-medium text-text-primary">'+value+'</div></div>';
}
function omsSectionTitle(text){
    return '<div class="flex items-center gap-2 mt-6 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span><span class="text-sm font-semibold text-text-primary">'+esc(tr(text))+'</span></div>';
}

/* ================= 功能首页 ================= */
function generateOmsHomePage(id){
    var orders=TC['oms-order-mgmt'].d;
    var issues=TC['oms-issue-mgmt'].d;
    var bills=TC['oms-bill'].d;
    var ordStatus=function(r){return omsCell('oms-order-mgmt',r,'运单状态');};
    var inTransit=orders.filter(function(r){return ['已配舱','已出库','已离港','已到港'].indexOf(ordStatus(r))>=0;}).length;
    /* 待确认 = 业务确认之前的状态，与 TMS 业务确认的前置状态一致 */
    var toConfirm=orders.filter(function(r){return ['已预报','已到货'].indexOf(ordStatus(r))>=0;}).length;
    var unpaid=0;
    bills.forEach(function(r){unpaid+=parseFloat(String(omsCell('oms-bill',r,'待付金额')).replace(/,/g,''))||0;});

    var kpis=[
        {label:'本月订单',value:orders.length,unit:'票',tab:'oms-order-mgmt',color:'from-primary-600 to-primary-500'},
        {label:'运输中',value:inTransit,unit:'票',tab:'oms-order-mgmt',color:'from-blue-600 to-blue-500'},
        {label:'待确认',value:toConfirm,unit:'票',tab:'oms-order-mgmt',color:'from-amber-500 to-amber-400'},
        {label:'待付款',value:unpaid.toLocaleString('en-US',{minimumFractionDigits:2}),unit:'USD',tab:'oms-bill',color:'from-green-600 to-green-500'}
    ];

    var h='<div class="h-full overflow-auto bg-surface-50 p-6">';

    /* 欢迎横幅：客户基础信息 */
    h+='<div class="rounded-2xl p-6 mb-6 text-white relative overflow-hidden" style="background:linear-gradient(120deg,#17475E 0%,#1F6FA8 70%,#2E7CB0 100%)">';
    h+='<div class="absolute inset-0" style="background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:36px 36px"></div>';
    h+='<div class="relative z-10 flex flex-wrap items-center justify-between gap-4">';
    h+='<div><div class="flex items-center gap-3 mb-1.5"><span class="text-xl font-bold">'+esc(tr('您好')+'，'+_OMS_CUST.shortName)+'</span>'+
       '<span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold" style="background:rgba(217,164,65,.22);color:#F5D89A;border:1px solid rgba(217,164,65,.45)">'+esc(tr(_OMS_CUST.level+'客户'))+'</span></div>'+
       '<div class="text-xs opacity-80">'+esc(tr(_OMS_CUST.type))+' · '+tr('客户代码')+' '+esc(_OMS_CUST.code)+' · '+tr('专属客服')+' '+esc(_OMS_CUST.cs)+' · '+tr('所属业务员')+' '+esc(_OMS_CUST.sales)+'</div></div>';
    h+='<div class="flex items-center gap-6">'+
       '<div class="text-right"><div class="text-xs opacity-80 mb-1">'+tr('账户余额')+'</div><div class="text-lg font-bold">'+esc(_OMS_CUST.balance)+' <span class="text-xs font-normal opacity-80">USD</span></div></div>'+
       '<div class="w-px h-9" style="background:rgba(255,255,255,.25)"></div>'+
       '<div class="text-right"><div class="text-xs opacity-80 mb-1">'+tr('信用额度')+'</div><div class="text-lg font-bold">'+esc(_OMS_CUST.credit)+' <span class="text-xs font-normal opacity-80">USD</span></div></div>'+
       '<div class="w-px h-9" style="background:rgba(255,255,255,.25)"></div>'+
       '<button type="button" onclick="navigateToTab(\'\',\'oms-order-entry\')" class="px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer" style="background:#D9A441;color:#17475E">+ '+tr('新增订单')+'</button>'+
       '</div></div></div>';

    /* KPI */
    h+='<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">';
    kpis.forEach(function(k){
        h+='<div onclick="navigateToTab(\'\',\''+k.tab+'\')" class="rounded-xl p-5 text-white bg-gradient-to-br '+k.color+' shadow-sm cursor-pointer hover:opacity-95">';
        h+='<div class="text-xs opacity-90 mb-2">'+esc(tr(k.label))+'</div>';
        h+='<div class="text-2xl font-bold">'+k.value+'<span class="text-sm font-normal opacity-90 ml-1">'+esc(tr(k.unit))+'</span></div></div>';
    });
    h+='</div>';

    /* 中间一排三张卡：客户信息 / 消息通知 / 跟进动态（问题件 + 工单两个插页），
     * items-stretch + 卡片 h-full 保证三张卡底边对齐 */
    h+='<div class="grid grid-cols-1 xl:grid-cols-3 gap-5 items-stretch">';
    h+=omsHomeCustCard();
    h+=omsHomeMessagesCard();
    h+=omsHomeDynamicsCard(issues);
    h+='</div>';
    /* 最新订单放最下面，整行铺满 */
    h+='<div class="mt-5">'+omsHomeOrdersCard(orders.slice(0,5))+'</div>';
    h+='</div>';
    return h;
}
function omsHomeCardShell(title,tab,badge,inner,cls){
    var h='<div class="bg-white rounded-xl border border-surface-200 p-5'+(cls?' '+cls:'')+'">';
    h+='<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2">'+
       '<span class="w-1 h-4 bg-primary-500 rounded"></span><span class="text-base font-semibold text-text-primary">'+esc(tr(title))+'</span>';
    if(badge>0)h+='<span class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">'+badge+'</span>';
    h+='</div>';
    if(tab)h+='<button type="button" onclick="navigateToTab(\'\',\''+tab+'\')" class="text-xs text-primary-600 hover:text-primary-700 cursor-pointer">'+tr('查看全部')+' →</button>';
    h+='</div>'+inner+'</div>';
    return h;
}
function omsHomeOrdersCard(rows){
    /* 运费列已按「订单不体现费用」去掉，改列目的仓库 / 运输方式 / 件数 / 状态 */
    var h='<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-xs text-text-muted border-b border-surface-100">';
    ['运单号','目的仓库','运输方式','件数','重量(KG)','运单状态'].forEach(function(hd){
        h+='<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(hd)+'</th>';
    });
    h+='</tr></thead><tbody>';
    rows.forEach(function(r){
        var gi=TC['oms-order-mgmt'].d.indexOf(r);
        var g=function(n){return omsCell('oms-order-mgmt',r,n);};
        h+='<tr class="border-b border-surface-50 hover:bg-primary-50/40 cursor-pointer" ondblclick="openWaybillDetail(\'oms-order-mgmt\','+gi+')">';
        h+='<td class="px-3 py-2.5 font-mono font-semibold text-primary-700 whitespace-nowrap">'+esc(g('运单号'))+'</td>';
        h+='<td class="px-3 py-2.5 text-text-secondary whitespace-nowrap">'+esc(tr(g('目的仓库')))+'</td>';
        h+='<td class="px-3 py-2.5 text-text-secondary">'+esc(tr(g('运输方式')))+'</td>';
        h+='<td class="px-3 py-2.5 text-right text-text-secondary">'+esc(g('件数'))+'</td>';
        h+='<td class="px-3 py-2.5 text-right text-text-secondary whitespace-nowrap">'+esc(g('重量(KG)'))+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap">'+statusBadge(g('运单状态'))+'</td></tr>';
    });
    h+='</tbody></table></div>';
    return omsHomeCardShell('最新订单','oms-order-mgmt',0,h);
}
function omsHomeCustCard(){
    var c=_OMS_CUST;
    var rows=[['客户代码',c.code],['客户全称',c.fullName],['客户等级',tr(c.level)],['结算周期',tr(c.settleCycle)],['所属业务员',c.sales],['专属客服',c.cs],['客户邮箱',c.email],['合作起始',c.joinDate]];
    var h='<div class="space-y-2.5">';
    rows.forEach(function(p){
        h+='<div class="flex items-start justify-between gap-3 text-sm"><span class="text-text-muted flex-shrink-0">'+esc(tr(p[0]))+'</span><span class="text-text-primary font-medium text-right break-all">'+esc(String(p[1]))+'</span></div>';
    });
    h+='</div>';
    return omsHomeCardShell('客户信息',null,0,h,'h-full flex flex-col');
}
function omsHomeMessagesCard(){
    var h='<div class="space-y-2">';
    _OMS_MESSAGES.slice(0,4).forEach(function(m){
        h+='<div class="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-surface-50 hover:bg-primary-50/50">'+
            (m.unread?'<span class="w-1.5 h-1.5 rounded-full bg-primary-600 mt-2 flex-shrink-0"></span>':'<span class="w-1.5 h-1.5 mt-2 flex-shrink-0"></span>')+
            '<div class="flex-1 min-w-0"><div class="text-sm text-text-primary leading-snug">'+esc(m.content)+'</div>'+
            '<div class="text-xs text-text-muted mt-1">'+esc(tr(m.type))+' · '+esc(m.time)+'</div></div></div>';
    });
    h+='</div>';
    return omsHomeCardShell('消息通知',null,_OMS_MESSAGES.filter(function(m){return m.unread;}).length,h,'h-full flex flex-col');
}

/* ===== 跟进动态：问题件 / 工单 两个插页合并在一张卡里 ===== */
var _omsHomeDynTab='issue';
function omsSwitchHomeDynTab(t){
    _omsHomeDynTab=(t==='work')?'work':'issue';
    var mc=document.getElementById('main-content');
    if(mc){mc.innerHTML=generateOmsHomePage('oms-home');
        if(typeof applyRuntimeEnhancements==='function')applyRuntimeEnhancements(mc);}
}
function omsHomeIssuesInner(rows){
    if(!rows.length)return '<div class="py-8 text-center text-sm text-text-muted">'+tr('暂无进行中的问题件')+'</div>';
    var inner='<div class="space-y-2">';
    rows.forEach(function(r){
        var gi=TC['oms-issue-mgmt'].d.indexOf(r);
        var g=function(n){return omsCell('oms-issue-mgmt',r,n);};
        inner+='<div class="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-surface-50 hover:bg-primary-50/50 cursor-pointer" ondblclick="openCsIssueViewModal(\'oms-issue-mgmt\','+gi+')">'+
            '<span class="inline-block px-2 py-0.5 rounded text-xs flex-shrink-0 mt-0.5 bg-amber-50 text-amber-600">'+esc(tr(g('问题类型名称')))+'</span>'+
            '<div class="flex-1 min-w-0"><div class="text-sm text-text-primary truncate">'+esc(g('问题描述'))+'</div>'+
            '<div class="text-xs text-text-muted mt-0.5">'+esc(g('问题件单号'))+' · '+esc(g('最新响应时间'))+'</div></div>'+statusBadge(g('问题状态'))+'</div>';
    });
    return inner+'</div>';
}
function omsHomeWorkOrdersInner(rows){
    if(!rows.length)return '<div class="py-8 text-center text-sm text-text-muted">'+tr('暂无工单动态')+'</div>';
    var h='<div class="space-y-2">';
    rows.forEach(function(w){
        h+='<div onclick="navigateToTab(\'\',\''+w.tab+'\')" class="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-surface-50 hover:bg-primary-50/50 cursor-pointer border-l-[3px] '+(w.status==='处理中'?'border-primary-500':'border-surface-300')+'">'+
            '<div class="flex-1 min-w-0">'+
            '<div class="flex items-center gap-2"><span class="text-xs font-semibold text-text-primary">'+esc(w.no)+'</span>'+
            '<span class="inline-block px-1.5 py-0.5 rounded text-[11px] bg-primary-50 text-primary-600">'+esc(tr(w.type))+'</span>'+
            '<span class="ml-auto flex-shrink-0">'+statusBadge(w.status)+'</span></div>'+
            '<div class="text-sm text-text-primary leading-snug mt-1.5">'+esc(w.content)+'</div>'+
            '<div class="text-xs text-text-muted mt-1">'+esc(w.time)+'</div></div></div>';
    });
    return h+'</div>';
}
function omsHomeDynamicsCard(issues){
    var openIssues=issues.filter(function(r){return ['待处理','处理中'].indexOf(omsCell('oms-issue-mgmt',r,'问题状态'))>=0;});
    var workRows=_OMS_WORK_ORDERS.slice().sort(function(a,b){return a.time<b.time?1:-1;});
    var openWorks=_OMS_WORK_ORDERS.filter(function(w){return w.status==='处理中';}).length;
    var tab=_omsHomeDynTab;
    var tabBtn=function(key,label,n){
        var on=tab===key;
        return '<button type="button" onclick="omsSwitchHomeDynTab(\''+key+'\')" class="h-8 px-3 rounded-lg text-xs font-medium '+(on?'bg-primary-600 text-white':'bg-surface-50 text-text-secondary border border-surface-200 hover:bg-surface-100 cursor-pointer')+'">'+tr(label)+'（'+n+'）</button>';
    };
    var inner='<div class="flex items-center gap-2 mb-3">'+tabBtn('issue','问题件',openIssues.length)+tabBtn('work','工单',openWorks)+'</div>';
    /* 内容区固定高度 + 最多 3 条 + 超出滚动：两个插页的条目高度不一样，
     * 不固定的话切插页整卡跟着伸缩，中间一排的对齐就白做了 */
    inner+='<div style="height:280px;overflow-y:auto">'+
        (tab==='issue'?omsHomeIssuesInner(openIssues.slice(0,3)):omsHomeWorkOrdersInner(workRows.slice(0,3)))+'</div>';
    return omsHomeCardShell('跟进动态',tab==='issue'?'oms-issue-mgmt':null,
        tab==='issue'?openIssues.length:openWorks,inner,'h-full flex flex-col');
}

/* ================= 账单管理 ================= */

/* 账单明细弹窗（行内「查看」/ 双击 / 工具栏「账单明细」共用这一个入口） */
function openOmsBillDetail(id,gi){
    var row=omsRowOf(id,gi);
    if(!row)return;
    var g=function(n){return omsCell(id,row,n);};
    var no=g('账单号');
    var fees=omsBillFeesOf(no,g('账单金额'));

    var h='<div class="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl border border-surface-200 bg-surface-50/50 p-4">';
    h+=omsInfoCell('账单号','<span class="font-mono font-semibold text-primary-700">'+esc(no)+'</span>');
    h+=omsInfoCell('批次号','<span class="font-mono">'+esc(g('批次号'))+'</span>');
    h+=omsInfoCell('结算周期',esc(tr(g('结算周期'))));
    h+=omsInfoCell('账单状态',statusBadge(g('账单状态')));
    h+=omsInfoCell('账单金额','<span class="font-semibold">'+esc(g('账单金额'))+' '+esc(g('币别'))+'</span>');
    h+=omsInfoCell('已付金额','<span class="text-success-600 font-semibold" style="color:#1F9D66">'+esc(g('已付金额'))+' '+esc(g('币别'))+'</span>');
    h+=omsInfoCell('待付金额','<span class="font-semibold" style="color:#D97706">'+esc(g('待付金额'))+' '+esc(g('币别'))+'</span>');
    h+=omsInfoCell('到期日',esc(g('到期日')));
    h+=omsInfoCell('账单发送时间',esc(g('账单发送时间')||'—'));
    h+=omsInfoCell('发送人',esc(g('发送人')||'—'));
    h+='</div>';

    h+=omsSectionTitle('费用明细');
    h+='<div class="rounded-lg border border-surface-200 overflow-hidden overflow-x-auto"><table class="w-full text-sm" style="min-width:980px"><thead class="bg-surface-50 text-text-secondary"><tr>'+
       '<th class="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">'+tr('运单号')+'</th>'+
       '<th class="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">'+tr('费用名称')+'</th>'+
       '<th class="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">'+tr('品名')+'</th>'+
       '<th class="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">'+tr('货物类型')+'</th>'+
       '<th class="px-3 py-2 text-right text-xs font-semibold whitespace-nowrap">'+tr('件数')+'</th>'+
       '<th class="px-3 py-2 text-right text-xs font-semibold whitespace-nowrap">'+tr('重量(KG)')+'</th>'+
       '<th class="px-3 py-2 text-right text-xs font-semibold whitespace-nowrap">'+tr('体积(CBM)')+'</th>'+
       '<th class="px-3 py-2 text-right text-xs font-semibold whitespace-nowrap">'+tr('单价')+'</th>'+
       '<th class="px-3 py-2 text-right text-xs font-semibold whitespace-nowrap">'+tr('金额')+'</th>'+
       '<th class="px-3 py-2 text-right text-xs font-semibold whitespace-nowrap">'+tr('币别')+'</th></tr></thead><tbody>';
    var total=0;
    fees.forEach(function(f){
        total+=parseFloat(String(f[8]).replace(/,/g,''))||0;
        h+='<tr class="border-t border-surface-100"><td class="px-3 py-2 font-mono text-primary-700 whitespace-nowrap">'+esc(f[0])+'</td>'+
           '<td class="px-3 py-2 text-text-primary whitespace-nowrap">'+esc(tr(f[1]))+'</td>'+
           '<td class="px-3 py-2 text-text-primary whitespace-nowrap">'+esc(tr(f[2]))+'</td>'+
           '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(tr(f[3]))+'</td>'+
           '<td class="px-3 py-2 text-right font-mono text-text-secondary">'+esc(f[4])+'</td>'+
           '<td class="px-3 py-2 text-right font-mono text-text-secondary">'+esc(f[5])+'</td>'+
           '<td class="px-3 py-2 text-right font-mono text-text-secondary">'+esc(f[6])+'</td>'+
           '<td class="px-3 py-2 text-right font-mono text-text-secondary whitespace-nowrap">'+esc(f[7])+'</td>'+
           '<td class="px-3 py-2 text-right font-mono font-semibold text-text-primary whitespace-nowrap">'+esc(f[8])+'</td>'+
           '<td class="px-3 py-2 text-right text-text-secondary">'+esc(f[9])+'</td></tr>';
    });
    h+='</tbody><tfoot class="bg-primary-50/60"><tr><td colspan="8" class="px-3 py-2 font-semibold text-primary-700">'+tr('合计')+'（'+fees.length+' '+tr('条')+'）</td>'+
       '<td class="px-3 py-2 text-right font-mono font-semibold text-primary-700 whitespace-nowrap">'+total.toLocaleString('en-US',{minimumFractionDigits:2})+'</td>'+
       '<td class="px-3 py-2 text-right text-primary-700 font-semibold">'+esc(g('币别'))+'</td></tr></tfoot></table></div>';

    omsOpenCrud(tr('账单明细')+' - '+no,h,
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>'+
        '<button onclick="omsDownloadBills(\''+id+'\',['+gi+'])" class="px-4 py-2 text-sm font-medium text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('账单下载')+'</button>',
        '72%');
}
/* 工具栏「账单明细」：勾选一条进入明细 */
function omsOpenSelectedBillDetail(id){
    var indices=getSelectedRowIndices();
    if(!indices.length){showToast(tr('请先勾选一条账单'));return;}
    openOmsBillDetail(id,indices[0]);
}
/* 账单下载：工具栏按勾选批量，明细弹窗里按当前这条 */
function omsDownloadBills(id,indices){
    indices=indices||(typeof getSelectedRowIndices==='function'?getSelectedRowIndices():[]);
    if(!indices.length){showToast(tr('请先勾选要下载的账单'));return;}
    var nos=indices.map(function(i){var r=omsRowOf(id,i);return r?omsCell(id,r,'账单号'):'';}).filter(Boolean);
    closeCrudModal();
    showToast(tr('账单PDF已生成')+'（'+nos.length+' '+tr('个')+'），'+tr('已开始下载')+'：'+nos.slice(0,3).join('、')+(nos.length>3?'…':''));
}
