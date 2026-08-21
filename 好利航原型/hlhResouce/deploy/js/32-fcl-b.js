function openFclPriceModal(mode,id,rowIdx,rowData){
    const c=TC[id]||{};
    const L=_lang[_currentLang];
    const isView=mode==='view';
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:L.edit;
    const data=_listData[id]||expandData(id);
    const lastCode=data.length&&data[data.length-1]&&data[data.length-1][0]?data[data.length-1][0]:'FCL-000';
    const lm=String(lastCode).match(/^(.*?)(\d+)$/);
    const autoCode=lm?lm[1]+String(parseInt(lm[2],10)+1).padStart(lm[2].length,'0'):'FCL-001';
    function val(label,fb){return rowData?getTableValueByHeader(c,rowData,label,fb||''):(fb||'');}
    const codeLabel=(c.h||[])[0]||'编号';
    const isCostLike=['fcl-cost-price','fcl-business-cost','fcl-sales-price'].includes(id);
    const priceLabel=id==='fcl-cost-price'?'成本价':(id==='fcl-business-cost'?'业务成本':(id==='fcl-sales-price'?'销售价':'报价金额'));
    let fields=[
        {label:codeLabel,value:mode==='add'?autoCode:val(codeLabel,autoCode),readonly:true,required:true},
        {label:'柜型',type:'select',options:FCL_CONTAINER_OPTIONS,value:val('柜型','40HQ'),readonly:isView,required:true},
        {label:'始发港',type:'select',options:FCL_POL_OPTIONS,value:val('始发港','深圳盐田'),readonly:isView,required:true},
        {label:'目的港',type:'select',options:FCL_POD_OPTIONS,value:val('目的港','拉各斯'),readonly:isView,required:true},
        {label:'航司',type:'select',options:['MAERSK','COSCO','CMA CGM','MSC','ONE'],value:val('航司',val('船公司','MAERSK')),readonly:isView,required:true},
        {label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS,value:val('币别','USD'),readonly:isView,required:true},
        {label:'开始日期',type:'date',value:val('开始日期','2026-06-15'),readonly:isView,required:true},
        {label:'结束日期',type:'date',value:val('结束日期','2026-06-30'),readonly:isView,required:true},
        {label:'使用客户',type:'select',options:FCL_CUSTOMER_OPTIONS,value:val('使用客户','深圳市华运达国际货运'),readonly:isView},
        {label:'使用分公司',type:'select',options:FCL_BRANCH_OPTIONS,value:val('使用分公司','深圳分公司'),readonly:isView},
        {label:priceLabel,type:'number',value:val('报价金额',val('成本价',val('业务成本',val('销售价','4500')))),readonly:isView,required:true},
        {label:'状态',type:'select',options:c.s||['草稿','待审核','已生效'],value:val('状态',(c.s&&c.s[0])||'草稿'),readonly:isView,required:true},
        {label:'价格说明',type:'textarea',rows:3,span:'md:col-span-2 modal-remark-half',value:val('价格说明','整柜价格按柜型、始发港、目的港和有效期维护。'),readonly:isView}
    ];
    if(!isCostLike){
        fields.splice(9,0,{label:'报价字段',type:'select',options:['成本价+附加费+加价','海运费+附加费','成本价+利润'],value:val('报价字段','成本价+附加费+加价'),readonly:isView});
        fields.splice(11,0,{label:'附加费',type:'number',value:val('附加费','180'),readonly:isView});
    }else if(id!=='fcl-business-cost'){
        const priceIdx=fields.findIndex(function(f){return f.label===priceLabel;});
        fields.splice(priceIdx+1,0,{label:'业务成本',type:'number',value:val('业务成本','4180'),readonly:isView,required:true});
    }
    if(id==='fcl-cost-price'){
        const carrierIdx=fields.findIndex(function(f){return f.label==='航司';});
        fields.splice(carrierIdx+1,0,{label:'航司路线配置',type:'select',options:getFclCarrierRouteOptions(),value:val('航司路线配置','FCR-20260613001 / MAERSK / 深圳盐田-拉各斯'),readonly:isView,required:true,id:'fcl-cost-route-select',onchange:'onFclCostRouteChange()'});
        _fclCostMatrixContainers=getFclCostRouteContainers(val('航司路线配置','FCR-20260613001 / MAERSK / 深圳盐田-拉各斯'));
    }
    if(id==='fcl-business-cost'){
        fields=[
            {label:'业务成本编号',value:mode==='add'?autoCode:val(codeLabel,autoCode),readonly:true,required:true},
            {label:'使用航司',type:'select',options:['MAERSK','COSCO','CMA CGM','MSC','ONE'],value:val('使用航司',val('航司','MAERSK')),readonly:isView,required:true},
            {label:'使用分公司',type:'select',options:FCL_BRANCH_OPTIONS,value:val('使用分公司','深圳分公司'),readonly:isView,required:true},
            {label:'使用业务员',type:'select',options:getEmployeeNameOptions(),value:val('使用业务员',''),readonly:isView},
            {label:'加价类型',type:'select',options:['百分比','总价'],value:val('加价类型','总价'),readonly:isView,required:true},
            {label:'加价金额',type:'number',value:val('加价金额','200'),readonly:isView,required:true},
            {label:'开始时间',type:'date',value:val('开始时间',val('生效日期','2026-06-15')),readonly:isView,required:true},
            {label:'结束时间',type:'date',value:val('结束时间','2026-06-30'),readonly:isView,required:true}
        ];
    }else if(id==='fcl-sales-price'){
        fields=[
            {label:'销售变化',value:mode==='add'?autoCode:val(codeLabel,autoCode),readonly:true,required:true},
            {label:'使用航司',type:'select',options:['MAERSK','COSCO','CMA CGM','MSC','ONE'],value:val('使用航司',val('航司','MAERSK')),readonly:isView,required:true},
            {label:'使用客户',type:'select',options:FCL_CUSTOMER_OPTIONS,value:val('使用客户',''),readonly:isView},
            {label:'加价类型',type:'select',options:['百分比','总价'],value:val('加价类型','总价'),readonly:isView,required:true},
            {label:'加价金额',type:'number',value:val('加价金额','320'),readonly:isView,required:true},
            {label:'开始时间',type:'date',value:val('开始时间',val('开始日期','2026-06-15')),readonly:isView,required:true},
            {label:'结束时间',type:'date',value:val('结束时间',val('结束日期','2026-06-30')),readonly:isView,required:true}
        ];
    }
    document.getElementById('crud-modal-title').textContent=modeLabel+tr(c.t||'整柜报价');
    let html='<div class="space-y-5">';
    /* 成本价：柜型/港口在下方矩阵维护；币别改到运费价格表里逐行维护；不再区分使用分公司 */
    const hiddenMainLabels=id==='fcl-cost-price'?['柜型','始发港','目的港','业务成本','币别','使用分公司',priceLabel]:(['fcl-business-cost','fcl-sales-price'].includes(id)?[]:['柜型',priceLabel]);
    const mainFields=isCostLike?fields.filter(function(f){return !hiddenMainLabels.includes(f.label);}):fields;
    const costKeyFields=[
        {label:'柜型',type:'select',options:FCL_CONTAINER_OPTIONS,value:val('柜型','40HQ'),readonly:isView,required:true},
        {label:priceLabel,type:'number',value:val('报价金额',val('成本价',val('业务成本',val('销售价','4500')))),readonly:isView,required:true}
    ];
    html+='<section class="rounded-xl border border-primary-100 bg-white p-4"><div class="text-sm font-semibold text-primary-700 mb-4">'+tr('整柜价格信息')+'</div>'+renderFields(mainFields,'modal')+'</section>';
    if(isCostLike){
        if(id==='fcl-cost-price')html+='<div id="fcl-cost-matrix-section">'+renderFclCostPriceMatrixSection(isView,_fclCostMatrixContainers)+'</div>';
        else if(!['fcl-business-cost','fcl-sales-price'].includes(id))html+=renderFclFeeMaintainSection(costKeyFields,isView);
    }else{
        html+='<section class="rounded-xl border border-surface-200 bg-surface-50 p-4"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('价格组成')+'</div><div class="grid grid-cols-1 md:grid-cols-4 gap-3">';
        [['成本价',val('成本价','4120')],['附加费',val('附加费','180')],['加价金额',val('加价金额','200')],['报价金额',val('报价金额',val('销售价','4500'))]].forEach(function(item){
            html+='<div class="rounded-lg border border-surface-200 bg-white p-3"><div class="text-xs text-text-muted">'+tr(item[0])+'</div><div class="mt-1 text-lg font-semibold text-primary-700">'+esc(item[1]||'0')+'</div></div>';
        });
        html+='</div></section>';
    }
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML=isView
        ?'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>'
        :'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+tr('保存成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提交')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function getFclCarrierRouteOptions(){
    const c=TC['fcl-carrier-route']||{};
    const headers=c.h||[];
    const codeIdx=headers.indexOf('配置编号');
    const carrierIdx=headers.indexOf('航司');
    const polIdx=headers.indexOf('始发港');
    const podIdx=headers.indexOf('目的港');
    const rows=(c.d&&c.d.length?c.d:[
        ['FCR-20260613001','MAERSK','','深圳盐田','拉各斯','','海运','32','启用'],
        ['FCR-20260612002','COSCO','','广州南沙','达喀尔','','海运','29','启用']
    ]);
    return rows.map(function(row){
        const code=row[codeIdx>=0?codeIdx:0]||'FCR-001';
        const carrier=row[carrierIdx>=0?carrierIdx:1]||'MAERSK';
        const pol=row[polIdx>=0?polIdx:3]||'深圳盐田';
        const pod=row[podIdx>=0?podIdx:4]||'拉各斯';
        return code+' / '+carrier+' / '+pol+'-'+pod;
    });
}

