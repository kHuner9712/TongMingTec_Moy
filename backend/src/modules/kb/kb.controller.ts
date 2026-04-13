import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { KbService } from './kb.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
  ReviewItemDto,
  ItemListQueryDto,
  SearchQueryDto,
} from './dto/kb.dto';

@Controller('knowledge')
export class KbController {
  constructor(private readonly kbService: KbService) {}

  @Get('categories')
  @Permissions('PERM-KB-READ')
  async listCategories(
    @CurrentUser('orgId') orgId: string,
    @Query() query: { page?: number; page_size?: number },
  ) {
    const { items, total } = await this.kbService.findCategories(
      orgId,
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

  @Get('categories/:id')
  @Permissions('PERM-KB-READ')
  async getCategory(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.kbService.findCategoryById(id, orgId);
  }

  @Post('categories')
  @Permissions('PERM-KB-MANAGE')
  async createCategory(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.kbService.createCategory(orgId, dto, userId);
  }

  @Put('categories/:id')
  @Permissions('PERM-KB-MANAGE')
  async updateCategory(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.kbService.updateCategory(id, orgId, dto, userId);
  }

  @Delete('categories/:id')
  @Permissions('PERM-KB-MANAGE')
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.deleteCategory(id, orgId, userId);
  }

  @Get('items')
  @Permissions('PERM-KB-READ')
  async listItems(
    @CurrentUser('orgId') orgId: string,
    @Query() query: ItemListQueryDto,
  ) {
    const { items, total } = await this.kbService.findItems(
      orgId,
      { keyword: query.keyword, categoryId: query.categoryId, status: query.status },
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

  @Get('items/:id')
  @Permissions('PERM-KB-READ')
  async getItem(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.kbService.findItemById(id, orgId);
  }

  @Post('items')
  @Permissions('PERM-KB-MANAGE')
  async createItem(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateItemDto,
  ) {
    return this.kbService.createItem(orgId, dto, userId);
  }

  @Put('items/:id')
  @Permissions('PERM-KB-MANAGE')
  async updateItem(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.kbService.updateItem(id, orgId, dto, userId);
  }

  @Post('items/:id/submit')
  @Permissions('PERM-KB-MANAGE')
  async submitForReview(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.submitForReview(id, orgId, userId);
  }

  @Post('items/:id/review')
  @Permissions('PERM-KB-AUDIT')
  async reviewItem(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReviewItemDto,
  ) {
    return this.kbService.reviewItem(id, orgId, dto, userId);
  }

  @Get('search')
  @Permissions('PERM-KB-READ')
  async searchItems(
    @CurrentUser('orgId') orgId: string,
    @Query() query: SearchQueryDto,
  ) {
    const { items, total } = await this.kbService.searchItems(
      orgId,
      query.q,
      query.categoryId,
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

  @Delete('items/:id')
  @Permissions('PERM-KB-MANAGE')
  async deleteItem(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.deleteItem(id, orgId, userId);
  }
}
