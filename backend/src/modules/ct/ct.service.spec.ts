import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CtService } from './ct.service';
import { Contract } from './entities/contract.entity';
import { ContractApproval } from './entities/contract-approval.entity';
import { ContractDocument } from './entities/contract-document.entity';
import { EventBusService } from '../../common/events/event-bus.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

describe('CtService', () => {
  let service: CtService;
  let contractRepository: any;
  let approvalRepository: any;
  let documentRepository: any;
  let eventBus: any;

  const mockContract = {
    id: 'contract-1',
    orgId: 'org-1',
    quoteId: null,
    opportunityId: 'opp-1',
    customerId: 'customer-1',
    contractNo: 'CT-2026-00001',
    status: 'draft',
    signedAt: null,
    startsOn: null,
    endsOn: null,
    version: 1,
    createdBy: 'user-1',
  };

  const createMockQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockContract], 1]),
  });

  beforeEach(async () => {
    contractRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb()),
    };

    approvalRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    documentRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CtService,
        { provide: getRepositoryToken(Contract), useValue: contractRepository },
        { provide: getRepositoryToken(ContractApproval), useValue: approvalRepository },
        { provide: getRepositoryToken(ContractDocument), useValue: documentRepository },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<CtService>(CtService);
  });

  describe('findContractById', () => {
    it('should return contract if found', async () => {
      contractRepository.findOne.mockResolvedValue(mockContract);
      const result = await service.findContractById('contract-1', 'org-1');
      expect(result.id).toBe('contract-1');
    });

    it('should throw NotFoundException if not found', async () => {
      contractRepository.findOne.mockResolvedValue(null);
      await expect(service.findContractById('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should query with orgId for multi-tenant isolation', async () => {
      contractRepository.findOne.mockResolvedValue(mockContract);
      await service.findContractById('contract-1', 'org-1');
      expect(contractRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'contract-1', orgId: 'org-1' }),
        }),
      );
    });
  });

  describe('createContract', () => {
    it('should create contract with draft status', async () => {
      contractRepository.create.mockReturnValue(mockContract);
      contractRepository.save.mockResolvedValue(mockContract);

      const dto = {
        opportunityId: 'opp-1',
        customerId: 'customer-1',
      };

      const result = await service.createContract('org-1', dto, 'user-1');

      expect(contractRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          status: 'draft',
          opportunityId: 'opp-1',
          customerId: 'customer-1',
        }),
      );
    });

    it('should create contract with quote reference', async () => {
      contractRepository.create.mockReturnValue({ ...mockContract, quoteId: 'quote-1' });
      contractRepository.save.mockResolvedValue({ ...mockContract, quoteId: 'quote-1' });

      const dto = {
        quoteId: 'quote-1',
        opportunityId: 'opp-1',
        customerId: 'customer-1',
      };

      const result = await service.createContract('org-1', dto, 'user-1');

      expect(contractRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ quoteId: 'quote-1' }),
      );
    });
  });

  describe('createContractFromQuote', () => {
    it('should create contract linked to quote', async () => {
      contractRepository.create.mockReturnValue({ ...mockContract, quoteId: 'quote-1' });
      contractRepository.save.mockResolvedValue({ ...mockContract, quoteId: 'quote-1' });

      const result = await service.createContractFromQuote(
        'org-1', 'quote-1', 'opp-1', 'customer-1', 'user-1',
      );

      expect(contractRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ quoteId: 'quote-1' }),
      );
    });
  });

  describe('submitApproval', () => {
    it('should transition draft to pending_approval', async () => {
      contractRepository.findOne
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce({ ...mockContract, status: 'pending_approval' });
      approvalRepository.create.mockReturnValue({});
      approvalRepository.save.mockResolvedValue({});
      contractRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.submitApproval(
        'contract-1', 'org-1', ['approver-1'], undefined, 1, 'user-1',
      );

      expect(contractRepository.update).toHaveBeenCalledWith(
        'contract-1',
        expect.objectContaining({ status: 'pending_approval' }),
      );
      expect(approvalRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledTimes(2);
    });

    it('should throw on illegal transition approved->pending_approval', async () => {
      contractRepository.findOne.mockResolvedValue({ ...mockContract, status: 'approved' });

      await expect(
        service.submitApproval('contract-1', 'org-1', ['approver-1'], undefined, 1, 'user-1'),
      ).rejects.toThrow();
    });
  });

  describe('approveContract', () => {
    it('should approve pending_approval contract', async () => {
      const pendingContract = { ...mockContract, status: 'pending_approval' };
      contractRepository.findOne
        .mockResolvedValueOnce(pendingContract)
        .mockResolvedValueOnce({ ...pendingContract, status: 'approved' });
      approvalRepository.findOne.mockResolvedValue({ id: 'approval-1', status: 'pending' });
      approvalRepository.update.mockResolvedValue({ affected: 1 });
      contractRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.approveContract(
        'contract-1', 'org-1', 'approved', '同意', 'approver-1',
      );

      expect(contractRepository.update).toHaveBeenCalledWith(
        'contract-1',
        expect.objectContaining({ status: 'approved' }),
      );
    });

    it('should reject pending_approval contract', async () => {
      const pendingContract = { ...mockContract, status: 'pending_approval' };
      contractRepository.findOne
        .mockResolvedValueOnce(pendingContract)
        .mockResolvedValueOnce({ ...pendingContract, status: 'rejected' });
      approvalRepository.findOne.mockResolvedValue({ id: 'approval-1', status: 'pending' });
      approvalRepository.update.mockResolvedValue({ affected: 1 });
      contractRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.approveContract(
        'contract-1', 'org-1', 'rejected', '条款不合理', 'approver-1',
      );

      expect(contractRepository.update).toHaveBeenCalledWith(
        'contract-1',
        expect.objectContaining({ status: 'rejected' }),
      );
    });

    it('should throw ForbiddenException when user is not assigned approver', async () => {
      contractRepository.findOne.mockResolvedValue({ ...mockContract, status: 'pending_approval' });
      approvalRepository.findOne.mockResolvedValue(null);

      await expect(
        service.approveContract('contract-1', 'org-1', 'approved', '同意', 'non-approver'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('signContract', () => {
    it('should transition approved to signing', async () => {
      const approvedContract = { ...mockContract, status: 'approved' };
      contractRepository.findOne
        .mockResolvedValueOnce(approvedContract)
        .mockResolvedValueOnce({ ...approvedContract, status: 'signing' });
      contractRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.signContract(
        'contract-1', 'org-1', 'fadada', 1, 'user-1',
      );

      expect(contractRepository.update).toHaveBeenCalledWith(
        'contract-1',
        expect.objectContaining({ status: 'signing' }),
      );
      expect(eventBus.publish).toHaveBeenCalledTimes(2);
    });

    it('should throw on illegal transition draft->signing', async () => {
      contractRepository.findOne.mockResolvedValue(mockContract);

      await expect(
        service.signContract('contract-1', 'org-1', 'fadada', 1, 'user-1'),
      ).rejects.toThrow();
    });
  });

  describe('activateContract', () => {
    it('should transition signing to active', async () => {
      const signingContract = { ...mockContract, status: 'signing' };
      contractRepository.findOne
        .mockResolvedValueOnce(signingContract)
        .mockResolvedValueOnce({ ...signingContract, status: 'active', signedAt: expect.any(Date) });
      contractRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.activateContract('contract-1', 'org-1', 'user-1');

      expect(contractRepository.update).toHaveBeenCalledWith(
        'contract-1',
        expect.objectContaining({ status: 'active', signedAt: expect.any(Date) }),
      );
    });
  });

  describe('terminateContract', () => {
    it('should transition active to terminated', async () => {
      const activeContract = { ...mockContract, status: 'active' };
      contractRepository.findOne
        .mockResolvedValueOnce(activeContract)
        .mockResolvedValueOnce({ ...activeContract, status: 'terminated' });
      contractRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.terminateContract(
        'contract-1', 'org-1', '客户违约', 'user-1',
      );

      expect(contractRepository.update).toHaveBeenCalledWith(
        'contract-1',
        expect.objectContaining({ status: 'terminated' }),
      );
    });
  });

  describe('deleteContract', () => {
    it('should soft delete draft contract', async () => {
      contractRepository.findOne.mockResolvedValue(mockContract);
      contractRepository.update.mockResolvedValue({ affected: 1 });

      await service.deleteContract('contract-1', 'org-1', 'user-1');

      expect(contractRepository.update).toHaveBeenCalledWith(
        'contract-1',
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });

    it('should throw when deleting active contract', async () => {
      contractRepository.findOne.mockResolvedValue({ ...mockContract, status: 'active' });

      await expect(
        service.deleteContract('contract-1', 'org-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('state machine validation', () => {
    it('should reject illegal transition draft->active', async () => {
      const { contractStateMachine } = require('../../common/statemachine/definitions/contract.sm');
      expect(() => contractStateMachine.validateTransition('draft', 'active')).toThrow();
    });

    it('should reject illegal transition terminated->active', async () => {
      const { contractStateMachine } = require('../../common/statemachine/definitions/contract.sm');
      expect(() => contractStateMachine.validateTransition('terminated', 'active')).toThrow();
    });

    it('should validate happy path: draft->pending_approval->approved->signing->active', () => {
      const { contractStateMachine } = require('../../common/statemachine/definitions/contract.sm');
      expect(() => contractStateMachine.validateTransition('draft', 'pending_approval')).not.toThrow();
      expect(() => contractStateMachine.validateTransition('pending_approval', 'approved')).not.toThrow();
      expect(() => contractStateMachine.validateTransition('approved', 'signing')).not.toThrow();
      expect(() => contractStateMachine.validateTransition('signing', 'active')).not.toThrow();
    });
  });
});
