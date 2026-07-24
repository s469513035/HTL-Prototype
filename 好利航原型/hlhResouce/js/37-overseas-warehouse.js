/* ============================================================
 * 海外仓 (overseas-wh) L1 板块
 * 依据《好利航海外仓提货标准 V1.0》SOP：
 *   提货预约(上门提货/派送+派送费) → 放货单DO/二维码 → 8道硬闸 →
 *   仓库到货(按配舱单逐件扫描入库) → 出库(按提货单逐件扫描出库)
 * 桌面：4 张列表 + 3 个 SOP 详情弹窗；扫描端：接入仓库PDA(见 17)。
 * 依赖 05 的 addPrototypeTable(已先加载)。
 * ============================================================ */

var OW_WAREHOUSES=['拉各斯海外仓','达喀尔海外仓','阿比让海外仓','特马海外仓','杜阿拉海外仓'];

/* ---------- 需求1：提货预约管理 ---------- */
addPrototypeTable('ow-pickup','提货预约管理',
    '提货申请号|Job号|批次|客户|目的仓库|提货方式|派送费(USD)|件数|重量(KG)|应收合计(USD)|付款状态|放货状态|预约时段|状态|操作',
    ['待付款','待审批','已生成DO','待提货','部分提货','已完成'],
    [
        ['DR-20260715-023','HT-NG-20260715-00023','B2607-01','东莞市鑫海物流','拉各斯海外仓','上门提货','—','8','125.0','1860.00','已付款','已放行','2026-07-16 09:00','待提货'],
        ['DR-20260715-024','HT-SN-20260715-00088','B2607-02','上海锦程国际贸易','达喀尔海外仓','派送','120.00','12','240.0','2520.00','已付款','未放行','2026-07-16 10:00','待审批'],
        ['DR-20260714-019','HT-CI-20260714-00051','B2607-01','广州远航贸易','阿比让海外仓','派送','86.00','5','72.0','980.00','待付款','未放行','—','待付款'],
        ['DR-20260713-011','HT-NG-20260713-00040','B2606-09','深圳市华运达国际货运','拉各斯海外仓','上门提货','—','20','410.0','4260.00','已付款','已放行','2026-07-14 11:00','已完成'],
        ['DR-20260713-009','HT-CM-20260713-00033','B2606-08','东莞市鑫海物流','杜阿拉海外仓','派送','150.00','6','96.0','1180.00','金额不足','未放行','—','待付款'],
        ['DR-20260712-005','HT-NG-20260712-00021','B2606-07','上海锦程国际贸易','拉各斯海外仓','上门提货','—','15','300.0','3200.00','已付款','部分放行','2026-07-13 09:00','部分提货']
    ],
    [
        {label:'提货申请号',type:'text'},
        {label:'Job号',type:'text'},
        {label:'客户',type:'text'},
        {label:'目的仓库',type:'select',options:OW_WAREHOUSES},
        {label:'提货方式',type:'select',options:['上门提货','派送']},
        {label:'状态',type:'select',options:['待付款','待审批','已生成DO','待提货','部分提货','已完成']}
    ]
);
TC['ow-pickup'].fieldOptions={
    '目的仓库':OW_WAREHOUSES,
    '提货方式':['上门提货','派送'],
    '付款状态':['待付款','已付款','金额不足'],
    '放货状态':['未放行','部分放行','已放行'],
    '状态':['待付款','待审批','已生成DO','待提货','部分提货','已完成']
};
TC['ow-pickup'].noExpand=true;
TC['ow-pickup'].noAutoAudit=true;
/* 本表有 付款状态/放货状态/状态 三列含“状态”，默认取第一列会打偏，锁定生命周期“状态”列 */
TC['ow-pickup'].statusMatch=function(row,tab,headers){
    var i=headers.indexOf('状态');
    return i>=0&&row[i]===tab;
};

/* ---------- 需求3：海外仓到货(按国内配舱单逐件扫描入库) ---------- */
addPrototypeTable('ow-arrival','海外仓到货',
    '配舱单号|提单号|目的仓库|运输方式|柜号|总票数|应到件数|已到件数|到货进度|到货状态|操作',
    ['待到货','到货中','已到齐','有异常'],
    [
        ['YPCD-20260625-002','TD-20260625-002','拉各斯海外仓','海运','MSKU1234567','8','42','42','42/42','已到齐'],
        ['YPCD-20260625-001','TD-20260625-001','达喀尔海外仓','海运','COSU7654321','5','26','18','18/26','到货中'],
        ['YPCD-20260624-001','TD-20260624-001','阿比让海外仓','海运','ONEU2233445','6','30','0','0/30','待到货'],
        ['YPCD-20260620-003','TD-20260620-003','杜阿拉海外仓','空运','—','3','12','11','11/12','有异常']
    ],
    [
        {label:'配舱单号',type:'text'},
        {label:'提单号',type:'text'},
        {label:'目的仓库',type:'select',options:OW_WAREHOUSES},
        {label:'运输方式',type:'select',options:['海运','空运']},
        {label:'到货状态',type:'select',options:['待到货','到货中','已到齐','有异常']}
    ]
);
TC['ow-arrival'].noExpand=true;
TC['ow-arrival'].noAutoAudit=true;

