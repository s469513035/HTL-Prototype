function generateInquiryQuoteEntryPage(id){
    const c=TC[id]||{};
    const fields=c.entryFields||[];
    const basic=fields.slice(0,6);
    const cost=fields.slice(6);
    let h='';
    h+='<div class="h-full overflow-auto p-5">';
    h+='<form id="inquiry-quote-form" class="space-y-5">';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-5">';
    h+='<div class="flex items-center justify-between gap-4 mb-5"><div><h2 class="text-lg font-semibold text-text-primary">'+tr('询价报价录入')+'</h2><p class="text-xs text-text-muted mt-1">INQ-QT-20260522001</p></div><span class="badge bg-amber-100 text-amber-700">'+tr('待提交')+'</span></div>';
    h+='<div class="space-y-6">';
    h+='<section><div class="text-sm font-semibold text-text-primary mb-3">'+tr('录入信息')+'</div>'+renderFields(basic,4)+'</section>';
    h+='<section><div class="text-sm font-semibold text-text-primary mb-3">'+tr('费用与时效')+'</div>'+renderFields(cost,4)+'</section>';
    h+='</div></div>';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-4 flex flex-wrap justify-end gap-2">'+
        '<button type="button" onclick="showRequirementDoc(\''+id+'\')" class="h-9 px-5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('需求说明')+'</button>'+
        '<button type="button" onclick="openActionModal(\'draft\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('保存草稿')+'</button>'+
        '<button type="button" onclick="openActionModal(\'resetEntry\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('重置')+'</button>'+
        '<button type="button" onclick="openActionModal(\'shipmentSubmit\',\''+id+'\',-1)" class="h-9 px-5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提交')+'</button>'+
        '</div>';
    h+='</form></div>';
    setTimeout(function(){applyRuntimeEnhancements(document.getElementById('main-content'));},0);
    return h;
}

