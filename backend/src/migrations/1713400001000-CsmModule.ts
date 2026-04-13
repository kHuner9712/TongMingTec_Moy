import { MigrationInterface, QueryRunner } from 'typeorm';

export class CsmModule1713400001000 implements MigrationInterface {
  name = 'CsmModule1713400001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE customer_health_scores (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        score NUMERIC(8,2) NOT NULL DEFAULT 0,
        level VARCHAR(16) NOT NULL DEFAULT 'medium',
        factors JSONB NOT NULL DEFAULT '{}',
        evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT chk_health_level CHECK (level IN ('low','medium','high','critical'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_health_org_customer ON customer_health_scores(org_id, customer_id);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_health_org_level ON customer_health_scores(org_id, level);
    `);

    await queryRunner.query(`
      CREATE TABLE success_plans (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'draft',
        owner_user_id UUID NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_success_plans_org_customer ON success_plans(org_id, customer_id);
    `);

    await queryRunner.query(`
      CREATE TABLE customer_return_visits (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        visit_type VARCHAR(32) NOT NULL,
        summary TEXT NOT NULL,
        next_visit_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_return_visits_org_customer ON customer_return_visits(org_id, customer_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS customer_return_visits;`);
    await queryRunner.query(`DROP TABLE IF EXISTS success_plans;`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_health_scores;`);
  }
}
