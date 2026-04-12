# S2 阶段门禁逐项验收 Spec

## Why
S2 已有雏形但尚未达到阶段完成。需要基于现有 SSOT 文档体系和代码实现，做一次完整的门禁逐项验收，输出可执行的差距清单，指导后续开发推进。

## What Changes
- 不做代码变更，不做文档重写
- 产出 S2 门禁验收结论摘要
- 产出 S2 门禁逐项验收表
- 产出 S2 差距清单（Gap List）
- 产出整改优先顺序
- 产出差距类型归因统计

## Impact
- Affected specs: S2 阶段门禁（01_产品范围与阶段地图 §5.2）
- Affected code: QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO 全部 S2 模块
- Affected docs: 01/02/06/07/08/09/10/12 全部涉及 S2 的 SSOT 文档

---

## 第一部分：验收结论摘要

### 1. S2 当前总体状态

**未达到阶段完成**

### 2. 结论理由

1. **5 个 S2 模块零实现**：SUB（订阅）、CSM（客户成功）、KB（知识库）、DASH（驾驶舱增强）、AUTO（触发式自动化）后端模块完全不存在，前端页面也不存在。这 5 个模块占 S2 应完成能力的 56%。
2. **成交后衔接主干断裂**：付款确认成功后未触发订单激活，`payment.status_changed` 事件无任何监听器订阅，导致"报价→合同→订单→付款→激活→订阅"链路在付款环节断裂。
3. **审计日志未集成**：QT/CT/ORD/PAY 四个已实现模块均未调用 AudService.createLog()，所有写操作无审计记录，违反 S2 门禁"审计可查询"要求。
4. **APC/TKC/RBC 未升级至 workflow_ready**：S2 门禁要求审批中心、接管中心、回滚中心达到 workflow_ready，但当前仍为 crud_ready，缺少跨模块审批联动和状态机强制校验。
5. **ORD/PAY 未达到阶段目标成熟度**：02 文档标注 ORD/PAY 当前为 crud_ready，阶段目标为 workflow_ready。虽然代码层面已具备完整状态流转，但缺少付款→订单联动、审计集成等关键流程闭环。
6. **E2E 测试完全缺失**：无任何 e2e 测试目录和文件，S2 成交链路 E2E 无法验证。
7. **客户 360 时间线未订阅 S2 事件**：TimelineService 仅订阅 S1 模块事件，报价/合同/订单/付款事件不会出现在客户 360 视图中。
8. **S2 权限种子不完整**：PERM-SUB-*/PERM-CSM-*/PERM-KB-*/PERM-DASH-*/PERM-AUTO-* 均未在 permission.seed.ts 中定义。
9. **驾驶舱缺少 S2 商业化指标**：Cockpit 页面仅展示 S1 基础指标，无报价金额/合同金额/回款率/成交转化率等 S2 经营数据。
10. **S2 相关 REQ 的 must_for_release=Y 项无法通过 ACPT**：多个 ACPT 依赖尚未实现的模块和链路。

---

## 第二部分：S2 门禁逐项验收表

### A. 阶段目标

| 门禁维度 | 子项 | 结论 | 证据 | 差距说明 |
|----------|------|------|------|----------|
| A.阶段目标 | 成交与成交后衔接主干 | 部分满足 | QT/CT/ORD/PAY 后端+前端已就绪（01 §5.2, 02 §6.2）；但付款→订单激活联动断裂（pay.service.ts succeedPayment 无联动调用）；SUB 零实现 | 付款确认后订单不自动激活；订阅模块不存在，成交后衔接在付款环节断裂 |
| A.阶段目标 | 最小交易闭环 | 部分满足 | QT→CT→ORD→PAY 链路可走通到付款确认，但 PAY→ORD 激活→SUB 开通链路不通 | 缺少付款→订单激活事件监听；SUB 模块不存在 |
| A.阶段目标 | 客户成功与知识支撑增强 | 不满足 | CSM/KB 后端模块不存在（02 §6.2 标注 skeleton）；前端无对应页面 | 零实现，需从零开始 |
| A.阶段目标 | 驾驶舱增强 | 部分满足 | Cockpit.tsx 存在（374行），展示 S1 指标；但无销售看板/服务看板/经营驾驶舱独立页面 | 缺少 PAGE-DASH-001/002/003 对应页面和 API-DASH-001/002/003 |
| A.阶段目标 | 自动化主干受控落地 | 不满足 | AUTO 后端模块不存在；ART 模块有 Agent 执行引擎但不是通用自动化流引擎 | 触发式自动化零实现 |

