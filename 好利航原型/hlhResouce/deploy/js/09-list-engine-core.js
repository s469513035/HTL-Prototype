function statusBadge(val){
    const g=['启用','已通过','已入仓','已确认','已完成','已放行','已同步','已对齐','已生效','已出库','已作废','已结算','已开具','已登记','已补录','已处理','已验证','已付款','已开票','正常','运行中','已领取','已复核','在途','全部放行','已解决','全部抵扣','正式','已启用'];
    const r=['停用','禁用','已驳回','异常','已销毁','已过期','冻结','熔断','未通过','作废','已禁用'];
    const a=['待审核','待审批','待入仓','待定','待处理','待确认','待补录','待领取','待到港','待预约','待出库','待开票','待同步','有差异','告警中','告警','维护中','待抢单','待结算','预警','待通知','已登记','待抵扣','部分抵扣','草稿'];
    const label=_statusLangMap[val]&&_lang[_currentLang][_statusLangMap[val]]?_lang[_currentLang][_statusLangMap[val]]:tr(val);
    if(g.includes(val))return '<span class="badge bg-green-50 text-green-700">'+label+'</span>';
    if(r.includes(val))return '<span class="badge bg-red-50 text-red-700">'+label+'</span>';
    if(a.includes(val))return '<span class="badge bg-amber-50 text-amber-700">'+label+'</span>';
    return '<span class="badge bg-primary-50 text-primary-700">'+label+'</span>';
}

var _listData={};
var _listPage={};
var _listPageSize=100;
var _openTabs=[{id:'workspace',title:'工作台',type:'dashboard',langKey:'workspace'}];
var _activeTab='workspace';
var _columnFilters={};
var _queryState={};
var _activeQueryEdit=null;
var _filterState={tabId:null,colIdx:-1,values:[],selected:[]};
var _colOrder={};
var _statusFilterVal='';
var _deletedRowKeys={};
var _querySettings={};
var _tableColumnSettings={};
var _rowOverrides={};
var _waybillDetailStore={};
var _feeMgmtDetailRows={};
var _activeSurchargeDetailRow=null;
var _noPreClaimPage=1;
var _noPreForecastPage=1;
var _noPreClaimPageSize=100;
var _lclWeightPriceMode='vertical';
var _lclCargoTab='普货';   /* 价格维护按货物类型分插页：普货 / 敏感货 */
var _lclWeightPriceRows=[
    {groupId:'lcl-g-1',weightSeg:'0-1',price:'1',cargoType:'普货',billingMode:'单价',billingUnit:'KGS'},
    {groupId:'lcl-g-1',weightSeg:'2-4',price:'2',cargoType:'普货',billingMode:'单价',billingUnit:'KGS'},
    {groupId:'lcl-g-1',weightSeg:'5-100',price:'3',cargoType:'普货',billingMode:'单价',billingUnit:'KGS'},
    {groupId:'lcl-g-2',weightSeg:'0-1',price:'2',cargoType:'敏感货',billingMode:'单价',billingUnit:'KGS'},
    {groupId:'lcl-g-2',weightSeg:'2-4',price:'3.5',cargoType:'敏感货',billingMode:'单价',billingUnit:'KGS'},
    {groupId:'lcl-g-2',weightSeg:'5-100',price:'5',cargoType:'敏感货',billingMode:'单价',billingUnit:'KGS'}
];

function incrementTrailingNumber(value,index){
    const raw=String(value===undefined||value===null?'':value);
    const m=raw.match(/^(.*?)(\d+)(\D*)$/);
    if(!m||m[3])return raw;
    return m[1]+String(index).padStart(m[2].length,'0');
}

function expandRowsToTarget(c,target){
    const seed=(c.d||[]).filter(function(row){return row&&row.length;});
    if(seed.length===0)return [];
    const headers=dataHeaders(c);
    const seqIdx=headers.findIndex(function(h){return h==='序号'||h.endsWith('序号');});
    const codeIdx=headers.findIndex(function(h,i){
        return i!==seqIdx&&/(编码|代码|编号|单号|五字码|三字码|二字码)/.test(h);
    });
    const result=[];
    while(result.length<target){
        const index=result.length+1;
        const row=seed[(index-1)%seed.length].map(function(v){return v;});
        if(seqIdx>=0)row[seqIdx]=String(index);
        if(codeIdx>=0&&row[codeIdx])row[codeIdx]=incrementTrailingNumber(row[codeIdx],index);
        result.push(row);
    }
    return result;
}

function applyRowOverrides(id,rows){
    const map=_rowOverrides[id];
    if(!map)return rows;
    rows.forEach(function(row){
        const key=String(row&&row.length?row[0]:'');
        const override=map[key];
        if(override){
            Object.keys(override).forEach(function(idx){
                row[parseInt(idx,10)]=override[idx];
            });
        }
    });
    return rows;
}

function setRowOverride(id,row,colIdx,value){
    const key=String(row&&row.length?row[0]:'');
    if(!key)return;
    if(!_rowOverrides[id])_rowOverrides[id]={};
    if(!_rowOverrides[id][key])_rowOverrides[id][key]={};
    _rowOverrides[id][key][colIdx]=value;
    const c=TC[id];
    if(c&&c.d){
        c.d.forEach(function(baseRow){
            if(String(baseRow&&baseRow.length?baseRow[0]:'')===key)baseRow[colIdx]=value;
        });
    }
}

function expandData(id){
    const c=TC[id];
    if(c.minRows)return applyRowOverrides(id,expandRowsToTarget(c,c.minRows));
    const targetRows=200;
    if(c.noExpand||c.d.length>=targetRows) return applyRowOverrides(id,c.d.map(r=>[...r]));
    const seed=c.d;
    const result=seed.map(r=>[...r]);
    const firstCode=seed[0][0];
    const m=firstCode.match(/^(.*?)(\d+)$/);
    const prefix=m?m[1]:firstCode+'-';
    const numLen=m?m[2].length:3;
    let nextNum=m?parseInt(m[2])+seed.length:1;
    const si=c.h.slice(0,-1).findIndex(h=>h.includes('状态'));
    const dateCols=[];
    c.h.slice(0,-1).forEach((hd,i)=>{if(hd.includes('日期')||hd.includes('时间')||hd.includes('入职'))dateCols.push(i);});
    while(result.length<targetRows){
        for(let i=0;i<seed.length&&result.length<targetRows;i++){
            const row=[...seed[i]];
            row[0]=prefix+String(nextNum).padStart(numLen,'0');
            nextNum++;
            dateCols.forEach(di=>{
                const v=row[di];
                if(v){
                    const dm=v.match(/^(\d{4}-\d{2}-\d{2})/);
                    if(dm){
                        const dayOffset=Math.floor((result.length-seed.length)/seed.length)+1;
                        const parts=dm[1].split('-').map(function(n){return parseInt(n,10);});
                        const d=new Date(parts[0],parts[1]-1,parts[2]);
                        if(!isNaN(d.getTime())){
                            d.setDate(d.getDate()+dayOffset);
                            if(!isNaN(d.getTime())){
                                const nextDate=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
                                row[di]=v.replace(dm[1],nextDate);
                            }
                        }
                    }
                }
            });
            if(si>=0&&c.s&&c.s.length>0)row[si]=c.s[Math.floor(Math.random()*c.s.length)];
            result.push(row);
        }
    }
    const auditFields=['admin','2025-01-15 10:30','广州总部','—','—','—'];
    const auditHeaders=['创建人','创建时间','创建网点','修改人','修改时间','修改网点'];
    const opIdx=c.h.findIndex(h=>h==='操作');
    const insertAt=opIdx>=0?opIdx:c.h.length;
    if(opIdx>=0&&!c.h.includes('创建人')){
        c.h.splice(insertAt,0,...auditHeaders);
    }
    result.forEach(function(row){
        const needed=insertAt-row.length;
        if(needed>0){for(let i=0;i<needed;i++)row.push('');}
        row.splice(insertAt,0,...auditFields);
    });
    return applyRowOverrides(id,result);
}

function isActionHeaderText(text){
    return ['操作','Action','Operation','Opération','Operação'].includes(String(text||'').trim());
}

function dataHeaders(c){
    if(!c||!c.h)return [];
    return c.h.slice(0,isActionHeaderText(c.h[c.h.length-1])?c.h.length-1:c.h.length);
}

function splitQueryTerms(value){
    return String(value||'').split(/[\n\r,，;；]+/).map(function(v){return v.trim();}).filter(Boolean);
}

function formatQueryPreview(value){
    const terms=splitQueryTerms(value);
    return terms.length?terms.join('；'):'';
}

function normalizeQueryText(value){
    return String(value===undefined||value===null?'':value).toLowerCase();
}

function findQueryColumnIndex(headers,q){
    const label=String((q&&q.label)||'');
    if(!label)return -1;
    let idx=headers.findIndex(function(hd){return hd===label;});
    if(idx>=0)return idx;
    idx=headers.findIndex(function(hd){return hd.includes(label)||label.includes(hd);});
    if(idx>=0)return idx;
    if((q.field||'')==='status')return headers.findIndex(function(hd){return hd.includes('状态');});
    return -1;
}

function filterRowsByQuery(id,rows){
    const c=TC[id];
    const values=_queryState[id]||[];
    if(!c||!c.q||!values.some(function(v){return String(v||'').trim();}))return rows;
    const headers=dataHeaders(c);
    return rows.filter(function(row){
        return c.q.every(function(q,idx){
            const raw=values[idx];
            if(!String(raw||'').trim())return true;
            const terms=splitQueryTerms(raw);
            if(terms.length===0)return true;
            const colIdx=findQueryColumnIndex(headers,q);
            const pool=colIdx>=0?[row[colIdx]]:row;
            return terms.some(function(term){
                const nTerm=normalizeQueryText(term);
                return pool.some(function(cell){
                    const nCell=normalizeQueryText(cell);
                    if(q.type==='date')return nCell.indexOf(nTerm)===0||nCell.includes(nTerm);
                    return nCell.includes(nTerm);
                });
            });
        });
    });
}

function rowKey(row){
    return String(row&&row.length?row[0]:'');
}

function filterDeletedRows(id,rows){
    const deleted=_deletedRowKeys[id];
    if(!deleted)return rows;
    return rows.filter(function(row){return !deleted[rowKey(row)];});
}

