# S1-S4 开发阶段门禁与验收标准补强 Spec

## Why

当前 SSOT 文档体系中，S1/S2/S3/S4 的阶段定义停留在"名称+范围+目标"层面，缺少可执行、可验收、可拒收的门禁标准。具体问题：

1. **01 阶段定义只有名称和一句话**，没有模块成熟度分级、端到端链路要求、数据/指标要求、AI 治理要求、权限要求
2. **12 发布门禁只有5行简单条件**，没有按阶段细分的门禁
3. **02 模块树缺少成熟度标注**，无法区分 skeleton/crud_ready/workflow_ready/production_ready
4. **10 AI 执行规范缺少阶段维度的治理约束**，哪些动作在哪个阶段允许什么模式不清晰
5. **00 阶段定义措辞仍有"首期核心可交付"等旧表述**，容易被误读为产品迭代版本
6. **六个结果指标未接入阶段体系**，没有明确哪个阶段开始可采集、哪个阶段进入驾驶舱

## What Changes

- **00_README**：修正阶段定义措辞，消除"产品迭代"感，增加"存在≠完成"工程规则
- **01_产品范围与阶段地图**：为 S1/S2/S3/S4 每个阶段补齐门禁定义（阶段目标、必须完成能力、核心端到端链路、模块成熟度要求、AI 治理要求、指标/数据要求、测试与验收要求、非本阶段事项），新增"模块成熟度分级定义"小节，新增"六个结果指标与阶段映射"小节，新增"当前项目状态判断"小节，新增"存在≠完成"工程规则
- **02_业务域与模块树**：为每个模块补成熟度标注列（skeleton/crud_ready/workflow_ready/production_ready）
- **10_AI_Agent_自动化与集成执行规范**：新增"AI 执行治理与阶段关系"小节，明确每个阶段允许的执行模式、强制审批动作、必须支持人工接管/回滚的动作
- **12_测试_验收_部署与迁移**：补齐按阶段细分的测试验收要求，新增"阶段门禁总表"小节
- **12A_原子TEST_ACPT与发布门禁展开**：补齐按阶段细分的发布门禁检查项

## Impact

- Affected specs: 00_README, 01_产品范围与阶段地图, 02_业务域与模块树, 10_AI_Agent_自动化与集成执行规范, 12_测试_验收_部署与迁移, 12A_原子TEST_ACPT与发布门禁展开
- Affected code: 无代码变更（本次为纯文档整改）
- 不得与 03（REQ 阶段归属）、04（RTM 闭环）、05/06/07/08/09（事实定义）冲突

## ADDED Requirements

### Requirement: 模块成熟度分级定义

系统 SHALL 在 01 文档中统一定义模块成熟度分级，并在 02 文档中为每个模块标注当前成熟度：

| 级别 | 定义 | 判定标准 |
| --- | --- | --- |
| `skeleton` | 只有骨架/占位，不能视为完成 | 路由存在但页面无实质内容；或 Entity 存在但无完整 CRUD API |
| `crud_ready` | 基础增删改查可用 | 列表/详情/创建/编辑 API 可调通，基础数据可持久化，但关键业务流程未跑通 |
| `workflow_ready` | 关键业务流程可跑通 | 状态机流转正确，跨模块关联可走通，审批/通知等流程节点可用 |
| `production_ready` | 具备上线级可靠性 | 权限/审计/异常处理/并发版本控制/观测能力齐备，测试覆盖达标 |

#### Scenario: AI 编程工具可据此判断模块完成度

- **WHEN** AI 编程工具读取 02 文档
- **THEN** 可清晰看到每个模块的当前成熟度级别
- **AND** 不会把 skeleton 级别的模块误判为已完成

### Requirement: S1 阶段门禁

系统 SHALL 在 01 文档中为 S1 补齐以下门禁定义：

**阶段目标**：建立多租户基础底座、前链路经营闭环（客户→线索→商机→会话→工单）、AI 运行时与治理能力

**必须完成能力**：
- AUTH/ORG/USR/SYS/AUD：多租户基础底座
- CM/LM/OM：前链路经营闭环
- CNV/TK/TSK/NTF/CHN：沟通与服务闭环
- AI/COR/CMEM/ART/APC/TKC/RBC：AI 运行时与治理