### B. 必须完成能力

| 门禁维度 | 子项 | 结论 | 证据 | 差距说明 |
|----------|------|------|------|----------|
| B.必须完成能力 | QT 报价 | 满足 | qt.controller.ts/qt.service.ts 完整 CRUD+审批+发送；quote.sm.ts 7状态6流转；PERM-QT-* 已定义；qt.service.spec.ts 443行 | 审计日志未集成 |
| B.必须完成能力 | CT 合同 | 满足 | ct.controller.ts/ct.service.ts 完整 CRUD+审批+签署+终止；contract.sm.ts 8状态7流转；PERM-CT-* 已定义；ct.service.spec.ts 340行 | 审计日志未集成；合同文档上传API缺失 |
| B.必须完成能力 | ORD 订单 | 部分满足 | ord.controller.ts/ord.service.ts CRUD+确认+激活+取消+完成；order.sm.ts 6状态5流转；PERM-ORD-* 已定义 | 付款→激活联动缺失；审计未集成；dataScope 不支持 self |
| B.必须完成能力 | PAY 付款确认 | 部分满足 | pay.controller.ts/pay.service.ts CRUD+处理+确认+退款+作废；payment.sm.ts 6状态5流转；PERM-PAY-* 已定义 | 付款确认后无联动；审计未集成 |
| B.必须完成能力 | SUB 服务开通/订阅 | 不满足 | backend/src/modules/ 下无 sub 目录；无 subscription entity/service/controller；无 subscription.sm.ts | 零实现，02 标注 skeleton→目标 crud_ready |
| B.必须完成能力 | CSM 客户成功 | 不满足 | 无 csm 模块目录；无 health-score/success-plan 相关代码 | 零实现，02 标注 skeleton→目标 crud_ready |
| B.必须完成能力 | KB 知识库 | 不满足 | 无 kb 模块目录；无 knowledge entity/service/controller；无 knowledge_item.sm.ts | 零实现，02 标注 skeleton→目标 crud_ready |
| B.必须完成能力 | DASH 驾驶舱增强 | 部分满足 | Cockpit.tsx 展示基础指标；ai-runtime.getCockpitData 聚合数据 | 缺少销售看板/服务看板/经营驾驶舱独立页面和 API |
| B.必须完成能力 | AUTO 触发式自动化 | 不满足 | 无 auto 模块目录；无 automation_flow/run entity | 零实现，02 标注 skeleton→目标 crud_ready |

### C. 核心端到端链路

| 门禁维度 | 子项 | 结论 | 证据 | 差距说明 |
|----------|------|------|------|----------|
| C.核心链路 | 商机赢单→创建报价→审批→发送→创建合同→审批→签署 | 部分满足 | QT/CT 模块完整；OM→QT 转报价 API 存在（om.service.ts）；QT→CT from-quote API 存在（ct.controller.ts） | 审计日志缺失；OM→QT 转报价需验证赢单前置条件 |
| C.核心链路 | 合同签署→创建订单→确认→创建付款→付款确认→订单激活→开通订阅 | 不满足 | CT→ORD from-contract API 存在；ORD→PAY 创建付款 API 存在；但 PAY succeed 后无联动激活订单；SUB 不存在 | 付款→订单激活事件监听缺失；SUB 完全不存在 |
| C.核心链路 | 订阅开通→自动纳入客户成功→健康度评估→续费提醒 | 不满足 | SUB/CSM 模块均不存在 | 零实现 |
| C.核心链路 | 相关状态进入驾驶舱 | 部分满足 | Cockpit.tsx 展示基础摘要；但无 S2 商业化指标 | 缺少报价/合同/订单/付款/订阅相关驾驶舱数据 |
| C.核心链路 | 相关事件触发自动化主干 | 不满足 | AUTO 模块不存在；领域事件已定义（quote/contract/order/payment events）但无自动化消费端 | 事件已发布但无自动化引擎消费 |

