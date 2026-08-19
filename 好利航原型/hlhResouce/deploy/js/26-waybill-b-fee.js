function selectedDataSummary(id,rowData){
    if(rowData)return '<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 mb-4 text-sm text-text-secondary">'+tr('当前数据')+'：<span class="font-medium text-text-primary">'+esc(rowData[0])+'</span></div>';
    const count=document.querySelectorAll('.row-check:checked').length;
    if(count>0)return '<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 mb-4 text-sm text-text-secondary">'+tr('已勾选')+'：<span class="font-medium text-text-primary">'+count+'</span> '+tr('条数据')+'</div>';
    return '<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 mb-4 text-sm text-text-secondary">'+tr('未勾选数据，将按当前页面或筛选条件处理。')+'</div>';
}

function waybillDetailSummaryHtml(id,rowData){
    const c=TC[id]||{};
    const hArr=c.h||[];
    const val=function(label){
        const idx=hArr.indexOf(label);
        if(idx<0)return '';
        const v=rowData[idx];
        return v===undefined||v===null?'':String(v);
    };
    const waybill=val('运单号')||(rowData&&rowData[0])||'';
    const weightRaw=val('重量(KG)')||val('重量');
    const cbmRaw=val('体积(CBM)')||val('体积');
    const weightNum=parseFloat(String(weightRaw).replace(/[^\d.]/g,''))||0;
    const cbmNum=parseFloat(String(cbmRaw).replace(/[^\d.]/g,''))||0;
    const volumeWeight=cbmNum>0?(cbmNum*167).toFixed(2)+' KG':'—';
    const settleWeight=Math.max(weightNum,cbmNum*167);
    const settleDisplay=(cbmNum>0||weightNum>0)?(cbmRaw||'—')+' / '+settleWeight.toFixed(2)+' KG':'—';
    const cargoType=val('货物类型')||val('品名信息')||'普货';
    const items=[
        ['客户名称',val('客户名称')||'—'],
        ['产品',val('所属产品')||'—'],
        ['发货仓库',val('国内仓库')||'—'],
        ['目的仓库',val('目的仓库')||'—'],
        ['件数',val('件数')||'—'],
        ['货物类型',cargoType],
        ['收货仓库',val('海外提货仓')||val('目的仓库')||'—'],
        ['实际重量',weightRaw?weightRaw+(String(weightRaw).indexOf('KG')<0?' KG':''):'—'],
        ['实际体积',cbmRaw?cbmRaw+(String(cbmRaw).indexOf('CBM')<0?' CBM':''):'—'],
        ['实际体积重',volumeWeight],
        ['结算体积/重量',settleDisplay]
    ];
    let html='<div class="rounded-lg border border-primary-100 bg-primary-50/40 p-3 mb-4">';
    html+='<div class="flex items-center justify-between mb-2"><div class="text-sm font-semibold text-primary-700">'+tr('运单信息')+'</div><div class="text-xs text-text-muted">'+esc(waybill)+'</div></div>';
    html+='<div class="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2">';
    items.forEach(function(item){
        html+='<div class="flex flex-col gap-0.5 min-w-0"><span class="text-[11px] text-text-muted">'+tr(item[0])+'</span><span class="text-sm font-medium text-text-primary break-all">'+esc(item[1])+'</span></div>';
    });
    html+='</div></div>';
    return html;
}

function getRowsByIndices(id,indices){
    const data=_listData[id]||[];
    return (indices||[]).map(function(idx){return data[idx];}).filter(Boolean);
}

function getSelectedWaybillRows(id,rowIdx){
    const rows=getRowsByIndices(id,getSelectedRowIndices());
    if(rows.length)return rows;
    if(rowIdx>=0&&_listData[id]&&_listData[id][rowIdx])return [_listData[id][rowIdx]];
    return [];
}

function waybillBillingSummaryHtml(id,rowIdx){
    const rows=getSelectedWaybillRows(id,rowIdx);
    if(!rows.length)return selectedDataSummary(id,null);
    if(rows.length===1)return selectedDataSummary(id,rows[0]);
    let html='<div class="rounded-lg border border-surface-200 bg-surface-50 p-3 mb-4">';
    html+='<div class="text-sm text-text-secondary mb-2">'+tr('已勾选')+'：<span class="font-medium text-text-primary">'+rows.length+'</span> '+tr('条运单')+'</div>';
    html+='<div class="overflow-x-auto rounded border border-surface-200 bg-white"><table class="w-full text-sm min-w-[720px]"><thead class="bg-[#EFF6FF]"><tr>';
    ['运单号','物流单号','客户名称','件数','重量(KG)','体积(CBM)','运费'].forEach(function(hd){html+='<th class="px-3 py-2 text-left text-text-secondary whitespace-nowrap">'+tr(hd)+'</th>';});
    html+='</tr></thead><tbody>';
    rows.forEach(function(row){
        html+='<tr class="border-t border-surface-100">';
        [['运单号'],['物流单号'],['客户名称'],['件数'],['重量'],['体积'],['运费']].forEach(function(names,idx){
            const val=waybillCell(id,row,names,'—');
            html+='<td class="px-3 py-2 whitespace-nowrap '+(idx===0?'font-medium text-primary-700':'text-text-secondary')+'">'+esc(val)+'</td>';
        });
        html+='</tr>';
    });
    html+='</tbody></table></div></div>';
    return html;
}

