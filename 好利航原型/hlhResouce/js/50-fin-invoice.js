/* =========================================================
 * 发票管理 fin-invoice（财务结算）
 *
 * 这张表接的是各业务侧「申请开票」提交过来的单子：
 *   整柜 应收收款管理 → 申请开票 → submitArInvoiceApply() → 落到这里（待开票）
 *   散货侧以后接进来也走同一个入口 finInvoicePushApply()
 * 财务在这里统一开票：挑单 → 选开票方式 → 回填发票号码 → 已开票。
 * 开错了走「红冲」（已开票 → 已红冲），还没开的直接「作废」。
 *
 * 费用明细不塞进列表行里 —— 一张发票能覆盖好几条应收费用，
 * 单独放 _FIN_INV_FEES 按申请号挂，列表只显示「费用笔数」和合计金额。
 * ========================================================= */

var FIN_INVOICE_TYPES=['增值税专用发票','增值税普通发票','形式发票(PI)','商业发票(CI)'];
/* 开票方式：接口自动取号 vs 手工录入已开出的票号（线下开完回填） */
var FIN_INVOICE_METHODS=['税务接口','手工录入'];
var FIN_INVOICE_SOURCES=['整柜应收','散货应收'];

addPrototypeTable('fin-invoice','发票管理',
    '开票申请号|业务来源|来源单号|客户名称|发票类型|开票抬头|纳税人识别号|币别|开票金额|费用笔数|申请人|申请时间|开票方式|发票号码|开票人|开票时间|开票备注|开票状态|操作',
    ['待开票','已开票','已红冲','已作废'],[
    ['INV-20260620001','整柜应收','FEO-20260612002','广州远洋进出口贸易','增值税专用发票','广州远洋进出口贸易有限公司','91440101MA5CX00001','USD','5600.00','2','李四','2026-06-20 10:12','税务接口','FP20260620001','财务-陈敏','2026-06-20 15:40','5 月账期一次性开出','已开票'],
    ['INV-20260620002','整柜应收','FEO-20260612002','广州远洋进出口贸易','增值税普通发票','广州远洋进出口贸易有限公司','','CNY','400.00','1','李四','2026-06-20 10:15','税务接口','FP20260620002','财务-陈敏','2026-06-20 15:41','报关费单开','已开票'],
    ['INV-20260621001','整柜应收','FEO-20260613001','深圳市华运达国际货运','增值税专用发票','深圳市华运达国际货运有限公司','91440300MA5DX00002','USD','4500.00','2','张三','2026-06-21 09:30','','','','','','待开票'],
    ['INV-20260621002','整柜应收','FEO-20260613001','深圳市华运达国际货运','增值税普通发票','深圳市华运达国际货运有限公司','','CNY','2000.00','1','张三','2026-06-21 09:33','','','','','客户要求分币别开','待开票'],
    ['INV-20260622001','整柜应收','FEO-20260609007','广州分公司','增值税专用发票','好利航国际物流（广州）有限公司','91440101MA5CX00009','USD','9600.00','3','王五','2026-06-22 14:20','','','','','自拼柜，按散货订单拆过','待开票'],
    ['INV-20260615001','散货应收','H2606270001','蓝色有限','增值税普通发票','蓝色有限公司','','CNY','1200.00','1','梦幻小业务','2026-06-15 11:05','手工录入','FP20260615008','财务-陈敏','2026-06-15 17:20','','已开票'],
    ['INV-20260610001','散货应收','H82605240004','星星玩具电商','增值税专用发票','星星玩具电商有限公司','91330100MA2GX00003','CNY','880.00','1','BTWOZCW','2026-06-10 09:00','税务接口','FP20260610003','财务-陈敏','2026-06-10 10:30','抬头写错，已红冲重开','已红冲'],
    ['INV-20260608001','散货应收','H2605120001','蓝城电商公司','增值税普通发票','蓝城电商公司','','CNY','100.00','1','天地销售','2026-06-08 16:40','','','','','费用已作废，开票申请一并撤销','已作废']
],[
    /* 申请时间排最前：财务开票按批次来，先框账期再往下挑客户 */
    {label:'申请时间',type:'date'},
    {label:'开票申请号',type:'text'},
    {label:'客户名称',type:'text'},
    {label:'来源单号',type:'text'},
    {label:'业务来源',type:'select',options:FIN_INVOICE_SOURCES},
    {label:'发票类型',type:'select',options:FIN_INVOICE_TYPES},
    {label:'发票号码',type:'text'},
    {label:'开票状态',type:'select',options:['待开票','已开票','已红冲','已作废']}
]);
/* 发票按真实申请来，不做 200 行填充（填充会按首列递增造出不存在的申请号） */
TC['fin-invoice'].noExpand=true;
/* 申请时间/开票人/开票时间已经是业务字段，不用引擎再补六个空审计列 */
TC['fin-invoice'].noAutoAudit=true;
/* 同一张委托单可以拆多张发票，首列申请号才是唯一身份（这里本就唯一，显式声明防止以后改列） */
TC['fin-invoice'].rowKeyCols=['开票申请号'];

