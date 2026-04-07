import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TskService } from './tsk.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/pagination.dto';
import { TaskStatus, TaskSourceType } from './entities/task.entity';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
} from 'class-validator';

class CreateTaskDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  @IsOptional()
  @IsEnum(['manual', 'lead', 'opportunity', 'conversation', 'ticket'])
  sourceType?: TaskSourceType;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsInt()
  @Min(1)
  version: number;
}

class StatusActionDto {
  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
  status: TaskStatus;

  @IsInt()
  @Min(1)
  version: number;
}

class RemindDto {
  @IsString()
  message: string;
}

@Controller('tasks')
export class TskController {
  constructor(private readonly tskService: TskService) {}

  @Get()
  @Permissions('PERM-TSK-CREATE')
  async listTasks(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('dataScope') dataScope: string,
    @Query() query: PageQueryDto,
    @Query('status') status?: string,
    @Query('assignee') assignee?: string,
    @Query('sourceType') sourceType?: string,
  ) {
    const { items, total } = await this.tskService.findTasks(
      orgId,
      userId,
      dataScope,
      { status, assignee, sourceType },
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
  @Permissions('PERM-TSK-CREATE')
  async getTask(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.tskService.findTaskById(id, orgId);
  }

  @Post()
  @Permissions('PERM-TSK-CREATE')
  async createTask(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaskDto,
  ) {
    const data = {
      ...dto,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
    };
    return this.tskService.createTask(orgId, data, userId);
  }

  @Put(':id')
  @Permissions('PERM-TSK-UPDATE')
  async updateTask(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.dueAt) {
      data.dueAt = new Date(dto.dueAt);
    }
    return this.tskService.updateTask(id, orgId, data, dto.version);
  }

  @Post(':id/status')
  @Permissions('PERM-TSK-STATUS')
  async changeStatus(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: StatusActionDto,
  ) {
    return this.tskService.changeStatus(id, orgId, dto.status, userId, dto.version);
  }

  @Post(':id/remind')
  @Permissions('PERM-TSK-UPDATE')
  async remind(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: RemindDto,
  ) {
    await this.tskService.remind(id, orgId, dto.message);
    return { code: 'OK', message: 'success' };
  }
}
