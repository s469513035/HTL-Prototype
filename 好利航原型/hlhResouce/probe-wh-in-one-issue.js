/* 探针：手动入仓(wh-in-one)问题备注板块 —— 渲染 + 联动自检 */
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'js','17-warehouse-pda.js'),'utf8');

let fail=0;
const chk=(cond,msg)=>{console.log((cond?'OK  ':'FAIL')+' '+msg);if(!cond)fail++;};

/* 极简 DOM stub：querySelector/getElementById 走元素表，classList 可切换 */
function makeEl(id){
    return {id:id||'',innerHTML:'',value:'',style:{},hidden:false,_hidden:false,
        classList:{_set:new Set(),add(c){this._set.add(c);},remove(c){this._set.delete(c);},toggle(c,f){if(f===undefined){this._set.has(c)?this._set.delete(c):this._set.add(c);}else if(f){this._set.add(c);}else{this._set.delete(c);}},contains(c){return this._set.has(c);}},
        appendChild(){},remove(){},focus(){},setAttribute(){},dispatchEvent(){},
        querySelector(){return null;},querySelectorAll(){return [];}};
}
const els={};
const noop=()=>{};
const sandbox={
    console:{log:noop,error:noop,warn:noop},
    document:{
        getElementById:id=>els[id]||(els[id]=makeEl(id)),
        createElement:()=>makeEl(),
        querySelector:()=>null,querySelectorAll:()=>[],
        body:{appendChild:noop},
    },
    window:{},setTimeout:noop,
    showToast:m=>{sandbox._toast=m;},
    tr:s=>s,esc:s=>String(s),
    PACKAGE_TYPE_OPTIONS:['纸箱'],
    getWarehouseNameOptions:()=>['拉各斯仓'],
    menuData:[],
    findMenuNodeById:()=>({children:[]}),
};
sandbox.window=sandbox;
vm.createContext(sandbox);
try{vm.runInContext(src,sandbox);}
catch(e){console.log('LOAD ERROR: '+e.message);process.exit(1);}
const S=n=>vm.runInContext(n,sandbox);

/* 渲染 wh-in-one 操作屏 */
S('_warehousePdaTaskId="wh-in-one"');
const html=S('generateWarehousePdaOperationScreen("wh-in-one")');
chk(typeof html==='string'&&html.length>500,'操作屏渲染出 HTML');
chk(html.indexOf('问题备注')>=0,'含「问题备注」板块标题');
chk(html.indexOf('货区托盘')<html.indexOf('问题备注'),'问题备注板块在货区托盘之后');
chk(html.indexOf('是否问题件')>=0,'含「是否问题件」下拉');
chk(html.indexOf('收货备注')>=0,'含「收货备注」');
chk(html.indexOf('问题说明')>=0,'含「问题说明」');
const iSel=html.indexOf('是否问题件'),iNote=html.indexOf('问题说明'),iRecv=html.indexOf('收货备注');
chk(iSel>0&&iSel<iNote&&iNote<iRecv,'字段顺序：是否问题件 → 问题说明 → 收货备注');
chk(html.indexOf('toggleWhInOneIssueFields(this.value)')>=0,'是否问题件 onchange 已挂');
chk(/id="wh-in-one-issue-note-box" class="[^"]*hidden/.test(html),'问题说明默认隐藏');

/* 联动：选「是」显示、选「否」隐藏并清空 */
els['wh-in-one-issue-note-box']=makeEl('wh-in-one-issue-note-box');
els['wh-in-one-issue-note-box'].classList.add('hidden');
els['wh-in-one-issue-note']=makeEl('wh-in-one-issue-note');
S('toggleWhInOneIssueFields("是")');
chk(!els['wh-in-one-issue-note-box'].classList.contains('hidden'),'选「是」→ 问题说明显示');
S('els=1;');  /* noop */
els['wh-in-one-issue-note'].value='外箱破损2件';
S('toggleWhInOneIssueFields("否")');
chk(els['wh-in-one-issue-note-box'].classList.contains('hidden'),'选「否」→ 问题说明隐藏');
chk(els['wh-in-one-issue-note'].value==='','选「否」→ 问题说明清空');

/* pdaField 通用能力回归：select onchange / textarea id / boxId / hidden 透传 */
const f1=S('pdaField({label:"测试下拉",type:"select",options:["A"],onchange:"alert(1)"})');
chk(f1.indexOf('onchange="alert(1)"')>=0,'pdaField select 支持 onchange');
const f2=S('pdaField({label:"测试文本域",type:"textarea",id:"ta1"})');
chk(f2.indexOf('id="ta1"')>=0,'pdaField textarea 支持 id');
const f3=S('pdaField({label:"测试盒子",boxId:"bx1",hidden:true})');
chk(f3.indexOf('id="bx1"')>=0&&f3.indexOf('hidden')>=0,'pdaField 支持 boxId+hidden');

/* 其他 PDA 屏回归：未受影响 */
S('_warehousePdaTaskId="wh-in-multi"');
const multi=S('generateWarehousePdaOperationScreen("wh-in-multi")');
chk(multi.indexOf('问题备注')<0,'一票多件屏没有误加问题备注');
S('_warehousePdaTaskId="pda-find-scan";_pdaFindScanView="list"');
const find=S('generateWarehousePdaOperationScreen("pda-find-scan")');
chk(find.indexOf('找货扫描')>=0,'找货扫描屏正常渲染');

console.log(fail===0?'\nALL PASS':'\n'+fail+' FAIL');
process.exit(fail===0?0:1);
