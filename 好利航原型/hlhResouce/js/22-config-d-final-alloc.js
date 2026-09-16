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
/* 体积改成有量级的真实值：一键配舱要按最大方数累加整票，原来那串 0.000006
 * 永远也装不满一个柜，功能没法演示。time 是预报时间，一键配舱按它先到先配。 */
var _finalAllocUnselectedSeed=[
    {no:'XJWCS2',pcs:6,canPcs:6,canWt:420,canVol:'2.850000',outWt:420,outVol:'2.850000',time:'2026-06-24 09:15',
     name:'蓝牙耳机',packageType:'纸箱',customsType:'一般贸易',service:'报关',whRemark:'外箱完好',
     sub:[{no:'H-XJWCS2-001',pcs:6,canPcs:6,canWt:420,canVol:'2.850000',outWt:420,outVol:'2.850000',
           name:'蓝牙耳机',packageType:'纸箱',customsType:'一般贸易',service:'报关',whRemark:'外箱完好'}]},
    {no:'XJWCS3',pcs:2,canPcs:2,canWt:160,canVol:'1.120000',outWt:160,outVol:'1.120000',time:'2026-06-24 14:40',
     name:'女装连衣裙',packageType:'编织袋',customsType:'买单报关',service:'—',whRemark:'—',
     sub:[{no:'H-XJWCS3-001',pcs:2,canPcs:2,canWt:160,canVol:'1.120000',outWt:160,outVol:'1.120000',
           name:'女装连衣裙',packageType:'编织袋',customsType:'买单报关',service:'—',whRemark:'—'}]},
    {no:'YP20260626',pcs:6,canPcs:6,canWt:530,canVol:'3.640000',outWt:530,outVol:'3.640000',time:'2026-06-25 10:05',
     name:'五金工具套装',packageType:'木箱',customsType:'一般贸易',service:'报关、木箱',whRemark:'需加固',
     sub:[{no:'H-YP20260626-001',pcs:6,canPcs:6,canWt:530,canVol:'3.640000',outWt:530,outVol:'3.640000',
           name:'五金工具套装',packageType:'木箱',customsType:'一般贸易',service:'报关、木箱',whRemark:'需加固'}]},
    {no:'YPC-20260626003',pcs:4,canPcs:4,canWt:280,canVol:'1.960000',outWt:280,outVol:'1.960000',time:'2026-06-25 16:20',
     name:'家用小电器',packageType:'纸箱',customsType:'跨境电商9610',service:'带电',whRemark:'带电，单独码放',
     sub:[{no:'H-YPC-20260626003-001',pcs:4,canPcs:4,canWt:280,canVol:'1.960000',outWt:280,outVol:'1.960000',
           name:'家用小电器',packageType:'纸箱',customsType:'跨境电商9610',service:'带电',whRemark:'带电，单独码放'}]},
    {no:'YPC-TY',pcs:14,canPcs:14,canWt:1180,canVol:'8.420000',outWt:1180,outVol:'8.420000',time:'2026-06-26 08:50',
     name:'LED灯具',packageType:'托盘',customsType:'市场采购',service:'贴箱唛',whRemark:'整托入仓',
     sub:[{no:'H-YPC-TY-001',pcs:14,canPcs:14,canWt:1180,canVol:'8.420000',outWt:1180,outVol:'8.420000',
           name:'LED灯具',packageType:'托盘',customsType:'市场采购',service:'贴箱唛',whRemark:'整托入仓'}]},
    {no:'YPC-20260627001',pcs:9,canPcs:9,canWt:760,canVol:'5.310000',outWt:760,outVol:'5.310000',time:'2026-06-27 11:30',
     name:'纺织面料',packageType:'卷装',customsType:'一般贸易',service:'合并报关',whRemark:'—',
     sub:[{no:'H-YPC-20260627001-001',pcs:9,canPcs:9,canWt:760,canVol:'5.310000',outWt:760,outVol:'5.310000',
           name:'纺织面料',packageType:'卷装',customsType:'一般贸易',service:'合并报关',whRemark:'—'}]},
    {no:'YPC-20260627002',pcs:3,canPcs:3,canWt:210,canVol:'1.480000',outWt:210,outVol:'1.480000',time:'2026-06-27 15:10',
     name:'化妆品',packageType:'纸箱',customsType:'免报关',service:'—',whRemark:'易碎，勿压',
     sub:[{no:'H-YPC-20260627002-001',pcs:3,canPcs:3,canWt:210,canVol:'1.480000',outWt:210,outVol:'1.480000',
           name:'化妆品',packageType:'纸箱',customsType:'免报关',service:'—',whRemark:'易碎，勿压'}]}
];
/* 空运按袋配舱：一行就是一袋，袋在国内装好就封了，配舱阶段不再往里看运单，
 * 所以这份种子不带 sub —— 表格也就没有主子表可展开。 */
var _finalAllocBagSeed=[
    {no:'BAG-20260626-001',pcs:4,canPcs:4,canWt:38,canVol:'0.180000',outWt:38,outVol:'0.180000',time:'2026-06-26 09:00',
     name:'蓝牙耳机',packageType:'编织袋',customsType:'跨境电商9610',service:'—',whRemark:'—'},
    {no:'BAG-20260626-002',pcs:3,canPcs:3,canWt:26,canVol:'0.120000',outWt:26,outVol:'0.120000',time:'2026-06-26 11:20',
     name:'手机配件',packageType:'编织袋',customsType:'买单报关',service:'带电',whRemark:'带电'},
    {no:'BAG-20260626-003',pcs:2,canPcs:2,canWt:15,canVol:'0.070000',outWt:15,outVol:'0.070000',time:'2026-06-26 15:45',
     name:'服装配件',packageType:'编织袋',customsType:'免报关',service:'—',whRemark:'—'},
    {no:'BAG-20260627-001',pcs:6,canPcs:6,canWt:54,canVol:'0.260000',outWt:54,outVol:'0.260000',time:'2026-06-27 10:30',
     name:'运动器材',packageType:'编织袋',customsType:'一般贸易',service:'报关',whRemark:'—'}
];

var _finalAllocState={mode:'add',unselected:[],selected:[],expanded:{},filterTransport:'',query:{},
    header:{no:'',transport:'海运',bl:'',country:'',containerNo:'',label:''}};

/* 左侧「未选数据」的查询字段。放模块作用域是为了让渲染和回填共用同一份 key，
 * 少一处就会出现「填了查不到、查了填不回」。
 * 第二个字段不写 label —— 它的列名随运输方式变，渲染时才取。 */
