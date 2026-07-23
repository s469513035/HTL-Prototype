function crmQualFieldHtml(key,label,value,type,readonly,requiredInit){
    const attr=readonly?' readonly disabled':'';
    const reqAttr=requiredInit&&!readonly?' required':'';
    const markCls=requiredInit?'':' hidden';
    return '<div class="flex flex-col gap-1.5" data-crm-qual-field="'+esc(key)+'"><label class="text-sm font-medium text-text-secondary">'+tr(label)+' <span class="crm-req-mark text-red-500'+markCls+'">*</span></label><input type="'+(type||'text')+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg '+(readonly?'bg-surface-100 cursor-not-allowed':'bg-surface-50')+'" value="'+esc(value||'')+'"'+attr+reqAttr+'></div>';
}

function crmBizTypeChanged(value){
    const grid=document.getElementById('crm-qualification-grid');
    if(!grid)return;
    const isFcl=value==='整柜';
    grid.querySelectorAll('[data-crm-qual-field]').forEach(function(div){
        const key=div.dataset.crmQualField;
        const mark=div.querySelector('.crm-req-mark');
        const input=div.querySelector('input');
        if(key==='组织机构代码'){
            div.classList.toggle('hidden',!isFcl);
            if(mark)mark.classList.toggle('hidden',!isFcl);
            if(input){if(isFcl)input.setAttribute('required','required');else input.removeAttribute('required');}
        }else{
            if(mark)mark.classList.toggle('hidden',isFcl);
            if(input){if(isFcl)input.removeAttribute('required');else input.setAttribute('required','required');}
        }
    });
}

function recognizeCrmLicense(input){
    if(!input||!input.files||!input.files.length)return;
    showToast(tr('营业执照识别中…'));
    setTimeout(function(){
        const licenseInput=document.querySelector('[data-crm-qual-field="公司营业执照"] input');
        if(licenseInput)licenseInput.value='91440300MA5F'+Math.floor(Math.random()*900000+100000);
        showToast(tr('识别成功，已自动填充'));
    },500);
    input.value='';
}

function crmAttachmentSlot(key,label,hint,accept,readonly){
    const inputId='crm-att-input-'+key;
    const boxId='crm-att-box-'+key;
    let box='';
    if(readonly){
        box='<div class="w-32 h-32 border-2 border-dashed border-surface-200 rounded-lg flex items-center justify-center bg-surface-50 text-text-muted text-2xl select-none">—</div>';
    }else{
        box='<div id="'+boxId+'" onclick="document.getElementById(\''+inputId+'\').click()" class="w-32 h-32 border-2 border-dashed border-primary-300 rounded-lg flex items-center justify-center cursor-pointer text-3xl text-text-muted hover:border-primary-500 hover:bg-primary-50/30 transition-colors select-none">+</div>'+
            '<input type="file" id="'+inputId+'" class="hidden" accept="'+esc(accept)+'" onchange="handleCrmAttachmentSlot(this,\''+boxId+'\')">';
    }
    return '<div>'+
        '<div class="text-sm text-text-primary mb-2">'+tr(label)+'</div>'+
        box+
        '<div class="text-xs text-text-muted mt-2">'+tr(hint)+'</div>'+
    '</div>';
}

function handleCrmAttachmentSlot(input,boxId){
    if(!input.files||!input.files.length)return;
    const file=input.files[0];
    const box=document.getElementById(boxId);
    if(!box)return;
    const isImg=/^image\//.test(file.type);
    let preview='<svg class="w-6 h-6 text-emerald-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>';
    if(isImg){
        const url=URL.createObjectURL(file);
        preview='<img src="'+url+'" class="w-full h-16 object-cover rounded mb-1">';
    }
    box.innerHTML='<div class="flex flex-col items-center gap-0.5 px-1 py-1 text-center w-full">'+preview+
        '<div class="text-[10px] text-text-primary truncate w-full px-1" title="'+esc(file.name)+'">'+esc(file.name)+'</div>'+
        '<button type="button" onclick="event.stopPropagation();clearCrmAttachmentSlot(\''+boxId+'\')" class="text-[10px] text-red-500 hover:text-red-600 cursor-pointer">'+tr('移除')+'</button>'+
    '</div>';
    box.classList.remove('text-3xl','text-text-muted');
    box.classList.add('has-file');
    input.value='';
}

function clearCrmAttachmentSlot(boxId){
    const box=document.getElementById(boxId);
    if(!box)return;
    box.innerHTML='+';
    box.classList.remove('has-file');
    box.classList.add('text-3xl','text-text-muted');
}

