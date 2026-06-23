const fs = require('fs');
const path = require('path');
const vm = require('vm');
const os = require('os');
const { spawnSync, spawn } = require('child_process');
const { pathToFileURL } = require('url');
const HTMLtoDOCX = require('html-to-docx');

const outDir = __dirname;
const prototypeHtmlPath = path.join(outDir, '好利航国际物流_原型图.html');
const htmlPath = path.join(outDir, '好利航国际物流_详细需求说明书.html');
const docxPath = path.join(outDir, '好利航国际物流_详细需求说明书.docx');
const pdfPath = path.join(outDir, '好利航国际物流_详细需求说明书.pdf');
const fallbackDocxPath = path.join(outDir, '好利航国际物流_详细需求说明书_20260605.docx');
const datedDocxPath = path.join(outDir, '好利航国际物流_详细需求说明书_20260608.docx');

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
}

function table(headers, rows) {
  return `<div class="doc-table-wrap"><table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function makeDomStubElement() {
  return new Proxy(function noop() {}, {
    get(target, prop) {
      if (prop === 'style') return {};
      if (prop === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
      if (prop === 'dataset') return {};
      if (prop === 'children' || prop === 'childNodes') return [];
      if (['value', 'innerHTML', 'textContent', 'id', 'className'].includes(prop)) return '';
      if (prop === 'checked') return false;
      if (['appendChild', 'remove', 'addEventListener', 'removeEventListener', 'setAttribute', 'focus', 'click', 'insertAdjacentHTML', 'replaceWith'].includes(prop)) return () => {};
      if (prop === 'querySelector' || prop === 'closest') return () => null;
      if (prop === 'querySelectorAll') return () => [];
      if (prop === 'matches') return () => false;
      if (prop === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 });
      return target[prop] ?? '';
    },
    set() { return true; },
    apply() { return null; },
  });
}

function loadPrototypeConfig() {
  if (!fs.existsSync(prototypeHtmlPath)) return { tc: {}, getToolbarActions: null, menuData: [] };
  const html = fs.readFileSync(prototypeHtmlPath, 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const document = {
    getElementById() { return makeDomStubElement(); },
    querySelector() { return makeDomStubElement(); },
    querySelectorAll() { return []; },
    createElement() { return makeDomStubElement(); },
    createTreeWalker() { return { currentNode: null, nextNode() { return false; } }; },
    addEventListener() {},
    removeEventListener() {},
    body: makeDomStubElement(),
    documentElement: makeDomStubElement(),
  };
  const storage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  function MutationObserver() {
    this.observe = function observe() {};
    this.disconnect = function disconnect() {};
  }
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    setTimeout() {},
    clearTimeout() {},
    setInterval() {},
    clearInterval() {},
    localStorage: storage,
    sessionStorage: storage,
    document,
    window: null,
    navigator: { language: 'zh-CN' },
    location: { search: '', href: '' },
    URLSearchParams,
    Blob: function Blob() {},
    FileReader: function FileReader() {},
    fetch: async () => ({ json: async () => ({}), text: async () => '' }),
    alert() {},
    confirm() { return true; },
    tailwind: { config: {} },
    lucide: { createIcons() {} },
    NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  try {
    scripts.forEach((script, index) => {
      const expose = index === scripts.length - 1
        ? '\n;globalThis.__DOC_TC=TC;globalThis.__DOC_ACTIONS=getToolbarActions;globalThis.__DOC_MENU=menuData;'
        : '';
      vm.runInContext(script + expose, context, { filename: `prototype-inline-${index + 1}.js` });
    });
    return {
      tc: context.__DOC_TC || {},
      getToolbarActions: context.__DOC_ACTIONS || null,
      menuData: context.__DOC_MENU || [],
    };
  } catch (err) {
    console.warn(`warning: prototype config load failed: ${err.message}`);
    return { tc: {}, getToolbarActions: null, menuData: [] };
  }
}

const prototypeConfig = loadPrototypeConfig();

const modulePrototypeIds = {
  服务商管理: ['base-provider'],
  员工管理: ['base-employee'],
  发件人信息: ['base-sender'],
  客户管理: ['crm-cust'],
  下单录入: ['wb-special'],
  '运单管理（管理端）': ['wb-manage'],
  工单管理: ['wb-work-order'],
  '运单查询（客户端）': ['wb-client-manage'],
  '入仓操作（一票一件）': ['wh-in-one'],
  '入仓操作（一票多件）': ['wh-in-multi'],
  无头件登记: ['wh-headless'],
  无头件认领: ['wh-no-pre-in'],
  调拨入库: ['wh-transfer-in'],
  调拨出库: ['wh-transfer-out'],
  调拨费用查询: ['wh-transfer-fee'],
  扫描出库: ['wh-scan-out'],
  上托管理: ['wh-pallet-mgmt'],
  装箱单规则管理: ['wh-pack-rule'],
  查货管理: ['wh-cargo-search'],
  预载单管理: ['wh-preload'],
  补货落货管理: ['wh-replenish-drop'],
  问题件管理: ['wh-issue'],
  空运分拣管理: ['wh-air-sort'],
  空运装袋管理: ['wh-air-bag'],
  空运装箱单管理: ['wh-air-pack'],
	  仓库PDA: ['pda-app'],
	  整柜报价: ['fcl-quote'],
	  成本价: ['fcl-cost-price'],
	  业务成本: ['fcl-business-cost'],
	  业务销售价: ['fcl-sales-price'],
	  附加费维护: ['fcl-surcharge'],
	  加价维护: ['fcl-markup'],
	  整柜试算: ['fcl-trial-calc'],
	  业务询盘单管理: ['fcl-inquiry-order'],
	  '草稿/预录单': ['fcl-draft-preorder'],
	  订舱单管理: ['fcl-booking-order'],
	  订单管理: ['fcl-order'],
	  订仓作业: ['fcl-booking'],
  放仓作业: ['fcl-release'],
  拖车安排: ['fcl-truck'],
  进仓装柜: ['fcl-load'],
  补料与提单: ['fcl-si-bl'],
  报关申报: ['fcl-customs'],
  开船与轨迹: ['fcl-sailing-track'],
	  寄单作业: ['fcl-doc-send'],
	  实际账单导入: ['fcl-actual-bill-import'],
	  账单录入: ['fcl-bill-entry'],
	  船公司账单对比: ['fcl-carrier-bill-compare'],
	  整柜账单: ['fcl-bill'],
	  付款管理: ['fcl-payment'],
  应收与放单: ['fcl-ar-release'],
	  业绩与提成: ['fcl-commission'],
	  关键业务规则: ['fcl-rule'],
  'EDI/API对接': ['fcl-edi-api'],
  整柜异常处理: ['fcl-exception'],
  'SLA与KPI': ['fcl-sla-kpi'],
  '理货/上托/出库': ['wh-sort', 'wh-pallet', 'wh-out'],
  产品管理: ['prod-manage'],
  '销售报价（散货）': ['prod-price-lcl'],
  附加杂费配置: ['prod-surcharge'],
  汇率管理: ['cfg-rate'],
  服务商API配置: ['fcl-provider-api'],
  '国家/州省/城市/港口机场/品名库/财务费用科目/多语言配置': ['cfg-country', 'cfg-province', 'cfg-city', 'cfg-port', 'cfg-product-name', 'cfg-i18n'],
  费用管理: ['fin-fee-mgmt'],
  账单管理: ['fin-bill-mgmt'],
  用户管理: ['perm-user'],
  角色管理: ['perm-role'],
  组织架构: ['perm-hq', 'perm-region', 'perm-branch', 'perm-wh', 'perm-dept', 'perm-team'],
};

const customFormPrototypeIds = new Set(['wb-special', 'wb-client-special', 'wh-in-one', 'wh-in-multi', 'wh-headless', 'pda-app']);

function shortItems(items, max = 5) {
  const values = [];
  (items || []).forEach((item) => {
    const text = String(item || '').trim();
    if (!text) return;
    const main = text.split(/[：:]/)[0].trim();
    main.split(/[、，,；;]/).forEach((part) => {
      const cleaned = part.replace(/[。.\s]+$/g, '').trim();
      if (cleaned && !values.includes(cleaned)) values.push(cleaned);
    });
  });
  return values.slice(0, max);
}

function normalizeLabel(value) {
  return String(value || '')
    .replace(/^[\s\d.、-]+/g, '')
    .replace(/[：:].*$/g, '')
    .replace(/为必填.*$/g, '')
    .replace(/使用.*$/g, '')
    .replace(/位于.*$/g, '')
    .replace(/支持.*$/g, '')
    .replace(/[。；;，,\s]+$/g, '')
    .trim();
}

function uniquePush(list, item, key) {
  const value = key ? key(item) : item;
  if (!value) return;
  if (!list.some((current) => (key ? key(current) : current) === value)) list.push(item);
}

function queryTypeName(type) {
  const names = {
    text: '文本输入框',
    select: '下拉框',
    multiselect: '多选下拉框',
    checkedDropdown: '勾选下拉框',
    date: '日期选择框',
    number: '数字输入框',
    textarea: '多行文本框',
  };
  return names[type] || '文本/业务控件';
}

function extractFieldLabels(items) {
  const labels = [];
  (items || []).forEach((item) => {
    const text = String(item || '').trim();
    if (!text) return;
    const colonIndex = Math.max(text.indexOf('：'), text.indexOf(':'));
    if (colonIndex > 0) {
      const title = normalizeLabel(text.slice(0, colonIndex));
      const rest = text.slice(colonIndex + 1);
      if (/弹窗|区域|信息|字段|明细|绑定|服务|要求|预览|维护/.test(title)) uniquePush(labels, title);
      if (/[、，,；;]/.test(rest) || /为必填|下拉框|输入框|只读/.test(rest)) {
        rest.split(/[、，,；;。.\n]/).forEach((part) => {
          const label = normalizeLabel(part);
          if (label && label.length <= 20 && !/展示|支持|点击|选择|输入|确认|生成|上传|最多|根据|自动|用于|后续|默认|不再|位于|打开|字段|页面|上方|下方|底部|顶部|最后|完整行|按钮|样式|预览|保留/.test(label)) {
            uniquePush(labels, label);
          }
        });
      } else if (title) {
        uniquePush(labels, title);
      }
      return;
    }
    text.split(/[、，,；;。.\n]/).forEach((part) => {
      const label = normalizeLabel(part);
      if (label) uniquePush(labels, label);
    });
  });
  return labels;
}

function inferRequiredFields(module) {
  if (module.requiredFields && module.requiredFields.length) return module.requiredFields;
  const source = []
    .concat(module.formFields || [])
    .concat(module.acceptance || [])
    .join('、');
  const candidates = shortItems([source], 18);
  const required = candidates.filter((name) => (
    /编号|编码|代码|名称|姓名|客户|所属|仓库|货区|件数|状态|类型|币别|汇率|金额|费用|时间|日期|目的港|运输方式|负责人|组长|入仓/.test(name)
  ) && !/备注|说明|描述|图片|附件|地址|电话|邮箱|预览|导出|查询/.test(name));
  const picked = required.slice(0, 8);
  if (!picked.length) {
    return ['新增、编辑弹窗中的编号、名称、客户、所属组织、状态、金额、时间等关键业务字段需显示红色 * 必填标记，保存时校验不能为空。'];
  }
  return picked.map((name) => `${name}：新增/编辑时显示红色 * 必填标记，保存或确认时不能为空。`);
}

function moduleButtonDescriptionMap(module) {
  const map = {};
  (module.buttons || []).forEach((item) => {
    const text = String(item || '').trim();
    const [label, ...rest] = text.split(/[：:]/);
    const key = normalizeLabel(label);
    if (key && rest.length) map[key] = rest.join('：').trim();
  });
  return map;
}

function buttonDescription(label, module, sourceId) {
  const fromModule = moduleButtonDescriptionMap(module)[label];
  if (fromModule) return fromModule;
  const specific = {
    'wb-manage|合并报关': '勾选需要合并报关的运单后打开弹窗，提示选择报关费票件，并在下拉框中选择已勾选运单完成合并。',
    'wb-manage|拆分报关': '打开拆分报关弹窗，展示运单号、物流号和拆分票数输入框，确认后记录拆分操作。',
    'wb-manage|单独报关': '打开确认弹窗，提示是否确认单独报关，确认后按单票生成报关处理记录。',
    'wb-manage|标签打印': '打开标签打印弹窗，选择标签模板和打印份数，支持打印运单标签或下载标签 PDF，弹窗不展示处理方式。',
    'wb-manage|合并计费': '勾选多个运单后打开合并计费弹窗，默认勾选运费，并展示已勾选的多票运单信息。',
    'wb-manage|特价申请': '打开特价申请弹窗，申请类型使用单价模式/总价模式，填写申请价格和原因后提交审批。',
    'wb-manage|工单管理': '打开工单弹窗，维护工单标题、工单类型、优先级和多行工单内容，用于异常、资料或费用问题跟进。',
    'wb-manage|手改运费': '打开手改运费弹窗，录入调整后运费和原因，保存后保留操作日志，不自动重算。',
    'wb-client-manage|转为正式单': '仅对草稿状态运单生效，勾选后确认转正式单，成功后运单状态变为已预报。',
    'wb-client-manage|标签打印': '打开标签打印弹窗，默认标签模板为“运单标签-标准”，不展示处理方式。',
    'wb-client-manage|新增工单': '勾选或定位运单后创建工单，用于客户咨询、资料补充、异常处理或费用争议。',
    'wb-client-manage|复制运单': '勾选运单后打开复制弹窗，带出原运单字段，清空需重新生成的数据，快速创建新草稿单。',
    'wh-no-pre-in|上传图片': '勾选一条或多条无头件后打开上传弹窗，可补充最多5张图片，确认后刷新列表图片列。',
    'wh-no-pre-in|无头件认领': '勾选无头件后选择所属客户和所属业务员，补充品名，确认后完成认领并写回列表。',
    'wh-no-pre-in|生成预录单': '勾选无头件后确认仓库、件数、图片、客户、业务员和品名，直接生成预录订单。',
    'fin-fee-mgmt|操作审核': '操作岗位确认费用处理结果，审核状态在列表中高亮加粗展示。',
    'fin-fee-mgmt|海外确认': '海外岗位确认费用信息，便于总部财务判断费用是否可进入账单。',
    'fin-fee-mgmt|财务审核': '财务岗位进行最终费用审核，审核通过后可进入生成账单流程。',
    'fin-fee-mgmt|生成账单': '将已审核费用汇总生成应收账单，后续可在账单管理查看明细和生成 PDF。',
    'fin-bill-mgmt|查询详情': '打开费用明细弹窗，以列表展示运单号、物流单号、客户、费用名称、币别、汇率、金额和备注说明。',
    'fin-bill-mgmt|下载PDF': '按勾选账单或当前账单数据下载 PDF 账单文件，用于客户对账和归档。',
    'perm-user|重置密码': '打开密码重置弹窗，生成或展示新密码，并提供复制能力。',
  };
  if (specific[`${sourceId}|${label}`]) return specific[`${sourceId}|${label}`];
  const generic = {
    查询数据: '按当前查询条件刷新列表；无查询条件的页面用于刷新当前列表数据。',
    新增数据: '打开新增弹窗或进入新增页面，填写关键业务字段并保存新记录。',
    编辑数据: '对选中或当前行数据打开编辑弹窗，带出原字段值并按权限保存修改。',
    查看详情: '打开只读详情弹窗或详情页，完整展示当前记录的业务字段和操作信息。',
    导出数据: '导出当前筛选结果或勾选数据，导出字段应遵循列表字段设置。',
    启用禁用: '切换当前记录启用状态，点击后需要弹窗确认并记录操作日志。',
    '启用/禁用': '切换当前记录启用状态，点击后需要弹窗确认并记录操作日志。',
    '启用/停用': '切换当前记录启用或停用状态，点击后需要弹窗确认并记录操作日志。',
    复制新增: '复制当前记录关键字段并打开新增弹窗，便于快速生成相似配置。',
    查询条件: '打开查询条件设置弹窗，可选择显示哪些查询条件以及每行展示数量。',
    列表字段: '打开列表字段设置弹窗，可选择列表显示哪些字段并影响导出字段口径。',
    每行显示: '通过下拉框设置查询条件每行展示数量，控件高度与文字按钮保持一致。',
    需求说明: '打开当前页面需求说明弹窗，展示页面布局、字段、按钮、权限、日志和验收要求。',
    功能说明: '打开当前页面功能说明弹窗，说明功能用途、解决问题、使用对象、流程和模块联动。',
    保存: '保存当前页面或弹窗录入内容，保存前校验必填字段并提示处理结果。',
    保存入仓: '保存入仓数据，保存成功后提示是否打印入仓单。',
    异常登记: '打开异常登记弹窗，记录异常原因、处理说明和责任信息。',
    重置: '清空当前表单或恢复默认录入内容，高风险场景需弹窗确认。',
    上传图片: '选择本地图片并展示缩略预览，超过数量限制时提示用户。',
    提交预报: '校验下单基础信息和货物明细后提交正式预报。',
    保存草稿: '保存当前录入内容为草稿，便于后续继续编辑或转正式单。',
    附件上传: '上传业务附件并记录附件类型、说明、上传人和上传时间。',
    新增品名: '在货物明细表格中新增一行品名、尺寸、重量或体积信息。',
    删除: '删除当前明细或记录，删除前弹出简单确认提示“确实删除嘛”。',
    新增: '在当前维护区域新增一行明细或价格规则。',
    保存报价: '保存报价基础资料和重量段价格规则。',
    '横向/纵向': '切换重量单价维护方式，适配横向价格矩阵或纵向明细行维护。',
  };
  return generic[label] || '点击后打开对应业务弹窗或提示，完成当前模块的数据处理、配置维护或结果反馈。';
}

function fieldDescription(label) {
  const exact = {
    无头单号: '无头件登记后生成的唯一编号，用于后续认领、图片补传和生成预录单。',
    到货仓库: '无头件或入仓货物实际到达的仓库，来源于仓库基础资料。',
    入库件数: '本次入库或登记的件数，需参与列表汇总和后续预录单数量。',
    入仓件数: '仓库现场登记的入仓数量，保存时应校验为大于0的数字。',
    图片: '展示登记或认领阶段上传的图片缩略入口，点击后可预览原图。',
    所属客户: '认领或业务归属的客户主数据，生成订单、账单和权限过滤时使用。',
    所属业务员: '客户对应业务员或手工选择的业务归属人员，需关联员工/组织数据。',
    所属客服: '客户或运单对应客服人员，用于客户跟进和异常沟通。',
    所属结算员: '客户或运单对应结算责任人，用于费用、账单和核销跟踪。',
    所属网点: '记录运单所属网点或创建网点，用于数据权限、统计和组织归属。',
    品名: '货物名称，用于仓库识别、报关、计费、异常处理和运单明细。',
    创建时间: '记录数据创建时间，支持排序、追踪和审计。',
    创建人: '记录创建该数据的操作人员，用于责任追踪。',
    创建网点: '记录创建数据的组织网点，用于组织权限和统计。',
    操作: '行内操作入口，通常包含查看、编辑、删除、取消或详情等受权限控制的动作。',
    运单号: '运单唯一业务编号，列表中高亮展示并可点击进入运单详情。',
    物流单号: '外部快递或物流承运单号，用于仓库收货、轨迹和客户查询。',
    客户名称: '客户主数据名称，用于查询、列表展示、费用、账单和权限范围。',
    客户代码: '客户唯一编码，用于系统内部关联客户、订单、费用和账单。',
    所属产品: '运单或报价关联的产品线路，影响运输方式、报价、计费和入仓规则。',
    海外提货仓: '客户或运单指定的海外提货仓库，影响后续派送和仓库操作。',
    起运港: '运输起点港口或机场，来源于港口机场基础配置。',
    目的港: '运输目的港口或机场，来源于港口机场基础配置。',
    运输方式: '海运、空运等运输类型，影响渠道、时效、费用和入仓要求。',
    运单状态: '运单当前生命周期状态，影响可操作按钮和状态统计。',
    仓库异常备注: '仓库收货或操作异常的补充说明，用于客服和业务跟进。',
    操作审核: '操作岗位对费用或业务处理结果的审核状态，列表中需高亮加粗。',
    海外确认: '海外岗位对费用或业务信息的确认状态，列表中需高亮加粗。',
    财务审核: '财务岗位最终审核状态，决定费用是否可进入账单。',
    应收账单号: '应收账单唯一编号，用于账单查询、PDF生成和核销关联。',
    账单名称: '账单对外或内部识别名称，便于财务和客户对账。',
    提单号: '海运提单或运输单据编号，用于账单查询和货运跟踪。',
    币别: '金额所属币种，影响汇率换算、账单展示和财务核算。',
    金额: '账单或费用金额，需参与汇总、核销和导出。',
    已核销金额: '账单已完成核销的金额，用于计算剩余应收。',
    待核销金额: '账单尚未核销的金额，用于财务跟进和账龄分析。',
    币别编号: '汇率配置使用的币种编号和名称，下拉选择。',
    汇率: '币种换算比率，用于费用、报价和账单金额换算。',
    汇损: '汇率损耗或调整值，用于财务换算差异控制。',
    状态: '记录启用、停用、审核或业务状态，需与查询、标签和操作权限联动。',
    启用状态: '控制基础资料是否可被业务页面继续引用，使用下拉选择。',
    生效开始时间: '规则、报价或汇率开始生效日期，保存时应校验时间区间。',
    生效结束时间: '规则、报价或汇率结束生效日期，需晚于开始时间。',
    所属国家: '国家二字码和中文名称组合展示，用于客户、港口、城市等基础资料。',
    备注: '补充说明字段，使用多行文本框，宽度为弹窗50%，并放在弹窗底部。',
  };
  if (exact[label]) return exact[label];
  if (/编号|单号|代码|编码/.test(label)) return '业务唯一标识字段，用于查询、详情、导出和跨模块关联，新增时通常由系统生成或校验唯一性。';
  if (/客户/.test(label)) return '关联客户主数据，影响下单、报价、费用、账单、权限和统计口径。';
  if (/时间|日期/.test(label)) return '记录业务发生或生效节点，需支持日期控件、排序、筛选和审计追踪。';
  if (/金额|费用|价格|成本|运费/.test(label)) return '金额类字段需保留币种、精度和汇总规则，并参与财务核算或列表底部统计。';
  if (/重量|体积|件数|数量|长|宽|高/.test(label)) return '数量或尺寸类字段，需校验数字格式并参与材积、体积重、计费或列表汇总。';
  if (/港|仓库|货区|路线|国家|城市|省/.test(label)) return '地点或基础配置字段，应来自统一配置或下拉数据，避免手工录入口径不一致。';
  if (/人|业务员|客服|负责人|组长/.test(label)) return '人员类字段，需关联员工和组织架构，用于责任归属、权限过滤和后续跟进。';
  return `用于记录、筛选或展示当前模块的“${label}”信息，需保持列表、弹窗、导出和多语言文案一致。`;
}

function isRequiredField(label, module) {
  const requiredText = inferRequiredFields(module).join('、');
  if (requiredText.includes(label)) return '是';
  if (/备注|说明|图片|附件|操作|创建|修改|已核销|待核销|日志|邮箱|电话|地址/.test(label)) return '否';
  if (/编号|编码|代码|名称|客户|仓库|货区|件数|状态|类型|币别|汇率|金额|时间|日期|目的港|运输方式|物流公司|负责人|组长|业务员/.test(label)) return '建议必填';
  return '否';
}

function getPrototypeConfigs(module) {
  const ids = module.prototypeIds || modulePrototypeIds[module.name] || [];
  return ids
    .map((id) => ({ id, config: prototypeConfig.tc[id] }))
    .filter((item) => item.config);
}

function getActionLabels(id) {
  if (!prototypeConfig.getToolbarActions) return [];
  try {
    return (prototypeConfig.getToolbarActions(id) || []).map((action) => ({
      label: action.label,
      key: action.key || action.type || '',
      sourceId: id,
    }));
  } catch (err) {
    return [];
  }
}

function resolveModuleDetail(module) {
  const configs = getPrototypeConfigs(module);
  const ids = configs.map((item) => item.id);
  const isCustomForm = ids.some((id) => customFormPrototypeIds.has(id) || (prototypeConfig.tc[id] && prototypeConfig.tc[id].pageMode));
  const queryFields = [];
  const listFields = [];
  const formFields = [];
  const buttons = [];

  configs.forEach(({ id, config }) => {
    const source = config.t || module.name;
    if (!isCustomForm && !config.hideQueryPanel && Array.isArray(config.q) && config.q.length) {
      config.q.forEach((query) => {
        uniquePush(queryFields, {
          source,
          label: query.label,
          type: query.type || 'text',
          options: query.options || (query.field === 'status' ? config.s : []),
        }, (item) => `${item.source}|${item.label}`);
      });
    }
    if (!isCustomForm && Array.isArray(config.h) && config.h.length) {
      config.h.forEach((label) => {
        uniquePush(listFields, { source, label }, (item) => `${item.source}|${item.label}`);
      });
    }
    if (Array.isArray(config.entryFields)) {
      config.entryFields.forEach((field) => {
        uniquePush(formFields, {
          source,
          label: field.label,
          type: field.type || 'text',
          required: field.required ? '是' : '否',
        }, (item) => `${item.source}|${item.label}`);
      });
    }
    if (!isCustomForm && Array.isArray(config.h) && config.h.length && !config.readonlyList) {
      const excluded = new Set(['操作'].concat(config.modalExcludedFields || []));
      config.h.forEach((label) => {
        if (!excluded.has(label)) {
          uniquePush(formFields, { source, label, type: /备注|说明/.test(label) ? 'textarea' : 'text' }, (item) => `${item.source}|${item.label}`);
        }
      });
    }
  });

  const moduleFormLabels = extractFieldLabels(module.formFields || []);
  moduleFormLabels.forEach((label) => uniquePush(formFields, { source: module.name, label, type: /备注|说明|内容/.test(label) ? 'textarea' : 'text' }, (item) => `${item.source}|${item.label}`));

  if (isCustomForm) {
    (module.buttons || []).forEach((item) => {
      const label = normalizeLabel(String(item).split(/[：:]/)[0]);
      if (label) uniquePush(buttons, { source: module.name, label, sourceId: ids[0] || module.name }, (button) => `${button.source}|${button.label}`);
    });
  } else {
    configs.forEach(({ id, config }) => {
      getActionLabels(id).forEach((action) => uniquePush(buttons, {
        source: config.t || module.name,
        label: action.label,
        key: action.key,
        sourceId: id,
      }, (button) => `${button.source}|${button.label}`));
    });
    (module.buttons || []).forEach((item) => {
      const label = normalizeLabel(String(item).split(/[：:]/)[0]);
      if (label) uniquePush(buttons, { source: module.name, label, sourceId: ids[0] || module.name }, (button) => `${button.source}|${button.label}`);
    });
  }

  ['查询条件', '列表字段', '需求说明', '功能说明'].forEach((label) => {
    uniquePush(buttons, { source: '列表设置/说明区', label, sourceId: ids[0] || module.name }, (button) => `${button.source}|${button.label}`);
  });

  if (!listFields.length && module.listFields) {
    extractFieldLabels(module.listFields).forEach((label) => uniquePush(listFields, { source: module.name, label }, (item) => `${item.source}|${item.label}`));
  }
  if (!queryFields.length && module.queryFields) {
    extractFieldLabels(module.queryFields).forEach((label) => uniquePush(queryFields, { source: module.name, label, type: 'text', options: [] }, (item) => `${item.source}|${item.label}`));
  }

  return {
    ids,
    isCustomForm,
    queryFields,
    listFields,
    formFields,
    buttons,
  };
}

function renderModulePreview(module, detail, index) {
  const previewId = `preview-${index}`;
  const buttons = module.hideButtons ? [] : detail.buttons.map((button) => button.label);
  if (module.name === '入仓操作（一票多件）') {
    const wmBtnHtml = ['一键填充', '按客户预报收货', '新增子单', '确认提交', '确认提交并删除', '绑定', '保存入仓']
      .map((btn, idx) => `<span class="${idx === 2 || idx === 5 ? 'preview-btn primary' : 'preview-btn'}">${esc(btn)}</span>`)
      .join('');
    const leftFields = ['运单号', '客户/业务员', '到货时间', '库位库区', '预报件数', '包装类型', '品名大类', '品名', '内部备注'];
    const sizeHeads = ['#', '单件/总重量（KG）', '件数', '长', '宽', '高'];
    const receiptHeads = ['#', '子单号', '重量（KG）', '长', '宽', '高'];
    return `
      <!-- PREVIEW_START:${previewId} -->
      <div class="ui-preview" data-preview-id="${previewId}">
        <div class="preview-top"><span>${esc(module.name)}</span><em>${esc(module.path)}</em></div>
        <div class="preview-toolbar">${wmBtnHtml}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">
          <div style="display:flex;flex-direction:column;gap:8px">
            <div class="preview-modal" style="border-style:solid">
              <div class="preview-modal-title">基础信息</div>
              <div class="preview-query" style="grid-template-columns:repeat(2,minmax(0,1fr));margin:0">${leftFields.map((field) => `<span>${esc(field)}</span>`).join('')}</div>
              <div style="margin-top:6px">${['图片凭证', '附加服务'].map((field) => `<span>${esc(field)}</span>`).join('')}</div>
            </div>
            <div class="preview-modal" style="border-style:solid">
              <div class="preview-modal-title">尺寸维护</div>
              <div class="preview-scroll"><table class="preview-table"><thead><tr>${sizeHeads.map((field) => `<th>${esc(field)}</th>`).join('')}</tr></thead><tbody><tr>${sizeHeads.map((field, idx) => `<td>${idx === 0 ? '1' : '...'}</td>`).join('')}</tr></tbody></table></div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div class="preview-modal" style="border-style:solid">
              <div class="preview-modal-title">收货尺寸</div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;color:#dc2626;font-size:12px;font-weight:700;margin-bottom:6px"><span>总件数：0</span><span>总实重：0</span><span>总立方：0</span></div>
              <div class="preview-scroll"><table class="preview-table"><thead><tr>${receiptHeads.map((field) => `<th>${esc(field)}</th>`).join('')}</tr></thead><tbody><tr>${receiptHeads.map((field, idx) => `<td>${idx === 0 ? '1' : '...'}</td>`).join('')}</tr></tbody></table></div>
            </div>
            <div class="preview-modal" style="border-style:solid">
              <div class="preview-modal-title">同步绑定托盘</div>
              <span>托盘号输入框</span><span>绑定按钮</span><span>PDA扫码提示</span>
            </div>
          </div>
        </div>
      </div>
      <!-- PREVIEW_END:${previewId} -->
    `;
  }
  const queryFields = detail.queryFields.map((field) => field.label);
  const tableFields = detail.listFields.map((field) => field.label);
  const formFields = detail.formFields.map((field) => field.label);
  const btnHtml = buttons
    .map((btn, idx) => `<span class="${idx === 0 ? 'preview-btn primary' : 'preview-btn'}">${esc(btn)}</span>`)
    .join('');
  const queryHtml = queryFields.length
    ? `<div class="preview-query">${queryFields.map((field) => `<span>${esc(field)}</span>`).join('')}</div>`
    : '<div class="preview-query compact"><span>当前页面无顶部查询条件</span></div>';
  const tableHtml = tableFields.length
    ? `<div class="preview-scroll"><table class="preview-table"><thead><tr>${tableFields.map((field) => `<th>${esc(field)}</th>`).join('')}</tr></thead><tbody><tr>${tableFields.map((field, idx) => `<td>${idx === 0 ? '示例数据' : '...'}</td>`).join('')}</tr></tbody></table></div>`
    : '';
  const modalHtml = formFields.length
    ? `<div class="preview-modal"><div class="preview-modal-title">${detail.isCustomForm ? '表单字段' : '弹窗字段'}</div>${formFields.map((field) => `<span>${esc(field)}</span>`).join('')}</div>`
    : '';
  return `
    <!-- PREVIEW_START:${previewId} -->
    <div class="ui-preview" data-preview-id="${previewId}">
      <div class="preview-top"><span>${esc(module.name)}</span><em>${esc(module.path)}</em></div>
      ${buttons.length ? `<div class="preview-toolbar">${btnHtml}</div>` : ''}
      ${queryHtml}
      ${tableHtml}
      ${modalHtml}
    </div>
    <!-- PREVIEW_END:${previewId} -->
  `;
}

function renderQueryFields(detail) {
  if (!detail.queryFields.length) return '<p>当前页面不展示顶部查询条件，进入页面后直接展示功能按钮和业务内容。</p>';
  return table(['所属页面', '查询条件', '样式类型', '可选值/说明'], detail.queryFields.map((field) => [
    field.source,
    field.label,
    queryTypeName(field.type),
    field.options && field.options.length ? field.options.join('、') : fieldDescription(field.label),
  ]));
}

function renderListFields(detail) {
  if (!detail.listFields.length) return '<p>当前页面为录入/登记型页面，不展示列表表头；字段以表单字段说明为准。</p>';
  return table(['所属页面', '列表字段', '字段说明'], detail.listFields.map((field) => [
    field.source,
    field.label,
    fieldDescription(field.label),
  ]));
}

function renderFormFields(module, detail) {
  if (!detail.formFields.length) return '<p>当前页面未配置新增/编辑弹窗字段；如后续新增弹窗，应按列表字段、必填规则和权限配置同步生成。</p>';
  return table(['所属页面/弹窗', '字段', '样式类型', '是否必填', '字段说明'], detail.formFields.map((field) => [
    field.source,
    field.label,
    /费用预估与入仓要求/.test(field.label) ? '文本提示框' : queryTypeName(field.type),
    field.required || isRequiredField(field.label, module),
    fieldDescription(field.label),
  ]));
}

function renderButtons(module, detail) {
  return table(['所属区域/页面', '按钮', '功能说明'], detail.buttons.map((button) => [
    button.source,
    button.label,
    buttonDescription(button.label, module, button.sourceId),
  ]));
}

const moduleGroups = [
  {
    name: '工作台',
    modules: [
      {
        name: '工作台首页',
        path: '工作台',
        intro: '用于展示系统关键业务指标、航线数据、港口吞吐、空运机场、待办事项和业务提醒，是登录后的数据驾驶舱。',
        problems: ['管理层无法快速掌握业务量、收入、到港和待办情况。', '操作、客服、财务需要从多个页面查找待处理事项。', '业务异常缺少统一提醒入口。'],
        capabilities: ['展示海运订单、空运订单、在途货物、本月营收等核心指标。', '展示主要国家、港口、机场维度的业务数据概览。', '汇总待审核客户、待审批报价、账期预警、今日到港等待办。'],
        acceptance: [],
        hideAcceptance: true,
        hideButtons: true,
      },
      {
        name: '个人中心与多语言',
        path: '右上角用户菜单 > 语言切换',
        intro: '用于用户在个人中心切换界面语言，覆盖菜单、标签页、按钮、查询条件、列表表头、弹窗标题、提示语和功能说明内容。',
        problems: ['海外员工和客户需要使用不同语言操作系统。', '新增葡萄牙语后，如果入口不统一，用户无法在系统内切换。'],
        capabilities: ['语言切换支持中文、英文、法文、葡萄牙语。', '切换后保存到本地，下次打开系统保持上次语言。', '登录页提供中文、英文、法文、葡萄牙语快捷切换。'],
        acceptance: ['个人中心语言切换弹窗展示葡萄牙语选项。', '选择葡萄牙语后菜单和常用按钮切换为葡萄牙语或葡萄牙语优先文案。', '刷新页面后仍保持葡萄牙语。'],
        buttons: ['语言切换：打开语言选择弹窗。', '语言选项：点击中文、英文、法文或葡萄牙语后立即切换界面语言。'],
      },
    ],
  },
  {
    name: '基础资料',
    modules: [
      {
        name: '服务商管理',
        path: '基础资料 > 服务商管理',
        intro: '用于维护船司、航空、快递、报关、仓储、拖车、保险等外部服务商基础资料。',
        problems: ['服务商资料分散，报价、下单、报关和费用录入无法统一引用。', '启用状态、服务类型和联系信息缺少集中维护入口。'],
        capabilities: ['维护服务商代码、名称、英文名称、类型、联系人、账期、营业执照、银行账号、开票信息、地址和备注。', '支持服务商类型多选、启用状态查询、列表字段设置和导出。'],
        acceptance: ['新增、编辑、查看弹窗字段完整。', '备注字段使用多行文本框并位于底部。'],
      },
      {
        name: '员工管理',
        path: '基础资料 > 员工管理',
        intro: '用于维护员工基础信息、岗位、组织归属和启用状态，是权限、组织、业务归属和审批流程的人员来源。',
        problems: ['负责人、业务员、客服、结算员等下拉字段没有统一人员来源。', '员工离职、停用后仍可能被业务页面选中。'],
        capabilities: ['维护员工编号、姓名、所属组织、岗位、联系方式、状态。', '给组织架构、客户、运单、工单、权限等模块提供人员下拉数据。'],
        acceptance: ['启用状态使用下拉框。', '人员下拉数据在部门负责人、组长、客户业务员等页面复用。'],
      },
      {
        name: '发件人信息',
        path: '基础资料 > 发件人信息',
        intro: '用于维护发件人列表，统一沉淀联系公司、联系人、联系电话和地址，供下单、发货、入仓和客户资料维护时复用。',
        problems: ['发件人信息分散在下单记录或人工备注中，重复录入容易造成联系人、电话和地址不一致。', '业务人员代客户下单时缺少标准发件人列表，影响录入效率和后续追踪。'],
        capabilities: ['提供发件人列表，展示联系公司、联系人、联系电话、地址四个核心字段。', '支持按联系公司、联系人、联系电话查询，并通过新增、编辑、查看详情弹窗维护发件人资料。'],
        acceptance: ['基础资料菜单下存在发件人信息入口。', '新增弹窗字段包含联系公司、联系人、联系电话、地址。', '列表表头和弹窗字段保持一致，地址支持较长文本展示。'],
      },
    ],
  },
  {
    name: '客户管理',
    modules: [
      {
        name: '客户管理',
        path: '客户管理(CRM) > 客户管理',
        intro: '用于维护客户主数据，包括客户简称、全称、业务类型、海外提货偏好仓库、启用状态、等级、联系人、所属业务员、所属结算员、所属客服、证照、地址和备注。',
        problems: ['客户资料、销售归属、客服归属、结算关系分别由不同岗位维护，口径不一致。', '下单、报价、账单、风控无法准确带出客户信息。', '客户启用、禁用、等级和备注变化无法形成统一记录。'],
        capabilities: ['支持客户代码、简称、类型、所属业务员、所属客服、启用状态、客户等级查询。', '新增编辑弹窗按客户基础资料、证照资料、结算资料和备注组织字段。', '海外提货偏好仓库支持多选，所属国家类字段显示二字码和中文名称。'],
        acceptance: ['备注多行文本框宽度为弹窗50%，位于底部。', '启用状态使用下拉框。', '列表字段和查询条件可配置显示。'],
      },
    ],
  },
  {
    name: '运单管理',
    modules: [
      {
        name: '下单录入',
        path: '运单管理（管理端） > 下单录入',
        intro: '用于录入专线下单和预报信息，包括客户、仓库、目的港、物流公司、报关信息、运输方式、货物明细、附件和费用预估。',
        problems: ['业务员下单资料不完整，仓库和财务需要反复补问。', '货物明细、品名、尺寸、重量、附加服务无法结构化沉淀。'],
        capabilities: ['录入基础信息、货物信息、货物明细、附件和备注。', '支持多品名、多尺寸、体积和重量联动计算。', '支持提交预报、保存草稿、附件上传、重置。'],
        acceptance: ['提交前校验客户、仓库、目的港、物流公司和货物明细。', '附件上传记录附件类型、说明、上传人和时间。'],
        formFields: [
          '基础信息：物流单号、客户代号、国内仓库、目的港、件数、总体积(CBM)、总重量(KG)、品名、物流公司、运输方式、发货人电话、预计送货时间。',
          '产品渠道说明：位于基础信息底部、附加服务上方，自动展示产品渠道说明，不再展示“下单渠道”输入框和“下单渠道自动带出”文字。',
          '附加服务：是否报关、打木箱、二次包装、需要卸货、需要集货。',
          '货物明细：序号、品名、货物类型、件数、单件重量、长、宽、高、体积CBM、仿牌、备注、操作。',
          '费用预估与入仓要求：两个文本提示框填充完整行展示。',
        ],
        buttons: [
          '提交预报：校验基础信息和货物明细后提交正式预报。',
          '保存草稿：保存当前录入内容，后续可在客户端草稿单继续编辑。',
          '附件上传：上传报关资料、商业发票、装箱单、货物照片或其他附件。',
          '新增品名：在货物明细中新增一行品名/尺寸/重量记录。',
          '删除：删除当前货物明细行，至少保留一条明细。',
        ],
        interactions: [
          '附加服务文字后显示红色感叹号，鼠标移入后用简单提示框展示收费标准和操作要求。',
          '关键字段如客户代号、国内仓库、目的港、物流公司等显示必填标记。',
        ],
      },
      {
        name: '运单管理（管理端）',
        path: '运单管理（管理端） > 运单管理（管理端）',
        intro: '用于管理端集中跟踪运单全生命周期，支持已预报、已到货、已确认、已配舱、已出库、已签收、已退件、已取消等状态。',
        problems: ['运单状态、客户、网点、业务员、客服、结算员信息分散。', '报关、计费、工单、标签打印和详情查看没有统一入口。', '运单详情、附件、工单说明、备注说明、费用和操作日志需要跨页面查找。'],
        capabilities: ['查询运单号、物流单号、客户、产品、仓库、起运港、目的港、运输方式和状态。', '支持合并报关、拆分报关、单独报关、标签打印、合并计费、特价申请、工单管理、手改运费、导出。', '运单号高亮，可点击进入蓝白主题运单详情。'],
        acceptance: ['编辑按钮隐藏。', '取消按钮弹出“是否确认取消数据”。', '标签打印弹窗支持打印运单标签或下载标签PDF。', '运单详情包含基础信息、费用信息、材积信息、工单说明、附件上传、轨迹、备注说明、操作日志和算费日志。'],
        queryFields: ['运单号、物流单号、客户名称、客户代码、所属产品、海外提货仓、起运港、目的港、运输方式、运单状态。'],
        listFields: ['运单号、物流单号、客户名称、客户代码、所属产品、海外提货仓、所属业务员、所属客服、所属结算员、起运港、目的港、运输方式、件数、重量(KG)、体积(CBM)、运费、运单状态、仓库异常备注。'],
        buttons: [
          '查询数据：按查询条件筛选运单列表。',
          '合并报关：勾选报关费票件后弹窗选择待合并运单。',
          '拆分报关：弹窗展示运单号、物流号和拆分票数输入框。',
          '单独报关：弹窗确认是否单独报关。',
          '标签打印：弹窗选择标签模板和打印份数，去掉处理方式，支持打印或下载运单标签PDF。',
          '合并计费：默认勾选运费，勾选多个运单时展示多个运单信息。',
          '特价申请：申请类型为单价模式/总价模式，填写申请价格和申请原因。',
          '新增工单：弹窗字段为工单标题、工单类型、优先级、工单内容。',
          '手改运费：不触发重算，记录手改后运费和原因。',
          '导出数据：按当前筛选或勾选数据导出。',
        ],
        interactions: ['运单号高亮并可点击进入运单详情。', '运单详情右侧预报下单信息隐藏，整体主题为蓝白色。', '附件信息支持上传并在下方展示附件。'],
      },
      {
        name: '工单管理',
        path: '运单管理（管理端） > 工单管理',
        intro: '用于维护运单相关工单，记录工单编号、标题、类型、优先级、状态、当前处理人、客户、单号、创建人、创建时间和创建公司。',
        problems: ['异常、费用争议、资料补充和客户咨询分散在聊天工具中，无法沉淀。', '处理人和处理状态不清晰，影响跨部门协作。'],
        capabilities: ['按工单编号、标题、类型、优先级、状态查询。', '新增工单弹窗字段为工单标题、工单类型、优先级、工单内容。'],
        acceptance: ['工单内容为多行文本输入框。', '工单列表字段与数据对应准确。'],
      },
      {
        name: '运单查询（客户端）',
        path: '运单管理（客户端） > 运单查询',
        intro: '用于客户端查询草稿和正式运单，支持草稿转正式单、复制运单、标签打印和运单详情查看。',
        problems: ['客户需要频繁向客服确认订单状态。', '相似运单重复录入效率低。', '草稿订单转正式单缺少批量入口。'],
        capabilities: ['查询运单号、物流单号、海外提货仓、运输方式和状态。', '支持转为正式单、标签打印、新增工单、复制运单和导出。', '查看弹窗和点击运单进入的详情保持一致。'],
        acceptance: ['编辑按钮隐藏。', '复制运单弹窗展示原运单字段并可快速生成新运单。', '草稿转正式单后状态变为已预报。'],
        queryFields: ['运单号、物流单号、海外提货仓、运输方式、运单状态。'],
        listFields: ['运单号、物流单号、客户名称、客户代码、所属产品、海外提货仓、起运港、目的港、运输方式、件数、重量(KG)、体积(CBM)、运费、运单状态。'],
        buttons: [
          '查询数据：按查询条件筛选客户端运单。',
          '新增数据：进入客户端下单录入流程。',
          '转为正式单：仅处理草稿状态订单，确认后状态变为已预报。',
          '标签打印：弹窗默认标签模板为运单标签-标准，去掉处理方式。',
          '新增工单：创建费用争议、资料补充、异常处理或客户咨询工单。',
          '复制运单：勾选运单后弹窗展示原运单字段，清空物流单号并生成草稿新单。',
          '导出数据：导出当前筛选或勾选的运单数据。',
        ],
        interactions: ['运单查询去掉合并报关、拆分报关、单独报关、合并计费、特价申请按钮。', '查看弹窗与点击运单号进入的详情页面保持一致。'],
      },
    ],
  },
  {
    name: '仓库操作管理',
    modules: [
      {
        name: '入仓操作（一票一件）',
        path: '仓库操作管理-国内 > 入仓操作（一票一件）',
        intro: '用于一票对应一件货物的快速入仓，仓库人员录入快递单号、仓库、件数、客户、运输方式、目的港、品名、尺寸和托盘绑定信息。',
        problems: ['一票一件场景需要快速完成收货，过多字段会影响仓库操作效率。', '货区和托盘绑定缺少统一入口，后续找货成本高。', '附加服务收费标准需要在现场录入时可见。'],
        capabilities: ['录入基础信息、货区托盘绑定和附加服务。', '支持图片上传，去掉“货物明显”字段。', '保存入仓后弹窗询问是否打印入仓单。'],
        acceptance: ['附加服务默认收起，支持展开查看。', '附加服务文字后显示红色感叹号，鼠标移入展示收费标准和要求。'],
        formFields: [
          '基础信息：快递单号、到货仓库、所属客户、运输方式、目的港、品名大类、品名（输入品名信息带出大类）、长(cm)、宽(cm)、高(cm)。',
          '货区托盘绑定：货区、托盘号、绑定操作。',
          '附加服务：是否报关、打木箱、二次包装、需要卸货、需要集货。',
        ],
        buttons: [
          '保存入仓：保存当前入仓数据，保存后询问是否打印入仓单。',
          '异常登记：登记仓库收货异常说明。',
          '重置：清空当前表单或当前分组录入内容。',
          '需求说明：打开当前页面的需求说明弹窗。',
        ],
        interactions: ['品名输入框占位提示为“输入品名信息带出大类”，输入品名库已有品名或常见关键词后自动带出品名大类。'],
      },
      {
        name: '入仓操作（一票多件）',
        path: '仓库操作管理-国内 > 入仓操作（一票多件）',
        intro: '用于一票多件货物的入仓收货操作，按蓝白主题双栏操作台展示基础信息、尺寸维护、收货尺寸和托盘绑定，帮助仓库人员快速完成多子单、多尺寸、多重量的现场录入。',
        problems: ['一票多件需要同时维护运单、客户、库位、包装、品名、件数、尺寸、重量和子单信息，人工录入容易漏项。', '多件收货时左侧维护尺寸、右侧收货尺寸如果不能同屏展示，会影响仓库现场效率。', '附加服务、图片凭证和托盘绑定需要和入仓动作同步完成，避免后续补录。'],
        capabilities: ['页面按截图调整为左侧“基础信息+尺寸维护”、右侧“收货尺寸+同步绑定托盘”的双栏操作台，主题色为蓝白色。', '基础信息维护运单号、客户/业务员、到货时间、库位库区、预报件数、包装类型、品名大类、品名和内部备注。', '品名输入框占位提示为“输入品名信息带出大类”，输入后自动带出品名大类。', '尺寸维护支持单件重/总重量选择、维护总件数、一键填充、按客户预报收货、尺寸表格新增/删除/清空和表格高度设置。', '收货尺寸支持总件数、总实重、总立方统计，支持新增子单、确认提交、确认提交并删除。', '支持图片凭证上传、附加服务收费提示和托盘号同步绑定。'],
        acceptance: ['页面为蓝白色双栏布局，字段、按钮和表格与当前原型一致。', '一票多件页面不展示入仓件数输入框。', '图片凭证保留上传能力，按钮不显示“上传图片”文字。', '附加服务文字后显示红色感叹号，鼠标移入展示收费标准和要求。', '尺寸维护和收货尺寸表格默认展开并可直接录入。'],
        requiredFields: ['运单号、到货时间、预报件数、包装类型、品名大类、品名、维护总件数为建议必填字段；提交时至少需要一条有效尺寸维护或收货尺寸记录。'],
        formFields: [
          '基础信息：运单号、客户/业务员、到货时间、库位库区、预报件数、包装类型、品名大类、品名、内部备注。',
          '图片凭证：支持图片上传和预览，最多5张，按钮采用图标样式。',
          '附加服务：是否报关、打木箱、二次包装、需要卸货、需要集货，文字后展示红色感叹号提示收费标准和要求。',
          '尺寸维护：重量选择、维护总件数、单件/总重量（KG）、件数、长、宽、高。',
          '收货尺寸：总件数、总实重、总立方、子单号、重量（KG）、长、宽、高。',
          '同步绑定托盘：托盘号输入框、绑定按钮。',
        ],
        buttons: [
          '一键填充：根据维护尺寸快速填充当前表格数据。',
          '按客户预报收货：按客户预报尺寸和件数生成收货维护数据。',
          '新增/删除/清空：对尺寸维护表格进行行级维护。',
          '新增子单：在收货尺寸表格新增一行子单尺寸记录。',
          '确认提交：提交当前收货尺寸中重量值有效的子单数据。',
          '确认提交并删除：提交有效子单后删除重量为空或为0的空子单行。',
          '绑定：绑定托盘号并提示绑定成功。',
          '保存入仓：保存后可选择是否打印入仓单。',
          '异常登记：登记异常原因和处理备注。',
          '重置：重置当前录入内容。',
        ],
        interactions: ['页面参考 D:\\YYKJ_JAVA\\Pictures\\一票多件.png 调整为双栏表格型操作台。', '品名输入框占位提示为“输入品名信息带出大类”，输入品名库已有品名或常见关键词后自动带出品名大类。', '收货尺寸统计随表格录入实时变化。', '附加服务文字后显示红色感叹号，鼠标移入展示收费标准和要求。', '托盘绑定位于右下方，与收货尺寸同屏展示。'],
      },
      {
        name: '无头件登记',
        path: '仓库操作管理-国内 > 无头件',
        intro: '用于仓库现场登记已到货但无法匹配运单、客户或预报的无头件，先保留仓库、货区、件数和图片证据，后续在无头件认领列表中完成认领和生成预录单。',
        problems: ['无头件没有独立登记入口时，现场只能用纸质记录或聊天记录留痕。', '无头件图片、仓库、货区和件数不能统一保存，影响认领效率。', '登记字段过多会降低仓库现场录入速度。'],
        capabilities: ['独立菜单“无头件”用于新增无头件登记。', '字段仅保留到货仓库、货区、入仓件数。', '支持图片上传，最多上传5张图片并在页面预览。', '保存后提示保存成功，数据进入无头件认领流程。'],
        acceptance: ['菜单位于仓库操作管理-国内下，与无头件认领分开。', '页面只保留保存按钮。', '到货仓库、货区、入仓件数为必填字段。'],
        formFields: ['到货仓库：下拉选择仓库。', '货区：下拉选择A区、B区、C区、异常区、待认领区。', '入仓件数：数字输入。', '图片上传：最多5张图片，可删除、可预览。'],
        buttons: ['上传图片：选择本地图片并展示缩略预览，超过5张时提示最多5张图片。', '保存：保存无头件登记信息并提示保存成功。'],
      },
      {
        name: '无头件认领',
        path: '仓库操作管理-国内 > 无头件认领',
        intro: '用于处理已到仓但暂未匹配预报或客户的无头件，形成从登记、图片预览、客户认领到生成预录单的闭环。',
        problems: ['无头件依赖微信群、纸质记录或人工记忆，容易丢失和重复沟通。', '无头件图片、仓库、件数和创建信息没有结构化留存。', '生成预录单时客户和业务员需要人工二次确认。'],
        capabilities: ['列表展示无头单号、到货仓库、入库件数、图片、所属客户、所属业务员、品名、创建时间、创建人、创建网点。', '页面顶部不展示查询条件区域和说明区域，进入页面后直接展示操作按钮和列表。', '图片列展示无头件登记时上传或认领列表补充上传的图片，并支持预览。', '勾选列表数据后可点击上传图片，为选中的无头件补充最多5张图片。', '无头件认领弹窗可选择所属客户，并根据客户带出所属业务员。', '生成预录单弹窗包含到货仓库、入库件数、图片预览、所属客户下拉、所属业务员带出、品名输入，确认后生成订单。'],
        acceptance: ['菜单文字为无头件认领。', '页面必须为列表界面，不允许显示无头件登记表单。', '列表顶部不显示无头单号、到货仓库、所属客户、所属业务员、品名等查询条件。', '功能按钮上方不显示说明块。', '上传图片按钮必须先勾选列表数据，未勾选时提示请选择数据。', '上传图片弹窗展示已勾选的无头单号、仓库、件数、客户和品名，确认后更新列表图片列。', '生成预录单按钮点击后直接弹窗。', '客户下拉选择后业务员自动更新。'],
        listFields: ['无头单号：无头件登记后生成的唯一编号。', '到货仓库：无头件实际到达仓库。', '入库件数：无头件入库数量。', '图片：展示登记或认领时上传的图片缩略按钮，点击可预览。', '所属客户：认领后绑定的客户。', '所属业务员：根据所属客户自动带出的业务员。', '品名：认领或生成预录单时维护的货物名称。', '创建时间：无头件登记时间。', '创建人：登记无头件的操作人。', '创建网点：登记无头件所属网点。', '操作：查看、编辑、删除等行内操作入口。'],
        formFields: [
          '上传图片弹窗：展示已勾选数据数量；列表展示无头单号、到货仓库、入库件数、所属客户、品名；图片上传区支持选择本地图片，最多保留5张，可删除、可预览。',
          '图片预览：展示无头件登记页面或认领列表上传的图片，可在列表和生成预录单弹窗中查看。',
          '编辑弹窗：所属客户、所属业务员、到货仓库使用下拉框；所属客户和所属业务员为必填字段。',
          '无头件认领弹窗：无头单号只读；所属客户为必填下拉框；所属业务员为必填下拉框，客户变更时自动选中默认业务员；品名为文本输入框。',
          '生成预录单弹窗：到货仓库下拉框、入库件数数字输入、所属客户必填下拉框、所属业务员必填下拉框，客户变更时自动选中默认业务员；品名输入框、图片预览区域。',
        ],
        requiredFields: ['编辑弹窗：所属客户、所属业务员为必填下拉框。', '无头件认领弹窗：所属客户、所属业务员为必填下拉框。', '生成预录单弹窗：所属客户、所属业务员为必填下拉框。'],
        buttons: [
          '查询数据：刷新当前无头件认领列表；页面顶部不展示查询条件区域。',
          '上传图片：先勾选一条或多条无头件列表数据，弹窗展示勾选数据和图片上传区；确认后将图片写入所选无头件的图片列，最多5张。',
          '无头件认领：先勾选无头件，选择所属客户后自动带出业务员，补充品名并确认后完成认领。',
          '生成预录单：先勾选无头件，确认仓库、件数、客户、业务员、品名和图片信息后直接生成预录订单。',
          '导出数据：导出当前无头件认领列表数据，包含图片列、客户、业务员和创建信息。',
        ],
        interactions: ['图片列以缩略按钮展示，点击打开图片预览弹窗。', '上传图片时未勾选数据应提示请选择数据。', '上传图片确认后列表图片列立即刷新。', '所属客户变更时所属业务员自动刷新。'],
      },
      {
        name: '调拨入库',
        path: '仓库操作管理-国内 > 调拨入库',
        intro: '用于跨仓调拨车辆到达收货仓后的入库确认，围绕调拨单状态、发货仓、收货仓、车牌号、预计到货时间、调拨票数和调拨件数形成到仓闭环。',
        problems: ['跨仓调拨到货后缺少独立确认入口。', '调拨在途状态需要由收货仓快速确认完成，避免发货仓和收货仓状态不一致。'],
        capabilities: ['列表字段包含调拨单号、调拨状态、发货仓、收货仓、车牌号、预计到货时间、调拨票数、调拨件数。', '功能按钮包含查询数据、入库成功、导出数据。', '勾选调拨单后点击入库成功，直接将调拨状态改为已完成。'],
        acceptance: ['调拨入库页面位于国内操作菜单下。', '入库成功按钮点击后调拨状态更新为已完成。', '列表字段与当前原型表头一致。'],
        listFields: ['调拨单号：调拨业务唯一编号。', '调拨状态：待入库、运输中、已完成、异常。', '发货仓：调拨货物发出的仓库。', '收货仓：调拨货物到达并确认入库的仓库。', '车牌号：承运车辆车牌。', '预计到货时间：车辆预计到达收货仓时间。', '调拨票数：本次调拨涉及运单票数。', '调拨件数：本次调拨涉及货物件数。'],
        buttons: ['查询数据：按调拨单号、调拨状态、发货仓、收货仓和预计到货时间刷新列表。', '入库成功：对已勾选调拨单执行到仓确认，状态改为已完成。', '导出数据：导出当前调拨入库列表。'],
      },
      {
        name: '调拨出库',
        path: '仓库操作管理-国内 > 调拨出库',
        intro: '用于发货仓发起跨仓调拨、维护车辆信息、调整调拨运单并确认出库，左右结构弹窗帮助操作员把未选择运单移动到已选择调拨清单。',
        problems: ['调拨出库如果只靠普通新增表单，无法清楚看到哪些运单未被选择、哪些运单已经进入调拨。', '车辆信息和出库登记需要在同一调拨链路中维护。'],
        capabilities: ['列表字段包含调拨单号、调拨状态、发货仓、收货仓、车牌号、预计到货时间、调拨票数、调拨件数。', '功能按钮包含查询数据、新增调拨、维护车辆、调拨调整、调拨出库、导出数据。', '新增调拨和调拨调整弹窗为左右结构：左侧为未选择运单信息，右侧为已选择运单信息，字段均为运单号、物流单号、运单状态、客户名称、件数、运输方式。', '右侧底部提供调拨出库登记按钮，点击后完成登记提示。', '维护车辆弹窗字段包含收货网点、预计到达时间、车牌号、司机联系电话、运输费用、调拨备注。', '调拨出库按钮对选中调拨单将状态改为已出库。'],
        acceptance: ['新增调拨和调拨调整弹窗结构一致。', '右侧已选择运单区域底部存在调拨出库登记按钮。', '调拨出库按钮点击后状态更新为已出库。'],
        listFields: ['调拨单号：调拨业务唯一编号。', '调拨状态：待调拨、待出库、已出库、已取消。', '发货仓：调拨货物发出的仓库。', '收货仓：调拨货物接收仓库。', '车牌号：承运车辆车牌。', '预计到货时间：车辆预计到达收货仓时间。', '调拨票数：本次调拨运单票数。', '调拨件数：本次调拨货物件数。'],
        formFields: ['新增调拨/调拨调整弹窗左侧未选择运单信息：运单号、物流单号、运单状态、客户名称、件数、运输方式。', '新增调拨/调拨调整弹窗右侧已选择运单信息：运单号、物流单号、运单状态、客户名称、件数、运输方式；右侧底部显示调拨出库登记按钮。', '维护车辆弹窗：收货网点、预计到达时间、车牌号、司机联系电话、运输费用、调拨备注。'],
        requiredFields: ['维护车辆弹窗：收货网点、预计到达时间、车牌号、司机联系电话、运输费用为必填。'],
        buttons: ['查询数据：按调拨单号、调拨状态、发货仓、收货仓和预计到货时间刷新列表。', '新增调拨：打开左右结构运单选择弹窗并登记调拨出库。', '维护车辆：维护收货网点、预计到达时间、车牌号、司机联系电话、运输费用和调拨备注。', '调拨调整：打开与新增调拨一致的左右结构弹窗，调整调拨运单。', '调拨出库：对已勾选调拨单执行出库确认，状态改为已出库。', '导出数据：导出当前调拨出库列表。'],
      },
      {
        name: '调拨费用查询',
        path: '仓库操作管理-国内 > 调拨费用查询',
        intro: '用于查询调拨运输费、仓内搬运费等调拨相关费用，支持按调拨单、费用类型、计费对象、仓库和审核状态核对。',
        problems: ['调拨过程中产生的运输、搬运费用缺少统一查询入口。', '费用是否由客户承担或公司承担不清晰。'],
        capabilities: ['展示费用单号、调拨单号、费用类型、币别、金额、计费对象、来源仓库、目标仓库和审核状态。', '支持审核、导出和查看详情。'],
        acceptance: ['审核状态使用下拉框。', '金额字段参与底部汇总。'],
      },
      {
        name: '扫描出库',
        path: '仓库操作管理-国内 > 扫描出库',
        intro: '用于仓库按运单、物流单号、托盘或装箱单进行扫描出库，确保出库件数和重量可追踪。',
        problems: ['出库依赖人工勾选，无法保证每件货物完成扫描。', '出库异常缺少现场登记入口。'],
        capabilities: ['记录扫描出库单号、运单号、物流单号、出库仓库、货区、托盘号、扫描件数、扫描重量、操作人和扫描时间。', '支持打印标签、异常登记和导出。'],
        acceptance: ['扫描出库可在仓库PDA工作台中同步出现。'],
      },
      {
        name: '上托管理',
        path: '仓库操作管理-国内 > 上托管理',
        intro: '用于货物上托、换托和托盘绑定管理，记录托盘号、货区、件数、重量、体积、上托人和上托时间。',
        problems: ['货区和托盘绑定不完整导致查货困难。', '上托后件数重量与入仓数据缺少复核。'],
        capabilities: ['支持按上托单号、运单号、仓库、货区、托盘号和状态查询。', '支持新增、编辑、查看、打印标签和导出。'],
        acceptance: ['托盘号为关键必填字段。'],
      },
      {
        name: '装箱单规则管理',
        path: '仓库操作管理-国内 > 装箱单规则管理',
        intro: '用于维护装箱单生成规则，按仓库、运输方式、匹配条件、生成方式和优先级控制装箱单汇总口径。',
        problems: ['不同仓库、不同运输方式装箱单汇总口径不一致。', '装箱单规则靠人工记忆，容易错按托盘或袋号汇总。'],
        capabilities: ['支持新增、编辑、查看、审核、导出和启用状态维护。', '生成方式支持按托盘、袋号、运单或客户汇总。'],
        acceptance: ['启用状态为下拉框。', '规则名称、适用仓库、生成方式和优先级为关键字段。'],
      },
      {
        name: '查货管理',
        path: '仓库操作管理-国内 > 查货管理',
        intro: '用于记录客户查货、内部找货和异常货定位过程，沉淀当前仓库、货区、处理人、处理结果和状态。',
        problems: ['查货过程分散在线下沟通，无法追踪处理结果。', '找货结果无法反哺客服和客户。'],
        capabilities: ['支持按查货单、运单、物流单号、客户、查货类型、仓库和状态查询。', '支持新增、编辑、查看、审核和导出。'],
        acceptance: ['处理结果字段在列表中可见。'],
      },
      {
        name: '预载单管理',
        path: '仓库操作管理-国内 > 预载单管理',
        intro: '用于出库前预先组织待装货物，记录装箱单、目的港、运输方式、预计出库时间、总件数、总重量和总体积。',
        problems: ['出库前缺少预载组织，容易导致少装、错装。', '预载计划和实际扫描出库数据无法比对。'],
        capabilities: ['支持生成预载单、编辑、查看、打印标签、异常登记和导出。', '与扫描出库、补货落货管理联动。'],
        acceptance: ['预计出库时间为日期时间类关键字段。'],
      },
      {
        name: '补货落货管理',
        path: '仓库操作管理-国内 > 补货落货管理',
        intro: '用于管理预载或装箱过程中的补货、落货、换托、换柜操作，记录操作类型、原托盘、目标托盘、件数和原因。',
        problems: ['补货落货靠人工备注，无法追踪是谁、何时、为什么调整。', '预载单调整后缺少复核确认。'],
        capabilities: ['操作类型分为补货、落货、换托、换柜。', '支持新增、编辑、查看、异常登记和导出。'],
        acceptance: ['操作类型使用下拉框。'],
      },
      {
        name: '问题件管理',
        path: '仓库操作管理-国内 > 问题件管理',
        intro: '用于登记和处理问题件，类型分为库内问题件和库外问题件，记录运单、物流单号、客户、仓库、问题描述、当前处理人和状态。',
        problems: ['库内和库外问题件没有统一分类和处理闭环。', '问题描述和处理状态无法在仓库、客服、业务之间同步。'],
        capabilities: ['问题件类型支持库内问题件、库外问题件。', '支持新增、编辑、查看、审核、关闭和导出。'],
        acceptance: ['问题件类型为必填下拉框。'],
      },
      {
        name: '空运分拣管理',
        path: '仓库操作管理-国内 > 空运 > 分拣管理',
        intro: '用于空运货物按航班号、目的机场和分拣区域进行分拣作业管理。',
        problems: ['空运分拣按航班和机场组织，不能直接复用海运出库逻辑。'],
        capabilities: ['记录分拣单号、运单号、航班号、目的机场、分拣区域、件数、重量、分拣人和状态。'],
        acceptance: ['空运菜单下存在分拣管理入口。'],
      },
      {
        name: '空运装袋管理',
        path: '仓库操作管理-国内 > 空运 > 装袋管理',
        intro: '用于空运分拣后的装袋封袋作业，管理袋号、航班、目的机场、袋内件数、袋重和封袋时间。',
        problems: ['空运袋号、袋重和封袋信息缺少结构化记录。'],
        capabilities: ['支持按袋号、分拣单号、航班号、目的机场和状态查询。', '支持打印袋标和导出。'],
        acceptance: ['袋号为关键必填字段。'],
      },
      {
        name: '空运装箱单管理',
        path: '仓库操作管理-国内 > 空运 > 装箱单管理',
        intro: '用于空运装袋后生成和确认空运装箱单，汇总袋号、航班、目的机场、件数、重量和体积。',
        problems: ['空运装箱单与海运装箱单规则不同，需要独立入口。'],
        capabilities: ['支持生成、确认、打印和导出空运装箱单。'],
        acceptance: ['空运菜单下存在装箱单管理入口。'],
      },
      {
        name: '仓库PDA',
        path: '仓库PDA > 仓库PDA',
        intro: '用于模拟仓库移动端 APP 原型，面向国内仓库操作人员提供登录、今日总览、工作台、个人中心和各国内操作功能的移动端适配页面，主题色与主系统保持蓝白一致，并参考PDA总览、工作台、个人中心截图的移动端布局。',
        problems: ['国内操作需要移动端现场扫码和拍照，不适合完全依赖PC页面。', '仓库人员需要在一个工作台里快速进入入仓、调拨、出库、上托、查货、问题件和空运作业。', '海外及多语种团队需要PDA端同步支持中文、英文、法文、葡萄牙语。'],
        capabilities: ['PDA原型包含左侧登录区和右侧手机壳预览，手机内包含工作台、今日总览、个人中心三个底部导航。', '工作台采用蓝白顶部栏、白色分组卡片和三列宫格功能按钮，分组包含收货、在库管理、出库、调拨。', '今日总览展示今日任务、待处理消息、待入仓、异常登记等统计卡片，并展示调拨入库、扫描出库、问题件等消息提醒。', '个人中心采用顶部账号信息区和设置列表，包含日志上传、清理缓存、检查更新、分享App给好友、退出登录。', '工作台同步国内操作菜单下全部功能入口，覆盖所有国内操作叶子菜单：入仓一票一件、入仓一票多件、无头件、无头件认领、调拨入库、调拨出库、调拨费用查询、扫描出库、上托管理、装箱单规则、查货、预载、补货落货、问题件、空运分拣、空运装袋、空运装箱单。', '点击功能卡片后在PDA手机壳内打开移动端适配功能页，不跳转PC端页面。', '每个PDA功能页提供移动端字段、扫码入口、拍照上传、卡片式记录和底部确认按钮。', '支持中文、英文、法文、葡萄牙语四语言实时切换。'],
        acceptance: ['存在一级菜单“仓库PDA”。', 'PDA页面展示登录、工作台、今日总览、个人中心。', '工作台底部导航可在工作台、今日总览、个人中心之间切换。', 'PDA功能页需与国内操作菜单全部功能保持一致。', '点击国内操作功能后仍停留在PDA模块内，并展示对应移动端功能页面。'],
        formFields: ['PDA登录：账号、密码、所属仓库。', '工作台：首页标题、收货分组、在库管理分组、出库分组、调拨分组、三列宫格功能按钮。', '今日总览：今日任务、待处理消息、待入仓、异常登记、消息提醒列表。', '功能页：单号扫码、仓库、货区、托盘、件数、重量、尺寸、品名、客户、业务员、问题描述、图片上传等移动端字段。', '个人中心：当前账号、账号编号、日志上传、清理缓存、检查更新、分享App给好友、退出登录。'],
        buttons: ['登录：模拟PDA账号登录。', '语言按钮：中文、English、Français、Português，点击后实时切换语言。', '底部导航：工作台、今日总览、个人中心，点击后在手机壳内切换页面。', '功能卡片：点击后打开PDA内部移动端功能页，入口范围与国内操作菜单全部功能一致。', '扫码/拍照/上传图片：用于现场移动作业数据采集。', '保存/确认类按钮：按当前功能完成入仓、出库、认领、审核、分拣、装袋、装箱单等处理。', '返回：从移动端功能页返回PDA工作台。', '退出登录：模拟退出PDA登录。'],
      },
      {
        name: '理货/上托/出库',
        path: '仓库操作管理-国内 > 理货/上托/出库',
        intro: '用于仓库后续作业节点的列表管理，衔接入仓后的理货、托盘和出库确认。',
        problems: ['入仓后货物状态无法按作业节点追踪。', '出库、上托、理货记录和责任人不清楚。'],
        capabilities: ['按单号和状态查询作业数据。', '维护件数、重量、体积、操作人、操作时间和状态。'],
        acceptance: ['启用状态类输入框均改为下拉选择。', '列表表头固定，底部汇总固定。'],
      },
    ],
  },
  {
    name: '整柜管理',
    modules: [
      {
        name: '成本价',
        path: '整柜管理 > 报价与成本 > 成本价',
        intro: '用于维护整柜基础成本价，按柜型、始发港、目的港、船公司、币别、开始日期、结束日期和使用分公司生效。',
        problems: ['整柜成本价变化频繁，若靠人工口头同步会影响报价准确性。', '不同分公司、港口和柜型的成本价需要独立维护有效期。'],
        capabilities: ['支持成本价新增、编辑、查看、导出。', '作为业务成本、业务销售价、整柜试算和整柜报价的基础价格来源。'],
        acceptance: ['柜型、始发港、目的港、币别、开始日期、结束日期为关键查询条件。'],
      },
      {
        name: '业务成本',
        path: '整柜管理 > 报价与成本 > 业务成本',
        intro: '用于记录订单维度的业务实际成本，支持由成本价、附加费或实际账单导入生成。',
        problems: ['订单执行后成本可能和报价成本不一致，需要独立记录和复核。'],
        capabilities: ['展示订单号、客户、柜型、港口、币别、业务成本、成本来源和确认状态。', '费用调整后可标记为已调整，支撑毛利分析。'],
        acceptance: ['业务成本可追溯成本来源。'],
      },
      {
        name: '业务销售价',
        path: '整柜管理 > 报价与成本 > 业务销售价',
        intro: '用于维护面向客户和分公司的整柜销售价格，报价字段包含成本价、附加费、加价和价格说明。',
        problems: ['销售价格需要按客户、分公司和有效期控制，避免同一港口不同客户价格混用。'],
        capabilities: ['支持业务销售价新增、编辑、审核、查看和导出。', '报价字段可作为整柜报价和试算结果的组成说明。'],
        acceptance: ['使用客户、使用分公司、报价字段和价格说明必须在列表和弹窗中展示。'],
      },
      {
        name: '整柜报价',
        path: '整柜管理 > 报价与成本 > 整柜报价',
        intro: '用于整柜业务询价和报价维护，报价字段覆盖柜型、始发港、目的港、币别、开始日期、结束日期、使用客户、使用分公司、成本价、附加费、加价金额、报价金额和价格说明。',
        problems: ['整柜报价由成本价、附加费和加价组成，若拆散维护会导致销售口径不一致。', '报价通过后需要传递到草稿/预录单和订单。'],
        capabilities: ['支持整柜报价新增、编辑、查看、审核、导出。', '支持复制报价、附加费维护和加价维护。', '附加费包含在报价中，便于客户看到完整报价口径。'],
        acceptance: ['查询条件包含柜型、始发港、目的港、币别、开始日期、结束日期、使用客户、使用分公司。'],
      },
      {
        name: '附加费维护',
        path: '整柜管理 > 报价与成本 > 附加费维护',
        intro: '用于维护整柜报价中的港杂费、文件费、燃油附加费等附加费，支持配置是否包含在报价内。',
        problems: ['附加费若独立线下维护，报价和账单容易产生差异。'],
        capabilities: ['支持按柜型、始发港、目的港、币别和有效期维护附加费。', '可被整柜报价和整柜试算引用。'],
        acceptance: ['是否包含报价字段清晰可见。'],
      },
      {
        name: '加价维护',
        path: '整柜管理 > 报价与成本 > 加价维护',
        intro: '用于维护不同客户、分公司、柜型和港口组合的加价规则。',
        problems: ['销售利润加价需要规则化，否则报价审批难以复盘。'],
        capabilities: ['支持固定金额、百分比、按柜型等加价方式。', '整柜报价复制和试算时可自动带出加价。'],
        acceptance: ['加价金额、加价类型、有效期和适用范围在列表可见。'],
      },
      {
        name: '整柜试算',
        path: '整柜管理 > 报价与成本 > 整柜试算',
        intro: '用于根据柜型、始发港、目的港、币别、开始日期、结束日期、报价字段、成本价、附加费和加价金额进行整柜报价试算。',
        problems: ['业务询价时需要快速判断报价金额和利润，不能每次都手工拼算。'],
        capabilities: ['支持试算价格说明、附加费和报价字段。', '试算结果可生成正式报价。'],
        acceptance: ['整柜试算字段包含柜型、始发港、目的港、币别、开始日期、结束日期、价格说明、附加费和报价字段。'],
      },
      {
        name: '业务询盘单管理',
        path: '整柜管理 > 业务询盘单管理',
        intro: '用于管理业务发起的整柜询盘，记录客户、柜型、始发港、目的港、币别、预计开船日和询盘价格。',
        problems: ['询盘、报价、草稿/预录单之间缺少转化链路会造成重复录入。'],
        capabilities: ['支持询盘新增、编辑、查看和导出。', '支持将业务询盘转化为草稿或预录单。'],
        acceptance: ['存在“转化草稿/预录单”按钮。'],
      },
      {
        name: '草稿/预录单',
        path: '整柜管理 > 草稿/预录单',
        intro: '用于承接业务询盘转化后的草稿或预录单，作为订舱单和订单生成前的数据池。',
        problems: ['报价确认到正式订单之间需要一个可补充、可复核的中间状态。'],
        capabilities: ['支持草稿、预录单、已转订单和已取消状态管理。', '保留来源询盘单、客户、柜型、港口和报价金额。'],
        acceptance: ['来源询盘单和状态在列表可见。'],
      },
      {
        name: '订舱单管理',
        path: '整柜管理 > 订舱单管理',
        intro: '用于管理由预录单或订单生成的订舱单，记录船公司、柜型、始发港、目的港、ETD和订舱状态。',
        problems: ['订舱单需要作为订单、放仓、拖车和提单的统一关联单据。'],
        capabilities: ['支持订舱单新增、编辑、查看、同步和导出。'],
        acceptance: ['订舱状态支持待订舱、已订舱、订舱失败、已取消。'],
      },
      {
        name: '订单管理',
        path: '整柜管理 > 订单管理',
        intro: '用于管理正式整柜订单，展示客户、订舱单、柜型、始发港、目的港、销售价、业务成本和毛利。',
        problems: ['正式订单需要贯穿报价、订舱、账单和毛利核算。'],
        capabilities: ['支持订单新增、编辑、查看、导出。', '毛利由销售价和业务成本计算。'],
        acceptance: ['销售价、业务成本和毛利在列表可见。'],
      },
      {
        name: '订仓作业',
        path: '整柜管理 > 订仓与操作 > 订仓作业',
        intro: '用于整柜实单订仓和预定仓作业，记录船司、航线、柜型柜量、ETD、截补料时间、订仓方式和订仓员。',
        problems: ['订仓方式可能为EDI、官网、邮件或人工，回执状态需要统一追踪。'],
        capabilities: ['支持订仓新增、编辑、同步、查看和导出。', '与放仓作业、拖车安排、补料提单联动。'],
        acceptance: ['订仓方式为下拉选择。'],
      },
      {
        name: '放仓作业',
        path: '整柜管理 > 订仓与操作 > 放仓作业',
        intro: '用于船公司确认舱位后的放仓邮件、订舱号和放仓附件管理。',
        problems: ['放仓邮件和订舱号分散在邮件中，后续拖车和补料难以引用。'],
        capabilities: ['记录订舱号、柜型柜量、放仓时间、附件、处理人和状态。'],
        acceptance: ['放仓附件字段可在列表查看。'],
      },
      {
        name: '拖车安排',
        path: '整柜管理 > 订仓与操作 > 拖车安排',
        intro: '用于安排提柜、装柜和还柜节点，记录拖车公司、预约时间和司机电话。',
        problems: ['拖车预约时间、提还柜地点和司机信息需要与操作节点联动。'],
        capabilities: ['支持拖车安排新增、编辑、查看、异常登记和导出。'],
        acceptance: ['预约时间和司机电话在列表可见。'],
      },
      {
        name: '进仓装柜',
        path: '整柜管理 > 订仓与操作 > 进仓装柜',
        intro: '用于装柜现场记录柜号、封号、装柜地点、装柜件数、毛重和装柜时间。',
        problems: ['柜号、封号、装柜件数和毛重是提单、报关和轨迹的关键数据，需要结构化维护。'],
        capabilities: ['支持装柜确认、异常登记和导出。'],
        acceptance: ['柜号、封号、装柜件数、毛重为关键字段。'],
      },
      {
        name: '补料与提单',
        path: '整柜管理 > 订仓与操作 > 补料与提单',
        intro: '用于 SI 补料、草稿件、HBL/MBL 和客户确认状态管理。',
        problems: ['补料截止时间、草稿件状态、客户确认状态不清晰会影响提单签发。'],
        capabilities: ['支持补料同步、提单查看、草稿件确认和导出。'],
        acceptance: ['补料截止时间、草稿件状态、客户确认状态在列表可见。'],
      },
      {
        name: '报关申报',
        path: '整柜管理 > 订仓与操作 > 报关申报',
        intro: '用于整柜报关资料、报关方式、报关行、申报时间、放行时间和报关状态管理。',
        problems: ['报关资料和放行状态影响开船和放单，需要与订仓单关联。'],
        capabilities: ['支持报关申报新增、编辑、查看、异常登记和导出。'],
        acceptance: ['报关方式为下拉选择。'],
      },
      {
        name: '开船与轨迹',
        path: '整柜管理 > 订仓与操作 > 开船与轨迹',
        intro: '用于管理船名航次、ETD、ATD、ETA、当前节点和异常预警，追踪整柜在途状态。',
        problems: ['船期轨迹依赖外部网站查询，缺少自动同步和异常预警。'],
        capabilities: ['支持轨迹同步、异常预警、查看和导出。'],
        acceptance: ['当前节点和异常预警字段在列表可见。'],
      },
      {
        name: '寄单作业',
        path: '整柜管理 > 订仓与操作 > 寄单作业',
        intro: '用于管理提单寄送、电放或正本寄单，记录快递单号、寄出时间、签收时间和寄单人。',
        problems: ['寄单进度影响客户提货和放单，需要可追踪。'],
        capabilities: ['支持寄单新增、编辑、查看和导出。'],
        acceptance: ['寄单方式、快递单号、寄出时间、签收时间在列表可见。'],
      },
      {
        name: '实际账单导入',
        path: '整柜管理 > 财务与结算 > 实际账单导入',
        intro: '用于按导入模版导入船公司或服务商实际账单，形成后续账单录入和账单对比数据源。',
        problems: ['船公司账单多为Excel或平台下载文件，人工录入效率低且容易漏项。'],
        capabilities: ['支持下载导入模版、导入账单、记录导入批次、匹配成功数、差异数和导入状态。'],
        acceptance: ['存在“下载导入模版”和“导入账单”按钮。'],
      },
      {
        name: '账单录入',
        path: '整柜管理 > 财务与结算 > 账单录入',
        intro: '用于手工录入或复核整柜实际账单，记录订单、船公司、费用名称、柜型、币别、账单金额和账单日期。',
        problems: ['部分服务商账单无法自动导入，需要可追踪的手工录入口径。'],
        capabilities: ['支持账单新增、编辑、查看、下载PDF和导出。'],
        acceptance: ['账单金额、费用名称、账单日期在列表可见。'],
      },
      {
        name: '船公司账单对比',
        path: '整柜管理 > 财务与结算 > 船公司账单对比',
        intro: '用于对比系统应付与船公司实际账单金额，发现差异后支持申诉和标记。',
        problems: ['船公司账单可能存在多收、重复收费、币别错误或费用口径不一致。'],
        capabilities: ['支持账单对比、申诉、标记、责任人跟进和导出。', '展示系统应付、船司账单、差异金额、差异原因、申诉状态和标记状态。'],
        acceptance: ['存在“账单对比”“申诉”“标记”按钮。'],
      },
      {
        name: '整柜账单',
        path: '整柜管理 > 财务与结算 > 整柜账单',
        intro: '用于整柜应收、应付和毛利账单汇总，关联订仓单、客户、船司、金额、币别和账单状态。',
        problems: ['整柜应收应付金额大，账单、毛利和核销需要独立跟踪。'],
        capabilities: ['支持查询、查看、下载PDF、导出。'],
        acceptance: ['应收金额、应付金额、毛利字段在列表可见。'],
      },
      {
        name: '付款管理',
        path: '整柜管理 > 财务与结算 > 付款管理',
        intro: '用于整柜船司或供应商付款申请、审批和付款状态管理。',
        problems: ['票结、月结和多币种付款需要审批留痕。'],
        capabilities: ['支持付款新增、编辑、审核、下载PDF和导出。'],
        acceptance: ['付款金额、币别、审批人、付款状态在列表可见。'],
      },
      {
        name: '应收与放单',
        path: '整柜管理 > 财务与结算 > 应收与放单',
        intro: '用于整柜客户应收核销和放单控制，待收金额为0后允许放单。',
        problems: ['未收款先放单存在财务风险。'],
        capabilities: ['展示应收金额、已收金额、待收金额、放单方式、放单人和放单状态。'],
        acceptance: ['放单状态清晰可见。'],
      },
      {
        name: '业绩与提成',
        path: '整柜管理 > 财务与结算 > 业绩与提成',
        intro: '用于根据整柜毛利、提成比例和核算月份计算业务员提成。',
        problems: ['整柜毛利和提成计算需要可追踪可复核。'],
        capabilities: ['支持提成核算、查看和导出。'],
        acceptance: ['毛利、提成比例、提成金额和核算月份在列表可见。'],
      },
      {
        name: '关键业务规则',
        path: '整柜管理 > 规则与异常 > 关键业务规则',
        intro: '用于维护整柜业务关键规则，如预定仓不产生费用、放单需核销应收等。',
        problems: ['整柜规则散落在SOP和人工经验中，系统执行缺少配置依据。'],
        capabilities: ['支持规则新增、编辑、启用、禁用和导出。'],
        acceptance: ['规则内容、适用环节和启用状态在列表可见。'],
      },
      {
        name: 'EDI/API对接',
        path: '整柜管理 > 规则与异常 > EDI/API对接',
        intro: '用于管理船公司订仓、补料、轨迹等 EDI/API 对接状态。',
        problems: ['外部接口失败后需要可追踪和可重试。'],
        capabilities: ['记录接口名称、对接对象、业务环节、接口类型、最近同步时间、失败次数和启用状态。'],
        acceptance: ['接口类型、失败次数和启用状态在列表可见。'],
      },
      {
        name: '整柜异常处理',
        path: '整柜管理 > 规则与异常 > 异常处理',
        intro: '用于整柜订仓失败、报关异常、补料超时、船期延误等异常登记和处理。',
        problems: ['整柜异常跨销售、订仓、操作、单证、财务，需要统一闭环。'],
        capabilities: ['记录关联单号、异常类型、异常环节、异常描述、处理人、处理时限和状态。'],
        acceptance: ['异常类型、异常环节、当前处理人和处理时限在列表可见。'],
      },
      {
        name: 'SLA与KPI',
        path: '整柜管理 > 规则与异常 > SLA与KPI',
        intro: '用于统计订仓及时率、补料准时率、报关放行及时率等整柜 SLA/KPI。',
        problems: ['整柜操作质量需要通过指标持续追踪。'],
        capabilities: ['维护指标名称、适用环节、目标值、当前值、责任角色、统计周期和预警状态。'],
        acceptance: ['预警状态支持正常、预警、超时。'],
      },
    ],
  },
  {
    name: '产品配置',
    modules: [
      {
        name: '产品管理',
        path: '产品配置 > 产品管理',
        intro: '用于维护物流产品的运输方式、起运港、目的港、备注、计泡比规则、敏感货标识和生效状态。',
        problems: ['报价、下单、试算使用的产品口径不统一。', '产品是否支持敏感货、是否禁止录单缺少配置入口。'],
        capabilities: ['维护产品编号、产品名称、运输方式、起运港、目的港、计泡比和状态。', '支持复制新增、启用/禁用、导出。'],
        acceptance: ['新增编辑弹窗字段背景清晰。', '备注多行文本框位于底部。'],
      },
      {
        name: '销售报价（散货）',
        path: '产品配置 > 销售报价(散货)',
        intro: '用于维护散货报价方案和重量段价格，支持按产品、发货仓库、使用客户、目的仓库和时间范围控制报价有效性。',
        problems: ['报价有效期、使用客户、目的仓库和重量段价格难以统一维护。', '业务员报价和报价员维护口径不一致。'],
        capabilities: ['维护报价编号、报价名称、销售产品、报价开始/结束时间、发货仓库、使用客户、目的仓库、状态。', '发货仓库和目的仓库数据来源为仓库配置。', '支持横向和纵向重量单价维护。'],
        acceptance: ['新增和编辑弹窗中报价名称、报价开始时间、报价结束时间背景色正常。'],
        formFields: ['报价编号、报价名称、销售产品、发货仓库、目的仓库、报价开始时间、报价结束时间、使用客户、状态、所属币别、计费单位、备注。', '重量单价维护支持横向/纵向两种维护方式。'],
        buttons: ['新增数据：打开报价新增弹窗，关键字段显示必填标记。', '复制新增：复制现有报价规则并生成新报价。', '保存报价：保存报价基础信息和重量单价规则。', '新增：在重量单价维护中新增价格行。', '横向/纵向：切换重量单价维护模式。'],
      },
      {
        name: '附加杂费配置',
        path: '产品配置 > 附加杂费配置',
        intro: '用于维护报关费、仓储费、文件费等附加费用规则，为报价和费用入账提供依据。',
        problems: ['杂费规则口径不一致，人工录入容易漏收或错收。'],
        capabilities: ['维护附加费代码、名称、状态、开始时间、结束时间和备注。', '支持启用禁用、复制新增和导出。'],
        acceptance: ['备注多行文本框位于底部，启用状态为下拉框。'],
      },
    ],
  },
  {
    name: '业务配置',
    modules: [
      {
        name: '汇率管理',
        path: '业务配置 > 基础配置 > 汇率管理',
        intro: '用于维护币别编号、汇率、汇损、状态、生效开始时间和生效结束时间。',
        problems: ['多币种报价、费用和账单换算缺少统一汇率来源。', '汇率生效时间不清晰导致财务核算争议。'],
        capabilities: ['弹窗字段包含币别编号下拉、汇率、汇损、状态下拉、生效开始时间、生效结束时间。', '查询条件包含币别编号和启用状态。'],
        acceptance: ['币别编号下拉显示币别编号和名称。', '生效时间区间必填并可用于后续校验。'],
      },
      {
        name: '服务商API配置',
        path: '业务配置 > 服务商API配置',
        intro: '用于统一维护整柜和物流相关服务商接口连接信息，供后续订舱、账单、轨迹、同步和自动化任务调用。',
        problems: ['服务商接口地址、账号、密钥和授权密码分散维护，容易造成接口配置不一致。', '业务配置菜单需要集中承载外部服务接入信息，便于权限、审计和运维管理。'],
        capabilities: ['列表字段包含服务代码、服务名称、请求地址、API秘钥、授权账号、授权密码。', '支持查询数据、新增数据、编辑数据、查看详情、同步数据和导出数据。', 'API秘钥和授权密码在原型中以脱敏形式展示。'],
        acceptance: ['服务商API配置位于业务配置菜单下，不再位于整柜管理菜单下。', '字段口径固定为服务代码、服务名称、请求地址、API秘钥、授权账号、授权密码。'],
        queryFields: ['服务代码、服务名称、启用状态。'],
        listFields: ['服务代码：外部服务或接口的唯一代码。', '服务名称：外部服务商或接口名称。', '请求地址：API请求URL。', 'API秘钥：接口调用密钥，页面展示时需脱敏。', '授权账号：服务商接口授权账号。', '授权密码：服务商接口授权密码，页面展示时需脱敏。', '启用状态：启用或停用。'],
        formFields: ['新增/编辑弹窗：服务代码、服务名称、请求地址、API秘钥、授权账号、授权密码、启用状态。'],
        requiredFields: ['服务代码、服务名称、请求地址、API秘钥、授权账号、授权密码为必填字段。'],
        buttons: ['查询数据：按服务代码、服务名称和启用状态筛选接口配置。', '新增数据：新增服务商API配置。', '编辑数据：维护请求地址、API秘钥、授权账号、授权密码等接口信息。', '查看详情：查看接口配置详情。', '同步数据：手动触发当前接口配置的同步测试或缓存刷新。', '导出数据：导出服务商API配置列表。'],
      },
      {
        name: '国家/州省/城市/港口机场/品名库/财务费用科目/多语言配置',
        path: '业务配置 > 基础配置',
        intro: '用于维护系统字典型主数据，为客户、运单、仓库、产品和费用页面提供下拉选项和翻译文案。',
        problems: ['国家、港口、品名、费用科目等基础资料重复维护。', '多语言文案缺失会导致切换语言后页面不完整。'],
        capabilities: ['所属国家下拉显示国家二字码和中文名称。', '品名库维护中文、英文、法文、葡萄牙文名称、分类和状态。', '多语言配置维护中文、英文、法文、葡萄牙文值。'],
        acceptance: ['查询条件中的所属国家也改为下拉框。', '表头、按钮、查询条件和弹窗文案支持中英法葡切换。'],
        listFields: ['多语言配置列表字段：语言键、中文值、英文值、法文值、葡萄牙文值、操作。', '品名库字段：品名编号、品名中文名、品名英文名、品名分类、备注、状态。'],
      },
    ],
  },
  {
    name: '财务管理',
    modules: [
      {
        name: '费用管理',
        path: '财务管理 > 费用管理',
        intro: '用于维护费用入账后的审核流转，重点展示操作审核、海外确认和财务审核。',
        problems: ['费用确认责任不清，生成账单前缺少状态追踪。', '海外确认和财务审核信息无法在同一列表中快速判断。'],
        capabilities: ['查询运单号、客户名称、费用类型、费用名称、操作审核、海外确认、财务审核。', '支持操作审核、海外确认、财务审核、生成账单、导出。', '审核列高亮加粗显示。'],
        acceptance: ['财务确认改为操作审核。', '操作审核、海外确认、财务审核三列和查询条件存在且为下拉选择。'],
        queryFields: ['运单号、客户名称、是否报关、是否预付、操作审核、海外确认、财务审核、是否调整、创建时间。'],
        listFields: ['运单号、客户名称、费用总额(CNY)、是否报关、是否预付、操作审核、海外确认、财务审核、是否调整、创建时间、操作。'],
        buttons: ['查询数据：按费用和审核状态筛选。', '操作审核：操作岗位确认费用处理结果。', '海外确认：海外岗位确认费用。', '财务审核：财务岗位最终审核费用。', '生成账单：将已审核费用生成账单。', '导出数据：导出费用列表。'],
      },
      {
        name: '账单管理',
        path: '财务管理 > 账单管理',
        intro: '用于查询应收账单、查看费用明细和下载PDF账单文件。',
        problems: ['账单汇总金额与费用明细需要人工核对。', '客户对账PDF依赖线下整理。', '已核销金额和待核销金额不透明。'],
        capabilities: ['列表字段包含应收账单号、账单名称、提单号、客户名称、币别、金额、已核销金额、待核销金额。', '查询详情和查看均展示费用明细列表：运单号、物流单号、客户名称、费用名称、币别、汇率、金额、备注说明。', '支持查询数据、查询详情、下载PDF。'],
        acceptance: ['编辑按钮隐藏。', '查询详情弹窗以列表形式展示费用明细。'],
        queryFields: ['应收账单号、账单名称、提单号、客户名称、币别、状态。'],
        listFields: ['应收账单号、账单名称、提单号、客户名称、币别、金额、已核销金额、待核销金额、操作。'],
        buttons: ['查询数据：按账单号、账单名称、提单号、客户、币别和状态筛选。', '查询详情：弹窗展示费用明细列表。', '下载PDF：按勾选账单、当前筛选结果或全部账单下载PDF。'],
      },
    ],
  },
  {
    name: '权限管理',
    modules: [
      {
        name: '用户管理',
        path: '权限管理 > 用户管理',
        intro: '用于维护系统用户账号、组织、角色和状态。',
        problems: ['用户账号管理和密码重置入口不统一。', '过多按钮容易造成误操作。'],
        capabilities: ['只保留查询数据、重置密码、导出数据按钮。', '列表只读，不展示编辑、查看、删除。'],
        acceptance: ['用户管理界面删除编辑数据、查看详情、查看、编辑、删除入口。'],
      },
      {
        name: '角色管理',
        path: '权限管理 > 角色管理',
        intro: '用于维护角色基础信息、菜单权限、字段权限、查询条件权限和按钮权限。',
        problems: ['新增菜单或按钮后权限无法统一配置。', '不同角色能看哪些字段、能点哪些按钮不清楚。', '数据权限和页面权限分开维护导致口径不一致。'],
        capabilities: ['基础信息包含角色编号、角色名称、角色类型、状态、所属终端、数据权限、角色说明。', '权限配置包含菜单权限、字段管理、查询条件和按钮权限。'],
        acceptance: ['角色管理列表表头和数据对应。', '按钮权限文案准确，菜单新增后可在角色配置中勾选。'],
      },
      {
        name: '组织架构',
        path: '权限管理 > 组织架构',
        intro: '用于维护总部、大区、分公司、仓库、部门和小组组织数据。',
        problems: ['组织层级、负责人和启用状态缺少统一维护。', '查询条件中的所属总部、所属大区、所属部门需要下拉选择减少误录。'],
        capabilities: ['总部、大区、分公司、仓库、部门、小组页面均支持启用状态下拉。', '地址和备注字段放在弹窗底部。', '部门负责人、组长字段使用下拉框。'],
        acceptance: ['大区所属总部、分公司所属大区、部门所属总部、小组所属部门查询条件均为下拉框。'],
      },
    ],
  },
];

const globalRequirements = [
  ['列表表头固定', '所有列表表头在表格纵向滚动时固定在顶部，不跟随滚动条离开视图。'],
  ['列表底部汇总固定', '每列统计汇总固定在表格底部，不跟随表格内容滚动，不额外占用列表高度。'],
  ['默认分页', '所有列表默认每页100条数据，分页下拉支持100/500/1000/5000条，最高支持5000条数据一页。'],
  ['查询与列表设置', '查询条件按钮和列表字段按钮为文字按钮，点击后展示配置弹窗；每行显示数量使用高度与文字一致的下拉框。'],
  ['工具栏排版', '查询数据、新增数据、导出数据等按钮位于查询区下方；表头设置位于按钮底部并靠近按钮，减少列表高度占用。'],
  ['弹窗反馈', '所有功能按钮点击必须有弹窗或明确提示；删除、取消等高风险操作使用简单确认弹窗。'],
  ['备注字段', '全系统备注多行文本框宽度为弹窗50%，并放在弹窗底部最后区域。'],
  ['下拉选择', '启用状态、所属国家、所属总部、所属大区、所属部门、币别编号等固定枚举字段使用下拉选择。'],
  ['多语言', '菜单、按钮、查询条件、表头、状态、弹窗标题和说明内容支持中文、英文、法文、葡萄牙语切换；个人中心语言切换增加葡萄牙语。'],
  ['必填标记', '新增、编辑弹窗中编号、名称、客户、仓库、货区、件数、状态、币别、金额、时间等关键业务字段显示红色必填标记并具备基础必填校验。'],
];

function renderModule(module, index) {
  const detail = resolveModuleDetail(module);
  const optional = [];
  optional.push(`<h4>查询条件说明</h4>${renderQueryFields(detail)}`);
  optional.push(`<h4>列表字段说明</h4>${renderListFields(detail)}`);
  optional.push(`<h4>表单/弹窗字段说明</h4>${renderFormFields(module, detail)}`);
  optional.push(`<h4>必填字段说明</h4>${list(inferRequiredFields(module))}`);
  if (!module.hideButtons && detail.buttons.length) optional.push(`<h4>按钮功能说明</h4>${renderButtons(module, detail)}`);
  if (module.interactions) optional.push(`<h4>特殊交互</h4>${list(module.interactions)}`);
  const acceptanceHtml = (!module.hideAcceptance && module.acceptance && module.acceptance.length)
    ? `<h4>验收要点</h4>${list(module.acceptance)}`
    : '';
  return `
    <section class="module">
      <h3>${index}. ${esc(module.name)}</h3>
      <p><strong>菜单路径：</strong>${esc(module.path)}</p>
      <h4>界面预览</h4>
      ${renderModulePreview(module, detail, index)}
      <h4>功能说明</h4>
      <p>${esc(module.intro)}</p>
      <h4>能解决的问题</h4>
      ${list(module.problems)}
      <h4>核心能力</h4>
      ${list(module.capabilities)}
      ${acceptanceHtml}
      ${optional.join('\n')}
    </section>
  `;
}

function buildHtml() {
  let moduleNo = 1;
  const groupHtml = moduleGroups.map((group) => `
    <h2>${esc(group.name)}</h2>
    ${group.modules.map((module) => renderModule(module, moduleNo++)).join('\n')}
  `).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>好利航国际物流管理系统 - 详细需求说明书</title>
<style>
  body{font-family:"Microsoft YaHei",Arial,sans-serif;margin:0;background:#f8fafc;color:#1e293b;line-height:1.75}
  .page{max-width:1180px;margin:0 auto;padding:42px;background:#fff}
  h1{text-align:center;color:#1d4ed8;font-size:30px;margin:0 0 12px}
  .meta{text-align:center;color:#64748b;margin-bottom:28px}
  h2{font-size:22px;color:#1d4ed8;border-left:6px solid #2563eb;background:#eff6ff;padding:10px 14px;margin-top:34px}
  h3{font-size:18px;color:#0f172a;margin-top:26px;border-bottom:1px solid #e2e8f0;padding-bottom:6px}
  h4{font-size:15px;color:#1e40af;margin:16px 0 6px}
  p,li,td,th{font-size:13px}
  ul{margin:8px 0 12px 22px;padding:0}
  table{width:100%;border-collapse:collapse;margin:12px 0 18px;table-layout:auto}
  .doc-table-wrap{width:100%;overflow-x:auto;margin:12px 0 18px}
  .doc-table-wrap table{width:max-content;min-width:100%;margin:0}
  .doc-table-wrap th,.doc-table-wrap td{min-width:108px}
  th{background:#1d4ed8;color:#fff;text-align:left;padding:8px;border:1px solid #bfdbfe}
  td{padding:8px;border:1px solid #dbeafe;vertical-align:top}
  .toc{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:18px 0}
  .module{page-break-inside:avoid}
  .note{background:#fefce8;border:1px solid #fde68a;padding:12px;border-radius:8px;color:#713f12}
  .ui-preview{border:1px solid #bfdbfe;background:#f8fbff;border-radius:10px;padding:12px;margin:8px 0 16px;box-shadow:0 1px 0 rgba(37,99,235,.08)}
  .preview-top{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#eff6ff;border:1px solid #dbeafe;border-radius:8px;padding:8px 10px;color:#1e40af;font-weight:700}
  .preview-top em{font-style:normal;color:#64748b;font-weight:400;font-size:12px}
  .preview-toolbar{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
  .preview-btn{display:inline-block;border:1px solid #bfdbfe;border-radius:6px;padding:4px 8px;background:#fff;color:#1d4ed8;font-size:12px}
  .preview-btn.primary{background:#2563eb;color:#fff;border-color:#2563eb}
  .preview-query{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:6px 0 10px}
  .preview-query span{display:block;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:6px 8px;color:#64748b;font-size:12px}
  .preview-query.compact{grid-template-columns:1fr}
  .preview-scroll{width:100%;overflow-x:auto}
  .preview-table{margin:8px 0 10px}
  .preview-table th{background:#eff6ff;color:#334155;border-color:#bfdbfe;font-size:12px;white-space:nowrap}
  .preview-table td{background:#fff;font-size:12px;color:#64748b;white-space:nowrap}
  .preview-modal{border:1px dashed #93c5fd;border-radius:8px;background:#fff;padding:8px;margin-top:8px}
  .preview-modal-title{font-size:12px;font-weight:700;color:#1e40af;margin-bottom:6px}
  .preview-modal span{display:inline-block;margin:0 6px 6px 0;padding:3px 7px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px}
</style>
</head>
<body>
<div class="page">
  <h1>好利航国际物流管理系统详细需求说明书</h1>
  <div class="meta">版本：V1.5　生成日期：2026-06-13</div>

  <h2>1. 项目概述</h2>
  <p>好利航国际物流管理系统定位为面向国际货运全链路经营的数字化运营中台，围绕客户、订单、运单、仓储、产品、报价、费用、账单、组织权限和多语言协同建立统一的数据底座、流程底座和作业底座。系统以“业务在线化、作业标准化、数据资产化、经营智能化”为总体方向，将原本分散在表格、聊天记录、人工单据和岗位经验中的信息沉淀为可查询、可流转、可追踪、可复用的企业级数据资产，支撑好利航在跨区域、多口岸、多仓库、多角色协同场景下实现更高效、更透明、更可控的全球物流运营。</p>

  <h2>2. 建设目标</h2>
  ${list([
    '建设统一的国际物流业务中台，打通客户、产品、下单、运单、仓储、费用、账单和权限组织之间的数据链路，形成端到端闭环管理能力。',
    '构建标准化作业体系，将报关、入仓、理货、上托、计费、审核、账单、工单、无头件认领等关键动作沉淀为可配置、可追踪、可审计的线上流程。',
    '沉淀企业级主数据和经营数据资产，统一客户、人员、仓库、国家、港口、品名、币种、汇率、费用科目和多语言文案口径，为后续BI、风控和智能决策打基础。',
    '打造高效率列表和操作界面，通过固定表头、固定汇总、默认100条分页、最高5000条分页和紧凑工具栏提升高频查询、批量处理和跨岗位协同效率。',
    '强化全球化协同能力，支持中文、英文、法文、葡萄牙语等多语言界面，为海外仓、海外客服、客户自助查询和跨国团队协同提供统一体验。',
    '通过功能说明和需求说明沉淀页面用途、业务价值、按钮行为、字段规则和验收标准，形成可交付、可评审、可实施、可持续迭代的产品建设基线。',
  ])}

  <h2>3. 用户角色</h2>
  ${table(['角色', '主要职责', '核心页面'], [
    ['管理员', '配置菜单、角色、用户、组织、基础资料和多语言文案。', '权限管理、业务配置、基础资料'],
    ['业务员', '维护客户、录入订单、跟踪运单、发起报价或特价申请。', '客户管理、下单录入、运单查询、产品报价'],
    ['客服', '跟进客户订单、处理异常、协助认领无头件和查看运单详情。', '运单管理、工单管理、无头件认领'],
    ['仓库操作员', '入仓、拍照、无头件登记、理货、上托、出库。', '入仓操作、无头件认领、理货、上托、出库'],
    ['财务', '费用审核、账单生成、核销跟踪和汇率维护。', '费用管理、账单管理、汇率管理'],
    ['客户', '客户端下单、查询运单、打印标签、复制运单。', '客户端下单录入、运单查询'],
  ])}

  <h2>4. 全局页面与交互要求</h2>
  ${table(['要求项', '详细说明'], globalRequirements)}

  <h2>5. 功能模块详细需求</h2>
  ${groupHtml}

  <h2>6. 数据权限与日志要求</h2>
  ${list([
    '所有列表数据应按组织、角色、用户和数据权限范围控制可见性。',
    '角色管理需要支持菜单权限、字段权限、查询条件权限和按钮权限，新增菜单和按钮后必须同步出现在授权配置中。',
    '新增、编辑、删除、取消、审核、生成账单、生成预录单、导出、上传附件等操作需要记录操作人、操作时间、操作内容和来源页面。',
    '财务类字段、客户敏感资料、证照资料和权限配置应支持字段级授权。',
  ])}

  <h2>7. 弹窗与表单规范</h2>
  ${list([
    '新增、编辑、查看、审核、导出、上传、删除、取消、生成预录单、生成PDF等操作均通过弹窗或明确提示反馈。',
    '删除按钮使用简单确认弹窗，文案为“确实删除嘛”；取消按钮使用简单确认弹窗，文案为“是否确认取消数据”。',
    '备注类字段使用多行文本框，宽度为弹窗50%，位于底部最后区域。',
    '新增、编辑弹窗的重要字段需要显示红色必填标记，保存时应校验必填项。',
    '启用状态、审核状态、所属组织、所属国家、币别编号等枚举字段使用下拉框。',
    '弹窗标题必须包含操作名称和当前模块名称，底部按钮统一使用取消/确认或关闭。',
  ])}

  <h2>8. 报表、导出与文档要求</h2>
  ${list([
    '列表导出需要遵循当前字段显示设置，可选择是否包含隐藏列。',
    '账单管理生成PDF时应使用当前账单数据和费用明细，后续接入真实PDF模板。',
    '需求说明按钮展示当前页面的详细需求说明，功能说明按钮展示当前页面做什么、解决什么问题、谁使用、如何流转。',
    '本需求说明书提供HTML、Word和PDF格式，便于浏览、评审、归档和给开发测试使用。',
  ])}

  <h2>9. 验收清单</h2>
  ${list([
    '所有列表默认100条/页，最高支持5000条/页，表头固定，底部汇总固定。',
    '查询条件、列表字段、每行显示数量可配置，并且弹窗打开关闭正常。',
    '功能说明内容包含功能定位、解决问题、使用对象、核心能力、业务价值、使用流程和联动关系。',
    '需求说明内容覆盖页面布局、查询条件、列表字段、按钮、弹窗、权限、日志、多语言和验收点。',
    '仓库操作管理-国内存在独立“无头件”菜单，字段为到货仓库、货区、入仓件数、图片上传和保存按钮。',
    '无头件认领为列表界面，图片可预览，生成预录单弹窗字段完整。',
    '下单录入、入仓操作（一票一件）、入仓操作（一票多件）的附加服务文字后显示红色感叹号，鼠标移入展示收费标准和要求。',
    '个人中心语言切换增加葡萄牙语，刷新后保持语言状态。',
    '新增、编辑弹窗的重要字段显示红色必填标记。',
    '费用管理审核字段高亮，账单管理详情展示费用明细列表。',
    '角色管理基础信息、菜单权限、字段权限、查询条件权限和按钮权限显示完整。',
  ])}

  <h2>10. 后续接口建议</h2>
  ${list([
    '客户主数据接口：维护客户、联系人、销售/客服/结算归属和证照资料。',
    '运单接口：维护运单主表、货物明细、费用、附件、备注、操作日志和状态流转。',
    '仓库接口：维护入仓、无头件、图片、认领、预录单、理货、上托、出库数据。',
    '财务接口：维护费用审核、账单、PDF生成、核销、汇率和币种换算。',
    '权限接口：维护用户、角色、菜单、字段、查询条件、按钮和数据权限。',
    '多语言接口：维护菜单、按钮、字段、状态、提示语和说明文案的中文、英文、法文、葡萄牙语翻译。',
  ])}
</div>
</body>
</html>`;
}

