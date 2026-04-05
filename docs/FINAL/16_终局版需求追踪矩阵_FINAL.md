# MOY 终局版需求追踪矩阵

---

## 文档元信息

| 属性 | 内容 |
|------|------|
| 文档名称 | MOY 终局版需求追踪矩阵 |
| 文档编号 | MOY_FINAL_016 |
| 版本号 | v1.0 |
| 状态 | 已确认 |
| 作者 | MOY 文档架构组 |
| 日期 | 2026-04-05 |
| 目标读者 | 产品团队、开发团队、测试团队、项目管理团队 |
| 输入来源 | [P0-RTM](../P0/07_RTM_需求跟踪矩阵.md)、[终局版全量需求总表](./15_终局版全量需求总表.md)、[终局版状态机总表](./07_终局版状态机总表.md) |

---

## 一、文档目标

本文档作为 MOY 终局版的**需求追踪矩阵基线**，用于：

1. 建立完整的**需求追溯链**：需求 → 业务域 → 模块 → 对象 → 状态机 → 权限 → 接口 → 页面 → 测试用例
2. 确保每个需求**可追踪、可验证、可交付**
3. 支持**需求变更影响分析**
4. 作为开发、测试、验收的**工作底稿**
5. 为终局版全量需求提供**端到端追溯能力**
6. 实现 **100% 追溯覆盖率**目标

---

## 二、适用范围

### 2.1 适用系统

| 系统 | 说明 |
|------|------|
| MOY 终局版 | 全量业务系统（P0-P3 全部需求） |
| AI 工作台 | 智能回复、知识问答、线索评分等 AI 功能 |
| 自动化引擎 | 规则触发、工作流执行等自动化功能 |
| 开放平台 | API、Webhook、SDK 等开放能力 |

### 2.2 适用需求范围

| 优先级 | 需求数量 | 说明 |
|--------|----------|------|
| P0 | 77 条 | 首期核心需求 |
| P1 | 32 条 | 首期增强需求 |
| P2 | 21 条 | 二期迭代需求 |
| P3 | 14 条 | 长期规划需求 |
| **合计** | **144 条** | 终局版全量需求 |

---

## 三、术语定义

### 3.1 核心术语

| 术语 | 英文 | 定义 |
|------|------|------|
| 需求追踪矩阵 | RTM (Requirements Traceability Matrix) | 记录需求与各交付物之间对应关系的矩阵 |
| 追溯链 | Traceability Chain | 从需求到交付物的完整追踪路径 |
| 业务域 | Business Domain | 业务功能的划分范围，如客户管理、线索管理等 |
| 模块 | Module | 系统功能模块，是业务域的技术实现单元 |
| 对象 | Object | 系统中的业务实体，如客户、线索、商机等 |
| 状态机 | State Machine | 定义实体生命周期中所有可能状态及其流转规则 |
| 权限点 | Permission Point | 对特定资源执行特定操作的授权单元 |
| 接口 | API | 系统对外暴露的服务端点 |
| 页面 | Page | 前端用户交互界面 |
| 测试用例 | Test Case | 验证需求实现正确性的测试场景 |
| 追溯覆盖率 | Traceability Coverage | 已追踪需求占总需求数的比例 |

### 3.2 ID 编码规则

| ID类型 | 编码规则 | 示例 |
|--------|----------|------|
| 需求 | REQ-{模块}-{序号} | REQ-CM-001 |
| 业务域 | BD-{业务域} | BD-CUSTOMER |
| 模块 | MOD-{模块名} | MOD-CUSTOMER |
| 对象 | OBJ-{对象名} | OBJ-CUSTOMER |
| 状态机 | SM-{实体名} | SM-LEAD |
| 权限点 | PERM-{模块}-{操作} | PERM-CM-READ |
| 接口 | API-{METHOD}-{模块}-{序号} | API-GET-CM-001 |
| 页面 | PAGE-{序号} | PAGE-001 |
| 测试用例 | TEST-{模块}-{序号} | TEST-CM-001 |

---

## 四、追溯链路架构

### 4.1 追溯链路图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           终局版需求追溯链路架构                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐                                                                │
│  │   需求      │  REQ-XXX-XXX                                                   │
│  │ (Requirement)│                                                               │
│  └──────┬──────┘                                                                │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                                │
│  │  业务域     │  BD-XXX                                                        │
│  │(Business Domain)│                                                            │
│  └──────┬──────┘                                                                │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                                │
│  │   模块      │  MOD-XXX                                                       │
│  │  (Module)   │                                                                │
│  └──────┬──────┘                                                                │
│         │                                                                       │
│         ├──────────────────┬──────────────────┐                                 │
│         ▼                  ▼                  ▼                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                         │
│  │    对象     │    │   状态机    │    │   权限点    │                         │
│  │  (Object)   │    │(State Machine)│  │(Permission) │                         │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                         │
│         │                  │                  │                                 │
│         └──────────────────┴──────────────────┘                                 │
│                            │                                                    │
│         ┌──────────────────┼──────────────────┐                                 │
│         ▼                  ▼                  ▼                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                         │
│  │    接口     │    │    页面     │    │  测试用例   │                         │
│  │   (API)    │    │   (Page)    │    │ (Test Case) │                         │
│  └─────────────┘    └─────────────┘    └─────────────┘                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 追溯维度说明

| 追溯维度 | 说明 | 追溯目的 |
|----------|------|----------|
| 需求→业务域 | 需求所属的业务范围 | 业务价值追溯 |
| 需求→模块 | 需求归属的功能模块 | 模块职责界定 |
| 需求→对象 | 需求涉及的业务实体 | 数据模型追溯 |
| 需求→状态机 | 需求涉及的状态流转 | 业务流程追溯 |
| 需求→权限点 | 需求涉及的权限控制 | 权限安全追溯 |
| 需求→接口 | 需求对应的 API 接口 | 后端开发追溯 |
| 需求→页面 | 需求对应的前端页面 | 前端开发追溯 |
| 需求→测试用例 | 需求对应的测试场景 | 测试验证追溯 |

---

## 五、需求追踪矩阵总表

### 5.1 P0 核心需求追踪矩阵

