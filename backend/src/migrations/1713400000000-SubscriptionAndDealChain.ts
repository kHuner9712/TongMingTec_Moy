import { MigrationInterface, QueryRunner } from 'typeorm';

export class SubscriptionAndDealChain1713400000000 implements MigrationInterface {
  name = 'SubscriptionAndDealChain1713400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE subscriptions (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        order_id UUID NULL,
        customer_id UUID NOT NULL,
        plan_id UUID NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'trial',
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NOT NULL,
        auto_renew BOOLEAN NOT NULL DEFAULT false,
        seat_count INT NOT NULL DEFAULT 1,
        used_count INT NOT NULL DEFAULT 0,
        last_bill_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT chk_subscriptions_status CHECK (status IN ('trial','active','overdue','suspended','expired','cancelled'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_org_status ON subscriptions(org_id, status, updated_at DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_org_customer ON subscriptions(org_id, customer_id);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_order_id ON subscriptions(order_id);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_ends_at ON subscriptions(ends_at);
    `);

    await queryRunner.query(`
      CREATE TABLE subscription_seats (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        subscription_id UUID NOT NULL,
        seat_code VARCHAR(64) NOT NULL,
        seat_count INT NOT NULL DEFAULT 0,
        used_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_sub_seats_org_sub_code_live
      ON subscription_seats(org_id, subscription_id, seat_code)
      WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX idx_sub_seats_org_subscription ON subscription_seats(org_id, subscription_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS subscription_seats;`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscriptions;`);
  }
}
