function billFeeDetailRows(rowData){
    const customer=rowData&&rowData[3]?rowData[3]:'深圳市华运达国际货运';
    const currency=rowData&&rowData[4]?rowData[4]:'CNY';
    return [
        ['WB-20260522001','SF10086523',customer,'基础运费',currency,currency==='CNY'?'1.0000':'7.2450',rowData&&rowData[5]?rowData[5]:'0.00','账单费用明细'],
        ['WB-20260522001','SF10086523',customer,'报关服务费',currency,currency==='CNY'?'1.0000':'7.2450','350.00','报关费票件'],
        ['WB-20260522002','YT98876543',customer,'国内段运费',currency,currency==='CNY'?'1.0000':'7.2450','680.00','国内仓操作费用']
    ];
}

function openBillDetailModal(id,rowIdx){
    const rowData=(rowIdx>=0&&_listData[id])?_listData[id][rowIdx]:getRowsByIndices(id,getSelectedRowIndices())[0];
    const modal=document.getElementById('crud-modal');
    document.getElementById('crud-modal-title').textContent=tr('查询详情')+' - '+tr((TC[id]&&TC[id].t)||'账单管理');
    let html='<div class="border border-blue-100 rounded-lg overflow-auto bg-white"><table class="w-full text-sm" style="min-width:900px"><thead class="bg-blue-50"><tr>';
    ['运单号','物流单号','客户名称','费用名称','币别','汇率','金额','备注说明'].forEach(function(hd){html+='<th class="text-left px-3 py-2 border-r border-blue-100 whitespace-nowrap">'+tr(hd)+'</th>';});
    html+='</tr></thead><tbody>';
    billFeeDetailRows(rowData).forEach(function(row){
        html+='<tr class="border-t border-surface-100 hover:bg-primary-50/30">';
        row.forEach(function(cell,idx){html+='<td class="px-3 py-2 whitespace-nowrap '+(idx===0?'font-medium text-primary-700':'text-text-secondary')+'">'+esc(cell)+'</td>';});
        html+='</tr>';
    });
    html+='</tbody></table></div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    modal.classList.add('show');
}

function openCopyWaybillModal(id,rowIdx){
    const idx=rowIdx>=0?rowIdx:getSelectedRowIndex();
    const rowData=(idx>=0&&_listData[id])?_listData[id][idx]:null;
    if(!rowData){openActionModal('selectRequired',id,-1);return;}
    const c=TC[id];
    const headers=dataHeaders(c);
    const modal=document.getElementById('crud-modal');
    document.getElementById('crud-modal-title').textContent=tr('复制运单')+' - '+tr(c.t);
    let html='<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
    headers.forEach(function(hd,i){
        if(hd==='操作')return;
        let val=rowData[i]||'';
        if(i===0)val=String(val||'WB').replace(/-COPY.*$/,'')+'-COPY';
        if(hd.includes('物流单号'))val='';
        if(hd.includes('运单状态')||hd==='状态')val='草稿';
        const isStatus=hd.includes('状态');
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(hd)+'</label>';
        if(isStatus){
            html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(c.s||['草稿','已预报'],val)+'</select>';
        }else{
            html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(val)+'">';
        }
        html+='</div>';
    });
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('新增成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提交')+'</button>';
    modal.classList.add('show');
}

function noPreSelectedRow(id,rowIdx){
    const idx=rowIdx>=0?rowIdx:getSelectedRowIndex();
    return {idx:idx,row:(idx>=0&&_listData[id])?_listData[id][idx]:null};
}

