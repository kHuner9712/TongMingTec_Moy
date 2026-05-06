import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiProjectsService } from "./api-projects.service";
import { ApiProject } from "./entities/api-project.entity";
import { CreateApiProjectDto, UpdateApiProjectDto } from "./dto/api-project.dto";
import { NotFoundException, BadRequestException } from "@nestjs/common";

function makeProject(overrides: Partial<ApiProject> = {}): ApiProject {
  return {
    id: "uuid-p1", orgId: null, userId: null, name: "测试项目",
    description: null, status: "active", defaultModelId: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as ApiProject;
}

describe("ApiProjectsService", () => {
  let service: ApiProjectsService;
  let repo: jest.Mocked<Pick<Repository<ApiProject>, "create" | "save" | "findOne" | "findAndCount">>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((d: any) => makeProject(d)),
      save: jest.fn().mockImplementation((d: ApiProject) => Promise.resolve(d)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiProjectsService,
        { provide: getRepositoryToken(ApiProject), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(ApiProjectsService);
    repo = module.get(getRepositoryToken(ApiProject));
  });

  it("1. 创建项目", async () => {
    const dto: CreateApiProjectDto = { name: "项目A", description: "desc" };
    repo.create.mockReturnValue(makeProject({ name: "项目A", description: "desc" }));
    const r = await service.create(dto);
    expect(r.name).toBe("项目A");
    expect(r.description).toBe("desc");
    expect(r.status).toBe("active");
  });

  it("2. 查询列表", async () => {
    repo.findAndCount.mockResolvedValue([[makeProject()], 1]);
    const r = await service.findAll({});
    expect(r.data).toHaveLength(1);
    expect(r.total).toBe(1);
  });

  it("3. 按关键词过滤", async () => {
    repo.findAndCount.mockResolvedValue([[makeProject()], 1]);
    const r = await service.findAll({ keyword: "测试" });
    expect(r.data).toHaveLength(1);
  });

  it("4. 查询详情", async () => {
    repo.findOne.mockResolvedValue(makeProject());
    const r = await service.findById("uuid-p1");
    expect(r.name).toBe("测试项目");
  });

  it("5. 查询不存在的项目", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById("xxx")).rejects.toThrow(NotFoundException);
  });

  it("6. 更新项目信息", async () => {
    repo.findOne.mockResolvedValue(makeProject());
    const dto: UpdateApiProjectDto = { name: "新名称" };
    const r = await service.update("uuid-p1", dto);
    expect(r.name).toBe("新名称");
  });

  it("7. 状态流转 active -> suspended", async () => {
    repo.findOne.mockResolvedValue(makeProject());
    const dto: UpdateApiProjectDto = { status: "suspended" };
    const r = await service.update("uuid-p1", dto);
    expect(r.status).toBe("suspended");
  });

  it("8. 非法状态流转 active -> xxx", async () => {
    repo.findOne.mockResolvedValue(makeProject());
    const dto: UpdateApiProjectDto = { status: "unexpected" as any };
    await expect(service.update("uuid-p1", dto)).rejects.toThrow(BadRequestException);
  });

  it("9. 非法状态流转 archived -> active", async () => {
    repo.findOne.mockResolvedValue(makeProject({ status: "archived" }));
    const dto: UpdateApiProjectDto = { status: "active" };
    await expect(service.update("uuid-p1", dto)).rejects.toThrow(BadRequestException);
  });

  it("10. 归档项目", async () => {
    repo.findOne.mockResolvedValue(makeProject());
    await service.archive("uuid-p1");
    const saved = (repo.save as jest.Mock).mock.calls[0][0];
    expect(saved.status).toBe("archived");
  });
});
