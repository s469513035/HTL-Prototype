function findMenuPath(tabId){
    function walk(items,path){
        for(const item of items){
            const label=langText(item.langKey,item.label);
            const next=path.concat(label);
            if(item.id===tabId)return next;
            if(item.children){
                const found=walk(item.children,next);
                if(found)return found;
            }
        }
        return null;
    }
    return walk(menuData,[])||[findMenuLabel(tabId)];
}

function queryTypeName(type){
    if(type==='select')return tr('下拉选择');
    if(type==='date')return tr('日期选择');
    if(type==='datetime-local')return tr('日期时间');
    if(type==='number')return tr('数字输入');
    return tr('文本输入');
}

function fieldRequirementDescription(field){
    const f=String(field||'');
    if(f.includes('操作'))return '展示当前记录可执行动作入口，包含查看、编辑、删除或业务处理按钮；需要依据权限、状态和当前勾选数据控制可用性。';
    if(f.includes('状态'))return '展示当前业务生命周期状态，需与状态筛选、状态标签和操作按钮联动；状态变化后应即时刷新列表、详情和统计数量。';
    if(f.includes('编号')||f.includes('单号')||f.includes('代码')||f.includes('编码'))return '作为业务唯一标识，新增时系统自动生成，详情和列表保持一致；不允许人工重复录入，编辑状态下通常只读。';
    if(f.includes('客户'))return '关联客户主数据，需支持输入检索、客户简称/全称识别，并在详情、账期、报价和权限数据范围中保持一致。';
    if(f.includes('时间')||f.includes('日期'))return '用于记录业务发生、创建、审核、生效或预约节点，需支持标准日期格式，列表排序和查询筛选都应基于该字段。';
    if(f.includes('金额')||f.includes('费用')||f.includes('价格')||f.includes('成本')||f.includes('运费'))return '金额类字段需保留币种、精度和汇总规则；列表底部应参与合计，详情中需保留原始币种和换算依据。';
    if(f.includes('重量')||f.includes('体积')||f.includes('件数')||f.includes('数量'))return '数量类字段需校验为非负数，支持列表汇总；涉及计费时要与产品取重、体积重、费用试算规则联动。';
    if(f.includes('起运')||f.includes('目的')||f.includes('港')||f.includes('仓库')||f.includes('路线'))return '线路/地点类字段需来自基础配置，支持港口、机场、仓库和国家区域的统一维护，并影响渠道、报价和操作流程。';
    if(f.includes('人员')||f.includes('创建人')||f.includes('操作人')||f.includes('审核人')||f.includes('业务员'))return '人员类字段需关联组织架构与权限，支持按本人、部门、网点或大区维度查询和数据隔离。';
    return '普通业务字段，用于支撑列表展示、详情查看、新增编辑和查询筛选；需保持命名、表单校验、导出字段和多语言文案一致。';
}

function buildDetailedListRequirementDoc(tabId,c,menuPath){
    const L=_lang[_currentLang];
    const headers=(c.h||[]).slice(0,-1);
    const actions=getToolbarActions(tabId).map(a=>tr(a.label));
    const statusList=(c.s||[]).map(s=>(_statusLangMap[s]&&L[_statusLangMap[s]])?L[_statusLangMap[s]]:tr(s));
    let doc='';
    doc+='='.repeat(80)+'\n';
    doc+='【'+tr(c.t||findMenuLabel(tabId))+'】界面需求说明书\n';
    doc+='='.repeat(80)+'\n\n';
    doc+='一、界面定位\n';
    doc+='1. 菜单路径：'+menuPath.join(' > ')+'\n';
    doc+='2. 页面类型：列表管理页，面向日常业务查询、数据维护、审批处理、导出分析和状态追踪。\n';
    doc+='3. 核心目标：让业务人员在同一个界面完成“筛选数据、查看列表、处理单条或批量业务、查看详情、维护数据、追踪状态”的完整闭环。\n';
    doc+='4. 适用角色：管理员、业务员、客服、操作、仓库、财务或配置维护人员；具体可见数据由组织、角色、部门、网点和数据权限决定。\n\n';
    doc+='二、页面布局与交互结构\n';
    doc+='1. 顶部查询区：默认展示首行核心查询条件；“更多筛选/重置”固定在查询条件右侧，展开更多条件后按钮位置保持稳定。\n';
    doc+='2. 功能按钮区：位于查询区下方并尽量压缩垂直留白，按钮宽度保持统一；超长按钮允许设置独立宽度，避免文字拥挤。\n';
    doc+='3. 状态标签区：存在状态枚举时展示“全部 + 各状态”标签，并显示每个状态的数据数量。\n';
    doc+='4. 表格区：支持横向滚动、表头拖拽排序、列宽调整、列筛选、行勾选、状态徽标展示。\n';
    doc+='5. 分页与汇总区：显示总条数、每页条数、页码跳转；列表底部固定显示每列统计，纵向滚动时不跟随滚动离开视图。\n';
    doc+='6. 列表设置区：支持通过弹窗选择显示哪些查询条件、每行展示多少查询条件，以及显示哪些列表字段。\n';
    doc+='7. 弹窗区：新增、编辑、查看、审核、导出、启用、禁用、同步、需求说明、功能说明等操作均需有弹窗或明确提示，避免无反馈。\n\n';
    doc+='三、查询条件详细说明\n';
    if(c.q&&c.q.length){
        c.q.forEach((q,i)=>{
            const opts=(q.options||(q.field==='status'?c.s:null));
            doc+=(i+1)+'. '+tr(q.label)+'：'+queryTypeName(q.type)+'；字段标识：'+(q.field||'未配置')+'。\n';
            doc+='   - 业务用途：用于缩小当前列表数据范围，支持与其他查询条件组合检索。\n';
            doc+='   - 交互要求：输入框需支持一键清空；下拉框需提供“全部”选项；日期类字段需使用标准日期控件。\n';
            doc+='   - 查询规则：空值表示不限制该条件；多个条件同时填写时按 AND 逻辑过滤。\n';
            if(opts&&opts.length)doc+='   - 可选值：'+opts.map(tr).join('、')+'。\n';
        });
    }else{
        doc+='1. 当前界面无专属查询条件，默认提供全局关键字搜索和状态筛选能力。\n';
        doc+='2. 后续新增任何查询条件时，必须同步配置字段名称、控件类型、占位提示、重置逻辑和多语言文案。\n';
    }
    doc+='\n四、列表表头与字段说明\n';
    headers.forEach((hd,i)=>{
        doc+=(i+1)+'. '+tr(hd)+'\n';
        doc+='   - 字段定位：'+fieldRequirementDescription(hd)+'\n';
        doc+='   - 列表表现：默认单行显示，超长内容省略并在鼠标悬停时通过 title 查看完整值。\n';
        doc+='   - 导出要求：字段应随导出数据一起输出，导出列名与当前语言保持一致。\n';
    });
    doc+='\n五、状态与生命周期\n';
    if(statusList.length){
        statusList.forEach((s,i)=>{
            doc+=(i+1)+'. '+s+'：用于表示当前记录在业务流程中的阶段；状态应影响可执行按钮、统计数量和后续流转入口。\n';
        });
    }else{
        doc+='1. 当前界面未配置状态枚举，但仍需保留扩展能力；后续增加状态后应自动生成状态标签和状态筛选。\n';
    }
    doc+='\n六、功能按钮与弹窗要求\n';
    actions.forEach((a,i)=>{
        doc+=(i+1)+'. '+a+'\n';
        doc+='   - 点击后必须打开弹窗，不允许无反馈。\n';
        doc+='   - 弹窗标题需包含操作名称和当前模块名称，字段根据当前业务语义自动生成。\n';
        doc+='   - 对需要勾选数据的操作，未勾选时必须弹出提示，说明需要先选择数据。\n';
        doc+='   - 成功确认后显示操作成功提示，并保留后续接入真实接口的扩展位。\n';
    });
    doc+='\n七、新增、编辑、查看详情\n';
    doc+='1. 新增弹窗：根据表头字段自动生成表单，编号/代码字段自动递增，状态字段下拉选择，日期字段使用日期控件。\n';
    doc+='2. 编辑弹窗：带入当前行数据，编号类字段只读，其他字段可按权限编辑；保存后提示成功。\n';
    doc+='3. 查看弹窗：以只读详情形式展示字段和值，状态字段使用彩色徽标，空值用横线占位。\n';
    doc+='4. 字段校验：必填、数字、日期、下拉枚举、只读字段需有清晰的校验和视觉反馈。\n\n';
    doc+='八、数据权限与安全要求\n';
    doc+='1. 列表数据需支持按本人、本部门、本大区、全公司等范围隔离。\n';
    doc+='2. 操作按钮需受角色权限控制，例如查看、编辑、审核、导出、启用、禁用可分别授权。\n';
    doc+='3. 删除、禁用、审核等高风险操作需二次确认并保留操作原因。\n';
    doc+='4. 所有操作需记录操作人、操作时间、操作前后内容和来源页面，便于审计追踪。\n\n';
    doc+='九、多语言与扩展要求\n';
    doc+='1. 菜单、查询条件、功能按钮、表头、状态、弹窗标题、字段标签、提示语均需进入多语言体系。\n';
    doc+='2. 后续新增任何查询、按钮、表头、菜单、状态和弹窗字段时，必须同步维护中文、英文、法文、葡萄牙文文案。\n';
    doc+='3. 切换语言无需刷新页面，当前打开的标签页、弹窗、列表和输入清空按钮提示都应实时更新。\n\n';
    doc+='十、验收清单\n';
    doc+='1. 查询、重置、更多筛选、状态筛选、分页、列筛选、表头拖拽、列宽调整均可正常使用。\n';
    doc+='2. 每个输入框都具备一键清空能力，动态新增输入框也自动生效。\n';
    doc+='3. 所有功能按钮点击都有弹窗反馈，且弹窗内容与当前模块业务含义一致。\n';
    doc+='4. 中文、英文、法文、葡萄牙文切换后，菜单、查询条件、按钮、表头、弹窗主要文案同步切换。\n';
    doc+='5. 列表数值字段汇总准确，状态数量与筛选结果一致。\n';
    return doc;
}

