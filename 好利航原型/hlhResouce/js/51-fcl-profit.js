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
 * 所以列表统一折成本位币，汇率取「财务结算 → 汇率管理」里当期生效的那条，
 * 本位币默认人民币、可在工具栏切换；原币金额留在查看明细里，折算率写在弹窗上。
 * ========================================================= */

/* 币别写法两套：整柜这边是 CNY/USD/EUR，汇率管理里是中文币名，得能互相认。 */
var FCL_CUR_ALIAS={'CNY':['CNY','人民币'],'USD':['USD','美元'],'EUR':['EUR','欧元']};
var FCL_BASE_OPTIONS=[['CNY','人民币'],['USD','美元'],['EUR','欧元']];
/* 汇率管理里查不到当期生效汇率时的兜底，不让页面因为汇率没维护就算不出数 */
var FCL_PROFIT_FX_FALLBACK={'CNY':1,'USD':7,'EUR':7.8};
/* 本位币：默认人民币，工具栏「本位币」下拉可切 */
var _fclProfitBase='CNY';
/* 薄利线：毛利率低于这个数还是正的，单独归一档提醒业务 */
var FCL_PROFIT_THIN_RATE=15;

function fclCurKey(cur){
    var s=String(cur||'').trim(),out=s;
    Object.keys(FCL_CUR_ALIAS).forEach(function(k){
        if(FCL_CUR_ALIAS[k].indexOf(s)>=0)out=k;
    });
    return out;
}
function fclProfitToday(){
    var s=(typeof receiptNowStr==='function')?receiptNowStr():'';
    if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
    var d=new Date(),p=function(n){return String(n).padStart(2,'0');};
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
}
/* 对人民币的汇率，取自汇率管理。同一个币别那里会有好几条，取法：
 * 启用 + 起止区间合法且覆盖今天 → 其中创建时间最新的一条。
 * 都不满足就用兜底值（汇率管理的演示数据里就有起止写反、早已过期的条目）。 */
function fclRateToCny(cur){
    var key=fclCurKey(cur);
    if(key==='CNY')return 1;
    var c=TC['fin-rate'],names=FCL_CUR_ALIAS[key]||[key];
    if(c&&c.d){
        var h=c.h||[],iC=h.indexOf('币别编号'),iBase=h.indexOf('本位币别'),iR=h.indexOf('汇率'),
            iSt=h.indexOf('状态'),iF=h.indexOf('生效开始时间'),iT=h.indexOf('生效结束时间'),
            iCt=h.indexOf('创建时间');
        var today=fclProfitToday();
        var cands=c.d.filter(function(r){
            if(names.indexOf(String(r[iC]||'').trim())<0)return false;
            if(iBase>=0&&['CNY','人民币'].indexOf(String(r[iBase]||'').trim())<0)return false;
            if(iSt>=0&&String(r[iSt]||'')!=='启用')return false;
            var f=String(r[iF]||'').slice(0,10),t=String(r[iT]||'').slice(0,10);
            if(f&&t&&f>t)return false;            /* 起止写反的当无效 */
            if(f&&today<f)return false;
            if(t&&today>t)return false;
            return (fclParseMoney(r[iR])||0)>0;
        });
        if(cands.length){
            cands.sort(function(a,b){
                var x=String(a[iCt]||''),y=String(b[iCt]||'');
                return x<y?1:(x>y?-1:0);          /* 创建时间倒序，最新的在前 */
            });
            return fclParseMoney(cands[0][iR]);
        }
    }
    return FCL_PROFIT_FX_FALLBACK[key]||1;
}
/* 原币 -> 当前本位币：先折成人民币，再按本位币自己的汇率折回去 */
function fclToBase(amt,cur){
    var base=fclRateToCny(_fclProfitBase)||1;
    return +((((+amt)||0)*fclRateToCny(cur))/base).toFixed(2);
}
function fclBaseLabel(){
    var hit=FCL_BASE_OPTIONS.filter(function(o){return o[0]===_fclProfitBase;})[0];
    return hit?hit[1]:_fclProfitBase;
}
function fclProfitSetBase(cur){
    _fclProfitBase=fclCurKey(cur);
    if(typeof closeToolbarDropdowns==='function')closeToolbarDropdowns();
    fclFinRefresh('fcl-profit');
    showToast(tr('本位币已切换为')+' '+fclBaseLabel()+'（'+_fclProfitBase+'）');
}
/* 表头随本位币变：金额列的单位后缀要跟着走，不然切了币种数字变了标签还写着 CNY */
function fclProfitHeaders(){
    var u='('+_fclProfitBase+')';
    return ['委托单号','客户名称','业务员','关联Job','业务类型','涉及币别','创建时间',
        '应收总金额'+u,'已收金额'+u,'未收金额'+u,'收款核销情况',
        '应付总金额'+u,'已付金额'+u,'未付金额'+u,'付款核销情况',
        '利润'+u,'利润率','成本完整性','利润状态','操作'];
}

