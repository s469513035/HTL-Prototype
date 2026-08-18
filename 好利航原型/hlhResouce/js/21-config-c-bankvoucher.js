function openCsIssueTypeModal(mode,id,rowIdx,rowData){
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='60%';
    const isEdit=mode==='edit';
    const code=rowData?rowData[0]:'';
    const name=rowData?rowData[1]:'';
    const template=rowData?rowData[2]:'';
    const region=rowData?rowData[3]:'';
    const remark=rowData?rowData[4]:'';
    const regionOptions=['头程问题件','海外问题件'];
    titleEl.textContent=isEdit?tr('编辑'):tr('新增');
    let html='<div class="space-y-4">';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('问题类型代码')+'</label>';
    if(isEdit){
        html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(code)+'" readonly></div>';
    }else{
        html+='<input type="text" required class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(code)+'" placeholder="'+esc(tr('请输入问题类型代码'))+'"></div>';
    }
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('问题类型名称')+'</label><input type="text" required class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(name)+'" placeholder="'+esc(tr('请输入问题类型名称'))+'"></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('区域类型')+'</label><select required class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"><option value="">'+tr('请选择区域类型')+'</option>'+regionOptions.map(function(o){return '<option value="'+esc(o)+'"'+(region===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('问题说明')+'</label><textarea rows="3" required class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入问题说明'))+'">'+esc(template)+'</textarea></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('备注')+'</label><textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入备注'))+'">'+esc(remark)+'</textarea></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    const toast=isEdit?tr('保存成功'):tr('新增成功');
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+toast+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+(isEdit?tr('保存修改'):tr('确认提交'))+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openMsgFlowModal(mode,id,rowIdx,rowData){
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='78%';
    const isEdit=mode==='edit';
    const name=rowData?rowData[1]:'';
    const status=rowData?(rowData[6]||'启用'):'启用';
    const remark=rowData?rowData[7]:'';
    const typeVal=rowData?rowData[5]:'';
    titleEl.textContent=isEdit?tr('编辑'):tr('新增');
    const inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    const issueSubs=(TC['cs-issue-type']&&TC['cs-issue-type'].d?TC['cs-issue-type'].d.map(function(r){return r[1];}):['破损','开箱验货','测试问题类型']);
    const bizSubs=['人工结算','出货复核','收货复核','库内盘点'];
    function leaf(cat,v){return '<div onclick="pickMsgFlowType(\''+esc(cat)+'\',\''+esc(v)+'\')" class="px-3 py-2 text-sm text-text-secondary hover:bg-primary-50 hover:text-primary-600 cursor-pointer whitespace-nowrap">'+esc(v)+'</div>';}
    let html='';
    html+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-4">';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('流程名称')+'</label><input type="text" required class="'+inputCls+'" value="'+esc(name)+'" placeholder="'+esc(tr('请输入流程名称'))+'"></div>';
    html+='<div class="relative"><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('消息类型')+'</label>';
    html+='<input id="msgflow-type-input" type="text" readonly onclick="toggleMsgFlowTypeMenu()" class="'+inputCls+' cursor-pointer" value="'+esc(typeVal)+'" placeholder="'+esc(tr('请选择消息类型'))+'">';
    html+='<div id="msgflow-type-menu" class="hidden absolute left-0 top-full mt-1 z-50 w-44 bg-white border border-surface-200 rounded-lg shadow-lg py-1">';
    html+='<div class="group relative"><div class="flex items-center justify-between px-3 py-2 text-sm text-text-primary hover:bg-primary-50 cursor-pointer"><span>'+tr('问题件')+'</span><span class="text-text-muted">›</span></div>';
    html+='<div class="hidden group-hover:block absolute left-full top-0 w-40 bg-white border border-surface-200 rounded-lg shadow-lg py-1">'+issueSubs.map(function(v){return leaf('问题件',v);}).join('')+'</div></div>';
    html+='<div class="group relative"><div class="flex items-center justify-between px-3 py-2 text-sm text-text-primary hover:bg-primary-50 cursor-pointer"><span>'+tr('业务操作')+'</span><span class="text-text-muted">›</span></div>';
    html+='<div class="hidden group-hover:block absolute left-full top-0 w-40 bg-white border border-surface-200 rounded-lg shadow-lg py-1">'+bizSubs.map(function(v){return leaf('业务操作',v);}).join('')+'</div></div>';
    html+='</div></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('启用状态')+'</label><select class="'+inputCls+'">'+['启用','禁用'].map(function(o){return '<option'+(status===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    html+='</div>';
    html+='<div class="mb-4"><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('备注')+'</label><input type="text" class="'+inputCls+'" value="'+esc(remark)+'" placeholder="'+esc(tr('请输入备注'))+'"></div>';
    html+='<div class="flex gap-3" style="height:460px">';
    html+='<div class="w-32 flex-shrink-0 border border-surface-200 rounded-lg bg-white p-3 flex flex-col gap-3">';
    html+='<div class="text-sm font-semibold text-text-primary">'+tr('流程节点')+'</div>';
    html+='<div class="h-9 flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 text-sm cursor-grab">'+tr('开始')+'</div>';
    html+='<div class="h-9 flex items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-600 text-sm cursor-grab">'+tr('待办节点')+'</div>';
    html+='<div class="h-9 flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 text-sm cursor-grab">'+tr('消息节点')+'</div>';
    html+='<div class="flex gap-2 mt-1"><button type="button" onclick="showToast(\''+esc(tr('请先选中节点'))+'\')" class="flex-1 h-8 text-xs text-white bg-red-500 rounded hover:bg-red-600 cursor-pointer">'+tr('删除选中')+'</button><button type="button" onclick="showToast(\''+esc(tr('流程已导出'))+'\')" class="h-8 px-3 text-xs text-white bg-amber-500 rounded hover:bg-amber-600 cursor-pointer">'+tr('导出')+'</button></div>';
    html+='</div>';
    html+='<div class="flex-1 border border-surface-200 rounded-lg relative overflow-hidden" style="background-color:#fff;background-image:linear-gradient(#eef2f7 1px,transparent 1px),linear-gradient(90deg,#eef2f7 1px,transparent 1px);background-size:22px 22px">';
    html+='<svg class="absolute inset-0 w-full h-full pointer-events-none"><defs><marker id="mf-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#94a3b8" stroke-width="1.2"/></marker></defs><path d="M224,98 L224,150 L198,150 L198,196" fill="none" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#mf-arrow)"/></svg>';
    html+='<div class="absolute" style="left:180px;top:60px"><div class="px-6 py-2 rounded-full border border-blue-300 bg-blue-50 text-blue-600 text-sm shadow-sm">'+tr('开始')+'</div></div>';
    html+='<div class="absolute" style="left:150px;top:196px"><div class="px-6 py-2 rounded border border-blue-300 bg-white text-text-primary text-sm shadow-sm">'+tr('待办节点')+'</div></div>';
    html+='<div class="absolute" style="left:320px;top:196px"><div class="px-6 py-2 rounded border border-blue-300 bg-white text-text-primary text-sm shadow-sm">'+tr('消息节点')+'</div></div>';
    html+='</div>';
    html+='<div class="w-52 flex-shrink-0 border border-surface-200 rounded-lg bg-white p-3">';
    html+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('节点/连接线信息')+'</div>';
    html+='<div class="text-xs text-text-muted leading-relaxed">'+tr('点击画布中的节点或连接线以查看信息')+'</div>';
    html+='</div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    const toast=isEdit?tr('保存成功'):tr('新增成功');
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+toast+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+(isEdit?tr('保存修改'):tr('确认提交'))+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function toggleMsgFlowTypeMenu(){
    const m=document.getElementById('msgflow-type-menu');
    if(m)m.classList.toggle('hidden');
}

function pickMsgFlowType(cat,val){
    const inp=document.getElementById('msgflow-type-input');
    if(inp)inp.value=cat+' / '+val;
    const m=document.getElementById('msgflow-type-menu');
    if(m)m.classList.add('hidden');
}

function openApprovalFlowModal(mode,id,rowIdx,rowData){
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='78%';
    const isEdit=mode==='edit';
    const name=rowData?rowData[1]:'';
    const status=rowData?(rowData[6]||'启用'):'启用';
    const remark=rowData?rowData[7]:'';
    const auditType=rowData?rowData[5]:'';
    const auditTypes=['应收异动申请','财务预付款申请','客户开户','创建快递单申请','合并计费申请','客户理赔申请','服务商理赔申请'];
    titleEl.textContent=isEdit?tr('编辑'):tr('新增');
    const inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    let html='';
    html+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-4">';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('流程名称')+'</label><input type="text" required class="'+inputCls+'" value="'+esc(name)+'" placeholder="'+esc(tr('请输入流程名称'))+'"></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('审核类型')+'</label><select class="'+inputCls+'"><option value="">'+tr('请选择审核类型')+'</option>'+auditTypes.map(function(o){return '<option'+(auditType===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('启用状态')+'</label><select class="'+inputCls+'">'+['启用','禁用'].map(function(o){return '<option'+(status===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    html+='</div>';
    html+='<div class="mb-4"><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('备注')+'</label><input type="text" class="'+inputCls+'" value="'+esc(remark)+'" placeholder="'+esc(tr('请输入备注'))+'"></div>';
    html+='<div class="flex gap-3" style="height:460px">';
    html+='<div class="w-32 flex-shrink-0 border border-surface-200 rounded-lg bg-white p-3 flex flex-col gap-3">';
    html+='<div class="text-sm font-semibold text-text-primary">'+tr('流程节点')+'</div>';
    html+='<div class="h-9 flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 text-sm cursor-grab">'+tr('开始')+'</div>';
    html+='<div class="h-9 flex items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-600 text-sm cursor-grab">'+tr('审批节点')+'</div>';
    html+='<div class="h-9 flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 text-sm cursor-grab">'+tr('抄送节点')+'</div>';
    html+='<div class="flex gap-2 mt-1"><button type="button" onclick="showToast(\''+esc(tr('请先选中节点'))+'\')" class="flex-1 h-8 text-xs text-white bg-red-500 rounded hover:bg-red-600 cursor-pointer">'+tr('删除选中')+'</button><button type="button" onclick="showToast(\''+esc(tr('流程已导出'))+'\')" class="h-8 px-3 text-xs text-white bg-amber-500 rounded hover:bg-amber-600 cursor-pointer">'+tr('导出')+'</button></div>';
    html+='</div>';
    html+='<div class="flex-1 border border-surface-200 rounded-lg relative overflow-hidden" style="background-color:#fff;background-image:linear-gradient(#eef2f7 1px,transparent 1px),linear-gradient(90deg,#eef2f7 1px,transparent 1px);background-size:22px 22px">';
    html+='<svg class="absolute inset-0 w-full h-full pointer-events-none"><defs><marker id="af-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#94a3b8" stroke-width="1.2"/></marker></defs><path d="M224,98 L224,150 L198,150 L198,196" fill="none" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#af-arrow)"/></svg>';
    html+='<div class="absolute" style="left:180px;top:60px"><div class="px-6 py-2 rounded-full border border-blue-300 bg-blue-50 text-blue-600 text-sm shadow-sm">'+tr('开始')+'</div></div>';
    html+='<div class="absolute" style="left:150px;top:196px"><div class="px-6 py-2 rounded border-2 border-dashed border-amber-400 bg-white text-text-primary text-sm shadow-sm">'+tr('审批节点')+'</div></div>';
    html+='<div class="absolute" style="left:320px;top:196px"><div class="px-6 py-2 rounded border border-blue-300 bg-white text-text-primary text-sm shadow-sm">'+tr('抄送节点')+'</div></div>';
    html+='</div>';
    html+='<div class="w-56 flex-shrink-0 border border-surface-200 rounded-lg bg-white p-3">';
    html+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('节点/连接线信息')+'</div>';
    html+='<div class="mb-3"><label class="text-xs text-text-secondary mb-1 block">'+tr('节点名称')+'</label><input type="text" value="'+esc(tr('审批节点'))+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"></div>';
    html+='<div class="flex items-center gap-4 border-b border-surface-200 mb-3 text-sm">';
    html+='<button type="button" data-am-tab="assign" onclick="switchApprovalMemberTab(this)" class="pb-2 -mb-px border-b-2 border-primary-500 text-primary-600 font-medium cursor-pointer">'+tr('指定成员')+'</button>';
    html+='<button type="button" data-am-tab="relative" onclick="switchApprovalMemberTab(this)" class="pb-2 -mb-px border-b-2 border-transparent text-text-secondary hover:text-primary-600 cursor-pointer">'+tr('相对成员')+'</button>';
    html+='</div>';
    html+='<input type="text" readonly onclick="showToast(\''+esc(tr('请选择员工'))+'\')" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 cursor-pointer mb-3" placeholder="'+esc(tr('点击选择员工'))+'">';
    html+='<div class="flex gap-2"><button type="button" onclick="showToast(\''+esc(tr('已重置'))+'\')" class="h-8 px-4 text-xs text-text-secondary border border-surface-200 rounded hover:bg-surface-50 cursor-pointer">'+tr('重置')+'</button><button type="button" onclick="showToast(\''+esc(tr('保存成功'))+'\')" class="h-8 px-4 text-xs text-white bg-amber-500 rounded hover:bg-amber-600 cursor-pointer">'+tr('保存数据')+'</button></div>';
    html+='</div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    const toast=isEdit?tr('保存成功'):tr('新增成功');
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+toast+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+(isEdit?tr('保存修改'):tr('确认提交'))+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function switchApprovalMemberTab(btn){
    const wrap=btn.parentElement;
    wrap.querySelectorAll('[data-am-tab]').forEach(function(b){
        const on=b===btn;
        b.className=(on?'pb-2 -mb-px border-b-2 border-primary-500 text-primary-600 font-medium':'pb-2 -mb-px border-b-2 border-transparent text-text-secondary hover:text-primary-600')+' cursor-pointer';
    });
}

function bankVoucherAction(kind,id){
    id=id||'fin-bank-voucher';
    const idx=getSelectedRowIndex();
    if(idx<0){showToast(tr('请先勾选数据'));return;}
    const row=(_listData[id]&&_listData[id][idx])?_listData[id][idx]:(TC[id]&&TC[id].d?TC[id].d[idx]:null);
    if(kind==='detail'){ openBankVoucherDetailModal(id,idx,row); return; }
    if(kind==='claim'){ openVoucherClaimModal(row); return; }
    if(kind==='rate'){ openVoucherRateModal(row,id); return; }
    if(kind==='remark'){ openVoucherRemarkModal(row,id); return; }
    if(kind==='unclaim'){ openConfirmTip(tr('确定撤销认领吗?'),function(){showToast(tr('已撤销认领'));}); return; }
    if(kind==='void'){ openConfirmTip(tr('确定作废选中凭证吗?'),function(){showToast(tr('凭证已作废'));}); return; }
    showToast(tr('操作成功'));
}

function voucherClaimTargetHtml(type){
    const custOpts=['HYDXX | HYDXX','深圳市腾讯 | TX001','上海云图供应链管理有限公司 | C0003','幻想直客客户 | C0009','蓝色有限 | LSYX1','天地直客 | TDKH1','咖美智慧公司 | KMKH1','莆城电商公司 | MKKH1'];
    const provOpts=['梦幻装柜服务商01 | MHZG1','邮乐服务商02 | XC002','报关服务商01 | BG001'];
    const opts=type==='服务商'?provOpts:custOpts;
    const label=type==='服务商'?'服务商':'客户';
    let h='<label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr(label)+'</label>';
    h+='<input list="voucher-claim-list" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" placeholder="'+esc(tr('请选择或输入筛选'))+'">';
    h+='<datalist id="voucher-claim-list">'+opts.map(function(o){return '<option value="'+esc(o)+'"></option>';}).join('')+'</datalist>';
    return h;
}

function updateVoucherClaimTarget(){
    const sel=document.getElementById('voucher-claim-type');
    const wrap=document.getElementById('voucher-claim-target-wrap');
    if(sel&&wrap)wrap.innerHTML=voucherClaimTargetHtml(sel.value);
}

function openVoucherClaimModal(row){
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='48%';
    titleEl.textContent=tr('凭证认领');
    let html='<div class="space-y-4">';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('认领类型')+'</label><select id="voucher-claim-type" onchange="updateVoucherClaimTarget()" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"><option value="客户">'+tr('客户')+'</option><option value="服务商">'+tr('服务商')+'</option></select></div>';
    html+='<div id="voucher-claim-target-wrap">'+voucherClaimTargetHtml('客户')+'</div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button><button onclick="closeCrudModal();showToast(\''+tr('认领成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确定')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* 分公司名称列表（组织架构 perm-branch） */
function getBranchNameOptions(){
    var c=TC['perm-branch']||{};
    var h=c.h||[];var i=h.indexOf('分公司名称');
    var out=[];
    (c.d||[]).forEach(function(r){var v=i>=0?r[i]:'';if(v&&out.indexOf(v)<0)out.push(v);});
    return out.length?out:['深圳总部业务客服部','广州业务分部','武汉分部','义乌分部','宁波分部'];
}
/* 认领类型 -> 可选对象（客户 / 服务商），用于凭证认领联动 */
function getVoucherClaimOptions(claimType){
    var out=[];
    if(claimType==='服务商'){
        var p=TC['base-provider']||{};
        var ph=p.h||[];var pi=ph.indexOf('服务商全称');
        if(pi<0)pi=ph.indexOf('服务商名称');
        (p.d||[]).forEach(function(r){var v=pi>=0?r[pi]:'';if(v&&out.indexOf(v)<0)out.push(v);});
        if(!out.length)out=['上海某某报关有限公司','中远海运集运','马士基航运'];
    }else{
        var c=TC['crm-cust']||{};
        var ch=c.h||[];var ci=ch.indexOf('客户全称');
        if(ci<0)ci=ch.indexOf('客户简称');
        (c.d||[]).forEach(function(r){var v=ci>=0?r[ci]:'';if(v&&out.indexOf(v)<0)out.push(v);});
        if(!out.length)out=['深圳市华运达国际货运代理有限公司','广州远洋进出口贸易有限公司'];
    }
    return out;
}
/* 认领类型切换：重新加载「认领对象」下拉 */
function onVoucherClaimTypeChange(sel){
    var wrap=document.getElementById('voucher-claim-target-wrap');
    if(!wrap)return;
    var type=sel&&sel.value?sel.value:'客户';
    var opts=getVoucherClaimOptions(type);
    var lblTxt=(type==='服务商')?'服务商':'客户';
    var inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    var h='<label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr(lblTxt)+'</label>';
    h+='<select id="voucher-claim-target" class="'+inputCls+'"><option value="">'+tr('请选择')+tr(lblTxt)+'</option>';
    opts.forEach(function(o){h+='<option>'+esc(o)+'</option>';});
    h+='</select>';
    wrap.innerHTML=h;
}

/* 凭证列按表头名取值（银行凭证含「本位币」列，收款管理不含，列序不同） */
function voucherVal(id,row,name){
    var h=(TC[id]&&TC[id].h)||[];
    var i=h.indexOf(name);
    return (i>=0&&row)?(row[i]==null?'':String(row[i])):'';
}
var VOUCHER_BASE_CURRENCIES=['人民币','美元','欧元','港币'];
function voucherBaseCurSelect(val,cls){
    return '<select class="'+(cls||'w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50')+'">'+VOUCHER_BASE_CURRENCIES.map(function(o){return '<option'+((val||'人民币')===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>';
}
/* 修改汇率：本位币金额 = 原币金额 × 新汇率 */
function voucherRateCalc(){
    var a=document.getElementById('vr-src-amt'),r=document.getElementById('vr-rate'),o=document.getElementById('vr-base-amt');
    if(!o)return;
    var amt=parseFloat(String((a&&a.value)||'0').replace(/,/g,''))||0;
    var rate=parseFloat((r&&r.value)||'0')||0;
    o.value=(amt*rate).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function openVoucherRateModal(row,id){
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='48%';
    id=id||'fin-bank-voucher';
    const rate=voucherVal(id,row,'汇率')||'1.0000';
    const srcCur=voucherVal(id,row,'币别')||'人民币';
    const baseCur=voucherVal(id,row,'本位币')||'人民币';
    const srcAmt=voucherVal(id,row,'总金额(原币)')||'0';
    titleEl.textContent=tr('修改汇率');
    const roCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary';
    const inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    let rh='<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    rh+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('原币别')+'</label><input type="text" readonly value="'+esc(srcCur)+'" class="'+roCls+'"></div>';
    rh+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('原币金额')+'</label><input id="vr-src-amt" type="text" readonly value="'+esc(srcAmt)+'" class="'+roCls+'"></div>';
    rh+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('本位币币别')+'</label><select id="vr-base-cur" class="'+inCls+'">'+VOUCHER_BASE_CURRENCIES.map(function(o){return '<option'+(baseCur===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    rh+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('新汇率')+'</label><input id="vr-rate" type="number" step="0.0001" min="0" required oninput="voucherRateCalc()" class="'+inCls+'" value="'+esc(rate)+'"></div>';
    rh+='<div class="md:col-span-2"><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('本位币金额')+'（'+tr('自动计算')+'）</label><input id="vr-base-amt" type="text" readonly class="'+roCls+'"></div>';
    rh+='</div><div class="mt-2 text-[11px] text-text-muted">'+tr('本位币金额 = 原币金额 × 新汇率；汇率为「原币别 → 本位币」的折算比率。')+'</div>';
    bodyEl.innerHTML=rh;
    voucherRateCalc();
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button><button onclick="closeCrudModal();showToast(\''+tr('汇率已修改')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确定')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openVoucherRemarkModal(row,id){
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='48%';
    const remark=voucherVal(id||'fin-bank-voucher',row,'财务备注');
    titleEl.textContent=tr('修改财务备注');
    bodyEl.innerHTML='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('财务备注')+'</label><textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入财务备注'))+'">'+esc(remark)+'</textarea></div>';
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button><button onclick="closeCrudModal();showToast(\''+tr('财务备注已修改')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确定')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openBankVoucherModal(mode,id,rowIdx,rowData){
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='76%';
    const isEdit=mode==='edit';
    /* 按表头名取值：银行凭证含「本位币」列，列序与收款管理不同 */
    const g=function(name){return voucherVal(id,rowData,name);};
    const dc=g('凭证借贷标识')||'收入';
    const settle=g('交割方式'),claimType=g('认领账户类型'),amount=g('总金额(原币)');
    const currency=g('币别')||'人民币';
    const rate=g('汇率')||'1.0000';
    const baseCur=g('本位币')||'人民币';
    const serial=g('交易流水号'),ourAcct=g('我方账户'),oppName=g('对方账号名称'),oppBank=g('对方开户行'),oppAcct=g('对方账户'),summary=g('财务摘要'),remark=g('财务备注');
    const bankAccts=(TC['fin-bank-account']&&TC['fin-bank-account'].d?TC['fin-bank-account'].d.map(function(r){return r[0];}):[]);
    const bankAcctLabels={};
    if(TC['fin-bank-account']&&TC['fin-bank-account'].d){TC['fin-bank-account'].d.forEach(function(r){bankAcctLabels[r[0]]=r[0]+' '+r[1];});}
    titleEl.textContent=isEdit?tr('编辑'):tr('新增');
    const inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    const taCls='w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y';
    function lbl(t,req){return '<label class="text-sm font-medium text-text-secondary mb-1.5 block">'+(req?'<span class="text-red-500">*</span> ':'')+tr(t)+'</label>';}
    function selHtml(opts,val,ph){var s='<select class="'+inputCls+'">'+(ph?'<option value="">'+tr(ph)+'</option>':'');opts.forEach(function(o){s+='<option'+(val===o?' selected':'')+'>'+esc(o)+'</option>';});return s+'</select>';}
    let html='';
    html+='<div class="mb-3 flex items-center gap-2"><span class="w-1 h-4 bg-primary-500 rounded"></span><span class="text-sm font-semibold text-text-primary">'+tr('基本信息')+'</span></div>';
    html+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">';
    html+='<div>'+lbl('借贷标识',false)+'<div class="h-10 flex items-center gap-6 text-sm text-text-secondary"><label class="inline-flex items-center gap-2 cursor-pointer"><input type="radio" name="voucher-dc" value="支出"'+(dc==='支出'?' checked':'')+'><span>'+tr('支出')+'</span></label><label class="inline-flex items-center gap-2 cursor-pointer"><input type="radio" name="voucher-dc" value="收入"'+(dc!=='支出'?' checked':'')+'><span>'+tr('收入')+'</span></label></div></div>';
    html+='<div>'+lbl('交割方式',true)+selHtml(['现金','微信','支付宝','银行'],settle,'请选择')+'</div>';
    /* 认领类型 -> 联动加载对应的「客户 / 服务商」选择框 */
    var claimTypeVal=claimType||'客户';
    var claimTargetVal=g('认领账户名称');
    var claimTargetLabel=(claimTypeVal==='服务商')?'服务商':'客户';
    var claimTargetHtml='<label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr(claimTargetLabel)+'</label>'+
        '<select id="voucher-claim-target" class="'+inputCls+'"><option value="">'+tr('请选择')+tr(claimTargetLabel)+'</option>'+
        getVoucherClaimOptions(claimTypeVal).map(function(o){return '<option'+(claimTargetVal===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>';
    {
        html+='<div>'+lbl('认领类型',false)+'<select id="voucher-claim-type" onchange="onVoucherClaimTypeChange(this)" class="'+inputCls+'">'+['客户','服务商'].map(function(o){return '<option'+(claimTypeVal===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
        html+='<div id="voucher-claim-target-wrap">'+claimTargetHtml+'</div>';
    }
    html+='<div>'+lbl('凭证金额',true)+'<input type="number" required class="'+inputCls+'" value="'+esc(amount)+'" placeholder="'+esc(tr('请输入凭证金额'))+'"></div>';
    html+='<div>'+lbl('金额大写',false)+'<input type="text" readonly class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" placeholder="'+esc(tr('自动生成'))+'"></div>';
    html+='<div>'+lbl('币别',true)+selHtml(['人民币','美元','欧元'],currency)+'</div>';
    html+='<div>'+lbl('汇率',true)+'<input type="text" required class="'+inputCls+'" value="'+esc(rate)+'"></div>';
    html+='<div>'+lbl('本位币',true)+voucherBaseCurSelect(baseCur,inputCls)+'</div>';
    html+='<div>'+lbl('交易流水号',false)+'<input type="text" class="'+inputCls+'" value="'+esc(serial)+'" placeholder="'+esc(tr('请输入交易流水号'))+'"></div>';
    html+='<div>'+lbl('交易时间',true)+'<input type="datetime-local" class="'+inputCls+'" value="2026-07-20T14:36"></div>';
    html+='<div>'+lbl('我方银行账户',true)+'<select class="'+inputCls+'"><option value="">'+tr('请选择')+'</option>'+bankAccts.map(function(a){return '<option value="'+esc(a)+'"'+(ourAcct===a?' selected':'')+'>'+esc(bankAcctLabels[a]||a)+'</option>';}).join('')+'</select></div>';
    html+='<div>'+lbl('对方账户户名',false)+'<input type="text" class="'+inputCls+'" value="'+esc(oppName)+'" placeholder="'+esc(tr('请输入对方账户户名'))+'"></div>';
    html+='<div>'+lbl('对方账户开户行',false)+'<input type="text" class="'+inputCls+'" value="'+esc(oppBank)+'" placeholder="'+esc(tr('请输入对方账户开户行'))+'"></div>';
    html+='<div>'+lbl('对方账户号码',false)+'<input type="text" class="'+inputCls+'" value="'+esc(oppAcct)+'" placeholder="'+esc(tr('请输入对方账户号码'))+'"></div>';
    html+='<div>'+lbl('财务摘要',false)+'<textarea rows="2" class="'+taCls+'" placeholder="'+esc(tr('请输入财务摘要'))+'">'+esc(summary)+'</textarea></div>';
    html+='<div>'+lbl('财务备注',false)+'<textarea rows="2" class="'+taCls+'" placeholder="'+esc(tr('请输入财务备注'))+'">'+esc(remark)+'</textarea></div>';
    html+='</div>';
    html+='<div class="mt-6 mb-3 flex items-center gap-2"><span class="w-1 h-4 bg-primary-500 rounded"></span><span class="text-sm font-semibold text-text-primary">'+tr('附件信息')+'</span></div>';
    html+='<div class="flex items-center gap-3 mb-3"><label class="text-sm text-text-secondary whitespace-nowrap">'+tr('请选择附件类型')+'</label><select class="h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 w-48">'+['凭证水单','合同','发票','其他'].map(function(o){return '<option'+(o==='凭证水单'?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    html+='<div class="border-2 border-dashed border-surface-200 rounded-lg py-8 text-center bg-surface-50/50">';
    html+='<svg class="w-8 h-8 mx-auto text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>';
    html+='<div class="text-sm text-text-secondary">'+tr('点击或者拖动文件到该区域来上传')+'</div>';
    html+='<div class="text-xs text-text-muted mt-1">'+tr('请上传 大小不超过 25MB 格式为 doc/xls/xlsx/txt/pdf/zip/rar/jpg/jpeg/png/gif/bmp 的文件 最多上传10个附件')+'</div>';
    html+='</div>';
    html+='<div class="mt-3 border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['序号','文件名称','文件类型','缩略图','文件大小(kb)','上传人','上传时间','操作'].forEach(function(c){html+='<th class="px-3 py-3 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    html+='</tr></thead><tbody><tr><td colspan="8" class="py-8 text-center text-text-muted">'+tr('无数据')+'</td></tr></tbody></table></div>';
    bodyEl.innerHTML=html;
    const toast=isEdit?tr('保存成功'):tr('新增成功');
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+toast+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+(isEdit?tr('保存修改'):tr('确认提交'))+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openBankVoucherDetailModal(id,idx,rowData){
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='90%';
    /* 按表头名取值：银行凭证插入「本位币」列后列序与收款管理不同，避免写死下标 */
    const gv=function(name){return voucherVal(id,rowData,name);};
    const g=function(name){var v=gv(name);return v===''?'—':esc(v);};
    titleEl.textContent=tr('凭证详情');
    let ourBank='';
    if(TC['fin-bank-account']&&TC['fin-bank-account'].d){var m=TC['fin-bank-account'].d.find(function(r){return r[0]===gv('我方账户');});if(m)ourBank=m[3];}
    function card(title,color,rows){
        var cls={green:'bg-green-50 border-green-100',blue:'bg-blue-50 border-blue-100',yellow:'bg-amber-50 border-amber-100',red:'bg-red-50 border-red-100'}[color];
        var tcls={green:'text-green-700',blue:'text-blue-700',yellow:'text-amber-700',red:'text-red-700'}[color];
        var h='<div class="rounded-lg border '+cls+' p-4">';
        if(title)h+='<div class="text-sm font-semibold '+tcls+' mb-3">'+tr(title)+'</div>';
        rows.forEach(function(r){h+='<div class="flex items-start justify-between gap-3 text-sm py-1"><span class="text-text-secondary whitespace-nowrap">'+tr(r[0])+'</span><span class="font-medium text-text-primary text-right break-all">'+r[1]+'</span></div>';});
        return h+'</div>';
    }
    let html='<div class="mb-3 flex items-center gap-2"><span class="w-1 h-4 bg-primary-500 rounded"></span><span class="text-sm font-semibold text-text-primary">'+tr('凭证信息')+'</span></div>';
    html+='<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">';
    /* 银行凭证列表金额已改「本位币」口径；收款管理仍沿用人民币标签 */
    var baseCur=(((TC[id]&&TC[id].h)||[]).indexOf('总金额(本位币)')>=0)?'本位币':'人民币';
    var baseCurVal=gv('本位币')||'人民币';
    html+=card('','green',[['凭证编号',g('凭证编号')],['凭证借贷标识',g('凭证借贷标识')],['总金额(原币)',g('总金额(原币)')],['币别',g('币别')],['汇率',g('汇率')]]);
    /* 本位币显示在「总金额(本位币)」上方 */
    html+=card('','blue',[['认领账户类型',g('认领账户类型')],['认领账户名称',g('认领账户名称')],['本位币',esc(baseCurVal)],['总金额('+baseCur+')',g('总金额('+baseCur+')')],['已使用金额('+baseCur+')',g('已使用金额('+baseCur+')')],['未使用金额('+baseCur+')',g('未使用金额('+baseCur+')')]]);
    html+=card('我方账户信息','yellow',[['账户号码',g('我方账户')],['账户名称',g('我方账户名称')],['账户开户行',ourBank?esc(ourBank):'—'],['费用时间',g('费用时间')]]);
    html+=card('对方账户信息','red',[['账户号码',g('对方账户')],['账户名称',g('对方账号名称')],['账号开户行',g('对方开户行')],['交易流水号',g('交易流水号')]]);
    html+='</div>';
    html+='<div class="flex items-center gap-4 border-b border-surface-200 mb-3 text-sm">';
    html+='<button type="button" data-vd-tab="writeoff" onclick="switchVoucherDetailTab(this,\'writeoff\')" class="pb-2 -mb-px border-b-2 border-primary-500 text-primary-600 font-medium cursor-pointer">'+tr('核销明细')+'</button>';
    html+='<button type="button" data-vd-tab="attach" onclick="switchVoucherDetailTab(this,\'attach\')" class="pb-2 -mb-px border-b-2 border-transparent text-text-secondary hover:text-primary-600 cursor-pointer">'+tr('附件信息')+'</button>';
    html+='</div>';
    html+='<div id="vd-writeoff"><div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm" style="min-width:1000px"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['#','操作说明','费用编号/提现凭证','使用金额','剩余金额','核销时间','核销人','是否作废','核销明细'].forEach(function(c){html+='<th class="px-3 py-3 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    html+='</tr></thead><tbody>';
    var woRows=[['1','凭证提现','P2607150010TX','500','500','2026-07-15 13:55:51','天地总部管理员','否','凭证提现, 凭证剩余金额[1000.0], 本次提现金额[500.0]...'],['2','凭证提现','P2607150012TX','500','0','2026-07-15 13:58:10','天地总部管理员','否','凭证提现, 凭证剩余金额[500.0], 本次提现金额[500.0], ...']];
    woRows.forEach(function(r){html+='<tr class="border-t border-surface-100 hover:bg-primary-50/30">'+r.map(function(c,ci){return '<td class="px-3 py-3 whitespace-nowrap '+(ci===0?'text-text-muted':'text-text-secondary')+'">'+esc(c)+'</td>';}).join('')+'</tr>';});
    html+='</tbody></table></div></div>';
    html+='<div id="vd-attach" class="hidden"><div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['序号','文件名称','文件类型','缩略图','文件大小(kb)','上传人','上传时间','操作'].forEach(function(c){html+='<th class="px-3 py-3 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    html+='</tr></thead><tbody><tr><td colspan="8" class="py-8 text-center text-text-muted">'+tr('无数据')+'</td></tr></tbody></table></div></div>';
    bodyEl.innerHTML=html;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function switchVoucherDetailTab(btn,tab){
    btn.parentElement.querySelectorAll('[data-vd-tab]').forEach(function(b){
        const on=b===btn;
        b.className=(on?'pb-2 -mb-px border-b-2 border-primary-500 text-primary-600 font-medium':'pb-2 -mb-px border-b-2 border-transparent text-text-secondary hover:text-primary-600')+' cursor-pointer';
    });
    const wo=document.getElementById('vd-writeoff'),at=document.getElementById('vd-attach');
    if(wo)wo.classList.toggle('hidden',tab!=='writeoff');
    if(at)at.classList.toggle('hidden',tab!=='attach');
}

function openAccountModal(mode,id,rowIdx,rowData){
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    const isEdit=mode==='edit';
    const g=function(i){return rowData?(rowData[i]||''):'';};
    const code=g(0),name=g(1),nameEn=g(2),full=g(3);
    const dir=rowData?(rowData[4]||'借'):'借';
    const cat=rowData?(rowData[5]||'资产'):'资产';
    const level=rowData?(rowData[6]||'1'):'1';
    const leaf=rowData?(rowData[7]||'是'):'是';
    const currency=rowData?(rowData[8]||'ALL'):'ALL';
    const status=rowData?(rowData[9]||'启用'):'启用';
    const acctSet=rowData?(rowData[10]||'HOLLY TRANS-2020'):'HOLLY TRANS-2020';
    titleEl.textContent=isEdit?tr('编辑'):tr('新增');
    const inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    function lbl(t,req){return '<label class="text-sm font-medium text-text-secondary mb-1.5 block">'+(req?'<span class="text-red-500">*</span> ':'')+tr(t)+'</label>';}
    function txt(val,ph,req,ro){return '<input type="text"'+(req?' required':'')+(ro?' readonly':'')+' class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg '+(ro?'bg-surface-100 cursor-not-allowed':'bg-surface-50')+'" value="'+esc(val)+'" placeholder="'+esc(tr(ph))+'">';}
    function selHtml(opts,val){var s='<select class="'+inputCls+'">';opts.forEach(function(o){s+='<option'+(val===o?' selected':'')+'>'+esc(o)+'</option>';});return s+'</select>';}
    let html='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">';
    html+='<div>'+lbl('科目代码',true)+txt(code,'请输入科目代码',true,isEdit)+'</div>';
    html+='<div>'+lbl('科目名称',true)+txt(name,'请输入科目名称',true,false)+'</div>';
    html+='<div>'+lbl('科目名称(英文)',false)+txt(nameEn,'请输入科目名称(英文)',false,false)+'</div>';
    html+='<div>'+lbl('科目全称',false)+txt(full,'请输入科目全称',false,false)+'</div>';
    html+='<div>'+lbl('科目全称(英文)',false)+txt('','请输入科目全称(英文)',false,false)+'</div>';
    html+='<div>'+lbl('余额方向',true)+selHtml(['借','贷'],dir)+'</div>';
    html+='<div>'+lbl('类别',true)+selHtml(['资产','负债','权益','成本','损益'],cat)+'</div>';
    html+='<div>'+lbl('级次',false)+'<input type="number" class="'+inputCls+'" value="'+esc(level)+'"></div>';
    html+='<div>'+lbl('末级',false)+selHtml(['是','否'],leaf)+'</div>';
    html+='<div>'+lbl('币别',true)+selHtml(['ALL','RMB','USD','CFA','GHS','EUR'],currency)+'</div>';
    html+='<div>'+lbl('账套',true)+selHtml(['HOLLY TRANS-2020','SZX'],acctSet)+'</div>';
    html+='<div>'+lbl('状态',true)+selHtml(['启用','禁用'],status)+'</div>';
    html+='</div>';
    html+='<div class="mt-5 pt-4 border-t border-surface-200"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('核算属性')+'</div>';
    html+='<div class="flex flex-wrap gap-x-6 gap-y-2">';
    ['期末调汇','项目核算','部门核算','人员核算','往来单位核算','现金流量核算','日记账','银行账'].forEach(function(o){
        html+='<label class="inline-flex items-center gap-2 text-sm text-text-secondary cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600"><span>'+tr(o)+'</span></label>';
    });
    html+='</div></div>';
    bodyEl.innerHTML=html;
    const toast=isEdit?tr('保存成功'):tr('新增成功');
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+toast+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+(isEdit?tr('保存修改'):tr('确认提交'))+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openRateModal(mode,id,rowIdx,rowData){
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    const isEdit=mode==='edit';
    const g=function(i){return rowData?(rowData[i]||''):'';};
    const cur=rowData?(rowData[0]||'人民币'):'人民币';
    const base=rowData?(rowData[1]||'人民币'):'人民币';
    const rate=g(2),loss=g(3);
    const status=rowData?(rowData[4]||'启用'):'启用';
    const start=(g(5)||'').slice(0,10);
    const end=(g(6)||'').slice(0,10);
    const remark=g(7);
    titleEl.textContent=isEdit?tr('编辑'):tr('新增');
    const inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    function lbl(t,req){return '<label class="text-sm font-medium text-text-secondary mb-1.5 block">'+(req?'<span class="text-red-500">*</span> ':'')+tr(t)+'</label>';}
    function selHtml(opts,val){var s='<select class="'+inputCls+'">';opts.forEach(function(o){s+='<option'+(val===o?' selected':'')+'>'+esc(o)+'</option>';});return s+'</select>';}
    let html='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
    html+='<div>'+lbl('币别编号',true)+selHtml(['人民币','美元','欧元'],cur)+'</div>';
    html+='<div>'+lbl('本位币别',true)+selHtml(['人民币','美元','欧元'],base)+'</div>';
    html+='<div>'+lbl('汇率',true)+'<input type="number" step="0.0001" required class="'+inputCls+'" value="'+esc(rate)+'" placeholder="'+esc(tr('请输入汇率'))+'"></div>';
    html+='<div>'+lbl('汇损',false)+'<input type="number" step="0.0001" class="'+inputCls+'" value="'+esc(loss)+'" placeholder="'+esc(tr('请输入汇损'))+'"></div>';
    html+='<div>'+lbl('生效开始时间',false)+'<input type="date" class="'+inputCls+'" value="'+esc(start)+'"></div>';
    html+='<div>'+lbl('生效结束时间',false)+'<input type="date" class="'+inputCls+'" value="'+esc(end)+'"></div>';
    html+='<div>'+lbl('状态',true)+selHtml(['启用','禁用'],status)+'</div>';
    html+='<div class="md:col-span-2">'+lbl('备注',false)+'<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入备注'))+'">'+esc(remark)+'</textarea></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    const toast=isEdit?tr('保存成功'):tr('新增成功');
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+toast+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+(isEdit?tr('保存修改'):tr('确认提交'))+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openBankAccountModal(mode,id,rowIdx,rowData){
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='64%';
    const isEdit=mode==='edit';
    /* 按表头名取值：已插入「使用网点」列，列序会变，不能写死下标 */
    const g=function(n,dft){
        var h=(TC[id]&&TC[id].h)||[];var k=h.indexOf(n);
        var v=(k>=0&&rowData)?(rowData[k]==null?'':String(rowData[k])):'';
        return v===''?(dft||''):v;
    };
    const acctNo=g('账户号码'),name=g('账户名称'),nameEn=g('账户名称(英文)'),bank=g('开户银行'),bankEn=g('开户银行(英文)');
    const currency=g('币别','人民币');
    const branch=g('分行支行'),holder=g('开户人名');
    const sites=g('使用网点');
    const balance=g('账户余额','0');
    const status=g('启用状态','启用');
    const remark=g('备注');
    const currencies=['人民币','美元','欧元'];
    titleEl.textContent=isEdit?tr('编辑'):tr('新增');
    const inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    function lbl(t,req){return '<label class="text-sm font-medium text-text-secondary mb-1.5 block">'+(req?'<span class="text-red-500">*</span> ':'')+tr(t)+'</label>';}
    function txt(val,ph,req){return '<input type="text"'+(req?' required':'')+' class="'+inputCls+'" value="'+esc(val)+'" placeholder="'+esc(tr(ph))+'">';}
    function selHtml(opts,val){var s='<select class="'+inputCls+'">';opts.forEach(function(o){s+='<option'+(val===o?' selected':'')+'>'+esc(o)+'</option>';});return s+'</select>';}
    let html='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
    html+='<div>'+lbl('账户号码',true)+txt(acctNo,'请输入账户号码',true)+'</div>';
    html+='<div>'+lbl('账户名称',true)+txt(name,'请输入账户名称',true)+'</div>';
    html+='<div>'+lbl('账户名称(英文)',false)+txt(nameEn,'请输入账户名称(英文)',false)+'</div>';
    html+='<div>'+lbl('开户银行',true)+txt(bank,'请输入开户银行',true)+'</div>';
    html+='<div>'+lbl('开户银行(英文)',false)+txt(bankEn,'请输入开户银行(英文)',false)+'</div>';
    html+='<div>'+lbl('币别',true)+selHtml(currencies,currency)+'</div>';
    html+='<div>'+lbl('分行支行',false)+txt(branch,'请输入分行支行',false)+'</div>';
    html+='<div>'+lbl('开户人名',false)+txt(holder,'请输入开户人名',false)+'</div>';
    /* 使用网点：加载分公司数据，可多选 */
    html+='<div>'+checkedDropdownFieldHtml('使用网点',getBranchNameOptions(),sites)+'</div>';
    html+='<div>'+lbl('账户余额',false)+'<input type="number" class="'+inputCls+'" value="'+esc(balance)+'"></div>';
    html+='<div>'+lbl('启用状态',true)+selHtml(['启用','禁用'],status)+'</div>';
    html+='<div class="md:col-span-2">'+lbl('备注',false)+'<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入备注'))+'">'+esc(remark)+'</textarea></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    const toast=isEdit?tr('保存成功'):tr('新增成功');
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+toast+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+(isEdit?tr('保存修改'):tr('确认提交'))+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

