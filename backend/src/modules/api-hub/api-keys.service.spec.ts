import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiKeysService } from "./api-keys.service";
import { ApiProjectKey } from "./entities/api-project-key.entity";
import { ApiProject } from "./entities/api-project.entity";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";

function makeKey(overrides: Partial<ApiProjectKey> = {}): ApiProjectKey {
  return {
    id: "uuid-k1", projectId: "uuid-p1", name: "测试密钥",
    keyPrefix: "moy_sk_a1b2", keyHash: "hash123",
    status: "active", lastUsedAt: null, expiresAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as ApiProjectKey;
}

function makeProject(): ApiProject {
  return { id: "uuid-p1", orgId: null, userId: null, name: "P", description: null, status: "active", defaultModelId: null, createdAt: new Date(), updatedAt: new Date() } as ApiProject;
}

describe("ApiKeysService", () => {
  let service: ApiKeysService;
  let keyRepo: any;
  let projectRepo: any;

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

  it("1. create 返回完整的 moy_sk_ 开头的 key", async () => {
    projectRepo.findOne.mockResolvedValue(makeProject());
    const r = await service.create("uuid-p1", { name: "生产密钥" });
    expect(r.key).toBeDefined();
    expect(r.key).toContain("moy_sk_");
    expect(r.keyPrefix).toHaveLength(12);
  });

  it("2. keyHash 存在于数据库实体", async () => {
    projectRepo.findOne.mockResolvedValue(makeProject());
    await service.create("uuid-p1", { name: "K" });
    const saved = keyRepo.save.mock.calls[0][0];
    expect(saved.keyHash).toBeDefined();
    expect(saved.keyHash).toHaveLength(64);
  });

  it("3. create response 返回 key（不叫 rawKey）", async () => {
    projectRepo.findOne.mockResolvedValue(makeProject());
    const r = await service.create("uuid-p1", { name: "K" });
    expect(r.key).toBeTruthy();
    expect((r as any).rawKey).toBeUndefined();
  });

  it("4. list 不返回 key / rawKey / keyHash", async () => {
    keyRepo.findAndCount.mockResolvedValue([[makeKey()], 1]);
    const r = await service.findAll("uuid-p1", {});
    expect(r.data).toHaveLength(1);
    expect((r.data[0] as any).key).toBeUndefined();
    expect((r.data[0] as any).rawKey).toBeUndefined();
    expect((r.data[0] as any).keyHash).toBeUndefined();
  });

  it("5. detail 不返回 key / rawKey / keyHash", async () => {
    keyRepo.findOne.mockResolvedValue(makeKey());
    const r = await service.findById("uuid-k1", "uuid-p1");
    expect(r.keyPrefix).toBe("moy_sk_a1b2");
    expect((r as any).key).toBeUndefined();
    expect((r as any).rawKey).toBeUndefined();
    expect((r as any).keyHash).toBeUndefined();
  });

  it("6. update 不返回 key / rawKey / keyHash", async () => {
    keyRepo.findOne.mockResolvedValue(makeKey());
    const r = await service.update("uuid-k1", "uuid-p1", { name: "新名称" });
    expect(r.name).toBe("新名称");
    expect((r as any).key).toBeUndefined();
    expect((r as any).keyHash).toBeUndefined();
  });

  it("7. revoke 不返回 key / rawKey / keyHash", async () => {
    keyRepo.findOne.mockResolvedValue(makeKey());
    const r = await service.revoke("uuid-k1", "uuid-p1");
    expect(r.status).toBe("revoked");
    expect((r as any).key).toBeUndefined();
    expect((r as any).keyHash).toBeUndefined();
  });

  it("8. 查询不存在的密钥抛 NotFoundException", async () => {
    keyRepo.findOne.mockResolvedValue(null);
    await expect(service.findById("xxx", "uuid-p1")).rejects.toThrow(NotFoundException);
  });

  it("9. 验证无效密钥抛 UnauthorizedException", async () => {
    keyRepo.findOne.mockResolvedValue(null);
    await expect(service.validateAndFind("bad_key")).rejects.toThrow(UnauthorizedException);
  });

  it("10. 验证已吊销密钥抛 UnauthorizedException", async () => {
    const hash = crypto.createHash("sha256").update("revoked_key").digest("hex");
    keyRepo.findOne.mockResolvedValue(makeKey({ keyHash: hash, status: "revoked" }));
    await expect(service.validateAndFind("revoked_key")).rejects.toThrow(UnauthorizedException);
  });
});
