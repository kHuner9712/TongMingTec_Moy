import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAgent } from '../entities/ai-agent.entity';
import { AiPromptTemplate } from '../entities/ai-prompt-template.entity';
import { AiTool } from '../entities/ai-tool.entity';
import { agentSeeds } from './agent.seed';
import { promptTemplateSeeds } from './prompt-template.seed';
import { toolSeeds } from './tool.seed';

@Injectable()
export class SeedRunner implements OnModuleInit {
  private readonly logger = new Logger(SeedRunner.name);

  constructor(
    @InjectRepository(AiAgent)
    private readonly agentRepo: Repository<AiAgent>,
    @InjectRepository(AiPromptTemplate)
    private readonly templateRepo: Repository<AiPromptTemplate>,
    @InjectRepository(AiTool)
    private readonly toolRepo: Repository<AiTool>,
  ) {}

  async onModuleInit() {
    await this.seedAgents();
    await this.seedPromptTemplates();
    await this.seedTools();
  }

  private async seedAgents() {
    for (const seed of agentSeeds) {
      const existing = await this.agentRepo.findOne({
        where: { code: seed.code },
      });
      if (!existing) {
        const agent = this.agentRepo.create({ ...seed, orgId: 'system' });
        await this.agentRepo.save(agent);
        this.logger.log(`种子数据：Agent ${seed.code} 已创建`);
      }
    }
  }

  private async seedPromptTemplates() {
    for (const seed of promptTemplateSeeds) {
      const existing = await this.templateRepo.findOne({
        where: { templateCode: seed.templateCode },
      });
      if (!existing) {
        const template = this.templateRepo.create({
          ...seed,
          orgId: 'system',
        });
        await this.templateRepo.save(template);
        this.logger.log(
          `种子数据：PromptTemplate ${seed.templateCode} 已创建`,
        );
      }
    }
  }

  private async seedTools() {
    for (const seed of toolSeeds) {
      const existing = await this.toolRepo.findOne({
        where: { code: seed.code },
      });
      if (!existing) {
        const tool = this.toolRepo.create({ ...seed, orgId: 'system' });
        await this.toolRepo.save(tool);
        this.logger.log(`种子数据：Tool ${seed.code} 已创建`);
      }
    }
  }
}
