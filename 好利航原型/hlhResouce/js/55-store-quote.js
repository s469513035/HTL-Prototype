/* ==========================================================================
 * 55 · 产品配置 › 仓储报价维护 prod-price-store + 国内库存盘点在库时长/仓储费
 *
 * 仓储费按「仓库 × 体积 × 报价周期 × 在库时长阶梯」计费：
 *   一张报价单 = 某仓库某体积段的阶梯价（越囤越贵，逼着清库）
 *   库存盘点上的仓储费 = 该行体积 × 匹配报价单的当前时长档单价 × 报价周期内天数
 *
 * 在库时长 = 该行最早一箱的入仓时间起算到今天 —— 同一运单多箱可能分批到仓，
 * 表上只有一行，按最早入库算（囤积从第一箱入库开始）。
 * ========================================================================== */

/* ---------- 仓储报价维护 prod-price-store（产品配置下） ---------- */
/* 报价阶梯：按在库时长分段收不同的体积单价（报价周期内）。
 * 例：深圳盐田仓 0-7天免费 / 8-30天 0.8 元/CBM/天 / 31-90天 1.5 / >90 天 2.5 */
var _SP_STORE_WAREHOUSES=['深圳盐田仓','广州南沙仓','上海浦东仓','义乌仓','拉各斯海外仓','阿比让海外仓','达喀尔海外仓'];
addPrototypeTable('prod-price-store','仓储报价维护',
    '报价编号|仓库|报价周期|体积段(CBM)|首档免费天数|阶梯数|币别|生效时间|失效时间|备注|状态|操作',
    ['启用','停用'],[
    ['SP-STORE-001','深圳盐田仓','按天','不限','7','4','人民币','2026-01-01','2027-12-31','整柜快出快入','启用'],
    ['SP-STORE-002','广州南沙仓','按天','不限','5','4','人民币','2026-01-01','2027-12-31','','启用'],
    ['SP-STORE-003','上海浦东仓','按天','不限','7','4','人民币','2026-03-01','2026-12-31','上海仓试点','启用'],
    ['SP-STORE-004','义乌仓','按天','不限','10','3','人民币','2025-06-01','2026-06-30','老报价已停','停用'],
    ['SP-STORE-005','拉各斯海外仓','按天','不限','7','4','美元','2026-01-01','2027-12-31','非洲主仓','启用'],
    ['SP-STORE-006','阿比让海外仓','按月','不限','30','3','美元','2026-01-01','2027-12-31','按月计费口径演示','启用'],
    ['SP-STORE-007','达喀尔海外仓','按天','不限','5','4','美元','2026-01-01','2027-12-31','','启用']
],[
    {label:'报价编号',type:'text'},
    {label:'仓库',type:'select',options:_SP_STORE_WAREHOUSES},
    {label:'币别',type:'select',options:['人民币','美元','欧元']},
    {label:'状态',type:'select',options:['启用','停用']}
]);
TC['prod-price-store'].noExpand=true;
TC['prod-price-store'].noAutoAudit=true;
/* 阶梯档位存字典：报价编号 -> [{daysFrom,daysTo(空=封顶),price}]
 * 单价口径随报价周期：按天=币别/CBM/天；按月=币别/CBM/月 */
var _SP_STORE_TIERS={
    'SP-STORE-001':[{f:0,t:7,p:0},{f:8,t:30,p:0.8},{f:31,t:90,p:1.5},{f:91,t:null,p:2.5}],
    'SP-STORE-002':[{f:0,t:5,p:0},{f:6,t:30,p:0.9},{f:31,t:90,p:1.6},{f:91,t:null,p:2.8}],
    'SP-STORE-003':[{f:0,t:7,p:0},{f:8,t:30,p:0.75},{f:31,t:90,p:1.4},{f:91,t:null,p:2.2}],
    'SP-STORE-004':[{f:0,t:10,p:0},{f:11,t:60,p:0.5},{f:61,t:null,p:1.0}],
    'SP-STORE-005':[{f:0,t:7,p:0},{f:8,t:30,p:0.12},{f:31,t:90,p:0.22},{f:91,t:null,p:0.35}],
    'SP-STORE-006':[{f:0,t:30,p:0},{f:31,t:90,p:3.2},{f:91,t:null,p:5.5}],
    'SP-STORE-007':[{f:0,t:5,p:0},{f:6,t:30,p:0.1},{f:31,t:90,p:0.2},{f:91,t:null,p:0.3}]
};
function spStoreTiersOf(no){return _SP_STORE_TIERS[no]||[];}

