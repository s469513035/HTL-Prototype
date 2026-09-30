/* ==========================================================================
 * 54 · 散货收款管理 · 成本明细 lcl-cost-detail + 付款单管理 lcl-pay-bill
 *
 * 与整柜侧（fcl-agent-cost / fcl-ap-bill）对称的散货应付链路：
 *   成本明细（运单维度录入，可新增/导入，可选同步生成应收）
 *     → 勾选明细生成付款单（按 服务商×币别 归堆）
 *     → 付款单审核（待审核→已审核/驳回）
 *     → 付款核销（挑服务商的支出凭证流水冲账，同服务商同币别可批量）
 *     → 反核销（按核销记录回滚：费用行、凭证、付款单三处一起退）
 *
 * 复用件：fclPayFlowsOf/_FCL_PAY_FLOWS（支出凭证流水）、FCL_VOUCHER_COLS、
 * fclFinRows/fclFinGet/fclFinSet/fclFinRefresh、fclPushRow/fclSeqNo/fclNow/fclWho、
 * statusBadge/openConfirmTip/closeCrudModal。
 * ========================================================================== */

/* ---- 散货服务商（代理/拖车/报关行…），与凭证流水的键一致 ---- */
var LCL_COST_PROVIDERS=['MAERSK','COSCO','鹏程拖车','深圳报关行','CMA CGM'];
var LCL_COST_ACCOUNTS=['海运费','拖车费','报关费','仓储费','文件费','操作费','派送费'];

addPrototypeTable('lcl-cost-detail','成本明细',
    '流水号|运单号|服务商|费用科目|币别|成本金额|付款单号|是否同步应收|备注|费用状态|操作',
    ['待确认','已确认','已生成付款单','已作废'],[
    ['LCD-20260901001','WB-20260522001','MAERSK','海运费','CNY','8,580','','否','9/5 船期海运费','已确认'],
    ['LCD-20260901002','WB-20260522002','鹏程拖车','拖车费','CNY','1,200','','否','盐田仓提柜','待确认'],
    ['LCD-20260902003','WB-20260522003','深圳报关行','报关费','CNY','860','','否','','已确认'],
    ['LCD-20260903004','WB-20260522005','COSCO','海运费','CNY','12,800','LCP-20260910001','否','整批已谈价','已生成付款单'],
    ['LCD-20260903005','WB-20260522005','深圳报关行','报关费','CNY','650','LCP-20260910001','否','','已生成付款单'],
    ['LCD-20260904006','WB-20260522010','CMA CGM','海运费','CNY','4,320','','是','同步生成应收转嫁客户','已确认'],
    ['LCD-20260905007','WB-20260522006','鹏程拖车','仓储费','CNY','2,400','','否','超期 12 天','待确认']
],[
    {label:'流水号',type:'text'},
    {label:'运单号',type:'text'},
    {label:'服务商',type:'select',options:LCL_COST_PROVIDERS},
    {label:'费用科目',type:'select',options:LCL_COST_ACCOUNTS},
    {label:'币别',type:'select',options:['CNY','USD','EUR']},
    {label:'费用状态',type:'select',options:['待确认','已确认','已生成付款单','已作废']},
    {label:'费用日期',type:'daterange'}
]);
TC['lcl-cost-detail'].noExpand=true;
TC['lcl-cost-detail'].noAutoAudit=true;
TC['lcl-cost-detail'].rowKeyCols=['流水号'];
TC['lcl-cost-detail'].statusMatch=function(row,tab,headers){
    var i=headers.indexOf('费用状态');
    return i>=0&&row[i]===tab;
};

/* ---- 付款单管理：由成本明细生成；审核 → 核销 → 反核销 ---- */
addPrototypeTable('lcl-pay-bill','付款单管理',
    '付款单号|服务商|费用行数|币别|应付金额|已付金额|待付金额|申请人|申请时间|审核人|审核时间|付款方式|付款时间|付款水单|付款状态|操作',
    ['待审核','已审核','待付款','部分付款','已付清','已作废'],[
    /* 种子：LCD-20260903004/5 生成的那张已审核待付款 */
    ['LCP-20260910001','COSCO','2','CNY','13,450','0','13,450','王仓管','2026-09-10 14:20','财务主管','2026-09-10 16:00','','','','待付款'],
    ['LCP-20260911002','鹏程拖车','1','CNY','1,200','0','1,200','王仓管','2026-09-11 09:05','财务主管','2026-09-11 10:20','','','','待付款']
],[
    {label:'付款单号',type:'text'},
    {label:'服务商',type:'select',options:LCL_COST_PROVIDERS},
    {label:'币别',type:'select',options:['CNY','USD','EUR']},
    {label:'付款状态',type:'select',options:['待审核','已审核','待付款','部分付款','已付清','已作废']},
    {label:'申请时间',type:'daterange'}
]);
TC['lcl-pay-bill'].noExpand=true;
TC['lcl-pay-bill'].noAutoAudit=true;
TC['lcl-pay-bill'].rowKeyCols=['付款单号'];
TC['lcl-pay-bill'].statusMatch=function(row,tab,headers){
    var i=headers.indexOf('付款状态');
    return i>=0&&row[i]===tab;
};

/* ---------- 小工具 ---------- */
function lclCostCell(row,name){
    var h=(TC['lcl-cost-detail']||{}).h||[],i=h.indexOf(name);
    return i>=0&&row?(row[i]==null?'':String(row[i])):'';
}
function lclPayCell(row,name){
    var h=(TC['lcl-pay-bill']||{}).h||[],i=h.indexOf(name);
    return i>=0&&row?(row[i]==null?'':String(row[i])):'';
}
/* 成本明细批量状态推进（费用确认/作废），复用整柜的 fclFinBatchStatus 机制 */
function lclCostBatchStatus(id,opLabel,from,to){
    id=id||'lcl-cost-detail';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要')+tr(opLabel)+tr('的数据'));return;}
    var rows=fclFinRows(id),eligible=[],blocked=0;
    idxs.forEach(function(i){
        var row=rows[i];
        if(!row)return;
        if(from.indexOf(lclCostCell(row,'费用状态'))>=0)eligible.push(i);else blocked++;
    });
    if(!eligible.length){showToast(tr('只有')+'「'+from.join('/')+'」'+tr('的数据可以')+tr(opLabel));return;}
    var msg=tr('已勾选')+' '+idxs.length+' '+tr('条')+'，'+tr('其中')+' '+eligible.length+' '+tr('条可')+tr(opLabel);
    if(blocked)msg+='，'+blocked+' '+tr('条状态不符将跳过');
    msg+='，'+tr('是否继续？');
    openConfirmTip(msg,function(){
        eligible.forEach(function(i){fclFinSet(id,rows[i],'费用状态',to);});
        if(typeof _listData!=='undefined')delete _listData[id];
        fclFinRefresh(id);
        showToast(tr(opLabel)+' '+eligible.length+' '+tr('条'));
    });
}

