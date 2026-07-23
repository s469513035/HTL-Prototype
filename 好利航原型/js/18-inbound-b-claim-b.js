function warehouseSectionTitle(title){
    return '<div class="flex items-center gap-2 mb-3"><span class="w-1 h-6 bg-primary-600 rounded-full"></span><h3 class="text-base font-semibold text-text-primary">'+tr(title)+'</h3></div>';
}

function warehouseInlineInput(type,value,placeholder,extraClass,attrs){
    return '<input type="'+(type||'text')+'" value="'+esc(value||'')+'" placeholder="'+esc(placeholder||'')+'" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 focus:bg-white focus:border-primary-300 '+(extraClass||'')+'" '+(attrs||'')+'>';
}

function warehouseField(label,control,required,span){
    return '<div data-field-label="'+esc(label)+'" class="'+(span||'')+' min-w-0 flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary truncate">'+tr(label)+(required?'<span class="text-red-500 ml-1">*</span>':'')+'</label>'+control+'</div>';
}

function warehouseNumberStepper(value,placeholder,attrs){
    return '<div class="relative">'+warehouseInlineInput('number',value,placeholder,'pr-14',attrs)+'<div class="absolute right-1 top-1 flex h-6 items-center gap-0.5"><button type="button" onclick="stepWarehouseNumber(this,-1)" class="w-5 h-5 text-text-muted hover:text-primary-600 cursor-pointer">−</button><button type="button" onclick="stepWarehouseNumber(this,1)" class="w-5 h-5 text-text-muted hover:text-primary-600 cursor-pointer">＋</button></div></div>';
}

function stepWarehouseNumber(btn,delta){
    const input=btn.closest('.relative')?btn.closest('.relative').querySelector('input[type="number"]'):null;
    if(!input)return;
    const step=parseFloat(input.step||'1')||1;
    const current=parseFloat(input.value||'0')||0;
    input.value=Math.max(0,current+delta*step);
    input.dispatchEvent(new Event('input',{bubbles:true}));
}

function warehouseMultiSearchWaybill(){
    const input=document.getElementById('warehouse-multi-waybill-no');
    if(!input)return;
    if(!input.value)input.value='WB-20260701001';
    const map={
        'warehouse-multi-arrival-time':nowDateTimeLocalSeconds().replace('T',' '),
        'warehouse-multi-zone':'深圳盐田仓 A区',
        'warehouse-multi-forecast':'10'
    };
    Object.keys(map).forEach(function(k){
        const el=document.getElementById(k);
        if(el)el.value=map[k];
    });
    const custEl=document.getElementById('warehouse-multi-customer');
    const custOpts=getCrmCustomerOptions();
    const custVal=custOpts.find(function(o){return o.indexOf('C10001')>=0;})||custOpts[0]||'';
    if(custEl)custEl.value=custVal;
    fillDestWarehouseFromCustomer(custVal||'华运达国际货运','warehouse-multi-dest-warehouse');
    const prodSel=document.getElementById('warehouse-multi-product');
    if(prodSel){prodSel.value='西非海运专线';handleWarehouseMultiProductChange(prodSel);}
    showToast(tr('已带出运单基础信息'));
}

function addWarehouseMultiPallet(){
    const input=document.getElementById('warehouse-multi-pallet-input');
    const list=document.getElementById('warehouse-multi-pallet-list');
    if(!input||!list)return;
    const val=(input.value||'').trim();
    if(!val){showToast(tr('请输入托盘号'));return;}
    if(Array.from(list.querySelectorAll('[data-pallet-no]')).some(function(el){return el.dataset.palletNo===val;})){
        showToast(tr('该托盘已绑定'));
        return;
    }
    const item=document.createElement('div');
    item.className='pallet-item flex items-center justify-between px-3 py-2 bg-surface-50 rounded border border-surface-200';
    item.setAttribute('data-pallet-no',val);
    item.innerHTML='<div class="flex items-center gap-3 min-w-0"><span class="text-sm font-medium text-text-primary">'+esc(val)+'</span><span class="text-xs text-text-muted">'+tr('绑定时间')+'：'+nowDateTimeLocalSeconds().replace('T',' ')+'</span></div><button type="button" onclick="this.closest(\'.pallet-item\').remove()" class="h-7 px-2 text-xs font-medium text-red-500 border border-red-200 rounded hover:bg-red-50 cursor-pointer">'+tr('解绑')+'</button>';
    list.appendChild(item);
    input.value='';
    showToast(tr('绑定成功'));
}

function warehouseServiceHintHtml(items){
    let html='<div class="flex flex-wrap gap-2">';
    (items||[]).forEach(function(name){
        html+='<label class="inline-flex items-center gap-1.5 h-8 px-3 text-sm rounded border border-primary-100 bg-primary-50/60 text-text-secondary cursor-pointer hover:bg-primary-50"><input type="checkbox" class="rounded border-surface-300 text-primary-600"><span>'+tr(name)+'</span><span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface-100 border border-surface-200 text-text-muted text-[11px] font-bold leading-none cursor-help" title="'+esc(serviceChargeTooltip(name))+'">?</span></label>';
    });
    html+='</div>';
    return html;
}

