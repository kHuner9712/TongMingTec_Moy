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

describe("GeoLeadsService", () => {
  let service: GeoLeadsService;
  let repo: jest.Mocked<Pick<Repository<GeoLead>, "create" | "save" | "count">>;

  const mockReq = {
    ip: "192.168.1.1",
    headers: { "user-agent": "jest-test" },
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoLeadsService,
        { provide: getRepositoryToken(GeoLead), useValue: mockRepo },
        { provide: REQUEST, useValue: mockReq },
      ],
    }).compile();

    service = module.get<GeoLeadsService>(GeoLeadsService);
    repo = mockRepo as any;
  });

  it("应该正常创建 lead 并返回保存后的实体", async () => {
    const dto = makeDto();
    const entity = { ...dto, id: "uuid-1", status: "received" } as any;

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
    const entity = { ...dto, id: "uuid-1", status: "received" } as any;

    repo.create.mockReturnValue(entity);
    repo.save.mockResolvedValue(entity);
    repo.count.mockResolvedValue(3);

    await expect(service.create(dto)).rejects.toMatchObject({
      status: 429,
    });
  });

  it("contactMethod 频率在阈值内应正常创建", async () => {
    const dto = makeDto();
    const entity = { ...dto, id: "uuid-1", status: "received" } as any;

    repo.create.mockReturnValue(entity);
    repo.save.mockResolvedValue(entity);
    repo.count.mockResolvedValue(2);

    const result = await service.create(dto);

    expect(result.id).toBe("uuid-1");
  });
});
