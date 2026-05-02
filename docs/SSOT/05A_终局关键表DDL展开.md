# MOY App 终局关键表 DDL 级展开

## 1. 文档定位
本文档是 [05_对象模型与数据库设计.md](./05_对象模型与数据库设计.md) 的实现级子文档。`05` 继续承担主链目录与建模规则入口，本文负责把终局关键表补到 migration-ready / DDL-ready。

状态约定：
- `status=implementation-ready`：可直接驱动 migration / ORM / repository 生成。
- `release_scope` 统一按 `introduced_in` 向后覆盖。

记法约定：
- 字段摘要：`字段:类型[长度]`，`!`=必填，`?`=可空，`=默认值`，`uq`=唯一，`idx`=索引，`fk(x)`=外键。
- 共享字段不重复展开：`PROFILE-MUTABLE = id/org_id/created_at/updated_at/created_by/updated_by/deleted_at/version`；`PROFILE-APPEND = id/org_id/created_at/created_by`；`PROFILE-SYSTEM = id/org_id/created_at/updated_at`。
- 软删除唯一键默认写成 `WHERE deleted_at IS NULL` 的 partial unique index。

## 2. 关键表实现矩阵
| TABLE-ID | 表名 | introduced_in / required_in / release_scope / status | profile / migration | 业务字段摘要 | 约束 / 索引 / 级联 | 生命周期 / 初始化 |
| --- | --- | --- | --- | --- | --- | --- |
| `TABLE-ORG-001` | `organizations` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `ROOT / 001` | `code:varchar[64]! uq idx; name:varchar[128]! idx; status:varchar[16]!=provisioning enum(provisioning|active|suspended|archived) idx; timezone:varchar[64]!=Asia/Shanghai; locale:varchar[16]!=zh-CN; logo_url:varchar[255]?; owner_user_id:uuid? fk(users.id); billing_email:varchar[128]?; onboard_stage:varchar[32]!=bootstrap_pending` | `PK(id); UQ(code); FK(owner_user_id SET NULL/CASCADE); CHECK(status@SM-organization); IDX(status,onboard_stage)` | `禁止物理删除，仅允许 suspended->archived；S1 租户创建必写；S2+ 只补 status/onboard_stage` |
| `TABLE-ORG-002` | `departments` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 002` | `parent_id:uuid? idx fk(departments.id); code:varchar[64]! idx; name:varchar[128]! idx; manager_user_id:uuid? idx fk(users.id); path:varchar[255]!==/ idx; sort_order:int4!=0 idx; is_active:boolean!=true idx` | `PK(id); UQ(org_id,code); CHECK(parent_id<>id, sort_order>=0); FK(parent_id SET NULL/CASCADE, manager_user_id SET NULL/CASCADE); IDX(org_id,parent_id), IDX(org_id,manager_user_id)` | `允许软删除；有子部门或成员时禁止删；S1 创建 root department` |
| `TABLE-USR-001` | `users` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 003` | `department_id:uuid? idx fk(departments.id); username:varchar[64]! idx; display_name:varchar[64]! idx; email:varchar[128]? idx; mobile:varchar[32]? idx; password_hash:varchar[255]!; status:varchar[16]!=active enum(invited|active|disabled|locked) idx; locale:varchar[16]!=zh-CN; timezone:varchar[64]!=Asia/Shanghai; last_login_at:timestamptz? idx` | `PK(id); UQ(org_id,username/email/mobile); FK(department_id SET NULL/CASCADE); CHECK(status@SM-user); IDX(org_id,status,department_id,last_login_at)` | `禁止物理删除；优先禁用/锁定；S1 创建 admin 用户` |
| `TABLE-USR-002` | `roles` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 004` | `code:varchar[64]! idx; name:varchar[64]! idx; data_scope:varchar[16]!=self enum(self|team|org) idx; is_default:boolean!=false idx; description:varchar[255]?` | `PK(id); UQ(org_id,code); CHECK(data_scope in self/team/org); IDX(org_id,is_default)` | `允许软删除；有 user_roles 引用时禁止物理删除；S1 初始化 admin/sales/service，S2+ 增营销/财务/AI/合规角色` |
| `TABLE-USR-003` | `permissions` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-APPEND / 005` | `perm_id:varchar[64]! idx; module:varchar[32]! idx; action:varchar[64]! idx; risk_level:varchar[8]!=P3 enum(P0|P1|P2|P3) idx; description:varchar[255]?` | `PK(id); UQ(org_id,perm_id); CHECK(perm_id LIKE PERM-%); IDX(org_id,module,risk_level)` | `禁止物理删除；阶段升级补写新增权限；S1 初始化基础权限` |
| `TABLE-USR-004` | `user_roles` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-APPEND / 006` | `user_id:uuid! idx fk(users.id); role_id:uuid! idx fk(roles.id); source:varchar[16]!=manual enum(manual|bootstrap|sync); effective_from:timestamptz?; effective_to:timestamptz?` | `PK(id); UQ(org_id,user_id,role_id); FK(user_id CASCADE/CASCADE, role_id CASCADE/CASCADE); CHECK(effective_to>=effective_from)` | `允许删关系行但必须留审计；S1 绑定 admin 角色` |
| `TABLE-USR-005` | `role_permissions` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-APPEND / 007` | `role_id:uuid! idx fk(roles.id); permission_id:uuid! idx fk(permissions.id); scope_override:jsonb?; granted_by:uuid? fk(users.id)` | `PK(id); UQ(org_id,role_id,permission_id); FK(role_id CASCADE/CASCADE, permission_id CASCADE/CASCADE, granted_by SET NULL/CASCADE); IDX(org_id,role_id), IDX(org_id,permission_id)` | `允许删关系行但必须写 permission_change_logs；S1 初始化默认角色权限` |
| `TABLE-CM-001` | `customers` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 010` | `name:varchar[128]! idx; industry:varchar[64]? idx; level:varchar[16]? idx enum(L1|L2|L3|VIP); owner_user_id:uuid! idx fk(users.id); status:varchar[16]!=potential idx enum(potential|active|silent|lost); phone:varchar[32]? idx; email:varchar[128]? idx; address:varchar[255]?; remark:text?; last_contact_at:timestamptz? idx` | `PK(id); 推荐 UIDX(org_id,name,owner_user_id); FK(owner_user_id RESTRICT/CASCADE); CHECK(status@SM-customer); IDX(org_id,status,owner_user_id,last_contact_at)` | `允许软删除；财务/交易链引用时禁止删除；无种子数据` |
| `TABLE-CM-002` | `customer_contacts` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 011` | `customer_id:uuid! idx fk(customers.id); name:varchar[64]! idx; title:varchar[64]?; phone:varchar[32]? idx; email:varchar[128]? idx; wechat:varchar[64]?; is_primary:boolean!=false idx` | `PK(id); UIDX(customer_id) WHERE is_primary=true AND deleted_at IS NULL; FK(customer_id CASCADE/CASCADE); CHECK(单客户仅一个主联系人)` | `跟随客户软删除；主联系人切换写审计；无种子数据` |
| `TABLE-LM-001` | `leads` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 016` | `source:varchar[32]!=manual idx; name:varchar[128]! idx; mobile:varchar[32]? idx; email:varchar[128]? idx; company_name:varchar[128]? idx; owner_user_id:uuid? idx fk(users.id); status:varchar[16]!=new idx enum(new|assigned|following|converted|invalid); score:numeric[6,2]? idx; score_reason:text?; last_follow_up_at:timestamptz? idx` | `PK(id); 推荐 UIDX(org_id,mobile,source); FK(owner_user_id SET NULL/CASCADE); CHECK(status@SM-lead, score between 0 and 100); IDX(org_id,status,owner_user_id,source)` | `允许软删除；转化后只归档不删；无种子数据` |
| `TABLE-LM-002` | `lead_follow_ups` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-APPEND / 017` | `lead_id:uuid! idx fk(leads.id); follow_type:varchar[32]!=manual idx enum(call|wechat|email|meeting|manual); content:text!; result:varchar[32]? enum(continue|pause|convert|invalid); next_action_at:timestamptz? idx` | `PK(id); FK(lead_id CASCADE/CASCADE); IDX(org_id,lead_id,created_at desc), IDX(org_id,next_action_at)` | `禁止物理删除；错误跟进通过追加更正；无种子数据` |
| `TABLE-OM-001` | `opportunities` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 020` | `customer_id:uuid! idx fk(customers.id); lead_id:uuid? idx fk(leads.id); owner_user_id:uuid! idx fk(users.id); name:varchar[128]! idx; amount:numeric[14,2]!=0 idx; currency:varchar[8]!=CNY; stage:varchar[32]!=discovery idx enum(discovery|qualification|proposal|negotiation); result:varchar[8]? idx enum(won|lost); expected_close_date:date? idx; pause_reason:varchar[255]?` | `PK(id); FK(customer_id RESTRICT/CASCADE, lead_id SET NULL/CASCADE, owner_user_id RESTRICT/CASCADE); CHECK(result only won/lost, stage@SM-opportunity); IDX(org_id,stage,result,owner_user_id,expected_close_date)` | `禁止物理删除赢单/输单记录；错误结果通过补偿回滚；无种子数据` |
| `TABLE-OM-002` | `opportunity_stage_histories` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-APPEND / 021` | `opportunity_id:uuid! idx fk(opportunities.id); from_stage:varchar[32]?; to_stage:varchar[32]!; result_after:varchar[8]? enum(won|lost); change_reason:varchar[255]?; changed_at:timestamptz!=now() idx` | `PK(id); FK(opportunity_id CASCADE/CASCADE); IDX(org_id,opportunity_id,changed_at desc)` | `禁止物理删除；只追加不回写；无种子数据` |
| `TABLE-CHN-001` | `channels` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 031` | `code:varchar[64]! idx; name:varchar[64]! idx; channel_type:varchar[32]!=web idx enum(web|wechat|wecom|email|callcenter|app|social); auth_type:varchar[32]!=token enum(token|oauth2|signature); status:varchar[16]!=active idx enum(active|disabled|error); config_json:jsonb!={}; verified_at:timestamptz? idx` | `PK(id); UQ(org_id,code); CHECK(config_json@channel_type schema); IDX(org_id,channel_type,status)` | `允许软删除；已接入渠道禁止物理删除；S1 初始化 web/wechat，S3 扩充 email/app/social` |
| `TABLE-CHN-002` | `routing_rules` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 032` | `channel_id:uuid! idx fk(channels.id); rule_name:varchar[64]! idx; priority:int4!=100 idx; match_expr:jsonb!={}; target_type:varchar[16]!=user enum(user|team|queue|flow); target_id:uuid! idx; status:varchar[16]!=active idx enum(active|paused|archived)` | `PK(id); FK(channel_id CASCADE/CASCADE); CHECK(priority>=0); IDX(org_id,channel_id,priority), IDX(org_id,target_type,target_id)` | `允许软删除；active 规则必须先替换再下线；S3 初始化 default queue route` |
| `TABLE-CNV-001` | `conversations` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 022` | `channel_id:uuid! idx fk(channels.id); customer_id:uuid? idx fk(customers.id); contact_id:uuid? idx fk(customer_contacts.id); assignee_user_id:uuid? idx fk(users.id); status:varchar[16]!=queued idx enum(queued|active|closed); source_ref:varchar[128]? idx; last_message_at:timestamptz? idx; closed_reason:varchar[255]?` | `PK(id); UQ(org_id,source_ref) WHERE source_ref IS NOT NULL; FK(channel_id RESTRICT/CASCADE, customer/contact/assignee SET NULL/CASCADE); CHECK(status@SM-conversation); IDX(org_id,status,assignee_user_id,last_message_at)` | `允许软删除；有消息时禁止物理删除；渠道接入后自动创建` |
| `TABLE-CNV-002` | `conversation_messages` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-APPEND / 023` | `conversation_id:uuid! idx fk(conversations.id); message_type:varchar[16]!=text idx enum(text|image|file|system|ai_suggestion); direction:varchar[8]!=out idx enum(in|out); sender_type:varchar[16]!=user enum(customer|user|ai|system); sender_id:uuid? idx; content_text:text?; content_payload:jsonb?; provider_message_id:varchar[128]? idx` | `PK(id); UQ(org_id,provider_message_id) WHERE provider_message_id IS NOT NULL; FK(conversation_id CASCADE/CASCADE); CHECK(content_text/content_payload 至少一项存在); IDX(org_id,conversation_id,created_at desc)` | `禁止物理删除；违规内容通过 redaction 补偿；无种子数据` |
| `TABLE-TK-001` | `tickets` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 025` | `conversation_id:uuid? idx fk(conversations.id); customer_id:uuid? idx fk(customers.id); ticket_no:varchar[32]! uq idx; title:varchar[128]! idx; description:text?; priority:varchar[16]!=normal idx enum(low|normal|high|urgent); status:varchar[16]!=pending idx enum(pending|assigned|processing|resolved|closed); assignee_user_id:uuid? idx fk(users.id); sla_due_at:timestamptz? idx; resolved_at:timestamptz?; closed_reason:varchar[255]?` | `PK(id); UQ(org_id,ticket_no); FK(conversation/customer/assignee SET NULL/CASCADE); CHECK(status@SM-ticket); IDX(org_id,status,assignee_user_id,sla_due_at)` | `允许软删除；closed 工单禁止物理删除；无种子数据` |
| `TABLE-TK-002` | `ticket_logs` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-APPEND / 026` | `ticket_id:uuid! idx fk(tickets.id); action:varchar[32]! idx enum(assign|start|resolve|close|comment|escalate); from_status:varchar[16]?; to_status:varchar[16]?; content:text?; assignee_user_id:uuid? idx fk(users.id)` | `PK(id); FK(ticket_id CASCADE/CASCADE, assignee_user_id SET NULL/CASCADE); IDX(org_id,ticket_id,created_at desc), IDX(org_id,action)` | `禁止物理删除；只追加更正；无种子数据` |
| `TABLE-TSK-001` | `tasks` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 028` | `source_type:varchar[32]!=manual idx enum(manual|customer|lead|opportunity|ticket|csm); source_id:uuid? idx; title:varchar[128]! idx; description:text?; assignee_user_id:uuid! idx fk(users.id); priority:varchar[16]!=normal idx enum(low|normal|high|urgent); status:varchar[16]!=pending idx enum(pending|in_progress|completed|cancelled); due_at:timestamptz? idx; completed_at:timestamptz?` | `PK(id); FK(assignee_user_id RESTRICT/CASCADE); CHECK(status@SM-task); IDX(org_id,status,assignee_user_id,due_at)` | `允许软删除；完成任务禁止物理删除；无种子数据` |
| `TABLE-NTF-001` | `notifications` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-APPEND / 029` | `user_id:uuid! idx fk(users.id); category:varchar[32]!=system idx enum(system|task|ticket|bill|renewal|ai); title:varchar[128]!; content:text!; is_read:boolean!=false idx; source_type:varchar[32]?; source_id:uuid? idx; read_at:timestamptz? idx` | `PK(id); FK(user_id CASCADE/CASCADE); CHECK(read_at<->is_read 一致); IDX(org_id,user_id,is_read,created_at desc)` | `已读 90d 可裁剪；未读禁止裁剪；无种子数据` |
| `TABLE-AI-001` | `ai_tasks` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 033` | `source_type:varchar[32]!=conversation idx enum(conversation|ticket|knowledge|automation|manual); source_id:uuid? idx; task_type:varchar[32]!=smart_reply idx enum(smart_reply|summary|classify|qc|ask|run_agent); status:varchar[16]!=pending idx enum(pending|running|succeeded|failed|cancelled); prompt_input:jsonb!={}; output_payload:jsonb?; cost_amount:numeric[12,6]? idx; error_code:varchar[64]? idx; requested_by:uuid? idx fk(users.id); completed_at:timestamptz? idx` | `PK(id); FK(requested_by SET NULL/CASCADE); CHECK(status@SM-ai_task, cost_amount>=0); IDX(org_id,status,source_type,source_id,task_type)` | `允许软删除；已执行任务禁止物理删除；无种子数据` |
| `TABLE-AI-002` | `ai_agents` | `S2 / S4 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 034` | `code:varchar[64]! idx; name:varchar[64]! idx; agent_type:varchar[32]!=assistant idx enum(assistant|operator|approver|auditor); execution_mode:varchar[16]!=suggest idx enum(suggest|assist|auto); status:varchar[16]!=draft idx enum(draft|active|paused|archived); risk_level:varchar[8]!=P3 idx enum(P0|P1|P2|P3); tool_scope_json:jsonb!={}; config_json:jsonb!={}` | `PK(id); UQ(org_id,code); CHECK(status@SM-ai_agent, execution_mode+risk_level 合法); IDX(org_id,status,agent_type,risk_level)` | `允许软删除；active/archived agent 禁止物理删除；S2 可选初始化默认 assistant，S4 要求多 Agent 齐备` |
| `TABLE-AI-003` | `ai_agent_runs` | `S2 / S4 / S2,S3,S4 / implementation-ready` | `PROFILE-APPEND / 035` | `ai_agent_id:uuid! idx fk(ai_agents.id); ai_task_id:uuid? idx fk(ai_tasks.id); run_status:varchar[16]!=pending idx enum(pending|running|succeeded|failed|cancelled); input_snapshot:jsonb!={}; output_snapshot:jsonb?; error_code:varchar[64]? idx; latency_ms:int4? idx; tokens_used:int4? idx` | `PK(id); FK(ai_agent_id CASCADE/CASCADE, ai_task_id SET NULL/CASCADE); CHECK(latency_ms>=0, tokens_used>=0); IDX(org_id,ai_agent_id,created_at desc,run_status)` | `禁止物理删除；运行历史保留 365d+；S2 起全量记录` |
| `TABLE-AI-004` | `ai_approval_requests` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 036` | `resource_type:varchar[32]! idx; resource_id:uuid! idx; action:varchar[32]! idx; risk_level:varchar[8]!=P1 idx enum(P0|P1|P2|P3); status:varchar[16]!=pending idx enum(pending|approved|rejected|expired|cancelled); requested_by:uuid? idx fk(users.id); approved_by:uuid? idx fk(users.id); decision_note:varchar[255]?; expires_at:timestamptz? idx` | `PK(id); FK(requested_by/approved_by SET NULL/CASCADE); CHECK(status@SM-approval_request); IDX(org_id,status,resource_type,resource_id,expires_at)` | `允许软删除；已决策审批禁止物理删除；无种子数据` |
| `TABLE-KB-002` | `knowledge_items` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 044` | `category_id:uuid? idx fk(knowledge_categories.id); title:varchar[160]! idx; slug:varchar[128]! idx; content_md:text!; keywords:jsonb?; status:varchar[16]!=draft idx enum(draft|published|archived); published_at:timestamptz? idx; published_by:uuid? idx fk(users.id)` | `PK(id); UQ(org_id,slug); FK(category_id/published_by SET NULL/CASCADE); CHECK(status@SM-knowledge_item); IDX(org_id,status,category_id,title gin_trgm_ops)` | `允许软删除；已发布知识禁止物理删除；S2 可批量导入初始化知识` |
| `TABLE-AUTO-001` | `campaigns` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 047` | `code:varchar[64]! idx; name:varchar[128]! idx; objective:varchar[32]!=acquisition idx enum(acquisition|reactivation|upsell|renewal); status:varchar[16]!=draft idx enum(draft|active|paused|completed|archived); segment_id:uuid? idx fk(segments.id); starts_at:timestamptz? idx; ends_at:timestamptz? idx; budget_amount:numeric[14,2]?; owner_user_id:uuid? idx fk(users.id)` | `PK(id); UQ(org_id,code); FK(segment_id/owner_user_id SET NULL/CASCADE); CHECK(status@SM-campaign, ends_at>=starts_at, budget_amount>=0); IDX(org_id,status,owner_user_id,starts_at,ends_at)` | `允许软删除；已启动活动禁止物理删除；S2 可初始化欢迎/召回模板` |
| `TABLE-AUTO-004` | `automation_flows` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 050` | `code:varchar[64]! idx; name:varchar[128]! idx; trigger_type:varchar[32]!=event idx enum(event|schedule|manual); status:varchar[16]!=draft idx enum(draft|active|paused|archived); definition_json:jsonb!={}; channel_id:uuid? idx fk(channels.id); is_dry_run:boolean!=false idx; last_published_at:timestamptz? idx` | `PK(id); UQ(org_id,code); FK(channel_id SET NULL/CASCADE); CHECK(status@SM-automation_flow); IDX(org_id,status,trigger_type,last_published_at)` | `允许软删除；已执行流程禁止物理删除；S2 可初始化流程模板，S3 启用执行器前补 trigger config` |
| `TABLE-QT-001` | `quotes` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 053` | `opportunity_id:uuid! idx fk(opportunities.id); customer_id:uuid! idx fk(customers.id); quote_no:varchar[32]! uq idx; status:varchar[16]!=draft idx enum(draft|pending_approval|approved|sent|accepted|rejected|expired); current_version_no:int4!=1 idx; currency:varchar[8]!=CNY; total_amount:numeric[14,2]!=0 idx; valid_until:date? idx; sent_at:timestamptz? idx; accepted_at:timestamptz? idx` | `PK(id); UQ(org_id,quote_no); FK(opportunity_id/customer_id RESTRICT/CASCADE); CHECK(status@SM-quote); IDX(org_id,status,customer_id,valid_until)` | `允许软删除；已审批/已发送报价禁止物理删除；S2 初始化报价编号规则` |
| `TABLE-CT-001` | `contracts` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 056` | `quote_id:uuid? idx fk(quotes.id); opportunity_id:uuid? idx fk(opportunities.id); customer_id:uuid! idx fk(customers.id); contract_no:varchar[32]! uq idx; status:varchar[16]!=draft idx enum(draft|pending_approval|approved|signing|active|expired|terminated); starts_on:date? idx; ends_on:date? idx; sign_provider:varchar[32]?; sign_status:varchar[16]? idx enum(pending|signed|rejected|expired); document_url:varchar[255]?` | `PK(id); UQ(org_id,contract_no); FK(quote_id/opportunity_id SET NULL/CASCADE, customer_id RESTRICT/CASCADE); CHECK(status@SM-contract, ends_on>=starts_on); IDX(org_id,status,customer_id,starts_on,ends_on)` | `允许软删除；active 合同禁止物理删除；S2 初始化合同编号与电子签 provider 映射` |
| `TABLE-ORD-001` | `orders` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 059` | `contract_id:uuid? idx fk(contracts.id); quote_id:uuid? idx fk(quotes.id); customer_id:uuid! idx fk(customers.id); order_no:varchar[32]! uq idx; order_type:varchar[16]!=new idx enum(new|renewal|add_on|refund); status:varchar[16]!=draft idx enum(draft|confirmed|active|completed|cancelled|refunded); currency:varchar[8]!=CNY; total_amount:numeric[14,2]!=0 idx; activated_at:timestamptz? idx; fulfilled_at:timestamptz? idx` | `PK(id); UQ(org_id,order_no); FK(contract_id/quote_id SET NULL/CASCADE, customer_id RESTRICT/CASCADE); CHECK(status@SM-order); IDX(org_id,status,customer_id,order_type)` | `允许软删除；confirmed+ 订单禁止物理删除；S2 初始化订单号规则` |
| `TABLE-ORD-002` | `order_items` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `PROFILE-APPEND / 060` | `order_id:uuid! idx fk(orders.id); item_type:varchar[16]! idx enum(plan|addon|service); ref_id:uuid?; quantity:int4!=1; unit_price:numeric[14,2]!=0` | `PK(id); FK(order_id CASCADE/CASCADE); CHECK(item_type IN plan/addon/service); IDX(org_id,order_id)` | `禁止物理删除；跟随订单生命周期；无种子数据` |
| `TABLE-PLAN-001` | `plans` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 061` | `code:varchar[64]! idx; name:varchar[64]! idx; billing_cycle:varchar[16]!=monthly idx enum(monthly|yearly); base_price:numeric[14,2]!=0 idx; currency:varchar[8]!=CNY; seat_limit:int4!=1; feature_flags_json:jsonb!={}; status:varchar[16]!=active idx enum(active|inactive|archived)` | `PK(id); UQ(org_id,code); CHECK(base_price>=0, seat_limit>=1); IDX(org_id,status,billing_cycle)` | `允许软删除；有 active subscription 引用时禁止删除；S3 至少初始化一个月付与年付套餐` |
| `TABLE-PLAN-002` | `add_ons` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 062` | `plan_id:uuid? idx fk(plans.id); code:varchar[64]! idx; name:varchar[64]! idx; billing_type:varchar[16]!=one_time idx enum(one_time|recurring|usage); unit_price:numeric[14,2]!=0; currency:varchar[8]!=CNY; quota_delta_json:jsonb?; status:varchar[16]!=active idx enum(active|inactive|archived)` | `PK(id); UQ(org_id,code); FK(plan_id SET NULL/CASCADE); CHECK(unit_price>=0); IDX(org_id,status,plan_id,billing_type)` | `允许软删除；已有订单引用时禁止删除；S3 可初始化 AI/存储扩容包` |
| `TABLE-SUB-001` | `subscriptions` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 066` | `order_id:uuid! idx fk(orders.id); customer_id:uuid! idx fk(customers.id); plan_id:uuid! idx fk(plans.id); status:varchar[16]!=trial idx enum(trial|active|overdue|suspended|expired|cancelled); starts_at:timestamptz!=now() idx; ends_at:timestamptz! idx; auto_renew:boolean!=true idx; seat_count:int4!=1 idx; used_count:int4!=0 idx; last_bill_at:timestamptz? idx` | `PK(id); FK(order_id/customer_id/plan_id RESTRICT/CASCADE); CHECK(status@SM-subscription, used_count<=seat_count); IDX(org_id,status,customer_id,ends_at)` | `允许软删除；历史订阅禁止物理删除；订单激活后创建首条 subscription` |
| `TABLE-SUB-002` | `subscription_seats` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 067` | `subscription_id:uuid! idx fk(subscriptions.id); seat_code:varchar[64]! idx; seat_count:int4!=0 idx; used_count:int4!=0 idx` | `PK(id); UQ(org_id,subscription_id,seat_code) WHERE deleted_at IS NULL; FK(subscription_id CASCADE/CASCADE); CHECK(seat_count>=0, used_count<=seat_count); IDX(org_id,subscription_id)` | `允许软删除；座位变更写审计；无种子数据` |
| `TABLE-SUB-003` | `renewals` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 068` | `subscription_id:uuid! idx fk(subscriptions.id); contract_id:uuid? idx fk(contracts.id); renewal_no:varchar[32]! uq idx; status:varchar[16]!=draft idx enum(draft|pending|confirmed|paid|applied|cancelled); target_end_at:timestamptz! idx; quoted_amount:numeric[14,2]!=0; confirmed_at:timestamptz? idx; applied_at:timestamptz? idx` | `PK(id); UQ(org_id,renewal_no); FK(subscription_id RESTRICT/CASCADE, contract_id SET NULL/CASCADE); CHECK(status@SM-renewal); IDX(org_id,status,subscription_id,target_end_at)` | `允许软删除；已确认续费单禁止物理删除；合同到期提醒 job 可预创建 draft renewal` |
| `TABLE-BILL-001` | `bills` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 069` | `subscription_id:uuid! idx fk(subscriptions.id); customer_id:uuid! idx fk(customers.id); bill_no:varchar[32]! uq idx; bill_type:varchar[16]!=subscription idx enum(subscription|usage|renewal|manual); status:varchar[16]!=draft idx enum(draft|open|paid|overdue|cancelled); currency:varchar[8]!=CNY; subtotal_amount:numeric[14,2]!=0; tax_amount:numeric[14,2]!=0; total_amount:numeric[14,2]!=0 idx; due_at:timestamptz! idx; paid_at:timestamptz? idx` | `PK(id); UQ(org_id,bill_no); FK(subscription_id/customer_id RESTRICT/CASCADE); CHECK(status@SM-bill, total_amount=subtotal_amount+tax_amount); IDX(org_id,status,customer_id,due_at)` | `允许软删除；open/paid/overdue 账单禁止物理删除；出账任务自动创建，迁移可回填历史账单` |
| `TABLE-BILL-002` | `bill_items` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-APPEND / 070` | `bill_id:uuid! idx fk(bills.id); item_name:varchar[128]! idx; item_type:varchar[16]!=plan idx enum(plan|add_on|quota|tax|manual); quantity:numeric[12,4]!=1; unit_price:numeric[14,4]!=0; amount:numeric[14,2]!=0 idx; period_start:date? idx; period_end:date? idx` | `PK(id); FK(bill_id CASCADE/CASCADE); CHECK(quantity>=0, unit_price>=0, amount>=0); IDX(org_id,bill_id,item_type)` | `禁止物理删除；金额调整通过追加 adjustment item；出账时同步生成` |
| `TABLE-PAY-001` | `payments` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 073` | `order_id:uuid? idx fk(orders.id); bill_id:uuid? idx fk(bills.id); subscription_id:uuid? idx fk(subscriptions.id); renewal_id:uuid? idx fk(renewals.id); payment_no:varchar[32]! uq idx; payment_scene:varchar[16]!=order idx enum(order|bill|subscription|renewal); channel:varchar[16]!=manual idx enum(alipay|wechat|bank|manual); status:varchar[16]!=pending idx enum(pending|processing|succeeded|failed|refunded|voided); amount:numeric[14,2]!=0 idx; currency:varchar[8]!=CNY; provider_ref:varchar[128]? uq idx; reconciled_at:timestamptz? idx` | `PK(id); UQ(org_id,payment_no/provider_ref); FK(order/bill/subscription/renewal SET NULL/CASCADE); CHECK(status@SM-payment); IDX(org_id,status,payment_scene,reconciled_at)` | `允许软删除；支付流水禁止物理删除；启用支付渠道时初始化 provider config` |
| `TABLE-INV-001` | `invoices` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 074` | `bill_id:uuid? idx fk(bills.id); payment_id:uuid? idx fk(payments.id); invoice_no:varchar[32]? uq idx; title:varchar[128]! idx; tax_no:varchar[64]? idx; status:varchar[16]!=requested idx enum(requested|reviewing|issued|delivered|voided); amount:numeric[14,2]!=0 idx; currency:varchar[8]!=CNY; issued_at:timestamptz? idx; delivered_at:timestamptz? idx; download_url:varchar[255]?` | `PK(id); UQ(org_id,invoice_no) WHERE invoice_no IS NOT NULL; FK(bill_id/payment_id SET NULL/CASCADE); CHECK(status@SM-invoice); IDX(org_id,status,bill_id,issued_at)` | `允许软删除；已开具发票禁止物理删除；启用电子发票时初始化开票主体与税号模板` |
| `TABLE-CSM-002` | `success_plans` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 076` | `customer_id:uuid! idx fk(customers.id); owner_user_id:uuid! idx fk(users.id); title:varchar[128]! idx; status:varchar[16]!=draft idx enum(draft|active|on_hold|completed|cancelled); goal_summary:text?; milestone_json:jsonb?; next_review_at:timestamptz? idx; last_review_note:varchar[255]?` | `PK(id); FK(customer_id/owner_user_id RESTRICT/CASCADE); IDX(org_id,status,customer_id,owner_user_id,next_review_at)` | `允许软删除；有任务/回访引用时禁止删除；S2 可初始化成功计划模板` |
| `TABLE-INT-001` | `integrations` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 078` | `code:varchar[64]! idx; provider:varchar[64]! idx; category:varchar[32]!=crm idx enum(crm|erp|sign|email|payment|monitoring); auth_type:varchar[32]!=oauth2 idx enum(oauth2|token|basic|signature); status:varchar[16]!=draft idx enum(draft|active|paused|error|archived); config_json:jsonb!={}; last_verified_at:timestamptz? idx` | `PK(id); UQ(org_id,code); CHECK(status 配合集成生命周期); IDX(org_id,status,provider,category)` | `允许软删除；存在 flow/webhook/client 引用时禁止删除；S3 可初始化 provider 模板` |
| `TABLE-INT-002` | `integration_flows` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 079` | `integration_id:uuid! idx fk(integrations.id); flow_code:varchar[64]! uq idx; direction:varchar[16]!=outbound idx enum(inbound|outbound|bidirectional); status:varchar[16]!=draft idx enum(draft|active|paused|error|archived); trigger_type:varchar[32]!=event idx enum(event|schedule|manual); mapping_version:int4!=1 idx; last_error_code:varchar[64]? idx; last_run_at:timestamptz? idx` | `PK(id); UQ(org_id,flow_code); FK(integration_id CASCADE/CASCADE); CHECK(status@SM-integration_flow); IDX(org_id,status,integration_id,direction)` | `允许软删除；生产 flow 禁止物理删除；可按 provider 模板导入` |
| `TABLE-INT-003` | `integration_mappings` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 080` | `integration_flow_id:uuid! idx fk(integration_flows.id); source_field:varchar[128]! idx; target_field:varchar[128]! idx; transformer:varchar[64]?; required:boolean!=false idx; is_primary_key:boolean!=false idx` | `PK(id); UQ(integration_flow_id,source_field,target_field); FK(integration_flow_id CASCADE/CASCADE); CHECK(至少一条主键映射); IDX(org_id,integration_flow_id,target_field)` | `允许软删除；active flow 使用中的核心映射禁止删除；随模板或 flow 初始化` |
| `TABLE-INT-004` | `webhooks` | `S3 / S3 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 081` | `integration_id:uuid! idx fk(integrations.id); event_type:varchar[64]! idx; url:varchar[255]! idx; secret_masked:varchar[128]?; status:varchar[16]!=draft idx enum(draft|active|paused|error|archived); retry_policy_json:jsonb!={}; last_delivery_at:timestamptz? idx` | `PK(id); UQ(org_id,integration_id,event_type,url); FK(integration_id CASCADE/CASCADE); CHECK(url LIKE http%); IDX(org_id,status,event_type,last_delivery_at)` | `允许软删除；有 delivery backlog 时禁止删除；可按 provider 安装脚本导入` |
| `TABLE-INT-006` | `api_clients` | `S3 / S4 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 083` | `code:varchar[64]! idx; name:varchar[64]! idx; client_type:varchar[16]!=server idx enum(server|browser|device); status:varchar[16]!=active idx enum(active|disabled|rotating); key_prefix:varchar[16]! uq idx; secret_hash:varchar[255]!; rate_limit_per_min:int4!=60 idx; expires_at:timestamptz? idx; last_used_at:timestamptz? idx` | `PK(id); UQ(org_id,code/key_prefix); CHECK(rate_limit_per_min>=1); IDX(org_id,status,client_type,last_used_at)` | `允许软删除；已发放 client 禁止物理删除；S4 开发者中心启用后手工创建首批 client` |
| `TABLE-PLT-001` | `terminal_profiles` | `S3 / S4 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 084` | `terminal_type:varchar[16]!=web idx enum(web|portal|mobile|miniapp); profile_code:varchar[64]! idx; name:varchar[64]! idx; theme_json:jsonb!={}; navigation_json:jsonb!={}; feature_flags_json:jsonb!={}; status:varchar[16]!=draft idx enum(draft|active|paused|archived)` | `PK(id); UQ(org_id,terminal_type,profile_code); CHECK(theme/navigation/flags@JSONSchema); IDX(org_id,terminal_type,status)` | `允许软删除；被终端引用时禁止删除；S3 初始化 web/portal 默认 profile，S4 再补 miniapp` |
| `TABLE-I18N-001` | `locale_resources` | `S4 / S4 / S4 / implementation-ready` | `PROFILE-MUTABLE / 086` | `locale_code:varchar[16]!=zh-CN idx; namespace:varchar[64]!=common idx; resource_key:varchar[128]! idx; text_value:text!; status:varchar[16]!=draft idx enum(draft|reviewing|published|archived); version_tag:varchar[32]? idx` | `PK(id); UQ(org_id,locale_code,namespace,resource_key); CHECK(locale_code is BCP47); IDX(org_id,locale_code,namespace,status)` | `允许软删除；已发布文案版本禁止删除；S4 上线前初始化 locale pack` |
| `TABLE-I18N-002` | `region_policies` | `S4 / S4 / S4 / implementation-ready` | `PROFILE-MUTABLE / 087` | `region_code:varchar[16]! uq idx; currency:varchar[8]!=CNY idx; timezone:varchar[64]!=Asia/Shanghai; tax_mode:varchar[16]!=vat enum(vat|gst|sales_tax|none); data_residency:varchar[32]!=cn-mainland idx; policy_json:jsonb!={}; status:varchar[16]!=active idx enum(active|inactive|archived)` | `PK(id); UQ(org_id,region_code); CHECK(currency/timezone valid); IDX(org_id,region_code,status,currency)` | `允许软删除；被部署画像引用时禁止删除；S4 上线前初始化目标区域策略` |
| `TABLE-DEPLOY-001` | `deployment_profiles` | `S3 / S4 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 089` | `profile_code:varchar[64]! uq idx; deploy_mode:varchar[16]!=saas idx enum(saas|onprem|hybrid); region_code:varchar[16]!=CN idx; domain:varchar[255]! uq idx; db_conn_secret_ref:varchar[128]!; storage_conn_secret_ref:varchar[128]!; license_mode:varchar[16]!=online enum(online|offline); status:varchar[16]!=draft idx enum(draft|ready|deploying|live|error); last_check_at:timestamptz? idx` | `PK(id); UQ(org_id,profile_code/domain); CHECK(deploy_mode/license_mode valid); IDX(org_id,status,deploy_mode,region_code,last_check_at)` | `允许软删除；live 或存在 batch 时禁止删除；S3/S4 部署前必须创建目标画像` |
| `TABLE-DEPLOY-002` | `migration_batches` | `S3 / S4 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 090` | `deployment_profile_id:uuid! idx fk(deployment_profiles.id); batch_no:varchar[32]! uq idx; from_version:varchar[32]! idx; to_version:varchar[32]! idx; status:varchar[16]!=pending idx enum(pending|running|succeeded|failed|rolled_back); executed_by:uuid? idx fk(users.id); started_at:timestamptz? idx; finished_at:timestamptz? idx; rollback_token:varchar[128]?` | `PK(id); UQ(org_id,batch_no); FK(deployment_profile_id RESTRICT/CASCADE, executed_by SET NULL/CASCADE); IDX(org_id,status,deployment_profile_id,started_at)` | `禁止物理删除；回滚批次必须保留 rollback_token；每次演练和正式迁移都必须写入` |
| `TABLE-DEPLOY-003` | `license_tokens` | `S3 / S4 / S3,S4 / implementation-ready` | `PROFILE-MUTABLE / 091` | `deployment_profile_id:uuid! idx fk(deployment_profiles.id); token_code:varchar[128]! uq idx; license_type:varchar[16]!=subscription idx enum(subscription|perpetual|trial); status:varchar[16]!=issued idx enum(issued|activated|expired|revoked); seat_limit:int4!=1; expires_at:timestamptz? idx; activated_at:timestamptz? idx; bound_fingerprint:varchar[255]? idx` | `PK(id); UQ(org_id,token_code); FK(deployment_profile_id RESTRICT/CASCADE); CHECK(seat_limit>=1); IDX(org_id,status,expires_at,bound_fingerprint)` | `允许软删除；已激活 license 禁止物理删除；on-prem 首次部署写入 online/offline token` |

## 3. 跨表统一约束
- `org_id` 是所有租户级表的默认复合索引首列；常用查询索引统一优先 `org_id + status/owner/time`。
- 所有状态字段必须与 [06_状态机总表.md](./06_状态机总表.md) 对齐；不允许在 DDL 中定义额外终态。
- 财务与审计相关表禁止物理删除；错误修正通过补偿流水或回滚批次完成，不通过硬删“回到过去”。
- S1 租户初始化最少写入：`organizations/departments/users/roles/permissions/user_roles/role_permissions/channels`。
- S3 商业化初始化最少写入：`plans/add_ons/deployment_profiles`；S4 国际化/私有化初始化最少写入：`locale_resources/region_policies/license_tokens`。

## S2 成交与成交后衔接主干新增表

### TABLE-QT-001 quotes

```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  opportunity_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  quote_no VARCHAR(32) NOT NULL,
  current_version_no INT NOT NULL DEFAULT 1,
  currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT uq_quotes_org_no UNIQUE (org_id, quote_no) WHERE deleted_at IS NULL,
  CONSTRAINT chk_quotes_status CHECK (status IN ('draft','pending_approval','approved','sent','accepted','rejected','expired'))
);

