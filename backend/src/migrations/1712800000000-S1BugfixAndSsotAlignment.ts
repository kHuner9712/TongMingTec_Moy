import { MigrationInterface, QueryRunner } from 'typeorm';

export class S1BugfixAndSsotAlignment1712800000000 implements MigrationInterface {
  name = 'S1BugfixAndSsotAlignment1712800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" ADD "customer_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_customer_id" ON "leads" ("customer_id")`);

    await queryRunner.query(`ALTER TABLE "customers" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "customers" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "leads" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "leads" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "opportunities" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "opportunities" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "conversations" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "conversations" ADD "updated_by" uuid`);
    await queryRunner.query(`ALTER TABLE "conversations" ADD "subject" character varying(128)`);
    await queryRunner.query(`ALTER TABLE "conversations" ADD "last_message_at" timestamptz`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_last_message_at" ON "conversations" ("last_message_at")`);

    await queryRunner.query(`UPDATE "conversations" SET "status" = 'active' WHERE "status" IN ('waiting', 'paused')`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "waiting_since`);
    await queryRunner.query(`ALTER TABLE "conversations" RENAME COLUMN "close_reason" TO "closed_reason"`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "external_id"`);

    await queryRunner.query(`ALTER TABLE "tickets" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD "updated_by" uuid`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD "ticket_no" character varying(64)`);
    await queryRunner.query(`UPDATE "tickets" SET "ticket_no" = 'TK-' || "id"::text WHERE "ticket_no" IS NULL`);
    await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "ticket_no" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_tickets_ticket_no" ON "tickets" ("ticket_no")`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD "sla_due_at" timestamptz`);
    await queryRunner.query(`CREATE INDEX "IDX_tickets_sla_due_at" ON "tickets" ("sla_due_at")`);

    await queryRunner.query(`UPDATE "tickets" SET "status" = 'processing' WHERE "status" = 'in_progress'`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN IF EXISTS "description"`);
    await queryRunner.query(`ALTER TABLE "tickets" RENAME COLUMN "close_reason" TO "closed_reason"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN IF EXISTS "sla_response_at"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN IF EXISTS "sla_resolve_at"`);

    await queryRunner.query(`ALTER TABLE "tasks" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "notifications" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "channels" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "channels" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "organizations" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "organizations" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "departments" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "departments" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "users" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "roles" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "permissions" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "permissions" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "user_roles" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "user_roles" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "role_permissions" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "role_permissions" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "customer_contacts" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "customer_contacts" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "lead_follow_ups" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "lead_follow_ups" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "opportunity_stage_histories" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "opportunity_stage_histories" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "conversation_messages" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "conversation_messages" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "ticket_logs" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "ticket_logs" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "org_configs" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "org_configs" ADD "updated_by" uuid`);

    await queryRunner.query(`ALTER TABLE "ai_tasks" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "ai_tasks" ADD "updated_by" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "customer_id"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_customer_id"`);

    await queryRunner.query(`UPDATE "tickets" SET "status" = 'in_progress' WHERE "status" = 'processing'`);

    const tables = [
      'customers', 'leads', 'opportunities', 'conversations', 'tickets',
      'tasks', 'notifications', 'channels', 'organizations', 'departments',
      'users', 'roles', 'permissions', 'user_roles', 'role_permissions',
      'customer_contacts', 'lead_follow_ups', 'opportunity_stage_histories',
      'conversation_messages', 'ticket_logs', 'audit_logs', 'org_configs', 'ai_tasks',
    ];

    for (const table of tables) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "created_by"`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "updated_by"`);
    }

    await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "subject"`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "last_message_at"`);
    await queryRunner.query(`DROP INDEX "IDX_conversations_last_message_at"`);
    await queryRunner.query(`ALTER TABLE "conversations" RENAME COLUMN "closed_reason" TO "close_reason"`);

    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN IF EXISTS "ticket_no"`);
    await queryRunner.query(`DROP INDEX "IDX_tickets_ticket_no"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN IF EXISTS "sla_due_at"`);
    await queryRunner.query(`DROP INDEX "IDX_tickets_sla_due_at"`);
    await queryRunner.query(`ALTER TABLE "tickets" RENAME COLUMN "closed_reason" TO "close_reason"`);
  }
}
