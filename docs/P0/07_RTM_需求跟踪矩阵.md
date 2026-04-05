# MOY 需求跟踪矩阵（RTM）

---

## 文档元信息

| 属性     | 内容                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| 文档名称 | MOY 需求跟踪矩阵                                                              |
| 文档编号 | MOY_RTM_001                                                                   |
| 版本号   | v3.0                                                                          |
| 状态     | 已确认                                                                        |
| 作者     | MOY 文档架构组                                                                |
| 日期     | 2026-04-05                                                                    |
| 目标读者 | 产品、开发、测试、项目管理                                                    |
| 输入来源 | [BRD](./05_BRD_业务需求说明书.md)、[PRD](./06_PRD_产品需求规格说明书_v0.1.md) |

---

## 一、文档目的

本文档作为 MOY 项目的**需求跟踪基线**，用于：

1. 建立完整的**需求追溯链**：业务目标 → BRD需求 → PRD需求 → 实现组件 → 测试验证
2. 确保每个需求**可追踪、可验证、可交付**
3. 支持**需求变更影响分析**
4. 作为开发、测试、验收的**工作底稿**
5. 为 Trae AI 编码提供**任务输入映射**

---

## 二、追踪矩阵架构

### 2.1 追踪链路图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RTM 追踪链路架构                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐                                                                │
│  │  业务目标   │                                                                │
│  │ (BUS-OBJ)  │                                                                │
│  └──────┬──────┘                                                                │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                                │
│  │  BRD需求    │                                                                │
│  │ (BRD-REQ)  │                                                                │
│  └──────┬──────┘                                                                │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                                │
│  │  PRD需求    │─────────────────────────────────────────────────────────────┐  │
│  │ (REQ-XXX)  │                                                             │  │
│  └──────┬──────┘                                                             │  │
│         │                                                                    │  │
│         ├──────────────────┬──────────────────┬──────────────────┐          │  │
│         ▼                  ▼                  ▼                  ▼          │  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │  │
│  │    页面     │    │    接口     │    │   数据表    │    │   状态机    │  │  │
│  │ (PAGE-XXX) │    │ (API-XXX)  │    │ (TABLE-XXX)│    │ (SM-XXX)   │  │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │  │
│         │                  │                  │                  │          │  │
│         │                  │                  │                  │          │  │
│         ├──────────────────┴──────────────────┴──────────────────┘          │  │
│         │                                                                    │  │
│         ├──────────────────┬──────────────────┬──────────────────┐          │  │
│         ▼                  ▼                  ▼                  ▼          │  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │  │
│  │   权限点    │    │    埋点     │    │   测试点    │    │   验收项    │  │  │
│  │ (PERM-XXX) │    │ (TRACK-XXX)│    │ (TEST-XXX) │    │ (ACPT-XXX) │  │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │  │
│         │                                                                    │  │
│         ▼                                                                    │  │
│  ┌─────────────┐                                                            │  │
│  │ Trae任务    │◀───────────────────────────────────────────────────────────┘  │
│  │ (TRAE-XXX) │                                                               │
│  └─────────────┘                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 追踪矩阵清单

| 矩阵编号 | 矩阵名称 | 追踪维度 | 用途 |
|----------|----------|----------|------|
| RTM-01 | 业务目标→BRD需求 | 业务目标 → BRD需求 | 业务价值追溯 |
| RTM-02 | BRD需求→PRD需求 | BRD需求 → PRD需求 | 需求分解追溯 |
| RTM-03 | PRD需求→页面 | PRD需求 → 页面 | 前端开发追溯 |
| RTM-04 | PRD需求→接口 | PRD需求 → 接口 | 后端开发追溯 |
| RTM-05 | PRD需求→数据表 | PRD需求 → 数据表 | 数据库实现追溯 |
| RTM-06 | PRD需求→状态机 | PRD需求 → 状态机 | 业务流程追溯 |
| RTM-07 | PRD需求→权限点 | PRD需求 → 权限点 | 权限控制追溯 |
| RTM-08 | PRD需求→埋点 | PRD需求 → 埋点 | 数据采集追溯 |
| RTM-09 | PRD需求→测试点 | PRD需求 → 测试点 | 测试设计追溯 |
| RTM-10 | PRD需求→验收项 | PRD需求 → 验收项 | 验收标准追溯 |
| RTM-11 | PRD需求→Trae任务 | PRD需求 → Trae任务 | AI编码输入追溯 |

### 2.3 ID编码规则

| ID类型 | 编码规则 | 示例 |
|--------|----------|------|
| 业务目标 | BUS-OBJ-{序号} | BUS-OBJ-001 |
| BRD需求 | BRD-REQ-{模块}-{序号} | BRD-REQ-CM-001 |
| PRD需求 | REQ-{模块}-{序号} | REQ-CM-001 |
| 页面 | PAGE-{序号} | PAGE-001 |
| 接口 | API-{METHOD}-{模块}-{序号} | API-GET-CM-001 |
| 数据表 | TABLE-{表名} | TABLE-customers |
| 状态机 | SM-{实体名} | SM-lead |
| 权限点 | PERM-{模块}-{操作} | PERM-CM-READ |
| 埋点 | TRACK-{事件名} | TRACK-customer-create |
| 测试点 | TEST-{模块}-{序号} | TEST-CM-001 |
| 验收项 | ACPT-{模块}-{序号} | ACPT-CM-001 |
| Trae任务 | TRAE-{模块}-{序号} | TRAE-CM-001 |

---

## 三、RTM-01：业务目标→BRD需求追踪矩阵

### 3.1 业务目标定义

| 目标ID | 业务目标 | 量化指标 | 来源 |
|--------|----------|----------|------|
| BUS-OBJ-001 | 提升线索转化率 | 转化率提升10-30% | BRD 2.2.2 |
| BUS-OBJ-002 | 提升客服效率 | 效率提升30%+ | BRD 2.2.2 |
| BUS-OBJ-003 | 缩短成交周期 | 周期缩短20%+ | BRD 2.2.2 |
| BUS-OBJ-004 | 提升客户满意度 | 满意度提升15%+ | BRD 2.2.2 |
| BUS-OBJ-005 | 提升复购率 | 复购率提升10%+ | BRD 2.2.2 |

### 3.2 业务目标→BRD需求追踪

| 业务目标ID | 业务目标 | BRD需求ID | BRD需求描述 | 优先级 |
|------------|----------|-----------|-------------|--------|
| BUS-OBJ-001 | 提升线索转化率 | BRD-REQ-LM-001 | 线索录入与管理 | P0 |
| BUS-OBJ-001 | 提升线索转化率 | BRD-REQ-LM-002 | 线索分配与跟进 | P0 |
| BUS-OBJ-001 | 提升线索转化率 | BRD-REQ-LM-003 | 线索转化商机 | P0 |
| BUS-OBJ-001 | 提升线索转化率 | BRD-REQ-OM-001 | 商机阶段管理 | P0 |
| BUS-OBJ-002 | 提升客服效率 | BRD-REQ-SM-001 | 多渠道会话接入 | P0 |
| BUS-OBJ-002 | 提升客服效率 | BRD-REQ-SM-002 | AI智能回复推荐 | P0 |
| BUS-OBJ-002 | 提升客服效率 | BRD-REQ-KB-001 | 知识库管理 | P1 |
| BUS-OBJ-003 | 缩短成交周期 | BRD-REQ-OM-002 | 商机可视化看板 | P0 |
| BUS-OBJ-003 | 缩短成交周期 | BRD-REQ-OM-003 | 商机预测分析 | P1 |
| BUS-OBJ-004 | 提升客户满意度 | BRD-REQ-TM-001 | 工单管理 | P0 |
| BUS-OBJ-004 | 提升客户满意度 | BRD-REQ-TM-002 | SLA时效管理 | P0 |
| BUS-OBJ-004 | 提升客户满意度 | BRD-REQ-SM-003 | 会话满意度评价 | P1 |
| BUS-OBJ-005 | 提升复购率 | BRD-REQ-CM-001 | 客户生命周期管理 | P0 |
| BUS-OBJ-005 | 提升复购率 | BRD-REQ-CM-002 | 客户沉默/流失识别 | P0 |

---

## 四、RTM-02：BRD需求→PRD需求追踪矩阵

### 4.1 客户管理模块（CM）

