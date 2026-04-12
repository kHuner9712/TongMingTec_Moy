# Tasks — S2 成交与成交后衔接主干文档改造

## 阶段 0：阶段定义与范围裁决

- [x] Task 0.1: 修改 01_产品范围与阶段地图.md — 重新定义 S2 阶段
  - [x] SubTask 0.1.1: 将 S2 定义从"首期完整版/增强版"改为"成交与成交后衔接主干"
  - [x] SubTask 0.1.2: 更新终局能力全图中 ORD/PAY/SUB 的阶段归属（最小内核提前到 S2）
  - [x] SubTask 0.1.3: 更新阶段落地路径 5.2 S2 范围，新增 ORD/PAY/SUB 最小内核
  - [x] SubTask 0.1.4: 更新能力阶段映射表

- [x] Task 0.2: 修改 02_业务域与模块树.md — 更新模块阶段归属
  - [x] SubTask 0.2.1: 更新 ORD/PAY/SUB 的 `introduced_in`/`required_in` 为 S2
  - [x] SubTask 0.2.2: 更新模块与阶段关系表中 ORD/PAY/SUB 的 `release_scope` 和 `status`
  - [x] SubTask 0.2.3: 更新模块依赖表中 ORD/PAY/SUB 的依赖说明

- [x] Task 0.3: 修改 13_历史映射与归档说明.md — 记录阶段调整裁决
  - [x] SubTask 0.3.1: 新增"ORD/PAY/SUB 最小内核从 S3 提前到 S2"的裁决记录
  - [x] SubTask 0.3.2: 新增"S2 定义从'首期完整版/增强版'改为'成交与成交后衔接主干'"的裁决记录

## 阶段 1：需求与追踪矩阵更新

- [x] Task 1.1: 修改 03_全量需求总表.md — 调整 REQ 阶段归属
  - [x] SubTask 1.1.1: 将 REQ-ORD-001/REQ-ORD-002 的 `introduced_in`/`required_in` 从 S3 调整为 S2
  - [x] SubTask 1.1.2: 将 REQ-PAY-001 的 `introduced_in`/`required_in` 从 S3 调整为 S2
  - [x] SubTask 1.1.3: 将 REQ-SUB-001 的 `introduced_in`/`required_in` 从 S3 调整为 S2
  - [x] SubTask 1.1.4: 确认 REQ-QT-001~003/REQ-CT-001~004/REQ-CSM-001~004/REQ-KB-001~004/REQ-DASH-001~003/REQ-AUTO-001~004 的阶段归属无需调整
  - [x] SubTask 1.1.5: 新增 AUTO 触发式自动化主干 REQ（如需补充）

- [x] Task 1.2: 修改 04_需求追踪矩阵.md — 同步更新追踪
  - [x] SubTask 1.2.1: 更新 REQ-ORD-001/REQ-ORD-002 的 `release_scope`/`implementation_stage`
  - [x] SubTask 1.2.2: 更新 REQ-PAY-001 的 `release_scope`/`implementation_stage`
  - [x] SubTask 1.2.3: 更新 REQ-SUB-001 的 `release_scope`/`implementation_stage`
  - [x] SubTask 1.2.4: 补充第二轮原子化补链中 QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO 的闭环结果

## 阶段 2：数据与状态机文档更新

- [x] Task 2.1: 修改 05_对象模型与数据库设计.md — 补充建模说明
  - [ ] SubTask 2.1.1: 更新 QT/CT/ORD/PAY/SUB 表的 `introduced_in` 字段
  - [ ] SubTask 2.1.2: 补充 AUTO/KB/DASH/CSM 表的迁移顺序说明
  - [ ] SubTask 2.1.3: 更新迁移顺序第 6-8 步，反映 S2 阶段新增表

- [x] Task 2.2: 修改 05A_终局关键表DDL展开.md — 新增原子 DDL
  - [ ] SubTask 2.2.1: 新增 TABLE-QT-001/TABLE-QT-002/TABLE-QT-003 的 DDL
  - [ ] SubTask 2.2.2: 新增 TABLE-CT-001/TABLE-CT-002/TABLE-CT-003 的 DDL
  - [ ] SubTask 2.2.3: 新增 TABLE-ORD-001/TABLE-ORD-002 的 DDL
  - [ ] SubTask 2.2.4: 新增 TABLE-PAY-001 的 DDL
  - [ ] SubTask 2.2.5: 新增 TABLE-SUB-001/TABLE-SUB-002 的 DDL
  - [ ] SubTask 2.2.6: 新增 TABLE-CSM-001/TABLE-CSM-002/TABLE-CSM-003 的 DDL
  - [ ] SubTask 2.2.7: 新增 TABLE-KB-001/TABLE-KB-002/TABLE-KB-003 的 DDL
  - [ ] SubTask 2.2.8: 新增 TABLE-DASH-001 的 DDL
  - [ ] SubTask 2.2.9: 新增 TABLE-AUTO-001~006 的 DDL

