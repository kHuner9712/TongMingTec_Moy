import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page_size?: number = 20;

  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';
}

export class ListMetaDto {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  sort_by?: string;
  sort_order?: string;
  has_next: boolean;
}

export class PaginatedResponse<T> {
  items: T[];
  meta: ListMetaDto;
}
