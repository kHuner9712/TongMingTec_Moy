import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeliveryModule1713800000000 implements MigrationInterface {
  name = 'DeliveryModule1713800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE delivery_orders (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        delivery_no VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        customer_id UUID NOT NULL,
        contract_id UUID NULL,
        order_id UUID NULL,
        payment_id UUID NULL,
        subscription_id UUID NULL,
        success_plan_id UUID NULL,
        owner_user_id UUID NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'draft',
        target_outcome_summary TEXT NULL,
        started_at TIMESTAMPTZ NULL,
        ready_for_acceptance_at TIMESTAMPTZ NULL,
        accepted_at TIMESTAMPTZ NULL,
        closed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
        CONSTRAINT chk_delivery_orders_status CHECK (status IN ('draft','active','blocked','ready_for_acceptance','accepted','closed'))
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX idx_delivery_orders_org_no_unique ON delivery_orders(org_id, delivery_no) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_delivery_orders_org_order_unique ON delivery_orders(org_id, order_id) WHERE order_id IS NOT NULL AND deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_delivery_orders_org_customer ON delivery_orders(org_id, customer_id)`);
    await queryRunner.query(`CREATE INDEX idx_delivery_orders_org_status ON delivery_orders(org_id, status, updated_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_delivery_orders_org_subscription ON delivery_orders(org_id, subscription_id)`);

    await queryRunner.query(`
      CREATE TABLE delivery_milestones (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        delivery_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        sequence INT NOT NULL DEFAULT 1,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        due_at TIMESTAMPTZ NULL,
        completed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
        CONSTRAINT chk_delivery_milestones_status CHECK (status IN ('pending','done','blocked'))
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_delivery_milestones_org_delivery ON delivery_milestones(org_id, delivery_id, sequence)`);

    await queryRunner.query(`
      CREATE TABLE delivery_tasks (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        delivery_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        owner_user_id UUID NULL,
        linked_task_id UUID NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        due_at TIMESTAMPTZ NULL,
        completed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
        CONSTRAINT chk_delivery_tasks_status CHECK (status IN ('pending','in_progress','done','blocked'))
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_delivery_tasks_org_delivery ON delivery_tasks(org_id, delivery_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_delivery_tasks_org_owner ON delivery_tasks(org_id, owner_user_id)`);

    await queryRunner.query(`
      CREATE TABLE delivery_acceptances (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        delivery_id UUID NOT NULL,
        acceptance_type VARCHAR(32) NOT NULL DEFAULT 'milestone',
        result VARCHAR(16) NOT NULL DEFAULT 'pending',
        summary TEXT NOT NULL,
        accepted_by_user_id UUID NULL,
        accepted_at TIMESTAMPTZ NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
        CONSTRAINT chk_delivery_acceptances_result CHECK (result IN ('pending','accepted','rejected'))
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_delivery_acceptances_org_delivery ON delivery_acceptances(org_id, delivery_id, created_at DESC)`);

    await queryRunner.query(`
      CREATE TABLE delivery_risks (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        delivery_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        mitigation_plan TEXT NULL,
        severity VARCHAR(16) NOT NULL DEFAULT 'medium',
        status VARCHAR(16) NOT NULL DEFAULT 'open',
        owner_user_id UUID NULL,
        resolved_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
        CONSTRAINT chk_delivery_risks_severity CHECK (severity IN ('low','medium','high','critical')),
        CONSTRAINT chk_delivery_risks_status CHECK (status IN ('open','mitigated','closed'))
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_delivery_risks_org_delivery ON delivery_risks(org_id, delivery_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_delivery_risks_org_status ON delivery_risks(org_id, status, severity)`);

    await queryRunner.query(`
      CREATE TABLE delivery_outcomes (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        delivery_id UUID NOT NULL,
        outcome_code VARCHAR(64) NOT NULL,
        promised_value TEXT NOT NULL,
        actual_value TEXT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        measured_at TIMESTAMPTZ NULL,
        note TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
        CONSTRAINT chk_delivery_outcomes_status CHECK (status IN ('pending','achieved','partial','not_achieved'))
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_delivery_outcomes_org_delivery ON delivery_outcomes(org_id, delivery_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_delivery_outcomes_org_status ON delivery_outcomes(org_id, status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS delivery_outcomes`);
    await queryRunner.query(`DROP TABLE IF EXISTS delivery_risks`);
    await queryRunner.query(`DROP TABLE IF EXISTS delivery_acceptances`);
    await queryRunner.query(`DROP TABLE IF EXISTS delivery_tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS delivery_milestones`);
    await queryRunner.query(`DROP TABLE IF EXISTS delivery_orders`);
  }
}
