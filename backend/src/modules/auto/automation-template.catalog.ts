export interface AutomationTemplateDefinition {
  code: string;
  name: string;
  description: string;
  category: 'contract' | 'delivery' | 'sales' | 'service';
  triggerEventType: string;
  triggerCondition?: Record<string, unknown>;
  recommended: boolean;
  steps: Array<{
    code: string;
    actionType: string;
    payload?: Record<string, unknown>;
    requiresApproval?: boolean;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
  }>;
}

export const RESULT_CHAIN_TEMPLATES: AutomationTemplateDefinition[] = [
  {
    code: 'tpl_contract_expiry_to_csm_followup',
    name: '合同到期预警 -> CSM跟进任务',
    description:
      '合同到期预警触发后，自动创建 CSM 跟进任务并通知负责人。',
    category: 'contract',
    triggerEventType: 'contract.expiry_warning',
    recommended: true,
    steps: [
      {
        code: 'create_followup_task',
        actionType: 'create_csm_followup_task',
        payload: {
          title: '合同到期自动跟进',
          sourceType: 'contract.expiry_warning',
        },
        riskLevel: 'medium',
      },
    ],
  },
  {
    code: 'tpl_dlv_high_risk_to_csm',
    name: 'DLV高风险 -> 通知+写入CSM风险视图',
    description:
      '交付风险达到高等级时，自动通知负责人并写入 CSM 风险视图，动作需审批确认。',
    category: 'delivery',
    triggerEventType: 'delivery.risk_reported',
    triggerCondition: {
      severity: 'high',
      status: 'open',
    },
    recommended: true,
    steps: [
      {
        code: 'notify_owner',
        actionType: 'send_notification',
        payload: {
          title: '交付高风险预警',
        },
        riskLevel: 'medium',
      },
      {
        code: 'append_csm_risk_signal',
        actionType: 'append_csm_risk_signal',
        payload: {
          sourceType: 'delivery.risk_reported',
        },
        requiresApproval: true,
        riskLevel: 'high',
      },
    ],
  },
  {
    code: 'tpl_lead_missed_followup_alert',
    name: '线索漏跟进率异常 -> 自动提醒负责人',
    description:
      '经营指标中线索漏跟进率异常时，自动提醒责任人并记录运行证据。',
    category: 'sales',
    triggerEventType: 'dash.metric_anomaly',
    triggerCondition: {
      metricKey: 'lead_missed_followup_rate',
    },
    recommended: true,
    steps: [
      {
        code: 'notify_sales_owner',
        actionType: 'send_notification',
        payload: {
          title: '线索漏跟进率异常提醒',
        },
        riskLevel: 'low',
      },
    ],
  },
  {
    code: 'tpl_first_response_attention',
    name: '首响时间异常 -> 生成服务关注项',
    description:
      '当首响时间异常时，自动生成服务关注项任务并通知责任人。',
    category: 'service',
    triggerEventType: 'dash.metric_anomaly',
    triggerCondition: {
      metricKey: 'first_response_time',
    },
    recommended: true,
    steps: [
      {
        code: 'create_service_attention',
        actionType: 'create_service_attention',
        payload: {
          title: '首响异常服务关注项',
        },
        riskLevel: 'medium',
      },
    ],
  },
];

export const TEMPLATE_CODES = RESULT_CHAIN_TEMPLATES.map((item) => item.code);

