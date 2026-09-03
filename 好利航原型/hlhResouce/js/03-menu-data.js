const menuData=[
{id:'workspace',label:'工作台',langKey:'workspace',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>',page:'dashboard',tab:null,children:[
{id:'ws-home',label:'公共工作台',page:'dashboard',tab:'ws-home'},
{id:'ws-sales',label:'业务工作台',page:'dashboard',tab:'ws-sales'},
{id:'ws-cs',label:'客服工作台',page:'dashboard',tab:'ws-cs'},
{id:'ws-ops',label:'操作工作台',page:'dashboard',tab:'ws-ops'},
/* 员工端APP 原本是独立 L1 挂 8 条菜单，但它是移动端原型演示、不是管理端功能。
 * APP 页面自带 mobilePrototypeNav 可在页内切换全部 8 个原型（同 PDA 的做法），
 * 所以主导航只留一个入口。 */
{id:'staff-app-home',label:'员工端APP',page:'mobile-app',tab:'staff-app-home'}
]},

/* 原「客户管理」L1 只挂 1 个叶子（纯层级浪费），与「运单管理」L1 合并为散货接单侧的统一入口 */
{id:'cust-waybill',label:'客户与运单',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',children:[
{id:'crm-cust',label:'客户管理',langKey:'crm_cust',page:'crm',tab:'crm-cust'},
{id:'wb-special',label:'下单录入',langKey:'wb_special',page:'waybill',tab:'wb-special'},
{id:'wb-manage',label:'运单管理（管理端）',langKey:'wb_manage',page:'waybill',tab:'wb-manage'},
{id:'wb-op-instruction',label:'操作指令',page:'waybill',tab:'wb-op-instruction'}
]},

{id:'fcl',label:'整柜业务',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M8 11h2m4 0h2M8 15h2m4 0h2"/></svg>',children:[
// ===== 首页：操作导航（全流程 SOP 速查 + 功能地图）=====
{id:'fcl-guide',label:'操作导航',page:'fcl',tab:'fcl-guide'},
// ===== ① 报价与价格（SOP-FCL-01）=====
{id:'fcl-price',label:'报价与价格',children:[
    {id:'fcl-quote',label:'整柜报价单',page:'fcl',tab:'fcl-quote'},
    {id:'fcl-cost-price',label:'成本价',page:'fcl',tab:'fcl-cost-price'},
    {id:'fcl-business-cost',label:'业务成本价',page:'fcl',tab:'fcl-business-cost'},
    {id:'fcl-sales-price',label:'业务销售价',page:'fcl',tab:'fcl-sales-price'},
    {id:'fcl-trial-calc',label:'整柜试算-客户',page:'fcl',tab:'fcl-trial-calc'},
    {id:'fcl-trial-calc-biz',label:'整柜试算-业务',page:'fcl',tab:'fcl-trial-calc-biz'},
    {id:'fcl-carrier-route',label:'航司路线配置',page:'fcl',tab:'fcl-carrier-route'}
]},
// ===== ②③ 接单与订舱（SOP-FCL-01/03/04/05）=====
// 原来这 4 项直接挂在整柜业务下，与相邻的分组混排、层级不齐，现收进一个分组。
// 销售指示即客户委托单（预录单/实单都是委托），故更名为「委托订单管理」。
// 仓位管理、订舱窗口提醒已下线（TC 注册保留，仅不挂菜单）。
{id:'fcl-intake',label:'接单与订舱',children:[
    {id:'fcl-inquiry-order',label:'业务询盘单',page:'fcl',tab:'fcl-inquiry-order'},
    {id:'fcl-sales-instruction',label:'委托订单管理',page:'fcl',tab:'fcl-sales-instruction'},
    {id:'fcl-booking',label:'订舱管理',page:'fcl',tab:'fcl-booking'},
    {id:'fcl-release',label:'放仓作业',page:'fcl',tab:'fcl-release'}
]},
// ===== ④ 操作执行（SOP-FCL-06~11）=====
{id:'fcl-ops',label:'操作执行',children:[
    {id:'fcl-truck',label:'拖车安排',page:'fcl',tab:'fcl-truck'},
    {id:'fcl-load',label:'进仓装柜',page:'fcl',tab:'fcl-load'},
    {id:'fcl-si-bl',label:'补料与提单',page:'fcl',tab:'fcl-si-bl'},
    {id:'fcl-bl-split-merge',label:'拆单并单管理',page:'fcl',tab:'fcl-bl-split-merge'},
    {id:'fcl-customs',label:'报关申报',page:'fcl',tab:'fcl-customs'},
    {id:'fcl-sailing-track',label:'开船与轨迹',page:'fcl',tab:'fcl-sailing-track'},
    {id:'fcl-doc-send',label:'寄单作业',page:'fcl',tab:'fcl-doc-send'}
]},
// ===== ⑤ 财务与结算（SOP-FCL-12~15）=====
// 这一组已整体移到「财务结算 → 整柜财务」，整柜业务下不再重复挂一份。
// ===== ⑥ 监控与看板（SOP 第19/21/22章）=====
{id:'fcl-monitor',label:'监控与看板',children:[
    {id:'fcl-order',label:'整柜业务总览',page:'fcl',tab:'fcl-order'},
    {id:'fcl-exception',label:'异常处理',page:'fcl',tab:'fcl-exception'},
    {id:'fcl-sla-kpi',label:'SLA与KPI',page:'fcl',tab:'fcl-sla-kpi'}
]}
]},

