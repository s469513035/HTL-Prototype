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
    const bankAccountName=getTableValueByHeader(c,rowData,'开户名','');
    const bankName=getTableValueByHeader(c,rowData,'开户行','');
    const bankAccount=getTableValueByHeader(c,rowData,'银行账号','');
    const salesPerson=getTableValueByHeader(c,rowData,'所属业务员','');
    const settlementPerson=getTableValueByHeader(c,rowData,'所属操作','');
    const csrPerson=getTableValueByHeader(c,rowData,'所属客服','');
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
    html+=crmSelectFieldHtml('所属国家',COUNTRY_CODE_NAME_OPTIONS,country,readonly);
    html+=readonly?crmWarehouseDisplayHtml('海外提货偏好仓库',warehouseOptions,pickupWarehouse):checkedDropdownFieldHtml('海外提货偏好仓库',warehouseOptions,pickupWarehouse);
    html+=crmSelectFieldHtml('启用状态',['启用','禁用'],getTableValueByHeader(c,rowData,'启用状态','启用'),readonly);
    html+=crmSelectFieldHtml('客户等级',['A类','B类','C类','D类'],getTableValueByHeader(c,rowData,'客户等级',''),readonly);
    html+=crmInputFieldHtml('联系人',getTableValueByHeader(c,rowData,'联系人',''),'text',readonly);
    html+=crmInputFieldHtml('联系电话',contactPhone,'tel',readonly);
    html+=crmInputFieldHtml('客户邮箱',getTableValueByHeader(c,rowData,'客户邮箱',''),'email',readonly);
    html+=crmSelectFieldHtml('客户类型',['直客','同行','平台','代理'],getTableValueByHeader(c,rowData,'客户类型',''),readonly);
    html+=crmSelectFieldHtml('结算周期',['出货票结','出货月结','签收月结'],getTableValueByHeader(c,rowData,'结算周期',''),readonly);
    html+=crmSelectFieldHtml('所属业务员',getEmployeeNameOptions(),salesPerson,readonly);
    html+=crmSelectFieldHtml('所属操作',getEmployeeNameOptions(),settlementPerson,readonly);
    html+=crmSelectFieldHtml('所属客服',getEmployeeNameOptions(),csrPerson,readonly);
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
            crmLeadingStarFieldHtml('是否签订合同','select',hasContract,readonly,true,{options:['是','否'],placeholder:'请选择'})+
            crmLeadingStarFieldHtml('法人姓名','text',legalName,readonly,true)+
            crmLeadingStarFieldHtml('法人身份证','text',legalIdCard,readonly,false)+
            crmLeadingStarFieldHtml('注册资本','text',regCapital,readonly,false)+
            crmLeadingStarFieldHtml('营业执照注册时间','date',licenseRegDate,readonly,true,{placeholder:'请选择营业执照注册时间'})+
            crmLeadingStarFieldHtml('开户名','text',bankAccountName,readonly,false)+
            crmLeadingStarFieldHtml('开户行','text',bankName,readonly,false)+
            crmLeadingStarFieldHtml('银行账号','text',bankAccount,readonly,false)+
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
    const status=rowData?rowData[8]:'草稿';
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
        html+=checkedDropdownFieldHtml('销售产品',['西非海运专线','西非空运专线','中东海运专线','欧洲铁路专线'],products);
        html+=checkedDropdownFieldHtml('发货仓库',warehouseOptions,branches);
        html+=checkedDropdownFieldHtml('目的仓库',destWarehouseOptions,ports);
    }
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('报价开始时间')+'</label><input id="lq-start" type="date" '+(isView?roCls:'class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"')+' value="'+esc(startDate)+'"></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('报价结束时间')+'</label><input id="lq-end" type="date" '+(isView?roCls:'class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"')+' value="'+esc(endDate)+'"></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('使用客户')+'</label><select id="lq-customer" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+roSelectCls+'>'+selectOptionsHtml(['全部客户','指定客户','鑫达贸易','远洋物流','速达货运'],customer)+'</select></div>';
    /* 状态由系统控制：新增默认「草稿」，经「批量发布报价」转为「正式」；仅查看态只读展示 */
    if(isView){
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('状态')+'</label><input type="text" readonly class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(status)+'"></div>';
    }
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('所属币别')+'</label><select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+roSelectCls+'>'+selectOptionsHtml(['CNY','USD','EUR','GBP'],'USD')+'</select></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('计重类型')+'</label><select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+roSelectCls+'>'+selectOptionsHtml(['重量','体积'],'重量')+'</select></div>';
    html+='<div class="md:col-span-4 flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('备注')+'</label><textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y"'+(isView?' readonly':'')+'>'+tr('按客户、产品、发货仓库和目的仓库维护散货报价。')+'</textarea></div>';
    html+='</div></div>';
    html+='<div class="border border-surface-200 rounded-xl overflow-hidden"><div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between gap-3"><div class="text-sm font-semibold text-text-primary">'+tr('价格维护')+'</div>'+(isView?'':'<div class="flex items-center gap-2"><button type="button" onclick="addLclWeightPriceRow()" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">+ '+tr('新增')+'</button><button type="button" onclick="switchLclWeightPriceMode(\'horizontal\')" class="h-8 px-3 text-xs font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('横向')+'</button><button type="button" onclick="switchLclWeightPriceMode(\'vertical\')" class="h-8 px-3 text-xs font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('纵向')+'</button></div>')+'</div>';
    html+='<div id="lcl-weight-price-wrap">'+renderLclWeightPriceTable(_lclWeightPriceMode)+'</div></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    if(isView){
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    }else{
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="submitLclQuote(\''+mode+'\',\''+id+'\',\''+esc(quoteCode)+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('保存报价')+'</button>';
    }
    document.getElementById('crud-modal').classList.add('show');
}

