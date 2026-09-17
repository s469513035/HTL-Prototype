/* ==========================================================================
 * 47 · 审批 › 公告与消息 —— 主动发布 / 接收范围 / 已读未读 / 推送记录
 *
 * 链路：公告管理（拟稿）
 *          │ 接收范围：客户(全部/按等级/指定) + 员工(全体/按组织架构/指定)
 *          ▼
 *        发布 ──┬─▶ 我的公告 msg-inbox（一人一行，记已读未读）
 *               └─▶ 推送记录 msg-push-log（一人一渠道一行，多端扩展预留）
 *
 * 与已有「我的消息」approval-msg 的区别：
 *   approval-msg 是系统事件触发、挂运单、一对一的业务消息；
 *   这里是人主动发起、不挂单据、一对多的公告/消息。两者并行不合并。
 *
 * 依赖（都在更早加载的文件里）：
 *   42 · fclFinRows / fclFinGet / fclFinSet / fclFinRefresh / fclParseMoney
 *   45 · fclPushRow / fclSeqNo / fclNow / fclWho
 *   全局 · tr / esc / showToast / openConfirmTip / closeCrudModal /
 *          getSelectedRowIndices / getSelectedRowIndex
 * ========================================================================== */

var MSG_KIND_OPTIONS=['公告','消息'];
var MSG_CATEGORY_OPTIONS=['系统维护','船期航线','价格政策','操作规范','假期安排','合规风控','营销活动','其他'];
var MSG_PRIORITY_OPTIONS=['普通','重要','紧急'];
/* 渠道组合按「站内信打底 + 叠加外部渠道」给几个常用搭配，
 * 与 42 的「通知方式」写法保持一致（站内消息/站内消息+邮件/…）。 */
var MSG_CHANNEL_OPTIONS=['站内信','站内信+APP推送','站内信+企业微信','站内信+APP推送+企业微信',
    '站内信+邮件','站内信+邮件+WhatsApp','全渠道'];
/* 各渠道当前是否已接入。未接入的照样写推送记录，但结果标「未开通」，
 * 这样接入哪个渠道、还差哪个渠道，在推送记录里一眼能看出来。 */
var MSG_CHANNEL_READY={'站内信':true,'APP推送':true,'企业微信':true,'邮件':true,
    'WhatsApp':false,'短信':false};
var MSG_ALL_CHANNELS=['站内信','APP推送','企业微信','邮件','WhatsApp','短信'];

/* ==========================================================================
 * 一、公告管理（发布端）
 * ========================================================================== */
addPrototypeTable('msg-announce','公告管理',
    '公告编号|标题|公告类型|业务分类|优先级|内容摘要|正文|附件|接收方|接收对象|是否置顶|生效时间|失效时间|推送渠道|触达人数|已读人数|阅读率|发布人|发布时间|撤回原因|状态|操作',
    ['草稿','已发布','已撤回','已失效'],[
    ['ANN-20260910001','2026 年国庆假期出货安排','公告','假期安排','重要',
     '10/1-10/7 放假，9/28 为节前最后收货日，节后 10/8 恢复正常收货',
     '各位客户、同事：\n\n根据国家法定节假日安排，我司 2026 年国庆假期为 10 月 1 日至 10 月 7 日，共 7 天。\n\n一、收货安排\n1. 节前最后收货日：9 月 28 日 17:00（深圳/广州/上海仓同步）\n2. 节后恢复收货：10 月 8 日 09:00\n\n二、船期安排\n假期期间西非线正常开船，具体船期见附件。已订舱货物请于 9 月 28 日前送仓完毕。\n\n三、值班安排\n假期期间客服值班电话 0755-88888888，海外仓照常作业。\n\n请各位提前安排出货计划，谢谢配合。',
     '国庆船期表.xlsx;值班安排.pdf','客户+员工','客户: 按客户等级(A类)(3)；员工: 按组织架构(商务部)(3)',
     '是','2026-09-10','2026-10-10','站内信+APP推送+企业微信','6','4','66.67%','张建国','2026-09-10 09:00','','已发布'],
    ['ANN-20260912002','西非线 10 月起运价调整通知','公告','价格政策','紧急',
     '受旺季附加费影响，10 月 1 日起拉各斯/特马线整柜运价上调 USD 150/柜',
     '尊敬的客户：\n\n受旺季舱位紧张及船司附加费上调影响，自 2026 年 10 月 1 日（以开船日为准）起，我司西非线运价调整如下：\n\n1. 深圳/广州 → 拉各斯：40HQ 上调 USD 150/柜\n2. 深圳/广州 → 特马：40HQ 上调 USD 150/柜\n3. 散货拼箱：上调 USD 8/CBM\n\n10 月 1 日前已订舱并完成送仓的货物按原价执行。\n\n如有疑问请联系您的对接业务员。',
     '10月运价表.pdf','客户','客户: 指定客户(2)',
     '是','2026-09-12','2026-10-31','站内信+邮件+WhatsApp','2','1','50.00%','李明辉','2026-09-12 14:30','','已发布'],
    ['ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','公告','系统维护','重要',
     '9 月 20 日 00:00-04:00 停机升级，财务相关功能全部不可用，请提前完成月结与付款登记',
     '财务部各位同事：\n\n为上线整柜代理成本模块，定于 2026 年 9 月 20 日（周日）00:00 - 04:00 进行停机升级。\n\n一、影响范围\n应收账单、收款核销、应付账单、付款登记、银行流水匹配全部不可用。\n\n二、请提前完成\n1. 9 月 19 日 18:00 前完成当月已确认账单的核销\n2. 待付款的应付账单请在 19 日前完成付款登记，避免跨期\n3. 升级期间如有紧急付款，走线下审批并于 20 日补录\n\n三、升级内容\n新增「代理账单导入 → 两级分摊 → 对账 → 付款申请」全链路，升级后请留意新菜单。',
     '','员工','员工: 按组织架构(财务部)(9)',
     '否','2026-09-14','2026-09-21','站内信+企业微信','9','3','33.33%','张建国','2026-09-14 18:00','','已发布'],
    ['ANN-20260915004','本周五全仓盘点，仓库组请配合','消息','操作规范','普通',
     '9/19 全天盘点，当日暂停出库，请提前安排',
     '仓库组同事：\n\n本周五（9 月 19 日）进行月度全仓盘点，安排如下：\n\n1. 当日 08:00 起暂停出库作业，入库正常\n2. 盘点使用 PDA「国内库存盘点」功能，按货区分组\n3. 盘点差异当日 18:00 前提交操作主管复核\n\n请提前通知已预约当日提货的客户改期。',
     '','员工','员工: 指定员工(2)',
     '否','2026-09-15','2026-09-20','站内信','2','0','0.00%','王海波','2026-09-15 08:30','','已发布'],
    ['ANN-20260916005','11 月西非船期预告','公告','船期航线','普通',
     '11 月西非线船期预排，待船司确认后正式发布',
     '（拟稿中）11 月西非线船期预排表见附件，最终以船司确认为准。',
     '','','','否','2026-11-01','2026-11-30','站内信+APP推送','0','0','','','','','草稿']
],[
    {label:'公告编号',type:'text'},
    {label:'标题',type:'text'},
    {label:'公告类型',type:'select',options:MSG_KIND_OPTIONS},
    {label:'业务分类',type:'select',options:MSG_CATEGORY_OPTIONS},
    {label:'优先级',type:'select',options:MSG_PRIORITY_OPTIONS},
    {label:'接收方',type:'select',options:['客户','员工','客户+员工']},
    {label:'发布人',type:'text'},
    {label:'状态',type:'select',options:['草稿','已发布','已撤回','已失效']}
]);
/* 正文太长、撤回原因平时为空，都不进列表；点「查看详情」看得到 */
TC['msg-announce'].listHiddenHeaders=['正文','撤回原因'];
/* 接收方/接收对象由「接收范围」弹窗维护，统计与发布信息由系统回写，都不给人手填 */
TC['msg-announce'].modalExcludedFields=['接收方','接收对象','触达人数','已读人数','阅读率',
    '发布人','发布时间','撤回原因','状态'];
