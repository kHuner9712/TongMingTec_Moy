import {
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AudService } from './aud.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

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

class ExportQueryDto {
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

  @IsOptional()
  @IsEnum(['csv', 'json'])
  format?: 'csv' | 'json';
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

  @Get('export')
  @Permissions('PERM-AUD-EXPORT')
  async exportLogs(
    @CurrentUser('orgId') orgId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.audService.exportLogs(
      orgId,
      {
        userId: query.userId,
        action: query.action,
        resourceType: query.resourceType,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      },
      query.format || 'csv',
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }
}
