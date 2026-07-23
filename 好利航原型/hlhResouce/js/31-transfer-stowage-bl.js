function transferWaybillRows(){
    const seed=[
        ['WB-20260613001','SF10086523','待出库','深圳市华运达国际货运','8','海运'],
        ['WB-20260613002','JD30012998','待出库','广州远洋进出口贸易','5','海运'],
        ['WB-20260613003','YT88990012','待调拨','东莞市鑫海物流','12','空运'],
        ['WB-20260613004','KY77881234','待调拨','上海锦程国际贸易','3','海运']
    ];
    const rows=[];
    const logisticsPrefix=['SF','JD','YT','KY','DB','ZT'];
    for(let i=1;i<=200;i++){
        const base=seed[(i-1)%seed.length].slice();
        base[0]='WB-202606'+String(13000+i).padStart(5,'0');
        base[1]=logisticsPrefix[(i-1)%logisticsPrefix.length]+String(10000000+i*37).padStart(8,'0');
        base[2]=i%3===0?'待调拨':'待出库';
        base[4]=String(1+(i%18));
        base[5]=i%4===0?'空运':'海运';
        rows.push(base);
    }
    return rows;
}

var _transferOutPickState={allLeft:[],left:[],right:[],queryNo:''};

function transferWaybillTable(rows,side){
    const pageRows=(rows||[]).slice(0,100);
    let html='<div class="rounded-lg border border-surface-200 overflow-hidden bg-white"><div class="overflow-auto" style="height:clamp(560px,calc(100vh - 280px),760px)"><table class="w-full text-xs"><thead class="sticky top-0 z-10"><tr class="bg-surface-50 text-text-secondary">';
    ['','运单号','物流单号','运单状态','客户名称','件数','运输方式'].forEach(function(h){html+='<th class="px-2 py-2 text-left">'+tr(h)+'</th>';});
    html+='</tr></thead><tbody>';
    if(!pageRows.length){
        html+='<tr><td colspan="7" class="px-2 py-2 text-center text-text-muted" style="height:clamp(512px,calc(100vh - 328px),712px)">'+tr('暂无已选择数据')+'</td></tr>';
    }
    pageRows.forEach(function(row,idx){
        html+='<tr class="border-t border-surface-100 hover:bg-primary-50/40"><td class="px-2 py-2"><input type="checkbox" data-transfer-row="'+idx+'" class="transfer-'+side+'-check rounded border-surface-300 text-primary-600"></td>';
        row.forEach(function(cell,cellIdx){
            html+='<td class="px-2 py-2 '+(cellIdx===0?'font-medium text-primary-700':'text-text-secondary')+'">'+esc(tr(cell))+'</td>';
        });
        html+='</tr>';
    });
    html+='</tbody></table></div></div>';
    html+='<div class="mt-3 flex items-center justify-between text-xs text-text-muted"><span>'+tr('共')+' '+rows.length+' '+tr('条记录')+'，'+tr('当前显示')+' '+pageRows.length+' '+tr('条')+'</span><div class="flex items-center gap-1"><button type="button" class="w-7 h-7 rounded border border-surface-200 bg-white text-text-muted">‹</button><button type="button" class="w-7 h-7 rounded border border-primary-500 bg-primary-50 text-primary-700 font-medium">1</button><button type="button" class="w-7 h-7 rounded border border-surface-200 bg-white text-text-muted">›</button><select class="h-7 rounded border border-surface-200 bg-white px-1"><option>100/页</option><option>500/页</option></select></div></div>';
    return html;
}

