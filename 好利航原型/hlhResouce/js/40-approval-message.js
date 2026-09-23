/* ================= 审批 L1 · 我的消息 =================
 * 系统事件触发、挂业务单据、点对点投递的业务消息（与「我的公告」的人发一对多并行）。
 * 2026-09-22 重构：界面参照「我的公告」——
 *   列表  未读/已读 分插页，业务单号列（消息挂的就是这张单）；
 *   详情  邮件式排版；
 *   已读  打开详情即已读；工具栏 标记已读 / 全部已读（与我的公告同款）。
 * 同日简化：去掉「待办」概念 —— 待办走「我的审批」，这里只做纯通知；
 *   消息分类（待办/消息）与 待办处理时间/人/信息 三列一并删除。
 * 2026-09-23：增加标题列（一句话概括，列表扫读靠它）；去掉消息备注 ——
 *   标题 + 消息内容两层已够，备注多数时候是空的。
 * ================= */
var MSG_TYPE_BIZ=['运单预报','入仓收货','装袋配舱','出库放行','海外到仓','签收回执'];
var MSG_TYPE_ISSUE=['破损','开箱验货','清关异常','丢件','超重超尺寸'];

addPrototypeTable('approval-msg','我的消息',
    '消息编号|标题|业务单号|消息类型|消息内容|阅读状态|消息接收人|阅读时间|创建时间|创建人|操作',
    ['未读','已读'],
    [
        ['MSG2608220006','开箱验货通知','H2608220003','开箱验货','运单 H2608220003 需开箱验货，请及时处理','未读','天地客服员','','2026-08-22 10:41:02','系统'],
        ['MSG2608220005','清关资料缺失','H2608180007','清关异常','运单 H2608180007 清关资料缺失，请补充','已读','天地总部管理员','2026-08-22 09:12:30','2026-08-22 08:55:19','系统'],
        ['MSG2608200004','到仓外箱破损','H2608180006','破损','运单 H2608180006 到仓发现外箱破损，请确认处理方式','未读','天地仓管理员','','2026-08-20 15:10:44','天地仓管理员'],
        ['MSG2608220003','收货完成','H2608220003','入仓收货','运单 H2608220003 仓库收货已完成','未读','天地客服员','','2026-08-22 10:40:17','系统'],
        ['MSG2608180002','终配舱登记完成','H2608180007','装袋配舱','运单 H2608180007 终配舱登记已完成','已读','天地销售员','2026-08-18 12:02:44','2026-08-18 11:31:58','系统'],
        ['MSG2608180001','运单已生成','H2608180006','运单预报','客户已提交预报，运单 H2608180006 已生成','已读','天地销售员','2026-08-18 11:20:31','2026-08-18 11:15:05','系统']
    ],
    [
        {label:'消息编号',type:'text'},
        {label:'标题',type:'text'},
        {label:'业务单号',type:'text'},
        {label:'消息类型-业务操作',type:'select',options:MSG_TYPE_BIZ},
        {label:'消息类型-问题件',type:'select',options:MSG_TYPE_ISSUE},
        {label:'已读状态',type:'select',options:['已读','未读']}
    ]
);
TC['approval-msg'].noExpand=true;
TC['approval-msg'].noAutoAudit=true;
/* 插页按「阅读状态」分 —— 与我的公告同一套口径，未读/已读是收件人最关心的切分 */
TC['approval-msg'].statusMatch=function(row,tab,headers){
    var i=headers.indexOf('阅读状态');
    return i>=0&&row[i]===tab;
};

function approvalMsgCell(row,headers,name){var i=headers.indexOf(name);return i>=0?(row[i]==null?'':String(row[i])):'';}

function approvalMsgRowData(id,rowIdx){
    var c=TC[id]||{};
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    return {c:c,row:data[rowIdx]};
}

