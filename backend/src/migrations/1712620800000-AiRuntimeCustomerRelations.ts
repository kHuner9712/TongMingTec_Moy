import { MigrationInterface, QueryRunner } from 'typeorm';

export class AiRuntimeCustomerRelations1712620800000 implements MigrationInterface {
  name = 'AiRuntimeCustomerRelations1712620800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_state_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID,
        customer_id UUID NOT NULL,
        snapshot_type VARCHAR(32) NOT NULL,
        state_data JSONB NOT NULL,
        agent_run_id UUID,
        trigger_event VARCHAR(64)
      );
      CREATE INDEX IF NOT EXISTS idx_customer_state_snapshots_customer_id ON customer_state_snapshots(customer_id);
      CREATE INDEX IF NOT EXISTS idx_customer_state_snapshots_snapshot_type ON customer_state_snapshots(snapshot_type);
      CREATE INDEX IF NOT EXISTS idx_customer_state_snapshots_agent_run_id ON customer_state_snapshots(agent_run_id);
      CREATE INDEX IF NOT EXISTS idx_customer_state_snapshots_org_id ON customer_state_snapshots(org_id);
    `);

    await queryRunner.query(`
      ALTER TABLE ai_agent_runs ADD COLUMN IF NOT EXISTS customer_id UUID;
      CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_customer_id ON ai_agent_runs(customer_id);
    `);

    await queryRunner.query(`
      ALTER TABLE ai_approval_requests ADD COLUMN IF NOT EXISTS customer_id UUID;
      CREATE INDEX IF NOT EXISTS idx_ai_approval_requests_customer_id ON ai_approval_requests(customer_id);
    `);

    await queryRunner.query(`
      ALTER TABLE ai_rollbacks ADD COLUMN IF NOT EXISTS customer_id UUID;
      CREATE INDEX IF NOT EXISTS idx_ai_rollbacks_customer_id ON ai_rollbacks(customer_id);
    `);

    await queryRunner.query(`
      ALTER TABLE ai_takeovers ADD COLUMN IF NOT EXISTS customer_id UUID;
      CREATE INDEX IF NOT EXISTS idx_ai_takeovers_customer_id ON ai_takeovers(customer_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_takeovers_customer_id`);
    await queryRunner.query(`ALTER TABLE ai_takeovers DROP COLUMN IF EXISTS customer_id`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_rollbacks_customer_id`);
    await queryRunner.query(`ALTER TABLE ai_rollbacks DROP COLUMN IF EXISTS customer_id`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_approval_requests_customer_id`);
    await queryRunner.query(`ALTER TABLE ai_approval_requests DROP COLUMN IF EXISTS customer_id`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_agent_runs_customer_id`);
    await queryRunner.query(`ALTER TABLE ai_agent_runs DROP COLUMN IF EXISTS customer_id`);

    await queryRunner.query(`DROP TABLE IF EXISTS customer_state_snapshots`);
  }
}
