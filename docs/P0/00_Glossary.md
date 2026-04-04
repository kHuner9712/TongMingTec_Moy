# MOY 项目术语表与命名规范

---

## 文档元信息

| 属性 | 内容 |
|------|------|
| 文档名称 | MOY 项目术语表与命名规范 |
| 文档编号 | MOY_GLOSSARY_001 |
| 版本号 | v1.0 |
| 状态 | 已确认 |
| 作者 | MOY 文档架构组 |
| 日期 | 2026-04-05 |
| 目标读者 | 全体项目成员、AI 协作代理 |
| 输入来源 | 全部 P0 文档 |

---

## 一、文档目的

本文档作为 MOY 项目的**术语统一标准**，用于：

1. 定义项目核心术语的统一含义
2. 确保所有文档使用一致的术语表达
3. 避免因术语歧义导致的理解偏差
4. 为 AI 协作代理提供术语参考
5. 统一代码命名规范

**使用规则：**
- 所有 P0 文档必须使用本术语表定义的标准术语
- 新增术语需经评审后添加到本术语表
- 术语冲突时以本术语表为准

---

## 二、核心实体术语

### 2.1 业务实体术语

| 标准术语 | 英文 | 英文复数 | 定义 | 禁用表述 |
|----------|------|----------|------|----------|
| 线索 | Lead | Leads | 潜在客户信息，尚未转化为商机 | 潜在客户、销售线索、商机线索 |
| 客户 | Customer | Customers | 已建立业务关系的客户企业 | 客户企业、客户公司、企业客户 |
| 联系人 | Contact | Contacts | 客户企业的具体联系人 | 客户联系人、关键联系人 |
| 商机 | Opportunity | Opportunities | 有明确购买意向的销售机会 | 销售机会、成单机会、销售单 |
| 会话 | Conversation | Conversations | 客户与客服/销售的沟通交互 | 对话、沟通记录、聊天记录 |
| 工单 | Ticket | Tickets | 客户问题或请求的服务记录 | 服务工单、问题单、服务单 |
| 知识库 | Knowledge Base | Knowledge Bases | 存储和管理知识的系统 | 知识管理系统、FAQ系统 |
| 消息 | Message | Messages | 会话中的单条沟通内容 | 聊天消息、沟通消息 |

### 2.2 组织与用户术语

| 标准术语 | 英文 | 英文复数 | 定义 | 禁用表述 |
|----------|------|----------|------|----------|
| 组织 | Organization | Organizations | 多租户架构下的租户单位 | 租户、企业、公司、客户公司 |
| 用户 | User | Users | 系统使用者，属于某个组织 | 账号、成员、员工、操作员 |
| 角色 | Role | Roles | 权限集合，用于控制用户访问权限 | 职位、岗位、身份 |
| 权限 | Permission | Permissions | 具体的操作权限点 | 权限点、操作权限、功能权限 |
| 团队 | Team | Teams | 组织内部的销售/客服团队 | 部门、小组、群组 |
| 部门 | Department | Departments | 组织内部的行政单位 | 部门、组织架构 |

### 2.3 角色术语

| 标准术语 | 英文标识 | 定义 | 权限范围 |
|----------|----------|------|----------|
| 系统管理员 | admin | 组织最高权限管理者 | 全部功能 |
| 销售经理 | sales_manager | 销售团队管理者 | 团队销售数据、团队管理 |
| 销售代表 | sales_rep | 一线销售人员 | 个人销售数据 |
| 客服经理 | service_manager | 客服团队管理者 | 团队客服数据、团队管理 |
| 客服专员 | service_agent | 一线客服人员 | 个人客服数据 |

---

## 三、状态术语

### 3.1 线索状态

| 状态值 | 英文 | 中文名称 | 定义 | 允许转换 |
|--------|------|----------|------|----------|
| new | new | 新建 | 新录入未分配的线索 | assigned, invalid |
| assigned | assigned | 已分配 | 已分配给销售人员 | following, invalid |
| following | following | 跟进中 | 销售人员正在跟进 | converted, invalid |
| converted | converted | 已转化 | 已转化为商机 | 终态 |
| invalid | invalid | 无效 | 确认为无效线索 | 终态 |

