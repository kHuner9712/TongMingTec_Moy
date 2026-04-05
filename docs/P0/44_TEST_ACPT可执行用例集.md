# MOY TEST / ACPT 可执行用例集

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_TEST_CASE_001 |
| 文档版本 | v1.0 |
| 文档状态 | 已确认（实现级冻结） |
| 日期 | 2026-04-05 |
| 依赖文档 | `07_RTM_需求跟踪矩阵.md`、`11_API_接口设计说明.md`、`27_状态机实现规范.md`、`28_API错误码清单.md` |

## 2. TEST 用例明细（逐条可执行）

### 2.1 AUTH / ORG / USR
| TEST-ID | 前置条件 | 测试步骤 | 输入数据 | 预期结果 | 错误场景 | 权限场景 | 跨租户场景 | 非法流转场景 | 审计断言 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-AUTH-001 | 租户与用户已初始化 | 调用 API-AUTH-001 登录 | username/password | 返回 token 与 user 信息 | 错误密码返回 AUTH_UNAUTHORIZED | N/A | 使用他租户用户名不可登录本租户 | N/A | 写入 AUTH_LOGIN（成功/失败） |
| TEST-AUTH-002 | 已有有效 refresh_token | 调用 API-AUTH-002 刷新 | refresh_token | 返回新 access_token | 过期 token 返回 AUTH_TOKEN_EXPIRED | N/A | 跨租户 refresh_token 不可用 | N/A | 写入 AUTH_REFRESH |
| TEST-USR-001 | 管理员登录 | 1) 调 API-USR-001 列表 2) 调 API-USR-003 改状态 | user_id/status | 状态更新成功并可回读 | status 非法返回 PARAM_INVALID | 无 PERM-USR-MANAGE 返回 AUTH_FORBIDDEN | 更新他租户用户返回 AUTH_FORBIDDEN | N/A | 写入 USER_STATUS_CHANGE，before/after 包含 status |
| TEST-USR-002 | 已有角色与权限字典 | 1) API-USR-004 拉角色 2) API-USR-005 拉权限 3) API-USR-002 保存 | role_id + permission_ids | 角色权限更新成功 | permission_ids 为空返回 PARAM_INVALID | 无 PERM-USR-MANAGE 返回 AUTH_FORBIDDEN | 修改他租户角色返回 AUTH_FORBIDDEN | N/A | 写入 ROLE_PERMISSION_UPDATE |
| TEST-ORG-001 | 管理员登录，有组织与部门 | 1) API-ORG-002 获取组织 2) API-ORG-001 更新组织 3) API-ORG-004/005 维护部门 | 组织字段/部门字段/version | 组织与部门更新成功 | version 冲突返回 CONFLICT_VERSION | 无 PERM-ORG-MANAGE 返回 AUTH_FORBIDDEN | 访问他租户组织/部门返回 AUTH_FORBIDDEN | N/A | 写入 ORG_UPDATE/DEPARTMENT_CREATE/DEPARTMENT_UPDATE |

### 2.2 CM（客户）
| TEST-ID | 前置条件 | 测试步骤 | 输入数据 | 预期结果 | 错误场景 | 权限场景 | 跨租户场景 | 非法流转场景 | 审计断言 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-CM-001 | 已有客户数据 | 调 API-CM-001 列表检索 | keyword/status/page | 返回列表与 meta | page_size>100 返回 PARAM_INVALID | 无 PERM-CM-VIEW 返回 AUTH_FORBIDDEN | 查询结果不得出现他租户客户 | N/A | 记录 CUSTOMER_LIST_VIEW（可选） |
| TEST-CM-002 | 有负责人用户 | 调 API-CM-002 创建客户 | name/owner_user_id | 创建成功，status=potential | 重复幂等键返回同结果 | 无 PERM-CM-CREATE 返回 AUTH_FORBIDDEN | owner 不在本 org 返回 AUTH_FORBIDDEN | N/A | 写入 CUSTOMER_CREATE |
| TEST-CM-003 | 已有客户记录 | 调 API-CM-003/004 查看并更新 | id/version/mutable fields | 更新后 version+1 | version 错误返回 CONFLICT_VERSION | 无 PERM-CM-UPDATE 返回 AUTH_FORBIDDEN | 更新他租户客户返回 AUTH_FORBIDDEN | N/A | 写入 CUSTOMER_UPDATE（含 before/after） |
| TEST-CM-004 | 客户状态为 active | 调 API-CM-005 改状态 | version/status | 合法流转成功 | 无效状态值返回 PARAM_INVALID | 无 PERM-CM-STATUS 返回 AUTH_FORBIDDEN | 操作他租户客户返回 AUTH_FORBIDDEN | lost -> active 拦截 STATUS_TRANSITION_INVALID | 写入 CUSTOMER_STATUS_CHANGE |

