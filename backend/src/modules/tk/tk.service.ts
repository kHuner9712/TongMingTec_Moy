import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Ticket, TicketStatus, TicketPriority } from "./entities/ticket.entity";
import { TicketLog } from "./entities/ticket-log.entity";
import { ticketStateMachine } from "../../common/statemachine/definitions/ticket.sm";
import { EventBusService } from "../../common/events/event-bus.service";
import { ticketStatusChanged } from "../../common/events/ticket-events";

@Injectable()
export class TkService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketLog)
    private logRepository: Repository<TicketLog>,
    private dataSource: DataSource,
    private readonly eventBus: EventBusService,
  ) {}

  async findTickets(
    orgId: string,
    userId: string,
    dataScope: string,
    filters: { status?: string; priority?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Ticket[]; total: number }> {
    const qb = this.ticketRepository
      .createQueryBuilder("ticket")
      .where("ticket.orgId = :orgId", { orgId });

    if (dataScope === "self") {
      qb.andWhere("ticket.assigneeUserId = :userId", { userId });
    }

    if (filters.status) {
      qb.andWhere("ticket.status = :status", { status: filters.status });
    }

    if (filters.priority) {
      qb.andWhere("ticket.priority = :priority", {
        priority: filters.priority,
      });
    }

    qb.orderBy("ticket.updatedAt", "DESC");
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findTicketById(id: string, orgId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id, orgId },
    });

    if (!ticket) {
      throw new NotFoundException("RESOURCE_NOT_FOUND");
    }

    return ticket;
  }

  async createTicket(
    orgId: string,
    data: Partial<Ticket>,
    userId: string,
  ): Promise<Ticket> {
    const ticketNo = `TK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const ticket = this.ticketRepository.create({
      ...data,
      orgId,
      ticketNo,
      status: TicketStatus.PENDING,
      priority: data.priority || TicketPriority.NORMAL,
      createdBy: userId,
    });

    const saved = await this.ticketRepository.save(ticket);

    const log = this.logRepository.create({
      ticketId: saved.id,
      orgId,
      action: "created",
      toStatus: TicketStatus.PENDING,
      operatorUserId: userId,
      createdBy: userId,
    });

    await this.logRepository.save(log);

    return saved;
  }

  async assign(
    id: string,
    orgId: string,
    assigneeUserId: string,
    userId: string,
    version: number,
  ): Promise<Ticket> {
    const ticket = await this.findTicketById(id, orgId);

    if (ticket.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = ticket.status;
    const toStatus = TicketStatus.ASSIGNED;

    ticketStateMachine.validateTransition(fromStatus, toStatus);

    const result = await this.ticketRepository
      .createQueryBuilder()
      .update(Ticket)
      .set({
        assigneeUserId,
        status: toStatus,
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const log = this.logRepository.create({
      ticketId: id,
      orgId,
      action: "assigned",
      fromStatus,
      toStatus,
      operatorUserId: userId,
      remark: `Assigned to user ${assigneeUserId}`,
      createdBy: userId,
    });

    await this.logRepository.save(log);

    this.eventBus.publish(
      ticketStatusChanged({
        orgId,
        ticketId: id,
        fromStatus,
        toStatus,
        actorType: "user",
        actorId: userId,
      }),
    );

    return this.findTicketById(id, orgId);
  }

  async start(
    id: string,
    orgId: string,
    userId: string,
    version: number,
  ): Promise<Ticket> {
    const ticket = await this.findTicketById(id, orgId);

    if (ticket.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = ticket.status;
    const toStatus = TicketStatus.PROCESSING;
    ticketStateMachine.validateTransition(fromStatus, toStatus);

    const now = new Date();

    const result = await this.ticketRepository
      .createQueryBuilder()
      .update(Ticket)
      .set({
        status: toStatus,
        firstResponseAt: ticket.firstResponseAt || now,
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const log = this.logRepository.create({
      ticketId: id,
      orgId,
      action: "started",
      fromStatus,
      toStatus,
      operatorUserId: userId,
      createdBy: userId,
    });

    await this.logRepository.save(log);

    this.eventBus.publish(
      ticketStatusChanged({
        orgId,
        ticketId: id,
        fromStatus,
        toStatus,
        actorType: "user",
        actorId: userId,
      }),
    );

    return this.findTicketById(id, orgId);
  }

  async resolve(
    id: string,
    orgId: string,
    solution: string,
    userId: string,
    version: number,
  ): Promise<Ticket> {
    const ticket = await this.findTicketById(id, orgId);

    if (ticket.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = ticket.status;
    const toStatus = TicketStatus.RESOLVED;
    ticketStateMachine.validateTransition(fromStatus, toStatus);

    const now = new Date();

    const result = await this.ticketRepository
      .createQueryBuilder()
      .update(Ticket)
      .set({
        status: toStatus,
        solution,
        resolvedAt: now,
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const log = this.logRepository.create({
      ticketId: id,
      orgId,
      action: "resolved",
      fromStatus,
      toStatus,
      operatorUserId: userId,
      remark: solution,
      createdBy: userId,
    });

    await this.logRepository.save(log);

    this.eventBus.publish(
      ticketStatusChanged({
        orgId,
        ticketId: id,
        fromStatus,
        toStatus,
        actorType: "user",
        actorId: userId,
      }),
    );

    return this.findTicketById(id, orgId);
  }

  async close(
    id: string,
    orgId: string,
    closedReason: string,
    userId: string,
    version: number,
  ): Promise<Ticket> {
    const ticket = await this.findTicketById(id, orgId);

    if (ticket.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = ticket.status;
    const toStatus = TicketStatus.CLOSED;
    ticketStateMachine.validateTransition(fromStatus, toStatus);

    const now = new Date();

    const result = await this.ticketRepository
      .createQueryBuilder()
      .update(Ticket)
      .set({
        status: toStatus,
        closedReason,
        closedAt: now,
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const log = this.logRepository.create({
      ticketId: id,
      orgId,
      action: "closed",
      fromStatus,
      toStatus,
      operatorUserId: userId,
      remark: closedReason,
      createdBy: userId,
    });

    await this.logRepository.save(log);

    this.eventBus.publish(
      ticketStatusChanged({
        orgId,
        ticketId: id,
        fromStatus,
        toStatus,
        reason: closedReason,
        actorType: "user",
        actorId: userId,
      }),
    );

    return this.findTicketById(id, orgId);
  }

  async reopen(
    id: string,
    orgId: string,
    reason: string,
    userId: string,
    version: number,
  ): Promise<Ticket> {
    const ticket = await this.findTicketById(id, orgId);

    if (ticket.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = ticket.status;
    const toStatus = TicketStatus.PROCESSING;
    ticketStateMachine.validateTransition(fromStatus, toStatus);

    const result = await this.ticketRepository
      .createQueryBuilder()
      .update(Ticket)
      .set({
        status: toStatus,
        resolvedAt: null,
        closedAt: null,
        closedReason: null,
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const log = this.logRepository.create({
      ticketId: id,
      orgId,
      action: "reopened",
      fromStatus,
      toStatus,
      operatorUserId: userId,
      remark: reason || null,
      createdBy: userId,
    });

    await this.logRepository.save(log);

    this.eventBus.publish(
      ticketStatusChanged({
        orgId,
        ticketId: id,
        fromStatus,
        toStatus,
        reason: reason || undefined,
        actorType: "user",
        actorId: userId,
      }),
    );

    return this.findTicketById(id, orgId);
  }

  async findLogs(id: string, orgId: string): Promise<TicketLog[]> {
    return this.logRepository.find({
      where: { ticketId: id, orgId },
      order: { createdAt: "ASC" },
    });
  }
}