### 3.2 商机阶段

| 阶段值 | 英文 | 中文名称 | 定义 | 赢率 |
|--------|------|----------|------|------|
| initial | initial | 初步接触 | 刚创建的商机 | 10% |
| requirement | requirement | 需求确认 | 正在确认客户需求 | 30% |
| proposal | proposal | 方案报价 | 已提交方案或报价 | 50% |
| negotiation | negotiation | 商务谈判 | 进入商务谈判阶段 | 70% |
| won | won | 赢单 | 成功成交 | 100% |
| lost | lost | 输单 | 未能成交 | 0% |

### 3.3 工单状态

| 状态值 | 英文 | 中文名称 | 定义 | 允许转换 |
|--------|------|----------|------|----------|
| pending | pending | 待处理 | 新建待分配 | assigned |
| assigned | assigned | 已分配 | 已分配处理人 | processing |
| processing | processing | 处理中 | 正在处理 | resolved |
| resolved | resolved | 已解决 | 问题已解决 | closed |
| closed | closed | 已关闭 | 工单已关闭 | 终态 |

### 3.4 会话状态

| 状态值 | 英文 | 中文名称 | 定义 | 允许转换 |
|--------|------|----------|------|----------|
| pending | pending | 待接入 | 等待客服接入 | active |
| active | active | 进行中 | 会话正在进行 | closed |
| closed | closed | 已结束 | 会话已结束 | 终态 |

---

## 四、业务流程术语

### 4.1 销售流程术语

| 术语 | 英文 | 定义 |
|------|------|------|
| 获客 | Customer Acquisition | 吸引潜在客户并转化为线索的过程 |
| 线索录入 | Lead Entry | 将线索信息录入系统的过程 |
| 线索分配 | Lead Assignment | 将线索分配给销售人员的过程 |
| 线索跟进 | Lead Follow-up | 对线索进行联系和推进的过程 |
| 线索转化 | Lead Conversion | 线索转化为商机或标记为无效的过程 |
| 商机推进 | Opportunity Progression | 商机从一个阶段推进到下一阶段 |
| 商机预测 | Opportunity Forecast | 预测商机成交概率和金额 |
| 成交 | Deal Closing | 完成合同签署和订单确认的过程 |
| 复购 | Repurchase | 客户续费或再次购买的过程 |

### 4.2 客服流程术语

| 术语 | 英文 | 定义 |
|------|------|------|
| 会话接入 | Conversation Assignment | 客服接入客户会话的过程 |
| 智能回复 | Smart Reply | AI 辅助自动回复客户问题 |
| 话术辅助 | Script Assistance | AI 推荐话术模板辅助沟通 |
| 工单创建 | Ticket Creation | 创建服务工单的过程 |
| 工单流转 | Ticket Routing | 工单在不同处理人之间传递 |
| 工单升级 | Ticket Escalation | 工单超时或复杂时升级处理 |
| SLA管理 | SLA Management | 服务水平协议管理 |

### 4.3 客户经营术语

| 术语 | 英文 | 定义 |
|------|------|------|
| 客户档案 | Customer Profile | 客户的基本信息、联系方式、企业信息等 |
| 客户画像 | Customer Persona | 整合销售、服务、行为数据的客户全景视图 |
| 客户分组 | Customer Segmentation | 按行业、规模、阶段等维度对客户分类 |
| 客户标签 | Customer Tag | 用于精准触达的客户标记 |
| 客户生命周期 | Customer Lifecycle | 客户从获客到流失的完整周期 |
| 客户价值 | Customer Value | 客户对企业的贡献价值 |

---

## 五、技术术语

### 5.1 架构术语

