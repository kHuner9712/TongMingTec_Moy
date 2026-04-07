import { performance } from 'perf_hooks';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { Lead, LeadStatus } from '../modules/lm/entities/lead.entity';
import { Opportunity, OpportunityStage } from '../modules/om/entities/opportunity.entity';
import { Customer } from '../modules/cm/entities/customer.entity';

describe('性能测试', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let orgId: string;
  let userId: string;

  const PERFORMANCE_THRESHOLDS = {
    LIST_QUERY_MS: 500,
    DETAIL_QUERY_MS: 200,
    CREATE_OPERATION_MS: 300,
    UPDATE_OPERATION_MS: 300,
    BATCH_SIZE: 100,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Lead, Opportunity, Customer],
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

    orgId = 'perf-test-org';
    userId = 'perf-test-user';
    authToken = 'Bearer test-token';
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.getRepository(Lead).clear();
    await dataSource.getRepository(Opportunity).clear();
    await dataSource.getRepository(Customer).clear();
  });

  describe('线索列表查询性能', () => {
    it('100条线索列表查询应在500ms内完成', async () => {
      const leadRepo = dataSource.getRepository(Lead);
      const leads = Array.from({ length: 100 }, (_, i) => ({
        orgId,
        name: `性能测试线索${i}`,
        mobile: `1380013${String(i).padStart(4, '0')}`,
        status: LeadStatus.NEW,
        source: 'manual',
        version: 1,
      }));
      await leadRepo.save(leads);

      const start = performance.now();
      await request(app.getHttpServer())
        .get('/leads')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .query({ page: 1, pageSize: 20 })
        .expect(200);
      const duration = performance.now() - start;

      console.log(`线索列表查询耗时: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LIST_QUERY_MS);
    });

    it('1000条线索分页查询应在500ms内完成', async () => {
      const leadRepo = dataSource.getRepository(Lead);
      const leads = Array.from({ length: 1000 }, (_, i) => ({
        orgId,
        name: `性能测试线索${i}`,
        mobile: `1390013${String(i).padStart(4, '0')}`,
        status: LeadStatus.NEW,
        source: 'manual',
        version: 1,
      }));
      await leadRepo.save(leads);

      const start = performance.now();
      await request(app.getHttpServer())
        .get('/leads')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .query({ page: 1, pageSize: 20 })
        .expect(200);
      const duration = performance.now() - start;

      console.log(`1000条线索分页查询耗时: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LIST_QUERY_MS);
    });
  });

  describe('商机汇总查询性能', () => {
    it('商机汇总统计应在500ms内完成', async () => {
      const oppRepo = dataSource.getRepository(Opportunity);
      const opps = Array.from({ length: 100 }, (_, i) => ({
        orgId,
        name: `性能测试商机${i}`,
        customerId: `customer-${i}`,
        customerName: `客户${i}`,
        ownerUserId: userId,
        ownerUserName: '测试用户',
        amount: 100000 + i * 1000,
        currency: 'CNY',
        stage: [OpportunityStage.DISCOVERY, OpportunityStage.QUALIFICATION, OpportunityStage.NEGOTIATION][i % 3],
        version: 1,
      }));
      await oppRepo.save(opps);

      const start = performance.now();
      await request(app.getHttpServer())
        .get('/opportunities/summary')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .expect(200);
      const duration = performance.now() - start;

      console.log(`商机汇总统计耗时: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LIST_QUERY_MS);
    });
  });

  describe('创建操作性能', () => {
    it('创建线索应在300ms内完成', async () => {
      const start = performance.now();
      await request(app.getHttpServer())
        .post('/leads')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({
          name: '性能测试新线索',
          mobile: '13700137000',
          email: 'perf@example.com',
          companyName: '性能测试公司',
          source: 'manual',
        })
        .expect(201);
      const duration = performance.now() - start;

      console.log(`创建线索耗时: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CREATE_OPERATION_MS);
    });

    it('创建商机应在300ms内完成', async () => {
      const customerRepo = dataSource.getRepository(Customer);
      const customer = await customerRepo.save({
        orgId,
        name: '性能测试客户',
        type: 'enterprise',
        version: 1,
      });

      const start = performance.now();
      await request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({
          name: '性能测试新商机',
          customerId: customer.id,
          amount: 500000,
          currency: 'CNY',
          stage: OpportunityStage.DISCOVERY,
          expectedCloseDate: '2024-12-31',
        })
        .expect(201);
      const duration = performance.now() - start;

      console.log(`创建商机耗时: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CREATE_OPERATION_MS);
    });
  });

  describe('更新操作性能', () => {
    it('线索分配应在300ms内完成', async () => {
      const leadRepo = dataSource.getRepository(Lead);
      const lead = await leadRepo.save({
        orgId,
        name: '待分配性能测试线索',
        mobile: '13600136000',
        status: LeadStatus.NEW,
        source: 'manual',
        version: 1,
      });

      const start = performance.now();
      await request(app.getHttpServer())
        .post(`/leads/${lead.id}/assign`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({ ownerUserId: userId, version: 1 })
        .expect(200);
      const duration = performance.now() - start;

      console.log(`线索分配耗时: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.UPDATE_OPERATION_MS);
    });

    it('商机阶段推进应在300ms内完成', async () => {
      const oppRepo = dataSource.getRepository(Opportunity);
      const opp = await oppRepo.save({
        orgId,
        name: '待推进性能测试商机',
        customerId: 'perf-customer',
        customerName: '性能测试客户',
        ownerUserId: userId,
        ownerUserName: '测试用户',
        amount: 100000,
        currency: 'CNY',
        stage: OpportunityStage.DISCOVERY,
        version: 1,
      });

      const start = performance.now();
      await request(app.getHttpServer())
        .post(`/opportunities/${opp.id}/change-stage`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .send({
          newStage: OpportunityStage.QUALIFICATION,
          version: 1,
        })
        .expect(200);
      const duration = performance.now() - start;

      console.log(`商机阶段推进耗时: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.UPDATE_OPERATION_MS);
    });
  });

  describe('并发操作性能', () => {
    it('并发创建10个线索应全部成功', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/leads')
          .set('Authorization', authToken)
          .set('x-org-id', orgId)
          .send({
            name: `并发测试线索${i}`,
            mobile: `1350013${String(i).padStart(4, '0')}`,
            email: `concurrent${i}@example.com`,
            companyName: '并发测试公司',
            source: 'manual',
          }),
      );

      const start = performance.now();
      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      results.forEach((result) => {
        expect(result.status).toBe(201);
      });

      console.log(`并发创建10个线索耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('详情查询性能', () => {
    it('线索详情查询应在200ms内完成', async () => {
      const leadRepo = dataSource.getRepository(Lead);
      const lead = await leadRepo.save({
        orgId,
        name: '详情查询性能测试线索',
        mobile: '13400134000',
        status: LeadStatus.FOLLOWING,
        source: 'manual',
        ownerUserId: userId,
        version: 1,
      });

      const start = performance.now();
      await request(app.getHttpServer())
        .get(`/leads/${lead.id}`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .expect(200);
      const duration = performance.now() - start;

      console.log(`线索详情查询耗时: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DETAIL_QUERY_MS);
    });

    it('商机详情查询应在200ms内完成', async () => {
      const oppRepo = dataSource.getRepository(Opportunity);
      const opp = await oppRepo.save({
        orgId,
        name: '详情查询性能测试商机',
        customerId: 'detail-customer',
        customerName: '详情测试客户',
        ownerUserId: userId,
        ownerUserName: '测试用户',
        amount: 100000,
        currency: 'CNY',
        stage: OpportunityStage.QUALIFICATION,
        version: 1,
      });

      const start = performance.now();
      await request(app.getHttpServer())
        .get(`/opportunities/${opp.id}`)
        .set('Authorization', authToken)
        .set('x-org-id', orgId)
        .expect(200);
      const duration = performance.now() - start;

      console.log(`商机详情查询耗时: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DETAIL_QUERY_MS);
    });
  });
});
