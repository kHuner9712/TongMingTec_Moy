import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KbService } from './kb.service';
import { KnowledgeCategory } from './entities/knowledge-category.entity';
import { KnowledgeItem } from './entities/knowledge-item.entity';
import { KnowledgeReview } from './entities/knowledge-review.entity';
import { EventBusService } from '../../common/events/event-bus.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('KbService', () => {
  let service: KbService;
  let categoryRepository: any;
  let itemRepository: any;
  let reviewRepository: any;
  let eventBus: any;

  const mockCategory = {
    id: 'cat-1',
    orgId: 'org-1',
    code: 'faq',
    name: '常见问题',
    parentId: null,
    sortOrder: 0,
    status: 'active',
    version: 1,
    createdBy: 'user-1',
  };

  const mockItem = {
    id: 'item-1',
    orgId: 'org-1',
    categoryId: 'cat-1',
    title: '退款政策',
    contentMd: '# 退款政策\n退款需在7天内申请',
    contentHtml: null,
    status: 'draft',
    keywords: ['退款', '政策'],
    sourceType: 'manual',
    version: 1,
    createdBy: 'user-1',
  };

  const createMockQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockItem], 1]),
  });

  const createCategoryMockQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockCategory], 1]),
  });

  beforeEach(async () => {
    categoryRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createCategoryMockQb()),
    };

    itemRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb()),
    };

    reviewRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KbService,
        { provide: getRepositoryToken(KnowledgeCategory), useValue: categoryRepository },
        { provide: getRepositoryToken(KnowledgeItem), useValue: itemRepository },
        { provide: getRepositoryToken(KnowledgeReview), useValue: reviewRepository },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<KbService>(KbService);
  });

  describe('findCategoryById', () => {
    it('should return category if found', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      const result = await service.findCategoryById('cat-1', 'org-1');
      expect(result.id).toBe('cat-1');
    });

    it('should throw NotFoundException if not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);
      await expect(service.findCategoryById('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCategory', () => {
    it('should create a category', async () => {
      categoryRepository.create.mockReturnValue(mockCategory);
      categoryRepository.save.mockResolvedValue(mockCategory);
      const result = await service.createCategory('org-1', {
        code: 'faq',
        name: '常见问题',
      }, 'user-1');
      expect(result.code).toBe('faq');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category when no items', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      itemRepository.count.mockResolvedValue(0);
      categoryRepository.update.mockResolvedValue({ affected: 1 });
      await service.deleteCategory('cat-1', 'org-1', 'user-1');
      expect(categoryRepository.update).toHaveBeenCalledWith('cat-1', expect.objectContaining({ deletedAt: expect.any(Date) }));
    });

    it('should throw ConflictException when category has items', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      itemRepository.count.mockResolvedValue(3);
      await expect(service.deleteCategory('cat-1', 'org-1', 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('findItemById', () => {
    it('should return item if found', async () => {
      itemRepository.findOne.mockResolvedValue(mockItem);
      const result = await service.findItemById('item-1', 'org-1');
      expect(result.id).toBe('item-1');
    });

    it('should throw NotFoundException if not found', async () => {
      itemRepository.findOne.mockResolvedValue(null);
      await expect(service.findItemById('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createItem', () => {
    it('should create an item with draft status', async () => {
      itemRepository.create.mockReturnValue(mockItem);
      itemRepository.save.mockResolvedValue(mockItem);
      const result = await service.createItem('org-1', {
        categoryId: 'cat-1',
        title: '退款政策',
        contentMd: '# 退款政策\n退款需在7天内申请',
        keywords: ['退款', '政策'],
      }, 'user-1');
      expect(result.title).toBe('退款政策');
    });
  });

  describe('updateItem', () => {
    it('should update item with version check', async () => {
      itemRepository.findOne
        .mockResolvedValueOnce(mockItem)
        .mockResolvedValueOnce({ ...mockItem, title: '新标题', version: 2 });
      itemRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateItem('item-1', 'org-1', {
        title: '新标题',
        version: 1,
      }, 'user-1');
      expect(itemRepository.update).toHaveBeenCalled();
    });

    it('should throw ConflictException on version mismatch', async () => {
      itemRepository.findOne.mockResolvedValue({ ...mockItem, version: 2 });
      await expect(service.updateItem('item-1', 'org-1', {
        title: '新标题',
        version: 1,
      }, 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should validate state machine on status change', async () => {
      itemRepository.findOne.mockResolvedValue(mockItem);
      await expect(service.updateItem('item-1', 'org-1', {
        status: 'archived',
        version: 1,
      }, 'user-1')).rejects.toThrow();
    });
  });

  describe('submitForReview', () => {
    it('should transition draft to review', async () => {
      itemRepository.findOne
        .mockResolvedValueOnce(mockItem)
        .mockResolvedValueOnce({ ...mockItem, status: 'review' });
      itemRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.submitForReview('item-1', 'org-1', 'user-1');
      expect(itemRepository.update).toHaveBeenCalledWith('item-1', expect.objectContaining({ status: 'review' }));
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should reject transition from published to review', async () => {
      itemRepository.findOne.mockResolvedValue({ ...mockItem, status: 'published' });
      await expect(service.submitForReview('item-1', 'org-1', 'user-1')).rejects.toThrow();
    });
  });

  describe('reviewItem', () => {
    it('should approve and publish item', async () => {
      const reviewItem = { ...mockItem, status: 'review' };
      itemRepository.findOne
        .mockResolvedValueOnce(reviewItem)
        .mockResolvedValueOnce({ ...reviewItem, status: 'published' });
      reviewRepository.create.mockReturnValue({});
      reviewRepository.save.mockResolvedValue({});
      itemRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.reviewItem('item-1', 'org-1', {
        decision: 'approved',
        comment: '内容合规',
        version: 1,
      }, 'user-2');
      expect(reviewRepository.save).toHaveBeenCalled();
      expect(itemRepository.update).toHaveBeenCalledWith('item-1', expect.objectContaining({ status: 'published' }));
    });

    it('should reject and revert to draft', async () => {
      const reviewItem = { ...mockItem, status: 'review' };
      itemRepository.findOne
        .mockResolvedValueOnce(reviewItem)
        .mockResolvedValueOnce({ ...reviewItem, status: 'draft' });
      reviewRepository.create.mockReturnValue({});
      reviewRepository.save.mockResolvedValue({});
      itemRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.reviewItem('item-1', 'org-1', {
        decision: 'rejected',
        comment: '需要修改',
        version: 1,
      }, 'user-2');
      expect(itemRepository.update).toHaveBeenCalledWith('item-1', expect.objectContaining({ status: 'draft' }));
    });

    it('should throw ConflictException if item not in review status', async () => {
      itemRepository.findOne.mockResolvedValue(mockItem);
      await expect(service.reviewItem('item-1', 'org-1', {
        decision: 'approved',
        version: 1,
      }, 'user-2')).rejects.toThrow(ConflictException);
    });
  });

  describe('searchItems', () => {
    it('should search published items by keyword', async () => {
      const searchQb = createMockQb();
      itemRepository.createQueryBuilder.mockReturnValue(searchQb);

      const result = await service.searchItems('org-1', '退款');
      expect(result.items).toBeDefined();
      expect(itemRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    it('should delete draft item', async () => {
      itemRepository.findOne.mockResolvedValue(mockItem);
      itemRepository.update.mockResolvedValue({ affected: 1 });
      await service.deleteItem('item-1', 'org-1', 'user-1');
      expect(itemRepository.update).toHaveBeenCalledWith('item-1', expect.objectContaining({ deletedAt: expect.any(Date) }));
    });

    it('should throw ConflictException when deleting published item', async () => {
      itemRepository.findOne.mockResolvedValue({ ...mockItem, status: 'published' });
      await expect(service.deleteItem('item-1', 'org-1', 'user-1')).rejects.toThrow(ConflictException);
    });
  });
});
