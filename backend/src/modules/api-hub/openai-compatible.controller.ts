import { Controller, Get, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiKeyGuard } from "./guards/api-key.guard";
import { OpenaiCompatibleService } from "./openai-compatible.service";
import { ChatCompletionRequestDto } from "./dto/openai-compatible.dto";

@Controller("v1")
@UseGuards(ApiKeyGuard)
export class OpenaiCompatibleController {
  constructor(private readonly service: OpenaiCompatibleService) {}

  @Get("models")
  async listModels(@Req() req: any) {
    return this.service.listModelsForProject(req.apiKey.projectId);
  }

  @Post("chat/completions")
  @HttpCode(HttpStatus.OK)
  async chatCompletions(@Req() req: any, @Body() dto: ChatCompletionRequestDto) {
    return this.service.createMockChatCompletion(req.apiKey, dto);
  }
}
