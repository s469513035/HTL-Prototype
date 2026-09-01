var MOBILE_APP_TABS={
    'client-app-home':{title:'客户端APP首页',kind:'client'},
    'client-app-inquiry':{title:'客户端APP-发起询价',kind:'client'},
    'client-app-quotes':{title:'客户端APP-报价确认',kind:'client'},
    'client-app-orders':{title:'客户端APP-订单跟踪',kind:'client'},
    'client-app-service':{title:'客户端APP-服务工单',kind:'client'},
    'client-app-profile':{title:'客户端APP-我的账户',kind:'client'},
    'staff-app-home':{title:'员工端APP工作台',kind:'staff'},
    'staff-app-chat':{title:'员工端APP-聊天转业务',kind:'staff'},
    'staff-app-customer':{title:'员工端APP-客户360',kind:'staff'},
    'staff-app-demand':{title:'员工端APP-需求卡',kind:'staff'},
    'staff-app-quote':{title:'员工端APP-报价处理',kind:'staff'},
    'staff-app-tasks':{title:'员工端APP-任务SLA',kind:'staff'},
    'staff-app-orders':{title:'员工端APP-订单协同',kind:'staff'},
    'staff-app-service':{title:'员工端APP-服务工单',kind:'staff'}
};

function isMobileAppTab(id){
    return !!MOBILE_APP_TABS[id];
}

function getMobileAppTitle(id){
    return (MOBILE_APP_TABS[id]&&MOBILE_APP_TABS[id].title)||'APP原型';
}

function mobileIcon(name,cls){
    const c=cls||'w-4 h-4';
    const map={
        home:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M3 10.5L12 3l9 7.5M5 10v9h5v-5h4v5h5v-9"/>',
        plus:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 5v14M5 12h14"/>',
        quote:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M7 7h10M7 11h10M7 15h6M5 3h14a1 1 0 011 1v16l-4-3H5a1 1 0 01-1-1V4a1 1 0 011-1z"/>',
        package:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>',
        service:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M7 8a5 5 0 0110 0v3a3 3 0 01-3 3h-2m-5-3H5a2 2 0 01-2-2V8a9 9 0 1118 0v1a2 2 0 01-2 2h-2"/>',
        user:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0"/>',
        chat:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2H9l-5 4v-4H5a2 2 0 01-2-2V7a2 2 0 012-2z"/>',
        customer:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M17 20h4v-2a4 4 0 00-5-3.87M13 7a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0"/>',
        task:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
        order:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M8 4h8l2 4v12H6V8l2-4zM6 8h12M9 13h6M9 17h4"/>',
        bell:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"/>',
        search:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M21 21l-5.5-5.5M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"/>',
        file:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v6h5M8 14h8M8 18h6"/>',
        check:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" d="M5 13l4 4L19 7"/>',
        clock:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        truck:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M3 7h11v8H3V7zm11 3h4l3 3v2h-7v-5zM7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"/>',
        upload:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"/>',
        warning:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 9v4m0 4h.01M10.3 4.5L2.8 18a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.5a2 2 0 00-3.4 0z"/>',
        shield:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3zM9 12l2 2 4-4"/>',
        camera:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M4 8h3l2-3h6l2 3h3v11H4V8zm8 8a4 4 0 100-8 4 4 0 000 8z"/>',
        more:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M6 12h.01M12 12h.01M18 12h.01"/>'
    };
    return '<svg class="'+c+'" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+(map[name]||map.home)+'</svg>';
}

function mobileToneClass(tone,type){
    const t=tone||'blue';
    const bg={blue:'bg-blue-50',emerald:'bg-emerald-50',amber:'bg-amber-50',rose:'bg-rose-50',slate:'bg-slate-50',violet:'bg-violet-50'}[t]||'bg-blue-50';
    const text={blue:'text-blue-700',emerald:'text-emerald-700',amber:'text-amber-700',rose:'text-rose-700',slate:'text-slate-700',violet:'text-violet-700'}[t]||'text-blue-700';
    const border={blue:'border-blue-100',emerald:'border-emerald-100',amber:'border-amber-100',rose:'border-rose-100',slate:'border-slate-100',violet:'border-violet-100'}[t]||'border-blue-100';
    if(type==='text')return text;
    if(type==='border')return border;
    return bg+' '+text+' '+border;
}

function mobileAppOpen(id){
    if(!isMobileAppTab(id))return;
    addTab(id,getMobileAppTitle(id),'mobile-app','');
    const item=document.querySelector('[data-id="'+id+'"]');
    if(item){
        document.querySelectorAll('.menu-l3.active,.menu-l2-direct.active,.menu-l1-direct.active').forEach(function(i){i.classList.remove('active');});
        item.classList.add('active');
    }
}

function mobileMockAction(text){
    if(typeof showToast==='function')showToast(text||'已处理');
}

