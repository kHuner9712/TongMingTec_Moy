# Checklist — S2 成交与成交后衔接主干文档改造

## 阶段定义与范围裁决

- [x] 01_产品范围与阶段地图.md 中 S2 定义已更新为"成交与成交后衔接主干"
- [x] 01 中终局能力全图已反映 ORD/PAY/SUB 最小内核提前到 S2
- [x] 01 中阶段落地路径 5.2 已包含 ORD/PAY/SUB 最小内核
- [x] 01 中能力阶段映射表已更新
- [x] 02_业务域与模块树.md 中 ORD/PAY/SUB 的 introduced_in/required_in 已更新为 S2
- [x] 02 中模块与阶段关系表已更新
- [x] 02 中模块依赖表已更新
- [x] 13_历史映射与归档说明.md 已记录阶段调整裁决

## 需求与追踪矩阵

- [x] 03_全量需求总表.md 中 REQ-ORD-001/REQ-ORD-002 的 introduced_in/required_in 已调整为 S2
- [x] 03 中 REQ-PAY-001 的 introduced_in/required_in 已调整为 S2
- [x] 03 中 REQ-SUB-001 的 introduced_in/required_in 已调整为 S2
- [x] 03 中 QT/CT/CSM/KB/DASH/AUTO 的 REQ 阶段归属已确认无需调整
- [x] 04_需求追踪矩阵.md 中受影响 REQ 的 release_scope/implementation_stage 已更新
- [x] 04 中第二轮原子化补链已补充 QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO 闭环结果

## 数据与状态机

- [x] 05_对象模型与数据库设计.md 中 QT/CT/ORD/PAY/SUB 表的 introduced_in 已更新
- [x] 05 中 AUTO/KB/DASH/CSM 表的迁移顺序已补充
- [x] 05 中迁移顺序已反映 S2 新增表
- [x] 05A_终局关键表DDL展开.md 已新增 QT 模块 DDL（TABLE-QT-001~003）
- [x] 05A 已新增 CT 模块 DDL（TABLE-CT-001~003）
- [x] 05A 已新增 ORD 模块 DDL（TABLE-ORD-001~002）
- [x] 05A 已新增 PAY 模块 DDL（TABLE-PAY-001）
- [x] 05A 已新增 SUB 模块 DDL（TABLE-SUB-001~002）
- [x] 05A 已新增 CSM 模块 DDL（TABLE-CSM-001~003）
- [x] 05A 已新增 KB 模块 DDL（TABLE-KB-001~003）
- [x] 05A 已新增 DASH 模块 DDL（TABLE-DASH-001）
- [x] 05A 已新增 AUTO 模块 DDL（TABLE-AUTO-001~006）
- [x] 06_状态机总表.md 中 SM-order/SM-payment/SM-subscription 的 introduced_in/required_in 已调整为 S2
- [x] 06 中 S2 新增状态机与 S1 状态机的衔接说明已补充

## 权限与 AI 边界

- [x] 07_权限模型与AI边界.md 中 QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO 的 S2 权限点已确认完整
- [x] 07 中 ORD/PAY/SUB 最小内核的 S2 权限边界已补充
- [x] 07 中角色与模块权限矩阵已反映 S2 新增模块
- [x] 07 中 AI Agent 与 QT/CT/ORD/PAY 的集成边界已补充

## API 与 Schema

- [x] 08_API契约与Schema字典.md 中 API-ORD-001~004 的 introduced_in 已更新为 S2
- [x] 08 中 API-PAY-001 的 introduced_in 已更新为 S2
- [x] 08 中 API-SUB-001~002 的 introduced_in 已更新为 S2
- [x] 08 中 QT/CT/CSM/KB/DASH/AUTO 的 API 索引已确认完整
- [x] 08A_原子API与Schema展开.md 已新增 QT 模块原子 API
- [x] 08A 已新增 CT 模块原子 API
- [x] 08A 已新增 ORD 模块原子 API
- [x] 08A 已新增 PAY 模块原子 API
- [x] 08A 已新增 SUB 模块原子 API
- [x] 08A 已新增 CSM 模块原子 API
- [x] 08A 已新增 KB 模块原子 API
- [x] 08A 已新增 DASH 模块原子 API
- [x] 08A 已新增 AUTO 模块原子 API
- [x] 08B_原子Schema字段字典.md 已新增 QT 模块字段级 Schema
- [x] 08B 已新增 CT 模块字段级 Schema
- [x] 08B 已新增 ORD 模块字段级 Schema
- [x] 08B 已新增 PAY 模块字段级 Schema
- [x] 08B 已新增 SUB 模块字段级 Schema
- [x] 08B 已新增 CSM 模块字段级 Schema
- [x] 08B 已新增 KB 模块字段级 Schema
- [x] 08B 已新增 DASH 模块字段级 Schema
- [x] 08B 已新增 AUTO 模块字段级 Schema

