import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeCategory } from './entities/knowledge-category.entity';
import { KnowledgeItem } from './entities/knowledge-item.entity';
import { KnowledgeReview } from './entities/knowledge-review.entity';
import {
  KnowledgeItemStatus,
  knowledgeItemStateMachine,
} from '../../common/statemachine/definitions/knowledge-item.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { knowledgeItemStatusChanged } from '../../common/events/knowledge-events';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
  ReviewItemDto,
} from './dto/kb.dto';

@Injectable()
export class KbService {
  constructor(
    @InjectRepository(KnowledgeCategory)
    private categoryRepository: Repository<KnowledgeCategory>,
    @InjectRepository(KnowledgeItem)
    private itemRepository: Repository<KnowledgeItem>,
    @InjectRepository(KnowledgeReview)
    private reviewRepository: Repository<KnowledgeReview>,
    private readonly eventBus: EventBusService,
  ) {}

  async findCategories(
    orgId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: KnowledgeCategory[]; total: number }> {
    const qb = this.categoryRepository
      .createQueryBuilder('c')
      .where('c.orgId = :orgId', { orgId })
      .andWhere('c.deletedAt IS NULL')
      .orderBy('c.sortOrder', 'ASC')
      .addOrderBy('c.name', 'ASC');

    qb.skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findCategoryById(id: string, orgId: string): Promise<KnowledgeCategory> {
    const cat = await this.categoryRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!cat) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return cat;
  }

  async createCategory(orgId: string, dto: CreateCategoryDto, userId: string): Promise<KnowledgeCategory> {
    const category = this.categoryRepository.create({
      orgId,
      code: dto.code,
      name: dto.name,
      parentId: dto.parentId || null,
      sortOrder: dto.sortOrder ?? 0,
      status: 'active',
      createdBy: userId,
    });
    return this.categoryRepository.save(category);
  }

  async updateCategory(id: string, orgId: string, dto: UpdateCategoryDto, userId: string): Promise<KnowledgeCategory> {
    const cat = await this.findCategoryById(id, orgId);
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.parentId !== undefined) updateData.parentId = dto.parentId;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    await this.categoryRepository.update(id, {
      ...updateData,
      updatedBy: userId,
    });
    return this.findCategoryById(id, orgId);
  }

  async deleteCategory(id: string, orgId: string, userId: string): Promise<void> {
    await this.findCategoryById(id, orgId);
    const itemCount = await this.itemRepository.count({
      where: { categoryId: id, orgId, deletedAt: null as unknown as undefined },
    });
    if (itemCount > 0) {
      throw new ConflictException('CATEGORY_HAS_ITEMS');
    }
    await this.categoryRepository.update(id, { deletedAt: new Date(), updatedBy: userId });
  }

  async findItems(
    orgId: string,
    filters: { keyword?: string; categoryId?: string; status?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: KnowledgeItem[]; total: number }> {
    const qb = this.itemRepository
      .createQueryBuilder('i')
      .where('i.orgId = :orgId', { orgId })
      .andWhere('i.deletedAt IS NULL');

    if (filters.keyword) {
      qb.andWhere('(i.title ILIKE :kw OR i.contentMd ILIKE :kw)', { kw: `%${filters.keyword}%` });
    }
    if (filters.categoryId) {
      qb.andWhere('i.categoryId = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters.status) {
      qb.andWhere('i.status = :status', { status: filters.status });
    }

    qb.orderBy('i.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findItemById(id: string, orgId: string): Promise<KnowledgeItem> {
    const item = await this.itemRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!item) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return item;
  }

  async createItem(orgId: string, dto: CreateItemDto, userId: string): Promise<KnowledgeItem> {
    const item = this.itemRepository.create({
      orgId,
      categoryId: dto.categoryId || null,
      title: dto.title,
      contentMd: dto.contentMd,
      contentHtml: null,
      status: 'draft' as KnowledgeItemStatus,
      keywords: dto.keywords || null,
      sourceType: dto.sourceType || 'manual',
      createdBy: userId,
    });
    return this.itemRepository.save(item);
  }

  async updateItem(id: string, orgId: string, dto: UpdateItemDto, userId: string): Promise<KnowledgeItem> {
    const item = await this.findItemById(id, orgId);

    if (item.version !== dto.version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.contentMd !== undefined) updateData.contentMd = dto.contentMd;
    if (dto.keywords !== undefined) updateData.keywords = dto.keywords;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;

    if (dto.status !== undefined) {
      const targetStatus = dto.status as KnowledgeItemStatus;
      knowledgeItemStateMachine.validateTransition(item.status, targetStatus);
      updateData.status = targetStatus;

      if (targetStatus === 'published') {
        updateData.contentHtml = item.contentMd;
      }
    }

    await this.itemRepository.update(id, {
      ...updateData,
      updatedBy: userId,
      version: () => 'version + 1',
    });

    if (dto.status !== undefined && dto.status !== item.status) {
      this.eventBus.publish(
        knowledgeItemStatusChanged({
          orgId,
          itemId: id,
          fromStatus: item.status,
          toStatus: dto.status,
          actorType: 'user',
          actorId: userId,
        }),
      );
    }

    return this.findItemById(id, orgId);
  }

  async submitForReview(id: string, orgId: string, userId: string): Promise<KnowledgeItem> {
    const item = await this.findItemById(id, orgId);
    const fromStatus = item.status;
    knowledgeItemStateMachine.validateTransition(item.status, 'review' as KnowledgeItemStatus);

    await this.itemRepository.update(id, {
      status: 'review',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      knowledgeItemStatusChanged({
        orgId,
        itemId: id,
        fromStatus,
        toStatus: 'review',
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findItemById(id, orgId);
  }

  async reviewItem(id: string, orgId: string, dto: ReviewItemDto, userId: string): Promise<KnowledgeItem> {
    const item = await this.findItemById(id, orgId);

    if (item.version !== dto.version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (item.status !== 'review') {
      throw new ConflictException('ITEM_NOT_IN_REVIEW');
    }

    const review = this.reviewRepository.create({
      orgId,
      knowledgeItemId: id,
      status: dto.decision === 'approved' ? 'approved' : 'rejected',
      reviewerUserId: userId,
      comment: dto.comment || null,
      createdBy: userId,
    });
    await this.reviewRepository.save(review);

    const targetStatus: KnowledgeItemStatus = dto.decision === 'approved' ? 'published' : 'draft';
    const fromStatus = item.status;

    await this.itemRepository.update(id, {
      status: targetStatus,
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      knowledgeItemStatusChanged({
        orgId,
        itemId: id,
        fromStatus,
        toStatus: targetStatus,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findItemById(id, orgId);
  }

  async searchItems(
    orgId: string,
    query: string,
    categoryId?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: KnowledgeItem[]; total: number }> {
    const qb = this.itemRepository
      .createQueryBuilder('i')
      .where('i.orgId = :orgId', { orgId })
      .andWhere('i.deletedAt IS NULL')
      .andWhere('i.status = :status', { status: 'published' })
      .andWhere('(i.title ILIKE :q OR i.contentMd ILIKE :q)', { q: `%${query}%` });

    if (categoryId) {
      qb.andWhere('i.categoryId = :categoryId', { categoryId });
    }

    qb.orderBy('i.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async deleteItem(id: string, orgId: string, userId: string): Promise<void> {
    const item = await this.findItemById(id, orgId);
    if (item.status === 'published') {
      throw new ConflictException('PUBLISHED_ITEM_CANNOT_DELETE');
    }
    await this.itemRepository.update(id, { deletedAt: new Date(), updatedBy: userId });
  }
}
