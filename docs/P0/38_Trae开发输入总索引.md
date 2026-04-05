# MOY Trae/Codex 开发输入总索引（唯一执行入口）

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_EXEC_001 |
| 文档版本 | v2.1 |
| 文档状态 | 已确认（冻结） |
| 日期 | 2026-04-05 |
| 执行对象 | Trae、Codex、前后端开发、测试、联调 |

## 2. 执行入口声明
- 本文档是 P0 唯一执行入口。
- `14_Trae_开发输入清单.md` 仅为历史参考，不具备执行效力。

## 3. 必读顺序（强制）
1. `41_SSOT冻结基线总报告.md`
2. `README.md`
3. `06_PRD_产品需求规格说明书_v0.1.md`
4. `07_RTM_需求跟踪矩阵.md`
5. `27_状态机实现规范.md`
6. `10_DBD_数据模型与数据字典.md`
7. `11_API_接口设计说明.md`
8. `32_页面实现规范.md`
9. `34_模块级详细设计.md`

## 4. 开发任务清单（与 RTM 一致）
| TASK ID | 模块 | 对应 REQ | 主要输出 |
| --- | --- | --- | --- |
| TASK-AUTH-001 | AUTH | REQ-AUTH-001 | 登录能力 |
| TASK-AUTH-002 | AUTH | REQ-AUTH-002 | 刷新令牌 |
| TASK-USR-001 | USR | REQ-USR-001 | 用户管理 |
| TASK-USR-002 | USR | REQ-USR-002 | 角色权限配置 |
| TASK-ORG-001 | ORG | REQ-ORG-001 | 组织设置 |
| TASK-CM-001 | CM | REQ-CM-001 | 客户列表与检索 |
| TASK-CM-002 | CM | REQ-CM-002 | 客户创建 |
| TASK-CM-003 | CM | REQ-CM-003 | 客户更新 |
| TASK-CM-004 | CM | REQ-CM-004 | 客户状态流转 |
| TASK-LM-001 | LM | REQ-LM-001 | 线索录入 |
| TASK-LM-002 | LM | REQ-LM-002 | 线索分配 |
| TASK-LM-003 | LM | REQ-LM-003 | 线索跟进 |
| TASK-LM-004 | LM | REQ-LM-004 | 线索转化 |
| TASK-OM-001 | OM | REQ-OM-001 | 商机创建与编辑 |
| TASK-OM-002 | OM | REQ-OM-002 | 商机阶段推进 |
| TASK-OM-003 | OM | REQ-OM-003 | 商机结果标记 |
| TASK-CNV-001 | CNV | REQ-CNV-001 | 会话列表与详情 |
| TASK-CNV-002 | CNV | REQ-CNV-002 | 消息发送 |
| TASK-CNV-003 | CNV | REQ-CNV-003 | 会话接入与转接 |
| TASK-CNV-004 | CNV | REQ-CNV-004 | 会话关闭 |
| TASK-CNV-005 | CNV | REQ-CNV-005 | 会话转工单 |
| TASK-TK-001 | TK | REQ-TK-001 | 工单创建 |
| TASK-TK-002 | TK | REQ-TK-002 | 工单分配 |
| TASK-TK-003 | TK | REQ-TK-003 | 工单处理与解决 |
| TASK-TK-004 | TK | REQ-TK-004 | 工单关闭 |
| TASK-TSK-001 | TSK | REQ-TSK-001 | 任务创建 |
| TASK-TSK-002 | TSK | REQ-TSK-002 | 任务状态更新 |
| TASK-NTF-001 | NTF | REQ-NTF-001 | 通知列表 |
| TASK-NTF-002 | NTF | REQ-NTF-002 | 通知已读 |
| TASK-CHN-001 | CHN | REQ-CHN-001 | 渠道配置 |
| TASK-AI-001 | AI | REQ-AI-001 | 智能回复 |
| TASK-AI-002 | AI | REQ-AI-002 | AI任务查询 |
| TASK-AUD-001 | AUD | REQ-AUD-001 | 审计日志查询 |
| TASK-SYS-001 | SYS | REQ-SYS-001 | 仪表盘汇总数据能力 |
| TASK-SYS-002 | SYS | REQ-SYS-002 | 系统配置查询与更新 |

## 5. 可立即启动的开发顺序
1. AUTH/ORG/USR
2. CM -> LM -> OM
3. CNV -> TK
4. TSK/NTF/CHN
5. AI/AUD/SYS
6. 前后端联调与 ACPT 验收

## 6. 并行策略
- 线A：CM/LM/OM
- 线B：CNV/TK
- 线C：前端页面并行（列表页 + 详情页）
- 线D：测试用例并行编写（TEST/ACPT）

## 7. 发布门禁
- RTM 覆盖率 100%
- API 契约一致性 100%
- 状态机合法流转测试通过
- 权限与租户隔离测试通过

## 8. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v2.1 | 2026-04-05 | 任务清单展开为逐条 TASK ID，完全对齐 RTM |