/* ---------- 需求4：海外仓出库(按提货单逐件扫描出库) ---------- */
addPrototypeTable('ow-outbound','海外仓出库',
    '出库单号|放货单DO号|Job号|客户|目的仓库|提货方式|应出件数|已出件数|出库进度|出库状态|操作',
    ['待出库','出库中','已出库','已签收'],
    [
        ['OUT-20260716-001','DO-NG-20260715-00023','HT-NG-20260715-00023','东莞市鑫海物流','拉各斯海外仓','上门提货','8','8','8/8','已签收'],
        ['OUT-20260716-002','DO-NG-20260713-00040','HT-NG-20260713-00040','深圳市华运达国际货运','拉各斯海外仓','上门提货','20','12','12/20','出库中'],
        ['OUT-20260716-003','DO-SN-20260715-00088','HT-SN-20260715-00088','上海锦程国际贸易','达喀尔海外仓','派送','12','0','0/12','待出库']
    ],
    [
        {label:'出库单号',type:'text'},
        {label:'放货单DO号',type:'text'},
        {label:'客户',type:'text'},
        {label:'目的仓库',type:'select',options:OW_WAREHOUSES},
        {label:'出库状态',type:'select',options:['待出库','出库中','已出库','已签收']}
    ]
);
TC['ow-outbound'].noExpand=true;
TC['ow-outbound'].noAutoAudit=true;

/* ---------- 海外仓库存(在库 / 部分提货Remaining / 异常隔离) ---------- */
addPrototypeTable('ow-inventory','海外仓库存',
    '运单号|客户|目的仓库|品名|货区货位|在库件数|已提件数|剩余件数|入库时间|库存状态|操作',
    ['在库','部分提货','已提清','异常隔离'],
    [
        ['WB-20260701001','东莞市鑫海物流','拉各斯海外仓','服装配件','A区-A03','8','8','0','2026-07-05 14:20','已提清'],
        ['WB-20260701002','上海锦程国际贸易','拉各斯海外仓','手机配件','B区-B12','15','9','6','2026-07-05 15:10','部分提货'],
        ['WB-20260701003','广州远航贸易','阿比让海外仓','五金工具','C区-C09','5','0','5','2026-07-04 10:30','在库'],
        ['WB-20260630008','深圳市华运达国际货运','达喀尔海外仓','家居用品','A区-A07','12','0','12','2026-07-03 09:00','异常隔离']
    ],
    [
        {label:'运单号',type:'text'},
        {label:'客户',type:'text'},
        {label:'目的仓库',type:'select',options:OW_WAREHOUSES},
        {label:'库存状态',type:'select',options:['在库','部分提货','已提清','异常隔离']}
    ]
);
TC['ow-inventory'].noExpand=true;
TC['ow-inventory'].noAutoAudit=true;

