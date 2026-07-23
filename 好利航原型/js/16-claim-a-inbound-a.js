function nowDateTimeLocalSeconds(){
    const d=new Date();
    const pad=function(n){return String(n).padStart(2,'0');};
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
}

function currentAccountWarehouse(){
    const options=getWarehouseNameOptions();
    return options.includes('深圳盐田仓')?'深圳盐田仓':(options[0]||'深圳盐田仓');
}

function getNoPreCustomerOptions(){
    const fallback=['鑫达贸易','远洋物流','速达货运','蓝海跨境','华运达国际'];
    const c=TC['crm-cust']||{};
    const headers=c.h||[];
    const shortIdx=headers.indexOf('客户简称');
    const fullIdx=headers.indexOf('客户全称');
    const rows=c.d||[];
    const names=rows.map(function(row){return row[shortIdx>=0?shortIdx:fullIdx]||row[fullIdx]||row[0];}).filter(Boolean);
    return [...new Set(fallback.concat(names))];
}

function noPreCustomerSalesMap(){
    const c=TC['crm-cust']||{};
    const headers=c.h||[];
    const shortIdx=headers.indexOf('客户简称');
    const fullIdx=headers.indexOf('客户全称');
    const salesIdx=headers.indexOf('所属业务员');
    const map={};
    (c.d||[]).forEach(function(row){
        const sales=salesIdx>=0?row[salesIdx]:'';
        [row[shortIdx],row[fullIdx]].forEach(function(name){if(name)map[name]=sales||'张三';});
    });
    Object.assign(map,{'鑫达贸易':'李华','远洋物流':'张伟','速达货运':'王明辉','蓝海跨境':'刘晓东','华运达国际':'陈浩'},map);
    return map;
}

function getNoPreSalesOptions(currentSales){
    const mapped=Object.values(noPreCustomerSalesMap()).filter(Boolean);
    const fallback=['李华','张伟','王明辉','刘晓东','陈浩'];
    return [...new Set(getEmployeeNameOptions().concat(mapped,fallback,currentSales?[currentSales]:[]).filter(Boolean))];
}

function handleNoPreCustomerChange(selectEl,targetId){
    const target=document.getElementById(targetId);
    if(!target)return;
    const map=noPreCustomerSalesMap();
    target.value=map[selectEl.value]||'';
}

function noPrePhotoUploadHtml(listId,inputId,seed){
    const images=(seed||[]).slice(0,5);
    let html='<div class="space-y-3">';
    html+='<div id="'+listId+'" class="grid grid-cols-2 md:grid-cols-5 gap-3">';
    images.forEach(function(name){html+=noPrePhotoPreviewItem(name);});
    html+='</div>';
    html+='<input id="'+inputId+'" type="file" accept="image/*" multiple class="hidden" onchange="handleNoPrePhotoUpload(this,\''+listId+'\',5)">';
    html+='<button type="button" onclick="document.getElementById(\''+inputId+'\').click()" class="h-9 px-4 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('上传图片')+'</button>';
    html+='<span class="ml-2 text-xs text-text-muted">'+tr('最多5张图片')+'</span>';
    html+='</div>';
    return html;
}

function noPrePhotoPreviewItem(name,url){
    const safeName=esc(name||tr('图片'));
    const bg=url?'background-image:url('+url+');background-size:cover;background-position:center;':'';
    return '<div class="no-pre-photo-item relative aspect-square rounded-xl border border-surface-200 bg-primary-50 overflow-hidden cursor-pointer" data-photo-name="'+safeName+'" onclick="openNoPreImagePreview(\''+safeName+'\')" style="'+bg+'"><div class="absolute inset-0 flex flex-col items-center justify-center '+(url?'bg-black/10 text-white':'text-primary-700')+'"><svg class="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg><span class="text-xs px-2 text-center truncate max-w-full">'+safeName+'</span></div><button type="button" onclick="event.stopPropagation();this.closest(\'.no-pre-photo-item\').remove()" class="absolute right-1 top-1 w-6 h-6 rounded-full bg-white/90 text-red-500 text-xs hover:bg-white cursor-pointer">×</button></div>';
}

