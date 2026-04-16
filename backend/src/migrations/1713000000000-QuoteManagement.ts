import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuoteManagement1713000000000 implements MigrationInterface {
  name = 'QuoteManagement1713000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE quotes (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        opportunity_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        quote_no VARCHAR(32) NOT NULL,
        current_version_no INT NOT NULL DEFAULT 1,
        currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
        amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        status VARCHAR(16) NOT NULL DEFAULT 'draft',
        valid_until DATE NULL,
        sent_at TIMESTAMPTZ NULL,
        accepted_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
        CONSTRAINT chk_quotes_status CHECK (status IN ('draft','pending_approval','approved','sent','accepted','rejected','expired'))
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_quotes_org_no_live
      ON quotes(org_id, quote_no)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`CREATE INDEX idx_quotes_org_status ON quotes(org_id, status, updated_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_quotes_org_opportunity ON quotes(org_id, opportunity_id)`);
    await queryRunner.query(`CREATE INDEX idx_quotes_org_customer ON quotes(org_id, customer_id)`);
    await queryRunner.query(`CREATE INDEX idx_quotes_valid_until ON quotes(valid_until) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_quotes_sent_at ON quotes(sent_at) WHERE sent_at IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX idx_quotes_accepted_at ON quotes(accepted_at) WHERE accepted_at IS NOT NULL`);

    await queryRunner.query(`
      CREATE TABLE quote_versions (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE ON UPDATE CASCADE,
        version_no INT NOT NULL,
        payload JSONB NOT NULL,
        total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        CONSTRAINT uq_quote_versions_org_quote_ver UNIQUE (org_id, quote_id, version_no)
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_quote_versions_org_quote ON quote_versions(org_id, quote_id, version_no DESC)`);

    await queryRunner.query(`
      CREATE TABLE quote_approvals (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE ON UPDATE CASCADE,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        approver_user_id UUID NULL,
        comment TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        CONSTRAINT chk_quote_approvals_status CHECK (status IN ('pending','approved','rejected'))
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_quote_approvals_org_quote ON quote_approvals(org_id, quote_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS quote_approvals`);
    await queryRunner.query(`DROP TABLE IF EXISTS quote_versions`);
    await queryRunner.query(`DROP TABLE IF EXISTS quotes`);
  }
}
