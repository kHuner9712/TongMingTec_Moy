import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutomationTriggers1713600000000 implements MigrationInterface {
  name = 'AutomationTriggers1713600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE automation_triggers (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        name VARCHAR(64) NOT NULL,
        event_type VARCHAR(128) NOT NULL,
        action_type VARCHAR(64) NOT NULL,
        condition JSONB NOT NULL DEFAULT '{}',
        action_payload JSONB NOT NULL DEFAULT '{}',
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        execution_count INT NOT NULL DEFAULT 0,
        failure_count INT NOT NULL DEFAULT 0,
        last_executed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT chk_auto_trigger_status CHECK (status IN ('active','paused','archived'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_auto_triggers_org_status ON automation_triggers(org_id, status, updated_at DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_auto_triggers_org_event ON automation_triggers(org_id, event_type);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_auto_triggers_org_name ON automation_triggers(org_id, name);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS automation_triggers;`);
  }
}
