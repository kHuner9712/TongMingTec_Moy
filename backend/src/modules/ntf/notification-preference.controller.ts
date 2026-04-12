import { Body, Controller, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { NtfService } from './ntf.service';

@Controller('notification-preferences')
export class NotificationPreferenceController {
  constructor(private readonly ntfService: NtfService) {}

  @Put()
  @Permissions('PERM-NTF-READ')
  async updatePreferences(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: UpdateNotificationPreferenceDto,
  ) {
    await this.ntfService.updateNotificationPreferences(orgId, userId, body);
    return { code: 'OK', message: 'success' };
  }
}
