/* =========================================================
 * 单票利润分析表 fcl-profit（整柜财务）
 *
 * 一行 = 一张委托单。收入侧取「应收费用明细 fcl-ar-fee」，成本侧取
 * 「代理成本明细」分摊到委托单的结果（_FCL_COST_ALLOC），两边都带上核销进度，
 * 相减得毛利。行内「查看明细」把这张委托单的应收行与应付行原样摊开。
 *
 * 这张表不存数据 —— 每次渲染前由 fclProfitRefresh() 从上面两个源重算（beforeRender 钩子）。
 * 存一份的话，应收那边一核销、成本那边一分摊，这里立刻就是旧数，
 * 而利润表恰恰是最不能显示旧数的那张。
 *
 * 币别：一张委托单常常 USD 收、USD+CNY 付，不折算就没有「这票赚了多少」这个数。
 * 所以列表统一折成本位币 CNY，原币金额留在查看明细里，折算率也写在弹窗上。
 * ========================================================= */

/* 折算率：原型阶段固定，与散货应收明细里的 美元=7 对齐。
 * 正式版应改成取「财务结算 → 汇率管理」里当期生效的那条。 */
var FCL_PROFIT_FX={'CNY':1,'人民币':1,'USD':7,'美元':7,'EUR':7.8,'欧元':7.8};
function fclFx(cur){
    var r=FCL_PROFIT_FX[String(cur||'').trim()];
    return (typeof r==='number'&&r>0)?r:1;
}
function fclToCny(amt,cur){return +(((+amt)||0)*fclFx(cur)).toFixed(2);}
/* 薄利线：毛利率低于这个数还是正的，单独归一档提醒业务 */
var FCL_PROFIT_THIN_RATE=15;

addPrototypeTable('fcl-profit','单票利润分析表',
    '委托单号|客户名称|业务员|关联Job|业务类型|涉及币别|应收总金额(CNY)|已收金额(CNY)|未收金额(CNY)|收款核销情况|应付总金额(CNY)|已付金额(CNY)|未付金额(CNY)|付款核销情况|利润(CNY)|利润率|成本完整性|利润状态|操作',
    ['盈利','薄利','亏损'],[],[
    {label:'委托单号',type:'text'},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'关联Job',type:'text'},
    {label:'业务类型',type:'select',options:['整柜','自由散货拼箱']},
    {label:'收款核销情况',type:'select',options:['无应收','待核销','部分核销','全部核销']},
    {label:'付款核销情况',type:'select',options:['无应付','待付款','部分付款','已付清']},
    {label:'成本完整性',type:'select',options:['完整','有未分摊']},
    {label:'利润状态',type:'select',options:['盈利','薄利','亏损']}
]);
/* 数据每次渲染重算，不做 200 行填充、不补审计列、不手工改 */
TC['fcl-profit'].noExpand=true;
TC['fcl-profit'].noAutoAudit=true;
TC['fcl-profit'].rowKeyCols=['委托单号'];
/* 渲染前重算（引擎在 generateListPage 里按函数名调用） */
TC['fcl-profit'].beforeRender='fclProfitRefresh';

/* ---------- 取数 ---------- */
/* 某张委托单的应收行（排除已作废） */
function fclProfitArOf(entrust){
    var c=TC['fcl-ar-fee'];
    if(!c||!c.d)return [];
    var h=c.h||[];
    var iNo=h.indexOf('流水号'),iE=h.indexOf('委托单号'),iC=h.indexOf('客户名称'),
        iS=h.indexOf('业务员'),iA=h.indexOf('费用科目'),iCur=h.indexOf('币别'),
        iAmt=h.indexOf('应收金额'),iGot=h.indexOf('已收金额'),iDue=h.indexOf('未收金额'),
        iSt=h.indexOf('费用确认状态');
    return c.d.filter(function(r){
        return String(r[iE]||'')===entrust&&String(r[iSt]||'')!=='已作废';
    }).map(function(r){
        var cur=String(r[iCur]||'');
        return {no:String(r[iNo]||''),cust:String(r[iC]||''),sales:String(r[iS]||''),
            acct:String(r[iA]||''),cur:cur,
            amt:fclParseMoney(r[iAmt])||0,got:fclParseMoney(r[iGot])||0,due:fclParseMoney(r[iDue])||0,
            st:String(r[iSt]||'')};
    });
}
/* 付款进度：成本行挂在哪张付款单上，就按那张单的已付比例算这一行付了多少。
 * 付款是按付款单整单执行的，落不到单条费用上，比例分摊是原型阶段最讲得通的口径。 */