## 页面与交互

- [x] 09_页面与交互规格.md 中 PAGE-QT-001/002/PAGE-CT-001/002 的 S2 页面定义已确认完整
- [x] 09 中 PAGE-ORD-001/002 的 S2 页面定义已新增
- [x] 09 中 PAGE-PAY-001 的 S2 页面定义已新增
- [x] 09 中 PAGE-SUB-001/002 的 S2 页面定义已新增
- [x] 09 中 PAGE-CSM/KB/DASH/AUTO 的 S2 页面定义已确认完整
- [x] 09A_关键页面逐页交互展开.md 已新增报价列表/详情页逐页交互
- [x] 09A 已新增合同列表/详情页逐页交互
- [x] 09A 已新增订单列表/详情页逐页交互
- [x] 09A 已新增付款页逐页交互
- [x] 09A 已新增订阅列表/详情页逐页交互
- [x] 09A 已新增客户成功/知识库/看板/自动化页逐页交互

## AI/自动化/商业化规范

- [x] 10_AI_Agent_自动化与集成执行规范.md 已补充 AUTO 触发式自动化主干规范
- [x] 10 已补充 Agent 与 QT/CT/ORD/PAY 的集成规则
- [x] 10 已补充自动化流程与成交链路的衔接说明
- [x] 11_商业化_交易与计费体系.md 已更新 ORD/PAY/SUB 的阶段归属为 S2 最小内核
- [x] 11 已补充 S2 最小内核的商业规则
- [x] 11 已明确 S2 最小内核与 S3 完整商业化能力的边界

## 测试与验收

- [x] 12_测试_验收_部署与迁移.md 已补充 QT/CT/ORD/PAY/SUB 的 S2 测试与验收
- [x] 12 已补充 CSM/KB/DASH/AUTO 的 S2 测试与验收
- [x] 12 已补充成交链路 E2E 验收方案
- [x] 12A_原子TEST_ACPT与发布门禁展开.md 已新增 QT/CT 模块原子 TEST/ACPT
- [x] 12A 已新增 ORD/PAY/SUB 模块原子 TEST/ACPT
- [x] 12A 已新增 CSM/KB/DASH/AUTO 模块原子 TEST/ACPT
- [x] 12A 已新增成交链路 E2E TEST/ACPT

## 交叉校验

- [x] 01~13 所有文档中 ORD/PAY/SUB 的阶段归属一致性已校验（已修复 05A/08A/11 主矩阵标注）
- [x] 03 REQ → 04 RTM → 05 TABLE → 06 SM → 07 PERM → 08 API → 09 PAGE → 12 TEST 的闭环完整性已校验
- [x] 05A DDL → 08A API → 08B Schema → 09A PAGE → 12A TEST 的实现级闭环已校验
- [x] 成交链路（OM→QT→CT→ORD→PAY→SUB）的文档衔接无断裂已校验

## 遗留项（P1，不阻塞 S2 开发）

- 05A 主矩阵中部分 TABLE（TABLE-QT-002/003, TABLE-CT-002/003, TABLE-ORD-002, TABLE-SUB-002, TABLE-CSM-001/003, TABLE-KB-001/003, TABLE-DASH-001, TABLE-AUTO-002/003/005/006）仅在 DDL 展开区存在，主矩阵索引行缺失
- 08A 主矩阵中 API-DASH-001/002/003 仅在 S2 展开区存在，主矩阵索引行缺失
- 09A 主表中 PAGE-CSM/KB/DASH/AUTO 仅在 S2 展开区存在，主表结构化合同行缺失
- 12A 主矩阵中部分 TEST/ACPT 仅在 S2 展开区存在，主矩阵索引行缺失
- 04 RTM 引用的 TABLE-CNV-003、TABLE-BILL-004 在 05A 中不存在
- 04 RTM 引用的部分逐 REQ ACPT（ACPT-QT-002/003 等）在 12A 中不存在