function buildShipmentEntryRequirementDoc(menuPath,pageMode){
    const isAdmin=pageMode==='shipmentEntryAdmin'||menuPath.join(' > ').includes('运单管理');
    let doc='';
    doc+='='.repeat(80)+'\n';
    doc+=(isAdmin?'【运单管理-下单录入】':'【专线下单录入】')+'界面需求说明书\n';
    doc+='='.repeat(80)+'\n\n';
    doc+='一、界面定位\n';
    doc+='1. 菜单路径：'+menuPath.join(' > ')+'\n';
    doc+='2. 页面类型：录入型业务页面，不展示历史列表，重点服务于业务人员新建专线运单预报。\n';
    doc+='3. 核心目标：一次性录入'+(isAdmin?'客户代码、':'')+'物流单号、运输方式、仓库、目的港、件数、体积、重量、品名、物流公司、附加服务、费用预估和入仓要求。\n';
    doc+='4. 页面状态：默认单号为系统生成的草稿单号，初始状态为“待提交”；提交后进入客服初审、仓库确认、财务确认等后续节点。\n\n';
    doc+='二、基础信息区域\n';
    (isAdmin?['物流单号','运输方式','客户代码','国内仓库','目的港','物流公司','品名']:['物流单号','运输方式','国内仓库','目的港','物流公司','品名']).forEach((f,i)=>{
        doc+=(i+1)+'. '+f+'：必填字段，作为生成专线预报的主数据基础；需支持输入清空、下拉选择或基础资料带入。\n';
    });
    doc+=(isAdmin?'8. 管理端下单录入保留客户代码输入框，默认带出一条客户代码，便于客服、业务或操作人员代客户建单时直接维护客户编码。\n':'7. 客户端下单录入不展示客户代码输入框，客户信息由登录账号或后续客户选择逻辑带出。\n');
    doc+=(isAdmin?'9':'8')+'. 货物明细区域已取消，件数、总体积、总重量和品名在基础信息区直接维护。\n\n';
    doc+='三、基础数据录入要求\n';
    doc+='1. 运输方式放在物流单号右侧，便于录入时优先确认运单和运输口径。\n';
    doc+='2. 件数、总体积(CBM)、总重量(KG)为数字输入，必须为非负数。\n';
    doc+='3. 品名输入框用于维护当前订单品名信息，后续可联动品名库和品名大类。\n';
    doc+='4. 产品渠道说明以文本提示框展示，费用预估和入仓要求以整行提示区展示。\n\n';
    doc+='四、汇总与费用预估\n';
    doc+='1. 费用预估卡片同步展示预计重量、预计体积和参考运费。\n';
    doc+='3. 当前原型参考运费为演示计算，后续接入真实系统时需改为产品报价、重量段、体积重、附加费和客户价格规则综合试算。\n\n';
    doc+='五、运输及预约信息\n';
    doc+='1. 运输方式：支持海运、空运、铁路、快递；不同方式会影响时效、费用和入仓规则。\n';
    doc+='2. 发货人电话：用于仓库预约、异常沟通、到仓通知。\n';
    doc+='3. 预计送货时间：用于仓库排班和预约窗口判断。\n';
    doc+='4. 发货人电话、预计送货时间：用于仓库预约、异常沟通和到仓通知。\n\n';
    doc+='六、附加服务\n';
    doc+='1. 支持报关、合并报关、拆分报关、带电、带磁、贴箱唛等复选项。\n';
    doc+='2. 勾选后应进入仓库作业要求，影响仓库操作、费用附加项和异常登记。\n\n';
    doc+='七、底部操作按钮\n';
    doc+='1. 所有主操作按钮统一放在页面底部，避免业务人员在录入较长表格时误操作顶部按钮。\n';
    doc+='2. 提交预报：校验基础信息和附加服务，打开提交弹窗，选择审核节点并填写提交备注。\n';
    doc+='3. 保存草稿：保存当前录入内容，允许后续继续编辑。\n';
    doc+='4. 附件上传：上传报关资料、商业发票、装箱单、货物照片等附件。\n';
    doc+='5. 重置：清空或恢复当前录入内容，需通过弹窗确认重置范围。\n\n';
    doc+='八、字段校验规则\n';
    doc+='1. 国内仓库、目的港、物流公司、品名等关键字段提交预报前必须完成校验。\n';
    doc+='2. 件数、总体积、总重量必须为非负数；允许小数的字段需保留合理精度，避免输入负数或非数字字符。\n';
    doc+='3. 体积(CBM)与重量(KG)需按业务规则保留小数位，后续接入真实计费规则。\n';
    doc+='5. 敏感货、危险品、带电货、仿牌货应触发风险提示，后续需联动渠道可用性、报关资料和仓库操作要求。\n';
    doc+='6. 预计送货时间不能早于当前时间；如早于当前时间，应提示业务人员重新选择预约时间。\n';
    doc+='7. 发货人电话需支持手机号或固定电话格式；格式错误时应给出明确提示。\n\n';
    doc+='九、业务流程说明\n';
    doc+='1. 业务员进入专线下单页面，系统生成临时草稿单号。\n';
    doc+='2. 业务员录入'+(isAdmin?'客户代码、':'')+'物流单号、运输方式、仓库、目的港、件数、体积、重量、品名和物流公司等基础资料。\n';
    doc+='3. 业务员查看产品渠道说明、费用预估和入仓要求。\n';
    doc+='4. 如有报关、合并报关、拆分报关、带电、带磁或贴箱唛要求，业务员在附加服务中勾选，并同步到仓库作业要求。\n';
    doc+='6. 业务员可先保存草稿，待资料完整后再提交预报。\n';
    doc+='7. 提交预报后进入审核节点，客服检查客户与资料，仓库检查预约和入仓要求，财务检查费用和账期。\n';
    doc+='8. 审核通过后，数据进入入仓预约、入仓扫描、理货、上托、出库等后续流程。\n\n';
    doc+='十、附件与资料要求\n';
    doc+='1. 报关场景必须支持上传商业发票、装箱单、报关委托书和必要的品名说明。\n';
    doc+='2. 敏感货、带电货和危险品应支持上传 MSDS、鉴定报告、图片资料和客户声明。\n';
    doc+='3. 附件上传弹窗需记录附件类型、附件说明、上传人、上传时间和关联单号。\n';
    doc+='4. 删除附件需二次确认，避免误删关键报关资料。\n';
    doc+='5. 附件列表后续应支持预览、下载、替换、版本记录和上传失败重试。\n\n';
    doc+='十一、异常场景与处理\n';
    doc+='1. 客户信息不存在：提示选择有效客户，并可跳转客户管理新增或维护客户资料。\n';
    doc+='2. 目的港或物流公司不匹配：提示当前基础资料组合不可用，要求重新选择目的港或物流公司。\n';
    doc+='3. 品名或附加服务存在高风险属性：提示需要补充资料，并在提交预报时带入审核说明。\n';
    doc+='4. 货物体积异常偏大：提示业务员检查总体积录入口径，避免单位录入错误。\n';
    doc+='5. 总重量或总体积超过渠道限制：提示超限，并建议切换渠道、拆分运单或走特殊审批。\n';
    doc+='6. 保存草稿失败：保留当前页面录入内容，并提示重新保存，避免用户数据丢失。\n\n';
    doc+='十二、权限与审计\n';
    doc+='1. 新建专线下单权限应独立控制，未授权用户不可进入录入页面或不可点击提交按钮。\n';
    doc+='2. 保存草稿、提交预报、附件上传、重置操作都应记录操作日志。\n';
    doc+='3. 提交后再次编辑应受状态限制；已进入仓库或财务确认后的订单应限制关键字段修改。\n';
    doc+='4. 管理员可查看全部草稿和已提交数据，业务员默认仅查看本人或所属部门创建的数据。\n';
    doc+='5. 操作日志需记录修改前后差异，尤其是品名、货物类型、件数、重量、尺寸和渠道。\n\n';
    doc+='十三、后续接口与数据落库建议\n';
    doc+='1. 主表保存'+(isAdmin?'客户代码、':'')+'物流单号、客户、仓库、目的港、渠道、物流公司、运输方式、件数、重量、体积、品名、预约时间和当前状态。\n';
    doc+='2. 附加服务表保存报关、合并报关、拆分报关、带电、带磁、贴箱唛等服务勾选结果。\n';
    doc+='3. 附件表保存附件类型、文件地址、文件大小、上传人、上传时间和业务单号。\n';
    doc+='4. 提交接口需同时校验主表、附加服务、附件资料和渠道规则，任何一项失败都应返回明确错误信息。\n';
    doc+='5. 草稿接口可允许部分字段为空，但必须保存当前已录入内容，便于下次继续编辑。\n\n';
    doc+='十四、多语言要求\n';
    doc+='1. 页面标题、基础信息、附加服务、底部按钮、弹窗标题、字段标签、校验提示都必须支持中文、英文、法文、葡萄牙文切换。\n';
    doc+='2. 切换语言后无需刷新页面，当前表单、提示区和底部按钮文案应立即更新。\n\n';
    doc+='十五、页面交互细节\n';
    doc+='1. 每个输入框聚焦或有值时展示清空按钮，点击后仅清空当前输入，不影响其他字段。\n';
    doc+='2. 运输方式放在物流单号右侧，录入顺序保持紧凑。\n';
    doc+='3. 附加服务红色感叹号鼠标移入展示收费标准和资料要求。\n';
    doc+='4. 底部操作按钮在页面滚动到底部时保持清晰可见，按钮顺序为：提交预报、保存草稿、重置。\n';
    doc+='5. 费用预估区读取件数、重量、体积字段用于后续费用试算扩展。\n\n';
    doc+='十六、状态机说明\n';
    doc+='1. 待提交：草稿或新建状态，允许编辑全部基础信息、运输信息和附加服务。\n';
    doc+='2. 已提交：业务员已提交预报，允许查看，不允许随意修改关键货物字段。\n';
    doc+='3. 客服初审：客服检查客户资料、报关资料和渠道匹配情况。\n';
    doc+='4. 仓库确认：仓库确认预计送货时间、入仓要求和附加服务作业要求。\n';
    doc+='5. 财务确认：财务检查客户账期、费用试算、附加费和是否超信用额度。\n';
    doc+='6. 已确认：下单预报进入后续入仓和运单管理流程。\n';
    doc+='7. 已取消：业务终止，不再允许提交、编辑和附件变更，仅保留查看和日志追溯。\n\n';
    doc+='十七、数据结构建议\n';
    doc+='1. order_header：保存单号、客户、仓库、目的港、渠道、物流公司、运输方式、件数、重量、体积、品名、状态、创建人、创建时间。\n';
    doc+='2. order_service_requirement：保存报关、合并报关、拆分报关、带电、带磁、贴箱唛等布尔要求。\n';
    doc+='3. order_attachment：保存附件类型、文件名、文件地址、上传人、上传时间、版本号。\n';
    doc+='4. order_audit_log：保存每次提交、审核、退回、修改、取消的操作人、时间、意见和字段差异。\n\n';
    doc+='十八、边界条件\n';
    doc+='1. 件数、重量、体积为空或 0 时，不应产生 NaN。\n';
    doc+='2. 品名为空时应提示补充，不允许直接提交正式预报。\n';
    doc+='3. 复制粘贴长文本到品名或备注时，表单不能撑破布局。\n';
    doc+='4. 语言切换时，应保留当前录入值，不因重新渲染造成业务数据丢失；正式系统中需使用状态缓存或表单模型管理。\n\n';
    doc+='十九、验收清单\n';
    doc+=(isAdmin?'1. 管理端页面展示客户代码输入框，默认带出客户代码；客户端页面不受该字段影响。\n':'1. 页面不展示客户代码输入框和货物明细区域。\n');
    doc+='2. 运输方式输入框位于物流单号右侧。\n';
    doc+='3. 主操作按钮位于页面最底部。\n';
    doc+='4. 所有输入框均支持一键清空。\n';
    doc+='5. 多语言切换后，按钮、弹窗和主要标签同步切换。\n';
    doc+='6. 保存草稿、提交预报、附件上传、重置均打开弹窗并展示符合业务含义的字段。\n';
    doc+='7. 非法数字、缺少必填字段、危险品缺资料等异常情况均能给出明确提示。\n';
    doc+='8. 草稿保存后再次进入页面能完整恢复基础信息、附件和其他要求。\n';
    doc+='9. 提交预报后，后续节点能读取到完整的主表和附加服务数据。\n';
    return doc;
}

