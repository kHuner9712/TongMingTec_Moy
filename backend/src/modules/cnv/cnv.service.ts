import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Conversation, ConversationStatus } from './entities/conversation.entity';
import { ConversationMessage, MessageType, MessageDirection, SenderType } from './entities/conversation-message.entity';
import { conversationStateMachine } from '../../common/statemachine/definitions/conversation.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { conversationMessageCreated } from '../../common/events/conversation-events';

@Injectable()
export class CnvService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMessage)
    private messageRepository: Repository<ConversationMessage>,
    private dataSource: DataSource,
    private readonly eventBus: EventBusService,
  ) {}

  async findConversations(
    orgId: string,
    userId: string,
    dataScope: string,
    filters: { status?: string; channelId?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Conversation[]; total: number }> {
    const qb = this.conversationRepository
      .createQueryBuilder('conv')
      .where('conv.orgId = :orgId', { orgId });

    if (dataScope === 'self') {
      qb.andWhere('conv.assigneeUserId = :userId', { userId });
    }

    if (filters.status) {
      qb.andWhere('conv.status = :status', { status: filters.status });
    }

    if (filters.channelId) {
      qb.andWhere('conv.channelId = :channelId', { channelId: filters.channelId });
    }

    qb.orderBy('conv.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findConversationById(id: string, orgId: string): Promise<Conversation> {
    const conv = await this.conversationRepository.findOne({
      where: { id, orgId },
    });

    if (!conv) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    return conv;
  }

  async accept(
    id: string,
    orgId: string,
    assigneeUserId: string,
    userId: string,
    version: number,
  ): Promise<Conversation> {
    const conv = await this.findConversationById(id, orgId);

    if (conv.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = conv.status;
    conversationStateMachine.validateTransition(conv.status, ConversationStatus.ACTIVE);

    const now = new Date();

    await this.conversationRepository
      .createQueryBuilder()
      .update(Conversation)
      .set({
        assigneeUserId,
        status: ConversationStatus.ACTIVE,
        firstResponseAt: conv.firstResponseAt || now,
        version: () => 'version + 1',
      })
      .where('id = :id', { id })
      .execute();

    this.eventBus.publish(
      conversationMessageCreated({
        orgId,
        conversationId: id,
        messageId: `status-change-${fromStatus}-to-active`,
        senderType: 'system',
        senderId: userId,
        contentType: 'status_change',
      }),
    );

    return this.findConversationById(id, orgId);
  }

  async transfer(
    id: string,
    orgId: string,
    targetUserId: string,
    reason: string,
    userId: string,
    version: number,
  ): Promise<Conversation> {
    const conv = await this.findConversationById(id, orgId);

    if (conv.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (conv.status !== ConversationStatus.ACTIVE && conv.status !== ConversationStatus.PAUSED) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    await this.conversationRepository
      .createQueryBuilder()
      .update(Conversation)
      .set({
        assigneeUserId: targetUserId,
        version: () => 'version + 1',
      })
      .where('id = :id', { id })
      .execute();

    return this.findConversationById(id, orgId);
  }

  async close(
    id: string,
    orgId: string,
    closeReason: string,
    userId: string,
    version: number,
  ): Promise<Conversation> {
    const conv = await this.findConversationById(id, orgId);

    if (conv.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = conv.status;
    conversationStateMachine.validateTransition(conv.status, ConversationStatus.CLOSED);

    await this.conversationRepository
      .createQueryBuilder()
      .update(Conversation)
      .set({
        status: ConversationStatus.CLOSED,
        closeReason,
        closedAt: new Date(),
        version: () => 'version + 1',
      })
      .where('id = :id', { id })
      .execute();

    this.eventBus.publish(
      conversationMessageCreated({
        orgId,
        conversationId: id,
        messageId: `status-change-${fromStatus}-to-closed`,
        senderType: 'system',
        senderId: userId,
        contentType: 'status_change',
      }),
    );

    return this.findConversationById(id, orgId);
  }

  async findMessages(
    conversationId: string,
    orgId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: ConversationMessage[]; total: number }> {
    const conv = await this.findConversationById(conversationId, orgId);

    const qb = this.messageRepository
      .createQueryBuilder('msg')
      .where('msg.conversationId = :conversationId', {
        conversationId: conv.id,
      })
      .orderBy('msg.sentAt', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async sendMessage(
    conversationId: string,
    orgId: string,
    messageType: MessageType,
    content: string,
    attachments: Record<string, unknown>[],
    userId: string,
    version: number,
  ): Promise<ConversationMessage> {
    const conv = await this.findConversationById(conversationId, orgId);

    if (conv.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (conv.status === ConversationStatus.CLOSED) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    const message = this.messageRepository.create({
      conversationId: conv.id,
      orgId,
      messageType,
      direction: MessageDirection.OUT,
      senderType: SenderType.AGENT,
      senderId: userId,
      content,
      attachments,
      sentAt: new Date(),
      createdBy: userId,
    });

    await this.messageRepository.save(message);

    if (conv.status === ConversationStatus.QUEUED || conv.status === ConversationStatus.WAITING) {
      const fromStatus = conv.status;
      conversationStateMachine.validateTransition(conv.status, ConversationStatus.ACTIVE);

      await this.conversationRepository
        .createQueryBuilder()
        .update(Conversation)
        .set({
          status: ConversationStatus.ACTIVE,
          firstResponseAt: conv.firstResponseAt || new Date(),
          version: () => 'version + 1',
        })
        .where('id = :id', { id: conv.id })
        .execute();

      this.eventBus.publish(
        conversationMessageCreated({
          orgId,
          conversationId: conv.id,
          messageId: `status-change-${fromStatus}-to-active`,
          senderType: 'system',
          senderId: userId,
          contentType: 'status_change',
        }),
      );
    }

    this.eventBus.publish(
      conversationMessageCreated({
        orgId,
        conversationId: conv.id,
        messageId: message.id,
        senderType: SenderType.AGENT,
        senderId: userId,
        contentType: messageType,
      }),
    );

    return message;
  }

  async rate(
    id: string,
    orgId: string,
    score: number,
    comment: string,
  ): Promise<Conversation> {
    const conv = await this.findConversationById(id, orgId);

    if (conv.status !== ConversationStatus.CLOSED) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    await this.conversationRepository.update(id, {
      ratingScore: score,
      ratingComment: comment,
    });

    return this.findConversationById(id, orgId);
  }
}