var _FA_QUERY_FIELDS=[
    {key:'warehouse',label:'仓库归属',type:'select',options:['广州南沙仓','深圳坂田仓','上海洋山仓','东莞虎门仓']},
    {key:'unitNo',type:'text'},
    {key:'country',label:'收件国家',type:'select',options:['美国','尼日利亚','塞内加尔','科特迪瓦','多哥','喀麦隆']},
    {key:'destWarehouse',label:'收件仓库',type:'select',options:['拉各斯仓','达喀尔仓','阿比让仓','洛美仓','杜阿拉仓','LAX-Amazon FBA']},
    /* 包装类型与下单录入/入仓操作/运单管理共用 PACKAGE_TYPE_OPTIONS（04-table-catalog.js） */
    {key:'packageType',label:'包装类型',type:'select',options:function(){return (typeof PACKAGE_TYPE_OPTIONS!=='undefined')?PACKAGE_TYPE_OPTIONS:[];}},
    /* 客户：选项要到运行时才取得到（crm 客户档案在本文件之后加载），
     * 所以 options 允许写成函数，渲染时才求值 —— 写成数组会在加载期就 ReferenceError */
    {key:'customer',label:'客户',type:'select',options:function(){return (typeof getCrmCustomerOptions==='function')?getCrmCustomerOptions():[];}},
    {key:'custLevel',label:'客户等级',type:'select',options:['A类','B类','C类','D类']},
    {key:'forecastTime',label:'预报时间',type:'date'},
    /* 与运单模块「修改附加服务」用的是同一份选项，别另起一套 */
    {key:'service',label:'附加服务',type:'select',options:['报关','合并报关','拆分报关','带电','带磁','贴箱唛']}
];
/* 报关类型：配舱时要按报关方式分柜，和附加服务里的「报关」不是一回事 */
var FA_CUSTOMS_TYPES=['一般贸易','买单报关','市场采购','跨境电商9610','免报关'];

function _finalAllocClone(arr){return JSON.parse(JSON.stringify(arr));}

/* 配舱计划这一组弹窗的底栏。统一走全站的按钮规范：
 * 取消在左、主操作在右，主操作用 primary 实心（原来是橙色实心且主操作在左，
 * 和其它所有弹窗都反着）。#crud-modal-footer 本身是 flex justify-end gap-3，
 * 所以按钮上不用再加 mr-2。 */
function finalAllocFooterHtml(confirmOnclick,confirmLabel,closeLabel){
    return '<button type="button" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer" onclick="closeCrudModal()">'+tr(closeLabel||'关闭')+'</button>'+
        '<button type="button" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer" onclick="'+confirmOnclick+'">'+tr(confirmLabel||'确认')+'</button>';
}

/* 空运走「分拣装袋」那条线，货是按袋交给航司的，配舱自然也按袋配；
 * 海运/卡航/快递还是按运单配。列名由左侧查询区的「运输方式」决定 ——
 * 那是筛未选货源用的，筛出来是袋还是运单，两个面板表就照着叫。
 * 选「全部」时没法确定，按默认的运单号显示。
 * 两个面板表和左侧查询条件都从这里取名，免得只改一处、表头写「袋号」查询框还写「运单号」。 */
function _finalAllocIsAir(){return _finalAllocState.filterTransport==='空运';}
function _finalAllocUnitLabel(){
    return _finalAllocIsAir()?'袋号':'运单号';
}
/* 未选货源池：空运给袋、其余给运单。两种结构不同（袋没有子行），切换时要整池换掉 */
function _finalAllocPoolSeed(){
    return _finalAllocIsAir()?_finalAllocBagSeed:_finalAllocUnselectedSeed;
}
/* 把表头那几个输入框的当前值收回 state。
 * 重绘是按 state 重建 DOM 的，不先收回，用户已经填的柜号/提单号会被抹掉。 */
function finalAllocSyncHeader(){
    const map={no:'final-alloc-no',label:'final-alloc-label',country:'final-alloc-country',
        containerNo:'final-alloc-container',transport:'final-alloc-transport',bl:'final-alloc-bl'};
    Object.keys(map).forEach(function(k){
        const el=document.getElementById(map[k]);
        if(el)_finalAllocState.header[k]=el.value;
    });
}
/* 左侧查询区同理：重绘前把已填的查询条件收回来 */
function finalAllocSyncQuery(){
    const t=document.getElementById('final-alloc-filter-transport');
    if(t)_finalAllocState.filterTransport=t.value;
    _FA_QUERY_FIELDS.forEach(function(q){
        const el=document.getElementById('final-alloc-q-'+q.key);
        if(el)_finalAllocState.query[q.key]=el.value;
    });
}
/* 重绘前统一收值。弹窗里凡是会触发重绘的动作（切运输方式、展开收起、选入移除）
 * 都要先走这一步，否则用户填到一半的内容会被重建 DOM 抹掉。 */
function finalAllocSyncForm(){
    finalAllocSyncHeader();
    finalAllocSyncQuery();
}
/* 左侧运输方式改了：列名跟着变，要重绘。
 * 如果是在「按袋」和「按运单」之间来回切，货源池的结构也变了，
 * 得整池换掉；已选里那批是另一种单位的，留着会出现「袋号」列下挂运单号，
 * 一张配舱单混两种单位本身也不成立，所以一并清掉并给出提示。 */
function finalAllocOnFilterTransportChange(){
    var wasAir=_finalAllocIsAir();
    finalAllocSyncForm();
    if(_finalAllocIsAir()!==wasAir){
        var dropped=_finalAllocState.selected.length;
        _finalAllocState.unselected=_finalAllocClone(_finalAllocPoolSeed());
        _finalAllocState.selected=[];
        _finalAllocState.expanded={};
        if(dropped)showToast(tr('已切换配舱单位为')+'「'+tr(_finalAllocUnitLabel())+'」，'+tr('原已选')+' '+dropped+' '+tr('条已清空'));
    }
    finalAllocRerender();
}

function _finalAllocResetState(mode,headerInit,selectedInit,filterTransport){
    _finalAllocState.mode=mode;
    /* 新增时左侧筛选默认「全部」；调整时预置成这单本身的运输方式，
     * 调空运的单一进来就是按袋看，不用再手动切一次。
     * 必须先定 filterTransport 再取货源池 —— 池子是按它挑的。 */
    _finalAllocState.filterTransport=filterTransport||'';
    _finalAllocState.unselected=_finalAllocClone(_finalAllocPoolSeed());
    _finalAllocState.selected=selectedInit?_finalAllocClone(selectedInit):[];
    _finalAllocState.expanded={};
    _finalAllocState.query={};
    _finalAllocState.exQueried=false;   /* 异常调整用：是否已按单号查过（决定空态提示措辞） */
    _finalAllocState.header=Object.assign({no:'',transport:'海运',bl:'',country:'',containerNo:'',label:''},headerInit||{});
}

