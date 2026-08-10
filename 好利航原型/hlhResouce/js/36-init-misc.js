function getInitialTabFromUrl(){
    try{
        const params=new URLSearchParams(window.location.search||'');
        const tab=params.get('tab')||params.get('menu')||params.get('page')||'';
        if(tab&&TC[tab])return tab;
        if(params.get('v')==='20260606')return 'wh-no-pre-in';
    }catch(e){}
    return '';
}

function openInitialTabFromUrl(){
    const initialTab=getInitialTabFromUrl();
    if(!initialTab)return;
    const loginPage=document.getElementById('login-page');
    const mainApp=document.getElementById('main-app');
    if(loginPage){
        loginPage.style.display='none';
        loginPage.classList.add('out');
    }
    if(mainApp){
        mainApp.classList.remove('hidden');
        mainApp.style.display='flex';
    }
    initApp();
}

function initApp(){
    var savedLang=localStorage.getItem('lang');
    if(savedLang&&_lang[savedLang])_currentLang=savedLang;
    const L=_lang[_currentLang];
    updateDocumentLangMeta();
    document.body.dataset.terminal=_currentTerminal; // CSS / 调试用：当前端
    renderMenu();
    updateUserInfo();
    updateSettingsLang();
    updateLangOptions();
    updateLoginPageLang();
    setupHeadlessClaimMenuGuard();
    setupRuntimeEnhancements();

    // 端定制：各端默认进入不同首屏
    if(_currentTerminal==='pda'){
        // PDA 端：直达 360px 工作台，无 tab 切换栏概念
        _openTabs=[{id:'pda-app',title:'PDA 工作台',type:'list',langKey:''}];
        _activeTab='pda-app';
        renderTabs();
        document.getElementById('main-content').innerHTML=generateWarehousePdaPage('pda-app');
        applyRuntimeEnhancements(document);
        return;
    }
    if(_currentTerminal==='oms'){
        // OMS 端：默认进入「我的运单」，并展开唯一的「客户中心」L1
        applyRuntimeEnhancements(document);
        setTimeout(function(){
            var l1=document.querySelector('#sidebar-nav .menu-l1');
            if(l1 && !l1.classList.contains('expanded'))toggleL1(l1);
            navigateToTab('','wb-client-manage');
        },0);
        return;
    }
    // TMS 端：保持原 dashboard 默认
    const firstDirect=document.querySelector('.menu-l1-direct');
    if(firstDirect)firstDirect.classList.add('active');
    _openTabs=[{id:'workspace',title:L.workspace,type:'dashboard',langKey:'workspace'}];
    _activeTab='workspace';
    renderTabs();
    document.getElementById('main-content').innerHTML=dashboardHTML;
    applyRuntimeEnhancements(document);
    const initialTab=getInitialTabFromUrl();
    if(initialTab&&initialTab!=='workspace'){
        setTimeout(function(){
            if(initialTab==='wh-no-pre-in')openHeadlessClaimMenu(null,null);
            else navigateToTab('',initialTab);
        },0);
    }
}

function toggleAllExportFields(btn,checked){
    const container=btn.closest('.mb-4');
    container.querySelectorAll('.export-field-check').forEach(function(cb){cb.checked=checked;});
}

function exportData(id){
    openActionModal('export',id,-1);
}

function getSelectedRowIndices(){
    const indices=[];
    document.querySelectorAll('.row-check:checked').forEach(function(cb){indices.push(parseInt(cb.value,10));});
    return indices;
}

function toggleEnableDisable(id){
    const indices=getSelectedRowIndices();
    if(indices.length===0){showToast(tr('请先勾选数据'));return;}
    const c=TC[id];
    const si=(c.h||[]).findIndex(h=>h.includes('状态')||h.includes('启用'));
    if(si<0){showToast(tr('未找到状态列'));return;}
    /* 关闭态取本表状态词表中的非“启用”值（停用/禁用），避免写入表外状态导致状态页签筛不到 */
    const offLabel=((c.s||[]).filter(function(s){return s==='停用'||s==='禁用';})[0])||'禁用';
    const data=_listData[id]||[];
    let toOff=0,toOn=0;
    indices.forEach(function(idx){
        const row=data[idx];
        if(!row)return;
        if(row[si]==='启用')toOff++;else toOn++;
    });
    let msg='本次共选择 '+indices.length+' 条数据：';
    const parts=[];
    if(toOn)parts.push('启用 '+toOn+' 条');
    if(toOff)parts.push(offLabel+' '+toOff+' 条');
    msg+=parts.join('，')+'，确认继续？';
    openConfirmTip(msg,function(){
        indices.forEach(function(idx){
            if(_listData[id]&&_listData[id][idx]){
                const current=_listData[id][idx][si];
                _listData[id][idx][si]=(current==='启用'?offLabel:'启用');
            }
        });
        document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal);
        showToast(tr('状态已更新'));
    });
}

