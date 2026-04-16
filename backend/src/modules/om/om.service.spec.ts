import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OmService } from './om.service';
import { Opportunity, OpportunityStage, OpportunityResult } from './entities/opportunity.entity';
import { OpportunityStageHistory } from './entities/opportunity-stage-history.entity';
import { Conversation } from '../cnv/entities/conversation.entity';
import { EventBusService } from '../../common/events/event-bus.service';
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('OmService', () => {
  let service: OmService;
  let opportunityRepository: any;
  let historyRepository: any;
  let conversationRepository: any;
  let eventBus: any;

  const mockOpportunity = {
    id: 'opp-1',
    orgId: 'org-1',
    customerId: 'customer-1',
    name: '测试商机',
    ownerUserId: 'user-1',
    stage: OpportunityStage.DISCOVERY,
    result: null,
    amount: 100000,
    expectedCloseDate: new Date('2026-06-30'),
    pauseReason: null,
    version: 1,
  };

  const createMockQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockOpportunity], 1]),
    getMany: jest.fn().mockResolvedValue([mockOpportunity]),
  });

  beforeEach(async () => {
    opportunityRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb()),
    };

    historyRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    conversationRepository = {
      findOne: jest.fn(),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OmService,
        { provide: getRepositoryToken(Opportunity), useValue: opportunityRepository },
        { provide: getRepositoryToken(OpportunityStageHistory), useValue: historyRepository },
        { provide: getRepositoryToken(Conversation), useValue: conversationRepository },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<OmService>(OmService);
  });

  describe('findOpportunityById', () => {
    it('should return opportunity if found', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);
      const result = await service.findOpportunityById('opp-1', 'org-1');
      expect(result.id).toBe('opp-1');
    });

    it('should throw NotFoundException if not found', async () => {
      opportunityRepository.findOne.mockResolvedValue(null);
      await expect(service.findOpportunityById('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should query with orgId for multi-tenant isolation', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);
      await service.findOpportunityById('opp-1', 'org-1');
      expect(opportunityRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'opp-1', orgId: 'org-1' },
      });
    });
  });

  describe('createOpportunity', () => {
    it('should create opportunity with discovery stage', async () => {
      opportunityRepository.create.mockReturnValue(mockOpportunity);
      opportunityRepository.save.mockResolvedValue(mockOpportunity);

      const result = await service.createOpportunity('org-1', { name: '测试商机' }, 'user-1');

      expect(opportunityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          stage: OpportunityStage.DISCOVERY,
          ownerUserId: 'user-1',
        }),
      );
    });

    it('should validate source conversation under same customer', async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: 'conv-1',
        orgId: 'org-1',
        customerId: 'customer-1',
      });
      opportunityRepository.create.mockReturnValue(mockOpportunity);
      opportunityRepository.save.mockResolvedValue(mockOpportunity);

      await service.createOpportunity(
        'org-1',
        {
          name: '娴嬭瘯鍟嗘満',
          customerId: 'customer-1',
          sourceConversationId: 'conv-1',
        } as any,
        'user-1',
      );

      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'conv-1', orgId: 'org-1' },
      });
    });

    it('should reject mismatched source conversation customer', async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: 'conv-1',
        orgId: 'org-1',
        customerId: 'customer-other',
      });

      await expect(
        service.createOpportunity(
          'org-1',
          {
            name: '娴嬭瘯鍟嗘満',
            customerId: 'customer-1',
            sourceConversationId: 'conv-1',
          } as any,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeStage', () => {
    it('should change stage from discovery to qualification', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);
      historyRepository.create.mockReturnValue({});
      historyRepository.save.mockResolvedValue({});
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      await service.changeStage('opp-1', 'org-1', OpportunityStage.QUALIFICATION, '推进', 'user-1', 1);

      expect(opportunityRepository.update).toHaveBeenCalledWith(
        'opp-1',
        expect.objectContaining({ stage: OpportunityStage.QUALIFICATION }),
      );
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should throw on illegal stage skip discovery->negotiation', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);

      await expect(
        service.changeStage('opp-1', 'org-1', OpportunityStage.NEGOTIATION, '跳级', 'user-1', 1),
      ).rejects.toThrow();
    });

    it('should allow sequential stage progression', async () => {
      const stages = [
        { from: OpportunityStage.DISCOVERY, to: OpportunityStage.QUALIFICATION },
        { from: OpportunityStage.QUALIFICATION, to: OpportunityStage.PROPOSAL },
        { from: OpportunityStage.PROPOSAL, to: OpportunityStage.NEGOTIATION },
      ];

      for (const { from, to } of stages) {
        const opp = { ...mockOpportunity, stage: from };
        opportunityRepository.findOne.mockResolvedValue(opp);
        opportunityRepository.update.mockResolvedValue({ affected: 1 });
        historyRepository.create.mockReturnValue({});
        historyRepository.save.mockResolvedValue({});

        await expect(
          service.changeStage('opp-1', 'org-1', to, '推进', 'user-1', 1),
        ).resolves.toBeDefined();
      }
    });

    it('should throw ConflictException on version mismatch', async () => {
      opportunityRepository.findOne.mockResolvedValue({ ...mockOpportunity, version: 2 });

      await expect(
        service.changeStage('opp-1', 'org-1', OpportunityStage.QUALIFICATION, '推进', 'user-1', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('markResult', () => {
    it('should mark result as won from negotiation stage', async () => {
      const negotiationOpp = { ...mockOpportunity, stage: OpportunityStage.NEGOTIATION };
      opportunityRepository.findOne.mockResolvedValue(negotiationOpp);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });
      historyRepository.create.mockReturnValue({});
      historyRepository.save.mockResolvedValue({});

      await service.markResult('opp-1', 'org-1', OpportunityResult.WON, '赢单', 'user-1', 1);

      expect(opportunityRepository.update).toHaveBeenCalledWith(
        'opp-1',
        expect.objectContaining({ result: OpportunityResult.WON }),
      );
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should mark result as lost from negotiation stage', async () => {
      const negotiationOpp = { ...mockOpportunity, stage: OpportunityStage.NEGOTIATION };
      opportunityRepository.findOne.mockResolvedValue(negotiationOpp);
      opportunityRepository.update.mockResolvedValue({ affected: 1 });
      historyRepository.create.mockReturnValue({});
      historyRepository.save.mockResolvedValue({});

      await service.markResult('opp-1', 'org-1', OpportunityResult.LOST, '输单', 'user-1', 1);

      expect(opportunityRepository.update).toHaveBeenCalledWith(
        'opp-1',
        expect.objectContaining({ result: OpportunityResult.LOST }),
      );
    });

    it('should throw when marking result from non-negotiation stage', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);

      await expect(
        service.markResult('opp-1', 'org-1', OpportunityResult.WON, '赢单', 'user-1', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getSummary', () => {
    it('should return summary with correct counts', async () => {
      const opps = [
        { ...mockOpportunity, stage: OpportunityStage.DISCOVERY, result: null, amount: 10000 },
        { ...mockOpportunity, stage: OpportunityStage.NEGOTIATION, result: OpportunityResult.WON, amount: 50000 },
        { ...mockOpportunity, stage: OpportunityStage.NEGOTIATION, result: OpportunityResult.LOST, amount: 20000 },
      ];
      const qb = createMockQb();
      qb.getMany.mockResolvedValue(opps);
      opportunityRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getSummary('org-1', 'user-1', 'all');

      expect(result.total).toBe(3);
      expect(result.byResult.won).toBe(1);
      expect(result.byResult.lost).toBe(1);
    });
  });

  describe('getForecast', () => {
    it('should calculate forecast and include drivers', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.PROPOSAL,
        amount: 320000,
        expectedCloseDate: new Date('2026-05-20'),
      });

      const result = await service.getForecast('opp-1', 'org-1', 'user-1', 'all', {
        forecastModel: 'default',
        includeDrivers: true,
      });

      expect(result.opportunityId).toBe('opp-1');
      expect(result.winRate).toBeGreaterThan(0);
      expect(result.commitBand).toBeDefined();
      expect(result.drivers.length).toBeGreaterThan(0);
    });

    it('should hide drivers when includeDrivers=false', async () => {
      opportunityRepository.findOne.mockResolvedValue(mockOpportunity);

      const result = await service.getForecast('opp-1', 'org-1', 'user-1', 'all', {
        forecastModel: 'default',
        includeDrivers: false,
      });

      expect(result.drivers).toEqual([]);
    });

    it('should return fixed high forecast for won opportunity', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        result: OpportunityResult.WON,
      });

      const result = await service.getForecast('opp-1', 'org-1', 'user-1', 'all', {
        forecastModel: 'default',
        includeDrivers: true,
      });

      expect(result.winRate).toBe(100);
      expect(result.commitBand).toBe('high');
    });

    it('should enforce self data scope when owner mismatch', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        ownerUserId: 'other-user',
      });

      await expect(
        service.getForecast('opp-1', 'org-1', 'user-1', 'self', {
          forecastModel: 'default',
          includeDrivers: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('pauseOpportunity', () => {
    it('should update pause reason and publish stage event', async () => {
      opportunityRepository.findOne
        .mockResolvedValueOnce({ ...mockOpportunity, pauseReason: null })
        .mockResolvedValueOnce({ ...mockOpportunity, pauseReason: '等待预算审批' });
      historyRepository.create.mockReturnValue({});
      historyRepository.save.mockResolvedValue({});
      opportunityRepository.update.mockResolvedValue({ affected: 1 });

      await service.pauseOpportunity(
        'opp-1',
        'org-1',
        '等待预算审批',
        'user-1',
        'all',
        1,
      );

      expect(opportunityRepository.update).toHaveBeenCalledWith(
        'opp-1',
        expect.objectContaining({ pauseReason: '等待预算审批' }),
      );
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should throw BadRequestException when pause reason is empty', async () => {
      await expect(
        service.pauseOpportunity('opp-1', 'org-1', '   ', 'user-1', 'all', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on version mismatch', async () => {
      opportunityRepository.findOne.mockResolvedValue({ ...mockOpportunity, version: 2 });

      await expect(
        service.pauseOpportunity('opp-1', 'org-1', '等待预算审批', 'user-1', 'all', 1),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when opportunity already has result', async () => {
      opportunityRepository.findOne.mockResolvedValue({
        ...mockOpportunity,
        result: OpportunityResult.WON,
      });

      await expect(
        service.pauseOpportunity('opp-1', 'org-1', '等待预算审批', 'user-1', 'all', 1),
      ).rejects.toThrow(ConflictException);
    });
  });
});