### D. 模块成熟度达标情况

| 模块 | 当前成熟度 | 阶段目标成熟度 | 是否达标 | 缺失层 |
|------|-----------|--------------|---------|--------|
| QT | workflow_ready | workflow_ready | 达标 | 审计集成 |
| CT | workflow_ready | workflow_ready | 达标 | 审计集成；文档上传API |
| ORD | crud_ready | workflow_ready | 未达标 | 付款→激活联动；审计；dataScope |
| PAY | crud_ready | workflow_ready | 未达标 | 付款→订单联动；审计 |
| SUB | skeleton | crud_ready | 未达标 | 全部（零实现） |
| CSM | skeleton | crud_ready | 未达标 | 全部（零实现） |
| KB | skeleton | crud_ready | 未达标 | 全部（零实现） |
| DASH | skeleton | crud_ready | 未达标 | 独立页面；S2 指标 API |
| AUTO | skeleton | crud_ready | 未达标 | 全部（零实现） |
| APC | crud_ready | workflow_ready | 未达标 | 跨模块审批联动；S2 高风险动作强制审批 |
| TKC | crud_ready | workflow_ready | 未达标 | 接管流程增强 |
| RBC | crud_ready | workflow_ready | 未达标 | 回滚流程增强 |

### E. AI 执行治理

| 门禁维度 | 子项 | 结论 | 证据 | 差距说明 |
|----------|------|------|------|----------|
| E.AI治理 | suggest+assist+approval 模式可用 | 部分满足 | ART execution-engine.service.ts 支持 4 种模式；10 §4 定义了模式约束 | approval 模式在 QT/CT 审批中可用，但 ORD 确认/PAY 确认未强制走 approval |
| E.AI治理 | 严禁默认 auto | 部分满足 | 10 §4 明确 S2 禁止 auto；代码中 execution mode 由 agent 配置决定 | 需验证是否有 agent 配置了 auto 模式且在 S2 场景下被调用 |
| E.AI治理 | 高风险动作必须审批 | 不满足 | 07 §7.6 定义合同签署/订单确认/付款确认为高风险需 approval；但代码中 CT 签署/PAY 确认未强制走 AI 审批流 | 高风险动作的 approval 强制执行未在代码层面落地 |
| E.AI治理 | 支持人工接管 | 部分满足 | takeover-center.service.ts 存在；takeover-center.controller.ts 存在 | 仅 crud_ready，未达 workflow_ready |
| E.AI治理 | 支持审计 | 部分满足 | aud.service.ts 存在；但 S2 模块未接入 | S2 模块写操作无审计记录 |
| E.AI治理 | 支持回滚/补偿 | 部分满足 | rollback-center.service.ts 存在；但仅 crud_ready | 未达 workflow_ready |
| E.AI治理 | Agent Registry 支持 activate/pause/archive | 满足 | ai-agent.sm.ts 已实现；agent-registry.service.ts 已集成状态机+EventBus+乐观锁 | 已在 S2 实现级完成 |

### F. 数据与结果指标

| 指标 | 开始可采集阶段 | 进入驾驶舱阶段 | 当前可采集 | 数据源 | 已入驾驶舱 | 差距 |
|------|--------------|--------------|-----------|--------|-----------|------|
| 首响时间 | S1 | S2 | 部分可采集 | CNV message created_at vs conversation created_at | 否 | 缺少聚合逻辑和驾驶舱展示 |
| 线索漏跟进率 | S1 | S2 | 部分可采集 | LM lead.last_follow_up_at vs lead.assigned_at | 否 | 缺少聚合逻辑和驾驶舱展示 |
| 会话转商机率 | S1 | S2 | 部分可采集 | CNV→OM 关联数据 | 否 | 缺少聚合逻辑和驾驶舱展示 |
| 报价/合同周转时间 | S2 | S2 | 部分可采集 | QT/CT created_at vs signed_at/approved_at | 否 | 缺少聚合逻辑和驾驶舱展示 |
| 成交后开通/交接时间 | S2 | S3 | 不可采集 | SUB 不存在 | 否 | SUB 模块零实现 |
| 工单首次解决率/SLA达标率 | S1 | S2 | 部分可采集 | TK ticket_log + SLA 配置 | 否 | 缺少聚合逻辑和驾驶舱展示 |