function fclRouteContainerInput(value,readonly){
    return '<input type="text" '+(readonly?'readonly ':'')+'list="fcl-route-container-options" class="w-full h-9 px-2 text-xs border-0 outline-none bg-transparent focus:bg-primary-50 '+(readonly?'cursor-default text-text-secondary':'')+'" placeholder="'+esc(tr('输入柜型，多个用逗号分隔'))+'" value="'+esc(value||'')+'">';
}

function fclCarrierRouteRowHtml(row,readonly){
    const data=row||{};
    let html='<tr class="fcl-carrier-route-row hover:bg-primary-50/30 border-t border-surface-100">';
    html+='<td class="border border-surface-200 bg-white min-w-[160px]">'+fclFeeSelect(FCL_POL_OPTIONS,data.pol||'深圳盐田',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white min-w-[160px]">'+fclFeeSelect(FCL_POD_OPTIONS,data.pod||'拉各斯',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white min-w-[260px]">'+fclRouteContainerInput(data.container||'20,40,40H,45H',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white text-center sticky right-0 z-10 shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]">'+(readonly?'<span class="text-xs text-text-muted">-</span>':'<button type="button" onclick="removeFclCarrierRouteRow(this)" class="h-8 px-3 text-xs text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button>')+'</td>';
    html+='</tr>';
    return html;
}

function renderFclCarrierRouteTable(rowData,isView){
    const rowPol=rowData?getTableValueByHeader(TC['fcl-carrier-route']||{},rowData,'始发港','深圳盐田'):'深圳盐田';
    const rowPod=rowData?getTableValueByHeader(TC['fcl-carrier-route']||{},rowData,'目的港','拉各斯'):'拉各斯';
    const rows=[
        {pol:rowPol,pod:rowPod,container:'20,40,40H,45H'},
        {pol:'广州南沙',pod:'达喀尔',container:'20,40'},
        {pol:'上海洋山',pod:'阿比让',container:'40,40H,45H,53H'}
    ];
    let html='<section class="rounded-xl border border-surface-200 bg-surface-50 overflow-hidden">';
    html+='<div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between gap-3">';
    html+='<div class="text-sm font-semibold text-text-primary">'+tr('路线柜型信息')+'</div>';
    if(!isView){
        html+='<div class="flex items-center gap-2"><button type="button" onclick="addFclCarrierRouteRow()" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">+ '+tr('新增')+'</button><button type="button" onclick="clearFclCarrierRouteRows()" class="h-8 px-3 text-xs font-medium text-text-secondary border border-surface-200 rounded-lg bg-white hover:bg-surface-50 cursor-pointer">'+tr('清空')+'</button></div>';
    }
    html+='</div>';
    html+='<div class="p-4"><div class="rounded-lg border border-surface-200 bg-white overflow-hidden">';
    html+='<datalist id="fcl-route-container-options"><option value="20"><option value="40"><option value="40H"><option value="45H"><option value="53H"><option value="20GP"><option value="40GP"><option value="40HQ"><option value="45HQ"></datalist>';
    html+='<div class="overflow-auto max-h-[320px]"><table class="w-full min-w-[720px] text-xs border-collapse">';
    html+='<thead class="sticky top-0 z-10"><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['始发港','目的港','柜型','操作'].forEach(function(hd){
        const sticky=hd==='操作'?' sticky right-0 z-20 shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]':'';
        html+='<th class="text-left px-3 py-2 border border-surface-200 whitespace-nowrap bg-[#EFF6FF]'+sticky+'">'+tr(hd)+'</th>';
    });
    html+='</tr></thead><tbody id="fcl-carrier-route-body">';
    rows.forEach(function(row){html+=fclCarrierRouteRowHtml(row,isView);});
    html+='</tbody></table></div>';
    html+='<div class="px-4 py-2 text-[11px] text-text-muted bg-surface-50 border-t border-surface-200">'+tr('同一航司可维护多条始发港、目的港线路，并在柜型列维护可用柜型，支持自定义多个柜型。')+'</div>';
    html+='</div></div></section>';
    return html;
}

