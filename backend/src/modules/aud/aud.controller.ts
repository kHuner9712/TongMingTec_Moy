import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { AudService } from './aud.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString, IsDateString } from 'class-validator';

class AuditLogQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  resourceType?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@Controller('audit-logs')
export class AudController {
  constructor(private readonly audService: AudService) {}

  @Get()
  @Permissions('PERM-AUD-VIEW')
  async listLogs(
    @CurrentUser('orgId') orgId: string,
    @Query() query: AuditLogQueryDto,
  ) {
    const { items, total } = await this.audService.findLogs(
      orgId,
      {
        userId: query.userId,
        action: query.action,
        resourceType: query.resourceType,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
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
}
