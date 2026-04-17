import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAgent } from '../entities/ai-agent.entity';
import { AiPromptTemplate } from '../entities/ai-prompt-template.entity';
import { AiTool } from '../entities/ai-tool.entity';
import { agentSeeds } from './agent.seed';
import { promptTemplateSeeds } from './prompt-template.seed';
import { toolSeeds } from './tool.seed';

const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000000';

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

  async onModuleInit(): Promise<void> {
    await this.seedAgents();
    await this.seedPromptTemplates();
    await this.seedTools();
  }

  private async seedAgents(): Promise<void> {
    for (const seed of agentSeeds) {
      const existing = await this.agentRepo.findOne({ where: { code: seed.code } });
      if (existing) continue;

      const agent = this.agentRepo.create({
        ...seed,
        orgId: SYSTEM_ORG_ID,
      });
      await this.agentRepo.save(agent);
      this.logger.log(`Seeded agent ${seed.code}`);
    }
  }

  private async seedPromptTemplates(): Promise<void> {
    for (const seed of promptTemplateSeeds) {
      const existing = await this.templateRepo.findOne({
        where: { templateCode: seed.templateCode },
      });
      if (existing) continue;

      const template = this.templateRepo.create({
        ...seed,
        orgId: SYSTEM_ORG_ID,
      });
      await this.templateRepo.save(template);
      this.logger.log(`Seeded prompt template ${seed.templateCode}`);
    }
  }

  private async seedTools(): Promise<void> {
    for (const seed of toolSeeds) {
      const existing = await this.toolRepo.findOne({ where: { code: seed.code } });
      if (existing) continue;

      const tool = this.toolRepo.create({
        ...seed,
        orgId: SYSTEM_ORG_ID,
      });
      await this.toolRepo.save(tool);
      this.logger.log(`Seeded tool ${seed.code}`);
    }
  }
}
