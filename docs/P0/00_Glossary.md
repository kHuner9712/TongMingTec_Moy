# MOY 术语表与命名规范（Glossary）

## 1. 范围术语
| 术语 | 定义 |
| --- | --- |
| P0 | 当前正式开发范围 |
| P1 | 暂不纳入当前正式开发 |
| P2 | 保留规划，不实现 |
| SSOT | 单一事实源 |

## 2. 状态术语（标准）
| 实体 | 标准枚举 |
| --- | --- |
| customer | potential, active, silent, lost |
| lead | new, assigned, following, converted, invalid |
| opportunity | discovery, qualification, proposal, negotiation, won, lost |
| conversation | queued, active, closed |
| ticket | pending, assigned, processing, resolved, closed |
| task | pending, in_progress, completed, cancelled |
| ai_task | pending, running, succeeded, failed, cancelled |

## 3. 命名规范
| 类型 | 规则 |
| --- | --- |
| REQ | `REQ-{MOD}-{NNN}` |
| PAGE | `PAGE-{MOD}-{NNN}` |
| API | `API-{MOD}-{NNN}` |
| PERM | `PERM-{MOD}-{ACTION}` |
| TASK | `TASK-{MOD}-{NNN}` |

## 4. 禁止写法
- 路径参数 `:id`
- 状态值 `waiting`
- 商机结果 `win/lose`
- 会话聚合权限 `conversation:handle`

## 5. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v2.0 | 2026-04-05 | 术语与命名按 SSOT 冻结 |