function warehouseMultiSizeRowHtml(row){
    const r=row||{};
    return '<tr class="wm-size-row border-b border-surface-200 hover:bg-primary-50/30">'+
        '<td class="px-2 py-1 text-center text-text-muted w-10"><span class="text-xs">⋮⋮</span></td>'+
        '<td class="px-2 py-1 text-center w-12 wm-size-index"></td>'+
        '<td class="px-2 py-1 min-w-[170px]">'+warehouseInlineInput('number',r.weight||'','','wm-size-weight text-center','step="0.01" oninput="calcWarehouseMultiSummary()"')+'</td>'+
        '<td class="px-2 py-1 min-w-[110px]">'+warehouseInlineInput('number',r.pcs||'','','wm-size-pcs text-center','step="1" oninput="calcWarehouseMultiSummary()"')+'</td>'+
        '<td class="px-2 py-1 min-w-[90px]">'+warehouseInlineInput('number',r.length||'','','wm-size-length text-center','step="0.1" oninput="calcWarehouseMultiSummary()"')+'</td>'+
        '<td class="px-2 py-1 min-w-[90px]">'+warehouseInlineInput('number',r.width||'','','wm-size-width text-center','step="0.1" oninput="calcWarehouseMultiSummary()"')+'</td>'+
        '<td class="px-2 py-1 min-w-[90px]">'+warehouseInlineInput('number',r.height||'','','wm-size-height text-center','step="0.1" oninput="calcWarehouseMultiSummary()"')+'</td>'+
        '</tr>';
}

function warehouseMultiReceiptRowHtml(row){
    const r=row||{};
    return '<tr class="wm-receipt-row border-b border-surface-200 hover:bg-primary-50/30">'+
        '<td class="px-2 py-1 text-center text-text-muted w-10"><span class="text-xs">⋮⋮</span></td>'+
        '<td class="px-2 py-1 text-center w-12 wm-receipt-index"></td>'+
        '<td class="px-2 py-1 min-w-[190px]">'+warehouseInlineInput('text',r.subNo||'','','wm-receipt-sub','')+'</td>'+
        '<td class="px-2 py-1 min-w-[120px] bg-primary-50">'+warehouseInlineInput('number',r.weight||'','','wm-receipt-weight text-center border-primary-300 bg-white','step="0.01" oninput="calcWarehouseMultiSummary()"')+'</td>'+
        '<td class="px-2 py-1 min-w-[90px]">'+warehouseInlineInput('number',r.length||'','','wm-receipt-length text-center','step="0.1" oninput="calcWarehouseMultiSummary()"')+'</td>'+
        '<td class="px-2 py-1 min-w-[90px]">'+warehouseInlineInput('number',r.width||'','','wm-receipt-width text-center','step="0.1" oninput="calcWarehouseMultiSummary()"')+'</td>'+
        '<td class="px-2 py-1 min-w-[90px]">'+warehouseInlineInput('number',r.height||'','','wm-receipt-height text-center','step="0.1" oninput="calcWarehouseMultiSummary()"')+'</td>'+
        '</tr>';
}

function refreshWarehouseMultiIndexes(){
    document.querySelectorAll('#warehouse-multi-size-body .wm-size-row').forEach(function(row,i){
        const idx=row.querySelector('.wm-size-index');
        if(idx)idx.textContent=i+1;
    });
    document.querySelectorAll('#warehouse-multi-receipt-body .wm-receipt-row').forEach(function(row,i){
        const idx=row.querySelector('.wm-receipt-index');
        if(idx)idx.textContent=i+1;
    });
}

function addWarehouseMultiSizeRow(data){
    const tbody=document.getElementById('warehouse-multi-size-body');
    if(!tbody)return;
    tbody.insertAdjacentHTML('beforeend',warehouseMultiSizeRowHtml(data||{}));
    refreshWarehouseMultiIndexes();
    applyRuntimeEnhancements(tbody.lastElementChild);
    calcWarehouseMultiSummary();
}

function addWarehouseMultiReceiptRow(data){
    const tbody=document.getElementById('warehouse-multi-receipt-body');
    if(!tbody)return;
    tbody.insertAdjacentHTML('beforeend',warehouseMultiReceiptRowHtml(data||{}));
    refreshWarehouseMultiIndexes();
    applyRuntimeEnhancements(tbody.lastElementChild);
    calcWarehouseMultiSummary();
}

function removeLastWarehouseMultiSizeRow(){
    const rows=document.querySelectorAll('#warehouse-multi-size-body .wm-size-row');
    if(rows.length<=1){showToast(tr('至少保留一条货物明细'));return;}
    rows[rows.length-1].remove();
    refreshWarehouseMultiIndexes();
    calcWarehouseMultiSummary();
}

function clearWarehouseMultiSizeRows(){
    document.querySelectorAll('#warehouse-multi-size-body input').forEach(function(input){input.value='';});
    calcWarehouseMultiSummary();
}

