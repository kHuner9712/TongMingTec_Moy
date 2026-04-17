import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromptTemplateVersionRename1712707200000 implements MigrationInterface {
  name = 'PromptTemplateVersionRename1712707200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'ai_prompt_templates'
            AND column_name = 'version'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'ai_prompt_templates'
            AND column_name = 'template_version'
        ) THEN
          ALTER TABLE ai_prompt_templates RENAME COLUMN version TO template_version;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'ai_prompt_templates'
            AND column_name = 'version_column'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'ai_prompt_templates'
            AND column_name = 'version'
        ) THEN
          ALTER TABLE ai_prompt_templates RENAME COLUMN version_column TO version;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'ai_prompt_templates'
            AND column_name = 'version'
        ) AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'ai_prompt_templates'
            AND column_name = 'template_version'
        ) THEN
          ALTER TABLE ai_prompt_templates RENAME COLUMN version TO version_column;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'ai_prompt_templates'
            AND column_name = 'template_version'
        ) THEN
          ALTER TABLE ai_prompt_templates RENAME COLUMN template_version TO version;
        END IF;
      END
      $$;
    `);
  }
}
