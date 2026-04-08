import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class DetectIntentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  sourceType: string;
}
