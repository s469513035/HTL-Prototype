function generateTrackMaintainPage(id){
    _trackMaintainRows=_trackMaintainSeed.slice();
    let h='<div class="h-full flex overflow-hidden bg-surface-50">';
    h+='<div class="w-80 flex-shrink-0 flex flex-col border-r border-surface-200 bg-white">';
    h+='<div class="flex items-center gap-4 px-4 pt-3 border-b border-surface-200">';
    [['waybill','运单号'],['master','主单号'],['provider','服务商主单号']].forEach(function(t){
        const on=_trackMaintainTab===t[0];
        h+='<button type="button" data-tm-tab="'+t[0]+'" onclick="switchTrackMaintainTab(\''+t[0]+'\')" class="'+(on?'pb-2 -mb-px border-b-2 border-primary-500 text-primary-600 font-medium':'pb-2 -mb-px border-b-2 border-transparent text-text-secondary hover:text-primary-600')+' text-sm cursor-pointer whitespace-nowrap">'+tr(t[1])+'</button>';
    });
    h+='</div>';
    h+='<div class="flex-1 p-3 overflow-auto"><textarea id="track-maintain-query" class="w-full h-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-none" style="min-height:420px" placeholder="'+esc(tr('请输入单号，一行一个'))+'">H2607170005</textarea></div>';
    h+='<div class="p-3 border-t border-surface-200 grid grid-cols-2 gap-2">';
    h+='<button type="button" onclick="trackMaintainQuery(\'waybill\')" class="h-9 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询运单')+'</button>';
    h+='<button type="button" onclick="trackMaintainQuery(\'child\')" class="h-9 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询子单')+'</button>';
    h+='<button type="button" onclick="trackMaintainQuery(\'bl\')" class="h-9 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询提单')+'</button>';
    h+='<button type="button" onclick="trackMaintainClear()" class="h-9 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('清空')+'</button>';
    h+='</div></div>';
    h+='<div class="flex-1 flex flex-col overflow-hidden">';
    h+='<div class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 bg-white">';
    h+='<div class="relative">';
    h+='<button type="button" onclick="toggleTrackAddMenu(event)" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">+ '+tr('轨迹添加')+'</button>';
    h+='<div id="track-add-menu" class="hidden absolute left-0 top-full mt-1 z-40 w-36 bg-white border border-surface-200 rounded-lg shadow-lg py-1">';
    h+='<button type="button" onclick="openTrackAddModal(\'waybill\')" class="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-primary-50 cursor-pointer">'+tr('查询运单-添加')+'</button>';
    h+='<button type="button" onclick="openTrackAddModal(\'child\')" class="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-primary-50 cursor-pointer">'+tr('查询子单-添加')+'</button>';
    h+='<button type="button" onclick="openTrackAddModal(\'bl\')" class="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-primary-50 cursor-pointer">'+tr('查询提单-添加')+'</button>';
    h+='</div></div>';
    h+='<button type="button" onclick="trackMaintainDelete()" class="h-9 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer">'+tr('轨迹删除')+'</button>';
    h+='</div>';
    h+='<div class="flex-1 overflow-auto p-4"><div class="bg-white rounded-xl border border-surface-200 overflow-auto">';
    h+='<table class="w-full text-sm" style="border-collapse:separate;border-spacing:0;min-width:900px"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-3 text-left font-semibold" style="width:40px">#</th>';
    h+='<th class="px-3 py-3 text-left font-semibold" style="width:40px"><input type="checkbox" onchange="trackMaintainToggleAll(this)"></th>';
    ['子单号','运单号','订单单号','子单状态','实际长度','实际宽度','实际高度','实际重量','实际体积'].forEach(function(c){h+='<th class="px-3 py-3 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody id="track-maintain-tbody">'+renderTrackMaintainRows()+'</tbody></table>';
    h+='</div></div></div></div>';
    return h;
}

function renderTrackMaintainRows(){
    if(!_trackMaintainRows.length)return '<tr><td colspan="11" class="px-3 py-12 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
    return _trackMaintainRows.map(function(r,i){
        return '<tr class="border-t border-surface-100 hover:bg-primary-50/30">'+
            '<td class="px-3 py-3 text-text-muted">'+(i+1)+'</td>'+
            '<td class="px-3 py-3"><input type="checkbox" class="track-maintain-check" value="'+i+'"></td>'+
            '<td class="px-3 py-3 font-medium text-primary-700 whitespace-nowrap">'+esc(r.child)+'</td>'+
            '<td class="px-3 py-3 text-text-secondary whitespace-nowrap">'+esc(r.waybill)+'</td>'+
            '<td class="px-3 py-3 text-text-secondary whitespace-nowrap">'+esc(r.order)+'</td>'+
            '<td class="px-3 py-3 text-text-secondary whitespace-nowrap">'+esc(r.status)+'</td>'+
            '<td class="px-3 py-3 text-text-secondary">'+esc(r.len)+'</td>'+
            '<td class="px-3 py-3 text-text-secondary">'+esc(r.wid)+'</td>'+
            '<td class="px-3 py-3 text-text-secondary">'+esc(r.hgt)+'</td>'+
            '<td class="px-3 py-3 text-text-secondary">'+esc(r.wgt)+'</td>'+
            '<td class="px-3 py-3 text-text-secondary">'+esc(r.vol)+'</td>'+
        '</tr>';
    }).join('');
}

function switchTrackMaintainTab(tab){
    _trackMaintainTab=tab;
    document.querySelectorAll('[data-tm-tab]').forEach(function(btn){
        const on=btn.dataset.tmTab===tab;
        btn.className=(on?'pb-2 -mb-px border-b-2 border-primary-500 text-primary-600 font-medium':'pb-2 -mb-px border-b-2 border-transparent text-text-secondary hover:text-primary-600')+' text-sm cursor-pointer whitespace-nowrap';
    });
}

function trackMaintainQuery(type){
    _trackMaintainRows=_trackMaintainSeed.slice();
    const tbody=document.getElementById('track-maintain-tbody');
    if(tbody)tbody.innerHTML=renderTrackMaintainRows();
    showToast(tr('查询完成'));
}

function trackMaintainClear(){
    const ta=document.getElementById('track-maintain-query');
    if(ta)ta.value='';
}

function trackMaintainToggleAll(cb){
    document.querySelectorAll('.track-maintain-check').forEach(function(c){c.checked=cb.checked;});
}

function toggleTrackAddMenu(e){
    if(e)e.stopPropagation();
    const menu=document.getElementById('track-add-menu');
    if(menu)menu.classList.toggle('hidden');
}

function trackMaintainDelete(){
    const checked=document.querySelectorAll('.track-maintain-check:checked');
    if(!checked.length){showToast(tr('请先勾选数据'));return;}
    const idxs=Array.from(checked).map(function(c){return parseInt(c.value,10);});
    openConfirmTip(tr('确定删除选中的轨迹数据吗?'),function(){
        _trackMaintainRows=_trackMaintainRows.filter(function(r,i){return idxs.indexOf(i)<0;});
        const tbody=document.getElementById('track-maintain-tbody');
        if(tbody)tbody.innerHTML=renderTrackMaintainRows();
        showToast(tr('删除成功'));
    });
}

function openTrackAddModal(scope){
    const menu=document.getElementById('track-add-menu');
    if(menu)menu.classList.add('hidden');
    const checked=Array.from(document.querySelectorAll('.track-maintain-check:checked')).map(function(c){return parseInt(c.value,10);});
    const rows=checked.length?checked.map(function(i){return _trackMaintainRows[i];}):_trackMaintainRows.slice();
    if(!rows.length){showToast(tr('暂无子单数据'));return;}
    const scopeLabel=scope==='waybill'?tr('运单'):(scope==='bl'?tr('提单'):tr('子单'));
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='90%';
    titleEl.textContent=tr('轨迹添加')+'-'+scopeLabel;
    let left='<div class="space-y-5">';
    rows.forEach(function(r){
        left+='<div class="border-b border-surface-100 pb-4">';
        left+='<div class="flex items-center gap-2 text-sm font-semibold text-text-primary mb-2"><span class="text-text-muted">▼</span><span>'+esc(r.child)+'</span><span class="text-text-secondary font-normal">Departure registration</span></div>';
        left+='<div class="flex gap-3 pl-5">';
        left+='<span class="mt-0.5 w-5 h-5 rounded-full border-2 border-amber-400 text-amber-500 text-[11px] font-medium flex items-center justify-center flex-shrink-0">1</span>';
        left+='<div class="text-xs text-text-secondary leading-relaxed"><div>2026-07-31 13:50:13 【'+tr('创建人')+'：HYD-开发者 '+tr('发生地')+'：中国(China,CN)】</div><div class="text-text-primary mt-1">出发登记 Departure registration</div></div>';
        left+='</div></div>';
    });
    left+='</div>';
    const trackCodeOpts=(TC['biz-track-cfg']&&TC['biz-track-cfg'].d?TC['biz-track-cfg'].d:[]).map(function(r){return {code:r[0],label:r[0]+' '+r[1]};});
    const locOpts=['中国(China,CN)','尼日利亚(Nigeria,NG)','塞内加尔(Senegal,SN)','科特迪瓦(Ivory Coast,CI)','加纳(Ghana,GH)','喀麦隆(Cameroon,CM)'];
    const inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    let right='<div class="space-y-4 max-w-md">';
    right+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('轨迹发生时间')+'</label><input type="datetime-local" class="'+inputCls+'"></div>';
    right+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('轨迹编号')+'</label><select onchange="fillTrackContent(this)" class="'+inputCls+'"><option value="">'+tr('请选择轨迹编号')+'</option>'+trackCodeOpts.map(function(o){return '<option value="'+esc(o.code)+'">'+esc(o.label)+'</option>';}).join('')+'</select></div>';
    right+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('轨迹内容（中文）')+'</label><textarea id="track-add-cn" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入轨迹内容（中文）'))+'"></textarea></div>';
    right+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('轨迹内容（英文）')+'</label><textarea id="track-add-en" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入轨迹内容（英文）'))+'"></textarea></div>';
    right+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('轨迹发生地')+'</label><select class="'+inputCls+'"><option value="">'+tr('请选择轨迹发生地')+'</option>'+locOpts.map(function(o){return '<option value="'+esc(o)+'">'+esc(o)+'</option>';}).join('')+'</select></div>';
    right+='</div>';
    bodyEl.innerHTML='<div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-2 overflow-auto pr-2" style="max-height:68vh">'+left+'</div><div>'+right+'</div></div>';
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button><button onclick="closeCrudModal();showToast(\''+tr('轨迹添加成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确定')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function fillTrackContent(sel){
    const code=sel.value;
    const row=(TC['biz-track-cfg']&&TC['biz-track-cfg'].d?TC['biz-track-cfg'].d:[]).find(function(r){return r[0]===code;});
    const cn=document.getElementById('track-add-cn');
    const en=document.getElementById('track-add-en');
    if(!row)return;
    if(cn)cn.value=row[4]||row[1]||'';
    if(en)en.value=row[5]||'';
}

/* ===== 应收明细 fin-ar-detail（左栏客户/业务员 + 状态页签 + 宽表 + 新增弹窗） ===== */