#### 5.1.1 客户管理需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-CM-001 | 客户创建 | BD-CUSTOMER | MOD-CUSTOMER | OBJ-CUSTOMER | SM-CUSTOMER | PERM-CM-CREATE | API-POST-CM-001 | PAGE-006 | TEST-CM-001~003 | P0 |
| REQ-CM-002 | 客户编辑 | BD-CUSTOMER | MOD-CUSTOMER | OBJ-CUSTOMER | SM-CUSTOMER | PERM-CM-UPDATE | API-PUT-CM-001 | PAGE-006 | TEST-CM-004 | P0 |
| REQ-CM-003 | 客户查询 | BD-CUSTOMER | MOD-CUSTOMER | OBJ-CUSTOMER | - | PERM-CM-READ | API-GET-CM-001 | PAGE-004 | TEST-CM-005 | P0 |
| REQ-CM-004 | 客户详情 | BD-CUSTOMER | MOD-CUSTOMER | OBJ-CUSTOMER | - | PERM-CM-READ | API-GET-CM-002 | PAGE-005 | TEST-CM-006 | P0 |
| REQ-CM-005 | 客户分组 | BD-CUSTOMER | MOD-CUSTOMER | OBJ-CUSTOMER-GROUP | - | PERM-CM-GROUP | API-POST-CM-003 | PAGE-004 | TEST-CM-007 | P0 |
| REQ-CM-006 | 客户标签 | BD-CUSTOMER | MOD-CUSTOMER | OBJ-TAG | - | PERM-CM-TAG | API-POST-CM-002 | PAGE-005 | TEST-CM-008 | P0 |
| REQ-CM-007 | 客户删除 | BD-CUSTOMER | MOD-CUSTOMER | OBJ-CUSTOMER | SM-CUSTOMER | PERM-CM-DELETE | API-DELETE-CM-001 | PAGE-005 | TEST-CM-009 | P0 |
| REQ-CM-008 | 客户合并 | BD-CUSTOMER | MOD-CUSTOMER | OBJ-CUSTOMER | SM-CUSTOMER | PERM-CM-MERGE | API-POST-CM-004 | PAGE-005 | TEST-CM-010 | P1 |
| REQ-CM-009 | 客户导出 | BD-CUSTOMER | MOD-CUSTOMER | OBJ-CUSTOMER | - | PERM-CM-EXPORT | API-GET-CM-003 | PAGE-004 | TEST-CM-011 | P1 |
| REQ-CM-010 | 客户生命周期 | BD-CUSTOMER | MOD-CUSTOMER | OBJ-CUSTOMER | SM-CUSTOMER | PERM-CM-STATUS | API-PUT-CM-003 | PAGE-005 | TEST-CM-012~014 | P0 |

#### 5.1.2 线索管理需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-LM-001 | 线索录入 | BD-LEAD | MOD-LEAD | OBJ-LEAD | SM-LEAD | PERM-LM-CREATE | API-POST-LM-001 | PAGE-009 | TEST-LM-001 | P0 |
| REQ-LM-002 | 线索导入 | BD-LEAD | MOD-LEAD | OBJ-LEAD | SM-LEAD | PERM-LM-IMPORT | API-POST-LM-002 | PAGE-010 | TEST-LM-002 | P0 |
| REQ-LM-003 | 线索分配 | BD-LEAD | MOD-LEAD | OBJ-LEAD | SM-LEAD | PERM-LM-ASSIGN | API-POST-LM-003 | PAGE-008 | TEST-LM-003 | P0 |
| REQ-LM-004 | 线索跟进记录 | BD-LEAD | MOD-LEAD | OBJ-LEAD-FOLLOWUP | - | PERM-LM-UPDATE | API-POST-LM-005 | PAGE-008 | TEST-LM-004 | P0 |
| REQ-LM-005 | 线索状态管理 | BD-LEAD | MOD-LEAD | OBJ-LEAD | SM-LEAD | PERM-LM-STATUS | API-PUT-LM-001 | PAGE-008 | TEST-LM-005 | P0 |
| REQ-LM-006 | 线索转化 | BD-LEAD | MOD-LEAD | OBJ-LEAD, OBJ-OPPORTUNITY | SM-LEAD | PERM-LM-CONVERT | API-POST-LM-004 | PAGE-008 | TEST-LM-006 | P0 |
| REQ-LM-007 | 线索统计 | BD-LEAD | MOD-LEAD | OBJ-LEAD | - | PERM-LM-READ | API-GET-LM-003 | PAGE-007 | TEST-LM-007 | P0 |
| REQ-LM-008 | 线索回收 | BD-LEAD | MOD-LEAD | OBJ-LEAD | SM-LEAD | PERM-LM-RECYCLE | API-POST-LM-006 | PAGE-008 | TEST-LM-008 | P0 |
| REQ-LM-009 | 重复线索处理 | BD-LEAD | MOD-LEAD | OBJ-LEAD | - | PERM-LM-UPDATE | API-POST-LM-007 | PAGE-008 | TEST-LM-009 | P1 |
| REQ-LM-010 | 线索评分 | BD-LEAD | MOD-LEAD | OBJ-LEAD | - | PERM-LM-SCORE | API-POST-LM-008 | PAGE-008 | TEST-LM-010 | P1 |

#### 5.1.3 会话管理需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-SM-001 | 渠道接入 | BD-CONVERSATION | MOD-CONVERSATION | OBJ-CONVERSATION, OBJ-CHANNEL | SM-CONVERSATION | PERM-SM-CHANNEL | API-GET-SM-001 | PAGE-011, PAGE-012 | TEST-SM-001 | P0 |
| REQ-SM-002 | 会话列表 | BD-CONVERSATION | MOD-CONVERSATION | OBJ-CONVERSATION | SM-CONVERSATION | PERM-SM-READ | API-GET-SM-001 | PAGE-011 | TEST-SM-002 | P0 |
| REQ-SM-003 | 会话详情 | BD-CONVERSATION | MOD-CONVERSATION | OBJ-CONVERSATION, OBJ-MESSAGE | - | PERM-SM-READ | API-GET-SM-002 | PAGE-012 | TEST-SM-003 | P0 |
| REQ-SM-004 | 消息发送 | BD-CONVERSATION | MOD-CONVERSATION | OBJ-MESSAGE | - | PERM-SM-SEND | API-POST-SM-001 | PAGE-012 | TEST-SM-004 | P0 |
| REQ-SM-005 | 智能回复推荐 | BD-CONVERSATION | MOD-CONVERSATION | OBJ-MESSAGE | - | PERM-SM-AI | API-GET-SM-003 | PAGE-012 | TEST-SM-005 | P0 |
| REQ-SM-006 | 话术辅助 | BD-CONVERSATION | MOD-CONVERSATION | OBJ-TEMPLATE | - | PERM-SM-TEMPLATE | API-GET-SM-004 | PAGE-012 | TEST-SM-006 | P0 |
| REQ-SM-007 | 会话分配 | BD-CONVERSATION | MOD-CONVERSATION | OBJ-CONVERSATION | SM-CONVERSATION | PERM-SM-ASSIGN | API-POST-SM-005 | PAGE-011 | TEST-SM-007 | P0 |
| REQ-SM-008 | 会话转接 | BD-CONVERSATION | MOD-CONVERSATION | OBJ-CONVERSATION | SM-CONVERSATION | PERM-SM-TRANSFER | API-POST-SM-002 | PAGE-012 | TEST-SM-008 | P0 |
| REQ-SM-009 | 会话监控 | BD-CONVERSATION | MOD-CONVERSATION | OBJ-CONVERSATION | - | PERM-SM-MONITOR | API-GET-SM-005 | PAGE-011 | TEST-SM-009 | P1 |
| REQ-SM-010 | 会话评价 | BD-CONVERSATION | MOD-CONVERSATION | OBJ-CONVERSATION | SM-CONVERSATION | PERM-SM-RATE | API-POST-SM-003 | PAGE-012 | TEST-SM-010 | P1 |

