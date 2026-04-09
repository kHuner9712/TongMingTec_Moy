import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { LmService } from "./lm.service";
import { Lead, LeadStatus } from "./entities/lead.entity";
import { LeadFollowUp, FollowType } from "./entities/lead-follow-up.entity";
import { Customer } from "../cm/entities/customer.entity";
import { Opportunity } from "../om/entities/opportunity.entity";
import { EventBusService } from "../../common/events/event-bus.service";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { DataSource } from "typeorm";

describe("LmService", () => {
  let service: LmService;
  let leadRepository: any;
  let followUpRepository: any;
  let customerRepository: any;
  let opportunityRepository: any;
  let dataSource: any;
  let eventBus: any;

  const mockLead = {
    id: "lead-1",
    orgId: "org-1",
    name: "张三",
    companyName: "测试公司",
    mobile: "13800138000",
    email: "zhangsan@test.com",
    ownerUserId: "user-1",
    status: LeadStatus.NEW,
    customerId: null,
    version: 1,
  };

  const createMockQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
    getManyAndCount: jest.fn().mockResolvedValue([[mockLead], 1]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    leadRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb()),
    };

    followUpRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    customerRepository = {};
    opportunityRepository = {};

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn().mockReturnValue({ id: "customer-new" }),
        save: jest.fn().mockResolvedValue({ id: "customer-new" }),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
      },
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LmService,
        { provide: getRepositoryToken(Lead), useValue: leadRepository },
        {
          provide: getRepositoryToken(LeadFollowUp),
          useValue: followUpRepository,
        },
        { provide: getRepositoryToken(Customer), useValue: customerRepository },
        {
          provide: getRepositoryToken(Opportunity),
          useValue: opportunityRepository,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<LmService>(LmService);
  });

  describe("findLeadById", () => {
    it("should return lead if found", async () => {
      leadRepository.findOne.mockResolvedValue(mockLead);
      const result = await service.findLeadById("lead-1", "org-1");
      expect(result.id).toBe("lead-1");
    });

    it("should throw NotFoundException if not found", async () => {
      leadRepository.findOne.mockResolvedValue(null);
      await expect(
        service.findLeadById("nonexistent", "org-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should query with orgId for multi-tenant isolation", async () => {
      leadRepository.findOne.mockResolvedValue(mockLead);
      await service.findLeadById("lead-1", "org-1");
      expect(leadRepository.findOne).toHaveBeenCalledWith({
        where: { id: "lead-1", orgId: "org-1" },
      });
    });
  });

  describe("createLead", () => {
    it("should create lead with new status and ownerUserId", async () => {
      leadRepository.create.mockReturnValue(mockLead);
      leadRepository.save.mockResolvedValue(mockLead);

      await service.createLead("org-1", { name: "张三" }, "user-1");

      expect(leadRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: "org-1",
          ownerUserId: "user-1",
          status: LeadStatus.NEW,
        }),
      );
    });
  });

  describe("assignLead", () => {
    it("should assign lead from new to assigned", async () => {
      leadRepository.findOne.mockResolvedValue(mockLead);
      const qb = createMockQb();
      leadRepository.createQueryBuilder.mockReturnValue(qb);
      leadRepository.findOne.mockResolvedValueOnce(mockLead);
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.ASSIGNED,
      });

      await service.assignLead("lead-1", "org-1", "user-2", "user-1", 1);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: expect.stringContaining("lead"),
        }),
      );
    });

    it("should throw ConflictException on version mismatch", async () => {
      leadRepository.findOne.mockResolvedValue({ ...mockLead, version: 2 });

      await expect(
        service.assignLead("lead-1", "org-1", "user-2", "user-1", 1),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw on illegal transition converted->assigned", async () => {
      leadRepository.findOne.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.CONVERTED,
      });

      await expect(
        service.assignLead("lead-1", "org-1", "user-2", "user-1", 1),
      ).rejects.toThrow();
    });
  });

  describe("addFollowUp", () => {
    it("should add follow up and transition to following", async () => {
      const assignedLead = { ...mockLead, status: LeadStatus.ASSIGNED };
      leadRepository.findOne.mockResolvedValue(assignedLead);
      followUpRepository.create.mockReturnValue({ id: "followup-1" });
      followUpRepository.save.mockResolvedValue({ id: "followup-1" });
      const qb = createMockQb();
      leadRepository.createQueryBuilder.mockReturnValue(qb);

      await service.addFollowUp(
        "lead-1",
        "org-1",
        "电话跟进",
        FollowType.CALL,
        null,
        "user-1",
        1,
      );

      expect(followUpRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });

  describe("convert", () => {
    it("should create customer and opportunity in transaction", async () => {
      const followingLead = { ...mockLead, status: LeadStatus.FOLLOWING };
      leadRepository.findOne.mockResolvedValue(followingLead);

      const queryRunner = dataSource.createQueryRunner();
      let saveCallCount = 0;
      queryRunner.manager.create.mockImplementation(
        (entity: any, data: any) => ({
          ...data,
          id: `new-id-${++saveCallCount}`,
        }),
      );
      queryRunner.manager.save.mockImplementation((entity: any, data: any) =>
        Promise.resolve({ ...data }),
      );

      await service.convert("lead-1", "org-1", "user-1", 1);

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it("should throw on illegal transition new->converted", async () => {
      leadRepository.findOne.mockResolvedValue(mockLead);

      await expect(
        service.convert("lead-1", "org-1", "user-1", 1),
      ).rejects.toThrow();
    });

    it("should rollback transaction on error", async () => {
      const followingLead = { ...mockLead, status: LeadStatus.FOLLOWING };
      leadRepository.findOne.mockResolvedValue(followingLead);

      const queryRunner = dataSource.createQueryRunner();
      queryRunner.manager.save.mockRejectedValue(new Error("DB error"));

      await expect(
        service.convert("lead-1", "org-1", "user-1", 1),
      ).rejects.toThrow("DB error");

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it("should throw ConflictException on version mismatch", async () => {
      leadRepository.findOne.mockResolvedValue({ ...mockLead, version: 2 });

      await expect(
        service.convert("lead-1", "org-1", "user-1", 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("markInvalid", () => {
    it("should mark lead as invalid from following status", async () => {
      const followingLead = { ...mockLead, status: LeadStatus.FOLLOWING };
      leadRepository.findOne.mockResolvedValue(followingLead);
      const qb = createMockQb();
      leadRepository.createQueryBuilder.mockReturnValue(qb);
      leadRepository.findOne.mockResolvedValueOnce(followingLead);
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.INVALID,
      });

      await service.markInvalid("lead-1", "org-1", "无效线索", "user-1", 1);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: expect.stringContaining("lead"),
        }),
      );
    });

    it("should allow assigned->invalid", async () => {
      const assignedLead = { ...mockLead, status: LeadStatus.ASSIGNED };
      leadRepository.findOne.mockResolvedValue(assignedLead);
      const qb = createMockQb();
      leadRepository.createQueryBuilder.mockReturnValue(qb);
      leadRepository.findOne.mockResolvedValueOnce(assignedLead);
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.INVALID,
      });

      await expect(
        service.markInvalid("lead-1", "org-1", "无效", "user-1", 1),
      ).resolves.toBeDefined();
    });

    it("should allow new->invalid", async () => {
      leadRepository.findOne.mockResolvedValue(mockLead);
      const qb = createMockQb();
      leadRepository.createQueryBuilder.mockReturnValue(qb);
      leadRepository.findOne.mockResolvedValueOnce(mockLead);
      leadRepository.findOne.mockResolvedValueOnce({
        ...mockLead,
        status: LeadStatus.INVALID,
      });

      await expect(
        service.markInvalid("lead-1", "org-1", "无效", "user-1", 1),
      ).resolves.toBeDefined();
    });
  });

  describe("findFollowUps", () => {
    it("should return follow ups for a lead", async () => {
      const mockFollowUps = [
        { id: "followup-1", leadId: "lead-1", content: "电话跟进" },
      ];
      followUpRepository.find.mockResolvedValue(mockFollowUps);

      const result = await service.findFollowUps("lead-1", "org-1");

      expect(followUpRepository.find).toHaveBeenCalledWith({
        where: { leadId: "lead-1", orgId: "org-1" },
        order: { createdAt: "DESC" },
      });
      expect(result).toHaveLength(1);
    });
  });
});