function getQuerySettings(id,c){
    if(!_querySettings[id])_querySettings[id]={perRow:5,visible:{}};
    const settings=_querySettings[id];
    if(!settings.perRow)settings.perRow=5;
    if(!settings.visible)settings.visible={};
    (c.q||[]).forEach(function(q,idx){
        if(settings.visible[idx]===undefined)settings.visible[idx]=true;
    });
    return settings;
}

function setQueryPerRow(id,value){
    const c=TC[id];
    const settings=getQuerySettings(id,c||{q:[]});
    settings.perRow=Math.max(1,Math.min(8,parseInt(value,10)||5));
    document.getElementById('main-content').innerHTML=generateListPage(id,1,_statusFilterVal||'');
}

function toggleQueryFieldSetting(id,idx,checked){
    const c=TC[id];
    const settings=getQuerySettings(id,c||{q:[]});
    settings.visible[idx]=!!checked;
    document.getElementById('main-content').innerHTML=generateListPage(id,1,_statusFilterVal||'');
}

function getTableColumnSettings(id,cols){
    if(!_tableColumnSettings[id])_tableColumnSettings[id]={hidden:{}};
    const settings=_tableColumnSettings[id];
    if(!settings.hidden)settings.hidden={};
    (cols||[]).forEach(function(col){
        if(settings.hidden[col.index]===undefined)settings.hidden[col.index]=false;
    });
    return settings;
}

function toggleTableColumnSetting(id,idx,checked){
    const settings=getTableColumnSettings(id,[]);
    settings.hidden[idx]=!checked;
    document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal||'');
}

function getListHeaderState(id){
    const c=TC[id];
    const L=_lang[_currentLang];
    if(!c)return {headers:[],showRowActions:false,dataColDefs:[]};
    var thArr=trList(c.forceLocalHeader?c.h:(L['tc_'+id+'_h']?L['tc_'+id+'_h'].split('|'):c.h));
    const auditHeaderDefs=['创建人','创建时间','创建网点','修改人','修改时间','修改网点'];
    const auditHeaders=trList(auditHeaderDefs);
    if(!c.noAutoAudit&&!thArr.some(function(h){return auditHeaders.includes(h)||h==='创建人';})){
        const opIdx=thArr.findIndex(function(h){return isActionHeaderText(h);});
        if(opIdx>=0){thArr.splice(opIdx,0,...auditHeaders);}
        else{thArr.push(...auditHeaders);}
    }
    const showRowActions=!c.readonlyList;
    if(!showRowActions&&isActionHeaderText(thArr[thArr.length-1]))thArr=thArr.slice(0,-1);
    const dataColDefs=thArr.map(function(th,idx){return {label:th,index:idx};}).filter(function(col){
        return !(showRowActions&&col.index===thArr.length-1&&isActionHeaderText(col.label));
    });
    return {headers:thArr,showRowActions:showRowActions,dataColDefs:dataColDefs};
}

function openListConfigModal(id,type){
    const c=TC[id];
    if(!c)return;
    const old=document.getElementById('list-config-modal');
    if(old)old.remove();
    const isQuery=type==='query';
    const title=isQuery?tr('查询条件'):tr('列表字段');
    const overlay=document.createElement('div');
    overlay.id='list-config-modal';
    overlay.className='fixed inset-0 z-[90] bg-black/35 flex items-center justify-center px-4';
    let body='';
    if(isQuery){
        const L=_lang[_currentLang];
        const qlArr=c.forceLocalHeader?null:(L['tc_'+id+'_q']?trList(L['tc_'+id+'_q'].split('|')):null);
        const settings=getQuerySettings(id,c);
        if(c.q&&c.q.length){
            body+='<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">';
            c.q.forEach(function(q,qi){
                const lbl=qlArr?qlArr[qi]:tr(q.label);
                body+='<label class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-primary-50 cursor-pointer"><input type="checkbox" data-query-setting-idx="'+qi+'" '+(settings.visible[qi]!==false?'checked':'')+'><span class="truncate">'+esc(lbl)+'</span></label>';
            });
            body+='</div>';
        }else{
            body+='<div class="py-8 text-center text-sm text-text-muted">'+tr('该模块暂无查询条件')+'</div>';
        }
    }else{
        const colDefs=getListHeaderState(id).dataColDefs;
        const settings=getTableColumnSettings(id,colDefs);
        if(colDefs.length){
            body+='<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">';
            colDefs.forEach(function(col){
                body+='<label class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-primary-50 cursor-pointer"><input type="checkbox" data-column-setting-idx="'+col.index+'" '+(!settings.hidden[col.index]?'checked':'')+'><span class="truncate">'+esc(col.label)+'</span></label>';
            });
            body+='</div>';
        }else{
            body+='<div class="py-8 text-center text-sm text-text-muted">'+tr('该模块暂无字段配置')+'</div>';
        }
    }
    overlay.innerHTML='<div class="w-full max-w-[560px] max-h-[78vh] bg-white rounded-xl border border-surface-200 shadow-xl flex flex-col"><div class="flex items-center justify-between px-5 py-3 border-b border-surface-200"><div class="text-base font-semibold text-text-primary">'+title+'</div><button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-50 cursor-pointer" onclick="closeListConfigModal()">×</button></div><div class="p-4 overflow-y-auto">'+body+'</div><div class="flex justify-end gap-2 px-5 py-3 border-t border-surface-200"><button type="button" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer" onclick="closeListConfigModal()">'+tr('取消')+'</button><button type="button" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer" onclick="applyListConfigModal(\''+esc(id)+'\',\''+esc(type)+'\')">'+tr('确认')+'</button></div></div>';
    document.body.appendChild(overlay);
}

function closeListConfigModal(){
    const modal=document.getElementById('list-config-modal');
    if(modal)modal.remove();
}

function applyListConfigModal(id,type){
    const modal=document.getElementById('list-config-modal');
    if(!modal)return;
    const c=TC[id];
    if(type==='query'){
        const settings=getQuerySettings(id,c||{q:[]});
        modal.querySelectorAll('[data-query-setting-idx]').forEach(function(cb){
            settings.visible[parseInt(cb.dataset.querySettingIdx,10)]=cb.checked;
        });
        closeListConfigModal();
        document.getElementById('main-content').innerHTML=generateListPage(id,1,_statusFilterVal||'');
        return;
    }
    const checks=[...modal.querySelectorAll('[data-column-setting-idx]')];
    if(checks.length&&!checks.some(function(cb){return cb.checked;}))checks[0].checked=true;
    const settings=getTableColumnSettings(id,[]);
    checks.forEach(function(cb){
        settings.hidden[parseInt(cb.dataset.columnSettingIdx,10)]=!cb.checked;
    });
    closeListConfigModal();
    document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal||'');
}

function isBottomModalField(label){
    const text=String(label||'');
    if(text.includes('备注'))return 3;
    if(text.includes('地址'))return 2;
    if(text.includes('说明')||text.includes('描述')||text.includes('职能'))return 1;
    return 0;
}

function buildColumnSummaryItems(rows,cols){
    let html='';
    (cols||[]).forEach(function(col){
        html+='<span class="summary-item"><span class="summary-label">'+esc(col.label)+':</span><span class="summary-value">'+esc(buildColumnSummaryValue(rows,col))+'</span></span>';
    });
    return html;
}

function buildColumnSummaryValue(rows,col){
    let numeric=true;
    let sum=0;
    let nonEmpty=0;
    (rows||[]).forEach(function(row){
        const val=row[col.index];
        if(val!==undefined&&val!==null&&String(val).trim()!==''){
            nonEmpty++;
            const cleaned=String(val).replace(/^[A-Z]{3}\s*/,'').replace(/[,，]/g,'').replace(/%$/,'').trim();
            if(/^-?\d+\.?\d*$/.test(cleaned)){
                sum+=parseFloat(cleaned);
            }else{
                numeric=false;
            }
        }
    });
    return numeric&&nonEmpty>0
        ?(Number.isInteger(sum)?sum.toLocaleString():sum.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}))
        :nonEmpty+'项';
}

function buildColumnSummaryFooter(rows,cols,showRowActions){
    let html='<tfoot><tr class="summary-footer-row">';
    html+='<td class="px-4 py-2 text-xs font-semibold text-text-secondary whitespace-nowrap">统计</td>';
    (cols||[]).forEach(function(col){
        html+='<td class="summary-cell px-4 py-2 text-xs whitespace-nowrap" data-summary-col="'+col.index+'"><span class="summary-value">'+esc(buildColumnSummaryValue(rows,col))+'</span></td>';
    });
    if(showRowActions)html+='<td class="summary-action-cell px-4 py-2 text-xs text-text-muted whitespace-nowrap" style="position:sticky;right:0;background:#F8FAFC">—</td>';
    html+='</tr></tfoot>';
    return html;
}

function openSimpleDeleteConfirm(id,rowIdx){
    const rowData=(rowIdx>=0&&_listData[id])?_listData[id][rowIdx]:null;
    const key=rowKey(rowData);
    if(!key){showToast(tr('请选择数据'));return;}
    const old=document.getElementById('simple-delete-confirm');
    if(old)old.remove();
    const overlay=document.createElement('div');
    overlay.id='simple-delete-confirm';
    overlay.className='fixed inset-0 bg-black/40 z-[90] flex items-center justify-center';
    const message=id==='fin-fee-mgmt'?'是否确认删除数据！！':'确实删除嘛';
    overlay.innerHTML='<div class="w-[320px] rounded-xl bg-white shadow-xl border border-surface-200 p-5"><div class="text-base font-semibold text-text-primary mb-2">'+tr('提示')+'</div><div class="text-sm text-text-secondary mb-5">'+message+'</div><div class="flex justify-end gap-2"><button type="button" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer" onclick="document.getElementById(\'simple-delete-confirm\').remove()">'+tr('取消')+'</button><button type="button" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer" onclick="confirmSimpleDelete(\''+esc(id)+'\',\''+esc(key)+'\')">'+tr('确认')+'</button></div></div>';
    document.body.appendChild(overlay);
}

function confirmSimpleDelete(id,key){
    if(!_deletedRowKeys[id])_deletedRowKeys[id]={};
    _deletedRowKeys[id][key]=true;
    const modal=document.getElementById('simple-delete-confirm');
    if(modal)modal.remove();
    showToast(tr('删除成功'));
    document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal||'');
}

