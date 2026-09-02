/* ================= 审批 L1 · 我的审批 =================
 * 列表 + 我的审批详情(基本信息/申请详情/审批详情时间轴) + 审核结果弹窗
 * 申请详情按「审批类型」渲染不同字段块（财务预付款申请 / 合同盖章申请 …）
 */
addPrototypeTable('approval-mine','我的审批',
    '申请单号|审批类型|申请人|申请时间|当前审批节点|提示消息|审批状态|操作',
    ['待审批','审核通过','审核驳回'],
    [
        ['AP2608130003','合同盖章申请','梦幻管理员','2026-08-13 17:02:11','1 / 2','你有一条新的「合同盖章申请」待审批！','待审批'],
        ['AP2608130002','合同盖章申请','梦幻管理员','2026-08-13 16:21:02','1 / 1','合同盖章申请','审核通过'],
        ['AP2608100001','财务预付款申请','HYD-开发者','2026-08-10 09:29:57','2 / 2','你有一条新的「预付款申请」待审批！','审核通过'],
        ['AP2608090004','财务预付款申请','天地销售员','2026-08-09 14:05:20','1 / 2','你有一条新的「预付款申请」待审批！','待审批'],
        ['AP2608080005','财务预付款申请','赵梦幻','2026-08-08 11:12:36','2 / 2','你有一条新的「预付款申请」待审批！','审核驳回']
    ],
    [
        {label:'申请单号',type:'text'},
        {label:'审批类型',type:'select',options:['财务预付款申请','合同盖章申请']},
        {label:'申请人',type:'text'},
        {label:'审批状态',type:'select',options:['待审批','审核通过','审核驳回']}
    ]
);
TC['approval-mine'].noExpand=true;
TC['approval-mine'].noAutoAudit=true;

/* 申请单号 -> {title:申请详情分组标题, fields:[[标签,值]], nodes:[审批节点]} */
var _approvalDetails={
    'AP2608100001':{title:'',fields:[
        ['预付款单号','PA2608100001'],['申请时间','2026-08-10'],['服务商','报关服务商01'],['金额','500.0'],
        ['币别','CNY'],['汇率','1.0'],['金额(转人民币)','500.0'],['备注','']
    ],nodes:[
        {name:'审批节点',status:'审核通过',people:'梦幻大业务;赵梦幻;天地总部',approver:'HYD-开发者',time:'2026-08-10 09:37:34',remark:'aa'},
        {name:'审批节点1',status:'审核通过',people:'梦幻小业务;天地销售员',approver:'HYD-开发者',time:'2026-08-10 09:37:42',remark:'aa'}
    ]},
    'AP2608130002':{title:'合同盖章信息',fields:[
        ['客户','测试客户1(C8888)'],['是否签订合同','是'],['合同签订开始时间','2026-08-13 16:20:36'],
        ['合同签订结束时间','2027-08-31 16:20:40'],['备注','']
    ],nodes:[
        {name:'审批节点',status:'审核通过',people:'HYD',approver:'HYD-开发者',time:'2026-08-13 16:23:15',remark:'111'}
    ]},
    'AP2608130003':{title:'合同盖章信息',fields:[
        ['客户','星星玩具电商(C10006)'],['是否签订合同','是'],['合同签订开始时间','2026-08-13 17:00:12'],
        ['合同签订结束时间','2027-08-31 17:00:20'],['备注','']
    ],nodes:[
        {name:'审批节点',status:'审核通过',people:'梦幻大业务;赵梦幻',approver:'梦幻管理员',time:'2026-08-13 17:05:02',remark:'同意'},
        {name:'审批节点1',status:'待审批',people:'HYD;天地总部',approver:'',time:'',remark:''}
    ]},
    'AP2608090004':{title:'',fields:[
        ['预付款单号','PA2608090004'],['申请时间','2026-08-09'],['服务商','拖车服务商02'],['金额','1200.0'],
        ['币别','CNY'],['汇率','1.0'],['金额(转人民币)','1200.0'],['备注','月度拖车预付']
    ],nodes:[
        {name:'审批节点',status:'待审批',people:'梦幻大业务;赵梦幻;天地总部',approver:'',time:'',remark:''},
        {name:'审批节点1',status:'待审批',people:'梦幻小业务;天地销售员',approver:'',time:'',remark:''}
    ]},
    'AP2608080005':{title:'',fields:[
        ['预付款单号','PA2608080005'],['申请时间','2026-08-08'],['服务商','报关服务商01'],['金额','800.0'],
        ['币别','USD'],['汇率','7.0'],['金额(转人民币)','5600.0'],['备注','']
    ],nodes:[
        {name:'审批节点',status:'审核通过',people:'梦幻大业务;赵梦幻',approver:'HYD-开发者',time:'2026-08-08 11:30:10',remark:'同意'},
        {name:'审批节点1',status:'审核驳回',people:'天地总部',approver:'天地总部管理员',time:'2026-08-08 15:02:41',remark:'金额超限，请拆分申请'}
    ]}
};