/* ---------- 新增/编辑/查看报价弹窗：仓库/周期/体积段 + 阶梯表 ---------- */
var _spStoreCtx={mode:'add',idx:-1,no:''};
function openSpStoreModal(mode,id,rowIdx,rowData){
    id=id||'prod-price-store';
    var c=TC[id];
    var rows=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var row=rowData||(rowIdx>=0?rows[rowIdx]:null);
    if(mode==='view'&&!row){showToast(tr('未找到报价数据'));return;}
    var g=function(n){var i=(c.h||[]).indexOf(n);return i>=0&&row?String(row[i]||''):'';};
    var no=g('报价编号');
    if(mode==='add'){
        var n=((c.d||[]).length+1);
        no='SP-STORE-'+String(n).padStart(3,'0');
    }
    _spStoreCtx={mode:mode,idx:rowIdx==null?-1:rowIdx,no:no};
    var ro=(mode==='view');
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='64%';
    document.getElementById('crud-modal-title').textContent=(mode==='add'?tr('新增仓储报价'):(ro?tr('查看仓储报价'):tr('编辑仓储报价')))+' - '+no;
    var inCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 focus:bg-white';
    var roAttr=ro?' disabled':'';
    var lbl=function(t,req){return '<label class="text-sm font-medium text-text-secondary">'+(req?'<span class="text-red-500 mr-0.5">*</span>':'')+tr(t)+'</label>';};
    var whs=_SP_STORE_WAREHOUSES;
    var h='<div class="space-y-5">';
    h+='<section><div class="flex items-center gap-2 mb-3"><span class="w-1 h-4 bg-primary-500 rounded"></span>'+
        '<span class="text-base font-semibold text-text-primary">'+tr('报价基本信息')+'</span></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5">'+lbl('仓库',true)+'<select id="spst-wh" class="'+inCls+'"'+roAttr+'>'+whs.map(function(w){return '<option'+(w===g('仓库')?' selected':'')+'>'+esc(w)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('报价周期',true)+'<select id="spst-cycle" class="'+inCls+'"'+roAttr+'>'+['按天','按月'].map(function(w){return '<option'+(w===g('报价周期')?' selected':'')+'>'+esc(w)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('币别',true)+'<select id="spst-cur" class="'+inCls+'"'+roAttr+'>'+['人民币','美元','欧元'].map(function(w){return '<option'+(w===g('币别')?' selected':'')+'>'+esc(w)+'</option>';}).join('')+'</select></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('体积段(CBM)')+'<input id="spst-vol" class="'+inCls+'" value="'+esc(g('体积段(CBM)')||'不限')+'" placeholder="'+tr('如 0-5 / 5-20 / 不限')+'"'+roAttr+'></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('首档免费天数',true)+'<input id="spst-free" type="number" min="0" class="'+inCls+'" value="'+esc(g('首档免费天数')||'0')+'"'+roAttr+'></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('生效时间',true)+'<input id="spst-from" type="date" class="'+inCls+'" value="'+esc(g('生效时间'))+'"'+roAttr+'></div>';
    h+='<div class="flex flex-col gap-1.5">'+lbl('失效时间')+'<input id="spst-to" type="date" class="'+inCls+'" value="'+esc(g('失效时间'))+'"'+roAttr+'></div>';
    h+='<div class="flex flex-col gap-1.5 md:col-span-3">'+lbl('备注')+'<textarea id="spst-rk" rows="2" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y"'+roAttr+'>'+esc(g('备注')||'')+'</textarea></div>';
    h+='</div></section>';
    /* 阶梯表：在库时长分段定价，首档免费天数从基础信息带下来 */
    h+='<section><div class="flex items-center justify-between mb-3">'+
        '<div class="flex items-center gap-2"><span class="w-1 h-4 bg-amber-400 rounded"></span>'+
        '<span class="text-base font-semibold text-text-primary">'+tr('在库时长阶梯价')+'</span>'+
        '<span class="text-xs text-text-muted">'+esc(tr('越囤越贵：首档免费，往上一档一个价（单价口径随报价周期）'))+'</span></div>'+
        (ro?'':'<button type="button" onclick="spStoreTierAdd()" class="h-8 px-3 text-xs font-medium text-primary-700 border border-primary-200 rounded-lg bg-white hover:bg-primary-50 cursor-pointer">+ '+tr('增加一档')+'</button>')+'</div>';
    h+='<div id="spst-tiers"></div></section>';
    h+='</div>';
    document.getElementById('crud-modal-body').innerHTML=h;
    document.getElementById('crud-modal-footer').innerHTML=ro?
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>':
        '<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button>'+
        '<button onclick="submitSpStore()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer ml-2">'+tr('确认提交')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
    spStoreTiersRender(mode==='add'?null:spStoreTiersOf(no));
}
/* 阶梯行渲染与编辑态 */
var _spStoreTiers=[];
function spStoreTiersRender(tiers){
    _spStoreTiers=(tiers&&tiers.length)?tiers.map(function(t){return {f:t.f,t:t.t,p:t.p};}):[{f:0,t:7,p:0}];
    spStoreTiersRedraw();
}
function spStoreTiersRedraw(){
    var box=document.getElementById('spst-tiers');
    if(!box)return;
    var ro=(_spStoreCtx.mode==='view');
    var inCls='h-8 px-2 text-xs border border-surface-200 rounded bg-white';
    var h='<div class="border border-surface-200 rounded-lg overflow-hidden bg-white">';
    h+='<div class="grid grid-cols-[40px_1fr_1fr_1fr_60px] gap-0 bg-surface-50 text-xs text-text-secondary font-medium">';
    h+='<div class="px-3 py-2">#</div><div class="px-3 py-2">'+tr('起始天数')+'</div><div class="px-3 py-2">'+tr('封顶天数（空=不限）')+'</div><div class="px-3 py-2">'+tr('单价(元/CBM/天)')+'</div><div class="px-3 py-2"></div></div>';
    _spStoreTiers.forEach(function(t,i){
        h+='<div class="grid grid-cols-[40px_1fr_1fr_1fr_60px] gap-0 border-t border-surface-100 items-center">';
        h+='<div class="px-3 py-2 text-xs text-text-muted">'+(i+1)+'</div>';
        h+='<div class="px-2 py-1.5"><input type="number" min="0" value="'+t.f+'" oninput="spStoreTierSet('+i+',\'f\',this.value)" class="'+inCls+' w-full"'+(ro?' disabled':'')+'></div>';
        h+='<div class="px-2 py-1.5"><input type="number" min="0" value="'+(t.t==null?'':t.t)+'" oninput="spStoreTierSet('+i+',\'t\',this.value)" class="'+inCls+' w-full" placeholder="'+tr('不限')+'"'+(ro?' disabled':'')+'></div>';
        h+='<div class="px-2 py-1.5"><input type="number" min="0" step="0.01" value="'+t.p+'" oninput="spStoreTierSet('+i+',\'p\',this.value)" class="'+inCls+' w-full"'+(ro?' disabled':'')+'></div>';
        h+='<div class="px-2 py-1.5 text-center">'+(ro?'':'<button type="button" onclick="spStoreTierDel('+i+')" class="text-xs text-red-500 hover:text-red-600 cursor-pointer">'+tr('删除')+'</button>')+'</div>';
        h+='</div>';
    });
    h+='</div>';
    box.innerHTML=h;
}
function spStoreTierSet(i,k,v){
    if(!_spStoreTiers[i])return;
    _spStoreTiers[i][k]=(v===''?null:(parseFloat(v)||0));
}
function spStoreTierAdd(){
    var last=_spStoreTiers[_spStoreTiers.length-1];
    _spStoreTiers.push({f:last?((last.t==null?last.f:last.t)+1):0,t:null,p:last?last.p+0.5:0});
    spStoreTiersRedraw();
}
function spStoreTierDel(i){
    if(_spStoreTiers.length<=1){showToast(tr('至少保留一档'));return;}
    _spStoreTiers.splice(i,1);
    spStoreTiersRedraw();
}
function submitSpStore(){
    var v=function(id){var e=document.getElementById(id);return e?String(e.value||'').trim():'';};
    var wh=v('spst-wh'),cycle=v('spst-cycle'),cur=v('spst-cur'),vol=v('spst-vol'),
        free=v('spst-free'),from=v('spst-from'),to=v('spst-to'),rk=v('spst-rk');
    if(!wh||!cycle||!cur||!from){showToast(tr('请完整填写必填项'));return;}
    if(!_spStoreTiers.length){showToast(tr('请至少维护一档阶梯价'));return;}
    var bad=_spStoreTiers.some(function(t){return t.p<0||(t.t!=null&&t.f>t.t);});
    if(bad){showToast(tr('阶梯起始不能大于封顶'));return;}
    var c=TC['prod-price-store'];
    var no=_spStoreCtx.no;
    _SP_STORE_TIERS[no]=_spStoreTiers.map(function(t){return {f:t.f,t:t.t,p:t.p};});
    if(_spStoreCtx.mode==='add'){
        fclPushRow('prod-price-store',{
            '报价编号':no,'仓库':wh,'报价周期':cycle,'体积段(CBM)':vol||'不限',
            '首档免费天数':free||'0','阶梯数':String(_spStoreTiers.length),'币别':cur,
            '生效时间':from,'失效时间':to,'备注':rk,'状态':'启用'
        });
    }else{
        var rows=fclFinRows('prod-price-store');
        var row=rows[_spStoreCtx.idx];
        if(row){
            [['仓库',wh],['报价周期',cycle],['币别',cur],['体积段(CBM)',vol||'不限'],
             ['首档免费天数',free||'0'],['阶梯数',String(_spStoreTiers.length)],
             ['生效时间',from],['失效时间',to],['备注',rk]].forEach(function(p){
                fclFinSet('prod-price-store',row,p[0],p[1]);
            });
        }
    }
    if(typeof _listData!=='undefined')delete _listData['prod-price-store'];
    spStoreRefreshStockFees();
    closeCrudModal();
    fclFinRefresh('prod-price-store');
    showToast(tr(_spStoreCtx.mode==='add'?'已新增报价':'已保存报价')+'：'+no);
}

/* ---------- 在库时长 & 仓储费（库存盘点列表列） ---------- */
/* 入仓时间按这行最早一箱（表上一行 = 一单，入仓时间就是最早入仓）起算到今天 */
function spStoreDaysOf(inboundTime){
    var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(inboundTime||''));
    if(!m)return 0;
    var from=new Date(parseInt(m[1],10),parseInt(m[2],10)-1,parseInt(m[3],10));
    var today=new Date();
    var diff=Math.floor((today-from)/(86400000));
    return diff<0?0:diff;
}
/* 当前匹配该仓库的报价单（启用 + 在生效/失效时间窗内；失效为空=长期有效） */
function spStoreQuoteOf(warehouse){
    var c=TC['prod-price-store'];
    if(!c||!c.d)return null;
    var h=c.h||[],iWh=h.indexOf('仓库'),iSt=h.indexOf('状态'),iNo=h.indexOf('报价编号'),
        iFrom=h.indexOf('生效时间'),iTo=h.indexOf('失效时间');
    var today=new Date();
    var tToday=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
    var hit=(c.d||[]).filter(function(r){
        if(String(r[iSt]||'')!=='启用')return false;
        if(String(r[iWh]||'')!==warehouse)return false;
        var from=String(r[iFrom]||''),to=String(r[iTo]||'');
        if(from&&from>tToday)return false;
        if(to&&to<tToday)return false;
        return true;
    })[0];
    return hit?String(hit[iNo]||''):null;
}
/* 报价单币别 → 列表金额符号 */
function spStoreCurFlag(quoteNo){
    var c=TC['prod-price-store'];
    if(!c||!c.h)return '¥';
    var h=c.h,iNo=h.indexOf('报价编号'),iCur=h.indexOf('币别');
    var hit=(c.d||[]).filter(function(r){return String(r[iNo]||'')===quoteNo;})[0];
    var cur=hit?String(hit[iCur]||''):'';
    return cur==='美元'?'$':(cur==='欧元'?'€':'¥');
}
/* 按天数取阶梯价（单价口径随报价周期：按天=…/天，按月=…/月） */
function spStorePriceOf(quoteNo,days){
    var tiers=spStoreTiersOf(quoteNo);
    var hit=tiers.filter(function(t){
        return days>=t.f&&(t.t==null||days<=t.t);
    })[0];
    return hit?hit.p:0;
}
/* 仓储费 = 体积 × 阶梯单价 × 计费时长（首档免费期内不收费）
 * 报价周期=按天：计费时长=在库天数-首档免费天数（天）
 * 报价周期=按月：计费时长=ceil(计费天数/30)（整月向上取整） */
function spStoreFee(warehouse,vol,days){
    var q=spStoreQuoteOf(warehouse);
    if(!q)return {fee:0,price:0,quote:'',billDays:0,cycle:'按天',units:0,curFlag:'¥'};
    var c=TC['prod-price-store'],h=c.h,iNo=h.indexOf('报价编号'),iCyc=h.indexOf('报价周期');
    var qRow=(c.d||[]).filter(function(r){return String(r[iNo]||'')===q;})[0];
    var cycle=qRow?String(qRow[iCyc]||'按天'):'按天';
    var price=spStorePriceOf(q,days);
    var free=spStoreTiersOf(q)[0];
    var billDays=Math.max(0,days-(free?free.t:0));
    var units=cycle==='按月'?Math.ceil(billDays/30):billDays;
    var fee=+((parseFloat(vol)||0)*price*units).toFixed(2);
    return {fee:fee,price:price,quote:q,billDays:billDays,cycle:cycle,units:units,curFlag:spStoreCurFlag(q)};
}
/* 列表加载时给库存表补两列：在库时长 + 仓储费（国内库存盘点 + 海外仓库存） */
function spStoreEnrichStockRows(id){
    if(id!=='wh-stock-check'&&id!=='ow-inventory')return;
    var c=TC[id];
    if(!c||!c.h)return;
    var h=c.h;
    if(h.indexOf('在库时长')>=0)return;   /* 列已在就别重复补 */
    var iTime=h.indexOf('入库时间'),iVol=h.indexOf('到库件数'),iStock=h.indexOf('在库件数');
    if(iTime<0)return;
    /* 仓库列：国内库存盘点=收货仓库，海外仓库存=目的仓库（复用 37 的助手） */
    var whName=(typeof owInvWhName==='function')?owInvWhName(h):'收货仓库';
    var iWh=h.indexOf(whName);
    h.splice(iTime+1,0,'在库时长','仓储费');
    (c.d||[]).forEach(function(r){
        var days=spStoreDaysOf(r[iTime]);
        /* 在库件数<=0（已出清）不再计仓储费，在库时长照常展示 */
        var stock=iStock>=0?parseFloat(r[iStock]):1;
        var pcs=parseFloat(r[iVol])||0;
        var vol=(pcs*0.045).toFixed(2);   /* 估算：约 0.045 CBM/件（原型口径，正式版从运单体积读） */
        var f=spStoreFee(iWh>=0?String(r[iWh]||''):'',vol,days);
        r.splice(iTime+1,0,days+' '+tr('天'),(stock<=0||f.fee<=0)?'—':(f.curFlag+f.fee.toFixed(2)));
    });
}
spStoreEnrichStockRows('wh-stock-check');
spStoreEnrichStockRows('ow-inventory');
/* 在库时长/仓储费是系统计算列，不进新增/编辑弹窗（§6 modalExcludedFields） */
['wh-stock-check','ow-inventory'].forEach(function(id){
    if(!TC[id])return;
    TC[id].modalExcludedFields=(TC[id].modalExcludedFields||[]).concat(['在库时长','仓储费']);
});
/* 工具栏「编辑」入口：选中行后打开编辑弹窗（dispatch 双写 §3.B） */
function openSelectedSpStoreEdit(id){
    var idx=(typeof getSelectedRowIndex==='function')?getSelectedRowIndex():-1;
    if(idx<0){showToast(tr('请先选择一条记录'));return;}
    openSpStoreModal('edit',id,idx);
}
/* 报价保存后原地刷新两个库存表的在库时长/仓储费列（不改表结构，只重算值） */
function spStoreRefreshStockFees(){
    ['wh-stock-check','ow-inventory'].forEach(function(id){
        var c=TC[id];
        if(!c||!c.h)return;
        var h=c.h,iD=h.indexOf('在库时长'),iF=h.indexOf('仓储费');
        if(iD<0||iF<0)return;
        var iTime=h.indexOf('入库时间'),iVol=h.indexOf('到库件数'),iStock=h.indexOf('在库件数');
        var whName=(typeof owInvWhName==='function')?owInvWhName(h):'收货仓库';
        var iWh=h.indexOf(whName);
        (c.d||[]).forEach(function(r){
            var days=spStoreDaysOf(r[iTime]);
            r[iD]=days+' '+tr('天');
            var stock=iStock>=0?parseFloat(r[iStock]):1;
            if(stock<=0){r[iF]='—';return;}
            var vol=((parseFloat(r[iVol])||0)*0.045).toFixed(2);
            var f=spStoreFee(iWh>=0?String(r[iWh]||''):'',vol,days);
            r[iF]=f.fee>0?(f.curFlag+f.fee.toFixed(2)):'—';
        });
    });
}
