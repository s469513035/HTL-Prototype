function openFclPayableDetailModal(id,rowIdx){
    const rowData=(rowIdx>=0&&_listData[id])?_listData[id][rowIdx]:getRowsByIndices(id,getSelectedRowIndices())[0];
    const bl=(rowData&&rowData[1])||'HLHLA260613001';
    const svc=(rowData&&rowData[3])||'MAERSK';
    document.getElementById('crud-modal-title').textContent=tr('查看明细')+' - '+tr('整柜应付账单');
    const rows=[
        ['海运费',svc,'USD','7.20','3200.00','40HQ 整箱海运'],
        ['码头操作费',svc,'USD','7.20','520.00','起运港THC'],
        ['文件费',svc,'USD','7.20','80.00','提单文件费'],
        ['燃油附加费',svc,'USD','7.20','320.00','BAF 燃油附加费']
    ];
    let html='<div class="mb-3 rounded-lg border border-primary-100 bg-primary-50 p-3 text-sm text-primary-700">'+tr('提单号')+'：<span class="font-semibold">'+esc(bl)+'</span> · '+tr('服务商')+'：'+esc(svc)+'</div>';
    html+='<div class="border border-blue-100 rounded-lg overflow-auto bg-white"><table class="w-full text-sm" style="min-width:760px"><thead class="bg-blue-50"><tr>';
    ['费用类型','服务商','币别','汇率','应付金额','备注'].forEach(function(hd){html+='<th class="text-left px-3 py-2 border-r border-blue-100 whitespace-nowrap">'+tr(hd)+'</th>';});
    html+='</tr></thead><tbody>';
    rows.forEach(function(row){html+='<tr class="border-t border-surface-100 hover:bg-primary-50/30">';row.forEach(function(cell,i){html+='<td class="px-3 py-2 whitespace-nowrap '+(i===0?'font-medium text-primary-700':'text-text-secondary')+'">'+esc(tr(cell))+'</td>';});html+='</tr>';});
    html+='<tr class="border-t border-surface-200 bg-surface-50 font-semibold"><td class="px-3 py-2 text-text-secondary" colspan="4">'+tr('合计')+'</td><td class="px-3 py-2 text-primary-700 whitespace-nowrap">USD 4120.00</td><td></td></tr>';
    html+='</tbody></table></div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openFclFeeImportModal(id){
    document.getElementById('crud-modal-title').textContent=tr('下载导入模版')+' - '+tr('实际费用管理');
    let html='<div class="space-y-4">';
    html+='<section><div class="text-sm font-semibold text-text-primary mb-2">'+tr('下载模版')+'</div><button type="button" onclick="showToast(\''+tr('模版文件下载中')+'\')" class="h-9 px-5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer inline-flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'+tr('下载模版文件')+'</button></section>';
    html+='<section><div class="text-sm font-semibold text-text-primary mb-2">'+tr('上传文件')+'</div><div class="border-2 border-dashed border-surface-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors" onclick="document.getElementById(\'fcl-fee-import-file\').click()"><svg class="w-10 h-10 text-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg><p class="text-sm text-text-muted">'+tr('点击选择文件上传')+'</p><p class="text-xs text-text-muted mt-1">'+tr('支持 Excel 文件导入')+'</p></div><input type="file" id="fcl-fee-import-file" accept=".xlsx,.xls,.csv" class="hidden" onchange="showToast(\''+tr('已选择文件')+'\')"></section>';
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('导入成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认导入')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openFclFileRecognizeModal(id){
    document.getElementById('crud-modal-title').textContent=tr('图片和文件识别')+' - '+tr((TC[id]&&TC[id].t)||'实际费用管理');
    let html='<div class="space-y-4">';
    html+='<section><div class="text-sm font-semibold text-text-primary mb-2">'+tr('上传图片/文件')+'</div><div class="border-2 border-dashed border-surface-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors" onclick="document.getElementById(\'fcl-recognize-file\').click()"><svg class="w-10 h-10 text-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><p class="text-sm text-text-muted">'+tr('点击选择图片或文件')+'</p><p class="text-xs text-text-muted mt-1">'+tr('支持 JPG/PNG/PDF')+'</p></div><input type="file" id="fcl-recognize-file" accept="image/*,.pdf" class="hidden" onchange="showToast(\''+tr('已选择文件')+'\')"></section>';
    html+='<div><button type="button" onclick="showToast(\''+tr('识别中...')+'\')" class="h-9 px-5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('开始识别')+'</button></div>';
    html+='<section><div class="text-sm font-semibold text-text-primary mb-2">'+tr('识别结果')+'</div><textarea rows="5" readonly class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-none">'+esc('服务商：MAERSK\n费用类型：海运费\n金额：USD 4120.00\n账单日期：2026-06-13\n（识别结果可编辑后生成账单）')+'</textarea></section>';
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('已生成账单')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('生成账单')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function outboundPlanRows(){
    const seed=[
        ['WB-20260613001','KH00012','深圳市华运达国际货运','张三','深圳分公司',8,96.5,0.36,'拉各斯仓','尼日利亚','电子产品'],
        ['WB-20260613002','KH00018','广州远洋进出口贸易','李四','广州分公司',3,42.0,0.18,'达喀尔仓','塞内加尔','服装鞋帽'],
        ['WB-20260613003','KH00026','东莞市鑫海物流','王明辉','广州分公司',5,60.4,0.24,'阿比让仓','科特迪瓦','五金工具'],
        ['WB-20260613004','KH00031','上海锦程国际贸易','刘晓东','上海分公司',12,180.2,0.84,'洛美仓','多哥','家居用品'],
        ['WB-20260613005','KH00045','深圳市华运达国际货运','张三','深圳分公司',6,72.0,0.30,'杜阿拉仓','喀麦隆','食品']
    ];
    const rows=[];
    for(let i=1;i<=60;i++){
        const base=seed[(i-1)%seed.length].slice();
        base[0]='WB-202606'+String(13000+i).padStart(5,'0');
        base[1]='KH'+String(10000+i*7).padStart(5,'0');
        rows.push(base);
    }
    return rows;
}

var _outboundPlanState={id:'',rows:[],query:{wb:'',warehouse:'',country:'',category:''},selected:{}};

function outboundPlanSelectHtml(eid,val,options){
    let h='<select id="'+eid+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white"><option value="">'+esc(tr('全部'))+'</option>';
    options.forEach(function(opt){h+='<option value="'+esc(opt)+'"'+(val===opt?' selected':'')+'>'+esc(tr(opt))+'</option>';});
    h+='</select>';
    return h;
}

function renderOutboundPlanBody(){
    const all=_outboundPlanState.rows||[];
    const q=_outboundPlanState.query||{};
    const filtered=all.filter(function(r){
        if(q.wb&&r[0].indexOf(q.wb)<0&&r[1].indexOf(q.wb)<0)return false;
        if(q.warehouse&&r[8]!==q.warehouse)return false;
        if(q.country&&r[9]!==q.country)return false;
        if(q.category&&r[10]!==q.category)return false;
        return true;
    });
    const pageRows=filtered.slice(0,100);
    let html='<div class="mb-3 rounded-xl border border-primary-100 bg-primary-50/60 p-3">';
    html+='<div class="grid grid-cols-1 md:grid-cols-4 gap-3">';
    html+='<div><label class="block text-xs font-medium text-text-secondary mb-1">'+tr('单号')+'</label><input id="op-q-wb" type="text" value="'+esc(q.wb||'')+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+esc(tr('运单号/客户单号'))+'"></div>';
    html+='<div><label class="block text-xs font-medium text-text-secondary mb-1">'+tr('收件仓库')+'</label>'+outboundPlanSelectHtml('op-q-warehouse',q.warehouse,['拉各斯仓','达喀尔仓','阿比让仓','洛美仓','杜阿拉仓'])+'</div>';
    html+='<div><label class="block text-xs font-medium text-text-secondary mb-1">'+tr('国家')+'</label>'+outboundPlanSelectHtml('op-q-country',q.country,['尼日利亚','塞内加尔','科特迪瓦','多哥','喀麦隆'])+'</div>';
    html+='<div><label class="block text-xs font-medium text-text-secondary mb-1">'+tr('品名大类')+'</label>'+outboundPlanSelectHtml('op-q-category',q.category,['电子产品','服装鞋帽','五金工具','家居用品','食品','化妆品','其他'])+'</div>';
    html+='</div>';
    html+='<div class="mt-3 flex gap-2">';
    html+='<button type="button" onclick="applyOutboundPlanQuery()" class="h-9 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 cursor-pointer">'+tr('查询')+'</button>';
    html+='<button type="button" onclick="resetOutboundPlanQuery()" class="h-9 px-4 rounded-lg border border-surface-200 bg-white text-text-secondary text-sm font-medium hover:bg-surface-50 cursor-pointer">'+tr('重置')+'</button>';
    html+='</div></div>';
    html+='<div class="grid grid-cols-1 md:grid-cols-2 gap-3">';
    html+='<div id="outbound-plan-left">'+renderOutboundPlanLeft(pageRows,filtered.length)+'</div>';
    html+='<div id="outbound-plan-right">'+renderOutboundPlanRight()+'</div>';
    html+='</div>';
    return html;
}

function renderOutboundPlanLeft(pageRows,totalCount){
    let h='<div class="rounded-lg border border-surface-200 overflow-hidden bg-white">';
    h+='<div class="px-3 py-2 bg-surface-50 text-xs font-semibold text-text-secondary flex items-center justify-between"><span>'+tr('可选订单')+'</span><span class="text-text-muted">'+tr('共')+' '+totalCount+' '+tr('条')+'</span></div>';
    h+='<div class="overflow-auto" style="height:clamp(380px,calc(100vh - 400px),560px)"><table class="w-full text-xs"><thead class="sticky top-0 z-10 bg-surface-50"><tr class="text-text-secondary">';
    h+='<th class="px-2 py-2 w-8 text-left"><input type="checkbox" onclick="toggleAllOutboundPlan(this)" class="rounded border-surface-300 text-primary-600"></th>';
    ['运单号','客户单号','客户','件数','重量(KG)','体积(CBM)','收件仓库','国家','品名大类'].forEach(function(hd){h+='<th class="px-2 py-2 text-left whitespace-nowrap">'+tr(hd)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!pageRows.length){
        h+='<tr><td colspan="10" class="px-2 py-6 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
    }else{
        pageRows.forEach(function(row){
            const key=row[0];
            const checked=_outboundPlanState.selected[key]?' checked':'';
            h+='<tr class="border-t border-surface-100 hover:bg-primary-50/40">';
            h+='<td class="px-2 py-2"><input type="checkbox" class="outbound-plan-check rounded border-surface-300 text-primary-600" data-key="'+esc(key)+'"'+checked+' onchange="toggleOutboundPlanSelect(this)"></td>';
            h+='<td class="px-2 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(row[0])+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary whitespace-nowrap">'+esc(row[1])+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary whitespace-nowrap">'+esc(row[2])+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary text-right">'+esc(String(row[5]))+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary text-right">'+esc(String(row[6]))+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary text-right">'+esc(String(row[7]))+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary whitespace-nowrap">'+esc(row[8])+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary whitespace-nowrap">'+esc(row[9])+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary whitespace-nowrap">'+esc(row[10])+'</td>';
            h+='</tr>';
        });
    }
    h+='</tbody></table></div></div>';
    return h;
}

function renderOutboundPlanRight(){
    const sel=_outboundPlanState.selected||{};
    const all=_outboundPlanState.rows||[];
    const selectedRows=all.filter(function(r){return sel[r[0]];});
    let totalQty=0,totalWeight=0,totalVol=0;
    selectedRows.forEach(function(r){
        totalQty+=parseFloat(r[5])||0;
        totalWeight+=parseFloat(r[6])||0;
        totalVol+=parseFloat(r[7])||0;
    });
    let h='<div class="rounded-lg border border-primary-200 overflow-hidden bg-white">';
    h+='<div class="px-3 py-2 bg-primary-50 text-xs font-semibold text-primary-700 flex items-center justify-between"><span>'+tr('已选订单')+'</span><span>'+selectedRows.length+' '+tr('票')+'</span></div>';
    h+='<div class="overflow-auto" style="height:clamp(300px,calc(100vh - 480px),460px)"><table class="w-full text-xs"><thead class="sticky top-0 z-10 bg-surface-50"><tr class="text-text-secondary">';
    ['运单号','客户单号','件数','重量(KG)','体积(CBM)','收件仓库'].forEach(function(hd){h+='<th class="px-2 py-2 text-left whitespace-nowrap">'+tr(hd)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!selectedRows.length){
        h+='<tr><td colspan="6" class="px-2 py-6 text-center text-text-muted">'+tr('请在左侧勾选订单')+'</td></tr>';
    }else{
        selectedRows.forEach(function(row){
            h+='<tr class="border-t border-surface-100">';
            h+='<td class="px-2 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(row[0])+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary whitespace-nowrap">'+esc(row[1])+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary text-right">'+esc(String(row[5]))+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary text-right">'+esc(String(row[6]))+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary text-right">'+esc(String(row[7]))+'</td>';
            h+='<td class="px-2 py-2 text-text-secondary whitespace-nowrap">'+esc(row[8])+'</td>';
            h+='</tr>';
        });
    }
    h+='</tbody></table></div>';
    h+='<div class="px-3 py-2 bg-primary-50/60 border-t border-primary-100 text-xs text-primary-700 grid grid-cols-3 gap-2">';
    h+='<div><span class="text-text-muted">'+tr('合计件数')+'：</span><span class="font-semibold">'+totalQty+'</span></div>';
    h+='<div><span class="text-text-muted">'+tr('合计重量(KG)')+'：</span><span class="font-semibold">'+totalWeight.toFixed(2)+'</span></div>';
    h+='<div><span class="text-text-muted">'+tr('合计体积(CBM)')+'：</span><span class="font-semibold">'+totalVol.toFixed(3)+'</span></div>';
    h+='</div></div>';
    return h;
}

function applyOutboundPlanQuery(){
    _outboundPlanState.query={
        wb:((document.getElementById('op-q-wb')||{}).value||'').trim(),
        warehouse:(document.getElementById('op-q-warehouse')||{}).value||'',
        country:(document.getElementById('op-q-country')||{}).value||'',
        category:(document.getElementById('op-q-category')||{}).value||''
    };
    const body=document.getElementById('outbound-plan-body');
    if(body)body.innerHTML=renderOutboundPlanBody();
}

function resetOutboundPlanQuery(){
    _outboundPlanState.query={wb:'',warehouse:'',country:'',category:''};
    const body=document.getElementById('outbound-plan-body');
    if(body)body.innerHTML=renderOutboundPlanBody();
}

function toggleAllOutboundPlan(master){
    const checks=document.querySelectorAll('.outbound-plan-check');
    checks.forEach(function(cb){
        cb.checked=master.checked;
        const k=cb.getAttribute('data-key');
        if(k){
            if(master.checked)_outboundPlanState.selected[k]=true;
            else delete _outboundPlanState.selected[k];
        }
    });
    const right=document.getElementById('outbound-plan-right');
    if(right)right.innerHTML=renderOutboundPlanRight();
}

function toggleOutboundPlanSelect(cb){
    const k=cb.getAttribute('data-key');
    if(!k)return;
    if(cb.checked)_outboundPlanState.selected[k]=true;
    else delete _outboundPlanState.selected[k];
    const right=document.getElementById('outbound-plan-right');
    if(right)right.innerHTML=renderOutboundPlanRight();
}

function openOutboundPlanModal(id){
    _outboundPlanState={id:id,rows:outboundPlanRows(),query:{wb:'',warehouse:'',country:'',category:''},selected:{}};
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='92%';
    document.getElementById('crud-modal-title').textContent=tr('新增出库计划')+' - '+tr((TC[id]&&TC[id].t)||'出库单');
    document.getElementById('crud-modal-body').innerHTML='<div id="outbound-plan-body">'+renderOutboundPlanBody()+'</div>';
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button><button onclick="closeCrudModal();showToast(\''+tr('出库计划新增成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确定')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function printSelectedLabels(id){
    const count=document.querySelectorAll('.row-check:checked').length;
    if(count<=0){showToast(tr('请先勾选数据'));return;}
    showToast(tr('已打印')+' '+count+' '+tr('个标签'));
}

let _outboundAdjustState={id:'',rows:[]};
function outboundAdjustRows(){
    return [
        ['WB-20260613001','SF10086523','8','96.5'],
        ['WB-20260613002','YT98876543','3','42.0'],
        ['WB-20260613008','JD55620017','5','60.4']
    ];
}
function renderOutboundAdjustBody(){
    const rows=_outboundAdjustState.rows||[];
    let h='<div class="flex items-center gap-2 mb-3">';
    h+='<input id="outbound-adjust-input" type="text" class="h-9 flex-1 px-3 text-sm border border-surface-200 rounded-lg" placeholder="'+esc(tr('扫描或输入运单号新增明细'))+'">';
    h+='<button onclick="addOutboundAdjustRow()" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('新增')+'</button>';
    h+='<button onclick="removeOutboundAdjustRows()" class="h-9 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer">'+tr('剔除')+'</button>';
    h+='</div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto bg-white"><table class="w-full text-sm" style="min-width:600px"><thead class="bg-[#EFF6FF]"><tr>';
    h+='<th class="px-3 py-2 w-10"><input type="checkbox" onchange="toggleAllOutboundAdjust(this)"></th>';
    ['运单号','客户单号','件数','重量(KG)'].forEach(function(hd){h+='<th class="text-left px-3 py-2 whitespace-nowrap text-xs font-semibold text-text-secondary">'+tr(hd)+'</th>';});
    h+='</tr></thead><tbody>';
    if(rows.length===0){h+='<tr><td colspan="5" class="px-3 py-6 text-center text-sm text-text-muted">'+tr('暂无运单明细')+'</td></tr>';}
    rows.forEach(function(row,idx){
        h+='<tr class="border-t border-surface-100 hover:bg-primary-50/30">';
        h+='<td class="px-3 py-2"><input type="checkbox" class="outbound-adjust-check" value="'+idx+'"></td>';
        row.forEach(function(cell,ci){h+='<td class="px-3 py-2 whitespace-nowrap '+(ci===0?'font-medium text-primary-700':'text-text-secondary')+'">'+esc(tr(cell))+'</td>';});
        h+='</tr>';
    });
    h+='</tbody></table></div>';
    h+='<div class="mt-2 text-xs text-text-muted">'+tr('共')+' '+rows.length+' '+tr('票')+'</div>';
    return h;
}
function refreshOutboundAdjustBody(){
    const body=document.getElementById('outbound-adjust-body');
    if(body)body.innerHTML=renderOutboundAdjustBody();
}
function toggleAllOutboundAdjust(master){
    document.querySelectorAll('.outbound-adjust-check').forEach(function(cb){cb.checked=master.checked;});
}
function addOutboundAdjustRow(){
    const input=document.getElementById('outbound-adjust-input');
    const val=(input&&input.value.trim())?input.value.trim():('WB-2026061'+(3000+_outboundAdjustState.rows.length));
    _outboundAdjustState.rows.push([val,'-','1','0.0']);
    refreshOutboundAdjustBody();
}
function removeOutboundAdjustRows(){
    const checked=[...document.querySelectorAll('.outbound-adjust-check:checked')].map(function(cb){return parseInt(cb.value);});
    if(checked.length===0){showToast(tr('请先勾选数据'));return;}
    _outboundAdjustState.rows=_outboundAdjustState.rows.filter(function(_,idx){return checked.indexOf(idx)<0;});
    refreshOutboundAdjustBody();
}
function openOutboundAdjustModal(id){
    _outboundAdjustState={id:id,rows:outboundAdjustRows()};
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('出库单调整')+' - '+tr((TC[id]&&TC[id].t)||'出库单');
    document.getElementById('crud-modal-body').innerHTML='<div id="outbound-adjust-body">'+renderOutboundAdjustBody()+'</div>';
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button><button onclick="closeCrudModal();showToast(\''+tr('出库单调整已保存')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('保存')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