function generateDictPage(page){
    const L=_lang[_currentLang];
    const categories=['业务字典','财务字典','运输字典','仓库字典','客户字典','产品字典','费用字典','状态字典','港口字典','国家字典'];
    const catData={
        '业务字典':[
            ['BIZ001','运输方式','业务字典',5,'admin','2026-01-10','启用'],
            ['BIZ002','货物类型','业务字典',8,'admin','2026-01-10','启用'],
            ['BIZ003','服务类型','业务字典',4,'admin','2026-01-15','启用'],
            ['BIZ004','报关类型','业务字典',3,'admin','2026-02-01','启用']
        ],
        '财务字典':[
            ['FIN001','费用科目','财务字典',12,'admin','2026-01-10','启用'],
            ['FIN002','结算方式','财务字典',5,'admin','2026-01-12','启用'],
            ['FIN003','币种','财务字典',6,'admin','2026-01-15','启用']
        ],
        '运输字典':[
            ['TRS001','航线','运输字典',10,'admin','2026-01-10','启用'],
            ['TRS002','船公司','运输字典',8,'admin','2026-01-12','启用']
        ],
        '仓库字典':[
            ['WH001','仓库类型','仓库字典',4,'admin','2026-01-10','启用'],
            ['WH002','货区类型','仓库字典',3,'admin','2026-01-15','启用']
        ],
        '客户字典':[
            ['CRM001','客户类型','客户字典',4,'admin','2026-01-10','启用'],
            ['CRM002','客户等级','客户字典',4,'admin','2026-01-12','启用'],
            ['CRM003','客户来源','客户字典',5,'admin','2026-01-15','启用']
        ],
        '产品字典':[
            ['PRD001','产品类型','产品字典',3,'admin','2026-01-10','启用'],
            ['PRD002','渠道类型','产品字典',2,'admin','2026-01-12','启用']
        ],
        '费用字典':[
            ['FEE001','附加费类型','费用字典',6,'admin','2026-01-10','启用'],
            ['FEE002','计费方式','费用字典',3,'admin','2026-01-12','启用']
        ],
        '状态字典':[
            ['STS001','运单状态','状态字典',8,'admin','2026-01-10','启用'],
            ['STS002','提单状态','状态字典',5,'admin','2026-01-12','启用']
        ],
        '港口字典':[
            ['PRT001','港口类型','港口字典',3,'admin','2026-01-10','启用']
        ],
        '国家字典':[
            ['CNT001','大洲','国家字典',6,'admin','2026-01-10','启用']
        ]
    };
    let h='<div class="flex h-full gap-0">';
    h+='<div class="w-1/5 flex-shrink-0 border-r border-surface-200 bg-white flex flex-col">';
    h+='<div class="p-3 border-b border-surface-200"><div class="relative"><svg class="w-4 h-4 text-text-muted absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input type="text" id="dict-cat-search" placeholder="'+tr('搜索分类')+'" class="w-full h-8 pl-8 pr-3 text-sm border border-surface-200 rounded-lg bg-surface-50" oninput="filterDictCategories(this.value)"></div></div>';
    h+='<div class="flex-1 overflow-y-auto p-2" id="dict-cat-list">';
    categories.forEach(function(cat,i){
        h+='<div class="dict-cat-item flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm '+(i===0?'bg-primary-50 text-primary-700 font-medium':'text-text-secondary hover:bg-surface-50')+'" data-cat="'+esc(cat)+'" onclick="selectDictCategory(this,\''+esc(cat)+'\')">';
        h+='<span>'+esc(tr(cat))+'</span>';
        h+='<span class="text-xs text-text-muted">'+(catData[cat]?catData[cat].length:0)+'</span>';
        h+='</div>';
    });
    h+='</div></div>';
    h+='<div class="flex-1 min-w-0 flex flex-col" id="dict-right-panel">';
    const firstCat=categories[0];
    const firstData=catData[firstCat]||[];
    h+=renderDictRightPanel(firstCat,firstData);
    h+='</div></div>';
    setTimeout(function(){selectDictCategory(document.querySelector('.dict-cat-item'),firstCat);},0);
    return h;
}
function renderDictRightPanel(cat,data){
    const L=_lang[_currentLang];
    let h='';
    h+='<div class="flex-shrink-0 px-5 pt-3 pb-2">';
    h+='<div class="bg-white rounded-lg border border-surface-200 p-3">';
    h+='<div class="flex items-center justify-between mb-4"><div class="text-base font-semibold text-text-primary">'+esc(tr(cat))+'</div></div>';
    h+='<div class="flex items-center gap-3 flex-wrap">';
    h+='<button onclick="openCrudModal(\'add\',\'cfg-dict\',-1)" class="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">'+tr('新增数据')+'</button>';
    h+='<button onclick="exportData(\'cfg-dict\')" class="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">'+tr('导出数据')+'</button>';
    h+='</div></div></div>';
    h+='<div class="flex-1 overflow-auto min-h-0 px-5">';
    h+='<div class="bg-white rounded-xl border border-surface-200" style="overflow:clip">';
    h+='<table class="w-full data-table" style="table-layout:auto;min-width:100%;border-collapse:separate;border-spacing:0"><thead><tr class="bg-[#EFF6FF]">';
    ['字典编码','字典名称','字典类型','备注','创建人','创建时间','状态','操作'].forEach(function(th){
        h+='<th class="text-left text-xs font-semibold text-text-secondary px-4 py-3 whitespace-nowrap">'+esc(tr(th))+'</th>';
    });
    h+='</tr></thead><tbody>';
    data.forEach(function(row,i){
        h+='<tr class="'+(i%2===1?'bg-surface-50/50':'')+' hover:bg-primary-50/30 border-b border-surface-100">';
        row.forEach(function(cell,ci){
            if(ci===6){h+='<td class="px-4 py-3 text-sm whitespace-nowrap">'+statusBadge(cell)+'</td>';}
            else if(ci===0){h+='<td class="px-4 py-3 text-sm whitespace-nowrap font-medium text-primary-700">'+esc(tr(cell))+'</td>';}
            else{h+='<td class="px-4 py-3 text-sm text-text-secondary">'+esc(tr(cell))+'</td>';}
        });
        h+='<td class="px-4 py-3 text-sm whitespace-nowrap" style="position:sticky;right:0;z-index:10;min-width:100px;width:100px;background:'+(i%2===1?'#F8FAFC':'#FFFFFF')+';box-shadow:-4px 0 8px -4px rgba(0,0,0,0.1)"><a class="text-primary-600 hover:text-primary-700 cursor-pointer mr-3" onclick="openCrudModal(\'view\',\'cfg-dict\','+i+')">'+L.view+'</a><a class="text-primary-600 hover:text-primary-700 cursor-pointer mr-3" onclick="openCrudModal(\'edit\',\'cfg-dict\','+i+')">'+L.edit+'</a><a class="text-red-500 hover:text-red-600 cursor-pointer" onclick="openActionModal(\'delete\',\'cfg-dict\','+i+')">'+L.delete+'</a></td>';
        h+='</tr>';
    });
    h+='</tbody></table></div></div>';
    return h;
}
function selectDictCategory(el,cat){
    document.querySelectorAll('.dict-cat-item').forEach(function(item){item.classList.remove('bg-primary-50','text-primary-700','font-medium');item.classList.add('text-text-secondary');});
    el.classList.add('bg-primary-50','text-primary-700','font-medium');
    el.classList.remove('text-text-secondary');
    const catData={
        '业务字典':[['BIZ001','运输方式','业务字典','管理运输方式分类','admin','2026-01-10','启用'],['BIZ002','货物类型','业务字典','管理货物类型分类','admin','2026-01-10','启用'],['BIZ003','服务类型','业务字典','管理服务类型分类','admin','2026-01-15','启用'],['BIZ004','报关类型','业务字典','管理报关类型分类','admin','2026-02-01','启用']],
        '财务字典':[['FIN001','费用科目','财务字典','管理费用科目分类','admin','2026-01-10','启用'],['FIN002','结算方式','财务字典','管理结算方式分类','admin','2026-01-12','启用'],['FIN003','币种','财务字典','管理币种分类','admin','2026-01-15','启用']],
        '运输字典':[['TRS001','航线','运输字典','管理航线分类','admin','2026-01-10','启用'],['TRS002','船公司','运输字典','管理船公司分类','admin','2026-01-12','启用']],
        '仓库字典':[['WH001','仓库类型','仓库字典','管理仓库类型分类','admin','2026-01-10','启用'],['WH002','货区类型','仓库字典','管理货区类型分类','admin','2026-01-15','启用']],
        '客户字典':[['CRM001','客户类型','客户字典','管理客户类型分类','admin','2026-01-10','启用'],['CRM002','客户等级','客户字典','管理客户等级分类','admin','2026-01-12','启用'],['CRM003','客户来源','客户字典','管理客户来源分类','admin','2026-01-15','启用']],
        '产品字典':[['PRD001','产品类型','产品字典','管理产品类型分类','admin','2026-01-10','启用'],['PRD002','渠道类型','产品字典','管理渠道类型分类','admin','2026-01-12','启用']],
        '费用字典':[['FEE001','附加费类型','费用字典','管理附加费类型分类','admin','2026-01-10','启用'],['FEE002','计费方式','费用字典','管理计费方式分类','admin','2026-01-12','启用']],
        '状态字典':[['STS001','运单状态','状态字典','管理运单状态分类','admin','2026-01-10','启用'],['STS002','提单状态','状态字典','管理提单状态分类','admin','2026-01-12','启用']],
        '港口字典':[['PRT001','港口类型','港口字典','管理港口类型分类','admin','2026-01-10','启用']],
        '国家字典':[['CNT001','大洲','国家字典','管理大洲分类','admin','2026-01-10','启用']]
    };
    const data=catData[cat]||[];
    _listData['cfg-dict']=data;
    TC['cfg-dict'].h=['字典编码','字典名称','字典类型','备注','创建人','创建时间','状态','操作'];
    TC['cfg-dict'].t='数据字典';
    const panel=document.getElementById('dict-right-panel');
    if(panel)panel.innerHTML=renderDictRightPanel(cat,data);
}
function filterDictCategories(keyword){
    keyword=keyword.toLowerCase();
    document.querySelectorAll('.dict-cat-item').forEach(function(item){
        const name=item.dataset.cat||'';
        item.style.display=name.toLowerCase().includes(keyword)?'':'none';
    });
}

