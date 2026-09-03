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

/* 认领 / 修改：仅「待认领」状态的凭证可操作，已认领(待抵扣及以后)与作废凭证一律拦截 */
var VOUCHER_CLAIMABLE_STATUS='待认领';
function voucherRowClaimable(id,row){
    return !!row&&voucherVal(id,row,'凭证状态')===VOUCHER_CLAIMABLE_STATUS;
}
/* ===== 银行凭证 · 导入 =====
 * 弹窗两块：模板信息（下载模板 + 上传 + 校验提示）、导入数据（校验结果列表）。
 * 「导入数据」的列不写死，直接取查询列表 TC['fin-bank-voucher'].h，
 * 再去掉系统生成/导入后才产生的列（见 VOUCHER_IMPORT_EXCLUDE 与审计列），
 * 末尾加一列「校验结果」——上传后每行是否通过校验就展示在这里。 */
var VOUCHER_IMPORT_REQUIRED=['认领账户类型','交割方式','金额(原币)','币别','汇率','我方账户','对方账户','交易流水号','费用时间'];
/* 这些列不该出现在导入模板里：凭证编号系统补号、凭证状态固定「待认领」、
 * 已用/未用金额由核销产生、数据来源固定「导入」、审计列由系统写入 */
var VOUCHER_IMPORT_EXCLUDE=['操作','凭证编号','凭证状态','已使用金额(本位币)','未使用金额(本位币)','数据来源'];
var _voucherImportRows=[];   /* [{cells:[...], ok:bool, msg:''}] */
var _voucherImportFile='';

