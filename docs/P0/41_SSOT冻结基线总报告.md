# MOY SSOT 冻结基线总报告

## 1. 本次整改目标
- 形成全仓单一事实源（SSOT）。
- 消除所有会导致实现偏差的双口径。
- 使前后端、测试、联调、验收与开发代理可以基于同一套定义执行。

## 2. 单一事实源定义
- SSOT 以正文基线文档为准，报告类文档不得高于正文。
- 裁决优先级：
  1. 本文档（41）
  2. README
  3. PRD
  4. RTM
  5. 状态机规范
  6. DBD
  7. API
  8. 页面实现规范
  9. 模块级详细设计
  10. 执行总索引（38）

## 3. 当前正式开发冻结范围
- P0：AUTH、ORG、USR、CM、LM、OM、CNV、TK、TSK、NTF、CHN、AI、AUD、SYS

## 4. 不进入当前正式开发范围
- P1：KB、DASH、AUTO、AIOPS（暂不纳入）
- P2：合同、订单、发票、续费、呼叫中心、移动端（保留规划但不实现）

## 5. 文档体系最终主基线
- 业务：`05_BRD`
- 产品：`06_PRD`
- 追踪：`07_RTM`
- 架构：`09_HLD`
- 数据：`10_DBD`
- 接口：`11_API`
- 权限：`17_权限模型设计`
- 状态：`27_状态机实现规范`
- 页面：`32_页面实现规范`
- 模块：`34_模块级详细设计`
- 执行：`38_Trae开发输入总索引`

## 6. 编号规范最终版
| 类型 | 规则 | 示例 |
| --- | --- | --- |
| REQ | `REQ-{MOD}-{NNN}` | `REQ-CM-001` |
| PAGE | `PAGE-{MOD}-{NNN}` | `PAGE-CNV-002` |
| API | `API-{MOD}-{NNN}` | `API-TK-006` |
| PERM | `PERM-{MOD}-{ACTION}` | `PERM-CNV-TRANSFER` |
| TEST | `TEST-{MOD}-{NNN}` | `TEST-OM-003` |
| ACPT | `ACPT-{MOD}-{NNN}` | `ACPT-LM-004` |
| TRAE/CODEX 任务 | `TASK-{MOD}-{NNN}` | `TASK-CNV-002` |
| TABLE | `TABLE-{MOD}-{NNN}` | `TABLE-CM-001` |
| 状态机 | `SM-{ENTITY}` | `SM-opportunity` |

## 7. API 契约最终版规则
- 路径参数统一 `{id}`。
- 契约以 `11_API` 为唯一接口基线。
- API ID 与 HTTP 方法解耦，方法在接口定义中显式声明。
- 商机结果统一 `won/lost`。
- 禁止 `win/lose`、`waiting`、`:id`、`ask/qa` 混用。

## 8. 状态机最终版规则
| 实体 | 枚举 |
| --- | --- |
| customer | potential, active, silent, lost |
| lead | new, assigned, following, converted, invalid |
| opportunity | discovery, qualification, proposal, negotiation, won, lost |
| conversation | queued, active, closed |
| ticket | pending, assigned, processing, resolved, closed |
| task | pending, in_progress, completed, cancelled |
| ai_task | pending, running, succeeded, failed, cancelled |

## 9. 页面与路由最终版规则
- 编号：`PAGE-{MOD}-{NNN}`。
- 首页：`/dashboard`（`/` 仅重定向）。
- 会话详情唯一页面：`PAGE-CNV-002 /conversations/{id}`。
- P1 页面不得出现在 P0 页面清单。

## 10. 权限模型最终版规则
- 权限 ID：`PERM-{MOD}-{ACTION}`。
- 会话权限必须拆分：SEND/ACCEPT/TRANSFER/CLOSE。
- 禁用 `conversation:handle` 聚合权限。
- API 权限字段必须引用存在的 PERM ID。

## 11. 数据模型最终版规则
- 表 ID：`TABLE-{MOD}-{NNN}`。
- 仅保留 P0 在建表。
- 禁止游离对象、禁止无根据补表。
- DBD 与 RTM/API 必须一一映射。

## 12. 执行入口文档最终说明
- 保留并升级 `38_Trae开发输入总索引.md` 为唯一执行入口。
- `14_Trae_开发输入清单.md` 退化为历史参考，不再作为执行基线。

## 13. 冲突修复清单
| 冲突类别 | 修复结果 |
| --- | --- |
| 范围冻结口径冲突 | 统一为 P0 |
| 首期 MVP 定义冲突 | 统一为 P0 |
| 编号体系冲突 | 全面统一 |
| API 路径/方法/权限冲突 | 全面对齐 API 基线 |
| 状态枚举冲突 | 全面对齐状态机基线 |
| 权限模型冲突 | 细粒度权限统一 |
| 页面编号与路由冲突 | 全面对齐页面基线 |
| 执行入口双口径 | 统一 38 为唯一入口 |
| 报告与正文冲突 | 报告已重写并从属于正文 |

## 14. 遗留事项清单（仅不阻塞项）
- TBD-001：LLM 供应商商务条款
- TBD-002：P1 知识库模型细化
- TBD-003：P1 看板指标口径
- TBD-004：P2 呼叫中心预研

以上事项均不阻塞 P0 开发。

## 15. 最终结论
- 当前文档体系已达到“可全量开发（P0）”标准。
- 结论基于正文事实，不基于口号式报告。

## 16. 可立即启动的开发顺序
1. AUTH/ORG/USR
2. CM -> LM -> OM
3. CNV -> TK
4. TSK/NTF/CHN
5. AI/AUD/SYS
6. 前后端联调与 ACPT 验收

## 17. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-04-05 | SSOT 冻结基线总报告首次发布 |
