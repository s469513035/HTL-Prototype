var COUNTRY_CODE_NAME_OPTIONS=['CN 中国','US 美国','GB 英国','DE 德国','NL 荷兰','FR 法国','NG 尼日利亚','CI 科特迪瓦','SN 塞内加尔','GH 加纳','CM 喀麦隆','BJ 贝宁','TG 多哥','LR 利比里亚','GN 几内亚','SL 塞拉利昂','MR 毛里塔尼亚','GMB 冈比亚','AE 阿联酋'];
/* 回填 07 里因加载顺序取不到常量的国家下拉 */
(function(){
    var c=TC&&TC['crm-cust'];
    if(!c||!c.q)return;
    c.q.forEach(function(q){
        if(q.label==='所属国家'&&(!q.options||!q.options.length))q.options=COUNTRY_CODE_NAME_OPTIONS;
    });
})();

function countryCodeName(value){
    const raw=String(value||'').trim();
    if(!raw)return raw;
    const code=raw.split(/\s+/)[0];
    const found=COUNTRY_CODE_NAME_OPTIONS.find(function(item){return item.indexOf(code+' ')===0;});
    return found||raw;
}
['crm-cust','cfg-province','cfg-city','cfg-port','cfg-warehouse'].forEach(function(id){
    const c=TC[id];
    if(!c||!c.h)return;
    const countryIdx=c.h.indexOf('所属国家')>=0?c.h.indexOf('所属国家'):c.h.indexOf('国家');
    if(countryIdx>=0&&c.d){
        c.d=c.d.map(function(row){
            const next=row.slice();
            next[countryIdx]=countryCodeName(next[countryIdx]);
            return next;
        });
    }
    if(c.q){
        c.q=c.q.map(function(q){
            if(q.label==='所属国家'||q.label==='国家'){
                return Object.assign({},q,{type:'select',options:COUNTRY_CODE_NAME_OPTIONS});
            }
            return q;
        });
    }
});
TC['perm-user'].readonlyList=true;
TC['perm-role'].forceLocalHeader=true;
TC['perm-role'].h='角色编号|角色名称|状态|所属终端|操作'.split('|');
TC['perm-role'].d=[
    ['ROLE-001','超级管理员','启用','全终端'],
    ['ROLE-002','分公司经理','启用','PC端'],
    ['ROLE-003','操作员','启用','PC端'],
    ['ROLE-004','海外仓管','启用','移动端'],
    ['ROLE-005','财务审核','停用','全终端'],
    ['ROLE-006','国内仓库主管','启用','全终端'],
    ['ROLE-007','仓库PDA操作员','启用','移动端'],
    ['ROLE-008','整柜操作员','启用','PC端']
];
TC['perm-hq'].modalExcludedFields=['序号','英文名称'];
TC['perm-region'].modalExcludedFields=['序号','英文名称'];
TC['perm-branch'].modalExcludedFields=['序号','英文名称','电话'];
TC['perm-wh'].modalExcludedFields=['序号','英文名称','邮编','面积(m²)','库容'];
TC['perm-dept'].modalExcludedFields=['序号','所属大区','所属分公司','上级部门','英文名称','负责人手机'];
TC['perm-team'].modalExcludedFields=['序号','所属大区','所属分公司','组员数（估算）','工作组职能'];
if(TC['perm-wh']&&!TC['perm-wh'].h.includes('是否启用')){
    const opIdx=TC['perm-wh'].h.indexOf('操作');
    const insertAt=opIdx>=0?opIdx:TC['perm-wh'].h.length;
    TC['perm-wh'].h.splice(insertAt,0,'是否启用');
    TC['perm-wh'].d=TC['perm-wh'].d.map(function(row){
        const next=row.slice();
        next.splice(insertAt,0,'是');
        return next;
    });
}
if(TC['perm-dept']){
    const ownerIdx=TC['perm-dept'].h.indexOf('部门负责人');
    if(ownerIdx>=0)TC['perm-dept'].h[ownerIdx]='负责人';
}
if(TC['perm-team']){
    const codeIdx=TC['perm-team'].h.indexOf('工作组编码');
    const nameIdx=TC['perm-team'].h.indexOf('工作组名称');
    if(codeIdx>=0)TC['perm-team'].h[codeIdx]='小组编码';
    if(nameIdx>=0)TC['perm-team'].h[nameIdx]='小组名称';
}
TC['perm-region'].q=[{label:'大区编码',type:'text',field:'code'},{label:'大区名称',type:'text',field:'name'},{label:'所属总部',type:'select',field:'hq',options:['集团总部']},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}];
TC['perm-branch'].q=[{label:'分公司编码',type:'text',field:'code'},{label:'分公司名称',type:'text',field:'name'},{label:'所属大区',type:'select',field:'region',options:['中国区域管理中心','非洲海外区域中心']},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}];
TC['perm-wh'].q=[{label:'仓库编码',type:'text',field:'code'},{label:'所属总部',type:'select',field:'hq',options:['集团总部']},{label:'所属分公司',type:'select',field:'branch',options:['武汉分部','广州业务分部','广州散货操作分部','义乌分部','宁波分部','深圳总部业务客服部']},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}];
TC['perm-dept'].q=[{label:'部门编码',type:'text',field:'code'},{label:'部门名称',type:'text',field:'name'},{label:'所属总部',type:'select',field:'hq',options:['集团总部']},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}];
TC['perm-team'].q=[{label:'小组编码',type:'text',field:'code'},{label:'小组名称',type:'text',field:'name'},{label:'所属部门',type:'select',field:'dept',options:['财务部','人事行政部','商务部','操作部','订舱部','散货客服部','客服部','业务部']},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}];
TC['cfg-rate'].forceLocalHeader=true;
TC['cfg-rate'].h='币别编号|汇率|汇损|状态|生效开始时间|生效结束时间|操作'.split('|');
TC['cfg-rate'].s=['启用','停用'];
TC['cfg-rate'].d=[
    ['USD 美元','7.2500','0.0200','启用','2026-06-01','2026-06-30'],
    ['EUR 欧元','7.9800','0.0300','启用','2026-06-01','2026-06-30'],
    ['GBP 英镑','9.1500','0.0400','启用','2026-06-01','2026-06-30'],
    ['HKD 港币','0.9280','0.0050','停用','2026-05-01','2026-05-31']
];
TC['cfg-rate'].q=[{label:'币别编号',type:'select',field:'currency',options:['CNY 人民币','USD 美元','EUR 欧元','GBP 英镑','HKD 港币']},{label:'启用状态',type:'select',field:'status',options:['启用','停用']}];
applyStandardSheetTable('fin-period-rule','账期规则',
    ['序号','客户/服务商','结算周期','结算天数','说明','实体编号','结算周期类型','结算节点','币别'],
    [['1','客户','月结','5','每月 5 号结算上月账单','CUS-2025-001','月结','月底','USD']],
    [{label:'客户/服务商',type:'select',field:'entityType',options:['客户','服务商']},{label:'实体编号',type:'text',field:'entityCode'},{label:'结算周期类型',type:'select',field:'cycleType',options:['月结','票结','季结','周结']},{label:'币别',type:'select',field:'currency',options:['CNY','USD','EUR']}]);
