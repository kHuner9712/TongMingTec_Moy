import { ForbiddenException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { Organization, OnboardStage, OrganizationStatus } from '../org/entities/organization.entity';
import { Permission } from '../usr/entities/permission.entity';
import { Role, DataScope } from '../usr/entities/role.entity';
import { RolePermission } from '../usr/entities/role-permission.entity';
import { User, UserStatus } from '../usr/entities/user.entity';
import { UserRole, UserRoleSource } from '../usr/entities/user-role.entity';
import { permissionSeeds } from '../usr/seeds/permission.seed';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_PRIMARY_TENANT_CODE = 'e2e-primary';
const DEFAULT_PRIMARY_TENANT_NAME = 'E2E Primary Tenant';
const DEFAULT_PRIMARY_USERNAME = 'admin';
const DEFAULT_PRIMARY_PASSWORD = 'Admin123!';
const DEFAULT_SECONDARY_TENANT_CODE = 'e2e-tenant-b';
const DEFAULT_SECONDARY_TENANT_NAME = 'E2E Secondary Tenant';
const DEFAULT_SECONDARY_USERNAME = 'tenantb_admin';
const DEFAULT_SECONDARY_PASSWORD = 'TenantB123!';

export interface EnsureSecondaryTenantInput {
  tenantCode?: string;
  tenantName?: string;
  username?: string;
  password?: string;
  displayName?: string;
  email?: string;
}

interface EnsureTenantResolvedInput {
  tenantCode: string;
  tenantName: string;
  username: string;
  password: string;
  displayName: string;
  email: string;
}

@Injectable()
export class AuthTestSupportService implements OnModuleInit {
  private readonly logger = new Logger(AuthTestSupportService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.isTestSupportEnabled()) return;

    await this.ensurePrimaryTenant();
  }

  async ensureSecondaryTenant(input: EnsureSecondaryTenantInput) {
    this.assertTestSupportEnabled();
    return this.ensureTenant(
      this.resolveInput(input, {
        tenantCode: DEFAULT_SECONDARY_TENANT_CODE,
        tenantName: DEFAULT_SECONDARY_TENANT_NAME,
        username: DEFAULT_SECONDARY_USERNAME,
        password: DEFAULT_SECONDARY_PASSWORD,
        displayName: 'Tenant B Admin',
      }),
    );
  }

  private async ensurePrimaryTenant() {
    const result = await this.ensureTenant(
      this.resolveInput(
        {
          tenantCode: DEFAULT_PRIMARY_TENANT_CODE,
          tenantName: DEFAULT_PRIMARY_TENANT_NAME,
          username: DEFAULT_PRIMARY_USERNAME,
          password: DEFAULT_PRIMARY_PASSWORD,
          displayName: 'Primary Admin',
        },
        {
          tenantCode: DEFAULT_PRIMARY_TENANT_CODE,
          tenantName: DEFAULT_PRIMARY_TENANT_NAME,
          username: DEFAULT_PRIMARY_USERNAME,
          password: DEFAULT_PRIMARY_PASSWORD,
          displayName: 'Primary Admin',
        },
      ),
    );

    this.logger.log(`Ensured primary test tenant ${result.orgId} (${result.username})`);
    return result;
  }

  private resolveInput(
    input: EnsureSecondaryTenantInput | undefined,
    defaults: {
      tenantCode: string;
      tenantName: string;
      username: string;
      password: string;
      displayName: string;
    },
  ): EnsureTenantResolvedInput {
    const resolvedUsername = (input?.username || defaults.username).trim();

    return {
      tenantCode: (input?.tenantCode || defaults.tenantCode).trim(),
      tenantName: (input?.tenantName || defaults.tenantName).trim(),
      username: resolvedUsername,
      password: input?.password || defaults.password,
      displayName: (input?.displayName || defaults.displayName).trim(),
      email: (input?.email || `${resolvedUsername}@example.com`).trim().toLowerCase(),
    };
  }

  private async ensureTenant(input: EnsureTenantResolvedInput) {
    let organization = await this.orgRepository.findOne({
      where: { code: input.tenantCode },
    });

    if (!organization) {
      const orgId = randomUUID();
      const orgToCreate = this.orgRepository.create({
        id: orgId,
        orgId,
        code: input.tenantCode,
        name: input.tenantName,
        status: OrganizationStatus.ACTIVE,
        onboardStage: OnboardStage.BOOTSTRAP_COMPLETED,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });
      try {
        organization = await this.orgRepository.save(orgToCreate);
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }

        const existing = await this.orgRepository.findOne({
          where: { code: input.tenantCode },
        });

        if (!existing) throw error;
        organization = existing;
      }
    } else if (organization.status !== OrganizationStatus.ACTIVE) {
      await this.orgRepository.update(organization.id, {
        status: OrganizationStatus.ACTIVE,
        updatedBy: SYSTEM_USER_ID,
      });
      organization = (await this.orgRepository.findOne({
        where: { id: organization.id },
      })) as Organization;
    }

    if (organization.orgId !== organization.id) {
      await this.orgRepository.update(organization.id, {
        orgId: organization.id,
        updatedBy: SYSTEM_USER_ID,
      });
      organization = (await this.orgRepository.findOne({
        where: { id: organization.id },
      })) as Organization;
    }

    const permIds = permissionSeeds.map((seed) => seed.permId);
    const existingPerms = await this.permissionRepository.find({
      where: { orgId: organization.id, permId: In(permIds) },
    });
    const existingPermSet = new Set(existingPerms.map((item) => item.permId));

    const missingPerms = permissionSeeds
      .filter((seed) => !existingPermSet.has(seed.permId))
      .map((seed) =>
        this.permissionRepository.create({
          ...seed,
          orgId: organization.id,
          createdBy: SYSTEM_USER_ID,
        }),
      );
    if (missingPerms.length > 0) {
      try {
        await this.permissionRepository.save(missingPerms);
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
      }
    }

    const allTenantPerms = await this.permissionRepository.find({
      where: { orgId: organization.id, permId: In(permIds) },
    });

    let adminRole = await this.roleRepository.findOne({
      where: { orgId: organization.id, code: 'admin' },
    });
    if (!adminRole) {
      const roleToCreate = this.roleRepository.create({
        orgId: organization.id,
        code: 'admin',
        name: 'Tenant Admin',
        dataScope: DataScope.ORG,
        isDefault: false,
        description: 'E2E generated admin role',
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });
      try {
        adminRole = await this.roleRepository.save(roleToCreate);
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }

        const existing = await this.roleRepository.findOne({
          where: { orgId: organization.id, code: 'admin' },
        });

        if (!existing) throw error;
        adminRole = existing;
      }
    }

    const existingRolePerms = await this.rolePermissionRepository.find({
      where: { orgId: organization.id, roleId: adminRole.id },
    });
    const existingRolePermSet = new Set(existingRolePerms.map((item) => item.permissionId));
    const missingRolePerms = allTenantPerms
      .filter((perm) => !existingRolePermSet.has(perm.id))
      .map((perm) =>
        this.rolePermissionRepository.create({
          orgId: organization.id,
          roleId: adminRole!.id,
          permissionId: perm.id,
          scopeOverride: null,
          grantedBy: SYSTEM_USER_ID,
          createdBy: SYSTEM_USER_ID,
        }),
      );
    if (missingRolePerms.length > 0) {
      try {
        await this.rolePermissionRepository.save(missingRolePerms);
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
      }
    }

    let user = await this.userRepository.findOne({
      where: { orgId: organization.id, username: input.username },
    });

    const passwordHash = await bcrypt.hash(input.password, 10);
    if (!user) {
      const userToCreate = this.userRepository.create({
        orgId: organization.id,
        username: input.username,
        displayName: input.displayName,
        email: input.email,
        passwordHash,
        status: UserStatus.ACTIVE,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });
      try {
        user = await this.userRepository.save(userToCreate);
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }

        const existing = await this.userRepository.findOne({
          where: { orgId: organization.id, username: input.username },
        });

        if (!existing) throw error;
        user = existing;
      }
    } else {
      await this.userRepository.update(user.id, {
        displayName: input.displayName,
        email: input.email,
        passwordHash,
        status: UserStatus.ACTIVE,
        updatedBy: SYSTEM_USER_ID,
      });
      user = (await this.userRepository.findOne({ where: { id: user.id } })) as User;
    }

    const mapping = await this.userRoleRepository.findOne({
      where: { orgId: organization.id, userId: user.id, roleId: adminRole.id },
    });
    if (!mapping) {
      try {
        await this.userRoleRepository.save(
          this.userRoleRepository.create({
            orgId: organization.id,
            userId: user.id,
            roleId: adminRole.id,
            source: UserRoleSource.BOOTSTRAP,
            createdBy: SYSTEM_USER_ID,
          }),
        );
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
      }
    }

    const token = this.jwtService.sign({
      sub: user.id,
      orgId: user.orgId,
      username: user.username,
    });

    return {
      orgId: organization.id,
      userId: user.id,
      username: user.username,
      password: input.password,
      token,
    };
  }

  private isTestSupportEnabled(): boolean {
    const enabledByFlag = process.env.ENABLE_TEST_SUPPORT_APIS === 'true';
    const nonProdRuntime = process.env.NODE_ENV !== 'production';
    return enabledByFlag || nonProdRuntime;
  }

  private assertTestSupportEnabled(): void {
    if (!this.isTestSupportEnabled()) {
      throw new ForbiddenException('FEATURE_DISABLED');
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    const err = error as { code?: string; driverError?: { code?: string } };
    return err?.code === '23505' || err?.driverError?.code === '23505';
  }
}
