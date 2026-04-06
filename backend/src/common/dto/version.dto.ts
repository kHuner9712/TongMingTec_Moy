import { IsInt, Min } from 'class-validator';

export class VersionBodyDto {
  @IsInt()
  @Min(1)
  version: number;
}