/* ================= 桌面详情弹窗公共小工具 ================= */
function owCell(rowData,headers,name){
    var i=headers.indexOf(name);
    return i>=0?(rowData[i]==null?'':String(rowData[i])):'';
}
function owRowData(id,rowIdx){
    var c=TC[id]||{};
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    return {c:c,row:data[rowIdx]};
}
function owOpenModal(title,widthPct,bodyHtml,footerHtml){
    var titleEl=document.getElementById('crud-modal-title');
    var bodyEl=document.getElementById('crud-modal-body');
    var footerEl=document.getElementById('crud-modal-footer');
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width=widthPct||'70%';
    if(titleEl)titleEl.textContent=title;
    if(bodyEl)bodyEl.innerHTML=bodyHtml;
    if(footerEl)footerEl.innerHTML=footerHtml||('<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>');
    var modal=document.getElementById('crud-modal');
    if(modal)modal.classList.add('show');
}
function owInfoGrid(pairs,cols){
    var h='<div class="grid grid-cols-2 md:grid-cols-'+(cols||4)+' gap-x-6 gap-y-3">';
    pairs.forEach(function(p){
        h+='<div class="min-w-0"><div class="text-xs text-text-muted">'+tr(p[0])+'</div><div class="text-sm font-semibold text-text-primary mt-0.5 break-all">'+esc(p[1]==null||p[1]===''?'—':tr(String(p[1])))+'</div></div>';
    });
    h+='</div>';
    return h;
}
function owSectionTitle(t){
    return '<div class="text-sm font-semibold text-primary-700 border-l-3 border-primary-500 pl-2 mb-3">'+tr(t)+'</div>';
}
function owProgressBar(done,total){
    var pct=total>0?Math.round(done/total*100):0;
    return '<div class="w-full"><div class="flex justify-between text-xs text-text-muted mb-1"><span>'+tr('扫描进度')+'</span><span class="font-semibold text-primary-700">'+done+' / '+total+'（'+pct+'%）</span></div>'+
        '<div class="h-2.5 rounded-full bg-surface-200 overflow-hidden"><div class="h-full rounded-full bg-primary-500" style="width:'+pct+'%"></div></div></div>';
}
function owQrBlock(){
    /* 7×7 伪二维码占位，示意 DO 一次性核销二维码 */
    var pat=['1111111','1000101','1011101','1010001','1110111','1000001','1111011'];
    var h='<div class="inline-block p-2 bg-white border border-surface-200 rounded-lg"><div class="grid grid-cols-7 gap-0.5">';
    pat.forEach(function(rowStr){
        rowStr.split('').forEach(function(bit){
            h+='<span class="w-4 h-4 '+(bit==='1'?'bg-slate-900':'bg-white')+'"></span>';
        });
    });
    h+='</div></div>';
    return h;
}
/* 8道硬闸校验（按提货预约状态推断已通过的闸） */
function owHardGates(rowData,headers){
    var payStatus=owCell(rowData,headers,'付款状态');
    var releaseStatus=owCell(rowData,headers,'放货状态');
    var status=owCell(rowData,headers,'状态');
    var paid=payStatus==='已付款';
    var approved=paid&&status!=='待审批'&&status!=='待付款';
    var doGen=approved&&['已生成DO','待提货','部分提货','已完成'].indexOf(status)>=0;
    var released=releaseStatus==='已放行'||releaseStatus==='部分放行';
    var done=status==='已完成';
    var gates=[
        ['1 付款','有付款→可审批',paid],
        ['2 审批','有审批→可生成DO',approved],
        ['3 生成DO','有DO→仓库可开单',doGen],
        ['4 二维码','有二维码→可扫描',doGen],
        ['5 身份证','核验身份→可确认',released],
        ['6 客户签字','客户签字→可关单',done],
        ['7 仓管签字','仓管签字→可减库存',done],
        ['8 库存减少','库存减少→订单完成',done]
    ];
    var h='<div class="grid grid-cols-2 md:grid-cols-4 gap-2">';
    gates.forEach(function(g){
        var ok=g[2];
        h+='<div class="rounded-lg border px-3 py-2 '+(ok?'border-green-200 bg-green-50':'border-surface-200 bg-surface-50')+'">'+
            '<div class="flex items-center justify-between"><span class="text-xs font-semibold '+(ok?'text-green-700':'text-text-secondary')+'">'+tr(g[0])+'</span>'+
            '<span class="text-xs '+(ok?'text-green-600':'text-text-muted')+'">'+(ok?'✓ '+tr('通过'):'○ '+tr('待满足'))+'</span></div>'+
            '<div class="text-[11px] text-text-muted mt-1">'+tr(g[1])+'</div></div>';
    });
    h+='</div>';
    return h;
}

