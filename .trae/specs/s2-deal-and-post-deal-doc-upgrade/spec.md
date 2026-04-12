# 下一阶段"成交与成交后衔接主干"文档改造方案 Spec

## Why

MOY 项目 S1 基础底座与前链路（AUTH/ORG/USR/CM/LM/OM/CNV/TK/TSK/NTF/CHN/AI/AUD/SYS/COR/CMEM/ART/APC/TKC/RBC/ai-runtime）已实现，但"成交与成交后衔接主干"尚未形成可执行的文档闭环。当前 SSOT 中 QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO 虽已进入 `specified` 状态，但存在以下问题：

1. **阶段定义与实际开发意图不一致**：用户明确要求推进 QT/CT/ORD/PAY/SUB 等模块，但 SSOT 中这些模块标记为 S2/S3，需要重新审视阶段归属。
2. **已定义未实现模块的文档粒度不足**：QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO 虽在 03/04/05/06/07/08/09 中有索引级定义，但 05A/08A/08B/09A/12A 的实现级展开尚未覆盖这些模块的完整原子化输入。
3. **成交后链路断裂**：商机赢单 → 报价 → 合同 → 订单 → 付款 → 开通/订阅 这条主链在文档层面存在但未形成可执行闭环。

需要将"下一阶段开发内容"冻结成一份清晰、可执行、可追踪的文档方案，为后续编码提供无歧义的实现输入。

## What Changes

- **01_产品范围与阶段地图.md**：重新审视 S2 阶段定义，将 QT/CT/ORD/PAY/SUB 的最小内核从 S3 提前到 S2，明确"成交与成交后衔接主干"的 S2 交付边界
- **02_业务域与模块树.md**：更新 QT/CT/ORD/PAY/SUB 的 `introduced_in`/`required_in` 字段，更新模块状态
- **03_全量需求总表.md**：将 QT/CT/ORD/PAY/SUB 的最小内核 REQ 从 S3 调整到 S2，新增 AUTO 触发式自动化主干 REQ
- **04_需求追踪矩阵.md**：同步更新受影响 REQ 的阶段归属与实现状态
- **05_对象模型与数据库设计.md**：补充 QT/CT/ORD/PAY/SUB/AUTO/KB/DASH/CSM 的迁移顺序与建模说明
- **05A_终局关键表DDL展开.md**：新增 QT/CT/ORD/PAY/SUB/AUTO/KB/DASH/CSM 的原子 DDL
- **06_状态机总表.md**：补充 SM-quote/SM-contract/SM-order/SM-payment/SM-subscription 的 S2 阶段适用范围调整
- **07_权限模型与AI边界.md**：补充 QT/CT/ORD/PAY/SUB/AUTO/KB/DASH/CSM 的 S2 权限点与 AI 边界
- **08_API契约与Schema字典.md**：补充 QT/CT/ORD/PAY/SUB/AUTO/KB/DASH/CSM 的 S2 API 索引
- **08A_原子API与Schema展开.md**：新增 QT/CT/ORD/PAY/SUB/AUTO/KB/DASH/CSM 的原子 API 合同
- **08B_原子Schema字段字典.md**：新增 QT/CT/ORD/PAY/SUB/AUTO/KB/DASH/CSM 的字段级 Schema
- **09_页面与交互规格.md**：补充 QT/CT/ORD/PAY/SUB/AUTO/KB/DASH/CSM 的 S2 页面清单
- **09A_关键页面逐页交互展开.md**：新增 QT/CT/ORD/PAY/SUB/AUTO/KB/DASH/CSM 的逐页交互合同
- **10_AI_Agent_自动化与集成执行规范.md**：补充 AUTO 触发式自动化主干规范，补充 Agent 与 QT/CT/ORD/PAY 的集成规则
- **11_商业化_交易与计费体系.md**：调整 ORD/PAY/SUB 的阶段归属，补充 S2 最小内核的商业规则
- **12_测试_验收_部署与迁移.md**：补充 QT/CT/ORD/PAY/SUB/AUTO/KB/DASH/CSM 的 S2 测试与验收
- **12A_原子TEST_ACPT与发布门禁展开.md**：新增 QT/CT/ORD/PAY/SUB/AUTO/KB/DASH/CSM 的原子测试与验收
- **13_历史映射与归档说明.md**：记录本次阶段调整的裁决留痕

## Impact

