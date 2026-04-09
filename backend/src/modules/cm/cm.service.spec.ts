import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CmService } from './cm.service';
import { Customer, CustomerStatus } from './entities/customer.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { EventBusService } from '../../common/events/event-bus.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CmService', () => {
  let service: CmService;
  let customerRepository: any;
  let contactRepository: any;
  let eventBus: any;

  const mockCustomer = {
    id: 'customer-1',
    orgId: 'org-1',
    name: '测试客户',
    phone: '13800138000',
    email: 'test@example.com',
    ownerUserId: 'user-1',
    status: CustomerStatus.POTENTIAL,
    version: 1,
  };

  const createMockQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockCustomer], 1]),
  });

  beforeEach(async () => {
    customerRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb()),
    };

    contactRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softRemove: jest.fn(),
    };

    eventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CmService,
        { provide: getRepositoryToken(Customer), useValue: customerRepository },
        { provide: getRepositoryToken(CustomerContact), useValue: contactRepository },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<CmService>(CmService);
  });

  describe('findCustomerById', () => {
    it('should return customer if found', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      const result = await service.findCustomerById('customer-1', 'org-1');
      expect(result.id).toBe('customer-1');
    });

    it('should throw NotFoundException if not found', async () => {
      customerRepository.findOne.mockResolvedValue(null);
      await expect(service.findCustomerById('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should query with orgId for multi-tenant isolation', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      await service.findCustomerById('customer-1', 'org-1');
      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'customer-1', orgId: 'org-1' },
      });
    });
  });

  describe('createCustomer', () => {
    it('should create customer with orgId and ownerUserId', async () => {
      customerRepository.create.mockReturnValue(mockCustomer);
      customerRepository.save.mockResolvedValue(mockCustomer);

      const result = await service.createCustomer('org-1', { name: '测试客户' }, 'user-1');

      expect(customerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          ownerUserId: 'user-1',
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateCustomer', () => {
    it('should update customer when version matches', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      customerRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateCustomer('customer-1', 'org-1', { name: '更新名称' }, 1);

      expect(customerRepository.update).toHaveBeenCalledWith(
        'customer-1',
        expect.objectContaining({ name: '更新名称' }),
      );
    });

    it('should throw ConflictException when version mismatch', async () => {
      customerRepository.findOne.mockResolvedValue({ ...mockCustomer, version: 2 });

      await expect(
        service.updateCustomer('customer-1', 'org-1', { name: '更新名称' }, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changeStatus', () => {
    it('should change status from potential to active', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await service.changeStatus('customer-1', 'org-1', CustomerStatus.ACTIVE, '激活', 1);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: expect.stringContaining('customer'),
        }),
      );
    });

    it('should throw on illegal transition potential->lost', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);

      await expect(
        service.changeStatus('customer-1', 'org-1', CustomerStatus.LOST, '流失', 1),
      ).rejects.toThrow();
    });

    it('should allow active->silent', async () => {
      const activeCustomer = { ...mockCustomer, status: CustomerStatus.ACTIVE };
      customerRepository.findOne.mockResolvedValue(activeCustomer);
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStatus('customer-1', 'org-1', CustomerStatus.SILENT, '沉默', 1),
      ).resolves.toBeDefined();
    });

    it('should allow active->lost', async () => {
      const activeCustomer = { ...mockCustomer, status: CustomerStatus.ACTIVE };
      customerRepository.findOne.mockResolvedValue(activeCustomer);
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStatus('customer-1', 'org-1', CustomerStatus.LOST, '流失', 1),
      ).resolves.toBeDefined();
    });

    it('should allow silent->active', async () => {
      const silentCustomer = { ...mockCustomer, status: CustomerStatus.SILENT };
      customerRepository.findOne.mockResolvedValue(silentCustomer);
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStatus('customer-1', 'org-1', CustomerStatus.ACTIVE, '重新激活', 1),
      ).resolves.toBeDefined();
    });

    it('should disallow lost->active', async () => {
      const lostCustomer = { ...mockCustomer, status: CustomerStatus.LOST };
      customerRepository.findOne.mockResolvedValue(lostCustomer);

      await expect(
        service.changeStatus('customer-1', 'org-1', CustomerStatus.ACTIVE, '重新激活', 1),
      ).rejects.toThrow();
    });
  });

  describe('findContacts', () => {
    it('should return contacts for a customer', async () => {
      const mockContacts = [{ id: 'contact-1', customerId: 'customer-1', isPrimary: true }];
      contactRepository.find.mockResolvedValue(mockContacts);

      const result = await service.findContacts('customer-1', 'org-1');

      expect(contactRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', orgId: 'org-1' },
        order: { isPrimary: 'DESC', createdAt: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('createContact', () => {
    it('should create a contact for a customer', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      contactRepository.create.mockReturnValue({ id: 'contact-1', customerId: 'customer-1', name: '张三' });
      contactRepository.save.mockResolvedValue({ id: 'contact-1', customerId: 'customer-1', name: '张三' });

      const result = await service.createContact('customer-1', 'org-1', { name: '张三' }, 'user-1');

      expect(contactRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-1',
          orgId: 'org-1',
          name: '张三',
          createdBy: 'user-1',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should clear existing primary when creating a primary contact', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      contactRepository.create.mockReturnValue({ id: 'contact-2', isPrimary: true });
      contactRepository.save.mockResolvedValue({ id: 'contact-2', isPrimary: true });
      contactRepository.update.mockResolvedValue({ affected: 1 });

      await service.createContact('customer-1', 'org-1', { name: '李四', isPrimary: true }, 'user-1');

      expect(contactRepository.update).toHaveBeenCalledWith(
        { customerId: 'customer-1', orgId: 'org-1', isPrimary: true },
        { isPrimary: false },
      );
    });

    it('should throw NotFoundException if customer not found', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createContact('nonexistent', 'org-1', { name: '张三' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateContact', () => {
    const mockContact = {
      id: 'contact-1',
      customerId: 'customer-1',
      orgId: 'org-1',
      name: '张三',
      isPrimary: false,
      version: 1,
    };

    it('should update contact when version matches', async () => {
      contactRepository.findOne.mockResolvedValue(mockContact);
      contactRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateContact('contact-1', 'customer-1', 'org-1', { name: '李四' }, 1);

      expect(contactRepository.update).toHaveBeenCalledWith(
        'contact-1',
        expect.objectContaining({ name: '李四' }),
      );
    });

    it('should throw ConflictException when version mismatch', async () => {
      contactRepository.findOne.mockResolvedValue({ ...mockContact, version: 2 });

      await expect(
        service.updateContact('contact-1', 'customer-1', 'org-1', { name: '李四' }, 1),
      ).rejects.toThrow(ConflictException);
    });

    it('should clear existing primary when setting contact as primary', async () => {
      contactRepository.findOne.mockResolvedValue(mockContact);
      contactRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateContact('contact-1', 'customer-1', 'org-1', { isPrimary: true }, 1);

      expect(contactRepository.update).toHaveBeenCalledWith(
        { customerId: 'customer-1', orgId: 'org-1', isPrimary: true },
        { isPrimary: false },
      );
    });
  });

  describe('deleteContact', () => {
    it('should soft delete a contact', async () => {
      const mockContact = { id: 'contact-1', customerId: 'customer-1', orgId: 'org-1' };
      contactRepository.findOne.mockResolvedValue(mockContact);
      contactRepository.softRemove.mockResolvedValue(mockContact);

      await service.deleteContact('contact-1', 'customer-1', 'org-1');

      expect(contactRepository.softRemove).toHaveBeenCalledWith(mockContact);
    });

    it('should throw NotFoundException if contact not found', async () => {
      contactRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteContact('nonexistent', 'customer-1', 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setPrimaryContact', () => {
    const mockContact = {
      id: 'contact-1',
      customerId: 'customer-1',
      orgId: 'org-1',
      isPrimary: false,
      version: 1,
    };

    it('should set contact as primary', async () => {
      contactRepository.findOne.mockResolvedValue(mockContact);
      contactRepository.update.mockResolvedValue({ affected: 1 });

      await service.setPrimaryContact('contact-1', 'customer-1', 'org-1', 1);

      expect(contactRepository.update).toHaveBeenCalledWith(
        { customerId: 'customer-1', orgId: 'org-1', isPrimary: true },
        { isPrimary: false },
      );
      expect(contactRepository.update).toHaveBeenCalledWith(
        'contact-1',
        expect.objectContaining({ isPrimary: true }),
      );
    });

    it('should throw ConflictException when version mismatch', async () => {
      contactRepository.findOne.mockResolvedValue({ ...mockContact, version: 2 });

      await expect(
        service.setPrimaryContact('contact-1', 'customer-1', 'org-1', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findCustomers', () => {
    it('should filter by orgId', async () => {
      const qb = createMockQb();
      customerRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findCustomers('org-1', 'user-1', 'all', {}, 1, 20);

      expect(qb.where).toHaveBeenCalledWith('customer.orgId = :orgId', { orgId: 'org-1' });
    });

    it('should filter by self dataScope', async () => {
      const qb = createMockQb();
      customerRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findCustomers('org-1', 'user-1', 'self', {}, 1, 20);

      expect(qb.andWhere).toHaveBeenCalledWith('customer.ownerUserId = :userId', { userId: 'user-1' });
    });

    it('should filter by status', async () => {
      const qb = createMockQb();
      customerRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findCustomers('org-1', 'user-1', 'all', { status: 'active' }, 1, 20);

      expect(qb.andWhere).toHaveBeenCalledWith('customer.status = :status', { status: 'active' });
    });

    it('should filter by keyword', async () => {
      const qb = createMockQb();
      customerRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findCustomers('org-1', 'user-1', 'all', { keyword: '测试' }, 1, 20);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(customer.name LIKE :keyword OR customer.phone LIKE :keyword)',
        { keyword: '%测试%' },
      );
    });
  });
});