function renderTransferOutPickBody(){
    const leftRows=_transferOutPickState.left||[];
    const rightRows=_transferOutPickState.right||[];
    let html='<div class="mb-3 rounded-xl border border-primary-100 bg-primary-50/60 p-3 flex flex-wrap items-end gap-3">';
    html+='<div class="w-full md:w-80"><label class="block text-sm font-medium text-text-secondary mb-1.5">'+tr('单号')+'</label><input id="transfer-out-query-no" type="text" value="'+esc(_transferOutPickState.queryNo||'')+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+esc(tr('请输入运单号/物流单号'))+'" onkeydown="if(event.key===\'Enter\')applyTransferOutQuery()"></div>';
    html+='<button type="button" onclick="applyTransferOutQuery()" class="h-9 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 cursor-pointer">'+tr('查询')+'</button>';
    html+='<button type="button" onclick="resetTransferOutQuery()" class="h-9 px-4 rounded-lg border border-surface-200 bg-white text-text-secondary text-sm font-medium hover:bg-surface-50 cursor-pointer">'+tr('重置')+'</button>';
    html+='</div>';
    html+='<div class="grid grid-cols-1 xl:grid-cols-[1fr_64px_1fr] gap-4 items-start">';
    html+='<section class="rounded-xl border border-surface-200 bg-surface-50 p-4 flex flex-col"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('未选择运单信息')+'</div>'+transferWaybillTable(leftRows,'left')+'</section>';
    html+='<div class="self-stretch flex xl:flex-col items-center justify-center gap-3 py-4"><button type="button" onclick="moveTransferWaybills(\'right\')" class="w-10 h-9 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 cursor-pointer">›</button><button type="button" onclick="moveTransferWaybills(\'left\')" class="w-10 h-9 rounded-lg bg-primary-100 text-primary-700 font-semibold hover:bg-primary-200 cursor-pointer">‹</button></div>';
    html+='<section class="rounded-xl border border-primary-100 bg-primary-50 p-4 flex flex-col"><div class="flex items-center justify-between mb-3"><div class="text-sm font-semibold text-primary-700">'+tr('已选择运单信息')+'</div><span class="text-xs text-primary-600">'+rightRows.length+' '+tr('票')+'</span></div>'+transferWaybillTable(rightRows,'right')+'<div class="mt-4 flex justify-end"><button type="button" onclick="closeCrudModal();showToast(\''+tr('调拨出库登记成功')+'\')" class="h-9 px-5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 cursor-pointer">'+tr('调拨出库登记')+'</button></div></section>';
    html+='</div>';
    return html;
}

function applyTransferOutQuery(){
    const input=document.getElementById('transfer-out-query-no');
    const key=String((input&&input.value)||'').trim().toUpperCase();
    _transferOutPickState.queryNo=key;
    const selectedKeys={};
    (_transferOutPickState.right||[]).forEach(function(row){selectedKeys[row[0]]=true;});
    _transferOutPickState.left=(_transferOutPickState.allLeft||[]).filter(function(row){
        if(selectedKeys[row[0]])return false;
        if(!key)return true;
        return String(row[0]||'').toUpperCase().indexOf(key)>=0||String(row[1]||'').toUpperCase().indexOf(key)>=0;
    });
    const body=document.getElementById('transfer-out-pick-body');
    if(body)body.innerHTML=renderTransferOutPickBody();
}

function resetTransferOutQuery(){
    const input=document.getElementById('transfer-out-query-no');
    if(input)input.value='';
    _transferOutPickState.queryNo='';
    applyTransferOutQuery();
}

function moveTransferWaybills(direction){
    const from=direction==='right'?'left':'right';
    const to=direction==='right'?'right':'left';
    const checked=[...document.querySelectorAll('.transfer-'+from+'-check:checked')].map(function(input){return parseInt(input.dataset.transferRow,10);}).filter(function(idx){return !isNaN(idx);}).sort(function(a,b){return b-a;});
    if(!checked.length){showToast(tr('请先勾选数据'));return;}
    checked.forEach(function(idx){
        const row=_transferOutPickState[from].splice(idx,1)[0];
        if(row)_transferOutPickState[to].push(row);
    });
    applyTransferOutQuery();
    const body=document.getElementById('transfer-out-pick-body');
    if(body)body.innerHTML=renderTransferOutPickBody();
}

function openTransferOutRegisterModal(mode){
    const rows=transferWaybillRows();
    _transferOutPickState={allLeft:rows.slice(),left:rows.slice(),right:[],queryNo:''};
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='92%';
    document.getElementById('crud-modal-title').textContent=tr(mode==='edit'?'编辑调拨':(mode==='adjust'?'调拨调整':'新增调拨'));
    let html='<div id="transfer-out-pick-body">'+renderTransferOutPickBody()+'</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function stowageRows(){
    const seed=[
        ['YPC-20260613001','WB-20260613001','8','8','12.5','126.5'],
        ['YPC-20260613002','WB-20260613002','5','5','8.4','86.2'],
        ['YPC-20260613003','WB-20260613003','12','10','18.0','204.6'],
        ['YPC-20260613004','WB-20260613004','3','3','4.2','36.0']
    ];
    const rows=[];
    for(let i=1;i<=200;i++){
        const base=seed[(i-1)%seed.length].slice();
        base[0]='YPC-202606'+String(13000+i).padStart(5,'0');
        base[1]='WB-202606'+String(13000+i).padStart(5,'0');
        base[2]=String(1+(i%20));
        base[3]=String(1+(i%18));
        base[4]=(6.5+(i%28)*0.8).toFixed(1);
        base[5]=(40+(i%80)*3.6).toFixed(1);
        rows.push(base);
    }
    return rows;
}