/* 单号后面的两列（品名 / 包装类型）与数字后面的三列（报关类型 / 附加服务 / 仓库备注）。
 * 主行和子行共用，列数才不会对不上 —— 两处各写一遍迟早会错位。 */
function _faTextCells(r){
    return '<td class="px-2 py-2 whitespace-nowrap">'+esc(r.name||'—')+'</td>'+
           '<td class="px-2 py-2 whitespace-nowrap">'+esc(tr(r.packageType||'—'))+'</td>';
}
function _faTailCells(r){
    return '<td class="px-2 py-2 whitespace-nowrap">'+esc(tr(r.customsType||'—'))+'</td>'+
           '<td class="px-2 py-2 whitespace-nowrap">'+esc(r.service||'—')+'</td>'+
           '<td class="px-2 py-2 max-w-[140px] truncate" title="'+esc(r.whRemark||'')+'">'+esc(r.whRemark||'—')+'</td>';
}
/* 合计条：原来是一行灰色小字，配舱时最该盯的方数被淹没。
 * 改成分格的统计块，方数用主色大号字，并给出「已选/未选」的对比感。 */
function _faTotalCell(label,value,strong){
    return '<div class="flex flex-col gap-0.5 px-3 py-1.5 border-r border-surface-200 last:border-r-0">'+
        '<span class="text-[11px] text-text-muted whitespace-nowrap">'+esc(tr(label))+'</span>'+
        '<span class="'+(strong?'text-base font-bold text-primary-700':'text-sm font-semibold text-text-primary')+' whitespace-nowrap">'+value+'</span></div>';
}

function _finalAllocPanelTable(side){
    const isLeft=side==='unselected';
    const rows=isLeft?_finalAllocState.unselected:_finalAllocState.selected;
    // 左侧(未选)：运单号|件数|可配件数|可配实重|可配体积|实际重量|实际体积
    // 右侧(已选)：运单号|件数|实际重量|实际体积（去掉可配实重/可配体积；可配件数→件数）
    // 首列列名随运输方式变：空运=袋号，其余=运单号；空运还不走主子表
    const unit=_finalAllocUnitLabel();
    const isAir=_finalAllocIsAir();
    /* 品名/包装类型跟在单号后面（挑货时先看这两个），报关类型/附加服务/仓库备注
     * 是配柜时的约束条件，放数字后面。两侧保持同样的顺序，左右对照时不用重新找列。 */
    const cols=isLeft?[unit,'品名','包装类型','件数','可配件数','可配实重','可配体积','实际重量','实际体积','报关类型','附加服务','仓库备注']
                     :[unit,'品名','包装类型','件数','出货重量','出货体积','报关类型','附加服务','仓库备注'];
    const colspan=cols.length+2;
    /* 列多了必须给最小宽度，否则在半幅弹窗里会被压成一团；外层是 overflow-auto，超出就横向滚 */
    const minW=isLeft?980:760;
    let h='<div class="border border-surface-200 rounded-lg overflow-hidden bg-white"><div class="overflow-auto" style="max-height:520px"><table class="w-full text-xs" style="border-collapse:separate;border-spacing:0;min-width:'+minW+'px">';
    /* 表头统一走全站的 bg-surface-50 + text-text-secondary，不再用写死的 #EFF6FF */
    const thCls='px-2 py-2 text-left font-semibold text-text-secondary border-b border-surface-200';
    h+='<thead class="bg-surface-50 text-text-secondary sticky top-0 z-10"><tr>';
    h+='<th class="'+thCls+'" style="width:36px">#</th>';
    h+='<th class="'+thCls+'" style="width:32px"><input type="checkbox" class="rounded border-surface-300 text-primary-600" onchange="finalAllocToggleAll(\''+side+'\',this.checked)"></th>';
    cols.forEach(function(c){h+='<th class="'+thCls+' whitespace-nowrap">'+tr(c)+'</th>';});
    h+='</tr></thead><tbody>';
    if(!rows.length){
        /* 异常调整的左表在查询前本来就是空的，直说原因，别让人以为没货 */
        const emptyMsg=(isLeft&&_finalAllocState.mode==='exAdjust'&&!_finalAllocState.exQueried)
            ?(tr('请先输入')+tr(unit)+tr('查询')) : tr('暂无数据');
        h+='<tr><td colspan="'+colspan+'" class="px-3 py-12 text-center text-text-muted">'+emptyMsg+'</td></tr>';
    }
    rows.forEach(function(r,i){
        const expKey=side+'-'+i;
        const expanded=!isAir&&!!_finalAllocState.expanded[expKey];
        const arrow=expanded?'▾':'▸';
        h+='<tr class="hover:bg-primary-50/30 border-b border-surface-100"><td class="px-2 py-2 text-text-muted">'+(i+1)+'</td>';
        h+='<td class="px-2 py-2"><input type="checkbox" class="final-alloc-check final-alloc-check-parent rounded border-surface-300 text-primary-600" data-side="'+side+'" data-idx="'+i+'" onchange="finalAllocSyncSub(this)"></td>';
        /* 空运一行就是一袋，没有下钻的子行，展开箭头也就不给了 */
        h+='<td class="px-2 py-2 font-medium text-primary-700 whitespace-nowrap">'+
            (isAir?'':'<span class="cursor-pointer mr-1 text-text-muted" onclick="finalAllocToggleRow(\''+side+'\','+i+')">'+arrow+'</span>')+esc(r.no)+'</td>';
        h+=_faTextCells(r);
        if(isLeft){
            h+='<td class="px-2 py-2 text-right">'+r.pcs+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.canPcs+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.canWt+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.canVol+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.outWt+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.outVol+'</td>';
        }else{
            h+='<td class="px-2 py-2 text-right">'+r.pcs+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.outWt+'</td>';
            h+='<td class="px-2 py-2 text-right">'+r.outVol+'</td>';
        }
        h+=_faTailCells(r)+'</tr>';
        if(!isAir&&expanded&&r.sub){
            r.sub.forEach(function(s,si){
                h+='<tr class="bg-surface-50/60 border-b border-surface-100"><td class="px-2 py-2 text-text-muted">'+(i+1)+'.'+(si+1)+'</td>';
                h+='<td class="px-2 py-2"><input type="checkbox" class="final-alloc-sub-check rounded border-surface-300 text-primary-600" data-side="'+side+'" data-pidx="'+i+'" data-sidx="'+si+'" onchange="finalAllocSyncParent(this)"></td>';
                h+='<td class="px-2 py-2 pl-6 text-text-secondary whitespace-nowrap">'+esc(s.no)+'</td>';
                h+=_faTextCells(s);
                if(isLeft){
                    h+='<td class="px-2 py-2 text-right">'+s.pcs+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.canPcs+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.canWt+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.canVol+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.outWt+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.outVol+'</td>';
                }else{
                    h+='<td class="px-2 py-2 text-right">'+s.pcs+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.outWt+'</td>';
                    h+='<td class="px-2 py-2 text-right">'+s.outVol+'</td>';
                }
                h+=_faTailCells(s)+'</tr>';
            });
        }
    });
    h+='</tbody></table></div>';
    /* 合计行 */
    const totalPcs=rows.reduce(function(a,b){return a+(+b.pcs||0);},0);
    const totalCan=rows.reduce(function(a,b){return a+(+b.canPcs||0);},0);
    const totalOutWt=rows.reduce(function(a,b){return a+(+b.outWt||0);},0);
    const totalOutVol=rows.reduce(function(a,b){return a+(parseFloat(b.outVol)||0);},0);
    h+='<div class="border-t-2 border-primary-200 bg-primary-50/40">';
    h+='<div class="flex items-stretch flex-wrap">';
    h+='<div class="flex items-center px-3 py-1.5 border-r border-surface-200">'+
       '<span class="text-xs font-bold text-primary-700 whitespace-nowrap">'+tr('总合计')+'</span></div>';
    if(isLeft){
        h+=_faTotalCell('总票数',rows.length,false);
        h+=_faTotalCell('总件数',totalPcs,false);
        h+=_faTotalCell('可配件数',totalCan,false);
        h+=_faTotalCell('实际重量',totalOutWt.toLocaleString()+' KG',false);
        h+=_faTotalCell('实际方数',totalOutVol.toFixed(3)+' CBM',true);
    }else{
        h+=_faTotalCell('总票数',rows.length,false);
        h+=_faTotalCell('总件数',totalPcs,false);
        h+=_faTotalCell('出货重量',totalOutWt.toLocaleString()+' KG',false);
        h+=_faTotalCell('出货体积',totalOutVol.toFixed(3)+' CBM',true);
    }
    h+='</div></div></div>';
    return h;
}