/* ================= 需求1：提货预约详情（放货单DO / 费用 / 硬闸 / 派送费） ================= */
function openOverseasPickupDetail(id,rowIdx){
    var d=owRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到提货预约数据'));return;}
    var apptNo=owCell(row,headers,'提货申请号');
    var job=owCell(row,headers,'Job号');
    var pickupType=owCell(row,headers,'提货方式');
    var deliveryFee=owCell(row,headers,'派送费(USD)');
    var status=owCell(row,headers,'状态');
    var isDelivery=pickupType==='派送';
    var totalDue=owCell(row,headers,'应收合计(USD)');
    /* 费用明细：其余项 mock，派送费取行值 */
    var feeRows=[
        ['运输费','USD 1,200.00'],
        ['仓租','USD 180.00'],
        ['派送费', isDelivery?('USD '+(deliveryFee||'0.00')):'USD 0.00（上门提货免派送）'],
        ['改单费','USD 20.00'],
        ['其他费用','USD 0.00']
    ];
    var h='<div class="space-y-5">';
    /* 顶栏 */
    h+='<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-100 bg-primary-50/50 px-4 py-3">';
    h+='<div><div class="text-xs text-text-muted">'+tr('提货申请号')+'</div><div class="text-base font-bold text-primary-700">'+esc(apptNo)+'</div></div>';
    h+='<span class="rounded-full bg-white border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700">'+tr(status)+'</span>';
    h+='</div>';
    /* 基本信息 */
    h+='<section>'+owSectionTitle('提货基本信息')+owInfoGrid([
        ['Job号',job],['批次',owCell(row,headers,'批次')],['客户',owCell(row,headers,'客户')],['目的仓库',owCell(row,headers,'目的仓库')],
        ['提货方式',pickupType],['件数',owCell(row,headers,'件数')],['重量(KG)',owCell(row,headers,'重量(KG)')],['预约时段',owCell(row,headers,'预约时段')]
    ])+'</section>';
    /* 费用明细 */
    h+='<section>'+owSectionTitle('费用账单（客服只能查看·不能修改）');
    h+='<div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm">';
    h+='<thead class="bg-surface-50 text-text-secondary"><tr><th class="px-3 py-2 text-left font-medium">'+tr('费用项')+'</th><th class="px-3 py-2 text-right font-medium">'+tr('金额')+'</th></tr></thead><tbody>';
    feeRows.forEach(function(f){
        h+='<tr class="border-t border-surface-100"><td class="px-3 py-2 text-text-primary">'+tr(f[0])+'</td><td class="px-3 py-2 text-right text-text-secondary">'+esc(f[1])+'</td></tr>';
    });
    h+='<tr class="border-t border-surface-200 bg-primary-50/40"><td class="px-3 py-2 font-semibold text-primary-700">'+tr('应收合计')+'</td><td class="px-3 py-2 text-right font-bold text-primary-700">USD '+esc(totalDue)+'</td></tr>';
    h+='</tbody></table></div>';
    h+='<div class="mt-2 text-[11px] text-amber-600">'+tr('提示：费用账单凭证核销在【财务结算】板块处理，此处仅展示应收。')+'</div>';
    h+='</section>';
    /* 派送信息（仅派送） */
    if(isDelivery){
        h+='<section>'+owSectionTitle('派送信息（派送方式）')+owInfoGrid([
            ['派送方式','海外仓配送'],['派送费(USD)',deliveryFee],['派送服务商','拉各斯本地派送-A'],
            ['派送地址','Lagos, Ikeja GRA, 23 Isaac John St.'],['收货联系人','Mr. Okafor'],['预计送达','2026-07-17']
        ])+'</section>';
    }else{
        h+='<section>'+owSectionTitle('上门提货信息')+owInfoGrid([
            ['提货方式','客户上门自提'],['提货人','Mr. Okafor'],['提货人电话','+234 802 000 111'],
            ['身份证/证件','ID·A1234567'],['车牌号','LOS-882-KJA'],['预约时段',owCell(row,headers,'预约时段')]
        ])+'</section>';
    }
    /* 放货单 DO + 二维码 */
    h+='<section>'+owSectionTitle('电子放货单 DO（一次性核销二维码）');
    h+='<div class="flex flex-wrap items-center gap-6 rounded-lg border border-surface-200 bg-white p-4">';
    h+='<div class="text-center">'+owQrBlock()+'<div class="text-[11px] text-text-muted mt-1">'+tr('仅可核销一次')+'</div></div>';
    h+='<div class="flex-1 min-w-[220px]">'+owInfoGrid([
        ['DO号','DO-'+job.replace('HT-','')],['一次性验证码','8'+apptNo.slice(-4)+'C'],['有效时间','2026-07-16 08:00~18:00'],['授权状态', (status==='待付款'||status==='待审批')?'未授权':'已授权放货']
    ],2)+'</div>';
    h+='</div></section>';
    /* 8道硬闸 */
    h+='<section>'+owSectionTitle('8 道硬闸校验（不满足即阻断放货）')+owHardGates(row,headers)+'</section>';
    h+='</div>';
    /* footer */
    var actionBtn='';
    if(status==='待审批')actionBtn='<button onclick="showToast(\''+esc(tr('放货审批已提交（需财务核对银行到账）'))+'\');closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('放货审批')+'</button>';
    else if(status==='待付款')actionBtn='<button onclick="showToast(\''+esc(tr('已通知客户付款'))+'\');closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('通知付款')+'</button>';
    else if(status==='已生成DO'||status==='待提货')actionBtn='<button onclick="showToast(\''+esc(tr('放货单DO已下发仓库'))+'\');closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('下发放货单')+'</button>';
    var footer=actionBtn+'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('关闭')+'</button>';
    owOpenModal(tr('提货预约详情')+' - '+apptNo,'76%',h,footer);
}

