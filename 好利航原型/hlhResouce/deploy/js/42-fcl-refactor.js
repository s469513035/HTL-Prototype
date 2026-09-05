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
 * 二、④ 操作执行 —— 新增模块
 * ========================================================================== */

/* 8.6 拆单并单管理（SOP 11.4）*/
addPrototypeTable('fcl-bl-split-merge','拆单并单管理',
    '拆并单号|操作类型|订舱单号|源提单号|目标提单号|船公司|拆分方式|拆分合并数量|收货人明细|关联报关方式|费用分摊方式|操作人|操作时间|状态|操作',
    ['草稿','已提交','已完成','已撤销'],[
    ['FBS-20260613001','拆单(M拆H)','FBK-20260613001','HLHLA260613001','HLHLA260613001-A;HLHLA260613001-B','MAERSK','按柜量拆分','2','Lagos Import Ltd;Lagos Trading Co','拆分报关','按柜','陈单证','2026-06-13 15:40','已完成'],
    ['FBS-20260612002','并单(H合M)','FBK-20260612002','HLHDK260612002;HLHDK260612003','HLHDK260612100','COSCO','人工指定合并','2','Dakar Trading','合并报关','按票','周单证','2026-06-12 17:20','已提交'],
    ['FBS-20260611003','拆单(M拆H)','FBK-20260611003','HLHAB260611003','待生成','CMA CGM','按费用拆分','3','Abidjan Import;Abidjan Retail;Abidjan Logistics','拆分报关','按重量','陈单证','2026-06-11 11:10','草稿']
],[
    {label:'拆并单号',type:'text'},
    {label:'操作类型',type:'select',options:['拆单(M拆H)','并单(H合M)']},
    {label:'订舱单号',type:'text'},
    {label:'源提单号',type:'text'},
    {label:'船公司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'状态',type:'select',options:['草稿','已提交','已完成','已撤销']}
]);
TC['fcl-bl-split-merge'].modalExcludedFields=['操作人','操作时间','状态'];
TC['fcl-bl-split-merge'].fieldOptions={
    '操作类型':['拆单(M拆H)','并单(H合M)'],
    '船公司':FCL_CARRIER_OPTIONS,
    '拆分方式':['按柜型拆分','按柜量拆分','按费用拆分','人工拆分','人工指定合并'],
    '关联报关方式':['单独报关','合并报关','拆分报关','买单报关'],
    '费用分摊方式':['按柜','按票','按重量','手工指定']
};

/* ==========================================================================
 * 三、⑤ 财务与结算 —— 新增模块
 * ========================================================================== */

/* 9.1 账单申诉（SOP 15.4 / 19.4：先付款后申诉，MAC 周期约 3 个月，须呈现「超期未处理」）*/
addPrototypeTable('fcl-appeal','账单申诉',
    '申诉单号|关联账单号|对比单号|订舱单号|船公司|申诉类型|申诉原因|争议金额|币别|账单付款情况|提交人|提交时间|申诉周期(天)|到期日|剩余天数|处理结果|结果金额|关闭时间|状态|操作',
    ['草稿','申诉中','已通过','已驳回','超期未处理','已关闭'],[
    ['FAP-20260613001','FBE-20260613001','FCMP-20260613001','FBK-20260613001','MAERSK','附加费多计','船司在表价外多计塞港费 USD 80，与放仓时报价不符','80','USD','已付款','张财务','2026-06-13 16:10','90','2026-09-11','90','','','','申诉中'],
    ['FAP-20260605002','FBE-20260605008','FCMP-20260605008','FBK-20260605008','COSCO','开船延误产生的额外费用','实际开船晚于ETD 6天，产生滞港费 USD 240','240','USD','已付款','张财务','2026-06-05 10:30','90','2026-09-03','82','抵扣下次账单','240','','已通过'],
    ['FAP-20260228003','FBE-20260228011','FCMP-20260228011','FBK-20260228011','MSC','汇率差异','账单按月初汇率结算，与合同约定的开船日汇率不一致','156','USD','已付款','张财务','2026-02-28 09:20','90','2026-05-29','-95','','','','超期未处理'],
    ['FAP-20260610004','FBE-20260610005','FCMP-20260610005','FBK-20260610005','CMA CGM','重复计费','文件费重复收取两次','60','USD','未付款','张财务','2026-06-10 14:00','90','2026-09-08','87','','','','草稿']
],[
    {label:'申诉单号',type:'text'},
    {label:'关联账单号',type:'text'},
    {label:'订舱单号',type:'text'},
    {label:'船公司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'申诉类型',type:'select',options:['附加费多计','汇率差异','开船延误产生的额外费用','重复计费','单价与价格表不符','塞港费争议','其他']},
    {label:'提交时间',type:'date'},
    {label:'到期日',type:'date'},
    {label:'状态',type:'select',options:['草稿','申诉中','已通过','已驳回','超期未处理','已关闭']}
]);
TC['fcl-appeal'].modalExcludedFields=['剩余天数','关闭时间','状态'];
TC['fcl-appeal'].fieldOptions={
    '船公司':FCL_CARRIER_OPTIONS,
    '币别':FCL_CURRENCY_OPTIONS,
    '申诉类型':['附加费多计','汇率差异','开船延误产生的额外费用','重复计费','单价与价格表不符','塞港费争议','其他'],
    '账单付款情况':['已付款','未付款','部分付款'],
    '处理结果':['退款','抵扣下次账单','维持原账单']
};

/* 9.2 请款单管理（SOP 16.1/16.2：期望付款时间不可改；同船东同币种合并付款）*/
addPrototypeTable('fcl-payment-request','请款单管理',
    '请款单号|关联账单号|订舱单号|船东/服务商|币别|请款金额|付款用途|结算方式|期望付款时间|最晚付款期限|收款账号|开户行|申请人|申请时间|审批人|审批时间|合并批次号|实际付款时间|付款差异天数|状态|操作',
    ['待提交','请款待审批','审批通过待付款','已合并','已付款','已驳回'],[
    ['FPR-20260613001','FBE-20260613001','FBK-20260613001','MAERSK','USD','4120','海运费','票结','2026-06-25','2026-06-30','DE89370400440532013000','Maersk Bank HK','陈操作','2026-06-13 16:30','','','','','','请款待审批'],
    ['FPR-20260612002','FBE-20260612002','FBK-20260612002','COSCO','USD','5180','海运费','月结','2026-06-28','2026-07-06','CN45012345678901234567','中国银行深圳分行','陈操作','2026-06-12 18:00','财务主管','2026-06-13 09:15','PB-202606-001','2026-06-27','-1','已付款'],
    ['FPR-20260611003','FBE-20260611003','FBK-20260611003','COSCO','USD','2460','附加费','月结','2026-06-28','2026-07-06','CN45012345678901234567','中国银行深圳分行','陈操作','2026-06-11 15:20','财务主管','2026-06-13 09:15','PB-202606-001','2026-06-27','-1','已合并'],
    ['FPR-20260610004','FBE-20260610004','FBK-20260610004','MSC','USD','3860','海运费','票结','2026-06-20','2026-06-22','MSC8899001122334455','MSC Bank Geneva','陈操作','2026-06-10 11:00','财务主管','2026-06-11 10:00','','','','审批通过待付款']
],[
    {label:'请款单号',type:'text'},
    {label:'关联账单号',type:'text'},
    {label:'订舱单号',type:'text'},
    {label:'船东/服务商',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'结算方式',type:'select',options:['票结','月结']},
    {label:'期望付款时间',type:'date'},
    {label:'状态',type:'select',options:['待提交','请款待审批','审批通过待付款','已合并','已付款','已驳回']}
]);
/* PR-01 期望付款时间由操作录入、提交后锁定；实际付款时间与差异天数由财务侧回写 */
TC['fcl-payment-request'].modalExcludedFields=['审批人','审批时间','合并批次号','实际付款时间','付款差异天数','状态'];
TC['fcl-payment-request'].fieldOptions={
    '船东/服务商':FCL_CARRIER_OPTIONS,
    '币别':FCL_CURRENCY_OPTIONS,
    '结算方式':['票结','月结'],
    '付款用途':['海运费','附加费','拖车费','报关费','改单费','其他']
};

/* ==========================================================================
 * 四、既有表覆写：主线收敛与字段扩展
 * ========================================================================== */

/* 10.2 Job/主单管理（原「订舱管理」）—— 整柜全链路主档。
 *      Job No 自动生成；危险品明细随勾选显隐；
 *      弹窗按 基础信息 / 订舱信息 / 主单信息 / 单证信息 分板块。
 *      种子数据用「表头 -> 值」的对象写，再按表头顺序摊平，避免加列时串位。 */
var FCL_BOOKING_HEADERS='Job No|委托订单号|委托类型|客户名称|船司|航线|起运港|目的港|柜型柜量|船名航次|ETD|ETA|ATD|ATA|订舱回执号|回执附件|约号|截补料时间|订舱日期|订舱方式|订舱人|订舱备注|S/O No.|放单方式|Shipper|Notify|Consignee|主单备注|柜号|封签号|柜重|是否危险品|UN编号|危险类别|包装类别|危险品申报人|订舱状态|操作';
var FCL_BOOKING_SEED=[
    {'Job No':'FBK-20260613001','委托订单号':'FEO-20260613001','委托类型':'实单','客户名称':'深圳市华运达国际货运',
     '船司':'MAERSK','航线':'西非线','起运港':'深圳盐田','目的港':'拉各斯','柜型柜量':'40HQ×1','船名航次':'MAERSK LAGOS 026W',
     'ETD':'2026-06-20','ETA':'2026-07-18','ATD':'','ATA':'',
     '约号':'MSK-CN-2026-8891','截补料时间':'2026-06-17 12:00','订舱日期':'2026-06-13','订舱方式':'EDI','订舱人':'刘订舱',
     '订舱备注':'客户要求本航次务必装出','S/O No.':'','放单方式':'电放',
     'Shipper':'联系人：张明\n联系公司：深圳市华运达国际货运\n联系人地址：深圳市盐田区盐田路 88 号\n联系人电话：13800138000',
     'Notify':'联系人：Same as consignee',
     'Consignee':'联系人：Mr. Okonkwo\n联系公司：Lagos Import Ltd\n联系人地址：12 Apapa Wharf Road, Lagos, Nigeria\n联系人电话：+234 802 111 2222',
     '主单备注':'','柜号':'','封签号':'','柜重':'','是否危险品':'否','订舱状态':'待订舱'},
    {'Job No':'FBK-20260612002','委托订单号':'FEO-20260612002','委托类型':'实单','客户名称':'广州远洋进出口贸易',
     '船司':'COSCO','航线':'西非线','起运港':'广州南沙','目的港':'达喀尔','柜型柜量':'20GP×2','船名航次':'COSCO AFRICA 118W',
     'ETD':'2026-06-22','ETA':'2026-07-20','ATD':'2026-06-22','ATA':'',
     '订舱回执号':'COSU778812','回执附件':'COSCO订舱确认书.pdf;舱位确认邮件.png',
     '约号':'COS-CN-2026-4412','截补料时间':'2026-06-18 18:00','订舱日期':'2026-06-12','订舱方式':'官网','订舱人':'赵订舱',
     '订舱备注':'船司已确认舱位','S/O No.':'SO-COS-2026-0612','放单方式':'正本',
     'Shipper':'联系人：李经理\n联系公司：广州远洋进出口贸易\n联系人地址：广州市南沙区港前大道 168 号\n联系人电话：13900139002',
     'Notify':'联系人：Dakar Notify',
     'Consignee':'联系人：M. Diop\n联系公司：Dakar Trading SARL\n联系人地址：Rue 12, Zone Portuaire, Dakar, Senegal\n联系人电话：+221 77 333 4444',
     '主单备注':'主单已确认，等待放舱','柜号':'COSU7654321','封签号':'SL-0612889','柜重':'21,500 KG',
     '是否危险品':'否','订舱状态':'已订舱'},
    {'Job No':'FBK-20260611003','委托订单号':'FEO-20260611003','委托类型':'实单','客户名称':'东莞市鑫海物流',
     '船司':'CMA CGM','航线':'地中海线','起运港':'上海洋山','目的港':'阿比让','柜型柜量':'40HQ×1','船名航次':'CMA MARSEILLE 09W',
     'ETD':'2026-06-25','ETA':'2026-07-22','ATD':'','ATA':'',
     '约号':'CMA-CN-2026-3320','截补料时间':'2026-06-21 12:00','订舱日期':'2026-06-11','订舱方式':'EDI','订舱人':'刘订舱',
     '订舱备注':'危险品，结单时间早于普货48小时','S/O No.':'','放单方式':'电放',
     '主单备注':'','柜号':'','封签号':'','柜重':'',
     '是否危险品':'是','UN编号':'UN3480','危险类别':'9类 锂电池','包装类别':'PI965','危险品申报人':'李申报',
     '订舱状态':'待订舱'},
    {'Job No':'FBK-20260610004','委托订单号':'FEO-20260613004','委托类型':'预录单','客户名称':'',
     '船司':'MSC','航线':'西非线','起运港':'深圳盐田','目的港':'特马','柜型柜量':'40HQ×2','船名航次':'MSC ACCRA 23W',
     'ETD':'2026-07-02','ETA':'2026-07-29','ATD':'2026-07-02','ATA':'2026-07-28',
     '订舱回执号':'MSCU334455','回执附件':'MSC_booking_confirm.pdf',
     '约号':'','截补料时间':'2026-06-28 12:00','订舱日期':'2026-06-10','订舱方式':'官网','订舱人':'赵订舱',
     '订舱备注':'预录单委托，无费用产生、无需财务审核','S/O No.':'SO-MSC-2026-0610','放单方式':'海运单',
     '主单备注':'船司已放舱','柜号':'MSCU3344556','封签号':'SL-0610223','柜重':'24,800 KG',
     '是否危险品':'否','订舱状态':'已放舱'},
    {'Job No':'FBK-20260608005','委托订单号':'FEO-20260608006','委托类型':'实单','客户名称':'广州远洋进出口贸易',
     '船司':'ONE','航线':'西非线','起运港':'广州南沙','目的港':'洛美','柜型柜量':'20GP×1','船名航次':'ONE LOME 07W',
     'ETD':'2026-06-18','ETA':'','ATD':'','ATA':'',
     '约号':'','截补料时间':'2026-06-14 12:00','订舱日期':'2026-06-08','订舱方式':'邮件','订舱人':'赵订舱',
     '订舱备注':'客户取消出运，主单作废','S/O No.':'','放单方式':'电放',
     '主单备注':'','柜号':'','封签号':'','柜重':'','是否危险品':'否','订舱状态':'已作废'}
];
addPrototypeTable('fcl-booking','Job/主单管理',
    FCL_BOOKING_HEADERS,
    ['待订舱','已订舱','已放舱','已作废'],
    FCL_BOOKING_SEED.map(function(o){
        return FCL_BOOKING_HEADERS.split('|').slice(0,-1).map(function(h){return o[h]===undefined?'':o[h];});
    }),[
    {label:'Job No',type:'text'},
    {label:'S/O No.',type:'text'},
    {label:'委托订单号',type:'text'},
    {label:'船司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'航线',type:'select',options:FCL_ROUTE_OPTIONS},
    {label:'起运港',type:'select',options:FCL_POL_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'柜号',type:'text'},
    {label:'是否危险品',type:'select',options:['是','否']},
    {label:'ETD',type:'date'},
    {label:'订舱状态',type:'select',options:['待订舱','已订舱','已放舱','已作废']}
]);
/* 委托订单号 / 委托类型 / 客户名称：数据仍在列表里（委托单审核通过时带过来），但不在弹窗录入 */
TC['fcl-booking'].modalExcludedFields=['订舱状态','委托订单号','委托类型','客户名称'];
/* 订舱回执号 / 回执附件由「登记订舱回执」写入，不由人工在新增/编辑里录：只在查看明细里成板块展示 */
TC['fcl-booking'].modalFieldModes={'订舱回执号':['view'],'回执附件':['view']};
TC['fcl-booking'].fieldOptions={
    '船司':FCL_CARRIER_OPTIONS,
    '航线':FCL_ROUTE_OPTIONS,
    '起运港':FCL_POL_OPTIONS,
    '目的港':FCL_POD_OPTIONS,
    '柜型柜量':['20GP×1','20GP×2','40GP×1','40HQ×1','40HQ×2'],
    '订舱方式':['EDI','官网','邮件','电话','外配同行','一代'],
    '放单方式':['电放','正本','海运单','副本放单'],
    '是否危险品':['是','否'],
    '危险类别':['1类 爆炸品','3类 易燃液体','8类 腐蚀品','9类 锂电池'],
    '包装类别':['I类','II类','III类','PI965','PI967'],
    /* 函数：弹窗打开时才求值，跟随发件人信息(base-sender)的最新数据 */
    'Shipper':fclSenderOptions,'Consignee':fclSenderOptions,'Notify':fclSenderOptions
};
/* Job No 不含「单号/编号」字样，引擎认不出来 → 显式声明为 code 才会只读自动生成；
 * 订舱人固定为当前登录人不可改；UN编号含「编号」会被误判为自动生成，强制回文本；
 * 是否危险品改勾选框；四个船期字段都是日期控件 */
TC['fcl-booking'].modalFieldTypes={'Job No':'code','订舱人':'currentUser',
    'ETD':'date','ETA':'date','ATD':'date','ATA':'date','订舱日期':'date','截补料时间':'date',
    'UN编号':'text','是否危险品':'checkbox','回执附件':'attachment',
    /* Shipper/Notify/Consignee：上面一个发件人选择框，下面一个可多行录入的文本框 */
    'Shipper':'pickerText','Consignee':'pickerText','Notify':'pickerText'};
/* 必填覆写：起运港（全局正则只收录了目的港，属遗漏）；
 * S/O No. 由船司订舱后回签、订舱日期在真正订出去才有 —— 建单时都还是空的，不能卡必填 */
TC['fcl-booking'].requiredOverrides={'起运港':true,'S/O No.':false,'订舱日期':false};
TC['fcl-booking'].fieldChangeHandlers={
    '是否危险品':'fclBookingToggleDangerous()',
    'Shipper':'fclBookingFillParty(this)',
    'Consignee':'fclBookingFillParty(this)',
    'Notify':'fclBookingFillParty(this)'
};
/* 弹窗渲染完设置危险品区块初始显隐 */
TC['fcl-booking'].afterModalRender='fclBookingAfterModalRender';

/* 危险品明细字段：勾选「是否危险品」时才显示并必填（SOP 7.4） */
var FCL_DG_FIELDS=['UN编号','危险类别','包装类别','危险品申报人'];

/* 弹窗分板块：没被任何板块认领的字段（船司/航线/港口/柜型/船名航次/ETD-ETA-ATD-ATA/约号/
 * 截补料时间/是否危险品）留在最上面的「基础信息」主栅格里。
 * 危险品信息随「是否危险品」勾选整块显隐；订舱回执信息只在查看明细里出现（见 modalFieldModes）。
 * 注意：必须写在 FCL_DG_FIELDS 赋值之后 —— var 只提升声明不提升值。 */
TC['fcl-booking'].modalSections=[
    {key:'booking',title:'订舱信息',fields:['订舱日期','订舱人','订舱方式','订舱备注']},
    {key:'master',title:'主单信息',fields:['S/O No.','放单方式','Shipper','Notify','Consignee','主单备注']},
    {key:'doc',title:'单证信息',fields:['柜号','封签号','柜重']},
    {key:'dg',title:'危险品信息',fields:FCL_DG_FIELDS},
    {key:'receipt',title:'订舱回执信息',fields:['订舱回执号','回执附件']}
];

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

/* 是否危险品（勾选框）→ 危险品信息板块整块显隐 + 明细字段必填 */
function fclBookingToggleDangerous(){
    var on=crudFieldValue('是否危险品')==='是';
    var sec=crudSection('dg');
    if(sec)sec.classList.toggle('hidden',!on);
    FCL_DG_FIELDS.forEach(function(h){crudToggleField(h,on,true);});
}

/* ===== 复制主单 =====
 * 弹窗跟「修改数据」完全一样，只是重新生成 Job No、清空委托订单号，其余字段原样保留。
 * 实现上直接复用 edit 弹窗，再在渲染完成后改这两个字段与标题/按钮，避免重写一套表单。 */
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
    var idx=getSelectedRowIndex();
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
        set('状态','已转订舱');set('审核人',who);set('审核时间',now);
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
    var map={'Job No':jobNo,'委托订单号':eg('委托订单号'),'委托类型':eg('委托类型'),
        '客户名称':eg('客户名称'),'船司':eg('船司'),'起运港':eg('起运港'),'目的港':eg('目的港'),
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

/* 10.3 补料与提单 —— 吸收原「实际录单」，并入催料字段（SOP 11.3）*/
addPrototypeTable('fcl-si-bl','补料与提单',
    '补料单号|订舱单号|提单号|柜号|补料状态|MBL/HBL|收货人|通知人|对内补料截止|对外补料截止|补料完整性|催料次数|最近催料时间|自动催料|草稿件状态|客户确认状态|改单次数|改单费|客户实单|提单费用状态|重算状态|操作',
    ['待补料','已补料','草稿确认中','已确认'],[
    ['FSB-20260613001','FBK-20260613001','HLHLA260613001','MSKU1234567','待补料','HBL','Lagos Import Ltd','Same as consignee','2026-06-16 12:00','2026-06-17 12:00','资料待补','2','2026-06-16 14:00','开启','待生成','待确认','0','0','已绑定','待重算','正常'],
    ['FSB-20260612002','FBK-20260612002','HLHDK260612002','COSU7654321','已确认','MBL','Dakar Trading','Dakar Notify','2026-06-17 18:00','2026-06-18 18:00','资料齐全','0','','开启','已生成','已确认','1','USD 50','已绑定','已计算','正常'],
    ['FSB-20260611003','FBK-20260611003','HLHAB260611003','CMAU9988776','草稿确认中','HBL','Abidjan Import','Abidjan Notify','2026-06-20 12:00','2026-06-21 12:00','资料齐全','1','2026-06-20 13:30','开启','已生成','待确认','0','0','未绑定','未计算','需重算']
],[
    {label:'补料单号',type:'text'},
    {label:'订舱单号',type:'text'},
    {label:'提单号',type:'text'},
    {label:'柜号',type:'text'},
    {label:'MBL/HBL',type:'select',options:['MBL','HBL']},
    {label:'补料状态',type:'select',options:['待补料','已补料','草稿确认中','已确认']},
    {label:'客户实单',type:'select',options:['已绑定','未绑定']},
    {label:'对内补料截止',type:'date'}
]);
TC['fcl-si-bl'].modalExcludedFields=['催料次数','最近催料时间','补料状态','重算状态'];
TC['fcl-si-bl'].fieldOptions={
    'MBL/HBL':['MBL','HBL'],
    '补料完整性':['资料待补','资料齐全'],
    '自动催料':['开启','关闭'],
    '草稿件状态':['待生成','已生成','已作废'],
    '客户确认状态':['待确认','已确认','要求改单'],
    '客户实单':['已绑定','未绑定'],
    '提单费用状态':['未计算','待重算','已计算'],
    '重算状态':['正常','需重算','已重算']
};

/* 9.3 应收与放单 —— 放单规则引擎字段（SOP 17.2 / 19.3）*/
addPrototypeTable('fcl-ar-release','应收与放单',
    '放单单号|账单号|订舱单号|客户名称|应收金额|已收金额|待收金额|历史欠款金额|历史未核销单数|客户黑名单|拆单标记|分批付款标记|放单判定结果|判定说明|放单方式|自动放单时间|人工审核人|放单人|放单状态|操作',
    ['待收款','部分收款','允许放单','已放单','已拦截'],[
    ['FAR-20260613001','FCB-20260613001','FBK-20260613001','深圳市华运达国际货运','4500','0','4500','0','0','否','否','否','转人工审核','当票应收未核销，待收 USD 4500','电放','','','陈七','待收款'],
    ['FAR-20260612002','FCB-20260612002','FBK-20260612002','广州远洋进出口贸易','5600','5600','0','0','0','否','否','否','自动放单','无历史欠款且当票应收已全额核销','正本寄单','2026-06-12 18:20','','周八','已放单'],
    ['FAR-20260611003','FCB-20260611003','FBK-20260611003','东莞市鑫海物流','3200','3200','0','0','2','否','是','否','转人工审核','存在历史未核销单据 2 笔；本票为拆单后部分核销，需人工确认避免循环扣单','电放','','财务主管','陈七','允许放单'],
    ['FAR-20260610004','FCB-20260610004','FBK-20260610004','上海锦程国际贸易','2800','2800','0','12000','5','是','否','是','强拦截','客户在黑名单，系统拒绝放单（SOP 19.3）','—','','','—','已拦截']
],[
    {label:'放单单号',type:'text'},
    {label:'账单号',type:'text'},
    {label:'订舱单号',type:'text'},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'客户黑名单',type:'select',options:['是','否']},
    {label:'放单判定结果',type:'select',options:['自动放单','转人工审核','强拦截']},
    {label:'放单方式',type:'select',options:['电放','正本寄单','目的港放货']},
    {label:'放单状态',type:'select',options:['待收款','部分收款','允许放单','已放单','已拦截']}
]);
TC['fcl-ar-release'].modalExcludedFields=['历史欠款金额','历史未核销单数','放单判定结果','判定说明','自动放单时间','人工审核人','放单人','放单状态'];
TC['fcl-ar-release'].fieldOptions={
    '客户名称':FCL_CUSTOMER_OPTIONS,
    '客户黑名单':['是','否'],'拆单标记':['是','否'],'分批付款标记':['是','否'],
    '放单判定结果':['自动放单','转人工审核','强拦截'],
    '放单方式':['电放','正本寄单','目的港放货']
};

/* 9.4 业绩与提成（SOP 18.1 发放三条件：收款到位 + 对账完成 + 无未关闭申诉）*/
addPrototypeTable('fcl-commission','业绩与提成',
    '提成单号|订舱单号|业务员|所属分公司|客户名称|应收金额|实际成本|毛利|毛利率|提成比例|提成金额|币别|核算月份|收款情况|对账情况|未关闭申诉数|可发放标记|发放时间|状态|操作',
    ['待核算','已核算','已发放','暂缓发放'],[
    ['FCM-20260613001','FBK-20260613001','张三','深圳分公司','深圳市华运达国际货运','4500','4120','380','8.4%','8%','30.40','USD','2026-06','未收齐','未对账','0','否','','待核算'],
    ['FCM-20260612002','FBK-20260612002','李四','广州分公司','广州远洋进出口贸易','5600','5180','420','7.5%','8%','33.60','USD','2026-06','已收齐','已对账','0','是','','已核算'],
    ['FCM-20260605003','FBK-20260605008','王五','上海分公司','东莞市鑫海物流','6200','5600','600','9.7%','8%','48.00','USD','2026-06','已收齐','已对账','1','否','','暂缓发放'],
    ['FCM-20260520004','FBK-20260520011','赵六','深圳分公司','上海锦程国际贸易','5100','4500','600','11.8%','8%','48.00','USD','2026-05','已收齐','已对账','0','是','2026-06-10','已发放']
],[
    {label:'提成单号',type:'text'},
    {label:'订舱单号',type:'text'},
    {label:'业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'所属分公司',type:'select',options:FCL_BRANCH_OPTIONS},
    {label:'核算月份',type:'text'},
    {label:'状态',type:'select',options:['待核算','已核算','已发放','暂缓发放']}
]);
TC['fcl-commission'].modalExcludedFields=['毛利','毛利率','提成金额','可发放标记','发放时间','状态'];
TC['fcl-commission'].fieldOptions={
    '业务员':FCL_SALES_OPTIONS,'所属分公司':FCL_BRANCH_OPTIONS,
    '客户名称':FCL_CUSTOMER_OPTIONS,'币别':FCL_CURRENCY_OPTIONS,
    '收款情况':['未收齐','已收齐'],'对账情况':['未对账','已对账'],'可发放标记':['是','否']
};

/* 付款管理（原「应付管理」改名）—— 补期望/实际付款时间与合并批次（SOP 16.2）*/
addPrototypeTable('fcl-payment','付款管理',
    '付款单号|请款单号|账单号|服务商|付款方式|付款金额|币别|期望付款时间|实际付款时间|付款差异天数|合并批次号|银行水单|申请人|审批人|付款状态|操作',
    ['待审批','待付款','已付款','已驳回'],[
    ['FPY-20260613001','FPR-20260613001','FCB-20260613001','MAERSK','票结','4120','USD','2026-06-25','','','','','张财务','财务主管','待审批'],
    ['FPY-20260612002','FPR-20260612002','FCB-20260612002','COSCO','月结','7640','USD','2026-06-28','2026-06-27','-1','PB-202606-001','receipt_202606_001.pdf','张财务','财务主管','已付款']
],[
    {label:'付款单号',type:'text'},
    {label:'请款单号',type:'text'},
    {label:'账单号',type:'text'},
    {label:'服务商',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'付款方式',type:'select',options:['票结','月结']},
    {label:'期望付款时间',type:'date'},
    {label:'付款状态',type:'select',options:['待审批','待付款','已付款','已驳回']}
]);
TC['fcl-payment'].modalExcludedFields=['付款差异天数','合并批次号','申请人','审批人','付款状态'];
TC['fcl-payment'].fieldOptions={'服务商':FCL_CARRIER_OPTIONS,'付款方式':['票结','月结'],'币别':FCL_CURRENCY_OPTIONS};

/* 10.4 委托订单管理（原「销售指示」）
 * 业务口径：业务员录入的销售指示即客户委托单；预录单与实单都是委托，仅「委托类型」不同。
 * 因此不再用「草稿」状态承载预录单，改为独立的委托类型字段。 */
addPrototypeTable('fcl-sales-instruction','委托订单管理',
    '委托订单号|委托类型|来源|客户名称|托书编号|托书附件|船司|柜型柜量|起运港|目的港|预计开船日|销售运费|预估成本|预估毛利|业务员|提交时间|审核人|审核时间|生成订舱单号|状态|操作',
    ['待审核','已审核','已驳回','已转订舱','已取消'],[
    ['FEO-20260613001','实单','业务员录入','深圳市华运达国际货运','BOOK-001','托书_华运达_0613.pdf','MAERSK','40HQ×1','深圳盐田','拉各斯','2026-06-20','USD 4,500','USD 4,120','USD 380','张三','2026-06-13 10:30','','','','待审核'],
    ['FEO-20260612002','实单','询盘转化','广州远洋进出口贸易','BOOK-002','托书_远洋_0612.pdf;装箱单_0612.xlsx','COSCO','20GP×2','广州南沙','达喀尔','2026-06-22','USD 5,600','USD 5,180','USD 420','李四','2026-06-12 16:00','商务主管','2026-06-12 17:10','FBK-20260612002','已转订舱'],
    ['FEO-20260611003','实单','OMS客户自助下单','东莞市鑫海物流','BOOK-003','托书_鑫海_0611.pdf','CMA CGM','40HQ×1','上海洋山','阿比让','2026-06-25','USD 6,200','USD 5,600','USD 600','王五','2026-06-11 09:20','商务主管','2026-06-11 11:00','FBK-20260611003','已转订舱'],
    ['FEO-20260613004','预录单','移动端录入','','','','MSC','40HQ×1','深圳盐田','特马','2026-07-02','','','','赵六','2026-06-13 15:40','','','','待审核'],
    ['FEO-20260610005','预录单','业务员录入','上海锦程国际贸易','','','MAERSK','40HQ×2','深圳盐田','拉各斯','2026-07-05','','','','张三','2026-06-10 09:15','商务主管','2026-06-10 10:20','','已审核'],
    ['FEO-20260608006','实单','业务员录入','广州远洋进出口贸易','BOOK-006','托书_远洋_0608.pdf','ONE','20GP×1','广州南沙','洛美','2026-06-18','USD 2,900','USD 2,760','USD 140','李四','2026-06-08 11:00','商务主管','2026-06-08 14:30','','已取消']
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
    {label:'状态',type:'select',options:['待审核','已审核','已驳回','已转订舱','已取消']}
]);
/* 委托订单号含「单号」→ 引擎按 isCode 渲染为只读自动生成；来源由系统按录入渠道自动赋值，不在弹窗显示 */
TC['fcl-sales-instruction'].modalExcludedFields=['来源','预估毛利','提交时间','审核人','审核时间','生成订舱单号','状态'];
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
 * 五、10.1 订单管理 → 整柜业务总览看板（只读，主状态分页签 + 15 节点进度灯）
 * 节点顺序：①询价 ②建档 ③销指 ④订舱 ⑤放仓 ⑥拖车 ⑦装柜 ⑧补料 ⑨报关
 *           ⑩开船 ⑪寄单 ⑫账单 ⑬付款 ⑭放单 ⑮提成
 * 图例：● 已完成   ◐ 进行中   ○ 未开始   ✖ 异常
 * ========================================================================== */
addPrototypeTable('fcl-order','整柜业务总览',
    '票单号|委托订单号|客户名称|业务员|船公司|航线|柜型柜量|船名航次|ETD|ATD|ETA|主状态|节点进度|当前责任人|超时预警|销售价|实际成本|毛利|操作',
    ['待订舱','已订舱','已放仓','操作中','已开船','在途','已到港','已完结','已取消','异常挂起'],[
    ['FBK-20260613001','FEO-20260613001','深圳市华运达国际货运','张三','MAERSK','西非线','40HQ×1','MAERSK LAGOS 026W','2026-06-20','','2026-07-18','待订舱','●●●◐○○○○○○○○○○○','刘订舱','订舱窗口 2026-06-17 18:00 截止','USD 4,500','USD 4,120','USD 380'],
    ['FBK-20260612002','FEO-20260612002','广州远洋进出口贸易','李四','COSCO','西非线','20GP×2','COSCO AFRICA 118W','2026-06-22','','2026-07-20','已放仓','●●●●●◐○○○○○○○○○','陈操作','—','USD 5,600','USD 5,180','USD 420'],
    ['FBK-20260611003','FEO-20260611003','东莞市鑫海物流','王五','CMA CGM','地中海线','40HQ×1','CMA MARSEILLE 09W','2026-06-25','','2026-07-24','操作中','●●●●●●●◐○○○○○○○','陈单证','补料对内截止 2026-06-20 12:00','USD 6,200','USD 5,600','USD 600'],
    ['FBK-20260605008','FEO-20260605008','上海锦程国际贸易','赵六','COSCO','西非线','40HQ×1','COSCO AFRICA 118W','2026-06-05','2026-06-05 23:10','2026-07-02','在途','●●●●●●●●●●○○○○○','陈操作','塞港预警：目的港拥堵','USD 5,100','USD 4,500','USD 600'],
    ['FBK-20260520011','FEO-20260520011','深圳市华运达国际货运','张三','MSC','西非线','40HQ×1','MSC ACCRA 18W','2026-05-20','2026-05-20 14:30','2026-06-17','已完结','●●●●●●●●●●●●●●●','—','—','USD 5,100','USD 4,500','USD 600'],
    ['FBK-20260610005','FEO-20260610005','广州远洋进出口贸易','李四','CMA CGM','西非线','20GP×1','CMA ABIDJAN 11W','2026-06-18','','2026-07-16','异常挂起','●●●●✖○○○○○○○○○○','刘订舱','订舱失败：船司舱位不足（FEX-20260613001）','USD 2,680','USD 2,580','USD 100']
],[
    {label:'票单号',type:'text'},
    {label:'委托订单号',type:'text'},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'船公司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'航线',type:'select',options:FCL_ROUTE_OPTIONS},
    {label:'ETD',type:'date'},
    {label:'主状态',type:'select',options:['待订舱','已订舱','已放仓','操作中','已开船','在途','已到港','已完结','已取消','异常挂起']}
]);
/* 只读看板：不新增、不编辑、不删除；行内仅「查看」（进入票单360） */
TC['fcl-order'].noAutoAudit=true;

/* ==========================================================================
 * 六、票单 360 详情（总览看板行内「查看」入口）
 * ========================================================================== */
var FCL_TIMELINE_NODES=[
    {n:'①',label:'询价/报价',role:'业务员'},
    {n:'②',label:'客户建档',role:'业务员'},
    {n:'③',label:'委托订单',role:'业务员/商务'},
    {n:'④',label:'订舱',role:'订舱员'},
    {n:'⑤',label:'放仓',role:'订舱员'},
    {n:'⑥',label:'拖车',role:'操作员'},
    {n:'⑦',label:'进仓装柜',role:'仓库/操作员'},
    {n:'⑧',label:'补料/提单',role:'操作员/单证员'},
    {n:'⑨',label:'报关',role:'报关员'},
    {n:'⑩',label:'开船/轨迹',role:'系统'},
    {n:'⑪',label:'寄单',role:'操作员/深圳前台'},
    {n:'⑫',label:'账单',role:'操作员/财务'},
    {n:'⑬',label:'付款',role:'财务(应付)'},
    {n:'⑭',label:'应收/放单',role:'财务(应收)'},
    {n:'⑮',label:'提成',role:'深圳财务'}
];

function fclNodeStateMeta(ch){
    if(ch==='●')return {cls:'bg-green-500',text:'text-green-700',label:'已完成'};
    if(ch==='◐')return {cls:'bg-primary-500',text:'text-primary-700',label:'进行中'};
    if(ch==='✖')return {cls:'bg-red-500',text:'text-red-700',label:'异常'};
    return {cls:'bg-surface-300',text:'text-text-muted',label:'未开始'};
}

function openFclOrderDetail(id,rowIdx){
    var c=TC[id]||{};
    var row=(c.d&&c.d[rowIdx])||[];
    var g=function(h){return getTableValueByHeader(c,row,h,'')||'—';};
    var progress=String(getTableValueByHeader(c,row,'节点进度','')||'');
    var html='';

    html+='<div class="flex gap-5">';

    /* 左侧：15 节点时间轴 */
    html+='<div class="w-64 shrink-0 border border-surface-200 rounded-xl p-4 bg-surface-50">';
    html+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('全链路节点')+'</div>';
    FCL_TIMELINE_NODES.forEach(function(node,i){
        var meta=fclNodeStateMeta(progress.charAt(i)||'○');
        html+='<div class="flex items-start gap-2.5 pb-2.5">';
        html+='<div class="flex flex-col items-center shrink-0">';
        html+='<span class="w-2.5 h-2.5 rounded-full '+meta.cls+'"></span>';
        if(i<FCL_TIMELINE_NODES.length-1)html+='<span class="w-px flex-1 min-h-[14px] bg-surface-300"></span>';
        html+='</div>';
        html+='<div class="leading-tight">';
        html+='<div class="text-xs font-medium '+meta.text+'">'+node.n+' '+esc(tr(node.label))+'</div>';
        html+='<div class="text-[11px] text-text-muted">'+esc(tr(node.role))+' · '+esc(tr(meta.label))+'</div>';
        html+='</div></div>';
    });
    html+='</div>';

    /* 右侧：基本信息 + 当前环节 + 页签 */
    html+='<div class="flex-1 min-w-0 flex flex-col gap-4">';

    html+='<div class="border border-surface-200 rounded-xl p-4">';
    html+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('基本信息')+'</div>';
    html+='<div class="grid grid-cols-4 gap-x-5 gap-y-3">';
    [['票单号','票单号'],['委托订单号','委托订单号'],['客户名称','客户名称'],['业务员','业务员'],
     ['船公司','船公司'],['航线','航线'],['柜型柜量','柜型柜量'],['船名航次','船名航次'],
     ['ETD','ETD'],['ATD','ATD'],['ETA','ETA'],['当前责任人','当前责任人']].forEach(function(p){
        html+='<div><div class="text-[11px] text-text-muted mb-0.5">'+esc(tr(p[0]))+'</div>'+
              '<div class="text-sm text-text-primary break-all">'+esc(g(p[1]))+'</div></div>';
    });
    html+='</div></div>';

    html+='<div class="border border-surface-200 rounded-xl p-4">';
    html+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('当前环节与预警')+'</div>';
    html+='<div class="grid grid-cols-3 gap-x-5 gap-y-3">';
    html+='<div><div class="text-[11px] text-text-muted mb-0.5">'+tr('主状态')+'</div><div class="text-sm">'+statusBadge(getTableValueByHeader(c,row,'主状态',''))+'</div></div>';
    html+='<div class="col-span-2"><div class="text-[11px] text-text-muted mb-0.5">'+tr('超时预警')+'</div><div class="text-sm text-red-600">'+esc(g('超时预警'))+'</div></div>';
    html+='</div>';
    html+='<div class="mt-3 flex flex-wrap gap-2">';
    [['Job/主单管理','fcl-booking'],['放仓作业','fcl-release'],['拖车安排','fcl-truck'],['进仓装柜','fcl-load'],
     ['补料与提单','fcl-si-bl'],['报关申报','fcl-customs'],['开船与轨迹','fcl-sailing-track'],['寄单作业','fcl-doc-send']].forEach(function(p){
        html+='<button type="button" class="h-7 px-3 text-xs rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 cursor-pointer" '+
              'onclick="closeCrudModal();navigateToTab(\'fcl\',\''+p[1]+'\')">'+esc(tr(p[0]))+'</button>';
    });
    html+='</div></div>';

    html+='<div class="border border-surface-200 rounded-xl p-4">';
    html+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('费用与毛利')+'</div>';
    html+='<div class="grid grid-cols-3 gap-x-5">';
    [['销售价','销售价'],['实际成本','实际成本'],['毛利','毛利']].forEach(function(p){
        html+='<div><div class="text-[11px] text-text-muted mb-0.5">'+esc(tr(p[0]))+'</div>'+
              '<div class="text-base font-semibold text-blue-700">'+esc(g(p[1]))+'</div></div>';
    });
    html+='</div></div>';

    html+='</div></div>';

    openSimpleInfoModal(tr('票单360')+' - '+esc(g('票单号')),html,'80%');
}

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
          '填写发货人、收货人、通知人、品名、HS code、货重、柜型柜量、约号','提交后登记船公司订舱回执号'],
 output:'订舱单 FBK + 订舱回执号；状态 已订舱',
 sla:'船公司订舱回执 ≤ 24 小时',
 caution:'危险品必须勾选「是否危险品」并填 UN 编号、危险类别、包装类别、申报人，其船司结单时间早于普货，需提前规划、进仓与普货分开存放。',
 tabs:[['Job/主单管理','fcl-booking','fcl'],['放仓作业','fcl-release','fcl']]},

{no:'⑤',name:'放仓作业',sop:'SOP-FCL-05',stage:'ops',role:'订舱员（主导）、操作员（协同）',
 trigger:'船公司确认舱位并发出放仓邮件（一般 1~2 个工作日）',
 actions:['放仓邮件自动接入或人工上传，系统识别港口 + 船公司并匹配放仓模板',
          '按模板自动删除船司价格等敏感信息、添加瞒报告示、套用客户放仓模板',
          '自动填充船名航次、起运港、目的港、ETD、约号、关务联系人','核对后点击「放仓发送」发给客户'],
 output:'客户专用放仓件；状态 已放仓；同时对内提醒拖车、报关、补料',
 sla:'放仓邮件接收 ≤ 48 小时',
 caution:'放仓模板是本环节核心，按「船公司 × 目的港」维护，含对外/对内结单时间（对内一般早 1 天）。危险品需单独一套模板。',
 tabs:[['放仓作业','fcl-release','fcl'],['放仓模板','fcl-release-tpl','biz-cfg']]},

{no:'⑥',name:'拖车安排',sop:'SOP-FCL-06',stage:'ops',role:'操作员（主导）、拖车行、财务（对账）',
 trigger:'放仓完成',
 actions:['录入拖车委托单：装柜时间、专柜地址、联系人、电话、备注','询价并选择拖车行（拼箱偏固定、整柜按 VIP 等级与摊位紧张度安排）',
          '发送拖车委托单给拖车行','业务员录入向客户收取的拖车应收（毛利计算需要）','拖车行自助录入实际费用，或月底对账后录入实际成本'],
 output:'拖车委托单 FTR；状态 拖车费用已确认',
 sla:'—',
 caution:'目标是让供应商自助录入，把财务对账工作量降低约 70%。',
 tabs:[['拖车安排','fcl-truck','fcl']]},

{no:'⑦',name:'进仓装柜',sop:'SOP-FCL-07',stage:'ops',role:'操作员（监督）、仓库操作员（执行）',
 trigger:'拖车提柜到仓，货物到仓',
 actions:['系统按时间节点自动提醒：进仓日 / 装柜日 / 报关截止日','货物到仓扫描入库，登记件数、毛重',
          '装柜时用 PDA 逐件扫描，系统记录装柜清单','装柜完成拍照存档（封柜照、铅封号特写）','回填铅封号'],
 output:'装柜单 FLD + 装柜清单 + 封柜照；状态 已进仓 / 已装柜',
 sla:'—',
 caution:'业务联系单不再打印，改由系统按时间节点自动生成任务与提醒，实现无纸化。',
 tabs:[['进仓装柜','fcl-load','fcl'],['仓库PDA','pda-app','warehouse-pda']]},

{no:'⑧',name:'补料与提单',sop:'SOP-FCL-08',stage:'ops',role:'操作员（主导）、单证员（制单）、客户（确认）',
 trigger:'装柜完成，临近船公司补料截止日',
 actions:['客户按对内截止日提供补料（SI + 装箱单 + 报关资料）','到内部截止时间仍未收到 → 系统自动发催料邮件并记录催料次数',
          '核对补料完整性后录入 SI；已对接 API 的走 EDI 自动推送，未对接的手工登录船司官网',
          '船公司预生成草稿件 → 下载转发客户核对 → 客户确认或提出改单（可能产生改单费）',
          '开船后 7 天内船公司签发正本 / 电放件，正本提单存档（草稿件无需存档）'],
 output:'补料单 FSB + 提单号 + 柜号；状态 已补料 → 提单已确认 → 提单已签发',
 sla:'对内截止比对外提前 1 天（留 3~4 小时操作时间）；草稿件确认 ≤ 12 小时',
 caution:'拆单（1 MBL 拆多 HBL）遵循船公司拆单逻辑；并单（多 HBL 合 1 MBL）可合并申报节省费用。拆单产生的 HBL 会打拆单标记，放单时强制转人工审核。',
 tabs:[['补料与提单','fcl-si-bl','fcl'],['拆单并单管理','fcl-bl-split-merge','fcl']]},

{no:'⑨',name:'报关申报',sop:'SOP-FCL-09',stage:'ops',role:'报关员（主导）、报关行（执行）',
 trigger:'装柜完成',
 actions:['整理客户提供的报关资料（合同、发票、装箱单、报关委托书）','上传报关资料到系统，客户可自行下载报关放行单',
          '线下对接报关行，选择报关方式：单独 / 合并 / 拆分 / 买单','查验时登记查验信息并通知相关人员；放行后上传放行单',
          '录入每票报关费（不固定，按报关类型标记收费逻辑）'],
 output:'报关单 FCD + 放行单；状态 已申报 / 查验中 / 已放行',
 sla:'—',
 caution:'当前为线下对接、逐票录入费用；月结由财务统一与报关行对账。报关行 API 属远期规划。',
 tabs:[['报关申报','fcl-customs','fcl']]},

{no:'⑩',name:'开船与轨迹',sop:'SOP-FCL-10',stage:'ops',role:'操作员（监控）、客服（通知）、系统',
 trigger:'船舶离港',
 actions:['系统每日轮询船公司 API / 船讯网，抓取装船、开船、在途、抵港、卸船五类节点',
          '对比预计与实际开船日期，偏差超阈值触发异常预警','自动推送进度邮件给客户（补料时已绑定客户邮箱）',
          '船期变更（换船 / 推迟 / 跳港）时自动识别受影响订单，更新船名航次并一键群发通知','抵港后通知客户准备清关'],
 output:'轨迹单 FTK + 轨迹节点记录；状态 已开船 / 在途 / 已到港',
 sla:'—',
 caution:'四类异常预警：开船延误、跳港、塞港、船公司换船。开船延误产生的额外费用可作为账单申诉依据。',
 tabs:[['开船与轨迹','fcl-sailing-track','fcl'],['异常处理','fcl-exception','fcl']]},

{no:'⑪',name:'寄单作业',sop:'SOP-FCL-11',stage:'ops',role:'操作员（发起）、深圳前台（执行）',
 trigger:'提单已签发且应收已核销放单',
 actions:['发起「寄单申请」，填写收件地址、收件人、电话，勾选快递公司与备注',
          '系统以任务流自动通知深圳前台同事','前台打包提单寄出并回填快递单号','系统记录快递单号并自动通知客户'],
 output:'寄单单 FDS + 快递单号；状态 待寄单 → 已寄出 → 已签收',
 sla:'深圳前台当日寄出',
 caution:'原流程靠邮件单向操作、深圳同事邮件量大；改为系统任务流后直接在系统看任务、回填单号并自动反馈客户。',
 tabs:[['寄单作业','fcl-doc-send','fcl']]},

{no:'⑫',name:'账单管理',sop:'SOP-FCL-12',stage:'fin',role:'操作员（录入）、财务（对账）',
 trigger:'船公司账单送达（邮件 PDF 或官网下载）',
 actions:['优先 OCR 识别上传的 PDF，自动提取费用项并映射到预设模板；API 对接后可自动获取；人工录入作兜底',
          '对照预估成本识别差异（金额、附加费、汇率等），系统自动标记差异','差异在合理范围 → 确认入账；差异异常 → 走申诉流程',
          '实际支付与负数费用录入（便于抵扣）'],
 output:'实际费用 FBE / 导入批次 FBI / 对比单 FCMP / 申诉单 FAP；状态 账单已确认 或 申诉中',
 sla:'船公司账单录入 ≤ 2 个工作日',
 caution:'申诉务必「先付款后申诉」，避免逾期影响后续业务。MAC 申诉周期约 3 个月，系统在到期前 7/3/1 天三次提醒，超期自动置「超期未处理」。',
 tabs:[['实际费用管理','fcl-bill-entry','fcl'],['账单导入','fcl-actual-bill-import','fcl'],['船公司账单对比','fcl-carrier-bill-compare','fcl'],['账单申诉','fcl-appeal','fcl']]},

{no:'⑬',name:'付款管理',sop:'SOP-FCL-13',stage:'fin',role:'操作员（请款）、财务（审核与付款）',
 trigger:'账单确认无误',
 actions:['录入请款单：船东、币种、金额、付款用途、期望付款时间、收款账号','财务审核请款单（金额、付款期限、资金计划）',
          '同一船东 + 同一币种的多笔请款合并付款，节省手续费','付款后录入实际付款时间 + 银行水单','系统自动核销该笔应付并通知操作员'],
 output:'请款单 FPR → 付款单 FPY；状态 已付款 → 已核销',
 sla:'CMA 开船日 +10 天；其他船公司约 +14 天',
 caution:'期望付款时间由操作录入、提交后不可改；实际付款时间由财务录入。系统按两者差异做资金盘点。票结由操作部逐票发起，月结由财务按月汇总。',
 tabs:[['请款单管理','fcl-payment-request','fcl'],['付款管理','fcl-payment','fcl'],['整柜应付账单','fcl-bill','fcl']]},

{no:'⑭',name:'应收与放单',sop:'SOP-FCL-14',stage:'fin',role:'财务（应收）、操作员（发起放单）',
 trigger:'客户付款到账 / 操作员发起放单申请',
 actions:['银行流水自动接入并与应收单匹配，不能自动匹配的由财务手工认领','核销应收并标记已收款',
          '发起放单申请时系统展示该客户的应收、已收、未收与历史核销情况',
          '无欠款且当票应收已核销 → 自动放单；有历史未核销 → 转财务人工审核；黑名单客户 → 强拦截'],
 output:'放单单 FAR；状态 已核销 / 已放单，随后进入寄单流程',
 sla:'客户付款 → 自动放单 ≤ 2 小时',
 caution:'避免循环扣单：拆单后部分核销、分批付款等特殊情况必须识别出来转人工并高亮提醒。',
 tabs:[['应收与放单','fcl-ar-release','fcl'],['银行流水管理','fcl-bank-flow','fcl']]},

{no:'⑮',name:'业绩与提成',sop:'SOP-FCL-15',stage:'fin',role:'深圳财务（核算与发放）、业务员（查看）',
 trigger:'毛利结算完成、收款到位',
 actions:['系统按「毛利 = 应收 − 成本」核算，成本取实际账单金额','校验发放三条件：收款到位 + 财务对账完成 + 该票无未关闭申诉',
          '满足条件的置为「可发放」，由深圳财务确认发放','业务员随时查看应收款、公司成本、利润与提成预估，并可逐票与自己的记账核对'],
 output:'提成单 FCM；状态 待核算 → 已核算 → 已发放',
 sla:'—',
 caution:'存在未关闭申诉的票单不可核算提成。业绩可视化的目的是让业务员能对照核对，简化工作并加深对财务的信任。',
 tabs:[['业绩与提成','fcl-commission','fcl'],['整柜业务总览','fcl-order','fcl']]}
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
    ['Job/主单管理','fcl-booking','fcl','整柜全链路主档；弹窗按 基础/订舱/主单/单证 分板块，危险品明细随勾选显隐'],
    ['放仓作业','fcl-release','fcl','船司放仓邮件解析、敏感信息剥离与放仓件发送']]},
{group:'④ 操作执行',hint:'操作员、单证员、报关员分岗作业',items:[
    ['拖车安排','fcl-truck','fcl','拖车委托单、拖车行选择与实际费用登记'],
    ['进仓装柜','fcl-load','fcl','进仓登记、PDA 扫描装柜、封柜照与铅封号'],
    ['补料与提单','fcl-si-bl','fcl','SI 录入、催料、草稿件确认、实单绑定与费用重算'],
    ['拆单并单管理','fcl-bl-split-merge','fcl','M 单拆 H 单 / H 单合 M 单，含费用分摊'],
    ['报关申报','fcl-customs','fcl','报关资料、报关方式、查验登记与放行单'],
    ['开船与轨迹','fcl-sailing-track','fcl','ETD/ATD/ETA、轨迹节点与四类异常预警'],
    ['寄单作业','fcl-doc-send','fcl','寄单任务流、快递单号回填与客户通知']]},
{group:'⑤ 财务与结算',hint:'应付链 → 应收链 → 提成',items:[
    ['实际费用管理','fcl-bill-entry','fcl','船司实际费用逐项录入与确认'],
    ['账单导入','fcl-actual-bill-import','fcl','按模板批量导入船司账单，显示匹配数与差异数'],
    ['船公司账单对比','fcl-carrier-bill-compare','fcl','系统应付 vs 船司账单，自动标记差异'],
    ['账单申诉','fcl-appeal','fcl','争议金额、申诉周期、到期提醒与超期未处理'],
    ['整柜应付账单','fcl-bill','fcl','按服务商汇总的应付账单'],
    ['请款单管理','fcl-payment-request','fcl','期望付款时间、最晚付款期限与合并付款'],
    ['付款管理','fcl-payment','fcl','付款执行、实际付款时间与银行水单'],
    ['应收与放单','fcl-ar-release','fcl','放单判定：自动放单 / 人工审核 / 黑名单强拦截'],
    ['银行流水管理','fcl-bank-flow','fcl','流水自动匹配与手工认领'],
    ['业绩与提成','fcl-commission','fcl','毛利、提成预估与发放三条件校验']]},
{group:'⑥ 监控与看板',hint:'跨环节视角',items:[
    ['整柜业务总览','fcl-order','fcl','一票一行 + 15 节点进度灯，双击查看票单360'],
    ['异常处理','fcl-exception','fcl','订舱失败、报关异常等业务链路异常单'],
    ['SLA与KPI','fcl-sla-kpi','fcl','各环节时效达成率与岗位 KPI 监控']]},
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