/* 消息类型的配色：问题件类（破损/丢件/清关异常…）用暖色，业务节点类用中性色 */
function approvalMsgTypeBadge(t){
    var warm=(typeof MSG_TYPE_ISSUE!=='undefined')&&MSG_TYPE_ISSUE.indexOf(t)>=0;
    return '<span class="px-1.5 py-0.5 rounded border '+(warm
        ?'bg-red-50 text-red-600 border-red-100'
        :'bg-surface-100 text-text-secondary border-surface-200')+'">'+esc(tr(t||''))+'</span>';
}

/* 工具栏「查看详情」：先勾选再打开 */
function openSelectedApprovalMsg(id){
    var idx=(typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1;
    if(idx<0){showToast(tr('请先勾选一条消息'));return;}
    openApprovalMsgDetail(id,idx);
}

/* 详情：按读邮件的样子排。
 * 标题顶在最上（与公告详情同位）；信头一行小字给出 编号/类型/业务单号/收件人/时间；
 * 正文是消息内容。 */
function openApprovalMsgDetail(id,rowIdx){
    var d=approvalMsgRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到消息数据'));return;}
    id=id||'approval-msg';
    var g=function(n){return approvalMsgCell(row,headers,n);};
    var b='';

    /* 标题行 */
    b+='<div class="text-lg font-semibold text-text-primary leading-snug">'+esc(g('标题')||g('消息内容')||'—')+'</div>';
    /* 信头徽标：消息类型（问题件类红色）+ 未读 */
    b+='<div class="mt-2 flex items-center gap-2 flex-wrap text-xs">'+
       approvalMsgTypeBadge(g('消息类型'))+
       (g('阅读状态')==='未读'?('<span class="px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-600">'+tr('未读')+'</span>'):'')+
       '</div>';
    /* 信头小字：编号 / 业务单号 / 收件人 / 创建信息 */
    b+='<div class="mt-2.5 rounded-lg border border-surface-200 bg-surface-50/60 px-3 py-2.5 text-xs text-text-secondary space-y-1">';
    b+='<div><span class="text-text-muted">'+tr('消息编号')+'：</span>'+esc(g('消息编号')||'—')+
       '　<span class="text-text-muted">'+tr('业务单号')+'：</span>'+
       '<span class="font-semibold text-primary-700">'+esc(g('业务单号')||'—')+'</span></div>';
    b+='<div><span class="text-text-muted">'+tr('消息接收人')+'：</span>'+esc(g('消息接收人')||'—')+
       '　<span class="text-text-muted">'+tr('创建人')+'：</span>'+esc(g('创建人')||'—')+
       '　<span class="text-text-muted">'+tr('创建时间')+'：</span>'+esc(g('创建时间')||'—')+
       '　<span class="text-text-muted">'+tr('阅读时间')+'：</span>'+esc(g('阅读时间')||'—')+'</div>';
    b+='</div>';
    /* 正文：消息内容 */
    b+='<div class="mt-3 rounded-lg border border-surface-200 bg-white px-4 py-3 text-sm text-text-primary leading-relaxed min-h-[80px]">'+
       esc(g('消息内容')||'—')+'</div>';

    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='58%';
    document.getElementById('crud-modal-title').textContent=tr('我的消息详情');
    document.getElementById('crud-modal-body').innerHTML=b;
    var footer='';
    if(g('阅读状态')==='未读')footer+='<button onclick="markApprovalMsgRead(\''+id+'\','+rowIdx+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer mr-2">'+tr('我已知悉')+'</button>';
    footer+='<button onclick="closeApprovalMsgDetail(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal-footer').innerHTML=footer;
    document.getElementById('crud-modal').classList.add('show');
}
function closeApprovalMsgDetail(id){
    closeCrudModal();
    fclFinRefresh(id||'approval-msg');
}

/* 标记已读：写回阅读状态与阅读时间，并刷新列表。
 * rowIdx 是渲染视图（可能被查询/插页过滤过）的下标，种子行才是唯一事实 ——
 * 从渲染行反查种子行再写，别拿渲染下标直接当种子下标用。 */
