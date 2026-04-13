import { ContractExpiryScheduler } from './contract-expiry.scheduler';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { NtfService } from '../ntf/ntf.service';
import { EventBusService } from '../../common/events/event-bus.service';

describe('ContractExpiryScheduler', () => {
  let scheduler: ContractExpiryScheduler;
  let contractRepository: any;
  let ntfService: any;
  let eventBus: any;

  const mockContract = {
    id: 'contract-1',
    orgId: 'org-1',
    contractNo: 'CT-2026-00001',
    customerId: 'customer-1',
    status: 'active',
    endsOn: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    createdBy: 'user-1',
  };

  beforeEach(() => {
    contractRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockContract]),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      }),
    };

    ntfService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };

    eventBus = {
      publish: jest.fn(),
    };

    scheduler = new ContractExpiryScheduler(
      contractRepository,
      ntfService,
      eventBus,
    );
  });

  describe('checkAndNotifyExpiringContracts', () => {
    it('should find and notify expiring contracts', async () => {
      const count = await scheduler.checkAndNotifyExpiringContracts(30);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'contract.expiry_warning' }),
      );
      expect(ntfService.createNotification).toHaveBeenCalledWith(
        'org-1',
        'user-1',
        'system',
        expect.stringContaining('合同即将到期'),
        expect.any(String),
        'contract',
        'contract-1',
      );
    });

    it('should not notify if no contracts expiring', async () => {
      contractRepository.createQueryBuilder().getMany.mockResolvedValue([]);

      const count = await scheduler.checkAndNotifyExpiringContracts(30);

      expect(count).toBe(0);
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle notification failure gracefully', async () => {
      ntfService.createNotification.mockRejectedValue(new Error('ntf failed'));

      const count = await scheduler.checkAndNotifyExpiringContracts(30);

      expect(count).toBe(0);
    });
  });

  describe('expireOverdueContracts', () => {
    it('should expire contracts past their end date', async () => {
      const mockQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      };
      contractRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQb);

      const count = await scheduler.expireOverdueContracts();

      expect(count).toBe(2);
      expect(mockQb.update).toHaveBeenCalledWith(Contract);
    });
  });
});