function voucherImportColumns(id){
    const c=TC[id||'fin-bank-voucher']||{};
    return (c.h||[]).filter(function(h){
        if(VOUCHER_IMPORT_EXCLUDE.indexOf(h)>=0)return false;
        return !/^(创建|修改)(人|时间|网点)$/.test(h);   /* 创建人/修改人等审计信息 */
    });
}
function openBankVoucherImportModal(id){
    id=id||'fin-bank-voucher';
    _voucherImportRows=[];_voucherImportFile='';
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='70%';
    document.getElementById('crud-modal-title').textContent=tr('导入');
    document.getElementById('crud-modal-body').innerHTML=voucherImportBodyHtml(id);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmBankVoucherImport(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认导入')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function voucherImportSectionTitle(text){
    return '<div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
           '<span class="text-base font-semibold text-text-primary">'+tr(text)+'</span></div>';
}
function voucherImportBodyHtml(id){
    let h='<div class="space-y-5">';
    /* ① 模板信息 */
    h+='<section>'+voucherImportSectionTitle('模板信息');
    h+='<div class="rounded-lg border border-surface-200 bg-white p-4">';
    h+='<button type="button" onclick="downloadVoucherImportTemplate()" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer">'+tr('下载银行凭证导入模板')+'</button>';
    /* 上传控件与全站「附件」字段（crudAttachmentFieldHtml）保持同一套样式 */
    h+='<div class="mt-3 w-full border border-dashed border-surface-300 rounded-lg bg-surface-50 px-3 py-2.5">';
    h+='<div class="flex items-center gap-2 flex-wrap">';
    h+='<label class="h-8 px-3 inline-flex items-center text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">';
    h+='<input type="file" accept=".xls,.xlsx" class="hidden" onchange="onVoucherImportPick(this,\''+id+'\')">'+esc(tr('选择文件'))+'</label>';
    h+='<span class="text-[11px] text-text-muted">'+esc(tr('仅支持 Excel（.xls / .xlsx），单个不超过 10MB'))+'</span>';
    h+='</div>';
    h+='<div data-voucher-import-file class="flex flex-wrap gap-1.5 mt-2'+(_voucherImportFile?'':' hidden')+'">'+
       (_voucherImportFile&&typeof crudAttachmentChipHtml==='function'?crudAttachmentChipHtml(_voucherImportFile):'')+'</div>';
    h+='</div>';
    h+='<div class="mt-3 text-xs text-red-500">'+tr('注意：模板上传后下方列表展示当前模板数据的校验信息')+'</div>';
    h+='</div></section>';
    /* ② 导入数据 */
    h+='<section>'+voucherImportSectionTitle('导入数据');
    h+='<div data-voucher-import-summary class="mb-2 text-xs text-text-secondary'+(_voucherImportRows.length?'':' hidden')+'"></div>';
    h+='<div data-voucher-import-table class="rounded-lg border border-surface-200 bg-white overflow-hidden">'+voucherImportTableHtml(id)+'</div>';
    h+='</section>';
    h+='</div>';
    return h;
}
function voucherImportTableHtml(id){
    const cols=voucherImportColumns(id);
    let h='<div class="overflow-auto" style="max-height:360px">';
    h+='<table class="w-full data-table" style="table-layout:auto;min-width:100%;border-collapse:separate;border-spacing:0"><thead><tr class="bg-white">';
    h+='<th class="px-3 py-2 text-xs font-medium text-text-secondary text-center whitespace-nowrap border-b border-surface-200">#</th>';
    h+='<th class="px-3 py-2 border-b border-surface-200"><input type="checkbox" class="rounded border-surface-300 text-primary-600" onchange="toggleAllVoucherImportRows(this)"></th>';
    cols.forEach(function(c){
        const req=VOUCHER_IMPORT_REQUIRED.indexOf(c)>=0;
        h+='<th class="px-3 py-2 text-xs font-medium whitespace-nowrap border-b border-surface-200 '+(req?'text-red-500':'text-text-secondary')+'">'+esc(tr(c))+'</th>';
    });
    h+='<th class="px-3 py-2 text-xs font-medium text-text-secondary whitespace-nowrap border-b border-surface-200">'+tr('校验结果')+'</th>';
    h+='</tr></thead><tbody>';
    if(!_voucherImportRows.length){
        h+='<tr><td colspan="'+(cols.length+3)+'" class="px-3 py-16 text-center text-sm text-text-muted">'+tr('请先上传模板文件')+'</td></tr>';
    }else{
        _voucherImportRows.forEach(function(r,i){
            h+='<tr class="border-b border-surface-100 '+(r.ok?'':'bg-red-50/50')+'">';
            h+='<td class="px-3 py-2 text-sm text-text-muted text-center">'+(i+1)+'</td>';
            h+='<td class="px-3 py-2"><input type="checkbox" class="voucher-import-check rounded border-surface-300 text-primary-600" value="'+i+'"'+(r.ok?' checked':'')+(r.ok?'':' disabled')+'></td>';
            cols.forEach(function(c,ci){
                h+='<td class="px-3 py-2 text-sm text-text-primary whitespace-nowrap">'+esc(r.cells[ci]||'')+'</td>';
            });
            h+='<td class="px-3 py-2 text-sm whitespace-nowrap '+(r.ok?'text-green-600':'text-red-600')+'">'+esc(r.ok?tr('校验通过'):r.msg)+'</td>';
            h+='</tr>';
        });
    }
    h+='</tbody></table></div>';
    return h;
}
function downloadVoucherImportTemplate(){
    showToast(tr('银行凭证导入模板下载中'));
}
function toggleAllVoucherImportRows(cb){
    document.querySelectorAll('.voucher-import-check:not([disabled])').forEach(function(x){x.checked=cb.checked;});
}
/* 上传：原型阶段不解析真实 Excel，按查询列表的列结构造几条示例数据跑通校验展示 */
function onVoucherImportPick(input,id){
    const f=(input.files||[])[0];
    if(!f)return;
    _voucherImportFile=f.name;
    _voucherImportRows=buildVoucherImportPreview(id);
    const body=document.getElementById('crud-modal-body');
    if(body)body.innerHTML=voucherImportBodyHtml(id);
    const okCount=_voucherImportRows.filter(function(r){return r.ok;}).length;
    const sum=document.querySelector('[data-voucher-import-summary]');
    if(sum){
        sum.classList.remove('hidden');
        sum.innerHTML=tr('已解析')+' <span class="font-semibold text-text-primary">'+_voucherImportRows.length+'</span> '+tr('条')+
            '，'+tr('校验通过')+' <span class="font-semibold text-green-600">'+okCount+'</span> '+tr('条')+
            '，'+tr('校验失败')+' <span class="font-semibold text-red-600">'+(_voucherImportRows.length-okCount)+'</span> '+tr('条')+
            '（'+esc(f.name)+'）';
    }
    showToast(tr('已解析')+' '+_voucherImportRows.length+' '+tr('条'));
}
/* 种子数据里有些必填列是空的，直接拿来当示例会满屏校验失败；
 * 这里给必填列兜底一个合理值，只在最后一行故意留空「币别」演示校验列。 */
var VOUCHER_IMPORT_DEMO={'认领账户类型':'客户','交割方式':'电汇','金额(原币)':'1000','币别':'人民币',
    '汇率':'1','我方账户':'4222827128731113','对方账户':'6222021001100000000','费用时间':'2026-09-03 10:00:00'};
function buildVoucherImportPreview(id){
    id=id||'fin-bank-voucher';
    const c=TC[id]||{};
    const cols=voucherImportColumns(id);
    const full=c.h||[];
    const src=(c.d||[]).slice(0,3);
    const idx=function(name){return cols.indexOf(name);};
    return src.map(function(row,i){
        /* 导入列是查询列表列的子集，取值要按「完整表头」的下标去种子行里拿 */
        const cells=cols.map(function(name){
            const k=full.indexOf(name);
            return (k>=0&&row[k]!=null)?String(row[k]):'';
        });
        if(idx('交易流水号')>=0)cells[idx('交易流水号')]='IMP'+(202609030001+i);
        VOUCHER_IMPORT_REQUIRED.forEach(function(name){
            const k=idx(name);
            if(k>=0&&!String(cells[k]||'').trim()&&VOUCHER_IMPORT_DEMO[name])cells[k]=VOUCHER_IMPORT_DEMO[name];
        });
        /* 最后一行故意缺一个必填项，演示校验结果列 */
        if(i===src.length-1&&idx('币别')>=0)cells[idx('币别')]='';
        const missing=VOUCHER_IMPORT_REQUIRED.filter(function(name){
            const k=idx(name);
            return k>=0&&!String(cells[k]||'').trim();
        });
        return {cells:cells,ok:missing.length===0,msg:missing.length?(tr('必填项为空')+'：'+missing.join('、')):''};
    });
}
function confirmBankVoucherImport(id){
    id=id||'fin-bank-voucher';
    if(!_voucherImportRows.length){showToast(tr('请先上传模板文件'));return;}
    const picked=[];
    document.querySelectorAll('.voucher-import-check:checked').forEach(function(x){picked.push(parseInt(x.value,10));});
    const rows=picked.map(function(i){return _voucherImportRows[i];}).filter(function(r){return r&&r.ok;});
    if(!rows.length){showToast(tr('没有可导入的数据，请先勾选校验通过的行'));return;}
    const c=TC[id]||{};
    const cols=voucherImportColumns(id);
    /* 列表引擎渲染时会往 c.h 里插入审计列（创建人/创建时间/… 插在「操作」之前），
     * 但不会给 c.d 的行补格子 —— 审计值是渲染时现算的。
     * 所以新行要按「种子行的宽度」来拼，跟其他行保持同样形状，多补 6 个空格子反而会串位。 */
    const seedWidth=(c.d&&c.d.length)?c.d[0].length:(c.h||[]).length-1;
    const full=(c.h||[]).slice(0,seedWidth);
    /* 必须写进 TC[id].d（种子）而不是 _listData：
     * generateListPage 每次渲染都会 _listData[id]=expandData(id) 从种子重新展开，
     * 只往 _listData 里 push 的话，刚导入的行下一次渲染就被冲掉了。 */
    let seq=(c.d||[]).length;
    rows.forEach(function(r){
        /* 导入列 -> 完整行：模板里没有的列由系统补 */
        const amount=String(r.cells[cols.indexOf('金额(本位币)')]||r.cells[cols.indexOf('金额(原币)')]||'');
        const row=full.map(function(name){
            const k=cols.indexOf(name);
            if(k>=0)return r.cells[k]||'';
            if(name==='凭证编号')return 'P'+(2609030000+(++seq));
            if(name==='凭证状态')return '待认领';
            if(name==='数据来源')return '导入';
            if(name==='已使用金额(本位币)')return '0';
            if(name==='未使用金额(本位币)')return amount;
            return '';
        });
        c.d.push(row);
    });
    delete _listData[id];   /* 让下次渲染重新展开，带上新导入的行 */
    closeCrudModal();
    const mc=document.getElementById('main-content');
    const pg=(typeof _listPage!=='undefined'&&_listPage[id])?_listPage[id]:1;
    const sf=(typeof _statusFilterVal!=='undefined')?(_statusFilterVal||''):'';
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,pg,sf);
    showToast(tr('导入成功')+' '+rows.length+' '+tr('条'));
}

