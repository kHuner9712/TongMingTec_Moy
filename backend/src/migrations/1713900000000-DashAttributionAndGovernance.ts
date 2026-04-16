import { MigrationInterface, QueryRunner } from 'typeorm';

export class DashAttributionAndGovernance1713900000000 implements MigrationInterface {
  name = 'DashAttributionAndGovernance1713900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "opportunities"
      ADD COLUMN IF NOT EXISTS "source_conversation_id" uuid
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_opportunities_org_source_conversation"
      ON "opportunities" ("org_id", "source_conversation_id")
      WHERE "deleted_at" IS NULL AND "source_conversation_id" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "subscription_opened_at" timestamptz
    `);
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "delivery_started_at" timestamptz
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_orders_org_subscription_opened_at"
      ON "orders" ("org_id", "subscription_opened_at")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_orders_org_delivery_started_at"
      ON "orders" ("org_id", "delivery_started_at")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "orders" o
      SET "subscription_opened_at" = s.first_started_at
      FROM (
        SELECT "org_id", "order_id", MIN("starts_at") AS first_started_at
        FROM "subscriptions"
        WHERE "deleted_at" IS NULL
          AND "order_id" IS NOT NULL
        GROUP BY "org_id", "order_id"
      ) s
      WHERE o."org_id" = s."org_id"
        AND o."id" = s."order_id"
        AND o."subscription_opened_at" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "orders" o
      SET "delivery_started_at" = d.first_started_at
      FROM (
        SELECT "org_id", "order_id", MIN("started_at") AS first_started_at
        FROM "delivery_orders"
        WHERE "deleted_at" IS NULL
          AND "order_id" IS NOT NULL
        GROUP BY "org_id", "order_id"
      ) d
      WHERE o."org_id" = d."org_id"
        AND o."id" = d."order_id"
        AND o."delivery_started_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_org_delivery_started_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_org_subscription_opened_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_opportunities_org_source_conversation"`);

    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "delivery_started_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "subscription_opened_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "opportunities"
      DROP COLUMN IF EXISTS "source_conversation_id"
    `);
  }
}