| 术语 | 英文 | 定义 |
|------|------|------|
| Web端 | Web Client | 基于 Web 浏览器的客户端 |
| API | Application Programming Interface | 应用程序编程接口 |
| RBAC | Role-Based Access Control | 基于角色的访问控制 |
| JWT | JSON Web Token | 用于身份认证的令牌标准 |
| RESTful | Representational State Transfer | 一种 API 设计风格 |
| WebSocket | WebSocket | 全双工通信协议 |

### 5.2 AI术语

| 术语 | 英文 | 定义 |
|------|------|------|
| LLM | Large Language Model | 大语言模型 |
| AIGC | AI Generated Content | 人工智能生成内容 |
| Token | Token | 大模型计费单位，约等于 1.5 个汉字 |
| Prompt | Prompt | 提示词，用于引导大模型生成内容 |
| AI原生 | AI-Native | AI 作为系统核心能力而非附加功能的设计理念 |

### 5.3 数据术语

| 术语 | 英文 | 定义 |
|------|------|------|
| 软删除 | Soft Delete | 通过标记删除而非物理删除数据 |
| 审计日志 | Audit Log | 记录数据变更历史的日志 |
| 租户隔离 | Tenant Isolation | 多租户架构下的数据隔离机制 |
| 数据权限 | Data Permission | 基于数据范围的控制权限 |

---

## 六、指标术语

### 6.1 北极星指标

| 术语 | 英文 | 定义 | 计算公式 |
|------|------|------|----------|
| 线索转化率 | Lead Conversion Rate | 成交客户数占线索总数的比例 | 成交客户数 ÷ 线索总数 × 100% |
| 首响时效 | First Response Time | 从客户咨询到首次响应的时间 | 时间差（分钟） |
| 跟进及时率 | Follow-up Timeliness Rate | 及时跟进次数占应跟进次数的比例 | 及时跟进次数 ÷ 应跟进次数 × 100% |
| 成交周期 | Deal Cycle | 从首次接触到成交的平均天数 | Σ 成交天数 ÷ 成交客户数 |
| 客户满意度 | Customer Satisfaction (CSAT) | 客户满意评价占总评价的比例 | 满意评价数 ÷ 总评价数 × 100% |
| 复购率 | Repurchase Rate | 续费客户数占应续费客户数的比例 | 续费客户数 ÷ 应续费客户数 × 100% |
| 客户生命周期价值 | Customer Lifetime Value (CLV) | 客户全生命周期贡献的收入 | 累计收入 |

### 6.2 销售指标

| 术语 | 英文 | 定义 | 计算公式 |
|------|------|------|----------|
| 线索量 | Lead Volume | 新增线索数量 | COUNT(leads) |
| 商机金额 | Opportunity Amount | 商机预计成交金额 | SUM(opportunity.amount) |
| 赢单率 | Win Rate | 赢单商机占比 | 赢单商机数 ÷ 总商机数 × 100% |
| 预测收入 | Forecast Revenue | 基于商机预测的收入 | Σ(商机金额 × 赢率) |

### 6.3 客服指标

| 术语 | 英文 | 定义 | 计算公式 |
|------|------|------|----------|
| 会话量 | Conversation Volume | 会话总数 | COUNT(conversations) |
| 平均响应时间 | Average Response Time | 平均首响时间 | Σ 响应时间 ÷ 会话数 |
| 工单解决率 | Ticket Resolution Rate | 已解决工单占比 | 已解决工单数 ÷ 总工单数 × 100% |
| SLA达标率 | SLA Compliance Rate | SLA达标工单占比 | SLA达标工单数 ÷ 总工单数 × 100% |

---

## 七、命名规范

### 7.1 数据库命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 表名 | 小写下划线，复数形式 | `customers`, `leads`, `opportunities` |
| 字段名 | 小写下划线 | `customer_name`, `created_at`, `is_deleted` |
| 主键 | `{表名单数}_id` 或 `id` | `id`, `customer_id` |
| 外键 | `{关联表名单数}_id` | `customer_id`, `user_id` |
| 索引 | `idx_{表名}_{字段名}` | `idx_customers_org_id` |
| 唯一索引 | `uk_{表名}_{字段名}` | `uk_users_email` |

