import { RiskLevel } from '../entities/permission.entity';

export const permissionSeeds: Array<{
  permId: string;
  module: string;
  action: string;
  riskLevel: RiskLevel;
  description: string;
}> = [
  { permId: 'PERM-USR-MANAGE', module: 'usr', action: 'manage', riskLevel: RiskLevel.P1, description: '用户与角色管理' },
  { permId: 'PERM-ORG-MANAGE', module: 'org', action: 'manage', riskLevel: RiskLevel.P1, description: '组织、部门、租户初始化' },

  { permId: 'PERM-CM-VIEW', module: 'cm', action: 'view', riskLevel: RiskLevel.P3, description: '客户查看' },
  { permId: 'PERM-CM-CREATE', module: 'cm', action: 'create', riskLevel: RiskLevel.P2, description: '客户新建' },
  { permId: 'PERM-CM-UPDATE', module: 'cm', action: 'update', riskLevel: RiskLevel.P2, description: '客户编辑/联系人维护' },
  { permId: 'PERM-CM-STATUS', module: 'cm', action: 'status', riskLevel: RiskLevel.P1, description: '客户状态变更' },

  { permId: 'PERM-LM-CREATE', module: 'lm', action: 'create', riskLevel: RiskLevel.P2, description: '线索新建' },
  { permId: 'PERM-LM-IMPORT', module: 'lm', action: 'import', riskLevel: RiskLevel.P2, description: '线索批量导入' },
  { permId: 'PERM-LM-ASSIGN', module: 'lm', action: 'assign', riskLevel: RiskLevel.P2, description: '线索分配' },
  { permId: 'PERM-LM-FOLLOW_UP', module: 'lm', action: 'follow_up', riskLevel: RiskLevel.P3, description: '线索跟进' },
  { permId: 'PERM-LM-CONVERT', module: 'lm', action: 'convert', riskLevel: RiskLevel.P1, description: '线索转化' },
  { permId: 'PERM-LM-SCORE', module: 'lm', action: 'score', riskLevel: RiskLevel.P3, description: '线索评分' },
  { permId: 'PERM-LM-RECYCLE', module: 'lm', action: 'recycle', riskLevel: RiskLevel.P2, description: '线索回收' },

  { permId: 'PERM-OM-VIEW', module: 'om', action: 'view', riskLevel: RiskLevel.P3, description: '商机查看' },
  { permId: 'PERM-OM-CREATE', module: 'om', action: 'create', riskLevel: RiskLevel.P2, description: '商机新建' },
  { permId: 'PERM-OM-UPDATE', module: 'om', action: 'update', riskLevel: RiskLevel.P2, description: '商机编辑' },
  { permId: 'PERM-OM-STAGE', module: 'om', action: 'stage', riskLevel: RiskLevel.P1, description: '商机阶段推进' },
  { permId: 'PERM-OM-RESULT', module: 'om', action: 'result', riskLevel: RiskLevel.P1, description: '商机结果标记' },
  { permId: 'PERM-OM-FORECAST', module: 'om', action: 'forecast', riskLevel: RiskLevel.P3, description: '商机预测' },

  { permId: 'PERM-CNV-VIEW', module: 'cnv', action: 'view', riskLevel: RiskLevel.P3, description: '会话查看' },
  { permId: 'PERM-CNV-SEND', module: 'cnv', action: 'send', riskLevel: RiskLevel.P2, description: '会话发送消息' },
  { permId: 'PERM-CNV-ACCEPT', module: 'cnv', action: 'accept', riskLevel: RiskLevel.P2, description: '会话接入' },
  { permId: 'PERM-CNV-TRANSFER', module: 'cnv', action: 'transfer', riskLevel: RiskLevel.P2, description: '会话转接' },
  { permId: 'PERM-CNV-CLOSE', module: 'cnv', action: 'close', riskLevel: RiskLevel.P2, description: '会话关闭' },
  { permId: 'PERM-CNV-CREATE_TICKET', module: 'cnv', action: 'create_ticket', riskLevel: RiskLevel.P2, description: '会话转工单' },
  { permId: 'PERM-CNV-MONITOR', module: 'cnv', action: 'monitor', riskLevel: RiskLevel.P2, description: '会话监控' },
  { permId: 'PERM-CNV-RATE', module: 'cnv', action: 'rate', riskLevel: RiskLevel.P3, description: '会话评价' },

  { permId: 'PERM-TK-VIEW', module: 'tk', action: 'view', riskLevel: RiskLevel.P3, description: '工单查看' },
  { permId: 'PERM-TK-CREATE', module: 'tk', action: 'create', riskLevel: RiskLevel.P2, description: '工单新建' },
  { permId: 'PERM-TK-ASSIGN', module: 'tk', action: 'assign', riskLevel: RiskLevel.P2, description: '工单分配' },
  { permId: 'PERM-TK-START', module: 'tk', action: 'start', riskLevel: RiskLevel.P2, description: '工单开始处理' },
  { permId: 'PERM-TK-RESOLVE', module: 'tk', action: 'resolve', riskLevel: RiskLevel.P2, description: '工单解决' },
  { permId: 'PERM-TK-CLOSE', module: 'tk', action: 'close', riskLevel: RiskLevel.P2, description: '工单关闭' },
  { permId: 'PERM-TK-REOPEN', module: 'tk', action: 'reopen', riskLevel: RiskLevel.P1, description: '工单回开' },
  { permId: 'PERM-TK-SLA', module: 'tk', action: 'sla', riskLevel: RiskLevel.P2, description: '工单SLA管理' },
  { permId: 'PERM-TK-ESCALATE', module: 'tk', action: 'escalate', riskLevel: RiskLevel.P1, description: '工单升级' },

  { permId: 'PERM-TSK-CREATE', module: 'tsk', action: 'create', riskLevel: RiskLevel.P2, description: '任务新建' },
  { permId: 'PERM-TSK-UPDATE', module: 'tsk', action: 'update', riskLevel: RiskLevel.P2, description: '任务编辑' },
  { permId: 'PERM-TSK-STATUS', module: 'tsk', action: 'status', riskLevel: RiskLevel.P2, description: '任务状态变更' },

  { permId: 'PERM-NTF-VIEW', module: 'ntf', action: 'view', riskLevel: RiskLevel.P3, description: '通知查看' },
  { permId: 'PERM-NTF-READ', module: 'ntf', action: 'read', riskLevel: RiskLevel.P3, description: '通知已读' },

  { permId: 'PERM-CHN-VIEW', module: 'chn', action: 'view', riskLevel: RiskLevel.P3, description: '渠道查看' },
  { permId: 'PERM-CHN-MANAGE', module: 'chn', action: 'manage', riskLevel: RiskLevel.P1, description: '渠道管理' },
  { permId: 'PERM-CHN-ROUTE', module: 'chn', action: 'route', riskLevel: RiskLevel.P2, description: '渠道路由' },

  { permId: 'PERM-AI-EXECUTE', module: 'ai', action: 'execute', riskLevel: RiskLevel.P2, description: 'AI执行' },
  { permId: 'PERM-AI-AGENT_MANAGE', module: 'ai', action: 'agent_manage', riskLevel: RiskLevel.P1, description: 'AI Agent管理' },
  { permId: 'PERM-AI-APPROVE', module: 'ai', action: 'approve', riskLevel: RiskLevel.P0, description: 'AI审批' },
  { permId: 'PERM-AI-TAKEOVER', module: 'ai', action: 'takeover', riskLevel: RiskLevel.P0, description: 'AI接管' },
  { permId: 'PERM-AI-ROLLBACK', module: 'ai', action: 'rollback', riskLevel: RiskLevel.P0, description: 'AI回滚' },
  { permId: 'PERM-AI-QUALITY', module: 'ai', action: 'quality', riskLevel: RiskLevel.P2, description: 'AI质量检查' },

  { permId: 'PERM-AUD-VIEW', module: 'aud', action: 'view', riskLevel: RiskLevel.P3, description: '审计查询' },
  { permId: 'PERM-AUD-EXPORT', module: 'aud', action: 'export', riskLevel: RiskLevel.P1, description: '审计导出' },

  { permId: 'PERM-SYS-VIEW', module: 'sys', action: 'view', riskLevel: RiskLevel.P3, description: '仪表盘与系统配置查看' },
  { permId: 'PERM-SYS-MANAGE', module: 'sys', action: 'manage', riskLevel: RiskLevel.P1, description: '仪表盘与系统配置管理' },

  { permId: 'PERM-QT-MANAGE', module: 'qt', action: 'manage', riskLevel: RiskLevel.P2, description: '报价管理（创建、编辑、查看）' },
  { permId: 'PERM-QT-APPROVE', module: 'qt', action: 'approve', riskLevel: RiskLevel.P1, description: '报价审批' },
  { permId: 'PERM-QT-SEND', module: 'qt', action: 'send', riskLevel: RiskLevel.P2, description: '报价发送' },

  { permId: 'PERM-CT-MANAGE', module: 'ct', action: 'manage', riskLevel: RiskLevel.P2, description: '合同管理（创建、编辑、查看）' },
  { permId: 'PERM-CT-APPROVE', module: 'ct', action: 'approve', riskLevel: RiskLevel.P1, description: '合同审批' },
  { permId: 'PERM-CT-SIGN', module: 'ct', action: 'sign', riskLevel: RiskLevel.P0, description: '合同签署' },
  { permId: 'PERM-CT-ARCHIVE', module: 'ct', action: 'archive', riskLevel: RiskLevel.P2, description: '合同归档/到期处理' },

  { permId: 'PERM-ORD-MANAGE', module: 'ord', action: 'manage', riskLevel: RiskLevel.P2, description: '订单管理（创建、编辑、查看）' },
  { permId: 'PERM-ORD-ACTIVATE', module: 'ord', action: 'activate', riskLevel: RiskLevel.P1, description: '订单激活' },

  { permId: 'PERM-PAY-MANAGE', module: 'pay', action: 'manage', riskLevel: RiskLevel.P2, description: '付款管理（创建、查看、作废）' },
  { permId: 'PERM-PAY-CONFIRM', module: 'pay', action: 'confirm', riskLevel: RiskLevel.P0, description: '付款确认/处理（高风险，需审批）' },
  { permId: 'PERM-PAY-REFUND', module: 'pay', action: 'refund', riskLevel: RiskLevel.P0, description: '付款退款' },
  { permId: 'PERM-PAY-RECONCILE', module: 'pay', action: 'reconcile', riskLevel: RiskLevel.P1, description: '付款对账（S3+）' },

  { permId: 'PERM-SUB-MANAGE', module: 'sub', action: 'manage', riskLevel: RiskLevel.P2, description: '订阅管理（创建、编辑、续费、取消）' },
  { permId: 'PERM-SUB-SUSPEND', module: 'sub', action: 'suspend', riskLevel: RiskLevel.P1, description: '订阅暂停' },

  { permId: 'PERM-DLV-VIEW', module: 'dlv', action: 'view', riskLevel: RiskLevel.P3, description: '交付单/实施单查看' },
  { permId: 'PERM-DLV-MANAGE', module: 'dlv', action: 'manage', riskLevel: RiskLevel.P2, description: '交付管理（里程碑、任务、风险、结果）' },
  { permId: 'PERM-DLV-ACCEPT', module: 'dlv', action: 'accept', riskLevel: RiskLevel.P1, description: '交付验收记录与结果确认' },

  { permId: 'PERM-CSM-VIEW', module: 'csm', action: 'view', riskLevel: RiskLevel.P3, description: '客户健康度与成功计划查看' },
  { permId: 'PERM-CSM-MANAGE', module: 'csm', action: 'manage', riskLevel: RiskLevel.P2, description: '客户成功管理（健康评估、成功计划、回访）' },

  { permId: 'PERM-AUTO-MANAGE', module: 'auto', action: 'manage', riskLevel: RiskLevel.P2, description: '自动化触发器管理（创建、编辑、启停）' },
  { permId: 'PERM-AUTO-EXECUTE', module: 'auto', action: 'execute', riskLevel: RiskLevel.P1, description: '自动化触发器手动执行' },

  { permId: 'PERM-DASH-VIEW', module: 'dash', action: 'view', riskLevel: RiskLevel.P3, description: '经营驾驶舱查看' },
  { permId: 'PERM-DASH-MANAGE', module: 'dash', action: 'manage', riskLevel: RiskLevel.P2, description: '经营驾驶舱指标管理' },
];