function openNoPrePhotoUploadModal(id,rowIdx){
    const c=TC[id]||{};
    let indices=getSelectedRowIndices();
    if(!indices.length&&rowIdx>=0)indices=[rowIdx];
    indices=Array.from(new Set(indices)).filter(function(idx){return idx>=0&&_listData[id]&&_listData[id][idx];});
    if(!indices.length){openActionModal('selectRequired',id,-1);return;}
    const rows=indices.map(function(idx){return _listData[id][idx];}).filter(Boolean);
    const firstRow=rows[0];
    const images=getTableValueByHeader(c,firstRow,'图片','').split('|').filter(Boolean);
    window._noPrePhotoUploadContext={id:id,indices:indices};
    document.getElementById('crud-modal-title').textContent=tr('上传图片')+' - '+tr((TC[id]&&TC[id].t)||'无头件认领');
    let html='<div class="space-y-4">';
    html+='<div class="rounded-lg border border-primary-100 bg-primary-50 p-3 text-sm text-primary-800">'+tr('已勾选')+' <span class="font-semibold">'+rows.length+'</span> '+tr('条数据')+'，'+tr('上传后的图片会写入勾选无头件的图片列。')+'</div>';
    html+='<div class="overflow-auto rounded-lg border border-surface-200 bg-white"><table class="w-full text-sm" style="min-width:720px"><thead class="bg-[#EFF6FF]"><tr>';
    ['无头单号','物流单号','到货仓库','入库件数','所属客户','品名'].forEach(function(hd){html+='<th class="px-3 py-2 text-left text-text-secondary whitespace-nowrap">'+tr(hd)+'</th>';});
    html+='</tr></thead><tbody>';
    rows.slice(0,6).forEach(function(row){
        html+='<tr class="border-t border-surface-100">';
        ['无头单号','物流单号','到货仓库','入库件数','所属客户','品名'].forEach(function(hd,idx){
            const val=getTableValueByHeader(c,row,hd,'');
            html+='<td class="px-3 py-2 whitespace-nowrap '+(idx===0?'font-medium text-primary-700':'text-text-secondary')+'">'+esc(val)+'</td>';
        });
        html+='</tr>';
    });
    if(rows.length>6){
        html+='<tr class="border-t border-surface-100"><td colspan="6" class="px-3 py-2 text-xs text-text-muted">'+tr('其余')+' '+(rows.length-6)+' '+tr('条数据')+'...</td></tr>';
    }
    html+='</tbody></table></div>';
    html+=noPrePhotoUploadHtml('no-pre-modal-photo-list','no-pre-modal-photo-input',images);
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="confirmNoPrePhotoUpload()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认上传')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function confirmNoPrePhotoUpload(){
    const ctx=window._noPrePhotoUploadContext||{};
    const id=ctx.id||'wh-no-pre-in';
    const c=TC[id]||{};
    const indices=ctx.indices||[];
    const imgIdx=(c.h||[]).findIndex(function(hd){return hd==='图片'||String(hd||'').includes('图片');});
    if(imgIdx<0){showToast(tr('未找到图片列'));return;}
    const names=Array.from(document.querySelectorAll('#no-pre-modal-photo-list .no-pre-photo-item')).map(function(item){
        return item.dataset.photoName||'';
    }).filter(Boolean).slice(0,5);
    if(!names.length){showToast(tr('请先上传图片'));return;}
    indices.forEach(function(idx){
        const row=_listData[id]&&_listData[id][idx];
        if(row){
            const value=names.join('|');
            row[imgIdx]=value;
            setRowOverride(id,row,imgIdx,value);
        }
    });
    window._noPrePhotoUploadContext=null;
    closeCrudModal();
    const main=document.getElementById('main-content');
    if(main)main.innerHTML=generateHeadlessClaimListPage(id,_listPage[id]||1,_statusFilterVal||'');
    showToast(tr('上传成功'));
}

function noPreClaimCargoRowsHtml(count,startIdx){
    startIdx=startIdx||0;
    let html='';
    for(let i=0;i<count;i++){
        html+='<tr class="no-pre-claim-cargo-row">'+
            '<td class="w-10 px-2 py-1.5 text-center text-xs text-text-muted bg-surface-50 border-b border-surface-200"><span class="cargo-index">'+(startIdx+i+1)+'</span></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="text" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="number" min="0" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none text-center"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="number" min="0" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none text-center"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="text" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="text" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="text" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none"></td>'+
            '<td class="px-0 border-b border-l border-surface-200"><input type="text" class="w-full h-8 px-2 text-sm bg-white focus:bg-primary-50 outline-none"></td>'+
            '<td class="w-16 px-2 py-1.5 text-center border-b border-l border-surface-200"><button type="button" onclick="removeNoPreClaimCargoRow(this)" class="text-red-500 hover:text-red-600 text-xs cursor-pointer">'+tr('删除')+'</button></td>'+
        '</tr>';
    }
    return html;
}

function refreshNoPreClaimCargoIndexes(){
    document.querySelectorAll('#no-pre-claim-cargo-body .no-pre-claim-cargo-row').forEach(function(row,i){
        const idx=row.querySelector('.cargo-index');
        if(idx)idx.textContent=i+1;
    });
}

function addNoPreClaimCargoRow(){
    const tbody=document.getElementById('no-pre-claim-cargo-body');
    if(!tbody)return;
    const count=tbody.querySelectorAll('.no-pre-claim-cargo-row').length;
    tbody.insertAdjacentHTML('beforeend',noPreClaimCargoRowsHtml(1,count));
    refreshNoPreClaimCargoIndexes();
}

function removeNoPreClaimCargoRow(btn){
    const tbody=document.getElementById('no-pre-claim-cargo-body');
    if(!tbody)return;
    if(tbody.querySelectorAll('.no-pre-claim-cargo-row').length<=1){
        showToast(tr('至少保留一行'));
        return;
    }
    const row=btn.closest('.no-pre-claim-cargo-row');
    if(row)row.remove();
    refreshNoPreClaimCargoIndexes();
}

