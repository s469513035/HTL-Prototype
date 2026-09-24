/* 探针：补货落货管理 · 按托操作 —— 渲染 + 模式切换 + 删除自检 */
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'js','17-warehouse-pda.js'),'utf8');

let fail=0;
const chk=(cond,msg)=>{console.log((cond?'OK  ':'FAIL')+' '+msg);if(!cond)fail++;};

function makeEl(id){
    return {id:id||'',innerHTML:'',value:'',style:{},hidden:false,
        classList:{_set:new Set(),add(c){this._set.add(c);},remove(c){this._set.delete(c);},toggle(c,f){if(f===undefined){this._set.has(c)?this._set.delete(c):this._set.add(c);}else if(f){this._set.add(c);}else{this._set.delete(c);}},contains(c){return this._set.has(c);}},
        appendChild(){},remove(){},focus(){},setAttribute(){},dispatchEvent(){},
        querySelector(){return null;},querySelectorAll(){return [];}};
}
const els={};
const noop=()=>{};
const sandbox={
    console:{log:noop,error:noop,warn:noop},
    document:{getElementById:id=>els[id]||(els[id]=makeEl(id)),createElement:()=>makeEl(),querySelector:()=>null,querySelectorAll:()=>[],body:{appendChild:noop}},
    window:{},setTimeout:noop,
    showToast:noop,
    tr:s=>s,esc:s=>String(s),
    PACKAGE_TYPE_OPTIONS:['纸箱'],
    getWarehouseNameOptions:()=>['拉各斯仓'],
    menuData:[],
    findMenuNodeById:()=>({children:[]}),
    applyRuntimeEnhancements:noop,
};
sandbox.window=sandbox;
vm.createContext(sandbox);
try{vm.runInContext(src,sandbox);}
catch(e){console.log('LOAD ERROR: '+e.message);process.exit(1);}
const S=n=>vm.runInContext(n,sandbox);

/* 1) 默认模式：按运单 */
S('_warehousePdaTaskId="wh-replenish-drop"');
const h1=S('generatePdaReplenishDropScreen()');
chk(h1.indexOf('按运单操作')>=0&&h1.indexOf('按子单操作')>=0&&h1.indexOf('按托操作')>=0,'三模式按钮都在');
chk(h1.indexOf('TP20260404005')<0,'默认(运单)模式不显示托盘数据');
chk(h1.indexOf('WB-20260613001')>=0,'默认模式显示运单数据');
chk(h1.indexOf('运单详情')>=0,'默认模式详情卡是运单详情');

/* 2) 切按托模式 */
S('switchPdaReplenishMode("pallet")');
chk(S('_pdaReplenishMode')==='pallet','模式状态切到 pallet');
const h2=S('generatePdaReplenishDropScreen()');
chk(h2.indexOf('TP20260404001')>=0&&h2.indexOf('TP20260404005')>=0,'按托模式显示托盘清单');
chk(h2.indexOf('WB-20260613001')<0,'按托模式不显示运单数据');
chk(h2.indexOf('托盘详情')>=0,'按托模式详情卡是托盘详情');
chk(h2.indexOf('请扫描托盘号')>=0,'扫码框提示语切换为托盘号');
chk(h2.indexOf('removePdaReplenishPalletItem')>=0,'按托模式删除走托盘函数');
chk(h2.indexOf('库位：A1')>=0&&h2.indexOf('件数：3')>=0,'托盘卡片带库位+件数');
/* 详情卡按托内容：托盘号/类型/件数/库位/原配舱/目标配舱 */
chk(h2.indexOf('托盘号')<h2.indexOf('托盘详情'),'托盘详情含托盘号字段');

/* 3) 切按子单模式回归 */
S('switchPdaReplenishMode("sub")');
const h3=S('generatePdaReplenishDropScreen()');
chk(h3.indexOf('按子单操作，逐件确认补货落货')>=0,'按子单提示语保留');
chk(h3.indexOf('WB-20260613001')>=0&&h3.indexOf('TP20260404001')<0,'子单模式回到运单列表数据');
chk(h3.indexOf('removePdaReplenishItem')>=0,'子单模式删除走运单函数');

/* 4) 删除操作：两套列表互不干扰 */
S('removePdaReplenishPalletItem(0)');
chk(S('_pdaReplenishPalletItems.length')===1,'删托盘只影响托盘列表');
chk(S('_pdaReplenishItems.length')===2,'运单列表不受影响');
S('removePdaReplenishItem(0)');
chk(S('_pdaReplenishItems.length')===1&&S('_pdaReplenishPalletItems.length')===1,'删运单只影响运单列表');

/* 5) 操作类型切换回归（补货/落货 radio 仍工作） */
S('setPdaReplenishOp("落货")');
chk(S('_pdaReplenishOp')==='落货','操作类型切换正常');
const h4=S('generatePdaReplenishDropScreen()');
chk(h4.indexOf('checked')>=0,'radio 渲染正常');

/* 6) showPdaReplenishDetail/hide 回归（DOM 操作路径） */
els['pda-rd-list']=makeEl('pda-rd-list');
els['pda-rd-detail']=makeEl('pda-rd-detail');
S('showPdaReplenishDetail()');
chk(els['pda-rd-list'].classList.contains('hidden')&&!els['pda-rd-detail'].classList.contains('hidden'),'详情显示/列表隐藏正常');
S('hidePdaReplenishDetail()');
chk(!els['pda-rd-list'].classList.contains('hidden')&&els['pda-rd-detail'].classList.contains('hidden'),'返回详情隐藏/列表显示正常');

/* 7) 其他屏回归 */
S('_warehousePdaTaskId="wh-in-one"');
chk(S('generateWarehousePdaOperationScreen("wh-in-one")').indexOf('问题备注')>=0,'手动入仓问题备注板块完好');

console.log(fail===0?'\nALL PASS':'\n'+fail+' FAIL');
process.exit(fail===0?0:1);