### 7.2 API命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 路径 | 小写连字符，RESTful | `/api/v1/customers`, `/api/v1/leads` |
| 资源名 | 复数形式 | `/customers`, `/opportunities` |
| 路径参数 | 小驼峰 | `/customers/{customerId}` |
| 查询参数 | 小驼峰 | `?pageSize=10&sortBy=createdAt` |

### 7.3 接口响应字段命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 字段名 | 小驼峰 | `customerName`, `createdAt`, `isDeleted` |
| 布尔字段 | `is`/`has` 前缀 | `isActive`, `hasPermission` |
| 时间字段 | `{动作}At` 后缀 | `createdAt`, `updatedAt`, `closedAt` |
| ID字段 | `{实体}Id` 后缀 | `customerId`, `userId` |

### 7.4 代码命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 类名 | 大驼峰 | `CustomerService`, `LeadController` |
| 方法名 | 小驼峰 | `getCustomerById`, `createLead` |
| 变量名 | 小驼峰 | `customerId`, `leadList` |
| 常量名 | 全大写下划线 | `MAX_PAGE_SIZE`, `DEFAULT_TIMEOUT` |
| 枚举值 | 小写下划线 | `new`, `assigned`, `following` |

---

## 八、信息标注术语

### 8.1 来源类型标注

| 标注 | 含义 | 使用场景 |
|------|------|----------|
| [Fact] | 来自权威来源的可验证数据 | 事实陈述 |
| [Inference] | 基于事实的逻辑推演 | 推断结论 |
| [Assumption] | 未经证实的合理猜测 | 假设说明 |
| [External:来源] | 来自外部文献、报告、网站 | 外部引用 |
| [Internal:来源] | 来自公司内部文档 | 内部引用 |
| [Pending] | 已识别需要获取的信息，尚未完成调研 | 待调研项 |
| [Estimated] | 基于方法论的估算 | 估算值 |

### 8.2 待确认标注

| 标注 | 含义 | 使用场景 |
|------|------|----------|
| [TBD] | 待确认 | 信息需要人工确认或补充 |
| [Simulated] | 模拟数据 | 仅为示例，禁止作为正式事实 |

---

## 九、术语使用规范

### 9.1 术语一致性要求

1. **统一使用标准术语**：所有文档必须使用本术语表定义的标准术语
2. **避免同义词混用**：同一概念使用统一术语，避免多种表达
3. **首次使用注明英文**：首次出现的术语建议注明英文原文
4. **新增术语需评审**：新增术语需经评审后添加到本术语表

### 9.2 常见术语对照

| 非标准术语 | 标准术语 | 说明 |
|------------|----------|------|
| 客户关系管理 | 客户管理 | 使用简洁表达 |
| 销售机会 | 商机 | 统一使用"商机" |
| 服务工单 | 工单 | 统一使用"工单" |
| 在线客服系统 | 会话管理 | 使用功能模块名称 |
| 知识管理系统 | 知识库 | 统一使用"知识库" |
| 租户 | 组织 | 统一使用"组织" |
| 账号 | 用户 | 统一使用"用户" |
| 职位 | 角色 | 统一使用"角色" |

---

## 十、版本记录

| 版本 | 日期 | 作者 | 变更摘要 | 状态 |
|------|------|------|----------|------|
| v0.1 | 2026-04-04 | MOY 文档架构组 | 初稿 | 草案 |
| v1.0 | 2026-04-05 | MOY 文档架构组 | 扩展术语定义；新增状态术语、命名规范；统一术语对照表 | 已确认 |

---

## 十一、待补充术语

| 术语 | 状态 | 说明 |
|------|------|------|
| [TBD] | 待补充 | 根据项目进展持续补充 |

---

## 建议人工确认的问题

1. 术语定义是否准确？
2. 是否有遗漏的核心术语？
3. 命名规范是否符合团队习惯？
4. 是否需要补充行业特定术语？