CREATE INDEX idx_quotes_org_status ON quotes(org_id, status, updated_at DESC);
CREATE INDEX idx_quotes_org_opportunity ON quotes(org_id, opportunity_id);
CREATE INDEX idx_quotes_org_customer ON quotes(org_id, customer_id);
```

### TABLE-QT-002 quote_versions

```sql
CREATE TABLE quote_versions (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  version_no INT NOT NULL,
  payload JSONB NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT uq_quote_versions_org_quote_ver UNIQUE (org_id, quote_id, version_no)
);

CREATE INDEX idx_quote_versions_org_quote ON quote_versions(org_id, quote_id, version_no DESC);
```

### TABLE-QT-003 quote_approvals

```sql
CREATE TABLE quote_approvals (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  approver_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_quote_approvals_status CHECK (status IN ('pending','approved','rejected'))
);

CREATE INDEX idx_quote_approvals_org_quote ON quote_approvals(org_id, quote_id);
```

### TABLE-CT-001 contracts

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quote_id UUID NULL REFERENCES quotes(id) ON DELETE SET NULL ON UPDATE CASCADE,
  opportunity_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  contract_no VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  signed_at TIMESTAMPTZ NULL,
  starts_on DATE NULL,
  ends_on DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT uq_contracts_org_no UNIQUE (org_id, contract_no) WHERE deleted_at IS NULL,
  CONSTRAINT chk_contracts_status CHECK (status IN ('draft','pending_approval','approved','signing','active','expired','terminated'))
);

CREATE INDEX idx_contracts_org_status ON contracts(org_id, status, updated_at DESC);
CREATE INDEX idx_contracts_org_customer ON contracts(org_id, customer_id);
CREATE INDEX idx_contracts_org_opportunity ON contracts(org_id, opportunity_id);
```