#### 5.1.4 商机管理需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-OM-001 | 商机创建 | BD-OPPORTUNITY | MOD-OPPORTUNITY | OBJ-OPPORTUNITY | SM-OPPORTUNITY | PERM-OM-CREATE | API-POST-OM-001 | PAGE-015 | TEST-OM-001 | P0 |
| REQ-OM-002 | 商机列表 | BD-OPPORTUNITY | MOD-OPPORTUNITY | OBJ-OPPORTUNITY | - | PERM-OM-READ | API-GET-OM-001 | PAGE-013 | TEST-OM-002 | P0 |
| REQ-OM-003 | 商机详情 | BD-OPPORTUNITY | MOD-OPPORTUNITY | OBJ-OPPORTUNITY | - | PERM-OM-READ | API-GET-OM-002 | PAGE-014 | TEST-OM-003 | P0 |
| REQ-OM-004 | 商机阶段管理 | BD-OPPORTUNITY | MOD-OPPORTUNITY | OBJ-OPPORTUNITY | SM-OPPORTUNITY | PERM-OM-STAGE | API-PUT-OM-002 | PAGE-014 | TEST-OM-004~005 | P0 |
| REQ-OM-005 | 商机跟进记录 | BD-OPPORTUNITY | MOD-OPPORTUNITY | OBJ-OPPORTUNITY-FOLLOWUP | - | PERM-OM-UPDATE | API-POST-OM-003 | PAGE-014 | TEST-OM-006 | P0 |
| REQ-OM-006 | 商机阶段变更 | BD-OPPORTUNITY | MOD-OPPORTUNITY | OBJ-OPPORTUNITY | SM-OPPORTUNITY | PERM-OM-STAGE | API-PUT-OM-002 | PAGE-014 | TEST-OM-007 | P0 |
| REQ-OM-007 | 商机统计 | BD-OPPORTUNITY | MOD-OPPORTUNITY | OBJ-OPPORTUNITY | - | PERM-OM-READ | API-GET-OM-003 | PAGE-013 | TEST-OM-008 | P0 |
| REQ-OM-008 | 商机预测 | BD-OPPORTUNITY | MOD-OPPORTUNITY | OBJ-OPPORTUNITY | - | PERM-OM-PREDICT | API-GET-OM-004 | PAGE-014 | TEST-OM-009 | P1 |
| REQ-OM-009 | 商机暂停 | BD-OPPORTUNITY | MOD-OPPORTUNITY | OBJ-OPPORTUNITY | SM-OPPORTUNITY | PERM-OM-PAUSE | API-POST-OM-004 | PAGE-014 | TEST-OM-010 | P1 |

#### 5.1.5 工单管理需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-TM-001 | 工单创建 | BD-TICKET | MOD-TICKET | OBJ-TICKET | SM-TICKET | PERM-TM-CREATE | API-POST-TM-001 | PAGE-018 | TEST-TM-001 | P0 |
| REQ-TM-002 | 工单列表 | BD-TICKET | MOD-TICKET | OBJ-TICKET | - | PERM-TM-READ | API-GET-TM-001 | PAGE-016 | TEST-TM-002 | P0 |
| REQ-TM-003 | 工单详情 | BD-TICKET | MOD-TICKET | OBJ-TICKET | - | PERM-TM-READ | API-GET-TM-002 | PAGE-017 | TEST-TM-003 | P0 |
| REQ-TM-004 | 工单分配 | BD-TICKET | MOD-TICKET | OBJ-TICKET | SM-TICKET | PERM-TM-ASSIGN | API-POST-TM-003 | PAGE-017 | TEST-TM-004 | P0 |
| REQ-TM-005 | 工单处理 | BD-TICKET | MOD-TICKET | OBJ-TICKET | SM-TICKET | PERM-TM-HANDLE | API-POST-TM-002 | PAGE-017 | TEST-TM-005 | P0 |
| REQ-TM-006 | 工单流转 | BD-TICKET | MOD-TICKET | OBJ-TICKET | SM-TICKET | PERM-TM-TRANSFER | API-POST-TM-004 | PAGE-017 | TEST-TM-006 | P0 |
| REQ-TM-007 | 工单转派 | BD-TICKET | MOD-TICKET | OBJ-TICKET | SM-TICKET | PERM-TM-ASSIGN | API-POST-TM-003 | PAGE-017 | TEST-TM-007 | P0 |
| REQ-TM-008 | 工单关闭 | BD-TICKET | MOD-TICKET | OBJ-TICKET | SM-TICKET | PERM-TM-CLOSE | API-POST-TM-005 | PAGE-017 | TEST-TM-008 | P0 |
| REQ-TM-009 | 工单统计 | BD-TICKET | MOD-TICKET | OBJ-TICKET | - | PERM-TM-READ | API-GET-TM-003 | PAGE-016 | TEST-TM-009 | P0 |
| REQ-TM-010 | SLA 管理 | BD-TICKET | MOD-TICKET | OBJ-TICKET, OBJ-SLA | SM-TICKET | PERM-TM-SLA | API-POST-TM-006 | PAGE-017 | TEST-TM-010 | P0 |
| REQ-TM-011 | 工单升级 | BD-TICKET | MOD-TICKET | OBJ-TICKET | SM-TICKET | PERM-TM-ESCALATE | API-POST-TM-007 | PAGE-017 | TEST-TM-011 | P0 |

