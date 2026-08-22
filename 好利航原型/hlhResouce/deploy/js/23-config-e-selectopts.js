/* 风控级别：动作口径（不再用低/中/高风险的等级口径） */
var RISK_LEVEL_OPTIONS=['禁止操作','二次确认','弹出提示'];
/* 风控条件维度：取自运单主信息 + 子单/品名明细 */
var RISK_CONDITION_FIELDS=['运单号','客户单号','国内仓库','目的仓库','产品','客户代码','发件人','货物类型','总件数','是否重货','实际重量','体积重量','体积','子单号','品名','箱数','单箱数量','品牌','材质','海关编码'];

/* 需要从系统数据里勾选的条件维度 -> 取数表与编号/名称列 */
var RISK_ENTITY_SOURCES={
    '国内仓库':{table:'cfg-warehouse',code:'仓库编码',name:'仓库名称'},
    '目的仓库':{table:'cfg-warehouse',code:'仓库编码',name:'仓库名称'},
    '产品':{table:'prod-manage',code:'产品编号',name:'产品名称'},
    '客户代码':{table:'crm-cust',code:'客户代码',name:'客户简称'}
};
var _riskCondSel={};                 /* 维度 -> {include:[[编号,名称]], exclude:[...]} */
var _riskCondField='';               /* 当前选中的条件维度 */
var _riskPickerCtx=null;             /* 选择数据弹层上下文 {field,which} */

function riskEntityRows(field){
    var src=RISK_ENTITY_SOURCES[field];
    if(!src)return [];
    var c=TC[src.table];
    if(!c||!c.h||!c.d)return [];
    var ci=c.h.indexOf(src.code),ni=c.h.indexOf(src.name);
    if(ci<0||ni<0)return [];
    return c.d.map(function(r){return [String(r[ci]||''),String(r[ni]||'')];}).filter(function(p){return p[0];});
}

function riskCondBucket(field,which){
    if(!_riskCondSel[field])_riskCondSel[field]={include:[],exclude:[]};
    return _riskCondSel[field][which]||[];
}

/* 包含 / 排除 单个表格 */
function riskEntityTableHtml(field,which,readonly){
    var rows=riskCondBucket(field,which);
    var title=which==='include'?'包含':'排除';
    var bodyId='risk-cond-'+which+'-body';
    var h='<section class="rounded-lg border border-surface-200 bg-white overflow-hidden">';
    h+='<div class="flex items-center gap-3 px-3 py-2 border-b border-surface-200">';
    h+='<span class="w-1 h-4 bg-amber-400 rounded-full"></span>';
    h+='<span class="text-sm font-semibold text-text-primary">'+tr(title)+'</span>';
    if(!readonly)h+='<button type="button" onclick="openRiskPickerModal(\''+esc(field)+'\',\''+which+'\')" class="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline cursor-pointer">'+tr('选择')+'</button>';
    h+='</div>';
    h+='<div class="overflow-auto" style="height:180px"><table class="w-full text-xs"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-2 text-left font-semibold" style="width:44px">#</th><th class="px-3 py-2" style="width:40px"></th>';
    ['编号','名称'].forEach(function(cName){h+='<th class="px-3 py-2 text-left font-semibold whitespace-nowrap">'+tr(cName)+'</th>';});
    h+='</tr></thead><tbody id="'+bodyId+'">'+riskEntityRowsHtml(rows)+'</tbody></table></div>';
    h+='<div class="px-3 py-1.5 bg-surface-50 border-t border-surface-200 text-[11px] text-text-secondary">'+tr('表格高度')+'：<input type="number" value="180" class="w-16 h-6 px-2 border border-surface-200 rounded bg-white text-xs"> PX</div>';
    h+='</section>';
    return h;
}

function riskEntityRowsHtml(rows){
    if(!rows||!rows.length)return '<tr><td colspan="4" class="py-10 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
    return rows.map(function(p,i){
        return '<tr class="border-t border-surface-100 hover:bg-primary-50/30">'+
            '<td class="px-3 py-1.5 text-text-muted">'+(i+1)+'</td>'+
            '<td class="px-3 py-1.5"><input type="checkbox" class="rounded border-surface-300 text-primary-600"></td>'+
            '<td class="px-3 py-1.5 text-primary-700 whitespace-nowrap">'+esc(p[0])+'</td>'+
            '<td class="px-3 py-1.5 text-text-secondary">'+esc(p[1])+'</td></tr>';
    }).join('');
}

