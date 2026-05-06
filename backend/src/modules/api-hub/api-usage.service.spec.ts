import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiUsageService } from "./api-usage.service";
import { ApiUsageRecord } from "./entities/api-usage-record.entity";
import { ApiModel } from "./entities/api-model.entity";
import { CreateUsageRecordDto } from "./dto/api-usage-record.dto";
import { NotFoundException } from "@nestjs/common";

function makeRecord(overrides: Partial<ApiUsageRecord> = {}): ApiUsageRecord {
  return {
    id: "uuid-r1", projectId: "uuid-p1", keyId: "uuid-k1", modelId: "uuid-m1",
    requestId: null, inputTokens: 100, outputTokens: 50, totalTokens: 150,
    cost: 0.003, status: "success", errorMessage: null,
    createdAt: new Date(),
    ...overrides,
  } as ApiUsageRecord;
}

function makeModel(overrides: Partial<ApiModel> = {}): ApiModel {
  return { id: "uuid-m1", name: "GPT-4", provider: "openai", modelId: "gpt-4", category: "text", pricingUnit: "token", unitLabel: null, description: null, status: "internal", maxInputTokens: null, maxOutputTokens: null, supportsStreaming: false, supportsVision: false, supportsFunctionCalling: false, createdAt: new Date(), updatedAt: new Date(), ...overrides } as ApiModel;
}

describe("ApiUsageService", () => {
  let service: ApiUsageService;
  let repo: jest.Mocked<Pick<Repository<ApiUsageRecord>, "create" | "save" | "findOne" | "findAndCount" | "find">>;
  let modelRepo: jest.Mocked<Pick<Repository<ApiModel>, "findByIds">>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((d: any) => makeRecord(d)),
      save: jest.fn().mockImplementation((d: ApiUsageRecord) => Promise.resolve(d)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
    };
    modelRepo = { findByIds: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiUsageService,
        { provide: getRepositoryToken(ApiUsageRecord), useValue: repo },
        { provide: getRepositoryToken(ApiModel), useValue: modelRepo },
      ],
    }).compile();
    service = module.get(ApiUsageService);
  });

  it("1. 记录用量", async () => {
    const dto: CreateUsageRecordDto = { keyId: "uuid-k1", modelId: "uuid-m1", inputTokens: 200, outputTokens: 100, totalTokens: 300, cost: 0.006 };
    const r = await service.record("uuid-p1", dto);
    expect(r.inputTokens).toBe(200);
    expect(r.outputTokens).toBe(100);
    expect(r.totalTokens).toBe(300);
    expect(r.status).toBe("success");
  });

  it("2. 记录失败调用", async () => {
    const dto: CreateUsageRecordDto = { keyId: "uuid-k1", modelId: "uuid-m1", inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0, status: "error", errorMessage: "超时" };
    const r = await service.record("uuid-p1", dto);
    expect(r.status).toBe("error");
    expect(r.errorMessage).toBe("超时");
  });

  it("3. 查询用量列表", async () => {
    repo.findAndCount.mockResolvedValue([[makeRecord()], 1]);
    const r = await service.findAll("uuid-p1", {});
    expect(r.data).toHaveLength(1);
  });

  it("4. 按时间范围查询", async () => {
    repo.findAndCount.mockResolvedValue([[makeRecord()], 1]);
    const r = await service.findAll("uuid-p1", { startDate: "2026-05-01", endDate: "2026-05-31" });
    expect(r.data).toHaveLength(1);
  });

  it("5. 查询详情", async () => {
    repo.findOne.mockResolvedValue(makeRecord());
    const r = await service.findById("uuid-r1", "uuid-p1");
    expect(r.projectId).toBe("uuid-p1");
  });

  it("6. 查询不存在的记录", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById("xxx", "uuid-p1")).rejects.toThrow(NotFoundException);
  });

  it("7. 统计概览", async () => {
    const r1 = makeRecord({ inputTokens: 50, outputTokens: 30, totalTokens: 80, cost: 0.002, createdAt: new Date("2026-05-01") });
    const r2 = makeRecord({ inputTokens: 60, outputTokens: 40, totalTokens: 100, cost: 0.003, createdAt: new Date("2026-05-02") });
    repo.find.mockResolvedValue([r1, r2]);
    modelRepo.findByIds.mockResolvedValue([makeModel()]);
    const stats = await service.getStats("uuid-p1");
    expect(stats.totalTokens).toBe(180);
    expect(stats.totalRequests).toBe(2);
    expect(stats.byDay).toHaveLength(2);
    expect(stats.byModel).toHaveLength(1);
  });

  it("8. 统计 - 按时间范围", async () => {
    repo.find.mockResolvedValue([makeRecord()]);
    modelRepo.findByIds.mockResolvedValue([makeModel()]);
    const stats = await service.getStats("uuid-p1", "2026-05-01", "2026-05-31");
    expect(stats.totalRequests).toBe(1);
  });

  it("9. 按 keyId 过滤", async () => {
    repo.findAndCount.mockResolvedValue([[makeRecord()], 1]);
    const r = await service.findAll("uuid-p1", { keyId: "uuid-k1" });
    expect(r.data).toHaveLength(1);
  });

  it("10. 统计 - 空数据", async () => {
    repo.find.mockResolvedValue([]);
    modelRepo.findByIds.mockResolvedValue([]);
    const stats = await service.getStats("uuid-p1");
    expect(stats.totalTokens).toBe(0);
    expect(stats.byDay).toHaveLength(0);
  });
});