function handleNoPrePhotoUpload(input,listId,maxCount){
    const list=document.getElementById(listId);
    if(!list||!input.files)return;
    const current=list.querySelectorAll('.no-pre-photo-item').length;
    const remain=Math.max(0,(maxCount||5)-current);
    const files=Array.from(input.files).slice(0,remain);
    if(!files.length){
        showToast(tr('最多5张图片'));
        input.value='';
        return;
    }
    files.forEach(function(file){
        const url=URL.createObjectURL(file);
        list.insertAdjacentHTML('beforeend',noPrePhotoPreviewItem(file.name,url));
    });
    if(input.files.length>remain)showToast(tr('最多5张图片'));
    input.value='';
}

function renderNoPreImageThumbs(rawCell){
    const names=String(rawCell||'').split('|').map(function(v){return v.trim();}).filter(Boolean);
    if(!names.length)return '<span class="text-text-muted">—</span>';
    let html='<div class="flex items-center gap-1.5">';
    names.slice(0,5).forEach(function(name,idx){
        html+='<button type="button" class="w-8 h-8 rounded-lg border border-primary-100 bg-primary-50 text-primary-700 text-[10px] font-semibold hover:bg-primary-100 cursor-pointer overflow-hidden" title="'+esc(name)+'" onclick="openNoPreImagePreview(\''+esc(name)+'\')">图'+(idx+1)+'</button>';
    });
    html+='</div>';
    return html;
}

function generateHeadlessClaimListPage(id,page,statusFilter){
    const key=id||'wh-no-pre-in';
    return generateListPage(key,page,statusFilter);
}

function openNoPreImagePreview(name){
    const modal=document.getElementById('crud-modal');
    document.getElementById('crud-modal-title').textContent=tr('图片预览');
    let html='<div class="space-y-3">';
    html+='<div class="aspect-video rounded-xl border border-primary-100 bg-primary-50 flex flex-col items-center justify-center text-primary-700">';
    html+='<svg class="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
    html+='<div class="text-sm font-medium">'+esc(name||tr('无头件图片'))+'</div>';
    html+='</div>';
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('关闭')+'</button>';
    modal.classList.add('show');
}

function serviceChargeTooltip(serviceName){
    const name=String(serviceName||'附加服务').replace(/\(备注\)/g,'');
    const map={
        '是否报关':'收费标准：CNY 350/票起；要求：提供商业发票、装箱单、报关要素和收发货主体资料。',
        '报关':'收费标准：CNY 350/票起；要求：提供商业发票、装箱单、报关要素和收发货主体资料。',
        '合并报关':'收费标准：按合并票件与资料审核量确认；要求：勾选的运单报关主体、目的港和资料口径一致。',
        '拆分报关':'收费标准：按拆分后票数计费；要求：提供拆分原因、品名明细和对应件数。',
        '带电':'收费标准：按敏感货渠道规则加收；要求：补充电池类型、MSDS或运输鉴定资料。',
        '带磁':'收费标准：按敏感货渠道规则加收；要求：补充磁检资料或客户说明。',
        '贴箱唛':'收费标准：按件计费；要求：提供箱唛模板、粘贴位置和对应件数。',
        '打木箱':'收费标准：CNY 80/件起；要求：按货物尺寸、重量和加固等级确认，超大件需现场复核。',
        '木箱':'收费标准：CNY 80/件起；要求：按货物尺寸、重量和加固等级确认，超大件需现场复核。',
        '仿牌':'收费标准：按渠道规则单独确认；要求：确认品牌、商标授权和目的国合规要求，存在仿冒风险时需客户书面承诺。',
        '二次包装':'收费标准：CNY 15/件起；要求：适用于外箱破损、换箱、缠膜、加固等处理。',
        '需要卸货':'收费标准：CNY 50/票起；要求：超重、整托或需人工搬运时按仓库现场规则确认。',
        '需要集货':'收费标准：CNY 20/票起；要求：多票合并入仓或等齐后出运，需确认集货截止时间。'
    };
    return tr('收费标准和要求')+'：'+tr(map[name]||'按服务类型和现场作业规则确认收费标准，操作前需确认客户要求。');
}