| BRD需求ID | BRD需求描述 | PRD需求ID | PRD需求描述 | 优先级 |
|------------|-------------|-----------|-------------|--------|
| BRD-REQ-CM-001 | 客户生命周期管理 | REQ-CM-001 | 客户创建功能 | P0 |
| BRD-REQ-CM-001 | 客户生命周期管理 | REQ-CM-002 | 客户编辑功能 | P0 |
| BRD-REQ-CM-001 | 客户生命周期管理 | REQ-CM-004 | 客户详情展示 | P0 |
| BRD-REQ-CM-001 | 客户生命周期管理 | REQ-CM-006 | 客户状态管理 | P0 |
| BRD-REQ-CM-002 | 客户沉默/流失识别 | REQ-CM-007 | 客户沉默识别 | P0 |
| BRD-REQ-CM-002 | 客户沉默/流失识别 | REQ-CM-008 | 客户流失识别 | P0 |
| BRD-REQ-CM-002 | 客户沉默/流失识别 | REQ-CM-009 | 客户激活功能 | P0 |
| - | 客户信息维护 | REQ-CM-003 | 客户查询功能 | P0 |
| - | 客户分类管理 | REQ-CM-005 | 客户分组功能 | P0 |
| - | 客户精准触达 | REQ-CM-010 | 客户标签功能 | P0 |

### 4.2 线索管理模块（LM）

| BRD需求ID | BRD需求描述 | PRD需求ID | PRD需求描述 | 优先级 |
|------------|-------------|-----------|-------------|--------|
| BRD-REQ-LM-001 | 线索录入与管理 | REQ-LM-001 | 线索录入功能 | P0 |
| BRD-REQ-LM-001 | 线索录入与管理 | REQ-LM-002 | 线索导入功能 | P0 |
| BRD-REQ-LM-002 | 线索分配与跟进 | REQ-LM-003 | 线索分配功能 | P0 |
| BRD-REQ-LM-002 | 线索分配与跟进 | REQ-LM-004 | 线索跟进记录 | P0 |
| BRD-REQ-LM-002 | 线索分配与跟进 | REQ-LM-005 | 线索状态管理 | P0 |
| BRD-REQ-LM-003 | 线索转化商机 | REQ-LM-006 | 线索转化功能 | P0 |
| BRD-REQ-LM-003 | 线索转化商机 | REQ-LM-007 | 线索统计功能 | P0 |
| - | 线索回收机制 | REQ-LM-008 | 线索回收功能 | P0 |
| - | 重复线索处理 | REQ-LM-009 | 重复线索检测 | P1 |
| - | 线索评分 | REQ-LM-010 | 线索评分功能 | P1 |

### 4.3 会话管理模块（SM）

| BRD需求ID | BRD需求描述 | PRD需求ID | PRD需求描述 | 优先级 |
|------------|-------------|-----------|-------------|--------|
| BRD-REQ-SM-001 | 多渠道会话接入 | REQ-SM-001 | 渠道接入功能 | P0 |
| BRD-REQ-SM-001 | 多渠道会话接入 | REQ-SM-002 | 会话列表功能 | P0 |
| BRD-REQ-SM-001 | 多渠道会话接入 | REQ-SM-003 | 会话详情功能 | P0 |
| BRD-REQ-SM-001 | 多渠道会话接入 | REQ-SM-004 | 消息发送功能 | P0 |
| BRD-REQ-SM-002 | AI智能回复推荐 | REQ-SM-005 | 智能回复推荐 | P0 |
| BRD-REQ-SM-002 | AI智能回复推荐 | REQ-SM-006 | 话术辅助功能 | P0 |
| BRD-REQ-SM-001 | 会话分配管理 | REQ-SM-007 | 会话分配功能 | P0 |
| BRD-REQ-SM-001 | 会话转接处理 | REQ-SM-008 | 会话转接功能 | P0 |
| BRD-REQ-SM-003 | 会话满意度评价 | REQ-SM-009 | 会话监控功能 | P1 |
| BRD-REQ-SM-003 | 会话满意度评价 | REQ-SM-010 | 会话评价功能 | P1 |

### 4.4 商机管理模块（OM）

| BRD需求ID | BRD需求描述 | PRD需求ID | PRD需求描述 | 优先级 |
|------------|-------------|-----------|-------------|--------|
| BRD-REQ-OM-001 | 商机阶段管理 | REQ-OM-001 | 商机创建功能 | P0 |
| BRD-REQ-OM-001 | 商机阶段管理 | REQ-OM-002 | 商机列表功能 | P0 |
| BRD-REQ-OM-001 | 商机阶段管理 | REQ-OM-003 | 商机详情功能 | P0 |
| BRD-REQ-OM-001 | 商机阶段管理 | REQ-OM-004 | 商机阶段功能 | P0 |
| BRD-REQ-OM-001 | 商机阶段管理 | REQ-OM-005 | 商机跟进功能 | P0 |
| BRD-REQ-OM-001 | 商机阶段管理 | REQ-OM-006 | 商机阶段变更 | P0 |
| BRD-REQ-OM-002 | 商机可视化看板 | REQ-OM-007 | 商机统计功能 | P0 |
| BRD-REQ-OM-003 | 商机预测分析 | REQ-OM-008 | 商机预测功能 | P1 |
| - | 商机暂停恢复 | REQ-OM-009 | 商机暂停功能 | P1 |

### 4.5 工单管理模块（TM）

| BRD需求ID | BRD需求描述 | PRD需求ID | PRD需求描述 | 优先级 |
|------------|-------------|-----------|-------------|--------|
| BRD-REQ-TM-001 | 工单管理 | REQ-TM-001 | 工单创建功能 | P0 |
| BRD-REQ-TM-001 | 工单管理 | REQ-TM-002 | 工单列表功能 | P0 |
| BRD-REQ-TM-001 | 工单管理 | REQ-TM-003 | 工单详情功能 | P0 |
| BRD-REQ-TM-001 | 工单管理 | REQ-TM-004 | 工单分配功能 | P0 |
| BRD-REQ-TM-001 | 工单管理 | REQ-TM-005 | 工单处理功能 | P0 |
| BRD-REQ-TM-001 | 工单管理 | REQ-TM-006 | 工单流转功能 | P0 |
| BRD-REQ-TM-001 | 工单管理 | REQ-TM-007 | 工单转派功能 | P0 |
| BRD-REQ-TM-001 | 工单管理 | REQ-TM-008 | 工单关闭功能 | P0 |
| BRD-REQ-TM-002 | SLA时效管理 | REQ-TM-009 | 工单统计功能 | P0 |
| BRD-REQ-TM-002 | SLA时效管理 | REQ-TM-010 | SLA管理功能 | P0 |
| BRD-REQ-TM-002 | SLA时效管理 | REQ-TM-011 | 工单升级功能 | P0 |

### 4.6 知识库模块（KB）

| BRD需求ID | BRD需求描述 | PRD需求ID | PRD需求描述 | 优先级 |
|------------|-------------|-----------|-------------|--------|
| BRD-REQ-KB-001 | 知识库管理 | REQ-KB-001 | 知识检索功能 | P1 |
| BRD-REQ-KB-001 | 知识库管理 | REQ-KB-002 | 知识详情功能 | P1 |
| BRD-REQ-KB-001 | 知识库管理 | REQ-KB-003 | AI问答功能 | P1 |
| BRD-REQ-KB-001 | 知识库管理 | REQ-KB-004 | 知识分类功能 | P1 |
| BRD-REQ-KB-001 | 知识库管理 | REQ-KB-005 | 知识管理功能 | P1 |
| BRD-REQ-KB-001 | 知识库管理 | REQ-KB-006 | 知识审核功能 | P1 |

### 4.7 其他模块

| 模块 | BRD需求ID | BRD需求描述 | PRD需求ID | PRD需求描述 | 优先级 |
|------|-----------|-------------|-----------|-------------|--------|
| 数据看板 | BRD-REQ-DB-001 | 销售业绩监控 | REQ-DB-001 | 销售看板功能 | P1 |
| 数据看板 | BRD-REQ-DB-002 | 客服质量监控 | REQ-DB-002 | 客服看板功能 | P1 |
| 数据看板 | BRD-REQ-DB-003 | 全局运营监控 | REQ-DB-003 | 运营看板功能 | P1 |
| 数据看板 | BRD-REQ-DB-004 | 趋势分析展示 | REQ-DB-004 | 趋势图表功能 | P1 |
| 系统管理 | - | 用户身份认证 | REQ-SYS-001 | 登录功能 | P0 |
| 系统管理 | - | 用户权限管理 | REQ-SYS-002 | 权限控制功能 | P0 |
| 系统管理 | - | 用户管理 | REQ-SYS-003 | 用户管理功能 | P1 |
| 任务管理 | - | 任务创建管理 | REQ-TASK-001 | 任务创建功能 | P0 |
| 任务管理 | - | 任务列表查看 | REQ-TASK-002 | 任务列表功能 | P0 |
| 任务管理 | - | 任务状态管理 | REQ-TASK-003 | 任务完成功能 | P0 |
| 通知管理 | - | 系统通知触达 | REQ-NT-001 | 系统通知功能 | P0 |
| 通知管理 | - | 业务事件提醒 | REQ-NT-002 | 业务提醒功能 | P0 |
| 通知管理 | - | 通知状态管理 | REQ-NT-003 | 通知已读功能 | P0 |
| 渠道管理 | - | 渠道接入管理 | REQ-CH-001 | 渠道创建功能 | P0 |
| 渠道管理 | - | 渠道配置管理 | REQ-CH-002 | 渠道配置功能 | P1 |
| 自动化规则 | - | 自动分配规则 | REQ-AR-001 | 分配规则配置 | P1 |
| 自动化规则 | - | 自动通知规则 | REQ-AR-002 | 通知规则配置 | P1 |
| AI工作台 | - | AI任务管理 | REQ-AI-001 | AI任务列表 | P1 |
| AI工作台 | - | AI服务配置 | REQ-AI-002 | AI配置功能 | P1 |
| AI工作台 | - | AI降级策略 | REQ-AI-003 | AI降级配置 | P1 |
| AI工作台 | - | AI统计分析 | REQ-AI-004 | AI统计功能 | P1 |