function addFclCarrierRouteRow(){
    const tbody=document.getElementById('fcl-carrier-route-body');
    if(!tbody)return;
    tbody.insertAdjacentHTML('beforeend',fclCarrierRouteRowHtml({pol:'深圳盐田',pod:'拉各斯',container:'20,40,40H,45H'},false));
    applyRuntimeEnhancements(tbody.lastElementChild);
}

function removeFclCarrierRouteRow(btn){
    const tbody=document.getElementById('fcl-carrier-route-body');
    const rows=tbody?tbody.querySelectorAll('.fcl-carrier-route-row'):[];
    if(rows.length<=1){showToast(tr('至少保留一条路线柜型信息'));return;}
    const row=btn&&btn.closest?btn.closest('.fcl-carrier-route-row'):null;
    if(row)row.remove();
}

function clearFclCarrierRouteRows(){
    const tbody=document.getElementById('fcl-carrier-route-body');
    if(!tbody)return;
    tbody.innerHTML=fclCarrierRouteRowHtml({pol:'深圳盐田',pod:'拉各斯',container:'20,40,40H,45H'},false);
    applyRuntimeEnhancements(tbody);
}

function openFclCarrierRouteModal(mode,id,rowIdx,rowData){
    const c=TC[id]||{};
    const L=_lang[_currentLang];
    const isView=mode==='view';
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:L.edit;
    const data=_listData[id]||expandData(id);
    const lastCode=data.length&&data[data.length-1]&&data[data.length-1][0]?data[data.length-1][0]:'FCR-000';
    const lm=String(lastCode).match(/^(.*?)(\d+)$/);
    const autoCode=lm?lm[1]+String(parseInt(lm[2],10)+1).padStart(lm[2].length,'0'):'FCR-001';
    function val(label,fb){return rowData?getTableValueByHeader(c,rowData,label,fb||''):(fb||'');}
    const fields=[
        {label:'配置编号',value:mode==='add'?autoCode:val('配置编号',autoCode),readonly:true,required:true},
        {label:'航司',type:'select',options:['MAERSK','COSCO','CMA CGM','MSC','ONE'],value:val('航司','MAERSK'),readonly:isView,required:true},
        {label:'运输方式',type:'select',options:['海运','铁运','空运'],value:val('运输方式','海运'),readonly:isView,required:true},
        {label:'航程(天)',type:'number',value:val('航程(天)','32'),readonly:isView},
        {label:'启用状态',type:'select',options:['启用','停用'],value:val('启用状态','启用'),readonly:isView,required:true}
    ];
    document.getElementById('crud-modal-title').textContent=modeLabel+tr(c.t||'航司路线配置');
    document.getElementById('crud-modal-body').innerHTML='<div class="space-y-5"><section class="rounded-xl border border-primary-100 bg-white p-4"><div class="text-sm font-semibold text-primary-700 mb-4">'+tr('基础信息')+'</div>'+renderFields(fields,'modal')+'</section>'+renderFclCarrierRouteTable(rowData,isView)+'</div>';
    document.getElementById('crud-modal-footer').innerHTML=isView
        ?'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>'
        :'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+tr('保存成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提交')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function fclFeeInput(value,readonly,extraClass){
    return '<input type="text" '+(readonly?'readonly ':'')+'class="w-full h-9 px-2 text-xs border-0 outline-none bg-transparent focus:bg-primary-50 '+(readonly?'cursor-default text-text-secondary':'')+' '+(extraClass||'')+'" value="'+esc(value||'')+'">';
}

