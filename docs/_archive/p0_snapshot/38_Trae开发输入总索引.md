# MOY Trae/Codex 开发输入总索引（唯一执行入口）

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_EXEC_001 |
| 文档版本 | v3.0 |
| 文档状态 | 已确认（实现级冻结） |
| 日期 | 2026-04-05 |
| 执行对象 | Trae、Codex、前后端开发、测试、联调、发布 |

## 2. 执行入口声明
- 本文档是 P0 唯一执行入口。
- `14_Trae_开发输入清单.md` 仅历史参考，不得作为执行基线。

## 3. 必读文档（强制顺序）
1. `41_SSOT冻结基线总报告.md`
2. `README.md`
3. `06_PRD_产品需求规格说明书_v0.1.md`
4. `07_RTM_需求跟踪矩阵.md`
5. `10_DBD_数据模型与数据字典.md`
6. `11_API_接口设计说明.md`
7. `42_API请求响应Schema字典.md`
8. `27_状态机实现规范.md`
9. `17_权限模型设计.md`
10. `32_页面实现规范.md`
11. `43_页面级详细交互规格.md`
12. `23_测试与验收方案.md`
13. `44_TEST_ACPT可执行用例集.md`
14. `24_实施与上线指南.md`

## 4. 开发顺序与依赖
| 阶段 | 模块 | 前置依赖 | 输出目标 |
| --- | --- | --- | --- |
| S1 | AUTH/ORG/USR | DBD、API、权限模型 | 登录、组织/部门、用户状态、角色权限 |
| S2 | CM/LM/OM | S1 | 客户与销售主链路 |
| S3 | CHN/CNV/TK | S1,S2 | 渠道、会话、工单闭环 |
| S4 | TSK/NTF | S1 | 任务与通知 |
| S5 | AI/AUD/SYS | S1,S3,S4 | AI 回复、审计查询、系统配置与仪表盘 |
| S6 | 联调/回归/验收 | S1~S5 | 全链路发布就绪 |

## 5. 模块级开发输入/输出（可直接执行）
| 模块 | 输入（REQ/API/TABLE/PAGE） | 输出（代码与测试） |
| --- | --- | --- |
| AUTH | REQ-AUTH-001/002；API-AUTH-001~003；TABLE-USR-001；PAGE-AUTH-001 | 登录/刷新接口、AuthGuard、登录页、TEST-AUTH-* |
| ORG | REQ-ORG-001；API-ORG-001~005；TABLE-ORG-001/002；PAGE-ORG-001 | 组织/部门 API、设置页、TEST-ORG-001 |
| USR | REQ-USR-001/002；API-USR-001~005；TABLE-USR-*；PAGE-USR-001/002 | 用户列表与状态、角色权限配置、TEST-USR-* |
| CM | REQ-CM-001~004；API-CM-001~005；TABLE-CM-*；PAGE-CM-001/002 | 客户 CRUD + 状态流转、TEST-CM-* |
| LM | REQ-LM-001~004；API-LM-001~006；TABLE-LM-*；PAGE-LM-001/002 | 线索录入/分配/跟进/转化、TEST-LM-* |
| OM | REQ-OM-001~003；API-OM-001~006；TABLE-OM-*；PAGE-OM-001/002 | 商机推进与结果标记、TEST-OM-* |
| CHN | REQ-CHN-001；API-CHN-001~003；TABLE-CHN-001；PAGE-CHN-001 | 渠道配置、TEST-CHN-001 |
| CNV | REQ-CNV-001~005；API-CNV-001~008；TABLE-CNV-*；PAGE-CNV-001/002 | 会话中心与消息实时联动、TEST-CNV-* |
| TK | REQ-TK-001~004；API-TK-001~007；TABLE-TK-*；PAGE-TK-001/002 | 工单全状态机闭环、TEST-TK-* |
| TSK | REQ-TSK-001/002；API-TSK-001~004；TABLE-TSK-001；PAGE-TSK-001 | 任务管理与流转、TEST-TSK-* |
| NTF | REQ-NTF-001/002；API-NTF-001/002；TABLE-NTF-001；PAGE-NTF-001 | 通知列表与已读、TEST-NTF-* |
| AI | REQ-AI-001/002；API-AI-001/002；TABLE-AI-001；PAGE-CNV-002 | AI 回复任务链路、TEST-AI-* |
| AUD | REQ-AUD-001；API-AUD-001；TABLE-AUD-001；PAGE-AUD-001 | 审计检索与展示、TEST-AUD-001 |
| SYS | REQ-SYS-001/002；API-SYS-001~003；TABLE-SYS-001；PAGE-SYS-001/002 | 仪表盘与系统配置、TEST-SYS-* |

## 6. 建议代码落点（生成器默认）
| 层 | 建议路径 |
| --- | --- |
| API 后端 | `apps/api/src/modules/{mod}/` |
| Web 前端 | `apps/web/src/pages/`、`apps/web/src/components/business/` |
| DTO/Schema | `apps/api/src/modules/{mod}/dto/`（以 `42` 为准） |
| 测试 | `apps/api/test/`、`apps/web/src/**/__tests__/`、`apps/e2e/tests/` |
| migration | `apps/api/migrations/`（按 DBD 顺序） |

## 7. Trae 执行模板（每个模块）
1. 读取模块输入：REQ/API/TABLE/PAGE/PERM/SM/TEST。
2. 生成 migration 与实体。
3. 生成 DTO + Controller + Service + Repository。
4. 生成页面与 API client。
5. 生成模块测试（API + 状态机 + 权限 + 跨租户）。
6. 执行自检（第 8 章）。

## 8. 自检清单（提交前）
- [ ] API path/method/permission 与 `11_API` 一致
- [ ] DTO 字段与 `42_API请求响应Schema字典` 一致
- [ ] 数据表字段/索引/外键与 `10_DBD` 一致
- [ ] 状态机流转与 `27_状态机实现规范` 一致
- [ ] 页面按钮显隐与 `43_页面级详细交互规格` 一致
- [ ] 错误码映射与 `28_API错误码清单` 一致
- [ ] 写操作审计日志完整
- [ ] org_id 隔离校验通过

## 9. 联调清单
- [ ] 登录后可访问 `/dashboard`
- [ ] 列表分页 `meta` 字段一致
- [ ] 会话消息实时推送可消费
- [ ] 会话转工单跨模块事务一致
- [ ] AI 失败可降级为人工回复
- [ ] 审计日志可按 request_id 追踪

## 10. 提交门禁
- TEST 全绿（35/35）。
- ACPT 全通过（35/35）。
- 无 P0 阻断级缺陷。
- migration 可正向执行且可回滚。
- 发布 checklist 完整通过。

## 11. Definition of Done（DoD）
模块完成必须同时满足：
1. 需求闭环：REQ -> PAGE/API/TABLE/SM/PERM/TEST/ACPT/TASK 全关联。
2. 实现闭环：前端、后端、DB、WS（适用时）均完成。
3. 质量闭环：测试通过 + 关键日志与审计可追踪。
4. 联调闭环：跨模块链路验收通过。
5. 文档闭环：若实现与文档差异，先回写文档再合并代码。

## 12. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v3.0 | 2026-04-05 | 升级为实现级执行入口：补齐依赖顺序、输入输出、代码落点、自检联调清单与 DoD |
| v2.1 | 2026-04-05 | 任务清单展开为逐条 TASK ID |
