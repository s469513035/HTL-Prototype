/* ==========================================================================
 * 49 · 归属关系重构 —— 客服 / 操作 从「客户」身上搬到「员工」与「国家」身上
 *
 * 原来：客户档案里同时挂 所属业务员 / 所属操作 / 所属客服，
 *       同一个业务员跟的每个客户都要把那对搭档再填一遍，换人要逐个客户改。
 *
 * 现在：客户只留「所属业务员」，另外两个归属从两条线解析 ——
 *
 *   客户 ──所属业务员──▶ 员工档案（销售部）──▶ 所属客服 / 所属操作   （跟人走）
 *   运单 ──目的国──────▶ 国家列表 ──────────▶ 所属客服 / 所属操作 / 默认收货仓库（跟货走）
 *
 * 两条线不冲突：跟人的是客户日常对接，跟货的是这条目的国航线的落地客服与操作。
 *
 * 本文件做三件事：
 *   一、把员工档案的「所属部门」种子数据规整成可用的部门名（原始数据是导入残留的数字）
 *   二、员工档案加 所属客服 / 所属操作 两列，只有所属部门＝销售部时弹窗里才出现
 *   三、国家列表加 所属客服 / 所属操作 / 默认收货仓库 三列
 *
 * 依赖（都在更早加载的文件里）：
 *   06 · applyStandardSheetTable 建的 base-employee / cfg-country / cfg-warehouse
 *   09 · fieldSelectOptions（读 TC[id].fieldOptions，支持函数惰性求值）
 *   20 · crudFieldValue / crudSetField / crudToggleField / afterModalRender 钩子
 * ========================================================================== */

/* ==========================================================================
 * 一、员工「所属部门」规整
 *    员工档案是从 Excel 导进来的，所属部门那一列落的是导入残留（"337" / "363" / 空），
 *    七个部门一个都没对上，「销售部才显示搭档」这种按部门走的规则就永远不触发。
 *    岗位/职位 那一列是准的，按岗位反推部门，已经是规范值的行不动。
 * ========================================================================== */
var ORG_EMP_DEPT_OPTIONS=['销售部','操作部','海外部','财务部','客服部','人事部','行政部'];
/* 顺序有讲究：先匹配到的先算。「业财经理」要落财务部，所以销售线只认「业务/销售/商务」整词 */
var ORG_DEPT_BY_POST=[
    [/销售|业务|商务/,'销售部'],
    [/客服/,'客服部'],
    [/操作|订舱|单证|仓库/,'操作部'],
    [/财务|会计|出纳|业财/,'财务部'],
    [/人事|招聘/,'人事部'],
    [/行政/,'行政部'],
    [/海外/,'海外部']
];
function orgDeptFromPost(post){
    var p=String(post||'');
    if(!p)return '';
    for(var i=0;i<ORG_DEPT_BY_POST.length;i++){
        if(ORG_DEPT_BY_POST[i][0].test(p))return ORG_DEPT_BY_POST[i][1];
    }
    return '';
}
(function normalizeEmployeeDept(){
    var c=TC['base-employee'];
    if(!c||!c.h||!c.d)return;
    var di=c.h.indexOf('所属部门'),pi=c.h.indexOf('岗位/职位');
    if(di<0||pi<0)return;
    c.d.forEach(function(r){
        if(ORG_EMP_DEPT_OPTIONS.indexOf(r[di])>=0)return;   /* 已经是规范部门名就别动 */
        /* 岗位也认不出来的（岗位为空、或「广州主管」这种只写了地名的）一律清空：
         * 留着 "337" 这种导入残留比空着更糟 —— 它会混进部门下拉和筛选里。 */
        r[di]=orgDeptFromPost(r[pi]);
    });
})();

/* 按部门取在职员工名单，给下拉用。首项留空 —— 归属允许空着，不能被下拉的第一项默认占掉 */
function orgEmployeesOfDept(dept){
    var c=TC['base-employee'];
    var out=[''];
    if(!c||!c.d)return out;
    var di=c.h.indexOf('所属部门'),ni=c.h.indexOf('员工名称'),si=c.h.indexOf('在职状态');
    c.d.forEach(function(r){
        if(di>=0&&r[di]!==dept)return;
        if(si>=0&&r[si]&&r[si]!=='在职')return;
        var n=String(r[ni]||'').trim();
        if(n&&out.indexOf(n)<0)out.push(n);
    });
    return out;
}
function orgCsOptions(){return orgEmployeesOfDept('客服部');}
function orgOpOptions(){return orgEmployeesOfDept('操作部');}
/* 收货仓库＝国内收货的那一头，海外仓是目的仓不在此列 */
function orgDomesticWarehouseOptions(){
    var c=TC['cfg-warehouse'],out=[''];
    if(c&&c.d){
        var ni=c.h.indexOf('仓库名称'),ci=c.h.indexOf('所属国家'),ti=c.h.indexOf('仓库类型');
        c.d.forEach(function(r){
            if(ci>=0&&String(r[ci]||'').indexOf('CN')!==0)return;
            if(ti>=0&&r[ti]==='海外仓')return;
            var n=String(r[ni]||'').trim();
            if(n&&out.indexOf(n)<0)out.push(n);
        });
    }
    if(out.length<=1&&typeof getWarehouseNameOptions==='function')out=out.concat(getWarehouseNameOptions());
    return out;
}