function openSimpleCancelConfirm(id,rowIdx){
    const rowData=(rowIdx>=0&&_listData[id])?_listData[id][rowIdx]:null;
    const key=rowKey(rowData);
    if(!key){showToast(tr('请选择数据'));return;}
    const old=document.getElementById('simple-cancel-confirm');
    if(old)old.remove();
    const overlay=document.createElement('div');
    overlay.id='simple-cancel-confirm';
    overlay.className='fixed inset-0 bg-black/40 z-[90] flex items-center justify-center';
    overlay.innerHTML='<div class="w-[320px] rounded-xl bg-white shadow-xl border border-surface-200 p-5"><div class="text-base font-semibold text-text-primary mb-2">'+tr('提示')+'</div><div class="text-sm text-text-secondary mb-5">是否确认取消数据</div><div class="flex justify-end gap-2"><button type="button" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer" onclick="document.getElementById(\'simple-cancel-confirm\').remove()">'+tr('取消')+'</button><button type="button" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer" onclick="confirmSimpleCancel(\''+esc(id)+'\',\''+esc(key)+'\')">'+tr('确认')+'</button></div></div>';
    document.body.appendChild(overlay);
}

function confirmSimpleCancel(id,key){
    const rows=_listData[id]||[];
    const row=rows.find(function(r){return rowKey(r)===key;});
    const si=headerIndexByNames(id,['运单状态','状态']);
    if(row&&si>=0)setRowOverride(id,row,si,'已取消');
    const modal=document.getElementById('simple-cancel-confirm');
    if(modal)modal.remove();
    showToast(tr('取消成功'));
    document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal||'');
}