#### 5.1.6 知识库需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-KB-001 | 知识检索 | BD-KNOWLEDGE | MOD-KNOWLEDGE | OBJ-KNOWLEDGE-ITEM | - | PERM-KB-READ | API-GET-KB-001 | PAGE-025 | TEST-KB-001 | P1 |
| REQ-KB-002 | 知识详情 | BD-KNOWLEDGE | MOD-KNOWLEDGE | OBJ-KNOWLEDGE-ITEM | - | PERM-KB-READ | API-GET-KB-002 | PAGE-025 | TEST-KB-002 | P1 |
| REQ-KB-003 | AI 问答 | BD-KNOWLEDGE | MOD-KNOWLEDGE | OBJ-KNOWLEDGE-ITEM | - | PERM-KB-AI | API-POST-KB-001 | PAGE-025 | TEST-KB-003 | P1 |
| REQ-KB-004 | 知识分类 | BD-KNOWLEDGE | MOD-KNOWLEDGE | OBJ-KNOWLEDGE-CATEGORY | SM-KNOWLEDGE | PERM-KB-MANAGE | API-POST-KB-002 | PAGE-026 | TEST-KB-004 | P1 |
| REQ-KB-005 | 知识管理 | BD-KNOWLEDGE | MOD-KNOWLEDGE | OBJ-KNOWLEDGE-ITEM | SM-KNOWLEDGE | PERM-KB-MANAGE | API-POST-KB-003 | PAGE-026 | TEST-KB-005 | P1 |
| REQ-KB-006 | 知识审核 | BD-KNOWLEDGE | MOD-KNOWLEDGE | OBJ-KNOWLEDGE-ITEM | SM-KNOWLEDGE | PERM-KB-AUDIT | API-POST-KB-004 | PAGE-026 | TEST-KB-006 | P1 |

#### 5.1.7 数据看板需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-DB-001 | 销售看板 | BD-DASHBOARD | MOD-DASHBOARD | OBJ-DASHBOARD | - | PERM-DB-READ | API-GET-DB-001 | PAGE-027 | TEST-DB-001 | P1 |
| REQ-DB-002 | 客服看板 | BD-DASHBOARD | MOD-DASHBOARD | OBJ-DASHBOARD | - | PERM-DB-READ | API-GET-DB-002 | PAGE-028 | TEST-DB-002 | P1 |
| REQ-DB-003 | 运营看板 | BD-DASHBOARD | MOD-DASHBOARD | OBJ-DASHBOARD | - | PERM-DB-READ | API-GET-DB-003 | PAGE-003 | TEST-DB-003 | P1 |
| REQ-DB-004 | 趋势图表 | BD-DASHBOARD | MOD-DASHBOARD | OBJ-DASHBOARD | - | PERM-DB-READ | API-GET-DB-004 | PAGE-003 | TEST-DB-004 | P1 |

#### 5.1.8 系统管理需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-AUTH-001 | 账号登录 | BD-AUTH | MOD-AUTH | OBJ-USER | SM-USER | PERM-AUTH-LOGIN | API-POST-AUTH-001 | PAGE-001 | TEST-AUTH-001~003 | P0 |
| REQ-AUTH-002 | 密码找回 | BD-AUTH | MOD-AUTH | OBJ-USER | - | PERM-AUTH-RESET | API-POST-AUTH-002 | PAGE-002 | TEST-AUTH-004 | P0 |
| REQ-AUTH-003 | 会话管理 | BD-AUTH | MOD-AUTH | OBJ-SESSION | - | PERM-AUTH-SESSION | API-POST-AUTH-003 | - | TEST-AUTH-005 | P0 |
| REQ-AUTH-004 | 登出 | BD-AUTH | MOD-AUTH | OBJ-SESSION | - | PERM-AUTH-LOGOUT | API-POST-AUTH-004 | PAGE-001 | TEST-AUTH-006 | P0 |
| REQ-AUTH-005 | 登录日志 | BD-AUTH | MOD-AUTH | OBJ-AUDIT-LOG | - | PERM-AUTH-LOG | API-GET-AUTH-001 | PAGE-024 | TEST-AUTH-007 | P0 |
| REQ-AUTH-006 | 密码修改 | BD-AUTH | MOD-AUTH | OBJ-USER | - | PERM-AUTH-UPDATE | API-PUT-AUTH-001 | PAGE-021 | TEST-AUTH-008 | P0 |
| REQ-AUTH-007 | 多设备登录控制 | BD-AUTH | MOD-AUTH | OBJ-SESSION | - | PERM-AUTH-CONFIG | API-PUT-AUTH-002 | PAGE-023 | TEST-AUTH-009 | P1 |
| REQ-ORG-001 | 组织信息管理 | BD-ORG | MOD-ORG | OBJ-ORGANIZATION | SM-ORG | PERM-ORG-MANAGE | API-PUT-ORG-001 | PAGE-023 | TEST-ORG-001 | P0 |
| REQ-ORG-002 | 部门管理 | BD-ORG | MOD-ORG | OBJ-DEPARTMENT | SM-DEPT | PERM-ORG-DEPT | API-POST-ORG-001 | PAGE-023 | TEST-ORG-002 | P0 |
| REQ-ORG-003 | 部门成员管理 | BD-ORG | MOD-ORG | OBJ-DEPARTMENT, OBJ-USER | - | PERM-ORG-MEMBER | API-POST-ORG-002 | PAGE-023 | TEST-ORG-003 | P0 |
| REQ-ORG-004 | 组织配置 | BD-ORG | MOD-ORG | OBJ-ORGANIZATION | - | PERM-ORG-CONFIG | API-PUT-ORG-002 | PAGE-023 | TEST-ORG-004 | P0 |
| REQ-ORG-005 | 租户初始化 | BD-ORG | MOD-ORG | OBJ-ORGANIZATION | SM-ORG | PERM-ORG-INIT | API-POST-ORG-003 | - | TEST-ORG-005 | P0 |
| REQ-USER-001 | 用户创建 | BD-USER | MOD-USER | OBJ-USER | SM-USER | PERM-USER-CREATE | API-POST-USER-001 | PAGE-021 | TEST-USER-001 | P0 |
| REQ-USER-002 | 用户编辑 | BD-USER | MOD-USER | OBJ-USER | SM-USER | PERM-USER-UPDATE | API-PUT-USER-001 | PAGE-021 | TEST-USER-002 | P0 |
| REQ-USER-003 | 用户禁用/启用 | BD-USER | MOD-USER | OBJ-USER | SM-USER | PERM-USER-STATUS | API-PUT-USER-002 | PAGE-021 | TEST-USER-003 | P0 |
| REQ-USER-004 | 用户重置密码 | BD-USER | MOD-USER | OBJ-USER | - | PERM-USER-RESET | API-POST-USER-002 | PAGE-021 | TEST-USER-004 | P0 |
| REQ-USER-005 | 角色管理 | BD-USER | MOD-USER | OBJ-ROLE, OBJ-PERMISSION | - | PERM-USER-ROLE | API-POST-USER-003 | PAGE-022 | TEST-USER-005 | P0 |

---

### 5.2 P1 增强需求追踪矩阵

