import { IsString, IsOptional, IsUUID, IsInt, Min, IsArray, IsIn, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(64)
  code: string;

  @IsString()
  @MaxLength(64)
  name: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateItemDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  contentMd: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['manual', 'import', 'ai'])
  sourceType?: string;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  contentMd?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'review', 'published', 'archived'])
  status?: string;

  @IsInt()
  version: number;
}

export class ReviewItemDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  decision: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsInt()
  version: number;
}

export class ItemListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page_size?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'review', 'published', 'archived'])
  status?: string;
}

export class SearchQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page_size?: number;
}
