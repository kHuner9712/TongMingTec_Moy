import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @IsObject()
  channels: Record<string, boolean>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  muteCategories?: string[];

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  digestTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}
