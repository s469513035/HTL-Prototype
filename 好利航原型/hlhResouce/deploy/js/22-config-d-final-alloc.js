function openTrackCfgModal(mode,id,rowIdx,rowData){
    const L=_lang[_currentLang];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='72%';
    const isEdit=mode==='edit';
    /* 按表头名取值：轨迹配置已插入法语/葡语内容列，列序会变，不能写死下标 */
    const gv=function(n,dft){
        var h=(TC[id]&&TC[id].h)||[];var k=h.indexOf(n);
        var v=(k>=0&&rowData)?(rowData[k]==null?'':String(rowData[k])):'';
        return v===''?(dft||''):v;
    };
    const code=gv('轨迹编号');
    const name=gv('轨迹名称');
    const type=gv('轨迹类型');
    const cnContent=gv('中文内容');
    const enContent=gv('英文内容');
    const frContent=gv('法语内容');
    const ptContent=gv('葡语内容');
    const clientShow=gv('客户端是否显示','是');
    const remark=gv('备注');
    const sortNo=gv('排序号','100');
    const trackTypes=(typeof TRACK_TYPE_OPTIONS!=='undefined')?TRACK_TYPE_OPTIONS:['预报','入仓','装袋','配舱','国内仓出库','离港','到港','提柜','海外入仓','预约提货','海外出仓','签收'];
    titleEl.textContent=isEdit?tr('编辑'):tr('新增');
    const inputCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    function lbl(t,req){return '<label class="text-sm font-medium text-text-secondary mb-1.5 block">'+(req?'<span class="text-red-500">*</span> ':'')+tr(t)+'</label>';}
    function selHtml(opts,val,ph){var s='<select class="'+inputCls+'"><option value="">'+tr(ph)+'</option>';opts.forEach(function(o){s+='<option value="'+esc(o)+'"'+(val===o?' selected':'')+'>'+esc(o)+'</option>';});return s+'</select>';}
    let html='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">';
    html+='<div>'+lbl('轨迹编号',true);
    if(isEdit){html+='<input type="text" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 cursor-not-allowed" value="'+esc(code)+'" readonly></div>';}
    else{html+='<input type="text" required class="'+inputCls+'" value="'+esc(code)+'" placeholder="'+esc(tr('请输入轨迹编号'))+'"></div>';}
    html+='<div>'+lbl('轨迹名称',true)+'<input type="text" required class="'+inputCls+'" value="'+esc(name)+'" placeholder="'+esc(tr('请输入轨迹名称'))+'"></div>';
    html+='<div>'+lbl('轨迹类型',false)+selHtml(trackTypes,type,'请选择轨迹类型')+'</div>';
    html+='<div>'+lbl('中文内容',false)+'<input type="text" class="'+inputCls+'" value="'+esc(cnContent)+'" placeholder="'+esc(tr('请输入中文内容'))+'"></div>';
    html+='<div>'+lbl('中文内容(字典维护映射值)',false)+'<input type="text" class="'+inputCls+'" placeholder="'+esc(tr('请输入中文内容(字典维护映射值)'))+'"></div>';
    html+='<div>'+lbl('英文内容',false)+'<input type="text" class="'+inputCls+'" value="'+esc(enContent)+'" placeholder="'+esc(tr('请输入英文内容'))+'"></div>';
    html+='<div>'+lbl('英文内容(字典维护映射值)',false)+'<input type="text" class="'+inputCls+'" placeholder="'+esc(tr('请输入英文内容(字典维护映射值)'))+'"></div>';
    html+='<div>'+lbl('法语内容',false)+'<input type="text" class="'+inputCls+'" value="'+esc(frContent)+'" placeholder="'+esc(tr('请输入法语内容'))+'"></div>';
    html+='<div>'+lbl('葡语内容',false)+'<input type="text" class="'+inputCls+'" value="'+esc(ptContent)+'" placeholder="'+esc(tr('请输入葡语内容'))+'"></div>';
    html+='<div>'+lbl('客户端显示标志',true)+'<select class="'+inputCls+'">'+['是','否'].map(function(o){return '<option value="'+esc(o)+'"'+(clientShow===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';
    html+='<div>'+lbl('排序',false)+'<input type="number" class="'+inputCls+'" value="'+esc(sortNo)+'"></div>';
    html+='<div>'+lbl('备注',false)+'<textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入备注'))+'">'+esc(remark)+'</textarea></div>';
    html+='</div>';
    bodyEl.innerHTML=html;
    const toast=isEdit?tr('保存成功'):tr('新增成功');
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button><button onclick="closeCrudModal();showToast(\''+toast+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+(isEdit?tr('保存修改'):tr('确认提交'))+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

/* ===== 配舱计划 wh-final-alloc 弹窗集合 ===== */
var _finalAllocUnselectedSeed=[
    {no:'XJWCS2',pcs:6,canPcs:6,canWt:6,canVol:'0.000006',outWt:6,outVol:'0.000006',sub:[{no:'H-XJWCS2-001',pcs:6,canPcs:6,canWt:6,canVol:'0.000006',outWt:6,outVol:'0.000006'}]},
    {no:'XJWCS3',pcs:2,canPcs:2,canWt:2,canVol:'0.000002',outWt:2,outVol:'0.000002',sub:[{no:'H-XJWCS3-001',pcs:2,canPcs:2,canWt:2,canVol:'0.000002',outWt:2,outVol:'0.000002'}]},
    {no:'YP20260626',pcs:6,canPcs:6,canWt:6,canVol:'0.000006',outWt:6,outVol:'0.000006',sub:[{no:'H-YP20260626-001',pcs:6,canPcs:6,canWt:6,canVol:'0.000006',outWt:6,outVol:'0.000006'}]},
    {no:'YPC-20260626003',pcs:4,canPcs:4,canWt:4,canVol:'0.000004',outWt:4,outVol:'0.000004',sub:[{no:'H-YPC-20260626003-001',pcs:4,canPcs:4,canWt:4,canVol:'0.000004',outWt:4,outVol:'0.000004'}]},
    {no:'YPC-TY',pcs:14,canPcs:14,canWt:14,canVol:'0.000014',outWt:14,outVol:'0.000014',sub:[{no:'H-YPC-TY-001',pcs:14,canPcs:14,canWt:14,canVol:'0.000014',outWt:14,outVol:'0.000014'}]}
];
var _finalAllocState={mode:'add',unselected:[],selected:[],expanded:{},header:{no:'',transport:'海运',bl:'',country:'',containerNo:'',label:''}};

function _finalAllocClone(arr){return JSON.parse(JSON.stringify(arr));}

function _finalAllocResetState(mode,headerInit,selectedInit){
    _finalAllocState.mode=mode;
    _finalAllocState.unselected=_finalAllocClone(_finalAllocUnselectedSeed);
    _finalAllocState.selected=selectedInit?_finalAllocClone(selectedInit):[];
    _finalAllocState.expanded={};
    _finalAllocState.header=Object.assign({no:'',transport:'海运',bl:'',country:'',containerNo:'',label:''},headerInit||{});
}

function _finalAllocPanelTable(side){
    const isLeft=side==='unselected';
    const rows=isLeft?_finalAllocState.unselected:_finalAllocState.selected;
    // 左侧(未选)：运单号|件数|可配件数|可配实重|可配体积|实际重量|实际体积
    // 右侧(已选)：运单号|件数|实际重量|实际体积（去掉可配实重/可配体积；可配件数→件数）
    const cols=isLeft?['运单号','件数','可配件数','可配实重','可配体积','实际重量','实际体积']
                     :['运单号','件数','出货重量','出货体积'];
    const colspan=cols.length+2;
    let h='<div class="border border-surface-200 rounded-lg overflow-hidden bg-white"><div class="overflow-auto" style="max-height:520px"><table class="w-full text-xs" style="border-collapse:separate;border-spacing:0">';
    h+='<thead class="bg-[#EFF6FF] sticky top-0 z-10"><tr>';
    h+='<th class="px-2 py-2 text-left font-semibold text-text-secondary" style="width:36px">#</th>';
    h+='<th class="px-2 py-2 text-left font-semibold text-text-secondary" style="width:32px"><input type="checkbox" onchange="finalAllocToggleAll(\''+side+'\',this.checked)"></th>';
    cols.forEach(function(c){h+='<th class="px-2 py-2 text-left font-semibold text-text-secondary whitespace-nowrap">'+c+'</th>';});
    h+='</tr></thead><tbody>';
    if(!rows.length){
        h+='<tr><td colspan="'+colspan+'" class="px-3 py-12 text-center text-text-muted">'+tr('暂无数据')+'</td></tr>';
    }
    rows.forEach(function(r,i){
        const expKey=side+'-'+i;
        const expanded=!!_finalAllocState.expanded[expKey];
        const arrow=expanded?'▾':'▸';
        h+='<tr class="hover:bg-primary-50/30 border-b border-surface-100"><td class="px-2 py-2 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-2 py-2"><input type="checkbox" class="final-alloc-check final-alloc-check-parent" data-side="'+side+'" data-idx="'+i+'" onchange="finalAllocSyncSub(this)"></td>';
        h+='<td class="px-2 py-2 font-medium text-primary-700 whitespace-nowrap"><span class="cursor-pointer mr-1 text-text-muted" onclick="finalAllocToggleRow(\''+side+'\','+i+')">'+arrow+'</span>'+esc(r.no)+'</td>';
        if(isLeft){
            h+='<td class="px-2 py-2 text-right">'+r.pcs+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.canPcs+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.canWt+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.canVol+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.outWt+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.outVol+'</td></tr>';
        }else{
            h+='<td class="px-2 py-2 text-right">'+r.pcs+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.outWt+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.outVol+'</td></tr>';
        }
        if(expanded&&r.sub){
            r.sub.forEach(function(s,si){
                h+='<tr class="bg-surface-50/60 border-b border-surface-100"><td class="px-2 py-2 text-text-muted">'+(i+1)+'.'+(si+1)+'</td>';
                h+='<td class="px-2 py-2"><input type="checkbox" class="final-alloc-sub-check" data-side="'+side+'" data-pidx="'+i+'" data-sidx="'+si+'" onchange="finalAllocSyncParent(this)"></td>';
                h+='<td class="px-2 py-2 pl-6 text-text-secondary whitespace-nowrap">'+esc(s.no)+'</td>';
                if(isLeft){
                    h+='<td class="px-2 py-2 text-right">'+s.pcs+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.canPcs+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.canWt+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.canVol+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.outWt+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.outVol+'</td></tr>';
                }else{
                    h+='<td class="px-2 py-2 text-right">'+s.pcs+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.outWt+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.outVol+'</td></tr>';
                }
            });
        }
    });
    h+='</tbody></table></div>';
    /* 合计行 */
    const totalPcs=rows.reduce(function(a,b){return a+(+b.pcs||0);},0);
    const totalCan=rows.reduce(function(a,b){return a+(+b.canPcs||0);},0);
    const totalOutWt=rows.reduce(function(a,b){return a+(+b.outWt||0);},0);
    const totalOutVol=rows.reduce(function(a,b){return a+(parseFloat(b.outVol)||0);},0);
    h+='<div class="flex items-center gap-4 px-3 py-2 border-t border-surface-200 bg-surface-50/40 text-xs text-text-secondary">';
    h+='<span class="font-medium text-text-primary">'+tr('总合计')+'：</span>';
    if(isLeft){
        h+='<span>'+tr('总票数')+': '+totalPcs+'</span>';
        h+='<span>'+tr('可配件数')+': '+totalCan+'</span>';
        h+='<span>'+tr('实际重量')+': '+totalOutWt+'</span>';
        h+='<span>'+tr('实际方数')+': '+totalOutVol.toFixed(6)+'</span>';
    }else{
        h+='<span>'+tr('总票数')+': '+rows.length+'</span>';
        h+='<span>'+tr('总件数')+': '+totalPcs+'</span>';
        h+='<span>'+tr('出货重量')+': '+totalOutWt+'</span>';
        h+='<span>'+tr('出货体积')+': '+totalOutVol.toFixed(6)+'</span>';
    }
    h+='</div></div>';
    return h;
}

function _finalAllocLeftPanel(showAdvanced){
    let h='';
    h+='<div class="text-sm font-semibold text-orange-600 mb-2">'+tr('未选数据')+'</div>';
    /* 查询行 */
    h+='<div class="bg-white border border-surface-200 rounded-lg p-3 mb-3">';
    h+='<div class="mb-3 pb-3 border-b border-surface-100"><div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('运输方式')+'</label><select class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50"><option value="">'+tr('全部')+'</option><option>'+tr('海运')+'</option><option>'+tr('空运')+'</option><option>'+tr('卡航')+'</option><option>'+tr('快递')+'</option></select></div></div>';
    h+='<div class="grid grid-cols-3 gap-3">';
    const _faQueryFields=[
        {label:'仓库归属',type:'select',options:['广州南沙仓','深圳坂田仓','上海洋山仓','东莞虎门仓']},
        {label:'运单号',type:'text'},
        {label:'收件国家',type:'select',options:['美国','尼日利亚','塞内加尔','科特迪瓦','多哥','喀麦隆']},
        {label:'收件仓库',type:'select',options:['拉各斯仓','达喀尔仓','阿比让仓','洛美仓','杜阿拉仓','LAX-Amazon FBA']},
        {label:'品名大类',type:'select',options:['普货','电子产品','服装鞋帽','五金工具','家居用品','食品','化妆品','其他']},
        {label:'客户类型',type:'select',options:['直客','货代','合作客户']}
    ];
    _faQueryFields.forEach(function(q){
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+q.label+'</label>';
        if(q.type==='select'){
            h+='<select class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50"><option value="">'+tr('请选择')+q.label+'</option>';
            q.options.forEach(function(o){h+='<option>'+esc(o)+'</option>';});
            h+='</select>';
        }else{
            h+='<input type="text" placeholder="'+tr('请输入')+q.label+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50">';
        }
        h+='</div>';
    });
    h+='</div></div>';
    /* 操作按钮行 */
    h+='<div class="flex flex-wrap gap-2 mb-2">';
    h+='<button class="h-8 px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer" onclick="showToast(tr(\'查询完成\'))">'+tr('查询')+'</button>';
    h+='<button class="h-8 px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer" onclick="finalAllocExpandAll(true)">'+tr('全部展开')+'</button>';
    h+='<button class="h-8 px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer" onclick="finalAllocExpandAll(false)">'+tr('全部收起')+'</button>';
    h+='</div>';
    return h;
}

function _finalAllocRightPanel(showHeader){
    let h='';
    h+='<div class="text-sm font-semibold text-orange-600 mb-2">'+tr('已选数据')+'</div>';
    if(showHeader){
        const hd=_finalAllocState.header;
        const countries=['塞内加尔','尼日利亚','加纳','科特迪瓦','喀麦隆','多哥'];
        h+='<div class="bg-white border border-surface-200 rounded-lg p-3 mb-3"><div class="grid grid-cols-3 gap-3">';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary"><span class="text-red-500">*</span> '+tr('配舱单号')+'</label><input type="text" value="'+esc(hd.no)+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-no"></div>';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('标签编号')+'</label><input type="text" value="'+esc(hd.label||'')+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-label" placeholder="'+esc(tr('请输入标签编号'))+'"></div>';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('国家')+'</label><select class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-country"><option value="">'+tr('请选择')+'</option>';
        countries.forEach(function(o){h+='<option'+(o===hd.country?' selected':'')+'>'+o+'</option>';});
        h+='</select></div>';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('柜号')+'</label><input type="text" value="'+esc(hd.containerNo||'')+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-container" placeholder="'+esc(tr('请输入柜号'))+'"></div>';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('运输方式')+'</label><select class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-transport">';
        ['海运','空运','卡航','快递'].forEach(function(o){h+='<option'+(o===hd.transport?' selected':'')+'>'+o+'</option>';});
        h+='</select></div>';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('关联提单')+'</label><input type="text" value="'+esc(hd.bl)+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-bl"></div>';
        h+='</div></div>';
    }
    return h;
}

function _finalAllocBodyHtml(mode){
    const arrows='<div class="flex flex-col justify-center gap-3 px-1"><button class="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-base cursor-pointer" onclick="finalAllocMove(\'right\')" title="'+tr('选入')+'">›</button><button class="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-base cursor-pointer" onclick="finalAllocMove(\'left\')" title="'+tr('移除')+'">‹</button></div>';
    let h='<div class="flex flex-col gap-3">';
    /* 控件行：左(查询+按钮) 与 右(表头) 顶部对齐（高度可不同） */
    h+='<div class="flex gap-4 items-start">';
    h+='<div class="flex-1 min-w-0">'+_finalAllocLeftPanel(mode==='add')+'</div>';
    h+='<div class="flex-shrink-0" style="width:40px"></div>';
    h+='<div class="flex-1 min-w-0">'+_finalAllocRightPanel(true)+'</div>';
    h+='</div>';
    /* 表格行：左右两表顶部对齐 */
    h+='<div class="flex gap-4 items-start">';
    h+='<div class="flex-1 min-w-0">'+_finalAllocPanelTable('unselected')+'</div>';
    h+=arrows;
    h+='<div class="flex-1 min-w-0">'+_finalAllocPanelTable('selected')+'</div>';
    h+='</div>';
    h+='</div>';
    return h;
}

function finalAllocToggleRow(side,i){
    const k=side+'-'+i;
    _finalAllocState.expanded[k]=!_finalAllocState.expanded[k];
    finalAllocRerender();
}

function finalAllocExpandAll(open){
    _finalAllocState.expanded={};
    if(open){
        _finalAllocState.unselected.forEach(function(_,i){_finalAllocState.expanded['unselected-'+i]=true;});
        _finalAllocState.selected.forEach(function(_,i){_finalAllocState.expanded['selected-'+i]=true;});
    }
    finalAllocRerender();
}

function finalAllocToggleAll(side,checked){
    document.querySelectorAll('.final-alloc-check[data-side="'+side+'"]').forEach(function(cb){cb.checked=checked;});
    document.querySelectorAll('.final-alloc-sub-check[data-side="'+side+'"]').forEach(function(cb){cb.checked=checked;});
}

function finalAllocSyncSub(parentCb){
    const side=parentCb.dataset.side;
    const idx=parentCb.dataset.idx;
    document.querySelectorAll('.final-alloc-sub-check[data-side="'+side+'"][data-pidx="'+idx+'"]').forEach(function(cb){cb.checked=parentCb.checked;});
}

function finalAllocSyncParent(subCb){
    const side=subCb.dataset.side;
    const pidx=subCb.dataset.pidx;
    const parent=document.querySelector('.final-alloc-check-parent[data-side="'+side+'"][data-idx="'+pidx+'"]');
    if(!parent)return;
    const subs=document.querySelectorAll('.final-alloc-sub-check[data-side="'+side+'"][data-pidx="'+pidx+'"]');
    let anyChecked=false;
    subs.forEach(function(cb){if(cb.checked)anyChecked=true;});
    parent.checked=anyChecked;
}

function finalAllocMove(dir){
    const fromKey=dir==='right'?'unselected':'selected';
    const toKey=dir==='right'?'selected':'unselected';
    const checks=document.querySelectorAll('.final-alloc-check[data-side="'+fromKey+'"]:checked');
    if(!checks.length){showToast(tr(dir==='right'?'请勾选要选入的数据':'请勾选要移除的数据'));return;}
    const indices=Array.prototype.map.call(checks,function(cb){return parseInt(cb.dataset.idx,10);}).sort(function(a,b){return b-a;});
    indices.forEach(function(idx){
        const row=_finalAllocState[fromKey].splice(idx,1)[0];
        _finalAllocState[toKey].push(row);
    });
    _finalAllocState.expanded={};
    finalAllocRerender();
}

function finalAllocRerender(){
    const body=document.getElementById('crud-modal-body');
    if(body)body.innerHTML=_finalAllocBodyHtml(_finalAllocState.mode);
}

function _finalAllocNextNo(id){
    const data=_listData[id]||(TC[id]&&TC[id].d)||[];
    const d=new Date();
    const dateStr=String(d.getFullYear())+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
    const prefix='ZPCD-'+dateStr+'-';
    const todaySeqs=data.map(function(row){
        const m=String((row&&row[0])||'').match(new RegExp('^'+prefix+'(\\d+)$'));
        return m?parseInt(m[1],10):0;
    });
    const next=(todaySeqs.length?Math.max.apply(null,todaySeqs):0)+1;
    return prefix+String(next).padStart(3,'0');
}

function openFinalAllocAddModal(id){
    _finalAllocResetState('add',{no:_finalAllocNextNo(id),transport:'海运',bl:'',country:'',containerNo:''},null);
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='92%';
    titleEl.textContent=tr('新增');
    bodyEl.innerHTML=_finalAllocBodyHtml('add');
    footerEl.innerHTML='<button class="px-4 h-9 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer mr-2" onclick="finalAllocSubmit(\'add\',\''+id+'\')">'+tr('终配舱登记')+'</button>'+
        '<button class="px-4 h-9 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer" onclick="closeCrudModal()">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openFinalAllocAdjustModal(id,rowIdx){
    const idx=(rowIdx===undefined||rowIdx<0)?getSelectedRowIndex():rowIdx;
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    const row=(_listData[id]||TC[id].d)[idx]||[];
    const presetNo=row[0]||'';
    const presetLabel=row[1]||'';
    const presetBL=row[2]||'';
    const presetCountry=row[3]||'';
    const presetContainer=row[4]||'';
    const presetTransport=row[8]||'海运';
    const presetSelected=[{no:presetNo.replace(/-终配/,'-预配').replace(/^ZPCD-/,'YPC-'),pcs:2,canPcs:0,canWt:2,canVol:'0.000002',outWt:2,outVol:'0.000002',sub:[{no:'H82606240002',pcs:2,canPcs:0,canWt:2,canVol:'0.000002',outWt:2,outVol:'0.000002'}]}];
    _finalAllocResetState('edit',{no:presetNo,label:presetLabel,transport:presetTransport,bl:presetBL,country:presetCountry,containerNo:presetContainer},presetSelected);
    _finalAllocState.expanded['selected-0']=true;
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='92%';
    titleEl.textContent=tr('调整');
    bodyEl.innerHTML=_finalAllocBodyHtml('edit');
    footerEl.innerHTML='<button class="px-4 h-9 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer mr-2" onclick="finalAllocSubmit(\'edit\',\''+id+'\')">'+tr('确认')+'</button>'+
        '<button class="px-4 h-9 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer" onclick="closeCrudModal()">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function finalAllocSubmit(mode,id){
    if(!_finalAllocState.selected.length){showToast(tr('请先选入数据再提交'));return;}
    const noEl=document.getElementById('final-alloc-no');
    const blEl=document.getElementById('final-alloc-bl');
    const trEl=document.getElementById('final-alloc-transport');
    const countryEl=document.getElementById('final-alloc-country');
    const containerEl=document.getElementById('final-alloc-container');
    const labelEl=document.getElementById('final-alloc-label');
    if(noEl)_finalAllocState.header.no=noEl.value;
    if(blEl)_finalAllocState.header.bl=blEl.value;
    if(trEl)_finalAllocState.header.transport=trEl.value;
    if(countryEl)_finalAllocState.header.country=countryEl.value;
    if(containerEl)_finalAllocState.header.containerNo=containerEl.value;
    if(labelEl)_finalAllocState.header.label=labelEl.value;
    if(!_finalAllocState.header.no){showToast(tr('配舱单号必填'));return;}
    closeCrudModal();
    showToast(tr(mode==='add'?'终配舱登记成功':'终配舱调整成功'));
}

/* 批量删除配舱单：仅允许删除「配舱状态=待出仓」的配舱单，非待出仓的自动跳过 */
function deleteFinalAllocSelected(id){
    const indices=getSelectedRowIndices();
    if(indices.length===0){showToast(tr('请先勾选要删除的配舱单'));return;}
    const c=TC[id];if(!c)return;
    const data=_listData[id]||c.d||[];
    const si=c.h.indexOf('配舱状态');
    const eligible=indices.filter(function(i){return data[i]&&String(data[i][si])==='待出仓';});
    const blocked=indices.length-eligible.length;
    if(!eligible.length){showToast(tr('仅可删除「待出仓」状态的配舱单，所选均不可删除'));return;}
    let msg='本次将删除 '+eligible.length+' 条「待出仓」配舱单';
    if(blocked>0)msg+='；另有 '+blocked+' 条非待出仓状态将跳过';
    msg+='，删除后不可恢复，确认删除？';
    openConfirmTip(msg,function(){
        if(!_listData[id])_listData[id]=(c.d||[]).map(function(r){return r.slice();});
        const sorted=eligible.slice().sort(function(a,b){return b-a;});
        sorted.forEach(function(i){_listData[id].splice(i,1);});
        document.getElementById('main-content').innerHTML=generateListPage(id,_listPage[id]||1,_statusFilterVal);
        showToast(tr('已删除')+' '+eligible.length+' '+tr('条'));
    });
}

function openFinalAllocLinkBLModal(id){
    const idx=getSelectedRowIndex();
    const row=idx>=0?((_listData[id]||TC[id].d)[idx]||[]):[];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='52%';
    titleEl.textContent=tr('关联提单');
    let h='<div class="space-y-4">';
    h+='<div class="bg-primary-50 border border-primary-100 rounded-lg p-3 text-xs text-primary-700">'+tr('为选中的终配舱单关联提单号；若未选中则按输入新增关联。')+'</div>';
    h+='<div class="grid grid-cols-2 gap-4">';
    h+='<div class="flex flex-col gap-1"><label class="text-sm text-text-secondary">'+tr('配舱单号')+'</label><input type="text" value="'+esc(row[0]||'')+'" class="h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"></div>';
    h+='<div class="flex flex-col gap-1"><label class="text-sm text-text-secondary"><span class="text-red-500">*</span> '+tr('提单号')+'</label><input type="text" value="'+esc(row[2]||'TD-20260626-001')+'" class="h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"></div>';
    h+='<div class="flex flex-col gap-1"><label class="text-sm text-text-secondary">'+tr('柜号')+'</label><input type="text" value="'+esc(row[3]||'GH-20260626-001')+'" class="h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"></div>';
    h+='<div class="flex flex-col gap-1"><label class="text-sm text-text-secondary">'+tr('运输方式')+'</label><select class="h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50"><option>海运</option><option>空运</option><option>卡航</option></select></div>';
    h+='</div></div>';
    bodyEl.innerHTML=h;
    footerEl.innerHTML='<button class="px-4 h-9 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer mr-2" onclick="closeCrudModal();showToast(tr(\'已关联提单\'))">'+tr('确认')+'</button>'+
        '<button class="px-4 h-9 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer" onclick="closeCrudModal()">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function openFinalAllocRenameModal(id){
    const idx=getSelectedRowIndex();
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    const row=(_listData[id]||TC[id].d)[idx]||[];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='48%';
    titleEl.textContent=tr('修改配舱单号');
    let h='<div class="space-y-4">';
    h+='<div class="flex flex-col gap-1"><label class="text-sm text-text-secondary">'+tr('原配舱单号')+'</label><input type="text" readonly value="'+esc(row[0]||'')+'" class="h-9 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-muted"></div>';
    h+='<div class="flex flex-col gap-1"><label class="text-sm text-text-secondary"><span class="text-red-500">*</span> '+tr('新配舱单号')+'</label><input type="text" id="final-alloc-new-no" value="'+esc(row[0]||'')+'" class="h-9 px-3 text-sm border border-surface-200 rounded-lg bg-white"></div>';
    h+='<div class="flex flex-col gap-1"><label class="text-sm text-text-secondary">'+tr('备注')+'</label><textarea class="h-20 px-3 py-2 text-sm border border-surface-200 rounded-lg bg-white" placeholder="'+tr('请输入修改原因')+'"></textarea></div>';
    h+='</div>';
    bodyEl.innerHTML=h;
    footerEl.innerHTML='<button class="px-4 h-9 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer mr-2" onclick="closeCrudModal();showToast(tr(\'配舱单号已修改\'))">'+tr('确认')+'</button>'+
        '<button class="px-4 h-9 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer" onclick="closeCrudModal()">'+tr('关闭')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function runFinalAllocAutoReplenish(id){
    const checked=document.querySelectorAll('.row-check:checked');
    const cnt=checked.length||(_listData[id]||TC[id].d||[]).length;
    showToast(tr('自动补货已派单')+'，'+tr('共')+' '+cnt+' '+tr('票'));
}

