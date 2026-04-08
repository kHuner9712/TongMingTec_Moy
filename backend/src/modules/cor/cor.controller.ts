import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { TimelineService } from './services/timeline.service';
import { Customer360Service } from './services/customer-360.service';
import { OperatingRecordService } from './services/operating-record.service';
import { SnapshotService } from './services/snapshot.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateOperatingRecordDto } from './dto/create-operating-record.dto';
import { TimelineQueryDto } from './dto/timeline-query.dto';

@Controller('cor')
export class CorController {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly customer360Service: Customer360Service,
    private readonly operatingRecordService: OperatingRecordService,
    private readonly snapshotService: SnapshotService,
  ) {}

  @Get('customers/:id/360')
  @Permissions('PERM-CM-VIEW')
  async getCustomer360(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.customer360Service.getCustomer360(id, orgId);
  }

  @Get('customers/:id/timeline')
  @Permissions('PERM-CM-VIEW')
  async getTimeline(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Query() query: TimelineQueryDto,
  ) {
    return this.timelineService.getTimeline(id, orgId, query);
  }

  @Get('customers/:id/records')
  @Permissions('PERM-CM-VIEW')
  async getRecords(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.operatingRecordService.getRecords(id, orgId, page, pageSize);
  }

  @Post('customers/:id/records')
  @Permissions('PERM-CM-UPDATE')
  async createRecord(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOperatingRecordDto,
  ) {
    return this.operatingRecordService.createRecord(id, orgId, dto, userId);
  }

  @Get('customers/:id/snapshots')
  @Permissions('PERM-CM-VIEW')
  async getSnapshots(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.snapshotService.getSnapshots(id, orgId, page, pageSize);
  }
}