function buildWarehouseInboundRequirementDoc(menuPath){
    let doc='';
    doc+='='.repeat(80)+'\n';
    doc+='【入仓操作】界面需求说明书\n';
    doc+='='.repeat(80)+'\n\n';
    const isMulti=menuPath.join(' > ').includes('一票多件');
    if(isMulti){
        doc+='一、界面定位\n';
        doc+='1. 菜单路径：'+menuPath.join(' > ')+'\n';
        doc+='2. 页面类型：一票多件入仓收货操作台。\n';
        doc+='3. 主题风格：蓝白色，左右双栏布局，左侧维护基础信息和尺寸维护，右侧维护收货尺寸和托盘绑定。\n';
        doc+='4. 核心目标：仓库人员在同一页面完成多子单、多尺寸、多重量的收货录入、运输方式确认、附加服务确认和托盘绑定。\n\n';
        doc+='二、基础信息字段\n';
        ['运单号','到货时间','运输方式','客户/业务员','库位库区','勾选同步生成运单','预报件数','包装类型','品名大类','品名','内部备注'].forEach(function(f,i){
            doc+=(i+1)+'. '+f+'：'+fieldRequirementDescription(f)+'\n';
        });
        doc+='12. 勾选同步生成运单后，运单号输入框置灰不可录入，由系统保存时生成。\n';
        doc+='13. 品名输入框占位提示为“输入品名信息带出大类”，输入常用品名后自动带出品名大类。\n';
        doc+='14. 附加服务包含报关、合并报关、拆分报关、带电、带磁、贴箱唛；文字后显示红色感叹号，鼠标移入展示收费标准和要求。\n\n';
        doc+='三、尺寸维护字段\n';
        doc+='1. 重量选择：单件重/总重量单选，用于区分表格重量录入口径。\n';
        doc+='2. 维护总件数：展示或录入当前维护维度的总件数。\n';
        doc+='3. 尺寸维护表格字段：序号、单件/总重量（KG）、件数、长、宽、高。\n';
        doc+='4. 表格底部提供新增、删除、清空、表格高度设置，默认高度300PX。\n\n';
        doc+='四、收货尺寸字段\n';
        doc+='1. 汇总字段：总件数、总实重、总立方，随表格录入实时统计。\n';
        doc+='2. 收货尺寸表格字段：序号、子单号、重量（KG）、长、宽、高。\n';
        doc+='3. 表格底部提供新增、删除、清空、表格高度设置，默认高度300PX。\n\n';
        doc+='五、同步绑定托盘\n';
        doc+='1. 托盘号输入框：支持扫码或手工输入托盘号，回车可确认。\n';
        doc+='2. 绑定按钮：点击后提示绑定成功，正式系统需写入托盘绑定记录。\n';
        doc+='3. 页面提示：不建议在PC端上操作，PDA支持扫码登记。\n\n';
        doc+='六、功能按钮\n';
        doc+='1. 一键填充：根据已维护尺寸和件数快速填充表格数据。\n';
        doc+='2. 按客户预报收货：按客户预报尺寸、重量和件数生成收货维护数据。\n';
        doc+='3. 新增/删除/清空：维护尺寸表格和收货尺寸表格的行数据。\n';
        doc+='4. 新增子单：新增一行子单号、重量和长宽高记录。\n';
        doc+='5. 确认提交：提交当前收货尺寸中的有效子单数据。\n';
        doc+='6. 确认提交并删除：提交有效子单数据，并删除空重量或无效重量的子单行。\n';
        doc+='7. 保存入仓：保存当前一票多件入仓数据，保存后提示是否打印入仓单。\n';
        doc+='8. 异常登记：登记尺寸、重量、少件、破损、资料缺失等异常信息。\n';
        doc+='9. 重置：重置当前页面录入内容。\n\n';
        doc+='七、必填和校验\n';
        doc+='1. 运单号、运输方式、到货时间、品名为关键字段，新增或提交时应进行必填校验；勾选同步生成运单时运单号不校验人工输入。\n';
        doc+='2. 重量、件数、长、宽、高必须为非负数字，不能出现NaN或负数。\n';
        doc+='3. 一票多件页面不展示入仓件数输入框，件数通过预报件数、维护总件数和尺寸表格维护。\n';
        doc+='4. 提交时至少需要存在一条有效收货尺寸或一条有效尺寸维护记录。\n\n';
        doc+='八、验收清单\n';
        doc+='1. 页面打开后为蓝白色双栏操作台，左右栏高度和间距适配桌面宽屏。\n';
        doc+='2. 基础信息、尺寸维护、收货尺寸、同步绑定托盘四个区域均可见。\n';
        doc+='3. 页面不展示图片凭证区域。\n';
        doc+='4. 附加服务红色感叹号鼠标移入有收费标准和要求提示。\n';
        doc+='5. 新增子单、确认提交、确认提交并删除、绑定、保存入仓、异常登记和重置均有明确反馈。\n';
        doc+='6. 品名输入“电子、服装、五金、食品、护肤”等关键词后可自动带出对应品名大类。\n';
        return doc;
    }
    doc+='一、界面定位\n';
    doc+='1. 菜单路径：'+menuPath.join(' > ')+'\n';
    doc+='2. 页面类型：收货录入页，顶部按极速收货、二次收货、无预报收货切换。\n';
    doc+='3. 核心目标：仓库人员根据预报信息录入到货资料、货物明细、实际尺寸重量和附加服务。\n\n';
    doc+='二、左侧录入区\n';
    ['入仓单号','所属客户','所属业务员','到货仓库','到货货区','目的港','物流公司','是否报关','运输方式','快递单号','发货人电话','预计送货时间','到货时间'].forEach((f,i)=>{
        doc+=(i+1)+'. '+f+'：'+fieldRequirementDescription(f)+'\n';
    });
    doc+='\n三、货物明细区\n';
    doc+='1. 明细表展示品名、货物类型、件数、单件重量、长宽高、体积、是否仿牌和备注。\n';
    doc+='2. 横向字段较多时表格底部提供滚动条，表头按字段内容保持合理宽度。\n';
    doc+='3. 品名取值来自品名库，未命中品名库时可自动补入品名库。\n\n';
    doc+='四、功能按钮\n';
    doc+='1. 保存入仓：保存左侧录入结果，写入入仓状态和复核备注。\n';
    doc+='2. 打印标签：选择标签模板、打印份数和打印机，生成货物标签。\n';
    doc+='3. 异常登记：登记尺寸异常、重量异常、破损、少件、超大超长、资料缺失等问题。\n';
    doc+='4. 重置：清空当前录入内容或恢复默认值。\n';
    doc+='5. 刷新数据：同步当前收货页面最新状态。\n\n';
    doc+='五、验收清单\n';
    doc+='1. 左侧所有输入框支持一键清空。\n';
    doc+='2. 保存、打印、异常、重置、刷新均有弹窗反馈。\n';
    doc+='3. 到货时间默认当前时间并精确到秒，到货仓库默认当前登录账号所属仓库且可切换。\n';
    doc+='4. 多语言切换后，字段、按钮、状态和表头同步更新。\n';
    doc+='\n六、字段校验与业务规则\n';
    doc+='1. 入仓单号为只读字段，来自专线预报或仓库预约，不允许手工改写。\n';
    doc+='2. 长宽高、重量等数字字段必须为非负数字；保存时需要重新计算尺寸字符串和体积。\n';
    doc+='3. 货物类型影响标签打印模板、库位建议、异常提醒和后续费用附加项。\n';
    doc+='4. 是否超大超长为“是”时，应提示仓库选择特殊库位并可能触发叉车、加固、二次包装等要求。\n';
    doc+='5. 有预报入仓时需按预报信息核对货物明细；无预报场景转入无头件登记和认领流程。\n\n';
    doc+='七、异常与追踪\n';
    doc+='1. 尺寸异常：实际尺寸与预报尺寸差异超过阈值时登记异常，并保留复核记录。\n';
    doc+='2. 重量异常：实际重量与预报重量差异超过阈值时提示复核，必要时通知客服和客户确认。\n';
    doc+='3. 少件/多件：货物明细件数与预报件数不一致时，需在右侧明细中突出显示并允许异常登记。\n';
    doc+='4. 破损：支持上传破损照片，记录责任方和处理意见。\n';
    doc+='5. 资料缺失：提示补充报关或入仓资料，阻止进入下一节点。\n\n';
    doc+='八、权限与审计\n';
    doc+='1. 仓库操作员可录入尺寸重量并保存入仓；仓库主管可复核异常和修改关键字段。\n';
    doc+='2. 打印标签、异常登记、刷新数据、重置表单应记录操作人和操作时间。\n';
    doc+='3. 修改重量、尺寸、件数等关键字段应记录修改前后值，便于后续财务计费和客户争议追溯。\n';
    doc+='\n九、页面交互细节\n';
    doc+='1. 左侧表单与右侧展示区应并排展示，保证录入时能同步参考已扫描货物状态。\n';
    doc+='2. 输入长宽高后，正式系统应自动生成尺寸字符串，并可进一步计算总体积。\n';
    doc+='3. 保存入仓后，右侧“已入仓”数量、总重量、总体积和明细状态应立即刷新。\n';
    doc+='4. 刷新数据按钮应只刷新右侧展示区，不清空左侧未保存录入内容。\n';
    doc+='5. 异常登记弹窗应支持填写异常类型、责任方、异常说明，并预留上传照片能力。\n';
    doc+='6. 打印标签应支持标准货物标签、托盘标签、装包袋标签，不同模板展示不同字段。\n\n';
    doc+='十、状态机说明\n';
    doc+='1. 待入仓：客户或业务已预报，仓库尚未扫描或录入实际数据。\n';
    doc+='2. 已扫描：货物已扫码，系统记录扫描人、扫描时间和基础件数。\n';
    doc+='3. 复核中：尺寸、重量或件数存在差异，需要仓库主管复核。\n';
    doc+='4. 已入仓：确认实际货物入库完成，可进入理货、上托、配舱等后续流程。\n';
    doc+='5. 异常：少件、破损、资料缺失、尺寸重量异常等情况，需要异常处理闭环。\n\n';
    doc+='十一、数据结构建议\n';
    doc+='1. inbound_header：保存入仓单号、客户代号、仓库、预报件数和当前状态。\n';
    doc+='2. inbound_detail：保存品名、尺寸、重量、件数、货物类型、附加服务、扫描状态。\n';
    doc+='3. inbound_exception：保存异常类型、责任方、说明、照片、处理人、处理结果。\n';
    doc+='4. label_print_log：保存标签模板、打印份数、打印机、打印人、打印时间。\n';
    doc+='5. stock_location_log：保存库位建议、实际库位、上架人、上架时间。\n\n';
    doc+='十二、验收补充\n';
    doc+='1. 货物明细变化后右侧进度指标正确更新。\n';
    doc+='2. 超大超长货物能触发特殊库位建议。\n';
    doc+='3. 异常登记后对应明细状态可变更为异常或复核中。\n';
    doc+='4. 标签打印弹窗能展示模板、打印份数和打印机。\n';
    doc+='5. 多语言切换后，左侧字段、右侧表头、按钮、状态和弹窗均同步切换。\n';
    return doc;
}