### G. 权限与组织协作

| 门禁维度 | 子项 | 结论 | 证据 | 差距说明 |
|----------|------|------|------|----------|
| G.权限 | S2 角色已存在 | 部分满足 | permission.seed.ts 有 ROLE-MARKETING_MANAGER/ROLE-CSM_MANAGER/ROLE-AI-OPERATOR 定义 | CSM_MANAGER/AI-OPERATOR 角色权限未完整分配 |
| G.权限 | QT/CT/ORD/PAY 有角色边界 | 满足 | PERM-QT-*/PERM-CT-*/PERM-ORD-*/PERM-PAY-* 已在 permission.seed.ts 定义 | - |
| G.权限 | SUB/CSM/KB/DASH/AUTO 有角色边界 | 不满足 | PERM-SUB-*/PERM-CSM-*/PERM-KB-*/PERM-DASH-*/PERM-AUTO-* 未在 permission.seed.ts 定义 | 权限种子完全缺失 |
| G.权限 | 审批/接管/查看驾驶舱有最小权限体系 | 部分满足 | PERM-AI-APPROVE/PERM-AI-TAKEOVER/PERM-SYS-VIEW 已定义 | 驾驶舱使用 PERM-SYS-VIEW 而非 PERM-DASH-VIEW |

### H. 测试与验收

| 门禁维度 | 子项 | 结论 | 证据 | 差距说明 |
|----------|------|------|------|----------|
| H.测试 | S2 模块单元测试 | 部分满足 | qt/ct/ord/pay service.spec.ts 存在且内容充实 | SUB/CSM/KB/DASH/AUTO 无测试文件 |
| H.测试 | S2 集成测试 | 不满足 | 无 integration test 目录和文件 | 完全缺失 |
| H.测试 | S2 E2E 测试 | 不满足 | 无 e2e 目录和文件 | 完全缺失 |
| H.测试 | S2 ACPT 验收 | 不满足 | 12A 定义了完整 ACPT 矩阵但无实际测试文件 | ACPT-QT-001/CT-001/ORD-001/PAY-001/SUB-001/CSM-001/KB-001/DASH-001/AUTO-001/E2E-001 均无实现 |
| H.测试 | 阻塞项 | 存在 | SUB/CSM/KB/AUTO 零实现导致相关 ACPT 无法执行 | 5 个模块零实现是最大阻塞项 |

---

## 第三部分：S2 差距清单（Gap List）

### S2-GAP-001
- **Gap 名称**：SUB 订阅模块零实现
- **所属门禁维度**：必须完成能力 / 核心链路 / 模块成熟度
- **当前现状**：backend/src/modules/ 下无 sub 目录，无 subscription entity/service/controller，无 subscription.sm.ts，无 PERM-SUB-* 权限种子，无前端页面
- **目标状态**：SUB 达到 crud_ready（订阅开通、基础状态管理、暂停/恢复/取消）
- **差距内容**：全部需从零实现：entity + migration + service + controller + 状态机 + 权限种子 + 领域事件 + 前端页面（PAGE-SUB-001/002）
- **影响范围**：backend/src/modules/sub/、backend/src/common/statemachine/definitions/subscription.sm.ts、backend/src/common/events/subscription-events.ts、backend/src/modules/usr/seeds/permission.seed.ts、frontend/src/pages/Subscriptions.tsx、frontend/src/pages/SubscriptionDetail.tsx、frontend/src/services/subscription.ts
- **优先级**：P0
- **整改建议**：按 05A/08A/09A 中 SUB 相关定义，实现订阅最小内核：entity(migration) → state machine → service → controller → permission seed → domain events → frontend pages
- **建议责任落点**：全栈联动

