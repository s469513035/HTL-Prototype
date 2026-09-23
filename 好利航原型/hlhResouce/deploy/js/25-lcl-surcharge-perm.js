/* ===== 客户管理 · 申请开户 =====
 * 仅「待开户」客户可申请；弹窗补充确认 基本信息 / 企业资质信息 / 附件信息，
 * 提交后开户状态置为「审批中」。
 */
var CRM_ACCT_FILE_TYPES=['营业执照','法人身份证','开户许可证','签约合同','其他'];
var _crmAcctFiles=[];
var _crmAcctCtx=null;   /* {id,rowIdx} */

function openSelectedCrmAccountApply(id){
    var idx=(typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1;
    if(idx<0){showToast(tr('请先勾选一条客户数据'));return;}
    var c=TC[id]||{};
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var row=data[idx];
    if(!row){showToast(tr('未找到客户数据'));return;}
    var st=getTableValueByHeader(c,row,'开户状态','');
    if(st!=='待开户'){showToast(tr('仅「待开户」状态的客户可以申请开户，当前为')+'「'+(st||'—')+'」');return;}
    openCrmAccountApplyModal(id,idx);
}

function crmAcctSection(title,inner){
    return '<section class="rounded-lg border border-surface-200 bg-white p-4">'+
        '<div class="flex items-center gap-2 mb-4"><span class="w-1 h-4 bg-amber-400 rounded-full"></span>'+
        '<span class="text-sm font-semibold text-text-primary">'+tr(title)+'</span></div>'+inner+'</section>';
}

function crmAcctFileRowsHtml(){
    if(!_crmAcctFiles.length){
        return '<tr><td colspan="8" class="py-12 text-center text-text-muted">'+
            '<svg class="w-10 h-10 mx-auto mb-2 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>'+
            '<div>'+tr('无数据')+'</div></td></tr>';
    }
    return _crmAcctFiles.map(function(f,i){
        return '<tr class="border-t border-surface-100 hover:bg-primary-50/30">'+
            '<td class="px-3 py-2 text-primary-700">'+(i+1)+'</td>'+
            '<td class="px-3 py-2 text-text-primary">'+esc(f.name)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(f.type)+'</td>'+
            '<td class="px-3 py-2"><span class="inline-flex items-center justify-center w-11 h-10 px-1 text-[10px] leading-tight text-center text-text-muted bg-surface-50 border border-surface-200 rounded">'+tr('暂无图片')+'</span></td>'+
            '<td class="px-3 py-2 text-text-secondary">'+esc(f.size)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(f.by)+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(f.time)+'</td>'+
            '<td class="px-3 py-2 whitespace-nowrap"><button type="button" onclick="removeCrmAcctFile('+i+')" class="px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded cursor-pointer">'+tr('删除')+'</button></td></tr>';
    }).join('');
}

function renderCrmAcctFiles(){
    var tb=document.getElementById('crm-acct-file-body');
    if(tb)tb.innerHTML=crmAcctFileRowsHtml();
}

function removeCrmAcctFile(i){
    _crmAcctFiles.splice(i,1);
    renderCrmAcctFiles();
}

function handleCrmAcctUpload(input){
    if(!input||!input.files)return;
    var sel=document.getElementById('crm-acct-file-type');
    var ftype=sel?sel.value:CRM_ACCT_FILE_TYPES[0];
    var now=(typeof receiptNowStr==='function')?receiptNowStr():'';
    Array.prototype.slice.call(input.files).forEach(function(file){
        _crmAcctFiles.push({name:file.name,type:ftype,size:String(Math.max(0,Math.round(file.size/1024))),by:'当前操作员',time:now});
    });
    input.value='';
    renderCrmAcctFiles();
}

/* 开户币别：单选下拉。币种沿用整柜那套业务币种（含西非法郎 XOF / 奈拉 NGN） */
function crmAcctCurrencyOptions(){
    return (typeof FCL_CURRENCY_OPTIONS!=='undefined'&&FCL_CURRENCY_OPTIONS.length)?FCL_CURRENCY_OPTIONS:['USD','CNY','EUR','XOF','NGN'];
}
function crmAcctCurrencyHtml(){
    return '<select id="crm-acct-currency" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+
        selectOptionsHtml(crmAcctCurrencyOptions(),'CNY')+'</select>';
}
function getCrmAcctCurrency(){
    var el=document.getElementById('crm-acct-currency');
    return el?String(el.value||''):'';
}

function openCrmAccountApplyModal(id,rowIdx){
    var c=TC[id]||{};
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var row=data[rowIdx];
    var g=function(n,fb){return getTableValueByHeader(c,row,n,fb||'');};
    _crmAcctFiles=[];_crmAcctCtx={id:id,rowIdx:rowIdx};
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    var roCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-secondary cursor-not-allowed';
    function fld(label,inner,req,span){
        return '<div class="flex flex-col gap-1.5'+(span?' '+span:'')+'"><label class="text-sm font-medium text-text-secondary">'+(req?'<span class="text-red-500">*</span> ':'')+tr(label)+'</label>'+inner+'</div>';
    }
    function inp(val,ph,ro){return '<input type="text" class="'+(ro?roCls:inCls)+'" value="'+esc(val||'')+'" placeholder="'+esc(tr(ph||''))+'"'+(ro?' readonly':'')+'>';}
    function sel(opts,val){return '<select class="'+inCls+'">'+selectOptionsHtml(opts,val)+'</select>';}

    var h='<div class="space-y-4">';

    /* 客户基础信息：从所选客户带出，不在本弹窗修改。弹窗收窄后按三列排布 */
    var baseGrid='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">';
    baseGrid+=fld('客户代码',inp(g('客户代码'),'',true));
    baseGrid+=fld('客户全称',inp(g('客户全称'),'',true),false,'md:col-span-2');
    baseGrid+=fld('客户简称',inp(g('客户简称'),'',true));
    /* 客户等级非必填。客服 / 操作不再挂客户，跟着所属业务员（销售部员工）与目的国走 */
    baseGrid+=fld('客户等级',sel(['A类','B类','C类','D类'],g('客户等级','A类')));
    baseGrid+=fld('结算周期',sel(['出货票结','出货月结','签收月结'],g('结算周期','出货月结')),true);
    baseGrid+=fld('所属业务员',sel(getEmployeeNameOptions(),g('所属业务员')));
    baseGrid+=fld('信用额度授信','<input type="number" min="0" class="'+inCls+'" value="0">',true);
    baseGrid+=fld('开户币别',crmAcctCurrencyHtml(),true);
    baseGrid+='<div class="flex flex-col gap-1.5 md:col-span-3"><label class="text-sm font-medium text-text-secondary">'+tr('备注')+'</label><textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入备注'))+'"></textarea></div>';
    baseGrid+='</div>';
    h+=crmAcctSection('基本信息',baseGrid);

    /* 企业资质信息：开户审批要看齐资质，这里整块标必填 */
    var qualGrid='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">';
    qualGrid+=fld('统一社会信用代码',inp(g('公司营业执照'),'请输入统一社会信用代码'),true);
    qualGrid+=fld('法人姓名',inp(g('法人姓名'),'请输入法人姓名'),true);
    qualGrid+=fld('法人身份证',inp(g('法人身份证'),'请输入法人身份证号'),true);
    qualGrid+=fld('法人电话',inp(g('法人电话'),'请输入法人电话'),true);
    qualGrid+=fld('注册资金',inp(g('注册资金'),'如：500万'),true);
    qualGrid+=fld('注册年限',inp(g('注册年限'),'如：10年'),true);
    qualGrid+=fld('营业执照注册时间','<input type="date" class="'+inCls+'">',true);
    qualGrid+=fld('开户名',inp(g('客户全称'),'请输入开户名'),true);
    qualGrid+=fld('开户行',inp('','请输入开户行'),true);
    qualGrid+=fld('银行账号',inp('','请输入银行账号'),true);
    qualGrid+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500">*</span> '+tr('营业范围')+'</label><textarea rows="2" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y">'+esc(g('营业范围'))+'</textarea></div>';
    qualGrid+='</div>';
    h+=crmAcctSection('企业资质信息',qualGrid);

    /* 附件信息 */
    var att='<div class="flex items-center gap-3 mb-3"><label class="text-sm text-text-secondary whitespace-nowrap">'+tr('请选择附件类型')+'</label>';
    att+='<select id="crm-acct-file-type" class="h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 w-48">'+selectOptionsHtml(CRM_ACCT_FILE_TYPES,CRM_ACCT_FILE_TYPES[0])+'</select></div>';
    att+='<div class="rounded-lg border-2 border-dashed border-surface-200 bg-surface-50/60 py-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors" onclick="document.getElementById(\'crm-acct-file-input\').click()">';
    att+='<svg class="w-10 h-10 mx-auto text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>';
    att+='<div class="text-sm text-text-secondary">'+tr('点击或者拖动文件到该区域来上传')+'</div>';
    att+='<div class="text-xs text-text-muted mt-1">'+tr('请上传 大小不超过 25MB 格式为 doc/xls/xlsx/txt/pdf/zip/rar/jpg/jpeg/png/gif/bmp 的文件 最多上传10个附件')+'</div>';
    att+='<input type="file" id="crm-acct-file-input" class="hidden" multiple onchange="handleCrmAcctUpload(this)"></div>';
    att+='<div class="mt-3 border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm" style="min-width:820px"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['序号','文件名称','文件类型','缩略图','文件大小(kb)','上传人','上传时间','操作'].forEach(function(hd){
        att+='<th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">'+tr(hd)+'</th>';
    });
    att+='</tr></thead><tbody id="crm-acct-file-body">'+crmAcctFileRowsHtml()+'</tbody></table></div>';
    h+=crmAcctSection('附件信息',att);
    h+='</div>';

    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('申请开户');
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitCrmAccountApply()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('提交申请')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* 提交后进入审批中，列表刷新（写 _listData 副本，不污染种子数据） */
function submitCrmAccountApply(){
    if(!_crmAcctCtx){closeCrudModal();return;}
    var currency=getCrmAcctCurrency();
    if(!currency){showToast(tr('请选择开户币别'));return;}
    var id=_crmAcctCtx.id,rowIdx=_crmAcctCtx.rowIdx,c=TC[id]||{};
    if(!_listData[id])_listData[id]=(c.d||[]).map(function(r){return r.slice();});
    var headers=c.h||[],row=_listData[id][rowIdx];
    if(row){
        var i=headers.indexOf('开户状态');
        /* 必须走 setRowOverride：紧接着的 generateListPage 会 _listData[id]=expandData(id)
         * 从种子重新展开，直接改 _listData 的话这次提交下一帧就被冲掉了 */
        if(i>=0)setRowOverride(id,row,i,'审批中');
    }
    closeCrudModal();
    var mc=document.getElementById('main-content');
    var pg=(typeof _listPage!=='undefined'&&_listPage[id])?_listPage[id]:1;
    var sf=(typeof _statusFilterVal!=='undefined')?(_statusFilterVal||''):'';
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,pg,sf);
    showToast(tr('开户申请已提交，等待审批')+'（'+tr('开户币别')+'：'+currency+'）');
}

