import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { CsmService } from './csm.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  EvaluateHealthDto,
  CreateSuccessPlanDto,
  UpdateSuccessPlanDto,
  CreateReturnVisitDto,
  HealthListQueryDto,
  SuccessPlanListQueryDto,
} from './dto/csm.dto';
import { PageQueryDto } from '../../common/dto/pagination.dto';

@Controller('csm')
export class CsmController {
  constructor(private readonly csmService: CsmService) {}

  @Get('health')
  @Permissions('PERM-CSM-VIEW')
  async listHealthScores(
    @CurrentUser('orgId') orgId: string,
    @Query() query: HealthListQueryDto,
  ) {
    const { items, total } = await this.csmService.findHealthScores(
      orgId,
      { level: query.level, customerId: query.customerId },
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

  @Get('health/:customerId')
  @Permissions('PERM-CSM-VIEW')
  async getHealthScore(
    @Param('customerId') customerId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.csmService.findHealthScoreByCustomer(customerId, orgId);
  }

  @Post('health/evaluate')
  @Permissions('PERM-CSM-MANAGE')
  async evaluateHealth(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: EvaluateHealthDto,
  ) {
    return this.csmService.evaluateHealth(dto.customerId, orgId, userId);
  }

  @Get('plans')
  @Permissions('PERM-CSM-MANAGE')
  async listSuccessPlans(
    @CurrentUser('orgId') orgId: string,
    @Query() query: SuccessPlanListQueryDto,
  ) {
    const { items, total } = await this.csmService.findSuccessPlans(
      orgId,
      { status: query.status, customerId: query.customerId },
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

  @Get('plans/:id')
  @Permissions('PERM-CSM-MANAGE')
  async getSuccessPlan(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.csmService.findSuccessPlanById(id, orgId);
  }

  @Post('plans')
  @Permissions('PERM-CSM-MANAGE')
  async createSuccessPlan(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSuccessPlanDto,
  ) {
    return this.csmService.createSuccessPlan(orgId, dto, userId);
  }

  @Put('plans/:id')
  @Permissions('PERM-CSM-MANAGE')
  async updateSuccessPlan(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSuccessPlanDto,
  ) {
    return this.csmService.updateSuccessPlan(id, orgId, dto, userId);
  }

  @Post('visits')
  @Permissions('PERM-CSM-MANAGE')
  async createReturnVisit(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReturnVisitDto,
  ) {
    return this.csmService.createReturnVisit(orgId, dto, userId);
  }

  @Get('visits/:customerId')
  @Permissions('PERM-CSM-VIEW')
  async listReturnVisits(
    @Param('customerId') customerId: string,
    @CurrentUser('orgId') orgId: string,
    @Query() query: PageQueryDto,
  ) {
    const { items, total } = await this.csmService.findReturnVisits(
      orgId,
      customerId,
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
}
