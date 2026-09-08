/* ==========================================================================
 * 整柜业务重构（DES-FCL-V1.0 一期）
 * 依据：《好利航物流-整柜业务功能重构设计方案》
 * 主线收敛：委托订单 FEO（原销售指示）→ 订舱单 FBK（全链路主档）→ 各作业单
 *
 * 本文件排在 05-tables-build.js 之后加载，只做两件事：
 *   1) 注册 6 张新表（仓位管理 / 放仓模板 / 订舱窗口 / 拆并单 / 账单申诉 / 请款单）
 *   2) 覆写既有 fcl-* 表（合并、字段扩展、总览看板改造）
 * 注意：addPrototypeTable 会整体覆写 TC[id]，因此 pageMode / readonlyList /
 *       modalExcludedFields / fieldOptions 一律在覆写之后重新设置。
 * ========================================================================== */

var FCL_CARRIER_OPTIONS=['MAERSK','COSCO','CMA CGM','MSC','ONE','Hapag-Lloyd'];
var FCL_ROUTE_OPTIONS=['西非线','东非线','南非线','地中海线','中东线'];
var FCL_SALES_OPTIONS=['张三','李四','王五','赵六'];

/* ==========================================================================
 * 一、③ 订舱与仓位 —— 新增模块
 * ========================================================================== */

/* 8.1 仓位管理（SOP 7.5 / 19.2）
 * 仓位公开给商务/订舱员，业务之间默认不可见；商务有统一管理权。 */
