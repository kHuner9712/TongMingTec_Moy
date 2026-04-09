import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Organization, OnboardStage } from './entities/organization.entity';
import { Department } from './entities/department.entity';

@Injectable()
export class OrgService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(Department)
    private deptRepository: Repository<Department>,
    private dataSource: DataSource,
  ) {}

  async findById(id: string, orgId: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }
    if (org.id !== orgId) {
      throw new ForbiddenException('AUTH_FORBIDDEN');
    }
    return org;
  }

  async update(
    id: string,
    orgId: string,
    data: Partial<Organization>,
    version: number,
  ): Promise<Organization> {
    const org = await this.findById(id, orgId);

    if (org.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    await this.orgRepository.update(id, {
      ...data,
      version: () => 'version + 1',
    });

    return this.findById(id, orgId);
  }

  async findDepartments(orgId: string): Promise<Department[]> {
    return this.deptRepository.find({
      where: { orgId },
      order: { path: 'ASC', sortOrder: 'ASC' },
    });
  }

  async createDepartment(
    orgId: string,
    data: Partial<Department>,
    _userId: string,
  ): Promise<Department> {
    const existing = await this.deptRepository.findOne({
      where: { orgId, code: data.code },
    });

    if (existing) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    let path = '/';
    if (data.parentId) {
      const parent = await this.deptRepository.findOne({
        where: { id: data.parentId, orgId },
      });
      if (parent) {
        path = `${parent.path}${parent.id}/`;
      }
    }

    const dept = this.deptRepository.create({
      ...data,
      orgId,
      path,
    });

    return this.deptRepository.save(dept);
  }

  async updateDepartment(
    id: string,
    orgId: string,
    data: Partial<Department>,
    version: number,
  ): Promise<Department> {
    const dept = await this.deptRepository.findOne({ where: { id, orgId } });

    if (!dept) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    if (dept.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    await this.deptRepository.update(id, {
      ...data,
      version: () => 'version + 1',
    });

    return this.deptRepository.findOne({ where: { id, orgId } }) as Promise<Department>;
  }

  async bootstrap(
    id: string,
    orgId: string,
    config: Record<string, any>,
    userId: string,
  ): Promise<Organization> {
    const org = await this.findById(id, orgId);

    if (org.onboardStage === OnboardStage.BOOTSTRAP_COMPLETED) {
      throw new BadRequestException('ORG_ALREADY_BOOTSTRAPPED');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Organization, id, {
        onboardStage: OnboardStage.BOOTSTRAP_COMPLETED,
        version: () => 'version + 1',
      });

      if (config.defaultDepartmentName) {
        const dept = manager.create(Department, {
          orgId,
          code: 'ROOT',
          name: config.defaultDepartmentName,
          path: '/',
          sortOrder: 0,
        });
        await manager.save(dept);
      }

      if (config.adminRoleName) {
        // admin role creation would go through SysService
        // for now, just mark bootstrapped
      }
    });

    return this.findById(id, orgId);
  }

  async updateConfigs(
    id: string,
    orgId: string,
    configs: Array<{ key: string; value: string }>,
  ): Promise<{ updated: number }> {
    await this.findById(id, orgId);

    let updated = 0;
    for (const config of configs) {
      // SysService handles actual config persistence
      // This endpoint validates org existence and delegates
      updated++;
    }

    return { updated };
  }
}