### TABLE-CT-002 contract_approvals

```sql
CREATE TABLE contract_approvals (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  approver_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_contract_approvals_status CHECK (status IN ('pending','approved','rejected'))
);

CREATE INDEX idx_contract_approvals_org_contract ON contract_approvals(org_id, contract_id);
```

### TABLE-CT-003 contract_documents

```sql
CREATE TABLE contract_documents (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  file_url VARCHAR(255) NOT NULL,
  doc_type VARCHAR(32) NOT NULL,
  sign_provider VARCHAR(32) NULL,
  sign_status VARCHAR(16) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1)
);

CREATE INDEX idx_contract_documents_org_contract ON contract_documents(org_id, contract_id);
```

### TABLE-ORD-001 orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  contract_id UUID NULL REFERENCES contracts(id) ON DELETE SET NULL ON UPDATE CASCADE,
  quote_id UUID NULL REFERENCES quotes(id) ON DELETE SET NULL ON UPDATE CASCADE,
  customer_id UUID NOT NULL,
  order_no VARCHAR(32) NOT NULL,
  order_type VARCHAR(16) NOT NULL DEFAULT 'new',
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT uq_orders_org_no UNIQUE (org_id, order_no) WHERE deleted_at IS NULL,
  CONSTRAINT chk_orders_type CHECK (order_type IN ('new','renewal','addon','refund')),
  CONSTRAINT chk_orders_status CHECK (status IN ('draft','confirmed','active','completed','cancelled','refunded'))
);