function buildWordHtml(html) {
  const wordCss = `
<style>
  body.word-doc{background:#fff!important;color:#111827!important;line-height:1.55!important}
  body.word-doc .page{max-width:none!important;margin:0!important;padding:0!important;background:#fff!important}
  body.word-doc h1{font-size:24pt!important;color:#1d4ed8!important;text-align:center!important;border-bottom:2px solid #1d4ed8!important;padding-bottom:8px!important;margin:0 0 8px!important}
  body.word-doc .meta{font-size:10pt!important;color:#475569!important;text-align:center!important;margin:0 0 16px!important}
  body.word-doc h2{font-size:16pt!important;color:#1d4ed8!important;background:#eff6ff!important;border-left:5px solid #2563eb!important;border-bottom:1px solid #bfdbfe!important;padding:6px 8px!important;margin:18px 0 10px!important;page-break-after:avoid!important}
  body.word-doc h3{font-size:13.5pt!important;color:#0f172a!important;border-bottom:1px solid #cbd5e1!important;padding-bottom:4px!important;margin:16px 0 8px!important;page-break-after:avoid!important}
  body.word-doc h4{font-size:11pt!important;color:#1e40af!important;margin:10px 0 4px!important;page-break-after:avoid!important}
  body.word-doc p,body.word-doc li{font-size:10pt!important;line-height:1.55!important;margin:3px 0 5px!important}
  body.word-doc ul{margin:4px 0 8px 18px!important;padding:0!important}
  body.word-doc .doc-table-wrap{width:100%!important;margin:6px 0 10px!important}
  body.word-doc table{width:100%!important;border-collapse:collapse!important;table-layout:auto!important;margin:6px 0 10px!important;page-break-inside:auto!important}
  body.word-doc .doc-table-wrap table{width:100%!important;min-width:0!important;margin:0!important;table-layout:auto!important}
  body.word-doc tr{page-break-inside:avoid!important}
  body.word-doc th{font-size:8.5pt!important;line-height:1.3!important;background:#dbeafe!important;color:#0f172a!important;border:1px solid #93c5fd!important;padding:3px 4px!important;font-weight:bold!important;text-align:left!important}
  body.word-doc td{font-size:8.5pt!important;line-height:1.3!important;border:1px solid #bfdbfe!important;padding:3px 4px!important;vertical-align:top!important;word-break:normal!important}
  body.word-doc .note{font-size:10pt!important;background:#fff7ed!important;border:1px solid #fdba74!important;color:#7c2d12!important;padding:8px!important;margin:8px 0 14px!important}
  body.word-doc .module{page-break-inside:auto!important;margin-bottom:14px!important}
  body.word-doc .ui-preview{border:1px solid #93c5fd!important;background:#f8fafc!important;border-radius:0!important;box-shadow:none!important;padding:8px!important;margin:6px 0 10px!important;page-break-inside:avoid!important}
  body.word-doc .preview-top{display:block!important;background:#eff6ff!important;border:1px solid #bfdbfe!important;border-radius:0!important;padding:5px 6px!important;color:#1e40af!important;font-weight:bold!important}
  body.word-doc .preview-top em{display:block!important;font-style:normal!important;color:#64748b!important;font-size:8.5pt!important;font-weight:normal!important;margin-top:2px!important}
  body.word-doc .preview-toolbar{display:block!important;margin:6px 0!important}
  body.word-doc .preview-btn,body.word-doc .preview-query span,body.word-doc .preview-modal span{display:inline-block!important;border:1px solid #bfdbfe!important;border-radius:0!important;background:#fff!important;color:#1e40af!important;font-size:8.5pt!important;padding:2px 5px!important;margin:0 3px 3px 0!important}
  body.word-doc .preview-btn.primary{background:#dbeafe!important;color:#1e3a8a!important;border-color:#93c5fd!important}
  body.word-doc .preview-query{display:block!important;margin:4px 0 6px!important}
  body.word-doc .preview-scroll{width:100%!important;overflow:visible!important}
  body.word-doc .preview-table{table-layout:auto!important;margin:4px 0 6px!important}
  body.word-doc .preview-table th,body.word-doc .preview-table td{font-size:8pt!important;padding:3px!important;white-space:normal!important}
  body.word-doc .preview-modal{border:1px dashed #93c5fd!important;border-radius:0!important;background:#fff!important;padding:6px!important;margin-top:6px!important}
  body.word-doc .preview-modal-title{font-size:9pt!important;color:#1e40af!important;font-weight:bold!important;margin-bottom:4px!important}
  body.word-doc .word-preview-image-wrap{margin:6px 0 10px!important;page-break-inside:avoid!important}
  body.word-doc .word-preview-image{width:680px!important;max-width:100%!important;height:auto!important;border:1px solid #93c5fd!important}
</style>`;
  return html
    .replace('<body>', '<body class="word-doc">')
    .replace('</head>', `${wordCss}\n</head>`);
}

function findBrowserExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    path.join(process.env.ProgramFiles || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function generatePdfFromHtml(sourceHtmlPath, targetPdfPath) {
  const browser = findBrowserExecutable();
  if (!browser) {
    console.warn('warning: Chrome/Edge not found, PDF was not generated.');
    return null;
  }
  const result = spawnSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--allow-file-access-from-files',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=3000',
    '--no-pdf-header-footer',
    `--print-to-pdf=${targetPdfPath}`,
    pathToFileURL(sourceHtmlPath).href,
  ], { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`PDF generation failed: ${result.stderr || result.stdout || `exit ${result.status}`}`);
  }
  return targetPdfPath;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForChrome(port, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  const url = `http://127.0.0.1:${port}/json/version`;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch (err) {
      // Chrome may still be starting.
    }
    await wait(150);
  }
  throw new Error('Chrome DevTools endpoint did not start in time.');
}

function createCdpClient(webSocketUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(webSocketUrl);
    let nextId = 1;
    const pending = new Map();
    const listeners = new Map();
    const timeout = setTimeout(() => reject(new Error('Chrome DevTools WebSocket timeout.')), 8000);

    function send(method, params = {}) {
      const id = nextId++;
      return new Promise((res, rej) => {
        pending.set(id, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    function once(method) {
      return new Promise((res) => {
        const list = listeners.get(method) || [];
        list.push(res);
        listeners.set(method, list);
      });
    }

    ws.addEventListener('open', () => {
      clearTimeout(timeout);
      resolve({
        send,
        once,
        close() { ws.close(); },
      });
    });
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data || '{}'));
      if (message.id && pending.has(message.id)) {
        const item = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) item.reject(new Error(message.error.message || 'CDP error'));
        else item.resolve(message.result);
        return;
      }
      if (message.method && listeners.has(message.method)) {
        const list = listeners.get(message.method) || [];
        listeners.delete(message.method);
        list.forEach((listener) => listener(message.params || {}));
      }
    });
    ws.addEventListener('error', (event) => {
      clearTimeout(timeout);
      reject(event.error || new Error('Chrome DevTools WebSocket error.'));
    });
  });
}