/* ================= 需求3：海外仓到货详情（按配舱单逐件扫描进度） ================= */
function openOverseasArrivalDetail(id,rowIdx){
    var d=owRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到到货数据'));return;}
    var allocNo=owCell(row,headers,'配舱单号');
    var arrived=parseInt(owCell(row,headers,'已到件数')||'0',10);
    var total=parseInt(owCell(row,headers,'应到件数')||'0',10);
    var h='<div class="space-y-5">';
    h+='<section>'+owSectionTitle('配舱单信息（国内配舱→海外仓到货）')+owInfoGrid([
        ['配舱单号',allocNo],['提单号',owCell(row,headers,'提单号')],['目的仓库',owCell(row,headers,'目的仓库')],['运输方式',owCell(row,headers,'运输方式')],
        ['柜号',owCell(row,headers,'柜号')],['总票数',owCell(row,headers,'总票数')],['应到件数',String(total)],['到货状态',owCell(row,headers,'到货状态')]
    ])+'</section>';
    h+='<section>'+owSectionTitle('按件到货扫描进度')+'<div class="rounded-lg border border-surface-200 bg-white p-4">'+owProgressBar(arrived,total)+'</div></section>';
    /* 运单明细：按票 */
    var subRows=[
        ['WB-20260701002','SF10086523','服装配件','8','8','已到齐'],
        ['WB-20260701012','YT98876543','手机配件','6','4','到货中'],
        ['WB-20260701018','JD30088991','五金工具','6','4','到货中'],
        ['WB-20260701020','EMS99005566','家居用品','6','2','到货中']
    ];
    h+='<section>'+owSectionTitle('运单到货明细');
    h+='<div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm">';
    h+='<thead class="bg-surface-50 text-text-secondary"><tr>'+['运单号','物流单号','品名','应到件','已扫件','状态'].map(function(x){return '<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(x)+'</th>';}).join('')+'</tr></thead><tbody>';
    subRows.forEach(function(r){
        var doneAll=r[3]===r[4];
        h+='<tr class="border-t border-surface-100"><td class="px-3 py-2 font-medium text-primary-700">'+esc(r[0])+'</td><td class="px-3 py-2 text-text-secondary">'+esc(r[1])+'</td><td class="px-3 py-2 text-text-secondary">'+tr(r[2])+'</td><td class="px-3 py-2">'+r[3]+'</td><td class="px-3 py-2 font-semibold '+(doneAll?'text-green-600':'text-amber-600')+'">'+r[4]+'</td><td class="px-3 py-2 '+(doneAll?'text-green-600':'text-text-secondary')+'">'+tr(r[5])+'</td></tr>';
    });
    h+='</tbody></table></div></section>';
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('到货入库由【仓库PDA · 海外到货扫描】按件扫描完成：选择本配舱单 → 逐件扫码 → 自动入库。')+'</div>';
    h+='</div>';
    owOpenModal(tr('海外仓到货详情')+' - '+allocNo,'74%',h);
}

/* ================= 需求4：海外仓出库详情（按提货单双扫码逐件出库） ================= */
function openOverseasOutboundDetail(id,rowIdx){
    var d=owRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到出库数据'));return;}
    var outNo=owCell(row,headers,'出库单号');
    var released=parseInt(owCell(row,headers,'已出件数')||'0',10);
    var total=parseInt(owCell(row,headers,'应出件数')||'0',10);
    var h='<div class="space-y-5">';
    h+='<section>'+owSectionTitle('放货单信息（凭提货单DO出库）')+owInfoGrid([
        ['出库单号',outNo],['放货单DO号',owCell(row,headers,'放货单DO号')],['Job号',owCell(row,headers,'Job号')],['客户',owCell(row,headers,'客户')],
        ['目的仓库',owCell(row,headers,'目的仓库')],['提货方式',owCell(row,headers,'提货方式')],['应出件数',String(total)],['出库状态',owCell(row,headers,'出库状态')]
    ])+'</section>';
    h+='<section>'+owSectionTitle('按件出库扫描进度（双扫码：放货码 + 货物标签）')+'<div class="rounded-lg border border-surface-200 bg-white p-4">'+owProgressBar(released,total)+'</div></section>';
    var subRows=[
        ['DO-01','WB-20260701004','A区-A03','已出库'],
        ['DO-02','WB-20260701004','A区-A03','已出库'],
        ['DO-03','WB-20260701005','B区-B12', released>=total?'已出库':'待出库'],
        ['DO-04','WB-20260701005','B区-B12', released>=total?'已出库':'待出库']
    ];
    h+='<section>'+owSectionTitle('子件出库明细');
    h+='<div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm">';
    h+='<thead class="bg-surface-50 text-text-secondary"><tr>'+['货物标签','运单号','货区货位','出库状态'].map(function(x){return '<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(x)+'</th>';}).join('')+'</tr></thead><tbody>';
    subRows.forEach(function(r){
        var out=r[3]==='已出库';
        h+='<tr class="border-t border-surface-100"><td class="px-3 py-2 font-medium text-primary-700">'+esc(r[0])+'</td><td class="px-3 py-2 text-text-secondary">'+esc(r[1])+'</td><td class="px-3 py-2 text-text-secondary">'+esc(r[2])+'</td><td class="px-3 py-2 '+(out?'text-green-600 font-semibold':'text-text-secondary')+'">'+tr(r[3])+'</td></tr>';
    });
    h+='</tbody></table></div></section>';
    h+='<div class="rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-700">'+tr('出库由【仓库PDA · 海外出库扫描】按提货单逐件扫码：扫放货码+货物标签核对 → 客户验货电子签名 → 释放减库存 → POD。')+'</div>';
    h+='</div>';
    owOpenModal(tr('海外仓出库详情')+' - '+outNo,'74%',h);
}

/* ============================================================
 * 仓库PDA · 海外仓扫描屏（由 17 的 generateWarehousePdaOperationScreen 路由）
 * ============================================================ */

/* ---------- 海外到货扫描 ow-arrival-scan（list/operate 两屏，按件） ---------- */
var _owArrScanView='list';
var _owArrScanCurrent=null;
var _owArrScanScanned={};
var _owArrScanTab='pending';
var _owArrScanList=[
    {no:'YPCD-20260625-001',bl:'TD-20260625-001',wh:'达喀尔海外仓',transport:'海运',
        pieces:[
            {piece:'PB-25001-01',wb:'WB-20260701002',name:'服装配件'},
            {piece:'PB-25001-02',wb:'WB-20260701002',name:'服装配件'},
            {piece:'PB-25001-03',wb:'WB-20260701012',name:'手机配件'},
            {piece:'PB-25001-04',wb:'WB-20260701012',name:'手机配件'},
            {piece:'PB-25001-05',wb:'WB-20260701018',name:'五金工具'},
            {piece:'PB-25001-06',wb:'WB-20260701018',name:'五金工具'}
        ]},
    {no:'YPCD-20260624-001',bl:'TD-20260624-001',wh:'阿比让海外仓',transport:'海运',
        pieces:[
            {piece:'PB-24001-01',wb:'WB-20260702003',name:'家居用品'},
            {piece:'PB-24001-02',wb:'WB-20260702003',name:'家居用品'},
            {piece:'PB-24001-03',wb:'WB-20260702009',name:'日用百货'},
            {piece:'PB-24001-04',wb:'WB-20260702009',name:'日用百货'}
        ]}
];

function generateOwArrivalScanScreen(){
    if(_owArrScanView==='operate'&&_owArrScanCurrent!==null&&_owArrScanList[_owArrScanCurrent]){
        return generateOwArrivalScanOperate();
    }
    return generateOwArrivalScanList();
}
function generateOwArrivalScanList(){
    var h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+=pdaScanInput('ow-arr-order','请扫描国内配舱单号','applyOwArrScanOrder','YPCD-20260625-001');
    _owArrScanList.forEach(function(item,i){
        var total=item.pieces.length;
        h+='<button type="button" onclick="pickOwArrScanCard('+i+')" class="block w-full text-left rounded-xl border border-surface-200 bg-white p-3 shadow-sm">';
        h+='<div class="grid grid-cols-2 gap-y-2 text-xs">';
        h+='<div><div class="text-text-secondary">'+tr('配舱单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.no)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('提单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.bl)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('目的仓库')+'</div><div class="font-medium text-text-primary mt-0.5">'+tr(item.wh)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('应到件数')+'</div><div class="font-medium text-primary-700 mt-0.5">'+total+'</div></div>';
        h+='</div></button>';
    });
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('提示：选择国内做好的配舱单，按件扫描到货入库。')+'</div>';
    h+='</div>';
    setTimeout(function(){var el=document.getElementById('ow-arr-order');if(el)el.focus();},50);
    return h;
}
function applyOwArrScanOrder(){
    var input=document.getElementById('ow-arr-order');
    if(!input)return;
    var val=(input.value||'').trim();
    var idx=-1;
    if(val)idx=_owArrScanList.findIndex(function(it){return it.no===val;});
    if(idx<0)idx=0;
    pickOwArrScanCard(idx);
}
function pickOwArrScanCard(i){
    if(!_owArrScanList[i])return;
    _owArrScanCurrent=i;
    _owArrScanScanned={};
    _owArrScanTab='pending';
    _owArrScanView='operate';
    refreshWarehousePdaPrototype();
}
function switchOwArrScanTab(t){_owArrScanTab=t;refreshWarehousePdaPrototype();}
function applyOwArrScanPiece(){
    var input=document.getElementById('ow-arr-piece');
    if(!input)return;
    var val=(input.value||'').trim();
    if(!val)return;
    var item=_owArrScanList[_owArrScanCurrent];
    var target=item.pieces.find(function(p){return p.piece===val;});
    if(!target){
        showToast(tr('该件号不在本配舱单内'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    if(_owArrScanScanned[val]){
        showToast(tr('该件已扫描'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    _owArrScanScanned[val]=true;
    _owArrScanTab='scanned';
    var remaining=item.pieces.filter(function(p){return !_owArrScanScanned[p.piece];});
    if(remaining.length===0)showToast(tr('已全部到货，可点击一键到货完成'));
    else showToast(tr('入库成功')+'：'+val);
    refreshWarehousePdaPrototype();
}
function finishOwArrScan(){
    var item=_owArrScanList[_owArrScanCurrent];
    if(!item)return;
    item.pieces.forEach(function(p){_owArrScanScanned[p.piece]=true;});
    showToast(tr('一键到货完成，配舱单已全部入库'));
    refreshWarehousePdaPrototype();
}
function generateOwArrivalScanOperate(){
    var item=_owArrScanList[_owArrScanCurrent];
    var pending=item.pieces.filter(function(p){return !_owArrScanScanned[p.piece];});
    var scanned=item.pieces.filter(function(p){return _owArrScanScanned[p.piece];});
    var active=_owArrScanTab==='scanned'?scanned:pending;
    var tabBtn=function(key,label,n){
        var on=_owArrScanTab===key;
        return '<button type="button" onclick="switchOwArrScanTab(\''+key+'\')" class="h-10 rounded-lg text-sm font-medium '+(on?'bg-primary-600 text-white':'bg-white text-text-secondary border border-surface-200')+'">'+tr(label)+'（'+n+'）</button>';
    };
    var h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+='<section class="rounded-xl border border-primary-100 bg-primary-50 p-3"><div class="text-sm font-semibold text-primary-700 mb-2">'+tr('配舱单信息')+'</div><div class="grid grid-cols-2 gap-2 text-xs text-primary-700"><div class="break-all">'+tr('配舱单号')+'：'+esc(item.no)+'</div><div class="break-all">'+tr('提单号')+'：'+esc(item.bl)+'</div><div class="break-all">'+tr('目的仓库')+'：'+tr(item.wh)+'</div><div class="break-all">'+tr('应到件数')+'：'+item.pieces.length+'</div></div></section>';
    h+=pdaScanInput('ow-arr-piece','请扫描货物件号/子单号','applyOwArrScanPiece',pending[0]?pending[0].piece:'');
    h+='<div class="grid grid-cols-2 gap-2">'+tabBtn('pending','待到货',pending.length)+tabBtn('scanned','已到货',scanned.length)+'</div>';
    if(active.length===0){
        h+='<div class="rounded-xl border border-surface-200 bg-white py-8 text-center text-xs text-text-muted">'+tr(_owArrScanTab==='scanned'?'暂无已到货件':'已全部扫描完毕')+'</div>';
    }else{
        active.forEach(function(p){
            h+='<div class="rounded-xl border border-surface-200 bg-white p-3"><div class="grid grid-cols-2 gap-y-1 text-xs">';
            h+='<div><div class="text-text-secondary">'+tr('货物件号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(p.piece)+'</div></div>';
            h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(p.wb)+'</div></div>';
            h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('品名')+'</div><div class="font-medium text-text-primary mt-0.5">'+tr(p.name)+'</div></div>';
            h+='</div></div>';
        });
    }
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="finishOwArrScan()" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('一键到货完成')+'</button></div>';
    setTimeout(function(){var el=document.getElementById('ow-arr-piece');if(el)el.focus();},50);
    return h;
}

/* ---------- 海外出库扫描 ow-out-scan-os（list/operate，按提货单双扫码逐件） ---------- */
var _owOutScanView='list';
var _owOutScanCurrent=null;
var _owOutScanScanned={};
var _owOutScanTab='pending';
var _owOutScanList=[
    {do:'DO-NG-20260713-00040',job:'HT-NG-20260713-00040',cust:'深圳市华运达国际货运',wh:'拉各斯海外仓',pickup:'上门提货',
        pieces:[
            {piece:'GL-40-01',wb:'WB-20260701004',loc:'A区-A03'},
            {piece:'GL-40-02',wb:'WB-20260701004',loc:'A区-A03'},
            {piece:'GL-40-03',wb:'WB-20260701005',loc:'B区-B12'},
            {piece:'GL-40-04',wb:'WB-20260701005',loc:'B区-B12'},
            {piece:'GL-40-05',wb:'WB-20260701006',loc:'C区-C09'},
            {piece:'GL-40-06',wb:'WB-20260701006',loc:'C区-C09'}
        ]},
    {do:'DO-SN-20260715-00088',job:'HT-SN-20260715-00088',cust:'上海锦程国际贸易',wh:'达喀尔海外仓',pickup:'派送',
        pieces:[
            {piece:'GL-88-01',wb:'WB-20260703001',loc:'A区-A01'},
            {piece:'GL-88-02',wb:'WB-20260703001',loc:'A区-A01'},
            {piece:'GL-88-03',wb:'WB-20260703002',loc:'A区-A02'},
            {piece:'GL-88-04',wb:'WB-20260703002',loc:'A区-A02'}
        ]}
];

function generateOwOutScanScreen(){
    if(_owOutScanView==='operate'&&_owOutScanCurrent!==null&&_owOutScanList[_owOutScanCurrent]){
        return generateOwOutScanOperate();
    }
    return generateOwOutScanList();
}
function generateOwOutScanList(){
    var h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+=pdaScanInput('ow-out-order','请扫描放货单DO号/提货单号','applyOwOutScanOrder','DO-NG-20260713-00040');
    _owOutScanList.forEach(function(item,i){
        h+='<button type="button" onclick="pickOwOutScanCard('+i+')" class="block w-full text-left rounded-xl border border-surface-200 bg-white p-3 shadow-sm">';
        h+='<div class="grid grid-cols-2 gap-y-2 text-xs">';
        h+='<div><div class="text-text-secondary">'+tr('放货单DO号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.do)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('Job号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.job)+'</div></div>';
        h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('客户')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+tr(item.cust)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('提货方式')+'</div><div class="font-medium text-text-primary mt-0.5">'+tr(item.pickup)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('应出件数')+'</div><div class="font-medium text-primary-700 mt-0.5">'+item.pieces.length+'</div></div>';
        h+='</div></button>';
    });
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('提示：核验二维码放货单后，按提货单逐件扫描出库（扫放货码+货物标签）。')+'</div>';
    h+='</div>';
    setTimeout(function(){var el=document.getElementById('ow-out-order');if(el)el.focus();},50);
    return h;
}
function applyOwOutScanOrder(){
    var input=document.getElementById('ow-out-order');
    if(!input)return;
    var val=(input.value||'').trim();
    var idx=-1;
    if(val)idx=_owOutScanList.findIndex(function(it){return it.do===val;});
    if(idx<0)idx=0;
    pickOwOutScanCard(idx);
}
function pickOwOutScanCard(i){
    if(!_owOutScanList[i])return;
    _owOutScanCurrent=i;
    _owOutScanScanned={};
    _owOutScanTab='pending';
    _owOutScanView='operate';
    refreshWarehousePdaPrototype();
}
function switchOwOutScanTab(t){_owOutScanTab=t;refreshWarehousePdaPrototype();}
function applyOwOutScanPiece(){
    var input=document.getElementById('ow-out-piece');
    if(!input)return;
    var val=(input.value||'').trim();
    if(!val)return;
    var item=_owOutScanList[_owOutScanCurrent];
    var target=item.pieces.find(function(p){return p.piece===val;});
    if(!target){
        showToast(tr('该货物标签不在本提货单内'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    if(_owOutScanScanned[val]){
        showToast(tr('该件已出库（Already Released）'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    _owOutScanScanned[val]=true;
    _owOutScanTab='scanned';
    var remaining=item.pieces.filter(function(p){return !_owOutScanScanned[p.piece];});
    if(remaining.length===0)showToast(tr('已全部出库，请客户验货电子签名'));
    else showToast(tr('出库成功')+'：'+val);
    refreshWarehousePdaPrototype();
}
function finishOwOutScan(){
    var item=_owOutScanList[_owOutScanCurrent];
    if(!item)return;
    item.pieces.forEach(function(p){_owOutScanScanned[p.piece]=true;});
    showToast(tr('一键出库完成，已释放减库存并生成POD'));
    refreshWarehousePdaPrototype();
}
function generateOwOutScanOperate(){
    var item=_owOutScanList[_owOutScanCurrent];
    var pending=item.pieces.filter(function(p){return !_owOutScanScanned[p.piece];});
    var scanned=item.pieces.filter(function(p){return _owOutScanScanned[p.piece];});
    var active=_owOutScanTab==='scanned'?scanned:pending;
    var tabBtn=function(key,label,n){
        var on=_owOutScanTab===key;
        return '<button type="button" onclick="switchOwOutScanTab(\''+key+'\')" class="h-10 rounded-lg text-sm font-medium '+(on?'bg-primary-600 text-white':'bg-white text-text-secondary border border-surface-200')+'">'+tr(label)+'（'+n+'）</button>';
    };
    var h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+='<section class="rounded-xl border border-primary-100 bg-primary-50 p-3"><div class="text-sm font-semibold text-primary-700 mb-2">'+tr('放货单信息')+'</div><div class="grid grid-cols-2 gap-2 text-xs text-primary-700"><div class="break-all">'+tr('放货单DO号')+'：'+esc(item.do)+'</div><div class="break-all">'+tr('Job号')+'：'+esc(item.job)+'</div><div class="break-all">'+tr('客户')+'：'+tr(item.cust)+'</div><div class="break-all">'+tr('提货方式')+'：'+tr(item.pickup)+'</div></div></section>';
    h+='<div class="rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-[11px] text-teal-700">'+tr('双扫码出库：先扫放货码核验，再逐件扫货物标签，系统自动扣减库存。')+'</div>';
    h+=pdaScanInput('ow-out-piece','请扫描货物标签','applyOwOutScanPiece',pending[0]?pending[0].piece:'');
    h+='<div class="grid grid-cols-2 gap-2">'+tabBtn('pending','待出库',pending.length)+tabBtn('scanned','已出库',scanned.length)+'</div>';
    if(active.length===0){
        h+='<div class="rounded-xl border border-surface-200 bg-white py-8 text-center text-xs text-text-muted">'+tr(_owOutScanTab==='scanned'?'暂无已出库件':'已全部扫描完毕')+'</div>';
    }else{
        active.forEach(function(p){
            h+='<div class="rounded-xl border border-surface-200 bg-white p-3"><div class="grid grid-cols-2 gap-y-1 text-xs">';
            h+='<div><div class="text-text-secondary">'+tr('货物标签')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(p.piece)+'</div></div>';
            h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(p.wb)+'</div></div>';
            h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('货区货位')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(p.loc)+'</div></div>';
            h+='</div></div>';
        });
    }
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3 space-y-2">';
    h+='<button type="button" onclick="showToast(\''+esc(tr('已请客户验货并电子签名'))+'\')" class="h-9 w-full rounded-lg border border-primary-200 text-primary-700 text-xs font-medium bg-white">'+tr('客户验货 · 电子签名')+'</button>';
    h+='<button type="button" onclick="finishOwOutScan()" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('一键出库完成 · 生成POD')+'</button>';
    h+='</div>';
    setTimeout(function(){var el=document.getElementById('ow-out-piece');if(el)el.focus();},50);
    return h;
}