CREATE INDEX idx_orders_org_status ON orders(org_id, status, updated_at DESC);
CREATE INDEX idx_orders_org_customer ON orders(org_id, customer_id);
```

### TABLE-ORD-002 order_items

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  item_type VARCHAR(16) NOT NULL,
  ref_id UUID NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_order_items_type CHECK (item_type IN ('plan','addon','service'))
);

CREATE INDEX idx_order_items_org_order ON order_items(org_id, order_id);
```

### TABLE-PAY-001 payments

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  payment_scene VARCHAR(16) NOT NULL,
  scene_id UUID NOT NULL,
  payment_no VARCHAR(32) NOT NULL,
  channel VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
  paid_at TIMESTAMPTZ NULL,
  reconciled_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT uq_payments_org_no UNIQUE (org_id, payment_no) WHERE deleted_at IS NULL,
  CONSTRAINT chk_payments_scene CHECK (payment_scene IN ('order','bill','subscription','renewal')),
  CONSTRAINT chk_payments_status CHECK (status IN ('pending','processing','succeeded','failed','refunded','voided'))
);

CREATE INDEX idx_payments_org_status ON payments(org_id, status, updated_at DESC);
CREATE INDEX idx_payments_org_scene ON payments(org_id, payment_scene, scene_id);
```

### TABLE-SUB-001 subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  customer_id UUID NOT NULL,
  plan_id UUID NULL,
  order_id UUID NULL REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'trial',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  seat_count INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  last_bill_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT chk_subscriptions_status CHECK (status IN ('trial','active','overdue','suspended','expired','cancelled'))
);

CREATE INDEX idx_subscriptions_org_status ON subscriptions(org_id, status, updated_at DESC);
CREATE INDEX idx_subscriptions_org_customer ON subscriptions(org_id, customer_id);
```