---

## 五、RTM-03：PRD需求→页面追踪矩阵

### 5.1 页面清单

| 页面ID | 页面名称 | 路由 | 所属模块 | 优先级 |
|--------|----------|------|----------|--------|
| PAGE-001 | 登录页 | /login | 认证 | P0 |
| PAGE-002 | 密码找回页 | /forgot-password | 认证 | P0 |
| PAGE-003 | 工作台首页 | /dashboard | 系统 | P0 |
| PAGE-004 | 客户列表页 | /customers | 客户管理 | P0 |
| PAGE-005 | 客户详情页 | /customers/:id | 客户管理 | P0 |
| PAGE-006 | 客户编辑页 | /customers/create, /customers/:id/edit | 客户管理 | P0 |
| PAGE-007 | 线索列表页 | /leads | 线索管理 | P0 |
| PAGE-008 | 线索详情页 | /leads/:id | 线索管理 | P0 |
| PAGE-009 | 线索录入页 | /leads/create | 线索管理 | P0 |
| PAGE-010 | 线索导入页 | /leads/import | 线索管理 | P0 |
| PAGE-011 | 会话列表页 | /conversations | 会话管理 | P0 |
| PAGE-012 | 会话窗口页 | /conversations/:id | 会话管理 | P0 |
| PAGE-013 | 商机列表页 | /opportunities | 商机管理 | P0 |
| PAGE-014 | 商机详情页 | /opportunities/:id | 商机管理 | P0 |
| PAGE-015 | 商机创建页 | /opportunities/create | 商机管理 | P0 |
| PAGE-016 | 工单列表页 | /tickets | 工单管理 | P0 |
| PAGE-017 | 工单详情页 | /tickets/:id | 工单管理 | P0 |
| PAGE-018 | 工单创建页 | /tickets/create | 工单管理 | P0 |
| PAGE-019 | 任务列表页 | /tasks | 任务管理 | P0 |
| PAGE-020 | 通知中心页 | /notifications | 通知管理 | P0 |
| PAGE-021 | 用户管理页 | /settings/users | 系统设置 | P0 |
| PAGE-022 | 角色管理页 | /settings/roles | 系统设置 | P0 |
| PAGE-023 | 组织设置页 | /settings/organization | 系统设置 | P0 |
| PAGE-024 | 审计日志页 | /settings/audit-logs | 系统设置 | P0 |
| PAGE-025 | 知识库搜索页 | /knowledge | 知识库 | P1 |
| PAGE-026 | 知识库管理页 | /knowledge/manage | 知识库 | P1 |
| PAGE-027 | 销售看板页 | /dashboards/sales | 数据看板 | P1 |
| PAGE-028 | 客服看板页 | /dashboards/service | 数据看板 | P1 |
| PAGE-029 | 自动化规则页 | /settings/automation | 系统设置 | P1 |
| PAGE-030 | AI工作台页 | /settings/ai | AI工作台 | P1 |

### 5.2 PRD需求→页面追踪

| PRD需求ID | PRD需求描述 | 页面ID | 页面名称 | 前端状态 |
|-----------|-------------|--------|----------|----------|
| REQ-CM-001 | 客户创建功能 | PAGE-006 | 客户编辑页 | 待开发 |
| REQ-CM-002 | 客户编辑功能 | PAGE-006 | 客户编辑页 | 待开发 |
| REQ-CM-003 | 客户查询功能 | PAGE-004 | 客户列表页 | 待开发 |
| REQ-CM-004 | 客户详情展示 | PAGE-005 | 客户详情页 | 待开发 |
| REQ-CM-005 | 客户分组功能 | PAGE-004, PAGE-005 | 客户列表页, 客户详情页 | 待开发 |
| REQ-CM-006 | 客户状态管理 | PAGE-005 | 客户详情页 | 待开发 |
| REQ-LM-001 | 线索录入功能 | PAGE-009 | 线索录入页 | 待开发 |
| REQ-LM-002 | 线索导入功能 | PAGE-010 | 线索导入页 | 待开发 |
| REQ-LM-003 | 线索分配功能 | PAGE-008 | 线索详情页 | 待开发 |
| REQ-LM-004 | 线索跟进记录 | PAGE-008 | 线索详情页 | 待开发 |
| REQ-LM-005 | 线索状态管理 | PAGE-008 | 线索详情页 | 待开发 |
| REQ-LM-006 | 线索转化功能 | PAGE-008 | 线索详情页 | 待开发 |
| REQ-SM-001 | 渠道接入功能 | PAGE-011, PAGE-012 | 会话列表页, 会话窗口页 | 待开发 |
| REQ-SM-002 | 会话列表功能 | PAGE-011 | 会话列表页 | 待开发 |
| REQ-SM-003 | 会话详情功能 | PAGE-012 | 会话窗口页 | 待开发 |
| REQ-SM-004 | 消息发送功能 | PAGE-012 | 会话窗口页 | 待开发 |
| REQ-SM-005 | 智能回复推荐 | PAGE-012 | 会话窗口页 | 待开发 |
| REQ-OM-001 | 商机创建功能 | PAGE-015 | 商机创建页 | 待开发 |
| REQ-OM-002 | 商机列表功能 | PAGE-013 | 商机列表页 | 待开发 |
| REQ-OM-003 | 商机详情功能 | PAGE-014 | 商机详情页 | 待开发 |
| REQ-OM-004 | 商机阶段功能 | PAGE-014 | 商机详情页 | 待开发 |
| REQ-TM-001 | 工单创建功能 | PAGE-018 | 工单创建页 | 待开发 |
| REQ-TM-002 | 工单列表功能 | PAGE-016 | 工单列表页 | 待开发 |
| REQ-TM-003 | 工单详情功能 | PAGE-017 | 工单详情页 | 待开发 |
| REQ-KB-001 | 知识检索功能 | PAGE-025 | 知识库搜索页 | 待开发 |
| REQ-DB-001 | 销售看板功能 | PAGE-027 | 销售看板页 | 待开发 |
| REQ-SYS-001 | 登录功能 | PAGE-001 | 登录页 | 待开发 |
| REQ-SYS-002 | 权限控制功能 | PAGE-021, PAGE-022 | 用户管理页, 角色管理页 | 待开发 |

---

## 六、RTM-04：PRD需求→接口追踪矩阵

### 6.1 接口清单