function _finalAllocLeftPanel(mode){
    /* 异常调整：只给单号一个查询条件，运输方式跟着这单走（不给切），也不给一键配舱 ——
     * 出仓后是定点增减，不是再整片捞货 */
    const isEx=mode==='exAdjust';
    let h='';
    h+='<div class="text-sm font-semibold text-text-primary mb-2">'+tr('未选数据')+'</div>';
    /* 查询行 */
    h+='<div class="bg-white border border-surface-200 rounded-lg p-3 mb-3">';
    if(isEx){
        const unitLabel=_finalAllocUnitLabel();
        const val=_finalAllocState.query.unitNo||'';
        h+='<div class="flex items-end gap-2">';
        h+='<div class="flex-1 min-w-0 flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr(unitLabel)+'<span class="text-red-500 ml-0.5">*</span></label>'+
            '<input type="text" value="'+esc(val)+'" placeholder="'+tr('请输入')+tr(unitLabel)+tr('查询')+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-q-unitNo" '+
            'onkeydown="if(event.key===\'Enter\'){event.preventDefault();finalAllocExQuery();}"></div>';
        h+='<button class="h-8 px-3 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer" onclick="finalAllocExQuery()">'+tr('查询')+'</button>';
        h+='</div>';
        h+='<div class="mt-2 text-[11px] text-text-muted">'+tr('异常调整仅支持按单号查询，单号不能为空；查出后选入右侧即为补配，从右侧移除即为撤配。')+'</div>';
        h+='</div>';
        if(!_finalAllocIsAir()){
            const btnGhost='h-8 px-3 text-xs font-medium text-text-secondary bg-white border border-surface-200 hover:bg-surface-50 rounded-lg cursor-pointer';
            h+='<div class="flex flex-wrap gap-2 mb-2">';
            h+='<button class="'+btnGhost+'" onclick="finalAllocExpandAll(true)">'+tr('全部展开')+'</button>';
            h+='<button class="'+btnGhost+'" onclick="finalAllocExpandAll(false)">'+tr('全部收起')+'</button>';
            h+='</div>';
        }
        return h;
    }
    /* 这个下拉决定了未选货源是按袋还是按运单来的，所以两个面板表的首列名跟着它走。
     * option 显式写 value（中文原值），切到英文/法文界面时比较才不会失效。 */
    const ft=_finalAllocState.filterTransport||'';
    h+='<div class="mb-3 pb-3 border-b border-surface-100"><div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('运输方式')+'</label><select class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-filter-transport" onchange="finalAllocOnFilterTransportChange()"><option value=""'+(ft===''?' selected':'')+'>'+tr('全部')+'</option>';
    ['海运','空运','卡航','快递'].forEach(function(o){h+='<option value="'+esc(o)+'"'+(ft===o?' selected':'')+'>'+tr(o)+'</option>';});
    h+='</select></div></div>';
    h+='<div class="grid grid-cols-3 gap-3">';
    _FA_QUERY_FIELDS.forEach(function(q){
        const label=q.label||_finalAllocUnitLabel();
        const val=_finalAllocState.query[q.key]||'';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr(label)+'</label>';
        if(q.type==='select'){
            /* options 可以是数组，也可以是函数（选项依赖后加载的模块，渲染时才求值） */
            const opts=(typeof q.options==='function')?(q.options()||[]):(q.options||[]);
            h+='<select class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-q-'+q.key+'"><option value="">'+tr('请选择')+tr(label)+'</option>';
            opts.forEach(function(o){h+='<option'+(val===o?' selected':'')+'>'+esc(o)+'</option>';});
            h+='</select>';
        }else if(q.type==='date'){
            h+='<input type="date" value="'+esc(val)+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-q-'+q.key+'">';
        }else{
            h+='<input type="text" value="'+esc(val)+'" placeholder="'+tr('请输入')+tr(label)+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-q-'+q.key+'">';
        }
        h+='</div>';
    });
    h+='</div></div>';
    /* 操作按钮行 */
    h+='<div class="flex flex-wrap gap-2 mb-2">';
    /* 按钮层级跟全站一致：主操作用 primary 实心，次要操作用白底描边，不再一排同色实心蓝 */
    const btnPrimary='h-8 px-3 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer';
    const btnGhost='h-8 px-3 text-xs font-medium text-text-secondary bg-white border border-surface-200 hover:bg-surface-50 rounded-lg cursor-pointer';
    h+='<button class="'+btnPrimary+'" onclick="showToast(tr(\'查询完成\'))">'+tr('查询')+'</button>';
    h+='<button class="'+btnPrimary+'" onclick="openFinalAllocAutoModal()">'+tr('一键配舱')+'</button>';
    /* 空运是平铺的袋列表，没有可展开的子行，这两个按钮就不给了 */
    if(!_finalAllocIsAir()){
        h+='<button class="'+btnGhost+'" onclick="finalAllocExpandAll(true)">'+tr('全部展开')+'</button>';
        h+='<button class="'+btnGhost+'" onclick="finalAllocExpandAll(false)">'+tr('全部收起')+'</button>';
    }
    h+='</div>';
    return h;
}