- [x] Task 2.3: 修改 06_状态机总表.md — 调整阶段适用范围
  - [ ] SubTask 2.3.1: 将 SM-order/SM-payment/SM-subscription 的 `introduced_in`/`required_in` 从 S3 调整为 S2
  - [ ] SubTask 2.3.2: 确认 SM-quote/SM-contract/SM-automation_flow/SM-knowledge_item/SM-campaign/SM-ai_agent/SM-approval_request 的阶段归属无需调整
  - [ ] SubTask 2.3.3: 补充 S2 新增状态机与 S1 状态机的衔接说明

## 阶段 3：权限与 AI 边界更新

- [x] Task 3.1: 修改 07_权限模型与AI边界.md — 补充 S2 权限点
  - [ ] SubTask 3.1.1: 确认 PERM-QT-*/PERM-CT-*/PERM-ORD-*/PERM-PAY-*/PERM-SUB-*/PERM-CSM-*/PERM-KB-*/PERM-DASH-VIEW/PERM-AUTO-* 的 S2 权限点定义完整性
  - [ ] SubTask 3.1.2: 补充 ORD/PAY/SUB 最小内核的 S2 权限边界
  - [ ] SubTask 3.1.3: 更新角色与模块权限矩阵，反映 S2 新增模块
  - [ ] SubTask 3.1.4: 补充 AI Agent 与 QT/CT/ORD/PAY 的集成边界

## 阶段 4：API 与 Schema 文档更新

- [x] Task 4.1: 修改 08_API契约与Schema字典.md — 补充 S2 API 索引
  - [ ] SubTask 4.1.1: 更新 API-ORD-001~004 的 `introduced_in` 为 S2
  - [ ] SubTask 4.1.2: 更新 API-PAY-001 的 `introduced_in` 为 S2
  - [ ] SubTask 4.1.3: 更新 API-SUB-001~002 的 `introduced_in` 为 S2
  - [ ] SubTask 4.1.4: 确认 API-QT-001~004/API-CT-001~005/API-CSM-001~004/API-KB-001~006/API-DASH-001~003/API-AUTO-001~006 的索引完整性

- [x] Task 4.2: 修改 08A_原子API与Schema展开.md — 新增原子 API 合同
  - [ ] SubTask 4.2.1: 新增 QT 模块原子 API（API-QT-001~006）
  - [ ] SubTask 4.2.2: 新增 CT 模块原子 API（API-CT-001~007）
  - [ ] SubTask 4.2.3: 新增 ORD 模块原子 API（API-ORD-001~006）
  - [ ] SubTask 4.2.4: 新增 PAY 模块原子 API（API-PAY-001~003）
  - [ ] SubTask 4.2.5: 新增 SUB 模块原子 API（API-SUB-001~006）
  - [ ] SubTask 4.2.6: 新增 CSM 模块原子 API（API-CSM-001~004）
  - [ ] SubTask 4.2.7: 新增 KB 模块原子 API（API-KB-001~006）
  - [ ] SubTask 4.2.8: 新增 DASH 模块原子 API（API-DASH-001~003）
  - [ ] SubTask 4.2.9: 新增 AUTO 模块原子 API（API-AUTO-001~006）

- [x] Task 4.3: 修改 08B_原子Schema字段字典.md — 新增字段级 Schema
  - [ ] SubTask 4.3.1: 新增 QT 模块字段级 Schema
  - [ ] SubTask 4.3.2: 新增 CT 模块字段级 Schema
  - [ ] SubTask 4.3.3: 新增 ORD 模块字段级 Schema
  - [ ] SubTask 4.3.4: 新增 PAY 模块字段级 Schema
  - [ ] SubTask 4.3.5: 新增 SUB 模块字段级 Schema
  - [ ] SubTask 4.3.6: 新增 CSM 模块字段级 Schema
  - [ ] SubTask 4.3.7: 新增 KB 模块字段级 Schema
  - [ ] SubTask 4.3.8: 新增 DASH 模块字段级 Schema
  - [ ] SubTask 4.3.9: 新增 AUTO 模块字段级 Schema

## 阶段 5：页面与交互文档更新

- [x] Task 5.1: 修改 09_页面与交互规格.md — 补充 S2 页面清单
  - [ ] SubTask 5.1.1: 确认 PAGE-QT-001/PAGE-QT-002/PAGE-CT-001/PAGE-CT-002 的 S2 页面定义完整性
  - [ ] SubTask 5.1.2: 新增 PAGE-ORD-001/PAGE-ORD-002 的 S2 页面定义
  - [ ] SubTask 5.1.3: 新增 PAGE-PAY-001 的 S2 页面定义
  - [ ] SubTask 5.1.4: 新增 PAGE-SUB-001/PAGE-SUB-002 的 S2 页面定义
  - [ ] SubTask 5.1.5: 确认 PAGE-CSM-001~003/PAGE-KB-001~002/PAGE-DASH-001~003/PAGE-AUTO-001~003 的 S2 页面定义完整性