**核心端到端链路**：
1. 线索录入→分配→跟进→转化客户+商机（LM→CM+OM）
2. 会话接入→回复→转工单→关闭会话（CNV→TK）
3. 工单创建→分派→处理→解决→关闭（TK 全状态）
4. AI 智能回复→人工确认→发送（AI suggest 模式）

**模块成熟度要求**：
- AUTH/ORG/USR/SYS/AUD：production_ready
- CM/LM/OM/CNV/TK/TSK/NTF/CHN：workflow_ready
- AI/COR/CMEM：workflow_ready（智能回复可用，Agent Registry 可用）
- ART/APC/TKC/RBC：crud_ready（运行时基础设施可用，但非全量 production_ready）

**AI 治理要求**：
- 仅允许 suggest 模式（AI 输出必须经人工确认落地）
- 审批中心可用但非强制（APC crud_ready）
- 接管/回滚能力可用但非强制（TKC/RBC crud_ready）

**指标/数据要求**：
- 客户/线索/商机/会话/工单核心数据可持久化
- 审计日志可查询
- 驾驶舱可展示基础摘要

**测试与验收要求**：
- S1 must_for_release=Y 的 REQ 全部通过 ACPT
- 4 条核心端到端链路全部可 UI 操作完成
- 状态机非法迁移全部被拒绝
- 多租户隔离验证通过

**非本阶段事项**：
- 报价/合同/订单/付款/订阅（S2）
- 知识库/经营驾驶舱增强/自动化（S2）
- 完整商业化闭环（S3）
- 国际化/私有化（S4）

#### Scenario: S1 门禁可被 AI 编程工具执行

- **WHEN** AI 编程工具判断 S1 是否完成
- **THEN** 可按上述门禁逐项检查
- **AND** 每项都有明确的通过/不通过标准

### Requirement: S2 阶段门禁

系统 SHALL 在 01 文档中为 S2 补齐以下门禁定义：

**阶段目标**：在 S1 基础上补齐成交与成交后衔接主干，从可用走向可成交与可运营

**必须完成能力**：
- QT/CT：成交前衔接（报价→合同）
- ORD 最小内核/PAY 最小内核/SUB 最小内核：成交后衔接主干
- CSM：客户成功基础能力
- KB 最小版：知识库
- DASH 增强：经营驾驶舱
- AUTO 触发式主干：触发式自动化

**核心端到端链路**：
1. 商机赢单→创建报价→审批→发送→创建合同→审批→签署（OM→QT→CT）
2. 合同签署→创建订单→确认→创建付款→付款确认→订单激活→开通订阅（CT→ORD→PAY→SUB）
3. 订阅开通→自动纳入客户成功→健康度评估→续费提醒（SUB→CSM）
4. AI 审批执行：高风险动作必须审批后才可落地（AI approval 模式）

**模块成熟度要求**：
- S1 全部模块：至少维持原成熟度，核心模块升级至 production_ready
- QT/CT：workflow_ready（审批流可跑通，签署可走通）
- ORD/PAY/SUB 最小内核：workflow_ready（创建/确认/激活可跑通）
- CSM：crud_ready（健康度评估可用，续费提醒可用）
- KB：crud_ready（分类/条目/搜索可用，AI 问答可用）
- DASH：crud_ready（销售看板+服务看板可用）
- AUTO：crud_ready（触发式流程可创建和执行）

**AI 治理要求**：
- suggest + assist 模式可用
- approval 模式必须对高风险动作强制（合同签署、订单确认、付款确认）
- 审批中心必须 workflow_ready（APC 从 crud_ready 升级）
- 接管/回滚必须 workflow_ready（TKC/RBC 从 crud_ready 升级）
- AI Agent Registry 必须支持 activate/pause/archive

**指标/数据要求**：
- 报价/合同/订单/付款/订阅数据可持久化
- 成交链路转化率可采集（线索→商机→报价→合同→订单→付款→开通）
- 首响时间、线索漏跟进率可从驾驶舱查看
- 会话转商机率可采集

**测试与验收要求**：
- S2 must_for_release=Y 的 REQ 全部通过 ACPT
- 成交链路 E2E 可 UI 操作完成（商机赢单→报价→合同→订单→付款→订阅）
- 高风险动作未经审批不可落地
- 审批/接管/回滚流程可走通

