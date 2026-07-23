function openWaybillBusinessConfirmModal(id){
    const indices=getSelectedRowIndices();
    if(!indices.length){showToast(tr('请先勾选运单'));return;}
    const rows=getRowsByIndices(id,indices);
    const headers=(TC[id]&&TC[id].h)||[];
    const idxWb=headers.indexOf('运单号');
    const idxCust=headers.indexOf('客户名称');
    const idxQty=headers.indexOf('件数');
    const idxWeight=headers.indexOf('重量(KG)');
    const idxVol=headers.indexOf('体积(CBM)');
    let totalQty=0,totalWeight=0,totalVol=0;
    const tbody=rows.map(function(row){
        const qty=parseFloat(row[idxQty])||0;
        const w=parseFloat(row[idxWeight])||0;
        const v=parseFloat(row[idxVol])||0;
        totalQty+=qty;totalWeight+=w;totalVol+=v;
        return '<tr class="border-t border-surface-100">'+
            '<td class="px-3 py-2 font-medium text-primary-700 whitespace-nowrap">'+esc(row[idxWb]||'')+'</td>'+
            '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(row[idxCust]||'')+'</td>'+
            '<td class="px-3 py-2 text-right text-text-secondary">'+esc(String(row[idxQty]||''))+'</td>'+
            '<td class="px-3 py-2 text-right text-text-secondary">'+esc(String(row[idxWeight]||''))+'</td>'+
            '<td class="px-3 py-2 text-right text-text-secondary">'+esc(String(row[idxVol]||''))+'</td>'+
        '</tr>';
    }).join('');
    let h='<div class="text-xs text-text-muted mb-3">'+tr('请核对以下运单的件数、重量、体积是否准确，确认后将进入下一环节。')+'</div>';
    h+='<div class="rounded-lg border border-surface-200 overflow-hidden bg-white"><table class="w-full text-sm"><thead class="bg-surface-50 text-text-secondary"><tr>';
    ['运单号','客户名称','件数','重量(KG)','体积(CBM)'].forEach(function(hd){
        const align=['件数','重量(KG)','体积(CBM)'].indexOf(hd)>=0?'text-right':'text-left';
        h+='<th class="px-3 py-2 '+align+' whitespace-nowrap text-xs font-semibold">'+tr(hd)+'</th>';
    });
    h+='</tr></thead><tbody>'+tbody+'</tbody>';
    h+='<tfoot class="bg-primary-50/60 text-primary-700"><tr>';
    h+='<td class="px-3 py-2 font-semibold" colspan="2">'+tr('合计')+'（'+rows.length+' '+tr('票')+'）</td>';
    h+='<td class="px-3 py-2 text-right font-semibold">'+totalQty+'</td>';
    h+='<td class="px-3 py-2 text-right font-semibold">'+totalWeight.toFixed(2)+'</td>';
    h+='<td class="px-3 py-2 text-right font-semibold">'+totalVol.toFixed(3)+'</td>';
    h+='</tr></tfoot></table></div>';
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('业务确认')+' - '+tr((TC[id]&&TC[id].t)||'运单管理');
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('已确认')+' '+rows.length+' '+tr('条运单')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认无误')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* ============= 客服 · 问题件跟踪 Modal ============= */

/* 时间轴组件 */
function csIssueTimelineHtml(records,headerInfo){
    let h='<div class="rounded-xl border border-surface-200 bg-surface-50/40 p-4">';
    if(headerInfo){
        h+='<div class="grid grid-cols-4 gap-3 pb-3 mb-3 border-b border-surface-200 text-xs">';
        headerInfo.forEach(function(p){h+='<div><span class="text-text-muted">'+esc(p[0])+'</span><div class="mt-0.5 font-semibold text-text-primary">'+esc(p[1]||'-')+'</div></div>';});
        h+='</div>';
    }
    if(!records||!records.length){
        h+='<div class="text-center text-text-muted text-xs py-6">'+tr('暂无问题记录')+'</div>';
    }else{
        h+='<div class="relative pl-5">';
        h+='<div class="absolute left-[7px] top-1 bottom-1 w-px bg-surface-300"></div>';
        records.forEach(function(rec,idx){
            const active=idx===0;
            const dot=active?'bg-primary-600 ring-4 ring-primary-100':'bg-surface-400';
            h+='<div class="relative pb-4 last:pb-0">';
            h+='<div class="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full '+dot+'"></div>';
            h+='<div class="text-xs text-text-primary font-medium">'+esc(rec.time||'')+'<span class="ml-3 text-primary-700">'+esc(rec.type||'')+'</span></div>';
            if(rec.content)h+='<div class="text-xs text-text-secondary mt-1">'+esc(rec.content)+'</div>';
            h+='</div>';
        });
        h+='</div>';
    }
    h+='</div>';
    return h;
}

/* 多文件拖拽上传组件 */
function csMultiFileUploaderHtml(){
    const inputId='cs-return-files-'+Math.floor(Math.random()*1e6);
    let h='<div class="rounded-xl border-2 border-dashed border-surface-300 bg-surface-50/60 p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors" onclick="document.getElementById(\''+inputId+'\').click()">';
    h+='<svg class="w-10 h-10 mx-auto text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>';
    h+='<div class="text-sm text-text-secondary">'+tr('将文件拖到此处，或')+' <span class="text-primary-600">'+tr('点击上传')+'</span></div>';
    h+='<input id="'+inputId+'" type="file" multiple class="hidden" onchange="document.getElementById(\''+inputId+'-list\').textContent=Array.from(this.files).map(f=>f.name).join(\', \')">';
    h+='<div id="'+inputId+'-list" class="mt-2 text-xs text-text-secondary"></div>';
    h+='</div>';
    h+='<div class="mt-2 text-xs text-text-muted">'+tr('请上传 大小不超过')+' <span class="text-red-500 font-medium">5MB</span> '+tr('格式为')+' <span class="text-red-500 font-medium">frx/FRX/doc/DOC/docx/DOCX/xls/XLS/xlsx/XLSX/ppt/PPT/pptx/PPTX/txt/TXT/pdf/PDF/zip/ZIP/rar/RAR/jpg/JPG/jpeg/JPEG/png/PNG/gif/GIF/bmp/BMP</span> '+tr('的文件 最多上传')+' <span class="text-red-500 font-medium">5</span> '+tr('个附件')+'</div>';
    return h;
}

/* 必填校验失焦 hint */
function csValidateRequired(fieldId,msg){
    const el=document.getElementById(fieldId);
    const errEl=document.getElementById('err-'+fieldId);
    if(!el||!errEl)return true;
    const empty=!el.value||!el.value.trim();
    if(empty){
        el.classList.add('border-red-400');el.classList.remove('border-surface-200');
        errEl.textContent=msg||tr('该项不能为空');
        errEl.classList.remove('hidden');
        return false;
    }
    el.classList.remove('border-red-400');el.classList.add('border-surface-200');
    errEl.classList.add('hidden');
    return true;
}

/* 单行获取 */
function _csRowOf(id,index){
    const row=(TC[id]&&TC[id].d[index])||[];
    const headers=(TC[id]&&TC[id].h)||[];
    const get=function(name){const i=headers.indexOf(name);return i>=0?(row[i]||''):'';};
    return {row:row,get:get};
}

/* 新增数据 Modal */
function openCsIssueAddModal(id){
    const wbOptions=['WB-20260613001','WB-20260613002','WB-20260613003','WB-20260612001','WB-20260612002','ICBU00000600587','ICBU00000600522','ICBU00000600457'];
    const typeOptions=['运单拦截','问题件-超大','问题件-超长','问题件-超围长','问题件-超重','退件/少件扣件','查验扣件','签收地址错','未提取','客户要求暂扣'];
    let h='<div class="space-y-5">';
    h+='<div><div class="text-sm font-semibold text-text-primary mb-3 pl-2 border-l-3 border-primary-500">'+tr('基本信息')+'</div>';
    h+='<div class="grid grid-cols-1 gap-4">';
    h+='<div><label class="block text-xs text-text-secondary mb-1"><span class="text-red-500">*</span>'+tr('运单号')+'</label>';
    h+='<select id="cs-add-wb" class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white"><option value="">'+tr('请选择运单号')+'</option>';
    wbOptions.forEach(function(o){h+='<option>'+esc(o)+'</option>';});
    h+='</select></div>';
    h+='<div><label class="block text-xs text-text-secondary mb-1"><span class="text-red-500">*</span>'+tr('问题处理类型')+'</label>';
    h+='<select id="cs-add-type" class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white"><option value="">'+tr('请选择问题处理类型')+'</option>';
    typeOptions.forEach(function(o){h+='<option>'+esc(o)+'</option>';});
    h+='</select></div>';
    h+='<div><label class="block text-xs text-text-secondary mb-1"><span class="text-red-500">*</span>'+tr('问题备注')+'</label>';
    h+='<textarea id="cs-add-remark" rows="4" class="w-full p-2 text-sm border border-surface-200 rounded bg-white"></textarea></div>';
    h+='</div></div></div>';
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='50%';
    document.getElementById('crud-modal-title').textContent=tr('新增数据');
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>'+
        '<button onclick="closeCrudModal();showToast(\''+tr('已新增问题件')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确定')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* 反馈/放行 Modal （4 种模式合一） */
function openCsIssueFeedbackModal(id,mode){
    const indices=getSelectedRowIndices();
    if(!indices.length){showToast(tr('请先勾选问题件'));return;}
    const i0=indices[0];
    const info=_csRowOf(id,i0);
    const wbNo=info.get('运单号');
    const headerInfo=[[tr('运单号'),wbNo],[tr('问题类型'),info.get('问题类型名称')],[tr('客户名称'),info.get('客户名称')],[tr('销售产品'),info.get('销售产品')]];
    const records=csIssueRecordsOf(wbNo,info.get('问题类型名称'),info.get('最新响应时间'),info.get('最新响应内容'));
    const titleMap={'cs-reply':'问题件客服反馈','cust-on-behalf':'问题件代客户反馈','cust-reply':'问题件客户反馈','release':'问题件放行'};
    const title=titleMap[mode]||'问题件反馈';
    let h='<div class="space-y-5">';
    h+='<div><div class="text-sm font-semibold text-text-primary mb-3 pl-2 border-l-3 border-primary-500">'+tr('问题记录')+'</div>';
    h+=csIssueTimelineHtml(records,headerInfo);
    h+='</div>';
    h+='<div><div class="text-sm font-semibold text-text-primary mb-3 pl-2 border-l-3 border-primary-500">'+tr('基本信息')+'</div>';
    h+='<div><label class="block text-xs text-text-secondary mb-1"><span class="text-red-500">*</span>'+tr('回复内容')+'</label>';
    h+='<textarea id="cs-feedback-reply" rows="4" class="w-full p-2 text-sm border border-surface-200 rounded bg-white"></textarea>';
    h+='<div id="err-cs-feedback-reply" class="hidden text-xs text-red-500 mt-1">'+tr('该项不能为空')+'</div></div>';
    h+='</div></div>';
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr(title);
    document.getElementById('crud-modal-body').innerHTML=h;
    const okToast=(mode==='release')?tr('已放行所选问题件'):tr('反馈已提交');
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>'+
        '<button onclick="if(csValidateRequired(\'cs-feedback-reply\')){closeCrudModal();showToast(\''+okToast+'\');}" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确定')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* 退件 Modal */
var _csReturnRows=[];
function csReturnFeeRowHtml(rowIdx,row){
    const curOpts=['CNY','USD','EUR','GBP'];
    const feeTypeOpts=['退件费','补偿费','清关罚款','滞港费','其他'];
    let h='<tr class="border-t border-surface-100">';
    h+='<td class="px-2 py-2"><select onchange="_csReturnRows['+rowIdx+'].cur=this.value" class="w-full h-8 px-2 text-xs border border-surface-200 rounded bg-white">';
    curOpts.forEach(function(o){h+='<option '+(row.cur===o?'selected':'')+'>'+o+'</option>';});h+='</select></td>';
    h+='<td class="px-2 py-2"><input value="'+esc(row.rate||'')+'" onchange="_csReturnRows['+rowIdx+'].rate=this.value" class="w-full h-8 px-2 text-xs border border-surface-200 rounded"></td>';
    h+='<td class="px-2 py-2"><input value="'+esc(row.amount||'')+'" onchange="_csReturnRows['+rowIdx+'].amount=this.value" class="w-full h-8 px-2 text-xs border border-surface-200 rounded text-right"></td>';
    h+='<td class="px-2 py-2"><select onchange="_csReturnRows['+rowIdx+'].feeType=this.value" class="w-full h-8 px-2 text-xs border border-surface-200 rounded bg-white">';
    feeTypeOpts.forEach(function(o){h+='<option '+(row.feeType===o?'selected':'')+'>'+o+'</option>';});h+='</select></td>';
    h+='<td class="px-2 py-2"><input value="'+esc(row.reason||'')+'" onchange="_csReturnRows['+rowIdx+'].reason=this.value" class="w-full h-8 px-2 text-xs border border-surface-200 rounded"></td>';
    h+='<td class="px-2 py-2 text-center"><button type="button" onclick="csReturnDelRow('+rowIdx+')" class="text-red-500 hover:text-red-600 text-xs cursor-pointer">'+tr('删除')+'</button></td>';
    h+='</tr>';
    return h;
}
function csReturnAddRow(){
    _csReturnRows.push({cur:'CNY',rate:'1.0000',amount:'',feeType:'退件费',reason:''});
    csReturnRefreshRows();
}
function csReturnDelRow(i){
    _csReturnRows.splice(i,1);
    csReturnRefreshRows();
}
function csReturnRefreshRows(){
    const tbody=document.getElementById('cs-return-fee-tbody');
    if(!tbody)return;
    tbody.innerHTML=_csReturnRows.length?_csReturnRows.map(csReturnFeeRowHtml).join(''):'<tr><td colspan="6" class="px-3 py-6 text-center text-text-muted text-xs">'+tr('暂无数据')+'</td></tr>';
}
function openCsIssueReturnModal(id){
    const indices=getSelectedRowIndices();
    if(!indices.length){showToast(tr('请先勾选问题件'));return;}
    _csReturnRows=[];
    const methodOpts=['直接退件','销毁','转寄'];
    let h='<div class="space-y-5">';
    h+='<div><div class="text-sm font-semibold text-text-primary mb-3 pl-2 border-l-3 border-primary-500">'+tr('基本信息')+'</div>';
    h+='<div class="grid grid-cols-1 gap-4">';
    h+='<div><label class="block text-xs text-text-secondary mb-1"><span class="text-red-500">*</span>'+tr('处理方式')+'</label>';
    h+='<select id="cs-return-method" class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white"><option value="">'+tr('请选择处理方式')+'</option>';
    methodOpts.forEach(function(o){h+='<option>'+esc(o)+'</option>';});h+='</select>';
    h+='<div id="err-cs-return-method" class="hidden text-xs text-red-500 mt-1">'+tr('该项不能为空')+'</div></div>';
    h+='<div><label class="block text-xs text-text-secondary mb-1"><span class="text-red-500">*</span>'+tr('退件原因')+'</label>';
    h+='<textarea id="cs-return-reason" rows="3" class="w-full p-2 text-sm border border-red-400 rounded bg-white"></textarea>';
    h+='<div id="err-cs-return-reason" class="text-xs text-red-500 mt-1">'+tr('该项不能为空')+'</div></div>';
    h+='</div></div>';
    /* 费用列表（只读） */
    h+='<div><div class="rounded-lg border border-surface-200 overflow-hidden bg-white"><div class="overflow-auto"><table class="w-full text-xs"><thead class="bg-surface-50 text-text-secondary"><tr>';
    ['序号','费用名称','金额','币别','汇率','人民币金额','费用时间','核销状态'].forEach(function(hd){h+='<th class="px-3 py-2 text-left whitespace-nowrap font-semibold">'+tr(hd)+'</th>';});
    h+='</tr></thead><tbody><tr><td colspan="8" class="px-3 py-10 text-center text-text-muted">'+tr('暂无数据')+'</td></tr></tbody></table></div></div></div>';
    /* 赔偿费用录入（可加行） */
    h+='<div><div class="rounded-lg border border-surface-200 overflow-hidden bg-white"><div class="overflow-auto"><table class="w-full text-xs"><thead class="bg-surface-50 text-text-secondary"><tr>';
    h+='<th class="px-2 py-2 text-left w-12"><button type="button" onclick="csReturnAddRow()" class="w-7 h-7 rounded bg-primary-600 text-white text-base hover:bg-primary-700 cursor-pointer">+</button></th>';
    ['币别','汇率','金额','费用类型','赔偿原因','操作'].forEach(function(hd){h+='<th class="px-2 py-2 text-left whitespace-nowrap font-semibold">'+tr(hd)+'</th>';});
    h+='</tr></thead><tbody id="cs-return-fee-tbody"><tr><td colspan="7" class="px-3 py-10 text-center text-text-muted">'+tr('暂无数据')+'</td></tr></tbody></table></div></div></div>';
    /* 附件资料 */
    h+='<div><div class="text-sm font-semibold text-text-primary mb-3 pl-2 border-l-3 border-primary-500">'+tr('附件资料')+'</div>';
    h+=csMultiFileUploaderHtml();
    h+='</div></div>';
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    document.getElementById('crud-modal-title').textContent=tr('退单');
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>'+
        '<button onclick="var ok1=csValidateRequired(\'cs-return-method\');var ok2=csValidateRequired(\'cs-return-reason\');if(ok1&&ok2){closeCrudModal();showToast(\''+tr('已提交退件')+'\');}" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确定')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* 撤销放行 confirm */
function openCsIssueRevokeReleaseConfirm(id){
    const indices=getSelectedRowIndices();
    if(!indices.length){showToast(tr('请先勾选问题件'));return;}
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='42%';
    document.getElementById('crud-modal-title').textContent=tr('撤销放行');
    document.getElementById('crud-modal-body').innerHTML='<div class="py-4 text-sm text-text-primary">'+tr('确定撤销放行已选')+' <span class="font-semibold text-primary-700">'+indices.length+'</span> '+tr('条问题件？')+'</div>';
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="closeCrudModal();showToast(\''+tr('已撤销放行')+' '+indices.length+' '+tr('条')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer">'+tr('确定撤销')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* ========== 通用居中提示弹窗 ========== */

var _confirmTipPending=null;
function openConfirmTip(message,onConfirm){
    const body=document.getElementById('confirm-tip-body');
    const ok=document.getElementById('confirm-tip-ok');
    if(!body||!ok)return;
    body.textContent=message||'';
    _confirmTipPending=typeof onConfirm==='function'?onConfirm:null;
    ok.onclick=function(){
        const fn=_confirmTipPending;
        closeConfirmTip();
        if(fn)fn();
    };
    document.getElementById('confirm-tip').classList.add('show');
}
function closeConfirmTip(){
    _confirmTipPending=null;
    const el=document.getElementById('confirm-tip');
    if(el)el.classList.remove('show');
}

/* ========== 标签模板管理 ========== */

var _LABEL_TEMPLATE_FILES={
    'A2606001':[{name:'HYD-customer-shipment.jrxml',type:'标签模板',size:8,uploader:'HYD-开发者',time:'2026-06-02 09:35:30'}],
    'S2602006':[{name:'HYD.jrxml',type:'标签模板',size:6,uploader:'HYD-开发者',time:'2026-04-01 10:29:27'}],
    'S2602005':[{name:'HYD.jrxml',type:'标签模板',size:6,uploader:'HYD-开发者',time:'2026-04-09 17:37:34'}],
    'S2602004':[{name:'HYD.jrxml',type:'标签模板',size:6,uploader:'HYD-开发者',time:'2026-04-01 10:10:03'}]
};

function labelTemplateUploaderHtml(){
    const iid='lbl-tpl-file-'+Math.floor(Math.random()*1e6);
    let h='<div class="rounded-xl border-2 border-dashed border-surface-300 bg-surface-50/60 p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors" onclick="document.getElementById(\''+iid+'\').click()">';
    h+='<svg class="w-12 h-12 mx-auto text-text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>';
    h+='<div class="text-sm text-text-secondary">'+tr('点击或者拖动文件到该区域来上传')+'</div>';
    h+='<input id="'+iid+'" type="file" accept=".jrxml" class="hidden" onchange="document.getElementById(\''+iid+'-tip\').textContent=this.files[0]?this.files[0].name:\'\'">';
    h+='<div id="'+iid+'-tip" class="mt-2 text-xs text-primary-600"></div>';
    h+='</div>';
    h+='<div class="mt-2 text-xs text-text-muted text-center">'+tr('请上传 大小不超过')+' <span class="text-red-500 font-medium">30MB</span> '+tr('格式为')+' <span class="text-red-500 font-medium">jrxml</span> '+tr('的文件 最多上传')+' <span class="text-red-500 font-medium">1</span> '+tr('个附件')+'</div>';
    return h;
}

function labelTemplateFileTableHtml(files,editable){
    let h='<div class="mt-6"><div class="overflow-x-auto rounded-lg border border-surface-200"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>';
    ['序号','文件名称','文件类型','缩略图','文件大小(kb)','上传人','上传时间','操作'].forEach(function(c){
        h+='<th class="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">'+tr(c)+'</th>';
    });
    h+='</tr></thead><tbody>';
    if(!files||!files.length){
        h+='<tr><td colspan="8" class="py-12 text-center text-text-muted"><svg class="w-12 h-12 mx-auto mb-2 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg><div>'+tr('无数据')+'</div></td></tr>';
    } else {
        files.forEach(function(f,i){
            h+='<tr class="border-t border-surface-100"><td class="px-3 py-2">'+(i+1)+'</td>';
            h+='<td class="px-3 py-2">'+esc(f.name)+'</td>';
            h+='<td class="px-3 py-2">'+esc(f.type||'标签模板')+'</td>';
            h+='<td class="px-3 py-2"><span class="inline-block px-2 py-0.5 text-xs text-text-muted bg-surface-100 rounded">'+tr('暂无图片')+'</span></td>';
            h+='<td class="px-3 py-2">'+esc(String(f.size||''))+'</td>';
            h+='<td class="px-3 py-2">'+esc(f.uploader||'')+'</td>';
            h+='<td class="px-3 py-2 whitespace-nowrap">'+esc(f.time||'')+'</td>';
            h+='<td class="px-3 py-2 whitespace-nowrap">';
            h+='<button onclick="showToast(\''+tr('开始下载')+' '+esc(f.name)+'\')" class="px-3 py-1 text-xs font-medium text-white bg-orange-400 hover:bg-orange-500 rounded">'+tr('下载')+'</button>';
            if(editable)h+=' <button onclick="removeLabelTemplateFile(this,'+i+')" class="px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded">'+tr('删除')+'</button>';
            h+='</td></tr>';
        });
    }
    h+='</tbody></table></div></div>';
    return h;
}

function removeLabelTemplateFile(btn,idx){
    const row=btn.closest('tr');
    if(row&&row.parentNode)row.parentNode.removeChild(row);
    showToast(tr('已删除'));
}

function _labelHeaderIdx(name){
    const c=TC['cfg-label-template'];
    return (c.h||[]).indexOf(name);
}

function openLabelTemplateModal(mode,id,index){
    const c=TC[id];if(!c)return;
    const isEdit=mode==='edit'&&index>=0;
    const row=isEdit?(_listData[id]||c.d)[index]:[];
    const get=function(name){
        const i=_labelHeaderIdx(name);
        return (i>=0&&row[i]!==undefined)?row[i]:'';
    };
    const tplNo=get('标签模板编号');
    const files=isEdit?(_LABEL_TEMPLATE_FILES[tplNo]||[]):[];
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='50%';
    document.getElementById('crud-modal-title').textContent=isEdit?tr('修改'):tr('新增');
    let h='<div class="space-y-5">';
    h+='<div><label class="block text-sm text-text-secondary mb-1"><span class="text-red-500">*</span> '+tr('模板编号')+'</label>';
    h+='<input id="lbl-no" type="text" value="'+esc(tplNo)+'"'+(isEdit?' readonly':'')+' class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">';
    h+='<div id="err-lbl-no" class="hidden text-xs text-red-500 mt-1"></div></div>';
    h+='<div><label class="block text-sm text-text-secondary mb-1"><span class="text-red-500">*</span> '+tr('模板名称')+'</label>';
    h+='<input id="lbl-name" type="text" value="'+esc(get('标签模板名称'))+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">';
    h+='<div id="err-lbl-name" class="hidden text-xs text-red-500 mt-1"></div></div>';
    h+='<div><label class="block text-sm text-text-secondary mb-1"><span class="text-red-500">*</span> '+tr('标签模版类型')+'</label>';
    h+='<select id="lbl-type" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['','无单入库标签','客户提单','运单标签'],get('标签模板类型'))+'</select>';
    h+='<div id="err-lbl-type" class="hidden text-xs text-red-500 mt-1"></div></div>';
    h+='<div><label class="block text-sm text-text-secondary mb-1"><span class="text-red-500">*</span> '+tr('启用状态')+'</label>';
    h+='<select id="lbl-status" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['启用','禁用'],get('启用状态')||'启用')+'</select></div>';
    h+='<div><label class="block text-sm text-text-secondary mb-1">'+tr('备注')+'</label>';
    h+='<textarea id="lbl-remark" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50">'+esc(get('备注'))+'</textarea></div>';
    h+='<div><label class="block text-sm text-text-secondary mb-2">'+tr('标签模板')+'</label>'+labelTemplateUploaderHtml()+'</div>';
    h+=labelTemplateFileTableHtml(files,isEdit);
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="confirmLabelTemplate(\''+mode+'\',\''+id+'\','+index+')" class="px-4 py-2 text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 rounded-lg cursor-pointer">'+tr('确认')+'</button>'+
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function confirmLabelTemplate(mode,id,index){
    const ok1=csValidateRequired('lbl-no',tr('该项不能为空'));
    const ok2=csValidateRequired('lbl-name',tr('该项不能为空'));
    const ok3=csValidateRequired('lbl-type',tr('该项不能为空'));
    if(!ok1||!ok2||!ok3)return;
    const c=TC[id];if(!c)return;
    const no=document.getElementById('lbl-no').value.trim();
    const name=document.getElementById('lbl-name').value.trim();
    const type=document.getElementById('lbl-type').value;
    const status=document.getElementById('lbl-status').value;
    const remark=document.getElementById('lbl-remark').value;
    const setCol=function(arr,key,val){const i=_labelHeaderIdx(key);if(i>=0)arr[i]=val;};
    if(!_listData[id])_listData[id]=(c.d||[]).map(function(r){return r.slice();});
    if(mode==='add'){
        const row=new Array(c.h.length).fill('');
        setCol(row,'标签模板编号',no);
        setCol(row,'标签模板名称',name);
        setCol(row,'标签模板类型',type);
        setCol(row,'文件类型','标签模板');
        setCol(row,'下载地址','https://hyd-tms.oss-cn-shenzhen.aliyuncs.com/label/'+no+'.jrxml');
        setCol(row,'所属总部编号','业务中台');
        setCol(row,'启用状态',status);
        setCol(row,'备注',remark);
        setCol(row,'创建时间',(new Date()).toISOString().slice(0,10)+' 10:00:00');
        setCol(row,'创建人','HYD-开发者');
        _listData[id].unshift(row);
        showToast(tr('已新增'));
    } else {
        const row=_listData[id][index];if(!row)return;
        setCol(row,'标签模板名称',name);
        setCol(row,'标签模板类型',type);
        setCol(row,'启用状态',status);
        setCol(row,'备注',remark);
        setCol(row,'更新时间',(new Date()).toISOString().slice(0,10)+' 10:00:00');
        showToast(tr('已保存'));
    }
    closeCrudModal();
    document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal);
}

function openSelectedLabelTemplateEdit(id){
    const indices=getSelectedRowIndices();
    if(indices.length===0){showToast(tr('请先勾选数据'));return;}
    if(indices.length>1){showToast(tr('请仅勾选一行'));return;}
    openLabelTemplateModal('edit',id,indices[0]);
}

function setRowsStatus(id,status){
    const indices=getSelectedRowIndices();
    if(indices.length===0){showToast(tr('请先勾选数据'));return;}
    const c=TC[id];if(!c)return;
    const si=(c.h||[]).findIndex(function(hd){return hd.includes('状态')||hd.includes('启用');});
    if(si<0){showToast(tr('未找到状态列'));return;}
    openConfirmTip(tr('确定')+status+tr('吗?'),function(){
        if(!_listData[id])_listData[id]=(c.d||[]).map(function(r){return r.slice();});
        indices.forEach(function(i){if(_listData[id][i])_listData[id][i][si]=status;});
        document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal);
        showToast(tr('已')+status);
    });
}

function deleteSelectedRows(id){
    const indices=getSelectedRowIndices();
    if(indices.length===0){showToast(tr('请先勾选数据'));return;}
    const c=TC[id];if(!c)return;
    openConfirmTip(tr('确定批量删除吗?'),function(){
        const sorted=indices.slice().sort(function(a,b){return b-a;});
        if(!_listData[id])_listData[id]=(c.d||[]).map(function(r){return r.slice();});
        sorted.forEach(function(i){_listData[id].splice(i,1);});
        document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal);
        showToast(tr('已删除')+' '+indices.length+' '+tr('条'));
    });
}

function openLabelFieldDocModal(){
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('标签字段说明');
    const fields=[
        ['waybillNo','运单号','运单主键编号，长度 ≤ 20'],
        ['logisticsNo','物流单号','客户实际物流单号'],
        ['custCode','客户代码','客户唯一编码'],
        ['custName','客户名称','客户全称或简称'],
        ['salesProduct','销售产品','所属销售产品名称'],
        ['country','目的国家','三字代码或中文名'],
        ['city','目的城市','到货城市'],
        ['pcs','件数','整数 ≥ 1'],
        ['weight','重量(KG)','保留 2 位小数'],
        ['volume','体积(CBM)','保留 4 位小数'],
        ['size','尺寸','长×宽×高，CM'],
        ['warehouseName','所属仓库','入仓仓库名称'],
        ['createTime','创建时间','yyyy-MM-dd HH:mm:ss'],
        ['barcode','条形码','基于运单号生成 Code128'],
        ['qrcode','二维码','基于运单号生成 QR'],
        ['remark','备注','自定义备注内容']
    ];
    let h='<div class="space-y-4">';
    h+='<div class="text-sm text-text-secondary">'+tr('标签模板编辑时可使用以下字段变量，请在 jrxml 中以')+' <code class="px-1 bg-surface-100 text-primary-700 rounded">$F{字段名}</code> '+tr('引用：')+'</div>';
    h+='<div class="overflow-x-auto rounded-lg border border-surface-200"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>';
    ['字段名','中文名称','说明'].forEach(function(c){h+='<th class="px-3 py-2 text-left font-medium text-text-secondary">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody>';
    fields.forEach(function(f){
        h+='<tr class="border-t border-surface-100">';
        h+='<td class="px-3 py-2"><code class="text-primary-700">'+esc(f[0])+'</code></td>';
        h+='<td class="px-3 py-2">'+esc(f[1])+'</td>';
        h+='<td class="px-3 py-2 text-text-secondary">'+esc(f[2])+'</td>';
        h+='</tr>';
    });
    h+='</tbody></table></div></div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 rounded-lg cursor-pointer">'+tr('我知道了')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function downloadLabelTemplateRow(id,index){
    const c=TC[id];if(!c)return;
    const row=(_listData[id]||c.d||[])[index];if(!row)return;
    const noIdx=_labelHeaderIdx('标签模板编号');
    const no=noIdx>=0?row[noIdx]:'';
    showToast(tr('开始下载')+' '+no+'.jrxml');
}

/* ========== 分拣装袋管理 ========== */
