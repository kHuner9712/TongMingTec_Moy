import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AiPromptTemplate } from "../entities/ai-prompt-template.entity";
import { CreatePromptTemplateDto } from "../dto/prompt-template.dto";

@Injectable()
export class PromptTemplateService {
  constructor(
    @InjectRepository(AiPromptTemplate)
    private readonly templateRepo: Repository<AiPromptTemplate>,
  ) {}

  async create(
    orgId: string,
    dto: CreatePromptTemplateDto,
  ): Promise<AiPromptTemplate> {
    const template = this.templateRepo.create({
      orgId,
      templateCode: dto.templateCode,
      agentCode: dto.agentCode,
      templateVersion: dto.templateVersion,
      systemPrompt: dto.systemPrompt,
      userPromptPattern: dto.userPromptPattern,
      inputSchema: dto.inputSchema || null,
      outputSchema: dto.outputSchema || null,
      safetyRules: dto.safetyRules || null,
    });
    return this.templateRepo.save(template);
  }

  async update(
    id: string,
    orgId: string,
    data: Partial<AiPromptTemplate>,
  ): Promise<AiPromptTemplate> {
    const template = await this.getTemplate(id, orgId);
    Object.assign(template, data);
    return this.templateRepo.save(template);
  }

  async getTemplate(id: string, orgId: string): Promise<AiPromptTemplate> {
    const template = await this.templateRepo.findOne({ where: { id, orgId } });
    if (!template) throw new NotFoundException("RESOURCE_NOT_FOUND");
    return template;
  }

  async getTemplateByCode(
    templateCode: string,
    agentCode: string,
    orgId: string,
  ): Promise<AiPromptTemplate | null> {
    return this.templateRepo.findOne({
      where: { templateCode, agentCode, orgId, enabled: true },
      order: { templateVersion: "DESC" },
    });
  }

  async listTemplates(
    orgId: string,
    filters?: { agentCode?: string },
  ): Promise<AiPromptTemplate[]> {
    const qb = this.templateRepo
      .createQueryBuilder("tpl")
      .where("tpl.orgId = :orgId", { orgId });
    if (filters?.agentCode)
      qb.andWhere("tpl.agentCode = :agentCode", {
        agentCode: filters.agentCode,
      });
    qb.orderBy("tpl.agentCode", "ASC").addOrderBy(
      "tpl.templateVersion",
      "DESC",
    );
    return qb.getMany();
  }
}
