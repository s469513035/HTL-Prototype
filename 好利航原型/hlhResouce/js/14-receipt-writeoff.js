var _receiptSelIdx=-1;
var _receiptLeftTab='writeoff';
var _receiptConsumed={};
function receiptFeeKey(r){ return r.wb+'|'+r.fee+'|'+r.amt; }
function receiptFindFee(key){ var a=(typeof _arDetailSeed!=='undefined'?_arDetailSeed:[]); for(var i=0;i<a.length;i++){ if(receiptFeeKey(a[i])===key)return a[i]; } return null; }
/* 凭证提现记录：凭证编号 -> [{no,amt,cur,rate,rmb,serial,time,remark,by}] */
var _receiptWithdrawals={};
function receiptWithdrawnAmount(code){
    var list=_receiptWithdrawals[code]||[];
    return list.reduce(function(a,w){return a+(parseFloat(w.rmb)||0);},0);
}
/* 已使用金额 = 核销占用 + 提现占用 */
function receiptUsedAmount(code){ var s=0; Object.keys(_receiptConsumed).forEach(function(k){ if(_receiptConsumed[k].voucher===code)s+=parseFloat(_receiptConsumed[k].amount)||0; }); return s+receiptWithdrawnAmount(code); }
/* 金额大写 */
function receiptAmountUpper(n){
    var num=parseFloat(n);
    if(isNaN(num)||num===0)return '';
    var fraction=['角','分'],digit=['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'],unit=[['元','万','亿'],['','拾','佰','仟']];
    var head=num<0?'欠':'';num=Math.abs(num);
    var s='',i,j;
    for(i=0;i<fraction.length;i++){s+=(digit[Math.floor(num*10*Math.pow(10,i))%10]+fraction[i]).replace(/零./,'');}
    s=s||'整';num=Math.floor(num);
    for(i=0;i<unit[0].length&&num>0;i++){
        var p='';
        for(j=0;j<unit[1].length&&num>0;j++){p=digit[num%10]+unit[1][j]+p;num=Math.floor(num/10);}
        s=p.replace(/(零.)*零$/,'').replace(/^$/,'零')+unit[0][i]+s;
    }
    return head+s.replace(/(零.)*零元/,'元').replace(/(零.)+/g,'零').replace(/^整$/,'零元整');
}
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
    h+='<button onclick="receiptToolbarAction(\'rate\')" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('修改汇率')+'</button>';
    h+='<button onclick="receiptToolbarAction(\'remark\')" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('修改财务备注')+'</button>';
    h+='</div>';
    h+='<div class="px-4 pb-3 overflow-auto" style="max-height:260px"><table class="w-full text-sm" style="min-width:1400px"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-2.5 text-left font-semibold" style="width:40px">#</th><th class="px-3 py-2.5" style="width:40px"></th>';
    ['凭证编号','凭证状态','凭证借贷标识','客户名称','金额(原币)','币别','汇率','本位币','金额(本位币)','已使用金额(本位币)','未使用金额(本位币)','我方账户'].forEach(function(c){h+='<th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody id="receipt-voucher-tbody">'+receiptVoucherRows()+'</tbody></table></div>';
    h+='</div>';
    h+='<div id="receipt-detail" class="flex-1 overflow-auto p-4 min-w-0">'+receiptDetailHtml()+'</div>';
    h+='</div>';
    return h;
}

function receiptVoucherRows(){
    var d=(TC['fin-ar-receipt']&&TC['fin-ar-receipt'].d)?TC['fin-ar-receipt'].d:[];
    if(!d.length)return '<tr><td colspan="14" class="py-8 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
    var rv=function(r,name){return voucherVal('fin-ar-receipt',r,name);};
    return d.map(function(r,i){
        var on=_receiptSelIdx===i;
        var used=(parseFloat(rv(r,'已使用金额(本位币)'))||0)+receiptUsedAmount(r[0]);
        var unused=(parseFloat(rv(r,'金额(本位币)'))||0)-used;
        return '<tr class="border-t border-surface-100 cursor-pointer '+(on?'bg-primary-50':'hover:bg-primary-50/30')+'" onclick="selectReceiptVoucher('+i+')">'+
            '<td class="px-3 py-2.5 text-text-muted">'+(i+1)+'</td>'+
            '<td class="px-3 py-2.5"><input type="radio" name="receipt-v"'+(on?' checked':'')+' onclick="selectReceiptVoucher('+i+')"></td>'+
            '<td class="px-3 py-2.5 font-medium text-primary-700 whitespace-nowrap">'+esc(rv(r,'凭证编号'))+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap">'+statusBadge(rv(r,'凭证状态'))+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(rv(r,'凭证借贷标识'))+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(rv(r,'认领账户名称'))+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-700">'+esc(rv(r,'金额(原币)'))+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(rv(r,'币别'))+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(rv(r,'汇率'))+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(rv(r,'本位币'))+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-700">'+esc(rv(r,'金额(本位币)'))+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-orange-600">'+receiptFmt(used)+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-green-600">'+receiptFmt(unused)+'</td>'+
            '<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(rv(r,'我方账户'))+'</td></tr>';
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
    if(kind==='withdraw'){ openReceiptWithdrawModal(v); return; }
    if(kind==='offset'){ showToast(tr('凭证对冲')); return; }
}

function receiptDetailHtml(){
    if(_receiptSelIdx<0||!TC['fin-ar-receipt'].d[_receiptSelIdx])return '<div class="h-full flex items-center justify-center text-text-muted text-sm">'+tr('请选择上方凭证以进行核销 / 反核销操作')+'</div>';
    var v=TC['fin-ar-receipt'].d[_receiptSelIdx];
    var totalRmb=parseFloat(voucherVal('fin-ar-receipt',v,'金额(本位币)'))||0;
    var used=(parseFloat(voucherVal('fin-ar-receipt',v,'已使用金额(本位币)'))||0)+receiptUsedAmount(v[0]);
    var unused=totalRmb-used;
    var h='<div class="flex flex-wrap items-center gap-x-8 gap-y-2 mb-4 text-sm">';
    h+='<span><span class="text-text-secondary">'+tr('凭证编号')+'：</span><span class="font-semibold text-primary-700">'+esc(v[0])+'</span></span>';
    h+='<span><span class="text-text-secondary">'+tr('客户名称')+'：</span><span class="font-medium text-text-primary">'+esc(v[5])+'</span></span>';
    h+='<span><span class="text-text-secondary">'+tr('凭证状态')+'：</span>'+statusBadge(v[1])+'</span>';
    h+='<span><span class="text-text-secondary">'+tr('金额(本位币)')+'：</span><span class="font-semibold text-blue-700">'+receiptFmt(totalRmb)+'</span></span>';
    h+='<span><span class="text-text-secondary">'+tr('已使用金额(本位币)')+'：</span><span class="font-semibold text-orange-600">'+receiptFmt(used)+'</span></span>';
    h+='<span><span class="text-text-secondary">'+tr('未使用金额(本位币)')+'：</span><span class="font-semibold text-green-600">'+receiptFmt(unused)+'</span></span>';
    h+='</div>';
    h+='<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">'+receiptLeftPanelHtml(v)+receiptRightPanelHtml(v)+'</div>';
    return h;
}

function receiptLeftPanelHtml(v){
    var h='<div class="bg-white rounded-xl border border-surface-200 p-4 min-w-0">';
    var leftPh=_receiptLeftTab==='withdraw'?'请输入提现凭证编号':(_receiptLeftTab==='offset'?'请输入对冲凭证编号':'请输入运单号');
    h+='<div class="flex items-center gap-2 mb-3 flex-wrap"><input id="receipt-left-wb" class="h-8 px-3 text-xs border border-surface-200 rounded-lg bg-surface-50" placeholder="'+tr(leftPh)+'"><button onclick="renderReceiptLeft()" class="h-8 px-3 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询')+'</button>'+(_receiptLeftTab==='writeoff'?'<button onclick="receiptReverseWriteoff()" class="h-8 px-3 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 cursor-pointer">'+tr('撤销核销')+'</button>':'')+'</div>';
    h+='<div class="flex items-center gap-4 border-b border-surface-200 mb-3 text-sm">';
    /* 已隐藏「提现明细」「对冲明细」插页（对应的凭证提现/对冲按钮同步隐藏） */
    [['writeoff','核销明细']].forEach(function(t){
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
    /* 提现明细：字段参照图示（提现凭证编号/提现金额(原币)/币别/汇率/提现金额(本位币)/交易流水号/提现时间/提现备注/提现人） */
    if(_receiptLeftTab==='withdraw'){
        var wds=(_receiptWithdrawals[code]||[]).filter(function(w){return !wbf||String(w.no).indexOf(wbf)>=0;});
        var wcols=['提现凭证编号','提现金额(原币)','币别','汇率','本位币','提现金额(本位币)','交易流水号','提现时间','提现备注','提现人'];
        var wh='<table class="w-full text-sm" style="min-width:980px"><thead><tr class="bg-[#EFF6FF] text-text-secondary"><th class="px-2 py-2 text-left" style="width:32px">#</th><th class="px-2 py-2" style="width:32px"></th>';
        wcols.forEach(function(c){wh+='<th class="px-2 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
        wh+='</tr></thead><tbody>';
        if(!wds.length){wh+='<tr><td colspan="12" class="py-8 text-center text-text-muted">'+tr('暂无提现明细')+'</td></tr>';}
        wds.forEach(function(w,i){
            wh+='<tr class="border-t border-surface-100 hover:bg-primary-50/30"><td class="px-2 py-2 text-text-muted">'+(i+1)+'</td><td class="px-2 py-2"><input type="checkbox" class="receipt-withdraw-check" value="'+esc(w.no)+'"></td>';
            wh+='<td class="px-2 py-2 whitespace-nowrap text-primary-700">'+esc(w.no)+'</td>';
            wh+='<td class="px-2 py-2 whitespace-nowrap text-blue-700">'+receiptFmt(w.amt)+'</td>';
            wh+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.cur)+'</td>';
            wh+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.rate)+'</td>';
            wh+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.base||'人民币')+'</td>';
            wh+='<td class="px-2 py-2 whitespace-nowrap text-blue-700">'+receiptFmt(w.rmb)+'</td>';
            wh+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.serial||'')+'</td>';
            wh+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.time)+'</td>';
            wh+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.remark||'')+'</td>';
            wh+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.by)+'</td></tr>';
        });
        wh+='</tbody></table>';
        return wh;
    }
    if(_receiptLeftTab==='offset'){
        var ocols=['对冲凭证编号','对冲金额(原币)','币别','汇率','对冲金额(本位币)','对冲时间','对冲人'];
        var oh='<table class="w-full text-sm" style="min-width:760px"><thead><tr class="bg-[#EFF6FF] text-text-secondary"><th class="px-2 py-2 text-left" style="width:32px">#</th><th class="px-2 py-2" style="width:32px"></th>';
        ocols.forEach(function(c){oh+='<th class="px-2 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
        oh+='</tr></thead><tbody><tr><td colspan="9" class="py-8 text-center text-text-muted">'+tr('暂无对冲明细')+'</td></tr></tbody></table>';
        return oh;
    }
    var rows=[];
    Object.keys(_receiptConsumed).forEach(function(k){ var w=_receiptConsumed[k]; if(w.voucher===code&&(!wbf||String(w.wb).indexOf(wbf)>=0))rows.push(w); });
    /* 字段参照「待核销明细」，并增加 核销金额 / 核销人 / 核销时间 */
    var cols=['运单号','账单号','客户名称','费用科目','金额','币别','核销金额','核销人','核销时间'];
    var h='<table class="w-full text-sm" style="min-width:900px"><thead><tr class="bg-[#EFF6FF] text-text-secondary"><th class="px-2 py-2 text-left" style="width:32px">#</th><th class="px-2 py-2" style="width:32px"></th>';
    cols.forEach(function(c){h+='<th class="px-2 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!rows.length){h+='<tr><td colspan="11" class="py-8 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';}
    rows.forEach(function(w,i){
        h+='<tr class="border-t border-surface-100 hover:bg-primary-50/30"><td class="px-2 py-2 text-text-muted">'+(i+1)+'</td><td class="px-2 py-2"><input type="checkbox" class="receipt-left-check" value="'+esc(w.key)+'"></td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-primary-700">'+esc(w.wb)+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.bn||'-')+'</td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.cust||'')+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.subject)+'</td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-blue-700">'+esc(w.amt||'')+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.cur||'')+'</td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-orange-600">'+receiptFmt(w.amount)+'</td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.by)+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(w.time)+'</td></tr>';
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

/* ===== 凭证提现（按图示：剩余金额/凭证金额/金额大写 · 币别/汇率/交易流水号 · 交易时间/我方银行账户/财务备注） ===== */
function receiptWithdrawNextNo(code){
    var n=(_receiptWithdrawals[code]||[]).length+1;
    return String(code||'')+'TX'+String(n).padStart(2,'0');
}
function openReceiptWithdrawModal(v){
    var code=voucherVal('fin-ar-receipt',v,'凭证编号');
    var cur=voucherVal('fin-ar-receipt',v,'币别')||'人民币';
    var rate=voucherVal('fin-ar-receipt',v,'汇率')||'1.0000';
    var baseCur=voucherVal('fin-ar-receipt',v,'本位币')||'人民币';
    var total=parseFloat(voucherVal('fin-ar-receipt',v,'金额(本位币)'))||0;
    var used=(parseFloat(voucherVal('fin-ar-receipt',v,'已使用金额(本位币)'))||0)+receiptUsedAmount(code);
    var remain=total-used;
    var bankAccts=(TC['fin-bank-account']&&TC['fin-bank-account'].d)?TC['fin-bank-account'].d:[];
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('凭证提现');
    var inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    var roCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary';
    function lbl(t,req){return '<label class="text-sm font-medium text-text-secondary mb-1.5 block">'+(req?'<span class="text-red-500">*</span> ':'')+tr(t)+'</label>';}
    var h='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">';
    h+='<div>'+lbl('剩余金额',false)+'<input id="rw-remain" type="text" readonly value="'+esc(receiptFmt(remain)+'　'+baseCur)+'" class="'+roCls+'"></div>';
    h+='<div>'+lbl('凭证金额',true)+'<input id="rw-amt" type="number" step="0.01" min="0" oninput="receiptWithdrawSync()" class="'+inputCls+'" placeholder="'+esc(tr('请输入提现金额'))+'"></div>';
    h+='<div>'+lbl('金额大写',false)+'<input id="rw-upper" type="text" readonly class="'+roCls+'" placeholder="'+esc(tr('自动生成'))+'"></div>';
    h+='<div>'+lbl('币别',true)+'<select id="rw-cur" class="'+inputCls+'">'+['人民币','美元','欧元','港币'].map(function(o){return '<option'+(o===cur?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    h+='<div>'+lbl('汇率',true)+'<input id="rw-rate" type="text" value="'+esc(rate)+'" oninput="receiptWithdrawSync()" class="'+inputCls+'"></div>';
    h+='<div>'+lbl('本位币',true)+'<select id="rw-basecur" class="'+inputCls+'">'+['人民币','美元','欧元','港币'].map(function(o){return '<option'+(o===baseCur?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    h+='<div>'+lbl('交易流水号',false)+'<input id="rw-serial" type="text" class="'+inputCls+'" placeholder="'+esc(tr('请输入交易流水号'))+'"></div>';
    h+='<div>'+lbl('交易时间',true)+'<input id="rw-time" type="datetime-local" value="'+esc(receiptNowStr().replace(' ','T').slice(0,16))+'" class="'+inputCls+'"></div>';
    h+='<div>'+lbl('我方银行账户',true)+'<select id="rw-acct" class="'+inputCls+'"><option value="">'+tr('请选择')+'</option>'+bankAccts.map(function(r){return '<option value="'+esc(r[0])+'">'+esc(r[0]+' '+(r[1]||''))+'</option>';}).join('')+'</select><div id="rw-acct-tip" class="hidden text-xs text-red-500 mt-1">'+tr('必填选项')+'</div></div>';
    h+='<div>'+lbl('财务备注',false)+'<textarea id="rw-remark" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入财务备注'))+'"></textarea></div>';
    h+='</div>';
    h+='<div class="mt-3 text-[11px] text-text-muted">'+tr('提现金额不得超过凭证剩余金额；提现后自动生成提现明细并占用凭证未使用金额。')+'</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="submitReceiptWithdraw()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提现')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function receiptWithdrawSync(){
    var a=document.getElementById('rw-amt'),u=document.getElementById('rw-upper');
    if(u)u.value=receiptAmountUpper(a?a.value:'');
}
function submitReceiptWithdraw(){
    var v=TC['fin-ar-receipt'].d[_receiptSelIdx]; if(!v){showToast(tr('请先选择凭证'));return;}
    var code=voucherVal('fin-ar-receipt',v,'凭证编号');
    var amtEl=document.getElementById('rw-amt'),acctEl=document.getElementById('rw-acct');
    var amt=parseFloat(amtEl?amtEl.value:'');
    if(isNaN(amt)||amt<=0){showToast(tr('请输入正确的凭证金额'));if(amtEl)amtEl.focus();return;}
    var rate=parseFloat((document.getElementById('rw-rate')||{}).value)||1;
    var rmb=amt*rate;
    var total=parseFloat(voucherVal('fin-ar-receipt',v,'金额(本位币)'))||0;
    var used=(parseFloat(voucherVal('fin-ar-receipt',v,'已使用金额(本位币)'))||0)+receiptUsedAmount(code);
    var remain=total-used;
    if(rmb>remain+0.005){showToast(tr('提现金额不得超过剩余金额')+'（'+receiptFmt(remain)+'）');if(amtEl)amtEl.focus();return;}
    if(!acctEl||!acctEl.value){
        var tip=document.getElementById('rw-acct-tip');
        if(tip)tip.classList.remove('hidden');
        if(acctEl)acctEl.classList.add('border-red-400');
        showToast(tr('请选择我方银行账户'));
        return;
    }
    var timeEl=document.getElementById('rw-time');
    var time=(timeEl&&timeEl.value)?timeEl.value.replace('T',' '):receiptNowStr();
    if(!_receiptWithdrawals[code])_receiptWithdrawals[code]=[];
    _receiptWithdrawals[code].push({
        no:receiptWithdrawNextNo(code),
        amt:String(amt),
        cur:(document.getElementById('rw-cur')||{}).value||'人民币',
        rate:String(rate),
        base:(document.getElementById('rw-basecur')||{}).value||'人民币',
        rmb:String(rmb),
        serial:((document.getElementById('rw-serial')||{}).value||'').trim(),
        time:time,
        remark:((document.getElementById('rw-remark')||{}).value||'').trim(),
        by:'当前操作员'
    });
    closeCrudModal();
    _receiptLeftTab='withdraw';
    var tb=document.getElementById('receipt-voucher-tbody'); if(tb)tb.innerHTML=receiptVoucherRows();
    var d=document.getElementById('receipt-detail'); if(d)d.innerHTML=receiptDetailHtml();
    showToast(tr('凭证提现成功')+'：'+receiptFmt(rmb));
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
    var cols=['运单号','账单号','客户名称','费用科目','金额','币别','核销状态'];
    var h='<table class="w-full text-sm" style="min-width:760px"><thead><tr class="bg-[#EFF6FF] text-text-secondary"><th class="px-2 py-2 text-left" style="width:32px">#</th><th class="px-2 py-2" style="width:32px"></th>';
    cols.forEach(function(c){h+='<th class="px-2 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!rows.length){h+='<tr><td colspan="9" class="py-8 text-center text-text-muted">'+tr('暂无未核销明细')+'</td></tr>';}
    rows.forEach(function(r,i){
        h+='<tr class="border-t border-surface-100 hover:bg-primary-50/30"><td class="px-2 py-2 text-text-muted">'+(i+1)+'</td><td class="px-2 py-2"><input type="checkbox" class="receipt-right-check" value="'+esc(receiptFeeKey(r))+'"></td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-primary-700">'+esc(r.wb)+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(r.bn||'-')+'</td><td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(r.cust)+'</td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(r.fee)+'</td><td class="px-2 py-2 whitespace-nowrap text-blue-700">'+esc(r.amt)+'</td>';
        h+='<td class="px-2 py-2 whitespace-nowrap text-text-secondary">'+esc(r.cur)+'</td><td class="px-2 py-2 whitespace-nowrap">'+arStatusBadge(r.st)+'</td></tr>';
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
            _receiptConsumed[c.value]={key:c.value,voucher:code,wb:r.wb,bn:r.bn||'',cust:r.cust||'',amt:r.amt||'',cur:r.cur||'',subject:r.fee,rmb:String(rmb),amount:String(rmb),pending:'0',by:'当前操作员',time:now};
        });
        var tb=document.getElementById('receipt-voucher-tbody'); if(tb)tb.innerHTML=receiptVoucherRows();
        var d=document.getElementById('receipt-detail'); if(d)d.innerHTML=receiptDetailHtml();
        showToast(tr('核销成功'));
    });
}