function fclFeeSelect(options,value,readonly){
    if(readonly)return fclFeeInput(value,true);
    return '<select class="w-full h-9 px-2 text-xs border-0 outline-none bg-transparent focus:bg-primary-50">'+selectOptionsHtml(options,value)+'</select>';
}

// 费用信息柜型列与航司路线配置联动
let _fclCostMatrixContainers=['20','40','40H','45H'];
function getFclCostRouteContainers(optionVal){
    const code=String(optionVal||'').split('/')[0].trim();
    const map={
        'FCR-20260613001':['20','40','40H','45H'],
        'FCR-20260612002':['20','40']
    };
    return (code&&map[code])?map[code]:['20','40','40H','45H'];
}
function fclCostSampleAmount(container,delta){
    const base={'20':2460,'40':3980,'40H':4120,'40HQ':4120,'45':4380,'45H':4380,'53H':4600,'20GP':2460,'40GP':3980,'45HQ':4380};
    const v=base[container];
    return v===undefined?'':String(v+(delta||0));
}
function fclCostMatrixRowHtml(row,readonly,containers){
    containers=containers||_fclCostMatrixContainers;
    const data=row||{};
    let html='<tr class="fcl-cost-matrix-row hover:bg-primary-50/30 border-t border-surface-100">';
    html+='<td class="border border-surface-200 bg-white min-w-[150px]">'+fclFeeSelect(FCL_POL_OPTIONS,data.pol||'深圳盐田',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white min-w-[150px]">'+fclFeeSelect(FCL_POD_OPTIONS,data.pod||'拉各斯',readonly)+'</td>';
    /* 币别：目的港之后，逐行维护（原来在「整柜价格信息」里统一选） */
    html+='<td class="border border-surface-200 bg-white min-w-[120px]">'+fclFeeSelect(FCL_CURRENCY_OPTIONS,data.currency||'USD',readonly)+'</td>';
    containers.forEach(function(ct){
        html+='<td class="border border-surface-200 bg-white min-w-[120px]">'+fclFeeInput(data.empty?'':fclCostSampleAmount(ct,data.delta),readonly,'text-right')+'</td>';
    });
    html+='<td class="border border-surface-200 bg-white text-center sticky right-0 z-10 shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]">'+(readonly?'<span class="text-xs text-text-muted">-</span>':'<button type="button" onclick="removeFclCostMatrixRow(this)" class="h-8 px-3 text-xs text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button>')+'</td>';
    html+='</tr>';
    return html;
}

function onFclCostRouteChange(){
    const sel=document.getElementById('fcl-cost-route-select');
    _fclCostMatrixContainers=getFclCostRouteContainers(sel?sel.value:'');
    const section=document.getElementById('fcl-cost-matrix-section');
    if(section){section.innerHTML=renderFclCostPriceMatrixSection(false,_fclCostMatrixContainers);applyRuntimeEnhancements(section);}
}

function renderFclCostPriceMatrixSection(isView,containers){
    _fclCostMatrixContainers=containers||_fclCostMatrixContainers;
    containers=_fclCostMatrixContainers;
    const rows=[
        {pol:'深圳盐田',pod:'拉各斯',delta:0},
        {pol:'广州南沙',pod:'达喀尔',delta:-100},
        {pol:'上海洋山',pod:'阿比让',delta:100}
    ];
    let html='<section class="rounded-xl border border-surface-200 bg-surface-50 overflow-hidden">';
    html+='<div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between gap-3">';
    html+='<div class="text-sm font-semibold text-text-primary">'+tr('运费价格')+'</div>';
    if(!isView){
        html+='<div class="flex items-center gap-2"><button type="button" onclick="addFclCostMatrixRow()" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">+ '+tr('新增')+'</button><button type="button" onclick="clearFclCostMatrixRows()" class="h-8 px-3 text-xs font-medium text-text-secondary border border-surface-200 rounded-lg bg-white hover:bg-surface-50 cursor-pointer">'+tr('清空')+'</button></div>';
    }
    html+='</div>';
    html+='<div class="p-4"><div class="rounded-lg border border-surface-200 bg-white overflow-hidden">';
    html+='<div class="overflow-auto max-h-[320px]"><table class="w-full min-w-[920px] text-xs border-collapse">';
    html+='<thead class="sticky top-0 z-10"><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['始发港','目的港','币别'].concat(containers).concat(['操作']).forEach(function(hd){
        const sticky=hd==='操作'?' sticky right-0 z-20 shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]':'';
        html+='<th class="text-left px-3 py-2 border border-surface-200 whitespace-nowrap bg-[#EFF6FF]'+sticky+'">'+tr(hd)+'</th>';
    });
    html+='</tr></thead><tbody id="fcl-cost-matrix-body">';
    rows.forEach(function(row){html+=fclCostMatrixRowHtml(row,isView,containers);});
    html+='</tbody></table></div>';
    html+='<div class="px-4 py-2 text-[11px] text-text-muted bg-surface-50 border-t border-surface-200">'+tr('柜型列与所选航司路线配置联动，按始发港、目的港维护对应柜型成本价，保存后随当前成本价记录一起生效。')+'</div>';
    html+='</div>';
    html+=renderFclCostSurchargeTable(isView);
    html+='</div></section>';
    return html;
}

