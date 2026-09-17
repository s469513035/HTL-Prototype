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
/* 发送记录：账单发出去才有发送人/发送时间，没发过的两列留空。
 * 收款走独立维度：recv=已收金额 / paySt=收款状态(未收款/部分收款/已收款)，
 * 与核销（used/unused/st）分开 —— 收款是钱进来了，核销是对账勾掉，两件事。 */
(function(){
    var sent={'RB2606140001':['张财务','2026-06-14 15:02:11'],
              'RB2605240002':['张财务','2026-05-24 09:31:40'],
              'RB2605240001':['张财务','2026-05-24 09:31:40']};
    /* 已收金额种子：几笔演示不同收款状态（已收款/部分收款/未收款） */
    var recv={'RB2606140001':'1200','RB2605240002':'880','RB2605240001':'300'};
    _arBillSeed.forEach(function(b){
        var s=sent[b.bn]||['',''];
        b.sender=s[0];b.sentAt=s[1];
        var r=parseFloat(recv[b.bn]||'0')||0;
        b.recv=r.toFixed(2);
        b.paySt=r<=0?'未收款':(r>=parseFloat(b.amt)?'已收款':'部分收款');
    });
})();
var _arBillRows=_arBillSeed.slice();
function arBillRefreshPayState(b){
    var r=parseFloat(b.recv)||0;
    b.paySt=r<=0?'未收款':(r>=parseFloat(b.amt)?'已收款':'部分收款');
}

function _arBillV(id){return ((document.getElementById(id)||{}).value||'').trim();}

function _arBillFind(bn){ for(var i=0;i<_arBillRows.length;i++){ if(_arBillRows[i].bn===bn)return _arBillRows[i]; } return null; }

function renderArBillRows(){
    var bn=_arBillV('arbill-q-bn'),ba=_arBillV('arbill-q-batch'),cu=_arBillV('arbill-q-cust');
    var rows=_arBillRows.filter(function(b){
        return (!bn||String(b.bn).indexOf(bn)>=0)&&(!ba||String(b.batch).indexOf(ba)>=0)&&(!cu||String(b.cust).indexOf(cu)>=0);
    });
    if(!rows.length)return '<tr><td colspan="19" class="py-12 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
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
        /* 已收金额 + 收款状态：收款登记改的是这两个，与核销分开 */
        h+='<td class="px-3 py-2.5 whitespace-nowrap font-semibold text-emerald-600">'+esc(b.recv||'0.00')+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap">'+arStatusBadge(b.paySt||'未收款')+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.cyc)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.due)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap">'+arStatusBadge(b.st)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.rk||'')+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.src)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.ct)+'</td>';
        /* 没发过就明写「未发送」，留空会让人以为是数据缺失 */
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+(b.sender?esc(b.sender):'<span class="text-text-muted">'+tr('未发送')+'</span>')+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+(b.sentAt?esc(b.sentAt):'<span class="text-text-muted">—</span>')+'</td>';
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
/* ===== 发送账单 =====
 * 勾选（可多选）→ 弹窗确认 → 写入发送人与发送时间。
 * 发送是对外动作，所以先给一个能看清「发给谁、发哪几笔、有没有重发」的确认窗，
 * 而不是点一下就发出去。已发过的不拦，但在窗里单独点出来，重发会覆盖原记录。 */
function arBillCurrentSender(){
    if(typeof DEMO_ACCOUNTS!=='undefined'&&typeof _currentAccount!=='undefined'){
        var a=DEMO_ACCOUNTS.filter(function(x){return x.id===_currentAccount;})[0];
        if(a&&a.name)return a.name;
    }
    return '系统管理员';
}
function arBillNowText(){
    if(typeof nowDateTimeLocalSeconds==='function')return nowDateTimeLocalSeconds().replace('T',' ');
    var d=new Date(),p=function(n){return String(n).padStart(2,'0');};
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
}
var _arBillSendCtx={bns:[],sender:'',at:''};
function openArBillSendModal(){
    var bns=arBillCheckedBns();
    if(!bns.length){ showToast(tr('请先勾选要发送的账单')); return; }
    var targets=bns.map(_arBillFind).filter(Boolean);
    if(!targets.length){ showToast(tr('未找到所选账单')); return; }
    var resend=targets.filter(function(b){return !!b.sentAt;});
    var sender=arBillCurrentSender(),at=arBillNowText();
    _arBillSendCtx={bns:targets.map(function(b){return b.bn;}),sender:sender,at:at};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('发送账单');
    var ro='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary';
    var h='<div class="space-y-5">';
    h+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 text-sm text-text-secondary">'+
       tr('本次将发送')+'：<span class="font-semibold text-text-primary">'+targets.length+'</span> '+tr('笔账单')+
       '，'+tr('发送后将记录发送人与发送时间。')+'</div>';
    if(resend.length){
        h+='<div class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">'+
           tr('其中')+' <span class="font-semibold">'+resend.length+'</span> '+tr('笔已发送过')+'（'+esc(resend.slice(0,3).map(function(b){return b.bn;}).join('、'))+(resend.length>3?'…':'')+'），'+
           tr('确认后按本次发送记录覆盖。')+'</div>';
    }
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('发送人')+'</label><input readonly value="'+esc(_arBillSendCtx.sender)+'" class="'+ro+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('发送时间')+'</label><input readonly value="'+esc(_arBillSendCtx.at)+'" class="'+ro+'"></div>';
    h+='</div>';
    /* 明细表：让人在点确认前看清到底发的是哪几笔、发给哪些客户 */
    h+='<div><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-amber-400 rounded-full"></span><span class="text-sm font-semibold text-text-primary">'+tr('发送明细')+'</span></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto" style="max-height:320px"><table class="w-full text-sm"><thead class="sticky top-0"><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-2.5 text-left font-semibold" style="width:48px">#</th>';
    ['应收账单号','客户名称','币别','金额(原币)','账单到期时间','发送状态'].forEach(function(c){h+='<th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody>';
    targets.forEach(function(b,i){
        h+='<tr class="border-t border-surface-100">';
        h+='<td class="px-3 py-2.5 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap font-medium text-primary-700">'+esc(b.bn)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.cust)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.cur)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-700">'+esc(b.amt)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(b.due)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap">'+(b.sentAt
            ?'<span class="badge bg-amber-100 text-amber-700">'+tr('重发')+'</span> <span class="text-xs text-text-muted">'+esc(b.sentAt)+'</span>'
            :'<span class="badge bg-blue-100 text-blue-700">'+tr('首次发送')+'</span>')+'</td>';
        h+='</tr>';
    });
    h+='</tbody></table></div></div>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmArBillSend()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认发送')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function confirmArBillSend(){
    var ctx=_arBillSendCtx||{};
    var bns=ctx.bns||[];
    if(!bns.length){ showToast(tr('没有可发送的账单')); return; }
    var n=0;
    bns.forEach(function(bn){
        var b=_arBillFind(bn);
        if(!b)return;
        b.sender=ctx.sender;b.sentAt=ctx.at;n++;
    });
    closeCrudModal();
    renderArBillTable();
    showToast(tr('已发送')+' '+n+' '+tr('笔账单')+'，'+tr('发送人')+'：'+ctx.sender);
}

