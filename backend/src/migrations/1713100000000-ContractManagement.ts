import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContractManagement1713100000000 implements MigrationInterface {
  name = 'ContractManagement1713100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE contracts (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        quote_id UUID NULL,
        opportunity_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        contract_no VARCHAR(32) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'draft',
        signed_at TIMESTAMPTZ NULL,
        starts_on DATE NULL,
        ends_on DATE NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1),
        CONSTRAINT chk_contracts_status CHECK (status IN ('draft','pending_approval','approved','rejected','signing','active','expired','terminated'))
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_contracts_org_no_live
      ON contracts(org_id, contract_no)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`CREATE INDEX idx_contracts_org_status ON contracts(org_id, status, updated_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_contracts_org_customer ON contracts(org_id, customer_id)`);
    await queryRunner.query(`CREATE INDEX idx_contracts_org_opportunity ON contracts(org_id, opportunity_id)`);
    await queryRunner.query(`CREATE INDEX idx_contracts_starts_on ON contracts(starts_on) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_contracts_ends_on ON contracts(ends_on) WHERE deleted_at IS NULL`);

    await queryRunner.query(`
      CREATE TABLE contract_approvals (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        approver_user_id UUID NULL,
        comment TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        CONSTRAINT chk_contract_approvals_status CHECK (status IN ('pending','approved','rejected'))
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_contract_approvals_org_contract ON contract_approvals(org_id, contract_id)`);

    await queryRunner.query(`
      CREATE TABLE contract_documents (
        id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
        file_url VARCHAR(255) NOT NULL,
        doc_type VARCHAR(32) NOT NULL,
        sign_provider VARCHAR(32) NULL,
        sign_status VARCHAR(16) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID NULL,
        updated_by UUID NULL,
        deleted_at TIMESTAMPTZ NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1 CHECK(version >= 1)
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_contract_documents_org_contract ON contract_documents(org_id, contract_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS contract_documents`);
    await queryRunner.query(`DROP TABLE IF EXISTS contract_approvals`);
    await queryRunner.query(`DROP TABLE IF EXISTS contracts`);
  }
}
