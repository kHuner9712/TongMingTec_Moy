import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DashService } from './dash.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('DASH')
@ApiBearerAuth()
@Controller('dashboard')
export class DashController {
  constructor(private readonly dashService: DashService) {}

  @Get('summary')
  @Permissions('PERM-DASH-VIEW')
  @ApiOperation({ summary: '经营总览看板' })
  async getSummary(
    @CurrentUser('orgId') orgId: string,
    @Query('range') range?: string,
  ): Promise<any> {
    return this.dashService.getDashboardSummary(orgId, range);
  }

  @Get('sales')
  @Permissions('PERM-DASH-VIEW')
  @ApiOperation({ summary: '销售看板' })
  async getSalesDashboard(
    @CurrentUser('orgId') orgId: string,
    @Query('range') range?: string,
  ): Promise<any> {
    return this.dashService.getSalesDashboard(orgId, range);
  }

  @Get('service')
  @Permissions('PERM-DASH-VIEW')
  @ApiOperation({ summary: '服务看板' })
  async getServiceDashboard(
    @CurrentUser('orgId') orgId: string,
    @Query('range') range?: string,
  ): Promise<any> {
    return this.dashService.getServiceDashboard(orgId, range);
  }

  @Get('executive')
  @Permissions('PERM-DASH-VIEW')
  @ApiOperation({ summary: '经营驾驶舱（高层视角）' })
  async getExecutiveDashboard(
    @CurrentUser('orgId') orgId: string,
    @Query('range') range?: string,
  ): Promise<any> {
    return this.dashService.getExecutiveDashboard(orgId, range);
  }

  @Get('metrics')
  @Permissions('PERM-DASH-VIEW')
  @ApiOperation({ summary: '按指标查询明细数据' })
  async getMetrics(
    @CurrentUser('orgId') orgId: string,
    @Query('metricKey') metricKey: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashService.getMetrics(
      orgId,
      metricKey,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('metrics')
  @Permissions('PERM-DASH-MANAGE')
  @ApiOperation({ summary: '写入指标快照数据' })
  async recordMetric(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { metricKey: string; metricType: string; value: number; dimensions?: Record<string, unknown> },
  ) {
    return this.dashService.recordMetric(
      orgId,
      body.metricKey,
      body.metricType,
      body.value,
      body.dimensions || {},
      userId,
    );
  }
}