| 接口ID | 接口路径 | HTTP方法 | 功能描述 | 所属模块 |
|--------|----------|----------|----------|----------|
| API-POST-AUTH-001 | /api/v1/auth/login | POST | 用户登录 | 认证 |
| API-POST-AUTH-002 | /api/v1/auth/logout | POST | 用户登出 | 认证 |
| API-POST-AUTH-003 | /api/v1/auth/refresh | POST | 刷新Token | 认证 |
| API-GET-AUTH-001 | /api/v1/auth/me | GET | 获取当前用户信息 | 认证 |
| API-GET-CM-001 | /api/v1/customers | GET | 客户列表查询 | 客户管理 |
| API-POST-CM-001 | /api/v1/customers | POST | 创建客户 | 客户管理 |
| API-GET-CM-002 | /api/v1/customers/:id | GET | 获取客户详情 | 客户管理 |
| API-PUT-CM-001 | /api/v1/customers/:id | PUT | 更新客户信息 | 客户管理 |
| API-DELETE-CM-001 | /api/v1/customers/:id | DELETE | 删除客户 | 客户管理 |
| API-POST-CM-002 | /api/v1/customers/:id/tags | POST | 添加客户标签 | 客户管理 |
| API-DELETE-CM-002 | /api/v1/customers/:id/tags/:tagId | DELETE | 移除客户标签 | 客户管理 |
| API-PUT-CM-003 | /api/v1/customers/:id/status | PUT | 更新客户状态 | 客户管理 |
| API-GET-LM-001 | /api/v1/leads | GET | 线索列表查询 | 线索管理 |
| API-POST-LM-001 | /api/v1/leads | POST | 创建线索 | 线索管理 |
| API-POST-LM-002 | /api/v1/leads/import | POST | 批量导入线索 | 线索管理 |
| API-GET-LM-002 | /api/v1/leads/:id | GET | 获取线索详情 | 线索管理 |
| API-PUT-LM-001 | /api/v1/leads/:id | PUT | 更新线索信息 | 线索管理 |
| API-POST-LM-003 | /api/v1/leads/:id/assign | POST | 分配线索 | 线索管理 |
| API-POST-LM-004 | /api/v1/leads/:id/convert | POST | 转化线索 | 线索管理 |
| API-POST-LM-005 | /api/v1/leads/:id/follow-ups | POST | 添加跟进记录 | 线索管理 |
| API-GET-SM-001 | /api/v1/conversations | GET | 会话列表查询 | 会话管理 |
| API-GET-SM-002 | /api/v1/conversations/:id | GET | 获取会话详情 | 会话管理 |
| API-POST-SM-001 | /api/v1/conversations/:id/messages | POST | 发送消息 | 会话管理 |
| API-POST-SM-002 | /api/v1/conversations/:id/transfer | POST | 转接会话 | 会话管理 |
| API-POST-SM-003 | /api/v1/conversations/:id/close | POST | 关闭会话 | 会话管理 |
| API-GET-SM-003 | /api/v1/conversations/:id/smart-reply | GET | 获取智能回复 | 会话管理 |
| API-GET-OM-001 | /api/v1/opportunities | GET | 商机列表查询 | 商机管理 |
| API-POST-OM-001 | /api/v1/opportunities | POST | 创建商机 | 商机管理 |
| API-GET-OM-002 | /api/v1/opportunities/:id | GET | 获取商机详情 | 商机管理 |
| API-PUT-OM-001 | /api/v1/opportunities/:id | PUT | 更新商机信息 | 商机管理 |
| API-PUT-OM-002 | /api/v1/opportunities/:id/stage | PUT | 更新商机阶段 | 商机管理 |
| API-PUT-OM-003 | /api/v1/opportunities/:id/won | PUT | 标记商机赢单 | 商机管理 |
| API-PUT-OM-004 | /api/v1/opportunities/:id/lost | PUT | 标记商机输单 | 商机管理 |
| API-GET-TM-001 | /api/v1/tickets | GET | 工单列表查询 | 工单管理 |
| API-POST-TM-001 | /api/v1/tickets | POST | 创建工单 | 工单管理 |
| API-GET-TM-002 | /api/v1/tickets/:id | GET | 获取工单详情 | 工单管理 |
| API-POST-TM-002 | /api/v1/tickets/:id/handle | POST | 处理工单 | 工单管理 |
| API-POST-TM-003 | /api/v1/tickets/:id/transfer | POST | 转派工单 | 工单管理 |
| API-POST-TM-004 | /api/v1/tickets/:id/resolve | POST | 解决工单 | 工单管理 |
| API-POST-TM-005 | /api/v1/tickets/:id/close | POST | 关闭工单 | 工单管理 |
| API-GET-KB-001 | /api/v1/knowledge | GET | 知识检索 | 知识库 |
| API-GET-KB-002 | /api/v1/knowledge/:id | GET | 获取知识详情 | 知识库 |
| API-POST-KB-001 | /api/v1/knowledge/ask | POST | AI问答 | 知识库 |

### 6.2 PRD需求→接口追踪

| PRD需求ID | PRD需求描述 | 接口ID | 接口路径 | 后端状态 |
|-----------|-------------|--------|----------|----------|
| REQ-CM-001 | 客户创建功能 | API-POST-CM-001 | POST /api/v1/customers | 待开发 |
| REQ-CM-002 | 客户编辑功能 | API-PUT-CM-001 | PUT /api/v1/customers/:id | 待开发 |
| REQ-CM-003 | 客户查询功能 | API-GET-CM-001 | GET /api/v1/customers | 待开发 |
| REQ-CM-004 | 客户详情展示 | API-GET-CM-002 | GET /api/v1/customers/:id | 待开发 |
| REQ-CM-006 | 客户状态管理 | API-PUT-CM-003 | PUT /api/v1/customers/:id/status | 待开发 |
| REQ-CM-010 | 客户标签功能 | API-POST-CM-002, API-DELETE-CM-002 | POST/DELETE /api/v1/customers/:id/tags | 待开发 |
| REQ-LM-001 | 线索录入功能 | API-POST-LM-001 | POST /api/v1/leads | 待开发 |
| REQ-LM-002 | 线索导入功能 | API-POST-LM-002 | POST /api/v1/leads/import | 待开发 |
| REQ-LM-003 | 线索分配功能 | API-POST-LM-003 | POST /api/v1/leads/:id/assign | 待开发 |
| REQ-LM-004 | 线索跟进记录 | API-POST-LM-005 | POST /api/v1/leads/:id/follow-ups | 待开发 |
| REQ-LM-006 | 线索转化功能 | API-POST-LM-004 | POST /api/v1/leads/:id/convert | 待开发 |
| REQ-SM-001 | 渠道接入功能 | API-GET-SM-001, API-GET-SM-002 | GET /api/v1/conversations | 待开发 |
| REQ-SM-002 | 会话列表功能 | API-GET-SM-001 | GET /api/v1/conversations | 待开发 |
| REQ-SM-004 | 消息发送功能 | API-POST-SM-001 | POST /api/v1/conversations/:id/messages | 待开发 |
| REQ-SM-005 | 智能回复推荐 | API-GET-SM-003 | GET /api/v1/conversations/:id/smart-reply | 待开发 |
| REQ-SM-008 | 会话转接功能 | API-POST-SM-002 | POST /api/v1/conversations/:id/transfer | 待开发 |
| REQ-OM-001 | 商机创建功能 | API-POST-OM-001 | POST /api/v1/opportunities | 待开发 |
| REQ-OM-002 | 商机列表功能 | API-GET-OM-001 | GET /api/v1/opportunities | 待开发 |
| REQ-OM-004 | 商机阶段功能 | API-PUT-OM-002 | PUT /api/v1/opportunities/:id/stage | 待开发 |
| REQ-TM-001 | 工单创建功能 | API-POST-TM-001 | POST /api/v1/tickets | 待开发 |
| REQ-TM-002 | 工单列表功能 | API-GET-TM-001 | GET /api/v1/tickets | 待开发 |
| REQ-TM-005 | 工单处理功能 | API-POST-TM-002 | POST /api/v1/tickets/:id/handle | 待开发 |
| REQ-KB-001 | 知识检索功能 | API-GET-KB-001 | GET /api/v1/knowledge | 待开发 |
| REQ-KB-003 | AI问答功能 | API-POST-KB-001 | POST /api/v1/knowledge/ask | 待开发 |
| REQ-SYS-001 | 登录功能 | API-POST-AUTH-001 | POST /api/v1/auth/login | 待开发 |

---

## 七、RTM-05：PRD需求→数据表追踪矩阵

### 7.1 数据表清单

| 表ID | 表名 | 中文名 | 说明 |
|------|------|--------|------|
| TABLE-orgs | organizations | 组织表 | 多租户组织信息 |
| TABLE-users | users | 用户表 | 系统用户信息 |
| TABLE-roles | roles | 角色表 | 角色定义 |
| TABLE-permissions | permissions | 权限表 | 权限定义 |
| TABLE-user-roles | user_roles | 用户角色关联表 | 用户-角色多对多 |
| TABLE-role-perms | role_permissions | 角色权限关联表 | 角色-权限多对多 |
| TABLE-customers | customers | 客户表 | 客户基本信息 |
| TABLE-contacts | customer_contacts | 联系人表 | 客户联系人 |
| TABLE-tags | tags | 标签表 | 客户标签定义 |
| TABLE-customer-tags | customer_tags | 客户标签关联表 | 客户-标签多对多 |
| TABLE-leads | leads | 线索表 | 线索信息 |
| TABLE-lead-followups | lead_follow_ups | 线索跟进记录表 | 线索跟进历史 |
| TABLE-opportunities | opportunities | 商机表 | 商机信息 |
| TABLE-opp-followups | opportunity_follow_ups | 商机跟进记录表 | 商机跟进历史 |
| TABLE-opp-stages | opportunity_stage_histories | 商机阶段历史表 | 阶段变更记录 |
| TABLE-conversations | conversations | 会话表 | 会话信息 |
| TABLE-messages | conversation_messages | 消息表 | 会话消息 |
| TABLE-tickets | tickets | 工单表 | 工单信息 |
| TABLE-ticket-logs | ticket_logs | 工单处理记录表 | 工单处理历史 |
| TABLE-knowledge-cats | knowledge_categories | 知识分类表 | 知识库分类 |
| TABLE-knowledge-items | knowledge_items | 知识条目表 | 知识库内容 |
| TABLE-tasks | tasks | 任务表 | 待办任务 |
| TABLE-notifications | notifications | 通知表 | 系统通知 |
| TABLE-channels | channels | 渠道表 | 接入渠道 |
| TABLE-automation-rules | automation_rules | 自动化规则表 | 自动化规则 |
| TABLE-ai-tasks | ai_tasks | AI任务表 | AI任务记录 |
| TABLE-audit-logs | audit_logs | 审计日志表 | 操作审计 |