- Affected specs: 01/02/03/04/05/05A/06/07/08/08A/08B/09/09A/10/11/12/12A/13 共 18 份文档
- Affected code: 本阶段只做文档，不写代码，不改接口实现
- 核心影响：S2 阶段定义从"首期完整版/增强版"扩展为"成交与成交后衔接主干"，需要将 ORD/PAY/SUB 的最小内核从 S3 提前到 S2

## ADDED Requirements

### Requirement: S2 阶段重新定义

系统 SHALL 将 S2 阶段从"首期完整版/增强版"重新定义为"成交与成交后衔接主干"，在 S1 基础上补齐以下能力：

1. QT 报价管理（S2 最小内核）
2. CT 合同管理（S2 最小内核）
3. ORD 订单最小内核（从 S3 提前到 S2）
4. PAY 付款确认最小内核（从 S3 提前到 S2）
5. SUB 服务开通/订阅最小内核（从 S3 提前到 S2）
6. CSM 客户成功（S2 基础能力）
7. KB 最小知识库（S2 基础能力）
8. DASH 经营驾驶舱增强（S2 基础能力）
9. AUTO 触发式自动化主干（S2 基础能力）

#### Scenario: S2 阶段交付闭环

- **WHEN** S2 阶段开发完成
- **THEN** 系统具备"商机赢单 → 报价 → 合同 → 订单 → 付款 → 开通/订阅"的完整成交链路
- **AND** 系统具备客户成功基础能力（健康度、续费提醒）
- **AND** 系统具备知识库基础能力（检索、维护、AI 问答）
- **AND** 系统具备经营驾驶舱增强能力（销售看板、服务看板）
- **AND** 系统具备触发式自动化主干能力（事件驱动、节点执行）

### Requirement: ORD 订单最小内核从 S3 提前到 S2

系统 SHALL 将订单管理的最小内核从 S3 提前到 S2，包含：

- 订单创建（从合同/报价生成）
- 订单详情与明细
- 订单确认与激活
- 订单与付款的关联

#### Scenario: 订单最小内核 S2 可交付

- **WHEN** 合同签署完成
- **THEN** 可从合同生成订单
- **AND** 订单确认后可关联付款
- **AND** 付款确认后可触发服务开通

### Requirement: PAY 付款确认最小内核从 S3 提前到 S2

系统 SHALL 将付款确认的最小内核从 S3 提前到 S2，包含：

- 付款记录创建（关联订单/合同）
- 付款状态跟踪
- 付款确认与订单激活的联动

#### Scenario: 付款确认 S2 可交付

- **WHEN** 订单确认后发起付款
- **THEN** 付款记录关联到订单
- **AND** 付款成功后订单状态自动推进

### Requirement: SUB 服务开通/订阅最小内核从 S3 提前到 S2

系统 SHALL 将服务开通/订阅的最小内核从 S3 提前到 S2，包含：

- 从订单开通订阅
- 订阅基础状态管理
- 订阅与客户的关联

#### Scenario: 订阅最小内核 S2 可交付

- **WHEN** 订单激活后
- **THEN** 自动开通对应订阅
- **AND** 订阅状态可在客户 360 视图中查看

### Requirement: AUTO 触发式自动化主干

系统 SHALL 在 S2 提供触发式自动化主干能力，包含：

- 事件驱动的触发器定义
- 基础节点类型（通知、状态变更、AI 动作）
- 自动化流程的启用/暂停
- 执行记录与失败重试

#### Scenario: 自动化触发执行

- **WHEN** 配置了"商机赢单 → 自动创建报价"的自动化流程
- **AND** 商机被标记为 won
- **THEN** 系统自动触发报价创建流程
- **AND** 执行记录写入 automation_runs

## MODIFIED Requirements

### Requirement: S2 阶段定义调整

原 S2 定义："在 S1 上补齐知识、看板、营销、报价、合同、客户成功基础能力"

修改为："在 S1 上补齐成交与成交后衔接主干，包括报价、合同、订单最小内核、付款确认最小内核、服务开通/订阅最小内核、客户成功、知识库、经营驾驶舱增强、触发式自动化主干"

### Requirement: ORD/PAY/SUB 阶段归属调整

原定义：ORD/PAY/SUB 的 `introduced_in`/`required_in` 为 S3

修改为：ORD/PAY/SUB 的最小内核 `introduced_in`/`required_in` 为 S2，完整商业化能力仍保留在 S3

### Requirement: QT/CT 阶段归属保持不变

QT/CT 的 `introduced_in`/`required_in` 保持 S2 不变，但需要补充实现级文档粒度

## REMOVED Requirements

无移除需求。本次改造不裁剪任何已有能力，只调整阶段归属和补充文档粒度。
