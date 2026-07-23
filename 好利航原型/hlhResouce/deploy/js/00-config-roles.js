// ========== 角色权限系统 ==========
// 定义角色：每个角色有对应的菜单ID列表（允许访问的菜单）
var ROLE_MENUS={
    'role-admin':['workspace','customer-mgmt','waybill-mgmt','fcl','warehouse','cs','finance','biz-config','perm'],
    'role-sales':['workspace','customer-mgmt','waybill-mgmt','fcl','biz-config'],
    'role-quote':['workspace','biz-config'],
    'role-finance':['workspace','fcl','finance'],
    // OMS / PDA 占位（TERMINAL_MENUS 已经把可见 L1 收窄到 OMS/PDA 专属范围，角色 filter 退化为不过滤）
    'role-customer':['oms-client'],
    'role-pda':[]
};

// ========== 端（OMS / TMS / PDA）权限 ==========
// 每个端只能看到自己的 L1 集合；PDA 端走特殊渲染（直达工作台）所以列表为空
var TERMINAL_MENUS={
    'oms':['oms-client'],
    'tms':['workspace','customer-mgmt','waybill-mgmt','fcl','warehouse','cs','finance','biz-config','perm'],
    'pda':[]
};
var TERMINAL_LABELS={'oms':'OMS 客户端','tms':'TMS 管理端','pda':'PDA 仓库端'};
var TERMINAL_DEFAULT_USERNAMES={'oms':'customer-001','tms':'admin','pda':'pda-wh-1'};

// 定义角色：每个角色有对应的字段权限（哪些字段显示，哪些隐藏）
var ROLE_FIELDS={
    'default':{}, // 默认不限制
    'role-sales':{ // 业务员角色隐藏敏感字段
        'finance-invoice':['发票号码','客户名称','开票金额','已收金额','未收金额'], // 只显示这些
        'finance-payment':['付款单号','供应商名称','付款金额','手续费']
    }
};

// 定义角色：每个角色有对应的查询条件权限
var ROLE_QUERY={
    'default':{}, // 默认不限制
    'role-sales':{ // 业务员只能看自己的数据
        'crm-cust':[{field:'跟进销售',default:'current_user'}],
        'waybill-manage':[{field:'创建人',default:'current_user'}]
    }
};

// 演示账号列表（terminal 字段决定该账号属于哪个端）
var DEMO_ACCOUNTS=[
    {id:'admin',name:'系统管理员',role:'role-admin',terminal:'tms',avatar:'A',dept:'总部'},
    {id:'sales01',name:'李业务',role:'role-sales',terminal:'tms',avatar:'李',dept:'华南销售部'},
    {id:'quote01',name:'王报价',role:'role-quote',terminal:'tms',avatar:'王',dept:'报价中心'},
    {id:'finance01',name:'张财务',role:'role-finance',terminal:'tms',avatar:'张',dept:'财务部'},
    {id:'customer-001',name:'上海锦程国际',role:'role-customer',terminal:'oms',avatar:'锦',dept:'客户'},
    {id:'customer-002',name:'东莞市鑫海物流',role:'role-customer',terminal:'oms',avatar:'鑫',dept:'客户'},
    {id:'pda-wh-1',name:'李仓管',role:'role-pda',terminal:'pda',avatar:'李',dept:'仓库 A 区'}
];

var _currentAccount='admin'; // 当前登录账号
var _currentTerminal=(function(){var t=localStorage.getItem('terminal');return (t==='oms'||t==='tms'||t==='pda')?t:'tms';})(); // 当前端
var _currentLang='zh';