applyStandardSheetTable('cfg-approval','审批流程',
    ['序号','触发节点','审批流程','所属模块','发起人角色','审批节点 1','审批节点 2','审批节点 3','抄送对象','超时规则（小时）','生效日期'],
    [['1','业务员调价申请（降价 > 5%）','业务员发起 -> 销售主管 -> 财务审核 -> 销售总监','业务','业务员','销售主管','财务审核','销售总监','客户跟单客服','24','2026-06-01']],
    [{label:'触发节点',type:'text',field:'trigger'},{label:'所属模块',type:'select',field:'module',options:['财务','业务','仓库','操作','HR']},{label:'发起人角色',type:'text',field:'role'},{label:'生效日期',type:'date',field:'effectiveDate'}]);
applyStandardSheetTable('cfg-dict','数据字典',
    [
        "分类",
        "编码",
        "名称",
        "英文名称",
        "备注"
    ],
    [
        [
            "运输方式",
            "AIR",
            "空运",
            "Air Freight",
            "用于订单、报价、配舱"
        ],
        [
            "运输方式",
            "AIR",
            "空运",
            "Air Freight",
            "用于订单、报价、配舱"
        ],
        [
            "运输方式",
            "FCL",
            "海运 FCL（整柜）",
            "Full Container Load",
            "整柜出运"
        ],
        [
            "运输方式",
            "LCL",
            "海运 LCL（散货）",
            "Less than Container Load",
            "散货拼柜"
        ],
        [
            "运输方式",
            "EXPRESS",
            "国际快递",
            "Express",
            "DHL/UPS/FedEx 等"
        ],
        [
            "运输方式",
            "TRUCK",
            "陆运",
            "Truck",
            "陆运/卡车"
        ],
        [
            "运输方式",
            "RAIL",
            "铁运",
            "Rail",
            "中欧班列等"
        ],
        [
            "客户类型",
            "DIRECT",
            "直客",
            "Direct Customer",
            "直接面向终端货主"
        ],
        [
            "客户类型",
            "AGENT",
            "同行",
            "Agent",
            "同行代理"
        ],
        [
            "客户类型",
            "PLATFORM",
            "平台",
            "Platform",
            "电商/集运平台"
        ],
        [
            "客户类型",
            "REP",
            "代理",
            "Representative",
            "区域代理"
        ],
        [
            "服务商类型",
            "BOOKING",
            "订舱服务商",
            "Booking Agent",
            ""
        ],
        [
            "服务商类型",
            "CUSTOM",
            "报关服务商",
            "Customs Broker",
            ""
        ],
        [
            "服务商类型",
            "TRUCK",
            "拖车服务商",
            "Trucking",
            ""
        ],
        [
            "服务商类型",
            "CLEAR",
            "清关服务商",
            "Customs Clearance",
            ""
        ],
        [
            "服务商类型",
            "DELIVERY",
            "派送服务商",
            "Last-Mile Delivery",
            ""
        ],
        [
            "服务商类型",
            "CARRIER",
            "船司",
            "Shipping Line",
            ""
        ],
        [
            "服务商类型",
            "AIRLINE",
            "航司",
            "Airline",
            ""
        ],
        [
            "服务商类型",
            "LOAD",
            "装柜服务商",
            "Loading",
            ""
        ],
        [
            "服务商类型",
            "WAREHOUSE",
            "仓储服务商",
            "Warehousing",
            ""
        ],
        [
            "服务商类型",
            "INSURANCE",
            "保险服务商",
            "Insurance",
            ""
        ],
        [
            "服务商类型",
            "PACK",
            "打包服务商",
            "Packing",
            ""
        ],
        [
            "问题件类型",
            "DAMAGE",
            "破损",
            "Damage",
            "货物物理损坏"
        ],
        [
            "问题件类型",
            "OVERDUE",
            "超时",
            "Overdue",
            "超过 SLA 时效"
        ],
        [
            "问题件类型",
            "INTERCEPT",
            "拦截暂存",
            "Intercepted",
            "电子狗或风控拦截"
        ],
        [
            "问题件类型",
            "INSPECT",
            "查验",
            "Inspection",
            "需要查验"
        ],
        [
            "问题件类型",
            "REJECT",
            "客户拒收",
            "Rejected",
            ""
        ],
        [
            "问题件类型",
            "NOHEAD",
            "无头件",
            "Unidentified",
            "无法匹配客户的快递件"
        ],
        [
            "问题件类型",
            "CUSTOM_INSPECT",
            "海关查验",
            "Customs Inspection",
            ""
        ],
        [
            "问题件类型",
            "INSUFFICIENT",
            "资料不全",
            "Insufficient Info",
            "缺少 ID/品名等"
        ],
        [
            "报关方式",
            "SOLO",
            "单独报关",
            "Solo Declaration",
            "一票一报关"
        ],
        [
            "报关方式",
            "MERGE",
            "合并报关",
            "Merge Declaration",
            "多票合并一报关"
        ],
        [
            "报关方式",
            "SPLIT",
            "拆分报关",
            "Split Declaration",
            "一票拆分多报关"
        ],
        [
            "报关方式",
            "BUY",
            "买单报关",
            "Buy Declaration",
            "买单证报关"
        ],
        [
            "货物属性",
            "ORDINARY",
            "普货",
            "Ordinary",
            ""
        ],
        [
            "货物属性",
            "SENSITIVE",
            "敏感货",
            "Sensitive",
            ""
        ],
        [
            "货物属性",
            "LIQUID",
            "液体",
            "Liquid",
            ""
        ],
        [
            "货物属性",
            "BATTERY",
            "带电",
            "Battery",
            ""
        ],
        [
            "货物属性",
            "MAGNET",
            "带磁",
            "Magnet",
            ""
        ],
        [
            "货物属性",
            "DANGER",
            "危险品",
            "Dangerous Goods",
            ""
        ],
        [
            "货物属性",
            "BIO",
            "动植物",
            "Bio",
            ""
        ],
        [
            "付款方式",
            "WIRE",
            "电汇",
            "Wire Transfer",
            ""
        ],
        [
            "付款方式",
            "CHECK",
            "支票",
            "Check",
            ""
        ],
        [
            "付款方式",
            "NETBANK",
            "企业网银",
            "Online Banking",
            ""
        ],
        [
            "付款方式",
            "CASH",
            "现金",
            "Cash",
            ""
        ],
        [
            "付款方式",
            "BANK_ACCEPT",
            "银行承兑",
            "Bank Acceptance",
            ""
        ],
        [
            "币别",
            "CNY",
            "人民币",
            "Chinese Yuan",
            "¥"
        ],
        [
            "币别",
            "USD",
            "美元",
            "US Dollar",
            "$"
        ],
        [
            "币别",
            "EUR",
            "欧元",
            "Euro",
            "€"
        ],
        [
            "币别",
            "GBP",
            "英镑",
            "British Pound",
            "£"
        ],
        [
            "币别",
            "HKD",
            "港币",
            "Hong Kong Dollar",
            "HK$"
        ],
        [
            "币别",
            "JPY",
            "日元",
            "Japanese Yen",
            "¥"
        ],
        [
            "币别",
            "CAD",
            "加元",
            "Canadian Dollar",
            "C$"
        ],
        [
            "币别",
            "AUD",
            "澳元",
            "Australian Dollar",
            "A$"
        ],
        [
            "币别",
            "SGD",
            "新加坡元",
            "Singapore Dollar",
            "S$"
        ],
        [
            "币别",
            "CHF",
            "瑞士法郎",
            "Swiss Franc",
            "CHF"
        ],
        [
            "散货运单状态",
            "CREATED",
            "已创建",
            "Created",
            ""
        ],
        [
            "散货运单状态",
            "INBOUND",
            "已入仓",
            "Inbounded",
            ""
        ],
        [
            "散货运单状态",
            "REWEIGHED",
            "已复重",
            "Reweighed",
            ""
        ],
        [
            "散货运单状态",
            "WAIT_CONFIRM",
            "待业务员确认",
            "Pending Confirm",
            ""
        ],
        [
            "散货运单状态",
            "CONFIRMED",
            "已确认",
            "Confirmed",
            ""
        ],
        [
            "散货运单状态",
            "WAIT_PACK",
            "待打包",
            "Pending Pack",
            ""
        ],
        [
            "散货运单状态",
            "WAIT_LOAD",
            "待配舱",
            "Pending Allocation",
            ""
        ],
        [
            "散货运单状态",
            "ALLOCATED",
            "已配舱",
            "Allocated",
            ""
        ],
        [
            "散货运单状态",
            "LOADED",
            "已装柜",
            "Loaded",
            ""
        ],
        [
            "散货运单状态",
            "OUTBOUND",
            "已离仓",
            "Outbound",
            ""
        ],
        [
            "散货运单状态",
            "RETURNED",
            "已退件",
            "Returned",
            ""
        ],
        [
            "散货运单状态",
            "CANCELED",
            "已取消",
            "Canceled",
            ""
        ],
        [
            "整柜订单状态",
            "CREATED",
            "已创建",
            "Created",
            ""
        ],
        [
            "整柜订单状态",
            "AUDITING",
            "审核中",
            "Auditing",
            ""
        ],
        [
            "整柜订单状态",
            "AUDITED",
            "已审核",
            "Audited",
            ""
        ],
        [
            "整柜订单状态",
            "PICKING",
            "找货中",
            "Picking",
            ""
        ],
        [
            "整柜订单状态",
            "PICKED",
            "找货完成",
            "Picked",
            ""
        ],
        [
            "整柜订单状态",
            "LOADING",
            "装柜中",
            "Loading",
            ""
        ],
        [
            "整柜订单状态",
            "LOADED",
            "已装柜",
            "Loaded",
            ""
        ],
        [
            "整柜订单状态",
            "DECLARED",
            "已报关",
            "Declared",
            ""
        ],
        [
            "客户等级",
            "VIP",
            "VIP 客户",
            "VIP Customer",
            "战略级客户"
        ],
        [
            "客户等级",
            "A",
            "A 级",
            "Grade A",
            "重点客户"
        ],
        [
            "客户等级",
            "B",
            "B 级",
            "Grade B",
            "常规客户"
        ],
        [
            "客户等级",
            "C",
            "C 级",
            "Grade C",
            "潜力客户"
        ],
        [
            "审批结果",
            "APPROVED",
            "通过",
            "Approved",
            ""
        ],
        [
            "审批结果",
            "REJECTED",
            "驳回",
            "Rejected",
            ""
        ],
        [
            "审批结果",
            "RETURN",
            "退回修改",
            "Returned for Revision",
            ""
        ],
        [
            "在职状态",
            "ACTIVE",
            "在职",
            "Active",
            "已转正在职"
        ],
        [
            "在职状态",
            "PROBATION",
            "试用期",
            "Probation",
            "试用期内"
        ],
        [
            "在职状态",
            "RESIGNED",
            "离职",
            "Resigned",
            "已离职"
        ],
        [
            "在职状态",
            "SUSPENDED",
            "停薪留职",
            "Suspended",
            "保留员工身份不发薪"
        ],
        [
            "标签类型",
            "GOODS",
            "货物标签",
            "Goods Label",
            "贴在每件货物上"
        ],
        [
            "标签类型",
            "PACK",
            "装包袋标签",
            "Pack Bag Label",
            "贴在装包袋上"
        ],
        [
            "标签类型",
            "PALLET",
            "托盘标签",
            "Pallet Label",
            "贴在托盘上"
        ],
        [
            "标签类型",
            "OVERSEA",
            "海外仓标签",
            "Overseas Label",
            "海外仓 KP/FBA 标签"
        ],
        [
            "仓库能力",
            "PDA",
            "PDA 作业",
            "PDA Operation",
            "支持 PDA 扫描作业"
        ],
        [
            "仓库能力",
            "PACK",
            "打包作业",
            "Packing",
            "支持二次打包"
        ],
        [
            "仓库能力",
            "LOAD",
            "装柜作业",
            "Loading",
            "支持现场装柜"
        ],
        [
            "仓库能力",
            "LABEL",
            "标签打印",
            "Label Printing",
            "支持标签打印"
        ],
        [
            "仓库能力",
            "COLD",
            "冷藏仓",
            "Cold Storage",
            "支持冷藏货物"
        ],
        [
            "退件原因",
            "WEIGHT_DIFF",
            "重量/尺寸差异过大",
            "Weight/Size Diff Too Large",
            ""
        ],
        [
            "退件原因",
            "NAME_DIFF",
            "品名不符",
            "Item Name Mismatch",
            ""
        ],
        [
            "退件原因",
            "CUSTOMER_CANCEL",
            "客户取消",
            "Customer Cancelled",
            ""
        ],
        [
            "退件原因",
            "NOHEAD_OVERDUE",
            "无头件超期",
            "Unidentified Overdue",
            ""
        ],
        [
            "退件原因",
            "CUSTOM_FAIL",
            "海关查验失败",
            "Customs Inspection Failed",
            ""
        ],
        [
            "是否启用",
            "TRUE",
            "是",
            "Yes",
            ""
        ],
        [
            "是否启用",
            "FALSE",
            "否",
            "No",
            ""
        ]
    ],
    [
        {
            "label": "分类",
            "type": "text",
            "field": "category"
        },
        {
            "label": "编码",
            "type": "text",
            "field": "code"
        },
        {
            "label": "名称",
            "type": "text",
            "field": "name"
        }
    ]);

