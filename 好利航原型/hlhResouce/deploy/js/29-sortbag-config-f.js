function sortBagCandidateOrders(){
    return [
        {wb:'WB-20260613010',cust:'深圳市华运达国际货运',qty:2,size:'30×20×15',weight:8.5,vol:0.018,country:'尼日利亚',transport:'海运',category:'电子产品',warehouse:'拉各斯仓'},
        {wb:'WB-20260613011',cust:'广州远洋进出口贸易',qty:3,size:'35×25×20',weight:12.0,vol:0.053,country:'尼日利亚',transport:'海运',category:'电子产品',warehouse:'拉各斯仓'},
        {wb:'WB-20260613012',cust:'东莞市鑫海物流',qty:1,size:'20×15×10',weight:3.5,vol:0.003,country:'尼日利亚',transport:'海运',category:'电子产品',warehouse:'拉各斯仓'},
        {wb:'WB-20260613013',cust:'上海锦程国际贸易',qty:4,size:'40×30×25',weight:18.0,vol:0.120,country:'尼日利亚',transport:'海运',category:'电子产品',warehouse:'拉各斯仓'},
        {wb:'WB-20260613014',cust:'佛山恒通货运代理',qty:2,size:'30×25×20',weight:9.5,vol:0.030,country:'尼日利亚',transport:'海运',category:'电子产品',warehouse:'拉各斯仓'},
        {wb:'WB-20260613020',cust:'深圳市华运达国际货运',qty:3,size:'35×30×25',weight:14.5,vol:0.079,country:'塞内加尔',transport:'海运',category:'服装鞋帽',warehouse:'达喀尔仓'},
        {wb:'WB-20260613021',cust:'广州远洋进出口贸易',qty:2,size:'25×20×15',weight:6.0,vol:0.015,country:'塞内加尔',transport:'海运',category:'服装鞋帽',warehouse:'达喀尔仓'},
        {wb:'WB-20260613022',cust:'东莞市鑫海物流',qty:5,size:'45×35×30',weight:22.0,vol:0.236,country:'塞内加尔',transport:'海运',category:'服装鞋帽',warehouse:'达喀尔仓'},
        {wb:'WB-20260613030',cust:'上海锦程国际贸易',qty:6,size:'50×40×35',weight:28.0,vol:0.420,country:'科特迪瓦',transport:'海运',category:'五金工具',warehouse:'阿比让仓'},
        {wb:'WB-20260613031',cust:'佛山恒通货运代理',qty:4,size:'40×35×30',weight:19.5,vol:0.168,country:'科特迪瓦',transport:'海运',category:'五金工具',warehouse:'阿比让仓'},
        {wb:'WB-20260613040',cust:'深圳市华运达国际货运',qty:2,size:'30×25×20',weight:10.5,vol:0.030,country:'多哥',transport:'海运',category:'家居用品',warehouse:'洛美仓'},
        {wb:'WB-20260613041',cust:'广州远洋进出口贸易',qty:3,size:'35×25×20',weight:13.0,vol:0.053,country:'多哥',transport:'海运',category:'家居用品',warehouse:'洛美仓'},
        {wb:'WB-20260613050',cust:'东莞市鑫海物流',qty:4,size:'40×30×25',weight:17.5,vol:0.120,country:'喀麦隆',transport:'海运',category:'食品',warehouse:'杜阿拉仓'},
        {wb:'WB-20260613051',cust:'上海锦程国际贸易',qty:2,size:'25×20×15',weight:7.5,vol:0.015,country:'喀麦隆',transport:'海运',category:'食品',warehouse:'杜阿拉仓'}
    ];
}

var _sortBagState={id:'',rule:null,bagNo:'',items:[],scanInput:''};