function fclCostSurchargeRowHtml(row,readonly){
    const data=row||{};
    let html='<tr class="fcl-cost-surcharge-row hover:bg-primary-50/30 border-t border-surface-100">';
    html+='<td class="border border-surface-200 bg-white min-w-[180px]">'+fclFeeInput(data.type||'',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white min-w-[150px]">'+fclFeeSelect(['按柜','按票','按重量','按体积'],data.billingMode||'按柜',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white min-w-[140px]">'+fclFeeInput(data.amount||'',readonly,'text-right')+'</td>';
    html+='<td class="border border-surface-200 bg-white min-w-[120px]">'+fclFeeSelect(FCL_CURRENCY_OPTIONS,data.currency||'USD',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white text-center sticky right-0 z-10 shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]">'+(readonly?'<span class="text-xs text-text-muted">-</span>':'<button type="button" onclick="removeFclCostSurchargeRow(this)" class="h-8 px-3 text-xs text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button>')+'</td>';
    html+='</tr>';
    return html;
}

function renderFclCostSurchargeTable(isView){
    const rows=[
        {type:'码头附加费',priceMode:'总价',billingMode:'按柜',amount:'120',currency:'USD'},
        {type:'文件费',priceMode:'单价',billingMode:'按票',amount:'80',currency:'USD'},
        {type:'燃油附加费',priceMode:'总价',billingMode:'按柜',amount:'60',currency:'USD'}
    ];
    let html='<div class="mt-4 rounded-lg border border-surface-200 bg-white overflow-hidden">';
    html+='<div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between gap-3"><div class="text-xs font-semibold text-text-muted">'+tr('附加费价格')+'</div>';
    if(!isView){
        html+='<div class="flex items-center gap-2"><button type="button" onclick="addFclCostSurchargeRow()" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">+ '+tr('新增')+'</button><button type="button" onclick="clearFclCostSurchargeRows()" class="h-8 px-3 text-xs font-medium text-text-secondary border border-surface-200 rounded-lg bg-white hover:bg-surface-50 cursor-pointer">'+tr('清空')+'</button></div>';
    }
    html+='</div>';
    html+='<div class="overflow-auto max-h-[220px]"><table class="w-full min-w-[900px] text-xs border-collapse">';
    html+='<thead class="sticky top-0 z-10"><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['附加费类型','计费方式','金额','币别','操作'].forEach(function(hd){
        const sticky=hd==='操作'?' sticky right-0 z-20 shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]':'';
        html+='<th class="text-left px-3 py-2 border border-surface-200 whitespace-nowrap bg-[#EFF6FF]'+sticky+'">'+tr(hd)+'</th>';
    });
    html+='</tr></thead><tbody id="fcl-cost-surcharge-body">';
    rows.forEach(function(row){html+=fclCostSurchargeRowHtml(row,isView);});
    html+='</tbody></table></div>';
    html+='<div class="px-4 py-2 text-[11px] text-text-muted bg-surface-50 border-t border-surface-200">'+tr('附加费与成本价一并维护，保存后用于报价、试算和费用重算。')+'</div>';
    html+='</div>';
    return html;
}

