function renderTabContent(id){
    if(id.indexOf('waybill-detail-')===0)return generateWaybillDetailPage(id);
    if(id==='wh-no-pre-in')return generateHeadlessClaimListPage(id,_listPage[id]||1);
    const c=TC[id];
    if(c&&c.pageMode==='shipmentEntryAdmin')return generateAdminShipmentEntryPage(id);
    if(c&&c.pageMode==='shipmentEntryClient')return generateClientShipmentEntryPage(id);
    if(c&&c.pageMode==='shipmentEntry')return generateClientShipmentEntryPage(id);
    if(c&&c.pageMode==='warehouseInbound')return generateWarehouseInboundPage(id);
    if(c&&c.pageMode==='warehouseHeadlessInbound')return generateWarehouseHeadlessInboundPage(id);
    if(c&&c.pageMode==='warehousePda')return generateWarehousePdaPage(id);
    if(c&&c.pageMode==='fclTrialCalc')return generateFclTrialCalcPage(id);
    if(c&&c.pageMode==='fclGuide')return generateFclGuidePage(id);
    if(c&&c.pageMode==='noPreClaim')return generateHeadlessClaimListPage(id,_listPage[id]||1);
    if(c&&c.pageMode==='inquiryQuoteEntry')return generateInquiryQuoteEntryPage(id);
    if(c&&c.pageMode==='palletPrint')return generatePalletPrintPage(id);
    if(c&&c.pageMode==='expressInbound')return generateExpressInboundPage(id);
    if(c&&c.pageMode==='trackMaintain')return generateTrackMaintainPage(id);
    if(c&&c.pageMode==='trackQuery')return generateTrackQueryPage(id);
    if(c&&c.pageMode==='wsHome')return generateWorkspaceHome(id);
    if(c&&c.pageMode==='roleDashboard')return generateRoleDashboard(id);
    if(c&&c.pageMode==='arDetail')return generateArDetailPage(id);
    if(c&&c.pageMode==='arBill')return generateArBillPage(id);
    if(c&&c.pageMode==='receiptWriteoff')return generateReceiptPage(id);
    if(id==='cfg-dict')return generateDictPage(_listPage[id]||1);
    return generateListPage(id,_listPage[id]||1);
}

function cargoRowHtml(row){
    const r=row||{};
    return '<tr class="shipment-cargo-row border-b border-surface-100 hover:bg-primary-50/30">'+
        '<td class="px-3 py-2 text-sm text-text-muted text-center cargo-index"></td>'+
        '<td class="px-3 py-2 min-w-[140px]"><input type="text" class="cargo-name w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50" value="'+esc(r.name||'')+'" placeholder="'+esc(tr('品名'))+'"></td>'+
        '<td class="px-3 py-2"><select class="cargo-type h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 w-full">'+selectOptionsHtml(['普货','敏感货','危险品','带电货'],r.type||'普货')+'</select></td>'+
        '<td class="px-3 py-2 w-20"><input type="number" class="cargo-pieces w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 text-center" value="'+esc(r.pieces||'')+'"></td>'+
        '<td class="px-3 py-2 w-24"><input type="number" step="0.01" class="cargo-weight w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 text-center" value="'+esc(r.weight||'')+'"></td>'+
        '<td class="px-3 py-2 w-16"><input type="number" step="0.1" class="cargo-length w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 text-center" value="'+esc(r.length||'')+'"></td>'+
        '<td class="px-3 py-2 w-16"><input type="number" step="0.1" class="cargo-width w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 text-center" value="'+esc(r.width||'')+'"></td>'+
        '<td class="px-3 py-2 w-16"><input type="number" step="0.1" class="cargo-height w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 text-center" value="'+esc(r.height||'')+'"></td>'+
        '<td class="px-3 py-2 w-20"><input type="number" step="0.001" class="cargo-volume w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 text-center" value="'+esc(r.volume||'')+'"></td>'+
        '<td class="px-3 py-2 w-20"><select class="cargo-fake h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 w-full">'+selectOptionsHtml(['否','是'],r.fake||'否')+'</select></td>'+
        '<td class="px-3 py-2 min-w-[100px]"><input type="text" class="cargo-remark w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50" value="'+esc(r.remark||'')+'"></td>'+
        '<td class="px-3 py-2 text-center"><button type="button" onclick="removeShipmentCargoRow(this)" class="h-7 px-2 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50 cursor-pointer">'+tr('删除')+'</button></td>'+
        '</tr>';
}

