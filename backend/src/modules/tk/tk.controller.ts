import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TkService } from './tk.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/pagination.dto';
import { TicketPriority } from './entities/ticket.entity';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';

class CreateTicketDto {
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: TicketPriority;
}

class AssignDto {
  @IsUUID()
  assigneeUserId: string;

  @IsInt()
  @Min(1)
  version: number;
}

class StartDto {
  @IsInt()
  @Min(1)
  version: number;
}

class ResolveDto {
  @IsString()
  solution: string;

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

@Controller('tickets')
export class TkController {
  constructor(private readonly tkService: TkService) {}

  @Get()
  @Permissions('PERM-TK-VIEW')
  async listTickets(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('dataScope') dataScope: string,
    @Query() query: PageQueryDto,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    const { items, total } = await this.tkService.findTickets(
      orgId,
      userId,
      dataScope,
      { status, priority },
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
  @Permissions('PERM-TK-VIEW')
  async getTicket(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    const ticket = await this.tkService.findTicketById(id, orgId);
    const logs = await this.tkService.findLogs(id, orgId);
    return { ...ticket, logs };
  }

  @Post()
  @Permissions('PERM-TK-CREATE')
  async createTicket(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.tkService.createTicket(orgId, dto, userId);
  }

  @Post(':id/assign')
  @Permissions('PERM-TK-ASSIGN')
  async assignTicket(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AssignDto,
  ) {
    return this.tkService.assign(id, orgId, dto.assigneeUserId, userId, dto.version);
  }

  @Post(':id/start')
  @Permissions('PERM-TK-START')
  async startTicket(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: StartDto,
  ) {
    return this.tkService.start(id, orgId, userId, dto.version);
  }

  @Post(':id/resolve')
  @Permissions('PERM-TK-RESOLVE')
  async resolveTicket(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ResolveDto,
  ) {
    return this.tkService.resolve(id, orgId, dto.solution, userId, dto.version);
  }

  @Post(':id/close')
  @Permissions('PERM-TK-CLOSE')
  async closeTicket(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CloseDto,
  ) {
    return this.tkService.close(
      id,
      orgId,
      dto.closeReason || '',
      userId,
      dto.version,
    );
  }
}
