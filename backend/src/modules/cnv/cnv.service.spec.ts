import { Test, TestingModule } from '@nestjs/testing';
import { CnvService } from './cnv.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Conversation, ConversationStatus } from './entities/conversation.entity';
import { ConversationMessage, MessageDirection, MessageType, SenderType } from './entities/conversation-message.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('CnvService', () => {
  let service: CnvService;
  let conversationRepository: jest.Mocked<any>;
  let messageRepository: jest.Mocked<any>;

  const mockConversation = {
    id: 'conv-uuid-123',
    orgId: 'org-uuid-123',
    channelId: 'channel-uuid-123',
    externalId: 'ext-123',
    status: ConversationStatus.QUEUED,
    assigneeUserId: null,
    customerId: null,
    firstResponseAt: null,
    closedAt: null,
    closeReason: null,
    version: 1,
  };

  const mockMessage = {
    id: 'msg-uuid-123',
    conversationId: 'conv-uuid-123',
    orgId: 'org-uuid-123',
    direction: MessageDirection.IN,
    messageType: MessageType.TEXT,
    senderType: SenderType.CUSTOMER,
    content: '您好，我想咨询一下产品',
    senderId: 'customer-uuid-123',
    sentAt: new Date(),
  };

  const createMockQueryBuilder = () => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CnvService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(createMockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(ConversationMessage),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(createMockQueryBuilder),
          },
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CnvService>(CnvService);
    conversationRepository = module.get(getRepositoryToken(Conversation));
    messageRepository = module.get(getRepositoryToken(ConversationMessage));
  });

  describe('findConversationById', () => {
    it('should return conversation if found', async () => {
      conversationRepository.findOne.mockResolvedValue(mockConversation);

      const result = await service.findConversationById('conv-uuid-123', 'org-uuid-123');

      expect(result.id).toBe('conv-uuid-123');
      expect(result.status).toBe(ConversationStatus.QUEUED);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findConversationById('nonexistent', 'org-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('accept', () => {
    it('should accept conversation and change status to active', async () => {
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      
      const mockQb = createMockQueryBuilder();
      mockQb.execute.mockResolvedValue({ affected: 1 });
      conversationRepository.createQueryBuilder.mockReturnValue(mockQb);
      
      conversationRepository.findOne.mockResolvedValueOnce(mockConversation);
      conversationRepository.findOne.mockResolvedValueOnce({
        ...mockConversation,
        status: ConversationStatus.ACTIVE,
        assigneeUserId: 'agent-uuid-123',
      });

      const result = await service.accept(
        'conv-uuid-123',
        'org-uuid-123',
        'agent-uuid-123',
        'user-uuid-123',
        1,
      );

      expect(mockQb.set).toHaveBeenCalled();
      expect(mockQb.where).toHaveBeenCalled();
    });

    it('should throw ConflictException for version mismatch', async () => {
      conversationRepository.findOne.mockResolvedValue({
        ...mockConversation,
        version: 2,
      });

      await expect(
        service.accept('conv-uuid-123', 'org-uuid-123', 'agent-uuid-123', 'user-uuid-123', 1),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      conversationRepository.findOne.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.CLOSED,
        version: 1,
      });

      await expect(
        service.accept('conv-uuid-123', 'org-uuid-123', 'agent-uuid-123', 'user-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('close', () => {
    it('should close conversation with reason', async () => {
      conversationRepository.findOne.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.ACTIVE,
        version: 1,
      });
      
      const mockQb = createMockQueryBuilder();
      mockQb.execute.mockResolvedValue({ affected: 1 });
      conversationRepository.createQueryBuilder.mockReturnValue(mockQb);
      
      conversationRepository.findOne.mockResolvedValueOnce({
        ...mockConversation,
        status: ConversationStatus.ACTIVE,
        version: 1,
      });
      conversationRepository.findOne.mockResolvedValueOnce({
        ...mockConversation,
        status: ConversationStatus.CLOSED,
        closeReason: '问题已解决',
      });

      const result = await service.close(
        'conv-uuid-123',
        'org-uuid-123',
        '问题已解决',
        'user-uuid-123',
        1,
      );

      expect(mockQb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConversationStatus.CLOSED,
          closeReason: '问题已解决',
        }),
      );
    });

    it('should throw ConflictException for version mismatch', async () => {
      conversationRepository.findOne.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.ACTIVE,
        version: 2,
      });

      await expect(
        service.close('conv-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      conversationRepository.findOne.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.CLOSED,
        version: 1,
      });

      await expect(
        service.close('conv-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendMessage', () => {
    it('should send outbound message', async () => {
      conversationRepository.findOne.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.ACTIVE,
      });
      messageRepository.create.mockReturnValue(mockMessage);
      messageRepository.save.mockResolvedValue(mockMessage);

      const result = await service.sendMessage(
        'conv-uuid-123',
        'org-uuid-123',
        MessageType.TEXT,
        '感谢您的咨询',
        [],
        'user-uuid-123',
        1,
      );

      expect(messageRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for nonexistent conversation', async () => {
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.sendMessage(
          'nonexistent',
          'org-uuid-123',
          MessageType.TEXT,
          'message',
          [],
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMessages', () => {
    it('should return paginated messages', async () => {
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockMessage], 1]);
      messageRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findMessages('conv-uuid-123', 'org-uuid-123', 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('SM-conversation state machine validation', () => {
    it('should allow transition from queued to active', async () => {
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      
      const mockQb = createMockQueryBuilder();
      mockQb.execute.mockResolvedValue({ affected: 1 });
      conversationRepository.createQueryBuilder.mockReturnValue(mockQb);
      
      conversationRepository.findOne.mockResolvedValueOnce(mockConversation);
      conversationRepository.findOne.mockResolvedValueOnce({
        ...mockConversation,
        status: ConversationStatus.ACTIVE,
      });

      await expect(
        service.accept('conv-uuid-123', 'org-uuid-123', 'agent-uuid-123', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from active to closed', async () => {
      conversationRepository.findOne.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.ACTIVE,
        version: 1,
      });
      
      const mockQb = createMockQueryBuilder();
      mockQb.execute.mockResolvedValue({ affected: 1 });
      conversationRepository.createQueryBuilder.mockReturnValue(mockQb);
      
      conversationRepository.findOne.mockResolvedValueOnce({
        ...mockConversation,
        status: ConversationStatus.ACTIVE,
        version: 1,
      });
      conversationRepository.findOne.mockResolvedValueOnce({
        ...mockConversation,
        status: ConversationStatus.CLOSED,
      });

      await expect(
        service.close('conv-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from paused to closed', async () => {
      conversationRepository.findOne.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.PAUSED,
        version: 1,
      });
      
      const mockQb = createMockQueryBuilder();
      mockQb.execute.mockResolvedValue({ affected: 1 });
      conversationRepository.createQueryBuilder.mockReturnValue(mockQb);
      
      conversationRepository.findOne.mockResolvedValueOnce({
        ...mockConversation,
        status: ConversationStatus.PAUSED,
        version: 1,
      });
      conversationRepository.findOne.mockResolvedValueOnce({
        ...mockConversation,
        status: ConversationStatus.CLOSED,
      });

      await expect(
        service.close('conv-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should block transition from closed to active', async () => {
      conversationRepository.findOne.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.CLOSED,
        version: 1,
      });

      await expect(
        service.accept('conv-uuid-123', 'org-uuid-123', 'agent-uuid-123', 'user-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('multi-tenant isolation', () => {
    it('should only return conversations from same org', async () => {
      conversationRepository.findOne.mockResolvedValue(mockConversation);

      await service.findConversationById('conv-uuid-123', 'org-uuid-123');

      expect(conversationRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: 'org-uuid-123',
          }),
        }),
      );
    });

    it('should throw NotFoundException for cross-org access', async () => {
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findConversationById('conv-uuid-123', 'different-org-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
