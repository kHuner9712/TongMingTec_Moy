import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApiProviderConfigs1744464000000 implements MigrationInterface {
  name = "CreateApiProviderConfigs1744464000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "api_provider_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider" character varying(64) NOT NULL,
        "display_name" character varying(128) NOT NULL,
        "base_url" character varying(512) NOT NULL,
        "api_key_env_name" character varying(128) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'active',
        "timeout_ms" integer NOT NULL DEFAULT 60000,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_api_provider_configs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_api_provider_configs_provider" UNIQUE ("provider")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "api_models" ADD COLUMN IF NOT EXISTS "upstream_model" character varying(128)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "api_models" DROP COLUMN IF EXISTS "upstream_model"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "api_provider_configs"`);
  }
}