/* ==========================================================================
 * 二、员工档案：销售部员工带 所属客服 / 所属操作
 *    列一直在（列表要看得到谁配了谁），但弹窗里只有所属部门＝销售部时才出现；
 *    切走部门就清空，避免留下一对跟岗位对不上的搭档。
 * ========================================================================== */
var ORG_SALES_OWNER_FIELDS=['所属客服','所属操作'];
(function addEmployeeOwnerColumns(){
    var c=TC['base-employee'];
    if(!c||!c.h||c.h.indexOf('所属客服')>=0)return;
    var at=c.h.indexOf('所属工作组');
    at=at>=0?at+1:Math.max(0,c.h.indexOf('操作'));
    var di=c.h.indexOf('所属部门');                 /* 所属部门在插入点之前，索引不受影响 */
    c.h.splice(at,0,'所属客服','所属操作');
    /* 种子只给销售部的人配：轮着从客服组和操作组里取，做出「一个销售固定一对搭档」的样子 */
    var csPool=['李小飞','吕清兰','古星伟','孙凤婷','王婕婷','程前'];
    var opPool=['刘九','朱卓琳','成慧','虞元霞','夏丽雯','吴丽华'];
    var k=0;
    (c.d||[]).forEach(function(r){
        var isSales=di>=0&&r[di]==='销售部';
        r.splice(at,0,isSales?csPool[k%csPool.length]:'',isSales?opPool[k%opPool.length]:'');
        if(isSales)k++;
    });
})();
/* 员工档案走的是手写弹窗 openEmployeeModal（js/24-crm.js），不经过通用弹窗，
 * 所以 fieldOptions / fieldChangeHandlers / afterModalRender 那套在这里用不上，
 * 字段与联动直接写在那个弹窗里。requiredOverrides 仍然有效：
 * 手写弹窗渲染完会跑 markCustomModalRequired，按 isImportantRequiredField 补红星，
 * 不覆写的话「所属」两个字会让这三项都变成必填。 */
TC['base-employee'].requiredOverrides=Object.assign(TC['base-employee'].requiredOverrides||{},{
    '所属客服':false,'所属操作':false,'所属工作组':false
});

/* 按部门决定那对搭档的显隐。dept 传字符串＝按给定值判断（查看态用），
 * 传 null＝读弹窗里「所属部门」下拉的当前值（新增/编辑用，onchange 也走这条）。 */
function orgEmpApplyOwnerVisibility(dept){
    var val=(dept===null||dept===undefined)?crudFieldValue('所属部门'):dept;
    var on=val==='销售部';
    ORG_SALES_OWNER_FIELDS.forEach(function(hd){
        crudToggleField(hd,on,false);
        /* 切走部门就清空，别留下一对跟岗位对不上的搭档（查看态没有控件，crudSetField 自己会跳过） */
        if(!on&&dept===null)crudSetField(hd,'');
    });
}
function orgEmpToggleOwnerFields(){orgEmpApplyOwnerVisibility(null);}

/* ==========================================================================
 * 三、国家列表：所属客服 / 所属操作 / 默认收货仓库
 *    按目的国路由：这条国家线的货由谁跟、走哪个国内仓收货，在国家上配一次，
 *    下单和入仓时按目的国带出来，不用每票单子重填。
 * ========================================================================== */
(function addCountryOwnerColumns(){
    var c=TC['cfg-country'];
    if(!c||!c.h||c.h.indexOf('默认收货仓库')>=0)return;
    var at=c.h.indexOf('是否启用');
    if(at<0)at=Math.max(0,c.h.indexOf('操作'));
    c.h.splice(at,0,'所属客服','所属操作','默认收货仓库');
    /* 与种子国家一一对应（美国/中国/塞内加尔/科特迪瓦/喀麦隆/多哥/尼日利亚/加纳/安哥拉/莫桑比克）：
     * 西非五国是核心市场，收货仓按现有华南两仓分，葡语线走上海 */
    var seed=[
        ['李小飞','刘九','深圳盐田仓'],
        ['吕清兰','朱卓琳','上海浦东仓'],
        ['古星伟','成慧','广州南沙仓'],
        ['孙凤婷','虞元霞','广州南沙仓'],
        ['王婕婷','夏丽雯','深圳盐田仓'],
        ['程前','吴丽华','广州南沙仓'],
        ['李小飞','刘九','深圳盐田仓'],
        ['吕清兰','朱卓琳','深圳盐田仓'],
        ['古星伟','成慧','上海浦东仓'],
        ['孙凤婷','虞元霞','上海浦东仓']
    ];
    (c.d||[]).forEach(function(r,i){
        var s=seed[i]||['','',''];
        r.splice(at,0,s[0],s[1],s[2]);
    });
})();
TC['cfg-country'].fieldOptions=Object.assign(TC['cfg-country'].fieldOptions||{},{
    '所属客服':orgCsOptions,
    '所属操作':orgOpOptions,
    '默认收货仓库':orgDomesticWarehouseOptions
});
/* 新建国家时这三项可以先空着，之后再配 */
TC['cfg-country'].requiredOverrides=Object.assign(TC['cfg-country'].requiredOverrides||{},{
    '所属客服':false,'所属操作':false,'默认收货仓库':false
});
