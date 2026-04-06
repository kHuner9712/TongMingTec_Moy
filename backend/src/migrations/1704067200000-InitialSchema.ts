import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704067200000 implements MigrationInterface {
  name = 'InitialSchema1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL DEFAULT gen_random_uuid(),
        code VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(128) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'provisioning',
        timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai',
        locale VARCHAR(16) NOT NULL DEFAULT 'zh-CN',
        logo_url VARCHAR(255),
        owner_user_id UUID,
        billing_email VARCHAR(128),
        onboard_stage VARCHAR(32) NOT NULL DEFAULT 'bootstrap_pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1
      );
      CREATE INDEX idx_organizations_code ON organizations(code);
      CREATE INDEX idx_organizations_name ON organizations(name);
      CREATE INDEX idx_organizations_status ON organizations(status);
      CREATE INDEX idx_organizations_onboard_stage ON organizations(onboard_stage);
    `);

    await queryRunner.query(`
      CREATE TABLE departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        parent_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        manager_user_id UUID,
        path VARCHAR(255) NOT NULL DEFAULT '/',
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_dept_parent FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL,
        CONSTRAINT fk_dept_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_departments_org_id ON departments(org_id);
      CREATE INDEX idx_departments_parent_id ON departments(parent_id);
      CREATE INDEX idx_departments_code ON departments(code);
      CREATE INDEX idx_departments_name ON departments(name);
      CREATE INDEX idx_departments_manager_user_id ON departments(manager_user_id);
      CREATE INDEX idx_departments_path ON departments(path);
      CREATE UNIQUE INDEX idx_departments_org_code ON departments(org_id, code);
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        department_id UUID,
        username VARCHAR(64) NOT NULL,
        display_name VARCHAR(64) NOT NULL,
        email VARCHAR(128),
        mobile VARCHAR(32),
        password_hash VARCHAR(255) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        locale VARCHAR(16) NOT NULL DEFAULT 'zh-CN',
        timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai',
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_user_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
        CONSTRAINT fk_user_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_users_org_id ON users(org_id);
      CREATE INDEX idx_users_department_id ON users(department_id);
      CREATE INDEX idx_users_username ON users(username);
      CREATE INDEX idx_users_display_name ON users(display_name);
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_mobile ON users(mobile);
      CREATE INDEX idx_users_status ON users(status);
      CREATE INDEX idx_users_last_login_at ON users(last_login_at);
      CREATE UNIQUE INDEX idx_users_org_username ON users(org_id, username);
    `);

    await queryRunner.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(64) NOT NULL,
        data_scope VARCHAR(16) NOT NULL DEFAULT 'self',
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        description VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_role_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_roles_org_id ON roles(org_id);
      CREATE INDEX idx_roles_code ON roles(code);
      CREATE INDEX idx_roles_data_scope ON roles(data_scope);
      CREATE INDEX idx_roles_is_default ON roles(is_default);
      CREATE UNIQUE INDEX idx_roles_org_code ON roles(org_id, code);
    `);

    await queryRunner.query(`
      CREATE TABLE permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        perm_id VARCHAR(64) NOT NULL,
        module VARCHAR(32) NOT NULL,
        action VARCHAR(64) NOT NULL,
        risk_level VARCHAR(8) NOT NULL DEFAULT 'P3',
        description VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID,
        CONSTRAINT fk_perm_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_permissions_org_id ON permissions(org_id);
      CREATE INDEX idx_permissions_perm_id ON permissions(perm_id);
      CREATE INDEX idx_permissions_module ON permissions(module);
      CREATE INDEX idx_permissions_risk_level ON permissions(risk_level);
      CREATE UNIQUE INDEX idx_permissions_org_perm_id ON permissions(org_id, perm_id);
    `);

    await queryRunner.query(`
      CREATE TABLE user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        user_id UUID NOT NULL,
        role_id UUID NOT NULL,
        source VARCHAR(16) NOT NULL DEFAULT 'manual',
        effective_from TIMESTAMPTZ,
        effective_to TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID,
        CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_role_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_user_roles_org_id ON user_roles(org_id);
      CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
      CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
      CREATE UNIQUE INDEX idx_user_roles_user_role ON user_roles(user_id, role_id);
    `);

    await queryRunner.query(`
      CREATE TABLE role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        role_id UUID NOT NULL,
        permission_id UUID NOT NULL,
        scope_override JSONB,
        granted_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID,
        CONSTRAINT fk_role_perm_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT fk_role_perm_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_role_perm_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_role_permissions_org_id ON role_permissions(org_id);
      CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
      CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
      CREATE UNIQUE INDEX idx_role_permissions_role_perm ON role_permissions(role_id, permission_id);
    `);

    await queryRunner.query(`
      CREATE TABLE customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        name VARCHAR(128) NOT NULL,
        industry VARCHAR(64),
        level VARCHAR(16),
        owner_user_id UUID NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'potential',
        phone VARCHAR(32),
        email VARCHAR(128),
        address VARCHAR(255),
        remark TEXT,
        last_contact_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_customer_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_customer_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT
      );
      CREATE INDEX idx_customers_org_id ON customers(org_id);
      CREATE INDEX idx_customers_name ON customers(name);
      CREATE INDEX idx_customers_industry ON customers(industry);
      CREATE INDEX idx_customers_level ON customers(level);
      CREATE INDEX idx_customers_owner_user_id ON customers(owner_user_id);
      CREATE INDEX idx_customers_status ON customers(status);
      CREATE INDEX idx_customers_phone ON customers(phone);
      CREATE INDEX idx_customers_email ON customers(email);
      CREATE INDEX idx_customers_last_contact_at ON customers(last_contact_at);
    `);

    await queryRunner.query(`
      CREATE TABLE customer_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        name VARCHAR(64) NOT NULL,
        title VARCHAR(64),
        phone VARCHAR(32),
        email VARCHAR(128),
        wechat VARCHAR(64),
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_customer_contact_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        CONSTRAINT fk_customer_contact_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_customer_contacts_org_id ON customer_contacts(org_id);
      CREATE INDEX idx_customer_contacts_customer_id ON customer_contacts(customer_id);
      CREATE INDEX idx_customer_contacts_name ON customer_contacts(name);
      CREATE INDEX idx_customer_contacts_phone ON customer_contacts(phone);
      CREATE INDEX idx_customer_contacts_email ON customer_contacts(email);
      CREATE INDEX idx_customer_contacts_is_primary ON customer_contacts(is_primary);
    `);

    await queryRunner.query(`
      CREATE TABLE leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        source VARCHAR(32) NOT NULL DEFAULT 'manual',
        name VARCHAR(128) NOT NULL,
        mobile VARCHAR(32),
        email VARCHAR(128),
        company_name VARCHAR(128),
        owner_user_id UUID,
        status VARCHAR(16) NOT NULL DEFAULT 'new',
        score NUMERIC(6,2),
        score_reason TEXT,
        last_follow_up_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_lead_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_lead_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX idx_leads_org_id ON leads(org_id);
      CREATE INDEX idx_leads_source ON leads(source);
      CREATE INDEX idx_leads_name ON leads(name);
      CREATE INDEX idx_leads_mobile ON leads(mobile);
      CREATE INDEX idx_leads_email ON leads(email);
      CREATE INDEX idx_leads_company_name ON leads(company_name);
      CREATE INDEX idx_leads_owner_user_id ON leads(owner_user_id);
      CREATE INDEX idx_leads_status ON leads(status);
      CREATE INDEX idx_leads_score ON leads(score);
      CREATE INDEX idx_leads_last_follow_up_at ON leads(last_follow_up_at);
    `);

    await queryRunner.query(`
      CREATE TABLE lead_follow_ups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        lead_id UUID NOT NULL,
        follow_type VARCHAR(32) NOT NULL DEFAULT 'manual',
        content TEXT NOT NULL,
        result VARCHAR(32),
        next_action_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID,
        CONSTRAINT fk_lead_follow_up_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        CONSTRAINT fk_lead_follow_up_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_lead_follow_ups_org_id ON lead_follow_ups(org_id);
      CREATE INDEX idx_lead_follow_ups_lead_id ON lead_follow_ups(lead_id);
      CREATE INDEX idx_lead_follow_ups_follow_type ON lead_follow_ups(follow_type);
      CREATE INDEX idx_lead_follow_ups_next_action_at ON lead_follow_ups(next_action_at);
    `);

    await queryRunner.query(`
      CREATE TABLE opportunities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        lead_id UUID,
        owner_user_id UUID NOT NULL,
        name VARCHAR(128) NOT NULL,
        amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
        stage VARCHAR(32) NOT NULL DEFAULT 'discovery',
        result VARCHAR(8),
        expected_close_date DATE,
        pause_reason VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_opportunity_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
        CONSTRAINT fk_opportunity_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
        CONSTRAINT fk_opportunity_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT fk_opportunity_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_opportunities_org_id ON opportunities(org_id);
      CREATE INDEX idx_opportunities_customer_id ON opportunities(customer_id);
      CREATE INDEX idx_opportunities_lead_id ON opportunities(lead_id);
      CREATE INDEX idx_opportunities_owner_user_id ON opportunities(owner_user_id);
      CREATE INDEX idx_opportunities_name ON opportunities(name);
      CREATE INDEX idx_opportunities_amount ON opportunities(amount);
      CREATE INDEX idx_opportunities_stage ON opportunities(stage);
      CREATE INDEX idx_opportunities_result ON opportunities(result);
      CREATE INDEX idx_opportunities_expected_close_date ON opportunities(expected_close_date);
    `);

    await queryRunner.query(`
      CREATE TABLE opportunity_stage_histories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        opportunity_id UUID NOT NULL,
        from_stage VARCHAR(32),
        to_stage VARCHAR(32) NOT NULL,
        result_after VARCHAR(8),
        change_reason VARCHAR(255),
        changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID,
        CONSTRAINT fk_opp_stage_history_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
        CONSTRAINT fk_opp_stage_history_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_opportunity_stage_histories_org_id ON opportunity_stage_histories(org_id);
      CREATE INDEX idx_opportunity_stage_histories_opportunity_id ON opportunity_stage_histories(opportunity_id);
      CREATE INDEX idx_opportunity_stage_histories_changed_at ON opportunity_stage_histories(changed_at);
    `);

    await queryRunner.query(`
      CREATE TABLE channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        channel_type VARCHAR(32) NOT NULL,
        config_json JSONB NOT NULL DEFAULT '{}',
        status VARCHAR(16) NOT NULL DEFAULT 'inactive',
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_channel_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_channels_org_id ON channels(org_id);
      CREATE INDEX idx_channels_code ON channels(code);
      CREATE INDEX idx_channels_channel_type ON channels(channel_type);
      CREATE INDEX idx_channels_status ON channels(status);
      CREATE UNIQUE INDEX idx_channels_org_code ON channels(org_id, code);
    `);

    await queryRunner.query(`
      CREATE TABLE conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        channel_id UUID NOT NULL,
        customer_id UUID,
        external_id VARCHAR(128),
        assignee_user_id UUID,
        status VARCHAR(16) NOT NULL DEFAULT 'queued',
        waiting_since TIMESTAMPTZ,
        first_response_at TIMESTAMPTZ,
        closed_at TIMESTAMPTZ,
        close_reason VARCHAR(32),
        rating_score INT,
        rating_comment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_conversation_channel FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE RESTRICT,
        CONSTRAINT fk_conversation_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        CONSTRAINT fk_conversation_assignee FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_conversation_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_conversations_org_id ON conversations(org_id);
      CREATE INDEX idx_conversations_channel_id ON conversations(channel_id);
      CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
      CREATE INDEX idx_conversations_external_id ON conversations(external_id);
      CREATE INDEX idx_conversations_assignee_user_id ON conversations(assignee_user_id);
      CREATE INDEX idx_conversations_status ON conversations(status);
      CREATE INDEX idx_conversations_waiting_since ON conversations(waiting_since);
    `);

    await queryRunner.query(`
      CREATE TABLE conversation_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        conversation_id UUID NOT NULL,
        message_type VARCHAR(16) NOT NULL,
        direction VARCHAR(16) NOT NULL,
        sender_type VARCHAR(16) NOT NULL,
        sender_id UUID,
        content TEXT NOT NULL,
        attachments JSONB DEFAULT '[]',
        external_id VARCHAR(128),
        sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID,
        CONSTRAINT fk_conversation_message_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        CONSTRAINT fk_conversation_message_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_conversation_messages_org_id ON conversation_messages(org_id);
      CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
      CREATE INDEX idx_conversation_messages_message_type ON conversation_messages(message_type);
      CREATE INDEX idx_conversation_messages_direction ON conversation_messages(direction);
      CREATE INDEX idx_conversation_messages_sender_type ON conversation_messages(sender_type);
      CREATE INDEX idx_conversation_messages_sender_id ON conversation_messages(sender_id);
      CREATE INDEX idx_conversation_messages_sent_at ON conversation_messages(sent_at);
    `);

    await queryRunner.query(`
      CREATE TABLE tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        conversation_id UUID,
        customer_id UUID,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(16) NOT NULL DEFAULT 'normal',
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        assignee_user_id UUID,
        solution TEXT,
        close_reason VARCHAR(32),
        sla_response_at TIMESTAMPTZ,
        sla_resolve_at TIMESTAMPTZ,
        first_response_at TIMESTAMPTZ,
        resolved_at TIMESTAMPTZ,
        closed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_ticket_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
        CONSTRAINT fk_ticket_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        CONSTRAINT fk_ticket_assignee FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_ticket_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_tickets_org_id ON tickets(org_id);
      CREATE INDEX idx_tickets_conversation_id ON tickets(conversation_id);
      CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
      CREATE INDEX idx_tickets_priority ON tickets(priority);
      CREATE INDEX idx_tickets_status ON tickets(status);
      CREATE INDEX idx_tickets_assignee_user_id ON tickets(assignee_user_id);
      CREATE INDEX idx_tickets_sla_response_at ON tickets(sla_response_at);
      CREATE INDEX idx_tickets_sla_resolve_at ON tickets(sla_resolve_at);
    `);

    await queryRunner.query(`
      CREATE TABLE ticket_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        ticket_id UUID NOT NULL,
        action VARCHAR(32) NOT NULL,
        from_status VARCHAR(16),
        to_status VARCHAR(16),
        operator_user_id UUID,
        remark TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_ticket_log_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        CONSTRAINT fk_ticket_log_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_ticket_logs_org_id ON ticket_logs(org_id);
      CREATE INDEX idx_ticket_logs_ticket_id ON ticket_logs(ticket_id);
      CREATE INDEX idx_ticket_logs_action ON ticket_logs(action);
      CREATE INDEX idx_ticket_logs_operator_user_id ON ticket_logs(operator_user_id);
    `);

    await queryRunner.query(`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assignee_user_id UUID,
        source_type VARCHAR(32),
        source_id UUID,
        due_at TIMESTAMPTZ,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_task_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_tasks_org_id ON tasks(org_id);
      CREATE INDEX idx_tasks_assignee_user_id ON tasks(assignee_user_id);
      CREATE INDEX idx_tasks_source_type ON tasks(source_type);
      CREATE INDEX idx_tasks_source_id ON tasks(source_id);
      CREATE INDEX idx_tasks_due_at ON tasks(due_at);
      CREATE INDEX idx_tasks_status ON tasks(status);
    `);

    await queryRunner.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        user_id UUID NOT NULL,
        notification_type VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        source_type VARCHAR(32),
        source_id UUID,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_notification_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_notifications_org_id ON notifications(org_id);
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_notification_type ON notifications(notification_type);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX idx_notifications_created_at ON notifications(created_at);
    `);

    await queryRunner.query(`
      CREATE TABLE ai_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        task_type VARCHAR(32) NOT NULL,
        input_payload JSONB NOT NULL,
        output_payload JSONB,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        error_message TEXT,
        conversation_id UUID,
        message_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID,
        CONSTRAINT fk_ai_task_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
        CONSTRAINT fk_ai_task_message FOREIGN KEY (message_id) REFERENCES conversation_messages(id) ON DELETE SET NULL,
        CONSTRAINT fk_ai_task_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_ai_tasks_org_id ON ai_tasks(org_id);
      CREATE INDEX idx_ai_tasks_task_type ON ai_tasks(task_type);
      CREATE INDEX idx_ai_tasks_status ON ai_tasks(status);
      CREATE INDEX idx_ai_tasks_conversation_id ON ai_tasks(conversation_id);
      CREATE INDEX idx_ai_tasks_created_at ON ai_tasks(created_at);
    `);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        user_id UUID,
        action VARCHAR(64) NOT NULL,
        resource_type VARCHAR(32) NOT NULL,
        resource_id UUID,
        before_snapshot JSONB,
        after_snapshot JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_audit_log_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
      CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
      CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
      CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
    `);

    await queryRunner.query(`
      CREATE TABLE org_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        config_key VARCHAR(64) NOT NULL,
        config_value JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_org_config_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_org_configs_org_id ON org_configs(org_id);
      CREATE UNIQUE INDEX idx_org_configs_org_key ON org_configs(org_id, config_key);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS org_configs`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS ticket_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS tickets`);
    await queryRunner.query(`DROP TABLE IF EXISTS conversation_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS conversations`);
    await queryRunner.query(`DROP TABLE IF EXISTS channels`);
    await queryRunner.query(`DROP TABLE IF EXISTS opportunity_stage_histories`);
    await queryRunner.query(`DROP TABLE IF EXISTS opportunities`);
    await queryRunner.query(`DROP TABLE IF EXISTS lead_follow_ups`);
    await queryRunner.query(`DROP TABLE IF EXISTS leads`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_contacts`);
    await queryRunner.query(`DROP TABLE IF EXISTS customers`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS departments`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations`);
  }
}