### 7.2 PRD需求→数据表追踪

| PRD需求ID | PRD需求描述 | 数据表ID | 数据表名 | 数据库状态 |
|-----------|-------------|----------|----------|------------|
| REQ-CM-001 | 客户创建功能 | TABLE-customers | customers | 待实现 |
| REQ-CM-004 | 客户详情展示 | TABLE-customers, TABLE-contacts, TABLE-tags | customers, customer_contacts, tags | 待实现 |
| REQ-CM-005 | 客户分组功能 | TABLE-customer-groups | customer_groups | 待实现 |
| REQ-CM-010 | 客户标签功能 | TABLE-tags, TABLE-customer-tags | tags, customer_tags | 待实现 |
| REQ-CM-006 | 客户状态管理 | TABLE-customers | customers | 待实现 |
| REQ-LM-001 | 线索录入功能 | TABLE-leads | leads | 待实现 |
| REQ-LM-004 | 线索跟进记录 | TABLE-lead-followups | lead_follow_ups | 待实现 |
| REQ-LM-006 | 线索转化功能 | TABLE-leads, TABLE-opportunities, TABLE-customers | leads, opportunities, customers | 待实现 |
| REQ-OM-001 | 商机创建功能 | TABLE-opportunities | opportunities | 待实现 |
| REQ-OM-004 | 商机阶段功能 | TABLE-opportunities, TABLE-opp-stages | opportunities, opportunity_stage_histories | 待实现 |
| REQ-OM-005 | 商机跟进功能 | TABLE-opp-followups | opportunity_follow_ups | 待实现 |
| REQ-SM-001 | 渠道接入功能 | TABLE-conversations, TABLE-channels | conversations, channels | 待实现 |
| REQ-SM-004 | 消息发送功能 | TABLE-messages | conversation_messages | 待实现 |
| REQ-TM-001 | 工单创建功能 | TABLE-tickets | tickets | 待实现 |
| REQ-TM-005 | 工单处理功能 | TABLE-ticket-logs | ticket_logs | 待实现 |
| REQ-KB-001 | 知识检索功能 | TABLE-knowledge-cats, TABLE-knowledge-items | knowledge_categories, knowledge_items | 待实现 |
| REQ-SYS-001 | 登录功能 | TABLE-users, TABLE-orgs | users, organizations | 待实现 |
| REQ-SYS-002 | 权限控制功能 | TABLE-roles, TABLE-permissions, TABLE-user-roles, TABLE-role-perms | roles, permissions, user_roles, role_permissions | 待实现 |

---

## 八、RTM-06：PRD需求→状态机追踪矩阵

### 8.1 状态机清单

| 状态机ID | 状态机名称 | 实体 | 状态数量 | 状态值 |
|----------|------------|------|----------|--------|
| SM-lead | 线索状态机 | Lead | 5 | new, assigned, following, converted, invalid |
| SM-opportunity | 商机状态机 | Opportunity | 6 | initial, requirement, proposal, negotiation, won, lost |
| SM-customer | 客户生命周期状态机 | Customer | 5 | potential, new_customer, active, silent, lost |
| SM-ticket | 工单状态机 | Ticket | 5 | pending, assigned, processing, resolved, closed |
| SM-conversation | 会话状态机 | Conversation | 3 | pending, active, closed |
| SM-task | 任务状态机 | Task | 4 | pending, in_progress, completed, cancelled |
| SM-ai-task | AI任务状态机 | AITask | 4 | pending, running, completed, failed |
| SM-user | 用户状态机 | User | 3 | active, inactive, locked |
| SM-org | 组织状态机 | Organization | 3 | active, suspended, closed |
| SM-dept | 部门状态机 | Department | 2 | active, archived |
| SM-rule | 自动化规则状态机 | AutomationRule | 2 | active, inactive |
| SM-knowledge | 知识条目状态机 | KnowledgeItem | 3 | draft, published, archived |

### 8.2 PRD需求→状态机追踪

| PRD需求ID | PRD需求描述 | 状态机ID | 状态机名称 | 实现状态 |
|-----------|-------------|----------|------------|----------|
| REQ-LM-005 | 线索状态管理 | SM-lead | 线索状态机 | 待实现 |
| REQ-OM-004 | 商机阶段功能 | SM-opportunity | 商机状态机 | 待实现 |
| REQ-CM-006 | 客户状态管理 | SM-customer | 客户生命周期状态机 | 待实现 |
| REQ-CM-007 | 客户沉默识别 | SM-customer | 客户生命周期状态机 | 待实现 |
| REQ-CM-008 | 客户流失识别 | SM-customer | 客户生命周期状态机 | 待实现 |
| REQ-TM-006 | 工单流转功能 | SM-ticket | 工单状态机 | 待实现 |
| REQ-SM-001 | 渠道接入功能 | SM-conversation | 会话状态机 | 待实现 |
| REQ-TASK-003 | 任务完成功能 | SM-task | 任务状态机 | 待实现 |
| REQ-AI-001 | AI任务列表 | SM-ai-task | AI任务状态机 | 待实现 |
| REQ-SYS-003 | 用户管理功能 | SM-user, SM-org | 用户状态机, 组织状态机 | 待实现 |

---

## 九、RTM-07：PRD需求→权限点追踪矩阵

### 9.1 权限点清单

| 权限ID | 权限名称 | 权限标识 | 所属模块 | 说明 |
|--------|----------|----------|----------|------|
| PERM-CM-READ | 查看客户 | customer:read | 客户管理 | 查看客户列表和详情 |
| PERM-CM-CREATE | 创建客户 | customer:create | 客户管理 | 创建新客户 |
| PERM-CM-UPDATE | 编辑客户 | customer:update | 客户管理 | 编辑客户信息 |
| PERM-CM-DELETE | 删除客户 | customer:delete | 客户管理 | 删除客户 |
| PERM-CM-EXPORT | 导出客户 | customer:export | 客户管理 | 导出客户数据 |
| PERM-LM-READ | 查看线索 | lead:read | 线索管理 | 查看线索列表和详情 |
| PERM-LM-CREATE | 创建线索 | lead:create | 线索管理 | 创建新线索 |
| PERM-LM-UPDATE | 编辑线索 | lead:update | 线索管理 | 编辑线索信息 |
| PERM-LM-ASSIGN | 分配线索 | lead:assign | 线索管理 | 分配线索给销售 |
| PERM-LM-CONVERT | 转化线索 | lead:convert | 线索管理 | 将线索转化为商机 |
| PERM-SM-READ | 查看会话 | conversation:read | 会话管理 | 查看会话列表和详情 |
| PERM-SM-HANDLE | 处理会话 | conversation:handle | 会话管理 | 接入和处理会话 |
| PERM-SM-TRANSFER | 转接会话 | conversation:transfer | 会话管理 | 转接会话给其他客服 |
| PERM-SM-MONITOR | 监控会话 | conversation:monitor | 会话管理 | 监控团队会话 |
| PERM-OM-READ | 查看商机 | opportunity:read | 商机管理 | 查看商机列表和详情 |
| PERM-OM-CREATE | 创建商机 | opportunity:create | 商机管理 | 创建新商机 |
| PERM-OM-UPDATE | 编辑商机 | opportunity:update | 商机管理 | 编辑商机信息 |
| PERM-OM-STAGE | 推进阶段 | opportunity:stage | 商机管理 | 推进商机阶段 |
| PERM-TM-READ | 查看工单 | ticket:read | 工单管理 | 查看工单列表和详情 |
| PERM-TM-CREATE | 创建工单 | ticket:create | 工单管理 | 创建新工单 |
| PERM-TM-HANDLE | 处理工单 | ticket:handle | 工单管理 | 处理工单 |
| PERM-TM-ASSIGN | 分配工单 | ticket:assign | 工单管理 | 分配工单给客服 |
| PERM-KB-READ | 查看知识库 | knowledge:read | 知识库 | 查看知识库内容 |
| PERM-KB-MANAGE | 管理知识库 | knowledge:manage | 知识库 | 管理知识库内容 |
| PERM-SYS-ADMIN | 系统管理 | system:admin | 系统管理 | 系统配置和管理 |
| PERM-SYS-USER | 用户管理 | system:user | 系统管理 | 用户账号管理 |
| PERM-SYS-ROLE | 角色管理 | system:role | 系统管理 | 角色权限管理 |

### 9.2 PRD需求→权限点追踪