### 2.3 LM（线索）
| TEST-ID | 前置条件 | 测试步骤 | 输入数据 | 预期结果 | 错误场景 | 权限场景 | 跨租户场景 | 非法流转场景 | 审计断言 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-LM-001 | 有用户上下文 | 调 API-LM-002 创建，再 API-LM-001 查询 | 线索字段 | 创建成功并可检索 | email 非法返回 PARAM_INVALID | 无 PERM-LM-CREATE 返回 AUTH_FORBIDDEN | source 合法但 owner 属于他 org 时拒绝 | N/A | 写入 LEAD_CREATE |
| TEST-LM-002 | 存在 new 线索 | 调 API-LM-003 分配 | assignee_user_id/version | 状态转 assigned | assignee 不存在返回 RESOURCE_NOT_FOUND | 无 PERM-LM-ASSIGN 返回 AUTH_FORBIDDEN | 指派到他 org 用户返回 AUTH_FORBIDDEN | converted 线索再分配拦截 STATUS_TRANSITION_INVALID | 写入 LEAD_ASSIGN |
| TEST-LM-003 | 存在 following 线索 | 1) API-LM-006 获取详情 2) API-LM-004 新增跟进 | content/follow_type | 跟进记录写入成功 | content 为空返回 PARAM_INVALID | 无 PERM-LM-FOLLOW_UP 返回 AUTH_FORBIDDEN | 他租户线索不可跟进 | converted 线索跟进拦截 STATUS_TRANSITION_INVALID | 写入 LEAD_FOLLOW_UP |
| TEST-LM-004 | 存在可转化线索 | 调 API-LM-005 转化 | version + opportunity payload | 生成 opportunity 且 lead=converted | 缺少 opportunity.name 返回 PARAM_INVALID | 无 PERM-LM-CONVERT 返回 AUTH_FORBIDDEN | 线索与客户跨 org 组合拦截 | invalid 线索转化拦截 STATUS_TRANSITION_INVALID | 写入 LEAD_CONVERT，跨表事务一致 |

### 2.4 OM（商机）
| TEST-ID | 前置条件 | 测试步骤 | 输入数据 | 预期结果 | 错误场景 | 权限场景 | 跨租户场景 | 非法流转场景 | 审计断言 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-OM-001 | 有客户数据 | API-OM-002 创建，API-OM-001 查询 | customer_id/name/amount | 创建成功 stage=discovery | amount<0 返回 PARAM_INVALID | 无 PERM-OM-CREATE 返回 AUTH_FORBIDDEN | customer_id 属于他 org 拦截 | N/A | 写入 OPPORTUNITY_CREATE |
| TEST-OM-002 | 存在商机 stage=discovery | API-OM-003/004/005 | version/stage | 合法推进成功并写 stage history | stage 非法返回 PARAM_INVALID | 无 PERM-OM-STAGE 返回 AUTH_FORBIDDEN | 推进他 org 商机返回 AUTH_FORBIDDEN | discovery -> proposal 拦截 STATUS_TRANSITION_INVALID | 写入 OPPORTUNITY_STAGE_CHANGE |
| TEST-OM-003 | 商机 stage=negotiation 且 result=null | 调 API-OM-006 | version/result/reason | 仅允许 won/lost 且一次性写入 | result=win 返回 OM_RESULT_INVALID | 无 PERM-OM-RESULT 返回 AUTH_FORBIDDEN | 标记他 org 商机返回 AUTH_FORBIDDEN | stage!=negotiation 调用拦截 STATUS_TRANSITION_INVALID | 写入 OPPORTUNITY_RESULT_SET |