/* 申请号 -> 这张发票覆盖的应收费用行。开票、查看详情都从这里取。 */
var _FIN_INV_FEES={
'INV-20260620001':[{no:'FAR-20260612003',acct:'海运费',cur:'USD',amt:5200},{no:'FAR-20260612005',acct:'文件费',cur:'USD',amt:400}],
'INV-20260620002':[{no:'FAR-20260612006',acct:'报关费',cur:'CNY',amt:400}],
'INV-20260621001':[{no:'FAR-20260613001',acct:'海运费',cur:'USD',amt:4200},{no:'FAR-20260613003',acct:'文件费',cur:'USD',amt:300}],
'INV-20260621002':[{no:'FAR-20260613002',acct:'报关费',cur:'CNY',amt:2000}],
'INV-20260622001':[{no:'FAR-20260609007',acct:'海运费',cur:'USD',amt:7200},{no:'FAR-20260609008',acct:'操作费',cur:'USD',amt:1600},{no:'FAR-20260609009',acct:'文件费',cur:'USD',amt:800}],
'INV-20260615001':[{no:'FAR-20260627001',acct:'应收附加费',cur:'CNY',amt:1200}],
'INV-20260610001':[{no:'FAR-20260524004',acct:'运费',cur:'CNY',amt:880}],
'INV-20260608001':[{no:'FAR-20260512001',acct:'客户理赔费',cur:'CNY',amt:100}]
};
function finInvFeesOf(no){return _FIN_INV_FEES[String(no||'')]||[];}

function finInvGet(row,label){return fclFinGet('fin-invoice',row,label);}
function finInvSet(row,label,val){fclFinSet('fin-invoice',row,label,val);}

/* 发票号码：税务接口取号按 FP + 当天 + 流水，够原型演示 */
function finInvNextNumber(offset){
    var d=new Date(),p=function(n){return String(n).padStart(2,'0');};
    var used={};
    ((TC['fin-invoice']||{}).d||[]).forEach(function(r){
        var v=finInvGet(r,'发票号码');if(v)used[v]=1;
    });
    var day=String(d.getFullYear())+p(d.getMonth()+1)+p(d.getDate());
    var n=(offset||0)+1;
    while(used['FP'+day+String(n).padStart(3,'0')])n++;
    return 'FP'+day+String(n).padStart(3,'0');
}

/* ---------- 各业务侧提交开票申请的统一入口 ---------- */
/* a = {source,srcNo,cust,type,title,taxNo,cur,fees:[{no,acct,cur,amt}],remark}
 * 返回新申请号。业务侧只要把这几样凑齐就行，落表与编号都在这里做。 */
function finInvoicePushApply(a){
    a=a||{};
    var fees=(a.fees||[]).slice();
    var sum=+fees.reduce(function(s,f){return s+((+f.amt)||0);},0).toFixed(2);
    var no=fclSeqNo('INV','fin-invoice');
    /* fclSeqNo 按表内行数取号，同一天连提两单会撞号，撞了就往后顺延 */
    var exist={};((TC['fin-invoice']||{}).d||[]).forEach(function(r){exist[finInvGet(r,'开票申请号')]=1;});
    var base=no,k=1;
    while(exist[no]){k++;no=base.replace(/(\d{3})$/,function(){return String(parseInt(base.slice(-3),10)+k).padStart(3,'0');});}
    fclPushRow('fin-invoice',{
        '开票申请号':no,'业务来源':a.source||'整柜应收','来源单号':a.srcNo||'',
        '客户名称':a.cust||'','发票类型':a.type||FIN_INVOICE_TYPES[0],
        '开票抬头':a.title||a.cust||'','纳税人识别号':a.taxNo||'',
        '币别':a.cur||'','开票金额':sum.toFixed(2),'费用笔数':String(fees.length),
        '申请人':fclWho(),'申请时间':fclNow(),
        '开票方式':'','发票号码':'','开票人':'','开票时间':'',
        '开票备注':a.remark||'','开票状态':'待开票'
    });
    _FIN_INV_FEES[no]=fees;
    if(typeof _listData!=='undefined')delete _listData['fin-invoice'];
    return no;
}