function openCrmCustomerModal(mode,id,rowIdx,rowData){
    const c=TC[id];
    const L=_lang[_currentLang];
    const readonly=mode==='view';
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:L.edit;
    titleEl.textContent=modeLabel+tr(c.t);
    const codeIdx=(c.h||[]).indexOf('客户代码');
    const rawData=TC[id].d||[];
    const lastCode=(rawData[rawData.length-1]&&rawData[rawData.length-1][codeIdx])||'C10000';
    const lm=String(lastCode).match(/^(.*?)(\d+)$/);
    const autoCode=lm?lm[1]+String(parseInt(lm[2],10)+1).padStart(lm[2].length,'0'):'C10001';
    const customerCode=mode==='add'?autoCode:getTableValueByHeader(c,rowData,'客户代码','');
    const shortName=getTableValueByHeader(c,rowData,'客户简称','');
    const fullName=getTableValueByHeader(c,rowData,'客户全称','');
    const bizType=getTableValueByHeader(c,rowData,'业务类型','');
    const country=getTableValueByHeader(c,rowData,'所属国家','CN 中国');
    const pickupWarehouse=getTableValueByHeader(c,rowData,'海外提货偏好仓库','');
    const riskControl=getTableValueByHeader(c,rowData,'风险把控','');
    const warehouseOptions=getWarehouseNameOptions();
    String(pickupWarehouse||'').split(',').forEach(function(name){name=name.trim();if(name&&!warehouseOptions.includes(name))warehouseOptions.push(name);});
    const legalIdCard=getTableValueByHeader(c,rowData,'法人身份证','');
    const regCapital=getTableValueByHeader(c,rowData,'注册资本','');
    const contactPhone=getTableValueByHeader(c,rowData,'联系电话','');
    const hasContract=getTableValueByHeader(c,rowData,'是否签订合同','');
    const legalName=getTableValueByHeader(c,rowData,'法人姓名','');
    const licenseRegDate=getTableValueByHeader(c,rowData,'营业执照注册时间','');
    const salesPerson=getTableValueByHeader(c,rowData,'所属业务员','');
    const senderContact=getTableValueByHeader(c,rowData,'发件人','');
    const senderCompany=getTableValueByHeader(c,rowData,'发件人公司','');
    const senderPhone=getTableValueByHeader(c,rowData,'发件人电话','');
    const senderAddress=getTableValueByHeader(c,rowData,'发件人地址','');
    let html='<div class="space-y-5">';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('客户基本信息')+'</div><div class="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">';
    html+=crmInputFieldHtml('客户代码',customerCode,'text',true);
    html+=crmInputFieldHtml('客户简称',shortName,'text',readonly);
    html+=crmInputFieldHtml('客户全称',fullName,'text',readonly);
    html+=crmSelectFieldHtml('业务类型',['散货','整柜'],bizType,readonly);
    /* 第 2 行 */
    html+=crmSelectFieldHtml('所属国家',COUNTRY_CODE_NAME_OPTIONS,country,readonly);
    html+=readonly?crmWarehouseDisplayHtml('海外提货偏好仓库',warehouseOptions,pickupWarehouse):checkedDropdownFieldHtml('海外提货偏好仓库',warehouseOptions,pickupWarehouse);
    html+=crmSelectFieldHtml('客户类型',['直客','同行','平台','代理'],getTableValueByHeader(c,rowData,'客户类型',''),readonly);
    html+=crmSelectFieldHtml('客户等级',['A类','B类','C类','D类'],getTableValueByHeader(c,rowData,'客户等级',''),readonly);
    /* 第 3 行：客户只认「所属业务员」一个归属人。客服 / 操作由这个业务员的员工档案带出
     * （销售部员工才有这对搭档），目的国另有一套按国家路由的客服 / 操作，两处都不在客户身上维护。 */
    html+=crmSelectFieldHtml('所属业务员',getEmployeeNameOptions(),salesPerson,readonly);
    html+=crmSelectFieldHtml('结算周期',['出货票结','出货月结','签收月结'],getTableValueByHeader(c,rowData,'结算周期',''),readonly);
    /* 末行：联系方式与启用状态 */
    html+=crmInputFieldHtml('联系人',getTableValueByHeader(c,rowData,'联系人',''),'text',readonly);
    html+=crmInputFieldHtml('联系电话',contactPhone,'tel',readonly);
    html+=crmInputFieldHtml('客户邮箱',getTableValueByHeader(c,rowData,'客户邮箱',''),'email',readonly);
    html+=crmSelectFieldHtml('启用状态',['启用','禁用'],getTableValueByHeader(c,rowData,'启用状态','启用'),readonly);
    html+='</div></div>';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('发件人信息')+'</div><div class="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">';
    if(readonly){
        html+=crmInputFieldHtml('发件人',senderContact,'text',true);
        html+=crmInputFieldHtml('发件人公司',senderCompany,'text',true);
        html+=crmInputFieldHtml('发件人电话',senderPhone,'tel',true);
        html+='<div class="md:col-span-1 flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('发件人地址')+'</label><input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(senderAddress||'')+'" readonly disabled></div>';
    }else{
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('发件人')+'</label><input type="text" list="shipment-sender-options" oninput="fillShipmentSenderInfo(this)" onchange="fillShipmentSenderInfo(this)" value="'+esc(senderContact||'')+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" placeholder="'+tr('输入联系人模糊匹配，选中自动带出')+'"></div>';
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('发件人公司')+'</label><input type="text" id="shipment-sender-company" value="'+esc(senderCompany||'')+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" placeholder="'+tr('选中发件人后自动填充')+'"></div>';
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('发件人电话')+'</label><input type="tel" id="shipment-sender-phone" value="'+esc(senderPhone||'')+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" placeholder="'+tr('选中发件人后自动填充')+'"></div>';
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('发件人地址')+'</label><input type="text" id="shipment-sender-address" value="'+esc(senderAddress||'')+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" placeholder="'+tr('选中发件人后自动填充')+'"></div>';
        html+=shipmentSenderDatalistHtml();
    }
    html+='</div></div>';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('企业资质信息')+'</div>'+
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">'+
            /* 企业资质信息全部非必填。银行账户三件套（开户名/开户行/银行账号）已撤 ——
             * 客户管理不维护收付款账户，那是「客户账户(财务结算)」的事。 */
            crmLeadingStarFieldHtml('是否签订合同','select',hasContract,readonly,false,{options:['是','否'],placeholder:'请选择'})+
            crmLeadingStarFieldHtml('法人姓名','text',legalName,readonly,false)+
            crmLeadingStarFieldHtml('法人身份证','text',legalIdCard,readonly,false)+
            crmLeadingStarFieldHtml('注册资本','text',regCapital,readonly,false)+
            crmLeadingStarFieldHtml('营业执照注册时间','date',licenseRegDate,readonly,false,{placeholder:'请选择营业执照注册时间'})+
        '</div>'+
    '</div>';
    /* 开票信息：申请开票时从这里带出（发票管理 fin-invoice 的开票抬头/纳税人识别号同源）。
     * 抬头默认带客户全称 —— 客户全称就是营业执照上的名称，专票抬头必须与之一致。
     * 开票税点按发票类型带常见档（专票/普票 6%，小规模 3%，形式/商业发票 0%）。
     * 银行账户放这里而不放资质 —— 专票票面要打开户行及账号，它是开票资料的一部分。 */
    const invType=getTableValueByHeader(c,rowData,'发票类型','增值税专用发票');
    const invTitle=getTableValueByHeader(c,rowData,'开票抬头',mode==='add'?'':fullName);
    const invTaxNo=getTableValueByHeader(c,rowData,'纳税人识别号','');
    const invAddr=getTableValueByHeader(c,rowData,'开票地址','');
    const invPhone=getTableValueByHeader(c,rowData,'开票电话','');
    const invRate=getTableValueByHeader(c,rowData,'开票税点',(invType==='增值税专用发票'||invType==='增值税普通发票')?'6%':'0%');
    const invBank=getTableValueByHeader(c,rowData,'开户银行','');
    const invAcct=getTableValueByHeader(c,rowData,'银行账号','');
    html+='<div><div class="flex items-center gap-2 mb-3"><span class="text-sm font-semibold text-text-primary">'+tr('开票信息')+'</span>'+
        '<span class="text-xs text-text-muted">'+esc(tr('申请开票时自动带出；专票的抬头与税号需与营业执照一致'))+'</span></div>'+
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">'+
            crmLeadingStarFieldHtml('发票类型','select',invType,readonly,false,{options:['增值税专用发票','增值税普通发票','形式发票(PI)','商业发票(CI)'],placeholder:'请选择'})+
            crmLeadingStarFieldHtml('开票抬头','text',invTitle,readonly,false)+
            crmLeadingStarFieldHtml('纳税人识别号','text',invTaxNo,readonly,false)+
            crmLeadingStarFieldHtml('开票地址','text',invAddr,readonly,false)+
            crmLeadingStarFieldHtml('开票电话','text',invPhone,readonly,false)+
            crmLeadingStarFieldHtml('开票税点','select',invRate,readonly,false,{options:['13%','9%','6%','3%','0%'],placeholder:'请选择'})+
            crmLeadingStarFieldHtml('开户银行','text',invBank,readonly,false)+
            crmLeadingStarFieldHtml('银行账号','text',invAcct,readonly,false)+
        '</div>'+
    '</div>';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('附件信息')+'</div>'+
        '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">'+
            crmAttachmentSlot('license','营业执照','大小不能超过5M，支持 jpg、png 格式','image/jpeg,image/png',readonly)+
            crmAttachmentSlot('idcard','身份证正反面','大小不能超过5M，支持 jpg、png、bmp 格式','image/jpeg,image/png,image/bmp',readonly)+
            crmAttachmentSlot('contract','签约合同','大小不能超过5M，支持 jpg、png、xlsx、xls、pdf 格式','image/jpeg,image/png,.xlsx,.xls,.pdf',readonly)+
            crmAttachmentSlot('other','其他附件','大小不能超过5M，支持 jpg、png、bmp、xlsx、xls、pdf 格式','image/jpeg,image/png,image/bmp,.xlsx,.xls,.pdf',readonly)+
        '</div>'+
    '</div>';
    bodyEl.innerHTML=html;
    if(readonly){
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button>';
    }else{
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+(mode==='add'?tr('新增成功'):tr('保存成功'))+'\')" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">'+tr('确认提交')+'</button>';
    }
    document.getElementById('crud-modal').classList.add('show');
    setTimeout(function(){applyRuntimeEnhancements(bodyEl);},0);
}

