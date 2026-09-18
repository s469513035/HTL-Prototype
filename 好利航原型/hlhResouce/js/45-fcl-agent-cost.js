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
 *       应付账单 fcl-ap-bill → 审批 → 付款登记（沿用 42 的 openApBillPay）
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
 * 一、代理账单 —— 账单头即费用行粒度（一张发票的一笔费用一行）
 * 一张发票常常覆盖多个柜，所以「账单金额」是总额，
 * 「已分摊/未分摊金额」记录摊到 Job 上的进度，允许分多次摊完。
 * ========================================================================== */
addPrototypeTable('fcl-agent-bill','代理账单',
    '流水号|服务商|服务商账单号|账单周期|币别|账单金额|已分摊金额|未分摊金额|分摊方式|涉及Job数|导入人|导入时间|备注|账单状态|操作',
    /* 账单状态即对账-请款-核销的流转：
     * 待对账 --[对账·确认费用]--> 待请款 --[生成账单]--> 待审核
     * --[应付审批通过]--> 待核销 --[付款核销]--> 部分核销 -> 全部核销；作废独立 */
    ['待对账','待请款','待审核','待核销','部分核销','全部核销','作废'],[
    ['AGB-20260615001','MAERSK','MSK-INV-260613','2026-06','USD','12600','4200','8400','按件数','3','张财务','2026-06-15 09:30','一张发票含 3 个柜，先摊了 FBK-20260613001','待对账'],
    ['AGB-20260615002','COSCO','COS-INV-260612','2026-06','USD','5180','5180','0','按票数','1','张财务','2026-06-15 09:30','','待请款'],
    ['AGB-20260615003','MAERSK','MSK-THC-260615','2026-06','USD','1200','0','1200','','2','张财务','2026-06-15 14:10','目的港 THC，2 个柜合开','待审核'],
    ['AGB-20260616004','鹏程拖车','PC-260616-11','2026-06','CNY','5400','0','5400','','3','李操作','2026-06-16 10:05','6 月上半月拖车汇总，含 3 个柜','待核销'],
    ['AGB-20260616005','深圳报关行','SZ-CD-260616','2026-06','CNY','1050','0','1050','','3','李操作','2026-06-16 10:05','3 票报关费合开','部分核销'],
    ['AGB-20260610006','CMA CGM','CMA-INV-260610','2026-06','USD','3600','3600','0','按票数','1','张财务','2026-06-10 11:20','','全部核销'],
    ['AGB-20260608007','MSC','MSC-INV-260608','2026-06','USD','900','0','900','','1','李操作','2026-06-08 16:40','重复开票，已作废','作废']
],[
    {label:'流水号',type:'text'},
    {label:'服务商',type:'select',options:FCL_AGENT_OPTIONS},
    {label:'服务商账单号',type:'text'},
    {label:'账单周期',type:'text'},
    {label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},
    {label:'账单状态',type:'select',options:['待对账','待请款','待审核','待核销','部分核销','全部核销','作废']}
]);
TC['fcl-agent-bill'].modalExcludedFields=['已分摊金额','未分摊金额','分摊方式','涉及Job数',
    '导入人','导入时间','账单状态'];
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
     ['账单周期',fclFinGet(id,row,'账单周期')],['账单金额',cur+' '+fclFinGet(id,row,'账单金额')],
     ['已分摊金额',fclFinGet(id,row,'已分摊金额')],['未分摊金额',fclFinGet(id,row,'未分摊金额')],
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
    if(!idxs.length){showToast(tr('请先勾选要生成账单的代理账单'));return;}
    if(idxs.length>1){showToast(tr('生成账单一次只能选一张'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到账单'));return;}
    var st=fclFinGet(id,row,'账单状态');
    if(st!=='待请款'){showToast(tr('仅「待请款」的账单可生成应付账单，当前为')+'「'+tr(st)+'」');return;}
    var billNo=fclFinGet(id,row,'流水号');
    var agent=fclFinGet(id,row,'服务商');
    var cur=fclFinGet(id,row,'币别');
    var bank=fclAgentBankOf(agent);
    var list=agentBillDetailsOf(billNo);
    var jobs=agentBillJobsOf(billNo);
    var total=list.reduce(function(s,d){return s+(fclParseMoney(d.amt)||0);},0);
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('生成应付账单')+' - '+billNo;
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
        '<button onclick="confirmAgentBillGenerateAp(\''+id+'\','+idxs[0]+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认生成')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function confirmAgentBillGenerateAp(id,rowIdx){
    id=id||'fcl-agent-bill';
    var row=fclFinRows(id)[rowIdx];
    if(!row){showToast(tr('未找到账单'));return;}
    if(fclFinGet(id,row,'账单状态')!=='待请款'){showToast(tr('仅「待请款」的账单可生成应付账单'));return;}
    var billNo=fclFinGet(id,row,'流水号');
    var agent=fclFinGet(id,row,'服务商');
    var cur=fclFinGet(id,row,'币别');
    var list=agentBillDetailsOf(billNo);
    if(!list.length){showToast(tr('该账单没有费用明细，无法生成应付账单'));return;}
    var payee=((document.getElementById('apgen-payee')||{}).value||'').trim();
    var acct=((document.getElementById('apgen-acct')||{}).value||'').trim();
    var bankName=((document.getElementById('apgen-bank')||{}).value||'').trim();
    if(!payee||!acct){showToast(tr('请填写收款户名与银行账号'));return;}
    var term=((document.getElementById('apgen-term')||{}).value||'月结30天');
    var payDate=((document.getElementById('apgen-paydate')||{}).value||'');
    var purpose=((document.getElementById('apgen-purpose')||{}).value||'').trim();
    var total=list.reduce(function(s,d){return s+(fclParseMoney(d.amt)||0);},0);
    var apNo=fclSeqNo('FAP','fcl-ap-bill');
    var payNo=fclSeqNo('PAY','fcl-ap-bill');
    fclPushRow('fcl-ap-bill',{
        '应付账单号':apNo,
        '付款申请号':payNo,
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
    showToast(tr('已生成应付账单')+' '+apNo+'（'+cur+' '+total.toFixed(2)+'），'+tr('代理账单进入「待审核」'));
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
    ['JCG-20260609007','FBK-20260609006','FEO-20260609007','深圳市华运达国际货运','纺织品','180','52.0','7400','2026-06-14 13:50','','','','已出运']
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
 * ⚠ 一级（代理账单→Job）的入口已去掉：供应商本来就按 Job No 给费用明细，
 *   不需要我们再摊。下面所有 level===1 的分支目前走不到，保留是因为
 *   二级与它共用这套取数/算份/校验逻辑，拆开反而容易把二级改坏；
 *   哪天要恢复一级分摊，补一个入口函数设 _fclAlloc.level=1 即可。
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
    var st=fclFinGet(id,row,'对账状态');
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
        costNo:fclFinGet(id,row,'实际成本号'),
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
    if(_fclAlloc.level===1)submitAgentBillAlloc(rows);
    else submitShipmentAlloc(rows);
}

/* 一级落地：往代理实际成本追加行，并回写账单的分摊进度 */
function submitAgentBillAlloc(rows){
    var A=_fclAlloc,basisLabel=fclAllocBasisLabel(A.basis);
    var costId='fcl-agent-cost';
    var billRow=fclFinRows(A.srcId)[A.srcIdx];
    if(!billRow){showToast(tr('未找到账单'));return;}
    var srcBillNo=fclFinGet(A.srcId,billRow,'服务商账单号');
    rows.forEach(function(r){
        var job=r.target.trim();
        fclPushRow(costId,{
            '实际成本号':fclSeqNo('FAC',costId),
            '代理账单号':A.billNo,
            'Job No':job,
            '服务商':A.agent,
            '费用名称':A.feeName,
            '费用类别':A.feeKind,
            '币别':A.currency,
            '预估金额':fclEstAmountOf(job,A.feeName),
            '实际金额':fclParseMoney(r.amt).toFixed(2),
            '分摊方式':basisLabel,
            '分摊权重':r.w,
            '服务商账单号':srcBillNo,
            '对账状态':'待对账'
        });
    });
    /* 回写账单：已摊/未摊金额、涉及 Job 数（按实际成本表里的去重数，别用累加免得重复摊时算错） */
    var total=fclParseMoney(fclFinGet(A.srcId,billRow,'账单金额'))||0;
    var done=(fclParseMoney(fclFinGet(A.srcId,billRow,'已分摊金额'))||0)+
             rows.reduce(function(s,r){return s+(fclParseMoney(r.amt)||0);},0);
    var left=+(total-done).toFixed(2);
    fclFinSet(A.srcId,billRow,'已分摊金额',done.toFixed(2));
    fclFinSet(A.srcId,billRow,'未分摊金额',left.toFixed(2));
    fclFinSet(A.srcId,billRow,'分摊方式',basisLabel);
    fclFinSet(A.srcId,billRow,'涉及Job数',String(fclJobCountOfBill(A.billNo)));
    /* 分摊进度只写「已分摊/未分摊金额」两列，不再动账单状态 ——
     * 账单状态现在走 对账→请款→审核→核销 这条线，与分摊是两个维度 */
    if(typeof _listData!=='undefined')delete _listData[costId];
    closeCrudModal();
    fclFinRefresh(A.srcId);
    showToast(tr('已分摊到')+' '+rows.length+' '+tr('个 Job')+'，'+
        tr('生成代理实际成本')+' '+rows.length+' '+tr('条')+'，'+
        (left<=0?tr('账单已全额分摊'):(tr('剩余未分摊')+' '+left.toFixed(2))));
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
        iA=h.indexOf('实际金额'),iV=h.indexOf('服务商'),iC=h.indexOf('币别'),iS=h.indexOf('对账状态');
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
        var st=fclFinGet(id,row,'对账状态');
        if(['对账一致','已确认'].indexOf(st)<0||fclFinGet(id,row,'应付账单号')){bad++;return;}
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
        var payNo=fclSeqNo('PAY','fcl-ap-bill');
        fclPushRow('fcl-ap-bill',{
            '应付账单号':apNo,'付款申请号':payNo,'服务商':g.agent,'账单周期':period,
            '涉及Job数':String(Object.keys(g.jobs).length),'费用行数':String(g.rows.length),
            '币别':g.cur,'应付金额':g.amt.toFixed(2),'已付金额':'0','待付金额':g.amt.toFixed(2),
            '账期':term,'付款用途':use,'期望付款时间':exp,'到期日':fclDueDateFrom(term),
            '收款账号':acc,'申请人':who,'申请时间':now,'账单状态':'待审批'
        });
        /* 回写成本行：锁定，避免同一笔费用被重复申请付款 */
        g.rows.forEach(function(row){
            fclFinSet(srcId,row,'应付账单号',apNo);
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
    document.getElementById('crud-modal-title').textContent=tr('审批')+' - '+fclFinGet(id,row,'应付账单号');
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
    var apNo=fclFinGet(id,row,'应付账单号');
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
    var h=c.h||[],iA=h.indexOf('应付账单号'),iS=h.indexOf('对账状态');
    if(iA<0)return 0;
    var n=0;
    c.d.forEach(function(r){
        if(String(r[iA]||'')!==apNo)return;
        r[iA]='';
        if(iS>=0)r[iS]='对账一致';
        n++;
    });
    return n;
}
/* ===== 应付账单：查看明细 —— 这张账单是由哪些成本行凑出来的 ===== */
function openApBillDetail(id){
    id=id||'fcl-ap-bill';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选一张应付账单'));return;}
    var row=fclFinRows(id)[idxs[0]];
    if(!row){showToast(tr('未找到账单'));return;}
    var apNo=fclFinGet(id,row,'应付账单号');
    var c=TC['fcl-agent-cost'],h=(c&&c.h)||[];
    var iA=h.indexOf('应付账单号');
    var list=(c&&c.d&&iA>=0)?c.d.filter(function(r){return String(r[iA]||'')===apNo;}):[];
    var cols=['实际成本号','Job No','费用名称','费用类别','币别','实际金额','分摊方式','代理账单号','服务商账单号'];
    var b='';
    b+='<div class="mb-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-sm text-text-secondary">'+
       esc(apNo)+'　'+esc(fclFinGet(id,row,'服务商'))+'　'+
       esc(fclFinGet(id,row,'币别'))+' '+esc(fclFinGet(id,row,'应付金额'))+'　'+
       tr('状态')+' '+esc(tr(fclFinGet(id,row,'账单状态')))+'</div>';
    b+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>'+
       cols.map(function(t){return '<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(t)+'</th>';}).join('')+
       '</tr></thead><tbody>';
    if(!list.length){
        b+='<tr><td colspan="'+cols.length+'" class="px-3 py-12 text-center text-sm text-text-muted">'+tr('没有找到关联的成本行')+'</td></tr>';
    }
    var sum=0;
    list.forEach(function(r){
        b+='<tr class="border-t border-surface-100">'+cols.map(function(t){
            var k=h.indexOf(t);
            if(t==='实际金额')sum+=(fclParseMoney(k>=0?r[k]:'')||0);
            return '<td class="px-3 py-2 text-text-primary whitespace-nowrap">'+esc(k>=0?String(r[k]||''):'')+'</td>';
        }).join('')+'</tr>';
    });
    b+='</tbody></table></div>';
    b+='<div class="mt-2 text-sm text-text-secondary">'+tr('费用行数')+' <span class="font-semibold text-text-primary">'+list.length+
       '</span>　'+tr('合计')+' <span class="font-semibold text-text-primary">'+sum.toFixed(2)+'</span></div>';
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('账单明细')+' - '+apNo;
    document.getElementById('crud-modal-body').innerHTML=b;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* ===== 代理账单：作废 —— 已经摊出去的不让作废，否则实际成本会对不上账 ===== */
function voidAgentBillRows(id){
    id=id||'fcl-agent-bill';
    var idxs=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!idxs.length){showToast(tr('请先勾选需要作废的账单'));return;}
    var rows=fclFinRows(id),ok=[],allocated=0,already=0;
    idxs.forEach(function(i){
        var row=rows[i];if(!row)return;
        if(fclFinGet(id,row,'账单状态')==='作废'){already++;return;}
        if((fclParseMoney(fclFinGet(id,row,'已分摊金额'))||0)>0){allocated++;return;}
        ok.push(row);
    });
    if(!ok.length){
        showToast(allocated?tr('已分摊过的账单不能作废，请先撤销分摊'):tr('所选账单已是作废状态'));return;
    }
    var msg=tr('确认作废')+' '+ok.length+' '+tr('张账单')+'？';
    if(allocated)msg+='（'+allocated+' '+tr('张已分摊将跳过')+'）';
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
var BILL_IMPORT_EXCLUDE=['操作','流水号','已分摊金额','未分摊金额','分摊方式','涉及Job数',
    '导入人','导入时间','账单状态'];
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
        var amt=fclParseMoney(map['账单金额']);
        var billNo=fclSeqNo('AGB',id);
        map['流水号']=billNo;
        map['已分摊金额']='0';
        map['未分摊金额']=(amt===null?'':amt.toFixed(2));
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
