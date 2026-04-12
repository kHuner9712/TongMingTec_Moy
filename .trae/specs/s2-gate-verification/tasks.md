# S2 差距整改任务清单

## P0：阻塞 S2 阶段完成

- [ ] Task 1: S2 模块审计日志集成（S2-GAP-007）
  - [ ] 1.1: 在 qt.service.ts 中注入 AudService，为 create/update/submitApproval/approve/reject/send/delete 方法增加 createLog() 调用
  - [ ] 1.2: 在 ct.service.ts 中注入 AudService，为 create/update/submitApproval/approve/reject/sign/activate/terminate 方法增加 createLog() 调用
  - [ ] 1.3: 在 ord.service.ts 中注入 AudService，为 create/confirm/activate/complete/cancel 方法增加 createLog() 调用
  - [ ] 1.4: 在 pay.service.ts 中注入 AudService，为 create/process/succeed/fail/refund/void 方法增加 createLog() 调用
  - [ ] 1.5: 补充审计日志相关单元测试

- [ ] Task 2: 付款确认→订单激活联动（S2-GAP-002）
  - [ ] 2.1: 创建 PaymentEventHandler，订阅 payment.status_changed(succeeded) 事件
  - [ ] 2.2: 在 PaymentEventHandler 中实现 approval 流程触发（创建 AiApprovalRequest）
  - [ ] 2.3: 审批通过后调用 OrdService.activateOrder()，含状态机校验和版本控制
  - [ ] 2.4: 补充联动相关单元测试和集成测试

- [ ] Task 3: 高风险动作强制 approval 模式（S2-GAP-009）
  - [ ] 3.1: 在 ct.service.ts sign 方法中增加 approval 前置校验，未审批通过则拒绝签署
  - [ ] 3.2: 在 ord.service.ts confirm 方法中增加 approval 前置校验
  - [ ] 3.3: 在 pay.service.ts succeed 方法中增加 approval 前置校验
  - [ ] 3.4: 补充高风险动作审批强制校验的单元测试

- [ ] Task 4: APC/TKC/RBC 升级至 workflow_ready（S2-GAP-008）
  - [ ] 4.1: APC 增加跨模块审批联动（支持 QT/CT/ORD/PAY 审批请求创建和状态同步）
  - [ ] 4.2: APC 增加 S2 高风险动作审批模板（合同签署/订单确认/付款确认）
  - [ ] 4.3: TKC 增加 S2 场景接管流程（合同/订单/付款相关 AI 接管）
  - [ ] 4.4: RBC 增加 S2 场景回滚流程（合同/订单/付款相关 AI 回滚）
  - [ ] 4.5: 补充 APC/TKC/RBC workflow_ready 相关测试

- [ ] Task 5: SUB 订阅模块实现（S2-GAP-001）
  - [ ] 5.1: 创建 subscription.entity.ts + order-item 关联，含 org_id 多租户隔离
  - [ ] 5.2: 创建 subscription.sm.ts 状态机（trial/active/overdue/suspended/expired/cancelled）
  - [ ] 5.3: 创建 subscription-events.ts 领域事件
  - [ ] 5.4: 创建 sub.service.ts（开通/暂停/恢复/取消 + 状态机校验 + 乐观锁）
  - [ ] 5.5: 创建 sub.controller.ts（CRUD + 状态变更 API）
  - [ ] 5.6: 在 permission.seed.ts 中增加 PERM-SUB-CREATE/VIEW/MANAGE/RENEW/SUSPEND
  - [ ] 5.7: 创建订单激活→订阅开通联动（OrderEventHandler 订阅 order.status_changed(active)）
  - [ ] 5.8: 创建前端 Subscriptions.tsx + SubscriptionDetail.tsx 页面
  - [ ] 5.9: 创建 frontend/src/services/subscription.ts API 封装
  - [ ] 5.10: 补充 SUB 模块单元测试

