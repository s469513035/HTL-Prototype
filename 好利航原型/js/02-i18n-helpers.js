var _termMap={en:{},fr:{},pt:{}};
function buildTermMap(){
    ['en','fr','pt'].forEach(function(lang){
        const target=_lang[lang]||{};
        Object.keys(_lang.zh).forEach(function(k){
            const zhVal=_lang.zh[k];
            const langVal=target[k];
            if(typeof zhVal!=='string'||typeof langVal!=='string')return;
            const zhParts=zhVal.split('|');
            const langParts=langVal.split('|');
            if(zhParts.length===langParts.length){
                zhParts.forEach(function(part,i){if(part&&!_termMap[lang][part])_termMap[lang][part]=langParts[i];});
            }else if(zhVal&&!_termMap[lang][zhVal]){
                _termMap[lang][zhVal]=langVal;
            }
        });
        Object.assign(_termMap[lang],_manualI18n[lang]||{});
    });
}
buildTermMap();

function tr(text){
    if(text===undefined||text===null)return '';
    const raw=String(text);
    if(_currentLang==='zh')return raw;
    const map=_termMap[_currentLang]||{};
    if(map[raw])return map[raw];
    let out=raw;
    Object.keys(map).sort(function(a,b){return b.length-a.length;}).forEach(function(k){
        if(k&&out.includes(k))out=out.split(k).join(map[k]);
    });
    return out;
}

function langText(key,fallback){
    const L=_lang[_currentLang]||{};
    return key&&L[key]?L[key]:tr(fallback||key||'');
}

function trList(arr){
    return (arr||[]).map(function(item){return tr(item);});
}

function translateElementAttributes(root){
    if(!root)return;
    const attrs=['placeholder','title','aria-label'];
    const hasCjk=/[\u4e00-\u9fff]/;
    const elements=[];
    if(root.nodeType===1)elements.push(root);
    if(root.querySelectorAll)root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(function(el){elements.push(el);});
    elements.forEach(function(el){
        attrs.forEach(function(attr){
            if(!el.hasAttribute(attr))return;
            const key='i18nOriginal'+attr.replace(/-([a-z])/g,function(_,c){return c.toUpperCase();});
            const current=el.getAttribute(attr)||'';
            if(!el.dataset[key]){
                if(!hasCjk.test(current))return;
                el.dataset[key]=current;
            }
            el.setAttribute(attr,tr(el.dataset[key]));
        });
    });
}

function translateDom(root){
    if(!root)return;
    const hasCjk=/[\u4e00-\u9fff]/;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
        acceptNode:function(node){
            const parent=node.parentElement;
            if(!parent||['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName))return NodeFilter.FILTER_REJECT;
            if(!node.nodeValue.trim())return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(function(node){
        const original=node.nodeValue;
        const leading=original.match(/^\s*/)[0];
        const trailing=original.match(/\s*$/)[0];
        const core=original.trim();
        if(!node.__i18nOriginalText&&hasCjk.test(core))node.__i18nOriginalText=core;
        const source=node.__i18nOriginalText||core;
        if(!node.__i18nOriginalText&&!hasCjk.test(source))return;
        const translated=tr(source);
        if(translated!==core)node.nodeValue=leading+translated+trailing;
    });
}

function updateDocumentLangMeta(){
    if(document&&document.documentElement){
        document.documentElement.lang=_currentLang==='zh'?'zh-CN':(_currentLang==='fr'?'fr':(_currentLang==='pt'?'pt':'en'));
    }
    if(document)document.title=tr('好利航国际物流 - 管理系统原型');
}

