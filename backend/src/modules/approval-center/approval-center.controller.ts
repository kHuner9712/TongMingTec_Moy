import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApprovalCenterService } from './services/approval-center.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApprovalQueryDto, ApprovalRejectDto } from './dto/approval-query.dto';

@Controller('approval-center')
export class ApprovalCenterController {
  constructor(private readonly approvalCenterService: ApprovalCenterService) {}

  @Get('pending')
  async listPending(@CurrentUser('orgId') orgId: string) {
    const data = await this.approvalCenterService.listPending(orgId);
    return { code: 'OK', data };
  }

  @Get('stats')
  async getStats(@CurrentUser('orgId') orgId: string) {
    const data = await this.approvalCenterService.getApprovalStats(orgId);
    return { code: 'OK', data };
  }

  @Get('count')
  async getPendingCount(@CurrentUser('orgId') orgId: string) {
    const count = await this.approvalCenterService.getPendingCount(orgId);
    return { code: 'OK', data: { count } };
  }

  @Get()
  async listAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: ApprovalQueryDto,
  ) {
    const data = await this.approvalCenterService.listAll(orgId, {
      status: query.status,
    });
    return { code: 'OK', data };
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.approvalCenterService.approve(id, orgId, userId);
    return { code: 'OK', data };
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApprovalRejectDto,
  ) {
    const data = await this.approvalCenterService.reject(id, orgId, userId, dto.reason);
    return { code: 'OK', data };
  }
}