### TABLE-SUB-002 subscription_seats

```sql
CREATE TABLE subscription_seats (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  seat_code VARCHAR(64) NOT NULL,
  seat_count INT NOT NULL DEFAULT 0,
  used_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT uq_sub_seats_org_sub_code UNIQUE (org_id, subscription_id, seat_code) WHERE deleted_at IS NULL
);

CREATE INDEX idx_sub_seats_org_subscription ON subscription_seats(org_id, subscription_id);
```

### TABLE-CSM-001 customer_health_scores

```sql
CREATE TABLE customer_health_scores (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  customer_id UUID NOT NULL,
  score NUMERIC(8,2) NOT NULL DEFAULT 0,
  level VARCHAR(16) NOT NULL DEFAULT 'medium',
  factors JSONB NOT NULL DEFAULT '{}',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT chk_health_level CHECK (level IN ('low','medium','high','critical'))
);

CREATE INDEX idx_health_org_customer ON customer_health_scores(org_id, customer_id);
CREATE INDEX idx_health_org_level ON customer_health_scores(org_id, level);
```

### TABLE-CSM-002 success_plans

```sql
CREATE TABLE success_plans (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  customer_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1)
);

CREATE INDEX idx_success_plans_org_customer ON success_plans(org_id, customer_id);
```