/* 保存报价：新增（含复制新增）默认写入「草稿」状态 */
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
            else if(hd==='销售产品')row.push('西非海运专线');
            else if(hd==='报价开始时间')row.push(v('lq-start','2026-01-01'));
            else if(hd==='报价结束时间')row.push(v('lq-end','2026-12-31'));
            else if(hd==='发货仓库')row.push('深圳盐田仓');
            else if(hd==='使用客户')row.push(v('lq-customer','全部客户'));
            else if(hd==='目的仓库')row.push('达喀尔海外仓');
            else if(hd==='状态')row.push('草稿');
            else row.push('');
        });
        if(!_listData[id])_listData[id]=(c.d||[]).map(function(r){return r.slice();});
        _listData[id].unshift(row);
        closeCrudModal();
        var mc=document.getElementById('main-content');
        if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,1,(typeof _statusFilterVal!=='undefined'?_statusFilterVal:'')||'');
        showToast(tr('已保存为草稿')+'：'+code);
        return;
    }
    closeCrudModal();
    showToast(tr('保存成功'));
}

/* ===== 批量发布报价（草稿 → 正式） ===== */
function openLclQuoteBatchPublish(id){
    var indices=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!indices.length){showToast(tr('请先勾选要发布的报价'));return;}
    var c=TC[id];if(!c)return;
    if(!_listData[id])_listData[id]=(c.d||[]).map(function(r){return r.slice();});
    var data=_listData[id];
    var iCode=c.h.indexOf('报价编号'),iName=c.h.indexOf('报价名称'),iProd=c.h.indexOf('销售产品'),iStart=c.h.indexOf('报价开始时间'),iEnd=c.h.indexOf('报价结束时间'),iSt=c.h.indexOf('状态');
    var picked=indices.map(function(i){return {i:i,r:data[i]};}).filter(function(x){return x.r;});
    /* 仅「草稿」状态可发布 */
    var eligible=picked.filter(function(x){return x.r[iSt]==='草稿';});
    var blocked=picked.length-eligible.length;
    if(!eligible.length){showToast(tr('仅「草稿」状态的报价可发布'));return;}
    var fmt=function(d){var s=String(d||'');return s?(s.length<=10?s+' 00:00:00':s):'—';};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('批量发布报价');
    var h='<div class="space-y-4">';
    h+='<div class="text-sm font-semibold text-text-primary">'+tr('批量发布报价个数')+'：<span class="text-orange-500">'+eligible.length+'</span></div>';
    if(blocked>0)h+='<div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">'+tr('另有 ')+blocked+tr(' 条非草稿状态（正式/作废），将不做处理。')+'</div>';
    eligible.forEach(function(x,n){
        var r=x.r;
        h+='<div class="space-y-2">';
        h+='<div class="text-sm text-text-primary">'+(n+1)+'、'+tr('操作报价编号')+'：<span class="font-semibold text-orange-500">'+esc(r[iCode])+'</span></div>';
        h+='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead><tr class="bg-surface-50 text-text-secondary">';
        ['报价编号','报价名称','销售产品','新生效时间','新失效时间','修改方式'].forEach(function(t){h+='<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(t)+'</th>';});
        h+='</tr></thead><tbody><tr class="border-t border-surface-100">';
        h+='<td class="px-3 py-2 whitespace-nowrap text-text-primary">'+esc(r[iCode])+'</td>';
        h+='<td class="px-3 py-2 whitespace-nowrap text-text-secondary">'+esc(iName>=0?r[iName]:'')+'</td>';
        h+='<td class="px-3 py-2 whitespace-nowrap text-text-secondary">'+esc(iProd>=0?r[iProd]:'')+'</td>';
        h+='<td class="px-3 py-2 whitespace-nowrap text-text-secondary">'+esc(fmt(r[iStart]))+'</td>';
        h+='<td class="px-3 py-2 whitespace-nowrap text-text-secondary">'+esc(fmt(r[iEnd]))+'</td>';
        h+='<td class="px-3 py-2 whitespace-nowrap text-text-secondary">'+tr('发布')+'</td>';
        h+='</tr></tbody></table></div></div>';
    });
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    var codes=eligible.map(function(x){return x.i;}).join(',');
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="confirmLclQuoteBatchPublish(\''+id+'\',\''+codes+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认')+'</button>'+
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer ml-2">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function confirmLclQuoteBatchPublish(id,idxCsv){
    var c=TC[id];if(!c)return;
    var iSt=c.h.indexOf('状态');
    var data=_listData[id]||[];
    var list=String(idxCsv||'').split(',').filter(function(s){return s!=='';}).map(function(s){return parseInt(s,10);});
    list.forEach(function(i){if(data[i])data[i][iSt]='正式';});
    closeCrudModal();
    var mc=document.getElementById('main-content');
    if(mc&&typeof generateListPage==='function')mc.innerHTML=generateListPage(id,_listPage[id]||1,(typeof _statusFilterVal!=='undefined'?_statusFilterVal:'')||'');
    showToast(tr('批量发布成功')+'，'+list.length+' '+tr('条报价已转为正式'));
}

function lclExcelInput(value,extraClass){
    return '<input data-excel-cell onpaste="handleLclExcelPaste(event,this)" class="w-full h-9 px-2 text-xs border-0 outline-none bg-transparent focus:bg-primary-50 '+(extraClass||'')+'" value="'+esc(value||'')+'">';
}

function defaultLclWeightPriceRow(base){
    base=base||{};
    return {groupId:base.groupId||nextLclWeightPriceGroupId(),weightSeg:base.weightSeg||'',price:base.price||'',cargoType:base.cargoType||'普货',weightType:base.weightType||'重量',billingMode:base.billingMode||'单价'};
}

function nextLclWeightPriceGroupId(){
    let max=0;
    (_lclWeightPriceRows||[]).forEach(function(row){
        const m=String((row&&row.groupId)||'').match(/lcl-g-(\d+)/);
        if(m)max=Math.max(max,parseInt(m[1],10)||0);
    });
    return 'lcl-g-'+(max+1);
}

function getLclHorizontalModel(){
    const source=_lclWeightPriceRows.length?_lclWeightPriceRows:[defaultLclWeightPriceRow({groupId:'lcl-g-1',weightSeg:'0-1',price:'1'})];
    const segments=[];
    const groups=[];
    const groupMap={};
    source.forEach(function(row,idx){
        const seg=row.weightSeg||'';
        if(!segments.includes(seg))segments.push(seg);
        const key=row.groupId||('auto-'+(row.cargoType||'普货')+'-'+(row.currency||'USD')+'-'+(row.billingMode||'单价')+'-'+(row.billingUnit||'KGS'));
        if(!groupMap[key]){
            groupMap[key]={groupId:row.groupId||('lcl-g-auto-'+idx),cargoType:row.cargoType||'普货',weightType:row.weightType||'重量',currency:row.currency||'USD',billingMode:row.billingMode||'单价',billingUnit:row.billingUnit||'KGS',prices:{}};
            groups.push(groupMap[key]);
        }
        groupMap[key].prices[seg]=row.price||'';
    });
    if(!segments.length)segments.push('');
    if(!groups.length)groups.push({groupId:nextLclWeightPriceGroupId(),cargoType:'普货',weightType:'重量',currency:'USD',billingMode:'单价',billingUnit:'KGS',prices:{}});
    return {segments:segments,groups:groups};
}

function captureLclWeightPriceRows(){
    const vertical=document.getElementById('lcl-weight-price-vertical');
    const horizontal=document.getElementById('lcl-weight-price-horizontal');
    if(vertical){
        _lclWeightPriceRows=Array.from(vertical.querySelectorAll('tbody tr')).map(function(row){
            return {
                groupId:row.dataset.groupId||nextLclWeightPriceGroupId(),
                weightSeg:(row.querySelector('[data-field="weightSeg"]')||{}).value||'',
                price:(row.querySelector('[data-field="price"]')||{}).value||'',
                cargoType:(row.querySelector('[data-field="cargoType"]')||{}).value||'普货',
                currency:(row.querySelector('[data-field="currency"]')||{}).value||'USD',
                billingMode:(row.querySelector('[data-field="billingMode"]')||{}).value||'单价',
                billingUnit:(row.querySelector('[data-field="billingUnit"]')||{}).value||'KGS'
            };
        });
    }else if(horizontal){
        const weightInputs=Array.from(horizontal.querySelectorAll('thead [data-horizontal-weight-seg]'));
        const segments=weightInputs.map(function(input){return input.value||'';});
        const nextRows=[];
        Array.from(horizontal.querySelectorAll('tbody tr[data-horizontal-row]')).forEach(function(row){
            const groupId=row.dataset.groupId||nextLclWeightPriceGroupId();
            const cargoType=(row.querySelector('[data-horizontal-cargo-type]')||{}).value||'普货';
            const currency=(row.querySelector('[data-horizontal-currency]')||{}).value||'USD';
            const billingMode=(row.querySelector('[data-horizontal-billing-mode]')||{}).value||'单价';
            const billingUnit=(row.querySelector('[data-horizontal-billing-unit]')||{}).value||'KGS';
            const prices=Array.from(row.querySelectorAll('[data-horizontal-price]'));
            segments.forEach(function(seg,i){
                nextRows.push({groupId:groupId,weightSeg:seg,price:(prices[i]||{}).value||'',cargoType:cargoType,currency:currency,billingMode:billingMode,billingUnit:billingUnit});
            });
        });
        _lclWeightPriceRows=nextRows;
    }
    if(_lclWeightPriceRows.length===0)_lclWeightPriceRows=[defaultLclWeightPriceRow()];
}

function renderLclWeightPriceTable(mode){
    mode=mode||_lclWeightPriceMode;
    const rows=_lclWeightPriceRows.length?_lclWeightPriceRows:[{weightSeg:'0-1',price:'1',cargoType:'普货',billingMode:'单价'}];
    let html='';
    if(mode==='horizontal'){
        const matrix=getLclHorizontalModel();
        html+='<div class="overflow-auto max-h-[360px]" id="lcl-weight-price-horizontal"><table class="w-max min-w-full text-xs border-collapse">';
        html+='<thead><tr class="bg-[#EFF6FF] text-text-secondary">';
        ['货物类型','计费方式'].forEach(function(hd){html+='<th rowspan="2" class="text-left px-3 py-2 border border-surface-200 min-w-[110px] bg-[#EFF6FF]">'+tr(hd)+'</th>';});
        html+='<th colspan="'+Math.max(matrix.segments.length,1)+'" class="text-left px-3 py-2 border border-surface-200">'+tr('重量段')+'</th>';
        html+='<th rowspan="2" class="sticky right-0 z-20 text-center px-3 py-2 border border-surface-200 min-w-[96px] bg-[#EFF6FF] shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]">'+tr('操作')+'</th></tr>';
        html+='<tr class="bg-[#EFF6FF] text-text-secondary">';
        matrix.segments.forEach(function(seg){
            html+='<th class="px-2 py-1 border border-surface-200 min-w-[128px]"><div class="flex items-center gap-1">'+
                '<input data-excel-cell data-horizontal-weight-seg onpaste="handleLclExcelPaste(event,this)" class="w-full h-8 px-2 text-xs border border-surface-200 rounded bg-white outline-none focus:bg-primary-50" value="'+esc(seg||'')+'">'+
                '</div></th>';
        });
        html+='</tr></thead><tbody>';
        matrix.groups.forEach(function(group){
            html+='<tr data-horizontal-row data-group-id="'+esc(group.groupId)+'" class="hover:bg-primary-50/30">';
            html+='<td class="border border-surface-200 bg-white"><select data-horizontal-cargo-type class="w-full h-9 px-2 border-0 bg-transparent outline-none">'+selectOptionsHtml(['普货','敏感货'],group.cargoType||'普货')+'</select></td>';
            html+='<td class="border border-surface-200 bg-white"><select data-horizontal-billing-mode class="w-full h-9 px-2 border-0 bg-transparent outline-none">'+selectOptionsHtml(['单价','总价'],group.billingMode||'单价')+'</select></td>';
            matrix.segments.forEach(function(seg){
                html+='<td class="min-w-[128px] border border-surface-200 bg-white">'+lclExcelInput(group.prices[seg]||'','text-right').replace('data-excel-cell','data-excel-cell data-horizontal-price')+'</td>';
            });
            html+='<td class="sticky right-0 z-10 border border-surface-200 text-center bg-white shadow-[-6px_0_8px_-8px_rgba(15,23,42,.45)]"><button type="button" onclick="removeLclHorizontalRow(\''+esc(group.groupId)+'\')" class="h-8 px-3 text-xs text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button></td>';
            html+='</tr>';
        });
        html+='</tbody></table></div>';
    }else{
        html+='<div class="overflow-auto max-h-[360px]" id="lcl-weight-price-vertical"><table class="w-full min-w-[760px] text-xs border-collapse">';
        html+='<thead class="sticky top-0 z-10"><tr class="bg-[#EFF6FF] text-text-secondary"><th class="text-left px-3 py-2 border border-surface-200 min-w-[120px]">'+tr('货物类型')+'</th><th class="text-left px-3 py-2 border border-surface-200 min-w-[160px]">'+tr('重量段')+'</th><th class="text-left px-3 py-2 border border-surface-200 min-w-[160px]">'+tr('单价/总价')+'</th><th class="text-left px-3 py-2 border border-surface-200">'+tr('计费方式')+'</th><th class="text-center px-3 py-2 border border-surface-200">'+tr('操作')+'</th></tr></thead><tbody>';
        rows.forEach(function(row,idx){
            html+='<tr data-group-id="'+esc(row.groupId||nextLclWeightPriceGroupId())+'" class="hover:bg-primary-50/30">';
            html+='<td class="border border-surface-200 bg-white"><select data-field="cargoType" class="w-full h-9 px-2 border-0 bg-transparent outline-none">'+selectOptionsHtml(['普货','敏感货'],row.cargoType||'普货')+'</select></td>';
            html+='<td class="border border-surface-200 bg-white">'+lclExcelInput(row.weightSeg)+'<input type="hidden" data-field="weightSeg" value="'+esc(row.weightSeg||'')+'"></td>';
            html+='<td class="border border-surface-200 bg-white">'+lclExcelInput(row.price,'text-right')+'<input type="hidden" data-field="price" value="'+esc(row.price||'')+'"></td>';
            html+='<td class="border border-surface-200 bg-white"><select data-field="billingMode" class="w-full h-9 px-2 border-0 bg-transparent outline-none">'+selectOptionsHtml(['单价','总价'],row.billingMode||'单价')+'</select></td>';
            html+='<td class="border border-surface-200 text-center bg-white"><button type="button" onclick="removeLclWeightPriceRow('+idx+')" class="text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button></td></tr>';
        });
        html+='</tbody></table></div>';
    }
    html+='<div class="px-4 py-2 text-[11px] text-text-muted bg-surface-50 border-t border-surface-200">'+tr('支持从 Excel 复制多行多列数据后直接粘贴到表格单元格。')+'</div>';
    return html;
}

function syncVisibleLclExcelInputs(){
    const vertical=document.getElementById('lcl-weight-price-vertical');
    if(!vertical)return;
    vertical.querySelectorAll('tbody tr').forEach(function(row){
        const cells=row.querySelectorAll('[data-excel-cell]');
        const weight=row.querySelector('[data-field="weightSeg"]');
        const price=row.querySelector('[data-field="price"]');
        if(weight&&cells[0])weight.value=cells[0].value;
        if(price&&cells[1])price.value=cells[1].value;
    });
}

function switchLclWeightPriceMode(mode){
    syncVisibleLclExcelInputs();
    captureLclWeightPriceRows();
    _lclWeightPriceMode=mode;
    renderLclWeightPriceWrap(mode);
}

function renderLclWeightPriceWrap(mode){
    const wrap=document.getElementById('lcl-weight-price-wrap');
    if(wrap){
        wrap.innerHTML=renderLclWeightPriceTable(mode||_lclWeightPriceMode);
        applyRuntimeEnhancements(wrap);
    }
}

function addLclWeightPriceRow(){
    syncVisibleLclExcelInputs();
    captureLclWeightPriceRows();
    if(_lclWeightPriceMode==='horizontal'){
        const matrix=getLclHorizontalModel();
        const base=matrix.groups[0]||{cargoType:'普货',currency:'USD',billingMode:'单价',billingUnit:'KGS'};
        const groupId=nextLclWeightPriceGroupId();
        matrix.segments.forEach(function(seg){
            _lclWeightPriceRows.push(defaultLclWeightPriceRow({groupId:groupId,weightSeg:seg,price:'',cargoType:base.cargoType,currency:base.currency,billingMode:base.billingMode,billingUnit:base.billingUnit}));
        });
    }else{
        const base=_lclWeightPriceRows[0]||defaultLclWeightPriceRow();
        _lclWeightPriceRows.push(defaultLclWeightPriceRow({groupId:base.groupId,weightSeg:'',price:'',cargoType:base.cargoType,currency:base.currency,billingMode:base.billingMode,billingUnit:base.billingUnit}));
    }
    renderLclWeightPriceWrap(_lclWeightPriceMode);
}

function removeLclWeightPriceRow(idx){
    syncVisibleLclExcelInputs();
    captureLclWeightPriceRows();
    _lclWeightPriceRows.splice(idx,1);
    if(_lclWeightPriceRows.length===0)_lclWeightPriceRows.push(defaultLclWeightPriceRow());
    renderLclWeightPriceWrap(_lclWeightPriceMode);
}

function removeLclHorizontalRow(groupId){
    syncVisibleLclExcelInputs();
    captureLclWeightPriceRows();
    _lclWeightPriceRows=_lclWeightPriceRows.filter(function(row){return row.groupId!==groupId;});
    if(_lclWeightPriceRows.length===0)_lclWeightPriceRows.push(defaultLclWeightPriceRow());
    renderLclWeightPriceWrap(_lclWeightPriceMode);
}

function handleLclExcelPaste(e,input){
    const text=(e.clipboardData||window.clipboardData).getData('text');
    if(!text||(!text.includes('\t')&&!text.includes('\n')))return;
    e.preventDefault();
    const table=input.closest('table');
    if(!table)return;
    const cells=Array.from(table.querySelectorAll('[data-excel-cell]'));
    const startIdx=cells.indexOf(input);
    const matrix=text.trim().split(/\r?\n/).map(function(row){return row.split('\t');});
    if(table.closest('#lcl-weight-price-horizontal')){
        const rows=Array.from(table.querySelectorAll('tr'));
        const startRow=input.closest('tr');
        const rowIdx=rows.indexOf(startRow);
        const colIdx=Array.from(startRow.querySelectorAll('[data-excel-cell]')).indexOf(input);
        matrix.forEach(function(r,ri){
            const targetRow=rows[rowIdx+ri];
            if(!targetRow)return;
            const rowCells=Array.from(targetRow.querySelectorAll('[data-excel-cell]'));
            r.forEach(function(v,ci){if(rowCells[colIdx+ci])rowCells[colIdx+ci].value=v;});
        });
    }else{
        matrix.forEach(function(r,ri){
            r.forEach(function(v,ci){
                const target=cells[startIdx+ri*2+ci];
                if(target)target.value=v;
            });
        });
        syncVisibleLclExcelInputs();
    }
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

