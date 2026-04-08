import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Conversation } from '../../cnv/entities/conversation.entity';
import { ConversationMessage } from '../../cnv/entities/conversation-message.entity';

export enum AITaskType {
  SMART_REPLY = 'smart_reply',
  SUMMARY = 'summary',
  SENTIMENT = 'sentiment',
  CLASSIFICATION = 'classification',
}

export enum AITaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

@Entity('ai_tasks')
export class AITask extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 32,
    name: 'task_type',
  })
  @Index()
  taskType: AITaskType;

  @Column({ type: 'jsonb', name: 'input_payload' })
  inputPayload: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true, name: 'output_payload' })
  outputPayload: Record<string, unknown> | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: AITaskStatus.PENDING,
  })
  @Index()
  status: AITaskStatus;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'conversation_id' })
  @Index()
  conversationId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'message_id' })
  @Index()
  messageId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'agent_run_id' })
  @Index()
  agentRunId: string | null;

  @ManyToOne(() => Conversation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => ConversationMessage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'message_id' })
  message: ConversationMessage;
}