function buildWarehousePdaRequirementDoc(menuPath){
    let doc='';
    doc+='='.repeat(80)+'\n';
    doc+='【仓库PDA】界面需求说明书\n';
    doc+='='.repeat(80)+'\n\n';
    doc+='一、界面定位\n';
    doc+='1. 菜单路径：'+menuPath.join(' > ')+'\n';
    doc+='2. 页面类型：移动端 APP 原型页面，用于仓库现场扫码、拍照、入仓、调拨、出库、上托、查货、问题件和空运作业。\n';
    doc+='3. 主题风格：与主系统保持蓝白主题，手机端界面展示登录、消息、工作台、个人中心。\n\n';
    doc+='二、登录与个人中心\n';
    doc+='1. PDA登录字段包含账号、密码、所属仓库。\n';
    doc+='2. 登录按钮点击后给出明确登录成功提示。\n';
    doc+='3. 个人中心展示当前账号、所属仓库和退出登录入口。\n\n';
    doc+='三、工作台能力\n';
    doc+='1. 工作台同步国内操作菜单下全部功能入口，包含国内操作所有叶子菜单：入仓一票一件、入仓一票多件、无头件、无头件认领、调拨入库、调拨出库、调拨费用查询、扫描出库、上托管理、装箱单规则、查货、预载、补货落货、问题件、空运分拣、空运装袋、空运装箱单。\n';
    doc+='2. 点击工作台功能卡片后，在PDA手机壳内打开移动端适配功能页，不跳转PC端列表页面。\n';
    doc+='3. 每个PDA功能页按现场作业设计移动端字段、扫码入口、拍照上传、卡片式记录和底部确认按钮。\n';
    doc+='4. 消息区展示调拨入库、扫描出库、问题件等待处理提醒。\n\n';
    doc+='四、多语言要求\n';
    doc+='1. PDA页面支持中文、英文、法文、葡萄牙语切换。\n';
    doc+='2. 语言按钮点击后应实时切换PDA页面和主系统当前打开页面文案。\n\n';
    doc+='五、权限要求\n';
    doc+='1. 角色管理需包含仓库PDA操作员、国内仓库主管等移动端角色。\n';
    doc+='2. PDA入口需纳入菜单权限、按钮权限和数据权限配置。\n';
    doc+='3. PDA操作需记录操作人、仓库、设备来源、操作时间和业务单号。\n';
    return doc;
}

