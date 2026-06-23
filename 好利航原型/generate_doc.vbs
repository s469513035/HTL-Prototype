Set objWord = CreateObject("Word.Application")
objWord.Visible = False
Set objDoc = objWord.Documents.Add()
Set objSelection = objWord.Selection

objSelection.Font.Name = "微软雅黑"
objSelection.Font.Size = 16
objSelection.TypeText("好利航国际物流管理系统")
objSelection.TypeParagraph()
objSelection.Font.Size = 14
objSelection.TypeText("详细需求说明书")
objSelection.TypeParagraph()
objSelection.Font.Size = 12
objSelection.TypeText("文档版本：V1.0")
objSelection.TypeParagraph()
objSelection.TypeText("创建日期：2026年5月")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 14
objSelection.TypeText("目录")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()
objSelection.TypeText("1. 系统概述")
objSelection.TypeParagraph()
objSelection.TypeText("2. 菜单结构总览")
objSelection.TypeParagraph()
objSelection.TypeText("3. 角色与权限体系")
objSelection.TypeParagraph()
objSelection.TypeText("4. 功能模块详细需求")
objSelection.TypeParagraph()
objSelection.TypeText("5. 界面设计规范")
objSelection.TypeParagraph()
objSelection.TypeText("6. 弹窗交互标准")
objSelection.TypeParagraph()
objSelection.TypeText("7. 验收清单")
objSelection.TypeParagraph()

objSelection.InsertBreak(7)

objSelection.Font.Bold = True
objSelection.Font.Size = 14
objSelection.TypeText("1. 系统概述")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()
objSelection.TypeText("好利航国际物流管理系统是一套面向国际物流企业的综合业务管理平台，涵盖客户管理、运单管理、仓库管理、财务管理等核心业务模块，支持多角色权限管理和多语言切换。")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 14
objSelection.TypeText("2. 菜单结构总览")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