- [ ] Task 6: CSM 客户成功模块实现（S2-GAP-003）
  - [ ] 6.1: 创建 customer-health-score.entity.ts + success-plan.entity.ts + visit-record.entity.ts
  - [ ] 6.2: 创建 csm.service.ts（健康度评估/成功计划CRUD/回访记录/续费提醒查询）
  - [ ] 6.3: 创建 csm.controller.ts
  - [ ] 6.4: 在 permission.seed.ts 中增加 PERM-CSM-VIEW/MANAGE/RENEW
  - [ ] 6.5: 创建前端 CustomerSuccess.tsx 页面
  - [ ] 6.6: 创建 frontend/src/services/customer-success.ts API 封装
  - [ ] 6.7: 补充 CSM 模块单元测试

## P1：高优先但不绝对阻塞

- [ ] Task 7: ORD/PAY 升级至 workflow_ready（S2-GAP-013）
  - [ ] 7.1: 修复 S2-GAP-002 后验证 ORD/PAY 跨模块关联可走通
  - [ ] 7.2: 在 ord.service.ts findOrders 中增加 dataScope 支持（self/team/org）
  - [ ] 7.3: 更新 02 文档中 ORD/PAY 成熟度标注为 workflow_ready

- [ ] Task 8: KB 知识库模块实现（S2-GAP-004）
  - [ ] 8.1: 创建 knowledge-category.entity.ts + knowledge-item.entity.ts
  - [ ] 8.2: 创建 knowledge_item.sm.ts 状态机（draft/published/archived）
  - [ ] 8.3: 创建 kb.service.ts（分类CRUD/条目CRUD/审核/搜索/AI问答）
  - [ ] 8.4: 创建 kb.controller.ts
  - [ ] 8.5: 在 permission.seed.ts 中增加 PERM-KB-READ/MANAGE/AUDIT
  - [ ] 8.6: 创建前端 Knowledge.tsx + KnowledgeManage.tsx 页面
  - [ ] 8.7: 创建 frontend/src/services/knowledge.ts API 封装
  - [ ] 8.8: 补充 KB 模块单元测试

- [ ] Task 9: AUTO 触发式自动化模块实现（S2-GAP-005）
  - [ ] 9.1: 创建 automation-flow.entity.ts + automation-run.entity.ts + automation-step.entity.ts
  - [ ] 9.2: 创建 automation_flow.sm.ts 状态机（draft/active/paused/archived）
  - [ ] 9.3: 创建 auto.service.ts（流程CRUD/启用暂停/事件触发执行/失败重试）
  - [ ] 9.4: 创建 auto.controller.ts
  - [ ] 9.5: 在 permission.seed.ts 中增加 PERM-AUTO-MANAGE/VIEW/EXECUTE
  - [ ] 9.6: 实现成交链路自动化触发器（opportunity.won→创建报价 suggest、contract.signed→创建订单 assist、payment.succeeded→激活订单 approval、order.activated→开通订阅 approval）
  - [ ] 9.7: 创建前端 Automation.tsx 页面
  - [ ] 9.8: 创建 frontend/src/services/automation.ts API 封装
  - [ ] 9.9: 补充 AUTO 模块单元测试

- [ ] Task 10: DASH 驾驶舱增强（S2-GAP-006）
  - [ ] 10.1: 创建 dash 模块或扩展 ai-runtime，实现 API-DASH-001（销售看板数据聚合）
  - [ ] 10.2: 实现 API-DASH-002（服务看板数据聚合）
  - [ ] 10.3: 创建前端 SalesDashboard.tsx 页面（PAGE-DASH-001）
  - [ ] 10.4: 创建前端 ServiceDashboard.tsx 页面（PAGE-DASH-002）
  - [ ] 10.5: 在 permission.seed.ts 中增加 PERM-DASH-VIEW
  - [ ] 10.6: 补充 DASH 模块测试

- [ ] Task 11: TimelineService 订阅 S2 事件（S2-GAP-010）
  - [ ] 11.1: 在 timeline.service.ts 中增加 quote.status_changed 事件订阅
  - [ ] 11.2: 增加 contract.status_changed 事件订阅
  - [ ] 11.3: 增加 order.status_changed 事件订阅
  - [ ] 11.4: 增加 payment.status_changed 事件订阅
  - [ ] 11.5: 补充时间线 S2 事件相关测试