/* ---------- 开票 ---------- */
var _finInv=null;
function openFinInvoiceIssue(id){
    id=id||'fin-invoice';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要开票的申请'));return;}
    var rows=fclFinRows(id),picked=[],blocked=0;
    idxs.forEach(function(i){
        var row=rows[i];
        if(!row)return;
        if(finInvGet(row,'开票状态')==='待开票')picked.push({idx:i,row:row});else blocked++;
    });
    if(!picked.length){showToast(tr('只有「待开票」的申请可以开票'));return;}
    _finInv={id:id,method:FIN_INVOICE_METHODS[0],remark:'',blocked:blocked,
        items:picked.map(function(p,k){
            return {idx:p.idx,row:p.row,
                no:finInvGet(p.row,'开票申请号'),cust:finInvGet(p.row,'客户名称'),
                type:finInvGet(p.row,'发票类型'),title:finInvGet(p.row,'开票抬头'),
                taxNo:finInvGet(p.row,'纳税人识别号'),cur:finInvGet(p.row,'币别'),
                amt:finInvGet(p.row,'开票金额'),
                invNo:finInvNextNumber(k)};
        })};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='76%';
    document.getElementById('crud-modal-title').textContent=tr('开票')+'（'+picked.length+' '+tr('张')+'）';
    document.getElementById('crud-modal-body').innerHTML=finInvIssueBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitFinInvoiceIssue()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认开票')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function finInvIssueBodyHtml(){
    var A=_finInv,inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    var h='<div class="space-y-4">';
    if(A.blocked){
        h+='<div class="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">'+
           esc(tr('勾选中有')+' '+A.blocked+' '+tr('条不是「待开票」，已跳过'))+'</div>';
    }
    h+='<div class="px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(tr('税务接口自动取号；线下已经开好的票选「手工录入」，把票号填进下表。'))+'</div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('开票方式')+'<span class="text-red-500 ml-0.5">*</span></label>'+
       '<select onchange="finInvSetMethod(this.value)" class="'+inCls+'">'+selectOptionsHtml(FIN_INVOICE_METHODS,A.method)+'</select></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('开票人')+'</label>'+
       '<input type="text" readonly value="'+esc(fclWho())+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary cursor-not-allowed"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('开票时间')+'</label>'+
       '<input type="text" readonly value="'+esc(fclNow())+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary cursor-not-allowed"></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-3"><label class="text-sm font-medium text-text-secondary">'+tr('开票备注')+'</label>'+
       '<textarea rows="3" oninput="finInvSetRemark(this.value)" placeholder="'+esc(tr('可选，会写到每一张发票上'))+'" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y">'+esc(A.remark)+'</textarea></div>';
    h+='</div>';
    h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-primary-500 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('本次开票清单')+'</span></div>';
    h+='<div data-fininv-list class="border border-surface-200 rounded-lg overflow-auto">'+finInvIssueTableHtml()+'</div></div>';
    h+='</div>';
    return h;
}
function finInvIssueTableHtml(){
    var A=_finInv,manual=A.method==='手工录入';
    var h='<table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       ['开票申请号','客户名称','发票类型','开票抬头','币别','开票金额','费用笔数','发票号码'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    A.items.forEach(function(it,i){
        h+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 font-medium text-text-primary whitespace-nowrap">'+esc(it.no)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(it.cust)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(it.type)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(it.title)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(it.cur)+'</td>'+
           '<td class="px-3 py-2 text-right text-text-primary font-medium">'+esc(it.amt)+'</td>'+
           '<td class="px-3 py-2 text-right text-text-secondary">'+finInvFeesOf(it.no).length+'</td>'+
           '<td class="px-3 py-2">'+(manual
               ?'<input type="text" value="'+esc(it.invNo)+'" oninput="finInvSetNo('+i+',this.value)" placeholder="'+esc(tr('请输入发票号码'))+'" class="w-40 h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50">'
               :'<span class="text-text-primary">'+esc(it.invNo)+'</span>')+'</td></tr>';
    });
    h+='</tbody></table>';
    return h;
}
function finInvSetMethod(v){
    if(!_finInv)return;
    _finInv.method=v;
    /* 切回税务接口时重新自动取号，免得留着手工改过的半截号码 */
    if(v!=='手工录入')_finInv.items.forEach(function(it,k){it.invNo=finInvNextNumber(k);});
    var box=document.querySelector('[data-fininv-list]');
    if(box)box.innerHTML=finInvIssueTableHtml();
}
function finInvSetRemark(v){if(_finInv)_finInv.remark=v;}
function finInvSetNo(i,v){if(_finInv&&_finInv.items[i])_finInv.items[i].invNo=String(v||'').trim();}
function submitFinInvoiceIssue(){
    var A=_finInv;
    if(!A){showToast(tr('请重新打开开票弹窗'));return;}
    var miss=A.items.filter(function(it){return !it.invNo;});
    if(miss.length){showToast(tr('还有')+' '+miss.length+' '+tr('张没填发票号码'));return;}
    /* 发票号码不能重号：本次之间、以及与已开出的都要查 */
    var seen={},dup='';
    A.items.forEach(function(it){if(seen[it.invNo])dup=it.invNo;seen[it.invNo]=1;});
    ((TC['fin-invoice']||{}).d||[]).forEach(function(r){
        var v=finInvGet(r,'发票号码');
        if(v&&seen[v]&&finInvGet(r,'开票状态')!=='已红冲')dup=v;
    });
    if(dup){showToast(tr('发票号码重复')+'：'+dup);return;}
    var who=fclWho(),now=fclNow();
    A.items.forEach(function(it){
        finInvSet(it.row,'开票方式',A.method);
        finInvSet(it.row,'发票号码',it.invNo);
        finInvSet(it.row,'开票人',who);
        finInvSet(it.row,'开票时间',now);
        if(A.remark)finInvSet(it.row,'开票备注',A.remark);
        finInvSet(it.row,'开票状态','已开票');
    });
    var n=A.items.length;
    _finInv=null;
    closeCrudModal();
    fclFinRefresh('fin-invoice');
    showToast(tr('已开票')+' '+n+' '+tr('张')+'　'+A.method);
}

