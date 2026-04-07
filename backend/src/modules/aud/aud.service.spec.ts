import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AudService } from './aud.service';
import { AuditLog } from './entities/audit-log.entity';

describe('AudService', () => {
  let service: AudService;
  let auditLogRepository: jest.Mocked<any>;

  const mockAuditLog = {
    id: 'log-uuid-123',
    orgId: 'org-uuid-123',
    userId: 'user-uuid-123',
    action: 'USER_LOGIN',
    resourceType: 'user',
    resourceId: 'user-uuid-123',
    beforeSnapshot: {},
    afterSnapshot: { status: 'active' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
  };

  const createMockQueryBuilder = () => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AudService>(AudService);
    auditLogRepository = module.get(getRepositoryToken(AuditLog));
  });

  describe('findLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockAuditLog], 1]);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findLogs('org-uuid-123', {}, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by userId', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockAuditLog], 1]);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findLogs('org-uuid-123', { userId: 'user-uuid-123' }, 1, 10);

      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should filter by action', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockAuditLog], 1]);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findLogs('org-uuid-123', { action: 'USER_LOGIN' }, 1, 10);

      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should filter by resourceType', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockAuditLog], 1]);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findLogs('org-uuid-123', { resourceType: 'user' }, 1, 10);

      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockAuditLog], 1]);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQb);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.findLogs(
        'org-uuid-123',
        { startDate, endDate },
        1,
        10,
      );

      expect(mockQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('createLog', () => {
    it('should create audit log with all fields', async () => {
      auditLogRepository.create.mockReturnValue(mockAuditLog);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.createLog('org-uuid-123', {
        userId: 'user-uuid-123',
        action: 'USER_LOGIN',
        resourceType: 'user',
        resourceId: 'user-uuid-123',
        beforeSnapshot: {},
        afterSnapshot: { status: 'active' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(auditLogRepository.save).toHaveBeenCalled();
    });

    it('should create audit log with minimal fields', async () => {
      const minimalLog = {
        id: 'log-uuid-123',
        orgId: 'org-uuid-123',
        userId: undefined,
        action: 'SYSTEM_START',
        resourceType: 'system',
        resourceId: undefined,
        beforeSnapshot: undefined,
        afterSnapshot: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        createdBy: 'system',
      };
      auditLogRepository.create.mockReturnValue(minimalLog);
      auditLogRepository.save.mockResolvedValue(minimalLog);

      const result = await service.createLog('org-uuid-123', {
        action: 'SYSTEM_START',
        resourceType: 'system',
      });

      expect(auditLogRepository.save).toHaveBeenCalled();
    });

    it('should handle before and after snapshots', async () => {
      const logWithSnapshots = {
        ...mockAuditLog,
        beforeSnapshot: { status: 'inactive' },
        afterSnapshot: { status: 'active' },
      };
      auditLogRepository.create.mockReturnValue(logWithSnapshots);
      auditLogRepository.save.mockResolvedValue(logWithSnapshots);

      const result = await service.createLog('org-uuid-123', {
        action: 'USER_STATUS_CHANGE',
        resourceType: 'user',
        beforeSnapshot: { status: 'inactive' },
        afterSnapshot: { status: 'active' },
      });

      expect(auditLogRepository.save).toHaveBeenCalled();
    });
  });
});