function buildInquiryQuoteRequirementDoc(menuPath){
    let doc='';
    doc+='一、页面定位\n';
    doc+='1. 页面名称：询价报价录入。\n';
    doc+='2. 所属菜单：'+menuPath+'。\n';
    doc+='3. 页面目标：用于维护客户询价和内部报价所需的基础报价口径，形成可提交、可保存草稿、可追溯的报价录入数据。\n\n';
    doc+='二、字段说明\n';
    (TC['prod-inquiry-quote'].entryFields||[]).forEach(function(f,i){
        doc+=(i+1)+'. '+f.label+'：'+(f.required?'必填':'非必填')+'；控件类型为'+(f.type||'text')+'；'+(f.options?'候选值包括 '+f.options.join('、')+'。':'支持人工录入。')+'\n';
    });
    doc+='\n三、业务规则\n';
    doc+='1. 所属港口、运输方式、货物类型、类型编码、计算系数、所属仓库、收货模式、结算方式为核心报价条件，提交前必须完整。\n';
    doc+='2. 英文货物类型用于海外仓、英文报价单和外部渠道对接，需与中文货物类型保持含义一致。\n';
    doc+='3. 计算系数用于体积重、收费重量或渠道价格试算，正式系统需要校验格式并保留历史版本。\n';
    doc+='4. 杂费应支持按票、按件、按重量、按体积等计费口径，后续可扩展币种和有效期。\n';
    doc+='5. 内部备注仅内部人员可见，用于记录报价限制、客户特殊要求和审批提示。\n\n';
    doc+='四、交互要求\n';
    doc+='1. 保存草稿不进入正式报价流程，但需要保留录入人、保存时间和草稿内容。\n';
    doc+='2. 确认提交后进入报价审核或报价确认节点，提交弹窗需要填写提交备注和审核节点。\n';
    doc+='3. 重置仅清空当前表单，不影响已保存草稿和已提交记录。\n';
    doc+='4. 每个输入框支持一键清空，文本类字段支持多语言切换后的占位提示。\n';
    doc+='5. 页面标题、字段、按钮、弹窗、需求说明入口均需要支持中文、英文、法文、葡萄牙文切换。\n';
    return doc;
}