### TABLE-CSM-003 customer_return_visits

```sql
CREATE TABLE customer_return_visits (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  customer_id UUID NOT NULL,
  visit_type VARCHAR(32) NOT NULL,
  summary TEXT NOT NULL,
  next_visit_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_return_visits_org_customer ON customer_return_visits(org_id, customer_id);
```

### TABLE-KB-001 knowledge_categories

```sql
CREATE TABLE knowledge_categories (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(64) NOT NULL,
  parent_id UUID NULL REFERENCES knowledge_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT uq_kb_categories_org_code UNIQUE (org_id, code) WHERE deleted_at IS NULL
);

CREATE INDEX idx_kb_categories_org_parent ON knowledge_categories(org_id, parent_id);
```

### TABLE-KB-002 knowledge_items

```sql
CREATE TABLE knowledge_items (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  category_id UUID NOT NULL REFERENCES knowledge_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  title VARCHAR(255) NOT NULL,
  content_md TEXT NOT NULL,
  content_html TEXT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  keywords TEXT[] NULL,
  source_type VARCHAR(16) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT chk_kb_items_status CHECK (status IN ('draft','review','published','archived')),
  CONSTRAINT chk_kb_items_source CHECK (source_type IN ('manual','import','ai'))
);

CREATE INDEX idx_kb_items_org_category ON knowledge_items(org_id, category_id);
CREATE INDEX idx_kb_items_org_status ON knowledge_items(org_id, status, updated_at DESC);
```

