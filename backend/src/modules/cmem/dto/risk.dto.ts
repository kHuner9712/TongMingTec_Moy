import { IsOptional, IsJSON } from 'class-validator';

export class AssessRiskDto {
  @IsOptional()
  factors?: Record<string, unknown>;
}
