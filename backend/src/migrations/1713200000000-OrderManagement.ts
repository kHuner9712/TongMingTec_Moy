import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderManagement1713200000000 implements MigrationInterface {
  name = 'OrderManagement1713200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE orders (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        contract_id UUID NULL,
        quote_id UUID NULL,
        customer_id UUID NOT NULL,
        order_no VARCHAR(32) NOT NULL,
        order_type VARCHAR(16) NOT NULL DEFAULT 'new',
        status VARCHAR(16) NOT NULL DEFAULT 'draft',
        currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
        total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        activated_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
        CONSTRAINT uq_orders_org_no UNIQUE (org_id, order_no) WHERE deleted_at IS NULL,
        CONSTRAINT chk_orders_type CHECK (order_type IN ('new','renewal','addon','refund')),
        CONSTRAINT chk_orders_status CHECK (status IN ('draft','confirmed','active','completed','cancelled','refunded'))
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_orders_org_status ON orders(org_id, status, updated_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_orders_org_customer ON orders(org_id, customer_id)`);

    await queryRunner.query(`
      CREATE TABLE order_items (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
        item_type VARCHAR(16) NOT NULL,
        ref_id UUID NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        CONSTRAINT chk_order_items_type CHECK (item_type IN ('plan','addon','service'))
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_order_items_org_order ON order_items(org_id, order_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS order_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders`);
  }
}
