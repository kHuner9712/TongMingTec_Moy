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
import { QtService } from './qt.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  SubmitApprovalDto,
  ApproveQuoteDto,
  SendQuoteDto,
  QuoteListQueryDto,
} from './dto/quote.dto';

@Controller('quotes')
export class QtController {
  constructor(private readonly qtService: QtService) {}

  @Get()
  @Permissions('PERM-QT-MANAGE')
  async listQuotes(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('dataScope') dataScope: string,
    @Query() query: QuoteListQueryDto,
  ) {
    const { items, total } = await this.qtService.findQuotes(
      orgId,
      userId,
      dataScope,
      {
        status: query.status,
        customerId: query.customerId,
        opportunityId: query.opportunityId,
        validUntilLte: query.validUntilLte,
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
  @Permissions('PERM-QT-MANAGE')
  async getQuoteDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.qtService.findQuoteDetail(id, orgId);
  }

  @Post()
  @Permissions('PERM-QT-MANAGE')
  async createQuote(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.qtService.createQuote(orgId, dto, userId);
  }

  @Put(':id')
  @Permissions('PERM-QT-MANAGE')
  async updateQuote(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.qtService.updateQuote(id, orgId, dto, userId);
  }

  @Post(':id/submit-approval')
  @Permissions('PERM-QT-APPROVE')
  async submitApproval(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitApprovalDto,
  ) {
    return this.qtService.submitApproval(
      id,
      orgId,
      dto.approverIds,
      dto.comment,
      dto.version,
      userId,
    );
  }

  @Post(':id/approve')
  @Permissions('PERM-QT-APPROVE')
  async approveQuote(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApproveQuoteDto,
  ) {
    return this.qtService.approveQuote(
      id,
      orgId,
      dto.action,
      dto.comment,
      userId,
    );
  }

  @Post(':id/send')
  @Permissions('PERM-QT-SEND')
  async sendQuote(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendQuoteDto,
  ) {
    return this.qtService.sendQuote(
      id,
      orgId,
      dto.channel,
      dto.receiver,
      dto.message,
      dto.version,
      userId,
    );
  }

  @Delete(':id')
  @Permissions('PERM-QT-MANAGE')
  async deleteQuote(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.qtService.deleteQuote(id, orgId, userId);
  }
}