TC['msg-announce'].fieldOptions={
    '公告类型':MSG_KIND_OPTIONS,'业务分类':MSG_CATEGORY_OPTIONS,
    '优先级':MSG_PRIORITY_OPTIONS,'是否置顶':['是','否'],
    '推送渠道':MSG_CHANNEL_OPTIONS
};
TC['msg-announce'].modalFieldTypes={'正文':'textarea','生效时间':'date','失效时间':'date'};
TC['msg-announce'].modalFieldClass={'内容摘要':'modal-remark-full','正文':'modal-remark-full'};
TC['msg-announce'].requiredOverrides={'标题':true,'正文':true,'内容摘要':false,'附件':false};
TC['msg-announce'].modalCols=3;
TC['msg-announce'].statusBadgeCols=['优先级'];

/* ==========================================================================
 * 二、我的公告（接收端）—— 发布时按命中的人一人一行展开，已读未读记在这里
 * ========================================================================== */
addPrototypeTable('msg-inbox','我的公告',
    '收件编号|公告编号|标题|公告类型|业务分类|优先级|是否置顶|接收方|接收人|接收账号|发布人|发布时间|生效时间|失效时间|阅读状态|阅读时间|状态|操作',
    ['未读','已读'],[
    /* ANN-20260910001：客户 A 类 3 家 + 商务部 3 人，已读 4 */
    ['MIB-20260910001','ANN-20260910001','2026 年国庆假期出货安排','公告','假期安排','重要','是','客户','华运达国际货运','C10001','张建国','2026-09-10 09:00','2026-09-10','2026-10-10','已读','2026-09-10 10:12','有效'],
    ['MIB-20260910002','ANN-20260910001','2026 年国庆假期出货安排','公告','假期安排','重要','是','客户','恒通货运代理','C10003','张建国','2026-09-10 09:00','2026-09-10','2026-10-10','已读','2026-09-10 11:40','有效'],
    ['MIB-20260910003','ANN-20260910001','2026 年国庆假期出货安排','公告','假期安排','重要','是','客户','锦程国际贸易','C10005','张建国','2026-09-10 09:00','2026-09-10','2026-10-10','未读','','有效'],
    ['MIB-20260910004','ANN-20260910001','2026 年国庆假期出货安排','公告','假期安排','重要','是','员工','谢舒婷','WH-Amy','张建国','2026-09-10 09:00','2026-09-10','2026-10-10','已读','2026-09-10 09:35','有效'],
    ['MIB-20260910005','ANN-20260910001','2026 年国庆假期出货安排','公告','假期安排','重要','是','员工','许倩','WH-Viola','张建国','2026-09-10 09:00','2026-09-10','2026-10-10','已读','2026-09-11 08:20','有效'],
    ['MIB-20260910006','ANN-20260910001','2026 年国庆假期出货安排','公告','假期安排','重要','是','员工','胡依','WH-Kacey','张建国','2026-09-10 09:00','2026-09-10','2026-10-10','未读','','有效'],
    /* ANN-20260912002：指定客户 2 家，已读 1 */
    ['MIB-20260912007','ANN-20260912002','西非线 10 月起运价调整通知','公告','价格政策','紧急','是','客户','华运达国际货运','C10001','李明辉','2026-09-12 14:30','2026-09-12','2026-10-31','已读','2026-09-12 16:05','有效'],
    ['MIB-20260912008','ANN-20260912002','西非线 10 月起运价调整通知','公告','价格政策','紧急','是','客户','恒通货运代理','C10003','李明辉','2026-09-12 14:30','2026-09-12','2026-10-31','未读','','有效'],
    /* ANN-20260914003：财务部 9 人，已读 3 */
    ['MIB-20260914009','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','公告','系统维护','重要','否','员工','王红梅','SZ-Sunny','张建国','2026-09-14 18:00','2026-09-14','2026-09-21','已读','2026-09-14 18:22','有效'],
    ['MIB-20260914010','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','公告','系统维护','重要','否','员工','黄妙玲','SZ-Yami','张建国','2026-09-14 18:00','2026-09-14','2026-09-21','已读','2026-09-14 19:03','有效'],
    ['MIB-20260914011','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','公告','系统维护','重要','否','员工','雷芳','SZ-Apple','张建国','2026-09-14 18:00','2026-09-14','2026-09-21','已读','2026-09-15 08:41','有效'],
    ['MIB-20260914012','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','公告','系统维护','重要','否','员工','廖德慧','SZ-Loni','张建国','2026-09-14 18:00','2026-09-14','2026-09-21','未读','','有效'],
    ['MIB-20260914013','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','公告','系统维护','重要','否','员工','郭昌慈','SZ-Summer','张建国','2026-09-14 18:00','2026-09-14','2026-09-21','未读','','有效'],
    ['MIB-20260914014','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','公告','系统维护','重要','否','员工','张会敏','GZ-Demi','张建国','2026-09-14 18:00','2026-09-14','2026-09-21','未读','','有效'],
    ['MIB-20260914015','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','公告','系统维护','重要','否','员工','陈丽琪','GZ-Niki','张建国','2026-09-14 18:00','2026-09-14','2026-09-21','未读','','有效'],
    ['MIB-20260914016','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','公告','系统维护','重要','否','员工','孔莹','WH-Calm','张建国','2026-09-14 18:00','2026-09-14','2026-09-21','未读','','有效'],
    ['MIB-20260914017','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','公告','系统维护','重要','否','员工','唐燕','NB-Lily','张建国','2026-09-14 18:00','2026-09-14','2026-09-21','未读','','有效'],
    /* ANN-20260915004：指定员工 2 人，全部未读 */
    ['MIB-20260915018','ANN-20260915004','本周五全仓盘点，仓库组请配合','消息','操作规范','普通','否','员工','王红梅','SZ-Sunny','王海波','2026-09-15 08:30','2026-09-15','2026-09-20','未读','','有效'],
    ['MIB-20260915019','ANN-20260915004','本周五全仓盘点，仓库组请配合','消息','操作规范','普通','否','员工','黄小艳','SZ-Yoyo','王海波','2026-09-15 08:30','2026-09-15','2026-09-20','未读','','有效']
],[
    {label:'公告编号',type:'text'},
    {label:'标题',type:'text'},
    {label:'公告类型',type:'select',options:MSG_KIND_OPTIONS},
    {label:'业务分类',type:'select',options:MSG_CATEGORY_OPTIONS},
    {label:'优先级',type:'select',options:MSG_PRIORITY_OPTIONS},
    {label:'接收方',type:'select',options:['客户','员工']},
    {label:'接收人',type:'text'},
    {label:'阅读状态',type:'select',options:['未读','已读']}
]);
TC['msg-inbox'].noExpand=true;
TC['msg-inbox'].noAutoAudit=true;
/* 插页按「阅读状态」分：默认取数规则会先命中「状态」列，必须显式指定
 *（同 approval-msg 的做法，见 40-approval-message.js） */
TC['msg-inbox'].statusMatch=function(row,tab,headers){
    var i=headers.indexOf('阅读状态');
    return i>=0&&row[i]===tab;
};
TC['msg-inbox'].statusBadgeCols=['优先级','状态'];

