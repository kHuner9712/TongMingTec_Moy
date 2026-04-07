import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UsrService } from './usr.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/pagination.dto';
import { UserStatus } from './entities/user.entity';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsInt,
  Min,
  IsEmail,
  IsArray,
  IsEnum,
} from 'class-validator';

class CreateUserDto {
  @IsString()
  @MaxLength(64)
  username: string;

  @IsString()
  @MaxLength(64)
  displayName: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(128)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  mobile?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsInt()
  @Min(1)
  version: number;
}

class StatusActionDto {
  @IsEnum(['invited', 'active', 'disabled', 'locked'])
  status: UserStatus;

  @IsInt()
  @Min(1)
  version: number;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  tempPassword: string;
}

class AssignRolesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}

class UpdateRolePermissionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];

  @IsInt()
  @Min(1)
  version: number;
}

@Controller('users')
export class UsrController {
  constructor(private readonly usrService: UsrService) {}

  @Get()
  @Permissions('PERM-USR-MANAGE')
  async listUsers(
    @CurrentUser('orgId') orgId: string,
    @Query() query: PageQueryDto,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('keyword') keyword?: string,
  ) {
    const { items, total } = await this.usrService.findUsers(
      orgId,
      { status, departmentId, keyword },
      query.page || 1,
      query.page_size || 20,
    );

    return {
      items,
      meta: {
        page: query.page || 1,
        page_size: query.page_size || 20,
        total,
        total_pages: Math.ceil(total / (query.page_size || 20)),
        has_next: total > (query.page || 1) * (query.page_size || 20),
      },
    };
  }

  @Get(':id')
  @Permissions('PERM-USR-MANAGE')
  async getUser(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.usrService.findUserById(id, orgId);
  }

  @Post()
  @Permissions('PERM-USR-MANAGE')
  async createUser(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usrService.createUser(orgId, dto, userId);
  }

  @Put(':id')
  @Permissions('PERM-USR-MANAGE')
  async updateUser(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usrService.updateUser(id, orgId, dto, dto.version);
  }

  @Post(':id/status')
  @Permissions('PERM-USR-MANAGE')
  async changeStatus(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: StatusActionDto,
  ) {
    return this.usrService.changeUserStatus(id, orgId, dto.status, dto.version);
  }

  @Post(':id/reset-password')
  @Permissions('PERM-USR-MANAGE')
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: ResetPasswordDto,
  ) {
    await this.usrService.resetPassword(id, orgId, dto.tempPassword);
    return { code: 'OK', message: 'success' };
  }

  @Post(':id/roles')
  @Permissions('PERM-USR-MANAGE')
  async assignRoles(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AssignRolesDto,
  ) {
    await this.usrService.assignRoles(id, orgId, dto.roleIds, userId);
    return { code: 'OK', message: 'success' };
  }
}

@Controller('roles')
export class RoleController {
  constructor(private readonly usrService: UsrService) {}

  @Get()
  @Permissions('PERM-USR-MANAGE')
  async listRoles(@CurrentUser('orgId') orgId: string) {
    return this.usrService.findRoles(orgId);
  }

  @Put(':id/permissions')
  @Permissions('PERM-USR-MANAGE')
  async updatePermissions(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.usrService.updateRolePermissions(
      id,
      orgId,
      dto.permissionIds,
      userId,
      dto.version,
    );
  }
}

@Controller('permissions')
export class PermissionController {
  constructor(private readonly usrService: UsrService) {}

  @Get()
  @Permissions('PERM-USR-MANAGE')
  async listPermissions(
    @CurrentUser('orgId') orgId: string,
    @Query('module') module?: string,
  ) {
    return this.usrService.findPermissions(orgId, module);
  }
}
