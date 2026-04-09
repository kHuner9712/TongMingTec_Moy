import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { permissionSeeds } from './permission.seed';

@Injectable()
export class PermissionSeedRunner implements OnModuleInit {
  private readonly logger = new Logger(PermissionSeedRunner.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
  ) {}

  async onModuleInit() {
    await this.seedPermissions();
  }

  private async seedPermissions() {
    let created = 0;
    for (const seed of permissionSeeds) {
      const existing = await this.permRepo.findOne({
        where: { permId: seed.permId },
      });
      if (!existing) {
        const perm = this.permRepo.create({
          ...seed,
          orgId: 'system',
        });
        await this.permRepo.save(perm);
        created++;
        this.logger.log(`种子数据：Permission ${seed.permId} 已创建`);
      }
    }
    if (created > 0) {
      this.logger.log(`权限种子数据初始化完成，新增 ${created} 条`);
    }
  }
}