function approvalCell(row,headers,name){var i=headers.indexOf(name);return i>=0?(row[i]==null?'':String(row[i])):'';}
function approvalRowData(id,rowIdx){
    var c=TC[id]||{};
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    return {c:c,row:data[rowIdx]};
}
/* 审批节点图标：通过=绿勾，驳回=红叉，待审批=灰圈 */
function approvalNodeIcon(status){
    if(status==='审核通过')return '<span class="flex-shrink-0 w-6 h-6 rounded-full border-2 border-green-500 text-green-600 flex items-center justify-center text-xs">✓</span>';
    if(status==='审核驳回')return '<span class="flex-shrink-0 w-6 h-6 rounded-full border-2 border-red-500 text-red-600 flex items-center justify-center text-xs">✕</span>';
    return '<span class="flex-shrink-0 w-6 h-6 rounded-full border-2 border-surface-300 text-text-muted flex items-center justify-center text-xs">•</span>';
}
function approvalNodeColor(status){
    return status==='审核通过'?'text-green-600':(status==='审核驳回'?'text-red-600':'text-text-secondary');
}
function approvalCard(title,inner){
    return '<section class="rounded-xl border border-surface-200 bg-white p-4"><div class="text-sm font-semibold text-text-primary mb-3">'+tr(title)+'</div>'+inner+'</section>';
}

/* ===== 我的审批详情 ===== */
function openApprovalDetail(id,rowIdx){
    var d=approvalRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到审批数据'));return;}
    var no=approvalCell(row,headers,'申请单号');
    var det=_approvalDetails[no]||{title:'',fields:[],nodes:[]};
    var h='<div class="space-y-4">';
    /* 基本信息 */
    var base=[
        ['申请单号',no],['审批类型',approvalCell(row,headers,'审批类型')],['当前审批节点',approvalCell(row,headers,'当前审批节点')],
        ['申请人',approvalCell(row,headers,'申请人')],['申请时间',approvalCell(row,headers,'申请时间')],['提示消息',approvalCell(row,headers,'提示消息')]
    ];
    var bi='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">';
    base.forEach(function(p){
        bi+='<div class="min-w-0"><span class="text-text-secondary">'+tr(p[0])+'：</span><span class="text-text-primary break-all">'+esc(p[1]||'')+'</span></div>';
    });
    bi+='</div>';
    h+=approvalCard('基本信息',bi);
    /* 申请详情（按审批类型渲染不同字段块） */
    var di='';
    if(det.title)di+='<div class="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-surface-200">'+tr(det.title)+'</div>';
    di+='<div class="divide-y divide-surface-100">';
    if(!det.fields.length){di+='<div class="py-6 text-center text-text-muted text-sm">'+tr('暂无申请详情')+'</div>';}
    det.fields.forEach(function(f){
        di+='<div class="flex items-start gap-4 py-2.5 text-sm"><span class="text-text-secondary w-40 flex-shrink-0">'+tr(f[0])+'</span><span class="text-text-primary break-all">'+esc(f[1]||'')+'</span></div>';
    });
    di+='</div>';
    h+=approvalCard('申请详情',di);
    /* 审批详情（时间轴） */
    var ai='<div class="space-y-4">';
    if(!det.nodes.length){ai+='<div class="py-6 text-center text-text-muted text-sm">'+tr('暂无审批记录')+'</div>';}
    det.nodes.forEach(function(n,i){
        var last=i===det.nodes.length-1;
        ai+='<div class="flex gap-3">';
        ai+='<div class="flex flex-col items-center">'+approvalNodeIcon(n.status)+(last?'':'<div class="flex-1 w-px bg-surface-200 my-1"></div>')+'</div>';
        ai+='<div class="pb-1 min-w-0">';
        ai+='<div class="text-sm font-medium '+approvalNodeColor(n.status)+'">'+esc(n.name)+'('+tr(n.status)+')</div>';
        ai+='<div class="mt-1 space-y-1 text-xs text-text-secondary">';
        ai+='<div>'+tr('人员列表')+'：'+esc(n.people||'')+'</div>';
        ai+='<div>'+tr('审批人')+'：'+esc(n.approver||'—')+'</div>';
        ai+='<div>'+tr('审批时间')+'：'+esc(n.time||'—')+'</div>';
        ai+='<div>'+tr('审批备注')+'：'+esc(n.remark||'—')+'</div>';
        ai+='</div></div></div>';
    });
    ai+='</div>';
    h+=approvalCard('审批详情',ai);
    h+='</div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='68%';
    document.getElementById('crud-modal-title').textContent=tr('我的审批详情');
    document.getElementById('crud-modal-body').innerHTML=h;
    var status=approvalCell(row,headers,'审批状态');
    var footer='';
    if(status==='待审批')footer+='<button onclick="openApprovalAuditModal(\''+id+'\','+rowIdx+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer mr-2">'+tr('审核')+'</button>';
    footer+='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal-footer').innerHTML=footer;
    document.getElementById('crud-modal').classList.add('show');
}