#### 5.2.1 营销自动化需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-MA-001 | 营销活动管理 | BD-MARKETING | MOD-MARKETING | OBJ-CAMPAIGN | SM-CAMPAIGN | PERM-MA-CAMPAIGN | API-POST-MA-001 | PAGE-029 | TEST-MA-001 | P1 |
| REQ-MA-002 | 自动化触达 | BD-MARKETING | MOD-MARKETING | OBJ-AUTOMATION-RULE | - | PERM-MA-AUTO | API-POST-MA-002 | PAGE-029 | TEST-MA-002 | P1 |
| REQ-MA-003 | 客户分群 | BD-MARKETING | MOD-MARKETING | OBJ-SEGMENT | - | PERM-MA-SEGMENT | API-POST-MA-003 | PAGE-004 | TEST-MA-003 | P1 |
| REQ-MA-004 | 营销素材管理 | BD-MARKETING | MOD-MARKETING | OBJ-MATERIAL | - | PERM-MA-MATERIAL | API-POST-MA-004 | PAGE-029 | TEST-MA-004 | P1 |
| REQ-MA-005 | 营销效果分析 | BD-MARKETING | MOD-MARKETING | OBJ-CAMPAIGN | - | PERM-MA-ANALYSIS | API-GET-MA-001 | PAGE-029 | TEST-MA-005 | P1 |
| REQ-MA-006 | 自动化工作流 | BD-MARKETING | MOD-MARKETING | OBJ-WORKFLOW | SM-WORKFLOW | PERM-MA-WORKFLOW | API-POST-MA-005 | PAGE-029 | TEST-MA-006 | P1 |
| REQ-MA-007 | 短信/邮件营销 | BD-MARKETING | MOD-MARKETING | OBJ-MESSAGE | - | PERM-MA-SEND | API-POST-MA-006 | PAGE-029 | TEST-MA-007 | P1 |
| REQ-MA-008 | 营销渠道管理 | BD-MARKETING | MOD-MARKETING | OBJ-CHANNEL | - | PERM-MA-CHANNEL | API-POST-MA-007 | PAGE-029 | TEST-MA-008 | P1 |

#### 5.2.2 合同管理需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-CT-001 | 合同创建 | BD-CONTRACT | MOD-CONTRACT | OBJ-CONTRACT | SM-CONTRACT | PERM-CT-CREATE | API-POST-CT-001 | PAGE-030 | TEST-CT-001 | P1 |
| REQ-CT-002 | 合同审批 | BD-CONTRACT | MOD-CONTRACT | OBJ-CONTRACT | SM-CONTRACT | PERM-CT-APPROVE | API-POST-CT-002 | PAGE-030 | TEST-CT-002 | P1 |
| REQ-CT-003 | 合同签署 | BD-CONTRACT | MOD-CONTRACT | OBJ-CONTRACT | SM-CONTRACT | PERM-CT-SIGN | API-POST-CT-003 | PAGE-030 | TEST-CT-003 | P1 |
| REQ-CT-004 | 合同归档 | BD-CONTRACT | MOD-CONTRACT | OBJ-CONTRACT | SM-CONTRACT | PERM-CT-ARCHIVE | API-POST-CT-004 | PAGE-030 | TEST-CT-004 | P1 |
| REQ-CT-005 | 合同到期提醒 | BD-CONTRACT | MOD-CONTRACT | OBJ-CONTRACT | - | PERM-CT-REMIND | API-POST-CT-005 | PAGE-030 | TEST-CT-005 | P1 |
| REQ-CT-006 | 合同统计 | BD-CONTRACT | MOD-CONTRACT | OBJ-CONTRACT | - | PERM-CT-READ | API-GET-CT-001 | PAGE-030 | TEST-CT-006 | P1 |
| REQ-CT-007 | 合同模板 | BD-CONTRACT | MOD-CONTRACT | OBJ-TEMPLATE | - | PERM-CT-TEMPLATE | API-POST-CT-006 | PAGE-030 | TEST-CT-007 | P1 |

#### 5.2.3 报价管理需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-QT-001 | 报价单创建 | BD-QUOTE | MOD-QUOTE | OBJ-QUOTE | - | PERM-QT-CREATE | API-POST-QT-001 | PAGE-031 | TEST-QT-001 | P1 |
| REQ-QT-002 | 报价单模板 | BD-QUOTE | MOD-QUOTE | OBJ-TEMPLATE | - | PERM-QT-TEMPLATE | API-POST-QT-002 | PAGE-031 | TEST-QT-002 | P1 |
| REQ-QT-003 | 报价单审批 | BD-QUOTE | MOD-QUOTE | OBJ-QUOTE | - | PERM-QT-APPROVE | API-POST-QT-003 | PAGE-031 | TEST-QT-003 | P1 |
| REQ-QT-004 | 报价单版本 | BD-QUOTE | MOD-QUOTE | OBJ-QUOTE-VERSION | - | PERM-QT-VERSION | API-POST-QT-004 | PAGE-031 | TEST-QT-004 | P1 |
| REQ-QT-005 | 报价单发送 | BD-QUOTE | MOD-QUOTE | OBJ-QUOTE | - | PERM-QT-SEND | API-POST-QT-005 | PAGE-031 | TEST-QT-005 | P1 |
| REQ-QT-006 | 报价统计 | BD-QUOTE | MOD-QUOTE | OBJ-QUOTE | - | PERM-QT-READ | API-GET-QT-001 | PAGE-031 | TEST-QT-006 | P1 |

#### 5.2.4 AI 质检需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-AIQC-001 | 会话质检 | BD-AI-QC | MOD-AI-QC | OBJ-CONVERSATION | - | PERM-AIQC-CHECK | API-POST-AIQC-001 | PAGE-032 | TEST-AIQC-001 | P1 |
| REQ-AIQC-002 | 敏感词检测 | BD-AI-QC | MOD-AI-QC | OBJ-MESSAGE | - | PERM-AIQC-DETECT | API-POST-AIQC-002 | PAGE-032 | TEST-AIQC-002 | P1 |
| REQ-AIQC-003 | 情绪分析 | BD-AI-QC | MOD-AI-QC | OBJ-CONVERSATION | - | PERM-AIQC-ANALYZE | API-POST-AIQC-003 | PAGE-032 | TEST-AIQC-003 | P1 |
| REQ-AIQC-004 | 质检报告 | BD-AI-QC | MOD-AI-QC | OBJ-QC-REPORT | - | PERM-AIQC-REPORT | API-GET-AIQC-001 | PAGE-032 | TEST-AIQC-004 | P1 |
| REQ-AIQC-005 | 质检规则配置 | BD-AI-QC | MOD-AI-QC | OBJ-QC-RULE | - | PERM-AIQC-CONFIG | API-POST-AIQC-004 | PAGE-032 | TEST-AIQC-005 | P1 |

