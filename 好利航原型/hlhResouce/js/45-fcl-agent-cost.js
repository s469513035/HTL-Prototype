/* ==========================================================================
 * 45 · 整柜代理实际成本 —— 账单导入 / 两级分摊 / 差异分析 / 付款申请
 *
 * 链路：代理账单 fcl-agent-bill
 *          │ 一级分摊（票数/件数/体积/重量/预估成本比例）
 *          ▼
 *       代理实际成本 fcl-agent-cost（按 Job，42 里定义）
 *          │ 对账 ←→ 预估成本明细 fcl-est-cost
 *          ├─ 二级分摊 ─▶ 单票成本明细 fcl-shipment-cost（按柜内票）
 *          │                  ▲ 权重取数
 *          │            柜内票清单 fcl-job-cargo
 *          ▼ 勾选已对账成本行 → 付款申请（按 服务商+币别 分组）
 *       付款单 fcl-ap-bill → 审批 → 付款核销（挑服务商付款流水冲账）
 *
 * 依赖（都在更早加载的文件里，顶层只有 addPrototypeTable，无向前引用）：
 *   42 · FCL_AGENT_OPTIONS / FCL_FEE_KINDS / fclFinRows / fclFinGet /
 *        fclFinSet / fclFinRefresh / fclFinBatchStatus / fclParseMoney /
 *        fclEstAmountOf / FCL_RECON_TOLERANCE
 *   05 · FCL_CURRENCY_OPTIONS / FCL_CUSTOMER_OPTIONS
 *   20 · getCurrentUserName / crudAttachmentChipHtml
 * ========================================================================== */

/* 费用名称比费用类别细：类别用于归集，名称是代理账单上真正印的那一行 */
var FCL_FEE_NAMES=['海运费','THC','文件费','封签费','燃油附加费','旺季附加费','港杂费',
    '拖车费','报关费','查验费','单证费','仓储费','改单费','滞港费','其他'];

/* ==========================================================================
 * 一、代理账单 —— 按供应商发票维度导入，一张发票一行
 * 发票常常覆盖多个柜，费用明细由供应商按 Job No 给（见 _agentBillDetails），
 * 账单头只留发票级信息：「账单金额」是总额，「涉及Job数」按明细去重算。
 * ========================================================================== */
addPrototypeTable('fcl-agent-bill','代理账单',
    '流水号|服务商|服务商账单号|账单周期|账期时间|币别|账单金额|涉及Job数|导入人|导入时间|备注|账单状态|操作',
    /* 账单状态即对账-请款-核销的流转：
     * 待对账 --[对账·确认费用]--> 待请款 --[生成账单]--> 待审核
     * --[应付审批通过]--> 待核销 --[付款核销]--> 部分核销 -> 全部核销；作废独立 */
    ['待对账','待请款','待审核','待核销','部分核销','全部核销','作废'],[
    ['AGB-20260615001','MAERSK','MSK-INV-260613','2026-06','2026-07-15 23:59','USD','12600','3','张财务','2026-06-15 09:30','一张发票含 3 个柜','待对账'],
    ['AGB-20260615002','COSCO','COS-INV-260612','2026-06','2026-06-30 23:59','USD','5180','1','张财务','2026-06-15 09:30','','待请款'],
    ['AGB-20260615003','MAERSK','MSK-THC-260615','2026-06','2026-07-15 23:59','USD','1200','2','张财务','2026-06-15 14:10','目的港 THC，2 个柜合开','待审核'],
    ['AGB-20260616004','鹏程拖车','PC-260616-11','2026-06','2026-07-01 23:59','CNY','5400','3','李操作','2026-06-16 10:05','6 月上半月拖车汇总，含 3 个柜','待核销'],
    ['AGB-20260616005','深圳报关行','SZ-CD-260616','2026-06','2026-07-16 23:59','CNY','1050','3','李操作','2026-06-16 10:05','3 票报关费合开','部分核销'],
    ['AGB-20260610006','CMA CGM','CMA-INV-260610','2026-06','2026-07-10 23:59','USD','3600','1','张财务','2026-06-10 11:20','','全部核销'],
    ['AGB-20260608007','MSC','MSC-INV-260608','2026-06','2026-07-08 23:59','USD','900','1','李操作','2026-06-08 16:40','重复开票，已作废','作废']
],[
    {label:'流水号',type:'text'},
    {label:'服务商',type:'select',options:FCL_AGENT_OPTIONS},
    {label:'服务商账单号',type:'text'},
    {label:'账单周期',type:'text'},
    {label:'账期时间',type:'text'},
    {label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},
    {label:'账单状态',type:'select',options:['待对账','待请款','待审核','待核销','部分核销','全部核销','作废']}
]);
TC['fcl-agent-bill'].modalExcludedFields=['涉及Job数','导入人','导入时间','账期时间','账单状态'];
TC['fcl-agent-bill'].fieldOptions={
    '服务商':FCL_AGENT_OPTIONS,'币别':FCL_CURRENCY_OPTIONS
};
/* 服务商账单号 = 代理发票上印的号，人工录；不写这条会被「编号」启发式判成只读自动生成 */
TC['fcl-agent-bill'].modalFieldTypes={'服务商账单号':'text'};
/* 全局正则不认这三个词，显式覆写：没有服务商和金额，这张账单后面摊不了也付不了 */
TC['fcl-agent-bill'].requiredOverrides={'服务商':true,'服务商账单号':true,'账单金额':true};
TC['fcl-agent-bill'].modalCols=3;
TC['fcl-agent-bill'].modalFieldClass={'备注':'modal-remark-full'};

/* 账单费用明细 —— 供应商按 Job No 维度给的费用行，账单头只留发票级信息。
 * 结构：流水号 → [{job, feeName, feeKind, cur, amt, remark}]。
 * 「涉及Job数」= 这里去重后的 Job 个数，账单金额 = 明细合计。 */
var _agentBillDetails={
    'AGB-20260615001':[
        {job:'FBK-20260613001',feeName:'海运费',feeKind:'海运费',cur:'USD',amt:'4200',remark:'40HQ×1'},
        {job:'FBK-20260612002',feeName:'海运费',feeKind:'海运费',cur:'USD',amt:'4200',remark:'40HQ×1'},
        {job:'FBK-20260611003',feeName:'海运费',feeKind:'海运费',cur:'USD',amt:'4200',remark:'40HQ×1'}
    ],
    'AGB-20260615002':[
        {job:'FBK-20260612002',feeName:'海运费',feeKind:'海运费',cur:'USD',amt:'5180',remark:'2×40HQ 整柜价'}
    ],
    'AGB-20260615003':[
        {job:'FBK-20260613001',feeName:'THC',feeKind:'附加费',cur:'USD',amt:'600',remark:'目的港 THC'},
        {job:'FBK-20260612002',feeName:'THC',feeKind:'附加费',cur:'USD',amt:'600',remark:'目的港 THC'}
    ],
    'AGB-20260616004':[
        {job:'FBK-20260613001',feeName:'拖车费',feeKind:'拖车费',cur:'CNY',amt:'1800',remark:'蛇口提柜'},
        {job:'FBK-20260612002',feeName:'拖车费',feeKind:'拖车费',cur:'CNY',amt:'1800',remark:'蛇口提柜'},
        {job:'FBK-20260611003',feeName:'拖车费',feeKind:'拖车费',cur:'CNY',amt:'1800',remark:'南沙提柜'}
    ],
    'AGB-20260616005':[
        {job:'FBK-20260613001',feeName:'报关费',feeKind:'报关费',cur:'CNY',amt:'350',remark:''},
        {job:'FBK-20260612002',feeName:'报关费',feeKind:'报关费',cur:'CNY',amt:'350',remark:''},
        {job:'FBK-20260611003',feeName:'报关费',feeKind:'报关费',cur:'CNY',amt:'350',remark:''}
    ],
    'AGB-20260610006':[
        {job:'FBK-20260609006',feeName:'海运费',feeKind:'海运费',cur:'USD',amt:'3600',remark:''}
    ],
    'AGB-20260608007':[
        {job:'FBK-20260609006',feeName:'文件费',feeKind:'单证费',cur:'USD',amt:'900',remark:'与 CMA 发票重复'}
    ]
};
/* 服务商收款信息 —— 生成应付账单时带出，避免让人再去档案里翻。
 * 服务商档案 base-provider 用的是中文全称（中远海运集运…），
 * 代理账单用的是业内简称（COSCO…），两边名字对不上，这里按简称直接给一份。 */
var FCL_AGENT_BANK={
    'MAERSK':{payee:'MAERSK CHINA LTD',acct:'808-221-556677',bank:'汇丰银行深圳分行',term:'月结30天',swift:'HSBCCNSHSEN'},
    'COSCO':{payee:'中远海运集装箱运输有限公司',acct:'4563-118-990011',bank:'中国银行上海分行',term:'票结',swift:'BKCHCNBJ300'},
    'CMA CGM':{payee:'CMA CGM CHINA',acct:'6225-880-123456791',bank:'建设银行上海分行',term:'月结30天',swift:'PCBCCNBJSHX'},
    'MSC':{payee:'地中海航运（中国）有限公司',acct:'6225-880-123456793',bank:'招商银行深圳分行',term:'月结30天',swift:'CMBCCNBS518'},
    'ONE':{payee:'OCEAN NETWORK EXPRESS',acct:'7712-336-004488',bank:'三菱日联银行上海分行',term:'月结30天',swift:'BOTKCNSH'},
    '鹏程拖车':{payee:'深圳鹏程运输有限公司',acct:'6225-905-778899',bank:'招商银行深圳蛇口支行',term:'月结15天',swift:''},
    '深圳报关行':{payee:'深圳市中远报关有限公司',acct:'4000-772-113344',bank:'工商银行深圳福田支行',term:'月结30天',swift:''},
    '广州报关行':{payee:'广州穗通报关有限公司',acct:'4000-663-220099',bank:'工商银行广州天河支行',term:'月结30天',swift:''},
    '中外运':{payee:'中国外运华南有限公司',acct:'3602-118-445566',bank:'建设银行广州分行',term:'月结60天',swift:''}
};
function fclAgentBankOf(agent){
    return FCL_AGENT_BANK[agent]||{payee:agent||'',acct:'',bank:'',term:'月结30天',swift:''};
}
function agentBillDetailsOf(billNo){return _agentBillDetails[billNo]||[];}
/* 明细里出现的 Job 去重清单 —— 「涉及Job数」与详情弹窗的分组都用它 */
function agentBillJobsOf(billNo){
    var out=[];
    agentBillDetailsOf(billNo).forEach(function(d){if(d.job&&out.indexOf(d.job)<0)out.push(d.job);});
    return out;
}
/* 账单里的主费用名称：明细可能有多种费用名，取金额最大的那种代表这张账单
 *（一级分摊的弹窗抬头要显示，代理实际成本按费用名称回写也要用） */
function agentBillMainFeeOf(billNo){
    var sum={},kind={},best='',bestAmt=-1;
    agentBillDetailsOf(billNo).forEach(function(d){
        var k=d.feeName||'';
        if(!k)return;
        sum[k]=(sum[k]||0)+(fclParseMoney(d.amt)||0);
        kind[k]=d.feeKind||'';
    });
    Object.keys(sum).forEach(function(k){if(sum[k]>bestAmt){bestAmt=sum[k];best=k;}});
    return {feeName:best,feeKind:kind[best]||''};
}

