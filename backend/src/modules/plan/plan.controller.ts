import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PlanService } from './plan.service';
import {
  AddOnListQueryDto,
  AddOnStatusChangeDto,
  CreateAddOnDto,
  CreatePlanDto,
  CreateQuotaPolicyDto,
  DeleteWithVersionQueryDto,
  PlanListQueryDto,
  PlanStatusChangeDto,
  QuotaPolicyListQueryDto,
  QuotaPolicyStatusChangeDto,
  UpdateAddOnDto,
  UpdatePlanDto,
  UpdateQuotaPolicyDto,
} from './dto/plan.dto';

@ApiTags('PLAN')
@ApiBearerAuth()
@Controller()
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get('plans')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '分页查询套餐' })
  async listPlans(
    @CurrentUser('orgId') orgId: string,
    @Query() query: PlanListQueryDto,
  ) {
    const { items, total } = await this.planService.findPlans(orgId, query);
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

  @Get('plans/active')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '查询可用套餐（active）' })
  async listActivePlans(@CurrentUser('orgId') orgId: string) {
    return this.planService.findActivePlans(orgId);
  }

  @Get('plans/:id')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '获取套餐详情（含增购与额度策略）' })
  async getPlanDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.planService.findPlanDetail(id, orgId);
  }

  @Post('plans')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '创建套餐' })
  async createPlan(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePlanDto,
  ) {
    return this.planService.createPlan(orgId, dto, userId);
  }

  @Put('plans/:id')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '更新套餐' })
  async updatePlan(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.planService.updatePlan(id, orgId, dto, userId);
  }

  @Post('plans/:id/status')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '变更套餐状态（启停/归档）' })
  async changePlanStatus(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: PlanStatusChangeDto,
  ) {
    return this.planService.changePlanStatus(id, orgId, dto, userId);
  }

  @Delete('plans/:id')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '删除套餐（软删除）' })
  async deletePlan(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query() query: DeleteWithVersionQueryDto,
  ) {
    return this.planService.deletePlan(id, orgId, userId, query.version);
  }

  @Get('add-ons')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '分页查询增购项' })
  async listAddOns(
    @CurrentUser('orgId') orgId: string,
    @Query() query: AddOnListQueryDto,
  ) {
    const { items, total } = await this.planService.findAddOns(orgId, query);
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

  @Get('add-ons/:id')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '获取增购项详情' })
  async getAddOnDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.planService.findAddOnById(id, orgId);
  }

  @Post('add-ons')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '创建增购项' })
  async createAddOn(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAddOnDto,
  ) {
    return this.planService.createAddOn(orgId, dto, userId);
  }

  @Put('add-ons/:id')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '更新增购项' })
  async updateAddOn(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAddOnDto,
  ) {
    return this.planService.updateAddOn(id, orgId, dto, userId);
  }

  @Post('add-ons/:id/status')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '变更增购项状态' })
  async changeAddOnStatus(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddOnStatusChangeDto,
  ) {
    return this.planService.changeAddOnStatus(id, orgId, dto, userId);
  }

  @Delete('add-ons/:id')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '删除增购项（软删除）' })
  async deleteAddOn(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query() query: DeleteWithVersionQueryDto,
  ) {
    return this.planService.deleteAddOn(id, orgId, userId, query.version);
  }

  @Get('quota-policies')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '分页查询额度策略' })
  async listQuotaPolicies(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QuotaPolicyListQueryDto,
  ) {
    const { items, total } = await this.planService.findQuotaPolicies(orgId, query);
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

  @Get('quota-policies/:id')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '获取额度策略详情' })
  async getQuotaPolicyDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.planService.findQuotaPolicyById(id, orgId);
  }

  @Post('quota-policies')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '创建额度策略' })
  async createQuotaPolicy(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateQuotaPolicyDto,
  ) {
    return this.planService.createQuotaPolicy(orgId, dto, userId);
  }

  @Put('quota-policies/:id')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '更新额度策略' })
  async updateQuotaPolicy(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateQuotaPolicyDto,
  ) {
    return this.planService.updateQuotaPolicy(id, orgId, dto, userId);
  }

  @Post('quota-policies/:id/status')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '变更额度策略状态' })
  async changeQuotaPolicyStatus(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: QuotaPolicyStatusChangeDto,
  ) {
    return this.planService.changeQuotaPolicyStatus(id, orgId, dto, userId);
  }

  @Delete('quota-policies/:id')
  @Permissions('PERM-PLAN-MANAGE')
  @ApiOperation({ summary: '删除额度策略（软删除）' })
  async deleteQuotaPolicy(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query() query: DeleteWithVersionQueryDto,
  ) {
    return this.planService.deleteQuotaPolicy(id, orgId, userId, query.version);
  }
}
