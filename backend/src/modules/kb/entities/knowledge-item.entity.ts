import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { KnowledgeItemStatus } from '../../../common/statemachine/definitions/knowledge-item.sm';

@Entity('knowledge_items')
export class KnowledgeItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  @Index()
  categoryId: string | null;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  @Column({ type: 'text', name: 'content_md' })
  contentMd: string;

  @Column({ type: 'text', name: 'content_html', nullable: true })
  contentHtml: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'draft',
  })
  @Index()
  status: KnowledgeItemStatus;

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[] | null;

  @Column({ type: 'varchar', length: 16, name: 'source_type', default: 'manual' })
  sourceType: string;
}