/* ---------- 红冲 / 作废 ---------- */
/* 红冲：已开票的票开错了，整张作废重开。号码留在行上备查，状态转「已红冲」。 */
function redFlushFinInvoice(id){
    fclFinBatchStatus(id||'fin-invoice','开票状态',['已开票'],'已红冲','红冲');
}
/* 作废：还没开出去的申请撤销掉。已开票的只能走红冲，不能直接作废。 */
function voidFinInvoice(id){
    fclFinBatchStatus(id||'fin-invoice','开票状态',['待开票'],'已作废','作废');
}

/* ---------- 查看详情 ---------- */
function openFinInvoiceDetail(id,rowIdx){
    id=id||'fin-invoice';
    var idx=(rowIdx!=null&&rowIdx>=0)?rowIdx:
        ((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1);
    if(idx<0){showToast(tr('请先勾选一条开票申请'));return;}
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到开票申请'));return;}
    var g=function(n){return finInvGet(row,n);};
    var no=g('开票申请号'),fees=finInvFeesOf(no),cur=g('币别');
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='70%';
    document.getElementById('crud-modal-title').textContent=tr('发票详情')+' - '+no;
    var b='<div class="space-y-4">';
    b+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">';
    [['开票申请号',no],['开票状态',g('开票状态')],['业务来源',g('业务来源')],['来源单号',g('来源单号')],
     ['客户名称',g('客户名称')],['发票类型',g('发票类型')],['开票抬头',g('开票抬头')],['纳税人识别号',g('纳税人识别号')],
     ['币别',cur],['开票金额',g('开票金额')],['申请人',g('申请人')],['申请时间',g('申请时间')],
     ['开票方式',g('开票方式')],['发票号码',g('发票号码')],['开票人',g('开票人')],['开票时间',g('开票时间')]
    ].forEach(function(p){
        var isSt=p[0]==='开票状态';
        b+='<div><span class="text-xs text-text-muted block">'+tr(p[0])+'</span>'+
           (isSt?statusBadge(p[1]||'待开票')
                :'<span class="font-medium text-text-primary">'+(esc(p[1])||'—')+'</span>')+'</div>';
    });
    b+='</div>';
    if(g('开票备注')){
        b+='<div class="rounded-lg border border-surface-200 p-3 text-sm"><span class="text-xs text-text-muted block mb-1">'+
           tr('开票备注')+'</span><span class="text-text-primary">'+esc(g('开票备注'))+'</span></div>';
    }
    b+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-primary-500 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('开票费用明细')+'</span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('这张发票是由下面这几条应收费用凑出来的'))+'</span></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       ['应收流水号','费用科目','币别','金额'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    if(!fees.length)b+='<tr><td colspan="4" class="px-3 py-8 text-center text-sm text-text-muted">'+tr('没有登记费用明细')+'</td></tr>';
    var sum=0;
    fees.forEach(function(f){
        sum+=(+f.amt)||0;
        b+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 font-medium text-text-primary">'+esc(f.no)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.acct)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.cur||cur)+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+((+f.amt)||0).toFixed(2)+'</td></tr>';
    });
    b+='</tbody><tfoot><tr class="border-t-2 border-surface-200 bg-surface-50 font-medium">'+
       '<td class="px-3 py-2" colspan="3">'+tr('合计')+'</td>'+
       '<td class="px-3 py-2">'+esc(cur)+' '+sum.toFixed(2)+'</td></tr></tfoot></table></div></div>';
    b+='</div>';
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
