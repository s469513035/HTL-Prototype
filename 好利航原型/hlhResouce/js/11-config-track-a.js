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
    /* 输入框撑满剩余高度：外层 flex 布局 + textarea flex-1（h-full 百分比在 padding 容器里
     * 会被裁掉一截，看起来反而变小 —— 改用 flex 拉伸最稳） */
    h+='<div class="flex-1 min-h-0 p-3 flex"><textarea id="track-maintain-query" class="flex-1 w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-none" style="height:100%;min-height:200px" placeholder="'+esc(tr('请输入单号，一行一个'))+'">H2607170005</textarea></div>';
    h+='</div>';
    h+='<div class="flex-1 flex flex-col overflow-hidden">';
    h+='<div class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 bg-white">';
    /* 按钮放最左边：标题和维度徽标挪到按钮右边 */
    h+='<button type="button" onclick="openTrackAddModal()" class="h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">+ '+tr('轨迹添加')+'</button>';
    h+='<button type="button" onclick="openTrackDeleteModal()" class="h-9 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer">'+tr('轨迹删除')+'</button>';
    h+='<button type="button" onclick="openTrackNodeDeleteModal()" class="h-9 px-4 text-sm font-medium text-red-600 border border-red-200 bg-white rounded-lg hover:bg-red-50 cursor-pointer">'+tr('按节点删除')+'</button>';
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
/* 列随维度变：运单维度没有子单列；子单维度最细（无订单层列）；提单维度按配舱/票数看。
 * 各维度末尾统一带「最新轨迹」列 —— 点开看该单全部轨迹。 */
function trackMaintainColumns(){
    if(_trackMaintainTab==='waybill')return ['运单号','客户单号','运单状态','件数','实际重量','实际体积','最新轨迹'];
    if(_trackMaintainTab==='bl')return ['提单号','配舱单号','提单状态','票数','件数','实际重量','实际体积','最新轨迹'];
    return ['子单号','运单号','子单状态','实际长度','实际宽度','实际高度','实际重量','实际体积','最新轨迹'];
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
    /* 提单维度：一张提单挂一张配舱单，票数 = 底下去重后的运单数 */
    var map2={},order2=[];
    _trackMaintainRows.forEach(function(r){
        var bl=r.order;
        if(!map2[bl]){map2[bl]={key:bl,alloc:r.alloc||'',status:r.status,pcs:0,wbs:{},wgt:0,vol:0};order2.push(bl);}
        var g2=map2[bl];
        g2.pcs+=1;g2.wbs[r.waybill]=1;g2.wgt+=parseFloat(r.wgt)||0;g2.vol+=parseFloat(r.vol)||0;
    });
    return order2.map(function(k){
        var g2=map2[k];
        return {key:g2.key,alloc:g2.alloc,status:g2.status,pcs:g2.pcs,tickets:Object.keys(g2.wbs).length,wgt:g2.wgt.toFixed(1),vol:g2.vol.toFixed(3)};
    });
}

/* 某个维度行名下该维度的轨迹（按 key 匹配，时间倒序） */
function trackMaintainTracksOfKey(key){
    var dim=_trackMaintainTab;
    return (((_trackMaintainTracks[dim])||[]).filter(function(t){return t.key===key;}))
        .slice().sort(function(a,b){return String(b.time)>String(a.time)?1:-1;});
}
/* 展开状态：展开行集合（按组下标），重查/换维度时清 */
var _trackMaintainOpenSet={};
function toggleTrackMaintainExpand(i){
    if(_trackMaintainOpenSet[i])delete _trackMaintainOpenSet[i];
    else _trackMaintainOpenSet[i]=1;
    var tb=document.getElementById('track-maintain-tbody');
    if(tb)tb.innerHTML=renderTrackMaintainRows();
}