var _stowagePickState={left:[],right:[]};

function stowageDataTable(rows,side){
    const pageRows=(rows||[]).slice(0,100);
    let html='<div class="rounded-lg border border-surface-200 overflow-hidden bg-white"><div class="overflow-auto" style="height:clamp(480px,calc(100vh - 420px),680px)"><table class="w-full text-xs"><thead class="sticky top-0 z-10"><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['#','','预配仓单号/运单号','件数','可配件数','可配实重'].forEach(function(h){html+='<th class="px-2 py-2 text-left whitespace-nowrap">'+tr(h)+'</th>';});
    html+='</tr></thead><tbody>';
    if(!pageRows.length){
        html+='<tr><td colspan="6" class="px-2 py-2 text-center text-text-muted" style="height:clamp(432px,calc(100vh - 468px),632px)">'+tr('暂无已选择数据')+'</td></tr>';
    }
    pageRows.forEach(function(row,idx){
        html+='<tr class="border-t border-surface-100 hover:bg-primary-50/40"><td class="px-2 py-2 text-text-muted">'+(idx+1)+'</td><td class="px-2 py-2"><input type="checkbox" data-stowage-row="'+idx+'" class="stowage-'+side+'-check rounded border-surface-300 text-primary-600"></td>';
        html+='<td class="px-2 py-2 font-medium text-primary-700">'+esc(row[0])+'<div class="text-[11px] text-text-muted">'+esc(row[1])+'</div></td>';
        html+='<td class="px-2 py-2 text-text-secondary">'+esc(row[2])+'</td><td class="px-2 py-2 text-text-secondary">'+esc(row[3])+'</td><td class="px-2 py-2 text-text-secondary">'+esc(row[4])+'</td>';
        html+='</tr>';
    });
    html+='</tbody></table></div></div>';
    const pieces=rows.reduce(function(sum,row){return sum+(parseFloat(row[3])||0);},0);
    const weight=rows.reduce(function(sum,row){return sum+(parseFloat(row[4])||0);},0);
    html+='<div class="mt-2 rounded-lg bg-surface-50 border border-surface-200 px-3 py-2 flex items-center justify-between text-xs text-text-muted"><span>'+tr('共')+' '+rows.length+' '+tr('条记录')+'，'+tr('当前显示')+' '+pageRows.length+' '+tr('条')+'；'+tr('合计')+'：'+tr('可配件数')+' '+pieces+'，'+tr('可配实重')+' '+weight.toFixed(1)+'</span><div class="flex items-center gap-1"><button type="button" class="w-7 h-7 rounded border border-surface-200 bg-white">‹</button><button type="button" class="w-7 h-7 rounded border border-primary-500 bg-primary-50 text-primary-700">1</button><button type="button" class="w-7 h-7 rounded border border-surface-200 bg-white">›</button><select class="h-7 rounded border border-surface-200 bg-white px-1"><option>100/页</option><option>500/页</option></select></div></div>';
    return html;
}

function renderStowagePickBody(){
    const leftRows=_stowagePickState.left||[];
    const rightRows=_stowagePickState.right||[];
    let html='<div class="grid grid-cols-1 xl:grid-cols-[1fr_72px_1fr] gap-4 items-start">';
    html+='<section class="rounded-xl border border-surface-200 bg-white p-4 flex flex-col"><div class="text-sm font-semibold text-text-primary mb-3 border-l-4 border-primary-500 pl-2">'+tr('未选数据')+'</div>'+stowageDataTable(leftRows,'left')+'</section>';
    html+='<div class="self-stretch flex xl:flex-col items-center justify-center gap-3 py-4"><button type="button" onclick="moveStowageRows(\'right\')" class="w-10 h-9 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 cursor-pointer">›</button><button type="button" onclick="moveStowageRows(\'left\')" class="w-10 h-9 rounded-lg bg-primary-100 text-primary-700 font-semibold hover:bg-primary-200 cursor-pointer">‹</button></div>';
    html+='<section class="rounded-xl border border-primary-100 bg-primary-50/40 p-4 flex flex-col"><div class="text-sm font-semibold text-primary-700 mb-3 border-l-4 border-primary-500 pl-2">'+tr('已选数据')+'</div>'+stowageDataTable(rightRows,'right')+'</section>';
    html+='</div>';
    return html;
}