/* ==========================================================================
 * 三、推送记录 —— 一人一渠道一行。站内信是兜底，外部渠道按接入情况记结果。
 * 多端扩展（APP / 企业微信 / WhatsApp / 短信）接进来后不用改表结构，
 * 只要把 MSG_CHANNEL_READY 对应项翻成 true 即可。
 * ========================================================================== */
addPrototypeTable('msg-push-log','推送记录',
    '推送编号|公告编号|标题|接收方|接收人|推送渠道|接收地址|发送时间|送达时间|发送结果|失败原因|重试次数|渠道回执号|备注|操作',
    ['已送达','发送中','发送失败','未开通'],[
    ['MPS-20260910001','ANN-20260910001','2026 年国庆假期出货安排','客户','华运达国际货运','站内信','系统站内','2026-09-10 09:00','2026-09-10 09:00','已送达','','0','IM-260910-0001',''],
    ['MPS-20260910002','ANN-20260910001','2026 年国庆假期出货安排','客户','华运达国际货运','APP推送','客户端APP · iOS','2026-09-10 09:00','2026-09-10 09:01','已送达','','0','PUSH-260910-8821',''],
    ['MPS-20260910003','ANN-20260910001','2026 年国庆假期出货安排','员工','谢舒婷','企业微信','708','2026-09-10 09:00','2026-09-10 09:00','已送达','','0','WW-260910-0012',''],
    ['MPS-20260910004','ANN-20260910001','2026 年国庆假期出货安排','员工','胡依','企业微信','893','2026-09-10 09:00','','发送中','','1','','企微通讯录同步中，待重试'],
    ['MPS-20260912005','ANN-20260912002','西非线 10 月起运价调整通知','客户','华运达国际货运','邮件','zhang@huayunda.com','2026-09-12 14:30','2026-09-12 14:31','已送达','','0','ML-260912-7731',''],
    ['MPS-20260912006','ANN-20260912002','西非线 10 月起运价调整通知','客户','恒通货运代理','邮件','wang@hengtong.com','2026-09-12 14:30','','发送失败','对方邮箱退信 550 mailbox unavailable','3','','已重试 3 次，建议改用 WhatsApp'],
    ['MPS-20260912007','ANN-20260912002','西非线 10 月起运价调整通知','客户','华运达国际货运','WhatsApp','—','','','未开通','客户档案缺 WhatsApp 号码，且渠道尚未接入','0','','预留：待 WhatsApp 通道接入后自动补发'],
    ['MPS-20260914008','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','员工','王红梅','企业微信','Sunny','2026-09-14 18:00','2026-09-14 18:00','已送达','','0','WW-260914-0031',''],
    ['MPS-20260914010','ANN-20260914003','财务系统 9/20 停机升级，请提前完成月结','员工','唐燕','企业微信','916','2026-09-14 18:00','','发送失败','企微账号未绑定该员工','2','','需人事在企微通讯录补录'],
    ['MPS-20260915009','ANN-20260915004','本周五全仓盘点，仓库组请配合','员工','王红梅','站内信','系统站内','2026-09-15 08:30','2026-09-15 08:30','已送达','','0','IM-260915-0009','']
],[
    {label:'推送编号',type:'text'},
    {label:'公告编号',type:'text'},
    {label:'接收方',type:'select',options:['客户','员工']},
    {label:'接收人',type:'text'},
    {label:'推送渠道',type:'select',options:MSG_ALL_CHANNELS},
    {label:'发送结果',type:'select',options:['已送达','发送中','发送失败','未开通']}
]);
TC['msg-push-log'].noExpand=true;
TC['msg-push-log'].noAutoAudit=true;
TC['msg-push-log'].statusMatch=function(row,tab,headers){
    var i=headers.indexOf('发送结果');
    return i>=0&&row[i]===tab;
};

/* ==========================================================================
 * 四、取数helper —— 接收人从哪来
 * ========================================================================== */
function msgCell(id,row,name){
    var h=(TC[id]&&TC[id].h)||[],i=h.indexOf(name);
    return (i>=0&&row&&row[i]!=null)?String(row[i]):'';
}
/* 客户：只取启用的，禁用/黑名单不发 */
function msgCustomers(){
    var c=TC['crm-cust'];
    if(!c||!c.d)return [];
    return c.d.filter(function(r){
        return msgCell('crm-cust',r,'启用状态')!=='禁用';
    }).map(function(r){
        return {
            code:msgCell('crm-cust',r,'客户代码'),
            name:msgCell('crm-cust',r,'客户简称')||msgCell('crm-cust',r,'客户全称'),
            level:msgCell('crm-cust',r,'客户等级'),
            type:msgCell('crm-cust',r,'客户类型'),
            email:msgCell('crm-cust',r,'客户邮箱')
        };
    });
}
function msgCustLevels(){
    var out=[];
    msgCustomers().forEach(function(x){if(x.level&&out.indexOf(x.level)<0)out.push(x.level);});
    return out.sort();
}
/* 组织架构：用 perm-dept（部门管理）这棵真树，分公司 → 部门 */
function msgDeptTree(){
    var c=TC['perm-dept'];
    if(!c||!c.d)return [];
    var map={},order=[];
    c.d.forEach(function(r){
        if(msgCell('perm-dept',r,'是否启用')==='否')return;
        var branch=msgCell('perm-dept',r,'所属分公司')||'未分配';
        if(!map[branch]){map[branch]={branch:branch,depts:[]};order.push(map[branch]);}
        map[branch].depts.push({
            code:msgCell('perm-dept',r,'部门编码'),
            name:msgCell('perm-dept',r,'部门名称'),
            leader:msgCell('perm-dept',r,'负责人')
        });
    });
    return order;
}
/* 部门 → 岗位关键词。
 * 员工档案的「所属部门」列是历史脏数据（DEP-OPS / 363 / 337，和 perm-dept
 * 的部门编码对不上），原型阶段先按岗位关键词归属；上线时改成按部门编码直连即可。 */
var MSG_DEPT_POSTS={
    'SZ-FIN':['财务','会计','出纳','业财'],
    'SZ-HR':['人事','行政','招聘','管培'],
    'WH-BIZ':['商务'],
    'WH-OPS':['操作'],
    'WH-BOOK':['订舱'],
    'GZ-SCS':['散货'],
    'YW-CS':['客服'],
    'NB-SAL':['销售','业务']
};
/* 员工：只取在职 */
function msgEmployees(){
    var c=TC['base-employee'];
    if(!c||!c.d)return [];
    return c.d.filter(function(r){
        var st=msgCell('base-employee',r,'在职状态');
        return !st||st==='在职';
    }).map(function(r){
        return {
            code:msgCell('base-employee',r,'员工编码'),
            name:msgCell('base-employee',r,'员工名称'),
            post:msgCell('base-employee',r,'岗位/职位'),
            account:msgCell('base-employee',r,'系统登录账号'),
            wework:msgCell('base-employee',r,'企业微信账号'),
            email:msgCell('base-employee',r,'企业邮箱'),
            mobile:msgCell('base-employee',r,'手机')
        };
    }).filter(function(x){return !!x.name;});
}
function msgEmpInDept(emp,deptCode){
    var keys=MSG_DEPT_POSTS[deptCode]||[];
    var post=String(emp.post||'');
    for(var i=0;i<keys.length;i++)if(post.indexOf(keys[i])>=0)return true;
    return false;
}
function msgEmpDeptCount(deptCode){
    var emps=msgEmployees(),n=0;
    emps.forEach(function(e){if(msgEmpInDept(e,deptCode))n++;});
    return n;
}

/* ==========================================================================
 * 五、接收范围 —— 客户(全部/按等级/指定) + 员工(全体/按组织架构/指定)
 * 范围存在这里，按公告编号索引；发布时据此解析出真实接收人名单。
 * ========================================================================== */
