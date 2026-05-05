import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GeoContentPlansService } from "./geo-content-plans.service";
import { GeoContentPlan } from "./entities/geo-content-plan.entity";
import { CreateGeoContentPlanDto } from "./dto/create-geo-content-plan.dto";
import { UpdateGeoContentPlanDto } from "./dto/update-geo-content-plan.dto";
import { NotFoundException } from "@nestjs/common";

function makePlan(overrides: Partial<GeoContentPlan> = {}): GeoContentPlan {
  return {
    id: "uuid-p1", leadId: null, brandAssetId: null,
    title: "测试计划", month: "2026-05", goal: null,
    targetPlatforms: null, topics: null, status: "draft",
    summary: null, createdBy: null, updatedBy: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as GeoContentPlan;
}

describe("GeoContentPlansService", () => {
  let service: GeoContentPlansService;
  let repo: jest.Mocked<Pick<Repository<GeoContentPlan>, "create" | "save" | "findOne" | "findAndCount">>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((d: any) => makePlan(d)),
      save: jest.fn().mockImplementation((p: GeoContentPlan) => Promise.resolve(p)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoContentPlansService,
        { provide: getRepositoryToken(GeoContentPlan), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(GeoContentPlansService);
    repo = module.get(getRepositoryToken(GeoContentPlan));
  });

  it("1. 创建计划", async () => {
    const dto: CreateGeoContentPlanDto = { title: "计划A", month: "2026-06" };
    repo.create.mockReturnValue(makePlan({ title: "计划A", month: "2026-06" }));
    const r = await service.create(dto);
    expect(r.title).toBe("计划A");
    expect(r.month).toBe("2026-06");
  });

  it("2. 查询列表", async () => {
    repo.findAndCount.mockResolvedValue([[makePlan()], 1]);
    const r = await service.findAll({ page: 1, pageSize: 20 });
    expect(r.data).toHaveLength(1);
  });

  it("3. keyword 搜索", async () => {
    repo.findAndCount.mockResolvedValue([[makePlan()], 1]);
    const r = await service.findAll({ keyword: "测试" });
    expect(r.data).toHaveLength(1);
  });

  it("4. leadId 筛选", async () => {
    repo.findAndCount.mockResolvedValue([[makePlan({ leadId: "l-1" })], 1]);
    const r = await service.findAll({ leadId: "l-1" });
    expect(r.data).toHaveLength(1);
  });

  it("5. brandAssetId 筛选", async () => {
    repo.findAndCount.mockResolvedValue([[makePlan({ brandAssetId: "b-1" })], 1]);
    const r = await service.findAll({ brandAssetId: "b-1" });
    expect(r.data).toHaveLength(1);
  });

  it("6. 更新计划", async () => {
    repo.findOne.mockResolvedValue(makePlan());
    const dto: UpdateGeoContentPlanDto = { title: "新标题" };
    const r = await service.update("uuid-p1", dto);
    expect(r.title).toBe("新标题");
  });

  it("7. 状态更新", async () => {
    repo.findOne.mockResolvedValue(makePlan({ status: "draft" }));
    const r = await service.updateStatus("uuid-p1", { status: "active" });
    expect(r.status).toBe("active");
  });

  it("8. 删除归档", async () => {
    repo.findOne.mockResolvedValue(makePlan({ status: "draft" }));
    const r = await service.archive("uuid-p1");
    expect(r.status).toBe("archived");
  });

  it("9. 查不存在返回 NotFound", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById("nope")).rejects.toThrow(NotFoundException);
  });
});