/* ===== 一键配舱 =====
 * 录最大方数 → 按预报时间先到先配、整票累加（不拆票）→ 装不下就停 →
 * 弹出拉取结果（票数/件数/重量/体积/装载率）→ 确认后整批移到右侧。
 * 用独立浮层而不是 #crud-modal：配舱弹窗本身占着 crud-modal，套用会把它冲掉
 *（与 PDA 的「录入清点件数」同一套做法）。 */
var _faAutoPicked=[];
function _faAutoOverlay(inner){
    var old=document.getElementById('fa-auto-modal');
    if(old)old.remove();
    var m=document.createElement('div');
    m.id='fa-auto-modal';
    m.className='fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-6';
    m.innerHTML='<div class="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">'+inner+'</div>';
    document.body.appendChild(m);
    return m;
}
function closeFinalAllocAutoModal(){
    var m=document.getElementById('fa-auto-modal');
    if(m)m.remove();
}
function openFinalAllocAutoModal(){
    finalAllocSyncForm();
    if(!_finalAllocState.unselected.length){showToast(tr('未选数据里没有可配的货'));return;}
    var unit=_finalAllocUnitLabel();
    var h='<div class="px-4 py-3 border-b border-surface-200 text-sm font-semibold text-text-primary">'+tr('一键配舱')+'</div>';
    h+='<div class="p-4 space-y-3">';
    h+='<div class="rounded-lg bg-primary-50/60 border border-primary-100 px-3 py-2 text-xs text-primary-700">'+
       tr('按预报时间从早到晚整票拉取，累计体积不超过最大方数；不拆票。')+'</div>';
    h+='<div><div class="text-xs text-text-secondary mb-1">'+tr('最大方数')+'（CBM）<span class="text-red-500 ml-1">*</span></div>'+
       '<input id="fa-auto-max" type="number" min="0" step="0.001" value="28" class="w-full h-10 px-3 rounded-lg border border-surface-200 bg-surface-50 text-base text-text-primary"></div>';
    h+='<div class="text-[11px] text-text-muted">'+tr('当前未选')+' '+_finalAllocState.unselected.length+' '+tr(unit==='袋号'?'袋':'票')+
       '，'+tr('合计')+' '+_faSumVol(_finalAllocState.unselected).toFixed(3)+' CBM</div>';
    h+='</div>';
    h+='<div class="grid grid-cols-2 gap-2 px-4 pb-4">'+
       '<button type="button" onclick="closeFinalAllocAutoModal()" class="h-10 rounded-lg border border-surface-200 text-sm text-text-secondary cursor-pointer">'+tr('取消')+'</button>'+
       '<button type="button" onclick="runFinalAllocAutoPick()" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium cursor-pointer">'+tr('开始拉取')+'</button>'+
       '</div>';
    _faAutoOverlay(h);
    setTimeout(function(){var el=document.getElementById('fa-auto-max');if(el){el.focus();el.select();}},50);
}
function _faSumVol(rows){
    return (rows||[]).reduce(function(a,b){return a+(parseFloat(b.outVol)||0);},0);
}
/* 按预报时间升序；没有 time 的排到最后，保持原相对次序 */
function _faByTime(rows){
    return (rows||[]).map(function(r,i){return {r:r,i:i};}).sort(function(a,b){
        var ta=String(a.r.time||''),tb=String(b.r.time||'');
        if(ta&&tb&&ta!==tb)return ta<tb?-1:1;
        if(ta&&!tb)return -1;
        if(!ta&&tb)return 1;
        return a.i-b.i;
    }).map(function(x){return x.r;});
}
function runFinalAllocAutoPick(){
    var el=document.getElementById('fa-auto-max');
    var max=el?parseFloat(el.value):NaN;
    if(isNaN(max)||max<=0){showToast(tr('请输入正确的最大方数'));if(el)el.focus();return;}
    var picked=[],vol=0;
    _faByTime(_finalAllocState.unselected).forEach(function(r){
        var v=parseFloat(r.outVol)||0;
        if(vol+v<=max){picked.push(r);vol+=v;}
    });
    if(!picked.length){
        showToast(tr('最大方数太小，最早那票就装不下'));
        return;
    }
    _faAutoPicked=picked;
    var pcs=picked.reduce(function(a,b){return a+(+b.pcs||0);},0);
    var wt=picked.reduce(function(a,b){return a+(+b.outWt||0);},0);
    var rate=max?(vol/max*100):0;
    var unit=_finalAllocUnitLabel()==='袋号'?'袋':'票';
    var h='<div class="px-4 py-3 border-b border-surface-200 text-sm font-semibold text-text-primary">'+tr('确认拉取结果')+'</div>';
    h+='<div class="p-4 space-y-3">';
    h+='<div class="grid grid-cols-2 gap-2">';
    [[unit==='袋'?'拉取袋数':'拉取票数',picked.length+' '+tr(unit)],['总件数',pcs],
     ['总重量',wt.toLocaleString()+' KG'],['总体积',vol.toFixed(3)+' CBM']].forEach(function(p,i){
        h+='<div class="rounded-lg border border-surface-200 px-3 py-2">'+
           '<div class="text-[11px] text-text-muted">'+esc(tr(p[0]))+'</div>'+
           '<div class="'+(i===3?'text-base font-bold text-primary-700':'text-sm font-semibold text-text-primary')+' mt-0.5">'+esc(String(p[1]))+'</div></div>';
    });
    h+='</div>';
    h+='<div class="rounded-lg bg-surface-50 border border-surface-200 px-3 py-2 text-xs text-text-secondary">'+
       tr('最大方数')+' '+max.toFixed(3)+' CBM · '+tr('装载率')+' <span class="font-bold text-primary-700">'+rate.toFixed(1)+'%</span>'+
       ' · '+tr('剩余')+' '+(max-vol).toFixed(3)+' CBM</div>';
    var restCount=_finalAllocState.unselected.length-picked.length;
    if(restCount>0)h+='<div class="text-[11px] text-text-muted">'+tr('还有')+' '+restCount+' '+tr(unit)+tr('装不下，留在未选列表')+'</div>';
    h+='</div>';
    h+='<div class="grid grid-cols-2 gap-2 px-4 pb-4">'+
       '<button type="button" onclick="openFinalAllocAutoModal()" class="h-10 rounded-lg border border-surface-200 text-sm text-text-secondary cursor-pointer">'+tr('重新设置')+'</button>'+
       '<button type="button" onclick="confirmFinalAllocAutoPick()" class="h-10 rounded-lg bg-primary-600 text-white text-sm font-medium cursor-pointer">'+tr('确认拉入')+'</button>'+
       '</div>';
    _faAutoOverlay(h);
}
function confirmFinalAllocAutoPick(){
    if(!_faAutoPicked.length){closeFinalAllocAutoModal();return;}
    var picked=_faAutoPicked;
    _finalAllocState.unselected=_finalAllocState.unselected.filter(function(r){return picked.indexOf(r)<0;});
    picked.forEach(function(r){_finalAllocState.selected.push(r);});
    _finalAllocState.expanded={};
    _faAutoPicked=[];
    closeFinalAllocAutoModal();
    finalAllocRerender();
    showToast(tr('已一键配舱')+' '+picked.length+' '+tr(_finalAllocUnitLabel()==='袋号'?'袋':'票'));
}

