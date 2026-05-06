import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiQuotaService } from "./api-quota.service";
import { ApiMonthlyQuota } from "./entities/api-monthly-quota.entity";
import { ApiProject } from "./entities/api-project.entity";
import { ApiModel } from "./entities/api-model.entity";
import { SetMonthlyQuotaDto, UpdateMonthlyQuotaDto } from "./dto/api-monthly-quota.dto";
import { NotFoundException } from "@nestjs/common";

function makeQuota(overrides: Partial<ApiMonthlyQuota> = {}): ApiMonthlyQuota {
  return {
    id: "uuid-q1", projectId: "uuid-p1", modelId: "uuid-m1",
    period: "2026-05", quotaUnit: "token", quotaLimit: 100000, quotaUsed: 20000,
    resetAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as ApiMonthlyQuota;
}

function makeProject(overrides: Partial<ApiProject> = {}): ApiProject {
  return { id: "uuid-p1", orgId: null, userId: null, name: "P", description: null, status: "active", defaultModelId: null, createdAt: new Date(), updatedAt: new Date(), ...overrides } as ApiProject;
}

function makeModel(overrides: Partial<ApiModel> = {}): ApiModel {
  return { id: "uuid-m1", name: "GPT-4", provider: "openai", modelId: "gpt-4", category: "text", pricingUnit: "token", unitLabel: null, description: null, status: "internal", maxInputTokens: null, maxOutputTokens: null, supportsStreaming: false, supportsVision: false, supportsFunctionCalling: false, createdAt: new Date(), updatedAt: new Date(), ...overrides } as ApiModel;
}

describe("ApiQuotaService", () => {
  let service: ApiQuotaService;
  let repo: jest.Mocked<Pick<Repository<ApiMonthlyQuota>, "create" | "save" | "findOne" | "find" | "remove">>;
  let projectRepo: jest.Mocked<Pick<Repository<ApiProject>, "findOne">>;
  let modelRepo: jest.Mocked<Pick<Repository<ApiModel>, "findOne" | "find">>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((d: any) => makeQuota(d)),
      save: jest.fn().mockImplementation((d: ApiMonthlyQuota) => Promise.resolve(d)),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };
    projectRepo = { findOne: jest.fn() };
    modelRepo = { findOne: jest.fn(), find: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiQuotaService,
        { provide: getRepositoryToken(ApiMonthlyQuota), useValue: repo },
        { provide: getRepositoryToken(ApiProject), useValue: projectRepo },
        { provide: getRepositoryToken(ApiModel), useValue: modelRepo },
      ],
    }).compile();
    service = module.get(ApiQuotaService);
  });

  it("1. 设置额度", async () => {
    projectRepo.findOne.mockResolvedValue(makeProject());
    modelRepo.findOne.mockResolvedValue(makeModel());
    repo.findOne.mockResolvedValue(null);
    const dto: SetMonthlyQuotaDto = { modelId: "uuid-m1", period: "2026-05", quotaLimit: 50000 };
    const r = await service.setQuota("uuid-p1", dto);
    expect(r.quotaLimit).toBe(50000);
    expect(r.quotaUsed).toBe(0);
    expect(r.period).toBe("2026-05");
  });

  it("2. 更新已有额度", async () => {
    projectRepo.findOne.mockResolvedValue(makeProject());
    modelRepo.findOne.mockResolvedValue(makeModel());
    repo.findOne.mockResolvedValue(makeQuota());
    const dto: SetMonthlyQuotaDto = { modelId: "uuid-m1", period: "2026-05", quotaLimit: 200000 };
    const r = await service.setQuota("uuid-p1", dto);
    expect(r.quotaLimit).toBe(200000);
  });

  it("3. 查询项目额度列表", async () => {
    repo.find.mockResolvedValue([makeQuota()]);
    modelRepo.find.mockResolvedValue([makeModel()]);
    const r = await service.findAll("uuid-p1", {});
    expect(r).toHaveLength(1);
    expect(r[0].quotaLimit).toBe(100000);
  });

  it("4. 追踪用量", async () => {
    repo.findOne.mockResolvedValue(makeQuota({ quotaUsed: 10000 }));
    const r = await service.trackUsage("uuid-p1", "uuid-m1", 5000);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(85000);
  });

  it("5. 追踪用量 - 超限", async () => {
    repo.findOne.mockResolvedValue(makeQuota({ quotaUsed: 95000 }));
    const r = await service.trackUsage("uuid-p1", "uuid-m1", 10000);
    expect(r.allowed).toBe(false);
  });

  it("6. 获取剩余额度", async () => {
    repo.findOne.mockResolvedValue(makeQuota());
    const r = await service.getRemaining("uuid-p1", "uuid-m1");
    expect(r.limit).toBe(100000);
    expect(r.used).toBe(20000);
    expect(r.remaining).toBe(80000);
  });

  it("7. 删除额度", async () => {
    repo.findOne.mockResolvedValue(makeQuota());
    await service.deleteQuota("uuid-q1", "uuid-p1");
    expect(repo.remove).toHaveBeenCalled();
  });

  it("8. 删除不存在的额度", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.deleteQuota("xxx", "uuid-p1")).rejects.toThrow(NotFoundException);
  });

  it("9. 项目不存在时设置额度", async () => {
    projectRepo.findOne.mockResolvedValue(null);
    const dto: SetMonthlyQuotaDto = { modelId: "uuid-m1", period: "2026-05", quotaLimit: 50000 };
    await expect(service.setQuota("xxx", dto)).rejects.toThrow(NotFoundException);
  });

  it("10. 额度百分比计算", async () => {
    repo.find.mockResolvedValue([makeQuota({ quotaLimit: 100000, quotaUsed: 25000 })]);
    modelRepo.find.mockResolvedValue([makeModel()]);
    const r = await service.findAll("uuid-p1", {});
    expect(r[0].usagePercent).toBe(25);
  });
});