### 2.5 CNV（会话）
| TEST-ID | 前置条件 | 测试步骤 | 输入数据 | 预期结果 | 错误场景 | 权限场景 | 跨租户场景 | 非法流转场景 | 审计断言 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-CNV-001 | 已有会话与消息 | API-CNV-001/002/003 查询 | filters/cursor | 正确返回列表、详情、消息 | cursor 非法返回 PARAM_INVALID | 无 PERM-CNV-VIEW 返回 AUTH_FORBIDDEN | 不返回他 org 会话数据 | N/A | 记录 CONVERSATION_*_VIEW（可选） |
| TEST-CNV-002 | 会话 status=active | API-CNV-004 发送消息 | version/content/client_msg_id | 消息写入并触发 WS | 重复 client_msg_id 去重 | 无 PERM-CNV-SEND 返回 AUTH_FORBIDDEN | 发往他 org 会话返回 AUTH_FORBIDDEN | closed 会话发送拦截 STATUS_TRANSITION_INVALID | 写入 CONVERSATION_MESSAGE_SEND |
| TEST-CNV-003 | 会话 status=queued 或 active | API-CNV-005/006 | version/target_user_id | 接入或转接成功 | target_user_id 非法返回 CNV_TRANSFER_TARGET_INVALID | 缺少 ACCEPT/TRANSFER 权限分别拦截 | target_user_id 他 org 拦截 | closed 会话接入/转接拦截 STATUS_TRANSITION_INVALID | 写入 CONVERSATION_ACCEPT/TRANSFER |
| TEST-CNV-004 | 会话 status=active | API-CNV-007 关闭 | version/close_reason | 状态变 closed | close_reason 为空返回 PARAM_INVALID | 无 PERM-CNV-CLOSE 返回 AUTH_FORBIDDEN | 关闭他 org 会话返回 AUTH_FORBIDDEN | closed 重复关闭拦截 STATUS_TRANSITION_INVALID | 写入 CONVERSATION_CLOSE |
| TEST-CNV-005 | 会话可转工单 | API-CNV-008 | version/title/priority | 创建 ticket 并关联 source | priority 非法返回 PARAM_INVALID | 无 PERM-CNV-CREATE_TICKET 返回 AUTH_FORBIDDEN | 他 org 会话转单拦截 | closed 且策略不允许时拦截 STATUS_TRANSITION_INVALID | 写入 CONVERSATION_CREATE_TICKET + TICKET_CREATE |