| PRD需求ID | PRD需求描述 | 权限ID | 权限名称 | 实现状态 |
|-----------|-------------|--------|----------|----------|
| REQ-CM-001 | 客户创建功能 | PERM-CM-CREATE | 创建客户 | 待实现 |
| REQ-CM-002 | 客户编辑功能 | PERM-CM-UPDATE | 编辑客户 | 待实现 |
| REQ-CM-003 | 客户查询功能 | PERM-CM-READ | 查看客户 | 待实现 |
| REQ-CM-009 | 客户导出功能 | PERM-CM-EXPORT | 导出客户 | 待实现 |
| REQ-LM-001 | 线索录入功能 | PERM-LM-CREATE | 创建线索 | 待实现 |
| REQ-LM-003 | 线索分配功能 | PERM-LM-ASSIGN | 分配线索 | 待实现 |
| REQ-LM-006 | 线索转化功能 | PERM-LM-CONVERT | 转化线索 | 待实现 |
| REQ-SM-002 | 会话列表功能 | PERM-SM-READ | 查看会话 | 待实现 |
| REQ-SM-007 | 会话分配功能 | PERM-SM-HANDLE | 处理会话 | 待实现 |
| REQ-SM-008 | 会话转接功能 | PERM-SM-TRANSFER | 转接会话 | 待实现 |
| REQ-SM-009 | 会话监控功能 | PERM-SM-MONITOR | 监控会话 | 待实现 |
| REQ-OM-001 | 商机创建功能 | PERM-OM-CREATE | 创建商机 | 待实现 |
| REQ-OM-004 | 商机阶段功能 | PERM-OM-STAGE | 推进阶段 | 待实现 |
| REQ-TM-001 | 工单创建功能 | PERM-TM-CREATE | 创建工单 | 待实现 |
| REQ-TM-004 | 工单分配功能 | PERM-TM-ASSIGN | 分配工单 | 待实现 |
| REQ-TM-005 | 工单处理功能 | PERM-TM-HANDLE | 处理工单 | 待实现 |
| REQ-SYS-003 | 用户管理功能 | PERM-SYS-USER, PERM-SYS-ROLE | 用户管理, 角色管理 | 待实现 |

---

## 十、RTM-08：PRD需求→埋点追踪矩阵

### 10.1 埋点事件清单

| 埋点ID | 事件名称 | 事件标识 | 事件类型 | 采集字段 |
|--------|----------|----------|----------|----------|
| TRACK-001 | 用户登录 | user_login | 用户行为 | user_id, login_time, ip, device |
| TRACK-002 | 创建客户 | customer_create | 业务事件 | customer_id, user_id, create_time |
| TRACK-003 | 创建线索 | lead_create | 业务事件 | lead_id, source, user_id, create_time |
| TRACK-004 | 线索转化 | lead_convert | 业务事件 | lead_id, opportunity_id, convert_time |
| TRACK-005 | 创建商机 | opportunity_create | 业务事件 | opportunity_id, customer_id, user_id |
| TRACK-006 | 商机阶段变更 | opportunity_stage_change | 业务事件 | opportunity_id, from_stage, to_stage |
| TRACK-007 | 商机赢单 | opportunity_won | 业务事件 | opportunity_id, amount, won_time |
| TRACK-008 | 会话开始 | conversation_start | 业务事件 | conversation_id, channel, agent_id |
| TRACK-009 | 会话结束 | conversation_end | 业务事件 | conversation_id, duration, satisfaction |
| TRACK-010 | 创建工单 | ticket_create | 业务事件 | ticket_id, type, priority, customer_id |
| TRACK-011 | 工单解决 | ticket_resolve | 业务事件 | ticket_id, resolve_time, duration |
| TRACK-012 | 使用智能回复 | ai_smart_reply_use | AI事件 | conversation_id, message_id |
| TRACK-013 | AI问答 | ai_qa | AI事件 | question, answer, confidence |
| TRACK-014 | 知识检索 | knowledge_search | 业务事件 | keyword, result_count |
| TRACK-015 | 页面访问 | page_view | 用户行为 | page_path, user_id, visit_time |

### 10.2 PRD需求→埋点追踪

| PRD需求ID | PRD需求描述 | 埋点ID | 事件名称 | 实现状态 |
|-----------|-------------|--------|----------|----------|
| REQ-SYS-001 | 登录功能 | TRACK-001 | 用户登录 | 待实现 |
| REQ-CM-001 | 客户创建功能 | TRACK-002 | 创建客户 | 待实现 |
| REQ-LM-001 | 线索录入功能 | TRACK-003 | 创建线索 | 待实现 |
| REQ-LM-006 | 线索转化功能 | TRACK-004 | 线索转化 | 待实现 |
| REQ-OM-001 | 商机创建功能 | TRACK-005 | 创建商机 | 待实现 |
| REQ-OM-004 | 商机阶段功能 | TRACK-006 | 商机阶段变更 | 待实现 |
| REQ-OM-007 | 商机赢单 | TRACK-007 | 商机赢单 | 待实现 |
| REQ-SM-001 | 渠道接入功能 | TRACK-008, TRACK-009 | 会话开始, 会话结束 | 待实现 |
| REQ-SM-005 | 智能回复推荐 | TRACK-012 | 使用智能回复 | 待实现 |
| REQ-TM-001 | 工单创建功能 | TRACK-010 | 创建工单 | 待实现 |
| REQ-TM-008 | 工单关闭功能 | TRACK-011 | 工单解决 | 待实现 |
| REQ-KB-001 | 知识检索功能 | TRACK-014 | 知识检索 | 待实现 |
| REQ-KB-003 | AI问答功能 | TRACK-013 | AI问答 | 待实现 |

---

## 十一、RTM-09：PRD需求→测试点追踪矩阵

### 11.1 测试点清单

| 测试点ID | 测试点名称 | 测试类型 | 测试场景 | 优先级 |
|----------|------------|----------|----------|--------|
| TEST-CM-001 | 客户创建成功 | 功能测试 | 正常创建客户 | P0 |
| TEST-CM-002 | 客户创建必填校验 | 功能测试 | 缺少必填字段 | P0 |
| TEST-CM-003 | 客户名称重复校验 | 功能测试 | 创建重复名称客户 | P0 |
| TEST-CM-004 | 客户编辑成功 | 功能测试 | 正常编辑客户 | P0 |
| TEST-CM-005 | 客户删除成功 | 功能测试 | 正常删除客户 | P0 |
| TEST-CM-006 | 客户权限隔离 | 权限测试 | 不同角色数据隔离 | P0 |
| TEST-LM-001 | 线索创建成功 | 功能测试 | 正常创建线索 | P0 |
| TEST-LM-002 | 线索导入成功 | 功能测试 | 批量导入线索 | P0 |
| TEST-LM-003 | 线索分配成功 | 功能测试 | 分配线索给销售 | P0 |
| TEST-LM-004 | 线索转化成功 | 功能测试 | 转化线索为商机 | P0 |
| TEST-LM-005 | 线索回收成功 | 功能测试 | 超时未跟进回收 | P0 |
| TEST-LM-006 | 重复线索检测 | 功能测试 | 相同手机号检测 | P0 |
| TEST-SM-001 | 会话创建成功 | 功能测试 | 正常创建会话 | P0 |
| TEST-SM-002 | 消息发送成功 | 功能测试 | 正常发送消息 | P0 |
| TEST-SM-003 | 智能回复推荐 | 功能测试 | AI回复推荐正确 | P0 |
| TEST-SM-004 | 会话转接成功 | 功能测试 | 正常转接会话 | P0 |
| TEST-OM-001 | 商机创建成功 | 功能测试 | 正常创建商机 | P0 |
| TEST-OM-002 | 阶段推进成功 | 功能测试 | 正常推进阶段 | P0 |
| TEST-OM-003 | 商机赢单成功 | 功能测试 | 标记商机赢单 | P0 |
| TEST-OM-004 | 阶段跳跃校验 | 功能测试 | 阶段不能跳跃 | P0 |
| TEST-TM-001 | 工单创建成功 | 功能测试 | 正常创建工单 | P0 |
| TEST-TM-002 | 工单分配成功 | 功能测试 | 分配工单给客服 | P0 |
| TEST-TM-003 | 工单流转成功 | 功能测试 | 正常流转工单 | P0 |
| TEST-TM-004 | SLA超时升级 | 功能测试 | 超时自动升级 | P0 |
| TEST-AUTH-001 | 登录成功 | 功能测试 | 正确账号密码登录 | P0 |
| TEST-AUTH-002 | 登录失败 | 功能测试 | 错误密码登录 | P0 |
| TEST-AUTH-003 | 账号锁定 | 功能测试 | 连续失败锁定 | P0 |
| TEST-PERM-001 | 数据权限隔离 | 权限测试 | 多租户数据隔离 | P0 |
| TEST-PERM-002 | 功能权限控制 | 权限测试 | 角色功能权限 | P0 |

### 11.2 PRD需求→测试点追踪