function renderTrackMaintainRows(){
    var rows=trackMaintainGroupedRows();
    var cols=trackMaintainColumns();
    if(!rows.length)return '<tr><td colspan="'+(cols.length+2)+'" class="px-3 py-12 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
    return rows.map(function(r,i){
        var cells;
        var key=(_trackMaintainTab==='child')?r.child:r.key;
        var tracks=trackMaintainTracksOfKey(key);
        var latest=tracks.length?tracks[0]:null;
        var expandHtml;
        if(_trackMaintainTab==='waybill'){
            cells=[esc(r.key),esc(r.order),esc(r.status),String(r.pcs),esc(r.wgt),esc(r.vol)];
        }else if(_trackMaintainTab==='bl'){
            cells=[esc(r.key),esc(r.alloc),esc(r.status),String(r.tickets),String(r.pcs),esc(r.wgt),esc(r.vol)];
        }else{
            cells=[esc(r.child),esc(r.waybill),esc(r.status),esc(r.len),esc(r.wid),esc(r.hgt),esc(r.wgt),esc(r.vol)];
        }
        var h='<tr class="border-t border-surface-100 hover:bg-primary-50/30">'+
            '<td class="px-3 py-3 text-text-muted">'+(i+1)+'</td>'+
            '<td class="px-3 py-3"><input type="checkbox" class="track-maintain-check" value="'+i+'"></td>';
        cells.forEach(function(c,ci){
            h+='<td class="px-3 py-3 '+(ci===0?'font-medium text-primary-700 whitespace-nowrap':'text-text-secondary')+'">'+c+'</td>';
        });
        /* 最新轨迹列：最新一条（时间+内容），点 ▾/▸ 展开该单全部轨迹 */
        h+='<td class="px-3 py-3 whitespace-nowrap">'+
            (latest
                ?'<span class="text-xs text-text-muted mr-1.5">'+esc(latest.time.slice(5,16))+'</span><span class="text-text-secondary">'+esc(latest.cn)+'</span>'
                :'<span class="text-text-muted">—</span>')+
            (tracks.length
                ?'<a class="ml-2 text-xs text-primary-600 hover:text-primary-700 cursor-pointer" onclick="toggleTrackMaintainExpand('+i+')">'+(_trackMaintainOpenSet[i]?'▸'+tr('收起'):'▾'+tr('全部轨迹')+'('+tracks.length+')')+'</a>'
                :'')+
            '</td>';
        h+='</tr>';
        /* 展开行：该单全部轨迹（时间正序完整时间线） */
        if(_trackMaintainOpenSet[i]&&tracks.length){
            h+='<tr class="bg-surface-50/60"><td colspan="'+(cols.length+2)+'" class="px-4 py-3">';
            h+='<div class="text-xs font-semibold text-text-primary mb-2">'+tr('全部轨迹')+'（'+tracks.length+'）</div>';
            h+='<div class="space-y-2.5 pl-2">';
            tracks.slice().reverse().forEach(function(t,ti){h+=trackMaintainNodeHtml(t,ti);});
            h+='</div></td></tr>';
        }
        return h;
    }).join('');
}

