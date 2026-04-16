import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutomationFlows1713700000000 implements MigrationInterface {
  name = 'AutomationFlows1713700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE automation_flows (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        trigger_type VARCHAR(32) NOT NULL,
        trigger_event_type VARCHAR(128) NULL,
        trigger_condition JSONB NOT NULL DEFAULT '{}',
        status VARCHAR(16) NOT NULL DEFAULT 'draft',
        definition JSONB NOT NULL DEFAULT '[]',
        execution_count INT NOT NULL DEFAULT 0,
        failure_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT uq_auto_flows_org_code UNIQUE (org_id, code) WHERE deleted_at IS NULL,
        CONSTRAINT chk_auto_flow_status CHECK (status IN ('draft','active','paused','archived'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_auto_flows_org_status ON automation_flows(org_id, status, updated_at DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_auto_flows_org_trigger ON automation_flows(org_id, trigger_type);
    `);

    await queryRunner.query(`
      CREATE TABLE automation_runs (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        flow_id UUID NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE ON UPDATE CASCADE,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        trigger_payload JSONB NOT NULL DEFAULT '{}',
        started_at TIMESTAMPTZ NULL,
        finished_at TIMESTAMPTZ NULL,
        error_code VARCHAR(64) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        CONSTRAINT chk_auto_run_status CHECK (status IN ('pending','running','completed','failed','cancelled'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_auto_runs_org_flow ON automation_runs(org_id, flow_id);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_auto_runs_org_status ON automation_runs(org_id, status);
    `);

    await queryRunner.query(`
      CREATE TABLE automation_steps (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        run_id UUID NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE ON UPDATE CASCADE,
        step_code VARCHAR(64) NOT NULL,
        step_type VARCHAR(32) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        input_payload JSONB NOT NULL DEFAULT '{}',
        output_payload JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        CONSTRAINT chk_auto_step_status CHECK (status IN ('pending','running','completed','failed','skipped'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_auto_steps_org_run ON automation_steps(org_id, run_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS automation_steps;`);
    await queryRunner.query(`DROP TABLE IF EXISTS automation_runs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS automation_flows;`);
  }
}
