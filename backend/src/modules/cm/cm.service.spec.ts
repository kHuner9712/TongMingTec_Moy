import { Test, TestingModule } from '@nestjs/testing';
import { CmService } from './cm.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer, CustomerStatus, CustomerLevel } from './entities/customer.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CmService', () => {
  let service: CmService;
  let customerRepository: jest.Mocked<any>;
  let contactRepository: jest.Mocked<any>;

  const mockCustomer = {
    id: 'customer-uuid-123',
    orgId: 'org-uuid-123',
    name: '测试客户',
    industry: '科技',
    level: CustomerLevel.L1,
    ownerUserId: 'user-uuid-123',
    status: CustomerStatus.POTENTIAL,
    phone: '13800138000',
    email: 'test@example.com',
    address: '北京市朝阳区',
    remark: '测试备注',
    lastContactAt: null,
    version: 1,
  };

  const mockContact = {
    id: 'contact-uuid-123',
    customerId: 'customer-uuid-123',
    orgId: 'org-uuid-123',
    name: '联系人A',
    phone: '13900139000',
    email: 'contact@example.com',
    isPrimary: true,
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
        CmService,
        {
          provide: getRepositoryToken(Customer),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(createMockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(CustomerContact),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CmService>(CmService);
    customerRepository = module.get(getRepositoryToken(Customer));
    contactRepository = module.get(getRepositoryToken(CustomerContact));
  });

  describe('findCustomerById', () => {
    it('should return customer if found', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findCustomerById('customer-uuid-123', 'org-uuid-123');

      expect(result.id).toBe('customer-uuid-123');
      expect(result.name).toBe('测试客户');
    });

    it('should throw NotFoundException if customer not found', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findCustomerById('nonexistent', 'org-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCustomers', () => {
    it('should return paginated customers with filters', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockCustomer], 1]);
      customerRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findCustomers(
        'org-uuid-123',
        'user-uuid-123',
        'org',
        { status: CustomerStatus.ACTIVE, keyword: '测试' },
        1,
        10,
      );

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by self dataScope', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockCustomer], 1]);
      customerRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findCustomers(
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

  describe('createCustomer', () => {
    it('should create customer with potential status', async () => {
      customerRepository.create.mockReturnValue(mockCustomer);
      customerRepository.save.mockResolvedValue(mockCustomer);

      const result = await service.createCustomer('org-uuid-123', {
        name: '测试客户',
        phone: '13800138000',
      }, 'user-uuid-123');

      expect(customerRepository.create).toHaveBeenCalled();
      expect(customerRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('测试客户');
    });
  });

  describe('updateCustomer', () => {
    it('should update customer with version check', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateCustomer(
        'customer-uuid-123',
        'org-uuid-123',
        { name: '更新后的客户名' },
        1,
      );

      expect(customerRepository.update).toHaveBeenCalled();
    });

    it('should throw ConflictException for version mismatch', async () => {
      customerRepository.findOne.mockResolvedValue({
        ...mockCustomer,
        version: 2,
      });

      await expect(
        service.updateCustomer('customer-uuid-123', 'org-uuid-123', { name: '新名称' }, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changeStatus', () => {
    it('should change customer status from potential to active', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await service.changeStatus(
        'customer-uuid-123',
        'org-uuid-123',
        CustomerStatus.ACTIVE,
        '客户已激活',
        1,
      );

      expect(customerRepository.update).toHaveBeenCalledWith(
        'customer-uuid-123',
        expect.objectContaining({ status: CustomerStatus.ACTIVE }),
      );
    });

    it('should change status from active to silent', async () => {
      customerRepository.findOne.mockResolvedValue({
        ...mockCustomer,
        status: CustomerStatus.ACTIVE,
        version: 1,
      });
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await service.changeStatus(
        'customer-uuid-123',
        'org-uuid-123',
        CustomerStatus.SILENT,
        '客户沉默',
        1,
      );

      expect(customerRepository.update).toHaveBeenCalled();
    });

    it('should change status from active to lost', async () => {
      customerRepository.findOne.mockResolvedValue({
        ...mockCustomer,
        status: CustomerStatus.ACTIVE,
        version: 1,
      });
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await service.changeStatus(
        'customer-uuid-123',
        'org-uuid-123',
        CustomerStatus.LOST,
        '客户流失',
        1,
      );

      expect(customerRepository.update).toHaveBeenCalledWith(
        'customer-uuid-123',
        expect.objectContaining({ status: CustomerStatus.LOST }),
      );
    });
  });

  describe('findContacts', () => {
    it('should return contacts for customer', async () => {
      contactRepository.find.mockResolvedValue([mockContact]);

      const result = await service.findContacts('customer-uuid-123', 'org-uuid-123');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('联系人A');
    });
  });

  describe('SM-customer state machine validation', () => {
    it('should allow transition from potential to active', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStatus('customer-uuid-123', 'org-uuid-123', CustomerStatus.ACTIVE, '激活', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from active to silent', async () => {
      customerRepository.findOne.mockResolvedValue({
        ...mockCustomer,
        status: CustomerStatus.ACTIVE,
        version: 1,
      });
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStatus('customer-uuid-123', 'org-uuid-123', CustomerStatus.SILENT, '沉默', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from active to lost', async () => {
      customerRepository.findOne.mockResolvedValue({
        ...mockCustomer,
        status: CustomerStatus.ACTIVE,
        version: 1,
      });
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStatus('customer-uuid-123', 'org-uuid-123', CustomerStatus.LOST, '流失', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from silent to active', async () => {
      customerRepository.findOne.mockResolvedValue({
        ...mockCustomer,
        status: CustomerStatus.SILENT,
        version: 1,
      });
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStatus('customer-uuid-123', 'org-uuid-123', CustomerStatus.ACTIVE, '重新激活', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from silent to lost', async () => {
      customerRepository.findOne.mockResolvedValue({
        ...mockCustomer,
        status: CustomerStatus.SILENT,
        version: 1,
      });
      customerRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.changeStatus('customer-uuid-123', 'org-uuid-123', CustomerStatus.LOST, '流失', 1),
      ).resolves.not.toThrow();
    });
  });
});