function esc(v){
    return String(v===undefined||v===null?'':v).replace(/[&<>"']/g,function(ch){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
}

function renderField(f){
    const rawLabel=String(f.label||'');
    const isRemarkTextarea=f.type==='textarea'&&rawLabel.includes('备注');
    const span=f.span||(isRemarkTextarea?'md:col-span-2 modal-remark-half':'');
    const label=tr(f.label);
    const required=f.required?'<span class="text-red-500 ml-1">*</span>':'';
    const placeholder=f.placeholder?tr(f.placeholder):(tr('请输入')+label);
    const fieldValue=f.value===undefined||f.value===null?'':(f.translateValue===false?String(f.value):tr(f.value));
    const attrs=(f.required?' required':'')+(f.readonly?' readonly':'');
    const idAttr=f.id?' id="'+esc(f.id)+'"':'';
    let input='';
    if(f.type==='select'){
        const eventAttrs=f.onchange?' onchange="'+f.onchange+'"':'';
        input='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"'+idAttr+attrs+eventAttrs+'>';
        input+='<option value="">'+tr('请选择')+'</option>';
        (f.options||[]).forEach(function(o){
            input+='<option value="'+esc(o)+'"'+(f.value===o?' selected':'')+'>'+esc(tr(o))+'</option>';
        });
        input+='</select>';
    }else if(f.type==='textarea'){
        const eventAttrs=(f.oninput?' oninput="'+f.oninput+'"':'')+(f.onblur?' onblur="'+f.onblur+'"':'')+(f.onchange?' onchange="'+f.onchange+'"':'');
        input='<textarea rows="'+(f.rows||3)+'" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-none" placeholder="'+esc(placeholder)+'"'+idAttr+attrs+eventAttrs+'>'+esc(fieldValue)+'</textarea>';
    }else if(f.type==='checkboxGroup'){
        input='<div class="grid grid-cols-2 gap-2 min-h-10 rounded-lg border border-surface-200 bg-surface-50 p-2">';
        (f.options||[]).forEach(function(o){
            const optionLabel=String(o||'').replace(/\(备注\)/g,'');
            const checked=((f.checkedOptions||[]).includes(o)||(f.checkedOptions||[]).includes(optionLabel))?' checked':'';
            const onCheck=f.onCheckAction?' onchange="'+f.onCheckAction+'"':'';
            const marker=(f.markerTooltip||f.markerAction)?'<span class="inline-flex w-4 h-4 items-center justify-center rounded-full bg-red-50 border border-red-200 text-[11px] font-bold leading-none text-red-600 cursor-help" title="'+esc(serviceChargeTooltip(optionLabel))+'">!</span>':'';
            input+='<label class="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600" data-cb-label="'+esc(optionLabel)+'"'+checked+onCheck+'><span>'+esc(tr(optionLabel))+'</span>'+marker+'</label>';
        });
        input+='</div>';
    }else if(f.type==='radioGroup'){
        const groupName=f.name||('radio-'+String(rawLabel).replace(/\s+/g,'-'));
        input='<div class="flex flex-wrap items-center gap-x-5 gap-y-2 min-h-10 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">';
        (f.options||[]).forEach(function(o,i){
            const checked=(f.value===o||(i===0&&(f.value===undefined||f.value===null||f.value==='')))?' checked':'';
            input+='<label class="inline-flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer"><input type="radio" name="'+esc(groupName)+'" value="'+esc(o)+'" class="border-surface-300 text-primary-600"'+checked+'><span>'+esc(tr(o))+'</span></label>';
        });
        input+='</div>';
    }else{
        const eventAttrs=(f.oninput?' oninput="'+f.oninput+'"':'')+(f.onblur?' onblur="'+f.onblur+'"':'')+(f.onchange?' onchange="'+f.onchange+'"':'');
        const listAttr=f.list?' list="'+esc(f.list)+'"':'';
        input='<input type="'+(f.type||'text')+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50'+(f.readonly?' cursor-not-allowed':'')+'" placeholder="'+esc(placeholder)+'" value="'+esc(fieldValue)+'"'+idAttr+attrs+listAttr+eventAttrs+'>';
    }
    return '<div data-field-label="'+esc(rawLabel)+'" class="'+span+' min-w-0 flex flex-col gap-1.5"><label title="'+esc(label)+'" class="text-sm font-medium text-text-secondary truncate">'+esc(label)+required+'</label>'+input+'</div>';
}

function modalFieldLabel(field){
    return field?(field.label||field.hd||field.name||''):'';
}

function isImportantRequiredField(label,id){
    const text=String(label||'');
    if(!text)return false;
    if(/备注|说明|描述|附件|图片|地址|电话|邮箱|人数|数量|范围|Remark|Note|Description|Attachment|Image|Address|Phone|Email|Remarque|Observação|Anexo|Imagem|Endereço|Telefone/.test(text))return false;
    if(/创建|修改|最后登录|操作时间|操作人|Created|Modified|Last Login|Operation|Créé|Modifié|Criado|Modificado/.test(text))return false;
    if(id==='perm-user'&&/密码|最后登录/.test(text))return false;
    return /编号|编码|代码|名称|姓名|状态|类型|客户|所属|仓库|货区|件数|重量|体积|目的港|运输方式|负责人|组长|币别|汇率|金额|费用|时间|日期|Code|No\.|Name|Status|Type|Customer|Warehouse|Zone|Pieces|Weight|Volume|Currency|Rate|Amount|Fee|Price|Date|Time|Client|Entrepôt|Statut|Devise|Montant|Preço|Tipo|Cliente|Armazém|Área|Moeda|Valor/.test(text);
}

function applyModalRequiredMarks(root,id,editable){
    if(!editable||!root)return;
    root.querySelectorAll('label').forEach(function(label){
        const text=String(label.textContent||'').replace('*','').trim();
        if(!isImportantRequiredField(text,id)||label.querySelector('[data-required-mark]'))return;
        label.insertAdjacentHTML('beforeend',' <span data-required-mark class="text-red-500">*</span>');
        const scope=label.parentElement||root;
        const field=scope.querySelector('input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]),select,textarea');
        if(field&&!field.disabled&&!field.readOnly)field.setAttribute('required','required');
    });
}

function markCustomModalRequired(id,mode){
    setTimeout(function(){applyModalRequiredMarks(document.getElementById('crud-modal-body'),id,mode!=='view');},0);
}

function modalLabelScore(label){
    const text=String(tr(label||''));
    let score=0;
    for(let i=0;i<text.length;i++){
        score+=text.charCodeAt(i)>255?2:1;
    }
    return score;
}

function modalNeedsFourColumns(fields){
    return (fields||[]).some(function(field){
        const label=modalFieldLabel(field);
        return modalLabelScore(label)>=14||
            field.type==='textarea'||
            field.type==='checkboxGroup'||
            String(field.span||'').includes('col-span');
    });
}

function modalGridColumnClass(fields,cols){
    if(cols==='modal'){
        return modalNeedsFourColumns(fields)?'md:grid-cols-4':'md:grid-cols-5';
    }
    return {1:'md:grid-cols-1',2:'md:grid-cols-2',3:'md:grid-cols-3',4:'md:grid-cols-4',5:'md:grid-cols-5',6:'md:grid-cols-6'}[cols||2]||'md:grid-cols-2';
}

function modalGridFullClass(fields,cols){
    return 'grid grid-cols-1 '+modalGridColumnClass(fields,cols||'modal')+' gap-x-5 gap-y-4';
}

function renderFields(fields,cols){
    const colClass=modalGridColumnClass(fields,cols);
    return '<div class="grid grid-cols-1 '+colClass+' gap-x-5 gap-y-4">'+fields.map(renderField).join('')+'</div>';
}

function getProductNameConfig(){
    const c=TC['cfg-product-name']||{};
    const headers=c.h||[];
    return {
        table:c,
        codeIdx:headers.indexOf('品名编号'),
        nameIdx:headers.indexOf('品名中文名')>=0?headers.indexOf('品名中文名'):1,
        enIdx:headers.indexOf('品名英文名'),
        frIdx:headers.indexOf('品名法文名'),
        categoryIdx:headers.indexOf('品名分类'),
        statusIdx:headers.indexOf('状态')
    };
}

function getProductNameRecords(){
    const cfg=getProductNameConfig();
    const rows=cfg.table.d||[];
    return rows.map(function(row){return {row:row,name:row[cfg.nameIdx]||'',category:row[cfg.categoryIdx]||'普货'};}).filter(function(item){return item.name;});
}

function productNameExists(name){
    const target=String(name||'').trim().toLowerCase();
    if(!target)return true;
    return getProductNameRecords().some(function(item){return item.name.trim().toLowerCase()===target;});
}

function nextProductNameCode(){
    const cfg=getProductNameConfig();
    const rows=cfg.table.d||[];
    let max=0;
    rows.forEach(function(row){
        const code=String(row[cfg.codeIdx]||'');
        const m=code.match(/(\d+)$/);
        if(m)max=Math.max(max,parseInt(m[1],10));
    });
    return 'PN'+String(max+1).padStart(3,'0');
}

function ensureProductNameInLibrary(name){
    const value=String(name||'').trim();
    if(!value||productNameExists(value))return false;
    const cfg=getProductNameConfig();
    if(!cfg.table.d)cfg.table.d=[];
    const len=dataHeaders(cfg.table).length||6;
    const row=new Array(len).fill('');
    if(cfg.codeIdx>=0)row[cfg.codeIdx]=nextProductNameCode();
    if(cfg.nameIdx>=0)row[cfg.nameIdx]=value;
    if(cfg.enIdx>=0)row[cfg.enIdx]=value;
    if(cfg.frIdx>=0)row[cfg.frIdx]=value;
    if(cfg.categoryIdx>=0)row[cfg.categoryIdx]='普货';
    if(cfg.statusIdx>=0)row[cfg.statusIdx]='启用';
    cfg.table.d.push(row);
    refreshProductNameDatalist();
    return true;
}

function refreshProductNameDatalist(keyword){
    const list=document.getElementById('product-name-options');
    if(!list)return;
    const kw=String(keyword||'').trim().toLowerCase();
    const records=getProductNameRecords().filter(function(item){return !kw||item.name.toLowerCase().includes(kw);});
    list.innerHTML=records.map(function(item){return '<option value="'+esc(item.name)+'">'+esc(tr(item.category))+'</option>';}).join('');
}

function productNameDatalistHtml(){
    return '<datalist id="product-name-options">'+getProductNameRecords().map(function(item){return '<option value="'+esc(item.name)+'">'+esc(tr(item.category))+'</option>';}).join('')+'</datalist>';
}

function getShipmentCustomerRecords(){
    const c=TC['crm-cust']||{};
    const headers=c.h||[];
    const codeIdx=headers.indexOf('客户代码');
    const shortIdx=headers.indexOf('客户简称');
    const fullIdx=headers.indexOf('客户全称');
    const salesIdx=headers.indexOf('所属业务员');
    const serviceIdx=headers.indexOf('所属客服');
    return (c.d||[]).map(function(row){
        return {
            code:codeIdx>=0?(row[codeIdx]||''):'',
            shortName:shortIdx>=0?(row[shortIdx]||''):'',
            fullName:fullIdx>=0?(row[fullIdx]||''):'',
            sales:salesIdx>=0?(row[salesIdx]||''):'',
            service:serviceIdx>=0?(row[serviceIdx]||''):''
        };
    }).filter(function(item){return item.code;});
}

function defaultShipmentCustomer(){
    return getShipmentCustomerRecords()[0]||{code:'C10001',shortName:'华运达国际货运',fullName:'深圳市华运达国际货运代理有限公司',sales:'',service:''};
}

function shipmentCustomerDatalistHtml(){
    return '<datalist id="shipment-customer-code-options">'+getShipmentCustomerRecords().map(function(item){
        const name=item.fullName||item.shortName;
        return '<option value="'+esc(item.code)+'">'+esc(name)+'</option>';
    }).join('')+'</datalist>';
}

function getShipmentSenderRecords(){
    const c=TC['base-sender']||{};
    const headers=c.h||[];
    const companyIdx=headers.indexOf('联系公司');
    const contactIdx=headers.indexOf('联系人');
    const phoneIdx=headers.indexOf('联系电话');
    const addrIdx=headers.indexOf('地址');
    return (c.d||[]).map(function(row){
        return {
            contact:contactIdx>=0?(row[contactIdx]||''):'',
            company:companyIdx>=0?(row[companyIdx]||''):'',
            phone:phoneIdx>=0?(row[phoneIdx]||''):'',
            address:addrIdx>=0?(row[addrIdx]||''):''
        };
    }).filter(function(item){return item.contact;});
}

function shipmentSenderDatalistHtml(){
    return '<datalist id="shipment-sender-options">'+getShipmentSenderRecords().map(function(item){
        const hint=[item.company,item.phone].filter(Boolean).join(' · ');
        return '<option value="'+esc(item.contact)+'">'+esc(hint)+'</option>';
    }).join('')+'</datalist>';
}

function fillShipmentSenderInfo(inputEl){
    const v=String((inputEl&&inputEl.value)||'').trim();
    if(!v)return;
    const records=getShipmentSenderRecords();
    const found=records.find(function(r){return r.contact===v;});
    if(!found)return;
    const cInp=document.getElementById('shipment-sender-company');
    const pInp=document.getElementById('shipment-sender-phone');
    const aInp=document.getElementById('shipment-sender-address');
    if(cInp){cInp.value=found.company;}
    if(pInp){pInp.value=found.phone;}
    if(aInp){aInp.value=found.address;}
    if(typeof showToast==='function')showToast(tr('已带出发件人信息')+'：'+found.contact);
}

function handleCargoNameInput(input){
    refreshProductNameDatalist(input.value);
    const value=String(input.value||'').trim().toLowerCase();
    const record=getProductNameRecords().find(function(item){return item.name.trim().toLowerCase()===value;});
    if(record){
        const typeSelect=input.closest('tr').querySelector('.cargo-type');
        if(typeSelect&&Array.from(typeSelect.options).some(function(opt){return opt.value===record.category||opt.text===record.category;})){
            typeSelect.value=record.category;
        }
    }
}

function handleCargoNameCommit(input){
    const value=String(input.value||'').trim();
    if(!value)return;
    if(ensureProductNameInLibrary(value)){
        showToast(tr('品名库已自动新增')+'：'+value);
    }
}

function inferWarehouseCargoCategory(name){
    const value=String(name||'').trim();
    if(!value)return '';
    const lower=value.toLowerCase();
    const rules=[
        {category:'电子产品',words:['电子','电器','小家电','手机','电脑','电池','充电','耳机','电子配件']},
        {category:'服装鞋帽',words:['服装','衣服','衣','鞋','帽','箱包','纺织','布料']},
        {category:'五金工具',words:['五金','工具','螺丝','金属','扳手','五金配件']},
        {category:'家居用品',words:['家居','家具','厨具','餐具','日用品','灯具']},
        {category:'食品',words:['食品','零食','茶叶','饮料','罐头']},
        {category:'化妆品',words:['化妆','护肤','香水','面膜','口红']}
    ];
    for(const rule of rules){
        if(rule.words.some(function(word){return lower.indexOf(word.toLowerCase())>=0;}))return rule.category;
    }
    const record=getProductNameRecords().find(function(item){return item.name.trim().toLowerCase()===lower;});
    if(record){
        return rules.find(function(rule){return rule.words.some(function(word){return record.name.indexOf(word)>=0;});})?.category||'其他';
    }
    return '';
}

function handleWarehouseProductNameInput(input){
    refreshProductNameDatalist(input.value);
    const category=inferWarehouseCargoCategory(input.value);
    const form=input.closest('form')||document;
    const select=form.querySelector('[data-field-label="品名大类"] select');
    if(select&&category&&Array.from(select.options).some(function(opt){return opt.value===category;})){
        select.value=category;
    }
}

function fieldSelectOptions(id,hd,c){
    if(c&&c.fieldOptions&&c.fieldOptions[hd])return c.fieldOptions[hd];
    if(id==='wh-no-pre-in'&&hd==='所属客户')return getNoPreCustomerOptions();
    if(id==='wh-no-pre-in'&&hd==='所属业务员')return getNoPreSalesOptions();
    if(id==='wh-no-pre-in'&&hd==='到货仓库')return getWarehouseNameOptions();
    if(hd==='用户类型')return ['客户','员工'];
    if(hd==='所属终端')return ['客户端','管理端','移动端'];
    if(hd==='所属仓库')return ['深圳盐田仓','广州南沙仓','上海浦东仓','义乌仓'];
    if(hd==='所属分公司'||hd==='使用分公司')return ['武汉分部','广州业务分部','广州散货操作分部','义乌分部','宁波分部','深圳总部业务客服部','塞内加尔分部','科特迪瓦分部','尼日利亚分部','加纳分部','喀麦隆分部'];
    if(hd==='使用客户')return ['深圳市华运达国际货运','广州远洋进出口贸易','东莞市鑫海物流','上海锦程国际贸易'];
    if(hd==='所属国家'||hd==='国家')return ['CN 中国','US 美国','GB 英国','DE 德国','NL 荷兰','FR 法国','NG 尼日利亚','CI 科特迪瓦','SN 塞内加尔','GH 加纳','CM 喀麦隆','BJ 贝宁','TG 多哥','LR 利比里亚','GN 几内亚','SL 塞拉利昂','MR 毛里塔尼亚','GMB 冈比亚'];
    if(hd==='所属省/州'||hd==='所属州省')return ['广东省','浙江省','江苏省','Lagos State','Greater Accra','Abidjan District','Dakar Region','Littoral'];
    if(hd==='港口类型'||hd==='港口机场类型')return ['海港','空港','铁路站','内陆港'];
    if(hd==='所属城市')return ['深圳','广州','上海','宁波','Lagos','Abidjan','Dakar','Accra','Douala','Tema','Lome','Cotonou'];
    if(hd==='负责人')return ['张伟','李强','Mike Chen','王明辉','刘晓东','张建国','赵雅琴','李明辉','陈志远','周丽'];
    if(hd==='所属总部')return ['集团总部'];
    if(hd==='所属大区')return ['中国区域管理中心','非洲海外区域中心'];
    if(hd==='所属部门')return ['财务部','人事行政部','商务部','操作部','订舱部','散货客服部','客服部','业务部'];
    if(hd==='仓库类型')return ['自有仓','租赁仓','合作仓','海外仓'];
    if(hd==='运输方式')return ['海运','空运','铁路','快递'];
    if(hd==='销售产品')return ['西非海运普货','空运敏感货','带电产品','普货快线'];
    if(hd==='费用类型')return ['运费','附加费','报关费','仓储费','文件费','其他'];
    if(hd==='问题件类型')return ['库内问题件','库外问题件'];
    if(hd==='操作类型')return ['补货','落货','换托','换柜'];
    if(hd==='适用运输方式')return ['海运','空运','铁路','快递'];
    if(hd==='生成方式')return ['按托盘汇总','按袋号汇总','按运单汇总','按客户汇总'];
    if(hd==='柜型'||hd==='柜型柜量')return ['20GP','40GP','40HQ','45HQ','20GP×1','40HQ×1','20GP×2','40HQ×2'];
    if(hd==='始发港'||hd==='起运港')return ['深圳盐田','广州南沙','上海洋山','宁波舟山','青岛港'];
    if(hd==='目的港')return ['拉各斯','达喀尔','阿比让','特马','杜阿拉','洛美','科托努'];
    if(hd==='币别'||hd==='币种')return ['USD','CNY','EUR','XOF','NGN'];
    if(hd==='报价字段')return ['成本价+附加费+加价','海运费+附加费','海运费+文件费+THC','成本价+利润'];
    if(hd==='通知方式')return ['企业微信','邮件','短信','站内信'];
    if(hd==='阅读状态')return ['未读','已读'];
    if(hd==='申诉状态')return ['无需申诉','待申诉','申诉中','申诉成功','申诉失败'];
    if(hd==='标记状态')return ['未标记','已标记','重点跟进'];
    if(hd==='认证方式')return ['OAuth2','Token','Basic Auth','签名认证'];
    if(hd==='船司'||hd==='船公司')return ['MAERSK','COSCO','MSC','CMA CGM','Hapag-Lloyd'];
    if(hd==='报关方式')return ['买单报关','客户抬头','一般贸易','转关'];
    if(hd==='订仓方式')return ['EDI','官网','邮件','人工'];
    if(hd==='接口类型')return ['EDI','API','邮件解析','手工导入'];
    if(hd==='启用状态')return ['启用','禁用'];
    if(hd==='是否调整')return ['是','否'];
    if(hd==='重算标识')return ['正常重算','不重算'];
    if(hd==='品名大类')return ['电子产品','服装鞋帽','五金工具','家居用品','食品','化妆品','其他'];
    if(hd==='风控级别')return ['低风险','中风险','高风险','严重'];
    if(hd==='生成工单')return ['是','否'];
    if(hd==='风控环节')return ['订单预报','收货操作','出库操作'];
    if(hd==='上级部门')return ['—','销售部','操作部','财务部','客服部','行政部','IT部'];
    if(hd==='部门负责人')return ['王明辉','张伟','赵雅琴','周丽','李明辉','刘晓东'];
    if(hd==='组长')return ['王明辉','刘晓东','张伟','陈志远','周丽'];
    if(hd==='启用状态')return ['启用','禁用'];
    if(hd==='是否启用')return ['是','否'];
    if(hd==='币别编号')return ['CNY 人民币','USD 美元','EUR 欧元','GBP 英镑','HKD 港币'];
    if(hd==='科目类型')return ['资产类','负债类','所有者权益类','成本类','损益类'];
    if(hd==='一级科目')return ['—','1001','1002','1122','2001','2202','3001','4001','5001','6001'];
    if(hd==='品名分类')return ['普货','敏感货','危险品','带电货','液体','粉末','电池','食品','化妆品','药品','纺织品','木材','石材','陶瓷','玻璃','金属制品','塑料制品','纸制品','橡胶制品','皮革制品'];
    return null;
}

function shouldEnhanceClear(el){
    if(!el||el.dataset.clearEnhanced==='1'||el.readOnly||el.disabled)return false;
    if(el.tagName==='TEXTAREA')return true;
    if(el.tagName!=='INPUT')return false;
    const type=(el.type||'text').toLowerCase();
    return !['checkbox','radio','hidden','file','button','submit','reset','range','color'].includes(type);
}

function updateClearButton(input){
    const wrapper=input.closest('.clearable-field');
    if(!wrapper)return;
    wrapper.classList.toggle('has-value',!!input.value);
}

function enhanceClearableInputs(root){
    (root||document).querySelectorAll('input,textarea').forEach(function(input){
        if(!shouldEnhanceClear(input))return;
        const wrapper=document.createElement('span');
        wrapper.className='clearable-field'+(input.classList.contains('w-full')?' w-full':'');
        input.parentNode.insertBefore(wrapper,input);
        wrapper.appendChild(input);
        input.dataset.clearEnhanced='1';
        if(!input.classList.contains('pr-8'))input.classList.add('pr-8');
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='input-clear-btn';
        btn.innerHTML='&times;';
        btn.title=tr('清空');
        btn.setAttribute('aria-label',tr('清空'));
        btn.addEventListener('click',function(e){
            e.preventDefault();
            e.stopPropagation();
            input.value='';
            input.dispatchEvent(new Event('input',{bubbles:true}));
            input.dispatchEvent(new Event('change',{bubbles:true}));
            input.focus();
            updateClearButton(input);
        });
        input.addEventListener('input',function(){updateClearButton(input);});
        input.addEventListener('change',function(){updateClearButton(input);});
        wrapper.appendChild(btn);
        updateClearButton(input);
    });
}

function refreshClearButtonLang(root){
    (root||document).querySelectorAll('.input-clear-btn').forEach(function(btn){
        btn.title=tr('清空');
        btn.setAttribute('aria-label',tr('清空'));
    });
}

function applyRuntimeEnhancements(root){
    const scope=root||document;
    enhanceClearableInputs(scope);
    translateDom(scope);
    translateElementAttributes(scope);
    refreshClearButtonLang(scope);
    if(window.InlineEditor&&window.InlineEditor.enabled)window.InlineEditor.reapply(scope);
}

function setupRuntimeEnhancements(){
    if(window._runtimeEnhancerReady)return;
    window._runtimeEnhancerReady=true;
    applyRuntimeEnhancements(document);
    new MutationObserver(function(records){
        records.forEach(function(record){
            record.addedNodes.forEach(function(node){
                if(node.nodeType===1)applyRuntimeEnhancements(node);
            });
        });
    }).observe(document.body,{childList:true,subtree:true});
}

function getSelectedRowIndex(){
    const checked=document.querySelector('.row-check:checked');
    return checked?parseInt(checked.value,10):-1;
}

function openSelectedCrud(mode,id){
    const idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    openCrudModal(mode,id,idx);
}

function renderToolbarAction(action,id){
    const isDanger=action.key==='enable'||action.key==='delete'||action.key==='cancel'||action.key==='csRevokeRelease'||action.key==='setDisable'||action.key==='batchDelete'||action.variant==='danger';
    const isSuccess=action.variant==='success';
    const color=isSuccess
        ?'text-white bg-green-500 hover:bg-green-600'
        :isDanger
        ?'text-white bg-red-500 hover:bg-red-600'
        :'text-white bg-blue-600 hover:bg-blue-700';
    if(action.dropdown){
        var ddMenuId='tbdd-'+id+'-'+action.key;
        var ddItems=action.dropdown.map(function(it){return '<button type="button" onclick="'+it.onclick+'" class="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-primary-50 hover:text-primary-600 cursor-pointer whitespace-nowrap">'+esc(tr(it.label))+'</button>';}).join('');
        var ddWidth=action.fixedWidth?'width:'+(action.width||'104px'):'min-width:'+(action.width||'96px');
        return '<div class="relative inline-block"><button type="button" onclick="toggleToolbarDropdown(event,\''+ddMenuId+'\')" class="toolbar-action font-medium rounded-lg cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap '+color+'" style="'+ddWidth+'">'+esc(tr(action.label))+' <span class="text-[10px]">▾</span></button><div id="'+ddMenuId+'" class="hidden absolute left-0 top-full mt-1 z-40 min-w-[140px] bg-white border border-surface-200 rounded-lg shadow-lg py-1">'+ddItems+'</div></div>';
    }
    let click='';
    if(id==='fin-fee-mgmt'&&action.type==='add')click='openFeeMgmtFeeModal(\'add\',\''+id+'\',-1)';
    else if(id==='fin-fee-mgmt'&&action.type==='edit')click='openSelectedFeeMgmtEdit(\''+id+'\')';
    else if(id==='ow-pickup'&&action.type==='add')click='openOverseasPickupCreate()';
    else if(action.key==='pickupEdit')click='openSelectedPickupEdit(\''+id+'\')';
    else if(action.key==='pickupManualRelease')click='openOverseasPickupManualRelease(\''+id+'\')';
    else if(action.key==='invManualCount')click='openOverseasInventoryManualCount(\''+id+'\')';
    else if(action.key==='approvalAudit')click='openSelectedApprovalAudit(\''+id+'\')';
    else if(id==='ow-outbound'&&action.type==='add')click='openOverseasOutboundCreate()';
    else if(action.type==='add')click='openCrudModal(\'add\',\''+id+'\',-1)';
    else if(action.type==='edit')click='openSelectedCrud(\'edit\',\''+id+'\')';
    else if(action.type==='view')click='openSelectedCrud(\'view\',\''+id+'\')';
    else if(action.key==='search')click='runListSearch(\''+id+'\')';
    else if(action.key==='addWaybill'&&id==='wb-manage')click='navigateToTab(\'waybill\',\'wb-special\')';
    else if(action.key==='addWaybill'&&id==='wb-client-manage')click='navigateToTab(\'waybill-client\',\'wb-client-special\')';
    else if(action.key==='enable')click='toggleEnableDisable(\''+id+'\')';
    else if(action.key==='toFormal')click='convertSelectedDraftOrders(\''+id+'\')';
    else if(action.key==='export')click='exportData(\''+id+'\')';
    else if(action.key==='copy')click='openSelectedCrud(\'copy\',\''+id+'\')';
    else if(action.key==='copyWaybill')click='openActionModal(\'copyWaybill\',\''+id+'\',-1)';
    else if(action.key==='labelPrint'&&['wh-loading-list','wh-parcel-out','wh-air-arrival-scan'].includes(id))click='printSelectedLabels(\''+id+'\')';
    else if(action.key==='finalAllocAdjust')click='openFinalAllocAdjustModal(\''+id+'\')';
    else if(action.key==='finalAllocLinkBL')click='openFinalAllocLinkBLModal(\''+id+'\')';
    else if(action.key==='finalAllocDelete')click='deleteFinalAllocSelected(\''+id+'\')';
    else if(action.key==='finalAllocRename')click='openFinalAllocRenameModal(\''+id+'\')';
    else if(action.key==='finalAllocAutoReplenish')click='runFinalAllocAutoReplenish(\''+id+'\')';
    else if(action.key==='outboundAdjust')click='openOutboundAdjustModal(\''+id+'\')';
    else if(action.key==='businessConfirm')click='openWaybillBusinessConfirmModal(\''+id+'\')';
    else if(action.key==='csAdd')click='openCsIssueAddModal(\''+id+'\')';
    else if(action.key==='csFeedback')click='openCsIssueFeedbackModal(\''+id+'\',\'cs-reply\')';
    else if(action.key==='csReplyForCust')click='openCsIssueFeedbackModal(\''+id+'\',\'cust-on-behalf\')';
    else if(action.key==='csCustReply')click='openCsIssueFeedbackModal(\''+id+'\',\'cust-reply\')';
    else if(action.key==='csRelease')click='openCsIssueFeedbackModal(\''+id+'\',\'release\')';
    else if(action.key==='csReturn')click='openCsIssueReturnModal(\''+id+'\')';
    else if(action.key==='csRevokeRelease')click='openCsIssueRevokeReleaseConfirm(\''+id+'\')';
    else if(action.key==='labelAdd')click='openLabelTemplateModal(\'add\',\''+id+'\',-1)';
    else if(action.key==='labelEdit')click='openSelectedLabelTemplateEdit(\''+id+'\')';
    else if(action.key==='setEnable')click='setRowsStatus(\''+id+'\',\'启用\')';
    else if(action.key==='setDisable')click='setRowsStatus(\''+id+'\',\'禁用\')';
    else if(action.key==='batchDelete')click='deleteSelectedRows(\''+id+'\')';
    else if(action.key==='voidRows')click='voidSelectedRows(\''+id+'\')';
    else if(action.key==='setStatus')click='setRowsStatus(\''+id+'\',\''+(action.status||'启用')+'\')';
    else if(action.key==='labelFieldDoc')click='openLabelFieldDocModal()';
    else if(action.key==='newSortScan')click='openSortBagRuleModal(\''+id+'\')';
    else if(action.key==='editCodingRule')click='openCodingRuleEditModal(\''+id+'\')';
    else if(action.key==='genBill'&&id==='fcl-bill-entry')click='showToast(\''+esc(tr('账单生成成功'))+'\')';
    else if(action.key==='genBill'&&id==='fin-fee-mgmt')click='openFeeMgmtGenBillModal(\''+id+'\')';
    else if(action.key==='trackMapping')click='showToast(\''+esc(tr('轨迹映射配置'))+'\')';
    else if(action.key==='subOrderInfo')click='openSubOrderInfoModal(\''+id+'\')';
    else if(action.key==='owViewCode')click='openSelectedOverseasOutboundCode(\''+id+'\')';
    else if(action.key==='viewWaybillDetail')click='openSelectedWaybillDetail(\''+id+'\')';
    else if(action.key==='cancelWaybill')click='cancelSelectedWaybill(\''+id+'\')';
    else if(action.key==='voucherDetail')click='bankVoucherAction(\'detail\',\''+id+'\')';
    else if(action.key==='voucherClaim')click='bankVoucherAction(\'claim\',\''+id+'\')';
    else if(action.key==='voucherUnclaim')click='bankVoucherAction(\'unclaim\',\''+id+'\')';
    else if(action.key==='voucherRate')click='bankVoucherAction(\'rate\',\''+id+'\')';
    else if(action.key==='voucherRemark')click='bankVoucherAction(\'remark\',\''+id+'\')';
    else if(action.key==='voucherVoid')click='bankVoucherAction(\'void\',\''+id+'\')';
    else click='openActionModal(\''+action.key+'\',\''+id+'\',-1)';
    const widthStyle=action.fixedWidth?'width:'+(action.width||'104px'):'min-width:'+(action.width||'96px');
    return '<button onclick="'+click+'" class="toolbar-action font-medium rounded-lg cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap '+color+'" style="'+widthStyle+'">'+esc(tr(action.label))+'</button>';
}

function toggleToolbarDropdown(e,menuId){
    if(e)e.stopPropagation();
    var menu=document.getElementById(menuId);
    if(!menu)return;
    var open=menu.classList.contains('hidden');
    closeToolbarDropdowns();
    if(open)menu.classList.remove('hidden');
}

function closeToolbarDropdowns(){
    document.querySelectorAll('[id^="tbdd-"]').forEach(function(m){m.classList.add('hidden');});
}

function tbDropdownAction(action,id){
    closeToolbarDropdowns();
    if(action.indexOf('modify-')===0){openWaybillModifyModal(action.slice(7),id);return;}
    openActionModal(action,id,-1);
}

function openWaybillModifyModal(field,id){
    var idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    var rowData=(_listData[id]&&_listData[id][idx])?_listData[id][idx]:((TC[id]&&TC[id].d)?TC[id].d[idx]:null);
    function cv(name){var h=(TC[id]&&TC[id].h)||[];var i=h.indexOf(name);return (i>=0&&rowData)?(rowData[i]||''):'';}
    var titleEl=document.getElementById('crud-modal-title');
    var bodyEl=document.getElementById('crud-modal-body');
    var footerEl=document.getElementById('crud-modal-footer');
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='50%';
    var titleMap={pieces:'修改件数',bizRemark:'修改业务备注',innerRemark:'修改内部备注',service:'修改附加服务',product:'修改产品',customer:'修改客户',cargoType:'修改货物类型',billingWeight:'修改计费重'};
    titleEl.textContent=tr(titleMap[field]||'运单修改');
    var inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    var taCls='w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y';
    var wbNo=cv('运单号');
    var html='<div class="text-xs text-text-secondary bg-surface-50 border border-surface-100 rounded-lg px-3 py-2 mb-4">'+tr('当前运单')+'：<span class="font-medium text-text-primary">'+esc(wbNo||'—')+'</span></div>';
    if(field==='pieces'){
        html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('件数')+'</label><input type="number" min="0" class="'+inputCls+'" value="'+esc(cv('件数'))+'"></div>';
    }else if(field==='bizRemark'){
        html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('业务备注')+'</label><textarea rows="4" class="'+taCls+'" placeholder="'+esc(tr('请输入业务备注'))+'"></textarea></div>';
    }else if(field==='innerRemark'){
        html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('内部备注')+'</label><textarea rows="4" class="'+taCls+'" placeholder="'+esc(tr('请输入内部备注'))+'"></textarea></div>';
    }else if(field==='service'){
        html+='<div><label class="text-sm font-medium text-text-secondary mb-2 block">'+tr('附加服务')+'</label><div class="flex flex-wrap gap-x-6 gap-y-2">';
        ['报关','合并报关','拆分报关','带电','带磁','贴箱唛'].forEach(function(s){html+='<label class="inline-flex items-center gap-2 text-sm text-text-secondary cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600"><span>'+tr(s)+'</span></label>';});
        html+='</div></div>';
    }else if(field==='product'){
        html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('产品')+'</label><select class="'+inputCls+'">'+selectOptionsHtml(['西非海运专线','西非空运专线'],cv('产品名称')||cv('所属产品'))+'</select></div>';
    }else if(field==='customer'){
        html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('客户')+'</label><input list="crm-customer-options" class="'+inputCls+'" value="'+esc(cv('客户名称'))+'" placeholder="'+esc(tr('输入客户代码/名称模糊筛选'))+'">'+(typeof crmCustomerDatalistHtml==='function'?crmCustomerDatalistHtml():'')+'</div>';
    }else if(field==='cargoType'){
        html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('货物类型')+'</label><select class="'+inputCls+'">'+selectOptionsHtml(['普货','敏感货'],cv('货物类型')||'普货')+'</select></div>';
    }else if(field==='billingWeight'){
        html+='<div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('计费重量(KG)')+'</label><input type="number" min="0" step="0.01" class="'+inputCls+'" value="'+esc(cv('重量'))+'"></div><div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('计费体积(CBM)')+'</label><input type="number" min="0" step="0.001" class="'+inputCls+'" value="'+esc(cv('体积'))+'"></div></div>';
    }
    bodyEl.innerHTML=html;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('修改成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认修改')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openSelectedWaybillDetail(id){
    var idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    openWaybillDetail(id,idx);
}

function cancelSelectedWaybill(id){
    var idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    openSimpleCancelConfirm(id,idx);
}

function openSubOrderInfoModal(id){
    var idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    var rowData=(_listData[id]&&_listData[id][idx])?_listData[id][idx]:((TC[id]&&TC[id].d)?TC[id].d[idx]:null);
    var hdr=(TC[id]&&TC[id].h)||[];
    var wi=hdr.indexOf('运单号');
    var wbNo=(wi>=0&&rowData)?(rowData[wi]||''):'';
    var subs=[
        {no:wbNo+'-001',l:'55',w:'42',ht:'38',wt:'18.4',vol:'0.088'},
        {no:wbNo+'-002',l:'48',w:'36',ht:'30',wt:'12.5',vol:'0.052'},
        {no:wbNo+'-003',l:'40',w:'30',ht:'25',wt:'8.0',vol:'0.030'}
    ];
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='64%';
    document.getElementById('crud-modal-title').textContent=tr('子单信息')+' - '+(wbNo||'');
    var html='<div class="border border-surface-200 rounded-lg overflow-auto"><table class="w-full text-sm"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    ['#','子单号','长(CM)','宽(CM)','高(CM)','重量(KG)','体积(CBM)'].forEach(function(c){html+='<th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    html+='</tr></thead><tbody>';
    subs.forEach(function(s,i){
        html+='<tr class="border-t border-surface-100 hover:bg-primary-50/30"><td class="px-3 py-2.5 text-text-muted">'+(i+1)+'</td><td class="px-3 py-2.5 font-medium text-primary-700 whitespace-nowrap">'+esc(s.no)+'</td><td class="px-3 py-2.5 text-text-secondary">'+esc(s.l)+'</td><td class="px-3 py-2.5 text-text-secondary">'+esc(s.w)+'</td><td class="px-3 py-2.5 text-text-secondary">'+esc(s.ht)+'</td><td class="px-3 py-2.5 font-semibold text-blue-700">'+esc(s.wt)+'</td><td class="px-3 py-2.5 font-semibold text-blue-700">'+esc(s.vol)+'</td></tr>';
    });
    html+='</tbody></table></div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function getToolbarActions(id){
    if(id==='cfg-country'||id==='cfg-province'||id==='cfg-city'||id==='cfg-port'||id==='cfg-risk'||id==='perm-wh'||id==='perm-dept'||id==='perm-team'||id==='perm-hq'||id==='perm-region'||id==='perm-branch'||id==='cfg-account'||id==='cfg-i18n'||id==='perm-menu'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {type:'view',label:'查看详情'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='perm-log'||id==='wb-op-instruction'){
        return [{key:'search',label:'查询数据',variant:'primary'}];
    }
    if(id==='cs-issue-type'){
        return [
            {key:'search',label:'查询',variant:'primary'},
            {type:'add',label:'新增',variant:'primary'},
            {type:'edit',label:'修改'},
            {key:'setEnable',label:'启用',variant:'success'},
            {key:'setDisable',label:'禁用'}
        ];
    }
    if(id==='biz-track-cfg'){
        return [
            {key:'search',label:'查询',variant:'primary'},
            {type:'add',label:'新增轨迹',variant:'primary'},
            {type:'edit',label:'更新轨迹'},
            {key:'trackMapping',label:'轨迹映射'}
        ];
    }
    if(id==='biz-msg-flow'||id==='biz-approval-flow'){
        return [
            {key:'search',label:'查询',variant:'primary'},
            {type:'add',label:'新增',variant:'primary'},
            {type:'edit',label:'修改'},
            {key:'setEnable',label:'启用',variant:'success'},
            {key:'setDisable',label:'禁用'},
            {key:'batchDelete',label:'删除'}
        ];
    }
    if(id==='fin-bank-account'||id==='fin-account'){
        return [
            {key:'search',label:'查询',variant:'primary'},
            {type:'add',label:'新增',variant:'primary'},
            {type:'edit',label:'修改'},
            {key:'setEnable',label:'启用',variant:'success'},
            {key:'setDisable',label:'禁用'}
        ];
    }
    if(id==='fin-rate'){
        return [
            {key:'search',label:'查询',variant:'primary'},
            {type:'add',label:'新增',variant:'primary'},
            {type:'edit',label:'修改'},
            {key:'batchDelete',label:'批量删除汇率',variant:'danger'}
        ];
    }
    if(id==='fin-bank-voucher'||id==='fin-ar-receipt'){
        return [
            {key:'search',label:'查询',variant:'primary'},
            {type:'add',label:'新增',variant:'primary'},
            {type:'edit',label:'修改'},
            {key:'voucherDetail',label:'详情'},
            {key:'voucherClaim',label:'认领',variant:'success'},
            {key:'voucherUnclaim',label:'撤销认领',variant:'danger'},
            {key:'voucherRate',label:'修改汇率'},
            {key:'voucherRemark',label:'修改财务备注'},
            {key:'voucherVoid',label:'凭证作废',variant:'danger'}
        ];
    }
    if(id==='base-provider'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {type:'view',label:'查看详情'},
            {key:'enable',label:'启用/禁用'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='base-employee'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {type:'view',label:'查看详情'},
            {key:'resetPwd',label:'重置密码'},
            {key:'pagePerm',label:'页面权限'},
            {key:'dataPerm',label:'数据权限'},
            {key:'enable',label:'启用/停用'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='base-sender'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {type:'view',label:'查看详情'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='crm-cust'||id==='base-cust'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {type:'view',label:'查看详情'},
            {key:'enable',label:'启用/禁用'},
            {key:'resetPwd',label:'重置密码'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-final-alloc'){
        return [
            {key:'search',label:'查询',variant:'primary'},
            {type:'add',label:'新增',variant:'primary'},
            {key:'finalAllocAdjust',label:'调整',variant:'primary'},
            {key:'finalAllocLinkBL',label:'关联提单'},
            {key:'finalAllocDelete',label:'删除',variant:'danger'},
            {key:'export',label:'导出'}
        ];
    }
    if(id==='wb-manage'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'addWaybill',label:'新增数据',variant:'primary'},
            {key:'viewWaybillDetail',label:'查看详情',variant:'primary'},
            {key:'businessConfirm',label:'业务确认',variant:'primary'},
            {key:'declareOps',label:'报关操作',dropdown:[
                {label:'合并报关',onclick:"tbDropdownAction('mergeDeclare','wb-manage')"},
                {label:'拆分报关',onclick:"tbDropdownAction('splitDeclare','wb-manage')"},
                {label:'单独报关',onclick:"tbDropdownAction('singleDeclare','wb-manage')"}
            ]},
            {key:'waybillModify',label:'运单修改',dropdown:[
                {label:'件数',onclick:"tbDropdownAction('modify-pieces','wb-manage')"},
                {label:'业务备注',onclick:"tbDropdownAction('modify-bizRemark','wb-manage')"},
                {label:'内部备注',onclick:"tbDropdownAction('modify-innerRemark','wb-manage')"},
                {label:'附加服务',onclick:"tbDropdownAction('modify-service','wb-manage')"},
                {label:'产品',onclick:"tbDropdownAction('modify-product','wb-manage')"},
                {label:'客户',onclick:"tbDropdownAction('modify-customer','wb-manage')"},
                {label:'货物类型',onclick:"tbDropdownAction('modify-cargoType','wb-manage')"},
                {label:'计费重',onclick:"tbDropdownAction('modify-billingWeight','wb-manage')"}
            ]},
            {key:'subOrderInfo',label:'子单信息'},
            {key:'labelPrint',label:'标签打印'},
            {key:'mergeBilling',label:'合并计费'},
            {key:'specialPrice',label:'特价申请'},
            {key:'sendInstruction',label:'发送指令'},
            {key:'manualFreight',label:'手改运费'},
            {key:'cancelWaybill',label:'去掉订单',variant:'danger'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wb-client-list'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wb-client-manage'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'addWaybill',label:'新增数据',variant:'primary'},
            {key:'toFormal',label:'转为正式单'},
            {key:'labelPrint',label:'标签打印'},
            {key:'workOrder',label:'新增工单'},
            {key:'copyWaybill',label:'复制运单'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='fin-fee-mgmt'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {key:'opAudit',label:'操作审核'},
            {key:'overseasConfirm',label:'海外确认'},
            {key:'financeAudit',label:'财务审核'},
            {key:'genBill',label:'生成账单'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='fin-bill-mgmt'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'billDetail',label:'查询详情'},
            {key:'genPdf',label:'下载PDF'}
        ];
    }
    if(id==='pda-app'){
        return [
            {key:'pdaLogin',label:'PDA登录',variant:'primary'},
            {key:'sync',label:'同步数据'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-no-pre-in'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'photoUpload',label:'上传图片'},
            {key:'claim',label:'无头件认领'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-transfer-out'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'transferCreate',label:'新增调拨',variant:'primary'},
            {key:'transferVehicle',label:'维护车辆'},
            {key:'transferAdjust',label:'调拨调整'},
            {key:'transferOutbound',label:'调拨出库'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-transfer-in'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'transferInboundSuccess',label:'入库成功',variant:'primary'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-transfer-fee'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='fcl-provider-api'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-pack-rule'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {key:'enable',label:'启用/停用'},
            {type:'edit',label:'编辑数据'}
        ];
    }
    if(id==='wh-cargo-search'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'cargoHold',label:'查货扣件'},
            {key:'productConfirm',label:'产品确认'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-replenish-drop'){
        return [
            {key:'search',label:'查询数据',variant:'primary'}
        ];
    }
    if(id==='wh-out-scan'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-preload'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {key:'bindBl',label:'绑定提单'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-issue'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {type:'view',label:'查看详情'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='cs-issue-track'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'csAdd',label:'新增数据',variant:'primary'},
            {key:'csFeedback',label:'客服反馈'},
            {key:'csReplyForCust',label:'代客户反馈'},
            {key:'csCustReply',label:'客户反馈'},
            {key:'csRelease',label:'放行'},
            {key:'csReturn',label:'退件'},
            {key:'export',label:'导出数据'},
            {key:'csRevokeRelease',label:'撤销放行',variant:'danger'}
        ];
    }
    if(id==='cfg-label-template'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'labelAdd',label:'新增数据',variant:'primary'},
            {key:'labelEdit',label:'修改数据'},
            {key:'setEnable',label:'启用'},
            {key:'setDisable',label:'禁用',variant:'danger'},
            {key:'batchDelete',label:'批量删除',variant:'danger'},
            {key:'labelFieldDoc',label:'标签字段说明'}
        ];
    }
    if(['wh-air-sort','wh-air-bag','wh-air-pack'].includes(id)){
        const airBase=[
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {type:'view',label:'查看详情'},
            {key:'printLabel',label:'打印标签'},
            {key:'exception',label:'异常登记'},
            {key:'export',label:'导出数据'}
        ];
        if(id==='wh-air-bag')airBase.splice(2,0,{key:'scan',label:'扫码'});
        return airBase;
    }
    if([].includes(id)){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {type:'view',label:'查看详情'},
            {key:'audit',label:'审核数据'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id.indexOf('fcl-')===0){
        const base=[
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {type:'view',label:'查看详情'}
        ];
        if(id==='fcl-quote')base.push({key:'copyQuote',label:'复制报价'},{key:'markupMaintain',label:'加价维护'});
        if(['fcl-cost-price','fcl-business-cost','fcl-sales-price'].includes(id))base.push({key:'copyAdd',label:'复制新增'});
        if(id==='fcl-trial-calc'||id==='fcl-trial-calc-biz')base.push({key:'trialGenerateQuote',label:'生成报价'});
        if(id==='fcl-inquiry-order')base.push({key:'convertPreorder',label:'转化草稿/预录单'});
        if(id==='fcl-draft-preorder')base.push({key:'bindCustomerOrder',label:'绑定客户实单'});
        if(id==='fcl-order')base.push(
            {key:'fclMergeOrder',label:'整柜合单'},
            {key:'fclSplitOrder',label:'拆单'},
            {key:'fclBookingWork',label:'订仓作业'},
            {key:'fclReleaseWork',label:'放仓作业'},
            {key:'fclTruckWork',label:'拖车安排'},
            {key:'fclLoadWork',label:'进仓装柜'},
            {key:'fclSiBlWork',label:'补料与提单'},
            {key:'fclCustomsWork',label:'报关申报'},
            {key:'fclSailingWork',label:'开船与轨迹'},
            {key:'fclDocSendWork',label:'寄单作业'}
        );
        if(id==='fcl-actual-order-entry')base.push({key:'bindCustomerOrder',label:'绑定客户实单'},{key:'recalcFee',label:'重算费用'});
        if(id==='fcl-si-bl')base.push({key:'recalcFee',label:'重算费用'});
        if(id==='fcl-bill-entry')base.push({key:'downloadTemplate',label:'下载导入模版'},{key:'fileRecognize',label:'图片和文件识别'},{key:'genBill',label:'生成账单'});
        if(id==='fcl-bill')base.push({key:'payDetail',label:'查看明细'});
        if(id==='fcl-bank-flow')base.push({key:'genReceivable',label:'生成收款管理'},{key:'genPayable',label:'生成付款管理'});
        if(['fcl-customer-audit','fcl-sales-instruction','fcl-payment','fcl-ar-release'].includes(id))base.push({key:'audit',label:'审核数据'});
        if(['fcl-booking','fcl-si-bl','fcl-edi-api','fcl-provider-api'].includes(id))base.push({key:'sync',label:'同步数据'});
        if(['fcl-bill','fcl-ar-release'].includes(id))base.push({key:'genPdf',label:'下载PDF'});
        if(id==='fcl-payment')base.push({key:'downloadReceipt',label:'下载水单'});
        base.push({key:'export',label:'导出数据'});
        return base;
    }
    if(id==='perm-user'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'resetPwd',label:'重置密码'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(['wh-loading-list','wh-parcel-out'].includes(id)){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'addOutboundPlan',label:'新增出库计划',variant:'primary'},
            {key:'labelPrint',label:'标签打印'},
            {key:'outboundAdjust',label:'出库单调整'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-sort-bag'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'newSortScan',label:'新增分拣扫描',variant:'primary'},
            {key:'labelPrint',label:'打印袋标签'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='cfg-coding-rule'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'editCodingRule',label:'编辑数据',variant:'primary'}
        ];
    }
    if(id==='wh-air-arrival-scan'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {key:'labelPrint',label:'标签打印'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(['wh-air-sort-scan','wh-air-checkout-scan','wh-air-checkin-sort-scan'].includes(id)){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-pallet-info'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'printLabel',label:'标签打印'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='wh-express-sort'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增方案',variant:'primary'}
        ];
    }
    if(id==='ow-outbound'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'owViewCode',label:'查看校验码'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='ow-pallet-info'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='ow-pickup'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {key:'pickupEdit',label:'修改提货信息'},
            {key:'pickupManualRelease',label:'手动放行',variant:'primary'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='ow-arrival'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='prod-price-lcl'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {key:'setStatus',status:'已启用',label:'启用',variant:'success'},
            {key:'setStatus',status:'已禁用',label:'禁用',variant:'danger'},
            {key:'copy',label:'复制新增'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='prod-surcharge'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {type:'add',label:'新增数据',variant:'primary'},
            {type:'edit',label:'编辑数据'},
            {key:'enable',label:'启用/禁用'}
        ];
    }
    if(id==='approval-mine'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'approvalAudit',label:'审核',variant:'primary'},
            {key:'export',label:'导出数据'}
        ];
    }
    if(id==='ow-inventory'||id==='wh-stock-check'){
        return [
            {key:'search',label:'查询数据',variant:'primary'},
            {key:'invManualCount',label:'手动盘点',variant:'primary'},
            {key:'export',label:'导出数据'}
        ];
    }
    const actions=[{key:'search',label:'查询数据',variant:'primary'},{type:'add',label:'新增数据',variant:'primary'},{key:'export',label:'导出数据'}];
    if(id.indexOf('wh-')===0){actions.push({key:'printLabel',label:'打印标签'},{key:'exception',label:'异常登记'},{key:'sync',label:'同步数据'});}
    else if(id.indexOf('prod-')===0||id.indexOf('cfg-')===0){actions.push({key:'enable',label:'启用/禁用'},{key:'copy',label:'复制新增'});}
    else if(id.indexOf('perm-')===0){actions.push({key:'enable',label:'启用/禁用'});}
    else{actions.push({key:'enable',label:'启用/禁用'});}
    return actions;
}

// 统一规则：列表行内“操作列”默认只保留“查看”，编辑/删除迁到工具栏操作按钮区。
// 下列 id 原本行内就不含编辑/删除（只读/特殊页），迁移后也不在工具栏追加，避免给只读页平白加出编辑/删除。
var _rowNoEditIds=['wb-manage','wb-client-manage','fin-bill-mgmt','wh-pallet-info','ow-arrival','ow-outbound','ow-inventory','wh-final-alloc','wh-air-arrival-scan','wh-air-sort-scan','wh-air-checkout-scan','wh-air-checkin-sort-scan','cfg-label-template','wh-sort-bag','wh-stock-check','approval-mine'];
var _rowNoDeleteIds=['wh-transfer-out','wh-transfer-in','wh-transfer-fee','fcl-provider-api','wh-pack-rule','wh-cargo-search','wh-out-scan','wh-preload','wh-issue','fin-fee-mgmt','wh-pallet-info','ow-arrival','ow-outbound','ow-inventory','wh-final-alloc','wh-air-arrival-scan','wh-air-sort-scan','wh-air-checkout-scan','wh-air-checkin-sort-scan','cfg-label-template','wh-sort-bag','prod-surcharge','fin-bank-voucher','prod-price-lcl','biz-track-cfg','wh-stock-check','approval-mine'];
function listRowCanEdit(id){return _rowNoEditIds.indexOf(id)<0;}
function listRowCanDelete(id){return _rowNoDeleteIds.indexOf(id)<0;}

function renderToolbarActions(id){
    var actions=getToolbarActions(id).slice();
    var hasEdit=actions.some(function(a){return a.type==='edit'||a.key==='edit'||(a.key&&/edit/i.test(a.key))||(a.label&&(a.label.indexOf('编辑')>=0||a.label.indexOf('修改')>=0));});
    var hasDelete=actions.some(function(a){return a.type==='delete'||a.key==='delete'||a.key==='batchDelete'||(a.label&&a.label.indexOf('删除')>=0);});
    if(listRowCanEdit(id)&&!hasEdit){
        var addIdx=-1;
        for(var i=0;i<actions.length;i++){if(actions[i].type==='add'){addIdx=i;break;}}
        actions.splice(addIdx>=0?addIdx+1:actions.length,0,{type:'edit',label:'编辑数据'});
    }
    if(listRowCanDelete(id)&&!hasDelete){
        actions.push({key:'batchDelete',label:'删除',variant:'danger'});
    }
    return actions.map(function(action){return renderToolbarAction(action,id);}).join('');
}

function openQueryTextModal(input,tabId){
    if(!input)return;
    if(_activeQueryEdit&&_activeQueryEdit.input===input){
        const existing=document.getElementById('query-text-popover');
        if(existing)return;
    }
    closeQueryTextPopover(false);
    const box=input.closest('.query-field-box')||input.parentElement;
    const labelEl=box?box.querySelector('label'):null;
    const label=labelEl?labelEl.textContent:tr('查询条件');
    const rect=input.getBoundingClientRect();
    const pop=document.createElement('div');
    pop.id='query-text-popover';
    pop.className='fixed z-[70] bg-white border border-primary-200 rounded-lg shadow-lg p-2';
    const width=Math.min(360,Math.max(260,rect.width*1.8));
    const left=Math.min(window.innerWidth-width-12,Math.max(12,rect.left));
    pop.style.left=left+'px';
    pop.style.top=(rect.bottom+6)+'px';
    pop.style.width=width+'px';
    pop.innerHTML='<textarea id="query-textarea-editor" rows="4" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-none" placeholder="'+esc(tr('请输入')+label)+'">'+esc(input.dataset.queryValue||input.value||'')+'</textarea><div class="mt-1 text-[11px] text-text-muted">'+tr('支持一行一个条件，也可以用逗号或分号分隔。')+'</div>';
    document.body.appendChild(pop);
    _activeQueryEdit={input:input,tabId:tabId,popover:pop};
    setTimeout(function(){
        const editor=document.getElementById('query-textarea-editor');
        if(editor){editor.focus();editor.setSelectionRange(editor.value.length,editor.value.length);}
        document.addEventListener('mousedown',handleQueryTextOutside,true);
    },0);
}

function closeQueryTextPopover(runSearch){
    const editor=document.getElementById('query-textarea-editor');
    if(_activeQueryEdit&&_activeQueryEdit.input&&editor){
        const value=editor.value||'';
        _activeQueryEdit.input.dataset.queryValue=value;
        _activeQueryEdit.input.value=formatQueryPreview(value);
        updateClearButton(_activeQueryEdit.input);
    }
    const tabId=_activeQueryEdit?_activeQueryEdit.tabId:null;
    const pop=document.getElementById('query-text-popover');
    if(pop)pop.remove();
    document.removeEventListener('mousedown',handleQueryTextOutside,true);
    _activeQueryEdit=null;
    if(runSearch&&tabId)runListSearch(tabId);
}

function confirmQueryTextModal(){
    closeQueryTextPopover(false);
}

function handleQueryTextOutside(e){
    if(!_activeQueryEdit)return;
    const pop=document.getElementById('query-text-popover');
    const input=_activeQueryEdit.input;
    if((pop&&pop.contains(e.target))||e.target===input)return;
    closeQueryTextPopover(true);
}

function palletPrintNumStepperHtml(id,value,step){
    return '<div class="flex items-center gap-1"><button type="button" onclick="palletPrintStep(\''+id+'\',-'+step+')" class="w-8 h-8 border border-surface-200 rounded text-text-secondary hover:bg-surface-100 cursor-pointer">−</button><input id="'+id+'" type="number" min="0" value="'+value+'" class="flex-1 h-8 px-2 text-sm border border-surface-200 rounded text-center bg-surface-50"><button type="button" onclick="palletPrintStep(\''+id+'\','+step+')" class="w-8 h-8 border border-surface-200 rounded text-text-secondary hover:bg-surface-100 cursor-pointer">+</button></div>';
}