function calcWarehouseMultiSummary(){
    let sizePcs=0,sizeWeight=0,sizeCbm=0,receiptCount=0,receiptWeight=0,receiptCbm=0;
    document.querySelectorAll('#warehouse-multi-size-body .wm-size-row').forEach(function(row){
        const pcs=parseFloat((row.querySelector('.wm-size-pcs')||{}).value)||0;
        const weight=parseFloat((row.querySelector('.wm-size-weight')||{}).value)||0;
        const length=parseFloat((row.querySelector('.wm-size-length')||{}).value)||0;
        const width=parseFloat((row.querySelector('.wm-size-width')||{}).value)||0;
        const height=parseFloat((row.querySelector('.wm-size-height')||{}).value)||0;
        sizePcs+=pcs;
        sizeWeight+=pcs*weight;
        if(pcs&&length&&width&&height)sizeCbm+=pcs*length*width*height/1000000;
    });
    document.querySelectorAll('#warehouse-multi-receipt-body .wm-receipt-row').forEach(function(row){
        const sub=(row.querySelector('.wm-receipt-sub')||{}).value||'';
        const weight=parseFloat((row.querySelector('.wm-receipt-weight')||{}).value)||0;
        const length=parseFloat((row.querySelector('.wm-receipt-length')||{}).value)||0;
        const width=parseFloat((row.querySelector('.wm-receipt-width')||{}).value)||0;
        const height=parseFloat((row.querySelector('.wm-receipt-height')||{}).value)||0;
        if(sub||weight||length||width||height)receiptCount+=1;
        receiptWeight+=weight;
        if(length&&width&&height)receiptCbm+=length*width*height/1000000;
    });
    const totalPieces=document.getElementById('wm-total-pieces');
    const totalWeight=document.getElementById('wm-total-weight');
    const totalCbm=document.getElementById('wm-total-cbm');
    const maintainPcs=document.getElementById('wm-maintain-pcs');
    if(totalPieces)totalPieces.textContent=(receiptCount||sizePcs||0).toLocaleString();
    if(totalWeight)totalWeight.textContent=(receiptWeight||sizeWeight||0).toFixed(2);
    if(totalCbm)totalCbm.textContent=(receiptCbm||sizeCbm||0).toFixed(3);
    if(maintainPcs&&!maintainPcs.value&&sizePcs)maintainPcs.value=sizePcs;
}

function confirmWarehouseMultiSubmit(removeEmpty){
    if(removeEmpty){
        document.querySelectorAll('#warehouse-multi-receipt-body .wm-receipt-row').forEach(function(row){
            const weight=(row.querySelector('.wm-receipt-weight')||{}).value||'';
            if(!weight||Number(weight)===0)row.remove();
        });
        refreshWarehouseMultiIndexes();
        calcWarehouseMultiSummary();
    }
    showToast(tr('提交成功'));
}

function handleWarehouseMultiSyncWaybill(checkbox){
    const input=document.getElementById('warehouse-multi-waybill-no');
    const searchBtn=document.getElementById('warehouse-multi-waybill-search');
    if(!input)return;
    input.disabled=!!checkbox.checked;
    input.classList.toggle('bg-surface-100',!!checkbox.checked);
    input.classList.toggle('text-text-muted',!!checkbox.checked);
    input.placeholder=checkbox.checked?tr('系统同步生成运单号'):tr('请输入运单号 回车即可确认');
    if(checkbox.checked)input.value='';
    if(searchBtn){
        searchBtn.disabled=!!checkbox.checked;
        searchBtn.classList.toggle('opacity-50',!!checkbox.checked);
        searchBtn.classList.toggle('cursor-not-allowed',!!checkbox.checked);
    }
}