/* ===== 代理账单：查看详情 —— 看的是这张发票里按 Job No 给的费用明细 ===== */
function openAgentBillDetail(id,rowIdx){
    id=id||'fcl-agent-bill';
    var idx=(rowIdx===undefined||rowIdx<0)?((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1):rowIdx;
    if(idx<0){showToast(tr('请先勾选要查看的代理账单'));return;}
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到账单'));return;}
    var billNo=fclFinGet(id,row,'流水号');
    var list=agentBillDetailsOf(billNo);
    var cur=fclFinGet(id,row,'币别');
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('账单费用明细')+' - '+billNo;
    var h='<div class="space-y-4">';
    /* 发票级信息 */
    h+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">';
    [['流水号',billNo],['服务商',fclFinGet(id,row,'服务商')],['服务商账单号',fclFinGet(id,row,'服务商账单号')],
     ['账单周期',fclFinGet(id,row,'账单周期')],['账期时间',fclFinGet(id,row,'账期时间')],
     ['分摊规则',_AGENT_BILL_RULE[billNo]||''],['账单金额',cur+' '+fclFinGet(id,row,'账单金额')],
     ['涉及Job数',fclFinGet(id,row,'涉及Job数')],['导入人',fclFinGet(id,row,'导入人')],
     ['账单状态',fclFinGet(id,row,'账单状态')]].forEach(function(p){
        h+='<div><span class="text-xs text-text-muted block">'+tr(p[0])+'</span><span class="font-medium text-text-primary">'+esc(p[1]||'—')+'</span></div>';
    });
    h+='</div>';
    /* 费用明细：按 Job No 分组 */
    h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('费用明细（按 Job No）')+'</span>'+
       '<span class="text-xs text-text-muted">'+tr('共')+' '+agentBillJobsOf(billNo).length+' '+tr('个 Job')+' / '+list.length+' '+tr('条费用')+'</span></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto" style="max-height:420px"><table class="w-full text-sm"><thead class="sticky top-0"><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-2 text-left font-semibold" style="width:48px">#</th>';
    ['Job No','费用名称','费用类别','币别','金额','备注'].forEach(function(t){h+='<th class="px-3 py-2 text-left font-semibold whitespace-nowrap">'+tr(t)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!list.length){
        h+='<tr><td colspan="7" class="px-3 py-12 text-center text-text-muted">'+tr('该账单暂无费用明细')+'</td></tr>';
    }
    var total=0,lastJob='';
    list.forEach(function(d,i){
        total+=(fclParseMoney(d.amt)||0);
        /* 同一个 Job 的第二行起不再重复显示 Job No，看着更像分组 */
        var showJob=d.job!==lastJob;lastJob=d.job;
        h+='<tr class="border-t border-surface-100'+(showJob&&i?' border-t-surface-300':'')+'">';
        h+='<td class="px-3 py-2 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-3 py-2 whitespace-nowrap '+(showJob?'font-medium text-primary-700':'text-text-muted')+'">'+(showJob?esc(d.job):'　〃')+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(tr(d.feeName||'—'))+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(tr(d.feeKind||'—'))+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(d.cur||cur)+'</td>';
        h+='<td class="px-3 py-2 font-semibold text-blue-700">'+esc(d.amt||'')+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(d.remark||'')+'</td>';
        h+='</tr>';
    });
    h+='</tbody></table></div>';
    h+='<div class="mt-2 text-sm text-text-secondary">'+tr('明细合计')+' <span class="font-semibold text-text-primary">'+cur+' '+total.toFixed(2)+'</span>';
    var billAmt=fclParseMoney(fclFinGet(id,row,'账单金额'));
    if(billAmt!==null&&Math.abs(billAmt-total)>0.01){
        h+=' <span class="text-red-500">'+tr('与账单金额不符')+'（'+tr('账单')+' '+billAmt.toFixed(2)+'）</span>';
    }
    h+='</div></div>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function openSelectedAgentBillDetail(id){openAgentBillDetail(id||'fcl-agent-bill',-1);}

/* ===== 代理账单：对账 =====
 * 版式沿用代理实际成本的「差异分析」，但比的是这张发票的费用明细 vs 预估成本，
 * 并按需求去掉「判定」列 —— 差异金额/差异率已经把问题说清楚了。
 * 底部给「确认费用」：确认后账单从「待对账」进入「待请款」。 */
function openAgentBillReconcile(id){
    id=id||'fcl-agent-bill';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要对账的代理账单'));return;}
    if(idxs.length>1){showToast(tr('对账一次只能选一张账单'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到账单'));return;}
    var st=fclFinGet(id,row,'账单状态');
    if(st==='作废'){showToast(tr('已作废的账单不能对账'));return;}
    var billNo=fclFinGet(id,row,'流水号');
    var cur=fclFinGet(id,row,'币别');
    var list=agentBillDetailsOf(billNo);
    var tolR=FCL_RECON_TOLERANCE.rate,tolA=FCL_RECON_TOLERANCE.amount;
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       tr('流水号')+' <span class="font-semibold text-text-primary">'+esc(billNo)+'</span>　'+
       tr('服务商')+' <span class="font-semibold text-text-primary">'+esc(fclFinGet(id,row,'服务商'))+'</span>　'+
       tr('容差')+' ±'+tolR+'% / ±'+tolA+
       '<div class="mt-1 text-xs text-text-muted">'+
       esc(tr('按发票里每个 Job 的费用行，与「预估成本明细」同 Job 同费用科目的金额逐条比对。'))+
       '</div></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto" style="max-height:380px"><table class="w-full text-sm">'+
       '<thead class="bg-surface-50 sticky top-0"><tr>'+
       ['Job No','费用名称','币别','预估金额','账单金额','差异金额','差异率'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';
       }).join('')+'</tr></thead><tbody>';
    if(!list.length){
        b+='<tr><td colspan="7" class="px-3 py-12 text-center text-sm text-text-muted">'+tr('该账单暂无费用明细')+'</td></tr>';
    }
    var sumE=0,sumA=0,nDiff=0,nMiss=0,lastJob='';
    list.forEach(function(d){
        var est=fclEstMapOf(d.job)||{};
        var e=est[d.feeName];
        var ev=e?e.amt:null;
        var av=fclParseMoney(d.amt)||0;
        var diff=(ev===null)?null:+(av-ev).toFixed(2);
        var rate=(ev)?((diff/ev*100).toFixed(2)+'%'):'—';
        if(ev===null)nMiss++;
        else if(Math.abs(diff)>tolA||(ev&&Math.abs(diff/ev*100)>tolR))nDiff++;
        sumE+=(ev||0);sumA+=av;
        var showJob=d.job!==lastJob;lastJob=d.job;
        b+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 whitespace-nowrap '+(showJob?'font-medium text-primary-700':'text-text-muted')+'">'+(showJob?esc(d.job):'　〃')+'</td>'+
           '<td class="px-3 py-2 text-text-primary whitespace-nowrap">'+esc(tr(d.feeName||''))+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(d.cur||cur)+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+(ev===null?'<span class="text-amber-600">'+tr('预估缺项')+'</span>':ev.toFixed(2))+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+av.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 '+(diff&&diff!==0?'text-red-600':'text-text-secondary')+'">'+(diff===null?'—':diff.toFixed(2))+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(rate)+'</td>'+
           '</tr>';
    });
    if(list.length){
        var sd=+(sumA-sumE).toFixed(2);
        b+='<tr class="border-t-2 border-surface-200 bg-surface-50 font-semibold">'+
           '<td class="px-3 py-2 text-text-primary" colspan="3">'+tr('合计')+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+sumE.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+sumA.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 '+(sd?'text-red-600':'text-text-secondary')+'">'+sd.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+(sumE?((sd/sumE*100).toFixed(2)+'%'):'—')+'</td></tr>';
    }
    b+='</tbody></table></div>';
    b+='<div class="mt-3 text-sm text-text-secondary">'+
       tr('预估缺项')+' <span class="font-semibold text-amber-600">'+nMiss+'</span> '+tr('项')+'　'+
       tr('超容差')+' <span class="font-semibold text-red-600">'+nDiff+'</span> '+tr('项')+'</div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('对账')+' - '+billNo;
    document.getElementById('crud-modal-body').innerHTML=b;
    var canConfirm=(st==='待对账');
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>'+
        (canConfirm
            ?'<button onclick="confirmAgentBillFee(\''+id+'\','+idxs[0]+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认费用')+'</button>'
            :'<button disabled title="'+esc(tr('仅「待对账」的账单需要确认费用'))+'" class="px-4 py-2 text-sm font-medium text-text-muted bg-surface-100 rounded-lg cursor-not-allowed">'+tr('确认费用')+'（'+tr(st)+'）</button>');
    document.getElementById('crud-modal').classList.add('show');
}
/* 确认费用：待对账 -> 待请款 */
function confirmAgentBillFee(id,rowIdx){
    id=id||'fcl-agent-bill';
    var row=fclFinRows(id)[rowIdx];
    if(!row){showToast(tr('未找到账单'));return;}
    if(fclFinGet(id,row,'账单状态')!=='待对账'){showToast(tr('仅「待对账」的账单可确认费用'));return;}
    fclFinSet(id,row,'账单状态','待请款');
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('费用已确认')+'：'+fclFinGet(id,row,'流水号')+'，'+tr('账单进入「待请款」'));
}

/* ===== 代理账单：生成账单（应付） =====
 * 带出服务商收款信息 + 本张发票的费用明细，确认后写一条应付账单，
 * 代理账单进入「待审核」（等应付那边审批）。 */
function openAgentBillGenerateAp(id){
    id=id||'fcl-agent-bill';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要生成付款单的代理账单'));return;}
    if(idxs.length>1){showToast(tr('生成付款单一次只能选一张'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到账单'));return;}
    var st=fclFinGet(id,row,'账单状态');
    if(st!=='待请款'){showToast(tr('仅「待请款」的账单可生成付款单，当前为')+'「'+tr(st)+'」');return;}
    var billNo=fclFinGet(id,row,'流水号');
    var agent=fclFinGet(id,row,'服务商');
    var cur=fclFinGet(id,row,'币别');
    var bank=fclAgentBankOf(agent);
    var list=agentBillDetailsOf(billNo);
    var jobs=agentBillJobsOf(billNo);
    var total=list.reduce(function(s,d){return s+(fclParseMoney(d.amt)||0);},0);
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('生成付款单')+' - '+billNo;
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    var roCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary cursor-not-allowed';
    var h='<div class="space-y-4">';
    /* ① 服务商与收款信息 */
    h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('① 服务商与收款信息')+'</span></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">';
    function fld(label,val,ro,fid){
        return '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+'</label>'+
            '<input'+(fid?' id="'+fid+'"':'')+(ro?' readonly':'')+' value="'+esc(val||'')+'" class="'+(ro?roCls:inCls)+'"></div>';
    }
    h+=fld('服务商',agent,true);
    h+=fld('服务商账单号',fclFinGet(id,row,'服务商账单号'),true);
    h+=fld('账单周期',fclFinGet(id,row,'账单周期'),true);
    h+=fld('收款户名',bank.payee,false,'apgen-payee');
    h+=fld('银行账号',bank.acct,false,'apgen-acct');
    h+=fld('开户行',bank.bank,false,'apgen-bank');
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('账期')+'</label>'+
       '<select id="apgen-term" class="'+inCls+'">'+['票结','月结15天','月结30天','月结60天'].map(function(o){
           return '<option'+(o===bank.term?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('期望付款时间')+'</label>'+
       '<input id="apgen-paydate" type="date" value="2026-09-30" class="'+inCls+'"></div>';
    h+=fld('SWIFT',bank.swift,true);
    h+='<div class="flex flex-col gap-1.5 md:col-span-3"><label class="text-sm font-medium text-text-secondary">'+tr('付款用途')+'</label>'+
       '<input id="apgen-purpose" value="'+esc(agentBillMainFeeOf(billNo).feeName||tr('代理费用'))+'" class="'+inCls+'"></div>';
    h+='</div></div>';
    /* ② 费用明细 */
    h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('② 费用明细')+'</span>'+
       '<span class="text-xs text-text-muted">'+tr('共')+' '+jobs.length+' '+tr('个 Job')+' / '+list.length+' '+tr('条费用')+'</span></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto" style="max-height:260px"><table class="w-full text-sm"><thead class="sticky top-0"><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-2 text-left font-semibold" style="width:48px">#</th>';
    ['Job No','费用名称','费用类别','币别','金额','备注'].forEach(function(t){h+='<th class="px-3 py-2 text-left font-semibold whitespace-nowrap">'+tr(t)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!list.length)h+='<tr><td colspan="7" class="px-3 py-10 text-center text-text-muted">'+tr('该账单暂无费用明细')+'</td></tr>';
    var lastJob2='';
    list.forEach(function(d,i){
        var showJob=d.job!==lastJob2;lastJob2=d.job;
        h+='<tr class="border-t border-surface-100">';
        h+='<td class="px-3 py-2 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-3 py-2 whitespace-nowrap '+(showJob?'font-medium text-primary-700':'text-text-muted')+'">'+(showJob?esc(d.job):'　〃')+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(tr(d.feeName||'—'))+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(tr(d.feeKind||'—'))+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(d.cur||cur)+'</td>';
        h+='<td class="px-3 py-2 font-semibold text-blue-700">'+esc(d.amt||'')+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(d.remark||'')+'</td>';
        h+='</tr>';
    });
    h+='</tbody></table></div>';
    h+='<div class="mt-2 text-sm text-text-secondary">'+tr('应付合计')+' <span class="font-semibold text-text-primary">'+cur+' '+total.toFixed(2)+'</span></div>';
    h+='</div></div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmAgentBillGenerateAp(\''+id+'\','+idxs[0]+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认生成付款单')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function confirmAgentBillGenerateAp(id,rowIdx){
    id=id||'fcl-agent-bill';
    var row=fclFinRows(id)[rowIdx];
    if(!row){showToast(tr('未找到账单'));return;}
    if(fclFinGet(id,row,'账单状态')!=='待请款'){showToast(tr('仅「待请款」的账单可生成付款单'));return;}
    var billNo=fclFinGet(id,row,'流水号');
    var agent=fclFinGet(id,row,'服务商');
    var cur=fclFinGet(id,row,'币别');
    var list=agentBillDetailsOf(billNo);
    if(!list.length){showToast(tr('该账单没有费用明细，无法生成付款单'));return;}
    var payee=((document.getElementById('apgen-payee')||{}).value||'').trim();
    var acct=((document.getElementById('apgen-acct')||{}).value||'').trim();
    var bankName=((document.getElementById('apgen-bank')||{}).value||'').trim();
    if(!payee||!acct){showToast(tr('请填写收款户名与银行账号'));return;}
    var term=((document.getElementById('apgen-term')||{}).value||'月结30天');
    var payDate=((document.getElementById('apgen-paydate')||{}).value||'');
    var purpose=((document.getElementById('apgen-purpose')||{}).value||'').trim();
    var total=list.reduce(function(s,d){return s+(fclParseMoney(d.amt)||0);},0);
    var apNo=fclSeqNo('FAP','fcl-ap-bill');
    /* 费用行抄一份挂到付款单下，「查看」才有东西看 */
    _FCL_AP_FEES[apNo]=list.map(function(d){
        return {no:d.job,feeName:d.feeName,feeKind:d.feeKind,cur:d.cur,amt:d.amt,remark:d.remark||''};
    });
    fclPushRow('fcl-ap-bill',{
        '付款单号':apNo,
        '服务商':agent,
        '账单周期':fclFinGet(id,row,'账单周期'),
        '涉及Job数':String(agentBillJobsOf(billNo).length),
        '费用行数':String(list.length),
        '币别':cur,
        '应付金额':total.toFixed(2),
        '已付金额':'0',
        '待付金额':total.toFixed(2),
        '账期':term,
        '付款用途':purpose||agentBillMainFeeOf(billNo).feeName,
        '期望付款时间':payDate,
        '到期日':payDate,
        '收款账号':payee+' / '+bankName+' '+acct,
        '申请人':fclWho(),
        '申请时间':fclNow(),
        '账单状态':'待审批'
    });
    /* 代理账单进入待审核（等应付那边审批） */
    fclFinSet(id,row,'账单状态','待审核');
    if(typeof _listData!=='undefined')delete _listData['fcl-ap-bill'];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('已生成付款单')+' '+apNo+'（'+cur+' '+total.toFixed(2)+'），'+tr('代理账单进入「待审核」'));
}

/* ==========================================================================
 * 二、柜内票清单 —— 一个柜里装了谁的货、多少件/体积/重量
 * 这是「按件数/体积/重量」分摊唯一的取数来源：
 * Job 级权重 = 该 Job 下所有非作废票的合计，不在 fcl-booking 上另加列，
 * 免得汇总值和明细对不上。
 * ========================================================================== */
addPrototypeTable('fcl-job-cargo','柜内票清单',
    '装箱明细号|Job No|委托订单号|客户名称|品名|件数|体积(CBM)|重量(KG)|装柜时间|分摊成本合计|币别|备注|状态|操作',
    ['待装柜','已装柜','已出运','已作废'],[
    /* FBK-20260613001 是拼柜，3 个客户共用一个 40HQ，合计 320 件 / 58.0 CBM / 12400 KG */
    ['JCG-20260613001','FBK-20260613001','FEO-20260613001','深圳市华运达国际货运','家具配件','120','21.0','5200','2026-06-18 14:20','1575.00','USD','','已出运'],
    ['JCG-20260613002','FBK-20260613001','FEO-20260613007','广州远洋进出口贸易','五金工具','90','18.5','4100','2026-06-18 15:10','1181.25','USD','','已出运'],
    ['JCG-20260613003','FBK-20260613001','FEO-20260613012','东莞市鑫海物流','塑料制品','110','18.5','3100','2026-06-18 16:00','1443.75','USD','','已出运'],
    /* FBK-20260612002 两票 */
    ['JCG-20260612004','FBK-20260612002','FEO-20260612002','广州远洋进出口贸易','建材','80','26.5','9800','2026-06-20 10:30','','','','已出运'],
    ['JCG-20260612005','FBK-20260612002','FEO-20260612009','上海锦程国际贸易','陶瓷制品','50','11.2','5600','2026-06-20 11:15','','','','已出运'],
    /* 整柜独占，一个 Job 只有一票 —— 二级分摊时应原样落地不拆 */
    ['JCG-20260611006','FBK-20260611003','FEO-20260611003','东莞市鑫海物流','电子元件','260','54.0','8900','2026-06-23 09:40','','','客户整柜独占','已装柜'],
    ['JCG-20260609007','FBK-20260609006','FEO-20260609007','广州分公司','纺织品','180','52.0','7400','2026-06-14 13:50','','','','已出运']
],[
    {label:'装箱明细号',type:'text'},
    {label:'Job No',type:'text'},
    {label:'委托订单号',type:'text'},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'装柜时间',type:'date'},
    {label:'状态',type:'select',options:['待装柜','已装柜','已出运','已作废']}
]);
TC['fcl-job-cargo'].modalExcludedFields=['装箱明细号','分摊成本合计','币别','状态'];
/* Job No 走下拉：手敲错一个字符，后面按 Job 取分摊基数就全取不到了。
 * 传函数引用（不加括号）——弹窗打开那一刻才求值，主单表随时新增都能选到。 */
TC['fcl-job-cargo'].fieldOptions={'客户名称':FCL_CUSTOMER_OPTIONS,'Job No':fclJobNoOptions};
/* 委托订单号是业务已有的单号，不是这张表自己生成的，要能选/能填 */
TC['fcl-job-cargo'].modalFieldTypes={'委托订单号':'text','装柜时间':'date'};
/* 三个都是分摊基数，缺一个这张票就摊不了；全局正则一个都不认 */
TC['fcl-job-cargo'].requiredOverrides={'Job No':true,'委托订单号':true,'件数':true,
    '装柜时间':false};   /* 「待装柜」的票本来就还没有装柜时间 */
TC['fcl-job-cargo'].modalCols=3;
TC['fcl-job-cargo'].modalFieldClass={'备注':'modal-remark-full'};

/* ==========================================================================
 * 三、单票成本明细 —— 二级分摊（Job 成本 → 柜内各票）的产物
 * 有了它，拼柜里每个客户的单票毛利才算得出来。
 * ========================================================================== */
addPrototypeTable('fcl-shipment-cost','单票成本明细',
    '单票成本号|Job No|委托订单号|客户名称|费用名称|费用类别|币别|Job成本金额|分摊方式|分摊权重|分摊金额|来源实际成本号|分摊人|分摊时间|备注|状态|操作',
    ['已分摊','已确认','已作废'],[
    ['FSC-20260616001','FBK-20260613001','FEO-20260613001','深圳市华运达国际货运','海运费','海运费','USD','4200','按件数','120','1575.00','FAC-20260613001','张财务','2026-06-16 11:05','','已分摊'],
    ['FSC-20260616002','FBK-20260613001','FEO-20260613007','广州远洋进出口贸易','海运费','海运费','USD','4200','按件数','90','1181.25','FAC-20260613001','张财务','2026-06-16 11:05','','已分摊'],
    ['FSC-20260616003','FBK-20260613001','FEO-20260613012','东莞市鑫海物流','海运费','海运费','USD','4200','按件数','110','1443.75','FAC-20260613001','张财务','2026-06-16 11:05','尾差 0.00 落在本行','已分摊']
],[
    {label:'单票成本号',type:'text'},
    {label:'Job No',type:'text'},
    {label:'委托订单号',type:'text'},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'费用类别',type:'select',options:FCL_FEE_KINDS},
    {label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},
    {label:'状态',type:'select',options:['已分摊','已确认','已作废']}
]);
/* 这张表全部由二级分摊生成，不给手工新增字段留口子 */
TC['fcl-shipment-cost'].modalExcludedFields=['Job成本金额','分摊方式','分摊权重','分摊金额',
    '来源实际成本号','分摊人','分摊时间','状态'];
TC['fcl-shipment-cost'].fieldOptions={
    '客户名称':FCL_CUSTOMER_OPTIONS,'费用类别':FCL_FEE_KINDS,'币别':FCL_CURRENCY_OPTIONS
};
TC['fcl-shipment-cost'].modalFieldTypes={'委托订单号':'text'};

/* ==========================================================================
 * 四、公共小工具
 * ========================================================================== */
/* 按表头建一整行，缺的列自动补空 —— 直接 push 到 TC.d，写 _listData 下次渲染就没了 */
function fclNewRowFor(id,map){
    var c=TC[id]||{},h=c.h||[];
    var width=(c.d&&c.d.length)?c.d[0].length:h.length-1;
    return h.slice(0,width).map(function(name){return map[name]==null?'':String(map[name]);});
}
function fclPushRow(id,map){
    var c=TC[id];if(!c)return null;
    if(!c.d)c.d=[];
    var row=fclNewRowFor(id,map);
    c.d.push(row);
    return row;
}
/* 单号：前缀 + 当天日期 + 表内序号，够原型演示用 */
function fclSeqNo(prefix,id){
    var d=new Date(),p=function(n){return String(n).padStart(2,'0');};
    var n=((TC[id]||{}).d||[]).length+1;
    return prefix+'-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+String(n).padStart(3,'0');
}
function fclNow(){
    return (typeof receiptNowStr==='function')?receiptNowStr().slice(0,16):'';
}
function fclWho(){
    return (typeof getCurrentUserName==='function')?getCurrentUserName():'admin';
}
function fclMoneyText(v){
    var n=fclParseMoney(v);
    return n===null?'—':n.toFixed(2);
}
/* Job No 下拉：取主单表里未作废的 Job */
function fclJobNoOptions(){
    var c=TC['fcl-booking'];if(!c||!c.d)return [];
    var h=c.h||[],iNo=h.indexOf('Job No'),iSt=h.indexOf('订舱状态');
    if(iNo<0)return [];
    var out=[];
    c.d.forEach(function(r){
        var no=String(r[iNo]||'');
        if(!no)return;
        if(iSt>=0&&String(r[iSt]||'')==='已作废')return;
        if(out.indexOf(no)<0)out.push(no);
    });
    return out;
}
/* 某 Job 的柜内票（排除作废），返回结构化对象供分摊取权重 */
function fclJobCargoOf(job){
    var c=TC['fcl-job-cargo'];if(!c||!c.d||!job)return [];
    var h=c.h||[];
    var i=function(n){return h.indexOf(n);};
    var iJ=i('Job No'),iE=i('委托订单号'),iC=i('客户名称'),
        iP=i('件数'),iV=i('体积(CBM)'),iW=i('重量(KG)'),iS=i('状态');
    if(iJ<0)return [];
    return c.d.filter(function(r){
        return String(r[iJ]||'')===job&&(iS<0||String(r[iS]||'')!=='已作废');
    }).map(function(r){
        return {
            row:r,
            entrust:iE>=0?String(r[iE]||''):'',
            customer:iC>=0?String(r[iC]||''):'',
            pkg:iP>=0?fclParseMoney(r[iP]):null,
            vol:iV>=0?fclParseMoney(r[iV]):null,
            wt:iW>=0?fclParseMoney(r[iW]):null
        };
    });
}
/* Job 级权重 = 柜内各票合计；取不到明细时重量退回主单上的「货重」 */
function fclJobSumOf(job,basis){
    var list=fclJobCargoOf(job);
    if(list.length){
        var sum=0,got=false;
        list.forEach(function(x){
            var v=basis==='pkg'?x.pkg:basis==='vol'?x.vol:x.wt;
            if(v!==null){sum+=v;got=true;}
        });
        if(got)return sum;
    }
    if(basis==='wt'){
        var c=TC['fcl-booking'];
        if(c&&c.d){
            var h=c.h||[],iNo=h.indexOf('Job No'),iW=h.indexOf('货重');
            if(iNo>=0&&iW>=0){
                var hit=c.d.find(function(r){return String(r[iNo]||'')===job;});
                if(hit)return fclParseMoney(hit[iW]);
            }
        }
    }
    return null;
}
/* 服务商档案里的账期写法不统一（「月结」「月结 30 天」都有），
 * 归一到付款申请下拉的四个选项，对不上就按最保守的票结走 */
function fclNormalizeTerm(text){
    var t=String(text||'').replace(/\s/g,'');
    if(!t)return '票结';
    if(/票结|预付|现结/.test(t))return '票结';
    if(/15/.test(t))return '月结15天';
    if(/60/.test(t))return '月结60天';
    if(/30/.test(t)||/^月结$/.test(t))return '月结30天';
    return '票结';
}
/* 服务商档案里的账期 / 收款账号，付款申请时用来预填。
 * 档案里中英文名并存（「中远海运集运」/「COSCO Shipping」），
 * 而业务上用的是 COSCO 这种简称，所以两列都要比。 */
function fclProviderInfoOf(agent){
    var out={term:'票结',account:''};
    var c=TC['base-provider'];
    if(!c||!c.d||!agent)return out;
    var h=c.h||[],iN=h.indexOf('服务商全称'),iE=h.indexOf('服务商全称（英文）'),
        iT=h.indexOf('账期'),iA=h.indexOf('银行账号'),iB=h.indexOf('开户行');
    if(iN<0&&iE<0)return out;
    var key=String(agent).toLowerCase();
    var like=function(v){
        v=String(v||'').toLowerCase();
        return !!v&&(v.indexOf(key)>=0||key.indexOf(v)>=0);
    };
    var hit=c.d.find(function(r){
        return (iN>=0&&like(r[iN]))||(iE>=0&&like(r[iE]));
    });
    if(!hit)return out;
    out.term=fclNormalizeTerm(iT>=0?hit[iT]:'');
    var acc=iA>=0?String(hit[iA]||''):'',bank=iB>=0?String(hit[iB]||''):'';
    out.account=[bank,acc].filter(Boolean).join(' ');
    return out;
}
/* 账期 → 到期日（从今天推） */
function fclDueDateFrom(term){
    var days={'票结':7,'月结15天':15,'月结30天':30,'月结60天':60}[term];
    var d=new Date();
    d.setDate(d.getDate()+(days||7));
    var p=function(n){return String(n).padStart(2,'0');};
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
}

/* ==========================================================================
 * 五、分摊引擎 —— 一级（账单→Job）和二级（Job成本→票）共用一套
 *
 * ⚠ 一级（代理账单→Job）已整套去掉：供应商本来就按 Job No 给费用明细，
 *   不需要我们再摊。入口 openAgentBillAlloc 与落地 submitAgentBillAlloc 都已删除，
 *   _fclAlloc.level 恒为 2。下面残留的 level===1 分支（取权重/标签/表头/按钮）
 *   走不到但保留：二级与它共用这套取数与算份逻辑，硬拆容易把二级改坏。
 *
 * 权重口径：票数=每份记 1；件数/体积/重量=从柜内票清单取；
 *           预估成本比例只在一级有意义（预估是挂在 Job 上的）。
 * 金额算法：前 n-1 份向下取两位小数，最后一份 = 总额 - 前面之和，
 *           尾差全部落在最后一行，保证合计恒等于待分摊金额。
 * ========================================================================== */
var FCL_ALLOC_BASES=[
    {key:'count',label:'按票数'},
    {key:'pkg',  label:'按件数'},
    {key:'vol',  label:'按体积'},
    {key:'wt',   label:'按重量'},
    {key:'est',  label:'按预估成本比例',level1Only:true}
];
function fclAllocBasisLabel(key){
    for(var i=0;i<FCL_ALLOC_BASES.length;i++)if(FCL_ALLOC_BASES[i].key===key)return FCL_ALLOC_BASES[i].label;
    return '';
}
var _fclAlloc={level:1,srcId:'',srcIdx:-1,total:0,currency:'',feeName:'',feeKind:'',
               agent:'',billNo:'',costNo:'',job:'',basis:'count',rows:[]};

/* 取某一份的权重；取不到返回 null（界面上标红提示补录） */
function fclAllocWeightOf(basis,target){
    if(!target)return null;
    if(basis==='count')return 1;
    if(_fclAlloc.level===1){
        if(basis==='est')return fclParseMoney(fclEstAmountOf(target,_fclAlloc.feeName));
        return fclJobSumOf(target,basis);
    }
    /* 二级：target 是委托订单号，直接从这个 Job 的柜内票里找 */
    var hit=fclJobCargoOf(_fclAlloc.job).find(function(x){return x.entrust===target;});
    if(!hit)return null;
    return basis==='pkg'?hit.pkg:basis==='vol'?hit.vol:basis==='wt'?hit.wt:null;
}
/* 按当前各行权重把总额摊下去；权重全缺或合计为 0 时回退平均分摊 */
function fclAllocCompute(silent){
    var rows=_fclAlloc.rows,total=_fclAlloc.total||0,n=rows.length;
    if(!n)return;
    var sum=rows.reduce(function(s,r){var w=fclParseMoney(r.w);return s+(w===null?0:w);},0);
    if(!sum){
        /* 没有一个能用的权重 —— 平均摊，并说明原因，不要静默给 0 */
        var each=Math.floor(total/n*100)/100,acc0=0;
        rows.forEach(function(r,i){
            var v=(i===n-1)?+(total-acc0).toFixed(2):each;
            acc0+=v;r.amt=v.toFixed(2);
        });
        if(!silent&&_fclAlloc.basis!=='count'){
            showToast(tr('所选对象都取不到')+'「'+tr(fclAllocBasisLabel(_fclAlloc.basis))+'」'+tr('的基数，已改用平均分摊'));
        }
        return;
    }
    var acc=0;
    rows.forEach(function(r,i){
        var w=fclParseMoney(r.w);w=(w===null?0:w);
        var v=(i===n-1)?+(total-acc).toFixed(2):Math.floor(total*w/sum*100)/100;
        acc+=v;r.amt=v.toFixed(2);
    });
}
/* 切换分摊方式：重取全部权重再重算金额 */
function fclAllocApplyBasis(sel){
    fclAllocReadRows();
    if(sel)_fclAlloc.basis=sel.value;
    _fclAlloc.rows.forEach(function(r){
        var w=fclAllocWeightOf(_fclAlloc.basis,r.target);
        r.w=(w===null?'':String(w));
    });
    fclAllocCompute();
    fclAllocRedraw();
}
function fclAllocReadRows(){
    _fclAlloc.rows.forEach(function(r,i){
        var t=document.querySelector('[data-fa-target="'+i+'"]');
        var w=document.querySelector('[data-fa-w="'+i+'"]');
        var a=document.querySelector('[data-fa-amt="'+i+'"]');
        if(t)r.target=String(t.value||'');
        if(w)r.w=String(w.value||'');
        if(a)r.amt=String(a.value||'');
    });
}
/* 手改权重 → 连带重算金额；手改金额 → 只刷合计条（允许人工覆写） */
function fclAllocOnWeight(i){
    fclAllocReadRows();fclAllocCompute(true);fclAllocRedraw();
}
function fclAllocOnAmount(i){
    fclAllocReadRows();
    var box=document.querySelector('[data-fa-sum]');
    if(box)box.outerHTML=fclAllocSummaryHtml();
}
function fclAllocOnTarget(i){
    fclAllocReadRows();
    var r=_fclAlloc.rows[i];
    if(r){
        var w=fclAllocWeightOf(_fclAlloc.basis,r.target);
        r.w=(w===null?'':String(w));
        r.label=fclAllocTargetLabel(r.target);
    }
    fclAllocCompute(true);fclAllocRedraw();
}
function fclAllocTargetLabel(target){
    if(_fclAlloc.level===2){
        var hit=fclJobCargoOf(_fclAlloc.job).find(function(x){return x.entrust===target;});
        return hit?hit.customer:'';
    }
    var list=fclJobCargoOf(target);
    if(!list.length)return tr('无柜内票清单');
    return list.length+' '+tr('票')+'　'+list.map(function(x){return x.customer;})
        .filter(function(v,i,a){return v&&a.indexOf(v)===i;}).join('、');
}
function fclAllocAddRow(){
    fclAllocReadRows();
    _fclAlloc.rows.push({target:'',label:'',w:'',amt:''});
    fclAllocRedraw();
}
function fclAllocRemoveRow(i){
    fclAllocReadRows();
    if(_fclAlloc.rows.length<=1){showToast(tr('至少保留一行'));return;}
    _fclAlloc.rows.splice(i,1);
    fclAllocCompute(true);
    fclAllocRedraw();
}
function fclAllocRedraw(){
    var box=document.querySelector('[data-fa-table]');
    if(box)box.innerHTML=fclAllocTableHtml();
}
function fclAllocBasisSelectHtml(){
    var h='<select data-fa-basis onchange="fclAllocApplyBasis(this)" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-white cursor-pointer">';
    FCL_ALLOC_BASES.forEach(function(b){
        if(b.level1Only&&_fclAlloc.level!==1)return;
        h+='<option value="'+b.key+'"'+(_fclAlloc.basis===b.key?' selected':'')+'>'+tr(b.label)+'</option>';
    });
    return h+'</select>';
}
function fclAllocTableHtml(){
    var total=_fclAlloc.total||0,lv=_fclAlloc.level;
    var jobOpts=lv===1?fclJobNoOptions():[];
    var wName=fclAllocBasisLabel(_fclAlloc.basis).replace('按','');
    var h='<div class="border border-surface-200 rounded-lg overflow-hidden">';
    h+='<table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary w-10">#</th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr(lv===1?'Job No':'委托订单号')+'<span class="text-red-500 ml-1">*</span></th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr(lv===1?'柜内票':'客户名称')+'</th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary w-28">'+esc(tr('权重')+'('+wName+')')+'</th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary w-32">'+tr('分摊金额')+'<span class="text-red-500 ml-1">*</span></th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary w-20">'+tr('占比')+'</th>'+
       (lv===1?'<th class="px-3 py-2 w-14"></th>':'')+'</tr></thead><tbody>';
    _fclAlloc.rows.forEach(function(r,i){
        var amt=fclParseMoney(r.amt);
        var wMissing=_fclAlloc.basis!=='count'&&!String(r.w||'').trim();
        h+='<tr class="border-t border-surface-100'+(wMissing?' bg-red-50/50':'')+'">'+
           '<td class="px-3 py-2 text-text-muted">'+(i+1)+'</td>';
        if(lv===1){
            h+='<td class="px-3 py-2"><select data-fa-target="'+i+'" onchange="fclAllocOnTarget('+i+')" class="w-full h-8 px-2 text-sm border border-surface-200 rounded-lg bg-surface-50 cursor-pointer">'+
               '<option value="">'+tr('请选择')+'</option>'+
               jobOpts.map(function(o){return '<option value="'+esc(o)+'"'+(r.target===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+
               '</select></td>';
        }else{
            h+='<td class="px-3 py-2 text-text-primary">'+esc(r.target)+
               '<input type="hidden" data-fa-target="'+i+'" value="'+esc(r.target)+'"></td>';
        }
        h+='<td class="px-3 py-2 text-xs text-text-secondary">'+esc(r.label||'')+'</td>'+
           '<td class="px-3 py-2"><input data-fa-w="'+i+'" type="number" step="0.01" value="'+esc(r.w)+'" oninput="fclAllocOnWeight('+i+')" '+
           (_fclAlloc.basis==='count'?'readonly ':'')+
           'class="w-full h-8 px-2 text-sm border border-surface-200 rounded-lg '+(_fclAlloc.basis==='count'?'bg-surface-100 cursor-not-allowed':'bg-surface-50')+'"'+
           (wMissing?' placeholder="'+esc(tr('缺基数'))+'"':'')+'></td>'+
           '<td class="px-3 py-2"><input data-fa-amt="'+i+'" type="number" step="0.01" value="'+esc(r.amt)+'" oninput="fclAllocOnAmount('+i+')" class="w-full h-8 px-2 text-sm border border-surface-200 rounded-lg bg-surface-50"></td>'+
           '<td class="px-3 py-2 text-text-secondary">'+((amt!==null&&total)?((amt/total*100).toFixed(2)+'%'):'—')+'</td>'+
           (lv===1?('<td class="px-3 py-2"><button type="button" onclick="fclAllocRemoveRow('+i+')" class="text-xs text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button></td>'):'')+
           '</tr>';
    });
    h+='</tbody></table></div>';
    h+=fclAllocSummaryHtml();
    return h;
}
function fclAllocSummaryHtml(){
    var total=_fclAlloc.total||0;
    var sum=_fclAlloc.rows.reduce(function(s,r){return s+(fclParseMoney(r.amt)||0);},0);
    var diff=+(total-sum).toFixed(2);
    var cls=diff===0?'text-success-700':'text-red-600';
    return '<div data-fa-sum class="mt-2 text-sm '+cls+'">'+
        tr('已分摊')+' <span class="font-semibold">'+sum.toFixed(2)+'</span>　'+
        tr('待分摊')+' <span class="font-semibold">'+total.toFixed(2)+'</span>　'+
        tr('差额')+' <span class="font-semibold">'+diff.toFixed(2)+'</span>'+
        (diff===0?('　'+tr('金额已分摊完毕')):('　'+tr('差额不为 0 无法提交')))+'</div>';
}
function fclAllocBodyHtml(headLine,tipLine){
    var h='';
    h+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       headLine+'<div class="mt-1 text-xs text-text-muted">'+esc(tipLine)+'</div></div>';
    h+='<div class="flex items-center gap-2 mb-2 flex-wrap">';
    h+='<span class="text-xs text-text-secondary">'+tr('分摊方式')+'</span>'+fclAllocBasisSelectHtml();
    if(_fclAlloc.level===1){
        h+='<button type="button" onclick="fclAllocAddRow()" class="h-8 px-3 text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">'+tr('添加一行')+'</button>';
    }
    h+='<button type="button" onclick="fclAllocApplyBasis()" class="h-8 px-3 text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">'+tr('重新取数并计算')+'</button>';
    h+='</div>';
    h+='<div data-fa-table>'+fclAllocTableHtml()+'</div>';
    return h;
}
function fclAllocOpenModal(title,headLine,tipLine){
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='66%';
    document.getElementById('crud-modal-title').textContent=title;
    document.getElementById('crud-modal-body').innerHTML=fclAllocBodyHtml(headLine,tipLine);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitFclAlloc()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认分摊')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* 一级分摊（代理账单 → Job）已去掉：供应商本来就按 Job No 给费用明细，
 * 不需要再由我们按件数/体积/重量去摊。分摊机制只保留二级（Job 成本 → 柜内各票）。 */

/* ===== 二级分摊：Job 成本 → 柜内各票 =====
 * 拼柜时一个柜装了几个客户的货，柜成本得摊到票上才有单票毛利。 */
function openShipmentAlloc(id){
    id=id||'fcl-agent-cost';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要分摊到票的成本行'));return;}
    if(idxs.length>1){showToast(tr('分摊到票一次只能选一行'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到成本行'));return;}
    var st=fclFinGet(id,row,'成本状态');
    if(['对账一致','已确认','已生成应付'].indexOf(st)<0){
        showToast(tr('只有对账通过的成本行才能摊到票，当前为')+'「'+tr(st)+'」');return;
    }
    var job=fclFinGet(id,row,'Job No');
    var list=fclJobCargoOf(job);
    if(!list.length){showToast(tr('该 Job 在「柜内票清单」里没有票，请先补录装箱明细'));return;}
    var total=fclParseMoney(fclFinGet(id,row,'实际金额'));
    if(total===null||total<=0){showToast(tr('该行没有实际金额，无法分摊'));return;}
    _fclAlloc={
        level:2,srcId:id,srcIdx:idxs[0],total:total,
        currency:fclFinGet(id,row,'币别'),
        feeName:fclFinGet(id,row,'费用名称'),
        feeKind:fclFinGet(id,row,'费用类别'),
        agent:fclFinGet(id,row,'服务商'),
        billNo:fclFinGet(id,row,'代理账单号'),
        costNo:fclFinGet(id,row,'流水号'),
        job:job,basis:'pkg',
        rows:list.map(function(x){
            return {target:x.entrust,label:x.customer,w:(x.pkg===null?'':String(x.pkg)),amt:''};
        })
    };
    fclAllocCompute(true);
    var head=esc(job)+'　'+esc(_fclAlloc.feeName)+'　'+
        tr('柜内')+' '+list.length+' '+tr('票')+'　'+
        tr('待分摊')+' <span class="font-semibold text-text-primary">'+esc(_fclAlloc.currency)+' '+total.toFixed(2)+'</span>';
    fclAllocOpenModal(tr('分摊到票')+' - '+_fclAlloc.costNo,head,
        tr('柜内票由「柜内票清单」带出，不能增删；重复分摊会覆盖该成本行上一次的结果。'));
}

/* 两级共用的提交：先校验，再按 level 落到不同的表 */
function submitFclAlloc(){
    fclAllocReadRows();
    var rows=_fclAlloc.rows.filter(function(r){return String(r.target||'').trim();});
    if(!rows.length){showToast(tr('请先选择分摊对象'));return;}
    var keys=rows.map(function(r){return r.target.trim();});
    if(new Set(keys).size!==keys.length){showToast(tr('同一个对象出现了多次，请合并后再分摊'));return;}
    if(rows.some(function(r){var v=fclParseMoney(r.amt);return v===null||v<=0;})){
        showToast(tr('每一份的分摊金额都必须大于 0'));return;
    }
    var sum=rows.reduce(function(s,r){return s+(fclParseMoney(r.amt)||0);},0);
    var diff=+((_fclAlloc.total||0)-sum).toFixed(2);
    if(diff!==0){showToast(tr('各份合计与待分摊金额差')+' '+diff+'，'+tr('请调平后再提交'));return;}
    submitShipmentAlloc(rows);   /* 一级分摊已去掉，这里只剩二级（Job 成本→柜内各票） */
}

/* 某张代理账单已经摊到几个 Job 上（去重） */
function fclJobCountOfBill(billNo){
    var c=TC['fcl-agent-cost'];
    if(!c||!c.d||!billNo)return 0;
    var h=c.h||[],iB=h.indexOf('代理账单号'),iJ=h.indexOf('Job No');
    if(iB<0||iJ<0)return 0;
    var set={};
    c.d.forEach(function(r){
        if(String(r[iB]||'')===billNo&&r[iJ])set[String(r[iJ])]=1;
    });
    return Object.keys(set).length;
}

/* 二级落地：重复分摊按覆盖处理，先清掉这条成本行上一次摊出来的票级明细 */
function submitShipmentAlloc(rows){
    var A=_fclAlloc,basisLabel=fclAllocBasisLabel(A.basis);
    var shipId='fcl-shipment-cost',c=TC[shipId];
    if(!c)return;
    if(!c.d)c.d=[];
    var h=c.h||[],iSrc=h.indexOf('来源实际成本号');
    var removed=0;
    if(iSrc>=0&&A.costNo){
        for(var i=c.d.length-1;i>=0;i--){
            if(String(c.d[i][iSrc]||'')===A.costNo){c.d.splice(i,1);removed++;}
        }
    }
    var now=fclNow(),who=fclWho();
    rows.forEach(function(r){
        fclPushRow(shipId,{
            '单票成本号':fclSeqNo('FSC',shipId),
            'Job No':A.job,
            '委托订单号':r.target.trim(),
            '客户名称':r.label||'',
            '费用名称':A.feeName,
            '费用类别':A.feeKind,
            '币别':A.currency,
            'Job成本金额':(A.total||0).toFixed(2),
            '分摊方式':basisLabel,
            '分摊权重':r.w,
            '分摊金额':fclParseMoney(r.amt).toFixed(2),
            '来源实际成本号':A.costNo,
            '分摊人':who,
            '分摊时间':now,
            '状态':'已分摊'
        });
    });
    fclRefreshCargoCostTotal(A.job,A.currency);
    if(typeof _listData!=='undefined'){delete _listData[shipId];delete _listData['fcl-job-cargo'];}
    closeCrudModal();
    fclFinRefresh(A.srcId);
    showToast(tr('已摊到')+' '+rows.length+' '+tr('票')+
        (removed?('，'+tr('覆盖上次的')+' '+removed+' '+tr('条')):'')+
        '，'+tr('可在「单票成本明细」查看'));
}
/* 把单票成本明细按票合计回写到柜内票清单的「分摊成本合计」 */
function fclRefreshCargoCostTotal(job,currency){
    var s=TC['fcl-shipment-cost'],g=TC['fcl-job-cargo'];
    if(!s||!s.d||!g||!g.d)return;
    var sh=s.h||[],siJ=sh.indexOf('Job No'),siE=sh.indexOf('委托订单号'),
        siA=sh.indexOf('分摊金额'),siS=sh.indexOf('状态');
    var gh=g.h||[],giJ=gh.indexOf('Job No'),giE=gh.indexOf('委托订单号'),
        giT=gh.indexOf('分摊成本合计'),giC=gh.indexOf('币别');
    if(siJ<0||siE<0||siA<0||giJ<0||giE<0||giT<0)return;
    var sums={};
    s.d.forEach(function(r){
        if(String(r[siJ]||'')!==job)return;
        if(siS>=0&&String(r[siS]||'')==='已作废')return;
        var k=String(r[siE]||'');
        sums[k]=(sums[k]||0)+(fclParseMoney(r[siA])||0);
    });
    g.d.forEach(function(r){
        if(String(r[giJ]||'')!==job)return;
        var k=String(r[giE]||'');
        if(sums[k]===undefined)return;
        r[giT]=sums[k].toFixed(2);
        if(giC>=0&&currency)r[giC]=currency;
    });
}

/* ==========================================================================
 * 六、差异分析 —— 按 Job 把预估和实际做全外连接
 * 逐行对账只能算「两边都有」的差额，查不出漏项；
 * 这里把「预估有、实际没报」和「实际有、预估没排」都揪出来。
 * ========================================================================== */
function fclEstMapOf(job){
    var c=TC['fcl-est-cost'],out={};
    if(!c||!c.d||!job)return out;
    var h=c.h||[],iJ=h.indexOf('Job No'),iS=h.indexOf('状态');
    var iF=h.indexOf('费用科目');if(iF<0)iF=h.indexOf('费用名称');
    var iA=h.indexOf('金额');if(iA<0)iA=h.indexOf('预估金额');
    var iV=h.indexOf('供应商'),iC=h.indexOf('币别');
    if(iJ<0||iF<0||iA<0)return out;
    c.d.forEach(function(r){
        if(String(r[iJ]||'')!==job)return;
        if(iS>=0&&String(r[iS]||'')==='已作废')return;
        var k=String(r[iF]||'');if(!k)return;
        if(!out[k])out[k]={amt:0,supplier:iV>=0?String(r[iV]||''):'',cur:iC>=0?String(r[iC]||''):''};
        out[k].amt+=(fclParseMoney(r[iA])||0);
    });
    return out;
}
function fclActMapOf(job){
    var c=TC['fcl-agent-cost'],out={};
    if(!c||!c.d||!job)return out;
    var h=c.h||[],iJ=h.indexOf('Job No'),iF=h.indexOf('费用名称'),
        iA=h.indexOf('实际金额'),iV=h.indexOf('服务商'),iC=h.indexOf('币别'),iS=h.indexOf('成本状态');
    if(iJ<0||iF<0||iA<0)return out;
    c.d.forEach(function(r){
        if(String(r[iJ]||'')!==job)return;
        if(iS>=0&&String(r[iS]||'')==='已作废')return;
        var k=String(r[iF]||'');if(!k)return;
        if(!out[k])out[k]={amt:0,supplier:iV>=0?String(r[iV]||''):'',cur:iC>=0?String(r[iC]||''):''};
        out[k].amt+=(fclParseMoney(r[iA])||0);
    });
    return out;
}
function openCostDiffDetail(id){
    id=id||'fcl-agent-cost';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选一行，按它所属的 Job 做差异分析'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到成本行'));return;}
    var job=fclFinGet(id,row,'Job No');
    if(!job){showToast(tr('该行没有 Job No，无法分析'));return;}
    var est=fclEstMapOf(job),act=fclActMapOf(job);
    var keys=Object.keys(est).concat(Object.keys(act)).filter(function(v,i,a){return a.indexOf(v)===i;});
    var tolR=FCL_RECON_TOLERANCE.rate,tolA=FCL_RECON_TOLERANCE.amount;
    var sumE=0,sumA=0,nMiss=0,nExtra=0,nDiff=0;
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       tr('Job No')+' <span class="font-semibold text-text-primary">'+esc(job)+'</span>　'+
       tr('容差')+' ±'+tolR+'% / ±'+tolA+
       '<div class="mt-1 text-xs text-text-muted">'+
       esc(tr('「未收到账单」= 预估里排了但代理还没报账；「预估外费用」= 代理报了但预估里没有，这两类逐行对账查不出来。'))+
       '</div></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm">'+
       '<thead class="bg-surface-50"><tr>'+
       ['费用名称','供应商/服务商','币别','预估金额','实际金额','差异金额','差异率','判定'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';
       }).join('')+'</tr></thead><tbody>';
    if(!keys.length){
        b+='<tr><td colspan="8" class="px-3 py-12 text-center text-sm text-text-muted">'+tr('该 Job 既无预估也无实际成本')+'</td></tr>';
    }
    keys.sort().forEach(function(k){
        var e=est[k],a=act[k];
        var ev=e?e.amt:null,av=a?a.amt:null;
        var verdict,cls;
        if(e&&!a){verdict='未收到账单';cls='text-amber-600';nMiss++;}
        else if(!e&&a){verdict='预估外费用';cls='text-red-600';nExtra++;}
        else{
            var d0=+(av-ev).toFixed(2),r0=ev?(d0/ev*100):(d0?100:0);
            if(Math.abs(r0)<=tolR&&Math.abs(d0)<=tolA){verdict='一致';cls='text-success-700';}
            else{verdict='有差异';cls='text-red-600';nDiff++;}
        }
        var d=(e&&a)?+(av-ev).toFixed(2):null;
        var rate=(e&&a&&ev)?((d/ev*100).toFixed(2)+'%'):'—';
        sumE+=(ev||0);sumA+=(av||0);
        b+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 text-text-primary whitespace-nowrap">'+esc(k)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc((a&&a.supplier)||(e&&e.supplier)||'')+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc((a&&a.cur)||(e&&e.cur)||'')+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+(ev===null?'—':ev.toFixed(2))+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+(av===null?'—':av.toFixed(2))+'</td>'+
           '<td class="px-3 py-2 '+(d&&d!==0?'text-red-600':'text-text-secondary')+'">'+(d===null?'—':d.toFixed(2))+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(rate)+'</td>'+
           '<td class="px-3 py-2 font-medium '+cls+' whitespace-nowrap">'+tr(verdict)+'</td>'+
           '</tr>';
    });
    if(keys.length){
        var sd=+(sumA-sumE).toFixed(2);
        b+='<tr class="border-t-2 border-surface-200 bg-surface-50 font-semibold">'+
           '<td class="px-3 py-2 text-text-primary" colspan="3">'+tr('合计')+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+sumE.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+sumA.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 '+(sd?'text-red-600':'text-text-secondary')+'">'+sd.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+(sumE?((sd/sumE*100).toFixed(2)+'%'):'—')+'</td>'+
           '<td class="px-3 py-2"></td></tr>';
    }
    b+='</tbody></table></div>';
    b+='<div class="mt-3 text-sm text-text-secondary">'+
       tr('未收到账单')+' <span class="font-semibold text-amber-600">'+nMiss+'</span> '+tr('项')+'　'+
       tr('预估外费用')+' <span class="font-semibold text-red-600">'+nExtra+'</span> '+tr('项')+'　'+
       tr('超容差')+' <span class="font-semibold text-red-600">'+nDiff+'</span> '+tr('项')+'</div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('差异分析')+' - '+job;
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* ==========================================================================
 * 七、付款申请 —— 勾选已对账的成本行，按 服务商 + 币别 分组生成应付账单
 * 不同服务商或不同币别不能合成一张，否则付款时没法对应到一笔汇款。
 * ========================================================================== */
var _payApply={groups:[],srcId:''};
function openPaymentApply(id){
    id=id||'fcl-agent-cost';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要付款的成本行'));return;}
    var rows=fclFinRows(id),ok=[],bad=0;
    idxs.forEach(function(i){
        var row=rows[i];if(!row)return;
        var st=fclFinGet(id,row,'成本状态');
        if(['对账一致','已确认'].indexOf(st)<0||fclFinGet(id,row,'付款单号')){bad++;return;}
        ok.push(row);
    });
    if(!ok.length){
        showToast(tr('所选行没有可付款的：只有「对账一致 / 已确认」且未生成应付的成本行才能发起付款申请'));return;
    }
    var map={},groups=[];
    ok.forEach(function(row){
        var agent=fclFinGet(id,row,'服务商'),cur=fclFinGet(id,row,'币别');
        var k=agent+'|'+cur;
        if(!map[k]){
            var info=fclProviderInfoOf(agent);
            map[k]={agent:agent,cur:cur,rows:[],amt:0,jobs:{},kinds:{},
                    term:info.term,account:info.account};
            groups.push(map[k]);
        }
        var g=map[k];
        g.rows.push(row);
        g.amt+=(fclParseMoney(fclFinGet(id,row,'实际金额'))||0);
        var j=fclFinGet(id,row,'Job No');if(j)g.jobs[j]=1;
        var kd=fclFinGet(id,row,'费用类别');if(kd)g.kinds[kd]=1;
    });
    _payApply={groups:groups,srcId:id};
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       tr('已选中')+' <span class="font-semibold text-text-primary">'+ok.length+'</span> '+tr('条费用行')+'，'+
       tr('按 服务商 + 币别 归成')+' <span class="font-semibold text-text-primary">'+groups.length+'</span> '+tr('张应付账单')+
       (bad?('　<span class="text-amber-600">'+bad+' '+tr('条不符合条件已跳过')+'</span>'):'')+
       '<div class="mt-1 text-xs text-text-muted">'+esc(tr('提交后账单进入「待审批」，成本行锁定为「已生成应付」；审批驳回会自动解锁可重新申请。'))+'</div></div>';
    groups.forEach(function(g,gi){
        b+='<div class="mb-4 border border-surface-200 rounded-lg overflow-hidden">';
        b+='<div class="px-3 py-2 bg-surface-50 flex items-center justify-between flex-wrap gap-2">'+
           '<span class="text-sm font-semibold text-text-primary">'+esc(g.agent)+'　'+esc(g.cur)+'</span>'+
           '<span class="text-xs text-text-secondary">'+
           tr('涉及Job数')+' '+Object.keys(g.jobs).length+'　'+
           tr('费用行数')+' '+g.rows.length+'　'+
           tr('合计')+' <span class="font-semibold text-text-primary">'+g.amt.toFixed(2)+'</span></span></div>';
        b+='<div class="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">';
        b+=fclPayField(gi,'use','付款用途','text',Object.keys(g.kinds).join('、'),true);
        b+=fclPaySelect(gi,'term','账期',['票结','月结15天','月结30天','月结60天'],g.term);
        b+=fclPayField(gi,'exp','期望付款时间','date',fclDueDateFrom(g.term),true);
        b+=fclPayField(gi,'acc','收款账号','text',g.account,false);
        b+='</div></div>';
    });
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('付款申请');
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitPaymentApply()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交申请')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function fclPayField(gi,key,label,type,val,req){
    return '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+
        (req?'<span class="text-red-500 ml-1">*</span>':'')+'</label>'+
        '<input id="pa-'+key+'-'+gi+'" type="'+type+'" value="'+esc(val||'')+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"></div>';
}
function fclPaySelect(gi,key,label,opts,val){
    var h='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+'</label>'+
        '<select id="pa-'+key+'-'+gi+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 cursor-pointer">';
    opts.forEach(function(o){h+='<option value="'+esc(o)+'"'+(o===val?' selected':'')+'>'+tr(o)+'</option>';});
    return h+'</select></div>';
}
function submitPaymentApply(){
    var groups=_payApply.groups||[],srcId=_payApply.srcId||'fcl-agent-cost';
    if(!groups.length){showToast(tr('没有可提交的分组'));return;}
    for(var i=0;i<groups.length;i++){
        var u=document.getElementById('pa-use-'+i),e=document.getElementById('pa-exp-'+i);
        if(!u||!String(u.value||'').trim()){showToast(tr('第')+' '+(i+1)+' '+tr('组缺「付款用途」'));return;}
        if(!e||!String(e.value||'').trim()){showToast(tr('第')+' '+(i+1)+' '+tr('组缺「期望付款时间」'));return;}
    }
    var now=fclNow(),who=fclWho();
    var period=now.slice(0,7);
    var made=[];
    groups.forEach(function(g,gi){
        var use=document.getElementById('pa-use-'+gi).value;
        var term=document.getElementById('pa-term-'+gi).value;
        var exp=document.getElementById('pa-exp-'+gi).value;
        var acc=(document.getElementById('pa-acc-'+gi)||{}).value||'';
        var apNo=fclSeqNo('FAP','fcl-ap-bill');
        fclPushRow('fcl-ap-bill',{
            '付款单号':apNo,'服务商':g.agent,'账单周期':period,
            '涉及Job数':String(Object.keys(g.jobs).length),'费用行数':String(g.rows.length),
            '币别':g.cur,'应付金额':g.amt.toFixed(2),'已付金额':'0','待付金额':g.amt.toFixed(2),
            '账期':term,'付款用途':use,'期望付款时间':exp,'到期日':fclDueDateFrom(term),
            '收款账号':acc,'申请人':who,'申请时间':now,'账单状态':'待审批'
        });
        /* 回写成本行：锁定，避免同一笔费用被重复申请付款 */
        g.rows.forEach(function(row){
            fclFinSet(srcId,row,'付款单号',apNo);
            fclFinSet(srcId,row,'对账状态','已生成应付');
        });
        made.push(apNo);
    });
    if(typeof _listData!=='undefined')delete _listData['fcl-ap-bill'];
    closeCrudModal();
    fclFinRefresh(srcId);
    showToast(tr('已生成应付账单')+' '+made.length+' '+tr('张')+'：'+made.join('、')+'，'+tr('状态「待审批」'));
}

/* ===== 应付账单：审批 ===== */
var _apAuditCtx={id:'',idx:-1};
function openApBillAudit(id){
    id=id||'fcl-ap-bill';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要审批的应付账单'));return;}
    if(idxs.length>1){showToast(tr('审批一次只能选一张账单'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到账单'));return;}
    var st=fclFinGet(id,row,'账单状态');
    if(st!=='待审批'){showToast(tr('该账单为')+'「'+tr(st)+'」，'+tr('只有「待审批」的账单需要审批'));return;}
    _apAuditCtx={id:id,idx:idxs[0]};
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(fclFinGet(id,row,'服务商'))+'　'+esc(fclFinGet(id,row,'币别'))+' '+esc(fclFinGet(id,row,'应付金额'))+
       '　'+tr('涉及Job数')+' '+esc(fclFinGet(id,row,'涉及Job数'))+
       '　'+tr('费用行数')+' '+esc(fclFinGet(id,row,'费用行数'))+
       '<div class="mt-1 text-xs text-text-muted">'+tr('付款用途')+'：'+esc(fclFinGet(id,row,'付款用途'))+
       '　'+tr('期望付款时间')+'：'+esc(fclFinGet(id,row,'期望付款时间'))+'</div></div>';
    b+='<div class="mb-3"><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('审批结果')+'<span class="text-red-500 ml-1">*</span></label>'+
       '<label class="inline-flex items-center gap-1.5 mr-5 cursor-pointer"><input type="radio" name="ap-audit" value="pass" checked class="text-primary-600"><span class="text-sm">'+tr('通过')+'</span></label>'+
       '<label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" name="ap-audit" value="reject" class="text-primary-600"><span class="text-sm">'+tr('驳回')+'</span></label></div>';
    b+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('审批意见')+'</label>'+
       '<textarea id="ap-audit-note" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入审批意见'))+'"></textarea></div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='48%';
    document.getElementById('crud-modal-title').textContent=tr('审批')+' - '+fclFinGet(id,row,'付款单号');
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitApBillAudit()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交审批')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function submitApBillAudit(){
    var id=_apAuditCtx.id,row=fclFinRows(id)[_apAuditCtx.idx];
    if(!row){showToast(tr('未找到账单'));return;}
    var sel=document.querySelector('input[name="ap-audit"]:checked');
    var pass=!sel||sel.value==='pass';
    var note=(document.getElementById('ap-audit-note')||{}).value||'';
    var apNo=fclFinGet(id,row,'付款单号');
    fclFinSet(id,row,'审批人',fclWho());
    fclFinSet(id,row,'审批时间',fclNow());
    fclFinSet(id,row,'账单状态',pass?'待付款':'审批驳回');
    var freed=0;
    if(!pass){
        /* 驳回就把成本行放回去，否则这些费用会永远卡在「已生成应付」出不来 */
        freed=fclReleaseCostRowsOf(apNo);
    }
    if(typeof _listData!=='undefined')delete _listData['fcl-agent-cost'];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(pass?(tr('审批通过，状态转「待付款」')+(note?('：'+note):'')):
        (tr('已驳回')+(note?('：'+note):'')+'，'+freed+' '+tr('条成本行已解锁可重新申请')));
}
/* 解锁某张应付账单下的成本行（驳回/作废时用） */
function fclReleaseCostRowsOf(apNo){
    var c=TC['fcl-agent-cost'];
    if(!c||!c.d||!apNo)return 0;
    var h=c.h||[],iA=h.indexOf('付款单号'),iS=h.indexOf('成本状态');
    if(iA<0)return 0;
    var n=0;
    c.d.forEach(function(r){
        if(String(r[iA]||'')!==apNo)return;
        r[iA]='';
        if(iS>=0)r[iS]='已分摊';
        n++;
    });
    return n;
}
/* 付款单的费用明细：生成付款单那一刻把代理账单的费用行抄一份挂在这里。
 * 成本侧若已回写付款单号，优先用成本行（带 Job/分摊方式，信息更全），
 * 取不到再退回这份快照 —— 否则「查看」就是一张空表。 */
var _FCL_AP_FEES={
    'FAP-20260613001':[
        {no:'FBK-20260613001',feeName:'海运费',feeKind:'海运费',cur:'USD',amt:'4200',remark:'40HQ×1'},
        {no:'FBK-20260612002',feeName:'海运费',feeKind:'海运费',cur:'USD',amt:'4200',remark:'40HQ×1'},
        {no:'FBK-20260613001',feeName:'THC',feeKind:'THC',cur:'USD',amt:'-80',remark:'塞港费冲回'}
    ],
    'FAP-20260612002':[
        {no:'FBK-20260612002',feeName:'海运费',feeKind:'海运费',cur:'USD',amt:'5180',remark:'20GP×2'}
    ],
    'FAP-20260610003':[
        {no:'FBK-20260613001',feeName:'拖车费',feeKind:'拖车费',cur:'CNY',amt:'1800',remark:'深圳盐田提柜'},
        {no:'FBK-20260612002',feeName:'拖车费',feeKind:'拖车费',cur:'CNY',amt:'1800',remark:'广州南沙提柜'},
        {no:'FBK-20260611003',feeName:'拖车费',feeKind:'拖车费',cur:'CNY',amt:'1800',remark:'上海洋山提柜'}
    ],
    'FAP-20260605004':[
        {no:'FBK-20260613001',feeName:'报关费',feeKind:'报关费',cur:'CNY',amt:'420',remark:''},
        {no:'FBK-20260612002',feeName:'报关费',feeKind:'报关费',cur:'CNY',amt:'420',remark:''},
        {no:'FBK-20260611003',feeName:'报关费',feeKind:'报关费',cur:'CNY',amt:'420',remark:''},
        {no:'FBK-20260609006',feeName:'报关费',feeKind:'报关费',cur:'CNY',amt:'420',remark:''}
    ],
    'FAP-20260614005':[
        {no:'FBK-20260613001',feeName:'海运费',feeKind:'海运费',cur:'USD',amt:'4200',remark:'40HQ×1'}
    ],
    'FAP-20260614006':[
        {no:'FBK-20260609006',feeName:'目的港THC',feeKind:'THC',cur:'USD',amt:'1200',remark:'2 个柜合开'}
    ]
};
function apBillFeesOf(apNo){return _FCL_AP_FEES[apNo]||[];}

/* ===== 付款单：查看明细 —— 这张付款单是由哪些费用行凑出来的 =====
 * rowIdx 由行内「查看」直接传进来：点的是哪一行就看哪一行，不用再去勾选框。 */
function openApBillDetail(id,rowIdx){
    id=id||'fcl-ap-bill';
    var idx=(rowIdx!=null&&rowIdx>=0)?rowIdx:
        ((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1);
    if(idx<0){showToast(tr('请先勾选一张付款单'));return;}
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到付款单'));return;}
    var apNo=fclFinGet(id,row,'付款单号');
    var c=TC['fcl-agent-cost'],h=(c&&c.h)||[];
    var iA=h.indexOf('付款单号');
    var costRows=(c&&c.d&&iA>=0)?c.d.filter(function(r){return String(r[iA]||'')===apNo;}):[];
    var fromCost=costRows.length>0;
    /* 两种来源统一成同一组列，页面不用分两套渲染 */
    var cols=fromCost?['流水号','Job No','费用名称','费用类别','币别','实际金额','分摊方式','代理账单号','服务商账单号']
                     :['单号','费用名称','费用类别','币别','费用金额','备注'];
    var list=fromCost?costRows.map(function(r){
            var g=function(t){var k=h.indexOf(t);return k>=0?String(r[k]||''):'';};
            return {cells:cols.map(g),amt:fclParseMoney(g('实际金额'))||0};
        }):apBillFeesOf(apNo).map(function(d){
            return {cells:[d.no,d.feeName,d.feeKind,d.cur,d.amt,d.remark||''],
                    amt:fclParseMoney(d.amt)||0};
        });
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(apNo)+'　'+esc(fclFinGet(id,row,'服务商'))+'　'+
       esc(fclFinGet(id,row,'币别'))+' '+esc(fclFinGet(id,row,'应付金额'))+'　'+
       tr('状态')+' '+esc(tr(fclFinGet(id,row,'账单状态')))+
       '<div class="mt-1 text-xs text-text-muted">'+
       esc(fromCost?tr('明细来自代理成本明细（已回写付款单号的成本行）')
                   :tr('明细来自生成付款单时抄下的代理账单费用行'))+'</div></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       cols.map(function(t){return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    if(!list.length){
        b+='<tr><td colspan="'+cols.length+'" class="px-3 py-12 text-center text-sm text-text-muted">'+tr('这张付款单还没有费用明细')+'</td></tr>';
    }
    var sum=0;
    list.forEach(function(r){
        sum+=r.amt;
        b+='<tr class="border-t border-surface-100">'+r.cells.map(function(v){
            return '<td class="px-3 py-2 text-text-primary whitespace-nowrap">'+esc(String(v||''))+'</td>';
        }).join('')+'</tr>';
    });
    b+='</tbody></table></div>';
    b+='<div class="mt-2 text-sm text-text-secondary">'+tr('费用行数')+' <span class="font-semibold text-text-primary">'+list.length+
       '</span>　'+tr('合计')+' <span class="font-semibold text-text-primary">'+
       esc(fclFinGet(id,row,'币别'))+' '+sum.toFixed(2)+'</span></div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('付款单明细')+' - '+apNo;
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* ===== 代理账单：作废 —— 已请款（生成过应付账单）的不让作废，
 * 否则应付那边挂着一张没来源的账单。要作废先去应付侧撤销。 */
var AGENT_BILL_VOIDABLE=['待对账','待请款'];
function voidAgentBillRows(id){
    id=id||'fcl-agent-bill';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要作废的账单'));return;}
    var rows=fclFinRows(id),ok=[],locked=0,already=0;
    idxs.forEach(function(i){
        var row=rows[i];if(!row)return;
        var st=fclFinGet(id,row,'账单状态');
        if(st==='作废'){already++;return;}
        if(AGENT_BILL_VOIDABLE.indexOf(st)<0){locked++;return;}
        ok.push(row);
    });
    if(!ok.length){
        showToast(locked?tr('已进入请款流程的账单不能作废，请先在应付侧撤销'):tr('所选账单已是作废状态'));return;
    }
    var msg=tr('确认作废')+' '+ok.length+' '+tr('张账单')+'？';
    if(locked)msg+='（'+locked+' '+tr('张已请款将跳过')+'）';
    openConfirmTip(msg,function(){
        ok.forEach(function(row){fclFinSet(id,row,'账单状态','作废');});
        fclFinRefresh(id);
        showToast(tr('已作废')+' '+ok.length+' '+tr('张'));
    });
}

/* ==========================================================================
 * 八、代理账单导入 —— 走全站统一的四段式：模板信息 → 上传 → 逐行校验 → 勾选确认
 * 和 42 里那个「代账账单导入」不同：那个直接导成 Job 级实际成本（代理已经拆好柜的场景），
 * 这个导的是发票抬头级的总额，导进来还要再分摊。两个入口并存，各管一种代理。
 * ========================================================================== */
/* 费用名称已不在账单头（在按 Job 的费用明细里），导入模板的必填项随之只剩发票级四项 */
var BILL_IMPORT_REQUIRED=['服务商','服务商账单号','币别','账单金额'];
var BILL_IMPORT_EXCLUDE=['操作','流水号','涉及Job数','导入人','导入时间','账单状态'];
var _billImportRows=[];
var _billImportFile='';
function billImportColumns(id){
    var c=TC[id||'fcl-agent-bill']||{};
    return (c.h||[]).filter(function(h){return BILL_IMPORT_EXCLUDE.indexOf(h)<0;});
}
function openBillHeadImport(id){
    id=id||'fcl-agent-bill';
    _billImportRows=[];_billImportFile='';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='70%';
    document.getElementById('crud-modal-title').textContent=tr('代理账单导入');
    document.getElementById('crud-modal-body').innerHTML=billImportBodyHtml(id);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmBillHeadImport(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认导入')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function billImportBodyHtml(id){
    var h='<div class="space-y-5">';
    h+='<section>'+agentImportSectionTitle('模板信息');
    h+='<div class="rounded-lg border border-surface-200 bg-white p-4">';
    h+='<button type="button" onclick="showToast(tr(\'代理账单导入模板下载中\'))" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer">'+tr('下载代理账单导入模板')+'</button>';
    h+='<div class="mt-3 w-full border border-dashed border-surface-300 rounded-lg bg-surface-50 px-3 py-2.5">';
    h+='<div class="flex items-center gap-2 flex-wrap">';
    h+='<label class="h-8 px-3 inline-flex items-center text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">';
    h+='<input type="file" accept=".xls,.xlsx,.pdf" class="hidden" onchange="onBillImportPick(this,\''+id+'\')">'+esc(tr('选择文件'))+'</label>';
    h+='<span class="text-[11px] text-text-muted">'+esc(tr('支持 Excel 对账单（.xls / .xlsx）与 PDF 发票，单个不超过 10MB'))+'</span>';
    h+='</div>';
    h+='<div data-bill-import-file class="flex flex-wrap gap-1.5 mt-2'+(_billImportFile?'':' hidden')+'">'+
       (_billImportFile&&typeof crudAttachmentChipHtml==='function'?crudAttachmentChipHtml(_billImportFile):'')+'</div>';
    h+='</div>';
    h+='<div class="mt-3 text-xs text-red-500">'+tr('注意：导入的是发票抬头级总额，导入后需再做「费用分摊」才会生成 Job 级实际成本')+'</div>';
    h+='</div></section>';
    h+='<section>'+agentImportSectionTitle('导入数据');
    h+='<div data-bill-import-summary class="mb-2 text-xs text-text-secondary'+(_billImportRows.length?'':' hidden')+'"></div>';
    h+='<div data-bill-import-table class="rounded-lg border border-surface-200 bg-white overflow-hidden">'+billImportTableHtml(id)+'</div>';
    h+='</section></div>';
    return h;
}
function billImportTableHtml(id){
    var cols=billImportColumns(id);
    var h='<div class="overflow-auto" style="max-height:360px">';
    h+='<table class="w-full data-table" style="table-layout:auto;min-width:100%;border-collapse:separate;border-spacing:0"><thead><tr class="bg-white">';
    h+='<th class="px-3 py-2 text-xs font-medium text-text-secondary text-center whitespace-nowrap border-b border-surface-200">#</th>';
    h+='<th class="px-3 py-2 border-b border-surface-200"><input type="checkbox" class="rounded border-surface-300 text-primary-600" onchange="toggleAllBillImportRows(this)"></th>';
    cols.forEach(function(c){
        var req=BILL_IMPORT_REQUIRED.indexOf(c)>=0;
        h+='<th class="px-3 py-2 text-xs font-medium whitespace-nowrap border-b border-surface-200 '+(req?'text-red-500':'text-text-secondary')+'">'+esc(tr(c))+'</th>';
    });
    h+='<th class="px-3 py-2 text-xs font-medium text-text-secondary whitespace-nowrap border-b border-surface-200">'+tr('校验结果')+'</th>';
    h+='</tr></thead><tbody>';
    if(!_billImportRows.length){
        h+='<tr><td colspan="'+(cols.length+3)+'" class="px-3 py-16 text-center text-sm text-text-muted">'+tr('请先上传模板文件')+'</td></tr>';
    }else{
        _billImportRows.forEach(function(r,i){
            h+='<tr class="border-b border-surface-100 '+(r.ok?'':'bg-red-50/50')+'">';
            h+='<td class="px-3 py-2 text-sm text-text-muted text-center">'+(i+1)+'</td>';
            h+='<td class="px-3 py-2"><input type="checkbox" class="bill-import-check rounded border-surface-300 text-primary-600" value="'+i+'"'+(r.ok?' checked':'')+(r.ok?'':' disabled')+'></td>';
            cols.forEach(function(c,ci){
                h+='<td class="px-3 py-2 text-sm text-text-primary whitespace-nowrap">'+esc(r.cells[ci]||'')+'</td>';
            });
            h+='<td class="px-3 py-2 text-sm whitespace-nowrap '+(r.ok?'text-green-600':'text-red-600')+'">'+esc(r.ok?tr('校验通过'):r.msg)+'</td>';
            h+='</tr>';
        });
    }
    h+='</tbody></table></div>';
    return h;
}
function toggleAllBillImportRows(cb){
    document.querySelectorAll('.bill-import-check:not([disabled])').forEach(function(x){x.checked=cb.checked;});
}
function onBillImportPick(input,id){
    var f=(input.files||[])[0];
    if(!f)return;
    _billImportFile=f.name;
    _billImportRows=buildBillImportPreview(id);
    var body=document.getElementById('crud-modal-body');
    if(body)body.innerHTML=billImportBodyHtml(id);
    var okCount=_billImportRows.filter(function(r){return r.ok;}).length;
    var sum=document.querySelector('[data-bill-import-summary]');
    if(sum){
        sum.classList.remove('hidden');
        sum.innerHTML=tr('已解析')+' <span class="font-semibold text-text-primary">'+_billImportRows.length+'</span> '+tr('条')+
            '，'+tr('校验通过')+' <span class="font-semibold text-green-600">'+okCount+'</span> '+tr('条')+
            '，'+tr('校验失败')+' <span class="font-semibold text-red-600">'+(_billImportRows.length-okCount)+'</span> '+tr('条')+
            '（'+esc(f.name)+'）';
    }
    showToast(tr('已解析')+' '+_billImportRows.length+' '+tr('条'));
}
/* 原型阶段不解析真实 Excel/PDF：造几条演示数据，最后一行故意缺金额演示校验列 */
function buildBillImportPreview(id){
    id=id||'fcl-agent-bill';
    var cols=billImportColumns(id);
    var demo=[
        {'服务商':'MAERSK','服务商账单号':'MSK-INV-260620','账单周期':'2026-06','币别':'USD','账单金额':'9800','备注':'含 FBK-20260613001 / FBK-20260609006 两个柜'},
        {'服务商':'CMA CGM','服务商账单号':'CMA-INV-260620','账单周期':'2026-06','币别':'USD','账单金额':'4360','备注':''},
        {'服务商':'鹏程拖车','服务商账单号':'PC-260620-14','账单周期':'2026-06','币别':'CNY','账单金额':'3600','备注':'6 月下半月，2 个柜'},
        {'服务商':'深圳报关行','服务商账单号':'SZ-CD-260620','账单周期':'2026-06','币别':'CNY','账单金额':'','备注':'金额待代理补发'}
    ];
    return demo.map(function(o){
        var cells=cols.map(function(name){return o[name]==null?'':String(o[name]);});
        var missing=BILL_IMPORT_REQUIRED.filter(function(name){
            var k=cols.indexOf(name);
            return k>=0&&!String(cells[k]||'').trim();
        });
        return {cells:cells,ok:missing.length===0,msg:missing.length?(tr('必填项为空')+'：'+missing.join('、')):''};
    });
}
function confirmBillHeadImport(id){
    id=id||'fcl-agent-bill';
    if(!_billImportRows.length){showToast(tr('请先上传模板文件'));return;}
    var picked=[];
    document.querySelectorAll('.bill-import-check:checked').forEach(function(x){picked.push(parseInt(x.value,10));});
    var rows=picked.map(function(i){return _billImportRows[i];}).filter(function(r){return r&&r.ok;});
    if(!rows.length){showToast(tr('没有可导入的数据，请先勾选校验通过的行'));return;}
    var cols=billImportColumns(id),now=fclNow(),who=fclWho();
    rows.forEach(function(r){
        var map={};
        cols.forEach(function(name,ci){map[name]=r.cells[ci]||'';});
        var billNo=fclSeqNo('AGB',id);
        map['流水号']=billNo;
        map['涉及Job数']='0';
        map['导入人']=who;
        map['导入时间']=now;
        map['账单状态']='待对账';
        fclPushRow(id,map);
        /* 新导入的账单还没有按 Job 的费用明细（等代理补明细或人工补录），
         * 先建空数组占位，详情弹窗会显示「该账单暂无费用明细」而不是报错 */
        if(!_agentBillDetails[billNo])_agentBillDetails[billNo]=[];
    });
    if(typeof _listData!=='undefined')delete _listData[id];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('导入成功')+' '+rows.length+' '+tr('条')+'，'+tr('状态「待对账」，请继续做「对账」'));
}


/* ==========================================================================
 * 七、代理成本明细 · 手工分摊
 *
 * 业务口径（2026-09-20 修正）：一个 Job 要么是整柜，要么是散货拼箱，不会混。
 *   整柜    ：一个 Job 可以带多张整柜委托单（拼柜共用一个柜），
 *             成本摊到「委托单」这一层就到底了。
 *   散货拼箱：Job 与散货拼箱委托单是一对一，委托单这一层没什么好摊的，
 *             要摊的是这张委托单底下的每票散货订单，否则单票毛利算不出来。
 * 所以分摊弹窗只出一层：整柜出委托单层，散货出散货订单层，不做两层嵌套。
 *
 * 结果存 _FCL_COST_ALLOC[流水号]，行内「查看」看的就是它。
 * ========================================================================== */

/* 自由散货拼箱委托单 → 旗下散货订单（含分摊基数）。
 * 登记在这里的委托单＝散货拼箱业务，它所在的 Job 只会有它这一张委托单。 */
var _FCL_LCL_ORDERS={
    'FEO-20260609007':[
        {no:'LCL-20260609071',cust:'深圳市华运达国际货运',goods:'针织服装',pcs:60,cbm:18.0,kg:2400},
        {no:'LCL-20260609072',cust:'佛山恒通货运代理',goods:'家纺四件套',pcs:70,cbm:20.0,kg:2900},
        {no:'LCL-20260609073',cust:'上海锦程国际贸易',goods:'鞋帽',pcs:50,cbm:14.0,kg:2100}
    ]
};
function fclLclOrdersOf(entrust){return _FCL_LCL_ORDERS[entrust]||[];}
function fclIsLclEntrust(entrust){return fclLclOrdersOf(entrust).length>0;}
function fclEntrustBizType(entrust){return fclIsLclEntrust(entrust)?'自由散货拼箱':'整柜';}

/* 柜内票清单里这个 Job 关联的委托单（带分摊基数） */
function fclEntrustsOfJob(job){
    var c=TC['fcl-job-cargo'];
    if(!c||!c.d||!job)return [];
    var h=c.h||[];
    var iJ=h.indexOf('Job No'),iE=h.indexOf('委托订单号'),iC=h.indexOf('客户名称'),
        iP=h.indexOf('件数'),iV=h.indexOf('体积(CBM)'),iW=h.indexOf('重量(KG)'),iS=h.indexOf('状态');
    var out=[];
    c.d.forEach(function(r){
        if(String(r[iJ]||'')!==job)return;
        if(iS>=0&&r[iS]==='已作废')return;
        var e=String(r[iE]||'').trim();
        if(!e||out.some(function(x){return x.entrust===e;}))return;
        out.push({entrust:e,cust:String(r[iC]||''),
            pcs:fclParseMoney(r[iP])||0,cbm:fclParseMoney(r[iV])||0,kg:fclParseMoney(r[iW])||0,
            biz:fclEntrustBizType(e)});
    });
    return out;
}
/* Job 的分摊层级：散货拼箱摊到订单，整柜摊到委托单。
 * 按口径一个 Job 不会同时挂两种委托单，真出现了就按散货算（更细的那层） */
function fclJobAllocMode(job){
    var ents=fclEntrustsOfJob(job);
    return ents.some(function(e){return fclIsLclEntrust(e.entrust);})?'lcl':'fcl';
}

/* 分摊结果：流水号 → {mode,entrust?,rows:[{key,name,cust,amt}]}
 *   mode='fcl' → rows 是委托单；mode='lcl' → rows 是散货订单，entrust 记所属委托单 */
var _FCL_COST_ALLOC={
    'FAC-20260613001':{mode:'fcl',entrust:'',rows:[
        {key:'FEO-20260613001',cust:'深圳市华运达国际货运',amt:1575.00},
        {key:'FEO-20260613007',cust:'广州远洋进出口贸易',amt:1181.25},
        {key:'FEO-20260613012',cust:'东莞市鑫海物流',amt:1443.75}
    ]},
    'FAC-20260612003':{mode:'fcl',entrust:'',rows:[
        {key:'FEO-20260612002',cust:'广州远洋进出口贸易',amt:3640.00},
        {key:'FEO-20260612009',cust:'上海锦程国际贸易',amt:1540.00}
    ]},
    'FAC-20260609005':{mode:'lcl',entrust:'FEO-20260609007',rows:[
        {key:'LCL-20260609071',cust:'深圳市华运达国际货运',amt:1038.46},
        {key:'LCL-20260609072',cust:'佛山恒通货运代理',amt:1153.85},
        {key:'LCL-20260609073',cust:'上海锦程国际贸易',amt:807.69}
    ]}
};
function fclCostAllocOf(no){return _FCL_COST_ALLOC[no]||null;}

/* ---------- 分摊弹窗 ---------- */
var FCL_ALLOC_BASIS=[['even','平均'],['pcs','按件数'],['cbm','按体积'],['kg','按重量']];
var _costAlloc={id:'',idx:-1,no:'',total:0,currency:'',job:'',mode:'fcl',entrust:'',rows:[]};

function openAgentCostAlloc(id){
    id=id||'fcl-agent-cost';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要分摊的成本行'));return;}
    if(idxs.length>1){showToast(tr('手工分摊一次只能选一行'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到成本行'));return;}
    var st=fclFinGet(id,row,'成本状态');
    if(st==='已作废'){showToast(tr('已作废的成本行不能分摊'));return;}
    if(st==='已生成付款单'||fclFinGet(id,row,'付款单号')){showToast(tr('已生成付款单的成本行不能再分摊'));return;}
    var total=fclParseMoney(fclFinGet(id,row,'实际金额'));
    if(total===null||total<=0){showToast(tr('该行没有实际金额，无法分摊'));return;}
    var job=fclFinGet(id,row,'Job No');
    var ents=fclEntrustsOfJob(job);
    if(!ents.length){showToast(tr('这个 Job 在柜内票清单里没有委托单，先维护柜内票再分摊'));return;}
    var mode=fclJobAllocMode(job);
    var entrust=mode==='lcl'?ents.filter(function(e){return fclIsLclEntrust(e.entrust);})[0].entrust:'';
    /* 散货拼箱只有一张委托单，摊的是它底下的散货订单；整柜摊的是各张委托单 */
    var base=mode==='lcl'
        ?fclLclOrdersOf(entrust).map(function(o){
            return {key:o.no,name:o.goods,cust:o.cust,pcs:o.pcs,cbm:o.cbm,kg:o.kg,amt:''};})
        :ents.map(function(e){
            return {key:e.entrust,name:'',cust:e.cust,pcs:e.pcs,cbm:e.cbm,kg:e.kg,amt:''};});
    if(mode==='lcl'&&!base.length){showToast(tr('这张散货拼箱委托单底下没有散货订单，先维护订单再分摊'));return;}
    var no=fclFinGet(id,row,'流水号');
    var saved=fclCostAllocOf(no);
    if(saved&&saved.mode===mode){
        base.forEach(function(b){
            var s=(saved.rows||[]).filter(function(x){return x.key===b.key;})[0];
            if(s)b.amt=String(s.amt);
        });
    }
    _costAlloc={id:id,idx:idxs[0],no:no,total:total,currency:fclFinGet(id,row,'币别'),
        job:job,mode:mode,entrust:entrust,rows:base};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='66%';
    document.getElementById('crud-modal-title').textContent=tr('手工分摊')+' - '+no;
    document.getElementById('crud-modal-body').innerHTML=costAllocBodyHtml(id,row);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitAgentCostAlloc()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认分摊')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function costAllocBodyHtml(id,row){
    var A=_costAlloc,isLcl=A.mode==='lcl';
    var h='';
    h+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(fclFinGet(id,row,'服务商'))+'　'+esc(fclFinGet(id,row,'费用名称'))+'　'+esc(A.job)+'　'+
       '<span class="px-1.5 py-0.5 text-xs rounded border '+
       (isLcl?'border-amber-200 bg-amber-50 text-amber-700':'border-surface-200 bg-white text-text-secondary')+'">'+
       tr(isLcl?'自由散货拼箱':'整柜')+'</span>　'+
       tr('待分摊')+' <span class="font-semibold text-text-primary">'+esc(A.currency)+' '+A.total.toFixed(2)+'</span>'+
       '<div class="mt-1 text-xs text-text-muted">'+
       esc(isLcl
           ? tr('散货拼箱的 Job 与委托单是一对一（')+A.entrust+tr('），成本直接摊到这张委托单底下的 ')+A.rows.length+tr(' 票散货订单')
           : tr('整柜的 Job 可以带多张委托单，这个 Job 带了 ')+A.rows.length+tr(' 张，成本摊到委托单为止'))+
       '</div></div>';
    h+='<div class="flex items-center gap-2 mb-2 flex-wrap">';
    h+='<span class="text-xs text-text-muted">'+tr('分摊口径')+'</span>';
    FCL_ALLOC_BASIS.forEach(function(b){
        h+='<button type="button" onclick="costAllocApply(\''+b[0]+'\')" class="h-8 px-3 text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">'+tr(b[1])+'</button>';
    });
    h+='</div>';
    h+='<div data-cost-alloc>'+costAllocTableHtml()+'</div>';
    return h;
}
function costAllocTableHtml(){
    var A=_costAlloc,total=A.total||0,isLcl=A.mode==='lcl';
    var h='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr(isLcl?'散货订单号':'委托订单号')+'</th>'+
       (isLcl?'<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr('品名')+'</th>':'')+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr('客户名称')+'</th>'+
       '<th class="px-3 py-2 text-right font-medium text-text-secondary">'+tr('件数')+'</th>'+
       '<th class="px-3 py-2 text-right font-medium text-text-secondary">'+tr('体积(CBM)')+'</th>'+
       '<th class="px-3 py-2 text-right font-medium text-text-secondary">'+tr('重量(KG)')+'</th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr('分摊金额')+'<span class="text-red-500 ml-1">*</span></th>'+
       '<th class="px-3 py-2 text-right font-medium text-text-secondary">'+tr('占比')+'</th>'+
       '</tr></thead><tbody>';
    A.rows.forEach(function(r,i){
        var amt=fclParseMoney(r.amt);
        h+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 font-medium text-text-primary">'+esc(r.key)+'</td>'+
           (isLcl?('<td class="px-3 py-2 text-text-secondary">'+esc(r.name||'')+'</td>'):'')+
           '<td class="px-3 py-2 text-text-secondary">'+esc(r.cust)+'</td>'+
           '<td class="px-3 py-2 text-right text-text-secondary">'+r.pcs+'</td>'+
           '<td class="px-3 py-2 text-right text-text-secondary">'+r.cbm+'</td>'+
           '<td class="px-3 py-2 text-right text-text-secondary">'+r.kg+'</td>'+
           '<td class="px-3 py-2"><input data-ca-amt="'+i+'" type="number" value="'+esc(r.amt)+'" oninput="costAllocOnAmt('+i+')" class="w-28 h-8 px-2 text-sm border border-surface-200 rounded-lg bg-surface-50"></td>'+
           '<td class="px-3 py-2 text-right text-text-secondary">'+((amt!==null&&total)?((amt/total*100).toFixed(2)+'%'):'—')+'</td>'+
           '</tr>';
    });
    h+='</tbody></table></div>';
    h+=costAllocSummaryHtml();
    return h;
}
function costAllocSum(){
    return _costAlloc.rows.reduce(function(s,r){return s+(fclParseMoney(r.amt)||0);},0);
}
function costAllocSummaryHtml(){
    var total=_costAlloc.total||0,sum=costAllocSum();
    var diff=+(total-sum).toFixed(2);
    var cls=diff===0?'text-success-700':'text-red-600';
    return '<div data-ca-sum class="mt-2 text-sm '+cls+'">'+
        tr('已分摊')+' <span class="font-semibold">'+sum.toFixed(2)+'</span>　'+
        tr('待分摊')+' <span class="font-semibold">'+total.toFixed(2)+'</span>　'+
        tr('差额')+' <span class="font-semibold">'+diff.toFixed(2)+'</span>'+
        (diff===0?('　'+tr('金额已分摊完毕')):('　'+tr('差额不为 0 无法提交')))+'</div>';
}
function costAllocReadUI(){
    _costAlloc.rows.forEach(function(r,i){
        var el=document.querySelector('[data-ca-amt="'+i+'"]');
        if(el)r.amt=String(el.value||'');
    });
}
function costAllocRedraw(){
    var box=document.querySelector('[data-cost-alloc]');
    if(box)box.innerHTML=costAllocTableHtml();
}
function costAllocOnAmt(i){costAllocReadUI();costAllocRedraw();}
/* 按口径分金额：尾差补到最后一份，保证合计刚好等于总额 */
function fclSplitByWeights(total,weights){
    var base=weights.reduce(function(s,w){return s+(w||0);},0);
    var n=weights.length,acc=0,out=[];
    for(var i=0;i<n;i++){
        var v;
        if(i===n-1)v=+(total-acc).toFixed(2);
        else v=base?Math.floor(total*(weights[i]||0)/base*100)/100:Math.floor(total/n*100)/100;
        acc=+(acc+v).toFixed(2);
        out.push(v);
    }
    return out;
}
function costAllocWeights(list,basis){
    return list.map(function(x){
        if(basis==='pcs')return x.pcs||0;
        if(basis==='cbm')return x.cbm||0;
        if(basis==='kg')return x.kg||0;
        return 1;
    });
}
function costAllocApply(basis){
    costAllocReadUI();
    var A=_costAlloc;
    var w=costAllocWeights(A.rows,basis);
    if(basis!=='even'&&w.reduce(function(s,v){return s+v;},0)<=0){
        showToast(tr('所选口径没有基数数据，已改用平均分摊'));
        basis='even';w=costAllocWeights(A.rows,'even');
    }
    var vals=fclSplitByWeights(A.total||0,w);
    A.rows.forEach(function(r,i){r.amt=String(vals[i]);});
    costAllocRedraw();
    showToast(tr('已按')+tr(FCL_ALLOC_BASIS.filter(function(b){return b[0]===basis;})[0][1])+
        tr(A.mode==='lcl'?'分摊到散货订单':'分摊到委托单'));
}
function submitAgentCostAlloc(){
    costAllocReadUI();
    var A=_costAlloc,id=A.id,row=fclFinRows(id)[A.idx];
    if(!row){showToast(tr('未找到成本行'));return;}
    var unit=A.mode==='lcl'?tr('散货订单'):tr('委托单');
    if(A.rows.some(function(r){return fclParseMoney(r.amt)===null;})){showToast(tr('每个')+unit+tr('都要填分摊金额'));return;}
    if(A.rows.some(function(r){return (fclParseMoney(r.amt)||0)<=0;})){showToast(tr('分摊金额必须大于 0'));return;}
    var diff=+((A.total||0)-costAllocSum()).toFixed(2);
    if(diff!==0){showToast(unit+tr('合计与待分摊金额差')+' '+diff+'，'+tr('请调平后再提交'));return;}
    _FCL_COST_ALLOC[A.no]={mode:A.mode,entrust:A.entrust,
        rows:A.rows.map(function(r){
            return {key:r.key,name:r.name,cust:r.cust,amt:fclParseMoney(r.amt)||0};
        })};
    fclFinSet(id,row,'成本状态','已分摊');
    fclFinSet(id,row,'分摊人',fclWho());
    fclFinSet(id,row,'分摊时间',fclNow());
    if(typeof _listData!=='undefined')delete _listData[id];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('已分摊到')+' '+A.rows.length+' '+(A.mode==='lcl'?tr('票散货订单'):tr('张委托单'))+
        '　'+tr('可在行内「查看」复核'));
}

/* ---------- 行内「查看」：分摊明细 ---------- */
function openAgentCostDetail(id,rowIdx){
    id=id||'fcl-agent-cost';
    var idx=(rowIdx!=null&&rowIdx>=0)?rowIdx:
        ((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1);
    if(idx<0){showToast(tr('请先勾选一条成本明细'));return;}
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到成本行'));return;}
    var no=fclFinGet(id,row,'流水号'),cur=fclFinGet(id,row,'币别');
    var total=fclParseMoney(fclFinGet(id,row,'实际金额'))||0;
    var job=fclFinGet(id,row,'Job No');
    var saved=fclCostAllocOf(no);
    var isLcl=saved?saved.mode==='lcl':(fclJobAllocMode(job)==='lcl');
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(no)+'　'+esc(fclFinGet(id,row,'服务商'))+'　'+esc(fclFinGet(id,row,'费用名称'))+'　'+esc(job)+'　'+
       '<span class="px-1.5 py-0.5 text-xs rounded border '+
       (isLcl?'border-amber-200 bg-amber-50 text-amber-700':'border-surface-200 bg-white text-text-secondary')+'">'+
       tr(isLcl?'自由散货拼箱':'整柜')+'</span>'+
       '<div class="mt-1 text-xs text-text-muted">'+tr('实际金额')+' '+esc(cur)+' '+total.toFixed(2)+
       '　'+tr('分摊方式')+' '+(esc(fclFinGet(id,row,'分摊方式'))||'—')+
       '　'+tr('成本状态')+' '+esc(tr(fclFinGet(id,row,'成本状态')))+
       (isLcl&&saved&&saved.entrust?('　'+tr('所属委托单')+' '+esc(saved.entrust)):'')+'</div></div>';
    if(!saved||!(saved.rows||[]).length){
        b+='<div class="py-12 text-center text-sm text-text-muted">'+
           esc(tr('这行还没有分摊，勾选后点「手工分摊」把成本摊到')+(isLcl?tr('散货订单'):tr('委托单'))+'。')+'</div>';
    }else{
        var cols=isLcl?['散货订单号','品名','客户名称','分摊金额','占比']:['委托订单号','客户名称','分摊金额','占比'];
        b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
           cols.map(function(t){
               return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';
           }).join('')+'</tr></thead><tbody>';
        saved.rows.forEach(function(r){
            b+='<tr class="border-t border-surface-100">'+
               '<td class="px-3 py-2 font-medium text-text-primary">'+esc(r.key)+'</td>'+
               (isLcl?('<td class="px-3 py-2 text-text-secondary">'+esc(r.name||'')+'</td>'):'')+
               '<td class="px-3 py-2 text-text-secondary">'+esc(r.cust)+'</td>'+
               '<td class="px-3 py-2 text-text-primary">'+esc(cur)+' '+(+r.amt).toFixed(2)+'</td>'+
               '<td class="px-3 py-2 text-text-secondary">'+(total?((r.amt/total*100).toFixed(2)+'%'):'—')+'</td></tr>';
        });
        var sum=saved.rows.reduce(function(s,r){return s+(+r.amt||0);},0);
        b+='</tbody><tfoot><tr class="border-t-2 border-surface-200 bg-surface-50 font-medium">'+
           '<td class="px-3 py-2" colspan="'+(isLcl?3:2)+'">'+tr('合计')+'</td>'+
           '<td class="px-3 py-2">'+esc(cur)+' '+sum.toFixed(2)+'</td>'+
           '<td class="px-3 py-2">'+(total?((sum/total*100).toFixed(2)+'%'):'—')+'</td></tr></tfoot>';
        b+='</table></div>';
    }
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='64%';
    document.getElementById('crud-modal-title').textContent=tr('分摊成本明细')+' - '+no;
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
/* ==========================================================================
 * 八、代理账单 · 新增（原「新增数据」与「账单导入」合并成这一个入口）
 *
 * 一张代理账单＝一张供应商发票：抬头是发票级信息，明细是供应商按单号给的费用行。
 * 手工一行行敲和 Excel 导入本来就是同一件事的两种录入方式，拆成两个按钮只会
 * 让人先建头再回来导明细。这里合成一个弹窗：抬头照填，明细既能上传 Excel
 * 一次带进来，也能在表格里直接加行改数，两种混着用也行。
 *
 * 字段口径对齐代理账单列表：服务商 / 服务商账单号 / 账单周期 / 币别 /
 * 账单金额（= 明细合计，不给手填）/ 涉及Job数（= 明细里去重的单号数）/
 * 导入人 / 导入时间 / 备注。
 * ========================================================================== */
/* 分摊规则记在这里（不进列表列），生成付款单与成本落地时按它摊 */
var _AGENT_BILL_RULE={'AGB-20260615001':'按件数','AGB-20260615002':'按票数','AGB-20260615003':'按体积'};
var AGENT_BILL_ALLOC_RULES=['按票数','按件数','按体积','按重量','按预估成本比例','不分摊'];
var AGENT_BILL_ATTACH_TYPES=['代理账单','发票扫描件','水单','对账单','其他'];
var _abNew=null;

function agentBillNewCtx(){
    return {billNo:'',agent:'',rule:'',cur:'USD',
        period:'',due:'',remark:'',
        rows:[{sel:false,no:'',acct:'',amt:'',remark:''},
              {sel:false,no:'',acct:'',amt:'',remark:''},
              {sel:false,no:'',acct:'',amt:'',remark:''}],
        attachType:AGENT_BILL_ATTACH_TYPES[0],files:[],tableH:240};
}
function openAgentBillCreateModal(id){
    id=id||'fcl-agent-bill';
    _abNew=agentBillNewCtx();
    _abNew.period=String(fclNow()).slice(0,7);
    _abNew.due=fclNow();
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('新增代理账单');
    document.getElementById('crud-modal-body').innerHTML=agentBillNewBodyHtml(id);
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitAgentBillCreate(\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认新增')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function abSection(title,inner){
    return '<div class="mb-5"><div class="flex items-center gap-2 mb-3">'+
        '<span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
        '<span class="text-sm font-semibold text-text-primary">'+tr(title)+'</span></div>'+inner+'</div>';
}
function agentBillNewBodyHtml(id){
    var A=_abNew;
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    function fld(label,inner,req,span){
        return '<div class="flex flex-col gap-1.5'+(span?' '+span:'')+'">'+
            '<label class="text-sm font-medium text-text-secondary">'+(req?'<span class="text-red-500 mr-0.5">*</span>':'')+tr(label)+'</label>'+inner+'</div>';
    }
    function txt(k,ph){return '<input data-ab="'+k+'" type="text" value="'+esc(A[k]||'')+'" oninput="abSet(\''+k+'\',this.value)" placeholder="'+esc(tr(ph||''))+'" class="'+inCls+'">';}
    function sl(k,opts,ph){
        var h='<select data-ab="'+k+'" onchange="abSet(\''+k+'\',this.value)" class="'+inCls+'">';
        h+='<option value="">'+esc(tr(ph||'请选择'))+'</option>';
        opts.forEach(function(o){h+='<option value="'+esc(o)+'"'+(A[k]===o?' selected':'')+'>'+esc(tr(o))+'</option>';});
        return h+'</select>';
    }
    var h='';
    /* ① 基本信息 —— 字段名对齐代理账单列表 */
    var g='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">';
    g+=fld('服务商账单号',txt('billNo','代理发票上印的账单号'),true);
    g+=fld('服务商',sl('agent',FCL_AGENT_OPTIONS,'请选择服务商'),true);
    /* 分摊规则非必填：一张发票要不要往下摊、按什么摊，常常是对完账才定 */
    g+=fld('分摊规则',sl('rule',AGENT_BILL_ALLOC_RULES,'暂不指定'),false);
    g+=fld('币别',sl('cur',FCL_CURRENCY_OPTIONS,'请选择币别'),true);
    g+=fld('账单周期',txt('period','如 2026-06'),true);
    g+=fld('账期时间','<input data-ab="due" type="text" value="'+esc(A.due)+'" oninput="abSet(\'due\',this.value)" class="'+inCls+'">',true);
    g+=fld('备注','<textarea data-ab="remark" rows="3" oninput="abSet(\'remark\',this.value)" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入备注'))+'">'+esc(A.remark)+'</textarea>',false,'md:col-span-2');
    g+='</div>';
    h+=abSection('基本信息',g);
    /* ② 应付明细 —— 上传 Excel 带进来，或直接在表里加行 */
    var d='';
    d+='<button type="button" onclick="abDownloadTpl()" class="h-8 px-3 mb-3 text-xs font-medium text-white bg-amber-500 rounded hover:bg-amber-600 cursor-pointer">'+tr('下载模板')+'</button>';
    d+='<div class="rounded-lg border-2 border-dashed border-surface-200 bg-surface-50/60 py-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors" onclick="document.getElementById(\'ab-xls\').click()">';
    d+='<svg class="w-9 h-9 mx-auto text-success-600 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>';
    d+='<div class="text-sm text-text-secondary">'+tr('将文件拖到此处，')+'<span class="text-primary-600">'+tr('或点击上传')+'</span></div>';
    d+='<div class="text-xs text-text-muted mt-1">'+esc(tr('按模板列：单号 / 财务科目 / 费用金额 / 备注'))+'</div>';
    d+='<input type="file" id="ab-xls" class="hidden" onchange="abPickXls(this)"></div>';
    d+='<div data-ab-detail class="mt-3">'+agentBillNewDetailHtml()+'</div>';
    h+=abSection('应付明细',d);
    /* ③ 附件信息 */
    var a='';
    a+='<div class="flex items-center gap-3 mb-3"><label class="text-sm text-text-secondary whitespace-nowrap">'+tr('请选择附件类型')+'</label>'+
       '<select onchange="abSet(\'attachType\',this.value)" class="h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 w-48">'+
       selectOptionsHtml(AGENT_BILL_ATTACH_TYPES,A.attachType)+'</select></div>';
    a+='<div class="rounded-lg border-2 border-dashed border-surface-200 bg-surface-50/60 py-7 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors" onclick="document.getElementById(\'ab-att\').click()">';
    a+='<svg class="w-9 h-9 mx-auto text-text-muted mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>';
    a+='<div class="text-sm text-text-secondary">'+tr('点击或者拖动文件到该区域来上传')+'</div>';
    a+='<div class="text-xs text-text-muted mt-1">'+esc(tr('请上传 大小不超过 25MB 格式为 doc/xls/xlsx/txt/pdf/zip/rar/jpg/jpeg/png/gif/bmp 的文件 最多上传10个附件'))+'</div>';
    a+='<input type="file" id="ab-att" multiple class="hidden" onchange="abPickAttach(this)"></div>';
    a+='<div data-ab-files class="mt-3">'+agentBillNewFilesHtml()+'</div>';
    h+=abSection('附件信息',a);
    return h;
}
function abSet(k,v){
    if(!_abNew)return;
    _abNew[k]=v;
    if(k==='cur')abRedrawDetail();   /* 币别变了，明细合计的币种跟着变 */
}
function abDownloadTpl(){
    showToast(tr('模板已下载')+'：'+tr('代理账单明细模板')+'.xlsx（'+tr('列')+'：'+
        tr('单号')+' / '+tr('财务科目')+' / '+tr('费用金额')+' / '+tr('备注')+'）');
}
/* 原型不解析 Excel：选中文件即按模板列灌一批示例明细，演示「导入后可继续改」 */
function abPickXls(input){
    var f=(input&&input.files&&input.files[0])?input.files[0].name:'';
    if(!f)return;
    var sample=[
        {sel:false,no:'FBK-20260613001',acct:'海运费',amt:'4200',remark:'40HQ×1'},
        {sel:false,no:'FBK-20260612002',acct:'海运费',amt:'4200',remark:'40HQ×1'},
        {sel:false,no:'FBK-20260611003',acct:'海运费',amt:'4200',remark:'40HQ×1'}
    ];
    /* 已经手填过的行保留，导入的追加在后面 —— 两种录入方式混着用 */
    var kept=_abNew.rows.filter(function(r){return abRowFilled(r);});
    _abNew.rows=kept.concat(sample);
    abRedrawDetail();
    showToast(tr('已从')+' '+f+' '+tr('读取')+' '+sample.length+' '+tr('条明细，可继续修改'));
}
function abRowFilled(r){
    return String(r.no||'').trim()||String(r.acct||'').trim()||String(r.amt||'').trim();
}
function abValidRows(){
    return (_abNew.rows||[]).filter(function(r){
        return String(r.no||'').trim()&&fclParseMoney(r.amt)!==null;
    });
}
function abTotal(){
    return abValidRows().reduce(function(s,r){return s+(fclParseMoney(r.amt)||0);},0);
}
function agentBillNewDetailHtml(){
    var A=_abNew,rows=A.rows||[];
    var h='';
    h+='<div class="flex items-center gap-4 mb-2 text-sm text-text-secondary">'+
       '<span>'+tr('总条数')+'：<span class="font-semibold text-text-primary">'+abValidRows().length+'</span></span>'+
       '<span>'+tr('总金额')+'：<span class="font-semibold text-text-primary">'+esc(A.cur||'')+' '+abTotal().toFixed(2)+'</span></span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('账单金额与涉及单号数按这里自动算，不用手填'))+'</span></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto" style="max-height:'+(A.tableH||240)+'px">';
    h+='<table class="w-full text-sm"><thead class="bg-surface-50 sticky top-0"><tr>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary w-10">#</th>'+
       '<th class="px-3 py-2 w-10"><input type="checkbox" onchange="abToggleAll(this.checked)" class="rounded border-surface-300 text-primary-600"></th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr('单号')+'</th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr('财务科目')+'</th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr('费用金额')+'</th>'+
       '<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr('备注')+'</th>'+
       '</tr></thead><tbody>';
    rows.forEach(function(r,i){
        h+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-1.5 text-text-muted">'+(i+1)+'</td>'+
           '<td class="px-3 py-1.5"><input type="checkbox" data-ab-sel="'+i+'"'+(r.sel?' checked':'')+' onchange="abRowSet('+i+',\'sel\',this.checked)" class="rounded border-surface-300 text-primary-600"></td>'+
           '<td class="px-2 py-1.5"><input data-ab-no="'+i+'" type="text" value="'+esc(r.no)+'" oninput="abRowSet('+i+',\'no\',this.value)" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-white"></td>'+
           '<td class="px-2 py-1.5"><input data-ab-acct="'+i+'" type="text" list="ab-acct-options" value="'+esc(r.acct)+'" oninput="abRowSet('+i+',\'acct\',this.value)" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-white"></td>'+
           '<td class="px-2 py-1.5"><input data-ab-amt="'+i+'" type="number" value="'+esc(r.amt)+'" oninput="abRowSet('+i+',\'amt\',this.value)" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-white"></td>'+
           '<td class="px-2 py-1.5"><input data-ab-rmk="'+i+'" type="text" value="'+esc(r.remark)+'" oninput="abRowSet('+i+',\'remark\',this.value)" class="w-full h-8 px-2 text-sm border border-surface-200 rounded bg-white"></td>'+
           '</tr>';
    });
    h+='</tbody></table></div>';
    h+='<datalist id="ab-acct-options">'+FCL_FEE_NAMES.map(function(n){return '<option value="'+esc(n)+'">';}).join('')+'</datalist>';
    /* 行操作条：与截图一致的「N 新增 / 删除 / 清空 / 表格高度」 */
    h+='<div class="flex items-center gap-3 mt-2 text-xs text-text-secondary flex-wrap bg-surface-50 border border-surface-200 rounded-lg px-3 py-2">'+
       '<input id="ab-addn" type="number" min="1" value="1" class="w-14 h-7 px-2 text-xs border border-surface-200 rounded bg-white">'+
       '<a class="text-primary-600 hover:text-primary-700 cursor-pointer" onclick="abAddRows()">'+tr('新增')+'</a>'+
       '<a class="text-red-500 hover:text-red-600 cursor-pointer" onclick="abDelRows()">'+tr('删除')+'</a>'+
       '<a class="text-red-500 hover:text-red-600 cursor-pointer" onclick="abClearRows()">'+tr('清空')+'</a>'+
       '<span class="ml-2">'+tr('表格高度')+'：<input id="ab-th" type="number" min="120" step="20" value="'+(A.tableH||240)+'" onchange="abSetTableH(this.value)" class="w-16 h-7 px-2 text-xs border border-surface-200 rounded bg-white"> PX</span>'+
       '</div>';
    return h;
}
function abRedrawDetail(){
    var box=document.querySelector('[data-ab-detail]');
    if(box)box.innerHTML=agentBillNewDetailHtml();
}
function abRowSet(i,k,v){
    if(!_abNew||!_abNew.rows[i])return;
    _abNew.rows[i][k]=v;
    /* 改金额/单号要刷新合计，勾选与文本不用整块重画（否则输入焦点会丢） */
    if(k==='amt'||k==='no')abRefreshTotals();
}
function abRefreshTotals(){
    var box=document.querySelector('[data-ab-detail]');
    if(!box)return;
    var html=box.innerHTML;
    var re=/(总条数[^<]*<span class="font-semibold text-text-primary">)[^<]*(<\/span>)/;
    if(re.test(html)){
        html=html.replace(re,'$1'+abValidRows().length+'$2');
        html=html.replace(/(总金额[^<]*<span class="font-semibold text-text-primary">)[^<]*(<\/span>)/,
            '$1'+esc(_abNew.cur||'')+' '+abTotal().toFixed(2)+'$2');
        box.innerHTML=html;
    }
}
function abToggleAll(on){
    (_abNew.rows||[]).forEach(function(r){r.sel=!!on;});
    abRedrawDetail();
}
function abAddRows(){
    var el=document.getElementById('ab-addn');
    var n=Math.max(1,parseInt((el&&el.value)||'1',10)||1);
    for(var i=0;i<n;i++)_abNew.rows.push({sel:false,no:'',acct:'',amt:'',remark:''});
    abRedrawDetail();
    showToast(tr('已新增')+' '+n+' '+tr('行'));
}
function abDelRows(){
    var keep=(_abNew.rows||[]).filter(function(r){return !r.sel;});
    var n=(_abNew.rows||[]).length-keep.length;
    if(!n){showToast(tr('请先勾选要删除的明细行'));return;}
    _abNew.rows=keep.length?keep:[{sel:false,no:'',acct:'',amt:'',remark:''}];
    abRedrawDetail();
    showToast(tr('已删除')+' '+n+' '+tr('行'));
}
function abClearRows(){
    _abNew.rows=[{sel:false,no:'',acct:'',amt:'',remark:''}];
    abRedrawDetail();
    showToast(tr('明细已清空'));
}
function abSetTableH(v){
    _abNew.tableH=Math.max(120,parseInt(v,10)||240);
    abRedrawDetail();
}
function agentBillNewFilesHtml(){
    var files=_abNew.files||[];
    var cols=['序号','文件名称','文件类型','缩略图','文件大小(kb)','上传人','上传时间','操作'];
    var h='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
        cols.map(function(t){return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
        '</tr></thead><tbody>';
    if(!files.length){
        h+='<tr><td colspan="'+cols.length+'" class="px-3 py-8 text-center text-sm text-text-muted">'+tr('还没有上传附件')+'</td></tr>';
    }
    files.forEach(function(f,i){
        h+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 text-text-muted">'+(i+1)+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+esc(f.name)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.type)+'</td>'+
           '<td class="px-3 py-2"><span class="inline-flex w-8 h-8 items-center justify-center rounded bg-surface-100 text-[10px] text-text-muted">'+esc(f.ext)+'</span></td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.size)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.by)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.at)+'</td>'+
           '<td class="px-3 py-2"><a class="text-red-500 hover:text-red-600 cursor-pointer" onclick="abDelFile('+i+')">'+tr('删除')+'</a></td></tr>';
    });
    return h+'</tbody></table></div>';
}
function abPickAttach(input){
    var list=(input&&input.files)?input.files:[];
    if(!list.length)return;
    for(var i=0;i<list.length;i++){
        if((_abNew.files||[]).length>=10){showToast(tr('最多上传 10 个附件'));break;}
        var nm=String(list[i].name||('附件'+(i+1)));
        var sz=list[i].size?Math.max(1,Math.round(list[i].size/1024)):Math.round(Math.random()*900+60);
        _abNew.files.push({name:nm,type:_abNew.attachType,
            ext:(nm.split('.').pop()||'').toUpperCase().slice(0,4),
            size:String(sz),by:fclWho(),at:fclNow()});
    }
    abRedrawFiles();
}
function abRedrawFiles(){
    var box=document.querySelector('[data-ab-files]');
    if(box)box.innerHTML=agentBillNewFilesHtml();
}
function abDelFile(i){
    _abNew.files.splice(i,1);
    abRedrawFiles();
    showToast(tr('附件已删除'));
}
function submitAgentBillCreate(id){
    id=id||'fcl-agent-bill';
    var A=_abNew;
    if(!String(A.billNo||'').trim()){showToast(tr('请填写服务商账单号'));return;}
    if(!A.agent){showToast(tr('请选择服务商'));return;}
    if(!A.cur){showToast(tr('请选择币别'));return;}
    if(!String(A.period||'').trim()){showToast(tr('请填写账单周期'));return;}
    if(!String(A.due||'').trim()){showToast(tr('请填写账期时间'));return;}
    var rows=abValidRows();
    if(!rows.length){showToast(tr('应付明细至少要有一行（单号与费用金额都要填）'));return;}
    var noAcct=rows.filter(function(r){return !String(r.acct||'').trim();});
    if(noAcct.length){showToast(tr('有')+' '+noAcct.length+' '+tr('行没填财务科目'));return;}
    if(rows.some(function(r){return (fclParseMoney(r.amt)||0)<=0;})){showToast(tr('费用金额必须大于 0'));return;}
    var jobs=[];
    rows.forEach(function(r){var n=r.no.trim();if(jobs.indexOf(n)<0)jobs.push(n);});
    var total=abTotal();
    var billNo=fclSeqNo('AGB-',id);
    /* 明细挂到流水号下，后面对账、生成付款单、成本落地都读它 */
    _agentBillDetails[billNo]=rows.map(function(r){
        return {job:r.no.trim(),feeName:r.acct.trim(),feeKind:r.acct.trim(),
            cur:A.cur,amt:String(fclParseMoney(r.amt)),remark:String(r.remark||'')};
    });
    if(A.rule)_AGENT_BILL_RULE[billNo]=A.rule;
    fclPushRow(id,{
        '流水号':billNo,'服务商':A.agent,'服务商账单号':String(A.billNo).trim(),
        '账单周期':String(A.period).trim(),'账期时间':String(A.due).trim(),
        '币别':A.cur,'账单金额':total.toFixed(2),
        '涉及Job数':String(jobs.length),'导入人':fclWho(),'导入时间':fclNow(),
        '备注':String(A.remark||''),'账单状态':'待对账'
    });
    if(typeof _listData!=='undefined')delete _listData[id];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('已新增代理账单')+' '+billNo+'：'+rows.length+' '+tr('条明细')+'，'+
        jobs.length+' '+tr('个单号')+'，'+A.cur+' '+total.toFixed(2)+
        (A.files.length?('，'+A.files.length+' '+tr('个附件')):''));
}

/* ==========================================================================
 * 九、付款单管理 · 付款核销
 *
 * 原来的「付款登记」是手敲一笔付款金额，钱从哪出、对不对得上流水没人管。
 * 改成核销：先有付款流水（银行实际付出去的那一笔），再挑流水来冲付款单。
 * 一笔流水可以冲多张付款单，一张付款单也可以被多笔流水分次冲平，
 * 所以支持「同服务商 + 同币别」的付款单批量选中一起核销 —— 跨服务商或
 * 跨币别的不让一起选，冲账对象根本不是一回事。
 *
 * 流水存 _FCL_PAY_FLOWS，按服务商归集；核销后回写流水的已核销/未核销，
 * 同时回写付款单的已付金额/待付金额/付款方式/付款时间/付款水单与状态。
 * ========================================================================== */
/* 字段对齐「银行凭证（凭证管理）」那张表。注意「凭证借贷标识」那一列在 05 里
 * 已经从凭证管理上摘掉了，这里也就不出 —— 说是参考凭证管理，就得按它现在的样子。
 * 付款单核销用的就是「支出」方向、认领到该服务商名下的那些凭证。 */
var FCL_VOUCHER_COLS=['凭证编号','凭证状态','币别','金额(原币)','已使用金额(本位币)',
    '未使用金额(本位币)','我方账户名称','对方账号名称','交易流水号','费用时间','交割方式','财务摘要'];
var _FCL_PAY_FLOWS={
    'MAERSK':[
        {no:'P2606180001',st:'待抵扣',dc:'支出',cur:'USD',amt:8320,used:0,
         ourName:'好利航国际物流 / 招商银行 7559-***-013',payeeName:'MAERSK CHINA',
         payeeBank:'汇丰银行 深圳分行',txNo:'TXN26061800131',feeTime:'2026-06-18 15:30',
         way:'电汇',memo:'水单_MAERSK_0618.pdf'},
        {no:'P2607050002',st:'待抵扣',dc:'支出',cur:'USD',amt:4200,used:0,
         ourName:'好利航国际物流 / 招商银行 7559-***-013',payeeName:'MAERSK CHINA',
         payeeBank:'汇丰银行 深圳分行',txNo:'TXN26070500218',feeTime:'2026-07-05 10:12',
         way:'电汇',memo:'水单_MAERSK_0705.pdf'},
        {no:'P2606200003',st:'待抵扣',dc:'支出',cur:'CNY',amt:30000,used:0,
         ourName:'好利航国际物流 / 中国银行 4311-***-212',payeeName:'马士基（中国）有限公司',
         payeeBank:'中国银行 深圳分行',txNo:'TXN26062000094',feeTime:'2026-06-20 09:40',
         way:'电汇',memo:'水单_MAERSK_CNY_0620.pdf'}
    ],
    'COSCO':[
        {no:'P2606180004',st:'全部抵扣',dc:'支出',cur:'USD',amt:5180,used:5180,
         ourName:'好利航国际物流 / 招商银行 7559-***-013',payeeName:'中远海运集装箱运输',
         payeeBank:'中国银行 上海分行',txNo:'TXN26061800455',feeTime:'2026-06-18 15:30',
         way:'电汇',memo:'水单_COSCO_0618.pdf'}
    ],
    '鹏程拖车':[
        {no:'P2606200005',st:'全部抵扣',dc:'支出',cur:'CNY',amt:2000,used:2000,
         ourName:'好利航国际物流 / 招商银行 7559-***-013',payeeName:'深圳鹏程运输有限公司',
         payeeBank:'招商银行 深圳分行',txNo:'TXN26062000511',feeTime:'2026-06-20 11:00',
         way:'电汇',memo:'水单_鹏程_0620.pdf'},
        {no:'P2607020006',st:'待抵扣',dc:'支出',cur:'CNY',amt:6000,used:0,
         ourName:'好利航国际物流 / 招商银行 7559-***-013',payeeName:'深圳鹏程运输有限公司',
         payeeBank:'招商银行 深圳分行',txNo:'TXN26070200620',feeTime:'2026-07-02 14:20',
         way:'电汇',memo:'水单_鹏程_0702.pdf'}
    ],
    '深圳报关行':[
        {no:'P2606040007',st:'全部抵扣',dc:'支出',cur:'CNY',amt:1680,used:1680,
         ourName:'好利航国际物流 / 工商银行 4000-***-772',payeeName:'深圳市中远报关行',
         payeeBank:'工商银行 深圳分行',txNo:'TXN26060400772',feeTime:'2026-06-04 16:20',
         way:'电汇',memo:'水单_报关行_0604.pdf'}
    ],
    'CMA CGM':[
        {no:'P2607100008',st:'待抵扣',dc:'支出',cur:'USD',amt:3600,used:0,
         ourName:'好利航国际物流 / 招商银行 7559-***-013',payeeName:'达飞轮船（中国）',
         payeeBank:'花旗银行 上海分行',txNo:'TXN26071000830',feeTime:'2026-07-10 09:05',
         way:'电汇',memo:'水单_CMA_0710.pdf'}
    ]
};
/* 这家服务商在该币别下还有余额的流水 */
function fclPayFlowsOf(agent,cur){
    return (_FCL_PAY_FLOWS[agent]||[]).filter(function(f){return f.cur===cur;});
}
function fclFlowLeft(f){return +(((+f.amt)||0)-((+f.used)||0)).toFixed(2);}

var _apWo={id:'',idxs:[],agent:'',cur:'',bills:[],flows:[]};

function openApWriteOff(id){
    id=id||'fcl-ap-bill';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要核销的付款单'));return;}
    var rows=fclFinRows(id);
    var picked=idxs.map(function(i){return rows[i];}).filter(Boolean);
    if(!picked.length){showToast(tr('未找到付款单'));return;}
    /* 批量的前提：同服务商 + 同币别，否则冲的根本不是同一笔钱 */
    var agents=[],curs=[];
    picked.forEach(function(r){
        var a=fclFinGet(id,r,'服务商'),c=fclFinGet(id,r,'币别');
        if(agents.indexOf(a)<0)agents.push(a);
        if(curs.indexOf(c)<0)curs.push(c);
    });
    if(agents.length>1){showToast(tr('批量核销只能选同一个服务商，当前选了')+' '+agents.length+' '+tr('个'));return;}
    if(curs.length>1){showToast(tr('批量核销只能选同一个币别，当前选了')+' '+curs.join('/'));return;}
    var bad=picked.filter(function(r){
        return ['待付款','部分付款'].indexOf(fclFinGet(id,r,'账单状态'))<0;
    });
    if(bad.length){
        showToast(tr('只有「待付款」「部分付款」的付款单可以核销，有')+' '+bad.length+' '+
            tr('张不符合（')+tr(fclFinGet(id,bad[0],'账单状态'))+'）');
        return;
    }
    var agent=agents[0],cur=curs[0];
    var flows=fclPayFlowsOf(agent,cur);
    if(!flows.length){showToast(agent+' '+tr('名下没有')+' '+cur+' '+tr('的支出凭证，先去凭证管理登记'));return;}
    _apWo={id:id,idxs:idxs.slice(),agent:agent,cur:cur,
        bills:picked.map(function(r,k){
            return {idx:idxs[k],no:fclFinGet(id,r,'付款单号'),
                due:fclParseMoney(fclFinGet(id,r,'待付金额'))||0,
                total:fclParseMoney(fclFinGet(id,r,'应付金额'))||0,
                st:fclFinGet(id,r,'账单状态'),amt:''};
        }),
        flows:flows.map(function(f){return {no:f.no,sel:false,left:fclFlowLeft(f),ref:f};})};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='80%';
    document.getElementById('crud-modal-title').textContent=tr('付款核销')+' - '+agent+'（'+cur+'）';
    document.getElementById('crud-modal-body').innerHTML=apWoBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitApWriteOff()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认核销')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function apWoDueTotal(){return +_apWo.bills.reduce(function(s,b){return s+b.due;},0).toFixed(2);}
function apWoPickedFlowSum(){
    return +_apWo.flows.filter(function(f){return f.sel;})
        .reduce(function(s,f){return s+f.left;},0).toFixed(2);
}
function apWoAllocSum(){
    return +_apWo.bills.reduce(function(s,b){return s+(fclParseMoney(b.amt)||0);},0).toFixed(2);
}
function apWoBodyHtml(){
    var A=_apWo;
    var h='';
    h+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(A.agent)+'　'+esc(A.cur)+'　'+tr('选中')+' '+A.bills.length+' '+tr('张付款单')+'　'+
       tr('待付合计')+' <span class="font-semibold text-text-primary">'+esc(A.cur)+' '+apWoDueTotal().toFixed(2)+'</span>'+
       '<div class="mt-1 text-xs text-text-muted">'+
       esc(tr('先勾要用的付款凭证，再把可核销金额分到各张付款单上；同服务商同币别才能一起核销。'))+
       '</div></div>';
    h+='<div data-apwo>'+apWoInnerHtml()+'</div>';
    return h;
}
function apWoInnerHtml(){
    var A=_apWo,h='';
    /* ① 付款流水 */
    h+='<div class="mb-2 flex items-center gap-2"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('① 选择付款凭证')+'</span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('字段同凭证管理；只列认领到这家服务商、该币别、还有未使用金额的支出凭证'))+'</span></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto mb-3"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       '<th class="px-3 py-2 w-10"></th>'+
       FCL_VOUCHER_COLS.map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    var usable=0;
    A.flows.forEach(function(f,i){
        var left=f.left,dis=left<=0,v=f.ref;
        if(!dis)usable++;
        h+='<tr class="border-t border-surface-100'+(dis?' opacity-50':'')+'">'+
           '<td class="px-3 py-2"><input type="checkbox" data-apwo-f="'+i+'"'+(f.sel?' checked':'')+(dis?' disabled':'')+
           ' onchange="apWoPickFlow('+i+',this.checked)" class="rounded border-surface-300 text-primary-600"></td>'+
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
    /* ② 分配到付款单 */
    h+='<div class="mb-2 flex items-center gap-2"><span class="w-1 h-4 bg-primary-500 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('② 分配到付款单')+'</span>'+
       '<button type="button" onclick="apWoAutoFill()" class="h-7 px-2.5 text-xs font-medium text-primary-700 border border-primary-200 rounded bg-white hover:bg-primary-50 cursor-pointer">'+tr('按待付金额自动填')+'</button>'+
       '<button type="button" onclick="apWoClear()" class="h-7 px-2.5 text-xs text-text-secondary border border-surface-200 rounded bg-white hover:bg-surface-50 cursor-pointer">'+tr('清空')+'</button></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       ['付款单号','应付金额','待付金额','账单状态','本次核销'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    A.bills.forEach(function(b,i){
        h+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 font-medium text-text-primary">'+esc(b.no)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(A.cur)+' '+b.total.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+b.due.toFixed(2)+'</td>'+
           '<td class="px-3 py-2">'+statusBadge(b.st)+'</td>'+
           '<td class="px-3 py-2"><input data-apwo-b="'+i+'" type="number" value="'+esc(b.amt)+'" oninput="apWoSetAmt('+i+',this.value)" class="w-32 h-8 px-2 text-sm border border-surface-200 rounded-lg bg-surface-50"></td></tr>';
    });
    h+='</tbody></table></div>';
    h+=apWoSummaryHtml();
    return h;
}
function apWoSummaryHtml(){
    var A=_apWo;
    var flow=apWoPickedFlowSum(),alloc=apWoAllocSum(),rest=+(flow-alloc).toFixed(2);
    var ok=alloc>0&&rest>=0;
    return '<div data-apwo-sum class="mt-2 text-sm '+(ok?'text-success-700':'text-red-600')+'">'+
        tr('已选凭证可核销')+' <span class="font-semibold">'+esc(A.cur)+' '+flow.toFixed(2)+'</span>　'+
        tr('本次核销合计')+' <span class="font-semibold">'+alloc.toFixed(2)+'</span>　'+
        tr('凭证剩余')+' <span class="font-semibold">'+rest.toFixed(2)+'</span>'+
        (alloc<=0?('　'+tr('还没分配核销金额')):(rest<0?('　'+tr('核销金额超出已选凭证余额')):''))+'</div>';
}
function apWoRedraw(){
    var box=document.querySelector('[data-apwo]');
    if(box)box.innerHTML=apWoInnerHtml();
}
function apWoRefreshSum(){
    var box=document.querySelector('[data-apwo-sum]');
    if(box)box.outerHTML=apWoSummaryHtml();
}
function apWoReadUI(){
    _apWo.bills.forEach(function(b,i){
        var el=document.querySelector('[data-apwo-b="'+i+'"]');
        if(el)b.amt=String(el.value||'');
    });
}
function apWoPickFlow(i,on){
    apWoReadUI();
    if(_apWo.flows[i])_apWo.flows[i].sel=!!on;
    apWoRefreshSum();
}
function apWoSetAmt(i,v){
    if(_apWo.bills[i])_apWo.bills[i].amt=String(v||'');
    apWoRefreshSum();
}
/* 按待付金额自动填：流水够就全填，不够就按顺序填到流水用完为止 */
function apWoAutoFill(){
    apWoReadUI();
    var left=apWoPickedFlowSum();
    if(left<=0){showToast(tr('请先勾选付款凭证'));return;}
    _apWo.bills.forEach(function(b){
        var v=Math.min(b.due,+left.toFixed(2));
        b.amt=v>0?String(v.toFixed(2)):'';
        left=+(left-v).toFixed(2);
    });
    apWoRedraw();
    showToast(left>0?(tr('已按待付金额填完，凭证还剩')+' '+left.toFixed(2))
                    :tr('已按待付金额填至凭证用完'));
}
function apWoClear(){
    _apWo.bills.forEach(function(b){b.amt='';});
    apWoRedraw();
}
function submitApWriteOff(){
    apWoReadUI();
    var A=_apWo,id=A.id;
    var flows=A.flows.filter(function(f){return f.sel;});
    if(!flows.length){showToast(tr('请先勾选要用的付款凭证'));return;}
    var hit=A.bills.filter(function(b){return (fclParseMoney(b.amt)||0)>0;});
    if(!hit.length){showToast(tr('请至少给一张付款单填核销金额'));return;}
    var over=hit.filter(function(b){return (fclParseMoney(b.amt)||0)>b.due+0.004;});
    if(over.length){showToast(over[0].no+' '+tr('的核销金额超过待付金额'));return;}
    var alloc=apWoAllocSum(),avail=apWoPickedFlowSum();
    if(alloc>avail+0.004){showToast(tr('核销合计超出已选凭证余额')+' '+(+(alloc-avail)).toFixed(2));return;}
    /* 扣凭证未使用金额：按勾选顺序挨个扣，扣完一笔换下一笔 */
    var rest=alloc;
    var usedNos=[],lastWay='',lastDate='',lastSlip='';
    flows.forEach(function(f){
        if(rest<=0)return;
        var take=Math.min(f.left,rest);
        if(take<=0)return;
        f.ref.used=+(((+f.ref.used)||0)+take).toFixed(2);
        f.left=fclFlowLeft(f.ref);
        rest=+(rest-take).toFixed(2);
        usedNos.push(f.ref.no);
        lastWay=f.ref.way;lastDate=f.ref.feeTime;lastSlip=f.ref.memo||'';
    });
    /* 回写付款单：累加已付、倒算待付、据此定状态 */
    var rows=fclFinRows(id),done=0,part=0;
    hit.forEach(function(b){
        var row=rows[b.idx];
        if(!row)return;
        var pay=fclParseMoney(b.amt)||0;
        var paid=+(((fclParseMoney(fclFinGet(id,row,'已付金额'))||0)+pay)).toFixed(2);
        var total=fclParseMoney(fclFinGet(id,row,'应付金额'))||0;
        var due=+(total-paid).toFixed(2);
        fclFinSet(id,row,'已付金额',paid.toFixed(2));
        fclFinSet(id,row,'待付金额',due.toFixed(2));
        fclFinSet(id,row,'付款方式',lastWay);
        fclFinSet(id,row,'付款时间',lastDate);
        fclFinSet(id,row,'付款水单',lastSlip);
        if(due<=0.004){fclFinSet(id,row,'账单状态','已付清');done++;}
        else{fclFinSet(id,row,'账单状态','部分付款');part++;}
    });
    if(typeof _listData!=='undefined')delete _listData[id];
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('已用')+' '+usedNos.join('、')+' '+tr('核销')+' '+A.cur+' '+alloc.toFixed(2)+
        '　'+(done?(tr('已付清')+' '+done+' '+tr('张')):'')+(done&&part?'，':'')+
        (part?(tr('部分付款')+' '+part+' '+tr('张')):''));
}

/* ==========================================================================
 * 十、应收费用明细 · 新增弹窗与查看
 *
 * 应收按委托单维度录：录的人只填「哪张委托单 + 什么科目 + 多少钱」，
 * 客户名称 / 业务员 / 结算周期都是委托单和客户档案上已有的，带出来就锁住 ——
 * 手改这三个等于让同一张委托单出现两种归属，对账时谁都说不清。
 *
 * 委托方是自己人（分公司自拼的柜）时，这条整柜应收的金额不是自己填的，
 * 而是底下几票散货应收统计上来的，「查看」能看到拆分。
 * ========================================================================== */

/* 内部分公司：以委托方身份下单，底下还有一层散货应收 */
var FCL_INTERNAL_BRANCHES=['广州分公司','深圳分公司','上海分公司','义乌分公司'];
function fclIsInternalBranch(name){return FCL_INTERNAL_BRANCHES.indexOf(String(name||''))>=0;}

/* 散货拼箱的应收明细：委托单号 → 各票散货订单的应收。
 * 整柜那条的应收/已收/未收就是这里按费用科目汇总出来的。 */
var _FCL_LCL_AR={
    'FEO-20260609007':[
        {order:'LCL-20260609071',shipper:'深圳市华运达国际货运',acct:'海运费',cur:'USD',amt:3600,got:3600,due:0},
        {order:'LCL-20260609072',shipper:'佛山恒通货运代理',acct:'海运费',cur:'USD',amt:3800,got:0,due:3800},
        {order:'LCL-20260609073',shipper:'上海锦程国际贸易',acct:'海运费',cur:'USD',amt:2200,got:0,due:2200}
    ]
};
function fclLclArOf(entrust,acct){
    var list=_FCL_LCL_AR[entrust]||[];
    return acct?list.filter(function(x){return x.acct===acct;}):list;
}
/* 从散货统计：返回 {amt,got,due,n}，没有下级就回 null */
function fclLclArRollup(entrust,acct){
    var list=fclLclArOf(entrust,acct);
    if(!list.length)return null;
    var r={amt:0,got:0,due:0,n:list.length};
    list.forEach(function(x){r.amt+=(+x.amt||0);r.got+=(+x.got||0);r.due+=(+x.due||0);});
    r.amt=+r.amt.toFixed(2);r.got=+r.got.toFixed(2);r.due=+r.due.toFixed(2);
    return r;
}

/* 委托单 → 客户名称 / 业务员 / 结算周期（结算周期取客户档案，取不到给个默认） */
function fclArLookupEntrust(entrustNo){
    entrustNo=String(entrustNo||'').trim();
    if(!entrustNo)return null;
    var si=TC['fcl-sales-instruction'];
    if(!si||!si.d)return null;
    var h=si.h||[],iE=h.indexOf('委托订单号'),iC=h.indexOf('客户名称'),iS=h.indexOf('业务员');
    var row=si.d.filter(function(r){return String(r[iE]||'').trim()===entrustNo;})[0];
    if(!row)return null;
    return {cust:String(row[iC]||''),sales:String(row[iS]||''),
            term:fclCustSettleTerm(String(row[iC]||''))};
}
/* 客户档案里的结算周期：客户简称与全称都比一遍，内部分公司走默认 */
function fclCustSettleTerm(cust){
    cust=String(cust||'').trim();
    if(!cust)return '';
    var c=TC['crm-cust'];
    if(c&&c.d){
        var h=c.h||[],iS=h.indexOf('客户简称'),iF=h.indexOf('客户全称'),iT=h.indexOf('结算周期');
        for(var i=0;i<c.d.length;i++){
            var sn=String(c.d[i][iS]||''),fn=String(c.d[i][iF]||'');
            if(sn===cust||fn===cust||(sn&&cust.indexOf(sn)>=0)||(fn&&fn.indexOf(cust)>=0)){
                if(iT>=0&&c.d[i][iT])return String(c.d[i][iT]);
            }
        }
    }
    return '出货月结';
}

/* ---------- 新增弹窗（三列） ---------- */
var _arFeeNew=null;
function openArFeeAddModal(id){
    id=id||'fcl-ar-fee';
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(TC[id].d||[]);
    var all=TC[id].d||[];
    var last=(all[all.length-1]&&all[all.length-1][0])||'FAR-20260609006';
    var lm=String(last).match(/^(.*?)(\d+)$/);
    _arFeeNew={id:id,
        no:lm?lm[1]+String(parseInt(lm[2],10)+1).padStart(lm[2].length,'0'):'FAR-20260609007',
        entrust:'',cust:'',sales:'',term:'',acct:'',cur:'USD',amt:''};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='58%';
    document.getElementById('crud-modal-title').textContent=tr('新增应收费用明细');
    document.getElementById('crud-modal-body').innerHTML=arFeeAddBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitArFeeAdd()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认新增')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function arFeeAddBodyHtml(){
    var A=_arFeeNew;
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    var roCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary cursor-not-allowed';
    function fld(label,inner,req){
        return '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+
            (req?'<span class="text-red-500 mr-0.5">*</span>':'')+tr(label)+'</label>'+inner+'</div>';
    }
    function ro(val,ph){
        return '<input data-arfee-ro type="text" value="'+esc(val||'')+'" placeholder="'+esc(tr(ph||''))+'" class="'+roCls+'" readonly disabled>';
    }
    function sl(k,opts){
        var h='<select onchange="arFeeSet(\''+k+'\',this.value)" class="'+inCls+'">';
        h+='<option value="">'+tr('请选择')+'</option>';
        opts.forEach(function(o){h+='<option value="'+esc(o)+'"'+(A[k]===o?' selected':'')+'>'+esc(tr(o))+'</option>';});
        return h+'</select>';
    }
    var h='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">';
    h+=fld('流水号','<input type="text" value="'+esc(A.no)+'" class="'+roCls+'" readonly disabled>');
    /* 委托单号：回车或失焦就带出下面三项 */
    h+=fld('委托单号','<input id="arfee-entrust" type="text" value="'+esc(A.entrust)+'" '+
        'onchange="arFeeFillEntrust(this.value)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();arFeeFillEntrust(this.value);}" '+
        'placeholder="'+esc(tr('输入委托单号带出客户'))+'" class="'+inCls+'">',true);
    h+='<div class="flex flex-col gap-1.5" data-arfee-cust>'+
       '<label class="text-sm font-medium text-text-secondary">'+tr('客户名称')+'</label>'+ro(A.cust,'按委托单带出')+'</div>';
    h+='<div class="flex flex-col gap-1.5" data-arfee-sales>'+
       '<label class="text-sm font-medium text-text-secondary">'+tr('业务员')+'</label>'+ro(A.sales,'按委托单带出')+'</div>';
    h+='<div class="flex flex-col gap-1.5" data-arfee-term>'+
       '<label class="text-sm font-medium text-text-secondary">'+tr('结算周期')+'</label>'+ro(A.term,'按客户档案带出')+'</div>';
    h+=fld('费用科目',sl('acct',FCL_FEE_ACCOUNTS),true);
    h+=fld('币别',sl('cur',FCL_CURRENCY_OPTIONS),true);
    h+=fld('应收金额','<input type="number" step="0.01" value="'+esc(A.amt)+'" oninput="arFeeSet(\'amt\',this.value)" class="'+inCls+'">',true);
    h+='</div>';
    h+='<div class="mt-3 text-xs text-text-muted">'+
       esc(tr('客户名称 / 业务员 / 结算周期按委托单与客户档案带出，不能改 —— 同一张委托单的归属只能有一个。'))+
       '<br>'+esc(tr('新增后状态为「待确认」，已收 0、未收＝应收。'))+'</div>';
    return h;
}
function arFeeSet(k,v){ if(_arFeeNew)_arFeeNew[k]=v; }
/* 带出：三项一起刷新，取不到就清空并提示，不留上一张单的残值 */
function arFeeFillEntrust(v){
    var A=_arFeeNew;
    if(!A)return;
    A.entrust=String(v||'').trim();
    var hit=A.entrust?fclArLookupEntrust(A.entrust):null;
    A.cust=hit?hit.cust:'';
    A.sales=hit?hit.sales:'';
    A.term=hit?hit.term:'';
    arFeeRedrawBrought();
    if(A.entrust&&!hit)showToast(tr('委托订单管理里没有这张单')+'：'+A.entrust);
    else if(hit)showToast(tr('已带出')+'：'+hit.cust+'　'+hit.sales+'　'+hit.term);
}
function arFeeRedrawBrought(){
    var A=_arFeeNew;
    var roCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary cursor-not-allowed';
    [['data-arfee-cust','客户名称',A.cust,'按委托单带出'],
     ['data-arfee-sales','业务员',A.sales,'按委托单带出'],
     ['data-arfee-term','结算周期',A.term,'按客户档案带出']].forEach(function(p){
        var box=document.querySelector('['+p[0]+']');
        if(!box)return;
        box.innerHTML='<label class="text-sm font-medium text-text-secondary">'+tr(p[1])+'</label>'+
            '<input data-arfee-ro type="text" value="'+esc(p[2]||'')+'" placeholder="'+esc(tr(p[3]))+'" class="'+roCls+'" readonly disabled>';
    });
}
function submitArFeeAdd(){
    var A=_arFeeNew;
    if(!A){showToast(tr('请重新打开新增窗口'));return;}
    if(!A.entrust){showToast(tr('请填写委托单号'));return;}
    if(!A.cust){showToast(tr('这张委托单带不出客户，请确认委托单号'));return;}
    if(!A.acct){showToast(tr('请选择费用科目'));return;}
    if(!A.cur){showToast(tr('请选择币别'));return;}
    var amt=fclParseMoney(A.amt);
    if(amt===null||amt<=0){showToast(tr('应收金额必须大于 0'));return;}
    fclPushRow(A.id,{
        '流水号':A.no,'委托单号':A.entrust,'客户名称':A.cust,'业务员':A.sales,
        '费用科目':A.acct,'币别':A.cur,
        '应收金额':amt.toFixed(2),'已收金额':'0','未收金额':amt.toFixed(2),
        '结算周期':A.term,'费用确认状态':'待确认'
    });
    if(typeof _listData!=='undefined')delete _listData[A.id];
    closeCrudModal();
    fclFinRefresh(A.id);
    showToast(tr('已新增应收')+' '+A.no+'：'+A.cust+'　'+A.acct+'　'+A.cur+' '+amt.toFixed(2));
}

/* ---------- 查看 ---------- */
function openArFeeDetail(id,rowIdx){
    id=id||'fcl-ar-fee';
    var idx=(rowIdx!=null&&rowIdx>=0)?rowIdx:
        ((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1);
    if(idx<0){showToast(tr('请先勾选一条应收明细'));return;}
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到应收明细'));return;}
    var g=function(n){return fclFinGet(id,row,n);};
    var no=g('流水号'),entrust=g('委托单号'),cust=g('客户名称'),acct=g('费用科目'),cur=g('币别');
    var isBranch=fclIsInternalBranch(cust);
    var roll=isBranch?fclLclArRollup(entrust,acct):null;
    /* 整柜那条的三个金额以散货汇总为准：打开即对齐，免得两边对不上还要人工查 */
    if(roll){
        fclFinSet(id,row,'应收金额',roll.amt.toFixed(2));
        fclFinSet(id,row,'已收金额',roll.got.toFixed(2));
        fclFinSet(id,row,'未收金额',roll.due.toFixed(2));
        fclFinSet(id,row,'费用确认状态',roll.due<=0?'已结清':(roll.got>0?'部分收款':g('费用确认状态')));
        if(typeof _listData!=='undefined')delete _listData[id];
    }
    var b='<div class="space-y-4">';
    /* 抬头 */
    b+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">';
    [['流水号',no],['委托单号',entrust],['客户名称',cust],['业务员',g('业务员')],
     ['费用科目',acct],['币别',cur],['结算周期',g('结算周期')],['费用确认状态',g('费用确认状态')]
    ].forEach(function(p){
        b+='<div><span class="text-xs text-text-muted block">'+tr(p[0])+'</span>'+
           '<span class="font-medium text-text-primary">'+(esc(p[1])||'—')+'</span></div>';
    });
    b+='</div>';
    /* 金额 */
    b+='<div class="grid grid-cols-3 gap-3">';
    [['应收金额',g('应收金额'),'text-text-primary'],['已收金额',g('已收金额'),'text-success-700'],
     ['未收金额',g('未收金额'),'text-amber-700']].forEach(function(p){
        b+='<div class="rounded-lg border border-surface-200 px-3 py-2.5">'+
           '<div class="text-xs text-text-muted">'+tr(p[0])+'</div>'+
           '<div class="text-base font-semibold '+p[2]+'">'+esc(cur)+' '+esc(p[1]||'0')+'</div></div>';
    });
    b+='</div>';
    /* 散货拆分 */
    if(isBranch){
        if(roll){
            b+='<div>';
            b+='<div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
               '<span class="text-sm font-semibold text-text-primary">'+tr('散货拼箱应收明细')+'</span>'+
               '<span class="text-xs text-text-muted">'+
               esc(tr('委托方是')+cust+tr('（自拼柜），上面整柜的应收/已收/未收就是这几票统计出来的'))+'</span></div>';
            b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
               ['散货订单号','实际发货人','费用科目','币别','应收金额','已收金额','未收金额'].map(function(t){
                   return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';
               }).join('')+'</tr></thead><tbody>';
            fclLclArOf(entrust,acct).forEach(function(x){
                b+='<tr class="border-t border-surface-100">'+
                   '<td class="px-3 py-2 font-medium text-text-primary">'+esc(x.order)+'</td>'+
                   '<td class="px-3 py-2 text-text-secondary">'+esc(x.shipper)+'</td>'+
                   '<td class="px-3 py-2 text-text-secondary">'+esc(x.acct)+'</td>'+
                   '<td class="px-3 py-2 text-text-secondary">'+esc(x.cur)+'</td>'+
                   '<td class="px-3 py-2 text-text-primary">'+(+x.amt).toFixed(2)+'</td>'+
                   '<td class="px-3 py-2 text-success-700">'+(+x.got).toFixed(2)+'</td>'+
                   '<td class="px-3 py-2 text-amber-700">'+(+x.due).toFixed(2)+'</td></tr>';
            });
            b+='</tbody><tfoot><tr class="border-t-2 border-surface-200 bg-surface-50 font-medium">'+
               '<td class="px-3 py-2" colspan="4">'+tr('合计')+'（'+roll.n+' '+tr('票')+'）</td>'+
               '<td class="px-3 py-2">'+roll.amt.toFixed(2)+'</td>'+
               '<td class="px-3 py-2 text-success-700">'+roll.got.toFixed(2)+'</td>'+
               '<td class="px-3 py-2 text-amber-700">'+roll.due.toFixed(2)+'</td></tr></tfoot></table></div>';
            b+='<div class="mt-2 text-xs text-success-700">'+
               esc(tr('已按散货明细回算，整柜与散货合计一致。'))+'</div>';
            b+='</div>';
        }else{
            b+='<div class="px-3 py-8 text-center text-sm text-text-muted border border-dashed border-surface-200 rounded-lg">'+
               esc(tr('委托方是')+cust+tr('，但这张委托单底下还没登记散货应收明细'))+'</div>';
        }
    }else{
        b+='<div class="px-3 py-8 text-center text-sm text-text-muted border border-dashed border-surface-200 rounded-lg">'+
           esc(tr('这条是直客委托的应收，没有下级散货拆分'))+'</div>';
    }
    b+='</div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='64%';
    document.getElementById('crud-modal-title').textContent=tr('应收费用明细')+' - '+no;
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
    if(roll)fclFinRefresh(id);
}
/* ==========================================================================
 * 十一、应收收款管理 · 核销 / 反核销 / 新增费用 / 申请开票
 *
 * 台账一行 = 一张委托单该币别下的应收汇总。核销的做法与付款单管理对称：
 *   付款：挑服务商的「支出凭证」冲付款单
 *   收款：挑客户的「收入凭证」冲这张委托单下的应收费用明细
 * 区别是收款要落到费用科目那一层 —— 开票、反核销都是按费用行走的，
 * 只在汇总行上记个总数，后面谁也说不清哪笔钱冲的哪条费用。
 * ========================================================================== */

/* 客户收款凭证：字段同凭证管理（收入方向、认领到该客户名下） */
var _FCL_RECV_VOUCHERS={
    '深圳市华运达国际货运':[
        {no:'P2606220011',st:'待抵扣',dc:'收入',cur:'USD',amt:4500,used:0,
         ourName:'好利航国际物流 / 招商银行 6225-***-888',payeeName:'深圳市华运达国际货运代理有限公司',
         payeeBank:'招商银行 深圳分行',txNo:'TXN26062200911',feeTime:'2026-06-22 09:30',
         way:'电汇',memo:'回单_华运达_0622.pdf'},
        {no:'P2606220012',st:'待抵扣',dc:'收入',cur:'CNY',amt:2000,used:0,
         ourName:'好利航国际物流 / 招商银行 6225-***-888',payeeName:'深圳市华运达国际货运代理有限公司',
         payeeBank:'招商银行 深圳分行',txNo:'TXN26062200912',feeTime:'2026-06-22 09:35',
         way:'电汇',memo:'回单_华运达_0622_CNY.pdf'}
    ],
    '广州远洋进出口贸易':[
        {no:'P2606180013',st:'全部抵扣',dc:'收入',cur:'USD',amt:5600,used:5600,
         ourName:'好利航国际物流 / 招商银行 6225-***-888',payeeName:'广州远洋进出口贸易有限公司',
         payeeBank:'中国银行 广州分行',txNo:'TXN26061800713',feeTime:'2026-06-18 16:40',
         way:'电汇',memo:'回单_远洋_0618.pdf'},
        {no:'P2606200014',st:'部分抵扣',dc:'收入',cur:'CNY',amt:400,used:200,
         ourName:'好利航国际物流 / 招商银行 6225-***-888',payeeName:'广州远洋进出口贸易有限公司',
         payeeBank:'中国银行 广州分行',txNo:'TXN26062000714',feeTime:'2026-06-20 10:15',
         way:'电汇',memo:'回单_远洋_0620.pdf'}
    ],
    '广州分公司':[
        {no:'P2606250015',st:'部分抵扣',dc:'收入',cur:'USD',amt:6000,used:3600,
         ourName:'好利航国际物流 / 招商银行 6225-***-888',payeeName:'好利航国际物流广州分公司',
         payeeBank:'招商银行 广州分行',txNo:'TXN26062500815',feeTime:'2026-06-25 14:05',
         way:'内部划转',memo:'内部划转_广州分公司_0625.pdf'}
    ]
};
function fclRecvVouchersOf(cust,cur){
    return (_FCL_RECV_VOUCHERS[cust]||[]).filter(function(v){return v.cur===cur;});
}
/* 核销流水：委托单号|币别 → [{no,voucher,feeNo,feeAcct,amt,at,by}]，反核销按这里回滚 */
var _FCL_AR_WO={
    'FEO-20260612002|USD':[
        {no:'ARW-20260618001',voucher:'P2606180013',feeNo:'FAR-20260612003',feeAcct:'海运费',
         amt:5600,at:'2026-06-18 16:40',by:'张财务'}
    ],
    'FEO-20260612002|CNY':[
        {no:'ARW-20260620002',voucher:'P2606200014',feeNo:'FAR-20260612004',feeAcct:'报关费',
         amt:200,at:'2026-06-20 10:15',by:'张财务'}
    ],
    'FEO-20260609007|USD':[
        {no:'ARW-20260625003',voucher:'P2606250015',feeNo:'FAR-20260609006',feeAcct:'海运费',
         amt:3600,at:'2026-06-25 14:05',by:'张财务'}
    ]
};
function arWoKey(entrust,cur){return entrust+'|'+cur;}
function fclArWoOf(entrust,cur){return _FCL_AR_WO[arWoKey(entrust,cur)]||[];}

/* 这张委托单该币别下的应收费用明细行（作废的不算） */
function fclArFeeRowsOf(entrust,cur){
    var c=TC['fcl-ar-fee'];
    if(!c||!c.d)return [];
    var h=c.h||[];
    var iN=h.indexOf('流水号'),iE=h.indexOf('委托单号'),iA=h.indexOf('费用科目'),
        iC=h.indexOf('币别'),iAmt=h.indexOf('应收金额'),iGot=h.indexOf('已收金额'),
        iDue=h.indexOf('未收金额'),iSt=h.indexOf('费用确认状态');
    return c.d.filter(function(r){
        return String(r[iE]||'')===entrust&&String(r[iC]||'')===cur&&String(r[iSt]||'')!=='已作废';
    }).map(function(r){
        return {row:r,no:String(r[iN]||''),acct:String(r[iA]||''),cur:String(r[iC]||''),
            amt:fclParseMoney(r[iAmt])||0,got:fclParseMoney(r[iGot])||0,
            due:fclParseMoney(r[iDue])||0,st:String(r[iSt]||'')};
    });
}
/* 台账行按费用明细回算：应收总额/已核销/未核销与状态都以明细为准 */
function fclArReceiptSync(id,row){
    id=id||'fcl-ar-receipt';
    var ent=fclFinGet(id,row,'委托单号'),cur=fclFinGet(id,row,'币别');
    var list=fclArFeeRowsOf(ent,cur);
    var amt=0,got=0,due=0;
    list.forEach(function(x){amt+=x.amt;got+=x.got;due+=x.due;});
    amt=+amt.toFixed(2);got=+got.toFixed(2);due=+due.toFixed(2);
    fclFinSet(id,row,'应收总金额',amt.toFixed(2));
    fclFinSet(id,row,'已核销金额',got.toFixed(2));
    fclFinSet(id,row,'未核销金额',due.toFixed(2));
    fclFinSet(id,row,'收款状态',due<=0.004?(amt>0?'全部核销':'待核销'):(got>0?'部分核销':'待核销'));
    return {amt:amt,got:got,due:due,n:list.length};
}

/* ---------- 核销弹窗 ---------- */
var _arWo={id:'',idx:-1,entrust:'',cust:'',cur:'',vouchers:[],fees:[]};
function openArWriteOff(id){
    id=id||'fcl-ar-receipt';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要核销的委托单'));return;}
    if(idxs.length>1){showToast(tr('核销一次只能选一张委托单（同客户同币别的凭证在弹窗里可多选）'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到台账行'));return;}
    var st=fclFinGet(id,row,'收款状态');
    if(st==='全部核销'){showToast(tr('这张委托单该币别的应收已全部核销'));return;}
    var ent=fclFinGet(id,row,'委托单号'),cust=fclFinGet(id,row,'客户名称'),cur=fclFinGet(id,row,'币别');
    var fees=fclArFeeRowsOf(ent,cur).filter(function(x){return x.due>0;});
    if(!fees.length){showToast(tr('这张委托单该币别下没有未收的费用明细'));return;}
    var vs=fclRecvVouchersOf(cust,cur);
    if(!vs.length){showToast(cust+' '+tr('名下没有')+' '+cur+' '+tr('的收入凭证，先去凭证管理登记'));return;}
    _arWo={id:id,idx:idxs[0],entrust:ent,cust:cust,cur:cur,
        vouchers:vs.map(function(v){return {sel:false,left:fclFlowLeft(v),ref:v};}),
        fees:fees.map(function(x){return {no:x.no,acct:x.acct,due:x.due,amt:'',ref:x};})};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='80%';
    document.getElementById('crud-modal-title').textContent=tr('应收核销')+' - '+ent+'（'+cur+'）';
    document.getElementById('crud-modal-body').innerHTML=arWoBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitArWriteOff()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认核销')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function arWoDueTotal(){return +_arWo.fees.reduce(function(s,f){return s+f.due;},0).toFixed(2);}
function arWoVoucherSum(){
    return +_arWo.vouchers.filter(function(v){return v.sel;})
        .reduce(function(s,v){return s+v.left;},0).toFixed(2);
}
function arWoAllocSum(){
    return +_arWo.fees.reduce(function(s,f){return s+(fclParseMoney(f.amt)||0);},0).toFixed(2);
}
function arWoBodyHtml(){
    var A=_arWo;
    var h='';
    h+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(A.entrust)+'　'+esc(A.cust)+'　'+esc(A.cur)+'　'+
       tr('未收合计')+' <span class="font-semibold text-text-primary">'+esc(A.cur)+' '+arWoDueTotal().toFixed(2)+'</span>'+
       '<div class="mt-1 text-xs text-text-muted">'+
       esc(tr('先勾客户的收款凭证，再把金额分到各条费用上；核销按费用科目落账，后面开票和反核销都按费用行走。'))+
       '</div></div>';
    h+='<div data-arwo>'+arWoInnerHtml()+'</div>';
    return h;
}
function arWoInnerHtml(){
    var A=_arWo,h='';
    /* ① 客户收款凭证 —— 字段同凭证管理 */
    h+='<div class="mb-2 flex items-center gap-2"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('① 选择收款凭证')+'</span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('字段同凭证管理；只列认领到该客户、该币别、还有未使用金额的收入凭证'))+'</span></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto mb-3"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       '<th class="px-3 py-2 w-10"></th>'+
       FCL_VOUCHER_COLS.map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    var usable=0;
    A.vouchers.forEach(function(f,i){
        var left=f.left,dis=left<=0,v=f.ref;
        if(!dis)usable++;
        h+='<tr class="border-t border-surface-100'+(dis?' opacity-50':'')+'">'+
           '<td class="px-3 py-2"><input type="checkbox" data-arwo-v="'+i+'"'+(f.sel?' checked':'')+(dis?' disabled':'')+
           ' onchange="arWoPickVoucher('+i+',this.checked)" class="rounded border-surface-300 text-primary-600"></td>'+
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
           esc(tr('这个客户该币别的凭证都已抵扣完，没有可用余额'))+'</td></tr>';
    }
    h+='</tbody></table></div>';
    /* ② 费用明细 */
    h+='<div class="mb-2 flex items-center gap-2"><span class="w-1 h-4 bg-primary-500 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('② 核销到费用明细')+'</span>'+
       '<button type="button" onclick="arWoAutoFill()" class="h-7 px-2.5 text-xs font-medium text-primary-700 border border-primary-200 rounded bg-white hover:bg-primary-50 cursor-pointer">'+tr('按未收金额自动填')+'</button>'+
       '<button type="button" onclick="arWoClear()" class="h-7 px-2.5 text-xs text-text-secondary border border-surface-200 rounded bg-white hover:bg-surface-50 cursor-pointer">'+tr('清空')+'</button></div>';
    h+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       ['应收流水号','费用科目','币别','应收金额','已收金额','未收金额','本次核销'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    A.fees.forEach(function(f,i){
        h+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 font-medium text-text-primary">'+esc(f.no)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.acct)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(A.cur)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+f.ref.amt.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 text-success-700">'+f.ref.got.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 text-amber-700">'+f.due.toFixed(2)+'</td>'+
           '<td class="px-3 py-2"><input data-arwo-f="'+i+'" type="number" value="'+esc(f.amt)+'" oninput="arWoSetAmt('+i+',this.value)" class="w-32 h-8 px-2 text-sm border border-surface-200 rounded-lg bg-surface-50"></td></tr>';
    });
    h+='</tbody></table></div>';
    h+=arWoSummaryHtml();
    return h;
}
function arWoSummaryHtml(){
    var A=_arWo;
    var v=arWoVoucherSum(),alloc=arWoAllocSum(),rest=+(v-alloc).toFixed(2);
    var ok=alloc>0&&rest>=0;
    return '<div data-arwo-sum class="mt-2 text-sm '+(ok?'text-success-700':'text-red-600')+'">'+
        tr('已选凭证可核销')+' <span class="font-semibold">'+esc(A.cur)+' '+v.toFixed(2)+'</span>　'+
        tr('本次核销合计')+' <span class="font-semibold">'+alloc.toFixed(2)+'</span>　'+
        tr('凭证剩余')+' <span class="font-semibold">'+rest.toFixed(2)+'</span>'+
        (alloc<=0?('　'+tr('还没分配核销金额')):(rest<0?('　'+tr('核销金额超出已选凭证余额')):''))+'</div>';
}
function arWoRedraw(){var b=document.querySelector('[data-arwo]');if(b)b.innerHTML=arWoInnerHtml();}
function arWoRefreshSum(){var b=document.querySelector('[data-arwo-sum]');if(b)b.outerHTML=arWoSummaryHtml();}
function arWoReadUI(){
    _arWo.fees.forEach(function(f,i){
        var el=document.querySelector('[data-arwo-f="'+i+'"]');
        if(el)f.amt=String(el.value||'');
    });
}
function arWoPickVoucher(i,on){
    arWoReadUI();
    if(_arWo.vouchers[i])_arWo.vouchers[i].sel=!!on;
    arWoRefreshSum();
}
function arWoSetAmt(i,v){
    if(_arWo.fees[i])_arWo.fees[i].amt=String(v||'');
    arWoRefreshSum();
}
function arWoAutoFill(){
    arWoReadUI();
    var left=arWoVoucherSum();
    if(left<=0){showToast(tr('请先勾选收款凭证'));return;}
    _arWo.fees.forEach(function(f){
        var v=Math.min(f.due,+left.toFixed(2));
        f.amt=v>0?String(v.toFixed(2)):'';
        left=+(left-v).toFixed(2);
    });
    arWoRedraw();
    showToast(left>0?(tr('已按未收金额填完，凭证还剩')+' '+left.toFixed(2)):tr('已按未收金额填至凭证用完'));
}
function arWoClear(){_arWo.fees.forEach(function(f){f.amt='';});arWoRedraw();}
function submitArWriteOff(){
    arWoReadUI();
    var A=_arWo,id=A.id,row=fclFinRows(id)[A.idx];
    if(!row){showToast(tr('未找到台账行'));return;}
    var vs=A.vouchers.filter(function(v){return v.sel;});
    if(!vs.length){showToast(tr('请先勾选要用的收款凭证'));return;}
    var hit=A.fees.filter(function(f){return (fclParseMoney(f.amt)||0)>0;});
    if(!hit.length){showToast(tr('请至少给一条费用填核销金额'));return;}
    var over=hit.filter(function(f){return (fclParseMoney(f.amt)||0)>f.due+0.004;});
    if(over.length){showToast(over[0].no+' '+tr('的核销金额超过未收金额'));return;}
    var alloc=arWoAllocSum(),avail=arWoVoucherSum();
    if(alloc>avail+0.004){showToast(tr('核销合计超出已选凭证余额')+' '+(+(alloc-avail)).toFixed(2));return;}
    /* 扣凭证余额：按勾选顺序挨个扣 */
    var rest=alloc,usedNos=[];
    vs.forEach(function(v){
        if(rest<=0)return;
        var take=Math.min(v.left,rest);
        if(take<=0)return;
        v.ref.used=+(((+v.ref.used)||0)+take).toFixed(2);
        v.left=fclFlowLeft(v.ref);
        v.ref.st=v.left<=0?'全部抵扣':'部分抵扣';
        rest=+(rest-take).toFixed(2);
        usedNos.push(v.ref.no);
    });
    /* 冲费用明细 + 记核销流水（反核销按这个回滚） */
    var key=arWoKey(A.entrust,A.cur);
    if(!_FCL_AR_WO[key])_FCL_AR_WO[key]=[];
    var seq=_FCL_AR_WO[key].length,now=fclNow(),who=fclWho();
    hit.forEach(function(f){
        var pay=fclParseMoney(f.amt)||0;
        var got=+(f.ref.got+pay).toFixed(2),due=+(f.ref.amt-got).toFixed(2);
        fclFinSet('fcl-ar-fee',f.ref.row,'已收金额',got.toFixed(2));
        fclFinSet('fcl-ar-fee',f.ref.row,'未收金额',due.toFixed(2));
        fclFinSet('fcl-ar-fee',f.ref.row,'费用确认状态',due<=0.004?'已结清':'部分收款');
        _FCL_AR_WO[key].push({no:'ARW-'+String(2609000+(++seq)),voucher:usedNos[0]||'',
            feeNo:f.no,feeAcct:f.acct,amt:pay,at:now,by:who});
    });
    var sum=fclArReceiptSync(id,row);
    if(typeof _listData!=='undefined'){delete _listData[id];delete _listData['fcl-ar-fee'];}
    closeCrudModal();
    fclFinRefresh(id);
    showToast(tr('已用')+' '+usedNos.join('、')+' '+tr('核销')+' '+A.cur+' '+alloc.toFixed(2)+
        '　'+tr('剩余未收')+' '+sum.due.toFixed(2));
}

/* ---------- 查看：费用明细 + 核销详情（可反核销） ---------- */
var _arDetailCtx={id:'',idx:-1};
function openArReceiptDetail(id,rowIdx){
    id=id||'fcl-ar-receipt';
    var idx=(rowIdx!=null&&rowIdx>=0)?rowIdx:
        ((typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1);
    if(idx<0){showToast(tr('请先勾选一条台账'));return;}
    var row=fclFinRows(id)[idx];
    if(!row){showToast(tr('未找到台账行'));return;}
    _arDetailCtx={id:id,idx:idx};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='70%';
    document.getElementById('crud-modal-title').textContent=
        tr('应收明细与核销')+' - '+fclFinGet(id,row,'委托单号')+'（'+fclFinGet(id,row,'币别')+'）';
    document.getElementById('crud-modal-body').innerHTML=arDetailBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function arDetailBodyHtml(){
    var id=_arDetailCtx.id,row=fclFinRows(id)[_arDetailCtx.idx];
    if(!row)return '';
    var g=function(n){return fclFinGet(id,row,n);};
    var ent=g('委托单号'),cur=g('币别');
    var fees=fclArFeeRowsOf(ent,cur),wos=fclArWoOf(ent,cur);
    var b='<div class="space-y-4">';
    b+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">';
    [['委托单号',ent],['客户名称',g('客户名称')],['业务员',g('业务员')],['币别',cur],
     ['应收总金额',g('应收总金额')],['已核销金额',g('已核销金额')],['未核销金额',g('未核销金额')],
     ['收款状态',g('收款状态')]].forEach(function(p){
        b+='<div><span class="text-xs text-text-muted block">'+tr(p[0])+'</span>'+
           '<span class="font-medium text-text-primary">'+(esc(p[1])||'—')+'</span></div>';
    });
    b+='</div>';
    /* ① 费用明细 */
    b+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-primary-500 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('① 费用明细')+'</span></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       ['应收流水号','费用科目','币别','应收金额','已收金额','未收金额','费用确认状态'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    if(!fees.length)b+='<tr><td colspan="7" class="px-3 py-8 text-center text-sm text-text-muted">'+tr('还没有费用明细，点「新增费用」添加')+'</td></tr>';
    fees.forEach(function(f){
        b+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 font-medium text-text-primary">'+esc(f.no)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.acct)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.cur)+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+f.amt.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 text-success-700">'+f.got.toFixed(2)+'</td>'+
           '<td class="px-3 py-2 text-amber-700">'+f.due.toFixed(2)+'</td>'+
           '<td class="px-3 py-2">'+statusBadge(f.st)+'</td></tr>';
    });
    b+='</tbody></table></div></div>';
    /* ② 核销详情 —— 反核销按费用行走 */
    b+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('② 核销详情')+'</span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('反核销会把金额退回费用与凭证两边，按这一条回滚'))+'</span></div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       ['核销单号','收款凭证','应收流水号','费用科目','核销金额','核销人','核销时间','操作'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    if(!wos.length)b+='<tr><td colspan="8" class="px-3 py-8 text-center text-sm text-text-muted">'+tr('还没有核销记录')+'</td></tr>';
    wos.forEach(function(w,i){
        b+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2 font-medium text-text-primary">'+esc(w.no)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(w.voucher)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(w.feeNo)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(w.feeAcct)+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+esc(cur)+' '+(+w.amt).toFixed(2)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(w.by)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(w.at)+'</td>'+
           '<td class="px-3 py-2"><a class="text-red-500 hover:text-red-600 cursor-pointer" onclick="arUnWriteOff('+i+')">'+tr('反核销')+'</a></td></tr>';
    });
    b+='</tbody></table></div></div>';
    b+='</div>';
    return b;
}
function arDetailRedraw(){
    var box=document.getElementById('crud-modal-body');
    if(box)box.innerHTML=arDetailBodyHtml();
}
/* 反核销：费用的已收退回、凭证的已使用退回、核销流水删掉，台账行重算 */
function arUnWriteOff(i){
    var id=_arDetailCtx.id,row=fclFinRows(id)[_arDetailCtx.idx];
    if(!row){showToast(tr('未找到台账行'));return;}
    var ent=fclFinGet(id,row,'委托单号'),cur=fclFinGet(id,row,'币别');
    var key=arWoKey(ent,cur),list=_FCL_AR_WO[key]||[];
    var w=list[i];
    if(!w){showToast(tr('未找到核销记录'));return;}
    /* 费用行退回 */
    var fee=fclArFeeRowsOf(ent,cur).filter(function(x){return x.no===w.feeNo;})[0];
    if(fee){
        var got=+(fee.got-(+w.amt||0)).toFixed(2);
        if(got<0)got=0;
        var due=+(fee.amt-got).toFixed(2);
        fclFinSet('fcl-ar-fee',fee.row,'已收金额',got.toFixed(2));
        fclFinSet('fcl-ar-fee',fee.row,'未收金额',due.toFixed(2));
        fclFinSet('fcl-ar-fee',fee.row,'费用确认状态',got<=0?'已确认':(due<=0.004?'已结清':'部分收款'));
    }
    /* 凭证退回 */
    var v=(_FCL_RECV_VOUCHERS[fclFinGet(id,row,'客户名称')]||[]).filter(function(x){return x.no===w.voucher;})[0];
    if(v){
        v.used=+(((+v.used)||0)-(+w.amt||0)).toFixed(2);
        if(v.used<0)v.used=0;
        v.st=v.used<=0?'待抵扣':(fclFlowLeft(v)<=0?'全部抵扣':'部分抵扣');
    }
    list.splice(i,1);
    var sum=fclArReceiptSync(id,row);
    if(typeof _listData!=='undefined'){delete _listData[id];delete _listData['fcl-ar-fee'];}
    arDetailRedraw();
    fclFinRefresh(id);
    showToast(tr('已反核销')+' '+w.no+'：'+cur+' '+(+w.amt).toFixed(2)+
        (v?('，'+tr('已退回凭证')+' '+v.no):'')+'　'+tr('未收回到')+' '+sum.due.toFixed(2));
}

/* ---------- 新增费用：从台账进，委托单号带出后锁死 ---------- */
function openArAddFeeFromReceipt(id){
    id=id||'fcl-ar-receipt';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要加费用的委托单'));return;}
    if(idxs.length>1){showToast(tr('一次只能给一张委托单加费用'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到台账行'));return;}
    openArFeeAddModal('fcl-ar-fee');
    /* 把台账那行的委托单号与币别直接带进去，省得再敲一遍 */
    arFeeFillEntrust(fclFinGet(id,row,'委托单号'));
    arFeeSet('cur',fclFinGet(id,row,'币别'));
    var box=document.getElementById('crud-modal-body');
    if(box)box.innerHTML=arFeeAddBodyHtml();
}

/* ---------- 申请开票 ---------- */
var FCL_INVOICE_TYPES=['增值税专用发票','增值税普通发票','形式发票(PI)','商业发票(CI)'];
var _arInv=null;
function openArInvoiceApply(id){
    id=id||'fcl-ar-receipt';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选要开票的委托单'));return;}
    if(idxs.length>1){showToast(tr('申请开票一次只能选一张委托单'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到台账行'));return;}
    var ent=fclFinGet(id,row,'委托单号'),cur=fclFinGet(id,row,'币别');
    var fees=fclArFeeRowsOf(ent,cur);
    if(!fees.length){showToast(tr('这张委托单该币别下没有费用明细，先新增费用'));return;}
    _arInv={id:id,idx:idxs[0],entrust:ent,cust:fclFinGet(id,row,'客户名称'),cur:cur,
        type:FCL_INVOICE_TYPES[0],title:fclFinGet(id,row,'客户名称'),taxNo:'',remark:'',
        fees:fees.map(function(f){return {sel:f.due>0||f.got>0,no:f.no,acct:f.acct,amt:f.amt};})};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('申请开票')+' - '+ent+'（'+cur+'）';
    document.getElementById('crud-modal-body').innerHTML=arInvBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitArInvoiceApply()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交开票申请')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function arInvSum(){
    return +(_arInv.fees.filter(function(f){return f.sel;})
        .reduce(function(s,f){return s+f.amt;},0)).toFixed(2);
}
function arInvBodyHtml(){
    var A=_arInv;
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    var h='<div class="space-y-4">';
    h+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('发票类型')+'<span class="text-red-500 ml-0.5">*</span></label>'+
       '<select onchange="arInvSet(\'type\',this.value)" class="'+inCls+'">'+selectOptionsHtml(FCL_INVOICE_TYPES,A.type)+'</select></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('开票抬头')+'<span class="text-red-500 ml-0.5">*</span></label>'+
       '<input type="text" value="'+esc(A.title)+'" oninput="arInvSet(\'title\',this.value)" class="'+inCls+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('纳税人识别号')+'</label>'+
       '<input type="text" value="'+esc(A.taxNo)+'" oninput="arInvSet(\'taxNo\',this.value)" placeholder="'+esc(tr('专票必填'))+'" class="'+inCls+'"></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-3"><label class="text-sm font-medium text-text-secondary">'+tr('开票备注')+'</label>'+
       '<textarea rows="2" oninput="arInvSet(\'remark\',this.value)" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y">'+esc(A.remark)+'</textarea></div>';
    h+='</div>';
    h+='<div><div class="flex items-center gap-2 mb-2"><span class="w-1 h-4 bg-primary-500 rounded-full"></span>'+
       '<span class="text-sm font-semibold text-text-primary">'+tr('开票费用明细')+'</span>'+
       '<span class="text-xs text-text-muted">'+esc(tr('勾选要开进这张发票的费用'))+'</span></div>';
    h+='<div data-arinv class="border border-surface-200 rounded-lg overflow-auto">'+arInvTableHtml()+'</div></div>';
    h+='</div>';
    return h;
}
function arInvTableHtml(){
    var A=_arInv;
    var h='<table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       '<th class="px-3 py-2 w-10"></th>'+
       ['应收流水号','费用科目','币别','应收金额'].map(function(t){
           return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    A.fees.forEach(function(f,i){
        h+='<tr class="border-t border-surface-100">'+
           '<td class="px-3 py-2"><input type="checkbox" data-arinv-f="'+i+'"'+(f.sel?' checked':'')+
           ' onchange="arInvPick('+i+',this.checked)" class="rounded border-surface-300 text-primary-600"></td>'+
           '<td class="px-3 py-2 font-medium text-text-primary">'+esc(f.no)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(f.acct)+'</td>'+
           '<td class="px-3 py-2 text-text-secondary">'+esc(A.cur)+'</td>'+
           '<td class="px-3 py-2 text-text-primary">'+f.amt.toFixed(2)+'</td></tr>';
    });
    h+='</tbody><tfoot><tr class="border-t-2 border-surface-200 bg-surface-50 font-medium">'+
       '<td class="px-3 py-2" colspan="4">'+tr('开票合计')+'</td>'+
       '<td class="px-3 py-2">'+esc(A.cur)+' '+arInvSum().toFixed(2)+'</td></tr></tfoot></table>';
    return h;
}
function arInvSet(k,v){if(_arInv)_arInv[k]=v;}
function arInvPick(i,on){
    if(_arInv&&_arInv.fees[i])_arInv.fees[i].sel=!!on;
    var box=document.querySelector('[data-arinv]');
    if(box)box.innerHTML=arInvTableHtml();
}
function submitArInvoiceApply(){
    var A=_arInv;
    if(!A){showToast(tr('请重新打开开票申请'));return;}
    if(!A.type){showToast(tr('请选择发票类型'));return;}
    if(!String(A.title||'').trim()){showToast(tr('请填写开票抬头'));return;}
    if(A.type==='增值税专用发票'&&!String(A.taxNo||'').trim()){
        showToast(tr('开专票必须填纳税人识别号'));return;}
    var picked=A.fees.filter(function(f){return f.sel;});
    if(!picked.length){showToast(tr('请至少勾选一条要开票的费用'));return;}
    var no='INV-'+String(fclNow()).replace(/[^0-9]/g,'').slice(2,12);
    closeCrudModal();
    showToast(tr('开票申请已提交')+' '+no+'：'+A.title+'　'+A.type+'　'+
        picked.length+' '+tr('条费用')+'　'+A.cur+' '+arInvSum().toFixed(2));
}