function _finalAllocRightPanel(showHeader){
    let h='';
    h+='<div class="text-sm font-semibold text-text-primary mb-2">'+tr('已选数据')+'</div>';
    if(showHeader){
        const hd=_finalAllocState.header;
        const countries=['塞内加尔','尼日利亚','加纳','科特迪瓦','喀麦隆','多哥'];
        h+='<div class="bg-white border border-surface-200 rounded-lg p-3 mb-3"><div class="grid grid-cols-3 gap-3">';
        /* 必填星号跟全站一样放在标签后面 */
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('配舱单号')+' <span class="text-red-500">*</span></label><input type="text" value="'+esc(hd.no)+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-no"></div>';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('标签编号')+'</label><input type="text" value="'+esc(hd.label||'')+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-label" placeholder="'+esc(tr('请输入标签编号'))+'"></div>';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('国家')+'</label><select class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-country"><option value="">'+tr('请选择')+'</option>';
        countries.forEach(function(o){h+='<option'+(o===hd.country?' selected':'')+'>'+o+'</option>';});
        h+='</select></div>';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('柜号')+'</label><input type="text" value="'+esc(hd.containerNo||'')+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-container" placeholder="'+esc(tr('请输入柜号'))+'"></div>';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('运输方式')+'</label><select class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-transport">';
        ['海运','空运','卡航','快递'].forEach(function(o){h+='<option'+(o===hd.transport?' selected':'')+'>'+o+'</option>';});
        h+='</select></div>';
        h+='<div class="flex flex-col gap-0.5"><label class="text-xs text-text-secondary">'+tr('关联主单')+'</label><input type="text" value="'+esc(hd.bl)+'" placeholder="'+esc(tr('Job No'))+'" class="h-8 px-2 text-xs border border-surface-200 rounded-lg bg-surface-50" id="final-alloc-bl"></div>';
        h+='</div></div>';
    }
    return h;
}

function _finalAllocBodyHtml(mode){
    const arrowCls='w-8 h-8 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-base cursor-pointer';
    const arrows='<div class="flex flex-col justify-center gap-3 px-1"><button class="'+arrowCls+'" onclick="finalAllocMove(\'right\')" title="'+tr('选入')+'">›</button><button class="'+arrowCls+'" onclick="finalAllocMove(\'left\')" title="'+tr('移除')+'">‹</button></div>';
    let h='<div class="flex flex-col gap-3">';
    /* 控件行：左(查询+按钮) 与 右(表头) 顶部对齐（高度可不同） */
    h+='<div class="flex gap-4 items-start">';
    h+='<div class="flex-1 min-w-0">'+_finalAllocLeftPanel(mode)+'</div>';
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
    finalAllocSyncForm();
    const k=side+'-'+i;
    _finalAllocState.expanded[k]=!_finalAllocState.expanded[k];
    finalAllocRerender();
}

function finalAllocExpandAll(open){
    finalAllocSyncForm();
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
    finalAllocSyncForm();
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
    footerEl.innerHTML=finalAllocFooterHtml('finalAllocSubmit(\'add\',\''+id+'\')','终配舱登记');
    document.getElementById('crud-modal').classList.add('show');
}

/* 从列表行拼出弹窗要的表头与已配明细。调整与异常调整共用，
 * 两处各写一遍的话，列名一改就会有一处漏掉。 */
function _faPresetFromRow(id,row){
    /* 全部按表头名取，不再按下标 —— 这张表的列序已经调过几轮了 */
    const presetNo=faListCell(id,row,'配舱单号');
    const presetTransport=faListCell(id,row,'运输方式','海运');
    /* 已选行的首列跟着运输方式走：空运配的是袋，给个袋号；其余仍是预配单号 */
    const presetUnitNo=presetTransport==='空运'
        ?presetNo.replace(/^ZPCD-/,'BAG-').replace(/-终配/,'')
        :presetNo.replace(/-终配/,'-预配').replace(/^ZPCD-/,'YPC-');
    return {
        transport:presetTransport,
        header:{no:presetNo,label:faListCell(id,row,'标签编号'),transport:presetTransport,
            bl:faListCell(id,row,'Job No'),country:faListCell(id,row,'国家'),
            containerNo:faListCell(id,row,'柜号')},
        selected:[{no:presetUnitNo,pcs:2,canPcs:0,canWt:2,canVol:'0.000002',outWt:2,outVol:'0.000002',
            sub:[{no:'H82606240002',pcs:2,canPcs:0,canWt:2,canVol:'0.000002',outWt:2,outVol:'0.000002'}]}]
    };
}

function openFinalAllocAdjustModal(id,rowIdx){
    const idx=(rowIdx===undefined||rowIdx<0)?getSelectedRowIndex():rowIdx;
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    const row=(_listData[id]||TC[id].d)[idx]||[];
    const p=_faPresetFromRow(id,row);
    _finalAllocResetState('edit',p.header,p.selected,p.transport);
    _finalAllocState.expanded['selected-0']=true;
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='92%';
    titleEl.textContent=tr('调整');
    bodyEl.innerHTML=_finalAllocBodyHtml('edit');
    footerEl.innerHTML=finalAllocFooterHtml('finalAllocSubmit(\'edit\',\''+id+'\')','确认');
    document.getElementById('crud-modal').classList.add('show');
}

/* ===== 异常调整 =====
 * 货已经出仓了才用得上：漏配的补进去、错配的拿出来。和「调整」两点不同 ——
 * 1. 只针对「已出仓」的配舱单（待出仓的走普通调整就行，没必要走异常流程）；
 * 2. 左侧只按单号查，且单号必填：出仓后不该再按国家/客户这类条件整片捞货源，
 *    只能拿着具体单号定点增减，货源池也因此不预载，查过才有。 */
