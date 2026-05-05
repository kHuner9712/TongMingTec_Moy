import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateGeoContentDrafts1714400000000 implements MigrationInterface {
  name = "CreateGeoContentDrafts1714400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "geo_content_drafts",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "lead_id", type: "varchar", length: "36", isNullable: true },
          { name: "brand_asset_id", type: "varchar", length: "36", isNullable: true },
          { name: "report_id", type: "varchar", length: "36", isNullable: true },
          { name: "topic_id", type: "varchar", length: "36", isNullable: true },
          { name: "plan_id", type: "varchar", length: "36", isNullable: true },
          { name: "title", type: "varchar", length: "300", default: "''" },
          { name: "slug", type: "varchar", length: "300", isNullable: true },
          { name: "content_type", type: "varchar", length: "50", isNullable: true },
          { name: "target_keyword", type: "varchar", length: "200", isNullable: true },
          { name: "target_question", type: "text", isNullable: true },
          { name: "target_audience", type: "varchar", length: "200", isNullable: true },
          { name: "platform", type: "varchar", length: "100", isNullable: true },
          { name: "status", type: "varchar", length: "20", default: "'draft'" },
          { name: "summary", type: "text", isNullable: true },
          { name: "outline", type: "text", isNullable: true },
          { name: "body", type: "text", isNullable: true },
          { name: "markdown", type: "text", isNullable: true },
          { name: "seo_title", type: "varchar", length: "300", isNullable: true },
          { name: "meta_description", type: "varchar", length: "500", isNullable: true },
          { name: "tags", type: "jsonb", isNullable: true },
          { name: "compliance_checklist", type: "jsonb", isNullable: true },
          { name: "review_notes", type: "text", isNullable: true },
          { name: "published_url", type: "varchar", length: "500", isNullable: true },
          { name: "planned_publish_date", type: "date", isNullable: true },
          { name: "actual_publish_date", type: "date", isNullable: true },
          { name: "created_by", type: "uuid", isNullable: true },
          { name: "updated_by", type: "uuid", isNullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
        indices: [
          { name: "idx_geo_content_drafts_lead_id", columnNames: ["lead_id"] },
          { name: "idx_geo_content_drafts_brand_asset_id", columnNames: ["brand_asset_id"] },
          { name: "idx_geo_content_drafts_topic_id", columnNames: ["topic_id"] },
          { name: "idx_geo_content_drafts_plan_id", columnNames: ["plan_id"] },
          { name: "idx_geo_content_drafts_status", columnNames: ["status"] },
          { name: "idx_geo_content_drafts_created_at", columnNames: ["created_at"] },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("geo_content_drafts", true);
  }
}
