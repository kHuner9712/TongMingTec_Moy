import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DashService } from './dash.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('dashboard')
export class DashController {
  constructor(private readonly dashService: DashService) {}

  @Get('summary')
  @Permissions('PERM-DASH-VIEW')
  async getSummary(@CurrentUser('orgId') orgId: string) {
    return this.dashService.getDashboardSummary(orgId);
  }

  @Get('sales')
  @Permissions('PERM-DASH-VIEW')
  async getSalesDashboard(
    @CurrentUser('orgId') orgId: string,
    @Query('months') months: number,
  ) {
    return this.dashService.getSalesDashboard(orgId, months || 6);
  }

  @Get('service')
  @Permissions('PERM-DASH-VIEW')
  async getServiceDashboard(@CurrentUser('orgId') orgId: string) {
    return this.dashService.getServiceDashboard(orgId);
  }

  @Get('executive')
  @Permissions('PERM-DASH-VIEW')
  async getExecutiveDashboard(@CurrentUser('orgId') orgId: string) {
    return this.dashService.getExecutiveDashboard(orgId);
  }

  @Get('metrics')
  @Permissions('PERM-DASH-VIEW')
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