function fclProfitPayRatio(apNo){
    if(!apNo)return 0;
    var c=TC['fcl-ap-bill'];
    if(!c||!c.d)return 0;
    var h=c.h||[],iNo=h.indexOf('付款单号'),iAmt=h.indexOf('应付金额'),iPaid=h.indexOf('已付金额');
    var row=c.d.filter(function(r){return String(r[iNo]||'')===apNo;})[0];
    if(!row)return 0;
    var amt=fclParseMoney(row[iAmt])||0,paid=fclParseMoney(row[iPaid])||0;
    if(amt<=0)return 0;
    return Math.min(1,paid/amt);
}
/* 全部「已分摊到委托单」的成本行，按委托单归堆。
 * mode='fcl' 时分摊结果的 key 就是委托单；mode='lcl' 时 key 是散货订单，
 * 归属的委托单记在 entrust 上，这里把该委托单底下各票订单的金额加回去。 */
function fclProfitApIndex(){
    var idx={},c=TC['fcl-agent-cost'];
    if(!c||!c.d)return idx;
    var h=c.h||[];
    var iNo=h.indexOf('流水号'),iJob=h.indexOf('Job No'),iProv=h.indexOf('服务商'),
        iFee=h.indexOf('费用名称'),iCur=h.indexOf('币别'),iAp=h.indexOf('付款单号'),
        iSt=h.indexOf('成本状态');
    c.d.forEach(function(r){
        var no=String(r[iNo]||'');
        if(String(r[iSt]||'')==='已作废')return;
        var alloc=(typeof fclCostAllocOf==='function')?fclCostAllocOf(no):null;
        if(!alloc||!alloc.rows||!alloc.rows.length)return;
        var cur=String(r[iCur]||''),apNo=String(r[iAp]||'');
        var ratio=fclProfitPayRatio(apNo);
        if(alloc.mode==='lcl'){
            var ent=String(alloc.entrust||'');
            if(!ent)return;
            var sum=alloc.rows.reduce(function(s,x){return s+((+x.amt)||0);},0);
            (idx[ent]=idx[ent]||[]).push({no:no,job:String(r[iJob]||''),prov:String(r[iProv]||''),
                fee:String(r[iFee]||''),cur:cur,amt:+sum.toFixed(2),apNo:apNo,ratio:ratio,
                note:alloc.rows.length+' 票散货订单合计'});
        }else{
            alloc.rows.forEach(function(x){
                var ent=String(x.key||'');
                if(!ent)return;
                (idx[ent]=idx[ent]||[]).push({no:no,job:String(r[iJob]||''),prov:String(r[iProv]||''),
                    fee:String(r[iFee]||''),cur:cur,amt:+((+x.amt)||0).toFixed(2),apNo:apNo,ratio:ratio,
                    cust:String(x.cust||''),note:''});
            });
        }
    });
    return idx;
}
/* 这个 Job 下还有没有没分摊掉的成本 —— 有的话这票的成本就还不完整，
 * 利润率会虚高，必须在表上说清楚，不能让人照着一个偏乐观的数去谈价。 */
function fclProfitJobHasUnalloc(job){
    var c=TC['fcl-agent-cost'];
    if(!c||!c.d||!job)return false;
    var h=c.h||[],iJob=h.indexOf('Job No'),iNo=h.indexOf('流水号'),iSt=h.indexOf('成本状态');
    return c.d.some(function(r){
        if(String(r[iJob]||'')!==job)return false;
        if(String(r[iSt]||'')==='已作废')return false;
        var a=(typeof fclCostAllocOf==='function')?fclCostAllocOf(String(r[iNo]||'')):null;
        return !a||!a.rows||!a.rows.length;
    });
}
/* 委托单 -> Job：柜内票清单是权威来源，查不到就退回成本行上记的 Job */
function fclProfitJobOf(entrust,apLines){
    var c=TC['fcl-job-cargo'];
    if(c&&c.d){
        var h=c.h||[],iJ=h.indexOf('Job No'),iE=h.indexOf('委托订单号'),iS=h.indexOf('状态');
        var hit=c.d.filter(function(r){
            return String(r[iE]||'')===entrust&&String(r[iS]||'')!=='已作废';
        })[0];
        if(hit)return String(hit[iJ]||'');
    }
    return (apLines&&apLines.length)?apLines[0].job:'';
}