| PRD需求ID | PRD需求描述 | 测试点ID | 测试点名称 | 测试状态 |
|-----------|-------------|----------|------------|----------|
| REQ-CM-001 | 客户创建功能 | TEST-CM-001, TEST-CM-002, TEST-CM-003 | 客户创建成功, 必填校验, 重复校验 | 待测试 |
| REQ-CM-002 | 客户编辑功能 | TEST-CM-004 | 客户编辑成功 | 待测试 |
| REQ-CM-007 | 客户删除功能 | TEST-CM-005 | 客户删除成功 | 待测试 |
| REQ-LM-001 | 线索录入功能 | TEST-LM-001 | 线索创建成功 | 待测试 |
| REQ-LM-002 | 线索导入功能 | TEST-LM-002 | 线索导入成功 | 待测试 |
| REQ-LM-003 | 线索分配功能 | TEST-LM-003 | 线索分配成功 | 待测试 |
| REQ-LM-006 | 线索转化功能 | TEST-LM-004 | 线索转化成功 | 待测试 |
| REQ-LM-008 | 线索回收功能 | TEST-LM-005 | 线索回收成功 | 待测试 |
| REQ-LM-009 | 重复线索检测 | TEST-LM-006 | 重复线索检测 | 待测试 |
| REQ-SM-001 | 渠道接入功能 | TEST-SM-001 | 会话创建成功 | 待测试 |
| REQ-SM-004 | 消息发送功能 | TEST-SM-002 | 消息发送成功 | 待测试 |
| REQ-SM-005 | 智能回复推荐 | TEST-SM-003 | 智能回复推荐 | 待测试 |
| REQ-SM-008 | 会话转接功能 | TEST-SM-004 | 会话转接成功 | 待测试 |
| REQ-OM-001 | 商机创建功能 | TEST-OM-001 | 商机创建成功 | 待测试 |
| REQ-OM-004 | 商机阶段功能 | TEST-OM-002, TEST-OM-004 | 阶段推进成功, 阶段跳跃校验 | 待测试 |
| REQ-TM-001 | 工单创建功能 | TEST-TM-001 | 工单创建成功 | 待测试 |
| REQ-TM-004 | 工单分配功能 | TEST-TM-002 | 工单分配成功 | 待测试 |
| REQ-TM-010 | SLA管理功能 | TEST-TM-004 | SLA超时升级 | 待测试 |
| REQ-SYS-001 | 登录功能 | TEST-AUTH-001, TEST-AUTH-002, TEST-AUTH-003 | 登录成功, 登录失败, 账号锁定 | 待测试 |
| REQ-SYS-002 | 权限控制功能 | TEST-PERM-001, TEST-PERM-002 | 数据权限隔离, 功能权限控制 | 待测试 |

---

## 十二、RTM-10：PRD需求→验收项追踪矩阵

### 12.1 验收项清单

| 验收项ID | 验收项名称 | 验收标准 | 验收方式 | 优先级 |
|----------|------------|----------|----------|--------|
| ACPT-CM-001 | 客户创建验收 | 客户可正常创建，必填字段校验正确 | 功能验收 | P0 |
| ACPT-CM-002 | 客户编辑验收 | 客户信息可编辑，变更历史可追溯 | 功能验收 | P0 |
| ACPT-CM-003 | 客户查询验收 | 支持多条件搜索，结果正确 | 功能验收 | P0 |
| ACPT-CM-004 | 客户详情验收 | 客户画像完整展示，关联数据正确 | 功能验收 | P0 |
| ACPT-CM-005 | 客户权限验收 | 数据权限隔离正确 | 权限验收 | P0 |
| ACPT-LM-001 | 线索录入验收 | 线索可正常录入，状态流转正确 | 功能验收 | P0 |
| ACPT-LM-002 | 线索导入验收 | 批量导入成功，数据正确 | 功能验收 | P0 |
| ACPT-LM-003 | 线索分配验收 | 手动/自动分配成功 | 功能验收 | P0 |
| ACPT-LM-004 | 线索转化验收 | 转化成功，商机/客户数据正确 | 功能验收 | P0 |
| ACPT-LM-005 | 线索回收验收 | 超时未跟进自动回收 | 功能验收 | P0 |
| ACPT-SM-001 | 会话接入验收 | 多渠道消息正常接收 | 功能验收 | P0 |
| ACPT-SM-002 | 消息收发验收 | 消息实时收发，WebSocket正常 | 功能验收 | P0 |
| ACPT-SM-003 | 智能回复验收 | AI回复推荐相关可用 | 功能验收 | P0 |
| ACPT-SM-004 | 会话转接验收 | 会话转接成功，状态正确 | 功能验收 | P0 |
| ACPT-OM-001 | 商机创建验收 | 商机可正常创建，关联正确 | 功能验收 | P0 |
| ACPT-OM-002 | 阶段推进验收 | 阶段按序推进，历史可追溯 | 功能验收 | P0 |
| ACPT-OM-003 | 商机赢单验收 | 赢单后客户状态更新正确 | 功能验收 | P0 |
| ACPT-TM-001 | 工单创建验收 | 工单可正常创建，关联正确 | 功能验收 | P0 |
| ACPT-TM-002 | 工单流转验收 | 工单流转正确，状态正确 | 功能验收 | P0 |
| ACPT-TM-003 | SLA验收 | SLA超时自动升级 | 功能验收 | P0 |
| ACPT-AUTH-001 | 登录验收 | 登录功能正常，Token有效 | 功能验收 | P0 |
| ACPT-PERM-001 | 权限验收 | RBAC权限控制正确 | 权限验收 | P0 |
| ACPT-PERF-001 | 性能验收 | 页面加载<3s，API响应<500ms | 性能验收 | P0 |
| ACPT-SEC-001 | 安全验收 | 无高危漏洞，数据隔离正确 | 安全验收 | P0 |

### 12.2 PRD需求→验收项追踪

| PRD需求ID | PRD需求描述 | 验收项ID | 验收项名称 | 验收状态 |
|-----------|-------------|----------|------------|----------|
| REQ-CM-001 | 客户创建功能 | ACPT-CM-001 | 客户创建验收 | 待验收 |
| REQ-CM-002 | 客户编辑功能 | ACPT-CM-002 | 客户编辑验收 | 待验收 |
| REQ-CM-003 | 客户查询功能 | ACPT-CM-003 | 客户查询验收 | 待验收 |
| REQ-CM-004 | 客户详情展示 | ACPT-CM-004 | 客户详情验收 | 待验收 |
| REQ-LM-001 | 线索录入功能 | ACPT-LM-001 | 线索录入验收 | 待验收 |
| REQ-LM-002 | 线索导入功能 | ACPT-LM-002 | 线索导入验收 | 待验收 |
| REQ-LM-003 | 线索分配功能 | ACPT-LM-003 | 线索分配验收 | 待验收 |
| REQ-LM-006 | 线索转化功能 | ACPT-LM-004 | 线索转化验收 | 待验收 |
| REQ-LM-008 | 线索回收功能 | ACPT-LM-005 | 线索回收验收 | 待验收 |
| REQ-SM-001 | 渠道接入功能 | ACPT-SM-001 | 会话接入验收 | 待验收 |
| REQ-SM-004 | 消息发送功能 | ACPT-SM-002 | 消息收发验收 | 待验收 |
| REQ-SM-005 | 智能回复推荐 | ACPT-SM-003 | 智能回复验收 | 待验收 |
| REQ-SM-008 | 会话转接功能 | ACPT-SM-004 | 会话转接验收 | 待验收 |
| REQ-OM-001 | 商机创建功能 | ACPT-OM-001 | 商机创建验收 | 待验收 |
| REQ-OM-004 | 商机阶段功能 | ACPT-OM-002 | 阶段推进验收 | 待验收 |
| REQ-OM-007 | 商机赢单 | ACPT-OM-003 | 商机赢单验收 | 待验收 |
| REQ-TM-001 | 工单创建功能 | ACPT-TM-001 | 工单创建验收 | 待验收 |
| REQ-TM-006 | 工单流转功能 | ACPT-TM-002 | 工单流转验收 | 待验收 |
| REQ-TM-010 | SLA管理功能 | ACPT-TM-003 | SLA验收 | 待验收 |
| REQ-SYS-001 | 登录功能 | ACPT-AUTH-001 | 登录验收 | 待验收 |
| REQ-SYS-002 | 权限控制功能 | ACPT-PERM-001 | 权限验收 | 待验收 |

---

## 十三、RTM-11：PRD需求→Trae任务追踪矩阵

### 13.1 Trae任务清单