**非本阶段事项**：
- 完整商业化闭环（账单/发票/对账/欠费/续费/席位管理/停服恢复）（S3）
- 套餐/额度策略（S3）
- 开放 API/Webhook/SDK/移动端（S3）
- 国际化/私有化（S4）

### Requirement: S3 阶段门禁

系统 SHALL 在 01 文档中为 S3 补齐以下门禁定义：

**阶段目标**：在 S2 成交后衔接主干基础上，补齐完整商业化闭环与平台化能力

**必须完成能力**：
- PLAN/BILL/INV：完整商业化闭环
- ORD/PAY/SUB 完整扩展：退款/对账/停服/续费/席位管理
- INT/PLT：平台化扩展（集成/Webhook/开放 API/移动端）
- DEPLOY 基础：私有化部署画像

**核心端到端链路**：
1. 订阅→账单生成→支付→对账→发票开具→投递（SUB→BILL→PAY→INV）
2. 欠费→催缴→停服→恢复（BILL→SUB）
3. 续费→确认→支付→应用（CSM→SUB→PAY→BILL）
4. 集成配置→集成流→字段映射→Webhook 投递（INT 全链路）

**模块成熟度要求**：
- S1/S2 全部模块：至少 workflow_ready，核心模块 production_ready
- PLAN/BILL/INV：workflow_ready
- ORD/PAY/SUB 完整扩展：workflow_ready
- INT/PLT：crud_ready
- DEPLOY：crud_ready

**AI 治理要求**：
- suggest + assist + auto 模式可用（auto 仅限低风险动作）
- approval 模式对 P0/P1 风险动作强制
- AI 质检可用（Quality Agent auto 模式）
- 回滚/接管必须 production_ready

**指标/数据要求**：
- 账单/支付/发票数据可持久化
- 报价/合同周转时间可采集
- 成交后开通/交接时间可采集
- 工单首次解决率/SLA 达标率可采集
- 全链路经营结果看板可用

**测试与验收要求**：
- S3 must_for_release=Y 的 REQ 全部通过 ACPT
- 商业化闭环 E2E 可 UI 操作完成
- 欠费停服恢复链路可走通
- 集成流可配置和执行

**非本阶段事项**：
- 国际化/多语言/多区域（S4）
- 私有化离线激活/完整运维（S4）
- 规模化 AI 编排/开发者生态（S4）

### Requirement: S4 阶段门禁

系统 SHALL 在 01 文档中为 S4 补齐以下门禁定义：

**阶段目标**：在 S3 基础上补齐全球化、多部署形态、规模化 AI 编排与开发者生态

**必须完成能力**：
- I18N：多语言/多区域/合规
- DEPLOY 完整：私有化/离线激活/迁移工具
- 规模化 AI 编排：Orchestrate Agent/Insight Agent
- 开发者生态：应用市场/开发者中心/复杂集成流

**核心端到端链路**：
1. 多语言切换→区域策略→合规同意→数据主体请求（I18N 全链路）
2. 私有化部署→离线激活→迁移批次→回滚（DEPLOY 全链路）
3. AI 编排→多 Agent 协作→审批→执行→回滚（ART 全链路）

**模块成熟度要求**：
- S1/S2/S3 全部模块：production_ready
- I18N：workflow_ready
- DEPLOY 完整：workflow_ready
- Orchestrate Agent/Insight Agent：crud_ready

**AI 治理要求**：
- 全部四种执行模式可用
- 规模化 AI 编排必须经过 approval 模式
- AI 审计与可观测性 production_ready
- 字段权限回滚必须审批

**指标/数据要求**：
- 六个结果指标全部可采集和看板化
- AI 执行指标（调用量/成功率/成本/审批通过率/回滚率/接管率）可观测
- 多区域数据合规可审计

**测试与验收要求**：
- S4 must_for_release=Y 的 REQ 全部通过 ACPT
- 国际化全链路可走通
- 私有化部署+迁移+回滚可走通
- 字段权限回滚可走通

**非本阶段事项**：
- 自研 ERP/财务总账（不在终局范围内）
- 自研呼叫中心底层交换机（不在终局范围内）
- 自研电子签平台（不在终局范围内）

### Requirement: 六个结果指标与阶段映射

系统 SHALL 在 01 文档中新增"六个结果指标与阶段映射"小节，明确：