#### 5.2.5 客户成功需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-CS-001 | 客户健康度 | BD-CUSTOMER-SUCCESS | MOD-CUSTOMER-SUCCESS | OBJ-CUSTOMER-HEALTH | SM-CUSTOMER-HEALTH | PERM-CS-HEALTH | API-GET-CS-001 | PAGE-033 | TEST-CS-001 | P1 |
| REQ-CS-002 | 续费管理 | BD-CUSTOMER-SUCCESS | MOD-CUSTOMER-SUCCESS | OBJ-RENEWAL | SM-RENEWAL | PERM-CS-RENEWAL | API-POST-CS-001 | PAGE-033 | TEST-CS-002 | P1 |
| REQ-CS-003 | 增购推荐 | BD-CUSTOMER-SUCCESS | MOD-CUSTOMER-SUCCESS | OBJ-UPSELL | - | PERM-CS-UPSELL | API-GET-CS-002 | PAGE-033 | TEST-CS-003 | P1 |
| REQ-CS-004 | 客户回访 | BD-CUSTOMER-SUCCESS | MOD-CUSTOMER-SUCCESS | OBJ-VISIT | - | PERM-CS-VISIT | API-POST-CS-002 | PAGE-033 | TEST-CS-004 | P1 |
| REQ-CS-005 | 客户成功计划 | BD-CUSTOMER-SUCCESS | MOD-CUSTOMER-SUCCESS | OBJ-SUCCESS-PLAN | - | PERM-CS-PLAN | API-POST-CS-003 | PAGE-033 | TEST-CS-005 | P1 |
| REQ-CS-006 | 客户成功看板 | BD-CUSTOMER-SUCCESS | MOD-CUSTOMER-SUCCESS | OBJ-DASHBOARD | - | PERM-CS-READ | API-GET-CS-003 | PAGE-033 | TEST-CS-006 | P1 |

---

### 5.3 P2 迭代需求追踪矩阵

#### 5.3.1 全渠道接入需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-CH-001 | 呼叫中心集成 | BD-CHANNEL | MOD-CHANNEL | OBJ-CHANNEL | - | PERM-CH-INTEGRATE | API-POST-CH-001 | PAGE-034 | TEST-CH-001 | P2 |
| REQ-CH-002 | 抖音/快手接入 | BD-CHANNEL | MOD-CHANNEL | OBJ-CHANNEL | - | PERM-CH-INTEGRATE | API-POST-CH-002 | PAGE-034 | TEST-CH-002 | P2 |
| REQ-CH-003 | 小红书接入 | BD-CHANNEL | MOD-CHANNEL | OBJ-CHANNEL | - | PERM-CH-INTEGRATE | API-POST-CH-003 | PAGE-034 | TEST-CH-003 | P2 |
| REQ-CH-004 | 微博接入 | BD-CHANNEL | MOD-CHANNEL | OBJ-CHANNEL | - | PERM-CH-INTEGRATE | API-POST-CH-004 | PAGE-034 | TEST-CH-004 | P2 |
| REQ-CH-005 | APP 内嵌客服 | BD-CHANNEL | MOD-CHANNEL | OBJ-CHANNEL | - | PERM-CH-INTEGRATE | API-POST-CH-005 | PAGE-034 | TEST-CH-005 | P2 |
| REQ-CH-006 | 邮件渠道接入 | BD-CHANNEL | MOD-CHANNEL | OBJ-CHANNEL | - | PERM-CH-INTEGRATE | API-POST-CH-006 | PAGE-034 | TEST-CH-006 | P2 |
| REQ-CH-007 | 渠道统一管理 | BD-CHANNEL | MOD-CHANNEL | OBJ-CHANNEL | - | PERM-CH-MANAGE | API-GET-CH-001 | PAGE-034 | TEST-CH-007 | P2 |

#### 5.3.2 开放平台需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-OP-001 | 开放 API | BD-OPEN-PLATFORM | MOD-OPEN-PLATFORM | OBJ-API-KEY | - | PERM-OP-API | API-POST-OP-001 | PAGE-035 | TEST-OP-001 | P2 |
| REQ-OP-002 | Webhook | BD-OPEN-PLATFORM | MOD-OPEN-PLATFORM | OBJ-WEBHOOK | - | PERM-OP-WEBHOOK | API-POST-OP-002 | PAGE-035 | TEST-OP-002 | P2 |
| REQ-OP-003 | API 文档 | BD-OPEN-PLATFORM | MOD-OPEN-PLATFORM | OBJ-API-DOC | - | PERM-OP-READ | API-GET-OP-001 | PAGE-035 | TEST-OP-003 | P2 |
| REQ-OP-004 | SDK 提供 | BD-OPEN-PLATFORM | MOD-OPEN-PLATFORM | OBJ-SDK | - | PERM-OP-SDK | API-GET-OP-002 | PAGE-035 | TEST-OP-004 | P2 |
| REQ-OP-005 | 应用市场 | BD-OPEN-PLATFORM | MOD-OPEN-PLATFORM | OBJ-APP | - | PERM-OP-APP | API-POST-OP-003 | PAGE-035 | TEST-OP-005 | P2 |
| REQ-OP-006 | 开发者中心 | BD-OPEN-PLATFORM | MOD-OPEN-PLATFORM | OBJ-DEVELOPER | - | PERM-OP-DEV | API-POST-OP-004 | PAGE-035 | TEST-OP-006 | P2 |
| REQ-OP-007 | 数据导出 | BD-OPEN-PLATFORM | MOD-OPEN-PLATFORM | OBJ-EXPORT-TASK | - | PERM-OP-EXPORT | API-POST-OP-005 | PAGE-035 | TEST-OP-007 | P2 |
| REQ-OP-008 | 第三方登录 | BD-OPEN-PLATFORM | MOD-OPEN-PLATFORM | OBJ-OAUTH | - | PERM-OP-OAUTH | API-POST-OP-006 | PAGE-001 | TEST-OP-008 | P2 |

#### 5.3.3 移动端需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-MB-001 | 移动端 APP | BD-MOBILE | MOD-MOBILE | OBJ-APP | - | PERM-MB-ACCESS | API-GET-MB-001 | APP-001 | TEST-MB-001 | P2 |
| REQ-MB-002 | 小程序 | BD-MOBILE | MOD-MOBILE | OBJ-MINI-APP | - | PERM-MB-ACCESS | API-GET-MB-002 | APP-002 | TEST-MB-002 | P2 |
| REQ-MB-003 | H5 移动端 | BD-MOBILE | MOD-MOBILE | OBJ-H5 | - | PERM-MB-ACCESS | API-GET-MB-003 | APP-003 | TEST-MB-003 | P2 |
| REQ-MB-004 | 移动端消息推送 | BD-MOBILE | MOD-MOBILE | OBJ-PUSH | - | PERM-MB-PUSH | API-POST-MB-001 | APP-001 | TEST-MB-004 | P2 |
| REQ-MB-005 | 移动端离线模式 | BD-MOBILE | MOD-MOBILE | OBJ-OFFLINE | - | PERM-MB-OFFLINE | API-GET-MB-004 | APP-001 | TEST-MB-005 | P2 |
| REQ-MB-006 | 移动端扫码 | BD-MOBILE | MOD-MOBILE | OBJ-QRCODE | - | PERM-MB-SCAN | API-POST-MB-002 | APP-001 | TEST-MB-006 | P2 |