function buildLocalizedRequirementDoc(tabId,c,menuPath){
    const lang=_currentLang;
    const L=_lang[_currentLang]||_lang.en;
    const title=tr((c&&c.t)||findMenuLabel(tabId));
    const headers=((c&&c.h)||[]).slice(0,-1).filter(function(h){return h!=='序号';}).map(tr);
    const queries=((c&&c.q)||[]).map(function(q){
        const opts=(q.options||(q.field==='status'?c.s:null));
        return {
            label:tr(q.label),
            type:queryTypeName(q.type),
            field:q.field||'-',
            options:opts&&opts.length?opts.map(tr).join(lang==='fr'?', ':', '):''
        };
    });
    const actions=getToolbarActions(tabId).map(function(a){return tr(a.label);});
    const statuses=((c&&c.s)||[]).map(function(s){return (_statusLangMap[s]&&L[_statusLangMap[s]])?L[_statusLangMap[s]]:tr(s);});
    const isFr=lang==='fr';
    const lines=[];
    lines.push('='.repeat(80));
    lines.push('['+title+'] '+(isFr?'Document des exigences':'Requirement Document'));
    lines.push('='.repeat(80),'');
    lines.push(isFr?'1. Positionnement':'1. Page Positioning');
    lines.push((isFr?'Chemin de menu: ':'Menu path: ')+menuPath.join(' > '));
    lines.push(isFr?'Type de page: liste, saisie ou configuration selon le module courant.':'Page type: list, entry, or configuration view based on the current module.');
    lines.push(isFr?'Objectif: permettre la recherche, la consultation, la maintenance, le traitement métier et le suivi des statuts dans une même interface.':'Goal: support search, review, maintenance, business processing, and status tracking in one interface.');
    lines.push('');
    lines.push(isFr?'2. Conditions de recherche':'2. Search Conditions');
    if(queries.length){
        queries.forEach(function(q,i){
            lines.push((i+1)+'. '+q.label+' - '+q.type+'; '+(isFr?'champ: ':'field: ')+q.field+(q.options?'; '+(isFr?'valeurs: ':'options: ')+q.options:'')+'.');
        });
    }else{
        lines.push(isFr?'Aucune condition dédiée. La recherche globale et le filtrage par statut restent disponibles.':'No dedicated conditions. Global search and status filtering remain available.');
    }
    lines.push('');
    lines.push(isFr?'3. Colonnes de liste':'3. List Columns');
    if(headers.length)headers.forEach(function(h,i){lines.push((i+1)+'. '+h);});
    else lines.push(isFr?'Aucune colonne configurée pour ce module.':'No columns configured for this module.');
    lines.push('');
    lines.push(isFr?'4. Statuts':'4. Statuses');
    if(statuses.length)lines.push(statuses.join(isFr?', ':', '));
    else lines.push(isFr?'Aucune énumération de statut dédiée.':'No dedicated status enumeration.');
    lines.push('');
    lines.push(isFr?'5. Boutons et fenêtres':'5. Buttons and Modals');
    actions.forEach(function(a,i){lines.push((i+1)+'. '+a);});
    lines.push(isFr?'Chaque bouton doit ouvrir une fenêtre ou donner un retour clair. Les libellés, champs, messages et boutons de confirmation doivent suivre la langue courante.':'Every button must open a modal or provide clear feedback. Titles, fields, messages, and confirmation buttons must follow the current language.');
    lines.push('');
    lines.push(isFr?'6. Exigences multilingues':'6. Multilingual Requirements');
    lines.push(isFr?'Menus, filtres, boutons, en-têtes, statuts, titres de fenêtres, libellés, textes d’aide, placeholders, title et aria-label doivent basculer sans rechargement.':'Menus, filters, buttons, table headers, statuses, modal titles, labels, help text, placeholders, title attributes, and aria-labels must switch without a page reload.');
    lines.push(isFr?'Les contenus nouvellement générés doivent être traduits immédiatement après leur insertion dans la page.':'Newly generated content must be translated immediately after being inserted into the page.');
    lines.push('');
    lines.push(isFr?'7. Checklist de validation':'7. Acceptance Checklist');
    lines.push(isFr?'La recherche, la réinitialisation, la pagination, le filtrage de colonnes, le glisser-déposer d’en-têtes, l’ajustement de largeur et les fenêtres fonctionnent correctement.':'Search, reset, pagination, column filtering, header drag sorting, column resizing, and modals work correctly.');
    lines.push(isFr?'Après changement de langue, les textes visibles et les indications de saisie sont synchronisés en chinois, anglais, français et portugais.':'After language switching, visible text and input hints are synchronized across Chinese, English, French, and Portuguese.');
    return lines.join('\n');
}

