/* ===== 应收账单管理 fin-ar-bill（账单列表 + 详情弹窗 + 未核销账单作废） ===== */
/* 账单状态：待核销(已核销=0) / 部分核销 / 全部核销 / 作废。作废规则：仅「待核销」（未核销）账单可作废。 */
/* 字段：bn 应收账单号 / batch 账单批次号 / cur 原币币别 / amt 金额(原币) / basecur 本位币币别 / rmb 金额(本位币) / cyc 结算周期 / due 账单到期时间 */
var _arBillSeed=[
{bn:'RB2607060003',batch:'PC2607060003',cust:'天地直客',cur:'人民币',amt:'240',basecur:'人民币',rmb:'240',used:'0',unused:'240',cyc:'出货票结',due:'2026-07-31 23:59:59',st:'待核销',rk:'',src:'人工录入',ct:'2026-07-06 17:11:47',fees:[{wb:'H2607030002',cust:'天地直客',sales:'天地销售',fee:'运费',amt:'240',cur:'人民币',rate:'1',rmb:'240'}]},
{bn:'RB2607060002',batch:'PC2607060002',cust:'天地直客',cur:'人民币',amt:'6000',basecur:'人民币',rmb:'6000',used:'0',unused:'6000',cyc:'出货票结',due:'2026-07-31 23:59:59',st:'待核销',rk:'测试',src:'人工录入',ct:'2026-07-06 17:09:07',fees:[{wb:'H2607060015',cust:'天地直客',sales:'天地销售',fee:'运费',amt:'6000',cur:'人民币',rate:'1',rmb:'6000'}]},
{bn:'RB2607060001',batch:'PC2607060001',cust:'天地直客',cur:'人民币',amt:'100',basecur:'人民币',rmb:'100',used:'0',unused:'100',cyc:'出货票结',due:'2026-07-31 23:59:59',st:'待核销',rk:'z',src:'人工录入',ct:'2026-07-06 17:07:01',fees:[{wb:'H2607060001',cust:'天地直客',sales:'天地销售',fee:'运费',amt:'100',cur:'人民币',rate:'1',rmb:'100'}]},
{bn:'RB2606140002',batch:'PC2606140002',cust:'梦幻直客客户',cur:'人民币',amt:'1200',basecur:'人民币',rmb:'1200',used:'0',unused:'1200',cyc:'签收月结',due:'2026-06-30 23:59:59',st:'待核销',rk:'111',src:'人工录入',ct:'2026-06-14 11:53:19',fees:[{wb:'H2606140020',cust:'梦幻直客客户',sales:'梦幻小业务',fee:'应收附加费',amt:'1200',cur:'人民币',rate:'1',rmb:'1200'}]},
{bn:'RB2606140001',batch:'PC2606140001',cust:'梦幻直客客户',cur:'人民币',amt:'1200',basecur:'人民币',rmb:'1200',used:'1200',unused:'0',cyc:'签收月结',due:'2026-06-30 23:59:59',st:'全部核销',rk:'备注222',src:'人工录入',ct:'2026-06-14 11:53:08',fees:[{wb:'H2606140001',cust:'梦幻直客客户',sales:'梦幻小业务',fee:'运费',amt:'1200',cur:'人民币',rate:'1',rmb:'1200'}]},
{bn:'RB2605240003',batch:'PC2605240003',cust:'星星玩具电商',cur:'人民币',amt:'880',basecur:'人民币',rmb:'880',used:'120',unused:'760',cyc:'出货月结',due:'2026-05-31 23:59:59',st:'部分核销',rk:'',src:'人工录入',ct:'2026-05-24 01:15:44',fees:[{wb:'H82605240003',cust:'星星玩具电商',sales:'BTWOZCW',fee:'运费',amt:'880',cur:'人民币',rate:'1',rmb:'880'}]},
{bn:'RB2605240002',batch:'PC2605240002',cust:'星星玩具电商',cur:'人民币',amt:'880',basecur:'人民币',rmb:'880',used:'880',unused:'0',cyc:'出货月结',due:'2026-05-31 23:59:59',st:'全部核销',rk:'',src:'人工录入',ct:'2026-05-24 01:13:03',fees:[{wb:'H82605240004',cust:'星星玩具电商',sales:'BTWOZCW',fee:'运费',amt:'880',cur:'人民币',rate:'1',rmb:'880'}]},
{bn:'RB2605240001',batch:'PC2605240001',cust:'星星玩具电商',cur:'人民币',amt:'880',basecur:'人民币',rmb:'880',used:'211.87',unused:'668.13',cyc:'出货月结',due:'2026-05-31 23:59:59',st:'部分核销',rk:'',src:'人工录入',ct:'2026-05-24 01:09:13',fees:[{wb:'H82605240005',cust:'星星玩具电商',sales:'BTWOZCW',fee:'运费',amt:'680',cur:'人民币',rate:'1',rmb:'680'},{wb:'H82605240005',cust:'星星玩具电商',sales:'BTWOZCW',fee:'报关费',amt:'200',cur:'人民币',rate:'1',rmb:'200'}]},
{bn:'RB2604110007',batch:'PC2604110007',cust:'星星玩具电商',cur:'人民币',amt:'838',basecur:'人民币',rmb:'838',used:'0',unused:'838',cyc:'出货月结',due:'2026-04-30 23:59:59',st:'待核销',rk:'备注',src:'人工录入',ct:'2026-04-11 17:40:00',fees:[{wb:'H2604110007',cust:'星星玩具电商',sales:'BTWOZCW',fee:'运费',amt:'838',cur:'人民币',rate:'1',rmb:'838'}]},
{bn:'RB2604110006',batch:'PC2604110006',cust:'星星玩具电商',cur:'人民币',amt:'845.38',basecur:'人民币',rmb:'845.38',used:'7.36',unused:'838',cyc:'出货月结',due:'2026-04-30 23:59:59',st:'部分核销',rk:'测试账单0411',src:'人工录入',ct:'2026-04-11 16:15:57',fees:[{wb:'H2604110006',cust:'星星玩具电商',sales:'BTWOZCW',fee:'运费',amt:'845.38',cur:'人民币',rate:'1',rmb:'845.38'}]},
{bn:'RB2604110005',batch:'PC2604110005',cust:'星星玩具电商',cur:'人民币',amt:'845.38',basecur:'人民币',rmb:'845.38',used:'7.36',unused:'838',cyc:'出货月结',due:'2026-04-30 23:59:59',st:'部分核销',rk:'测试账单0411',src:'人工录入',ct:'2026-04-11 16:14:58',fees:[{wb:'H2604110005',cust:'星星玩具电商',sales:'BTWOZCW',fee:'运费',amt:'845.38',cur:'人民币',rate:'1',rmb:'845.38'}]}
];
var _arBillRows=_arBillSeed.slice();

