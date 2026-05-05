import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GeoBrandAssetsService } from "./geo-brand-assets.service";
import { GeoBrandAsset, GeoBrandAssetStatus } from "./entities/geo-brand-asset.entity";
import { CreateGeoBrandAssetDto } from "./dto/create-geo-brand-asset.dto";
import { UpdateGeoBrandAssetDto } from "./dto/update-geo-brand-asset.dto";
import { NotFoundException, BadRequestException } from "@nestjs/common";

function makeAsset(overrides: Partial<GeoBrandAsset> = {}): GeoBrandAsset {
  return {
    id: "uuid-1",
    leadId: null,
    title: "测试资产包",
    companyName: "测试公司",
    brandName: "测试品牌",
    website: "https://example.com",
    industry: "互联网",
    targetCity: "北京",
    status: "draft",
    basicInfo: null,
    companyIntro: null,
    serviceItems: null,
    advantages: null,
    cases: null,
    faqs: null,
    competitorDiffs: null,
    complianceMaterials: null,
    markdown: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as GeoBrandAsset;
}

describe("GeoBrandAssetsService", () => {
  let service: GeoBrandAssetsService;
  let repo: jest.Mocked<Pick<Repository<GeoBrandAsset>, "create" | "save" | "findOne" | "findAndCount">>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((dto: any) => makeAsset(dto)),
      save: jest.fn().mockImplementation((a: GeoBrandAsset) => Promise.resolve(a)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoBrandAssetsService,
        { provide: getRepositoryToken(GeoBrandAsset), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<GeoBrandAssetsService>(GeoBrandAssetsService);
    repo = module.get(getRepositoryToken(GeoBrandAsset));
  });

  it("创建资产包", async () => {
    const dto: CreateGeoBrandAssetDto = { companyName: "A", brandName: "B", title: "T" };
    repo.create.mockReturnValue(makeAsset({ companyName: "A", brandName: "B", title: "T" }));
    const result = await service.create(dto);
    expect(result.companyName).toBe("A");
    expect(result.status).toBe("draft");
  });

  it("查询列表", async () => {
    repo.findAndCount.mockResolvedValue([[makeAsset()], 1]);
    const result = await service.findAll({ page: 1, pageSize: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("keyword 搜索", async () => {
    repo.findAndCount.mockResolvedValue([[makeAsset()], 1]);
    const result = await service.findAll({ keyword: "测试" });
    expect(result.data).toHaveLength(1);
  });

  it("leadId 筛选", async () => {
    repo.findAndCount.mockResolvedValue([[makeAsset({ leadId: "lead-1" })], 1]);
    const result = await service.findAll({ leadId: "lead-1" });
    expect(result.data).toHaveLength(1);
  });

  it("更新资产包", async () => {
    const a = makeAsset();
    repo.findOne.mockResolvedValue(a);
    const dto: UpdateGeoBrandAssetDto = { title: "新标题" };
    const result = await service.update("uuid-1", dto);
    expect(result.title).toBe("新标题");
  });

  it("状态更新", async () => {
    const a = makeAsset({ status: "draft" });
    repo.findOne.mockResolvedValue(a);
    const result = await service.updateStatus("uuid-1", { status: "ready" });
    expect(result.status).toBe("ready");
  });

  it("删除归档", async () => {
    const a = makeAsset({ status: "draft" });
    repo.findOne.mockResolvedValue(a);
    const result = await service.archive("uuid-1");
    expect(result.status).toBe("archived");
  });

  it("查不存在返回 NotFound", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById("nope")).rejects.toThrow(NotFoundException);
  });

  it("非法状态流转抛错", async () => {
    const a = makeAsset({ status: "archived" });
    repo.findOne.mockResolvedValue(a);
    await expect(service.updateStatus("uuid-1", { status: "ready" })).rejects.toThrow(BadRequestException);
  });
});