| 结果指标 | 开始可采集阶段 | 进入驾驶舱阶段 | 直接支撑模块 |
| --- | --- | --- | --- |
| 首响时间 | S1 | S2 | CNV, DASH |
| 线索漏跟进率 | S1 | S2 | LM, DASH |
| 会话转商机率 | S1 | S2 | CNV, OM, DASH |
| 报价/合同周转时间 | S2 | S2 | QT, CT, DASH |
| 成交后开通/交接时间 | S2 | S3 | ORD, SUB, DASH |
| 工单首次解决率/SLA 达标率 | S1 | S2 | TK, DASH |

#### Scenario: 结果指标与阶段建设可追踪

- **WHEN** 读者查看 01 文档
- **THEN** 可清晰看到每个结果指标在哪个阶段开始可采集
- **AND** 可看到哪个阶段开始在驾驶舱/看板中展示
- **AND** 可看到哪些模块直接支撑这些指标

### Requirement: 当前项目状态判断

系统 SHALL 在 01 文档中新增"当前项目状态判断"小节，明确写出：

- 当前判断：S1 基本完成（核心模块 workflow_ready，基础底座 production_ready）
- S2 已有雏形但未达到阶段完成（QT/CT/ORD/PAY 后端+前端已就绪，但端到端链路和门禁未全部通过）
- S3/S4 存在规划与局部骨架，不应误判为当前阶段完成

#### Scenario: 项目状态判断不被误读

- **WHEN** 读者查看 01 文档
- **THEN** 可清晰看到当前项目处于哪个阶段
- **AND** 不会把"有雏形"误判为"已完成"

### Requirement: "存在≠完成"工程规则

系统 SHALL 在 01 文档中新增"工程规则"小节，明确：

1. 页面存在不等于流程完成
2. API 存在不等于模块完成
3. CRUD 完成不等于 workflow_ready
4. workflow_ready 不等于 production_ready
5. 模块代码存在不等于阶段完成
6. 任何模块的完成判定必须以门禁标准为准，不得以"代码已写"作为完成依据

#### Scenario: AI 编程工具不会误判完成度

- **WHEN** AI 编程工具判断某模块是否完成
- **THEN** 必须以门禁标准中的成熟度级别为准
- **AND** 不得以"代码文件存在"或"API 可调通"作为唯一判定依据

### Requirement: AI 执行治理与阶段关系

系统 SHALL 在 10 文档中新增"AI 执行治理与阶段关系"小节，明确每个阶段的 AI 治理约束：

| 阶段 | 允许的执行模式 | 强制审批动作 | 必须支持接管 | 必须支持回滚 | 必须审计 |
| --- | --- | --- | --- | --- | --- |
| S1 | suggest | 无强制 | 可用非强制 | 可用非强制 | 全部 AI 动作 |
| S2 | suggest + assist + approval | 合同签署/订单确认/付款确认 | 强制 | 强制 | 全部 AI 动作 |
| S3 | suggest + assist + auto + approval | P0/P1 风险动作 | 强制 | 强制 | 全部 AI 动作 |
| S4 | 全部模式 | P0 风险动作+字段权限回滚 | 强制 | 强制 | 全部 AI 动作+可观测 |

#### Scenario: AI 执行治理可按阶段约束

- **WHEN** AI 编程工具在某个阶段实现 AI 功能
- **THEN** 可据此判断该阶段允许哪些执行模式
- **AND** 可判断哪些动作必须强制审批

### Requirement: 02 模块成熟度标注

系统 SHALL 在 02 文档的模块编码总表中新增"当前成熟度"列，为每个模块标注当前成熟度级别：

| 模块 | 当前成熟度 | 说明 |
| --- | --- | --- |
| AUTH/ORG/USR/SYS/AUD | production_ready | S1 基线，已具备上线级可靠性 |
| CM/LM/OM/CNV/TK/TSK/NTF/CHN | workflow_ready | S1 基线，关键业务流程可跑通 |
| AI/COR/CMEM | workflow_ready | S1 基线，智能回复和客户记忆可用 |
| ART/APC/TKC/RBC | crud_ready | S1 基线，运行时基础设施可用 |
| QT/CT | workflow_ready | S2 已实现，审批流和签署可跑通 |
| ORD/PAY | crud_ready→workflow_ready | S2 部分实现，后端+前端已就绪 |
| SUB | skeleton→crud_ready | S2 最小内核待实现 |
| CSM/KB/DASH/AUTO | skeleton | S2 待实现 |

