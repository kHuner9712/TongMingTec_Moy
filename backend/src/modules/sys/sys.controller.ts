import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
} from '@nestjs/common';
import { SysService } from './sys.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { IsString, IsObject, IsArray, ValidateNested, IsOptional } from 'class-validator';

class SetConfigDto {
  @IsString()
  key: string;

  @IsObject()
  value: Record<string, unknown>;
}

class BulkSetConfigsDto {
  @IsArray()
  configs: { key: string; value: Record<string, unknown> }[];
}

@Controller('system')
export class SysController {
  constructor(private readonly sysService: SysService) {}

  @Get('summary')
  @Permissions('PERM-SYS-MANAGE')
  async getSummary(@CurrentUser('orgId') orgId: string) {
    return this.sysService.getSystemSummary(orgId);
  }

  @Get('configs')
  @Permissions('PERM-SYS-MANAGE')
  async listConfigs(@CurrentUser('orgId') orgId: string) {
    return this.sysService.getConfigs(orgId);
  }

  @Get('configs/:key')
  @Permissions('PERM-SYS-MANAGE')
  async getConfig(
    @CurrentUser('orgId') orgId: string,
    @Param('key') key: string,
  ) {
    return this.sysService.getConfig(orgId, key);
  }

  @Post('configs')
  @Permissions('PERM-SYS-MANAGE')
  async setConfig(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: SetConfigDto,
  ) {
    return this.sysService.setConfig(orgId, dto.key, dto.value);
  }

  @Post('configs/bulk')
  @Permissions('PERM-SYS-MANAGE')
  async bulkSetConfigs(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: BulkSetConfigsDto,
  ) {
    await this.sysService.bulkSetConfigs(orgId, dto.configs);
    return { code: 'OK', message: 'success' };
  }
}
