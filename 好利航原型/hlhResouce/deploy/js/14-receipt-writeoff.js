var _receiptSelIdx=-1;
var _receiptLeftTab='writeoff';
var _receiptConsumed={};
function receiptFeeKey(r){ return r.wb+'|'+r.fee+'|'+r.amt; }
function receiptFindFee(key){ var a=(typeof _arDetailSeed!=='undefined'?_arDetailSeed:[]); for(var i=0;i<a.length;i++){ if(receiptFeeKey(a[i])===key)return a[i]; } return null; }
function receiptUsedAmount(code){ var s=0; Object.keys(_receiptConsumed).forEach(function(k){ if(_receiptConsumed[k].voucher===code)s+=parseFloat(_receiptConsumed[k].amount)||0; }); return s; }
function receiptFmt(n){ return (parseFloat(n)||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function receiptNowStr(){ var d=new Date();var p=function(n){return String(n).padStart(2,'0');};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds()); }

function generateReceiptPage(id){
    _receiptSelIdx=-1;_receiptLeftTab='writeoff';_receiptConsumed={};
    var inputCls='h-8 px-3 text-xs border border-surface-200 rounded-lg bg-surface-50';
    var selCls='h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50 min-w-[120px]';
    let h='<div class="h-full flex flex-col overflow-hidden bg-surface-50">';
    h+='<div class="flex-shrink-0 border-b border-surface-200 bg-white min-w-0">';
    h+='<div class="px-4 pt-3 flex items-end gap-4 flex-wrap">';
    h+='<div><label class="text-xs text-text-secondary block mb-1">'+tr('凭证编号')+'</label><input class="'+inputCls+'" placeholder="'+tr('凭证编号')+'"></div>';
    h+='<div><label class="text-xs text-text-secondary block mb-1">'+tr('认领客户')+'</label><input class="'+inputCls+'" placeholder="'+tr('认领客户')+'"></div>';
    h+='<div><label class="text-xs text-text-secondary block mb-1">'+tr('凭证状态')+'</label><select class="'+selCls+'"><option>'+tr('全部')+'</option><option>待抵扣</option><option>部分抵扣</option><option>全部抵扣</option><option>作废</option></select></div>';
    h+='<div><label class="text-xs text-text-secondary block mb-1">'+tr('借贷标识')+'</label><select class="'+selCls+'"><option>'+tr('全部')+'</option><option>收入</option><option>支出</option></select></div>';
    h+='<div><label class="text-xs text-text-secondary block mb-1">'+tr('币别')+'</label><select class="'+selCls+'"><option>'+tr('全部')+'</option><option>人民币</option><option>美元</option><option>欧元</option></select></div>';
    h+='<div><label class="text-xs text-text-secondary block mb-1">'+tr('交易流水号')+'</label><input class="'+inputCls+'" placeholder="'+tr('交易流水号')+'"></div>';
    h+='</div>';
    h+='<div class="px-4 py-3 flex items-center gap-2 flex-wrap">';
    h+='<button onclick="renderReceiptVouchers()" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询')+'</button>';
    h+='<button onclick="receiptToolbarAction(\'add\')" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">+ '+tr('新增')+'</button>';
    h+='<button onclick="receiptToolbarAction(\'detail\')" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('详情')+'</button>';
    h+='<button onclick="receiptToolbarAction(\'withdraw\')" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('凭证提现')+'</button>';
    h+='<button onclick="receiptToolbarAction(\'offset\')" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('凭证对冲')+'</button>';
    h+='<button onclick="receiptToolbarAction(\'rate\')" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('修改汇率')+'</button>';
    h+='<button onclick="receiptToolbarAction(\'remark\')" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('修改财务备注')+'</button>';
    h+='</div>';
    h+='<div class="px-4 pb-3 overflow-auto" style="max-height:260px"><table class="w-full text-sm" style="min-width:1400px"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-2.5 text-left font-semibold" style="width:40px">#</th><th class="px-3 py-2.5" style="width:40px"></th>';
    ['凭证编号','凭证状态','凭证借贷标识','客户名称','总金额(原币)','币别','汇率','总金额(人民币)','已使用金额(人民币)','未使用金额(人民币)','我方账户'].forEach(function(c){h+='<th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody id="receipt-voucher-tbody">'+receiptVoucherRows()+'</tbody></table></div>';
    h+='</div>';
    h+='<div id="receipt-detail" class="flex-1 overflow-auto p-4 min-w-0">'+receiptDetailHtml()+'</div>';
    h+='</div>';
    return h;
}

function receiptVoucherRows(){
    var d=(TC['fin-ar-receipt']&&TC['fin-ar-receipt'].d)?TC['fin-ar-receipt'].d:[];
    if(!d.length)return '<tr><td colspan="13" class="py-8 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
    return d.map(function(r,i){
        var on=_receiptSelIdx===i;
        var used=(parseFloat(r[10])||0)+receiptUsedAmount(r[0]);
        var unused=(parseFloat(r[9])||0)-used;
        return '<tr class="border-t border-surface-100 cursor-pointer '+(on?'bg-primary-50':'hover:bg-primary-50/30')+'" onclick="selectReceiptVoucher('+i+')">'+
            '<td class="px-3 py-2.5 text-text-muted">'+(i+1)+'</td>'+
            '<td class="px-3 py-2.5"><input type="radio" name="receipt-v"'+(on?' checked':'')+' onclick="selectReceiptVoucher('+i+')"></td>'+
            '<td class="px-3 py-2.5 font-medium text-primary-700 whitespace-nowrap">'+esc(r[0])+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap">'+statusBadge(r[1])+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(r[2])+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(r[5])+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-700">'+esc(r[6])+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(r[7])+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(r[8])+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-700">'+esc(r[9])+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-orange-600">'+receiptFmt(used)+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-green-600">'+receiptFmt(unused)+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(r[12])+'</td></tr>';
    }).join('');
}

function selectReceiptVoucher(i){
    _receiptSelIdx=i;_receiptLeftTab='writeoff';
    var tb=document.getElementById('receipt-voucher-tbody'); if(tb)tb.innerHTML=receiptVoucherRows();
    var d=document.getElementById('receipt-detail'); if(d)d.innerHTML=receiptDetailHtml();
}

function renderReceiptVouchers(){ var tb=document.getElementById('receipt-voucher-tbody'); if(tb)tb.innerHTML=receiptVoucherRows(); }

function receiptToolbarAction(kind){
    if(kind==='add'){ openCrudModal('add','fin-ar-receipt',-1); return; }
    var v=(_receiptSelIdx>=0&&TC['fin-ar-receipt'].d)?TC['fin-ar-receipt'].d[_receiptSelIdx]:null;
    if(!v){ showToast(tr('请先选择凭证')); return; }
    if(kind==='detail'){ openBankVoucherDetailModal('fin-ar-receipt',_receiptSelIdx,v); return; }
    if(kind==='rate'){ openVoucherRateModal(v,'fin-ar-receipt'); return; }
    if(kind==='remark'){ openVoucherRemarkModal(v,'fin-ar-receipt'); return; }
    if(kind==='withdraw'){ showToast(tr('凭证提现')); return; }
    if(kind==='offset'){ showToast(tr('凭证对冲')); return; }
}

function receiptDetailHtml(){
    if(_receiptSelIdx<0||!TC['fin-ar-receipt'].d[_receiptSelIdx])return '<div class="h-full flex items-center justify-center text-text-muted text-sm">'+tr('请选择上方凭证以进行核销 / 反核销操作')+'</div>';
    var v=TC['fin-ar-receipt'].d[_receiptSelIdx];
    var totalRmb=parseFloat(v[9])||0;
    var used=(parseFloat(v[10])||0)+receiptUsedAmount(v[0]);
    var unused=totalRmb-used;
    var h='<div class="flex flex-wrap items-center gap-x-8 gap-y-2 mb-4 text-sm">';
    h+='<span><span class="text-text-secondary">'+tr('凭证编号')+'：</span><span class="font-semibold text-primary-700">'+esc(v[0])+'</span></span>';
    h+='<span><span class="text-text-secondary">'+tr('客户名称')+'：</span><span class="font-medium text-text-primary">'+esc(v[5])+'</span></span>';
    h+='<span><span class="text-text-secondary">'+tr('凭证状态')+'：</span>'+statusBadge(v[1])+'</span>';
    h+='<span><span class="text-text-secondary">'+tr('总金额(人民币)')+'：</span><span class="font-semibold text-blue-700">'+receiptFmt(totalRmb)+'</span></span>';
    h+='<span><span class="text-text-secondary">'+tr('已使用金额(人民币)')+'：</span><span class="font-semibold text-orange-600">'+receiptFmt(used)+'</span></span>';
    h+='<span><span class="text-text-secondary">'+tr('未使用金额(人民币)')+'：</span><span class="font-semibold text-green-600">'+receiptFmt(unused)+'</span></span>';
    h+='</div>';
    h+='<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">'+receiptLeftPanelHtml(v)+receiptRightPanelHtml(v)+'</div>';
    return h;
}

function receiptLeftPanelHtml(v){
    var h='<div class="bg-white rounded-xl border border-surface-200 p-4 min-w-0">';
    h+='<div class="flex items-center gap-2 mb-3 flex-wrap"><input id="receipt-left-wb" class="h-8 px-3 text-xs border border-surface-200 rounded-lg bg-surface-50" placeholder="'+tr('请输入运单号')+'"><button onclick="renderReceiptLeft()" class="h-8 px-3 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询')+'</button><button onclick="receiptReverseWriteoff()" class="h-8 px-3 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 cursor-pointer">'+tr('撤销核销')+'</button></div>';
    h+='<div class="flex items-center gap-4 border-b border-surface-200 mb-3 text-sm">';
    [['writeoff','核销明细'],['withdraw','提现明细'],['offset','对冲明细']].forEach(function(t){
        var on=_receiptLeftTab===t[0];
        h+='<button onclick="switchReceiptLeftTab(\''+t[0]+'\')" class="'+(on?'pb-2 -mb-px border-b-2 border-primary-500 text-primary-600 font-medium':'pb-2 -mb-px border-b-2 border-transparent text-text-secondary hover:text-primary-600')+' cursor-pointer">'+tr(t[1])+'</button>';
    });
    h+='</div>';
    h+='<div id="receipt-left-table" class="overflow-auto" style="max-height:240px">'+receiptLeftTableHtml(v)+'</div>';
    h+='</div>';
    return h;
}

function receiptLeftTableHtml(v){
    var code=v[0];
    var wbf=((document.getElementById('receipt-left-wb')||{}).value||'').trim();
    var rows=[];
    if(_receiptLeftTab==='writeoff'){
        Object.keys(_receiptConsumed).forEach(function(k){ var w=_receiptConsumed[k]; if(w.voucher===code&&(!wbf||String(w.wb).indexOf(wbf)>=0))rows.push(w); });
    }
    var cols=['运单号','费用科目','金额(人民币)','核销金额(人民币)','待销账金额(人民币)','核销人','核销时间'];
    var h='<table class="w-full text-sm" style="min-width:760px"><thead><tr class="bg-[#EFF6FF] text-text-secondary"><th class="px-2 py-2 text-left" style="width:32px">#</th><th class="px-2 py-2" style="width:32px"></th>';
    cols.forEach(function(c){h+='<th class="px-2 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!rows.length){h+='<tr><td colspan="9" class="py-8 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';}
    rows.forEach(function(w,i){
        h+='<tr class="border-t border-surface-100 hover:bg-primary-50/30"><td class="px-2 py-2 text-text-muted">'+(i+1)+'</td><td class="px-2 py-2"><input type="checkbox" class="receipt-left-check" value="'+esc(w.key)+'"></td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-primary-700">'+esc(w.wb)+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.subject)+'</td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-blue-700">'+receiptFmt(w.rmb)+'</td><td class="px-2 py-2 whitespace-nowrap text-orange-600">'+receiptFmt(w.amount)+'</td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+receiptFmt(w.pending)+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.by)+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.time)+'</td></tr>';
    });
    h+='</tbody></table>';
    return h;
}

function switchReceiptLeftTab(tab){ _receiptLeftTab=tab; var d=document.getElementById('receipt-detail'); if(d)d.innerHTML=receiptDetailHtml(); }
function renderReceiptLeft(){ var v=TC['fin-ar-receipt'].d[_receiptSelIdx]; if(!v)return; var t=document.getElementById('receipt-left-table'); if(t)t.innerHTML=receiptLeftTableHtml(v); }

function receiptReverseWriteoff(){
    var checks=Array.prototype.slice.call(document.querySelectorAll('.receipt-left-check:checked'));
    if(!checks.length){showToast(tr('请先勾选要撤销核销的明细'));return;}
    var v=TC['fin-ar-receipt'].d[_receiptSelIdx];
    var cur=v?v[7]:'',sumRmb=0;
    checks.forEach(function(c){ var w=_receiptConsumed[c.value]; if(w)sumRmb+=parseFloat(String(w.amount||'0').replace(/,/g,''))||0; });
    var msg='本次撤销核销 '+checks.length+' 笔，合计人民币 '+receiptFmt(sumRmb)+'，凭证币别 '+cur+'，确认撤销？';
    openConfirmTip(msg,function(){
        checks.forEach(function(c){ delete _receiptConsumed[c.value]; });
        var tb=document.getElementById('receipt-voucher-tbody'); if(tb)tb.innerHTML=receiptVoucherRows();
        var d=document.getElementById('receipt-detail'); if(d)d.innerHTML=receiptDetailHtml();
        showToast(tr('已撤销核销'));
    });
}

function receiptRightPanelHtml(v){
    var h='<div class="bg-white rounded-xl border border-surface-200 p-4 min-w-0">';
    h+='<div class="flex items-center gap-2 mb-3 flex-wrap"><input id="receipt-right-wb" class="h-8 px-3 text-xs border border-surface-200 rounded-lg bg-surface-50" placeholder="'+tr('请输入运单号')+'">';
    h+='<input id="receipt-right-bn" class="h-8 px-3 text-xs border border-surface-200 rounded-lg bg-surface-50" placeholder="'+tr('账单号')+'">';
    h+='<select id="receipt-right-type" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50"><option value="">'+tr('请选择费用类型')+'</option><option>运费</option><option>报关费</option><option>应收附加费</option><option>客户理赔费</option><option>派送费</option></select>';
    h+='<input type="date" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50">';
    h+='<button onclick="renderReceiptRight()" class="h-8 px-3 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询')+'</button>';
    h+='<button onclick="receiptConfirmWriteoff()" class="h-8 px-3 text-xs font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 cursor-pointer">'+tr('确认核销')+'</button></div>';
    h+='<div class="text-sm font-medium text-text-primary mb-2">'+tr('待核销明细')+'</div>';
    h+='<div id="receipt-right-table" class="overflow-auto" style="max-height:240px">'+receiptRightTableHtml(v)+'</div>';
    h+='</div>';
    return h;
}

function receiptRightTableHtml(v){
    var cust=v[5],cur=v[7];
    var wbf=((document.getElementById('receipt-right-wb')||{}).value||'').trim();
    var bnf=((document.getElementById('receipt-right-bn')||{}).value||'').trim();
    var tf=((document.getElementById('receipt-right-type')||{}).value||'').trim();
    var rows=(typeof _arDetailSeed!=='undefined'?_arDetailSeed:[]).filter(function(r){
        return r.cust===cust&&r.cur===cur&&r.st==='待核销'&&!_receiptConsumed[receiptFeeKey(r)]&&(!wbf||String(r.wb).indexOf(wbf)>=0)&&(!bnf||String(r.bn||'').indexOf(bnf)>=0)&&(!tf||r.fee===tf);
    });
    var cols=['运单号','账单号','客户名称','费用科目','金额(原币)','币别','汇率','核销状态'];
    var h='<table class="w-full text-sm" style="min-width:760px"><thead><tr class="bg-[#EFF6FF] text-text-secondary"><th class="px-2 py-2 text-left" style="width:32px">#</th><th class="px-2 py-2" style="width:32px"></th>';
    cols.forEach(function(c){h+='<th class="px-2 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!rows.length){h+='<tr><td colspan="10" class="py-8 text-center text-text-muted">'+tr('暂无未核销明细')+'</td></tr>';}
    rows.forEach(function(r,i){
        h+='<tr class="border-t border-surface-100 hover:bg-primary-50/30"><td class="px-2 py-2 text-text-muted">'+(i+1)+'</td><td class="px-2 py-2"><input type="checkbox" class="receipt-right-check" value="'+esc(receiptFeeKey(r))+'"></td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-primary-700">'+esc(r.wb)+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(r.bn||'-')+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(r.cust)+'</td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(r.fee)+'</td><td class="px-2 py-2 whitespace-nowrap text-blue-700">'+esc(r.amt)+'</td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(r.cur)+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(r.rate)+'</td><td class="px-2 py-2 whitespace-nowrap">'+arStatusBadge(r.st)+'</td></tr>';
    });
    h+='</tbody></table>';
    return h;
}

function renderReceiptRight(){ var v=TC['fin-ar-receipt'].d[_receiptSelIdx]; if(!v)return; var t=document.getElementById('receipt-right-table'); if(t)t.innerHTML=receiptRightTableHtml(v); }

function receiptConfirmWriteoff(){
    var v=TC['fin-ar-receipt'].d[_receiptSelIdx]; if(!v){showToast(tr('请先选择凭证'));return;}
    var checks=Array.prototype.slice.call(document.querySelectorAll('.receipt-right-check:checked'));
    if(!checks.length){showToast(tr('请先勾选要核销的费用明细'));return;}
    var cur=v[7],sumAmt=0,sumRmb=0;
    checks.forEach(function(c){ var r=receiptFindFee(c.value); if(!r)return; sumAmt+=parseFloat(String(r.amt||'0').replace(/,/g,''))||0; sumRmb+=parseFloat(String(r.rmb||'0').replace(/,/g,''))||0; });
    var msg='本次核销 '+checks.length+' 笔，币别 '+cur+'，原币合计 '+receiptFmt(sumAmt)+'，折合人民币 '+receiptFmt(sumRmb)+'，确认核销？';
    openConfirmTip(msg,function(){
        var code=v[0],now=receiptNowStr();
        checks.forEach(function(c){
            var r=receiptFindFee(c.value); if(!r)return;
            var rmb=parseFloat(String(r.rmb||'0').replace(/,/g,''))||0;
            _receiptConsumed[c.value]={key:c.value,voucher:code,wb:r.wb,subject:r.fee,rmb:String(rmb),amount:String(rmb),pending:'0',by:'当前操作员',time:now};
        });
        var tb=document.getElementById('receipt-voucher-tbody'); if(tb)tb.innerHTML=receiptVoucherRows();
        var d=document.getElementById('receipt-detail'); if(d)d.innerHTML=receiptDetailHtml();
        showToast(tr('核销成功'));
    });
}

