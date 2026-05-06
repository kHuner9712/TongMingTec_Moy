import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiProviderConfigService } from "./api-provider-config.service";
import { ApiProviderConfig } from "./entities/api-provider-config.entity";
import { ProviderNotConfiguredError, ProviderApiKeyMissingError } from "./providers/provider-errors";

describe("ApiProviderConfigService", () => {
  let service: ApiProviderConfigService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiProviderConfigService,
        { provide: getRepositoryToken(ApiProviderConfig), useValue: repo },
      ],
    }).compile();
    service = module.get(ApiProviderConfigService);
  });

  describe("CRUD", () => {
    it("create", async () => {
      repo.create.mockReturnValue({ provider: "deepseek" });
      repo.save.mockResolvedValue({ id: "uuid-1", provider: "deepseek" });

      const r = await service.create({
        provider: "deepseek", displayName: "DeepSeek",
        baseUrl: "https://api.deepseek.com", apiKeyEnvName: "DEEPSEEK_API_KEY",
      });

      expect(r.id).toBe("uuid-1");
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it("findAll", async () => {
      repo.find.mockResolvedValue([{ id: "uuid-1" }]);
      const r = await service.findAll();
      expect(r).toHaveLength(1);
    });

    it("findByProvider — found", async () => {
      repo.findOne.mockResolvedValue({ id: "uuid-1", provider: "deepseek" });
      const r = await service.findByProvider("deepseek");
      expect(r!.id).toBe("uuid-1");
    });

    it("findByProvider — not found", async () => {
      repo.findOne.mockResolvedValue(null);
      const r = await service.findByProvider("unknown");
      expect(r).toBeNull();
    });

    it("update", async () => {
      const config = { id: "uuid-1", displayName: "DS", baseUrl: "https://api.deepseek.com", apiKeyEnvName: "DEEPSEEK_API_KEY", status: "active", timeoutMs: 60000 };
      repo.findOne.mockResolvedValue(config);
      repo.save.mockResolvedValue({ ...config, displayName: "Updated" });

      const r = await service.update("deepseek", { displayName: "Updated" });
      expect(r.displayName).toBe("Updated");
      expect(config.displayName).toBe("Updated");
    });

    it("update — not found throws ProviderNotConfiguredError", async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update("unknown", { displayName: "X" })).rejects.toThrow(ProviderNotConfiguredError);
    });

    it("remove — 软停用（status=inactive）", async () => {
      const config = { id: "uuid-1", provider: "deepseek", displayName: "DS", baseUrl: "https://api.deepseek.com", apiKeyEnvName: "DEEPSEEK_API_KEY", status: "active", timeoutMs: 60000 };
      repo.findOne.mockResolvedValue(config);
      repo.save.mockResolvedValue({ ...config, status: "inactive" });

      const r = await service.remove("deepseek");
      expect(r.status).toBe("inactive");
      expect(config.status).toBe("inactive");
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("remove — 不存在的 provider 抛 ProviderNotConfiguredError", async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove("unknown")).rejects.toThrow(ProviderNotConfiguredError);
    });
  });

  describe("resolveClient", () => {
    it("deepseek — resolve", async () => {
      process.env["DEEPSEEK_API_KEY"] = "test-ds-key";
      repo.findOne.mockResolvedValue({
        id: "uuid-1", provider: "deepseek", baseUrl: "https://api.deepseek.com",
        apiKeyEnvName: "DEEPSEEK_API_KEY", status: "active", timeoutMs: 60000,
      });

      const client = await service.resolveClient("deepseek");
      expect(client.providerName).toBe("deepseek");

      delete process.env["DEEPSEEK_API_KEY"];
    });

    it("provider not found throws error", async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.resolveClient("unknown")).rejects.toThrow(ProviderNotConfiguredError);
    });

    it("provider inactive throws error", async () => {
      repo.findOne.mockResolvedValue({
        id: "uuid-1", provider: "deepseek", status: "inactive",
        baseUrl: "https://api.deepseek.com", apiKeyEnvName: "DEEPSEEK_API_KEY", timeoutMs: 60000,
      });
      await expect(service.resolveClient("deepseek")).rejects.toThrow(ProviderNotConfiguredError);
    });

    it("api key missing throws error", async () => {
      delete process.env["DEEPSEEK_API_KEY"];
      repo.findOne.mockResolvedValue({
        id: "uuid-1", provider: "deepseek", status: "active",
        baseUrl: "https://api.deepseek.com", apiKeyEnvName: "DEEPSEEK_API_KEY", timeoutMs: 60000,
      });
      await expect(service.resolveClient("deepseek")).rejects.toThrow(ProviderApiKeyMissingError);
    });
  });
});