function headerIndexByNames(id,names){
    const c=TC[id];
    const headers=dataHeaders(c);
    for(let i=0;i<headers.length;i++){
        const hd=String(headers[i]||'');
        if((names||[]).some(function(name){return hd===name||hd.includes(name);}))return i;
    }
    return -1;
}

function waybillCell(id,row,names,fallback){
    const idx=headerIndexByNames(id,names);
    const val=idx>=0&&row?row[idx]:'';
    return val===undefined||val===null||val===''?(fallback||'—'):val;
}

function openWaybillDeclarationModal(action,id,rowIdx){
    const rows=getSelectedWaybillRows(id,rowIdx);
    const titleMap={mergeDeclare:'合并报关',splitDeclare:'拆分报关',singleDeclare:'单独报关'};
    const title=titleMap[action]||'报关操作';
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    document.getElementById('crud-modal-title').textContent=tr(title);
    let body='';
    if(action==='mergeDeclare'){
        body+='<div class="space-y-3">';
        body+='<div class="text-sm text-text-secondary">'+tr('请选择报关费票件')+'</div>';
        body+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('勾选的运单')+'</label><select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" '+(rows.length?'':'disabled')+'>';
        if(rows.length){
            rows.forEach(function(row){
                const waybill=waybillCell(id,row,['运单号'],'');
                const logistics=waybillCell(id,row,['物流单号'],'');
                const customer=waybillCell(id,row,['客户名称'],'');
                body+='<option value="'+esc(waybill)+'">'+esc(waybill+' / '+logistics+' / '+customer)+'</option>';
            });
        }else{
            body+='<option>'+tr('请先勾选运单')+'</option>';
        }
        body+='</select></div></div>';
    }else if(action==='splitDeclare'){
        const row=rows[0]||null;
        body+='<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
        body+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('运单号')+'</label><input type="text" readonly class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(waybillCell(id,row,['运单号'],''))+'"></div>';
        body+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('物流号')+'</label><input type="text" readonly class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(waybillCell(id,row,['物流单号'],''))+'"></div>';
        body+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('拆分票数')+'</label><input type="number" min="2" value="2" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"></div>';
        body+='</div>';
        if(!row)body='<div class="text-sm text-text-secondary mb-3">'+tr('请先勾选运单')+'</div>'+body;
    }else{
        const row=rows[0]||null;
        body+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-4 text-sm text-text-secondary">';
        body+=tr('是否确认单独报关');
        if(row)body+='<div class="mt-2 text-text-primary font-medium">'+esc(waybillCell(id,row,['运单号'],''))+'</div>';
        body+='</div>';
    }
    bodyEl.innerHTML=body;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('操作成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer">'+tr('确认')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function convertSelectedDraftOrders(id){
    const indices=getSelectedRowIndices();
    if(indices.length===0){showToast(tr('请先勾选草稿状态订单'));return;}
    const c=TC[id];
    const si=headerIndexByNames(id,['运单状态','状态']);
    if(si<0){showToast(tr('未找到状态列'));return;}
    let count=0;
    getRowsByIndices(id,indices).forEach(function(row){
        if(row&&row[si]==='草稿'){
            setRowOverride(id,row,si,'已预报');
            count++;
        }
    });
    if(count===0){showToast(tr('请勾选草稿状态订单'));return;}
    document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal||'');
    showToast(tr('已转为正式单')+'：'+count+tr('条数据'));
}

function openWaybillDetail(id,rowIdx){
    const row=rowIdx>=0&&_listData[id]?_listData[id][rowIdx]:null;
    if(!row){showToast(tr('请选择数据'));return;}
    const key=rowKey(row)||('detail-'+Date.now());
    const detailId='waybill-detail-'+key.replace(/[^A-Za-z0-9_-]/g,'-');
    _waybillDetailStore[detailId]={sourceId:id,row:row.slice()};
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('详情')+' - '+waybillCell(id,row,['运单号'],'');
    document.getElementById('crud-modal-body').innerHTML=renderWaybillDetailInner(detailId,id,row);
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
    setTimeout(function(){applyRuntimeEnhancements(document.getElementById('crud-modal-body'));},0);
}

function waybillDetailItem(label,value){
    return '<div class="flex items-center justify-between gap-4 text-sm"><span class="text-text-secondary">'+tr(label)+'：</span><span class="text-text-primary font-medium text-right truncate">'+esc(value||'—')+'</span></div>';
}

function waybillDetailCard(bg,items){
    let html='<div class="'+bg+' rounded-lg border border-blue-100 p-4 min-h-[138px] space-y-3">';
    items.forEach(function(item){html+=waybillDetailItem(item[0],item[1]);});
    html+='</div>';
    return html;
}

function waybillCostRows(id,row){
    const waybill=waybillCell(id,row,['运单号'],'');
    const freight=waybillCell(id,row,['运费'],'CNY 0');
    return [
        [waybill,'基础运费',freight,'CNY','未核销','2026-06-02 10:31:45','系统算费'],
        [waybill,'国内段运费','CNY 680','CNY','未核销','2026-06-02 10:32:53','仓库入仓'],
        [waybill,'报关服务费','CNY 350','CNY','未核销','2026-06-02 17:26:43','人工录入']
    ];
}

function renderWaybillCostTable(id,row,title){
    let html='<div class="text-sm font-semibold text-primary-700 border-l-2 border-primary-500 pl-2 mb-3">'+tr(title)+'</div>';
    html+='<div class="border border-blue-100 overflow-auto bg-white rounded-lg" style="height:300px">';
    html+='<table class="w-full text-sm" style="min-width:820px"><thead class="bg-blue-50 sticky top-0"><tr>';
    ['#','运单号','费用名称','金额(原币)','币别','核销标识','费用时间','数据来源'].forEach(function(hd){html+='<th class="text-left px-3 py-2 border-r border-surface-200 whitespace-nowrap">'+tr(hd)+'</th>';});
    html+='</tr></thead><tbody>';
    waybillCostRows(id,row).forEach(function(r,i){
        html+='<tr class="border-t border-surface-100 hover:bg-primary-50/30"><td class="px-3 py-2 font-medium">'+(i+1)+'</td>';
        r.forEach(function(cell,ci){html+='<td class="px-3 py-2 whitespace-nowrap '+(ci===0?'text-primary-700 font-medium':'text-text-secondary')+'">'+esc(cell)+'</td>';});
        html+='</tr>';
    });
    html+='</tbody></table></div>';
    return html;
}

function waybillVolumeWeight(cbm){
    const n=parseFloat(String(cbm||'').replace(/[,，]/g,''));
    if(!isFinite(n)||n<=0)return '—';
    return (n*167).toFixed(2);
}

function renderWaybillSimpleTable(headers,rows,minWidth){
    let html='<div class="border border-blue-100 rounded-lg overflow-auto bg-white">';
    html+='<table class="w-full text-sm" style="min-width:'+(minWidth||760)+'px"><thead class="bg-blue-50"><tr>';
    headers.forEach(function(hd){html+='<th class="text-left px-3 py-2 border-r border-blue-100 whitespace-nowrap">'+tr(hd)+'</th>';});
    html+='</tr></thead><tbody>';
    rows.forEach(function(row){
        html+='<tr class="border-t border-surface-100 hover:bg-primary-50/30">';
        row.forEach(function(cell){html+='<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(cell||'—')+'</td>';});
        html+='</tr>';
    });
    html+='</tbody></table></div>';
    return html;
}

function renderWaybillTrackTimeline(waybill){
    var events=[
        {time:'2026-07-21 10:49:39',by:'测试业务-华洋达',loc:'',cn:'创建订单',en:'Order Created'},
        {time:'2026-07-21 10:49:39',by:'测试业务-华洋达',loc:'',cn:'提交预报',en:'Shipment information sent to service provider'},
        {time:'2026-07-21 11:32:53',by:'仓库员-赵敏',loc:'深圳盐田仓',cn:'已入仓',en:'Received at warehouse'},
        {time:'2026-07-22 09:15:20',by:'系统',loc:'深圳盐田仓',cn:'已配舱',en:'Space booked / Loaded'}
    ];
    var h='<div class="pl-1 py-1">';
    events.forEach(function(e,i){
        var last=i===events.length-1;
        h+='<div class="relative pl-6 '+(last?'':'pb-5')+'">';
        if(!last)h+='<span class="absolute left-[6px] top-4 bottom-0 w-px bg-surface-200"></span>';
        h+='<span class="absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-green-500 bg-white"></span>';
        h+='<div class="text-sm font-semibold text-text-primary">'+esc(e.time)+'　【'+tr('创建人')+'：'+esc(e.by)+'　'+tr('发生地')+'：'+esc(e.loc||'')+'】</div>';
        h+='<div class="text-sm text-text-secondary mt-0.5">'+esc(e.cn)+'　'+esc(e.en)+'</div>';
        h+='</div>';
    });
    h+='</div>';
    return h;
}

/* ===== 运单详情 · 附件信息：表格式（序号/文件名称/文件类型/缩略图/大小/上传人/上传时间/操作）===== */
var WAYBILL_ATTACH_TYPES=['原始报关预录单','修改报关预录单','商业发票','装箱单','其他'];
var _waybillAttachSeed=[
    {name:'temp.txt',type:'原始报关预录单',size:'0',uploader:'HYD-开发者',time:'2026-08-18 11:37:01'},
    {name:'temp.txt',type:'修改报关预录单',size:'0',uploader:'HYD-开发者',time:'2026-08-18 11:38:35'}
];

function waybillNowText(){
    const d=new Date(),p=function(n){return (n<10?'0':'')+n;};
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
}

function waybillAttachmentRowHtml(f,i){
    let h='<tr class="attachment-row border-t border-surface-100 hover:bg-primary-50/30">';
    h+='<td class="px-3 py-2.5 text-primary-700 font-medium">'+(i+1)+'</td>';
    h+='<td class="px-3 py-2.5 text-primary-700 font-medium">'+esc(f.name||'')+'</td>';
    h+='<td class="px-3 py-2.5 text-text-secondary whitespace-nowrap">'+esc(f.type||'—')+'</td>';
    /* 缩略图：非图片附件统一占位 */
    h+='<td class="px-3 py-2.5"><span class="inline-flex items-center justify-center w-11 h-10 px-1 text-[10px] leading-tight text-center text-text-muted bg-surface-50 border border-surface-200 rounded">'+tr('暂无图片')+'</span></td>';
    h+='<td class="px-3 py-2.5 text-text-secondary">'+esc(String(f.size==null?'0':f.size))+'</td>';
    h+='<td class="px-3 py-2.5 text-text-secondary whitespace-nowrap">'+esc(f.uploader||'—')+'</td>';
    h+='<td class="px-3 py-2.5 text-text-secondary whitespace-nowrap">'+esc(f.time||'—')+'</td>';
    h+='<td class="px-3 py-2.5 whitespace-nowrap">';
    h+='<button type="button" onclick="showToast(\''+tr('开始下载')+'\')" class="px-3 py-1 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded cursor-pointer">'+tr('下载')+'</button> ';
    h+='<button type="button" onclick="removeWaybillAttachment(this)" class="px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded cursor-pointer">'+tr('删除')+'</button>';
    h+='</td></tr>';
    return h;
}

function waybillAttachmentEmptyRowHtml(){
    return '<tr class="attachment-empty"><td colspan="8" class="py-10 text-center text-text-muted">'+tr('无数据')+'</td></tr>';
}

/* 删除/新增后重排序号，并维护空态行 */
function refreshWaybillAttachmentRows(tbody){
    if(!tbody)return;
    const rows=tbody.querySelectorAll('tr.attachment-row');
    rows.forEach(function(tr,i){ if(tr.children[0])tr.children[0].textContent=i+1; });
    const empty=tbody.querySelector('tr.attachment-empty');
    if(rows.length&&empty)empty.remove();
    if(!rows.length&&!empty)tbody.insertAdjacentHTML('beforeend',waybillAttachmentEmptyRowHtml());
}

function removeWaybillAttachment(btn){
    const tr=btn.closest('tr'),tbody=tr?tr.parentNode:null;
    if(tr)tr.remove();
    refreshWaybillAttachmentRows(tbody);
}

/* 独立的上传处理：通用 handleFileUpload 追加的是 div，塞进 tbody 会被浏览器提出表格外 */
function handleWaybillAttachmentUpload(input,tbodyId){
    const tbody=document.getElementById(tbodyId);
    if(!tbody||!input.files)return;
    const sel=document.getElementById(tbodyId+'-type');
    const ftype=sel?sel.value:'其他';
    Array.from(input.files).forEach(function(file){
        const kb=Math.max(0,Math.round(file.size/1024));
        const idx=tbody.querySelectorAll('tr.attachment-row').length;
        tbody.insertAdjacentHTML('beforeend',waybillAttachmentRowHtml({name:file.name,type:ftype,size:String(kb),uploader:'HYD-开发者',time:waybillNowText()},idx));
    });
    refreshWaybillAttachmentRows(tbody);
    input.value='';
}

function renderWaybillAttachmentPanel(detailId){
    const prefix=detailId+'-attachment';
    const tbodyId=detailId+'-attachment-body';
    let html='<div class="flex items-center justify-between gap-3 flex-wrap mb-3">';
    html+='<div class="text-sm font-semibold text-primary-700">'+tr('附件信息')+'</div>';
    html+='<div class="flex items-center gap-2">';
    html+='<label class="text-sm text-text-secondary whitespace-nowrap">'+tr('附件类型')+'</label>';
    html+='<select id="'+tbodyId+'-type" class="h-8 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 w-44">'+WAYBILL_ATTACH_TYPES.map(function(o){return '<option>'+esc(o)+'</option>';}).join('')+'</select>';
    html+='<button type="button" onclick="triggerFileUpload(\''+prefix+'\')" class="h-8 px-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('附件上传')+'</button>';
    html+='<input type="file" id="'+prefix+'-file-input" class="hidden" multiple onchange="handleWaybillAttachmentUpload(this,\''+tbodyId+'\')">';
    html+='</div></div>';
    html+='<div class="border border-blue-100 rounded-lg overflow-auto bg-white"><table class="w-full text-sm" style="min-width:1080px"><thead class="bg-blue-50"><tr>';
    ['序号','文件名称','文件类型','缩略图','文件大小(kb)','上传人','上传时间','操作'].forEach(function(hd){html+='<th class="text-left px-3 py-2 border-r border-blue-100 whitespace-nowrap">'+tr(hd)+'</th>';});
    html+='</tr></thead><tbody id="'+tbodyId+'">';
    if(_waybillAttachSeed.length){_waybillAttachSeed.forEach(function(f,i){html+=waybillAttachmentRowHtml(f,i);});}
    else{html+=waybillAttachmentEmptyRowHtml();}
    html+='</tbody></table></div>';
    return html;
}

function renderWaybillDetailPanels(detailId,id,row){
    const waybill=waybillCell(id,row,['运单号'],'');
    const weight=waybillCell(id,row,['重量'],'');
    const cbm=waybillCell(id,row,['体积'],'');
    const remark=waybillCell(id,row,['仓库异常备注','备注'],'');
    const feePanel='<div class="space-y-4">'+renderWaybillCostTable(id,row,'应收')+(id==='wb-manage'?renderWaybillCostTable(id,row,'业务成本'):'')+'</div>';
    const cargoRows=[
        ['手机配件','5','20','小米','塑料','8517709000'],
        ['服装配件','3','50','ZARA','棉','6117909000'],
        ['五金工具','2','30','STANLEY','金属','8203200000']
    ];
    const panels=[
        ['品名信息',renderWaybillSimpleTable(['品名','箱数','单箱数量','品牌','材质','海关编码'],cargoRows,860)],
        ['费用信息',feePanel],
        ['材积信息',renderWaybillSimpleTable(['运单子单号','收货重量（KG）','长（CM）','宽（CM）','体积（M3）','收货体积重'],[[waybill+'-01',weight,'—','—',cbm,waybillVolumeWeight(cbm)]],760)],
        ['指令日志',renderWaybillSimpleTable(['运单号','指令类型','指令内容','指令备注'],[
            [waybill,'收货复核','核对到货件数与预报是否一致','实收 12 件，与预报一致'],
            [waybill,'开箱验货','对整票货物开箱核对品名与数量','客户要求拍照留档'],
            [waybill,'库内盘点','复核在库件数与重量','较预报少 1 件，已通知客服跟进'],
            [waybill,'出货复核','装柜前复核唛头与目的仓','—']
        ],860)],
        ['附件信息',renderWaybillAttachmentPanel(detailId)],
        ['轨迹信息',renderWaybillTrackTimeline(waybill)],
        ['备注说明',renderWaybillSimpleTable(['备注内容','备注人','备注来源','备注时间'],[[remark||'暂无备注','—','运单列表','—']],760)]
    ];
    if(id==='wb-manage'){
        panels.push(
            ['操作日志',renderWaybillSimpleTable(['操作类型','操作内容','操作时间','操作人'],[['创建运单','系统创建运单并进入已预报状态','2026-06-02 10:31:45','admin'],['更新资料','更新报关资料和附件信息','2026-06-02 11:08:12','王海波']],860)],
            ['算费日志',renderWaybillSimpleTable(['费用名称','计算公式','算费金额','算费时间','操作人'],[['基础运费','MAX(实际重量, 体积重量) × 单价','CNY 8,580','2026-06-02 10:33:21','系统'],['国内段运费','件数 × 入仓操作单价','CNY 680','2026-06-02 10:35:08','系统']],900)]
        );
    }
    let html='';
    panels.forEach(function(panel,i){
        html+='<div class="waybill-detail-panel '+(i===0?'':'hidden')+'" data-detail-panel="'+esc(panel[0])+'">'+panel[1]+'</div>';
    });
    return html;
}

function renderWaybillDetailInner(detailId,id,row){
    const waybill=waybillCell(id,row,['运单号'],'');
    const logistics=waybillCell(id,row,['物流单号'],waybill);
    const customer=waybillCell(id,row,['客户名称'],'—');
    const site=waybillCell(id,row,['所属网点'],'—');
    const custCode=waybillCell(id,row,['客户代码'],'—');
    const sales=waybillCell(id,row,['所属业务员'],'—');
    const service=waybillCell(id,row,['所属客服'],'—');
    const settle=waybillCell(id,row,['所属操作'],'—');
    const pol=waybillCell(id,row,['国内仓库','起运港'],'—');
    const pod=waybillCell(id,row,['目的仓库','目的港'],'—');
    const transport=waybillCell(id,row,['运输方式'],'—');
    const packages=waybillCell(id,row,['件数'],'0');
    const weight=waybillCell(id,row,['重量'],'0');
    const cbm=waybillCell(id,row,['体积'],'0');
    const freight=waybillCell(id,row,['运费'],'—');
    const status=waybillCell(id,row,['运单状态','状态'],'已预报');
    const remark=waybillCell(id,row,['仓库异常备注','备注'],'—');
    let h='<div data-waybill-detail>';
    h+='<div class="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-text-secondary mb-4">';
    [['所属网点',site],['所属客户',customer],['业务员',sales],['客服员',service],['操作员',settle]].forEach(function(item){h+='<div><span>'+tr(item[0])+'：</span><span class="text-text-primary">'+esc(item[1]||'—')+'</span></div>';});
    h+='</div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">';
    h+=waybillDetailCard('bg-blue-50/40',[['运单号',waybill],['物流单号',logistics],['客户代码',custCode],['客户名称',customer]]);
    const settleVolumeWeight=(cbm&&cbm!=='0'&&cbm!=='—'?cbm+' CBM':'—')+' / '+(weight&&weight!=='0'&&weight!=='—'?weight+' KG':'—');
    h+=waybillDetailCard('bg-white',[['运输方式',transport],['目的仓库',pod],['国内仓库',pol],['结算体积/重量',settleVolumeWeight]]);
    h+=waybillDetailCard('bg-blue-50/40',[['件数',packages],['收货重量',weight],['收货体积',cbm],['收货体积重',waybillVolumeWeight(cbm)]]);
    h+=waybillDetailCard('bg-white',[['运费',freight],['订单状态',status],['仓库异常备注',remark]]);
    h+='</div>';
    h+='<div class="text-sm text-text-secondary mb-3">'+tr('更多信息')+'</div>';
    h+='<div class="flex items-center gap-8 border-b border-surface-200 mb-4 overflow-x-auto">';
    const detailTabs=id==='wb-manage'?['品名信息','费用信息','材积信息','指令日志','附件信息','轨迹信息','备注说明','操作日志','算费日志']:['品名信息','费用信息','材积信息','指令日志','附件信息','轨迹信息','备注说明'];
    detailTabs.forEach(function(tab,i){
        h+='<button type="button" data-detail-tab="'+esc(tab)+'" onclick="switchWaybillDetailTab(this)" class="waybill-detail-tab flex-shrink-0 py-2 text-sm border-b-2 '+(i===0?'border-primary-600 text-primary-700 font-semibold':'border-transparent text-text-secondary hover:text-primary-600')+'">'+tr(tab)+'</button>';
    });
    h+='</div>';
    h+='<div class="min-w-0">'+renderWaybillDetailPanels(detailId,id,row)+'</div>';
    h+='</div>';
    return h;
}

function generateWaybillDetailPage(detailId){
    const detail=_waybillDetailStore[detailId];
    if(!detail)return '<div class="p-6 text-text-muted">'+tr('请选择数据')+'</div>';
    const id=detail.sourceId;
    const row=detail.row;
    const waybill=waybillCell(id,row,['运单号'],'');
    let h='<div class="h-full bg-white flex flex-col overflow-hidden">';
    h+='<div class="flex-shrink-0 px-6 pt-4 pb-3 border-b border-surface-200 flex items-center justify-between"><div class="text-lg font-semibold text-text-primary">'+tr('详情')+' - '+esc(waybill)+'</div><button type="button" onclick="switchTab(\''+id+'\')" class="h-8 px-3 text-sm text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('返回列表')+'</button></div>';
    h+='<div class="flex-1 min-h-0 overflow-auto px-6 py-4">'+renderWaybillDetailInner(detailId,id,row)+'</div></div>';
    setTimeout(function(){applyRuntimeEnhancements(document.getElementById('main-content'));},0);
    return h;
}

function switchWaybillDetailTab(btn){
    const root=btn.closest('[data-waybill-detail]');
    if(!root)return;
    root.querySelectorAll('.waybill-detail-tab').forEach(function(tab){
        tab.classList.remove('border-primary-600','text-primary-700','font-semibold');
        tab.classList.add('border-transparent','text-text-secondary');
    });
    btn.classList.remove('border-transparent','text-text-secondary');
    btn.classList.add('border-primary-600','text-primary-700','font-semibold');
    const key=btn.dataset.detailTab||'';
    root.querySelectorAll('.waybill-detail-panel').forEach(function(panel){
        panel.classList.toggle('hidden',panel.dataset.detailPanel!==key);
    });
}

function updateFeeAuditStatus(id,action){
    const targetMap={opAudit:'操作审核',overseasConfirm:'海外确认',financeAudit:'财务审核'};
    const target=targetMap[action];
    const c=TC[id];
    const colIdx=c&&c.h?c.h.indexOf(target):-1;
    if(colIdx<0)return 0;
    const indices=getSelectedRowIndices();
    if(indices.length===0)return 0;
    let count=0;
    getRowsByIndices(id,indices).forEach(function(row){
        if(row){
            setRowOverride(id,row,colIdx,action==='overseasConfirm'?'已确认':'已审核');
            count++;
        }
    });
    if(count>0)document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal||'');
    return count;
}

function feeMgmtCustomerName(rowData){
    const c=TC['fin-fee-mgmt']||{};
    const direct=getTableValueByHeader(c,rowData,'客户名称','');
    if(direct)return direct;
    const code=getTableValueByHeader(c,rowData,'客户代码','');
    const map={
        C10001:'深圳市华运达国际货运',
        C10002:'广州远洋进出口贸易',
        C10003:'佛山恒通货运代理',
        C10004:'东莞市鑫海物流',
        C10005:'上海锦程国际贸易'
    };
    return map[code]||code||'深圳市华运达国际货运';
}

function cleanMoneyValue(value){
    const raw=String(value||'').replace(/CNY|USD|EUR|￥|\$/gi,'').trim();
    return raw||'0.00';
}

function feeMgmtBaseRows(id,rowData){
    const c=TC[id]||{};
    const waybill=getTableValueByHeader(c,rowData,'运单号','WB20260522001');
    const logistics=getTableValueByHeader(c,rowData,'快递单号','SF10086523');
    const customer=feeMgmtCustomerName(rowData);
    const feeType=getTableValueByHeader(c,rowData,'费用类型','基础运费');
    const amount=cleanMoneyValue(getTableValueByHeader(c,rowData,'运费CNY',getTableValueByHeader(c,rowData,'运费','0.00')));
    return [
        [waybill,logistics,customer,feeType||'基础运费','CNY','1.0000',amount,'否','MAX(实重,材积重)×单价','费用管理明细'],
        [waybill,logistics,customer,'操作调整费','CNY','1.0000','350.00','是','手动录入','通过费用管理调整的费用不参与重算']
    ];
}

function feeMgmtDetailKey(id,rowData){
    return id+'::'+rowKey(rowData||[]);
}

function getFeeMgmtDetailRows(id,rowData){
    const key=feeMgmtDetailKey(id,rowData);
    if(!_feeMgmtDetailRows[key])_feeMgmtDetailRows[key]=feeMgmtBaseRows(id,rowData);
    return _feeMgmtDetailRows[key];
}

function openSelectedFeeMgmtEdit(id){
    const idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    openFeeMgmtDetail(id,idx);
}

function sumFeeMgmtAmountByCurrency(rows){
    const totals={};
    (rows||[]).forEach(function(row){
        const currency=row&&row[4]?String(row[4]):'CNY';
        const amount=parseFloat(String(row&&row[6]?row[6]:'0').replace(/[^\d.-]/g,''))||0;
        totals[currency]=(totals[currency]||0)+amount;
    });
    const keys=Object.keys(totals);
    if(!keys.length)return 'CNY 0.00';
    return keys.map(function(currency){
        return currency+' '+totals[currency].toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
    }).join(' / ');
}

function openFeeMgmtDetail(id,rowIdx){
    const rowData=(rowIdx>=0&&_listData[id])?_listData[id][rowIdx]:null;
    if(!rowData){openActionModal('selectRequired',id,-1);return;}
    window._feeMgmtCurrentDetail={id:id,rowIdx:rowIdx};
    const rows=getFeeMgmtDetailRows(id,rowData);
    const waybill=getTableValueByHeader(TC[id]||{},rowData,'运单号','费用详情');
    const totalAmount=sumFeeMgmtAmountByCurrency(rows);
    const adjusted=getTableValueByHeader(TC[id]||{},rowData,'是否调整','否');
    const recalcFlag=getTableValueByHeader(TC[id]||{},rowData,'重算标识',adjusted==='是'?'不重算':'正常重算');
    let h='<div class="h-full bg-white flex flex-col overflow-hidden">';
    h+='<div class="flex-shrink-0 px-6 py-4 border-b border-surface-200 flex items-center justify-between gap-3">';
    h+='<div><div class="text-lg font-semibold text-text-primary">'+tr('费用详情')+'</div><div class="text-sm text-text-secondary mt-1">'+esc(waybill)+'</div></div>';
    h+='<div class="flex items-center gap-2"><button type="button" onclick="openFeeMgmtFeeModal(\'add\',\''+id+'\','+rowIdx+')" class="h-8 px-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('新增')+'</button><button type="button" onclick="switchTab(\''+id+'\')" class="h-8 px-3 text-sm text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('返回列表')+'</button></div>';
    h+='</div>';
    h+='<div class="flex-1 min-h-0 overflow-auto p-6">';
    h+='<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">';
    h+='<div class="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3"><div class="text-xs text-text-secondary">'+tr('金额合计')+'</div><div class="mt-1 text-lg font-semibold text-primary-700">'+esc(totalAmount)+'</div></div>';
    h+='<div class="rounded-lg border border-surface-200 bg-white px-4 py-3"><div class="text-xs text-text-secondary">'+tr('费用笔数')+'</div><div class="mt-1 text-lg font-semibold text-text-primary">'+rows.length+'</div></div>';
    h+='<div class="rounded-lg border border-surface-200 bg-white px-4 py-3"><div class="text-xs text-text-secondary">'+tr('重算标识')+'</div><div class="mt-1 text-lg font-semibold '+(recalcFlag==='不重算'?'text-red-500':'text-primary-700')+'">'+tr(recalcFlag)+'</div></div>';
    h+='</div>';
    h+='<div class="border border-blue-100 rounded-lg overflow-auto bg-white"><table class="w-full text-sm" style="min-width:1120px"><thead class="bg-blue-50 sticky top-0"><tr>';
    ['运单号','物流单号','客户名称','费用名称','币别','汇率','金额','是否调整','算费公式','备注说明','操作'].forEach(function(hd){h+='<th class="text-left px-3 py-2 border-r border-blue-100 whitespace-nowrap">'+tr(hd)+'</th>';});
    h+='</tr></thead><tbody id="fee-mgmt-detail-body">';
    rows.forEach(function(row,idx){
        h+='<tr class="border-t border-surface-100 hover:bg-primary-50/30" data-fee-detail-row="'+idx+'">';
        row.forEach(function(cell,ci){h+='<td class="px-3 py-2 whitespace-nowrap '+(ci===0?'font-medium text-primary-700':'text-text-secondary')+'">'+esc(cell||'—')+'</td>';});
        h+='<td class="px-3 py-2 whitespace-nowrap"><button type="button" onclick="openFeeMgmtFeeModal(\'edit\',\''+id+'\','+rowIdx+','+idx+')" class="text-primary-600 hover:text-primary-700 mr-3 cursor-pointer">'+tr('编辑')+'</button><button type="button" onclick="openFeeMgmtDeleteConfirm('+idx+')" class="text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button></td>';
        h+='</tr>';
    });
    h+='</tbody></table></div></div></div>';
    const main=document.getElementById('main-content');
    if(main)main.innerHTML=h;
}

function openFeeMgmtGenBillModal(id){
    const c=TC[id]||{};
    const indices=getSelectedRowIndices();
    if(!indices||!indices.length){showToast(tr('请先勾选要生成账单的费用数据'));return;}
    const data=_listData[id]||c.d||[];
    const rows=indices.map(function(i){return data[i];}).filter(Boolean);
    const hArr=c.h||[];
    const idxCust=hArr.indexOf('客户代码');
    const idxWb=hArr.indexOf('运单号');
    const idxPcs=hArr.indexOf('件数');
    const idxAmt=hArr.indexOf('应收费用');
    const wbSet=new Set(),custSet=new Set();
    let totalPcs=0,totalAmt=0;
    rows.forEach(function(r){
        if(idxWb>=0&&r[idxWb])wbSet.add(r[idxWb]);
        if(idxCust>=0&&r[idxCust])custSet.add(r[idxCust]);
        if(idxPcs>=0)totalPcs+=parseFloat(String(r[idxPcs]||'0').replace(/,/g,''))||0;
        if(idxAmt>=0)totalAmt+=parseFloat(String(r[idxAmt]||'0').replace(/CNY|USD|EUR|￥|\$/gi,'').replace(/,/g,'').trim())||0;
    });
    const d=new Date();
    const dateStr=String(d.getFullYear())+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
    const seq=String(Math.floor(Math.random()*900+100));
    const defaultBillNo='AR-'+dateStr+'-'+seq;
    const defaultBatch='BATCH-'+dateStr+'-001';
    document.getElementById('crud-modal-title').textContent=tr('生成账单')+' - '+tr(c.t||'费用管理');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='58%';
    let html='<div class="space-y-5">';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('统计汇总')+'</div>';
    html+='<div class="grid grid-cols-2 md:grid-cols-4 gap-3">';
    const stats=[
        {label:'运单票数',value:wbSet.size,cls:'text-primary-700'},
        {label:'总件数',value:totalPcs.toLocaleString(),cls:'text-blue-700'},
        {label:'总客户数',value:custSet.size,cls:'text-emerald-700'},
        {label:'应收总金额',value:'CNY '+totalAmt.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}),cls:'text-orange-600'}
    ];
    stats.forEach(function(s){
        html+='<div class="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3"><div class="text-xs text-text-secondary">'+tr(s.label)+'</div><div class="mt-1 text-lg font-semibold '+s.cls+'">'+esc(String(s.value))+'</div></div>';
    });
    html+='</div></div>';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('账单信息')+'</div>';
    html+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('账单号')+'</label><input type="text" id="fee-mgmt-gen-bill-no" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(defaultBillNo)+'"></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('账单批次号')+'</label><input type="text" id="fee-mgmt-gen-batch" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(defaultBatch)+'" placeholder="'+esc(tr('请输入账单批次号'))+'"></div>';
    html+='<div class="md:col-span-2 flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('生成说明')+'</label><textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('可选，补充账单说明'))+'"></textarea></div>';
    html+='</div></div>';
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('账单生成成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认生成')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openFeeMgmtFeeModal(mode,id,rowIdx,detailRowIdx){
    const c=TC[id]||{};
    const rowData=(rowIdx>=0&&_listData[id])?_listData[id][rowIdx]:null;
    if(mode==='edit'&&!rowData){openActionModal('selectRequired',id,-1);return;}
    const detailRows=rowData?getFeeMgmtDetailRows(id,rowData):[];
    const detailRow=detailRows[detailRowIdx>=0?detailRowIdx:0]||feeMgmtBaseRows(id,rowData)[0];
    const isEdit=mode==='edit';
    const feeNameOptions=['运费','附加费','报关费','仓储费','文件费','操作调整费','其他'];
    document.getElementById('crud-modal-title').textContent=tr(isEdit?'编辑费用':'新增费用')+' - '+tr((c&&c.t)||'费用管理');
    let fields=[];
    if(isEdit){
        fields=[
            {label:'运单号',value:detailRow[0],readonly:true},
            {label:'物流单号',value:detailRow[1],readonly:true},
            {label:'客户名称',value:detailRow[2],readonly:true},
            {label:'费用名称',type:'select',options:feeNameOptions,value:feeNameOptions.includes(detailRow[3])?detailRow[3]:'其他',required:true},
            {label:'币别',type:'select',options:['CNY','USD','EUR'],value:detailRow[4],required:true},
            {label:'汇率',type:'number',value:detailRow[5],required:true},
            {label:'金额',type:'number',value:detailRow[6],required:true},
            {label:'是否调整',type:'select',options:['否','是'],value:detailRow[7]||'否'},
            {label:'算费公式',value:detailRow[8]||''},
            {label:'备注说明',type:'textarea',rows:3,span:'md:col-span-2',value:detailRow[9]}
        ];
    }else{
        const waybillOptions=(TC[id]&&TC[id].d)?TC[id].d.map(function(r){return r[0]||'';}).filter(Boolean):[];
        fields=[
            {label:'运单号',type:'select',options:waybillOptions,value:rowData?rowData[0]:(waybillOptions[0]||''),required:true,placeholder:'请选择运单号',span:'md:col-span-2'},
            {label:'费用名称',type:'select',options:feeNameOptions,value:'运费',required:true},
            {label:'币别',type:'select',options:['CNY','USD','EUR'],value:'CNY',required:true},
            {label:'汇率',type:'number',value:'1.0000',required:true},
            {label:'金额',type:'number',value:'0.00',required:true},
            {label:'是否调整',type:'select',options:['否','是'],value:'否'},
            {label:'算费公式',value:'MAX(实重,材积重)×单价'},
            {label:'备注说明',type:'textarea',rows:3,span:'md:col-span-2'}
        ];
    }
    document.getElementById('crud-modal-body').innerHTML=renderFields(fields,'modal');
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr(isEdit?'保存成功':'新增成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openFeeMgmtDeleteConfirm(detailRowIdx){
    const old=document.getElementById('fee-mgmt-delete-confirm');
    if(old)old.remove();
    const overlay=document.createElement('div');
    overlay.id='fee-mgmt-delete-confirm';
    overlay.className='fixed inset-0 bg-black/40 z-[90] flex items-center justify-center';
    overlay.innerHTML='<div class="w-[320px] rounded-xl bg-white shadow-xl border border-surface-200 p-5"><div class="text-base font-semibold text-text-primary mb-2">'+tr('提示')+'</div><div class="text-sm text-text-secondary mb-5">是否确认删除数据！！</div><div class="flex justify-end gap-2"><button type="button" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer" onclick="document.getElementById(\'fee-mgmt-delete-confirm\').remove()">'+tr('取消')+'</button><button type="button" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer" onclick="confirmFeeMgmtDetailDelete('+detailRowIdx+')">'+tr('确认')+'</button></div></div>';
    document.body.appendChild(overlay);
}

function confirmFeeMgmtDetailDelete(detailRowIdx){
    const ctx=window._feeMgmtCurrentDetail||{};
    const rowData=(ctx.rowIdx>=0&&_listData[ctx.id])?_listData[ctx.id][ctx.rowIdx]:null;
    if(rowData){
        const rows=getFeeMgmtDetailRows(ctx.id,rowData);
        rows.splice(detailRowIdx,1);
    }else{
        const row=document.querySelector('[data-fee-detail-row="'+detailRowIdx+'"]');
        if(row)row.remove();
    }
    const modal=document.getElementById('fee-mgmt-delete-confirm');
    if(modal)modal.remove();
    if(rowData)openFeeMgmtDetail(ctx.id,ctx.rowIdx);
    showToast(tr('删除成功'));
}

