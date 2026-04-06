import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { OrgService } from './org.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { IsString, IsOptional, IsUUID, IsNotEmpty, MaxLength, IsInt, Min } from 'class-validator';

class UpdateOrgDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;

  @IsInt()
  @Min(1)
  version: number;
}

class CreateDeptDto {
  @IsString()
  @MaxLength(64)
  code: string;

  @IsString()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

class UpdateDeptDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsUUID()
  managerUserId?: string;

  @IsInt()
  @Min(1)
  version: number;
}

@Controller('organizations')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get(':id')
  @Permissions('PERM-ORG-MANAGE')
  async getOrganization(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.orgService.findById(id, orgId);
  }

  @Put(':id')
  @Permissions('PERM-ORG-MANAGE')
  async updateOrganization(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateOrgDto,
  ) {
    return this.orgService.update(id, orgId, dto, dto.version);
  }
}

@Controller('departments')
export class DeptController {
  constructor(private readonly orgService: OrgService) {}

  @Get()
  @Permissions('PERM-ORG-MANAGE')
  async listDepartments(@CurrentUser('orgId') orgId: string) {
    return this.orgService.findDepartments(orgId);
  }

  @Post()
  @Permissions('PERM-ORG-MANAGE')
  async createDepartment(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDeptDto,
  ) {
    return this.orgService.createDepartment(orgId, dto, userId);
  }

  @Put(':id')
  @Permissions('PERM-ORG-MANAGE')
  async updateDepartment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateDeptDto,
  ) {
    return this.orgService.updateDepartment(id, orgId, dto, dto.version);
  }
}