{id:'warehouse',label:'仓储作业',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',children:[
/* 原本 17 项全平铺，是侧边栏最难扫的一块，按作业阶段分 5 组。
 * 分组只影响菜单层级，不动任何 tab / 页面；PDA 任务清单走递归 collect，分组后照常取到。 */
{id:'wh-inbound-grp',label:'入库作业',children:[
    {id:'wh-in-one',label:'手动入仓',page:'wh-domestic',tab:'wh-in-one'},
    {id:'wh-in-multi',label:'入仓操作（一票多件）',page:'wh-domestic',tab:'wh-in-multi'},
    {id:'wh-headless',label:'无头件',langKey:'wh_headless',page:'wh-domestic',tab:'wh-headless'},
    {id:'wh-no-pre-in',label:'无头件认领',langKey:'wh_no_pre_in',page:'wh-domestic',tab:'wh-no-pre-in'},
    {id:'wh-express-inbound',label:'快递入仓(分拣装板)',page:'wh-domestic',tab:'wh-express-inbound'}
]},
{id:'wh-instock-grp',label:'库内管理',children:[
    {id:'wh-stock-check',label:'国内库存盘点',page:'wh-domestic',tab:'wh-stock-check'},
    {id:'wh-cargo-search',label:'查货管理',page:'wh-domestic',tab:'wh-cargo-search'},
    {id:'wh-replenish-drop',label:'补货落货管理',page:'wh-domestic',tab:'wh-replenish-drop'}
]},
{id:'wh-outbound-grp',label:'出库与配舱',children:[
    {id:'wh-pack-rule',label:'配舱规则',page:'wh-domestic',tab:'wh-pack-rule'},
    {id:'wh-final-alloc',label:'配舱计划',page:'wh-domestic',tab:'wh-final-alloc'},
    {id:'wh-sort-bag',label:'分拣装袋管理',page:'wh-domestic',tab:'wh-sort-bag'},
    {id:'wh-express-sort',label:'快递分拣方案管理',page:'wh-domestic',tab:'wh-express-sort'}
]},
{id:'wh-transfer-grp',label:'调拨管理',children:[
    {id:'wh-transfer-in',label:'调拨入库',page:'wh-domestic',tab:'wh-transfer-in'},
    {id:'wh-transfer-out',label:'调拨出库',page:'wh-domestic',tab:'wh-transfer-out'},
    {id:'wh-transfer-fee',label:'调拨费用查询',page:'wh-domestic',tab:'wh-transfer-fee'}
]},
{id:'wh-pallet-grp',label:'托盘管理',children:[
    {id:'wh-pallet-info',label:'托盘信息查询',page:'wh-domestic',tab:'wh-pallet-info'},
    {id:'wh-pallet-print',label:'托盘打印',page:'wh-domestic',tab:'wh-pallet-print'}
]},
/* 仓库PDA 带 terminalOnly:'pda'，只在 PDA 端显示，保持原样不并入托盘管理 */
{id:'warehouse-pda',label:'仓库PDA',terminalOnly:'pda',children:[
{id:'pda-app',label:'仓库PDA',page:'warehouse-pda',tab:'pda-app'}
]}
]},

{id:'overseas-wh',label:'海外仓',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',children:[
{id:'ow-pickup',label:'提货预约管理',page:'overseas-wh',tab:'ow-pickup'},
{id:'ow-arrival',label:'海外仓到货',page:'overseas-wh',tab:'ow-arrival'},
{id:'ow-outbound',label:'海外仓出库',page:'overseas-wh',tab:'ow-outbound'},
{id:'ow-inventory',label:'海外仓库存',page:'overseas-wh',tab:'ow-inventory'},
{id:'ow-pallet-info',label:'托盘查询',page:'overseas-wh',tab:'ow-pallet-info'},
{id:'ow-pallet-print',label:'托盘条码打印',page:'overseas-wh',tab:'ow-pallet-print'}
]},

