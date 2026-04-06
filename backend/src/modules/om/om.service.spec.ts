import { Test, TestingModule } from '@nestjs/testing';
import { OmService } from './om.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Opportunity, OpportunityStage, OpportunityResult } from './entities/opportunity.entity';
import { OpportunityStageHistory } from './entities/opportunity-stage-history.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('OmService', () => {
  let service: OmService;
  let opportunityRepository: jest.Mocked<any>;
  let historyRepository: jest.Mocked<any>;

  const mockOpportunity = {
    id: 'opp-uuid-123',
    orgId: 'org-uuid-123',
    customerId: 'customer-uuid-123',
    leadId: null,
    ownerUserId: 'user-uuid-123',
    name: '测试商机',
    amount: 50000,
    currency: 'CNY',
    stage: OpportunityStage.DISCOVERY,
    result: null,
    expectedCloseDate: null,
    pauseReason: null,
    version: 1,
  };

  const mockStageHistory = {
    id: 'history-uuid-123',
    opportunityId: 'opp-uuid-123',
    orgId: 'org-uuid-123',
    fromStage: OpportunityStage.DISCOVERY,
    toStage: OpportunityStage.QUALIFICATION,
    resultAfter: null,
    changeReason: '推进到资格审查阶段',
    createdBy: 'user-uuid-123',
    changedAt: new Date(),
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
        OmService,
        {
          provide: getRepositoryToken(Opportunity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(createMockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(OpportunityStageHistory),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OmService>(OmService);
    opportunityRepository = module.get(getRepositoryToken(Opportunity));
    historyRepository = module.get(getRepositoryToken(OpportunityStageHistory));
  });

  describe('findOpportunityById', () => {
    it('should return opportunity if found', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);

      const result = await service.findOpportunityById('opp-uuid-123', 'org-uuid-123');

      expect(result.id).toBe('opp-uuid-123');
      expect(result.name).toBe('测试商机');
    });

    it('should throw NotFoundException if opportunity not found', async () => {
      opportunityRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOpportunityById('nonexistent', 'org-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOpportunities', () => {
    it('should return paginated opportunities with filters', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockOpportunity], 1]);
      opportunityRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findOpportunities(
        'org-uuid-123',
        'user-uuid-123',
        'org',
        { stage: OpportunityStage.DISCOVERY },
        1,
        10,
      );

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by self dataScope', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockOpportunity], 1]);
      opportunityRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findOpportunities(
        'org-uuid-123',
        'user-uuid-123',
        'self',
        {},
        1,
        10,
      );

      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should filter by result', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockOpportunity], 1]);
      opportunityRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findOpportunities(
        'org-uuid-123',
        'user-uuid-123',
        'org',
        { result: OpportunityResult.WON },
        1,
        10,
      );

      expect(mockQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('createOpportunity', () => {
    it('should create opportunity with discovery stage', async () => {
      opportunityRepository.create.mockReturnValue(mockOpportunity);
      opportunityRepository.save.mockResolvedValue(mockOpportunity);

      const result = await service.createOpportunity('org-uuid-123', {
        customerId: 'customer-uuid-123',
        name: '测试商机',
        amount: 50000,
      }, 'user-uuid-123');

      expect(opportunityRepository.create).toHaveBeenCalled();
      expect(opportunityRepository.save).toHaveBeenCalled();
      expect(result.stage).toBe(OpportunityStage.DISCOVERY);
    });
  });

  describe('updateOpportunity', () => {
    it('should update opportunity with version check', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateOpportunity(
        'opp-uuid-123',
        'org-uuid-123',
        { amount: 60000 },
        1,
      );

      expect(opportunityRepository.update).toHaveBeenCalled();
    });

    it('should throw ConflictException for version mismatch', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        version: 2,
      });

      await expect(
        service.updateOpportunity('opp-uuid-123', 'org-uuid-123', { amount: 60000 }, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changeStage', () => {
    it('should change stage from discovery to qualification', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);
      historyRepository.create.mockReturnValue(mockStageHistory);
      historyRepository.save.mockResolvedValue(mockStageHistory);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      await service.changeStage(
        'opp-uuid-123',
        'org-uuid-123',
        OpportunityStage.QUALIFICATION,
        '推进到资格审查',
        'user-uuid-123',
        1,
      );

      expect(historyRepository.save).toHaveBeenCalled();
      expect(opportunityRepository.update).toHaveBeenCalledWith(
        'opp-uuid-123',
        expect.objectContaining({ stage: OpportunityStage.QUALIFICATION }),
      );
    });

    it('should allow backward stage transition by one step', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.QUALIFICATION,
        version: 1,
      });
      historyRepository.create.mockReturnValue(mockStageHistory);
      historyRepository.save.mockResolvedValue(mockStageHistory);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      await service.changeStage(
        'opp-uuid-123',
        'org-uuid-123',
        OpportunityStage.DISCOVERY,
        '回退到发现阶段',
        'user-uuid-123',
        1,
      );

      expect(opportunityRepository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid stage jump', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);

      await expect(
        service.changeStage(
          'opp-uuid-123',
          'org-uuid-123',
          OpportunityStage.NEGOTIATION,
          '跳跃阶段',
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for version mismatch', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        version: 2,
      });

      await expect(
        service.changeStage(
          'opp-uuid-123',
          'org-uuid-123',
          OpportunityStage.QUALIFICATION,
          '推进',
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('markResult', () => {
    it('should mark opportunity as won from negotiation stage', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.NEGOTIATION,
        version: 1,
      });
      historyRepository.create.mockReturnValue(mockStageHistory);
      historyRepository.save.mockResolvedValue(mockStageHistory);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      await service.markResult(
        'opp-uuid-123',
        'org-uuid-123',
        OpportunityResult.WON,
        '成功签约',
        'user-uuid-123',
        1,
      );

      expect(opportunityRepository.update).toHaveBeenCalledWith(
        'opp-uuid-123',
        expect.objectContaining({ result: OpportunityResult.WON }),
      );
    });

    it('should mark opportunity as lost from negotiation stage', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.NEGOTIATION,
        version: 1,
      });
      historyRepository.create.mockReturnValue(mockStageHistory);
      historyRepository.save.mockResolvedValue(mockStageHistory);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      await service.markResult(
        'opp-uuid-123',
        'org-uuid-123',
        OpportunityResult.LOST,
        '客户选择竞争对手',
        'user-uuid-123',
        1,
      );

      expect(opportunityRepository.update).toHaveBeenCalledWith(
        'opp-uuid-123',
        expect.objectContaining({ result: OpportunityResult.LOST }),
      );
    });

    it('should throw BadRequestException if not in negotiation stage', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);

      await expect(
        service.markResult(
          'opp-uuid-123',
          'org-uuid-123',
          OpportunityResult.WON,
          '成功',
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for version mismatch', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.NEGOTIATION,
        version: 2,
      });

      await expect(
        service.markResult(
          'opp-uuid-123',
          'org-uuid-123',
          OpportunityResult.WON,
          '成功',
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findStageHistory', () => {
    it('should return stage history for opportunity', async () => {
      historyRepository.find.mockResolvedValue([mockStageHistory]);

      const result = await service.findStageHistory('opp-uuid-123', 'org-uuid-123');

      expect(result).toHaveLength(1);
      expect(result[0].fromStage).toBe(OpportunityStage.DISCOVERY);
      expect(result[0].toStage).toBe(OpportunityStage.QUALIFICATION);
    });
  });

  describe('SM-opportunity state machine validation', () => {
    it('should allow transition from discovery to qualification', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);
      historyRepository.create.mockReturnValue(mockStageHistory);
      historyRepository.save.mockResolvedValue(mockStageHistory);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStage(
          'opp-uuid-123',
          'org-uuid-123',
          OpportunityStage.QUALIFICATION,
          '推进',
          'user-uuid-123',
          1,
        ),
      ).resolves.not.toThrow();
    });

    it('should allow transition from qualification to proposal', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.QUALIFICATION,
        version: 1,
      });
      historyRepository.create.mockReturnValue(mockStageHistory);
      historyRepository.save.mockResolvedValue(mockStageHistory);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStage(
          'opp-uuid-123',
          'org-uuid-123',
          OpportunityStage.PROPOSAL,
          '推进',
          'user-uuid-123',
          1,
        ),
      ).resolves.not.toThrow();
    });

    it('should allow transition from proposal to negotiation', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.PROPOSAL,
        version: 1,
      });
      historyRepository.create.mockReturnValue(mockStageHistory);
      historyRepository.save.mockResolvedValue(mockStageHistory);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStage(
          'opp-uuid-123',
          'org-uuid-123',
          OpportunityStage.NEGOTIATION,
          '推进',
          'user-uuid-123',
          1,
        ),
      ).resolves.not.toThrow();
    });

    it('should block invalid transition: discovery to proposal', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);

      await expect(
        service.changeStage(
          'opp-uuid-123',
          'org-uuid-123',
          OpportunityStage.PROPOSAL,
          '跳跃',
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should only allow won/lost as result values', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.NEGOTIATION,
        version: 1,
      });
      historyRepository.create.mockReturnValue(mockStageHistory);
      historyRepository.save.mockResolvedValue(mockStageHistory);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      const validResults = [OpportunityResult.WON, OpportunityResult.LOST];

      for (const result of validResults) {
        opportunityRepository.findOne.mockResolvedValue({
          ...mockOpportunity,
          stage: OpportunityStage.NEGOTIATION,
          version: 1,
        });

        await expect(
          service.markResult(
            'opp-uuid-123',
            'org-uuid-123',
            result,
            '结果',
            'user-uuid-123',
            1,
          ),
        ).resolves.not.toThrow();
      }
    });
  });

  describe('getSummary', () => {
    it('should return summary statistics for org scope', async () => {
      const mockOpportunities = [
        { ...mockOpportunity, stage: OpportunityStage.DISCOVERY, result: null, amount: 100000 },
        { ...mockOpportunity, stage: OpportunityStage.QUALIFICATION, result: null, amount: 200000 },
        { ...mockOpportunity, stage: OpportunityStage.NEGOTIATION, result: null, amount: 300000 },
        { ...mockOpportunity, stage: OpportunityStage.NEGOTIATION, result: OpportunityResult.WON, amount: 400000 },
        { ...mockOpportunity, stage: OpportunityStage.NEGOTIATION, result: OpportunityResult.LOST, amount: 50000 },
      ];

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOpportunities),
      };
      opportunityRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getSummary('org-uuid-123', 'user-uuid-123', 'org');

      expect(result.total).toBe(5);
      expect(result.totalAmount).toBe(600000);
      expect(result.byStage[OpportunityStage.DISCOVERY]).toBe(1);
      expect(result.byStage[OpportunityStage.QUALIFICATION]).toBe(1);
      expect(result.byStage[OpportunityStage.NEGOTIATION]).toBe(1);
      expect(result.byResult.won).toBe(1);
      expect(result.byResult.lost).toBe(1);
    });

    it('should filter by self dataScope', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOpportunity]),
      };
      opportunityRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.getSummary('org-uuid-123', 'user-uuid-123', 'self');

      expect(mockQb.andWhere).toHaveBeenCalledWith('opp.ownerUserId = :userId', { userId: 'user-uuid-123' });
    });

    it('should calculate totalAmount correctly excluding lost opportunities', async () => {
      const mockOpportunities = [
        { ...mockOpportunity, stage: OpportunityStage.DISCOVERY, result: null, amount: 100000 },
        { ...mockOpportunity, stage: OpportunityStage.NEGOTIATION, result: OpportunityResult.WON, amount: 200000 },
        { ...mockOpportunity, stage: OpportunityStage.NEGOTIATION, result: OpportunityResult.LOST, amount: 50000 },
      ];

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOpportunities),
      };
      opportunityRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getSummary('org-uuid-123', 'user-uuid-123', 'org');

      expect(result.totalAmount).toBe(300000);
    });

    it('should return zero values when no opportunities exist', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      opportunityRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getSummary('org-uuid-123', 'user-uuid-123', 'org');

      expect(result.total).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.byResult.won).toBe(0);
      expect(result.byResult.lost).toBe(0);
    });
  });
});
