import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoResultLoopClosure1714000000000 implements MigrationInterface {
  name = 'AutoResultLoopClosure1714000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD COLUMN IF NOT EXISTS "trigger_event_type" varchar(128)
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD COLUMN IF NOT EXISTS "trigger_condition_snapshot" jsonb NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD COLUMN IF NOT EXISTS "triggered_by_type" varchar(16) NOT NULL DEFAULT 'system'
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD COLUMN IF NOT EXISTS "triggered_by_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD COLUMN IF NOT EXISTS "business_context" jsonb NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD COLUMN IF NOT EXISTS "approval_state" varchar(16)
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD COLUMN IF NOT EXISTS "manual_intervention" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD COLUMN IF NOT EXISTS "current_step_code" varchar(64)
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD COLUMN IF NOT EXISTS "error_message" text
    `);

    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      ADD COLUMN IF NOT EXISTS "approval_request_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      ADD COLUMN IF NOT EXISTS "requires_approval" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      ADD COLUMN IF NOT EXISTS "business_context" jsonb NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      ADD COLUMN IF NOT EXISTS "error_message" text
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_auto_steps_org_approval_request"
      ON "automation_steps" ("org_id", "approval_request_id")
      WHERE "approval_request_id" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP CONSTRAINT IF EXISTS "chk_auto_run_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD CONSTRAINT "chk_auto_run_status"
      CHECK (status IN ('pending','running','awaiting_approval','completed','failed','cancelled'))
    `);

    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      DROP CONSTRAINT IF EXISTS "chk_auto_step_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      ADD CONSTRAINT "chk_auto_step_status"
      CHECK (status IN ('pending','running','awaiting_approval','completed','failed','skipped'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      DROP CONSTRAINT IF EXISTS "chk_auto_step_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      ADD CONSTRAINT "chk_auto_step_status"
      CHECK (status IN ('pending','running','completed','failed','skipped'))
    `);

    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP CONSTRAINT IF EXISTS "chk_auto_run_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      ADD CONSTRAINT "chk_auto_run_status"
      CHECK (status IN ('pending','running','completed','failed','cancelled'))
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auto_steps_org_approval_request"`);

    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      DROP COLUMN IF EXISTS "error_message"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      DROP COLUMN IF EXISTS "business_context"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      DROP COLUMN IF EXISTS "requires_approval"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_steps"
      DROP COLUMN IF EXISTS "approval_request_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP COLUMN IF EXISTS "error_message"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP COLUMN IF EXISTS "current_step_code"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP COLUMN IF EXISTS "manual_intervention"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP COLUMN IF EXISTS "approval_state"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP COLUMN IF EXISTS "business_context"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP COLUMN IF EXISTS "triggered_by_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP COLUMN IF EXISTS "triggered_by_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP COLUMN IF EXISTS "trigger_condition_snapshot"
    `);
    await queryRunner.query(`
      ALTER TABLE "automation_runs"
      DROP COLUMN IF EXISTS "trigger_event_type"
    `);
  }
}

