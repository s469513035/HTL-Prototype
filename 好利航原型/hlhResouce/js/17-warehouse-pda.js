function findMenuNodeById(list,targetId){
    var arr=list||[];
    for(var i=0;i<arr.length;i++){
        if(arr[i].id===targetId)return arr[i];
        if(arr[i].children){
            var r=findMenuNodeById(arr[i].children,targetId);
            if(r)return r;
        }
    }
    return null;
}

function warehousePdaTaskItems(){
    const domesticMenu=findMenuNodeById(menuData,'warehouse');
    const descriptions={
        'wh-in-one':'扫码收货、称重、长宽高录入',
        'wh-in-multi':'多件尺寸维护、子单收货、托盘绑定',
        'wh-headless':'无头件登记、拍照上传',
        'wh-transfer-in':'调拨到仓扫码确认入库',
        'wh-transfer-out':'调拨离仓扫码确认出库',
        'wh-cargo-search':'现场查货、定位货区和托盘',
        'wh-out-scan':'出库扫描和子单出库复核',
        'wh-replenish-drop':'补货、落货确认',
        'wh-air-bag':'空运装袋封袋和袋号扫描',
        'pda-waybill-query':'移动端运单查询和详情查看',
        'pda-work-order':'蓝鲸风格工单处理、SLA和流转跟进'
    };
    const hiddenForPda={'wh-no-pre-in':true,'wh-issue':true,'wh-transfer-fee':true,'wh-pack-rule':true,'wh-scan-out':true,'wh-pallet-mgmt':true,'wh-preload':true,'wh-air-sort':true,'wh-air-pack':true,'wh-air-arrival-scan':true,'wh-air-sort-scan':true,'wh-air-checkin-sort-scan':true,'wh-air-checkout-scan':true,'wh-loading-list':true,'wh-parcel-out':true,'wh-in-multi':true};
    const labelOverrides={'wh-headless':'无头件登记'};
    const items=[];
    function collect(children){
        (children||[]).forEach(function(child){
            if(child.children){
                collect(child.children);
                return;
            }
            if(child.page==='wh-domestic'&&child.tab&&!hiddenForPda[child.tab]){
                items.push([child.tab,labelOverrides[child.tab]||child.label,descriptions[child.tab]||'国内仓库现场作业入口']);
            }
        });
    }
    collect(domesticMenu&&domesticMenu.children);
    items.unshift(['pda-waybill-query','运单查询',descriptions['pda-waybill-query']]);
    items.push(['pda-pallet-bind','仓库上托','运单子单号扫码绑定托盘和库位库区']);
    items.push(['pda-receive-check','收货复核','按指令复核运单尺寸、重量并拍照存证']);
    items.push(['pda-pallet-adjust','调整托盘','换托/下托（整票/单个），扫码与库位库区维护']);
    items.push(['pda-bag-adjust','调整装袋','添加/移出运单，维护袋号与库位库区']);
    items.push(['pda-find-scan','找货扫描','按配舱号扫描托盘出仓核对']);
    items.push(['pda-load-scan','装柜扫描','按配舱号扫描托盘装柜核对']);
    items.push(['pda-load-finish','装柜完成','装柜完成后上传柜照片与提交']);
    items.push(['pda-sort-scan','分拣扫描','按装袋规则扫描运单装袋']);
    return items;
}

function refreshWarehousePdaPrototype(){
    const main=document.getElementById('main-content');
    if(main){
        main.innerHTML=generateWarehousePdaPage('pda-app');
        applyRuntimeEnhancements(main);
    }
}

function openWarehousePdaTask(taskId){
    _warehousePdaTaskId=taskId||'';
    _warehousePdaView='workbench';
    refreshWarehousePdaPrototype();
}

function closeWarehousePdaTask(){
    if(_warehousePdaTaskId==='pda-find-scan'&&_pdaFindScanView==='operate'){
        _pdaFindScanView='list';
        _pdaFindScanCurrent=null;
        refreshWarehousePdaPrototype();
        return;
    }
    if(_warehousePdaTaskId==='wh-transfer-out'&&_pdaTransferOutView==='operate'){
        _pdaTransferOutView='list';
        _pdaTransferOutCurrent=null;
        refreshWarehousePdaPrototype();
        return;
    }
    if(_warehousePdaTaskId==='pda-load-scan'&&_pdaLoadScanView==='operate'){
        _pdaLoadScanView='list';
        _pdaLoadScanCurrent=null;
        refreshWarehousePdaPrototype();
        return;
    }
    if(_warehousePdaTaskId==='wh-cargo-search'&&_pdaCargoSearchView==='detail'){
        _pdaCargoSearchView='list';
        _pdaCargoSearchCurrent=null;
        refreshWarehousePdaPrototype();
        return;
    }
    if(_warehousePdaTaskId==='pda-receive-check'&&_pdaReceiveCheckView==='operate'){
        _pdaReceiveCheckView='list';
        _pdaReceiveCheckCurrent=null;
        refreshWarehousePdaPrototype();
        return;
    }
    _warehousePdaTaskId='';
    _warehousePdaView='workbench';
    refreshWarehousePdaPrototype();
}

function openWarehousePdaView(view){
    _warehousePdaTaskId='';
    _warehousePdaView=view||'workbench';
    refreshWarehousePdaPrototype();
}

function loginWarehousePda(){
    _warehousePdaLoggedIn=true;
    _warehousePdaTaskId='';
    _warehousePdaView='workbench';
    refreshWarehousePdaPrototype();
    showToast(tr('登录成功'));
}

function logoutWarehousePda(){
    _warehousePdaLoggedIn=false;
    _warehousePdaTaskId='';
    _warehousePdaView='login';
    refreshWarehousePdaPrototype();
}

function pdaListRecord(no,status,lines){
    return {no:no,status:status,lines:lines||[]};
}

function warehousePdaOperationConfigs(){
    const wh=getWarehouseNameOptions();
    const zones=['A区-01','A区-02','B区-重货','C区-异常'];
    const customers=['东莞市鑫海物流','上海锦程国际贸易','广州远航贸易'];
    const staff=['李仓管','王海波','陈志远'];
    const transport=['空运','海运','卡航','快递'];
    return {
        'pda-waybill-query':{
            title:'运单查询',subtitle:'移动端查询运单基础信息和查看详情',
            records:[pdaListRecord('WB-20260613001','已入仓',['物流单号：SF10086523','客户代码：CUS-001','销售产品：西非海运普货','件数：8']),pdaListRecord('WB-20260613002','待出库',['物流单号：YT98876543','客户代码：CUS-002','销售产品：空运敏感货','件数：3'])],
            primary:'查看详情',secondary:['查询数据']
        },
        'wh-in-one':{
            title:'手动入仓',subtitle:'单票单件移动收货，支持扫码、称重和尺寸录入',scanLabel:'运单号/物流单号',
            sections:[
                {title:'收货信息',fields:[
                    {label:'运单号',type:'scan',value:'WB-20260613001',required:true,cols:6},
                    {label:'目的仓库',value:'拉各斯海外仓',readonly:true,cols:3},
                    {label:'运输方式',value:'海运',readonly:true,cols:3},
                    {label:'预报件数',value:'8',readonly:true,cols:2},
                    {label:'到货件数',value:'0',readonly:true,cols:2},
                    {label:'剩余最大到货件数',value:'8',readonly:true,cols:2},
                    {label:'货物类型',type:'select',options:['普货','敏感货'],cols:6}
                ]},
                {title:'附加服务',type:'service'},
                {title:'尺寸明细',type:'sizeTable',rows:[{qty:'1',l:'48',w:'36',h:'30',weight:'12.5'}]},
                {title:'货区托盘',fields:[
                    {label:'到货货区',type:'select',options:zones},
                    {label:'托盘号',value:''}
                ]}
            ],
            photos:true,photoLimit:5,primary:'保存入仓',sameRowActions:true
        },
        'wh-in-multi':{
            title:'入仓操作（一票多件）',subtitle:'多件货物逐件收货，支持同步生成运单和货物明细复核',scanLabel:'运单号/物流单号',
            sections:[
                {title:'基础信息',fields:[{label:'运单号',type:'scan',value:'WB-20260613008',required:true},{label:'勾选同步生成运单',type:'checkbox',checked:true},{label:'到货仓库',type:'select',options:wh,required:true},{label:'到货时间',type:'datetime-local',value:'2026-06-13T15:00',required:true},{label:'运输方式',type:'select',options:transport,required:true}]},
                {title:'货物明细',fields:[{label:'品名',value:'手机配件',required:true,placeholder:'输入品名信息带出大类'},{label:'品名大类',value:'带电产品'},{label:'长(CM)',type:'number',value:'55',required:true},{label:'宽(CM)',type:'number',value:'42',required:true},{label:'高(CM)',type:'number',value:'38',required:true},{label:'重量(KG)',type:'number',value:'18.4',required:true},{label:'附加服务',type:'checkbox',checked:true}]}
            ],
            servicePanel:true,
            records:[pdaListRecord('WB-20260613008','已收货',['快递单号：SF10020001','件数：3','尺寸：55*42*38 CM','重量：18.4 KG']),pdaListRecord('WB-20260613008','待收货',['快递单号：SF10020002','件数：2','等待扫码复核'])],
            recordsTitle:'收货明细',
            primary:'确认收货'
        },
        'wh-headless':{
            title:'无头件登记',subtitle:'现场登记无法识别订单的到货，保留图片和仓库位置',scanLabel:'物流单号',
            sections:[{title:'登记信息',fields:[{label:'物流单号',type:'scan',value:'JD30088991'},{label:'货区',type:'select',options:zones,required:true},{label:'入仓件数',type:'number',value:'3',required:true},{label:'备注说明',type:'textarea',value:'外箱无客户唛头，等待客户认领'}]}],
            photos:true,photoLimit:5,primary:'保存'
        },
        'pda-pallet-bind':{
            title:'仓库上托',subtitle:'运单子单号扫码绑定托盘和库位库区',primary:'确认上托'
        },
        'pda-receive-check':{
            title:'收货复核',subtitle:'按指令扫描运单子单号复核尺寸、重量并拍照',primary:'收货复核完成'
        },
        'pda-pallet-adjust':{
            title:'调整托盘',subtitle:'换托或下托（整票/单个），扫码后维护库位库区',primary:'确认调整'
        },
        'pda-bag-adjust':{
            title:'调整装袋',subtitle:'添加或移出运单，扫码后维护袋号与库位库区',primary:'确认调整'
        },
        'pda-find-scan':{
            title:'找货扫描',subtitle:'按配舱号扫描托盘，最后一托扫完自动转可出仓',primary:'提交'
        },
        'pda-load-scan':{
            title:'装柜扫描',subtitle:'按配舱号扫描托盘装柜核对',primary:'提交'
        },
        'pda-load-finish':{
            title:'装柜完成',subtitle:'装柜完成提交柜照片和件数',primary:'装柜完成'
        },
        'pda-sort-scan':{
            title:'分拣扫描',subtitle:'按装袋规则扫描运单装袋',primary:'完成装袋'
        },
        'wh-no-pre-in':{
            title:'无头件认领',subtitle:'查看无头件图片并认领客户，生成预录单',scanLabel:'无头单号/物流单号',
            sections:[{title:'认领信息',fields:[{label:'所属客户',type:'select',options:customers,required:true},{label:'所属业务员',type:'select',options:staff,required:true},{label:'品名',value:'鞋材',required:true},{label:'入库件数',type:'number',value:'3',required:true}]}],
            photos:true,
            records:[pdaListRecord('HT-20260613001','待认领',['到货仓库：广州南沙仓','物流单号：JD30088991','图片：3张']),pdaListRecord('HT-20260612005','已生成预录单',['客户：东莞市鑫海物流','品名：服装配件'])],
            primary:'生成预录单',secondary:['上传图片','认领']
        },
        'wh-transfer-in':{
            title:'调拨入库',subtitle:'按调拨单或按票扫码确认入库'
        },
        'wh-transfer-out':{
            title:'调拨出库',subtitle:'扫描运单形成调拨出库记录'
        },
        'wh-transfer-fee':{
            title:'调拨费用查询',subtitle:'移动端查询调拨费用和审核状态',scanLabel:'调拨单号/费用单号',
            records:[pdaListRecord('TF-20260613001','待审核',['调拨单号：TR-20260613001','费用名称：跨仓调拨费','金额：CNY 268.00']),pdaListRecord('TF-20260612003','已审核',['费用名称：装卸费','金额：CNY 80.00'])],
            primary:'审核费用',secondary:['查询']
        },
        'wh-scan-out':{
            title:'扫描出库',subtitle:'按运单、托盘或装箱单连续扫描出库',scanLabel:'运单号/托盘号/装箱单号',
            sections:[{title:'扫描信息',fields:[{label:'扫描单号',type:'scan',value:'WB-20260613009',required:true},{label:'出库仓库',type:'select',options:wh,required:true},{label:'出库口',type:'select',options:['1号口','2号口','空运口','海运口'],required:true},{label:'扫描件数',type:'number',value:'1',required:true}]}],
            records:[pdaListRecord('SO-20260613001','扫描中',['已扫：18件','待扫：2件','出库口：1号口'])],
            primary:'确认出库',secondary:['继续扫码']
        },
        'wh-out-scan':{
            title:'出库扫描',subtitle:'按运单号或客户单号查询后连续扫描子单出库',scanLabel:'运单号/客户单号',
            records:[pdaListRecord('WB-20260613001','待出库',['子单：SUB-20260613001-01','是否出库：否']),pdaListRecord('WB-20260613001','已出库',['子单：SUB-20260613001-02','是否出库：是'])],
            primary:'确认出库'
        },
        'wh-pallet-mgmt':{
            title:'上托管理',subtitle:'绑定托盘、货区和运单，复核件数重量',scanLabel:'托盘号/运单号',
            sections:[{title:'上托信息',fields:[{label:'托盘号',type:'scan',value:'PLT-GZ-018',required:true},{label:'到货仓库',type:'select',options:wh,required:true},{label:'货区',type:'select',options:zones,required:true},{label:'运单号',value:'WB-20260613011',required:true},{label:'件数',type:'number',value:'8',required:true},{label:'重量(KG)',type:'number',value:'96.2'}]}],
            records:[pdaListRecord('PLT-GZ-018','上托中',['已绑定运单：3票','件数：8','货区：A区-01'])],
            primary:'完成上托',secondary:['解绑','打印托盘标']
        },
        'wh-pack-rule':{
            title:'装箱单规则管理',subtitle:'移动端查看和启停装箱单规则',scanLabel:'规则编号/目的港',
            records:[pdaListRecord('RULE-001','启用',['适用产品：空运普货','目的港：LOS','规则：按航班+目的港合并']),pdaListRecord('RULE-002','停用',['适用产品：带电产品','规则：单独装箱'])],
            sections:[{title:'规则快速维护',fields:[{label:'规则名称',value:'空运目的港合并',required:true},{label:'目的港',value:'LOS',required:true},{label:'启用状态',type:'select',options:['启用','停用'],required:true}]}],
            primary:'保存规则',secondary:['启停规则']
        },
        'wh-cargo-search':{
            title:'查货管理',subtitle:'扫码定位货物所在仓库、货区、托盘和状态',scanLabel:'运单号/物流单号/托盘号',
            records:[pdaListRecord('WB-20260613012','在库',['仓库：广州南沙仓','货区：A区-01','托盘：PLT-GZ-018']),pdaListRecord('WB-20260612006','已出库',['出库时间：2026-06-12 18:22','操作人：李仓管'])],
            primary:'查询'
        },
        'wh-preload':{
            title:'预载单管理',subtitle:'移动端查看预载计划并执行扫描复核',scanLabel:'预载单号/运单号',
            records:[pdaListRecord('PRE-20260613001','待复核',['航班号：ET605','目的机场：ADD','件数：46']),pdaListRecord('PRE-20260613002','复核中',['航班号：TK073','已扫：28/35'])],
            primary:'开始复核',secondary:['生成装箱单']
        },
        'wh-replenish-drop':{
            title:'补货落货管理',subtitle:'现场确认补货、落货操作',scanLabel:'操作单号/运单号',
            sections:[{title:'操作信息',fields:[{label:'操作类型',type:'select',options:['补货','落货'],required:true},{label:'预载单号',type:'scan',value:'PRE-20260613001',required:true},{label:'件数',type:'number',value:'2',required:true},{label:'原因',type:'textarea',value:'客户要求调整航班'}]}],
            records:[pdaListRecord('RD-20260613001','待确认',['操作类型：落货','件数：2','责任人：陈志远'])],
            primary:'确认处理'
        },
        'wh-issue':{
            title:'问题件管理',subtitle:'登记库内/库外问题件并流转处理人',scanLabel:'运单号/物流单号',
            sections:[{title:'问题登记',fields:[{label:'问题件类型',type:'select',options:['库内问题件','库外问题件'],required:true},{label:'运单号',type:'scan',value:'WB-20260613015',required:true},{label:'所属仓库',type:'select',options:wh,required:true},{label:'当前处理人',type:'select',options:staff,required:true},{label:'问题描述',type:'textarea',value:'外箱破损，需要复核货损情况',required:true}]}],
            photos:true,
            records:[pdaListRecord('ISS-20260613001','处理中',['类型：库内问题件','处理人：陈志远','图片：2张'])],
            primary:'创建工单',secondary:['保存问题件','上传图片']
        },
        'wh-air-sort':{
            title:'空运分拣管理',subtitle:'按航班、目的机场和分拣区域执行空运分拣',scanLabel:'运单号/航班号',
            sections:[{title:'分拣信息',fields:[{label:'航班号',value:'ET605',required:true},{label:'目的机场',value:'ADD',required:true},{label:'分拣区域',type:'select',options:['空运A区','空运B区','异常区'],required:true},{label:'件数',type:'number',value:'6',required:true},{label:'重量(KG)',type:'number',value:'72.4'}]}],
            records:[pdaListRecord('SORT-20260613001','分拣中',['航班：ET605','目的机场：ADD','已分拣：32件'])],
            primary:'确认分拣',secondary:['继续扫码']
        },
        'wh-air-bag':{
            title:'空运装袋管理',subtitle:'扫描袋号、封袋并记录袋重',scanLabel:'袋号/分拣单号',
            sections:[{title:'装袋信息',fields:[{label:'袋号',type:'scan',value:'BAG-ET605-001',required:true},{label:'航班号',value:'ET605',required:true},{label:'目的机场',value:'ADD',required:true},{label:'袋内件数',type:'number',value:'18',required:true},{label:'袋重(KG)',type:'number',value:'215.6',required:true}]}],
            records:[pdaListRecord('BAG-ET605-001','待封袋',['袋内件数：18','袋重：215.6 KG'])],
            primary:'新增装袋',secondary:['扫码','确认封袋','打印袋标']
        },
        'wh-air-pack':{
            title:'空运装箱单管理',subtitle:'按袋号生成和确认空运装箱单',scanLabel:'装箱单号/袋号',
            records:[pdaListRecord('APL-20260613001','待生成',['袋号：BAG-ET605-001','航班：ET605','件数：18']),pdaListRecord('APL-20260612004','已确认',['目的机场：ADD','体积：2.18 CBM'])],
            sections:[{title:'装箱单信息',fields:[{label:'装箱单号',value:'APL-20260613001',required:true},{label:'航班号',value:'ET605',required:true},{label:'目的机场',value:'ADD',required:true},{label:'件数',type:'number',value:'18',required:true},{label:'重量(KG)',type:'number',value:'215.6'}]}],
            primary:'生成装箱单',secondary:['确认装箱单']
        },
        'pda-work-order-register':{
            title:'工单登记',subtitle:'扫码单号、登记客户和工单类型并上传图片',scanLabel:'单号',
            sections:[{title:'工单信息',fields:[
                {label:'单号',type:'scan',value:'WB-20260613001',required:true},
                {label:'所属客户',type:'select',options:customers,required:true},
                {label:'工单类型',type:'select',options:['异常处理','费用争议','资料补充','客户咨询'],required:true},
                {label:'备注',type:'textarea',placeholder:'请输入工单备注内容'}
            ]}],
            photos:true,photoLimit:5,primary:'保存'
        },
        'pda-air-checkin':{
            title:'空运签入',subtitle:'扫码单号、录入尺寸并拍照签入',scanLabel:'单号',
            sections:[{title:'签入信息',fields:[
                {label:'单号',type:'scan',value:'WB-AIR-260613001',required:true},
                {label:'长(CM)',type:'number',value:'48',required:true},
                {label:'宽(CM)',type:'number',value:'36',required:true},
                {label:'高(CM)',type:'number',value:'30',required:true}
            ]}],
            photos:true,photoLimit:5,primary:'保存'
        },
        'pda-air-bag-sort':{
            title:'空运签入分拣装袋管理',subtitle:'扫描袋号、单号，录入尺寸并拍照装袋',scanLabel:'袋号/单号',
            sections:[{title:'装袋信息',fields:[
                {label:'袋号',type:'scan',value:'BAG-ET605-001',required:true},
                {label:'单号',type:'scan',value:'WB-AIR-260613001',required:true},
                {label:'长(CM)',type:'number',value:'48',required:true},
                {label:'宽(CM)',type:'number',value:'36',required:true},
                {label:'高(CM)',type:'number',value:'30',required:true}
            ]}],
            photos:true,photoLimit:5,primary:'保存'
        },
        'pda-air-out-scan':{
            title:'空运出库扫描',subtitle:'扫描袋号、填写备注并拍照出库',scanLabel:'袋号',
            sections:[{title:'出库信息',fields:[
                {label:'袋号',type:'scan',value:'BAG-ET605-001',required:true},
                {label:'备注',type:'textarea',placeholder:'请输入出库备注内容'}
            ]}],
            photos:true,photoLimit:5,primary:'保存'
        }
    };
}