var _statusLangMap={'启用':'tabActive','停用':'tabInactive','冻结':'tabFrozen','在职':'tabOnDuty','离职':'tabResigned','休假':'tabOnLeave','待审批':'tabPending','已通过':'tabApproved','已驳回':'tabRejected','未读':'tabUnread','已读':'tabRead','锁定':'tabLocked','待入仓':'tabPendingIn','已入仓':'tabReceived','异常':'tabAbnormal','已作废':'tabVoided','进行中':'tabProcessing','已完成':'tabCompleted','待处理':'tabPendingProcess','已处理':'tabProcessed','待审核':'tabPendingReview','可领取':'tabAvailable','已领取':'tabClaimed','已生效':'tabEffective','待抢单':'tabPendingGrab','已抢单':'tabGrabbed','已复核':'tabReviewed','待确认':'tabPendingConfirm','已确认':'tabConfirmed','生效中':'tabEffectiveRunning','已失效':'tabInvalid','待生效':'tabPendingEffect','已登记':'tabRegistered','已通知':'tabNotified','待补录':'tabPendingSupplement','已补录':'tabSupplemented','已提交':'tabSubmitted','已对齐':'tabAligned','未对齐':'tabUnaligned','已回滚':'tabRolledback','正常':'tabNormal','预警':'tabWarning','提醒中':'tabReminding','已解决':'tabResolved','已付款':'tabPaid','待开票':'tabPendingInvoice','已开票':'tabInvoiced','在途':'tabInTransit','抵港':'tabArrived','清关中':'tabClearing','已提柜':'tabPickedUp','待出库':'tabPendingOut','已出库':'tabOutbound','已放行':'tabReleased','未通过':'tabNotPassed','部分放行':'tabPartialRelease','全部放行':'tabFullRelease','待同步':'tabPendingSync','已同步':'tabSynced','有差异':'tabDiff','告警中':'tabAlerting','熔断':'tabCircuitBreak','运行中':'tabRunning','维护中':'tabMaintaining','告警':'tabAlert','待提交':'tabPending','已提交':'tabSubmitted','已确认':'tabConfirmed','已出单':'tabCompleted','生成中':'tabProcessing','已完成':'tabCompleted','已失败':'tabRejected','有差异':'tabDiff','进行中':'tabProcessing'};

