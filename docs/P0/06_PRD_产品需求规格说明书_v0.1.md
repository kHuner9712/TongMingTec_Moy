# MOY 产品需求规格说明书（PRD）

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_PRD_001 |
| 文档版本 | v3.0 |
| 文档状态 | 已确认（冻结） |
| 日期 | 2026-04-05 |
| 上游输入 | `05_BRD_业务需求说明书.md` |
| 下游约束 | `07_RTM`、`09_HLD`、`10_DBD`、`11_API`、`32_页面实现规范` |

## 2. 范围冻结结论
- 首期 MVP（当前正式开发）= `P0`。
- `P1` 与 `P2` 不进入当前正式开发。

## 3. 编号与术语规则
- 需求：`REQ-{MOD}-{NNN}`
- 页面：`PAGE-{MOD}-{NNN}`
- 接口：`API-{MOD}-{NNN}`
- 权限：`PERM-{MOD}-{ACTION}`
- 路径参数：统一 `{id}`，禁止 `:id`

## 4. P0 需求清单（冻结）
| REQ ID | 模块 | 需求描述 | 优先级 | 页面 |
| --- | --- | --- | --- | --- |
| REQ-AUTH-001 | AUTH | 登录 | P0 | PAGE-SYS-001 |
| REQ-AUTH-002 | AUTH | 刷新令牌与会话续期 | P0 | PAGE-SYS-001 |
| REQ-USR-001 | USR | 用户列表与用户状态管理 | P0 | PAGE-USR-001 |
| REQ-USR-002 | USR | 角色权限配置 | P0 | PAGE-USR-002 |
| REQ-ORG-001 | ORG | 组织信息与部门管理 | P0 | PAGE-ORG-001 |
| REQ-CM-001 | CM | 客户列表检索 | P0 | PAGE-CM-001 |
| REQ-CM-002 | CM | 创建客户 | P0 | PAGE-CM-001 |
| REQ-CM-003 | CM | 更新客户信息 | P0 | PAGE-CM-002 |
| REQ-CM-004 | CM | 客户状态流转 | P0 | PAGE-CM-002 |
| REQ-LM-001 | LM | 线索录入 | P0 | PAGE-LM-001 |
| REQ-LM-002 | LM | 线索分配 | P0 | PAGE-LM-001 |
| REQ-LM-003 | LM | 线索跟进记录 | P0 | PAGE-LM-002 |
| REQ-LM-004 | LM | 线索转化商机 | P0 | PAGE-LM-002 |
| REQ-OM-001 | OM | 商机创建与编辑 | P0 | PAGE-OM-001 |
| REQ-OM-002 | OM | 商机阶段推进 | P0 | PAGE-OM-002 |
| REQ-OM-003 | OM | 商机结果标记（won/lost） | P0 | PAGE-OM-002 |
| REQ-CNV-001 | CNV | 会话列表与详情 | P0 | PAGE-CNV-001/PAGE-CNV-002 |
| REQ-CNV-002 | CNV | 消息发送 | P0 | PAGE-CNV-002 |
| REQ-CNV-003 | CNV | 会话接入与转接 | P0 | PAGE-CNV-002 |
| REQ-CNV-004 | CNV | 会话关闭 | P0 | PAGE-CNV-002 |
| REQ-CNV-005 | CNV | 会话创建工单 | P0 | PAGE-CNV-002 |
| REQ-TK-001 | TK | 工单创建 | P0 | PAGE-TK-001 |
| REQ-TK-002 | TK | 工单分配 | P0 | PAGE-TK-002 |
| REQ-TK-003 | TK | 工单处理与解决 | P0 | PAGE-TK-002 |
| REQ-TK-004 | TK | 工单关闭 | P0 | PAGE-TK-002 |
| REQ-TSK-001 | TSK | 任务创建 | P0 | PAGE-TSK-001 |
| REQ-TSK-002 | TSK | 任务状态更新 | P0 | PAGE-TSK-001 |
| REQ-NTF-001 | NTF | 通知列表 | P0 | PAGE-NTF-001 |
| REQ-NTF-002 | NTF | 通知已读 | P0 | PAGE-NTF-001 |
| REQ-CHN-001 | CHN | 渠道配置 | P0 | PAGE-CHN-001 |
| REQ-AI-001 | AI | 智能回复生成 | P0 | PAGE-CNV-002 |
| REQ-AI-002 | AI | AI任务状态查询 | P0 | PAGE-CNV-002 |
| REQ-AUD-001 | AUD | 审计日志查询 | P0 | PAGE-AUD-001 |

