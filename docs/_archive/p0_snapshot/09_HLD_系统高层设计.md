# MOY 系统高层设计（HLD）

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_HLD_001 |
| 文档版本 | v2.0 |
| 文档状态 | 已确认（冻结） |
| 日期 | 2026-04-05 |
| 上游输入 | `05_BRD`、`06_PRD`、`07_RTM` |
| 下游约束 | `10_DBD`、`11_API`、`32_页面实现规范`、`34_模块级详细设计` |

## 2. 适用范围
- 当前正式开发范围：`P0`。
- 本文档仅描述 P0 可交付架构，不将 P1/P2 作为实现前提。

## 3. 架构目标
- 单一业务口径：REQ/API/状态机/权限一致。
- 可并行开发：前后端按 RTM 闭环对齐。
- 可审计：关键动作具备审计日志与追踪 ID。
- 可演进：P1/P2 通过扩展点承接，不污染 P0 主链路。

## 4. 总体架构
```
客户端（Web）
  -> API Gateway
    -> 应用服务层（NestJS）
      -> 领域模块（AUTH/ORG/USR/CM/LM/OM/CNV/TK/TSK/NTF/CHN/AI/AUD/SYS）
        -> 数据层（PostgreSQL + Redis）
          -> 基础能力（审计、权限、多租户、任务调度）
```

## 5. P0 模块分层与边界
| 模块 | 职责 | 关键实体 | 关键接口前缀 |
| --- | --- | --- | --- |
| AUTH | 登录、令牌续期、当前用户上下文 | user_session | `/api/v1/auth/*` |
| ORG/USR | 组织、部门、用户、角色、权限 | organizations, users, roles | `/api/v1/organizations/*`, `/api/v1/users/*` |
| CM | 客户资料与生命周期 | customers | `/api/v1/customers/*` |
| LM | 线索录入、分配、跟进、转化 | leads | `/api/v1/leads/*` |
| OM | 商机推进与赢单/输单结果 | opportunities | `/api/v1/opportunities/*` |
| CNV | 会话接入、消息、转接、关单 | conversations, conversation_messages | `/api/v1/conversations/*` |
| TK | 工单创建、流转、解决、关闭 | tickets, ticket_logs | `/api/v1/tickets/*` |
| TSK | 任务派发与状态跟踪 | tasks | `/api/v1/tasks/*` |
| NTF | 通知列表与已读处理 | notifications | `/api/v1/notifications/*` |
| CHN | 渠道配置 | channels | `/api/v1/channels/*` |
| AI | 智能回复任务生成与查询 | ai_tasks | `/api/v1/ai/*` |
| AUD | 审计检索 | audit_logs | `/api/v1/audit-logs/*` |
| SYS | 仪表盘汇总与系统配置（受限） | system_configs | `/api/v1/dashboard/*`, `/api/v1/system-configs/*` |

## 6. 关键业务链路（P0）

### 6.1 线索转化链路
- `REQ-LM-001` 录入线索
- `REQ-LM-002` 分配线索
- `REQ-LM-003` 跟进线索
- `REQ-LM-004` 转化商机

### 6.2 会话服务链路
- `REQ-CNV-001` 进入会话详情
- `REQ-CNV-002` 消息发送
- `REQ-CNV-003` 接入/转接
- `REQ-CNV-004` 关闭会话
- `REQ-CNV-005` 会话转工单

### 6.3 工单闭环链路
- `REQ-TK-001` 创建工单
- `REQ-TK-002` 分配工单
- `REQ-TK-003` 处理并解决
- `REQ-TK-004` 关闭工单

### 6.4 系统模块链路
- `REQ-SYS-001` 仪表盘汇总数据展示
- `REQ-SYS-002` 系统配置查询与更新

## 7. 状态机架构约束
统一采用 `SM-*`：
- `SM-customer`
- `SM-lead`
- `SM-opportunity`
- `SM-conversation`
- `SM-ticket`
- `SM-task`
- `SM-ai_task`

状态值以 `27_状态机实现规范.md` 为唯一实现口径。

## 8. 权限与租户隔离
- 权限模型：RBAC + 数据范围控制。
- 禁止使用聚合会话权限 `conversation:handle`。
- 会话权限分解为：`PERM-CNV-SEND/ACCEPT/TRANSFER/CLOSE`。
- 每条业务数据必须携带租户上下文（`org_id`）。

## 9. 路由与页面约束
- 首页唯一路由：`/dashboard`。
- `/` 仅重定向，不作为业务页面。
- 会话页面唯一口径：
  - 列表：`PAGE-CNV-001 /conversations`
  - 详情：`PAGE-CNV-002 /conversations/{id}`

## 10. P1/P2 出界规则
- P1/P2 仅允许在扩展章节声明，不得写入 P0 API/DB/页面清单。
- 任何出界需求必须新增版本并经评审后进入下一个冻结周期。

## 11. 一致性检查结论
- 与 PRD：一致（P0 单范围）。
- 与 RTM：一致（REQ 闭环完整）。
- 与 DBD/API：通过本次收口统一。

## 12. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v2.0 | 2026-04-05 | HLD 收口重写：仅保留 P0 可实现架构，统一状态机/权限/路由口径 |