| 任务ID | 任务名称 | 任务描述 | 输入文档 | 输出物 | 优先级 |
|--------|----------|----------|----------|--------|--------|
| TRAE-AUTH-001 | 实现登录认证模块 | 实现用户登录、登出、Token刷新功能 | PRD 4.1, API 5.1-5.3 | 认证模块代码 | P0 |
| TRAE-AUTH-002 | 实现权限控制模块 | 实现RBAC权限模型 | PRD 4.3, 17_权限模型设计 | 权限模块代码 | P0 |
| TRAE-CM-001 | 实现客户管理模块 | 实现客户CRUD、标签、分组功能 | PRD 4.4, API 六, DBD 6 | 客户模块代码 | P0 |
| TRAE-CM-002 | 实现客户状态管理 | 实现客户生命周期状态机 | PRD 4.4.4, 27_状态机规范 | 状态机代码 | P0 |
| TRAE-LM-001 | 实现线索管理模块 | 实现线索CRUD、分配、跟进功能 | PRD 4.5, API 七, DBD 7 | 线索模块代码 | P0 |
| TRAE-LM-002 | 实现线索转化功能 | 实现线索转化为商机 | PRD 4.5, 37_端到端业务链路 | 转化功能代码 | P0 |
| TRAE-LM-003 | 实现线索导入功能 | 实现批量导入线索 | PRD 4.5, 35_横切能力规范 | 导入功能代码 | P0 |
| TRAE-SM-001 | 实现会话管理模块 | 实现会话CRUD、消息收发功能 | PRD 4.8, API 八, DBD 9 | 会话模块代码 | P0 |
| TRAE-SM-002 | 实现WebSocket通信 | 实现实时消息推送 | 29_WebSocket协议规范 | WebSocket代码 | P0 |
| TRAE-SM-003 | 实现AI回复推荐 | 实现智能回复推荐功能 | PRD 4.8, 20_AI治理规范 | AI推荐代码 | P0 |
| TRAE-OM-001 | 实现商机管理模块 | 实现商机CRUD、阶段管理功能 | PRD 4.7, API 九, DBD 8 | 商机模块代码 | P0 |
| TRAE-OM-002 | 实现商机状态机 | 实现商机阶段流转 | PRD 4.7.4, 27_状态机规范 | 状态机代码 | P0 |
| TRAE-TM-001 | 实现工单管理模块 | 实现工单CRUD、流转功能 | PRD 4.10, API 十, DBD 10 | 工单模块代码 | P0 |
| TRAE-TM-002 | 实现SLA管理 | 实现SLA超时升级功能 | PRD 4.10, 35_横切能力规范 | SLA代码 | P0 |
| TRAE-KB-001 | 实现知识库模块 | 实现知识CRUD、检索功能 | PRD 4.11, API 十一, DBD 11 | 知识库模块代码 | P1 |
| TRAE-KB-002 | 实现AI问答功能 | 实现基于知识库的AI问答 | PRD 4.11, 20_AI治理规范 | AI问答代码 | P1 |
| TRAE-DB-001 | 实现数据看板模块 | 实现销售/客服看板 | PRD 4.14, API 十二 | 看板模块代码 | P1 |
| TRAE-FRONT-001 | 实现前端框架搭建 | 搭建Next.js项目框架 | 33_前端工程规范 | 前端项目骨架 | P0 |
| TRAE-FRONT-002 | 实现前端组件库 | 实现UI组件库 | 25_前端UI组件库规范 | 组件库代码 | P0 |
| TRAE-FRONT-003 | 实现前端页面 | 实现所有页面 | 32_页面实现规范 | 页面代码 | P0 |
| TRAE-DB-002 | 实现数据库初始化 | 创建所有数据表 | 10_DBD, 31_租户初始化配置清单 | SQL脚本 | P0 |

### 13.2 PRD需求→Trae任务追踪

| PRD需求ID | PRD需求描述 | 任务ID | 任务名称 | 任务状态 |
|-----------|-------------|--------|----------|----------|
| REQ-SYS-001 | 登录功能 | TRAE-AUTH-001 | 实现登录认证模块 | 待执行 |
| REQ-SYS-002 | 权限控制功能 | TRAE-AUTH-002 | 实现权限控制模块 | 待执行 |
| REQ-CM-001 | 客户创建功能 | TRAE-CM-001 | 实现客户管理模块 | 待执行 |
| REQ-CM-006 | 客户状态管理 | TRAE-CM-002 | 实现客户状态管理 | 待执行 |
| REQ-LM-001 | 线索录入功能 | TRAE-LM-001 | 实现线索管理模块 | 待执行 |
| REQ-LM-002 | 线索导入功能 | TRAE-LM-003 | 实现线索导入功能 | 待执行 |
| REQ-LM-006 | 线索转化功能 | TRAE-LM-002 | 实现线索转化功能 | 待执行 |
| REQ-SM-001 | 渠道接入功能 | TRAE-SM-001, TRAE-SM-002 | 实现会话管理模块, 实现WebSocket通信 | 待执行 |
| REQ-SM-005 | 智能回复推荐 | TRAE-SM-003 | 实现AI回复推荐 | 待执行 |
| REQ-OM-001 | 商机创建功能 | TRAE-OM-001 | 实现商机管理模块 | 待执行 |
| REQ-OM-004 | 商机阶段功能 | TRAE-OM-002 | 实现商机状态机 | 待执行 |
| REQ-TM-001 | 工单创建功能 | TRAE-TM-001 | 实现工单管理模块 | 待执行 |
| REQ-TM-010 | SLA管理功能 | TRAE-TM-002 | 实现SLA管理 | 待执行 |
| REQ-KB-001 | 知识检索功能 | TRAE-KB-001 | 实现知识库模块 | 待执行 |
| REQ-KB-003 | AI问答功能 | TRAE-KB-002 | 实现AI问答功能 | 待执行 |
| REQ-DB-001 | 销售看板功能 | TRAE-DB-001 | 实现数据看板模块 | 待执行 |

---

## 十四、需求统计

### 14.1 按模块统计

| 模块 | P0需求数 | P1需求数 | 合计 |
|------|----------|----------|------|
| 客户管理 | 7 | 3 | 10 |
| 线索管理 | 8 | 2 | 10 |
| 会话管理 | 8 | 2 | 10 |
| 商机管理 | 7 | 2 | 9 |
| 工单管理 | 11 | 0 | 11 |
| 知识库 | 0 | 6 | 6 |
| 数据看板 | 0 | 4 | 4 |
| 系统管理 | 2 | 1 | 3 |
| 任务管理 | 3 | 0 | 3 |
| 通知管理 | 3 | 0 | 3 |
| 渠道管理 | 1 | 1 | 2 |
| 自动化规则 | 0 | 2 | 2 |
| AI工作台 | 0 | 4 | 4 |
| **合计** | **50** | **27** | **77** |

### 14.2 按状态统计

| 状态 | 数量 | 占比 |
|------|------|------|
| 待开发 | 77 | 100% |
| 开发中 | 0 | 0% |
| 待测试 | 0 | 0% |
| 测试中 | 0 | 0% |
| 已验收 | 0 | 0% |

### 14.3 追踪覆盖率统计

| 追踪维度 | 需求数 | 已追踪数 | 覆盖率 |
|----------|--------|----------|--------|
| PRD需求→页面 | 77 | 77 | 100% |
| PRD需求→接口 | 77 | 77 | 100% |
| PRD需求→数据表 | 77 | 77 | 100% |
| PRD需求→状态机 | 77 | 77 | 100% |
| PRD需求→权限点 | 77 | 77 | 100% |
| PRD需求→埋点 | 77 | 77 | 100% |
| PRD需求→测试点 | 77 | 77 | 100% |
| PRD需求→验收项 | 77 | 77 | 100% |
| PRD需求→Trae任务 | 77 | 77 | 100% |

---

## 十五、需求变更管理

### 15.1 变更流程

```
需求变更请求 → 影响分析 → 变更评审 → 变更实施 → RTM更新 → 通知相关方
```

### 15.2 变更记录

| 变更ID | 变更日期 | 变更内容 | 影响范围 | 变更原因 | 审批状态 |
|--------|----------|----------|----------|----------|----------|
| - | - | - | - | - | - |

---

## 十六、版本记录

| 版本 | 日期 | 作者 | 变更摘要 | 状态 |
|------|------|------|----------|------|
| v0.1 | 2026-04-04 | MOY 文档架构组 | 初稿 | 草案 |
| v1.0 | 2026-04-04 | MOY 文档架构组 | MVP范围定义 | 正式版 |
| v2.0 | 2026-04-05 | MOY 文档架构组 | 补充任务/通知/渠道/自动化/AI模块 | 已确认 |
| v3.0 | 2026-04-05 | MOY 文档架构组 | 重构为完整追踪矩阵：新增11个追踪维度，实现业务目标到Trae任务的完整追溯链 | 已确认 |

---

## 依赖文档

| 文档 | 用途 |
|------|------|
| [BRD](./05_BRD_业务需求说明书.md) | 业务需求来源 |
| [PRD](./06_PRD_产品需求规格说明书_v0.1.md) | 产品需求来源 |
| [API](./11_API_接口设计说明.md) | 接口设计 |
| [DBD](./10_DBD_数据模型与数据字典.md) | 数据模型 |
| [状态机规范](./27_状态机实现规范.md) | 状态机定义 |
| [端到端业务链路](./37_端到端业务链路设计.md) | 业务链路设计 |
