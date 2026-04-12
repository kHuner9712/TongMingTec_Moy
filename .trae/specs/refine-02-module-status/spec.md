# 02 业务域与模块树表述修正 Spec

## Why

当前 02_业务域与模块树.md 的模块状态描述不够精确，无法清晰表达"下一阶段开发主轴"。需要区分已实现基线模块、已定义未实现模块、下一阶段优先实现模块，并对 QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO 逐项补充当前状态、下一阶段原因、与已实现模块的直接依赖。

## What Changes

- **第6节"模块与阶段关系"**：重写为更精细的状态分类，明确区分已实现/已定义未实现/下一阶段主轴
- **新增第6.1节"下一阶段主轴模块"**：逐项列出 QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO 的当前状态、下一阶段原因、直接依赖
- **第3节"模块编码总表"**：对 AUTO 模块说明修正，从"营销自动化"扩展为"营销自动化 + 触发式自动化主干"
- **商业化域表述**：修正"商业化域"中 ORD/PAY/SUB 的阶段位置表达，使其符合"全链路主干优先"立场

## Impact

- Affected specs: 仅 02_业务域与模块树.md
- Affected code: 无代码变更
- 不得与 01（阶段定义）、03（REQ 阶段归属）、11（S2 最小内核+S3 完整商业化）的事实冲突

## ADDED Requirements

### Requirement: 下一阶段主轴模块逐项说明

系统 SHALL 在 02 文档中新增"下一阶段主轴模块"小节，对以下 9 个模块逐项补充：

1. QT：当前状态=specified，下一阶段原因=从商机延伸到成交的必要环节，直接依赖=OM/CM/USR
2. CT：当前状态=specified，下一阶段原因=从报价延伸到合同签署的必要环节，直接依赖=OM/QT/CM/USR
3. ORD：当前状态=specified，下一阶段原因=从合同延伸到订单确认的成交后衔接主干，直接依赖=CT/QT/CM
4. PAY：当前状态=specified，下一阶段原因=从订单延伸到付款确认的成交后衔接主干，直接依赖=ORD/BILL
5. SUB：当前状态=specified，下一阶段原因=从订单延伸到服务开通的成交后衔接主干，直接依赖=PLAN/ORD/ORG
6. CSM：当前状态=specified，下一阶段原因=支撑成交后客户持续经营，直接依赖=CM/OM/CT/SUB/BILL
7. KB：当前状态=specified，下一阶段原因=支撑 AI 问答与知识复用，直接依赖=ORG/USR
8. DASH：当前状态=specified，下一阶段原因=支撑经营决策与成交后运营可视化，直接依赖=CM/LM/OM/TK/CSM/BILL
9. AUTO：当前状态=specified，下一阶段原因=支撑触发式自动化与成交链路自动衔接，直接依赖=CM/LM/CHN/NTF

#### Scenario: 下一阶段主轴模块清晰可追踪

- **WHEN** 读者查看 02 文档
- **THEN** 可清晰区分已实现基线模块和下一阶段主轴模块
- **AND** 每个主轴模块的当前状态、推进原因、直接依赖一目了然

### Requirement: 成交后衔接主干强调

系统 SHALL 在文档中明确强调：
- QT/CT/ORD/PAY/SUB 是从商机延伸到成交及成交后服务开通的主干
- CSM/KB/DASH/AUTO 是支撑成交后经营与持续交付的关键模块

## MODIFIED Requirements

### Requirement: 模块与阶段关系重写

原第6节将模块分为5行粗粒度分类，修改为3大类+逐项展开：
- 已实现基线模块（S1）
- 下一阶段主轴模块（S2，逐项展开）
- 后续阶段模块（S3/S4）

### Requirement: AUTO 模块说明修正

原 AUTO 说明"活动、分群、流程、自动触达"，修改为"活动、分群、流程、自动触达 + 触发式自动化主干（事件驱动、节点执行）"

## REMOVED Requirements

无移除需求。