function warehousePdaOperationConfig(taskId){
    const configs=warehousePdaOperationConfigs();
    const tasks=warehousePdaTaskItems();
    const task=tasks.find(function(item){return item[0]===taskId;});
    return configs[taskId]||{title:task?task[1]:'仓库PDA',subtitle:task?task[2]:'国内仓库现场作业',scanLabel:'单号',records:[pdaListRecord('PDA-20260613001','待处理',['请按现场作业要求扫码处理'])],primary:'保存'};
}

function pdaAction(label){
    return "showToast('"+esc(tr(label))+"')";
}

function pdaServicePanel(open){
    const services=['是否报关','拆分报关','带磁','合并报关','带电','贴箱唛'];
    let h='<div class="rounded-xl border border-surface-200 bg-white p-3 mb-3">';
    h+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('附加服务')+'</div>';
    h+='<div class="grid grid-cols-3 gap-2">';
    services.forEach(function(name){
        h+='<label class="h-8 px-2 rounded-lg border border-surface-200 bg-surface-50 flex items-center gap-1 text-[11px] text-text-secondary cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600"><span class="flex-1 truncate">'+tr(name)+'</span></label>';
    });
    h+='</div></div>';
    return h;
}

function pdaField(f){
    const label=tr(f.label);
    const required=f.required?'<span class="text-red-500 ml-1">*</span>':'';
    const placeholder=f.placeholder?tr(f.placeholder):(tr('请输入')+label);
    const value=f.value===undefined?'':f.value;
    const spanCls=f.cols?' col-span-'+f.cols:'';
    if(f.readonly&&f.type!=='scan'){
        const displayVal=value===''||value===undefined?'—':String(value);
        return '<div class="min-w-0 flex flex-col gap-0.5'+spanCls+'"><label class="text-[11px] text-text-muted break-all">'+esc(label)+'</label><div class="text-[13px] font-semibold text-text-primary break-all">'+esc(tr(displayVal))+'</div></div>';
    }
    const readonly=f.readonly?' readonly':'';
    const roCls=f.readonly?' bg-surface-100 cursor-not-allowed text-text-secondary':'';
    const base='w-full h-10 px-3 text-xs rounded-lg border border-surface-200 bg-white focus:border-primary-400';
    let control='';
    if(f.type==='select'){
        control='<select class="'+base+roCls+'"'+(f.readonly?' disabled':'')+'><option value="">'+tr('请选择')+'</option>';
        (f.options||[]).forEach(function(o){control+='<option value="'+esc(o)+'"'+(value===o?' selected':'')+'>'+esc(tr(o))+'</option>';});
        control+='</select>';
    }else if(f.type==='textarea'){
        control='<textarea rows="3" class="w-full px-3 py-2 text-xs rounded-lg border border-surface-200 bg-white'+roCls+' resize-none"'+readonly+' placeholder="'+esc(placeholder)+'">'+esc(value)+'</textarea>';
    }else if(f.type==='checkbox'){
        control='<label class="h-10 px-3 rounded-lg border border-surface-200 bg-white flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" class="rounded border-surface-300 text-primary-600"'+(f.checked?' checked':'')+'><span>'+tr(f.label)+'</span></label>';
        return '<div class="min-w-0'+spanCls+'">'+control+'</div>';
    }else if(f.type==='scan'){
        control='<div class="flex gap-2"><input type="text" class="'+base+'" placeholder="'+esc(placeholder)+'" value="'+esc(value)+'"><button type="button" onclick="openPdaScanModal(\'\',\''+esc(value||'WB-20260613001')+'\',\'\')" class="shrink-0 h-10 px-3 rounded-lg bg-primary-600 text-white text-xs font-medium">'+tr('扫码')+'</button></div>';
    }else{
        control='<input type="'+(f.type||'text')+'" class="'+base+roCls+'"'+readonly+' placeholder="'+esc(placeholder)+'" value="'+esc(value)+'">';
    }
    return '<div class="min-w-0 flex flex-col gap-1.5'+spanCls+'"><label class="text-[11px] font-medium text-text-secondary break-all">'+esc(label)+required+'</label>'+control+'</div>';
}

function pdaPhotoUploader(limit){
    const total=limit||3;
    let h='<div class="rounded-xl border border-dashed border-primary-200 bg-primary-50/50 p-3">';
    h+='<div class="flex items-center justify-between mb-2"><span class="text-xs font-medium text-primary-700">'+tr('图片上传')+'</span><button type="button" onclick="openPdaUploadChoice()" class="text-xs text-primary-600 font-medium">'+tr('附件上传')+'</button></div>';
    h+='<div class="grid grid-cols-5 gap-2">';
    for(let i=0;i<total;i++){
        h+='<button type="button" onclick="openPdaUploadChoice()" class="aspect-square rounded-lg border border-primary-100 bg-white text-primary-500 text-lg flex items-center justify-center">'+(i===0?'+':'')+'</button>';
    }
    h+='</div></div>';
    return h;
}

function showPdaAppOverlay(html){
    const overlay=document.getElementById('pda-app-overlay');
    if(!overlay)return;
    overlay.innerHTML=html;
    overlay.classList.remove('hidden');
}

function closePdaAppOverlay(){
    const overlay=document.getElementById('pda-app-overlay');
    if(!overlay)return;
    overlay.classList.add('hidden');
    overlay.innerHTML='';
}

function openPdaUploadChoice(){
    let html='<div class="absolute inset-0 bg-black/35 z-30 flex items-end">';
    html+='<div class="w-full rounded-t-2xl bg-white p-4 shadow-xl">';
    html+='<div class="w-10 h-1 rounded-full bg-surface-300 mx-auto mb-3"></div>';
    html+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('附件上传')+'</div>';
    html+='<div class="grid grid-cols-2 gap-3">';
    html+='<button type="button" onclick="closePdaAppOverlay();showToast(\''+tr('进入拍照')+'\')" class="h-24 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 flex flex-col items-center justify-center gap-2 cursor-pointer"><span class="text-2xl">▣</span><span class="text-xs font-semibold">'+tr('拍照')+'</span></button>';
    html+='<button type="button" onclick="closePdaAppOverlay();showToast(\''+tr('选择图片')+'\')" class="h-24 rounded-xl border border-surface-200 bg-white text-text-secondary flex flex-col items-center justify-center gap-2 cursor-pointer"><span class="text-2xl">＋</span><span class="text-xs font-semibold">'+tr('选择图片')+'</span></button>';
    html+='</div><button type="button" onclick="closePdaAppOverlay()" class="mt-3 h-10 w-full rounded-xl bg-surface-100 text-xs font-medium text-text-secondary">'+tr('取消')+'</button>';
    html+='</div></div>';
    showPdaAppOverlay(html);
}

function pdaSection(section){
    if(section.type==='service')return pdaServicePanel(true);
    let h='<div class="rounded-xl border border-surface-200 bg-white p-3 mb-3">';
    if(section.type==='sizeTable'){
        h+='<div class="flex items-center justify-between mb-3"><div class="text-sm font-semibold text-text-primary">'+tr(section.title)+'</div>';
        h+='<button type="button" onclick="pdaAddSizeRow()" class="h-7 px-2 rounded-lg bg-primary-50 text-primary-700 text-[11px] font-medium">+ '+tr('增加')+'</button></div>';
        h+=pdaSizeTable(section.rows||[{qty:'1'}]);
    }else{
        h+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr(section.title)+'</div>';
        const useGrid=(section.fields||[]).some(function(f){return f.cols;});
        if(useGrid){
            h+='<div class="grid grid-cols-6 gap-x-3 gap-y-3">'+(section.fields||[]).map(pdaField).join('')+'</div>';
        }else{
            h+='<div class="space-y-3">'+(section.fields||[]).map(pdaField).join('')+'</div>';
        }
    }
    h+='</div>';
    return h;
}

function pdaSizeTable(rows){
    let h='<div class="overflow-x-auto -mx-3 px-3"><table class="min-w-full text-[11px] border-separate border-spacing-0">';
    h+='<thead><tr class="text-text-muted bg-surface-50">';
    ['件数','长(CM)','宽(CM)','高(CM)','重量(KG)','操作'].forEach(function(c,i){
        h+='<th class="py-1.5 px-1 font-normal'+(i===5?' text-center w-10':' text-left')+'">'+tr(c)+'</th>';
    });
    h+='</tr></thead><tbody id="pda-size-tbody">';
    rows.forEach(function(r){h+=pdaSizeRow(r);});
    h+='</tbody></table></div>';
    return h;
}

function pdaSizeRow(r){
    r=r||{};
    const cell=function(v){return '<td class="py-1 px-0.5"><input class="w-full h-8 min-w-[44px] px-1.5 text-[11px] rounded border border-surface-200 focus:border-primary-400" value="'+esc(v==null?'':String(v))+'"></td>';};
    return '<tr class="border-t border-surface-100">'+
        cell(r.qty||'1')+cell(r.l)+cell(r.w)+cell(r.h)+cell(r.weight)+
        '<td class="py-1 px-0.5 text-center"><button type="button" onclick="pdaRemoveSizeRow(this)" class="w-6 h-6 rounded-full text-red-500 hover:bg-red-50 text-base leading-none">×</button></td>'+
        '</tr>';
}

function pdaAddSizeRow(){
    const tbody=document.getElementById('pda-size-tbody');
    if(!tbody)return;
    const tr=document.createElement('tr');
    tr.className='border-t border-surface-100';
    tr.innerHTML=pdaSizeRow({qty:'1'}).replace(/^<tr[^>]*>|<\/tr>$/g,'');
    tbody.appendChild(tr);
}

function pdaRemoveSizeRow(btn){
    const tbody=document.getElementById('pda-size-tbody');
    if(!tbody)return;
    if(tbody.children.length<=1){showToast(tr('至少保留一行'));return;}
    const tr=btn.closest('tr');
    if(tr)tr.remove();
}

function pdaRecordCard(record){
    let h='<div class="rounded-xl border border-surface-200 bg-white p-3 mb-2">';
    h+='<div class="flex items-start justify-between gap-2"><div class="text-[12px] font-semibold text-text-primary break-all">'+esc(record.no)+'</div><span class="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">'+tr(record.status)+'</span></div>';
    (record.lines||[]).forEach(function(line){h+='<div class="mt-1 text-[11px] text-text-muted leading-4 break-all">'+esc(tr(line))+'</div>';});
    h+='</div>';
    return h;
}

function pdaBottomActions(config){
    const secondary=config.secondary||[];
    if(config.sameRowActions){
        const labels=secondary.concat([config.primary||'保存']);
        let h='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><div class="grid grid-cols-'+Math.min(labels.length,2)+' gap-2">';
        labels.forEach(function(label){
            h+='<button type="button" onclick="'+pdaAction(label)+'" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr(label)+'</button>';
        });
        h+='</div></div>';
        return h;
    }
    let h='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3 space-y-2">';
    if(secondary.length){
        h+='<div class="grid grid-cols-'+(secondary.length>1?'2':'1')+' gap-2">';
        secondary.forEach(function(label){
            h+='<button type="button" onclick="'+pdaAction(label)+'" class="h-9 rounded-lg border border-primary-200 text-primary-700 text-xs font-medium bg-white">'+tr(label)+'</button>';
        });
        h+='</div>';
    }
    h+='<button type="button" onclick="'+pdaAction(config.primary||'保存')+'" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr(config.primary||'保存')+'</button>';
    h+='</div>';
    return h;
}

function pdaGroupedTasks(tasks){
    const groups=[
        {title:'收货',ids:['pda-waybill-query','wh-in-one','wh-headless','pda-pallet-bind','pda-receive-check']},
        {title:'在库管理',ids:['wh-cargo-search','pda-pallet-adjust','pda-bag-adjust','pda-find-scan','pda-sort-scan']},
        {title:'出库',ids:['wh-out-scan','wh-air-bag','wh-replenish-drop','pda-load-scan','pda-load-finish']},
        {title:'调拨',ids:['wh-transfer-out','wh-transfer-in']}
    ];
    return groups.map(function(group){
        const items=group.ids.map(function(id){return tasks.find(function(item){return item[0]===id;});}).filter(Boolean);
        return Object.assign({},group,{items:items});
    }).filter(function(group){return group.items.length;});
}

function pdaAppHeader(title){
    return '<div class="bg-primary-600 text-white px-5 pt-5 pb-5"><div class="flex items-center justify-between text-xs opacity-90"><span>17:36</span><span>5G 81%</span></div><div class="mt-6 text-center text-lg font-semibold tracking-wide">'+tr(title)+'</div></div>';
}

function pdaBottomNav(active){
    const nav=[['workbench','工作台','▦'],['overview','今日总览','▱'],['profile','个人中心','◎']];
    let h='<div class="grid grid-cols-3 border-t border-surface-200 bg-white text-xs">';
    nav.forEach(function(item){
        const on=item[0]===active;
        h+='<button type="button" onclick="openWarehousePdaView(\''+item[0]+'\')" class="h-14 flex flex-col items-center justify-center gap-1 '+(on?'text-primary-600 font-semibold':'text-text-muted')+'"><span class="text-2xl leading-none">'+item[2]+'</span><span>'+tr(item[1])+'</span></button>';
    });
    h+='</div>';
    return h;
}

function generateWarehousePdaWorkbench(tasks){
    let h=pdaAppHeader('首页');
    h+='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-100">';
    pdaGroupedTasks(tasks).forEach(function(group){
        h+='<section class="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 mb-3">';
        h+='<div class="text-base font-semibold text-text-primary mb-4">'+tr(group.title)+'</div>';
        h+='<div class="grid grid-cols-3 gap-3">'+group.items.map(pdaTaskCard).join('')+'</div>';
        h+='</section>';
    });
    h+='</div>';
    h+=pdaBottomNav('workbench');
    return h;
}

function generateWarehousePdaOverview(){
    let h=pdaAppHeader('今日总览');
    h+='<div class="p-4 flex-1 min-h-0 overflow-y-auto bg-surface-100">';
    h+='<div class="grid grid-cols-2 gap-3 mb-3">';
    [['18','待配舱'],['26','已配舱'],['4','异常件'],['42','今日入仓'],['37','今日出库']].forEach(function(item){
        h+='<button type="button" onclick="openPdaOverviewDetail(\''+esc(item[1])+'\')" class="rounded-2xl bg-white border border-surface-200 p-4 shadow-sm text-left"><div class="text-2xl font-bold text-primary-600">'+item[0]+'</div><div class="text-xs text-text-muted mt-1">'+tr(item[1])+'</div></button>';
    });
    h+='</div>';
    h+='<section class="rounded-2xl bg-white border border-surface-200 p-4 shadow-sm"><div class="text-base font-semibold text-text-primary mb-3">'+tr('消息待办')+'</div>';
    [['调拨入库','TR-20260613001 预计18:30到仓'],['出库扫描','SO-20260613001 已扫18/20'],['工单管理','WO-20260613001 待处理']].forEach(function(msg){
        h+='<div class="flex items-center justify-between border-t border-surface-100 first:border-t-0 py-3"><span class="text-sm text-text-secondary">'+tr(msg[0])+'</span><span class="text-xs font-medium text-primary-700">'+esc(msg[1])+'</span></div>';
    });
    h+='</section></div>';
    h+=pdaBottomNav('overview');
    return h;
}

function openPdaOverviewDetail(title){
    let html='<div class="absolute inset-0 bg-black/35 z-30 flex items-end">';
    html+='<div class="w-full max-h-[78%] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl">';
    html+='<div class="w-10 h-1 rounded-full bg-surface-300 mx-auto mb-3"></div>';
    html+='<div class="flex items-center justify-between mb-3"><div class="text-sm font-semibold text-text-primary">'+tr(title)+'</div><button type="button" onclick="closePdaAppOverlay()" class="w-8 h-8 rounded-full bg-surface-100 text-text-muted">×</button></div>';
    [['WB-20260613001','深圳盐田仓','8件','待处理'],['WB-20260613008','广州南沙仓','5件','处理中'],['WB-20260612003','上海浦东仓','3件','已完成']].forEach(function(row){
        html+='<div class="rounded-xl border border-surface-200 bg-surface-50 p-3 mb-2"><div class="text-xs font-semibold text-primary-700">'+row[0]+'</div><div class="grid grid-cols-3 gap-1 mt-2 text-[11px] text-text-muted"><span>'+row[1]+'</span><span>'+row[2]+'</span><span>'+tr(row[3])+'</span></div></div>';
    });
    html+='</div></div>';
    showPdaAppOverlay(html);
}

function generateWarehousePdaProfile(){
    let h='<div class="bg-primary-600 text-white px-5 pt-5 pb-20">';
    h+='<div class="flex items-center justify-between text-xs opacity-90"><span>17:37</span><span>5G 81%</span></div>';
    h+='<div class="mt-8 flex flex-col items-center"><div class="w-24 h-24 rounded-full bg-white text-primary-600 flex items-center justify-center text-4xl font-bold shadow">仓</div><div class="mt-5 text-2xl font-semibold">IT开发测试专用</div><div class="text-sm opacity-90 mt-1">YY0001</div></div>';
    h+='</div>';
    h+='<div class="px-4 -mt-12 flex-1 min-h-0 overflow-y-auto bg-surface-100">';
    h+='<section class="rounded-2xl bg-white border border-surface-200 shadow-sm overflow-hidden mb-3">';
    h+='<div class="px-4 py-3 border-b border-surface-100"><div class="text-sm font-semibold text-text-primary mb-2">'+tr('语言切换')+'</div><div class="grid grid-cols-2 gap-2">';
    [['zh','中文'],['en','English'],['fr','Français'],['pt','Português']].forEach(function(lang){
        h+='<button type="button" onclick="selectLanguageOption(\''+lang[0]+'\');refreshWarehousePdaPrototype()" class="h-9 rounded-lg border text-xs font-medium '+(_currentLang===lang[0]?'border-primary-500 bg-primary-50 text-primary-700':'border-surface-200 text-text-secondary')+'">'+lang[1]+'</button>';
    });
    h+='</div></div>';
    [['日志上传',''],['清理缓存','0K'],['检查更新','2.2.8.test'],['分享App给好友',''],['退出登录','']].forEach(function(row,idx){
        const click=row[0]==='退出登录'?'logoutWarehousePda()':"showToast('"+tr(row[0])+"')";
        h+='<button type="button" onclick="'+click+'" class="w-full h-14 px-4 flex items-center justify-between border-t border-surface-100 first:border-t-0 text-left"><span class="text-sm font-medium text-text-primary">'+tr(row[0])+'</span><span class="text-sm text-text-secondary">'+esc(row[1])+' ›</span></button>';
    });
    h+='</section></div>';
    h+=pdaBottomNav('profile');
    return h;
}

function generateWarehousePdaHome(tasks){
    if(!_warehousePdaLoggedIn||_warehousePdaView==='login')return generateWarehousePdaLoginScreen();
    if(_warehousePdaView==='overview')return generateWarehousePdaOverview();
    if(_warehousePdaView==='profile')return generateWarehousePdaProfile();
    return generateWarehousePdaWorkbench(tasks);
}

function generateWarehousePdaLoginScreen(){
    let h=pdaAppHeader('PDA登录');
    h+='<div class="p-5 flex-1 min-h-0 overflow-y-auto bg-surface-100">';
    h+='<section class="rounded-2xl bg-white border border-surface-200 shadow-sm p-4">';
    h+='<div class="space-y-3">';
    h+=pdaField({label:'账号',value:'warehouse01',required:true});
    h+=pdaField({label:'密码',type:'password',value:'123456',required:true});
    h+=pdaField({label:'所属仓库',type:'select',options:getWarehouseNameOptions(),value:currentAccountWarehouse(),required:true});
    h+='</div>';
    h+='<button type="button" onclick="loginWarehousePda()" class="mt-5 h-11 w-full rounded-lg bg-primary-600 text-white text-sm font-semibold">'+tr('登录')+'</button>';
    h+='</section>';
    h+='<section class="mt-3 rounded-2xl bg-white border border-surface-200 shadow-sm p-4"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('语言切换')+'</div><div class="grid grid-cols-2 gap-2">';
    [['zh','中文'],['en','English'],['fr','Français'],['pt','Português']].forEach(function(lang){
        h+='<button type="button" onclick="selectLanguageOption(\''+lang[0]+'\');refreshWarehousePdaPrototype()" class="h-9 rounded-lg border text-xs font-medium '+(_currentLang===lang[0]?'border-primary-500 bg-primary-50 text-primary-700':'border-surface-200 text-text-secondary')+'">'+lang[1]+'</button>';
    });
    h+='</div></section></div>';
    return h;
}

function pdaScanInput(inputId,placeholder,callbackName,scanValue){
    return '<div class="relative mb-3 w-full"><input id="'+esc(inputId)+'" type="text" data-clear-enhanced="1" class="w-full h-11 pl-3 pr-24 text-xs rounded-xl border border-surface-200 bg-white focus:border-primary-400" placeholder="'+esc(tr(placeholder))+'" oninput="togglePdaScanClear(\''+esc(inputId)+'\')" onkeydown="if(event.key===\'Enter\')'+callbackName+'()"><button type="button" data-pda-clear-for="'+esc(inputId)+'" onclick="clearPdaScanInput(\''+esc(inputId)+'\')" style="display:none" class="absolute right-11 top-2 w-7 h-7 rounded-full bg-surface-100 text-text-muted text-base leading-none items-center justify-center">×</button><button type="button" onclick="openPdaScanModal(\''+esc(inputId)+'\',\''+esc(scanValue||'WB-20260613001')+'\',\''+callbackName+'\')" class="absolute right-1 top-1 w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center text-lg">⌕</button></div>';
}