### S2-GAP-002
- **Gap 名称**：付款确认→订单激活联动断裂
- **所属门禁维度**：核心链路
- **当前现状**：PayService.succeedPayment() 仅更新付款状态并发布 payment.status_changed 事件，无任何监听器订阅该事件来调用 OrdService.activateOrder()
- **目标状态**：付款确认成功后自动触发订单激活（approval 模式，需人工审批后才执行）
- **差距内容**：缺少 payment.status_changed 事件监听器；缺少 approval 模式的自动激活流程
- **影响范围**：backend/src/modules/pay/pay.service.ts、backend/src/modules/ord/ord.service.ts、backend/src/common/events/、backend/src/modules/art/
- **优先级**：P0
- **整改建议**：创建 PaymentEventHandler 订阅 payment.status_changed(succeeded)，触发 approval 流程，审批通过后调用 OrdService.activateOrder()
- **建议责任落点**：后端

### S2-GAP-003
- **Gap 名称**：CSM 客户成功模块零实现
- **所属门禁维度**：必须完成能力 / 模块成熟度
- **当前现状**：无 csm 模块目录，无 health-score/success-plan 相关代码，无 PERM-CSM-* 权限种子
- **目标状态**：CSM 达到 crud_ready（健康度评估、成功计划、续费提醒基础能力）
- **差距内容**：全部需从零实现
- **影响范围**：backend/src/modules/csm/、frontend/src/pages/、permission.seed.ts
- **优先级**：P0
- **整改建议**：按 05A/08A/09A 中 CSM 相关定义实现最小内核
- **建议责任落点**：全栈联动

### S2-GAP-004
- **Gap 名称**：KB 知识库模块零实现
- **所属门禁维度**：必须完成能力 / 模块成熟度
- **当前现状**：无 kb 模块目录，无 knowledge entity/service/controller，无 knowledge_item.sm.ts
- **目标状态**：KB 达到 crud_ready（分类/条目CRUD/审核/搜索/AI问答）
- **差距内容**：全部需从零实现
- **影响范围**：backend/src/modules/kb/、frontend/src/pages/、permission.seed.ts
- **优先级**：P1
- **整改建议**：按 05A/08A/09A 中 KB 相关定义实现最小版
- **建议责任落点**：全栈联动

### S2-GAP-005
- **Gap 名称**：AUTO 触发式自动化模块零实现
- **所属门禁维度**：必须完成能力 / 模块成熟度
- **当前现状**：无 auto 模块目录，无 automation_flow/run entity
- **目标状态**：AUTO 达到 crud_ready（流程创建/启用暂停/事件触发执行/失败重试）
- **差距内容**：全部需从零实现
- **影响范围**：backend/src/modules/auto/、frontend/src/pages/、permission.seed.ts
- **优先级**：P1
- **整改建议**：按 10 §7.3 和 05A/08A/09A 中 AUTO 相关定义实现触发式自动化主干
- **建议责任落点**：全栈联动

### S2-GAP-006
- **Gap 名称**：DASH 驾驶舱增强未达标
- **所属门禁维度**：必须完成能力 / 数据指标
- **当前现状**：Cockpit.tsx 仅展示 S1 基础指标；无独立销售看板/服务看板/经营驾驶舱页面；无 API-DASH-001/002/003/004
- **目标状态**：DASH 达到 crud_ready（销售看板+服务看板+指标快照）
- **差距内容**：缺少独立 DASH 后端模块（或 ai-runtime 扩展）；缺少 PAGE-DASH-001/002/003 前端页面；缺少 S2 商业化指标聚合 API
- **影响范围**：backend/src/modules/dash/（新建或扩展 ai-runtime）、frontend/src/pages/、frontend/src/services/dashboard.ts
- **优先级**：P1
- **整改建议**：实现销售看板 API + 页面、服务看板 API + 页面，在现有 Cockpit 基础上增加 S2 指标卡片
- **建议责任落点**：全栈联动