function fclGuideStats(){
    var c=TC['fcl-order']||{},rows=c.d||[],si=(c.h||[]).indexOf('主状态');
    var cnt=function(s){return si<0?0:rows.filter(function(r){return r[si]===s;}).length;};
    return [
        {label:'在途票单总数',val:rows.length,cls:'text-primary-700'},
        {label:'待订舱',val:cnt('待订舱'),cls:'text-orange-600'},
        {label:'操作中',val:cnt('操作中'),cls:'text-blue-600'},
        {label:'异常挂起',val:cnt('异常挂起'),cls:'text-red-600'}
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
       '<span class="text-xs text-text-muted">'+tr('SOP 第二十一章；异常登记入口见「监控与看板 → 异常处理」')+'</span></div>';
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
    h+='<div class="mt-3 flex gap-2">'+fclGuideChip('异常处理','fcl-exception','fcl')+fclGuideChip('SLA与KPI','fcl-sla-kpi','fcl')+'</div>';
    h+='</div>';

    h+='</div>';
    return h;
}

/* 工具栏「票单360」：取勾选行；未勾选则提示 */
function openSelectedFclOrderDetail(id){
    var idx=getSelectedRowIndex();
    if(idx<0){showToast(tr('请先勾选一条数据'));return;}
    openFclOrderDetail(id,idx);
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
