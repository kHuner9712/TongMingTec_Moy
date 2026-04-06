import { Test, TestingModule } from '@nestjs/testing';
import { CnvService } from './cnv.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Conversation, ConversationStatus } from './entities/conversation.entity';
import { ConversationMessage, MessageType, MessageDirection, SenderType } from './entities/conversation-message.entity';
import { DataSource } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('CnvService', () => {
  let service: CnvService;
  let conversationRepository: jest.Mocked<any>;
  let messageRepository: jest.Mocked<any>;

  const mockConversation = {
    id: 'conv-uuid-123',
    orgId: 'org-uuid-123',
    channelId: 'channel-uuid-123',
    customerId: null,
    assigneeUserId: null,
    status: ConversationStatus.QUEUED,
    waitingSince: new Date(),
    firstResponseAt: null,
    closedAt: null,
    closeReason: null,
    ratingScore: null,
    ratingComment: null,
    version: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CnvService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn(),
            })),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ConversationMessage),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn(),
            })),
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
    });

    it('should throw NotFoundException if not found', async () => {
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findConversationById('nonexistent', 'org-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('accept', () => {
    it('should accept conversation and set status to active', async () => {
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      conversationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.accept(
        'conv-uuid-123',
        'org-uuid-123',
        'agent-uuid-123',
        'user-uuid-123',
        1,
      );

      expect(conversationRepository.update).toHaveBeenCalledWith(
        'conv-uuid-123',
        expect.objectContaining({
          assigneeUserId: 'agent-uuid-123',
          status: ConversationStatus.ACTIVE,
        }),
      );
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
      });
      conversationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.close(
        'conv-uuid-123',
        'org-uuid-123',
        'resolved',
        'user-uuid-123',
        1,
      );

      expect(conversationRepository.update).toHaveBeenCalledWith(
        'conv-uuid-123',
        expect.objectContaining({
          status: ConversationStatus.CLOSED,
          closeReason: 'resolved',
        }),
      );
    });
  });

  describe('sendMessage', () => {
    it('should create message and update conversation status', async () => {
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      messageRepository.create.mockReturnValue({
        id: 'msg-uuid-123',
        conversationId: 'conv-uuid-123',
        messageType: MessageType.TEXT,
        content: 'Hello',
      });
      messageRepository.save.mockResolvedValue({
        id: 'msg-uuid-123',
        conversationId: 'conv-uuid-123',
      });
      conversationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendMessage(
        'conv-uuid-123',
        'org-uuid-123',
        MessageType.TEXT,
        'Hello',
        [],
        'user-uuid-123',
        1,
      );

      expect(messageRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for closed conversation', async () => {
      conversationRepository.findOne.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.CLOSED,
      });

      await expect(
        service.sendMessage(
          'conv-uuid-123',
          'org-uuid-123',
          MessageType.TEXT,
          'Hello',
          [],
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
