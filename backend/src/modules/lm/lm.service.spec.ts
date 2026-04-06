import { Test, TestingModule } from '@nestjs/testing';
import { LmService } from './lm.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import { LeadFollowUp, FollowType } from './entities/lead-follow-up.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('LmService', () => {
  let service: LmService;
  let leadRepository: jest.Mocked<any>;
  let followUpRepository: jest.Mocked<any>;

  const mockLead = {
    id: 'lead-uuid-123',
    orgId: 'org-uuid-123',
    source: 'manual',
    name: '测试线索',
    mobile: '13800138000',
    email: 'lead@example.com',
    companyName: '测试公司',
    ownerUserId: null,
    status: LeadStatus.NEW,
    score: null,
    scoreReason: null,
    lastFollowUpAt: null,
    version: 1,
  };

  const mockFollowUp = {
    id: 'followup-uuid-123',
    leadId: 'lead-uuid-123',
    orgId: 'org-uuid-123',
    followType: FollowType.CALL,
    content: '首次跟进',
    nextActionAt: null,
    createdBy: 'user-uuid-123',
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
        LmService,
        {
          provide: getRepositoryToken(Lead),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(createMockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(LeadFollowUp),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<LmService>(LmService);
    leadRepository = module.get(getRepositoryToken(Lead));
    followUpRepository = module.get(getRepositoryToken(LeadFollowUp));
  });

  describe('findLeadById', () => {
    it('should return lead if found', async () => {
      leadRepository.findOne.mockResolvedValue(mockLead);

      const result = await service.findLeadById('lead-uuid-123', 'org-uuid-123');

      expect(result.id).toBe('lead-uuid-123');
      expect(result.name).toBe('测试线索');
    });

    it('should throw NotFoundException if lead not found', async () => {
      leadRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findLeadById('nonexistent', 'org-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLeads', () => {
    it('should return paginated leads with filters', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockLead], 1]);
      leadRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findLeads(
        'org-uuid-123',
        'user-uuid-123',
        'org',
        { status: LeadStatus.NEW, source: 'manual' },
        1,
        10,
      );

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by self dataScope', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockLead], 1]);
      leadRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findLeads(
        'org-uuid-123',
        'user-uuid-123',
        'self',
        {},
        1,
        10,
      );

      expect(mockQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('createLead', () => {
    it('should create lead with new status', async () => {
      leadRepository.create.mockReturnValue(mockLead);
      leadRepository.save.mockResolvedValue(mockLead);

      const result = await service.createLead('org-uuid-123', {
        name: '测试线索',
        mobile: '13800138000',
        email: 'lead@example.com',
      }, 'user-uuid-123');

      expect(leadRepository.create).toHaveBeenCalled();
      expect(leadRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(LeadStatus.NEW);
    });
  });

  describe('assignLead', () => {
    it('should assign lead to user and change status to assigned', async () => {
      leadRepository.findOne.mockResolvedValueOnce(mockLead);
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        ownerUserId: 'agent-uuid-123',
        status: LeadStatus.ASSIGNED,
      });
      leadRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.assignLead(
        'lead-uuid-123',
        'org-uuid-123',
        'agent-uuid-123',
        1,
      );

      expect(leadRepository.update).toHaveBeenCalledWith(
        'lead-uuid-123',
        expect.objectContaining({
          ownerUserId: 'agent-uuid-123',
          status: LeadStatus.ASSIGNED,
        }),
      );
    });

    it('should throw ConflictException for version mismatch', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        version: 2,
      });

      await expect(
        service.assignLead('lead-uuid-123', 'org-uuid-123', 'agent-uuid-123', 1),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid status transition from converted', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.CONVERTED,
        version: 1,
      });

      await expect(
        service.assignLead('lead-uuid-123', 'org-uuid-123', 'agent-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid status transition from invalid', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.INVALID,
        version: 1,
      });

      await expect(
        service.assignLead('lead-uuid-123', 'org-uuid-123', 'agent-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addFollowUp', () => {
    it('should add follow up and change status to following', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.ASSIGNED,
      });
      followUpRepository.create.mockReturnValue(mockFollowUp);
      followUpRepository.save.mockResolvedValue(mockFollowUp);
      leadRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.addFollowUp(
        'lead-uuid-123',
        'org-uuid-123',
        '首次跟进内容',
        FollowType.CALL,
        null,
        'user-uuid-123',
        1,
      );

      expect(followUpRepository.save).toHaveBeenCalled();
      expect(leadRepository.update).toHaveBeenCalledWith(
        'lead-uuid-123',
        expect.objectContaining({
          status: LeadStatus.FOLLOWING,
        }),
      );
    });

    it('should throw ConflictException for version mismatch', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        version: 2,
      });

      await expect(
        service.addFollowUp(
          'lead-uuid-123',
          'org-uuid-123',
          '跟进内容',
          FollowType.CALL,
          null,
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid status transition from new', async () => {
      leadRepository.findOne.mockResolvedValue(mockLead);

      await expect(
        service.addFollowUp(
          'lead-uuid-123',
          'org-uuid-123',
          '跟进内容',
          FollowType.CALL,
          null,
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('convert', () => {
    it('should convert lead to customer and opportunity', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.FOLLOWING,
      });
      leadRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.convert(
        'lead-uuid-123',
        'org-uuid-123',
        'user-uuid-123',
        1,
      );

      expect(leadRepository.update).toHaveBeenCalledWith(
        'lead-uuid-123',
        expect.objectContaining({
          status: LeadStatus.CONVERTED,
        }),
      );
      expect(result.leadId).toBe('lead-uuid-123');
      expect(result.customerId).toBe('placeholder-customer-id');
      expect(result.opportunityId).toBe('placeholder-opportunity-id');
    });

    it('should throw BadRequestException for invalid status transition from new', async () => {
      leadRepository.findOne.mockResolvedValue(mockLead);

      await expect(
        service.convert('lead-uuid-123', 'org-uuid-123', 'user-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid status transition from converted', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.CONVERTED,
      });

      await expect(
        service.convert('lead-uuid-123', 'org-uuid-123', 'user-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for version mismatch', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.FOLLOWING,
        version: 2,
      });

      await expect(
        service.convert('lead-uuid-123', 'org-uuid-123', 'user-uuid-123', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('markInvalid', () => {
    it('should mark lead as invalid from new status', async () => {
      leadRepository.findOne.mockResolvedValueOnce(mockLead);
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.INVALID,
      });
      leadRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.markInvalid(
        'lead-uuid-123',
        'org-uuid-123',
        '无效线索',
        'user-uuid-123',
        1,
      );

      expect(leadRepository.update).toHaveBeenCalledWith(
        'lead-uuid-123',
        expect.objectContaining({ status: LeadStatus.INVALID }),
      );
    });

    it('should mark lead as invalid from assigned status', async () => {
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.ASSIGNED,
      });
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.INVALID,
      });
      leadRepository.update.mockResolvedValue({ affected: 1 });

      await service.markInvalid(
        'lead-uuid-123',
        'org-uuid-123',
        '无效线索',
        'user-uuid-123',
        1,
      );

      expect(leadRepository.update).toHaveBeenCalled();
    });

    it('should mark lead as invalid from following status', async () => {
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.FOLLOWING,
      });
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.INVALID,
      });
      leadRepository.update.mockResolvedValue({ affected: 1 });

      await service.markInvalid(
        'lead-uuid-123',
        'org-uuid-123',
        '无效线索',
        'user-uuid-123',
        1,
      );

      expect(leadRepository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition from converted', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.CONVERTED,
        version: 1,
      });

      await expect(
        service.markInvalid('lead-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid status transition from invalid', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.INVALID,
        version: 1,
      });

      await expect(
        service.markInvalid('lead-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findFollowUps', () => {
    it('should return follow ups for lead', async () => {
      followUpRepository.find.mockResolvedValue([mockFollowUp]);

      const result = await service.findFollowUps('lead-uuid-123', 'org-uuid-123');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('首次跟进');
    });
  });

  describe('SM-lead state machine validation', () => {
    it('should allow transition from new to assigned', async () => {
      leadRepository.findOne.mockResolvedValueOnce(mockLead);
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.ASSIGNED,
      });
      leadRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.assignLead('lead-uuid-123', 'org-uuid-123', 'agent-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from assigned to following', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.ASSIGNED,
        version: 1,
      });
      followUpRepository.create.mockReturnValue(mockFollowUp);
      followUpRepository.save.mockResolvedValue(mockFollowUp);
      leadRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.addFollowUp(
          'lead-uuid-123',
          'org-uuid-123',
          '跟进内容',
          FollowType.CALL,
          null,
          'user-uuid-123',
          1,
        ),
      ).resolves.not.toThrow();
    });

    it('should allow transition from following to converted', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.FOLLOWING,
        version: 1,
      });
      leadRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.convert('lead-uuid-123', 'org-uuid-123', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from new to invalid', async () => {
      leadRepository.findOne.mockResolvedValueOnce(mockLead);
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.INVALID,
      });
      leadRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.markInvalid('lead-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from assigned to invalid', async () => {
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.ASSIGNED,
        version: 1,
      });
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.INVALID,
      });
      leadRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.markInvalid('lead-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from following to invalid', async () => {
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.FOLLOWING,
        version: 1,
      });
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.INVALID,
      });
      leadRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.markInvalid('lead-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should block transition from converted to assigned', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.CONVERTED,
        version: 1,
      });

      await expect(
        service.assignLead('lead-uuid-123', 'org-uuid-123', 'agent-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should block transition from invalid to following', async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.INVALID,
        version: 1,
      });

      await expect(
        service.addFollowUp(
          'lead-uuid-123',
          'org-uuid-123',
          '跟进内容',
          FollowType.CALL,
          null,
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