- [x] Task 5.2: 修改 09A_关键页面逐页交互展开.md — 新增逐页交互合同
  - [ ] SubTask 5.2.1: 新增报价列表/详情页逐页交互
  - [ ] SubTask 5.2.2: 新增合同列表/详情页逐页交互
  - [ ] SubTask 5.2.3: 新增订单列表/详情页逐页交互
  - [ ] SubTask 5.2.4: 新增付款页逐页交互
  - [ ] SubTask 5.2.5: 新增订阅列表/详情页逐页交互
  - [ ] SubTask 5.2.6: 新增客户成功/知识库/看板/自动化页逐页交互

## 阶段 6：AI/自动化/商业化规范更新

- [x] Task 6.1: 修改 10_AI_Agent_自动化与集成执行规范.md — 补充自动化主干
  - [ ] SubTask 6.1.1: 补充 AUTO 触发式自动化主干规范（事件驱动、节点类型、执行记录）
  - [ ] SubTask 6.1.2: 补充 Agent 与 QT/CT/ORD/PAY 的集成规则
  - [ ] SubTask 6.1.3: 补充自动化流程与成交链路的衔接说明

- [x] Task 6.2: 修改 11_商业化_交易与计费体系.md — 调整阶段归属
  - [ ] SubTask 6.2.1: 更新 ORD/PAY/SUB 的阶段归属为 S2 最小内核
  - [ ] SubTask 6.2.2: 补充 S2 最小内核的商业规则（订单→付款→开通链路）
  - [ ] SubTask 6.2.3: 明确 S2 最小内核与 S3 完整商业化能力的边界

## 阶段 7：测试与验收文档更新

- [x] Task 7.1: 修改 12_测试_验收_部署与迁移.md — 补充 S2 测试
  - [ ] SubTask 7.1.1: 补充 QT/CT/ORD/PAY/SUB 的 S2 测试与验收
  - [ ] SubTask 7.1.2: 补充 CSM/KB/DASH/AUTO 的 S2 测试与验收
  - [ ] SubTask 7.1.3: 补充成交链路 E2E 验收方案

- [x] Task 7.2: 修改 12A_原子TEST_ACPT与发布门禁展开.md — 新增原子测试
  - [ ] SubTask 7.2.1: 新增 QT/CT 模块原子 TEST/ACPT
  - [ ] SubTask 7.2.2: 新增 ORD/PAY/SUB 模块原子 TEST/ACPT
  - [ ] SubTask 7.2.3: 新增 CSM/KB/DASH/AUTO 模块原子 TEST/ACPT
  - [ ] SubTask 7.2.4: 新增成交链路 E2E TEST/ACPT

## 阶段 8：交叉校验与闭环确认

- [x] Task 8.1: 全文档交叉校验
  - [ ] SubTask 8.1.1: 校验 01~13 所有文档中 ORD/PAY/SUB 的阶段归属一致性
  - [ ] SubTask 8.1.2: 校验 03 REQ → 04 RTM → 05 TABLE → 06 SM → 07 PERM → 08 API → 09 PAGE → 12 TEST 的闭环完整性
  - [ ] SubTask 8.1.3: 校验 05A DDL → 08A API → 08B Schema → 09A PAGE → 12A TEST 的实现级闭环
  - [ ] SubTask 8.1.4: 校验成交链路（OM→QT→CT→ORD→PAY→SUB）的文档衔接无断裂

# Task Dependencies

- Task 0.1/0.2/0.3 必须最先完成（阶段定义是一切的基础）
- Task 1.1/1.2 依赖 Task 0.1/0.2（需求阶段归属依赖模块阶段定义）
- Task 2.1/2.2/2.3 依赖 Task 1.1（表/状态机依赖需求定义）
- Task 3.1 依赖 Task 2.3（权限依赖状态机定义）
- Task 4.1/4.2/4.3 依赖 Task 2.1/2.3/3.1（API 依赖表/状态机/权限）
- Task 5.1/5.2 依赖 Task 4.1/4.2（页面依赖 API）
- Task 6.1/6.2 依赖 Task 2.3/3.1（AI/商业化规范依赖状态机/权限）
- Task 7.1/7.2 依赖 Task 4.2/5.2（测试依赖 API/页面）
- Task 8.1 必须最后完成（交叉校验依赖所有文档更新完毕）

# 并行化说明

- Task 0.1/0.2/0.3 可并行
- Task 2.1/2.2/2.3 可并行
- Task 4.2/4.3 可并行
- Task 5.1/5.2 可并行
- Task 6.1/6.2 可并行
- Task 7.1/7.2 可并行