function addFclCostMatrixRow(){
    const tbody=document.getElementById('fcl-cost-matrix-body');
    if(!tbody)return;
    tbody.insertAdjacentHTML('beforeend',fclCostMatrixRowHtml({pol:'深圳盐田',pod:'拉各斯',empty:true},false,_fclCostMatrixContainers));
    applyRuntimeEnhancements(tbody.lastElementChild);
}

function removeFclCostMatrixRow(btn){
    const tbody=document.getElementById('fcl-cost-matrix-body');
    const rows=tbody?tbody.querySelectorAll('.fcl-cost-matrix-row'):[];
    if(rows.length<=1){showToast(tr('至少保留一条费用信息'));return;}
    const row=btn&&btn.closest?btn.closest('.fcl-cost-matrix-row'):null;
    if(row)row.remove();
}

function clearFclCostMatrixRows(){
    const tbody=document.getElementById('fcl-cost-matrix-body');
    if(!tbody)return;
    tbody.innerHTML=fclCostMatrixRowHtml({pol:'深圳盐田',pod:'拉各斯',empty:true},false,_fclCostMatrixContainers);
    applyRuntimeEnhancements(tbody);
}

function addFclCostSurchargeRow(){
    const tbody=document.getElementById('fcl-cost-surcharge-body');
    if(!tbody)return;
    tbody.insertAdjacentHTML('beforeend',fclCostSurchargeRowHtml({type:'',priceMode:'总价',billingMode:'按柜',amount:'',currency:'USD'},false));
    applyRuntimeEnhancements(tbody.lastElementChild);
}

function removeFclCostSurchargeRow(btn){
    const tbody=document.getElementById('fcl-cost-surcharge-body');
    const rows=tbody?tbody.querySelectorAll('.fcl-cost-surcharge-row'):[];
    if(rows.length<=1){showToast(tr('至少保留一条附加费信息'));return;}
    const row=btn&&btn.closest?btn.closest('.fcl-cost-surcharge-row'):null;
    if(row)row.remove();
}

