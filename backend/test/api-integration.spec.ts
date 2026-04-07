import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { Lead, LeadStatus } from '../modules/lm/entities/lead.entity';
import { Opportunity, OpportunityStage, OpportunityResult } from '../modules/om/entities/opportunity.entity';
import { Customer } from '../modules/cm/entities/customer.entity';
import { Conversation } from '../modules/cnv/entities/conversation.entity';
import { Ticket, TicketStatus, TicketPriority } from '../modules/tk/entities/ticket.entity';

describe('API 集成测试', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let orgId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Lead, Opportunity, Customer, Conversation, Ticket],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.synchronize(true);

    orgId = 'test-org-uuid';
    userId = 'test-user-uuid';
    authToken = 'Bearer test-token';
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    const repositories = [
      dataSource.getRepository(Lead),
      dataSource.getRepository(Opportunity),
      dataSource.getRepository(Customer),
      dataSource.getRepository(Conversation),
      dataSource.getRepository(Ticket),
    ];
    for (const repo of repositories) {
      await repo.clear();
    }
  });

  describe('Lead API 集成测试', () => {
    it('POST /leads - 创建线索', async () => {
      const response = await request(app.getHttpServer())
        .post('/leads')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({
          name: '集成测试线索',
          mobile: '13800138000',
          email: 'test@example.com',
          companyName: '测试公司',
          source: 'manual',
        })
        .expect(201);

      expect(response.body.name).toBe('集成测试线索');
      expect(response.body.status).toBe(LeadStatus.NEW);
    });

    it('GET /leads - 获取线索列表', async () => {
      const leadRepo = dataSource.getRepository(Lead);
      await leadRepo.save({
        orgId,
        name: '测试线索1',
        mobile: '13800138001',
        status: LeadStatus.NEW,
        source: 'manual',
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/leads')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
    });

    it('POST /leads/:id/assign - 分配线索', async () => {
      const leadRepo = dataSource.getRepository(Lead);
      const lead = await leadRepo.save({
        orgId,
        name: '待分配线索',
        mobile: '13800138002',
        status: LeadStatus.NEW,
        source: 'manual',
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .post(`/leads/${lead.id}/assign`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({ ownerUserId: userId, version: 1 })
        .expect(200);

      expect(response.body.status).toBe(LeadStatus.ASSIGNED);
    });

    it('POST /leads/:id/follow-up - 添加跟进记录', async () => {
      const leadRepo = dataSource.getRepository(Lead);
      const lead = await leadRepo.save({
        orgId,
        name: '待跟进线索',
        mobile: '13800138003',
        status: LeadStatus.ASSIGNED,
        source: 'manual',
        ownerUserId: userId,
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .post(`/leads/${lead.id}/follow-up`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({
          content: '集成测试跟进',
          followType: 'call',
          version: 1,
        })
        .expect(201);

      expect(response.body).toBeDefined();
    });

    it('POST /leads/:id/convert - 转化线索为商机', async () => {
      const leadRepo = dataSource.getRepository(Lead);
      const lead = await leadRepo.save({
        orgId,
        name: '待转化线索',
        mobile: '13800138004',
        status: LeadStatus.FOLLOWING,
        source: 'manual',
        ownerUserId: userId,
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .post(`/leads/${lead.id}/convert`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({ version: 1 })
        .expect(200);

      expect(response.body.leadId).toBe(lead.id);
    });
  });

  describe('Opportunity API 集成测试', () => {
    it('POST /opportunities - 创建商机', async () => {
      const customerRepo = dataSource.getRepository(Customer);
      const customer = await customerRepo.save({
        orgId,
        name: '测试客户',
        type: 'enterprise',
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({
          name: '集成测试商机',
          customerId: customer.id,
          amount: 100000,
          currency: 'CNY',
          stage: OpportunityStage.DISCOVERY,
          expectedCloseDate: '2024-12-31',
        })
        .expect(201);

      expect(response.body.name).toBe('集成测试商机');
      expect(response.body.stage).toBe(OpportunityStage.DISCOVERY);
    });

    it('GET /opportunities - 获取商机列表', async () => {
      const oppRepo = dataSource.getRepository(Opportunity);
      await oppRepo.save({
        orgId,
        name: '测试商机1',
        customerId: 'test-customer-id',
        customerName: '测试客户',
        ownerUserId: userId,
        ownerUserName: '测试用户',
        amount: 100000,
        currency: 'CNY',
        stage: OpportunityStage.DISCOVERY,
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/opportunities')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
    });

    it('GET /opportunities/summary - 获取商机汇总', async () => {
      const oppRepo = dataSource.getRepository(Opportunity);
      await oppRepo.save([
        {
          orgId,
          name: '商机1',
          customerId: 'customer-1',
          customerName: '客户1',
          ownerUserId: userId,
          ownerUserName: '用户1',
          amount: 100000,
          currency: 'CNY',
          stage: OpportunityStage.DISCOVERY,
          version: 1,
        },
        {
          orgId,
          name: '商机2',
          customerId: 'customer-2',
          customerName: '客户2',
          ownerUserId: userId,
          ownerUserName: '用户2',
          amount: 200000,
          currency: 'CNY',
          stage: OpportunityStage.NEGOTIATION,
          result: OpportunityResult.WON,
          version: 1,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/opportunities/summary')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.totalAmount).toBe(200000);
      expect(response.body.byResult.won).toBe(1);
    });

    it('POST /opportunities/:id/change-stage - 推进商机阶段', async () => {
      const oppRepo = dataSource.getRepository(Opportunity);
      const opp = await oppRepo.save({
        orgId,
        name: '待推进商机',
        customerId: 'test-customer-id',
        customerName: '测试客户',
        ownerUserId: userId,
        ownerUserName: '测试用户',
        amount: 100000,
        currency: 'CNY',
        stage: OpportunityStage.DISCOVERY,
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .post(`/opportunities/${opp.id}/change-stage`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({
          newStage: OpportunityStage.QUALIFICATION,
          version: 1,
        })
        .expect(200);

      expect(response.body.stage).toBe(OpportunityStage.QUALIFICATION);
      expect(response.body.version).toBe(2);
    });

    it('POST /opportunities/:id/mark-result - 标记商机结果', async () => {
      const oppRepo = dataSource.getRepository(Opportunity);
      const opp = await oppRepo.save({
        orgId,
        name: '待标记商机',
        customerId: 'test-customer-id',
        customerName: '测试客户',
        ownerUserId: userId,
        ownerUserName: '测试用户',
        amount: 100000,
        currency: 'CNY',
        stage: OpportunityStage.NEGOTIATION,
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .post(`/opportunities/${opp.id}/mark-result`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({
          result: OpportunityResult.WON,
          version: 1,
        })
        .expect(200);

      expect(response.body.result).toBe(OpportunityResult.WON);
    });
  });

  describe('Conversation API 集成测试', () => {
    it('GET /conversations - 获取会话列表', async () => {
      const convRepo = dataSource.getRepository(Conversation);
      await convRepo.save({
        orgId,
        customerId: 'test-customer-id',
        customerName: '测试客户',
        channel: 'web',
        status: 'active',
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/conversations')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.items).toHaveLength(1);
    });
  });

  describe('Ticket API 集成测试', () => {
    it('POST /tickets - 创建工单', async () => {
      const response = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({
          title: '集成测试工单',
          description: '工单描述',
          priority: TicketPriority.HIGH,
          customerId: 'test-customer-id',
        })
        .expect(201);

      expect(response.body.title).toBe('集成测试工单');
      expect(response.body.status).toBe(TicketStatus.PENDING);
    });

    it('GET /tickets - 获取工单列表', async () => {
      const ticketRepo = dataSource.getRepository(Ticket);
      await ticketRepo.save({
        orgId,
        title: '测试工单1',
        description: '描述',
        status: TicketStatus.PENDING,
        priority: TicketPriority.MEDIUM,
        customerId: 'test-customer-id',
        customerName: '测试客户',
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/tickets')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.items).toHaveLength(1);
    });
  });

  describe('版本冲突测试', () => {
    it('商机版本冲突返回 409', async () => {
      const oppRepo = dataSource.getRepository(Opportunity);
      const opp = await oppRepo.save({
        orgId,
        name: '版本冲突测试商机',
        customerId: 'test-customer-id',
        customerName: '测试客户',
        ownerUserId: userId,
        ownerUserName: '测试用户',
        amount: 100000,
        currency: 'CNY',
        stage: OpportunityStage.DISCOVERY,
        version: 2,
      });

      await request(app.getHttpServer())
        .post(`/opportunities/${opp.id}/change-stage`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({
          newStage: OpportunityStage.QUALIFICATION,
          version: 1,
        })
        .expect(409);
    });

    it('线索版本冲突返回 409', async () => {
      const leadRepo = dataSource.getRepository(Lead);
      const lead = await leadRepo.save({
        orgId,
        name: '版本冲突测试线索',
        mobile: '13800138099',
        status: LeadStatus.NEW,
        source: 'manual',
        version: 2,
      });

      await request(app.getHttpServer())
        .post(`/leads/${lead.id}/assign`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({ ownerUserId: userId, version: 1 })
        .expect(409);
    });
  });

  describe('多租户隔离测试', () => {
    it('不同租户数据隔离', async () => {
      const leadRepo = dataSource.getRepository(Lead);
      await leadRepo.save([
        {
          orgId: 'org-1',
          name: '租户1线索',
          mobile: '13800138001',
          status: LeadStatus.NEW,
          source: 'manual',
          version: 1,
        },
        {
          orgId: 'org-2',
          name: '租户2线索',
          mobile: '13800138002',
          status: LeadStatus.NEW,
          source: 'manual',
          version: 1,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/leads')
        .set('Authorization', authToken)
        .set('x-org-id', 'org-1')
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].name).toBe('租户1线索');
    });
  });
});
