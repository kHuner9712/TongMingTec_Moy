# Tasks — 04 需求追踪矩阵 S2 成交链路衔接补齐

- [x] Task 1: 在 4.4 节新增 4 条 RTM 行
  - [x] SubTask 1.1: 新增 REQ-QT-004 RTM 行（插入 REQ-QT-003 之后）
  - [x] SubTask 1.2: 新增 REQ-CT-005 RTM 行（插入 REQ-CT-004 之后）
  - [x] SubTask 1.3: 新增 REQ-ORD-004 RTM 行（插入 REQ-ORD-002 之后、REQ-ORD-003 之前）
  - [x] SubTask 1.4: 新增 REQ-CSM-005 RTM 行（插入 REQ-CSM-004 之后）

- [x] Task 2: 在 4.2 节新增 1 条 RTM 行
  - [x] SubTask 2.1: 新增 REQ-AUTO-005 RTM 行（插入 REQ-AUTO-004 之后）

- [x] Task 3: 在 4.3 节新增 2 条 RTM 行
  - [x] SubTask 3.1: 新增 REQ-KB-005 RTM 行（插入 REQ-KB-004 之后）
  - [x] SubTask 3.2: 新增 REQ-DASH-004 RTM 行（插入 REQ-DASH-003 之后）

- [x] Task 4: 在第 7 节补链表新增对应条目
  - [x] SubTask 4.1: 新增 REQ-QT-004/CT-005/ORD-004 补链行（成交链路衔接）
  - [x] SubTask 4.2: 新增 REQ-CSM-005 补链行（客户成功衔接）
  - [x] SubTask 4.3: 新增 REQ-AUTO-005 补链行（自动化触发器）
  - [x] SubTask 4.4: 新增 REQ-DASH-004/KB-005 补链行（增强模块）

- [x] Task 5: 交叉校验
  - [x] SubTask 5.1: 确认新增 RTM 行与 03 的 REQ 字段一致 ✅
  - [x] SubTask 5.2: 确认 TABLE/SM/PERM/API/PAGE/TEST/ACPT 编码不与现有编码冲突 ✅
  - [x] SubTask 5.3: 确认 implementation_stage 标记正确 ✅

# Task Dependencies

- Task 1/2/3 可并行
- Task 4 依赖 Task 1/2/3
- Task 5 必须最后完成