/* ===== 登记收款 =====
 * 只对单条账单操作（多选时取第一条并提示）：登记收款人侧信息 ——
 * 客户（默认带出）、收款金额（默认待核销余额）、币别（默认账单币别）、
 * 交割方式、收款备注。确认后把已核销金额抬到金额、状态改「全部核销」。
 * 「等级收款」按需求原文命名，即对选中这一笔做收款登记。 */
var AR_SETTLE_STYLES=['银行转账','现金','支票','在线支付','信用证'];
function openArBillReceiveModal(){
    var bns=arBillCheckedBns();
    if(!bns.length){ showToast(tr('请先勾选要收款的账单')); return; }
    if(bns.length>1){ showToast(tr('收款只能对单条账单操作')+'，'+tr('已自动选中第一条')+'：'+bns[0]); }
    var b=_arBillFind(bns[0]);
    if(!b){ showToast(tr('未找到账单')); return; }
    if(b.st==='作废'){ showToast(tr('已作废的账单不能收款')); return; }
    if(b.paySt==='已收款'){ showToast(tr('该账单已全额收款，无需再登记')); return; }
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='58%';
    document.getElementById('crud-modal-title').textContent=tr('登记收款')+' - '+b.bn;
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    var h='<div class="space-y-4">';
    /* 账单概要：收款前先看清是哪笔、还差多少（按收款维度，不是核销维度） */
    var outstanding=Math.max(0,(parseFloat(b.amt)||0)-(parseFloat(b.recv)||0)).toFixed(2);
    h+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">';
    h+='<div><span class="text-xs text-text-muted block">'+tr('应收账单号')+'</span><span class="font-medium text-text-primary">'+esc(b.bn)+'</span></div>';
    h+='<div><span class="text-xs text-text-muted block">'+tr('账单金额')+'</span><span class="font-semibold text-blue-700">'+esc(b.amt)+' '+esc(b.cur)+'</span></div>';
    h+='<div><span class="text-xs text-text-muted block">'+tr('已收金额')+'</span><span class="text-emerald-600">'+esc(b.recv||'0.00')+'</span></div>';
    h+='<div><span class="text-xs text-text-muted block">'+tr('待收金额')+'</span><span class="font-semibold text-green-600">'+outstanding+'</span></div>';
    h+='</div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('客户')+'<span class="text-red-500 ml-1">*</span></label><input id="arrecv-cust" value="'+esc(b.cust)+'" class="'+inCls+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('收款金额')+'<span class="text-red-500 ml-1">*</span></label><input id="arrecv-amt" type="number" min="0" step="0.01" value="'+esc(outstanding)+'" class="'+inCls+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('币别')+'</label><select id="arrecv-cur" class="'+inCls+'">'+['人民币','美金','欧元','西法'].map(function(o){return '<option'+(o===b.cur?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('交割方式')+'</label><select id="arrecv-style" class="'+inCls+'">'+AR_SETTLE_STYLES.map(function(o){return '<option>'+esc(o)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary">'+tr('收款备注')+'</label><textarea id="arrecv-remark" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+tr('请输入收款备注')+'"></textarea></div>';
    h+='</div></div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmArBillReceive()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认收款')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function confirmArBillReceive(){
    var bn=String((document.getElementById('crud-modal-title').textContent||'').split(' - ').pop()||'');
    var b=_arBillFind(bn);
    if(!b){ showToast(tr('未找到账单')); return; }
    var cust=_arBillV('arrecv-cust');
    var amt=parseFloat(_arBillV('arrecv-amt'));
    if(!cust){ showToast(tr('请填写客户')); return; }
    if(!amt||amt<=0){ showToast(tr('请填写收款金额')); return; }
    var outstanding=Math.max(0,(parseFloat(b.amt)||0)-(parseFloat(b.recv)||0));
    if(amt>outstanding+1e-9){ showToast(tr('收款金额不能超过待收金额')); return; }
    /* 只动收款维度：已收金额累加、收款状态推进；核销(used/unused/st)不动 */
    b.recv=((parseFloat(b.recv)||0)+amt).toFixed(2);
    arBillRefreshPayState(b);
    var remark=_arBillV('arrecv-remark');
    if(remark)b.rk=remark;
    var rest=Math.max(0,parseFloat(b.amt)-parseFloat(b.recv)).toFixed(2);
    closeCrudModal();
    renderArBillTable();
    showToast(tr('收款登记成功')+'：'+b.bn+' '+amt+' '+_arBillV('arrecv-cur')+'（'+tr('剩余待收')+' '+rest+'，'+tr('收款状态')+'：'+b.paySt+'）');
}