/* ---------- 新增（三列弹窗：运单号带出 + 是否同步应收） ---------- */
var _lclCostAdd={sync:false};
function openLclCostAddModal(){
    _lclCostAdd={sync:false};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='56%';
    document.getElementById('crud-modal-title').textContent=tr('新增成本明细');
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    var roCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary cursor-not-allowed';
    var lbl=function(t,req){return '<label class="text-sm font-medium text-text-secondary">'+(req?'<span class="text-red-500 mr-0.5">*</span>':'')+tr(t)+'</label>';};
    /* 运单号取 wb-manage 真实运单 */
    var wbs=((TC['wb-manage']||{}).d||[]).map(function(r){return String(r[0]||'');}).filter(Boolean);
    var h='<div class="space-y-4">';
    h+='<div class="text-xs text-text-secondary bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">'+
        tr('成本按运单维度录入；「同步应收」开启时，提交后自动在「应收明细」生成一条同金额的应收费用（成本转嫁客户）。')+'</div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5">'+lbl('运单号',true)+
        '<select id="lclc-wb" class="'+inCls+'" onchange="lclCostWbPicked(this)"><option value="">'+tr('请选择运单号')+'</option>'+
        wbs.map(function(w){return '<option value="'+esc(w)+'">'+esc(w)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('客户名称')+
        '<input id="lclc-cust" type="text" readonly class="'+roCls+'" placeholder="'+tr('选择运单号后自动带出')+'"></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('服务商',true)+
        '<select id="lclc-prov" class="'+inCls+'">'+LCL_COST_PROVIDERS.map(function(p){return '<option>'+esc(p)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('费用科目',true)+
        '<select id="lclc-acct" class="'+inCls+'">'+LCL_COST_ACCOUNTS.map(function(a){return '<option>'+esc(a)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('币别',true)+
        '<select id="lclc-cur" class="'+inCls+'"><option>CNY</option><option>USD</option><option>EUR</option></select></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('成本金额',true)+
        '<input id="lclc-amt" type="number" min="0" step="0.01" class="'+inCls+'" placeholder="'+tr('请输入成本金额')+'"></div>';
    /* 是否同步应收：开关。开了，提交时在应收明细落一条同额费用（fin-ar-detail 的 _arDetailSeed） */
    h+='<div class="flex flex-col gap-1.5">'+lbl('是否同步应收')+
        '<label class="flex items-center gap-2 h-10 px-3 border border-surface-200 rounded-lg bg-surface-50 cursor-pointer">'+
        '<input type="checkbox" id="lclc-sync" onchange="lclCostSyncToggled(this)" class="rounded border-surface-300 text-primary-600">'+
        '<span class="text-sm text-text-secondary">'+tr('同步生成应收费用（转嫁客户）')+'</span></label></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-3">'+lbl('备注')+
        '<textarea id="lclc-rk" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+tr('请输入备注')+'"></textarea></div>';
    h+='</div></div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitLclCostAdd()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function lclCostWbPicked(sel){
    var wb=sel.value;
    var c=TC['wb-manage'],h=(c&&c.h)||[];
    var iN=h.indexOf('运单号'),iC=h.indexOf('客户名称');
    var row=(c&&c.d||[]).filter(function(r){return String(r[iN]||'')===wb;})[0];
    var el=document.getElementById('lclc-cust');
    if(el)el.value=row&&iC>=0?String(row[iC]||''):'';
}
function lclCostSyncToggled(box){_lclCostAdd.sync=!!box.checked;}
function submitLclCostAdd(){
    var v=function(id){var e=document.getElementById(id);return e?String(e.value||'').trim():'';};
    var wb=v('lclc-wb'),prov=v('lclc-prov'),acct=v('lclc-acct'),cur=v('lclc-cur'),
        amt=v('lclc-amt'),rk=v('lclc-rk'),sync=_lclCostAdd.sync;
    if(!wb){showToast(tr('请选择运单号'));return;}
    if(!prov){showToast(tr('请选择服务商'));return;}
    if(!acct){showToast(tr('请选择费用科目'));return;}
    if(!amt||!(parseFloat(amt)>0)){showToast(tr('请输入成本金额'));return;}
    var no=fclSeqNo('LCD','lcl-cost-detail');
    fclPushRow('lcl-cost-detail',{
        '流水号':no,'运单号':wb,'服务商':prov,'费用科目':acct,'币别':cur,
        '成本金额':parseFloat(amt).toFixed(2),'付款单号':'',
        '是否同步应收':sync?'是':'否','备注':rk,'费用状态':'待确认'
    });
    /* 同步应收：往散货应收明细（12-ar-detail 的种子）落一条同额费用 */
    var syncedMsg='';
    if(sync&&typeof _arDetailSeed!=='undefined'){
        var ref=_arDetailSeed.filter(function(r){return r.wb===wb;})[0]||null;
        var now=fclNow(),who=fclWho();
        _arDetailSeed.push({
            wb:wb,cust:(ref&&ref.cust)||v('lclc-cust')||'',sales:(ref&&ref.sales)||'',
            fee:acct,amt:parseFloat(amt).toFixed(2),cur:(cur==='CNY'?'人民币':cur),rate:'1',
            rmb:parseFloat(amt).toFixed(2),used:'0',unused:parseFloat(amt).toFixed(2),
            st:'待确认',ftime:now,cyc:(ref&&ref.cyc)||'',days:'',
            bf:'否',bn:'',rk:'成本同步（'+no+'）',src:'成本同步',ct:now,cb:who
        });
        if(typeof _listData!=='undefined')delete _listData['fin-ar-detail'];
        syncedMsg='，'+tr('已同步生成应收费用');
    }
    if(typeof _listData!=='undefined')delete _listData['lcl-cost-detail'];
    closeCrudModal();
    fclFinRefresh('lcl-cost-detail');
    showToast(tr('成本明细已新增')+'：'+no+syncedMsg);
}

/* ---------- 导入（版式对齐应收明细导入：模板 + 文件 + 校验表） ---------- */
var _lclCostImportRows=[],_lclCostImportFile='';
var LCL_COST_IMPORT_COLS=['运单号','服务商','费用科目','币别','成本金额','备注'];
function openLclCostImportModal(){
    _lclCostImportRows=[];_lclCostImportFile='';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='70%';
    document.getElementById('crud-modal-title').textContent=tr('导入');
    document.getElementById('crud-modal-body').innerHTML=lclCostImportBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmLclCostImport()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认导入')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function lclCostImportBodyHtml(){
    var h='<div class="space-y-5">';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
        '<span class="text-base font-semibold text-text-primary">'+tr('模板信息')+'</span></div>';
    h+='<div class="rounded-lg border border-surface-200 bg-white p-4">';
    h+='<button type="button" onclick="showToast(\''+tr('模板下载中')+'\')" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer">'+tr('下载成本明细导入模板')+'</button>';
    h+='<div class="mt-3 w-full border border-dashed border-surface-300 rounded-lg bg-surface-50 px-3 py-2.5">';
    h+='<label class="h-8 px-3 inline-flex items-center text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">'+
        '<input type="file" accept=".xls,.xlsx" class="hidden" onchange="onLclCostImportPick(this)">'+tr('选择文件')+'</label>';
    h+='<span class="text-[11px] text-text-muted ml-2">'+tr('仅支持 Excel（.xls / .xlsx）')+'</span>';
    h+='</div>';
    h+='<div class="mt-3 text-xs text-red-500">'+tr('注意：模板上传后下方列表展示校验信息')+'</div>';
    h+='</div></section>';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
        '<span class="text-base font-semibold text-text-primary">'+tr('导入数据')+'</span></div>';
    h+='<div class="rounded-lg border border-surface-200 bg-white overflow-hidden">'+lclCostImportTableHtml()+'</div>';
    h+='</section></div>';
    return h;
}
function lclCostImportTableHtml(){
    var h='<div class="overflow-auto" style="max-height:320px">';
    h+='<table class="w-full data-table" style="border-collapse:separate;border-spacing:0;min-width:100%"><thead><tr class="bg-white">';
    h+='<th class="px-3 py-2 text-xs font-medium text-text-secondary text-center border-b border-surface-200">#</th>';
    h+='<th class="px-3 py-2 border-b border-surface-200"><input type="checkbox" onchange="toggleAllLclCostImport(this)"></th>';
    LCL_COST_IMPORT_COLS.forEach(function(c){
        h+='<th class="px-3 py-2 text-xs font-medium text-text-secondary border-b border-surface-200">'+tr(c)+'</th>';});
    h+='<th class="px-3 py-2 text-xs font-medium text-text-secondary border-b border-surface-200">'+tr('校验结果')+'</th>';
    h+='</tr></thead><tbody>';
    if(!_lclCostImportRows.length){
        h+='<tr><td colspan="'+(LCL_COST_IMPORT_COLS.length+3)+'" class="px-3 py-12 text-center text-sm text-text-muted">'+tr('请先上传模板文件')+'</td></tr>';
    }else{
        _lclCostImportRows.forEach(function(r,i){
            h+='<tr class="border-b border-surface-100 '+(r.ok?'':'bg-red-50/50')+'">';
            h+='<td class="px-3 py-2 text-sm text-text-muted text-center">'+(i+1)+'</td>';
            h+='<td class="px-3 py-2"><input type="checkbox" class="lcl-ci-check" value="'+i+'"'+(r.ok?' checked':'')+(r.ok?'':' disabled')+'></td>';
            [r.cells.wb,r.cells.prov,r.cells.acct,r.cells.cur,r.cells.amt,r.cells.rk].forEach(function(c){
                h+='<td class="px-3 py-2 text-sm text-text-primary">'+esc(c||'')+'</td>';});
            h+='<td class="px-3 py-2 text-sm '+(r.ok?'text-green-600':'text-red-600')+'">'+esc(r.ok?tr('校验通过'):r.msg)+'</td>';
            h+='</tr>';
        });
    }
    h+='</tbody></table></div>';
    return h;
}
function toggleAllLclCostImport(cb){
    document.querySelectorAll('.lcl-ci-check:not([disabled])').forEach(function(x){x.checked=cb.checked;});
}
function onLclCostImportPick(input){
    if(!input.files||!input.files.length)return;
    _lclCostImportFile=input.files[0].name;
    /* 原型阶段不解析真实 Excel：造三条示例，最后一条缺服务商演示校验 */
    _lclCostImportRows=[
        {ok:true,cells:{wb:'WB-20260522001',prov:'MAERSK',acct:'海运费',cur:'CNY',amt:'8580.00',rk:''}},
        {ok:true,cells:{wb:'WB-20260522002',prov:'鹏程拖车',acct:'拖车费',cur:'CNY',amt:'1200.00',rk:'盐田提柜'}},
        {ok:false,msg:tr('必填项为空：服务商'),cells:{wb:'WB-20260522003',prov:'',acct:'报关费',cur:'CNY',amt:'860.00',rk:''}}
    ];
    document.getElementById('crud-modal-body').innerHTML=lclCostImportBodyHtml();
    showToast(tr('已解析')+' 3 '+tr('条'));
}
function confirmLclCostImport(){
    if(!_lclCostImportRows.length){showToast(tr('请先上传模板文件'));return;}
    var picked=[];
    document.querySelectorAll('.lcl-ci-check:checked').forEach(function(x){picked.push(parseInt(x.value,10));});
    var rows=picked.map(function(i){return _lclCostImportRows[i];}).filter(function(r){return r&&r.ok;});
    if(!rows.length){showToast(tr('没有可导入的数据'));return;}
    var now=fclNow(),who=fclWho();
    rows.forEach(function(r){
        fclPushRow('lcl-cost-detail',{
            '流水号':fclSeqNo('LCD','lcl-cost-detail'),'运单号':r.cells.wb,
            '服务商':r.cells.prov,'费用科目':r.cells.acct,'币别':r.cells.cur,
            '成本金额':r.cells.amt,'付款单号':'','是否同步应收':'否',
            '备注':r.cells.rk||'','费用状态':'待确认'
        });
    });
    if(typeof _listData!=='undefined')delete _listData['lcl-cost-detail'];
    closeCrudModal();
    fclFinRefresh('lcl-cost-detail');
    showToast(tr('导入成功')+' '+rows.length+' '+tr('条'));
}

/* ---------- 生成付款单：勾选「已确认且未生成付款单」的明细，按 服务商×币别 归堆 ---------- */
function lclGenPayBill(id){
    id=id||'lcl-cost-detail';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要生成付款单的成本明细'));return;}
    var rows=fclFinRows(id);
    var picked=idxs.map(function(i){return rows[i];}).filter(Boolean);
    var bad=picked.filter(function(r){return lclCostCell(r,'费用状态')!=='已确认'||lclCostCell(r,'付款单号');});
    if(bad.length){
        showToast(tr('只有「已确认」且未生成付款单的明细可以生成，有')+' '+bad.length+' '+tr('条不符合'));
        return;
    }
    if(!picked.length){showToast(tr('未找到明细'));return;}
    /* 按 服务商×币别 归堆：不同服务商/币别各生成一张付款单 */
    var groups={},order=[];
    picked.forEach(function(r){
        var key=lclCostCell(r,'服务商')+'||'+lclCostCell(r,'币别');
        if(!groups[key]){groups[key]={prov:lclCostCell(r,'服务商'),cur:lclCostCell(r,'币别'),amt:0,rows:[]};order.push(key);}
        var g=groups[key];
        g.amt+=fclParseMoney(lclCostCell(r,'成本金额'))||0;
        g.rows.push(r);
    });
    var now=fclNow(),who=fclWho();
    var bills=[];
    order.forEach(function(k){
        var g=groups[k];
        var no=fclSeqNo('LCP','lcl-pay-bill');
        fclPushRow('lcl-pay-bill',{
            '付款单号':no,'服务商':g.prov,'费用行数':String(g.rows.length),'币别':g.cur,
            '应付金额':g.amt.toFixed(2),'已付金额':'0.00','待付金额':g.amt.toFixed(2),
            '申请人':who,'申请时间':now,'审核人':'','审核时间':'',
            '付款方式':'','付款时间':'','付款水单':'','付款状态':'待审核'
        });
        /* 明细回写付款单号并推进状态 */
        g.rows.forEach(function(r){
            fclFinSet(id,r,'付款单号',no);
            fclFinSet(id,r,'费用状态','已生成付款单');
        });
        bills.push(no+'（'+g.prov+' '+g.cur+' '+g.amt.toFixed(2)+'）');
    });
    if(typeof _listData!=='undefined'){delete _listData[id];delete _listData['lcl-pay-bill'];}
    showToast(tr('已生成付款单')+' '+bills.length+' '+tr('张')+'：'+bills.join('、'));
}

/* ---------- 付款单审核：待审核 → 已审核（批量，二次确认） ---------- */
function lclPayAudit(id){
    id=id||'lcl-pay-bill';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要审核的付款单'));return;}
    var rows=fclFinRows(id);
    var eligible=[],blocked=0;
    idxs.forEach(function(i){
        var row=rows[i];
        if(!row)return;
        if(lclPayCell(row,'付款状态')==='待审核')eligible.push(row);else blocked++;
    });
    if(!eligible.length){showToast(tr('只有「待审核」的付款单可以审核'));return;}
    var to='已审核';
    var msg=tr('本次审核')+' '+eligible.length+' '+tr('张')+'（'+tr(to)+'）'+
        (blocked?('，'+blocked+' '+tr('张非待审核跳过')):'')+'，'+tr('是否继续？');
    openConfirmTip(msg,function(){
        var now=fclNow(),who=fclWho();
        eligible.forEach(function(row){
            fclFinSet(id,row,'付款状态',to);
            fclFinSet(id,row,'审核人',who);
            fclFinSet(id,row,'审核时间',now);
        });
        if(typeof _listData!=='undefined')delete _listData[id];
        fclFinRefresh(id);
        showToast(tr(to)+' '+eligible.length+' '+tr('张'));
    });
}
function lclPayAuditPass(id){lclPayAudit(id);}

/* ---------- 付款核销：挑服务商的支出凭证流水（同整柜口径，可批量） ---------- */
var _lclPayWo={id:'',prov:'',cur:'',bills:[],flows:[]};
function openLclPayWriteOff(id){
    id=id||'lcl-pay-bill';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要核销的付款单'));return;}
    var rows=fclFinRows(id);
    var picked=idxs.map(function(i){return rows[i];}).filter(Boolean);
    /* 批量的前提：同服务商 + 同币别（与整柜付款核销同一规则） */
    var provs=[],curs=[];
    picked.forEach(function(r){
        var p=lclPayCell(r,'服务商'),c=lclPayCell(r,'币别');
        if(provs.indexOf(p)<0)provs.push(p);
        if(curs.indexOf(c)<0)curs.push(c);
    });
    if(provs.length>1){showToast(tr('批量核销只能选同一个服务商，当前选了')+' '+provs.length+' '+tr('个'));return;}
    if(curs.length>1){showToast(tr('批量核销只能选同一个币别，当前选了')+' '+curs.join('/'));return;}
    var bad=picked.filter(function(r){return ['已审核','待付款','部分付款'].indexOf(lclPayCell(r,'付款状态'))<0;});
    if(bad.length){
        showToast(tr('只有「已审核 / 待付款 / 部分付款」的付款单可以核销，有')+' '+bad.length+' '+tr('张不符合'));
        return;
    }
    var prov=provs[0],cur=curs[0];
    var flows=fclPayFlowsOf(prov,cur);
    if(!flows.length){showToast(prov+' '+tr('名下没有')+' '+cur+' '+tr('的支出凭证，先去凭证管理登记'));return;}
    _lclPayWo={id:id,prov:prov,cur:cur,
        bills:picked.map(function(r,k){
            return {row:r,no:lclPayCell(r,'付款单号'),
                due:fclParseMoney(lclPayCell(r,'待付金额'))||0,
                total:fclParseMoney(lclPayCell(r,'应付金额'))||0,
                st:lclPayCell(r,'付款状态'),amt:''};
        }),
        flows:flows.map(function(f){return {no:f.no,sel:false,left:fclFlowLeft(f),ref:f};})};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='80%';
    document.getElementById('crud-modal-title').textContent=tr('付款核销')+' - '+prov+'（'+cur+'）';
    document.getElementById('crud-modal-body').innerHTML=lclPayWoBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitLclPayWriteOff()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认核销')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function lclPayWoDueTotal(){return +_lclPayWo.bills.reduce(function(s,b){return s+b.due;},0).toFixed(2);}
function lclPayWoFlowSum(){
    return +_lclPayWo.flows.filter(function(f){return f.sel;}).reduce(function(s,f){return s+f.left;},0).toFixed(2);
}
function lclPayWoAllocSum(){
    return +_lclPayWo.bills.reduce(function(s,b){return s+(fclParseMoney(b.amt)||0);},0).toFixed(2);
}
function lclPayWoBodyHtml(){
    var A=_lclPayWo,h='';
    h+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
        esc(A.prov)+'　'+esc(A.cur)+'　'+tr('选中')+' '+A.bills.length+' '+tr('张付款单')+'　'+
        tr('待付合计')+' <span class="font-semibold text-text-primary">'+esc(A.cur)+' '+lclPayWoDueTotal().toFixed(2)+'</span>'+
        '<div class="mt-1 text-xs text-text-muted">'+esc(tr('先勾要用的付款凭证，再把可核销金额分到各张付款单上；同服务商同币别才能一起核销。'))+'</div></div>';
    h+='<div data-lclwo>'+lclPayWoInnerHtml()+'</div>';
    return h;
}
function lclPayWoInnerHtml(){
    var A=_lclPayWo,h='';
    h+='<div class="mb-2 flex items-center gap-2"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
        '<span class="text-sm font-semibold text-text-primary">'+tr('① 选择付款凭证')+'</span>'+
        '<span class="text-xs text-text-muted">'+esc(tr('字段同凭证管理'))+'</span></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto mb-3"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
        '<th class="px-3 py-2 w-10"></th>'+
        FCL_VOUCHER_COLS.map(function(t){return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
        '</tr></thead><tbody>';
    var usable=0;
    A.flows.forEach(function(f,i){
        var left=f.left,dis=left<=0,v=f.ref;
        if(!dis)usable++;
        h+='<tr class="border-t border-surface-100'+(dis?' opacity-50':'')+'">'+
            '<td class="px-3 py-2"><input type="checkbox" data-lclwo-f="'+i+'"'+(f.sel?' checked':'')+(dis?' disabled':'')+
            ' onchange="lclPayWoPickFlow('+i+',this.checked)" class="rounded border-surface-300 text-primary-600"></td>'+
            '<td class="px-3 py-2 font-medium text-text-primary whitespace-nowrap">'+esc(v.no)+'</td>'+
            '<td class="px-3 py-2 whitespace-nowrap">'+statusBadge(v.st)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(v.cur)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+(+v.amt).toFixed(2)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+(+v.used).toFixed(2)+'</td>'+
            '<td class="px-3 py-2 whitespace-nowrap '+(dis?'text-text-muted':'text-success-700 font-medium')+'">'+left.toFixed(2)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(v.ourName||'—')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(v.payeeName||'—')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(v.txNo||'—')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(v.feeTime||'—')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(v.way||'—')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(v.memo||'—')+'</td></tr>';
    });
    if(!usable){
        h+='<tr><td colspan="'+(FCL_VOUCHER_COLS.length+1)+'" class="px-3 py-6 text-center text-sm text-amber-700">'+
            esc(tr('这家服务商该币别的凭证都已抵扣完，没有可用余额'))+'</td></tr>';
    }
    h+='</tbody></table></div>';
    h+='<div class="mb-2 flex items-center gap-2"><span class="w-1 h-4 bg-primary-500 rounded-full"></span>'+
        '<span class="text-sm font-semibold text-text-primary">'+tr('② 分配到付款单')+'</span>'+
        '<button type="button" onclick="lclPayWoAutoFill()" class="h-7 px-2.5 text-xs font-medium text-primary-700 border border-primary-200 rounded bg-white hover:bg-primary-50 cursor-pointer">'+tr('按待付金额自动填')+'</button>'+
        '<button type="button" onclick="lclPayWoClear()" class="h-7 px-2.5 text-xs font-medium text-text-secondary border border-surface-200 rounded bg-white hover:bg-surface-50 cursor-pointer">'+tr('清空')+'</button></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
        ['付款单号','应付金额','待付金额','付款状态','本次核销'].map(function(t){return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
        '</tr></thead><tbody>';
    A.bills.forEach(function(b,i){
        h+='<tr class="border-t border-surface-100">'+
            '<td class="px-3 py-2 font-medium text-text-primary">'+esc(b.no)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(A.cur)+' '+b.total.toFixed(2)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+b.due.toFixed(2)+'</td>'+
            '<td class="px-3 py-2">'+statusBadge(b.st)+'</td>'+
            '<td class="px-3 py-2"><input data-lclwo-b="'+i+'" type="number" value="'+esc(b.amt)+'" oninput="lclPayWoSetAmt('+i+',this.value)" class="w-32 h-8 px-2 text-sm border border-surface-200 rounded-lg bg-surface-50"></td></tr>';
    });
    h+='</tbody></table></div>';
    h+=lclPayWoSummaryHtml();
    return h;
}
function lclPayWoSummaryHtml(){
    var A=_lclPayWo;
    var flow=lclPayWoFlowSum(),alloc=lclPayWoAllocSum(),rest=+(flow-alloc).toFixed(2);
    var ok=alloc>0&&rest>=0;
    return '<div data-lclwo-sum class="mt-2 text-sm '+(ok?'text-success-700':'text-red-600')+'">'+
        tr('已选凭证可核销')+' <span class="font-semibold">'+esc(A.cur)+' '+flow.toFixed(2)+'</span>　'+
        tr('本次核销合计')+' <span class="font-semibold">'+alloc.toFixed(2)+'</span>　'+
        tr('凭证剩余')+' <span class="font-semibold">'+rest.toFixed(2)+'</span>'+
        (alloc<=0?('　'+tr('还没分配核销金额')):(rest<0?('　'+tr('核销金额超出已选凭证余额')):''))+'</div>';
}
function lclPayWoRedraw(){
    var box=document.querySelector('[data-lclwo]');
    if(box)box.innerHTML=lclPayWoInnerHtml();
}
function lclPayWoRefreshSum(){
    var box=document.querySelector('[data-lclwo-sum]');
    if(box)box.outerHTML=lclPayWoSummaryHtml();
}
function lclPayWoReadUI(){
    _lclPayWo.bills.forEach(function(b,i){
        var el=document.querySelector('[data-lclwo-b="'+i+'"]');
        if(el)b.amt=String(el.value||'');
    });
}
function lclPayWoPickFlow(i,on){
    lclPayWoReadUI();
    if(_lclPayWo.flows[i])_lclPayWo.flows[i].sel=!!on;
    lclPayWoRefreshSum();
}
function lclPayWoSetAmt(i,v){
    if(_lclPayWo.bills[i])_lclPayWo.bills[i].amt=String(v||'');
    lclPayWoRefreshSum();
}
function lclPayWoAutoFill(){
    lclPayWoReadUI();
    var left=lclPayWoFlowSum();
    if(left<=0){showToast(tr('请先勾选付款凭证'));return;}
    _lclPayWo.bills.forEach(function(b){
        var v=Math.min(b.due,+left.toFixed(2));
        b.amt=v>0?String(v.toFixed(2)):'';
        left=+(left-v).toFixed(2);
    });
    lclPayWoRedraw();
}
function lclPayWoClear(){
    _lclPayWo.bills.forEach(function(b){b.amt='';});
    lclPayWoRedraw();
}
/* 核销记录：付款单号 -> [{voucher,amt,at,by}]，反核销按它回滚 */
var _LCL_PAY_WO={};
function submitLclPayWriteOff(){
    lclPayWoReadUI();
    var A=_lclPayWo,id=A.id;
    var flows=A.flows.filter(function(f){return f.sel;});
    if(!flows.length){showToast(tr('请先勾选要用的付款凭证'));return;}
    var hit=A.bills.filter(function(b){return (fclParseMoney(b.amt)||0)>0;});
    if(!hit.length){showToast(tr('请至少给一张付款单填核销金额'));return;}
    var over=hit.filter(function(b){return (fclParseMoney(b.amt)||0)>b.due+0.004;});
    if(over.length){showToast(over[0].no+' '+tr('的核销金额超过待付金额'));return;}
    var alloc=lclPayWoAllocSum(),avail=lclPayWoFlowSum();
    if(alloc>avail+0.004){showToast(tr('核销合计超出已选凭证余额')+' '+(+(alloc-avail)).toFixed(2));return;}
    var rest=alloc,usedNos=[],lastWay='',lastDate='',lastSlip='';
    flows.forEach(function(f){
        if(rest<=0)return;
        var take=Math.min(f.left,rest);
        if(take<=0)return;
        f.ref.used=+(((+f.ref.used)||0)+take).toFixed(2);
        f.left=fclFlowLeft(f.ref);
        rest=+(rest-take).toFixed(2);
        usedNos.push(f.ref.no+'×'+take.toFixed(2));
        lastWay=f.ref.way;lastDate=f.ref.feeTime;lastSlip=f.ref.memo||'';
    });
    var now=fclNow(),who=fclWho();
    var done=0,part=0;
    hit.forEach(function(b){
        var pay=fclParseMoney(b.amt)||0;
        var paid=+(((fclParseMoney(lclPayCell(b.row,'已付金额'))||0)+pay)).toFixed(2);
        var total=fclParseMoney(lclPayCell(b.row,'应付金额'))||0;
        var due=+(total-paid).toFixed(2);
        fclFinSet(id,b.row,'已付金额',paid.toFixed(2));
        fclFinSet(id,b.row,'待付金额',due.toFixed(2));
        fclFinSet(id,b.row,'付款方式',lastWay);
        fclFinSet(id,b.row,'付款时间',now);
        fclFinSet(id,b.row,'付款水单',lastSlip);
        if(due<=0.004){fclFinSet(id,b.row,'付款状态','已付清');done++;}
        else{fclFinSet(id,b.row,'付款状态','部分付款');part++;}
        /* 核销记录（反核销用）：一张付款单可能多张凭证分批冲，append */
        (_LCL_PAY_WO[b.no]=_LCL_PAY_WO[b.no]||[]).push({
            voucher:usedNos.join('、'),amt:pay,at:now,by:who});
    });
    if(typeof _listData!=='undefined')delete _listData[id];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('已核销')+' '+A.cur+' '+alloc.toFixed(2)+'（'+usedNos.join('、')+'）　'+
        (done?(tr('已付清')+' '+done+' '+tr('张')):'')+(done&&part?'，':'')+
        (part?(tr('部分付款')+' '+part+' '+tr('张')):''));
}

/* ---------- 反核销：按核销记录逐条回滚（费用行退回 + 凭证退回 + 付款单重算） ---------- */
function openLclPayUnWriteOff(id,rowIdx){
    id=id||'lcl-pay-bill';
    var idx=(rowIdx!=null&&rowIdx>=0)?rowIdx:
        ((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1);
    if(idx<0){showToast(tr('请先勾选一张付款单'));return;}
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到付款单'));return;}
    var no=lclPayCell(row,'付款单号');
    var list=_LCL_PAY_WO[no]||[];
    var paid=fclParseMoney(lclPayCell(row,'已付金额'))||0;
    if(!list.length){
        if(paid>0){showToast(tr('该付款单有已付金额但没有核销记录（可能是历史数据），无法反核销'));return;}
        showToast(tr('该付款单还没有核销记录'));return;
    }
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('反核销')+' - '+no;
    var h='<div class="space-y-4">';
    h+='<div class="text-xs text-text-secondary bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">'+
        tr('反核销把金额退回两边：付款单已付金额回退、凭证已使用金额回退，付款状态回算。逐条勾选要回滚的核销记录。')+'</div>';
    h+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 grid grid-cols-3 gap-4 text-sm">'+
        '<div><span class="text-xs text-text-muted block">'+tr('付款单号')+'</span><span class="font-medium">'+esc(no)+'</span></div>'+
        '<div><span class="text-xs text-text-muted block">'+tr('已付金额')+'</span><span class="font-medium">'+paid.toFixed(2)+'</span></div>'+
        '<div><span class="text-xs text-text-muted block">'+tr('核销记录')+'</span><span class="font-medium">'+list.length+' '+tr('条')+'</span></div></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50 text-text-secondary"><tr>';
    h+='<th class="px-3 py-2 w-10"></th>';
    ['凭证','核销金额','核销人','核销时间'].forEach(function(t){h+='<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(t)+'</th>';});
    h+='</tr></thead><tbody>';
    list.forEach(function(w,i){
        h+='<tr class="border-t border-surface-100">'+
            '<td class="px-3 py-2"><input type="checkbox" class="lcl-uw-check" value="'+i+'" checked></td>'+
            '<td class="px-3 py-2 text-text-secondary break-all">'+esc(w.voucher)+'</td>'+
            '<td class="px-3 py-2 font-medium text-text-primary">'+esc(w.amt.toFixed(2))+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(w.by)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(w.at)+'</td></tr>';
    });
    h+='</tbody></table></div></div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitLclPayUnWriteOff('+idx+')" class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer ml-2">'+tr('确认反核销')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function submitLclPayUnWriteOff(idx){
    var id='lcl-pay-bill';
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到付款单'));return;}
    var no=lclPayCell(row,'付款单号');
    var list=_LCL_PAY_WO[no]||[];
    var picked=[];
    document.querySelectorAll('.lcl-uw-check:checked').forEach(function(c){picked.push(parseInt(c.value,10));});
    if(!picked.length){showToast(tr('请勾选要回滚的核销记录'));return;}
    var back=0,flowNos=[];
    picked.slice().sort(function(a,b){return b-a;}).forEach(function(i){
        var w=list[i];
        if(!w)return;
        back+=w.amt;
        flowNos.push(w.voucher);
        /* 凭证退回：把用掉的金额还回去（按 no×amt 格式逐段解析） */
        String(w.voucher).split('、').forEach(function(seg){
            var m=/^([A-Z0-9]+)×([\d.]+)$/.exec(seg);
            if(!m)return;
            var fNo=m[1],take=parseFloat(m[2])||0;
            Object.keys(_FCL_PAY_FLOWS).forEach(function(prov){
                (_FCL_PAY_FLOWS[prov]||[]).forEach(function(f){
                    if(f.no===fNo){
                        f.used=Math.max(0,+(((+f.used)||0)-take).toFixed(2));
                        f.st=f.used<=0?'待抵扣':(fclFlowLeft(f)<=0?'全部抵扣':'部分抵扣');
                    }
                });
            });
        });
        list.splice(i,1);
    });
    if(!list.length)delete _LCL_PAY_WO[no];
    /* 付款单回算 */
    var paid=Math.max(0,+(((fclParseMoney(lclPayCell(row,'已付金额'))||0)-back)).toFixed(2));
    var total=fclParseMoney(lclPayCell(row,'应付金额'))||0;
    var due=+(total-paid).toFixed(2);
    fclFinSet(id,row,'已付金额',paid.toFixed(2));
    fclFinSet(id,row,'待付金额',due.toFixed(2));
    if(due<=0.004)fclFinSet(id,row,'付款状态','已付清');
    else if(paid<=0.004)fclFinSet(id,row,'付款状态','待付款');
    else fclFinSet(id,row,'付款状态','部分付款');
    if(typeof _listData!=='undefined')delete _listData[id];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('已反核销')+' '+back.toFixed(2)+'（'+flowNos.join('；')+'），'+
        tr('付款状态回算为')+'「'+lclPayCell(row,'付款状态')+'」');
}

/* ---------- 成本明细行内查看：一行成本的完整信息 ---------- */
function openLclCostDetail(id,rowIdx){
    id=id||'lcl-cost-detail';
    var idx=(rowIdx!=null&&rowIdx>=0)?rowIdx:
        ((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1);
    if(idx<0){showToast(tr('请先勾选一条成本明细'));return;}
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到数据'));return;}
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='52%';
    document.getElementById('crud-modal-title').textContent=tr('成本明细')+' - '+lclCostCell(row,'流水号');
    var b='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">';
    [['流水号',lclCostCell(row,'流水号')],['运单号',lclCostCell(row,'运单号')],
     ['服务商',lclCostCell(row,'服务商')],['费用科目',lclCostCell(row,'费用科目')],
     ['币别',lclCostCell(row,'币别')],['成本金额',lclCostCell(row,'成本金额')],
     ['付款单号',lclCostCell(row,'付款单号')||'—'],['是否同步应收',lclCostCell(row,'是否同步应收')],
     ['费用状态',lclCostCell(row,'费用状态')],['备注',lclCostCell(row,'备注')||'—']].forEach(function(p){
        b+='<div><span class="text-xs text-text-muted block">'+tr(p[0])+'</span>'+
            '<span class="font-medium text-text-primary">'+esc(p[1])+'</span></div>';
    });
    b+='</div>';
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* ---------- 付款单明细（行内/工具栏查看：这张单由哪些成本行凑出来的） ---------- */
function openLclPayBillDetail(id,rowIdx){
    id=id||'lcl-pay-bill';
    var idx=(rowIdx!=null&&rowIdx>=0)?rowIdx:
        ((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1);
    if(idx<0){showToast(tr('请先勾选一张付款单'));return;}
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到付款单'));return;}
    var no=lclPayCell(row,'付款单号');
    var fees=(fclFinRows('lcl-cost-detail')||[]).filter(function(r){return lclCostCell(r,'付款单号')===no;});
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='66%';
    document.getElementById('crud-modal-title').textContent=tr('付款单明细')+' - '+no;
    var b='<div class="space-y-4">';
    b+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">';
    [['付款单号',no],['服务商',lclPayCell(row,'服务商')],['币别',lclPayCell(row,'币别')],
     ['付款状态',lclPayCell(row,'付款状态')],['应付金额',lclPayCell(row,'应付金额')],
     ['已付金额',lclPayCell(row,'已付金额')],['待付金额',lclPayCell(row,'待付金额')],
     ['申请人',lclPayCell(row,'申请人')],['申请时间',lclPayCell(row,'申请时间')],
     ['审核人',lclPayCell(row,'审核人')],['审核时间',lclPayCell(row,'审核时间')],
     ['付款时间',lclPayCell(row,'付款时间')]].forEach(function(p){
        b+='<div><span class="text-xs text-text-muted block">'+tr(p[0])+'</span>'+
           '<span class="font-medium text-text-primary">'+(esc(p[1])||'—')+'</span></div>';
    });
    b+='</div>';
    b+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
        '<span class="text-sm font-semibold text-text-primary">'+tr('费用明细')+'</span>'+
        '<span class="text-xs text-text-muted">'+tr('这张付款单由以下成本明细凑成')+'</span></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>';
    ['流水号','运单号','服务商','费用科目','币别','成本金额','费用状态'].forEach(function(t){
        b+='<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';});
    b+='</tr></thead><tbody>';
    if(!fees.length)b+='<tr><td colspan="7" class="px-3 py-8 text-center text-sm text-text-muted">'+tr('暂无费用明细')+'</td></tr>';
    var sum=0;
    fees.forEach(function(r){
        sum+=fclParseMoney(lclCostCell(r,'成本金额'))||0;
        b+='<tr class="border-t border-surface-100">'+
            '<td class="px-3 py-2 font-medium text-primary-700">'+esc(lclCostCell(r,'流水号'))+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(lclCostCell(r,'运单号'))+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(lclCostCell(r,'服务商'))+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(lclCostCell(r,'费用科目'))+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(lclCostCell(r,'币别'))+'</td>'+
            '<td class="px-3 py-2 text-text-primary">'+esc(lclCostCell(r,'成本金额'))+'</td>'+
            '<td class="px-3 py-2">'+statusBadge(lclCostCell(r,'费用状态'))+'</td></tr>';
    });
    b+='</tbody><tfoot><tr class="border-t-2 border-surface-200 bg-surface-50 font-medium">'+
        '<td class="px-3 py-2" colspan="5">'+tr('合计')+'</td>'+
        '<td class="px-3 py-2">'+esc(lclPayCell(row,'币别'))+' '+sum.toFixed(2)+'</td><td></td></tr></tfoot></table></div></div>';
    b+='</div>';
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}


/* ===== 实际成本管理 lcl-actual-cost（参考整柜代理账单：账单登记/对账分摊/生成付款单） =====
 * 与代理账单的差异：单号类型=运单（费用直挂运单）/主单（整单费用摊到主单下各运单，分摊规则必选）。 */
var LCL_ACTUAL_RULES=['按票数','按件数','按体积','按重量','不分摊'];
addPrototypeTable('lcl-actual-cost','实际成本管理',
    '流水号|服务商|服务商账单号|单号类型|账期时间|币别|账单金额|涉及票数|分摊规则|导入人|导入时间|备注|账单状态|操作',
    ['待对账','待请款','待审核','待核销','部分核销','全部核销','作废'],[
    ['LAC-20260618001','COSCO','COS-LCL-260618','运单','2026-07-18 23:59','CNY','8,580','1','不分摊','张财务','2026-06-18 09:40','海运费的运单实际成本','待对账'],
    ['LAC-20260618002','鹏程拖车','PC-LCL-260618','运单','2026-07-02 23:59','CNY','1,200','1','不分摊','李操作','2026-06-18 10:05','盐田提柜','待对账'],
    ['LAC-20260619003','深圳报关行','SZ-LCL-260619','运单','2026-07-19 23:59','CNY','860','1','不分摊','李操作','2026-06-19 11:20','','待请款'],
    ['LAC-20260620004','COSCO','COS-LCL-ML-0620','主单','2026-07-20 23:59','CNY','12,800','3','按件数','张财务','2026-06-20 14:10','3 票合开主单海运费','待对账'],
    ['LAC-20260620005','鹏程拖车','PC-LCL-ML-0620','主单','2026-07-05 23:59','CNY','2,700','3','按票数','李操作','2026-06-20 15:30','3 票拖车合开','待对账'],
    ['LAC-20260621006','深圳报关行','SZ-LCL-ML-0621','主单','2026-07-21 23:59','CNY','1,050','3','按体积','张财务','2026-06-21 09:15','3 票报关合开','待对账']
],[
    {label:'流水号',type:'text'},
    {label:'服务商',type:'select',options:LCL_COST_PROVIDERS},
    {label:'单号类型',type:'select',options:['运单','主单']},
    {label:'币别',type:'select',options:['CNY','USD','EUR']},
    {label:'账单状态',type:'select',options:['待对账','待请款','待审核','待核销','部分核销','全部核销','作废']}
]);
TC['lcl-actual-cost'].noExpand=true;
TC['lcl-actual-cost'].noAutoAudit=true;
/* 费用明细：成本单号 -> [{no,feeName,feeKind,cur,amt,remark}]（no=运单号或主单号） */
var _lclActualCostDetails={
    'LAC-20260618001':[{no:'WB-20260522001',feeName:'海运费',feeKind:'海运费',cur:'CNY',amt:'8,580',remark:'西非海运专线'}],
    'LAC-20260618002':[{no:'WB-20260522006',feeName:'拖车费',feeKind:'拖车费',cur:'CNY',amt:'1,200',remark:'蛇口提柜'}],
    'LAC-20260619003':[{no:'WB-20260522003',feeName:'报关费',feeKind:'报关费',cur:'CNY',amt:'860',remark:''}],
    'LAC-20260620004':[{no:'MSL-20260901-001',feeName:'海运费',feeKind:'海运费',cur:'CNY',amt:'12,800',remark:'主单合开 3 票'}],
    'LAC-20260620005':[{no:'MSL-20260902-002',feeName:'拖车费',feeKind:'拖车费',cur:'CNY',amt:'2,700',remark:''}],
    'LAC-20260621006':[{no:'MSL-20260903-003',feeName:'报关费',feeKind:'报关费',cur:'CNY',amt:'1,050',remark:''}]
};
/* 演示主单 -> 运单清单（主单分摊的基数来源） */
var _LCL_MASTER_WBS={
    'MSL-20260901-001':['WB-20260522001','WB-20260522002','WB-20260522005'],
    'MSL-20260902-002':['WB-20260522006','WB-20260522007','WB-20260522010'],
    'MSL-20260903-003':['WB-20260522003','WB-20260522004','WB-20260522008']
};
/* 种子行已带规则，同步进规则表（列序：3=单号类型 8=分摊规则） */
var _LCL_ACTUAL_RULE={};
TC['lcl-actual-cost'].d.forEach(function(r){
    if(String(r[3]||'')==='主单'&&String(r[8]||''))_LCL_ACTUAL_RULE[String(r[0])]=String(r[8]);
});
/* 分摊结果：流水号 -> [{wb,amt}] */
var _lclActualAlloc={};
function lclActualCell(row,name){var h=TC['lcl-actual-cost'].h,i=h.indexOf(name);return i>=0&&row?String(row[i]||''):'';}
function lclActualRuleOf(no){return _LCL_ACTUAL_RULE[no]||'';}
/* 关联单号字段已精简：单号来源挂费用明细首行（主单号/运单号在明细行上维护） */
function lclActualRefNoOf(no){var d=_lclActualCostDetails[no]||[];return d.length?String(d[0].no||''):'';}

/* ---------- 新增/编辑：与整柜代理账单同一套引擎弹窗（配置驱动），不手写弹窗 ----------
 * 主单时分摊规则必选：fieldChangeHandlers + afterModalRender 驱动显隐/必填（§6 机制） */
TC['lcl-actual-cost'].modalExcludedFields=['涉及票数','导入人','导入时间','账单状态'];
TC['lcl-actual-cost'].fieldOptions={
    '服务商':LCL_COST_PROVIDERS,'币别':['CNY','USD','EUR'],'单号类型':['运单','主单'],'分摊规则':LCL_ACTUAL_RULES
};
/* 服务商账单号 = 代理发票上的号，人工录；不显式 text 会被「编号」启发式判成只读自动生成 */
TC['lcl-actual-cost'].modalFieldTypes={'服务商账单号':'text'};
/* 全局正则不认这些词，显式覆写必填 */
TC['lcl-actual-cost'].requiredOverrides={'流水号':false,'服务商':true,'服务商账单号':true,'单号类型':true,'账期时间':true,'币别':true,'账单金额':true};
TC['lcl-actual-cost'].modalCols=3;
TC['lcl-actual-cost'].modalFieldClass={'备注':'modal-remark-full'};
TC['lcl-actual-cost'].fieldChangeHandlers={'单号类型':'lclActualModalTypeChange(this)'};
TC['lcl-actual-cost'].afterModalRender='lclActualModalTypeChangeInit';
/* 单号类型联动：主单 → 分摊规则显示且必填；运单 → 隐藏并置「不分摊」 */
function lclActualModalTypeChange(el){
    var isMaster=((el&&el.value)||'')==='主单';
    if(typeof crudToggleField==='function')crudToggleField('分摊规则',isMaster,isMaster);
    if(!isMaster&&typeof crudSetField==='function')crudSetField('分摊规则','不分摊');
}
function lclActualModalTypeChangeInit(){
    var el=(typeof crudField==='function')?crudField('单号类型'):null;
    lclActualModalTypeChange(el);
}
/* 作废：仅「待对账 / 待请款」可作废（已生成付款单的不让作废） */
function submitLclActualVoid(id){
    id=id||'lcl-actual-cost';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要作废的实际成本'));return;}
    var rows=fclFinRows(id),eligible=[],blocked=0;
    idxs.forEach(function(i){
        var r=rows[i];if(!r)return;
        var st=lclActualCell(r,'账单状态');
        if(st==='待对账'||st==='待请款')eligible.push(r);else blocked++;
    });
    if(!eligible.length){showToast(tr('仅「待对账 / 待请款」状态可作废'));return;}
    eligible.forEach(function(r){fclFinSet(id,r,'账单状态','作废');});
    if(typeof _listData!=='undefined')delete _listData[id];
    fclFinRefresh(id);
    showToast(tr('已作废')+' '+eligible.length+' '+tr('笔')+(blocked?('，'+blocked+' '+tr('笔非待对账/待请款已跳过')):''));
}

/* ---------- 详情：基本信息 + 费用明细 + 主单分摊结果 ---------- */
function openLclActualCostDetail(id,rowIdx){
    id=id||'lcl-actual-cost';
    var rows=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:TC[id].d;
    var row=rows[rowIdx];
    if(!row){showToast(tr('未找到数据'));return;}
    var no=lclActualCell(row,'流水号'),ntype=lclActualCell(row,'单号类型'),
        cur=lclActualCell(row,'币别'),rule=lclActualCell(row,'分摊规则')||lclActualRuleOf(no);
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('实际成本详情')+' - '+no;
    function fld(l,v){return '<div><div class="text-xs text-text-secondary">'+tr(l)+'</div><div class="text-sm font-medium text-text-primary mt-0.5">'+esc(v||'—')+'</div></div>';}
    var h='<div class="space-y-5">';
    h+='<div class="rounded-lg border border-surface-200 bg-white p-4 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-3">'+
        fld('流水号',no)+fld('服务商',lclActualCell(row,'服务商'))+fld('服务商账单号',lclActualCell(row,'服务商账单号'))+
        fld('单号类型',ntype)+fld('账单金额',cur+' '+lclActualCell(row,'账单金额'))+
        fld('账单状态',lclActualCell(row,'账单状态'))+fld('分摊规则',ntype==='主单'?(rule||'—'):tr('不分摊'))+'</div>';
    var det=_lclActualCostDetails[no]||[];
    h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-primary-500 rounded"></span><span class="text-sm font-semibold text-text-primary">'+tr('费用明细')+'</span><span class="text-xs text-text-muted">'+det.length+' '+tr('条')+'</span></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+['费用名称','费用类别','币别','金额','备注'].map(function(t){return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+'</tr></thead><tbody>';
    if(!det.length)h+='<tr><td colspan="5" class="px-3 py-6 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
    det.forEach(function(d){
        h+='<tr class="border-t border-surface-100"><td class="px-3 py-2">'+esc(d.feeName)+'</td><td class="px-3 py-2 text-text-secondary">'+esc(d.feeKind)+'</td><td class="px-3 py-2 text-text-secondary">'+esc(d.cur)+'</td><td class="px-3 py-2 font-semibold text-blue-700">'+esc(d.amt)+'</td><td class="px-3 py-2 text-text-secondary">'+esc(d.remark||'—')+'</td></tr>';
    });
    h+='</tbody></table></div></div>';
    if(ntype==='主单'&&(_lclActualAlloc[no]||[]).length){
        h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-amber-400 rounded"></span><span class="text-sm font-semibold text-text-primary">'+tr('分摊结果')+'</span><span class="text-xs text-text-muted">'+esc(rule)+'</span></div>';
        h+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+['运单号','分摊金额'].map(function(t){return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+'</tr></thead><tbody>';
        _lclActualAlloc[no].forEach(function(a){
            h+='<tr class="border-t border-surface-100"><td class="px-3 py-2 font-medium text-primary-700">'+esc(a.wb)+'</td><td class="px-3 py-2 font-semibold text-orange-600">'+esc(cur)+' '+a.amt+'</td></tr>';
        });
        h+='</tbody></table></div></div>';
    }
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* ---------- 对账分摊：主单按规则摊到主单下各运单，运单直挂 ---------- */
var _lclRcCtx=null;
function openLclActualReconcile(id){
    id=id||'lcl-actual-cost';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要对账的实际成本'));return;}
    var rows=fclFinRows(id);
    var picked=idxs.map(function(i){return rows[i];}).filter(function(r){return r&&lclActualCell(r,'账单状态')==='待对账';});
    if(!picked.length){showToast(tr('仅「待对账」状态可发起对账分摊'));return;}
    var firstMaster=picked.filter(function(r){return lclActualCell(r,'单号类型')==='主单';})[0];
    var defRule=firstMaster?(lclActualCell(firstMaster,'分摊规则')||lclActualRuleOf(lclActualCell(firstMaster,'流水号'))||'按票数'):'';
    _lclRcCtx={id:id,rows:picked,hasMaster:!!firstMaster};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='64%';
    document.getElementById('crud-modal-title').textContent=tr('对账分摊')+' - '+tr('实际成本管理');
    var h='<div class="space-y-4">';
    h+='<div class="text-xs text-text-secondary bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">'+esc(tr('确认费用后按规则分摊：主单整单费用摊到主单下各运单（票数/件数/体积/重量），运单直挂。'))+'</div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+['流水号','服务商','单号类型','账单金额','费用明细'].map(function(t){return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+'</tr></thead><tbody>';
    picked.forEach(function(r){
        var no=lclActualCell(r,'成本单号');
        var det=(_lclActualCostDetails[no]||[]).map(function(d){return d.feeName+' '+d.amt;}).join('；');
        h+='<tr class="border-t border-surface-100"><td class="px-3 py-2 font-medium text-text-primary">'+esc(no)+'</td><td class="px-3 py-2">'+esc(lclActualCell(r,'服务商'))+'</td><td class="px-3 py-2">'+esc(lclActualCell(r,'单号类型'))+'</td><td class="px-3 py-2 font-semibold text-blue-700">'+esc(lclActualCell(r,'币别')+' '+lclActualCell(r,'账单金额'))+'</td><td class="px-3 py-2 text-text-secondary">'+esc(det||'—')+'</td></tr>';
    });
    h+='</tbody></table></div>';
    h+='<div class="flex items-center gap-3"><label class="text-sm font-medium text-text-secondary">'+(_lclRcCtx.hasMaster?'<span class="text-red-500 mr-0.5">*</span>':'')+tr('分摊规则')+'</label>'+
        '<select id="lac-rc-rule" class="h-9 px-2 text-sm border border-surface-200 rounded-lg bg-surface-50">'+LCL_ACTUAL_RULES.map(function(o){return '<option'+(o===defRule?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>'+
        (_lclRcCtx.hasMaster?'<span class="text-xs text-amber-700">'+esc(tr('含主单，分摊规则必选'))+'</span>':'')+'</div>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitLclActualReconcile()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认分摊')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function lclActualBasisOf(rule,wb){
    if(rule==='按件数')return arPcsOf(wb);
    var cg=(typeof arCargoOf==='function')?arCargoOf(wb):{};
    if(rule==='按体积')return parseFloat(cg.vol)||0;
    if(rule==='按重量')return parseFloat(cg.wt)||0;
    return 1;   /* 按票数 / 不分摊 */
}
function submitLclActualReconcile(){
    var ctx=_lclRcCtx;
    if(!ctx){closeCrudModal();return;}
    var rule=((document.getElementById('lac-rc-rule')||{}).value)||'';
    if(ctx.hasMaster&&!rule){showToast(tr('主单必须选择分摊规则'));return;}
    if(!ctx.hasMaster)rule='不分摊';
    ctx.rows.forEach(function(r){
        var no=lclActualCell(r,'流水号'),ntype=lclActualCell(r,'单号类型'),refNo=lclActualRefNoOf(no),
            amt=fclParseMoney(lclActualCell(r,'账单金额'))||0;
        if(ntype==='主单'){
            var wbs=_LCL_MASTER_WBS[refNo]||[];
            _LCL_ACTUAL_RULE[no]=rule;
            if(wbs.length){
                var baseSum=0,bases=wbs.map(function(w){var b=lclActualBasisOf(rule,w);baseSum+=b;return b;});
                var alloc=[],assigned=0;
                bases.forEach(function(b,i){
                    var a=(i===bases.length-1)?+(amt-assigned).toFixed(2):+(amt*b/baseSum).toFixed(2);
                    assigned=+(assigned+a).toFixed(2);
                    alloc.push({wb:wbs[i],amt:a.toFixed(2)});
                });
                _lclActualAlloc[no]=alloc;
            }
        }
        fclFinSet(ctx.id,r,'分摊规则',ntype==='主单'?rule:'不分摊');
        fclFinSet(ctx.id,r,'账单状态','待请款');
    });
    if(typeof _listData!=='undefined')delete _listData[ctx.id];
    closeCrudModal();
    fclFinRefresh(ctx.id);
    showToast(tr('对账分摊完成')+'：'+ctx.rows.length+' '+tr('笔进入待请款'));
}

/* ---------- 生成付款单：待请款 → 按服务商+币别合并推 lcl-pay-bill（待审核） ---------- */
function lclActualGenPay(id){
    id=id||'lcl-actual-cost';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要生成付款单的实际成本'));return;}
    var rows=fclFinRows(id);
    var picked=idxs.map(function(i){return rows[i];}).filter(function(r){return r&&lclActualCell(r,'账单状态')==='待请款';});
    if(!picked.length){showToast(tr('仅「待请款」状态可生成付款单'));return;}
    var groups={};
    picked.forEach(function(r){
        var k=lclActualCell(r,'服务商')+'||'+lclActualCell(r,'币别');
        if(!groups[k])groups[k]={prov:lclActualCell(r,'服务商'),cur:lclActualCell(r,'币别'),amt:0,rows:[]};
        groups[k].amt=+((groups[k].amt)+(fclParseMoney(lclActualCell(r,'账单金额'))||0)).toFixed(2);
        groups[k].rows.push(r);
    });
    var n=0;
    Object.keys(groups).forEach(function(k){
        var g=groups[k];
        var c=TC['lcl-pay-bill'],dt=new Date(),pad=function(x){return String(x).padStart(2,'0');};
        var no='LCP-'+String(dt.getFullYear()).slice(2)+pad(dt.getMonth()+1)+pad(dt.getDate())+String((c.d||[]).length+n+1).padStart(3,'0');
        fclPushRow('lcl-pay-bill',{'付款单号':no,'服务商':g.prov,'费用行数':String(g.rows.length),'币别':g.cur,
            '应付金额':g.amt.toFixed(2),'已付金额':'0','待付金额':g.amt.toFixed(2),
            '申请人':(typeof fclWho==='function'?fclWho():'当前用户'),'申请时间':(typeof fclNow==='function'?fclNow():''),
            '付款状态':'待审核'});
        g.rows.forEach(function(r){fclFinSet(id,r,'账单状态','待审核');});
        n++;
    });
    if(typeof _listData!=='undefined'){delete _listData[id];delete _listData['lcl-pay-bill'];}
    fclFinRefresh(id);
    showToast(tr('已生成付款单')+' '+n+' '+tr('张')+'，'+tr('进入付款单管理待审核'));
}