function refreshShipmentCargoIndexes(){
    document.querySelectorAll('#shipment-cargo-body .shipment-cargo-row').forEach(function(row,i){
        const idx=row.querySelector('.cargo-index');
        if(idx)idx.textContent=i+1;
    });
}

function addShipmentCargoRow(data){
    const tbody=document.getElementById('shipment-cargo-body');
    if(!tbody)return;
    tbody.insertAdjacentHTML('beforeend',cargoRowHtml(data||{}));
    refreshShipmentCargoIndexes();
    applyRuntimeEnhancements(tbody.lastElementChild);
    calcShipmentCargoSummary();
}

function removeShipmentCargoRow(btn){
    const tbody=document.getElementById('shipment-cargo-body');
    if(!tbody)return;
    if(tbody.querySelectorAll('.shipment-cargo-row').length<=1){
        showToast(tr('至少保留一条货物明细'));
        return;
    }
    const row=btn.closest('.shipment-cargo-row');
    if(row)row.remove();
    refreshShipmentCargoIndexes();
    calcShipmentCargoSummary();
}

function calcShipmentCargoSummary(){
    let totalPcs=0,totalWeight=0,totalCbm=0;
    document.querySelectorAll('#shipment-cargo-body .shipment-cargo-row').forEach(function(row){
        const pcs=parseFloat((row.querySelector('.cargo-pcs')||{}).value)||0;
        const weight=parseFloat((row.querySelector('.cargo-weight')||{}).value)||0;
        const length=parseFloat((row.querySelector('.cargo-length')||{}).value)||0;
        const width=parseFloat((row.querySelector('.cargo-width')||{}).value)||0;
        const height=parseFloat((row.querySelector('.cargo-height')||{}).value)||0;
        const cbm=pcs&&length&&width&&height?(pcs*length*width*height/1000000):0;
        const cbmInput=row.querySelector('.cargo-cbm');
        if(cbmInput)cbmInput.value=cbm?cbm.toFixed(3):'';
        totalPcs+=pcs;
        totalWeight+=pcs*weight;
        totalCbm+=cbm;
    });
    const pcsEl=document.getElementById('shipment-total-pcs');
    const weightEl=document.getElementById('shipment-total-weight');
    const cbmEl=document.getElementById('shipment-total-cbm');
    const estWeightEl=document.getElementById('shipment-est-weight');
    const estCbmEl=document.getElementById('shipment-est-cbm');
    const feeEl=document.getElementById('shipment-ref-fee');
    if(pcsEl)pcsEl.textContent=totalPcs.toLocaleString();
    if(weightEl)weightEl.textContent=totalWeight.toFixed(2)+' KG';
    if(cbmEl)cbmEl.textContent=totalCbm.toFixed(3)+' CBM';
    if(estWeightEl)estWeightEl.textContent=totalWeight.toFixed(2)+' KG';
    if(estCbmEl)estCbmEl.textContent=totalCbm.toFixed(3)+' CBM';
    if(feeEl)feeEl.textContent='USD '+Math.max(180,Math.round(totalWeight*6.5+totalCbm*220)).toLocaleString();
}

function shipmentEntryCargoRowsHtml(count,startIdx){
    startIdx=startIdx||0;
    let html='';
    for(let i=0;i<count;i++){
        html+='<tr class="shipment-entry-cargo-row">'+
            '<td class="w-10 px-2 py-1.5 text-center text-xs text-text-muted bg-surface-50 border-b border-surface-200"><span class="cargo-index">'+(startIdx+i+1)+'</span></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="text" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="number" min="0" class="shipment-entry-box w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none text-center" oninput="updateShipmentEntryTotalBox()"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="number" min="0" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none text-center"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="text" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="text" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="text" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="text" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none"></td>'+
            '<td class="w-16 px-2 py-1.5 text-center border-b border-l border-surface-200"><button type="button" onclick="removeShipmentEntryCargoRow(this)" class="text-red-500 hover:text-red-600 text-xs cursor-pointer">'+tr('删除')+'</button></td>'+
            '</tr>';
    }
    return html;
}