function trackMaintainQuery(type){
    /* 查询按钮即维度开关：按运单查右侧就是运单维度，子单/提单同理 */
    _trackMaintainTab=type||'waybill';
    _trackMaintainRows=_trackMaintainSeed.slice();
    _trackMaintainOpenSet={};   /* 展开状态随查询重置 */
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
        else if(dim==='bl')title=tr('提单')+' '+g.key+(g.alloc?('（'+tr('配舱')+' '+g.alloc+'）'):'');
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
    /* 维度跟着左侧查询按钮走（_trackMaintainTab）。弹窗只放新增表单 ——
     * 已有轨迹在右侧列表展开就能看，不必在弹窗里再放一份时间线。 */
    var dim=_trackMaintainTab;
    var grouped=trackMaintainGroupedRows();
    if(!grouped.length){showToast(tr('暂无数据')+'，'+tr('请先在左侧查询'));return;}
    const scopeLabel=trackMaintainDimLabel();
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='52%';
    titleEl.textContent=tr('轨迹添加')+'-'+scopeLabel;
    const trackCodeOpts=(TC['biz-track-cfg']&&TC['biz-track-cfg'].d?TC['biz-track-cfg'].d:[]).map(function(r){return {code:r[0],label:r[0]+' '+r[1]};});
    const locOpts=['中国(China,CN)','尼日利亚(Nigeria,NG)','塞内加尔(Senegal,SN)','科特迪瓦(Ivory Coast,CI)','加纳(Ghana,GH)','喀麦隆(Cameroon,CM)'];
    const inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    var h='<div class="space-y-4">';
    h+='<div class="text-xs text-text-secondary bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">'+
        tr('将按当前查询维度（')+scopeLabel+tr('）为列表中的单据添加轨迹。');
    h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">';
    h+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('轨迹发生时间')+'</label><input type="datetime-local" class="'+inputCls+'"></div>';
    h+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block">'+tr('轨迹编号')+'</label><select onchange="fillTrackContent(this)" class="'+inputCls+'"><option value="">'+tr('请选择轨迹编号')+'</option>'+trackCodeOpts.map(function(o){return '<option value="'+esc(o.code)+'">'+esc(o.label)+'</option>';}).join('')+'</select></div>';
    h+='<div class="md:col-span-2"><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('轨迹内容（中文）')+'</label><textarea id="track-add-cn" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入轨迹内容（中文）'))+'"></textarea></div>';
    h+='<div class="md:col-span-2"><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('轨迹内容（英文）')+'</label><textarea id="track-add-en" rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入轨迹内容（英文）'))+'"></textarea></div>';
    h+='<div><label class="text-sm font-medium text-text-secondary mb-1.5 block"><span class="text-red-500">*</span> '+tr('轨迹发生地')+'</label><select class="'+inputCls+'"><option value="">'+tr('请选择轨迹发生地')+'</option>'+locOpts.map(function(o){return '<option value="'+esc(o)+'">'+esc(o)+'</option>';}).join('')+'</select></div>';
    h+='</div></div>';
    bodyEl.innerHTML=h;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('轨迹添加成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确定')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* 轨迹删除：弹窗按维度展示轨迹列表（表格带勾选），可多选删除。
 * 删的是轨迹记录本身（_trackMaintainTracks[dim] 里的条目），不是维度行 ——
 * 维度行（运单/子单/提单）还在，删的只是它名下的轨迹节点。 */
/* 轨迹删除：不弹选择窗 —— 勾列表行后直接删该单据名下全部轨迹，弹确认提示。
 * 删的是维度记录（_trackMaintainTracks[dim] 里该 key 的条目），维度行本身保留。 */
function openTrackDeleteModal(){
    var dim=_trackMaintainTab;
    var grouped=trackMaintainGroupedRows();
    var pickedIdx=[];
    document.querySelectorAll('.track-maintain-check:checked').forEach(function(c){pickedIdx.push(parseInt(c.value,10));});
    if(!pickedIdx.length){showToast(tr('请先在列表勾选要删除轨迹的单据'));return;}
    /* 汇总每个勾中单据名下的轨迹条数 */
    var dimKeys=pickedIdx.map(function(i){var g=grouped[i];return g?(_trackMaintainTab==='child'?g.child:g.key):null;}).filter(Boolean);
    var total=0,nos=[];
    dimKeys.forEach(function(key){
        var n=trackMaintainTracksOfKey(key).length;
        if(n>0){total+=n;nos.push(key+'('+n+')');}
    });
    if(!total){showToast(tr('勾选的单据名下还没有轨迹，无可删除'));return;}
    openConfirmTip(tr('将删除勾选单据名下的全部轨迹：')+nos.join('、')+'，'+tr('共')+' '+total+' '+tr('条，删除后不可恢复。'),function(){
        _trackMaintainTracks[dim]=(_trackMaintainTracks[dim]||[]).filter(function(t){return dimKeys.indexOf(t.key)<0;});
        _trackMaintainOpenSet={};
        var tb=document.getElementById('track-maintain-tbody');
        if(tb)tb.innerHTML=renderTrackMaintainRows();
        showToast(tr('已删除')+' '+total+' '+tr('条轨迹'));
    });
}

/* 按节点删除：弹窗选轨迹节点（出发登记/到达目的港…），对列表勾中的单据批量删该节点的轨迹 ——
 * 批量补录错节点时用：错的都是同一个节点，一次删干净再重加。 */
function openTrackNodeDeleteModal(){
    var dim=_trackMaintainTab;
    var grouped=trackMaintainGroupedRows();
    var pickedIdx=[];
    document.querySelectorAll('.track-maintain-check:checked').forEach(function(c){pickedIdx.push(parseInt(c.value,10));});
    if(!pickedIdx.length){showToast(tr('请先在列表勾选要删除轨迹的单据'));return;}
    var dimKeys=pickedIdx.map(function(i){var g=grouped[i];return g?(_trackMaintainTab==='child'?g.child:g.key):null;}).filter(Boolean);
    /* 勾中单据名下出现过的节点（编号+名称去重） */
    var nodes={},order=[];
    dimKeys.forEach(function(key){
        trackMaintainTracksOfKey(key).forEach(function(t){
            var k=t.code+'|'+t.cn;
            if(!nodes[k]){nodes[k]={code:t.code,cn:t.cn,keys:{}};order.push(k);}
            nodes[k].keys[key]=1;
        });
    });
    if(!order.length){showToast(tr('勾选的单据名下还没有轨迹，无可删除'));return;}
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='46%';
    titleEl.textContent=tr('按节点删除')+'-'+trackMaintainDimLabel();
    var h='<div class="space-y-4">';
    h+='<div class="text-xs text-text-secondary bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">'+
        tr('选择轨迹节点，将勾选单据（')+dimKeys.length+tr(' 个）名下该节点的轨迹批量删除。')+'</div>';
    h+='<div class="border border-surface-200 rounded-lg bg-white divide-y divide-surface-100">';
    order.forEach(function(k,i){
        var n=nodes[k];
        var cnt=Object.keys(n.keys).length;
        h+='<label class="flex items-center justify-between px-3 py-2.5 hover:bg-primary-50/40 cursor-pointer">'+
            '<span class="flex items-center gap-2"><input type="checkbox" class="track-node-del-check rounded border-surface-300 text-primary-600" value="'+i+'" data-code="'+esc(n.code)+'" data-cn="'+esc(n.cn)+'">'+
            '<span class="text-sm text-text-primary">'+esc(n.cn)+'</span>'+
            '<span class="text-xs text-text-muted">'+esc(n.code)+'</span></span>' +
            '<span class="text-xs text-text-muted">'+cnt+' '+tr('个单据')+'</span></label>';
    });
    h+='</div></div>';
    bodyEl.innerHTML=h;
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="confirmTrackNodeDelete()" class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer ml-2">'+tr('确认删除')+'</button>';
    _trackNodeDelCtx={dimKeys:dimKeys};
    document.getElementById('crud-modal').classList.add('show');
}
var _trackNodeDelCtx={dimKeys:[]};
function confirmTrackNodeDelete(){
    var boxes=document.querySelectorAll('.track-node-del-check:checked');
    if(!boxes.length){showToast(tr('请先勾选要删除的轨迹节点'));return;}
    var pairs=[];
    boxes.forEach(function(b){pairs.push({code:b.getAttribute('data-code'),cn:b.getAttribute('data-cn')});});
    var dim=_trackMaintainTab,keys=_trackNodeDelCtx.dimKeys||[];
    var hit=0;
    (_trackMaintainTracks[dim]||[]).forEach(function(t){
        if(keys.indexOf(t.key)<0)return;
        if(pairs.some(function(p){return p.code===t.code&&p.cn===t.cn;}))hit++;
    });
    if(!hit){showToast(tr('所选单据名下没有该节点的轨迹'));return;}
    openConfirmTip(tr('将删除')+keys.length+tr(' 个单据名下的「')+pairs.map(function(p){return p.cn;}).join('、')+'」轨迹，共 '+hit+' '+tr('条，删除后不可恢复。'),function(){
        _trackMaintainTracks[dim]=(_trackMaintainTracks[dim]||[]).filter(function(t){
            if(keys.indexOf(t.key)<0)return true;
            return !pairs.some(function(p){return p.code===t.code&&p.cn===t.cn;});
        });
        _trackMaintainOpenSet={};
        closeCrudModal();
        var tb=document.getElementById('track-maintain-tbody');
        if(tb)tb.innerHTML=renderTrackMaintainRows();
        showToast(tr('已按节点删除')+' '+hit+' '+tr('条轨迹'));
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
