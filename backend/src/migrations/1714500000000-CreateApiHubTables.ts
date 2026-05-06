import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateApiHubTables1714500000000 implements MigrationInterface {
  name = "CreateApiHubTables1714500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: "api_projects",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "org_id", type: "uuid", isNullable: true },
          { name: "user_id", type: "uuid", isNullable: true },
          { name: "name", type: "varchar", length: "200", default: "''" },
          { name: "description", type: "text", isNullable: true },
          { name: "status", type: "varchar", length: "20", default: "'active'" },
          { name: "default_model_id", type: "uuid", isNullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
        indices: [
          { name: "idx_api_projects_org_id", columnNames: ["org_id"] },
          { name: "idx_api_projects_user_id", columnNames: ["user_id"] },
          { name: "idx_api_projects_status", columnNames: ["status"] },
          { name: "idx_api_projects_created_at", columnNames: ["created_at"] },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "api_project_keys",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "project_id", type: "uuid", isNullable: false },
          { name: "name", type: "varchar", length: "200", default: "''" },
          { name: "key_prefix", type: "varchar", length: "12", isNullable: false },
          { name: "key_hash", type: "varchar", length: "64", isNullable: false },
          { name: "status", type: "varchar", length: "20", default: "'active'" },
          { name: "last_used_at", type: "timestamptz", isNullable: true },
          { name: "expires_at", type: "timestamptz", isNullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
        indices: [
          { name: "idx_api_project_keys_project_id", columnNames: ["project_id"] },
          { name: "idx_api_project_keys_key_hash", columnNames: ["key_hash"], isUnique: true },
          { name: "idx_api_project_keys_status", columnNames: ["status"] },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "api_models",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "name", type: "varchar", length: "100", isNullable: false },
          { name: "provider", type: "varchar", length: "50", default: "''" },
          { name: "model_id", type: "varchar", length: "100", isNullable: false },
          { name: "category", type: "varchar", length: "20", default: "'text'" },
          { name: "pricing_unit", type: "varchar", length: "20", default: "'token'" },
          { name: "unit_label", type: "varchar", length: "50", isNullable: true },
          { name: "description", type: "text", isNullable: true },
          { name: "status", type: "varchar", length: "20", default: "'internal'" },
          { name: "max_input_tokens", type: "integer", isNullable: true },
          { name: "max_output_tokens", type: "integer", isNullable: true },
          { name: "supports_streaming", type: "boolean", default: "false" },
          { name: "supports_vision", type: "boolean", default: "false" },
          { name: "supports_function_calling", type: "boolean", default: "false" },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
        indices: [
          { name: "idx_api_models_provider", columnNames: ["provider"] },
          { name: "idx_api_models_model_id", columnNames: ["model_id"] },
          { name: "idx_api_models_status", columnNames: ["status"] },
          { name: "idx_api_models_category", columnNames: ["category"] },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "api_project_models",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "project_id", type: "uuid", isNullable: false },
          { name: "model_id", type: "uuid", isNullable: false },
          { name: "enabled", type: "boolean", default: "true" },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
        indices: [
          { name: "idx_api_project_models_project_id", columnNames: ["project_id"] },
          { name: "idx_api_project_models_model_id", columnNames: ["model_id"] },
          { name: "idx_api_project_models_uniq", columnNames: ["project_id", "model_id"], isUnique: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "api_monthly_quota",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "project_id", type: "uuid", isNullable: false },
          { name: "model_id", type: "uuid", isNullable: false },
          { name: "period", type: "varchar", length: "7", isNullable: false },
          { name: "quota_unit", type: "varchar", length: "20", default: "'token'" },
          { name: "quota_limit", type: "bigint", default: "0" },
          { name: "quota_used", type: "bigint", default: "0" },
          { name: "reset_at", type: "timestamptz", isNullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
        indices: [
          { name: "idx_api_monthly_quota_project_id", columnNames: ["project_id"] },
          { name: "idx_api_monthly_quota_model_id", columnNames: ["model_id"] },
          { name: "idx_api_monthly_quota_period", columnNames: ["period"] },
          { name: "idx_api_monthly_quota_uniq", columnNames: ["project_id", "model_id", "period"], isUnique: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "api_usage_records",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "project_id", type: "uuid", isNullable: false },
          { name: "key_id", type: "uuid", isNullable: false },
          { name: "model_id", type: "uuid", isNullable: false },
          { name: "request_id", type: "varchar", length: "64", isNullable: true },
          { name: "input_tokens", type: "integer", default: "0" },
          { name: "output_tokens", type: "integer", default: "0" },
          { name: "total_tokens", type: "integer", default: "0" },
          { name: "cost", type: "decimal", precision: 12, scale: 6, default: "0" },
          { name: "status", type: "varchar", length: "20", default: "'success'" },
          { name: "error_message", type: "text", isNullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
        ],
        indices: [
          { name: "idx_api_usage_records_project_id", columnNames: ["project_id"] },
          { name: "idx_api_usage_records_key_id", columnNames: ["key_id"] },
          { name: "idx_api_usage_records_model_id", columnNames: ["model_id"] },
          { name: "idx_api_usage_records_request_id", columnNames: ["request_id"] },
          { name: "idx_api_usage_records_status", columnNames: ["status"] },
          { name: "idx_api_usage_records_created_at", columnNames: ["created_at"] },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("api_usage_records", true);
    await queryRunner.dropTable("api_monthly_quota", true);
    await queryRunner.dropTable("api_project_models", true);
    await queryRunner.dropTable("api_models", true);
    await queryRunner.dropTable("api_project_keys", true);
    await queryRunner.dropTable("api_projects", true);
  }
}