function _arBillV(id){return ((document.getElementById(id)||{}).value||'').trim();}

function _arBillFind(bn){ for(var i=0;i<_arBillRows.length;i++){ if(_arBillRows[i].bn===bn)return _arBillRows[i]; } return null; }

function renderArBillRows(){
    var bn=_arBillV('arbill-q-bn'),ba=_arBillV('arbill-q-batch'),cu=_arBillV('arbill-q-cust');
    var rows=_arBillRows.filter(function(b){
        return (!bn||String(b.bn).indexOf(bn)>=0)&&(!ba||String(b.batch).indexOf(ba)>=0)&&(!cu||String(b.cust).indexOf(cu)>=0);
    });
    if(!rows.length)return '<tr><td colspan="15" class="py-12 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
    return rows.map(function(b,i){
        var h='<tr class="border-t border-surface-100 hover:bg-primary-50/30">';
        h+='<td class="px-3 py-2.5 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-3 py-2.5"><input type="checkbox" class="arbill-check" value="'+esc(b.bn)+'"></td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap"><a onclick="openArBillDetail(\''+esc(b.bn)+'\')" class="font-medium text-primary-700 hover:underline cursor-pointer">'+esc(b.bn)+'</a></td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.batch)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.cust)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.cur)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-700">'+esc(b.amt)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-orange-600">'+esc(b.used)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-green-600">'+esc(b.unused)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.cyc)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.due)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap">'+arStatusBadge(b.st)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.rk||'')+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.src)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.ct)+'</td>';
        h+='</tr>';
        return h;
    }).join('');
}

function renderArBillTable(){ var tb=document.getElementById('arbill-tbody'); if(tb)tb.innerHTML=renderArBillRows(); }

function arBillCheckedBns(){
    return Array.prototype.slice.call(document.querySelectorAll('.arbill-check:checked')).map(function(c){return c.value;});
}

function arBillDetailSelected(){
    var bns=arBillCheckedBns();
    if(!bns.length){ showToast(tr('请先勾选要查看的账单')); return; }
    openArBillDetail(bns[0]);
}

/* 下载账单：勾选后下载所选账单（原型以提示模拟） */
function arBillDownloadSelected(){
    var bns=arBillCheckedBns();
    if(!bns.length){ showToast(tr('请先勾选要下载的账单')); return; }
    var names=bns.slice(0,3).join('、')+(bns.length>3?('等 '+bns.length+' 个'):'');
    showToast(tr('正在下载账单')+'：'+names);
}
function arBillVoidSelected(){
    var bns=arBillCheckedBns();
    if(!bns.length){ showToast(tr('请先勾选要作废的账单')); return; }
    var targets=bns.map(_arBillFind).filter(Boolean);
    var eligible=targets.filter(function(b){ return b.st==='待核销'&&(parseFloat(b.used)||0)===0; });
    var blocked=targets.filter(function(b){ return !(b.st==='待核销'&&(parseFloat(b.used)||0)===0); });
    if(!eligible.length){ showToast(tr('选中的账单已核销或已作废，不能作废')); return; }
    var msg='本次将作废 '+eligible.length+' 笔账单：'+eligible.map(function(b){return b.bn;}).join('、');
    if(blocked.length)msg+='；另有 '+blocked.length+' 笔已核销/已作废将跳过';
    msg+='。作废后账单不可恢复，确认作废？';
    openConfirmTip(msg,function(){
        eligible.forEach(function(b){ b.st='作废'; });
        renderArBillTable();
        showToast(tr('已作废')+' '+eligible.length+' '+tr('笔账单'));
    });
}

