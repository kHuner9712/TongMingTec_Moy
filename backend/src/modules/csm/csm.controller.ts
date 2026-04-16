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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('CSM')
@ApiBearerAuth()
@Controller('csm')
export class CsmController {
  constructor(private readonly csmService: CsmService) {}

  @Get('health')
  @Permissions('PERM-CSM-VIEW')
  @ApiOperation({ summary: '分页查询客户健康度' })
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
  @ApiOperation({ summary: '按客户获取健康度详情' })
  async getHealthScore(
    @Param('customerId') customerId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.csmService.findHealthScoreByCustomer(customerId, orgId);
  }

  @Post('health/evaluate')
  @Permissions('PERM-CSM-MANAGE')
  @ApiOperation({ summary: '触发客户健康度评估' })
  async evaluateHealth(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: EvaluateHealthDto,
  ) {
    return this.csmService.evaluateHealth(dto.customerId, orgId, userId);
  }

  @Get('plans')
  @Permissions('PERM-CSM-MANAGE')
  @ApiOperation({ summary: '分页查询成功计划' })
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
  @ApiOperation({ summary: '获取成功计划详情' })
  async getSuccessPlan(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.csmService.findSuccessPlanById(id, orgId);
  }

  @Post('plans')
  @Permissions('PERM-CSM-MANAGE')
  @ApiOperation({ summary: '创建成功计划' })
  async createSuccessPlan(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSuccessPlanDto,
  ) {
    return this.csmService.createSuccessPlan(orgId, dto, userId);
  }

  @Put('plans/:id')
  @Permissions('PERM-CSM-MANAGE')
  @ApiOperation({ summary: '更新成功计划（含状态流转）' })
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
  @ApiOperation({ summary: '创建客户回访记录' })
  async createReturnVisit(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReturnVisitDto,
  ) {
    return this.csmService.createReturnVisit(orgId, dto, userId);
  }

  @Get('visits/:customerId')
  @Permissions('PERM-CSM-VIEW')
  @ApiOperation({ summary: '按客户分页查询回访记录' })
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
