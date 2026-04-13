import { MigrationInterface, QueryRunner } from 'typeorm';

export class KnowledgeBase1713500000000 implements MigrationInterface {
  name = 'KnowledgeBase1713500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE knowledge_categories (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(64) NOT NULL,
        parent_id UUID NULL,
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT uq_kb_categories_org_code UNIQUE (org_id, code)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_kb_categories_org_parent ON knowledge_categories(org_id, parent_id);
    `);

    await queryRunner.query(`
      CREATE TABLE knowledge_items (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        category_id UUID NULL REFERENCES knowledge_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
        title VARCHAR(255) NOT NULL,
        content_md TEXT NOT NULL,
        content_html TEXT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'draft',
        keywords TEXT[] NULL,
        source_type VARCHAR(16) NOT NULL DEFAULT 'manual',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT chk_kb_items_status CHECK (status IN ('draft','review','published','archived')),
        CONSTRAINT chk_kb_items_source CHECK (source_type IN ('manual','import','ai'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_kb_items_org_category ON knowledge_items(org_id, category_id);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_kb_items_org_status ON knowledge_items(org_id, status, updated_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE knowledge_reviews (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        knowledge_item_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE ON UPDATE CASCADE,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        reviewer_user_id UUID NOT NULL,
        comment TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        CONSTRAINT chk_kb_reviews_status CHECK (status IN ('pending','approved','rejected'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_kb_reviews_org_item ON knowledge_reviews(org_id, knowledge_item_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS knowledge_reviews;`);
    await queryRunner.query(`DROP TABLE IF EXISTS knowledge_items;`);
    await queryRunner.query(`DROP TABLE IF EXISTS knowledge_categories;`);
  }
}
