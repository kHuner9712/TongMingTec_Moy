# 03 全量需求总表 S2 成交链路衔接补齐 Spec

## Why

当前 03 文档中 QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO 模块的基础功能 REQ 已存在，但模块间的"衔接 REQ"缺失——商机赢单后如何生成报价、报价审批后如何转合同、合同签署后如何确认成交并生成订单、订单确认后如何自动衔接付款与订阅开通、订阅开通后如何纳入客户成功——这些跨模块链路没有独立 REQ 条目，导致成交主干无法进入 04/05/06/08/09/12 联动。

## What Changes

- **新增 7 条衔接 REQ**：覆盖成交链路中跨模块自动衔接的关键节点
- **不修改现有 REQ**：现有 REQ 编码与内容保持不变
- **不与 11 冲突**：新增 REQ 仅涉及 S2 最小内核范围内的衔接逻辑，不触及 S3 完整商业化（账单/发票/对账/欠费/续费/席位管理/停服恢复）

## Impact

- Affected specs: 03_全量需求总表.md
- Affected code: 无代码变更
- 下游影响：新增 REQ 可进入 04（追踪矩阵）、05（对象模型）、06（状态机）、08（API）、09（页面）、12（测试）联动

## ADDED Requirements

### Requirement: 报价审批后转合同衔接

系统 SHALL 支持从已审批通过的报价单一键生成合同，自动带入报价明细、客户信息、金额条款，并建立报价与合同的双向引用关系。

REQ-ID: REQ-QT-004
模块: QT
introduced_in: S2
required_in: S2
must_for_release: Y
release_scope: S2,S3,S4
status: specified

#### Scenario: 报价审批通过后生成合同

- **WHEN** 报价单审批通过且用户点击"生成合同"
- **THEN** 系统自动创建合同草稿，带入报价明细、客户信息、金额条款
- **AND** 建立报价→合同引用关系，报价状态标记为"已转合同"

### Requirement: 合同签署确认成交与转订单衔接

系统 SHALL 在合同签署完成后，自动标记关联商机为赢单，更新客户经营阶段，并从已签署合同生成订单，带入合同明细与金额。

REQ-ID: REQ-CT-005
模块: CT
introduced_in: S2
required_in: S2
must_for_release: Y
release_scope: S2,S3,S4
status: specified

#### Scenario: 合同签署后自动确认成交并生成订单

- **WHEN** 合同状态变更为"已签署"
- **THEN** 系统自动标记关联商机为 won
- **AND** 更新客户经营阶段为"已成交"
- **AND** 从合同自动生成订单草稿，带入合同明细与金额
- **AND** 建立合同→订单引用关系

### Requirement: 订单-付款-订阅自动衔接

系统 SHALL 在订单确认后自动创建付款记录，付款确认后自动激活订单，订单激活后自动触发订阅开通，确保订单→付款→订阅的成交后衔接主干不断裂。

REQ-ID: REQ-ORD-004
模块: ORD
introduced_in: S2
required_in: S2
must_for_release: Y
release_scope: S2,S3,S4
status: specified

#### Scenario: 订单确认后自动衔接付款与订阅

- **WHEN** 订单状态变更为"已确认"
- **THEN** 系统自动创建付款记录（状态=待支付），关联订单
- **WHEN** 付款记录状态变更为"已确认"
- **THEN** 系统自动激活关联订单
- **WHEN** 订单状态变更为"已激活"
- **THEN** 系统自动触发订阅开通流程

### Requirement: 成交后客户成功自动纳入

系统 SHALL 在订阅开通后自动创建客户成功档案，纳入健康度评估，生成初始成功计划建议，并通知客户成功负责人。

REQ-ID: REQ-CSM-005
模块: CSM
introduced_in: S2
required_in: S2
must_for_release: N
release_scope: S2,S3,S4
status: specified

#### Scenario: 订阅开通后自动纳入客户成功管理

- **WHEN** 订阅状态变更为"已开通"
- **THEN** 系统自动创建客户成功档案（如不存在）
- **AND** 将客户纳入健康度评估
- **AND** 生成初始成功计划建议
- **AND** 通知客户成功负责人

### Requirement: 成交链路自动化触发器

系统 SHALL 支持配置并执行成交链路中的事件驱动触发器：报价超时未审批提醒、审批超时催办、合同待签署跟进、订单待开通监控、订阅到期续费预警。触发器基于领域事件驱动，支持通知发送、状态变更、任务创建等动作。

REQ-ID: REQ-AUTO-005
模块: AUTO
introduced_in: S2
required_in: S2
must_for_release: N
release_scope: S2,S3,S4
status: specified

#### Scenario: 成交链路超时自动触发

- **WHEN** 报价创建后 N 小时未提交审批
- **THEN** 系统自动发送提醒通知给报价负责人
- **WHEN** 合同审批通过后 N 天未签署
- **THEN** 系统自动创建跟进任务并通知签署负责人
- **WHEN** 订单激活后 N 小时订阅未开通
- **THEN** 系统自动发送告警通知
- **WHEN** 订阅到期前 N 天
- **THEN** 系统自动创建续费预警并通知客户成功负责人

### Requirement: 全链路经营结果看板

系统 SHALL 展示从线索→商机→报价→合同→订单→付款→开通→续费的全链路转化漏斗、各环节停留时长、成交率、流失率与经营指标趋势，支持按团队/渠道/时间维度筛选。

REQ-ID: REQ-DASH-004
模块: DASH
introduced_in: S2
required_in: S3
must_for_release: N
release_scope: S2,S3,S4
status: specified

#### Scenario: 管理层查看全链路经营结果

- **WHEN** 管理者进入经营驾驶舱全链路看板
- **THEN** 可查看从线索到续费的全链路转化漏斗
- **AND** 可查看各环节平均停留时长与异常指标
- **AND** 可按团队/渠道/时间维度筛选

### Requirement: 知识库与会话工单 AI 集成

系统 SHALL 在会话中根据客户问题自动推荐匹配知识条目，在工单创建时自动关联相关知识，AI 问答注入知识库上下文生成结构化答案，并支持知识库命中率与有效性统计。

REQ-ID: REQ-KB-005
模块: KB
introduced_in: S2
required_in: S2
must_for_release: N
release_scope: S2,S3,S4
status: specified

#### Scenario: 会话中自动推荐知识条目

- **WHEN** 客服在会话中收到客户问题
- **THEN** 系统自动推荐匹配的知识条目列表
- **AND** 客服可选择引用知识条目作为回复

#### Scenario: 工单创建时自动关联知识

- **WHEN** 从会话创建工单
- **THEN** 系统自动关联会话中已匹配的知识条目到工单

#### Scenario: AI 问答注入知识上下文

- **WHEN** 用户在知识库发起 AI 问答
- **THEN** 系统注入匹配知识条目作为上下文，生成结构化答案
- **AND** 记录知识条目命中次数用于有效性统计

## MODIFIED Requirements

无修改需求。现有 REQ 保持不变。

## REMOVED Requirements

无移除需求。