function openSelectedVoucherEdit(id){
    const idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    const row=(_listData[id]&&_listData[id][idx])?_listData[id][idx]:(TC[id]&&TC[id].d?TC[id].d[idx]:null);
    if(!voucherRowClaimable(id,row)){showToast(tr('只能修改「待认领」状态的凭证'));return;}
    openCrudModal('edit',id,idx);
}
function bankVoucherAction(kind,id){
    id=id||'fin-bank-voucher';
    const idx=getSelectedRowIndex();
    if(idx<0){showToast(tr('请先勾选数据'));return;}
    const row=(_listData[id]&&_listData[id][idx])?_listData[id][idx]:(TC[id]&&TC[id].d?TC[id].d[idx]:null);
    if(kind==='detail'){ openBankVoucherDetailModal(id,idx,row); return; }
    if(kind==='claim'){
        if(!voucherRowClaimable(id,row)){showToast(tr('只能认领「待认领」状态的凭证'));return;}
        openVoucherClaimModal(row); return;
    }
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
    const srcAmt=voucherVal(id,row,'金额(原币)')||'0';
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

/* 新增/修改凭证：金额(本位币) = 凭证金额 × 汇率（只读自动计算） */
function voucherModalCalcBase(){
    var a=document.getElementById('bv-amount'),r=document.getElementById('bv-rate'),o=document.getElementById('bv-base-amount');
    if(!o)return;
    var amt=parseFloat(String((a&&a.value)||'').replace(/,/g,''));
    var rate=parseFloat(String((r&&r.value)||'').replace(/,/g,''));
    if(isNaN(amt)||isNaN(rate)){o.value='';return;}
    o.value=(amt*rate).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
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
    const settle=g('交割方式'),claimType=g('认领账户类型'),amount=g('金额(原币)');
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
    html+='<div>'+lbl('凭证金额',true)+'<input id="bv-amount" type="number" required oninput="voucherModalCalcBase()" class="'+inputCls+'" value="'+esc(amount)+'" placeholder="'+esc(tr('请输入凭证金额'))+'"></div>';
    html+='<div>'+lbl('金额大写',false)+'<input type="text" readonly class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" placeholder="'+esc(tr('自动生成'))+'"></div>';
    html+='<div>'+lbl('币别',true)+selHtml(['人民币','美元','欧元'],currency)+'</div>';
    html+='<div>'+lbl('汇率',true)+'<input id="bv-rate" type="text" required oninput="voucherModalCalcBase()" class="'+inputCls+'" value="'+esc(rate)+'"></div>';
    html+='<div>'+lbl('本位币',true)+voucherBaseCurSelect(baseCur,inputCls)+'</div>';
    /* 金额(本位币)：凭证金额 × 汇率，自动计算不可修改 */
    html+='<div>'+lbl('金额(本位币)',false)+'<input id="bv-base-amount" type="text" readonly class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary cursor-not-allowed" placeholder="'+esc(tr('自动计算'))+'"></div>';
    html+='<div>'+lbl('交易流水号',false)+'<input type="text" class="'+inputCls+'" value="'+esc(serial)+'" placeholder="'+esc(tr('请输入交易流水号'))+'"></div>';
    /* 费用时间：取行上的「费用时间」列，转成 datetime-local 需要的 yyyy-MM-ddTHH:mm */
    const feeTime=String(g('费用时间')||'').replace(' ','T').slice(0,16);
    html+='<div>'+lbl('费用时间',true)+'<input type="datetime-local" class="'+inputCls+'" value="'+esc(feeTime)+'"></div>';
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
    voucherModalCalcBase();   /* 打开时先按现有金额×汇率算一次 */
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
    var baseCur=(((TC[id]&&TC[id].h)||[]).indexOf('金额(本位币)')>=0)?'本位币':'人民币';
    var baseCurVal=gv('本位币')||'人民币';
    html+=card('','green',[['凭证编号',g('凭证编号')],['凭证状态',g('凭证状态')],['金额(原币)',g('金额(原币)')],['币别',g('币别')],['汇率',g('汇率')]]);
    /* 本位币显示在「金额(本位币)」上方 */
    html+=card('','blue',[['认领账户类型',g('认领账户类型')],['认领账户名称',g('认领账户名称')],['本位币',esc(baseCurVal)],['金额('+baseCur+')',g('金额('+baseCur+')')],['已使用金额('+baseCur+')',g('已使用金额('+baseCur+')')],['未使用金额('+baseCur+')',g('未使用金额('+baseCur+')')]]);
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

/* ================= 财务结算 · 客户账户 =================
 * 只读台账 + 两个批量操作：调整信用额度 / 调整超额锁定。
 * 不提供新增/编辑/删除（fin-cust-account 已加入 _rowNoEditIds，避免引擎自动追加「编辑数据」）。 */
addPrototypeTable('fin-cust-account','客户账户',
    '客户代码|客户名称|所属业务|所属客服|所属操作|所属公司|账户币别|余额|未核销金额|信用额度|超额是否锁定客户|操作',
    [],[
    ['C10001','深圳市华运达国际货运','张三','陈七','刘操作','深圳总部','CNY','128,500.00','36,800.00','200,000.00','否'],
    ['C10002','广州远洋进出口贸易','李四','周八','王操作','广州业务分部','USD','-12,400.00','48,600.00','50,000.00','是'],
    ['C10003','东莞市鑫海物流','王五','吴九','刘操作','深圳总部','CNY','86,200.00','12,000.00','150,000.00','否'],
    ['C10004','上海锦程国际贸易','赵六','陈七','李操作','义乌分部','USD','0.00','0.00','80,000.00','否'],
    ['C10005','佛山恒通货运代理','张三','周八','王操作','广州业务分部','CNY','-5,600.00','62,300.00','60,000.00','是'],
    ['C10006','星星玩具电商','李四','吴九','李操作','宁波分部','EUR','23,100.00','4,500.00','40,000.00','否']
],[
    {label:'客户代码',type:'text'},
    {label:'客户名称',type:'text'},
    {label:'所属业务',type:'select',options:['张三','李四','王五','赵六']},
    {label:'所属客服',type:'select',options:['陈七','周八','吴九']},
    {label:'所属公司',type:'select',options:['深圳总部','广州业务分部','义乌分部','宁波分部','武汉分部']},
    {label:'账户币别',type:'select',options:['CNY','USD','EUR','XOF','NGN']},
    {label:'超额是否锁定客户',type:'select',options:['是','否']}
]);
TC['fin-cust-account'].readonlyList=true;

function custAccountRows(id){
    var c=TC[id]||{};
    return (typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
}
function custAccountVal(id,row,label){
    var h=(TC[id]||{}).h||[],i=h.indexOf(label);
    return (i>=0&&row&&row[i]!=null)?String(row[i]):'';
}
/* 取勾选行；一条都没勾时提示并返回空数组 */
function custAccountPicked(id){
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要操作的客户账户'));return [];}
    var data=custAccountRows(id);
    return idxs.filter(function(i){return !!data[i];});
}
/* 勾选客户一览：条数 + 前几个客户，超出折叠 */
function custAccountPickedSummary(id,idxs){
    var data=custAccountRows(id);
    var names=idxs.map(function(i){return custAccountVal(id,data[i],'客户代码')+' '+custAccountVal(id,data[i],'客户名称');});
    var shown=names.slice(0,5).join('、')+(names.length>5?('… '+tr('等')+' '+names.length+' '+tr('个客户')):'');
    return '<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 mb-4 text-sm text-text-secondary">'+
        tr('已勾选')+'：<span class="font-medium text-text-primary">'+idxs.length+'</span> '+tr('个客户账户')+
        '<div class="mt-1 text-xs text-text-muted break-all">'+esc(shown)+'</div></div>';
}
function custAccountNum(v){
    var n=parseFloat(String(v||'').replace(/,/g,''));
    return isNaN(n)?0:n;
}
function custAccountFmt(n){
    return n.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function custAccountRefresh(id){
    var mc=document.getElementById('main-content');
    var pg=(typeof _listPage!=='undefined'&&_listPage[id])?_listPage[id]:1;
    var sf=(typeof _statusFilterVal!=='undefined')?(_statusFilterVal||''):'';
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,pg,sf);
}

/* ---- 调整信用额度（支持批量） ---- */
function openCustAccountCreditModal(id){
    id=id||'fin-cust-account';
    var idxs=custAccountPicked(id);
    if(!idxs.length)return;
    var data=custAccountRows(id);
    var curs=[];
    idxs.forEach(function(i){var v=custAccountVal(id,data[i],'账户币别');if(v&&curs.indexOf(v)<0)curs.push(v);});
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    var h=custAccountPickedSummary(id,idxs);
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500">*</span> '+tr('调整方式')+'</label>'+
       '<select id="cust-acct-credit-mode" class="'+inCls+'">'+selectOptionsHtml(['设置为','增加','减少'],'设置为')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500">*</span> '+tr('调整金额')+'</label>'+
       '<input type="number" min="0" step="0.01" id="cust-acct-credit-amount" class="'+inCls+'" placeholder="'+esc(tr('请输入金额'))+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('币别')+'</label>'+
       '<input type="text" id="cust-acct-credit-currency" class="'+inCls+' bg-surface-100 cursor-not-allowed" value="'+esc(curs.length>1?tr('多币别（按各账户原币别调整）'):(curs[0]||''))+'" readonly></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('生效时间')+'</label>'+
       '<input type="date" id="cust-acct-credit-date" class="'+inCls+'"></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500">*</span> '+tr('调整原因')+'</label>'+
       '<textarea id="cust-acct-credit-reason" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入调整原因'))+'"></textarea></div>';
    h+='</div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='52%';
    document.getElementById('crud-modal-title').textContent=tr('调整信用额度');
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitCustAccountCredit(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认调整')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function submitCustAccountCredit(id){
    var mode=(document.getElementById('cust-acct-credit-mode')||{}).value||'设置为';
    var amtEl=document.getElementById('cust-acct-credit-amount');
    var amt=parseFloat((amtEl&&amtEl.value)||'');
    if(isNaN(amt)){showToast(tr('请输入调整金额'));return;}
    var reasonEl=document.getElementById('cust-acct-credit-reason');
    if(!reasonEl||!String(reasonEl.value||'').trim()){showToast(tr('请填写调整原因'));return;}
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    var data=custAccountRows(id),h=(TC[id]||{}).h||[],iCredit=h.indexOf('信用额度');
    var n=0;
    idxs.forEach(function(i){
        var row=data[i];
        if(!row||iCredit<0)return;
        var cur=custAccountNum(row[iCredit]);
        var next=mode==='增加'?cur+amt:(mode==='减少'?cur-amt:amt);
        if(next<0)next=0;
        setRowOverride(id,row,iCredit,custAccountFmt(next));
        n++;
    });
    closeCrudModal();
    custAccountRefresh(id);
    showToast(tr('已调整')+' '+n+' '+tr('个客户的信用额度'));
}

/* ---- 调整超额锁定（支持批量） ---- */
function openCustAccountLockModal(id){
    id=id||'fin-cust-account';
    var idxs=custAccountPicked(id);
    if(!idxs.length)return;
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    var h=custAccountPickedSummary(id,idxs);
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500">*</span> '+tr('超额是否锁定客户')+'</label>'+
       '<select id="cust-acct-lock-value" class="'+inCls+'">'+selectOptionsHtml(['是','否'],'是')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('生效时间')+'</label>'+
       '<input type="date" id="cust-acct-lock-date" class="'+inCls+'"></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500">*</span> '+tr('调整原因')+'</label>'+
       '<textarea id="cust-acct-lock-reason" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入调整原因'))+'"></textarea></div>';
    h+='<div class="md:col-span-2 text-xs text-text-muted">'+tr('锁定后，该客户应收超过信用额度时将禁止继续下单，直至回款或调高额度。')+'</div>';
    h+='</div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='52%';
    document.getElementById('crud-modal-title').textContent=tr('调整超额锁定');
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitCustAccountLock(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认调整')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function submitCustAccountLock(id){
    var val=(document.getElementById('cust-acct-lock-value')||{}).value||'';
    if(!val){showToast(tr('请选择是否锁定'));return;}
    var reasonEl=document.getElementById('cust-acct-lock-reason');
    if(!reasonEl||!String(reasonEl.value||'').trim()){showToast(tr('请填写调整原因'));return;}
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    var data=custAccountRows(id),h=(TC[id]||{}).h||[],iLock=h.indexOf('超额是否锁定客户');
    var n=0;
    idxs.forEach(function(i){
        var row=data[i];
        if(!row||iLock<0)return;
        setRowOverride(id,row,iLock,val);
        n++;
    });
    closeCrudModal();
    custAccountRefresh(id);
    showToast(tr('已将')+' '+n+' '+tr('个客户的超额锁定设为')+'「'+val+'」');
}

function openBankAccountModal(mode,id,rowIdx,rowData){
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='64%';
    const isEdit=mode==='edit';
    /* 按表头名取值，避免后续增删列导致下标错位 */
    const g=function(n,dft){
        var h=(TC[id]&&TC[id].h)||[];var k=h.indexOf(n);
        var v=(k>=0&&rowData)?(rowData[k]==null?'':String(rowData[k])):'';
        return v===''?(dft||''):v;
    };
    const acctNo=g('账户号码'),name=g('账户名称'),nameEn=g('账户名称(英文)'),bank=g('开户银行'),bankEn=g('开户银行(英文)');
    const currency=g('币别','人民币');
    const branch=g('分行支行'),holder=g('开户人名');
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
    html+='<div>'+lbl('账户余额',false)+'<input type="number" class="'+inputCls+'" value="'+esc(balance)+'"></div>';
    html+='<div>'+lbl('启用状态',true)+selHtml(['启用','禁用'],status)+'</div>';
    html+='<div class="md:col-span-2">'+lbl('备注',false)+'<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入备注'))+'">'+esc(remark)+'</textarea></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    const toast=isEdit?tr('保存成功'):tr('新增成功');
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+toast+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+(isEdit?tr('保存修改'):tr('确认提交'))+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

