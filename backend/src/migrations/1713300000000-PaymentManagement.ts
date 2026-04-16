import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentManagement1713300000000 implements MigrationInterface {
  name = 'PaymentManagement1713300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        order_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        payment_no VARCHAR(32) NOT NULL,
        payment_method VARCHAR(16) NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
        amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        paid_at TIMESTAMPTZ NULL,
        external_txn_id VARCHAR(128) NULL,
        remark TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
        CONSTRAINT chk_payments_status CHECK (status IN ('pending','processing','succeeded','failed','refunded','voided'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_payments_org_no_live
      ON payments(org_id, payment_no)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`CREATE INDEX idx_payments_org_status ON payments(org_id, status, updated_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_payments_org_order ON payments(org_id, order_id)`);
    await queryRunner.query(`CREATE INDEX idx_payments_org_customer ON payments(org_id, customer_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_org_customer`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_org_order`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_org_status`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments`);
  }
}