Set objTable = objDoc.Tables.Add(objSelection.Range, 18, 4)
objTable.Borders.Enable = True
objTable.Cell(1, 1).Range.Text = "序号"
objTable.Cell(1, 2).Range.Text = "一级菜单"
objTable.Cell(1, 3).Range.Text = "二级菜单"
objTable.Cell(1, 4).Range.Text = "功能描述"
objTable.Cell(2, 1).Range.Text = "1"
objTable.Cell(2, 2).Range.Text = "工作台"
objTable.Cell(2, 3).Range.Text = "数据看板"
objTable.Cell(2, 4).Range.Text = "展示关键业务指标和待办事项"
objTable.Cell(3, 1).Range.Text = "2"
objTable.Cell(3, 2).Range.Text = "基础资料"
objTable.Cell(3, 3).Range.Text = "服务商管理"
objTable.Cell(3, 4).Range.Text = "管理物流服务商信息"
objTable.Cell(4, 1).Range.Text = "3"
objTable.Cell(4, 2).Range.Text = "基础资料"
objTable.Cell(4, 3).Range.Text = "员工管理"
objTable.Cell(4, 4).Range.Text = "管理企业员工信息"
objTable.Cell(5, 1).Range.Text = "4"
objTable.Cell(5, 2).Range.Text = "基础资料"
objTable.Cell(5, 3).Range.Text = "银行账户"
objTable.Cell(5, 4).Range.Text = "管理企业银行账户"
objTable.Cell(6, 1).Range.Text = "5"
objTable.Cell(6, 2).Range.Text = "客户管理(CRM)"
objTable.Cell(6, 3).Range.Text = "客户管理"
objTable.Cell(6, 4).Range.Text = "管理客户信息和状态"
objTable.Cell(7, 1).Range.Text = "6"
objTable.Cell(7, 2).Range.Text = "客户管理(CRM)"
objTable.Cell(7, 3).Range.Text = "公海池管理"
objTable.Cell(7, 4).Range.Text = "管理公海客户资源"
objTable.Cell(8, 1).Range.Text = "7"
objTable.Cell(8, 2).Range.Text = "运单管理"
objTable.Cell(8, 3).Range.Text = "下单录入"
objTable.Cell(8, 4).Range.Text = "录入运单预报信息"
objTable.Cell(9, 1).Range.Text = "8"
objTable.Cell(9, 2).Range.Text = "运单管理"
objTable.Cell(9, 3).Range.Text = "整柜下单"
objTable.Cell(9, 4).Range.Text = "整柜业务运单录入"
objTable.Cell(10, 1).Range.Text = "9"
objTable.Cell(10, 2).Range.Text = "提单管理"
objTable.Cell(10, 3).Range.Text = "提单录入"
objTable.Cell(10, 4).Range.Text = "提单信息录入"
objTable.Cell(11, 1).Range.Text = "10"
objTable.Cell(11, 2).Range.Text = "仓库操作管理"
objTable.Cell(11, 3).Range.Text = "入仓操作"
objTable.Cell(11, 4).Range.Text = "仓库入仓业务处理"
objTable.Cell(12, 1).Range.Text = "11"
objTable.Cell(12, 2).Range.Text = "产品配置"
objTable.Cell(12, 3).Range.Text = "产品管理"
objTable.Cell(12, 4).Range.Text = "管理物流产品"
objTable.Cell(13, 1).Range.Text = "12"
objTable.Cell(13, 2).Range.Text = "业务配置"
objTable.Cell(13, 3).Range.Text = "风控规则"
objTable.Cell(13, 4).Range.Text = "配置业务风控规则"
objTable.Cell(14, 1).Range.Text = "13"
objTable.Cell(14, 2).Range.Text = "财务管理"
objTable.Cell(14, 3).Range.Text = "应收管理"
objTable.Cell(14, 4).Range.Text = "管理应收账款"
objTable.Cell(15, 1).Range.Text = "14"
objTable.Cell(15, 2).Range.Text = "客服管理"
objTable.Cell(15, 3).Range.Text = "工单管理"
objTable.Cell(15, 4).Range.Text = "处理客户工单"
objTable.Cell(16, 1).Range.Text = "15"
objTable.Cell(16, 2).Range.Text = "报表管理"
objTable.Cell(16, 3).Range.Text = "业务报表"
objTable.Cell(16, 4).Range.Text = "生成业务统计报表"
objTable.Cell(17, 1).Range.Text = "16"
objTable.Cell(17, 2).Range.Text = "权限管理"
objTable.Cell(17, 3).Range.Text = "角色管理"
objTable.Cell(17, 4).Range.Text = "配置角色权限"
objTable.Cell(18, 1).Range.Text = "17"
objTable.Cell(18, 2).Range.Text = "系统配置"
objTable.Cell(18, 3).Range.Text = "系统设置"
objTable.Cell(18, 4).Range.Text = "系统参数配置"

objSelection.MoveDown
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 14
objSelection.TypeText("3. 角色与权限体系")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()
objSelection.TypeText("系统支持4种角色：超级管理员、管理员、业务员、客服。")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 14
objSelection.TypeText("4. 功能模块详细需求")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.1 工作台")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()
objSelection.TypeText("工作台是用户登录系统后的首页，展示关键业务指标和待办事项。")
objSelection.TypeParagraph()
objSelection.TypeText("功能特点：")
objSelection.TypeParagraph()
objSelection.TypeText("• 数据看板：展示今日运单数、待审核数、异常告警等关键指标")
objSelection.TypeParagraph()
objSelection.TypeText("• 快捷入口：提供常用功能的快速访问")
objSelection.TypeParagraph()
objSelection.TypeText("• 待办事项：显示需要处理的任务列表")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.2 基础资料")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.2.1 服务商管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：基础资料 → 服务商管理")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：列表管理页")
objSelection.TypeParagraph()
objSelection.TypeText("列表字段：")
objSelection.TypeParagraph()