function openFinalAllocExAdjustModal(id,rowIdx){
    const idx=(rowIdx===undefined||rowIdx<0)?getSelectedRowIndex():rowIdx;
    if(idx<0){openActionModal('selectRequired',id,-1);return;}
    const row=(_listData[id]||TC[id].d)[idx]||[];
    const status=faListCell(id,row,'配舱状态');
    if(status!=='已出仓'){
        showToast(tr('异常调整仅针对「已出仓」的配舱单')+'，'+tr('当前为')+'「'+tr(status||'—')+'」');
        return;
    }
    const p=_faPresetFromRow(id,row);
    _finalAllocResetState('exAdjust',p.header,p.selected,p.transport);
    /* 货源池清空：必须先按单号查出来才能选入 */
    _finalAllocState.unselected=[];
    _finalAllocState.exQueried=false;
    _finalAllocState.expanded['selected-0']=true;
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='92%';
    document.getElementById('crud-modal-title').textContent=tr('异常调整')+' - '+esc(p.header.no);
    document.getElementById('crud-modal-body').innerHTML=_finalAllocBodyHtml('exAdjust');
    document.getElementById('crud-modal-footer').innerHTML=finalAllocFooterHtml('finalAllocSubmit(\'exAdjust\',\''+id+'\')','确认');
    document.getElementById('crud-modal').classList.add('show');
}

/* 异常调整的查询：单号必填，空的直接拦下 —— 不允许空条件把整池货拉出来 */
function finalAllocExQuery(){
    finalAllocSyncForm();
    const no=String(_finalAllocState.query.unitNo||'').trim();
    if(!no){
        showToast(tr('单号不能为空')+'，'+tr('请输入')+tr(_finalAllocUnitLabel())+tr('后查询'));
        _finalAllocState.unselected=[];
        _finalAllocState.exQueried=false;
        finalAllocRerender();
        return;
    }
    const key=no.toLowerCase();
    const hit=_finalAllocClone(_finalAllocPoolSeed()).filter(function(r){
        if(String(r.no||'').toLowerCase().indexOf(key)>=0)return true;
        return (r.sub||[]).some(function(s){return String(s.no||'').toLowerCase().indexOf(key)>=0;});
    });
    _finalAllocState.unselected=hit;
    _finalAllocState.exQueried=true;
    _finalAllocState.expanded={};
    finalAllocRerender();
    showToast(hit.length?(tr('查询到')+' '+hit.length+' '+tr('条')):(tr('未查询到该单号')+'：'+no));
}