{id:'cs',label:'客服',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/></svg>',children:[
{id:'cs-issue-track',label:'问题件跟踪',page:'cs',tab:'cs-issue-track'},
{id:'cs-issue-type',label:'问题件类型',page:'cs',tab:'cs-issue-type'},
{id:'cs-track-query',label:'轨迹查询',page:'cs',tab:'cs-track-query'},
{id:'cs-track-maint',label:'轨迹维护',page:'cs',tab:'cs-track-maint'},
/* 原挂在 业务配置 → 基础资料 下，与轨迹查询/轨迹维护分家；移到客服模块归拢 */
{id:'biz-track-cfg',label:'轨迹配置',page:'cs',tab:'biz-track-cfg'}
]},

{id:'approval',label:'审批',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>',children:[
{id:'approval-mine',label:'我的审批',page:'approval',tab:'approval-mine'},
{id:'approval-msg',label:'我的消息',page:'approval',tab:'approval-msg'}
]},

{id:'finance',label:'财务结算',langKey:'finance',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',children:[
{id:'fin-bank-account',label:'银行账户',page:'finance',tab:'fin-bank-account'},
{id:'fin-account',label:'财务科目',page:'finance',tab:'fin-account'},
{id:'fin-bank-voucher',label:'银行凭证',page:'finance',tab:'fin-bank-voucher'},
{id:'fin-rate',label:'汇率管理',page:'finance',tab:'fin-rate'},
/* 与下面的「整柜财务」对称：这一组是散货侧的应收/收款 */
{id:'fin-ar',label:'散货收款管理',children:[
{id:'fin-ar-detail',label:'应收明细',page:'finance',tab:'fin-ar-detail'},
{id:'fin-ar-bill',label:'应收账单管理',page:'finance',tab:'fin-ar-bill'},
{id:'fin-ar-receipt',label:'收款管理',page:'finance',tab:'fin-ar-receipt'}
]},
/* 整柜的应付/请款/付款/应收放单/银行流水/提成，唯一入口在这里
 * （原「整柜业务 → 财务与结算」已撤掉，不再两处重复）。 */
{id:'fin-fcl',label:'整柜财务',children:[
{id:'fcl-bill-entry',label:'实际费用管理',page:'fcl',tab:'fcl-bill-entry'},
{id:'fcl-actual-bill-import',label:'账单导入',page:'fcl',tab:'fcl-actual-bill-import'},
{id:'fcl-carrier-bill-compare',label:'船公司账单对比',page:'fcl',tab:'fcl-carrier-bill-compare'},
{id:'fcl-appeal',label:'账单申诉',page:'fcl',tab:'fcl-appeal'},
{id:'fcl-bill',label:'整柜应付账单',page:'fcl',tab:'fcl-bill'},
{id:'fcl-payment-request',label:'请款单管理',page:'fcl',tab:'fcl-payment-request'},
{id:'fcl-payment',label:'付款管理',page:'fcl',tab:'fcl-payment'},
{id:'fcl-ar-release',label:'应收与放单',page:'fcl',tab:'fcl-ar-release'},
{id:'fcl-bank-flow',label:'银行流水管理',page:'fcl',tab:'fcl-bank-flow'},
{id:'fcl-commission',label:'业绩与提成',page:'fcl',tab:'fcl-commission'}
]}
]},

