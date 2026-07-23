function buildStandardQueryFields(headers,query){
    const result=(query||[]).map(function(q){return Object.assign({},q);});
    return result;
}

function applyStandardSheetTable(id,title,headers,rows,query){
    if(!TC[id])TC[id]={};
    TC[id].t=title;
    TC[id].h=headers.concat(['操作']);
    TC[id].s=[];
    TC[id].d=rows.map(function(row){return row.slice();});
    TC[id].q=buildStandardQueryFields(headers,query);
    TC[id].forceLocalHeader=true;
    TC[id].minRows=200;
}

function filterTableQueryFields(id,labels){
    const c=TC[id];
    if(!c||!c.q)return;
    const removeSet={};
    (labels||[]).forEach(function(label){removeSet[label]=true;});
    c.q=c.q.filter(function(q){return !removeSet[q.label];});
}

function removeTableColumns(id,labels){
    const c=TC[id];
    if(!c||!c.h)return;
    const removeSet={};
    (labels||[]).forEach(function(label){removeSet[label]=true;});
    const removeIndexes=[];
    c.h.forEach(function(hd,idx){
        if(removeSet[hd])removeIndexes.push(idx);
    });
    if(removeIndexes.length){
        const removeIndexSet={};
        removeIndexes.forEach(function(idx){removeIndexSet[idx]=true;});
        c.h=c.h.filter(function(hd,idx){return !removeIndexSet[idx];});
        if(c.d){
            c.d=c.d.map(function(row){
                return row.filter(function(cell,idx){return !removeIndexSet[idx];});
            });
        }
    }
    filterTableQueryFields(id,labels);
}

applyStandardSheetTable('perm-hq','总部管理',
    ['序号','总部编码','总部名称','英文名称','地址','电话','负责人','是否启用'],
    [['1','HTL001','深圳市好利航国际货运代理有限公司','HOLLY TRANS LIMITED','深圳市罗湖区桂园街道红村社区深南东路5002号信兴广场主楼4710','0755-82460525','樊永锋（Aphenty）','是']],
    [{label:'总部编码',type:'text',field:'code'},{label:'总部名称',type:'text',field:'name'},{label:'负责人',type:'text',field:'owner'},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}]);
applyStandardSheetTable('perm-region','大区管理',
    ['序号','大区编码','大区名称','所属总部','英文名称','覆盖区域描述','负责人','负责人手机','是否启用'],
    [['1','RG-EC','华东大区','HQ001','East China Region','上海、江苏、浙江、安徽、江西、福建','李四','13800000001','是']],
    [{label:'大区编码',type:'text',field:'code'},{label:'大区名称',type:'text',field:'name'},{label:'所属总部',type:'text',field:'hq'},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}]);
applyStandardSheetTable('perm-branch','分公司',
    ['序号','分公司编码','分公司名称','所属总部','所属大区','英文名称','地址','电话','负责人','是否启用'],
    [
        ['1','BR-SH01','好利航上海分公司','HQ001','RG-EC','HOLLY TRANS LIMITED Shanghai Branch','上海市浦东新区...','021-87654321','王五','是'],
        ['1','HTL-GZ001','好利航广州分公司','','','','目前广州市越秀区大塘街道东照大厦1910房；预计6月中旬搬迁到广州市越秀区好世界大厦3105-3107房','02083370786','黄俊Cereus','是'],
        ['2','HTL-GZ002','好利航佛山仓','','','GUANGZHOU FIGARO INTERNATIONAL SHIPPING LIMITED','广东省佛山市南海区里水镇和顺科鹏路 好利航佛山仓','18212333193','吴真勇Mack','是'],
        ['3','HTL-WH001','好利航武汉分公司','','','HOLLY TRANS LIMITED Wuhan Branch','武汉市江汉区泛海国际SOHO城7栋2902','027-83730477','陶靓Nancy','是']
    ],
    [{label:'分公司编码',type:'text',field:'code'},{label:'分公司名称',type:'text',field:'name'},{label:'所属大区',type:'text',field:'region'},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}]);
applyStandardSheetTable('perm-dept','部门管理',
    ['序号','部门编码','部门名称','所属总部','所属大区','所属分公司','上级部门','英文名称','部门负责人','负责人手机','部门职能描述','是否启用'],
    [
        ['1','DEP-OPS','操作部','HQ001','RG-EC','BR-SH01','无','Operations Department','陈六','13800000002','整柜订单审核、订柜、EDI 推送、轨迹监控','是'],
        ['1','SZ-FIN','财务部','HTL001','','','','Finance Department','雷芳','13528775310','负责会计核算、预算管理、资金调配及财务分析，确保公司财务健康与合规。','是'],
        ['2','SZ-HR','人事行政部','HTL001','','','','Human Resources and Administration Department','卢青','13751137439','负责人事招聘、培训、绩效考核及员工关系管理；承担行政事务及公司制度落实工作。','是'],
        ['3','SZ-CS/SAL','客服/业务部','HTL001','','','','Sales Department','李培森','13713785386','负责市场开拓、客户维护、销售目标达成及业务策略制定。','是']
    ],
    [{label:'部门编码',type:'text',field:'code'},{label:'部门名称',type:'text',field:'name'},{label:'所属总部',type:'text',field:'hq'},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}]);
applyStandardSheetTable('perm-team','小组管理',
    ['序号','工作组编码','工作组名称','所属总部','所属大区','所属分公司','所属部门','组长','组员数（估算）','工作组职能','是否启用'],
    [['1','WG-CS01','客服一组','HQ001','RG-EC','BR-SH01','DEP-CS','赵七','5','负责欧洲线客户的跟单与轨迹维护','是']],
    [{label:'工作组编码',type:'text',field:'code'},{label:'工作组名称',type:'text',field:'name'},{label:'所属部门',type:'text',field:'dept'},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}]);
applyStandardSheetTable('perm-wh','仓库',
    ['序号','仓库编码','仓库名称','所属总部','所属分公司','英文名称','仓库类型','地址','邮编','面积(m²)','库容','负责人','电话','备注'],
    [['1','WH-SH01','上海浦东仓','HQ001','BR-SH01','Shanghai Pudong Warehouse','自营','上海市浦东新区祝桥镇 XX 路 XX 号','201202','5000','30000 件 / 800 m³','孙八','021-58000000','支持冷藏货物（-18℃ ~ 4℃）']],
    [{label:'仓库编码',type:'text',field:'code'},{label:'仓库名称',type:'text',field:'name'},{label:'所属分公司',type:'select',field:'branch',options:['BR-SH01','HTL-GZ001','HTL-GZ002','HTL-WH001']},{label:'仓库类型',type:'select',field:'type',options:['自营','外包','合作']}]);