async function capturePreviewImages(sourceHtmlPath) {
  const browser = findBrowserExecutable();
  if (!browser || typeof WebSocket === 'undefined') return {};

  const port = 9300 + Math.floor(Math.random() * 400);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hlh-preview-chrome-'));
  const chrome = spawn(browser, [
    '--headless=new',
    '--disable-gpu',
    '--allow-file-access-from-files',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], { stdio: 'ignore' });

  let client = null;
  try {
    await waitForChrome(port);
    const targetsResponse = await fetch(`http://127.0.0.1:${port}/json/list`);
    const targets = await targetsResponse.json();
    const pageTarget = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
    if (!pageTarget) throw new Error('Chrome page target was not found.');
    client = await createCdpClient(pageTarget.webSocketDebuggerUrl);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 1800,
      deviceScaleFactor: 2,
      mobile: false,
    });
    const loadEvent = client.once('Page.loadEventFired');
    await client.send('Page.navigate', { url: pathToFileURL(sourceHtmlPath).href });
    await loadEvent;
    await client.send('Runtime.evaluate', {
      expression: 'document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true',
      awaitPromise: true,
    });
    await wait(300);

    const evaluateResult = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `Array.from(document.querySelectorAll('.ui-preview')).map(function(el){
        var rect = el.getBoundingClientRect();
        return {
          id: el.getAttribute('data-preview-id') || '',
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height
        };
      })`,
    });
    const elements = (evaluateResult.result && evaluateResult.result.value) || [];
    const images = {};
    for (const item of elements) {
      if (!item.id || item.width < 10 || item.height < 10) continue;
      const screenshot = await client.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: {
          x: Math.max(0, Math.floor(item.x) - 2),
          y: Math.max(0, Math.floor(item.y) - 2),
          width: Math.ceil(item.width) + 4,
          height: Math.ceil(item.height) + 4,
          scale: 1,
        },
      });
      if (screenshot && screenshot.data) images[item.id] = screenshot.data;
    }
    return images;
  } finally {
    if (client) client.close();
    chrome.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (err) {
      // Temporary Chrome profile cleanup is best-effort.
    }
  }
}

