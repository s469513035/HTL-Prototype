/* ==========================================================================
 * 整柜业务重构（DES-FCL-V1.0 一期）
 * 依据：《好利航物流-整柜业务功能重构设计方案》
 * 主线收敛：销售指示 FSI → 订仓单 FBK（全链路主档）→ 各作业单
 *
 * 本文件排在 05-tables-build.js 之后加载，只做两件事：
 *   1) 注册 6 张新表（仓位管理 / 放仓模板 / 订仓窗口 / 拆并单 / 账单申诉 / 请款单）
 *   2) 覆写既有 fcl-* 表（合并、字段扩展、总览看板改造）
 * 注意：addPrototypeTable 会整体覆写 TC[id]，因此 pageMode / readonlyList /
 *       modalExcludedFields / fieldOptions 一律在覆写之后重新设置。
 * ========================================================================== */

var FCL_CARRIER_OPTIONS=['MAERSK','COSCO','CMA CGM','MSC','ONE','Hapag-Lloyd'];
var FCL_ROUTE_OPTIONS=['西非线','东非线','南非线','地中海线','中东线'];
var FCL_SALES_OPTIONS=['张三','李四','王五','赵六'];

/* ==========================================================================
 * 一、③ 订仓与仓位 —— 新增模块
 * ========================================================================== */

/* 8.1 仓位管理（SOP 7.5 / 19.2）
 * 仓位公开给商务/订仓员，业务之间默认不可见；商务有统一管理权。 */
