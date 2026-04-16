import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CtService } from './ct.service';
import { ContractExpiryScheduler } from './contract-expiry.scheduler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CreateContractDto,
  UpdateContractDto,
  SubmitApprovalDto,
  ApproveContractDto,
  SignContractDto,
  ContractListQueryDto,
} from './dto/contract.dto';

@Controller('contracts')
export class CtController {
  constructor(
    private readonly ctService: CtService,
    private readonly expiryScheduler: ContractExpiryScheduler,
  ) {}

  @Get()
  @Permissions('PERM-CT-MANAGE')
  async listContracts(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('dataScope') dataScope: string,
    @Query() query: ContractListQueryDto,
  ) {
    const { items, total } = await this.ctService.findContracts(
      orgId,
      userId,
      dataScope,
      {
        status: query.status,
        customerId: query.customerId,
        opportunityId: query.opportunityId,
        startsOnGte: query.startsOnGte,
        endsOnLte: query.endsOnLte,
      },
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

  @Get(':id')
  @Permissions('PERM-CT-MANAGE')
  async getContractDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.ctService.findContractDetail(id, orgId);
  }

  @Post()
  @Permissions('PERM-CT-MANAGE')
  async createContract(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.ctService.createContract(orgId, dto, userId);
  }

  @Post('from-quote')
  @Permissions('PERM-CT-MANAGE')
  async createFromQuote(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { quoteId: string; opportunityId: string; customerId: string },
  ) {
    return this.ctService.createContractFromQuote(
      orgId,
      body.quoteId,
      body.opportunityId,
      body.customerId,
      userId,
    );
  }

  @Put(':id')
  @Permissions('PERM-CT-MANAGE')
  async updateContract(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.ctService.updateContract(id, orgId, dto, userId);
  }

  @Post(':id/submit-approval')
  @Permissions('PERM-CT-APPROVE')
  async submitApproval(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitApprovalDto,
  ) {
    return this.ctService.submitApproval(
      id,
      orgId,
      dto.approverIds,
      dto.comment,
      dto.version,
      userId,
    );
  }

  @Post(':id/approve')
  @Permissions('PERM-CT-APPROVE')
  async approveContract(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApproveContractDto,
  ) {
    return this.ctService.approveContract(
      id,
      orgId,
      dto.action,
      dto.comment,
      userId,
    );
  }

  @Post(':id/sign')
  @Permissions('PERM-CT-SIGN')
  async signContract(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SignContractDto,
  ) {
    return this.ctService.signContract(
      id,
      orgId,
      dto.signProvider,
      dto.version,
      userId,
    );
  }

  @Post(':id/activate')
  @Permissions('PERM-CT-SIGN')
  async activateContract(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ctService.activateContract(id, orgId, userId);
  }

  @Post(':id/terminate')
  @Permissions('PERM-CT-ARCHIVE')
  async terminateContract(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.ctService.terminateContract(id, orgId, body.reason, userId);
  }

  @Delete(':id')
  @Permissions('PERM-CT-MANAGE')
  async deleteContract(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ctService.deleteContract(id, orgId, userId);
  }

  @Post('expire-check')
  @Permissions('PERM-CT-MANAGE')
  async triggerExpiryCheck(
    @CurrentUser('orgId') orgId: string,
    @Body() body: { warningDays?: number },
  ) {
    const notified = await this.expiryScheduler.checkAndNotifyExpiringContracts(
      body.warningDays || 30,
    );
    return { notified };
  }

  @Post('expire-overdue')
  @Permissions('PERM-CT-MANAGE')
  async triggerExpireOverdue(
    @CurrentUser('orgId') orgId: string,
  ) {
    const expired = await this.expiryScheduler.expireOverdueContracts();
    return { expired };
  }
}
