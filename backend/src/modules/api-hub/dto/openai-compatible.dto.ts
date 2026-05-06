import { IsString, IsArray, IsOptional, IsNumber, ValidateNested, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";

export class ChatMessageDto {
  @IsString()
  role!: string;

  @IsString()
  content!: string;
}

export class ChatCompletionRequestDto {
  @IsString()
  model!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  stream?: boolean;
}