function handleCrmCustomerAttachmentUpload(input){
    const list=document.getElementById('crm-customer-attachment-list');
    if(!list||!input.files)return;
    Array.from(input.files).forEach(function(file){
        const sizeStr=file.size<1024?file.size+'B':file.size<1048576?(file.size/1024).toFixed(1)+'KB':(file.size/1048576).toFixed(1)+'MB';
        const item=document.createElement('div');
        item.className='attachment-item flex items-center justify-between p-2.5 bg-surface-50 rounded-lg border border-surface-200';
        item.innerHTML='<div class="flex items-center gap-2 flex-1 min-w-0"><svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div class="min-w-0"><div class="text-sm text-text-primary truncate">'+esc(file.name)+'</div><div class="text-xs text-text-muted">'+sizeStr+'</div></div></div><button type="button" onclick="this.closest(\'.attachment-item\').remove()" class="text-red-500 hover:text-red-600 cursor-pointer text-xs font-medium">'+tr('删除')+'</button>';
        list.appendChild(item);
    });
    input.value='';
}

function crmCheckboxGroupHtml(options,value,readonly){
    const selected=String(value||'').split(/[、,，;；]/).map(function(v){return v.trim();}).filter(Boolean);
    let html='<div class="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg border border-surface-200 bg-surface-50 p-3">';
    options.forEach(function(o){
        const checked=selected.some(function(v){return v===o||o.includes(v)||v.includes(o);});
        html+='<label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600"'+(checked?' checked':'')+(readonly?' disabled':'')+'><span>'+esc(tr(o))+'</span></label>';
    });
    html+='</div>';
    return html;
}

function crmAddressRowHtml(row,readonly){
    const r=row||{};
    const attr=readonly?' disabled':'';
    const inputClass='w-full h-8 px-2 text-xs border border-surface-200 rounded bg-white';
    let html='<tr class="border-b border-surface-100 hover:bg-surface-50">';
    html+='<td class="px-3 py-2"><input class="'+inputClass+'" value="'+esc(r.contact||'')+'"'+attr+'></td>';
    html+='<td class="px-3 py-2"><input class="'+inputClass+'" value="'+esc(r.phone||'')+'"'+attr+'></td>';
    html+='<td class="px-3 py-2"><input class="'+inputClass+'" value="'+esc(r.country||'')+'"'+attr+'></td>';
    html+='<td class="px-3 py-2"><input class="'+inputClass+'" value="'+esc(r.province||'')+'"'+attr+'></td>';
    html+='<td class="px-3 py-2"><input class="'+inputClass+'" value="'+esc(r.city||'')+'"'+attr+'></td>';
    html+='<td class="px-3 py-2"><input class="'+inputClass+'" value="'+esc(r.zip||'')+'"'+attr+'></td>';
    html+='<td class="px-3 py-2 min-w-[240px]"><input class="'+inputClass+'" value="'+esc(r.address||'')+'"'+attr+'></td>';
    html+='<td class="px-3 py-2"><select class="'+inputClass+'"'+attr+'>'+selectOptionsHtml(['是','否'],r.isDefault||'否')+'</select></td>';
    if(readonly)html+='<td class="px-3 py-2 text-center text-text-muted">-</td>';
    else html+='<td class="px-3 py-2 text-center"><button type="button" onclick="removeCrmAddressRow(this)" class="h-8 px-3 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer">'+tr('删除')+'</button></td>';
    html+='</tr>';
    return html;
}

function crmAddressTableHtml(type,readonly){
    const senderRows=[{contact:'张明',phone:'13800138000',country:'CN',province:'广东省',city:'深圳市',zip:'518081',address:'深圳市盐田区盐田路 88 号',isDefault:'是'}];
    const receiverRows=[{contact:'John Doe',phone:'+1-310-9876543',country:'US',province:'CA',city:'Los Angeles',zip:'90001',address:'1234 Sample St, Los Angeles, CA 90001, USA',isDefault:'是'}];
    const rows=type==='sender'?senderRows:receiverRows;
    const headers=type==='sender'
        ?['发件人','发件电话','发件国家','发件州省','发件城市','发件邮编','发件地址','默认发件人','操作']
        :['收件人','收件电话','收件国家','收件州省','收件城市','收件邮编','收件地址','默认收件人','操作'];
    let html='<div data-crm-address-panel="'+type+'" class="'+(type==='sender'?'':'hidden')+'">';
    html+='<div class="overflow-x-auto border border-surface-200 rounded-xl"><table class="w-full text-xs min-w-[1080px]"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    headers.forEach(function(hd){html+='<th class="text-left px-3 py-2">'+tr(hd)+'</th>';});
    html+='</tr></thead><tbody id="crm-'+type+'-address-body">'+rows.map(function(row){return crmAddressRowHtml(row,readonly);}).join('')+'</tbody></table></div>';
    if(!readonly)html+='<div class="mt-3"><button type="button" onclick="addCrmAddressRow(\''+type+'\')" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">+ '+tr('新增地址')+'</button></div>';
    html+='</div>';
    return html;
}