function openLclQuoteModal(mode,id,rowIdx,rowData){
    const c=TC[id];
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:mode==='copy'?tr('复制新增'):L.edit;
    titleEl.textContent=modeLabel+tr(c.t);
    const isView=mode==='view';
    _lclCargoTab='普货';   /* 每次打开默认停在普货插页 */
    _lclQuoteCurrencies=LCL_QUOTE_CURRENCIES.slice();   /* 币别集随弹窗打开重置：每张单自己的 */
    const data=_listData[id]||expandData(id);
    const lastCode=data.length&&data[data.length-1][0]?data[data.length-1][0]:'QP000';
    const lm=lastCode.match(/^(.*?)(\d+)$/);
    const autoCode=lm?lm[1]+String(parseInt(lm[2])+1).padStart(lm[2].length,'0'):'QP001';
    const quoteCode=mode==='add'?autoCode:mode==='copy'?'':(rowData?rowData[0]:'');
    const quoteName=rowData?rowData[1]:'西非散货标准报价';
    const products=rowData?rowData[2]:'西非海运专线,西非空运专线';
    const startDate=rowData?rowData[3]:'2026-01-01';
    const endDate=rowData?rowData[4]:'2026-12-31';
    const branches=rowData?rowData[5]:'深圳盐田仓,广州南沙仓';
    const customer=rowData?rowData[6]:'全部客户';
    const ports=rowData?rowData[7]:'达喀尔海外仓,拉各斯海外仓';
    const status=rowData?rowData[8]:'已启用';
    const warehouseOptions=getWarehouseNameOptions();
    const destWarehouseOptions=['达喀尔海外仓','拉各斯海外仓','阿比让海外仓','杜阿拉海外仓','洛美海外仓'];
    const roCls=isView?' readonly class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed"':'';
    const roSelectCls=isView?' disabled':'';
    let html='<div class="space-y-5">';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('报价基本信息')+'</div>';
    html+='<div class="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('报价编号')+'</label>'+(mode==='copy'?'<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(quoteCode)+'" placeholder="'+tr('自动生成')+'">':'<input type="text" readonly class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(quoteCode)+'">')+'</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('报价名称')+'</label><input id="lq-name" type="text" '+(isView?roCls:'class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"')+' value="'+esc(quoteName)+'"></div>';
    if(isView){
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('销售产品')+'</label><input type="text"'+roCls+' value="'+esc(products)+'"></div>';
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('发货仓库')+'</label><input type="text"'+roCls+' value="'+esc(branches)+'"></div>';
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('目的仓库')+'</label><input type="text"'+roCls+' value="'+esc(ports)+'"></div>';
    }else{
        /* 销售产品：多选 */
        html+='<div id="lq-product-wrap">'+checkedDropdownFieldHtml('销售产品',['西非海运专线','西非空运专线','中东海运专线','欧洲铁路专线'],products)+'</div>';
        html+=checkedDropdownFieldHtml('发货仓库',warehouseOptions,branches);
        html+=checkedDropdownFieldHtml('目的仓库',destWarehouseOptions,ports);
    }
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('报价开始时间')+'</label><input id="lq-start" type="date" '+(isView?roCls:'class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"')+' value="'+esc(startDate)+'"></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('报价结束时间')+'</label><input id="lq-end" type="date" '+(isView?roCls:'class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"')+' value="'+esc(endDate)+'"></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('使用客户')+'</label><select id="lq-customer" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+roSelectCls+'>'+selectOptionsHtml(['全部客户','指定客户','鑫达贸易','远洋物流','速达货运'],customer)+'</select></div>';
    /* 状态数据源：已启用 / 已禁用（列表可用「启用」「禁用」按钮批量切换）；查看态只读 */
    if(isView){
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('状态')+'</label><input type="text" readonly class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(status)+'"></div>';
    }else{
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('状态')+'</label><select id="lq-status" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['已启用','已禁用'],status)+'</select></div>';
    }
    /* 「默认币别」：报价展示与导出用的主币别；下方价格维护按 人民币/美金/西法 三币别同时维护 */
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('默认币别')+'</label><select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+roSelectCls+'>'+selectOptionsHtml(LCL_QUOTE_CURRENCIES,'人民币')+'</select></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('计重类型')+'</label><select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+roSelectCls+'>'+selectOptionsHtml(['重量','体积'],'重量')+'</select></div>';
    html+='<div class="md:col-span-4 flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('备注')+'</label><textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y"'+(isView?' readonly':'')+'>'+tr('按客户、产品、发货仓库和目的仓库维护散货报价。')+'</textarea></div>';
    html+='</div></div>';
    /* 横向/纵向切换已去掉：只保留币别矩阵一种视图，少一个概念少一次误触。
     * 「新增币种」给矩阵动态加一列（选币种 → 确认 → 列表列增加），查看态不给 */
    html+='<div class="border border-surface-200 rounded-xl overflow-hidden"><div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between gap-3"><div class="text-sm font-semibold text-text-primary">'+tr('价格维护')+'</div>'+(isView?'':'<div class="flex items-center gap-2"><button type="button" onclick="addLclWeightPriceRow()" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">+ '+tr('新增')+'</button><button type="button" onclick="openLclCurrencyPicker()" class="h-8 px-3 text-xs font-medium text-text-secondary bg-white border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">+ '+tr('新增币种')+'</button></div>')+'</div>';
    html+='<div id="lcl-cargo-tabs" class="flex gap-2 border-b border-surface-200 px-4">'+lclCargoTabsHtml()+'</div>';
    html+='<div id="lcl-weight-price-wrap">'+renderLclWeightPriceTable()+'</div></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    if(isView){
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    }else{
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="submitLclQuote(\''+mode+'\',\''+id+'\',\''+esc(quoteCode)+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('保存报价')+'</button>';
    }
    document.getElementById('crud-modal').classList.add('show');
}

