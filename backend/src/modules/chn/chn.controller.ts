import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ChnService } from './chn.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ChannelType, ChannelStatus } from './entities/channel.entity';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
  IsObject,
} from 'class-validator';

class CreateChannelDto {
  @IsString()
  @MaxLength(64)
  code: string;

  @IsEnum(['wechat', 'wechat_mini', 'wechat_work', 'web', 'app', 'phone', 'email'])
  channelType: ChannelType;

  @IsObject()
  configJson: Record<string, unknown>;
}

class UpdateChannelDto {
  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(['inactive', 'active', 'error'])
  status?: ChannelStatus;

  @IsInt()
  @Min(1)
  version: number;
}

@Controller('channels')
export class ChnController {
  constructor(private readonly chnService: ChnService) {}

  @Get()
  @Permissions('PERM-CHN-VIEW')
  async listChannels(
    @CurrentUser('orgId') orgId: string,
    @Query('channelType') channelType?: string,
    @Query('status') status?: string,
  ) {
    return this.chnService.findChannels(orgId, { channelType, status });
  }

  @Get(':id')
  @Permissions('PERM-CHN-VIEW')
  async getChannel(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.chnService.findChannelById(id, orgId);
  }

  @Post()
  @Permissions('PERM-CHN-MANAGE')
  async createChannel(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateChannelDto,
  ) {
    return this.chnService.createChannel(orgId, dto);
  }

  @Put(':id')
  @Permissions('PERM-CHN-MANAGE')
  async updateChannel(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.chnService.updateChannel(id, orgId, dto, dto.version);
  }
}