function clearFclCostSurchargeRows(){
    const tbody=document.getElementById('fcl-cost-surcharge-body');
    if(!tbody)return;
    tbody.innerHTML=fclCostSurchargeRowHtml({type:'',priceMode:'总价',billingMode:'按柜',amount:'',currency:'USD'},false);
    applyRuntimeEnhancements(tbody);
}

function fclFeeRowHtml(row,readonly){
    const data=row||{};
    let html='<tr class="fcl-fee-row hover:bg-primary-50/30 border-t border-surface-100">';
    html+='<td class="border border-surface-200 bg-white min-w-[180px]">'+fclFeeInput(data.type||'',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white min-w-[150px]">'+fclFeeSelect(['单价','总价'],data.priceMode||'总价',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white min-w-[150px]">'+fclFeeSelect(['按柜','按票','按重量','按体积'],data.billingMode||'按柜',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white min-w-[140px]">'+fclFeeInput(data.amount||'',readonly,'text-right')+'</td>';
    html+='<td class="border border-surface-200 bg-white min-w-[120px]">'+fclFeeSelect(FCL_CURRENCY_OPTIONS,data.currency||'USD',readonly)+'</td>';
    html+='<td class="border border-surface-200 bg-white text-center sticky right-0 z-10 shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]">'+(readonly?'<span class="text-xs text-text-muted">-</span>':'<button type="button" onclick="removeFclFeeRow(this)" class="h-8 px-3 text-xs text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button>')+'</td>';
    html+='</tr>';
    return html;
}

function renderFclFeeMaintainSection(costKeyFields,isView){
    const rows=[
        {type:'海运费',priceMode:'总价',billingMode:'按柜',amount:'4120',currency:'USD'},
        {type:'码头附加费',priceMode:'总价',billingMode:'按柜',amount:'120',currency:'USD'},
        {type:'文件费',priceMode:'单价',billingMode:'按票',amount:'80',currency:'USD'}
    ];
    let html='<section class="rounded-xl border border-surface-200 bg-surface-50 overflow-hidden">';
    html+='<div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between gap-3">';
    html+='<div class="text-sm font-semibold text-text-primary">'+tr('费用信息')+'</div>';
    if(!isView){
        html+='<div class="flex items-center gap-2"><button type="button" onclick="addFclFeeRow()" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">+ '+tr('新增')+'</button><button type="button" onclick="clearFclFeeRows()" class="h-8 px-3 text-xs font-medium text-text-secondary border border-surface-200 rounded-lg bg-white hover:bg-surface-50 cursor-pointer">'+tr('清空')+'</button></div>';
    }
    html+='</div>';
    html+='<div class="p-4 space-y-3">';
    html+='<div class="rounded-lg border border-surface-200 bg-white p-4"><div class="text-xs font-semibold text-text-muted mb-3">'+tr('柜型与价格')+'</div>'+renderFields(costKeyFields,'modal')+'</div>';
    html+='<div class="rounded-lg border border-surface-200 bg-white overflow-hidden">';
    html+='<div class="overflow-auto max-h-[280px]"><table class="w-full min-w-[900px] text-xs border-collapse">';
    html+='<thead class="sticky top-0 z-10"><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['费用类型','单价/总价','计费方式','金额','币别','操作'].forEach(function(hd){
        const sticky=hd==='操作'?' sticky right-0 z-20 shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]':'';
        html+='<th class="text-left px-3 py-2 border border-surface-200 whitespace-nowrap bg-[#EFF6FF]'+sticky+'">'+tr(hd)+'</th>';
    });
    html+='</tr></thead><tbody id="fcl-fee-maintain-body">';
    rows.forEach(function(row){html+=fclFeeRowHtml(row,isView);});
    html+='</tbody></table></div>';
    html+='<div class="px-4 py-2 text-[11px] text-text-muted bg-surface-50 border-t border-surface-200">'+tr('支持按费用类型维护价格口径，新增、编辑、删除后随当前价格记录一起保存。')+'</div>';
    html+='</div></div></section>';
    return html;
}

function addFclFeeRow(){
    const tbody=document.getElementById('fcl-fee-maintain-body');
    if(!tbody)return;
    tbody.insertAdjacentHTML('beforeend',fclFeeRowHtml({type:'',priceMode:'总价',billingMode:'按柜',amount:'',currency:'USD'},false));
    applyRuntimeEnhancements(tbody.lastElementChild);
}

function removeFclFeeRow(btn){
    const tbody=document.getElementById('fcl-fee-maintain-body');
    const rows=tbody?tbody.querySelectorAll('.fcl-fee-row'):[];
    if(rows.length<=1){showToast(tr('至少保留一条费用信息'));return;}
    const row=btn&&btn.closest?btn.closest('.fcl-fee-row'):null;
    if(row)row.remove();
}