/* 右侧内容：实体类维度走包含/排除双表，其余维度保留原有正则/文本条件 */
function riskConditionBodyHtml(field,readonly,ruleName){
    if(RISK_ENTITY_SOURCES[field]){
        return '<div class="space-y-3 pt-3">'+riskEntityTableHtml(field,'include',readonly)+riskEntityTableHtml(field,'exclude',readonly)+'</div>';
    }
    var ro=readonly?' readonly':'',dis=readonly?' disabled':'';
    var h='<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 py-4 text-sm">';
    h+='<label class="inline-flex items-center gap-2 text-text-secondary"><input type="checkbox" class="rounded border-surface-300 text-primary-600"'+dis+'><span>'+tr('为空值')+'</span></label>';
    h+='<label class="inline-flex items-center gap-2 text-text-secondary"><input type="checkbox" class="rounded border-surface-300 text-primary-600"'+dis+'><span>'+tr('为非空值')+'</span></label>';
    h+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('匹配正则表达式')+'</label><input class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white"'+ro+'></div>';
    h+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('不匹配正则表达式')+'</label><input class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white"'+ro+'></div>';
    h+='</div><div class="space-y-3">';
    h+='<div><label class="text-sm font-semibold text-text-primary mb-1.5 block" data-risk-condition-include-label>'+tr(field)+' - '+tr('包含条件')+'</label><textarea rows="2" data-risk-condition-include class="w-full px-3 py-2 text-sm border border-surface-200 rounded bg-white resize-none" placeholder="'+esc(tr('请输入')+tr(field)+tr('包含条件'))+'"'+ro+'></textarea></div>';
    h+='<div><label class="text-sm font-semibold text-text-primary mb-1.5 block" data-risk-condition-exclude-label>'+tr(field)+' - '+tr('排除条件')+'</label><textarea rows="2" data-risk-condition-exclude class="w-full px-3 py-2 text-sm border border-surface-200 rounded bg-white resize-none" placeholder="'+esc(tr('请输入')+tr(field)+tr('排除条件'))+'"'+ro+'></textarea></div>';
    h+='<div><label class="text-sm font-semibold text-text-primary mb-1.5 block">'+tr('提示消息')+'</label><textarea rows="2" class="w-full px-3 py-2 text-sm border border-surface-200 rounded bg-white resize-none" placeholder="'+esc(tr('触发风控时给操作人员的提示内容'))+'"'+ro+'>'+esc(ruleName?ruleName+'，请按风控规则处理。':'')+'</textarea></div>';
    h+='</div>';
    return h;
}

/* ===== 选择数据弹层（独立浮层，避免顶掉外层风控弹窗） ===== */
function openRiskPickerModal(field,which){
    _riskPickerCtx={field:field,which:which};
    var rows=riskEntityRows(field);
    var picked={};
    riskCondBucket(field,which).forEach(function(p){picked[p[0]]=1;});
    var old=document.getElementById('risk-picker-overlay');
    if(old)old.remove();
    var ov=document.createElement('div');
    ov.id='risk-picker-overlay';
    ov.className='fixed inset-0 bg-black/40 z-[95] flex items-center justify-center p-6';
    var h='<div class="bg-white rounded-xl shadow-xl w-[860px] max-w-full max-h-[86vh] flex flex-col overflow-hidden">';
    h+='<div class="px-4 py-3 border-b border-surface-200 flex items-center gap-2"><span class="text-text-muted">#</span><span class="text-sm font-semibold text-text-primary">'+tr('选择数据')+'</span><span class="ml-2 text-xs text-text-muted">'+esc(tr(field))+'</span></div>';
    h+='<div class="flex-1 overflow-auto"><table class="w-full text-sm"><thead class="sticky top-0"><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-2 text-left font-semibold" style="width:56px">#</th><th class="px-3 py-2" style="width:44px"><input type="checkbox" onchange="riskPickerToggleAll(this)"></th>';
    ['编号','名称'].forEach(function(cName){h+='<th class="px-3 py-2 text-left font-semibold whitespace-nowrap">'+tr(cName)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!rows.length){h+='<tr><td colspan="4" class="py-12 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';}
    rows.forEach(function(p,i){
        h+='<tr class="border-t border-surface-100 hover:bg-primary-50/30">';
        h+='<td class="px-3 py-1.5 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-3 py-1.5"><input type="checkbox" class="risk-picker-check rounded border-surface-300 text-primary-600" data-code="'+esc(p[0])+'" data-name="'+esc(p[1])+'"'+(picked[p[0]]?' checked':'')+'></td>';
        h+='<td class="px-3 py-1.5 text-primary-700 whitespace-nowrap">'+esc(p[0])+'</td>';
        h+='<td class="px-3 py-1.5 text-text-secondary">'+esc(p[1])+'</td></tr>';
    });
    h+='</tbody></table></div>';
    h+='<div class="px-4 py-3 border-t border-surface-200 flex items-center justify-end gap-2">';
    h+='<button type="button" onclick="closeRiskPickerModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>';
    h+='<button type="button" onclick="confirmRiskPicker()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确定')+'</button>';
    h+='</div></div>';
    ov.innerHTML=h;
    document.body.appendChild(ov);
}

function riskPickerToggleAll(box){
    var ov=document.getElementById('risk-picker-overlay');
    if(!ov)return;
    ov.querySelectorAll('.risk-picker-check').forEach(function(cb){cb.checked=box.checked;});
}

function closeRiskPickerModal(){
    var ov=document.getElementById('risk-picker-overlay');
    if(ov)ov.remove();
    _riskPickerCtx=null;
}

function confirmRiskPicker(){
    if(!_riskPickerCtx)return;
    var ov=document.getElementById('risk-picker-overlay');
    if(!ov)return;
    var list=[];
    ov.querySelectorAll('.risk-picker-check:checked').forEach(function(cb){
        list.push([cb.getAttribute('data-code'),cb.getAttribute('data-name')]);
    });
    var f=_riskPickerCtx.field,w=_riskPickerCtx.which;
    if(!_riskCondSel[f])_riskCondSel[f]={include:[],exclude:[]};
    _riskCondSel[f][w]=list;
    closeRiskPickerModal();
    var tb=document.getElementById('risk-cond-'+w+'-body');
    if(tb)tb.innerHTML=riskEntityRowsHtml(list);
    showToast(tr('已选择')+' '+list.length+' '+tr('条'));
}