function openServiceChargeStandardModal(input){
    const serviceName=typeof input==='string'?input:(input&&input.dataset?input.dataset.cbLabel:'附加服务');
    const modal=document.getElementById('crud-modal');
    document.getElementById('crud-modal-title').textContent=tr('服务收费标准');
    let html='<div class="space-y-4">';
    html+='<div class="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">'+tr('已勾选')+'：<span class="font-semibold">'+esc(tr(serviceName))+'</span></div>';
    html+='<div class="border border-surface-200 rounded-lg overflow-hidden"><table class="w-full text-sm"><thead class="bg-surface-50"><tr>';
    ['服务项目','计费方式','参考标准','说明'].forEach(function(hd){html+='<th class="px-3 py-2 text-left text-text-secondary">'+tr(hd)+'</th>';});
    html+='</tr></thead><tbody>';
    [
        ['报关','按票计费','CNY 350/票起','适用于需要报关资料审核和报关申报的票件'],
        ['合并报关','按合并票件计费','按票件量确认','多票合并报关时校验客户、目的港和资料口径'],
        ['拆分报关','按拆分票数计费','按拆分后票数确认','一票拆分多票报关时记录拆分原因和品名明细'],
        ['带电','按敏感货规则计费','按渠道确认','带电货物需补充电池资料或运输鉴定'],
        ['带磁','按敏感货规则计费','按渠道确认','带磁货物需补充磁检资料或客户说明'],
        ['贴箱唛','按件计费','按件数确认','按客户箱唛模板进行粘贴']
    ].forEach(function(row){
        html+='<tr class="border-t border-surface-100">';
        row.forEach(function(cell,idx){html+='<td class="px-3 py-2 '+(idx===0?'font-medium text-text-primary':'text-text-secondary')+'">'+esc(tr(cell))+'</td>';});
        html+='</tr>';
    });
    html+='</tbody></table></div>';
    html+='</div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('知道了')+'</button>';
    modal.classList.add('show');
}

function updateShipmentChannelDesc(selectEl){
    const target=document.getElementById('shipment-channel-desc');
    if(!target)return;
    const val=selectEl&&selectEl.value?selectEl.value:'西非海运专线-标准渠道';
    const map={
        '西非海运专线-标准渠道':'适合普货和常规敏感货，默认走深圳/广州仓集货，报价按散货海运产品规则带出。',
        '西非空运专线-敏感渠道':'适合带电、小件高时效货物，下单后自动提示资料要求和敏感货附加服务收费标准。',
        '中东海运专线-普货渠道':'适合中东目的仓普货，按发货仓库和目的仓库匹配销售报价。'
    };
    target.textContent=tr(map[val]||map['西非海运专线-标准渠道']);
}

function openResetPasswordModal(id,rowIdx){
    const c=TC[id]||{};
    const rowData=(rowIdx>=0&&_listData[id])?_listData[id][rowIdx]:null;
    const name=getTableValueByHeader(c,rowData,'用户名',getTableValueByHeader(c,rowData,'员工名称',getTableValueByHeader(c,rowData,'客户简称','已选用户')));
    const password='123456';
    document.getElementById('crud-modal-title').textContent=tr('重置密码');
    let html='<div class="space-y-4">';
    html+='<div class="text-sm text-text-secondary">'+tr('确认后将重置')+' <span class="font-medium text-text-primary">'+esc(name)+'</span> '+tr('的登录密码。')+'</div>';
    html+='<div class="flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 p-3">';
    html+='<input id="reset-password-value" readonly class="flex-1 h-9 px-3 text-sm font-semibold text-primary-700 bg-white border border-surface-200 rounded" value="'+password+'">';
    html+='<button type="button" onclick="copyResetPassword()" class="h-9 px-4 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer">'+tr('复制')+'</button>';
    html+='</div></div>';
    document.getElementById('crud-modal-body').innerHTML=html;
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('取消')+'</button><button onclick="closeCrudModal();showToast(\''+tr('密码重置成功')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('确认重置')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function copyResetPassword(){
    const input=document.getElementById('reset-password-value');
    const value=input?input.value:'123456';
    const done=function(){showToast(tr('复制成功'));};
    if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(value).then(done).catch(function(){
            if(input){input.select();document.execCommand('copy');done();}
        });
    }else if(input){
        input.select();
        document.execCommand('copy');
        done();
    }
}

