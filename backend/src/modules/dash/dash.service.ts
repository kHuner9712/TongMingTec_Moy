import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { MetricSnapshot } from './entities/metric-snapshot.entity';
import { Lead } from '../lm/entities/lead.entity';
import { Conversation } from '../cnv/entities/conversation.entity';
import { Contract } from '../ct/entities/contract.entity';
import { Order } from '../ord/entities/order.entity';
import { Ticket } from '../tk/entities/ticket.entity';

export type DashboardRange = '7d' | '30d' | '90d';
export type DashboardBoardType = 'executive' | 'sales' | 'service';

type MetricUnit = 'minutes' | 'hours' | 'percent';
type MetricDirection = 'higher_is_better' | 'lower_is_better';
type MetricStatus = 'healthy' | 'warning' | 'critical' | 'insufficient_data';
type MetricTrend = 'up' | 'down' | 'flat';
type MetricPerformance = 'improved' | 'worsened' | 'stable';
type DataQuality = 'ready' | 'proxy' | 'missing';

type IndicatorKey =
  | 'first_response_time'
  | 'lead_missed_followup_rate'
  | 'conversation_to_opportunity_rate'
  | 'quote_contract_cycle_time'
  | 'post_deal_handover_time'
  | 'ticket_first_resolution_rate'
  | 'ticket_sla_compliance_rate';

interface TimeWindowSide {
  startAt: Date;
  endAt: Date;
  label: string;
}

interface DashboardWindow {
  current: TimeWindowSide;
  previous: TimeWindowSide;
}

interface MetricStat {
  value: number;
  sampleSize: number;
  coverage?: number;
}

interface DashboardActionSuggestion {
  code: string;
  title: string;
  description: string;
  ownerModule: string;
}

interface DashboardMetricSource {
  modules: string[];
  tables: string[];
  fields: string[];
  formula: string;
  description: string;
  dataQuality: DataQuality;
  governanceNotes: string[];
}

interface DashboardIndicator {
  key: IndicatorKey;
  name: string;
  unit: MetricUnit;
  direction: MetricDirection;
  threshold: {
    warning: number;
    critical: number;
  };
  currentValue: number;
  previousValue: number;
  deltaValue: number;
  currentLabel: string;
  previousLabel: string;
  trend: MetricTrend;
  performance: MetricPerformance;
  status: MetricStatus;
  sampleSize: number;
  source: DashboardMetricSource;
  anomalyActions: DashboardActionSuggestion[];
}

interface DashboardIndicatorGroup {
  key: string;
  name: string;
  description: string;
  metricKeys: IndicatorKey[];
}

interface DashboardAnomaly {
  indicatorKey: IndicatorKey;
  indicatorName: string;
  status: MetricStatus;
  currentLabel: string;
  sampleSize: number;
  reason: string;
  suggestedActions: DashboardActionSuggestion[];
}

interface DashboardModuleCoverage {
  module: string;
  covered: boolean;
  indicatorKeys: IndicatorKey[];
}

interface DashboardBoardResponse {
  board: DashboardBoardType;
  orgId: string;
  range: DashboardRange;
  generatedAt: string;
  window: {
    current: { startAt: string; endAt: string; label: string };
    previous: { startAt: string; endAt: string; label: string };
  };
  indicators: DashboardIndicator[];
  groups: DashboardIndicatorGroup[];
  anomalies: DashboardAnomaly[];
  dataGovernance: {
    computable: IndicatorKey[];
    proxy: IndicatorKey[];
    missing: IndicatorKey[];
  };
  moduleCoverage: DashboardModuleCoverage[];
}

