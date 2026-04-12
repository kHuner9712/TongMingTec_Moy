# 第二轮 SSOT 小范围一致性修正 Spec

## Why

10_AI_Agent 内部存在阶段约束冲突：第4节/第13节明确 S2 不允许 auto 模式，但第7.3节在 S2 语境下直接举例 auto 模式动作，导致 AI 编程工具无法判断当前阶段该默认做 auto 还是 approval。02_业务域与模块树 的成熟度字段将"当前值"和"目标值"写在同一单元格（如 `crud_ready→workflow_ready`），AI 工具无法区分模块现在处于什么成熟度、本阶段目标是什么。

## What Changes

- **10_AI_Agent 第3.1节**：AGENT-AI-008 Quality Agent 默认模式从 `auto` 改为 `assist`，标注 S3 升级为 auto
- **10_AI_Agent 第3.3节**：新增说明，明确所列模式为全阶段能力范围，实际允许模式以第13节治理表为准
- **10_AI_Agent 第7.3节**：将 `payment.succeeded → 自动激活订单（auto 模式）` 改为 `approval 模式`；将 `order.activated → 自动开通订阅（auto 模式）` 改为 `approval 模式`；新增 S2 阶段 auto 禁用说明与 S3 升级条件
- **10_AI_Agent 第4节**：在阶段约束表后补充明确说明：S2 严禁 auto 模式，任何涉及资金/服务开通的动作在 S2 必须走 approval
- **10_AI_Agent 第13.2节**：在 S2 说明中补充 auto 禁用与 S3 升级条件的明确表述
- **02_业务域与模块树 第3节**：将"当前成熟度"列拆分为"当前成熟度"和"阶段目标成熟度"两列，36 个模块逐一填值
- **02_业务域与模块树 第6.1/6.2节**：同步修正成熟度说明段落，消除箭头混合写法

## Impact

- Affected specs: 10_AI_Agent_自动化与集成执行规范.md, 02_业务域与模块树.md
- Affected code: 无代码变更
- 可能需最小化修改 01_产品范围与阶段地图.md 第3.1节末尾引用语（如措辞需对齐）

## ADDED Requirements

### Requirement: 10_AI_Agent S2 auto 禁用一致性

系统 SHALL 在 10_AI_Agent 文档中确保全文对 S2 阶段的执行模式约束一致：
- S2 仅允许 suggest / assist / approval 三种模式
- S2 严禁 auto 模式
- 任何涉及付款确认后激活订单、订单激活后开通订阅的动作，在 S2 必须走 approval 模式
- 上述动作进入 auto 模式的阶段为 S3，且需满足：审计完整、补偿机制可用、回滚能力 production_ready、异常恢复可自动触发

#### Scenario: AI 编程工具读取 10_AI_Agent 后不会误判 S2 允许 auto

- **WHEN** AI 编程工具读取 10_AI_Agent 全文
- **THEN** 不会在任何小节发现 S2 语境下的 auto 模式示例
- **AND** 能明确判断 S2 仅允许 suggest / assist / approval
- **AND** 能明确判断 auto 模式从 S3 才开放，且仅限低风险动作

### Requirement: 02_业务域与模块树 成熟度字段拆分

系统 SHALL 在 02_业务域与模块树 第3节模块编码总表中：
- 将"当前成熟度"列拆分为"当前成熟度"和"阶段目标成熟度"两列
- "当前成熟度"仅填写模块当前真实成熟度级别
- "阶段目标成熟度"填写模块在其 required_in 阶段需达到的成熟度级别
- 36 个模块逐一填值，不允许出现箭头混合写法

#### Scenario: AI 编程工具可明确判断模块当前状态与阶段目标

- **WHEN** AI 编程工具读取 02_业务域与模块树
- **THEN** 可直接从"当前成熟度"列判断模块现在处于什么成熟度
- **AND** 可直接从"阶段目标成熟度"列判断本阶段目标是什么
- **AND** 不会把"阶段目标成熟度"误判为"当前已完成成熟度"

## MODIFIED Requirements

### Requirement: 10_AI_Agent 第7.3节触发式自动化示例修正

原 7.3 节"与成交链路的衔接"中两个 auto 模式示例修改为 approval 模式，并补充 S2/S3 阶段差异说明。

### Requirement: 10_AI_Agent 第3.1节 Agent Registry 默认模式修正

AGENT-AI-008 Quality Agent 默认模式从 `auto` 修改为 `assist`，标注 S3 升级为 auto。

### Requirement: 02_业务域与模块树 第6.1/6.2节成熟度说明修正

消除箭头混合写法（如 `crud_ready→workflow_ready`），改为分别引用"当前成熟度"和"阶段目标成熟度"的清晰表述。

## REMOVED Requirements

无移除需求。