function finalAllocSubmit(mode,id){
    /* 异常调整允许把明细减到空（整单撤配），其余模式仍要求至少一条 */
    if(mode!=='exAdjust'&&!_finalAllocState.selected.length){showToast(tr('请先选入数据再提交'));return;}
    finalAllocSyncHeader();
    if(!_finalAllocState.header.no){showToast(tr('配舱单号必填'));return;}
    closeCrudModal();
    showToast(tr(mode==='add'?'终配舱登记成功':(mode==='exAdjust'?'异常调整成功':'终配舱调整成功')));
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

/* ===== 配舱条码打印 =====
 * 给勾选的配舱单打条形码标签（条码内容 = 配舱单号）。
 * 条码渲染复用托盘条码打印的 renderPalletBarcodeSvg（10-express-sort.js）。 */
var _allocBarcodeCtx={id:'',rows:[]};
function openFinalAllocBarcodeModal(id){
    id=id||'wh-final-alloc';
    var indices=(typeof getSelectedRowIndices==='function')?getSelectedRowIndices():[];
    if(!indices.length){showToast(tr('请先勾选需要打印条码的配舱单'));return;}
    var c=TC[id]||{},h=c.h||[];
    var data=(typeof _listData!=='undefined'&&_listData[id])?_listData[id]:(c.d||[]);
    var g=function(row,label){var i=h.indexOf(label);return (i>=0&&row&&row[i]!=null)?String(row[i]):'';};
    var rows=[];
    indices.forEach(function(i){
        var row=data[i];
        if(!row)return;
        var no=g(row,'配舱单号');
        if(!no)return;
        rows.push({no:no,bl:g(row,'Job No'),country:g(row,'国家'),
            transport:g(row,'运输方式'),tickets:g(row,'票数'),pcs:g(row,'件数')});
    });
    if(!rows.length){showToast(tr('所选数据没有配舱单号，无法打印'));return;}
    _allocBarcodeCtx={id:id,rows:rows};
    var panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='62%';
    document.getElementById('crud-modal-title').textContent=tr('配舱条码打印');
    document.getElementById('crud-modal-body').innerHTML=allocBarcodeBodyHtml();
    document.getElementById('crud-modal-footer').innerHTML=finalAllocFooterHtml('printFinalAllocBarcodes()','打印','取消');
    document.getElementById('crud-modal').classList.add('show');
    setTimeout(renderFinalAllocBarcodes,0);
}
function allocBarcodeBodyHtml(){
    var rows=_allocBarcodeCtx.rows||[];
    var inCls='h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50 w-full';
    var h='<div class="space-y-4">';
    h+='<div class="rounded-lg bg-surface-50 border border-surface-200 p-3 text-sm text-text-secondary">'+
       tr('已勾选')+'：<span class="font-medium text-text-primary">'+rows.length+'</span> '+tr('个配舱单')+
       '<div class="mt-1 text-xs text-text-muted break-all">'+esc(rows.slice(0,6).map(function(r){return r.no;}).join('、')+(rows.length>6?'…':''))+'</div></div>';
    h+='<div class="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('每单份数')+'</label>'+
       '<input type="number" min="1" max="20" id="alloc-bc-copies" value="1" class="'+inCls+'" onchange="renderFinalAllocBarcodes()"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('条形码高度(mm)')+'</label>'+
       '<input type="number" min="20" max="120" step="5" id="alloc-bc-height" value="45" class="'+inCls+'" onchange="renderFinalAllocBarcodes()"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="text-sm font-medium text-text-secondary">'+tr('文字大小(pt)')+'</label>'+
       '<input type="number" min="8" max="20" id="alloc-bc-font" value="11" class="'+inCls+'" onchange="renderFinalAllocBarcodes()"></div>';
    h+='</div>';
    h+='<div class="flex items-center gap-2 text-xs text-text-secondary">'+
       '<label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" id="alloc-bc-detail" class="rounded border-surface-300 text-primary-600" checked onchange="renderFinalAllocBarcodes()"><span>'+tr('标签上打印提单号 / 国家 / 票数件数')+'</span></label></div>';
    h+='<div><div class="text-sm font-semibold text-text-primary mb-2">'+tr('预览')+'</div>'+
       '<div id="alloc-bc-preview" class="border-t border-surface-200 pt-4"></div></div>';
    h+='</div>';
    return h;
}
function renderFinalAllocBarcodes(){
    var box=document.getElementById('alloc-bc-preview');
    if(!box)return;
    var rows=_allocBarcodeCtx.rows||[];
    var copies=Math.max(1,Math.min(20,parseInt((document.getElementById('alloc-bc-copies')||{}).value||'1',10)||1));
    var height=Math.max(20,Math.min(120,parseInt((document.getElementById('alloc-bc-height')||{}).value||'45',10)||45));
    var font=Math.max(8,Math.min(20,parseInt((document.getElementById('alloc-bc-font')||{}).value||'11',10)||11));
    var detailEl=document.getElementById('alloc-bc-detail');
    var withDetail=detailEl?!!detailEl.checked:true;
    var items=[];
    rows.forEach(function(r){
        for(var k=0;k<copies;k++){
            var card='<div class="alloc-bc-card border border-surface-200 rounded-lg p-3 bg-white flex flex-col items-center overflow-hidden">';
            card+='<div class="w-full">'+((typeof renderPalletBarcodeSvg==='function')?renderPalletBarcodeSvg(r.no,height):'')+'</div>';
            card+='<div class="mt-1 w-full text-center font-semibold text-text-primary" style="font-size:'+font+'pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+esc(r.no)+'">'+esc(r.no)+'</div>';
            if(withDetail){
                var line1=[r.bl,r.country].filter(Boolean).join(' · ');
                var line2=[r.transport,(r.tickets?r.tickets+tr('票'):''),(r.pcs?r.pcs+tr('件'):'')].filter(Boolean).join(' · ');
                if(line1)card+='<div class="mt-0.5 w-full text-center text-[11px] text-text-secondary truncate" title="'+esc(line1)+'">'+esc(line1)+'</div>';
                if(line2)card+='<div class="w-full text-center text-[11px] text-text-muted truncate">'+esc(line2)+'</div>';
            }
            card+='</div>';
            items.push(card);
        }
    });
    box.innerHTML='<div class="text-xs text-text-muted mb-2">'+tr('共')+' '+items.length+' '+tr('张')+'</div>'+
        '<div class="grid grid-cols-2 md:grid-cols-3 gap-3">'+items.join('')+'</div>';
}
function printFinalAllocBarcodes(){
    var box=document.getElementById('alloc-bc-preview');
    if(!box||!box.querySelectorAll('.alloc-bc-card').length){showToast(tr('没有可打印的标签'));return;}
    var n=box.querySelectorAll('.alloc-bc-card').length;
    showToast(tr('已发送打印任务')+'，'+tr('共')+' '+n+' '+tr('张'));
    if(typeof window!=='undefined'&&window.print)setTimeout(function(){window.print();},60);
}

/* 按表头名取配舱计划某行的值。列序调过好几次了（去掉配柜状态、提单号改 Job No、
 * 补封签号），再按下标取迟早取串 —— 原来「柜号」输入框里显示的就是国家名。 */
function faListCell(id,row,name,dft){
    const h=(TC[id]&&TC[id].h)||[],i=h.indexOf(name);
    const v=(i>=0&&row&&row[i]!=null)?String(row[i]):'';
    return v!==''?v:(dft===undefined?'':dft);
}
function openFinalAllocLinkBLModal(id){
    const idx=getSelectedRowIndex();
    const row=idx>=0?((_listData[id]||TC[id].d)[idx]||[]):[];
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    const panel=document.querySelector('#crud-modal .slide-panel');
    if(panel)panel.style.width='52%';
    titleEl.textContent=tr('关联主单');
    let h='<div class="space-y-4">';
    h+='<div class="bg-primary-50 border border-primary-100 rounded-lg p-3 text-xs text-primary-700">'+tr('为选中的终配舱单关联主单（Job No）；若未选中则按输入新增关联。')+'</div>';
    /* 控件走全站规范：h-10 + bg-surface-50，标签用 text-sm font-medium text-text-secondary */
    const fldCls='h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    const lblCls='text-sm font-medium text-text-secondary';
    h+='<div class="grid grid-cols-2 gap-x-5 gap-y-4">';
    h+='<div class="flex flex-col gap-1.5"><label class="'+lblCls+'">'+tr('配舱单号')+'</label><input type="text" value="'+esc(faListCell(id,row,'配舱单号'))+'" class="'+fldCls+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="'+lblCls+'">'+tr('Job No')+' <span class="text-red-500">*</span></label><input type="text" value="'+esc(faListCell(id,row,'Job No','FBK-20260626001'))+'" class="'+fldCls+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="'+lblCls+'">'+tr('柜号')+'</label><input type="text" value="'+esc(faListCell(id,row,'柜号','GH-20260626-001'))+'" class="'+fldCls+'"></div>';
    /* 封签号非必填：柜子封好才有，关联主单时经常还没有 */
    h+='<div class="flex flex-col gap-1.5"><label class="'+lblCls+'">'+tr('封签号')+'</label><input type="text" value="'+esc(faListCell(id,row,'封签号'))+'" placeholder="'+esc(tr('选填，封柜后回填'))+'" class="'+fldCls+'"></div>';
    h+='</div></div>';
    bodyEl.innerHTML=h;
    footerEl.innerHTML=finalAllocFooterHtml('closeCrudModal();showToast(tr(\'已关联主单\'))','确认');
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
    /* 同上：控件高度、底色、标签字重都对齐全站；备注按规范用 rows=3 的 textarea */
    const fldCls='w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-50';
    const lblCls='text-sm font-medium text-text-secondary';
    const curNo=faListCell(id,row,'配舱单号');
    h+='<div class="flex flex-col gap-1.5"><label class="'+lblCls+'">'+tr('原配舱单号')+'</label><input type="text" readonly value="'+esc(curNo)+'" class="w-full h-10 px-3 text-sm border border-surface-200 rounded-lg bg-surface-100 text-text-muted cursor-not-allowed"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="'+lblCls+'">'+tr('新配舱单号')+' <span class="text-red-500">*</span></label><input type="text" id="final-alloc-new-no" value="'+esc(curNo)+'" class="'+fldCls+'"></div>';
    h+='<div class="flex flex-col gap-1.5"><label class="'+lblCls+'">'+tr('备注')+'</label><textarea rows="3" class="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 resize-y" placeholder="'+esc(tr('请输入修改原因'))+'"></textarea></div>';
    h+='</div>';
    bodyEl.innerHTML=h;
    footerEl.innerHTML=finalAllocFooterHtml('closeCrudModal();showToast(tr(\'配舱单号已修改\'))','确认');
    document.getElementById('crud-modal').classList.add('show');
}

function runFinalAllocAutoReplenish(id){
    const checked=document.querySelectorAll('.row-check:checked');
    const cnt=checked.length||(_listData[id]||TC[id].d||[]).length;
    showToast(tr('自动补货已派单')+'，'+tr('共')+' '+cnt+' '+tr('票'));
}