Set objTable2 = objDoc.Tables.Add(objSelection.Range, 8, 5)
objTable2.Borders.Enable = True
objTable2.Cell(1, 1).Range.Text = "字段名称"
objTable2.Cell(1, 2).Range.Text = "字段说明"
objTable2.Cell(1, 3).Range.Text = "必填"
objTable2.Cell(1, 4).Range.Text = "数据类型"
objTable2.Cell(1, 5).Range.Text = "字段长度/格式"
objTable2.Cell(2, 1).Range.Text = "服务商编码"
objTable2.Cell(2, 2).Range.Text = "服务商唯一标识，系统自动生成"
objTable2.Cell(2, 3).Range.Text = "是"
objTable2.Cell(2, 4).Range.Text = "字符串"
objTable2.Cell(2, 5).Range.Text = "固定10位，SERV+6位数字"
objTable2.Cell(3, 1).Range.Text = "服务商名称"
objTable2.Cell(3, 2).Range.Text = "服务商公司全称"
objTable2.Cell(3, 3).Range.Text = "是"
objTable2.Cell(3, 4).Range.Text = "字符串"
objTable2.Cell(3, 5).Range.Text = "最大100字符"
objTable2.Cell(4, 1).Range.Text = "服务类型"
objTable2.Cell(4, 2).Range.Text = "服务类型分类：专线/整柜/空运/快递/铁路"
objTable2.Cell(4, 3).Range.Text = "是"
objTable2.Cell(4, 4).Range.Text = "枚举"
objTable2.Cell(4, 5).Range.Text = "下拉选择"
objTable2.Cell(5, 1).Range.Text = "联系人"
objTable2.Cell(5, 2).Range.Text = "服务商对接人姓名"
objTable2.Cell(5, 3).Range.Text = "否"
objTable2.Cell(5, 4).Range.Text = "字符串"
objTable2.Cell(5, 5).Range.Text = "最大50字符"
objTable2.Cell(6, 1).Range.Text = "联系电话"
objTable2.Cell(6, 2).Range.Text = "服务商联系电话"
objTable2.Cell(6, 3).Range.Text = "否"
objTable2.Cell(6, 4).Range.Text = "字符串"
objTable2.Cell(6, 5).Range.Text = "手机号或固定电话格式"
objTable2.Cell(7, 1).Range.Text = "结算方式"
objTable2.Cell(7, 2).Range.Text = "结算类型：月结/周结/日结/预付"
objTable2.Cell(7, 3).Range.Text = "是"
objTable2.Cell(7, 4).Range.Text = "枚举"
objTable2.Cell(7, 5).Range.Text = "下拉选择"
objTable2.Cell(8, 1).Range.Text = "状态"
objTable2.Cell(8, 2).Range.Text = "服务商状态：启用/停用"
objTable2.Cell(8, 3).Range.Text = "是"
objTable2.Cell(8, 4).Range.Text = "枚举"
objTable2.Cell(8, 5).Range.Text = "标签展示"

objSelection.MoveDown
objSelection.TypeParagraph()
objSelection.TypeText("功能按钮：新增、编辑、查看、启用/停用、导出")
objSelection.TypeParagraph()
objSelection.TypeText("新增/编辑弹窗说明：")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：右侧滑入弹窗，宽度70%")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗字段：服务商编码(自动生成)、服务商名称(必填)、服务类型(下拉)、联系人、联系电话、邮箱地址、合作渠道、结算方式、银行账户、备注")
objSelection.TypeParagraph()
objSelection.TypeText("• 底部按钮：取消、保存")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.2.2 员工管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：基础资料 → 员工管理")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：列表管理页")
objSelection.TypeParagraph()
objSelection.TypeText("功能按钮：新增、编辑、查看、重置密码、启用/停用、导出")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.2.3 银行账户")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：基础资料 → 银行账户")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：列表管理页")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.3 客户管理(CRM)")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.3.1 客户管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：客户管理(CRM) → 客户管理")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：列表管理页")
objSelection.TypeParagraph()