### S2-GAP-007
- **Gap 名称**：S2 模块审计日志未集成
- **所属门禁维度**：AI 治理 / 测试验收
- **当前现状**：QT/CT/ORD/PAY 四个模块的 service 均未调用 AudService.createLog()，所有写操作无审计记录
- **目标状态**：所有 S2 模块写操作必须写入审计日志
- **差距内容**：QT/CT/ORD/PAY service 中每个写方法需增加 AudService.createLog() 调用
- **影响范围**：qt.service.ts、ct.service.ts、ord.service.ts、pay.service.ts
- **优先级**：P0
- **整改建议**：在每个模块的 create/update/status-change 方法中注入 AudService 并调用 createLog()
- **建议责任落点**：后端

### S2-GAP-008
- **Gap 名称**：APC/TKC/RBC 未升级至 workflow_ready
- **所属门禁维度**：AI 治理 / 模块成熟度
- **当前现状**：APC/TKC/RBC 当前为 crud_ready，S2 门禁要求 workflow_ready
- **目标状态**：审批中心/接管中心/回滚中心达到 workflow_ready（跨模块审批联动、S2 高风险动作强制审批、状态机强制校验）
- **差距内容**：APC 需支持 S2 高风险动作（合同签署/订单确认/付款确认）的强制审批流；TKC 需支持 S2 场景的接管流程；RBC 需支持 S2 场景的回滚流程
- **影响范围**：approval-center.service.ts、takeover-center.service.ts、rollback-center.service.ts
- **优先级**：P0
- **整改建议**：在 APC 中增加 S2 高风险动作的审批模板和强制校验；TKC/RBC 增加跨模块接管/回滚支持
- **建议责任落点**：后端

### S2-GAP-009
- **Gap 名称**：S2 高风险动作未强制走 approval 模式
- **所属门禁维度**：AI 治理
- **当前现状**：07 §7.6 定义合同签署/订单确认/付款确认为高风险需 approval，但代码中 CT 签署/PAY 确认/ORD 确认未强制走 AI 审批流
- **目标状态**：合同签署、订单确认、付款确认必须经过 approval 模式审批后才可执行
- **差距内容**：CT sign/ORD confirm/PAY succeed 方法中缺少 approval 强制校验
- **影响范围**：ct.service.ts、ord.service.ts、pay.service.ts、art module
- **优先级**：P0
- **整改建议**：在 CT sign/ORD confirm/PAY succeed 方法中增加 approval 前置检查，未审批通过则拒绝执行
- **建议责任落点**：后端

### S2-GAP-010
- **Gap 名称**：TimelineService 未订阅 S2 事件
- **所属门禁维度**：核心链路 / 数据指标
- **当前现状**：TimelineService 仅订阅 S1 模块事件（customer/lead/opportunity/conversation/ticket），未订阅 quote/contract/order/payment 事件
- **目标状态**：客户 360 时间线展示报价/合同/订单/付款相关事件
- **差距内容**：TimelineService 需增加 quote.status_changed/contract.status_changed/order.status_changed/payment.status_changed 事件订阅
- **影响范围**：backend/src/modules/cor/services/timeline.service.ts
- **优先级**：P1
- **整改建议**：在 TimelineService 中增加 S2 事件订阅，将报价/合同/订单/付款状态变更写入 customer_timeline_event
- **建议责任落点**：后端

### S2-GAP-011
- **Gap 名称**：S2 权限种子不完整
- **所属门禁维度**：权限与组织协作
- **当前现状**：PERM-SUB-*/PERM-CSM-*/PERM-KB-*/PERM-DASH-*/PERM-AUTO-* 未在 permission.seed.ts 中定义
- **目标状态**：所有 S2 模块权限点已在种子中定义并分配给对应角色
- **差距内容**：需在 permission.seed.ts 中增加 SUB/CSM/KB/DASH/AUTO 相关权限定义
- **影响范围**：backend/src/modules/usr/seeds/permission.seed.ts
- **优先级**：P1
- **整改建议**：按 07 §5.2 中 S2+ 扩展权限表，补齐所有缺失权限种子
- **建议责任落点**：后端