- [ ] Task 12: S2 权限种子补齐（S2-GAP-011）
  - [ ] 12.1: 在 permission.seed.ts 中增加 PERM-SUB-* 权限定义
  - [ ] 12.2: 增加 PERM-CSM-* 权限定义
  - [ ] 12.3: 增加 PERM-KB-* 权限定义
  - [ ] 12.4: 增加 PERM-DASH-* 权限定义
  - [ ] 12.5: 增加 PERM-AUTO-* 权限定义
  - [ ] 12.6: 将新权限分配给对应角色（ADMIN/CSM_MANAGER/AI_OPERATOR 等）

- [ ] Task 13: S2 前端页面补齐（S2-GAP-018）
  - [ ] 13.1: 实现 Subscriptions.tsx + SubscriptionDetail.tsx
  - [ ] 13.2: 实现 Knowledge.tsx + KnowledgeManage.tsx
  - [ ] 13.3: 实现 CustomerSuccess.tsx
  - [ ] 13.4: 实现 SalesDashboard.tsx + ServiceDashboard.tsx
  - [ ] 13.5: 实现 Automation.tsx + AutomationDetail.tsx
  - [ ] 13.6: 在 App.tsx 中增加 S2 路由配置
  - [ ] 13.7: 补充前端页面测试

- [ ] Task 14: E2E 测试实现（S2-GAP-012）
  - [ ] 14.1: 创建 e2e/s2/ 目录结构
  - [ ] 14.2: 实现 ACPT-E2E-001 成交全链路测试
  - [ ] 14.3: 实现 ACPT-E2E-002 成交链路权限验证
  - [ ] 14.4: 实现 ACPT-E2E-003 成交链路审计验证
  - [ ] 14.5: 实现 ACPT-E2E-004 成交链路多租户隔离
  - [ ] 14.6: 实现 ACPT-QT-001/CT-001/ORD-001/PAY-001/SUB-001 模块级验收测试

## P2：建议补齐

- [ ] Task 15: 驾驶舱 S2 商业化指标（S2-GAP-014）
  - [ ] 15.1: 在 getCockpitData 中增加报价金额/合同金额/回款率/成交转化率聚合
  - [ ] 15.2: 在 Cockpit.tsx 中增加 S2 指标卡片

- [ ] Task 16: 合同文档上传 API（S2-GAP-015）
  - [ ] 16.1: 在 ct.controller.ts 增加 POST /contracts/{id}/documents
  - [ ] 16.2: 增加 GET /contracts/{id}/documents
  - [ ] 16.3: 增加 DELETE /contracts/{id}/documents/{docId}
  - [ ] 16.4: 在 ContractDetail.tsx 中增加文档上传/管理 UI

- [ ] Task 17: 状态机回退流转（S2-GAP-016）
  - [ ] 17.1: 在 quote.sm.ts 中增加 rejected→draft 合法迁移
  - [ ] 17.2: 在 contract.sm.ts 中增加 rejected→draft 合法迁移
  - [ ] 17.3: 在 qt.service.ts 中增加 resubmit 方法
  - [ ] 17.4: 在 ct.service.ts 中增加 resubmit 方法
  - [ ] 17.5: 补充回退流转测试

- [ ] Task 18: ORD dataScope 支持（S2-GAP-017）
  - [ ] 18.1: 在 ord.service.ts findOrders 中增加 dataScope 参数处理
  - [ ] 18.2: 补充 dataScope 相关测试

# Task Dependencies

- Task 2 (付款→激活联动) → Task 7 (ORD/PAY workflow_ready)：Task 7 依赖 Task 2 完成后才能验证
- Task 5 (SUB 实现) → Task 2 (付款→激活联动)：SUB 开通依赖订单激活联动
- Task 5 (SUB 实现) → Task 6 (CSM 实现)：CSM 续费提醒依赖 SUB 数据
- Task 9 (AUTO 实现) → Task 5 (SUB 实现)：自动化触发器中 order.activated→开通订阅依赖 SUB
- Task 11 (Timeline S2 事件) → Task 1 (审计集成)：Timeline 事件写入依赖审计格式一致
- Task 12 (权限种子) → Task 5/6/8/9/10：新模块的权限种子需在模块实现时同步完成
- Task 13 (前端页面) → Task 5/6/8/9/10：前端页面依赖后端 API 就绪
- Task 14 (E2E 测试) → Task 1-13 全部：E2E 测试依赖所有模块和联动就绪