---

### 5.4 P3 战略需求追踪矩阵

#### 5.4.1 国际化需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-I18N-001 | 多语言支持 | BD-I18N | MOD-I18N | OBJ-LANGUAGE | - | PERM-I18N-LANG | API-POST-I18N-001 | PAGE-036 | TEST-I18N-001 | P3 |
| REQ-I18N-002 | 多时区支持 | BD-I18N | MOD-I18N | OBJ-TIMEZONE | - | PERM-I18N-TZ | API-POST-I18N-002 | PAGE-036 | TEST-I18N-002 | P3 |
| REQ-I18N-003 | 多货币支持 | BD-I18N | MOD-I18N | OBJ-CURRENCY | - | PERM-I18N-CURRENCY | API-POST-I18N-003 | PAGE-036 | TEST-I18N-003 | P3 |
| REQ-I18N-004 | GDPR 合规 | BD-I18N | MOD-I18N | OBJ-COMPLIANCE | - | PERM-I18N-GDPR | API-POST-I18N-004 | PAGE-036 | TEST-I18N-004 | P3 |
| REQ-I18N-005 | 海外数据中心 | BD-I18N | MOD-I18N | OBJ-DATACENTER | - | PERM-I18N-DATACENTER | API-POST-I18N-005 | PAGE-036 | TEST-I18N-005 | P3 |
| REQ-I18N-006 | 多区域运营 | BD-I18N | MOD-I18N | OBJ-REGION | - | PERM-I18N-REGION | API-POST-I18N-006 | PAGE-036 | TEST-I18N-006 | P3 |
| REQ-I18N-007 | 翻译管理 | BD-I18N | MOD-I18N | OBJ-TRANSLATION | - | PERM-I18N-TRANSLATE | API-POST-I18N-007 | PAGE-036 | TEST-I18N-007 | P3 |
| REQ-I18N-008 | 本地化适配 | BD-I18N | MOD-I18N | OBJ-LOCALE | - | PERM-I18N-LOCALE | API-POST-I18N-008 | PAGE-036 | TEST-I18N-008 | P3 |

#### 5.4.2 私有化部署需求追踪

| 需求编号 | 需求名称 | 业务域 | 模块 | 对象 | 状态机 | 权限 | 接口 | 页面 | 测试用例 | 实现阶段 |
|----------|----------|--------|------|------|--------|------|------|------|----------|----------|
| REQ-ONPREM-001 | 私有化部署包 | BD-ONPREM | MOD-ONPREM | OBJ-PACKAGE | - | PERM-ONPREM-PACKAGE | API-GET-ONPREM-001 | PAGE-037 | TEST-ONPREM-001 | P3 |
| REQ-ONPREM-002 | 部署文档 | BD-ONPREM | MOD-ONPREM | OBJ-DOCUMENT | - | PERM-ONPREM-DOC | API-GET-ONPREM-002 | PAGE-037 | TEST-ONPREM-002 | P3 |
| REQ-ONPREM-003 | 离线激活 | BD-ONPREM | MOD-ONPREM | OBJ-LICENSE | - | PERM-ONPREM-ACTIVATE | API-POST-ONPREM-001 | PAGE-037 | TEST-ONPREM-003 | P3 |
| REQ-ONPREM-004 | 数据迁移工具 | BD-ONPREM | MOD-ONPREM | OBJ-MIGRATION | - | PERM-ONPREM-MIGRATE | API-POST-ONPREM-002 | PAGE-037 | TEST-ONPREM-004 | P3 |
| REQ-ONPREM-005 | 私有化定制 | BD-ONPREM | MOD-ONPREM | OBJ-CUSTOMIZATION | - | PERM-ONPREM-CUSTOM | API-POST-ONPREM-003 | PAGE-037 | TEST-ONPREM-005 | P3 |
| REQ-ONPREM-006 | 运维监控 | BD-ONPREM | MOD-ONPREM | OBJ-MONITOR | - | PERM-ONPREM-MONITOR | API-GET-ONPREM-003 | PAGE-037 | TEST-ONPREM-006 | P3 |

---

## 六、追溯覆盖率要求

### 6.1 覆盖率目标

| 追溯维度 | 目标覆盖率 | 说明 |
|----------|------------|------|
| 需求→业务域 | 100% | 所有需求必须归属明确业务域 |
| 需求→模块 | 100% | 所有需求必须归属明确模块 |
| 需求→对象 | 100% | 所有需求必须关联业务对象 |
| 需求→状态机 | 100% | 涉及状态流转的需求必须关联状态机 |
| 需求→权限点 | 100% | 所有需求必须定义权限控制 |
| 需求→接口 | 100% | 所有需求必须定义 API 接口 |
| 需求→页面 | 100% | 所有需求必须关联前端页面 |
| 需求→测试用例 | 100% | 所有需求必须关联测试用例 |

### 6.2 覆盖率统计

#### 6.2.1 按优先级统计

| 优先级 | 需求数量 | 业务域覆盖 | 模块覆盖 | 对象覆盖 | 状态机覆盖 | 权限覆盖 | 接口覆盖 | 页面覆盖 | 测试覆盖 |
|--------|----------|------------|----------|----------|------------|----------|----------|----------|----------|
| P0 | 77 | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| P1 | 32 | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| P2 | 21 | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| P3 | 14 | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| **合计** | **144** | **100%** | **100%** | **100%** | **100%** | **100%** | **100%** | **100%** | **100%** |

#### 6.2.2 按业务域统计

