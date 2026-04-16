import { MigrationInterface, QueryRunner } from 'typeorm';

export class AiNativeArchitecture1712534400000 implements MigrationInterface {
  name = 'AiNativeArchitecture1712534400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS context_snapshot JSONB;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS intent_summary VARCHAR(255);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS risk_level VARCHAR(16);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_action_suggestion JSONB;
      CREATE INDEX IF NOT EXISTS idx_customers_risk_level ON customers(risk_level);
    `);

    await queryRunner.query(`
      ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS agent_run_id UUID;
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_agent_run_id ON ai_tasks(agent_run_id);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_timeline_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        event_source VARCHAR(64) NOT NULL,
        event_payload JSONB NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL,
        actor_type VARCHAR(16) NOT NULL,
        actor_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID
      );
      CREATE INDEX IF NOT EXISTS idx_cte_customer_id ON customer_timeline_events(customer_id);
      CREATE INDEX IF NOT EXISTS idx_cte_event_type ON customer_timeline_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_cte_occurred_at ON customer_timeline_events(occurred_at);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_operating_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        record_type VARCHAR(32) NOT NULL,
        content TEXT NOT NULL,
        ai_suggestion JSONB,
        human_decision VARCHAR(64),
        source_type VARCHAR(32) NOT NULL,
        source_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_cor_customer_id ON customer_operating_records(customer_id);
      CREATE INDEX IF NOT EXISTS idx_cor_record_type ON customer_operating_records(record_type);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_contexts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        context_type VARCHAR(32) NOT NULL,
        context_data JSONB NOT NULL,
        last_updated_from VARCHAR(64),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_cc_customer_id ON customer_contexts(customer_id);
      CREATE INDEX IF NOT EXISTS idx_cc_context_type ON customer_contexts(context_type);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        intent_type VARCHAR(32) NOT NULL,
        confidence NUMERIC(6,4) NOT NULL,
        evidence JSONB NOT NULL,
        detected_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_ci_customer_id ON customer_intents(customer_id);
      CREATE INDEX IF NOT EXISTS idx_ci_intent_type ON customer_intents(intent_type);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_risks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        risk_level VARCHAR(16) NOT NULL,
        risk_factors JSONB NOT NULL,
        assessed_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_cr_customer_id ON customer_risks(customer_id);
      CREATE INDEX IF NOT EXISTS idx_cr_risk_level ON customer_risks(risk_level);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_next_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        action_type VARCHAR(32) NOT NULL,
        priority INT NOT NULL,
        reasoning TEXT NOT NULL,
        suggested_by VARCHAR(16) NOT NULL,
        suggested_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_cna_customer_id ON customer_next_actions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_cna_action_type ON customer_next_actions(action_type);
      CREATE INDEX IF NOT EXISTS idx_cna_status ON customer_next_actions(status);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(64) NOT NULL,
        agent_type VARCHAR(32) NOT NULL,
        execution_mode VARCHAR(16) NOT NULL,
        resource_scope JSONB NOT NULL,
        tool_scope JSONB NOT NULL,
        risk_level VARCHAR(16) NOT NULL,
        input_schema JSONB NOT NULL,
        output_schema JSONB NOT NULL,
        requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
        rollback_strategy JSONB,
        takeover_strategy JSONB,
        status VARCHAR(16) NOT NULL DEFAULT 'draft',
        created_by UUID,
        updated_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_aa_code ON ai_agents(code);
      CREATE INDEX IF NOT EXISTS idx_aa_status ON ai_agents(status);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_agent_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        agent_id UUID NOT NULL,
        request_id UUID,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        input_payload JSONB NOT NULL,
        output_payload JSONB,
        execution_mode VARCHAR(16) NOT NULL,
        latency_ms INT,
        token_cost NUMERIC(12,6),
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID
      );
      CREATE INDEX IF NOT EXISTS idx_aar_agent_id ON ai_agent_runs(agent_id);
      CREATE INDEX IF NOT EXISTS idx_aar_status ON ai_agent_runs(status);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_approval_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        agent_run_id UUID NOT NULL,
        resource_type VARCHAR(64) NOT NULL,
        resource_id UUID,
        requested_action VARCHAR(64) NOT NULL,
        risk_level VARCHAR(16) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        before_snapshot JSONB,
        proposed_after_snapshot JSONB,
        explanation TEXT NOT NULL,
        approver_user_id UUID,
        approved_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_apr_agent_run_id ON ai_approval_requests(agent_run_id);
      CREATE INDEX IF NOT EXISTS idx_apr_status ON ai_approval_requests(status);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_rollbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        agent_run_id UUID NOT NULL,
        resource_type VARCHAR(32) NOT NULL,
        resource_id UUID,
        rollback_scope JSONB NOT NULL,
        before_snapshot JSONB,
        result VARCHAR(16) NOT NULL,
        rolled_back_by UUID,
        rolled_back_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID
      );
      CREATE INDEX IF NOT EXISTS idx_arb_agent_run_id ON ai_rollbacks(agent_run_id);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_takeovers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        agent_run_id UUID NOT NULL,
        resource_type VARCHAR(32) NOT NULL,
        resource_id UUID,
        takeover_user_id UUID NOT NULL,
        reason TEXT NOT NULL,
        takeover_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID
      );
      CREATE INDEX IF NOT EXISTS idx_at_agent_run_id ON ai_takeovers(agent_run_id);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_prompt_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        template_code VARCHAR(64) NOT NULL,
        agent_code VARCHAR(64) NOT NULL,
        version INT NOT NULL,
        system_prompt TEXT NOT NULL,
        user_prompt_pattern TEXT NOT NULL,
        input_schema JSONB,
        output_schema JSONB,
        safety_rules JSONB,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version_column INT NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_apt_template_code ON ai_prompt_templates(template_code);
      CREATE INDEX IF NOT EXISTS idx_apt_agent_code ON ai_prompt_templates(agent_code);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_tools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(64) NOT NULL,
        tool_type VARCHAR(32) NOT NULL,
        config JSONB NOT NULL,
        risk_level VARCHAR(16) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_at_code ON ai_tools(code);
      CREATE INDEX IF NOT EXISTS idx_at_tool_type ON ai_tools(tool_type);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ai_tools`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_prompt_templates`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_takeovers`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_rollbacks`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_approval_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_agent_runs`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_agents`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_next_actions`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_risks`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_intents`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_contexts`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_operating_records`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_timeline_events`);

    await queryRunner.query(`ALTER TABLE customers DROP COLUMN IF EXISTS context_snapshot`);
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN IF EXISTS intent_summary`);
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN IF EXISTS risk_level`);
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN IF EXISTS next_action_suggestion`);

    await queryRunner.query(`ALTER TABLE ai_tasks DROP COLUMN IF EXISTS agent_run_id`);
  }
}
