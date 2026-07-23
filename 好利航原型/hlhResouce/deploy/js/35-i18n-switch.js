function findMenuLabel(tabId){
    function search(items){
        for(const item of items){
            if(item.id===tabId)return item.label;
            if(item.children){const r=search(item.children);if(r)return r;}
        }
        return null;
    }
    return search(menuData)||tabId;
}

function switchLang(lang){
    if(!_lang[lang])lang='zh';
    setLanguageOptionActive(lang);
    _currentLang=lang;
    localStorage.setItem('lang',lang);
    const L=_lang[_currentLang];
    updateDocumentLangMeta();
    _openTabs.forEach(tab=>{
        if(tab.langKey)tab.title=langText(tab.langKey,tab.title);
    });
    renderMenu();
    updateUserInfo(); // 初始化账号信息
    const firstDirect=document.querySelector('.menu-l1-direct');
    if(firstDirect)firstDirect.classList.add('active');
    const sidebarUser=document.querySelector('#sidebar .border-t .flex.items-center');
    if(sidebarUser){
        sidebarUser.querySelector('.text-sm.font-medium').textContent=L.admin;
        sidebarUser.querySelector('.text-xs').textContent=L.superAdmin;
    }
    const sidebarAppName=document.getElementById('sidebar-app-name');if(sidebarAppName)sidebarAppName.textContent=L.appName;
    const sidebarAppSubtitle=document.getElementById('sidebar-app-subtitle');if(sidebarAppSubtitle)sidebarAppSubtitle.textContent=L.appSubtitle;
    const searchInput=document.querySelector('header input[placeholder]');
    if(searchInput)searchInput.placeholder=L.searchPlaceholder;
    const orgSwitcher=document.getElementById('org-switcher');
    if(orgSwitcher){
        const orgKeys=['orgHq','orgSN','orgNG','orgGH','orgCI','orgCM'];
        const opts=orgSwitcher.options;
        orgKeys.forEach((k,i)=>{if(opts[i])opts[i].textContent=L[k];});
    }
    const tab=_openTabs.find(t=>t.id===_activeTab);
    if(tab){
        if(tab.type==='dashboard'){
            document.getElementById('main-content').innerHTML=dashboardHTML;
        }else if(tab.type==='list'){
            document.getElementById('main-content').innerHTML=renderTabContent(tab.id);
        }
    }
    updateSettingsLang();
    updateLoginPageLang();
    renderTabs();
    updateLangOptions();
    applyRuntimeEnhancements(document);
}

function selectLanguageOption(lang){
    if(!_lang[lang])return;
    setLanguageOptionActive(lang);
    if(_currentLang===lang)return;
    switchLang(lang);
}

function setLanguageOptionActive(lang){
    const container=document.getElementById('lang-options-container');
    if(!container)return;
    container.querySelectorAll('[data-lang-code]').forEach(function(card){
        const active=card.getAttribute('data-lang-code')===lang;
        card.classList.toggle('border-primary-600',active);
        card.classList.toggle('bg-primary-50',active);
        card.classList.toggle('border-surface-200',!active);
        card.classList.toggle('hover:border-primary-300',!active);
        card.classList.toggle('hover:bg-surface-50',!active);
        const radio=card.querySelector('input[type="radio"]');
        if(radio)radio.checked=active;
        const check=card.querySelector('[data-lang-check]');
        if(check){
            check.innerHTML=active?'<div class="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>':'<div class="w-5 h-5 rounded-full border-2 border-surface-300"></div>';
        }
    });
}