function arBillFeeTableHtml(b){
    var fees=b.fees||[];
    var cols=['运单号','客户名称','业务员名称','费用名称','金额(原币)','币别','汇率','金额(本位币)'];
    var h='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead><tr class="bg-[#EFF6FF] text-text-secondary"><th class="px-3 py-2.5 text-left font-semibold" style="width:48px">#</th>';
    cols.forEach(function(c){h+='<th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!fees.length){h+='<tr><td colspan="9" class="py-8 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';}
    fees.forEach(function(f,i){
        h+='<tr class="border-t border-surface-100 hover:bg-primary-50/30">';
        h+='<td class="px-3 py-2.5 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-primary-700">'+esc(f.wb)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(f.cust)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(f.sales)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(f.fee)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-700">'+esc(f.amt)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(f.cur)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(f.rate)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-700">'+esc(f.rmb)+'</td>';
        h+='</tr>';
    });
    h+='</tbody></table></div>';
    return h;
}

function openArBillDetail(bn){
    var b=_arBillFind(bn);
    if(!b){ showToast(tr('未找到账单')); return; }
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('详情');
    var ro='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary';
    function sec(t){ return '<div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-amber-400 rounded-full"></span><span class="text-sm font-semibold text-text-primary">'+tr(t)+'</span></div>'; }
    function fld(label,val){ return '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+'</label><input readonly value="'+esc(val)+'" class="'+ro+'"></div>'; }
    var h='<div class="space-y-5">';
    h+='<div>'+sec('基本信息')+'<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">';
    h+=fld('应收账单号',b.bn)+fld('账单批次号',b.batch)+fld('客户名称',b.cust);
    h+=fld('币别',b.cur)+fld('金额（原币）',b.amt)+fld('本位币币别',b.basecur);
    h+=fld('金额（本位币）',b.rmb)+fld('账单结算周期',b.cyc)+fld('账单到期时间',b.due);
    h+=fld('账单创建时间',b.ct);
    h+='</div></div>';
    h+='<div>'+sec('费用明细')+arBillFeeTableHtml(b)+'</div>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function generateArBillPage(id){
    _arBillRows=_arBillSeed.slice();
    var inputCls='h-8 px-3 text-xs border border-surface-200 rounded-lg bg-surface-50';
    var h='<div class="h-full flex flex-col overflow-hidden bg-surface-50">';
    h+='<div class="flex-shrink-0 border-b border-surface-200 bg-white">';
    h+='<div class="px-4 pt-3 flex items-end gap-4 flex-wrap">';
    h+='<div><label class="text-xs text-text-secondary block mb-1">'+tr('应收账单号')+'</label><input id="arbill-q-bn" class="'+inputCls+'" placeholder="'+tr('应收账单号')+'"></div>';
    h+='<div><label class="text-xs text-text-secondary block mb-1">'+tr('账单批次号')+'</label><input id="arbill-q-batch" class="'+inputCls+'" placeholder="'+tr('账单批次号')+'"></div>';
    h+='<div><label class="text-xs text-text-secondary block mb-1">'+tr('客户名称')+'</label><input id="arbill-q-cust" class="'+inputCls+'" placeholder="'+tr('客户名称')+'"></div>';
    h+='</div>';
    h+='<div class="px-4 py-3 flex items-center gap-2 flex-wrap">';
    h+='<button onclick="renderArBillTable()" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询')+'</button>';
    h+='<button onclick="arBillDetailSelected()" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('详情')+'</button>';
    h+='<button onclick="arBillDownloadSelected()" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('下载账单')+'</button>';
    h+='<button onclick="arBillVoidSelected()" class="h-9 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer">'+tr('作废')+'</button>';
    h+='</div></div>';
    h+='<div class="flex-1 overflow-auto p-4"><div class="bg-white rounded-xl border border-surface-200 overflow-auto"><table class="w-full text-sm" style="min-width:1900px;border-collapse:separate;border-spacing:0"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-3 text-left font-semibold" style="width:40px">#</th><th class="px-3 py-3 text-left font-semibold" style="width:40px"><input type="checkbox" onchange="document.querySelectorAll(\'.arbill-check\').forEach(function(c){c.checked=this.checked;}.bind(this))"></th>';
    ['应收账单号','账单批次号','客户名称','币别','金额(原币)','已核销金额','待核销金额','结算周期','账单到期时间','核销状态','备注','数据来源','创建时间'].forEach(function(c){h+='<th class="px-3 py-3 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody id="arbill-tbody">'+renderArBillRows()+'</tbody></table></div></div>';
    h+='</div>';
    return h;
}