function generateWarehouseMultiInboundPage(id){
    const warehouseOptions=getWarehouseNameOptions();
    const nowText=nowDateTimeLocalSeconds().replace('T',' ');
    const categoryOptions=['电子产品','服装鞋帽','五金工具','家居用品','食品','化妆品','其他'];
    const multiProductOptions=((TC['prod-manage']&&TC['prod-manage'].d)||[]).map(function(r){return r&&r[1];}).filter(Boolean);
    const multiCustomerOptions=getCrmCustomerOptions();
    const multiDestOptions=['达喀尔海外仓','拉各斯海外仓','阿比让海外仓','杜阿拉海外仓','洛美海外仓','特马海外仓','蒙罗维亚海外仓','科纳克里海外仓','班珠尔海外仓'];
    const sizeRows=[{}, {}, {}, {}, {}, {}, {}, {}, {}];
    const receiptRows=[{}, {}, {}, {}, {}, {}, {}, {}, {}];
    let h='';
    h+='<div class="h-full overflow-auto bg-surface-50 p-3 md:p-4">';
    h+='<form id="warehouse-inbound-form" class="space-y-4">';
    h+=productNameDatalistHtml();
    h+=crmCustomerDatalistHtml();
    h+='<div class="grid gap-3 xl:grid-cols-2">';
    h+='<div class="space-y-3">';
    h+='<section class="bg-white border border-primary-100 shadow-sm p-4">';
    h+=warehouseSectionTitle('基础信息');
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2">';
    h+=warehouseField('运单号','<div class="flex items-center gap-2"><div class="flex"><input id="warehouse-multi-waybill-no" class="w-56 h-8 px-2 text-sm border border-surface-200 rounded-l bg-surface-50" placeholder="'+esc(tr('扫描/输入运单号后回车带出基础信息'))+'" onkeydown="if(event.key===\'Enter\'){event.preventDefault();warehouseMultiSearchWaybill();}"><button id="warehouse-multi-waybill-search" type="button" onclick="warehouseMultiSearchWaybill()" class="w-10 h-8 bg-primary-600 text-white rounded-r hover:bg-primary-700 cursor-pointer">⌕</button></div><label class="inline-flex items-center gap-1.5 text-sm text-text-secondary whitespace-nowrap cursor-pointer"><input type="checkbox" id="warehouse-multi-no-order" class="rounded border-surface-300 text-primary-600" onchange="toggleWarehouseMultiNoOrder(this)"><span>'+tr('无单收货')+'</span></label></div>',true,'md:col-span-2');
    h+=warehouseField('到货时间','<input id="warehouse-multi-arrival-time" readonly value="'+esc(nowText)+'" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-100 cursor-not-allowed text-text-secondary">',false);
    h+=warehouseField('产品','<select id="warehouse-multi-product" onchange="handleWarehouseMultiProductChange(this)" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50"><option value="">'+tr('请选择')+'</option>'+(multiProductOptions.length?multiProductOptions:['西非海运专线','西非空运专线']).map(function(o){return '<option value="'+esc(o)+'">'+esc(tr(o))+'</option>';}).join('')+'</select>',false);
    h+=warehouseField('货物类型','<select id="warehouse-multi-cargo-type" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50"><option value="普货">'+tr('普货')+'</option><option value="敏感货">'+tr('敏感货')+'</option></select>',true);
    h+=warehouseField('客户','<input id="warehouse-multi-customer" list="crm-customer-options" readonly onchange="handleWarehouseMultiCustomerChange(this)" placeholder="'+esc(tr('扫描运单号后自动带出'))+'" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-100 cursor-not-allowed">',false);
    h+=warehouseField('目的仓库','<select id="warehouse-multi-dest-warehouse" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50"><option value="">'+tr('请选择')+'</option>'+multiDestOptions.map(function(o){return '<option value="'+esc(o)+'">'+esc(tr(o))+'</option>';}).join('')+'</select>',false);
    h+=warehouseField('件数','<input id="warehouse-multi-forecast" readonly value="" placeholder="'+esc(tr('扫描运单号后自动带出'))+'" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-100 cursor-not-allowed text-text-secondary">',false);
    h+=warehouseField('库位库区','<input id="warehouse-multi-zone" value="" placeholder="'+esc(tr('请输入库位库区'))+'" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50">',false,'md:col-span-2');
    h+=warehouseField('操作备注',warehouseInlineInput('text','','请输入操作备注','', ''),false,'md:col-span-2');
    h+='</div>';
    h+='<div class="mt-3"><label class="block text-sm font-medium text-text-secondary mb-2">'+tr('附加服务')+'</label><div id="warehouse-multi-services" class="flex flex-wrap gap-2 min-h-[42px] rounded border border-surface-200 bg-surface-50 px-2 py-2"><span class="text-xs text-text-muted">'+tr('请先选择产品')+'</span></div></div>';
    h+='</section>';
    h+='<section class="bg-white border border-primary-100 shadow-sm p-4">';
    h+=warehouseSectionTitle('同步绑定托盘');
    h+='<div class="text-sm text-text-muted mb-2">'+tr('支持绑定多个托盘号，每绑定一个自动追加到下方列表')+'（'+tr('不建议在PC端上操作，PDA支持扫码登记')+'）</div>';
    h+='<div class="flex flex-col sm:flex-row gap-2"><input id="warehouse-multi-pallet-input" class="flex-1 h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50" placeholder="'+esc(tr('输入托盘号后回车或点击绑定'))+'" onkeydown="if(event.key===\'Enter\'){event.preventDefault();addWarehouseMultiPallet();}"><button type="button" onclick="addWarehouseMultiPallet()" class="h-8 px-5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 cursor-pointer">'+tr('绑定')+'</button></div>';
    h+='<div id="warehouse-multi-pallet-list" class="mt-3 space-y-2"></div>';
    h+='</section>';
    h+='</div>';
    h+='<div class="space-y-3">';
    h+='<section class="bg-white border border-primary-100 shadow-sm p-4">';
    h+=warehouseSectionTitle('尺寸维护');
    h+='<div class="mb-3"><label class="block text-sm font-medium text-text-secondary mb-2">'+tr('重量选择')+'</label><div class="flex items-center gap-4 text-sm"><label class="inline-flex items-center gap-1.5"><input type="radio" name="wm-weight" checked class="text-primary-600">'+tr('单件重')+'</label><label class="inline-flex items-center gap-1.5"><input type="radio" name="wm-weight" class="text-primary-600">'+tr('总重量')+'</label></div></div>';
    h+='<div class="border border-surface-200 overflow-hidden"><div class="overflow-auto" style="height:300px"><table class="w-full text-sm border-separate border-spacing-0"><thead class="sticky top-0 z-10"><tr class="bg-primary-50 text-text-primary"><th class="px-2 py-2 w-10"></th><th class="px-2 py-2 w-12">#</th><th class="px-2 py-2 text-left">'+tr('单件/总重量（KG）')+'</th><th class="px-2 py-2 text-left">'+tr('件数')+'</th><th class="px-2 py-2 text-left">'+tr('长')+'</th><th class="px-2 py-2 text-left">'+tr('宽')+'</th><th class="px-2 py-2 text-left">'+tr('高')+'</th></tr></thead><tbody id="warehouse-multi-size-body">'+sizeRows.map(warehouseMultiSizeRowHtml).join('')+'</tbody></table></div>';
    h+='<div class="flex items-center gap-3 px-3 py-2 bg-primary-50/60 text-xs text-text-secondary"><input class="w-12 h-7 px-2 border border-surface-200 rounded bg-white" value="1"><button type="button" onclick="addWarehouseMultiSizeRow()" class="text-primary-600 font-medium cursor-pointer">'+tr('新增')+'</button><span>|</span><button type="button" onclick="removeLastWarehouseMultiSizeRow()" class="cursor-pointer">'+tr('删除')+'</button><span>|</span><button type="button" onclick="clearWarehouseMultiSizeRows()" class="cursor-pointer">'+tr('清空')+'</button><span>|</span><span>'+tr('表格高度')+':</span><input class="w-14 h-7 px-2 border border-surface-200 rounded bg-white" value="300"><span>PX</span></div></div>';
    h+='</section>';
    h+='</div>';
    h+='</div>';
    h+='<div class="bg-white border border-primary-100 p-3 flex flex-wrap justify-end gap-2">'+
        '<button type="button" onclick="showRequirementDoc(\''+id+'\')" class="h-9 px-5 text-sm font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50 cursor-pointer">'+tr('需求说明')+'</button>'+
        '<button type="button" onclick="openActionModal(\'inboundSave\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 cursor-pointer">'+tr('保存入仓')+'</button>'+
        '<button type="button" onclick="openActionModal(\'exception\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-text-secondary border border-surface-200 rounded hover:bg-surface-50 cursor-pointer">'+tr('异常登记')+'</button>'+
        '<button type="button" onclick="openActionModal(\'resetEntry\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-text-secondary border border-surface-200 rounded hover:bg-surface-50 cursor-pointer">'+tr('重置')+'</button>'+
        '</div>';
    h+='</form></div>';
    setTimeout(function(){refreshWarehouseMultiIndexes();calcWarehouseMultiSummary();applyRuntimeEnhancements(document.getElementById('main-content'));},0);
    return h;
}