function togglePdaScanClear(inputId){
    const input=document.getElementById(inputId);
    const btn=document.querySelector('[data-pda-clear-for="'+inputId+'"]');
    if(btn)btn.style.display=input&&input.value?'flex':'none';
}

function clearPdaScanInput(inputId){
    const input=document.getElementById(inputId);
    if(!input)return;
    input.value='';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
}

function openPdaScanModal(inputId,value,callbackName){
    let html='<div class="absolute inset-0 bg-slate-950/90 z-30 flex flex-col text-white">';
    html+='<div class="px-4 pt-4 pb-3 flex items-center gap-3"><button type="button" onclick="closePdaAppOverlay()" class="w-8 h-8 rounded-full bg-white/15 text-lg">←</button><div class="text-sm font-semibold">'+tr('扫码识别')+'</div></div>';
    html+='<div class="flex-1 relative flex items-center justify-center">';
    html+='<div class="absolute inset-x-10 top-1/2 h-0.5 bg-green-400 shadow-[0_0_18px_rgba(74,222,128,0.9)]"></div>';
    html+='<div class="w-48 h-48 rounded-2xl border-2 border-white/80"></div>';
    html+='<div class="absolute bottom-16 text-xs text-white/80">'+tr('请将单号条码放入扫描框')+'</div>';
    html+='</div>';
    html+='<div class="p-4 bg-white text-text-primary rounded-t-2xl"><div class="text-xs text-text-muted mb-2">'+tr('模拟扫码后自动填充单号')+'</div><div class="h-9 px-3 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold flex items-center">'+esc(value)+'</div><button type="button" onclick="finishPdaScan(\''+esc(inputId)+'\',\''+esc(value)+'\',\''+esc(callbackName)+'\')" class="mt-3 h-10 w-full rounded-xl bg-primary-600 text-white text-xs font-medium">'+tr('扫码完成')+'</button></div>';
    html+='</div>';
    showPdaAppOverlay(html);
}

function finishPdaScan(inputId,value,callbackName){
    closePdaAppOverlay();
    const input=document.getElementById(inputId);
    if(input)input.value=value;
    togglePdaScanClear(inputId);
    if(callbackName&&typeof window[callbackName]==='function')window[callbackName]();
}

function showPdaWaybillResults(){
    const input=document.getElementById('pda-waybill-key');
    if(input&&!input.value)input.value='WB-20260613001';
}

function pdaMiniField(label,value){
    return '<div class="rounded-lg border border-surface-200 bg-white px-2.5 py-2 min-w-0"><div class="text-[10px] text-text-muted break-all">'+tr(label)+'</div><div class="mt-1 text-[11px] font-medium text-text-primary break-all">'+esc(value||'-')+'</div></div>';
}

function generatePdaWaybillQueryScreen(){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50">';
    h+=pdaScanInput('pda-waybill-key','请输入运单号或物流单号','showPdaWaybillResults','WB-20260613001');
    h+='<section class="rounded-xl border border-primary-100 bg-primary-50 p-3 mb-3">';
    h+='<div class="flex items-start justify-between gap-2 mb-3"><div class="min-w-0"><div class="text-sm font-semibold text-primary-700 break-all">WB-20260613001</div><div class="text-[11px] text-primary-700 mt-0.5">SF10086523</div></div><span class="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] text-primary-700 border border-primary-200">'+tr('已入仓')+'</span></div>';
    h+='<div class="text-xs font-semibold text-primary-700 mb-2 pt-2 border-t border-primary-100">'+tr('运单主信息')+'</div>';
    h+='<div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">';
    [['客户代码','CUS-001'],['客户名称','深圳市华运达国际货运'],['所属网点','深圳盐田仓'],['所属业务员','王明辉'],['所属客服','赵雅琴'],['所属操作','张财务'],['运输方式','海运'],['收货仓库','深圳盐田仓'],['目的仓库','拉各斯海外仓'],['件数','8'],['重量','12.5KG'],['体积','0.36CBM'],['货物类型','普货']].forEach(function(item){
        h+='<div class="flex items-baseline justify-between gap-2 min-w-0"><span class="text-primary-700/70 shrink-0">'+tr(item[0])+'</span><span class="font-medium text-text-primary text-right break-all">'+esc(tr(item[1]))+'</span></div>';
    });
    h+='</div>';
    h+='</section>';
    const cargoItems=[
        ['服装配件','3','24','ZARA'],
        ['手机配件','2','50','华为'],
        ['五金工具','1','12','STANLEY']
    ];
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3 mb-3">';
    h+='<div class="flex items-center justify-between mb-2"><div class="text-sm font-semibold text-text-primary">'+tr('品名信息')+'</div><span class="text-[10px] text-text-muted">'+tr('共')+' '+cargoItems.length+' '+tr('项')+'</span></div>';
    h+='<div class="border border-surface-200 rounded overflow-hidden"><table class="w-full text-[11px]"><thead class="bg-surface-50 text-text-secondary"><tr>'+
        '<th class="px-2 py-1 text-left font-medium">'+tr('品名')+'</th>'+
        '<th class="px-2 py-1 text-right font-medium">'+tr('箱数')+'</th>'+
        '<th class="px-2 py-1 text-right font-medium">'+tr('单箱数量')+'</th>'+
        '<th class="px-2 py-1 text-left font-medium">'+tr('品牌')+'</th>'+
    '</tr></thead><tbody>'+
        cargoItems.map(function(r){
            return '<tr class="border-t border-surface-100">'+
                '<td class="px-2 py-1 text-text-primary">'+esc(tr(r[0]))+'</td>'+
                '<td class="px-2 py-1 text-right font-semibold text-primary-700">'+esc(r[1])+'</td>'+
                '<td class="px-2 py-1 text-right text-text-secondary">'+esc(r[2])+'</td>'+
                '<td class="px-2 py-1 text-text-secondary">'+esc(r[3])+'</td>'+
            '</tr>';
        }).join('')+
    '</tbody></table></div>';
    h+='</section>';
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3">';
    h+='<div class="flex items-center justify-between mb-2"><div class="text-sm font-semibold text-text-primary">'+tr('绑定托盘')+'</div><span class="text-[10px] text-text-muted">'+tr('共')+' 3 '+tr('个')+'</span></div>';
    const pallets=[
        {no:'PLT-GZ-018',wh:'广州南沙仓',zone:'A区-01',pcs:'3',weight:'4.5KG',status:'在库'},
        {no:'PLT-GZ-022',wh:'广州南沙仓',zone:'A区-02',pcs:'3',weight:'4.5KG',status:'在库'},
        {no:'PLT-SZ-007',wh:'深圳盐田仓',zone:'B区-重货',pcs:'2',weight:'3.5KG',status:'已出库'}
    ];
    h+='<div class="space-y-2">';
    pallets.forEach(function(p){
        h+='<div class="rounded-lg border border-surface-100 bg-surface-50 p-2.5">';
        h+='<div class="flex items-start justify-between gap-2 mb-1.5"><div class="text-[12px] font-semibold text-primary-700 break-all">'+p.no+'</div><span class="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] text-primary-700">'+tr(p.status)+'</span></div>';
        h+='<div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-text-muted"><div class="break-all">'+tr('仓库')+'：'+tr(p.wh)+'</div><div class="break-all">'+tr('货区')+'：'+p.zone+'</div><div class="break-all">'+tr('件数')+'：'+p.pcs+'</div><div class="break-all">'+tr('重量')+'：'+p.weight+'</div></div>';
        h+='</div>';
    });
    h+='</div>';
    h+='</section>';
    h+='</div>';
    return h;
}

function pdaInfoList(pairs){
    let h='<div class="rounded-lg border border-surface-200 bg-white divide-y divide-surface-100">';
    pairs.forEach(function(p){
        h+='<div class="flex items-start justify-between gap-3 px-3 py-2 text-[11px]"><span class="text-text-muted shrink-0">'+tr(p[0])+'</span><span class="font-medium text-text-primary text-right break-all">'+esc(tr(p[1]))+'</span></div>';
    });
    h+='</div>';
    return h;
}

function pdaCheckGroup(names){
    return '<div class="grid grid-cols-2 gap-2">'+names.map(function(name){return '<label class="min-h-9 px-2 py-1.5 rounded-lg border border-surface-200 bg-white flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" class="rounded border-surface-300 text-primary-600"><span class="break-all">'+tr(name)+'</span></label>';}).join('')+'</div>';
}

/* ===== 查货管理 wh-cargo-search（按图重写：list/detail 两屏 state machine） ===== */
var _pdaCargoSearchView='list';
var _pdaCargoSearchCurrent=null;
var _pdaCargoSearchTagsByIdx={};
var _pdaCargoSearchTagOptions=['敏感货','玩具','手机','危险品','易碎','带电','带磁','严禁品'];
var _pdaCargoSearchList=[
    {wb:'H82512230001',cmdType:'开箱验货',cmdContent:'测试指令内容测试指令内容测试指令内容',holdStatus:'正常件',declareName:'品1（子单对应品名）'},
    {wb:'H82512230002',cmdType:'开箱验货',cmdContent:'测试指令内容测试指令内容测试指令内容',holdStatus:'正常件',declareName:'品1（子单对应品名）'},
    {wb:'H82512230003',cmdType:'开箱验货',cmdContent:'测试指令内容测试指令内容测试指令内容',holdStatus:'正常件',declareName:'品1（子单对应品名）'}
];

function generatePdaCargoSearchScreen(){
    if(_pdaCargoSearchView==='detail'&&_pdaCargoSearchCurrent!==null&&_pdaCargoSearchList[_pdaCargoSearchCurrent]){
        return generatePdaCargoSearchDetail();
    }
    return generatePdaCargoSearchList();
}

function generatePdaCargoSearchList(){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+=pdaScanInput('pda-cargo-search-key','请扫描运单子单号','applyPdaCargoSearchKey','H82512230001');
    _pdaCargoSearchList.forEach(function(item,i){
        h+='<button type="button" onclick="pickPdaCargoSearchCard('+i+')" class="block w-full text-left rounded-xl border border-surface-200 bg-white p-3 shadow-sm">';
        h+='<div class="grid grid-cols-2 gap-y-2 text-xs">';
        h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.wb)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('指令类型')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(item.cmdType)+'</div></div>';
        h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('指令内容')+'</div><div class="text-text-muted mt-0.5 break-all">'+esc(item.cmdContent)+'</div></div>';
        h+='</div></button>';
    });
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-开箱验货"，了解详细逻辑。')+'</div>';
    h+='</div>';
    setTimeout(function(){var el=document.getElementById('pda-cargo-search-key');if(el)el.focus();},50);
    return h;
}

function applyPdaCargoSearchKey(){
    const input=document.getElementById('pda-cargo-search-key');
    if(!input)return;
    const val=(input.value||'').trim();
    let idx=-1;
    if(val)idx=_pdaCargoSearchList.findIndex(function(it){return it.wb===val;});
    if(idx<0)idx=0;
    pickPdaCargoSearchCard(idx);
}

function pickPdaCargoSearchCard(i){
    const item=_pdaCargoSearchList[i];
    if(!item)return;
    _pdaCargoSearchCurrent=i;
    if(!_pdaCargoSearchTagsByIdx[i])_pdaCargoSearchTagsByIdx[i]=[];
    _pdaCargoSearchView='detail';
    refreshWarehousePdaPrototype();
}

function togglePdaCargoSearchTag(tag){
    const i=_pdaCargoSearchCurrent;
    if(i===null||i===undefined)return;
    if(!_pdaCargoSearchTagsByIdx[i])_pdaCargoSearchTagsByIdx[i]=[];
    const arr=_pdaCargoSearchTagsByIdx[i];
    const pos=arr.indexOf(tag);
    if(pos>=0)arr.splice(pos,1);
    else arr.push(tag);
    refreshWarehousePdaPrototype();
}

