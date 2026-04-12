# S2 阶段门禁验收 Checklist

## A. 阶段目标

- [ ] 成交与成交后衔接主干：QT→CT→ORD→PAY→SUB 全链路可走通，付款确认后订单自动激活，订阅可开通
- [ ] 最小交易闭环：商机赢单→报价→合同→订单→付款→激活→订阅，无断裂点
- [ ] 客户成功与知识支撑增强：CSM 健康度评估+续费提醒可用，KB 知识检索+AI问答可用
- [ ] 驾驶舱增强：销售看板+服务看板+经营驾驶舱独立页面存在且数据正确
- [ ] 自动化主干受控落地：AUTO 触发式自动化可创建/启用/事件触发执行/失败重试

## B. 必须完成能力

- [ ] QT 报价管理达到 workflow_ready：CRUD+审批+发送+版本管理+审计完整
- [ ] CT 合同管理达到 workflow_ready：CRUD+审批+签署+终止+文档管理+审计完整
- [ ] ORD 订单管理达到 workflow_ready：CRUD+确认+激活+取消+付款联动+dataScope+审计
- [ ] PAY 付款确认达到 workflow_ready：CRUD+处理+确认+退款+订单联动+审计
- [ ] SUB 订阅达到 crud_ready：开通+暂停+恢复+取消+基础状态管理
- [ ] CSM 客户成功达到 crud_ready：健康度评估+成功计划+回访+续费提醒
- [ ] KB 知识库达到 crud_ready：分类+条目CRUD+审核+搜索+AI问答
- [ ] DASH 驾驶舱达到 crud_ready：销售看板+服务看板+指标快照
- [ ] AUTO 触发式自动化达到 crud_ready：流程创建+启用暂停+事件触发+失败重试

## C. 核心端到端链路

- [ ] 商机赢单→创建报价→审批→发送→创建合同→审批→签署：全链路可 UI 操作完成
- [ ] 合同签署→创建订单→确认→创建付款→付款确认→订单激活→开通订阅：全链路可 UI 操作完成
- [ ] 订阅开通→自动纳入客户成功→健康度评估→续费提醒：全链路可走通
- [ ] 成交链路状态变更进入驾驶舱
- [ ] 成交链路事件可触发自动化主干（suggest/assist/approval 模式，严禁 auto）

## D. 模块成熟度达标

- [ ] QT: workflow_ready（已达标，待审计集成确认）
- [ ] CT: workflow_ready（已达标，待审计集成确认）
- [ ] ORD: workflow_ready（当前 crud_ready，需升级）
- [ ] PAY: workflow_ready（当前 crud_ready，需升级）
- [ ] SUB: crud_ready（当前 skeleton，需实现）
- [ ] CSM: crud_ready（当前 skeleton，需实现）
- [ ] KB: crud_ready（当前 skeleton，需实现）
- [ ] DASH: crud_ready（当前 skeleton，需实现）
- [ ] AUTO: crud_ready（当前 skeleton，需实现）
- [ ] APC: workflow_ready（当前 crud_ready，需升级）
- [ ] TKC: workflow_ready（当前 crud_ready，需升级）
- [ ] RBC: workflow_ready（当前 crud_ready，需升级）

## E. AI 执行治理

- [ ] suggest + assist + approval 模式在 S2 场景下可用
- [ ] S2 严禁 auto 模式，代码中无 S2 场景下的 auto 执行路径
- [ ] 合同签署必须经过 approval 审批后才可执行
- [ ] 订单确认必须经过 approval 审批后才可执行
- [ ] 付款确认必须经过 approval 审批后才可执行
- [ ] 审批中心达到 workflow_ready，支持跨模块审批联动
- [ ] 接管中心达到 workflow_ready，支持 S2 场景接管
- [ ] 回滚中心达到 workflow_ready，支持 S2 场景回滚
- [ ] Agent Registry 支持 activate/pause/archive（已实现，确认即可）
- [ ] 所有 AI 动作写入审计日志

## F. 数据与结果指标

- [ ] 首响时间可从驾驶舱查看
- [ ] 线索漏跟进率可从驾驶舱查看
- [ ] 会话转商机率可采集
- [ ] 报价/合同周转时间可采集
- [ ] 成交转化率可采集
- [ ] 工单首次解决率/SLA达标率可从驾驶舱查看

## G. 权限与组织协作

- [ ] PERM-QT-* 权限已定义并分配给对应角色
- [ ] PERM-CT-* 权限已定义并分配给对应角色
- [ ] PERM-ORD-* 权限已定义并分配给对应角色
- [ ] PERM-PAY-* 权限已定义并分配给对应角色
- [ ] PERM-SUB-* 权限已定义并分配给对应角色
- [ ] PERM-CSM-* 权限已定义并分配给对应角色
- [ ] PERM-KB-* 权限已定义并分配给对应角色
- [ ] PERM-DASH-* 权限已定义并分配给对应角色
- [ ] PERM-AUTO-* 权限已定义并分配给对应角色
- [ ] S2 新增角色（MARKETING_MANAGER/CSM_MANAGER/AI_OPERATOR）权限完整

## H. 测试与验收

- [ ] QT 单元测试通过（qt.service.spec.ts）
- [ ] CT 单元测试通过（ct.service.spec.ts）
- [ ] ORD 单元测试通过（ord.service.spec.ts）
- [ ] PAY 单元测试通过（pay.service.spec.ts）
- [ ] SUB 单元测试通过
- [ ] CSM 单元测试通过
- [ ] KB 单元测试通过
- [ ] DASH 单元测试通过
- [ ] AUTO 单元测试通过
- [ ] APC/TKC/RBC 升级后测试通过
- [ ] S2 成交链路 E2E 可 UI 操作完成
- [ ] 高风险动作未经审批不可落地
- [ ] 审批/接管/回滚流程可走通
- [ ] S2 must_for_release=Y 的 REQ 全部通过 ACPT
- [ ] 多租户隔离验证通过（S2 模块）