function moveStowageRows(direction){
    const from=direction==='right'?'left':'right';
    const to=direction==='right'?'right':'left';
    const checked=[...document.querySelectorAll('.stowage-'+from+'-check:checked')].map(function(input){return parseInt(input.dataset.stowageRow,10);}).filter(function(idx){return !isNaN(idx);}).sort(function(a,b){return b-a;});
    if(!checked.length){showToast(tr('请先勾选数据'));return;}
    checked.forEach(function(idx){
        const row=_stowagePickState[from].splice(idx,1)[0];
        if(row)_stowagePickState[to].push(row);
    });
    const body=document.getElementById('stowage-pick-body');
    if(body)body.innerHTML=renderStowagePickBody();
}

function openStowageRegisterModal(mode,id,rowIdx){
    const rows=stowageRows();
    _stowagePickState={left:rows.slice(),right:[]};
    const title=mode==='edit'?'编辑配舱单':(mode==='view'?'查看配舱单':'新增配舱单登记');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='92%';
    document.getElementById('crud-modal-title').textContent=tr(title);
    let html='<div class="space-y-4">';
    html+='<div class="grid grid-cols-1 lg:grid-cols-3 gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3">';
    html+=renderField({label:'销售产品',type:'select',options:['西非海运普货','空运敏感货','带电产品','普货快线'],value:'西非海运普货',required:true});
    html+=renderField({label:'运输方式',type:'select',options:['海运','空运','铁路','快递'],value:'海运',required:true});
    html+=renderField({label:'目的港',type:'select',options:['拉各斯','达喀尔','阿比让','特马','杜阿拉','洛美','科托努'],value:'拉各斯',required:true});
    html+=renderField({label:'提单号',value:'HLHLA260613001'});
    html+=renderField({label:'备注',type:'textarea',value:'按销售产品和目的港完成配舱登记'});
    html+='</div>';
    html+='<div id="stowage-pick-body">'+renderStowagePickBody()+'</div></div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button><button onclick="closeCrudModal();showToast(\''+tr('配舱登记成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('终配舱登记')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function filterBillOfLadingSuggestions(input){
    const box=document.getElementById('bind-bl-suggest');
    if(!box)return;
    const key=String(input.value||'').toUpperCase();
    const data=[
        ['HLHLA260613001','拉各斯','MAERSK','28件 / 560.00KG'],
        ['HLHABJ260612003','阿比让','CMA CGM','16件 / 288.00KG'],
        ['HLHTEM260611006','特马','COSCO','20件 / 410.50KG']
    ].filter(function(row){return !key||row.join('|').toUpperCase().indexOf(key)>=0;});
    box.innerHTML=data.map(function(row){
        return '<button type="button" onclick="selectBillOfLading(\''+esc(row[0])+'\',\''+esc(row[1])+'\',\''+esc(row[2])+'\',\''+esc(row[3])+'\')" class="w-full text-left px-3 py-2 border-b border-surface-100 hover:bg-primary-50 cursor-pointer"><div class="text-sm font-semibold text-primary-700">'+esc(row[0])+'</div><div class="text-xs text-text-muted">'+esc(row[1])+' · '+esc(row[2])+' · '+esc(row[3])+'</div></button>';
    }).join('')||'<div class="px-3 py-2 text-xs text-text-muted">'+tr('暂无匹配提单')+'</div>';
}

function selectBillOfLading(no,pod,carrier,summary){
    const input=document.getElementById('bind-bl-no');
    const detail=document.getElementById('bind-bl-detail');
    if(input)input.value=no;
    if(detail)detail.innerHTML='<div>'+tr('目的港')+'：'+esc(pod)+'</div><div>'+tr('船公司')+'：'+esc(carrier)+'</div><div>'+tr('货量')+'：'+esc(summary)+'</div>';
}

function openBindBlModal(id,rowIdx){
    const c=TC[id]||{};
    const data=_listData[id]||expandData(id);
    const row=(rowIdx>=0&&data[rowIdx])?data[rowIdx]:(data[0]||[]);
    const stowageNo=row[0]||'YPCD-20260613001';
    document.getElementById('crud-modal-title').textContent=tr('绑定提单');
    let html='<div class="space-y-4">';
    html+='<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    html+=renderField({label:'配舱单号',value:stowageNo,readonly:true,required:true});
    html+=renderField({label:'提单号',id:'bind-bl-no',value:'',placeholder:'输入提单号模糊匹配',oninput:'filterBillOfLadingSuggestions(this)',required:true});
    html+='</div>';
    html+='<div class="rounded-xl border border-surface-200 overflow-hidden"><div class="px-3 py-2 bg-surface-50 text-sm font-semibold text-text-secondary">'+tr('提单数据')+'</div><div id="bind-bl-suggest" class="max-h-44 overflow-y-auto"></div></div>';
    html+='<div id="bind-bl-detail" class="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">'+tr('输入提单号后可模糊带出提单数据')+'</div>';
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('绑定成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认绑定')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
    setTimeout(function(){const input=document.getElementById('bind-bl-no');if(input)filterBillOfLadingSuggestions(input);},0);
}

function issueWaybillLookup(value){
    const key=String(value||'').trim().toUpperCase();
    const rows=[
        {waybill:'WB-20260522004',logistics:'JD30012345',customer:'东莞市鑫海物流'},
        {waybill:'WB-20260613001',logistics:'SF10086523',customer:'深圳市华运达国际货运'},
        {waybill:'WB-20260613002',logistics:'YT98876543',customer:'广州远洋进出口贸易'},
        {waybill:'WB-20260613003',logistics:'KY77881234',customer:'上海锦程国际贸易'}
    ];
    return rows.find(function(row){return row.waybill.toUpperCase().indexOf(key)>=0||row.logistics.toUpperCase().indexOf(key)>=0;})||rows[0];
}

function fillIssueWaybillInfo(input){
    const row=issueWaybillLookup(input&&input.value);
    const waybill=document.getElementById('issue-waybill-no');
    const logistics=document.getElementById('issue-logistics-no');
    const customer=document.getElementById('issue-customer-name');
    if(waybill)waybill.value=row.waybill;
    if(logistics)logistics.value=row.logistics;
    if(customer)customer.value=row.customer;
}

function openIssueModal(mode,id,rowIdx,rowData){
    const L=_lang[_currentLang];
    const isView=mode==='view';
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:L.edit;
    const c=TC[id]||{};
    const autoNo=mode==='add'?'ISS-20260616001':((rowData&&rowData[0])||'ISS-20260613001');
    const initial=issueWaybillLookup((rowData&&((rowData[2]||rowData[3])))||'');
    document.getElementById('crud-modal-title').textContent=modeLabel+tr(c.t||'问题件管理');
    const readonly=isView;
    const fields=[
        {label:'问题件单号',value:autoNo,readonly:true,required:true},
        {label:'问题件类型',type:'select',options:['库内问题件','库外问题件'],value:(rowData&&rowData[1])||'库内问题件',readonly:readonly,required:true},
        {label:'运单号',id:'issue-waybill-no',value:(rowData&&rowData[2])||initial.waybill,readonly:true,required:true},
        {label:'物流单号',id:'issue-logistics-no',value:(rowData&&rowData[3])||initial.logistics,readonly:true,required:true},
        {label:'客户名称',id:'issue-customer-name',value:(rowData&&rowData[4])||initial.customer,readonly:true,required:true},
        {label:'所属仓库',type:'select',options:getWarehouseNameOptions(),value:(rowData&&rowData[5])||currentAccountWarehouse(),readonly:readonly,required:true},
        {label:'问题描述',type:'textarea',span:'md:col-span-2',value:(rowData&&rowData[6])||'',readonly:readonly,required:true}
    ];
    document.getElementById('crud-modal-body').innerHTML='<div class="space-y-4"><section class="rounded-xl border border-surface-200 bg-white p-4">'+renderFields(fields,'modal')+'</section></div>';
    document.getElementById('crud-modal-footer').innerHTML=isView
        ?'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>'
        :'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('保存成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提交')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
    markCustomModalRequired(id,mode);
}