/* 读取「销售产品」多选结果（逗号分隔） */
function lclPickedProducts(){
    var el=document.querySelector('#lq-product-wrap [data-checked-dropdown-input]');
    if(!el)return '';
    return String(el.value||'').split(',').map(function(s){return s.trim();}).filter(Boolean).join(',');
}
/* 保存报价：新增（含复制新增）按所选状态写入 */
function submitLclQuote(mode,id,quoteCode){
    var c=TC[id];if(!c){closeCrudModal();return;}
    var v=function(elId,dft){var el=document.getElementById(elId);return el&&el.value?el.value:(dft||'');};
    if(mode==='add'||mode==='copy'){
        var code=quoteCode||('QP'+String(((_listData[id]||c.d||[]).length+1)).padStart(3,'0'));
        var name=v('lq-name','散货报价');
        if(!name){showToast(tr('请填写报价名称'));return;}
        var row=[];
        c.h.slice(0,-1).forEach(function(hd){
            if(hd==='报价编号')row.push(code);
            else if(hd==='报价名称')row.push(name);
            else if(hd==='销售产品')row.push(lclPickedProducts()||'西非海运专线');
            else if(hd==='报价开始时间')row.push(v('lq-start','2026-01-01'));
            else if(hd==='报价结束时间')row.push(v('lq-end','2026-12-31'));
            else if(hd==='发货仓库')row.push('深圳盐田仓');
            else if(hd==='使用客户')row.push(v('lq-customer','全部客户'));
            else if(hd==='目的仓库')row.push('达喀尔海外仓');
            else if(hd==='状态')row.push(v('lq-status','已启用'));
            else row.push('');
        });
        if(!_listData[id])_listData[id]=(c.d||[]).map(function(r){return r.slice();});
        _listData[id].unshift(row);
        closeCrudModal();
        var mc=document.getElementById('main-content');
        if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,1,(typeof _statusFilterVal!=='undefined'?_statusFilterVal:'')||'');
        showToast(tr('保存成功')+'：'+code);
        return;
    }
    closeCrudModal();
    showToast(tr('保存成功'));
}

function lclExcelInput(value,extraClass){
    return '<input data-excel-cell onpaste="handleLclExcelPaste(event,this)" class="w-full h-9 px-2 text-xs border-0 outline-none bg-transparent focus:bg-primary-50 '+(extraClass||'')+'" value="'+esc(value||'')+'">';
}

function defaultLclWeightPriceRow(base){
    base=base||{};
    return {weightSeg:base.weightSeg||'',currency:base.currency||'人民币',price:base.price||'',cargoType:base.cargoType||'普货'};
}

/* 当前插页（货物类型）下的价格行 */
function lclTabRows(){
    return (_lclWeightPriceRows||[]).filter(function(r){return (r.cargoType||'普货')===_lclCargoTab;});
}
/* 当前插页下有多少个计重范围（插页徽标用，一行扁平数据 = 一个范围 × 一个币别） */
function lclTabSegmentCount(){
    const seen=[];
    lclTabRows().forEach(function(r){const s=r.weightSeg||'';if(!seen.includes(s))seen.push(s);});
    return seen.length;
}
/* 横向矩阵模型：行 = 计重范围（纵向），列 = 币别（横向），格 = 单价。
 * 扁平行按 weightSeg 透视还原成矩阵；矩阵里没维护到的 币别×范围 补空格。 */
function getLclHorizontalModel(){
    const tabRows=lclTabRows();
    const segments=[];
    const cells={};
    tabRows.forEach(function(row){
        const seg=row.weightSeg||'';
        if(!segments.includes(seg))segments.push(seg);
        if(!cells[seg])cells[seg]={};
        cells[seg][row.currency||'人民币']=row.price||'';
    });
    if(!segments.length){segments.push('');cells['']={};}
    /* 列 = 当前单的币别集（基准三种 + 本单通过「新增币种」加进来的） */
    return {segments:segments,cells:cells,currencies:(_lclQuoteCurrencies||LCL_QUOTE_CURRENCIES)};
}

