import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { permissionSeeds } from './permission.seed';

const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class PermissionSeedRunner implements OnModuleInit {
  private readonly logger = new Logger(PermissionSeedRunner.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.ENABLE_GLOBAL_PERMISSION_SEED === 'true') {
      await this.seedGlobalPermissions();
    }
  }

  private async seedGlobalPermissions(): Promise<void> {
    let created = 0;
    for (const seed of permissionSeeds) {
      const existing = await this.permRepo.findOne({
        where: { permId: seed.permId, orgId: SYSTEM_ORG_ID },
      });
      if (existing) continue;

      const perm = this.permRepo.create({
        ...seed,
        orgId: SYSTEM_ORG_ID,
      });
      await this.permRepo.save(perm);
      created += 1;
      this.logger.log(`Seeded global permission ${seed.permId}`);
    }

    if (created > 0) {
      this.logger.log(`Global permission seed completed, created ${created}`);
    }
  }

  async seedForOrg(orgId: string): Promise<number> {
    let created = 0;
    for (const seed of permissionSeeds) {
      const existing = await this.permRepo.findOne({
        where: { permId: seed.permId, orgId },
      });
      if (existing) continue;

      const perm = this.permRepo.create({
        ...seed,
        orgId,
      });
      await this.permRepo.save(perm);
      created += 1;
    }

    if (created > 0) {
      this.logger.log(`Tenant ${orgId} permission seed completed, created ${created}`);
    }

    return created;
  }
}