Set objTable3 = objDoc.Tables.Add(objSelection.Range, 8, 5)
objTable3.Borders.Enable = True
objTable3.Cell(1, 1).Range.Text = "字段名称"
objTable3.Cell(1, 2).Range.Text = "字段说明"
objTable3.Cell(1, 3).Range.Text = "必填"
objTable3.Cell(1, 4).Range.Text = "数据类型"
objTable3.Cell(1, 5).Range.Text = "字段长度/格式"
objTable3.Cell(2, 1).Range.Text = "客户代码"
objTable3.Cell(2, 2).Range.Text = "客户唯一标识，系统自动生成"
objTable3.Cell(2, 3).Range.Text = "是"
objTable3.Cell(2, 4).Range.Text = "字符串"
objTable3.Cell(2, 5).Range.Text = "固定10位，CUST+6位数字"
objTable3.Cell(3, 1).Range.Text = "客户简称"
objTable3.Cell(3, 2).Range.Text = "客户简称，用于日常业务称呼"
objTable3.Cell(3, 3).Range.Text = "是"
objTable3.Cell(3, 4).Range.Text = "字符串"
objTable3.Cell(3, 5).Range.Text = "最大50字符"
objTable3.Cell(4, 1).Range.Text = "客户全称"
objTable3.Cell(4, 2).Range.Text = "客户公司全称，用于合同和发票"
objTable3.Cell(4, 3).Range.Text = "是"
objTable3.Cell(4, 4).Range.Text = "字符串"
objTable3.Cell(4, 5).Range.Text = "最大200字符"
objTable3.Cell(5, 1).Range.Text = "客户类型"
objTable3.Cell(5, 2).Range.Text = "客户类型：货主/同行/同行直客"
objTable3.Cell(5, 3).Range.Text = "是"
objTable3.Cell(5, 4).Range.Text = "枚举"
objTable3.Cell(5, 5).Range.Text = "下拉选择"
objTable3.Cell(6, 1).Range.Text = "客户等级"
objTable3.Cell(6, 2).Range.Text = "客户等级分类：A/B/C/D"
objTable3.Cell(6, 3).Range.Text = "否"
objTable3.Cell(6, 4).Range.Text = "枚举"
objTable3.Cell(6, 5).Range.Text = "下拉选择"
objTable3.Cell(7, 1).Range.Text = "联系人"
objTable3.Cell(7, 2).Range.Text = "主要联系人姓名"
objTable3.Cell(7, 3).Range.Text = "否"
objTable3.Cell(7, 4).Range.Text = "字符串"
objTable3.Cell(7, 5).Range.Text = "最大50字符"
objTable3.Cell(8, 1).Range.Text = "客户邮箱"
objTable3.Cell(8, 2).Range.Text = "客户官方邮箱地址"
objTable3.Cell(8, 3).Range.Text = "否"
objTable3.Cell(8, 4).Range.Text = "字符串"
objTable3.Cell(8, 5).Range.Text = "邮箱格式"

