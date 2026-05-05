import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GeoContentDraftsService } from "./geo-content-drafts.service";
import { GeoContentDraft } from "./entities/geo-content-draft.entity";
import { CreateGeoContentDraftDto } from "./dto/create-geo-content-draft.dto";
import { UpdateGeoContentDraftDto } from "./dto/update-geo-content-draft.dto";
import { NotFoundException, BadRequestException } from "@nestjs/common";

function makeDraft(overrides: Partial<GeoContentDraft> = {}): GeoContentDraft {
  return {
    id: "uuid-d1", leadId: null, brandAssetId: null, reportId: null,
    topicId: null, planId: null, title: "测试稿件", slug: null,
    contentType: null, targetKeyword: null, targetQuestion: null,
    targetAudience: null, platform: null, status: "draft",
    summary: null, outline: null, body: null, markdown: null,
    seoTitle: null, metaDescription: null, tags: null,
    complianceChecklist: null, reviewNotes: null,
    publishedUrl: null, plannedPublishDate: null, actualPublishDate: null,
    createdBy: null, updatedBy: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as GeoContentDraft;
}

describe("GeoContentDraftsService", () => {
  let service: GeoContentDraftsService;
  let repo: jest.Mocked<Pick<Repository<GeoContentDraft>, "create" | "save" | "findOne" | "findAndCount">>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((d: any) => makeDraft(d)),
      save: jest.fn().mockImplementation((d: GeoContentDraft) => Promise.resolve(d)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoContentDraftsService,
        { provide: getRepositoryToken(GeoContentDraft), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(GeoContentDraftsService);
    repo = module.get(getRepositoryToken(GeoContentDraft));
  });

  it("1. 创建稿件", async () => {
    const dto: CreateGeoContentDraftDto = { title: "稿件A", targetKeyword: "SEO" };
    repo.create.mockReturnValue(makeDraft({ title: "稿件A", targetKeyword: "SEO" }));
    const r = await service.create(dto);
    expect(r.title).toBe("稿件A");
    expect(r.targetKeyword).toBe("SEO");
    expect(r.status).toBe("draft");
  });

  it("2. 查询列表", async () => {
    repo.findAndCount.mockResolvedValue([[makeDraft()], 1]);
    const r = await service.findAll({ page: 1, pageSize: 20 });
    expect(r.data).toHaveLength(1);
    expect(r.pagination.total).toBe(1);
  });

  it("3. keyword 搜索", async () => {
    repo.findAndCount.mockResolvedValue([[makeDraft()], 1]);
    const r = await service.findAll({ keyword: "测试" });
    expect(r.data).toHaveLength(1);
  });

  it("4. leadId 筛选", async () => {
    repo.findAndCount.mockResolvedValue([[makeDraft({ leadId: "l-1" })], 1]);
    const r = await service.findAll({ leadId: "l-1" });
    expect(r.data).toHaveLength(1);
  });

  it("5. topicId 筛选", async () => {
    repo.findAndCount.mockResolvedValue([[makeDraft({ topicId: "t-1" })], 1]);
    const r = await service.findAll({ topicId: "t-1" });
    expect(r.data).toHaveLength(1);
  });

  it("6. planId 筛选", async () => {
    repo.findAndCount.mockResolvedValue([[makeDraft({ planId: "p-1" })], 1]);
    const r = await service.findAll({ planId: "p-1" });
    expect(r.data).toHaveLength(1);
  });

  it("7. 更新稿件", async () => {
    repo.findOne.mockResolvedValue(makeDraft());
    const dto: UpdateGeoContentDraftDto = { title: "新标题", body: "正文内容" };
    const r = await service.update("uuid-d1", dto);
    expect(r.title).toBe("新标题");
    expect(r.body).toBe("正文内容");
  });

  it("8. 状态更新合法 draft->reviewing", async () => {
    repo.findOne.mockResolvedValue(makeDraft({ status: "draft" }));
    const r = await service.updateStatus("uuid-d1", { status: "reviewing" });
    expect(r.status).toBe("reviewing");
  });

  it("9. 状态更新非法 published->draft", async () => {
    repo.findOne.mockResolvedValue(makeDraft({ status: "published" }));
    await expect(service.updateStatus("uuid-d1", { status: "draft" })).rejects.toThrow(BadRequestException);
  });

  it("10. 删除归档", async () => {
    repo.findOne.mockResolvedValue(makeDraft({ status: "draft" }));
    const r = await service.archive("uuid-d1");
    expect(r.status).toBe("archived");
  });

  it("11. 查不存在返回 NotFound", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById("nope")).rejects.toThrow(NotFoundException);
  });
});