var _productServices={
    '西非海运专线':['报关','木箱'],
    '西非空运专线':['报关','带电','带磁']
};

function refreshProductServices(select,containerId){
    const val=select&&select.value;
    const container=document.getElementById(containerId);
    if(!container)return;
    if(!val||val==='请选择'){
        container.innerHTML='<span class="text-xs text-text-muted">'+tr('请先选择产品')+'</span>';
        return;
    }
    const services=_productServices[val]||[];
    if(!services.length){
        container.innerHTML='<span class="text-xs text-text-muted">'+tr('该产品未配置附加服务')+'</span>';
        return;
    }
    container.innerHTML=services.map(function(o){
        return '<label class="inline-flex items-center gap-1 text-sm text-text-secondary cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600" data-cb-label="'+esc(o)+'"><span>'+esc(tr(o))+'</span><span class="inline-flex w-4 h-4 items-center justify-center rounded-full bg-surface-100 border border-surface-200 text-[11px] font-bold leading-none text-text-muted cursor-help" title="'+esc(serviceChargeTooltip(o))+'">?</span></label>';
    }).join('');
}

function handleWarehouseProductChange(select){
    refreshProductServices(select,'warehouse-inbound-services');
}

function handleShipmentEntryProductChange(select){
    refreshProductServices(select,'shipment-entry-services');
}

function getCustomerPickupWarehouse(custKey){
    if(!custKey)return '';
    const c=TC['crm-cust']||{};
    const headers=c.h||[];
    const idxCode=headers.indexOf('客户代码');
    const idxShort=headers.indexOf('客户简称');
    const idxFull=headers.indexOf('客户全称');
    const idxPickup=headers.indexOf('海外提货偏好仓库');
    if(idxPickup<0)return '';
    const key=String(custKey).trim();
    if(!key)return '';
    const row=(c.d||[]).find(function(r){
        if(!r)return false;
        const code=String(r[idxCode]||'').trim();
        const short=String(r[idxShort]||'').trim();
        const full=String(r[idxFull]||'').trim();
        if(code===key||short===key||full===key)return true;
        if(short&&(key.indexOf(short)>=0||short.indexOf(key)>=0))return true;
        if(full&&(key.indexOf(full)>=0||full.indexOf(key)>=0))return true;
        return false;
    });
    if(!row)return '';
    return String(row[idxPickup]||'').split(',')[0].trim();
}

function fillDestWarehouseFromCustomer(custKey,destSelectId){
    const sel=document.getElementById(destSelectId);
    if(!sel)return;
    const warehouse=getCustomerPickupWarehouse(custKey);
    if(!warehouse)return;
    if(!Array.from(sel.options).some(function(o){return o.value===warehouse;})){
        const opt=document.createElement('option');
        opt.value=warehouse;opt.textContent=tr(warehouse);
        sel.appendChild(opt);
    }
    sel.value=warehouse;
}

function getCrmCustomerOptions(){
    const c=TC['crm-cust']||{};
    const headers=c.h||[];
    const iCode=headers.indexOf('客户代码');
    const iShort=headers.indexOf('客户简称');
    return ((c.d)||[]).map(function(r){
        if(!r)return '';
        const code=iCode>=0?String(r[iCode]||''):'';
        const short=iShort>=0?String(r[iShort]||''):'';
        return [code,short].filter(Boolean).join(' ');
    }).filter(Boolean);
}

function handleShipmentCustomerChange(input){
    fillDestWarehouseFromCustomer(input&&input.value,'shipment-dest-warehouse');
}

function handleWarehouseInboundCustomerChange(input){
    fillDestWarehouseFromCustomer(input&&input.value,'warehouse-inbound-dest');
}

function handleWarehouseMultiCustomerChange(select){
    fillDestWarehouseFromCustomer(select&&select.value,'warehouse-multi-dest-warehouse');
}

function crmCustomerDatalistHtml(){
    return '<datalist id="crm-customer-options">'+getCrmCustomerOptions().map(function(o){
        return '<option value="'+esc(o)+'"></option>';
    }).join('')+'</datalist>';
}

function handleWarehouseMultiProductChange(select){
    refreshProductServices(select,'warehouse-multi-services');
}

function toggleWarehouseMultiNoOrder(cb){
    const on=cb&&cb.checked;
    const waybill=document.getElementById('warehouse-multi-waybill-no');
    const searchBtn=document.getElementById('warehouse-multi-waybill-search');
    if(waybill){
        waybill.readOnly=!!on;
        waybill.classList.toggle('bg-surface-100',!!on);
        waybill.classList.toggle('cursor-not-allowed',!!on);
        waybill.classList.toggle('bg-surface-50',!on);
        if(on)waybill.value='';
    }
    if(searchBtn){
        searchBtn.disabled=!!on;
        searchBtn.classList.toggle('opacity-50',!!on);
        searchBtn.classList.toggle('cursor-not-allowed',!!on);
    }
    const cust=document.getElementById('warehouse-multi-customer');
    if(cust){
        cust.readOnly=!on;
        cust.classList.toggle('bg-surface-50',!!on);
        cust.classList.toggle('bg-surface-100',!on);
        cust.classList.toggle('cursor-not-allowed',!on);
    }
    const fc=document.getElementById('warehouse-multi-forecast');
    if(fc){
        fc.readOnly=!on;
        fc.classList.toggle('bg-surface-50',!!on);
        fc.classList.toggle('bg-surface-100',!on);
        fc.classList.toggle('cursor-not-allowed',!on);
        fc.classList.toggle('text-text-secondary',!on);
    }
}

