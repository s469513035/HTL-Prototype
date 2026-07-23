function generateRoleDashboard(id){
    const qIcon='<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>';
    const D={
        'ws-sales':{
            title:'业务工作台',sub:'散货业务 · 开发报价一条龙 · 业绩 / 订单 / 客户概览',
            kpis:[
                {label:'本月客户发货(票)',value:'386',delta:'↑ 15% 较上月'},
                {label:'发货体积(CBM)',value:'1,240',delta:'↑ 12% 较上月'},
                {label:'应收金额',value:'¥1,286,500',delta:'↑ 18% 较上月'},
                {label:'已收款',value:'¥982,300',delta:'回款率 76%'},
                {label:'本月新增客户',value:'28',delta:'↑ 6 个'}
            ],
            todoTitle:'订单确认与待办',
            todos:[
                {t:'待确认订单',n:12,tag:'订单',tab:'wb-manage'},
                {t:'特价申请审批中',n:5,tag:'特价',tab:'prod-special'},
                {t:'待补充资料运单',n:8,tag:'资料',tab:'wb-manage'},
                {t:'待报价询盘',n:3,tag:'报价',tab:'prod-inquiry'}
            ],
            msgs:[
                {t:'客户【上海云图供应链】咨询达喀尔海运时效',time:'10 分钟前'},
                {t:'运单 WB-20260522003 已到港，请通知客户',time:'1 小时前'},
                {t:'特价申请 SP001 已通过审批',time:'2 小时前'},
                {t:'客户【幻想直客】新增收货地址待确认',time:'今天 09:20'}
            ],
            actions:[
                {l:'价格试算',tab:'biz-price-trial'},{l:'新建客户',tab:'crm-cust'},{l:'下单录入',tab:'wb-special'},{l:'轨迹查询',tab:'cs-track-query'},
                {l:'特价申请',tab:'prod-special'},{l:'客户管理',tab:'crm-cust'},{l:'订舱下单',tab:'fcl-booking-order'},{l:'运单管理',tab:'wb-manage'}
            ]
        },
        'ws-cs':{
            title:'客服工作台',sub:'散货客服 · 货态更新 / 问题件 / 答疑放行',
            kpis:[
                {label:'待处理问题件',value:'18',delta:'较昨日 +3'},
                {label:'处理中问题件',value:'9',delta:'超时预警 2'},
                {label:'今日客户答疑',value:'24',delta:'较昨日 +5'},
                {label:'待更新货态运单',value:'15',delta:'到港/入仓待推'},
                {label:'本月已放行',value:'210',delta:'↑ 8% 较上月'}
            ],
            todoTitle:'问题件 / 货态待办',
            todos:[
                {t:'待处理问题件',n:18,tag:'问题件',tab:'cs-issue-track'},
                {t:'待更新货态运单',n:15,tag:'货态',tab:'cs-track-maint'},
                {t:'待放行运单',n:7,tag:'放行',tab:'cs-issue-track'},
                {t:'待回复客户咨询',n:5,tag:'答疑',tab:'cs-issue-track'}
            ],
            msgs:[
                {t:'运单 WB-20260522002 已到货，触发货态提醒',time:'15 分钟前'},
                {t:'问题件 破损-ICBU00000600587 已升级',time:'40 分钟前'},
                {t:'客户【蓝色有限】咨询提柜时间',time:'1 小时前'},
                {t:'运单 WB-20260522001 客户已确认签收',time:'今天 08:50'}
            ],
            actions:[
                {l:'问题件跟踪',tab:'cs-issue-track'},{l:'轨迹查询',tab:'cs-track-query'},{l:'轨迹维护',tab:'cs-track-maint'},{l:'订单修改',tab:'wb-manage'},
                {l:'运单查询',tab:'wb-client-manage'},{l:'问题件类型',tab:'cs-issue-type'}
            ]
        },
        'ws-ops':{
            title:'操作工作台',sub:'散货操作 · 审批 / 价格维护 / 费用确认 / 配舱出账',
            kpis:[
                {label:'待入仓(票)',value:'32',delta:'较昨日 +6'},
                {label:'可配舱货量(CBM)',value:'82',delta:'≥70 可装柜',highlight:true},
                {label:'待费用确认',value:'24',delta:'应收复核'},
                {label:'待出账账单',value:'16',delta:'广州操作终审'},
                {label:'待放货核销',value:'9',delta:'预付/现付'}
            ],
            todoTitle:'审批 / 复核 / 出账待办',
            todos:[
                {t:'审批待办',n:7,tag:'审批',tab:'fin-fee-mgmt'},
                {t:'应收价格复核',n:24,tag:'复核',tab:'fin-fee-mgmt'},
                {t:'待出账账单',n:16,tag:'出账',tab:'fin-bill-mgmt'},
                {t:'异常件待处理',n:5,tag:'异常',tab:'wh-in-one'}
            ],
            msgs:[
                {t:'账单 B-20260715001 待广州操作确认出账',time:'20 分钟前'},
                {t:'海外分公司【达喀尔仓】核销放货申请',time:'50 分钟前'},
                {t:'价格复核异常：运单 WB-…0003 汇率差异',time:'1 小时前'},
                {t:'库内可装柜货量已达 82CBM，可配舱排柜',time:'今天 09:05'}
            ],
            actions:[
                {l:'价格维护',tab:'prod-price-lcl'},{l:'费用确认',tab:'fin-fee-mgmt'},{l:'配舱计划',tab:'wh-final-alloc'},{l:'出账账单',tab:'fin-bill-mgmt'},
                {l:'入仓操作',tab:'wh-in-one'},{l:'银行凭证',tab:'fin-bank-voucher'},{l:'汇率管理',tab:'fin-rate'}
            ]
        }
    };
    const c=D[id]||D['ws-sales'];
    const kpiColors=['from-primary-600 to-primary-500','from-green-600 to-green-500','from-amber-500 to-amber-400','from-purple-600 to-purple-500','from-blue-600 to-blue-500'];
    let h='<div class="h-full overflow-auto bg-surface-50 p-6">';
    h+='<div class="mb-6"><h1 class="text-2xl font-bold text-text-primary">'+tr(c.title)+'</h1><p class="text-sm text-text-secondary mt-1">'+esc(c.sub)+'</p></div>';
    h+='<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">';
    c.kpis.forEach(function(k,i){
        h+='<div class="rounded-xl p-5 text-white bg-gradient-to-br '+(k.highlight?'from-rose-500 to-orange-400':kpiColors[i%kpiColors.length])+' shadow-sm">';
        h+='<div class="text-xs opacity-90 mb-2">'+esc(k.label)+'</div><div class="text-2xl font-bold">'+esc(k.value)+'</div><div class="text-xs opacity-90 mt-1">'+esc(k.delta)+'</div></div>';
    });
    h+='</div>';
    h+='<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-5"><div class="flex items-center gap-2 mb-4"><span class="w-1 h-4 bg-primary-500 rounded"></span><span class="text-base font-semibold text-text-primary">'+tr(c.todoTitle)+'</span></div><div class="space-y-2">';
    c.todos.forEach(function(t){
        h+='<div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface-50 hover:bg-primary-50/50 cursor-pointer" onclick="navigateToTab(\'\',\''+t.tab+'\')"><div class="flex items-center gap-2"><span class="inline-block px-2 py-0.5 rounded text-xs bg-primary-50 text-primary-600">'+esc(t.tag)+'</span><span class="text-sm text-text-primary">'+esc(t.t)+'</span></div><span class="text-lg font-bold text-primary-600">'+t.n+'</span></div>';
    });
    h+='</div></div>';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-5"><div class="flex items-center gap-2 mb-4"><span class="w-1 h-4 bg-amber-500 rounded"></span><span class="text-base font-semibold text-text-primary">'+tr('消息通知')+'</span></div><div class="space-y-3">';
    c.msgs.forEach(function(m){
        h+='<div class="flex items-start gap-3"><span class="mt-1.5 w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span><div class="flex-1"><div class="text-sm text-text-primary">'+esc(m.t)+'</div><div class="text-xs text-text-muted mt-0.5">'+esc(m.time)+'</div></div></div>';
    });
    h+='</div></div></div>';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-5"><div class="flex items-center gap-2 mb-4"><span class="w-1 h-4 bg-green-500 rounded"></span><span class="text-base font-semibold text-text-primary">'+tr('常用功能')+'</span></div>';
    h+='<div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">';
    c.actions.forEach(function(a){
        h+='<button type="button" onclick="navigateToTab(\'\',\''+a.tab+'\')" class="flex flex-col items-center gap-2 p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50/40 cursor-pointer transition"><span class="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">'+qIcon+'</span><span class="text-xs text-text-secondary text-center">'+esc(a.l)+'</span></button>';
    });
    h+='</div></div>';
    h+='</div>';
    return h;
}

/* ===== 收款管理 fin-ar-receipt：凭证核销 / 反核销 双栏页 ===== */
