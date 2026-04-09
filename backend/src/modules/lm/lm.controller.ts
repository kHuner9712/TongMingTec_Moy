import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { LmService } from "./lm.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PageQueryDto } from "../../common/dto/pagination.dto";
import { FollowType } from "./entities/lead-follow-up.entity";
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
} from "class-validator";

class CreateLeadDto {
  @IsString()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  mobile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  companyName?: string;

  @IsOptional()
  @IsString()
  source?: string;
}

class AssignDto {
  @IsUUID()
  ownerUserId: string;

  @IsInt()
  @Min(1)
  version: number;
}

class FollowUpDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(["call", "wechat", "email", "meeting", "manual"])
  followType?: FollowType;

  @IsOptional()
  @IsDateString()
  nextActionAt?: string;

  @IsInt()
  @Min(1)
  version: number;
}

class ConvertDto {
  @IsInt()
  @Min(1)
  version: number;
}

class ImportLeadDto {
  @IsString()
  @MaxLength(512)
  fileUrl: string;

  @IsOptional()
  mapping?: Record<string, string>;
}

@Controller("leads")
export class LmController {
  constructor(private readonly lmService: LmService) {}

  @Get()
  @Permissions("PERM-LM-CREATE")
  async listLeads(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @CurrentUser("dataScope") dataScope: string,
    @Query() query: PageQueryDto,
    @Query("status") status?: string,
    @Query("source") source?: string,
  ) {
    const { items, total } = await this.lmService.findLeads(
      orgId,
      userId,
      dataScope,
      { status, source },
      query.page || 1,
      query.page_size || 20,
    );

    return {
      items,
      meta: {
        page: query.page || 1,
        page_size: query.page_size || 20,
        total,
        total_pages: Math.ceil(total / (query.page_size || 20)),
        has_next: total > (query.page || 1) * (query.page_size || 20),
      },
    };
  }

  @Get(":id")
  @Permissions("PERM-LM-CREATE")
  async getLead(@Param("id") id: string, @CurrentUser("orgId") orgId: string) {
    const lead = await this.lmService.findLeadById(id, orgId);
    const followUps = await this.lmService.findFollowUps(id, orgId);
    return { ...lead, followUps };
  }

  @Post()
  @Permissions("PERM-LM-CREATE")
  async createLead(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.lmService.createLead(orgId, dto, userId);
  }

  @Post(":id/assign")
  @Permissions("PERM-LM-ASSIGN")
  async assignLead(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: AssignDto,
  ) {
    return this.lmService.assignLead(
      id,
      orgId,
      dto.ownerUserId,
      userId,
      dto.version,
    );
  }

  @Post(":id/follow-ups")
  @Permissions("PERM-LM-FOLLOW_UP")
  async addFollowUp(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: FollowUpDto,
  ) {
    return this.lmService.addFollowUp(
      id,
      orgId,
      dto.content,
      dto.followType || FollowType.MANUAL,
      dto.nextActionAt ? new Date(dto.nextActionAt) : null,
      userId,
      dto.version,
    );
  }

  @Post(":id/convert")
  @Permissions("PERM-LM-CONVERT")
  async convertLead(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: ConvertDto,
  ) {
    return this.lmService.convert(id, orgId, userId, dto.version);
  }

  @Post("import")
  @Permissions("PERM-LM-IMPORT")
  async importLeads(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: ImportLeadDto,
  ) {
    return this.lmService.importLeads(orgId, [], userId);
  }
}
