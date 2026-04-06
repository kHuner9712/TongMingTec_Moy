import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AudService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async findLogs(
    orgId: string,
    filters: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number,
    pageSize: number,
  ): Promise<{ items: AuditLog[]; total: number }> {
    const qb = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.orgId = :orgId', { orgId });

    if (filters.userId) {
      qb.andWhere('log.userId = :userId', { userId: filters.userId });
    }

    if (filters.action) {
      qb.andWhere('log.action = :action', { action: filters.action });
    }

    if (filters.resourceType) {
      qb.andWhere('log.resourceType = :resourceType', {
        resourceType: filters.resourceType,
      });
    }

    if (filters.startDate) {
      qb.andWhere('log.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      qb.andWhere('log.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    qb.orderBy('log.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async createLog(
    orgId: string,
    data: {
      userId?: string;
      action: string;
      resourceType: string;
      resourceId?: string;
      beforeSnapshot?: Record<string, unknown>;
      afterSnapshot?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      orgId,
      userId: data.userId || null,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId || null,
      beforeSnapshot: data.beforeSnapshot || null,
      afterSnapshot: data.afterSnapshot || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      createdBy: data.userId || 'system',
    });

    return this.auditLogRepository.save(log);
  }
}
