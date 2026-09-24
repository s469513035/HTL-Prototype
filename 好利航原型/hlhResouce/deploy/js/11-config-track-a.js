function generateTrackMaintainPage(id){
    _trackMaintainRows=_trackMaintainSeed.slice();
    let h='<div class="h-full flex overflow-hidden bg-surface-50">';
    /* 左栏：按钮区（查询运单/子单/提单 + 清空）在文本框上面 —— 点哪个查询就是哪个维度 */
    h+='<div class="w-80 flex-shrink-0 flex flex-col border-r border-surface-200 bg-white">';
    h+='<div class="p-3 border-b border-surface-200">';
    h+='<div class="grid grid-cols-3 gap-2 mb-2">';
    h+='<button type="button" onclick="trackMaintainQuery(\'waybill\')" class="h-9 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询运单')+'</button>';
    h+='<button type="button" onclick="trackMaintainQuery(\'child\')" class="h-9 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询子单')+'</button>';
    h+='<button type="button" onclick="trackMaintainQuery(\'bl\')" class="h-9 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('查询提单')+'</button>';
    h+='</div>';
    h+='<button type="button" onclick="trackMaintainClear()" class="w-full h-9 text-xs font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('清空')+'</button>';
    h+='<div class="mt-1.5 text-[11px] text-text-muted">'+tr('按哪个按钮查询，右侧列表与轨迹添加就是哪个维度')+'</div>';
    h+='</div>';
    h+='<div class="flex-1 p-3 overflow-hidden"><textarea id="track-maintain-query" class="w-full h-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-none" placeholder="'+esc(tr('请输入单号，一行一个'))+'">H2607170005</textarea></div>';
    h+='</div>';
    h+='<div class="flex-1 flex flex-col overflow-hidden">';
    h+='<div class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 bg-white">';
    /* 按钮放最左边：标题和维度徽标挪到按钮右边 */
    h+='<button type="button" onclick="openTrackAddModal()" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">+ '+tr('轨迹添加')+'</button>';
    h+='<button type="button" onclick="openTrackDeleteModal()" class="h-9 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer">'+tr('轨迹删除')+'</button>';
    h+='<span class="text-sm font-semibold text-text-primary ml-2">'+tr('轨迹维护')+'</span>';
    h+='<span class="px-2 py-0.5 rounded text-xs font-medium '+(trackMaintainDim()==='waybill'?'bg-primary-50 text-primary-700':(trackMaintainDim()==='child'?'bg-amber-50 text-amber-700':'bg-blue-50 text-blue-700'))+'">'+tr(trackMaintainDimLabel())+tr('维度')+'</span>';
    h+='</div>';
    h+='<div class="flex-1 overflow-auto p-4"><div class="bg-white rounded-xl border border-surface-200 overflow-auto">';
    h+='<table class="w-full text-sm" style="border-collapse:separate;border-spacing:0;min-width:900px"><thead><tr class="bg-[#EFF6FF] text-text-secondary">';
    h+='<th class="px-3 py-3 text-left font-semibold" style="width:40px">#</th>';
    h+='<th class="px-3 py-3 text-left font-semibold" style="width:40px"><input type="checkbox" onchange="trackMaintainToggleAll(this)"></th>';
    trackMaintainColumns().forEach(function(c){h+='<th class="px-3 py-3 text-left font-semibold whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody id="track-maintain-tbody">'+renderTrackMaintainRows()+'</tbody></table>';
    h+='</div></div></div></div>';
    return h;
}

/* 当前列表维度：左侧最后一次查询的按钮决定（waybill/child/bl），不再有独立页签 */
function trackMaintainDim(){return _trackMaintainTab;}
function trackMaintainDimLabel(){
    return _trackMaintainTab==='waybill'?'运单':(_trackMaintainTab==='child'?'子单':'提单');
}
/* 列随维度变：运单维度没有子单列；子单维度最细；提单维度看提单/订单层 */
function trackMaintainColumns(){
    if(_trackMaintainTab==='waybill')return ['运单号','订单单号','运单状态','件数','实际重量','实际体积'];
    if(_trackMaintainTab==='bl')return ['提单号','订单单号','客户名称','提单状态','件数','实际重量','实际体积'];
    return ['子单号','运单号','订单单号','子单状态','实际长度','实际宽度','实际高度','实际重量','实际体积'];
}
/* 维度行：同一份子单种子按维度归堆 —— 运单/提单维度把子单合并计数，不重复列 */
function trackMaintainGroupedRows(){
    if(_trackMaintainTab==='child')return _trackMaintainRows;
    if(_trackMaintainTab==='waybill'){
        var map={},order=[];
        _trackMaintainRows.forEach(function(r){
            if(!map[r.waybill]){map[r.waybill]={key:r.waybill,order:r.order,status:r.status,pcs:0,wgt:0,vol:0};order.push(r.waybill);}
            var g=map[r.waybill];
            g.pcs+=1;g.wgt+=parseFloat(r.wgt)||0;g.vol+=parseFloat(r.vol)||0;
        });
        return order.map(function(k){
            var g=map[k];
            return {key:g.key,order:g.order,status:g.status,pcs:g.pcs,wgt:g.wgt.toFixed(1),vol:g.vol.toFixed(3)};
        });
    }
    /* 提单维度：种子没存提单号，用订单单号当提单层键（原型口径：一提单一批订单） */
    var map2={},order2=[];
    _trackMaintainRows.forEach(function(r){
        var bl=r.order;
        if(!map2[bl]){map2[bl]={key:bl,order:r.order,cust:'深圳市华运达国际货运',status:r.status,pcs:0,wgt:0,vol:0};order2.push(bl);}
        var g2=map2[bl];
        g2.pcs+=1;g2.wgt+=parseFloat(r.wgt)||0;g2.vol+=parseFloat(r.vol)||0;
    });
    return order2.map(function(k){
        var g2=map2[k];
        return {key:g2.key,order:g2.order,cust:g2.cust,status:g2.status,pcs:g2.pcs,wgt:g2.wgt.toFixed(1),vol:g2.vol.toFixed(3)};
    });
}

function renderTrackMaintainRows(){
    var rows=trackMaintainGroupedRows();
    var cols=trackMaintainColumns();
    if(!rows.length)return '<tr><td colspan="'+(cols.length+2)+'" class="px-3 py-12 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
    return rows.map(function(r,i){
        var cells;
        if(_trackMaintainTab==='waybill'){
            cells=[esc(r.key),esc(r.order),esc(r.status),String(r.pcs),esc(r.wgt),esc(r.vol)];
        }else if(_trackMaintainTab==='bl'){
            cells=[esc(r.key),esc(r.order),esc(r.cust),esc(r.status),String(r.pcs),esc(r.wgt),esc(r.vol)];
        }else{
            cells=[esc(r.child),esc(r.waybill),esc(r.order),esc(r.status),esc(r.len),esc(r.wid),esc(r.hgt),esc(r.wgt),esc(r.vol)];
        }
        var h='<tr class="border-t border-surface-100 hover:bg-primary-50/30">'+
            '<td class="px-3 py-3 text-text-muted">'+(i+1)+'</td>'+
            '<td class="px-3 py-3"><input type="checkbox" class="track-maintain-check" value="'+i+'"></td>';
        cells.forEach(function(c,ci){
            h+='<td class="px-3 py-3 '+(ci===0?'font-medium text-primary-700 whitespace-nowrap':'text-text-secondary')+'">'+c+'</td>';
        });
        return h+'</tr>';
    }).join('');
}

function trackMaintainQuery(type){
    /* 查询按钮即维度开关：按运单查右侧就是运单维度，子单/提单同理 */
    _trackMaintainTab=type||'waybill';
    _trackMaintainRows=_trackMaintainSeed.slice();
    /* 整页重画：列头随维度变，局部刷 tbody 换不了表头 */
    var host=document.getElementById('main-content');
    if(host)host.innerHTML=generateTrackMaintainPage('cs-track-maint');
    showToast(tr('查询完成')+'（'+tr(trackMaintainDimLabel())+tr('维度')+'）');
}

function trackMaintainClear(){
    const ta=document.getElementById('track-maintain-query');
    if(ta)ta.value='';
}

function trackMaintainToggleAll(cb){
    document.querySelectorAll('.track-maintain-check').forEach(function(c){c.checked=cb.checked;});
}

/* 维度对应的单号取值器：运单维度看运单号、子单看子单号、提单看订单(提单)号 */
function trackMaintainKeyOf(dim,row){
    if(dim==='waybill')return row.waybill;
    if(dim==='child')return row.child;
    return row.order;
}
/* 按维度组织已有轨迹：{key:{title,tracks[]}} —— 弹窗左侧按这个分组画时间线 */
function trackMaintainTracksByDim(){
    var dim=_trackMaintainTab;
    var grouped=trackMaintainGroupedRows();
    var titles={};
    grouped.forEach(function(g){
        var key=(dim==='child')?g.child:g.key;
        var title;
        if(dim==='waybill')title=tr('运单')+' '+g.key+(g.order?'（'+tr('订单')+' '+g.order+'）':'');
        else if(dim==='bl')title=tr('提单')+' '+g.key+'（'+esc(g.cust||'')+'）';
        else title=g.child;
        titles[key]=title;
    });
    var out={};
    (titles&&Object.keys(titles).length?Object.keys(titles):[]).forEach(function(k){out[k]={title:titles[k],tracks:[]};});
    ((_trackMaintainTracks&&_trackMaintainTracks[dim])||[]).forEach(function(t){
        if(!out[t.key])out[t.key]={title:(dim==='waybill'?tr('运单'):(dim==='bl'?tr('提单'):tr('子单')))+' '+t.key,tracks:[]};
        out[t.key].tracks.push(t);
    });
    return out;
}
/* 轨迹时间线节点（维度通用）：序号圆点 + 时间/创建人/发生地 + 中英文内容 */
function trackMaintainNodeHtml(t,idx){
    var h='<div class="flex gap-3 pl-1">';
    h+='<span class="mt-0.5 w-5 h-5 rounded-full border-2 border-amber-400 text-amber-500 text-[11px] font-medium flex items-center justify-center flex-shrink-0">'+(idx+1)+'</span>';
    h+='<div class="text-xs text-text-secondary leading-relaxed">'+
        '<div>'+esc(t.time)+' 【'+tr('创建人')+'：'+esc(t.by)+' '+tr('发生地')+'：'+esc(t.loc)+'】</div>'+
        '<div class="text-text-primary mt-1">'+esc(t.cn)+' '+esc(t.en)+'</div></div>';
    h+='</div>';
    return h;
}

function openTrackAddModal(scope){
    /* 维度跟着左侧查询按钮走（_trackMaintainTab）。弹窗左侧按维度展示已有轨迹：
     * 迢单维度一组一运单、子单维度一组一子单、提单维度一组一提单。 */
    var dim=_trackMaintainTab;
    var byDim=trackMaintainTracksByDim();
    var keys=Object.keys(byDim);
    if(!keys.length){showToast(tr('暂无数据')+'，'+tr('请先在左侧查询'));return;}
    const scopeLabel=trackMaintainDimLabel();
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='90%';
    titleEl.textContent=tr('轨迹添加')+'-'+scopeLabel;
    let left='<div class="space-y-5">';
    keys.forEach(function(k){
        var g=byDim[k];
        left+='<div class="border-b border-surface-100 pb-4">';
        left+='<div class="flex items-center gap-2 text-sm font-semibold text-text-primary mb-2"><span class="text-text-muted">▼</span><span>'+g.title+'</span></div>';
        if(!g.tracks.length){
            left+='<div class="pl-6 text-xs text-text-muted">'+tr('还没有轨迹，本次添加的是第一条')+'</div>';
        }else{
            left+='<div class="space-y-2.5 pl-5">';
            g.tracks.forEach(function(t,ti){left+=trackMaintainNodeHtml(t,ti);});
            left+='</div>';
        }
        left+='</div>';
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

/* 轨迹删除：弹窗按维度展示轨迹列表（表格带勾选），可多选删除。
 * 删的是轨迹记录本身（_trackMaintainTracks[dim] 里的条目），不是维度行 ——
 * 维度行（运单/子单/提单）还在，删的只是它名下的轨迹节点。 */
function openTrackDeleteModal(){
    var dim=_trackMaintainTab;
    var byDim=trackMaintainTracksByDim();
    var keys=Object.keys(byDim);
    var total=0;
    keys.forEach(function(k){total+=byDim[k].tracks.length;});
    if(!total){showToast(tr('当前维度还没有可删除的轨迹'));return;}
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    titleEl.textContent=tr('轨迹删除')+'-'+trackMaintainDimLabel();
    var h='<div class="space-y-4">';
    h+='<div class="text-xs text-text-secondary bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">'+
        tr('按当前查询维度展示轨迹列表，勾选要删除的轨迹（可多选）；删除的是轨迹记录，不影响单据本身。')+'</div>';
    var idx=0;
    keys.forEach(function(k){
        var g=byDim[k];
        if(!g.tracks.length)return;
        h+='<div><div class="flex items-center gap-2 mb-2 text-sm font-semibold text-text-primary"><span class="w-1 h-4 bg-amber-400 rounded"></span>'+g.title+'<span class="text-xs font-normal text-text-muted">'+g.tracks.length+' '+tr('条')+'</span></div>';
        h+='<div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm"><thead class="bg-surface-50 text-text-secondary"><tr>';
        h+='<th class="px-3 py-2 w-10"><input type="checkbox" onchange="toggleTrackDelGroup(this)"></th>';
        ['轨迹时间','轨迹编号','轨迹内容','发生地','创建人'].forEach(function(c){h+='<th class="px-3 py-2 text-left font-medium whitespace-nowrap">'+tr(c)+'</th>';});
        h+='</tr></thead><tbody>';
        g.tracks.forEach(function(t){
            h+='<tr class="border-t border-surface-100">'+
                '<td class="px-3 py-2"><input type="checkbox" class="track-del-check" value="'+idx+'"></td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(t.time)+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(t.code)+'</td>'+
                '<td class="px-3 py-2 text-text-primary">'+esc(t.cn)+' '+esc(t.en)+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(t.loc)+'</td>'+
                '<td class="px-3 py-2 text-text-secondary whitespace-nowrap">'+esc(t.by)+'</td></tr>';
            idx++;
        });
        h+='</tbody></table></div></div>';
    });
    h+='</div>';
    bodyEl.innerHTML=h;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmTrackDelete()" class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer ml-2">'+tr('确认删除')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}
function toggleTrackDelGroup(box){
    /* 组内全选/全不选：勾选框在同一张表里 */
    var tbl=box.closest?box.closest('table'):null;
    if(!tbl)return;
    tbl.querySelectorAll('.track-del-check').forEach(function(c){c.checked=box.checked;});
}
function confirmTrackDelete(){
    var picked=[];
    document.querySelectorAll('.track-del-check:checked').forEach(function(c){picked.push(parseInt(c.value,10));});
    if(!picked.length){showToast(tr('请先勾选要删除的轨迹'));return;}
    var dim=_trackMaintainTab;
    var remain=(_trackMaintainTracks[dim]||[]).filter(function(_,i){return picked.indexOf(i)<0;});
    var n=picked.length;
    openConfirmTip(tr('确定删除选中的')+' '+n+' '+tr('条轨迹吗？')+'，'+tr('删除后不可恢复。'),function(){
        _trackMaintainTracks[dim]=remain;
        closeCrudModal();
        showToast(tr('已删除')+' '+n+' '+tr('条轨迹'));
    });
}

function fillTrackContent(sel){
    const code=sel.value;
    const row=(TC['biz-track-cfg']&&TC['biz-track-cfg'].d?TC['biz-track-cfg'].d:[]).find(function(r){return r[0]===code;});
    const cn=document.getElementById('track-add-cn');
    const en=document.getElementById('track-add-en');
    if(!row)return;
    /* 按表头名取值：轨迹配置列有增删（法语/葡语、对应系统业务），不能写死下标 */
    const h=(TC['biz-track-cfg']&&TC['biz-track-cfg'].h)||[];
    const val=function(n){var k=h.indexOf(n);return (k>=0&&row[k])?row[k]:'';};
    if(cn)cn.value=val('中文内容')||row[1]||'';
    if(en)en.value=val('英文内容');
}

/* ===== 应收明细 fin-ar-detail（左栏客户/业务员 + 状态页签 + 宽表 + 新增弹窗） ===== */
