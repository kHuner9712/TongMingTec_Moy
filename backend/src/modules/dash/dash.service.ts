import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MetricSnapshot } from './entities/metric-snapshot.entity';
import { Customer, CustomerStatus } from '../cm/entities/customer.entity';
import { Lead } from '../lm/entities/lead.entity';
import { Opportunity, OpportunityResult } from '../om/entities/opportunity.entity';
import { Contract } from '../ct/entities/contract.entity';
import { Order } from '../ord/entities/order.entity';
import { Payment } from '../pay/entities/payment.entity';
import { Subscription } from '../sub/entities/subscription.entity';
import { Conversation } from '../cnv/entities/conversation.entity';
import { Ticket } from '../tk/entities/ticket.entity';
import { CustomerHealthScore } from '../csm/entities/customer-health-score.entity';

@Injectable()
export class DashService {
  private readonly logger = new Logger(DashService.name);

  constructor(
    @InjectRepository(MetricSnapshot)
    private metricRepo: Repository<MetricSnapshot>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Lead)
    private leadRepo: Repository<Lead>,
    @InjectRepository(Opportunity)
    private opportunityRepo: Repository<Opportunity>,
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,
    @InjectRepository(CustomerHealthScore)
    private healthRepo: Repository<CustomerHealthScore>,
  ) {}

  async getDashboardSummary(orgId: string) {
    const [
      totalCustomers,
      activeCustomers,
      totalOpportunities,
      wonOpportunities,
      activeContracts,
      activeOrders,
      succeededPayments,
      activeSubscriptions,
      healthScores,
    ] = await Promise.all([
      this.customerRepo.count({ where: { orgId, deletedAt: null as any } }),
      this.customerRepo.count({ where: { orgId, status: 'active' as CustomerStatus, deletedAt: null as any } }),
      this.opportunityRepo.count({ where: { orgId, deletedAt: null as any } }),
      this.opportunityRepo.count({ where: { orgId, result: 'won' as OpportunityResult, deletedAt: null as any } }),
      this.contractRepo.count({ where: { orgId, status: 'active', deletedAt: null as any } }),
      this.orderRepo.count({ where: { orgId, status: 'active', deletedAt: null as any } }),
      this.paymentRepo.count({ where: { orgId, status: 'succeeded', deletedAt: null as any } }),
      this.subscriptionRepo.count({ where: { orgId, status: 'active', deletedAt: null as any } }),
      this.healthRepo.find({ where: { orgId, deletedAt: null as any }, take: 100 }),
    ]);

    const criticalCustomers = healthScores.filter(h => h.level === 'critical').length;
    const highRiskCustomers = healthScores.filter(h => h.level === 'low').length;

    const paymentAmountResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.org_id = :orgId', { orgId })
      .andWhere('p.status = :status', { status: 'succeeded' })
      .andWhere('p.deleted_at IS NULL')
      .getRawOne();

    const totalRevenue = parseFloat(paymentAmountResult?.total || '0');

    return {
      customerMetrics: {
        total: totalCustomers,
        active: activeCustomers,
        critical: criticalCustomers,
        highRisk: highRiskCustomers,
      },
      opportunityMetrics: {
        total: totalOpportunities,
        won: wonOpportunities,
        winRate: totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0,
      },
      dealMetrics: {
        activeContracts,
        activeOrders,
        activeSubscriptions,
        totalRevenue,
      },
      paymentMetrics: {
        succeeded: succeededPayments,
        totalRevenue,
      },
      healthMetrics: {
        total: healthScores.length,
        high: healthScores.filter(h => h.level === 'high').length,
        medium: healthScores.filter(h => h.level === 'medium').length,
        low: healthScores.filter(h => h.level === 'low').length,
        critical: criticalCustomers,
      },
    };
  }

  async getSalesPipeline(orgId: string) {
    const opportunities = await this.opportunityRepo.find({
      where: { orgId, deletedAt: null as any },
      order: { updatedAt: 'DESC' },
      take: 50,
    });

    const byStage: Record<string, number> = {};
    const byResult: Record<string, number> = {};

    for (const opp of opportunities) {
      if (opp.stage) {
        byStage[opp.stage] = (byStage[opp.stage] || 0) + 1;
      }
      if (opp.result) {
        byResult[opp.result] = (byResult[opp.result] || 0) + 1;
      }
    }

    return {
      total: opportunities.length,
      byStage,
      byResult,
      recent: opportunities.slice(0, 10),
    };
  }

  async getRevenueTrend(orgId: string, months: number = 6) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months);

    const payments = await this.paymentRepo
      .createQueryBuilder('p')
      .select("TO_CHAR(p.created_at, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.org_id = :orgId', { orgId })
      .andWhere('p.status = :status', { status: 'succeeded' })
      .andWhere('p.created_at >= :startDate', { startDate })
      .andWhere('p.deleted_at IS NULL')
      .groupBy("TO_CHAR(p.created_at, 'YYYY-MM')")
      .orderBy("TO_CHAR(p.created_at, 'YYYY-MM')", 'ASC')
      .getRawMany();

    return payments.map(p => ({
      month: p.month,
      revenue: parseFloat(p.total || '0'),
    }));
  }

  async getCustomerHealthDistribution(orgId: string) {
    const healthScores = await this.healthRepo.find({
      where: { orgId, deletedAt: null as any },
    });

    const distribution = {
      high: 0,
      medium: 0,
      low: 0,
      critical: 0,
    };

    for (const h of healthScores) {
      distribution[h.level] = (distribution[h.level] || 0) + 1;
    }

    return {
      total: healthScores.length,
      distribution,
      averageScore: healthScores.length > 0
        ? Math.round(healthScores.reduce((sum, h) => sum + Number(h.score), 0) / healthScores.length)
        : 0,
    };
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

  async getSalesDashboard(orgId: string, months: number = 6) {
    const [
      totalOpportunities,
      wonOpportunities,
      totalLeads,
      convertedLeads,
    ] = await Promise.all([
      this.opportunityRepo.count({ where: { orgId, deletedAt: null as any } }),
      this.opportunityRepo.count({ where: { orgId, result: 'won' as OpportunityResult, deletedAt: null as any } }),
      this.leadRepo.count({ where: { orgId, deletedAt: null as any } }),
      this.leadRepo.count({ where: { orgId, status: 'converted', deletedAt: null as any } }),
    ]);

    const pipeline = await this.getSalesPipeline(orgId);
    const revenueTrend = await this.getRevenueTrend(orgId, months);

    const paymentAmountResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.org_id = :orgId', { orgId })
      .andWhere('p.status = :status', { status: 'succeeded' })
      .andWhere('p.deleted_at IS NULL')
      .getRawOne();

    const totalRevenue = parseFloat(paymentAmountResult?.total || '0');

    const topOpps = await this.opportunityRepo.find({
      where: { orgId, deletedAt: null as any },
      order: { amount: 'DESC' },
      take: 10,
    });

    return {
      kpi: {
        totalOpportunities,
        wonOpportunities,
        winRate: totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0,
        totalLeads,
        convertedLeads,
        leadConvertRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
        totalRevenue,
      },
      pipeline,
      revenueTrend,
      topOpportunities: topOpps,
    };
  }

  async getServiceDashboard(orgId: string) {
    const [
      totalConversations,
      queuedConversations,
      totalTickets,
      openTickets,
      resolvedTickets,
    ] = await Promise.all([
      this.conversationRepo.count({ where: { orgId, deletedAt: null as any } }),
      this.conversationRepo.count({ where: { orgId, status: 'queued', deletedAt: null as any } }),
      this.ticketRepo.count({ where: { orgId, deletedAt: null as any } }),
      this.ticketRepo.count({ where: { orgId, status: 'open', deletedAt: null as any } }),
      this.ticketRepo.count({ where: { orgId, status: 'resolved', deletedAt: null as any } }),
    ]);

    const ticketByPriority = await this.ticketRepo
      .createQueryBuilder('t')
      .select('t.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('t.org_id = :orgId', { orgId })
      .andWhere('t.deleted_at IS NULL')
      .groupBy('t.priority')
      .getRawMany();

    const ticketByStatus = await this.ticketRepo
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('t.org_id = :orgId', { orgId })
      .andWhere('t.deleted_at IS NULL')
      .groupBy('t.status')
      .getRawMany();

    const healthDistribution = await this.getCustomerHealthDistribution(orgId);

    return {
      kpi: {
        totalConversations,
        queuedConversations,
        totalTickets,
        openTickets,
        resolvedTickets,
        resolveRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
      },
      ticketByPriority: ticketByPriority.map(r => ({ priority: r.priority, count: parseInt(r.count) })),
      ticketByStatus: ticketByStatus.map(r => ({ status: r.status, count: parseInt(r.count) })),
      healthDistribution,
    };
  }

  async getExecutiveDashboard(orgId: string) {
    const summary = await this.getDashboardSummary(orgId);
    const salesPipeline = await this.getSalesPipeline(orgId);
    const revenueTrend = await this.getRevenueTrend(orgId, 6);
    const healthDistribution = await this.getCustomerHealthDistribution(orgId);

    const activeSubscriptions = await this.subscriptionRepo.count({
      where: { orgId, status: 'active', deletedAt: null as any },
    });

    const subscriptionRevenue = await this.subscriptionRepo
      .createQueryBuilder('s')
      .leftJoin('s.order', 'o')
      .select('COALESCE(SUM(o.total_amount), 0)', 'total')
      .where('s.org_id = :orgId', { orgId })
      .andWhere('s.status = :status', { status: 'active' })
      .andWhere('s.deleted_at IS NULL')
      .getRawOne();

    return {
      customerMetrics: summary.customerMetrics,
      opportunityMetrics: summary.opportunityMetrics,
      dealMetrics: summary.dealMetrics,
      healthMetrics: summary.healthMetrics,
      subscriptionMetrics: {
        activeSubscriptions,
        recurringRevenue: parseFloat(subscriptionRevenue?.total || '0'),
      },
      pipeline: salesPipeline,
      revenueTrend,
      healthDistribution,
      riskAlerts: {
        criticalCustomers: summary.customerMetrics.critical,
        highRiskCustomers: summary.customerMetrics.highRisk,
        lowHealthCount: summary.healthMetrics.low + summary.healthMetrics.critical,
      },
    };
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
}