### S2-GAP-012
- **Gap 名称**：E2E 测试完全缺失
- **所属门禁维度**：测试与验收
- **当前现状**：无 e2e 测试目录和文件
- **目标状态**：S2 成交链路 E2E 可 UI 操作完成；高风险动作审批强制生效
- **差距内容**：需创建 e2e/s2/ 目录，实现 ACPT-E2E-001（成交全链路）、ACPT-E2E-002（权限验证）、ACPT-E2E-003（审计验证）、ACPT-E2E-004（多租户隔离）
- **影响范围**：e2e/s2/ 目录（新建）
- **优先级**：P1
- **整改建议**：按 12A §3 成交链路 E2E 定义，逐步实现 S2 E2E 测试
- **建议责任落点**：测试

### S2-GAP-013
- **Gap 名称**：ORD/PAY 未达 workflow_ready
- **所属门禁维度**：模块成熟度
- **当前现状**：02 标注 ORD/PAY 当前为 crud_ready，阶段目标为 workflow_ready
- **目标状态**：ORD/PAY 达到 workflow_ready（关键业务流程可跑通，跨模块关联可走通）
- **差距内容**：ORD 缺少付款→激活联动和 dataScope；PAY 缺少确认→订单联动
- **影响范围**：ord.service.ts、pay.service.ts
- **优先级**：P1
- **整改建议**：修复 S2-GAP-002 后 ORD/PAY 可达 workflow_ready；同时补充 ORD dataScope 支持
- **建议责任落点**：后端

### S2-GAP-014
- **Gap 名称**：驾驶舱缺少 S2 商业化指标
- **所属门禁维度**：数据与结果指标
- **当前现状**：Cockpit.tsx 仅展示客户总数/活跃客户/待审批/待跟进等 S1 指标
- **目标状态**：驾驶舱展示报价金额/合同金额/回款率/成交转化率等 S2 经营数据
- **差距内容**：缺少 S2 指标聚合 API；缺少前端指标卡片
- **影响范围**：ai-runtime.service.ts（getCockpitData）、Cockpit.tsx
- **优先级**：P2
- **整改建议**：在 getCockpitData 中增加 S2 商业化指标聚合；在 Cockpit.tsx 中增加对应卡片
- **建议责任落点**：全栈联动

### S2-GAP-015
- **Gap 名称**：合同文档上传 API 缺失
- **所属门禁维度**：必须完成能力
- **当前现状**：ContractDocument entity 已定义但无上传/管理接口
- **目标状态**：合同签署流程中可关联实际文件
- **差距内容**：ct.controller.ts/ct.service.ts 缺少文档上传/列表/删除接口
- **影响范围**：ct.controller.ts、ct.service.ts
- **优先级**：P2
- **整改建议**：增加 POST /contracts/{id}/documents、GET /contracts/{id}/documents、DELETE /contracts/{id}/documents/{docId} 接口
- **建议责任落点**：后端

### S2-GAP-016
- **Gap 名称**：状态机缺少回退流转
- **所属门禁维度**：核心链路
- **当前现状**：quote 和 contract 的 rejected→draft 流转未定义，驳回后无法重新编辑提交
- **目标状态**：驳回后可重新编辑并再次提交审批
- **差距内容**：quote.sm.ts 和 contract.sm.ts 需增加 rejected→draft 合法迁移
- **影响范围**：quote.sm.ts、contract.sm.ts、qt.service.ts、ct.service.ts
- **优先级**：P2
- **整改建议**：在状态机中增加 rejected→draft 迁移，在 service 中增加 resubmit 方法
- **建议责任落点**：后端

### S2-GAP-017
- **Gap 名称**：ORD 列表查询不支持 dataScope
- **所属门禁维度**：权限与组织协作
- **当前现状**：ORD findOrders 仅按 orgId 过滤，无 self 模式
- **目标状态**：支持 self/team/org 数据范围过滤
- **差距内容**：ord.service.ts findOrders 需增加 dataScope 参数处理
- **影响范围**：ord.service.ts
- **优先级**：P2
- **整改建议**：参照 CM/LM 模块的 dataScope 实现方式，在 ORD findOrders 中增加 dataScope 过滤
- **建议责任落点**：后端

