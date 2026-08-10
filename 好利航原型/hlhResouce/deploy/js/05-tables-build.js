function simpleQueryFromHeaders(headers,statuses){
    const preferred=['单号','编号','客户','仓库','货区','类型','状态','时间','日期','目的港','柜号','航次','托盘号','袋号'];
    return headers.filter(function(h){return h!=='操作'&&preferred.some(function(k){return h.indexOf(k)>=0;});}).slice(0,8).map(function(h){
        const field={label:h,type:'text'};
        if(h.indexOf('状态')>=0){field.type='select';field.options=statuses||['待处理','已完成'];}
        else if(h.indexOf('类型')>=0){field.type='select';}
        else if(h.indexOf('时间')>=0||h.indexOf('日期')>=0){field.type='date';}
        return field;
    });
}

function addPrototypeTable(id,title,headers,statuses,rows,queries){
    TC[id]={t:title,h:headers.split('|'),s:statuses||[],d:rows||[]};
    TC[id].q=queries||simpleQueryFromHeaders(TC[id].h,TC[id].s);
}

addPrototypeTable('wh-transfer-in','调拨入库','调拨单号|调拨状态|发货仓|收货仓|车牌号|预计到货时间|调拨票数|调拨件数|操作',['待入库','运输中','已完成','异常'],[
    ['TR-20260613001','运输中','深圳盐田仓','广州南沙仓','粤B8H21Q','2026-06-13 18:30','8','42'],
    ['TR-20260612008','待入库','上海浦东仓','广州南沙仓','沪A6T92K','2026-06-14 10:00','5','26']
],[
    {label:'调拨单号',type:'text'},
    {label:'调拨状态',type:'select',options:['待入库','运输中','已完成','异常']},
    {label:'发货仓',type:'select',options:getWarehouseNameOptions()},
    {label:'收货仓',type:'select',options:getWarehouseNameOptions()},
    {label:'预计到货时间',type:'date'}
]);
addPrototypeTable('wh-transfer-out','调拨出库','调拨单号|调拨状态|发货仓|收货仓|车牌号|预计到货时间|调拨票数|调拨件数|操作',['待调拨','待出库','已出库','已取消'],[
    ['TR-20260613001','待出库','深圳盐田仓','广州南沙仓','粤B8H21Q','2026-06-13 18:30','8','42'],
    ['TR-20260612008','已出库','上海浦东仓','广州南沙仓','沪A6T92K','2026-06-14 10:00','5','26']
],[
    {label:'调拨单号',type:'text'},
    {label:'调拨状态',type:'select',options:['待调拨','待出库','已出库','已取消']},
    {label:'发货仓',type:'select',options:getWarehouseNameOptions()},
    {label:'收货仓',type:'select',options:getWarehouseNameOptions()},
    {label:'预计到货时间',type:'date'}
]);
addPrototypeTable('wh-transfer-fee','调拨费用查询','调拨单号|费用类型|金额|创建时间|备注|操作',['待提交','已确认'],[
    ['TR-20260613001','调拨运输费','860.00','2026-06-13 12:05','广州南沙仓调拨至深圳盐田仓'],
    ['TR-20260612007','仓内搬运费','240.00','2026-06-12 17:30','含托盘搬运和装车']
],[
    {label:'调拨单号',type:'text'},
    {label:'费用类型',type:'select',options:['调拨运输费','仓内搬运费','装卸费','其他']},
    {label:'创建时间',type:'date'}
]);
addPrototypeTable('wh-scan-out','扫描出库','扫描出库单号|运单号|物流单号|出库仓库|货区|托盘号|扫描件数|扫描重量(KG)|操作人|扫描时间|状态|操作',['待扫描','扫描中','已出库','异常'],[
    ['SO-20260613001','WB-20260522001','SF10086523','深圳盐田仓','A区','TP-YT-001','10','250.00','张伟','2026-06-13 13:20','扫描中'],
    ['SO-20260613002','WB-20260522002','YT98876543','广州南沙仓','B区','TP-NS-006','6','120.00','李强','2026-06-13 13:58','已出库']
]);
addPrototypeTable('wh-pallet-mgmt','上托管理','上托单号|运单号|到货仓库|货区|托盘号|上托件数|重量(KG)|体积(CBM)|上托人|上托时间|状态|操作',['待上托','已上托','异常'],[
    ['PL-20260613001','WB-20260522001','深圳盐田仓','A区','TP-YT-001','10','250.00','1.350','陈工','2026-06-13 14:10','待上托'],
    ['PL-20260612006','WB-20260522002','广州南沙仓','B区','TP-NS-006','6','120.00','0.720','王工','2026-06-12 15:38','已上托']
]);
addPrototypeTable('wh-pallet-info','托盘信息查询','状态|托盘类型|托盘号|货区|国家|运输方式|件数|重量|封板状态|登记方式|登记人|登记仓|操作',['使用中','已作废'],[
    ['已作废','快递','TP202509220017','E6','塞内加尔','海运','15','37.5KG','未封板','员工端','卖零食的小女孩','腾信国际'],
    ['已作废','快递','TP202509220018','E6','尼日利亚','海运','18','45.0KG','未封板','员工端','卖零食的小女孩','腾信国际'],
    ['已作废','快递','TP202509220019','E6','加纳','空运','20','50.0KG','未封板','员工端','卖零食的小女孩','腾信国际'],
    ['使用中','快递','TP202509220011','A12','塞内加尔','海运','8','20.0KG','未封板','员工端','卖零食的小女孩','腾信国际'],
    ['使用中','快递','TX20250927018','','尼日利亚','空运','12','30.0KG','未封板','员工端','卖零食的小女孩','腾信国际'],
    ['使用中','快递','TX20250927019','','塞内加尔','空运','10','25.0KG','未封板','员工端','卖零食的小女孩','腾信国际'],
    ['使用中','快递','TP202509190011','','科特迪瓦','海运','25','62.5KG','未封板','员工端','卖零食的小女孩','腾信国际'],
    ['使用中','非快递','KAPAI-11','','喀麦隆','海运','30','75.0KG','未封板','员工端','卢慧恒','深圳坂田'],
    ['已作废','非快递','ZIYING22','','加纳','空运','7','17.5KG','已封板','员工端','卢慧恒','深圳坂田'],
    ['已作废','非快递','11','','多哥','海运','3','7.5KG','已封板','员工端','卢慧恒','深圳坂田'],
    ['已作废','非快递','12','','塞内加尔','海运','5','12.5KG','已封板','员工端','卢慧恒','深圳坂田'],
    ['已作废','快递','tp54684','A12','尼日利亚','空运','22','55.0KG','已封板','PDA端','卖零食的小女孩','腾信国际'],
    ['已作废','快递','TP546876','A12','尼日利亚','空运','18','45.0KG','已封板','PDA端','卖零食的小女孩','腾信国际']
],[
    {label:'托盘编号',type:'text',field:'palletNo',placeholder:'请输入托盘编号'},
    {label:'国家',type:'select',field:'country',options:['塞内加尔','尼日利亚','加纳','科特迪瓦','喀麦隆','多哥']},
    {label:'运输方式',type:'select',field:'transport',options:['海运','空运']},
    {label:'托盘类型',type:'select',field:'palletType',options:['快递','非快递']},
    {label:'状态',type:'select',field:'status',options:['使用中','已作废']},
    {label:'封板状态',type:'select',field:'sealStatus',options:['已封板','未封板']},
    {label:'登记方式',type:'select',field:'regMethod',options:['员工端','PDA端']}
]);
TC['wh-pallet-info'].noAutoAudit=true;
var _palletInfoDetailMap={
    'TP202509220017':[
        {subNo:'ICBU00000600761-01',waybillNo:'ICBU00000600761',customerNo:'',boxingNo:'',boxingTime:'2025-10-24 16:38:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-24 16:35:56'},
        {subNo:'ICBU00000600761-02',waybillNo:'ICBU00000600761',customerNo:'',boxingNo:'',boxingTime:'2025-10-24 16:38:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-24 16:36:12'},
        {subNo:'ICBU00000600771-01',waybillNo:'ICBU00000600771',customerNo:'',boxingNo:'',boxingTime:'2025-10-24 16:38:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-24 16:37:04'}
    ],
    'TP202509220018':[
        {subNo:'ICBU00000600762-01',waybillNo:'ICBU00000600762',customerNo:'',boxingNo:'',boxingTime:'2025-10-24 16:38:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-24 16:35:40'},
        {subNo:'ICBU00000600762-02',waybillNo:'ICBU00000600762',customerNo:'',boxingNo:'',boxingTime:'2025-10-24 16:38:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-24 16:35:58'},
        {subNo:'ICBU00000600772-01',waybillNo:'ICBU00000600772',customerNo:'',boxingNo:'',boxingTime:'2025-10-24 16:38:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-24 16:36:22'}
    ],
    'TP202509220019':[
        {subNo:'ICBU00000600763-01',waybillNo:'ICBU00000600763',customerNo:'',boxingNo:'',boxingTime:'2025-10-24 16:38:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-24 16:35:15'},
        {subNo:'ICBU00000600763-02',waybillNo:'ICBU00000600763',customerNo:'',boxingNo:'',boxingTime:'2025-10-24 16:38:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-24 16:35:38'},
        {subNo:'ICBU00000600773-01',waybillNo:'ICBU00000600773',customerNo:'',boxingNo:'',boxingTime:'2025-10-24 16:38:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-24 16:36:02'},
        {subNo:'ICBU00000600773-02',waybillNo:'ICBU00000600773',customerNo:'',boxingNo:'',boxingTime:'2025-10-24 16:38:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-24 16:36:24'}
    ],
    'TP202509220011':[
        {subNo:'ICBU00000600741-01',waybillNo:'ICBU00000600741',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'是',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-21 16:49:35'},
        {subNo:'ICBU00000600741-02',waybillNo:'ICBU00000600741',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'是',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-10-21 16:50:12'}
    ],
    'TX20250927018':[
        {subNo:'ICBU00000600714-01',waybillNo:'ICBU00000600714',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-27 19:00:03'},
        {subNo:'ICBU00000600714-02',waybillNo:'ICBU00000600714',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-27 19:01:15'}
    ],
    'TX20250927019':[
        {subNo:'ICBU00000600715-01',waybillNo:'ICBU00000600715',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-27 18:58:27'},
        {subNo:'ICBU00000600715-02',waybillNo:'ICBU00000600715',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-27 18:59:44'}
    ],
    'TP202509190011':[
        {subNo:'ICBU00000600626-01',waybillNo:'ICBU00000600626',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-23 13:49:38'},
        {subNo:'ICBU00000600626-02',waybillNo:'ICBU00000600626',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-23 13:50:22'},
        {subNo:'ICBU00000600626-03',waybillNo:'ICBU00000600626',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-23 13:51:06'},
        {subNo:'ICBU00000600636-01',waybillNo:'ICBU00000600636',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-23 13:52:14'}
    ],
    'KAPAI-11':[
        {subNo:'ICBU00000600504-01',waybillNo:'ICBU00000600504',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卢慧恒',upPalletTime:'2025-09-18 14:33:53'},
        {subNo:'ICBU00000600504-02',waybillNo:'ICBU00000600504',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卢慧恒',upPalletTime:'2025-09-18 14:35:18'},
        {subNo:'ICBU00000600514-01',waybillNo:'ICBU00000600514',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卢慧恒',upPalletTime:'2025-09-18 14:37:02'},
        {subNo:'ICBU00000600514-02',waybillNo:'ICBU00000600514',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卢慧恒',upPalletTime:'2025-09-18 14:38:44'},
        {subNo:'ICBU00000600524-01',waybillNo:'ICBU00000600524',customerNo:'',boxingNo:'',boxingTime:'',findGoods:'否',loadingContainer:'否',upPalletBy:'卢慧恒',upPalletTime:'2025-09-18 14:40:11'}
    ],
    'ZIYING22':[
        {subNo:'ICBU00000600494-01',waybillNo:'ICBU00000600494',customerNo:'',boxingNo:'',boxingTime:'2025-09-18 10:25:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卢慧恒',upPalletTime:'2025-09-18 10:21:02'},
        {subNo:'ICBU00000600494-02',waybillNo:'ICBU00000600494',customerNo:'',boxingNo:'',boxingTime:'2025-09-18 10:25:23',findGoods:'否',loadingContainer:'否',upPalletBy:'卢慧恒',upPalletTime:'2025-09-18 10:22:31'}
    ],
    '11':[
        {subNo:'ICBU00000600447-01',waybillNo:'ICBU00000600447',customerNo:'',boxingNo:'',boxingTime:'2025-09-11 15:20:03',findGoods:'否',loadingContainer:'否',upPalletBy:'卢慧恒',upPalletTime:'2025-09-11 14:58:00'}
    ],
    '12':[
        {subNo:'ICBU00000600445-01',waybillNo:'ICBU00000600445',customerNo:'',boxingNo:'',boxingTime:'2025-09-11 16:14:59',findGoods:'否',loadingContainer:'否',upPalletBy:'卢慧恒',upPalletTime:'2025-09-11 14:17:38'},
        {subNo:'ICBU00000600445-02',waybillNo:'ICBU00000600445',customerNo:'',boxingNo:'',boxingTime:'2025-09-11 16:14:59',findGoods:'否',loadingContainer:'否',upPalletBy:'卢慧恒',upPalletTime:'2025-09-11 14:18:22'}
    ],
    'tp54684':[
        {subNo:'ICBU00000600425-01',waybillNo:'ICBU00000600425',customerNo:'义乌总仓-中美UPS快递-A12',boxingNo:'BOX-20250911-001',boxingTime:'2025-09-11 10:28:47',findGoods:'是',loadingContainer:'是',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-08 16:17:36'},
        {subNo:'ICBU00000600425-02',waybillNo:'ICBU00000600425',customerNo:'义乌总仓-中美UPS快递-A12',boxingNo:'BOX-20250911-001',boxingTime:'2025-09-11 10:28:47',findGoods:'是',loadingContainer:'是',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-08 16:18:44'},
        {subNo:'ICBU00000600435-01',waybillNo:'ICBU00000600435',customerNo:'义乌总仓-中美UPS快递-A12',boxingNo:'BOX-20250911-001',boxingTime:'2025-09-11 10:28:47',findGoods:'是',loadingContainer:'是',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-08 16:20:03'}
    ],
    'TP546876':[
        {subNo:'ICBU00000600425-03',waybillNo:'ICBU00000600425',customerNo:'义乌总仓-中美UPS快递-A12',boxingNo:'BOX-20250911-001',boxingTime:'2025-09-11 10:28:47',findGoods:'是',loadingContainer:'是',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-08 15:15:23'},
        {subNo:'ICBU00000600445-01',waybillNo:'ICBU00000600445',customerNo:'义乌总仓-中美UPS快递-A12',boxingNo:'BOX-20250911-001',boxingTime:'2025-09-11 10:28:47',findGoods:'是',loadingContainer:'是',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-08 15:16:38'},
        {subNo:'ICBU00000600455-01',waybillNo:'ICBU00000600455',customerNo:'义乌总仓-中美UPS快递-A12',boxingNo:'BOX-20250911-001',boxingTime:'2025-09-11 10:28:47',findGoods:'是',loadingContainer:'是',upPalletBy:'卖零食的小女孩',upPalletTime:'2025-09-08 15:18:11'}
    ]
};

function openPalletInfoDetailModal(id,rowIdx){
    const c=TC[id]||{};
    const data=_listData[id]||c.d||[];
    const rowData=data[rowIdx];
    if(!rowData){showToast(tr('未找到托盘数据'));return;}
    const palletNo=getTableValueByHeader(c,rowData,'托盘号','')||rowData[2]||'';
    const rows=_palletInfoDetailMap[palletNo]||[];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='78%';
    titleEl.textContent=tr('托盘明细')+' - '+palletNo;
    /* 顶部信息条：托盘号 + 汇总（子单笔数、涉及运单数） */
    const waybillSet={};
    rows.forEach(function(r){if(r.waybillNo)waybillSet[r.waybillNo]=true;});
    let html='<div class="space-y-4">';
    html+='<div class="flex flex-wrap items-center gap-6 rounded-lg border border-primary-100 bg-primary-50/40 px-4 py-3">';
    [['托盘号',palletNo],['子单笔数',String(rows.length)],['涉及运单数',String(Object.keys(waybillSet).length)]].forEach(function(item){
        html+='<div><div class="text-xs text-text-muted">'+tr(item[0])+'</div><div class="text-sm font-semibold text-primary-700 mt-0.5">'+esc(item[1]||'—')+'</div></div>';
    });
    html+='</div>';
    /* 明细表格 */
    html+='<div class="border border-surface-200 rounded-lg overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-sm min-w-[1120px]">';
    html+='<thead class="bg-surface-50 text-text-secondary"><tr>'+
        ['子单号','运单号','客户单号','配舱单号','配舱时间','是否找货','是否装柜','上托人','上托时间'].map(function(hd){
            return '<th class="px-3 py-2 text-left whitespace-nowrap border-b border-surface-200">'+tr(hd)+'</th>';
        }).join('')+
    '</tr></thead><tbody>';
    if(!rows.length){
        html+='<tr><td colspan="9" class="px-3 py-8 text-center text-text-muted">'+tr('该托盘暂无明细数据')+'</td></tr>';
    }else{
        rows.forEach(function(r){
            html+='<tr class="border-t border-surface-100 hover:bg-primary-50/30">'+
                '<td class="px-3 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(r.subNo||'—')+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.waybillNo||'—')+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.customerNo||'—')+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.boxingNo||'—')+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.boxingTime||'—')+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.findGoods||'—')+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.loadingContainer||'—')+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.upPalletBy||'—')+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(r.upPalletTime||'—')+'</td>'+
            '</tr>';
        });
    }
    html+='</tbody></table></div></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
TC['wh-pallet-print']={t:'托盘打印',pageMode:'palletPrint',h:[],q:[],s:[],d:[]};
addPrototypeTable('wh-express-sort','快递分拣方案管理','方案编号|方案名称|国家|运输方式|操作',[],[
    ['SP1001','西非快递主方案','塞内加尔、尼日利亚','海运、空运'],
    ['SP1002','东非普货方案','肯尼亚','海运'],
    ['SP1003','西非空运快线','尼日利亚','空运'],
    ['SP1004','中东海运专线','阿联酋','海运'],
    ['SP1005','南非海运普货','南非、津巴布韦','海运']
],[
    {label:'方案编号',type:'text',field:'code',placeholder:'请输入方案编号'},
    {label:'方案名称',type:'text',field:'name',placeholder:'请输入方案名称'},
    {label:'国家',type:'text',field:'country',placeholder:'请输入国家'},
    {label:'运输方式',type:'select',field:'transport',options:['海运','空运']}
]);
TC['wh-express-sort'].noAutoAudit=true;
TC['wh-express-inbound']={t:'快递入仓(分拣装板)',pageMode:'expressInbound',h:[],q:[],s:[],d:[]};
addPrototypeTable('wh-pack-rule','配舱规则','销售产品|运输方式|目的港|配舱优先级1|配舱优先级2|配舱优先级3|是否启用',['启用','停用'],[
    ['西非海运普货','海运','拉各斯','MAERSK','COSCO','MSC','启用'],
    ['空运敏感货','空运','阿比让','ET','TK','EK','启用']
],[
    {label:'销售产品',type:'select',options:['西非海运普货','空运敏感货','带电产品','普货快线']},
    {label:'运输方式',type:'select',options:['海运','空运','铁路','快递']},
    {label:'目的港',type:'select',options:['拉各斯','达喀尔','阿比让','特马','杜阿拉','洛美','科托努']},
    {label:'是否启用',type:'select',options:['启用','停用']}
]);
addPrototypeTable('wh-cargo-search','查货管理','状态|运单号|物流单号|运单状态|客户代码|销售产品|件数|所属业务员|创建人|创建时间|创建网点',['待查货','已扣件','已确认'],[
    ['待查货','WB-20260613001','SF10086523','已入仓','CUS-001','西非海运普货','8','王明辉','李仓管','2026-06-13 10:35','深圳盐田仓'],
    ['已扣件','WB-20260613002','YT98876543','待出库','CUS-002','空运敏感货','3','刘晓东','陈志远','2026-06-13 11:18','广州南沙仓']
],[
    {label:'状态',type:'select',options:['待查货','已扣件','已确认']},
    {label:'运单号',type:'text'},
    {label:'物流单号',type:'text'},
    {label:'运单状态',type:'select',options:['已入仓','待出库','已出库','异常']},
    {label:'客户代码',type:'text'},
    {label:'所属业务员',type:'select',options:['王明辉','刘晓东','陈志远','赵雅琴']}
]);
addPrototypeTable('wh-out-scan','出库扫描','运单号|子单号|是否出库|操作',['待出库','已出库'],[
    ['WB-20260613001','SUB-20260613001-01','否'],
    ['WB-20260613001','SUB-20260613001-02','是'],
    ['WB-20260613002','SUB-20260613002-01','否']
],[
    {label:'运单号',type:'text'},
    {label:'子单号',type:'text'},
    {label:'是否出库',type:'select',options:['否','是']}
]);
addPrototypeTable('wh-preload','配舱单登记','配舱单号|销售产品|运输方式|目的港|提单号|总票数|总件数|总重量(KG)|总立方(CBM)|状态|备注|操作',['待配舱','已绑定提单','已完成','已取消'],[
    ['YPCD-20260613001','西非海运普货','海运','拉各斯','HLHLA260613001','8','28','560.00','3.820','待配舱','等待绑定提单'],
    ['YPCD-20260612003','空运敏感货','空运','阿比让','HLHABJ260612003','5','16','288.00','1.960','已绑定提单','已完成初步配舱']
],[
    {label:'配舱单号',type:'text'},
    {label:'销售产品',type:'select',options:['西非海运普货','空运敏感货','带电产品','普货快线']},
    {label:'运输方式',type:'select',options:['海运','空运','铁路','快递']},
    {label:'目的港',type:'select',options:['拉各斯','达喀尔','阿比让','特马','杜阿拉','洛美','科托努']},
    {label:'状态',type:'select',options:['待配舱','已绑定提单','已完成','已取消']}
]);
addPrototypeTable('wh-replenish-drop','补货落货管理','运单号|子单号|所属业务员|原配舱单号|目标配舱单号|件数|类型',['补货','落货'],[
    ['WB-20260522001','SUB-001','王明辉','YPCD-20260613001','YPCD-20260613002','2','补货'],
    ['WB-20260522003','SUB-003','刘晓东','YPCD-20260612003','YPCD-20260612005','1','落货']
],[
    {label:'运单号',type:'text'},
    {label:'子单号',type:'text'},
    {label:'所属业务员',type:'select',options:['王明辉','刘晓东','陈志远','赵雅琴']},
    {label:'类型',type:'select',options:['补货','落货']}
]);
addPrototypeTable('wh-issue','问题件管理','问题件单号|问题件类型|运单号|物流单号|客户名称|所属仓库|问题描述|当前处理人|创建时间|状态|操作',['待处理','处理中','已关闭'],[
    ['ISS-20260613001','库内问题件','WB-20260522004','','东莞市鑫海物流','广州南沙仓','外包装破损，需重新拍照确认','陈志远','2026-06-13 11:30','处理中'],
    ['ISS-20260612002','库外问题件','WB-20260522005','JD30012345','上海锦程国际贸易','上海浦东仓','客户反馈派送前物流轨迹异常','王海波','2026-06-12 14:42','待处理']
],[
    {label:'问题件单号',type:'text'},{label:'问题件类型',type:'select',options:['库内问题件','库外问题件']},{label:'运单号',type:'text'},{label:'所属仓库',type:'select',options:getWarehouseNameOptions()},{label:'状态',type:'select',options:['待处理','处理中','已关闭']}
]);
addPrototypeTable('wh-air-sort','空运分拣管理','分拣单号|运单号|航班号|目的机场|分拣区域|件数|重量(KG)|分拣人|分拣时间|状态|操作',['待分拣','分拣中','已分拣','异常'],[
    ['AS-20260613001','WB-AIR-260613001','ET605','ADD','空运A区','12','186.50','刘晓东','2026-06-13 09:50','分拣中'],
    ['AS-20260612008','WB-AIR-260612008','TK073','IST','空运B区','8','92.00','张伟','2026-06-12 16:30','已分拣']
]);
addPrototypeTable('wh-air-bag','空运装袋管理','袋号|分拣单号|航班号|目的机场|袋内件数|袋重(KG)|封袋人|封袋时间|状态|操作',['待装袋','已装袋','已出库'],[
    ['BAG-LOS-001','AS-20260613001','ET605','LOS','6','96.20','刘晓东','2026-06-13 11:20','待装袋'],
    ['BAG-ABJ-002','AS-20260612008','TK073','ABJ','8','92.00','张伟','2026-06-12 17:10','已装袋']
]);
addPrototypeTable('wh-air-pack','空运装箱单管理','装箱单号|袋号|航班号|目的机场|件数|重量(KG)|体积(CBM)|制单人|制单时间|状态|操作',['待生成','已生成','已确认'],[
    ['APL-20260613001','BAG-LOS-001','ET605','LOS','6','96.20','0.680','李强','2026-06-13 12:00','待生成'],
    ['APL-20260612002','BAG-ABJ-002','TK073','ABJ','8','92.00','0.540','陈工','2026-06-12 17:40','已确认']
]);
addPrototypeTable('wh-air-arrival-scan','到货扫描','到货单号|运单号|物流单号|航班号|目的机场|到货件数|重量(KG)|扫描人|扫描时间|状态|操作',['待扫描','已扫描','异常'],[
    ['AR-20260613001','WB-AIR-260613001','SF10086523','ET605','ADD','12','186.50','张伟','2026-06-13 08:40','已扫描'],
    ['AR-20260612008','WB-AIR-260612008','YT98876543','TK073','IST','8','92.00','李强','2026-06-12 15:20','待扫描']
],[
    {label:'到货单号',type:'text'},
    {label:'运单号',type:'text'},
    {label:'航班号',type:'text'},
    {label:'状态',type:'select',options:['待扫描','已扫描','异常']}
]);
addPrototypeTable('wh-air-sort-scan','分拣扫描','分拣单号|运单号|航班号|目的机场|分拣区域|分拣件数|重量(KG)|扫描人|扫描时间|状态|操作',['待扫描','已扫描','异常'],[
    ['AST-20260613001','WB-AIR-260613001','ET605','ADD','空运A区','12','186.50','刘晓东','2026-06-13 09:50','已扫描'],
    ['AST-20260612008','WB-AIR-260612008','TK073','IST','空运B区','8','92.00','张伟','2026-06-12 16:30','待扫描']
],[
    {label:'分拣单号',type:'text'},
    {label:'运单号',type:'text'},
    {label:'分拣区域',type:'select',options:['空运A区','空运B区','异常区']},
    {label:'状态',type:'select',options:['待扫描','已扫描','异常']}
]);
addPrototypeTable('wh-air-checkin-sort-scan','签入分拣扫描','签入单号|袋号|运单号|航班号|目的机场|签入件数|重量(KG)|扫描人|扫描时间|状态|操作',['待签入','已签入','异常'],[
    ['CIS-20260613001','BAG-LOS-001','WB-AIR-260613001','ET605','LOS','6','96.20','刘晓东','2026-06-13 11:25','已签入'],
    ['CIS-20260612008','BAG-ABJ-002','WB-AIR-260612008','TK073','ABJ','8','92.00','张伟','2026-06-12 17:15','待签入']
],[
    {label:'签入单号',type:'text'},
    {label:'袋号',type:'text'},
    {label:'运单号',type:'text'},
    {label:'状态',type:'select',options:['待签入','已签入','异常']}
]);
addPrototypeTable('wh-air-checkout-scan','签出扫描','签出单号|袋号|航班号|目的机场|签出件数|重量(KG)|扫描人|扫描时间|状态|操作',['待签出','已签出','异常'],[
    ['CO-20260613001','BAG-LOS-001','ET605','LOS','6','96.20','刘晓东','2026-06-13 13:40','已签出'],
    ['CO-20260612008','BAG-ABJ-002','TK073','ABJ','8','92.00','张伟','2026-06-12 18:05','待签出']
],[
    {label:'签出单号',type:'text'},
    {label:'袋号',type:'text'},
    {label:'航班号',type:'text'},
    {label:'状态',type:'select',options:['待签出','已签出','异常']}
]);
addPrototypeTable('wh-loading-list','配载单','出库单号|出库计划|运单号|客户单号|下单状态|下单结果信息|代理单号|总件数|状态|操作',['待出仓','已找货','可出仓','已出仓','待配柜','已配柜'],[
    ['ZPCD-20260625-002','配载计划A','WB-20260625001','KH00012','待下单','-','DL00012','4','待出仓'],
    ['ZPCD-20260625-001','配载计划A','WB-20260625002','KH00018','下单成功','已生成代理单','DL00018','1','已找货'],
    ['20260624-终配001','配载计划B','WB-20260624003','KH00026','下单成功','已生成代理单','DL00026','2','可出仓'],
    ['ZPCD-20260622-001','配载计划B','WB-20260622004','KH00031','下单成功','已生成代理单','DL00031','4','已出仓'],
    ['ZPCD-20260620-003','配载计划C','WB-20260620005','KH00044','下单成功','已生成代理单','DL00044','3','已出仓'],
    ['ZPCD-20260619-002','配载计划C','WB-20260619006','KH00050','下单成功','已生成代理单','DL00050','2','待配柜'],
    ['ZPCD-20260618-001','配载计划D','WB-20260618007','KH00057','下单成功','已生成代理单','DL00057','4','已配柜'],
    ['ZPCD-20260617-004','配载计划D','WB-20260617008','KH00062','下单成功','已生成代理单','DL00062','3','已配柜'],
    ['ZPCD-20260616-003','配载计划E','WB-20260616009','KH00068','下单成功','已生成代理单','DL00068','6','已配柜'],
    ['ZPCD-20260615-002','配载计划E','WB-20260615010','KH00073','下单成功','已生成代理单','DL00073','5','已配柜']
],[
    {label:'出库单号',type:'text'},
    {label:'运单号',type:'text'},
    {label:'客户单号',type:'text'},
    {label:'下单状态',type:'select',options:['待下单','下单成功','下单失败']},
    {label:'状态',type:'select',options:['待出仓','已找货','可出仓','已出仓','待配柜','已配柜']}
]);
addPrototypeTable('wh-parcel-out','小包出库单','出库单号|出库计划|运单号|客户单号|下单状态|下单结果信息|代理单号|总件数|状态|操作',['待出仓','已找货','可出仓','已出仓','待配柜','已配柜'],[
    ['XKCD-20260625-002','小包计划A','WB-20260625011','KH00041','待下单','-','PL00041','5','待出仓'],
    ['XKCD-20260625-001','小包计划A','WB-20260625012','KH00047','下单成功','已生成代理单','PL00047','3','已找货'],
    ['XKCD-20260624-003','小包计划A','WB-20260624013','KH00052','下单成功','已生成代理单','PL00052','2','可出仓'],
    ['XKCD-20260623-002','小包计划B','WB-20260623014','KH00058','下单成功','已生成代理单','PL00058','4','已出仓'],
    ['XKCD-20260622-001','小包计划B','WB-20260622015','KH00063','下单成功','已生成代理单','PL00063','1','已出仓'],
    ['XKCD-20260621-003','小包计划C','WB-20260621016','KH00067','下单成功','已生成代理单','PL00067','2','待配柜'],
    ['XKCD-20260620-002','小包计划C','WB-20260620017','KH00071','下单成功','已生成代理单','PL00071','3','已配柜'],
    ['XKCD-20260619-001','小包计划D','WB-20260619018','KH00075','下单成功','已生成代理单','PL00075','4','已配柜'],
    ['XKCD-20260618-004','小包计划D','WB-20260618019','KH00080','下单成功','已生成代理单','PL00080','2','已配柜'],
    ['XKCD-20260617-003','小包计划E','WB-20260617020','KH00085','下单成功','已生成代理单','PL00085','5','已配柜']
],[
    {label:'出库单号',type:'text'},
    {label:'运单号',type:'text'},
    {label:'客户单号',type:'text'},
    {label:'下单状态',type:'select',options:['待下单','下单成功','下单失败']},
    {label:'状态',type:'select',options:['待出仓','已找货','可出仓','已出仓','待配柜','已配柜']}
]);

addPrototypeTable('wh-final-alloc','配舱计划','配舱单号|标签编号|提单号|国家|柜号|配柜状态|配舱状态|票数|运输方式|件数|收货实重|收货方数|操作',['待出仓','已找货','可出仓','已出仓','待配柜','已配柜'],[
    ['ZPCD-20260625-002','260625-2','TD-20260625-002','塞内加尔','','已配柜','可出仓','2','海运','4','4','0.000004'],
    ['ZPCD-20260625-001','260625-1','TD-20260625-001','尼日利亚','','已配柜','已找货','1','海运','1','1','0.000001'],
    ['20260624-终配001','260624-1','TD-20260624-001','加纳','GH-20260624-001','已配柜','已出仓','1','海运','2','2','0.000002'],
    ['ZPCD-20260622-001','260622-2','TD-20260622-001','塞内加尔','GH-20260622-001','已配柜','已出仓','2','海运','4','4','0.000004'],
    ['ZPCD-20260620-001','260620-1','TD-20260620-001','尼日利亚','','待配柜','待出仓','1','海运','3','3','0.000003']
],[
    {label:'配舱单号',type:'text'},
    {label:'提单号',type:'text'},
    {label:'国家',type:'select',options:['塞内加尔','尼日利亚','加纳','科特迪瓦','喀麦隆','多哥']},
    {label:'运输类型',type:'select',options:['海运','空运','卡航','快递']},
    {label:'所属仓库',type:'select',options:['广州南沙仓','深圳坂田仓','上海洋山仓','东莞虎门仓']}
]);
(function(){
    var c=TC['wh-final-alloc'];
    if(!c)return;
    c.statusMatch=function(row,tab,headers){
        var i1=headers.indexOf('配柜状态');
        var i2=headers.indexOf('配舱状态');
        return (i1>=0&&row[i1]===tab)||(i2>=0&&row[i2]===tab);
    };
    c.statusBadgeCols=['配柜状态','配舱状态'];
    c.summaryFooter=['票数','件数','收货实重','收货方数'];
})();
addPrototypeTable('wh-sort-bag','分拣装袋管理','袋号|件数|重量(KG)|体积(CBM)|产品|货物类型|目的仓库|最大限重(KG)|最大体积限制|装袋时间|装袋操作人|状态|操作',['进行中','已完成','已打印'],[
    ['BAG-20260613001','12','62.50','0.567','西非海运专线','敏感货','拉各斯仓','80','1.00','2026-06-13 14:20','张志伟','已打印'],
    ['BAG-20260613002','8','48.00','0.240','西非海运专线','普货','达喀尔仓','60','0.80','2026-06-13 15:05','李慧敏','已完成'],
    ['BAG-20260613003','15','71.50','1.050','西非海运专线','普货','阿比让仓','80','1.50','2026-06-13 16:18','陈志远','已打印'],
    ['BAG-20260613004','6','35.20','0.126','西非海运专线','普货','洛美仓','50','0.50','2026-06-13 17:30','王明辉','已完成'],
    ['BAG-20260613005','10','55.00','0.473','西非空运专线','普货','杜阿拉仓','60','1.20','2026-06-14 09:15','张志伟','进行中']
],[
    {label:'袋号',type:'text',field:'bagNo'},
    {label:'产品',type:'select',field:'product',options:['西非海运专线','西非空运专线']},
    {label:'货物类型',type:'select',field:'cargoType',options:['普货','敏感货']},
    {label:'目的仓库',type:'select',field:'warehouse',options:['拉各斯仓','达喀尔仓','阿比让仓','洛美仓','杜阿拉仓']},
    {label:'装袋操作人',type:'text',field:'operator'},
    {label:'状态',type:'select',field:'status',options:['进行中','已完成','已打印']}
]);

/* ============= 客服 (cs) L1 ============= */
(function(){
    const CS_ISSUE_TYPES=['运单拦截','问题件-超大','问题件-超长','问题件-超围长','问题件-超重','退件/少件扣件','查验扣件','签收地址错','未提取','客户要求暂扣'];
    const CS_PRODUCTS=['u22专线','美森FBA卡派特价','美森正班FBA卡派特价','美国UPS私-卡派-导弹专用','美国UPS卡派-导弹专用','美国UPS快递-导弹专用','尾程美国UPS私-卡派-导弹专用'];
    const rows=[
        ['运单拦截','2026-06-24 12:37:26','处理中','12121212121','','ICBU00000600587','','TX00134','坂田东华','u22专线',''],
        ['问题件-超大','2025-10-07 17:56:57','处理中','测试撤销退件','','ICBU00000600522','','TX00134','坂田东华','美森FBA卡派特价',''],
        ['退件/少件扣件','2025-09-25 14:29:53','已退件','test','','ICBU00000600457','','TX00136','shuy','美森正班FBA卡派特价','签入产生'],
        ['问题件-超长','2025-09-25 14:29:53','已放行','运单已产生退件,未完结问题件...','','ICBU00000600457','','TX00136','shuy','美森正班FBA卡派特价',''],
        ['查验扣件','2025-09-25 14:29:53','已放行','运单已产生退件,未完结问题件...','','ICBU00000600457','','TX00136','shuy','美森正班FBA卡派特价',''],
        ['签收地址错','2025-09-25 14:29:53','已放行','运单已产生退件,未完结问题件...','','ICBU00000600457','','TX00136','shuy','美森正班FBA卡派特价',''],
        ['运单拦截','2025-09-12 14:04:03','未处理','运单拦截,生成拦截问题件','','ICBU00000600441','','TX00136','shuy','美森正班FBA卡派特价',''],
        ['未提取','2025-09-10 15:58:00','未处理','请注意：产生 未提取 类型的海...','','ICBU00000600424','','TX00131','北京未来科技有限公司','尾程美国UPS私-卡派-导弹专用',''],
        ['客户要求暂扣','2025-09-09 16:13:27','已放行','ceshi','','ICBU00000600388','','TX00005','爱国者导弹公司','美国UPS快递-导弹专用',''],
        ['客户要求暂扣','2025-09-03 10:35:19','未处理','客户要求暂扣,生成暂扣问题件','','ICBU00000600393','','TX00132','','美国UPS卡派-导弹专用',''],
        ['客户要求暂扣','2025-09-02 18:00:17','未处理','客户要求暂扣,生成暂扣问题件','','ICBU00000600393','','TX00132','','美国UPS卡派-导弹专用',''],
        ['问题件-超大','','未处理','','','ICBU00000600406','','TX00132','','美国UPS卡派-导弹专用','签入产生'],
        ['问题件-超大','','未处理','','','ICBU00000600405','','TX00132','','美国UPS卡派-导弹专用','签入产生'],
        ['问题件-超大','','未处理','','','ICBU00000600404','','TX00132','','美国UPS卡派-导弹专用','签入产生'],
        ['客户要求暂扣','2025-08-23 15:02:37','未处理','客户要求暂扣,生成暂扣问题件','','ICBU00000600388','','TX00005','爱国者导弹公司','美国UPS快递-导弹专用',''],
        ['问题件-超大','2025-08-22 17:51:24','已放行','运单问题放行','','ICBU00000600395','','TX00124','马克贸易有限公司','美国UPS卡派-导弹专用','签入产生'],
        ['问题件-超大','2025-08-22 17:48:07','已放行','运单问题放行','','ICBU00000600394','','TX00124','马克贸易有限公司','美国UPS卡派-导弹专用','签入产生'],
        ['问题件-超大','2025-08-22 17:41:17','已放行','运单问题放行','','ICBU00000600393','','TX00132','','美国UPS卡派-导弹专用','签入产生'],
        ['问题件-超围长','2025-09-05 15:09:35','已放行','运单已产生退件,未完结问题件...','','ICBU00000600392','','TX00132','','美国UPS卡派-导弹专用','签入产生'],
        ['问题件-超重','2025-09-05 15:09:35','已放行','运单已产生退件,未完结问题件...','','ICBU00000600392','','TX00132','','美国UPS卡派-导弹专用','签入产生']
    ];
    const d=rows.map(function(r,i){return [String(i+1)].concat(r).concat(['']);});
    addPrototypeTable('cs-issue-track','问题件跟踪',
        '序号|问题类型名称|最新响应时间|问题状态|最新响应内容|运单状态|运单号|客户单号|客户代码|客户名称|销售产品|问题备注|操作',
        ['未处理','处理中','已放行','已退件'],d,
        [
            {label:'运单号',type:'text',field:'wbNo'},
            {label:'问题件类型',type:'select',field:'issueType',options:CS_ISSUE_TYPES},
            {label:'客户名称',type:'text',field:'custName'},
            {label:'销售产品',type:'select',field:'salesProduct',options:CS_PRODUCTS}
        ]
    );
})();
/* 时间轴记录：key=运单号；图中 ICBU00000600587 详细复刻，其余按问题类型生成 1 条简记录 */
var _CS_ISSUE_RECORDS={
    'ICBU00000600587':[
        {time:'2026-06-24 12:37:26',type:'客服反馈',content:'12121212121'},
        {time:'2025-10-17 14:40:34',type:'代客户反馈',content:'周一早'},
        {time:'2025-10-17 14:39:18',type:'放行',content:'哈哈哈'},
        {time:'2025-10-15 15:35:16',type:'代客户反馈',content:'代客户反馈'},
        {time:'2025-10-15 15:33:04',type:'客服反馈',content:'客服反馈'},
        {time:'2025-09-22 19:18:06',type:'客服回复',content:'123123'},
        {time:'2025-09-22 11:40:20',type:'客服反馈',content:'运单拦截,生成拦截问题件'}
    ]
};
function csIssueRecordsOf(wbNo,fallbackType,fallbackTime,fallbackContent){
    if(_CS_ISSUE_RECORDS[wbNo])return _CS_ISSUE_RECORDS[wbNo];
    const list=[];
    if(fallbackTime){list.push({time:fallbackTime,type:fallbackType||'客服反馈',content:fallbackContent||'问题件创建'});}
    return list;
}

/* 轨迹查询 / 轨迹维护 placeholder（菜单占位） */
addPrototypeTable('cs-track-query','轨迹查询','序号|运单号|物流单号|当前状态|最新轨迹|更新时间|操作',[],[
    ['1','WB-20260613001','1Z999AA10123456784','派送中','已到达派送站','2026-06-13 14:30',''],
    ['2','WB-20260612002','SF1234567890123','已签收','客户已签收','2026-06-12 18:00','']
],[{label:'运单号',type:'text'},{label:'物流单号',type:'text'}]);
TC['cs-track-maint']={t:'轨迹维护',pageMode:'trackMaintain',h:[],s:[],d:[]};
TC['cs-issue-type']={t:'问题件类型',forceLocalHeader:true,readonlyList:true,h:['问题件类型编号','问题件类型名称','问题件处理模板','区域类型','备注','启用状态','创建时间','创建员工编号','修改时间','修改员工编号','操作'],s:['启用','禁用'],d:[
['WTJ_PS','破损','货物存在破损','头程问题件','破损备注2','启用','2026-06-27 17:55:31','天地总部管理员','2026-06-30 20:10:06','天地总部管理员'],
['KXYH','开箱验货','开箱验货','头程问题件','系统内置问题件类型-请勿删除','启用','2026-06-10 15:40:42','HYD-开发者','2026-07-07 16:20:36','天地总部管理员'],
['TXWTJLX','测试问题类型','测试问题类型内容','海外问题件','测试备注','启用','2026-03-16 17:22:02','HYD-开发者','2026-07-07 10:26:54','屈鑫']]};
TC['cs-issue-type'].q=[{label:'问题件类型名称',type:'text'},{label:'区域类型',type:'select',options:['头程问题件','海外问题件']},{label:'启用状态',type:'select',options:['启用','禁用']}];

// ========== OMS 客户端 - 查询小屏 ==========
addPrototypeTable('oms-wb-query','运单查询','运单号|物流单号|起运港|目的港|运输方式|当前状态|预计到达|操作',['运输中','已到港','已签收'],[
    ['WB-20260613001','SF10086523','深圳盐田港','达喀尔港','海运','运输中','2026-07-08',''],
    ['WB-20260613002','YT98876543','广州白云机场','拉各斯机场','空运','已到港','2026-06-21',''],
    ['WB-20260613003','JD30088991','上海洋山港','蒙巴萨港','海运','运输中','2026-07-15',''],
    ['WB-20260612008','SF10080112','深圳盐田港','阿比让港','海运','已签收','2026-06-15',''],
    ['WB-20260612012','EMS99005566','北京首都机场','阿布贾机场','空运','运输中','2026-06-26',''],
    ['WB-20260611055','JD30077812','深圳盐田港','洛美港','海运','已到港','2026-06-22',''],
    ['WB-20260611066','SF10075588','上海浦东机场','开罗机场','空运','已签收','2026-06-14',''],
    ['WB-20260610099','YT98855221','广州南沙港','杜阿拉港','海运','运输中','2026-07-10','']
],[
    {label:'运单号',type:'text'},
    {label:'物流单号',type:'text'},
    {label:'状态',type:'select',options:['运输中','已到港','已签收']}
]);

addPrototypeTable('oms-track-query','轨迹查询','运单号|轨迹节点|节点时间|地点|备注',[],[
    ['WB-20260613001','已揽收','2026-06-13 09:15','深圳盐田港','已完成报关'],
    ['WB-20260613001','已装船','2026-06-15 18:30','深圳盐田港','船名 COSCO STAR / 航次 0612W'],
    ['WB-20260613001','在途中','2026-06-18 12:00','南海海域','正常航行'],
    ['WB-20260613001','在途中','2026-06-25 08:00','印度洋','正常航行'],
    ['WB-20260613001','预计到港','2026-07-08 10:00','达喀尔港','—'],
    ['WB-20260613002','已揽收','2026-06-15 14:20','广州白云机场','—'],
    ['WB-20260613002','已起飞','2026-06-17 23:50','广州→拉各斯','航班 KQ887'],
    ['WB-20260613002','已到港','2026-06-21 06:15','拉各斯机场','等待清关'],
    ['WB-20260612008','已揽收','2026-06-02 10:30','深圳盐田港','—'],
    ['WB-20260612008','已装船','2026-06-04 16:00','深圳盐田港','船名 MSC SARAH'],
    ['WB-20260612008','已到港','2026-06-13 09:40','阿比让港','—'],
    ['WB-20260612008','已签收','2026-06-15 14:25','阿比让仓','客户签收人：MOUSSA']
],[{label:'运单号',type:'text'}]);

addPrototypeTable('cfg-label-template','标签模板','标签模板编号|标签模板名称|标签模板类型|文件类型|下载地址|所属总部编号|启用状态|备注|创建时间|创建人|更新时间|操作',['启用','禁用'],[
    ['W2606001','通用标签','无单入库标签','标签模板','https://hyd-tms.oss-cn-shenzhen.aliyuncs.com/label/W2606001.jrxml','业务中台','启用','','2026-06-04 15:55:33','HYD-开发者','',''],
    ['A2606001','华洋达客户提单','客户提单','标签模板','https://hyd-tms.oss-cn-shenzhen.aliyuncs.com/label/A2606001.jrxml','业务中台','启用','','2026-06-02 09:35:30','HYD-开发者','2026-06-05 10:20:00',''],
    ['12','12','运单标签','标签模板','https://hyd-tms.oss-cn-shenzhen.aliyuncs.com/label/12.jrxml','业务中台','启用','','2026-05-12 15:10:47','HYD-开发者','2026-05-15 09:00:00',''],
    ['S2602006','标签模版001','运单标签','标签模板','https://hyd-tms.oss-cn-shenzhen.aliyuncs.com/label/S2602006.jrxml','业务中台','启用','','2026-04-01 10:29:27','HYD-开发者','2026-04-10 14:30:00',''],
    ['S2602005','S2602005','运单标签','标签模板','https://hyd-tms.oss-cn-shenzhen.aliyuncs.com/label/S2602005.jrxml','业务中台','启用','','2026-04-01 10:14:30','HYD-开发者','2026-04-09 17:37:34',''],
    ['S2602004','标签模版003','运单标签','标签模板','https://hyd-tms.oss-cn-shenzhen.aliyuncs.com/label/S2602004.jrxml','业务中台','启用','','2026-04-01 10:10:03','HYD-开发者','','']
],[
    {label:'模板名称',type:'text'},
    {label:'模板类型',type:'select',options:['无单入库标签','客户提单','运单标签']},
    {label:'启用状态',type:'select',options:['启用','禁用']}
]);

addPrototypeTable('cfg-coding-rule','编码规则管理','规则编号|存储值|注释|前缀类型|前缀参数|后缀类型|后缀参数|生成规则|规则长度|忽略数字|操作',[],[
    ['CK_NO','56','出库计划单号生成规则,使用默认生成类','fixed','CK','','','%p%n','5',''],
    ['KDD_NO','61','快递单号生成规则,使用默认生成类','fixed','KDD','','','%p%n','5',''],
    ['A_P_NO','52','海外仓配舱全包价编码生成规则,使用默认生成类','fixed','H','','','%p%n','5',''],
    ['TEST_NO','1','测试编码生成规则,使用默认生成类','fixed','D','','','%p%n','5',''],
    ['OPP_NO','3','比重优惠编号生成规则,使用默认生成类','fixed','PH','','','%p%n','4',''],
    ['OW_NO','3','重量段编号生成规则,使用默认生成类','fixed','WT','','','%p%n','4',''],
    ['OPA_NO','3','分区方案编号生成规则,使用默认生成类','fixed','PA','','','%p%n','4',''],
    ['SUP_NO','1','杂费包编号生成规则,使用默认生成类','fixed','ZF','','','%p%n','4',''],
    ['SP_NO','1','审批单号生成规则,使用默认生成类','fixed','SP','date','yyMM','%p%s%n','5',''],
    ['GD_SP_NO','1','改单申请单号生成规则,使用默认生成类','fixed','A','date','yyMM','%p%s%n','5',''],
    ['YW_OP_NO','1','业务员成本报价编码生成规则,使用默认生成类','fixed','A','','','%p%n','5',''],
    ['XS_OP_NO','1','销售报价编码生成规则,使用默认生成类','fixed','B','','','%p%n','5',''],
    ['GB_OP_NO','1','公布报价编码生成规则,使用默认生成类','fixed','C','','','%p%n','5',''],
    ['VH_RG_NO','1','车辆登记号生成规则,使用默认生成类','date','MMdd','','','%p-%n','5',''],
    ['PZ_OP_NO','1','凭证编号单号生成规则,使用默认生成类','','','date','yyMM','%s%n','6',''],
    ['OPAA_NO','1','分区编号生成规则,使用默认生成类','fixed','PAA','','','%p%n','4',''],
    ['TD_NO','1','海外卡派总单号生成规则,使用默认生成类','fixed','KP','date','yyMM','%p%s%n','5',''],
    ['CU_NO','1','客户代码生成规则,使用默认生成类','fixed','TX','','','%p%n','5',''],
    ['MW_NO','1','移仓单管理生成规则,使用默认生成类','fixed','YC','date','yyMM','%p%s%n','5',''],
    ['ZD_SP_NO','1','制单申请单号生成规则,使用默认生成类','fixed','ZD','date','yyMM','%p%s%n','5',''],
    ['YD_SP_NO','1','运单申请号生成规则,使用默认生成类','fixed','YD','date','yyMM','%p%s%n','5',''],
    ['DL_OP_NO','2','代理报价编码生成规则,使用默认生成类','fixed','D','','','%p%n','5','']
],[
    {label:'规则编号',type:'text',field:'ruleNo'},
    {label:'注释',type:'text',field:'remark'},
    {label:'前缀类型',type:'select',field:'prefixType',options:['fixed','date']},
    {label:'前缀参数',type:'text',field:'prefixParam'},
    {label:'后缀类型',type:'select',field:'suffixType',options:['fixed','date']},
    {label:'后缀参数',type:'text',field:'suffixParam'},
    {label:'生成规则',type:'text',field:'genRule'},
    {label:'规则长度',type:'text',field:'ruleLength'}
]);

const FCL_QUERY_STATUS=['草稿','待审核','已审核','已订仓','已放仓','已装柜','已开船','已完成','异常'];
const FCL_CONTAINER_OPTIONS=['20GP','40GP','40HQ','45HQ'];
const FCL_POL_OPTIONS=['深圳盐田','广州南沙','上海洋山','宁波舟山','青岛港'];
const FCL_POD_OPTIONS=['拉各斯','达喀尔','阿比让','特马','杜阿拉','洛美','科托努'];
const FCL_CURRENCY_OPTIONS=['USD','CNY','EUR','XOF','NGN'];
const FCL_CUSTOMER_OPTIONS=['深圳市华运达国际货运','广州远洋进出口贸易','东莞市鑫海物流','上海锦程国际贸易'];
const FCL_BRANCH_OPTIONS=['深圳分公司','广州分公司','上海分公司','义乌分公司'];
const FCL_PRICE_QUERY=[
    {label:'柜型',type:'select',options:FCL_CONTAINER_OPTIONS},
    {label:'始发港',type:'select',options:FCL_POL_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},
    {label:'开始日期',type:'date'},
    {label:'结束日期',type:'date'},
    {label:'使用客户',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'使用分公司',type:'select',options:FCL_BRANCH_OPTIONS}
];
const FCL_BUSINESS_COST_QUERY=[
    {label:'业务成本编号',type:'text'},
    {label:'使用航司',type:'select',options:['MAERSK','COSCO','CMA CGM','MSC','ONE']},
    {label:'使用分公司',type:'select',options:FCL_BRANCH_OPTIONS},
    {label:'使用业务员',type:'select',options:['张三','李四','王报价','李业务']},
    {label:'加价类型',type:'select',options:['百分比','总价']},
    {label:'开始时间',type:'date'},
    {label:'结束时间',type:'date'}
];
const FCL_SALES_PRICE_QUERY=[
    {label:'销售变化',type:'text'},
    {label:'使用航司',type:'select',options:['MAERSK','COSCO','CMA CGM','MSC','ONE']},
    {label:'使用客户',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'加价类型',type:'select',options:['百分比','总价']},
    {label:'开始时间',type:'date'},
    {label:'结束时间',type:'date'}
];
addPrototypeTable('fcl-quote','整柜报价','报价编号|报价名称|柜型|始发港|目的港|币别|开始日期|结束日期|使用客户|使用分公司|报价字段|成本价|附加费|加价金额|报价金额|价格说明|报价人|状态|操作',['草稿','待审核','已生效','已失效'],[
    ['FQ-20260613001','西非40HQ整柜报价','40HQ','深圳盐田','拉各斯','USD','2026-06-13','2026-06-30','深圳市华运达国际货运','深圳分公司','海运费+附加费+加价','4120','180','200','4500','附加费包含在报价内，适用西非线','王报价','已生效'],
    ['FQ-20260612002','达喀尔20GP整柜报价','20GP','广州南沙','达喀尔','USD','2026-06-12','2026-06-25','广州远洋进出口贸易','广州分公司','海运费+文件费+THC','2460','120','100','2680','含本地文件费和码头附加费','王报价','待审核']
],FCL_PRICE_QUERY);
addPrototypeTable('fcl-cost-price','成本价','成本编号|柜型|始发港|目的港|船公司|航司|币别|开始日期|结束日期|成本价|业务成本|使用分公司|状态|操作',['待生效','已生效','已失效'],[
    ['FCP-20260613001','40HQ','深圳盐田','拉各斯','MAERSK','MAERSK','USD','2026-06-13','2026-06-30','4120','4180','深圳分公司','已生效'],
    ['FCP-20260612002','20GP','广州南沙','达喀尔','COSCO','COSCO','USD','2026-06-12','2026-06-25','2460','2580','广州分公司','已生效']
],FCL_PRICE_QUERY);
addPrototypeTable('fcl-business-cost','业务成本价','业务成本编号|使用航司|使用分公司|使用业务员|加价类型|加价金额|开始时间|结束时间|操作',['启用','停用'],[
    ['FBC-20260613001','MAERSK','深圳分公司','张三','总价','200','2026-06-13','2026-06-30'],
    ['FBC-20260612002','COSCO','广州分公司','李四','百分比','5%','2026-06-12','2026-06-25']
],FCL_BUSINESS_COST_QUERY);
addPrototypeTable('fcl-sales-price','业务销售价','销售变化|使用航司|使用客户|加价类型|加价金额|开始时间|结束时间|操作',['启用','停用'],[
    ['FSP-20260613001','MAERSK','深圳市华运达国际货运','总价','320','2026-06-13','2026-06-30'],
    ['FSP-20260612002','COSCO','广州远洋进出口贸易','百分比','8%','2026-06-12','2026-06-25']
],FCL_SALES_PRICE_QUERY);
addPrototypeTable('fcl-surcharge','附加费维护','附加费编号|费用名称|柜型|始发港|目的港|币别|收费方式|金额|开始日期|结束日期|是否包含报价|状态|操作',['启用','停用'],[
    ['FSC-20260613001','码头附加费','40HQ','深圳盐田','拉各斯','USD','按柜','120','2026-06-13','2026-06-30','是','启用'],
    ['FSC-20260612002','文件费','20GP','广州南沙','达喀尔','USD','按票','80','2026-06-12','2026-06-25','是','启用']
],FCL_PRICE_QUERY);
addPrototypeTable('fcl-markup','加价维护','加价编号|业务成本|使用客户|使用分公司|柜型|始发港|目的港|币别|加价类型|加价金额|开始日期|结束日期|状态|操作',['启用','停用'],[
    ['FMK-20260613001','FBC-20260613001 / USD 4180','深圳市华运达国际货运','深圳分公司','40HQ','深圳盐田','拉各斯','USD','总价','200','2026-06-13','2026-06-30','启用'],
    ['FMK-20260612002','FBC-20260612002 / USD 2580','广州远洋进出口贸易','广州分公司','20GP','广州南沙','达喀尔','USD','百分比','5%','2026-06-12','2026-06-25','启用']
],FCL_PRICE_QUERY);
addPrototypeTable('fcl-trial-calc','整柜试算-客户','柜型|始发港|目的港|币别|开始日期|结束日期|价格说明|附加费|报价总额',['试算中','已生成报价','已失效'],[
    ['20GP','广州南沙','达喀尔','USD','2026-06-12','2026-06-25','含附加费，未含保险','120','2680'],
    ['40HQ','深圳盐田','拉各斯','USD','2026-06-13','2026-06-30','试算结果可复制生成报价','180','4500'],
    ['40HQ','上海洋山','阿比让','USD','2026-06-15','2026-06-28','船司促销价，附加费已包含','150','4720']
],[]);
addPrototypeTable('fcl-trial-calc-biz','整柜试算-业务','柜型|始发港|目的港|币别|开始日期|结束日期|价格说明|附加费|报价总额',['试算中','已生成报价','已失效'],[
    ['20GP','广州南沙','达喀尔','USD','2026-06-12','2026-06-25','业务成本口径试算，含基础附加费','80','2520'],
    ['40HQ','深圳盐田','拉各斯','USD','2026-06-13','2026-06-30','按业务成本价和业务员加价规则试算','120','4300'],
    ['40HQ','上海洋山','阿比让','USD','2026-06-15','2026-06-28','业务成本低价方案，未含特殊附加费','100','4560']
],[]);
addPrototypeTable('fcl-carrier-route','航司路线配置','配置编号|航司|路线代码|始发港|目的港|中转港|运输方式|航程(天)|启用状态|操作',['启用','停用'],[
    ['FCR-20260613001','MAERSK','MSK-WAF-01','深圳盐田','拉各斯','新加坡','海运','32','启用'],
    ['FCR-20260612002','COSCO','COS-WAF-02','广州南沙','达喀尔','直达','海运','29','启用']
],[
    {label:'航司',type:'select',options:['MAERSK','COSCO','CMA CGM','MSC','ONE']},
    {label:'路线代码',type:'text'},
    {label:'始发港',type:'select',options:FCL_POL_OPTIONS},
    {label:'目的港',type:'select',options:FCL_POD_OPTIONS},
    {label:'启用状态',type:'select',options:['启用','停用']}
]);
addPrototypeTable('fcl-customer-audit','客户建档审核','审核单号|客户代码|客户名称|客户类型|业务员|提交时间|审核人|审核时间|审核状态|操作',['待审核','已通过','已驳回'],[
    ['FCA-20260613001','C10001','深圳市华运达国际货运','直客','张三','2026-06-13 09:10','陈七','','待审核'],
    ['FCA-20260612002','C10002','广州远洋进出口贸易','同行','李四','2026-06-12 14:20','周八','2026-06-12 15:00','已通过']
]);
addPrototypeTable('fcl-sales-instruction','销售指示','销售指示号|客户名称|托书编号|柜型柜量|起运港|目的港|预计开船日|销售运费|成本价|业务员|状态|操作',FCL_QUERY_STATUS,[
    ['FSI-20260613001','深圳市华运达国际货运','BOOK-001','40HQ×1','深圳盐田','拉各斯','2026-06-20','USD 4,500','USD 4,120','张三','待审核'],
    ['FSI-20260612002','广州远洋进出口贸易','BOOK-002','20GP×2','广州南沙','达喀尔','2026-06-22','USD 5,600','USD 5,180','李四','已审核']
]);
addPrototypeTable('fcl-inquiry-order','业务询盘单管理','询盘单号|客户名称|柜型|始发港|目的港|币别|预计开船日|询盘价格|备注|状态|操作',['待报价','已报价','已转化','已关闭'],[
    ['FIQ-20260613001','深圳市华运达国际货运','40HQ','深圳盐田','拉各斯','USD','2026-06-20','4500','客户要求本周内反馈西非线报价','已报价'],
    ['FIQ-20260612002','广州远洋进出口贸易','20GP','广州南沙','达喀尔','USD','2026-06-22','2680','已转化草稿/预录单，等待客户确认','已转化']
],FCL_PRICE_QUERY);
addPrototypeTable('fcl-draft-preorder','草稿/预录单','预录单号|来源询盘单|客户名称|柜型|始发港|目的港|币别|报价金额|创建人|创建时间|状态|操作',['草稿','预录单','已转订单','已取消'],[
    ['FDP-20260613001','FIQ-20260613001','深圳市华运达国际货运','40HQ','深圳盐田','拉各斯','USD','4500','张三','2026-06-13 10:30','预录单'],
    ['FDP-20260612002','FIQ-20260612002','广州远洋进出口贸易','20GP','广州南沙','达喀尔','USD','2680','李四','2026-06-12 16:00','已转订单']
],FCL_PRICE_QUERY);
addPrototypeTable('fcl-booking-order','订舱单管理','订舱单号|订单号|预录单号|船公司|柜型|始发港|目的港|ETD|订舱状态|备注|操作',['待订舱','订舱失败','已订舱','取消订舱'],[
    ['FBO-20260613001','FO-20260613001','FDP-20260613001','MAERSK','40HQ','深圳盐田','拉各斯','2026-06-20','待订舱','订舱录入时从订单管理选择订单'],
    ['FBO-20260612002','FO-20260612002','FDP-20260612002','COSCO','20GP','广州南沙','达喀尔','2026-06-22','已订舱','船司已确认']
]);
addPrototypeTable('fcl-order','订单管理','订单号|客户名称|订舱单号|柜型|始发港|目的港|币别|销售价|业务成本|毛利|订单状态|操作',['待订舱','已订舱','待补料','已放舱'],[
    ['FO-20260613001','深圳市华运达国际货运','FBO-20260613001','40HQ','深圳盐田','拉各斯','USD','4500','4180','320','待订舱'],
    ['FO-20260612002','广州远洋进出口贸易','FBO-20260612002','20GP','广州南沙','达喀尔','USD','2680','2580','100','已订舱']
]);
addPrototypeTable('fcl-actual-order-entry','实际录单','实单号|订单号|客户名称|提单号|柜号|航司|柜型|始发港|目的港|绑定客户实单|提单费用状态|重算状态|状态|操作',['待绑定','已绑定','已重算','已确认'],[
    ['FAO-20260613001','FO-20260613001','深圳市华运达国际货运','HLHLA260613001','MSKU1234567','MAERSK','40HQ','深圳盐田','拉各斯','已绑定','待重算','正常','已绑定'],
    ['FAO-20260612002','FO-20260612002','广州远洋进出口贸易','HLHDK260612002','COSU7654321','COSCO','20GP','广州南沙','达喀尔','未绑定','未计算','需重算','待绑定']
],[
    {label:'订单号',type:'select',options:['FO-20260613001','FO-20260612002']},
    {label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},
    {label:'提单号',type:'text'},
    {label:'航司',type:'select',options:['MAERSK','COSCO','CMA CGM','MSC','ONE']},
    {label:'状态',type:'select',options:['待绑定','已绑定','已重算','已确认']}
]);
TC['fcl-actual-order-entry'].modalExcludedFields=['绑定客户实单','提单费用状态','重算状态','状态'];
addPrototypeTable('fcl-booking','订仓作业','订仓单号|销售指示号|船司|航线|柜型柜量|ETD|截补料时间|订仓方式|订仓员|订仓状态|操作',['待订仓','已订仓','订仓失败','取消订仓'],[
    ['FBK-20260613001','FSI-20260613001','MAERSK','西非线','40HQ×1','2026-06-20','2026-06-17 12:00','EDI','刘订仓','待订仓'],
    ['FBK-20260612002','FSI-20260612002','COSCO','西非线','20GP×2','2026-06-22','2026-06-18 18:00','官网','赵订仓','已订仓']
]);
addPrototypeTable('fcl-release','放仓作业','放仓单号|订仓单号|船司|订舱号|柜型柜量|放仓时间|放仓附件|处理人|状态|操作',['待放仓','已放仓','需跟进'],[
    ['FRL-20260613001','FBK-20260613001','MAERSK','MAEU985633','40HQ×1','2026-06-13 11:00','release_001.pdf','刘订仓','待放仓'],
    ['FRL-20260612002','FBK-20260612002','COSCO','COSU778812','20GP×2','2026-06-12 16:10','release_002.pdf','赵订仓','已放仓']
]);
addPrototypeTable('fcl-truck','拖车安排','拖车单号|订仓单号|提柜地点|装柜地点|还柜地点|拖车公司|预约时间|司机电话|状态|操作',['待安排','已安排','已完成','异常'],[
    ['FTR-20260613001','FBK-20260613001','盐田堆场','深圳客户仓','盐田码头','鹏程拖车','2026-06-18 09:00','13800138001','已安排'],
    ['FTR-20260612002','FBK-20260612002','南沙堆场','广州客户仓','南沙码头','南沙拖车','2026-06-19 08:30','13900139002','待安排']
]);
addPrototypeTable('fcl-load','进仓装柜','装柜单号|订仓单号|柜号|封号|装柜地点|装柜件数|毛重(KG)|装柜时间|操作人|状态|操作',['待装柜','装柜中','已装柜','异常'],[
    ['FLD-20260613001','FBK-20260613001','MSKU1234567','S00123','深圳客户仓','680','18500','2026-06-18 13:00','陈工','待装柜'],
    ['FLD-20260612002','FBK-20260612002','COSU7654321','C00888','广州客户仓','520','14200','2026-06-19 14:00','王工','已装柜']
]);
addPrototypeTable('fcl-si-bl','补料与提单','补料单号|订仓单号|提单号|客户实单|提单费用状态|MBL/HBL|收货人|通知人|补料截止|草稿件状态|客户确认状态|操作',['待补料','已补料','草稿确认中','已确认'],[
    ['FSI-BL-001','FBK-20260613001','HLHLA260613001','已绑定','待重算','HBL','Lagos Import Ltd','Same as consignee','2026-06-17 12:00','待生成','待确认'],
    ['FSI-BL-002','FBK-20260612002','HLHDK260612002','已绑定','已计算','MBL','Dakar Trading','Dakar Notify','2026-06-18 18:00','已生成','已确认']
]);
addPrototypeTable('fcl-customs','报关申报','报关单号|订仓单号|柜号|报关方式|报关行|申报时间|放行时间|资料状态|报关状态|操作',['待申报','已申报','已放行','异常'],[
    ['FCD-20260613001','FBK-20260613001','MSKU1234567','买单报关','深圳报关行','2026-06-18 15:00','','资料待补','待申报'],
    ['FCD-20260612002','FBK-20260612002','COSU7654321','客户抬头','广州报关行','2026-06-19 16:20','2026-06-19 20:10','资料齐全','已放行']
]);
addPrototypeTable('fcl-sailing-track','开船与轨迹','轨迹单号|订仓单号|船名航次|ETD|ATD|ETA|当前节点|异常预警|更新时间|状态|操作',['未开船','已开船','在途','已到港','异常'],[
    ['FTK-20260613001','FBK-20260613001','MAERSK LAGOS 026W','2026-06-20','','2026-07-18','待开船','无','2026-06-13 14:30','未开船'],
    ['FTK-20260601008','FBK-20260601008','COSCO AFRICA 118W','2026-06-05','2026-06-05 23:10','2026-07-02','海上运输','塞港预警','2026-06-13 08:20','在途']
]);
addPrototypeTable('fcl-doc-send','寄单作业','寄单单号|提单号|客户名称|寄单方式|快递单号|寄出时间|签收时间|寄单人|状态|操作',['待寄单','已寄出','已签收','异常'],[
    ['FDS-20260613001','HLHLA260613001','深圳市华运达国际货运','顺丰','SF778899001','','','陈七','待寄单'],
    ['FDS-20260612002','HLHDK260612002','广州远洋进出口贸易','DHL','DHL123456','2026-06-12 17:30','','周八','已寄出']
]);
addPrototypeTable('fcl-actual-bill-import','实际账单导入','导入批次号|导入模版|船公司|账单月份|币别|导入金额|匹配成功数|差异数|导入人|导入时间|状态|操作',['待导入','已导入','部分匹配','导入失败'],[
    ['FBI-20260613001','船公司账单导入模板.xlsx','MAERSK','2026-06','USD','4120','18','2','张财务','2026-06-13 15:20','部分匹配'],
    ['FBI-20260612002','船公司账单导入模板.xlsx','COSCO','2026-06','USD','5180','21','0','张财务','2026-06-12 17:40','已导入']
]);
addPrototypeTable('fcl-bill-entry','实际费用管理','账单编号|订单号|服务商|费用类型|柜型|币别|费用金额|账单日期|录入人|状态|操作',['草稿','待确认','已确认','已作废'],[
    ['FBE-20260613001','FO-20260613001','MAERSK','海运费','40HQ','USD','4120','2026-06-13','张财务','待确认'],
    ['FBE-20260612002','FO-20260612002','COSCO','文件费','20GP','USD','80','2026-06-12','张财务','已确认']
]);
TC['fcl-bill-entry'].modalExcludedFields=['柜型','录入人','状态'];
TC['fcl-bill-entry'].fieldOptions={'服务商':['MAERSK','COSCO','CMA CGM','MSC','ONE','中外运','德迅','嘉里物流']};
addPrototypeTable('fcl-carrier-bill-compare','船公司账单对比','对比单号|船公司|账单编号|订单号|系统应付|船司账单|差异金额|差异原因|申诉状态|标记状态|状态|操作',['无差异','有差异','申诉中','已处理'],[
    ['FCMP-20260613001','MAERSK','FBE-20260613001','FO-20260613001','4120','4200','80','船司附加费多计','待申诉','已标记','有差异'],
    ['FCMP-20260612002','COSCO','FBE-20260612002','FO-20260612002','5180','5180','0','账单一致','无需申诉','未标记','无差异']
],[
    {label:'对比单号',type:'text'},
    {label:'船公司',type:'select',options:['MAERSK','COSCO','MSC','CMA CGM']},
    {label:'账单编号',type:'text'},
    {label:'订单号',type:'text'},
    {label:'申诉状态',type:'select',options:['无需申诉','待申诉','申诉中','申诉成功','申诉失败']},
    {label:'标记状态',type:'select',options:['未标记','已标记','重点跟进']},
    {label:'状态',type:'select',options:['无差异','有差异','申诉中','已处理']}
]);
addPrototypeTable('fcl-bill','整柜应付账单','应付账单号|提单号|订舱单号|服务商|应付金额|币别|账单状态|创建时间|操作',['待确认','已确认','已对账','已付款'],[
    ['FCB-20260613001','HLHLA260613001','FBK-20260613001','MAERSK','4120','USD','待确认','2026-06-13 15:00'],
    ['FCB-20260612002','HLHDK260612002','FBK-20260612002','COSCO','5180','USD','已确认','2026-06-12 18:10']
]);
addPrototypeTable('fcl-payment','应付管理','付款单号|账单号|服务商|付款方式|付款金额|币别|申请人|审批人|付款状态|操作',['待审批','待付款','已付款','已驳回'],[
    ['FPY-20260613001','FCB-20260613001','MAERSK','票结','4120','USD','张财务','财务主管','待审批'],
    ['FPY-20260612002','FCB-20260612002','COSCO','月结','5180','USD','张财务','财务主管','已付款']
]);
TC['fcl-payment'].modalExcludedFields=['申请人','审批人','付款状态'];
addPrototypeTable('fcl-ar-release','应收管理','放单单号|账单号|客户名称|应收金额|已收金额|待收金额|放单方式|放单人|放单状态|操作',['待收款','部分收款','允许放单','已放单'],[
    ['FAR-20260613001','FCB-20260613001','深圳市华运达国际货运','4500','0','4500','电放','陈七','待收款'],
    ['FAR-20260612002','FCB-20260612002','广州远洋进出口贸易','5600','5600','0','正本寄单','周八','已放单']
]);
TC['fcl-ar-release'].modalExcludedFields=['放单人','放单状态'];
addPrototypeTable('fcl-bank-flow','银行流水管理','流水号|交易日期|收付类型|银行账户|对方户名|金额|币别|关联单号|匹配状态|备注|操作',['待匹配','已匹配','已生成'],[
    ['BF-20260613001','2026-06-13','收款','招商银行 6225****8888','深圳市华运达国际货运','4500.00','USD','FAR-20260613001','已匹配','客户回款'],
    ['BF-20260612002','2026-06-12','付款','中国银行 4563****1234','MAERSK','4120.00','USD','FPY-20260612002','待匹配','船司海运费']
],[
    {label:'流水号',type:'text'},
    {label:'收付类型',type:'select',options:['收款','付款']},
    {label:'银行账户',type:'text'},
    {label:'对方户名',type:'text'},
    {label:'匹配状态',type:'select',options:['待匹配','已匹配','已生成']},
    {label:'交易日期',type:'date'}
]);
addPrototypeTable('fcl-commission','业绩与提成','提成单号|订仓单号|业务员|客户名称|毛利|提成比例|提成金额|币别|核算月份|状态|操作',['待核算','已核算','已发放'],[
    ['FCM-20260613001','FBK-20260613001','张三','深圳市华运达国际货运','380','8%','30.40','USD','2026-06','待核算'],
    ['FCM-20260612002','FBK-20260612002','李四','广州远洋进出口贸易','420','8%','33.60','USD','2026-06','已核算']
]);
addPrototypeTable('fcl-rule','关键业务规则','规则编号|规则名称|规则类型|适用环节|规则内容|优先级|启用状态|创建人|创建时间|操作',['启用','禁用'],[
    ['FCR-001','预定仓不产生费用','订仓规则','订仓作业','预定仓不生成应付费用且无需财务审核','1','启用','admin','2026-06-09'],
    ['FCR-002','放单需核销应收','财务规则','应收与放单','待收金额为0后允许放单','2','启用','admin','2026-06-09']
]);
addPrototypeTable('fcl-provider-api','服务商API配置','服务代码|服务名称|船期线路请求地址|订舱请求地址|补料请求地址|轨迹请求地址|API秘钥|授权账号|授权密码|启用状态|备注|操作',['启用','停用'],[
    ['MAERSK-FCL','马士基整柜接口','https://api.maersk.example/schedule','https://api.maersk.example/booking','https://api.maersk.example/si','https://api.maersk.example/track','MAK-******-2026','maersk_api','******','启用','支持船期线路、订舱、补料和轨迹同步'],
    ['COSCO-FCL','中远海运整柜接口','https://api.cosco.example/schedule','https://api.cosco.example/booking','https://api.cosco.example/si','https://api.cosco.example/track','COS-******-2026','cosco_api','******','启用','支持整柜全流程接口']
],[
    {label:'服务代码',type:'text'},
    {label:'服务名称',type:'text'},
    {label:'启用状态',type:'select',options:['启用','停用']}
]);
addPrototypeTable('fcl-edi-api','EDI/API对接','接口编号|接口名称|对接对象|业务环节|接口类型|最近同步时间|失败次数|启用状态|操作',['启用','停用','异常'],[
    ['EDI-001','船公司订仓推送','MAERSK','订仓作业','EDI','2026-06-13 12:00','0','启用'],
    ['API-002','船期轨迹抓取','COSCO','开船与轨迹','API','2026-06-13 13:20','1','异常']
]);
addPrototypeTable('fcl-exception','异常处理','异常单号|关联单号|异常类型|异常环节|异常描述|当前处理人|处理时限|创建时间|状态|操作',['待处理','处理中','已关闭'],[
    ['FEX-20260613001','FBK-20260613001','订仓失败','订仓作业','船司系统返回舱位不足','刘订仓','2026-06-13 18:00','2026-06-13 11:30','处理中'],
    ['FEX-20260612002','FCD-20260612002','报关异常','报关申报','HS CODE 与资料不一致','报关员','2026-06-12 20:00','2026-06-12 15:30','已关闭']
]);
addPrototypeTable('fcl-sla-kpi','SLA与KPI','指标编号|指标名称|适用环节|目标值|当前值|责任角色|统计周期|预警状态|操作',['正常','预警','超时'],[
    ['KPI-001','订仓及时率','订仓作业','95%','92%','订仓员','本月','预警'],
    ['KPI-002','补料准时率','补料与提单','98%','99%','单证员','本月','正常']
]);
TC['wh-transfer-in'].readonlyList=true;
TC['wh-pack-rule'].readonlyList=true;
TC['wh-cargo-search'].readonlyList=true;
TC['wh-replenish-drop'].readonlyList=true;
['wh-transfer-in','wh-transfer-out','wh-transfer-fee','wh-pack-rule','wh-cargo-search','wh-out-scan','wh-replenish-drop','fcl-provider-api','fcl-trial-calc','fcl-trial-calc-biz','fcl-booking-order','fcl-order'].forEach(function(id){
    if(TC[id])TC[id].noAutoAudit=true;
});
TC['wh-transfer-fee'].modalExcludedFields=['费用单号','运单号','计费对象','币别','来源仓库','目标仓库','审核状态','费用名称'];
TC['fcl-markup'].fieldOptions=Object.assign({},TC['fcl-markup'].fieldOptions||{},{
    '业务成本':['FBC-20260613001 / USD 4180','FBC-20260612002 / USD 2580','FBC-20260611003 / USD 3960'],
    '加价类型':['百分比','总价']
});
TC['fcl-draft-preorder'].fieldOptions=Object.assign({},TC['fcl-draft-preorder'].fieldOptions||{},{
    '来源询盘单':['FIQ-20260613001','FIQ-20260612002','FIQ-20260611003']
});
TC['fcl-booking-order'].fieldOptions=Object.assign({},TC['fcl-booking-order'].fieldOptions||{},{
    '预录单号':['FDP-20260613001','FDP-20260612002','FDP-20260611003'],
    '船公司':['MAERSK','COSCO','MSC','CMA CGM','Hapag-Lloyd']
});
TC['fcl-trial-calc'].q=[];
TC['fcl-trial-calc'].pageMode='fclTrialCalc';
TC['fcl-trial-calc-biz'].q=[];
TC['fcl-trial-calc-biz'].pageMode='fclTrialCalc';
TC['pda-app']={t:'仓库PDA',pageMode:'warehousePda',h:[],q:[],s:[],d:[]};
TC['wb-manage'].forceLocalHeader=true;
TC['wb-manage'].readonlyList=true;
TC['prod-manage'].forceLocalHeader=true;
TC['prod-surcharge'].forceLocalHeader=true;
TC['prod-surcharge'].noExpand=true;   /* 首列已改为附加费名称，不再按编码自动扩充演示行 */
TC['prod-price-lcl'].forceLocalHeader=true;
TC['prod-inquiry-quote']={
    t:'询价报价',
    h:['所属港口','运输方式','货物类型','英文货物类型','类型编码','计算系数','内部备注','所属仓库','收货模式','结算方式','杂费','运输时效','操作'],
    s:[],
    d:[['深圳盐田','海运','普货','General Cargo','GC','1:500','客户要求优先走西非海运渠道','深圳盐田仓','送仓','月结','USD 35/票','28-35天']]
};
TC['prod-inquiry-quote'].entryFields=[
    {label:'所属港口',type:'select',required:true,options:['深圳盐田','广州南沙','上海洋山','宁波舟山','达喀尔','拉各斯']},
    {label:'运输方式',type:'select',required:true,options:['海运','空运','铁路','快递']},
    {label:'货物类型',type:'select',required:true,options:['普货','敏感货','危险品','带电货']},
    {label:'英文货物类型',required:true,value:'General Cargo'},
    {label:'类型编码',required:true,value:'GC'},
    {label:'计算系数',required:true,value:'1:500'},
    {label:'所属仓库',type:'select',required:true,options:['深圳盐田仓','广州南沙仓','上海浦东仓','义乌仓']},
    {label:'收货模式',type:'select',required:true,options:['送仓','上门提货','客户自送','海外自提']},
    {label:'结算方式',type:'select',required:true,options:['月结','票结','到付','预付']},
    {label:'杂费',value:'USD 35/票'},
    {label:'运输时效',value:'28-35天'},
    {label:'内部备注',type:'textarea',rows:4,span:'md:col-span-4',value:'客户要求优先走西非海运渠道，报价需同步记录杂费和有效期。'}
];
TC['prod-inquiry-quote'].pageMode='inquiryQuoteEntry';
TC['prod-inquiry-quote'].forceLocalHeader=true;
/* 银行凭证 / 收款管理：在「汇率」后插入「本位币」列，金额列改本位币口径 */
['fin-bank-voucher','fin-ar-receipt'].forEach(function(tid){
    var c=TC[tid];
    if(!c||!c.h)return;
    ['总金额','已使用金额','未使用金额'].forEach(function(n){
        var k=c.h.indexOf(n+'(人民币)');
        if(k>=0)c.h[k]=n+'(本位币)';
    });
    var i=c.h.indexOf('汇率');
    if(i<0||c.h.indexOf('本位币')>=0)return;
    c.h.splice(i+1,0,'本位币');
    (c.d||[]).forEach(function(r){r.splice(i+1,0,'人民币');});
});
if(TC['wb-manage']){
    const siteIdx=TC['wb-manage'].h.indexOf('所属网点');
    if(siteIdx<0){
        const insertAt=2;
        TC['wb-manage'].h.splice(insertAt,0,'所属网点');
        const sites=['深圳分公司','广州分公司','深圳分公司','广州分公司','上海分公司'];
        TC['wb-manage'].d.forEach(function(row,idx){row.splice(insertAt,0,sites[idx%sites.length]);});
    }
    ['所属业务员','所属客服','所属操作'].forEach(function(hd){
        if(!TC['wb-manage'].h.includes(hd)){
            const opIdx=TC['wb-manage'].h.indexOf('操作');
            TC['wb-manage'].h.splice(opIdx>=0?opIdx:TC['wb-manage'].h.length,0,hd);
            TC['wb-manage'].d.forEach(function(row){row.splice(opIdx>=0?opIdx:row.length,0,'—');});
        }
    });
}
TC['fin-ar-fee']={
    t:'费用入账',
    h:['客户代码','所属业务员','运单号','费用类型','快递单号','品名','付款方式','出货渠道','件数','重量','收费重量','体积','收费体积','重量单价','立方单价','运费原价','折扣价','运费','运费CNY','国内段运费','国外段运费','成本','利润','箱号','实装柜号','起运港','目的港','下的时间','操作'],
    s:[],
    d:[
        ['C10001','李华','WB20260522001','运费','SF10086523','电子产品','月结','西非海运专线','10','250.50','260.00','1.800','1.900','USD 6.50','USD 220.00','USD 2,045.00','USD 1,920.00','USD 1,920.00','CNY 13,910.40','CNY 1,200.00','USD 1,754.40','USD 1,420.00','USD 500.00','BX-001','HLH-CNTR-001','深圳盐田','达喀尔','2026-05-22 09:30'],
        ['C10002','张伟','WB20260522002','附加费','JD88910231','服装配件','预付','西非空运专线','6','72.00','78.00','0.284','0.300','USD 8.20','USD 260.00','USD 717.60','USD 690.00','USD 690.00','CNY 4,999.80','CNY 680.00','USD 596.15','USD 510.00','USD 180.00','BX-002','HLH-CNTR-002','广州白云','拉各斯','2026-05-22 10:15'],
        ['C10003','陈浩','WB20260522003','报关费','KY66001882','五金工具','到付','西非海运专线','4','96.00','100.00','0.224','0.250','USD 5.80','USD 210.00','USD 632.50','USD 600.00','USD 600.00','CNY 4,347.00','CNY 520.00','USD 524.65','USD 450.00','USD 150.00','BX-003','HLH-CNTR-003','宁波舟山','阿比让','2026-05-22 11:20'],
        ['C10004','刘洋','WB20260522004','仓储费','DB55421890','家居用品','月结','中东海运专线','12','310.00','320.00','2.100','2.180','USD 5.20','USD 185.00','USD 2,066.00','USD 1,980.00','USD 1,980.00','CNY 14,345.10','CNY 1,360.00','USD 1,792.35','USD 1,530.00','USD 450.00','BX-004','HLH-CNTR-004','上海洋山','迪拜','2026-05-22 14:05']
    ],
    q:[
        {label:'客户代码',type:'text',field:'custCode'},
        {label:'运单号',type:'text',field:'wbNo'},
        {label:'费用类型',type:'select',field:'feeType',options:['运费','附加费','报关费','仓储费','文件费','其他']},
        {label:'快递单号',type:'text',field:'expressNo'},
        {label:'品名',type:'text',field:'cargoName'},
        {label:'下的时间',type:'date',field:'orderTime'}
    ],
    forceLocalHeader:true
};
if(TC['fin-fee-mgmt']){
    const _feeMgmtColumns=[
        {label:'客户代码',src:'客户代码'},
        {label:'所属业务员',src:'所属业务员'},
        {label:'运单号',src:'运单号'},
        {label:'快递单号',src:'快递单号'},
        {label:'提单号',mock:['BL-20260522-001','BL-20260522-002','BL-20260522-003','BL-20260522-004']},
        {label:'柜号',src:'实装柜号'},
        {label:'付款方式',src:'付款方式'},
        {label:'出货渠道',src:'出货渠道'},
        {label:'货物类型',mock:['普货','普货','敏感货','普货']},
        {label:'件数',src:'件数'},
        {label:'重量',src:'重量'},
        {label:'收费重量',src:'收费重量'},
        {label:'体积',src:'体积'},
        {label:'收费体积',src:'收费体积'},
        {label:'应收费用',src:'运费CNY'},
        {label:'成本',src:'成本'},
        {label:'利润',src:'利润'},
        {label:'国内仓库',src:'起运港',valMap:{'深圳盐田':'深圳盐田仓','广州白云':'广州白云仓','宁波舟山':'宁波舟山仓','上海洋山':'上海洋山仓'}},
        {label:'目的仓库',src:'目的港',valMap:{'达喀尔':'达喀尔海外仓','拉各斯':'拉各斯海外仓','阿比让':'阿比让海外仓','迪拜':'迪拜海外仓'}},
        {label:'下的时间',src:'下的时间'}
    ];
    const _feeMgmtSrcHeaders=TC['fin-ar-fee'].h.slice(0,-1);
    TC['fin-fee-mgmt'].h=_feeMgmtColumns.map(function(c){return c.label;}).concat(['是否调整','重算标识','操作审核','海外确认','财务审核','操作']);
    TC['fin-fee-mgmt'].d=TC['fin-ar-fee'].d.map(function(row,idx){
        const statuses=[
            ['已审核','已确认','待审核'],
            ['待审核','待确认','待审核'],
            ['已审核','待确认','已审核'],
            ['待审核','待确认','待审核']
        ][idx%4];
        const adjusted=idx%3===2?'是':'否';
        const filtered=_feeMgmtColumns.map(function(col){
            if(col.mock)return col.mock[idx%col.mock.length];
            const srcIdx=_feeMgmtSrcHeaders.indexOf(col.src);
            const v=srcIdx>=0?row[srcIdx]:'';
            if(col.valMap)return col.valMap[v]||v;
            return v;
        });
        return filtered.concat([adjusted,adjusted==='是'?'不重算':'正常重算'],statuses);
    });
    TC['fin-fee-mgmt'].q=[
        {label:'客户代码',type:'text',field:'custCode'},
        {label:'运单号',type:'text',field:'wbNo'},
        {label:'快递单号',type:'text',field:'expressNo'},
        {label:'下的时间',type:'date',field:'orderTime'},
        {label:'是否调整',type:'select',field:'adjusted',options:['是','否']},
        {label:'重算标识',type:'select',field:'recalcFlag',options:['正常重算','不重算']},
        {label:'操作审核',type:'select',field:'opAudit',options:['待审核','已审核','已驳回']},
        {label:'海外确认',type:'select',field:'overseasConfirm',options:['待确认','已确认','已驳回']},
        {label:'财务审核',type:'select',field:'financeAudit',options:['待审核','已审核','已驳回']}
    ];
    TC['fin-fee-mgmt'].s=[];
    TC['fin-fee-mgmt'].forceLocalHeader=true;
}
TC['fin-bill-mgmt']={
    t:'账单管理',
    h:['应收账单号','账单名称','提单号','客户名称','币别','金额','已核销金额','待核销金额','操作'],
    s:[],
    d:[
        ['RB202606001','西非海运五月账单','BL-HLH-202606001','深圳市华运达国际货运','CNY','13,910.40','3,000.00','10,910.40'],
        ['RB202606002','空运费用汇总账单','BL-HLH-202606002','广州远洋进出口贸易','CNY','4,999.80','1,500.00','3,499.80'],
        ['RB202606003','阿比让海运账单','BL-HLH-202606003','佛山恒通货运代理','CNY','4,347.00','0.00','4,347.00'],
        ['RB202606004','中东海运综合账单','BL-HLH-202606004','东莞市鑫海物流','CNY','14,345.10','6,000.00','8,345.10']
    ],
    q:[
        {label:'应收账单号',type:'text',field:'billNo'},
        {label:'账单名称',type:'text',field:'billName'},
        {label:'提单号',type:'text',field:'blNo'},
        {label:'客户名称',type:'text',field:'customer'},
        {label:'币别',type:'select',field:'currency',options:['CNY','USD','EUR']}
    ],
    forceLocalHeader:true
};
