/* ================= 审批 L1 · 我的消息 =================
 * 列表（待办 / 消息 两个插页）+ 消息详情弹窗（参照我的审批：基本信息 / 消息内容 / 待办处理）
 */
var MSG_TYPE_BIZ=['运单预报','入仓收货','装袋配舱','出库放行','海外到仓','签收回执'];
var MSG_TYPE_ISSUE=['破损','开箱验货','清关异常','丢件','超重超尺寸'];

addPrototypeTable('approval-msg','我的消息',
    '消息编号|消息分类|运单号|消息类型|消息内容|消息备注|阅读状态|消息接收人|阅读时间|待办处理时间|待办处理人|待办处理信息|创建时间|创建人|操作',
    ['待办','消息'],
    [
        ['MSG2608220006','待办','H2608220003','开箱验货','运单 H2608220003 需开箱验货，请及时处理','客户要求拍照留档','未读','天地客服员','','','','','2026-08-22 10:41:02','系统'],
        ['MSG2608220005','待办','H2608180007','清关异常','运单 H2608180007 清关资料缺失，请补充','缺商业发票','已读','天地总部管理员','2026-08-22 09:12:30','2026-08-22 09:40:11','天地总部管理员','已补传商业发票并重新提交清关','2026-08-22 08:55:19','系统'],
        ['MSG2608200004','待办','H2608180006','破损','运单 H2608180006 到仓发现外箱破损，请确认处理方式','外箱两处压瘪','已读','天地仓管理员','2026-08-20 15:22:08','','','','2026-08-20 15:10:44','天地仓管理员'],
        ['MSG2608220003','消息','H2608220003','入仓收货','运单 H2608220003 仓库收货已完成','','未读','天地客服员','','','','','2026-08-22 10:40:17','系统'],
        ['MSG2608180002','消息','H2608180007','装袋配舱','运单 H2608180007 终配舱登记已完成','','已读','天地销售员','2026-08-18 12:02:44','','','','2026-08-18 11:31:58','系统'],
        ['MSG2608180001','消息','H2608180006','运单预报','客户已提交预报，运单 H2608180006 已生成','','已读','天地销售员','2026-08-18 11:20:31','','','','2026-08-18 11:15:05','系统']
    ],
    [
        {label:'消息编号',type:'text'},
        {label:'消息类型-业务操作',type:'select',options:MSG_TYPE_BIZ},
        {label:'消息类型-问题件',type:'select',options:MSG_TYPE_ISSUE},
        {label:'已读状态',type:'select',options:['已读','未读']}
    ]
);
TC['approval-msg'].noExpand=true;
TC['approval-msg'].noAutoAudit=true;
/* 插页按「消息分类」过滤：默认取数规则会先命中「阅读状态」列，必须显式指定 */
TC['approval-msg'].statusMatch=function(row,tab,headers){
    var i=headers.indexOf('消息分类');
    return i>=0&&row[i]===tab;
};

function approvalMsgCell(row,headers,name){var i=headers.indexOf(name);return i>=0?(row[i]==null?'':String(row[i])):'';}

function approvalMsgRowData(id,rowIdx){
    var c=TC[id]||{};
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    return {c:c,row:data[rowIdx]};
}

/* 工具栏「查看详情」：先勾选再打开 */
function openSelectedApprovalMsg(id){
    var idx=(typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1;
    if(idx<0){showToast(tr('请先勾选一条消息'));return;}
    openApprovalMsgDetail(id,idx);
}

function openApprovalMsgDetail(id,rowIdx){
    var d=approvalMsgRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到消息数据'));return;}
    var g=function(n){return approvalMsgCell(row,headers,n);};
    var isTodo=g('消息分类')==='待办';
    var h='<div class="space-y-4">';

    /* 基本信息 */
    var base=[
        ['消息编号',g('消息编号')],['消息分类',g('消息分类')],['消息类型',g('消息类型')],
        ['运单号',g('运单号')],['消息接收人',g('消息接收人')],['阅读状态',g('阅读状态')],
        ['创建人',g('创建人')],['创建时间',g('创建时间')],['阅读时间',g('阅读时间')]
    ];
    var bi='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">';
    base.forEach(function(p){
        bi+='<div class="min-w-0"><span class="text-text-secondary">'+tr(p[0])+'：</span><span class="text-text-primary break-all">'+esc(p[1]||'—')+'</span></div>';
    });
    bi+='</div>';
    h+=approvalCard('基本信息',bi);

    /* 消息内容 */
    var ci='<div class="divide-y divide-surface-100">';
    [['消息内容',g('消息内容')],['消息备注',g('消息备注')]].forEach(function(f){
        ci+='<div class="flex items-start gap-4 py-2.5 text-sm"><span class="text-text-secondary w-28 flex-shrink-0">'+tr(f[0])+'</span><span class="text-text-primary break-all">'+esc(f[1]||'—')+'</span></div>';
    });
    ci+='</div>';
    h+=approvalCard('消息内容',ci);

    /* 待办处理：仅待办类消息显示，处理与否用与审批一致的节点图标 */
    if(isTodo){
        var done=!!g('待办处理时间');
        var ti='<div class="flex gap-3">';
        ti+='<div class="flex flex-col items-center">'+approvalNodeIcon(done?'审核通过':'待审批')+'</div>';
        ti+='<div class="min-w-0"><div class="text-sm font-medium '+(done?'text-green-600':'text-text-secondary')+'">'+tr(done?'已处理':'待处理')+'</div>';
        ti+='<div class="mt-1 space-y-1 text-xs text-text-secondary">';
        ti+='<div>'+tr('待办处理人')+'：'+esc(g('待办处理人')||'—')+'</div>';
        ti+='<div>'+tr('待办处理时间')+'：'+esc(g('待办处理时间')||'—')+'</div>';
        ti+='<div>'+tr('待办处理信息')+'：'+esc(g('待办处理信息')||'—')+'</div>';
        ti+='</div></div></div>';
        h+=approvalCard('待办处理',ti);
    }
    h+='</div>';

    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='68%';
    document.getElementById('crud-modal-title').textContent=tr('我的消息详情');
    document.getElementById('crud-modal-body').innerHTML=h;
    var footer='';
    if(g('阅读状态')==='未读')footer+='<button onclick="markApprovalMsgRead(\''+id+'\','+rowIdx+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer mr-2">'+tr('标记已读')+'</button>';
    footer+='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal-footer').innerHTML=footer;
    document.getElementById('crud-modal').classList.add('show');
}

/* 标记已读：写回阅读状态与阅读时间，并刷新列表 */
function markApprovalMsgRead(id,rowIdx){
    var c=TC[id]||{};
    if(!_listData[id])_listData[id]=(c.d||[]).map(function(r){return r.slice();});
    var headers=c.h||[],row=_listData[id][rowIdx];
    if(row){
        var iSt=headers.indexOf('阅读状态'),iTm=headers.indexOf('阅读时间');
        if(iSt>=0)row[iSt]='已读';
        if(iTm>=0&&!row[iTm])row[iTm]=(typeof receiptNowStr==='function')?receiptNowStr():'';
    }
    closeCrudModal();
    var mc=document.getElementById('main-content');
    var pg=(typeof _listPage!=='undefined'&&_listPage[id])?_listPage[id]:1;
    var sf=(typeof _statusFilterVal!=='undefined')?(_statusFilterVal||''):'';
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,pg,sf);
    showToast(tr('已标记为已读'));
}