addPrototypeTable('fcl-slot','仓位管理',
    '仓位编号|船公司|航线|起运港|目的港|柜型|船名航次|ETD|仓位类型|预定仓量|实单占用|已放仓|未放仓|放仓上限|占用业务员|所属分公司|释放数量|更新时间|状态|操作',
    ['预定中','部分放仓','已放仓','已释放','已过期'],[
    ['FSL-20260613001','MAERSK','西非线','深圳盐田','拉各斯','40HQ','MAERSK LAGOS 026W','2026-06-20','预定仓','10','6','6','4','15','张三','深圳分公司','0','2026-06-13 14:20','部分放仓'],
    ['FSL-20260612002','COSCO','西非线','广州南沙','达喀尔','20GP','COSCO AFRICA 118W','2026-06-22','实单订舱','4','4','4','0','10','李四','广州分公司','0','2026-06-12 17:05','已放仓'],
    ['FSL-20260611003','CMA CGM','地中海线','上海洋山','阿比让','40HQ','CMA MARSEILLE 09W','2026-06-25','预定仓','8','2','0','8','12','王五','上海分公司','3','2026-06-13 09:40','预定中'],
    ['FSL-20260605004','MSC','西非线','深圳盐田','特马','40HQ','MSC ACCRA 22W','2026-06-08','预定仓','6','0','0','6','12','赵六','深圳分公司','6','2026-06-07 18:00','已释放']
],[
    {label:'仓位编号',type:'text'},
    {label:'船公司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'航线',type:'select',options:FCL_ROUTE_OPTIONS},
    {label:'起运港',type:'select',options:FCL_POL_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'柜型',type:'select',options:FCL_CONTAINER_OPTIONS},
    {label:'仓位类型',type:'select',options:['预定仓','实单订舱']},
    {label:'占用业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'所属分公司',type:'select',options:FCL_BRANCH_OPTIONS},
    {label:'ETD',type:'date'},
    {label:'状态',type:'select',options:['预定中','部分放仓','已放仓','已释放','已过期']}
]);
TC['fcl-slot'].modalExcludedFields=['未放仓','释放数量','更新时间','状态'];
TC['fcl-slot'].fieldOptions={
    '船公司':FCL_CARRIER_OPTIONS,'航线':FCL_ROUTE_OPTIONS,
    '起运港':FCL_POL_OPTIONS,'目的港':FCL_POD_OPTIONS,
    '柜型':FCL_CONTAINER_OPTIONS,'仓位类型':['预定仓','实单订舱'],
    '占用业务员':FCL_SALES_OPTIONS,'所属分公司':FCL_BRANCH_OPTIONS
};

/* 8.3 订舱窗口提醒（SOP 7.6：窗口开始前 60 分钟 + 截止前 30 分钟两次提醒） */
addPrototypeTable('fcl-booking-window','订舱窗口提醒',
    '窗口编号|船公司|航线|起运港|目的港|柜型|船名航次|窗口开始时间|窗口截止时间|提前提醒1(分钟)|提前提醒2(分钟)|通知对象|通知方式|最近触发时间|触发次数|启用状态|操作',
    ['未开始','进行中','已截止','已停用'],[
    ['FBW-20260613001','MAERSK','西非线','深圳盐田','拉各斯','40HQ','MAERSK LAGOS 026W','2026-06-14 09:00','2026-06-17 18:00','60','30','刘订舱 / 订舱主管','站内消息+邮件','2026-06-13 08:00','1','进行中'],
    ['FBW-20260612002','COSCO','西非线','广州南沙','达喀尔','20GP','COSCO AFRICA 118W','2026-06-15 10:00','2026-06-18 17:30','60','30','赵订舱','站内消息','','0','未开始'],
    ['FBW-20260608003','MSC','西非线','深圳盐田','特马','40HQ','MSC ACCRA 22W','2026-06-06 09:00','2026-06-09 18:00','60','30','刘订舱','站内消息+企业微信','2026-06-09 17:30','2','已截止']
],[
    {label:'窗口编号',type:'text'},
    {label:'船公司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'航线',type:'select',options:FCL_ROUTE_OPTIONS},
    {label:'柜型',type:'select',options:FCL_CONTAINER_OPTIONS},
    {label:'窗口开始时间',type:'date'},
    {label:'窗口截止时间',type:'date'},
    {label:'启用状态',type:'select',options:['未开始','进行中','已截止','已停用']}
]);
TC['fcl-booking-window'].modalExcludedFields=['最近触发时间','触发次数','启用状态'];
TC['fcl-booking-window'].fieldOptions={
    '船公司':FCL_CARRIER_OPTIONS,'航线':FCL_ROUTE_OPTIONS,
    '起运港':FCL_POL_OPTIONS,'目的港':FCL_POD_OPTIONS,
    '柜型':FCL_CONTAINER_OPTIONS,
    '通知方式':['站内消息','站内消息+邮件','站内消息+企业微信','邮件']
};

/* 8.2 放仓模板（SOP 8.3：船公司 × 目的港，SOP 称其为 SOP-FCL-05 的核心）*/
addPrototypeTable('fcl-release-tpl','放仓模板',
    '模板编号|船公司|目的港|起运港|柜型|是否危险品模板|对外结单时间|对内结单时间|对内提前天数|瞒报告示|特殊提醒|必填资料清单|敏感信息剥离规则|关务联系人|启用状态|维护人|更新时间|操作',
    ['启用','停用'],[
    ['FRT-001','MAERSK','拉各斯','深圳盐田','40HQ','否','2026-06-17 12:00','2026-06-16 12:00','1','严禁瞒报品名，如实申报货物信息','西非线基港提醒；锂电池需单独声明','SI;装箱单;报关资料;商业发票','船司价格;内部说明','陈关务 / 13800138001','启用','商务主管','2026-06-13 10:00'],
    ['FRT-002','COSCO','达喀尔','广州南沙','20GP','否','2026-06-18 18:00','2026-06-17 18:00','1','严禁瞒报品名，如实申报货物信息','达喀尔非基港，需确认转运费','SI;装箱单;报关资料','船司价格;内部说明;船司内部编号','周关务 / 13900139002','启用','订舱主管','2026-06-12 16:30'],
    ['FRT-003','MAERSK','拉各斯','深圳盐田','40HQ','是','2026-06-15 12:00','2026-06-14 12:00','1','危险品须如实申报，严禁瞒报','危险品结单早于普货48小时；进仓需与普货分开存放','SI;装箱单;报关资料;MSDS;危包证','船司价格;内部说明','陈关务 / 13800138001','启用','商务主管','2026-06-13 10:05']
],[
    {label:'模板编号',type:'text'},
    {label:'船公司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'起运港',type:'select',options:FCL_POL_OPTIONS},
    {label:'是否危险品模板',type:'select',options:['是','否']},
    {label:'启用状态',type:'select',options:['启用','停用']}
]);
TC['fcl-release-tpl'].modalExcludedFields=['维护人','更新时间','启用状态'];
TC['fcl-release-tpl'].fieldOptions={
    '船公司':FCL_CARRIER_OPTIONS,'目的港':FCL_POD_OPTIONS,'起运港':FCL_POL_OPTIONS,
    '柜型':FCL_CONTAINER_OPTIONS,'是否危险品模板':['是','否']
};

/* ==========================================================================
 * 二、⑤ 整柜财务 —— 重新设计为 5 张表
 *   成本侧：预估成本明细 → 代理实际成本 → 应付账单管理
 *   收入侧：应收费用明细 → 应收收款管理
 *   五张表都挂在 Job No 上，一票整柜的钱从头到尾能串起来。
 * ========================================================================== */

var FCL_FEE_KINDS=['海运费','附加费','拖车费','报关费','单证费','仓储费','其他'];
var FCL_AGENT_OPTIONS=['MAERSK','COSCO','CMA CGM','MSC','ONE','鹏程拖车','深圳报关行','广州报关行','中外运'];

/* ① 预估成本明细 —— 订舱时按 Job 拆出来的成本基线，后面拿它跟代理实际成本比 */
addPrototypeTable('fcl-est-cost','预估成本明细',
    '预估明细号|Job No|费用科目|供应商|币别|金额|计费方式|来源|录入人|录入时间|状态|操作',
    ['草稿','已确认','已作废'],[
    ['FEC-20260613001','FBK-20260613001','海运费','MAERSK','USD','4120','按柜','报价带出','张财务','2026-06-13 15:20','已确认'],
    ['FEC-20260613002','FBK-20260613001','拖车费','鹏程拖车','CNY','1800','按柜','人工录入','张财务','2026-06-13 15:25','已确认'],
    ['FEC-20260613003','FBK-20260613001','报关费','深圳报关行','CNY','350','按票','报价带出','张财务','2026-06-13 15:26','草稿'],
    ['FEC-20260612004','FBK-20260612002','海运费','COSCO','USD','5180','按柜','报价带出','张财务','2026-06-12 16:40','已确认'],
    ['FEC-20260612005','FBK-20260612002','附加费','COSCO','USD','120','按票','系统计算','张财务','2026-06-12 16:42','已作废']
],[
    {label:'预估明细号',type:'text'},
    {label:'Job No',type:'text'},
    {label:'费用科目',type:'select',options:FCL_FEE_KINDS},
    {label:'供应商',type:'select',options:FCL_AGENT_OPTIONS},
    {label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},
    {label:'状态',type:'select',options:['草稿','已确认','已作废']}
]);
/* 来源是系统按数据怎么进来的自动打的标（报价带出/人工录入/系统计算），弹窗里不给人填 */
TC['fcl-est-cost'].modalExcludedFields=['来源','录入人','录入时间','状态'];
TC['fcl-est-cost'].fieldOptions={
    '费用科目':FCL_FEE_KINDS,'供应商':FCL_AGENT_OPTIONS,
    '币别':FCL_CURRENCY_OPTIONS,'计费方式':['按柜','按票','按重量','按体积']
};

/* ② 代理实际成本 —— 服务商/代理报来的实际金额，与预估逐项比差异 */
addPrototypeTable('fcl-agent-cost','代理实际成本',
    '实际成本号|Job No|服务商|费用名称|费用类别|币别|预估金额|实际金额|差异金额|差异率|服务商账单号|对账人|对账时间|备注|对账状态|操作',
    ['待对账','对账一致','有差异','已确认'],[
    ['FAC-20260613001','FBK-20260613001','MAERSK','海运费','海运费','USD','4120','4200','80','1.94%','MSK-INV-260613','张财务','2026-06-16 10:20','船司多计塞港费 USD 80','有差异'],
    ['FAC-20260613002','FBK-20260613001','鹏程拖车','拖车费','拖车费','CNY','1800','1800','0','0.00%','PC-260613-08','张财务','2026-06-16 10:25','','对账一致'],
    ['FAC-20260612003','FBK-20260612002','COSCO','海运费','海运费','USD','5180','5180','0','0.00%','COS-INV-260612','张财务','2026-06-15 14:00','','已确认'],
    ['FAC-20260612004','FBK-20260612002','深圳报关行','报关费','报关费','CNY','350','420','70','20.00%','','','','报关行加收查验费，待核实','待对账']
],[
    {label:'实际成本号',type:'text'},
    {label:'Job No',type:'text'},
    {label:'服务商',type:'select',options:FCL_AGENT_OPTIONS},
    {label:'费用类别',type:'select',options:FCL_FEE_KINDS},
    {label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},
    {label:'服务商账单号',type:'text'},
    {label:'对账状态',type:'select',options:['待对账','对账一致','有差异','已确认']}
]);
TC['fcl-agent-cost'].modalExcludedFields=['差异金额','差异率','对账人','对账时间','对账状态'];
TC['fcl-agent-cost'].fieldOptions={
    '服务商':FCL_AGENT_OPTIONS,'费用类别':FCL_FEE_KINDS,'币别':FCL_CURRENCY_OPTIONS
};

/* ③ 应付账单管理 —— 按服务商汇总的应付，并入付款执行（原「付款管理」不再单开一页） */
addPrototypeTable('fcl-ap-bill','应付账单管理',
    '应付账单号|服务商|账单周期|涉及Job数|币别|应付金额|已付金额|待付金额|账期|到期日|付款方式|付款时间|付款水单|审批人|账单状态|操作',
    ['待确认','已确认','部分付款','已付清','已作废'],[
    ['FAP-20260613001','MAERSK','2026-06','2','USD','8320','0','8320','月结30天','2026-07-13','','','','','待确认'],
    ['FAP-20260612002','COSCO','2026-06','1','USD','5180','5180','0','票结','2026-06-20','电汇','2026-06-18 15:30','水单_COSCO_0618.pdf','财务主管','已付清'],
    ['FAP-20260610003','鹏程拖车','2026-06','3','CNY','5400','2000','3400','月结15天','2026-06-30','电汇','2026-06-20 11:00','水单_鹏程_0620.pdf','财务主管','部分付款'],
    ['FAP-20260605004','深圳报关行','2026-05','4','CNY','1680','1680','0','月结30天','2026-06-05','电汇','2026-06-04 16:20','水单_报关行_0604.pdf','财务主管','已付清']
],[
    {label:'应付账单号',type:'text'},
    {label:'服务商',type:'select',options:FCL_AGENT_OPTIONS},
    {label:'账单周期',type:'text'},
    {label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},
    {label:'付款方式',type:'select',options:['电汇','支票','承兑','现金']},
    {label:'到期日',type:'date'},
    {label:'账单状态',type:'select',options:['待确认','已确认','部分付款','已付清','已作废']}
]);
TC['fcl-ap-bill'].modalExcludedFields=['已付金额','待付金额','付款方式','付款时间','付款水单','审批人','账单状态'];
TC['fcl-ap-bill'].fieldOptions={
    '服务商':FCL_AGENT_OPTIONS,'币别':FCL_CURRENCY_OPTIONS,
    '账期':['票结','月结15天','月结30天','月结60天'],
    '付款方式':['电汇','支票','承兑','现金']
};

/* ④ 应收费用明细 —— 按 Job 的应收逐项，收款核销时冲这里的未收金额 */
addPrototypeTable('fcl-ar-fee','应收费用明细',
    '应收明细号|Job No|客户名称|业务员|费用名称|费用类别|币别|应收金额|汇率|本位币金额|已收金额|未收金额|结算方式|费用确认状态|操作',
    ['待确认','已确认','部分收款','已结清','已作废'],[
    ['FAR-20260613001','FBK-20260613001','深圳市华运达国际货运','张三','海运费','海运费','USD','4500','7.15','32,175.00','0','4500','票结','待确认'],
    ['FAR-20260613002','FBK-20260613001','深圳市华运达国际货运','张三','拖车费','拖车费','CNY','2000','1.00','2,000.00','0','2000','票结','已确认'],
    ['FAR-20260612003','FBK-20260612002','广州远洋进出口贸易','李四','海运费','海运费','USD','5600','7.15','40,040.00','5600','0','月结','已结清'],
    ['FAR-20260612004','FBK-20260612002','广州远洋进出口贸易','李四','报关费','报关费','CNY','400','1.00','400.00','200','200','月结','部分收款'],
    ['FAR-20260610005','FBK-20260610004','','赵六','海运费','海运费','USD','3200','7.15','22,880.00','0','3200','票结','已作废']
],[
    {label:'应收明细号',type:'text'},
    {label:'Job No',type:'text'},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'费用类别',type:'select',options:FCL_FEE_KINDS},
    {label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},
    {label:'费用确认状态',type:'select',options:['待确认','已确认','部分收款','已结清','已作废']}
]);
TC['fcl-ar-fee'].modalExcludedFields=['本位币金额','已收金额','未收金额','费用确认状态'];
TC['fcl-ar-fee'].fieldOptions={
    '客户名称':FCL_CUSTOMER_OPTIONS,'业务员':FCL_SALES_OPTIONS,
    '费用类别':FCL_FEE_KINDS,'币别':FCL_CURRENCY_OPTIONS,
    '结算方式':['票结','月结','预付','到付']
};

/* ⑤ 应收收款管理 —— 客户打款进来后认领、核销到应收明细上 */
addPrototypeTable('fcl-ar-receipt','应收收款管理',
    '收款单号|客户名称|收款方式|币别|收款金额|已核销金额|未核销金额|收款日期|到账银行账户|关联Job|核销人|核销时间|备注|收款状态|操作',
    ['待认领','待核销','部分核销','全部核销'],[
    ['FRC-20260618001','广州远洋进出口贸易','电汇','USD','5600','5600','0','2026-06-18','招商银行 6225****8888','FBK-20260612002','张财务','2026-06-18 16:40','','全部核销'],
    ['FRC-20260620002','广州远洋进出口贸易','电汇','CNY','400','200','200','2026-06-20','招商银行 6225****8888','FBK-20260612002','张财务','2026-06-20 10:15','客户先付一半报关费','部分核销'],
    ['FRC-20260622003','深圳市华运达国际货运','电汇','USD','4500','0','4500','2026-06-22','招商银行 6225****8888','FBK-20260613001','','','','待核销'],
    ['FRC-20260623004','','电汇','CNY','2000','0','2000','2026-06-23','招商银行 6225****8888','','','','对方户名与客户档案对不上，待认领','待认领']
],[
    {label:'收款单号',type:'text'},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'收款方式',type:'select',options:['电汇','支票','现金','信用证']},
    {label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},
    {label:'关联Job',type:'text'},
    {label:'收款日期',type:'date'},
    {label:'收款状态',type:'select',options:['待认领','待核销','部分核销','全部核销']}
]);
TC['fcl-ar-receipt'].modalExcludedFields=['已核销金额','未核销金额','核销人','核销时间','收款状态'];
TC['fcl-ar-receipt'].fieldOptions={
    '客户名称':FCL_CUSTOMER_OPTIONS,'币别':FCL_CURRENCY_OPTIONS,
    '收款方式':['电汇','支票','现金','信用证'],
    '到账银行账户':['招商银行 6225****8888','中国银行 4563****1234','工商银行 6222****4321']
};

/* ===== 整柜财务的自定义操作 =====
 * 都走「勾选 -> 校验状态 -> 改状态/算金额 -> 刷新列表」这一套，
 * 金额一律用 fclParseMoney 解析，避免 '4,120' 这种带千分位的字符串直接参与运算。 */
function fclFinRows(id){
    return (typeof _listData!=='undefined'&&_listData[id])?_listData[id]:((TC[id]||{}).d||[]);
}
function fclFinSet(id,row,label,val){
    var i=((TC[id]||{}).h||[]).indexOf(label);
    if(i>=0)setRowOverride(id,row,i,val);
}
function fclFinGet(id,row,label){
    var i=((TC[id]||{}).h||[]).indexOf(label);
    return (i>=0&&row&&row[i]!=null)?String(row[i]):'';
}
function fclFinRefresh(id){
    var mc=document.getElementById('main-content');
    var pg=(typeof _listPage!=='undefined'&&_listPage[id])?_listPage[id]:1;
    var sf=(typeof _statusFilterVal!=='undefined')?(_statusFilterVal||''):'';
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,pg,sf);
}
/* 通用：把勾选行里状态符合 from 的推进到 to */
function fclFinBatchStatus(id,statusCol,from,to,opLabel){
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要')+tr(opLabel)+tr('的数据'));return;}
    var rows=fclFinRows(id),eligible=[],blocked=0;
    idxs.forEach(function(i){
        var row=rows[i];
        if(!row)return;
        if(from.indexOf(fclFinGet(id,row,statusCol))>=0)eligible.push(i);else blocked++;
    });
    if(!eligible.length){showToast(tr('只有')+'「'+from.join('/')+'」'+tr('的数据可以')+tr(opLabel));return;}
    var msg=tr('已勾选')+' '+idxs.length+' '+tr('条')+'，'+tr('其中')+' '+eligible.length+' '+tr('条可')+tr(opLabel);
    if(blocked)msg+='，'+blocked+' '+tr('条状态不符将跳过');
    msg+='。'+tr('确认后状态转为')+'「'+tr(to)+'」，'+tr('是否继续？');
    openConfirmTip(msg,function(){
        eligible.forEach(function(i){fclFinSet(id,rows[i],statusCol,to);});
        fclFinRefresh(id);
        showToast(tr(opLabel)+' '+eligible.length+' '+tr('条'));
    });
}
/* ④ 应收费用明细：待确认 -> 已确认 */
function openArFeeConfirm(id){
    fclFinBatchStatus(id||'fcl-ar-fee','费用确认状态',['待确认'],'已确认','费用确认');
}
/* ② 代理实际成本：对账 —— 按预估/实际算差异，据差异定状态 */
function openAgentCostReconcile(id){
    id=id||'fcl-agent-cost';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要对账的成本行'));return;}
    var rows=fclFinRows(id),done=0,diff=0,noData=0;
    var now=(typeof receiptNowStr==='function')?receiptNowStr():'';
    var who=(typeof getCurrentUserName==='function')?getCurrentUserName():'admin';
    idxs.forEach(function(i){
        var row=rows[i];
        if(!row)return;
        if(fclFinGet(id,row,'对账状态')==='已确认')return;
        var est=fclParseMoney(fclFinGet(id,row,'预估金额'));
        var act=fclParseMoney(fclFinGet(id,row,'实际金额'));
        if(est===null||act===null){noData++;return;}
        var d=act-est;
        fclFinSet(id,row,'差异金额',String(d));
        fclFinSet(id,row,'差异率',est?((d/est*100).toFixed(2)+'%'):'—');
        fclFinSet(id,row,'对账状态',d===0?'对账一致':'有差异');
        fclFinSet(id,row,'对账人',who);
        fclFinSet(id,row,'对账时间',now);
        done++;
        if(d!==0)diff++;
    });
    if(!done){showToast(noData?tr('所选行缺预估或实际金额，无法对账'):tr('所选行已确认，无需重复对账'));return;}
    fclFinRefresh(id);
    var msg=tr('已对账')+' '+done+' '+tr('条')+'，'+tr('其中')+' '+diff+' '+tr('条有差异');
    if(noData)msg+='，'+noData+' '+tr('条缺金额已跳过');
    showToast(msg);
}
/* ===== 代理实际成本 · 代账账单导入 =====
 * 走全站统一的导入四段式：模板信息 → 上传 → 逐行校验 → 勾选确认。
 * 导入的是代理/服务商发来的代账账单，只带「他们那边有的」字段；
 * 预估金额由系统按 Job No + 费用名称 去预估成本明细里带出来，
 * 差异等导入后点「对账」再算 —— 导入只负责把实际金额落进来。 */
var AGENT_IMPORT_REQUIRED=['Job No','服务商','费用名称','币别','实际金额'];
var AGENT_IMPORT_EXCLUDE=['操作','实际成本号','预估金额','差异金额','差异率','对账人','对账时间','对账状态'];
var _agentImportRows=[];
var _agentImportFile='';
function agentImportColumns(id){
    var c=TC[id||'fcl-agent-cost']||{};
    return (c.h||[]).filter(function(h){
        if(AGENT_IMPORT_EXCLUDE.indexOf(h)>=0)return false;
        return !/^(创建|修改)(人|时间|网点)$/.test(h);
    });
}
/* 按 Job No + 费用名称 去预估成本明细里找金额（作废的不算）。
 * 预估表那边的科目列叫「费用科目」、金额列叫「金额」，
 * 这里对旧列名做兼容取值，免得以后谁再改一次列名就把带值功能带崩。 */
function fclEstAmountOf(job,feeName){
    var c=TC['fcl-est-cost'];
    if(!c||!c.d||!job)return '';
    var h=c.h||[],iJ=h.indexOf('Job No'),iS=h.indexOf('状态');
    var iF=h.indexOf('费用科目');if(iF<0)iF=h.indexOf('费用名称');
    var iA=h.indexOf('金额');if(iA<0)iA=h.indexOf('预估金额');
    if(iJ<0||iA<0)return '';
    var hit=c.d.find(function(r){
        return String(r[iJ]||'')===job&&(iF<0||!feeName||String(r[iF]||'')===feeName)&&(iS<0||r[iS]!=='已作废');
    });
    return hit?String(hit[iA]||''):'';
}
function openAgentBillImportModal(id){
    id=id||'fcl-agent-cost';
    _agentImportRows=[];_agentImportFile='';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='70%';
    document.getElementById('crud-modal-title').textContent=tr('代账账单导入');
    document.getElementById('crud-modal-body').innerHTML=agentImportBodyHtml(id);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmAgentBillImport(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认导入')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function agentImportSectionTitle(text){
    return '<div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
           '<span class="text-base font-semibold text-text-primary">'+tr(text)+'</span></div>';
}
function agentImportBodyHtml(id){
    var h='<div class="space-y-5">';
    h+='<section>'+agentImportSectionTitle('模板信息');
    h+='<div class="rounded-lg border border-surface-200 bg-white p-4">';
    h+='<button type="button" onclick="showToast(tr(\'代账账单导入模板下载中\'))" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer">'+tr('下载代账账单导入模板')+'</button>';
    h+='<div class="mt-3 w-full border border-dashed border-surface-300 rounded-lg bg-surface-50 px-3 py-2.5">';
    h+='<div class="flex items-center gap-2 flex-wrap">';
    h+='<label class="h-8 px-3 inline-flex items-center text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">';
    h+='<input type="file" accept=".xls,.xlsx" class="hidden" onchange="onAgentImportPick(this,\''+id+'\')">'+esc(tr('选择文件'))+'</label>';
    h+='<span class="text-[11px] text-text-muted">'+esc(tr('仅支持 Excel（.xls / .xlsx），单个不超过 10MB'))+'</span>';
    h+='</div>';
    h+='<div data-agent-import-file class="flex flex-wrap gap-1.5 mt-2'+(_agentImportFile?'':' hidden')+'">'+
       (_agentImportFile&&typeof crudAttachmentChipHtml==='function'?crudAttachmentChipHtml(_agentImportFile):'')+'</div>';
    h+='</div>';
    h+='<div class="mt-3 text-xs text-red-500">'+tr('注意：模板上传后下方列表展示当前模板数据的校验信息')+'</div>';
    h+='</div></section>';
    h+='<section>'+agentImportSectionTitle('导入数据');
    h+='<div data-agent-import-summary class="mb-2 text-xs text-text-secondary'+(_agentImportRows.length?'':' hidden')+'"></div>';
    h+='<div data-agent-import-table class="rounded-lg border border-surface-200 bg-white overflow-hidden">'+agentImportTableHtml(id)+'</div>';
    h+='</section>';
    h+='</div>';
    return h;
}
function agentImportTableHtml(id){
    var cols=agentImportColumns(id);
    var h='<div class="overflow-auto" style="max-height:360px">';
    h+='<table class="w-full data-table" style="table-layout:auto;min-width:100%;border-collapse:separate;border-spacing:0"><thead><tr class="bg-white">';
    h+='<th class="px-3 py-2 text-xs font-medium text-text-secondary text-center whitespace-nowrap border-b border-surface-200">#</th>';
    h+='<th class="px-3 py-2 border-b border-surface-200"><input type="checkbox" class="rounded border-surface-300 text-primary-600" onchange="toggleAllAgentImportRows(this)"></th>';
    cols.forEach(function(c){
        var req=AGENT_IMPORT_REQUIRED.indexOf(c)>=0;
        h+='<th class="px-3 py-2 text-xs font-medium whitespace-nowrap border-b border-surface-200 '+(req?'text-red-500':'text-text-secondary')+'">'+esc(tr(c))+'</th>';
    });
    h+='<th class="px-3 py-2 text-xs font-medium text-text-secondary whitespace-nowrap border-b border-surface-200">'+tr('校验结果')+'</th>';
    h+='</tr></thead><tbody>';
    if(!_agentImportRows.length){
        h+='<tr><td colspan="'+(cols.length+3)+'" class="px-3 py-16 text-center text-sm text-text-muted">'+tr('请先上传模板文件')+'</td></tr>';
    }else{
        _agentImportRows.forEach(function(r,i){
            h+='<tr class="border-b border-surface-100 '+(r.ok?'':'bg-red-50/50')+'">';
            h+='<td class="px-3 py-2 text-sm text-text-muted text-center">'+(i+1)+'</td>';
            h+='<td class="px-3 py-2"><input type="checkbox" class="agent-import-check rounded border-surface-300 text-primary-600" value="'+i+'"'+(r.ok?' checked':'')+(r.ok?'':' disabled')+'></td>';
            cols.forEach(function(c,ci){
                h+='<td class="px-3 py-2 text-sm text-text-primary whitespace-nowrap">'+esc(r.cells[ci]||'')+'</td>';
            });
            h+='<td class="px-3 py-2 text-sm whitespace-nowrap '+(r.ok?'text-green-600':'text-red-600')+'">'+esc(r.ok?tr('校验通过'):r.msg)+'</td>';
            h+='</tr>';
        });
    }
    h+='</tbody></table></div>';
    return h;
}
function toggleAllAgentImportRows(cb){
    document.querySelectorAll('.agent-import-check:not([disabled])').forEach(function(x){x.checked=cb.checked;});
}
function onAgentImportPick(input,id){
    var f=(input.files||[])[0];
    if(!f)return;
    _agentImportFile=f.name;
    _agentImportRows=buildAgentImportPreview(id);
    var body=document.getElementById('crud-modal-body');
    if(body)body.innerHTML=agentImportBodyHtml(id);
    var okCount=_agentImportRows.filter(function(r){return r.ok;}).length;
    var sum=document.querySelector('[data-agent-import-summary]');
    if(sum){
        sum.classList.remove('hidden');
        sum.innerHTML=tr('已解析')+' <span class="font-semibold text-text-primary">'+_agentImportRows.length+'</span> '+tr('条')+
            '，'+tr('校验通过')+' <span class="font-semibold text-green-600">'+okCount+'</span> '+tr('条')+
            '，'+tr('校验失败')+' <span class="font-semibold text-red-600">'+(_agentImportRows.length-okCount)+'</span> '+tr('条')+
            '（'+esc(f.name)+'）';
    }
    showToast(tr('已解析')+' '+_agentImportRows.length+' '+tr('条'));
}
/* 原型阶段不解析真实 Excel：按现有成本行造几条示例，最后一行故意缺实际金额演示校验列 */
function buildAgentImportPreview(id){
    id=id||'fcl-agent-cost';
    var c=TC[id]||{},cols=agentImportColumns(id),full=c.h||[];
    var src=(c.d||[]).slice(0,3);
    var idx=function(n){return cols.indexOf(n);};
    return src.map(function(row,i){
        var cells=cols.map(function(name){
            var k=full.indexOf(name);
            return (k>=0&&row[k]!=null)?String(row[k]):'';
        });
        if(idx('服务商账单号')>=0)cells[idx('服务商账单号')]='AGT-IMP-'+(260901+i);
        if(idx('实际金额')>=0&&!cells[idx('实际金额')])cells[idx('实际金额')]='1000';
        if(i===src.length-1&&idx('实际金额')>=0)cells[idx('实际金额')]='';
        var missing=AGENT_IMPORT_REQUIRED.filter(function(name){
            var k=idx(name);
            return k>=0&&!String(cells[k]||'').trim();
        });
        return {cells:cells,ok:missing.length===0,msg:missing.length?(tr('必填项为空')+'：'+missing.join('、')):''};
    });
}
function confirmAgentBillImport(id){
    id=id||'fcl-agent-cost';
    if(!_agentImportRows.length){showToast(tr('请先上传模板文件'));return;}
    var picked=[];
    document.querySelectorAll('.agent-import-check:checked').forEach(function(x){picked.push(parseInt(x.value,10));});
    var rows=picked.map(function(i){return _agentImportRows[i];}).filter(function(r){return r&&r.ok;});
    if(!rows.length){showToast(tr('没有可导入的数据，请先勾选校验通过的行'));return;}
    var c=TC[id]||{},cols=agentImportColumns(id);
    var seedWidth=(c.d&&c.d.length)?c.d[0].length:(c.h||[]).length-1;
    var full=(c.h||[]).slice(0,seedWidth);
    var seq=(c.d||[]).length;
    rows.forEach(function(r){
        var job=r.cells[cols.indexOf('Job No')]||'';
        var fee=cols.indexOf('费用名称')>=0?(r.cells[cols.indexOf('费用名称')]||''):'';
        var row=full.map(function(name){
            var k=cols.indexOf(name);
            if(k>=0)return r.cells[k]||'';
            if(name==='实际成本号')return 'FAC-IMP'+(2609000+(++seq));
            if(name==='预估金额')return fclEstAmountOf(job,fee);   /* 从预估成本明细带出，供后续对账 */
            if(name==='对账状态')return '待对账';
            return '';
        });
        c.d.push(row);
    });
    if(typeof _listData!=='undefined')delete _listData[id];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('导入成功')+' '+rows.length+' '+tr('条')+'，'+tr('已按 Job 带出预估金额，可点「对账」算差异'));
}

/* ===== 代理实际成本 · 手工分摊 =====
 * 一张代账账单常常是几个柜合开的（比如一张 MAERSK 发票覆盖 3 个 Job），
 * 手工分摊就是把这一行的实际金额按 Job 拆成几行，拆完金额必须刚好等于原金额。
 * 确认后原行变成第一份，其余份追加为新行，各自带出自己的预估金额。 */
var _agentAllocCtx={id:'',idx:-1,total:0};
var _agentAllocRows=[];
function openAgentCostAlloc(id){
    id=id||'fcl-agent-cost';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要分摊的成本行'));return;}
    if(idxs.length>1){showToast(tr('手工分摊一次只能选一行'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到成本行'));return;}
    if(fclFinGet(id,row,'对账状态')==='已确认'){showToast(tr('已确认的成本行不能再分摊'));return;}
    var total=fclParseMoney(fclFinGet(id,row,'实际金额'));
    if(total===null||total<=0){showToast(tr('该行没有实际金额，无法分摊'));return;}
    _agentAllocCtx={id:id,idx:idxs[0],total:total};
    /* 默认两行：原 Job 占满，第二行留空等录入 */
    _agentAllocRows=[{job:fclFinGet(id,row,'Job No'),amt:String(total)},{job:'',amt:''}];
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='58%';
    document.getElementById('crud-modal-title').textContent=tr('手工分摊')+' - '+fclFinGet(id,row,'实际成本号');
    document.getElementById('crud-modal-body').innerHTML=agentAllocBodyHtml(id,row);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitAgentCostAlloc()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认分摊')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function agentAllocBodyHtml(id,row){
    var h='';
    h+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(fclFinGet(id,row,'服务商'))+'　'+esc(fclFinGet(id,row,'费用名称'))+'　'+
       tr('待分摊')+' <span class="font-semibold text-text-primary">'+esc(fclFinGet(id,row,'币别'))+' '+
       esc(fclFinGet(id,row,'实际金额'))+'</span>'+
       '<div class="mt-1 text-xs text-text-muted">'+tr('拆成几个 Job，各份金额合计必须等于待分摊金额')+'</div></div>';
    h+='<div class="flex items-center gap-2 mb-2">';
    h+='<button type="button" onclick="addAgentAllocRow()" class="h-8 px-3 text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">'+tr('添加一行')+'</button>';
    h+='<button type="button" onclick="splitAgentAllocEven()" class="h-8 px-3 text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">'+tr('平均分摊')+'</button>';
    h+='<button type="button" onclick="splitAgentAllocByEst()" class="h-8 px-3 text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">'+tr('按预估成本比例分摊')+'</button>';
    h+='</div>';
    h+='<div data-alloc-table>'+agentAllocTableHtml()+'</div>';
    return h;
}
function agentAllocTableHtml(){
    var h='<div class="border border-surface-200 rounded-lg overflow-hidden">';
    h+='<table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary w-10">#</th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr('Job No')+'<span class="text-red-500 ml-1">*</span></th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr('分摊金额')+'<span class="text-red-500 ml-1">*</span></th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr('占比')+'</th>'+
       '<th class="px-3 py-2 w-16"></th></tr></thead><tbody>';
    var total=_agentAllocCtx.total||0;
    _agentAllocRows.forEach(function(r,i){
        var amt=fclParseMoney(r.amt);
        h+='<tr class="border-t border-surface-100" data-alloc-row="'+i+'">'+
           '<td class="px-3 py-2 text-text-muted">'+(i+1)+'</td>'+
           '<td class="px-3 py-2"><input data-alloc-job="'+i+'" type="text" value="'+esc(r.job)+'" onchange="syncAgentAllocRow('+i+')" class="w-full h-8 px-2 text-sm border border-surface-200 rounded-lg bg-surface-50"></td>'+
           '<td class="px-3 py-2"><input data-alloc-amt="'+i+'" type="number" value="'+esc(r.amt)+'" oninput="syncAgentAllocRow('+i+')" class="w-full h-8 px-2 text-sm border border-surface-200 rounded-lg bg-surface-50"></td>'+
           '<td class="px-3 py-2 text-text-secondary">'+((amt!==null&&total)?((amt/total*100).toFixed(2)+'%'):'—')+'</td>'+
           '<td class="px-3 py-2"><button type="button" onclick="removeAgentAllocRow('+i+')" class="text-xs text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button></td></tr>';
    });
    h+='</tbody></table></div>';
    h+=agentAllocSummaryHtml();
    return h;
}
function agentAllocSummaryHtml(){
    var total=_agentAllocCtx.total||0;
    var sum=_agentAllocRows.reduce(function(s,r){return s+(fclParseMoney(r.amt)||0);},0);
    var diff=+(total-sum).toFixed(2);
    var cls=diff===0?'text-success-700':'text-red-600';
    return '<div data-alloc-sum class="mt-2 text-sm '+cls+'">'+
        tr('已分摊')+' <span class="font-semibold">'+sum.toFixed(2)+'</span>　'+
        tr('待分摊')+' <span class="font-semibold">'+total.toFixed(2)+'</span>　'+
        tr('差额')+' <span class="font-semibold">'+diff.toFixed(2)+'</span>'+
        (diff===0?('　'+tr('金额已分摊完毕')):('　'+tr('差额不为 0 无法提交')))+'</div>';
}
function readAgentAllocRow(i){
    var j=document.querySelector('[data-alloc-job="'+i+'"]');
    var a=document.querySelector('[data-alloc-amt="'+i+'"]');
    if(_agentAllocRows[i]){
        if(j)_agentAllocRows[i].job=String(j.value||'');
        if(a)_agentAllocRows[i].amt=String(a.value||'');
    }
}
function syncAgentAllocRow(i){
    readAgentAllocRow(i);
    var box=document.querySelector('[data-alloc-sum]');
    if(box)box.outerHTML=agentAllocSummaryHtml();
}
function readAllAgentAllocRows(){
    _agentAllocRows.forEach(function(r,i){readAgentAllocRow(i);});
}
function redrawAgentAlloc(){
    var box=document.querySelector('[data-alloc-table]');
    if(box)box.innerHTML=agentAllocTableHtml();
}
function addAgentAllocRow(){
    readAllAgentAllocRows();
    _agentAllocRows.push({job:'',amt:''});
    redrawAgentAlloc();
}
function removeAgentAllocRow(i){
    readAllAgentAllocRows();
    if(_agentAllocRows.length<=2){showToast(tr('至少保留两行，否则不叫分摊'));return;}
    _agentAllocRows.splice(i,1);
    redrawAgentAlloc();
}
/* 平均分摊：除不尽的零头补到最后一行，保证合计刚好等于总额。
 * msg 用于被「按预估比例」回退调用时说明原因 —— 否则那条提示会被这里的覆盖掉。 */
function splitAgentAllocEven(msg){
    readAllAgentAllocRows();
    var n=_agentAllocRows.length,total=_agentAllocCtx.total||0;
    if(!n)return;
    var each=Math.floor(total/n*100)/100,acc=0;
    _agentAllocRows.forEach(function(r,i){
        var v=(i===n-1)?+(total-acc).toFixed(2):each;
        acc+=v;r.amt=String(v);
    });
    redrawAgentAlloc();
    showToast(msg||(tr('已平均分摊到')+' '+n+' '+tr('行')));
}
/* 按各 Job 的预估成本比例分摊；有 Job 取不到预估的就退回平均分摊 */
function splitAgentAllocByEst(){
    readAllAgentAllocRows();
    var total=_agentAllocCtx.total||0;
    var ests=_agentAllocRows.map(function(r){
        return r.job?(fclParseMoney(fclEstAmountOf(r.job,''))||0):0;
    });
    var base=ests.reduce(function(s,v){return s+v;},0);
    if(!base){splitAgentAllocEven(tr('所选 Job 都没有预估成本，已改用平均分摊'));return;}
    var acc=0,n=_agentAllocRows.length;
    _agentAllocRows.forEach(function(r,i){
        var v=(i===n-1)?+(total-acc).toFixed(2):Math.floor(total*ests[i]/base*100)/100;
        acc+=v;r.amt=String(v);
    });
    redrawAgentAlloc();
    showToast(tr('已按预估成本比例分摊'));
}
function submitAgentCostAlloc(){
    readAllAgentAllocRows();
    var id=_agentAllocCtx.id,src=fclFinRows(id)[_agentAllocCtx.idx];
    if(!src){showToast(tr('未找到成本行'));return;}
    var valid=_agentAllocRows.filter(function(r){return String(r.job||'').trim()&&fclParseMoney(r.amt)!==null;});
    if(valid.length<2){showToast(tr('至少填两行 Job 与金额才能分摊'));return;}
    var jobs=valid.map(function(r){return r.job.trim();});
    if(new Set(jobs).size!==jobs.length){showToast(tr('同一个 Job 出现了多次，请合并后再分摊'));return;}
    if(valid.some(function(r){return (fclParseMoney(r.amt)||0)<=0;})){showToast(tr('分摊金额必须大于 0'));return;}
    var sum=valid.reduce(function(s,r){return s+(fclParseMoney(r.amt)||0);},0);
    var diff=+((_agentAllocCtx.total||0)-sum).toFixed(2);
    if(diff!==0){showToast(tr('各份合计与待分摊金额差')+' '+diff+'，'+tr('请调平后再提交'));return;}
    var c=TC[id]||{},h=c.h||[];
    var seedWidth=(c.d&&c.d.length)?c.d[0].length:h.length-1;
    var fee=fclFinGet(id,src,'费用名称');
    var mark=tr('由')+' '+fclFinGet(id,src,'实际成本号')+' '+tr('手工分摊');
    /* 第一份改写原行 */
    fclFinSet(id,src,'Job No',valid[0].job.trim());
    fclFinSet(id,src,'实际金额',String(fclParseMoney(valid[0].amt)));
    fclFinSet(id,src,'预估金额',fclEstAmountOf(valid[0].job.trim(),fee));
    fclFinSet(id,src,'差异金额','');fclFinSet(id,src,'差异率','');
    fclFinSet(id,src,'对账状态','待对账');
    fclFinSet(id,src,'备注',mark);
    /* 其余份追加为新行；写 TC.d 而不是 _listData，否则下次渲染就没了 */
    var seq=(c.d||[]).length;
    valid.slice(1).forEach(function(r){
        var job=r.job.trim();
        var row=h.slice(0,seedWidth).map(function(name){
            if(name==='实际成本号')return 'FAC-AL'+(2609000+(++seq));
            if(name==='Job No')return job;
            if(name==='实际金额')return String(fclParseMoney(r.amt));
            if(name==='预估金额')return fclEstAmountOf(job,fee);
            if(name==='差异金额'||name==='差异率'||name==='对账人'||name==='对账时间')return '';
            if(name==='对账状态')return '待对账';
            if(name==='备注')return mark;
            return fclFinGet(id,src,name);   /* 服务商/费用名称/费用类别/币别/账单号等照抄 */
        });
        c.d.push(row);
    });
    if(typeof _listData!=='undefined')delete _listData[id];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('已分摊为')+' '+valid.length+' '+tr('行')+'，'+tr('各行状态回到「待对账」，可重新对账'));
}

/* ③ 应付账单管理：付款登记 —— 累加已付、倒算待付、据此定状态 */
var _apPayCtx={id:'',idx:-1};
function openApBillPay(id){
    id=id||'fcl-ap-bill';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要付款的账单'));return;}
    if(idxs.length>1){showToast(tr('付款登记一次只能选一张账单'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到账单'));return;}
    var st=fclFinGet(id,row,'账单状态');
    if(st==='已付清'||st==='已作废'){showToast(tr('该账单为')+'「'+tr(st)+'」，'+tr('不能再付款'));return;}
    _apPayCtx={id:id,idx:idxs[0]};
    var due=fclParseMoney(fclFinGet(id,row,'待付金额'));
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='46%';
    document.getElementById('crud-modal-title').textContent=tr('付款登记')+' - '+fclFinGet(id,row,'应付账单号');
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(fclFinGet(id,row,'服务商'))+'　'+esc(fclFinGet(id,row,'账单周期'))+'　'+
       tr('应付')+' '+esc(fclFinGet(id,row,'币别'))+' '+esc(fclFinGet(id,row,'应付金额'))+
       '　'+tr('已付')+' '+esc(fclFinGet(id,row,'已付金额')||'0')+
       '　<span class="font-semibold text-text-primary">'+tr('待付')+' '+esc(fclFinGet(id,row,'待付金额'))+'</span></div>';
    [['本次付款金额','pay-amt','number',due===null?'':String(due)],
     ['付款方式','pay-way','select',''],['付款时间','pay-time','datetime-local',''],
     ['付款水单','pay-slip','text','']].forEach(function(f){
        b+='<div class="mb-3" data-pay-field="'+f[1]+'"><label class="text-xs text-text-secondary mb-1 block">'+tr(f[0])+
           (f[1]==='pay-amt'?'<span class="text-red-500 ml-1">*</span>':'')+'</label>';
        if(f[2]==='select'){
            b+='<select id="'+f[1]+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+
               ['电汇','支票','承兑','现金'].map(function(o){return '<option value="'+o+'">'+tr(o)+'</option>';}).join('')+'</select>';
        }else{
            b+='<input id="'+f[1]+'" type="'+f[2]+'" value="'+esc(f[3])+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">';
        }
        b+='</div>';
    });
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitApBillPay()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认付款')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function submitApBillPay(){
    var id=_apPayCtx.id,row=fclFinRows(id)[_apPayCtx.idx];
    if(!row){showToast(tr('未找到账单'));return;}
    var el=document.getElementById('pay-amt');
    var amt=fclParseMoney(el?el.value:'');
    if(amt===null||amt<=0){showToast(tr('请填写大于 0 的付款金额'));return;}
    var total=fclParseMoney(fclFinGet(id,row,'应付金额'))||0;
    var paid=(fclParseMoney(fclFinGet(id,row,'已付金额'))||0)+amt;
    if(paid>total){showToast(tr('本次付款后已付金额超过应付金额，请核对'));return;}
    var left=total-paid;
    fclFinSet(id,row,'已付金额',String(paid));
    fclFinSet(id,row,'待付金额',String(left));
    var w=document.getElementById('pay-way'),t=document.getElementById('pay-time'),s=document.getElementById('pay-slip');
    if(w&&w.value)fclFinSet(id,row,'付款方式',w.value);
    if(t&&t.value)fclFinSet(id,row,'付款时间',t.value);
    if(s&&s.value)fclFinSet(id,row,'付款水单',s.value);
    fclFinSet(id,row,'审批人',(typeof getCurrentUserName==='function')?getCurrentUserName():'admin');
    fclFinSet(id,row,'账单状态',left===0?'已付清':'部分付款');
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('已登记付款')+' '+amt+'，'+tr('待付')+' '+left+'，'+tr('状态转为')+'「'+tr(left===0?'已付清':'部分付款')+'」');
}
/* ⑤ 应收收款管理：核销 / 反核销 */
var _arWriteOffCtx={id:'',idx:-1};
function openArReceiptWriteOff(id){
    id=id||'fcl-ar-receipt';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要核销的收款单'));return;}
    if(idxs.length>1){showToast(tr('核销一次只能选一张收款单'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到收款单'));return;}
    var st=fclFinGet(id,row,'收款状态');
    if(st==='待认领'){showToast(tr('该收款单还没认领到客户，先补客户名称再核销'));return;}
    if(st==='全部核销'){showToast(tr('该收款单已全部核销'));return;}
    _arWriteOffCtx={id:id,idx:idxs[0]};
    var left=fclParseMoney(fclFinGet(id,row,'未核销金额'));
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='46%';
    document.getElementById('crud-modal-title').textContent=tr('核销')+' - '+fclFinGet(id,row,'收款单号');
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(fclFinGet(id,row,'客户名称'))+'　'+tr('收款')+' '+esc(fclFinGet(id,row,'币别'))+' '+esc(fclFinGet(id,row,'收款金额'))+
       '　'+tr('已核销')+' '+esc(fclFinGet(id,row,'已核销金额')||'0')+
       '　<span class="font-semibold text-text-primary">'+tr('未核销')+' '+esc(fclFinGet(id,row,'未核销金额'))+'</span></div>';
    b+='<div class="mb-3"><label class="text-xs text-text-secondary mb-1 block">'+tr('本次核销金额')+'<span class="text-red-500 ml-1">*</span></label>'+
       '<input id="wo-amt" type="number" value="'+(left===null?'':left)+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"></div>';
    b+='<div class="mb-3"><label class="text-xs text-text-secondary mb-1 block">'+tr('核销到 Job')+'</label>'+
       '<input id="wo-job" type="text" value="'+esc(fclFinGet(id,row,'关联Job'))+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"></div>';
    b+='<div class="text-xs text-text-muted">'+tr('核销后会冲减该 Job 应收费用明细里的未收金额')+'</div>';
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitArReceiptWriteOff()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认核销')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function submitArReceiptWriteOff(){
    var id=_arWriteOffCtx.id,row=fclFinRows(id)[_arWriteOffCtx.idx];
    if(!row){showToast(tr('未找到收款单'));return;}
    var el=document.getElementById('wo-amt');
    var amt=fclParseMoney(el?el.value:'');
    if(amt===null||amt<=0){showToast(tr('请填写大于 0 的核销金额'));return;}
    var total=fclParseMoney(fclFinGet(id,row,'收款金额'))||0;
    var done=(fclParseMoney(fclFinGet(id,row,'已核销金额'))||0)+amt;
    if(done>total){showToast(tr('核销金额超过收款金额，请核对'));return;}
    var left=total-done;
    fclFinSet(id,row,'已核销金额',String(done));
    fclFinSet(id,row,'未核销金额',String(left));
    fclFinSet(id,row,'核销人',(typeof getCurrentUserName==='function')?getCurrentUserName():'admin');
    fclFinSet(id,row,'核销时间',(typeof receiptNowStr==='function')?receiptNowStr():'');
    fclFinSet(id,row,'收款状态',left===0?'全部核销':'部分核销');
    var jobEl=document.getElementById('wo-job');
    var job=jobEl?String(jobEl.value||''):'';
    if(job)fclFinSet(id,row,'关联Job',job);
    var hit=fclWriteOffAgainstArFee(job,amt);
    closeCrudModal();
    fclFinRefresh(id);
    var msg=tr('已核销')+' '+amt+'，'+tr('未核销')+' '+left;
    msg+=hit?('，'+tr('已冲减应收明细')+' '+hit+' '+tr('条')):('，'+tr('未找到该 Job 的应收明细'));
    showToast(msg);
}
/* 把核销金额按顺序冲到该 Job 的应收明细未收金额上，返回冲减的条数 */
function fclWriteOffAgainstArFee(job,amount){
    if(!job)return 0;
    var fid='fcl-ar-fee',c=TC[fid];
    if(!c||!c.d)return 0;
    var h=c.h||[],iJob=h.indexOf('Job No');
    if(iJob<0)return 0;
    var left=amount,n=0;
    c.d.forEach(function(row){
        if(left<=0)return;
        if(String(row[iJob]||'')!==job)return;
        var due=fclParseMoney(fclFinGet(fid,row,'未收金额'));
        if(due===null||due<=0)return;
        var take=Math.min(due,left);
        var got=(fclParseMoney(fclFinGet(fid,row,'已收金额'))||0)+take;
        fclFinSet(fid,row,'已收金额',String(got));
        fclFinSet(fid,row,'未收金额',String(due-take));
        fclFinSet(fid,row,'费用确认状态',(due-take)===0?'已结清':'部分收款');
        left-=take;n++;
    });
    if(typeof _listData!=='undefined')delete _listData[fid];
    return n;
}

/* ==========================================================================
 * 四、既有表覆写：主线收敛与字段扩展
 * ========================================================================== */

/* 10.2 Job/主单管理（原「订舱管理」）—— 整柜全链路主档。
 *      Job No 自动生成；危险品明细随勾选显隐；
 *      弹窗按 基础信息 / 订舱信息 / 主单信息 / 单证信息 分板块。
 *      种子数据用「表头 -> 值」的对象写，再按表头顺序摊平，避免加列时串位。 */
var FCL_BOOKING_HEADERS='Job No|委托订单号|船司|起运港|目的港|柜型柜量|船名航次|ETD|ETA|ATD|ATA|订舱回执号|回执附件|放舱附件|关务联系人|协议号|截补料时间|订舱日期|订舱方式|订舱人|订舱备注|S/O No.|放单方式|品名|HS Code|货重|柜量|Shipper|Notify|Consignee|是否危险品|UN编号|危险类别|包装类别|危险品申报人|主单备注|柜号|封签号|柜重|订舱状态|操作';
var FCL_BOOKING_SEED=[
    {'Job No':'FBK-20260613001','委托订单号':'FEO-20260613001','客户名称':'深圳市华运达国际货运',
     '船司':'MAERSK','起运港':'深圳盐田','目的港':'拉各斯','柜型柜量':'40HQ×1','船名航次':'MAERSK LAGOS 026W',
     'ETD':'2026-06-20','ETA':'2026-07-18','ATD':'','ATA':'',
     '协议号':'MSK-CN-2026-8891','截补料时间':'2026-06-17 12:00','订舱日期':'2026-06-13','订舱方式':'EDI','订舱人':'刘订舱',
     '订舱备注':'客户要求本航次务必装出','S/O No.':'','放单方式':'电放',
     'Shipper':'联系人：张明\n联系公司：深圳市华运达国际货运\n联系人地址：深圳市盐田区盐田路 88 号\n联系人电话：13800138000',
     'Notify':'联系人：Same as consignee',
     'Consignee':'联系人：Mr. Okonkwo\n联系公司：Lagos Import Ltd\n联系人地址：12 Apapa Wharf Road, Lagos, Nigeria\n联系人电话：+234 802 111 2222',
     '品名':'电子产品','HS Code':'8543.7099','货重':'12,400 KG','柜量':'1','是否危险品':'否',
     '主单备注':'','柜号':'','封签号':'','柜重':'','订舱状态':'待订舱'},
    {'Job No':'FBK-20260612002','委托订单号':'FEO-20260612002','客户名称':'广州远洋进出口贸易',
     '船司':'COSCO','起运港':'广州南沙','目的港':'达喀尔','柜型柜量':'20GP×2','船名航次':'COSCO AFRICA 118W',
     'ETD':'2026-06-22','ETA':'2026-07-20','ATD':'2026-06-22','ATA':'',
     '订舱回执号':'COSU778812','回执附件':'COSCO订舱确认书.pdf;舱位确认邮件.png',
     '协议号':'COS-CN-2026-4412','截补料时间':'2026-06-18 18:00','订舱日期':'2026-06-12','订舱方式':'官网','订舱人':'赵订舱',
     '订舱备注':'船司已确认舱位','S/O No.':'SO-COS-2026-0612','放单方式':'正本',
     'Shipper':'联系人：李经理\n联系公司：广州远洋进出口贸易\n联系人地址：广州市南沙区港前大道 168 号\n联系人电话：13900139002',
     'Notify':'联系人：Dakar Notify',
     'Consignee':'联系人：M. Diop\n联系公司：Dakar Trading SARL\n联系人地址：Rue 12, Zone Portuaire, Dakar, Senegal\n联系人电话：+221 77 333 4444',
     '品名':'服装','HS Code':'6109.1000','货重':'21,500 KG','柜量':'2','是否危险品':'否',
     '主单备注':'主单已确认，等待放舱','柜号':'COSU7654321','封签号':'SL-0612889','柜重':'21,500 KG',
     '订舱状态':'已订舱'},
    {'Job No':'FBK-20260611003','委托订单号':'FEO-20260611003','客户名称':'东莞市鑫海物流',
     '船司':'CMA CGM','起运港':'上海洋山','目的港':'阿比让','柜型柜量':'40HQ×1','船名航次':'CMA MARSEILLE 09W',
     'ETD':'2026-06-25','ETA':'2026-07-22','ATD':'','ATA':'',
     '协议号':'CMA-CN-2026-3320','截补料时间':'2026-06-21 12:00','订舱日期':'2026-06-11','订舱方式':'EDI','订舱人':'刘订舱',
     '订舱备注':'危险品，结单时间早于普货48小时','S/O No.':'','放单方式':'电放',
     '品名':'锂电池','HS Code':'8507.6000','货重':'18,600 KG','柜量':'1',
     '是否危险品':'是','UN编号':'UN3480','危险类别':'9类 锂电池','包装类别':'PI965','危险品申报人':'李申报',
     '主单备注':'','柜号':'','封签号':'','柜重':'','订舱状态':'待订舱'},
    {'Job No':'FBK-20260610004','委托订单号':'FEO-20260613004','客户名称':'',
     '船司':'MSC','起运港':'深圳盐田','目的港':'特马','柜型柜量':'40HQ×2','船名航次':'MSC ACCRA 23W',
     'ETD':'2026-07-02','ETA':'2026-07-29','ATD':'2026-07-02','ATA':'2026-07-28',
     '订舱回执号':'MSCU334455','回执附件':'MSC_booking_confirm.pdf',
     '放舱附件':'MSC放舱件_特马.pdf','关务联系人':'陈关务 / 13800138001',
     '协议号':'','截补料时间':'2026-06-28 12:00','订舱日期':'2026-06-10','订舱方式':'官网','订舱人':'赵订舱',
     '订舱备注':'预录单委托，无费用产生、无需财务审核','S/O No.':'SO-MSC-2026-0610','放单方式':'海运单',
     '品名':'五金工具','HS Code':'8205.5900','货重':'24,800 KG','柜量':'2','是否危险品':'否',
     '主单备注':'船司已放舱','柜号':'MSCU3344556','封签号':'SL-0610223','柜重':'24,800 KG',
     '订舱状态':'已放舱'},
    {'Job No':'FBK-20260609006','委托订单号':'FEO-20260609007',
     '船司':'MAERSK','起运港':'深圳盐田','目的港':'拉各斯','柜型柜量':'40HQ×1','船名航次':'MAERSK LAGOS 025W',
     'ETD':'2026-06-16','ETA':'2026-07-14','ATD':'','ATA':'',
     '订舱回执号':'MSKU220011','回执附件':'MAERSK订舱确认书.pdf',
     '放舱附件':'MAERSK放舱件_拉各斯.pdf','关务联系人':'陈关务 / 13800138001',
     '协议号':'MSK-CN-2026-8870','截补料时间':'2026-06-13 12:00','订舱日期':'2026-06-09','订舱方式':'EDI','订舱人':'刘订舱',
     '订舱备注':'已完成装柜，等待开船','S/O No.':'SO-MSK-2026-0609','放单方式':'电放',
     '品名':'电子产品','HS Code':'8543.7099','货重':'19,200 KG','柜量':'1','是否危险品':'否',
     '主单备注':'装柜完成','柜号':'MSKU2200113','封签号':'SL-0609771','柜重':'19,200 KG','订舱状态':'已装柜'},
    {'Job No':'FBK-20260605007','委托订单号':'FEO-20260605008',
     '船司':'COSCO','起运港':'广州南沙','目的港':'达喀尔','柜型柜量':'20GP×1','船名航次':'COSCO AFRICA 117W',
     'ETD':'2026-06-10','ETA':'2026-07-08','ATD':'2026-06-10','ATA':'',
     '订舱回执号':'COSU661200','回执附件':'COSCO订舱确认书.pdf',
     '放舱附件':'COSCO放舱件_达喀尔.pdf','关务联系人':'周关务 / 13900139002',
     '协议号':'COS-CN-2026-4400','截补料时间':'2026-06-07 18:00','订舱日期':'2026-06-05','订舱方式':'官网','订舱人':'赵订舱',
     '订舱备注':'船已开出','S/O No.':'SO-COS-2026-0605','放单方式':'正本',
     '品名':'服装','HS Code':'6109.1000','货重':'11,800 KG','柜量':'1','是否危险品':'否',
     '主单备注':'已离港，在途跟踪中','柜号':'COSU6612004','封签号':'SL-0605330','柜重':'11,800 KG','订舱状态':'已离港'},
    {'Job No':'FBK-20260520008','委托订单号':'FEO-20260520009',
     '船司':'CMA CGM','起运港':'上海洋山','目的港':'阿比让','柜型柜量':'40HQ×1','船名航次':'CMA MARSEILLE 07W',
     'ETD':'2026-05-24','ETA':'2026-06-21','ATD':'2026-05-24','ATA':'2026-06-20',
     '订舱回执号':'CMAU441100','回执附件':'CMA订舱确认书.pdf',
     '放舱附件':'CMA放舱件_阿比让.pdf','关务联系人':'陈关务 / 13800138001',
     '协议号':'CMA-CN-2026-3300','截补料时间':'2026-05-21 12:00','订舱日期':'2026-05-20','订舱方式':'EDI','订舱人':'刘订舱',
     '订舱备注':'已到港，等待清关提柜','S/O No.':'SO-CMA-2026-0520','放单方式':'电放',
     '品名':'五金工具','HS Code':'8205.5900','货重':'22,400 KG','柜量':'1','是否危险品':'否',
     '主单备注':'目的港已到','柜号':'CMAU4411005','封签号':'SL-0520118','柜重':'22,400 KG','订舱状态':'已到港'},
    {'Job No':'FBK-20260505009','委托订单号':'FEO-20260505010',
     '船司':'MSC','起运港':'深圳盐田','目的港':'特马','柜型柜量':'40HQ×1','船名航次':'MSC ACCRA 21W',
     'ETD':'2026-05-09','ETA':'2026-06-05','ATD':'2026-05-09','ATA':'2026-06-04',
     '订舱回执号':'MSCU880077','回执附件':'MSC_booking_confirm.pdf',
     '放舱附件':'MSC放舱件_特马.pdf','关务联系人':'陈关务 / 13800138001',
     '协议号':'MSC-CN-2026-2210','截补料时间':'2026-05-06 12:00','订舱日期':'2026-05-05','订舱方式':'官网','订舱人':'赵订舱',
     '订舱备注':'全程完成','S/O No.':'SO-MSC-2026-0505','放单方式':'海运单',
     '品名':'家具','HS Code':'9403.6090','货重':'17,600 KG','柜量':'1','是否危险品':'否',
     '主单备注':'客户已签收','柜号':'MSCU8800776','封签号':'SL-0505992','柜重':'17,600 KG','订舱状态':'已签收'},
    {'Job No':'FBK-20260608005','委托订单号':'FEO-20260608006','客户名称':'广州远洋进出口贸易',
     '船司':'ONE','起运港':'广州南沙','目的港':'洛美','柜型柜量':'20GP×1','船名航次':'ONE LOME 07W',
     'ETD':'2026-06-18','ETA':'','ATD':'','ATA':'',
     '协议号':'','截补料时间':'2026-06-14 12:00','订舱日期':'2026-06-08','订舱方式':'邮件','订舱人':'赵订舱',
     '订舱备注':'客户取消出运，主单作废','S/O No.':'','放单方式':'电放',
     '品名':'家具','HS Code':'9403.6090','货重':'','柜量':'1','是否危险品':'否',
     '主单备注':'','柜号':'','封签号':'','柜重':'','订舱状态':'已作废'}
];
addPrototypeTable('fcl-booking','Job/主单管理',
    FCL_BOOKING_HEADERS,
    ['待订舱','已订舱','已放舱','已装柜','已离港','已到港','已签收','已作废'],
    FCL_BOOKING_SEED.map(function(o){
        return FCL_BOOKING_HEADERS.split('|').slice(0,-1).map(function(h){return o[h]===undefined?'':o[h];});
    }),[
    {label:'Job No',type:'text'},
    {label:'S/O No.',type:'text'},
    {label:'委托订单号',type:'text'},
    {label:'船司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'起运港',type:'select',options:FCL_POL_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'柜号',type:'text'},
    {label:'协议号',type:'text'},
    {label:'品名',type:'text'},
    {label:'是否危险品',type:'select',options:['是','否']},
    {label:'ETD',type:'date'},
    {label:'订舱状态',type:'select',options:['待订舱','已订舱','已放舱','已装柜','已离港','已到港','已签收','已作废']}
]);
/* 委托订单号：数据仍在列表里（委托单审核通过或「关联委托」时写入），但不在弹窗录入；
 * 客户名称已从主单去掉 —— 一个主单可能合并关联多张委托单，客户不唯一，去委托单里看 */
TC['fcl-booking'].modalExcludedFields=['订舱状态','委托订单号'];
/* 订舱回执号 / 回执附件由「登记订舱回执」写入，不由人工在新增/编辑里录：只在查看明细里成板块展示 */
TC['fcl-booking'].modalFieldModes={'订舱回执号':['view'],'回执附件':['view'],
    /* 放舱附件 / 关务联系人由「放舱」写入，同样只在查看明细里成板块展示 */
    '放舱附件':['view'],'关务联系人':['view']};
TC['fcl-booking'].fieldOptions={
    '船司':FCL_CARRIER_OPTIONS,
    '起运港':FCL_POL_OPTIONS,
    '目的港':FCL_POD_OPTIONS,
    '柜型柜量':['20GP×1','20GP×2','40GP×1','40HQ×1','40HQ×2'],
    '订舱方式':['EDI','官网','邮件','电话','外配同行','一代'],
    '放单方式':['电放','正本','海运单','副本放单'],
    '柜量':['1','2','3','4','5','6','8','10'],
    '是否危险品':['是','否'],
    '危险类别':['1类 爆炸品','3类 易燃液体','8类 腐蚀品','9类 锂电池'],
    '包装类别':['I类','II类','III类','PI965','PI967'],
    /* 函数：弹窗打开时才求值，跟随品名库(cfg-product-name)与发件人信息(base-sender)的最新数据 */
    '品名':fclProductNameOptions,'HS Code':fclHsCodeOptions,
    'Shipper':fclSenderOptions,'Consignee':fclSenderOptions,'Notify':fclSenderOptions
};
/* Job No 不含「单号/编号」字样，引擎认不出来 → 显式声明为 code 才会只读自动生成；
 * 订舱人固定为当前登录人不可改；四个船期字段都是日期控件；
 * UN编号含「编号」会被误判为自动生成，强制回文本；是否危险品用勾选框 */
TC['fcl-booking'].modalFieldTypes={'Job No':'code','订舱人':'currentUser',
    'ETD':'date','ETA':'date','ATD':'date','ATA':'date','订舱日期':'date','截补料时间':'date',
    '回执附件':'attachment','放舱附件':'attachment','UN编号':'text','是否危险品':'checkbox','货重':'text',
    /* Shipper/Notify/Consignee：上面一个发件人选择框，下面一个可多行录入的文本框 */
    'Shipper':'pickerText','Consignee':'pickerText','Notify':'pickerText'};
/* 必填覆写：起运港（全局正则只收录了目的港，属遗漏）；
 * S/O No. 由船司订舱后回签、订舱日期在真正订出去才有 —— 建单时都还是空的，不能卡必填；
 * 品名必填 —— HS Code 跟着它带出来，品名空着 HS Code 就无从谈起 */
TC['fcl-booking'].requiredOverrides={'起运港':true,'S/O No.':false,'订舱日期':false,'品名':true};
TC['fcl-booking'].fieldChangeHandlers={
    '品名':'fclBookingFillHsCode(this)',
    '是否危险品':'fclBookingToggleDangerous()',
    'Shipper':'fclBookingFillParty(this)',
    'Consignee':'fclBookingFillParty(this)',
    'Notify':'fclBookingFillParty(this)'
};
/* 主单信息板块的两种排布（样式见 css/app.css）：
 * - 是否危险品：独占一行、控件只占 1/4 宽 —— 它是下面危险品信息那一组的开关，
 *   跟普通字段并排会看不出这层从属关系；
 * - 危险品四个明细：每行 4 个，一行放完。 */
TC['fcl-booking'].modalFieldClass={
    '是否危险品':'field-row-quarter',
    'UN编号':'field-col-quarter','危险类别':'field-col-quarter',
    '包装类别':'field-col-quarter','危险品申报人':'field-col-quarter'
};
TC['fcl-booking'].afterModalRender='fclBookingAfterModalRender';
/* 字段多、板块多，用紧凑排版压掉间距（见 css/app.css 的 .crud-compact） */
TC['fcl-booking'].compactModal=true;

/* 危险品明细：勾选「是否危险品」时才显示并必填（SOP 7.4）。
 * 这四个字段现在归在主单信息板块内部，所以只做字段级显隐，不整块收起。 */
var FCL_DG_FIELDS=['UN编号','危险类别','包装类别','危险品申报人'];

/* 弹窗分板块：没被任何板块认领的字段（船司/航线/港口/柜型/船名航次/
 * ETD-ETA-ATD-ATA/协议号/截补料时间）留在最上面的「基础信息」主栅格里。
 * 订舱回执信息只在查看明细里出现（见 modalFieldModes）。
 * 注意：必须写在 FCL_DG_FIELDS 赋值之后 —— var 只提升声明不提升值。 */
TC['fcl-booking'].modalSections=[
    /* 订舱信息也用 3 列：三个矮字段正好铺满第一行，订舱备注整行独占第二行。
     * 留 5 列的话备注铺满后第一行会空出 2 格。 */
    {key:'booking',title:'订舱信息',cols:3,fields:['订舱日期','订舱人','订舱方式','订舱备注']},
    /* 主单信息用 3 列：Shipper/Notify/Consignee 是「下拉 + 多行文本」的高块，
     * 在 5 列栅格里跟矮字段混排会撑出大片空洞（矮字段下面白 88px、行尾还剩 1 格）；
     * 3 列刚好让这三个高块并排成完整一行，高度一致、没有缺口。
     * 字段先后由表头顺序决定（引擎按 header index 排序，不是按这里的 fields 顺序），
     * 已在 FCL_BOOKING_HEADERS 里排成：6 个矮字段 -> 3 个高块 -> 危险品 -> 主单备注。 */
    {key:'master',title:'主单信息',cols:12,
        /* 小标题挂在 UN编号 上而不是「是否危险品」上：勾选框始终显示，
         * 「危险品信息」这一组连同标题只在勾上之后才出现在它下面 */
        dividers:{'UN编号':'危险品信息'},
        fields:['S/O No.','放单方式','品名','HS Code','货重','柜量','Shipper','Notify','Consignee',
            '是否危险品'].concat(FCL_DG_FIELDS).concat(['主单备注'])},
    {key:'doc',title:'单证信息',cols:3,fields:['柜号','封签号','柜重']},
    {key:'receipt',title:'订舱回执信息',cols:3,fields:['订舱回执号','回执附件']},
    {key:'release',title:'放舱信息',cols:3,fields:['放舱附件','关务联系人']}
];

/* ===== 品名 / HS Code =====
 * HS Code 不允许手填：它只能是品名库里维护好的那一个。做法是两个都做成下拉，
 * 选品名时自动把对应的 HS 编码带过来 —— 既不会填错，也不会跟品名对不上。 */
function fclProductNameRows(){
    var c=TC['cfg-product-name'];
    if(!c||!c.d)return [];
    var iName=(c.h||[]).indexOf('品名中文名'),iHs=(c.h||[]).indexOf('HS编码'),iSt=(c.h||[]).indexOf('状态');
    if(iName<0)return [];
    return c.d.filter(function(r){return r[iName]&&(iSt<0||r[iSt]!=='停用');})
              .map(function(r){return {name:r[iName],hs:iHs>=0?(r[iHs]||''):''};});
}
function fclProductNameOptions(){
    return fclProductNameRows().map(function(r){return r.name;});
}
function fclHsCodeOptions(){
    var seen={},out=[];
    fclProductNameRows().forEach(function(r){
        if(r.hs&&!seen[r.hs]){seen[r.hs]=1;out.push(r.hs);}
    });
    return out;
}
/* 选中品名 → 带出它的 HS 编码 */
function fclBookingFillHsCode(sel){
    var name=sel&&sel.value;
    if(!name)return;
    var row=fclProductNameRows().find(function(r){return r.name===name;});
    if(!row){showToast(tr('品名库里没有该品名'));return;}
    if(!row.hs){showToast(tr('该品名尚未维护 HS 编码，请先到品名库补充'));return;}
    if(crudSetField('HS Code',row.hs))showToast('HS Code '+esc(row.hs));
}
/* 是否危险品（勾选框）→ 危险品四个明细字段显隐 + 必填联动；
 * 「危险品信息」小标题跟着一起显隐，不然没勾选时会剩一条空标题。 */
function fclBookingToggleDangerous(){
    var on=crudFieldValue('是否危险品')==='是';
    FCL_DG_FIELDS.forEach(function(h){crudToggleField(h,on,true);});
    var dv=(typeof crudSectionDivider==='function')?crudSectionDivider('UN编号'):null;
    if(dv)dv.classList.toggle('hidden',!on);
}

/* 发件人下拉：取「发件人信息」(base-sender) 的联系公司 */
function fclSenderOptions(){
    var c=TC['base-sender'];
    if(!c||!c.d)return [];
    var i=(c.h||[]).indexOf('联系公司');
    if(i<0)i=0;
    return c.d.map(function(r){return r[i];}).filter(Boolean);
}
/* 选中发件人 → 把联系人 / 联系公司 / 联系人地址 / 联系人电话 带进下面的多行文本框 */
function fclBookingFillParty(sel){
    var name=sel&&sel.value;
    if(!name)return;
    var c=TC['base-sender'];
    if(!c||!c.d)return;
    var g=function(row,label){var i=(c.h||[]).indexOf(label);return i>=0?(row[i]||''):'';};
    var iCo=(c.h||[]).indexOf('联系公司');
    var row=c.d.find(function(r){return r[iCo>=0?iCo:0]===name;});
    if(!row){showToast(tr('未找到该发件人'));return;}
    var hd=sel.getAttribute('data-picker')||'';
    var text=[tr('联系人')+'：'+g(row,'联系人'),
              tr('联系公司')+'：'+g(row,'联系公司'),
              tr('联系人地址')+'：'+g(row,'地址'),
              tr('联系人电话')+'：'+g(row,'联系电话')].join('\n');
    if(crudSetField(hd,text))showToast(tr('已带出发件人信息'));
}

/* 委托订单号下拉选项：取委托订单管理里未取消的单 */
function fclEntrustOrderNoOptions(){
    var c=TC['fcl-sales-instruction'];
    if(!c||!c.d)return [];
    var si=c.h.indexOf('状态'),ni=c.h.indexOf('委托订单号');
    return c.d.filter(function(r){return r[si]!=='已取消';}).map(function(r){return r[ni];});
}

/* ===== 复制主单 =====
 * 弹窗跟「修改数据」完全一样，只是重新生成 Job No，其余字段原样保留。
 * 实现上直接复用 edit 弹窗，再在渲染完成后改这个字段与标题/按钮，避免重写一套表单。 */
var _fclBookingCopyPending=false;
function openFclBookingCopy(id){
    var idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    _fclBookingCopyPending=true;
    openCrudModal('edit',id,idx);
}

/* 下一个 Job No：与引擎新增时的自动编号规则一致（末尾数字段 +1，保持位数） */
function fclNextBookingNo(id){
    var c=TC[id]||{},data=_listData[id]||expandData(id);
    var i=(c.h||[]).indexOf('Job No');
    var last=(i>=0&&data.length&&data[data.length-1][i])||'';
    var m=String(last).match(/^(.*?)(\d+)$/);
    return m?m[1]+String(parseInt(m[2],10)+1).padStart(m[2].length,'0'):(last+'-001');
}

function fclBookingRowAt(id,idx){
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:((TC[id]||{}).d||[]);
    return data[idx];
}
function fclBookingStatusOf(id,row){
    var h=(TC[id]||{}).h||[],i=h.indexOf('订舱状态');
    return (row&&i>=0)?String(row[i]||''):'';
}
/* 找到列表行对应的种子行：_listData 里的行是 expandData 拷贝出来的副本，改它不落库。
 * Job No 非空时按号找；为空则退而按委托订单号找。 */
function fclBookingSeedRow(id,row){
    var c=TC[id]||{},h=c.h||[],iNo=h.indexOf('Job No'),iEo=h.indexOf('委托订单号');
    if(!row)return null;
    var no=iNo>=0?String(row[iNo]||''):'';
    var eo=iEo>=0?String(row[iEo]||''):'';
    return (c.d||[]).find(function(r){
        if(no)return String(r[iNo]||'')===no;
        return !!eo&&String(r[iEo]||'')===eo&&!String(r[iNo]||'');
    })||null;
}
/* Job No 生成后回写到对应委托订单的「生成订舱单号」 */
function fclBackfillEntrustBookingNo(entrustNo,bookingNo){
    if(!entrustNo)return;
    var eid='fcl-sales-instruction',c=TC[eid];
    if(!c||!c.d)return;
    var h=c.h||[],iNo=h.indexOf('委托订单号'),iGen=h.indexOf('生成订舱单号');
    if(iNo<0||iGen<0)return;
    var row=c.d.find(function(r){return String(r[iNo]||'')===entrustNo;});
    if(row)setRowOverride(eid,row,iGen,bookingNo);
}
/* ===== Job 作业操作 =====
 * 原「操作执行」那一组 7 个独立页面已撤，改成主单上的一个「操作」下拉：
 * 每一项 = 针对当前勾选主单的一次环节登记。
 * 字段里带 job 的会真写回主单对应列（列表上看得到）；带 status 的会推进订舱状态；
 * 其余是本环节的登记项，原型阶段只做录入与提示，不再单独建表。 */
var FCL_JOB_OPS=[
{key:'truck',label:'拖车安排',hint:'录入拖车委托单，发给拖车行',fields:[
    {label:'拖车公司',type:'select',options:['鹏程拖车','南沙拖车','中远陆运','客户自拖']},
    {label:'提柜地点'},{label:'装柜地点'},{label:'还柜地点'},
    {label:'预约时间',type:'datetime-local'},{label:'司机电话'},
    {label:'拖车备注',type:'textarea'}]},
{key:'load',label:'进仓装柜',hint:'装柜完成后登记柜号封签，状态转「已装柜」',
    status:'已装柜',statusFrom:['已订舱','已放舱'],fields:[
    {label:'柜号',job:'柜号',required:true},{label:'封签号',job:'封签号',required:true},
    {label:'柜重',job:'柜重'},{label:'装柜地点'},{label:'装柜件数'},
    {label:'装柜时间',type:'datetime-local'},{label:'装柜备注',type:'textarea'}]},
{key:'sibl',label:'补料与提单',hint:'SI 补料、草稿件与提单确认',fields:[
    {label:'提单号'},{label:'MBL/HBL',type:'select',options:['MBL','HBL']},
    {label:'收货人'},{label:'通知人'},
    {label:'补料截止',type:'datetime-local'},
    {label:'草稿件状态',type:'select',options:['待生成','已生成','已确认']},
    {label:'补料备注',type:'textarea'}]},
{key:'split',label:'拆单并单',hint:'M 单拆 H 单 / H 单合 M 单，含费用分摊',fields:[
    {label:'操作类型',type:'select',options:['拆单(M拆H)','并单(H合M)']},
    {label:'源提单号'},{label:'目标提单号'},
    {label:'拆分方式',type:'select',options:['按柜型拆分','按柜量拆分','按费用拆分','人工指定合并']},
    {label:'费用分摊方式',type:'select',options:['按柜','按票','按重量','手工指定']},
    {label:'拆并说明',type:'textarea'}]},
{key:'customs',label:'报关申报',hint:'报关方式、报关行与放行登记',fields:[
    {label:'报关方式',type:'select',options:['买单报关','客户抬头','单独报关','合并报关']},
    {label:'报关行'},{label:'申报时间',type:'datetime-local'},{label:'放行时间',type:'datetime-local'},
    {label:'资料状态',type:'select',options:['资料待补','资料齐全']},
    {label:'报关备注',type:'textarea'}]},
{key:'track',label:'开船与轨迹',hint:'回填 ATD / ATA，状态随之推进到已离港 / 已到港',fields:[
    {label:'ATD',job:'ATD',type:'date'},{label:'ATA',job:'ATA',type:'date'},
    {label:'当前节点',type:'select',options:['待开船','已开船','海上运输','已到港']},
    {label:'异常预警',type:'select',options:['无','塞港预警','船期延误','甩柜']},
    {label:'轨迹备注',type:'textarea'}]},
{key:'docsend',label:'寄单作业',hint:'正本寄出与签收登记',fields:[
    {label:'寄单方式',type:'select',options:['顺丰','DHL','EMS','客户自取']},
    {label:'快递单号'},{label:'寄出时间',type:'datetime-local'},{label:'签收时间',type:'datetime-local'},
    {label:'寄单备注',type:'textarea'}]}
];
function fclJobOpBy(key){
    for(var i=0;i<FCL_JOB_OPS.length;i++)if(FCL_JOB_OPS[i].key===key)return FCL_JOB_OPS[i];
    return null;
}
var _fclJobOpCtx={id:'',idx:-1,key:''};
function openFclJobOp(key,id){
    id=id||'fcl-booking';
    var op=fclJobOpBy(key);
    if(!op){showToast(tr('未知操作'));return;}
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选一个主单再做')+'「'+tr(op.label)+'」');return;}
    if(idxs.length>1){showToast(tr('作业登记一次只能选一个主单'));return;}
    var row=fclBookingRowAt(id,idxs[0]);
    if(!row){showToast(tr('未找到主单数据'));return;}
    var st=fclBookingStatusOf(id,row);
    if(st==='已作废'){showToast(tr('已作废的主单不能再做作业登记'));return;}
    if(op.statusFrom&&op.statusFrom.indexOf(st)<0){
        showToast(tr(op.label)+tr(' 需要主单处于')+'「'+op.statusFrom.join('/')+'」，'+tr('当前为')+'「'+tr(st||'—')+'」');
        return;
    }
    _fclJobOpCtx={id:id,idx:idxs[0],key:key};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='54%';
    document.getElementById('crud-modal-title').textContent=tr(op.label)+' - '+fclJobFieldOf(id,row,'Job No');
    document.getElementById('crud-modal-body').innerHTML=fclJobOpBodyHtml(id,row,op);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitFclJobOp()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认登记')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function fclJobFieldOf(id,row,label){
    var h=(TC[id]||{}).h||[],i=h.indexOf(label);
    return (i>=0&&row&&row[i]!=null)?String(row[i]):'';
}
function fclJobOpBodyHtml(id,row,op){
    var g=function(label){return fclJobFieldOf(id,row,label);};
    var out='';
    out+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
         tr('主单')+' <span class="font-semibold text-text-primary">'+esc(g('Job No'))+'</span>　'+
         esc(g('船名航次')||'—')+'　'+esc(g('起运港')||'—')+' → '+esc(g('目的港')||'—')+
         '　'+tr('当前状态')+'「'+esc(tr(g('订舱状态')))+'」'+
         '<div class="mt-1 text-xs text-text-muted">'+esc(tr(op.hint||''))+'</div></div>';
    out+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">';
    op.fields.forEach(function(f){
        var val=f.job?g(f.job):'';
        var span=(f.type==='textarea')?' md:col-span-3':'';
        var req=f.required?'<span class="text-red-500 ml-1">*</span>':'';
        out+='<div data-job-field="'+esc(f.label)+'" class="'+span.trim()+'">';
        out+='<label class="text-xs text-text-secondary mb-1 block">'+esc(tr(f.label))+req+'</label>';
        if(f.type==='select'){
            out+='<select class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+
                 '<option value="">'+tr('请选择')+'</option>'+
                 (f.options||[]).map(function(o){
                     return '<option value="'+esc(o)+'"'+(val===o?' selected':'')+'>'+esc(tr(o))+'</option>';}).join('')+
                 '</select>';
        }else if(f.type==='textarea'){
            out+='<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+
                 esc(tr('请输入')+tr(f.label))+'">'+esc(val)+'</textarea>';
        }else{
            var t=(f.type==='date'||f.type==='datetime-local')?f.type:'text';
            out+='<input type="'+t+'" value="'+esc(val)+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" placeholder="'+
                 esc(tr('请输入')+tr(f.label))+'">';
        }
        out+='</div>';
    });
    out+='</div>';
    return out;
}
function fclJobOpValue(label){
    var box=document.querySelector('[data-job-field="'+label+'"]');
    if(!box)return '';
    var el=box.querySelector('select')||box.querySelector('textarea')||box.querySelector('input');
    return el?String(el.value||''):'';
}
function submitFclJobOp(){
    var ctx=_fclJobOpCtx,op=fclJobOpBy(ctx.key);
    if(!op)return;
    var id=ctx.id,row=fclBookingRowAt(id,ctx.idx);
    if(!row){showToast(tr('未找到主单数据'));return;}
    var h=(TC[id]||{}).h||[];
    /* 必填校验 */
    var missing=[];
    op.fields.forEach(function(f){if(f.required&&!fclJobOpValue(f.label))missing.push(tr(f.label));});
    if(missing.length){showToast(tr('请填写')+'：'+missing.join('、'));return;}
    /* 能落到主单字段上的，真写回列表 */
    var written=[];
    op.fields.forEach(function(f){
        if(!f.job)return;
        var v=fclJobOpValue(f.label);
        if(!v)return;
        var i=h.indexOf(f.job);
        if(i>=0){setRowOverride(id,row,i,v);written.push(tr(f.job));}
    });
    /* 状态推进 */
    var st=fclBookingStatusOf(id,row),newSt='';
    if(op.status)newSt=op.status;
    if(op.key==='track'){
        /* 到港优先于离港：两个都填了说明这票已经到了 */
        if(fclJobOpValue('ATA'))newSt='已到港';
        else if(fclJobOpValue('ATD'))newSt='已离港';
    }
    if(newSt&&newSt!==st){
        var i=h.indexOf('订舱状态');
        if(i>=0)setRowOverride(id,row,i,newSt);
    }else{newSt='';}
    closeCrudModal();
    fclBookingRefreshList(id);
    var msg=tr(op.label)+tr('已登记');
    if(written.length)msg+='，'+tr('已更新')+' '+written.join('、');
    if(newSt)msg+='，'+tr('状态转为')+'「'+tr(newSt)+'」';
    showToast(msg);
    _fclJobOpCtx={id:'',idx:-1,key:''};
}

/* ===== 关联委托 =====
 * 两种用法合成一个弹窗：
 *   a) 勾 1 个主单 + 选多个委托单  -> 一个主单挂多张委托单
 *   b) 勾多个主单 + 选 1 个委托单  -> 多个主单合并关联到同一张委托单
 * 实现上就是「所选主单的委托订单号 = 所选委托单号的集合」，两种用法自然都覆盖到；
 * 同时把主单的 Job No 回写进每张委托单的「生成订舱单号」，两边都能查到对方。 */
var _fclLinkCtx={id:'',rows:[]};
/* 只列「已审核」的委托单 —— 待审核的还可能被驳回或改单，驳回/取消的更不该再挂主单。 */
function fclEntrustRowsBy(filter){
    var c=TC['fcl-sales-instruction'];
    if(!c||!c.d)return [];
    var h=c.h||[],iNo=h.indexOf('委托订单号'),iCu=h.indexOf('客户名称'),iCar=h.indexOf('船司'),
        iSt=h.indexOf('状态'),iGen=h.indexOf('生成订舱单号'),
        iTime=h.indexOf('委托时间'),iSales=h.indexOf('业务员'),
        iType=h.indexOf('委托类型'),iPol=h.indexOf('起运港'),iPod=h.indexOf('目的港'),
        iBox=h.indexOf('柜型柜量'),iEtd=h.indexOf('预计开船日');
    if(iNo<0)return [];
    var g=function(r,i){return i>=0?String(r[i]||''):'';};
    return c.d.filter(function(r){return r[iNo]&&(!filter||filter(r,h));})
        .map(function(r){return {no:r[iNo],cust:g(r,iCu),carrier:g(r,iCar),status:g(r,iSt),
            linked:g(r,iGen),time:g(r,iTime),sales:g(r,iSales),type:g(r,iType),
            pol:g(r,iPol),pod:g(r,iPod),box:g(r,iBox),etd:g(r,iEtd)};});
}
function fclEntrustPickRows(){
    return fclEntrustRowsBy(function(r,h){
        var i=h.indexOf('状态');
        return i<0||r[i]==='已审核';
    });
}
function openFclBookingLinkEntrust(id){
    id=id||'fcl-booking';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要关联委托的主单'));return;}
    var c=TC[id]||{},h=c.h||[],iNo=h.indexOf('Job No');
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var rows=[];
    idxs.forEach(function(i){
        var row=data[i];
        if(row&&iNo>=0&&row[iNo])rows.push({idx:i,no:row[iNo]});
    });
    if(!rows.length){showToast(tr('所选主单没有 Job No，无法关联'));return;}
    if(!fclEntrustPickRows().length){showToast(tr('没有「已审核」的委托订单可关联'));return;}
    _fclLinkCtx={id:id,rows:rows};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='58%';
    document.getElementById('crud-modal-title').textContent=tr('关联委托');
    document.getElementById('crud-modal-body').innerHTML=fclLinkEntrustBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmFclBookingLinkEntrust()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认关联')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function fclLinkEntrustBodyHtml(){
    var rows=_fclLinkCtx.rows||[];
    var hint=rows.length>1
        ? tr('已勾选')+' '+rows.length+' '+tr('个主单')+'，'+tr('选中的委托单会同时关联到这几个主单（合并关联）')
        : tr('已勾选主单')+' '+esc(rows[0].no)+'，'+tr('可以勾选多张委托单一起关联');
    var h='';
    h+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+hint+'</div>';
    h+='<div class="mb-2 text-xs text-text-muted">'+esc(rows.map(function(r){return r.no;}).join('、'))+'</div>';
    h+='<div class="mb-2 text-xs text-text-muted">'+tr('只列出「已审核」的委托订单')+'</div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-hidden">';
    h+='<table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       '<th class="w-10 px-3 py-2"></th>'+
       ['委托订单号','委托时间','客户名称','业务员','船司','状态','已关联主单'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    fclEntrustPickRows().forEach(function(r,i){
        h+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2"><input type="checkbox" class="fcl-link-pick rounded border-surface-300 text-primary-600" value="'+esc(r.no)+'"></td>'+
           '<td class="px-3 py-2 font-medium text-text-primary">'+esc(r.no)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.time||'—')+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(r.cust||'—')+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(r.sales||'—')+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(r.carrier||'—')+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(tr(r.status||'—'))+'</td>'+
           '<td class="px-3 py-2 text-text-muted">'+esc(r.linked||'—')+'</td></tr>';
    });
    h+='</tbody></table></div>';
    return h;
}

/* ===== 查看委托（行内操作列）=====
 * 主单的委托订单号可能是「A；B」这样的多张单（合并关联的结果），
 * 这里把每张单摊开成一张卡片，找不到的单号也如实标出来。 */
function openFclBookingViewEntrust(id,idx){
    id=id||'fcl-booking';
    var c=TC[id]||{},h=c.h||[];
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var row=data[idx];
    if(!row){showToast(tr('未找到主单数据'));return;}
    var g=function(label){var i=h.indexOf(label);return (i>=0&&row[i]!=null)?String(row[i]):'';};
    var job=g('Job No');
    var nos=String(g('委托订单号')||'').split(/[；;，,]/).map(function(s){return s.trim();}).filter(Boolean);
    var all=fclEntrustRowsBy(null);
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='78%';   /* 明细改列表后有 11 列，56% 会挤成一团 */
    document.getElementById('crud-modal-title').textContent=tr('查看委托')+' - '+job;
    var b='';
    if(!nos.length){
        b='<div class="px-4 py-10 text-center text-sm text-text-muted">'+
          tr('该主单还没有关联委托订单')+'<div class="mt-1 text-xs">'+tr('可用工具栏的「关联委托」挂上')+'</div></div>';
    }else{
        b+='<div class="mb-3 text-sm text-text-secondary">'+tr('共关联')+' <span class="font-semibold text-text-primary">'+nos.length+'</span> '+tr('张委托订单')+'</div>';
        /* 明细用列表展示：一张主单常常挂多张委托单，卡片式一张一屏太长，列表能一眼横向比对 */
        var cols=['委托订单号','委托类型','委托时间','客户名称','业务员','船司','柜型柜量','起运港','目的港','预计开船日','状态'];
        b+='<div class="border border-surface-200 rounded-lg overflow-x-auto">';
        b+='<table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
           cols.map(function(t){return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
           '</tr></thead><tbody>';
        nos.forEach(function(no){
            var e=all.find(function(x){return x.no===no;});
            if(!e){
                b+='<tr class="border-t border-surface-100 bg-amber-50" data-entrust-row="'+esc(no)+'">'+
                   '<td class="px-3 py-2 font-medium text-amber-700 whitespace-nowrap">'+esc(no)+'</td>'+
                   '<td class="px-3 py-2 text-amber-700" colspan="'+(cols.length-1)+'">'+tr('未在委托订单管理中找到')+'</td></tr>';
                return;
            }
            var vals=[e.no,e.type,e.time,e.cust,e.sales,e.carrier,e.box,e.pol,e.pod,e.etd,tr(e.status)];
            b+='<tr class="border-t border-surface-100" data-entrust-row="'+esc(e.no)+'">';
            vals.forEach(function(v,i){
                b+='<td class="px-3 py-2 whitespace-nowrap '+(i===0?'font-medium text-text-primary':'text-text-secondary')+'">'+
                   esc(v||'—')+'</td>';
            });
            b+='</tr>';
        });
        b+='</tbody></table></div>';
    }
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function confirmFclBookingLinkEntrust(){
    var id=_fclLinkCtx.id,rows=_fclLinkCtx.rows||[];
    /* NodeList 没有 map，只能 forEach 收集 */
    var picked=[];
    (document.getElementById('crud-modal-body')||document.body)
        .querySelectorAll('.fcl-link-pick:checked').forEach(function(el){picked.push(el.value);});
    if(!picked.length){showToast(tr('请至少勾选一张委托订单'));return;}
    var c=TC[id]||{},h=c.h||[],iEo=h.indexOf('委托订单号');
    if(iEo<0){showToast(tr('缺少委托订单号字段'));return;}
    var joined=picked.join('；');
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    rows.forEach(function(r){
        var row=data[r.idx];
        if(row)setRowOverride(id,row,iEo,joined);
    });
    /* 反向回写：每张委托单的「生成订舱单号」记上这次关联的全部主单 */
    var jobs=rows.map(function(r){return r.no;}).join('；');
    picked.forEach(function(no){fclBackfillEntrustBookingNo(no,jobs);});
    closeCrudModal();
    fclBookingRefreshList(id);
    showToast(tr('已关联')+' '+rows.length+' '+tr('个主单')+' ↔ '+picked.length+' '+tr('张委托单'));
}

/* ===== 放舱（已订舱 -> 已放舱）=====
 * SOP-FCL-05：船司放舱邮件到了之后，按「船公司 × 目的港」匹配放仓模板，
 * 自动带出发给客户的放舱件要素，人工核对后确认放舱。
 * 这里一次只处理一个主单 —— 弹窗要把该单的要素摊出来给人核对，多选就没法核对了。 */
var _fclReleaseCtx={id:'',idx:-1};
/* 按 船公司 × 目的港 匹配放仓模板，取其关务联系人 */
function fclReleaseTplContact(carrier,pod){
    var c=TC['fcl-release-tpl'];
    if(!c||!c.d)return '';
    var h=c.h||[],iCar=h.indexOf('船公司'),iPod=h.indexOf('目的港'),
        iCt=h.indexOf('关务联系人'),iSt=h.indexOf('启用状态');
    if(iCt<0)return '';
    var row=c.d.find(function(r){
        return (iCar<0||r[iCar]===carrier)&&(iPod<0||r[iPod]===pod)&&(iSt<0||r[iSt]!=='停用');});
    return row?(row[iCt]||''):'';
}
function openFclBookingRelease(id){
    id=id||'fcl-booking';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要放舱的主单'));return;}
    if(idxs.length>1){showToast(tr('放舱需要逐票核对要素，一次只能选一个主单'));return;}
    var idx=idxs[0];
    var row=fclBookingRowAt(id,idx);
    if(!row){showToast(tr('未找到主单数据'));return;}
    var st=fclBookingStatusOf(id,row);
    if(st!=='已订舱'){showToast(tr('只有「已订舱」的主单可以放舱，当前为')+'「'+tr(st||'—')+'」');return;}
    _fclReleaseCtx={id:id,idx:idx};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='52%';
    document.getElementById('crud-modal-title').textContent=tr('放舱');
    document.getElementById('crud-modal-body').innerHTML=fclReleaseBodyHtml(id,row);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmFclBookingRelease()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认放舱')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function fclReleaseBodyHtml(id,row){
    var h=(TC[id]||{}).h||[];
    var g=function(label){var i=h.indexOf(label);return (i>=0&&row[i]!=null)?String(row[i]):'';};
    var contact=fclReleaseTplContact(g('船司'),g('目的港'));
    var items=[['船名航次',g('船名航次')],['起运港',g('起运港')],['目的港',g('目的港')],
               ['ETD',g('ETD')],['协议号',g('协议号')],['关务联系人',contact]];
    var out='';
    out+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
         tr('主单')+' <span class="font-semibold text-text-primary">'+esc(g('Job No'))+'</span>　'+
         tr('确认后状态转为「已放舱」')+'</div>';
    out+='<div class="text-sm font-semibold text-text-primary mb-2 pb-1.5 border-b border-surface-200">'+tr('自动填充要素')+'</div>';
    out+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3 mb-4">';
    items.forEach(function(p){
        out+='<div data-release-item="'+esc(p[0])+'"><div class="text-xs text-text-secondary mb-1">'+tr(p[0])+'</div>'+
             '<div class="h-9 px-3 flex items-center text-sm rounded-lg bg-surface-100 text-text-primary border border-surface-200">'+
             esc(p[1]||'—')+'</div></div>';
    });
    out+='</div>';
    if(!contact)out+='<div class="mb-3 text-xs text-amber-600">'+tr('没有匹配到「船公司 × 目的港」的放仓模板，关务联系人为空，可到放仓模板补充')+'</div>';
    out+='<div class="text-sm font-semibold text-text-primary mb-2 pb-1.5 border-b border-surface-200">'+tr('放舱附件')+'</div>';
    out+=crudAttachmentFieldHtml('放舱附件','');
    return out;
}
function confirmFclBookingRelease(){
    var id=_fclReleaseCtx.id,idx=_fclReleaseCtx.idx;
    var row=fclBookingRowAt(id,idx);
    if(!row){showToast(tr('未找到主单数据'));return;}
    var h=(TC[id]||{}).h||[];
    var files=crudAttachmentNames();
    if(!files){showToast(tr('请先上传放舱附件'));return;}
    var set=function(label,val){var i=h.indexOf(label);if(i>=0)setRowOverride(id,row,i,val);};
    set('放舱附件',files);
    set('关务联系人',fclReleaseTplContact(
        (function(){var i=h.indexOf('船司');return i>=0?row[i]:'';})(),
        (function(){var i=h.indexOf('目的港');return i>=0?row[i]:'';})()));
    set('订舱状态','已放舱');
    closeCrudModal();
    fclBookingRefreshList(id);
    var iNo=h.indexOf('Job No');
    showToast(tr('主单')+' '+(iNo>=0?row[iNo]:'')+' '+tr('已放舱'));
}

function fclBookingRefreshList(id){
    var mc=document.getElementById('main-content');
    var pg=(typeof _listPage!=='undefined'&&_listPage[id])?_listPage[id]:1;
    var sf=(typeof _statusFilterVal!=='undefined')?(_statusFilterVal||''):'';
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,pg,sf);
}

/* ===== 作废（待订舱/已订舱/已放舱 → 已作废，支持多选）=====
 * 已经作废过的再勾选也不会重复处理，会被算进「将跳过」。 */
function openFclBookingCancel(id){
    id=id||'fcl-booking';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要作废的主单'));return;}
    var h=(TC[id]||{}).h||[],iNo=h.indexOf('Job No');
    var eligible=[],blocked=[];
    idxs.forEach(function(i){
        var row=fclBookingRowAt(id,i);
        if(!row)return;
        if(fclBookingStatusOf(id,row)!=='已作废')eligible.push(i);
        else blocked.push(iNo>=0?row[iNo]:'');
    });
    if(!eligible.length){showToast(tr('所选主单已经是「已作废」，无需重复操作'));return;}
    var msg=tr('已勾选')+' '+idxs.length+' '+tr('条数据')+'，'+tr('其中')+' '+eligible.length+' '+tr('条可作废');
    if(blocked.length)msg+='，'+blocked.length+' '+tr('条已作废将跳过');
    msg+='。'+tr('作废后该票需重新建单，是否确认？');
    openConfirmTip(msg,function(){confirmFclBookingCancel(id,eligible);});
}
function confirmFclBookingCancel(id,idxs){
    var h=(TC[id]||{}).h||[],i=h.indexOf('订舱状态');
    var n=0;
    idxs.forEach(function(k){
        var row=fclBookingRowAt(id,k);
        if(row&&i>=0){setRowOverride(id,row,i,'已作废');n++;}
    });
    fclBookingRefreshList(id);
    showToast(tr('已作废')+' '+n+' '+tr('条'));
}

/* ===== 委托订单审核 =====
 * 审核要对照「应收价 / 成本价 / 毛利 / 毛利率」下判断，所以不用通用审核弹窗，单写一个。
 * 预录单（预定仓性质，只是先占个舱位、还没有报价和成本）不需要审核，直接转主单。 */
var FCL_LOW_MARGIN_RATE=5;   /* 毛利率低于这个百分比给出提醒，只提示不拦截 */
/* 'USD 4,500' -> 4500；取不出数字返回 null，好跟「金额就是 0」区分开 */
function fclParseMoney(v){
    var m=String(v==null?'':v).replace(/,/g,'').match(/-?\d+(\.\d+)?/);
    return m?parseFloat(m[0]):null;
}
function fclEntrustPriceInfo(ec,row){
    var h=(ec&&ec.h)||[];
    var g=function(label){var i=h.indexOf(label);return (i>=0&&row&&row[i]!=null)?String(row[i]):'';};
    var sell=g('销售运费'),cost=g('预估成本'),profit=g('预估毛利');
    var s=fclParseMoney(sell),c=fclParseMoney(cost),p=fclParseMoney(profit);
    var rate=(s&&s!==0&&p!==null)?(p/s*100):null;
    /* 对账：应收 - 成本 应该等于毛利，对不上说明单据本身有问题，审核时必须看见 */
    var calc=(s!==null&&c!==null)?(s-c):null;
    var mismatch=(calc!==null&&p!==null&&Math.abs(calc-p)>1);
    return {sell:sell,cost:cost,profit:profit,sellNum:s,costNum:c,profitNum:p,
            rate:rate,calc:calc,mismatch:mismatch,
            low:(rate!==null&&rate<FCL_LOW_MARGIN_RATE),
            empty:(s===null&&c===null&&p===null)};
}
var _entrustAuditIdx=-1;
function openEntrustAuditModal(id,idx){
    id=id||'fcl-sales-instruction';
    if(idx===undefined||idx<0)idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    var c=TC[id]||{},h=c.h||[];
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var row=data[idx];
    if(!row){showToast(tr('未找到委托订单'));return;}
    var g=function(label){var i=h.indexOf(label);return (i>=0&&row[i]!=null)?String(row[i]):'';};
    var st=g('状态');
    if(st!=='待审核'){showToast(tr('只有「待审核」的委托单可以审核，当前为')+'「'+tr(st||'—')+'」');return;}
    _entrustAuditIdx=idx;
    var isPrebook=g('委托类型')==='预录单';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='54%';
    document.getElementById('crud-modal-title').textContent=tr('审核数据')+' - '+g('委托订单号');
    document.getElementById('crud-modal-body').innerHTML=fclEntrustAuditBodyHtml(c,row,isPrebook);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        (isPrebook
          ? '<button onclick="submitEntrustPrebook(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('直接转主单')+'</button>'
          : '<button onclick="submitEntrustAudit(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交审核')+'</button>');
    document.getElementById('crud-modal').classList.add('show');
}
function fclEntrustAuditBodyHtml(c,row,isPrebook){
    var h=c.h||[];
    var g=function(label){var i=h.indexOf(label);return (i>=0&&row[i]!=null)?String(row[i]):'';};
    var out='';
    /* 单据抬头：审核时总要先看清是谁的什么货 */
    var head=[['委托订单号',g('委托订单号')],['委托类型',g('委托类型')],['客户名称',g('客户名称')],
              ['业务员',g('业务员')],['船司',g('船司')],['柜型柜量',g('柜型柜量')],
              ['起运港',g('起运港')],['目的港',g('目的港')],['预计开船日',g('预计开船日')]];
    out+='<div class="text-sm font-semibold text-text-primary mb-2 pb-1.5 border-b border-surface-200">'+tr('委托信息')+'</div>';
    out+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2.5 mb-4">';
    head.forEach(function(p){
        out+='<div><div class="text-xs text-text-secondary mb-0.5">'+tr(p[0])+'</div>'+
             '<div class="text-sm text-text-primary">'+esc(p[1]||'—')+'</div></div>';
    });
    out+='</div>';

    if(isPrebook){
        out+='<div class="px-3 py-3 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
             '<div class="font-semibold text-text-primary mb-1">'+tr('预录单（预定仓）无需审核')+'</div>'+
             tr('预定仓只是先占船司舱位，此时还没有报价与成本，没有可对照的毛利，因此不走审核。')+
             '<br>'+tr('点「直接转主单」即可生成待订舱主单；等客户下实单、价格谈定后再走费用流程。')+
             '</div>';
        return out;
    }

    var p=fclEntrustPriceInfo(c,row);
    var cell=function(label,val,cls){
        return '<div data-audit-price="'+esc(label)+'"><div class="text-xs text-text-secondary mb-0.5">'+tr(label)+'</div>'+
               '<div class="text-base font-semibold '+(cls||'text-text-primary')+'">'+esc(val)+'</div></div>';
    };
    out+='<div class="text-sm font-semibold text-text-primary mb-2 pb-1.5 border-b border-surface-200">'+tr('价格对照')+'</div>';
    out+='<div class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 mb-2 px-3 py-3 rounded-lg bg-surface-50 border border-surface-200">';
    out+=cell('应收价',p.sell||'—');
    out+=cell('成本价',p.cost||'—');
    out+=cell('毛利',p.profit||'—');
    out+=cell('毛利率',p.rate===null?'—':(p.rate.toFixed(2)+'%'),
              p.low?'text-amber-600':(p.rate===null?'text-text-primary':'text-success-700'));
    out+='</div>';
    if(p.empty){
        out+='<div class="mb-3 text-xs text-amber-600">'+tr('该委托单还没有填报价与成本，无法对照毛利，请先补齐再审核')+'</div>';
    }else{
        if(p.mismatch)out+='<div class="mb-1.5 text-xs text-red-600">'+
            tr('应收价 - 成本价 =')+' '+esc(String(p.calc))+'，'+tr('与填报的毛利对不上，请先核实')+'</div>';
        if(p.low)out+='<div class="mb-1.5 text-xs text-amber-600">'+
            tr('毛利率低于')+' '+FCL_LOW_MARGIN_RATE+'%，'+tr('请谨慎审核')+'</div>';
        if(!p.mismatch&&!p.low)out+='<div class="mb-1.5 text-xs text-success-700">'+tr('价格与毛利勾稽一致')+'</div>';
    }
    out+='<div class="text-sm font-semibold text-text-primary mb-2 mt-3 pb-1.5 border-b border-surface-200">'+tr('审核意见')+'</div>';
    out+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">';
    out+='<div data-field-label="审核结果"><label class="text-xs text-text-secondary mb-1 block">'+tr('审核结果')+
         '<span class="text-red-500 ml-1">*</span></label>'+
         '<select class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+
         '<option value="">'+tr('请选择')+'</option>'+
         ['通过','驳回','退回补充'].map(function(o){return '<option value="'+esc(o)+'">'+tr(o)+'</option>';}).join('')+
         '</select></div>';
    out+='<div data-field-label="审核人"><label class="text-xs text-text-secondary mb-1 block">'+tr('审核人')+'</label>'+
         '<input type="text" readonly value="'+esc((typeof getCurrentUserName==='function')?getCurrentUserName():'admin')+
         '" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed"></div>';
    out+='<div data-field-label="审核意见" class="md:col-span-3"><label class="text-xs text-text-secondary mb-1 block">'+tr('审核意见')+'</label>'+
         '<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+
         tr('请填写审核意见')+'"></textarea></div>';
    out+='</div>';
    return out;
}
/* 预录单直接转主单：不需要审核结果，落「已审核」并生成待订舱主单 */
function submitEntrustPrebook(id){
    id=id||'fcl-sales-instruction';
    var c=TC[id]||{},h=c.h||[];
    var row=fclBookingRowAt(id,_entrustAuditIdx>=0?_entrustAuditIdx:getSelectedRowIndex());
    if(!row){showToast(tr('请先勾选一条委托订单'));return false;}
    var set=function(label,val){var i=h.indexOf(label);if(i>=0)setRowOverride(id,row,i,val);};
    var get=function(label){var i=h.indexOf(label);return i>=0?(row[i]||''):'';};
    var now=(typeof receiptNowStr==='function')?receiptNowStr():'';
    var who=(typeof getCurrentUserName==='function')?getCurrentUserName():'admin';
    set('状态','已审核');set('审核人',who);set('审核时间',now);
    var jobNo=createBookingFromEntrust(c,row);
    fclBackfillEntrustBookingNo(get('委托订单号'),jobNo);
    _entrustAuditIdx=-1;
    closeCrudModal();
    fclBookingRefreshList(id);
    showToast(tr('预录单无需审核，已直接转主单')+' '+jobNo);
    return true;
}

/* ===== 重新提交审核（已驳回 -> 待审核，支持多选）===== */
function openEntrustResubmit(id){
    id=id||'fcl-sales-instruction';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要重新提交的委托单'));return;}
    var c=TC[id]||{},h=c.h||[],iNo=h.indexOf('委托订单号'),iSt=h.indexOf('状态');
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var eligible=[],blocked=[];
    idxs.forEach(function(i){
        var row=data[i];
        if(!row)return;
        if(iSt>=0&&row[iSt]==='已驳回')eligible.push(i);
        else blocked.push(iNo>=0?row[iNo]:'');
    });
    if(!eligible.length){showToast(tr('只有「已驳回」的委托单可以重新提交审核'));return;}
    var msg=tr('已勾选')+' '+idxs.length+' '+tr('条数据')+'，'+tr('其中')+' '+eligible.length+' '+tr('条可重新提交');
    if(blocked.length)msg+='，'+blocked.length+' '+tr('条非「已驳回」将跳过');
    msg+='。'+tr('重新提交后状态回到「待审核」，原审核人与审核时间会清空，是否确认？');
    openConfirmTip(msg,function(){confirmEntrustResubmit(id,eligible);});
}
function confirmEntrustResubmit(id,idxs){
    var c=TC[id]||{},h=c.h||[];
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var now=(typeof receiptNowStr==='function')?receiptNowStr():'';
    var n=0;
    idxs.forEach(function(k){
        var row=data[k];
        if(!row)return;
        var set=function(label,val){var i=h.indexOf(label);if(i>=0)setRowOverride(id,row,i,val);};
        set('状态','待审核');set('审核人','');set('审核时间','');set('提交时间',now);
        n++;
    });
    fclBookingRefreshList(id);
    showToast(tr('已重新提交审核')+' '+n+' '+tr('条'));
}

/* ===== 委托订单审核通过 → 自动生成待订舱的订舱单 ===== */
function fclActionFieldValue(label){
    var box=document.querySelector('[data-field-label="'+label+'"]');
    if(!box)return '';
    var el=box.querySelector('select,textarea,input');
    return el?el.value:'';
}
function submitEntrustAudit(id){
    id=id||'fcl-sales-instruction';
    var result=fclActionFieldValue('审核结果');
    if(!result){showToast(tr('请选择审核结果'));return false;}
    /* 专用审核弹窗打开时记下的行；没有就退回按勾选取（兼容通用审核弹窗） */
    var idx=_entrustAuditIdx>=0?_entrustAuditIdx:getSelectedRowIndex();
    var row=fclBookingRowAt(id,idx);
    if(!row){showToast(tr('请先勾选一条委托订单'));return false;}
    var c=TC[id]||{},h=c.h||[];
    var set=function(label,val){var i=h.indexOf(label);if(i>=0)setRowOverride(id,row,i,val);};
    var get=function(label){var i=h.indexOf(label);return i>=0?(row[i]||''):'';};
    var now=(typeof receiptNowStr==='function')?receiptNowStr():'';
    var who=(typeof getCurrentUserName==='function')?getCurrentUserName():'admin';
    if(result==='通过'){
        /* Job No 在这里就编号：改版后「订舱」按钮变成普通「新增」，没有别的落点再补号了，
         * 而 Job No 是主单的主键，待订舱的单子也必须有号。编完回写委托订单的「生成订舱单号」。 */
        set('状态','已审核');set('审核人',who);set('审核时间',now);
        var jobNo=createBookingFromEntrust(c,row);
        fclBackfillEntrustBookingNo(get('委托订单号'),jobNo);
        closeCrudModal();
        fclBookingRefreshList(id);
        showToast(tr('审核通过，已生成待订舱主单')+' '+jobNo);
    }else if(result==='驳回'){
        set('状态','已驳回');set('审核人',who);set('审核时间',now);
        closeCrudModal();
        fclBookingRefreshList(id);
        showToast(tr('已驳回'));
    }else{
        closeCrudModal();
        showToast(tr('已退回补充，委托订单仍为「待审核」'));
    }
    _entrustAuditIdx=-1;
    return true;
}
/* 用委托订单的信息生成一条「待订舱」的主单，返回新生成的 Job No。
 * 注意写 bc.d 而不是 _listData —— 后者每次渲染都被 expandData 覆盖，写进去会丢。 */
function createBookingFromEntrust(ec,erow){
    var bid='fcl-booking',bc=TC[bid];
    if(!bc)return '';
    var eg=function(label){var i=(ec.h||[]).indexOf(label);return i>=0?(erow[i]||''):'';};
    var seedWidth=(bc.d&&bc.d.length)?bc.d[0].length:(bc.h||[]).length-1;
    var jobNo=fclNextBookingNo(bid);
    var map={'Job No':jobNo,'委托订单号':eg('委托订单号'),'船司':eg('船司'),'起运港':eg('起运港'),'目的港':eg('目的港'),
        '柜型柜量':eg('柜型柜量'),'ETD':eg('预计开船日'),'是否危险品':'否',
        '订舱日期':(typeof receiptNowStr==='function')?receiptNowStr().slice(0,10):'',
        '订舱人':(typeof getCurrentUserName==='function')?getCurrentUserName():'admin',
        '订舱备注':tr('由委托订单审核通过自动生成'),'订舱状态':'待订舱'};
    bc.d.push((bc.h||[]).slice(0,seedWidth).map(function(name){return map[name]!==undefined?map[name]:'';}));
    if(typeof _listData!=='undefined')delete _listData[bid];   /* 下次渲染重新展开，带上新主单 */
    return jobNo;
}

function fclBookingAfterModalRender(id,mode,rowData){
    /* 复制主单：只重新编号，其余字段原样保留。
     * 委托订单号已不在弹窗里（改版后只在列表展示），复制出来的新单不继承它。 */
    if(_fclBookingCopyPending){
        _fclBookingCopyPending=false;
        var t=document.getElementById('crud-modal-title');
        if(t)t.textContent=tr('复制主单');
        crudSetField('Job No',fclNextBookingNo(id));
        var f=document.getElementById('crud-modal-footer');
        if(f)f.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
                         '<button onclick="closeCrudModal();showToast(\''+tr('复制成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提交')+'</button>';
    }
    fclBookingToggleDangerous();
}




/* 10.4 委托订单管理（原「销售指示」）
 * 业务口径：业务员录入的销售指示即客户委托单；预录单与实单都是委托，仅「委托类型」不同。
 * 因此不再用「草稿」状态承载预录单，改为独立的委托类型字段。 */
addPrototypeTable('fcl-sales-instruction','委托订单管理',
    '委托订单号|委托类型|来源|客户名称|托书编号|托书附件|船司|柜型柜量|起运港|目的港|预计开船日|销售运费|预估成本|预估毛利|业务员|委托时间|提交时间|审核人|审核时间|生成订舱单号|状态|操作',
    ['待审核','已审核','已驳回','已取消'],[
    ['FEO-20260613001','实单','业务员录入','深圳市华运达国际货运','BOOK-001','托书_华运达_0613.pdf','MAERSK','40HQ×1','深圳盐田','拉各斯','2026-06-20','USD 4,500','USD 4,120','USD 380','张三','2026-06-13 09:40','2026-06-13 10:30','','','','待审核'],
    ['FEO-20260612002','实单','询盘转化','广州远洋进出口贸易','BOOK-002','托书_远洋_0612.pdf;装箱单_0612.xlsx','COSCO','20GP×2','广州南沙','达喀尔','2026-06-22','USD 5,600','USD 5,180','USD 420','李四','2026-06-12 14:20','2026-06-12 16:00','商务主管','2026-06-12 17:10','FBK-20260612002','已审核'],
    ['FEO-20260611003','实单','OMS客户自助下单','东莞市鑫海物流','BOOK-003','托书_鑫海_0611.pdf','CMA CGM','40HQ×1','上海洋山','阿比让','2026-06-25','USD 6,200','USD 5,600','USD 600','王五','2026-06-11 08:50','2026-06-11 09:20','商务主管','2026-06-11 11:00','FBK-20260611003','已审核'],
    ['FEO-20260613004','预录单','移动端录入','','','','MSC','40HQ×1','深圳盐田','特马','2026-07-02','','','','赵六','2026-06-13 15:10','2026-06-13 15:40','','','','待审核'],
    ['FEO-20260610005','预录单','业务员录入','上海锦程国际贸易','','','MAERSK','40HQ×2','深圳盐田','拉各斯','2026-07-05','','','','张三','2026-06-10 08:30','2026-06-10 09:15','商务主管','2026-06-10 10:20','','已审核'],
    ['FEO-20260608006','实单','业务员录入','广州远洋进出口贸易','BOOK-006','托书_远洋_0608.pdf','ONE','20GP×1','广州南沙','洛美','2026-06-18','USD 2,900','USD 2,760','USD 140','李四','2026-06-08 10:10','2026-06-08 11:00','商务主管','2026-06-08 14:30','','已取消']
],[
    {label:'委托订单号',type:'text'},
    {label:'委托类型',type:'select',options:['预录单','实单']},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'托书编号',type:'text'},
    {label:'船司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'起运港',type:'select',options:FCL_POL_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'预计开船日',type:'date'},
    {label:'状态',type:'select',options:['待审核','已审核','已驳回','已取消']}
]);
/* 委托订单号含「单号」→ 引擎按 isCode 渲染为只读自动生成；来源由系统按录入渠道自动赋值，不在弹窗显示 */
TC['fcl-sales-instruction'].modalExcludedFields=['来源','预估毛利','委托时间','提交时间','审核人','审核时间','生成订舱单号','状态'];
/* 控件类型覆写：托书编号是客户给的号（不能按 isCode 变成只读自动生成）；预计开船日走日期控件 */
TC['fcl-sales-instruction'].modalFieldTypes={'托书编号':'text','预计开船日':'date','托书附件':'attachment'};
TC['fcl-sales-instruction'].fieldOptions={
    '委托类型':['预录单','实单'],
    '来源':['业务员录入','询盘转化','OMS客户自助下单','移动端录入'],
    '客户名称':FCL_CUSTOMER_OPTIONS,'船司':FCL_CARRIER_OPTIONS,
    '起运港':FCL_POL_OPTIONS,'目的港':FCL_POD_OPTIONS,
    '柜型柜量':['20GP×1','20GP×2','40GP×1','40HQ×1','40HQ×2'],'业务员':FCL_SALES_OPTIONS
};
/* 必填覆写：客户名称与托书编号（预录单阶段常常还没有）改非必填；起运港必填 */
TC['fcl-sales-instruction'].requiredOverrides={'客户名称':false,'托书编号':false,'起运港':true};

/* 业务询盘单 —— 重定位为商机台账，增加失单原因（SOP 4.3 步骤 6）*/
addPrototypeTable('fcl-inquiry-order','业务询盘单',
    '询盘单号|客户名称|客户类型|柜型|始发港|目的港|币别|预计开船日|询盘价格|报价渠道|业务员|转化委托订单号|失单原因|备注|状态|操作',
    ['待报价','已报价','已转化','已失单','已关闭'],[
    ['FIQ-20260613001','深圳市华运达国际货运','直客','40HQ','深圳盐田','拉各斯','USD','2026-06-20','4500','微信','张三','','','客户要求本周内反馈西非线报价','已报价'],
    ['FIQ-20260612002','广州远洋进出口贸易','国内同行','20GP','广州南沙','达喀尔','USD','2026-06-22','2680','QQ','李四','FEO-20260612002','','已转化委托订单','已转化'],
    ['FIQ-20260610003','上海锦程国际贸易','海外代理','40HQ','上海洋山','阿比让','USD','2026-06-28','4720','邮件','王五','','价格高于同行约 5%','客户选择了其他货代','已失单']
],[
    {label:'询盘单号',type:'text'},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'客户类型',type:'select',options:['国内同行','直客','海外代理']},
    {label:'柜型',type:'select',options:FCL_CONTAINER_OPTIONS},
    {label:'始发港',type:'select',options:FCL_POL_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'状态',type:'select',options:['待报价','已报价','已转化','已失单','已关闭']}
]);
TC['fcl-inquiry-order'].modalExcludedFields=['转化委托订单号','状态'];
TC['fcl-inquiry-order'].fieldOptions={
    '客户名称':FCL_CUSTOMER_OPTIONS,'客户类型':['国内同行','直客','海外代理'],
    '柜型':FCL_CONTAINER_OPTIONS,'始发港':FCL_POL_OPTIONS,'目的港':FCL_POD_OPTIONS,
    '币别':FCL_CURRENCY_OPTIONS,'报价渠道':['邮件','微信','QQ','电话'],'业务员':FCL_SALES_OPTIONS
};


/* ==========================================================================
 * 七、整柜业务操作导航（首页）—— SOP 全流程速查 + 功能地图
 * 依据《好利航物流-整柜操作SOP V1.0》15 个环节 + 第19/21/22章
 * ========================================================================== */

TC['fcl-guide']={t:'整柜操作导航',pageMode:'fclGuide',h:[],q:[],s:[],d:[]};

/* 三个阶段（对应 SOP 目录的「销售前端 / 订舱与操作 / 财务与结算」）*/
var FCL_SOP_STAGES=[
    {key:'sales',label:'销售前端',desc:'从客户询价到委托订单审核通过',color:'blue',range:[0,3]},
    {key:'ops',label:'订舱与操作',desc:'从订舱到提单寄出的全部执行环节',color:'green',range:[3,11]},
    {key:'fin',label:'财务与结算',desc:'账单、付款、应收放单与提成',color:'purple',range:[11,15]}
];

/* 15 个环节的操作说明（角色 / 触发 / 操作要点 / 系统产物 / SLA / 相关功能）*/
var FCL_SOP_STEPS=[
{no:'①',name:'询价 / 报价',sop:'SOP-FCL-01',stage:'sales',role:'业务员、商务（运价）',
 trigger:'客户通过邮件 / 微信 / QQ 发来询盘',
 actions:['在系统或小程序输入起运港、目的港、ETD、柜型，查询最新业务价','按客户类型与利润空间叠加销售利润，得出销售价',
          '海外代理走邮件标准模板（自动套最新价 + 有效期）；国内同行/直客走微信、QQ 简版模板',
          '报价单需备注 ETT 时间、询盘有效期、附加费说明与特殊事项'],
 output:'报价单存档、报价历史留痕；订单状态 = 询价中',
 sla:'≤ 30 分钟（价格已维护时）',
 caution:'三级价格：预估成本价 → 业务价（+公关成本+管理费）→ 销售价（+业务员利润）。预付柜/特殊启运口岸/汽车柜加管理费，到付柜不加。',
 tabs:[['整柜报价单','fcl-quote','fcl'],['整柜试算-业务','fcl-trial-calc-biz','fcl'],['整柜试算-客户','fcl-trial-calc','fcl'],['成本价','fcl-cost-price','fcl'],['业务成本价','fcl-business-cost','fcl']]},

{no:'②',name:'客户建档与审核',sop:'SOP-FCL-02',stage:'sales',role:'业务员（发起）、商务/财务主管（审核）',
 trigger:'识别为新客户，首次接洽',
 actions:['进入「客户管理 → 申请开户」，录入营业执照号 / 客户名称','补充联系人、电话、邮箱、收件地址、付款方式偏好、销售备注并上传附件',
          '提交审核 → 审核人对照背调结果（国内天眼查 + 同行历史；国外 Sea Net）','审核通过后客户方可下单；驳回需备注原因'],
 output:'客户档案建立；状态 待开户 → 审批中 → 已开户',
 sla:'—',
 caution:'客户是全公司共享主数据，整柜模块不另建审核流，统一走客户管理的申请开户流程。',
 tabs:[['客户管理','crm-cust','crm']]},

{no:'③',name:'委托订单录入',sop:'SOP-FCL-03',stage:'sales',role:'业务员（主导）、商务（审核）',
 trigger:'客户接受报价并发来托书',
 actions:['将托书上传系统，自动提取发货人、收货人、通知人、品名、HS code、货重、柜型柜量、港口、ETD',
          '核对识别结果，补充付款方式、保险要求、特殊操作备注','系统按 ETD / 起运港 / 目的港 / 渠道自动生成预估成本',
          '填写应收客户费用（运费 + 附加费 + Local 费），系统算出预估毛利','提交委托订单 → 商务按成本价、应收价、毛利率审核'],
 output:'委托订单 FEO；审核通过后自动生成订舱单 FBK；状态 待订舱',
 sla:'托书 → 录入 ≤ 4 小时；审核 ≤ 2 小时',
 caution:'预定仓无需审核（无费用产生）；实单订舱必须走价格与毛利审核。业务员在外可用移动端录入。',
 tabs:[['委托订单管理','fcl-sales-instruction','fcl'],['业务询盘单','fcl-inquiry-order','fcl']]},

{no:'④',name:'Job/主单管理',sop:'SOP-FCL-04',stage:'ops',role:'订舱员（主导）、商务（仓位协调）',
 trigger:'委托订单审核通过，进入「待订舱」队列',
 actions:['从待订舱列表领取订单，选择订舱方式：自有渠道 / 外配同行 / 一代',
          '自有渠道走 EDI 推送或船公司官网；外配同行由系统生成剥离敏感信息的专属托书一键发邮件',
          '可「复制主单」（同公司/同船司/同港口）减少约 80% 重复录入',
          '填写发货人、收货人、通知人、品名、HS Code（跟品名库带出，不手填）、货重、柜量、协议号','提交后登记船公司订舱回执号'],
 output:'订舱单 FBK + 订舱回执号；状态 已订舱',
 sla:'船公司订舱回执 ≤ 24 小时',
 caution:'危险品在主单信息里勾选「是否危险品」后补 UN 编号、危险类别、包装类别、申报人；其船司结单时间早于普货，需提前规划、进仓与普货分开存放。',
 tabs:[['Job/主单管理','fcl-booking','fcl']]},

{no:'⑤',name:'放仓作业',sop:'SOP-FCL-05',stage:'ops',role:'订舱员（主导）、操作员（协同）',
 trigger:'船公司确认舱位并发出放仓邮件（一般 1~2 个工作日）',
 actions:['放仓邮件自动接入或人工上传，系统识别港口 + 船公司并匹配放仓模板',
          '按模板自动删除船司价格等敏感信息、添加瞒报告示、套用客户放仓模板',
          '自动填充船名航次、起运港、目的港、ETD、协议号、关务联系人','核对后点击「放仓发送」发给客户'],
 output:'客户专用放仓件；状态 已放仓；同时对内提醒拖车、报关、补料',
 sla:'放仓邮件接收 ≤ 48 小时',
 caution:'放仓模板是本环节核心，按「船公司 × 目的港」维护，含对外/对内结单时间（对内一般早 1 天）。危险品需单独一套模板。',
 tabs:[['Job/主单管理','fcl-booking','fcl'],['放仓模板','fcl-release-tpl','biz-cfg']]},

{no:'⑥',name:'拖车安排',sop:'SOP-FCL-06',stage:'ops',role:'操作员（主导）、拖车行、财务（对账）',
 trigger:'放仓完成',
 actions:['录入拖车委托单：装柜时间、专柜地址、联系人、电话、备注','询价并选择拖车行（拼箱偏固定、整柜按 VIP 等级与摊位紧张度安排）',
          '发送拖车委托单给拖车行','业务员录入向客户收取的拖车应收（毛利计算需要）','拖车行自助录入实际费用，或月底对账后录入实际成本'],
 output:'拖车委托单 FTR；状态 拖车费用已确认',
 sla:'—',
 caution:'目标是让供应商自助录入，把财务对账工作量降低约 70%。',
 tabs:[['Job/主单管理','fcl-booking','fcl']]},

{no:'⑦',name:'进仓装柜',sop:'SOP-FCL-07',stage:'ops',role:'操作员（监督）、仓库操作员（执行）',
 trigger:'拖车提柜到仓，货物到仓',
 actions:['系统按时间节点自动提醒：进仓日 / 装柜日 / 报关截止日','货物到仓扫描入库，登记件数、毛重',
          '装柜时用 PDA 逐件扫描，系统记录装柜清单','装柜完成拍照存档（封柜照、铅封号特写）','回填铅封号'],
 output:'装柜单 FLD + 装柜清单 + 封柜照；状态 已进仓 / 已装柜',
 sla:'—',
 caution:'业务联系单不再打印，改由系统按时间节点自动生成任务与提醒，实现无纸化。',
 tabs:[['Job/主单管理','fcl-booking','fcl'],['仓库PDA','pda-app','warehouse-pda']]},

{no:'⑧',name:'补料与提单',sop:'SOP-FCL-08',stage:'ops',role:'操作员（主导）、单证员（制单）、客户（确认）',
 trigger:'装柜完成，临近船公司补料截止日',
 actions:['客户按对内截止日提供补料（SI + 装箱单 + 报关资料）','到内部截止时间仍未收到 → 系统自动发催料邮件并记录催料次数',
          '核对补料完整性后录入 SI；已对接 API 的走 EDI 自动推送，未对接的手工登录船司官网',
          '船公司预生成草稿件 → 下载转发客户核对 → 客户确认或提出改单（可能产生改单费）',
          '开船后 7 天内船公司签发正本 / 电放件，正本提单存档（草稿件无需存档）'],
 output:'补料单 FSB + 提单号 + 柜号；状态 已补料 → 提单已确认 → 提单已签发',
 sla:'对内截止比对外提前 1 天（留 3~4 小时操作时间）；草稿件确认 ≤ 12 小时',
 caution:'拆单（1 MBL 拆多 HBL）遵循船公司拆单逻辑；并单（多 HBL 合 1 MBL）可合并申报节省费用。拆单产生的 HBL 会打拆单标记，放单时强制转人工审核。',
 tabs:[['Job/主单管理','fcl-booking','fcl']]},

{no:'⑨',name:'报关申报',sop:'SOP-FCL-09',stage:'ops',role:'报关员（主导）、报关行（执行）',
 trigger:'装柜完成',
 actions:['整理客户提供的报关资料（合同、发票、装箱单、报关委托书）','上传报关资料到系统，客户可自行下载报关放行单',
          '线下对接报关行，选择报关方式：单独 / 合并 / 拆分 / 买单','查验时登记查验信息并通知相关人员；放行后上传放行单',
          '录入每票报关费（不固定，按报关类型标记收费逻辑）'],
 output:'报关单 FCD + 放行单；状态 已申报 / 查验中 / 已放行',
 sla:'—',
 caution:'当前为线下对接、逐票录入费用；月结由财务统一与报关行对账。报关行 API 属远期规划。',
 tabs:[['Job/主单管理','fcl-booking','fcl']]},

{no:'⑩',name:'开船与轨迹',sop:'SOP-FCL-10',stage:'ops',role:'操作员（监控）、客服（通知）、系统',
 trigger:'船舶离港',
 actions:['系统每日轮询船公司 API / 船讯网，抓取装船、开船、在途、抵港、卸船五类节点',
          '对比预计与实际开船日期，偏差超阈值触发异常预警','自动推送进度邮件给客户（补料时已绑定客户邮箱）',
          '船期变更（换船 / 推迟 / 跳港）时自动识别受影响订单，更新船名航次并一键群发通知','抵港后通知客户准备清关'],
 output:'轨迹单 FTK + 轨迹节点记录；状态 已开船 / 在途 / 已到港',
 sla:'—',
 caution:'四类异常预警：开船延误、跳港、塞港、船公司换船。开船延误产生的额外费用可作为账单申诉依据。',
 tabs:[['Job/主单管理','fcl-booking','fcl']]},

{no:'⑪',name:'寄单作业',sop:'SOP-FCL-11',stage:'ops',role:'操作员（发起）、深圳前台（执行）',
 trigger:'提单已签发且应收已核销放单',
 actions:['发起「寄单申请」，填写收件地址、收件人、电话，勾选快递公司与备注',
          '系统以任务流自动通知深圳前台同事','前台打包提单寄出并回填快递单号','系统记录快递单号并自动通知客户'],
 output:'寄单单 FDS + 快递单号；状态 待寄单 → 已寄出 → 已签收',
 sla:'深圳前台当日寄出',
 caution:'原流程靠邮件单向操作、深圳同事邮件量大；改为系统任务流后直接在系统看任务、回填单号并自动反馈客户。',
 tabs:[['Job/主单管理','fcl-booking','fcl']]},

{no:'⑫',name:'账单管理',sop:'SOP-FCL-12',stage:'fin',role:'操作员（录入）、财务（对账）',
 trigger:'船公司账单送达（邮件 PDF 或官网下载）',
 actions:['优先 OCR 识别上传的 PDF，自动提取费用项并映射到预设模板；API 对接后可自动获取；人工录入作兜底',
          '对照预估成本识别差异（金额、附加费、汇率等），系统自动标记差异','差异在合理范围 → 确认入账；差异异常 → 走申诉流程',
          '实际支付与负数费用录入（便于抵扣）'],
 output:'实际费用 FBE / 导入批次 FBI / 对比单 FCMP / 申诉单 FAP；状态 账单已确认 或 申诉中',
 sla:'船公司账单录入 ≤ 2 个工作日',
 caution:'申诉务必「先付款后申诉」，避免逾期影响后续业务。MAC 申诉周期约 3 个月，系统在到期前 7/3/1 天三次提醒，超期自动置「超期未处理」。',
 tabs:[['预估成本明细','fcl-est-cost','fcl'],['代理实际成本','fcl-agent-cost','fcl']]},

{no:'⑬',name:'付款管理',sop:'SOP-FCL-13',stage:'fin',role:'操作员（请款）、财务（审核与付款）',
 trigger:'账单确认无误',
 actions:['录入请款单：船东、币种、金额、付款用途、期望付款时间、收款账号','财务审核请款单（金额、付款期限、资金计划）',
          '同一船东 + 同一币种的多笔请款合并付款，节省手续费','付款后录入实际付款时间 + 银行水单','系统自动核销该笔应付并通知操作员'],
 output:'请款单 FPR → 付款单 FPY；状态 已付款 → 已核销',
 sla:'CMA 开船日 +10 天；其他船公司约 +14 天',
 caution:'期望付款时间由操作录入、提交后不可改；实际付款时间由财务录入。系统按两者差异做资金盘点。票结由操作部逐票发起，月结由财务按月汇总。',
 tabs:[['应付账单管理','fcl-ap-bill','fcl']]},

{no:'⑭',name:'应收与放单',sop:'SOP-FCL-14',stage:'fin',role:'财务（应收）、操作员（发起放单）',
 trigger:'客户付款到账 / 操作员发起放单申请',
 actions:['银行流水自动接入并与应收单匹配，不能自动匹配的由财务手工认领','核销应收并标记已收款',
          '发起放单申请时系统展示该客户的应收、已收、未收与历史核销情况',
          '无欠款且当票应收已核销 → 自动放单；有历史未核销 → 转财务人工审核；黑名单客户 → 强拦截'],
 output:'放单单 FAR；状态 已核销 / 已放单，随后进入寄单流程',
 sla:'客户付款 → 自动放单 ≤ 2 小时',
 caution:'避免循环扣单：拆单后部分核销、分批付款等特殊情况必须识别出来转人工并高亮提醒。',
 tabs:[['应收费用明细','fcl-ar-fee','fcl'],['应收收款管理','fcl-ar-receipt','fcl']]},

{no:'⑮',name:'业绩与提成',sop:'SOP-FCL-15',stage:'fin',role:'深圳财务（核算与发放）、业务员（查看）',
 trigger:'毛利结算完成、收款到位',
 actions:['系统按「毛利 = 应收 − 成本」核算，成本取实际账单金额','校验发放三条件：收款到位 + 财务对账完成 + 该票无未关闭申诉',
          '满足条件的置为「可发放」，由深圳财务确认发放','业务员随时查看应收款、公司成本、利润与提成预估，并可逐票与自己的记账核对'],
 output:'提成单 FCM；状态 待核算 → 已核算 → 已发放',
 sla:'—',
 caution:'存在未关闭申诉的票单不可核算提成。业绩可视化的目的是让业务员能对照核对，简化工作并加深对财务的信任。',
 tabs:[['应收收款管理','fcl-ar-receipt','fcl']]}
];

/* 功能地图：6 个分组 + 每项一句话说明 */
var FCL_FUNC_MAP=[
{group:'① 报价与价格',hint:'商务维护价格，业务员对外报价',items:[
    ['整柜报价单','fcl-quote','fcl','对客户正式发出的报价，含成本、附加费、加价与报价金额'],
    ['成本价','fcl-cost-price','fcl','船东表价，系统内部计算成本的基础'],
    ['业务成本价','fcl-business-cost','fcl','预估成本价 + 公关成本 + 运营成本，业务员对外报价底价'],
    ['业务销售价','fcl-sales-price','fcl','业务价 + 业务员利润，按旺淡季动态调整'],
    ['整柜试算-客户','fcl-trial-calc','fcl','客户口径试算，可一键生成报价'],
    ['整柜试算-业务','fcl-trial-calc-biz','fcl','业务成本口径试算，供业务员判断利润空间'],
    ['航司路线配置','fcl-carrier-route','fcl','航司、路线代码、中转港与航程天数']]},
{group:'② 询盘与委托订单',hint:'业务员的完整工作面',items:[
    ['业务询盘单','fcl-inquiry-order','fcl','商机台账，记录询盘、报价渠道与失单原因'],
    ['委托订单管理','fcl-sales-instruction','fcl','销售指示即客户委托单，预录单与实单统一在此录入，审核通过后生成订舱单']]},
{group:'③ 订舱与放舱',hint:'订舱员的完整工作面',items:[
    ['Job/主单管理','fcl-booking','fcl','整柜全链路主档；放舱与拖车/装柜/补料/拆并单/报关/开船轨迹/寄单都收进本页的「放舱」与「操作」按钮里']]},
{group:'⑤ 整柜财务',hint:'成本侧 预估→实际→应付账单；收入侧 应收明细→收款',items:[
    ['预估成本明细','fcl-est-cost','fcl','订舱时按 Job 拆出的成本基线，后面拿它跟代理实际成本比'],
    ['代理实际成本','fcl-agent-cost','fcl','服务商报来的实际金额，逐项对账算差异'],
    ['应付账单管理','fcl-ap-bill','fcl','按服务商汇总的应付，并入付款登记'],
    ['应收费用明细','fcl-ar-fee','fcl','按 Job 的应收逐项，收款核销时冲这里的未收金额'],
    ['应收收款管理','fcl-ar-receipt','fcl','客户打款认领与核销，自动冲减应收明细']]},
{group:'⚙ 整柜规则（业务配置）',hint:'规则外置，业务可自行维护',items:[
    ['关键业务规则','fcl-rule','biz-cfg','订舱、财务等各类规则的启用与优先级'],
    ['放仓模板','fcl-release-tpl','biz-cfg','船公司 × 目的港，结单时间、瞒报告示与敏感信息剥离'],
    ['服务商API配置','fcl-provider-api','biz-cfg','船期、订舱、补料、轨迹接口地址与授权'],
    ['EDI/API对接','fcl-edi-api','biz-cfg','各接口同步状态与失败次数监控']]}
];

/* 关键业务规则速查（SOP 第十九章）*/
var FCL_KEY_RULES=[
{t:'价格加价规则',items:['预付柜：船东价 + 管理费','到付柜：不加管理费，价格公开透明','特殊启运口岸（如厦门）：增加管理费','汽车柜：增加管理费且需提前囤仓']},
{t:'仓位上限规则',items:['船公司维度：按船公司维护放仓上限','业务员维度：单个业务员最大预定仓数量上限','业务之间仓位默认不可见，商务/订舱员可见全量','释放的仓位回到「已释放」，由商务统一调配']},
{t:'放单规则',items:['自动放单：无历史欠款 + 当票应收已核销','手动放单：有历史未核销单据 → 财务审核','拒放规则：客户在黑名单 → 系统强拦截','拆单部分核销 / 分批付款 → 转人工并高亮，避免循环扣单']},
{t:'申诉规则',items:['先付款后申诉，避免逾期影响后续业务','申诉周期：MAC 约 3 个月，其他船公司类似','到期前 7 天 / 3 天 / 1 天三次提醒','超期未处理需在申诉界面显著呈现']}
];

/* 异常处理速查（SOP 第二十一章）*/
var FCL_EXCEPTIONS=[
['客户取消订单','业务员','订舱部系统取消 → 退仓 → 退仓成本录入客户历史单或新建费用单'],
['船公司换船 / 推迟','系统 + 操作员','系统识别变更邮件 → 更新船名航次 → 群发邮件通知受影响客户'],
['爆舱无法订舱','订舱员','立即通知业务员 → 协调客户改期或改船公司'],
['账单差异','财务','先付款 → 走申诉流程，记录争议金额与到期日'],
['报关查验','报关员','系统登记查验信息 → 通知客户与业务员'],
['客户拒收草稿件','操作员','通知船公司改单，记录改单次数与改单费'],
['客户欠款逾期','财务','系统催收提醒 → 业务员跟进 → 期间放单请求转人工或拒放'],
['邮件退信','业务员','系统反馈 → 核实邮箱或改用其他渠道'],
['接口对接失败','IT','30 分钟未恢复 → 告警 → 暂时人工录入']
];

/* 总览看板已下线，统计口径改挂 Job/主单管理这张全链路主档 */
function fclGuideStats(){
    var c=TC['fcl-booking']||{},rows=c.d||[],si=(c.h||[]).indexOf('订舱状态');
    var cnt=function(){
        var want=Array.prototype.slice.call(arguments);
        return si<0?0:rows.filter(function(r){return want.indexOf(r[si])>=0;}).length;
    };
    return [
        {label:'主单总数',val:rows.length,cls:'text-primary-700'},
        {label:'待订舱',val:cnt('待订舱'),cls:'text-orange-600'},
        {label:'在途',val:cnt('已离港','已到港'),cls:'text-blue-600'},
        {label:'已作废',val:cnt('已作废'),cls:'text-red-600'}
    ];
}

function fclGuideJump(page,tab){
    if(typeof navigateToTab==='function')navigateToTab(page,tab);
    else showToast(tr('无法跳转'));
}

function fclGuideScrollTo(i){
    var el=document.getElementById('fcl-sop-'+i);
    if(!el)return;
    el.scrollIntoView({behavior:'smooth',block:'start'});
    el.classList.add('ring-2','ring-primary-400');
    setTimeout(function(){el.classList.remove('ring-2','ring-primary-400');},1600);
}

function fclGuideChip(label,tab,page){
    return '<button type="button" class="h-7 px-3 text-xs rounded-full border border-primary-200 text-primary-700 bg-primary-50/50 hover:bg-primary-100 cursor-pointer whitespace-nowrap" '+
           'onclick="fclGuideJump(\''+page+'\',\''+tab+'\')">'+esc(tr(label))+' →</button>';
}

function generateFclGuidePage(id){
    var h='';
    var stageColor={sales:'blue',ops:'green',fin:'purple'};
    var badgeCls={blue:'bg-blue-50 text-blue-700 border-blue-200',green:'bg-green-50 text-green-700 border-green-200',purple:'bg-purple-50 text-purple-700 border-purple-200'};

    /* main#main-content 是 overflow-hidden 的 flex 容器，
     * 自定义页必须自己带 h-full overflow-auto 才能滚动（与 generateFclTrialCalcPage / generateTrackQueryPage 一致） */
    h+='<div class="h-full overflow-auto bg-surface-50 p-6 space-y-5">';

    /* ===== 头部 ===== */
    h+='<div class="bg-white rounded-xl border border-surface-200 p-6">';
    h+='<div class="flex items-start justify-between gap-6 flex-wrap">';
    h+='<div class="min-w-[420px] flex-1">';
    h+='<h2 class="text-xl font-bold text-text-primary mb-1.5">'+tr('整柜业务操作导航')+'</h2>';
    h+='<p class="text-sm text-text-secondary leading-relaxed">'+
       tr('本页是整柜（FCL）业务的入口地图与操作说明。上方按 SOP 的 15 个环节串联全流程，点击任一环节可跳到对应的操作说明；下方「功能地图」按 6 个业务分组列出全部功能页面，点击直接打开。')+'</p>';
    h+='<p class="text-xs text-text-muted mt-2">'+tr('依据《好利航物流 · 整柜操作 SOP V1.0》（SOP-FCL-V1.0）与《整柜业务功能重构设计方案》（DES-FCL-V1.0）')+'</p>';
    h+='</div>';
    h+='<div class="grid grid-cols-4 gap-3">';
    fclGuideStats().forEach(function(s){
        h+='<div class="px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 min-w-[92px] text-center">'+
           '<div class="text-2xl font-bold '+s.cls+'">'+s.val+'</div>'+
           '<div class="text-[11px] text-text-muted mt-0.5 whitespace-nowrap">'+esc(tr(s.label))+'</div></div>';
    });
    h+='</div></div></div>';

    /* ===== 全流程 15 环节 ===== */
    h+='<div class="bg-white rounded-xl border border-surface-200 p-6">';
    h+='<div class="flex items-center gap-2 mb-4"><span class="w-1 h-4 bg-primary-600 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('端到端业务流程')+'</span>'+
       '<span class="text-xs text-text-muted">'+tr('点击环节查看该环节的操作说明')+'</span></div>';
    FCL_SOP_STAGES.forEach(function(st){
        h+='<div class="mb-3 last:mb-0">';
        h+='<div class="flex items-center gap-2 mb-2">';
        h+='<span class="text-xs font-semibold px-2 py-0.5 rounded border '+badgeCls[st.color]+'">'+esc(tr(st.label))+'</span>';
        h+='<span class="text-xs text-text-muted">'+esc(tr(st.desc))+'</span></div>';
        h+='<div class="flex items-center gap-1.5 flex-wrap">';
        for(var i=st.range[0];i<st.range[1];i++){
            var s=FCL_SOP_STEPS[i];
            h+='<button type="button" onclick="fclGuideScrollTo('+i+')" '+
               'class="px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 hover:border-primary-300 hover:bg-primary-50 cursor-pointer text-left">'+
               '<div class="text-xs font-semibold text-text-primary whitespace-nowrap">'+s.no+' '+esc(tr(s.name))+'</div>'+
               '<div class="text-[10px] text-text-muted">'+s.sop+'</div></button>';
            if(i<st.range[1]-1)h+='<span class="text-surface-300 text-xs">→</span>';
        }
        h+='</div></div>';
    });
    h+='</div>';

    /* ===== 功能地图 ===== */
    h+='<div class="bg-white rounded-xl border border-surface-200 p-6">';
    h+='<div class="flex items-center gap-2 mb-4"><span class="w-1 h-4 bg-primary-600 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('功能地图')+'</span>'+
       '<span class="text-xs text-text-muted">'+tr('点击功能名直接打开对应页面')+'</span></div>';
    h+='<div class="grid grid-cols-2 gap-4">';
    FCL_FUNC_MAP.forEach(function(g){
        h+='<div class="border border-surface-200 rounded-xl p-4">';
        h+='<div class="flex items-baseline gap-2 mb-3">';
        h+='<span class="text-sm font-semibold text-text-primary">'+esc(tr(g.group))+'</span>';
        h+='<span class="text-[11px] text-text-muted">'+esc(tr(g.hint))+'</span></div>';
        h+='<div class="space-y-1.5">';
        g.items.forEach(function(it){
            h+='<div class="flex items-start gap-2 group">';
            h+='<button type="button" onclick="fclGuideJump(\''+it[2]+'\',\''+it[1]+'\')" '+
               'class="shrink-0 text-xs font-medium text-primary-700 hover:text-primary-800 hover:underline underline-offset-2 cursor-pointer text-left w-[104px]">'+esc(tr(it[0]))+'</button>';
            h+='<span class="text-[11px] text-text-muted leading-[18px] flex-1">'+esc(tr(it[3]))+'</span>';
            h+='</div>';
        });
        h+='</div></div>';
    });
    h+='</div></div>';

    /* ===== 15 环节操作说明 ===== */
    h+='<div class="bg-white rounded-xl border border-surface-200 p-6">';
    h+='<div class="flex items-center gap-2 mb-4"><span class="w-1 h-4 bg-primary-600 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('各环节操作说明')+'</span>'+
       '<span class="text-xs text-text-muted">'+tr('角色 · 触发条件 · 操作要点 · 系统产物 · 时效')+'</span></div>';
    h+='<div class="space-y-3">';
    FCL_SOP_STEPS.forEach(function(s,i){
        h+='<div id="fcl-sop-'+i+'" class="border border-surface-200 rounded-xl p-4 transition-all" style="scroll-margin-top:12px">';
        /* 标题行 */
        h+='<div class="flex items-center gap-2.5 flex-wrap mb-3">';
        h+='<span class="text-base font-bold text-primary-700">'+s.no+'</span>';
        h+='<span class="text-sm font-semibold text-text-primary">'+esc(tr(s.name))+'</span>';
        h+='<span class="text-[11px] px-2 py-0.5 rounded border '+badgeCls[stageColor[s.stage]]+'">'+s.sop+'</span>';
        h+='<span class="text-[11px] text-text-muted">'+tr('角色')+'：'+esc(tr(s.role))+'</span>';
        if(s.sla&&s.sla!=='—')h+='<span class="text-[11px] px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">SLA '+esc(tr(s.sla))+'</span>';
        h+='</div>';
        /* 触发 + 产物 */
        h+='<div class="grid grid-cols-2 gap-4 mb-3">';
        h+='<div><div class="text-[11px] text-text-muted mb-1">'+tr('触发条件')+'</div>'+
           '<div class="text-xs text-text-secondary leading-relaxed">'+esc(tr(s.trigger))+'</div></div>';
        h+='<div><div class="text-[11px] text-text-muted mb-1">'+tr('系统产物与状态')+'</div>'+
           '<div class="text-xs text-text-secondary leading-relaxed">'+esc(tr(s.output))+'</div></div>';
        h+='</div>';
        /* 操作要点 */
        h+='<div class="mb-3"><div class="text-[11px] text-text-muted mb-1.5">'+tr('操作要点')+'</div><ol class="space-y-1">';
        s.actions.forEach(function(a,ai){
            h+='<li class="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">'+
               '<span class="shrink-0 w-4 h-4 rounded-full bg-primary-50 text-primary-700 text-[10px] font-semibold flex items-center justify-center mt-0.5">'+(ai+1)+'</span>'+
               '<span>'+esc(tr(a))+'</span></li>';
        });
        h+='</ol></div>';
        /* 注意事项 */
        if(s.caution){
            h+='<div class="mb-3 px-3 py-2 rounded-lg bg-amber-50 border-l-[3px] border-amber-400">'+
               '<span class="text-[11px] font-semibold text-amber-800">'+tr('注意')+'：</span>'+
               '<span class="text-xs text-amber-800 leading-relaxed">'+esc(tr(s.caution))+'</span></div>';
        }
        /* 相关功能 */
        h+='<div class="flex items-center gap-2 flex-wrap pt-2 border-t border-surface-100">';
        h+='<span class="text-[11px] text-text-muted">'+tr('相关功能')+'</span>';
        s.tabs.forEach(function(t){h+=fclGuideChip(t[0],t[1],t[2]);});
        h+='</div></div>';
    });
    h+='</div></div>';

    /* ===== 关键业务规则 ===== */
    h+='<div class="bg-white rounded-xl border border-surface-200 p-6">';
    h+='<div class="flex items-center gap-2 mb-4"><span class="w-1 h-4 bg-primary-600 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('关键业务规则速查')+'</span>'+
       '<span class="text-xs text-text-muted">'+tr('SOP 第十九章；具体数值在「业务配置 → 整柜规则」维护')+'</span></div>';
    h+='<div class="grid grid-cols-4 gap-4">';
    FCL_KEY_RULES.forEach(function(r){
        h+='<div class="border border-surface-200 rounded-xl p-4">';
        h+='<div class="text-sm font-semibold text-text-primary mb-2">'+esc(tr(r.t))+'</div><ul class="space-y-1.5">';
        r.items.forEach(function(x){
            h+='<li class="flex items-start gap-1.5 text-[11px] text-text-secondary leading-relaxed">'+
               '<span class="shrink-0 w-1 h-1 rounded-full bg-primary-400 mt-1.5"></span><span>'+esc(tr(x))+'</span></li>';
        });
        h+='</ul></div>';
    });
    h+='</div>';
    h+='<div class="mt-3 flex gap-2">'+fclGuideChip('关键业务规则','fcl-rule','biz-cfg')+fclGuideChip('放仓模板','fcl-release-tpl','biz-cfg')+'</div>';
    h+='</div>';

    /* ===== 异常处理 ===== */
    h+='<div class="bg-white rounded-xl border border-surface-200 p-6">';
    h+='<div class="flex items-center gap-2 mb-4"><span class="w-1 h-4 bg-primary-600 rounded"></span>'+
       '<span class="text-base font-semibold text-text-primary">'+tr('异常处理速查')+'</span>'+
       '<span class="text-xs text-text-muted">'+tr('SOP 第二十一章；异常在对应环节的作业弹窗里登记')+'</span></div>';
    h+='<table class="w-full text-xs"><thead><tr class="bg-primary-50/60">'+
       '<th class="text-left px-3 py-2 font-semibold text-primary-800 w-[18%]">'+tr('异常类型')+'</th>'+
       '<th class="text-left px-3 py-2 font-semibold text-primary-800 w-[14%]">'+tr('首问责任')+'</th>'+
       '<th class="text-left px-3 py-2 font-semibold text-primary-800">'+tr('处理流程')+'</th></tr></thead><tbody>';
    FCL_EXCEPTIONS.forEach(function(e,i){
        h+='<tr class="'+(i%2?'bg-surface-50/60':'')+' border-b border-surface-100">'+
           '<td class="px-3 py-2 text-text-primary font-medium">'+esc(tr(e[0]))+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(tr(e[1]))+'</td>'+
           '<td class="px-3 py-2 text-text-secondary leading-relaxed">'+esc(tr(e[2]))+'</td></tr>';
    });
    h+='</tbody></table>';
    h+='<div class="mt-3 flex gap-2">'+fclGuideChip('Job/主单管理','fcl-booking','fcl')+'</div>';
    h+='</div>';

    h+='</div>';
    return h;
}

/* 简易只读弹窗：复用现有 crud-modal 骨架 */
function openSimpleInfoModal(title,bodyHtml,width){
    var modal=document.getElementById('crud-modal');
    if(!modal){showToast(tr('弹窗容器不存在'));return;}
    var panel=modal.querySelector('.slide-panel');
    if(panel)panel.style.width=width||'70%';
    var titleEl=document.getElementById('crud-modal-title');
    if(titleEl)titleEl.textContent=title;
    var body=document.getElementById('crud-modal-body');
    if(body)body.innerHTML=bodyHtml;
    var footer=document.getElementById('crud-modal-footer');
    if(footer)footer.innerHTML='<button type="button" onclick="closeCrudModal()" class="h-9 px-5 text-sm font-medium rounded-lg border border-surface-200 text-text-secondary hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    modal.classList.remove('hidden');
}