### TABLE-KB-003 knowledge_reviews

```sql
CREATE TABLE knowledge_reviews (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  knowledge_item_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE ON UPDATE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_kb_reviews_status CHECK (status IN ('pending','approved','rejected'))
);

CREATE INDEX idx_kb_reviews_org_item ON knowledge_reviews(org_id, knowledge_item_id);
```

### TABLE-DASH-001 metric_snapshots

```sql
CREATE TABLE metric_snapshots (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  metric_code VARCHAR(64) NOT NULL,
  snapshot_at TIMESTAMPTZ NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{}',
  metric_value NUMERIC(18,4) NOT NULL DEFAULT 0,
  source_type VARCHAR(32) NOT NULL DEFAULT 'realtime',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_metric_source CHECK (source_type IN ('realtime','batch','materialized_view'))
);

CREATE INDEX idx_metric_snapshots_org_code_time ON metric_snapshots(org_id, metric_code, snapshot_at DESC);
CREATE INDEX idx_metric_snapshots_org_time ON metric_snapshots(org_id, snapshot_at DESC);
```

### TABLE-AUTO-001 campaigns

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  objective VARCHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ NULL,
  ends_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT uq_campaigns_org_code UNIQUE (org_id, code) WHERE deleted_at IS NULL,
  CONSTRAINT chk_campaigns_status CHECK (status IN ('draft','active','paused','completed','archived'))
);

