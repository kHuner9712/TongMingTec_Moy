import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole, UserRoleSource } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { userStateMachine } from '../../common/statemachine/definitions/user.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { userStatusChanged } from '../../common/events/user-events';

@Injectable()
export class UsrService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    private readonly eventBus: EventBusService,
  ) {}

  async findUsers(
    orgId: string,
    filters: { status?: string; departmentId?: string; keyword?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: User[]; total: number }> {
    const qb = this.userRepository.createQueryBuilder('user').where('user.orgId = :orgId', { orgId });

    if (filters.status) {
      qb.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters.departmentId) {
      qb.andWhere('user.departmentId = :departmentId', {
        departmentId: filters.departmentId,
      });
    }

    if (filters.keyword) {
      qb.andWhere(
        '(user.username LIKE :keyword OR user.displayName LIKE :keyword OR user.email LIKE :keyword)',
        { keyword: `%${filters.keyword}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findUserById(id: string, orgId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, orgId },
    });

    if (!user) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    return user;
  }

  async createUser(
    orgId: string,
    data: Partial<User>,
    _userId: string,
  ): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { orgId, username: data.username },
    });

    if (existing) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const tempPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = this.userRepository.create({
      ...data,
      orgId,
      passwordHash,
      status: UserStatus.INVITED,
    });

    return this.userRepository.save(user);
  }

  async updateUser(
    id: string,
    orgId: string,
    data: Partial<User>,
    version: number,
  ): Promise<User> {
    const user = await this.findUserById(id, orgId);

    if (user.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    await this.userRepository.update(id, {
      ...data,
      version: () => 'version + 1',
    });

    return this.findUserById(id, orgId);
  }

  async changeUserStatus(
    id: string,
    orgId: string,
    status: UserStatus,
    userId: string,
    version: number,
  ): Promise<User> {
    const user = await this.findUserById(id, orgId);

    if (user.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = user.status;
    userStateMachine.validateTransition(user.status, status);

    await this.userRepository.update(id, {
      status,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      userStatusChanged({
        orgId,
        userId: id,
        fromStatus,
        toStatus: status,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findUserById(id, orgId);
  }

  async resetPassword(
    id: string,
    orgId: string,
    tempPassword: string,
  ): Promise<void> {
    await this.findUserById(id, orgId);

    const passwordHash = await bcrypt.hash(tempPassword, 10);
    await this.userRepository.update(id, {
      passwordHash,
      status: UserStatus.ACTIVE,
    });
  }

  async findRoles(orgId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: { orgId },
      order: { code: 'ASC' },
    });
  }

  async findPermissions(orgId: string, module?: string): Promise<Permission[]> {
    const qb = this.permissionRepository.createQueryBuilder('perm').where('perm.orgId = :orgId', { orgId });

    if (module) {
      qb.andWhere('perm.module = :module', { module });
    }

    return qb.orderBy('perm.module', 'ASC').addOrderBy('perm.action', 'ASC').getMany();
  }

  async assignRoles(
    userId: string,
    orgId: string,
    roleIds: string[],
    operatorId: string,
  ): Promise<void> {
    const user = await this.findUserById(userId, orgId);

    await this.userRoleRepository.delete({ userId: user.id });

    const userRoles = roleIds.map((roleId) =>
      this.userRoleRepository.create({
        userId: user.id,
        roleId,
        orgId,
        source: UserRoleSource.MANUAL,
        createdBy: operatorId,
      }),
    );

    await this.userRoleRepository.save(userRoles);
  }

  async updateRolePermissions(
    roleId: string,
    orgId: string,
    permissionIds: string[],
    operatorId: string,
    version: number,
  ): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, orgId },
    });

    if (!role) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    if (role.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    await this.rolePermissionRepository.delete({ roleId });

    const rolePermissions = permissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({
        roleId,
        permissionId,
        orgId,
        grantedBy: operatorId,
        createdBy: operatorId,
      }),
    );

    await this.rolePermissionRepository.save(rolePermissions);
    await this.roleRepository.update(roleId, { version: () => 'version + 1' });

    return this.roleRepository.findOne({ where: { id: roleId, orgId } }) as Promise<Role>;
  }
}
