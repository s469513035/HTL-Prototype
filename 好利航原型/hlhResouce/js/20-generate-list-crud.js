function generateListPage(id,page,statusFilter){
    if(id==='cfg-dict')return generateDictPage(page);
    const c=TC[id];
    const L=_lang[_currentLang];
    if(!c)return '<div class="text-center py-20 text-text-muted">页面开发中...</div>';
    const hideQueryPanel=!!c.hideQueryPanel;
    const allData=filterDeletedRows(id,expandData(id));
    if(!statusFilter)statusFilter='';
    _statusFilterVal=statusFilter;
    const queriedData=hideQueryPanel?allData:filterRowsByQuery(id,allData);
    const data=statusFilter?queriedData.filter(row=>{
        if(c.statusMatch)return c.statusMatch(row,statusFilter,dataHeaders(c));
        const si2=dataHeaders(c).findIndex(h=>h.includes('状态')||h.includes(L.status)||h==='Status');
        return si2>=0&&row[si2]===statusFilter;
    }):queriedData;
    _listData[id]=data;
    if(!page)page=1;
    _listPage[id]=page;
    const total=data.length;
    const totalPages=Math.max(1,Math.ceil(total/_listPageSize));
    page=Math.max(1,Math.min(page,totalPages));
    const start=(page-1)*_listPageSize;
    const end=Math.min(start+_listPageSize,total);
    const pageData=data.slice(start,end);
    const headerState=getListHeaderState(id);
    var thArr=headerState.headers;
    var qlArr=c.forceLocalHeader?null:(L['tc_'+id+'_q']?trList(L['tc_'+id+'_q'].split('|')):null);
    const showRowActions=headerState.showRowActions;
    const dataColDefs=headerState.dataColDefs;
    const tableColumnSettings=getTableColumnSettings(id,dataColDefs);
    const listHiddenHeaders=c.listHiddenHeaders||[];
    let visibleDataCols=dataColDefs.filter(function(col){return !tableColumnSettings.hidden[col.index]&&listHiddenHeaders.indexOf(col.label)<0;});
    if(visibleDataCols.length===0&&dataColDefs.length){
        tableColumnSettings.hidden[dataColDefs[0].index]=false;
        visibleDataCols=[dataColDefs[0]];
    }
    const si=thArr.findIndex(h=>h.includes('状态')||h.includes(L.status)||h==='Status');
    let h='';
    h+='<div class="list-page-shell">';
    h+='<div class="list-filter-wrap px-5 pt-3 pb-2">';
    h+='<div class="bg-white rounded-lg border border-surface-200 p-3">';
    if(c.q&&!hideQueryPanel){
        const savedQuery=_queryState[id]||[];
        const querySettings=getQuerySettings(id,c);
        const queryPerRow=querySettings.perRow||5;
        const visibleQueryCount=c.q.filter(function(q,qi){return querySettings.visible[qi]!==false;}).length;
        const hasMore=visibleQueryCount>queryPerRow;
        let visibleQueryPos=0;
        h+='<div class="flex flex-col xl:flex-row gap-3 xl:gap-4">';
        h+='<div class="flex-1 min-w-0">';
        h+='<div class="grid gap-x-2 gap-y-2" id="query-grid-'+id+'" style="grid-template-columns:repeat('+queryPerRow+',minmax(0,1fr))">';
        c.q.forEach((q,qi)=>{
            var lbl=qlArr?qlArr[qi]:tr(q.label);
            var savedVal=savedQuery[qi]||'';
            const isQueryVisible=querySettings.visible[qi]!==false;
            const currentVisiblePos=isQueryVisible?visibleQueryPos++:-1;
            const queryHiddenClass=!isQueryVisible?' query-setting-hidden hidden':(hasMore&&currentVisiblePos>=queryPerRow?' query-row-extra hidden':'');
            h+='<div class="query-field-box flex flex-col gap-0.5'+queryHiddenClass+'">';
            h+='<label class="text-xs text-text-secondary">'+esc(lbl)+'</label>';
            if(q.type==='select'){
                const opts=q.field==='status'?c.s:q.options;
                h+='<select data-query-index="'+qi+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50">';
                h+='<option value="">'+tr('全部')+'</option>';
                if(opts)opts.forEach(o=>{h+='<option value="'+esc(o)+'"'+(savedVal===o?' selected':'')+'>'+esc(tr(o))+'</option>';});
                h+='</select>';
            }else if(q.type==='date'){
                h+='<input data-query-index="'+qi+'" type="date" value="'+esc(savedVal)+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50">';
            }else if(q.type==='multiselect'){
                h+='<div data-query-index="'+qi+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50 cursor-pointer flex items-center justify-between" onclick="openMultiSelectQuery(this,\''+id+'\','+qi+')"><span class="truncate text-text-muted">'+esc(lbl)+'</span><svg class="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></div>';
            }else if(q.type==='checkedDropdown'){
                h+='<div data-query-index="'+qi+'" class="relative" data-checked-dropdown>';
                h+='<input type="text" readonly data-checked-dropdown-input onclick="toggleCheckedDropdown(this)" class="h-8 w-full pl-2 pr-8 text-xs border border-surface-200 rounded-lg bg-surface-50 cursor-pointer" value="" placeholder="'+esc(lbl)+'">';
                h+='<button type="button" onclick="toggleCheckedDropdown(this)" class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted hover:text-primary-600 cursor-pointer">▾</button>';
                h+='<div data-checked-dropdown-menu class="hidden absolute z-40 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-surface-200 bg-white shadow-lg p-2">';
                if(q.options)q.options.forEach(function(o){h+='<label class="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-secondary hover:bg-primary-50 cursor-pointer"><input type="checkbox" value="'+esc(o)+'" class="rounded border-surface-300 text-primary-600" onchange="syncCheckedDropdownQuery(this,\''+id+'\','+qi+')"><span>'+esc(tr(o))+'</span></label>';});
                h+='</div></div>';
            }else{
                h+='<input data-query-index="'+qi+'" data-query-multiline="1" data-query-value="'+esc(savedVal)+'" type="text" value="'+esc(formatQueryPreview(savedVal))+'" placeholder="'+esc(L.search+lbl)+'" onclick="openQueryTextModal(this,\''+id+'\')" oninput="this.dataset.queryValue=this.value" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50">';
            }
            h+='</div>';
        });
        h+='</div>';
        h+='</div>';
        h+='<div class="flex flex-row xl:flex-col gap-1 flex-shrink-0 xl:pt-4 xl:min-w-[96px]">';
        if(hasMore){
            h+='<button class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer flex items-center justify-center gap-1" style="min-width:72px" onclick="toggleQueryExpand(this,\''+id+'\')"><svg class="w-3 h-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg><span>'+tr('更多筛选')+'</span></button>';
        }
        h+='<button onclick="resetQueryForm(\''+id+'\')" class="h-8 px-3 text-xs font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer" style="min-width:72px">'+L.reset+'</button>';
        h+='</div>';
        h+='</div>';
        h+='<div class="list-toolbar mt-1 pt-1 border-t border-surface-100 text-xs">';
        h+='<div class="list-toolbar-actions">';
        h+=renderToolbarActions(id);
        h+='<button onclick="showRequirementDoc(\''+id+'\')" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer flex items-center gap-1.5" style="min-width:84px"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'+tr('需求说明')+'</button>';
        h+='<button onclick="showFeatureIntro(\''+id+'\')" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer flex items-center gap-1.5" style="min-width:84px"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'+tr('功能说明')+'</button>';
        h+='</div>';
        h+='<div class="list-toolbar-settings">';
        h+='<span class="inline-flex items-center font-medium text-text-secondary leading-[22px]">'+tr('列表设置')+'</span>';
        h+='<label class="inline-flex items-center gap-1 text-text-secondary leading-[22px]">'+tr('每行显示')+'<select class="list-per-row-select border border-surface-200 bg-white" onchange="setQueryPerRow(\''+id+'\',this.value)">';
        [3,4,5,6,8].forEach(function(n){h+='<option value="'+n+'"'+(queryPerRow===n?' selected':'')+'>'+n+'</option>';});
        h+='</select></label>';
        h+='<button type="button" class="list-setting-link" onclick="openListConfigModal(\''+id+'\',\'query\')">'+tr('查询条件')+'</button>';
        h+='<button type="button" class="list-setting-link" onclick="openListConfigModal(\''+id+'\',\'columns\')">'+tr('列表字段')+'</button>';
        h+='</div>';
        h+='</div>';
    }else if(hideQueryPanel){
        h+='<div class="list-toolbar text-xs">';
        h+='<div class="list-toolbar-actions">';
        h+=renderToolbarActions(id);
        h+='<button onclick="showRequirementDoc(\''+id+'\')" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('需求说明')+'</button>';
        h+='<button onclick="showFeatureIntro(\''+id+'\')" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('功能说明')+'</button>';
        h+='</div>';
        h+='<div class="list-toolbar-settings">';
        h+='<span class="inline-flex items-center font-medium text-text-secondary leading-[22px]">'+tr('列表设置')+'</span>';
        h+='<button type="button" class="list-setting-link" onclick="openListConfigModal(\''+id+'\',\'columns\')">'+tr('列表字段')+'</button>';
        h+='</div>';
        h+='</div>';
    }else{
        h+='<div class="list-toolbar text-xs">';
        h+='<div class="list-toolbar-actions">';
        h+='<div class="relative flex-1 min-w-[200px] max-w-[320px]"><svg class="w-4 h-4 text-text-muted absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input type="text" placeholder="'+L.searchPlaceholder+'" class="w-full h-8 pl-9 pr-3 text-xs border border-surface-200 rounded-lg bg-surface-50 focus:bg-white"></div>';
        if(c.s&&c.s.length>0){
            h+='<select class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50"><option>'+tr('全部状态')+'</option>';
            c.s.forEach(s=>{h+='<option value="'+esc(s)+'">'+esc(tr(s))+'</option>';});
            h+='</select>';
        }
        h+='<button class="h-8 px-3 text-xs font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.reset+'</button>';
        h+=renderToolbarActions(id);
        h+='<button onclick="showRequirementDoc(\''+id+'\')" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('需求说明')+'</button>';
        h+='<button onclick="showFeatureIntro(\''+id+'\')" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('功能说明')+'</button>';
        h+='</div>';
        h+='<div class="list-toolbar-settings">';
        h+='<span class="inline-flex items-center font-medium text-text-secondary leading-[22px]">'+tr('列表设置')+'</span>';
        h+='<button type="button" class="list-setting-link" onclick="openListConfigModal(\''+id+'\',\'columns\')">'+tr('列表字段')+'</button>';
        h+='</div>';
        h+='</div>';
    }
    if(c.s&&c.s.length>0&&(id==='wb-manage'||id==='wb-client-list'||id==='wb-client-manage'||id==='fcl-booking-order'||id==='fcl-order'||id==='cs-issue-track'||id==='wh-final-alloc')){
        const statusCounts={};
        statusCounts['']=allData.length;
        c.s.forEach(s=>{statusCounts[s]=allData.filter(row=>{
            if(c.statusMatch)return c.statusMatch(row,s,dataHeaders(c));
            const si2=dataHeaders(c).findIndex(hd=>hd.includes('状态')||hd.includes(L.status)||hd==='Status');
            return si2>=0&&row[si2]===s;
        }).length;});
        h+='<div class="flex items-center gap-2 mt-4 flex-wrap">';
        h+='<button class="status-tab'+(statusFilter===''?' active':'')+'" onclick="document.getElementById(\'main-content\').innerHTML=generateListPage(\''+id+'\',1,\'\')">'+L.tabAll+'<span class="tab-count">'+statusCounts['']+'</span></button>';
        c.s.forEach(s=>{
            const sLabel=_statusLangMap[s]&&L[_statusLangMap[s]]?L[_statusLangMap[s]]:tr(s);
            h+='<button class="status-tab'+(statusFilter===s?' active':'')+'" onclick="document.getElementById(\'main-content\').innerHTML=generateListPage(\''+id+'\',1,\''+s+'\')">'+sLabel+'<span class="tab-count">'+(statusCounts[s]||0)+'</span></button>';
        });
        h+='</div>';
    }
    h+='</div></div>';
    h+='<div class="list-table-region" id="table-scroll-area">';
    h+='<div class="list-table-card bg-white rounded-xl border border-surface-200">';
    h+='<div class="top-scroll-wrapper" id="top-scroll"><div style="height:1px"></div></div>';
    h+='<div class="list-table-scroll" id="bottom-scroll"><table class="w-full data-table" style="table-layout:auto;min-width:100%;border-collapse:separate;border-spacing:0"><thead><tr class="bg-[#EFF6FF]">';
    h+='<th class="text-left text-xs font-semibold text-text-secondary px-4 py-3 whitespace-nowrap relative" style="width:40px"><input type="checkbox" id="checkAll" onchange="toggleCheckAll(this)"></th>';
    visibleDataCols.forEach(function(col){const th=col.label;const ci=col.index;const dragAttr=' draggable="true" data-col="'+ci+'" ondragstart="thDragStart(event,'+ci+')" ondragend="thDragEnd(event)" ondragover="thDragOver(event,'+ci+')" ondragleave="thDragLeave(event)" ondrop="thDrop(event,'+ci+',\''+id+'\')"';h+='<th class="text-left text-xs font-semibold text-text-secondary px-4 py-3 whitespace-nowrap relative"'+dragAttr+'>'+th+'<button class="col-filter-btn ml-1 inline-flex items-center justify-center w-4 h-4 text-text-muted hover:text-primary-600" onclick="showColumnFilter(event,\''+id+'\','+ci+')"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg></button><div class="col-resizer" onmousedown="startColResize(event,this)"></div></th>';});
    if(showRowActions){
        const actionHeader=thArr.find(function(th){return isActionHeaderText(th);})||tr('操作');
        h+='<th class="text-left text-xs font-semibold text-text-secondary px-4 py-3 whitespace-nowrap relative" style="position:sticky;right:0;z-index:20;background:#EFF6FF;white-space:nowrap;box-shadow:-4px 0 8px -4px rgba(0,0,0,0.1)">'+actionHeader+'</th>';
    }
    h+='</tr></thead><tbody>';
    const numKeywords=/金额|数量|重量|费用|额度|价格|收入|成本|运费|单价|总价|体积|件数|税|汇率|利润|折扣|比例|费率|重量\(KG\)|体积\(CBM\)/;
    pageData.forEach((row,idx)=>{
        const gi=start+idx;
        h+='<tr class="'+(gi%2===1?'bg-surface-50/50':'')+' hover:bg-primary-50/30 border-b border-surface-100">';
        h+='<td class="px-4 py-3 text-sm whitespace-nowrap"><input type="checkbox" class="row-check" value="'+gi+'"></td>';
        visibleDataCols.forEach(function(col){
            const ci=col.index;
            const th=col.label;
            const cell=ci<row.length?row[ci]:'';
            const rawCell=cell===undefined||cell===null?'':String(cell);
            const displayCell=tr(rawCell);
            const titleCell=esc(displayCell);
            if(ci===si||(c.statusBadgeCols&&c.statusBadgeCols.indexOf(th)>=0)){h+='<td class="px-4 py-3 text-sm whitespace-nowrap">'+statusBadge(rawCell)+'</td>';}
            else if((id==='wb-manage'||id==='wb-client-manage')&&ci===0){h+='<td class="px-4 py-3 text-sm whitespace-nowrap font-medium" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+titleCell+'"><button type="button" class="text-primary-700 hover:text-primary-800 hover:underline underline-offset-2 cursor-pointer font-semibold" onclick="openWaybillDetail(\''+id+'\','+gi+')">'+esc(displayCell)+'</button></td>';}
            else if(id==='fin-fee-mgmt'&&th==='运单号'){h+='<td class="px-4 py-3 text-sm whitespace-nowrap font-medium" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+titleCell+'"><button type="button" class="text-primary-700 hover:text-primary-800 hover:underline underline-offset-2 cursor-pointer font-semibold" ondblclick="openFeeMgmtDetail(\''+id+'\','+gi+')" title="'+esc(tr('双击进入详情'))+'">'+esc(displayCell)+'</button></td>';}
            else if(id==='fcl-bill'&&ci===0){h+='<td class="px-4 py-3 text-sm whitespace-nowrap font-medium" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+titleCell+'"><button type="button" class="text-primary-700 hover:text-primary-800 hover:underline underline-offset-2 cursor-pointer font-semibold" ondblclick="openBillDetailModal(\''+id+'\','+gi+')" title="'+esc(tr('双击进入详情'))+'">'+esc(displayCell)+'</button></td>';}
            else if(ci===0){h+='<td class="px-4 py-3 text-sm whitespace-nowrap font-medium text-primary-700" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+titleCell+'">'+esc(displayCell)+'</td>';}
            else if(th.includes('图片')){h+='<td class="px-4 py-3 text-sm whitespace-nowrap">'+renderNoPreImageThumbs(rawCell)+'</td>';}
            else if(id==='fin-fee-mgmt'&&['操作审核','海外确认','财务审核'].includes(th)){h+='<td class="px-4 py-3 text-sm whitespace-nowrap font-bold text-primary-700 bg-primary-50/50" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+titleCell+'">'+esc(displayCell)+'</td>';}
            else if(numKeywords.test(th)){h+='<td class="px-4 py-3 text-sm whitespace-nowrap font-semibold text-blue-700" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+titleCell+'">'+esc(displayCell)+'</td>';}
            else if(['停用','锁定','异常','已取消','已驳回','已过期','冻结','否'].includes(rawCell)){h+='<td class="px-4 py-3 text-sm whitespace-nowrap text-red-500 font-medium" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+titleCell+'">'+esc(displayCell)+'</td>';}
            else if(['启用','正常','已完成','已通过','是','已确认','已审核'].includes(rawCell)){h+='<td class="px-4 py-3 text-sm whitespace-nowrap text-green-600 font-medium" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+titleCell+'">'+esc(displayCell)+'</td>';}
            else{h+='<td class="px-4 py-3 text-sm text-text-secondary" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+titleCell+'">'+esc(displayCell)+'</td>';}
        });
        if(showRowActions){
            var deleteLabel=(id==='wb-manage'||id==='wb-client-manage')?'取消':L.delete;
            var deleteAction=(id==='wb-manage'||id==='wb-client-manage')?'cancel':'delete';
            const rowBg=gi%2===1?'#F8FAFC':'#FFFFFF';
            const airScanIds=['wh-air-arrival-scan','wh-air-sort-scan','wh-air-checkout-scan','wh-air-checkin-sort-scan'];
            const hideEdit=['wb-manage','wb-client-manage','fin-bill-mgmt','wh-pallet-info','ow-arrival','ow-outbound','ow-inventory','ow-pallet-info','wh-final-alloc'].concat(airScanIds).includes(id);
            const hideDelete=['wh-transfer-out','wh-transfer-in','wh-transfer-fee','fcl-provider-api','wh-pack-rule','wh-cargo-search','wh-out-scan','wh-preload','wh-issue','fin-fee-mgmt','wh-pallet-info','ow-arrival','ow-outbound','ow-inventory','ow-pallet-info','wh-final-alloc'].concat(airScanIds).includes(id);
            const viewClick=(id==='wb-manage'||id==='wb-client-manage')?'openWaybillDetail(\''+id+'\','+gi+')':(id==='fin-bill-mgmt'?'openActionModal(\'billDetail\',\''+id+'\','+gi+')':(id==='fin-fee-mgmt'?'openFeeMgmtDetail(\''+id+'\','+gi+')':(id==='wh-sort-bag'?'openSortBagDetailModal(\''+id+'\','+gi+')':(id==='wh-pallet-info'?'openPalletInfoDetailModal(\''+id+'\','+gi+')':(id==='ow-pickup'?'openOverseasPickupDetail(\''+id+'\','+gi+')':(id==='ow-arrival'?'openOverseasArrivalDetail(\''+id+'\','+gi+')':(id==='ow-outbound'?'openOverseasOutboundDetail(\''+id+'\','+gi+')':((id==='ow-inventory'||id==='wh-stock-check')?'openOverseasInventoryDetail(\''+id+'\','+gi+')':(id==='ow-pallet-info'?'openOwPalletInfoDetailModal(\''+id+'\','+gi+')':'openCrudModal(\'view\',\''+id+'\','+gi+')')))))))));
            let actionHtml='';
            if(id==='cfg-label-template'){
                actionHtml='<a class="text-orange-500 hover:text-orange-600 cursor-pointer mr-3" onclick="openLabelTemplateModal(\'edit\',\''+id+'\','+gi+')">'+tr('修改')+'</a>'+
                    '<a class="text-orange-500 hover:text-orange-600 cursor-pointer" onclick="downloadLabelTemplateRow(\''+id+'\','+gi+')">'+tr('下载')+'</a>';
            } else {
                actionHtml='<a class="text-primary-600 hover:text-primary-700 cursor-pointer mr-3" onclick="'+viewClick+'">'+L.view+'</a>';
                if(id==='ow-outbound')actionHtml+='<a class="text-primary-600 hover:text-primary-700 cursor-pointer mr-3" onclick="openOverseasQuickOutbound(\''+id+'\','+gi+')">'+tr('快捷出库')+'</a>';
                if(id==='ow-pickup'){
                    var owStIdx=dataHeaders(c).indexOf('状态');
                    var owReleased=owStIdx>=0&&row[owStIdx]==='已放货';
                    actionHtml+=owReleased
                        ?'<span class="text-text-muted mr-3 cursor-not-allowed" title="'+tr('已放货，不能调整明细')+'">'+tr('调整明细')+'</span>'
                        :'<a class="text-primary-600 hover:text-primary-700 cursor-pointer mr-3" onclick="openOverseasPickupAdjust(\''+id+'\','+gi+')">'+tr('调整明细')+'</a>';
                }
                if(id==='wh-sort-bag')actionHtml+='<a class="text-primary-600 hover:text-primary-700 cursor-pointer mr-3" onclick="openSortBagAdjustModal(\''+id+'\','+gi+')">'+tr('调整明细')+'</a>';
                if(id==='ow-inventory'||id==='wh-stock-check')actionHtml+='<a class="text-primary-600 hover:text-primary-700 cursor-pointer mr-3" onclick="openOverseasInventoryCountRecords(\''+id+'\','+gi+')">'+tr('盘点记录')+'</a>';
                /* 统一规则：行内操作列仅保留“查看”，编辑/删除已迁至工具栏操作按钮区（见 renderToolbarActions） */
            }
            h+='<td class="px-4 py-3 text-sm whitespace-nowrap" style="position:sticky;right:0;z-index:10;background:'+rowBg+';box-shadow:-4px 0 8px -4px rgba(0,0,0,0.1)">'+actionHtml+'</td>';
        }
        h+='</tr>';
    });
    h+='</tbody>'+buildColumnSummaryFooter(data,visibleDataCols,showRowActions)+'</table></div></div></div>';
    h+='<div class="flex-shrink-0 px-5 pb-5 pt-2">';
    h+='<div class="flex items-center justify-between flex-wrap gap-2">';
    h+='<div class="flex items-center gap-4">';
    h+='<span class="text-sm text-text-muted">'+L.total+' '+total+' '+L.items+'</span>';
    h+='</div>';
    h+='<div class="flex items-center gap-2"><select class="h-8 px-2 text-sm border border-surface-200 rounded-lg bg-white" onchange="_listPageSize=parseInt(this.value);document.getElementById(\'main-content\').innerHTML=generateListPage(\''+id+'\',1,\''+statusFilter+'\')">';
    [100,500,1000,5000].forEach(function(size){h+='<option value="'+size+'"'+(_listPageSize===size?' selected':'')+'>'+size+L.perPage+'</option>';});
    h+='</select><div class="flex items-center gap-1">';
    h+='<button class="w-8 h-8 flex items-center justify-center rounded border border-surface-200 text-text-muted hover:bg-surface-50 cursor-pointer'+(page<=1?' opacity-50':'')+'" onclick="if('+page+'>1)document.getElementById(\'main-content\').innerHTML=generateListPage(\''+id+'\','+(page-1)+',\''+statusFilter+'\')"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg></button>';
    for(let p=1;p<=totalPages;p++){
        if(totalPages<=7||p<=2||p>totalPages-2||Math.abs(p-page)<=1){
            if(p===page){h+='<button class="w-8 h-8 flex items-center justify-center rounded border border-primary-600 text-primary-600 bg-primary-50 font-medium text-sm cursor-pointer">'+p+'</button>';}
            else{h+='<button class="w-8 h-8 flex items-center justify-center rounded border border-surface-200 text-text-secondary hover:bg-surface-50 text-sm cursor-pointer" onclick="document.getElementById(\'main-content\').innerHTML=generateListPage(\''+id+'\','+p+',\''+statusFilter+'\')">'+p+'</button>';}
        }else if(p===3||p===totalPages-2){h+='<span class="text-text-muted text-xs px-1">...</span>';}
    }
    h+='<button class="w-8 h-8 flex items-center justify-center rounded border border-surface-200 text-text-muted hover:bg-surface-50 cursor-pointer'+(page>=totalPages?' opacity-50':'')+'" onclick="if('+page+'<'+totalPages+')document.getElementById(\'main-content\').innerHTML=generateListPage(\''+id+'\','+(page+1)+',\''+statusFilter+'\')"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></button>';
    h+='<div class="flex items-center gap-1.5 ml-2"><span class="text-sm text-text-muted">'+L.jumpTo+'</span><input type="number" min="1" max="'+totalPages+'" value="'+page+'" class="w-12 h-8 px-2 text-sm text-center border border-surface-200 rounded-lg bg-white" onkeydown="if(event.key===\'Enter\'){var p=parseInt(this.value);if(p>=1&&p<='+totalPages+')document.getElementById(\'main-content\').innerHTML=generateListPage(\''+id+'\',p,\''+statusFilter+'\')}"><span class="text-sm text-text-muted">'+L.page+'</span></div>';
    h+='</div></div></div></div>';
    setTimeout(function(){syncTopScroll();applyRuntimeEnhancements(document.getElementById('main-content'));},0);
    return h;
}

function switchCrudTab(el,tabIdx){
    var tabs=el.parentElement.querySelectorAll('.crud-tab');
    tabs.forEach(function(t){t.classList.remove('border-primary-600','text-primary-600','font-semibold');t.classList.add('border-transparent','text-text-secondary');});
    el.classList.remove('border-transparent','text-text-secondary');
    el.classList.add('border-primary-600','text-primary-600','font-semibold');
    var statusSelect=el.closest('#crud-modal-body').querySelector('[data-status-select]');
    if(statusSelect){
        if(tabIdx===0){statusSelect.selectedIndex=0;}
        else{statusSelect.selectedIndex=tabIdx-1;}
    }
}

function airScanFields(id){
    if(id==='wh-air-arrival-scan')return [
        {label:'运单号',scan:true,required:true,value:'WB-20260613001'},
        {label:'物流单号',value:'SF10086523'},
        {label:'重量(KG)',type:'number',value:'12.5'},
        {label:'长(CM)',type:'number',value:'55'},
        {label:'宽(CM)',type:'number',value:'42'},
        {label:'高(CM)',type:'number',value:'38'}
    ];
    if(id==='wh-air-sort-scan')return [
        {label:'运单号',scan:true,required:true,value:'WB-20260613001'},
        {label:'袋号',value:'BAG-ET605-001'},
        {label:'分拣区域',value:'A区-01'},
        {label:'重量(KG)',type:'number',value:'12.5'},
        {label:'长(CM)',type:'number',value:'55'},
        {label:'宽(CM)',type:'number',value:'42'},
        {label:'高(CM)',type:'number',value:'38'}
    ];
    if(id==='wh-air-checkin-sort-scan')return [
        {label:'袋号',value:'BAG-ET605-001'},
        {label:'运单号',scan:true,required:true,value:'WB-20260613001'},
        {label:'重量(KG)',type:'number',value:'12.5'},
        {label:'长(CM)',type:'number',value:'55'},
        {label:'宽(CM)',type:'number',value:'42'},
        {label:'高(CM)',type:'number',value:'38'}
    ];
    return [];
}
function openAirScanModal(mode,id,rowIdx){
    const L=_lang[_currentLang];
    const c=TC[id]||{};
    const readonly=mode==='view';
    const fields=airScanFields(id);
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:L.edit;
    document.getElementById('crud-modal-title').textContent=modeLabel+tr(c.t||'扫描录入');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='';
    let html='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">';
    fields.forEach(function(f){
        const reqMark=f.required?' <span class="text-red-500">*</span>':'';
        html+='<div>';
        html+='<label class="text-sm font-medium text-text-secondary mb-1.5 block">'+esc(tr(f.label))+reqMark+'</label>';
        const dis=readonly?' disabled':'';
        const reqAttr=f.required?' required':'';
        if(f.scan){
            html+='<div class="flex items-center gap-2"><input type="text" value="'+esc(f.value||'')+'"'+dis+reqAttr+' class="h-10 flex-1 px-3 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+esc(tr('请扫描或输入'+f.label))+'">';
            if(!readonly)html+='<button type="button" class="h-10 w-10 flex items-center justify-center rounded-lg bg-primary-600 text-white cursor-pointer"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 7V5a1 1 0 011-1h2M4 17v2a1 1 0 001 1h2m10-16h2a1 1 0 011 1v2m-3 12h2a1 1 0 001-1v-2M7 12h10"/></svg></button>';
            html+='</div>';
        }else{
            html+='<input type="'+(f.type||'text')+'" value="'+esc(f.value||'')+'"'+dis+reqAttr+' class="h-10 w-full px-3 text-sm border border-surface-200 rounded-lg bg-white">';
        }
        html+='</div>';
    });
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    if(readonly){
        document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">'+L.close+'</button>';
    }else{
        document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+tr(mode==='add'?'新增成功':'保存成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提交')+'</button>';
    }
    document.getElementById('crud-modal').classList.add('show');
}

function openCrudModal(mode,id,rowIdx){
    const c=TC[id];
    const L=_lang[_currentLang];
    if(!c)return;
    if(['wh-air-arrival-scan','wh-air-sort-scan','wh-air-checkin-sort-scan'].includes(id)&&(mode==='add'||mode==='edit'||mode==='view')){
        openAirScanModal(mode,id,rowIdx);
        return;
    }
    if(id==='wh-final-alloc'&&mode==='add'){
        openFinalAllocAddModal(id);
        return;
    }
    if(id==='wh-final-alloc'&&(mode==='edit'||mode==='view')){
        openFinalAllocAdjustModal(id,rowIdx);
        return;
    }
    const modalExcludedFields={};
    (c.modalExcludedFields||[]).forEach(function(label){modalExcludedFields[label]=true;});
    const auditHeaders=['创建人','创建时间','创建网点','修改人','修改时间','修改网点'];
    let modalFields=c.h.slice(0,-1).map(function(h,i){return {hd:h,index:i};}).filter(function(f){return f.hd!=='序号'&&!f.hd.endsWith('序号')&&!modalExcludedFields[f.hd]&&!auditHeaders.includes(f.hd);});
    modalFields=modalFields.slice().sort(function(a,b){
        const aw=isBottomModalField(a.hd);
        const bw=isBottomModalField(b.hd);
        if(aw!==bw)return aw-bw;
        return a.index-b.index;
    });
    const headers=modalFields.map(function(f){return f.hd;});
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:L.edit;
    titleEl.textContent=modeLabel+tr(c.t);
    const rowData=(rowIdx>=0&&_listData[id])?_listData[id][rowIdx]:null;
    if(id==='wh-transfer-out'&&mode==='edit'){
        openTransferOutRegisterModal('edit');
        return;
    }
    if(id==='wh-issue'&&(mode==='add'||mode==='edit'||mode==='view')){
        openIssueModal(mode,id,rowIdx,rowData);
        return;
    }
    if(id==='wh-preload'&&(mode==='add'||mode==='edit'||mode==='view')){
        openStowageRegisterModal(mode,id,rowIdx);
        return;
    }
    if(id==='wh-express-sort'&&(mode==='add'||mode==='edit'||mode==='copy')){
        openExpressSortModal(mode,id,rowIdx,rowData);
        markCustomModalRequired(id,mode);
        return;
    }
    if(['fcl-quote','fcl-cost-price','fcl-business-cost','fcl-sales-price'].includes(id)&&(mode==='add'||mode==='edit'||mode==='view')){
        openFclPriceModal(mode,id,rowIdx,rowData);
        return;
    }
    if(id==='fcl-surcharge'&&(mode==='add'||mode==='edit'||mode==='view')){
        openSurchargeModal(mode,id,rowIdx,rowData);
        return;
    }
    if(id==='fcl-carrier-route'&&(mode==='add'||mode==='edit'||mode==='view')){
        openFclCarrierRouteModal(mode,id,rowIdx,rowData);
        return;
    }
    if(id==='fin-fee-mgmt'&&mode==='add'){
        openFeeMgmtFeeModal(mode,id,rowIdx);
        return;
    }
    if(id==='fin-fee-mgmt'&&(mode==='edit'||mode==='view')){
        openFeeMgmtDetail(id,rowIdx);
        return;
    }
    if(id==='perm-role'&&(mode==='add'||mode==='edit')){
        openRoleModal(mode,id,rowIdx,rowData);
        markCustomModalRequired(id,mode);
        return;
    }
    if(id==='cfg-risk'&&(mode==='add'||mode==='edit'||mode==='view')){
        openRiskRuleModal(mode,id,rowIdx,rowData);
        markCustomModalRequired(id,mode);
        return;
    }
    if(id==='base-provider'&&(mode==='add'||mode==='edit'||mode==='view')){
        openProviderModal(mode,id,rowIdx,rowData);
        markCustomModalRequired(id,mode);
        return;
    }
    if(id==='base-employee'&&(mode==='add'||mode==='edit'||mode==='view')){
        openEmployeeModal(mode,id,rowIdx,rowData);
        markCustomModalRequired(id,mode);
        return;
    }
    if(id==='crm-cust'&&(mode==='add'||mode==='edit'||mode==='view')){
        openCrmCustomerModal(mode,id,rowIdx,rowData);
        markCustomModalRequired(id,mode);
        return;
    }
    if(id==='prod-manage'&&(mode==='add'||mode==='edit'||mode==='copy')){
        openProductManageModal(mode,id,rowIdx,rowData);
        markCustomModalRequired(id,mode);
        return;
    }
    if(id==='prod-price-lcl'&&(mode==='add'||mode==='edit'||mode==='copy'||mode==='view')){
        openLclQuoteModal(mode,id,rowIdx,rowData);
        markCustomModalRequired(id,mode);
        return;
    }
    if(id==='prod-surcharge'&&(mode==='add'||mode==='edit'||mode==='copy'||mode==='view')){
        openSurchargeModal(mode,id,rowIdx,rowData);
        markCustomModalRequired(id,mode);
        return;
    }
    if(id==='cs-issue-type'&&(mode==='add'||mode==='edit')){
        openCsIssueTypeModal(mode,id,rowIdx,rowData);
        return;
    }
    if(id==='biz-track-cfg'&&(mode==='add'||mode==='edit')){
        openTrackCfgModal(mode,id,rowIdx,rowData);
        return;
    }
    if(id==='biz-msg-flow'&&(mode==='add'||mode==='edit')){
        openMsgFlowModal(mode,id,rowIdx,rowData);
        return;
    }
    if(id==='biz-approval-flow'&&(mode==='add'||mode==='edit')){
        openApprovalFlowModal(mode,id,rowIdx,rowData);
        return;
    }
    if(id==='fin-bank-account'&&(mode==='add'||mode==='edit')){
        openBankAccountModal(mode,id,rowIdx,rowData);
        return;
    }
    if(id==='fin-account'&&(mode==='add'||mode==='edit')){
        openAccountModal(mode,id,rowIdx,rowData);
        return;
    }
    if((id==='fin-bank-voucher'||id==='fin-ar-receipt')&&(mode==='add'||mode==='edit')){
        openBankVoucherModal(mode,id,rowIdx,rowData);
        return;
    }
    if(id==='fin-rate'&&(mode==='add'||mode==='edit')){
        openRateModal(mode,id,rowIdx,rowData);
        return;
    }
    const colClass=modalGridFullClass(modalFields,'modal');
    if(mode==='view'){
        let html='';
        if(modalFields.length>0){
            html+='<div class="mb-4"><div class="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-surface-200">'+tr('基本信息')+'</div>';
            html+='<div class="'+colClass+'">';
            modalFields.forEach(function(field){
                const hd=field.hd;
                const val=rowData?rowData[field.index]:'';
                const isCode=hd.includes('编码')||hd.includes('编号')||hd.includes('代码');
                html+='<div class="flex flex-col gap-1 p-3 rounded-lg border border-surface-100 bg-surface-50/50">';
                html+='<label class="text-xs font-medium text-text-muted uppercase tracking-wide">'+esc(tr(hd))+'</label>';
                if(hd.includes('状态')){html+='<div class="text-sm text-text-primary mt-0.5">'+statusBadge(val)+'</div>';}
                else if(isCode){html+='<div class="text-sm font-semibold text-primary-700 mt-0.5">'+(val||'\u2014')+'</div>';}
                else{html+='<div class="text-sm text-text-primary mt-0.5">'+(val||'\u2014')+'</div>';}
                html+='</div>';
            });
            html+='</div></div>';
        }
        bodyEl.innerHTML=html;
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">'+L.close+'</button>';
    }else if(mode==='add'){
        let html='<div class="'+colClass+'">';
        modalFields.forEach(function(field){
            const hd=field.hd;
            const isCode=hd.includes('编码')||hd.includes('编号')||hd.includes('代码')||hd.includes('单号');
            const isDate=hd.includes('日期')||hd.includes('时间');
            const isStatus=hd.includes('状态');
            const selectOptions=fieldSelectOptions(id,hd,c);
            const isLongText=hd.includes('备注')||hd.includes('说明')||hd.includes('描述')||hd.includes('地址')||hd.includes('职能');
            const fieldWrapClass=(isLongText?'md:col-span-2 ':'')+(hd.includes('备注')?'modal-remark-half':'');
            const isRequired=isImportantRequiredField(hd,id);
            const reqMark=isRequired?' <span class="text-red-500">*</span>':'';
            const reqAttr=isRequired?' required':'';
            html+='<div class="'+fieldWrapClass+'">';
            html+='<label class="text-sm font-medium text-text-secondary mb-1.5 block">'+esc(tr(hd))+reqMark+'</label>';
            if(selectOptions){
                html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+reqAttr+'>';
                selectOptions.forEach(function(o){html+='<option value="'+esc(o)+'">'+esc(tr(o))+'</option>';});
                html+='</select>';
            }else if(isStatus){
                html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+reqAttr+'>';
                if(c.s)c.s.forEach(s=>{html+='<option value="'+esc(s)+'">'+esc(tr(s))+'</option>';});
                html+='</select>';
            }else if(isDate){
                html+='<input type="date" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+reqAttr+'>';
            }else if(isCode){
                const data=_listData[id]||expandData(id);
                const lastCode=(data[data.length-1]&&data[data.length-1][field.index])||'';
                const lm=lastCode.match(/^(.*?)(\d+)$/);
                let autoCode='';
                if(lm){autoCode=lm[1]+String(parseInt(lm[2])+1).padStart(lm[2].length,'0');}
                else{autoCode=lastCode+'-001';}
                html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+autoCode+'" placeholder="'+tr('自动生成')+'" readonly'+reqAttr+'>';
            }else if(isLongText){
                html+='<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入')+tr(hd))+'"'+reqAttr+'></textarea>';
            }else{
                html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" placeholder="'+esc(tr('请输入')+tr(hd))+'"'+reqAttr+'>';
            }
            html+='</div>';
        });
        html+='</div>';
        bodyEl.innerHTML=html;
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+tr('新增成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提交')+'</button>';
    }else{
        let html='<div class="'+colClass+'">';
        modalFields.forEach(function(field){
            const hd=field.hd;
            const val=rowData?rowData[field.index]:'';
            const isCode=hd.includes('编码')||hd.includes('编号')||hd.includes('代码')||hd.includes('单号')||hd.includes('类型');
            const isDate=hd.includes('日期')||hd.includes('时间');
            const isStatus=hd.includes('状态');
            const selectOptions=fieldSelectOptions(id,hd,c);
            const isLongText=hd.includes('备注')||hd.includes('说明')||hd.includes('描述')||hd.includes('地址')||hd.includes('职能');
            const fieldWrapClass=(isLongText?'md:col-span-2 ':'')+(hd.includes('备注')?'modal-remark-half':'');
            const isRequired=isImportantRequiredField(hd,id);
            const reqMark=isRequired?' <span class="text-red-500">*</span>':'';
            const reqAttr=isRequired?' required':'';
            html+='<div class="'+fieldWrapClass+'">';
            html+='<label class="text-sm font-medium text-text-secondary mb-1.5 block">'+esc(tr(hd))+reqMark+'</label>';
            if(selectOptions){
                html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+reqAttr+'>';
                selectOptions.forEach(function(o){html+='<option value="'+esc(o)+'"'+(val===o?' selected':'')+'>'+esc(tr(o))+'</option>';});
                html+='</select>';
            }else if(isStatus){
                html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+reqAttr+'>';
                if(c.s)c.s.forEach(s=>{html+='<option value="'+esc(s)+'"'+(val===s?' selected':'')+'>'+esc(tr(s))+'</option>';});
                html+='</select>';
            }else if(isDate){
                const dv=val?val.replace(/ .*/,''):'';
                html+='<input type="date" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+dv+'"'+reqAttr+'>';
            }else if(isLongText){
                html+='<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入')+tr(hd))+'"'+reqAttr+'>'+esc(val)+'</textarea>';
            }else if(isCode&&mode==='edit'){
                html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+val+'" readonly>';
            }else{
                html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+val+'" placeholder="'+esc(tr('请输入')+tr(hd))+'"'+reqAttr+'>';
            }
            html+='</div>';
        });
        html+='</div>';
        bodyEl.innerHTML=html;
        if(mode==='add'){
            footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+tr('新增成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认提交')+'</button>';
        }else{
            footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+tr('保存成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('保存修改')+'</button>';
        }
    }
    document.getElementById('crud-modal').classList.add('show');
}

function closeCrudModal(){
    document.getElementById('crud-modal').classList.remove('show');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='';
    closeExpressionModal();
}