CREATE INDEX idx_campaigns_org_status ON campaigns(org_id, status, updated_at DESC);
```

### TABLE-AUTO-002 segments

```sql
CREATE TABLE segments (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  rule_json JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT uq_segments_org_code UNIQUE (org_id, code) WHERE deleted_at IS NULL
);

CREATE INDEX idx_segments_org_status ON segments(org_id, status, updated_at DESC);
```

### TABLE-AUTO-003 campaign_assets

```sql
CREATE TABLE campaign_assets (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  campaign_id UUID NULL REFERENCES campaigns(id) ON DELETE SET NULL ON UPDATE CASCADE,
  asset_type VARCHAR(32) NOT NULL,
  title VARCHAR(128) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1)
);

CREATE INDEX idx_campaign_assets_org_campaign ON campaign_assets(org_id, campaign_id);
```

### TABLE-AUTO-004 automation_flows

```sql
CREATE TABLE automation_flows (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  trigger_type VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  definition JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
  CONSTRAINT uq_automation_flows_org_code UNIQUE (org_id, code) WHERE deleted_at IS NULL,
  CONSTRAINT chk_automation_flows_status CHECK (status IN ('draft','active','paused','archived'))
);

CREATE INDEX idx_automation_flows_org_status ON automation_flows(org_id, status, updated_at DESC);
```

### TABLE-AUTO-005 automation_runs

```sql
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  flow_id UUID NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE ON UPDATE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  trigger_payload JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ NULL,
  error_code VARCHAR(64) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_automation_runs_org_flow ON automation_runs(org_id, flow_id, started_at DESC);
```

### TABLE-AUTO-006 automation_steps

```sql
CREATE TABLE automation_steps (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  run_id UUID NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE ON UPDATE CASCADE,
  step_code VARCHAR(64) NOT NULL,
  step_type VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  input_payload JSONB NOT NULL DEFAULT '{}',
  output_payload JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_automation_steps_org_run ON automation_steps(org_id, run_id);
```
