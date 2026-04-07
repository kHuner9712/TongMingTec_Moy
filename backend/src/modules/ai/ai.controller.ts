import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  IsString,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

class SmartReplyDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('smart-reply')
  @Permissions('PERM-AI-EXECUTE')
  async createSmartReply(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SmartReplyDto,
  ) {
    const task = await this.aiService.createSmartReplyTask(
      orgId,
      dto.conversationId,
      dto.prompt,
      userId,
    );

    return {
      taskId: task.id,
      status: task.status,
    };
  }

  @Get('tasks/:id')
  @Permissions('PERM-AI-EXECUTE')
  async getTask(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.aiService.getTaskResult(id, orgId);
  }
}