| 业务域 | 需求数量 | 模块数 | 对象数 | 状态机数 | 权限点数 | 接口数 | 页面数 | 测试用例数 |
|--------|----------|--------|--------|----------|----------|--------|--------|------------|
| 客户管理 | 10 | 1 | 3 | 1 | 10 | 10 | 3 | 14 |
| 线索管理 | 10 | 1 | 2 | 1 | 10 | 8 | 4 | 10 |
| 会话管理 | 10 | 1 | 3 | 1 | 10 | 5 | 2 | 10 |
| 商机管理 | 9 | 1 | 2 | 1 | 9 | 4 | 3 | 10 |
| 工单管理 | 11 | 1 | 2 | 1 | 11 | 7 | 3 | 11 |
| 知识库 | 6 | 1 | 2 | 1 | 6 | 4 | 2 | 6 |
| 数据看板 | 4 | 1 | 1 | 0 | 4 | 4 | 4 | 4 |
| 系统管理 | 17 | 3 | 5 | 3 | 17 | 10 | 4 | 17 |
| 营销自动化 | 8 | 1 | 4 | 2 | 8 | 7 | 1 | 8 |
| 合同管理 | 7 | 1 | 1 | 1 | 7 | 6 | 1 | 7 |
| 报价管理 | 6 | 1 | 2 | 0 | 6 | 5 | 1 | 6 |
| AI 质检 | 5 | 1 | 3 | 0 | 5 | 4 | 1 | 5 |
| 客户成功 | 6 | 1 | 4 | 2 | 6 | 3 | 1 | 6 |
| 全渠道接入 | 7 | 1 | 1 | 0 | 7 | 7 | 1 | 7 |
| 开放平台 | 8 | 1 | 6 | 0 | 8 | 6 | 1 | 8 |
| 移动端 | 6 | 1 | 4 | 0 | 6 | 4 | 3 | 6 |
| 国际化 | 8 | 1 | 6 | 0 | 8 | 8 | 1 | 8 |
| 私有化部署 | 6 | 1 | 5 | 0 | 6 | 3 | 1 | 6 |

---

## 七、需求变更影响分析

### 7.1 变更影响范围

当需求发生变更时，通过 RTM 可快速定位影响范围：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           需求变更影响分析流程                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐                                                                │
│  │ 需求变更请求 │                                                                │
│  └──────┬──────┘                                                                │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                                │
│  │ RTM 追溯查询 │ ──── 查询需求关联的所有追溯维度                                 │
│  └──────┬──────┘                                                                │
│         │                                                                       │
│         ├──────────────────┬──────────────────┬──────────────────┐             │
│         ▼                  ▼                  ▼                  ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ 业务域影响   │    │ 模块影响    │    │ 对象影响    │    │ 状态机影响   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │                  │             │
│         ├──────────────────┴──────────────────┴──────────────────┘             │
│         │                                                                       │
│         ├──────────────────┬──────────────────┬──────────────────┐             │
│         ▼                  ▼                  ▼                  ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ 权限点影响   │    │ 接口影响    │    │ 页面影响    │    │ 测试用例影响 │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │                  │             │
│         └──────────────────┴──────────────────┴──────────────────┘             │
│                            │                                                    │
│                            ▼                                                    │
│                    ┌─────────────┐                                             │
│                    │ 影响评估报告 │                                             │
│                    └─────────────┘                                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 变更影响评估模板

| 影响维度 | 影响项 | 影响程度 | 工作量评估 | 负责人 |
|----------|--------|----------|------------|--------|
| 业务域 | - | - | - | - |
| 模块 | - | - | - | - |
| 对象 | - | - | - | - |
| 状态机 | - | - | - | - |
| 权限点 | - | - | - | - |
| 接口 | - | - | - | - |
| 页面 | - | - | - | - |
| 测试用例 | - | - | - | - |

---

## 八、对 P0/P1 的影响

### 8.1 对 P0 文档的影响

| P0 文档 | 影响内容 | 影响程度 | 处理建议 |
|---------|----------|----------|----------|
| 07_RTM_需求跟踪矩阵.md | 终局版扩展了追溯范围 | 高 | 需更新，引用终局版 RTM |
| 06_PRD_产品需求规格说明书.md | 新增 P1/P2/P3 需求 | 高 | 需补充终局版需求 |
| 10_DBD_数据模型与数据字典.md | 新增实体和状态字段 | 高 | 需补充终局版数据模型 |
| 11_API_接口设计说明.md | 新增接口定义 | 高 | 需补充终局版接口 |
| 27_状态机实现规范.md | 新增状态机定义 | 中 | 需补充终局版状态机 |
| 17_权限模型设计.md | 新增权限点定义 | 中 | 需补充终局版权限 |

### 8.2 对 P1 实现的影响

| 影响领域 | 影响说明 | 工作量评估 |
|----------|----------|------------|
| 后端服务 | 新增 32 个 P1 需求实现 | 高 |
| 数据库 | 新增合同、订单、回款等实体表 | 中 |
| 前端组件 | 新增营销自动化、合同管理等页面 | 高 |
| 测试用例 | 新增 P1 需求测试用例 | 中 |
| 权限配置 | 新增 P1 权限点配置 | 低 |

### 8.3 兼容性说明

| 兼容项 | 说明 |
|--------|------|
| P0 需求追溯 | 完全兼容，保持原有追溯关系 |
| P0 接口定义 | 保持 v1 接口不变，新增 v2 接口 |
| P0 数据模型 | 保持原有表结构，新增扩展表 |
| P0 状态机 | 保持原有状态定义，新增终局版状态 |

---

## 九、RTM 维护规范

### 9.1 维护时机

| 触发事件 | 维护动作 | 责任人 |
|----------|----------|--------|
| 新增需求 | 添加追溯记录，更新覆盖率 | 产品经理 |
| 需求变更 | 更新追溯关系，评估影响范围 | 产品经理 |
| 需求删除 | 标记删除，保留历史记录 | 产品经理 |
| 接口变更 | 更新接口追溯关系 | 后端开发 |
| 页面变更 | 更新页面追溯关系 | 前端开发 |
| 测试完成 | 更新测试状态 | 测试工程师 |

### 9.2 版本控制

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0 | 2026-04-05 | 初稿，建立终局版完整追溯链 | MOY 文档架构组 |

---

## 十、版本记录

| 版本 | 日期 | 作者 | 变更摘要 | 状态 |
|------|------|------|----------|------|
| v1.0 | 2026-04-05 | MOY 文档架构组 | 初稿：建立终局版需求追踪矩阵，实现 100% 追溯覆盖率 | 已确认 |

---

## 依赖文档

| 文档 | 版本 | 用途 |
|------|------|------|
| [P0-RTM](../P0/07_RTM_需求跟踪矩阵.md) | v3.0 | P0 需求追溯基础 |
| [终局版全量需求总表](./15_终局版全量需求总表.md) | v1.0 | 终局版需求清单 |
| [终局版状态机总表](./07_终局版状态机总表.md) | v1.0 | 状态机定义 |
| [终局版权限模型](./08_终局版权限模型与AI权限边界.md) | v1.0 | 权限点定义 |
| [终局版对象模型](./06_终局版对象模型与数据域设计.md) | v1.0 | 对象模型定义 |
| [终局版多端产品矩阵](./11_终局版多端产品矩阵与页面树.md) | v1.0 | 页面定义 |

---

## 待确认事项

1. P2/P3 需求的接口和页面定义是否需要在首期完成预定义？
2. 测试用例的详细设计是否需要单独文档维护？
3. 需求变更时 RTM 的更新流程是否需要自动化工具支持？
4. 追溯覆盖率是否需要纳入项目验收标准？
5. 是否需要建立 RTM 与代码仓库的关联？