### 2.6 TK（工单）
| TEST-ID | 前置条件 | 测试步骤 | 输入数据 | 预期结果 | 错误场景 | 权限场景 | 跨租户场景 | 非法流转场景 | 审计断言 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-TK-001 | 有工单数据 | API-TK-002 创建，API-TK-001 查询 | title/source_type/source_id | 创建成功并可检索 | source_type=conversation 且 source_id 缺失返回 PARAM_INVALID | 无 PERM-TK-CREATE 返回 AUTH_FORBIDDEN | source_id 属于他 org 拦截 | N/A | 写入 TICKET_CREATE |
| TEST-TK-002 | 工单 status=pending | API-TK-003/004 | version/assignee_user_id | 指派成功 status=assigned | assignee 不存在返回 RESOURCE_NOT_FOUND | 无 PERM-TK-ASSIGN 返回 AUTH_FORBIDDEN | 指派他 org 用户拦截 | closed 工单再指派拦截 STATUS_TRANSITION_INVALID | 写入 TICKET_ASSIGN |
| TEST-TK-003 | 工单 status=assigned | API-TK-005/006 | version/solution | start 后 resolve 成功 | solution 为空返回 PARAM_INVALID | 缺少 START 或 RESOLVE 权限拦截 | 操作他 org 工单拦截 | pending 直接 resolve 拦截 STATUS_TRANSITION_INVALID | 写入 TICKET_START/TICKET_RESOLVE |
| TEST-TK-004 | 工单 status=resolved | API-TK-007 关闭 | version/close_reason | 关闭成功 | close_reason 为空返回 PARAM_INVALID | 无 PERM-TK-CLOSE 返回 AUTH_FORBIDDEN | 关闭他 org 工单拦截 | processing 直接 close 拦截 STATUS_TRANSITION_INVALID | 写入 TICKET_CLOSE |

### 2.7 TSK / NTF / CHN
| TEST-ID | 前置条件 | 测试步骤 | 输入数据 | 预期结果 | 错误场景 | 权限场景 | 跨租户场景 | 非法流转场景 | 审计断言 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-TSK-001 | 有用户上下文 | API-TSK-002 创建，API-TSK-001 查询 | title/assignee/due_at | 创建成功并可检索 | due_at 早于当前策略限制返回 PARAM_INVALID | 无 PERM-TSK-CREATE 返回 AUTH_FORBIDDEN | assignee 属于他 org 拦截 | N/A | 写入 TASK_CREATE |
| TEST-TSK-002 | 任务 status=pending | API-TSK-003/004 | version/status | 更新与流转成功 | version 冲突返回 CONFLICT_VERSION | 无 UPDATE/STATUS 权限拦截 | 更新他 org 任务拦截 | completed -> in_progress 拦截 STATUS_TRANSITION_INVALID | 写入 TASK_UPDATE/TASK_STATUS_CHANGE |
| TEST-NTF-001 | 用户有通知 | API-NTF-001 查询列表 | is_read/type/page | 返回当前用户通知 | 非法 page 参数返回 PARAM_INVALID | 无 PERM-NTF-VIEW 返回 AUTH_FORBIDDEN | 不返回他 org 或他用户通知 | N/A | 记录 NOTIFICATION_LIST_VIEW（可选） |
| TEST-NTF-002 | 存在未读通知 | API-NTF-002 标记已读 | id | is_read=true，read_at 不为空 | 通知不存在返回 RESOURCE_NOT_FOUND | 无 PERM-NTF-READ 返回 AUTH_FORBIDDEN | 他 org 通知不可标记 | 已读重复标记应幂等成功 | 写入 NOTIFICATION_READ |
| TEST-CHN-001 | 管理员登录 | API-CHN-002/003 + API-CHN-001 | channel payload/version | 渠道创建/更新成功 | config JSON 非法返回 PARAM_INVALID | 无 PERM-CHN-MANAGE 返回 AUTH_FORBIDDEN | 更新他 org 渠道拦截 | N/A | 写入 CHANNEL_CREATE/CHANNEL_UPDATE |