### Requirement: 12 阶段门禁总表

系统 SHALL 在 12 文档中新增"阶段门禁总表"小节，按阶段汇总门禁检查项：

| 阶段 | 模块成熟度门禁 | 端到端链路门禁 | AI 治理门禁 | 指标门禁 | 测试门禁 |
| --- | --- | --- | --- | --- | --- |
| S1 | 基础底座 production_ready，经营闭环 workflow_ready | 4 条核心链路 | suggest 模式可用 | 核心数据可持久化 | must_for_release=Y 全通过 |
| S2 | 成交链路 workflow_ready | 成交链路 E2E | approval 模式强制 | 成交转化率可采集 | must_for_release=Y 全通过 |
| S3 | 商业化闭环 workflow_ready | 商业化 E2E | auto 模式可用 | 六指标中五项可采集 | must_for_release=Y 全通过 |
| S4 | 全模块 production_ready | 国际化+私有化 E2E | 全模式可用 | 六指标全部可看板化 | must_for_release=Y 全通过 |

### Requirement: 12A 阶段发布门禁细化

系统 SHALL 在 12A 文档的"发布门禁与迁移检查"中，将现有的单行阶段门禁展开为按阶段细化的检查项：

**S1 发布门禁**：
- AUTH/CM/LM/OM/CNV/TK 主链 TEST+ACPT 全绿
- 4 条核心端到端链路可 UI 操作完成
- 多租户隔离验证通过
- 审计日志可查询
- 驾驶舱基础摘要可展示

**S2 发布门禁**：
- S1 门禁全部维持
- AI/QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO 补齐 TEST+ACPT
- 成交链路 E2E 可 UI 操作完成
- 高风险动作审批强制生效
- 审批/接管/回滚流程可走通
- 成交转化率可采集

**S3 发布门禁**：
- S2 门禁全部维持
- PLAN/BILL/INV/INT/PLT 补齐 TEST+ACPT
- 商业化闭环 E2E 可 UI 操作完成
- 欠费停服恢复链路可走通
- AI auto 模式可用且受控

**S4 发布门禁**：
- S3 门禁全部维持
- I18N/DEPLOY/字段权限补齐 TEST+ACPT
- 国际化全链路可走通
- 私有化部署+迁移+回滚可走通
- 六个结果指标全部可看板化

## MODIFIED Requirements

### Requirement: 00 阶段定义措辞修正

原 00_README 第4节阶段定义：

| 阶段 | 定义 | 对应历史口径 |
| --- | --- | --- |
| S1 | 首期核心可交付 | 当前 P0 冻结实现级范围 |
| S2 | 首期完整版 / 增强版 | legacy P1 |
| S3 | 业务扩展版 | legacy P2 |
| S4 | 终局规模版 | legacy P3 + FINAL-only 规模化能力 |

修改为：

| 阶段 | 定义 | 对应历史口径 |
| --- | --- | --- |
| S1 | 基础底座与前链路主干 | 当前 P0 冻结实现级范围 |
| S2 | 成交与成交后衔接主干 | legacy P1 |
| S3 | 商业化与平台化扩展 | legacy P2 |
| S4 | 规模化与全球化 | legacy P3 + FINAL-only 规模化能力 |

并在该节增加说明：S1/S2/S3/S4 是完整成熟 MOY 的开发建设阶段，不是产品迭代版本，也不是不完整产品的分步发布。

### Requirement: 01 阶段落地路径状态标注增强

原 01 第5.1节 S1 状态为"已完成"，修改为更精确的表述：

- S1：当前状态=**基本完成**（核心模块 workflow_ready，基础底座 production_ready；但部分模块尚未达到 production_ready）
- S2：当前状态=**已有雏形，未达到阶段完成**（QT/CT 后端+前端已就绪，ORD/PAY 后端+前端已就绪，但端到端链路和门禁未全部通过）
- S3：当前状态=**规划与局部骨架**（不应误判为当前阶段完成）
- S4：当前状态=**规划与局部骨架**（不应误判为当前阶段完成）

## REMOVED Requirements

无移除需求。本次整改为纯增补，不删除现有内容。