function openSortBagDetailModal(id,idx){
    const row=(TC[id]&&TC[id].d[idx])||[];
    const headers=(TC[id]&&TC[id].h)||[];
    const get=function(name){const i=headers.indexOf(name);return i>=0?(row[i]||''):'';};
    const bagNo=get('袋号');
    const product=get('产品');
    const cargoType=get('货物类型');
    const maxSize=get('最大体积限制');
    const warehouse=get('目的仓库');
    // mock：按目的仓库从候选池抽取作为该袋的订单明细
    const candidates=sortBagCandidateOrders().filter(function(o){return o.warehouse===warehouse;});
    const targetQty=parseInt(get('件数'))||0;
    const items=[];
    let qtyAcc=0;
    for(let i=0;i<candidates.length&&qtyAcc<targetQty;i++){items.push(candidates[i]);qtyAcc+=candidates[i].qty;}
    let h='<div class="mb-3 rounded-xl border border-primary-100 bg-primary-50/60 p-3">';
    h+='<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">';
    [['袋号',bagNo],['产品',product],['货物类型',cargoType],['最大体积限制(CBM)',maxSize||'—'],['目的仓库',warehouse],['总件数',get('件数')],['总重量(KG)',get('重量(KG)')],['总体积(CBM)',get('体积(CBM)')],['装袋操作人',get('装袋操作人')]].forEach(function(p){
        h+='<div><span class="text-text-muted">'+tr(p[0])+'：</span><span class="font-medium text-text-primary">'+esc(p[1])+'</span></div>';
    });
    h+='</div></div>';
    h+='<div class="rounded-lg border border-surface-200 overflow-hidden bg-white"><div class="px-3 py-2 bg-surface-50 text-xs font-semibold text-text-secondary">'+tr('订单明细')+'（'+items.length+' '+tr('条')+'）</div>';
    h+='<div class="overflow-auto"><table class="w-full text-xs"><thead class="bg-surface-50 text-text-secondary"><tr>';
    ['订单号','客户名称','件数','尺寸','重量(KG)','体积(CBM)','货物类型','目的仓库'].forEach(function(hd){h+='<th class="px-3 py-2 text-left whitespace-nowrap">'+tr(hd)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!items.length){h+='<tr><td colspan="8" class="px-3 py-6 text-center text-text-muted">'+tr('暂无订单明细')+'</td></tr>';}
    items.forEach(function(o){
        h+='<tr class="border-t border-surface-100">';
        h+='<td class="px-3 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(o.wb)+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(o.cust)+'</td>';
        h+='<td class="px-3 py-2 text-right text-text-secondary">'+o.qty+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(o.size)+'</td>';
        h+='<td class="px-3 py-2 text-right text-text-secondary">'+o.weight.toFixed(1)+'</td>';
        h+='<td class="px-3 py-2 text-right text-text-secondary">'+(o.vol||0).toFixed(3)+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(o.category==='电子产品'?'敏感货':'普货')+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(o.warehouse)+'</td>';
        h+='</tr>';
    });
    h+='</tbody></table></div></div>';
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='75%';
    document.getElementById('crud-modal-title').textContent=tr('订单明细')+' - '+esc(bagNo);
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openSortBagRuleModal(id){
    _sortBagState={id:id,rule:null,bagNo:'',items:[],scanInput:''};
    const products=['西非海运专线','西非空运专线'];
    const cargoTypes=['普货','敏感货'];
    const warehouses=['拉各斯仓','达喀尔仓','阿比让仓','洛美仓','杜阿拉仓'];
    function selOptions(opts){let s='<option value="">'+esc(tr('请选择'))+'</option>';opts.forEach(function(o){s+='<option value="'+esc(o)+'">'+esc(tr(o))+'</option>';});return s;}
    let h='<div class="text-xs text-text-muted mb-3">'+tr('请先设置装袋规则。系统按规则过滤可入袋的订单，并以最大限重作为装满判断。')+'</div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    h+='<div><label class="block text-sm font-medium text-text-secondary mb-1.5">'+tr('产品')+' *</label><select id="sb-rule-product" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white">'+selOptions(products)+'</select></div>';
    h+='<div><label class="block text-sm font-medium text-text-secondary mb-1.5">'+tr('货物类型')+' *</label><select id="sb-rule-cargotype" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white">'+selOptions(cargoTypes)+'</select></div>';
    h+='<div><label class="block text-sm font-medium text-text-secondary mb-1.5">'+tr('最大体积限制(CBM)')+'</label><input id="sb-rule-maxsize" type="number" step="0.01" min="0" placeholder="'+esc(tr('如 1.50'))+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white"></div>';
    h+='<div><label class="block text-sm font-medium text-text-secondary mb-1.5">'+tr('目的仓库')+' *</label><select id="sb-rule-warehouse" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white">'+selOptions(warehouses)+'</select></div>';
    h+='<div><label class="block text-sm font-medium text-text-secondary mb-1.5">'+tr('最大限重(KG)')+' *</label><input id="sb-rule-maxweight" type="number" min="1" value="60" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white"></div>';
    h+='<div class="flex items-end"><label class="inline-flex items-center gap-2 cursor-pointer"><input id="sb-rule-print" type="checkbox" checked class="rounded border-surface-300 text-primary-600"><span class="text-sm text-text-secondary">'+tr('完成装袋后自动打印袋子标签')+'</span></label></div>';
    h+='</div>';
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='52%';
    document.getElementById('crud-modal-title').textContent=tr('新增分拣扫描')+' - '+tr('设置装袋规则');
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="submitSortBagRule(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('开始装袋')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function submitSortBagRule(id){
    const product=document.getElementById('sb-rule-product').value;
    const cargoType=document.getElementById('sb-rule-cargotype').value;
    const maxSize=document.getElementById('sb-rule-maxsize').value;
    const warehouse=document.getElementById('sb-rule-warehouse').value;
    const maxWeight=parseFloat(document.getElementById('sb-rule-maxweight').value)||0;
    const printLabel=document.getElementById('sb-rule-print').checked;
    if(!product||!cargoType||!warehouse||maxWeight<=0){showToast(tr('请完整填写装袋规则'));return;}
    _sortBagState={id:id,rule:{product:product,cargoType:cargoType,maxSize:maxSize,warehouse:warehouse,maxWeight:maxWeight,printLabel:printLabel},bagNo:nextSortBagNo(),items:[],scanInput:''};
    renderSortBagScanScreen();
}

function nextSortBagNo(){
    const d=new Date();
    const ymd=d.getFullYear().toString()+(d.getMonth()+1).toString().padStart(2,'0')+d.getDate().toString().padStart(2,'0');
    const tail=Math.floor(Math.random()*900+100);
    return 'BAG-'+ymd+tail;
}

function renderSortBagScanScreen(){
    const st=_sortBagState;
    if(!st||!st.rule)return;
    const r=st.rule;
    const totalQty=st.items.reduce(function(a,o){return a+o.qty;},0);
    const totalWeight=st.items.reduce(function(a,o){return a+o.weight;},0);
    const totalVol=st.items.reduce(function(a,o){return a+(o.vol||0);},0);
    const pct=Math.min(100,Math.round(totalWeight/r.maxWeight*100));
    const isOver=totalWeight>=r.maxWeight;
    let h='';
    /* 顶部扫描栏 */
    h+='<section class="mb-3 rounded-xl border border-primary-200 bg-white p-3">';
    h+='<div class="text-xs font-semibold text-text-secondary mb-2">'+tr('扫描运单号')+'</div>';
    h+='<div class="flex items-center gap-2">';
    h+='<input id="sb-scan-input" type="text" autofocus value="" class="flex-1 h-10 px-3 text-sm border border-surface-200 rounded-lg" placeholder="'+esc(tr('扫描或输入运单号，回车提交'))+'" onkeydown="if(event.key===\'Enter\')addSortBagScanItem(false)">';
    h+='<button onclick="addSortBagScanItem(false)" class="h-10 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('提交扫描')+'</button>';
    h+='<button onclick="addSortBagScanItem(true)" class="h-10 px-4 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 cursor-pointer">'+tr('模拟扫一票')+'</button>';
    h+='</div>';
    h+='</section>';
    /* 中间袋子信息 */
    h+='<section class="mb-3 rounded-xl border '+(isOver?'border-amber-300 bg-amber-50/60':'border-primary-100 bg-primary-50/60')+' p-3">';
    h+='<div class="flex items-center justify-between mb-2"><div class="text-sm font-semibold text-primary-700">'+tr('当前袋')+'：'+esc(st.bagNo)+'</div>';
    h+='<label class="inline-flex items-center gap-2 text-xs cursor-pointer"><input id="sb-print-toggle" type="checkbox"'+(r.printLabel?' checked':'')+' onchange="_sortBagState.rule.printLabel=this.checked" class="rounded border-surface-300 text-primary-600"><span>'+tr('完成时打印袋标签')+'</span></label></div>';
    h+='<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">';
    [['产品',r.product],['货物类型',r.cargoType],['最大体积限制(CBM)',r.maxSize||'—'],['目的仓库',r.warehouse]].forEach(function(p){
        h+='<div><span class="text-text-muted">'+tr(p[0])+'：</span><span class="font-medium text-text-primary">'+esc(p[1])+'</span></div>';
    });
    h+='</div>';
    h+='<div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">';
    h+='<div><span class="text-text-muted">'+tr('合计件数')+'：</span><span class="font-semibold text-primary-700">'+totalQty+'</span></div>';
    h+='<div><span class="text-text-muted">'+tr('合计体积(CBM)')+'：</span><span class="font-semibold text-primary-700">'+totalVol.toFixed(3)+'</span></div>';
    h+='<div><span class="text-text-muted">'+tr('合计重量(KG)')+'：</span><span class="font-semibold '+(isOver?'text-amber-700':'text-primary-700')+'">'+totalWeight.toFixed(2)+' / '+r.maxWeight+'</span></div>';
    h+='<div class="md:col-span-1"><div class="h-2 rounded-full bg-surface-200 overflow-hidden"><div class="h-full '+(isOver?'bg-amber-500':'bg-primary-600')+'" style="width:'+pct+'%"></div></div><div class="text-text-muted mt-1">'+pct+'%'+(isOver?' · '+tr('已满，建议封袋'):'')+'</div></div>';
    h+='</div>';
    h+='</section>';
    /* 下方扫描列表 */
    h+='<section class="rounded-xl border border-surface-200 bg-white">';
    h+='<div class="px-3 py-2 bg-surface-50 text-xs font-semibold text-text-secondary flex items-center justify-between"><span>'+tr('扫描列表')+'（'+st.items.length+' '+tr('票')+'）</span><span class="text-text-muted">'+tr('按规则过滤的可入袋订单')+'</span></div>';
    h+='<div class="overflow-auto" style="max-height:280px"><table class="w-full text-xs"><thead class="bg-surface-50 text-text-secondary sticky top-0"><tr>';
    ['序号','运单号','客户名称','件数','尺寸','重量(KG)','体积(CBM)','操作'].forEach(function(hd){h+='<th class="px-3 py-2 text-left whitespace-nowrap">'+tr(hd)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!st.items.length){h+='<tr><td colspan="8" class="px-3 py-6 text-center text-text-muted">'+tr('暂无扫描记录，请扫描运单号')+'</td></tr>';}
    st.items.forEach(function(o,i){
        h+='<tr class="border-t border-surface-100">';
        h+='<td class="px-3 py-2 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-3 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(o.wb)+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(o.cust)+'</td>';
        h+='<td class="px-3 py-2 text-right text-text-secondary">'+o.qty+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(o.size)+'</td>';
        h+='<td class="px-3 py-2 text-right text-text-secondary">'+o.weight.toFixed(1)+'</td>';
        h+='<td class="px-3 py-2 text-right text-text-secondary">'+(o.vol||0).toFixed(3)+'</td>';
        h+='<td class="px-3 py-2"><a class="text-red-500 hover:text-red-600 cursor-pointer" onclick="removeSortBagScanItem('+i+')">'+tr('移除')+'</a></td>';
        h+='</tr>';
    });
    h+='</tbody></table></div></section>';
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='86%';
    document.getElementById('crud-modal-title').textContent=tr('分拣装袋扫描')+' - '+esc(st.bagNo);
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>'+
        '<button onclick="finishSortBag()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer'+(st.items.length?'':' opacity-60 pointer-events-none')+'">'+tr('完成装袋')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
    const input=document.getElementById('sb-scan-input');
    if(input)input.focus();
}

function addSortBagScanItem(mock){
    const st=_sortBagState;
    if(!st||!st.rule)return;
    const r=st.rule;
    const pool=sortBagCandidateOrders().filter(function(o){return o.country===r.country&&o.transport===r.transport&&o.category===r.category&&o.warehouse===r.warehouse;});
    const used=st.items.map(function(o){return o.wb;});
    let chosen=null;
    if(mock){
        const remaining=pool.filter(function(o){return used.indexOf(o.wb)<0;});
        if(!remaining.length){showToast(tr('该规则下已无可扫订单'));return;}
        chosen=remaining[0];
    }else{
        const input=document.getElementById('sb-scan-input');
        const v=input?input.value.trim():'';
        if(!v){showToast(tr('请输入运单号'));return;}
        const found=pool.find(function(o){return o.wb===v;});
        if(!found){showToast(tr('该运单不符合装袋规则或不存在'));if(input){input.value='';input.focus();}return;}
        if(used.indexOf(found.wb)>=0){showToast(tr('该运单已在袋中'));if(input){input.value='';input.focus();}return;}
        chosen=found;
    }
    const newWeight=st.items.reduce(function(a,o){return a+o.weight;},0)+chosen.weight;
    if(newWeight>r.maxWeight*1.2){showToast(tr('已超过最大限重 20%，无法继续添加'));return;}
    const dims=(chosen.size||'').split(/[×x]/).map(function(s){return parseFloat(s)||0;});
    const vol=(dims.length===3?(dims[0]*dims[1]*dims[2])/1000000:0)*chosen.qty;
    st.items.push(Object.assign({},chosen,{vol:vol}));
    const input=document.getElementById('sb-scan-input');if(input)input.value='';
    renderSortBagScanScreen();
}

function removeSortBagScanItem(idx){
    if(!_sortBagState||!_sortBagState.items)return;
    _sortBagState.items.splice(idx,1);
    renderSortBagScanScreen();
}

function finishSortBag(){
    const st=_sortBagState;
    if(!st||!st.rule||!st.items.length){showToast(tr('扫描列表为空，无法完成装袋'));return;}
    const r=st.rule;
    const totalQty=st.items.reduce(function(a,o){return a+o.qty;},0);
    const totalWeight=st.items.reduce(function(a,o){return a+o.weight;},0);
    const totalVol=st.items.reduce(function(a,o){return a+(o.vol||0);},0);
    const sizes=st.items.map(function(o){return (o.size||'').split(/[×x]/).map(function(s){return parseFloat(s)||0;});}).filter(function(a){return a.length===3;});
    const maxL=sizes.length?Math.max.apply(null,sizes.map(function(s){return s[0];})):0;
    const maxW=sizes.length?Math.max.apply(null,sizes.map(function(s){return s[1];})):0;
    const maxH=sizes.length?Math.max.apply(null,sizes.map(function(s){return s[2];})):0;
    const bagSize=maxL&&maxW&&maxH?(Math.round(maxL)+'×'+Math.round(maxW)+'×'+Math.round(maxH)):'-';
    const now=new Date();
    const pad=function(n){return String(n).padStart(2,'0');};
    const ts=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+' '+pad(now.getHours())+':'+pad(now.getMinutes());
    const status=r.printLabel?'已打印':'已完成';
    const newRow=[st.bagNo,String(totalQty),bagSize,totalWeight.toFixed(2),totalVol.toFixed(3),r.country,r.transport,r.category,r.warehouse,String(r.maxWeight),ts,'当前操作员',status];
    if(TC[st.id]&&TC[st.id].d)TC[st.id].d.unshift(newRow);
    showToast(r.printLabel?(tr('已完成装袋并打印袋标签')+'：'+st.bagNo):(tr('已完成装袋')+'：'+st.bagNo));
    _sortBagState={id:st.id,rule:r,bagNo:nextSortBagNo(),items:[],scanInput:''};
    renderSortBagScanScreen();
}

/* ========== 编码规则管理 ========== */
function openCodingRuleEditModal(id,rowIdx){
    let idx=rowIdx;
    if(idx===undefined||idx===null){
        const sel=getSelectedRowIndices();
        if(sel.length===0){showToast(tr('请先勾选一条编码规则'));return;}
        if(sel.length>1){showToast(tr('请仅勾选一条编码规则'));return;}
        idx=sel[0];
    }
    const row=(TC[id]&&TC[id].d[idx])||[];
    const headers=(TC[id]&&TC[id].h)||[];
    const get=function(name){const i=headers.indexOf(name);return i>=0?(row[i]||''):'';};
    const ruleNo=get('规则编号');
    const prefixType=get('前缀类型');
    const prefixParam=get('前缀参数');
    const suffixType=get('后缀类型');
    const suffixParam=get('后缀参数');
    const genRule=get('生成规则');
    const ruleLength=get('规则长度');
    const ignoreNum=get('忽略数字');
    const typeOpts=[{v:'',l:'(空)'},{v:'fixed',l:'固定值（fixed）'},{v:'date',l:'日期（date）'}];
    const resetOpts=[{v:'',l:'请选择重置标识'},{v:'day',l:'每天重置'},{v:'month',l:'每月重置'},{v:'year',l:'每年重置'},{v:'never',l:'不重置'}];
    function selHtml(eid,opts,val){
        let s='<select id="'+eid+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white">';
        opts.forEach(function(o){s+='<option value="'+esc(o.v)+'"'+(val===o.v?' selected':'')+'>'+esc(tr(o.l))+'</option>';});
        s+='</select>';
        return s;
    }
    function inputHtml(eid,val,placeholder){
        return '<input id="'+eid+'" type="text" value="'+esc(val||'')+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+esc(tr(placeholder||''))+'">';
    }
    function fieldHtml(label,inner){
        return '<div><label class="block text-sm font-medium text-text-secondary mb-1.5">'+tr(label)+'</label>'+inner+'</div>';
    }
    let h='<div class="space-y-4">';
    h+='<div class="flex items-center gap-2"><div class="w-1 h-4 bg-primary-600 rounded-sm"></div><div class="text-sm font-semibold text-primary-600">'+tr('基本信息')+'</div></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
    h+=fieldHtml('前缀类型',selHtml('cr-prefix-type',typeOpts,prefixType));
    h+=fieldHtml('前缀参数',inputHtml('cr-prefix-param',prefixParam,'请输入前缀参数'));
    h+=fieldHtml('后缀类型',selHtml('cr-suffix-type',typeOpts,suffixType));
    h+=fieldHtml('后缀参数',inputHtml('cr-suffix-param',suffixParam,'请输入后缀参数'));
    h+=fieldHtml('生成规则',inputHtml('cr-gen-rule',genRule,'如 %p%n / %p%s%n / %p-%n'));
    h+=fieldHtml('规则长度',inputHtml('cr-rule-length',ruleLength,''));
    h+=fieldHtml('忽略数字',inputHtml('cr-ignore-num',ignoreNum,'请输入忽略数字'));
    h+=fieldHtml('重置标识',selHtml('cr-reset-flag',resetOpts,''));
    h+='</div>';
    h+='</div>';
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('编辑数据')+(ruleNo?' - '+esc(ruleNo):'');
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="saveCodingRuleEdit(\''+id+'\','+idx+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确定')+'</button><button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function saveCodingRuleEdit(id,idx){
    const headers=(TC[id]&&TC[id].h)||[];
    const row=TC[id]&&TC[id].d?TC[id].d[idx]:null;
    if(!row){closeCrudModal();return;}
    const setVal=function(name,val){const i=headers.indexOf(name);if(i>=0)row[i]=val;};
    setVal('前缀类型',(document.getElementById('cr-prefix-type')||{}).value||'');
    setVal('前缀参数',(document.getElementById('cr-prefix-param')||{}).value||'');
    setVal('后缀类型',(document.getElementById('cr-suffix-type')||{}).value||'');
    setVal('后缀参数',(document.getElementById('cr-suffix-param')||{}).value||'');
    setVal('生成规则',(document.getElementById('cr-gen-rule')||{}).value||'');
    setVal('规则长度',(document.getElementById('cr-rule-length')||{}).value||'');
    setVal('忽略数字',(document.getElementById('cr-ignore-num')||{}).value||'');
    closeCrudModal();
    showToast(tr('已保存编码规则')+'：'+(row[headers.indexOf('规则编号')]||''));
    try{if(typeof navigateToTab==='function')navigateToTab('biz-cfg','cfg-coding-rule');}catch(e){}
}

