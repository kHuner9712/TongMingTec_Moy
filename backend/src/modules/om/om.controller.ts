import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { OmService } from './om.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/pagination.dto';
import { OpportunityStage, OpportunityResult } from './entities/opportunity.entity';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';

class CreateOpportunityDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsString()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;
}

class UpdateOpportunityDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsInt()
  @Min(1)
  version: number;
}

class StageActionDto {
  @IsEnum(['discovery', 'qualification', 'proposal', 'negotiation'])
  toStage: OpportunityStage;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsInt()
  @Min(1)
  version: number;
}

class ResultActionDto {
  @IsEnum(['won', 'lost'])
  result: OpportunityResult;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsInt()
  @Min(1)
  version: number;
}

@Controller('opportunities')
export class OmController {
  constructor(private readonly omService: OmService) {}

  @Get()
  @Permissions('PERM-OM-VIEW')
  async listOpportunities(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('dataScope') dataScope: string,
    @Query() query: PageQueryDto,
    @Query('stage') stage?: string,
    @Query('result') result?: string,
  ) {
    const { items, total } = await this.omService.findOpportunities(
      orgId,
      userId,
      dataScope,
      { stage, result },
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

  @Get('summary')
  @Permissions('PERM-OM-VIEW')
  async getSummary(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('dataScope') dataScope: string,
  ) {
    return this.omService.getSummary(orgId, userId, dataScope);
  }

  @Get(':id')
  @Permissions('PERM-OM-VIEW')
  async getOpportunity(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    const opportunity = await this.omService.findOpportunityById(id, orgId);
    const stageHistory = await this.omService.findStageHistory(id, orgId);
    return { ...opportunity, stageHistory };
  }

  @Post()
  @Permissions('PERM-OM-CREATE')
  async createOpportunity(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOpportunityDto,
  ) {
    const data = {
      ...dto,
      expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
    };
    return this.omService.createOpportunity(orgId, data, userId);
  }

  @Put(':id')
  @Permissions('PERM-OM-UPDATE')
  async updateOpportunity(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.expectedCloseDate) {
      data.expectedCloseDate = new Date(dto.expectedCloseDate);
    }
    return this.omService.updateOpportunity(id, orgId, data, dto.version);
  }

  @Post(':id/stage')
  @Permissions('PERM-OM-STAGE')
  async changeStage(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: StageActionDto,
  ) {
    return this.omService.changeStage(
      id,
      orgId,
      dto.toStage,
      dto.reason || '',
      userId,
      dto.version,
    );
  }

  @Post(':id/result')
  @Permissions('PERM-OM-RESULT')
  async markResult(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ResultActionDto,
  ) {
    return this.omService.markResult(
      id,
      orgId,
      dto.result,
      dto.reason || '',
      userId,
      dto.version,
    );
  }
}
