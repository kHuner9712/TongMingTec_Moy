import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { OrgService } from './org.service';
import { Organization, OrganizationStatus, OnboardStage } from './entities/organization.entity';
import { Department } from './entities/department.entity';
import { Permission } from '../usr/entities/permission.entity';
import { DataSource } from 'typeorm';
import { PermissionSeedRunner } from '../usr/seeds/permission-seed-runner';

describe('OrgService', () => {
  let service: OrgService;
  let orgRepository: jest.Mocked<any>;
  let deptRepository: jest.Mocked<any>;

  const mockOrg = {
    id: 'org-uuid-123',
    code: 'test-org',
    name: 'Test Organization',
    status: OrganizationStatus.ACTIVE,
    timezone: 'Asia/Shanghai',
    locale: 'zh-CN',
    version: 1,
    onboardStage: OnboardStage.BOOTSTRAP_PENDING,
  };

  const mockDepartment = {
    id: 'dept-uuid-123',
    orgId: 'org-uuid-123',
    code: 'dept-001',
    name: 'Test Department',
    parentId: null,
    path: '/',
    sortOrder: 0,
    version: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgService,
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Department),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) => cb({
              update: jest.fn().mockResolvedValue({ affected: 1 }),
              create: jest.fn().mockReturnValue(mockDepartment),
              save: jest.fn().mockResolvedValue(mockDepartment),
            })),
          },
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PermissionSeedRunner,
          useValue: {
            seedForOrg: jest.fn().mockResolvedValue(48),
          },
        },
      ],
    }).compile();

    service = module.get<OrgService>(OrgService);
    orgRepository = module.get(getRepositoryToken(Organization));
    deptRepository = module.get(getRepositoryToken(Department));
  });

  describe('findById', () => {
    it('should return organization when found and matches orgId', async () => {
      orgRepository.findOne.mockResolvedValue(mockOrg);

      const result = await service.findById('org-uuid-123', 'org-uuid-123');

      expect(result).toEqual(mockOrg);
    });

    it('should throw NotFoundException when organization not found', async () => {
      orgRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findById('non-existent', 'org-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when orgId does not match', async () => {
      orgRepository.findOne.mockResolvedValue(mockOrg);

      await expect(
        service.findById('org-uuid-123', 'different-org-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update organization with valid version', async () => {
      orgRepository.findOne.mockResolvedValue(mockOrg);
      orgRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(
        'org-uuid-123',
        'org-uuid-123',
        { name: 'Updated Name' },
        1,
      );

      expect(orgRepository.update).toHaveBeenCalled();
    });

    it('should throw ConflictException on version mismatch', async () => {
      orgRepository.findOne.mockResolvedValue({ ...mockOrg, version: 2 });

      await expect(
        service.update('org-uuid-123', 'org-uuid-123', { name: 'Updated' }, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findDepartments', () => {
    it('should return departments for organization', async () => {
      deptRepository.find.mockResolvedValue([mockDepartment]);

      const result = await service.findDepartments('org-uuid-123');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Department');
    });
  });

  describe('createDepartment', () => {
    it('should create department with valid data', async () => {
      deptRepository.findOne.mockResolvedValue(null);
      deptRepository.create.mockReturnValue(mockDepartment);
      deptRepository.save.mockResolvedValue(mockDepartment);

      const result = await service.createDepartment(
        'org-uuid-123',
        { code: 'dept-001', name: 'Test Department' },
        'user-uuid-123',
      );

      expect(result).toEqual(mockDepartment);
    });

    it('should throw ConflictException when department code exists', async () => {
      deptRepository.findOne.mockResolvedValue(mockDepartment);

      await expect(
        service.createDepartment(
          'org-uuid-123',
          { code: 'dept-001', name: 'Test' },
          'user-uuid-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create child department with correct path', async () => {
      const parentDept = { ...mockDepartment, id: 'parent-id', path: '/' };
      deptRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(parentDept);
      deptRepository.create.mockReturnValue({
        ...mockDepartment,
        parentId: 'parent-id',
        path: '/parent-id/',
      });
      deptRepository.save.mockResolvedValue({
        ...mockDepartment,
        parentId: 'parent-id',
        path: '/parent-id/',
      });

      const result = await service.createDepartment(
        'org-uuid-123',
        { code: 'child-dept', name: 'Child', parentId: 'parent-id' },
        'user-uuid-123',
      );

      expect(deptRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateDepartment', () => {
    it('should update department with valid version', async () => {
      deptRepository.findOne
        .mockResolvedValueOnce(mockDepartment)
        .mockResolvedValueOnce({ ...mockDepartment, name: 'Updated' });
      deptRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateDepartment(
        'dept-uuid-123',
        'org-uuid-123',
        { name: 'Updated' },
        1,
      );

      expect(deptRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when department not found', async () => {
      deptRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateDepartment('non-existent', 'org-uuid-123', {}, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on version mismatch', async () => {
      deptRepository.findOne.mockResolvedValue({ ...mockDepartment, version: 2 });

      await expect(
        service.updateDepartment('dept-uuid-123', 'org-uuid-123', {}, 1),
      ).rejects.toThrow(ConflictException);
    });
  });
});