/* ===== 审核结果弹窗（审核状态、备注均必填） ===== */
function openSelectedApprovalAudit(id){
    var idx=(typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1;
    if(idx<0){showToast(tr('请先选择一条审批数据'));return;}
    openApprovalAuditModal(id,idx);
}
function openApprovalAuditModal(id,rowIdx){
    var d=approvalRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到审批数据'));return;}
    if(approvalCell(row,headers,'审批状态')!=='待审批'){showToast(tr('该审批单已审核完成，无需重复审核'));return;}
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='46%';
    document.getElementById('crud-modal-title').textContent=tr('审核结果');
    var h='<div class="space-y-4">';
    h+='<div><label class="block text-sm text-text-secondary mb-1.5"><span class="text-red-500">*</span> '+tr('审核状态')+'</label>';
    h+='<select id="ap-audit-status" onchange="approvalAuditClearTip()" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-white"><option value="">'+tr('请选择')+'</option><option>审核通过</option><option>审核驳回</option></select>';
    h+='<div id="ap-audit-status-tip" class="hidden text-xs text-red-500 mt-1">'+tr('必填选项')+'</div></div>';
    h+='<div><label class="block text-sm text-text-secondary mb-1.5"><span class="text-red-500">*</span> '+tr('备注')+'</label>';
    h+='<textarea id="ap-audit-remark" rows="4" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-white resize-y"></textarea>';
    h+='<div id="ap-audit-remark-tip" class="hidden text-xs text-red-500 mt-1">'+tr('必填选项')+'</div></div>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="submitApprovalAudit(\''+id+'\','+rowIdx+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认')+'</button>'+
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function approvalAuditClearTip(){
    var s=document.getElementById('ap-audit-status'),t=document.getElementById('ap-audit-status-tip');
    if(s&&s.value&&t){t.classList.add('hidden');s.classList.remove('border-red-400');}
}
function submitApprovalAudit(id,rowIdx){
    var sEl=document.getElementById('ap-audit-status');
    var rEl=document.getElementById('ap-audit-remark');
    var ok=true;
    if(!sEl||!sEl.value){
        ok=false;
        var st=document.getElementById('ap-audit-status-tip');
        if(st)st.classList.remove('hidden');
        if(sEl)sEl.classList.add('border-red-400');
    }
    if(!rEl||!rEl.value.trim()){
        ok=false;
        var rt=document.getElementById('ap-audit-remark-tip');
        if(rt)rt.classList.remove('hidden');
        if(rEl)rEl.classList.add('border-red-400');
    }
    if(!ok){showToast(tr('请完整填写审核状态与备注'));return;}
    var c=TC[id]||{};
    if(!_listData[id])_listData[id]=(c.d||[]).map(function(r){return r.slice();});
    var headers=c.h||[];
    var row=_listData[id][rowIdx];
    var status=sEl.value,remark=rEl.value.trim();
    if(row){
        var iSt=headers.indexOf('审批状态');
        if(iSt>=0)row[iSt]=status;
        /* 同步写入审批详情的当前待办节点 */
        var no=approvalCell(row,headers,'申请单号');
        var det=_approvalDetails[no];
        if(det&&det.nodes){
            for(var i=0;i<det.nodes.length;i++){
                if(det.nodes[i].status==='待审批'){
                    det.nodes[i].status=status;
                    det.nodes[i].approver=(typeof owCurrentOperator==='function')?owCurrentOperator():'当前操作员';
                    det.nodes[i].time=(typeof receiptNowStr==='function')?receiptNowStr():'';
                    det.nodes[i].remark=remark;
                    break;
                }
            }
            /* 审核通过但仍有待办节点时，整单回到待审批 */
            if(status==='审核通过'&&det.nodes.some(function(n){return n.status==='待审批';})&&iSt>=0)row[iSt]='待审批';
        }
    }
    closeCrudModal();
    var mc=document.getElementById('main-content');
    var pg=(typeof _listPage!=='undefined'&&_listPage[id])?_listPage[id]:1;
    var sf=(typeof _statusFilterVal!=='undefined')?(_statusFilterVal||''):'';
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,pg,sf);
    if(typeof updateNotifBadge==='function')updateNotifBadge();
    showToast(tr('审核已提交')+'：'+status);
}