function saveProductManageServices(productName){
    if(!productName)return;
    const container=document.getElementById('prod-manage-services-container');
    if(!container)return;
    const selected=[];
    container.querySelectorAll('input[type="checkbox"][data-cb-label]:checked').forEach(function(cb){
        selected.push(cb.dataset.cbLabel);
    });
    _productServices[productName]=selected;
}

function generateWarehouseInboundPage(id){
    const cfg=TC[id]||{};
    const defaultMode=cfg.receiveModeDefault==='multi'?'second':(cfg.receiveModeDefault==='one'?'fast':'');
    const mode=(_warehouseReceiveModeTabId===id?_warehouseReceiveMode:'')||defaultMode||_warehouseReceiveMode||'fast';
    if(mode==='noPre')return generateWarehouseHeadlessInboundPage(id);
    if(id==='wh-in-multi'||mode==='second')return generateWarehouseMultiInboundPage(id);
    const titleMap={fast:'手动入仓',second:'入仓操作（一票多件）',noPre:'无预报收货'};
    const title=cfg.receiveModeDefault?cfg.t:(titleMap[mode]||'极速收货');
    const status=mode==='noPre'?'待补录':'待入仓';
    const warehouseOptions=getWarehouseNameOptions();
    const inboundProductOptions=((TC['prod-manage']&&TC['prod-manage'].d)||[]).map(function(r){return r&&r[1];}).filter(Boolean);
    const inboundCustomerOptions=getCrmCustomerOptions();
    const basic=[
        {label:'快递单号',value:'SF10086523'},
        {label:'到货仓库',type:'select',required:true,options:warehouseOptions,value:currentAccountWarehouse()},
        {label:'所属客户',value:inboundCustomerOptions[0]||'',id:'warehouse-inbound-customer',list:'crm-customer-options',placeholder:'输入客户代码/名称模糊筛选',onchange:'handleWarehouseInboundCustomerChange(this)',span:'md:col-start-1'},
        {label:'目的仓库',required:true,type:'select',id:'warehouse-inbound-dest',options:['达喀尔海外仓','拉各斯海外仓','阿比让海外仓','杜阿拉海外仓','洛美海外仓','特马海外仓','蒙罗维亚海外仓','科纳克里海外仓','班珠尔海外仓'],value:'达喀尔海外仓'},
        {label:'产品',type:'select',options:inboundProductOptions.length?inboundProductOptions:['西非海运专线','西非空运专线'],onchange:'handleWarehouseProductChange(this)'},
        {label:'货物类型',type:'select',required:true,options:['普货','敏感货'],value:'普货'},
        {label:'品名',required:true,value:'',placeholder:'输入品名信息',list:'product-name-options',oninput:'handleWarehouseProductNameInput(this)',onblur:'handleCargoNameCommit(this)'},
        {label:'长(cm)',type:'number',value:''},
        {label:'宽(cm)',type:'number',value:''},
        {label:'高(cm)',type:'number',value:''},
        {label:'重量(KG)',type:'number',value:''}
    ];
    const cargoRows=[
        {name:'电子产品',type:'敏感货',pcs:'10',weight:'25',length:'60',width:'50',height:'45',brand:'否',remark:'带电小家电配件'},
        {name:'服装配件',type:'普货',pcs:'6',weight:'12',length:'45',width:'35',height:'30',brand:'否',remark:'纸箱包装'},
        {name:'五金工具',type:'普货',pcs:'4',weight:'18',length:'50',width:'40',height:'28',brand:'否',remark:'需加固'}
    ];
    const zoneBind=[
        {label:'货区',type:'select',required:true,options:['A区','B区','C区','异常区','待认领区'],value:'A区'},
        {label:'托盘号',value:'TP-YT-001'}
    ];
    const detailOpen=mode==='second';
    const detailContentClass=detailOpen?'':'hidden';
    const detailArrowStyle=detailOpen?' style="transform:rotate(180deg)"':'';
    let h='';
    h+='<div class="h-full overflow-auto p-5">';
    h+='<form id="warehouse-inbound-form" class="space-y-5">';
    h+=productNameDatalistHtml();
    h+=crmCustomerDatalistHtml();
    h+=warehouseReceiveTabs(id,mode);
    h+='<div class="bg-white rounded-xl border border-surface-200 p-5">';
    h+='<div class="flex items-center justify-between gap-4 mb-5"><div><h2 class="text-lg font-semibold text-text-primary">'+tr(title)+'</h2></div><span class="badge bg-blue-100 text-blue-700">'+tr(status)+'</span></div>';
    h+='<div class="space-y-6">';
    h+='<section><div class="text-sm font-semibold text-text-primary mb-3">'+tr('基础信息')+'</div>'+renderFields(basic,4)+'</section>';
    h+='<section><div class="text-sm font-semibold text-text-primary mb-3">'+tr('货区托盘绑定')+'</div>'+renderFields(zoneBind,4)+'</section>';
    h+='<section><div class="text-sm font-semibold text-text-primary mb-3">'+tr('附加服务')+'</div>'+
        '<div id="warehouse-inbound-services" class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 min-h-[42px]">'+
            '<span class="text-xs text-text-muted">'+tr('请先选择产品')+'</span>'+
        '</div>'+
    '</section>';
    if(mode==='second'){
    h+='<section><div class="border border-surface-200 rounded-xl overflow-hidden"><div class="flex items-center justify-between px-4 py-3 bg-surface-50 cursor-pointer hover:bg-surface-100 transition-colors" onclick="toggleCargoDetail(this)"><div class="text-sm font-semibold text-text-primary">'+tr('货物明细')+'</div><svg class="w-5 h-5 text-text-muted transition-transform cargo-detail-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"'+detailArrowStyle+'><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></div><div class="cargo-detail-content '+detailContentClass+'">';
    h+='<div class="flex justify-end px-4 pt-3"><button type="button" onclick="addShipmentCargoRow()" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('新增品名')+'</button></div>';
    h+='<div class="overflow-x-auto px-4 pb-4"><table class="w-full text-sm min-w-[1320px]"><thead><tr class="bg-[#EFF6FF] text-text-secondary">'+
        '<th class="px-3 py-2 text-center w-12">'+tr('序号')+'</th>'+
        '<th class="px-3 py-2 text-left">'+tr('品名')+'</th>'+
        '<th class="px-3 py-2 text-left">'+tr('货物类型')+'</th>'+
        '<th class="px-3 py-2 text-center">'+tr('件数')+'</th>'+
        '<th class="px-3 py-2 text-center">'+tr('单件重量')+'</th>'+
        '<th class="px-3 py-2 text-center">'+tr('长')+'</th>'+
        '<th class="px-3 py-2 text-center">'+tr('宽')+'</th>'+
        '<th class="px-3 py-2 text-center">'+tr('高')+'</th>'+
        '<th class="px-3 py-2 text-center">'+tr('体积CBM')+'</th>'+
        '<th class="px-3 py-2 text-center">'+tr('仿牌')+'</th>'+
        '<th class="px-3 py-2 text-left">'+tr('备注')+'</th>'+
        '<th class="px-3 py-2 text-center">'+tr('操作')+'</th>'+
        '</tr></thead><tbody id="shipment-cargo-body">'+cargoRows.map(cargoRowHtml).join('')+'</tbody></table></div>';
    h+='</div></div></section>';
    }
    h+='</div></div>';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-4 flex flex-wrap justify-end gap-2">'+
        '<button type="button" onclick="showRequirementDoc(\''+id+'\')" class="h-9 px-5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('需求说明')+'</button>'+
        '<button type="button" onclick="openActionModal(\'inboundSave\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('保存入仓')+'</button>'+
        '<button type="button" onclick="openActionModal(\'exception\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('异常登记')+'</button>'+
        '<button type="button" onclick="openActionModal(\'resetEntry\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('重置')+'</button>'+
        '</div>';
    h+='</form></div>';
    setTimeout(function(){refreshShipmentCargoIndexes();calcShipmentCargoSummary();applyRuntimeEnhancements(document.getElementById('main-content'));var _wc=document.getElementById('warehouse-inbound-customer');if(_wc)fillDestWarehouseFromCustomer(_wc.value,'warehouse-inbound-dest');},0);
    return h;
}