objSelection.MoveDown
objSelection.TypeParagraph()
objSelection.TypeText("功能按钮：新增、编辑、查看、分配销售、转入公海、启用/停用、导出")
objSelection.TypeParagraph()
objSelection.TypeText("客户分配弹窗说明：")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：居中弹窗，宽度500px")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗字段：客户信息(只读)、当前负责人(只读)、新负责人(必填)、分配原因、通知方式")
objSelection.TypeParagraph()
objSelection.TypeText("• 底部按钮：取消、确认分配")
objSelection.TypeParagraph()
objSelection.TypeText("新增/编辑客户弹窗说明：")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：右侧滑入弹窗，宽度70%")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗字段：客户代码(自动生成)、客户简称(必填)、客户全称(必填)、客户类型(必填)、客户等级、联系人、联系电话、客户邮箱、客户来源、结算周期、信用额度、所属业务员、备注")
objSelection.TypeParagraph()
objSelection.TypeText("• 底部按钮：取消、保存")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.3.2 公海池管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：客户管理(CRM) → 公海池管理")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：列表管理页")
objSelection.TypeParagraph()
objSelection.TypeText("功能按钮：领取、分配、查看")
objSelection.TypeParagraph()
objSelection.TypeText("领取客户弹窗说明：")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：居中弹窗，宽度450px")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗字段：客户信息(只读)、进入公海时间(只读)、公海原因(只读)、领取原因(必填)")
objSelection.TypeParagraph()
objSelection.TypeText("• 底部按钮：取消、确认领取")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.4 运单管理")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.4.1 下单录入")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：运单管理 → 下单录入")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：录入型页面")
objSelection.TypeParagraph()
objSelection.TypeText("功能按钮：提交预报、保存草稿、附件上传、重置、需求说明")
objSelection.TypeParagraph()
objSelection.TypeText("提交预报弹窗说明：")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：居中弹窗，宽度600px")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗字段：运单信息(只读)、审核节点(必填)、提交备注、通知方式")
objSelection.TypeParagraph()
objSelection.TypeText("• 底部按钮：取消、确认提交")
objSelection.TypeParagraph()
objSelection.TypeText("附件上传弹窗说明：")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：居中弹窗，宽度550px")
objSelection.TypeParagraph()
objSelection.TypeText("• 支持文件类型：PDF、图片(JPG/PNG)、Excel、Word")
objSelection.TypeParagraph()
objSelection.TypeText("• 文件大小限制：单个文件不超过10MB")
objSelection.TypeParagraph()
objSelection.TypeText("• 底部按钮：取消、确定")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.4.2 整柜下单")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：运单管理 → 整柜下单")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：列表管理页")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.5 提单管理")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.5.1 提单录入")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：提单管理 → 提单录入")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.5.2 提单列表")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：提单管理 → 提单列表")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.5.3 提单审核")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：提单管理 → 提单审核")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：列表管理页")
objSelection.TypeParagraph()
objSelection.TypeText("提单审核弹窗说明：")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：居中弹窗，宽度600px")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗字段：提单详情(只读)、审核类型(只读)、提交人信息(只读)、审核意见(必填)、审核结果(必填)")
objSelection.TypeParagraph()
objSelection.TypeText("• 底部按钮：取消、审核驳回、审核通过")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.5.4 提单修改")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：提单管理 → 提单修改")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：列表管理页")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.6 仓库操作管理")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.6.1 入仓操作")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：仓库操作管理-国内 → 入仓操作")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：录入型页面")
objSelection.TypeParagraph()
objSelection.TypeText("功能按钮：保存入仓、打印标签、异常登记、重置、需求说明、刷新数据")
objSelection.TypeParagraph()
objSelection.TypeText("异常登记弹窗说明：")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：居中弹窗，宽度550px")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗字段：入仓单号(只读)、异常类型(必填)、责任方(必填)、异常等级(必填)、异常说明(必填)、照片上传、处理建议")
objSelection.TypeParagraph()
objSelection.TypeText("• 底部按钮：取消、确认登记")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.6.2 理货")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：仓库操作管理-国内 → 理货")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.6.3 上托")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：仓库操作管理-国内 → 上托")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.6.4 出库")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：仓库操作管理-国内 → 出库")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.7 产品配置")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.7.1 产品管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：产品配置 → 产品管理")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.7.4 询价报价")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：产品配置 → 询价报价")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：录入型页面")
objSelection.TypeParagraph()
objSelection.TypeText("功能按钮：确认提交、保存草稿、重置、需求说明")
objSelection.TypeParagraph()
objSelection.TypeText("报价确认弹窗说明：")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：居中弹窗，宽度600px")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗字段：客户信息(只读)、货物信息(只读)、报价明细(只读)、报价有效期(必填)、备注")
objSelection.TypeParagraph()
objSelection.TypeText("• 底部按钮：取消、确认报价")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.8 业务配置")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.8.1 风控规则")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：业务配置 → 风控规则")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.9 财务管理")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.9.1 客户与账期")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：财务管理 → 客户与账期")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.9.2 应收管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：财务管理 → 应收管理")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.9.3 应付与成本")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：财务管理 → 应付与成本")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.9.4 汇率与开票")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：财务管理 → 汇率与开票")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.10 客服管理")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.10.1 工单管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：客服管理 → 工单管理")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.10.2 投诉管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：客服管理 → 投诉管理")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.11 报表管理")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.11.1 业务报表")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：报表管理 → 业务报表")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.11.2 财务报表")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：报表管理 → 财务报表")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.12 待办")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.12.1 待办中心")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：待办 → 待办中心")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.13 权限管理")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.13.1 用户管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：权限管理 → 用户管理")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.13.2 角色管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：权限管理 → 角色管理")
objSelection.TypeParagraph()
objSelection.TypeText("页面类型：列表管理页")
objSelection.TypeParagraph()
objSelection.TypeText("角色权限配置弹窗说明：")
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：右侧滑入弹窗，宽度70%")
objSelection.TypeParagraph()
objSelection.TypeText("• 左侧区域：角色名称(必填)、角色描述、状态、创建时间(只读)、修改时间(只读)")
objSelection.TypeParagraph()
objSelection.TypeText("• 右侧区域三列：菜单权限(树形结构)、字段权限(表格形式)、查询条件权限")
objSelection.TypeParagraph()
objSelection.TypeText("• 底部按钮：取消、保存角色")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.13.3 菜单管理")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：权限管理 → 菜单管理")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.13.4 日志查询")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：权限管理 → 日志查询")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.14 物料管理")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.14.1 物料列表")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：物料管理 → 物料列表")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.15 外部对接接口")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.15.1 接口配置")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：外部对接接口 → 接口配置")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.16 移动端APP")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.16.1 APP功能")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：移动端APP → APP功能")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 13
objSelection.TypeText("4.17 系统配置")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 12
objSelection.TypeText("4.17.1 系统设置")
objSelection.Font.Bold = False
objSelection.TypeParagraph()
objSelection.TypeText("菜单路径：系统配置 → 系统设置")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 14
objSelection.TypeText("5. 界面设计规范")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()
objSelection.TypeText("• 设计原则：简洁、高效、统一")
objSelection.TypeParagraph()
objSelection.TypeText("• 色彩规范：主色调蓝色(#1890ff)，辅助色灰色系")
objSelection.TypeParagraph()
objSelection.TypeText("• 字体规范：微软雅黑，14px标准字号")
objSelection.TypeParagraph()
objSelection.TypeText("• 间距规范：标准间距16px，组件间距8px")
objSelection.TypeParagraph()
objSelection.TypeText("• 按钮规范：主按钮蓝色，次按钮灰色边框，文字按钮无背景")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 14
objSelection.TypeText("6. 弹窗交互标准")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()
objSelection.TypeText("• 弹窗类型：右侧滑入弹窗(70%宽度)、居中弹窗(固定宽度)")
objSelection.TypeParagraph()
objSelection.TypeText("• 滑入动画：从右向左滑入，带过渡效果")
objSelection.TypeParagraph()
objSelection.TypeText("• 关闭方式：点击关闭按钮、点击遮罩层、ESC键")
objSelection.TypeParagraph()
objSelection.TypeText("• 按钮布局：取消按钮在左，主操作按钮在右")
objSelection.TypeParagraph()

objSelection.Font.Bold = True
objSelection.Font.Size = 14
objSelection.TypeText("7. 验收清单")
objSelection.Font.Bold = False
objSelection.Font.Size = 12
objSelection.TypeParagraph()
objSelection.TypeText("• 功能验收：所有菜单功能正常访问和操作")
objSelection.TypeParagraph()
objSelection.TypeText("• UI验收：界面风格统一，响应式布局正常")
objSelection.TypeParagraph()
objSelection.TypeText("• 交互验收：弹窗动画流畅，按钮点击响应正常")
objSelection.TypeParagraph()
objSelection.TypeText("• 权限验收：不同角色菜单过滤正确")
objSelection.TypeParagraph()
objSelection.TypeText("• 多语言验收：中/英/法三种语言切换正常")
objSelection.TypeParagraph()

objDoc.SaveAs("好利航国际物流_详细需求说明书.docx")
objDoc.Close()
objWord.Quit()

Set objDoc = Nothing
Set objWord = Nothing

WScript.Echo "Word文档生成成功！"