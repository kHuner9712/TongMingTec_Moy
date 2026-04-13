import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

@Entity('knowledge_reviews')
export class KnowledgeReview extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'knowledge_item_id' })
  @Index()
  knowledgeItemId: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: string;

  @Column({ type: 'uuid', name: 'reviewer_user_id' })
  reviewerUserId: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
