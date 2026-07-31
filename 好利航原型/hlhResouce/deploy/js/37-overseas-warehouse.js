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
    '放货单DO号|预约提货单号|Job号|批次号|客户|目的仓库|提货方式|应出件数|已出件数|出库进度|出库状态|出库操作人|操作时间|操作网点|操作',
    ['待出库','出库中','已出库','已签收'],
    [
        ['DO-NG-20260715-00023','DR-20260715-023','HT-NG-20260715-00023','B2607-01','东莞市鑫海物流','拉各斯海外仓','上门提货','8','8','8/8','已签收','李仓管','2026-07-16 09:20','拉各斯海外仓'],
        ['DO-NG-20260713-00040','DR-20260713-011','HT-NG-20260713-00040','B2606-09','深圳市华运达国际货运','拉各斯海外仓','上门提货','20','12','12/20','出库中','王海波','2026-07-16 10:35','拉各斯海外仓'],
        ['DO-SN-20260715-00088','DR-20260715-024','HT-SN-20260715-00088','B2607-02','上海锦程国际贸易','达喀尔海外仓','派送','12','0','0/12','待出库','—','—','达喀尔海外仓']
    ],
    [
        {label:'放货单DO号',type:'text'},
        {label:'预约提货单号',type:'text'},
        {label:'批次号',type:'text'},
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
function owGateGrid(gates,cols){
    var h='<div class="grid grid-cols-2 md:grid-cols-'+(cols||3)+' gap-2">';
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
/* 放货前置校验（预约阶段：付款→审批→生成DO；身份/验证码/签字见出库核验） */
function owReleasePreGates(rowData,headers){
    var paid=owCell(rowData,headers,'付款状态')==='已付款';
    var status=owCell(rowData,headers,'状态');
    var approved=paid&&status!=='待审批'&&status!=='待付款';
    var doGen=approved&&['已生成DO','待提货','部分提货','已完成'].indexOf(status)>=0;
    return owGateGrid([
        ['1 付款到账','财务核对银行流水→可审批',paid],
        ['2 放货审批','审批通过→可生成DO',approved],
        ['3 生成放货单DO','有DO→仓库可开单出库',doGen]
    ],3);
}
/* 出库核验校验（出库阶段：二维码→验证码→身份→客户签字→仓管签字） */
function owOutboundGates(verified,signedCust,signedWh){
    return owGateGrid([
        ['1 二维码核验','扫DO二维码核销（仅一次）',!!verified],
        ['2 验证码','输入一次性验证码校验',!!verified],
        ['3 身份核验','核对提货人证件/电话',!!verified],
        ['4 客户签字','客户验货电子签字',!!signedCust],
        ['5 仓管签字','仓管确认签字→减库存',!!signedWh]
    ],5);
}

/* 提货明细行：优先取新增时存下的明细，否则按件数合成 */
function owPickupDetailRows(apptNo,row,headers){
    if(_owPickupDetailByAppt[apptNo])return _owPickupDetailByAppt[apptNo];
    var total=parseInt(owCell(row,headers,'件数')||'0',10)||0;
    var wt=parseFloat(owCell(row,headers,'重量(KG)')||'0')||0;
    if(total<=0)return [];
    var names=['服装配件','手机配件','五金工具'];
    var n=total>=6?2:1;
    var rows=[],remP=total,remW=wt;
    for(var i=0;i<n;i++){
        var pcs=(i===n-1)?remP:Math.ceil(total/n);
        if(pcs>remP)pcs=remP;remP-=pcs;
        var w=(i===n-1)?remW:+(wt/n).toFixed(1);remW=+(remW-w).toFixed(1);
        var subCnt=Math.max(1,Math.ceil(pcs/3));
        rows.push(['WB-2026070'+(i+1)+String(100+i),names[i%names.length],subCnt+'/'+subCnt,String(pcs),(pcs*0.06).toFixed(3),(w<0?0:w).toFixed(1)]);
    }
    return rows;
}
function owPickupDetailPanel(apptNo,row,headers){
    var rows=owPickupDetailRows(apptNo,row,headers);
    var tP=0,tV=0,tW=0;
    rows.forEach(function(r){tP+=parseInt(r[3],10)||0;tV+=parseFloat(r[4])||0;tW+=parseFloat(r[5])||0;});
    var h='<section>'+owSectionTitle('提货明细（本次提货所选运单/子单）');
    h+='<div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm">';
    h+='<thead class="bg-surface-50 text-text-secondary"><tr>'+['运单号','品名','子单(选/总)','已提件数','体积(CBM)','重量(KG)'].map(function(x){return '<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(x)+'</th>';}).join('')+'</tr></thead><tbody>';
    if(rows.length===0){
        h+='<tr><td colspan="6" class="px-3 py-8 text-center text-text-muted">'+tr('暂无提货明细')+'</td></tr>';
    }else{
        rows.forEach(function(r){
            h+='<tr class="border-t border-surface-100"><td class="px-3 py-2 font-medium text-primary-700">'+esc(r[0])+'</td><td class="px-3 py-2 text-text-secondary">'+tr(r[1])+'</td><td class="px-3 py-2">'+esc(r[2])+'</td><td class="px-3 py-2 font-semibold text-primary-700">'+esc(r[3])+'</td><td class="px-3 py-2 text-text-secondary">'+esc(r[4])+'</td><td class="px-3 py-2 text-text-secondary">'+esc(r[5])+'</td></tr>';
        });
        h+='<tr class="border-t border-surface-200 bg-primary-50/40"><td class="px-3 py-2 font-semibold text-primary-700" colspan="3">'+tr('合计')+'</td><td class="px-3 py-2 font-bold text-primary-700">'+tP+'</td><td class="px-3 py-2 font-bold text-primary-700">'+tV.toFixed(3)+'</td><td class="px-3 py-2 font-bold text-primary-700">'+tW.toFixed(1)+'</td></tr>';
    }
    h+='</tbody></table></div></section>';
    return h;
}
function owSwitchPickupTab(tab){
    var info=document.getElementById('ow-pk-tab-info');
    var detail=document.getElementById('ow-pk-tab-detail');
    var bi=document.getElementById('ow-pk-tabbtn-info');
    var bd=document.getElementById('ow-pk-tabbtn-detail');
    var on='px-3 py-2 text-sm font-semibold text-primary-600 border-b-2 border-primary-600';
    var off='px-3 py-2 text-sm font-medium text-text-secondary border-b-2 border-transparent';
    if(tab==='detail'){if(info)info.classList.add('hidden');if(detail)detail.classList.remove('hidden');if(bd)bd.className=on;if(bi)bi.className=off;}
    else{if(detail)detail.classList.add('hidden');if(info)info.classList.remove('hidden');if(bi)bi.className=on;if(bd)bd.className=off;}
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
    var releaseStatus=owCell(row,headers,'放货状态');
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
    var h='<div class="space-y-4">';
    /* 顶栏 */
    h+='<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-100 bg-primary-50/50 px-4 py-3">';
    h+='<div><div class="text-xs text-text-muted">'+tr('提货申请号')+'</div><div class="text-base font-bold text-primary-700">'+esc(apptNo)+'</div></div>';
    h+='<span class="rounded-full bg-white border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700">'+tr(status)+'</span>';
    h+='</div>';
    /* 插页切换：提货信息 / 提货明细 */
    h+='<div class="flex gap-2 border-b border-surface-200">'+
        '<button type="button" id="ow-pk-tabbtn-info" onclick="owSwitchPickupTab(\'info\')" class="px-3 py-2 text-sm font-semibold text-primary-600 border-b-2 border-primary-600">'+tr('提货信息')+'</button>'+
        '<button type="button" id="ow-pk-tabbtn-detail" onclick="owSwitchPickupTab(\'detail\')" class="px-3 py-2 text-sm font-medium text-text-secondary border-b-2 border-transparent">'+tr('提货明细')+'</button>'+
        '</div>';
    h+='<div id="ow-pk-tab-info" class="space-y-5">';
    /* 基本信息 */
    h+='<section>'+owSectionTitle('提货基本信息')+owInfoGrid([
        ['Job号',job],['批次',owCell(row,headers,'批次')],['客户',owCell(row,headers,'客户')],['目的仓库',owCell(row,headers,'目的仓库')],
        ['提货方式',pickupType],['件数',owCell(row,headers,'件数')],['重量(KG)',owCell(row,headers,'重量(KG)')],['预约时段',owCell(row,headers,'预约时段')]
    ])+'</section>';
    /* 费用账单（紧凑网格） */
    h+='<section>'+owSectionTitle('费用账单（客服只能查看·不能修改）');
    h+='<div class="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">';
    h+='<div class="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-1 text-xs">';
    feeRows.forEach(function(f){
        h+='<div class="flex items-baseline justify-between gap-2 border-b border-surface-100 py-1"><span class="text-text-muted shrink-0">'+tr(f[0])+'</span><span class="font-medium text-text-primary text-right break-all">'+esc(f[1])+'</span></div>';
    });
    h+='<div class="flex items-baseline justify-between gap-2 md:col-span-3 border-t border-surface-200 mt-0.5 pt-1.5"><span class="text-sm font-semibold text-primary-700">'+tr('应收合计')+'</span><span class="text-sm font-bold text-primary-700">USD '+esc(totalDue)+'</span></div>';
    h+='</div></div>';
    h+='<div class="mt-1.5 text-[11px] text-amber-600">'+tr('费用账单凭证核销在【财务结算】板块处理，此处仅展示应收。')+'</div>';
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
    /* 电子放货单 DO：仅“已放行”状态显示（不展示二维码；二维码+验证码在出库扫描时核验） */
    if(releaseStatus==='已放行'){
        var outStatus=status==='已完成'?'已出库':(status==='部分提货'?'部分出库':'待出库');
        h+='<section>'+owSectionTitle('电子放货单 DO');
        h+='<div class="rounded-lg border border-surface-200 bg-white p-3">'+owInfoGrid([
            ['DO号','DO-'+job.replace('HT-','')],['有效时间','2026-07-16 08:00~18:00'],['出库状态',outStatus]
        ],3);
        h+='<div class="mt-2 text-[11px] text-text-muted">'+tr('说明：DO 二维码与一次性验证码在【海外仓出库 · 出库扫描】环节由仓库扫码核验，此处不展示。')+'</div></div></section>';
    }
    /* 放货前置校验（付款/审批/DO）；身份核验+验证码+客户签字+仓管签字在出库环节 */
    h+='<section>'+owSectionTitle('放货前置校验（身份核验/验证码/签字在出库环节）')+owReleasePreGates(row,headers)+'</section>';
    h+='</div>';/* /提货信息插页 */
    /* 提货明细插页 */
    h+='<div id="ow-pk-tab-detail" class="hidden">'+owPickupDetailPanel(apptNo,row,headers)+'</div>';
    h+='</div>';
    /* footer */
    var actionBtn='';
    if(status==='待审批')actionBtn='<button onclick="showToast(\''+esc(tr('放货审批已提交（需财务核对银行到账）'))+'\');closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('放货审批')+'</button>';
    else if(status==='待付款')actionBtn='<button onclick="showToast(\''+esc(tr('已通知客户付款'))+'\');closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('通知付款')+'</button>';
    else if(status==='已生成DO'||status==='待提货')actionBtn='<button onclick="showToast(\''+esc(tr('放货单DO已下发仓库'))+'\');closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('下发放货单')+'</button>';
    var footer=actionBtn+'<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('关闭')+'</button>';
    owOpenModal(tr('提货预约详情')+' - '+apptNo,'76%',h,footer);
}

/* ================= 需求1：新增提货预约（选客户→按提单号/配舱单号加载运单明细→选运单→子单维护→生成提货单） ================= */
var OW_PICKUP_CUSTOMERS=['东莞市鑫海物流','上海锦程国际贸易','广州远航贸易','深圳市华运达国际货运'];
/* 客户 → 目的仓库（新增时目的仓库随客户自带出来） */
var OW_CUSTOMER_WAREHOUSE={
    '东莞市鑫海物流':'拉各斯海外仓',
    '上海锦程国际贸易':'达喀尔海外仓',
    '广州远航贸易':'阿比让海外仓',
    '深圳市华运达国际货运':'拉各斯海外仓'
};
/* 运单明细（按客户+提单号/配舱单号条件加载）；子单字段对齐运单管理“子单信息”弹窗：长/宽/高/重量/体积 */
/* 一个子单 = 一件，子单无件数(默认1)；运单“可提货件数”= 子单数 */
var _owPickupWaybills=[
    {wb:'WB-20260701002',bl:'BL-NG-20260710-01',alloc:'YPCD-20260625-002',name:'服装配件',subs:[
        {sub:'WB-20260701002-01',l:'55',w:'42',ht:'38',wt:'12.5',vol:'0.088'},
        {sub:'WB-20260701002-02',l:'48',w:'36',ht:'30',wt:'11.0',vol:'0.052'},
        {sub:'WB-20260701002-03',l:'40',w:'30',ht:'25',wt:'8.5',vol:'0.030'},
        {sub:'WB-20260701002-04',l:'45',w:'35',ht:'28',wt:'9.5',vol:'0.044'}]},
    {wb:'WB-20260701012',bl:'BL-NG-20260710-01',alloc:'YPCD-20260625-002',name:'手机配件',subs:[
        {sub:'WB-20260701012-01',l:'50',w:'40',ht:'35',wt:'16.5',vol:'0.070'},
        {sub:'WB-20260701012-02',l:'42',w:'32',ht:'28',wt:'12.5',vol:'0.038'},
        {sub:'WB-20260701012-03',l:'38',w:'30',ht:'25',wt:'10.0',vol:'0.029'}]},
    {wb:'WB-20260701018',bl:'BL-NG-20260710-01',alloc:'YPCD-20260625-002',name:'五金工具',subs:[
        {sub:'WB-20260701018-01',l:'45',w:'35',ht:'30',wt:'15.0',vol:'0.047'},
        {sub:'WB-20260701018-02',l:'38',w:'30',ht:'25',wt:'12.0',vol:'0.029'},
        {sub:'WB-20260701018-03',l:'40',w:'32',ht:'28',wt:'13.0',vol:'0.036'}]}
];
/* 运单件数/重量/体积由子单汇总（每子单1件） */
_owPickupWaybills.forEach(function(w){
    w.pcs=w.subs.length;
    w.weight=w.subs.reduce(function(a,s){return a+(parseFloat(s.wt)||0);},0).toFixed(1);
    w.vol=w.subs.reduce(function(a,s){return a+(parseFloat(s.vol)||0);},0).toFixed(3);
});
/* 新增提货预约的子单选择状态：waybill idx → 已选子单 idx 数组 */
var _owCreateSubSel={};
/* 已生成提货预约的提货明细：提货申请号 → [[运单号,品名,选中/总子单,已提件数,体积,重量],...] */
var _owPickupDetailByAppt={};
function owCreateInput(label,id,ph,required){
    return '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+(required?'<span class="text-red-500 ml-1">*</span>':'')+'</label>'+
        '<input id="'+id+'" type="text" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white focus:border-primary-400" placeholder="'+tr(ph||('请输入'+label))+'"></div>';
}
function owCreateSelect(label,id,options,required){
    var h='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+(required?'<span class="text-red-500 ml-1">*</span>':'')+'</label>';
    h+='<select id="'+id+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white focus:border-primary-400"><option value="">'+tr('请选择')+'</option>';
    (options||[]).forEach(function(o){h+='<option value="'+esc(o)+'">'+esc(tr(o))+'</option>';});
    h+='</select></div>';
    return h;
}
function openOverseasPickupCreate(){
    _owCreateSubSel={};
    var h='<div class="space-y-5">';
    /* 1. 提货条件 */
    h+='<section>'+owSectionTitle('① 提货条件（选择客户后按提单号/配舱单号加载运单明细）');
    h+='<div class="grid grid-cols-1 md:grid-cols-4 gap-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('客户')+'<span class="text-red-500 ml-1">*</span></label>'+
        '<select id="ow-create-cust" onchange="owPickupOnCustomerChange()" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white focus:border-primary-400"><option value="">'+tr('请选择')+'</option>'+
        OW_PICKUP_CUSTOMERS.map(function(o){return '<option value="'+esc(o)+'">'+esc(o)+'</option>';}).join('')+'</select></div>';
    h+=owCreateInput('提单号（Job号）','ow-create-bl','对应系统提单号');
    h+=owCreateInput('配舱单号（批次）','ow-create-alloc','对应系统配舱单号');
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('目的仓库')+'<span class="text-red-500 ml-1">*</span></label>'+
        '<input id="ow-create-wh" type="text" readonly class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary" placeholder="'+tr('随所选客户自动带出')+'"></div>';
    h+='</div>';
    h+='<div class="mt-3"><button type="button" onclick="owPickupLoadWaybills()" class="h-9 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('加载运单明细')+'</button></div>';
    h+='</section>';
    /* 2. 运单明细列表（加载后显示；勾选运单默认全选子单，可点“子单选择”调整） */
    h+='<section id="ow-create-wb-section" class="hidden">'+owSectionTitle('② 运单明细（勾选运单默认全选子单，点“子单选择”调整提货子单）');
    h+='<div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm">';
    h+='<thead class="bg-surface-50 text-text-secondary"><tr>'+
        '<th class="px-3 py-2 w-10 text-center"><input type="checkbox" onclick="owPickupToggleAll(this)"></th>'+
        ['运单号','品名','可提货件数','体积(CBM)','重量(KG)','已选件数','子单选择'].map(function(x){return '<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(x)+'</th>';}).join('')+
        '</tr></thead><tbody>';
    _owPickupWaybills.forEach(function(w,i){
        h+='<tr class="border-t border-surface-100">'+
            '<td class="px-3 py-2 text-center"><input type="checkbox" class="ow-create-wb-chk" data-idx="'+i+'" onchange="owPickupOnWbCheck('+i+')"></td>'+
            '<td class="px-3 py-2 font-medium text-primary-700">'+esc(w.wb)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+tr(w.name)+'</td>'+
            '<td class="px-3 py-2 font-medium">'+w.pcs+'</td>'+
            '<td class="px-3 py-2">'+esc(w.vol)+'</td>'+
            '<td class="px-3 py-2">'+esc(w.weight)+'</td>'+
            '<td class="px-3 py-2"><span id="ow-selpcs-'+i+'" class="font-semibold text-primary-700">0</span></td>'+
            '<td class="px-3 py-2"><a class="text-primary-600 hover:text-primary-700 cursor-pointer" onclick="openOwSubSelectModal('+i+')">'+tr('子单选择')+'</a></td>'+
        '</tr>';
    });
    h+='</tbody></table></div>';
    h+='<div class="mt-2 text-[11px] text-text-muted">'+tr('已选件数按所选子单实时统计；生成提货单以“已选件数”为准。')+'</div>';
    h+='</section>';
    /* 3. 提货单信息 */
    h+='<section>'+owSectionTitle('③ 提货单信息');
    h+='<div class="grid grid-cols-1 md:grid-cols-4 gap-4">';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary">'+tr('提货方式')+'<span class="text-red-500 ml-1">*</span></label>';
    h+='<div class="flex items-center gap-6 h-9">'+
        '<label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="ow-create-pickup" value="上门提货" checked onchange="owPickupToggleType()" class="accent-primary-600">'+tr('上门提货')+'</label>'+
        '<label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="ow-create-pickup" value="派送" onchange="owPickupToggleType()" class="accent-primary-600">'+tr('派送')+'</label>'+
        '</div></div>';
    h+=owCreateSelect('预约时段','ow-create-slot',['09:00','10:00','11:00','14:00','15:00'],false);
    h+='<div id="ow-create-fee-wrap" class="hidden flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('派送费(USD)')+'<span class="text-red-500 ml-1">*</span></label><input id="ow-create-fee" type="number" min="0" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+tr('派送方式必填')+'"></div>';
    h+='</div>';
    h+='<div id="ow-create-addr-wrap" class="hidden mt-3">'+owCreateInput('派送地址','ow-create-addr','派送方式填写收货地址')+'</div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">';
    h+=owCreateInput('提货人姓名','ow-create-picker','提货人/收货人');
    h+=owCreateInput('提货人电话','ow-create-phone','联系电话');
    h+=owCreateInput('证件号','ow-create-id','身份证/证件号');
    h+=owCreateInput('车牌号','ow-create-plate','上门提货车牌');
    h+='</div>';
    h+='</section>';
    h+='</div>';
    var footer='<button onclick="submitOverseasPickupCreate()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('生成提货单')+'</button>'+
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('取消')+'</button>';
    owOpenModal(tr('新增提货预约'),'86%',h,footer);
}
function owPickupLoadWaybills(){
    var cust=document.getElementById('ow-create-cust');
    if(!cust||!cust.value){showToast(tr('请先选择客户'));return;}
    var sec=document.getElementById('ow-create-wb-section');
    if(sec)sec.classList.remove('hidden');
    showToast(tr('已按条件加载运单明细'));
}
function owPickupOnCustomerChange(){
    var cust=document.getElementById('ow-create-cust');
    var whEl=document.getElementById('ow-create-wh');
    if(cust&&whEl)whEl.value=OW_CUSTOMER_WAREHOUSE[cust.value]||'';
}
function owAllSubIdx(i){return _owPickupWaybills[i].subs.map(function(s,si){return si;});}
function owPickupToggleAll(box){
    document.querySelectorAll('.ow-create-wb-chk').forEach(function(c){
        c.checked=box.checked;
        var i=parseInt(c.getAttribute('data-idx'),10);
        _owCreateSubSel[i]=box.checked?owAllSubIdx(i):[];
        owUpdateSelPcs(i);
    });
}
function owPickupOnWbCheck(i){
    var chk=document.querySelector('.ow-create-wb-chk[data-idx="'+i+'"]');
    _owCreateSubSel[i]=(chk&&chk.checked)?owAllSubIdx(i):[];   /* 勾选运单默认选择所有子单 */
    owUpdateSelPcs(i);
}
function owUpdateSelPcs(i){
    var sel=_owCreateSubSel[i]||[];
    var el=document.getElementById('ow-selpcs-'+i);
    if(el)el.textContent=String(sel.length);   /* 每子单1件，已选件数=已选子单数 */
}
/* 子单选择弹窗（字段对齐运单管理“子单信息”：#/子单号/长/宽/高/重量/体积） */
function openOwSubSelectModal(i){
    var w=_owPickupWaybills[i];
    if(!w)return;
    var sel=_owCreateSubSel[i]||[];
    var old=document.getElementById('ow-subsel-modal');if(old)old.remove();
    var m=document.createElement('div');
    m.id='ow-subsel-modal';
    m.className='fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4';
    var html='<div class="w-full max-w-5xl rounded-2xl bg-white shadow-xl overflow-hidden">';
    html+='<div class="flex items-center justify-between px-5 py-3 border-b border-surface-200"><div class="text-sm font-semibold text-text-primary">'+tr('子单选择')+' - '+esc(w.wb)+'</div><button type="button" onclick="closeOwSubSelectModal()" class="w-8 h-8 rounded-full bg-surface-100 text-text-muted">×</button></div>';
    html+='<div class="p-4 max-h-[80vh] overflow-auto"><div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    html+='<th class="px-3 py-2 w-10 text-center"><input type="checkbox" id="ow-subsel-all" onclick="owSubSelToggleAll(this)"></th>';
    ['#','子单号','长(CM)','宽(CM)','高(CM)','重量(KG)','体积(CBM)'].forEach(function(c){html+='<th class="px-3 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    html+='</tr></thead><tbody>';
    w.subs.forEach(function(s,si){
        var on=sel.indexOf(si)>=0;
        html+='<tr class="border-t border-surface-100"><td class="px-3 py-2 text-center"><input type="checkbox" class="ow-subsel-chk" data-si="'+si+'"'+(on?' checked':'')+'></td>'+
            '<td class="px-3 py-2 text-text-muted">'+(si+1)+'</td>'+
            '<td class="px-3 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(s.sub)+'</td>'+
            '<td class="px-3 py-2">'+esc(s.l)+'</td><td class="px-3 py-2">'+esc(s.w)+'</td><td class="px-3 py-2">'+esc(s.ht)+'</td>'+
            '<td class="px-3 py-2">'+esc(s.wt)+'</td><td class="px-3 py-2">'+esc(s.vol)+'</td></tr>';
    });
    html+='</tbody></table></div></div>';
    html+='<div class="flex justify-end gap-2 px-5 py-3 border-t border-surface-200"><button type="button" onclick="closeOwSubSelectModal()" class="px-4 py-2 text-sm text-text-secondary border border-surface-200 rounded-lg">'+tr('取消')+'</button><button type="button" onclick="confirmOwSubSelect('+i+')" class="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg">'+tr('确定')+'</button></div>';
    html+='</div>';
    m.innerHTML=html;
    document.body.appendChild(m);
}
function owSubSelToggleAll(box){document.querySelectorAll('#ow-subsel-modal .ow-subsel-chk').forEach(function(c){c.checked=box.checked;});}
function closeOwSubSelectModal(){var m=document.getElementById('ow-subsel-modal');if(m)m.remove();}
function confirmOwSubSelect(i){
    var sel=[];
    document.querySelectorAll('#ow-subsel-modal .ow-subsel-chk').forEach(function(c){if(c.checked)sel.push(parseInt(c.getAttribute('data-si'),10));});
    _owCreateSubSel[i]=sel;
    var wbChk=document.querySelector('.ow-create-wb-chk[data-idx="'+i+'"]');
    if(wbChk)wbChk.checked=sel.length>0;
    owUpdateSelPcs(i);
    closeOwSubSelectModal();
}
function owPickupToggleType(){
    var radios=document.getElementsByName('ow-create-pickup');
    var val='上门提货';
    for(var i=0;i<radios.length;i++){if(radios[i].checked)val=radios[i].value;}
    var feeWrap=document.getElementById('ow-create-fee-wrap');
    var addrWrap=document.getElementById('ow-create-addr-wrap');
    var show=val==='派送';
    if(feeWrap){feeWrap.classList.toggle('hidden',!show);feeWrap.classList.toggle('flex',show);}
    if(addrWrap)addrWrap.classList.toggle('hidden',!show);
}
function submitOverseasPickupCreate(){
    var custEl=document.getElementById('ow-create-cust');
    var whEl=document.getElementById('ow-create-wh');
    if(!custEl||!custEl.value){showToast(tr('请先选择客户'));return;}
    var checked=Array.prototype.slice.call(document.querySelectorAll('.ow-create-wb-chk')).filter(function(c){return c.checked;});
    if(checked.length===0){showToast(tr('请至少勾选一个运单'));return;}
    var radios=document.getElementsByName('ow-create-pickup');
    var pickup='上门提货';
    for(var i=0;i<radios.length;i++){if(radios[i].checked)pickup=radios[i].value;}
    var feeEl=document.getElementById('ow-create-fee');
    if(pickup==='派送'&&(!feeEl||!feeEl.value)){showToast(tr('派送方式请录入派送费'));return;}
    /* 按“已选子单”汇总件数/重量/体积，生成提货明细 */
    var totalPcs=0,totalWeight=0,totalVol=0,detail=[];
    checked.forEach(function(c){
        var wi=parseInt(c.getAttribute('data-idx'),10);
        var w=_owPickupWaybills[wi];if(!w)return;
        var sel=_owCreateSubSel[wi]||[];
        if(sel.length===0)return;
        var pcs=0,wt=0,vol=0;
        sel.forEach(function(si){var s=w.subs[si];if(s){pcs+=1;wt+=parseFloat(s.wt)||0;vol+=parseFloat(s.vol)||0;}});
        totalPcs+=pcs;totalWeight+=wt;totalVol+=vol;
        detail.push([w.wb,w.name,sel.length+'/'+w.subs.length,String(pcs),vol.toFixed(3),wt.toFixed(1)]);
    });
    if(totalPcs===0){showToast(tr('所选运单未选择子单，请点“子单选择”'));return;}
    var due=(totalPcs*150).toFixed(2);
    var fee=pickup==='派送'?parseFloat(feeEl.value||'0').toFixed(2):'—';
    var slotEl=document.getElementById('ow-create-slot');
    var slot=slotEl&&slotEl.value?('2026-07-17 '+slotEl.value):'—';
    var seq=TC['ow-pickup'].d.length+1;
    var apptNo='DR-20260716-'+String(100+seq).slice(-3);
    var blEl=document.getElementById('ow-create-bl');
    var allocEl=document.getElementById('ow-create-alloc');
    var job=(blEl&&blEl.value)?blEl.value:'HT-NEW-20260716-'+String(100+seq).slice(-3);
    var batch=(allocEl&&allocEl.value)?allocEl.value:'B2607-NEW';
    /* 列顺序须与表头一致：提货申请号|Job号|批次|客户|目的仓库|提货方式|派送费(USD)|件数|重量(KG)|应收合计(USD)|付款状态|放货状态|预约时段|状态 */
    var newRow=[apptNo,job,batch,custEl.value,(whEl&&whEl.value)||'拉各斯海外仓',pickup,fee,String(totalPcs),totalWeight.toFixed(1),due,'待付款','未放行',slot,'待付款'];
    TC['ow-pickup'].d.unshift(newRow);
    _owPickupDetailByAppt[apptNo]=detail;   /* 存提货明细供查看页“提货明细”插页 */
    closeCrudModal();
    var mc=document.getElementById('main-content');
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage('ow-pickup',1,'');
    showToast(tr('提货单已生成')+'：'+apptNo+'（'+detail.length+tr('个运单')+' / '+totalPcs+tr('件')+'）');
}

/* ================= 需求1：编辑提货预约（只读锁创建期字段，仅改提货方式/派送费/预约时段/提货人） ================= */
function owEditInput(label,id,value){
    return '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+'</label>'+
        '<input id="'+id+'" type="text" value="'+esc(value||'')+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white focus:border-primary-400"></div>';
}
function owEditToggleType(){
    var radios=document.getElementsByName('ow-edit-pickup');
    var val='上门提货';
    for(var i=0;i<radios.length;i++){if(radios[i].checked)val=radios[i].value;}
    var show=val==='派送';
    var feeWrap=document.getElementById('ow-edit-fee-wrap');
    var addrWrap=document.getElementById('ow-edit-addr-wrap');
    if(feeWrap){feeWrap.classList.toggle('hidden',!show);feeWrap.classList.toggle('flex',show);}
    if(addrWrap)addrWrap.classList.toggle('hidden',!show);
}
function openSelectedPickupEdit(id){
    var idx=(typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1;
    if(idx<0){showToast(tr('请先选择一条提货预约'));return;}
    openOverseasPickupEdit(id,idx);
}
function openOverseasPickupEdit(id,rowIdx){
    var d=owRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到提货预约数据'));return;}
    var apptNo=owCell(row,headers,'提货申请号');
    var status=owCell(row,headers,'状态');
    var pickupType=owCell(row,headers,'提货方式')||'上门提货';
    var isDelivery=pickupType==='派送';
    var deliveryFee=owCell(row,headers,'派送费(USD)');
    var slot=owCell(row,headers,'预约时段');
    var slotTime=(slot&&slot.indexOf(' ')>=0)?slot.split(' ')[1]:'';
    var h='<div class="space-y-5">';
    h+='<div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">'+tr('客户/提单号/配舱单号/运单明细在创建时确定不可改；此处仅编辑提货方式、派送费、预约时段与提货人信息。费用与状态由系统控制。')+'</div>';
    /* ① 提货条件（创建时确定·只读，布局参照新增） */
    h+='<section>'+owSectionTitle('① 提货条件（创建时确定·只读）')+owInfoGrid([
        ['客户',owCell(row,headers,'客户')],['提单号（Job号）',owCell(row,headers,'Job号')],['配舱单号（批次）',owCell(row,headers,'批次')],['目的仓库',owCell(row,headers,'目的仓库')],
        ['提货申请号',apptNo],['可提货件数',owCell(row,headers,'件数')],['应收合计(USD)',owCell(row,headers,'应收合计(USD)')],['当前状态',status]
    ])+'</section>';
    /* ② 运单明细（创建时确定·只读，复用查看页提货明细） */
    h+=owPickupDetailPanel(apptNo,row,headers);
    /* ③ 提货单信息（可编辑） */
    h+='<section>'+owSectionTitle('③ 提货单信息（可编辑）');
    h+='<div class="grid grid-cols-1 md:grid-cols-4 gap-4">';
    h+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary">'+tr('提货方式')+'<span class="text-red-500 ml-1">*</span></label>';
    h+='<div class="flex items-center gap-6 h-9">'+
        '<label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="ow-edit-pickup" value="上门提货"'+(!isDelivery?' checked':'')+' onchange="owEditToggleType()" class="accent-primary-600">'+tr('上门提货')+'</label>'+
        '<label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="ow-edit-pickup" value="派送"'+(isDelivery?' checked':'')+' onchange="owEditToggleType()" class="accent-primary-600">'+tr('派送')+'</label>'+
        '</div></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('预约时段')+'</label><select id="ow-edit-slot" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white"><option value="">'+tr('请选择')+'</option>'+
        ['09:00','10:00','11:00','14:00','15:00'].map(function(o){return '<option value="'+o+'"'+(slotTime===o?' selected':'')+'>'+o+'</option>';}).join('')+'</select></div>';
    h+='<div id="ow-edit-fee-wrap" class="'+(isDelivery?'flex':'hidden')+' flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('派送费(USD)')+'<span class="text-red-500 ml-1">*</span></label><input id="ow-edit-fee" type="number" min="0" value="'+(isDelivery?esc(deliveryFee):'')+'" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+tr('派送方式必填')+'"></div>';
    h+='</div>';
    h+='<div id="ow-edit-addr-wrap" class="'+(isDelivery?'':'hidden')+' mt-3"><div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('派送地址')+'</label><input id="ow-edit-addr" type="text" value="Lagos, Ikeja GRA, 23 Isaac John St." class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white"></div></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">';
    h+=owEditInput('提货人姓名','ow-edit-picker','Mr. Okafor');
    h+=owEditInput('提货人电话','ow-edit-phone','+234 802 000 111');
    h+=owEditInput('证件号','ow-edit-id','ID·A1234567');
    h+=owEditInput('车牌号','ow-edit-plate','LOS-882-KJA');
    h+='</div>';
    h+='</section>';
    h+='</div>';
    var footer='<button onclick="submitOverseasPickupEdit(\''+id+'\','+rowIdx+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('保存')+'</button>'+
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('取消')+'</button>';
    owOpenModal(tr('编辑提货预约')+' - '+apptNo,'82%',h,footer);
}
function submitOverseasPickupEdit(id,rowIdx){
    var c=TC[id]||{};
    var d=owRowData(id,rowIdx);var row=d.row,headers=(c.h||[]);
    if(!row)return;
    var radios=document.getElementsByName('ow-edit-pickup');
    var pickup='上门提货';
    for(var i=0;i<radios.length;i++){if(radios[i].checked)pickup=radios[i].value;}
    var feeEl=document.getElementById('ow-edit-fee');
    if(pickup==='派送'&&(!feeEl||!feeEl.value)){showToast(tr('派送方式请录入派送费'));return;}
    var slotEl=document.getElementById('ow-edit-slot');
    var slot=slotEl&&slotEl.value?('2026-07-17 '+slotEl.value):'—';
    var fee=pickup==='派送'?parseFloat(feeEl.value||'0').toFixed(2):'—';
    var apptNo=owCell(row,headers,'提货申请号');
    var srcRow=(c.d||[]).find(function(r){return r[0]===apptNo;});
    if(srcRow){
        var iP=headers.indexOf('提货方式'),iF=headers.indexOf('派送费(USD)'),iS=headers.indexOf('预约时段');
        if(iP>=0)srcRow[iP]=pickup;
        if(iF>=0)srcRow[iF]=fee;
        if(iS>=0)srcRow[iS]=slot;
    }
    closeCrudModal();
    var mc=document.getElementById('main-content');
    var pg=(typeof _listPage!=='undefined'&&_listPage[id])?_listPage[id]:1;
    var sf=(typeof _statusFilterVal!=='undefined')?(_statusFilterVal||''):'';
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,pg,sf);
    showToast(tr('提货预约已更新')+'：'+apptNo);
}

/* ================= 手动放货（提货明细+金额，补充原因→自动生成放货单DO） ================= */
function openOverseasPickupManualRelease(id){
    var idx=(typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1;
    if(idx<0){showToast(tr('请先选择一条提货预约'));return;}
    var d=owRowData(id,idx);var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到提货预约数据'));return;}
    var apptNo=owCell(row,headers,'提货申请号');
    var releaseStatus=owCell(row,headers,'放货状态');
    if(releaseStatus==='已放行'){showToast(tr('该提货预约已放行，无需手动放货'));return;}
    var isDelivery=owCell(row,headers,'提货方式')==='派送';
    var deliveryFee=owCell(row,headers,'派送费(USD)');
    var totalDue=owCell(row,headers,'应收合计(USD)');
    var feeRows=[
        ['运输费','USD 1,200.00'],['仓租','USD 180.00'],
        ['派送费', isDelivery?('USD '+(deliveryFee||'0.00')):'USD 0.00（上门提货免派送）'],
        ['改单费','USD 20.00'],['其他费用','USD 0.00']
    ];
    var h='<div class="space-y-5">';
    h+='<div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">'+tr('手动放货用于付款未到账/审批未完成等场景的人工放行，需补充放货原因；放行后自动生成放货单DO并下发仓库。')+'</div>';
    /* 基本信息 */
    h+='<section>'+owSectionTitle('提货基本信息')+owInfoGrid([
        ['提货申请号',apptNo],['客户',owCell(row,headers,'客户')],['目的仓库',owCell(row,headers,'目的仓库')],['提货方式',owCell(row,headers,'提货方式')],
        ['件数',owCell(row,headers,'件数')],['重量(KG)',owCell(row,headers,'重量(KG)')],['付款状态',owCell(row,headers,'付款状态')],['放货状态',releaseStatus]
    ])+'</section>';
    /* 提货明细 */
    h+=owPickupDetailPanel(apptNo,row,headers);
    /* 费用与金额 */
    h+='<section>'+owSectionTitle('费用与金额');
    h+='<div class="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2"><div class="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-1 text-xs">';
    feeRows.forEach(function(f){h+='<div class="flex items-baseline justify-between gap-2 border-b border-surface-100 py-1"><span class="text-text-muted shrink-0">'+tr(f[0])+'</span><span class="font-medium text-text-primary text-right break-all">'+esc(f[1])+'</span></div>';});
    h+='<div class="flex items-baseline justify-between gap-2 md:col-span-3 border-t border-surface-200 mt-0.5 pt-1.5"><span class="text-sm font-semibold text-primary-700">'+tr('应收合计')+'</span><span class="text-sm font-bold text-primary-700">USD '+esc(totalDue)+'</span></div>';
    h+='</div></div></section>';
    /* 手动放货原因 */
    h+='<section>'+owSectionTitle('手动放货原因（必填）');
    h+='<textarea id="ow-mr-reason" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-white resize-y" placeholder="'+esc(tr('请填写手动放货原因，例如：客户已线下确认付款、总部授权先行放货等'))+'"></textarea>';
    h+='</section>';
    h+='</div>';
    var footer='<button onclick="submitOverseasPickupManualRelease(\''+id+'\','+idx+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('生成放货单')+'</button>'+
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('取消')+'</button>';
    owOpenModal(tr('手动放货')+' - '+apptNo,'76%',h,footer);
}
function submitOverseasPickupManualRelease(id,idx){
    var reasonEl=document.getElementById('ow-mr-reason');
    var reason=reasonEl?reasonEl.value.trim():'';
    if(!reason){showToast(tr('请填写手动放货原因'));if(reasonEl)reasonEl.focus();return;}
    var c=TC[id]||{};
    var d=owRowData(id,idx);var row=d.row,headers=(c.h||[]);
    if(!row)return;
    var apptNo=owCell(row,headers,'提货申请号');
    var srcRow=(c.d||[]).find(function(r){return r[0]===apptNo;});
    if(srcRow){
        var iRel=headers.indexOf('放货状态'),iSt=headers.indexOf('状态');
        if(iRel>=0)srcRow[iRel]='已放行';
        if(iSt>=0)srcRow[iSt]='待提货';
    }
    var doNo='DO-'+(owCell(row,headers,'Job号')||'').replace('HT-','');
    closeCrudModal();
    var mc=document.getElementById('main-content');
    var pg=(typeof _listPage!=='undefined'&&_listPage[id])?_listPage[id]:1;
    var sf=(typeof _statusFilterVal!=='undefined')?(_statusFilterVal||''):'';
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,pg,sf);
    showToast(tr('已手动放货，放货单已生成')+'：'+doNo);
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
    /* 运单明细：按票（增列 客户代码/货物类型/未扫件数/库位库区；已扫/未扫可点开子单二级弹窗） */
    var subRows=[
        {wb:'WB-20260701002',lo:'SF10086523',cust:'C10004',name:'服装配件',cargo:'普货',due:8,scanned:8,loc:'A区-01',status:'已到齐'},
        {wb:'WB-20260701012',lo:'YT98876543',cust:'C10002',name:'手机配件',cargo:'敏感货',due:6,scanned:4,loc:'A区-02',status:'到货中'},
        {wb:'WB-20260701018',lo:'JD30088991',cust:'C10003',name:'五金工具',cargo:'普货',due:6,scanned:4,loc:'B区-03',status:'到货中'},
        {wb:'WB-20260701020',lo:'EMS99005566',cust:'CUS-004',name:'家居用品',cargo:'普货',due:6,scanned:2,loc:'B区-05',status:'到货中'}
    ];
    h+='<section>'+owSectionTitle('运单到货明细（点“已扫件/未扫件”查看子单扫描明细）');
    h+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm">';
    h+='<thead class="bg-surface-50 text-text-secondary"><tr>'+['运单号','物流单号','客户代码','品名','货物类型','应到件','已扫件','未扫件数','库位库区','状态'].map(function(x){return '<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(x)+'</th>';}).join('')+'</tr></thead><tbody>';
    subRows.forEach(function(r){
        var unscanned=r.due-r.scanned;
        var doneAll=unscanned<=0;
        h+='<tr class="border-t border-surface-100">'+
            '<td class="px-3 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(r.wb)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.lo)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.cust)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+tr(r.name)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+tr(r.cargo)+'</td>'+
            '<td class="px-3 py-2">'+r.due+'</td>'+
            '<td class="px-3 py-2 font-semibold text-green-600"><a class="cursor-pointer hover:underline" onclick="owArrivalScanSubModal(\''+esc(r.wb)+'\','+r.due+','+r.scanned+',\'scanned\')">'+r.scanned+'</a></td>'+
            '<td class="px-3 py-2 font-semibold '+(unscanned>0?'text-amber-600':'text-text-muted')+'">'+(unscanned>0?('<a class="cursor-pointer hover:underline" onclick="owArrivalScanSubModal(\''+esc(r.wb)+'\','+r.due+','+r.scanned+',\'unscanned\')">'+unscanned+'</a>'):'0')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.loc)+'</td>'+
            '<td class="px-3 py-2 '+(doneAll?'text-green-600':'text-text-secondary')+' whitespace-nowrap">'+tr(r.status)+'</td>'+
        '</tr>';
    });
    h+='</tbody></table></div></section>';
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('到货入库由【仓库PDA · 海外到货扫描】按件扫描完成：选择本配舱单 → 逐件扫码 → 自动入库。')+'</div>';
    h+='</div>';
    owOpenModal(tr('海外仓到货详情')+' - '+allocNo,'82%',h);
}
/* 到货明细·子单扫描二级弹窗（点“已扫件/未扫件”弹出）：子单号 / 扫描操作人 / 扫描操作时间 */
function owArrivalScanSubModal(wb,due,scanned,mode){
    due=parseInt(due,10)||0;scanned=parseInt(scanned,10)||0;
    var isScanned=mode==='scanned';
    var ops=['David','Maria','Okafor','Amadou'];
    var list=[];
    for(var i=0;i<due;i++){
        var done=i<scanned;
        if(isScanned&&!done)continue;
        if(!isScanned&&done)continue;
        list.push({
            sub:wb+'-'+String(i+1).padStart(2,'0'),
            op:done?ops[i%ops.length]:'—',
            time:done?('2026-07-14 '+String(9+(i%8)).padStart(2,'0')+':'+String((i*7)%60).padStart(2,'0')+':00'):'—'
        });
    }
    var old=document.getElementById('ow-arrival-sub-modal');if(old)old.remove();
    var m=document.createElement('div');
    m.id='ow-arrival-sub-modal';
    m.className='fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4';
    var title=(isScanned?tr('已扫件明细'):tr('未扫件明细'))+' - '+wb+'（'+list.length+' '+tr('件')+'）';
    var html='<div class="w-full max-w-3xl rounded-2xl bg-white shadow-xl overflow-hidden">';
    html+='<div class="flex items-center justify-between px-5 py-3 border-b border-surface-200"><div class="text-sm font-semibold text-text-primary">'+esc(title)+'</div><button type="button" onclick="closeOwArrivalScanSubModal()" class="w-8 h-8 rounded-full bg-surface-100 text-text-muted">×</button></div>';
    html+='<div class="p-4 max-h-[70vh] overflow-auto"><div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    html+='<th class="px-3 py-2 text-left font-semibold" style="width:56px">#</th>';
    ['子单号','扫描操作人','扫描操作时间'].forEach(function(c){html+='<th class="px-3 py-2 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    html+='</tr></thead><tbody>';
    if(!list.length){html+='<tr><td colspan="4" class="px-3 py-8 text-center text-text-muted">'+tr('暂无子单')+'</td></tr>';}
    list.forEach(function(s,i){
        html+='<tr class="border-t border-surface-100"><td class="px-3 py-2 text-text-muted">'+(i+1)+'</td>'+
            '<td class="px-3 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(s.sub)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(s.op)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(s.time)+'</td></tr>';
    });
    html+='</tbody></table></div></div>';
    html+='<div class="flex justify-end px-5 py-3 border-t border-surface-200"><button type="button" onclick="closeOwArrivalScanSubModal()" class="px-4 py-2 text-sm text-text-secondary border border-surface-200 rounded-lg">'+tr('关闭')+'</button></div>';
    html+='</div>';
    m.innerHTML=html;
    document.body.appendChild(m);
}
function closeOwArrivalScanSubModal(){var m=document.getElementById('ow-arrival-sub-modal');if(m)m.remove();}

/* ================= 需求4：海外仓出库详情（按提货单双扫码逐件出库） ================= */
function openOverseasOutboundDetail(id,rowIdx){
    var d=owRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到出库数据'));return;}
    var doNo=owCell(row,headers,'放货单DO号');
    var released=parseInt(owCell(row,headers,'已出件数')||'0',10);
    var total=parseInt(owCell(row,headers,'应出件数')||'0',10);
    var h='<div class="space-y-5">';
    h+='<section>'+owSectionTitle('放货单信息（凭提货单DO出库）')+owInfoGrid([
        ['放货单DO号',doNo],['预约提货单号',owCell(row,headers,'预约提货单号')],['Job号(提单号)',owCell(row,headers,'Job号')],['批次号',owCell(row,headers,'批次号')],
        ['客户',owCell(row,headers,'客户')],['目的仓库',owCell(row,headers,'目的仓库')],['提货方式',owCell(row,headers,'提货方式')],['应出件数',String(total)],
        ['出库状态',owCell(row,headers,'出库状态')],['出库操作人',owCell(row,headers,'出库操作人')],['操作时间',owCell(row,headers,'操作时间')],['操作网点',owCell(row,headers,'操作网点')]
    ])+'</section>';
    h+='<section>'+owSectionTitle('按件出库扫描进度（双扫码：放货码 + 子单号）')+'<div class="rounded-lg border border-surface-200 bg-white p-4">'+owProgressBar(released,total)+'</div></section>';
    var subRows=[
        ['WB-20260701004-01','WB-20260701004','A区-A03','已出库','David','2026-07-16 10:12'],
        ['WB-20260701004-02','WB-20260701004','A区-A03','已出库','David','2026-07-16 10:13'],
        ['WB-20260701005-01','WB-20260701005','B区-B12', released>=total?'已出库':'待出库', released>=total?'Maria':'—', released>=total?'2026-07-16 10:20':'—'],
        ['WB-20260701005-02','WB-20260701005','B区-B12', released>=total?'已出库':'待出库', released>=total?'Maria':'—', released>=total?'2026-07-16 10:21':'—']
    ];
    h+='<section>'+owSectionTitle('子单出库明细');
    h+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm">';
    h+='<thead class="bg-surface-50 text-text-secondary"><tr>'+['子单号','运单号','货区货位','出库状态','扫描操作人','操作时间'].map(function(x){return '<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(x)+'</th>';}).join('')+'</tr></thead><tbody>';
    subRows.forEach(function(r){
        var out=r[3]==='已出库';
        h+='<tr class="border-t border-surface-100"><td class="px-3 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(r[0])+'</td><td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r[1])+'</td><td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r[2])+'</td><td class="px-3 py-2 '+(out?'text-green-600 font-semibold':'text-text-secondary')+' whitespace-nowrap">'+tr(r[3])+'</td><td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r[4])+'</td><td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r[5])+'</td></tr>';
    });
    h+='</tbody></table></div></section>';
    h+='<div class="rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-700">'+tr('出库以【仓库PDA · 海外出库扫描】为主：扫二维码获取验证码+核验身份 → 逐件扫码 → 上传签收单/签字单 → 减库存生成POD。TMS 端可用“快捷出库”补充。')+'</div>';
    h+='</div>';
    var footer='<button onclick="openOverseasQuickOutbound(\''+id+'\','+rowIdx+')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('快捷出库')+'</button>'+
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('关闭')+'</button>';
    owOpenModal(tr('海外仓出库详情')+' - '+doNo,'74%',h,footer);
}

/* 出库校验码（由放货单DO号推导，PDA/快捷出库/查看校验码保持一致） */
function owOutboundCode(doNo){return '8'+String(doNo||'').replace(/\D/g,'').slice(-4)+'C';}
function owCurrentOperator(){
    try{
        if(typeof DEMO_ACCOUNTS!=='undefined'&&typeof _currentAccount!=='undefined'){
            var a=DEMO_ACCOUNTS.find(function(x){return x.id===_currentAccount;});
            if(a&&a.name)return a.name;
        }
    }catch(e){}
    return '当前操作员';
}
function owNowStr(){
    var d=new Date();
    var p=function(n){return (n<10?'0':'')+n;};
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());
}
function owExpiryStr(mins){
    var d=new Date(new Date().getTime()+(mins||30)*60000);
    var p=function(n){return (n<10?'0':'')+n;};
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());
}

/* 工具栏“查看校验码”：作用于选中行（未选行则提示） */
function openSelectedOverseasOutboundCode(id){
    var idx=(typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1;
    if(idx<0){
        if(typeof openActionModal==='function')openActionModal('selectRequired',id,-1);
        else showToast(tr('请先选择一行数据'));
        return;
    }
    openOverseasOutboundCode(id,idx);
}
/* ---------- 查看校验码：显示放货单二维码与对应一次性校验码 ---------- */
function openOverseasOutboundCode(id,rowIdx){
    var d=owRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到出库数据'));return;}
    var doNo=owCell(row,headers,'放货单DO号');
    var code=owOutboundCode(doNo);
    var expiry=owExpiryStr(30);
    var h='<div class="space-y-4">';
    h+='<section>'+owSectionTitle('放货单信息')+owInfoGrid([
        ['放货单DO号',doNo],['预约提货单号',owCell(row,headers,'预约提货单号')],['客户',owCell(row,headers,'客户')],['目的仓库',owCell(row,headers,'目的仓库')]
    ],4)+'</section>';
    h+='<section>'+owSectionTitle('放货二维码 · 一次性校验码');
    h+='<div class="flex flex-wrap items-center gap-6 rounded-lg border border-surface-200 bg-white p-4">';
    h+='<div class="text-center">'+owQrBlock()+'<div class="text-[11px] text-text-muted mt-1">'+tr('仅可核销一次')+'</div></div>';
    h+='<div class="flex-1 min-w-[200px]"><div class="text-xs text-text-muted mb-1">'+tr('一次性校验码')+'</div><div class="inline-block px-4 py-2 rounded-lg bg-primary-50 border border-primary-200 text-2xl font-bold tracking-widest text-primary-700">'+esc(code)+'</div>';
    h+='<div class="mt-2 text-xs"><span class="text-text-muted">'+tr('校验码到期时间')+'：</span><span class="font-semibold text-amber-600">'+esc(expiry)+'</span><span class="text-text-muted ml-1">'+tr('（有效 30 分钟，逾期请重新获取）')+'</span></div>';
    h+='<div class="mt-3 text-[11px] text-text-muted">'+tr('出库扫描/快捷出库时凭此二维码或校验码核验放货。')+'</div></div>';
    h+='</div></section>';
    h+='</div>';
    owOpenModal(tr('查看校验码')+' - '+doNo,'56%',h);
}

/* 快捷出库单据附件上传瓦片（替代客户/仓管签字）：签收单/签字单 */
function owQuickDocTile(key,label){
    return '<button type="button" id="ow-quick-doc-'+key+'" data-uploaded="0" onclick="owQuickUploadDoc(\''+key+'\',\''+label+'\')" class="h-16 rounded-lg border border-dashed border-primary-200 bg-primary-50/40 text-primary-600 flex flex-col items-center justify-center gap-1 text-sm font-medium cursor-pointer"><span class="text-lg leading-none">＋</span><span>'+tr('上传')+tr(label)+'</span></button>';
}
function owQuickUploadDoc(key,label){
    var btn=document.getElementById('ow-quick-doc-'+key);
    if(!btn)return;
    btn.dataset.uploaded='1';
    btn.className='h-16 rounded-lg border border-green-300 bg-green-50 text-green-700 flex flex-col items-center justify-center gap-1 text-sm font-medium cursor-pointer';
    btn.innerHTML='<span class="text-lg leading-none">✓</span><span>'+tr(label)+' '+tr('已上传')+'</span>';
    showToast(tr(label)+' '+tr('已上传'));
}
/* ---------- TMS 快捷出库（补充 App）：校验码+身份+上传单据 → 出库 ---------- */
function openOverseasQuickOutbound(id,rowIdx){
    var d=owRowData(id,rowIdx);
    var row=d.row,headers=(d.c.h||[]);
    if(!row){showToast(tr('未找到出库数据'));return;}
    var doNo=owCell(row,headers,'放货单DO号');
    var total=owCell(row,headers,'应出件数');
    var code=owOutboundCode(doNo);
    var h='<div class="space-y-4">';
    h+='<div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">'+tr('快捷出库为 TMS 端对 App 的补充：出库仍以预约提货单/放货单DO为准，快捷放行全部件数。')+'</div>';
    h+='<section>'+owSectionTitle('放货单信息')+owInfoGrid([
        ['放货单DO号',doNo],['预约提货单号',owCell(row,headers,'预约提货单号')],['Job号(提单号)',owCell(row,headers,'Job号')],['批次号',owCell(row,headers,'批次号')],['客户',owCell(row,headers,'客户')],['目的仓库',owCell(row,headers,'目的仓库')],['提货方式',owCell(row,headers,'提货方式')],['应出件数',total]
    ])+'</section>';
    h+='<section>'+owSectionTitle('出库核验');
    h+='<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('一次性验证码')+'<span class="text-red-500 ml-1">*</span></label><input id="ow-quick-code" type="text" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg" placeholder="'+tr('演示')+'：'+esc(code)+'"></div>';
    h+='<label class="flex items-end gap-2 text-sm text-text-secondary pb-2"><input type="checkbox" id="ow-quick-id" class="rounded border-surface-300 text-primary-600"><span>'+tr('身份核验一致（证件/电话/授权）')+'</span></label>';
    h+='<div class="flex items-end pb-1"><span class="text-[11px] text-text-muted">'+tr('二维码核销由现场扫描或此处校验码替代')+'</span></div>';
    h+='</div>';
    h+='<div class="mt-3 mb-1 text-[11px] font-medium text-text-secondary">'+tr('出库单据上传（签收单 / 签字单，支持拍照或选择图片）')+'</div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-4">'+owQuickDocTile('pod','签收单')+owQuickDocTile('sign','签字单')+'</div></section>';
    h+='<div class="rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-700">'+tr('校验码 + 身份核验 + 上传签收单/签字单 全部满足后方可快捷出库（一键放行全部件数）。')+'</div>';
    h+='</div>';
    var codeAttr=esc(code).replace(/'/g,"");
    var footer='<button onclick="submitOverseasQuickOutbound(\''+id+'\','+rowIdx+',\''+codeAttr+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认快捷出库')+'</button>'+
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('取消')+'</button>';
    owOpenModal(tr('快捷出库')+' - '+doNo,'70%',h,footer);
}
function submitOverseasQuickOutbound(id,rowIdx,code){
    var codeEl=document.getElementById('ow-quick-code');
    if(!codeEl||!codeEl.value.trim()){showToast(tr('请输入一次性验证码'));return;}
    if(codeEl.value.trim()!==code){showToast(tr('验证码不正确，禁止放货'));codeEl.focus();return;}
    if(!document.getElementById('ow-quick-id').checked){showToast(tr('请先核验提货人身份'));return;}
    var podEl=document.getElementById('ow-quick-doc-pod');
    var signEl=document.getElementById('ow-quick-doc-sign');
    if(!podEl||podEl.dataset.uploaded!=='1'){showToast(tr('请上传签收单'));return;}
    if(!signEl||signEl.dataset.uploaded!=='1'){showToast(tr('请上传签字单'));return;}
    /* 更新对应行：已出=应出，进度满，状态已出库，回填出库操作人/时间/网点 */
    var c=TC[id]||{};var d=owRowData(id,rowIdx);var row=d.row,headers=(c.h||[]);
    var iDo=headers.indexOf('放货单DO号');
    var doNo=owCell(row,headers,'放货单DO号');
    var srcRow=(c.d||[]).find(function(r){return r[iDo]===doNo;});
    if(srcRow){
        var iTotal=headers.indexOf('应出件数'),iDone=headers.indexOf('已出件数'),iProg=headers.indexOf('出库进度'),iSt=headers.indexOf('出库状态');
        var iOp=headers.indexOf('出库操作人'),iTime=headers.indexOf('操作时间'),iSite=headers.indexOf('操作网点');
        var t=srcRow[iTotal];
        if(iDone>=0)srcRow[iDone]=t;
        if(iProg>=0)srcRow[iProg]=t+'/'+t;
        if(iSt>=0)srcRow[iSt]='已出库';
        if(iOp>=0)srcRow[iOp]=owCurrentOperator();
        if(iTime>=0)srcRow[iTime]=owNowStr();
        if(iSite>=0&&(!srcRow[iSite]||srcRow[iSite]==='—'))srcRow[iSite]=owCell(row,headers,'目的仓库');
    }
    closeCrudModal();
    var mc=document.getElementById('main-content');
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,1,'');
    showToast(tr('快捷出库完成：已核验放行并减库存生成POD')+'（'+doNo+'）');
}

/* ---------- 新增出库单（参照提货预约：选客户→自动带仓库→加载运单明细→勾选出库子单） ---------- */
function openOverseasOutboundCreate(){
    _owCreateSubSel={};
    var h='<div class="space-y-5">';
    /* 1. 出库条件 */
    h+='<section>'+owSectionTitle('① 出库条件（选择客户后按提单号/批次号加载运单明细）');
    h+='<div class="grid grid-cols-1 md:grid-cols-4 gap-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('客户')+'<span class="text-red-500 ml-1">*</span></label>'+
        '<select id="ow-create-cust" onchange="owPickupOnCustomerChange()" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white focus:border-primary-400"><option value="">'+tr('请选择')+'</option>'+
        OW_PICKUP_CUSTOMERS.map(function(o){return '<option value="'+esc(o)+'">'+esc(o)+'</option>';}).join('')+'</select></div>';
    h+=owCreateInput('提单号（Job号）','ow-create-bl','对应系统提单号');
    h+=owCreateInput('批次号','ow-create-alloc','对应系统配舱单号/批次号');
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('目的仓库')+'<span class="text-red-500 ml-1">*</span></label>'+
        '<input id="ow-create-wh" type="text" readonly class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary" placeholder="'+tr('随所选客户自动带出')+'"></div>';
    h+='</div>';
    h+='<div class="mt-3"><button type="button" onclick="owPickupLoadWaybills()" class="h-9 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('加载运单明细')+'</button></div>';
    h+='</section>';
    /* 2. 出库明细（同提货预约选择设计） */
    h+='<section id="ow-create-wb-section" class="hidden">'+owSectionTitle('② 出库明细（勾选运单默认全选子单，点“子单选择”调整出库子单）');
    h+='<div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm">';
    h+='<thead class="bg-surface-50 text-text-secondary"><tr>'+
        '<th class="px-3 py-2 w-10 text-center"><input type="checkbox" onclick="owPickupToggleAll(this)"></th>'+
        ['运单号','品名','可出库件数','体积(CBM)','重量(KG)','已选件数','子单选择'].map(function(x){return '<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(x)+'</th>';}).join('')+
        '</tr></thead><tbody>';
    _owPickupWaybills.forEach(function(w,i){
        h+='<tr class="border-t border-surface-100">'+
            '<td class="px-3 py-2 text-center"><input type="checkbox" class="ow-create-wb-chk" data-idx="'+i+'" onchange="owPickupOnWbCheck('+i+')"></td>'+
            '<td class="px-3 py-2 font-medium text-primary-700">'+esc(w.wb)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary">'+tr(w.name)+'</td>'+
            '<td class="px-3 py-2 font-medium">'+w.pcs+'</td>'+
            '<td class="px-3 py-2">'+esc(w.vol)+'</td>'+
            '<td class="px-3 py-2">'+esc(w.weight)+'</td>'+
            '<td class="px-3 py-2"><span id="ow-selpcs-'+i+'" class="font-semibold text-primary-700">0</span></td>'+
            '<td class="px-3 py-2"><a class="text-primary-600 hover:text-primary-700 cursor-pointer" onclick="openOwSubSelectModal('+i+')">'+tr('子单选择')+'</a></td>'+
        '</tr>';
    });
    h+='</tbody></table></div>';
    h+='<div class="mt-2 text-[11px] text-text-muted">'+tr('已选件数按所选子单实时统计；生成出库单以“已选件数”为应出件数。')+'</div>';
    h+='</section>';
    h+='</div>';
    var footer='<button onclick="submitOverseasOutboundCreate()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('生成出库单')+'</button>'+
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('取消')+'</button>';
    owOpenModal(tr('新增出库单'),'86%',h,footer);
}
function submitOverseasOutboundCreate(){
    var custEl=document.getElementById('ow-create-cust');
    var whEl=document.getElementById('ow-create-wh');
    if(!custEl||!custEl.value){showToast(tr('请先选择客户'));return;}
    var checked=Array.prototype.slice.call(document.querySelectorAll('.ow-create-wb-chk')).filter(function(c){return c.checked;});
    if(checked.length===0){showToast(tr('请至少勾选一个运单'));return;}
    var totalPcs=0;
    checked.forEach(function(c){
        var wi=parseInt(c.getAttribute('data-idx'),10);
        var sel=_owCreateSubSel[wi]||[];
        totalPcs+=sel.length;
    });
    if(totalPcs===0){showToast(tr('所选运单未选择子单，请点“子单选择”'));return;}
    var seq=TC['ow-outbound'].d.length+1;
    var blEl=document.getElementById('ow-create-bl');
    var allocEl=document.getElementById('ow-create-alloc');
    var job=(blEl&&blEl.value)?blEl.value:'HT-NEW-20260716-'+String(100+seq).slice(-3);
    var batch=(allocEl&&allocEl.value)?allocEl.value:'B2607-NEW';
    var doNo='DO-'+job.replace(/^HT-/,'');
    var drNo='DR-20260716-'+String(200+seq).slice(-3);
    var wh=(whEl&&whEl.value)||'拉各斯海外仓';
    /* 列顺序须与表头一致：放货单DO号|预约提货单号|Job号|批次号|客户|目的仓库|提货方式|应出件数|已出件数|出库进度|出库状态|出库操作人|操作时间|操作网点 */
    var newRow=[doNo,drNo,job,batch,custEl.value,wh,'上门提货',String(totalPcs),'0','0/'+totalPcs,'待出库','—','—',wh];
    TC['ow-outbound'].d.unshift(newRow);
    closeCrudModal();
    var mc=document.getElementById('main-content');
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage('ow-outbound',1,'');
    showToast(tr('出库单已生成')+'：'+doNo+'（'+checked.length+tr('个运单')+' / '+totalPcs+tr('件')+'）');
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
            {sub:'WB-20260701002-01',wb:'WB-20260701002',cust:'CUS-001',cargoType:'普货'},
            {sub:'WB-20260701002-02',wb:'WB-20260701002',cust:'CUS-001',cargoType:'普货'},
            {sub:'WB-20260701012-01',wb:'WB-20260701012',cust:'CUS-002',cargoType:'敏感货'},
            {sub:'WB-20260701012-02',wb:'WB-20260701012',cust:'CUS-002',cargoType:'敏感货'},
            {sub:'WB-20260701018-01',wb:'WB-20260701018',cust:'CUS-003',cargoType:'普货'},
            {sub:'WB-20260701018-02',wb:'WB-20260701018',cust:'CUS-003',cargoType:'普货'}
        ]},
    {no:'YPCD-20260624-001',bl:'TD-20260624-001',wh:'阿比让海外仓',transport:'海运',
        pieces:[
            {sub:'WB-20260702003-01',wb:'WB-20260702003',cust:'CUS-004',cargoType:'普货'},
            {sub:'WB-20260702003-02',wb:'WB-20260702003',cust:'CUS-004',cargoType:'普货'},
            {sub:'WB-20260702009-01',wb:'WB-20260702009',cust:'CUS-005',cargoType:'带电'},
            {sub:'WB-20260702009-02',wb:'WB-20260702009',cust:'CUS-005',cargoType:'带电'}
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
    var target=item.pieces.find(function(p){return p.sub===val;});
    if(!target){
        showToast(tr('该子单号不在本配舱单内'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    if(_owArrScanScanned[val]){
        showToast(tr('该子单已扫描'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    _owArrScanScanned[val]=true;
    _owArrScanTab='scanned';
    var remaining=item.pieces.filter(function(p){return !_owArrScanScanned[p.sub];});
    if(remaining.length===0)showToast(tr('已全部到货，可点击一键到货完成'));
    else showToast(tr('入库成功')+'：'+val);
    refreshWarehousePdaPrototype();
}
function finishOwArrScan(){
    var item=_owArrScanList[_owArrScanCurrent];
    if(!item)return;
    item.pieces.forEach(function(p){_owArrScanScanned[p.sub]=true;});
    showToast(tr('一键到货完成，配舱单已全部入库'));
    refreshWarehousePdaPrototype();
}
function generateOwArrivalScanOperate(){
    var item=_owArrScanList[_owArrScanCurrent];
    var pending=item.pieces.filter(function(p){return !_owArrScanScanned[p.sub];});
    var scanned=item.pieces.filter(function(p){return _owArrScanScanned[p.sub];});
    var active=_owArrScanTab==='scanned'?scanned:pending;
    var tabBtn=function(key,label,n){
        var on=_owArrScanTab===key;
        return '<button type="button" onclick="switchOwArrScanTab(\''+key+'\')" class="h-10 rounded-lg text-sm font-medium '+(on?'bg-primary-600 text-white':'bg-white text-text-secondary border border-surface-200')+'">'+tr(label)+'（'+n+'）</button>';
    };
    var h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+='<section class="rounded-xl border border-primary-100 bg-primary-50 p-3"><div class="text-sm font-semibold text-primary-700 mb-2">'+tr('配舱单信息')+'</div><div class="grid grid-cols-2 gap-2 text-xs text-primary-700"><div class="break-all">'+tr('配舱单号')+'：'+esc(item.no)+'</div><div class="break-all">'+tr('提单号')+'：'+esc(item.bl)+'</div><div class="break-all">'+tr('目的仓库')+'：'+tr(item.wh)+'</div><div class="break-all">'+tr('应到件数')+'：'+item.pieces.length+'</div></div></section>';
    h+=pdaScanInput('ow-arr-piece','请扫描子单号','applyOwArrScanPiece',pending[0]?pending[0].sub:'');
    h+='<div class="grid grid-cols-2 gap-2">'+tabBtn('pending','待到货',pending.length)+tabBtn('scanned','已到货',scanned.length)+'</div>';
    if(active.length===0){
        h+='<div class="rounded-xl border border-surface-200 bg-white py-8 text-center text-xs text-text-muted">'+tr(_owArrScanTab==='scanned'?'暂无已到货件':'已全部扫描完毕')+'</div>';
    }else{
        active.forEach(function(p){
            h+='<div class="rounded-xl border border-surface-200 bg-white p-3"><div class="grid grid-cols-2 gap-y-1 text-xs">';
            h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('子单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(p.sub)+'</div></div>';
            h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(p.wb)+'</div></div>';
            h+='<div><div class="text-text-secondary">'+tr('客户代码')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(p.cust)+'</div></div>';
            h+='<div><div class="text-text-secondary">'+tr('货物类型')+'</div><div class="font-medium text-text-primary mt-0.5">'+tr(p.cargoType)+'</div></div>';
            h+='</div></div>';
        });
    }
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="finishOwArrScan()" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('一键到货完成')+'</button></div>';
    setTimeout(function(){var el=document.getElementById('ow-arr-piece');if(el)el.focus();},50);
    return h;
}

/* ---------- 海外出库扫描 ow-out-scan-os（verify核验 → scan逐件 → 签字出库） ---------- */
var _owOutScanView='list';
var _owOutScanCurrent=null;
var _owOutScanScanned={};
var _owOutScanTab='pending';
var _owOutScanPhase='verify';   /* verify=出库核验 / scan=逐件扫描 */
var _owOutVerified=false;
var _owOutCodeGot=false;              /* 是否已扫码获取验证码（核验①②合并） */
var _owOutDocs={pod:false,sign:false};/* 出库单据附件：签收单/签字单（替代客户/仓管签字） */
var _owOutScanList=[
    {do:'DO-NG-20260713-00040',job:'HT-NG-20260713-00040',cust:'深圳市华运达国际货运',wh:'拉各斯海外仓',pickup:'上门提货',picker:'Mr. Okafor',phone:'+234 802 000 111',idNo:'ID·A1234567',code:'80040C',
        pieces:[
            {piece:'GL-40-01',wb:'WB-20260701004',loc:'A区-A03'},
            {piece:'GL-40-02',wb:'WB-20260701004',loc:'A区-A03'},
            {piece:'GL-40-03',wb:'WB-20260701005',loc:'B区-B12'},
            {piece:'GL-40-04',wb:'WB-20260701005',loc:'B区-B12'},
            {piece:'GL-40-05',wb:'WB-20260701006',loc:'C区-C09'},
            {piece:'GL-40-06',wb:'WB-20260701006',loc:'C区-C09'}
        ]},
    {do:'DO-SN-20260715-00088',job:'HT-SN-20260715-00088',cust:'上海锦程国际贸易',wh:'达喀尔海外仓',pickup:'派送',picker:'派送员-王师傅',phone:'+221 77 555 8899',idNo:'ID·S9988776',code:'80088C',
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
    _owOutScanPhase='verify';
    _owOutVerified=false;
    _owOutCodeGot=false;
    _owOutDocs={pod:false,sign:false};
    _owOutScanView='operate';
    refreshWarehousePdaPrototype();
}
/* 扫描二维码获取验证码（核验①②合并）：扫码即核销并自动带出一次性验证码 */
function owOutScanCode(){
    _owOutCodeGot=true;
    var item=_owOutScanList[_owOutScanCurrent];
    refreshWarehousePdaPrototype();
    showToast(tr('二维码已核销，验证码已获取')+'：'+(item?item.code:''));
}
/* 出库核验：扫码获取验证码 + 核验身份 → 通过后进入逐件扫描 */
function confirmOwOutVerify(){
    var item=_owOutScanList[_owOutScanCurrent];
    if(!item)return;
    if(!_owOutCodeGot){showToast(tr('请先扫描二维码获取验证码'));return;}
    var idOk=document.getElementById('ow-out-id-ok');
    if(!idOk||!idOk.checked){showToast(tr('请核验提货人身份并勾选一致'));return;}
    _owOutVerified=true;
    _owOutScanPhase='scan';
    showToast(tr('核验通过，二维码已核销，开始逐件扫描出库'));
    refreshWarehousePdaPrototype();
}
function backOwOutVerify(){
    _owOutScanPhase='verify';
    refreshWarehousePdaPrototype();
}
/* 出库单据附件上传（替代客户/仓管签字）：签收单/签字单等 */
function owOutUploadDoc(key,label){
    _owOutDocs[key]=true;
    showToast(tr(label)+' '+tr('已上传'));
    refreshWarehousePdaPrototype();
}
function generateOwOutVerify(){
    var item=_owOutScanList[_owOutScanCurrent];
    var h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+='<section class="rounded-xl border border-primary-100 bg-primary-50 p-3"><div class="text-sm font-semibold text-primary-700 mb-2">'+tr('放货单信息')+'</div><div class="grid grid-cols-2 gap-2 text-xs text-primary-700"><div class="break-all">'+tr('放货单DO号')+'：'+esc(item.do)+'</div><div class="break-all">'+tr('Job号')+'：'+esc(item.job)+'</div><div class="break-all">'+tr('客户')+'：'+tr(item.cust)+'</div><div class="break-all">'+tr('提货方式')+'：'+tr(item.pickup)+'</div></div></section>';
    /* ① 扫描二维码获取验证码（原“扫码核销”与“输入验证码”合并） */
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('① 扫描二维码获取验证码')+'</div>';
    h+='<div class="flex items-center gap-3">'+owQrBlock()+'<div class="flex-1"><div class="text-[11px] text-text-muted mb-2">'+tr('扫描客户出示的 DO 二维码，系统自动核销并带出一次性验证码')+'</div>';
    h+='<button type="button" onclick="owOutScanCode()" class="h-9 w-full rounded-lg '+(_owOutCodeGot?'bg-green-600':'bg-primary-600')+' text-white text-xs font-medium">'+(_owOutCodeGot?('✓ '+tr('已获取验证码')):tr('扫码获取验证码'))+'</button></div></div>';
    h+='<div class="mt-3"><label class="text-[11px] text-text-muted">'+tr('一次性验证码')+'</label><input id="ow-out-code" type="text" readonly value="'+(_owOutCodeGot?esc(item.code):'')+'" class="w-full h-10 px-3 text-sm rounded-lg border border-surface-200 bg-surface-100 mt-1" placeholder="'+tr('扫码后自动获取')+'"></div></section>';
    /* ② 身份核验 */
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-sm font-semibold text-text-primary mb-2">'+tr('② 核验提货人身份')+'</div>';
    h+='<div class="grid grid-cols-2 gap-2 text-xs"><div><div class="text-text-secondary">'+tr('提货人')+'</div><div class="font-medium text-text-primary mt-0.5">'+tr(item.picker)+'</div></div><div><div class="text-text-secondary">'+tr('联系电话')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.phone)+'</div></div><div class="col-span-2"><div class="text-text-secondary">'+tr('证件号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.idNo)+'</div></div></div>';
    h+='<label class="mt-2 flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" id="ow-out-id-ok" class="rounded border-surface-300 text-primary-600"><span>'+tr('已核对提货人证件、电话与授权，信息一致')+'</span></label></section>';
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-700">'+tr('硬闸：扫码获取验证码 + 身份核验，通过后方可出库。')+'</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="confirmOwOutVerify()" class="h-11 w-full rounded-xl bg-primary-600 text-white text-sm font-semibold">'+tr('核验通过 · 开始出库扫描')+'</button></div>';
    return h;
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
    if(remaining.length===0)showToast(tr('已全部出库，请上传签收单/签字单'));
    else showToast(tr('出库成功')+'：'+val);
    refreshWarehousePdaPrototype();
}
function finishOwOutScan(){
    var item=_owOutScanList[_owOutScanCurrent];
    if(!item)return;
    if(!_owOutDocs.pod||!_owOutDocs.sign){showToast(tr('请上传签收单和签字单后方可出库'));return;}
    item.pieces.forEach(function(p){_owOutScanScanned[p.piece]=true;});
    showToast(tr('出库完成：验证码核验 + 单据上传已确认，释放减库存并生成POD'));
    refreshWarehousePdaPrototype();
}
function generateOwOutScanOperate(){
    if(_owOutScanPhase==='verify')return generateOwOutVerify();
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
    h+='<div class="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-[11px] text-green-700"><span>'+tr('✓ 出库核验已通过（二维码+验证码+身份）')+'</span><button type="button" onclick="backOwOutVerify()" class="text-primary-600 font-medium">'+tr('返回核验')+'</button></div>';
    h+='<div class="rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-[11px] text-teal-700">'+tr('双扫码：逐件扫货物标签核对（放货码已核销），系统自动扣减库存。')+'</div>';
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
    var docTile=function(key,label){
        var on=_owOutDocs[key];
        return '<button type="button" onclick="owOutUploadDoc(\''+key+'\',\''+label+'\')" class="h-16 rounded-lg border flex flex-col items-center justify-center gap-1 text-xs font-medium '+(on?'border-green-300 bg-green-50 text-green-700':'border-dashed border-primary-200 bg-primary-50/40 text-primary-600')+'"><span class="text-base leading-none">'+(on?'✓':'＋')+'</span><span>'+tr(label)+(on?' '+tr('已上传'):'')+'</span></button>';
    };
    var docsOk=_owOutDocs.pod&&_owOutDocs.sign;
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3 space-y-2">';
    h+='<div class="text-[11px] font-medium text-text-secondary">'+tr('出库单据上传（签收单 / 签字单，支持拍照或选择图片）')+'</div>';
    h+='<div class="grid grid-cols-2 gap-2">'+docTile('pod','签收单')+docTile('sign','签字单')+'</div>';
    h+='<button type="button" onclick="finishOwOutScan()" class="h-10 w-full rounded-lg '+(docsOk?'bg-primary-600':'bg-surface-300')+' text-white text-sm font-medium">'+tr('确认出库 · 减库存生成POD')+'</button>';
    h+='</div>';
    setTimeout(function(){var el=document.getElementById('ow-out-piece');if(el)el.focus();},50);
    return h;
}
