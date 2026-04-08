import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerRisk, RiskLevel } from '../entities/customer-risk.entity';

@Injectable()
export class RiskService {
  constructor(
    @InjectRepository(CustomerRisk)
    private readonly riskRepo: Repository<CustomerRisk>,
  ) {}

  async assessRisk(
    customerId: string,
    orgId: string,
    factors: Record<string, unknown> = {},
  ): Promise<CustomerRisk> {
    let riskLevel = RiskLevel.LOW;
    const riskFactors: Record<string, unknown> = { ...factors };

    const silentDays = Number(factors.silentDays) || 0;
    const overdueBills = Number(factors.overdueBills) || 0;
    const stalledOpportunities = Number(factors.stalledOpportunities) || 0;

    if (silentDays > 30 || overdueBills > 0) {
      riskLevel = RiskLevel.HIGH;
    } else if (silentDays > 14 || stalledOpportunities > 2) {
      riskLevel = RiskLevel.MEDIUM;
    }

    if (overdueBills > 2) {
      riskLevel = RiskLevel.CRITICAL;
    }

    riskFactors.computedLevel = riskLevel;
    riskFactors.assessedBy = 'rule_engine';

    const risk = this.riskRepo.create({
      orgId,
      customerId,
      riskLevel,
      riskFactors,
      assessedAt: new Date(),
    });

    return this.riskRepo.save(risk);
  }

  async getRisk(customerId: string, orgId: string): Promise<CustomerRisk | null> {
    const risks = await this.riskRepo.find({
      where: { customerId, orgId },
      order: { assessedAt: 'DESC' },
      take: 1,
    });
    return risks.length > 0 ? risks[0] : null;
  }
}