### 2.8 AI / AUD / SYS
| TEST-ID | 前置条件 | 测试步骤 | 输入数据 | 预期结果 | 错误场景 | 权限场景 | 跨租户场景 | 非法流转场景 | 审计断言 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-AI-001 | 会话 active，AI provider 可用 | 调 API-AI-001 | conversation_id/message_id/instruction | 返回 202 + ai_task，后续状态变化 | Provider 超时返回 AI_TASK_TIMEOUT 并可降级 | 无 PERM-AI-EXECUTE 返回 AUTH_FORBIDDEN | 他 org 会话触发 AI 拦截 | N/A | 写入 AI_TASK_CREATE，记录 token/cost |
| TEST-AI-002 | 存在 ai_task | API-AI-002 查询任务 | ai_task id | 返回任务状态与输出 | 不存在返回 RESOURCE_NOT_FOUND | 无 PERM-AI-EXECUTE 返回 AUTH_FORBIDDEN | 查询他 org ai_task 拦截 | running -> pending 状态回退应拦截 | 写入 AI_TASK_VIEW（可选） |
| TEST-AUD-001 | 系统已有审计日志 | API-AUD-001 检索 | action/date range/page | 返回审计列表与分页 | 日期范围非法返回 PARAM_INVALID | 无 PERM-AUD-VIEW 返回 AUTH_FORBIDDEN | 不可读取他 org 审计日志 | N/A | 查询动作写入 AUDIT_LOG_VIEW |
| TEST-SYS-001 | 有业务数据 | API-SYS-001 查询仪表盘 | date_from/date_to | 返回汇总指标 | date_to < date_from 返回 PARAM_INVALID | 无 PERM-SYS-VIEW 返回 AUTH_FORBIDDEN | 仅统计当前 org 数据 | N/A | 记录 DASHBOARD_SUMMARY_VIEW（可选） |
| TEST-SYS-002 | 有系统配置 | API-SYS-002/003 查询并更新 | module/keyword/version/config_value | 更新成功，version+1 | value_type 不匹配返回 PARAM_INVALID | 无 PERM-SYS-MANAGE 返回 AUTH_FORBIDDEN | 更新他 org 配置拦截 | N/A | 写入 SYS_CONFIG_UPDATE |