### S2-GAP-018
- **Gap 名称**：S2 前端页面缺失（SUB/CSM/KB/DASH/AUTO）
- **所属门禁维度**：必须完成能力
- **当前现状**：frontend/src/pages/ 下无 Subscriptions/SubscriptionDetail/Knowledge/KnowledgeManage/CustomerSuccess/Dashboards/Automation 相关页面
- **目标状态**：PAGE-SUB-001/002、PAGE-KB-001/002、PAGE-CSM-001、PAGE-DASH-001/002/003、PAGE-AUTO-001/002/003 对应页面存在且可操作
- **差距内容**：需新建 10+ 个前端页面及对应 services
- **影响范围**：frontend/src/pages/、frontend/src/services/、frontend/src/App.tsx（路由）
- **优先级**：P1
- **整改建议**：按 09/09A 中页面定义，逐个实现 S2 前端页面
- **建议责任落点**：前端

---

## 第四部分：整改优先顺序

### 必须先修的 P0（阻塞 S2 阶段完成）

1. **S2-GAP-007**：S2 模块审计日志集成 — 这是合规底线，所有 S2 模块写操作必须可审计
2. **S2-GAP-002**：付款确认→订单激活联动 — 这是成交链路的关键断裂点
3. **S2-GAP-009**：高风险动作强制 approval — 这是 S2 AI 治理的核心约束
4. **S2-GAP-008**：APC/TKC/RBC 升级至 workflow_ready — S2 门禁明确要求
5. **S2-GAP-001**：SUB 订阅模块实现 — 成交后衔接主干不可或缺
6. **S2-GAP-003**：CSM 客户成功模块实现 — S2 必须完成能力

### P0 修完后再做的 P1

7. **S2-GAP-013**：ORD/PAY 升级至 workflow_ready — 依赖 GAP-002 修复
8. **S2-GAP-004**：KB 知识库模块实现
9. **S2-GAP-005**：AUTO 触发式自动化模块实现
10. **S2-GAP-006**：DASH 驾驶舱增强
11. **S2-GAP-010**：TimelineService 订阅 S2 事件
12. **S2-GAP-011**：S2 权限种子补齐
13. **S2-GAP-018**：S2 前端页面补齐
14. **S2-GAP-012**：E2E 测试实现

### 最后补齐的 P2

15. **S2-GAP-014**：驾驶舱 S2 商业化指标
16. **S2-GAP-015**：合同文档上传 API
17. **S2-GAP-016**：状态机回退流转
18. **S2-GAP-017**：ORD dataScope 支持

**排序逻辑**：
- P0 优先级基于"是否阻塞 S2 阶段完成"判定：审计/联动/审批治理是合规底线，SUB/CSM 是必须完成能力
- P1 按模块间依赖排序：ORD/PAY 升级依赖联动修复，KB/AUTO/DASH 可并行开发
- P2 为增强项，不影响 S2 阶段完成判定但影响质量

---

## 第五部分：差距类型归因统计

| 差距类型 | 数量 | Gap 编号 |
|----------|------|----------|
| 零实现模块（需从零开发） | 5 | GAP-001(SUB), GAP-003(CSM), GAP-004(KB), GAP-005(AUTO), GAP-006(DASH部分) |
| API 存在但状态流转/联动不完整 | 2 | GAP-002(付款→激活), GAP-013(ORD/PAY workflow) |
| 代码存在但审计未集成 | 1 | GAP-007(审计) |
| AI 治理不符合 S2 约束 | 2 | GAP-008(APC/TKC/RBC升级), GAP-009(高风险approval) |
| 权限未闭环 | 2 | GAP-011(权限种子), GAP-017(dataScope) |
| 缺驾驶舱/指标采集 | 2 | GAP-010(Timeline), GAP-014(商业化指标) |
| 缺测试 | 1 | GAP-012(E2E) |
| 缺前端页面 | 1 | GAP-018(S2页面) |
| 流程细节缺失 | 2 | GAP-015(文档上传), GAP-016(回退流转) |

**简明分类汇总**：
- **零实现模块**：5 个（SUB/CSM/KB/AUTO/DASH部分），占 S2 应完成能力的 56%
- **代码存在但流程未通**：3 个（付款联动/审计/高风险审批）
- **权限未闭环**：2 个
- **缺测试**：1 个
- **缺驾驶舱/指标**：2 个
- **流程细节缺失**：2 个
- **缺前端页面**：1 个