function switchCrmAddressTab(type){
    document.querySelectorAll('[data-crm-address-tab]').forEach(function(btn){
        const active=btn.getAttribute('data-crm-address-tab')===type;
        btn.classList.toggle('border-primary-600',active);
        btn.classList.toggle('text-primary-600',active);
        btn.classList.toggle('font-semibold',active);
        btn.classList.toggle('border-transparent',!active);
        btn.classList.toggle('text-text-secondary',!active);
    });
    document.querySelectorAll('[data-crm-address-panel]').forEach(function(panel){
        panel.classList.toggle('hidden',panel.getAttribute('data-crm-address-panel')!==type);
    });
}

function addCrmAddressRow(type){
    const tbody=document.getElementById('crm-'+type+'-address-body');
    if(!tbody)return;
    tbody.insertAdjacentHTML('beforeend',crmAddressRowHtml({isDefault:'否'},false));
    applyRuntimeEnhancements(tbody.lastElementChild);
}

function removeCrmAddressRow(btn){
    const tbody=btn.closest('tbody');
    if(!tbody)return;
    if(tbody.querySelectorAll('tr').length<=1){
        showToast(tr('至少保留一条地址'));
        return;
    }
    btn.closest('tr').remove();
}

function toggleCrmRiskControl(value){
    const panel=document.getElementById('crm-risk-control');
    if(panel)panel.classList.toggle('hidden',value!=='整柜');
}

