import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GeoReportsService } from "./geo-reports.service";
import { GeoReport, GeoReportStatus } from "./entities/geo-report.entity";
import { CreateGeoReportDto } from "./dto/create-geo-report.dto";
import { UpdateGeoReportDto } from "./dto/update-geo-report.dto";
import { NotFoundException, BadRequestException } from "@nestjs/common";

function makeReport(overrides: Partial<GeoReport> = {}): GeoReport {
  return {
    id: "uuid-1",
    leadId: null,
    title: "测试报告",
    companyName: "测试公司",
    brandName: "测试品牌",
    website: "https://example.com",
    industry: "互联网",
    targetCity: "北京",
    contactName: null,
    status: "draft",
    diagnosisDate: "2026-05-01",
    platforms: ["ChatGPT"],
    competitors: null,
    targetQuestions: null,
    testResults: [],
    visibilitySummary: null,
    mainProblems: null,
    opportunities: null,
    recommendedActions: null,
    markdown: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as GeoReport;
}

describe("GeoReportsService", () => {
  let service: GeoReportsService;
  let repo: jest.Mocked<Pick<Repository<GeoReport>, "create" | "save" | "findOne" | "findAndCount">>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((dto: any) => makeReport(dto)),
      save: jest.fn().mockImplementation((r: GeoReport) => Promise.resolve(r)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoReportsService,
        { provide: getRepositoryToken(GeoReport), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<GeoReportsService>(GeoReportsService);
    repo = module.get(getRepositoryToken(GeoReport));
  });

  it("创建报告", async () => {
    const dto: CreateGeoReportDto = { companyName: "A", brandName: "B", title: "T" };
    repo.create.mockReturnValue(makeReport({ companyName: "A", brandName: "B", title: "T" }));
    const result = await service.create(dto);
    expect(result.companyName).toBe("A");
    expect(result.status).toBe("draft");
  });

  it("查询列表", async () => {
    repo.findAndCount.mockResolvedValue([[makeReport()], 1]);
    const result = await service.findAll({ page: 1, pageSize: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("keyword 搜索", async () => {
    repo.findAndCount.mockResolvedValue([[makeReport()], 1]);
    const result = await service.findAll({ keyword: "测试" });
    expect(result.data).toHaveLength(1);
  });

  it("leadId 筛选", async () => {
    repo.findAndCount.mockResolvedValue([[makeReport({ leadId: "lead-1" })], 1]);
    const result = await service.findAll({ leadId: "lead-1" });
    expect(result.data).toHaveLength(1);
  });

  it("更新报告", async () => {
    const r = makeReport();
    repo.findOne.mockResolvedValue(r);
    const dto: UpdateGeoReportDto = { title: "新标题" };
    const result = await service.update("uuid-1", dto);
    expect(result.title).toBe("新标题");
  });

  it("状态更新", async () => {
    const r = makeReport({ status: "draft" });
    repo.findOne.mockResolvedValue(r);
    const result = await service.updateStatus("uuid-1", { status: "ready" });
    expect(result.status).toBe("ready");
  });

  it("删除归档", async () => {
    const r = makeReport({ status: "draft" });
    repo.findOne.mockResolvedValue(r);
    const result = await service.archive("uuid-1");
    expect(result.status).toBe("archived");
  });

  it("查不存在返回 NotFound", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById("nope")).rejects.toThrow(NotFoundException);
  });

  it("非法状态流转抛错", async () => {
    const r = makeReport({ status: "archived" });
    repo.findOne.mockResolvedValue(r);
    await expect(service.updateStatus("uuid-1", { status: "ready" })).rejects.toThrow(BadRequestException);
  });
});
