/* 探针：找货扫描(空运分拣链路) 改动自检 —— 函数唯一性 + 关键状态流转 */
const fs=require('fs');
const path=require('path');
const root=__dirname;
const src=fs.readFileSync(path.join(root,'js','17-warehouse-pda.js'),'utf8');

let fail=0;
const chk=(cond,msg)=>{console.log((cond?'OK  ':'FAIL')+' '+msg);if(!cond)fail++;};

/* 1) 函数唯一定义 */
['generatePdaFindScanAirOperate','goPdaFindScanSort','onePdaFindScanAirFinish','pdaFindScanAirBoundMap','pdaFindScanAirBoundMapIsFull','bindPdaSortScanBagToFind','finishPdaSortScan','applyPdaSortScanWaybill','openWarehousePdaTask','closeWarehousePdaTask'].forEach(n=>{
    const c=(src.match(new RegExp('function '+n+'\\b','g'))||[]).length;
    chk(c===1,('function '+n+' 定义次数='+c));
});

/* 2) 状态流转模拟：提取整段脚本在受控全局里跑，驱动 分拣→绑定→全绑完回找货 */
const vm=require('vm');
const noop=()=>{};
const captured={};
const sandbox={
    console:{log:noop,error:noop,warn:noop},
    document:{getElementById:()=>null,createElement:()=>({style:{},classList:{add:noop,remove:noop},setAttribute:noop,appendChild:noop,remove:noop}),querySelector:()=>null,querySelectorAll:()=>[],body:{appendChild:noop}},
    window:{},setTimeout:noop,
    showToast:m=>{captured.toast=m;},
    tr:s=>s, esc:s=>String(s),
    PACKAGE_TYPE_OPTIONS:['纸箱'],
    getWarehouseNameOptions:()=>['拉各斯仓'],
};
sandbox.window=sandbox;
vm.createContext(sandbox);
try{
    vm.runInContext(src,sandbox);
}catch(e){
    console.log('LOAD ERROR: '+e.message);process.exit(1);
}
const S=(n)=>vm.runInContext(n,sandbox);

/* 初始状态 */
chk(S('_pdaFindScanList.length')===4,'找货列表 4 张配舱单');
chk(S('_pdaFindScanList[3].transport')==='空运','第 4 张是空运');
chk(S('_pdaFindScanList[3].bags.length')===0,'空运初始无预置袋');
chk(S('_pdaFindScanList[3].waybills.length')===3,'空运有 3 票运单');

/* 进空运找货操作屏 */
S('pickPdaFindScanCard(3)');
chk(S('_pdaFindScanCurrent')===3&&S('_pdaFindScanView')==='operate','进入空运操作屏');
chk(S('typeof generatePdaFindScanOperate()')==='string','操作屏渲染出 HTML');
chk(S('generatePdaFindScanOperate()').indexOf('分拣扫描')>=0,'操作屏含「分拣扫描」按钮');
chk(S('generatePdaFindScanOperate()').indexOf('待找货')>=0&&S('generatePdaFindScanOperate()').indexOf('已找货')>=0,'插页是 待找货/已找货');

/* 跳分拣 */
S('goPdaFindScanSort()');
chk(S('_warehousePdaTaskId')==='pda-sort-scan','已跳到分拣扫描');
chk(S('_pdaSortScanFindIdx')===3,'分拣带着找货下标 3');
chk(S('generatePdaSortScanScreen()').indexOf('空运找货')>=0,'分拣屏显示空运找货横幅');

/* 新增袋子（模拟 confirm：直接造规则） */
S('_pdaSortScanRule={product:"西非空运专线",cargoType:"带电",warehouse:"拉各斯仓",maxWeight:0,maxVol:0}');
S('_pdaSortScanBagNo=nextPdaSortScanBagNo()');
S('_pdaSortScanItems=[]');
/* 扫运单：合法 / 非本单 / 重复 */
S('_pdaSortScanItems.push({wb:"WB-20260405002",qty:3,weight:30,vol:0.1})');
/* 模拟扫第二袋前的完成装袋并继续 */
const bag1=S('_pdaSortScanBagNo');
S('finishPdaSortScan(true)');
chk(S('_pdaFindScanList[3].bags.length')===1,'完成装袋后 已找货+1 袋');
chk(S('_pdaFindScanList[3].bags[0].items.length')===1&&S('_pdaFindScanList[3].bags[0].items[0].wb')==='WB-20260405002','袋内运单明细正确');
chk(S('_pdaFindScanList[3].bags[0].cargoType')==='带电','袋货物类型来自装袋规则');
chk(S('_warehousePdaTaskId')==='pda-sort-scan','未全绑完：留在分拣屏继续装袋');

/* 第二袋：剩余两票 */
S('_pdaSortScanItems.push({wb:"WB-20260405001",qty:4,weight:40,vol:0.2},{wb:"WB-20260405003",qty:2,weight:20,vol:0.1})');
S('finishPdaSortScan(false)');
chk(S('_pdaFindScanList[3].bags.length')===2,'两袋全部绑定');
chk(S('pdaFindScanAirBoundMapIsFull(_pdaFindScanList[3])')===true,'全部运单已绑定');
chk(S('_warehousePdaTaskId')==='pda-find-scan','全绑完自动回找货屏');
chk(S('_pdaFindScanActiveTab')==='scanned','回找货停在已找货插页');
chk(S('generatePdaFindScanOperate()').indexOf('运单明细')>=0,'已找货显示运单明细');
chk(S('_pdaSortScanFindIdx')===null,'分拣上下文已清');

/* 一键完成（在干净单上模拟：重置 bags） */
S('_pdaFindScanList[3].bags=[]');
S('_pdaFindScanCurrent=3;_pdaFindScanView="operate";');
S('onePdaFindScanAirFinish()');
chk(S('_pdaFindScanList[3].bags.length')===1&&S('_pdaFindScanList[3].bags[0].items.length')===3,'一键完成：剩余 3 票自动归一袋');
chk(S('pdaFindScanAirBoundMapIsFull(_pdaFindScanList[3])')===true,'一键完成后再全绑');

/* 海运路径回归：第 1 张单仍走老流程 */
S('_pdaFindScanCurrent=0;_pdaFindScanView="operate";');
const sea=S('generatePdaFindScanOperate()');
chk(sea.indexOf('按托盘')>=0&&sea.indexOf('配舱上托')>=0,'海运仍走 按托盘+配舱上托 老流程');
chk(sea.indexOf('分拣扫描（扫运单装袋）')<0,'海运屏没有分拣扫描按钮');

/* 工作台直接进分拣 = 独立链路 */
S('_pdaSortScanFindIdx=1');  /* 人为弄脏 */
S('openWarehousePdaTask("pda-sort-scan")');
chk(S('_pdaSortScanFindIdx')===null,'工作台直接进分拣会清找货上下文');

/* 分拣屏返回：带找货上下文回找货 */
S('_pdaFindScanCurrent=3;_pdaFindScanView="operate";_pdaSortScanFindIdx=3;');
S('closeWarehousePdaTask()');
chk(S('_warehousePdaTaskId')==='pda-find-scan','分拣按返回回找货屏');

/* 装柜扫描回归：仍是扫袋老逻辑（镜像未动） */
const load=S('generatePdaLoadScanScreen()');
chk(load.indexOf('ZPC0305-空运正班-K1')>=0,'装柜列表仍含空运单');
chk(S('_pdaLoadScanList[3].bags.length')===3,'装柜侧空运单预置袋未动');

console.log(fail===0?'\nALL PASS':'\n'+fail+' FAIL');
process.exit(fail===0?0:1);