function updateLoginPageLang(){
    const L=_lang[_currentLang];
    const el=document.getElementById('login-welcome');if(el)el.textContent=L.welcome;
    const el2=document.getElementById('login-hint');if(el2)el2.textContent=L.loginHint;
    const el3=document.getElementById('login-tab-account');if(el3)el3.textContent=L.accountLogin;
    const el4=document.getElementById('login-tab-qrcode');if(el4)el4.textContent=L.qrcodeLogin;
    const el5=document.getElementById('login-label-username');if(el5)el5.textContent=L.username;
    const el6=document.getElementById('login-label-password');if(el6)el6.textContent=L.password;
    const el7=document.getElementById('login-remember');if(el7)el7.textContent=L.rememberMe;
    const el8=document.getElementById('login-forget');if(el8)el8.textContent=L.forgetPwd;
    const el9=document.getElementById('login-btn');if(el9)el9.textContent=L.loginBtn;
    const el10=document.getElementById('login-qrcode-hint');if(el10)el10.textContent=L.qrcodeHint;
    const el11=document.getElementById('login-company-name');if(el11)el11.textContent=L.loginCompanyName;
    const el12=document.getElementById('login-slogan');if(el12)el12.textContent=L.loginSlogan;
    const el13=document.getElementById('login-feat-sea');if(el13)el13.textContent=L.loginFeatSea;
    const el14=document.getElementById('login-feat-warehouse');if(el14)el14.textContent=L.loginFeatWarehouse;
    const el15=document.getElementById('login-feat-network');if(el15)el15.textContent=L.loginFeatNetwork;
    const el16=document.getElementById('login-qrcode-steps');if(el16)el16.textContent=L.loginQrcodeSteps;
    const el17=document.getElementById('login-copyright');if(el17)el17.textContent=L.loginCopyright;
    const el18=document.getElementById('login-username');if(el18)el18.placeholder=L.loginPhUsername;
    const el19=document.getElementById('login-password');if(el19)el19.placeholder=L.loginPhPassword;
    const langBtns=document.querySelectorAll('.login-lang-btn');
    langBtns.forEach(btn=>{
        const id=btn.id;
        btn.classList.remove('bg-white/20','text-white','border-white/60');
        btn.classList.add('text-white/70','border-white/30');
        if(id==='login-lang-zh'&&_currentLang==='zh'){btn.classList.add('bg-white/20','text-white','border-white/60');btn.classList.remove('text-white/70','border-white/30');}
        if(id==='login-lang-fr'&&_currentLang==='fr'){btn.classList.add('bg-white/20','text-white','border-white/60');btn.classList.remove('text-white/70','border-white/30');}
        if(id==='login-lang-en'&&_currentLang==='en'){btn.classList.add('bg-white/20','text-white','border-white/60');btn.classList.remove('text-white/70','border-white/30');}
        if(id==='login-lang-pt'&&_currentLang==='pt'){btn.classList.add('bg-white/20','text-white','border-white/60');btn.classList.remove('text-white/70','border-white/30');}
    });
}

