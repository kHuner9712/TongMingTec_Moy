import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Organization, OnboardStage, OrganizationStatus } from '../org/entities/organization.entity';
import { Permission } from '../usr/entities/permission.entity';
import { Role, DataScope } from '../usr/entities/role.entity';
import { RolePermission } from '../usr/entities/role-permission.entity';
import { User, UserStatus } from '../usr/entities/user.entity';
import { UserRole, UserRoleSource } from '../usr/entities/user-role.entity';
import { permissionSeeds } from '../usr/seeds/permission.seed';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
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

@Injectable()
export class AuthTestSupportService {
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

  async ensureSecondaryTenant(input: EnsureSecondaryTenantInput) {
    this.assertTestSupportEnabled();

    const tenantCode = (input.tenantCode || DEFAULT_SECONDARY_TENANT_CODE).trim();
    const tenantName = (input.tenantName || DEFAULT_SECONDARY_TENANT_NAME).trim();
    const username = (input.username || DEFAULT_SECONDARY_USERNAME).trim();
    const password = input.password || DEFAULT_SECONDARY_PASSWORD;
    const displayName = (input.displayName || 'Tenant B Admin').trim();
    const email = (input.email || `${username}@example.com`).trim().toLowerCase();

    let organization = await this.orgRepository.findOne({
      where: { code: tenantCode },
    });

    if (!organization) {
      organization = this.orgRepository.create({
        code: tenantCode,
        name: tenantName,
        status: OrganizationStatus.ACTIVE,
        onboardStage: OnboardStage.BOOTSTRAP_COMPLETED,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });
      organization = await this.orgRepository.save(organization);
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
      await this.permissionRepository.save(missingPerms);
    }

    const allTenantPerms = await this.permissionRepository.find({
      where: { orgId: organization.id, permId: In(permIds) },
    });

    let adminRole = await this.roleRepository.findOne({
      where: { orgId: organization.id, code: 'admin' },
    });
    if (!adminRole) {
      adminRole = this.roleRepository.create({
        orgId: organization.id,
        code: 'admin',
        name: 'Tenant Admin',
        dataScope: DataScope.ORG,
        isDefault: false,
        description: 'E2E generated admin role',
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });
      adminRole = await this.roleRepository.save(adminRole);
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
      await this.rolePermissionRepository.save(missingRolePerms);
    }

    let user = await this.userRepository.findOne({
      where: { orgId: organization.id, username },
    });

    const passwordHash = await bcrypt.hash(password, 10);
    if (!user) {
      user = this.userRepository.create({
        orgId: organization.id,
        username,
        displayName,
        email,
        passwordHash,
        status: UserStatus.ACTIVE,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });
      user = await this.userRepository.save(user);
    } else {
      await this.userRepository.update(user.id, {
        displayName,
        email,
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
      await this.userRoleRepository.save(
        this.userRoleRepository.create({
          orgId: organization.id,
          userId: user.id,
          roleId: adminRole.id,
          source: UserRoleSource.BOOTSTRAP,
          createdBy: SYSTEM_USER_ID,
        }),
      );
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
      password,
      token,
    };
  }

  private assertTestSupportEnabled(): void {
    const enabledByFlag = process.env.ENABLE_TEST_SUPPORT_APIS === 'true';
    const nonProdRuntime = process.env.NODE_ENV !== 'production';
    if (!enabledByFlag && !nonProdRuntime) {
      throw new ForbiddenException('FEATURE_DISABLED');
    }
  }
}