function markApprovalMsgRead(id,rowIdx){
    id=id||'approval-msg';
    var c=TC[id]||{};
    var view=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var listRow=view[rowIdx];
    var row=listRow?(approvalMsgSeedRow(id,listRow)||listRow):null;
    if(row){
        var headers=c.h||[];
        var iSt=headers.indexOf('阅读状态'),iTm=headers.indexOf('阅读时间');
        if(iSt>=0)row[iSt]='已读';
        if(iTm>=0&&!row[iTm])row[iTm]=(typeof receiptNowStr==='function')?receiptNowStr():'';
        /* 渲染行是拷贝时也同步一份，同一次交互里读回来的不再是旧值 */
        if(listRow&&listRow!==row){
            if(iSt>=0)listRow[iSt]='已读';
            if(iTm>=0&&!listRow[iTm])listRow[iTm]=row[iTm];
        }
    }
    closeCrudModal();
    var mc=document.getElementById('main-content');
    var pg=(typeof _listPage!=='undefined'&&_listPage[id])?_listPage[id]:1;
    var sf=(typeof _statusFilterVal!=='undefined')?(_statusFilterVal||''):'';
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,pg,sf);
    if(typeof updateNotifBadge==='function')updateNotifBadge();
    showToast(tr('已标记为已读'));
}

/* 工具栏批量：勾选的未读全部转已读。勾选下标是渲染视图的，同样反查种子行写 */
function markApprovalMsgsRead(id){
    id=id||'approval-msg';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要标记的消息'));return;}
    var c=TC[id];
    if(!c||!c.d)return;
    var h=c.h||[],iSt=h.indexOf('阅读状态'),n=0;
    if(iSt<0)return;
    var view=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:c.d;
    var now=(typeof receiptNowStr==='function')?receiptNowStr():'';
    idxs.forEach(function(i){
        var lr=view[i];
        if(!lr||String(lr[iSt]||'')!=='未读')return;
        var src=approvalMsgSeedRow(id,lr)||lr;
        [src,lr].forEach(function(t){
            t[iSt]='已读';
            var iTm=h.indexOf('阅读时间');
            if(iTm>=0&&!t[iTm])t[iTm]=now;
        });
        n++;
    });
    if(!n){showToast(tr('所选消息都已是已读'));return;}
    if(typeof _listData!=='undefined')delete _listData[id];
    fclFinRefresh(id);
    if(typeof updateNotifBadge==='function')updateNotifBadge();
    showToast(tr('已标记已读')+' '+n+' '+tr('条'));
}
/* 一键全部已读 */
function markAllApprovalMsgsRead(id){
    id=id||'approval-msg';
    var c=TC[id];
    if(!c||!c.d){showToast(tr('没有数据'));return;}
    var h=c.h||[],iSt=h.indexOf('阅读状态');
    if(iSt<0)return;
    var pending=c.d.filter(function(r){return String(r[iSt]||'')==='未读';});
    if(!pending.length){showToast(tr('没有未读消息'));return;}
    openConfirmTip(tr('确认把全部')+' '+pending.length+' '+tr('条未读消息标记为已读？'),function(){
        var iTm=h.indexOf('阅读时间');
        pending.forEach(function(r){
            r[iSt]='已读';
            if(iTm>=0&&!r[iTm])r[iTm]=(typeof receiptNowStr==='function')?receiptNowStr():'';
        });
        if(typeof _listData!=='undefined')delete _listData[id];
        fclFinRefresh(id);
        if(typeof updateNotifBadge==='function')updateNotifBadge();
        showToast(tr('已全部标记已读')+' '+pending.length+' '+tr('条'));
    });
}
/* 列表行是 expandData 拷出来的副本时，按 消息编号+接收人+阅读时间 定位种子行 */
function approvalMsgSeedRow(id,listRow){
    var c=TC[id];
    if(!c||!c.d||!listRow)return null;
    var h=c.h||[],iN=h.indexOf('消息编号'),iP=h.indexOf('消息接收人');
    if(iN<0)return null;
    var kN=String(listRow[iN]||'');
    if(!kN)return null;
    var kP=iP>=0?String(listRow[iP]||''):'';
    return c.d.find(function(r){
        return String(r[iN]||'')===kN&&(iP<0||String(r[iP]||'')===kP);
    })||null;
}