function openNoPreClaimModal(id,rowIdx){
    const picked=noPreSelectedRow(id,rowIdx);
    const c=TC[id]||{};
    const rowData=picked.row;
    const customers=getNoPreCustomerOptions();
    const currentCustomer=getTableValueByHeader(c,rowData,'所属客户',customers[0]||'');
    const warehouseOptions=getWarehouseNameOptions();
    const currentWarehouse=getTableValueByHeader(c,rowData,'到货仓库',currentAccountWarehouse());
    const currentPcs=getTableValueByHeader(c,rowData,'入库件数','1');
    document.getElementById('crud-modal-title').textContent=tr('无头件认领')+' - '+tr(c.t||'无头件认领');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='76%';
    let html='<div class="space-y-5">';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('基础信息')+'</div>';
    html+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('无头单号')+'</label><input type="text" readonly class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(getTableValueByHeader(c,rowData,'无头单号','自动生成'))+'"></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('物流单号')+'</label><input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(getTableValueByHeader(c,rowData,'物流单号',''))+'" placeholder="'+esc(tr('请输入物流单号'))+'"></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('所属客户')+'</label><select required class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(customers,currentCustomer)+'</select></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('收货仓库')+'</label><select required class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(warehouseOptions,currentWarehouse)+'</select></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('运输方式')+'</label><select required class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['海运','空运','铁路','快递'],'海运')+'</select></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('件数')+'</label><input type="number" min="0" required class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(currentPcs)+'"></div>';
    html+='</div></div>';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('附加服务')+'</div>'+
        '<div class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">'+
            ['报关','木箱','仿牌','带电','带磁','贴箱唛'].map(function(o){
                return '<label class="inline-flex items-center gap-1 text-sm text-text-secondary cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600" data-cb-label="'+esc(o)+'"><span>'+esc(tr(o))+'</span><span class="inline-flex w-4 h-4 items-center justify-center rounded-full bg-surface-100 border border-surface-200 text-[11px] font-bold leading-none text-text-muted cursor-help" title="'+esc(serviceChargeTooltip(o))+'">?</span></label>';
            }).join('')+
        '</div>'+
    '</div>';
    html+='<div>'+
        '<div class="flex items-center justify-between mb-3">'+
            '<div class="text-sm font-semibold text-text-primary">'+tr('品名录入')+'</div>'+
            '<button type="button" onclick="addNoPreClaimCargoRow()" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50 cursor-pointer">+ '+tr('新增行')+'</button>'+
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
                '<tbody id="no-pre-claim-cargo-body">'+noPreClaimCargoRowsHtml(3)+'</tbody>'+
            '</table>'+
        '</div>'+
    '</div>';
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('认领成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openNoPreGenerateOrderModal(id,rowIdx){
    const picked=noPreSelectedRow(id,rowIdx);
    const c=TC[id]||{};
    const rowData=picked.row;
    const warehouse=getTableValueByHeader(c,rowData,'到货仓库',currentAccountWarehouse());
    const pcs=getTableValueByHeader(c,rowData,'入库件数','1');
    const images=getTableValueByHeader(c,rowData,'图片','');
    const logisticsNo=getTableValueByHeader(c,rowData,'物流单号','');
    const customers=getNoPreCustomerOptions();
    const currentCustomer=getTableValueByHeader(c,rowData,'所属客户',customers[0]||'');
    const currentSales=getTableValueByHeader(c,rowData,'所属业务员',noPreCustomerSalesMap()[currentCustomer]||'');
    const cargoName=getTableValueByHeader(c,rowData,'品名','');
    const salesOptions=getNoPreSalesOptions(currentSales);
    document.getElementById('crud-modal-title').textContent=tr('生成预录单')+' - '+tr(c.t||'无头件认领');
    let html='<div class="space-y-4">';
    html+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('物流单号')+'</label><input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(logisticsNo)+'" placeholder="'+esc(tr('请输入物流单号'))+'"></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('到货仓库')+'</label><select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(getWarehouseNameOptions(),warehouse)+'</select></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('入库件数')+'</label><input type="number" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(pcs)+'"></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('所属客户')+' <span class="text-red-500">*</span></label><select required class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" onchange="handleNoPreCustomerChange(this,\'no-pre-gen-sales\')">'+selectOptionsHtml(customers,currentCustomer)+'</select></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('所属业务员')+' <span class="text-red-500">*</span></label><select id="no-pre-gen-sales" required class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(salesOptions,currentSales)+'</select></div>';
    html+='<div class="md:col-span-2 flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('品名')+'</label><input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(cargoName)+'"></div>';
    html+='</div>';
    html+='<div><div class="text-sm font-medium text-text-secondary mb-2">'+tr('图片预览')+'</div><div class="rounded-lg border border-surface-200 bg-surface-50 p-3">'+renderNoPreImageThumbs(images)+'</div></div>';
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('订单已生成')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 cursor-pointer">'+tr('生成订单')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

