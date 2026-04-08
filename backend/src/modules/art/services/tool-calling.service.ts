import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiTool } from '../entities/ai-tool.entity';
import { RegisterToolDto } from '../dto/tool.dto';

@Injectable()
export class ToolCallingService {
  constructor(
    @InjectRepository(AiTool)
    private readonly toolRepo: Repository<AiTool>,
  ) {}

  async registerTool(orgId: string, dto: RegisterToolDto): Promise<AiTool> {
    const existing = await this.toolRepo.findOne({ where: { code: dto.code, orgId } });
    if (existing) throw new ConflictException('TOOL_CODE_ALREADY_EXISTS');

    const tool = this.toolRepo.create({
      orgId,
      code: dto.code,
      name: dto.name,
      toolType: dto.toolType as any,
      config: dto.config,
      riskLevel: dto.riskLevel,
    });
    return this.toolRepo.save(tool);
  }

  async callTool(toolCode: string, input: Record<string, unknown>, orgId: string): Promise<Record<string, unknown>> {
    const tool = await this.toolRepo.findOne({ where: { code: toolCode, orgId, enabled: true } });
    if (!tool) throw new NotFoundException('TOOL_NOT_FOUND');

    return {
      toolCode,
      toolType: tool.toolType,
      result: `Mock result for ${tool.name}`,
      input,
      executedAt: new Date().toISOString(),
    };
  }

  async validatePermission(toolCode: string, agentCode: string, orgId: string): Promise<boolean> {
    const tool = await this.toolRepo.findOne({ where: { code: toolCode, orgId, enabled: true } });
    if (!tool) return false;
    return true;
  }

  async listTools(orgId: string): Promise<AiTool[]> {
    return this.toolRepo.find({ where: { orgId }, order: { createdAt: 'DESC' } });
  }
}