/* 用当前插页采集到的行替换该货物类型的行，其它插页数据原样保留 */
function mergeLclTabRows(tabRows){
    const others=(_lclWeightPriceRows||[]).filter(function(r){return (r.cargoType||'普货')!==_lclCargoTab;});
    _lclWeightPriceRows=others.concat(tabRows);
}
function captureLclWeightPriceRows(){
    const horizontal=document.getElementById('lcl-weight-price-horizontal');
    if(horizontal){
        const nextRows=[];
        Array.from(horizontal.querySelectorAll('tbody tr[data-horizontal-seg-row]')).forEach(function(row){
            const seg=(row.querySelector('[data-horizontal-weight-seg]')||{}).value||'';
            Array.from(row.querySelectorAll('[data-horizontal-price]')).forEach(function(input){
                nextRows.push({weightSeg:seg,price:input.value||'',cargoType:_lclCargoTab,currency:input.dataset.currency||'人民币'});
            });
        });
        mergeLclTabRows(nextRows);
    }
    if(_lclWeightPriceRows.length===0)_lclWeightPriceRows=[defaultLclWeightPriceRow({cargoType:_lclCargoTab})];
}

/* 币别矩阵（唯一视图）：横向币别、纵向计重范围，一格一个单价 */
function renderLclWeightPriceTable(){
    let html='';
    const matrix=getLclHorizontalModel();
    html+='<div class="overflow-auto max-h-[360px]" id="lcl-weight-price-horizontal"><table class="w-full min-w-[640px] text-xs border-collapse">';
    html+='<thead class="sticky top-0 z-10"><tr class="bg-[#EFF6FF] text-text-secondary">';
    html+='<th class="text-left px-3 py-2 border border-surface-200 min-w-[140px] bg-[#EFF6FF]">'+tr('计重范围')+'</th>';
    matrix.currencies.forEach(function(cur){
        html+='<th class="text-right px-3 py-2 border border-surface-200 min-w-[130px] bg-[#EFF6FF]">'+tr(cur)+tr('单价')+'</th>';
    });
    html+='<th class="sticky right-0 z-20 text-center px-3 py-2 border border-surface-200 min-w-[96px] bg-[#EFF6FF] shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]">'+tr('操作')+'</th></tr></thead><tbody>';
    matrix.segments.forEach(function(seg){
        html+='<tr data-horizontal-seg-row class="hover:bg-primary-50/30">';
        html+='<td class="border border-surface-200 bg-white"><input data-excel-cell data-horizontal-weight-seg onpaste="handleLclExcelPaste(event,this)" class="w-full h-9 px-2 text-xs border border-surface-200 rounded bg-white outline-none focus:bg-primary-50" value="'+esc(seg||'')+'" placeholder="'+esc(tr('如 0-1'))+'"></td>';
        matrix.currencies.forEach(function(cur){
            html+='<td class="border border-surface-200 bg-white">'+lclExcelInput((matrix.cells[seg]||{})[cur]||'','text-right').replace('data-excel-cell','data-excel-cell data-horizontal-price data-currency="'+esc(cur)+'"')+'</td>';
        });
        /* onclick 属性本身用双引号包裹，参数只能用单引号 —— JSON.stringify 的双引号会把属性截断 */
        html+='<td class="sticky right-0 z-10 border border-surface-200 text-center bg-white shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]"><button type="button" onclick="removeLclHorizontalRow(\''+esc(String(seg)).replace(/'/g,'&#39;')+'\')" class="h-8 px-3 text-xs text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button></td>';
        html+='</tr>';
    });
    html+='</tbody></table></div>';
    html+='<div class="px-4 py-2 text-[11px] text-text-muted bg-surface-50 border-t border-surface-200">'+tr('支持从 Excel 复制多行多列数据后直接粘贴到表格单元格。')+'</div>';
    return html;
}

function renderLclWeightPriceWrap(){
    const wrap=document.getElementById('lcl-weight-price-wrap');
    if(wrap){
        wrap.innerHTML=renderLclWeightPriceTable();
        applyRuntimeEnhancements(wrap);
    }
}

function addLclWeightPriceRow(){
    captureLclWeightPriceRows();
    /* 新增一行 = 新的计重范围，当前币别集（含新加的币种）一起补上空价格 */
    (_lclQuoteCurrencies||LCL_QUOTE_CURRENCIES).forEach(function(cur){
        _lclWeightPriceRows.push(defaultLclWeightPriceRow({weightSeg:'',currency:cur,cargoType:_lclCargoTab}));
    });
    renderLclWeightPriceWrap();
}

/* ===== 新增币种：选币种 → 确认 → 矩阵加一列 =====
 * 用独立浮层而不是 #crud-modal：报价弹窗本身占着 crud-modal，
 * 套用会把它冲掉（与配舱的一键配舱、PDA 的清点件数同一套做法）。 */
var _lclCurrencyPick='';
function lclCurrencyPickerHtml(options){
    var h='<div class="px-4 py-3 border-b border-surface-200 text-sm font-semibold text-text-primary">'+tr('新增币种')+'</div>';
    h+='<div class="p-4 space-y-3">';
    h+='<div class="text-xs text-text-secondary">'+tr('选择要加入价格维护的币种，确认后列表增加该币别列。')+'</div>';
    h+='<div id="lcl-currency-chips" class="flex flex-wrap gap-2">';
    options.forEach(function(c){
        h+='<button type="button" data-currency-chip="'+esc(c)+'" onclick="pickLclCurrencyChip(this,\''+esc(c)+'\')" class="h-9 px-3.5 rounded-lg border border-surface-200 bg-white text-sm text-text-secondary hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors">'+esc(c)+'</button>';
    });
    h+='</div></div>';
    h+='<div class="grid grid-cols-2 gap-2 px-4 pb-4">'+
        '<button type="button" onclick="closeLclCurrencyPicker()" class="h-10 rounded-lg border border-surface-200 text-sm text-text-secondary cursor-pointer">'+tr('取消')+'</button>'+
        '<button type="button" onclick="confirmLclCurrencyPicker()" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium cursor-pointer">'+tr('确认')+'</button></div>';
    return h;
}
function openLclCurrencyPicker(){
    var current=(_lclQuoteCurrencies||LCL_QUOTE_CURRENCIES);
    var options=LCL_CURRENCY_CANDIDATES.filter(function(c){return current.indexOf(c)<0;});
    if(!options.length){showToast(tr('已包含全部可选币种'));return;}
    _lclCurrencyPick='';
    var old=document.getElementById('lcl-currency-modal');
    if(old)old.remove();
    var m=document.createElement('div');
    m.id='lcl-currency-modal';
    m.className='fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-6';
    m.innerHTML='<div class="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">'+lclCurrencyPickerHtml(options)+'</div>';
    document.body.appendChild(m);
}
function closeLclCurrencyPicker(){
    var m=document.getElementById('lcl-currency-modal');
    if(m)m.remove();
}
function pickLclCurrencyChip(btn,name){
    _lclCurrencyPick=name;
    var box=document.getElementById('lcl-currency-chips');
    if(box)Array.from(box.querySelectorAll('[data-currency-chip]')).forEach(function(b){
        b.className='h-9 px-3.5 rounded-lg border border-surface-200 bg-white text-sm text-text-secondary hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors';
    });
    btn.className='h-9 px-3.5 rounded-lg border border-primary-600 bg-primary-600 text-white text-sm font-medium cursor-pointer transition-colors';
}
function confirmLclCurrencyPicker(){
    if(!_lclCurrencyPick){showToast(tr('请选择币种'));return;}
    var add=_lclCurrencyPick;
    if((_lclQuoteCurrencies||LCL_QUOTE_CURRENCIES).indexOf(add)>=0){closeLclCurrencyPicker();return;}
    /* 先把已填的单价收回数据模型，再加列重画 —— 不收的话重画会丢掉未保存的编辑 */
    captureLclWeightPriceRows();
    (_lclQuoteCurrencies=_lclQuoteCurrencies||LCL_QUOTE_CURRENCIES.slice()).push(add);
    closeLclCurrencyPicker();
    renderLclWeightPriceWrap();
    showToast(tr('已新增币种')+'「'+add+'」，'+tr('列表已增加该币别列'));
}

/* 切换货物类型插页（切换前先保存当前插页的编辑内容） */
function switchLclCargoTab(tab){
    captureLclWeightPriceRows();
    _lclCargoTab=tab||'普货';
    const bar=document.getElementById('lcl-cargo-tabs');
    if(bar)bar.innerHTML=lclCargoTabsHtml();
    renderLclWeightPriceWrap();
}
function lclCargoTabsHtml(){
    /* 徽标按计重范围数显示（一条范围维护三种币别，按扁平行数显示会是三倍，误导） */
    return ['普货','敏感货'].map(function(t){
        var on=_lclCargoTab===t;
        var saved=_lclCargoTab;
        _lclCargoTab=t;
        var n=lclTabSegmentCount();
        _lclCargoTab=saved;
        return '<button type="button" onclick="switchLclCargoTab(\''+t+'\')" class="'+(on?'px-3 py-2 text-sm font-semibold text-primary-600 border-b-2 border-primary-600':'px-3 py-2 text-sm font-medium text-text-secondary border-b-2 border-transparent hover:text-primary-600')+' cursor-pointer">'+tr(t)+'（'+n+'）</button>';
    }).join('');
}

/* 删除整个计重范围（该范围下三种币别一起删） */
function removeLclHorizontalRow(seg){
    captureLclWeightPriceRows();
    _lclWeightPriceRows=_lclWeightPriceRows.filter(function(row){
        return !((row.cargoType||'普货')===_lclCargoTab&&(row.weightSeg||'')===seg);
    });
    if(_lclWeightPriceRows.length===0)_lclWeightPriceRows.push(defaultLclWeightPriceRow());
    renderLclWeightPriceWrap();
}

function handleLclExcelPaste(e,input){
    const text=(e.clipboardData||window.clipboardData).getData('text');
    if(!text||(!text.includes('\t')&&!text.includes('\n')))return;
    e.preventDefault();
    const table=input.closest('table');
    if(!table)return;
    /* 矩形粘贴：以当前格为左上角，按 Excel 的行列铺进矩阵 */
    const rows=Array.from(table.querySelectorAll('tr'));
    const startRow=input.closest('tr');
    const rowIdx=rows.indexOf(startRow);
    const colIdx=Array.from(startRow.querySelectorAll('[data-excel-cell]')).indexOf(input);
    const matrix=text.trim().split(/\r?\n/).map(function(row){return row.split('\t');});
    matrix.forEach(function(r,ri){
        const targetRow=rows[rowIdx+ri];
        if(!targetRow)return;
        const rowCells=Array.from(targetRow.querySelectorAll('[data-excel-cell]'));
        r.forEach(function(v,ci){if(rowCells[colIdx+ci])rowCells[colIdx+ci].value=v;});
    });
}

function appendFormulaToken(targetId,token){
    const input=document.getElementById(targetId);
    if(!input)return;
    const start=input.selectionStart||input.value.length;
    const end=input.selectionEnd||input.value.length;
    input.value=input.value.slice(0,start)+token+input.value.slice(end);
    input.focus();
    input.setSelectionRange(start+token.length,start+token.length);
    input.dispatchEvent(new Event('input',{bubbles:true}));
}

function formulaOperatorTokens(){
    return [
        {label:'1',token:'1'},{label:'2',token:'2'},{label:'3',token:'3'},{label:'4',token:'4'},{label:'5',token:'5'},{label:'6',token:'6'},{label:'7',token:'7'},{label:'8',token:'8'},{label:'9',token:'9'},{label:'0',token:'0'},{label:'.',token:'.'},
        {label:'+',token:'+'},{label:'-',token:'-'},{label:'*',token:'*'},{label:'/',token:'/'},
        {label:'大于',token:'>'},{label:'等于',token:'='},{label:'小于',token:'<'},{label:'不等于',token:'!='},{label:'大于等于',token:'>='},{label:'小于等于',token:'<='},
        {label:'MAX',token:'MAX('},{label:'min',token:'min('},{label:'AND',token:' AND '},{label:'OR',token:' OR '},{label:'(',token:'('},{label:')',token:')'}
    ];
}

function formulaButtonGroup(targetId,fields){
    const left=fields||['总件数','总重量','总体积','计费重量','国家','是否扣件'];
    const right=formulaOperatorTokens();
    const fieldBtn='h-9 w-full px-3 text-xs font-medium text-primary-700 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer truncate';
    const opBtn='h-9 w-full px-2 text-xs font-medium text-text-secondary bg-white border border-surface-200 rounded-lg hover:bg-surface-100 cursor-pointer truncate';
    let html='<div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3">';
    html+='<div class="rounded-lg border border-surface-200 bg-surface-50 p-3"><div class="text-xs font-semibold text-text-secondary mb-2">'+tr('字段')+'</div><div class="grid grid-cols-2 gap-2">';
    left.forEach(function(t){html+='<button type="button" title="'+esc(tr(t))+'" onclick="appendFormulaToken(\''+targetId+'\',\''+t+'\')" class="'+fieldBtn+'">'+tr(t)+'</button>';});
    html+='</div></div>';
    html+='<div class="rounded-lg border border-surface-200 bg-surface-50 p-3"><div class="text-xs font-semibold text-text-secondary mb-2">'+tr('数字与符号')+'</div><div class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">';
    right.forEach(function(item){html+='<button type="button" title="'+esc(tr(item.label))+'" onclick="appendFormulaToken(\''+targetId+'\',\''+item.token+'\')" class="'+opBtn+'">'+esc(tr(item.label))+'</button>';});
    html+='</div></div></div>';
    return html;
}

/* ================= 附加杂费配置 · 新增/编辑（左侧表单 + 右侧表达式构建器 + 明细表） ================= */
/* 表达式条件字段（中文 -> 表达式变量） */
var SC_EXPR_FIELDS=[
    {cn:'总件数',code:'totalPiece'},{cn:'收货实际重',code:'receiveActualWeight'},{cn:'收货实际体积',code:'receiveActualVolume'},
    {cn:'收货体积重',code:'receiveVolumeWeight'},{cn:'计费重',code:'chargeWeight'},{cn:'计费体积',code:'chargeVolume'},
    {cn:'报关',code:'customsFlag'},{cn:'仿牌',code:'fakeBrandFlag'},{cn:'货物类型',code:'cargoType'}
];
/* 计算公式条件字段 */
var SC_FORMULA_FIELDS=[
    {cn:'收货体积重',code:'receiveVolumeWeight'},{cn:'收货实际重',code:'receiveActualWeight'},{cn:'计费重',code:'chargeWeight'},
    {cn:'收货实际体积',code:'receiveActualVolume'},{cn:'计费体积',code:'chargeVolume'},{cn:'总件数',code:'totalPiece'}
];
var SC_OPS=['1','2','3','4','5','6','7','8','9','0','.','&&','||','?','+','-','*','/','(',')','==','!=','>','<','>=','<=','max','min',','];
var _scRows=[];      /* [{expr:[token],formula:[token]}]  token={k:'f',cn,code} | {k:'o',v} */
var _scActive=0;     /* 当前作用行（# 列勾选） */
var _scView=false;

function scNewRow(){return {expr:[],formula:[]};}
function scTokenCode(t){return t.k==='f'?('#{'+t.code+'}'):t.v;}
function scCode(list){return (list||[]).map(scTokenCode).join('');}
function scChips(list){
    var h='';
    (list||[]).forEach(function(t){
        h+=t.k==='f'
            ?'<span class="inline-block px-1.5 py-0.5 mr-1 rounded bg-primary-50 border border-primary-200 text-primary-700">'+esc(t.cn)+'</span>'
            :'<span class="inline-block px-1.5 py-0.5 mr-1 rounded bg-surface-100 border border-surface-200 text-text-secondary">'+esc(t.v)+'</span>';
    });
    return h;
}
function scSetActive(i){_scActive=i;scRenderTable();}
function scAddRow(){_scRows.push(scNewRow());_scActive=_scRows.length-1;scRenderTable();}
function scDelRow(i){
    if(_scRows.length<=1){showToast(tr('至少保留一行'));return;}
    _scRows.splice(i,1);
    if(_scActive>=_scRows.length)_scActive=_scRows.length-1;
    scRenderTable();
}
function scAddField(target,idx){
    var f=(target==='expr'?SC_EXPR_FIELDS:SC_FORMULA_FIELDS)[idx];
    var row=_scRows[_scActive];
    if(!f||!row)return;
    row[target].push({k:'f',cn:f.cn,code:f.code});
    scRenderTable();
}
function scAddOp(target,op){
    var row=_scRows[_scActive];
    if(!row)return;
    row[target].push({k:'o',v:op});
    scRenderTable();
}
function scBack(i,target){
    var row=_scRows[i];
    if(!row||!row[target].length)return;
    row[target].pop();
    scRenderTable();
}
/* 清空单元格内容 */
function scClear(i,target){
    var row=_scRows[i];
    if(!row)return;
    if(!row[target].length){showToast(tr('该单元格已为空'));return;}
    row[target]=[];
    scRenderTable();
}
/* 清空整行（表达式 + 计算公式） */
function scClearRow(i){
    var row=_scRows[i];
    if(!row)return;
    if(!row.expr.length&&!row.formula.length){showToast(tr('该行已为空'));return;}
    openConfirmTip(tr('确定清空本行的表达式与计算公式吗？'),function(){
        row.expr=[];row.formula=[];
        scRenderTable();
    });
}
/* 单元格前置操作按钮：? 回退一个 / × 清空 */
function scCellOps(i,target){
    return '<button type="button" onclick="scBack('+i+',\''+target+'\')" class="mr-1 w-5 h-5 rounded-full bg-surface-100 border border-surface-200 text-text-muted hover:bg-surface-200 cursor-pointer" title="'+esc(tr('回退一个'))+'">?</button>'+
        '<button type="button" onclick="scClear('+i+',\''+target+'\')" class="mr-1 w-5 h-5 rounded-full bg-surface-100 border border-surface-200 text-text-muted hover:bg-red-50 hover:text-red-500 cursor-pointer" title="'+esc(tr('清空单元格'))+'">×</button>';
}
function scBtnGrid(items,onclick){
    var h='<div class="grid grid-cols-3 gap-1.5">';
    items.forEach(function(it,i){
        h+='<button type="button" onclick="'+onclick(i,it)+'" class="h-7 px-1 rounded text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 cursor-pointer truncate">'+esc(it)+'</button>';
    });
    return h+'</div>';
}
function scRenderTable(){
    var tb=document.getElementById('sc-expr-tbody');
    if(!tb)return;
    var h='';
    _scRows.forEach(function(r,i){
        var on=_scActive===i;
        h+='<tr class="border-t border-surface-100 '+(on?'bg-primary-50/40':'hover:bg-surface-50')+'">';
        h+='<td class="px-3 py-2 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-3 py-2"><input type="checkbox" '+(on?'checked':'')+' onclick="scSetActive('+i+')" class="accent-primary-600" title="'+esc(tr('勾选后按钮作用于本行'))+'"></td>';
        h+='<td class="px-3 py-2">'+scCellOps(i,'expr')+scChips(r.expr)+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary break-all">'+esc(scCode(r.expr))+'</td>';
        h+='<td class="px-3 py-2">'+scCellOps(i,'formula')+scChips(r.formula)+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary break-all">'+esc(scCode(r.formula))+'</td>';
        h+='<td class="px-3 py-2 whitespace-nowrap"><a onclick="scAddRow()" class="text-primary-600 hover:text-primary-700 cursor-pointer mr-3">'+tr('新增')+'</a><a onclick="scClearRow('+i+')" class="text-primary-600 hover:text-primary-700 cursor-pointer mr-3">'+tr('清空')+'</a><a onclick="scDelRow('+i+')" class="text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</a></td>';
        h+='</tr>';
    });
    tb.innerHTML=h;
}
function scField(label,inner,required){
    return '<div class="mb-4"><label class="block text-sm text-text-secondary mb-1.5">'+(required?'<span class="text-red-500 mr-0.5">*</span>':'')+tr(label)+'</label>'+inner+'</div>';
}
function openSurchargeModal(mode,id,rowIdx,rowData){
    const c=TC[id];
    const L=_lang[_currentLang];
    const isView=mode==='view';
    _scView=isView;
    _scRows=[scNewRow()];_scActive=0;
    /* 预置示例：总件数 * 1 */
    _scRows[0].expr=[{k:'f',cn:'总件数',code:'totalPiece'},{k:'o',v:'*'},{k:'o',v:'1'}];
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:mode==='copy'?tr('复制新增'):L.edit;
    document.getElementById('crud-modal-title').textContent=modeLabel;
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='78%';
    const inCls='w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white';
    const dis=isView?' disabled':'';
    const ro=isView?' readonly':'';
    const sel=function(opts,val){return '<select class="'+inCls+'"'+dis+'>'+(val?'':'<option value="">'+tr('请选择')+'</option>')+opts.map(function(o){return '<option'+(val===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>';};
    let html='<div class="flex gap-6 items-start">';
    /* 左侧表单 */
    html+='<div class="w-[300px] flex-shrink-0 border-r border-surface-200 pr-6">';
    html+=scField('附加费名称','<input type="text" class="'+inCls+'" placeholder="'+esc(tr('请输入附加费名称'))+'" value="'+esc(rowData?(rowData[1]||''):'')+'"'+ro+'>',true);
    html+=scField('费用类型',sel(['报关','仓储','文件','商检','派送','其他'],''),true);
    html+=scField('币别',sel(['人民币','美元','欧元','港币'],''),true);
    html+=scField('附加费开始时间','<input type="date" class="'+inCls+'" placeholder="'+esc(tr('请选择附加费开始时间'))+'"'+ro+'>',true);
    html+=scField('附加费结束时间','<input type="date" class="'+inCls+'" placeholder="'+esc(tr('请选择附加费结束时间'))+'"'+ro+'>',true);
    html+=scField('备注','<input type="text" class="'+inCls+'" placeholder="'+esc(tr('请输入备注'))+'"'+ro+'>',false);
    html+='</div>';
    /* 右侧表达式构建区 */
    html+='<div class="flex-1 min-w-0 space-y-4">';
    html+='<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">';
    html+='<div><div class="text-sm text-text-secondary mb-2">'+tr('表达式条件')+'</div>'+scBtnGrid(SC_EXPR_FIELDS.map(function(f){return f.cn;}),function(i){return 'scAddField(\'expr\','+i+')';})+'</div>';
    html+='<div><div class="text-sm text-text-secondary mb-2">'+tr('计算公式条件')+'</div>'+scBtnGrid(SC_FORMULA_FIELDS.map(function(f){return f.cn;}),function(i){return 'scAddField(\'formula\','+i+')';})+'</div>';
    html+='</div>';
    html+='<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">';
    html+='<div><div class="text-sm text-text-secondary mb-2">'+tr('表达式条件运算符')+'</div>'+scBtnGrid(SC_OPS,function(i,op){return 'scAddOp(\'expr\',\''+(op==="'"?"\\'":op)+'\')';})+'</div>';
    html+='<div><div class="text-sm text-text-secondary mb-2">'+tr('计算公式条件运算符')+'</div>'+scBtnGrid(SC_OPS,function(i,op){return 'scAddOp(\'formula\',\''+(op==="'"?"\\'":op)+'\')';})+'</div>';
    html+='</div>';
    /* 明细表 */
    html+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-xs" style="min-width:900px"><thead><tr class="bg-surface-50 text-text-secondary">';
    ['序号','#','表达式中文','表达式','计算公式中文','计算公式','操作'].forEach(function(x){html+='<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(x)+'</th>';});
    html+='</tr></thead><tbody id="sc-expr-tbody"></tbody></table></div>';
    html+='<div class="text-[11px] text-text-muted">'+tr('说明：勾选「#」选中作用行，再点上方按钮即可拼接表达式/计算公式；「?」回退一个，「×」清空该单元格，操作列「清空」可清空整行。')+'</div>';
    html+='</div></div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    scRenderTable();
    const footerEl=document.getElementById('crud-modal-footer');
    if(isView){
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    }else{
        footerEl.innerHTML='<button onclick="closeCrudModal();showToast(\''+tr('保存成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认')+'</button><button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('关闭')+'</button>';
    }
    document.getElementById('crud-modal').classList.add('show');
}

function closeExpressionModal(){
    document.getElementById('expression-modal').classList.remove('show');
    _activeSurchargeDetailRow=null;
}

function buildRoleMenuTree(){
    let html='';
    menuData.forEach(function(l1){
        const l1Label=langText(l1.langKey,l1.label);
        const l1Id=l1.id;
        html+='<div class="mb-1">';
        html+='<div class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-surface-50" onclick="toggleRoleTreeNode(this)">';
        html+='<input type="checkbox" class="role-tree-cb" data-id="'+l1Id+'" onchange="onRoleTreeCheck(this)" onclick="event.stopPropagation()">';
        html+='<svg class="w-3.5 h-3.5 text-text-muted transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
        html+='<span class="text-sm font-medium text-text-primary">'+esc(l1Label)+'</span>';
        html+='</div>';
        html+='<div class="role-tree-children pl-5" style="display:none">';
        if(l1.children){
            l1.children.forEach(function(l2){
                const l2Label=langText(l2.langKey,l2.label);
                const l2Id=l2.id;
                if(l2.children&&l2.children.length>0){
                    html+='<div class="mb-0.5">';
                    html+='<div class="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-surface-50" onclick="toggleRoleTreeNode(this)">';
                    html+='<input type="checkbox" class="role-tree-cb" data-id="'+l2Id+'" data-pid="'+l1Id+'" onchange="onRoleTreeCheck(this)" onclick="event.stopPropagation()">';
                    html+='<svg class="w-3 h-3 text-text-muted transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
                    html+='<span class="text-sm text-text-secondary">'+esc(l2Label)+'</span>';
                    html+='</div>';
                    html+='<div class="role-tree-children pl-5" style="display:none">';
                    l2.children.forEach(function(l3){
                        const l3Label=langText(l3.langKey,l3.label);
                        html+='<div class="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-surface-50" onclick="onRoleModuleClick(\''+l3.id+'\')">';
                        html+='<input type="checkbox" class="role-tree-cb" data-id="'+l3.id+'" data-pid="'+l2Id+'" onchange="onRoleTreeCheck(this)" onclick="event.stopPropagation()">';
                        html+='<span class="text-sm text-text-secondary">'+esc(l3Label)+'</span>';
                        html+='</div>';
                    });
                    html+='</div></div>';
                }else{
                    html+='<div class="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-surface-50" onclick="onRoleModuleClick(\''+l2Id+'\')">';
                    html+='<input type="checkbox" class="role-tree-cb" data-id="'+l2Id+'" data-pid="'+l1Id+'" onchange="onRoleTreeCheck(this)" onclick="event.stopPropagation()">';
                    html+='<span class="text-sm text-text-secondary">'+esc(l2Label)+'</span>';
                    html+='</div>';
                }
            });
        }
        html+='</div></div>';
    });
    return html;
}

function toggleRoleTreeNode(el){
    const children=el.nextElementSibling;
    if(!children||!children.classList.contains('role-tree-children'))return;
    const arrow=el.querySelector('svg');
    if(children.style.display==='none'){children.style.display='block';if(arrow)arrow.style.transform='rotate(90deg)';}
    else{children.style.display='none';if(arrow)arrow.style.transform='';}
}

function onRoleTreeCheck(cb){
    const parentId=cb.dataset.pid;
    const nodeId=cb.dataset.id;
    const checked=cb.checked;
    const container=cb.closest('.role-tree-children')||cb.closest('#role-menu-tree');
    if(checked){
        if(parentId){
            const parentCb=container.parentElement.querySelector('[data-id="'+parentId+'"]');
            if(parentCb&&!parentCb.checked)parentCb.checked=true;
        }
        const childCbs=cb.parentElement.nextElementSibling?.querySelectorAll('.role-tree-cb');
        if(childCbs){
            childCbs.forEach(function(c){c.checked=true;});
        }
    }else{
        const childCbs=cb.parentElement.nextElementSibling?.querySelectorAll('.role-tree-cb');
        if(childCbs){
            childCbs.forEach(function(c){c.checked=false;});
        }
        if(parentId){
            const parentCb=container.parentElement.querySelector('[data-id="'+parentId+'"]');
            if(parentCb){
                const siblings=parentCb.parentElement.nextElementSibling?.querySelectorAll('.role-tree-cb');
                if(siblings&&[...siblings].every(s=>!s.checked)){
                    parentCb.checked=false;
                }
            }
        }
    }
}

function onRoleModuleClick(moduleId){
    const fieldList=document.getElementById('role-field-list');
    const queryList=document.getElementById('role-query-list');
    const btnList=document.getElementById('role-btn-list');
    const tc=TC[moduleId];
    if(!tc){
        fieldList.innerHTML='<div class="text-sm text-text-muted py-4 text-center">'+tr('该模块暂无字段配置')+'</div>';
        queryList.innerHTML='<div class="text-sm text-text-muted py-4 text-center">'+tr('该模块暂无查询条件配置')+'</div>';
        btnList.innerHTML='<div class="text-sm text-text-muted py-4 text-center">'+tr('该模块暂无按钮配置')+'</div>';
        return;
    }
    const headers=tc.h.slice(0,-1).filter(function(hd){return hd!=='序号'&&!hd.endsWith('序号');});
    let fHtml='<div class="space-y-1.5">';
    headers.forEach(function(hd){
        fHtml+='<label class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-50 cursor-pointer"><input type="checkbox" class="role-field-cb" checked><span class="text-sm text-text-secondary">'+esc(tr(hd))+'</span></label>';
    });
    fHtml+='</div>';
    fieldList.innerHTML=fHtml;
    if(tc.q&&tc.q.length>0){
        let qHtml='<div class="space-y-1.5">';
        tc.q.forEach(function(q){
            qHtml+='<label class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-50 cursor-pointer"><input type="checkbox" class="role-query-cb" checked><span class="text-sm text-text-secondary">'+esc(tr(q.label))+'</span></label>';
        });
        qHtml+='</div>';
        queryList.innerHTML=qHtml;
    }else{
        queryList.innerHTML='<div class="text-sm text-text-muted py-4 text-center">'+tr('该模块暂无查询条件')+'</div>';
    }
    var actions=getToolbarActions(moduleId);
    if(actions&&actions.length>0){
        let bHtml='<div class="space-y-1.5">';
        actions.forEach(function(a){
            bHtml+='<label class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-50 cursor-pointer"><input type="checkbox" class="role-btn-cb" checked><span class="text-sm text-text-secondary">'+esc(tr(a.label))+'</span></label>';
        });
        bHtml+='</div>';
        btnList.innerHTML=bHtml;
    }else{
        btnList.innerHTML='<div class="text-sm text-text-muted py-4 text-center">'+tr('该模块暂无按钮配置')+'</div>';
    }
}