/* 问题件类型数据源：复用「问题件类型」配置表 */
function getIssueTypeOptions(){
    var c=TC['cs-issue-type'];
    if(c&&c.h&&c.d){
        var i=c.h.indexOf('问题件类型名称');
        if(i>=0){
            var list=c.d.map(function(r){return r[i];}).filter(Boolean);
            if(list.length)return list;
        }
    }
    return ['破损','开箱验货','丢件','清关异常','其他'];
}

/* 生成问题件选「是」才显示问题件类型 */
function onRiskIssueToggle(){
    var wrap=document.getElementById('risk-issue-type-wrap');
    if(!wrap)return;
    var yes=document.querySelector('input[name="risk-work-order"][value="是"]');
    if(yes&&yes.checked)wrap.classList.remove('hidden');
    else wrap.classList.add('hidden');
}

function openRiskRuleModal(mode,id,rowIdx,rowData){
    const c=TC[id]||{t:'风控规则'};
    const L=_lang[_currentLang];
    const isView=mode==='view';
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='88%';
    const datetimeVal=function(v){return String(v||'').replace(' ','T').slice(0,16);};
    const name=rowData?rowData[0]:'';
    const start=rowData?rowData[1]:'2026-06-01 00:00';
    const end=rowData?rowData[2]:'2026-12-31 23:59';
    const level=rowData?rowData[3]:'中风险';
    const workOrder=rowData?rowData[4]:'是';
    const issueType=(rowData&&rowData[7])||'';
    const loops=String(rowData?rowData[5]:'订单预报|收货操作').split('|');
    const status=rowData?rowData[6]:'启用';
    const disabled=isView?' disabled':'';
    const readonly=isView?' readonly':'';
    const serviceSelected=['报关','合并报关','带电','贴箱唛'];
    const modeLabel=mode==='view'?L.view:mode==='add'?L.add:L.edit;
    titleEl.textContent=tr('风控规则信息')+' - '+modeLabel;
    _riskCondSel={};_riskCondField=RISK_CONDITION_FIELDS[0];
    /* 左右结构：左=基本信息+附加服务，右=风控条件 */
    let html='<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">';
    html+='<div class="space-y-4">';
    html+='<section class="rounded-lg border border-blue-100 bg-white p-4">';
    html+='<div class="text-sm font-semibold text-text-primary mb-4">'+tr('基本信息')+'</div>';
    html+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('规则名称')+'</label><input type="text" required class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white" value="'+esc(name)+'" placeholder="'+esc(tr('请输入规则名称'))+'"'+readonly+'></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('生效时间')+'</label><input type="datetime-local" required class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white" value="'+esc(datetimeVal(start))+'"'+readonly+'></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('失效时间')+'</label><input type="datetime-local" required class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white" value="'+esc(datetimeVal(end))+'"'+readonly+'></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('风控级别')+'</label><select required class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white"'+disabled+'>'+selectOptionsHtml(RISK_LEVEL_OPTIONS,level)+'</select></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('生成问题件')+'</label><div class="h-9 flex items-center gap-5 text-sm text-text-secondary"><label class="inline-flex items-center gap-2"><input type="radio" name="risk-work-order" onchange="onRiskIssueToggle()" class="text-primary-600" value="否"'+(workOrder==='否'?' checked':'')+disabled+'><span>'+tr('否')+'</span></label><label class="inline-flex items-center gap-2"><input type="radio" name="risk-work-order" onchange="onRiskIssueToggle()" class="text-primary-600" value="是"'+(workOrder!=='否'?' checked':'')+disabled+'><span>'+tr('是')+'</span></label></div></div>';
    /* 选「是」时才需要指定问题件类型 */
    html+='<div id="risk-issue-type-wrap"'+(workOrder==='否'?' class="hidden"':'')+'><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('问题件类型')+'</label><select id="risk-issue-type" required class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white"'+disabled+'>'+selectOptionsHtml(getIssueTypeOptions(),issueType)+'</select></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('状态')+'</label><select required class="w-full h-9 px-3 text-sm border border-surface-200 rounded bg-white"'+disabled+'>'+selectOptionsHtml(['启用','停用'],status)+'</select></div>';
    html+='<div class="md:col-span-2"><label class="text-sm font-medium text-text-secondary mb-2 block"><span class="text-red-500">*</span> '+tr('风控环节')+'</label><div class="flex flex-wrap items-center gap-x-8 gap-y-2 min-h-9 rounded border border-surface-200 bg-surface-50 px-3 py-2">';
    ['订单预报','收货操作','出库操作'].forEach(function(loop){
        html+='<label class="inline-flex items-center gap-2 text-sm text-primary-700 cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600"'+(loops.includes(loop)?' checked':'')+disabled+'><span>'+tr(loop)+'</span></label>';
    });
    html+='</div></div></div></section>';
    html+='<section class="rounded-lg border border-blue-100 bg-white p-4">';
    html+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('附加服务')+'</div>';
    html+='<div class="flex flex-wrap gap-x-8 gap-y-3 text-sm">';
    ['报关','合并报关','拆分报关','带电','带磁','贴箱唛'].forEach(function(service){
        html+='<label class="inline-flex items-center gap-2 text-text-secondary cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600"'+(serviceSelected.includes(service)?' checked':'')+disabled+'><span>'+tr(service)+'</span></label>';
    });
    html+='</div></section>';
    html+='</div>';   /* 左列结束 */
    html+='<section class="rounded-lg border border-surface-200 overflow-hidden bg-white">';
    html+='<div class="flex flex-col xl:flex-row" data-risk-condition-wrap'+(isView?' data-risk-condition-readonly':'')+' style="min-height:360px">';
    html+='<div class="xl:w-52 flex-shrink-0 border-b xl:border-b-0 xl:border-r border-surface-200 bg-surface-50">';
    html+='<div class="h-10 px-4 flex items-center text-sm font-semibold text-text-primary border-b border-surface-200 bg-white">'+tr('风控条件')+'</div>';
    /* 条件维度较多，左侧列表内部滚动，避免把弹窗撑高 */
    html+='<div class="overflow-auto" style="max-height:420px">';
    RISK_CONDITION_FIELDS.forEach(function(item,idx){
        html+='<button type="button" data-risk-condition-tab="'+esc(item)+'" onclick="switchRiskConditionTab(this)" class="w-full h-9 px-4 flex items-center justify-between text-left text-sm transition '+(idx===0?'bg-primary-500 text-white font-medium':'text-text-secondary hover:bg-primary-50')+'"><span>'+tr(item)+'</span><span class="text-xs '+(idx===0?'text-white':'text-text-muted')+'">›</span></button>';
    });
    html+='</div></div>';
    html+='<div class="flex-1 min-w-0 p-4">';
    html+='<div class="text-base font-semibold text-text-primary pb-3 border-b border-surface-200" data-risk-condition-title>'+tr(_riskCondField)+'</div>';
    html+='<div data-risk-condition-body>'+riskConditionBodyHtml(_riskCondField,isView,name)+'</div>';
    html+='</div></div></section>';
    html+='</div>';
    bodyEl.innerHTML=html;
    if(isView){
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('关闭')+'</button>';
    }else{
        footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+tr('保存成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('保存配置')+'</button>';
    }
    document.getElementById('crud-modal').classList.add('show');
}

function switchRiskConditionTab(btn){
    const wrap=btn&&btn.closest?btn.closest('[data-risk-condition-wrap]'):null;
    if(!wrap)return;
    const field=btn.getAttribute('data-risk-condition-tab')||'运单号';
    wrap.querySelectorAll('[data-risk-condition-tab]').forEach(function(tab){
        const active=tab===btn;
        tab.classList.toggle('bg-primary-500',active);
        tab.classList.toggle('text-white',active);
        tab.classList.toggle('font-medium',active);
        tab.classList.toggle('text-text-secondary',!active);
        tab.classList.toggle('hover:bg-primary-50',!active);
        const arrow=tab.querySelector('span:last-child');
        if(arrow){
            arrow.classList.toggle('text-white',active);
            arrow.classList.toggle('text-text-muted',!active);
        }
    });
    const title=wrap.querySelector('[data-risk-condition-title]');
    if(title)title.textContent=tr(field);
    /* 实体类维度与文本类维度表单结构不同，整块重渲染 */
    _riskCondField=field;
    const body=wrap.querySelector('[data-risk-condition-body]');
    if(body){
        const readonly=!!wrap.querySelector('[data-risk-condition-readonly]');
        body.innerHTML=riskConditionBodyHtml(field,readonly,'');
    }
}

function openRoleModal(mode,id,rowIdx,rowData){
    const c=TC[id];
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const modeLabel=mode==='add'?L.add:mode==='copy'?tr('复制新增'):L.edit;
    titleEl.textContent=modeLabel+tr(c.t);
    const autoCode=mode==='add'?(function(){const data=_listData[id]||expandData(id);const lastCode=data[data.length-1][0];const lm=lastCode.match(/^(.*?)(\d+)$/);return lm?lm[1]+String(parseInt(lm[2])+1).padStart(lm[2].length,'0'):lastCode+'-001';})():'';
    const editCode=mode==='copy'?'':(rowData?rowData[0]:'');
    const editName=rowData?rowData[1]:'';
    const editStatus=rowData?rowData[2]:'启用';
    const editTerminal=rowData?rowData[3]:'全终端';
    const editDesc=editName?editName+'权限范围':'';
    let html='<div class="flex gap-6 h-full" style="min-height:520px">';
    html+='<div class="w-[320px] flex-shrink-0 border-r border-surface-200 pr-6">';
    html+='<div class="text-sm font-semibold text-text-primary mb-4">'+tr('基本信息')+'</div>';
    html+='<div class="space-y-4">';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('角色编号')+'</label>';
    if(mode==='edit'){html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(editCode)+'" readonly>';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(autoCode)+'" placeholder="'+tr('自动生成')+'">';}
    html+='</div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('角色名称')+'</label>';
    html+='<input type="text" id="role-name-input" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(editName)+'" placeholder="'+tr('请输入角色名称')+'"></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('状态')+'</label>';
    html+='<select id="role-status-select" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">';
    ['启用','停用'].forEach(function(s){html+='<option value="'+esc(s)+'"'+(editStatus===s?' selected':'')+'>'+esc(tr(s))+'</option>';});
    html+='</select></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('所属终端')+'</label>';
    html+='<select id="role-terminal-select" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">';
    ['PC端','移动端','全终端'].forEach(function(t){html+='<option value="'+esc(t)+'"'+(editTerminal===t?' selected':'')+'>'+esc(tr(t))+'</option>';});
    html+='</select></div>';
    html+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('角色说明')+'</label>';
    html+='<textarea rows="2" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-none" placeholder="'+tr('请输入角色说明')+'">'+esc(editDesc)+'</textarea></div>';
    html+='</div></div>';
    html+='<div class="flex-1 min-w-0 flex flex-col">';
    html+='<div class="text-sm font-semibold text-text-primary mb-3">'+tr('权限配置')+'</div>';
    html+='<div class="flex gap-4 flex-1 min-h-0">';
    html+='<div class="w-[260px] flex-shrink-0 border border-surface-200 rounded-lg overflow-hidden flex flex-col">';
    html+='<div class="px-3 py-2 bg-surface-50 border-b border-surface-200 text-xs font-semibold text-text-secondary">'+tr('菜单权限')+'</div>';
    html+='<div class="flex-1 overflow-y-auto p-2" id="role-menu-tree">';
    html+=buildRoleMenuTree();
    html+='</div></div>';
    html+='<div class="flex-1 min-w-0 border border-surface-200 rounded-lg overflow-hidden flex flex-col">';
    html+='<div class="px-3 py-2 bg-surface-50 border-b border-surface-200 text-xs font-semibold text-text-secondary">'+tr('字段管理')+'</div>';
    html+='<div class="flex-1 overflow-y-auto p-3" id="role-field-list">';
    html+='<div class="text-sm text-text-muted py-4 text-center">'+tr('请先选择左侧菜单模块')+'</div>';
    html+='</div></div>';
    html+='<div class="flex-1 min-w-0 border border-surface-200 rounded-lg overflow-hidden flex flex-col">';
    html+='<div class="px-3 py-2 bg-surface-50 border-b border-surface-200 text-xs font-semibold text-text-secondary">'+tr('查询条件')+'</div>';
    html+='<div class="flex-1 overflow-y-auto p-3" id="role-query-list">';
    html+='<div class="text-sm text-text-muted py-4 text-center">'+tr('请先选择左侧菜单模块')+'</div>';
    html+='</div></div>';
    html+='<div class="flex-1 min-w-0 border border-surface-200 rounded-lg overflow-hidden flex flex-col">';
    html+='<div class="px-3 py-2 bg-surface-50 border-b border-surface-200 text-xs font-semibold text-text-secondary">'+tr('按钮权限')+'</div>';
    html+='<div class="flex-1 overflow-y-auto p-3" id="role-btn-list">';
    html+='<div class="text-sm text-text-muted py-4 text-center">'+tr('请先选择左侧菜单模块')+'</div>';
    html+='</div></div>';
    html+='</div>';
html+='</div>';
html+='</div>';
    bodyEl.innerHTML=html;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+tr('保存成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('保存角色')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openProductManageModal(mode,id,rowIdx,rowData){
    const c=TC[id];
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const modeLabel=mode==='add'?L.add:mode==='copy'?tr('复制新增'):L.edit;
    titleEl.textContent=modeLabel+tr(c.t);
    const autoCode=mode==='add'?(function(){const data=_listData[id]||expandData(id);const lastCode=data[data.length-1][0];const lm=lastCode.match(/^(.*?)(\d+)$/);return lm?lm[1]+String(parseInt(lm[2])+1).padStart(lm[2].length,'0'):lastCode+'-001';})():'';
    const editCode=rowData?rowData[0]:'';
    const editName=rowData?rowData[1]:'';
    /* 品名大类 / 品名信息 已从列表去除，弹窗中仅用默认值 */
    const editCategory='电子产品';
    const editCargoInfo='';
    const editBusinessType=rowData?rowData[2]:'散货';
    const editTransport=rowData?rowData[3]:'';
    const editCountry=rowData?rowData[4]:'';
    const editRemark=rowData?rowData[5]:'';
    const editBubbleRatio=rowData?rowData[6]:'';
    const editCustomers=rowData?rowData[7]:'全部客户';
    const editStatus=rowData?rowData[8]:'启用';
    const activeChecked=(!rowData||editStatus==='启用'||editStatus==='已生效')?' checked':'';
    let html='<div class="space-y-5">';
    html+='<div><div class="text-sm font-semibold text-text-primary mb-3">'+tr('产品基本信息')+'</div>';
    html+='<div class="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('产品编号')+'</label>';
    if(mode==='edit'){html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(editCode)+'" readonly>';}
    else if(mode==='copy'){html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="" placeholder="'+tr('自动生成')+'">';}
    else{html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(autoCode)+'" placeholder="'+tr('自动生成')+'">';}
    html+='</div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('产品名称')+'</label>';
    html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(editName)+'" placeholder="'+tr('请输入产品名称')+'"></div>';
    if(mode==='edit'){
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('品名大类')+'</label>';
        html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['电子产品','服装鞋帽','五金工具','家居用品','食品','化妆品','其他'],editCategory)+'</select></div>';
        html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('品名信息')+'</label>';
        html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(editCargoInfo)+'" placeholder="'+tr('请输入品名信息')+'"></div>';
    }
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('业务类型')+'</label>';
    html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['散货','整柜'],editBusinessType)+'</select></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('运输方式')+'</label>';
    html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">';
    ['海运','空运'].forEach(function(t){html+='<option value="'+esc(t)+'"'+(editTransport===t?' selected':'')+'>'+esc(tr(t))+'</option>';});
    html+='</select></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('目的国家')+'</label>';
    html+='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50">'+selectOptionsHtml(['塞内加尔','尼日利亚','科特迪瓦','喀麦隆','多哥','加纳','利比里亚','几内亚','冈比亚','安哥拉','刚果金','刚果布','加蓬','赤道几内亚'],editCountry)+'</select></div>';
    html+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('计泡比规则')+'</label>';
    html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50" value="'+esc(editBubbleRatio)+'" placeholder="1CBM=167KG"></div>';
    html+='<div class="flex items-center gap-2 self-end pb-1"><input type="checkbox" id="prod-active-cb" class="w-4 h-4 rounded border-surface-300 cursor-pointer"'+activeChecked+'><label for="prod-active-cb" class="text-sm font-medium text-text-secondary cursor-pointer">'+tr('启用')+'</label></div>';
    html+='<div class="flex flex-col gap-1.5 md:col-span-4"><label class="text-sm font-medium text-text-secondary">'+tr('产品备注')+'</label>';
    html+='<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+tr('请输入产品备注')+'">'+esc(editRemark)+'</textarea></div>';
    html+='</div></div>';
    html+='<div class="border border-surface-200 rounded-xl overflow-hidden">'+
        '<div class="px-4 py-3 bg-surface-50 border-b border-surface-200"><div class="text-sm font-semibold text-text-primary">'+tr('附加服务')+'</div></div>'+
        '<div class="p-4">'+
            '<div id="prod-manage-services-container" class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">'+
                (function(){
                    const preSelected=(_productServices[editName]||[]);
                    return ['报关','木箱','仿牌','带电','带磁','贴箱唛'].map(function(o){
                        const on=preSelected.indexOf(o)>=0?' checked':'';
                        return '<label class="inline-flex items-center gap-1 text-sm text-text-secondary cursor-pointer"><input type="checkbox" class="rounded border-surface-300 text-primary-600" data-cb-label="'+esc(o)+'"'+on+'><span>'+esc(tr(o))+'</span><span class="inline-flex w-4 h-4 items-center justify-center rounded-full bg-surface-100 border border-surface-200 text-[11px] font-bold leading-none text-text-muted cursor-help" title="'+esc(serviceChargeTooltip(o))+'">?</span></label>';
                    }).join('');
                })()+
            '</div>'+
        '</div>'+
    '</div>';
    html+='<div class="border border-surface-200 rounded-xl overflow-hidden"><div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between"><div class="text-sm font-semibold text-text-primary">'+tr('取重规则配置')+'</div><button type="button" onclick="addWeightRule()" class="h-8 px-3 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">+ '+tr('新增规则')+'</button></div>';
    html+='<div class="p-4 overflow-x-auto"><table class="w-full text-sm border border-surface-200 rounded-lg"><thead><tr class="bg-surface-50">';
    html+='<th class="px-2 py-2 text-left text-xs font-semibold text-text-secondary">'+tr('使用客户')+'</th>';
    html+='<th class="px-2 py-2 text-left text-xs font-semibold text-text-secondary">'+tr('条件表达式')+'</th>';
    html+='<th class="px-2 py-2 text-left text-xs font-semibold text-text-secondary">'+tr('取重表达式')+'</th>';
    html+='<th class="px-2 py-2 text-left text-xs font-semibold text-text-secondary">'+tr('单件最小')+'</th>';
    html+='<th class="px-2 py-2 text-left text-xs font-semibold text-text-secondary">'+tr('单票最小')+'</th>';
    html+='<th class="px-2 py-2 text-left text-xs font-semibold text-text-secondary">'+tr('取整方式')+'</th>';
    html+='<th class="px-2 py-2 text-center text-xs font-semibold text-text-secondary">'+tr('操作')+'</th>';
    html+='</tr></thead><tbody id="weight-rule-tbody">';
    html+=weightRuleRowHtml((editCustomers||'').split(',')[0]||'全部客户');
    html+=weightRuleRowHtml('指定客户','总重量>50','体积重量','1','2','四舍五入');
    html+='</tbody></table></div></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="saveProductManageServices(\''+esc(editName)+'\');closeCrudModal();showToast(\''+tr('保存成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('保存产品')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function weightRuleRowHtml(customer,conditionExpr,weightExpr,pieceMin,ticketMin,roundType){
    customer=customer||'全部客户';
    conditionExpr=conditionExpr||'总重量>100';
    weightExpr=weightExpr||'实际重量';
    pieceMin=pieceMin||'0.5';
    ticketMin=ticketMin||'1';
    roundType=roundType||'进一法';
    return '<tr class="hover:bg-surface-50">'+
        '<td class="px-2 py-1 min-w-[130px]"><select class="w-full text-xs border border-surface-200 rounded px-1 py-1">'+selectOptionsHtml(['全部客户','指定客户','鑫达贸易','远洋物流','速达货运','蓝海跨境','华运达国际'],customer)+'</select></td>'+
        '<td class="px-2 py-1 min-w-[170px]"><input type="text" class="w-full text-xs border border-surface-200 rounded px-1 py-1" value="'+esc(conditionExpr)+'"></td>'+
        '<td class="px-2 py-1 min-w-[180px]"><select class="w-full text-xs border border-surface-200 rounded px-1 py-1">'+selectOptionsHtml(['实际重量','体积重量','MAX(实际重量，体积重量)'],weightExpr)+'</select></td>'+
        '<td class="px-2 py-1 min-w-[110px]"><input type="text" class="w-full text-xs border border-surface-200 rounded px-1 py-1" value="'+esc(pieceMin)+'"></td>'+
        '<td class="px-2 py-1 min-w-[110px]"><input type="text" class="w-full text-xs border border-surface-200 rounded px-1 py-1" value="'+esc(ticketMin)+'"></td>'+
        '<td class="px-2 py-1 min-w-[120px]"><select class="w-full text-xs border border-surface-200 rounded px-1 py-1">'+selectOptionsHtml(['进一法','四舍五入','取整'],roundType)+'</select></td>'+
        '<td class="px-2 py-1 text-center"><button class="text-red-500 hover:text-red-600 cursor-pointer" onclick="this.closest(\'tr\').remove()">'+tr('删除')+'</button></td>'+
        '</tr>';
}

function addWeightRule(){
    const tbody=document.getElementById('weight-rule-tbody');
    if(!tbody)return;
    tbody.insertAdjacentHTML('beforeend',weightRuleRowHtml());
    applyRuntimeEnhancements(tbody.lastElementChild);
}

function dogRuleRowHtml(ban,type,cond,msg){
    ban=ban||'否';type=type||'普货';cond=cond||'';msg=msg||'';
    return '<tr class="hover:bg-surface-50">'+
        '<td class="px-2 py-1 min-w-[100px]"><select class="w-full text-xs border border-surface-200 rounded px-1 py-1">'+selectOptionsHtml(['是','否'],ban)+'</select></td>'+
        '<td class="px-2 py-1 min-w-[120px]"><select class="w-full text-xs border border-surface-200 rounded px-1 py-1">'+selectOptionsHtml(['普货','敏感货','危险品','带电货'],type)+'</select></td>'+
        '<td class="px-2 py-1 min-w-[180px]"><input type="text" class="w-full text-xs border border-surface-200 rounded px-1 py-1" value="'+esc(cond)+'" placeholder="'+esc(tr('条件表达式'))+'"></td>'+
        '<td class="px-2 py-1 min-w-[180px]"><input type="text" class="w-full text-xs border border-surface-200 rounded px-1 py-1" value="'+esc(msg)+'" placeholder="'+esc(tr('提示信息'))+'"></td>'+
        '<td class="px-2 py-1 text-center"><button class="text-red-500 hover:text-red-600 cursor-pointer" onclick="this.closest(\'tr\').remove()">'+tr('删除')+'</button></td>'+
        '</tr>';
}
function addDogRule(){
    const tbody=document.getElementById('dog-rule-tbody');
    if(!tbody)return;
    tbody.insertAdjacentHTML('beforeend',dogRuleRowHtml());
}

function selectOptionsHtml(options,value){
    return (options||[]).map(function(o){return '<option value="'+esc(o)+'"'+(value===o?' selected':'')+'>'+esc(tr(o))+'</option>';}).join('');
}

function multiSelectFieldHtml(label,options,values,disabled){
    const selected=Array.isArray(values)?values:(values?String(values).split(','):[]);
    let html='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+'</label>';
    html+='<select multiple class="w-full h-24 px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50"'+(disabled?' disabled':'')+'>';
    (options||[]).forEach(function(o){html+='<option value="'+esc(o)+'"'+(selected.includes(o)?' selected':'')+'>'+esc(tr(o))+'</option>';});
    html+='</select></div>';
    return html;
}

function checkedDropdownFieldHtml(label,options,values){
    const selected=Array.isArray(values)?values:String(values||'').split(',').map(function(v){return v.trim();}).filter(Boolean);
    const text=selected.length?selected.map(tr).join(', '):'';
    let html='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+'</label>';
    html+='<div class="relative" data-checked-dropdown>';
    html+='<input type="text" readonly data-checked-dropdown-input onclick="toggleCheckedDropdown(this)" class="w-full h-10 pl-3 pr-9 text-sm border border-surface-200 rounded-lg bg-surface-50 cursor-pointer" value="'+esc(text)+'" placeholder="'+esc(tr('请选择'))+'">';
    html+='<button type="button" onclick="toggleCheckedDropdown(this)" class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted hover:text-primary-600 cursor-pointer">▾</button>';
    html+='<div data-checked-dropdown-menu class="hidden absolute z-40 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-surface-200 bg-white shadow-lg p-2">';
    (options||[]).forEach(function(o){
        html+='<label class="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-secondary hover:bg-primary-50 cursor-pointer"><input type="checkbox" value="'+esc(o)+'" class="rounded border-surface-300 text-primary-600" onchange="syncCheckedDropdown(this)"'+(selected.includes(o)?' checked':'')+'><span>'+esc(tr(o))+'</span></label>';
    });
    html+='</div></div></div>';
    return html;
}

function toggleCheckedDropdown(btn){
    const root=btn.closest('[data-checked-dropdown]');
    if(!root)return;
    document.querySelectorAll('[data-checked-dropdown-menu]').forEach(function(menu){
        if(menu!==root.querySelector('[data-checked-dropdown-menu]'))menu.classList.add('hidden');
    });
    const menu=root.querySelector('[data-checked-dropdown-menu]');
    if(menu)menu.classList.toggle('hidden');
}

function syncCheckedDropdown(input){
    const root=input.closest('[data-checked-dropdown]');
    if(!root)return;
    const checked=Array.from(root.querySelectorAll('input[type="checkbox"]:checked')).map(function(i){return i.value;});
    const inputEl=root.querySelector('[data-checked-dropdown-input]');
    if(inputEl){
        inputEl.value=checked.map(tr).join(', ');
        inputEl.title=inputEl.value;
    }
}
function syncCheckedDropdownQuery(input,id,qi){
    var root=input.closest('[data-checked-dropdown]');
    if(!root)return;
    var checked=Array.from(root.querySelectorAll('input[type="checkbox"]:checked')).map(function(i){return i.value;});
    var inputEl=root.querySelector('[data-checked-dropdown-input]');
    if(inputEl){inputEl.value=checked.map(tr).join(', ');inputEl.title=inputEl.value;}
    root.dataset.queryValue=checked.join(',');
}


function getTableValueByHeader(c,rowData,header,defaultValue){
    const idx=(c.h||[]).indexOf(header);
    const val=rowData&&idx>=0?rowData[idx]:'';
    return val!==undefined&&val!==null&&val!==''?val:(defaultValue||'');
}


function getEmployeeNameOptions(){
    var names=[];
    var empTC=TC['base-employee'];
    if(empTC){
        var nameIdx=(empTC.h||[]).indexOf('姓名');
        if(nameIdx<0)nameIdx=1;
        var empData=empTC.d||[];
        empData.forEach(function(row){if(row[nameIdx])names.push(row[nameIdx]);});
    }
    if(names.length===0)names=['张三','李四','王五','赵六','陈七'];
    return names;
}

function crmWarehouseDisplayHtml(label,options,values){
    const selected=Array.isArray(values)?values:(values?String(values).split(',').map(function(v){return v.trim();}).filter(Boolean):[]);
    const displayText=selected.map(tr).join(', ');
    return '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+'</label><div class="h-10 px-3 text-sm flex items-center border border-surface-200 rounded-lg bg-surface-50">'+(esc(displayText)||'\u2014')+'</div></div>';
}

function crmInputFieldHtml(label,value,type,readonly,required){
    const attr=readonly?' readonly disabled':'';
    const reqMark=required?' <span class="text-red-500">*</span>':'';
    const reqAttr=required&&!readonly?' required':'';
    return '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+reqMark+'</label><input type="'+(type||'text')+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg '+(readonly?'bg-surface-100 cursor-not-allowed':'bg-surface-50')+'" value="'+esc(value||'')+'"'+attr+reqAttr+'></div>';
}

function crmSelectFieldHtml(label,options,value,readonly,extraAttrs){
    const attr=(readonly?' disabled':'')+(extraAttrs||'');
    return '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr(label)+'</label><select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg '+(readonly?'bg-surface-100 cursor-not-allowed':'bg-surface-50')+'"'+attr+'>'+selectOptionsHtml(options,value)+'</select></div>';
}

function crmTextareaFieldHtml(label,value,readonly){
    const half=String(label||'').includes('备注')?' modal-remark-half':'';
    return '<div class="flex flex-col gap-1.5'+half+'"><label class="text-sm font-medium text-text-secondary">'+tr(label)+'</label><textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg '+(readonly?'bg-surface-100 cursor-not-allowed':'bg-surface-50')+' resize-none"'+(readonly?' readonly disabled':'')+'>'+esc(value||'')+'</textarea></div>';
}

function crmLeadingStarFieldHtml(label,type,value,readonly,required,opts){
    opts=opts||{};
    const star=required?'<span class="text-red-500 mr-0.5">*</span>':'';
    const placeholder=opts.placeholder||('请输入'+label);
    const attr=readonly?' readonly disabled':'';
    const reqAttr=required&&!readonly?' required':'';
    let control='';
    if(type==='select'){
        const selAttr=readonly?' disabled':'';
        control='<select class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg '+(readonly?'bg-surface-100 cursor-not-allowed':'bg-surface-50')+'"'+selAttr+(required&&!readonly?' required':'')+'><option value="">'+esc(tr(placeholder))+'</option>'+selectOptionsHtml(opts.options||[],value)+'</select>';
    }else{
        control='<input type="'+type+'" placeholder="'+esc(tr(placeholder))+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg '+(readonly?'bg-surface-100 cursor-not-allowed':'bg-surface-50')+'" value="'+esc(value||'')+'"'+attr+reqAttr+'>';
    }
    return '<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+star+tr(label)+'</label>'+control+'</div>';
}