function generatePdaCargoSearchDetail(){
    const item=_pdaCargoSearchList[_pdaCargoSearchCurrent];
    const tags=_pdaCargoSearchTagsByIdx[_pdaCargoSearchCurrent]||[];
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+=pdaScanInput('pda-cargo-search-key','请扫描运单子单号','applyPdaCargoSearchKey','');
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3 space-y-3 text-xs">';
    h+='<div class="flex items-center gap-2"><span class="text-text-secondary w-20 flex-shrink-0">'+tr('运单号')+'</span><span class="font-medium text-text-primary break-all">'+esc(item.wb)+'</span></div>';
    h+='<div class="flex items-center gap-2"><span class="text-text-secondary w-20 flex-shrink-0">'+tr('扣件状态')+'</span><span class="font-medium text-text-primary">'+esc(item.holdStatus)+'</span></div>';
    h+='<div class="flex items-center gap-2"><span class="text-text-secondary w-20 flex-shrink-0">'+tr('申报品名')+'</span><span class="font-medium text-text-primary break-all">'+esc(item.declareName)+'</span></div>';
    h+='</section>';
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-xs font-semibold text-text-primary mb-2">'+tr('查货标记')+'</div><div class="flex flex-wrap gap-2">';
    _pdaCargoSearchTagOptions.forEach(function(tag){
        const on=tags.indexOf(tag)>=0;
        h+='<button type="button" onclick="togglePdaCargoSearchTag(\''+esc(tag)+'\')" class="h-8 px-3 rounded-full border text-xs '+(on?'border-amber-500 text-amber-600 bg-amber-50':'border-surface-300 text-text-secondary bg-white')+'">'+tr(tag)+'</button>';
    });
    h+='</div></section>';
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3"><div class="flex items-center gap-2"><span class="text-xs text-text-secondary w-20 flex-shrink-0">'+tr('查货备注')+'</span><input type="text" placeholder="'+tr('查货备注')+'" class="flex-1 h-9 px-3 text-xs border border-surface-200 rounded-lg"></div></section>';
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-xs text-rose-500 mb-2">'+tr('上传照片(最多上传20张，支持调用摄像头)')+'</div><div class="flex"><button type="button" onclick="showToast(\''+tr('打开相机')+'\')" class="w-20 h-20 rounded-lg border border-dashed border-surface-300 bg-surface-50 flex items-center justify-center text-2xl text-text-muted">+</button></div><div class="text-right text-xs text-text-muted mt-2">0/20</div></section>';
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-开箱验货"，了解详细逻辑。')+'</div>';
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意："扣件保存"按钮操作后：保存并自动生成1条问题件')+'</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><div class="grid grid-cols-2 gap-2">';
    h+='<button type="button" onclick="savePdaCargoSearch(true)" class="h-10 rounded-lg bg-rose-500 text-white text-sm font-medium">'+tr('扣件保存')+'</button>';
    h+='<button type="button" onclick="savePdaCargoSearch(false)" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('保存')+'</button>';
    h+='</div></div>';
    return h;
}

function savePdaCargoSearch(hold){
    if(hold)showToast(tr('扣件保存成功，已生成 1 条问题件'));
    else showToast(tr('保存成功'));
    _pdaCargoSearchView='list';
    _pdaCargoSearchCurrent=null;
    refreshWarehousePdaPrototype();
}

function showPdaOutScanWork(){
    const input=document.getElementById('pda-out-scan-key');
    if(input&&!input.value)input.value='WB-20260613001';
    const work=document.getElementById('pda-out-scan-work');
    const empty=document.getElementById('pda-out-scan-empty');
    if(work)work.classList.remove('hidden');
    if(empty)empty.classList.add('hidden');
}

function switchPdaOutScanMode(mode){
    document.querySelectorAll('[data-pda-out-mode]').forEach(function(btn){
        const on=btn.dataset.pdaOutMode===mode;
        btn.className='h-8 rounded-lg text-xs font-medium '+(on?'bg-primary-600 text-white':'bg-white border border-surface-200 text-text-secondary');
    });
    const input=document.getElementById('pda-out-child-key');
    if(input)input.placeholder=tr(mode==='ticket'?'请您扫码运单号':'请您扫码子单号，配载单号');
    const ticket=document.getElementById('pda-out-ticket-mode');
    const piece=document.getElementById('pda-out-piece-mode');
    if(ticket)ticket.classList.toggle('hidden',mode!=='ticket');
    if(piece)piece.classList.toggle('hidden',mode!=='piece');
    hidePdaOutScanDetail();
}

function showPdaOutScanDetail(){
    const list=document.getElementById('pda-out-scan-list');
    const detail=document.getElementById('pda-out-scan-detail');
    if(list)list.classList.add('hidden');
    if(detail)detail.classList.remove('hidden');
}

function hidePdaOutScanDetail(){
    const list=document.getElementById('pda-out-scan-list');
    const detail=document.getElementById('pda-out-scan-detail');
    if(list)list.classList.remove('hidden');
    if(detail)detail.classList.add('hidden');
}

// 运单待出库/已出库卡片：clickable=true 时双击进入今日详情（按件出），否则不可点击（按票出）
function pdaOutWaybillCard(row,clickable){
    const openTag=clickable?'button type="button" ondblclick="showPdaOutScanDetail()"':'div';
    const closeTag=clickable?'button':'div';
    let h='<'+openTag+' class="w-full rounded-lg border border-surface-100 bg-surface-50 px-3 py-2 text-xs text-left">';
    h+='<div class="font-semibold text-primary-700 break-all">'+tr('运单号')+'：'+row[0]+'</div>';
    h+='<div class="mt-1 grid grid-cols-2 gap-2 text-text-muted"><span class="break-all">'+tr('已出库件数')+'：'+row[1]+'</span><span class="break-all">'+tr('总件数')+'：'+row[2]+'</span></div>';
    h+='</'+closeTag+'>';
    return h;
}

function pdaOutWaybillSection(title,rows,clickable){
    let h='<section class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-sm font-semibold text-text-primary mb-2">'+tr(title)+'</div><div class="space-y-2">';
    rows.forEach(function(row){h+=pdaOutWaybillCard(row,clickable);});
    h+='</div></section>';
    return h;
}

function generatePdaOutScanScreen(){
    // [运单号, 已出库件数, 总件数]
    const todoRows=[['WB-20260613001','3','8'],['WB-20260613002','2','8']];
    const doneRows=[['WB-20260612009','6','6'],['WB-20260612008','4','4']];
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50">';
    h+=pdaScanInput('pda-out-scan-key','请输入运单号或客户单号','showPdaOutScanWork','WB-20260613001');
    h+='<div id="pda-out-scan-empty" class="rounded-xl border border-dashed border-surface-200 bg-white p-5 text-center text-sm text-text-muted">'+tr('输入或扫码后展示出库数据')+'</div>';
    h+='<div id="pda-out-scan-work" class="hidden space-y-3">';
    h+='<div class="grid grid-cols-2 gap-2"><button type="button" data-pda-out-mode="ticket" onclick="switchPdaOutScanMode(\'ticket\')" class="h-8 rounded-lg text-xs font-medium bg-primary-600 text-white">'+tr('按票出')+'</button><button type="button" data-pda-out-mode="piece" onclick="switchPdaOutScanMode(\'piece\')" class="h-8 rounded-lg text-xs font-medium bg-white border border-surface-200 text-text-secondary">'+tr('按件出')+'</button></div>';
    h+=pdaScanInput('pda-out-child-key','请您扫码运单号','showPdaOutScanWork','WB-20260613001');
    h+='<div id="pda-out-scan-list" class="space-y-3">';
    h+='<section class="rounded-xl border border-primary-100 bg-primary-50 p-3"><div class="text-sm font-semibold text-primary-700 mb-2">'+tr('配载单信息')+'</div><div class="grid grid-cols-2 gap-2 text-xs text-primary-700"><div class="break-all">'+tr('配载单号')+'：LOAD-20260613001</div><div class="break-all">'+tr('目的港')+'：LOS</div><div class="break-all">'+tr('航司')+'：MAERSK</div><div class="break-all">'+tr('总件数')+'：42</div></div></section>';
    // 按票出：待出库 + 已出库，卡片不可点击
    h+='<div id="pda-out-ticket-mode" class="space-y-3">';
    h+=pdaOutWaybillSection('运单待出库数据',todoRows,false);
    h+=pdaOutWaybillSection('运单已出库数据',doneRows,false);
    h+='</div>';
    // 按件出：待出库 + 已出库，双击进入今日详情
    h+='<div id="pda-out-piece-mode" class="hidden space-y-3">';
    h+=pdaOutWaybillSection('运单待出库数据',todoRows,true);
    h+=pdaOutWaybillSection('运单已出库数据',doneRows,true);
    h+='</div>';
    h+='</div>';
    h+='<div id="pda-out-scan-detail" class="hidden space-y-3"><button type="button" onclick="hidePdaOutScanDetail()" class="w-8 h-8 rounded-full bg-primary-600 text-white text-lg">←</button><section class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('今日详情')+'</div><div class="text-xs font-medium text-text-secondary mb-2">'+tr('待出库数据')+'</div><div class="space-y-2">';
    [['SUB-20260613001-01','否'],['SUB-20260613001-02','是'],['SUB-20260613001-03','否']].forEach(function(row){
        h+='<div class="rounded-lg border border-surface-100 bg-surface-50 px-3 py-2 text-xs"><div class="grid grid-cols-2 gap-2"><span class="break-all">'+tr('子单号')+'：'+row[0]+'</span><span class="break-all">'+tr('是否出库')+'：'+tr(row[1])+'</span></div></div>';
    });
    h+='</div></section></div>';
    h+='</div></div>';
    return h;
}

function generatePdaMultiInboundScreen(config){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50">';
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3 mb-3">';
    h+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('基础信息')+'</div>';
    h+='<div class="space-y-3">';
    h+=pdaField({label:'运单号',type:'scan',value:'WB-20260613008',required:true});
    h+=pdaField({label:'勾选同步生成运单',type:'checkbox',checked:true});
    h+=pdaField({label:'到货仓库',type:'select',options:getWarehouseNameOptions(),required:true});
    h+=pdaField({label:'到货时间',type:'datetime-local',value:'2026-06-13T15:00',required:true});
    h+=pdaField({label:'运输方式',type:'select',options:['空运','海运','卡航','快递'],required:true});
    h+='</div></section>';
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3 mb-3"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('收货录入')+'</div>';
    h+='<div class="grid grid-cols-2 gap-2 mb-2">';
    h+=pdaField({label:'品名',value:'手机配件',required:true,placeholder:'输入品名信息带出大类'});
    h+=pdaField({label:'品名大类',value:'带电产品'});
    h+=pdaField({label:'长(CM)',type:'number',value:'55',required:true});
    h+=pdaField({label:'宽(CM)',type:'number',value:'42',required:true});
    h+=pdaField({label:'高(CM)',type:'number',value:'38',required:true});
    h+=pdaField({label:'重量(KG)',type:'number',value:'18.4',required:true});
    h+='</div>';
    h+='<div class="grid grid-cols-[1fr_76px] gap-2">'+pdaField({label:'件数',type:'number',value:'2',required:true})+'<button type="button" onclick="'+pdaAction('添加')+'" class="self-end h-10 rounded-lg bg-primary-600 text-white text-xs font-medium">'+tr('添加')+'</button></div></section>';
    h+=pdaServicePanel(false);
    h+='<div class="mt-3 mb-2 text-sm font-semibold text-text-primary">'+tr('收货明细')+'</div>';
    (config.records||[]).forEach(function(record){h+=pdaRecordCard(record);});
    h+='<section class="rounded-xl border border-primary-100 bg-primary-50 p-3 mt-3"><div class="text-sm font-semibold text-primary-700 mb-2">'+tr('运单汇总')+'</div><div class="grid grid-cols-2 gap-2 text-xs text-primary-700"><div>'+tr('总件数')+'：5</div><div>'+tr('总重')+'：36.8KG</div><div>'+tr('总体积')+'：0.72M3</div><div>'+tr('总计费重')+'：43.2KG</div></div></section>';
    h+='</div>';
    h+=pdaBottomActions({primary:'确认收货'});
    return h;
}

function switchPdaReplenishMode(mode){
    document.querySelectorAll('[data-pda-rd-mode]').forEach(function(btn){
        const on=btn.dataset.pdaRdMode===mode;
        btn.className='h-8 rounded-lg text-xs font-medium '+(on?'bg-primary-600 text-white':'bg-white border border-surface-200 text-text-secondary');
    });
    const hint=document.getElementById('pda-rd-mode-hint');
    if(hint)hint.textContent=tr(mode==='waybill'?'按运单操作，可点击运单进入详情。':'按子单操作，逐件确认补货落货。');
}

function showPdaReplenishDetail(){
    const list=document.getElementById('pda-rd-list');
    const detail=document.getElementById('pda-rd-detail');
    if(list)list.classList.add('hidden');
    if(detail)detail.classList.remove('hidden');
}

function hidePdaReplenishDetail(){
    const list=document.getElementById('pda-rd-list');
    const detail=document.getElementById('pda-rd-detail');
    if(list)list.classList.remove('hidden');
    if(detail)detail.classList.add('hidden');
}

/* ===== 补货落货管理 wh-replenish-drop state ===== */
var _pdaReplenishOp='补货';
var _pdaReplenishItems=[
    {wb:'WB-20260613001',op:'落货',srcAlloc:'YPCD-001',destAlloc:'YPCD-002'},
    {wb:'WB-20260613008',op:'补货',srcAlloc:'YPCD-003',destAlloc:'YPCD-005'}
];

function setPdaReplenishOp(op){
    _pdaReplenishOp=op||'补货';
    refreshWarehousePdaPrototype();
}

function removePdaReplenishItem(idx){
    if(!_pdaReplenishItems)return;
    _pdaReplenishItems.splice(idx,1);
    refreshWarehousePdaPrototype();
}

function generatePdaReplenishDropScreen(){
    const op=_pdaReplenishOp||'补货';
    const opRadio=function(val){
        const on=op===val;
        return '<label class="flex items-center gap-1.5 text-xs cursor-pointer"><input type="radio" name="pda-rd-op" value="'+val+'"'+(on?' checked':'')+' onchange="setPdaReplenishOp(\''+val+'\')" class="accent-primary-600">'+tr(val)+'</label>';
    };
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50">';
    h+='<div class="mb-3">'+pdaScanInput('pda-rd-alloc','请扫描配舱单号','showToast','YPCD-001')+'</div>';
    h+='<div class="grid grid-cols-2 gap-2 mb-2"><button type="button" data-pda-rd-mode="waybill" onclick="switchPdaReplenishMode(\'waybill\')" class="h-8 rounded-lg text-xs font-medium bg-primary-600 text-white">'+tr('按运单操作')+'</button><button type="button" data-pda-rd-mode="sub" onclick="switchPdaReplenishMode(\'sub\')" class="h-8 rounded-lg text-xs font-medium bg-white border border-surface-200 text-text-secondary">'+tr('按子单操作')+'</button></div>';
    h+='<div id="pda-rd-mode-hint" class="mb-3 text-[11px] text-text-muted">'+tr('按运单操作，可点击运单进入详情。')+'</div>';
    h+='<div class="rounded-xl border border-surface-200 bg-white p-3 mb-3"><div class="text-xs text-text-secondary mb-2">'+tr('操作类型')+'<span class="text-rose-500"> *</span></div><div class="flex items-center gap-6">'+opRadio('补货')+opRadio('落货')+'</div></div>';
    h+=pdaScanInput('pda-rd-key','请输入运单号或子单号','showToast','WB-20260613001');
    h+='<div class="mt-3 mb-2 text-xs font-semibold text-text-secondary">'+tr('已扫描列表')+'（'+_pdaReplenishItems.length+' '+tr('条')+'）</div>';
    h+='<div id="pda-rd-list" class="space-y-2">';
    if(_pdaReplenishItems.length===0){
        h+='<div class="rounded-xl border border-dashed border-surface-200 bg-white py-6 text-center text-xs text-text-muted">'+tr('暂无已扫描数据')+'</div>';
    }else{
        _pdaReplenishItems.forEach(function(row,i){
            h+='<div class="rounded-xl border border-surface-200 bg-white p-3"><div class="flex justify-between items-start gap-2"><div onclick="showPdaReplenishDetail()" class="min-w-0 flex-1 cursor-pointer"><div class="flex items-center gap-2"><span class="text-xs font-semibold text-primary-700 break-all">'+esc(row.wb)+'</span><span class="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] text-primary-700">'+esc(row.op)+'</span></div><div class="mt-2 text-[11px] text-text-muted">'+tr('原配舱')+'：'+esc(row.srcAlloc)+' · '+tr('目标配舱')+'：'+esc(row.destAlloc)+'</div></div><button type="button" onclick="removePdaReplenishItem('+i+')" class="text-xs text-red-500 flex-shrink-0">'+tr('删除')+'</button></div></div>';
        });
    }
    h+='</div>';
    h+='<div id="pda-rd-detail" class="hidden space-y-3 mt-3"><button type="button" onclick="hidePdaReplenishDetail()" class="w-8 h-8 rounded-full bg-primary-600 text-white text-lg">←</button><section class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('运单详情')+'</div><div class="grid grid-cols-2 gap-2">'+pdaMiniField('运单号','WB-20260613001')+pdaMiniField('子单号','SUB-20260613001-01')+pdaMiniField('类型','落货')+pdaMiniField('件数','2')+pdaMiniField('原配舱单号','YPCD-001')+pdaMiniField('目标配舱单号','YPCD-002')+'</div></section></div>';
    h+='</div>';
    h+=pdaBottomActions({primary:'确认处理'});
    return h;
}

function pdaWorkOrderInfoRow(label,value,opts){
    opts=opts||{};
    const valClass=opts.danger?'text-red-500 font-semibold':'text-text-primary font-medium';
    const copy=opts.copy?'<button type="button" onclick="showToast(\''+tr('已复制')+'\')" class="ml-1 align-middle text-primary-500"><svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2zm0 0V5a2 2 0 012-2h6"/></svg></button>':'';
    return '<div class="text-[12px]"><span class="text-text-muted">'+tr(label)+'：</span><span class="'+valClass+' break-all">'+esc(tr(value))+'</span>'+copy+'</div>';
}
function generatePdaWorkOrderScreen(){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50">';
    // 顶部：工单编号扫码
    h+='<div class="mb-3"><label class="text-[12px] font-semibold text-text-primary mb-1.5 block">'+tr('工单编号')+'</label>'+pdaScanInput('pda-wo-key','请扫描或输入工单编号','showToast','WOA25070217183689310')+'</div>';
    // 工单信息卡片
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3 mb-3 space-y-2">';
    h+='<div class="flex items-start justify-between gap-2">'+pdaWorkOrderInfoRow('工单编号','WOA25070217183689310',{copy:true})+'<span class="shrink-0 rounded-full bg-red-500 text-white px-2.5 py-0.5 text-[11px] font-medium">'+tr('未处理')+'</span></div>';
    h+=pdaWorkOrderInfoRow('单号','');
    h+='<div class="grid grid-cols-2 gap-2">'+pdaWorkOrderInfoRow('工单类型','异常处理')+pdaWorkOrderInfoRow('客户','展优',{copy:true})+'</div>';
    h+='<div class="grid grid-cols-2 gap-2">'+pdaWorkOrderInfoRow('催促次数','0',{danger:true})+pdaWorkOrderInfoRow('紧急程度','一般',{danger:true})+'</div>';
    h+='<div><div class="text-[12px] text-text-muted mb-1">'+tr('备注')+'：</div><textarea rows="3" readonly class="w-full px-3 py-2 text-[12px] rounded-lg border border-surface-200 bg-surface-50 resize-none text-text-primary">群名：展优（LJ004）-蓝鲸（东莞展优）-操作群\nCM110548457DE\nIT216477663GB</textarea></div>';
    h+='<div class="flex justify-end gap-2 pt-1">';
    h+='<button type="button" onclick="showToast(\''+tr('查看回复内容')+'\')" class="relative h-8 px-3 rounded-lg bg-primary-600 text-white text-xs font-medium">'+tr('查看回复内容')+'<span class="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">1</span></button>';
    h+='<button type="button" onclick="showToast(\''+tr('查看工单内容')+'\')" class="h-8 px-3 rounded-lg bg-primary-600 text-white text-xs font-medium">'+tr('查看工单内容')+'</button>';
    h+='</div></section>';
    // 动作按钮
    h+='<div class="space-y-3">';
    h+='<button type="button" onclick="showToast(\''+tr('拍照')+'\')" class="h-11 w-full rounded-xl bg-primary-600 text-white text-sm font-semibold">'+tr('拍照')+'</button>';
    h+='<button type="button" onclick="showToast(\''+tr('回复')+'\')" class="h-11 w-full rounded-xl bg-primary-600 text-white text-sm font-semibold">'+tr('回复')+'</button>';
    h+='<button type="button" onclick="showToast(\''+tr('催办')+'\')" class="h-11 w-full rounded-xl bg-red-500 text-white text-sm font-semibold">'+tr('催办')+'</button>';
    h+='</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="showToast(\''+tr('工单已完成')+'\')" class="h-11 w-full rounded-xl bg-primary-600 text-white text-sm font-semibold">'+tr('完成工单')+'</button></div>';
    return h;
}

/* ===== 调拨入库 wh-transfer-in（按需求重写） ===== */
var _pdaTransferInMode='order';
var _pdaTransferInQty=0;
var _pdaTransferInScannedSet={};
var _pdaTransferInActiveTab='pending';
var _pdaTransferInWaybills=[
    {wb:'WB-20260613001',pcs:8,pallet:'TP20260613001',zone:'A1'},
    {wb:'WB-20260613002',pcs:3,pallet:'TP20260613002',zone:'A2'},
    {wb:'WB-20260613008',pcs:1,pallet:'TP20260613003',zone:'B1'}
];

function switchPdaTransferInMode(mode){
    _pdaTransferInMode=mode||'order';
    refreshWarehousePdaPrototype();
}

function switchPdaTransferInTab(t){
    _pdaTransferInActiveTab=t;
    refreshWarehousePdaPrototype();
}

function openPdaTransferInQtyModal(){
    const cur=_pdaTransferInQty||0;
    const old=document.getElementById('pda-tri-qty-modal');
    if(old)old.remove();
    const modal=document.createElement('div');
    modal.id='pda-tri-qty-modal';
    modal.className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6';
    modal.innerHTML='<div class="w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('核验入库件数')+'</div><input id="pda-tri-qty-input" type="number" inputmode="numeric" min="0" value="'+cur+'" class="w-full h-10 px-3 mb-3 rounded-lg border border-surface-200 text-sm text-text-primary"><div class="grid grid-cols-2 gap-2"><button type="button" onclick="closePdaTransferInQtyModal()" class="h-10 rounded-lg bg-surface-100 text-text-secondary text-sm">'+tr('取消')+'</button><button type="button" onclick="confirmPdaTransferInQty()" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('确认')+'</button></div></div>';
    document.body.appendChild(modal);
    setTimeout(function(){var el=document.getElementById('pda-tri-qty-input');if(el){el.focus();el.select();}},50);
}

function closePdaTransferInQtyModal(){
    const m=document.getElementById('pda-tri-qty-modal');
    if(m)m.remove();
}

function confirmPdaTransferInQty(){
    const el=document.getElementById('pda-tri-qty-input');
    const v=el?parseInt(el.value||'0',10):0;
    _pdaTransferInQty=(isNaN(v)||v<0)?0:v;
    closePdaTransferInQtyModal();
    refreshWarehousePdaPrototype();
    showToast(tr('入库件数已更新'));
}

function applyPdaTransferInWaybill(){
    const input=document.getElementById('pda-tri-key');
    if(!input)return;
    const val=(input.value||'').trim();
    if(!val)return;
    const target=_pdaTransferInWaybills.find(function(w){return w.wb===val;});
    if(!target){
        showToast(tr('该运单号不在待入库列表内'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    if(_pdaTransferInScannedSet[val]){
        showToast(tr('该运单已扫描'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    openPdaTransferInBindModal(val);
}

function openPdaTransferInBindModal(wb){
    const w=_pdaTransferInWaybills.find(function(x){return x.wb===wb;});
    if(!w)return;
    const old=document.getElementById('pda-tri-bind-modal');
    if(old)old.remove();
    const modal=document.createElement('div');
    modal.id='pda-tri-bind-modal';
    modal.dataset.wb=wb;
    modal.className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6';
    modal.innerHTML='<div class="w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl">'
        +'<div class="text-sm font-semibold text-text-primary mb-3">'+tr('绑定托盘号 / 库位库区')+'</div>'
        +'<div class="text-xs text-text-secondary mb-1">'+tr('运单号')+'</div>'
        +'<input type="text" readonly value="'+esc(wb)+'" class="w-full h-10 px-3 mb-3 rounded-lg border border-surface-200 bg-surface-50 text-sm text-text-primary">'
        +'<div class="text-xs text-text-secondary mb-1">'+tr('托盘号')+'</div>'
        +'<input id="pda-tri-bind-pallet" type="text" value="'+esc(w.pallet||'')+'" placeholder="'+tr('请扫描或输入托盘号')+'" class="w-full h-10 px-3 mb-3 rounded-lg border border-surface-200 text-sm text-text-primary">'
        +'<div class="text-xs text-text-secondary mb-1">'+tr('库位库区')+'</div>'
        +'<input id="pda-tri-bind-zone" type="text" value="'+esc(w.zone||'')+'" placeholder="'+tr('请输入库位库区')+'" class="w-full h-10 px-3 mb-3 rounded-lg border border-surface-200 text-sm text-text-primary">'
        +'<div class="grid grid-cols-2 gap-2"><button type="button" onclick="closePdaTransferInBindModal()" class="h-10 rounded-lg bg-surface-100 text-text-secondary text-sm">'+tr('取消')+'</button><button type="button" onclick="confirmPdaTransferInBind()" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('确认')+'</button></div>'
        +'</div>';
    document.body.appendChild(modal);
    setTimeout(function(){var el=document.getElementById('pda-tri-bind-pallet');if(el){el.focus();el.select();}},50);
}

function closePdaTransferInBindModal(){
    const m=document.getElementById('pda-tri-bind-modal');
    if(m)m.remove();
    setTimeout(function(){var el=document.getElementById('pda-tri-key');if(el){el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));el.focus();}},30);
}

function confirmPdaTransferInBind(){
    const modal=document.getElementById('pda-tri-bind-modal');
    if(!modal)return;
    const wb=modal.dataset.wb||'';
    const palletEl=document.getElementById('pda-tri-bind-pallet');
    const zoneEl=document.getElementById('pda-tri-bind-zone');
    const pallet=palletEl?(palletEl.value||'').trim():'';
    const zone=zoneEl?(zoneEl.value||'').trim():'';
    if(!pallet){showToast(tr('请填写托盘号'));return;}
    if(!zone){showToast(tr('请填写库位库区'));return;}
    const w=_pdaTransferInWaybills.find(function(x){return x.wb===wb;});
    if(w){w.pallet=pallet;w.zone=zone;}
    _pdaTransferInScannedSet[wb]=true;
    _pdaTransferInActiveTab='scanned';
    modal.remove();
    refreshWarehousePdaPrototype();
    showToast(tr('已绑定，进入已扫描'));
}

function generatePdaTransferInScreen(){
    const mode=_pdaTransferInMode||'order';
    const modeBtn=function(key,label){
        const on=mode===key;
        return '<button type="button" onclick="switchPdaTransferInMode(\''+key+'\')" class="h-8 rounded-lg text-xs font-medium '+(on?'bg-primary-600 text-white':'bg-white border border-surface-200 text-text-secondary')+'">'+tr(label)+'</button>';
    };
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50">';
    h+='<div class="mb-3">'+pdaScanInput('pda-tri-alloc','请扫描调拨单号','showToast','TR-20260613001')+'</div>';
    h+='<div class="grid grid-cols-2 gap-2 mb-3">'+modeBtn('order','按调拨单入库')+modeBtn('ticket','按票入库')+'</div>';
    if(mode==='order'){
        h+='<section class="rounded-xl border border-surface-200 bg-white p-3 space-y-3">';
        h+='<div class="text-sm font-semibold text-text-primary">'+tr('调拨单信息')+'</div>';
        h+=pdaInfoList([['调拨单号','TR-20260613001'],['票数','3'],['件数','12'],['入库件数',String(_pdaTransferInQty||0)]]);
        h+='<button type="button" onclick="openPdaTransferInQtyModal()" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('核验入库件数')+'</button>';
        h+='</section>';
    }else{
        h+=pdaScanInput('pda-tri-key','请扫描或输入运单号','applyPdaTransferInWaybill','WB-20260613001');
        const pending=_pdaTransferInWaybills.filter(function(w){return !_pdaTransferInScannedSet[w.wb];});
        const scanned=_pdaTransferInWaybills.filter(function(w){return _pdaTransferInScannedSet[w.wb];});
        const active=_pdaTransferInActiveTab==='scanned'?scanned:pending;
        const tabBtn=function(key,label,n){
            const on=_pdaTransferInActiveTab===key;
            return '<button type="button" onclick="switchPdaTransferInTab(\''+key+'\')" class="h-10 rounded-lg text-sm font-medium '+(on?'bg-primary-600 text-white':'bg-white text-text-secondary border border-surface-200')+'">'+tr(label)+'（'+n+'）</button>';
        };
        h+='<div class="grid grid-cols-2 gap-2 mt-3 mb-3">'+tabBtn('pending','待扫描',pending.length)+tabBtn('scanned','已扫描',scanned.length)+'</div>';
        if(active.length===0){
            h+='<div class="rounded-xl border border-surface-200 bg-white py-8 text-center text-xs text-text-muted">'+tr(_pdaTransferInActiveTab==='scanned'?'暂无已扫描运单':'已全部扫描完毕')+'</div>';
        }else{
            h+='<div class="space-y-3">';
            active.forEach(function(w){
                h+='<div class="rounded-xl border border-surface-200 bg-white p-3"><div class="grid grid-cols-2 gap-y-1 text-xs">';
                h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(w.wb)+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('件数')+'</div><div class="font-medium text-text-primary mt-0.5">'+(w.pcs||0)+'</div></div>';
                if(_pdaTransferInActiveTab==='scanned'){
                    h+='<div><div class="text-text-secondary">'+tr('托盘号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(w.pallet||'')+'</div></div>';
                    h+='<div><div class="text-text-secondary">'+tr('库位库区')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(w.zone||'')+'</div></div>';
                }
                h+='</div></div>';
            });
            h+='</div>';
        }
    }
    h+='</div>';
    h+=pdaBottomActions({primary:'确认入库'});
    return h;
}

/* ===== 调拨出库 wh-transfer-out（按图重写：list / operate 两屏 state machine） ===== */
var _pdaTransferOutView='list';
var _pdaTransferOutCurrent=null;
var _pdaTransferOutScannedSet={};
var _pdaTransferOutActiveTab='pending';

var _pdaTransferOutList=[
    {no:'DB260304001',pcs:10,carrier:'测试装车服务商',plate:'粤B66666',remark:'测试调拨出库备注',toWh:'佛山仓',
        waybills:[
            {wb:'WB-20260403001',pcs:5,pallet:'TP20260404001',zone:'A1'},
            {wb:'WB-20260403002',pcs:5,pallet:'TP20260404002',zone:'A2'}
        ]
    },
    {no:'DB260304002',pcs:10,carrier:'测试装车服务商',plate:'粤B66666',remark:'测试调拨出库备注',toWh:'佛山仓',
        waybills:[
            {wb:'WB-20260403003',pcs:4,pallet:'TP20260404005',zone:'B1'},
            {wb:'WB-20260403004',pcs:6,pallet:'TP20260404006',zone:'B2'}
        ]
    },
    {no:'DB260304003',pcs:10,carrier:'测试装车服务商',plate:'粤B66666',remark:'测试调拨出库备注',toWh:'佛山仓',
        waybills:[
            {wb:'WB-20260403005',pcs:5,pallet:'TP20260404008',zone:'C1'},
            {wb:'WB-20260403006',pcs:5,pallet:'TP20260404009',zone:'C2'}
        ]
    }
];

function generatePdaTransferOutScreen(){
    if(_pdaTransferOutView==='operate'&&_pdaTransferOutCurrent!==null&&_pdaTransferOutList[_pdaTransferOutCurrent]){
        return generatePdaTransferOutOperate();
    }
    return generatePdaTransferOutList();
}

function generatePdaTransferOutList(){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+=pdaScanInput('pda-tro-order','请扫描出库单号','applyPdaTransferOutOrder','DB260304001');
    _pdaTransferOutList.forEach(function(item,i){
        h+='<button type="button" onclick="pickPdaTransferOutCard('+i+')" class="block w-full text-left rounded-xl border border-surface-200 bg-white p-3 shadow-sm">';
        h+='<div class="grid grid-cols-2 gap-y-2 text-xs">';
        h+='<div><div class="text-text-secondary">'+tr('调拨出库单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.no)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('调拨件数')+'</div><div class="font-medium text-text-primary mt-0.5">'+item.pcs+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('装车服务商')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.carrier)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('车牌号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.plate)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('调拨出库备注')+'</div><div class="text-rose-500 mt-0.5 break-all">'+esc(item.remark)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('收货仓')+'</div><div class="text-emerald-600 font-medium mt-0.5 break-all">'+esc(item.toWh)+'</div></div>';
        h+='</div></button>';
    });
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-调拨出库"，了解详细逻辑。')+'</div>';
    h+='</div>';
    setTimeout(function(){var el=document.getElementById('pda-tro-order');if(el)el.focus();},50);
    return h;
}

function applyPdaTransferOutOrder(){
    const input=document.getElementById('pda-tro-order');
    if(!input)return;
    const val=(input.value||'').trim();
    let idx=-1;
    if(val)idx=_pdaTransferOutList.findIndex(function(it){return it.no===val;});
    if(idx<0)idx=0;
    pickPdaTransferOutCard(idx);
}

function pickPdaTransferOutCard(i){
    const item=_pdaTransferOutList[i];
    if(!item)return;
    _pdaTransferOutCurrent=i;
    _pdaTransferOutScannedSet={};
    _pdaTransferOutActiveTab='pending';
    _pdaTransferOutView='operate';
    refreshWarehousePdaPrototype();
}

function backPdaTransferOutList(){
    _pdaTransferOutView='list';
    _pdaTransferOutCurrent=null;
    refreshWarehousePdaPrototype();
}

function switchPdaTransferOutTab(t){
    _pdaTransferOutActiveTab=t;
    refreshWarehousePdaPrototype();
}

function generatePdaTransferOutOperate(){
    const item=_pdaTransferOutList[_pdaTransferOutCurrent];
    const pending=item.waybills.filter(function(w){return !_pdaTransferOutScannedSet[w.wb];});
    const scanned=item.waybills.filter(function(w){return _pdaTransferOutScannedSet[w.wb];});
    const active=_pdaTransferOutActiveTab==='scanned'?scanned:pending;
    const tabBtn=function(key,label,n){
        const on=_pdaTransferOutActiveTab===key;
        return '<button type="button" onclick="switchPdaTransferOutTab(\''+key+'\')" class="h-10 rounded-lg text-sm font-medium '+(on?'bg-primary-600 text-white':'bg-white text-text-secondary border border-surface-200')+'">'+tr(label)+'（'+n+'）</button>';
    };
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+='<div class="flex items-center gap-2 text-xs"><span class="text-text-secondary w-16 flex-shrink-0">'+tr('出库单号')+'</span><input type="text" readonly value="'+esc(item.no)+'" class="flex-1 min-w-0 h-10 px-3 rounded-xl border border-surface-200 bg-white text-text-primary"></div>';
    h+=pdaScanInput('pda-tro-waybill','请扫描运单号','applyPdaTransferOutWaybill',pending[0]?pending[0].wb:'');
    h+='<div class="grid grid-cols-2 gap-2">'+tabBtn('pending','待扫描',pending.length)+tabBtn('scanned','已扫描',scanned.length)+'</div>';
    if(active.length===0){
        h+='<div class="rounded-xl border border-surface-200 bg-white py-8 text-center text-xs text-text-muted">'+tr(_pdaTransferOutActiveTab==='scanned'?'暂无已扫描运单':'已全部扫描完毕')+'</div>';
    }else{
        active.forEach(function(w){
            h+='<div class="rounded-xl border border-surface-200 bg-white p-3"><div class="grid grid-cols-2 gap-y-1 text-xs">';
            h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(w.wb)+'</div></div>';
            h+='<div><div class="text-text-secondary">'+tr('件数')+'</div><div class="font-medium text-text-primary mt-0.5">'+(w.pcs||0)+'</div></div>';
            h+='<div><div class="text-text-secondary">'+tr('托盘号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(w.pallet||'')+'</div></div>';
            h+='<div><div class="text-text-secondary">'+tr('库位库区')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(w.zone||'')+'</div></div>';
            h+='</div></div>';
        });
    }
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-调拨出库"，了解详细逻辑。')+'</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="finishPdaTransferOut()" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('一键出库完成')+'</button></div>';
    setTimeout(function(){var el=document.getElementById('pda-tro-waybill');if(el)el.focus();},50);
    return h;
}

function applyPdaTransferOutWaybill(){
    const input=document.getElementById('pda-tro-waybill');
    if(!input)return;
    const val=(input.value||'').trim();
    if(!val)return;
    const item=_pdaTransferOutList[_pdaTransferOutCurrent];
    const target=item.waybills.find(function(w){return w.wb===val;});
    if(!target){
        showToast(tr('该运单号不在待出库列表内'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    if(_pdaTransferOutScannedSet[val]){
        showToast(tr('该运单已扫描'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    _pdaTransferOutScannedSet[val]=true;
    const remaining=item.waybills.filter(function(w){return !_pdaTransferOutScannedSet[w.wb];});
    if(remaining.length===0)showToast(tr('已全部扫描完毕，可点击一键出库完成'));
    _pdaTransferOutActiveTab='scanned';
    refreshWarehousePdaPrototype();
}

function finishPdaTransferOut(){
    const item=_pdaTransferOutList[_pdaTransferOutCurrent];
    if(!item)return;
    item.waybills.forEach(function(w){_pdaTransferOutScannedSet[w.wb]=true;});
    showToast(tr('一键出库完成，调拨单已提交出库'));
    refreshWarehousePdaPrototype();
}

// 空运出库扫描：先扫出库单，再以袋号扫描出库
function pdaAirOutBags(){
    return [['BAG-ET605-001','12','86.5'],['BAG-ET605-002','8','64.0'],['BAG-ET605-003','15','102.5']];
}
function pdaAirOutBagCard(row,scanned){
    return '<div data-airout-bag="'+esc(row[0])+'" class="rounded-lg border '+(scanned?'border-primary-200 bg-primary-50':'border-surface-100 bg-surface-50')+' px-3 py-2 text-xs"><div class="font-semibold text-primary-700 break-all">'+tr('袋号')+'：'+esc(row[0])+'</div><div class="mt-1 grid grid-cols-2 gap-2 text-text-muted"><span class="break-all">'+tr('袋内件数')+'：'+esc(row[1])+'</span><span class="break-all">'+tr('袋重(KG)')+'：'+esc(row[2])+'</span></div></div>';
}
function showPdaAirOutWork(){
    const input=document.getElementById('pda-airout-order-key');
    if(input&&!input.value)input.value='SO-20260613001';
    const work=document.getElementById('pda-airout-work');
    const empty=document.getElementById('pda-airout-order-empty');
    const confirm=document.getElementById('pda-airout-confirm-bar');
    if(work)work.classList.remove('hidden');
    if(empty)empty.classList.add('hidden');
    if(confirm)confirm.classList.remove('hidden');
    updatePdaAirOutSummary();
}
function addPdaAirOutBag(){
    const input=document.getElementById('pda-airout-key');
    const pending=document.getElementById('pda-airout-pending');
    const done=document.getElementById('pda-airout-done');
    if(!pending||!done)return;
    const val=(input&&input.value)?input.value.trim():'';
    let card=val?pending.querySelector('[data-airout-bag="'+val+'"]'):null;
    if(!card)card=pending.querySelector('[data-airout-bag]');
    if(!card){showToast(tr('待出库袋号已全部扫描'));}
    else{done.appendChild(card);card.className='rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs';}
    if(input){input.value='';togglePdaScanClear('pda-airout-key');}
    updatePdaAirOutSummary();
}
function updatePdaAirOutSummary(){
    const pendingCount=document.querySelectorAll('#pda-airout-pending [data-airout-bag]').length;
    const doneCount=document.querySelectorAll('#pda-airout-done [data-airout-bag]').length;
    const c=document.getElementById('pda-airout-count');if(c)c.textContent=doneCount;
    const pc=document.getElementById('pda-airout-pending-count');if(pc)pc.textContent=pendingCount;
    const dc=document.getElementById('pda-airout-done-count');if(dc)dc.textContent=doneCount;
    const pe=document.getElementById('pda-airout-pending-empty');if(pe)pe.classList.toggle('hidden',pendingCount>0);
    const de=document.getElementById('pda-airout-done-empty');if(de)de.classList.toggle('hidden',doneCount>0);
}
function generatePdaAirOutScanScreen(){
    const bags=pdaAirOutBags();
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50">';
    h+=pdaScanInput('pda-airout-order-key','请扫描或输入出库单号','showPdaAirOutWork','SO-20260613001');
    h+='<div id="pda-airout-order-empty" class="rounded-xl border border-dashed border-surface-200 bg-white p-5 text-center text-sm text-text-muted">'+tr('输入或扫码出库单号后展示出库汇总和袋号')+'</div>';
    h+='<div id="pda-airout-work" class="hidden">';
    h+='<section class="rounded-xl border border-primary-100 bg-primary-50 p-3 mb-3"><div class="text-sm font-semibold text-primary-700 mb-2">'+tr('出库汇总')+'</div><div class="grid grid-cols-2 gap-2 text-xs text-primary-700"><div class="break-all">'+tr('出库单号')+'：SO-20260613001</div><div class="break-all">'+tr('航班号')+'：ET605</div><div class="break-all">'+tr('目的机场')+'：LOS</div><div class="break-all">'+tr('袋数')+'：'+bags.length+'</div><div class="break-all">'+tr('已扫描袋数')+'：<span id="pda-airout-count">0</span></div></div></section>';
    h+=pdaScanInput('pda-airout-key','请扫描袋号','addPdaAirOutBag','BAG-ET605-001');
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3 mb-3"><div class="flex items-center justify-between mb-2"><div class="text-sm font-semibold text-text-primary">'+tr('待出库袋号')+'</div><span class="text-xs text-text-muted">'+tr('共')+' <span id="pda-airout-pending-count">0</span> '+tr('袋')+'</span></div><div id="pda-airout-pending" class="space-y-2">';
    bags.forEach(function(row){h+=pdaAirOutBagCard(row,false);});
    h+='</div><div id="pda-airout-pending-empty" class="hidden text-center text-xs text-text-muted py-3">'+tr('待出库袋号已全部扫描')+'</div></section>';
    h+='<section class="rounded-xl border border-primary-100 bg-primary-50/40 p-3 mb-3"><div class="flex items-center justify-between mb-2"><div class="text-sm font-semibold text-primary-700">'+tr('已扫描出库袋号')+'</div><span class="text-xs text-primary-600">'+tr('共')+' <span id="pda-airout-done-count">0</span> '+tr('袋')+'</span></div><div id="pda-airout-done" class="space-y-2"></div><div id="pda-airout-done-empty" class="text-center text-xs text-text-muted py-3">'+tr('扫描袋号后移动到此处')+'</div></section>';
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('出库信息')+'</div><div class="space-y-3">';
    h+=pdaField({label:'备注',type:'textarea',placeholder:'请输入出库备注内容'});
    h+='</div>'+pdaPhotoUploader(5)+'</section>';
    h+='</div>';
    h+='</div>';
    h+='<div id="pda-airout-confirm-bar" class="hidden sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="showToast(\''+tr('空运出库成功')+'\')" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('确认出库')+'</button></div>';
    return h;
}

var _pdaPalletBindRows=[
    {pallet:'TP20260404003',zone:'A1',editable:false},
    {pallet:'TP20260404004',zone:'',editable:true}
];
var _pdaPalletBindLoaded=false;
var _pdaPalletBindFromAlloc='';
var _pdaPalletBindDirectLoad='否';

/* ===== 找货扫描 pda-find-scan ===== */
var _pdaFindScanView='list';
var _pdaFindScanCurrent=null;
var _pdaFindScanScannedSet={};
var _pdaFindScanActiveTab='pending';
var _pdaFindScanMode='pallet';

var _pdaFindScanList=[
    {no:'ZPC0303-美森正班-A3',label:'ZPC202604040001',pcs:10,eta:'2026-03-04 12:00:00',remark:'测试排柜备注',
        pallets:[
            {pallet:'TP20260404001',zone:'A1',pcs:3},
            {pallet:'TP20260404002',zone:'A2',pcs:2},
            {pallet:'TP20260404003',zone:'A3',pcs:3},
            {pallet:'TP20260404004',zone:'A4',pcs:2}
        ],
        defaultScanned:['TP20260404003','TP20260404004'],
        waybills:[
            {wb:'WB-20260403001',pcs:5,pallet:'TP20260404001',zone:'A1'},
            {wb:'WB-20260403002',pcs:5,pallet:'TP20260404003',zone:'A3'}
        ],
        pieces:[
            {sub:'SUB-A3001',wb:'WB-20260403001',pallet:'TP20260404001',zone:'A1'},
            {sub:'SUB-A3002',wb:'WB-20260403001',pallet:'TP20260404002',zone:'A2'},
            {sub:'SUB-A3003',wb:'WB-20260403002',pallet:'TP20260404003',zone:'A3'},
            {sub:'SUB-A3004',wb:'WB-20260403002',pallet:'TP20260404004',zone:'A4'}
        ]
    },
    {no:'ZPC0303-美森正班-A4',label:'ZPC202604040002',pcs:10,eta:'2026-03-04 12:00:00',remark:'测试排柜备注',
        pallets:[
            {pallet:'TP20260404005',zone:'B1',pcs:4},
            {pallet:'TP20260404006',zone:'B2',pcs:3},
            {pallet:'TP20260404007',zone:'B3',pcs:3}
        ],
        defaultScanned:[],
        waybills:[
            {wb:'WB-20260403003',pcs:10,pallet:'TP20260404005',zone:'B1'}
        ],
        pieces:[
            {sub:'SUB-A4001',wb:'WB-20260403003',pallet:'TP20260404005',zone:'B1'},
            {sub:'SUB-A4002',wb:'WB-20260403003',pallet:'TP20260404006',zone:'B2'},
            {sub:'SUB-A4003',wb:'WB-20260403003',pallet:'TP20260404007',zone:'B3'}
        ]
    },
    {no:'ZPC0303-美森正班-A5',label:'ZPC202604040003',pcs:10,eta:'2026-03-04 12:00:00',remark:'测试排柜备注',
        pallets:[
            {pallet:'TP20260404008',zone:'C1',pcs:5},
            {pallet:'TP20260404009',zone:'C2',pcs:5}
        ],
        defaultScanned:[],
        waybills:[
            {wb:'WB-20260403004',pcs:5,pallet:'TP20260404008',zone:'C1'},
            {wb:'WB-20260403005',pcs:5,pallet:'TP20260404009',zone:'C2'}
        ],
        pieces:[
            {sub:'SUB-A5001',wb:'WB-20260403004',pallet:'TP20260404008',zone:'C1'},
            {sub:'SUB-A5002',wb:'WB-20260403005',pallet:'TP20260404009',zone:'C2'}
        ]
    }
];

function generatePdaFindScanScreen(){
    if(_pdaFindScanView==='operate'&&_pdaFindScanCurrent!==null&&_pdaFindScanList[_pdaFindScanCurrent]){
        return generatePdaFindScanOperate();
    }
    return generatePdaFindScanList();
}

function generatePdaFindScanList(){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+=pdaScanInput('pda-find-scan-alloc','请扫描配舱号/标签号','applyPdaFindScanAlloc','ZPC0303-美森正班-A3');
    _pdaFindScanList.forEach(function(item,i){
        h+='<button type="button" onclick="pickPdaFindScanCard('+i+')" class="block w-full text-left rounded-xl border border-surface-200 bg-white p-3 shadow-sm">';
        h+='<div class="grid grid-cols-2 gap-y-2 text-xs">';
        h+='<div><div class="text-text-secondary">'+tr('配舱单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.no)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('配舱件数')+'</div><div class="font-medium text-text-primary mt-0.5">'+item.pcs+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('标签号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.label)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('预计装柜时间')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(item.eta)+'</div></div>';
        h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('排柜备注')+'</div><div class="text-rose-500 mt-0.5">'+esc(item.remark)+'</div></div>';
        h+='</div></button>';
    });
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-找货扫描"，了解详细逻辑。')+'</div>';
    h+='</div>';
    setTimeout(function(){var el=document.getElementById('pda-find-scan-alloc');if(el)el.focus();},50);
    return h;
}

function applyPdaFindScanAlloc(){
    const input=document.getElementById('pda-find-scan-alloc');
    if(!input)return;
    const val=(input.value||'').trim();
    let idx=-1;
    if(val){
        idx=_pdaFindScanList.findIndex(function(it){return it.no===val||it.label===val;});
    }
    if(idx<0)idx=0;
    pickPdaFindScanCard(idx);
}

function pickPdaFindScanCard(i){
    const item=_pdaFindScanList[i];
    if(!item)return;
    _pdaFindScanCurrent=i;
    _pdaFindScanScannedSet={};
    (item.defaultScanned||[]).forEach(function(p){_pdaFindScanScannedSet[p]=true;});
    _pdaFindScanActiveTab='pending';
    _pdaFindScanMode='pallet';
    _pdaFindScanView='operate';
    refreshWarehousePdaPrototype();
}

function backPdaFindScanList(){
    _pdaFindScanView='list';
    _pdaFindScanCurrent=null;
    refreshWarehousePdaPrototype();
}

function switchPdaFindScanTab(t){
    _pdaFindScanActiveTab=t;
    refreshWarehousePdaPrototype();
}

function setPdaFindScanMode(m){
    _pdaFindScanMode=m||'pallet';
    _pdaFindScanActiveTab='pending';
    refreshWarehousePdaPrototype();
}

function generatePdaFindScanOperate(){
    const item=_pdaFindScanList[_pdaFindScanCurrent];
    const mode=_pdaFindScanMode||'pallet';
    const isScanned=function(rec){return !!_pdaFindScanScannedSet[rec.pallet||''];};
    let units;
    if(mode==='waybill')units=item.waybills||[];
    else if(mode==='piece')units=item.pieces||[];
    else units=item.pallets||[];
    const pending=units.filter(function(u){return !isScanned(u);});
    const scanned=units.filter(function(u){return isScanned(u);});
    const active=_pdaFindScanActiveTab==='scanned'?scanned:pending;
    const tabBtn=function(key,label,n){
        const on=_pdaFindScanActiveTab===key;
        return '<button type="button" onclick="switchPdaFindScanTab(\''+key+'\')" class="h-10 rounded-lg text-sm font-medium '+(on?'bg-primary-600 text-white':'bg-white text-text-secondary border border-surface-200')+'">'+tr(label)+'（'+n+'）</button>';
    };
    const modeBtn=function(key,label){
        const on=mode===key;
        return '<label class="flex items-center gap-1 text-xs cursor-pointer whitespace-nowrap"><input type="radio" name="pda-find-scan-mode" value="'+key+'"'+(on?' checked':'')+' onchange="setPdaFindScanMode(\''+key+'\')" class="accent-primary-600">'+tr(label)+'</label>';
    };
    let scanPh='请扫描托盘号';
    let scanInit=pending[0]?(pending[0].pallet||''):'TP20260404001';
    if(mode==='waybill'){scanPh='请扫描运单号';scanInit=pending[0]?(pending[0].wb||''):'';}
    else if(mode==='piece'){scanPh='请扫描子单号';scanInit=pending[0]?(pending[0].sub||''):'';}
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+='<div class="flex items-center gap-2 text-xs"><span class="text-text-secondary w-16 flex-shrink-0">'+tr('配舱号')+'</span><input type="text" readonly value="'+esc(item.no)+'" class="flex-1 min-w-0 h-10 px-3 rounded-xl border border-surface-200 bg-white text-text-primary"></div>';
    h+='<div class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-xs text-text-secondary mb-2">'+tr('扫描模式')+'</div><div class="flex items-center justify-between gap-2">'+modeBtn('pallet','按托盘/袋')+modeBtn('waybill','按整票')+modeBtn('piece','按件/箱')+'</div></div>';
    h+=pdaScanInput('pda-find-scan-pallet',scanPh,'applyPdaFindScanPallet',scanInit);
    h+='<div class="grid grid-cols-2 gap-2">'+tabBtn('pending','待扫描',pending.length)+tabBtn('scanned','已扫描',scanned.length)+'</div>';
    if(active.length===0){
        h+='<div class="rounded-xl border border-surface-200 bg-white py-8 text-center text-xs text-text-muted">'+tr(_pdaFindScanActiveTab==='scanned'?'暂无已扫描':'已全部扫描完毕')+'</div>';
    }else{
        active.forEach(function(rec){
            h+='<div class="rounded-xl border border-surface-200 bg-white p-3"><div class="grid grid-cols-2 gap-y-1 text-xs">';
            if(mode==='pallet'){
                h+='<div><div class="text-text-secondary">'+tr('托盘号/袋号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.pallet||'')+'</div></div>';
                if(_pdaFindScanActiveTab==='scanned'){
                    h+='<div><div class="text-text-secondary">'+tr('件数')+'</div><div class="font-medium text-text-primary mt-0.5">'+(rec.pcs||0)+'</div></div>';
                }
                h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('库位库区')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(rec.zone||'')+'</div></div>';
            }else if(mode==='waybill'){
                h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.wb||'')+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('件数')+'</div><div class="font-medium text-text-primary mt-0.5">'+(rec.pcs||0)+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('托盘号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.pallet||'')+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('库位库区')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(rec.zone||'')+'</div></div>';
            }else{
                h+='<div><div class="text-text-secondary">'+tr('子单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.sub||'')+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.wb||'')+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('托盘号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.pallet||'')+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('库位库区')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(rec.zone||'')+'</div></div>';
            }
            h+='</div></div>';
        });
    }
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-找货扫描"，了解详细逻辑。')+'</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><div class="grid grid-cols-2 gap-2">';
    h+='<button type="button" onclick="onePdaFindScanFinish()" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('一键完成')+'</button>';
    h+='<button type="button" onclick="goPdaFindScanPalletBind()" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('配舱上托')+'</button>';
    h+='</div></div>';
    setTimeout(function(){var el=document.getElementById('pda-find-scan-pallet');if(el)el.focus();},50);
    return h;
}

function applyPdaFindScanPallet(){
    const input=document.getElementById('pda-find-scan-pallet');
    if(!input)return;
    const val=(input.value||'').trim();
    if(!val)return;
    const item=_pdaFindScanList[_pdaFindScanCurrent];
    const target=item.pallets.find(function(p){return p.pallet===val;});
    if(!target){
        showToast(tr('该托盘号不在待扫描列表内'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    if(_pdaFindScanScannedSet[val]){
        showToast(tr('该托盘已扫描'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    _pdaFindScanScannedSet[val]=true;
    const remaining=item.pallets.filter(function(p){return !_pdaFindScanScannedSet[p.pallet];});
    if(remaining.length===0){
        showToast(tr('配舱已更新为「可出仓」'));
    }
    _pdaFindScanActiveTab='scanned';
    refreshWarehousePdaPrototype();
    setTimeout(function(){var el=document.getElementById('pda-find-scan-pallet');if(el){el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));el.focus();}},80);
}

function onePdaFindScanFinish(){
    const item=_pdaFindScanList[_pdaFindScanCurrent];
    const remaining=item.pallets.filter(function(p){return !_pdaFindScanScannedSet[p.pallet];});
    if(remaining.length>0&&item.waybills&&item.waybills.length){
        const first=item.waybills[0];
        const wbNo=(typeof first==='string')?first:(first.wb||'');
        showToast(tr('运单号*')+wbNo+tr('*运单未绑定托盘！'));
        return;
    }
    item.pallets.forEach(function(p){_pdaFindScanScannedSet[p.pallet]=true;});
    showToast(tr('一键完成提交成功，所有运单托盘已自动标识扫描'));
    refreshWarehousePdaPrototype();
}

function goPdaFindScanPalletBind(){
    const item=_pdaFindScanList[_pdaFindScanCurrent];
    _pdaPalletBindFromAlloc=item?item.no:'';
    _pdaPalletBindDirectLoad='否';
    openWarehousePdaTask('pda-pallet-bind');
}

/* ===== 装柜扫描 pda-load-scan（找货扫描镜像，独立 state） ===== */
var _pdaLoadScanView='list';
var _pdaLoadScanCurrent=null;
var _pdaLoadScanScannedSet={};
var _pdaLoadScanActiveTab='pending';
var _pdaLoadScanMode='pallet';
var _pdaLoadScanList=[
    {no:'ZPC0303-美森正班-A3',label:'ZPC202604040001',pcs:10,eta:'2026-03-04 12:00:00',remark:'测试排柜备注',
        pallets:[
            {pallet:'TP20260404001',zone:'A1',pcs:3},
            {pallet:'TP20260404002',zone:'A2',pcs:2},
            {pallet:'TP20260404003',zone:'A3',pcs:3},
            {pallet:'TP20260404004',zone:'A4',pcs:2}
        ],
        defaultScanned:[],
        waybills:[
            {wb:'WB-20260403001',pcs:5,pallet:'TP20260404001',zone:'A1'},
            {wb:'WB-20260403002',pcs:5,pallet:'TP20260404003',zone:'A3'}
        ],
        pieces:[
            {sub:'SUB-A3001',wb:'WB-20260403001',pallet:'TP20260404001',zone:'A1'},
            {sub:'SUB-A3002',wb:'WB-20260403001',pallet:'TP20260404002',zone:'A2'},
            {sub:'SUB-A3003',wb:'WB-20260403002',pallet:'TP20260404003',zone:'A3'},
            {sub:'SUB-A3004',wb:'WB-20260403002',pallet:'TP20260404004',zone:'A4'}
        ]
    },
    {no:'ZPC0303-美森正班-A4',label:'ZPC202604040002',pcs:10,eta:'2026-03-04 12:00:00',remark:'测试排柜备注',
        pallets:[
            {pallet:'TP20260404005',zone:'B1',pcs:4},
            {pallet:'TP20260404006',zone:'B2',pcs:3},
            {pallet:'TP20260404007',zone:'B3',pcs:3}
        ],
        defaultScanned:[],
        waybills:[
            {wb:'WB-20260403003',pcs:10,pallet:'TP20260404005',zone:'B1'}
        ],
        pieces:[
            {sub:'SUB-A4001',wb:'WB-20260403003',pallet:'TP20260404005',zone:'B1'},
            {sub:'SUB-A4002',wb:'WB-20260403003',pallet:'TP20260404006',zone:'B2'},
            {sub:'SUB-A4003',wb:'WB-20260403003',pallet:'TP20260404007',zone:'B3'}
        ]
    },
    {no:'ZPC0303-美森正班-A5',label:'ZPC202604040003',pcs:10,eta:'2026-03-04 12:00:00',remark:'测试排柜备注',
        pallets:[
            {pallet:'TP20260404008',zone:'C1',pcs:5},
            {pallet:'TP20260404009',zone:'C2',pcs:5}
        ],
        defaultScanned:[],
        waybills:[
            {wb:'WB-20260403004',pcs:5,pallet:'TP20260404008',zone:'C1'},
            {wb:'WB-20260403005',pcs:5,pallet:'TP20260404009',zone:'C2'}
        ],
        pieces:[
            {sub:'SUB-A5001',wb:'WB-20260403004',pallet:'TP20260404008',zone:'C1'},
            {sub:'SUB-A5002',wb:'WB-20260403005',pallet:'TP20260404009',zone:'C2'}
        ]
    }
];

function generatePdaLoadScanScreen(){
    if(_pdaLoadScanView==='operate'&&_pdaLoadScanCurrent!==null&&_pdaLoadScanList[_pdaLoadScanCurrent]){
        return generatePdaLoadScanOperate();
    }
    return generatePdaLoadScanList();
}

function generatePdaLoadScanList(){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+=pdaScanInput('pda-load-scan-alloc','请扫描配舱号/标签号','applyPdaLoadScanAlloc','ZPC0303-美森正班-A3');
    _pdaLoadScanList.forEach(function(item,i){
        h+='<button type="button" onclick="pickPdaLoadScanCard('+i+')" class="block w-full text-left rounded-xl border border-surface-200 bg-white p-3 shadow-sm">';
        h+='<div class="grid grid-cols-2 gap-y-2 text-xs">';
        h+='<div><div class="text-text-secondary">'+tr('配舱单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.no)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('配舱件数')+'</div><div class="font-medium text-text-primary mt-0.5">'+item.pcs+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('标签号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.label)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('预计装柜时间')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(item.eta)+'</div></div>';
        h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('排柜备注')+'</div><div class="text-rose-500 mt-0.5">'+esc(item.remark)+'</div></div>';
        h+='</div></button>';
    });
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-装柜扫描"，了解详细逻辑。')+'</div>';
    h+='</div>';
    setTimeout(function(){var el=document.getElementById('pda-load-scan-alloc');if(el)el.focus();},50);
    return h;
}

function applyPdaLoadScanAlloc(){
    const input=document.getElementById('pda-load-scan-alloc');
    if(!input)return;
    const val=(input.value||'').trim();
    let idx=-1;
    if(val){
        idx=_pdaLoadScanList.findIndex(function(it){return it.no===val||it.label===val;});
    }
    if(idx<0)idx=0;
    pickPdaLoadScanCard(idx);
}

function pickPdaLoadScanCard(i){
    const item=_pdaLoadScanList[i];
    if(!item)return;
    _pdaLoadScanCurrent=i;
    _pdaLoadScanScannedSet={};
    (item.defaultScanned||[]).forEach(function(p){_pdaLoadScanScannedSet[p]=true;});
    _pdaLoadScanActiveTab='pending';
    _pdaLoadScanMode='pallet';
    _pdaLoadScanView='operate';
    refreshWarehousePdaPrototype();
}

function switchPdaLoadScanTab(t){
    _pdaLoadScanActiveTab=t;
    refreshWarehousePdaPrototype();
}

function setPdaLoadScanMode(m){
    _pdaLoadScanMode=m||'pallet';
    _pdaLoadScanActiveTab='pending';
    refreshWarehousePdaPrototype();
}

function generatePdaLoadScanOperate(){
    const item=_pdaLoadScanList[_pdaLoadScanCurrent];
    const mode=_pdaLoadScanMode||'pallet';
    const isScanned=function(rec){return !!_pdaLoadScanScannedSet[rec.pallet||''];};
    let units;
    if(mode==='waybill')units=item.waybills||[];
    else if(mode==='piece')units=item.pieces||[];
    else units=item.pallets||[];
    const pending=units.filter(function(u){return !isScanned(u);});
    const scanned=units.filter(function(u){return isScanned(u);});
    const active=_pdaLoadScanActiveTab==='scanned'?scanned:pending;
    const tabBtn=function(key,label,n){
        const on=_pdaLoadScanActiveTab===key;
        return '<button type="button" onclick="switchPdaLoadScanTab(\''+key+'\')" class="h-10 rounded-lg text-sm font-medium '+(on?'bg-primary-600 text-white':'bg-white text-text-secondary border border-surface-200')+'">'+tr(label)+'（'+n+'）</button>';
    };
    const modeBtn=function(key,label){
        const on=mode===key;
        return '<label class="flex items-center gap-1 text-xs cursor-pointer whitespace-nowrap"><input type="radio" name="pda-load-scan-mode" value="'+key+'"'+(on?' checked':'')+' onchange="setPdaLoadScanMode(\''+key+'\')" class="accent-primary-600">'+tr(label)+'</label>';
    };
    let scanPh='请扫描托盘号';
    let scanInit=pending[0]?(pending[0].pallet||''):'TP20260404001';
    if(mode==='waybill'){scanPh='请扫描运单号';scanInit=pending[0]?(pending[0].wb||''):'';}
    else if(mode==='piece'){scanPh='请扫描子单号';scanInit=pending[0]?(pending[0].sub||''):'';}
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+='<div class="flex items-center gap-2 text-xs"><span class="text-text-secondary w-16 flex-shrink-0">'+tr('配舱号')+'</span><input type="text" readonly value="'+esc(item.no)+'" class="flex-1 min-w-0 h-10 px-3 rounded-xl border border-surface-200 bg-white text-text-primary"></div>';
    h+='<div class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-xs text-text-secondary mb-2">'+tr('扫描模式')+'</div><div class="flex items-center justify-between gap-2">'+modeBtn('pallet','按托盘/袋')+modeBtn('waybill','按整票')+modeBtn('piece','按件/箱')+'</div></div>';
    h+=pdaScanInput('pda-load-scan-pallet',scanPh,'applyPdaLoadScanPallet',scanInit);
    h+='<div class="grid grid-cols-2 gap-2">'+tabBtn('pending','待扫描',pending.length)+tabBtn('scanned','已扫描',scanned.length)+'</div>';
    if(active.length===0){
        h+='<div class="rounded-xl border border-surface-200 bg-white py-8 text-center text-xs text-text-muted">'+tr(_pdaLoadScanActiveTab==='scanned'?'暂无已扫描':'已全部扫描完毕')+'</div>';
    }else{
        active.forEach(function(rec){
            h+='<div class="rounded-xl border border-surface-200 bg-white p-3"><div class="grid grid-cols-2 gap-y-1 text-xs">';
            if(mode==='pallet'){
                h+='<div><div class="text-text-secondary">'+tr('托盘号/袋号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.pallet||'')+'</div></div>';
                if(_pdaLoadScanActiveTab==='scanned'){
                    h+='<div><div class="text-text-secondary">'+tr('件数')+'</div><div class="font-medium text-text-primary mt-0.5">'+(rec.pcs||0)+'</div></div>';
                }
                h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('库位库区')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(rec.zone||'')+'</div></div>';
            }else if(mode==='waybill'){
                h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.wb||'')+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('件数')+'</div><div class="font-medium text-text-primary mt-0.5">'+(rec.pcs||0)+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('托盘号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.pallet||'')+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('库位库区')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(rec.zone||'')+'</div></div>';
            }else{
                h+='<div><div class="text-text-secondary">'+tr('子单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.sub||'')+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.wb||'')+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('托盘号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(rec.pallet||'')+'</div></div>';
                h+='<div><div class="text-text-secondary">'+tr('库位库区')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(rec.zone||'')+'</div></div>';
            }
            h+='</div></div>';
        });
    }
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-装柜扫描"，了解详细逻辑。')+'</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><div class="grid grid-cols-2 gap-2">';
    h+='<button type="button" onclick="onePdaLoadScanFinish()" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('一键完成')+'</button>';
    h+='<button type="button" onclick="goPdaLoadScanPalletBind()" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('配舱上托')+'</button>';
    h+='</div></div>';
    setTimeout(function(){var el=document.getElementById('pda-load-scan-pallet');if(el)el.focus();},50);
    return h;
}

function applyPdaLoadScanPallet(){
    const input=document.getElementById('pda-load-scan-pallet');
    if(!input)return;
    const val=(input.value||'').trim();
    if(!val)return;
    const item=_pdaLoadScanList[_pdaLoadScanCurrent];
    const target=item.pallets.find(function(p){return p.pallet===val;});
    if(!target){
        showToast(tr('该托盘号不在待扫描列表内'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    if(_pdaLoadScanScannedSet[val]){
        showToast(tr('该托盘已扫描'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    _pdaLoadScanScannedSet[val]=true;
    const remaining=item.pallets.filter(function(p){return !_pdaLoadScanScannedSet[p.pallet];});
    if(remaining.length===0){
        showToast(tr('装柜已完成，可提交'));
    }
    _pdaLoadScanActiveTab='scanned';
    refreshWarehousePdaPrototype();
    setTimeout(function(){var el=document.getElementById('pda-load-scan-pallet');if(el){el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));el.focus();}},80);
}

function onePdaLoadScanFinish(){
    const item=_pdaLoadScanList[_pdaLoadScanCurrent];
    const remaining=item.pallets.filter(function(p){return !_pdaLoadScanScannedSet[p.pallet];});
    if(remaining.length>0&&item.waybills&&item.waybills.length){
        const first=item.waybills[0];
        const wbNo=(typeof first==='string')?first:(first.wb||'');
        showToast(tr('运单号*')+wbNo+tr('*运单未绑定托盘！'));
        return;
    }
    item.pallets.forEach(function(p){_pdaLoadScanScannedSet[p.pallet]=true;});
    showToast(tr('一键完成提交成功，所有运单托盘已自动标识装柜'));
    refreshWarehousePdaPrototype();
}

function goPdaLoadScanPalletBind(){
    const item=_pdaLoadScanList[_pdaLoadScanCurrent];
    _pdaPalletBindFromAlloc=item?item.no:'';
    _pdaPalletBindDirectLoad='否';
    openWarehousePdaTask('pda-pallet-bind');
}

/* ===== 装柜完成 pda-load-finish ===== */
function generatePdaLoadFinishScreen(){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+=pdaScanInput('pda-load-finish-key','请扫描终配舱号/标签号','showToast','ZPC202604040001');
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3"><div class="grid grid-cols-2 gap-y-3 text-xs">';
    h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('配舱单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">ZPC202604040001</div></div>';
    h+='<div><div class="text-text-secondary">'+tr('提单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">TD20260404001</div></div>';
    h+='<div><div class="text-text-secondary">'+tr('柜号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">GH20260404001</div></div>';
    h+='<div><div class="text-text-secondary">'+tr('补单件数')+'</div><div class="font-medium text-text-primary mt-0.5">0</div></div>';
    h+='<div><div class="text-text-secondary">'+tr('落货件数')+'</div><div class="font-medium text-text-primary mt-0.5">0</div></div>';
    h+='</div></section>';
    h+='<section class="rounded-xl border border-surface-200 bg-white p-3"><div class="text-xs text-rose-500 mb-2">'+tr('上传照片(最多上传20张，支持调用摄像头)')+'</div><div class="grid grid-cols-3 gap-2">';
    ['满柜照','半门照','封门照'].forEach(function(label){
        h+='<button type="button" onclick="showToast(\''+tr('打开相机')+'\')" class="aspect-square rounded-lg border border-dashed border-surface-300 bg-surface-50 flex flex-col items-center justify-center gap-1 text-text-muted"><span class="text-2xl leading-none">+</span><span class="text-[11px]">'+tr(label)+'</span></button>';
    });
    h+='</div><div class="text-right text-xs text-text-muted mt-2">0/20</div></section>';
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-装柜完成"，了解详细逻辑。')+'</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="showToast(\''+tr('装柜完成提交成功')+'\')" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('装柜完成')+'</button></div>';
    setTimeout(function(){var el=document.getElementById('pda-load-finish-key');if(el)el.focus();},50);
    return h;
}

/* ===== 分拣扫描 pda-sort-scan ===== */
var _pdaSortScanRule=null;
var _pdaSortScanBagNo='';
var _pdaSortScanItems=[];
var _pdaSortScanBagCounter=100;

function nextPdaSortScanBagNo(){
    _pdaSortScanBagCounter+=1;
    return 'BAG-20260627-'+String(_pdaSortScanBagCounter).padStart(4,'0');
}

function generatePdaSortScanScreen(){
    const rule=_pdaSortScanRule;
    const items=_pdaSortScanItems;
    const totalQty=items.reduce(function(a,o){return a+(o.qty||0);},0);
    const totalWeight=items.reduce(function(a,o){return a+(o.weight||0);},0);
    const totalVol=items.reduce(function(a,o){return a+(o.vol||0);},0);
    const max=(rule&&rule.maxWeight)||0;
    const pct=max>0?Math.min(100,Math.round(totalWeight/max*100)):0;
    const isOver=max>0&&totalWeight>=max;
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+=pdaScanInput('pda-sort-scan-key','请扫描运单号','applyPdaSortScanWaybill','');
    h+='<button type="button" onclick="openPdaSortScanBagModal()" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr(rule?'新增袋子（重设规则）':'新增袋子')+'</button>';
    if(rule){
        h+='<section class="rounded-xl border '+(isOver?'border-amber-300 bg-amber-50/60':'border-primary-100 bg-primary-50/60')+' p-3 space-y-2">';
        h+='<div class="text-xs font-semibold text-primary-700">'+tr('当前袋')+'：'+esc(_pdaSortScanBagNo)+'</div>';
        h+='<div class="grid grid-cols-2 gap-y-1 text-[11px]">';
        [['产品',rule.product],['货物类型',rule.cargoType],['最大体积(CBM)',rule.maxVol||'—'],['目的仓库',rule.warehouse]].forEach(function(p){
            h+='<div><span class="text-text-muted">'+tr(p[0])+'：</span><span class="font-medium text-text-primary">'+esc(p[1])+'</span></div>';
        });
        h+='</div>';
        h+='<div class="grid grid-cols-2 gap-y-1 text-[11px] mt-1">';
        h+='<div><span class="text-text-muted">'+tr('合计件数')+'：</span><span class="font-semibold text-primary-700">'+totalQty+'</span></div>';
        h+='<div><span class="text-text-muted">'+tr('合计体积(CBM)')+'：</span><span class="font-semibold text-primary-700">'+totalVol.toFixed(3)+'</span></div>';
        h+='<div class="col-span-2"><span class="text-text-muted">'+tr('合计重量(KG)')+'：</span><span class="font-semibold '+(isOver?'text-amber-700':'text-primary-700')+'">'+totalWeight.toFixed(2)+(max>0?(' / '+rule.maxWeight):'')+'</span></div>';
        h+='</div>';
        if(max>0){
            h+='<div class="h-2 rounded-full bg-surface-200 overflow-hidden"><div class="h-full '+(isOver?'bg-amber-500':'bg-primary-600')+'" style="width:'+pct+'%"></div></div>';
            h+='<div class="text-[11px] text-text-muted">'+pct+'%'+(isOver?' · '+tr('已满，建议封袋'):'')+'</div>';
        }
        h+='</section>';
        h+='<section class="rounded-xl border border-surface-200 bg-white">';
        h+='<div class="px-3 py-2 bg-surface-50 text-xs font-semibold text-text-secondary flex items-center justify-between"><span>'+tr('扫描列表')+'（'+items.length+' '+tr('票')+'）</span></div>';
        if(!items.length){
            h+='<div class="px-3 py-6 text-center text-xs text-text-muted">'+tr('暂无扫描记录，请扫描运单号')+'</div>';
        }else{
            h+='<div class="divide-y divide-surface-100">';
            items.forEach(function(o,i){
                h+='<div class="px-3 py-2 text-xs flex items-center justify-between gap-2">';
                h+='<div class="min-w-0 flex-1"><div class="font-medium text-primary-700 break-all">'+esc(o.wb)+'</div><div class="text-text-muted mt-0.5">'+tr('件数')+'：'+(o.qty||0)+' · '+tr('重量')+'：'+(o.weight||0).toFixed(2)+'KG · '+tr('体积(CBM)')+'：'+(o.vol||0).toFixed(3)+'</div></div>';
                h+='<button type="button" onclick="removePdaSortScanItem('+i+')" class="text-red-500 text-xs flex-shrink-0">'+tr('移除')+'</button>';
                h+='</div>';
            });
            h+='</div>';
        }
        h+='</section>';
    }
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-分拣扫描"，了解详细逻辑。')+'</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><div class="grid grid-cols-2 gap-2">';
    h+='<button type="button" onclick="finishPdaSortScan(true)" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('完成装袋并继续')+'</button>';
    h+='<button type="button" onclick="finishPdaSortScan(false)" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('完成装袋')+'</button>';
    h+='</div></div>';
    setTimeout(function(){var el=document.getElementById('pda-sort-scan-key');if(el)el.focus();},50);
    return h;
}

function openPdaSortScanBagModal(){
    const old=document.getElementById('pda-sort-scan-bag-modal');
    if(old)old.remove();
    const products=['西非海运专线','西非空运专线'];
    const cargoTypes=['普货','敏感货'];
    const warehouses=['拉各斯仓','达喀尔仓','阿比让仓','洛美仓','杜阿拉仓'];
    const cur=_pdaSortScanRule||{};
    const selOptions=function(opts,picked){var s='<option value="">'+esc(tr('请选择'))+'</option>';opts.forEach(function(o){s+='<option value="'+esc(o)+'"'+(o===picked?' selected':'')+'>'+esc(tr(o))+'</option>';});return s;};
    const modal=document.createElement('div');
    modal.id='pda-sort-scan-bag-modal';
    modal.className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4';
    modal.innerHTML='<div class="w-full rounded-2xl bg-white p-4 shadow-xl max-h-[90vh] overflow-y-auto" style="max-width:340px">'
        +'<div class="text-sm font-semibold text-text-primary mb-3">'+tr('新增袋子')+'</div>'
        +'<div class="grid grid-cols-2 gap-2">'
        +'<div><div class="text-xs text-text-secondary mb-1">'+tr('产品')+' *</div><select id="pda-sb-product" class="w-full h-9 px-2 text-xs border border-surface-200 rounded-lg bg-white">'+selOptions(products,cur.product)+'</select></div>'
        +'<div><div class="text-xs text-text-secondary mb-1">'+tr('货物类型')+' *</div><select id="pda-sb-cargotype" class="w-full h-9 px-2 text-xs border border-surface-200 rounded-lg bg-white">'+selOptions(cargoTypes,cur.cargoType)+'</select></div>'
        +'<div><div class="text-xs text-text-secondary mb-1">'+tr('目的仓库')+'</div><select id="pda-sb-warehouse" class="w-full h-9 px-2 text-xs border border-surface-200 rounded-lg bg-white">'+selOptions(warehouses,cur.warehouse)+'</select></div>'
        +'<div><div class="text-xs text-text-secondary mb-1">'+tr('最大限重(KG)')+'</div><input id="pda-sb-maxweight" type="number" min="0" value="'+(cur.maxWeight||'')+'" placeholder="'+tr('选填')+'" class="w-full h-9 px-3 text-xs border border-surface-200 rounded-lg"></div>'
        +'<div class="col-span-2"><div class="text-xs text-text-secondary mb-1">'+tr('最大体积(CBM)')+'</div><input id="pda-sb-maxvol" type="number" min="0" step="0.01" value="'+(cur.maxVol||'')+'" placeholder="'+tr('选填')+'" class="w-full h-9 px-3 text-xs border border-surface-200 rounded-lg"></div>'
        +'</div>'
        +'<div class="grid grid-cols-2 gap-2 mt-4"><button type="button" onclick="closePdaSortScanBagModal()" class="h-10 rounded-lg bg-surface-100 text-text-secondary text-sm">'+tr('取消')+'</button><button type="button" onclick="confirmPdaSortScanBag()" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('开始装袋')+'</button></div>'
        +'</div>';
    document.body.appendChild(modal);
}

function closePdaSortScanBagModal(){
    const m=document.getElementById('pda-sort-scan-bag-modal');
    if(m)m.remove();
}

function confirmPdaSortScanBag(){
    const product=document.getElementById('pda-sb-product').value;
    const cargoType=document.getElementById('pda-sb-cargotype').value;
    const warehouse=document.getElementById('pda-sb-warehouse').value;
    const maxWeight=parseFloat(document.getElementById('pda-sb-maxweight').value)||0;
    const maxVol=parseFloat(document.getElementById('pda-sb-maxvol').value)||0;
    if(!product||!cargoType){showToast(tr('请完整填写产品、货物类型'));return;}
    _pdaSortScanRule={product:product,cargoType:cargoType,warehouse:warehouse,maxWeight:maxWeight,maxVol:maxVol};
    _pdaSortScanBagNo=nextPdaSortScanBagNo();
    _pdaSortScanItems=[];
    closePdaSortScanBagModal();
    refreshWarehousePdaPrototype();
    showToast(tr('开始装袋')+'：'+_pdaSortScanBagNo);
}

function applyPdaSortScanWaybill(){
    if(!_pdaSortScanRule){showToast(tr('请先新增袋子设置规则'));return;}
    const input=document.getElementById('pda-sort-scan-key');
    if(!input)return;
    const val=(input.value||'').trim();
    if(!val){showToast(tr('请输入运单号'));return;}
    const exists=_pdaSortScanItems.some(function(o){return o.wb===val;});
    if(exists){
        showToast(tr('该运单已在袋中'));
        input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
        return;
    }
    const seed=_pdaSortScanItems.length;
    const qty=(seed%3)+1;
    const weight=parseFloat((8+(seed*1.7)%10).toFixed(2))*qty;
    const vol=parseFloat((0.03+(seed*0.011)%0.05).toFixed(3))*qty;
    _pdaSortScanItems.push({wb:val,qty:qty,weight:weight,vol:vol});
    showToast(tr('已添加到当前袋'));
    refreshWarehousePdaPrototype();
}

function removePdaSortScanItem(idx){
    if(!_pdaSortScanItems)return;
    _pdaSortScanItems.splice(idx,1);
    refreshWarehousePdaPrototype();
}

function finishPdaSortScan(continueNext){
    if(!_pdaSortScanRule){showToast(tr('请先新增袋子设置规则'));return;}
    if(!_pdaSortScanItems.length){showToast(tr('扫描列表为空，无法完成装袋'));return;}
    const bagNo=_pdaSortScanBagNo;
    if(continueNext){
        _pdaSortScanBagNo=nextPdaSortScanBagNo();
        _pdaSortScanItems=[];
        showToast(tr('已完成装袋')+'：'+bagNo+'，'+tr('继续装袋')+'：'+_pdaSortScanBagNo);
    }else{
        _pdaSortScanRule=null;
        _pdaSortScanBagNo='';
        _pdaSortScanItems=[];
        showToast(tr('已完成装袋')+'：'+bagNo);
    }
    refreshWarehousePdaPrototype();
}

function setPdaPalletBindDirectLoad(v){_pdaPalletBindDirectLoad=v||'否';}

function renderPdaPalletBindTable(){
    let h='<table class="w-full text-xs"><thead><tr class="bg-surface-100 text-text-secondary"><th class="py-2 font-medium">'+tr('托盘号')+'</th><th class="py-2 font-medium text-emerald-600">'+tr('库位库区')+'</th><th class="py-2 font-medium">'+tr('其他票')+'</th><th class="py-2 font-medium">'+tr('操作')+'</th></tr></thead><tbody>';
    if(!_pdaPalletBindRows.length){
        h+='<tr><td colspan="4" class="py-4 text-center text-text-muted">'+tr('暂无记录，请扫描托盘号')+'</td></tr>';
    }
    _pdaPalletBindRows.forEach(function(row,idx){
        h+='<tr class="border-t border-surface-100 text-center align-middle">';
        h+='<td class="py-2 text-primary-700 break-all">'+esc(row.pallet)+'</td>';
        h+='<td class="py-2"><input type="text" value="'+esc(row.zone||'')+'" oninput="updatePdaPalletBindZone('+idx+',this.value)" class="w-16 h-7 px-2 text-xs text-center rounded border border-emerald-300 bg-emerald-50 text-emerald-700"></td>';
        h+='<td class="py-2"><button type="button" onclick="viewPdaPalletBindOther(\''+esc(row.pallet)+'\')" class="text-primary-600 underline">'+tr('查询')+'</button></td>';
        h+='<td class="py-2"><button type="button" onclick="removePdaPalletBindRow('+idx+')" class="text-red-500 underline">'+tr('删除')+'</button></td>';
        h+='</tr>';
    });
    h+='</tbody></table>';
    return h;
}

function generatePdaPalletBindScreen(){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    if(_pdaPalletBindFromAlloc){
        h+='<div class="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs text-primary-700 flex items-center gap-2"><span class="font-semibold">'+tr('配舱号')+'：</span><span class="break-all">'+esc(_pdaPalletBindFromAlloc)+'</span></div>';
    }
    h+='<div class="flex items-center gap-2 text-xs"><span class="text-text-secondary w-24 flex-shrink-0">'+tr('是否直接装柜')+'</span><select onchange="setPdaPalletBindDirectLoad(this.value)" class="flex-1 h-10 px-3 rounded-xl border border-surface-200 bg-white text-text-primary"><option value="否"'+(_pdaPalletBindDirectLoad==='否'?' selected':'')+'>'+tr('否')+'</option><option value="是"'+(_pdaPalletBindDirectLoad==='是'?' selected':'')+'>'+tr('是')+'</option></select></div>';
    h+=pdaScanInput('pda-pallet-waybill','请扫描运单子单号','applyPdaPalletBindWaybill','H82512230001');
    h+='<div id="pda-pallet-waybill-info" class="'+(_pdaPalletBindLoaded?'':'hidden')+' rounded-xl border border-surface-200 bg-white p-3 text-xs space-y-1">';
    h+='<div class="flex items-center gap-2"><span class="font-semibold text-primary-700">H82512230001</span><span class="text-text-secondary">(A1，A2)</span></div>';
    h+='<div class="flex items-center justify-between text-text-secondary"><span>'+tr('当前票已绑定托盘')+'</span><div class="flex gap-3 text-primary-600"><button type="button" onclick="togglePdaPalletBindBound(true)">'+tr('展开')+'</button><button type="button" onclick="togglePdaPalletBindBound(false)">'+tr('收起')+'</button></div></div>';
    h+='<div id="pda-pallet-bound-detail" class="hidden mt-2 pt-2 border-t border-surface-100 text-text-secondary"><div>'+tr('已绑定托盘')+'：TP20260403001 / TP20260403002</div></div>';
    h+='</div>';
    h+=pdaScanInput('pda-pallet-no','请扫描托盘号','applyPdaPalletBindPallet','TP20260404005');
    h+='<div class="text-sm font-semibold text-text-primary">'+tr('当前记录的托盘')+'</div>';
    h+='<div id="pda-pallet-table" class="rounded-xl border border-surface-200 bg-white overflow-hidden">'+renderPdaPalletBindTable()+'</div>';
    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-仓库上托"，了解详细逻辑。')+'</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="confirmPdaPalletBind()" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('确认上托')+'</button></div>';
    return h;
}

function applyPdaPalletBindWaybill(){
    _pdaPalletBindLoaded=true;
    const info=document.getElementById('pda-pallet-waybill-info');
    if(info)info.classList.remove('hidden');
    const palletInput=document.getElementById('pda-pallet-no');
    if(palletInput)palletInput.focus();
}

function togglePdaPalletBindBound(open){
    const el=document.getElementById('pda-pallet-bound-detail');
    if(!el)return;
    if(open)el.classList.remove('hidden');else el.classList.add('hidden');
}

function applyPdaPalletBindPallet(){
    const input=document.getElementById('pda-pallet-no');
    if(!input)return;
    const val=(input.value||'').trim();
    if(!val)return;
    _pdaPalletBindRows.push({pallet:val,zone:'',editable:true});
    const tbl=document.getElementById('pda-pallet-table');
    if(tbl)tbl.innerHTML=renderPdaPalletBindTable();
    input.value='';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
}

function updatePdaPalletBindZone(idx,val){
    if(_pdaPalletBindRows[idx])_pdaPalletBindRows[idx].zone=val;
}

function removePdaPalletBindRow(idx){
    _pdaPalletBindRows.splice(idx,1);
    const tbl=document.getElementById('pda-pallet-table');
    if(tbl)tbl.innerHTML=renderPdaPalletBindTable();
}

function viewPdaPalletBindOther(pallet){
    showToast(tr('托盘 ')+pallet+tr(' 已关联运单：H82512230001 / H82512230012'));
}

function confirmPdaPalletBind(){
    const hasEmpty=_pdaPalletBindRows.some(function(r){return !r.zone||!String(r.zone).trim();});
    if(hasEmpty){
        showToast(tr('托盘号存在「库位库区」为空，请维护后操作！'));
        return;
    }
    _pdaPalletBindRows=[];
    _pdaPalletBindLoaded=false;
    _pdaPalletBindFromAlloc='';
    _pdaPalletBindDirectLoad='否';
    const wbInput=document.getElementById('pda-pallet-waybill');
    if(wbInput){wbInput.value='';wbInput.dispatchEvent(new Event('input',{bubbles:true}));}
    const info=document.getElementById('pda-pallet-waybill-info');
    if(info)info.classList.add('hidden');
    const tbl=document.getElementById('pda-pallet-table');
    if(tbl)tbl.innerHTML=renderPdaPalletBindTable();
    if(wbInput)wbInput.focus();
    showToast(tr('上托提交成功'));
}

var _pdaPalletAdjustOp='swap';
var _pdaPalletAdjustDownType='ticket';

function pdaPalletAdjRadio(group,value,label,checked,onclick){
    return '<label data-adj-'+group+'="'+value+'" class="flex items-center gap-1.5 cursor-pointer text-xs text-text-primary">'
        +'<input type="radio" name="pda-pallet-adj-'+group+'" '+(checked?'checked':'')+' onclick="'+onclick+'" class="text-primary-600">'
        +'<span>'+tr(label)+'</span></label>';
}

function pdaPalletAdjScanRow(rowId,labelText,inputId,placeholder,scanValue,callback){
    let h='<div id="'+rowId+'" class="flex items-center gap-3">';
    h+='<span id="'+rowId+'-label" class="shrink-0 w-16 text-xs text-text-secondary">'+tr(labelText)+'</span>';
    h+='<div class="relative flex-1">';
    h+='<input id="'+inputId+'" type="text" data-clear-enhanced="1" class="w-full h-10 pl-3 pr-20 text-xs rounded-xl border border-surface-200 bg-white focus:border-primary-400" placeholder="'+esc(tr(placeholder))+'" oninput="togglePdaScanClear(\''+inputId+'\')" onkeydown="if(event.key===\'Enter\')'+callback+'(\''+inputId+'\')">';
    h+='<button type="button" data-pda-clear-for="'+inputId+'" onclick="clearPdaScanInput(\''+inputId+'\')" style="display:none" class="absolute right-10 top-1.5 w-7 h-7 rounded-full bg-surface-100 text-text-muted text-base leading-none items-center justify-center">×</button>';
    h+='<button type="button" onclick="openPdaScanModal(\''+inputId+'\',\''+esc(scanValue)+'\',\''+callback+'\')" class="absolute right-1 top-1 w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center">⌕</button>';
    h+='</div></div>';
    return h;
}

function pdaPalletAdjTextRow(rowId,labelText,inputId,placeholder){
    let h='<div id="'+rowId+'" class="flex items-center gap-3">';
    h+='<span class="shrink-0 w-16 text-xs text-text-secondary">'+tr(labelText)+'</span>';
    h+='<div class="relative flex-1">';
    h+='<input id="'+inputId+'" type="text" data-clear-enhanced="1" class="w-full h-10 pl-3 pr-10 text-xs rounded-xl border border-surface-200 bg-white focus:border-primary-400" placeholder="'+esc(tr(placeholder))+'" oninput="togglePdaScanClear(\''+inputId+'\')">';
    h+='<button type="button" data-pda-clear-for="'+inputId+'" onclick="clearPdaScanInput(\''+inputId+'\')" style="display:none" class="absolute right-3 top-1.5 w-7 h-7 rounded-full bg-surface-100 text-text-muted text-base leading-none items-center justify-center">×</button>';
    h+='</div></div>';
    return h;
}

function generatePdaPalletAdjustScreen(){
    const showOld=_pdaPalletAdjustOp==='swap';
    const showNew=_pdaPalletAdjustOp==='swap'||(_pdaPalletAdjustOp==='down'&&_pdaPalletAdjustDownType==='single');
    const showZone=_pdaPalletAdjustOp==='swap';
    const newLabel=(_pdaPalletAdjustOp==='down'&&_pdaPalletAdjustDownType==='single')?'托盘号':'新托盘号';
    const newPh=(_pdaPalletAdjustOp==='down'&&_pdaPalletAdjustDownType==='single')?'请扫描托盘号':'请扫描新托盘号';

    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+='<div class="rounded-xl bg-white border border-surface-200 px-3 py-2.5 space-y-2">';
    h+='<div class="flex items-center gap-6">';
    h+='<span class="text-xs text-text-secondary w-16 shrink-0">'+tr('操作方式')+'</span>';
    h+=pdaPalletAdjRadio('op','swap','换托',_pdaPalletAdjustOp==='swap','switchPdaPalletAdjustOp(\'swap\')');
    h+=pdaPalletAdjRadio('op','down','下托',_pdaPalletAdjustOp==='down','switchPdaPalletAdjustOp(\'down\')');
    h+='</div>';
    h+='<div id="pda-pallet-adj-down-type" class="'+(_pdaPalletAdjustOp==='down'?'':'hidden')+' flex items-center gap-6 pt-2 border-t border-surface-100">';
    h+='<span class="text-xs text-text-secondary w-16 shrink-0">'+tr('下托方式')+'</span>';
    h+=pdaPalletAdjRadio('dt','ticket','整票下托',_pdaPalletAdjustDownType==='ticket','switchPdaPalletAdjustDownType(\'ticket\')');
    h+=pdaPalletAdjRadio('dt','single','单个下托',_pdaPalletAdjustDownType==='single','switchPdaPalletAdjustDownType(\'single\')');
    h+='</div>';
    h+='</div>';

    h+=pdaPalletAdjScanRow('pda-pallet-adj-row-waybill','运单子单号','pda-pallet-adj-waybill','请扫描运单子单号','H82512230001','focusPdaPalletAdjNext');
    h+='<div id="pda-pallet-adj-row-old" class="'+(showOld?'':'hidden')+'">'+pdaPalletAdjScanRow('pda-pallet-adj-row-old-inner','旧托盘号','pda-pallet-adj-old','请扫描旧托盘号','TP20260404003','focusPdaPalletAdjNext')+'</div>';
    h+='<div id="pda-pallet-adj-row-new" class="'+(showNew?'':'hidden')+'">'+pdaPalletAdjScanRow('pda-pallet-adj-row-new-inner',newLabel,'pda-pallet-adj-new',newPh,'TP20260404010','focusPdaPalletAdjNext')+'</div>';
    h+='<div id="pda-pallet-adj-row-zone" class="'+(showZone?'':'hidden')+'">'+pdaPalletAdjTextRow('pda-pallet-adj-row-zone-inner','库位库区','pda-pallet-adj-zone','请录入库位库区')+'</div>';

    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-调整托盘"，了解详细逻辑。')+'</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="confirmPdaPalletAdjust()" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('确认调整')+'</button></div>';
    return h;
}

function switchPdaPalletAdjustOp(op){
    _pdaPalletAdjustOp=op;
    applyPdaPalletAdjustVisibility();
}

function switchPdaPalletAdjustDownType(t){
    _pdaPalletAdjustDownType=t;
    applyPdaPalletAdjustVisibility();
}

function applyPdaPalletAdjustVisibility(){
    function setHidden(id,hide){var el=document.getElementById(id);if(!el)return;if(hide)el.classList.add('hidden');else el.classList.remove('hidden');}
    const showOld=_pdaPalletAdjustOp==='swap';
    const showNew=_pdaPalletAdjustOp==='swap'||(_pdaPalletAdjustOp==='down'&&_pdaPalletAdjustDownType==='single');
    const showZone=_pdaPalletAdjustOp==='swap';
    setHidden('pda-pallet-adj-down-type',_pdaPalletAdjustOp!=='down');
    setHidden('pda-pallet-adj-row-old',!showOld);
    setHidden('pda-pallet-adj-row-new',!showNew);
    setHidden('pda-pallet-adj-row-zone',!showZone);
    const lbl=document.getElementById('pda-pallet-adj-row-new-inner-label');
    const inp=document.getElementById('pda-pallet-adj-new');
    if(_pdaPalletAdjustOp==='down'&&_pdaPalletAdjustDownType==='single'){
        if(lbl)lbl.textContent=tr('托盘号');
        if(inp)inp.placeholder=tr('请扫描托盘号');
    }else{
        if(lbl)lbl.textContent=tr('新托盘号');
        if(inp)inp.placeholder=tr('请扫描新托盘号');
    }
}

function focusPdaPalletAdjNext(currentId){
    const seq=_pdaPalletAdjustOp==='swap'
        ?['pda-pallet-adj-waybill','pda-pallet-adj-old','pda-pallet-adj-new','pda-pallet-adj-zone']
        :(_pdaPalletAdjustDownType==='single'
            ?['pda-pallet-adj-waybill','pda-pallet-adj-new']
            :['pda-pallet-adj-waybill']);
    const idx=seq.indexOf(currentId);
    if(idx>=0&&idx<seq.length-1){
        const next=document.getElementById(seq[idx+1]);
        if(next)next.focus();
    }
}

function confirmPdaPalletAdjust(){
    ['pda-pallet-adj-waybill','pda-pallet-adj-old','pda-pallet-adj-new','pda-pallet-adj-zone'].forEach(function(id){
        const el=document.getElementById(id);
        if(el){el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));}
    });
    const wb=document.getElementById('pda-pallet-adj-waybill');
    if(wb)wb.focus();
    const msg=_pdaPalletAdjustOp==='swap'?'换托提交成功'
        :(_pdaPalletAdjustDownType==='single'?'单个下托提交成功':'整票下托提交成功');
    showToast(tr(msg));
}

var _pdaBagAdjustOp='add';

function generatePdaBagAdjustScreen(){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 space-y-3">';
    h+='<div class="rounded-xl bg-white border border-surface-200 px-3 py-2.5 space-y-2">';
    h+='<div class="flex items-center gap-6">';
    h+='<span class="text-xs text-text-secondary w-16 shrink-0">'+tr('操作方式')+'</span>';
    h+=pdaPalletAdjRadio('bag-op','add','添加',_pdaBagAdjustOp==='add','switchPdaBagAdjustOp(\'add\')');
    h+=pdaPalletAdjRadio('bag-op','remove','移出',_pdaBagAdjustOp==='remove','switchPdaBagAdjustOp(\'remove\')');
    h+='</div>';
    h+='</div>';

    h+=pdaPalletAdjScanRow('pda-bag-adj-row-waybill','运单子单号','pda-bag-adj-waybill','请扫描运单子单号','H82512230001','focusPdaBagAdjNext');
    h+=pdaPalletAdjScanRow('pda-bag-adj-row-bag','袋号','pda-bag-adj-bag','请扫描袋号','BAG-20260627-0102','focusPdaBagAdjNext');
    h+=pdaPalletAdjTextRow('pda-bag-adj-row-zone','库位库区','pda-bag-adj-zone','请录入库位库区');

    h+='<div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">'+tr('注意：请您查阅"逻辑需求描述-调整装袋"，了解详细逻辑。')+'</div>';
    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="confirmPdaBagAdjust()" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('确认调整')+'</button></div>';
    return h;
}

function switchPdaBagAdjustOp(op){
    _pdaBagAdjustOp=op;
}

function focusPdaBagAdjNext(currentId){
    const seq=['pda-bag-adj-waybill','pda-bag-adj-bag','pda-bag-adj-zone'];
    const idx=seq.indexOf(currentId);
    if(idx>=0&&idx<seq.length-1){
        const next=document.getElementById(seq[idx+1]);
        if(next)next.focus();
    }
}

function confirmPdaBagAdjust(){
    ['pda-bag-adj-waybill','pda-bag-adj-bag','pda-bag-adj-zone'].forEach(function(id){
        const el=document.getElementById(id);
        if(el){el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));}
    });
    const wb=document.getElementById('pda-bag-adj-waybill');
    if(wb)wb.focus();
    const msg=_pdaBagAdjustOp==='add'?'添加装袋提交成功':'移出装袋提交成功';
    showToast(tr(msg));
}

/* ===== 收货复核 pda-receive-check ===== */
var _pdaReceiveCheckView='list';
var _pdaReceiveCheckCurrent=null;
var _pdaReceiveCheckExpanded=true;
var _pdaReceiveCheckRangeFrom=1;
var _pdaReceiveCheckRangeTo=1;
var _pdaReceiveCheckSelectedRow=0;

var _pdaReceiveCheckList=[
    {wb:'H82512230001',cmdType:'收货复核',cmdContent:'测试指令内容测试指令内容测试指令内容',
        subs:[
            {sub:'H825122300010001',l:50,w:50,h:50,wt:150},
            {sub:'H825122300010002',l:50,w:50,h:50,wt:150}
        ]
    },
    {wb:'H82512230002',cmdType:'收货复核',cmdContent:'测试指令内容测试指令内容测试指令内容',
        subs:[
            {sub:'H825122300020001',l:60,w:40,h:35,wt:120},
            {sub:'H825122300020002',l:60,w:40,h:35,wt:120},
            {sub:'H825122300020003',l:60,w:40,h:35,wt:120}
        ]
    },
    {wb:'H82512230003',cmdType:'收货复核',cmdContent:'测试指令内容测试指令内容测试指令内容',
        subs:[
            {sub:'H825122300030001',l:45,w:30,h:28,wt:90}
        ]
    }
];

function generatePdaReceiveCheckScreen(){
    if(_pdaReceiveCheckView==='operate'&&_pdaReceiveCheckCurrent!==null&&_pdaReceiveCheckList[_pdaReceiveCheckCurrent]){
        return generatePdaReceiveCheckOperate();
    }
    return generatePdaReceiveCheckList();
}

function generatePdaReceiveCheckList(){
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50">';
    h+=pdaScanInput('pda-receive-check-wb','请扫描运单子单号','applyPdaReceiveCheckScan','H82512230001');
    h+='<div class="space-y-3 mt-1">';
    _pdaReceiveCheckList.forEach(function(item,i){
        h+='<button type="button" onclick="pickPdaReceiveCheckCard('+i+')" class="block w-full text-left rounded-xl border border-surface-200 bg-white p-3 shadow-sm">';
        h+='<div class="grid grid-cols-2 gap-y-2 text-xs">';
        h+='<div><div class="text-text-secondary">'+tr('运单号')+'</div><div class="font-medium text-text-primary mt-0.5 break-all">'+esc(item.wb)+'</div></div>';
        h+='<div><div class="text-text-secondary">'+tr('指令类型')+'</div><div class="font-medium text-text-primary mt-0.5">'+esc(item.cmdType)+'</div></div>';
        h+='<div class="col-span-2"><div class="text-text-secondary">'+tr('指令内容')+'</div><div class="text-text-secondary mt-0.5 break-all">'+esc(item.cmdContent)+'</div></div>';
        h+='</div></button>';
    });
    h+='</div>';
    h+='<div class="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 mt-3 text-xs text-rose-600">'+tr('注意：请您查阅"逻辑需求描述-收货复核"，了解详细逻辑。')+'</div>';
    h+='</div>';
    setTimeout(function(){var el=document.getElementById('pda-receive-check-wb');if(el)el.focus();},50);
    return h;
}

function applyPdaReceiveCheckScan(){
    const input=document.getElementById('pda-receive-check-wb');
    if(!input)return;
    const val=(input.value||'').trim();
    let idx=-1;
    if(val){idx=_pdaReceiveCheckList.findIndex(function(it){return it.wb===val;});}
    if(idx<0)idx=0;
    pickPdaReceiveCheckCard(idx);
}

function pickPdaReceiveCheckCard(i){
    const item=_pdaReceiveCheckList[i];
    if(!item)return;
    _pdaReceiveCheckCurrent=i;
    _pdaReceiveCheckExpanded=true;
    _pdaReceiveCheckRangeFrom=1;
    _pdaReceiveCheckRangeTo=item.subs.length||1;
    _pdaReceiveCheckSelectedRow=0;
    _pdaReceiveCheckView='operate';
    refreshWarehousePdaPrototype();
}

function togglePdaReceiveCheckExpanded(){
    _pdaReceiveCheckExpanded=!_pdaReceiveCheckExpanded;
    refreshWarehousePdaPrototype();
}

function stepPdaReceiveCheckRange(which,delta){
    const item=_pdaReceiveCheckList[_pdaReceiveCheckCurrent];
    if(!item)return;
    const max=item.subs.length||1;
    if(which==='from'){
        _pdaReceiveCheckRangeFrom=Math.min(max,Math.max(1,_pdaReceiveCheckRangeFrom+delta));
        if(_pdaReceiveCheckRangeTo<_pdaReceiveCheckRangeFrom)_pdaReceiveCheckRangeTo=_pdaReceiveCheckRangeFrom;
    }else{
        _pdaReceiveCheckRangeTo=Math.min(max,Math.max(_pdaReceiveCheckRangeFrom,_pdaReceiveCheckRangeTo+delta));
    }
    refreshWarehousePdaPrototype();
}

function applyPdaReceiveCheckRangeFill(){
    const item=_pdaReceiveCheckList[_pdaReceiveCheckCurrent];
    if(!item)return;
    const l=parseFloat((document.getElementById('pda-rc-l')||{}).value)||0;
    const w=parseFloat((document.getElementById('pda-rc-w')||{}).value)||0;
    const hv=parseFloat((document.getElementById('pda-rc-h')||{}).value)||0;
    const wt=parseFloat((document.getElementById('pda-rc-wt')||{}).value)||0;
    const from=Math.max(1,_pdaReceiveCheckRangeFrom)-1;
    const to=Math.min(item.subs.length,_pdaReceiveCheckRangeTo)-1;
    for(let i=from;i<=to;i++){
        if(l>0)item.subs[i].l=l;
        if(w>0)item.subs[i].w=w;
        if(hv>0)item.subs[i].h=hv;
        if(wt>0)item.subs[i].wt=wt;
    }
    showToast(tr('区间填充已应用'));
    refreshWarehousePdaPrototype();
}

function selectPdaReceiveCheckRow(i){_pdaReceiveCheckSelectedRow=i;refreshWarehousePdaPrototype();}

function submitPdaReceiveCheck(){
    showToast(tr('收货复核完成提交成功'));
    _pdaReceiveCheckView='list';
    _pdaReceiveCheckCurrent=null;
    refreshWarehousePdaPrototype();
}

function generatePdaReceiveCheckOperate(){
    const item=_pdaReceiveCheckList[_pdaReceiveCheckCurrent];
    let h='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50 pb-20">';
    h+=pdaScanInput('pda-receive-check-wb-op','请扫描运单子单号','applyPdaReceiveCheckScanOp','H82512230001');
    h+='<div class="rounded-xl bg-white border border-surface-200 p-3 mb-3">';
    h+='<div class="flex items-center justify-between mb-2">';
    h+='<div class="text-sm font-semibold text-text-primary">'+esc(item.wb)+' <span class="text-xs text-text-secondary font-normal">（'+tr('批量工具')+'）</span></div>';
    h+='<button type="button" onclick="togglePdaReceiveCheckExpanded()" class="text-xs text-primary-600">'+tr(_pdaReceiveCheckExpanded?'收起':'展开')+'</button>';
    h+='</div>';
    if(_pdaReceiveCheckExpanded){
        h+='<div class="space-y-2">';
        h+=pdaRcField('pda-rc-l','长（CM）','请录入长（CM）');
        h+=pdaRcField('pda-rc-w','宽（CM）','请录入宽（CM）');
        h+=pdaRcField('pda-rc-h','高（CM）','请录入高（CM）');
        h+=pdaRcField('pda-rc-wt','重量（KG）','请录入重量（KG）');
        h+='</div>';
        h+='<div class="flex items-center justify-center gap-2 mt-3">';
        h+=pdaRcStepper('from',_pdaReceiveCheckRangeFrom);
        h+='<span class="text-xs text-text-secondary">'+tr('至')+'</span>';
        h+=pdaRcStepper('to',_pdaReceiveCheckRangeTo);
        h+='<button type="button" onclick="applyPdaReceiveCheckRangeFill()" class="ml-2 h-8 px-3 rounded-md border border-amber-400 text-amber-600 text-xs">'+tr('区间填充')+'</button>';
        h+='</div>';
    }
    h+='</div>';

    h+='<div class="rounded-xl bg-white border border-surface-200 p-3 mb-3">';
    h+='<div class="flex items-center justify-between mb-2">';
    h+='<div class="text-sm font-semibold text-text-primary">'+tr('当前登记尺寸')+'</div>';
    h+='<div class="text-[10px] text-amber-600">'+tr('单击选中/双击编辑单元格')+'</div>';
    h+='</div>';
    h+='<div class="overflow-x-auto"><table class="w-full text-xs"><thead><tr class="text-amber-600 border-b border-surface-100">';
    h+='<th class="py-1.5 text-left font-medium">'+tr('运单子单号')+'</th>';
    h+='<th class="py-1.5 text-center font-medium">'+tr('长')+'</th>';
    h+='<th class="py-1.5 text-center font-medium">'+tr('宽')+'</th>';
    h+='<th class="py-1.5 text-center font-medium">'+tr('高')+'</th>';
    h+='<th class="py-1.5 text-center font-medium">'+tr('重量')+'</th>';
    h+='</tr></thead><tbody>';
    item.subs.forEach(function(row,i){
        const sel=i===_pdaReceiveCheckSelectedRow;
        h+='<tr onclick="selectPdaReceiveCheckRow('+i+')" class="border-b border-surface-50 cursor-pointer '+(sel?'bg-amber-50 text-rose-500':'text-text-primary')+'">';
        h+='<td class="py-1.5">'+esc(row.sub)+'</td>';
        h+='<td class="py-1.5 text-center">'+row.l+'</td>';
        h+='<td class="py-1.5 text-center">'+row.w+'</td>';
        h+='<td class="py-1.5 text-center">'+row.h+'</td>';
        h+='<td class="py-1.5 text-center">'+row.wt+'</td>';
        h+='</tr>';
    });
    h+='</tbody></table></div>';
    h+='</div>';

    h+='<div class="rounded-xl bg-white border border-surface-200 p-3 mb-3">';
    h+='<div class="text-sm font-semibold text-text-primary mb-1">'+tr('上传照片')+' <span class="text-xs text-text-secondary font-normal">'+tr('(最多上传20张，支持调用摄像头)')+'</span></div>';
    h+=pdaPhotoUploader(20);
    h+='</div>';

    h+='</div>';
    h+='<div class="sticky bottom-0 bg-white border-t border-surface-200 p-3"><button type="button" onclick="submitPdaReceiveCheck()" class="h-10 w-full rounded-lg bg-primary-600 text-white text-sm font-medium">'+tr('收货复核完成')+'</button></div>';
    return h;
}

function pdaRcField(inputId,label,placeholder){
    return '<div class="flex items-center gap-2"><span class="text-xs text-amber-600 w-16 shrink-0">'+tr(label)+'</span><div class="relative flex-1"><input id="'+inputId+'" type="number" inputmode="decimal" data-clear-enhanced="1" class="w-full h-9 pl-3 pr-9 text-xs rounded-lg border border-surface-200 bg-white focus:border-primary-400" placeholder="'+esc(tr(placeholder))+'" oninput="togglePdaScanClear(\''+inputId+'\')"><button type="button" data-pda-clear-for="'+inputId+'" onclick="clearPdaScanInput(\''+inputId+'\')" style="display:none" class="absolute right-2 top-1 w-7 h-7 rounded-full bg-surface-100 text-text-muted text-base leading-none items-center justify-center">×</button></div></div>';
}

function pdaRcStepper(which,value){
    return '<div class="inline-flex items-center border border-surface-200 rounded-md overflow-hidden">'+
        '<button type="button" onclick="stepPdaReceiveCheckRange(\''+which+'\',-1)" class="w-7 h-8 text-text-secondary">-</button>'+
        '<span class="px-3 text-xs text-text-primary border-x border-surface-200">'+value+'</span>'+
        '<button type="button" onclick="stepPdaReceiveCheckRange(\''+which+'\',1)" class="w-7 h-8 text-text-secondary">+</button>'+
        '</div>';
}

function applyPdaReceiveCheckScanOp(){
    const input=document.getElementById('pda-receive-check-wb-op');
    if(!input)return;
    const val=(input.value||'').trim();
    if(!val){showToast(tr('请扫描运单子单号'));return;}
    const item=_pdaReceiveCheckList[_pdaReceiveCheckCurrent];
    if(!item)return;
    const idx=item.subs.findIndex(function(s){return s.sub===val;});
    if(idx>=0){_pdaReceiveCheckSelectedRow=idx;refreshWarehousePdaPrototype();return;}
    showToast(tr('未找到该子单号'));
}

function generateWarehousePdaOperationScreen(taskId){
    const config=warehousePdaOperationConfig(taskId);
    let h='';
    h+='<div class="bg-primary-600 text-white px-4 pt-4 pb-3">';
    h+='<div class="flex items-center gap-3"><button type="button" onclick="closeWarehousePdaTask()" class="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-lg">←</button><div class="min-w-0 flex-1"><div class="text-base font-semibold truncate">'+tr(config.title)+'</div><div class="text-xs opacity-80 truncate">'+tr(config.subtitle)+'</div></div></div>';
    h+='</div>';
    if(taskId==='pda-waybill-query')return h+generatePdaWaybillQueryScreen();
    if(taskId==='wh-cargo-search')return h+generatePdaCargoSearchScreen();
    if(taskId==='wh-out-scan')return h+generatePdaOutScanScreen();
    if(taskId==='wh-transfer-in')return h+generatePdaTransferInScreen();
    if(taskId==='wh-transfer-out')return h+generatePdaTransferOutScreen();
    if(taskId==='wh-in-multi')return h+generatePdaMultiInboundScreen(config);
    if(taskId==='wh-replenish-drop')return h+generatePdaReplenishDropScreen();
    if(taskId==='pda-pallet-bind')return h+generatePdaPalletBindScreen();
    if(taskId==='pda-pallet-adjust')return h+generatePdaPalletAdjustScreen();
    if(taskId==='pda-bag-adjust')return h+generatePdaBagAdjustScreen();
    if(taskId==='pda-receive-check')return h+generatePdaReceiveCheckScreen();
    if(taskId==='pda-find-scan')return h+generatePdaFindScanScreen();
    if(taskId==='pda-load-scan')return h+generatePdaLoadScanScreen();
    if(taskId==='pda-load-finish')return h+generatePdaLoadFinishScreen();
    if(taskId==='pda-sort-scan')return h+generatePdaSortScanScreen();
    if(taskId==='pda-air-out-scan')return h+generatePdaAirOutScanScreen();
    if(taskId==='pda-work-order')return h+generatePdaWorkOrderScreen();
    h+='<div class="p-3 flex-1 min-h-0 overflow-y-auto bg-surface-50">';
    (config.sections||[]).forEach(function(section){h+=pdaSection(section);});
    if(config.servicePanel)h+=pdaServicePanel(true);
    if(config.photos)h+=pdaPhotoUploader(config.photoLimit||3);
    if(config.records&&config.records.length){
        h+='<div class="mt-3 mb-2 text-sm font-semibold text-text-primary">'+tr(config.recordsTitle||'最近记录')+'</div>';
        config.records.forEach(function(record){h+=pdaRecordCard(record);});
    }
    h+='</div>';
    h+=pdaBottomActions(config);
    return h;
}

function generateWarehousePdaPhone(tasks){
    let h='<div class="relative rounded-[22px] bg-surface-50 overflow-hidden h-[760px] max-h-[calc(100vh-96px)] min-h-[640px] flex flex-col">';
    h+=_warehousePdaTaskId?generateWarehousePdaOperationScreen(_warehousePdaTaskId):generateWarehousePdaHome(tasks);
    h+='<div id="pda-app-overlay" class="hidden"></div>';
    h+='</div>';
    return h;
}

function pdaTaskIcon(itemId){
    const map={
        'pda-waybill-query':'⌕','wh-in-one':'▤','wh-in-multi':'▥','wh-headless':'◇','wh-no-pre-in':'▣',
        'wh-transfer-in':'▣','wh-transfer-out':'▱','wh-scan-out':'⌁','wh-out-scan':'⌁','wh-pallet-mgmt':'▦',
        'wh-pack-rule':'☰','wh-cargo-search':'⌕','wh-preload':'▧','wh-replenish-drop':'↔',
        'wh-issue':'!','wh-air-sort':'⇆','wh-air-bag':'▰','wh-air-pack':'▤','pda-work-order':'✓',
        'pda-air-checkin':'✈','pda-air-bag-sort':'▰','pda-air-out-scan':'⇲','pda-work-order-register':'✎',
        'pda-pallet-bind':'▦','pda-pallet-adjust':'⇄','pda-bag-adjust':'⇌','pda-receive-check':'✓','pda-find-scan':'⌕','pda-load-scan':'▣','pda-load-finish':'✓','pda-sort-scan':'☰'
    };
    return map[itemId]||'▦';
}

function pdaTaskCard(item){
    return '<button type="button" onclick="openWarehousePdaTask(\''+esc(item[0])+'\')" class="rounded-xl bg-surface-100 hover:bg-primary-50 border border-surface-100 p-3 h-[96px] flex flex-col items-center justify-center gap-2 cursor-pointer">'+
        '<span class="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-lg font-bold shadow-sm">'+pdaTaskIcon(item[0])+'</span>'+
        '<span class="text-[12px] font-semibold text-text-primary leading-4 text-center">'+tr(item[1])+'</span>'+
        '</button>';
}

function generateWarehousePdaPage(id){
    const tasks=warehousePdaTaskItems();
    let h='';
    h+='<div class="h-full overflow-auto bg-surface-50 p-5 flex justify-center">';
    h+='<section class="w-full max-w-[470px] bg-white rounded-xl border border-surface-200 p-5">';
    h+='<div class="mx-auto w-full max-w-[420px] rounded-[32px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">';
    h+=generateWarehousePdaPhone(tasks);
    h+='</div>';
    h+='</section>';
    h+='</div>';
    setTimeout(function(){applyRuntimeEnhancements(document.getElementById('main-content'));},0);
    return h;
}