function buildDetailedRequirementDoc(tabId){
    const c=TC[tabId];
    const menuPath=findMenuPath(tabId);
    if(_currentLang!=='zh')return buildLocalizedRequirementDoc(tabId,c||{t:findMenuLabel(tabId),h:[],q:[],s:[]},menuPath);
    if(c&&(c.pageMode==='shipmentEntryAdmin'||c.pageMode==='shipmentEntryClient'||c.pageMode==='shipmentEntry'))return buildShipmentEntryRequirementDoc(menuPath,c.pageMode);
    if(c&&c.pageMode==='warehouseInbound')return buildWarehouseInboundRequirementDoc(menuPath);
    if(c&&c.pageMode==='warehousePda')return buildWarehousePdaRequirementDoc(menuPath);
    if(c&&c.pageMode==='inquiryQuoteEntry')return buildInquiryQuoteRequirementDoc(menuPath);
    return buildDetailedListRequirementDoc(tabId,c||{t:findMenuLabel(tabId),h:[],q:[],s:[]},menuPath);
}

function showRequirementDoc(tabId){
    const c=TC[tabId];
    if(!c)return;
    const L=_lang[_currentLang];
    const menuLabel=tr(findMenuLabel(tabId));
    const doc=buildDetailedRequirementDoc(tabId);
    const modal=document.getElementById('crud-modal');
    const titleEl=document.getElementById('crud-modal-title');
    const bodyEl=document.getElementById('crud-modal-body');
    const footerEl=document.getElementById('crud-modal-footer');
    titleEl.textContent=menuLabel+' - '+(_currentLang==='zh'?'需求说明':_currentLang==='fr'?'Exigences':'Requirements');
    var safeDoc=doc.replace(/\x3c/g,'&lt;');
    bodyEl.innerHTML='<pre style="white-space:pre-wrap;font-family:Consolas,Monaco,monospace;font-size:13px;line-height:1.8;color:#1E293B;background:#F8FAFC;padding:20px;border-radius:8px;border:1px solid #E2E8F0;max-height:60vh;overflow-y:auto">'+safeDoc+'</pre>';
    footerEl.innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button>';
    modal.classList.add('show');
}

