import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CnvService } from './cnv.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/pagination.dto';
import { MessageType } from './entities/conversation-message.entity';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsArray,
} from 'class-validator';

class SendMessageDto {
  @IsEnum(['text', 'image', 'file', 'audio', 'video', 'card'])
  messageType: MessageType;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsArray()
  attachments?: Record<string, unknown>[];

  @IsInt()
  @Min(1)
  version: number;
}

class AcceptDto {
  @IsUUID()
  assigneeUserId: string;

  @IsInt()
  @Min(1)
  version: number;
}

class TransferDto {
  @IsUUID()
  targetUserId: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsInt()
  @Min(1)
  version: number;
}

class CloseDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  closeReason?: string;

  @IsInt()
  @Min(1)
  version: number;
}

class RatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  @IsInt()
  @Min(1)
  version: number;
}

@Controller('conversations')
export class CnvController {
  constructor(private readonly cnvService: CnvService) {}

  @Get()
  @Permissions('PERM-CNV-VIEW')
  async listConversations(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('dataScope') dataScope: string,
    @Query() query: PageQueryDto,
    @Query('status') status?: string,
    @Query('channelId') channelId?: string,
  ) {
    const { items, total } = await this.cnvService.findConversations(
      orgId,
      userId,
      dataScope,
      { status, channelId },
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
  @Permissions('PERM-CNV-VIEW')
  async getConversation(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.cnvService.findConversationById(id, orgId);
  }

  @Get(':id/messages')
  @Permissions('PERM-CNV-VIEW')
  async getMessages(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Query() query: PageQueryDto,
  ) {
    const { items, total } = await this.cnvService.findMessages(
      id,
      orgId,
      query.page || 1,
      query.page_size || 50,
    );

    return {
      items,
      meta: {
        page: query.page || 1,
        page_size: query.page_size || 50,
        total,
        total_pages: Math.ceil(total / (query.page_size || 50)),
        has_next: total > (query.page || 1) * (query.page_size || 50),
      },
    };
  }

  @Post(':id/messages')
  @Permissions('PERM-CNV-SEND')
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.cnvService.sendMessage(
      id,
      orgId,
      dto.messageType,
      dto.content,
      dto.attachments || [],
      userId,
      dto.version,
    );
  }

  @Post(':id/accept')
  @Permissions('PERM-CNV-ACCEPT')
  async acceptConversation(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AcceptDto,
  ) {
    return this.cnvService.accept(
      id,
      orgId,
      dto.assigneeUserId,
      userId,
      dto.version,
    );
  }

  @Post(':id/transfer')
  @Permissions('PERM-CNV-TRANSFER')
  async transferConversation(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TransferDto,
  ) {
    return this.cnvService.transfer(
      id,
      orgId,
      dto.targetUserId,
      dto.reason || '',
      userId,
      dto.version,
    );
  }

  @Post(':id/close')
  @Permissions('PERM-CNV-CLOSE')
  async closeConversation(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CloseDto,
  ) {
    return this.cnvService.close(
      id,
      orgId,
      dto.closeReason || '',
      userId,
      dto.version,
    );
  }

  @Post(':id/rating')
  @Permissions('PERM-CNV-RATE')
  async rateConversation(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: RatingDto,
  ) {
    return this.cnvService.rate(id, orgId, dto.score, dto.comment || '');
  }

  @Post(':id/tickets')
  @Permissions('PERM-CNV-CREATE_TICKET')
  async createTicket(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.cnvService.createTicket(
      id,
      orgId,
      dto.title,
      (dto.priority as any) || 'normal',
      userId,
      dto.version,
    );
  }
}