function refreshShipmentEntryCargoIndexes(){
    document.querySelectorAll('#shipment-entry-cargo-body .shipment-entry-cargo-row').forEach(function(row,i){
        const idx=row.querySelector('.cargo-index');
        if(idx)idx.textContent=i+1;
    });
}

function addShipmentEntryCargoRow(){
    const tbody=document.getElementById('shipment-entry-cargo-body');
    if(!tbody)return;
    const count=tbody.querySelectorAll('.shipment-entry-cargo-row').length;
    tbody.insertAdjacentHTML('beforeend',shipmentEntryCargoRowsHtml(1,count));
    refreshShipmentEntryCargoIndexes();
}

function removeShipmentEntryCargoRow(btn){
    const tbody=document.getElementById('shipment-entry-cargo-body');
    if(!tbody)return;
    if(tbody.querySelectorAll('.shipment-entry-cargo-row').length<=1){
        showToast(tr('至少保留一行'));
        return;
    }
    const row=btn.closest('.shipment-entry-cargo-row');
    if(row)row.remove();
    refreshShipmentEntryCargoIndexes();
    updateShipmentEntryTotalBox();
}

function updateShipmentEntryTotalBox(){
    let total=0;
    document.querySelectorAll('#shipment-entry-cargo-body .shipment-entry-box').forEach(function(input){total+=parseFloat(input.value)||0;});
    const el=document.getElementById('shipment-entry-total-box');
    if(el)el.textContent=total.toLocaleString();
}

function handleShipmentEntryAttachmentUpload(input){
    const list=document.getElementById('shipment-entry-attachment-list');
    if(!list||!input.files)return;
    Array.from(input.files).forEach(function(file){
        const sizeStr=file.size<1024?file.size+'B':file.size<1048576?(file.size/1024).toFixed(1)+'KB':(file.size/1048576).toFixed(1)+'MB';
        const item=document.createElement('div');
        item.className='attachment-item flex items-center justify-between p-2.5 bg-surface-50 rounded-lg border border-surface-200';
        item.innerHTML='<div class="flex items-center gap-2 flex-1 min-w-0"><svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div class="min-w-0"><div class="text-sm text-text-primary truncate">'+esc(file.name)+'</div><div class="text-xs text-text-muted">'+sizeStr+'</div></div></div><button type="button" onclick="this.closest(\'.attachment-item\').remove()" class="text-red-500 hover:text-red-600 cursor-pointer text-xs font-medium">'+tr('删除')+'</button>';
        list.appendChild(item);
    });
    input.value='';
}

var _shipmentEntryTab='manual';

function shipmentEntryTabs(id,active){
    const tabs=[['manual','下单录入'],['import','导入下单']];
    let html='<div class="bg-white rounded-xl border border-surface-200 p-3"><div class="flex flex-wrap gap-2">';
    tabs.forEach(function(tab){
        const on=active===tab[0];
        html+='<button type="button" onclick="switchShipmentEntryTab(\''+tab[0]+'\',\''+id+'\')" class="h-9 px-5 text-sm font-medium rounded-lg cursor-pointer '+(on?'text-white bg-primary-600':'text-text-secondary border border-surface-200 hover:bg-surface-50')+'">'+tr(tab[1])+'</button>';
    });
    html+='</div></div>';
    return html;
}

function switchShipmentEntryTab(mode,id){
    _shipmentEntryTab=mode;
    const main=document.getElementById('main-content');
    if(main)main.innerHTML=renderShipmentEntryPage(id);
}

function renderShipmentEntryPage(id){
    const c=TC[id]||{};
    if(c.pageMode==='shipmentEntryAdmin')return generateAdminShipmentEntryPage(id);
    return generateClientShipmentEntryPage(id);
}

function generateAdminShipmentEntryPage(id){
    return generateShipmentEntryPage(id,{showCustomerCode:true,title:'运单管理下单录入'});
}

function generateClientShipmentEntryPage(id){
    return generateShipmentEntryPage(id,{showCustomerCode:false,title:'专线下单录入'});
}