function mobilePrototypeNav(kind,activeId){
    const ids=Object.keys(MOBILE_APP_TABS).filter(function(id){return MOBILE_APP_TABS[id].kind===kind;});
    return '<div class="mobile-proto-nav">'+ids.map(function(id){
        const cfg=MOBILE_APP_TABS[id];
        return '<button type="button" class="mobile-proto-nav-btn '+(id===activeId?'active':'')+'" onclick="mobileAppOpen(\''+id+'\')">'+esc(cfg.title.replace(kind==='client'?'客户端APP':'员工端APP','').replace(/^-/,''))+'</button>';
    }).join('')+'</div>';
}

function mobileBottomNav(kind,activeId){
    const tabs=kind==='client'
        ?[
            ['client-app-home','首页','home'],
            ['client-app-inquiry','询价','plus'],
            ['client-app-quotes','报价','quote'],
            ['client-app-orders','订单','package'],
            ['client-app-service','服务','service']
        ]
        :[
            ['staff-app-home','工作台','home'],
            ['staff-app-chat','聊天','chat'],
            ['staff-app-customer','客户','customer'],
            ['staff-app-tasks','任务','task'],
            ['staff-app-orders','订单','order']
        ];
    return '<div class="mobile-bottom-nav">'+tabs.map(function(t){
        const on=t[0]===activeId;
        return '<button type="button" class="mobile-bottom-btn '+(on?'active':'')+'" onclick="mobileAppOpen(\''+t[0]+'\')">'+mobileIcon(t[2],'w-5 h-5')+'<span>'+t[1]+'</span></button>';
    }).join('')+'</div>';
}

function mobilePhoneHeader(title,subtitle,kind){
    return '<div class="mobile-phone-head">'+
        '<div><div class="text-[19px] font-bold text-slate-950 leading-6">'+esc(title)+'</div><div class="text-[12px] text-slate-500 mt-0.5">'+esc(subtitle||'')+'</div></div>'+
        '<div class="flex items-center gap-2"><button class="mobile-icon-btn" onclick="mobileMockAction(\'已打开搜索\')">'+mobileIcon('search','w-4 h-4')+'</button><button class="mobile-icon-btn relative" onclick="mobileMockAction(\'已打开通知\')">'+mobileIcon('bell','w-4 h-4')+'<span class="mobile-red-dot"></span></button></div>'+
    '</div>';
}

function mobileStat(label,value,tone){
    return '<div class="mobile-stat '+mobileToneClass(tone)+'"><div class="text-[18px] font-bold leading-6">'+esc(value)+'</div><div class="text-[11px] mt-0.5">'+esc(label)+'</div></div>';
}

function mobilePill(text,tone){
    return '<span class="mobile-pill '+mobileToneClass(tone)+'">'+esc(text)+'</span>';
}

function mobileQuick(id,label,icon,tone){
    return '<button type="button" class="mobile-quick" onclick="mobileAppOpen(\''+id+'\')"><span class="mobile-quick-icon '+mobileToneClass(tone)+'">'+mobileIcon(icon,'w-5 h-5')+'</span><span>'+esc(label)+'</span></button>';
}

function mobileField(label,value,span){
    return '<div class="'+(span||'')+'"><div class="mobile-field-label">'+esc(label)+'</div><div class="mobile-field">'+esc(value||'')+'</div></div>';
}

function mobileInput(label,value,placeholder,span){
    return '<label class="'+(span||'')+'"><span class="mobile-field-label">'+esc(label)+'</span><input class="mobile-input" value="'+esc(value||'')+'" placeholder="'+esc(placeholder||'')+'"></label>';
}

function mobileSelect(label,value,span){
    return '<label class="'+(span||'')+'"><span class="mobile-field-label">'+esc(label)+'</span><select class="mobile-input"><option>'+esc(value||'请选择')+'</option></select></label>';
}

function mobileTextarea(label,value){
    return '<label><span class="mobile-field-label">'+esc(label)+'</span><textarea class="mobile-input min-h-[72px] resize-none">'+esc(value||'')+'</textarea></label>';
}

function mobileTimeline(items){
    return '<div class="mobile-timeline">'+items.map(function(item,idx){
        const done=item[2]||false;
        return '<div class="mobile-timeline-row '+(done?'done':'')+'"><div class="mobile-timeline-dot"></div><div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-2"><span class="text-[13px] font-semibold text-slate-900">'+esc(item[0])+'</span><span class="text-[11px] text-slate-400">'+esc(item[1]||'')+'</span></div><div class="text-[11px] text-slate-500 mt-0.5">'+esc(item[3]||'')+'</div></div></div>';
    }).join('')+'</div>';
}

