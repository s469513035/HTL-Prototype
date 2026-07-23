function palletPrintStep(id,delta){
    const el=document.getElementById(id);
    if(!el)return;
    const cur=parseInt(el.value||'0',10)||0;
    el.value=Math.max(0,cur+delta);
}

function renderPalletBarcodeSvg(code,heightMm){
    const svgW=280;
    const svgH=Math.max(40,Math.round(heightMm*0.9));
    let seed=0;
    for(let i=0;i<code.length;i++)seed=(seed*31+code.charCodeAt(i))>>>0;
    function next(){seed=(seed*1103515245+12345)>>>0;return (seed>>>16)&0x7fff;}
    let bars='';
    let x=8;
    while(x<svgW-8){
        const w=1+(next()%3);
        const black=(next()%2)===0;
        if(black)bars+='<rect x="'+x+'" y="4" width="'+w+'" height="'+(svgH-8)+'" fill="#000"/>';
        x+=w+(1+(next()%2));
    }
    return '<svg viewBox="0 0 '+svgW+' '+svgH+'" preserveAspectRatio="none" style="display:block;width:100%;height:'+Math.max(50,Math.round(heightMm*1.1))+'px;background:#fff">'+bars+'</svg>';
}

function generatePalletBarcodes(){
    const count=Math.max(1,parseInt((document.getElementById('pallet-print-count')||{}).value||'10',10));
    const prefix=((document.getElementById('pallet-print-prefix')||{}).value||'HLH-');
    const height=parseInt((document.getElementById('pallet-print-height')||{}).value||'70',10);
    const font=parseInt((document.getElementById('pallet-print-font')||{}).value||'10',10);
    const preview=document.getElementById('pallet-print-preview');
    if(!preview)return;
    const d=new Date();
    const dateStr=String(d.getFullYear())+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
    const items=[];
    for(let i=0;i<Math.min(count,999);i++){
        const seq=String(i+1).padStart(3,'0');
        const code=prefix+dateStr+seq;
        items.push('<div class="border border-surface-200 rounded p-3 flex flex-col items-center bg-white overflow-hidden"><div class="w-full">'+renderPalletBarcodeSvg(code,height)+'</div><div class="text-text-secondary text-center mt-1 w-full" style="font-size:'+font+'pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+esc(code)+'">'+esc(code)+'</div></div>');
    }
    let html='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('预览')+' ('+tr('共')+' '+count+' '+tr('张')+')</div>';
    html+='<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">'+items.join('')+'</div>';
    if(count>999)html+='<div class="mt-2 text-xs text-text-muted">'+tr('单日流水号最多 999 张，实际打印按张数生成。')+'</div>';
    preview.innerHTML=html;
}

function printPalletBarcodes(){
    const preview=document.getElementById('pallet-print-preview');
    if(!preview||!preview.innerHTML.trim()){
        showToast(tr('请先生成条形码'));
        return;
    }
    showToast(tr('已发送打印任务'));
    if(window.print)setTimeout(function(){window.print();},60);
}

function generatePalletPrintPage(id){
    let h='';
    h+='<div class="h-full overflow-auto bg-surface-50 p-6">';
    h+='<div class="max-w-4xl mx-auto bg-white rounded-xl border border-surface-200 shadow-sm p-6">';
    h+='<div class="text-base font-semibold text-text-primary mb-5">'+tr('条形码打印系统')+' (10cm×10cm)</div>';
    h+='<div class="space-y-4">';
    h+='<div class="flex items-center gap-4"><label class="w-28 text-sm text-text-secondary text-right">'+tr('打印张数')+'</label><div class="flex-1 max-w-xs">'+palletPrintNumStepperHtml('pallet-print-count','10','1')+'</div></div>';
    h+='<div class="flex items-center gap-4"><label class="w-28 text-sm text-text-secondary text-right">'+tr('前缀')+'</label><input id="pallet-print-prefix" type="text" value="HLH-" class="flex-1 h-9 px-3 text-sm border border-surface-200 rounded bg-surface-50" placeholder="HLH-"></div>';
    h+='<div class="flex items-center gap-4"><label class="w-28 text-sm text-text-secondary text-right">'+tr('条形码高度(mm)')+'</label><div class="flex-1 max-w-xs">'+palletPrintNumStepperHtml('pallet-print-height','70','5')+'</div></div>';
    h+='<div class="flex items-center gap-4"><label class="w-28 text-sm text-text-secondary text-right">'+tr('文字大小(pt)')+'</label><div class="flex-1 max-w-xs">'+palletPrintNumStepperHtml('pallet-print-font','10','1')+'</div></div>';
    h+='</div>';
    h+='<div class="mt-5 flex items-center gap-3 pl-32"><button type="button" onclick="generatePalletBarcodes()" class="h-9 px-5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 cursor-pointer">'+tr('生成条形码')+'</button><button type="button" onclick="printPalletBarcodes()" class="h-9 px-5 text-sm font-medium text-white bg-emerald-500 rounded hover:bg-emerald-600 cursor-pointer">'+tr('打印')+'</button></div>';
    h+='<div id="pallet-print-preview" class="mt-6 border-t border-surface-200 pt-5"></div>';
    h+='</div></div>';
    setTimeout(function(){generatePalletBarcodes();},0);
    return h;
}

var _expressInboundState=null;

function ensureExpressInboundState(){
    if(!_expressInboundState)_expressInboundState={schemeCode:'',pallets:[],scans:[],palletSeq:0};
    return _expressInboundState;
}

function nextExpressInboundPalletNo(){
    const st=ensureExpressInboundState();
    st.palletSeq=(st.palletSeq||0)+1;
    return 'TP-EI-'+String(st.palletSeq).padStart(4,'0');
}

function switchExpressInboundPalletTab(tab){
    const st=ensureExpressInboundState();
    st.palletTab=tab;
    document.querySelectorAll('[data-express-pallet-tab]').forEach(function(btn){
        const on=btn.dataset.expressPalletTab===tab;
        btn.classList.toggle('bg-primary-600',on);
        btn.classList.toggle('text-white',on);
        btn.classList.toggle('bg-white',!on);
        btn.classList.toggle('text-text-secondary',!on);
        btn.classList.toggle('hover:bg-surface-50',!on);
    });
    renderExpressInboundPallets();
}

function renderExpressInboundPallets(){
    const tbody=document.getElementById('express-inbound-pallets-body');
    if(!tbody)return;
    const st=ensureExpressInboundState();
    const tab=st.palletTab||'active';
    const activeCount=st.pallets.filter(function(p){return !p.sealed;}).length;
    const sealedCount=st.pallets.filter(function(p){return p.sealed;}).length;
    const cA=document.getElementById('express-pallet-count-active');
    const cS=document.getElementById('express-pallet-count-sealed');
    if(cA)cA.textContent=activeCount;
    if(cS)cS.textContent=sealedCount;
    const filtered=st.pallets.filter(function(p){return tab==='active'?!p.sealed:p.sealed;});
    if(!filtered.length){
        const msg=tab==='active'
            ?tr('点击「+ 新增分板」选择分拣方案生成分板明细')
            :tr('暂无已封板托盘');
        tbody.innerHTML='<tr><td colspan="9" class="px-3 py-6 text-center text-text-muted">'+msg+'</td></tr>';
        return;
    }
    tbody.innerHTML=filtered.map(function(p){
        return '<tr class="border-t border-surface-100'+(p.sealed?' bg-emerald-50/40':' hover:bg-surface-50/40')+'">'+
            '<td class="px-3 py-2 text-text-primary font-medium">'+esc(p.palletNo)+(p.sealed?' <span class="text-xs text-emerald-600 ml-1">('+tr('已封板')+')</span>':'')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(p.gridNo||'')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(p.country||'')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(p.transport||'')+'</td>'+
            '<td class="px-3 py-2 text-right font-semibold text-primary-700">'+p.count+'</td>'+
            '<td class="px-3 py-2 text-right text-text-secondary">'+esc(p.weight||'0KG')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(p.sealWeight||'')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(p.sortCode||'')+'</td>'+
            '<td class="px-3 py-2 text-center whitespace-nowrap">'+
                (p.sealed?'<span class="text-xs text-text-muted" title="'+esc((p.location?tr('库位')+'：'+p.location:''))+'">'+(p.location?esc(p.location):tr('已完成'))+'</span>':
                '<button type="button" onclick="openExpressInboundSealModal(\''+esc(p.palletNo)+'\')" class="text-xs font-medium text-primary-600 hover:text-primary-700 cursor-pointer mr-3">'+tr('封板')+'</button>'+
                '<button type="button" onclick="removeExpressInboundPallet(\''+esc(p.palletNo)+'\')" class="text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button>')+
            '</td>'+
        '</tr>';
    }).join('');
}

function renderExpressInboundScans(){
    const tbody=document.getElementById('express-inbound-scans-body');
    if(!tbody)return;
    const st=ensureExpressInboundState();
    if(!st.scans.length){
        tbody.innerHTML='<tr><td colspan="10" class="px-3 py-6 text-center text-text-muted">'+tr('扫描快递单号即可自动统计到分板明细')+'</td></tr>';
        return;
    }
    tbody.innerHTML=st.scans.map(function(s){
        return '<tr class="border-t border-surface-100 hover:bg-surface-50/40">'+
            '<td class="px-3 py-2 text-text-primary font-medium">'+esc(s.waybillNo)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(s.custCode)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(s.country)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(s.transport)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(s.palletNo)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(s.gridNo)+'</td>'+
            '<td class="px-3 py-2 text-right text-text-secondary">'+esc(s.length||'—')+'</td>'+
            '<td class="px-3 py-2 text-right text-text-secondary">'+esc(s.width||'—')+'</td>'+
            '<td class="px-3 py-2 text-right text-text-secondary">'+esc(s.height||'—')+'</td>'+
            '<td class="px-3 py-2 text-right text-text-secondary">'+esc(s.weight||'—')+'</td>'+
        '</tr>';
    }).join('');
}

function openExpressInboundSchemeModal(){
    document.getElementById('crud-modal-title').textContent=tr('选择快递分拣方案');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const schemes=Object.keys(_expressSortDetails||{});
    let html='<div class="space-y-3">';
    html+='<div class="text-sm text-text-secondary">'+tr('选择一个已配置的分拣方案，明细将自动生成对应分板')+'</div>';
    html+='<div class="space-y-2">';
    if(!schemes.length){
        html+='<div class="text-center py-8 text-text-muted text-sm">'+tr('暂无已配置的分拣方案')+'</div>';
    }else{
        schemes.forEach(function(code){
            const details=(_expressSortDetails[code]||[]);
            const preview=details.slice(0,3).map(function(d){return d.country+'/'+d.transport;}).join('、')+(details.length>3?tr(' 等'):'');
            html+='<button type="button" onclick="applyExpressInboundScheme(\''+esc(code)+'\')" class="w-full text-left px-4 py-3 rounded-lg border border-surface-200 bg-surface-50 hover:border-primary-400 hover:bg-primary-50/40 transition-colors cursor-pointer">';
            html+='<div class="flex items-center justify-between"><div class="font-medium text-text-primary">'+esc(code)+'</div><div class="text-xs text-text-muted">'+details.length+' '+tr('个格口')+'</div></div>';
            html+='<div class="mt-1 text-xs text-text-muted">'+esc(preview)+'</div>';
            html+='</button>';
        });
    }
    html+='</div></div>';
    bodyEl.innerHTML=html;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function applyExpressInboundScheme(code){
    const details=(_expressSortDetails||{})[code]||[];
    if(!details.length){showToast(tr('该方案暂无明细'));return;}
    const st=ensureExpressInboundState();
    st.schemeCode=code;
    details.forEach(function(d){
        st.pallets.push({
            palletNo:nextExpressInboundPalletNo(),
            gridNo:d.gridNo||'',
            country:d.country||'',
            transport:d.transport||'',
            count:0,
            weight:'0KG',
            sealWeight:d.sealWeight||'',
            sortCode:d.sortCode||'',
            sealed:false
        });
    });
    closeCrudModal();
    renderExpressInboundPallets();
    showToast(tr('已生成分板明细')+' '+details.length+' '+tr('条'));
}

function removeExpressInboundPallet(palletNo){
    const st=ensureExpressInboundState();
    st.pallets=st.pallets.filter(function(p){return p.palletNo!==palletNo;});
    renderExpressInboundPallets();
    showToast(tr('已删除分板'));
}

function handleExpressInboundScan(input){
    if(!input)return;
    const val=(input.value||'').trim();
    if(!val){showToast(tr('请输入快递单号'));return;}
    const st=ensureExpressInboundState();
    if(!st.pallets.length){showToast(tr('请先「新增分板」选择分拣方案'));input.value='';return;}
    const available=st.pallets.filter(function(p){return !p.sealed;});
    if(!available.length){showToast(tr('所有分板已封板，请新增分板或重置'));input.value='';return;}
    let seed=0;
    for(let i=0;i<val.length;i++)seed=(seed*31+val.charCodeAt(i))>>>0;
    const target=available[seed%available.length];
    const lengthEl=document.getElementById('express-inbound-scan-length');
    const widthEl=document.getElementById('express-inbound-scan-width');
    const heightEl=document.getElementById('express-inbound-scan-height');
    const weightEl=document.getElementById('express-inbound-scan-weight');
    const lengthV=(lengthEl&&lengthEl.value)||'';
    const widthV=(widthEl&&widthEl.value)||'';
    const heightV=(heightEl&&heightEl.value)||'';
    const weightV=(weightEl&&weightEl.value)||'';
    const singleWeight=parseFloat(weightV)||(0.5+(seed%30)*0.1);
    target.count+=1;
    const oldW=parseFloat(String(target.weight||'0').replace(/[^\d.]/g,''))||0;
    target.weight=(oldW+singleWeight).toFixed(1)+'KG';
    const custs=['C10001','C10002','C10003','C10004','C10005'];
    st.scans.unshift({
        waybillNo:val,
        custCode:custs[seed%custs.length],
        country:target.country,
        transport:target.transport,
        palletNo:target.palletNo,
        gridNo:target.gridNo,
        length:lengthV,
        width:widthV,
        height:heightV,
        weight:weightV||singleWeight.toFixed(1)
    });
    input.value='';
    if(lengthEl)lengthEl.value='';
    if(widthEl)widthEl.value='';
    if(heightEl)heightEl.value='';
    if(weightEl)weightEl.value='';
    input.focus();
    renderExpressInboundPallets();
    renderExpressInboundScans();
    showToast(tr('已入板')+' '+target.palletNo);
}

function openExpressInboundSealModal(palletNo){
    const st=ensureExpressInboundState();
    const pallet=st.pallets.find(function(p){return p.palletNo===palletNo;});
    if(!pallet){showToast(tr('分板不存在'));return;}
    document.getElementById('crud-modal-title').textContent=tr('封板确认')+' - '+palletNo;
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    let html='<div class="space-y-4">';
    html+='<div class="grid grid-cols-3 gap-4 rounded-lg border border-surface-200 bg-surface-50 p-4">';
    html+='<div><div class="text-xs text-text-muted">'+tr('托盘号')+'</div><div class="text-sm font-semibold text-text-primary mt-1">'+esc(pallet.palletNo)+'</div></div>';
    html+='<div><div class="text-xs text-text-muted">'+tr('总件数')+'</div><div class="text-base font-semibold text-primary-700 mt-1">'+pallet.count+'</div></div>';
    html+='<div><div class="text-xs text-text-muted">'+tr('总重量')+'</div><div class="text-base font-semibold text-primary-700 mt-1">'+esc(pallet.weight||'0KG')+'</div></div>';
    html+='<div><div class="text-xs text-text-muted">'+tr('格口号')+'</div><div class="text-sm text-text-primary mt-1">'+esc(pallet.gridNo||'')+'</div></div>';
    html+='<div><div class="text-xs text-text-muted">'+tr('国家')+'</div><div class="text-sm text-text-primary mt-1">'+esc(pallet.country||'')+'</div></div>';
    html+='<div><div class="text-xs text-text-muted">'+tr('运输方式')+'</div><div class="text-sm text-text-primary mt-1">'+esc(pallet.transport||'')+'</div></div>';
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('库位库区')+'</label><input type="text" id="express-inbound-seal-location" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" placeholder="'+esc(tr('请输入库位库区，例如 A-01-03'))+'" value="'+esc(pallet.location||'')+'"></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmExpressInboundSeal(\''+esc(palletNo)+'\',false)" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('打印标签并封板')+'</button>'+
        '<button onclick="confirmExpressInboundSeal(\''+esc(palletNo)+'\',true)" class="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 cursor-pointer">'+tr('打印并新增同规格托盘')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function confirmExpressInboundSeal(palletNo,addNext){
    const st=ensureExpressInboundState();
    const pallet=st.pallets.find(function(p){return p.palletNo===palletNo;});
    if(!pallet)return;
    const loc=((document.getElementById('express-inbound-seal-location')||{}).value||'').trim();
    if(!loc){showToast(tr('请输入库位库区'));return;}
    pallet.sealed=true;
    pallet.location=loc;
    if(addNext){
        st.pallets.push({
            palletNo:nextExpressInboundPalletNo(),
            gridNo:pallet.gridNo,
            country:pallet.country,
            transport:pallet.transport,
            count:0,
            weight:'0KG',
            sealWeight:pallet.sealWeight,
            sortCode:pallet.sortCode,
            sealed:false
        });
    }
    closeCrudModal();
    renderExpressInboundPallets();
    showToast(tr('已打印托盘标签')+(addNext?tr('，已新增同规格托盘'):''));
}

function resetExpressInbound(){
    _expressInboundState={schemeCode:'',pallets:[],scans:[],palletSeq:0};
    renderExpressInboundPallets();
    renderExpressInboundScans();
    showToast(tr('已重置'));
}

function generateExpressInboundPage(id){
    ensureExpressInboundState();
    const warehouseOptions=getWarehouseNameOptions();
    const basic=[
        {label:'到货仓库',type:'select',required:true,options:warehouseOptions,value:currentAccountWarehouse()},
        {label:'到货时间',type:'datetime-local',value:nowDateTimeLocalSeconds()},
        {label:'操作人',value:'张仓管'},
        {label:'操作备注',value:'',placeholder:'请输入操作备注',span:'md:col-span-4'}
    ];
    let h='';
    h+='<div class="h-full overflow-auto p-5">';
    h+='<form class="space-y-5">';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-5">';
    h+='<div class="flex items-center justify-between gap-4 mb-5"><h2 class="text-lg font-semibold text-text-primary">'+tr('快递入仓(分拣装板)')+'</h2><span class="badge bg-blue-100 text-blue-700">'+tr('作业中')+'</span></div>';
    h+='<div class="space-y-6">';
    h+='<section><div class="text-sm font-semibold text-text-primary mb-3">'+tr('基础信息')+'</div>'+renderFields(basic,4)+'</section>';
    h+='<section>'+
        '<div class="flex items-center justify-between mb-3 flex-wrap gap-2">'+
            '<div class="text-sm font-semibold text-text-primary">'+tr('分板明细')+'</div>'+
            '<div class="flex items-center gap-2">'+
                '<div class="inline-flex rounded-lg border border-surface-200 overflow-hidden">'+
                    '<button type="button" data-express-pallet-tab="active" onclick="switchExpressInboundPalletTab(\'active\')" class="h-8 px-3 text-xs font-medium bg-primary-600 text-white cursor-pointer">'+tr('待封板')+' <span id="express-pallet-count-active">0</span></button>'+
                    '<button type="button" data-express-pallet-tab="sealed" onclick="switchExpressInboundPalletTab(\'sealed\')" class="h-8 px-3 text-xs font-medium text-text-secondary bg-white hover:bg-surface-50 border-l border-surface-200 cursor-pointer">'+tr('已封板')+' <span id="express-pallet-count-sealed">0</span></button>'+
                '</div>'+
                '<button type="button" onclick="openExpressInboundSchemeModal()" class="h-8 px-3 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 cursor-pointer">+ '+tr('新增分板')+'</button>'+
            '</div>'+
        '</div>'+
        '<div class="border border-surface-200 rounded-lg overflow-hidden">'+
            '<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-surface-50 text-text-secondary"><tr>'+
                '<th class="px-3 py-2 text-left">'+tr('托盘号')+'</th>'+
                '<th class="px-3 py-2 text-left">'+tr('格口号')+'</th>'+
                '<th class="px-3 py-2 text-left">'+tr('国家')+'</th>'+
                '<th class="px-3 py-2 text-left">'+tr('运输方式')+'</th>'+
                '<th class="px-3 py-2 text-right">'+tr('件数')+'</th>'+
                '<th class="px-3 py-2 text-right">'+tr('重量')+'</th>'+
                '<th class="px-3 py-2 text-left">'+tr('封板重量')+'</th>'+
                '<th class="px-3 py-2 text-left">'+tr('分拣码')+'</th>'+
                '<th class="px-3 py-2 text-center w-24">'+tr('操作')+'</th>'+
            '</tr></thead><tbody id="express-inbound-pallets-body"></tbody></table></div>'+
        '</div>'+
    '</section>';
    h+='<section>'+
        '<div class="text-sm font-semibold text-text-primary mb-3">'+tr('扫描信息')+'</div>'+
        '<div class="flex gap-2 mb-3">'+
            '<div class="flex-1 min-w-0"><label class="text-xs text-text-muted mb-1 block">'+tr('快递单号')+'</label><input id="express-inbound-scan-input" class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-surface-50 focus:bg-white" placeholder="'+esc(tr('扫描/输入快递单号后回车'))+'" onkeydown="if(event.key===\'Enter\'){event.preventDefault();handleExpressInboundScan(this);}"></div>'+
            '<div class="flex items-end"><button type="button" onclick="handleExpressInboundScan(document.getElementById(\'express-inbound-scan-input\'))" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 cursor-pointer">'+tr('确认扫描')+'</button></div>'+
        '</div>'+
        '<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">'+
            '<div><label class="text-xs text-text-muted mb-1 block">'+tr('长(cm)')+'</label><input id="express-inbound-scan-length" type="number" min="0" step="0.1" class="w-full h-9 px-2 text-sm border border-surface-200 rounded bg-surface-50 focus:bg-white text-center" onkeydown="if(event.key===\'Enter\'){event.preventDefault();handleExpressInboundScan(document.getElementById(\'express-inbound-scan-input\'));}"></div>'+
            '<div><label class="text-xs text-text-muted mb-1 block">'+tr('宽(cm)')+'</label><input id="express-inbound-scan-width" type="number" min="0" step="0.1" class="w-full h-9 px-2 text-sm border border-surface-200 rounded bg-surface-50 focus:bg-white text-center" onkeydown="if(event.key===\'Enter\'){event.preventDefault();handleExpressInboundScan(document.getElementById(\'express-inbound-scan-input\'));}"></div>'+
            '<div><label class="text-xs text-text-muted mb-1 block">'+tr('高(cm)')+'</label><input id="express-inbound-scan-height" type="number" min="0" step="0.1" class="w-full h-9 px-2 text-sm border border-surface-200 rounded bg-surface-50 focus:bg-white text-center" onkeydown="if(event.key===\'Enter\'){event.preventDefault();handleExpressInboundScan(document.getElementById(\'express-inbound-scan-input\'));}"></div>'+
            '<div><label class="text-xs text-text-muted mb-1 block">'+tr('重量(KG)')+'</label><input id="express-inbound-scan-weight" type="number" min="0" step="0.01" class="w-full h-9 px-2 text-sm border border-surface-200 rounded bg-surface-50 focus:bg-white text-center" onkeydown="if(event.key===\'Enter\'){event.preventDefault();handleExpressInboundScan(document.getElementById(\'express-inbound-scan-input\'));}"></div>'+
        '</div>'+
        '<div class="mb-3"><label class="text-xs text-text-muted mb-1 block">'+tr('附加服务')+'</label>'+
            '<div class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">'+
                ['报关','木箱','仿牌','带电','带磁','贴箱唛'].map(function(o){
                    return '<label class="inline-flex items-center gap-1 text-sm text-text-secondary cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600" data-cb-label="'+esc(o)+'"><span>'+esc(tr(o))+'</span><span class="inline-flex w-4 h-4 items-center justify-center rounded-full bg-surface-100 border border-surface-200 text-[11px] font-bold leading-none text-text-muted cursor-help" title="'+esc(serviceChargeTooltip(o))+'">?</span></label>';
                }).join('')+
            '</div>'+
        '</div>'+
        '<div class="border border-surface-200 rounded-lg overflow-hidden">'+
            '<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-surface-50 text-text-secondary"><tr>'+
                '<th class="px-3 py-2 text-left">'+tr('快递单号')+'</th>'+
                '<th class="px-3 py-2 text-left">'+tr('客户代码')+'</th>'+
                '<th class="px-3 py-2 text-left">'+tr('国家')+'</th>'+
                '<th class="px-3 py-2 text-left">'+tr('运输方式')+'</th>'+
                '<th class="px-3 py-2 text-left">'+tr('托盘号')+'</th>'+
                '<th class="px-3 py-2 text-left">'+tr('格口号')+'</th>'+
                '<th class="px-3 py-2 text-right">'+tr('长(cm)')+'</th>'+
                '<th class="px-3 py-2 text-right">'+tr('宽(cm)')+'</th>'+
                '<th class="px-3 py-2 text-right">'+tr('高(cm)')+'</th>'+
                '<th class="px-3 py-2 text-right">'+tr('重量(KG)')+'</th>'+
            '</tr></thead><tbody id="express-inbound-scans-body"></tbody></table></div>'+
        '</div>'+
    '</section>';
    h+='</div></div>';
    h+='</form></div>';
    setTimeout(function(){renderExpressInboundPallets();renderExpressInboundScans();applyRuntimeEnhancements(document.getElementById('main-content'));},0);
    return h;
}

/* ===== 轨迹维护 cs-track-maint 重写（双栏 + 轨迹添加弹窗） ===== */
var _trackMaintainSeed=[
    {child:'H26071700050001',waybill:'H2607170005',order:'TB-202607175',status:'已到仓',len:'50',wid:'50',hgt:'50',wgt:'20',vol:'0.125'},
    {child:'H26071700050002',waybill:'H2607170005',order:'TB-202607175',status:'已到仓',len:'50',wid:'50',hgt:'50',wgt:'20',vol:'0.125'}
];
var _trackMaintainRows=_trackMaintainSeed.slice();
var _trackMaintainTab='waybill';