function setupWarehouseInboundRemarkToggles(){
    return;
}

function toggleNoPreClaimChildren(btn,key){
    const rows=document.querySelectorAll('[data-claim-child="'+key+'"]');
    const willOpen=Array.from(rows).some(function(row){return row.classList.contains('hidden');});
    rows.forEach(function(row){row.classList.toggle('hidden',!willOpen);});
    if(btn)btn.textContent=willOpen?'-':'+';
}

function noPreClaimChildTable(rows){
    let html='<div class="rounded-lg border border-surface-200 overflow-hidden bg-white"><table class="w-full text-xs"><thead><tr class="bg-surface-50 text-text-secondary"><th class="text-left px-3 py-2">'+tr('子单号')+'</th><th class="text-left px-3 py-2">'+tr('品名')+'</th><th class="text-right px-3 py-2">'+tr('件数')+'</th><th class="text-right px-3 py-2">'+tr('重量')+'</th><th class="text-left px-3 py-2">'+tr('扫描时间')+'</th></tr></thead><tbody>';
    rows.forEach(function(r){
        html+='<tr class="border-t border-surface-100"><td class="px-3 py-2 font-medium text-primary-700">'+r[0]+'</td><td class="px-3 py-2 text-text-secondary">'+tr(r[1])+'</td><td class="px-3 py-2 text-right">'+r[2]+'</td><td class="px-3 py-2 text-right">'+r[3]+'</td><td class="px-3 py-2 text-text-secondary">'+r[4]+'</td></tr>';
    });
    html+='</tbody></table></div>';
    return html;
}