addPrototypeTable('fcl-slot','仓位管理',
    '仓位编号|船公司|航线|起运港|目的港|柜型|船名航次|ETD|仓位类型|预定仓量|实单占用|已放仓|未放仓|放仓上限|占用业务员|所属分公司|释放数量|更新时间|状态|操作',
    ['预定中','部分放仓','已放仓','已释放','已过期'],[
    ['FSL-20260613001','MAERSK','西非线','深圳盐田','拉各斯','40HQ','MAERSK LAGOS 026W','2026-06-20','预定仓','10','6','6','4','15','张三','深圳分公司','0','2026-06-13 14:20','部分放仓'],
    ['FSL-20260612002','COSCO','西非线','广州南沙','达喀尔','20GP','COSCO AFRICA 118W','2026-06-22','实单订仓','4','4','4','0','10','李四','广州分公司','0','2026-06-12 17:05','已放仓'],
    ['FSL-20260611003','CMA CGM','地中海线','上海洋山','阿比让','40HQ','CMA MARSEILLE 09W','2026-06-25','预定仓','8','2','0','8','12','王五','上海分公司','3','2026-06-13 09:40','预定中'],
    ['FSL-20260605004','MSC','西非线','深圳盐田','特马','40HQ','MSC ACCRA 22W','2026-06-08','预定仓','6','0','0','6','12','赵六','深圳分公司','6','2026-06-07 18:00','已释放']
],[
    {label:'仓位编号',type:'text'},
    {label:'船公司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'航线',type:'select',options:FCL_ROUTE_OPTIONS},
    {label:'起运港',type:'select',options:FCL_POL_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'柜型',type:'select',options:FCL_CONTAINER_OPTIONS},
    {label:'仓位类型',type:'select',options:['预定仓','实单订仓']},
    {label:'占用业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'所属分公司',type:'select',options:FCL_BRANCH_OPTIONS},
    {label:'ETD',type:'date'},
    {label:'状态',type:'select',options:['预定中','部分放仓','已放仓','已释放','已过期']}
]);
TC['fcl-slot'].modalExcludedFields=['未放仓','释放数量','更新时间','状态'];
TC['fcl-slot'].fieldOptions={
    '船公司':FCL_CARRIER_OPTIONS,'航线':FCL_ROUTE_OPTIONS,
    '起运港':FCL_POL_OPTIONS,'目的港':FCL_POD_OPTIONS,
    '柜型':FCL_CONTAINER_OPTIONS,'仓位类型':['预定仓','实单订仓'],
    '占用业务员':FCL_SALES_OPTIONS,'所属分公司':FCL_BRANCH_OPTIONS
};

/* 8.3 订仓窗口提醒（SOP 7.6：窗口开始前 60 分钟 + 截止前 30 分钟两次提醒） */
addPrototypeTable('fcl-booking-window','订仓窗口提醒',
    '窗口编号|船公司|航线|起运港|目的港|柜型|船名航次|窗口开始时间|窗口截止时间|提前提醒1(分钟)|提前提醒2(分钟)|通知对象|通知方式|最近触发时间|触发次数|启用状态|操作',
    ['未开始','进行中','已截止','已停用'],[
    ['FBW-20260613001','MAERSK','西非线','深圳盐田','拉各斯','40HQ','MAERSK LAGOS 026W','2026-06-14 09:00','2026-06-17 18:00','60','30','刘订仓 / 订仓主管','站内消息+邮件','2026-06-13 08:00','1','进行中'],
    ['FBW-20260612002','COSCO','西非线','广州南沙','达喀尔','20GP','COSCO AFRICA 118W','2026-06-15 10:00','2026-06-18 17:30','60','30','赵订仓','站内消息','','0','未开始'],
    ['FBW-20260608003','MSC','西非线','深圳盐田','特马','40HQ','MSC ACCRA 22W','2026-06-06 09:00','2026-06-09 18:00','60','30','刘订仓','站内消息+企业微信','2026-06-09 17:30','2','已截止']
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
    ['FRT-002','COSCO','达喀尔','广州南沙','20GP','否','2026-06-18 18:00','2026-06-17 18:00','1','严禁瞒报品名，如实申报货物信息','达喀尔非基港，需确认转运费','SI;装箱单;报关资料','船司价格;内部说明;船司内部编号','周关务 / 13900139002','启用','订仓主管','2026-06-12 16:30'],
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
    '拆并单号|操作类型|订仓单号|源提单号|目标提单号|船公司|拆分方式|拆分合并数量|收货人明细|关联报关方式|费用分摊方式|操作人|操作时间|状态|操作',
    ['草稿','已提交','已完成','已撤销'],[
    ['FBS-20260613001','拆单(M拆H)','FBK-20260613001','HLHLA260613001','HLHLA260613001-A;HLHLA260613001-B','MAERSK','按柜量拆分','2','Lagos Import Ltd;Lagos Trading Co','拆分报关','按柜','陈单证','2026-06-13 15:40','已完成'],
    ['FBS-20260612002','并单(H合M)','FBK-20260612002','HLHDK260612002;HLHDK260612003','HLHDK260612100','COSCO','人工指定合并','2','Dakar Trading','合并报关','按票','周单证','2026-06-12 17:20','已提交'],
    ['FBS-20260611003','拆单(M拆H)','FBK-20260611003','HLHAB260611003','待生成','CMA CGM','按费用拆分','3','Abidjan Import;Abidjan Retail;Abidjan Logistics','拆分报关','按重量','陈单证','2026-06-11 11:10','草稿']
],[
    {label:'拆并单号',type:'text'},
    {label:'操作类型',type:'select',options:['拆单(M拆H)','并单(H合M)']},
    {label:'订仓单号',type:'text'},
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
    '申诉单号|关联账单号|对比单号|订仓单号|船公司|申诉类型|申诉原因|争议金额|币别|账单付款情况|提交人|提交时间|申诉周期(天)|到期日|剩余天数|处理结果|结果金额|关闭时间|状态|操作',
    ['草稿','申诉中','已通过','已驳回','超期未处理','已关闭'],[
    ['FAP-20260613001','FBE-20260613001','FCMP-20260613001','FBK-20260613001','MAERSK','附加费多计','船司在表价外多计塞港费 USD 80，与放仓时报价不符','80','USD','已付款','张财务','2026-06-13 16:10','90','2026-09-11','90','','','','申诉中'],
    ['FAP-20260605002','FBE-20260605008','FCMP-20260605008','FBK-20260605008','COSCO','开船延误产生的额外费用','实际开船晚于ETD 6天，产生滞港费 USD 240','240','USD','已付款','张财务','2026-06-05 10:30','90','2026-09-03','82','抵扣下次账单','240','','已通过'],
    ['FAP-20260228003','FBE-20260228011','FCMP-20260228011','FBK-20260228011','MSC','汇率差异','账单按月初汇率结算，与合同约定的开船日汇率不一致','156','USD','已付款','张财务','2026-02-28 09:20','90','2026-05-29','-95','','','','超期未处理'],
    ['FAP-20260610004','FBE-20260610005','FCMP-20260610005','FBK-20260610005','CMA CGM','重复计费','文件费重复收取两次','60','USD','未付款','张财务','2026-06-10 14:00','90','2026-09-08','87','','','','草稿']
],[
    {label:'申诉单号',type:'text'},
    {label:'关联账单号',type:'text'},
    {label:'订仓单号',type:'text'},
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
    '请款单号|关联账单号|订仓单号|船东/服务商|币别|请款金额|付款用途|结算方式|期望付款时间|最晚付款期限|收款账号|开户行|申请人|申请时间|审批人|审批时间|合并批次号|实际付款时间|付款差异天数|状态|操作',
    ['待提交','请款待审批','审批通过待付款','已合并','已付款','已驳回'],[
    ['FPR-20260613001','FBE-20260613001','FBK-20260613001','MAERSK','USD','4120','海运费','票结','2026-06-25','2026-06-30','DE89370400440532013000','Maersk Bank HK','陈操作','2026-06-13 16:30','','','','','','请款待审批'],
    ['FPR-20260612002','FBE-20260612002','FBK-20260612002','COSCO','USD','5180','海运费','月结','2026-06-28','2026-07-06','CN45012345678901234567','中国银行深圳分行','陈操作','2026-06-12 18:00','财务主管','2026-06-13 09:15','PB-202606-001','2026-06-27','-1','已付款'],
    ['FPR-20260611003','FBE-20260611003','FBK-20260611003','COSCO','USD','2460','附加费','月结','2026-06-28','2026-07-06','CN45012345678901234567','中国银行深圳分行','陈操作','2026-06-11 15:20','财务主管','2026-06-13 09:15','PB-202606-001','2026-06-27','-1','已合并'],
    ['FPR-20260610004','FBE-20260610004','FBK-20260610004','MSC','USD','3860','海运费','票结','2026-06-20','2026-06-22','MSC8899001122334455','MSC Bank Geneva','陈操作','2026-06-10 11:00','财务主管','2026-06-11 10:00','','','','审批通过待付款']
],[
    {label:'请款单号',type:'text'},
    {label:'关联账单号',type:'text'},
    {label:'订仓单号',type:'text'},
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

/* 10.2 订仓作业 —— 升为全链路主档，合并原「订舱单管理」字段，
 *      移除环形外键（不再存订单号），并入危险品区块（SOP 7.4）。 */
addPrototypeTable('fcl-booking','订仓作业',
    '订仓单号|销售指示号|仓位类型|客户名称|船司|航线|起运港|目的港|柜型柜量|船名航次|ETD|订仓回执号|约号|截补料时间|订仓方式|是否危险品|UN编号|危险类别|包装类别|危险品申报人|关联仓位编号|订仓员|备注|订仓状态|操作',
    ['待订仓','已订仓','订仓失败','取消订仓'],[
    ['FBK-20260613001','FSI-20260613001','实单订仓','深圳市华运达国际货运','MAERSK','西非线','深圳盐田','拉各斯','40HQ×1','MAERSK LAGOS 026W','2026-06-20','','MSK-CN-2026-8891','2026-06-17 12:00','EDI','否','','','','','FSL-20260613001','刘订仓','客户要求本航次务必装出','待订仓'],
    ['FBK-20260612002','FSI-20260612002','实单订仓','广州远洋进出口贸易','COSCO','西非线','广州南沙','达喀尔','20GP×2','COSCO AFRICA 118W','2026-06-22','COSU778812','COS-CN-2026-4412','2026-06-18 18:00','官网','否','','','','','FSL-20260612002','赵订仓','船司已确认舱位','已订仓'],
    ['FBK-20260611003','FSI-20260611003','实单订仓','东莞市鑫海物流','CMA CGM','地中海线','上海洋山','阿比让','40HQ×1','CMA MARSEILLE 09W','2026-06-25','','CMA-CN-2026-3320','2026-06-21 12:00','EDI','是','UN3480','9类 锂电池','PI965','李申报','FSL-20260611003','刘订仓','危险品，结单时间早于普货48小时','待订仓'],
    ['FBK-20260610004','','预定仓','','MSC','西非线','深圳盐田','特马','40HQ×2','MSC ACCRA 23W','2026-07-02','MSCU334455','','2026-06-28 12:00','官网','否','','','','','FSL-20260610004','赵订仓','预定仓，无费用产生、无需财务审核','已订仓']
],[
    {label:'订仓单号',type:'text'},
    {label:'销售指示号',type:'text'},
    {label:'仓位类型',type:'select',options:['预定仓','实单订仓']},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'船司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'航线',type:'select',options:FCL_ROUTE_OPTIONS},
    {label:'起运港',type:'select',options:FCL_POL_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'是否危险品',type:'select',options:['是','否']},
    {label:'ETD',type:'date'},
    {label:'订仓状态',type:'select',options:['待订仓','已订仓','订仓失败','取消订仓']}
]);
TC['fcl-booking'].modalExcludedFields=['订仓回执号','订仓状态'];
TC['fcl-booking'].fieldOptions={
    '仓位类型':['预定仓','实单订仓'],
    '客户名称':FCL_CUSTOMER_OPTIONS,
    '船司':FCL_CARRIER_OPTIONS,
    '航线':FCL_ROUTE_OPTIONS,
    '起运港':FCL_POL_OPTIONS,
    '目的港':FCL_POD_OPTIONS,
    '柜型柜量':['20GP×1','20GP×2','40GP×1','40HQ×1','40HQ×2'],
    '订仓方式':['EDI','官网','邮件','电话','外配同行','一代'],
    '是否危险品':['是','否'],
    '危险类别':['1类 爆炸品','3类 易燃液体','8类 腐蚀品','9类 锂电池'],
    '包装类别':['I类','II类','III类','PI965','PI967'],
    '订仓员':['刘订仓','赵订仓']
};

/* 10.3 补料与提单 —— 吸收原「实际录单」，并入催料字段（SOP 11.3）*/
addPrototypeTable('fcl-si-bl','补料与提单',
    '补料单号|订仓单号|提单号|柜号|补料状态|MBL/HBL|收货人|通知人|对内补料截止|对外补料截止|补料完整性|催料次数|最近催料时间|自动催料|草稿件状态|客户确认状态|改单次数|改单费|客户实单|提单费用状态|重算状态|操作',
    ['待补料','已补料','草稿确认中','已确认'],[
    ['FSB-20260613001','FBK-20260613001','HLHLA260613001','MSKU1234567','待补料','HBL','Lagos Import Ltd','Same as consignee','2026-06-16 12:00','2026-06-17 12:00','资料待补','2','2026-06-16 14:00','开启','待生成','待确认','0','0','已绑定','待重算','正常'],
    ['FSB-20260612002','FBK-20260612002','HLHDK260612002','COSU7654321','已确认','MBL','Dakar Trading','Dakar Notify','2026-06-17 18:00','2026-06-18 18:00','资料齐全','0','','开启','已生成','已确认','1','USD 50','已绑定','已计算','正常'],
    ['FSB-20260611003','FBK-20260611003','HLHAB260611003','CMAU9988776','草稿确认中','HBL','Abidjan Import','Abidjan Notify','2026-06-20 12:00','2026-06-21 12:00','资料齐全','1','2026-06-20 13:30','开启','已生成','待确认','0','0','未绑定','未计算','需重算']
],[
    {label:'补料单号',type:'text'},
    {label:'订仓单号',type:'text'},
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
    '放单单号|账单号|订仓单号|客户名称|应收金额|已收金额|待收金额|历史欠款金额|历史未核销单数|客户黑名单|拆单标记|分批付款标记|放单判定结果|判定说明|放单方式|自动放单时间|人工审核人|放单人|放单状态|操作',
    ['待收款','部分收款','允许放单','已放单','已拦截'],[
    ['FAR-20260613001','FCB-20260613001','FBK-20260613001','深圳市华运达国际货运','4500','0','4500','0','0','否','否','否','转人工审核','当票应收未核销，待收 USD 4500','电放','','','陈七','待收款'],
    ['FAR-20260612002','FCB-20260612002','FBK-20260612002','广州远洋进出口贸易','5600','5600','0','0','0','否','否','否','自动放单','无历史欠款且当票应收已全额核销','正本寄单','2026-06-12 18:20','','周八','已放单'],
    ['FAR-20260611003','FCB-20260611003','FBK-20260611003','东莞市鑫海物流','3200','3200','0','0','2','否','是','否','转人工审核','存在历史未核销单据 2 笔；本票为拆单后部分核销，需人工确认避免循环扣单','电放','','财务主管','陈七','允许放单'],
    ['FAR-20260610004','FCB-20260610004','FBK-20260610004','上海锦程国际贸易','2800','2800','0','12000','5','是','否','是','强拦截','客户在黑名单，系统拒绝放单（SOP 19.3）','—','','','—','已拦截']
],[
    {label:'放单单号',type:'text'},
    {label:'账单号',type:'text'},
    {label:'订仓单号',type:'text'},
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
    '提成单号|订仓单号|业务员|所属分公司|客户名称|应收金额|实际成本|毛利|毛利率|提成比例|提成金额|币别|核算月份|收款情况|对账情况|未关闭申诉数|可发放标记|发放时间|状态|操作',
    ['待核算','已核算','已发放','暂缓发放'],[
    ['FCM-20260613001','FBK-20260613001','张三','深圳分公司','深圳市华运达国际货运','4500','4120','380','8.4%','8%','30.40','USD','2026-06','未收齐','未对账','0','否','','待核算'],
    ['FCM-20260612002','FBK-20260612002','李四','广州分公司','广州远洋进出口贸易','5600','5180','420','7.5%','8%','33.60','USD','2026-06','已收齐','已对账','0','是','','已核算'],
    ['FCM-20260605003','FBK-20260605008','王五','上海分公司','东莞市鑫海物流','6200','5600','600','9.7%','8%','48.00','USD','2026-06','已收齐','已对账','1','否','','暂缓发放'],
    ['FCM-20260520004','FBK-20260520011','赵六','深圳分公司','上海锦程国际贸易','5100','4500','600','11.8%','8%','48.00','USD','2026-05','已收齐','已对账','0','是','2026-06-10','已发放']
],[
    {label:'提成单号',type:'text'},
    {label:'订仓单号',type:'text'},
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

/* 10.4 销售指示 —— 升为订仓单唯一前置单据，吸收原「预录单」为草稿态（SOP-FCL-03）*/
addPrototypeTable('fcl-sales-instruction','销售指示',
    '销售指示号|来源|客户名称|托书编号|柜型柜量|起运港|目的港|预计开船日|销售运费|预估成本|预估毛利|业务员|提交时间|审核人|审核时间|生成订仓单号|状态|操作',
    ['草稿','待审核','已审核','已驳回','已转订仓','已取消'],[
    ['FSI-20260613001','业务员录入','深圳市华运达国际货运','BOOK-001','40HQ×1','深圳盐田','拉各斯','2026-06-20','USD 4,500','USD 4,120','USD 380','张三','2026-06-13 10:30','','','','待审核'],
    ['FSI-20260612002','询盘转化','广州远洋进出口贸易','BOOK-002','20GP×2','广州南沙','达喀尔','2026-06-22','USD 5,600','USD 5,180','USD 420','李四','2026-06-12 16:00','商务主管','2026-06-12 17:10','FBK-20260612002','已转订仓'],
    ['FSI-20260611003','OMS客户自助下单','东莞市鑫海物流','BOOK-003','40HQ×1','上海洋山','阿比让','2026-06-25','USD 6,200','USD 5,600','USD 600','王五','2026-06-11 09:20','商务主管','2026-06-11 11:00','FBK-20260611003','已转订仓'],
    ['FSI-20260613004','移动端录入','上海锦程国际贸易','','40HQ×1','深圳盐田','特马','2026-07-02','','','','赵六','','','','','草稿']
],[
    {label:'销售指示号',type:'text'},
    {label:'来源',type:'select',options:['业务员录入','询盘转化','OMS客户自助下单','移动端录入']},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'起运港',type:'select',options:FCL_POL_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'预计开船日',type:'date'},
    {label:'状态',type:'select',options:['草稿','待审核','已审核','已驳回','已转订仓','已取消']}
]);
TC['fcl-sales-instruction'].modalExcludedFields=['预估毛利','审核人','审核时间','生成订仓单号','状态'];
TC['fcl-sales-instruction'].fieldOptions={
    '来源':['业务员录入','询盘转化','OMS客户自助下单','移动端录入'],
    '客户名称':FCL_CUSTOMER_OPTIONS,'起运港':FCL_POL_OPTIONS,'目的港':FCL_POD_OPTIONS,
    '柜型柜量':['20GP×1','20GP×2','40GP×1','40HQ×1','40HQ×2'],'业务员':FCL_SALES_OPTIONS
};

/* 业务询盘单 —— 重定位为商机台账，增加失单原因（SOP 4.3 步骤 6）*/
addPrototypeTable('fcl-inquiry-order','业务询盘单',
    '询盘单号|客户名称|客户类型|柜型|始发港|目的港|币别|预计开船日|询盘价格|报价渠道|业务员|转化销售指示号|失单原因|备注|状态|操作',
    ['待报价','已报价','已转化','已失单','已关闭'],[
    ['FIQ-20260613001','深圳市华运达国际货运','直客','40HQ','深圳盐田','拉各斯','USD','2026-06-20','4500','微信','张三','','','客户要求本周内反馈西非线报价','已报价'],
    ['FIQ-20260612002','广州远洋进出口贸易','国内同行','20GP','广州南沙','达喀尔','USD','2026-06-22','2680','QQ','李四','FSI-20260612002','','已转化销售指示','已转化'],
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
TC['fcl-inquiry-order'].modalExcludedFields=['转化销售指示号','状态'];
TC['fcl-inquiry-order'].fieldOptions={
    '客户名称':FCL_CUSTOMER_OPTIONS,'客户类型':['国内同行','直客','海外代理'],
    '柜型':FCL_CONTAINER_OPTIONS,'始发港':FCL_POL_OPTIONS,'目的港':FCL_POD_OPTIONS,
    '币别':FCL_CURRENCY_OPTIONS,'报价渠道':['邮件','微信','QQ','电话'],'业务员':FCL_SALES_OPTIONS
};

/* ==========================================================================
 * 五、10.1 订单管理 → 整柜业务总览看板（只读，主状态分页签 + 15 节点进度灯）
 * 节点顺序：①询价 ②建档 ③销指 ④订仓 ⑤放仓 ⑥拖车 ⑦装柜 ⑧补料 ⑨报关
 *           ⑩开船 ⑪寄单 ⑫账单 ⑬付款 ⑭放单 ⑮提成
 * 图例：● 已完成   ◐ 进行中   ○ 未开始   ✖ 异常
 * ========================================================================== */
addPrototypeTable('fcl-order','整柜业务总览',
    '票单号|销售指示号|客户名称|业务员|船公司|航线|柜型柜量|船名航次|ETD|ATD|ETA|主状态|节点进度|当前责任人|超时预警|销售价|实际成本|毛利|操作',
    ['待订仓','已订仓','已放仓','操作中','已开船','在途','已到港','已完结','已取消','异常挂起'],[
    ['FBK-20260613001','FSI-20260613001','深圳市华运达国际货运','张三','MAERSK','西非线','40HQ×1','MAERSK LAGOS 026W','2026-06-20','','2026-07-18','待订仓','●●●◐○○○○○○○○○○○','刘订仓','订仓窗口 2026-06-17 18:00 截止','USD 4,500','USD 4,120','USD 380'],
    ['FBK-20260612002','FSI-20260612002','广州远洋进出口贸易','李四','COSCO','西非线','20GP×2','COSCO AFRICA 118W','2026-06-22','','2026-07-20','已放仓','●●●●●◐○○○○○○○○○','陈操作','—','USD 5,600','USD 5,180','USD 420'],
    ['FBK-20260611003','FSI-20260611003','东莞市鑫海物流','王五','CMA CGM','地中海线','40HQ×1','CMA MARSEILLE 09W','2026-06-25','','2026-07-24','操作中','●●●●●●●◐○○○○○○○','陈单证','补料对内截止 2026-06-20 12:00','USD 6,200','USD 5,600','USD 600'],
    ['FBK-20260605008','FSI-20260605008','上海锦程国际贸易','赵六','COSCO','西非线','40HQ×1','COSCO AFRICA 118W','2026-06-05','2026-06-05 23:10','2026-07-02','在途','●●●●●●●●●●○○○○○','陈操作','塞港预警：目的港拥堵','USD 5,100','USD 4,500','USD 600'],
    ['FBK-20260520011','FSI-20260520011','深圳市华运达国际货运','张三','MSC','西非线','40HQ×1','MSC ACCRA 18W','2026-05-20','2026-05-20 14:30','2026-06-17','已完结','●●●●●●●●●●●●●●●','—','—','USD 5,100','USD 4,500','USD 600'],
    ['FBK-20260610005','FSI-20260610005','广州远洋进出口贸易','李四','CMA CGM','西非线','20GP×1','CMA ABIDJAN 11W','2026-06-18','','2026-07-16','异常挂起','●●●●✖○○○○○○○○○○','刘订仓','订仓失败：船司舱位不足（FEX-20260613001）','USD 2,680','USD 2,580','USD 100']
],[
    {label:'票单号',type:'text'},
    {label:'销售指示号',type:'text'},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'船公司',type:'select',options:FCL_CARRIER_OPTIONS},
    {label:'航线',type:'select',options:FCL_ROUTE_OPTIONS},
    {label:'ETD',type:'date'},
    {label:'主状态',type:'select',options:['待订仓','已订仓','已放仓','操作中','已开船','在途','已到港','已完结','已取消','异常挂起']}
]);
/* 只读看板：不新增、不编辑、不删除；行内仅「查看」（进入票单360） */
TC['fcl-order'].noAutoAudit=true;

/* ==========================================================================
 * 六、票单 360 详情（总览看板行内「查看」入口）
 * ========================================================================== */
var FCL_TIMELINE_NODES=[
    {n:'①',label:'询价/报价',role:'业务员'},
    {n:'②',label:'客户建档',role:'业务员'},
    {n:'③',label:'销售指示',role:'业务员/商务'},
    {n:'④',label:'订仓',role:'订仓员'},
    {n:'⑤',label:'放仓',role:'订仓员'},
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
    [['票单号','票单号'],['销售指示号','销售指示号'],['客户名称','客户名称'],['业务员','业务员'],
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
    [['订仓作业','fcl-booking'],['放仓作业','fcl-release'],['拖车安排','fcl-truck'],['进仓装柜','fcl-load'],
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