function mobileTaskCard(title,meta,tone,buttonText){
    return '<div class="mobile-card p-3"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><div class="text-[14px] font-semibold text-slate-950 truncate">'+esc(title)+'</div><div class="text-[11px] text-slate-500 mt-1">'+esc(meta)+'</div></div>'+mobilePill(tone==='rose'?'逾期':tone==='amber'?'即将到期':'进行中',tone)+'</div><button class="mobile-mini-btn mt-3" onclick="mobileMockAction(\'已进入处理\')">'+esc(buttonText||'处理')+'</button></div>';
}

function mobileBusinessPanel(kind,activeId){
    if(kind==='client'){
        return '<div class="mobile-context-panel">'+
            '<div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Client App Flow</div>'+
            '<h3 class="text-xl font-bold text-slate-950 mt-2">客户从询价到复购</h3>'+
            '<div class="mt-5 space-y-3">'+
                '<div class="mobile-flow-step active"><b>1</b><span>发起结构化询价</span></div>'+
                '<div class="mobile-flow-step"><b>2</b><span>确认报价与有效期</span></div>'+
                '<div class="mobile-flow-step"><b>3</b><span>查看入仓、运输、清关、派送节点</span></div>'+
                '<div class="mobile-flow-step"><b>4</b><span>异常进入工单，签收后再次下单</span></div>'+
            '</div>'+
            '<div class="mt-6 grid grid-cols-2 gap-3">'+
                '<div class="mobile-panel-metric"><span>待确认报价</span><b>2</b></div>'+
                '<div class="mobile-panel-metric"><span>在途订单</span><b>8</b></div>'+
                '<div class="mobile-panel-metric"><span>待补资料</span><b>1</b></div>'+
                '<div class="mobile-panel-metric"><span>服务SLA</span><b>96%</b></div>'+
            '</div>'+
        '</div>';
    }
    return '<div class="mobile-context-panel">'+
        '<div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff App Flow</div>'+
        '<h3 class="text-xl font-bold text-slate-950 mt-2">员工从聊天到闭环</h3>'+
        '<div class="mt-5 space-y-3">'+
            '<div class="mobile-flow-step active"><b>1</b><span>聊天一键转商机/任务/报价/工单</span></div>'+
            '<div class="mobile-flow-step"><b>2</b><span>需求卡补齐后进入报价</span></div>'+
            '<div class="mobile-flow-step"><b>3</b><span>报价确认后一键转订单并交接</span></div>'+
            '<div class="mobile-flow-step"><b>4</b><span>任务SLA和异常池推动责任闭环</span></div>'+
        '</div>'+
        '<div class="mt-6 grid grid-cols-2 gap-3">'+
            '<div class="mobile-panel-metric"><span>新询盘</span><b>12</b></div>'+
            '<div class="mobile-panel-metric"><span>待报价</span><b>5</b></div>'+
            '<div class="mobile-panel-metric"><span>逾期承诺</span><b>3</b></div>'+
            '<div class="mobile-panel-metric"><span>黄金跟进</span><b>9</b></div>'+
        '</div>'+
    '</div>';
}

function mobilePrototypeShell(kind,activeId,screenHtml){
    const title=kind==='client'?'客户端 APP 原型':'员工端 APP 原型';
    const subtitle=kind==='client'?'客户/合作伙伴端：询价、报价、订单、服务闭环':'销售/客服/操作端：聊天、客户、需求、报价、任务闭环';
    return '<div class="mobile-app-page">'+
        '<div class="mobile-app-stage">'+
            '<div class="mobile-proto-side">'+
                '<div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prototype</div>'+
                '<h2 class="text-2xl font-bold text-slate-950 mt-2">'+esc(title)+'</h2>'+
                '<p class="text-sm text-slate-500 mt-2 leading-6">'+esc(subtitle)+'</p>'+
                mobilePrototypeNav(kind,activeId)+
            '</div>'+
            '<div class="mobile-device-wrap">'+
                '<div class="mobile-device">'+
                    '<div class="mobile-status"><span>9:41</span><span class="mobile-status-icons">5G 100%</span></div>'+
                    '<div class="mobile-screen">'+screenHtml+'</div>'+
                    mobileBottomNav(kind,activeId)+
                '</div>'+
            '</div>'+
            mobileBusinessPanel(kind,activeId)+
        '</div>'+
    '</div>';
}

function clientHomeScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('上海锦程国际','Global ID C10005','client')+
        '<div class="mobile-search-line">'+mobileIcon('search','w-4 h-4')+'<span>搜索订单、报价、工单</span></div>'+
        '<div class="mobile-stat-grid">'+mobileStat('在途订单','8','blue')+mobileStat('待确认报价','2','amber')+mobileStat('待补资料','1','rose')+mobileStat('可复购线路','4','emerald')+'</div>'+
        '<div class="mobile-section-title">快捷操作</div>'+
        '<div class="mobile-quick-grid">'+
            mobileQuick('client-app-inquiry','发询价','plus','blue')+
            mobileQuick('client-app-quotes','看报价','quote','amber')+
            mobileQuick('client-app-orders','查订单','package','emerald')+
            mobileQuick('client-app-service','找客服','service','rose')+
        '</div>'+
        '<div class="mobile-card p-3 border-l-4 border-l-amber-400"><div class="flex items-start justify-between"><div><div class="text-[14px] font-semibold text-slate-950">报价待确认</div><div class="text-[11px] text-slate-500 mt-1">Q-20260831002 - 广州到阿克拉 LCL</div></div>'+mobilePill('23小时有效','amber')+'</div><div class="mt-3 flex items-end justify-between"><div><div class="text-[20px] font-bold text-slate-950">USD 286.00</div><div class="text-[11px] text-slate-500">含海运、清关、末端派送</div></div><button class="mobile-mini-btn" onclick="mobileAppOpen(\'client-app-quotes\')">确认</button></div></div>'+
        '<div class="mobile-section-title">最近订单</div>'+
        '<div class="mobile-card p-3"><div class="flex items-center justify-between"><div><div class="text-[14px] font-semibold text-slate-950">HLHSH20260829001</div><div class="text-[11px] text-slate-500 mt-1">深圳仓 - Lagos 海运散货</div></div>'+mobilePill('清关中','blue')+'</div>'+mobileTimeline([['已入仓','08-29',true,'8件 / 1.26CBM / 216KG'],['已出运','08-30',true,'ETD 08-30'],['到港清关','09-18',false,'ETA后自动提醒'],['派送签收','待定',false,'POD上传后关闭']])+'</div>'+
    '</div>';
}

function clientInquiryScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('发起询价','需求完整后进入报价SLA','client')+
        '<div class="mobile-card p-3">'+
            '<div class="flex items-center justify-between mb-3"><span class="text-[13px] font-semibold text-slate-950">需求完整度</span><span class="text-[12px] font-bold text-emerald-700">86%</span></div>'+
            '<div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full w-[86%] bg-emerald-500"></div></div>'+
        '</div>'+
        '<div class="mobile-form-grid">'+
            mobileSelect('运输方式','海运散货 LCL')+
            mobileInput('目的城市','Accra','请输入目的城市')+
            mobileInput('起运地','广州白云仓','请选择起运地')+
            mobileInput('计划出货日','2026-09-05','选择日期')+
            mobileInput('品名','LED灯具','请输入品名','mobile-col-2')+
            mobileInput('件数','12','')+
            mobileInput('重量KG','186','')+
            mobileInput('体积CBM','1.20','')+
            mobileSelect('货物属性','普货')+
        '</div>'+
        '<div class="mobile-card p-3"><div class="text-[13px] font-semibold text-slate-950 mb-3">增值服务</div><div class="grid grid-cols-2 gap-2">'+mobilePill('上门提货','blue')+mobilePill('双清包税','emerald')+mobilePill('末端派送','amber')+mobilePill('入仓拍照','slate')+'</div></div>'+
        '<div class="mobile-card p-3"><div class="flex items-center justify-between"><div><div class="text-[13px] font-semibold text-slate-950">附件资料</div><div class="text-[11px] text-slate-500 mt-1">装箱单、发票、货物照片</div></div><button class="mobile-icon-btn" onclick="mobileMockAction(\'已选择上传附件\')">'+mobileIcon('upload','w-4 h-4')+'</button></div></div>'+
        '<button class="mobile-primary-btn" onclick="mobileMockAction(\'询价已提交，已生成需求卡 DEM-20260831001\')">提交询价</button>'+
    '</div>';
}

function clientQuotesScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('报价确认','报价有有效期和服务边界','client')+
        '<div class="mobile-card p-4 border-l-4 border-l-blue-500"><div class="flex items-center justify-between"><div><div class="text-[15px] font-bold text-slate-950">Q-20260831002</div><div class="text-[11px] text-slate-500 mt-1">广州 - Accra / LCL / 1.2CBM</div></div>'+mobilePill('待确认','amber')+'</div><div class="mt-4"><div class="text-[28px] font-bold text-slate-950">USD 286.00</div><div class="text-[12px] text-slate-500">有效期至 2026-09-01 18:00</div></div><div class="mt-4 grid grid-cols-3 gap-2 text-center"><div class="mobile-soft-box"><b>18-22天</b><span>参考时效</span></div><div class="mobile-soft-box"><b>DDP</b><span>服务类型</span></div><div class="mobile-soft-box"><b>23h</b><span>剩余有效</span></div></div></div>'+
        '<div class="mobile-section-title">费用构成</div>'+
        '<div class="mobile-card divide-y divide-slate-100"><div class="mobile-fee-row"><span>海运费</span><b>USD 138.00</b></div><div class="mobile-fee-row"><span>目的港清关</span><b>USD 72.00</b></div><div class="mobile-fee-row"><span>末端派送</span><b>USD 58.00</b></div><div class="mobile-fee-row"><span>文件及杂费</span><b>USD 18.00</b></div></div>'+
        '<div class="mobile-section-title">服务边界</div>'+
        '<div class="mobile-card p-3 space-y-2 text-[12px] text-slate-600"><div>包含：入仓、海运、清关、派送、节点通知</div><div>不包含：查验产生的额外仓租、客户原因改单费</div></div>'+
        '<div class="grid grid-cols-2 gap-2"><button class="mobile-secondary-btn" onclick="mobileMockAction(\'已提交报价异议\')">提出异议</button><button class="mobile-primary-btn m-0" onclick="mobileMockAction(\'报价已确认，订单已创建\')">确认报价</button></div>'+
    '</div>';
}

function clientOrdersScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('订单跟踪','节点、照片、资料、POD统一查看','client')+
        '<div class="mobile-card p-3"><div class="flex items-center justify-between"><div><div class="text-[14px] font-semibold text-slate-950">HLHSH20260829001</div><div class="text-[11px] text-slate-500 mt-1">深圳仓 - Lagos 海运散货</div></div>'+mobilePill('清关中','blue')+'</div><div class="mt-3 grid grid-cols-3 gap-2"><div class="mobile-soft-box"><b>8</b><span>件数</span></div><div class="mobile-soft-box"><b>216KG</b><span>重量</span></div><div class="mobile-soft-box"><b>1.26</b><span>CBM</span></div></div></div>'+
        '<div class="mobile-card p-3">'+mobileTimeline([['订单创建','08-28',true,'客户确认报价后自动生成'],['货物入仓','08-29',true,'已上传入仓照片3张'],['装柜出运','08-30',true,'柜号 MSKU8792310'],['到港清关','09-18',false,'资料审核通过'],['派送预约','待定',false,'签收后上传POD']])+'</div>'+
        '<div class="mobile-section-title">入仓照片</div>'+
        '<div class="grid grid-cols-3 gap-2"><div class="mobile-photo">'+mobileIcon('camera','w-6 h-6')+'</div><div class="mobile-photo">'+mobileIcon('package','w-6 h-6')+'</div><div class="mobile-photo">'+mobileIcon('file','w-6 h-6')+'</div></div>'+
        '<div class="mobile-card p-3"><div class="text-[13px] font-semibold text-slate-950 mb-2">资料状态</div><div class="flex flex-wrap gap-2">'+mobilePill('发票已收','emerald')+mobilePill('装箱单已收','emerald')+mobilePill('清关资料已审','blue')+'</div></div>'+
        '<button class="mobile-primary-btn" onclick="mobileAppOpen(\'client-app-service\')">发起服务工单</button>'+
    '</div>';
}

function clientServiceScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('服务工单','异常有SLA和处理结论','client')+
        '<div class="mobile-card p-3 border-l-4 border-l-rose-400"><div class="flex items-start justify-between"><div><div class="text-[14px] font-semibold text-slate-950">TK-20260831006</div><div class="text-[11px] text-slate-500 mt-1">清关资料补充 - HLHSH20260829001</div></div>'+mobilePill('等客户','amber')+'</div><div class="mt-3 text-[12px] text-slate-600">SLA剩余 1小时20分，需补充产品用途说明。</div></div>'+
        '<div class="mobile-section-title">新建工单</div>'+
        '<div class="mobile-form-grid">'+
            mobileSelect('关联对象','订单 HLHSH20260829001','mobile-col-2')+
            mobileSelect('问题类型','清关资料')+
            mobileInput('联系电话','13800138000','')+
        '</div>'+
        mobileTextarea('问题描述','目的港提示需要补充产品用途说明，请协助确认模板。')+
        '<div class="mobile-card p-3 mt-3"><div class="flex items-center justify-between"><span class="text-[13px] font-semibold text-slate-950">上传证据</span><button class="mobile-icon-btn" onclick="mobileMockAction(\'已上传图片\')">'+mobileIcon('upload','w-4 h-4')+'</button></div></div>'+
        '<button class="mobile-primary-btn" onclick="mobileMockAction(\'工单已提交，SLA 4小时\')">提交工单</button>'+
    '</div>';
}

function clientProfileScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('我的账户','账户、联系人、账单与偏好','client')+
        '<div class="mobile-profile-head"><div class="mobile-avatar">锦</div><div><div class="text-[16px] font-bold text-slate-950">上海锦程国际贸易</div><div class="text-[11px] text-slate-500 mt-1">Global ID C10005 - A类客户</div></div></div>'+
        '<div class="mobile-stat-grid">'+mobileStat('信用额度','USD 50K','emerald')+mobileStat('账期','30天','blue')+mobileStat('联系人','4','slate')+mobileStat('复购率','68%','amber')+'</div>'+
        '<div class="mobile-card divide-y divide-slate-100"><div class="mobile-fee-row"><span>默认起运仓</span><b>广州白云仓</b></div><div class="mobile-fee-row"><span>默认目的国</span><b>Ghana / Nigeria</b></div><div class="mobile-fee-row"><span>报价接收</span><b>微信 + 邮件</b></div><div class="mobile-fee-row"><span>账单确认人</span><b>赵经理</b></div></div>'+
        '<div class="mobile-card p-3"><div class="text-[13px] font-semibold text-slate-950 mb-3">通知偏好</div><div class="space-y-2"><label class="mobile-toggle-row"><span>报价有效期提醒</span><input type="checkbox" checked></label><label class="mobile-toggle-row"><span>订单节点通知</span><input type="checkbox" checked></label><label class="mobile-toggle-row"><span>应收账单通知</span><input type="checkbox"></label></div></div>'+
    '</div>';
}

function staffHomeScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('李业务，今天先处理这些','销售工作台 - 华南销售部','staff')+
        '<div class="mobile-stat-grid">'+mobileStat('新询盘','12','blue')+mobileStat('待补需求','7','amber')+mobileStat('待报价','5','rose')+mobileStat('待跟进','9','emerald')+'</div>'+
        '<div class="mobile-card p-3 bg-slate-950 text-white"><div class="flex items-center justify-between"><div><div class="text-[14px] font-semibold">黄金跟进窗口</div><div class="text-[11px] text-slate-300 mt-1">报价后24/48/72小时自动推进</div></div><div class="text-[24px] font-bold">9</div></div></div>'+
        '<div class="mobile-section-title">今日必做</div>'+
        mobileTaskCard('跟进上海锦程 Accra LCL报价','Q-20260831002 - 截止 11:30','amber','发跟进')+
        mobileTaskCard('补齐东莞鑫海需求卡','缺品名监管属性 - 截止 12:00','rose','补需求')+
        mobileTaskCard('Nigeria大客户首单冲刺','预计毛利 USD 1,860 - 截止 16:00','emerald','推进商机')+
        '<div class="mobile-section-title">快捷入口</div>'+
        '<div class="mobile-quick-grid">'+mobileQuick('staff-app-chat','聊天转业务','chat','blue')+mobileQuick('staff-app-demand','需求卡','file','amber')+mobileQuick('staff-app-quote','报价处理','quote','emerald')+mobileQuick('staff-app-tasks','任务SLA','task','rose')+'</div>'+
    '</div>';
}

function staffChatScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('客户消息','WhatsApp / 企微会话归档','staff')+
        '<div class="mobile-chat-box">'+
            '<div class="mobile-chat-row other"><div class="bubble">这票到阿克拉多少钱？大约1.2方，月底要出。</div></div>'+
            '<div class="mobile-chat-action"><button onclick="mobileAppOpen(\'staff-app-demand\')">'+mobileIcon('file','w-4 h-4')+'建商机</button><button onclick="mobileMockAction(\'已创建任务\')">'+mobileIcon('task','w-4 h-4')+'建任务</button><button onclick="mobileAppOpen(\'staff-app-quote\')">'+mobileIcon('quote','w-4 h-4')+'发起报价</button><button onclick="mobileAppOpen(\'staff-app-service\')">'+mobileIcon('service','w-4 h-4')+'建工单</button></div>'+
            '<div class="mobile-chat-row me"><div class="bubble">收到，我先确认品名和派送城市，30分钟内给您报价。</div></div>'+
        '</div>'+
        '<div class="mobile-card p-3 border-l-4 border-l-blue-500"><div class="flex items-start justify-between"><div><div class="text-[14px] font-semibold text-slate-950">已识别为新商机</div><div class="text-[11px] text-slate-500 mt-1">客户：上海锦程国际 - Ghana / LCL</div></div>'+mobilePill('草稿','amber')+'</div><div class="mt-3 grid grid-cols-2 gap-2">'+mobileField('体积','1.2CBM')+mobileField('时效','月底出运')+'</div></div>'+
        '<div class="mobile-chat-input"><span>输入消息...</span><button onclick="mobileMockAction(\'消息已发送\')">发送</button></div>'+
    '</div>';
}

function staffCustomerScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('客户360','上海锦程国际贸易','staff')+
        '<div class="mobile-profile-head"><div class="mobile-avatar">锦</div><div class="flex-1"><div class="text-[16px] font-bold text-slate-950">上海锦程国际贸易</div><div class="text-[11px] text-slate-500 mt-1">C10005 - A类 - 保护中</div></div>'+mobilePill('李业务','blue')+'</div>'+
        '<div class="mobile-stat-grid">'+mobileStat('商机','4','blue')+mobileStat('报价中','2','amber')+mobileStat('在途订单','8','emerald')+mobileStat('逾期应收','0','slate')+'</div>'+
        '<div class="mobile-card p-3"><div class="text-[13px] font-semibold text-slate-950 mb-3">客户时间线</div>'+mobileTimeline([['客户来源','06-12',true,'客户转介绍'],['首单成交','07-03',true,'Lagos LCL 2.4CBM'],['最新报价','08-31',true,'Accra LCL 报价待确认'],['复购窗口','09-10',false,'系统自动生成唤醒任务']])+'</div>'+
        '<div class="mobile-card divide-y divide-slate-100"><div class="mobile-fee-row"><span>联系人</span><b>陈经理 / 13800138000</b></div><div class="mobile-fee-row"><span>常走线路</span><b>Ghana, Nigeria</b></div><div class="mobile-fee-row"><span>客户偏好</span><b>微信确认 + DDP</b></div></div>'+
    '</div>';
}

function staffDemandScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('Groupage需求卡','报价前必须结构化','staff')+
        '<div class="mobile-card p-3"><div class="flex items-center justify-between"><span class="text-[13px] font-semibold text-slate-950">完整度</span><span class="text-[12px] font-bold text-amber-700">78%</span></div><div class="h-2 mt-3 rounded-full bg-slate-100 overflow-hidden"><div class="h-full w-[78%] bg-amber-500"></div></div><div class="text-[11px] text-rose-600 mt-2">缺失：品名监管属性、末端派送城市</div></div>'+
        '<div class="mobile-form-grid">'+
            mobileField('客户','上海锦程国际','mobile-col-2')+
            mobileSelect('业务类型','LCL 散货')+
            mobileInput('目的国家','Ghana','')+
            mobileInput('目的城市','','Accra')+
            mobileInput('品名','LED灯具','')+
            mobileSelect('敏感属性','待确认')+
            mobileInput('件数','12','')+
            mobileInput('重量KG','186','')+
            mobileInput('CBM','1.20','')+
            mobileInput('计划出货日','2026-09-05','')+
        '</div>'+
        '<div class="mobile-card p-3"><div class="text-[13px] font-semibold text-slate-950 mb-3">报价门槛</div><div class="space-y-2 text-[12px] text-slate-600"><div class="flex gap-2">'+mobileIcon('check','w-4 h-4 text-emerald-600')+'客户与路线已确认</div><div class="flex gap-2">'+mobileIcon('warning','w-4 h-4 text-amber-600')+'监管属性未确认，仅可保存草稿</div></div></div>'+
        '<div class="grid grid-cols-2 gap-2"><button class="mobile-secondary-btn" onclick="mobileMockAction(\'草稿已保存\')">保存草稿</button><button class="mobile-primary-btn m-0" onclick="mobileAppOpen(\'staff-app-quote\')">补齐并报价</button></div>'+
    '</div>';
}

function staffQuoteScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('报价处理','成本、售价、毛利、有效期','staff')+
        '<div class="mobile-card p-4"><div class="flex items-start justify-between"><div><div class="text-[15px] font-bold text-slate-950">Q-20260831002</div><div class="text-[11px] text-slate-500 mt-1">广州 - Accra / LCL / 1.2CBM</div></div>'+mobilePill('待发送','amber')+'</div><div class="mt-4 grid grid-cols-3 gap-2"><div class="mobile-soft-box"><b>198</b><span>成本USD</span></div><div class="mobile-soft-box"><b>286</b><span>售价USD</span></div><div class="mobile-soft-box"><b>30.8%</b><span>毛利率</span></div></div></div>'+
        '<div class="mobile-card divide-y divide-slate-100"><div class="mobile-fee-row"><span>报价版本</span><b>V2 - 运价更新</b></div><div class="mobile-fee-row"><span>有效期</span><b>24小时</b></div><div class="mobile-fee-row"><span>审批规则</span><b>毛利正常，无需审批</b></div><div class="mobile-fee-row"><span>历史成交参考</span><b>USD 292.00</b></div></div>'+
        '<div class="mobile-section-title">跟进计划</div>'+
        '<div class="mobile-card p-3">'+mobileTimeline([['发送报价','立即',false,'客户确认入口自动生成'],['T+24提醒','明天 10:00',false,'未反馈自动建任务'],['T+48预警','09-02 10:00',false,'进入红色跟进'],['T+72升级','09-03 10:00',false,'主管异常池']])+'</div>'+
        '<button class="mobile-primary-btn" onclick="mobileMockAction(\'报价已发送给客户\')">发送报价</button>'+
    '</div>';
}

function staffTasksScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('任务SLA','Owner、Deadline、关闭证据','staff')+
        '<div class="mobile-filter-tabs"><button class="active">今日</button><button>逾期</button><button>等客户</button><button>协作</button></div>'+
        mobileTaskCard('报价后24小时跟进','上海锦程 - Owner 李业务 - 11:30','amber','记录跟进')+
        mobileTaskCard('补齐需求字段','东莞鑫海 - 等客户品名说明 - 12:00','rose','催办客户')+
        mobileTaskCard('非标报价审批','Nigeria FCL - 等报价主管 - 14:00','blue','查看审批')+
        '<div class="mobile-card p-3"><div class="text-[13px] font-semibold text-slate-950 mb-3">关闭证据</div><div class="grid grid-cols-2 gap-2">'+mobileField('状态原因','客户已回复')+mobileField('下一动作','重报V3')+'</div><button class="mobile-mini-btn mt-3" onclick="mobileMockAction(\'已关闭任务并生成下一步\')">提交关闭</button></div>'+
    '</div>';
}

function staffOrdersScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('订单协同','报价确认后一键交接','staff')+
        '<div class="mobile-card p-3 bg-emerald-50 border border-emerald-100"><div class="flex items-center gap-2 text-emerald-700">'+mobileIcon('check','w-4 h-4')+'<span class="text-[13px] font-semibold">报价已确认，订单自动创建</span></div><div class="text-[11px] text-emerald-700 mt-2">HLHSH20260831009 - 继承需求卡、报价、附件、客户承诺</div></div>'+
        '<div class="mobile-card p-3">'+mobileTimeline([['销售交接','已完成',true,'李业务提交需求和报价'],['客服建单','10分钟内',false,'分配 Owner：张客服'],['仓库入仓','待客户送仓',false,'节点回传到客户APP'],['操作出运','待订舱',false,'截仓前自动提醒'],['财务应收','签收后',false,'账期规则自动生成']])+'</div>'+
        '<div class="mobile-section-title">协作任务</div>'+
        mobileTaskCard('客服确认订单资料','Owner 张客服 - SLA 30分钟','blue','催办')+
        mobileTaskCard('客户补充装箱单','Owner 客户 - SLA 2小时','amber','提醒客户')+
        '<button class="mobile-primary-btn" onclick="mobileMockAction(\'已进入订单详情\')">查看订单详情</button>'+
    '</div>';
}

function staffServiceScreen(){
    return '<div class="mobile-content">'+
        mobilePhoneHeader('服务工单','异常处理与复盘','staff')+
        '<div class="mobile-card p-3 border-l-4 border-l-rose-400"><div class="flex items-start justify-between"><div><div class="text-[14px] font-semibold text-slate-950">免箱期风险</div><div class="text-[11px] text-slate-500 mt-1">FCL-20260830007 - Lagos 到港</div></div>'+mobilePill('高风险','rose')+'</div><div class="mt-3 grid grid-cols-2 gap-2">'+mobileField('Owner','海外客服')+mobileField('Deadline','今日18:00')+'</div></div>'+
        '<div class="mobile-card p-3"><div class="text-[13px] font-semibold text-slate-950 mb-3">处理流转</div>'+mobileTimeline([['异常创建','09:10',true,'ETA提前，免箱期开始倒计时'],['通知客户','09:20',true,'WhatsApp 已送达'],['海外站处理','进行中',false,'等待清关放行'],['关闭复盘','待处理',false,'需上传处理结论']])+'</div>'+
        '<div class="mobile-form-grid">'+mobileSelect('处理结论','客户已确认提柜计划','mobile-col-2')+mobileInput('复盘标签','免箱期风险','')+mobileInput('关闭证据','WhatsApp截图','')+'</div>'+
        '<button class="mobile-primary-btn" onclick="mobileMockAction(\'工单已关闭并同步异常池\')">关闭工单</button>'+
    '</div>';
}

function generateClientMobileScreen(id){
    if(id==='client-app-inquiry')return clientInquiryScreen();
    if(id==='client-app-quotes')return clientQuotesScreen();
    if(id==='client-app-orders')return clientOrdersScreen();
    if(id==='client-app-service')return clientServiceScreen();
    if(id==='client-app-profile')return clientProfileScreen();
    return clientHomeScreen();
}

function generateStaffMobileScreen(id){
    if(id==='staff-app-chat')return staffChatScreen();
    if(id==='staff-app-customer')return staffCustomerScreen();
    if(id==='staff-app-demand')return staffDemandScreen();
    if(id==='staff-app-quote')return staffQuoteScreen();
    if(id==='staff-app-tasks')return staffTasksScreen();
    if(id==='staff-app-orders')return staffOrdersScreen();
    if(id==='staff-app-service')return staffServiceScreen();
    return staffHomeScreen();
}

function generateMobileAppPage(id){
    const cfg=MOBILE_APP_TABS[id]||MOBILE_APP_TABS['client-app-home'];
    const screen=cfg.kind==='staff'?generateStaffMobileScreen(id):generateClientMobileScreen(id);
    return mobilePrototypeShell(cfg.kind,id,screen);
}