/* 种子范围与种子收件记录一一对应：四条已发布公告正好覆盖四种圈人方式
 * （按客户等级 / 按组织架构 / 指定客户 / 指定员工），
 * 「全部客户」「全体员工」两种可以在草稿 ANN-20260916005 上现场演示。 */
var _MSG_SCOPES={
    'ANN-20260910001':{cust:{mode:'level',levels:['A类'],ids:[]},emp:{mode:'dept',depts:['WH-BIZ'],ids:[]}},
    'ANN-20260912002':{cust:{mode:'pick',levels:[],ids:['华运达国际货运','恒通货运代理']},emp:{mode:'none',depts:[],ids:[]}},
    'ANN-20260914003':{cust:{mode:'none',levels:[],ids:[]},emp:{mode:'dept',depts:['SZ-FIN'],ids:[]}},
    'ANN-20260915004':{cust:{mode:'none',levels:[],ids:[]},emp:{mode:'pick',depts:[],ids:['王红梅','黄小艳']}},
    'ANN-20260916005':{cust:{mode:'none',levels:[],ids:[]},emp:{mode:'none',depts:[],ids:[]}}
};
function msgDefaultScope(){
    return {cust:{mode:'none',levels:[],ids:[]},emp:{mode:'none',depts:[],ids:[]}};
}
function msgScopeOf(no){
    if(!_MSG_SCOPES[no])_MSG_SCOPES[no]=msgDefaultScope();
    return _MSG_SCOPES[no];
}
/* 把范围解析成真实接收人名单（客户 + 员工，各自去重） */
function msgResolveScope(scope){
    var out={cust:[],emp:[]};
    if(!scope)return out;
    var cs=scope.cust||{};
    if(cs.mode==='all')out.cust=msgCustomers();
    else if(cs.mode==='level')out.cust=msgCustomers().filter(function(x){return (cs.levels||[]).indexOf(x.level)>=0;});
    else if(cs.mode==='pick')out.cust=msgCustomers().filter(function(x){return (cs.ids||[]).indexOf(x.name)>=0;});
    var es=scope.emp||{};
    if(es.mode==='all')out.emp=msgEmployees();
    else if(es.mode==='dept'){
        out.emp=msgEmployees().filter(function(e){
            return (es.depts||[]).some(function(d){return msgEmpInDept(e,d);});
        });
    }
    else if(es.mode==='pick')out.emp=msgEmployees().filter(function(e){return (es.ids||[]).indexOf(e.name)>=0;});
    /* 同名去重：按账号优先，没账号退回姓名 */
    var seen={};
    out.emp=out.emp.filter(function(e){
        var k=e.code||e.account||e.name;
        if(seen[k])return false;seen[k]=1;return true;
    });
    return out;
}
/* 「客户: 全部客户(3)；员工: 按组织架构(操作部, 订舱部)(3)」这种人话摘要 */
function msgScopeSummary(scope,hit){
    var parts=[],cs=(scope&&scope.cust)||{},es=(scope&&scope.emp)||{};
    var tree=msgDeptTree(),deptName=function(code){
        for(var i=0;i<tree.length;i++)for(var j=0;j<tree[i].depts.length;j++)
            if(tree[i].depts[j].code===code)return tree[i].depts[j].name;
        return code;
    };
    if(cs.mode==='all')parts.push(tr('客户')+': '+tr('全部客户')+'('+hit.cust.length+')');
    else if(cs.mode==='level')parts.push(tr('客户')+': '+tr('按客户等级')+'('+(cs.levels||[]).join(', ')+')('+hit.cust.length+')');
    else if(cs.mode==='pick')parts.push(tr('客户')+': '+tr('指定客户')+'('+hit.cust.length+')');
    if(es.mode==='all')parts.push(tr('员工')+': '+tr('全体员工')+'('+hit.emp.length+')');
    else if(es.mode==='dept')parts.push(tr('员工')+': '+tr('按组织架构')+'('+(es.depts||[]).map(deptName).join(', ')+')('+hit.emp.length+')');
    else if(es.mode==='pick')parts.push(tr('员工')+': '+tr('指定员工')+'('+hit.emp.length+')');
    return parts.join('；');
}
function msgScopeReceiverText(scope,hit){
    var c=hit.cust.length>0,e=hit.emp.length>0;
    return c&&e?'客户+员工':(c?'客户':(e?'员工':''));
}

/* ==========================================================================
 * 六、接收范围弹窗
 * ========================================================================== */
var _msgScopeCtx={id:'',idx:-1,no:'',title:''};
var _msgScopeDraft=null;
var MSG_CUST_MODES=[['none','不发送客户'],['all','全部客户'],['level','按客户等级'],['pick','指定客户']];
var MSG_EMP_MODES=[['none','不发送员工'],['all','全体员工'],['dept','按组织架构'],['pick','指定员工']];

