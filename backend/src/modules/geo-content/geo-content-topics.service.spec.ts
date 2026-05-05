import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GeoContentTopicsService } from "./geo-content-topics.service";
import { GeoContentTopic } from "./entities/geo-content-topic.entity";
import { CreateGeoContentTopicDto } from "./dto/create-geo-content-topic.dto";
import { UpdateGeoContentTopicDto } from "./dto/update-geo-content-topic.dto";
import { NotFoundException } from "@nestjs/common";

function makeTopic(overrides: Partial<GeoContentTopic> = {}): GeoContentTopic {
  return {
    id: "uuid-t1", leadId: null, brandAssetId: null, reportId: null,
    title: "测试选题", contentType: "industry_question", targetKeyword: null,
    targetQuestion: null, targetAudience: null, searchIntent: null,
    platformSuggestion: null, priority: "medium", status: "idea",
    outline: null, keyPoints: null, referenceMaterials: null,
    complianceNotes: null, plannedPublishDate: null, actualPublishDate: null,
    publishedUrl: null, createdBy: null, updatedBy: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as GeoContentTopic;
}

describe("GeoContentTopicsService", () => {
  let service: GeoContentTopicsService;
  let repo: jest.Mocked<Pick<Repository<GeoContentTopic>, "create" | "save" | "findOne" | "findAndCount">>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((d: any) => makeTopic(d)),
      save: jest.fn().mockImplementation((t: GeoContentTopic) => Promise.resolve(t)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoContentTopicsService,
        { provide: getRepositoryToken(GeoContentTopic), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(GeoContentTopicsService);
    repo = module.get(getRepositoryToken(GeoContentTopic));
  });

  it("1. 创建选题", async () => {
    const dto: CreateGeoContentTopicDto = { title: "选题A", priority: "high" };
    repo.create.mockReturnValue(makeTopic({ title: "选题A", priority: "high" }));
    const r = await service.create(dto);
    expect(r.title).toBe("选题A");
    expect(r.priority).toBe("high");
    expect(r.status).toBe("idea");
  });

  it("2. 查询列表", async () => {
    repo.findAndCount.mockResolvedValue([[makeTopic()], 1]);
    const r = await service.findAll({ page: 1, pageSize: 20 });
    expect(r.data).toHaveLength(1);
    expect(r.pagination.total).toBe(1);
  });

  it("3. keyword 搜索", async () => {
    repo.findAndCount.mockResolvedValue([[makeTopic()], 1]);
    const r = await service.findAll({ keyword: "测试" });
    expect(r.data).toHaveLength(1);
  });

  it("4. leadId 筛选", async () => {
    repo.findAndCount.mockResolvedValue([[makeTopic({ leadId: "l-1" })], 1]);
    const r = await service.findAll({ leadId: "l-1" });
    expect(r.data).toHaveLength(1);
  });

  it("5. brandAssetId 筛选", async () => {
    repo.findAndCount.mockResolvedValue([[makeTopic({ brandAssetId: "b-1" })], 1]);
    const r = await service.findAll({ brandAssetId: "b-1" });
    expect(r.data).toHaveLength(1);
  });

  it("6. 更新选题", async () => {
    repo.findOne.mockResolvedValue(makeTopic());
    const dto: UpdateGeoContentTopicDto = { title: "新标题" };
    const r = await service.update("uuid-t1", dto);
    expect(r.title).toBe("新标题");
  });

  it("7. 状态更新", async () => {
    repo.findOne.mockResolvedValue(makeTopic({ status: "idea" }));
    const r = await service.updateStatus("uuid-t1", { status: "planned" });
    expect(r.status).toBe("planned");
  });

  it("8. 删除归档", async () => {
    repo.findOne.mockResolvedValue(makeTopic({ status: "idea" }));
    const r = await service.archive("uuid-t1");
    expect(r.status).toBe("archived");
  });

  it("9. 查不存在返回 NotFound", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById("nope")).rejects.toThrow(NotFoundException);
  });
});