function buildFeatureIntro(tabId){
    const c=TC[tabId]||{t:findMenuLabel(tabId),h:[],q:[]};
    const title=c.t||findMenuLabel(tabId)||tabId;
    const actions=getToolbarActions(tabId).map(function(a){return tr(a.label);}).join('、');
    const queries=(c.q||[]).map(function(q){return tr(q.label);}).join('、')||'全局关键字、状态或页面默认条件';
    const fields=(c.h||[]).filter(function(h){return h!=='操作';}).slice(0,12).map(tr).join('、')||'页面核心业务字段';
    const fieldMore=(c.h||[]).filter(function(h){return h!=='操作';}).length>12?'等':'';
    const profile={
        position:'用于承载当前模块的数据查询、列表查看、业务处理、导出分析和详情追踪，是日常操作人员进入该业务环节后的主工作台。',
        problems:['解决业务数据分散、人工查找耗时的问题，让用户通过统一查询条件快速定位记录。','解决不同角色看到字段不一致、操作入口不清晰的问题，通过列表字段设置、查询条件设置和权限按钮统一管理页面能力。','解决处理结果无反馈、操作难追踪的问题，所有按钮点击均通过弹窗确认或提示，后续可接入操作日志。'],
        users:'管理员、业务员、客服、操作、仓库、财务及有对应权限的数据维护人员。',
        value:'减少跨表查找和线下确认，把查询、查看、处理、导出和说明沉淀在同一页面，提升交接效率和数据口径一致性。',
        flow:'用户先通过查询区缩小数据范围，再在列表中勾选或打开单条记录，完成查看、处理、导出或配置类动作。'
    };
    const special={
        'crm-cust':{
            position:'用于维护客户主数据，包括客户简称、全称、业务类型、等级、联系人、所属业务员、客服、结算员、证照和备注等信息，是报价、下单、账期、权限数据范围的基础来源。',
            problems:['解决客户资料散落在销售、客服、财务各自表格中的问题。','解决下单、报价、账单无法准确带出客户归属和结算关系的问题。','解决客户启用、禁用、等级变化缺少统一维护入口的问题。'],
            users:'销售、客服、财务、管理员和客户资料维护人员。',
            value:'保证客户资料、组织归属、结算关系和后续运单费用口径一致。',
            flow:'先维护客户基础资料，再由运单、报价、费用和账单模块按客户代码或客户名称引用。'
        },
        'wb-manage':{
            position:'用于管理端集中管理运单全生命周期数据，从已预报、到货、确认、配舱、出库、签收到取消均可追踪。',
            problems:['解决运单状态、客户归属、客服、结算员、网点信息分散的问题。','解决报关合并、拆分、单独报关等操作缺少统一入口的问题。','解决运单详情、费用、附件、工单说明和备注说明需要跨页面查找的问题。'],
            users:'操作、客服、仓库、财务、业务员和管理端主管。',
            value:'让一票运单从查询、处理、详情查看到费用跟踪形成闭环，减少人工沟通成本。',
            flow:'查询或点击高亮运单号进入详情，查看基础信息、费用、材积、附件、工单说明和备注说明，再按业务需要执行报关、计费、工单或标签打印。'
        },
        'wb-client-manage':{
            position:'用于客户端查询和处理客户侧运单，支持草稿订单转正式单、复制运单、标签打印和运单详情查看。',
            problems:['解决客户只能靠客服反馈订单状态的问题。','解决草稿单转正式单、复制相似运单录入效率低的问题。','解决客户侧查看数据和管理端详情口径不一致的问题。'],
            users:'客户账号、客服、业务员和客户端运营人员。',
            value:'提升客户自助查询和复用下单效率，减少客服重复查询压力。',
            flow:'客户筛选草稿或正式运单，勾选草稿后转为正式单，或复制已有运单快速生成新订单。'
        },
        'wh-in':{
            position:'用于仓库到货后的入仓操作，支持极速收货、二次收货和无头件登记，记录仓库、货区、件数、尺寸、重量、品名和附加服务。',
            problems:['解决仓库现场收货数据无法及时反馈到运单的问题。','解决无快递单号、无客户代码的无头件缺少登记入口的问题。','解决货物明细、图片和异常说明无法形成后续处理依据的问题。'],
            users:'仓库操作员、仓库主管、客服和异常处理人员。',
            value:'把现场收货动作结构化，帮助后续理货、计费、异常认领和运单状态流转。',
            flow:'仓库选择收货模式，录入仓库、货区、件数和货物信息；无头件可上传最多5张图片，保存后进入无头件认领。'
        },
        'wh-in-multi':{
            position:'用于一票多件货物的入仓收货操作，以蓝白色双栏操作台维护基础信息、尺寸维护、收货尺寸、运输方式、同步生成运单、附加服务和托盘绑定。',
            problems:['解决一票多件子单、尺寸、重量和件数录入分散的问题。','解决现场录入时基础信息、维护尺寸和收货尺寸不能同屏核对的问题。','解决运输方式、同步生成运单、附加服务收费提示和托盘绑定需要后续补录的问题。'],
            users:'仓库操作员、仓库主管、客服和异常处理人员。',
            value:'让多件收货从录入、尺寸维护、子单提交到托盘绑定形成一次性闭环，降低少录、错录和重复补录。',
            flow:'先录入运单号、到货时间和右侧运输方式，再补充客户/业务员、库位库区、预报件数、包装类型、品名大类和品名；需要系统生成运单时勾选同步生成运单；再在尺寸维护表录入单件/总重量、件数和长宽高；右侧新增子单并维护收货尺寸，确认提交后可同步绑定托盘。'
        },
        'wh-headless':{
            position:'用于仓库现场登记已到货但无法匹配运单、客户或预报的无头件，先保留物流单号、到货仓库、货区、入仓件数和图片证据。',
            problems:['解决无头件没有独立登记入口、只能依赖纸质记录或聊天记录的问题。','解决无头件图片和件数无法统一保存，后续认领缺少依据的问题。','解决仓库现场录入字段过多影响操作效率的问题。'],
            users:'仓库操作员、仓库主管、客服和异常处理人员。',
            value:'让无头件先快速登记，再进入无头件认领列表完成客户认领和生成预录单。',
            flow:'仓库填写物流单号，选择到货仓库、货区，填写入仓件数，上传最多5张图片，点击保存后提示保存成功。'
        },
        'wh-no-pre-in':{
            position:'用于处理已到仓但无法匹配预报或客户的无头件，列表展示无头单号、物流单号、仓库、件数、图片、客户、业务员、品名和创建信息。',
            problems:['解决无头件靠微信群、纸质记录认领导致丢件和重复沟通的问题。','解决图片、仓库、件数等证据不能随单保存，以及认领阶段需要补传图片的问题。','解决生成预录单时客户和业务员需要人工二次录入的问题。'],
            users:'仓库、客服、业务员和异常处理人员。',
            value:'让无头件从现场登记、图片预览、客户认领到生成预录单形成可追踪闭环。',
            flow:'仓库登记无头件后，客服或业务员在列表中勾选数据补传图片、预览图片、认领客户，确认客户后自动带出业务员，再生成预录单进入后续订单流程。'
        },
        'prod-price-lcl':{
            position:'用于维护销售报价散货价格，包括报价名称、产品、时间范围、发货仓库、使用客户、目的仓库、币别和重量段价格。',
            problems:['解决报价口径分散、价格有效期不清晰的问题。','解决同一产品不同客户、发货仓库和目的仓库价格维护困难的问题。','解决报价编辑时字段背景和可编辑状态不清楚的问题。'],
            users:'报价员、销售主管、财务审核人员和产品配置人员。',
            value:'统一散货报价配置，为业务询价、下单试算和客户报价提供价格依据。',
            flow:'创建报价头信息后维护横向或纵向重量段价格，后续由试算和报价确认环节引用。'
        },
        'fin-fee-mgmt':{
            position:'用于维护费用入账后的审核流转，重点跟踪操作审核、海外确认和财务审核三个环节。',
            problems:['解决费用入账后由谁确认、确认到哪一步不清晰的问题。','解决海外与总部财务对费用口径不一致的问题。','解决生成账单前缺少审核状态追踪的问题。'],
            users:'操作、海外人员、财务、财务主管。',
            value:'将费用确认流程显性化，减少账单争议和漏确认。',
            flow:'费用入账后按运单或客户查询，分别完成操作审核、海外确认、财务审核，再生成账单或导出。'
        },
        'fin-bill-mgmt':{
            position:'用于应收账单查询、费用明细查看和PDF账单生成，跟踪账单金额、已核销金额和待核销金额。',
            problems:['解决账单汇总金额与费用明细无法快速核对的问题。','解决客户需要账单PDF时依赖人工整理的问题。','解决待核销金额和已核销金额不透明的问题。'],
            users:'应收会计、财务主管、客服和客户对账人员。',
            value:'提高账单查询、明细核对、PDF生成和后续核销的效率。',
            flow:'财务按客户或账单号查询账单，查看费用明细列表，确认无误后生成PDF给客户对账。'
        },
        'perm-role':{
            position:'用于维护角色基础信息、菜单权限、字段权限、查询条件权限和按钮权限。',
            problems:['解决新增菜单或按钮后权限没有同步配置入口的问题。','解决不同角色能看哪些字段、能点哪些按钮不清楚的问题。','解决页面权限和数据权限分离维护导致授权口径不一致的问题。'],
            users:'系统管理员、权限管理员和实施顾问。',
            value:'把菜单、字段、查询和按钮授权统一配置，支撑后续按角色控制可见范围。',
            flow:'先维护角色编号、角色名称、状态、终端和角色说明，再按菜单勾选字段、查询条件和按钮权限。'
        }
    };
    const cfg=special[tabId]||profile;
    const problems=(cfg.problems||profile.problems).map(function(item,i){return (i+1)+'. '+item;}).join('\n');
    return [
        '【'+title+'】功能说明',
        '',
        '一、功能定位',
        cfg.position||profile.position,
        '',
        '二、主要解决的问题',
        problems,
        '',
        '三、主要使用对象',
        cfg.users||profile.users,
        '',
        '四、核心能力',
        '1. 查询能力：支持通过 '+queries+' 等条件快速定位数据。',
        '2. 列表能力：列表展示 '+fields+fieldMore+'，并支持表头固定、字段显示设置、底部列汇总和默认每页100条、最高5000条分页。',
        '3. 操作能力：当前页面主要按钮包括 '+(actions||'查询数据、导出数据、查看详情')+'；按钮点击后应打开弹窗或给出明确反馈。',
        '4. 配置能力：支持查询条件显示设置、每行查询条件数量设置、列表字段显示设置，适配不同岗位的查看习惯。',
        '',
        '五、业务价值',
        cfg.value||profile.value,
        '',
        '六、典型使用流程',
        cfg.flow||profile.flow,
        '',
        '七、与其它模块联动',
        '该功能产生或维护的数据会被运单、仓库、费用、账单、权限、报表等相关模块引用；后续接入真实接口时，需要同步维护数据权限、操作日志、导出字段和多语言文案。'
    ].join('\n');
}

function showFeatureIntro(tabId){
    const c=TC[tabId];
    if(!c)return;
    const L=_lang[_currentLang];
    const modal=document.getElementById('crud-modal');
    document.getElementById('crud-modal-title').textContent=tr(findMenuLabel(tabId))+' - '+tr('功能说明');
    document.getElementById('crud-modal-body').innerHTML='<pre style="white-space:pre-wrap;font-family:Microsoft YaHei,Arial,sans-serif;font-size:13px;line-height:1.8;color:#334155;background:#F8FAFC;padding:18px;border-radius:8px;border:1px solid #DBEAFE;max-height:60vh;overflow-y:auto">'+esc(buildFeatureIntro(tabId))+'</pre>';
    document.getElementById('crud-modal-footer').innerHTML='<button onclick="closeCrudModal()" class="px-4 py-2 text-sm font-medium text-text-secondary border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">'+L.cancel+'</button>';
    modal.classList.add('show');
}