addPrototypeTable('fcl-profit','单票利润分析表',
    '委托单号|客户名称|业务员|关联Job|业务类型|涉及币别|创建时间|应收总金额(CNY)|已收金额(CNY)|未收金额(CNY)|收款核销情况|应付总金额(CNY)|已付金额(CNY)|未付金额(CNY)|付款核销情况|利润(CNY)|利润率|成本完整性|利润状态|操作',
    ['盈利','薄利','亏损'],[],[
    /* 创建时间排最前：利润表是按账期回看的，先框时间再往下挑单 */
    {label:'创建时间',type:'date'},
    {label:'委托单号',type:'text'},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'业务员',type:'select',options:FCL_SALES_OPTIONS},
    {label:'关联Job',type:'text'},
    {label:'业务类型',type:'select',options:['整柜','散拼']},
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
        iAt=h.indexOf('分摊时间'),iSt=h.indexOf('成本状态');
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
                at:String(r[iAt]||''),note:alloc.rows.length+' 票散货订单合计'});
        }else{
            alloc.rows.forEach(function(x){
                var ent=String(x.key||'');
                if(!ent)return;
                (idx[ent]=idx[ent]||[]).push({no:no,job:String(r[iJob]||''),prov:String(r[iProv]||''),
                    fee:String(r[iFee]||''),cur:cur,amt:+((+x.amt)||0).toFixed(2),apNo:apNo,ratio:ratio,
                    at:String(r[iAt]||''),cust:String(x.cust||''),note:''});
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
/* 委托单的创建时间：应收台账上记了就用它（那是这张单进系统的时间）；
 * 只摊到成本还没开收入的，退回最早那笔成本的分摊时间；
 * 再没有就按单号里的日期兜底（FEO-YYYYMMDDnnn），总比空着强。 */
function fclProfitCreatedAt(entrust,apLines){
    var c=TC['fcl-ar-receipt'];
    if(c&&c.d){
        var h=c.h||[],iE=h.indexOf('委托单号'),iT=h.indexOf('创建时间');
        if(iE>=0&&iT>=0){
            var ts=c.d.filter(function(r){return String(r[iE]||'')===entrust&&r[iT];})
                      .map(function(r){return String(r[iT]);}).sort();
            if(ts.length)return ts[0];
        }
    }
    var at=(apLines||[]).map(function(x){return x.at;}).filter(Boolean).sort();
    if(at.length)return at[0];
    var m=String(entrust||'').match(/(\d{4})(\d{2})(\d{2})/);
    return m?(m[1]+'-'+m[2]+'-'+m[3]+' 00:00'):'';
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
            arAmt+=fclToBase(f.amt,f.cur);arGot+=fclToBase(f.got,f.cur);arDue+=fclToBase(f.due,f.cur);
        });
        var apAmt=0,apPaid=0;
        ap.forEach(function(f){
            curs[f.cur]=1;
            var c=fclToBase(f.amt,f.cur);
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
            createdAt:fclProfitCreatedAt(ent,ap),base:_fclProfitBase,
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
    /* 表头也一起刷：金额列的单位后缀跟着本位币走 */
    TC['fcl-profit'].h=fclProfitHeaders();
    TC['fcl-profit'].d=rows.map(function(x){
        return [x.entrust,x.cust,x.sales,x.job,x.biz,x.curs,x.createdAt,
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
     ['业务类型',x.biz],['涉及币别',x.curs],['创建时间',x.createdAt],
     ['成本完整性',x.intact],['利润状态',x.state]].forEach(function(p){
        var isSt=p[0]==='利润状态';
        b+='<div><span class="text-xs text-text-muted block">'+tr(p[0])+'</span>'+
           (isSt?statusBadge(p[1]):'<span class="font-medium text-text-primary">'+(esc(p[1])||'—')+'</span>')+'</div>';
    });
    b+='</div>';
    /* 收付两侧各出「总额 / 已核销 / 未核销 / 情况」四格，收和付对称着看 */
    var bs=x.base||_fclProfitBase;
    var card=function(label,val,cls){
        return '<div class="rounded-lg border border-surface-200 bg-white p-3">'+
               '<div class="text-xs text-text-muted">'+tr(label)+'</div>'+
               '<div class="text-base font-semibold '+cls+' mt-1">'+esc(val)+'</div></div>';
    };
    var money=function(n){return bs+' '+fclProfitMoney(n);};
    b+='<div class="grid grid-cols-2 md:grid-cols-4 gap-3">';
    b+=card('应收总金额',money(x.arAmt),'text-primary-700');
    b+=card('已收金额',money(x.arGot),'text-green-600');
    b+=card('未收金额',money(x.arDue),'text-amber-600');
    b+=card('收款核销情况',x.recvState,'text-text-primary');
    b+=card('应付总金额',money(x.apAmt),'text-amber-700');
    b+=card('已付金额',money(x.apPaid),'text-green-600');
    b+=card('未付金额',money(x.apDue),'text-amber-600');
    b+=card('付款核销情况',x.payState,'text-text-primary');
    b+='</div>';
    /* 利润两格单独一行放大，别和上面八个小格混在一起 */
    b+='<div class="grid grid-cols-2 gap-3">';
    [['利润',money(x.profit)],['利润率',x.rate==null?'—':(x.rate.toFixed(2)+'%')]].forEach(function(p){
        b+='<div class="rounded-lg border p-3 '+(x.profit<0?'border-red-200 bg-red-50':'border-green-200 bg-green-50')+'">'+
           '<div class="text-xs text-text-muted">'+tr(p[0])+'</div>'+
           '<div class="text-xl font-semibold '+(x.profit<0?'text-red-600':'text-green-600')+' mt-1">'+esc(p[1])+'</div></div>';
    });
    b+='</div>';
    var fxNote=FCL_BASE_OPTIONS.filter(function(o){return o[0]!==bs;})
        .map(function(o){return o[0]+' 1 = '+bs+' '+(fclRateToCny(o[0])/fclRateToCny(bs)).toFixed(4);}).join('，');
    b+='<div class="text-xs text-text-muted">'+
       esc(tr('上面的金额都按本位币')+' '+fclBaseLabel()+'（'+bs+'）'+tr('折算，汇率取自「财务结算 → 汇率管理」当期生效的那条')+'：'+fxNote+
           tr('。下面两张表是原币金额。'))+'</div>';
    /* ① 应收明细 */
    b+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-primary-500 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('① 应收明细')+'</span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('来自 应收费用明细，已作废的不计'))+'</span></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       ['应收流水号','费用科目','币别','应收金额','已收金额','未收金额','折合本位币','费用确认状态'].map(function(t){
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
           '<td class="px-3 py-2 text-right text-text-secondary">'+fclProfitMoney(fclToBase(f.amt,f.cur))+'</td>'+
           '<td class="px-3 py-2">'+statusBadge(f.st)+'</td></tr>';
    });
    b+='</tbody><tfoot><tr class="border-t-2 border-surface-200 bg-surface-50 font-medium">'+
       '<td class="px-3 py-2" colspan="3">'+tr('折合本位币合计')+'</td>'+
       '<td class="px-3 py-2 text-right">'+fclProfitMoney(x.arAmt)+'</td>'+
       '<td class="px-3 py-2 text-right text-green-700">'+fclProfitMoney(x.arGot)+'</td>'+
       '<td class="px-3 py-2 text-right text-amber-700">'+fclProfitMoney(x.arDue)+'</td>'+
       '<td class="px-3 py-2" colspan="2">'+esc(x.recvState)+'</td></tr></tfoot></table></div></div>';
    /* ② 应付明细 */
    b+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('② 应付明细')+'</span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('来自 代理成本明细 分摊到本委托单的部分；已付按所属付款单的付款比例折算'))+'</span></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       ['成本流水号','Job No','服务商','费用名称','币别','分摊金额','已付金额','未付金额','折合本位币','付款单号'].map(function(t){
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
           '<td class="px-3 py-2 text-right text-text-secondary">'+fclProfitMoney(fclToBase(f.amt,f.cur))+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.apNo||'—')+'</td></tr>';
    });
    b+='</tbody><tfoot><tr class="border-t-2 border-surface-200 bg-surface-50 font-medium">'+
       '<td class="px-3 py-2" colspan="5">'+tr('折合本位币合计')+'</td>'+
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