function buildNoPreClaimRows(count){
    const customers=['鑫达贸易','远洋物流','速达货运','蓝海跨境','华运达国际'];
    const sales=['李华','张伟','王明辉','刘晓东','陈浩'];
    const companies=['深圳分公司','广州分公司','上海分公司','义乌分公司'];
    const zones=['A区','B区','C区','待认领区','异常区'];
    const types=['客户认领','业务员认领','待匹配'];
    const names=['电子产品','服装配件','五金工具','家居用品','汽配零件'];
    const rows=[];
    for(let i=1;i<=count;i++){
        const no='RK20260526'+String(i).padStart(3,'0');
        const pcs=3+(i%18);
        const weight=(pcs*(8.5+(i%7)*2.4)).toFixed(1)+' KG';
        const cust=i%3===0?'-':customers[i%customers.length];
        const sale=i%3===0?'-':sales[i%sales.length];
        const childCount=1+(i%3);
        const children=[];
        for(let j=1;j<=childCount;j++){
            children.push([no+'-'+String(j).padStart(2,'0'),names[(i+j)%names.length],String(Math.max(1,Math.floor(pcs/childCount))),((parseFloat(weight)/childCount).toFixed(1)+' KG'),'2026-05-27 '+String(8+(i%10)).padStart(2,'0')+':'+String((i*3+j*7)%60).padStart(2,'0')+':'+String((i*5+j*11)%60).padStart(2,'0')]);
        }
        rows.push({key:'rk'+i,no:no,type:types[i%types.length],pcs:String(pcs),weight:weight,cust:cust,sales:sale,scan:'2026-05-27 '+String(8+(i%10)).padStart(2,'0')+':'+String((i*3)%60).padStart(2,'0')+':'+String((i*5)%60).padStart(2,'0'),company:companies[i%companies.length],zone:zones[i%zones.length],children:children});
    }
    return rows;
}

function buildNoPreForecastRows(count){
    const customers=['鑫达贸易','远洋物流','速达货运','蓝海跨境','华运达国际'];
    const products=['西非海运专线','西非空运专线','中东海运专线','欧洲铁路专线'];
    const statuses=['待收货','部分收货','待确认','已确认'];
    const countries=['塞内加尔','尼日利亚','加纳','科特迪瓦','喀麦隆'];
    const rows=[];
    for(let i=1;i<=count;i++){
        const pcs=2+(i%24);
        const weight=(pcs*(7.8+(i%6)*3.1)).toFixed(1)+' KG';
        const cbm=(pcs*(0.08+(i%5)*0.03)).toFixed(2)+' CBM';
        rows.push([
            'WB20260527'+String(i).padStart(3,'0'),
            'CUS-PO-'+String(8800+i),
            customers[i%customers.length],
            products[i%products.length],
            statuses[i%statuses.length],
            countries[i%countries.length],
            i%2===0?'10000':'100001',
            String(pcs),
            weight,
            cbm
        ]);
    }
    return rows;
}

function changeNoPreClaimPage(page,side){
    _listPage['wh-no-pre-in']=Math.max(1,page||1);
    const main=document.getElementById('main-content');
    if(main)main.innerHTML=generateHeadlessClaimListPage('wh-no-pre-in',_listPage['wh-no-pre-in']||1);
}

function jumpNoPreClaimPage(inputId,side,totalPages){
    const input=document.getElementById(inputId);
    const page=Math.min(Math.max(parseInt((input&&input.value)||'1',10)||1,1),totalPages);
    changeNoPreClaimPage(page,side);
}

function noPreClaimPagerHtml(side,page,totalPages,totalCount){
    const inputId='no-pre-'+side+'-jump';
    const L=_lang[_currentLang]||{};
    let html='<div class="flex items-center justify-between gap-3 mt-4 flex-wrap"><div class="text-sm text-text-muted">'+tr('共')+' '+totalCount+' '+tr('条数据')+'，'+tr('第')+' '+page+' / '+totalPages+' '+tr('页')+'，'+_noPreClaimPageSize+(L.perPage||tr('条/页'))+'</div>';
    html+='<div class="flex items-center gap-1 flex-wrap">';
    html+='<button type="button" onclick="changeNoPreClaimPage('+(page-1)+',\''+side+'\')" class="w-8 h-8 flex items-center justify-center rounded border border-surface-200 text-text-muted hover:bg-surface-50 cursor-pointer'+(page<=1?' opacity-50 pointer-events-none':'')+'">&lt;</button>';
    for(let p=1;p<=totalPages;p++){
        if(totalPages<=7||p<=2||p>totalPages-2||Math.abs(p-page)<=1){
            html+='<button type="button" onclick="changeNoPreClaimPage('+p+',\''+side+'\')" class="w-8 h-8 flex items-center justify-center rounded border '+(p===page?'border-primary-600 text-primary-600 bg-primary-50 font-medium':'border-surface-200 text-text-secondary hover:bg-surface-50')+' text-sm cursor-pointer">'+p+'</button>';
        }else if(p===3||p===totalPages-2){
            html+='<span class="text-text-muted text-xs px-1">...</span>';
        }
    }
    html+='<button type="button" onclick="changeNoPreClaimPage('+(page+1)+',\''+side+'\')" class="w-8 h-8 flex items-center justify-center rounded border border-surface-200 text-text-muted hover:bg-surface-50 cursor-pointer'+(page>=totalPages?' opacity-50 pointer-events-none':'')+'">&gt;</button>';
    html+='<span class="text-sm text-text-muted ml-2">'+tr('跳至')+'</span><input id="'+inputId+'" type="number" min="1" max="'+totalPages+'" value="'+page+'" class="w-14 h-8 px-2 text-sm text-center border border-surface-200 rounded-lg bg-white" onkeydown="if(event.key===\'Enter\')jumpNoPreClaimPage(\''+inputId+'\',\''+side+'\','+totalPages+')"><button type="button" onclick="jumpNoPreClaimPage(\''+inputId+'\',\''+side+'\','+totalPages+')" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('跳转')+'</button>';
    html+='</div></div>';
    return html;
}

function generateNoPreClaimPage(id){
    const key=id||'wh-no-pre-in';
    return generateHeadlessClaimListPage(key,_listPage[key]||1);
}

