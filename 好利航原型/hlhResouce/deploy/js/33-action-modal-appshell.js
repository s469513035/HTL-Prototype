function markTransferInboundSuccess(id){
    const idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    const c=TC[id]||{};
    const statusIdx=(c.h||[]).indexOf('调拨状态');
    if(statusIdx>=0&&c.d&&c.d[idx])c.d[idx][statusIdx]='已完成';
    showToast(tr('入库成功'));
    document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal||'');
}

function markTransferOutbound(id){
    const idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    const c=TC[id]||{};
    const statusIdx=(c.h||[]).indexOf('调拨状态');
    if(statusIdx>=0&&c.d&&c.d[idx])c.d[idx][statusIdx]='已出库';
    showToast(tr('调拨出库成功'));
    document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal||'');
}

/* 特价申请：计费量（按计重类型），供「调整总价」自动计算 */
var _spQty={'重量':0,'体积':0};
/* 调整总价 = 总价模式取申请价格；单价模式取 申请价格 × 计费量（重量或体积） */
function recalcSpecialPriceTotal(){
    var out=document.getElementById('sp-total');
    if(!out)return;
    var priceEl=document.getElementById('sp-price');
    var price=parseFloat(String((priceEl&&priceEl.value)||'').replace(/,/g,''));
    if(isNaN(price)){out.value='';return;}
    var mode='单价模式';
    var checked=document.querySelector('input[name="radio-申请类型"]:checked');
    if(checked&&checked.value)mode=checked.value;
    var total=price;
    if(mode==='单价模式'){
        var wtEl=document.getElementById('sp-weight-type');
        var wt=(wtEl&&wtEl.value)||'重量';
        total=price*((_spQty&&_spQty[wt])||0);
    }
    out.value=total.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function actionConfig(action,id,rowData){
    const c=TC[id]||{t:'当前页面',q:[],s:[]};
    const name=c.t||id;
    if(action==='selectRequired')return {title:'请选择数据',fields:[{label:'提示',type:'textarea',value:tr('请先勾选一条数据后再进行编辑或查看。'),readonly:true,span:'md:col-span-2'}],confirm:'知道了',readonly:true};
    if(action==='search')return {title:'查询数据 - '+name,fields:(c.q||[]).map(function(q){return {label:q.label,type:q.type==='text'?'textarea':q.type,rows:2,options:q.options||(q.field==='status'?c.s:[])};}),confirm:'确认查询'};
    if(action==='export')return {title:'导出数据 - '+name,fields:[{label:'导出范围',type:'select',options:['当前筛选结果','已勾选数据','全部数据']},{label:'文件格式',type:'select',options:['Excel','CSV','PDF']},{label:'是否包含隐藏列',type:'select',options:['否','是']},{label:'导出备注',type:'textarea',span:'md:col-span-2'}],confirm:'开始导出'};
    if(action==='delete')return {title:'删除数据 - '+name,fields:[{label:'删除原因',type:'textarea',required:true,span:'md:col-span-2'},{label:'二次确认',type:'select',required:true,options:['确认删除','取消']}],confirm:'确认删除',danger:true};
    if(action==='enable'||action==='disable')return {title:(action==='enable'?'启用数据':'禁用数据')+' - '+name,fields:[{label:'生效时间',type:'datetime-local'},{label:'操作原因',type:'textarea',required:true,span:'md:col-span-2'},{label:'通知相关人员',type:'select',options:['是','否']}],confirm:action==='enable'?'确认启用':'确认禁用'};
    if(action==='audit'||action==='review')return {title:(action==='review'?'财务复核':'审核数据')+' - '+name,fields:[{label:'审核结果',type:'select',required:true,options:['通过','驳回','退回补充']},{label:'审核人',value:'admin'},{label:'审核意见',type:'textarea',required:true,span:'md:col-span-2'}],confirm:'提交审核'};
    if(action==='opAudit'||action==='financeAudit'||action==='overseasConfirm'){
        const titleMap={opAudit:'操作审核',financeAudit:'财务审核',overseasConfirm:'海外确认'};
        return {title:titleMap[action]+' - '+name,fields:[{label:'处理结果',type:'select',required:true,options:action==='overseasConfirm'?['已确认','已驳回']:['已审核','已驳回']},{label:'处理人',value:'admin'},{label:'处理备注',type:'textarea',span:'md:col-span-2'}],confirm:'确认'};
    }
    if(action==='billDetail')return {title:'查询详情 - '+name,fields:[],confirm:'知道了',readonly:true};
    if(action==='genPdf')return {title:'下载PDF - '+name,fields:[{label:'下载范围',type:'select',options:['已勾选账单','当前筛选结果','全部账单']},{label:'文件模板',type:'select',options:['标准应收账单PDF','客户对账单PDF']},{label:'下载说明',type:'textarea',value:'确认后下载账单PDF文件。',span:'md:col-span-2'}],confirm:'下载PDF'};
    if(action==='downloadPdf')return {title:'下载pdf - '+name,fields:[{label:'下载范围',type:'select',options:['已勾选费用','当前筛选结果','当前页费用']},{label:'文件模板',type:'select',options:['费用明细PDF','客户费用确认单PDF']},{label:'下载说明',type:'textarea',value:'通过费用管理做过费用调整的数据不触发费用重算，PDF按当前费用明细生成。',span:'md:col-span-2'}],confirm:'下载pdf'};
    if(action==='role')return {title:'角色管理 - '+name,fields:[{label:'角色范围',type:'checkboxGroup',span:'md:col-span-2',options:['销售经理','客服主管','仓库操作员','财务审核','只读用户','超级管理员']},{label:'字段权限',type:'select',options:['全部字段','隐藏财务字段','隐藏联系人字段']}],confirm:'保存角色'};
    if(action==='convertPool')return {title:'转化公海客户 - '+name,fields:[{label:'进入公海原因',type:'select',required:true,options:['超期未跟进','业务员离职','客户主动放弃','重新分配']},{label:'接收人',value:'公海池管理员'},{label:'保护期(天)',type:'number',value:'30'},{label:'转化备注',type:'textarea',span:'md:col-span-2'}],confirm:'确认转化'};
    if(action==='mergeDeclaration')return {title:'合并报关 - '+name,fields:[{label:'报关方式',type:'select',required:true,options:['合并报关','买单报关']},{label:'报关主体',type:'select',options:['客户自有抬头','好利航代理','第三方报关行']},{label:'合并说明',type:'textarea',required:true,span:'md:col-span-2'}],confirm:'确认合并报关'};
    if(action==='splitDeclaration')return {title:'拆分报关 - '+name,fields:[{label:'拆分方式',type:'select',required:true,options:['按品名拆分','按件数拆分','按客户要求拆分']},{label:'拆分票数',type:'number',value:'2'},{label:'拆分说明',type:'textarea',required:true,span:'md:col-span-2'}],confirm:'确认拆分报关'};
    if(action==='mergeBilling')return {title:'合并计费 - '+name,fields:[{label:'合并费用项',type:'checkboxGroup',span:'md:col-span-2',options:['运费'],checkedOptions:['运费']},{label:'计费备注',type:'textarea',span:'md:col-span-2'}],confirm:'确认合并计费'};
    if(action==='specialPrice'){
        /* 报价币别 / 报价总金额 从运单「运费」列拆出（形如 CNY 8,580），只读展示 */
        const spQuote=String(getTableValueByHeader(c,rowData,'运费','')||'').trim();
        const spM=/^([A-Za-z]{2,4})?\s*([\d,.]+)$/.exec(spQuote)||[];
        const spCur=spM[1]||'CNY';
        const spAmt=spM[2]||'';
        /* 单价模式下按计重类型取计费量，供「调整总价」自动计算 */
        _spQty={
            '重量':parseFloat(String(getTableValueByHeader(c,rowData,'重量(KG)',getTableValueByHeader(c,rowData,'重量','0'))||'0').replace(/,/g,''))||0,
            '体积':parseFloat(String(getTableValueByHeader(c,rowData,'体积(CBM)',getTableValueByHeader(c,rowData,'体积','0'))||'0').replace(/,/g,''))||0
        };
        return {title:'特价申请 - '+name,cols:2,fields:[
            {label:'报价币别',value:spCur,readonly:true,translateValue:false},
            {label:'报价总金额',value:spAmt,readonly:true,translateValue:false},
            {label:'申请类型',type:'radioGroup',required:true,options:['单价模式','总价模式'],value:'单价模式',span:'md:col-span-2',onchange:'recalcSpecialPriceTotal()'},
            {label:'计重类型',type:'select',required:true,options:['重量','体积'],value:'重量',id:'sp-weight-type',onchange:'recalcSpecialPriceTotal()'},
            {label:'申请价格',required:true,placeholder:'请输入特价金额',id:'sp-price',oninput:'recalcSpecialPriceTotal()'},
            {label:'币别',type:'select',required:true,options:['CNY','USD','EUR']},
            {label:'调整总价',readonly:true,id:'sp-total',placeholder:'自动计算',translateValue:false},
            {label:'申请原因',type:'textarea',required:true,span:'md:col-span-2'}
        ],confirm:'提交特价申请'};
    }
    if(action==='sendInstruction')return {title:'发送指令',fields:[{label:'指令类型',type:'select',required:true,options:OP_INSTRUCTION_TYPES,span:'md:col-span-2'},{label:'指令内容',type:'textarea',required:true,span:'md:col-span-2'},{label:'备注',type:'textarea',span:'md:col-span-2'}],confirm:'确认'};
    if(action==='ticketManage'||action==='workOrder')return {title:'工单管理 - '+name,fields:[{label:'工单标题',required:true},{label:'工单类型',type:'select',required:true,options:['费用争议','资料补充','异常处理','客户咨询']},{label:'优先级',type:'select',options:['高','中','低']},{label:'工单内容',type:'textarea',required:true,span:'md:col-span-2'}],confirm:'创建工单'};
    if(action==='cargoHold')return {title:'查货扣件 - '+name,fields:[{label:'查货标记',type:'checkboxGroup',span:'md:col-span-2',options:['敏感货','玩具','手机','危险品','易碎','带电','带磁','严禁品']},{label:'是否扣货',type:'checkboxGroup',options:['是']},{label:'产品备注',type:'textarea',required:true,span:'md:col-span-2'}],confirm:'确认'};
    if(action==='productConfirm')return {title:'产品确认 - '+name,fields:[{label:'产品备注',type:'textarea',required:true,span:'md:col-span-2'}],confirm:'确认'};
    if(action==='modifyWaybill')return {title:'修改运单 - '+name,fields:[{label:'修改字段',type:'select',required:true,options:['客户名称','目的港','运输方式','件数','重量','体积','报关状态']},{label:'修改后内容',required:true},{label:'修改原因',type:'textarea',required:true,span:'md:col-span-2'}],confirm:'保存修改'};
    if(action==='manualFreight'){
        const _mfCfg=TC[id]||{};
        const _mfFreight=String(getTableValueByHeader(_mfCfg,rowData,'运费','USD 0')||'USD 0');
        const _mfCurrencyMatch=_mfFreight.match(/(CNY|USD|EUR|GBP)/i);
        const _mfCurrency=_mfCurrencyMatch?_mfCurrencyMatch[1].toUpperCase():'USD';
        return {title:'手改运费（不触发重算） - '+name,fields:[
            {label:'当前运费',value:_mfFreight,readonly:true},
            {label:'手改后运费',type:'number',required:true,placeholder:'请输入运费'},
            {label:'币别',value:_mfCurrency,readonly:true},
            {label:'手改原因',type:'textarea',required:true,span:'md:col-span-2'}
        ],confirm:'确认手改运费'};
    }
    if(action==='printLabel'||action==='labelPrint')return {title:'标签打印 - '+name,fields:[{label:'标签模板',type:'select',options:['运单标签-标准','货物标签-标准','托盘标签'],value:'运单标签-标准'},{label:'打印份数',type:'number',value:'1'}],confirm:'确认'};
    if(action==='scan')return {title:'扫码 - '+name,fields:[{label:'扫描单号',required:true,placeholder:'请扫描或输入袋号/分拣单号'},{label:'扫码结果',type:'textarea',span:'md:col-span-2',value:'扫码后自动带出装袋数据，可继续新增或确认封袋。'}],confirm:'确认扫码'};
    if(action==='exception')return {title:'异常登记 - '+name,fields:[{label:'异常说明',type:'textarea',required:true,span:'md:col-span-2'}],confirm:'提交异常'};
    if(action==='sync')return {title:'同步数据 - '+name,fields:[{label:'同步范围',type:'select',options:['当前页面','当前筛选结果','全部数据']},{label:'同步目标',type:'select',options:['部署页面','业务系统','移动端缓存']},{label:'同步说明',type:'textarea',span:'md:col-span-2'}],confirm:'开始同步'};
    if(action==='bindCustomerOrder')return {title:'绑定客户实单 - '+name,fields:[{label:'订单号',type:'select',required:true,options:['FO-20260613001','FO-20260612002']},{label:'客户实单',type:'select',required:true,options:['深圳市华运达国际货运 / HLHLA260613001','广州远洋进出口贸易 / HLHDK260612002']},{label:'提单号',readonly:true,value:(rowData&&getTableValueByHeader(c,rowData,'提单号',''))||'HLHLA260613001'},{label:'绑定说明',type:'textarea',span:'md:col-span-2',value:'提单号由勾选数据带出，绑定客户实单后触发费用计算，可按需执行重算。'}],confirm:'确认绑定'};
    if(action==='recalcFee')return {title:'重算费用 - '+name,fields:[{label:'重算说明',type:'textarea',readonly:true,span:'md:col-span-2',value:'对勾选的数据按客户实单、提单、航司路线重新计算费用，点击下方按钮即可重算。'}],confirm:'开始重算'};
    if(action==='copyAdd')return {title:'复制新增 - '+name,fields:[{label:'开始日期',type:'date'},{label:'结束日期',type:'date'},{label:'复制说明',type:'textarea',span:'md:col-span-2',value:'基于勾选的旧数据快速新增一条，可修改有效期后保存。'}],confirm:'确认复制新增'};
    if(action==='genBill')return {title:'生成账单 - '+name,fields:[{label:'账单维度',type:'select',options:['服务商','订单','提单','费用类型']},{label:'账单周期',type:'select',options:['本月','上月','自定义']},{label:'币种',type:'select',options:['CNY','USD','EUR']},{label:'生成说明',type:'textarea',span:'md:col-span-2',value:'按勾选的实际费用生成应付账单。'}],confirm:'生成账单'};
    if(action==='downloadReceipt')return {title:'下载水单 - '+name,fields:[{label:'下载范围',type:'select',options:['已勾选付款','当前筛选结果','全部付款']},{label:'水单模板',type:'select',options:['银行付款水单','电汇水单','付款确认单']},{label:'下载说明',type:'textarea',span:'md:col-span-2',value:'确认后下载付款水单文件。'}],confirm:'下载水单'};
    if(action==='genReceivable')return {title:'生成收款管理 - '+name,fields:[{label:'生成方式',type:'select',options:['按勾选流水','按匹配单号']},{label:'目标客户',type:'select',options:FCL_CUSTOMER_OPTIONS},{label:'生成说明',type:'textarea',span:'md:col-span-2',value:'根据勾选的银行流水生成对应收款管理记录。'}],confirm:'生成收款管理'};
    if(action==='genPayable')return {title:'生成付款管理 - '+name,fields:[{label:'生成方式',type:'select',options:['按勾选流水','按匹配单号']},{label:'目标服务商',type:'select',options:['MAERSK','COSCO','MSC','CMA CGM']},{label:'生成说明',type:'textarea',span:'md:col-span-2',value:'根据勾选的银行流水生成对应付款管理记录。'}],confirm:'生成付款管理'};
    if(action==='submitPlan')return {title:'提交 - '+name,fields:[{label:'提交说明',type:'textarea',span:'md:col-span-2',value:'提交勾选的出库单进入下单流程。'}],confirm:'确认提交'};
    if(action==='editReceiver')return {title:'修改收件信息 - '+name,fields:[{label:'收件人',required:true},{label:'联系电话',required:true},{label:'收件地址',type:'textarea',span:'md:col-span-2'}],confirm:'保存收件信息'};
    if(action==='editVolume')return {title:'修改出货材积 - '+name,fields:[{label:'长(CM)',type:'number'},{label:'宽(CM)',type:'number'},{label:'高(CM)',type:'number'},{label:'重量(KG)',type:'number'},{label:'件数',type:'number'},{label:'材积备注',type:'textarea',span:'md:col-span-2'}],confirm:'保存材积'};
    if(action==='editInvoice')return {title:'修改发票 - '+name,fields:[{label:'发票抬头',required:true},{label:'税号'},{label:'发票类型',type:'select',options:['增值税专用发票','增值税普通发票','形式发票']},{label:'发票金额',type:'number'},{label:'发票备注',type:'textarea',span:'md:col-span-2'}],confirm:'保存发票'};
    if(action==='bill')return {title:'生成账单 - '+name,fields:[{label:'账单维度',type:'select',options:['客户','订单','提单','费用类型']},{label:'账单周期',type:'select',options:['本月','上月','自定义']},{label:'币种',type:'select',options:['CNY','USD','EUR']},{label:'账单备注',type:'textarea',span:'md:col-span-2'}],confirm:'生成账单'};
    if(action==='copyQuote')return {title:'复制报价 - '+name,fields:[{label:'新报价名称',required:true},{label:'开始日期',type:'date',required:true},{label:'结束日期',type:'date',required:true},{label:'使用客户',type:'select',options:FCL_CUSTOMER_OPTIONS},{label:'使用分公司',type:'select',options:FCL_BRANCH_OPTIONS},{label:'复制范围',type:'checkboxGroup',span:'md:col-span-2',options:['报价字段','附加费','加价规则','价格说明'],checkedOptions:['报价字段','附加费','加价规则']}],confirm:'确认复制'};
    if(action==='surchargeMaintain')return {title:'附加费维护 - '+name,fields:[{label:'费用名称',type:'select',options:['码头附加费','文件费','燃油附加费','港杂费']},{label:'柜型',type:'select',options:FCL_CONTAINER_OPTIONS},{label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},{label:'金额',type:'number',required:true},{label:'是否包含报价',type:'select',options:['是','否']},{label:'费用说明',type:'textarea',span:'md:col-span-2'}],confirm:'保存'};
    if(action==='markupMaintain')return {title:'加价维护 - '+name,fields:[{label:'使用客户',type:'select',options:FCL_CUSTOMER_OPTIONS},{label:'使用分公司',type:'select',options:FCL_BRANCH_OPTIONS},{label:'加价类型',type:'select',options:['固定金额','百分比','按柜型']},{label:'加价金额',type:'number',required:true},{label:'开始日期',type:'date'},{label:'结束日期',type:'date'},{label:'加价说明',type:'textarea',span:'md:col-span-2'}],confirm:'保存'};
    if(action==='quoteNotify')return {title:'报价通知 - '+name,fields:[{label:'通知方式',type:'select',options:['企业微信','邮件','短信','站内信']},{label:'接收人',type:'select',options:['业务员','报价主管','客户联系人','分公司负责人']},{label:'通知内容',type:'textarea',value:'整柜报价已更新，请及时确认。',span:'md:col-span-2'}],confirm:'发送通知'};
    if(action==='trialGenerateQuote')return {title:'生成报价 - '+name,fields:[{label:'报价名称',required:true,value:'整柜试算生成报价'},{label:'使用客户',type:'select',options:FCL_CUSTOMER_OPTIONS},{label:'使用分公司',type:'select',options:FCL_BRANCH_OPTIONS},{label:'报价字段',type:'select',options:['成本价+附加费+加价','海运费+附加费','成本价+利润']},{label:'价格说明',type:'textarea',span:'md:col-span-2'}],confirm:'生成报价'};
    if(action==='convertPreorder')return {title:'转化草稿/预录单 - '+name,fields:[{label:'转化类型',type:'select',options:['草稿','预录单']},{label:'客户名称',type:'select',options:FCL_CUSTOMER_OPTIONS},{label:'柜型',type:'select',options:FCL_CONTAINER_OPTIONS},{label:'始发港',type:'select',options:FCL_POL_OPTIONS},{label:'目的港',type:'select',options:FCL_POD_OPTIONS},{label:'转化说明',type:'textarea',span:'md:col-span-2'}],confirm:'确认转化'};
    const fclOrderNo=(rowData&&rowData[0])||'FO-20260613001';
    if(action==='fclMergeOrder')return {title:'整柜合单 - '+name,fields:[{label:'合单订单',type:'checkboxGroup',span:'md:col-span-2',required:true,options:['FO-20260613001 / 深圳市华运达国际货运','FO-20260612002 / 广州远洋进出口贸易','FO-20260611005 / 东莞市鑫海物流']},{label:'目标订单号',value:'系统自动生成',readonly:true},{label:'合单规则',type:'select',options:['同客户同航司同目的港','同目的港同船期','人工指定合并']},{label:'合单说明',type:'textarea',span:'md:col-span-2'}],confirm:'确认合单'};
    if(action==='fclSplitOrder')return {title:'拆单 - '+name,fields:[{label:'原订单号',readonly:true,required:true,value:fclOrderNo},{label:'拆分方式',type:'select',required:true,options:['按柜型拆分','按柜量拆分','按费用拆分','人工拆分']},{label:'拆分数量',type:'number',value:'2',required:true},{label:'拆单说明',type:'textarea',span:'md:col-span-2'}],confirm:'确认拆单'};
    const fclOrderActionMap={
        fclBookingWork:{title:'订仓作业',confirm:'提交订仓',fields:[{label:'订单号',readonly:true,required:true,value:fclOrderNo},{label:'船司',type:'select',options:['MAERSK','COSCO','CMA CGM','MSC','ONE'],required:true},{label:'航线',value:'西非线',required:true},{label:'ETD',type:'date',required:true},{label:'订仓方式',type:'select',options:['EDI','官网','邮件','电话']},{label:'订仓备注',type:'textarea',span:'md:col-span-2'}]},
        fclReleaseWork:{title:'放仓作业',confirm:'确认放仓',fields:[{label:'订单号',readonly:true,required:true,value:fclOrderNo},{label:'订舱号',value:'MAEU985633',readonly:true,required:true},{label:'放仓时间',type:'datetime-local',required:true},{label:'放仓附件',type:'select',options:['release_001.pdf','release_002.pdf','待上传']},{label:'放仓备注',type:'textarea',span:'md:col-span-2'}]},
        fclTruckWork:{title:'拖车安排',confirm:'保存拖车',fields:[{label:'订单号',readonly:true,required:true,value:fclOrderNo},{label:'提柜地点',required:true,value:'盐田堆场'},{label:'装柜地点',required:true,value:'深圳客户仓'},{label:'还柜地点',required:true,value:'盐田码头'},{label:'拖车公司',type:'select',options:['鹏程拖车','南沙拖车','客户自送']},{label:'预约时间',type:'datetime-local',required:true},{label:'司机电话',required:true},{label:'拖车备注',type:'textarea',span:'md:col-span-2'}]},
        fclLoadWork:{title:'进仓装柜',confirm:'确认装柜',fields:[{label:'订单号',readonly:true,required:true,value:fclOrderNo},{label:'柜号',readonly:true,required:true,value:'MSKU1234567'},{label:'封号',readonly:true,required:true,value:'S00123'},{label:'装柜地点',value:'深圳客户仓',required:true},{label:'装柜件数',type:'number',value:'680',required:true},{label:'毛重(KG)',type:'number',value:'18500'},{label:'装柜备注',type:'textarea',span:'md:col-span-2'}]},
        fclSiBlWork:{title:'补料与提单',confirm:'提交补料',fields:[{label:'订单号',readonly:true,required:true,value:fclOrderNo},{label:'提单号',value:'HLHLA260613001',readonly:true,required:true},{label:'MBL/HBL',type:'select',options:['MBL','HBL']},{label:'客户实单',type:'select',options:['已绑定','未绑定'],required:true},{label:'提单费用状态',type:'select',options:['未计算','待重算','已计算']},{label:'收货人',required:true},{label:'通知人',required:true},{label:'补料说明',type:'textarea',span:'md:col-span-2'}]},
        fclCustomsWork:{title:'报关申报',confirm:'提交报关',fields:[{label:'订单号',readonly:true,required:true,value:fclOrderNo},{label:'柜号',value:'MSKU1234567',readonly:true,required:true},{label:'报关方式',type:'select',options:['买单报关','客户抬头','第三方报关']},{label:'报关行',type:'select',options:['深圳报关行','广州报关行','客户指定报关行']},{label:'资料状态',type:'select',options:['资料待补','资料齐全','已归档']},{label:'申报说明',type:'textarea',span:'md:col-span-2'}]},
        fclSailingWork:{title:'开船与轨迹',confirm:'保存轨迹',fields:[{label:'订单号',readonly:true,required:true,value:fclOrderNo},{label:'船名航次',value:'MAERSK LAGOS 026W',required:true},{label:'ETD',type:'date',required:true},{label:'ATD',type:'datetime-local'},{label:'ETA',type:'date'},{label:'当前节点',type:'select',options:['待开船','已开船','海上运输','已到港','异常']},{label:'轨迹备注',type:'textarea',span:'md:col-span-2'}]},
        fclDocSendWork:{title:'寄单作业',confirm:'确认寄单',fields:[{label:'订单号',readonly:true,required:true,value:fclOrderNo},{label:'提单号',value:'HLHLA260613001',readonly:true,required:true},{label:'寄单方式',type:'select',options:['顺丰','DHL','UPS','正本自提','电放']},{label:'快递单号',value:'SF778899001'},{label:'寄出时间',type:'datetime-local'},{label:'寄单备注',type:'textarea',span:'md:col-span-2'}]}
    };
    if(fclOrderActionMap[action]){
        const cfg=fclOrderActionMap[action];
        return {title:cfg.title+' - '+name,fields:cfg.fields,confirm:cfg.confirm};
    }
    if(action==='downloadTemplate')return {title:'下载导入模版 - '+name,fields:[{label:'模版类型',type:'select',options:['船公司账单导入模版','服务商账单导入模版','费用明细导入模版']},{label:'币别',type:'select',options:FCL_CURRENCY_OPTIONS},{label:'模版说明',type:'textarea',value:'下载后按模版字段维护实际账单，再通过导入账单按钮导入。',span:'md:col-span-2'}],confirm:'下载模版'};
    if(action==='importBill')return {title:'导入账单 - '+name,fields:[{label:'导入模版',type:'select',options:['船公司账单导入模版.xlsx','服务商账单导入模版.xlsx']},{label:'船公司',type:'select',options:['MAERSK','COSCO','MSC','CMA CGM']},{label:'账单月份',type:'month'},{label:'导入说明',type:'textarea',span:'md:col-span-2'}],confirm:'开始导入'};
    if(action==='compareBill')return {title:'账单对比 - '+name,fields:[{label:'对比维度',type:'select',options:['订单号','订舱单号','柜号','费用名称']},{label:'差异处理',type:'select',options:['仅显示差异','显示全部','自动标记差异']},{label:'对比说明',type:'textarea',span:'md:col-span-2'}],confirm:'开始对比'};
    if(action==='appealBill')return {title:'申诉 - '+name,fields:[{label:'申诉原因',type:'select',options:['船司多收','费用重复','币别不一致','账单金额错误']},{label:'申诉金额',type:'number',required:true},{label:'附件说明',type:'textarea',span:'md:col-span-2'}],confirm:'提交申诉'};
    if(action==='markBill')return {title:'标记 - '+name,fields:[{label:'标记状态',type:'select',options:['已标记','重点跟进','取消标记']},{label:'责任人',type:'select',options:['张财务','财务主管','整柜操作员']},{label:'标记说明',type:'textarea',span:'md:col-span-2'}],confirm:'确认标记'};
    if(action==='transferVehicle')return {title:'维护车辆 - '+name,fields:[{label:'收货网点',type:'select',options:getWarehouseNameOptions(),required:true},{label:'预计到达时间',type:'datetime-local',required:true},{label:'车牌号',required:true},{label:'司机联系电话',required:true},{label:'运输费用',type:'number',required:true},{label:'调拨备注',type:'textarea',span:'md:col-span-2'}],confirm:'保存车辆信息'};
    if(action==='copy')return {title:'复制配置 - '+name,fields:[{label:'新配置名称',required:true},{label:'生效状态',type:'select',options:['待生效','已生效']},{label:'复制范围',type:'checkboxGroup',span:'md:col-span-2',options:['基础字段','价格规则','审批流程','关联附件']}],confirm:'确认复制'};
    if(action==='assign')return {title:'分派处理 - '+name,fields:[{label:'处理人',type:'select',options:['张伟','李强','王芳','赵敏']},{label:'处理时限',type:'datetime-local'},{label:'分派说明',type:'textarea',span:'md:col-span-2'}],confirm:'确认分派'};
    if(action==='reply')return {title:'回复客户 - '+name,fields:[{label:'回复渠道',type:'select',options:['企业微信','邮件','WhatsApp','电话']},{label:'回复模板',type:'select',options:['轨迹更新','费用说明','异常反馈','自定义']},{label:'回复内容',type:'textarea',required:true,span:'md:col-span-2'}],confirm:'发送回复'};
    if(action==='closeCase')return {title:'关闭工单 - '+name,fields:[{label:'关闭原因',type:'select',options:['已解决','客户取消','重复工单','转其他部门']},{label:'处理结果',type:'textarea',required:true,span:'md:col-span-2'}],confirm:'确认关闭'};
    if(action==='shipmentSubmit')return {title:(id==='prod-inquiry-quote'?'提交询价报价 - 询价报价':'提交预报 - 专线下单'),fields:[{label:'提交人',value:'admin'},{label:'审核节点',type:'select',options:['客服初审','仓库确认','财务确认']},{label:'提交备注',type:'textarea',span:'md:col-span-2'}],confirm:'确认提交'};
    if(action==='draft')return {title:'保存草稿',fields:[{label:'草稿名称',value:'专线下单草稿'},{label:'保存位置',type:'select',options:['我的草稿','部门草稿']},{label:'草稿备注',type:'textarea',span:'md:col-span-2'}],confirm:'保存草稿'};
    if(action==='upload')return {title:'附件上传',fields:[{label:'附件类型',type:'select',options:['报关资料','商业发票','装箱单','货物照片','其他']},{label:'附件说明',type:'textarea',span:'md:col-span-2'}],confirm:'确认上传'};
    if(action==='resetEntry')return {title:'重置录入',fields:[{label:'重置范围',type:'select',options:['当前表单','当前分组','全部字段']},{label:'确认说明',type:'textarea',value:tr('重置后会清空当前录入内容。'),readonly:true,span:'md:col-span-2'}],confirm:'确认重置'};
    if(action==='inboundSave')return {title:'保存入仓 - '+name,fields:[{label:'入仓状态',type:'select',options:['待入仓','已入仓','异常']},{label:'复核人',value:'李强'},{label:'保存备注',type:'textarea',span:'md:col-span-2'}],confirm:'保存入仓'};
    return {title:'操作 - '+name,fields:[{label:'操作说明',type:'textarea',span:'md:col-span-2'}],confirm:'确认'};
}

function openActionModal(action,id,rowIdx){
    const idx=rowIdx>=0?rowIdx:getSelectedRowIndex();
    if(action==='delete'){
        openSimpleDeleteConfirm(id,idx);
        return;
    }
    if(action==='cancel'){
        openSimpleCancelConfirm(id,idx);
        return;
    }
    if(action==='copyWaybill'&&(id==='wb-manage'||id==='wb-client-manage')){
        openCopyWaybillModal(id,idx);
        return;
    }
    if(id==='wh-transfer-out'&&(action==='transferCreate'||action==='transferAdjust')){
        openTransferOutRegisterModal(action==='transferAdjust'?'adjust':'create');
        return;
    }
    if(id==='wh-preload'&&action==='bindBl'){
        openBindBlModal(id,idx);
        return;
    }
    if(id==='wh-transfer-out'&&action==='transferOutbound'){
        markTransferOutbound(id);
        return;
    }
    if(id==='wh-transfer-in'&&action==='transferInboundSuccess'){
        markTransferInboundSuccess(id);
        return;
    }
    if(action==='billDetail'&&id==='fin-bill-mgmt'){
        openBillDetailModal(id,idx);
        return;
    }
    if(id==='wh-no-pre-in'&&action==='photoUpload'){
        openNoPrePhotoUploadModal(id,idx);
        return;
    }
    if(id==='wh-no-pre-in'&&action==='claim'){
        openNoPreClaimModal(id,idx);
        return;
    }
    if(id==='wh-no-pre-in'&&action==='genForecast'){
        openNoPreGenerateOrderModal(id,idx);
        return;
    }
    if((id==='wb-manage'||id==='wb-client-manage')&&['mergeDeclare','splitDeclare','singleDeclare'].includes(action)){
        openWaybillDeclarationModal(action,id,idx);
        return;
    }
    if(action==='copyAdd'&&idx<0){
        openActionModal('selectRequired',id,-1);
        return;
    }
    if(action==='downloadTemplate'&&id==='fcl-bill-entry'){
        openFclFeeImportModal(id);
        return;
    }
    if(action==='fileRecognize'){
        openFclFileRecognizeModal(id);
        return;
    }
    if(action==='payDetail'&&id==='fcl-bill'){
        openFclPayableDetailModal(id,idx);
        return;
    }
    if(action==='addOutboundPlan'){
        openOutboundPlanModal(id);
        return;
    }
    const rowData=(idx>=0&&_listData[id])?_listData[id][idx]:null;
    const cfg=actionConfig(action,id,rowData);
    document.getElementById('crud-modal-title').textContent=tr(cfg.title);
    if(action==='export'){
        const c=TC[id];
        const selectedRows=getSelectedRowIndices();
        const exportScope=selectedRows.length>0?'勾选的'+selectedRows.length+'条数据':'当前页数据';
        let fieldHtml='<div class="mb-4"><label class="text-sm font-medium text-text-secondary mb-2 block">'+tr('选择导出字段')+'</label>';
        fieldHtml+='<div class="flex items-center gap-2 mb-2"><button type="button" onclick="toggleAllExportFields(this,true)" class="h-7 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50 cursor-pointer">'+tr('全选')+'</button><button type="button" onclick="toggleAllExportFields(this,false)" class="h-7 px-3 text-xs font-medium text-text-secondary border border-surface-200 rounded hover:bg-surface-50 cursor-pointer">'+tr('取消全选')+'</button></div>';
        fieldHtml+='<div class="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-surface-200 rounded-lg p-3">';
        (c.h||[]).forEach(function(hd,i){
            if(hd==='操作')return;
            fieldHtml+='<label class="flex items-center gap-1.5 text-sm text-text-primary cursor-pointer"><input type="checkbox" class="export-field-check" value="'+i+'" checked>'+esc(tr(hd))+'</label>';
        });
        fieldHtml+='</div></div>';
        document.getElementById('crud-modal-body').innerHTML='<div class="text-sm text-text-secondary mb-3">'+tr('将导出')+esc(exportScope)+'</div>'+fieldHtml;
        document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('导出成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">'+tr('确认导出')+'</button>';
        document.getElementById('crud-modal').classList.add('show');
        return;
    }
    if(action==='pagePerm'){
        const roleData=_listData['perm-role']||expandData('perm-role');
        const roleNames=roleData.map(function(r){return r[1]||'';}).filter(Boolean);
        const uniqueRoles=[...new Set(roleNames)];
        const roleOpts=uniqueRoles.length>0?uniqueRoles:['超级管理员','分公司经理','操作主管','销售经理','海外经理','财务主管','客服专员','操作员','仓库管理员'];
        document.getElementById('crud-modal-title').textContent=tr('页面权限');
        let permHtml='<div class="space-y-4">';
        permHtml+='<div><label class="text-sm font-medium text-text-secondary mb-2 block">'+tr('选择角色权限')+'</label>';
        permHtml+='<div class="relative" data-checked-dropdown>';
        permHtml+='<input type="text" readonly data-checked-dropdown-input onclick="toggleCheckedDropdown(this)" class="w-full h-10 pl-3 pr-9 text-sm border border-surface-200 rounded-lg bg-surface-50 cursor-pointer" placeholder="'+esc(tr('请选择角色'))+'">';
        permHtml+='<button type="button" onclick="toggleCheckedDropdown(this)" class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted hover:text-primary-600 cursor-pointer">▾</button>';
        permHtml+='<div data-checked-dropdown-menu class="hidden absolute z-40 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-surface-200 bg-white shadow-lg p-2">';
        roleOpts.forEach(function(role){
            permHtml+='<label class="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-secondary hover:bg-primary-50 cursor-pointer"><input type="checkbox" value="'+esc(role)+'" class="rounded border-surface-300 text-primary-600" onchange="syncCheckedDropdown(this)"><span>'+esc(tr(role))+'</span></label>';
        });
        permHtml+='</div></div></div>';
        permHtml+='</div>';
        document.getElementById('crud-modal-body').innerHTML=permHtml;
        document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('权限设置成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">'+tr('确认')+'</button>';
        document.getElementById('crud-modal').classList.add('show');
        return;
    }
    if(action==='dataPerm'){
        const dataScopes=['本总部及以下','本区域及以下','本公司及以下','本部门及以下','本小组及以下','仅本人'];
        document.getElementById('crud-modal-title').textContent=tr('数据权限');
        let permHtml='<div class="space-y-4">';
        permHtml+='<div><label class="text-sm font-medium text-text-secondary mb-2 block">'+tr('选择数据权限范围')+'</label>';
        permHtml+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">';
        permHtml+='<option value="">'+tr('请选择')+'</option>';
        dataScopes.forEach(function(scope){
            permHtml+='<option value="'+esc(scope)+'">'+esc(tr(scope))+'</option>';
        });
        permHtml+='</select></div>';
        permHtml+='</div>';
        document.getElementById('crud-modal-body').innerHTML=permHtml;
        document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('权限设置成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">'+tr('确认')+'</button>';
        document.getElementById('crud-modal').classList.add('show');
        return;
    }
    if(action==='resetPwd'){
        openResetPasswordModal(id,idx);
        return;
    }
    let body='';
    if(action==='mergeBilling'&&id==='wb-manage')body+=waybillBillingSummaryHtml(id,idx);
    else if((action==='specialPrice'||action==='manualFreight')&&(id==='wb-manage'||id==='wb-client-manage')&&rowData)body+=waybillDetailSummaryHtml(id,rowData);
    else if(action!=='search'&&action!=='selectRequired'&&action!=='sendInstruction')body+=selectedDataSummary(id,rowData);
    body+=renderFields(cfg.fields||[],cfg.cols||'modal');
    document.getElementById('crud-modal-body').innerHTML=body;
    const dangerClass=cfg.danger?'bg-red-600 hover:bg-red-700':'bg-primary-600 hover:bg-primary-700';
    if(cfg.readonly){
        document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr(cfg.confirm)+'</button>';
    }else{
        document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="confirmAction(\''+action+'\',\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white '+dangerClass+' rounded-lg cursor-pointer">'+tr(cfg.confirm)+'</button>';
    }
    document.getElementById('crud-modal').classList.add('show');
}

function confirmAction(action,id){
    if((id==='fin-fee-mgmt')&&['opAudit','overseasConfirm','financeAudit'].includes(action)){
        const count=updateFeeAuditStatus(id,action);
        closeCrudModal();
        showToast(count>0?tr('操作成功'):tr('请先勾选数据'));
        return;
    }
    if(action==='inboundSave'){
        closeCrudModal();
        setTimeout(openInboundPrintConfirm,80);
        return;
    }
    if(action==='genPdf'||action==='downloadPdf'){
        closeCrudModal();
        showToast(tr('PDF下载成功'));
        return;
    }
    if(action==='labelPrint'||action==='printLabel'){
        closeCrudModal();
        showToast(tr('标签PDF已生成，可打印或下载'));
        return;
    }
    if(action==='sendInstruction'){
        closeCrudModal();
        showToast(tr('指令发送成功'));
        return;
    }
    if(action==='resetEntry'){
        ['shipment-entry-form','warehouse-inbound-form','inquiry-quote-form'].forEach(function(fid){
            const form=document.getElementById(fid);
            if(form)form.reset();
        });
        applyRuntimeEnhancements(document.getElementById('main-content'));
    }
    closeCrudModal();
    showToast(tr('操作成功'));
}

const dashboardHTML=`
<div class="p-6"><div class="mb-6"><h1 class="text-2xl font-bold text-text-primary">工作台</h1><p class="text-sm text-text-secondary mt-1">HOLLY TRANS LIMITED - 西非航线业务数据概览</p></div>
<div class="grid grid-cols-4 gap-5 mb-6">
    <div class="bg-white rounded-xl p-5 border border-surface-200 card-hover"><div class="flex items-center justify-between mb-3"><span class="text-sm text-text-secondary">海运订单(本月)</span><div class="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div></div><div class="text-3xl font-bold text-text-primary">386</div><div class="text-xs text-green-600 mt-1">↑ 15% 较上月</div></div>
    <div class="bg-white rounded-xl p-5 border border-surface-200 card-hover"><div class="flex items-center justify-between mb-3"><span class="text-sm text-text-secondary">空运订单(本月)</span><div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg></div></div><div class="text-3xl font-bold text-text-primary">128</div><div class="text-xs text-green-600 mt-1">↑ 22% 较上月</div></div>
    <div class="bg-white rounded-xl p-5 border border-surface-200 card-hover"><div class="flex items-center justify-between mb-3"><span class="text-sm text-text-secondary">在途货物</span><div class="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div></div><div class="text-3xl font-bold text-text-primary">214</div><div class="text-xs text-text-muted mt-1">覆盖5国12个港口</div></div>
    <div class="bg-white rounded-xl p-5 border border-surface-200 card-hover"><div class="flex items-center justify-between mb-3"><span class="text-sm text-text-secondary">本月营收</span><div class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div></div><div class="text-3xl font-bold text-text-primary">$468K</div><div class="text-xs text-green-600 mt-1">↑ 18.5% 较上月</div></div>
</div>
<div class="grid grid-cols-2 gap-5 mb-6">
    <div class="bg-white rounded-xl border border-surface-200 p-5">
        <h3 class="text-base font-semibold text-text-primary mb-4">各国海运业务量</h3>
        <div class="space-y-3">
            <div class="flex items-center gap-3"><span class="text-sm text-text-secondary w-20 flex-shrink-0">🇳🇬 尼日利亚</span><div class="progress-bar flex-1"><div class="progress-fill bg-primary-500" style="width:92%"></div></div><span class="text-xs text-text-muted w-16 text-right">1,286票</span></div>
            <div class="flex items-center gap-3"><span class="text-sm text-text-secondary w-20 flex-shrink-0">🇨🇮 科特迪瓦</span><div class="progress-bar flex-1"><div class="progress-fill bg-primary-400" style="width:68%"></div></div><span class="text-xs text-text-muted w-16 text-right">856票</span></div>
            <div class="flex items-center gap-3"><span class="text-sm text-text-secondary w-20 flex-shrink-0">🇸🇳 塞内加尔</span><div class="progress-bar flex-1"><div class="progress-fill bg-primary-300" style="width:52%"></div></div><span class="text-xs text-text-muted w-16 text-right">625票</span></div>
            <div class="flex items-center gap-3"><span class="text-sm text-text-secondary w-20 flex-shrink-0">🇬🇭 加纳</span><div class="progress-bar flex-1"><div class="progress-fill bg-primary-200" style="width:45%"></div></div><span class="text-xs text-text-muted w-16 text-right">538票</span></div>
            <div class="flex items-center gap-3"><span class="text-sm text-text-secondary w-20 flex-shrink-0">🇨🇲 喀麦隆</span><div class="progress-bar flex-1"><div class="progress-fill bg-primary-100" style="width:35%"></div></div><span class="text-xs text-text-muted w-16 text-right">412票</span></div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-surface-200 p-5">
        <h3 class="text-base font-semibold text-text-primary mb-4">各国空运业务量</h3>
        <div class="space-y-3">
            <div class="flex items-center gap-3"><span class="text-sm text-text-secondary w-20 flex-shrink-0">🇳🇬 尼日利亚</span><div class="progress-bar flex-1"><div class="progress-fill bg-green-500" style="width:88%"></div></div><span class="text-xs text-text-muted w-16 text-right">486票</span></div>
            <div class="flex items-center gap-3"><span class="text-sm text-text-secondary w-20 flex-shrink-0">🇨🇮 科特迪瓦</span><div class="progress-bar flex-1"><div class="progress-fill bg-green-400" style="width:55%"></div></div><span class="text-xs text-text-muted w-16 text-right">298票</span></div>
            <div class="flex items-center gap-3"><span class="text-sm text-text-secondary w-20 flex-shrink-0">🇸🇳 塞内加尔</span><div class="progress-bar flex-1"><div class="progress-fill bg-green-300" style="width:42%"></div></div><span class="text-xs text-text-muted w-16 text-right">225票</span></div>
            <div class="flex items-center gap-3"><span class="text-sm text-text-secondary w-20 flex-shrink-0">🇬🇭 加纳</span><div class="progress-bar flex-1"><div class="progress-fill bg-green-200" style="width:38%"></div></div><span class="text-xs text-text-muted w-16 text-right">198票</span></div>
            <div class="flex items-center gap-3"><span class="text-sm text-text-secondary w-20 flex-shrink-0">🇨🇲 喀麦隆</span><div class="progress-bar flex-1"><div class="progress-fill bg-green-100" style="width:28%"></div></div><span class="text-xs text-text-muted w-16 text-right">145票</span></div>
        </div>
    </div>
</div>
<div class="grid grid-cols-3 gap-5 mb-6">
    <div class="bg-white rounded-xl border border-surface-200 p-5">
        <h3 class="text-base font-semibold text-text-primary mb-4">主要港口吞吐量</h3>
        <div class="space-y-2.5">
            <div class="flex items-center justify-between p-2.5 bg-primary-50 rounded-lg"><div><span class="text-sm font-medium text-text-primary">Apapa/Lagos</span><span class="text-xs text-text-muted ml-2">尼日利亚</span></div><span class="text-sm font-bold text-primary-600">1,286</span></div>
            <div class="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg"><div><span class="text-sm font-medium text-text-primary">Abidjan</span><span class="text-xs text-text-muted ml-2">科特迪瓦</span></div><span class="text-sm font-bold text-text-primary">856</span></div>
            <div class="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg"><div><span class="text-sm font-medium text-text-primary">Dakar</span><span class="text-xs text-text-muted ml-2">塞内加尔</span></div><span class="text-sm font-bold text-text-primary">625</span></div>
            <div class="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg"><div><span class="text-sm font-medium text-text-primary">Tema</span><span class="text-xs text-text-muted ml-2">加纳</span></div><span class="text-sm font-bold text-text-primary">538</span></div>
            <div class="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg"><div><span class="text-sm font-medium text-text-primary">Douala</span><span class="text-xs text-text-muted ml-2">喀麦隆</span></div><span class="text-sm font-bold text-text-primary">412</span></div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-surface-200 p-5">
        <h3 class="text-base font-semibold text-text-primary mb-4">主要空运机场</h3>
        <div class="space-y-2.5">
            <div class="flex items-center justify-between p-2.5 bg-green-50 rounded-lg"><div><span class="text-sm font-medium text-text-primary">Lagos (LOS)</span><span class="text-xs text-text-muted ml-2">尼日利亚</span></div><span class="text-sm font-bold text-green-600">486</span></div>
            <div class="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg"><div><span class="text-sm font-medium text-text-primary">Abidjan (ABJ)</span><span class="text-xs text-text-muted ml-2">科特迪瓦</span></div><span class="text-sm font-bold text-text-primary">298</span></div>
            <div class="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg"><div><span class="text-sm font-medium text-text-primary">Dakar (DSS)</span><span class="text-xs text-text-muted ml-2">塞内加尔</span></div><span class="text-sm font-bold text-text-primary">225</span></div>
            <div class="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg"><div><span class="text-sm font-medium text-text-primary">Accra (ACC)</span><span class="text-xs text-text-muted ml-2">加纳</span></div><span class="text-sm font-bold text-text-primary">198</span></div>
            <div class="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg"><div><span class="text-sm font-medium text-text-primary">Douala (DLA)</span><span class="text-xs text-text-muted ml-2">喀麦隆</span></div><span class="text-sm font-bold text-text-primary">145</span></div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-surface-200 p-5">
        <h3 class="text-base font-semibold text-text-primary mb-4">待办事项</h3>
        <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg"><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-red-500"></div><span class="text-sm text-text-primary">待审核客户</span></div><span class="text-sm font-bold text-red-600">5</span></div>
            <div class="flex items-center justify-between p-3 bg-amber-50 rounded-lg"><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-amber-500"></div><span class="text-sm text-text-primary">待审批报价</span></div><span class="text-sm font-bold text-amber-600">8</span></div>
            <div class="flex items-center justify-between p-3 bg-amber-50 rounded-lg"><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-amber-500"></div><span class="text-sm text-text-primary">Lagos港待提柜</span></div><span class="text-sm font-bold text-amber-600">6</span></div>
            <div class="flex items-center justify-between p-3 bg-primary-50 rounded-lg"><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-primary-500"></div><span class="text-sm text-text-primary">账期预警</span></div><span class="text-sm font-bold text-primary-600">12</span></div>
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg"><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-green-500"></div><span class="text-sm text-text-primary">今日到港</span></div><span class="text-sm font-bold text-green-600">4</span></div>
        </div>
    </div>
</div></div>`;

function renderMenu(){
    const nav=document.getElementById('sidebar-nav');
    const L=_lang[_currentLang];
    const currentRole=DEMO_ACCOUNTS.find(a=>a.id===_currentAccount)?.role||'role-admin';
    const allowedMenus=ROLE_MENUS[currentRole]||ROLE_MENUS['role-admin'];
    const allowedByTerminal=TERMINAL_MENUS[_currentTerminal]||TERMINAL_MENUS['tms'];
    let html='';
    menuData.forEach(l1=>{
        // 端 filter（新增）：当前端不能看到的 L1 直接跳过
        if(!allowedByTerminal.includes(l1.id))return;
        // 角色 filter（OMS/PDA 端的 role-customer/role-pda 已配齐相应允许集，TMS 端走原有 ROLE_MENUS）
        if(!allowedMenus.includes(l1.id))return;
        const l1Label=langText(l1.langKey,l1.label);
        html+='<div class="mb-1">';
        if(l1.children&&l1.children.length>0){
        html+='<div class="menu-l1 flex items-center px-4 py-2.5 rounded-lg cursor-pointer" onclick="toggleL1(this)">';
        html+='<span class="text-text-secondary mr-3 flex-shrink-0">'+l1.icon+'</span>';
        html+='<span class="text-sm font-semibold text-text-primary flex-1">'+l1Label+'</span>';
        html+='<svg class="menu-arrow w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
        html+='</div>';
        html+='<div class="menu-l1-children" style="display:none">';
        l1.children.forEach(l2=>{
            if(l2.terminalOnly && l2.terminalOnly !== _currentTerminal)return; // 端 filter L2
            const l2Label=langText(l2.langKey,l2.label);
            if(l2.children&&l2.children.length>0){
                html+='<div class="menu-l2 flex items-center pl-11 pr-4 py-2 rounded-lg cursor-pointer" onclick="toggleL2(this)">';
                html+='<span class="text-sm font-medium text-text-secondary flex-1">'+l2Label+'</span>';
                html+='<svg class="menu-arrow w-3.5 h-3.5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
                html+='</div>';
                html+='<div class="menu-l2-children" style="display:none">';
                l2.children.forEach(l3=>{
                    if(l3.terminalOnly && l3.terminalOnly !== _currentTerminal)return; // 端 filter L3
                    const l3Label=langText(l3.langKey,l3.label);
                    const l3Events=l3.id==='wh-no-pre-in'?' onmousedown="return openHeadlessClaimMenu(this,event)" onclick="return openHeadlessClaimMenu(this,event)"':' onclick="selectMenuItem(this,event)"';
                    html+='<div class="menu-l3 flex items-center pl-[68px] pr-4 py-1.5 rounded-lg cursor-pointer" data-id="'+l3.id+'" data-page="'+l3.page+'" data-l1="'+l1Label+'" data-l2="'+l2Label+'" data-l3="'+l3Label+'" data-langkey="'+(l3.langKey||'')+'"'+l3Events+'>';
                    html+='<span class="l3-dot w-1.5 h-1.5 rounded-full bg-text-muted mr-2.5 flex-shrink-0"></span>';
                    html+='<span class="l3-label text-sm text-text-secondary">'+l3Label+'</span>';
                    html+='</div>';
                });
                html+='</div>';
            }else{
                const l2Events=l2.id==='wh-no-pre-in'?' onmousedown="return openHeadlessClaimMenu(this,event)" onclick="return openHeadlessClaimMenu(this,event)"':' onclick="selectMenuItem(this,event)"';
                html+='<div class="menu-l2-direct flex items-center pl-11 pr-4 py-2 rounded-lg cursor-pointer" data-id="'+l2.id+'" data-page="'+l2.page+'" data-l1="'+l1Label+'" data-l2="'+l2Label+'" data-langkey="'+(l2.langKey||'')+'"'+l2Events+'>';
                html+='<span class="l2d-label text-sm font-medium text-text-secondary flex-1">'+l2Label+'</span>';
                html+='</div>';
            }
        });
        html+='</div></div>';
        }else{
        html+='<div class="menu-l1-direct flex items-center px-4 py-2.5 rounded-lg cursor-pointer" data-id="'+l1.id+'" data-page="'+l1.page+'" data-l1="'+l1Label+'" data-langkey="'+(l1.langKey||'')+'" onclick="selectMenuItem(this,event)">';
        html+='<span class="text-text-secondary mr-3 flex-shrink-0">'+l1.icon+'</span>';
        html+='<span class="text-sm font-semibold text-text-primary flex-1">'+l1Label+'</span>';
        html+='</div>';
        }
    });
    nav.innerHTML=html;
}

function toggleL1(el){
    const isExpanded=el.classList.contains('expanded');
    if(isExpanded){el.classList.remove('expanded');el.nextElementSibling.style.display='none';}
    else{el.classList.add('expanded');el.nextElementSibling.style.display='block';}
}

function toggleL2(el){
    const isExpanded=el.classList.contains('expanded');
    if(isExpanded){el.classList.remove('expanded');el.nextElementSibling.style.display='none';}
    else{el.classList.add('expanded');el.nextElementSibling.style.display='block';}
}

function addTab(id,title,type,langKey){
    const exists=_openTabs.find(t=>t.id===id);
    if(!exists)_openTabs.push({id,title,type,langKey:langKey||''});
    _activeTab=id;
    console.log('[addTab] id='+id+' title='+title+' type='+type+' exists='+!!exists);
    renderTabs();
    if(type==='dashboard'){
        document.getElementById('main-content').innerHTML=dashboardHTML;
    }else if(type==='mobile-app'&&typeof generateMobileAppPage==='function'){
        document.getElementById('main-content').innerHTML=generateMobileAppPage(id);
    }else if(type==='list'){
        const content=renderTabContent(id);
        console.log('[addTab] content length='+content.length);
        document.getElementById('main-content').innerHTML=content;
    }
}

function removeTab(id){
    if(id==='workspace')return;
    const idx=_openTabs.findIndex(t=>t.id===id);
    if(idx===-1)return;
    _openTabs.splice(idx,1);
    if(_activeTab===id){
        const newIdx=Math.min(idx,_openTabs.length-1);
        _activeTab=_openTabs[newIdx].id;
        switchTab(_activeTab);
    }
    renderTabs();
}

function switchTab(id){
    _activeTab=id;
    const tab=_openTabs.find(t=>t.id===id);
    if(!tab)return;
    if(tab.type==='dashboard'){
        document.getElementById('main-content').innerHTML=dashboardHTML;
    }else if(tab.type==='mobile-app'&&typeof generateMobileAppPage==='function'){
        document.getElementById('main-content').innerHTML=generateMobileAppPage(id);
    }else if(tab.type==='list'){
        document.getElementById('main-content').innerHTML=renderTabContent(id);
    }
    document.querySelectorAll('.menu-l3.active,.menu-l2-direct.active,.menu-l1-direct.active').forEach(i=>i.classList.remove('active'));
    const menuItem=document.querySelector('[data-id="'+id+'"]');
    if(menuItem)menuItem.classList.add('active');
    if(id==='workspace'){
        const firstDirect=document.querySelector('.menu-l1-direct');
        if(firstDirect)firstDirect.classList.add('active');
    }
    renderTabs();
}

function renderTabs(){
    const tabBar=document.getElementById('tab-bar');
    const L=_lang[_currentLang];
    let html='';
    _openTabs.forEach(tab=>{
        const isActive=tab.id===_activeTab;
        var tabTitle=tab.title;
        if(tab.langKey){tabTitle=langText(tab.langKey,tab.title);tab.title=tabTitle;}
        else if(!tab.langKey){
            var found=null;
            menuData.forEach(function(l1){
                if(l1.id===tab.id)found=l1.langKey;
                if(l1.children)l1.children.forEach(function(l2){
                    if(l2.id===tab.id)found=l2.langKey;
                    if(l2.children)l2.children.forEach(function(l3){
                        if(l3.id===tab.id)found=l3.langKey;
                    });
                });
            });
            if(found){tabTitle=langText(found,tabTitle);tab.title=tabTitle;tab.langKey=found;}
        }
        html+='<div class="tab-item flex items-center gap-1.5 px-4 py-2 cursor-pointer border-b-2 whitespace-nowrap '+(isActive?'border-primary-600 text-primary-600 font-semibold active':'border-transparent text-text-secondary hover:bg-surface-50')+'" onclick="switchTab(\''+tab.id+'\')">';
        html+='<span class="text-sm">'+tabTitle+'</span>';
        if(tab.id!=='workspace'){
            html+='<button class="tab-close w-4 h-4 flex items-center justify-center rounded hover:bg-surface-200" onclick="event.stopPropagation();removeTab(\''+tab.id+'\')"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>';
        }
        html+='</div>';
    });
    tabBar.innerHTML=html;
}

function showColumnFilter(e,tabId,colIdx){
    e.stopPropagation();
    const data=_listData[tabId];
    if(!data)return;
    const uniqueVals=[...new Set(data.map(r=>r[colIdx]))].sort();
    _filterState={tabId,colIdx,values:uniqueVals,selected:[...uniqueVals]};
    if(_columnFilters[tabId]&&_columnFilters[tabId][colIdx]){
        _filterState.selected=[..._columnFilters[tabId][colIdx]];
    }
    const panel=document.getElementById('column-filter-panel');
    const rect=e.currentTarget.getBoundingClientRect();
    panel.style.left=rect.left+'px';
    panel.style.top=(rect.bottom+4)+'px';
    panel.classList.remove('hidden');
    document.getElementById('filter-search').value='';
    renderFilterValues();
}

function renderFilterValues(){
    const search=document.getElementById('filter-search').value.toLowerCase();
    const container=document.getElementById('filter-values');
    let html='';
    _filterState.values.forEach(v=>{
        if(search&&!v.toLowerCase().includes(search))return;
        const checked=_filterState.selected.includes(v);
        html+='<label class="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-50 cursor-pointer text-sm"><input type="checkbox" class="w-4 h-4 rounded border-surface-300 text-primary-600" value="'+esc(v)+'"'+(checked?' checked':'')+' onchange="toggleFilterValue(this)"><span class="text-text-secondary truncate">'+esc(tr(v))+'</span></label>';
    });
    container.innerHTML=html;
}

function toggleFilterValue(cb){
    const v=cb.value;
    if(cb.checked){
        if(!_filterState.selected.includes(v))_filterState.selected.push(v);
    }else{
        _filterState.selected=_filterState.selected.filter(s=>s!==v);
    }
}

function filterColumnValues(){
    renderFilterValues();
}

function applyColumnFilter(){
    if(!_columnFilters[_filterState.tabId])_columnFilters[_filterState.tabId]={};
    const allSelected=_filterState.selected.length===_filterState.values.length;
    if(allSelected){
        delete _columnFilters[_filterState.tabId][_filterState.colIdx];
    }else{
        _columnFilters[_filterState.tabId][_filterState.colIdx]=[..._filterState.selected];
    }
    const table=document.querySelector('.data-table');
    if(!table)return;
    const rows=table.querySelectorAll('tbody tr');
    const data=_listData[_filterState.tabId];
    rows.forEach((row,i)=>{
        const check=row.querySelector('.row-check');
        const rowData=data[check?parseInt(check.value,10):i];
        let visible=!!rowData;
        if(visible&&_columnFilters[_filterState.tabId]){
            for(const[colIdx,selected]of Object.entries(_columnFilters[_filterState.tabId])){
                if(!selected.includes(rowData[parseInt(colIdx)])){
                    visible=false;
                    break;
                }
            }
        }
        row.style.display=visible?'':'none';
    });
    updateSummaryRow(_filterState.tabId);
    document.getElementById('column-filter-panel').classList.add('hidden');
}

function resetColumnFilter(){
    _filterState.selected=[..._filterState.values];
    if(_columnFilters[_filterState.tabId]){
        delete _columnFilters[_filterState.tabId][_filterState.colIdx];
    }
    const table=document.querySelector('.data-table');
    if(!table)return;
    const rows=table.querySelectorAll('tbody tr');
    const data=_listData[_filterState.tabId];
    rows.forEach((row,i)=>{
        const check=row.querySelector('.row-check');
        const rowData=data[check?parseInt(check.value,10):i];
        let visible=!!rowData;
        if(visible&&_columnFilters[_filterState.tabId]){
            for(const[colIdx,selected]of Object.entries(_columnFilters[_filterState.tabId])){
                if(!selected.includes(rowData[parseInt(colIdx)])){
                    visible=false;
                    break;
                }
            }
        }
        row.style.display=visible?'':'none';
    });
    updateSummaryRow(_filterState.tabId);
    renderFilterValues();
    document.getElementById('column-filter-panel').classList.add('hidden');
}

function syncTopScroll(){
    var ts=document.getElementById('top-scroll');
    var bs=document.getElementById('bottom-scroll');
    if(ts&&bs){
        var inner=bs.querySelector('table');
        if(inner){ts.firstElementChild.style.width=inner.scrollWidth+'px';}
        ts.onscroll=function(){bs.scrollLeft=ts.scrollLeft;};
        bs.onscroll=function(){ts.scrollLeft=bs.scrollLeft;};
    }
}

function toggleQueryPanel(btn,tabId){
    const panel=document.getElementById('query-panel-'+tabId);
    if(!panel)return;
    const willShow=panel.classList.contains('hidden');
    panel.classList.toggle('hidden',!willShow);
    const span=btn.querySelector('span');
    if(span)span.textContent=willShow?tr('收起筛选'):tr('查询条件');
}

function runListSearch(tabId){
    if(_activeQueryEdit)closeQueryTextPopover(false);
    const grid=document.getElementById('query-grid-'+tabId);
    const values=[];
    if(grid){
        grid.querySelectorAll('[data-query-index]').forEach(function(el){
            if(el.closest('.query-setting-hidden'))return;
            values[parseInt(el.dataset.queryIndex,10)]=el.dataset.queryMultiline==='1'?(el.dataset.queryValue||el.value||''):(el.value||'');
        });
    }
    const wasExpanded=grid&&grid.querySelectorAll('.query-row-extra:not(.hidden)').length>0;
    _queryState[tabId]=values;
    const main=document.getElementById('main-content');
    if(main)main.innerHTML=generateListPage(tabId,1,_statusFilterVal||'');
    if(wasExpanded){
        const newGrid=document.getElementById('query-grid-'+tabId);
        if(newGrid){
            newGrid.querySelectorAll('.query-row-extra').forEach(function(el){el.classList.remove('hidden');});
            const expandBtn=newGrid.parentElement.querySelector('button[onclick*="toggleQueryExpand"]');
            if(expandBtn){
                const svg=expandBtn.querySelector('svg');
                const span=expandBtn.querySelector('span');
                if(svg)svg.style.transform='rotate(180deg)';
                if(span)span.textContent=tr('收起筛选');
            }
        }
    }
    showToast(tr('查询完成'));
}

function toggleQueryExpand(btn,tabId){
    const grid=document.getElementById('query-grid-'+tabId);
    if(!grid)return;
    const extras=grid.querySelectorAll('.query-row-extra');
    const isHidden=extras.length>0&&extras[0].classList.contains('hidden');
    extras.forEach(el=>{
        if(isHidden){el.classList.remove('hidden');}else{el.classList.add('hidden');}
    });
    const svg=btn.querySelector('svg');
    const span=btn.querySelector('span');
    if(isHidden){svg.style.transform='rotate(180deg)';if(span)span.textContent=tr('收起筛选');}
    else{svg.style.transform='';if(span)span.textContent=tr('更多筛选');}
}

function resetQueryForm(tabId){
    const grid=document.getElementById('query-grid-'+tabId);
    if(grid){
        grid.querySelectorAll('input,select,textarea').forEach(function(el){
            if(el.type==='checkbox'||el.type==='radio')el.checked=false;
            else{el.value=''; if(el.dataset.queryMultiline==='1')el.dataset.queryValue='';}
        });
    }
    delete _queryState[tabId];
    const main=document.getElementById('main-content');
    if(main)main.innerHTML=generateListPage(tabId,1,'');
    showToast(tr('查询条件已重置'));
}

function toggleCheckAll(el){
    const checks=document.querySelectorAll('.data-table tbody tr:not([style*="display: none"]) .row-check');
    checks.forEach(c=>{c.checked=el.checked;});
    syncCheckAllState();
}

function syncCheckAllState(){
    const checkAll=document.getElementById('checkAll');
    if(!checkAll)return;
    const checks=[...document.querySelectorAll('.data-table tbody tr:not([style*="display: none"]) .row-check')];
    const checked=checks.filter(c=>c.checked);
    checkAll.checked=checks.length>0&&checked.length===checks.length;
    checkAll.indeterminate=checked.length>0&&checked.length<checks.length;
}

document.addEventListener('change',function(e){
    if(e.target&&e.target.classList&&e.target.classList.contains('row-check')){
        syncCheckAllState();
    }
});

function updateSummaryRow(tabId){
    const data=_listData[tabId];
    if(!data)return;
    const c=TC[tabId];
    const table=document.querySelector('.data-table');
    if(!table)return;
    const rows=table.querySelectorAll('tbody tr');
    const visibleIndices=[];
    rows.forEach((row,i)=>{
        if(row.style.display!=='none'){
            const check=row.querySelector('.row-check');
            visibleIndices.push(check?parseInt(check.value,10):i);
        }
    });
    const dataColDefs=getListHeaderState(tabId).dataColDefs;
    const settings=getTableColumnSettings(tabId,dataColDefs);
    const visibleDataCols=dataColDefs.filter(function(col){return !settings.hidden[col.index];});
    const visibleRows=visibleIndices.map(function(i){return data[i];}).filter(Boolean);
    visibleDataCols.forEach(function(col){
        const cell=table.querySelector('tfoot [data-summary-col="'+col.index+'"] .summary-value');
        if(cell)cell.textContent=buildColumnSummaryValue(visibleRows,col);
    });
}

function openHeadlessClaimMenu(el,evt){
    if(evt){
        evt.preventDefault();
        evt.stopPropagation();
        if(evt.stopImmediatePropagation)evt.stopImmediatePropagation();
    }
    const id='wh-no-pre-in';
    const langKey='wh_no_pre_in';
    const title=langText(langKey,(TC[id]&&TC[id].t)||'无头件认领');
    document.querySelectorAll('.menu-l3.active,.menu-l2-direct.active,.menu-l1-direct.active').forEach(function(item){item.classList.remove('active');});
    const menuItem=el||document.querySelector('[data-id="'+id+'"]')||document.querySelector('[data-langkey="'+langKey+'"]');
    if(menuItem)menuItem.classList.add('active');
    let tab=_openTabs.find(function(t){return t.id===id;});
    if(!tab){
        tab={id:id,title:title,type:'list',langKey:langKey};
        _openTabs.push(tab);
    }else{
        tab.title=title;
        tab.type='list';
        tab.langKey=langKey;
    }
    _activeTab=id;
    _listPage[id]=1;
    _statusFilterVal='';
    renderTabs();
    const main=document.getElementById('main-content');
    if(main)main.innerHTML=generateHeadlessClaimListPage(id,1,'');
    setTimeout(function(){applyRuntimeEnhancements(document.getElementById('main-content'));},0);
    return false;
}

function setupHeadlessClaimMenuGuard(){
    if(window.__headlessClaimMenuGuard)return;
    window.__headlessClaimMenuGuard=true;
    document.addEventListener('click',function(e){
        const el=e.target&&e.target.closest?e.target.closest('[data-id="wh-no-pre-in"],[data-langkey="wh_no_pre_in"]'):null;
        if(!el)return;
        openHeadlessClaimMenu(el,e);
    },true);
}

function selectMenuItem(el,evt){
    if(evt){
        evt.preventDefault();
        evt.stopPropagation();
    }
    document.querySelectorAll('.menu-l3.active,.menu-l2-direct.active,.menu-l1-direct.active').forEach(i=>i.classList.remove('active'));
    el.classList.add('active');
    const page=el.dataset.page;
    let id=el.dataset.id||el.dataset.tab||'';
    let langKey=el.dataset.langkey||'';
    const clickedText=(el.textContent||'').replace(/\s+/g,'');
    if(id==='wh-no-pre-in'||langKey==='wh_no_pre_in'||clickedText.indexOf('无头件认领')>=0||clickedText.indexOf('HeadlessPieceClaim')>=0){
        id='wh-no-pre-in';
        langKey='wh_no_pre_in';
        return openHeadlessClaimMenu(el,evt);
    }else if(id==='wh-headless'||langKey==='wh_headless'||clickedText==='无头件'){
        id='wh-headless';
        langKey='wh_headless';
    }
    const L=_lang[_currentLang];
    console.log('[selectMenuItem] id='+id+' page='+page+' TC_exists='+!!TC[id]+' langKey='+langKey);
    if(page==='mobile-app'&&typeof isMobileAppTab==='function'&&isMobileAppTab(id)){
        addTab(id,getMobileAppTitle(id),'mobile-app',langKey);
    }else if(id&&TC[id]){
        addTab(id,langText(langKey,TC[id].t),'list',langKey);
        if(id==='wh-no-pre-in'){
            _activeTab=id;
            _listPage[id]=1;
            document.getElementById('main-content').innerHTML=generateHeadlessClaimListPage(id,1,'');
            renderTabs();
        }else if(id==='wh-headless'){
            _activeTab=id;
            document.getElementById('main-content').innerHTML=generateWarehouseHeadlessInboundPage(id);
            renderTabs();
        }
    }else if(page==='dashboard'){
        addTab('workspace',L.workspace,'dashboard','workspace');
    }else{
        console.warn('[selectMenuItem] No handler for id='+id+' page='+page);
    }
}

function navigateToTab(page,tabId){
    var menuEl=document.querySelector('[data-id="'+tabId+'"]');
    if(menuEl){
        selectMenuItem(menuEl);
    }else if(TC[tabId]){
        var L=_lang[_currentLang];
        var langKey='';
        var menuItems=document.querySelectorAll('[data-id]');
        menuItems.forEach(function(el){if(el.dataset.id===tabId)langKey=el.dataset.langkey||'';});
        addTab(tabId,langText(langKey,TC[tabId].t),'list',langKey);
    }else if(typeof isMobileAppTab==='function'&&isMobileAppTab(tabId)){
        addTab(tabId,getMobileAppTitle(tabId),'mobile-app','');
    }
}

function updateBreadcrumb(path){
    const bc=document.getElementById('breadcrumb');
    let html='<span class="text-text-muted">'+_lang[_currentLang].appName+'</span>';
    path.forEach((seg,i)=>{
        html+='<span class="mx-2 text-surface-300">/</span>';
        if(i===path.length-1)html+='<span class="text-text-primary font-medium">'+seg+'</span>';
        else html+='<span class="text-text-muted">'+seg+'</span>';
    });
    bc.innerHTML=html;
}

function openModal(id,question,cat){
    document.getElementById('modal-id').textContent=id;
    document.getElementById('modal-title').textContent=question;
    document.getElementById('modal-badge').textContent=cat;
    document.getElementById('modal-answer').value='';
    document.getElementById('modal').classList.add('show');
}

function closeModal(){
    document.getElementById('modal').classList.remove('show');
}

document.getElementById('modal').addEventListener('click',function(e){
    if(e.target===this)closeModal();
});

document.getElementById('crud-modal').addEventListener('click',function(e){
    if(e.target===this)closeCrudModal();
});

document.getElementById('expression-modal').addEventListener('click',function(e){
    if(e.target===this)closeExpressionModal();
});

function generateQRCode(){
    const container=document.getElementById('qrcode-container');
    if(container.querySelector('img'))return;
    container.innerHTML='';
    const url='https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=ww1234567890&agentid=1000002&redirect_uri='+encodeURIComponent(window.location.href);
    new QRCode(container,{text:url,width:180,height:180,colorDark:'#1E293B',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
}

function switchLoginTab(btn,tabId){
    btn.parentElement.querySelectorAll('.login-tab').forEach(b=>{b.classList.remove('active');b.classList.add('border-transparent','text-text-secondary');b.classList.remove('border-primary-600','text-primary-600');});
    btn.classList.add('active');btn.classList.remove('border-transparent','text-text-secondary');btn.classList.add('border-primary-600','text-primary-600');
    document.getElementById('login-account').classList.add('hidden');
    document.getElementById('login-qrcode').classList.add('hidden');
    document.getElementById(tabId).classList.remove('hidden');
    if(tabId==='login-qrcode')setTimeout(generateQRCode,100);
}

// ========== 端选择器 / login / logout ==========
// 登录页 3-端选择器点击切换：高亮 + 联动账号输入框默认值 + 持久化
function selectTerminal(t){
    if(!(t==='oms'||t==='tms'||t==='pda'))t='tms';
    document.querySelectorAll('#terminal-selector .terminal-btn').forEach(function(b){b.removeAttribute('data-active');});
    var btn=document.querySelector('#terminal-selector [data-terminal="'+t+'"]');
    if(btn)btn.setAttribute('data-active','');
    var u=document.getElementById('login-username');
    if(u)u.value=TERMINAL_DEFAULT_USERNAMES[t]||'';
    var p=document.getElementById('login-password');
    if(p && !p.value)p.value='demo';
    try{localStorage.setItem('terminal',t);}catch(e){}
}

function login(){
    const username=document.getElementById('login-username').value;
    const password=document.getElementById('login-password').value;
    const errorEl=document.getElementById('login-error');
    if(!username||!password){errorEl.textContent=_lang[_currentLang].username+'/'+_lang[_currentLang].password;errorEl.classList.remove('hidden');return;}
    errorEl.classList.add('hidden');
    // 端：从选择器读取
    const activeBtn=document.querySelector('#terminal-selector .terminal-btn[data-active]');
    var t=activeBtn?activeBtn.dataset.terminal:'tms';
    if(!(t==='oms'||t==='tms'||t==='pda'))t='tms';
    _currentTerminal=t;
    try{localStorage.setItem('terminal',t);}catch(e){}
    // 账号：输入名若能在 DEMO_ACCOUNTS 同端匹配则用之，否则用该端首个 demo 账号
    var inputAcc=DEMO_ACCOUNTS.find(function(a){return a.id===username && a.terminal===t;});
    if(inputAcc){_currentAccount=inputAcc.id;}
    else {var def=DEMO_ACCOUNTS.find(function(a){return a.terminal===t;});_currentAccount=def?def.id:'admin';}
    const loginPage=document.getElementById('login-page');
    loginPage.classList.add('out');
    setTimeout(()=>{
        loginPage.style.display='none';
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('main-app').style.display='flex';
        initApp();
    },400);
}

function logout(){
    closeUserDropdown();
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('main-app').style.display='none';
    const loginPage=document.getElementById('login-page');
    loginPage.style.display='flex';
    loginPage.classList.remove('out');
    document.getElementById('login-username').value='';
    document.getElementById('login-password').value='';
    document.getElementById('main-content').innerHTML='';
    // 端：清空 + 重置 UI（PDA 端登录时 sidebar 被 inline 隐藏，这里恢复）
    try{localStorage.removeItem('terminal');}catch(e){}
    _currentTerminal='tms';
    document.body.dataset.terminal='tms';
    var sb=document.getElementById('sidebar');
    if(sb)sb.style.display='';
    selectTerminal('tms');
}

function toggleUserDropdown(e){
    e.stopPropagation();
    const dd=document.getElementById('user-dropdown');
    const arrow=document.getElementById('dropdown-arrow');
    if(dd.classList.contains('hidden')){dd.classList.remove('hidden');arrow.style.transform='rotate(180deg)';}
    else closeUserDropdown();
}

function closeUserDropdown(){
    document.getElementById('user-dropdown').classList.add('hidden');
    document.getElementById('dropdown-arrow').style.transform='';
}

// ========== 角色权限系统函数 ==========
function getRoleDisplayName(role){
    const names={'role-admin':'超级管理员','role-sales':'业务员','role-quote':'报价员','role-finance':'财务','role-customer':'客户','role-pda':'仓管'};
    return tr(names[role]||role);
}

function updateUserInfo(){
    const account=DEMO_ACCOUNTS.find(a=>a.id===_currentAccount)||DEMO_ACCOUNTS[0];
    const termLabel=TERMINAL_LABELS[_currentTerminal]||'';
    document.getElementById('user-avatar-text').textContent=account.avatar;
    document.getElementById('user-name').textContent=account.name;
    // 顶部栏部门后追加端 badge（一直可见）
    document.getElementById('user-dept').innerHTML=esc(tr(account.dept))+' · <span class="text-primary-600 font-medium">'+esc(termLabel)+'</span>';
    document.getElementById('dropdown-avatar').textContent=account.avatar;
    document.getElementById('dropdown-name').textContent=account.name;
    // 下拉里展示「端 · 角色」
    document.getElementById('dropdown-role').textContent=termLabel+' · '+getRoleDisplayName(account.role);
    // 账号切换器：仅列出同端账号
    const switcher=document.getElementById('account-switcher');
    let html='';
    DEMO_ACCOUNTS.filter(function(a){return a.terminal===_currentTerminal;}).forEach(acc=>{
        const isActive=acc.id===_currentAccount;
        const roleName=getRoleDisplayName(acc.role);
        html+='<div class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer '+(isActive?'bg-primary-50 border border-primary-200':'bg-surface-50 hover:bg-surface-100')+'" onclick="switchAccount(\''+acc.id+'\')" style="'+(isActive?'border-color:#dbeafe':'')+'">';
        html+='<div class="w-7 h-7 '+(isActive?'bg-primary-600':'bg-surface-300')+' rounded-full flex items-center justify-center"><span class="text-xs font-semibold text-white">'+(isActive?'✓':acc.avatar)+'</span></div>';
        html+='<div class="flex-1 min-w-0"><div class="text-sm '+(isActive?'font-medium text-primary-700':'text-text-primary')+'">'+acc.name+'</div><div class="text-xs text-text-muted truncate">'+roleName+' · '+tr(acc.dept)+'</div></div>';
        html+='</div>';
    });
    switcher.innerHTML=html;
}

function switchAccount(accountId){
    if(accountId===_currentAccount){closeUserDropdown();return;}
    _currentAccount=accountId;
    updateUserInfo();
    renderMenu();
    // 关闭下拉菜单
    closeUserDropdown();
    // 重置到当前端首页
    if(_currentTerminal==='oms'&&typeof mobileAppOpen==='function'){
        mobileAppOpen('client-app-home');
    }else if(_currentTerminal==='pda'&&typeof generateWarehousePdaPage==='function'){
        _openTabs=[{id:'pda-app',title:'PDA 工作台',type:'list',langKey:''}];
        _activeTab='pda-app';
        renderTabs();
        document.getElementById('main-content').innerHTML=generateWarehousePdaPage('pda-app');
    }else{
        addTab('workspace',_lang[_currentLang].workspace,'dashboard','workspace');
        document.getElementById('main-content').innerHTML=dashboardHTML;
    }
}

document.addEventListener('click',function(e){
    const container=document.getElementById('user-menu-container');
    if(container&&!container.contains(e.target))closeUserDropdown();
    const filterPanel=document.getElementById('column-filter-panel');
    if(filterPanel&&!filterPanel.classList.contains('hidden')&&!filterPanel.contains(e.target)){
        filterPanel.classList.add('hidden');
    }
});

var _dragColIdx=-1;

function thDragStart(e,colIdx){
    _dragColIdx=colIdx;
    e.dataTransfer.effectAllowed='move';
    e.target.classList.add('dragging');
}

function thDragEnd(e){
    e.target.classList.remove('dragging');
    const ths=e.target.closest('tr').querySelectorAll('th');
    ths.forEach(th=>th.classList.remove('drag-over'));
}

function thDragOver(e,colIdx){
    e.preventDefault();
    e.dataTransfer.dropEffect='move';
    const ths=e.target.closest('tr').querySelectorAll('th');
    ths.forEach(th=>th.classList.remove('drag-over'));
    if(colIdx!==_dragColIdx){
        e.target.closest('th').classList.add('drag-over');
    }
}

function thDragLeave(e){
    e.target.closest('th').classList.remove('drag-over');
}

function thDrop(e,toColIdx,tabId){
    e.preventDefault();
    e.target.closest('th').classList.remove('drag-over');
    const fromColIdx=_dragColIdx;
    if(fromColIdx===toColIdx||fromColIdx<0)return;
    const table=e.target.closest('.data-table');
    if(!table)return;
    swapTableColumns(table,fromColIdx,toColIdx);
    if(!_colOrder[tabId])_colOrder[tabId]=[];
    const order=_colOrder[tabId];
    if(order.length===0){
        const c=TC[tabId];
        const len=c.h.length;
        for(let i=0;i<len;i++)order.push(i);
    }
    const fromPos=order.indexOf(fromColIdx);
    const toPos=order.indexOf(toColIdx);
    if(fromPos!==-1&&toPos!==-1){
        order.splice(fromPos,1);
        order.splice(toPos,0,fromColIdx);
    }
    _dragColIdx=-1;
}

function swapTableColumns(table,from,to){
    const rows=table.querySelectorAll('tr');
    rows.forEach(row=>{
        const cells=row.querySelectorAll('td,th');
        if(from<cells.length&&to<cells.length){
            if(from<to){
                cells[to].parentNode.insertBefore(cells[from],cells[to].nextSibling);
            }else{
                cells[to].parentNode.insertBefore(cells[from],cells[to]);
            }
        }
    });
}

function startColResize(e,handle){
    e.preventDefault();
    e.stopPropagation();
    const th=handle.parentElement;
    const table=th.closest('table');
    const colIdx=Array.from(th.parentNode.children).indexOf(th);
    const startX=e.pageX;
    const startWidth=th.offsetWidth;
    handle.classList.add('active');
    const onMove=function(ev){
        const diff=ev.pageX-startX;
        const newWidth=Math.max(80,startWidth+diff);
        th.style.width=newWidth+'px';
        th.style.minWidth=newWidth+'px';
        const rows=table.querySelectorAll('tr');
        rows.forEach(row=>{
            const cells=row.querySelectorAll('td,th');
            if(cells[colIdx]){
                cells[colIdx].style.width=newWidth+'px';
                cells[colIdx].style.minWidth=newWidth+'px';
            }
        });
    };
    const onUp=function(){
        handle.classList.remove('active');
        document.removeEventListener('mousemove',onMove);
        document.removeEventListener('mouseup',onUp);
    };
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp);
}

function showSettings(){
    closeUserDropdown();
    document.getElementById('settings-modal').classList.add('show');
}

function showLanguageSettings(){
    closeUserDropdown();
    updateLangOptions();
    const title=document.querySelector('#language-modal h3');
    if(title)title.textContent=(_lang[_currentLang]&&_lang[_currentLang].langSwitch)||tr('语言切换');
    document.getElementById('language-modal').classList.add('show');
}

function closeLanguageSettings(){
    document.getElementById('language-modal').classList.remove('show');
}

function closeSettings(){
    document.getElementById('settings-modal').classList.remove('show');
    document.getElementById('settings-old-pwd').value='';
    document.getElementById('settings-new-pwd').value='';
    document.getElementById('settings-confirm-pwd').value='';
    document.querySelectorAll('.pwd-strength').forEach(b=>{b.className='pwd-strength h-1 flex-1 rounded bg-surface-200';});
}

function switchSettingsTab(btn,tabId){
    btn.parentElement.querySelectorAll('.settings-tab').forEach(b=>{b.classList.remove('active');b.classList.add('border-transparent','text-text-secondary');b.classList.remove('border-primary-600','text-primary-600');});
    btn.classList.add('active');btn.classList.remove('border-transparent','text-text-secondary');btn.classList.add('border-primary-600','text-primary-600');
    document.querySelectorAll('.settings-tab-content').forEach(t=>t.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
}

function changePassword(){
    const oldPwd=document.getElementById('settings-old-pwd').value;
    const newPwd=document.getElementById('settings-new-pwd').value;
    const confirmPwd=document.getElementById('settings-confirm-pwd').value;
    const L=_lang[_currentLang];
    if(!oldPwd||!newPwd||!confirmPwd){showToast(_currentLang==='zh'?'请填写所有密码字段':_currentLang==='fr'?'Veuillez remplir tous les champs':'Please fill all fields');return;}
    if(newPwd!==confirmPwd){showToast(_currentLang==='zh'?'两次输入的新密码不一致':_currentLang==='fr'?'Les mots de passe ne correspondent pas':'Passwords do not match');return;}
    if(newPwd.length<8){showToast(_currentLang==='zh'?'新密码长度不能少于8位':_currentLang==='fr'?'Minimum 8 caractères':'Minimum 8 characters');return;}
    const hasLetter=/[a-zA-Z]/.test(newPwd);
    const hasNumber=/[0-9]/.test(newPwd);
    if(!hasLetter||!hasNumber){showToast(_currentLang==='zh'?'新密码需包含字母和数字':_currentLang==='fr'?'Doit contenir lettres et chiffres':'Must contain letters and numbers');return;}
    closeSettings();
    showToast(_currentLang==='zh'?'密码修改成功':_currentLang==='fr'?'Mot de passe modifié':'Password changed');
}

function resetPassword(){
    closeSettings();
    showToast(_currentLang==='zh'?'密码已重置为默认密码':_currentLang==='fr'?'Mot de passe réinitialisé':'Password reset');
}

document.getElementById('settings-modal').addEventListener('click',function(e){
    if(e.target===this)closeSettings();
});

document.getElementById('language-modal').addEventListener('click',function(e){
    if(e.target===this)closeLanguageSettings();
});

function checkPwdStrength(pwd){
    const bars=document.querySelectorAll('.pwd-strength');
    let score=0;
    if(pwd.length>=8)score++;
    if(/[a-zA-Z]/.test(pwd)&&/[0-9]/.test(pwd))score++;
    if(/[^a-zA-Z0-9]/.test(pwd)&&pwd.length>=12)score++;
    const colors=['bg-red-400','bg-amber-400','bg-green-400'];
    bars.forEach((b,i)=>{
        b.className='pwd-strength h-1 flex-1 rounded '+(i<score?colors[score-1]:'bg-surface-200');
    });
}

function showToast(message){
    const toast=document.getElementById('toast');
    document.getElementById('toast-message').textContent=message;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),3000);
}