/* ===== 放行 =====
 * 批量勾选，放行「同客户 + 已收款 或 已核销(全部核销)」的账单 —— 两条路都通向钱货两清。
 * 弹窗参考提货预约管理新增的三段式（窄版 72%）：条件(客户锁死) → 订单明细(勾运单+子单级部分放行)
 * → 提货单信息(提货方式/派送费/地址/提货人四件套，对齐提货预约新增)，
 * 确认后写 提货预约单(ow-pickup, 待放货) 并自动放行产生 放货单(ow-outbound, 待出库)。 */
var _arReleaseCtx={cust:'',bns:[],orders:[],subs:{}};
/* 满足放行条件的订单（运单）明细：实际从所选账单的 fees 展开而来，
 * 一笔费用一张运单，每个运单按 pcs 生成子单（一个子单=一件）—— 子单级部分放行的粒度 */
function _arReleaseOrders(bills){
    var out=[];
    bills.forEach(function(b){
        (b.fees||[]).forEach(function(f){
            var pcs=2;
            var subs=[];
            for(var k=1;k<=pcs;k++)subs.push({sub:f.wb+'-'+String(k).padStart(2,'0'),l:'45',w:'35',ht:'30',wt:(12.5).toFixed(1),vol:'0.050'});
            var o={wb:f.wb,bl:b.batch,cust:b.cust,name:(f.fee==='运费'?'服装配件':'普货'),cargo:'普货',pcs:pcs,wt:(25.0).toFixed(1),vol:'0.100',subs:subs};
            out.push(o);
        });
        if(!(b.fees||[]).length){
            var subs2=[{sub:'HT-'+b.bn+'-01',l:'45',w:'35',ht:'30',wt:'12.0',vol:'0.050'}];
            out.push({wb:'HT-'+b.bn,bl:b.batch,cust:b.cust,name:'普货',cargo:'普货',pcs:1,wt:'12.0',vol:'0.050',subs:subs2});
        }
    });
    return out;
}
function openArBillReleaseModal(){
    var bns=arBillCheckedBns();
    if(!bns.length){ showToast(tr('请先勾选要放行的账单')); return; }
    var targets=bns.map(_arBillFind).filter(Boolean);
    /* 硬条件：同客户；收款状态=已收款 或 核销状态=全部核销（满足其一即可）。
     * 不满足的直接报清楚，不静默跳过 —— 放货是硬闸 */
    var custs=[];
    targets.forEach(function(b){ if(custs.indexOf(b.cust)<0)custs.push(b.cust); });
    if(custs.length>1){ showToast(tr('放行仅支持同一客户的账单')+'（'+tr('所选包含')+' '+custs.length+' '+tr('个客户')+'：'+custs.join('、')+'）'); return; }
    var notEligible=targets.filter(function(b){ return b.paySt!=='已收款'&&b.st!=='全部核销'; });
    if(notEligible.length){ showToast(tr('仅「已收款」或「已核销」的账单可放行')+'，'+tr('所选中有')+' '+notEligible.length+' '+tr('笔未收款且未核销')); return; }
    var cust=custs[0];
    var orders=_arReleaseOrders(targets);
    /* 子单选择状态：默认全选（整单放行），点「子单选择」可改成部分放行 */
    var subs={};
    orders.forEach(function(o,i){ subs[i]=o.subs.map(function(_,si){return si;}); });
    _arReleaseCtx={cust:cust,bns:targets.map(function(b){return b.bn;}),orders:orders,subs:subs};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('放行')+' - '+cust;
    var h='<div class="space-y-5">';
    /* ① 放行条件（客户锁死；目的仓库由提货预约侧维护，这里不再重复选择） */
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-amber-400 rounded-full"></span><span class="text-sm font-semibold text-text-primary">'+tr('① 放行条件（客户不可修改）')+'</span></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('客户')+'</label><input type="text" readonly value="'+esc(cust)+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('本次放行账单')+'</label><input type="text" readonly value="'+targets.length+' '+tr('笔')+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('放行总金额')+'</label><input type="text" readonly value="'+targets.reduce(function(a,b){return a+(parseFloat(b.amt)||0);},0).toFixed(2)+' '+targets[0].cur+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary"></div>';
    h+='</div>';
    /* 账单清单：这次放行对应哪几笔 */
    h+='<div class="mt-3 border border-surface-200 rounded-lg overflow-auto" style="max-height:150px"><table class="w-full text-sm"><thead class="sticky top-0"><tr class="bg-[#EFF6FF] text-text-secondary"><th class="px-3 py-2 text-left font-semibold">#</th>'+['应收账单号','金额(原币)','收款状态','核销状态'].map(function(c){return '<th class="px-3 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';}).join('')+'</tr></thead><tbody>';
    targets.forEach(function(b,i){
        h+='<tr class="border-t border-surface-100"><td class="px-3 py-2 text-text-muted">'+(i+1)+'</td><td class="px-3 py-2 font-medium text-primary-700">'+esc(b.bn)+'</td><td class="px-3 py-2 text-blue-700 font-semibold">'+esc(b.amt)+'</td><td class="px-3 py-2">'+esc(b.paySt)+'</td><td class="px-3 py-2">'+esc(b.st)+'</td></tr>';
    });
    h+='</tbody></table></div>';
    h+='</section>';
    /* ② 订单明细（勾运单 + 子单选择支持部分放行） */
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-amber-400 rounded-full"></span><span class="text-sm font-semibold text-text-primary">'+tr('② 订单明细（勾选订单并选择子单，支持部分放行）')+'</span></div>';
    h+=arRelOrderTableHtml(orders,subs);
    h+='<div class="mt-2" id="arrel-summary"></div>';
    h+='</section>';
    /* ③ 提货单信息（字段对齐提货预约新增：提货方式/预约时段/派送费/派送地址/提货人四件套） */
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-amber-400 rounded-full"></span><span class="text-sm font-semibold text-text-primary">'+tr('③ 提货单信息（确认后自动放行，产生放货单）')+'</span></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-4 gap-4">';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary">'+tr('提货方式')+'<span class="text-red-500 ml-1">*</span></label><div class="flex items-center gap-6 h-9">'+
        '<label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="arrel-pickup" value="上门提货" checked onchange="arRelTogglePickupType()" class="accent-primary-600">'+tr('上门提货')+'</label>'+
        '<label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="arrel-pickup" value="派送" onchange="arRelTogglePickupType()" class="accent-primary-600">'+tr('派送')+'</label></div></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('预约时段')+'</label><select id="arrel-slot" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white">'+['09:00','10:00','11:00','14:00','15:00'].map(function(o){return '<option>'+o+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('派送费(USD)')+'<span class="text-red-500 ml-1 arrel-fee-star">*</span></label><input id="arrel-fee" type="number" min="0" step="0.01" disabled class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary" placeholder="'+tr('派送方式必填')+'"></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary">'+tr('提货人姓名')+'</label><input id="arrel-picker" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+tr('提货人/收货人')+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('提货人电话')+'</label><input id="arrel-phone" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+tr('联系电话')+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('证件号')+'</label><input id="arrel-id" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+tr('身份证/证件号')+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('车牌号')+'</label><input id="arrel-plate" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+tr('上门提货车牌')+'"></div>';
    h+='<div id="arrel-addr-wrap" class="hidden flex-col gap-1.5 md:col-span-4"><label class="text-sm font-medium text-text-secondary">'+tr('派送地址')+'<span class="text-red-500 ml-1">*</span></label><input id="arrel-addr" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+tr('派送方式填写收货地址')+'"></div>';
    h+='</div>';
    h+='<div class="mt-3 text-xs text-text-muted">'+tr('确认放行后：生成提货预约单（待放货）并自动放行，产生放货单（待出库），可在海外仓作业中跟踪。')+'</div>';
    h+='</section>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmArBillRelease()" class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer">'+tr('确认放行')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
    arRelRenderSummary();
}
/* 订单明细表（可整表重画）：勾运单 + 子单选择 + 已选件数。 */
function arRelOrderTableHtml(orders,subs){
    var h='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="sticky top-0"><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-2 w-10 text-center"><input type="checkbox" onchange="arRelToggleAll(this)"></th>';
    ['运单号','账单批次号','品名','货物类型','总件数','重量(KG)','体积(CBM)','已选件数','子单选择'].forEach(function(c){h+='<th class="px-3 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody>';
    orders.forEach(function(o,i){
        var sel=(subs&&subs[i])||[];
        h+='<tr class="border-t border-surface-100">';
        h+='<td class="px-3 py-2 text-center"><input type="checkbox" class="arrel-order-chk" data-idx="'+i+'" checked onchange="arRelOrderCheck('+i+',this)"></td>';
        h+='<td class="px-3 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(o.wb)+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(o.bl)+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(o.name)+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(o.cargo)+'</td>';
        h+='<td class="px-3 py-2 font-medium">'+o.pcs+'</td>';
        h+='<td class="px-3 py-2">'+esc(o.wt)+'</td>';
        h+='<td class="px-3 py-2">'+esc(o.vol)+'</td>';
        h+='<td class="px-3 py-2"><span id="arrel-selpcs-'+i+'" class="font-semibold text-primary-700">'+sel.length+'</span> / '+o.pcs+'</td>';
        h+='<td class="px-3 py-2"><a class="text-primary-600 hover:text-primary-700 cursor-pointer" onclick="openArRelSubSelect('+i+')">'+tr('子单选择')+'</a></td>';
        h+='</tr>';
    });
    h+='</tbody></table></div>';
    return h;
}
function arRelToggleAll(box){
    document.querySelectorAll('.arrel-order-chk').forEach(function(c){c.checked=box.checked;});
    arRelRenderSummary();
}
function arRelOrderCheck(i,box){
    /* 勾=恢复全选子单，取消=清空子单（与提货预约新增的勾选语义一致） */
    _arReleaseCtx.subs[i]=box.checked?_arReleaseCtx.orders[i].subs.map(function(_,si){return si;}):[];
    var el=document.getElementById('arrel-selpcs-'+i);
    if(el)el.textContent=String(_arReleaseCtx.subs[i].length);
    arRelRenderSummary();
}
function arRelTogglePickupType(){
    var radios=document.getElementsByName('arrel-pickup');
    var val='上门提货';
    for(var i=0;i<radios.length;i++){ if(radios[i].checked)val=radios[i].value; }
    var show=val==='派送';
    var fee=document.getElementById('arrel-fee');
    if(fee){fee.disabled=!show;fee.classList.toggle('bg-surface-100',!show);fee.classList.toggle('text-text-secondary',!show);fee.classList.toggle('bg-white',show);}
    var addrWrap=document.getElementById('arrel-addr-wrap');
    if(addrWrap){addrWrap.classList.toggle('hidden',!show);addrWrap.classList.toggle('flex',show);}
}
/* 子单选择浮层（对齐提货预约新增的子单选择弹窗）：按子单勾选实现部分放行 */
function openArRelSubSelect(i){
    var w=_arReleaseCtx.orders[i];
    if(!w)return;
    var sel=_arReleaseCtx.subs[i]||[];
    var old=document.getElementById('arrel-subsel-modal');if(old)old.remove();
    var m=document.createElement('div');
    m.id='arrel-subsel-modal';
    m.className='fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4';
    var html='<div class="w-full max-w-4xl rounded-2xl bg-white shadow-xl overflow-hidden">';
    html+='<div class="flex items-center justify-between px-5 py-3 border-b border-surface-200"><div class="text-sm font-semibold text-text-primary">'+tr('子单选择')+' - '+esc(w.wb)+'（'+tr('已选')+' <span id="arrel-subsel-count">'+sel.length+'</span>/'+w.subs.length+'）</div><button type="button" onclick="closeArRelSubSelect()" class="w-8 h-8 rounded-full bg-surface-100 text-text-muted">×</button></div>';
    html+='<div class="p-4 max-h-[70vh] overflow-auto"><div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    html+='<th class="px-3 py-2 w-10 text-center"><input type="checkbox" id="arrel-subsel-all" onclick="arRelSubSelToggleAll(this)"></th>';
    ['#','子单号','长(CM)','宽(CM)','高(CM)','重量(KG)','体积(CBM)'].forEach(function(c){html+='<th class="px-3 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    html+='</tr></thead><tbody>';
    w.subs.forEach(function(s,si){
        var on=sel.indexOf(si)>=0;
        html+='<tr class="border-t border-surface-100"><td class="px-3 py-2 text-center"><input type="checkbox" class="arrel-subsel-chk" data-si="'+si+'"'+(on?' checked':'')+' onchange="arRelSubSelCount()"></td>'+
            '<td class="px-3 py-2 text-text-muted">'+(si+1)+'</td>'+
            '<td class="px-3 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(s.sub)+'</td>'+
            '<td class="px-3 py-2">'+esc(s.l)+'</td><td class="px-3 py-2">'+esc(s.w)+'</td><td class="px-3 py-2">'+esc(s.ht)+'</td>'+
            '<td class="px-3 py-2">'+esc(s.wt)+'</td><td class="px-3 py-2">'+esc(s.vol)+'</td></tr>';
    });
    html+='</tbody></table></div></div>';
    html+='<div class="flex justify-end gap-2 px-5 py-3 border-t border-surface-200"><button type="button" onclick="closeArRelSubSelect()" class="px-4 py-2 text-sm text-text-secondary border border-surface-200 rounded-lg cursor-pointer">'+tr('取消')+'</button><button type="button" onclick="confirmArRelSubSelect('+i+')" class="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg cursor-pointer">'+tr('确定')+'</button></div>';
    html+='</div>';
    m.innerHTML=html;
    document.body.appendChild(m);
}
function arRelSubSelToggleAll(box){
    document.querySelectorAll('#arrel-subsel-modal .arrel-subsel-chk').forEach(function(c){c.checked=box.checked;});
    arRelSubSelCount();
}
function arRelSubSelCount(){
    var n=document.querySelectorAll('#arrel-subsel-modal .arrel-subsel-chk:checked').length;
    var el=document.getElementById('arrel-subsel-count');
    if(el)el.textContent=String(n);
}
function closeArRelSubSelect(){var m=document.getElementById('arrel-subsel-modal');if(m)m.remove();}
function confirmArRelSubSelect(i){
    var sel=[];
    document.querySelectorAll('#arrel-subsel-modal .arrel-subsel-chk:checked').forEach(function(c){
        sel.push(parseInt(c.getAttribute('data-si'),10));
    });
    _arReleaseCtx.subs[i]=sel;
    closeArRelSubSelect();
    /* 勾选状态跟着子单走：一个没选视为取消勾运单 */
    var chk=document.querySelector('.arrel-order-chk[data-idx="'+i+'"]');
    if(chk)chk.checked=sel.length>0;
    var el=document.getElementById('arrel-selpcs-'+i);
    if(el)el.textContent=String(sel.length);
    arRelRenderSummary();
}
/* 取要放行的（订单, 选中子单）对：勾了运单且有选中子单才算数 */
function arRelPicked(){
    var out=[];
    document.querySelectorAll('.arrel-order-chk:checked').forEach(function(c){
        var raw=c.dataset?c.dataset.idx:(c.getAttribute?c.getAttribute('data-idx'):'0');
        var i=parseInt(raw,10);
        var o=_arReleaseCtx.orders[i];
        if(!o)return;
        var sel=(_arReleaseCtx.subs[i]||[]).map(function(si){return o.subs[si];}).filter(Boolean);
        if(!sel.length)return;
        out.push({order:o,subs:sel});
    });
    return out;
}
function arRelRenderSummary(){
    var el=document.getElementById('arrel-summary');
    if(!el)return;
    var picked=arRelPicked();
    var pcs=picked.reduce(function(a,p){return a+p.subs.length;},0);
    var partial=picked.filter(function(p){return p.subs.length<p.order.subs.length;}).length;
    el.innerHTML='<span class="text-xs text-text-secondary">'+tr('已选')+' <span class="font-semibold text-primary-700">'+picked.length+'</span> '+tr('个订单')+' / '+pcs+' '+tr('件')+
        (partial?('（'+partial+' '+tr('个订单部分放行')+'）'):'')+'</span>';
}
function confirmArBillRelease(){
    var ctx=_arReleaseCtx;
    var picked=arRelPicked();
    if(!picked.length){ showToast(tr('请勾选要放行的订单明细')); return; }
    var radios=document.getElementsByName('arrel-pickup');
    var pickup='上门提货';
    for(var i=0;i<radios.length;i++){ if(radios[i].checked)pickup=radios[i].value; }
    var fee=_arBillV('arrel-fee');
    var addr=_arBillV('arrel-addr');
    if(pickup==='派送'){
        if(!fee){ showToast(tr('派送方式请录入派送费')); return; }
        if(!addr){ showToast(tr('派送方式请填写派送地址')); return; }
    }
    var slot=_arBillV('arrel-slot');
    /* 件数/重量/体积按选中子单汇总 —— 部分放行时就只算放行的那部分 */
    var pcs=0,wt=0,vol=0;
    picked.forEach(function(p){
        p.subs.forEach(function(s){ pcs+=1; wt+=parseFloat(s.wt)||0; vol+=parseFloat(s.vol)||0; });
    });
    var seq=(TC['ow-pickup']&&TC['ow-pickup'].d.length||0)+1;
    var apptNo='DR-AR-'+String(Date.now()).slice(-6)+'-'+String(seq).padStart(2,'0');
    var doNo='DO-AR-'+String(Date.now()).slice(-6)+'-'+String(seq).padStart(2,'0');
    /* 目的仓库：账单侧不再选（本次已去掉），预约单先落待定，后续在提货预约侧维护 */
    var wh='待定';
    /* 提货预约单（待放货）——列序对齐 ow-pickup 表头 */
    if(TC['ow-pickup']){
        TC['ow-pickup'].d.unshift([apptNo,picked[0].order.bl||ctx.bns[0],ctx.bns[0],ctx.cust,wh,pickup,(pickup==='派送'?fee:'—'),String(pcs),wt.toFixed(1),'0.00',(pickup==='派送'?'未付款':'已付款'),slot?('2026-09-17 '+slot):'—','待放货']);
        if(typeof _listData!=='undefined'&&_listData['ow-pickup'])_listData['ow-pickup']=null;
    }
    /* 放货单（待出库）——列序对齐 ow-outbound 表头 */
    if(TC['ow-outbound']){
        TC['ow-outbound'].d.unshift([doNo,apptNo,picked[0].order.bl||ctx.bns[0],ctx.bns[0],ctx.cust,wh,pickup,String(pcs),'0','0/'+pcs,'待出库','—','—',wh]);
        if(typeof _listData!=='undefined'&&_listData['ow-outbound'])_listData['ow-outbound']=null;
    }
    var partial=picked.filter(function(p){return p.subs.length<p.order.subs.length;}).length;
    closeCrudModal();
    renderArBillTable();
    showToast(tr('放行成功')+'：'+tr('提货预约单')+' '+apptNo+'，'+tr('已自动放行并产生放货单')+' '+doNo+
        (partial?('（'+partial+' '+tr('个订单部分放行')+'）'):''));
}

/* 删除账单：仅「待核销」（未核销）账单可删除；删除后账单从列表移除，
   其关联的应收费用明细释放回未制单状态，可重新制单。 */
function arBillDeleteSelected(){
    var bns=arBillCheckedBns();
    if(!bns.length){ showToast(tr('请先勾选要删除的账单')); return; }
    var targets=bns.map(_arBillFind).filter(Boolean);
    var eligible=targets.filter(function(b){ return b.st==='待核销'&&(parseFloat(b.used)||0)===0; });
    var blocked=targets.filter(function(b){ return !(b.st==='待核销'&&(parseFloat(b.used)||0)===0); });
    if(!eligible.length){ showToast(tr('仅「待核销」状态的账单可删除')); return; }
    var msg='本次将删除 '+eligible.length+' 笔账单：'+eligible.map(function(b){return b.bn;}).join('、');
    if(blocked.length)msg+='；另有 '+blocked.length+' 笔非待核销状态将跳过';
    msg+='。删除账单后关联费用将释放，可以继续制单，确认删除？';
    openConfirmTip(msg,function(){
        var gone={};
        eligible.forEach(function(b){ gone[b.bn]=1; });
        _arBillRows=_arBillRows.filter(function(b){ return !gone[b.bn]; });
        arBillReleaseFees(gone);
        renderArBillTable();
        showToast(tr('已删除')+' '+eligible.length+' '+tr('笔账单')+'，'+tr('关联费用已释放'));
    });
}

/* 释放账单关联的应收费用明细：清掉制单标识与账单信息，使其可再次生成账单 */
function arBillReleaseFees(goneBns){
    if(typeof _arDetailRows==='undefined')return 0;
    var n=0;
    _arDetailRows.forEach(function(r){
        if(r.bn&&goneBns[r.bn]){
            r.bf='否'; r.bn=''; r.batch=''; r.due='';
            n++;
        }
    });
    if(typeof refreshArDetailView==='function'){
        var tb=document.getElementById('ar-detail-tbody');
        if(tb)refreshArDetailView();
    }
    return n;
}

function arBillFeeTableHtml(b){
    var fees=b.fees||[];
    var cols=['运单号','客户名称','业务员名称','费用名称','金额(原币)','币别'];
    var h='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead><tr class="bg-[#EFF6FF] text-text-secondary"><th class="px-3 py-2.5 text-left font-semibold" style="width:48px">#</th>';
    cols.forEach(function(c){h+='<th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!fees.length){h+='<tr><td colspan="'+(cols.length+1)+'" class="py-8 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';}
    fees.forEach(function(f,i){
        h+='<tr class="border-t border-surface-100 hover:bg-primary-50/30">';
        h+='<td class="px-3 py-2.5 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-primary-700">'+esc(f.wb)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(f.cust)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(f.sales)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(f.fee)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-700">'+esc(f.amt)+'</td>';
        h+='<td class="px-3 py-2.5 whitespace-nowrap text-text-secondary">'+esc(f.cur)+'</td>';
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
    h+=fld('币别',b.cur)+fld('金额（原币）',b.amt)+fld('账单结算周期',b.cyc);
    h+=fld('账单到期时间',b.due)+fld('账单创建时间',b.ct);
    h+=fld('已收金额',b.recv||'0.00')+fld('收款状态',b.paySt||'未收款');
    /* 发送记录：没发过就写「未发送」，空输入框看不出是没发还是没取到 */
    h+=fld('发送人',b.sender||tr('未发送'))+fld('发送时间',b.sentAt||tr('未发送'));
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
    h+='<button onclick="openArBillSendModal()" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('发送账单')+'</button>';
    h+='<button onclick="openArBillReceiveModal()" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('收款')+'</button>';
    h+='<button onclick="openArBillReleaseModal()" class="h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer">'+tr('放行')+'</button>';
    /* 「下载账单」按钮已隐藏（arBillDownloadSelected 保留备用） */
    h+='<button onclick="arBillDeleteSelected()" class="h-9 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer">'+tr('删除')+'</button>';
    h+='</div></div>';
    h+='<div class="flex-1 overflow-auto p-4"><div class="bg-white rounded-xl border border-surface-200 overflow-auto"><table class="w-full text-sm" style="min-width:2300px;border-collapse:separate;border-spacing:0"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-3 text-left font-semibold" style="width:40px">#</th><th class="px-3 py-3 text-left font-semibold" style="width:40px"><input type="checkbox" onchange="document.querySelectorAll(\'.arbill-check\').forEach(function(c){c.checked=this.checked;}.bind(this))"></th>';
    ['应收账单号','账单批次号','客户名称','币别','金额(原币)','已核销金额','待核销金额','已收金额','收款状态','结算周期','账单到期时间','核销状态','备注','数据来源','创建时间','发送人','发送时间'].forEach(function(c){h+='<th class="px-3 py-3 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody id="arbill-tbody">'+renderArBillRows()+'</tbody></table></div></div>';
    h+='</div>';
    return h;
}