function openInboundPrintConfirm(){
    document.getElementById('crud-modal-title').textContent=tr('保存入仓');
    document.getElementById('crud-modal-body').innerHTML='<div class="text-sm text-text-secondary">'+tr('入仓数据已保存，是否打印入仓单？')+'</div>';
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal();showToast(\''+tr('保存成功')+'\')" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+tr('不打印')+'</button><button onclick="closeCrudModal();showToast(\''+tr('入仓单已生成')+'\')" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('打印入仓单')+'</button>';
    document.getElementById('crud-modal').classList.add('show');
}

function switchWarehouseReceiveMode(mode,id){
    _warehouseReceiveMode=mode;
    _warehouseReceiveModeTabId=id||'';
    const main=document.getElementById('main-content');
    if(main)main.innerHTML=generateWarehouseInboundPage(id);
}

function warehouseReceiveTabs(id,active){
    if(id==='wh-headless'||id==='wh-in-one')return '';
    const tabs=(id==='wh-in-multi')?[['fast','一票一件'],['second','二次收货']]:[['fast','极速收货'],['second','二次收货'],['noPre','无头件']];
    let html='<div class="bg-white rounded-xl border border-surface-200 p-3"><div class="flex flex-wrap gap-2">';
    tabs.forEach(function(tab){
        const on=active===tab[0];
        html+='<button type="button" onclick="switchWarehouseReceiveMode(\''+tab[0]+'\',\''+id+'\')" class="h-9 px-5 text-sm font-medium rounded-lg cursor-pointer '+(on?'text-white bg-primary-600':'text-text-secondary border border-surface-200 hover:bg-surface-50')+'">'+tr(tab[1])+'</button>';
    });
    html+='</div></div>';
    return html;
}

function generateWarehouseHeadlessInboundPage(id){
    if(id==='wh-no-pre-in')return generateHeadlessClaimListPage('wh-no-pre-in',_listPage['wh-no-pre-in']||1);
    const warehouseOptions=getWarehouseNameOptions();
    let h='';
    h+='<div class="h-full overflow-auto p-5">';
    h+='<form id="headless-register-form" class="space-y-5">';
    h+=warehouseReceiveTabs(id,'noPre');
    h+='<div class="bg-white rounded-xl border border-surface-200 p-5">';
    h+='<div class="flex items-center justify-between gap-4 mb-5"><div><h2 class="text-lg font-semibold text-text-primary">'+tr('无头件登记')+'</h2></div><span class="badge bg-amber-100 text-amber-700">'+tr('待补录')+'</span></div>';
    h+='<div class="space-y-6">';
    h+='<section><div class="text-sm font-semibold text-text-primary mb-3">'+tr('基础信息')+'</div><div class="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">';
    h+=renderField({label:'物流单号',value:'',placeholder:'请输入物流单号'});
    h+=renderField({label:'到货仓库',type:'select',required:true,options:warehouseOptions,value:currentAccountWarehouse()});
    h+=renderField({label:'货区',type:'select',required:true,options:['A区','B区','C区','异常区','待认领区'],value:'待认领区'});
    h+=renderField({label:'入仓件数',type:'number',required:true,value:'1'});
    h+='</div></section>';
    h+='<section><div class="text-sm font-semibold text-text-primary mb-3">'+tr('图片上传')+'</div>';
    h+=noPrePhotoUploadHtml('warehouse-headless-photo-list','warehouse-headless-photo-input',[]);
    h+='</section>';
    h+='</div></div>';
    h+='<div class="bg-white rounded-xl border border-surface-200 p-4 flex flex-wrap justify-end gap-2">';
    h+='<button type="button" onclick="showToast(\''+tr('保存成功')+'\')" class="h-9 px-5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer">'+tr('保存')+'</button>';
    h+='</div>';
    h+='</form></div>';
    setTimeout(function(){applyRuntimeEnhancements(document.getElementById('main-content'));},0);
    return h;
}

