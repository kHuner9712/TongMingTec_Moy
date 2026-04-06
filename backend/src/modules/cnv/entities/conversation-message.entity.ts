import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';
import { Conversation } from './conversation.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  CARD = 'card',
}

export enum MessageDirection {
  IN = 'in',
  OUT = 'out',
}

export enum SenderType {
  CUSTOMER = 'customer',
  AGENT = 'agent',
  SYSTEM = 'system',
  BOT = 'bot',
}

@Entity('conversation_messages')
export class ConversationMessage extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'conversation_id' })
  @Index()
  conversationId: string;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'message_type',
  })
  @Index()
  messageType: MessageType;

  @Column({ type: 'varchar', length: 16 })
  @Index()
  direction: MessageDirection;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'sender_type',
  })
  @Index()
  senderType: SenderType;

  @Column({ type: 'uuid', nullable: true, name: 'sender_id' })
  @Index()
  senderId: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: [] })
  attachments: Record<string, unknown>[];

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'external_id' })
  @Index()
  externalId: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'sent_at' })
  @Index()
  sentAt: Date;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}