function openProviderModal(mode,id,rowIdx,rowData){
    const c=TC[id];
    const L=_lang[_currentLang];
    const readonly=mode==='view';
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:L.edit;
    titleEl.textContent=modeLabel+tr(c.t);
    const codeIdx=(c.h||[]).indexOf('服务商代码');
    const rawData=TC[id].d||[];
    const lastCode=(rawData[rawData.length-1]&&rawData[rawData.length-1][codeIdx])||'SUP-000';
    const lm=String(lastCode).match(/^(.*?)(\d+)$/);
    const autoCode=lm?lm[1]+String(parseInt(lm[2],10)+1).padStart(lm[2].length,'0'):'SUP-001';
    const providerCode=mode==='add'?autoCode:getTableValueByHeader(c,rowData,'服务商代码','');
    const providerName=getTableValueByHeader(c,rowData,'服务商全称','');
    const engName=getTableValueByHeader(c,rowData,'服务商全称（英文）','');
    const providerType=getTableValueByHeader(c,rowData,'服务商类型','专线');
    const contact=getTableValueByHeader(c,rowData,'联系人','');
    const phone=getTableValueByHeader(c,rowData,'联系人手机','');
    const email=getTableValueByHeader(c,rowData,'联系人邮箱','');
    const settlement=getTableValueByHeader(c,rowData,'账期','月结');
    const remark=getTableValueByHeader(c,rowData,'备注','');
    const bizLicense=getTableValueByHeader(c,rowData,'营业执照号','');
    const bankAccount=getTableValueByHeader(c,rowData,'银行账号','');
    const bankName=getTableValueByHeader(c,rowData,'开户行','');
    const invoiceInfo=getTableValueByHeader(c,rowData,'开票信息','');
    const enableStatus=getTableValueByHeader(c,rowData,'是否启用','是');
    const address=getTableValueByHeader(c,rowData,'营业地址','');
    let html='<div class="space-y-5">';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('基本信息')+'</div><div class="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('服务商编码')+'</label>';
    if(mode==='edit'){html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(providerCode)+'" readonly>';}
    else if(mode==='add'){html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(autoCode)+'" placeholder="'+tr('自动生成')+'">';}
    else{html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(providerCode)+'</div>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('服务商名称')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(providerName)+'</div>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(providerName)+'" placeholder="'+tr('请输入服务商名称')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('服务商英文名称')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(engName)+'</div>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(engName)+'" placeholder="'+tr('请输入服务商英文名称')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('服务商类型')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(providerType)+'</div>';}
    else{html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['专线','整柜','空运','快递','铁路'],providerType)+'</select>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('联系人')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(contact)+'</div>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(contact)+'" placeholder="'+tr('请输入联系人')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('联系电话')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(phone)+'</div>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(phone)+'" placeholder="'+tr('请输入联系电话')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('邮箱')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(email)+'</div>';}
    else{html+='<input type="email" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(email)+'" placeholder="'+tr('请输入邮箱')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('结算方式')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(settlement)+'</div>';}
    else{html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['月结','周结','日结','预付'],settlement)+'</select>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('营业执照')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(bizLicense)+'</div>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(bizLicense)+'" placeholder="'+tr('请输入营业执照')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('银行账号')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(bankAccount)+'</div>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(bankAccount)+'" placeholder="'+tr('请输入银行账号')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('开户行')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(bankName)+'</div>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(bankName)+'" placeholder="'+tr('请输入开户行')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('开票信息')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(invoiceInfo)+'</div>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(invoiceInfo)+'" placeholder="'+tr('请输入开票信息')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('启用状态')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+statusBadge(enableStatus)+'</div>';}
    else{html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['启用','禁用'],enableStatus)+'</select>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('联系地址')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(address)+'</div>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(address)+'" placeholder="'+tr('请输入联系地址')+'">';}
    html+='</div>';
    html+='</div></div>';
    html+='<div class="modal-remark-half"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('备注')+'</div>';
    if(readonly){html+='<div class="px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 min-h-[60px]">'+esc(remark)+'</div>';}
    else{html+='<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+tr('请输入备注')+'">'+esc(remark)+'</textarea>';}
    html+='</div>';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('附件上传')+'</div>';
    html+='<div class="border-2 border-dashed border-surface-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors" onclick="triggerFileUpload(\'provider\')">';
    html+='<svg class="w-8 h-8 text-text-muted mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>';
    html+='<p class="text-sm text-text-muted">'+tr('点击选择文件上传')+'</p>';
    html+='<p class="text-xs text-text-muted mt-1">'+tr('支持多文件上传')+'</p>';
    html+='</div>';
    html+='<input type="file" id="provider-file-input" multiple class="hidden" onchange="handleFileUpload(this,\'provider-attachment-list\',\''+mode+'\')">';
    html+='<div class="mt-3 grid grid-cols-3 gap-2" id="provider-attachment-list">';
    var _pDownloadBtn=mode!=='add'?'<a class="text-primary-600 hover:text-primary-700 cursor-pointer text-xs font-medium" onclick="showToast(\''+tr('开始下载')+': 营业执照.pdf\')">'+tr('下载')+'</a>':'';
    var _pDeleteBtn=mode!=='view'?'<button type="button" onclick="this.closest(\'.attachment-item\').remove()" class="text-red-500 hover:text-red-600 cursor-pointer text-xs font-medium">'+tr('删除')+'</button>':'';
    html+='<div class="attachment-item flex items-center justify-between p-2.5 bg-surface-50 rounded-lg border border-surface-200"><div class="flex items-center gap-2 flex-1 min-w-0"><svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div class="min-w-0"><div class="text-sm text-text-primary truncate">营业执照.pdf</div><div class="text-xs text-text-muted">2.3MB</div></div></div><div class="flex items-center gap-3 flex-shrink-0">'+_pDownloadBtn+_pDeleteBtn+'</div></div>';
    var _pDownloadBtn2=mode!=='add'?'<a class="text-primary-600 hover:text-primary-700 cursor-pointer text-xs font-medium" onclick="showToast(\''+tr('开始下载')+': 资质证明.docx\')">'+tr('下载')+'</a>':'';
    var _pDeleteBtn2=mode!=='view'?'<button type="button" onclick="this.closest(\'.attachment-item\').remove()" class="text-red-500 hover:text-red-600 cursor-pointer text-xs font-medium">'+tr('删除')+'</button>':'';
    html+='<div class="attachment-item flex items-center justify-between p-2.5 bg-surface-50 rounded-lg border border-surface-200"><div class="flex items-center gap-2 flex-1 min-w-0"><svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div class="min-w-0"><div class="text-sm text-text-primary truncate">资质证明.docx</div><div class="text-xs text-text-muted">856KB</div></div></div><div class="flex items-center gap-3 flex-shrink-0">'+_pDownloadBtn2+_pDeleteBtn2+'</div></div>';
    html+='</div></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    if(readonly){
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button>';
    }else{
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+(mode==='add'?tr('新增成功'):tr('保存成功'))+'\')" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">'+tr('确认提交')+'</button>';
    }
    document.getElementById('crud-modal').classList.add('show');
}

function openEmployeeModal(mode,id,rowIdx,rowData){
    const c=TC[id];
    const L=_lang[_currentLang];
    const readonly=mode==='view';
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:L.edit;
    titleEl.textContent=modeLabel+tr(c.t);
    const codeIdx=(c.h||[]).indexOf('员工编号');
    const rawData=TC[id].d||[];
    const lastCode=(rawData[rawData.length-1]&&rawData[rawData.length-1][codeIdx])||'EMP000';
    const lm=String(lastCode).match(/^(.*?)(\d+)$/);
    const autoCode=lm?lm[1]+String(parseInt(lm[2],10)+1).padStart(lm[2].length,'0'):'EMP001';
    const empCode=mode==='add'?autoCode:getTableValueByHeader(c,rowData,'员工编号','');
    const empName=getTableValueByHeader(c,rowData,'姓名','');
    const hq=getTableValueByHeader(c,rowData,'所属总部','');
    const region=getTableValueByHeader(c,rowData,'所属大区','');
    const branch=getTableValueByHeader(c,rowData,'所属分公司','');
    const dept=getTableValueByHeader(c,rowData,'所属部门','');
    const team=getTableValueByHeader(c,rowData,'所属工作组','');
    const position=getTableValueByHeader(c,rowData,'岗位','');
    const phone=getTableValueByHeader(c,rowData,'手机号','');
    const email=getTableValueByHeader(c,rowData,'邮箱','');
    const status=getTableValueByHeader(c,rowData,'状态','启用');
    const remark=getTableValueByHeader(c,rowData,'备注','');
    let html='<div class="space-y-5">';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('基本信息')+'</div><div class="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('员工编号')+'</label>';
    if(mode==='edit'){html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(empCode)+'" readonly>';}
    else if(mode==='add'){html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(autoCode)+'" placeholder="'+tr('自动生成')+'">';}
    else{html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(empCode)+'</div>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('姓名')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(empName)+'</div>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(empName)+'" placeholder="'+tr('请输入姓名')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('所属总部')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(hq)+'</div>';}
    else{html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['集团总部'],hq)+'</select>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('所属大区')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(region)+'</div>';}
    else{html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['华南大区','华东大区','海外大区'],region)+'</select>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('所属分公司')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(branch)+'</div>';}
    else{html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['深圳分公司','广州分公司','上海分公司','义乌分公司'],branch)+'</select>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('所属部门')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(dept)+'</div>';}
    else{html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['销售部','操作部','海外部','财务部','客服部'],dept)+'</select>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('所属工作组')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(team)+'</div>';}
    else{html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['西非海运组','东非海运组','空运组','铁路组'],team)+'</select>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('岗位')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(position)+'</div>';}
    else{html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['总经理','销售经理','操作主管','海外经理','财务总监','客服专员','操作员'],position)+'</select>';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('手机号')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(phone)+'</div>';}
    else{html+='<input type="tel" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(phone)+'" placeholder="'+tr('请输入手机号')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('邮箱')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+esc(email)+'</div>';}
    else{html+='<input type="email" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(email)+'" placeholder="'+tr('请输入邮箱')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('状态')+'</label>';
    if(readonly){html+='<div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+statusBadge(status)+'</div>';}
    else{html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['启用','禁用'],status)+'</select>';}
    html+='</div>';
    html+='</div></div>';
    html+='<div class="modal-remark-half"><div class="text-sm font-semibold text-text-primary mb-3">'+tr('备注')+'</div>';
    if(readonly){html+='<div class="px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 min-h-[60px]">'+esc(remark)+'</div>';}
    else{html+='<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+tr('请输入备注')+'">'+esc(remark)+'</textarea>';}
    html+='</div>';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('附件上传')+'</div>';
    html+='<div class="border-2 border-dashed border-surface-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors" onclick="triggerFileUpload(\'employee\')">';
    html+='<svg class="w-8 h-8 text-text-muted mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>';
    html+='<p class="text-sm text-text-muted">'+tr('点击选择文件上传')+'</p>';
    html+='<p class="text-xs text-text-muted mt-1">'+tr('支持多文件上传')+'</p>';
    html+='</div>';
    html+='<input type="file" id="employee-file-input" multiple class="hidden" onchange="handleFileUpload(this,\'employee-attachment-list\',\''+mode+'\')">';
    html+='<div class="mt-3 grid grid-cols-3 gap-2" id="employee-attachment-list">';
    var _eDownloadBtn=mode!=='add'?'<a class="text-primary-600 hover:text-primary-700 cursor-pointer text-xs font-medium" onclick="showToast(\''+tr('开始下载')+': 身份证正面.jpg\')">'+tr('下载')+'</a>':'';
    var _eDeleteBtn=mode!=='view'?'<button type="button" onclick="this.closest(\'.attachment-item\').remove()" class="text-red-500 hover:text-red-600 cursor-pointer text-xs font-medium">'+tr('删除')+'</button>':'';
    html+='<div class="attachment-item flex items-center justify-between p-2.5 bg-surface-50 rounded-lg border border-surface-200"><div class="flex items-center gap-2 flex-1 min-w-0"><svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div class="min-w-0"><div class="text-sm text-text-primary truncate">身份证正面.jpg</div><div class="text-xs text-text-muted">1.2MB</div></div></div><div class="flex items-center gap-3 flex-shrink-0">'+_eDownloadBtn+_eDeleteBtn+'</div></div>';
    var _eDownloadBtn2=mode!=='add'?'<a class="text-primary-600 hover:text-primary-700 cursor-pointer text-xs font-medium" onclick="showToast(\''+tr('开始下载')+': 身份证反面.jpg\')">'+tr('下载')+'</a>':'';
    var _eDeleteBtn2=mode!=='view'?'<button type="button" onclick="this.closest(\'.attachment-item\').remove()" class="text-red-500 hover:text-red-600 cursor-pointer text-xs font-medium">'+tr('删除')+'</button>':'';
    html+='<div class="attachment-item flex items-center justify-between p-2.5 bg-surface-50 rounded-lg border border-surface-200"><div class="flex items-center gap-2 flex-1 min-w-0"><svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div class="min-w-0"><div class="text-sm text-text-primary truncate">身份证反面.jpg</div><div class="text-xs text-text-muted">980KB</div></div></div><div class="flex items-center gap-3 flex-shrink-0">'+_eDownloadBtn2+_eDeleteBtn2+'</div></div>';
    html+='</div></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    if(readonly){
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button>';
    }else{
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+(mode==='add'?tr('新增成功'):tr('保存成功'))+'\')" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">'+tr('确认提交')+'</button>';
    }
    document.getElementById('crud-modal').classList.add('show');
}

function expressSortMultiCheckboxHtml(prefix,options,selected){
    const sel=selected||[];
    return '<div class="flex flex-wrap gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3">'+
        options.map(function(o){
            const on=sel.indexOf(o)>=0?' checked':'';
            return '<label class="inline-flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer"><input type="checkbox" class="'+esc(prefix)+' rounded border-surface-300 text-primary-600" value="'+esc(o)+'"'+on+' onchange="rebuildExpressSortDetail()"><span>'+esc(tr(o))+'</span></label>';
        }).join('')+
    '</div>';
}

function collectExpressSortChecked(cls){
    return Array.from(document.querySelectorAll('.'+cls+':checked')).map(function(cb){return cb.value;});
}

var _expressSortDetails={
    'SP1001':[
        {country:'塞内加尔',transport:'海运',gridNo:'G001',sealWeight:'20KG',sortCode:'SC-0001'},
        {country:'塞内加尔',transport:'空运',gridNo:'G002',sealWeight:'22KG',sortCode:'SC-0002'},
        {country:'尼日利亚',transport:'海运',gridNo:'G003',sealWeight:'25KG',sortCode:'SC-0003'},
        {country:'尼日利亚',transport:'空运',gridNo:'G004',sealWeight:'23KG',sortCode:'SC-0004'}
    ],
    'SP1002':[
        {country:'肯尼亚',transport:'海运',gridNo:'G001',sealWeight:'25KG',sortCode:'SC-0001'}
    ],
    'SP1003':[
        {country:'尼日利亚',transport:'空运',gridNo:'G001',sealWeight:'15KG',sortCode:'SC-0001'}
    ],
    'SP1004':[
        {country:'阿联酋',transport:'海运',gridNo:'G001',sealWeight:'30KG',sortCode:'SC-0001'}
    ],
    'SP1005':[
        {country:'南非',transport:'海运',gridNo:'G001',sealWeight:'22KG',sortCode:'SC-0001'},
        {country:'津巴布韦',transport:'海运',gridNo:'G002',sealWeight:'22KG',sortCode:'SC-0002'}
    ]
};

function expressSortRowHtml(r){
    return '<tr class="express-sort-row border-t border-surface-100 hover:bg-surface-50/40" data-country="'+esc(r.country||'')+'" data-transport="'+esc(r.transport||'')+'">'+
        '<td class="px-3 py-2 text-text-secondary">'+esc(r.country||'')+'</td>'+
        '<td class="px-3 py-2 text-text-secondary">'+esc(r.transport||'')+'</td>'+
        '<td class="px-2 py-1"><input type="text" class="express-sort-grid w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 focus:bg-white" value="'+esc(r.gridNo||'')+'"></td>'+
        '<td class="px-2 py-1"><input type="text" class="express-sort-weight w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 focus:bg-white" value="'+esc(r.sealWeight||'')+'"></td>'+
        '<td class="px-2 py-1"><input type="text" class="express-sort-code w-full h-8 px-2 text-sm border border-surface-200 rounded bg-surface-50 focus:bg-white" value="'+esc(r.sortCode||'')+'"></td>'+
    '</tr>';
}

function loadExpressSortDetails(code){
    if(!code)return [];
    const raw=_expressSortDetails[code];
    if(!raw||!raw.length)return [];
    return raw.map(function(r){return Object.assign({},r);});
}

function saveExpressSortDetails(code){
    if(!code)return;
    const tbody=document.getElementById('express-sort-split-body');
    if(!tbody){_expressSortDetails[code]=[];return;}
    const rows=Array.from(tbody.querySelectorAll('tr.express-sort-row')).map(function(tr){
        const grid=tr.querySelector('.express-sort-grid');
        const weight=tr.querySelector('.express-sort-weight');
        const code2=tr.querySelector('.express-sort-code');
        return {
            country:tr.getAttribute('data-country')||'',
            transport:tr.getAttribute('data-transport')||'',
            gridNo:grid?grid.value:'',
            sealWeight:weight?weight.value:'',
            sortCode:code2?code2.value:''
        };
    });
    _expressSortDetails[code]=rows;
}

function submitExpressSortModal(code,mode){
    if(code)saveExpressSortDetails(code);
    closeCrudModal();
    showToast(mode==='add'?tr('新增成功'):tr('保存成功'));
}

function rebuildExpressSortDetail(){
    const tbody=document.getElementById('express-sort-split-body');
    if(!tbody)return;
    const countries=collectExpressSortChecked('express-sort-country-cb');
    const transports=collectExpressSortChecked('express-sort-transport-cb');
    /* 收集当前已编辑值（保留 gridNo/sealWeight/sortCode） */
    const existingMap={};
    tbody.querySelectorAll('tr.express-sort-row').forEach(function(tr){
        const key=(tr.getAttribute('data-country')||'')+'|'+(tr.getAttribute('data-transport')||'');
        const grid=tr.querySelector('.express-sort-grid');
        const weight=tr.querySelector('.express-sort-weight');
        const code=tr.querySelector('.express-sort-code');
        existingMap[key]={
            gridNo:grid?grid.value:'',
            sealWeight:weight?weight.value:'',
            sortCode:code?code.value:''
        };
    });
    /* 若 tbody 为空（初次打开），从 store 加载已保存明细作为 existingMap */
    const schemeCode=tbody.getAttribute('data-scheme-code')||'';
    if(!Object.keys(existingMap).length&&schemeCode){
        (_expressSortDetails[schemeCode]||[]).forEach(function(r){
            existingMap[(r.country||'')+'|'+(r.transport||'')]={
                gridNo:r.gridNo,sealWeight:r.sealWeight,sortCode:r.sortCode
            };
        });
    }
    if(!countries.length||!transports.length){
        tbody.innerHTML='<tr class="express-sort-placeholder"><td colspan="5" class="px-3 py-6 text-center text-text-muted">'+tr('请先选择国家和运输方式，托盘明细将根据笛卡尔组合自动生成')+'</td></tr>';
        return;
    }
    const rows=[];
    let seq=1;
    countries.forEach(function(c){
        transports.forEach(function(t){
            const key=c+'|'+t;
            const existing=existingMap[key];
            rows.push({
                country:c,
                transport:t,
                gridNo:existing&&existing.gridNo?existing.gridNo:('G'+String(seq).padStart(3,'0')),
                sealWeight:existing&&existing.sealWeight?existing.sealWeight:((15+(seq-1)*5)+'KG'),
                sortCode:existing&&existing.sortCode?existing.sortCode:('SC-'+String(seq).padStart(4,'0'))
            });
            seq++;
        });
    });
    tbody.innerHTML=rows.map(expressSortRowHtml).join('');
}

function openExpressSortModal(mode,id,rowIdx,rowData){
    const c=TC[id];
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const modeLabel=mode==='add'?L.add:mode==='copy'?tr('复制新增'):L.edit;
    titleEl.textContent=modeLabel+tr(c.t);
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='76%';
    const editCode=rowData?rowData[0]:'';
    const editName=rowData?rowData[1]:'';
    const editCountryStr=rowData?rowData[2]:'';
    const editTransportStr=rowData?rowData[3]:'';
    const editCountries=String(editCountryStr||'').split(/[、,，]/).map(function(s){return s.trim();}).filter(Boolean);
    const editTransports=String(editTransportStr||'').split(/[、,，]/).map(function(s){return s.trim();}).filter(Boolean);
    const data=_listData[id]||expandData(id);
    const lastCode=(data[data.length-1]&&data[data.length-1][0])||'SP1000';
    const lm=String(lastCode).match(/^(.*?)(\d+)$/);
    const autoCode=lm?lm[1]+String(parseInt(lm[2],10)+1).padStart(lm[2].length,'0'):'SP1001';
    const codeVal=mode==='add'?autoCode:mode==='copy'?'':editCode;
    const COUNTRY_OPTS=['塞内加尔','尼日利亚','科特迪瓦','喀麦隆','多哥','加纳','利比里亚','几内亚','冈比亚','安哥拉','刚果金','刚果布','加蓬','赤道几内亚','肯尼亚','南非','津巴布韦','阿联酋'];
    const TRANSPORT_OPTS=['海运','空运'];
    let html='<div class="space-y-5">';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('基础信息')+'</div>';
    html+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('方案编号')+'</label>';
    html+=(mode==='edit'
        ?'<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(codeVal)+'" readonly>'
        :'<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(codeVal)+'" placeholder="'+esc(tr('自动生成'))+'">');
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('方案名称')+'</label>';
    html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(editName)+'" placeholder="'+esc(tr('请输入方案名称'))+'" required>';
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('国家')+' <span class="text-xs text-text-muted ml-1">'+tr('可多选')+'</span></label>';
    html+=expressSortMultiCheckboxHtml('express-sort-country-cb',COUNTRY_OPTS,editCountries);
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5 md:col-span-2"><label class="text-sm font-medium text-text-secondary"><span class="text-red-500 mr-0.5">*</span>'+tr('运输方式')+' <span class="text-xs text-text-muted ml-1">'+tr('可多选')+'</span></label>';
    html+=expressSortMultiCheckboxHtml('express-sort-transport-cb',TRANSPORT_OPTS,editTransports);
    html+='</div>';
    html+='</div></div>';
    html+='<div class="border border-surface-200 rounded-xl overflow-hidden">';
    html+='<div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex flex-wrap items-center gap-4">';
    html+='<div class="text-sm font-semibold text-text-primary">'+tr('托盘明细')+'</div>';
    html+='<div class="text-xs text-text-muted">'+tr('根据上方选择的国家 × 运输方式笛卡尔组合自动生成')+'</div>';
    html+='</div>';
    const existingDetails=mode==='add'?[]:loadExpressSortDetails(codeVal);
    const detailBody=existingDetails.length
        ?existingDetails.map(expressSortRowHtml).join('')
        :'<tr class="express-sort-placeholder"><td colspan="5" class="px-3 py-6 text-center text-text-muted">'+tr('请先选择国家和运输方式，托盘明细将根据笛卡尔组合自动生成')+'</td></tr>';
    html+='<div class="p-4"><div class="overflow-x-auto"><table class="w-full text-sm border border-surface-200 rounded"><thead><tr class="bg-surface-50 text-text-secondary"><th class="px-3 py-2 text-left border-b border-surface-200">'+tr('国家')+'</th><th class="px-3 py-2 text-left border-b border-surface-200">'+tr('运输方式')+'</th><th class="px-3 py-2 text-left border-b border-surface-200">'+tr('格口号')+'</th><th class="px-3 py-2 text-left border-b border-surface-200">'+tr('封板重量')+'</th><th class="px-3 py-2 text-left border-b border-surface-200">'+tr('分拣码')+'</th></tr></thead><tbody id="express-sort-split-body" data-scheme-code="'+esc(codeVal)+'">'+detailBody+'</tbody></table></div>';
    html+='<div class="mt-2 text-xs text-text-muted">'+tr('明细随方案保存 · 修改国家或运输方式勾选将自动同步表格 · 「格口号」「封板重量」「分拣码」可直接编辑，已存在组合的编辑值会保留')+'</div>';
    html+='</div></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="submitExpressSortModal(\''+esc(codeVal)+'\',\''+mode+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提交')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
    setTimeout(function(){applyRuntimeEnhancements(bodyEl);},0);
}