{id:'biz-config',label:'业务配置',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',children:[
{id:'basedata',label:'基础资料',langKey:'basedata',children:[
{label:'服务商管理',id:'base-provider',langKey:'base_provider',page:'basedata',tab:'base-provider'},
{label:'员工管理',id:'base-employee',langKey:'base_employee',page:'basedata',tab:'base-employee'},
{label:'发件人信息',id:'base-sender',langKey:'base_sender',page:'basedata',tab:'base-sender'}
/* 轨迹配置已移到「客服」下，与轨迹查询/轨迹维护放在一起 */
]},
{id:'product',label:'产品配置',langKey:'product',children:[
{id:'prod-manage',label:'产品管理',langKey:'prod_manage',page:'product',tab:'prod-manage'},
{id:'prod-price-lcl',label:'销售报价(散货)',langKey:'prod_price_lcl',page:'product',tab:'prod-price-lcl'},
{id:'prod-surcharge',label:'附加杂费配置',langKey:'prod_surcharge',page:'product',tab:'prod-surcharge'},
{id:'cfg-label-template',label:'标签模板',page:'product',tab:'cfg-label-template'}
]},
/* 原「业务设置」12 项混了三类东西（地理字典 / 平台配置 / 流程规则），常用项被淹没，拆成 3 组。
 * 「汇率管理」(cfg-rate) 与 财务结算→汇率管理(fin-rate) 同名不同表、数据还不一致，
 * 保留字段更全的 fin-rate，这里去掉菜单入口（TC['cfg-rate'] 仍注册，供其他地方引用）。 */
{id:'cfg-geo',label:'地理数据',children:[
{id:'cfg-country',label:'国家列表',langKey:'cfg_country',page:'biz-cfg',tab:'cfg-country'},
{id:'cfg-province',label:'州/省列表',langKey:'cfg_province',page:'biz-cfg',tab:'cfg-province'},
{id:'cfg-city',label:'城市列表',langKey:'cfg_city',page:'biz-cfg',tab:'cfg-city'},
{id:'cfg-port',label:'港口机场列表',langKey:'cfg_port',page:'biz-cfg',tab:'cfg-port'}
]},
{id:'cfg-platform',label:'平台设置',children:[
{id:'cfg-dict',label:'数据字典',langKey:'cfg_dict',page:'biz-cfg',tab:'cfg-dict'},
{id:'cfg-product-name',label:'品名库管理',langKey:'cfg_product_name',page:'biz-cfg',tab:'cfg-product-name'},
{id:'cfg-i18n',label:'多语言配置',langKey:'cfg_i18n',page:'biz-cfg',tab:'cfg-i18n'},
{id:'cfg-coding-rule',label:'编码规则管理',page:'biz-cfg',tab:'cfg-coding-rule'}
]},
{id:'cfg-flow',label:'流程与风控',children:[
{id:'cfg-risk',label:'风控规则',langKey:'cfg_risk',page:'biz-cfg',tab:'cfg-risk'},
{id:'biz-msg-flow',label:'消息流程管理',page:'biz-cfg',tab:'biz-msg-flow'},
{id:'biz-approval-flow',label:'审批流程管理',page:'biz-cfg',tab:'biz-approval-flow'}
]},
// ===== 整柜规则（SOP 第19/20章：规则外置，业务可维护）=====
{id:'fcl-rules',label:'整柜规则',children:[
{id:'fcl-rule',label:'关键业务规则',page:'biz-cfg',tab:'fcl-rule'},
{id:'fcl-release-tpl',label:'放仓模板',page:'biz-cfg',tab:'fcl-release-tpl'},
{id:'fcl-provider-api',label:'服务商API配置',page:'biz-cfg',tab:'fcl-provider-api'},
{id:'fcl-edi-api',label:'EDI/API对接',page:'biz-cfg',tab:'fcl-edi-api'}
]}
]},

{id:'perm',label:'权限管理',langKey:'perm',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>',children:[
{id:'perm-user',label:'用户管理',langKey:'perm_user',page:'perm',tab:'perm-user'},
{id:'perm-role',label:'角色管理',langKey:'perm_role',page:'perm',tab:'perm-role'},
{id:'perm-menu',label:'菜单管理',langKey:'perm_menu',page:'perm',tab:'perm-menu'},
{id:'perm-log',label:'日志查询',langKey:'perm_log',page:'perm',tab:'perm-log'},
/* 6 个子项原本 tab 全写成了未注册的 'perm-org'，点开都是兜底页；改指各自真实表 */
{id:'perm-org',label:'组织架构',langKey:'perm_org',children:[{id:'perm-hq',label:'总部管理',langKey:'perm_hq',page:'perm',tab:'perm-hq'},{id:'perm-region',label:'大区管理',langKey:'perm_region',page:'perm',tab:'perm-region'},{id:'perm-branch',label:'分公司',langKey:'perm_branch',page:'perm',tab:'perm-branch'},{id:'perm-wh',label:'仓库',langKey:'perm_wh',page:'perm',tab:'perm-wh'},{id:'perm-dept',label:'部门管理',langKey:'perm_dept',page:'perm',tab:'perm-dept'},{id:'perm-team',label:'小组管理',langKey:'perm_team',page:'perm',tab:'perm-team'}]}
]},

// ========== OMS 客户端 L1（terminal=oms 时显示） ==========
{id:'client-mobile-app',label:'客户端APP',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2" stroke-width="1.5"/><path stroke-linecap="round" stroke-width="1.5" d="M10 6h4M11 18h2"/></svg>',children:[
{id:'client-app-home',label:'APP首页',page:'mobile-app',tab:'client-app-home'},
{id:'client-app-inquiry',label:'发起询价',page:'mobile-app',tab:'client-app-inquiry'},
{id:'client-app-quotes',label:'报价确认',page:'mobile-app',tab:'client-app-quotes'},
{id:'client-app-orders',label:'订单跟踪',page:'mobile-app',tab:'client-app-orders'},
{id:'client-app-service',label:'服务工单',page:'mobile-app',tab:'client-app-service'},
{id:'client-app-profile',label:'我的账户',page:'mobile-app',tab:'client-app-profile'}
]},

{id:'oms-client',label:'客户中心',icon:'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',children:[
{id:'wb-client-manage',label:'我的运单',page:'oms-cw',tab:'wb-client-manage'},
{id:'oms-wb-query',label:'运单查询',page:'oms-cw',tab:'oms-wb-query'},
{id:'oms-track-query',label:'轨迹查询',page:'oms-cw',tab:'oms-track-query'}
]}
];

