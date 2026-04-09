import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { CmService } from "./cm.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PageQueryDto } from "../../common/dto/pagination.dto";
import { CustomerStatus, CustomerLevel } from "./entities/customer.entity";
import {
  IsString,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
} from "class-validator";

class CreateCustomerDto {
  @IsString()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  industry?: string;

  @IsOptional()
  @IsEnum(["L1", "L2", "L3", "VIP"])
  level?: CustomerLevel;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  industry?: string;

  @IsOptional()
  @IsEnum(["L1", "L2", "L3", "VIP"])
  level?: CustomerLevel;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsInt()
  @Min(1)
  version: number;
}

class StatusActionDto {
  @IsEnum(["potential", "active", "silent", "lost"])
  status: CustomerStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsInt()
  @Min(1)
  version: number;
}

class CreateContactDto {
  @IsString()
  @MaxLength(64)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  wechat?: string;

  @IsOptional()
  isPrimary?: boolean;
}

class UpdateContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  wechat?: string;

  @IsOptional()
  isPrimary?: boolean;

  @IsInt()
  @Min(1)
  version: number;
}

class ContactVersionDto {
  @IsInt()
  @Min(1)
  version: number;
}

@Controller("customers")
export class CmController {
  constructor(private readonly cmService: CmService) {}

  @Get()
  @Permissions("PERM-CM-VIEW")
  async listCustomers(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @CurrentUser("dataScope") dataScope: string,
    @Query() query: PageQueryDto,
    @Query("status") status?: string,
    @Query("keyword") keyword?: string,
  ) {
    const { items, total } = await this.cmService.findCustomers(
      orgId,
      userId,
      dataScope,
      { status, keyword },
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

  @Get(":id")
  @Permissions("PERM-CM-VIEW")
  async getCustomer(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    const customer = await this.cmService.findCustomerById(id, orgId);
    const contacts = await this.cmService.findContacts(id, orgId);
    return { ...customer, contacts };
  }

  @Post()
  @Permissions("PERM-CM-CREATE")
  async createCustomer(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.cmService.createCustomer(orgId, dto, userId);
  }

  @Put(":id")
  @Permissions("PERM-CM-UPDATE")
  async updateCustomer(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.cmService.updateCustomer(id, orgId, dto, dto.version);
  }

  @Post(":id/status")
  @Permissions("PERM-CM-STATUS")
  async changeStatus(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: StatusActionDto,
  ) {
    return this.cmService.changeStatus(
      id,
      orgId,
      dto.status,
      dto.reason || "",
      dto.version,
    );
  }

  @Post(":id/contacts")
  @Permissions("PERM-CM-UPDATE")
  async createContact(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.cmService.createContact(id, orgId, dto, userId);
  }

  @Put(":id/contacts/:contactId")
  @Permissions("PERM-CM-UPDATE")
  async updateContact(
    @Param("id") id: string,
    @Param("contactId") contactId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.cmService.updateContact(
      contactId,
      id,
      orgId,
      dto,
      dto.version,
    );
  }

  @Delete(":id/contacts/:contactId")
  @Permissions("PERM-CM-UPDATE")
  async deleteContact(
    @Param("id") id: string,
    @Param("contactId") contactId: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    await this.cmService.deleteContact(contactId, id, orgId);
    return { code: "OK", message: "success" };
  }

  @Post(":id/contacts/:contactId/set-primary")
  @Permissions("PERM-CM-UPDATE")
  async setPrimaryContact(
    @Param("id") id: string,
    @Param("contactId") contactId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: ContactVersionDto,
  ) {
    return this.cmService.setPrimaryContact(contactId, id, orgId, dto.version);
  }
}
