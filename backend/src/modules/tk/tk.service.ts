import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ticket, TicketStatus, TicketPriority } from './entities/ticket.entity';
import { TicketLog } from './entities/ticket-log.entity';

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.PENDING]: [TicketStatus.ASSIGNED, TicketStatus.CLOSED],
  [TicketStatus.ASSIGNED]: [TicketStatus.IN_PROGRESS, TicketStatus.PENDING, TicketStatus.CLOSED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.ASSIGNED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
  [TicketStatus.CLOSED]: [],
};

@Injectable()
export class TkService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketLog)
    private logRepository: Repository<TicketLog>,
    private dataSource: DataSource,
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
      .createQueryBuilder('ticket')
      .where('ticket.orgId = :orgId', { orgId });

    if (dataScope === 'self') {
      qb.andWhere('ticket.assigneeUserId = :userId', { userId });
    }

    if (filters.status) {
      qb.andWhere('ticket.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      qb.andWhere('ticket.priority = :priority', {
        priority: filters.priority,
      });
    }

    qb.orderBy('ticket.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findTicketById(id: string, orgId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id, orgId },
    });

    if (!ticket) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    return ticket;
  }

  async createTicket(
    orgId: string,
    data: Partial<Ticket>,
    userId: string,
  ): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      ...data,
      orgId,
      status: TicketStatus.PENDING,
      priority: data.priority || TicketPriority.NORMAL,
    });

    const saved = await this.ticketRepository.save(ticket);

    const log = this.logRepository.create({
      ticketId: saved.id,
      orgId,
      action: 'created',
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
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (!VALID_TRANSITIONS[ticket.status].includes(TicketStatus.ASSIGNED) &&
        ticket.status !== TicketStatus.ASSIGNED) {
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
    }

    const fromStatus = ticket.status;
    const toStatus = TicketStatus.ASSIGNED;

    await this.ticketRepository.update(id, {
      assigneeUserId,
      status: toStatus,
      version: () => 'version + 1',
    });

    const log = this.logRepository.create({
      ticketId: id,
      orgId,
      action: 'assigned',
      fromStatus,
      toStatus,
      operatorUserId: userId,
      remark: `Assigned to user ${assigneeUserId}`,
      createdBy: userId,
    });

    await this.logRepository.save(log);

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
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (!VALID_TRANSITIONS[ticket.status].includes(TicketStatus.IN_PROGRESS)) {
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
    }

    const fromStatus = ticket.status;
    const toStatus = TicketStatus.IN_PROGRESS;
    const now = new Date();

    await this.ticketRepository.update(id, {
      status: toStatus,
      firstResponseAt: ticket.firstResponseAt || now,
      version: () => 'version + 1',
    });

    const log = this.logRepository.create({
      ticketId: id,
      orgId,
      action: 'started',
      fromStatus,
      toStatus,
      operatorUserId: userId,
      createdBy: userId,
    });

    await this.logRepository.save(log);

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
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (!VALID_TRANSITIONS[ticket.status].includes(TicketStatus.RESOLVED)) {
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
    }

    const fromStatus = ticket.status;
    const toStatus = TicketStatus.RESOLVED;
    const now = new Date();

    await this.ticketRepository.update(id, {
      status: toStatus,
      solution,
      resolvedAt: now,
      version: () => 'version + 1',
    });

    const log = this.logRepository.create({
      ticketId: id,
      orgId,
      action: 'resolved',
      fromStatus,
      toStatus,
      operatorUserId: userId,
      remark: solution,
      createdBy: userId,
    });

    await this.logRepository.save(log);

    return this.findTicketById(id, orgId);
  }

  async close(
    id: string,
    orgId: string,
    closeReason: string,
    userId: string,
    version: number,
  ): Promise<Ticket> {
    const ticket = await this.findTicketById(id, orgId);

    if (ticket.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (!VALID_TRANSITIONS[ticket.status].includes(TicketStatus.CLOSED)) {
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
    }

    const fromStatus = ticket.status;
    const toStatus = TicketStatus.CLOSED;
    const now = new Date();

    await this.ticketRepository.update(id, {
      status: toStatus,
      closeReason,
      closedAt: now,
      version: () => 'version + 1',
    });

    const log = this.logRepository.create({
      ticketId: id,
      orgId,
      action: 'closed',
      fromStatus,
      toStatus,
      operatorUserId: userId,
      remark: closeReason,
      createdBy: userId,
    });

    await this.logRepository.save(log);

    return this.findTicketById(id, orgId);
  }

  async findLogs(id: string, orgId: string): Promise<TicketLog[]> {
    return this.logRepository.find({
      where: { ticketId: id, orgId },
      order: { createdAt: 'ASC' },
    });
  }
}