function fclProfitRecvState(amt,got,due){
    if(amt<=0.004&&got<=0.004)return '无应收';
    if(got<=0.004)return '待核销';
    return due<=0.004?'全部核销':'部分核销';
}
function fclProfitPayState(amt,paid,unpaid){
    if(amt<=0.004)return '无应付';
    if(paid<=0.004)return '待付款';
    return unpaid<=0.004?'已付清':'部分付款';
}
function fclProfitState(revenue,profit,rate){
    if(profit<-0.004)return '亏损';
    if(revenue<=0.004)return profit>0.004?'盈利':'亏损';
    return rate<FCL_PROFIT_THIN_RATE?'薄利':'盈利';
}

/* 一次算出所有委托单的利润；查看明细也用它，保证列表与弹窗同一份口径 */
function fclProfitCompute(){
    var apIdx=fclProfitApIndex();
    var keys={},order=[];
    var pushKey=function(k){if(k&&!keys[k]){keys[k]=1;order.push(k);}};
    /* 有应收的、有成本的，都要出现 —— 只摊到成本还没开收入的那些，正是要盯的 */
    var arc=TC['fcl-ar-fee'];
    if(arc&&arc.d){
        var ih=(arc.h||[]).indexOf('委托单号'),ist=(arc.h||[]).indexOf('费用确认状态');
        arc.d.forEach(function(r){if(String(r[ist]||'')!=='已作废')pushKey(String(r[ih]||''));});
    }
    Object.keys(apIdx).forEach(pushKey);
    order.sort(function(a,b){return a<b?1:(a>b?-1:0);});   /* 单号倒序，新的在前 */
    return order.map(function(ent){
        var ar=fclProfitArOf(ent),ap=apIdx[ent]||[];
        var curs={};
        var arAmt=0,arGot=0,arDue=0;
        ar.forEach(function(f){
            curs[f.cur]=1;
            arAmt+=fclToCny(f.amt,f.cur);arGot+=fclToCny(f.got,f.cur);arDue+=fclToCny(f.due,f.cur);
        });
        var apAmt=0,apPaid=0;
        ap.forEach(function(f){
            curs[f.cur]=1;
            var c=fclToCny(f.amt,f.cur);
            apAmt+=c;apPaid+=+(c*f.ratio).toFixed(2);
        });
        arAmt=+arAmt.toFixed(2);arGot=+arGot.toFixed(2);arDue=+arDue.toFixed(2);
        apAmt=+apAmt.toFixed(2);apPaid=+apPaid.toFixed(2);
        var apDue=+(apAmt-apPaid).toFixed(2);
        var profit=+(arAmt-apAmt).toFixed(2);
        var rate=arAmt>0.004?+(profit/arAmt*100).toFixed(2):null;
        var job=fclProfitJobOf(ent,ap);
        var first=ar[0]||{};
        var apCust=(ap.filter(function(x){return x.cust;})[0]||{}).cust||'';
        return {
            entrust:ent,cust:first.cust||apCust||'',sales:first.sales||'',
            job:job,biz:(typeof fclEntrustBizType==='function')?fclEntrustBizType(ent):'整柜',
            curs:Object.keys(curs).sort().join('/')||'—',
            arAmt:arAmt,arGot:arGot,arDue:arDue,recvState:fclProfitRecvState(arAmt,arGot,arDue),
            apAmt:apAmt,apPaid:apPaid,apDue:apDue,payState:fclProfitPayState(apAmt,apPaid,apDue),
            profit:profit,rate:rate,
            intact:fclProfitJobHasUnalloc(job)?'有未分摊':'完整',
            state:fclProfitState(arAmt,profit,rate==null?0:rate),
            ar:ar,ap:ap
        };
    });
}
function fclProfitMoney(n){return (+n||0).toFixed(2);}
/* 渲染前重算：把计算结果写回 TC.d，后面的查询、状态插页、分页全走引擎原生那套 */
function fclProfitRefresh(){
    var rows=fclProfitCompute();
    TC['fcl-profit'].d=rows.map(function(x){
        return [x.entrust,x.cust,x.sales,x.job,x.biz,x.curs,
            fclProfitMoney(x.arAmt),fclProfitMoney(x.arGot),fclProfitMoney(x.arDue),x.recvState,
            fclProfitMoney(x.apAmt),fclProfitMoney(x.apPaid),fclProfitMoney(x.apDue),x.payState,
            fclProfitMoney(x.profit),x.rate==null?'—':(x.rate.toFixed(2)+'%'),
            x.intact,x.state];
    });
    if(typeof _listData!=='undefined')delete _listData['fcl-profit'];
    return TC['fcl-profit'].d;
}