function generateShipmentEntryPage(id,options){
    if(_shipmentEntryTab==='import')return generateImportEntryPage(id);
    options=options||{};
    const isAdmin=!!options.showCustomerCode;
    const defaultCustomer=isAdmin?defaultShipmentCustomer():null;
    const productOptions=((TC['prod-manage']&&TC['prod-manage'].d)||[]).map(function(r){return r&&r[1];}).filter(Boolean);
    const basic=[
        ...(isAdmin?[
            {label:'客户代码',required:true,value:defaultCustomer.code,placeholder:'请输入客户代码',list:'shipment-customer-code-options',id:'shipment-customer-code',onchange:'handleShipmentCustomerChange(this)',span:'md:col-span-2'}
        ]:[]),
        {label:'目的仓库',required:true,type:'select',id:'shipment-dest-warehouse',options:['达喀尔海外仓','拉各斯海外仓','阿比让海外仓','杜阿拉海外仓','洛美海外仓','特马海外仓','蒙罗维亚海外仓','科纳克里海外仓','班珠尔海外仓'],value:'达喀尔海外仓',span:isAdmin?'md:col-span-2':'md:col-span-4'},
        {label:'物流单号',value:''},
        {label:'产品',type:'select',required:true,options:productOptions.length?productOptions:['西非海运专线','西非空运专线'],onchange:'handleShipmentEntryProductChange(this)'},
        {label:'货物类型',type:'select',required:true,options:['普货','敏感货']},
        {label:'国内仓库',type:'select',required:true,options:['深圳盐田仓','广州南沙仓','上海浦东仓','义乌仓']},
        {label:'件数',type:'number',required:true,value:'1'},
        {label:'总体积(CBM)',type:'number',value:''},
        {label:'总重量(KG)',type:'number',value:''},
        {label:'预计送货时间',type:'datetime-local'}
    ];
    const sender=[
        {label:'发件人',value:'',placeholder:'输入联系人模糊匹配，选中自动带出',list:'shipment-sender-options',oninput:'fillShipmentSenderInfo(this)',onchange:'fillShipmentSenderInfo(this)'},
        {label:'发件人公司',value:'',id:'shipment-sender-company',placeholder:'选中发件人后自动填充'},
        {label:'发件人电话',type:'tel',value:'',id:'shipment-sender-phone',placeholder:'选中发件人后自动填充'},
        {label:'发件人地址',value:'',id:'shipment-sender-address',placeholder:'选中发件人后自动填充'}
    ];
    let h='';
    h+='<div class="h-full overflow-auto p-5">';
    h+='<form id="shipment-entry-form" class="space-y-5">';
    h+=productNameDatalistHtml();
    if(isAdmin)h+=shipmentCustomerDatalistHtml();
    h+=shipmentSenderDatalistHtml();
    h+=shipmentEntryTabs(id,_shipmentEntryTab);
    h+='<div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-5 lg:col-span-8">';
    h+='<div class="flex items-center justify-between gap-4 mb-5"><div><h2 class="text-lg font-semibold text-text-primary">'+tr(options.title||'专线下单录入')+'</h2></div><span class="badge bg-amber-100 text-amber-700">'+tr('待提交')+'</span></div>';
    h+='<div class="space-y-6">';
    h+='<section><div class="text-sm font-semibold text-text-primary mb-3">'+tr('基础信息')+'</div>'+renderFields(basic,4)+'</section>';
    h+='<section><div class="text-sm font-semibold text-text-primary mb-3">'+tr('发件人信息')+'</div>'+renderFields(sender,4)+'</section>';
    h+='<section>'+
        '<div class="text-sm font-semibold text-text-primary mb-3">'+tr('附加服务')+'</div>'+
        '<div id="shipment-entry-services" class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 min-h-[42px]">'+
            '<span class="text-xs text-text-muted">'+tr('请先选择产品')+'</span>'+
        '</div>'+
    '</section>';
    h+='<section>'+
        '<div class="flex items-end justify-between mb-3 flex-wrap gap-2">'+
            '<div>'+
                '<div class="text-sm font-semibold text-text-primary">'+tr('货物明细')+'</div>'+
                '<div class="text-xs text-red-500 mt-1">'+tr('操作方式：类似Excel表格，可粘贴可复制。红色字体为必填内容。')+'</div>'+
            '</div>'+
            '<div class="flex items-center gap-3">'+
                '<button type="button" onclick="addShipmentEntryCargoRow()" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50 cursor-pointer">+ '+tr('新增行')+'</button>'+
                '<div class="text-base font-semibold text-red-500">'+tr('总箱数')+'：<span id="shipment-entry-total-box">0</span></div>'+
            '</div>'+
        '</div>'+
        '<div class="overflow-x-auto border border-surface-200 rounded-lg">'+
            '<table class="w-full text-sm border-collapse">'+
                '<thead class="bg-surface-50">'+
                    '<tr>'+
                        '<th class="w-10 px-2 py-2 text-center text-text-muted font-medium border-b border-surface-200"></th>'+
                        '<th class="px-3 py-2 text-center text-red-500 font-medium border-b border-l border-surface-200">'+tr('品名')+'</th>'+
                        '<th class="px-3 py-2 text-center text-red-500 font-medium border-b border-l border-surface-200">'+tr('箱数')+'</th>'+
                        '<th class="px-3 py-2 text-center text-text-secondary font-medium border-b border-l border-surface-200">'+tr('单箱数量')+'</th>'+
                        '<th class="px-3 py-2 text-center text-text-secondary font-medium border-b border-l border-surface-200">'+tr('品牌')+'</th>'+
                        '<th class="px-3 py-2 text-center text-text-secondary font-medium border-b border-l border-surface-200">'+tr('材质')+'</th>'+
                        '<th class="px-3 py-2 text-center text-text-secondary font-medium border-b border-l border-surface-200">'+tr('规格型号')+'</th>'+
                        '<th class="px-3 py-2 text-center text-text-secondary font-medium border-b border-l border-surface-200">'+tr('海关编码')+'</th>'+
                        '<th class="w-16 px-2 py-2 text-center text-text-muted font-medium border-b border-l border-surface-200">'+tr('操作')+'</th>'+
                    '</tr>'+
                '</thead>'+
                '<tbody id="shipment-entry-cargo-body">'+shipmentEntryCargoRowsHtml(5)+'</tbody>'+
            '</table>'+
        '</div>'+
    '</section>';
    h+='<section>'+
        '<div class="text-sm font-semibold text-text-primary mb-3">'+tr('附件信息')+'</div>'+
        '<div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">'+
            '<div>'+
                '<label class="text-xs text-text-muted mb-1 block">'+tr('附件类型')+'</label>'+
                '<select class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+
                    '<option>'+tr('报关资料')+'</option>'+
                    '<option>'+tr('合同发票')+'</option>'+
                    '<option>'+tr('装箱单')+'</option>'+
                    '<option>'+tr('其他')+'</option>'+
                '</select>'+
            '</div>'+
            '<div class="md:col-span-3">'+
                '<div onclick="document.getElementById(\'shipment-entry-attachment-input\').click()" class="border-2 border-dashed border-surface-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors">'+
                    '<svg class="w-10 h-10 text-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>'+
                    '<p class="text-sm text-text-muted">'+tr('将文件拖到此处，或')+'<span class="text-primary-600">'+tr('点击上传')+'</span></p>'+
                '</div>'+
                '<input type="file" id="shipment-entry-attachment-input" multiple class="hidden" onchange="handleShipmentEntryAttachmentUpload(this)">'+
                '<div class="mt-3 grid grid-cols-3 gap-2" id="shipment-entry-attachment-list"></div>'+
            '</div>'+
        '</div>'+
    '</section>';
    h+='</div></div>';
    h+='<div class="lg:col-span-4 space-y-4">';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-4"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('产品渠道说明')+'</div><div class="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700" id="shipment-channel-desc">'+tr('适合普货和常规敏感货，默认走深圳/广州仓集货，报价按散货海运产品规则带出。')+'</div></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-4"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('费用预估')+'</div><div class="space-y-2 text-sm text-text-secondary"><div class="flex justify-between gap-2"><span>'+tr('预计重量')+'</span><span class="font-medium text-text-primary text-right" id="shipment-est-weight">0 KG</span></div><div class="flex justify-between gap-2"><span>'+tr('预计体积')+'</span><span class="font-medium text-text-primary text-right" id="shipment-est-cbm">0 CBM</span></div><div class="flex justify-between gap-2"><span>'+tr('参考运费')+'</span><span class="font-medium text-primary-600 text-right" id="shipment-ref-fee">USD 0</span></div></div></div>';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-4"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('入仓要求')+'</div><div class="space-y-2 text-sm text-text-secondary leading-relaxed"><div>'+tr('报关资料：商业发票、装箱单')+'</div><div>'+tr('仓库时段：09:00-18:00')+'</div><div>'+tr('标签要求：外箱粘贴客户代号')+'</div></div></div>';
    h+='</div>';
    h+='</div>';
    h+='</div>';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-4 flex flex-wrap justify-end gap-2">'+
        '<button type="button" onclick="showRequirementDoc(\''+id+'\')" class="h-9 px-5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('需求说明')+'</button>'+
        '<button type="button" onclick="openActionModal(\'shipmentSubmit\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('提交预报')+'</button>'+
        '<button type="button" onclick="openActionModal(\'draft\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('保存草稿')+'</button>'+
        '<button type="button" onclick="openActionModal(\'resetEntry\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('重置')+'</button>'+
        '</div>';
    h+='</form></div>';
    setTimeout(function(){refreshShipmentCargoIndexes();calcShipmentCargoSummary();applyRuntimeEnhancements(document.getElementById('main-content'));var _cc=document.getElementById('shipment-customer-code');if(_cc)fillDestWarehouseFromCustomer(_cc.value,'shipment-dest-warehouse');},0);
    return h;
}