## 5. 页面清单（P0）
| PAGE ID | 页面名称 | 路由 | 模块 | 优先级 |
| --- | --- | --- | --- | --- |
| PAGE-SYS-001 | 登录页 | `/login` | AUTH | P0 |
| PAGE-SYS-002 | 仪表盘 | `/dashboard` | SYS | P0 |
| PAGE-CM-001 | 客户列表 | `/customers` | CM | P0 |
| PAGE-CM-002 | 客户详情 | `/customers/{id}` | CM | P0 |
| PAGE-LM-001 | 线索列表 | `/leads` | LM | P0 |
| PAGE-LM-002 | 线索详情 | `/leads/{id}` | LM | P0 |
| PAGE-OM-001 | 商机列表 | `/opportunities` | OM | P0 |
| PAGE-OM-002 | 商机详情 | `/opportunities/{id}` | OM | P0 |
| PAGE-CNV-001 | 会话列表 | `/conversations` | CNV | P0 |
| PAGE-CNV-002 | 会话详情 | `/conversations/{id}` | CNV | P0 |
| PAGE-TK-001 | 工单列表 | `/tickets` | TK | P0 |
| PAGE-TK-002 | 工单详情 | `/tickets/{id}` | TK | P0 |
| PAGE-TSK-001 | 任务中心 | `/tasks` | TSK | P0 |
| PAGE-NTF-001 | 通知中心 | `/notifications` | NTF | P0 |
| PAGE-CHN-001 | 渠道配置 | `/channels` | CHN | P0 |
| PAGE-ORG-001 | 组织设置 | `/settings/organization` | ORG | P0 |
| PAGE-USR-001 | 用户管理 | `/settings/users` | USR | P0 |
| PAGE-USR-002 | 角色权限 | `/settings/roles` | USR | P0 |
| PAGE-AUD-001 | 审计日志 | `/settings/audit-logs` | AUD | P0 |

路由规则：
- `/` 只做重定向到 `/dashboard`。

## 6. 状态机定义（PRD 权威值）
| 状态机ID | 实体 | 枚举 |
| --- | --- | --- |
| SM-customer | 客户 | `potential, active, silent, lost` |
| SM-lead | 线索 | `new, assigned, following, converted, invalid` |
| SM-opportunity | 商机 | `discovery, qualification, proposal, negotiation, won, lost` |
| SM-conversation | 会话 | `queued, active, closed` |
| SM-ticket | 工单 | `pending, assigned, processing, resolved, closed` |
| SM-task | 任务 | `pending, in_progress, completed, cancelled` |
| SM-ai_task | AI任务 | `pending, running, succeeded, failed, cancelled` |

## 7. 权限口径（PRD 约束）
- 会话权限必须拆分为：
  - `PERM-CNV-SEND`
  - `PERM-CNV-ACCEPT`
  - `PERM-CNV-TRANSFER`
  - `PERM-CNV-CLOSE`
- 禁止使用聚合型权限 `conversation:handle`。

## 8. 接口契约规则
- API ID 与路由、方法、权限映射以 `11_API_接口设计说明.md` 为准。
- 商机结果字段统一为：`won`、`lost`。
- 禁止出现 `win/lose` 作为状态枚举值。
- 知识问答术语统一使用 `qa`（当前 P0 不启用该能力）。

## 9. P1/P2 规划（仅记录，不实现）
| 模块 | 范围 | 状态 |
| --- | --- | --- |
| KB | 知识库检索与维护 | 暂不纳入 |
| DASH | 数据看板 | 暂不纳入 |
| AUTO | 自动化规则 | 暂不纳入 |
| AIOPS | AI工作台高级能力 | 暂不纳入 |
| 合同/订单/发票/续费 | 商业化链路 | 保留规划 |

## 10. 验收原则
- 仅对 P0 需求进行 TEST 与 ACPT 闭环。
- P1/P2 不纳入本轮发布验收。

## 11. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v3.0 | 2026-04-05 | PRD SSOT 冻结：P0 单范围、统一编号、统一状态、统一权限口径 |