function clearFclFeeRows(){
    const tbody=document.getElementById('fcl-fee-maintain-body');
    if(!tbody)return;
    tbody.innerHTML=fclFeeRowHtml({type:'',priceMode:'总价',billingMode:'按柜',amount:'',currency:'USD'},false);
    applyRuntimeEnhancements(tbody);
}

function getFclTrialCalcRows(id,filters){
    const c=TC[id||'fcl-trial-calc']||{};
    const f=filters||{};
    function match(cell,value){
        return !value||String(cell||'').toLowerCase().indexOf(String(value).toLowerCase())>=0;
    }
    return (c.d||[]).filter(function(row){
        return match(row[0],f.container)&&match(row[1],f.pol)&&match(row[2],f.pod);
    }).slice().sort(function(a,b){return (parseFloat(a[8])||0)-(parseFloat(b[8])||0);});
}

function renderFclTrialCalcRows(rows){
    if(!rows.length)return '<tr><td colspan="9" class="px-4 py-8 text-center text-sm text-text-muted">'+tr('暂无匹配报价，请调整柜型、始发港或目的港后重试。')+'</td></tr>';
    return rows.map(function(row,idx){
        let h='<tr class="'+(idx%2?'bg-surface-50/50':'')+' border-t border-surface-100 hover:bg-primary-50/30">';
        row.slice(0,9).forEach(function(cell,ci){
            const cls=ci===8?'font-bold text-primary-700':(ci===0?'font-semibold text-primary-700':'text-text-secondary');
            h+='<td class="px-4 py-3 whitespace-nowrap '+cls+'">'+esc(tr(cell))+'</td>';
        });
        h+='</tr>';
        return h;
    }).join('');
}

function runFclTrialCalc(id){
    const tableId=id||'fcl-trial-calc';
    const filters={
        container:(document.getElementById('fcl-trial-container')||{}).value||'',
        pol:(document.getElementById('fcl-trial-pol')||{}).value||'',
        pod:(document.getElementById('fcl-trial-pod')||{}).value||''
    };
    const rows=getFclTrialCalcRows(tableId,filters);
    const tbody=document.getElementById('fcl-trial-calc-body');
    if(tbody)tbody.innerHTML=renderFclTrialCalcRows(rows);
    const count=document.getElementById('fcl-trial-result-count');
    if(count)count.textContent=tr('共')+' '+rows.length+' '+tr('条报价');
    showToast(tr('试算完成'));
}

function generateFclTrialCalcPage(id){
    const rows=getFclTrialCalcRows(id);
    const c=TC[id]||TC['fcl-trial-calc']||{};
    let h='<div class="h-full overflow-auto bg-surface-50 p-5">';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-5 mb-4">';
    h+='<div class="flex items-center justify-between gap-3 mb-4"><div><h2 class="text-lg font-semibold text-text-primary">'+tr(c.t||'整柜试算')+'</h2><p class="text-sm text-text-muted mt-1">'+tr('输入柜型、始发港、目的港后试算可用报价，结果按价格从低到高展示。')+'</p></div></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">';
    h+=renderField({label:'柜型',id:'fcl-trial-container',placeholder:'请输入柜型',required:true});
    h+=renderField({label:'始发港',id:'fcl-trial-pol',placeholder:'请输入始发港',required:true});
    h+=renderField({label:'目的港',id:'fcl-trial-pod',placeholder:'请输入目的港',required:true});
    h+='<button type="button" onclick="runFclTrialCalc(\''+id+'\')" class="h-10 px-6 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 cursor-pointer">'+tr('试算')+'</button>';
    h+='</div></div>';
    h+='<div class="bg-white rounded-xl border border-surface-200 overflow-hidden">';
    h+='<div class="px-5 py-4 border-b border-surface-200 flex items-center justify-between"><div class="text-sm font-semibold text-text-primary">'+tr('试算结果')+'</div><div id="fcl-trial-result-count" class="text-xs text-text-muted">'+tr('共')+' '+rows.length+' '+tr('条报价')+' · '+tr('按报价总额从低到高排序')+'</div></div>';
    h+='<div class="overflow-auto"><table class="w-full text-sm min-w-[1100px]"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['柜型','始发港','目的港','币别','开始日期','结束日期','价格说明','附加费','报价总额'].forEach(function(hd){h+='<th class="text-left px-4 py-3 whitespace-nowrap font-semibold">'+tr(hd)+'</th>';});
    h+='</tr></thead><tbody id="fcl-trial-calc-body">'+renderFclTrialCalcRows(rows)+'</tbody></table></div></div></div>';
    setTimeout(function(){applyRuntimeEnhancements(document.getElementById('main-content'));},0);
    return h;
}

