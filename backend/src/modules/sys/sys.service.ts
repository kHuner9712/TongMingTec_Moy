import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgConfig } from './entities/org-config.entity';

@Injectable()
export class SysService {
  constructor(
    @InjectRepository(OrgConfig)
    private configRepository: Repository<OrgConfig>,
  ) {}

  async getConfigs(orgId: string): Promise<OrgConfig[]> {
    return this.configRepository.find({
      where: { orgId },
    });
  }

  async getConfig(orgId: string, key: string): Promise<OrgConfig | null> {
    return this.configRepository.findOne({
      where: { orgId, configKey: key },
    });
  }

  async setConfig(
    orgId: string,
    key: string,
    value: Record<string, unknown>,
  ): Promise<OrgConfig> {
    let config = await this.getConfig(orgId, key);

    if (config) {
      await this.configRepository
        .createQueryBuilder()
        .update(OrgConfig)
        .set({ configValue: JSON.parse(JSON.stringify(value)) })
        .where('id = :id', { id: config.id })
        .execute();
      return this.getConfig(orgId, key) as Promise<OrgConfig>;
    }

    config = this.configRepository.create({
      orgId,
      configKey: key,
      configValue: JSON.parse(JSON.stringify(value)),
    });

    return this.configRepository.save(config);
  }

  async bulkSetConfigs(
    orgId: string,
    configs: { key: string; value: Record<string, unknown> }[],
  ): Promise<void> {
    for (const { key, value } of configs) {
      await this.setConfig(orgId, key, value);
    }
  }

  async getSystemSummary(orgId: string): Promise<Record<string, unknown>> {
    return {
      orgId,
      timestamp: new Date().toISOString(),
      modules: {
        auth: { enabled: true },
        org: { enabled: true },
        usr: { enabled: true },
        cm: { enabled: true },
        lm: { enabled: true },
        om: { enabled: true },
        cnv: { enabled: true },
        tk: { enabled: true },
        tsk: { enabled: true },
        ntf: { enabled: true },
        chn: { enabled: true },
        ai: { enabled: true },
        aud: { enabled: true },
      },
    };
  }
}
