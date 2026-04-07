import {
  Controller,
  Get,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { NtfService } from './ntf.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/pagination.dto';

@Controller('notifications')
export class NtfController {
  constructor(private readonly ntfService: NtfService) {}

  @Get()
  @Permissions('PERM-NTF-VIEW')
  async listNotifications(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query() query: PageQueryDto,
    @Query('isRead') isRead?: string,
    @Query('notificationType') notificationType?: string,
  ) {
    const { items, total } = await this.ntfService.findNotifications(
      orgId,
      userId,
      {
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        notificationType,
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

  @Get('unread-count')
  @Permissions('PERM-NTF-VIEW')
  async getUnreadCount(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    const count = await this.ntfService.getUnreadCount(orgId, userId);
    return { count };
  }

  @Post(':id/read')
  @Permissions('PERM-NTF-READ')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ntfService.markAsRead(id, orgId, userId);
  }

  @Post('read-all')
  @Permissions('PERM-NTF-READ')
  async markAllAsRead(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.ntfService.markAllAsRead(orgId, userId);
    return { code: 'OK', message: 'success' };
  }
}
