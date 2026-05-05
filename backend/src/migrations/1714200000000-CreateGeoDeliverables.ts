import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGeoDeliverables1714200000000 implements MigrationInterface {
  name = "CreateGeoDeliverables1714200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "geo_reports" (
        "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "lead_id"             VARCHAR(36),
        "title"               VARCHAR(200) NOT NULL DEFAULT '',
        "company_name"        VARCHAR(200) NOT NULL DEFAULT '',
        "brand_name"          VARCHAR(200) NOT NULL DEFAULT '',
        "website"             VARCHAR(500) NOT NULL DEFAULT '',
        "industry"            VARCHAR(100) NOT NULL DEFAULT '',
        "target_city"         VARCHAR(100),
        "contact_name"        VARCHAR(100),
        "status"              VARCHAR(20) NOT NULL DEFAULT 'draft',
        "diagnosis_date"      DATE,
        "platforms"           JSONB,
        "competitors"         TEXT,
        "target_questions"    TEXT,
        "test_results"        JSONB,
        "visibility_summary"  TEXT,
        "main_problems"       TEXT,
        "opportunities"       TEXT,
        "recommended_actions" TEXT,
        "markdown"            TEXT,
        "created_by"          UUID,
        "updated_by"          UUID,
        "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_reports_lead_id" ON "geo_reports" ("lead_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_reports_status" ON "geo_reports" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_reports_brand_name" ON "geo_reports" ("brand_name");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_reports_created_at" ON "geo_reports" ("created_at");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "geo_brand_assets" (
        "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "lead_id"              VARCHAR(36),
        "title"                VARCHAR(200) NOT NULL DEFAULT '',
        "company_name"         VARCHAR(200) NOT NULL DEFAULT '',
        "brand_name"           VARCHAR(200) NOT NULL DEFAULT '',
        "website"              VARCHAR(500) NOT NULL DEFAULT '',
        "industry"             VARCHAR(100) NOT NULL DEFAULT '',
        "target_city"          VARCHAR(100),
        "status"               VARCHAR(20) NOT NULL DEFAULT 'draft',
        "basic_info"           JSONB,
        "company_intro"        JSONB,
        "service_items"        JSONB,
        "advantages"           JSONB,
        "cases"                JSONB,
        "faqs"                 JSONB,
        "competitor_diffs"     JSONB,
        "compliance_materials" JSONB,
        "markdown"             TEXT,
        "created_by"           UUID,
        "updated_by"           UUID,
        "created_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_brand_assets_lead_id" ON "geo_brand_assets" ("lead_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_brand_assets_status" ON "geo_brand_assets" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_brand_assets_brand_name" ON "geo_brand_assets" ("brand_name");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_brand_assets_created_at" ON "geo_brand_assets" ("created_at");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_reports_lead_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_reports_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_reports_brand_name";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_reports_created_at";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "geo_reports";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_brand_assets_lead_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_brand_assets_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_brand_assets_brand_name";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_brand_assets_created_at";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "geo_brand_assets";`);
  }
}