/* ---------- 查看明细 ---------- */
function openFclProfitDetail(id,rowIdx){
    id=id||'fcl-profit';
    var idx=(rowIdx!=null&&rowIdx>=0)?rowIdx:
        ((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1);
    if(idx<0){showToast(tr('请先勾选一条委托单'));return;}
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到数据'));return;}
    var ent=fclFinGet(id,row,'委托单号');
    var x=fclProfitCompute().filter(function(p){return p.entrust===ent;})[0];
    if(!x){showToast(tr('未找到')+' '+ent+' '+tr('的收付明细'));return;}
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='82%';
    document.getElementById('crud-modal-title').textContent=tr('单票利润明细')+' - '+ent;
    document.getElementById('crud-modal-body').innerHTML=fclProfitDetailHtml(x);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function fclProfitDetailHtml(x){
    var b='<div class="space-y-4">';
    /* 头部：这票是谁的、挂哪个 Job */
    b+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">';
    [['委托单号',x.entrust],['客户名称',x.cust],['业务员',x.sales],['关联Job',x.job],
     ['业务类型',x.biz],['涉及币别',x.curs],['成本完整性',x.intact],['利润状态',x.state]].forEach(function(p){
        var isSt=p[0]==='利润状态';
        b+='<div><span class="text-xs text-text-muted block">'+tr(p[0])+'</span>'+
           (isSt?statusBadge(p[1]):'<span class="font-medium text-text-primary">'+(esc(p[1])||'—')+'</span>')+'</div>';
    });
    b+='</div>';
    /* 四个大数：收、付、利润、利润率 */
    b+='<div class="grid grid-cols-2 md:grid-cols-4 gap-3">';
    [['应收总金额',x.arAmt,'text-primary-700'],['应付总金额',x.apAmt,'text-amber-700'],
     ['利润',x.profit,x.profit<0?'text-red-600':'text-green-600'],
     ['利润率',x.rate,x.profit<0?'text-red-600':'text-green-600']].forEach(function(p,i){
        var val=(i===3)?(p[1]==null?'—':(p[1].toFixed(2)+'%')):('CNY '+fclProfitMoney(p[1]));
        b+='<div class="rounded-lg border border-surface-200 bg-white p-3">'+
           '<div class="text-xs text-text-muted">'+tr(p[0])+'</div>'+
           '<div class="text-lg font-semibold '+p[2]+' mt-1">'+esc(val)+'</div></div>';
    });
    b+='</div>';
    b+='<div class="text-xs text-text-muted">'+
       esc(tr('列表与上面四个数都按本位币 CNY 折算')+'（USD 1 = CNY '+fclFx('USD')+'，EUR 1 = CNY '+fclFx('EUR')+'）'+
           tr('；下面两张表是原币金额。'))+'</div>';
    /* ① 应收明细 */
    b+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-primary-500 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('① 应收明细')+'</span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('来自 应收费用明细，已作废的不计'))+'</span></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       ['应收流水号','费用科目','币别','应收金额','已收金额','未收金额','折合CNY','费用确认状态'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    if(!x.ar.length)b+='<tr><td colspan="8" class="px-3 py-8 text-center text-sm text-text-muted">'+tr('这张委托单还没有应收费用')+'</td></tr>';
    x.ar.forEach(function(f){
        b+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 font-medium text-text-primary">'+esc(f.no)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.acct)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.cur)+'</td>'+
           '<td class="px-3 py-2 text-right text-text-primary">'+fclProfitMoney(f.amt)+'</td>'+
           '<td class="px-3 py-2 text-right text-green-700">'+fclProfitMoney(f.got)+'</td>'+
           '<td class="px-3 py-2 text-right text-amber-700">'+fclProfitMoney(f.due)+'</td>'+
           '<td class="px-3 py-2 text-right text-text-secondary">'+fclProfitMoney(fclToCny(f.amt,f.cur))+'</td>'+
           '<td class="px-3 py-2">'+statusBadge(f.st)+'</td></tr>';
    });
    b+='</tbody><tfoot><tr class="border-t-2 border-surface-200 bg-surface-50 font-medium">'+
       '<td class="px-3 py-2" colspan="3">'+tr('折合 CNY 合计')+'</td>'+
       '<td class="px-3 py-2 text-right">'+fclProfitMoney(x.arAmt)+'</td>'+
       '<td class="px-3 py-2 text-right text-green-700">'+fclProfitMoney(x.arGot)+'</td>'+
       '<td class="px-3 py-2 text-right text-amber-700">'+fclProfitMoney(x.arDue)+'</td>'+
       '<td class="px-3 py-2" colspan="2">'+esc(x.recvState)+'</td></tr></tfoot></table></div></div>';
    /* ② 应付明细 */
    b+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('② 应付明细')+'</span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('来自 代理成本明细 分摊到本委托单的部分；已付按所属付款单的付款比例折算'))+'</span></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       ['成本流水号','Job No','服务商','费用名称','币别','分摊金额','已付金额','未付金额','折合CNY','付款单号'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    if(!x.ap.length)b+='<tr><td colspan="10" class="px-3 py-8 text-center text-sm text-text-muted">'+tr('还没有成本分摊到这张委托单')+'</td></tr>';
    x.ap.forEach(function(f){
        var paid=+(f.amt*f.ratio).toFixed(2);
        b+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 font-medium text-text-primary">'+esc(f.no)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.job)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.prov)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.fee)+(f.note?'<span class="text-xs text-text-muted ml-1">('+esc(f.note)+')</span>':'')+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.cur)+'</td>'+
           '<td class="px-3 py-2 text-right text-text-primary">'+fclProfitMoney(f.amt)+'</td>'+
           '<td class="px-3 py-2 text-right text-green-700">'+fclProfitMoney(paid)+'</td>'+
           '<td class="px-3 py-2 text-right text-amber-700">'+fclProfitMoney(f.amt-paid)+'</td>'+
           '<td class="px-3 py-2 text-right text-text-secondary">'+fclProfitMoney(fclToCny(f.amt,f.cur))+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.apNo||'—')+'</td></tr>';
    });
    b+='</tbody><tfoot><tr class="border-t-2 border-surface-200 bg-surface-50 font-medium">'+
       '<td class="px-3 py-2" colspan="5">'+tr('折合 CNY 合计')+'</td>'+
       '<td class="px-3 py-2 text-right">'+fclProfitMoney(x.apAmt)+'</td>'+
       '<td class="px-3 py-2 text-right text-green-700">'+fclProfitMoney(x.apPaid)+'</td>'+
       '<td class="px-3 py-2 text-right text-amber-700">'+fclProfitMoney(x.apDue)+'</td>'+
       '<td class="px-3 py-2" colspan="2">'+esc(x.payState)+'</td></tr></tfoot></table></div></div>';
    if(x.intact==='有未分摊'){
        b+='<div class="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">'+
           esc(tr('这票所在的 Job（')+x.job+tr('）还有成本没分摊到委托单，上面的应付和利润是偏乐观的。去「代理成本明细 → 手工分摊」摊完再看。'))+'</div>';
    }
    b+='</div>';
    return b;
}
/* 工具栏「查看明细」：与行内「查看」同一个弹窗，勾一条再点 */
function openSelectedFclProfitDetail(id){
    openFclProfitDetail(id||'fcl-profit',-1);
}