function replacePreviewsWithImages(html, previewImages) {
  return html.replace(/<!-- PREVIEW_START:(preview-\d+) -->[\s\S]*?<!-- PREVIEW_END:\1 -->/g, (match, id) => {
    const image = previewImages[id];
    if (!image) return match;
    return `
      <div class="word-preview-image-wrap">
        <img class="word-preview-image" src="data:image/png;base64,${image}" width="680" alt="界面预览" />
      </div>
    `;
  });
}

async function main() {
  const html = buildHtml().replace(/[ \t]+$/gm, '');
  fs.writeFileSync(htmlPath, html, 'utf8');
  let wordSourceHtml = html;
  const previewCount = (html.match(/data-preview-id="/g) || []).length;
  if (previewCount <= 28) {
    try {
      wordSourceHtml = replacePreviewsWithImages(html, await capturePreviewImages(htmlPath));
    } catch (err) {
      console.warn(`warning: preview screenshots were not embedded: ${err.message}`);
    }
  } else {
    console.log(`info: ${previewCount} previews detected; keeping styled HTML previews in Word to avoid oversized embedded screenshots.`);
  }
  const docxHtml = buildWordHtml(wordSourceHtml).replace(/[ \t]+$/gm, '');
  const docx = await HTMLtoDOCX(docxHtml, null, {
    title: '好利航国际物流管理系统详细需求说明书',
    subject: '详细需求说明书',
    creator: 'Codex',
    font: 'Microsoft YaHei',
    fontSize: 20,
    lang: 'zh-CN',
    pageSize: { width: 11906, height: 16838 },
    margins: { top: 720, right: 720, bottom: 720, left: 720 },
    footer: true,
    pageNumber: true,
  });
  let finalDocxPath = null;
  const candidates = [docxPath, fallbackDocxPath, datedDocxPath];
  let lastBusyError = null;
  for (const candidate of candidates) {
    try {
      fs.writeFileSync(candidate, docx);
      finalDocxPath = candidate;
      break;
    } catch (err) {
      if (err && err.code === 'EBUSY') {
        lastBusyError = err;
        continue;
      }
      throw err;
    }
  }
  if (!finalDocxPath) throw lastBusyError;
  const finalPdfPath = generatePdfFromHtml(htmlPath, pdfPath);
  console.log(`created: ${htmlPath}`);
  console.log(`created: ${finalDocxPath}`);
  if (finalPdfPath) console.log(`created: ${finalPdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
