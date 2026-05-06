import { Test, TestingModule } from "@nestjs/testing";
import { ApiKeyGuard, ApiKeyRequest } from "./guards/api-key.guard";
import { ApiKeysService } from "./api-keys.service";
import { ApiProjectKey } from "./entities/api-project-key.entity";
import { UnauthorizedException } from "@nestjs/common";

function makeKey(overrides: Partial<ApiProjectKey> = {}): ApiProjectKey {
  return {
    id: "uuid-k1", projectId: "uuid-p1", name: "测试密钥",
    keyPrefix: "moy_sk_a1b2", keyHash: "hash123",
    status: "active", lastUsedAt: null, expiresAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as ApiProjectKey;
}

describe("ApiKeyGuard", () => {
  let guard: ApiKeyGuard;
  let apiKeysService: any;

  beforeEach(async () => {
    apiKeysService = {
      validateAndFind: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: ApiKeysService, useValue: apiKeysService },
      ],
    }).compile();
    guard = module.get(ApiKeyGuard);
  });

  function makeCtx(authHeader?: string) {
    const req: any = {
      headers: { authorization: authHeader },
    };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as any;
  }

  it("1. 缺少 Authorization 返回 401", async () => {
    await expect(guard.canActivate(makeCtx())).rejects.toThrow(UnauthorizedException);
    try { await guard.canActivate(makeCtx()); } catch (e: any) {
      const body = e.response;
      expect(body.error.code).toBe("missing_api_key");
    }
  });

  it("2. 非 Bearer 返回 401", async () => {
    await expect(guard.canActivate(makeCtx("Basic xyz"))).rejects.toThrow(UnauthorizedException);
    try { await guard.canActivate(makeCtx("Basic xyz")); } catch (e: any) {
      expect(e.response.error.code).toBe("invalid_api_key_format");
    }
  });

  it("3. 非 moy_sk_ 前缀返回 401", async () => {
    await expect(guard.canActivate(makeCtx("Bearer bad_prefix"))).rejects.toThrow(UnauthorizedException);
    try { await guard.canActivate(makeCtx("Bearer bad_prefix")); } catch (e: any) {
      expect(e.response.error.code).toBe("invalid_api_key_format");
    }
  });

  it("4. 有效 key 通过并挂载 req.apiKey", async () => {
    const key = makeKey();
    apiKeysService.validateAndFind.mockResolvedValue(key);
    const ctx = makeCtx("Bearer moy_sk_validkey1234567890abcdef");
    const result = await guard.canActivate(ctx);

    const req = ctx.switchToHttp().getRequest();
    expect(result).toBe(true);
    expect(req.apiKey).toBeDefined();
    expect(req.apiKey.projectId).toBe("uuid-p1");
  });

  it("5. revoked key 返回 401", async () => {
    apiKeysService.validateAndFind.mockRejectedValue(new Error("API_KEY_INACTIVE"));
    await expect(guard.canActivate(makeCtx("Bearer moy_sk_revoked_key"))).rejects.toThrow(UnauthorizedException);
    try { await guard.canActivate(makeCtx("Bearer moy_sk_revoked_key")); } catch (e: any) {
      expect(e.response.error.code).toBe("invalid_api_key");
    }
  });
});
