import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiKeysService } from "./api-keys.service";
import { ApiProjectKey } from "./entities/api-project-key.entity";
import { ApiProject } from "./entities/api-project.entity";
import { CreateApiKeyDto, UpdateApiKeyDto } from "./dto/api-project-key.dto";
import { NotFoundException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";

function makeKey(overrides: Partial<ApiProjectKey> = {}): ApiProjectKey {
  return {
    id: "uuid-k1", projectId: "uuid-p1", name: "测试密钥",
    keyPrefix: "moy_abc12345", keyHash: "hash123",
    status: "active", lastUsedAt: null, expiresAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as ApiProjectKey;
}

function makeProject(overrides: Partial<ApiProject> = {}): ApiProject {
  return { id: "uuid-p1", orgId: null, userId: null, name: "P", description: null, status: "active", defaultModelId: null, createdAt: new Date(), updatedAt: new Date(), ...overrides } as ApiProject;
}

describe("ApiKeysService", () => {
  let service: ApiKeysService;
  let keyRepo: jest.Mocked<Pick<Repository<ApiProjectKey>, "create" | "save" | "findOne" | "findAndCount">>;
  let projectRepo: jest.Mocked<Pick<Repository<ApiProject>, "findOne">>;

  beforeEach(async () => {
    keyRepo = {
      create: jest.fn().mockImplementation((d: any) => makeKey(d)),
      save: jest.fn().mockImplementation((d: ApiProjectKey) => Promise.resolve(d)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };
    projectRepo = { findOne: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: getRepositoryToken(ApiProjectKey), useValue: keyRepo },
        { provide: getRepositoryToken(ApiProject), useValue: projectRepo },
      ],
    }).compile();
    service = module.get(ApiKeysService);
  });

  it("1. 创建密钥", async () => {
    projectRepo.findOne.mockResolvedValue(makeProject());
    const dto: CreateApiKeyDto = { name: "生产密钥" };
    const r = await service.create("uuid-p1", dto);
    expect(r.name).toBe("生产密钥");
    expect(r.keyPrefix).toHaveLength(12);
    expect(r.rawKey).toBeTruthy();
    expect(r.rawKey).toContain("moy_");
  });

  it("2. 创建密钥 - 项目不存在", async () => {
    projectRepo.findOne.mockResolvedValue(null);
    await expect(service.create("xxx", { name: "K" })).rejects.toThrow(NotFoundException);
  });

  it("3. 查询密钥列表", async () => {
    keyRepo.findAndCount.mockResolvedValue([[makeKey()], 1]);
    const r = await service.findAll("uuid-p1", {});
    expect(r.data).toHaveLength(1);
    expect(r.total).toBe(1);
  });

  it("4. 查询密钥 - rawKey 不返回", async () => {
    keyRepo.findAndCount.mockResolvedValue([[makeKey()], 1]);
    const r = await service.findAll("uuid-p1", {});
    expect(r.data[0].rawKey).toBe("");
  });

  it("5. 查询密钥详情", async () => {
    keyRepo.findOne.mockResolvedValue(makeKey());
    const r = await service.findById("uuid-k1", "uuid-p1");
    expect(r.keyPrefix).toBe("moy_abc12345");
  });

  it("6. 查询不存在的密钥", async () => {
    keyRepo.findOne.mockResolvedValue(null);
    await expect(service.findById("xxx", "uuid-p1")).rejects.toThrow(NotFoundException);
  });

  it("7. 吊销密钥", async () => {
    keyRepo.findOne.mockResolvedValue(makeKey());
    await service.revoke("uuid-k1", "uuid-p1");
    const saved = (keyRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.status).toBe("revoked");
  });

  it("8. 验证有效密钥", async () => {
    const hash = crypto.createHash("sha256").update("moy_test123key").digest("hex");
    keyRepo.findOne.mockResolvedValue(makeKey({ keyHash: hash }));
    const r = await service.validateAndFind("moy_test123key");
    expect(r.keyPrefix).toBe("moy_abc12345");
  });

  it("9. 验证无效密钥", async () => {
    keyRepo.findOne.mockResolvedValue(null);
    await expect(service.validateAndFind("bad_key")).rejects.toThrow(UnauthorizedException);
  });

  it("10. 验证已吊销密钥", async () => {
    const hash = crypto.createHash("sha256").update("revoked_key").digest("hex");
    keyRepo.findOne.mockResolvedValue(makeKey({ keyHash: hash, status: "revoked" }));
    await expect(service.validateAndFind("revoked_key")).rejects.toThrow(UnauthorizedException);
  });
});
