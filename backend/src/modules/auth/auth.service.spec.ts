import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserStatus } from '../usr/entities/user.entity';
import { UserRole } from '../usr/entities/user-role.entity';
import { RolePermission } from '../usr/entities/role-permission.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<any>;
  let userRoleRepository: jest.Mocked<any>;
  let rolePermissionRepository: jest.Mocked<any>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-uuid-123',
    orgId: 'org-uuid-123',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    mobile: '13800138000',
    status: UserStatus.ACTIVE,
    passwordHash: 'hashed-password',
    departmentId: null,
    version: 1,
  };

  const mockUserRole = {
    userId: 'user-uuid-123',
    roleId: 'role-uuid-123',
    role: {
      id: 'role-uuid-123',
      code: 'admin',
      dataScope: 'org',
    },
  };

  const mockRolePermission = {
    roleId: 'role-uuid-123',
    permissionId: 'perm-uuid-123',
    permission: {
      permId: 'PERM-CM-VIEW',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              innerJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, any> = {
                'jwt.secret': 'test-secret',
                'jwt.refreshTokenExpiresIn': '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
    rolePermissionRepository = module.get(getRepositoryToken(RolePermission));
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    it('should return tokens and user info on successful login', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      userRoleRepository.find.mockResolvedValue([mockUserRole]);
      rolePermissionRepository.createQueryBuilder().getMany.mockResolvedValue([mockRolePermission]);

      const result = await service.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.user.username).toBe('testuser');
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
      expect(result.user.roles).toContain('admin');
      expect(result.user.permissions).toContain('PERM-CM-VIEW');
    });

    it('should throw UnauthorizedException for invalid username', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ username: 'nonexistent', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login({ username: 'testuser', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for disabled user', async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        status: UserStatus.DISABLED,
      });

      await expect(
        service.login({ username: 'testuser', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new tokens on valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-uuid-123', orgId: 'org-uuid-123' });
      userRepository.findOne.mockResolvedValue(mockUser);
      userRoleRepository.find.mockResolvedValue([mockUserRole]);
      rolePermissionRepository.createQueryBuilder().getMany.mockResolvedValue([mockRolePermission]);

      const result = await service.refresh({ refreshToken: 'valid-refresh-token' });

      expect(result.tokens.accessToken).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.refresh({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should update password on valid old password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      userRepository.update.mockResolvedValue({ affected: 1 });

      await service.changePassword('user-uuid-123', {
        oldPassword: 'oldpass',
        newPassword: 'newpass123',
      });

      expect(userRepository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid old password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.changePassword('user-uuid-123', {
          oldPassword: 'wrongpass',
          newPassword: 'newpass123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