function openMsgScope(id){
    id=id||'msg-announce';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选一条公告'));return;}
    if(idxs.length>1){showToast(tr('设置接收范围一次只能选一条'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到公告'));return;}
    var st=fclFinGet(id,row,'状态');
    if(st!=='草稿'){showToast(tr('该公告为')+'「'+tr(st)+'」，'+tr('只有草稿能改接收范围；已发布的请先撤回'));return;}
    var no=fclFinGet(id,row,'公告编号');
    var s=msgScopeOf(no);
    _msgScopeCtx={id:id,idx:idxs[0],no:no,title:fclFinGet(id,row,'标题')};
    /* 深拷一份草稿，取消时不污染原范围 */
    _msgScopeDraft={
        cust:{mode:s.cust.mode,levels:(s.cust.levels||[]).slice(),ids:(s.cust.ids||[]).slice()},
        emp:{mode:s.emp.mode,depts:(s.emp.depts||[]).slice(),ids:(s.emp.ids||[]).slice()}
    };
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='76%';
    document.getElementById('crud-modal-title').textContent=tr('接收范围')+' - '+_msgScopeCtx.title;
    document.getElementById('crud-modal-body').innerHTML=msgScopeBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitMsgScope()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('保存范围')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function msgScopeBodyHtml(){
    var h='';
    h+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(_msgScopeCtx.no)+'　'+esc(_msgScopeCtx.title)+
       '<div class="mt-1 text-xs text-text-muted">'+
       esc(tr('客户与员工两侧可以分别设置，也可以只发一侧；发布时按这里命中的名单一人一行展开到「我的公告」。'))+
       '</div></div>';
    h+='<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">';
    h+=msgScopeSidePanel('cust');
    h+=msgScopeSidePanel('emp');
    h+='</div>';
    h+='<div data-msg-preview>'+msgScopePreviewHtml()+'</div>';
    return h;
}
function msgScopeSidePanel(side){
    var isCust=side==='cust';
    var d=_msgScopeDraft[side],modes=isCust?MSG_CUST_MODES:MSG_EMP_MODES;
    var h='<div class="border border-surface-200 rounded-lg overflow-hidden" data-msg-side="'+side+'">';
    h+='<div class="px-3 py-2 bg-surface-50 flex items-center gap-2">'+
       '<span class="w-1 h-4 '+(isCust?'bg-primary-500':'bg-amber-500')+' rounded"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr(isCust?'客户接收范围':'员工接收范围')+'</span></div>';
    h+='<div class="p-3">';
    h+='<div class="flex flex-wrap gap-x-4 gap-y-2 mb-3">';
    modes.forEach(function(m){
        h+='<label class="inline-flex items-center gap-1.5 cursor-pointer">'+
           '<input type="radio" name="msg-mode-'+side+'" value="'+m[0]+'"'+(d.mode===m[0]?' checked':'')+
           ' onchange="msgScopeSetMode(\''+side+'\',\''+m[0]+'\')" class="text-primary-600">'+
           '<span class="text-sm text-text-primary">'+tr(m[1])+'</span></label>';
    });
    h+='</div>';
    h+='<div class="min-h-[180px]">'+(isCust?msgScopeCustCond():msgScopeEmpCond())+'</div>';
    h+='</div></div>';
    return h;
}
function msgScopeHint(text){
    return '<div class="px-3 py-8 text-center text-sm text-text-muted">'+esc(tr(text))+'</div>';
}
function msgScopeCustCond(){
    var d=_msgScopeDraft.cust,list=msgCustomers();
    if(d.mode==='none')return msgScopeHint('本次不发送给客户');
    if(d.mode==='all')return msgScopeHint('将发送给全部启用客户，共 '+list.length+' 家（禁用客户自动排除）');
    if(d.mode==='level'){
        var levels=msgCustLevels();
        var h='<div class="space-y-2">';
        levels.forEach(function(lv){
            var n=list.filter(function(x){return x.level===lv;}).length;
            h+='<label class="flex items-center justify-between px-3 py-2 border border-surface-200 rounded-lg hover:bg-primary-50/40 cursor-pointer">'+
               '<span class="inline-flex items-center gap-2"><input type="checkbox" data-msg-level="'+esc(lv)+'"'+
               ((d.levels||[]).indexOf(lv)>=0?' checked':'')+' onchange="msgScopeChanged()" class="rounded border-surface-300 text-primary-600">'+
               '<span class="text-sm text-text-primary">'+esc(lv)+'</span></span>'+
               '<span class="text-xs text-text-muted">'+n+' '+tr('家')+'</span></label>';
        });
        return h+'</div>';
    }
    var h2='<div class="border border-surface-200 rounded-lg max-h-56 overflow-auto divide-y divide-surface-100">';
    list.forEach(function(x){
        h2+='<label class="flex items-center justify-between px-3 py-2 hover:bg-primary-50/40 cursor-pointer">'+
            '<span class="inline-flex items-center gap-2"><input type="checkbox" data-msg-cust="'+esc(x.name)+'"'+
            ((d.ids||[]).indexOf(x.name)>=0?' checked':'')+' onchange="msgScopeChanged()" class="rounded border-surface-300 text-primary-600">'+
            '<span class="text-sm text-text-primary">'+esc(x.name)+'</span></span>'+
            '<span class="text-xs text-text-muted">'+esc(x.level)+' · '+esc(x.type)+'</span></label>';
    });
    return h2+'</div>';
}
function msgScopeEmpCond(){
    var d=_msgScopeDraft.emp,emps=msgEmployees();
    if(d.mode==='none')return msgScopeHint('本次不发送给员工');
    if(d.mode==='all')return msgScopeHint('将发送给全体在职员工，共 '+emps.length+' 人（离职自动排除）');
    if(d.mode==='dept'){
        var tree=msgDeptTree();
        var h='<div class="border border-surface-200 rounded-lg max-h-56 overflow-auto">';
        tree.forEach(function(b){
            h+='<div class="px-3 py-1.5 bg-surface-50 text-xs font-medium text-text-secondary sticky top-0">'+esc(b.branch)+'</div>';
            b.depts.forEach(function(dp){
                var n=msgEmpDeptCount(dp.code);
                h+='<label class="flex items-center justify-between px-3 py-2 hover:bg-primary-50/40 cursor-pointer border-t border-surface-100">'+
                   '<span class="inline-flex items-center gap-2"><input type="checkbox" data-msg-dept="'+esc(dp.code)+'"'+
                   ((d.depts||[]).indexOf(dp.code)>=0?' checked':'')+' onchange="msgScopeChanged()" class="rounded border-surface-300 text-primary-600">'+
                   '<span class="text-sm text-text-primary">'+esc(dp.name)+'</span></span>'+
                   '<span class="text-xs '+(n?'text-text-muted':'text-amber-600')+'">'+n+' '+tr('人')+'</span></label>';
            });
        });
        return h+'</div>';
    }
    var h2='';
    h2+='<input type="text" oninput="msgEmpFilter(this)" placeholder="'+esc(tr('搜索姓名或岗位'))+
        '" class="w-full h-8 px-3 mb-2 text-sm border border-surface-200 rounded-lg bg-surface-50">';
    h2+='<div class="border border-surface-200 rounded-lg max-h-48 overflow-auto divide-y divide-surface-100">';
    emps.forEach(function(e){
        h2+='<label data-emp-row data-emp-key="'+esc(e.name+' '+e.post)+'" class="flex items-center justify-between px-3 py-2 hover:bg-primary-50/40 cursor-pointer">'+
            '<span class="inline-flex items-center gap-2"><input type="checkbox" data-msg-emp="'+esc(e.name)+'"'+
            ((d.ids||[]).indexOf(e.name)>=0?' checked':'')+' onchange="msgScopeChanged()" class="rounded border-surface-300 text-primary-600">'+
            '<span class="text-sm text-text-primary">'+esc(e.name)+'</span></span>'+
            '<span class="text-xs text-text-muted">'+esc(e.post)+'</span></label>';
    });
    return h2+'</div>';
}
/* 纯前端过滤，不重渲染 —— 重渲染会让搜索框失焦 */
function msgEmpFilter(inp){
    var q=String(inp.value||'').toLowerCase();
    document.querySelectorAll('[data-emp-row]').forEach(function(el){
        var t=String(el.getAttribute('data-emp-key')||'').toLowerCase();
        if(q&&t.indexOf(q)<0)el.classList.add('hidden');else el.classList.remove('hidden');
    });
}
/* 勾选变化：只回读草稿 + 刷新命中预览，不重渲染列表（保住滚动位置） */
function msgScopeChanged(){
    msgScopeReadUI();
    var box=document.querySelector('[data-msg-preview]');
    if(box)box.innerHTML=msgScopePreviewHtml();
}
/* 切换模式：条件区整块换掉，换之前先把当前勾选存进草稿 */
function msgScopeSetMode(side,mode){
    msgScopeReadUI();
    _msgScopeDraft[side].mode=mode;
    var panel=document.querySelector('[data-msg-side="'+side+'"]');
    if(panel)panel.outerHTML=msgScopeSidePanel(side);
    msgScopeChanged();
}
function msgScopeReadUI(){
    var pick=function(sel){
        var out=[];
        document.querySelectorAll(sel+':checked').forEach(function(x){
            out.push(x.getAttribute(sel.replace(/^\[|\]$/g,'')));
        });
        return out;
    };
    if(document.querySelector('[data-msg-level]'))_msgScopeDraft.cust.levels=pick('[data-msg-level]');
    if(document.querySelector('[data-msg-cust]'))_msgScopeDraft.cust.ids=pick('[data-msg-cust]');
    if(document.querySelector('[data-msg-dept]'))_msgScopeDraft.emp.depts=pick('[data-msg-dept]');
    if(document.querySelector('[data-msg-emp]'))_msgScopeDraft.emp.ids=pick('[data-msg-emp]');
}
function msgScopePreviewHtml(){
    var hit=msgResolveScope(_msgScopeDraft);
    var total=hit.cust.length+hit.emp.length;
    var cls=total?'bg-success-50 border-success-100 text-success-700':'bg-amber-50 border-amber-100 text-amber-700';
    var h='<div class="mt-4 px-3 py-2.5 rounded-lg border '+cls+' text-sm">';
    if(total){
        h+=tr('命中')+'：'+tr('客户')+' <span class="font-semibold">'+hit.cust.length+'</span> '+tr('家')+
           '　'+tr('员工')+' <span class="font-semibold">'+hit.emp.length+'</span> '+tr('人')+
           '　'+tr('合计')+' <span class="font-semibold">'+total+'</span> '+tr('个接收人');
        var names=hit.cust.slice(0,3).map(function(x){return x.name;})
            .concat(hit.emp.slice(0,3).map(function(x){return x.name;}));
        h+='<div class="mt-1 text-xs opacity-80">'+esc(names.join('、'))+(total>names.length?(' '+tr('等')+' '+total+' '+tr('人')):'')+'</div>';
    }else{
        h+=tr('当前条件没有命中任何接收人，保存后无法发布');
    }
    return h+'</div>';
}
function submitMsgScope(){
    msgScopeReadUI();
    var hit=msgResolveScope(_msgScopeDraft);
    var id=_msgScopeCtx.id,row=fclFinRows(id)[_msgScopeCtx.idx];
    if(!row){showToast(tr('未找到公告'));return;}
    _MSG_SCOPES[_msgScopeCtx.no]=_msgScopeDraft;
    fclFinSet(id,row,'接收方',msgScopeReceiverText(_msgScopeDraft,hit));
    fclFinSet(id,row,'接收对象',msgScopeSummary(_msgScopeDraft,hit));
    fclFinSet(id,row,'触达人数',String(hit.cust.length+hit.emp.length));
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('接收范围已保存')+'：'+tr('客户')+' '+hit.cust.length+'，'+tr('员工')+' '+hit.emp.length+
        (hit.cust.length+hit.emp.length?('，'+tr('可以发布了')):('，'+tr('还没命中任何人'))));
}

/* ==========================================================================
 * 七、发布 —— 展开成 我的公告 行 + 推送记录 行
 * ========================================================================== */
function msgChannelsOf(text){
    if(text==='全渠道')return MSG_ALL_CHANNELS.slice();
    var arr=String(text||'站内信').split('+').map(function(s){return s.trim();}).filter(Boolean);
    if(arr.indexOf('站内信')<0)arr.unshift('站内信');   /* 站内信是兜底，永远发 */
    return arr;
}
function msgAddressOf(side,person,channel){
    if(channel==='站内信')return '系统站内';
    if(channel==='APP推送')return side==='客户'?'客户端APP':'员工端APP';
    if(channel==='企业微信')return person.wework||person.account||'';
    if(channel==='邮件')return person.email||'';
    if(channel==='短信')return person.mobile||'';
    return '';   /* WhatsApp：客户档案目前没有这个字段，见文档 TBD-01 */
}
function openMsgPublish(id){
    id=id||'msg-announce';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要发布的公告'));return;}
    if(idxs.length>1){showToast(tr('发布一次只能选一条'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到公告'));return;}
    var st=fclFinGet(id,row,'状态');
    if(st!=='草稿'){showToast(tr('该公告为')+'「'+tr(st)+'」，'+tr('只有草稿可以发布'));return;}
    if(!fclFinGet(id,row,'标题')||!fclFinGet(id,row,'正文')){showToast(tr('标题和正文都填了才能发布'));return;}
    var no=fclFinGet(id,row,'公告编号');
    var hit=msgResolveScope(msgScopeOf(no));
    var total=hit.cust.length+hit.emp.length;
    if(!total){showToast(tr('还没设置接收范围，或当前条件没命中人。请先点「接收范围」'));return;}
    var chans=msgChannelsOf(fclFinGet(id,row,'推送渠道'));
    var msg=tr('确认发布')+'「'+fclFinGet(id,row,'标题')+'」？\n'+
        tr('接收人')+'：'+tr('客户')+' '+hit.cust.length+' '+tr('家')+'，'+tr('员工')+' '+hit.emp.length+' '+tr('人')+'，'+tr('合计')+' '+total+'\n'+
        tr('推送渠道')+'：'+chans.join('、')+'\n'+
        tr('发布后将生成')+' '+total+' '+tr('条收件记录和')+' '+(total*chans.length)+' '+tr('条推送记录');
    openConfirmTip(msg,function(){msgDoPublish(id,row,hit,chans);});
}
function msgDoPublish(id,row,hit,chans){
    var now=fclNow(),who=fclWho();
    var no=fclFinGet(id,row,'公告编号');
    var base={
        '公告编号':no,'标题':fclFinGet(id,row,'标题'),
        '公告类型':fclFinGet(id,row,'公告类型'),'业务分类':fclFinGet(id,row,'业务分类'),
        '优先级':fclFinGet(id,row,'优先级'),'是否置顶':fclFinGet(id,row,'是否置顶'),
        '发布人':who,'发布时间':now,
        '生效时间':fclFinGet(id,row,'生效时间'),'失效时间':fclFinGet(id,row,'失效时间')
    };
    var people=hit.cust.map(function(x){return {side:'客户',p:x};})
        .concat(hit.emp.map(function(x){return {side:'员工',p:x};}));
    people.forEach(function(it){
        var acct=it.side==='客户'?(it.p.code||''):(it.p.account||'');
        var m={};for(var k in base)m[k]=base[k];
        m['收件编号']=fclSeqNo('MIB','msg-inbox');
        m['接收方']=it.side;m['接收人']=it.p.name;m['接收账号']=acct;
        m['阅读状态']='未读';m['阅读时间']='';m['状态']='有效';
        fclPushRow('msg-inbox',m);
        chans.forEach(function(ch){
            var addr=msgAddressOf(it.side,it.p,ch);
            var ready=!!MSG_CHANNEL_READY[ch];
            var result,reason,note,sendT,okT;
            if(!ready){
                result='未开通';reason=tr('渠道尚未接入');note=tr('预留：通道接入后可对该公告补发');
                sendT='';okT='';
            }else if(!addr){
                result='发送失败';reason=tr('接收人档案缺少该渠道的联系方式');note='';
                sendT=now;okT='';
            }else{
                result='已送达';reason='';note='';sendT=now;okT=now;
            }
            fclPushRow('msg-push-log',{
                '推送编号':fclSeqNo('MPS','msg-push-log'),
                '公告编号':no,'标题':base['标题'],
                '接收方':it.side,'接收人':it.p.name,
                '推送渠道':ch,'接收地址':addr||'—',
                '发送时间':sendT,'送达时间':okT,
                '发送结果':result,'失败原因':reason,'重试次数':'0',
                '渠道回执号':result==='已送达'?(ch==='站内信'?'IM-':'CH-')+String(Date.now()).slice(-8):'',
                '备注':note
            });
        });
    });
    fclFinSet(id,row,'接收方',msgScopeReceiverText(msgScopeOf(no),hit));
    fclFinSet(id,row,'接收对象',msgScopeSummary(msgScopeOf(no),hit));
    fclFinSet(id,row,'触达人数',String(people.length));
    fclFinSet(id,row,'已读人数','0');
    fclFinSet(id,row,'阅读率','0.00%');
    fclFinSet(id,row,'发布人',who);
    fclFinSet(id,row,'发布时间',now);
    fclFinSet(id,row,'状态','已发布');
    if(typeof _listData!=='undefined'){delete _listData['msg-inbox'];delete _listData['msg-push-log'];}
    fclFinRefresh(id);
    if(typeof updateNotifBadge==='function')updateNotifBadge();
    showToast(tr('发布成功')+'：'+people.length+' '+tr('条收件记录')+'，'+
        (people.length*chans.length)+' '+tr('条推送记录')+'（'+chans.join('、')+'）');
}

/* ===== 撤回 ===== */
var _msgRecallCtx={id:'',idx:-1};
function openMsgRecall(id){
    id=id||'msg-announce';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要撤回的公告'));return;}
    if(idxs.length>1){showToast(tr('撤回一次只能选一条'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到公告'));return;}
    var st=fclFinGet(id,row,'状态');
    if(st!=='已发布'){showToast(tr('该公告为')+'「'+tr(st)+'」，'+tr('只有已发布的可以撤回'));return;}
    _msgRecallCtx={id:id,idx:idxs[0]};
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-700">'+
       esc(fclFinGet(id,row,'标题'))+'　'+tr('已触达')+' '+esc(fclFinGet(id,row,'触达人数'))+' '+tr('人')+
       '<div class="mt-1 text-xs opacity-80">'+
       esc(tr('撤回后各端立即不再显示，但收件记录与推送记录保留留痕，便于事后追查这条公告当时发给了谁。'))+
       '</div></div>';
    b+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('撤回原因')+
       '<span class="text-red-500 ml-1">*</span></label>'+
       '<textarea id="msg-recall-reason" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+
       esc(tr('请说明撤回原因，例如：运价数字有误，改后重发'))+'"></textarea></div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='48%';
    document.getElementById('crud-modal-title').textContent=tr('撤回公告')+' - '+fclFinGet(id,row,'公告编号');
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitMsgRecall()" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer ml-2">'+tr('确认撤回')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function submitMsgRecall(){
    var id=_msgRecallCtx.id,row=fclFinRows(id)[_msgRecallCtx.idx];
    if(!row){showToast(tr('未找到公告'));return;}
    var el=document.getElementById('msg-recall-reason');
    var reason=String((el&&el.value)||'').trim();
    if(!reason){showToast(tr('请填写撤回原因'));return;}
    var no=fclFinGet(id,row,'公告编号');
    var n=msgSetInboxState(no,'已撤回');
    fclFinSet(id,row,'状态','已撤回');
    fclFinSet(id,row,'撤回原因',reason);
    if(typeof _listData!=='undefined')delete _listData['msg-inbox'];
    closeCrudModal();
    fclFinRefresh(id);
    if(typeof updateNotifBadge==='function')updateNotifBadge();
    showToast(tr('已撤回')+'，'+n+' '+tr('条收件记录标记为已撤回（保留留痕）'));
}
function msgSetInboxState(no,state){
    var c=TC['msg-inbox'];
    if(!c||!c.d||!no)return 0;
    var h=c.h||[],iNo=h.indexOf('公告编号'),iSt=h.indexOf('状态');
    if(iNo<0||iSt<0)return 0;
    var n=0;
    c.d.forEach(function(r){
        if(String(r[iNo]||'')!==no)return;
        r[iSt]=state;n++;
    });
    return n;
}

/* ==========================================================================
 * 八、已读未读
 * ========================================================================== */
/* 收件行改已读后，回写公告上的 已读人数 / 阅读率（撤回的行不计入分母） */
function msgRefreshReadStats(no){
    var ib=TC['msg-inbox'],an=TC['msg-announce'];
    if(!ib||!ib.d||!an||!an.d||!no)return;
    var h=ib.h||[],iNo=h.indexOf('公告编号'),iRd=h.indexOf('阅读状态'),iSt=h.indexOf('状态');
    if(iNo<0||iRd<0)return;
    var total=0,read=0;
    ib.d.forEach(function(r){
        if(String(r[iNo]||'')!==no)return;
        if(iSt>=0&&String(r[iSt]||'')==='已撤回')return;
        total++;
        if(String(r[iRd]||'')==='已读')read++;
    });
    var ah=an.h||[],aNo=ah.indexOf('公告编号'),aT=ah.indexOf('触达人数'),
        aR=ah.indexOf('已读人数'),aP=ah.indexOf('阅读率');
    if(aNo<0)return;
    an.d.forEach(function(r){
        if(String(r[aNo]||'')!==no)return;
        if(aT>=0)r[aT]=String(total);
        if(aR>=0)r[aR]=String(read);
        if(aP>=0)r[aP]=total?((read/total*100).toFixed(2)+'%'):'';
    });
}
function msgMarkRowRead(row,h){
    var iRd=h.indexOf('阅读状态'),iTm=h.indexOf('阅读时间'),iSt=h.indexOf('状态');
    if(iRd<0)return false;
    if(iSt>=0&&String(row[iSt]||'')==='已撤回')return false;
    if(String(row[iRd]||'')==='已读')return false;
    row[iRd]='已读';
    if(iTm>=0)row[iTm]=fclNow();
    return true;
}
function markMsgRead(id){
    id=id||'msg-inbox';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要标记已读的公告'));return;}
    var rows=fclFinRows(id),c=TC[id],h=(c&&c.h)||[],n=0,nos={};
    idxs.forEach(function(i){
        var lr=rows[i];if(!lr)return;
        var src=msgInboxSeedRow(lr);
        if(!src)return;
        if(msgMarkRowRead(src,h)){n++;nos[msgCell(id,src,'公告编号')]=1;}
    });
    if(!n){showToast(tr('所选公告都已是已读（或已撤回）'));return;}
    Object.keys(nos).forEach(msgRefreshReadStats);
    if(typeof _listData!=='undefined')delete _listData[id];
    fclFinRefresh(id);
    if(typeof updateNotifBadge==='function')updateNotifBadge();
    showToast(tr('已标记已读')+' '+n+' '+tr('条'));
}
function markAllMsgRead(id){
    id=id||'msg-inbox';
    var c=TC[id];
    if(!c||!c.d){showToast(tr('没有数据'));return;}
    var h=c.h||[],pending=c.d.filter(function(r){
        var iRd=h.indexOf('阅读状态'),iSt=h.indexOf('状态');
        return String(r[iRd]||'')==='未读'&&(iSt<0||String(r[iSt]||'')!=='已撤回');
    });
    if(!pending.length){showToast(tr('没有未读公告'));return;}
    openConfirmTip(tr('确认把全部')+' '+pending.length+' '+tr('条未读公告标记为已读？'),function(){
        var nos={};
        pending.forEach(function(r){
            if(msgMarkRowRead(r,h))nos[String(r[h.indexOf('公告编号')]||'')]=1;
        });
        Object.keys(nos).forEach(msgRefreshReadStats);
        if(typeof _listData!=='undefined')delete _listData[id];
        fclFinRefresh(id);
        if(typeof updateNotifBadge==='function')updateNotifBadge();
        showToast(tr('已全部标记已读')+' '+pending.length+' '+tr('条'));
    });
}
/* 列表里的行是 expandData 拷出来的副本，改它不落库；按收件编号找回种子行 */
function msgInboxSeedRow(listRow){
    var c=TC['msg-inbox'];
    if(!c||!c.d||!listRow)return null;
    var h=c.h||[],i=h.indexOf('收件编号');
    if(i<0)return null;
    var key=String(listRow[i]||'');
    if(!key)return null;
    return c.d.find(function(r){return String(r[i]||'')===key;})||null;
}

/* ==========================================================================
 * 九、详情 / 阅读明细 / 推送重试
 * ========================================================================== */
function msgAnnounceByNo(no){
    var c=TC['msg-announce'];
    if(!c||!c.d||!no)return null;
    var i=(c.h||[]).indexOf('公告编号');
    if(i<0)return null;
    return c.d.find(function(r){return String(r[i]||'')===no;})||null;
}
function msgPriorityCls(p){
    return p==='紧急'?'bg-red-50 text-red-600 border-red-100':
           (p==='重要'?'bg-amber-50 text-amber-600 border-amber-100':
                       'bg-surface-100 text-text-secondary border-surface-200');
}
/* 公告正文卡片，发布端和接收端共用 */
function msgBodyCardHtml(an){
    var g=function(n){return msgCell('msg-announce',an,n);};
    var h='';
    h+='<div class="flex items-start justify-between gap-3 flex-wrap mb-3">';
    h+='<div><div class="text-lg font-semibold text-text-primary">'+esc(g('标题'))+'</div>';
    h+='<div class="mt-1.5 flex items-center gap-2 flex-wrap text-xs">'+
       '<span class="px-1.5 py-0.5 rounded border '+msgPriorityCls(g('优先级'))+'">'+esc(tr(g('优先级')))+'</span>'+
       '<span class="px-1.5 py-0.5 rounded border border-primary-100 bg-primary-50 text-primary-600">'+esc(tr(g('公告类型')))+'</span>'+
       '<span class="px-1.5 py-0.5 rounded border border-surface-200 bg-surface-50 text-text-secondary">'+esc(g('业务分类'))+'</span>'+
       (g('是否置顶')==='是'?'<span class="px-1.5 py-0.5 rounded border border-amber-100 bg-amber-50 text-amber-600">'+tr('置顶')+'</span>':'')+
       '</div></div>';
    h+='<div class="text-xs text-text-muted text-right">'+esc(g('发布人'))+'　'+esc(g('发布时间'))+
       '<div class="mt-1">'+tr('有效期')+' '+esc(g('生效时间'))+' ~ '+esc(g('失效时间'))+'</div></div>';
    h+='</div>';
    h+='<div class="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-text-primary whitespace-pre-wrap leading-relaxed">'+
       esc(g('正文'))+'</div>';
    var att=g('附件');
    if(att){
        h+='<div class="mt-3 flex flex-wrap gap-1.5">';
        att.split(';').filter(Boolean).forEach(function(f){
            h+=(typeof crudAttachmentChipHtml==='function')?crudAttachmentChipHtml(f.trim()):
               ('<span class="px-2 py-1 text-xs rounded bg-surface-100 text-text-secondary">'+esc(f.trim())+'</span>');
        });
        h+='</div>';
    }
    return h;
}
/* 我的公告 · 查看详情：看到即视为已读 */
function openMsgInboxDetail(id,rowIdx){
    id=id||'msg-inbox';
    var idx=(rowIdx!=null&&rowIdx>=0)?rowIdx:
        ((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1);
    if(idx<0){showToast(tr('请先勾选一条公告'));return;}
    var listRow=fclFinRows(id)[idx];
    if(!listRow){showToast(tr('未找到公告'));return;}
    var no=msgCell(id,listRow,'公告编号');
    var an=msgAnnounceByNo(no);
    var b='';
    if(!an){
        b='<div class="py-12 text-center text-sm text-text-muted">'+tr('找不到对应的公告正文')+'（'+esc(no)+'）</div>';
    }else{
        b=msgBodyCardHtml(an);
        var state=msgCell(id,listRow,'状态');
        if(state==='已撤回'){
            b='<div class="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">'+
              tr('这条公告已被发布人撤回')+'：'+esc(msgCell('msg-announce',an,'撤回原因'))+'</div>'+b;
        }
    }
    /* 打开即标记已读 —— 这是「已读」最自然的产生方式 */
    var src=msgInboxSeedRow(listRow),marked=false;
    if(src&&msgMarkRowRead(src,(TC[id]||{}).h||[])){
        marked=true;
        msgRefreshReadStats(no);
        if(typeof _listData!=='undefined')delete _listData[id];
    }
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='58%';
    document.getElementById('crud-modal-title').textContent=tr('公告详情');
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeMsgInboxDetail(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('我已知悉')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
    if(marked&&typeof updateNotifBadge==='function')updateNotifBadge();
}
function closeMsgInboxDetail(id){
    closeCrudModal();
    fclFinRefresh(id||'msg-inbox');
}
/* 公告管理 · 阅读明细：谁读了、谁还没读 */
function openMsgReadDetail(id){
    id=id||'msg-announce';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选一条公告'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到公告'));return;}
    var no=fclFinGet(id,row,'公告编号');
    var c=TC['msg-inbox'],h=(c&&c.h)||[],iNo=h.indexOf('公告编号');
    var list=(c&&c.d&&iNo>=0)?c.d.filter(function(r){return String(r[iNo]||'')===no;}):[];
    var readN=list.filter(function(r){return String(r[h.indexOf('阅读状态')]||'')==='已读';}).length;
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(no)+'　'+esc(fclFinGet(id,row,'标题'))+
       '<div class="mt-1">'+tr('触达')+' <span class="font-semibold text-text-primary">'+list.length+'</span>　'+
       tr('已读')+' <span class="font-semibold text-success-700">'+readN+'</span>　'+
       tr('未读')+' <span class="font-semibold text-amber-600">'+(list.length-readN)+'</span>　'+
       tr('阅读率')+' <span class="font-semibold text-text-primary">'+
       (list.length?((readN/list.length*100).toFixed(2)+'%'):'—')+'</span></div></div>';
    var cols=['接收方','接收人','接收账号','阅读状态','阅读时间','状态'];
    b+='<div class="border border-surface-200 rounded-lg overflow-auto max-h-96"><table class="w-full text-sm">'+
       '<thead class="bg-surface-50 sticky top-0"><tr>'+
       cols.map(function(t){return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    if(!list.length){
        b+='<tr><td colspan="'+cols.length+'" class="px-3 py-12 text-center text-sm text-text-muted">'+tr('该公告还没有收件记录（可能还是草稿）')+'</td></tr>';
    }
    list.forEach(function(r){
        var read=String(r[h.indexOf('阅读状态')]||'')==='已读';
        b+='<tr class="border-t border-surface-100">'+cols.map(function(t){
            var k=h.indexOf(t),v=k>=0?String(r[k]||''):'';
            var cls=(t==='阅读状态')?(read?'text-success-700 font-medium':'text-amber-600 font-medium'):'text-text-primary';
            return '<td class="px-3 py-2 whitespace-nowrap '+cls+'">'+esc(v||'—')+'</td>';
        }).join('')+'</tr>';
    });
    b+='</tbody></table></div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='66%';
    document.getElementById('crud-modal-title').textContent=tr('阅读明细')+' - '+no;
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
/* 推送记录 · 重新推送：只对失败的行重试；未开通的通道重试也没用，直接拦下 */
function resendMsgPush(id){
    id=id||'msg-push-log';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要重推的记录'));return;}
    var rows=fclFinRows(id),ok=[],notReady=0,done=0;
    idxs.forEach(function(i){
        var row=rows[i];if(!row)return;
        var res=fclFinGet(id,row,'发送结果');
        if(res==='未开通'){notReady++;return;}
        if(res==='已送达'){done++;return;}
        ok.push(row);
    });
    if(!ok.length){
        showToast(notReady?tr('所选记录的通道尚未接入，接入后才能推送'):tr('所选记录都已送达，无需重推'));return;
    }
    var now=fclNow();
    ok.forEach(function(row){
        var addr=fclFinGet(id,row,'接收地址');
        var n=(parseInt(fclFinGet(id,row,'重试次数'),10)||0)+1;
        fclFinSet(id,row,'重试次数',String(n));
        fclFinSet(id,row,'发送时间',now);
        if(!addr||addr==='—'){
            fclFinSet(id,row,'发送结果','发送失败');
            fclFinSet(id,row,'失败原因',tr('接收人档案仍缺少该渠道的联系方式'));
        }else{
            fclFinSet(id,row,'发送结果','已送达');
            fclFinSet(id,row,'送达时间',now);
            fclFinSet(id,row,'失败原因','');
            fclFinSet(id,row,'渠道回执号','RE-'+String(Date.now()).slice(-8));
        }
    });
    fclFinRefresh(id);
    var msg=tr('已重推')+' '+ok.length+' '+tr('条');
    if(notReady)msg+='，'+notReady+' '+tr('条通道未开通已跳过');
    if(done)msg+='，'+done+' '+tr('条已送达已跳过');
    showToast(msg);
}