function generateImportEntryPage(id){
    let h='';
    h+='<div class="h-full overflow-auto p-5">';
    h+='<form id="import-entry-form" class="space-y-5">';
    h+=shipmentEntryTabs(id,_shipmentEntryTab);
    h+='<div class="bg-white rounded-xl border border-surface-200 p-5">';
    h+='<div class="flex items-center justify-between gap-4 mb-5"><div><h2 class="text-lg font-semibold text-text-primary">'+tr('导入下单')+'</h2></div></div>';
    h+='<div class="space-y-6">';
    h+='<section>';
    h+='<div class="mb-4"><button type="button" onclick="showToast(\''+tr('开始下载模版')+'\')" class="h-9 px-5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer inline-flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'+tr('下载模版-单个运单')+'</button></div>';
    h+='<div class="w-[30%]">';
    h+='<div class="border-2 border-dashed border-surface-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors" onclick="document.getElementById(\'import-file-input\').click()">';
    h+='<svg class="w-10 h-10 text-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>';
    h+='<p class="text-sm text-text-muted">'+tr('点击选择文件上传')+'</p>';
    h+='<p class="text-xs text-text-muted mt-1">'+tr('支持 Excel 文件导入')+'</p>';
    h+='</div>';
    h+='<input type="file" id="import-file-input" accept=".xlsx,.xls,.csv" class="hidden" onchange="handleImportFileUpload(this)">';
    h+='<div class="mt-3 grid grid-cols-3 gap-2" id="import-attachment-list"></div>';
    h+='</div>';
    h+='</section>';
    h+='</div></div>';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-4 flex flex-wrap justify-end gap-2">';
    h+='<button type="button" onclick="showToast(\''+tr('导入成功')+'\')" class="h-9 px-5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认导入')+'</button>';
    h+='<button type="button" onclick="switchShipmentEntryTab(\'manual\',\''+id+'\')" class="h-9 px-5 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('返回')+'</button>';
    h+='</div>';
    h+='</form></div>';
    return h;
}

function handleImportFileUpload(input){
    const list=document.getElementById('import-attachment-list');
    if(!list||!input.files)return;
    Array.from(input.files).forEach(function(file){
        const sizeStr=file.size<1024?file.size+'B':file.size<1048576?(file.size/1024).toFixed(1)+'KB':(file.size/1048576).toFixed(1)+'MB';
        const item=document.createElement('div');
        item.className='attachment-item flex items-center justify-between p-2.5 bg-surface-50 rounded-lg border border-surface-200';
        item.innerHTML='<div class="flex items-center gap-2 flex-1 min-w-0"><svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div class="min-w-0"><div class="text-sm text-text-primary truncate">'+esc(file.name)+'</div><div class="text-xs text-text-muted">'+sizeStr+'</div></div></div><button type="button" onclick="this.closest(\'.attachment-item\').remove()" class="text-red-500 hover:text-red-600 cursor-pointer text-xs font-medium">'+tr('删除')+'</button>';
        list.appendChild(item);
    });
    input.value='';
}

var _warehouseReceiveMode='fast';
var _warehouseReceiveModeTabId='';
var _warehousePdaTaskId='';
var _warehousePdaView='login';
var _warehousePdaLoggedIn=false;