## 3. ACPT 验收标准（逐条）
| ACPT-ID | 验收范围 | 验收前置 | 验收步骤 | 通过标准 |
| --- | --- | --- | --- | --- |
| ACPT-AUTH-001 | 登录 | 账号已初始化 | 正确账号密码登录 | 成功进入 `/dashboard`，token 生效 |
| ACPT-AUTH-002 | 会话续期 | 已登录并持有 refresh_token | 调用刷新接口并继续访问受限 API | 无感续期，旧 access token 过期后新 token 可用 |
| ACPT-USR-001 | 用户状态管理 | 管理员权限 | 用户列表查看 + 状态切换 | 状态切换即时生效，权限拦截准确 |
| ACPT-USR-002 | 角色权限配置 | 已有角色与权限字典 | 角色授权并验证按钮显隐 | 授权结果与页面动作一致 |
| ACPT-ORG-001 | 组织/部门管理 | 管理员权限 | 修改组织信息、新增/编辑部门 | 组织与部门数据持久化，审计可追踪 |
| ACPT-CM-001 | 客户检索 | 存在多状态客户 | 按状态/负责人/关键词检索 | 结果与筛选条件一致 |
| ACPT-CM-002 | 客户创建 | 有负责人用户 | 新建客户 | 客户创建成功并出现在列表 |
| ACPT-CM-003 | 客户更新 | 已有客户 | 编辑客户信息 | 更新后详情与列表一致 |
| ACPT-CM-004 | 客户状态流转 | 客户状态 active | 改为 silent/lost 并验证非法流转 | 合法流转成功，非法流转被拦截 |
| ACPT-LM-001 | 线索录入 | 基础数据可用 | 创建线索 | 线索入库并可检索 |
| ACPT-LM-002 | 线索分配 | 线索为 new | 分配给执行人 | 状态变 assigned，负责人更新 |
| ACPT-LM-003 | 线索跟进 | 线索可跟进 | 新增跟进记录 | 时间线新增记录且可追溯 |
| ACPT-LM-004 | 线索转化商机 | 线索状态 following | 执行转化 | 生成商机并回填线索 converted |
| ACPT-OM-001 | 商机创建 | 有客户 | 新建商机 | 商机 stage=discovery |
| ACPT-OM-002 | 商机阶段推进 | 商机 stage=discovery | 依次推进到 negotiation | 不可跳级，阶段历史完整 |
| ACPT-OM-003 | 商机结果标记 | stage=negotiation | 标记 won 或 lost | 仅允许 won/lost 且结果不可逆 |
| ACPT-CNV-001 | 会话列表与详情 | 已有会话 | 查看列表与消息历史 | 数据完整且权限隔离正确 |
| ACPT-CNV-002 | 消息发送 | 会话 active | 发送文本消息 | 消息入库并实时推送 |
| ACPT-CNV-003 | 接入/转接 | 会话 queued/active | 接入并转接 | 状态与处理人正确更新 |
| ACPT-CNV-004 | 会话关闭 | 会话 active | 输入关闭原因后关闭 | 状态变 closed，按钮显隐正确 |
| ACPT-CNV-005 | 会话转工单 | 会话可转工单 | 创建工单 | 工单创建成功并建立来源关联 |
| ACPT-TK-001 | 工单创建 | 有来源会话或手工场景 | 新建工单 | 生成 ticket_no，状态 pending |
| ACPT-TK-002 | 工单分配 | 工单 pending | 指派处理人 | 状态变 assigned |
| ACPT-TK-003 | 工单处理与解决 | 工单 assigned | 开始处理并填写解决方案 | 状态流转到 resolved |
| ACPT-TK-004 | 工单关闭 | 工单 resolved | 输入原因关闭 | 状态变 closed，日志完整 |
| ACPT-TSK-001 | 任务创建 | 有执行人 | 新建任务 | 任务创建并可检索 |
| ACPT-TSK-002 | 任务状态更新 | 任务 pending | 更新到 in_progress/completed | 流转合法，非法流转拦截 |
| ACPT-NTF-001 | 通知列表 | 已有通知 | 查询通知 | 未读/已读显示准确 |
| ACPT-NTF-002 | 通知已读 | 存在未读通知 | 标记已读 | 状态变更成功且幂等 |
| ACPT-CHN-001 | 渠道配置 | 管理员权限 | 新建并更新渠道配置 | 配置持久化且安全字段脱敏 |
| ACPT-AI-001 | 智能回复生成 | 会话 active + AI 可用 | 触发 AI 回复 | 任务创建、状态可追踪、失败可降级 |
| ACPT-AI-002 | AI 任务查询 | 存在 ai_task | 查询任务状态 | 返回执行轨迹与输出结果 |
| ACPT-AUD-001 | 审计日志查询 | 存在写操作日志 | 按条件检索 | 关键操作均可定位 |
| ACPT-SYS-001 | 仪表盘汇总 | 有业务数据 | 查看 dashboard | 指标与业务数据一致 |
| ACPT-SYS-002 | 系统配置管理 | 管理员权限 | 查询并更新配置 | 更新生效、并发冲突可提示 |

## 4. 核心 E2E 组合验收

### 4.1 线索 -> 商机链路
- 覆盖：`ACPT-LM-001/002/003/004` + `ACPT-OM-001/002/003`。
- 通过标准：线索从 `new` 到 `converted`，商机从 `discovery` 到 `won/lost`，全程审计可追溯。

### 4.2 会话 -> 工单链路
- 覆盖：`ACPT-CNV-001~005` + `ACPT-TK-001~004`。
- 通过标准：会话内创建工单成功，工单全流程闭环，实时事件驱动页面同步。

### 4.3 AI 智能回复链路
- 覆盖：`ACPT-AI-001/002` + `ACPT-CNV-002`。
- 通过标准：AI 输出仅作为建议，人工可编辑后发送，不直接写关键终态。

### 4.4 系统与权限链路
- 覆盖：`ACPT-SYS-002` + `ACPT-USR-002` + `ACPT-ORG-001`。
- 通过标准：配置更新、角色授权、组织结构变更均可生效且审计完整。

## 5. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-04-05 | 新增实现级 TEST/ACPT 用例集：35 条 TEST + 35 条 ACPT 全量可执行 |
