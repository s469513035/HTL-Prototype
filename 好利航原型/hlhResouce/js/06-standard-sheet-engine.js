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
    [['1','HTL001','深圳市好利航国际货运代理有限公司','HOLLY TRANS LIMITED','深圳市罗湖区桂园街道红村社区深南东路5002号信兴广场主楼4710','0755-82460525','樊永锋（Aphenty）、Ann（集团总经理）','是']],
    [{label:'总部编码',type:'text',field:'code'},{label:'总部名称',type:'text',field:'name'},{label:'负责人',type:'text',field:'owner'},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}]);
applyStandardSheetTable('perm-region','大区管理',
    ['序号','大区编码','大区名称','所属总部','英文名称','覆盖区域描述','负责人','负责人手机','是否启用'],
    [
        ['1','RG-CN','中国区域管理中心','集团总部','China Regional Management Center','全国（武汉/广州/义乌/宁波/佛山等分部）','Ann（中国区总经理）','13800000001','是'],
        ['2','RG-AF','非洲海外区域中心','集团总部','Africa Overseas Regional Center','塞内加尔 / 科特迪瓦 / 尼日利亚 / 加纳 / 喀麦隆','樊永锋（Aphenty，非洲区总经理）','13800000002','是']
    ],
    [{label:'大区编码',type:'text',field:'code'},{label:'大区名称',type:'text',field:'name'},{label:'所属总部',type:'text',field:'hq'},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}]);
applyStandardSheetTable('perm-branch','分公司',
    ['序号','分公司编码','分公司名称','所属总部','所属大区','英文名称','地址','电话','负责人','是否启用'],
    [
        ['1','HTL-WH001','武汉分部','集团总部','中国区域管理中心','HOLLY TRANS Wuhan Branch','武汉市江汉区泛海国际SOHO城7栋2902','027-83730477','陶靓Nancy','是'],
        ['2','HTL-GZ001','广州业务分部','集团总部','中国区域管理中心','HOLLY TRANS Guangzhou Branch','广州市越秀区好世界大厦3105-3107房','02083370786','Cathy（整柜）/ Cereus（散货）','是'],
        ['3','HTL-GZ003','广州散货操作分部','集团总部','中国区域管理中心','','广州市','020-83370700','Nora','是'],
        ['4','HTL-YW001','义乌分部','集团总部','中国区域管理中心','','浙江省义乌市','0579-85123401','Abby','是'],
        ['5','HTL-NB001','宁波分部','集团总部','中国区域管理中心','','浙江省宁波市','0574-87123401','（负责人空缺）','是'],
        ['6','HTL-SZ001','深圳总部业务客服部','集团总部','中国区域管理中心','','深圳市罗湖区信兴广场主楼4710','0755-82460525','Lee','是'],
        ['7','HTL-SN001','塞内加尔分部','集团总部','非洲海外区域中心','Senegal Branch','达喀尔 Dakar','+221-000000','Alexis','是'],
        ['8','HTL-CI001','科特迪瓦分部','集团总部','非洲海外区域中心','Cote d Ivoire Branch','阿比让 Abidjan','+225-000000','Olivia','是'],
        ['9','HTL-NG001','尼日利亚分部','集团总部','非洲海外区域中心','Nigeria Branch','拉各斯 Lagos','+234-000000','Nikon','是'],
        ['10','HTL-GH001','加纳分部','集团总部','非洲海外区域中心','Ghana Branch','阿克拉 Accra','+233-000000','Ella','是'],
        ['11','HTL-CM001','喀麦隆分部','集团总部','非洲海外区域中心','Cameroon Branch','杜阿拉 Douala','+237-000000','Drak','是']
    ],
    [{label:'分公司编码',type:'text',field:'code'},{label:'分公司名称',type:'text',field:'name'},{label:'所属大区',type:'text',field:'region'},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}]);
