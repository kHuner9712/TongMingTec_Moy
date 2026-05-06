import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { REQUEST } from "@nestjs/core";
import { GeoLeadsService } from "./geo-leads.service";
import { GeoLead } from "./entities/geo-lead.entity";
import { CreateGeoLeadDto } from "./dto/create-geo-lead.dto";

function makeDto(overrides: Partial<CreateGeoLeadDto> = {}): CreateGeoLeadDto {
  const dto = new CreateGeoLeadDto();
  dto.companyName = overrides.companyName ?? "测试公司";
  dto.brandName = overrides.brandName ?? "测试品牌";
  dto.website = overrides.website ?? "https://example.com";
  dto.industry = overrides.industry ?? "互联网";
  dto.targetCity = overrides.targetCity ?? "北京";
  dto.competitors = overrides.competitors ?? "";
  dto.contactName = overrides.contactName ?? "张三";
  dto.contactMethod = overrides.contactMethod ?? "13800138000";
  dto.notes = overrides.notes ?? "";
  dto._hint = overrides._hint ?? "";
  return dto;
}

function makeGeoLead(overrides: Partial<GeoLead> = {}): GeoLead {
  return {
    id: "uuid-1",
    companyName: "测试公司",
    brandName: "测试品牌",
    website: "https://example.com",
    industry: "互联网",
    targetCity: "北京",
    competitors: null,
    contactName: "张三",
    contactMethod: "13800138000",
    notes: null,
    source: "geo_website_form",
    status: "received",
    assignedTo: null,
    firstContactedAt: null,
    convertedToCustomerId: null,
    ipAddress: "192.168.1.1",
    userAgent: "jest-test",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as GeoLead;
}

describe("GeoLeadsService", () => {
  let service: GeoLeadsService;
  let repo: jest.Mocked<
    Pick<
      Repository<GeoLead>,
      "create" | "save" | "count" | "findOne" | "findAndCount"
    >
  >;

  const mockReq = {
    ip: "192.168.1.1",
    headers: { "user-agent": "jest-test" },
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoLeadsService,
        { provide: getRepositoryToken(GeoLead), useValue: mockRepo },
        { provide: REQUEST, useValue: mockReq },
      ],
    }).compile();

    service = module.get<GeoLeadsService>(GeoLeadsService);
    repo = mockRepo as unknown as typeof repo;
  });

  describe("create", () => {
    it("应该正常创建 lead 并返回保存后的实体", async () => {
      const dto = makeDto();
      const entity = {
        ...dto,
        id: "uuid-1",
        status: "received",
      } as unknown as GeoLead;

      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);
      repo.count.mockResolvedValue(0);

      const result = await service.create(dto);

      expect(result.id).toBe("uuid-1");
      expect(result.status).toBe("received");
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it("honeypot 命中时不应写入数据库，返回假成功", async () => {
      const dto = makeDto({ _hint: "bot-signal" });

      const result = await service.create(dto);

      expect(result.id).toBe("geo_lead_ignored");
      expect(result.status).toBe("received");
      expect(repo.save).not.toHaveBeenCalled();
    });

    it("website 包含 localhost 应被拒绝", async () => {
      const dto = makeDto({ website: "http://localhost:3000" });
      await expect(service.create(dto)).rejects.toThrow();
    });

    it("website 包含 127.0.0.1 应被拒绝", async () => {
      const dto = makeDto({ website: "https://127.0.0.1/api" });
      await expect(service.create(dto)).rejects.toThrow();
    });

    it("website 不以 http/https 开头应被拒绝", async () => {
      const dto = makeDto({ website: "ftp://example.com" });
      await expect(service.create(dto)).rejects.toThrow();
    });

    it("website 格式非法应被拒绝", async () => {
      const dto = makeDto({ website: "not-a-url" });
      await expect(service.create(dto)).rejects.toThrow();
    });

    it("24 小时内同一 contactMethod 提交超过 3 次应返回 429", async () => {
      const dto = makeDto();
      const entity = {
        ...dto,
        id: "uuid-1",
        status: "received",
      } as unknown as GeoLead;

      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);
      repo.count.mockResolvedValue(3);

      await expect(service.create(dto)).rejects.toMatchObject({ status: 429 });
    });

    it("contactMethod 频率在阈值内应正常创建", async () => {
      const dto = makeDto();
      const entity = {
        ...dto,
        id: "uuid-1",
        status: "received",
      } as unknown as GeoLead;

      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);
      repo.count.mockResolvedValue(2);

      const result = await service.create(dto);
      expect(result.id).toBe("uuid-1");
    });
  });

  describe("findAll", () => {
    it("应该返回分页列表", async () => {
      const leads = [makeGeoLead(), makeGeoLead({ id: "uuid-2" })];
      repo.findAndCount.mockResolvedValue([leads, 2]);

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it("应该支持 status 过滤", async () => {
      const leads = [makeGeoLead({ status: "contacted" })];
      repo.findAndCount.mockResolvedValue([leads, 1]);

      const result = await service.findAll({
        status: "contacted",
        page: 1,
        pageSize: 20,
      });

      expect(result.data[0].status).toBe("contacted");
    });
  });

  describe("findById", () => {
    it("应该返回单条 lead", async () => {
      const lead = makeGeoLead();
      repo.findOne.mockResolvedValue(lead);

      const result = await service.findById("uuid-1");
      expect(result.id).toBe("uuid-1");
    });

    it("不存在的 lead 应该抛出 NotFoundException", async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById("not-found")).rejects.toThrow();
    });
  });

  describe("updateStatus", () => {
    it("应该成功执行合法流转 received -> contacted", async () => {
      const lead = makeGeoLead({ status: "received" });
      repo.findOne.mockResolvedValue(lead);
      repo.save.mockResolvedValue({ ...lead, status: "contacted" });

      const result = await service.updateStatus("uuid-1", {
        status: "contacted",
        notes: "已联系客户",
      });

      expect(result.status).toBe("contacted");
    });

    it("应该拒绝非法流转 won -> contacted", async () => {
      const lead = makeGeoLead({ status: "won" });
      repo.findOne.mockResolvedValue(lead);

      await expect(
        service.updateStatus("uuid-1", { status: "contacted" }),
      ).rejects.toThrow();
    });

    it("应该拒绝非法流转 lost -> won", async () => {
      const lead = makeGeoLead({ status: "lost" });
      repo.findOne.mockResolvedValue(lead);

      await expect(
        service.updateStatus("uuid-1", { status: "won" }),
      ).rejects.toThrow();
    });

    it("应该拒绝非法流转 archived -> won", async () => {
      const lead = makeGeoLead({ status: "archived" });
      repo.findOne.mockResolvedValue(lead);

      await expect(
        service.updateStatus("uuid-1", { status: "won" }),
      ).rejects.toThrow();
    });

    it("received -> lost 应合法", async () => {
      const lead = makeGeoLead({ status: "received" });
      repo.findOne.mockResolvedValue(lead);
      repo.save.mockResolvedValue({ ...lead, status: "lost" });

      const result = await service.updateStatus("uuid-1", { status: "lost" });
      expect(result.status).toBe("lost");
    });

    it("任何状态 -> archived 应合法", async () => {
      const lead = makeGeoLead({ status: "qualified" });
      repo.findOne.mockResolvedValue(lead);
      repo.save.mockResolvedValue({ ...lead, status: "archived" });

      const result = await service.updateStatus("uuid-1", {
        status: "archived",
      });
      expect(result.status).toBe("archived");
    });

    it("contacted 时首次应设置 firstContactedAt", async () => {
      const lead = makeGeoLead({ status: "received", firstContactedAt: null });
      repo.findOne.mockResolvedValue(lead);
      repo.save.mockImplementation((l) => Promise.resolve(l as GeoLead));

      const result = await service.updateStatus("uuid-1", {
        status: "contacted",
      });
      expect(result.firstContactedAt).toBeTruthy();
    });
  });

  describe("validateTransition", () => {
    it("received -> contacted 合法", () => {
      expect(() =>
        service.validateTransition("received", "contacted"),
      ).not.toThrow();
    });

    it("won -> contacted 非法", () => {
      expect(() => service.validateTransition("won", "contacted")).toThrow();
    });

    it("lost -> won 非法", () => {
      expect(() => service.validateTransition("lost", "won")).toThrow();
    });

    it("archived -> won 非法", () => {
      expect(() => service.validateTransition("archived", "won")).toThrow();
    });
  });
});
