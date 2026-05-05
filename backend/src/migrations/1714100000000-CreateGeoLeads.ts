import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGeoLeads1714100000000 implements MigrationInterface {
  name = "CreateGeoLeads1714100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "geo_leads" (
        "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_name"        VARCHAR(200) NOT NULL,
        "brand_name"          VARCHAR(200) NOT NULL,
        "website"             VARCHAR(500) NOT NULL,
        "industry"            VARCHAR(100) NOT NULL,
        "target_city"         VARCHAR(100),
        "competitors"         TEXT,
        "contact_name"        VARCHAR(100) NOT NULL,
        "contact_method"      VARCHAR(100) NOT NULL,
        "notes"               TEXT,
        "source"              VARCHAR(50) NOT NULL DEFAULT 'geo_website_form',
        "status"              VARCHAR(20) NOT NULL DEFAULT 'received',
        "assigned_to"         UUID,
        "first_contacted_at"  TIMESTAMPTZ,
        "converted_to_customer_id" VARCHAR(100),
        "ip_address"          VARCHAR(45),
        "user_agent"          TEXT,
        "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_geo_leads_status"
      ON "geo_leads" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_geo_leads_created_at"
      ON "geo_leads" ("created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_geo_leads_contact_method"
      ON "geo_leads" ("contact_method")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_geo_leads_website"
      ON "geo_leads" ("website")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_leads_website"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_leads_contact_method"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_leads_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_leads_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "geo_leads"`);
  }
}
