import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsrService } from './usr.service';
import { User, UserStatus } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole, UserRoleSource } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { EventBusService } from '../../common/events/event-bus.service';
import * as bcrypt from 'bcrypt';

describe('UsrService', () => {
  let service: UsrService;
  let userRepository: jest.Mocked<any>;
  let roleRepository: jest.Mocked<any>;
  let permissionRepository: jest.Mocked<any>;
  let userRoleRepository: jest.Mocked<any>;
  let rolePermissionRepository: jest.Mocked<any>;

  const mockUser = {
    id: 'user-uuid-123',
    orgId: 'org-uuid-123',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    mobile: '13800138000',
    status: UserStatus.ACTIVE,
    departmentId: null,
    version: 1,
  };

  const mockRole = {
    id: 'role-uuid-123',
    orgId: 'org-uuid-123',
    code: 'admin',
    name: 'Administrator',
    version: 1,
  };

  const mockPermission = {
    id: 'perm-uuid-123',
    orgId: 'org-uuid-123',
    module: 'CM',
    action: 'VIEW',
    permId: 'PERM-CM-VIEW',
  };

  const createMockQueryBuilder = () => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getMany: jest.fn(),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsrService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
          },
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            delete: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: {
            delete: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: EventBusService,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsrService>(UsrService);
    userRepository = module.get(getRepositoryToken(User));
    roleRepository = module.get(getRepositoryToken(Role));
    permissionRepository = module.get(getRepositoryToken(Permission));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
    rolePermissionRepository = module.get(getRepositoryToken(RolePermission));
  });

  describe('findUsers', () => {
    it('should return paginated users', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockUser], 1]);
      userRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findUsers('org-uuid-123', {}, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockUser], 1]);
      userRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findUsers('org-uuid-123', { status: 'active' }, 1, 10);

      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should filter by keyword', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockUser], 1]);
      userRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findUsers('org-uuid-123', { keyword: 'test' }, 1, 10);

      expect(mockQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('findUserById', () => {
    it('should return user when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserById('user-uuid-123', 'org-uuid-123');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findUserById('non-existent', 'org-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser(
        'org-uuid-123',
        { username: 'testuser', displayName: 'Test User' },
        'operator-uuid',
      );

      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when username exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.createUser(
          'org-uuid-123',
          { username: 'testuser' },
          'operator-uuid',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateUser', () => {
    it('should update user with valid version', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUser(
        'user-uuid-123',
        'org-uuid-123',
        { displayName: 'Updated' },
        1,
      );

      expect(userRepository.update).toHaveBeenCalled();
    });

    it('should throw ConflictException on version mismatch', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, version: 2 });

      await expect(
        service.updateUser('user-uuid-123', 'org-uuid-123', {}, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changeUserStatus', () => {
    it('should change user status', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 });

      await service.changeUserStatus(
        'user-uuid-123',
        'org-uuid-123',
        UserStatus.DISABLED,
        'operator-uuid-123',
        1,
      );

      expect(userRepository.update).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password and activate user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 });

      await service.resetPassword('user-uuid-123', 'org-uuid-123', 'newpassword');

      expect(userRepository.update).toHaveBeenCalled();
    });
  });

  describe('findRoles', () => {
    it('should return roles for organization', async () => {
      roleRepository.find.mockResolvedValue([mockRole]);

      const result = await service.findRoles('org-uuid-123');

      expect(result).toHaveLength(1);
    });
  });

  describe('findPermissions', () => {
    it('should return permissions for organization', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getMany.mockResolvedValue([mockPermission]);
      permissionRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findPermissions('org-uuid-123');

      expect(mockQb.getMany).toHaveBeenCalled();
    });

    it('should filter by module', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getMany.mockResolvedValue([mockPermission]);
      permissionRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findPermissions('org-uuid-123', 'CM');

      expect(mockQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRoleRepository.delete.mockResolvedValue({ affected: 1 });
      userRoleRepository.create.mockReturnValue({});
      userRoleRepository.save.mockResolvedValue({});

      await service.assignRoles(
        'user-uuid-123',
        'org-uuid-123',
        ['role-uuid-123'],
        'operator-uuid',
      );

      expect(userRoleRepository.delete).toHaveBeenCalled();
      expect(userRoleRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateRolePermissions', () => {
    it('should update role permissions', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      rolePermissionRepository.delete.mockResolvedValue({ affected: 1 });
      rolePermissionRepository.create.mockReturnValue({});
      rolePermissionRepository.save.mockResolvedValue({});
      roleRepository.update.mockResolvedValue({ affected: 1 });
      roleRepository.findOne.mockResolvedValue(mockRole);

      await service.updateRolePermissions(
        'role-uuid-123',
        'org-uuid-123',
        ['perm-uuid-123'],
        'operator-uuid',
        1,
      );

      expect(rolePermissionRepository.delete).toHaveBeenCalled();
      expect(rolePermissionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateRolePermissions(
          'non-existent',
          'org-uuid-123',
          [],
          'operator-uuid',
          1,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on version mismatch', async () => {
      roleRepository.findOne.mockResolvedValue({ ...mockRole, version: 2 });

      await expect(
        service.updateRolePermissions(
          'role-uuid-123',
          'org-uuid-123',
          [],
          'operator-uuid',
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