applyStandardSheetTable('perm-dept','部门管理',
    ['序号','部门编码','部门名称','所属总部','所属大区','所属分公司','上级部门','英文名称','部门负责人','负责人手机','部门职能描述','是否启用'],
    [
        ['1','SZ-FIN','财务部','集团总部','中国区域管理中心','深圳总部业务客服部','无','Finance Department','APPLE（业财经理）','13528775310','会计核算、预算管理、资金调配及财务分析，含分部共享财务、垂直管理海外财务','是'],
        ['2','SZ-HR','人事行政部','集团总部','中国区域管理中心','深圳总部业务客服部','无','HR & Admin Department','DAISY（人事经理）','13751137439','人事招聘、培训、绩效考核、行政事务，含全国人事共享岗与管培生统筹','是'],
        ['3','WH-BIZ','商务部','集团总部','中国区域管理中心','武汉分部','无','Commerce Department','Nancy','027-83730477','报价、商务对接、订舱协调','是'],
        ['4','WH-OPS','操作部','集团总部','中国区域管理中心','武汉分部','无','Operations Department','—','027-83730478','订单审核、订柜、EDI 推送、轨迹监控','是'],
        ['5','WH-BOOK','订舱部','集团总部','中国区域管理中心','武汉分部','无','Booking Department','—','027-83730479','订舱、配载、船期跟进','是'],
        ['6','GZ-SCS','散货客服部','集团总部','中国区域管理中心','广州业务分部','无','LCL Customer Service','Cereus','02083370786','广州散货客户跟单与客服','是'],
        ['7','YW-CS','客服部','集团总部','中国区域管理中心','义乌分部','无','Customer Service','Abby','0579-85123402','义乌分部客服','是'],
        ['8','NB-SAL','业务部','集团总部','中国区域管理中心','宁波分部','无','Sales Department','—','0574-87123402','宁波分部业务开拓与客户维护','是']
    ],
    [{label:'部门编码',type:'text',field:'code'},{label:'部门名称',type:'text',field:'name'},{label:'所属总部',type:'text',field:'hq'},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}]);
applyStandardSheetTable('perm-team','小组管理',
    ['序号','工作组编码','工作组名称','所属总部','所属大区','所属分公司','所属部门','组长','组员数（估算）','工作组职能','是否启用'],
    [
        ['1','WG-HRS','全国人事共享岗','集团总部','中国区域管理中心','深圳总部业务客服部','人事行政部','Lory','6','全国分布人事共享服务','是'],
        ['2','WG-FINS','分部共享财务组','集团总部','中国区域管理中心','深圳总部业务客服部','财务部','Sunny','5','各分部共享财务核算','是'],
        ['3','WG-LCLOP','散货操作组','集团总部','中国区域管理中心','广州散货操作分部','操作部','Nora','8','广州散货操作','是'],
        ['4','WG-WHS','佛山中心仓仓储组','集团总部','中国区域管理中心','广州业务分部','操作部','黄俊元 / Mack','10','出入库、叉车、仓储作业','是'],
        ['5','WG-CSALL','深圳全体客服组','集团总部','中国区域管理中心','深圳总部业务客服部','客服部','Fanny','6','客服跟单与轨迹维护','是'],
        ['6','WG-AFS','非洲综合支撑岗','集团总部','非洲海外区域中心','塞内加尔分部','财务部','Alexis','—','海外财务 / 本地人事 / 本地业务（垂直归属总部财务）','是']
    ],
    [{label:'工作组编码',type:'text',field:'code'},{label:'工作组名称',type:'text',field:'name'},{label:'所属部门',type:'text',field:'dept'},{label:'是否启用',type:'select',field:'enabled',options:['是','否']}]);
applyStandardSheetTable('perm-wh','仓库',
    ['序号','仓库编码','仓库名称','所属总部','所属分公司','英文名称','仓库类型','地址','邮编','面积(m²)','库容','负责人','电话','备注'],
    [
        ['1','WH-FS01','佛山全国中心仓','集团总部','广州业务分部','Foshan National Central Warehouse','自营','广东省佛山市南海区里水镇和顺科鹏路 好利航佛山仓','528000','20000','80000 件 / 2000 m³','吴真勇 / Mack','18212333193','全国中心仓，散货集散'],
        ['2','WH-YW01','义乌仓','集团总部','义乌分部','Yiwu Warehouse','自营','浙江省义乌市','322000','8000','30000 件 / 800 m³','Carl','0579-85123403','义乌收货操作仓']
    ],
    [{label:'仓库编码',type:'text',field:'code'},{label:'仓库名称',type:'text',field:'name'},{label:'所属分公司',type:'select',field:'branch',options:['武汉分部','广州业务分部','广州散货操作分部','义乌分部','宁波分部','深圳总部业务客服部']},{label:'仓库类型',type:'select',field:'type',options:['自营','外包','合作']}]);