interface IndicatorDefinition {
  name: string;
  unit: MetricUnit;
  direction: MetricDirection;
  threshold: {
    warning: number;
    critical: number;
  };
  source: DashboardMetricSource;
  actions: DashboardActionSuggestion[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

const REQUIRED_MODULES: string[] = [
  'LM',
  'CNV',
  'OM',
  'QT',
  'CT',
  'ORD',
  'SUB',
  'TK',
  'CSM',
];

const RANGE_DAYS: Record<DashboardRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const BOARD_GROUPS: Record<DashboardBoardType, DashboardIndicatorGroup[]> = {
  executive: [
    {
      key: 'first_response',
      name: '首响时间',
      description: '会话首次响应效率',
      metricKeys: ['first_response_time'],
    },
    {
      key: 'lead_leak',
      name: '线索漏跟进率',
      description: '开放线索漏跟进比例',
      metricKeys: ['lead_missed_followup_rate'],
    },
    {
      key: 'conversation_to_opportunity',
      name: '会话转商机率',
      description: '会话到商机的转化效率',
      metricKeys: ['conversation_to_opportunity_rate'],
    },
    {
      key: 'quote_contract_cycle',
      name: '报价/合同周转时间',
      description: '报价发出到合同激活时长',
      metricKeys: ['quote_contract_cycle_time'],
    },
    {
      key: 'post_deal_handover',
      name: '成交后开通/交接时间',
      description: '订单激活到开通/交接启动时长',
      metricKeys: ['post_deal_handover_time'],
    },
    {
      key: 'ticket_quality',
      name: '工单首次解决率 / SLA 达标率',
      description: '服务交付质量双指标',
      metricKeys: [
        'ticket_first_resolution_rate',
        'ticket_sla_compliance_rate',
      ],
    },
  ],
  sales: [
    {
      key: 'lead_leak',
      name: '线索漏跟进率',
      description: '开放线索漏跟进比例',
      metricKeys: ['lead_missed_followup_rate'],
    },
    {
      key: 'conversation_to_opportunity',
      name: '会话转商机率',
      description: '会话到商机的转化效率',
      metricKeys: ['conversation_to_opportunity_rate'],
    },
    {
      key: 'quote_contract_cycle',
      name: '报价/合同周转时间',
      description: '报价发出到合同激活时长',
      metricKeys: ['quote_contract_cycle_time'],
    },
    {
      key: 'post_deal_handover',
      name: '成交后开通/交接时间',
      description: '订单激活到开通/交接启动时长',
      metricKeys: ['post_deal_handover_time'],
    },
  ],
  service: [
    {
      key: 'first_response',
      name: '首响时间',
      description: '会话首次响应效率',
      metricKeys: ['first_response_time'],
    },
    {
      key: 'ticket_quality',
      name: '工单首次解决率 / SLA 达标率',
      description: '服务交付质量双指标',
      metricKeys: [
        'ticket_first_resolution_rate',
        'ticket_sla_compliance_rate',
      ],
    },
  ],
};

const INDICATOR_DEFINITIONS: Record<IndicatorKey, IndicatorDefinition> = {
  first_response_time: {
    name: '首响时间',
    unit: 'minutes',
    direction: 'lower_is_better',
    threshold: { warning: 15, critical: 60 },
    source: {
      modules: ['CNV'],
      tables: ['conversations'],
      fields: ['created_at', 'first_response_at', 'org_id'],
      formula: 'AVG(first_response_at - created_at)',
      description: '统计会话创建到首次响应的平均分钟数。',
      dataQuality: 'ready',
      governanceNotes: [],
    },
    actions: [
      {
        code: 'cnv_staffing_rebalance',
        title: '建议增加接待人力',
        description: '高峰时段增派接待，降低排队会话积压。',
        ownerModule: 'CNV',
      },
      {
        code: 'cnv_auto_accept',
        title: '建议启用自动接待策略',
        description: '将高优先级会话自动分配给在线坐席。',
        ownerModule: 'AUTO',
      },
    ],
  },
  lead_missed_followup_rate: {
    name: '线索漏跟进率',
    unit: 'percent',
    direction: 'lower_is_better',
    threshold: { warning: 20, critical: 35 },
    source: {
      modules: ['LM'],
      tables: ['leads'],
      fields: ['status', 'created_at', 'last_follow_up_at', 'org_id'],
      formula: '漏跟进开放线索 / 开放线索',
      description: '统计超过48小时未跟进的开放线索占比。',
      dataQuality: 'ready',
      governanceNotes: [],
    },
    actions: [
      {
        code: 'lm_followup_reminder',
        title: '建议触发自动提醒',
        description: '对超过48小时未跟进线索自动推送提醒。',
        ownerModule: 'AUTO',
      },
      {
        code: 'lm_owner_reassignment',
        title: '建议重分配线索池',
        description: '将积压线索分配给空闲销售，缩短等待时间。',
        ownerModule: 'LM',
      },
    ],
  },
  conversation_to_opportunity_rate: {
    name: '会话转商机率',
    unit: 'percent',
    direction: 'higher_is_better',
    threshold: { warning: 12, critical: 6 },
    source: {
      modules: ['CNV', 'OM'],
      tables: ['conversations', 'opportunities'],
      fields: [
        'conversations.customer_id',
        'conversations.created_at',
        'opportunities.customer_id',
        'opportunities.created_at',
      ],
      formula: '14天内由会话客户创建商机的会话数 / 有客户标识会话数',
      description: '基于客户维度关联，评估会话向商机推进效率。',
      dataQuality: 'proxy',
      governanceNotes: [
        '当前使用 customer_id + 14天窗口推断，缺少 conversation_id -> opportunity_id 的强归因字段。',
      ],
    },
    actions: [
      {
        code: 'om_playbook_trigger',
        title: '建议启用会话转商机剧本',
        description: '在会话关键意图触发商机创建引导。',
        ownerModule: 'OM',
      },
      {
        code: 'lm_cnv_handoff_review',
        title: '建议复盘会话转交质量',
        description: '聚焦高价值会话的转交话术与资格判断。',
        ownerModule: 'CNV',
      },
    ],
  },
  quote_contract_cycle_time: {
    name: '报价/合同周转时间',
    unit: 'hours',
    direction: 'lower_is_better',
    threshold: { warning: 72, critical: 168 },
    source: {
      modules: ['QT', 'CT'],
      tables: ['quotes', 'contracts'],
      fields: ['quotes.sent_at', 'contracts.signed_at', 'contracts.quote_id'],
      formula: 'AVG(contracts.signed_at - quotes.sent_at)',
      description: '统计报价发出后到合同激活（签署完成）的平均小时数。',
      dataQuality: 'ready',
      governanceNotes: [],
    },
    actions: [
      {
        code: 'ct_approval_bottleneck',
        title: '建议进入审批瓶颈分析',
        description: '按审批节点分解停留时长，定位阻塞环节。',
        ownerModule: 'CT',
      },
      {
        code: 'qt_template_standardize',
        title: '建议标准化报价模板',
        description: '减少反复修改，提高报价一次通过率。',
        ownerModule: 'QT',
      },
    ],
  },
  post_deal_handover_time: {
    name: '成交后开通/交接时间',
    unit: 'hours',
    direction: 'lower_is_better',
    threshold: { warning: 48, critical: 120 },
    source: {
      modules: ['ORD', 'SUB', 'CSM'],
      tables: ['orders', 'subscriptions', 'delivery_orders'],
      fields: [
        'orders.activated_at',
        'subscriptions.starts_at',
        'delivery_orders.started_at',
        'delivery_orders.order_id',
      ],
      formula:
        'AVG(MIN(subscriptions.starts_at, delivery_orders.started_at) - orders.activated_at)',
      description:
        '统计订单激活后到订阅开通或交付启动（取最早）的平均小时数。',
      dataQuality: 'ready',
      governanceNotes: [],
    },
    actions: [
      {
        code: 'ord_sub_dlv_handoff_checklist',
        title: '建议启用成交后交接清单',
        description: '为订单激活后24小时内建立交接任务与责任人。',
        ownerModule: 'ORD',
      },
      {
        code: 'csm_onboarding_watch',
        title: '建议客户成功提前介入',
        description: '对超时开通客户触发CSM预警与升级处理。',
        ownerModule: 'CSM',
      },
    ],
  },
  ticket_first_resolution_rate: {
    name: '工单首次解决率',
    unit: 'percent',
    direction: 'higher_is_better',
    threshold: { warning: 75, critical: 60 },
    source: {
      modules: ['TK'],
      tables: ['tickets', 'ticket_logs'],
      fields: ['tickets.resolved_at', 'tickets.created_at', 'ticket_logs.action'],
      formula: '一次闭环解决工单 / 窗口期工单总数',
      description: '统计窗口内工单首次闭环解决比例。',
      dataQuality: 'proxy',
      governanceNotes: [
        '当前状态机无 reopened 状态，首次解决按“一次闭环”代理计算，后续需补 reopen 事件。',
      ],
    },
    actions: [
      {
        code: 'tk_knowledge_gap_review',
        title: '建议补齐知识库缺口',
        description: '针对重复未解问题补充标准处理方案。',
        ownerModule: 'KB',
      },
      {
        code: 'tk_skill_routing',
        title: '建议优化技能路由',
        description: '按问题类型匹配一线专家，减少多次转派。',
        ownerModule: 'TK',
      },
    ],
  },
  ticket_sla_compliance_rate: {
    name: 'SLA 达标率',
    unit: 'percent',
    direction: 'higher_is_better',
    threshold: { warning: 90, critical: 80 },
    source: {
      modules: ['TK'],
      tables: ['tickets'],
      fields: ['tickets.sla_due_at', 'tickets.resolved_at', 'tickets.created_at'],
      formula: 'resolved_at <= sla_due_at 的工单 / 配置SLA的工单',
      description: '统计窗口内配置SLA工单的达标比例。',
      dataQuality: 'ready',
      governanceNotes: [],
    },
    actions: [
      {
        code: 'tk_sla_escalation',
        title: '建议启用SLA超时升级',
        description: '对临近超时工单自动升级并通知值班负责人。',
        ownerModule: 'NTF',
      },
      {
        code: 'tk_capacity_planning',
        title: '建议调整服务容量',
        description: '按工单峰值配置处理班次与排班。',
        ownerModule: 'TK',
      },
    ],
  },
};

@Injectable()
export class DashService {
  constructor(
    @InjectRepository(MetricSnapshot)
    private readonly metricRepo: Repository<MetricSnapshot>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async getDashboardSummary(
    orgId: string,
    rangeInput?: string,
  ): Promise<DashboardBoardResponse> {
    return this.getExecutiveDashboard(orgId, rangeInput);
  }

  async getSalesDashboard(
    orgId: string,
    rangeInput?: string,
  ): Promise<DashboardBoardResponse> {
    return this.buildBoard(orgId, rangeInput, 'sales');
  }

  async getServiceDashboard(
    orgId: string,
    rangeInput?: string,
  ): Promise<DashboardBoardResponse> {
    return this.buildBoard(orgId, rangeInput, 'service');
  }

  async getExecutiveDashboard(
    orgId: string,
    rangeInput?: string,
  ): Promise<DashboardBoardResponse> {
    return this.buildBoard(orgId, rangeInput, 'executive');
  }

  async recordMetric(
    orgId: string,
    metricKey: string,
    metricType: string,
    value: number,
    dimensions: Record<string, unknown>,
    userId: string,
  ): Promise<MetricSnapshot> {
    const snapshot = this.metricRepo.create({
      orgId,
      metricKey,
      metricType,
      value,
      dimensions,
      snapshotAt: new Date(),
      createdBy: userId,
    });

    return this.metricRepo.save(snapshot);
  }

  async getMetrics(
    orgId: string,
    metricKey: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MetricSnapshot[]> {
    return this.metricRepo.find({
      where: {
        orgId,
        metricKey,
        snapshotAt: Between(startDate, endDate),
      },
      order: { snapshotAt: 'ASC' },
    });
  }

  private async buildBoard(
    orgId: string,
    rangeInput: string | undefined,
    board: DashboardBoardType,
  ): Promise<DashboardBoardResponse> {
    const range = this.normalizeRange(rangeInput);
    const window = this.buildWindow(range);

    const indicatorsByKey = await this.collectIndicators(orgId, window);
    const groups = BOARD_GROUPS[board];

    const selectedKeys = groups.flatMap((group) => group.metricKeys);
    const selectedIndicators = Array.from(
      new Map(
        selectedKeys.map((key) => [key, indicatorsByKey[key]]),
      ).values(),
    );

    const anomalies = this.buildAnomalies(selectedIndicators);
    const dataGovernance = this.buildDataGovernance(selectedIndicators);
    const moduleCoverage = this.buildModuleCoverage(selectedIndicators);

    return {
      board,
      orgId,
      range,
      generatedAt: new Date().toISOString(),
      window: {
        current: {
          startAt: window.current.startAt.toISOString(),
          endAt: window.current.endAt.toISOString(),
          label: window.current.label,
        },
        previous: {
          startAt: window.previous.startAt.toISOString(),
          endAt: window.previous.endAt.toISOString(),
          label: window.previous.label,
        },
      },
      indicators: selectedIndicators,
      groups,
      anomalies,
      dataGovernance,
      moduleCoverage,
    };
  }

  private async collectIndicators(
    orgId: string,
    window: DashboardWindow,
  ): Promise<Record<IndicatorKey, DashboardIndicator>> {
    const [
      firstResponse,
      leadMissed,
      conversationToOpportunity,
      quoteContractCycle,
      postDealHandover,
      ticketFirstResolution,
      ticketSla,
    ] = await Promise.all([
      this.buildFirstResponseIndicator(orgId, window),
      this.buildLeadMissedFollowupIndicator(orgId, window),
      this.buildConversationToOpportunityIndicator(orgId, window),
      this.buildQuoteContractCycleIndicator(orgId, window),
      this.buildPostDealHandoverIndicator(orgId, window),
      this.buildTicketFirstResolutionIndicator(orgId, window),
      this.buildTicketSlaIndicator(orgId, window),
    ]);

    return {
      first_response_time: firstResponse,
      lead_missed_followup_rate: leadMissed,
      conversation_to_opportunity_rate: conversationToOpportunity,
      quote_contract_cycle_time: quoteContractCycle,
      post_deal_handover_time: postDealHandover,
      ticket_first_resolution_rate: ticketFirstResolution,
      ticket_sla_compliance_rate: ticketSla,
    };
  }

  private async buildFirstResponseIndicator(
    orgId: string,
    window: DashboardWindow,
  ): Promise<DashboardIndicator> {
    const [current, previous] = await Promise.all([
      this.queryConversationFirstResponseMinutes(
        orgId,
        window.current.startAt,
        window.current.endAt,
      ),
      this.queryConversationFirstResponseMinutes(
        orgId,
        window.previous.startAt,
        window.previous.endAt,
      ),
    ]);

    return this.buildIndicator('first_response_time', current, previous);
  }

  private async buildLeadMissedFollowupIndicator(
    orgId: string,
    window: DashboardWindow,
  ): Promise<DashboardIndicator> {
    const [current, previous] = await Promise.all([
      this.queryLeadMissedFollowupRate(
        orgId,
        window.current.startAt,
        window.current.endAt,
        window.current.endAt,
      ),
      this.queryLeadMissedFollowupRate(
        orgId,
        window.previous.startAt,
        window.previous.endAt,
        window.previous.endAt,
      ),
    ]);

    return this.buildIndicator('lead_missed_followup_rate', current, previous);
  }

  private async buildConversationToOpportunityIndicator(
    orgId: string,
    window: DashboardWindow,
  ): Promise<DashboardIndicator> {
    const [current, previous] = await Promise.all([
      this.queryConversationToOpportunityRate(
        orgId,
        window.current.startAt,
        window.current.endAt,
      ),
      this.queryConversationToOpportunityRate(
        orgId,
        window.previous.startAt,
        window.previous.endAt,
      ),
    ]);

    return this.buildIndicator(
      'conversation_to_opportunity_rate',
      current,
      previous,
    );
  }

  private async buildQuoteContractCycleIndicator(
    orgId: string,
    window: DashboardWindow,
  ): Promise<DashboardIndicator> {
    const [current, previous] = await Promise.all([
      this.queryQuoteContractCycleHours(
        orgId,
        window.current.startAt,
        window.current.endAt,
      ),
      this.queryQuoteContractCycleHours(
        orgId,
        window.previous.startAt,
        window.previous.endAt,
      ),
    ]);

    return this.buildIndicator('quote_contract_cycle_time', current, previous);
  }

  private async buildPostDealHandoverIndicator(
    orgId: string,
    window: DashboardWindow,
  ): Promise<DashboardIndicator> {
    const [current, previous] = await Promise.all([
      this.queryPostDealHandoverHours(
        orgId,
        window.current.startAt,
        window.current.endAt,
      ),
      this.queryPostDealHandoverHours(
        orgId,
        window.previous.startAt,
        window.previous.endAt,
      ),
    ]);

    const extraNotes: string[] = [];
    let qualityOverride: DataQuality | undefined;

    if (current.sampleSize === 0) {
      extraNotes.push(
        '当前窗口无可用开通/交接样本，需补齐订单激活后的订阅或交付启动数据。',
      );
    }

    if (current.coverage !== undefined && current.coverage < 70) {
      extraNotes.push(
        `当前窗口覆盖率为 ${this.round(
          current.coverage,
          1,
        )}%，部分订单缺少开通或交付启动时间。`,
      );
      qualityOverride = 'proxy';
    }

    return this.buildIndicator('post_deal_handover_time', current, previous, {
      extraGovernanceNotes: extraNotes,
      qualityOverride,
    });
  }

  private async buildTicketFirstResolutionIndicator(
    orgId: string,
    window: DashboardWindow,
  ): Promise<DashboardIndicator> {
    const [current, previous] = await Promise.all([
      this.queryTicketFirstResolutionRate(
        orgId,
        window.current.startAt,
        window.current.endAt,
      ),
      this.queryTicketFirstResolutionRate(
        orgId,
        window.previous.startAt,
        window.previous.endAt,
      ),
    ]);

    return this.buildIndicator('ticket_first_resolution_rate', current, previous);
  }

  private async buildTicketSlaIndicator(
    orgId: string,
    window: DashboardWindow,
  ): Promise<DashboardIndicator> {
    const [current, previous] = await Promise.all([
      this.queryTicketSlaComplianceRate(
        orgId,
        window.current.startAt,
        window.current.endAt,
      ),
      this.queryTicketSlaComplianceRate(
        orgId,
        window.previous.startAt,
        window.previous.endAt,
      ),
    ]);

    return this.buildIndicator('ticket_sla_compliance_rate', current, previous);
  }

  private async queryConversationFirstResponseMinutes(
    orgId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<MetricStat> {
    const raw = await this.conversationRepo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'sample')
      .addSelect(
        'COALESCE(AVG(EXTRACT(EPOCH FROM (c.first_response_at - c.created_at)) / 60), 0)',
        'value',
      )
      .where('c.org_id = :orgId', { orgId })
      .andWhere('c.deleted_at IS NULL')
      .andWhere('c.created_at >= :startAt AND c.created_at < :endAt', {
        startAt,
        endAt,
      })
      .andWhere('c.first_response_at IS NOT NULL')
      .andWhere('c.first_response_at >= c.created_at')
      .getRawOne<{ sample: string; value: string }>();

    return {
      sampleSize: this.toInt(raw?.sample),
      value: this.toFloat(raw?.value),
    };
  }

  private async queryLeadMissedFollowupRate(
    orgId: string,
    startAt: Date,
    endAt: Date,
    asOf: Date,
  ): Promise<MetricStat> {
    const openStatuses = ['new', 'assigned', 'following'];

    const raw = await this.leadRepo
      .createQueryBuilder('l')
      .select(
        'SUM(CASE WHEN l.status IN (:...openStatuses) THEN 1 ELSE 0 END)',
        'sample',
      )
      .addSelect(
        `SUM(
          CASE
            WHEN l.status IN (:...openStatuses)
              AND l.created_at <= (:asOf - interval '24 hours')
              AND COALESCE(l.last_follow_up_at, l.created_at) <= (:asOf - interval '48 hours')
            THEN 1 ELSE 0
          END
        )`,
        'numerator',
      )
      .where('l.org_id = :orgId', { orgId })
      .andWhere('l.deleted_at IS NULL')
      .andWhere('l.created_at >= :startAt AND l.created_at < :endAt', {
        startAt,
        endAt,
      })
      .setParameters({ openStatuses, asOf })
      .getRawOne<{ sample: string; numerator: string }>();

    const sample = this.toInt(raw?.sample);
    const numerator = this.toInt(raw?.numerator);

    return {
      sampleSize: sample,
      value: this.safeRate(numerator, sample),
    };
  }

  private async queryConversationToOpportunityRate(
    orgId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<MetricStat> {
    const raw = await this.conversationRepo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'sample')
      .addSelect(
        `SUM(
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM opportunities o
              WHERE o.org_id = c.org_id
                AND o.deleted_at IS NULL
                AND o.customer_id = c.customer_id
                AND o.created_at >= c.created_at
                AND o.created_at < c.created_at + interval '14 days'
            )
            THEN 1 ELSE 0
          END
        )`,
        'numerator',
      )
      .where('c.org_id = :orgId', { orgId })
      .andWhere('c.deleted_at IS NULL')
      .andWhere('c.customer_id IS NOT NULL')
      .andWhere('c.created_at >= :startAt AND c.created_at < :endAt', {
        startAt,
        endAt,
      })
      .getRawOne<{ sample: string; numerator: string }>();

    const sample = this.toInt(raw?.sample);
    const numerator = this.toInt(raw?.numerator);

    return {
      sampleSize: sample,
      value: this.safeRate(numerator, sample),
    };
  }

  private async queryQuoteContractCycleHours(
    orgId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<MetricStat> {
    const raw = await this.contractRepo
      .createQueryBuilder('ct')
      .innerJoin(
        'quotes',
        'q',
        'q.id = ct.quote_id AND q.org_id = ct.org_id AND q.deleted_at IS NULL',
      )
      .select('COUNT(*)', 'sample')
      .addSelect(
        'COALESCE(AVG(EXTRACT(EPOCH FROM (ct.signed_at - q.sent_at)) / 3600), 0)',
        'value',
      )
      .where('ct.org_id = :orgId', { orgId })
      .andWhere('ct.deleted_at IS NULL')
      .andWhere('ct.signed_at IS NOT NULL')
      .andWhere('q.sent_at IS NOT NULL')
      .andWhere('ct.signed_at >= q.sent_at')
      .andWhere('ct.signed_at >= :startAt AND ct.signed_at < :endAt', {
        startAt,
        endAt,
      })
      .getRawOne<{ sample: string; value: string }>();

    return {
      sampleSize: this.toInt(raw?.sample),
      value: this.toFloat(raw?.value),
    };
  }

  private async queryPostDealHandoverHours(
    orgId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<MetricStat> {
    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.id', 'orderId')
      .addSelect('o.activated_at', 'activatedAt')
      .addSelect('MIN(s.starts_at)', 'subscriptionStartedAt')
      .addSelect('MIN(d.started_at)', 'deliveryStartedAt')
      .leftJoin(
        'subscriptions',
        's',
        's.order_id = o.id AND s.org_id = o.org_id AND s.deleted_at IS NULL',
      )
      .leftJoin(
        'delivery_orders',
        'd',
        'd.order_id = o.id AND d.org_id = o.org_id AND d.deleted_at IS NULL',
      )
      .where('o.org_id = :orgId', { orgId })
      .andWhere('o.deleted_at IS NULL')
      .andWhere('o.activated_at IS NOT NULL')
      .andWhere('o.activated_at >= :startAt AND o.activated_at < :endAt', {
        startAt,
        endAt,
      })
      .groupBy('o.id')
      .addGroupBy('o.activated_at')
      .getRawMany<{
        orderId: string;
        activatedAt: string;
        subscriptionStartedAt: string | null;
        deliveryStartedAt: string | null;
      }>();

    const durations: number[] = [];

    for (const row of rows) {
      const activatedAt = this.toDate(row.activatedAt);
      const subscriptionStartedAt = this.toDate(row.subscriptionStartedAt);
      const deliveryStartedAt = this.toDate(row.deliveryStartedAt);

      if (!activatedAt) continue;

      const candidates = [subscriptionStartedAt, deliveryStartedAt].filter(
        (candidate): candidate is Date => !!candidate && candidate >= activatedAt,
      );

      if (candidates.length === 0) continue;

      const handoverAt = candidates.reduce((min, current) =>
        current.getTime() < min.getTime() ? current : min,
      );

      durations.push(
        (handoverAt.getTime() - activatedAt.getTime()) / (60 * 60 * 1000),
      );
    }

    const sampleSize = durations.length;
    const totalOrders = rows.length;

    return {
      sampleSize,
      value: this.average(durations),
      coverage:
        totalOrders === 0 ? undefined : this.safeRate(sampleSize, totalOrders),
    };
  }

  private async queryTicketFirstResolutionRate(
    orgId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<MetricStat> {
    const raw = await this.ticketRepo
      .createQueryBuilder('t')
      .select('COUNT(*)', 'sample')
      .addSelect(
        `SUM(
          CASE
            WHEN t.resolved_at IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM ticket_logs tl
                WHERE tl.ticket_id = t.id
                  AND tl.org_id = t.org_id
                  AND tl.action = 'reopened'
              )
            THEN 1 ELSE 0
          END
        )`,
        'numerator',
      )
      .where('t.org_id = :orgId', { orgId })
      .andWhere('t.deleted_at IS NULL')
      .andWhere('t.created_at >= :startAt AND t.created_at < :endAt', {
        startAt,
        endAt,
      })
      .getRawOne<{ sample: string; numerator: string }>();

    const sample = this.toInt(raw?.sample);
    const numerator = this.toInt(raw?.numerator);

    return {
      sampleSize: sample,
      value: this.safeRate(numerator, sample),
    };
  }

  private async queryTicketSlaComplianceRate(
    orgId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<MetricStat> {
    const raw = await this.ticketRepo
      .createQueryBuilder('t')
      .select(
        'SUM(CASE WHEN t.sla_due_at IS NOT NULL THEN 1 ELSE 0 END)',
        'sample',
      )
      .addSelect(
        `SUM(
          CASE
            WHEN t.sla_due_at IS NOT NULL
              AND t.resolved_at IS NOT NULL
              AND t.resolved_at <= t.sla_due_at
            THEN 1 ELSE 0
          END
        )`,
        'numerator',
      )
      .where('t.org_id = :orgId', { orgId })
      .andWhere('t.deleted_at IS NULL')
      .andWhere('t.created_at >= :startAt AND t.created_at < :endAt', {
        startAt,
        endAt,
      })
      .getRawOne<{ sample: string; numerator: string }>();

    const sample = this.toInt(raw?.sample);
    const numerator = this.toInt(raw?.numerator);

    return {
      sampleSize: sample,
      value: this.safeRate(numerator, sample),
    };
  }

  private buildIndicator(
    key: IndicatorKey,
    current: MetricStat,
    previous: MetricStat,
    options?: { extraGovernanceNotes?: string[]; qualityOverride?: DataQuality },
  ): DashboardIndicator {
    const definition = INDICATOR_DEFINITIONS[key];
    const delta = this.round(current.value - previous.value, 2);
    const trend = this.resolveTrend(delta);
    const performance = this.resolvePerformance(
      definition.direction,
      delta,
      trend,
    );
    const status = this.resolveStatus(
      current.value,
      current.sampleSize,
      definition.direction,
      definition.threshold,
    );

    const governanceNotes = [
      ...definition.source.governanceNotes,
      ...(options?.extraGovernanceNotes || []),
    ];

    return {
      key,
      name: definition.name,
      unit: definition.unit,
      direction: definition.direction,
      threshold: definition.threshold,
      currentValue: this.round(current.value, 2),
      previousValue: this.round(previous.value, 2),
      deltaValue: delta,
      currentLabel: this.formatMetricValue(current.value, definition.unit),
      previousLabel: this.formatMetricValue(previous.value, definition.unit),
      trend,
      performance,
      status,
      sampleSize: current.sampleSize,
      source: {
        ...definition.source,
        dataQuality: options?.qualityOverride || definition.source.dataQuality,
        governanceNotes,
      },
      anomalyActions: definition.actions,
    };
  }

  private buildAnomalies(indicators: DashboardIndicator[]): DashboardAnomaly[] {
    return indicators
      .filter(
        (indicator) =>
          indicator.status === 'warning' || indicator.status === 'critical',
      )
      .map((indicator) => ({
        indicatorKey: indicator.key,
        indicatorName: indicator.name,
        status: indicator.status,
        currentLabel: indicator.currentLabel,
        sampleSize: indicator.sampleSize,
        reason: this.buildAnomalyReason(indicator),
        suggestedActions: indicator.anomalyActions,
      }));
  }

  private buildDataGovernance(indicators: DashboardIndicator[]): {
    computable: IndicatorKey[];
    proxy: IndicatorKey[];
    missing: IndicatorKey[];
  } {
    const computable: IndicatorKey[] = [];
    const proxy: IndicatorKey[] = [];
    const missing: IndicatorKey[] = [];

    for (const indicator of indicators) {
      if (indicator.source.dataQuality === 'ready') computable.push(indicator.key);
      if (indicator.source.dataQuality === 'proxy') proxy.push(indicator.key);
      if (indicator.source.dataQuality === 'missing') missing.push(indicator.key);
    }

    return { computable, proxy, missing };
  }

  private buildModuleCoverage(
    indicators: DashboardIndicator[],
  ): DashboardModuleCoverage[] {
    const map = new Map<string, Set<IndicatorKey>>();

    for (const indicator of indicators) {
      for (const module of indicator.source.modules) {
        if (!map.has(module)) {
          map.set(module, new Set<IndicatorKey>());
        }
        map.get(module)?.add(indicator.key);
      }
    }

    return REQUIRED_MODULES.map((module) => {
      const keys = map.get(module);
      return {
        module,
        covered: !!keys && keys.size > 0,
        indicatorKeys: keys ? Array.from(keys) : [],
      };
    });
  }

  private buildAnomalyReason(indicator: DashboardIndicator): string {
    if (indicator.status === 'insufficient_data') {
      return '当前样本不足，无法进行可靠评估。';
    }

    if (indicator.direction === 'lower_is_better') {
      return `${indicator.name} 当前为 ${indicator.currentLabel}，高于阈值 ${this.formatMetricValue(
        indicator.threshold.warning,
        indicator.unit,
      )}。`;
    }

    return `${indicator.name} 当前为 ${indicator.currentLabel}，低于阈值 ${this.formatMetricValue(
      indicator.threshold.warning,
      indicator.unit,
    )}。`;
  }

  private normalizeRange(rangeInput?: string): DashboardRange {
    if (rangeInput === '7d' || rangeInput === '30d' || rangeInput === '90d') {
      return rangeInput;
    }
    return '30d';
  }

  private buildWindow(range: DashboardRange): DashboardWindow {
    const days = RANGE_DAYS[range];
    const now = new Date();

    const currentEnd = new Date(now);
    const currentStart = new Date(currentEnd.getTime() - days * DAY_MS);

    const previousEnd = new Date(currentStart);
    const previousStart = new Date(previousEnd.getTime() - days * DAY_MS);

    return {
      current: {
        startAt: currentStart,
        endAt: currentEnd,
        label: `最近${days}天`,
      },
      previous: {
        startAt: previousStart,
        endAt: previousEnd,
        label: `前${days}天`,
      },
    };
  }

  private resolveTrend(delta: number): MetricTrend {
    if (Math.abs(delta) < 0.01) return 'flat';
    return delta > 0 ? 'up' : 'down';
  }

  private resolvePerformance(
    direction: MetricDirection,
    delta: number,
    trend: MetricTrend,
  ): MetricPerformance {
    if (trend === 'flat') return 'stable';

    if (direction === 'higher_is_better') {
      return delta > 0 ? 'improved' : 'worsened';
    }

    return delta < 0 ? 'improved' : 'worsened';
  }

  private resolveStatus(
    value: number,
    sampleSize: number,
    direction: MetricDirection,
    threshold: { warning: number; critical: number },
  ): MetricStatus {
    if (sampleSize <= 0) return 'insufficient_data';

    if (direction === 'lower_is_better') {
      if (value >= threshold.critical) return 'critical';
      if (value >= threshold.warning) return 'warning';
      return 'healthy';
    }

    if (value <= threshold.critical) return 'critical';
    if (value <= threshold.warning) return 'warning';
    return 'healthy';
  }

  private formatMetricValue(value: number, unit: MetricUnit): string {
    const rounded = this.round(value, 2);

    if (unit === 'percent') return `${rounded}%`;
    if (unit === 'minutes') return `${rounded} 分钟`;
    return `${rounded} 小时`;
  }

  private safeRate(numerator: number, denominator: number): number {
    if (denominator <= 0) return 0;
    return (numerator / denominator) * 100;
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private round(value: number, digits = 2): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  private toFloat(input: string | undefined | null): number {
    if (!input) return 0;
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toInt(input: string | undefined | null): number {
    if (!input) return 0;
    const parsed = parseInt(input, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toDate(input: string | undefined | null): Date | null {
    if (!input) return null;
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