function updateSettingsLang(){
    const L=_lang[_currentLang];
    const tabs=document.querySelectorAll('.settings-tab');
    if(tabs[0])tabs[0].textContent=L.changePwd;
    if(tabs[1])tabs[1].textContent=L.resetPwd;
    const title=document.querySelector('#settings-modal h3');
    if(title)title.textContent=L.settings;
    const langTitle=document.querySelector('#language-modal h3');
    if(langTitle)langTitle.textContent=L.langSwitch||L.langSetting;
    const labels=document.querySelectorAll('#settings-change-pwd label');
    if(labels[0])labels[0].textContent=L.currentPwd;
    if(labels[1])labels[1].textContent=L.newPwd;
    if(labels[2])labels[2].textContent=L.confirmPwd;
    const oldInput=document.getElementById('settings-old-pwd');if(oldInput)oldInput.placeholder=tr('请输入当前密码');
    const newInput=document.getElementById('settings-new-pwd');if(newInput)newInput.placeholder=tr('请输入新密码（8-20位，含字母和数字）');
    const confirmInput=document.getElementById('settings-confirm-pwd');if(confirmInput)confirmInput.placeholder=tr('请再次输入新密码');
    const pwdHint=document.querySelector('#settings-change-pwd p.text-xs');if(pwdHint)pwdHint.textContent=tr('密码强度：至少8位，包含字母和数字');
    const resetText=document.querySelectorAll('#settings-reset-pwd p');
    if(resetText[0])resetText[0].textContent=tr('重置密码说明');
    if(resetText[1])resetText[1].textContent=tr('重置后密码将恢复为默认密码，请登录后及时修改。');
    const resetInfo=document.querySelectorAll('#settings-reset-pwd .text-sm.font-semibold,#settings-reset-pwd .text-xs.text-text-muted');
    if(resetInfo[0])resetInfo[0].textContent=tr('当前账号：admin');
    if(resetInfo[1])resetInfo[1].textContent=tr('重置后默认密码：Haolihang@2026');
    const btns1=document.querySelectorAll('#settings-change-pwd button');
    if(btns1[0])btns1[0].textContent=L.cancel;
    if(btns1[1])btns1[1].textContent=L.confirmChange;
    const btns2=document.querySelectorAll('#settings-reset-pwd button');
    if(btns2[0])btns2[0].textContent=L.cancel;
    if(btns2[1])btns2[1].textContent=L.confirmReset;
    const userDropdown=document.getElementById('user-dropdown');
    if(userDropdown){
        const ddItems=userDropdown.querySelectorAll('.flex.items-center');
        const settingText=ddItems[0]&&ddItems[0].querySelector('span:last-child');
        const langTextEl=ddItems[1]&&ddItems[1].querySelector('span:last-child');
        const logoutText=ddItems[2]&&ddItems[2].querySelector('span:last-child');
        if(settingText)settingText.textContent=L.settings;
        if(langTextEl)langTextEl.textContent=L.langSwitch||L.langSetting;
        if(logoutText)logoutText.textContent=L.logout;
    }
    const filterSearch=document.getElementById('filter-search');if(filterSearch)filterSearch.placeholder=L.search+'...';
    const filterResetBtn=document.getElementById('filter-reset-btn');if(filterResetBtn)filterResetBtn.textContent=L.reset;
    const filterApplyBtn=document.getElementById('filter-apply-btn');if(filterApplyBtn)filterApplyBtn.textContent=_currentLang==='zh'?'确定':_currentLang==='fr'?'OK':'OK';
}

function updateLangOptions(){
    var container=document.getElementById('lang-options-container');
    if(!container)return;
    var langs=[
        {code:'zh',flag:'🇨🇳',name:tr('中文（简体）'),sub:tr('中文简体')},
        {code:'fr',flag:'🇫🇷',name:'Français',sub:tr('法文')},
        {code:'en',flag:'🇬🇧',name:'English',sub:tr('英文')},
        {code:'pt',flag:'🇵🇹',name:'Português',sub:tr('葡萄牙语')}
    ];
    var html='';
    langs.forEach(function(l){
        var isActive=l.code===_currentLang;
        var borderCls=isActive?'border-2 border-primary-600 bg-primary-50':'border-2 border-surface-200 hover:border-primary-300 hover:bg-surface-50';
        var checkHtml=isActive
            ?'<div class="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>'
            :'<div class="w-5 h-5 rounded-full border-2 border-surface-300"></div>';
        html+='<label data-lang-code="'+l.code+'" onclick="selectLanguageOption(\''+l.code+'\')" class="lang-option flex items-center gap-4 p-4 '+borderCls+' rounded-xl cursor-pointer">';
        html+='<input type="radio" name="language-option" value="'+l.code+'" class="w-4 h-4 text-primary-600" '+(isActive?'checked':'')+' onclick="event.stopPropagation()" onchange="selectLanguageOption(this.value)">';
        html+='<span class="text-3xl">'+l.flag+'</span>';
        html+='<div class="flex-1"><div class="text-sm font-semibold text-text-primary">'+l.name+'</div><div class="text-xs text-text-muted">'+l.sub+'</div></div>';
        html+='<span data-lang-check>'+checkHtml+'</span>';
        html+='</label>';
    });
    container.innerHTML=html;
    setLanguageOptionActive(_currentLang);
}

