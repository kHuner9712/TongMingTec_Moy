import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGeoContent1714300000000 implements MigrationInterface {
  name = "CreateGeoContent1714300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "geo_content_topics" (
        "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "lead_id"              VARCHAR(36),
        "brand_asset_id"       VARCHAR(36),
        "report_id"            VARCHAR(36),
        "title"                VARCHAR(300) NOT NULL DEFAULT '',
        "content_type"         VARCHAR(50) NOT NULL DEFAULT 'industry_question',
        "target_keyword"       VARCHAR(200),
        "target_question"      TEXT,
        "target_audience"      VARCHAR(200),
        "search_intent"        VARCHAR(50),
        "platform_suggestion"  VARCHAR(200),
        "priority"             VARCHAR(20) NOT NULL DEFAULT 'medium',
        "status"               VARCHAR(20) NOT NULL DEFAULT 'idea',
        "outline"              TEXT,
        "key_points"           JSONB,
        "reference_materials"  JSONB,
        "compliance_notes"     TEXT,
        "planned_publish_date" DATE,
        "actual_publish_date"  DATE,
        "published_url"        VARCHAR(500),
        "created_by"           UUID,
        "updated_by"           UUID,
        "created_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_content_topics_lead_id" ON "geo_content_topics" ("lead_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_content_topics_brand_asset_id" ON "geo_content_topics" ("brand_asset_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_content_topics_status" ON "geo_content_topics" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_content_topics_priority" ON "geo_content_topics" ("priority");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_content_topics_created_at" ON "geo_content_topics" ("created_at");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "geo_content_plans" (
        "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "lead_id"           VARCHAR(36),
        "brand_asset_id"    VARCHAR(36),
        "title"             VARCHAR(300) NOT NULL DEFAULT '',
        "month"             VARCHAR(20),
        "goal"              TEXT,
        "target_platforms"  JSONB,
        "topics"            JSONB,
        "status"            VARCHAR(20) NOT NULL DEFAULT 'draft',
        "summary"           TEXT,
        "created_by"        UUID,
        "updated_by"        UUID,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_content_plans_lead_id" ON "geo_content_plans" ("lead_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_content_plans_brand_asset_id" ON "geo_content_plans" ("brand_asset_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_content_plans_status" ON "geo_content_plans" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_content_plans_month" ON "geo_content_plans" ("month");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_geo_content_plans_created_at" ON "geo_content_plans" ("created_at");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_content_topics_lead_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_content_topics_brand_asset_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_content_topics_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_content_topics_priority";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_content_topics_created_at";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "geo_content_topics";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_content_plans_lead_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_content_plans_brand_asset_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_content_plans_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_content_plans_month";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_geo_content_plans_created_at";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "geo_content_plans";`);
  }
}
