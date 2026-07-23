(function(){
    var savedLang=localStorage.getItem('lang');
    if(savedLang&&_lang[savedLang])_currentLang=savedLang;
    updateDocumentLangMeta();
    updateLoginPageLang();
    setupRuntimeEnhancements();
    setTimeout(openInitialTabFromUrl,0);
})();

function toggleAllPermFields(btn,checked){
    const container=btn.closest('.mb-4');
    container.querySelectorAll('.perm-field-check').forEach(function(cb){cb.checked=checked;});
}

function toggleCargoDetail(el){
    const content=el.nextElementSibling;
    const arrow=el.querySelector('.cargo-detail-arrow');
    if(content.classList.contains('hidden')){
        content.classList.remove('hidden');
        arrow.style.transform='rotate(180deg)';
    }else{
        content.classList.add('hidden');
        arrow.style.transform='rotate(0deg)';
    }
}

function triggerFileUpload(prefix){
    const input=document.getElementById(prefix+'-file-input');
    if(input)input.click();
}
function handleFileUpload(input,listId,mode){
    const list=document.getElementById(listId);
    if(!list||!input.files)return;
    Array.from(input.files).forEach(function(file){
        const sizeStr=file.size<1024?file.size+'B':file.size<1048576?(file.size/1024).toFixed(1)+'KB':(file.size/1048576).toFixed(1)+'MB';
        const ext=file.name.split('.').pop().toLowerCase();
        const iconColor=ext==='pdf'?'text-red-500':['jpg','jpeg','png','gif','bmp','webp'].includes(ext)?'text-green-500':['doc','docx'].includes(ext)?'text-blue-500':['xls','xlsx'].includes(ext)?'text-emerald-500':'text-primary-500';
        var _dlBtn=mode!=='add'?'<a class="text-primary-600 hover:text-primary-700 cursor-pointer text-xs font-medium" onclick="showToast(\''+tr('开始下载')+': '+esc(file.name)+'\')">'+tr('下载')+'</a>':'';
        var _delBtn=mode!=='view'?'<button type="button" onclick="this.closest(\'.attachment-item\').remove()" class="text-red-500 hover:text-red-600 cursor-pointer text-xs font-medium">'+tr('删除')+'</button>':'';
        const item=document.createElement('div');
        item.className='attachment-item flex items-center justify-between p-2.5 bg-surface-50 rounded-lg border border-surface-200';
        item.innerHTML='<div class="flex items-center gap-2 flex-1 min-w-0"><svg class="w-4 h-4 '+iconColor+' flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div class="min-w-0"><div class="text-sm text-text-primary truncate">'+esc(file.name)+'</div><div class="text-xs text-text-muted">'+sizeStr+'</div></div></div><div class="flex items-center gap-3 flex-shrink-0">'+_dlBtn+_delBtn+'</div>';
        list.appendChild(item);
    });
    input.value='';
}

function openMultiSelectQuery(el,id,qi){
    const c=TC[id];
    const q=c.q[qi];
    const opts=q.options||[];
    let html='<div class="space-y-3">';
    html+='<div class="flex items-center gap-2"><button type="button" onclick="toggleAllMultiSelect(this,true)" class="h-7 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50 cursor-pointer">'+tr('全选')+'</button><button type="button" onclick="toggleAllMultiSelect(this,false)" class="h-7 px-3 text-xs font-medium text-text-secondary border border-surface-200 rounded hover:bg-surface-50 cursor-pointer">'+tr('取消全选')+'</button><span class="text-xs text-text-muted ml-auto">'+tr('已选')+' <span id="ms-selected-count">0</span>/'+opts.length+'</span></div>';
    html+='<input type="text" class="w-full h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" placeholder="'+tr('搜索')+'..." oninput="filterMultiSelectOptions(this)">';
    html+='<div class="max-h-72 overflow-y-auto border border-surface-200 rounded-lg p-2 space-y-1">';
    opts.forEach(function(opt,i){
        html+='<label class="flex items-center gap-2 text-sm text-text-primary cursor-pointer p-1.5 hover:bg-surface-50 rounded ms-opt-label" data-opt="'+esc(opt.toLowerCase())+'"><input type="checkbox" class="multi-select-query-check" value="'+esc(opt)+'" onchange="updateMsCount(this)">'+esc(tr(opt))+'</label>';
    });
    html+='</div></div>';
    document.getElementById('crud-modal-title').textContent=tr(q.label);
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="applyMultiSelectQuery(this,'+qi+',\''+id+'\')" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">'+tr('确认')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function toggleAllMultiSelect(btn,checked){
    const container=btn.closest('.space-y-3');
    container.querySelectorAll('.multi-select-query-check').forEach(function(cb){cb.checked=checked;});
    updateMsCount(btn);
}
function filterMultiSelectOptions(input){
    const keyword=input.value.toLowerCase();
    const container=input.closest('.space-y-3');
    container.querySelectorAll('.ms-opt-label').forEach(function(label){
        const opt=label.dataset.opt||'';
        label.style.display=opt.indexOf(keyword)>=0?'':'none';
    });
}
function updateMsCount(el){
    const container=el.closest('.space-y-3');
    const countEl=document.getElementById('ms-selected-count');
    if(countEl&&container){
        const checked=container.querySelectorAll('.multi-select-query-check:checked').length;
        countEl.textContent=checked;
    }
}
function applyMultiSelectQuery(btn,qi,id){
    const checks=btn.closest('#crud-modal-body').querySelectorAll('.multi-select-query-check:checked');
    const selected=Array.from(checks).map(function(cb){return cb.value;});
    _queryState[id]=_queryState[id]||[];
    _queryState[id][qi]=selected.join(',');
    closeCrudModal();
    runListSearch(id);
}

// 登录页 3-端选择器初始化：恢复上次选择，默认 TMS
(function(){
    try{
        var saved=localStorage.getItem('terminal');
        if(saved!=='oms'&&saved!=='tms'&&saved!=='pda')saved='tms';
        selectTerminal(saved);
    }catch(e){}
})();
