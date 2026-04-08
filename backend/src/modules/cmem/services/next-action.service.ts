import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerNextAction, NextActionStatus } from '../entities/customer-next-action.entity';
import { NextActionQueryDto } from '../dto/next-action.dto';

const ACTION_RULES: Array<{
  condition: (intent: string, risk: string) => boolean;
  actionType: string;
  priority: number;
  reasoning: string;
}> = [
  {
    condition: (i, r) => i === 'churn_risk' && r === 'high',
    actionType: 'churn_recovery',
    priority: 1,
    reasoning: '客户存在高流失风险，建议立即安排流失挽回跟进',
  },
  {
    condition: (i, r) => i === 'complaint' && r !== 'low',
    actionType: 'escalate_complaint',
    priority: 1,
    reasoning: '客户投诉且风险较高，建议主管介入处理',
  },
  {
    condition: (i, _r) => i === 'purchase',
    actionType: 'send_quote',
    priority: 2,
    reasoning: '客户有购买意向，建议发送报价单',
  },
  {
    condition: (i, _r) => i === 'renewal',
    actionType: 'renewal_reminder',
    priority: 2,
    reasoning: '客户有续费意向，建议发送续费提醒',
  },
  {
    condition: (_i, r) => r === 'medium',
    actionType: 'proactive_followup',
    priority: 3,
    reasoning: '客户风险中等，建议主动跟进',
  },
];

@Injectable()
export class NextActionService {
  constructor(
    @InjectRepository(CustomerNextAction)
    private readonly actionRepo: Repository<CustomerNextAction>,
  ) {}

  async recommend(
    customerId: string,
    orgId: string,
    intentType: string,
    riskLevel: string,
  ): Promise<CustomerNextAction[]> {
    const matchedActions = ACTION_RULES.filter((rule) =>
      rule.condition(intentType, riskLevel),
    );

    if (matchedActions.length === 0) {
      matchedActions.push({
        condition: () => true,
        actionType: 'routine_followup',
        priority: 5,
        reasoning: '建议进行常规跟进沟通',
      });
    }

    const actions: CustomerNextAction[] = [];
    for (const rule of matchedActions) {
      const action = this.actionRepo.create({
        orgId,
        customerId,
        actionType: rule.actionType,
        priority: rule.priority,
        reasoning: rule.reasoning,
        suggestedBy: 'ai',
        suggestedAt: new Date(),
        status: NextActionStatus.PENDING,
      });
      actions.push(await this.actionRepo.save(action));
    }

    return actions;
  }

  async getNextActions(
    customerId: string,
    orgId: string,
    query?: NextActionQueryDto,
  ): Promise<{ items: CustomerNextAction[]; total: number }> {
    const qb = this.actionRepo
      .createQueryBuilder('action')
      .where('action.orgId = :orgId', { orgId })
      .andWhere('action.customerId = :customerId', { customerId });

    if (query?.status) {
      qb.andWhere('action.status = :status', { status: query.status });
    }

    qb.orderBy('action.priority', 'ASC').addOrderBy('action.suggestedAt', 'DESC');

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async acceptAction(actionId: string, orgId: string): Promise<CustomerNextAction> {
    const action = await this.actionRepo.findOne({
      where: { id: actionId, orgId },
    });
    if (!action) throw new NotFoundException('RESOURCE_NOT_FOUND');

    action.status = NextActionStatus.ACCEPTED;
    return this.actionRepo.save(action);
  }

  async dismissAction(actionId: string, orgId: string): Promise<CustomerNextAction> {
    const action = await this.actionRepo.findOne({
      where: { id: actionId, orgId },
    });
    if (!action) throw new NotFoundException('RESOURCE_NOT_FOUND');

    action.status = NextActionStatus.DISMISSED;
    return this.actionRepo.save(action);
  }
}
