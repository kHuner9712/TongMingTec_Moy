import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromptTemplateVersionRename1712707200000 implements MigrationInterface {
  name = 'PromptTemplateVersionRename1712707200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS ai_prompt_templates RENAME COLUMN version TO template_version`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS ai_prompt_templates RENAME COLUMN template_version TO version`,
    );
  }
}
