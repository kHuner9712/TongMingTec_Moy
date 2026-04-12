import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationPreference1712900000000
  implements MigrationInterface
{
  name = 'NotificationPreference1712900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_preferences" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "channels" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "mute_categories" text[] NOT NULL DEFAULT '{}',
        "digest_time" character varying(8),
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "version" integer NOT NULL DEFAULT '1',
        CONSTRAINT "UQ_notification_preferences_org_user" UNIQUE ("org_id", "user_id"),
        CONSTRAINT "PK_notification_preferences_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notification_preferences_org" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_notification_preferences_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_preferences_org_id"
      ON "notification_preferences" ("org_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_preferences_user_id"
      ON "notification_preferences" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notification_preferences_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notification_preferences_org_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences"`);
  }
}
