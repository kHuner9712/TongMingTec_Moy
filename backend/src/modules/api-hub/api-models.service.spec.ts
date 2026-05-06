import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiModelsService } from "./api-models.service";
import { ApiModel } from "./entities/api-model.entity";
import { CreateApiModelDto, UpdateApiModelDto } from "./dto/api-model.dto";
import { NotFoundException, ConflictException } from "@nestjs/common";

function makeModel(overrides: Partial<ApiModel> = {}): ApiModel {
  return {
    id: "uuid-m1", name: "GPT-4", provider: "openai", modelId: "gpt-4",
    category: "text", pricingUnit: "token", unitLabel: "1K tokens",
    description: null, status: "internal",
    maxInputTokens: null, maxOutputTokens: null,
    supportsStreaming: false, supportsVision: false, supportsFunctionCalling: false,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as ApiModel;
}

describe("ApiModelsService", () => {
  let service: ApiModelsService;
  let repo: jest.Mocked<Pick<Repository<ApiModel>, "create" | "save" | "findOne" | "findAndCount">>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((d: any) => makeModel(d)),
      save: jest.fn().mockImplementation((d: ApiModel) => Promise.resolve(d)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiModelsService,
        { provide: getRepositoryToken(ApiModel), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(ApiModelsService);
    repo = module.get(getRepositoryToken(ApiModel));
  });

  it("1. 注册模型", async () => {
    repo.findOne.mockResolvedValue(null);
    const dto: CreateApiModelDto = { name: "GPT-4", provider: "openai", modelId: "gpt-4" };
    const r = await service.create(dto);
    expect(r.name).toBe("GPT-4");
    expect(r.provider).toBe("openai");
  });

  it("2. 重复注册同一 modelId", async () => {
    repo.findOne.mockResolvedValue(makeModel());
    const dto: CreateApiModelDto = { name: "GPT-4-v2", provider: "openai", modelId: "gpt-4" };
    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it("3. 查询模型列表", async () => {
    repo.findAndCount.mockResolvedValue([[makeModel()], 1]);
    const r = await service.findAll({});
    expect(r.data).toHaveLength(1);
  });

  it("4. 按 provider 过滤", async () => {
    repo.findAndCount.mockResolvedValue([[makeModel()], 1]);
    const r = await service.findAll({ provider: "openai" });
    expect(r.data).toHaveLength(1);
  });

  it("5. 查询详情", async () => {
    repo.findOne.mockResolvedValue(makeModel());
    const r = await service.findById("uuid-m1");
    expect(r.modelId).toBe("gpt-4");
  });

  it("6. 查询不存在的模型", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById("xxx")).rejects.toThrow(NotFoundException);
  });

  it("7. 更新模型信息", async () => {
    repo.findOne.mockResolvedValue(makeModel());
    const dto: UpdateApiModelDto = { status: "public" };
    const r = await service.update("uuid-m1", dto);
    expect(r.status).toBe("public");
  });

  it("8. 设置为 deprecated", async () => {
    repo.findOne.mockResolvedValue(makeModel());
    await service.archive("uuid-m1");
    const saved = (repo.save as jest.Mock).mock.calls[0][0];
    expect(saved.status).toBe("deprecated");
  });

  it("9. 创建含完整信息的模型", async () => {
    repo.findOne.mockResolvedValue(null);
    const dto: CreateApiModelDto = {
      name: "Claude", provider: "anthropic", modelId: "claude-3",
      category: "text", maxInputTokens: 200000, maxOutputTokens: 4096,
      supportsStreaming: true, supportsVision: true,
    };
    const r = await service.create(dto);
    expect(r.maxInputTokens).toBe(200000);
    expect(r.supportsStreaming).toBe(true);
  });

  it("10. 查询不存在的模型", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById("xxx")).rejects.toThrow(NotFoundException);
  });
});
